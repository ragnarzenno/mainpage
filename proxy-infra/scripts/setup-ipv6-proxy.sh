#!/usr/bin/env bash
#
# Разворачивание IPv6-прокси-узла на Debian/Ubuntu.
#
# Использует AnyIP (ip -6 route add local <prefix> dev lo) вместо добавления
# адресов по одному — это позволяет держать десятки тысяч уникальных исходящих
# адресов без раздувания таблицы соседей и без ndppd (для routed-префиксов).
#
# Использование:
#   ./setup-ipv6-proxy.sh --prefix 2a0e:1234:5678::/48 --count 5000 \
#       --user myuser --password mypass [--mode anyip|ndppd] [--engine 3proxy|xray]
#
# После установки список прокси лежит в /root/proxy-list.txt
set -euo pipefail

PREFIX=""
COUNT=5000
PORT_START=30000
USER_NAME="proxy$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' \n')"
PASSWORD="$(head -c12 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c16)"
MODE="anyip"          # anyip (routed-префикс) | ndppd (on-link префикс)
ENGINE="3proxy"       # 3proxy (порт=адрес) | xray (один порт, ротация на коннект)
IFACE=""
SEED=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix)     PREFIX="$2"; shift 2 ;;
    --count)      COUNT="$2"; shift 2 ;;
    --port-start) PORT_START="$2"; shift 2 ;;
    --user)       USER_NAME="$2"; shift 2 ;;
    --password)   PASSWORD="$2"; shift 2 ;;
    --mode)       MODE="$2"; shift 2 ;;
    --engine)     ENGINE="$2"; shift 2 ;;
    --iface)      IFACE="$2"; shift 2 ;;
    --seed)       SEED="$2"; shift 2 ;;
    *) echo "неизвестный аргумент: $1" >&2; exit 1 ;;
  esac
done

[[ -z "$PREFIX" ]] && { echo "нужен --prefix, например --prefix 2a0e:1:2::/48" >&2; exit 1; }
[[ $EUID -ne 0 ]] && { echo "запускать от root" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -z "$IFACE" ]] && IFACE="$(ip -6 route show default | awk '/dev/ {for(i=1;i<=NF;i++) if($i=="dev") print $(i+1); exit}')"
[[ -z "$IFACE" ]] && IFACE="$(ip -4 route show default | awk '/dev/ {for(i=1;i<=NF;i++) if($i=="dev") print $(i+1); exit}')"
EXT_IP4="$(ip -4 -o addr show "$IFACE" scope global | awk '{print $4}' | cut -d/ -f1 | head -1)"

echo "==> интерфейс: $IFACE, внешний IPv4: ${EXT_IP4:-нет}, префикс: $PREFIX, режим: $MODE/$ENGINE"

# ---------------------------------------------------------------- пакеты ----
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl wget git build-essential python3 iproute2 jq \
  ca-certificates ethtool >/dev/null

# ------------------------------------------------------- тюнинг ядра --------
cat >/etc/sysctl.d/99-ipv6-proxy.conf <<EOF
# --- AnyIP / нелокальный bind: без этого прокси не сможет биндить адреса,
#     которых физически нет на интерфейсе
net.ipv6.ip_nonlocal_bind = 1
net.ipv4.ip_nonlocal_bind = 1
net.ipv6.conf.all.forwarding = 1
net.ipv6.conf.${IFACE}.proxy_ndp = 1
net.ipv6.conf.all.proxy_ndp = 1

# --- не даём ядру самому раздавать адреса из префикса
net.ipv6.conf.${IFACE}.accept_ra = 2
net.ipv6.conf.all.accept_dad = 0
net.ipv6.conf.${IFACE}.accept_dad = 0

# --- таблица соседей: даже с AnyIP запас нужен, иначе "neighbour table overflow"
net.ipv6.neigh.default.gc_thresh1 = 4096
net.ipv6.neigh.default.gc_thresh2 = 16384
net.ipv6.neigh.default.gc_thresh3 = 32768
net.ipv4.neigh.default.gc_thresh1 = 4096
net.ipv4.neigh.default.gc_thresh2 = 16384
net.ipv4.neigh.default.gc_thresh3 = 32768
net.ipv6.route.max_size = 2097152

# --- сокеты под десятки тысяч сессий
net.ipv4.ip_local_port_range = 10240 65000
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.netdev_max_backlog = 65535
fs.file-max = 2097152
EOF
sysctl -p /etc/sysctl.d/99-ipv6-proxy.conf >/dev/null

cat >/etc/security/limits.d/99-proxy.conf <<'EOF'
* soft nofile 1048576
* hard nofile 1048576
root soft nofile 1048576
root hard nofile 1048576
EOF

# --------------------------------------------- привязка префикса к узлу -----
# AnyIP: одна строка вместо N команд `ip -6 addr add`.
# Ядро начинает принимать трафик на ВСЕ адреса внутри префикса, при этом
# таблица адресов остаётся пустой, старт мгновенный, RAM не растёт.
cat >/usr/local/sbin/ipv6-anyip.sh <<EOF
#!/bin/sh
ip -6 route replace local ${PREFIX} dev lo
EOF
chmod +x /usr/local/sbin/ipv6-anyip.sh

cat >/etc/systemd/system/ipv6-anyip.service <<'EOF'
[Unit]
Description=AnyIP: bind whole IPv6 prefix to loopback
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/sbin/ipv6-anyip.sh

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now ipv6-anyip.service

if [[ "$MODE" == "ndppd" ]]; then
  # on-link префикс (типично для Hetzner Cloud /64): апстрим шлёт NDP-запросы
  # и ждёт ответа. AnyIP-маршрута мало — нужен ответчик.
  apt-get install -y -qq ndppd >/dev/null
  cat >/etc/ndppd.conf <<EOF
route-ttl 30000
proxy ${IFACE} {
   router yes
   timeout 500
   ttl 30000
   rule ${PREFIX} {
      static
   }
}
EOF
  systemctl enable --now ndppd
  systemctl restart ndppd
fi

# ------------------------------------------------------------- движок -------
mkdir -p /etc/proxyfleet

if [[ "$ENGINE" == "3proxy" ]]; then
  if ! command -v 3proxy >/dev/null 2>&1; then
    echo "==> сборка 3proxy"
    tmp=$(mktemp -d)
    git clone --depth 1 -q https://github.com/3proxy/3proxy.git "$tmp/3proxy"
    make -s -C "$tmp/3proxy" -f Makefile.Linux >/dev/null
    install -m755 "$tmp/3proxy/bin/3proxy" /usr/local/bin/3proxy
    rm -rf "$tmp"
  fi
  mkdir -p /etc/3proxy /var/log/3proxy

  SEED_ARG=()
  [[ -n "$SEED" ]] && SEED_ARG=(--seed "$SEED")
  python3 "$SCRIPT_DIR/gen-proxy-config.py" \
    --prefix "$PREFIX" --count "$COUNT" --port-start "$PORT_START" \
    --user "$USER_NAME" --password "$PASSWORD" --mode 3proxy \
    "${SEED_ARG[@]}" > /etc/3proxy/3proxy.cfg

  cat >/etc/systemd/system/3proxy.service <<'EOF'
[Unit]
Description=3proxy IPv6 fleet
After=network-online.target ipv6-anyip.service
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/3proxy /etc/3proxy/3proxy.cfg
ExecReload=/bin/kill -SIGUSR1 $MAINPID
Restart=always
RestartSec=3
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now 3proxy
  systemctl restart 3proxy

  python3 "$SCRIPT_DIR/gen-proxy-config.py" \
    --prefix "$PREFIX" --count "$COUNT" --port-start "$PORT_START" \
    --user "$USER_NAME" --password "$PASSWORD" --mode list \
    --host "${EXT_IP4:-CHANGE_ME}" "${SEED_ARG[@]}" > /root/proxy-list.txt

elif [[ "$ENGINE" == "xray" ]]; then
  # Один порт — случайный исходящий адрес из префикса на КАЖДОЕ соединение.
  # Экономит порты и память: 1 сервис вместо N тысяч слушателей.
  if ! command -v xray >/dev/null 2>&1; then
    bash -c "$(curl -fsSL https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" \
      @ install >/dev/null
  fi
  python3 "$SCRIPT_DIR/gen-proxy-config.py" \
    --prefix "$PREFIX" --port-start "$PORT_START" \
    --user "$USER_NAME" --password "$PASSWORD" --mode xray > /usr/local/etc/xray/config.json
  systemctl enable --now xray
  systemctl restart xray
  echo "${EXT_IP4:-CHANGE_ME}:${PORT_START}:${USER_NAME}:${PASSWORD}" > /root/proxy-list.txt
else
  echo "неизвестный --engine: $ENGINE" >&2; exit 1
fi

# ------------------------------------------------------------ проверка ------
echo "==> проверка исходящего адреса"
TEST_ADDR="$(python3 "$SCRIPT_DIR/gen-proxy-config.py" --prefix "$PREFIX" --count 1 --mode addrs)"
OUT="$(curl -s --max-time 15 --interface "$TEST_ADDR" -6 https://ifconfig.co 2>/dev/null || true)"
if [[ -n "$OUT" ]]; then
  echo "    OK: исход через $OUT"
else
  echo "    ВНИМАНИЕ: исходящий IPv6 не проверился."
  echo "    Проверьте: (1) префикс реально маршрутизирован на этот сервер;"
  echo "               (2) для on-link префикса нужен --mode ndppd;"
  echo "               (3) хостер не фильтрует source-адреса (uRPF)."
fi

cat <<EOF

=========================================================
 Готово.
 Движок:     $ENGINE
 Префикс:    $PREFIX  (режим $MODE)
 Портов:     $COUNT, начиная с $PORT_START
 Логин:      $USER_NAME
 Пароль:     $PASSWORD
 Список:     /root/proxy-list.txt
=========================================================
EOF
