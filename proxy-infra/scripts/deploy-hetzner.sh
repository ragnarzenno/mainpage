#!/usr/bin/env bash
#
# Массовый разворот прокси-узлов в Hetzner Cloud через API (почасовая оплата).
#
# Почему Hetzner: 20 ТБ трафика включено в каждый инстанс (далее €1/ТБ),
# отдельная /64 на сервер бесплатно, тарификация почасовая с потолком по месяцу.
# ВАЖНО: счётчик идёт, пока сервер СУЩЕСТВУЕТ (даже выключенный), поэтому
# экономия достигается только циклом create -> работа -> destroy.
#
#   export HCLOUD_TOKEN=xxxxx
#   ./deploy-hetzner.sh up 20              # поднять 20 узлов
#   ./deploy-hetzner.sh list               # показать ферму и собрать proxy-list
#   ./deploy-hetzner.sh down               # снести всё (прекращает тарификацию)
#   ./deploy-hetzner.sh rotate 20          # снести и поднять заново = новые /64
set -euo pipefail

API="https://api.hetzner.cloud/v1"
TOKEN="${HCLOUD_TOKEN:?нужен HCLOUD_TOKEN}"
LABEL="role=proxyfleet"
TYPE="${SERVER_TYPE:-cx22}"            # cx22 ~ €3.79/мес ~ €0.0052/час
IMAGE="${IMAGE:-debian-12}"
LOCATIONS="${LOCATIONS:-fsn1 nbg1 hel1 ash hil}"   # разные локации = разные пулы /64
SSH_KEY_NAME="${SSH_KEY_NAME:-}"
PROXY_USER="${PROXY_USER:-fleet}"
PROXY_PASS="${PROXY_PASS:-$(head -c12 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c16)}"
PORTS="${PORTS:-2000}"                 # портов (=/64-адресов) на узел
OUT="${OUT:-./proxy-list.txt}"

api() {
  local method="$1" path="$2" body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -sS -X "$method" -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" -d "$body" "$API$path"
  else
    curl -sS -X "$method" -H "Authorization: Bearer $TOKEN" "$API$path"
  fi
}

# cloud-init: узел настраивает себя сам при первой загрузке.
# Hetzner выдаёт /64 on-link -> AnyIP + proxy_ndp, ndppd не нужен,
# т.к. Hetzner Cloud маршрутизирует всю /64 на сервер.
build_userdata() {
  cat <<EOF
#cloud-config
package_update: true
packages: [git, build-essential, python3, curl]
write_files:
  - path: /etc/sysctl.d/99-proxy.conf
    content: |
      net.ipv6.ip_nonlocal_bind = 1
      net.ipv6.conf.all.forwarding = 1
      net.ipv6.conf.all.proxy_ndp = 1
      net.ipv6.neigh.default.gc_thresh3 = 32768
      net.ipv4.ip_local_port_range = 10240 65000
      net.core.somaxconn = 65535
      fs.file-max = 2097152
runcmd:
  - sysctl -p /etc/sysctl.d/99-proxy.conf
  - |
    IFACE=\$(ip -6 route show default | awk '{for(i=1;i<=NF;i++) if(\$i=="dev") print \$(i+1); exit}')
    PREFIX=\$(ip -6 addr show dev \$IFACE scope global | awk '/inet6/{print \$2; exit}' | cut -d/ -f1 | sed 's/::1$/::/')/64
    echo "\$PREFIX" > /root/prefix.txt
    ip -6 route replace local \$PREFIX dev lo
  - git clone --depth 1 https://github.com/3proxy/3proxy.git /opt/3proxy
  - make -C /opt/3proxy -f Makefile.Linux
  - install -m755 /opt/3proxy/bin/3proxy /usr/local/bin/3proxy
  - mkdir -p /etc/3proxy /var/log/3proxy
  - curl -fsSL ${GEN_URL:-https://raw.githubusercontent.com/ragnarzenno/mainpage/claude/large-scale-proxy-setup-a88mtu/proxy-infra/scripts/gen-proxy-config.py} -o /usr/local/bin/gen-proxy-config.py
  - chmod +x /usr/local/bin/gen-proxy-config.py
  - python3 /usr/local/bin/gen-proxy-config.py --prefix \$(cat /root/prefix.txt) --count ${PORTS} --port-start 30000 --user ${PROXY_USER} --password ${PROXY_PASS} --mode 3proxy > /etc/3proxy/3proxy.cfg
  - |
    cat >/etc/systemd/system/3proxy.service <<'UNIT'
    [Unit]
    Description=3proxy
    After=network-online.target
    [Service]
    ExecStart=/usr/local/bin/3proxy /etc/3proxy/3proxy.cfg
    Restart=always
    LimitNOFILE=1048576
    [Install]
    WantedBy=multi-user.target
    UNIT
  - systemctl daemon-reload && systemctl enable --now 3proxy
EOF
}

cmd_up() {
  local n="${1:-5}"
  local ssh_ids="[]"
  if [[ -n "$SSH_KEY_NAME" ]]; then
    ssh_ids="[$(api GET "/ssh_keys?name=$SSH_KEY_NAME" | jq '.ssh_keys[0].id')]"
  fi
  local ud; ud="$(build_userdata | jq -Rs .)"
  local locs=($LOCATIONS)
  for i in $(seq 1 "$n"); do
    local loc="${locs[$(( (i-1) % ${#locs[@]} ))]}"
    local name="pfleet-$(date +%s)-$i"
    local body
    body=$(jq -nc --arg name "$name" --arg type "$TYPE" --arg image "$IMAGE" \
      --arg loc "$loc" --argjson ssh "$ssh_ids" --argjson ud "$ud" '{
        name: $name, server_type: $type, image: $image, location: $loc,
        ssh_keys: $ssh, user_data: $ud, start_after_create: true,
        public_net: {enable_ipv4: true, enable_ipv6: true},
        labels: {role: "proxyfleet"}
      }')
    local resp; resp="$(api POST "/servers" "$body")"
    local err; err="$(jq -r '.error.message // empty' <<<"$resp")"
    if [[ -n "$err" ]]; then
      echo "!! $name ($loc): $err" >&2
    else
      echo "++ $name $loc ipv4=$(jq -r '.server.public_net.ipv4.ip' <<<"$resp") ipv6=$(jq -r '.server.public_net.ipv6.ip' <<<"$resp")"
    fi
  done
  echo
  echo "Пароль прокси: $PROXY_PASS   (сохраните — генерируется один раз)"
  echo "Подождите ~3 минуты на cloud-init, затем: $0 list"
}

cmd_list() {
  local servers; servers="$(api GET "/servers?label_selector=$LABEL&per_page=100")"
  jq -r '.servers[] | "\(.name)\t\(.datacenter.location.name)\t\(.public_net.ipv4.ip)\t\(.public_net.ipv6.ip)\t\(.status)"' <<<"$servers"
  local total; total="$(jq '.servers | length' <<<"$servers")"
  echo "---- узлов: $total, портов на узел: $PORTS, итого прокси: $((total * PORTS))"
  : > "$OUT"
  while IFS= read -r ip; do
    for p in $(seq 30000 $((30000 + PORTS - 1))); do
      echo "$ip:$p:$PROXY_USER:$PROXY_PASS" >> "$OUT"
    done
  done < <(jq -r '.servers[].public_net.ipv4.ip' <<<"$servers")
  echo "---- список записан в $OUT"
}

cmd_down() {
  local ids; ids="$(api GET "/servers?label_selector=$LABEL&per_page=100" | jq -r '.servers[].id')"
  [[ -z "$ids" ]] && { echo "нечего удалять"; return; }
  for id in $ids; do
    api DELETE "/servers/$id" >/dev/null && echo "-- удалён $id"
  done
  echo "тарификация остановлена"
}

cmd_rotate() { cmd_down; sleep 5; cmd_up "${1:-5}"; }

case "${1:-}" in
  up)     shift; cmd_up "$@" ;;
  list)   cmd_list ;;
  down)   cmd_down ;;
  rotate) shift; cmd_rotate "$@" ;;
  *) echo "использование: $0 {up N|list|down|rotate N}" >&2; exit 1 ;;
esac
