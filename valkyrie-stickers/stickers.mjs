// Valkyrie / Vikings — Telegram sticker pack (unique hand-crafted vector art)
// Style: bold heraldic "saga emblem" — flat shapes, dark outlines, gold + ember palette.
// Each sticker: 512x512, subject centered, transparent bg, white sticker outline via filter.

const C = {
  night:  '#0f1c2e',
  night2: '#16283f',
  steel:  '#3a4f6b',
  steel2: '#56718f',
  steelHi:'#8aa4bf',
  gold:   '#d6a63a',
  goldHi: '#f4d477',
  goldDk: '#a8781f',
  ember:  '#ff6a1a',
  emberHi:'#ffd23c',
  emberMd:'#ff9a2e',
  blood:  '#b0303a',
  bloodDk:'#7d1e28',
  bone:   '#f1e9d6',
  boneDk: '#cfc2a4',
  line:   '#0a1420',
  wing:   '#e9dcc0',
  wingDk: '#c7b58c',
};

const DEFS = `
  <filter id="sticker" x="-25%" y="-25%" width="150%" height="150%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="11" result="d"/>
    <feFlood flood-color="#ffffff" result="wf"/>
    <feComposite in="wf" in2="d" operator="in" result="border"/>
    <feOffset in="d" dx="0" dy="9" result="do"/>
    <feFlood flood-color="#08111c" flood-opacity="0.32" result="sf"/>
    <feComposite in="sf" in2="do" operator="in" result="shadow0"/>
    <feGaussianBlur in="shadow0" stdDeviation="8" result="shadow"/>
    <feMerge>
      <feMergeNode in="shadow"/>
      <feMergeNode in="border"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
  <radialGradient id="flame" cx="50%" cy="62%" r="60%">
    <stop offset="0%" stop-color="${C.emberHi}"/>
    <stop offset="45%" stop-color="${C.emberMd}"/>
    <stop offset="100%" stop-color="${C.ember}"/>
  </radialGradient>
  <linearGradient id="goldg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${C.goldHi}"/>
    <stop offset="55%" stop-color="${C.gold}"/>
    <stop offset="100%" stop-color="${C.goldDk}"/>
  </linearGradient>
  <linearGradient id="steelg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${C.steelHi}"/>
    <stop offset="60%" stop-color="${C.steel2}"/>
    <stop offset="100%" stop-color="${C.steel}"/>
  </linearGradient>
  <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#20344f"/>
    <stop offset="100%" stop-color="${C.night}"/>
  </linearGradient>
  <linearGradient id="wingg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#fdf6e6"/>
    <stop offset="100%" stop-color="${C.wingDk}"/>
  </linearGradient>
`;

function wrap(inner, extraDefs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>${DEFS}${extraDefs}</defs>
  <g filter="url(#sticker)">${inner}</g>
</svg>`;
}

// ---- reusable pieces -------------------------------------------------------

// A flame cluster centered at (x,y), scaled by s. Bold tongue shapes.
function flame(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0,40 C-46,10 -40,-40 -12,-70 C-20,-34 4,-40 6,-70
             C34,-46 46,-6 30,32 C58,6 52,-38 40,-58
             C86,-24 78,54 0,64 C-70,54 -78,-6 -46,-30
             C-52,6 -30,34 0,40 Z" fill="url(#flame)"/>
    <path d="M0,42 C-24,26 -22,-6 -6,-34 C-8,-8 10,-14 8,-36
             C30,-12 26,26 8,42 C22,30 22,8 16,-4
             C34,18 24,52 0,52 C-24,52 -30,20 -14,4
             C-14,22 -6,36 0,42 Z" fill="${C.emberHi}"/>
    <ellipse cx="0" cy="34" rx="9" ry="16" fill="#fff7dd"/>
  </g>`;
}

// A spread valkyrie wing pair behind a bust; cx,cy center, s scale, spread out.
function wings(cx, cy, s = 1) {
  const feather = (dir) => `
    <g transform="translate(${cx} ${cy}) scale(${dir*s} ${s})">
      <path d="M6,-6 C70,-40 150,-38 196,-2 C150,-14 150,2 176,20
               C132,-2 132,14 150,34 C110,10 108,26 120,48
               C86,20 82,36 88,58 C58,26 40,10 10,10 Z"
            fill="url(#wingg)" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40,2 C70,-6 110,-6 150,10 M52,20 C86,14 118,18 146,32"
            fill="none" stroke="${C.wingDk}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    </g>`;
  return feather(1) + feather(-1);
}

// Winged helmet (valkyrie). cx,cy = center of dome.
function wingedHelm(cx, cy, s = 1, faceColor = C.bone) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
    <!-- small side wings -->
    <g>
      <path d="M-38,-2 C-96,-26 -150,-20 -176,10 C-140,2 -140,12 -158,26
               C-126,14 -126,22 -140,36 C-112,20 -70,8 -40,14 Z"
            fill="url(#wingg)" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M38,-2 C96,-26 150,-20 176,10 C140,2 140,12 158,26
               C126,14 126,22 140,36 C112,20 70,8 40,14 Z"
            fill="url(#wingg)" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
    </g>
    <!-- dome -->
    <path d="M-54,20 C-54,-52 54,-52 54,20 Z" fill="url(#steelg)" stroke="${C.line}" stroke-width="5"/>
    <path d="M-54,20 L54,20 L54,32 L-54,32 Z" fill="${C.gold}" stroke="${C.line}" stroke-width="5"/>
    <path d="M0,-46 L0,20" stroke="${C.line}" stroke-width="4" opacity="0.5"/>
    <path d="M-2,20 L-2,74 L2,74 L2,20" fill="${C.steel}" stroke="${C.line}" stroke-width="4"/>
  </g>`;
}

// Norse raven, side profile, facing `dir` (1=right). cx,cy = body center.
function raven(cx, cy, s = 1, dir = 1) {
  return `<g transform="translate(${cx} ${cy}) scale(${dir*s} ${s})">
    <!-- fan tail -->
    <path d="M-70,10 L-186,-18 L-176,6 L-196,22 L-172,30 L-182,54 L-152,48 L-150,74 L-64,58 Z"
          fill="#0e1621" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/>
    <!-- body -->
    <path d="M-90,44 C-108,-4 -50,-52 30,-52 C70,-52 96,-34 100,-6
             C104,34 70,66 18,70 C-34,74 -74,72 -90,44 Z"
          fill="#161f2c" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/>
    <!-- neck + head -->
    <path d="M60,-40 C96,-58 120,-56 130,-40 C138,-26 132,-10 116,-4
             C126,-16 120,-30 104,-30 C86,-30 74,-20 66,-6 Z"
          fill="#161f2c" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="118" cy="-34" r="30" fill="#161f2c" stroke="${C.line}" stroke-width="5"/>
    <!-- beak -->
    <path d="M144,-40 L196,-30 L144,-20 Z" fill="${C.goldDk}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M150,-30 L188,-30" stroke="${C.line}" stroke-width="3"/>
    <!-- eye -->
    <circle cx="126" cy="-38" r="8" fill="${C.emberHi}"/>
    <circle cx="126" cy="-38" r="3.5" fill="${C.line}"/>
    <!-- folded wing (layered feathers) -->
    <path d="M-6,-34 C56,-30 84,4 66,52 C40,30 -6,30 -56,44
             C-46,4 -34,-24 -6,-34 Z" fill="#0f1823" stroke="${C.line}" stroke-width="4"/>
    <g fill="none" stroke="#2b3646" stroke-width="4" stroke-linecap="round">
      <path d="M-30,-14 C6,-8 34,8 44,36"/>
      <path d="M-40,4 C-4,8 24,22 34,44"/>
      <path d="M-44,22 C-14,26 8,36 18,52"/>
    </g>
    <!-- legs -->
    <path d="M6,68 L6,98 M-22,66 L-22,96" stroke="${C.goldDk}" stroke-width="6" stroke-linecap="round"/>
    <path d="M6,98 l-12,8 M6,98 l12,8 M-22,96 l-12,8 M-22,96 l12,8" stroke="${C.goldDk}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

// A striped viking sail + mast + dragon-prow hull. baseline at y.
function longship(cx, cy, s = 1, night = false) {
  const water = night ? '#1a2e49' : '#2b6b8f';
  const waterHi = night ? '#274468' : '#4a94b8';
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
    <!-- hull -->
    <path d="M-200,40 C-150,96 150,96 210,40 C170,52 -160,52 -200,40 Z"
          fill="url(#steelg)" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M-200,40 C-150,86 150,86 210,40" fill="none" stroke="${C.gold}" stroke-width="6"/>
    <!-- shields -->
    ${[-150,-100,-50,0,50,100,150].map((sx,i)=>`<circle cx="${sx}" cy="52" r="20"
        fill="${i%2? C.blood : C.gold}" stroke="${C.line}" stroke-width="4"/>
        <circle cx="${sx}" cy="52" r="6" fill="${C.bone}"/>`).join('')}
    <!-- dragon prow -->
    <path d="M210,40 C244,20 250,-20 236,-44 C232,-24 220,-22 214,-30
             C224,-8 208,6 196,10 C210,20 208,32 210,40 Z"
          fill="${C.gold}" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="228" cy="-24" r="4" fill="${C.line}"/>
    <!-- mast + sail -->
    <rect x="-6" y="-150" width="12" height="196" fill="${C.goldDk}" stroke="${C.line}" stroke-width="4"/>
    <path d="M-96,-140 L96,-140 L110,-6 L-110,-6 Z" fill="${C.bone}" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M-96,-140 L96,-140 L102,-52 L-102,-52 Z" fill="none"/>
    <g fill="${C.blood}" opacity="0.9">
      <path d="M-70,-140 L-40,-140 L-46,-6 L-80,-6 Z"/>
      <path d="M-10,-140 L20,-140 L22,-6 L-12,-6 Z"/>
      <path d="M50,-140 L80,-140 L98,-6 L60,-6 Z"/>
    </g>
    <path d="M-96,-140 L96,-140" stroke="${C.line}" stroke-width="6"/>
  </g>`;
}

// ---- individual stickers ---------------------------------------------------

const stickers = [];
const add = (name, emoji, title, svg) => stickers.push({ name, emoji, title, svg });

// 1) HERO — Valkyrie burning a longship (centerpiece)
add('01_burning_ship', '🔥', 'Валькирия сжигает корабль', wrap(`
  <!-- night sky disc -->
  <circle cx="256" cy="248" r="228" fill="url(#skyg)" stroke="${C.gold}" stroke-width="10"/>
  <g clip-path="url(#heroClip)">
    <!-- moon -->
    <circle cx="150" cy="150" r="46" fill="#e9edf2" opacity="0.9"/>
    <circle cx="168" cy="140" r="46" fill="url(#skyg)"/>
    <!-- water -->
    <path d="M28,340 C120,320 180,352 256,338 C340,322 400,352 484,338 L484,470 L28,470 Z"
          fill="#12283f"/>
    <path d="M28,360 C130,344 200,372 300,356 C380,344 430,366 484,356"
          fill="none" stroke="#274468" stroke-width="6" opacity="0.7"/>
    <!-- burning longship -->
    <g transform="translate(300 316) scale(0.62)">
      ${longship(0, 0, 1, true)}
    </g>
    <!-- big flames over ship -->
    ${flame(300, 250, 1.15)}
    ${flame(360, 288, 0.7)}
    ${flame(238, 292, 0.62)}
    <!-- embers -->
    ${[[260,150],[330,170],[210,200],[380,210],[300,120],[170,240]].map(([x,y])=>
      `<circle cx="${x}" cy="${y}" r="${3+((x+y)%4)}" fill="${C.emberHi}" opacity="0.9"/>`).join('')}
    <!-- Valkyrie silhouette on the left, spear + wing raised -->
    <g transform="translate(150 300)">
      ${wings(0, -30, 0.55)}
      <!-- body -->
      <path d="M-14,120 L-22,40 C-30,10 -18,-30 0,-34 C18,-30 30,10 22,40 L14,120 Z"
            fill="${C.night2}" stroke="${C.line}" stroke-width="5"/>
      <!-- head + helm -->
      <circle cx="0" cy="-48" r="20" fill="${C.bone}" stroke="${C.line}" stroke-width="4"/>
      <path d="M-22,-52 C-22,-84 22,-84 22,-52 Z" fill="url(#steelg)" stroke="${C.line}" stroke-width="4"/>
      <!-- raised spear with fire -->
      <line x1="40" y1="150" x2="70" y2="-90" stroke="${C.goldDk}" stroke-width="7" stroke-linecap="round"/>
      <path d="M70,-90 l14,-30 l-28,0 z" fill="${C.steelHi}" stroke="${C.line}" stroke-width="3"/>
      ${flame(70, -104, 0.42)}
      <!-- arm to spear -->
      <path d="M14,0 C36,-8 52,20 58,40" fill="none" stroke="${C.night2}" stroke-width="12" stroke-linecap="round"/>
    </g>
  </g>
`, `<clipPath id="heroClip"><circle cx="256" cy="248" r="223"/></clipPath>`));

// 2) Valkyrie with raised sword (heraldic bust)
add('02_valkyrie_sword', '⚔️', 'Валькирия с мечом', wrap(`
  <g transform="translate(256 300)">
    ${wings(0, -78, 1.08)}
    <!-- shoulders -->
    <path d="M-120,150 C-110,60 -60,30 0,30 C60,30 110,60 120,150 Z"
          fill="url(#steelg)" stroke="${C.line}" stroke-width="6"/>
    <path d="M-120,150 C-110,60 -60,30 0,30 C60,30 110,60 120,150"
          fill="none" stroke="${C.gold}" stroke-width="6" opacity="0.6"/>
    <!-- neck + face -->
    <rect x="-16" y="0" width="32" height="44" rx="10" fill="${C.bone}"/>
    <circle cx="0" cy="-30" r="46" fill="${C.bone}" stroke="${C.line}" stroke-width="5"/>
    <!-- hair braids -->
    <path d="M-44,-30 C-60,20 -50,70 -34,120 M44,-30 C60,20 50,70 34,120"
          fill="none" stroke="${C.gold}" stroke-width="14" stroke-linecap="round"/>
    <!-- eyes -->
    <path d="M-22,-34 l16,4 M22,-34 l-16,4" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-15" cy="-26" r="4" fill="${C.line}"/><circle cx="15" cy="-26" r="4" fill="${C.line}"/>
  </g>
  ${wingedHelm(256, 236, 1.0)}
  <!-- raised sword -->
  <g transform="translate(388 250) rotate(24)">
    <rect x="-9" y="-190" width="18" height="230" rx="6" fill="url(#steelg)" stroke="${C.line}" stroke-width="5"/>
    <path d="M0,-210 l10,20 l-20,0 z" fill="${C.steelHi}" stroke="${C.line}" stroke-width="4"/>
    <rect x="-40" y="40" width="80" height="16" rx="8" fill="url(#goldg)" stroke="${C.line}" stroke-width="5"/>
    <rect x="-9" y="56" width="18" height="46" rx="6" fill="${C.goldDk}" stroke="${C.line}" stroke-width="5"/>
    <circle cx="0" cy="108" r="14" fill="url(#goldg)" stroke="${C.line}" stroke-width="5"/>
  </g>
`));

// 3) Raven of Odin
add('03_raven', '🐦‍⬛', 'Ворон Одина', wrap(`
  <circle cx="256" cy="256" r="220" fill="url(#skyg)" stroke="${C.gold}" stroke-width="10"/>
  <text x="150" y="180" font-size="72" fill="${C.goldHi}" opacity="0.45" font-family="Georgia, serif">ᚱ</text>
  <text x="360" y="400" font-size="72" fill="${C.goldHi}" opacity="0.45" font-family="Georgia, serif">ᚢ</text>
  ${raven(236, 262, 1.28, 1)}
`));

// 4) Bearded battle axe with runes
add('04_axe', '🪓', 'Секира', wrap(`
  <g transform="translate(256 256) rotate(-14)">
    <!-- haft -->
    <rect x="-16" y="-170" width="32" height="360" rx="14" fill="url(#goldg)" stroke="${C.line}" stroke-width="6"/>
    <path d="M-16,-40 L16,-40 M-16,60 L16,60" stroke="${C.line}" stroke-width="5" opacity="0.5"/>
    <!-- leather grip -->
    <g stroke="${C.bloodDk}" stroke-width="7">
      <path d="M-16,80 L16,110"/><path d="M-16,110 L16,140"/><path d="M-16,140 L16,170"/>
    </g>
    <!-- axe head (bearded) -->
    <path d="M8,-150 C120,-150 150,-70 96,-8 C60,32 8,20 8,20 Z"
          fill="url(#steelg)" stroke="${C.line}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M8,-140 C-96,-140 -120,-64 -70,-6 C-40,28 8,18 8,18 Z"
          fill="url(#steelg)" stroke="${C.line}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M-70,-6 C-40,26 8,18 8,18 C8,18 60,30 96,-8" fill="none" stroke="${C.steelHi}" stroke-width="8"/>
    <!-- runes engraved -->
    <text x="8" y="-70" font-size="52" text-anchor="middle" fill="${C.goldHi}" font-family="Georgia, serif">ᚨ</text>
  </g>
`));

// 5) Drinking horn — SKÅL!
add('05_horn', '🍺', 'Skål!', wrap(`
  <g transform="translate(256 280) rotate(8)">
    <!-- horn body -->
    <path d="M-160,-60 C-40,-96 130,-60 160,60 C150,150 60,150 20,86
             C-20,26 -90,4 -160,-6 Z"
          fill="url(#goldg)" stroke="${C.line}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M-150,-30 C-40,-56 90,-30 120,60" fill="none" stroke="${C.goldDk}" stroke-width="6" opacity="0.7"/>
    <!-- rim band -->
    <path d="M-166,-60 C-130,-92 -70,-92 -40,-70 C-70,-40 -140,-40 -166,-6 Z"
          fill="${C.steel2}" stroke="${C.line}" stroke-width="7"/>
    <!-- foam -->
    <g fill="${C.bone}" stroke="${C.line}" stroke-width="5">
      <circle cx="-150" cy="-58" r="26"/><circle cx="-118" cy="-78" r="24"/>
      <circle cx="-84" cy="-84" r="26"/><circle cx="-52" cy="-74" r="22"/>
    </g>
    <circle cx="-96" cy="-104" r="10" fill="${C.bone}" stroke="${C.line}" stroke-width="4"/>
    <circle cx="-140" cy="-96" r="8" fill="${C.bone}" stroke="${C.line}" stroke-width="4"/>
  </g>
  <text x="256" y="480" font-size="72" text-anchor="middle" fill="${C.goldHi}"
        font-family="Georgia, serif" font-weight="bold" stroke="${C.line}" stroke-width="3">SKÅL!</text>
`));

// 6) Mjölnir with lightning
add('06_mjolnir', '⚡', 'Мьёльнир', wrap(`
  <!-- lightning behind -->
  <path d="M256,20 L210,180 L270,180 L200,360 L300,150 L246,150 Z"
        fill="${C.emberHi}" stroke="${C.line}" stroke-width="6" stroke-linejoin="round" opacity="0.9"/>
  <g transform="translate(256 300)">
    <!-- head -->
    <rect x="-120" y="-70" width="240" height="120" rx="18" fill="url(#steelg)" stroke="${C.line}" stroke-width="8"/>
    <rect x="-120" y="-70" width="240" height="34" rx="14" fill="${C.steelHi}" opacity="0.5"/>
    <!-- knot detail -->
    <circle cx="0" cy="-10" r="26" fill="none" stroke="${C.gold}" stroke-width="8"/>
    <path d="M-70,-10 L-30,-10 M30,-10 L70,-10" stroke="${C.gold}" stroke-width="8" stroke-linecap="round"/>
    <!-- handle -->
    <rect x="-22" y="46" width="44" height="150" rx="12" fill="url(#goldg)" stroke="${C.line}" stroke-width="8"/>
    <g stroke="${C.bloodDk}" stroke-width="7"><path d="M-22,90 L22,110"/><path d="M-22,120 L22,140"/><path d="M-22,150 L22,170"/></g>
    <circle cx="0" cy="200" r="20" fill="url(#goldg)" stroke="${C.line}" stroke-width="7"/>
  </g>
`));

// 7) Horned-helm skull
add('07_skull', '💀', 'Череп воина', wrap(`
  <g transform="translate(256 268)">
    <!-- horns -->
    <path d="M-70,-70 C-150,-110 -200,-60 -196,10 C-170,-40 -120,-50 -78,-30 Z"
          fill="${C.bone}" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M70,-70 C150,-110 200,-60 196,10 C170,-40 120,-50 78,-30 Z"
          fill="${C.bone}" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>
    <!-- helm cap -->
    <path d="M-96,-40 C-96,-120 96,-120 96,-40 Z" fill="url(#steelg)" stroke="${C.line}" stroke-width="7"/>
    <rect x="-96" y="-46" width="192" height="20" fill="${C.gold}" stroke="${C.line}" stroke-width="6"/>
    <!-- skull -->
    <path d="M-90,-20 C-90,-90 90,-90 90,-20 C90,40 60,70 40,80 L40,120 L-40,120 L-40,80 C-60,70 -90,40 -90,-20 Z"
          fill="${C.bone}" stroke="${C.line}" stroke-width="7" stroke-linejoin="round"/>
    <!-- nose guard -->
    <path d="M-8,-30 L8,-30 L4,60 L-4,60 Z" fill="url(#steelg)" stroke="${C.line}" stroke-width="5"/>
    <!-- eyes -->
    <ellipse cx="-42" cy="6" rx="26" ry="30" fill="${C.line}"/>
    <ellipse cx="42" cy="6" rx="26" ry="30" fill="${C.line}"/>
    <circle cx="-42" cy="2" r="7" fill="${C.emberHi}"/><circle cx="42" cy="2" r="7" fill="${C.emberHi}"/>
    <!-- teeth -->
    <g stroke="${C.line}" stroke-width="4">
      <path d="M-30,86 L-30,116 M-10,86 L-10,120 M10,86 L10,120 M30,86 L30,116"/>
    </g>
  </g>
`));

// 8) Longship on the waves (daytime, clean)
add('08_longship', '⛵', 'Драккар', wrap(`
  <circle cx="256" cy="256" r="220" fill="#bfe0ef" stroke="${C.gold}" stroke-width="10"/>
  <g clip-path="url(#shipClip)">
    <rect x="36" y="300" width="440" height="200" fill="#2b6b8f"/>
    <path d="M36,320 C130,304 210,336 320,320 C400,308 440,330 476,320"
          fill="none" stroke="#4a94b8" stroke-width="7"/>
    <path d="M36,370 C150,352 240,384 340,368 C420,356 450,378 476,368"
          fill="none" stroke="#4a94b8" stroke-width="7"/>
    <g transform="translate(256 300) scale(0.86)">${longship(0,0,1,false)}</g>
  </g>
  <defs><clipPath id="shipClip"><circle cx="256" cy="256" r="215"/></clipPath></defs>
`));

// 9) Valkyrie & flaming heart (cute)
add('09_heart', '❤️', 'Сердце валькирии', wrap(`
  <g transform="translate(256 268)">
    ${wings(0, 6, 0.8)}
    <!-- heart shield -->
    <path d="M0,150 C-120,60 -140,-70 -60,-110 C-16,-130 0,-90 0,-70
             C0,-90 16,-130 60,-110 C140,-70 120,60 0,150 Z"
          fill="${C.blood}" stroke="${C.line}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M-40,-90 C-72,-70 -70,-10 -30,50" fill="none" stroke="#e06a72" stroke-width="12" stroke-linecap="round"/>
    <!-- rune heart -->
    <text x="0" y="34" font-size="120" text-anchor="middle" fill="${C.goldHi}" font-family="Georgia, serif" font-weight="bold">ᛉ</text>
  </g>
  ${flame(256, 96, 0.6)}
`));

// 10) Rage viking face
add('10_rage', '😤', 'Ярость', wrap(`
  <circle cx="256" cy="256" r="220" fill="${C.blood}" stroke="${C.gold}" stroke-width="10"/>
  <g transform="translate(256 260)">
    <!-- helm -->
    <path d="M-120,-30 C-120,-140 120,-140 120,-30 Z" fill="url(#steelg)" stroke="${C.line}" stroke-width="8"/>
    <rect x="-120" y="-40" width="240" height="24" fill="${C.gold}" stroke="${C.line}" stroke-width="6"/>
    <path d="M-10,-40 L10,-40 L6,70 L-6,70 Z" fill="url(#steelg)" stroke="${C.line}" stroke-width="5"/>
    <!-- face -->
    <path d="M-104,-24 C-104,60 -70,110 0,110 C70,110 104,60 104,-24 Z"
          fill="${C.bone}" stroke="${C.line}" stroke-width="7"/>
    <!-- angry brows -->
    <path d="M-90,10 L-30,-6 M90,10 L30,-6" stroke="${C.line}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="-52" cy="26" r="8" fill="${C.line}"/><circle cx="52" cy="26" r="8" fill="${C.line}"/>
    <!-- gritted teeth -->
    <path d="M-56,66 C-20,52 20,52 56,66 L56,86 C20,74 -20,74 -56,86 Z"
          fill="#fff" stroke="${C.line}" stroke-width="5"/>
    <path d="M-40,60 L-40,80 M-20,58 L-20,80 M0,58 L0,80 M20,58 L20,80 M40,60 L40,80" stroke="${C.line}" stroke-width="4"/>
    <!-- braided beard -->
    <path d="M-70,96 C-60,150 -30,170 0,170 C30,170 60,150 70,96
             C40,130 -40,130 -70,96 Z" fill="#8a5a2a" stroke="${C.line}" stroke-width="6"/>
    <path d="M-28,150 C-28,180 -20,196 -12,208 M28,150 C28,180 20,196 12,208"
          fill="none" stroke="${C.goldDk}" stroke-width="10" stroke-linecap="round"/>
    <!-- steam puffs -->
    <g fill="#fff" opacity="0.85"><circle cx="-140" cy="-6" r="14"/><circle cx="-160" cy="-24" r="10"/>
      <circle cx="140" cy="-6" r="14"/><circle cx="160" cy="-24" r="10"/></g>
  </g>
`));

// 11) VALHALLA banner
add('11_valhalla', '🏰', 'Вальхалла', wrap(`
  <!-- crossed swords -->
  <g transform="translate(256 240)">
    <g transform="rotate(38)"><rect x="-8" y="-160" width="16" height="300" rx="6" fill="url(#steelg)" stroke="${C.line}" stroke-width="5"/>
      <rect x="-36" y="120" width="72" height="14" rx="7" fill="url(#goldg)" stroke="${C.line}" stroke-width="4"/></g>
    <g transform="rotate(-38)"><rect x="-8" y="-160" width="16" height="300" rx="6" fill="url(#steelg)" stroke="${C.line}" stroke-width="5"/>
      <rect x="-36" y="120" width="72" height="14" rx="7" fill="url(#goldg)" stroke="${C.line}" stroke-width="4"/></g>
  </g>
  <!-- banner ribbon -->
  <g transform="translate(256 300)">
    <path d="M-200,-40 L200,-40 L200,50 L230,20 L230,90 L-230,90 L-230,20 L-200,50 Z"
          fill="${C.blood}" stroke="${C.line}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M-200,-40 L200,-40 L200,50 L-200,50 Z" fill="${C.blood}" stroke="${C.gold}" stroke-width="5"/>
    <text x="0" y="18" font-size="60" text-anchor="middle" fill="${C.goldHi}"
          font-family="Georgia, serif" font-weight="bold" letter-spacing="2">VALHALLA</text>
  </g>
`));

// 12) Rune amulet — Valknut (pack logo)
add('12_valknut', '✨', 'Валькнут', wrap(`
  <circle cx="256" cy="256" r="216" fill="url(#skyg)" stroke="${C.gold}" stroke-width="12"/>
  <circle cx="256" cy="256" r="188" fill="none" stroke="${C.goldDk}" stroke-width="4" opacity="0.7"/>
  <!-- runic ring marks -->
  <g fill="${C.goldHi}" font-family="Georgia, serif" font-size="34" opacity="0.85">
    <text x="256" y="96" text-anchor="middle">ᛟ</text>
    <text x="416" y="270" text-anchor="middle">ᚱ</text>
    <text x="256" y="440" text-anchor="middle">ᚨ</text>
    <text x="96" y="270" text-anchor="middle">ᚠ</text>
  </g>
  <!-- valknut (three interlocking triangles) -->
  <g transform="translate(256 268)" fill="none" stroke="url(#goldg)" stroke-width="16" stroke-linejoin="round">
    <path d="M0,-120 L104,60 L-104,60 Z"/>
    <path d="M0,-70 L60,34 L-60,34 Z" stroke="${C.emberMd}" stroke-width="10"/>
  </g>
  <g transform="translate(256 268)" fill="none" stroke="${C.line}" stroke-width="3" stroke-linejoin="round" opacity="0.5">
    <path d="M0,-120 L104,60 L-104,60 Z"/>
  </g>
`));

export { stickers };
