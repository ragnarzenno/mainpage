#!/usr/bin/env bash
#
# Накатывание конфигурации на разнородный парк VPS (разные хостеры, разные
# префиксы) по SSH. Нужен там, где API нет — то есть у большинства лоуэндов.
#
# Инвентарь — TSV-файл, по строке на узел:
#   host  ssh_port  ipv6_prefix           mode    ports
#   1.2.3.4  22     2a0e:1:2::/48         anyip   5000
#   5.6.7.8  2222   2a01:aaa:bbb::/64     ndppd   200
#
# Использование:
#   ./provision-fleet.sh inventory.tsv [--parallel 10] [--user proxyuser] [--password pass]
#
# Идемпотентно: повторный запуск просто перегенерирует конфиги.
set -euo pipefail

INV="${1:?нужен файл инвентаря}"; shift || true
PARALLEL=10
PROXY_USER="fleet"
PROXY_PASS="$(head -c12 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c16)"
SSH_USER="root"
OUT="./proxy-list.txt"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --parallel) PARALLEL="$2"; shift 2 ;;
    --user)     PROXY_USER="$2"; shift 2 ;;
    --password) PROXY_PASS="$2"; shift 2 ;;
    --ssh-user) SSH_USER="$2"; shift 2 ;;
    --out)      OUT="$2"; shift 2 ;;
    *) echo "неизвестный аргумент: $1" >&2; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15
          -o ServerAliveInterval=15 -o BatchMode=yes)
LOGDIR="./logs"; mkdir -p "$LOGDIR"

provision_one() {
  local host="$1" port="$2" prefix="$3" mode="$4" ports="$5"
  local log="$LOGDIR/${host}.log"
  {
    echo "=== $host ($prefix, $mode, $ports портов) $(date -u +%FT%TZ)"
    scp "${SSH_OPTS[@]}" -P "$port" \
        "$SCRIPT_DIR/setup-ipv6-proxy.sh" "$SCRIPT_DIR/gen-proxy-config.py" \
        "$SSH_USER@$host:/root/" || return 1
    # --seed из хоста: адреса детерминированы и НЕ меняются при перезапуске
    # скрипта — то есть выданные клиенту прокси остаются постоянными.
    local seed; seed=$(printf '%d' "0x$(printf '%s' "$host" | md5sum | cut -c1-8)")
    ssh "${SSH_OPTS[@]}" -p "$port" "$SSH_USER@$host" \
      "chmod +x /root/setup-ipv6-proxy.sh /root/gen-proxy-config.py && \
       /root/setup-ipv6-proxy.sh --prefix '$prefix' --count '$ports' \
         --mode '$mode' --user '$PROXY_USER' --password '$PROXY_PASS' --seed $seed" || return 1
    echo "=== OK $host"
  } >>"$log" 2>&1
}

export -f provision_one
export SSH_USER PROXY_USER PROXY_PASS SCRIPT_DIR LOGDIR
export SSH_OPTS_STR="${SSH_OPTS[*]}"

echo "==> провижининг, параллельность $PARALLEL"
ok=0; fail=0
pids=()
while IFS=$'\t ' read -r host port prefix mode ports _; do
  [[ -z "${host:-}" || "$host" == \#* ]] && continue
  provision_one "$host" "${port:-22}" "$prefix" "${mode:-anyip}" "${ports:-1000}" &
  pids+=($!)
  while [[ $(jobs -rp | wc -l) -ge $PARALLEL ]]; do wait -n; done
done < "$INV"
for p in "${pids[@]}"; do
  if wait "$p"; then ok=$((ok+1)); else fail=$((fail+1)); fi
done

echo "==> готово: успешно $ok, с ошибками $fail (детали в $LOGDIR/)"

echo "==> сборка общего списка прокси"
: > "$OUT"
while IFS=$'\t ' read -r host port prefix mode ports _; do
  [[ -z "${host:-}" || "$host" == \#* ]] && continue
  ssh "${SSH_OPTS[@]}" -p "${port:-22}" "$SSH_USER@$host" \
      'cat /root/proxy-list.txt 2>/dev/null' 2>/dev/null \
    | sed "s/^[^:]*:/$host:/" >> "$OUT" || echo "!! не забрал список с $host" >&2
done < "$INV"
echo "==> $(wc -l < "$OUT") прокси в $OUT (логин $PROXY_USER / пароль $PROXY_PASS)"

echo "==> health-check исходящих адресов (по одному порту с узла)"
while IFS=$'\t ' read -r host port prefix mode ports _; do
  [[ -z "${host:-}" || "$host" == \#* ]] && continue
  res=$(curl -s --max-time 12 -x "http://$PROXY_USER:$PROXY_PASS@$host:30000" \
        https://ifconfig.co 2>/dev/null || true)
  printf '%-18s %s\n' "$host" "${res:-НЕ ОТВЕЧАЕТ}"
done < "$INV"
