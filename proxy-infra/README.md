# proxy-infra

Исследование и инструментарий для разворачивания IPv6-прокси в больших масштабах
при минимальной цене и без оплаты за трафик.

- **[RESEARCH.md](RESEARCH.md)** — топ-10 способов, цены на август 2026, сводная
  таблица «цена за единицу уникальности», рекомендованная сборка по фазам.

## Быстрый старт

### 1. Один узел с уже маршрутизированным префиксом

```bash
./scripts/setup-ipv6-proxy.sh --prefix 2a0e:1234:5678::/48 --count 5000
# готовый список: /root/proxy-list.txt
```

Для on-link префикса (Hetzner Cloud и подобные) добавить `--mode ndppd`.
Для одного порта с ротацией адреса на каждое соединение — `--engine xray`.

### 2. Бесплатный /48 через Hurricane Electric

```bash
./scripts/setup-he-tunnel.sh --server 216.66.80.30 --client <ваш-ipv4> \
    --local6 2001:470:1f0a:abc::2/64 --routed48 2001:470:8xxx::/48
./scripts/setup-ipv6-proxy.sh --prefix 2001:470:8xxx::/48 --count 5000
```

### 3. Почасовая ферма в Hetzner Cloud

```bash
export HCLOUD_TOKEN=xxx SSH_KEY_NAME=mykey PORTS=2000
./scripts/deploy-hetzner.sh up 20     # 20 узлов = 20 разных /64, 20×20 ТБ трафика
./scripts/deploy-hetzner.sh list      # собрать proxy-list.txt
./scripts/deploy-hetzner.sh rotate 20 # пересоздать = новые /64
./scripts/deploy-hetzner.sh down      # остановить тарификацию
```

Тарификация в Hetzner идёт, пока сервер **существует**, а не пока он включён —
поэтому экономия только через `down`/`rotate`, не через выключение.

### 4. Разнородный парк у десятков хостеров

```bash
cp inventory.example.tsv inventory.tsv   # заполнить своими узлами
./scripts/provision-fleet.sh inventory.tsv --parallel 20
```

Адреса детерминированы (seed от имени хоста) — повторный запуск не меняет
выданные клиентам прокси.

## Что важно проверить перед закупкой

1. **Размер подсети.** `/48` и `/64` — разные вселенные. `/80` или `/112`,
   которые дают часть лоуэндов, для целей, банящих по `/64`, равны **одному** адресу.
2. **routed или on-link.** От этого зависит, нужен ли `ndppd`.
   `routed` → AnyIP, ноль накладных расходов. `on-link` → `ndppd`.
3. **uRPF.** Некоторые хостеры фильтруют исходящие пакеты с source-адресами,
   которых нет на интерфейсе. Проверять до оплаты: `curl --interface <адрес-из-префикса> -6 ifconfig.co`.
4. **Чистота блока.** Арендованный или купленный префикс прогонять через
   Spamhaus DROPv6, bgp.tools, проверять доступность Cloudflare/Google с адреса.
5. **Трафик.** «Unlimited» у лоуэндов обычно означает fair-use 1–5 ТБ.
   Реально безлимитны: Hetzner (20 ТБ на инстанс), OVH unmetered, дедики unmetered.
