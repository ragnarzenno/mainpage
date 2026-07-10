#!/usr/bin/env bash
# ============================================================================
#  Valkyrie & Vikings — генерация фотореалистичных версий стикеров через Flux
# ----------------------------------------------------------------------------
#  Внутри Claude-среды хост image.pollinations.ai заблокирован egress-политикой
#  (ответ 403), поэтому картинки в паке нарисованы в векторе. Запусти ЭТОТ скрипт
#  на своей машине (где Flux/Pollinations открыт) — получишь фотореал теми же
#  сюжетами. Никакого ключа не нужно: по умолчанию идёт через бесплатный
#  Pollinations Flux. Опционально можно подключить Replicate (нужен токен).
#
#  Использование:
#     bash generate_flux.sh                 # все стикеры через Pollinations Flux
#     SEED=42 bash generate_flux.sh         # зафиксировать сид
#     bash generate_flux.sh 01 03 12        # только выбранные номера
#
#  Прозрачный фон + формат Telegram (по желанию, если установлены rembg + convert):
#     pip install rembg[cli] ; sudo apt install imagemagick
#     FINALIZE=1 bash generate_flux.sh
# ============================================================================
set -euo pipefail

OUT="flux_out"
mkdir -p "$OUT"
SEED="${SEED:-7}"
STYLE="dramatic cinematic lighting, Norse mythology, epic fantasy concept art, \
highly detailed, volumetric light, embers and sparks, cold blue night vs warm fire, \
artstation trending, 8k"

# номер|имя|промпт
read -r -d '' PROMPTS <<'EOF' || true
01|burning_ship|A fierce winged Valkyrie in silver armor standing on a rocky shore, raising a flaming spear, setting a viking longship ablaze on dark water at night, crescent moon, huge orange flames and flying embers
02|valkyrie_sword|Portrait of a Valkyrie warrior goddess with a winged helmet and golden feathered wings spread wide, raising a longsword, glowing golden armor, heroic frontal pose
03|raven|A majestic black raven of Odin perched on a weathered rune stone, glowing amber eye, glossy feathers, misty Nordic background
04|axe|A battle-worn viking bearded axe with runes carved into the steel blade, leather-wrapped haft, resting against stone, dramatic rim light
05|horn|A viking drinking horn overflowing with golden mead and foam, ornate silver rim, celebratory tavern firelight, SKAL
06|mjolnir|Thor's hammer Mjolnir, ornate engraved steel head with knotwork, lightning crackling around it, storm clouds
07|skull|A viking warrior skull wearing a horned steel helmet, glowing ember eyes, dramatic dark background
08|longship|A viking longship with a striped red-and-white sail and round shields along the hull, dragon-head prow, sailing on bright open sea
09|heart|A glowing heart-shaped Norse shield with small feathered valkyrie wings and a small flame above it, romantic warm light
10|rage|A furious viking warrior face with a steel helmet, braided beard, gritted teeth, red battle fury, steam, close-up
11|valhalla|Golden banner reading VALHALLA with crossed viking swords behind it, hall of the slain, torchlight, heraldic
12|valknut|An ornate golden Valknut amulet (three interlocking triangles) on a dark rune-carved medallion, glowing runes around the rim
EOF

want=("$@")
selected() { [ ${#want[@]} -eq 0 ] && return 0; for w in "${want[@]}"; do [ "$w" = "$1" ] && return 0; done; return 1; }

urlenc() { python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1"; }

while IFS='|' read -r num name prompt; do
  [ -z "${num:-}" ] && continue
  selected "$num" || continue
  full="$prompt, $STYLE"
  echo "🔥 [$num] $name"
  if [ -n "${REPLICATE_API_TOKEN:-}" ]; then
    # ---- Flux через Replicate (black-forest-labs/flux-schnell) ----
    curl -s -X POST https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions \
      -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
      -H "Content-Type: application/json" -H "Prefer: wait" \
      -d "$(python3 -c "import json,sys;print(json.dumps({'input':{'prompt':sys.argv[1],'aspect_ratio':'1:1','output_format':'png','num_outputs':1}}))" "$full")" \
      | python3 -c "import sys,json,urllib.request;u=json.load(sys.stdin)['output'][0];urllib.request.urlretrieve(u,sys.argv[1])" "$OUT/${num}_${name}.png"
  else
    # ---- Flux через Pollinations (без ключа) ----
    enc=$(urlenc "$full")
    curl -sS -o "$OUT/${num}_${name}.png" \
      "https://image.pollinations.ai/prompt/${enc}?model=flux&width=1024&height=1024&nologo=true&seed=${SEED}"
  fi
  echo "   -> $OUT/${num}_${name}.png"
done <<< "$PROMPTS"

# ---- опционально: прозрачный фон + приведение к формату Telegram 512x512 ----
if [ "${FINALIZE:-0}" = "1" ]; then
  echo "✂️  rembg + resize -> Telegram 512x512"
  mkdir -p "$OUT/telegram"
  for f in "$OUT"/*_*.png; do
    base=$(basename "$f")
    rembg i "$f" "$OUT/telegram/$base"
    # одна из сторон ровно 512, прозрачный фон, PNG
    convert "$OUT/telegram/$base" -resize 512x512 -background none -gravity center -extent 512x512 "$OUT/telegram/$base"
  done
  echo "готово: $OUT/telegram/*.png  — заливай в @Stickers"
fi

echo "✅ Done. Картинки в: $OUT/"
