#!/usr/bin/env python3
"""
Генератор конфигов прокси со случайными IPv6-адресами из заданного префикса.

Поддерживает 3proxy, gost v3 и Xray (режим sendThrough из CIDR — один порт,
бесконечная ротация адресов без раздувания конфига).

Примеры:
  # 5000 портов 3proxy, по случайному адресу из /48 на порт
  ./gen-proxy-config.py --prefix 2a0e:1234:5678::/48 --count 5000 \
      --port-start 30000 --user u1 --password p1 --mode 3proxy > /etc/3proxy/3proxy.cfg

  # список прокси для клиента (ip:port:user:pass)
  ./gen-proxy-config.py --prefix 2a0e:1234:5678::/48 --count 5000 \
      --port-start 30000 --user u1 --password p1 --mode list --host 1.2.3.4

  # gost: один порт, случайный bind на каждое соединение
  ./gen-proxy-config.py --prefix 2a0e:1234:5678::/48 --mode xray --port-start 1080
"""
import argparse
import ipaddress
import json
import random
import sys


def random_addr(net: ipaddress.IPv6Network, rng: random.Random) -> ipaddress.IPv6Address:
    """Случайный адрес внутри префикса. Первые 16 адресов пропускаем —
    они часто заняты шлюзом/anycast-сервисами хостера."""
    span = net.num_addresses
    if span <= 16:
        offset = rng.randrange(span)
    else:
        offset = rng.randrange(16, span)
    return net[offset]


def unique_addrs(net, count, rng, spread_64):
    """Генерирует count уникальных адресов.

    spread_64=True (по умолчанию): не более одного адреса на /64.
    Это принципиально: большинство антифрод-систем банит по /64, поэтому
    два адреса из одной /64 — это один адрес с их точки зрения.
    """
    seen = set()
    out = []
    guard = 0
    while len(out) < count and guard < count * 50:
        guard += 1
        a = random_addr(net, rng)
        key = int(a) >> 64 if spread_64 else int(a)
        if key in seen:
            continue
        seen.add(key)
        out.append(a)
    if len(out) < count:
        sys.stderr.write(
            f"warning: удалось выдать только {len(out)} из {count} адресов "
            f"(в префиксе {net} не хватает /64-подсетей — уменьшите --count "
            f"или снимите --spread-64)\n"
        )
    return out


def emit_3proxy(addrs, args):
    print("# сгенерировано gen-proxy-config.py — не редактировать вручную")
    print("daemon")
    print("maxconn 10000")
    print("nserver [2606:4700:4700::1111]")
    print("nserver [2001:4860:4860::8888]")
    print("nscache6 65536")
    print("timeouts 1 5 30 60 180 1800 15 60")
    print(f"log /var/log/3proxy/3proxy.log D")
    print("logformat \"- +_L%t.%. %N.%p %E %U %C:%c %R:%r %O %I %h %T\"")
    print("rotate 3")
    print("auth strong")
    print(f"users {args.user}:CL:{args.password}")
    print(f"allow {args.user}")
    print()
    for i, a in enumerate(addrs):
        port = args.port_start + i
        # -6 = только IPv6-исход, -a = анонимный режим (не палить клиента)
        print(f"proxy -6 -n -a -p{port} -i{args.bind} -e{a}")
        if args.socks:
            print(f"socks -6 -n -p{port + args.socks_offset} -i{args.bind} -e{a}")


def emit_gost(addrs, args):
    """gost v3 YAML: по сервису на порт, у каждого свой исходящий интерфейс."""
    services = []
    for i, a in enumerate(addrs):
        port = args.port_start + i
        services.append({
            "name": f"p{i}",
            "addr": f"{args.bind}:{port}",
            "handler": {
                "type": "socks5" if args.socks else "http",
                "auther": "au",
            },
            "listener": {"type": "tcp"},
            "metadata": {"interface": str(a)},
        })
    cfg = {
        "services": services,
        "authers": [{
            "name": "au",
            "auths": [{"username": args.user, "password": args.password}],
        }],
        "resolvers": [{
            "name": "r",
            "nameservers": [{"addr": "[2606:4700:4700::1111]:53"}],
        }],
    }
    print(json.dumps(cfg, indent=2))


def emit_xray(args):
    """Xray/sing-box: ОДИН порт, случайный адрес из CIDR на каждое соединение.

    Самый экономный режим: не нужно N портов и N строк конфига,
    ротация происходит на каждом коннекте средствами ядра прокси.
    """
    cfg = {
        "inbounds": [{
            "port": args.port_start,
            "listen": args.bind,
            "protocol": "socks",
            "settings": {
                "auth": "password",
                "accounts": [{"user": args.user, "pass": args.password}],
                "udp": True,
            },
        }],
        "outbounds": [{
            "protocol": "freedom",
            "sendThrough": args.prefix,          # CIDR — Xray сам берёт случайный адрес
            "settings": {"domainStrategy": "UseIPv6"},
        }],
    }
    print(json.dumps(cfg, indent=2))


def emit_list(addrs, args):
    for i, _a in enumerate(addrs):
        port = args.port_start + i
        print(f"{args.host}:{port}:{args.user}:{args.password}")


def emit_addrs(addrs, args):
    for a in addrs:
        print(a)


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--prefix", required=True, help="IPv6-префикс, например 2a0e:1234:5678::/48")
    p.add_argument("--count", type=int, default=1000, help="сколько адресов/портов (default: 1000)")
    p.add_argument("--port-start", type=int, default=30000)
    p.add_argument("--user", default="proxy")
    p.add_argument("--password", default="proxy")
    p.add_argument("--bind", default="0.0.0.0", help="на каком IPv4 слушать входящие")
    p.add_argument("--host", default="0.0.0.0", help="внешний IPv4 для режима list")
    p.add_argument("--mode", choices=["3proxy", "gost", "xray", "list", "addrs"], default="3proxy")
    p.add_argument("--socks", action="store_true", help="socks5 вместо/вдобавок к http")
    p.add_argument("--socks-offset", type=int, default=10000,
                   help="смещение портов socks относительно http (3proxy)")
    p.add_argument("--seed", type=int, default=None,
                   help="фиксированный seed — те же адреса при перегенерации "
                        "(нужно, если адреса должны быть ПОСТОЯННЫМИ между рестартами)")
    p.add_argument("--no-spread-64", dest="spread_64", action="store_false",
                   help="разрешить несколько адресов из одной /64 (не рекомендуется)")
    args = p.parse_args()

    net = ipaddress.IPv6Network(args.prefix, strict=False)
    rng = random.Random(args.seed)

    if args.mode == "xray":
        emit_xray(args)
        return

    addrs = unique_addrs(net, args.count, rng, args.spread_64)
    {
        "3proxy": emit_3proxy,
        "gost": emit_gost,
        "list": emit_list,
        "addrs": emit_addrs,
    }[args.mode](addrs, args)


if __name__ == "__main__":
    main()
