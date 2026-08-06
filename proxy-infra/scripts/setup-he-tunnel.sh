#!/usr/bin/env bash
#
# Поднятие бесплатного 6in4-туннеля Hurricane Electric с routed /48.
# Превращает любой IPv4-VPS (даже за $1/мес) в носитель 65536 уникальных /64.
#
# Данные берутся со страницы туннеля на tunnelbroker.net (вкладка "Tunnel Details"):
#   --server   Server IPv4 Address        (адрес HE)
#   --client   Client IPv4 Address        (ваш внешний IPv4)
#   --local6   Client IPv6 Address        (ваш конец /64-линка, обычно ...::2/64)
#   --routed48 Routed IPv6 Prefixes (/48) (маршрутизируемый на вас блок)
#
# Пример:
#   ./setup-he-tunnel.sh --server 216.66.80.30 --client 1.2.3.4 \
#       --local6 2001:470:1f0a:abc::2/64 --routed48 2001:470:8xxx::/48
#
# Ограничения HE: 5 туннелей на аккаунт, BGP по туннелю отключён с 2020 г.,
# префиксы 2001:470::/32 известны и есть в части блоклистов.
set -euo pipefail

SERVER="" CLIENT="" LOCAL6="" ROUTED48="" NAME="he-ipv6"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --server)   SERVER="$2"; shift 2 ;;
    --client)   CLIENT="$2"; shift 2 ;;
    --local6)   LOCAL6="$2"; shift 2 ;;
    --routed48) ROUTED48="$2"; shift 2 ;;
    --name)     NAME="$2"; shift 2 ;;
    *) echo "неизвестный аргумент: $1" >&2; exit 1 ;;
  esac
done
for v in SERVER CLIENT LOCAL6 ROUTED48; do
  [[ -z "${!v}" ]] && { echo "нужен --${v,,}" >&2; exit 1; }
done
[[ $EUID -ne 0 ]] && { echo "запускать от root" >&2; exit 1; }

modprobe sit || true

cat >/usr/local/sbin/${NAME}-up.sh <<EOF
#!/bin/sh
ip tunnel del ${NAME} 2>/dev/null
ip tunnel add ${NAME} mode sit remote ${SERVER} local ${CLIENT} ttl 255
ip link set ${NAME} up mtu 1480
ip addr add ${LOCAL6} dev ${NAME}
ip -6 route replace ::/0 dev ${NAME}

# routed /48 вешается на loopback через AnyIP: сервер отвечает на все
# 2^80 адресов внутри блока без единой записи в таблице адресов
ip -6 route replace local ${ROUTED48} dev lo

# 6in4 съедает 20 байт — без clamping рвутся HTTPS-сессии к части сайтов
ip6tables -t mangle -C FORWARD -p tcp --tcp-flags SYN,RST SYN \
  -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || \
ip6tables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \
  -j TCPMSS --clamp-mss-to-pmtu
EOF
chmod +x /usr/local/sbin/${NAME}-up.sh

cat >/etc/systemd/system/${NAME}.service <<EOF
[Unit]
Description=Hurricane Electric 6in4 tunnel (${NAME})
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/sbin/${NAME}-up.sh
ExecStop=/sbin/ip tunnel del ${NAME}

[Install]
WantedBy=multi-user.target
EOF

sysctl -qw net.ipv6.ip_nonlocal_bind=1
sysctl -qw net.ipv6.conf.all.forwarding=1
grep -q ip_nonlocal_bind /etc/sysctl.d/99-he-tunnel.conf 2>/dev/null || cat >/etc/sysctl.d/99-he-tunnel.conf <<'EOF'
net.ipv6.ip_nonlocal_bind = 1
net.ipv6.conf.all.forwarding = 1
EOF

systemctl daemon-reload
systemctl enable --now ${NAME}.service

echo "==> проверка"
if curl -6 -s --max-time 15 https://ifconfig.co >/dev/null; then
  echo "    туннель поднят, исход: $(curl -6 -s --max-time 15 https://ifconfig.co)"
  echo "    дальше: ./setup-ipv6-proxy.sh --prefix ${ROUTED48} --count 5000"
else
  echo "    нет IPv6-связности. Проверьте: protocol 41 не режется файрволом хостера,"
  echo "    Client IPv4 в панели HE совпадает с реальным внешним адресом,"
  echo "    у VPS не NAT (6in4 через NAT работает только с DMZ/port-forward proto 41)."
fi
