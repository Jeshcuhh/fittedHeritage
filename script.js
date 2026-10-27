(() => {
  'use strict';

  /* =========================================================
     Helpers
     ========================================================= */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const round2 = (n) => Math.round(n * 100) / 100;
  const fmt0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmt2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (n) => (Number.isInteger(round2(n)) ? fmt0 : fmt2).format(round2(n));
  const pct = (n) => `${Math.round(n * 100)}%`;
  const fmtNum = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  const fmtMonth = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TODAY = new Date();
  const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* =========================================================
     Garment drawings (viewBox 0 0 120 140)
     ========================================================= */
  const SLEEVE_LONG = 'M40 22 L51 17 Q60 24 69 17 L80 22 Q93 28 99 46 L105 112 L92 114 L85 58 L85 124 L35 124 L35 58 L28 114 L15 112 L21 46 Q27 28 40 22 Z';
  const SHAPES = {
    tee: { body: 'M40 24 L52 18 Q60 25 68 18 L80 24 L100 42 L90 53 L82 46 L82 122 L38 122 L38 46 L30 53 L20 42 Z', lines: ['M52 18 Q60 30 68 18', 'M38 116 H82'] },
    sweater: {
      body: SLEEVE_LONG, cuff: 110,
      lines: ['M51 17 Q60 28 69 17', 'M35 116 H85', 'M16 104 L29 106', 'M91 106 L104 104',
        'M50 34 q4 6 0 12 q-4 6 0 12 q4 6 0 12 q-4 6 0 12 q4 6 0 12', 'M70 34 q-4 6 0 12 q4 6 0 12 q-4 6 0 12 q4 6 0 12 q-4 6 0 12', 'M60 32 V112']
    },
    cardigan: { body: SLEEVE_LONG, cuff: 110, lines: ['M51 17 L60 42 L69 17', 'M60 42 V124', 'M35 116 H85', 'M16 104 L29 106', 'M91 106 L104 104'], dots: [[64, 54], [64, 70], [64, 86], [64, 102]] },
    shirt: { body: 'M40 22 L50 17 L60 26 L70 17 L80 22 L99 40 L90 52 L82 46 L82 122 L38 122 L38 46 L30 52 L21 40 Z', lines: ['M50 17 L55 33 L60 26 L65 33 L70 17', 'M60 26 V122'], dots: [[62, 44], [62, 62], [62, 80], [62, 98]] },
    blouse: { body: SLEEVE_LONG, cuff: 110, lines: ['M51 17 L56 30 L60 24 L64 30 L69 17', 'M60 24 V124', 'M53 34 V76', 'M56 34 V76', 'M64 34 V76', 'M67 34 V76', 'M16 104 L29 106', 'M91 106 L104 104'] },
    blazer: {
      body: 'M40 22 L50 17 L70 17 L80 22 Q92 28 97 46 L103 104 L91 106 L85 60 L85 104 L35 104 L35 60 L29 106 L17 104 L23 46 Q28 28 40 22 Z', cuff: 103,
      lines: ['M50 17 L56 52 L60 66 L64 52 L70 17', 'M50 17 L45 31 L53 36', 'M70 17 L75 31 L67 36', 'M40 84 H50', 'M70 84 H80'], dots: [[60, 74]]
    },
    coat: {
      body: 'M40 20 L50 15 L70 15 L80 20 Q92 26 97 44 L103 112 L91 114 L86 60 L88 132 L32 132 L34 60 L29 114 L17 112 L23 44 Q28 26 40 20 Z', cuff: 111,
      lines: ['M50 15 L57 56 L60 62 L63 56 L70 15', 'M50 15 L44 30 L53 35', 'M70 15 L76 30 L67 35', 'M38 94 H50', 'M70 94 H82'], dots: [[60, 74], [60, 92], [60, 110]]
    },
    peacoat: {
      body: 'M40 20 L50 15 L70 15 L80 20 Q92 26 97 44 L103 110 L91 112 L86 60 L87 118 L33 118 L34 60 L29 112 L17 110 L23 44 Q28 26 40 20 Z', cuff: 109,
      lines: ['M50 15 L55 46 L60 52 L65 46 L70 15', 'M50 15 L43 30 L53 34', 'M70 15 L77 30 L67 34'], dots: [[52, 62], [68, 62], [52, 78], [68, 78], [52, 94], [68, 94]]
    },
    trench: {
      body: 'M40 20 L50 15 L70 15 L80 20 Q92 26 97 44 L103 112 L91 114 L86 60 L90 132 L30 132 L34 60 L29 114 L17 112 L23 44 Q28 26 40 20 Z', cuff: 111,
      lines: ['M50 15 L56 46 L60 50 L64 46 L70 15', 'M50 15 L42 30 L53 34', 'M70 15 L78 30 L67 34', 'M34 76 H86', 'M34 82 H86', 'M58 74 h6 v10 h-6 z', 'M16 104 L29 106', 'M91 106 L104 104'], dots: [[52, 58], [68, 58], [52, 94], [68, 94]]
    },
    chore: {
      body: 'M38 22 L50 17 L70 17 L82 22 Q93 27 97 44 L101 108 L89 110 L85 58 L86 116 L34 116 L35 58 L31 110 L19 108 L23 44 Q27 27 38 22 Z', cuff: 107,
      lines: ['M50 17 L54 28 L60 24 L66 28 L70 17', 'M60 24 V116', 'M40 40 h13 v13 h-13 z', 'M39 78 h15 v18 h-15 z', 'M66 78 h15 v18 h-15 z'], dots: [[62, 36], [62, 54], [62, 72], [62, 90]]
    },
    shell: {
      body: 'M38 24 L48 19 Q50 2 60 2 Q70 2 72 19 L82 24 Q93 29 97 46 L101 110 L89 112 L85 60 L86 118 L34 118 L35 60 L31 112 L19 110 L23 46 Q27 29 38 24 Z', cuff: 109,
      lines: ['M48 19 Q60 28 72 19', 'M60 24 V118', 'M40 80 L50 74', 'M80 80 L70 74', 'M34 112 H86']
    },
    dress: { body: 'M46 28 Q60 34 74 28 L78 60 Q84 96 90 130 L30 130 Q36 96 42 60 Z', lines: ['M47 28 L44 10', 'M73 28 L76 10', 'M46 28 Q60 42 74 28'] },
    trousers: { body: 'M36 16 H84 L90 130 H66 L60 54 L54 130 H30 Z', lines: ['M36 24 H84', 'M48 24 V44', 'M72 24 V44', 'M60 24 V50'] },
    jeans: {
      body: 'M37 16 H83 L88 130 H66 L60 54 L54 130 H32 Z', lines: ['M37 24 H83', 'M38 26 Q44 38 52 30', 'M82 26 Q76 38 68 30', 'M60 24 V48'],
      dashes: ['M35 32 L33 126', 'M85 32 L87 126', 'M33 124 H53', 'M67 124 H87']
    },
    skirt: { body: 'M42 22 H78 L92 120 H28 Z', lines: ['M42 30 H78', 'M52 30 L48 120', 'M68 30 L72 120'] },
    brief: { body: 'M24 48 H96 L92 62 Q74 72 67 98 H53 Q46 72 28 62 Z', lines: ['M24 55 H96'] },
    bralette: { body: 'M30 62 L44 36 L58 62 Z M62 62 L76 36 L90 62 Z M28 62 H92 V72 H28 Z', lines: ['M44 36 L42 18', 'M76 36 L78 18'] }
  };
  const lum = (hex) => {
    const h = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  function garmentInner(kind, color) {
    const s = SHAPES[kind] || SHAPES.tee;
    const line = lum(color) < 0.28 ? 'rgba(250,249,245,.45)' : 'rgba(20,20,19,.5)';
    return `<path d="${s.body}" fill="${color}" stroke="${line}" stroke-width="1.1" stroke-linejoin="round"/>`
      + `<path d="${s.body}" fill="url(#weave)"/>`
      + (s.lines || []).map((d) => `<path d="${d}" fill="none" stroke="${line}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>`).join('')
      + (s.dashes || []).map((d) => `<path d="${d}" fill="none" stroke="${line}" stroke-width=".8" stroke-dasharray="2 2"/>`).join('')
      + (s.dots || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${line}"/>`).join('');
  }
  function garment(kind, color, alt, cls = 'garment') {
    const a11y = alt ? `role="img" aria-label="${esc(alt)}"` : 'aria-hidden="true" focusable="false"';
    return `<svg class="${cls}" viewBox="0 0 120 140" ${a11y}>${garmentInner(kind, color)}</svg>`;
  }
  // Listing photo when there is one, drawn garment otherwise.
  const itemArt = (it, alt) => it.img
    ? `<img class="photo" src="${it.img}" alt="${alt ? esc(alt) : ''}" loading="lazy" decoding="async">`
    : garment(it.kind, it.color, alt);
  function outfit(top, bottom) {
    if (!bottom) return `<svg viewBox="0 0 200 160" aria-hidden="true" focusable="false"><svg x="45" y="6" width="110" height="148" viewBox="0 0 120 140">${garmentInner(top[0], top[1])}</svg></svg>`;
    return `<svg viewBox="0 0 200 160" aria-hidden="true" focusable="false">`
      + `<svg x="88" y="22" width="104" height="134" viewBox="0 0 120 140">${garmentInner(bottom[0], bottom[1])}</svg>`
      + `<svg x="8" y="4" width="112" height="140" viewBox="0 0 120 140">${garmentInner(top[0], top[1])}</svg></svg>`;
  }

  /* =========================================================
     Demo data
     ========================================================= */
  const COLORS = [
    { id: 'cream', hex: '#efe7d6' }, { id: 'white', hex: '#f7f5ef' }, { id: 'black', hex: '#262422' }, { id: 'navy', hex: '#2e3b55' },
    { id: 'grey', hex: '#8d8a85' }, { id: 'camel', hex: '#b08a5e' }, { id: 'olive', hex: '#6f7350' }, { id: 'sage', hex: '#a9b393' },
    { id: 'blue', hex: '#5b7a9c' }, { id: 'rust', hex: '#b0603c' }, { id: 'rose', hex: '#d6a7a1' }, { id: 'khaki', hex: '#a59a73' }, { id: 'brown', hex: '#6b4a35' }
  ];
  const colorHex = (id) => (COLORS.find((c) => c.id === id) || COLORS[0]).hex;

  const STYLES = [
    { id: 'minimal', name: 'Minimal', top: ['tee', '#ece6da'], bottom: ['trousers', '#2a2826'] },
    { id: 'workwear', name: 'Workwear', top: ['chore', '#6f7350'], bottom: ['jeans', '#4f6d8f'] },
    { id: 'cottagecore', name: 'Cottagecore', top: ['blouse', '#f3ead8'], bottom: ['skirt', '#a9b393'] },
    { id: '90s', name: '’90s', top: ['dress', '#2b2a28'] },
    { id: 'tailored', name: 'Tailored', top: ['blazer', '#3b3a38'], bottom: ['trousers', '#9a968f'] },
    { id: 'streetwear', name: 'Streetwear', top: ['shell', '#c9c3b5'], bottom: ['jeans', '#2f3a4a'] },
    { id: 'boho', name: 'Boho', top: ['blouse', '#c98a5e'], bottom: ['skirt', '#d8c3a0'] },
    { id: 'preppy', name: 'Preppy', top: ['cardigan', '#2e3b55'], bottom: ['skirt', '#b08a5e'] },
    { id: 'utility', name: 'Utility', top: ['shell', '#8a8564'], bottom: ['trousers', '#565a45'] },
    { id: 'romantic', name: 'Romantic', top: ['dress', '#e7c4bd'] },
    { id: 'athleisure', name: 'Athleisure', top: ['tee', '#b8bfc7'], bottom: ['trousers', '#3c3f44'] },
    { id: 'vintage-70s', name: 'Vintage ’70s', top: ['sweater', '#c47b47'], bottom: ['jeans', '#6b84a3'] }
  ];
  const GARMENT_TYPES = ['tops', 'knitwear', 'trousers', 'jeans', 'skirts', 'dresses', 'outerwear', 'suiting'];
  const TYPE_KIND = { tops: 'tee', knitwear: 'sweater', trousers: 'trousers', jeans: 'jeans', skirts: 'skirt', dresses: 'dress', outerwear: 'chore', suiting: 'blazer', underwear: 'brief' };

  const FIBER_CLASS = {
    cotton: 'nat', linen: 'nat', hemp: 'nat', ramie: 'nat', wool: 'nat', cashmere: 'nat', alpaca: 'nat', mohair: 'nat', camel: 'nat', yak: 'nat', silk: 'nat', merino: 'nat',
    lyocell: 'semi', modal: 'semi', viscose: 'semi', rayon: 'semi', cupro: 'semi', bamboo: 'semi',
    polyester: 'syn', nylon: 'syn', acrylic: 'syn', elastane: 'syn', polypropylene: 'syn'
  };
  const CARE = {
    wool: 'Wool: hand wash cold, lay flat to dry.', cashmere: 'Cashmere: hand wash cold or dry clean, lay flat.', linen: 'Linen: machine wash cool, line dry. It softens with every wash.',
    cotton: 'Cotton: machine wash, tumble low.', silk: 'Silk: hand wash cold, roll in a towel, no wringing.', rayon: 'Rayon: hand wash cold. It can shrink if heated.',
    polyester: 'Polyester: machine wash. Sheds microfibers, so a wash bag helps.', acrylic: 'Acrylic: machine wash, pills easily.', nylon: 'Nylon: machine wash cold.'
  };

  const LISTINGS = [
    { id: 'ebay-001', source: 'eBay', short: 'Honey pointelle cardigan', title: 'Vintage honey pointelle-knit V-neck cardigan, 100% wool, M', price: 28, ship: 6, cond: 'excellent', care: 'hand', type: 'knitwear', kind: 'cardigan', color: '#d9bd8a', colorName: 'camel', img: 'asset/creamSweater.jpg',
      fibers: [['wool', 100]], tags: { minimal: 0.7, 'vintage-70s': 0.5, tailored: 0.3, workwear: 0.3 }, meas: { chest: 44, sleeve: 23.5 }, pairs: ['w-07', 'w-08', 'w-09', 'w-11'], goal: 'sweater', version: 'natural', newPrice: 120, days: 2,
      desc: 'Pointelle cable panels down the front, gold shank buttons. No holes or moth damage. Light pilling under the arms.' },
    { id: 'etsy-014', source: 'Etsy', short: 'Sage linen camp shirt', title: '’90s linen-blend camp shirt, sage, short sleeve', price: 22, ship: 5, cond: 'good', care: 'gentle', type: 'tops', kind: 'shirt', color: '#a9b393', colorName: 'sage', img: 'asset/sageShirt.avif',
      fibers: [['linen', 45], ['rayon', 55]], tags: { '90s': 0.8, minimal: 0.6, boho: 0.3 }, meas: { chest: 42.5, shoulder: 15.5 }, pairs: ['w-07', 'w-08', 'w-11'], newPrice: 68, days: 5,
      desc: 'Relaxed camp collar, coconut buttons. Content tag reads 45% linen, 55% rayon.' },
    { id: 'ebay-022', source: 'eBay', short: 'Black patch-pocket blazer', title: 'Black blazer, soft shoulders, two button, patch pockets', price: 37, ship: 0, cond: 'excellent', care: 'machine', type: 'suiting', kind: 'blazer', color: '#2a2826', colorName: 'black', img: 'asset/blackBlazer.jpg',
      fibers: [['polyester', 100]], tags: { tailored: 0.9, minimal: 0.8, '90s': 0.7 }, meas: { chest: 40, shoulder: 15, sleeve: 25 }, pairs: ['w-04', 'w-07', 'w-09', 'w-12'], newPrice: 140, days: 1,
      desc: 'Clean notch lapel, two buttons, deep patch pockets. Fully machine washable. Sleeves are long on me.' },
    { id: 'local-003', source: 'Local shop', short: 'Camel wool cape coat', title: 'Camel wool and cashmere cape coat, faux fur trim, belted', price: 30, ship: 0, local: true, cond: 'good', care: 'dry', type: 'outerwear', kind: 'coat', color: '#b08a5e', colorName: 'camel', img: 'asset/camelCashmereCoat.jpg',
      fibers: [['wool', 90], ['cashmere', 10]], tags: { tailored: 0.8, minimal: 0.8, preppy: 0.5 }, meas: { chest: 41, shoulder: 15.5, sleeve: 24.5 }, pairs: ['w-04', 'w-07', 'w-09', 'w-10', 'w-11', 'w-12'], goal: 'coat', version: 'natural', newPrice: 280, days: 3,
      desc: 'On the rack at a local thrift, 2.8 miles away. Faux fur front is still plush, tie belt included. Runs long through the arms.' },
    { id: 'shopgw-118', source: 'ShopGoodwill', short: 'Charcoal tweed coat', title: 'Charcoal herringbone tweed coat, wool blend', price: 24, ship: 8, cond: 'good', care: 'dry', type: 'outerwear', kind: 'peacoat', color: '#4a4a4c', colorName: 'charcoal', img: 'asset/charcoalPeacoat.avif',
      fibers: [['polyester', 70], ['wool', 30]], tags: { preppy: 0.7, tailored: 0.4, utility: 0.3, minimal: 0.4 }, meas: { chest: 40.5, shoulder: 15, sleeve: 23.5 }, pairs: ['w-07', 'w-08', 'w-09'], goal: 'coat', version: 'synthetic', newPrice: 150, days: 6,
      desc: 'Warm, heavy herringbone tweed. Title says wool, the photo of the tag says 70% polyester.' },
    { id: 'etsy-031', source: 'Etsy', short: 'Red lace slip dress', title: 'Vintage bias-cut slip dress, brick red, lace trim', price: 32, ship: 5, cond: 'excellent', care: 'hand', type: 'dresses', kind: 'dress', color: '#9a2f24', colorName: 'rust', img: 'asset/slipDress.jpg',
      fibers: null, tags: { romantic: 0.8, '90s': 0.7, minimal: 0.5 }, meas: { chest: 40.5 }, pairs: ['w-10', 'w-13'], newPrice: 110, days: 4,
      desc: 'Silky bias-cut slip with lace at the neckline and waist. Lovely drape. No content tag.' },
    { id: 'etsy-007', source: 'Etsy', short: 'Wide-leg linen trousers', brand: 'Eileen Fisher', similar: ['Cos', 'Everlane'], title: 'Eileen Fisher wide-leg linen trousers, natural', price: 26, ship: 6, cond: 'excellent', care: 'machine', type: 'trousers', kind: 'trousers', color: '#d8ccb4', colorName: 'cream', img: 'asset/linenTrouser.jpg',
      fibers: [['linen', 100]], tags: { minimal: 0.8, boho: 0.3, workwear: 0.3 }, meas: { waist: 29.5, inseam: 31.5 }, pairs: ['w-01', 'w-02', 'w-04', 'w-05', 'w-06', 'w-10'], goal: 'trousers', version: 'natural', newPrice: 160, days: 2,
      desc: 'High rise, double front pleats, wide leg. Washed once, still crisp.' },
    { id: 'local-009', source: 'Local shop', short: 'Straight-leg jeans', brand: 'Levi’s', similar: ['Lee', 'Wrangler'], title: 'Levi’s straight jeans, mid wash', price: 14, ship: 0, local: true, cond: 'good', care: 'machine', type: 'jeans', kind: 'jeans', color: '#5b7a9c', colorName: 'blue', img: 'asset/jean.avif',
      fibers: [['cotton', 98], ['elastane', 2]], tags: { workwear: 0.6, '90s': 0.6, utility: 0.4, 'vintage-70s': 0.3 }, meas: { waist: 29, inseam: 31 }, pairs: ['w-01', 'w-04', 'w-05', 'w-06', 'w-10'], newPrice: 90, days: 8,
      desc: 'Classic straight leg in a soft mid wash. Long in the leg.' },
    { id: 'ebay-040', source: 'eBay', short: 'Pleated wool trousers', title: 'Grey wool pleated trousers, W25', price: 19, ship: 7, cond: 'excellent', care: 'dry', type: 'trousers', kind: 'trousers', color: '#8d8a85', colorName: 'grey',
      fibers: [['wool', 100]], tags: { tailored: 0.8, preppy: 0.6, minimal: 0.5 }, meas: { waist: 25, inseam: 29 }, pairs: ['w-01', 'w-04', 'w-10'], newPrice: 130, days: 3,
      desc: 'Beautiful tropical wool, double pleats. Waist measures 12.5 in flat.' },
    { id: 'shopgw-077', source: 'ShopGoodwill', short: 'Rose cable cardigan', title: 'Chunky cable cardigan, dusty rose', price: 12, ship: 8, cond: 'good', care: 'machine', type: 'knitwear', kind: 'cardigan', color: '#d6a7a1', colorName: 'rose',
      fibers: [['acrylic', 100]], tags: { cottagecore: 0.7, romantic: 0.4, 'vintage-70s': 0.3 }, meas: { chest: 44, sleeve: 23 }, pairs: ['w-04', 'w-08', 'w-12'], newPrice: 60, days: 1,
      desc: 'Cozy chunky knit, pearl buttons.' },
    { id: 'local-015', source: 'Local shop', short: 'Black cotton tee', brand: 'Uniqlo', title: 'Black cotton crew tee', price: 6, ship: 0, local: true, cond: 'excellent', care: 'machine', type: 'tops', kind: 'tee', color: '#262422', colorName: 'black', img: 'asset/blackTshirt.jpg',
      fibers: [['cotton', 100]], tags: { minimal: 0.9, streetwear: 0.4 }, meas: { chest: 40 }, pairs: ['w-07', 'w-08', 'w-09', 'w-11'], newPrice: 20, days: 0,
      desc: 'Plain heavyweight black tee.' },
    { id: 'etsy-052', source: 'Etsy', short: 'Ivory silk blouse', title: 'Ivory silk blouse, pin-tuck front', price: 18, ship: 5, cond: 'excellent', care: 'hand', type: 'tops', kind: 'blouse', color: '#efe8da', colorName: 'cream',
      fibers: [['silk', 100]], tags: { romantic: 0.7, tailored: 0.4, minimal: 0.4 }, meas: { chest: 38.5, shoulder: 14.5, sleeve: 23 }, pairs: ['w-07', 'w-09', 'w-11'], newPrice: 120, days: 9,
      desc: 'Fine pin-tucks down the front, mother-of-pearl buttons. Runs small.' },
    { id: 'ebay-063', source: 'eBay', short: 'Cotton field jacket', title: 'Cotton field jacket, olive brown, corduroy collar', price: 38, ship: 9, cond: 'good', care: 'machine', type: 'outerwear', kind: 'chore', color: '#5e4a2a', colorName: 'olive', img: 'asset/cottonJacket.jpg',
      fibers: [['cotton', 100]], tags: { workwear: 0.9, utility: 0.8, 'vintage-70s': 0.4 }, meas: { chest: 41, shoulder: 15.5, sleeve: 23.5 }, pairs: ['w-01', 'w-02', 'w-04', 'w-06', 'w-08', 'w-09'], newPrice: 150, days: 4,
      desc: 'Soft olive brown with a corduroy collar, two flap pockets and brass snaps.' },
    { id: 'etsy-090', source: 'Etsy', short: 'Cotton gabardine trench', title: 'Vintage cotton gabardine trench, stone', price: 78, ship: 12, cond: 'excellent', care: 'dry', type: 'outerwear', kind: 'trench', color: '#c4ad86', colorName: 'camel',
      fibers: [['cotton', 100]], tags: { tailored: 0.7, preppy: 0.7, minimal: 0.6 }, meas: { chest: 41, shoulder: 15, sleeve: 24 }, pairs: ['w-04', 'w-07', 'w-08', 'w-09', 'w-12'], newPrice: 320, days: 7,
      desc: 'Storm flap, belted, all original buttons. A forever coat.' }
  ];
  const ALT_TEXT = (l) => `${l.img ? l.short : `${cap1(l.colorName)} ${l.short.toLowerCase().replace(l.colorName + ' ', '')}`}, ${l.fibers ? l.fibers.map(([n, p]) => `${p}% ${n}`).join(', ') : 'fiber not listed'}`;

  const WARDROBE0 = [
    { id: 'w-01', name: 'Black cotton tee', type: 'tops', color: 'black', fibers: [['cotton', 100]], cond: 'great', acq: '2025-06' },
    { id: 'w-02', name: 'Black V-neck tee', type: 'tops', color: 'black', fibers: [['cotton', 100]], cond: 'great', acq: '2025-02' },
    { id: 'w-03', name: 'Black crew tee', type: 'tops', color: 'black', fibers: [['cotton', 60], ['polyester', 40]], cond: 'worn', acq: '2023-09', note: 'Faded, stretched at the collar' },
    { id: 'w-04', name: 'White oxford shirt', type: 'tops', color: 'white', kind: 'blouse', fibers: [['cotton', 100]], cond: 'great', acq: '2024-04' },
    { id: 'w-05', name: 'Cream linen shirt', type: 'tops', color: 'cream', kind: 'shirt', fibers: [['linen', 100]], cond: 'great', acq: '2025-05' },
    { id: 'w-06', name: 'Breton striped top', type: 'tops', color: 'navy', fibers: [['cotton', 100]], cond: 'great', acq: '2024-08' },
    { id: 'w-07', name: 'Olive work trousers', type: 'trousers', color: 'olive', fibers: [['cotton', 98], ['elastane', 2]], cond: 'great', acq: '2025-03', fitsWell: true },
    { id: 'w-08', name: 'Mid-blue straight jeans', type: 'jeans', color: 'blue', fibers: [['cotton', 99], ['elastane', 1]], cond: 'great', acq: '2024-11' },
    { id: 'w-09', name: 'Grey wool trousers', type: 'trousers', color: 'grey', fibers: [['wool', 100]], cond: 'repair', acq: '2022-10', note: 'Hem coming down' },
    { id: 'w-10', name: 'Navy wool cardigan', type: 'knitwear', color: 'navy', kind: 'cardigan', fibers: [['wool', 100]], cond: 'great', acq: '2023-12' },
    { id: 'w-11', name: 'Camel wool skirt', type: 'skirts', color: 'camel', fibers: [['wool', 80], ['nylon', 20]], cond: 'great', acq: '2024-10' },
    { id: 'w-12', name: 'Black midi dress', type: 'dresses', color: 'black', fibers: [['viscose', 100]], cond: 'great', acq: '2025-08' },
    { id: 'w-13', name: 'Khaki rain shell', type: 'outerwear', color: 'khaki', kind: 'shell', fibers: [['nylon', 100]], cond: 'great', acq: '2024-02' },
    { id: 'w-14', name: 'Cotton briefs, 3 pairs', type: 'underwear', color: 'cream', fibers: [['cotton', 95], ['elastane', 5]], cond: 'worn', acq: '2024-08', note: 'Stretched-out waistbands' },
    { id: 'w-15', name: 'Cotton bralette', type: 'underwear', color: 'white', kind: 'bralette', fibers: [['cotton', 92], ['elastane', 8]], cond: 'worn', acq: '2025-01', note: 'Pilling, fabric thinning' }
  ];

  const UNDERWEAR = [
    { id: 'uw-subset', brand: 'Subset', short: 'Organic cotton brief, 3-pack', pairs: 3, price: 45, fibers: [['cotton', 95], ['elastane', 5]], care: 'machine', kind: 'brief', color: '#efe7d6', url: 'https://thingtesting.com/brands/subset', note: 'Certified organic cotton. Runs the intimates recycling program.' },
    { id: 'uw-pact', brand: 'Pact', short: 'Organic cotton bikini, 3-pack', pairs: 3, price: 36, fibers: [['cotton', 95], ['elastane', 5]], care: 'machine', kind: 'brief', color: '#d8ccb4', url: 'https://wearpact.com', note: 'Widely available basics in many cuts.' },
    { id: 'uw-merino', brand: 'Icebreaker', short: 'Merino blend brief', pairs: 1, price: 38, fibers: [['merino', 83], ['nylon', 12], ['elastane', 5]], care: 'gentle', kind: 'brief', color: '#6f7350', url: 'https://www.icebreaker.com', note: 'Wool’s warmth and odor resistance. The nylon lowers the fiber score.' }
  ];

  const TAILORS = [
    { id: 't-clarita', name: 'The Magic Sewing by Clarita', addr: '2701 Alum Rock Ave, San Jose, CA 95127', dist: 6, bearing: 140, rating: 5.0, reviews: 41, days: [0, 1, 2, 3, 4, 5, 6], hours: 'Open 7 days', skills: ['suits', 'sleeves', 'dresses', 'fast'], tags: ['suits', 'dresses', 'quick turnaround'] },
    { id: 't-aamber', name: 'Aamber Alterations & Tailoring', addr: '169 S 15th St #1, San Jose, CA 95112', dist: 6.5, bearing: 168, rating: 4.8, reviews: 147, days: [0, 1, 2, 3, 4, 5, 6], hours: 'Open daily, late hours', skills: ['denim', 'hem', 'blind', 'fast'], tags: ['jeans hems, original stitching', 'blind stitch', 'rush jobs', 'apartment building'] },
    { id: 't-shamsher', name: 'Shamsher Tailor', addr: '4747 Piper St, Fremont, CA 94538', dist: 8, bearing: 318, rating: 5.0, reviews: 12, days: [0, 1, 2, 3, 4, 5, 6], hours: 'Open 7 days', skills: ['hem', 'trousers', 'fast'], tags: ['same-day trousers', 'low prices'] },
    { id: 't-minh', name: 'Minh Fashion Atelier', addr: '2050 Concourse Dr Ste 8, San Jose, CA 95131', dist: 2.5, bearing: 205, rating: 5.0, reviews: 11, days: [1, 2, 5, 6], hours: 'Mon, Tue, Fri, Sat 11 to 5', skills: ['dresses', 'bridal', 'denim', 'hem'], tags: ['dressmaking', 'bridal', 'jeans hems', 'texts when ready'] },
    { id: 't-express', name: 'Express Alterations', addr: '43464 Ellsworth St, Fremont, CA 94539', dist: 7, bearing: 342, rating: 4.7, reviews: 15, days: [1, 2, 3, 4, 5, 6], hours: 'Mon to Sat', skills: ['dresses'], tags: ['dresses', 'private fitting room'] },
    { id: 't-peter', name: 'Peter’s Tailor Shop', addr: '41255 Fremont Blvd, Fremont, CA 94538', dist: 7.5, bearing: 328, rating: 4.6, reviews: 13, days: [1, 2, 3, 5, 6], hours: 'Closed Thu & Sun', skills: ['hem', 'patches'], tags: ['hems', 'patches', 'ask price up front'] },
    { id: 't-perfect', name: 'Perfect Tailoring', addr: '200 Serra Way, Milpitas, CA 95035', dist: 0.8, bearing: 250, rating: 4.0, reviews: 51, days: null, hours: 'Hours on Maps', skills: [], tags: ['closest'] }
  ];
  const adjusted = (t) => (t.reviews / (t.reviews + 20)) * t.rating + (20 / (t.reviews + 20)) * 4.3;

  const CRITERIA = [
    { id: 'style', name: 'Style match', desc: 'How close it is to the looks you picked', lock: 'At least 60% similar to your style', color: '#e8b4ae' },
    { id: 'fiber', name: 'Natural fiber', desc: 'Share of natural fiber, by weight', lock: '90% natural or more', color: '#b5cdb2' },
    { id: 'fit', name: 'Fit', desc: 'After realistic tailoring', lock: 'Fits as-is or with tailoring', color: '#b3d4ec' },
    { id: 'cost', name: 'Total cost', desc: 'Item, shipping and tailoring vs. your budget', lock: 'Within budget. Same as choosing Strict on the Budget step', color: '#ecd59b' },
    { id: 'condition', name: 'Condition', desc: 'New with tags down to fair', lock: 'Excellent or better', color: '#dcd6ca' },
    { id: 'goesWith', name: 'Goes with my wardrobe', desc: 'Pieces you own it pairs with', lock: 'Pairs with 2 or more things you own', color: '#cbdab9' },
    { id: 'fillsGoal', name: 'Fills a goal', desc: 'Matches one of your open goals', lock: 'Must fill an open goal', color: '#f0c7b4' },
    { id: 'easyCare', name: 'Easy care', desc: 'Machine wash down to dry clean', lock: 'Machine washable', color: '#cddff0' },
    { id: 'local', name: 'Local / low shipping', desc: 'Pickup nearby or cheap to ship', lock: 'Local pickup only', color: '#d8c08f' },
    { id: 'brand', name: 'Preferred brands', desc: 'On your list, or similar', lock: 'On your brand list', color: '#cfcabb' }
  ];
  const IMP_WORDS = ['ignore', 'barely matters', 'matters a little', 'matters', 'matters a lot', 'matters most'];
  const WEIGHT_PRESETS = {
    'Fiber purist': { style: 2, fiber: 5, fit: 3, cost: 2, condition: 2, goesWith: 1, fillsGoal: 2, easyCare: 1, local: 0, brand: 0 },
    'Style first': { style: 5, fiber: 1, fit: 3, cost: 2, condition: 1, goesWith: 2, fillsGoal: 2, easyCare: 0, local: 0, brand: 2 },
    'Budget first': { style: 2, fiber: 2, fit: 3, cost: 5, condition: 1, goesWith: 2, fillsGoal: 3, easyCare: 1, local: 3, brand: 0 },
    'Low-maintenance': { style: 2, fiber: 2, fit: 3, cost: 2, condition: 2, goesWith: 2, fillsGoal: 1, easyCare: 5, local: 1, brand: 0 },
    'Closet-builder': { style: 3, fiber: 2, fit: 3, cost: 2, condition: 1, goesWith: 5, fillsGoal: 4, easyCare: 1, local: 0, brand: 0 }
  };
  const THIS_OR_THAT = [
    { q: 'A perfect-style polyester top, or a so-so linen top?', a: ['The polyester one. It’s the look.', { style: 2, fiber: -1 }], b: ['The linen one. My skin cares.', { fiber: 2, style: -1 }] },
    { q: 'A $20 shirt that needs a $15 hem, or a $35 shirt that fits as-is?', a: ['The $20 one. I’ll get it hemmed.', { cost: 2 }], b: ['The $35 one. Fit matters more.', { fit: 2 }] },
    { q: 'A dry-clean-only wool coat, or a machine-washable cotton one?', a: ['The wool. Worth the care.', { fiber: 1, style: 1 }], b: ['Machine-washable, please.', { easyCare: 2 }] },
    { q: 'A statement piece you love, or a basic that goes with ten things?', a: ['The statement piece.', { style: 1, goesWith: -1 }], b: ['The basic that works with everything.', { goesWith: 2, fillsGoal: 1 }] },
    { q: 'Ship it across the country, or pick it up this weekend?', a: ['Shipping is fine.', {}], b: ['I’d rather pick it up.', { local: 2 }] }
  ];
  const MEASURES = [
    { id: 'height', name: 'Height', how: 'Stand against a wall without shoes. Mark the top of your head and measure to the floor.' },
    { id: 'bust', name: 'Bust / chest', how: 'Around the fullest part of your chest, tape level under the arms.' },
    { id: 'waist', name: 'Waist', how: 'Around your natural waist, the narrowest point above the belly button.' },
    { id: 'hips', name: 'Hips', how: 'Around the fullest part of your hips and seat, feet together.' },
    { id: 'inseam', name: 'Inseam', how: 'From the crotch to the floor along the inside of the leg, no shoes.' },
    { id: 'shoulder', name: 'Shoulder width', how: 'Across your back from one shoulder bone to the other.' },
    { id: 'sleeve', name: 'Sleeve length', how: 'From the shoulder seam down a slightly bent arm to the wrist bone.' }
  ];
  const SIZE_TABLE = {
    XS: { height: 63, bust: 32, waist: 25, hips: 35, inseam: 29, shoulder: 14, sleeve: 22.5 },
    S: { height: 64, bust: 34, waist: 27, hips: 37, inseam: 29.5, shoulder: 14.5, sleeve: 23 },
    M: { height: 65, bust: 36, waist: 29, hips: 39, inseam: 30, shoulder: 15, sleeve: 23.5 },
    L: { height: 66, bust: 39, waist: 32, hips: 42, inseam: 30.5, shoulder: 15.5, sleeve: 24 },
    XL: { height: 67, bust: 42, waist: 35, hips: 45, inseam: 31, shoulder: 16, sleeve: 24.5 }
  };
  const FIT_TYPES = [['tops', 'Tops'], ['knitwear', 'Knitwear'], ['trousers', 'Trousers & jeans'], ['outerwear', 'Outerwear & suiting'], ['dresses', 'Dresses']];
  const EASE = { chest: { fitted: 2, regular: 4, relaxed: 6, oversized: 10 }, waist: { fitted: 0.5, regular: 1, relaxed: 2, oversized: 3 } };
  const ALT_PRICES = { hem: [12, 25], waist: [20, 40], sleeves: [20, 45], sides: [20, 40], dressHem: [25, 60], taper: [20, 35] };

  const GOALS0 = [
    { id: 'underwear', name: 'Underwear restock', short: 'underwear', imp: 10, start: 1, end: 4, nat: { cost: 45, p: 1 }, syn: null, newOnly: true, natLabel: 'organic cotton', auto: 'underwear' },
    { id: 'coat', name: 'Winter coat', short: 'wool-coat', imp: 8, start: 1, end: 6, nat: { cost: 55, p: 0.25 }, syn: { cost: 35, p: 0.5 }, natLabel: 'wool', auto: 'gap-coat', costNote: 'with sleeves shortened' },
    { id: 'sweater', name: 'Cream sweater', short: 'wool-sweater', imp: 5, start: 1, end: 12, nat: { cost: 28, p: 0.35 }, syn: { cost: 18, p: 0.5 }, natLabel: 'wool', auto: 'gap-knit' },
    { id: 'trousers', name: 'Linen trousers for spring', short: 'linen-trousers', imp: 4, start: 4, end: 12, nat: { cost: 30, p: 0.3 }, syn: { cost: 20, p: 0.5 }, natLabel: 'linen', auto: null }
  ];

  /* =========================================================
     State (in memory only, as the spec asks)
     ========================================================= */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function freshState() {
    return {
      styles: new Set(['minimal', 'tailored', '90s']),
      garments: new Set(['tops', 'knitwear', 'trousers', 'jeans', 'outerwear', 'suiting']),
      colors: new Set(),
      hunt: '',
      brands: ['Eileen Fisher', 'Levi’s'],
      units: 'in',
      body: { height: 64, bust: 34, waist: 28, hips: 38, inseam: 29, shoulder: 15, sleeve: 23 },
      uwSize: 'S',
      fitSize: 'M',
      estimated: new Set(),
      fitPref: { tops: 'relaxed', knitwear: 'oversized', trousers: 'regular', outerwear: 'regular', dresses: 'regular' },
      wardrobe: clone(WARDROBE0),
      pending: [],
      railFilter: null,
      budget: { now: 60, allowance: 10, per: 'week', cap: 60, include: true, mode: 'flexible', envOn: false, env: { thrift: 60, tailoring: 30, underwear: 45, other: 15 } },
      spent: [],
      mode: 'quick',
      balance: 0.5,
      imp: { style: 4, fiber: 3, fit: 3, cost: 2, condition: 1, goesWith: 4, fillsGoal: 3, easyCare: 1, local: 0, brand: 0 },
      locks: new Set(['fit']),
      dealbreakers: new Set(['acrylic']),
      semiHalf: true,
      stretchOn: true,
      goals: clone(GOALS0),
      filled: {},
      whatIf: { now: 0, allow: 0, deadline: 0 },
      sort: 'match',
      filters: { types: new Set(), sources: new Set(), maxPrice: null, withinOnly: false, localOnly: false, goalOnly: false, fit: new Set() },
      show: { rules: false, fit: false, budget: false, must: false },
      pinned: new Set(),
      dismissed: new Set(),
      saved: new Map(),
      openWhy: new Set(),
      uwInterval: 12,
      uwManual: false,
      radius: 10,
      showAllTailors: false,
      tailorJob: null,
      visited: new Set(),
      signals: { synthHearts: 0, synthDismiss: 0, fiberLooks: 0 },
      suggested: new Set(),
      tot: null,
      lastGoalChance: {},
      hunt: 'auto',
      targets: { underwear: 0.95, coat: 0.8, sweater: 0.6, trousers: 0.5 },
      tune: null,
      band: { goal: 'coat', week: 2, seen: 3 }
    };
  }
  let state = freshState();

  /* =========================================================
     Fiber, fit, budget and match scoring
     ========================================================= */
  const isBottom = (type) => type === 'trousers' || type === 'jeans' || type === 'skirts';
  function fiberInfo(fibers, type) {
    if (!fibers || !fibers.length) return { unknown: true, score: 0.3, natural: 0, segs: [], label: 'Fiber not listed' };
    const stretchMax = state.stretchOn ? (type === 'underwear' ? 10 : isBottom(type) ? 5 : 0) : 0;
    let denom = 0; let sum = 0; let nat = 0;
    const segs = fibers.map(([name, p]) => {
      const cls = FIBER_CLASS[name] || 'syn';
      const ignored = name === 'elastane' && p <= stretchMax;
      if (!ignored) {
        denom += p;
        const v = cls === 'nat' ? 1 : cls === 'semi' ? (state.semiHalf ? 0.5 : 0) : 0;
        sum += p * v;
        if (cls === 'nat') nat += p;
      }
      return { name, p, cls: ignored ? 'ign' : cls };
    });
    const score = denom ? sum / denom : 0;
    return { unknown: false, score, natural: denom ? nat / denom : 0, segs, label: fibers.map(([n, p]) => `${p}% ${n}`).join(' · ') };
  }
  function fiberBar(fi) {
    if (fi.unknown) return `<div class="fiber"><div class="fiber-bar unknown" aria-hidden="true"></div><p class="fiber-text"><span>Fiber not listed</span><b>Verify fiber</b></p></div>`;
    const ign = fi.segs.some((s) => s.cls === 'ign');
    return `<div class="fiber"><div class="fiber-bar" aria-hidden="true">${fi.segs.map((s) => `<span class="${s.cls}" style="flex-grow:${s.p}"></span>`).join('')}</div>`
      + `<p class="fiber-text"><span>${esc(fi.label)}${ign ? ' <i>(stretch ignored)</i>' : ''}</span><b>${pct(fi.score)} natural score</b></p></div>`;
  }
  const hitsDealbreaker = (fibers) => !!fibers && fibers.some(([n]) => state.dealbreakers.has(n === 'viscose' ? 'rayon' : n === 'merino' ? 'wool' : n));

  const prefKey = (type) => ({ tops: 'tops', knitwear: 'knitwear', trousers: 'trousers', jeans: 'trousers', skirts: 'trousers', dresses: 'dresses', outerwear: 'outerwear', suiting: 'outerwear' }[type] || 'tops');
  const RANK = { ok: 0, alter: 1, hard: 2, no: 3 };
  function fitEval(item) {
    if (!item.meas) return { status: 'unknown', score: 0.5, alts: [], zones: [], altMid: 0, lo: 0, hi: 0 };
    const b = state.body; const m = item.meas;
    const pref = state.fitPref[prefKey(item.type)];
    const zones = []; const alts = [];
    const add = (z) => zones.push(z);
    if (m.chest != null) {
      const target = b.bust + EASE.chest[pref] + (item.type === 'outerwear' || item.type === 'suiting' ? 2 : 0);
      const d = m.chest - target;
      const z = { key: 'chest', label: 'Chest', garment: m.chest, target, diff: d };
      if (Math.abs(d) <= 1) Object.assign(z, { status: 'ok', note: 'Fits as-is' });
      else if (d > 1 && d <= 6) { Object.assign(z, { status: 'alter', note: `${fmtIn(d)} roomy. Take in the side seams.` }); alts.push({ key: 'sides', name: item.type === 'dresses' ? 'Take in side seams' : 'Take in sides', amount: d, range: ALT_PRICES.sides, skills: item.type === 'dresses' ? ['dresses'] : ['dresses', 'suits'] }); }
      else if (d > 6) Object.assign(z, { status: 'hard', note: `${fmtIn(d)} too big to take in neatly` });
      else if (d >= -2) Object.assign(z, { status: 'hard', note: `${fmtIn(-d)} snug. Letting out depends on seam allowance.` });
      else Object.assign(z, { status: 'no', note: `${fmtIn(-d)} too small at the chest` });
      add(z);
    }
    if (m.shoulder != null) {
      const d = m.shoulder - b.shoulder;
      const z = { key: 'shoulder', label: 'Shoulders', garment: m.shoulder, target: b.shoulder, diff: d };
      if (Math.abs(d) <= 1) Object.assign(z, { status: 'ok', note: 'Shoulders sit right' });
      else Object.assign(z, { status: 'no', note: `Shoulders off by ${fmtIn(Math.abs(d))}. Shoulders are the hardest thing to change.` });
      add(z);
    }
    if (m.sleeve != null) {
      const d = m.sleeve - b.sleeve;
      const z = { key: 'sleeve', label: 'Sleeves', garment: m.sleeve, target: b.sleeve, diff: d };
      if (Math.abs(d) <= 1) Object.assign(z, { status: 'ok', note: 'Sleeve length is right' });
      else if (d > 1) { Object.assign(z, { status: 'alter', note: `${fmtIn(d)} long. Shorten from the cuff.` }); alts.push({ key: 'sleeves', name: 'Shorten sleeves', amount: d, range: ALT_PRICES.sleeves, skills: ['suits', 'sleeves'] }); }
      else if (d >= -2) Object.assign(z, { status: 'hard', note: `${fmtIn(-d)} short. Only fixable if there’s hem allowance.` });
      else Object.assign(z, { status: 'no', note: `${fmtIn(-d)} too short in the sleeve` });
      add(z);
    }
    if (m.waist != null) {
      const target = b.waist + EASE.waist[pref];
      const d = m.waist - target;
      const z = { key: 'waist', label: 'Waist', garment: m.waist, target, diff: d };
      if (Math.abs(d) <= 1) Object.assign(z, { status: 'ok', note: 'Waist fits' });
      else if (d > 1 && d <= 4) { Object.assign(z, { status: 'alter', note: `${fmtIn(d)} big. Take in the waist.` }); alts.push({ key: 'waist', name: 'Take in waist', amount: d, range: ALT_PRICES.waist, skills: ['trousers', 'hem'] }); }
      else if (d > 4) Object.assign(z, { status: 'hard', note: `${fmtIn(d)} big, more than a clean take-in` });
      else if (d >= -2) Object.assign(z, { status: 'hard', note: `${fmtIn(-d)} snug. Letting out is limited by seam allowance.` });
      else Object.assign(z, { status: 'no', note: `${fmtIn(-d)} too small at the waist` });
      add(z);
    }
    if (m.inseam != null) {
      const d = m.inseam - b.inseam;
      const z = { key: 'inseam', label: 'Length', garment: m.inseam, target: b.inseam, diff: d };
      if (Math.abs(d) <= 1) Object.assign(z, { status: 'ok', note: 'Length is right' });
      else if (d > 1) { Object.assign(z, { status: 'alter', note: `${fmtIn(d)} long. Hem it.` }); alts.push({ key: 'hem', name: 'Hem', suffix: item.type === 'jeans' ? 'keep the original stitching' : '', amount: d, range: ALT_PRICES.hem, skills: item.type === 'jeans' ? ['denim', 'hem'] : ['hem'] }); }
      else if (d >= -1.5) Object.assign(z, { status: 'hard', note: `${fmtIn(-d)} short. Let down only if there’s a deep hem.` });
      else Object.assign(z, { status: 'no', note: `${fmtIn(-d)} too short` });
      add(z);
    }
    const worst = zones.reduce((w, z) => (RANK[z.status] > RANK[w] ? z.status : w), 'ok');
    const lo = alts.reduce((s, a) => s + a.range[0], 0);
    const hi = alts.reduce((s, a) => s + a.range[1], 0);
    const altMid = (lo + hi) / 2;
    let score = 1;
    if (worst === 'alter') score = clamp(0.9 - 0.1 * (alts.length - 1) - (altMid > 30 ? 0.1 : 0), 0.6, 0.9);
    if (worst === 'hard') score = 0.3;
    if (worst === 'no') score = 0;
    return { status: worst, score, alts, zones, altMid: worst === 'alter' ? altMid : 0, lo, hi };
  }
  const altLabel = (a) => `${a.name} ${fmtIn(a.amount)}${a.suffix ? `, ${a.suffix}` : ''}`;
  function fmtIn(inches) {
    const v = state.units === 'cm' ? inches * 2.54 : inches;
    return `${fmtNum.format(round2(v))} ${state.units}`;
  }

  const weekly = () => (state.budget.per === 'week' ? state.budget.allowance : state.budget.allowance * 12 / 52);
  const spentTotal = () => state.spent.reduce((s, e) => s + e.amount, 0);
  const remaining = () => state.budget.now - spentTotal();
  const envSpent = (k) => state.spent.reduce((s, e) => s + ((e.env && e.env[k]) || 0), 0);
  const envLeft = (k) => state.budget.env[k] - envSpent(k);
  const hasBudget = () => state.budget.now > 0 || state.budget.allowance > 0;
  const isStrict = () => state.budget.mode === 'strict';

  function totalCost(item, fit) {
    if (item.id.startsWith('uw-')) return item.price;
    return round2(state.budget.include ? item.price + item.ship + fit.altMid : item.price);
  }
  function budgetEval(item, fit, total) {
    if (!hasBudget()) return { status: 'none', score: null, total };
    const B = state.budget;
    const cap = B.cap > 0 ? B.cap : Infinity;
    const envName = item.id.startsWith('uw-') ? 'underwear' : 'thrift';
    let pool = remaining();
    if (B.envOn) pool = envLeft(envName) + (fit && fit.altMid && B.include ? Math.max(0, Math.min(fit.altMid, envLeft('tailoring'))) : 0);
    const limit = Math.min(cap, pool);
    const A = weekly();
    if (total <= limit) return { status: 'within', score: limit > 0 ? clamp(1 - total / limit, 0, 1) : 0, total, limit, after: remaining() - total };
    if (total <= cap) {
      const weeks = A > 0 ? Math.ceil((total - pool) / A) : Infinity;
      if (weeks <= 12) return { status: 'wait', weeks, score: 0, total, limit };
    }
    if (!isStrict() && total <= 1.2 * limit) return { status: 'over', over: total - limit, score: 0, total, limit, after: remaining() - total };
    return { status: 'hidden', score: 0, total, limit, over: total - limit };
  }

  function userVec() {
    const v = {};
    state.styles.forEach((s) => { v[s] = 1; });
    return v;
  }
  function styleScore(item) {
    if (!item.tags) return 0.5;
    const u = userVec();
    const keys = Object.keys(u);
    if (!keys.length) return 0.5;
    let dot = 0; let nv = 0;
    Object.entries(item.tags).forEach(([k, w]) => { nv += w * w; if (u[k]) dot += w; });
    let s = dot / (Math.sqrt(keys.length) * Math.sqrt(nv));
    const words = state.hunt.toLowerCase().split(/[^a-z0-9’']+/).filter((w) => w.length >= 4);
    const hay = `${item.title} ${item.short} ${item.colorName}`.toLowerCase();
    s += Math.min(0.12, words.filter((w) => hay.includes(w)).length * 0.04);
    if (state.colors.size && state.colors.has(item.colorName)) s += 0.05;
    if (item.type && !state.garments.has(item.type)) s *= 0.85;
    return clamp(s, 0, 1);
  }
  const COND = { nwt: 1, excellent: 0.85, good: 0.6, fair: 0.3 };
  const CAREV = { machine: 1, gentle: 0.6, hand: 0.3, dry: 0 };
  const ownedIds = () => new Set(state.wardrobe.map((w) => w.id));
  function goesWithCount(item) { const owned = ownedIds(); return (item.pairs || []).filter((id) => owned.has(id)).length; }
  function brandScore(item) {
    const list = state.brands.map((b) => b.toLowerCase().replace(/[’']/g, ''));
    const n = (s) => s.toLowerCase().replace(/[’']/g, '');
    if (item.brand && list.includes(n(item.brand))) return 1;
    if (item.similar && item.similar.some((s) => list.includes(n(s)))) return 0.5;
    return 0;
  }

  function weights() {
    if (state.mode === 'quick') {
      const w = state.balance;
      return { style: 4 * w, fiber: 4 * (1 - w), fit: 1, cost: 0, condition: 0, goesWith: 0, fillsGoal: 0, easyCare: 0, local: 0, brand: 0 };
    }
    return { ...state.imp };
  }
  function styleShare() {
    if (state.mode === 'quick') return state.balance;
    const s = state.imp.style; const f = state.imp.fiber;
    return s + f ? s / (s + f) : 0.5;
  }
  function partialShare() {
    const w = styleShare();
    const pts = [[0, 0.1], [0.2, 0.2], [0.5, 0.6], [0.9, 0.9], [1, 0.95]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
      if (w <= x1) return y0 + (y1 - y0) * (w - x0) / (x1 - x0);
    }
    return 0.95;
  }

  function evaluate(item) {
    const isUw = item.id.startsWith('uw-');
    const type = isUw ? 'underwear' : item.type;
    const fi = fiberInfo(item.fibers, type);
    const fit = isUw ? { status: 'ok', score: 1, alts: [], zones: [], altMid: 0 } : fitEval(item);
    const total = totalCost(item, fit);
    const bud = budgetEval(item, fit, total);
    const goal = item.goal || (isUw ? 'underwear' : null);
    const g = goal && activeGoals().find((x) => x.id === goal);
    const scores = {
      style: isUw ? 0.5 : styleScore(item),
      fiber: fi.score,
      fit: fit.score,
      cost: bud.score,
      condition: isUw ? 1 : COND[item.cond] ?? 0.6,
      goesWith: isUw ? null : Math.min(goesWithCount(item) / 5, 1),
      fillsGoal: g && !state.filled[g.id] ? 1 : 0,
      easyCare: CAREV[item.care] ?? 0.5,
      local: isUw ? null : item.local ? 1 : Math.max(0, 1 - item.ship / 15),
      brand: brandScore(item)
    };
    const w = weights();
    let num = 0; let den = 0;
    CRITERIA.forEach((c) => { const s = scores[c.id]; if (w[c.id] > 0 && s != null) { num += w[c.id] * s; den += w[c.id]; } });
    const match = den ? num / den : 0;
    const failsMust = [...state.locks].filter((k) => {
      const s = scores[k];
      if (k === 'style') return s < 0.6;
      if (k === 'fiber') return s < 0.9;
      if (k === 'fit') return s < 0.6;
      if (k === 'cost') return bud.status !== 'within' && bud.status !== 'none';
      if (k === 'condition') return s < 0.85;
      if (k === 'goesWith') return s != null && s < 0.4;
      if (k === 'fillsGoal') return s < 1;
      if (k === 'easyCare') return s < 1;
      if (k === 'local') return isUw ? false : !item.local;
      if (k === 'brand') return s < 1;
      return false;
    });
    return { item, fi, fit, total, bud, scores, match, w, den, failsMust, deal: hitsDealbreaker(item.fibers), goal: g };
  }

  /* =========================================================
     Wardrobe analysis
     ========================================================= */
  const monthsSince = (ym) => {
    if (!ym) return 0;
    const [y, m] = ym.split('-').map(Number);
    return (TODAY.getFullYear() - y) * 12 + (TODAY.getMonth() + 1 - m);
  };
  function underwearFlags() {
    const out = [];
    state.wardrobe.filter((w) => w.type === 'underwear').forEach((w) => {
      const why = [];
      if (w.cond !== 'great') why.push(w.note ? `Worn: ${w.note.toLowerCase()}` : 'Marked worn');
      if (state.uwInterval > 0 && w.acq && monthsSince(w.acq) > state.uwInterval) why.push(`Bought ${fmtMonth.format(new Date(w.acq + '-15'))}, past your ${state.uwInterval}-month interval`);
      if (why.length) out.push({ item: w, why });
    });
    return out;
  }
  const isWarm = (w) => w.type === 'outerwear' && (w.fibers || []).some(([n, p]) => ['wool', 'cashmere', 'alpaca', 'camel', 'merino'].includes(n) && p >= 50);
  function gaps() {
    const ws = state.wardrobe;
    const g = [];
    if (!ws.some(isWarm)) g.push({ id: 'gap-coat', text: 'No warm coat' });
    const knits = ws.filter((w) => w.type === 'knitwear').length;
    if (knits < 2) g.push({ id: 'gap-knit', text: knits ? 'One knit. A capsule wants two.' : 'No knitwear' });
    if (ws.filter((w) => w.type === 'trousers' || w.type === 'jeans').length < 2) g.push({ id: 'gap-trousers', text: 'Fewer than two trousers' });
    if (ws.filter((w) => w.type === 'tops').length < 3) g.push({ id: 'gap-tops', text: 'Fewer than three tops' });
    return g;
  }
  function wardrobeFlags() {
    const uw = underwearFlags().map((f) => ({ ...f, kind: 'underwear' }));
    const other = state.wardrobe.filter((w) => w.type !== 'underwear' && w.cond !== 'great').map((w) => ({ item: w, why: [w.cond === 'repair' ? `Needs repair${w.note ? `: ${w.note.toLowerCase()}` : ''}` : `Worn${w.note ? `: ${w.note.toLowerCase()}` : ''}`], kind: w.cond }));
    return [...uw, ...other];
  }
  function activeGoals() {
    const gapIds = new Set(gaps().map((g) => g.id));
    return state.goals.filter((g) => {
      if (g.auto === 'underwear') return underwearFlags().length > 0 || state.uwManual || state.filled.underwear;
      if (g.auto && g.auto.startsWith('gap-')) return gapIds.has(g.auto) || state.filled[g.id];
      return true;
    });
  }
  function goalSource(g) {
    if (g.auto === 'underwear') { const n = underwearFlags().length; return n ? `From ${n} flagged ${n === 1 ? 'item' : 'items'} in your wardrobe` : 'You asked for new pairs'; }
    if (g.auto === 'gap-coat') return 'Gap found: no warm coat';
    if (g.auto === 'gap-knit') return 'Gap found: one knit, a capsule wants two';
    return 'Added by you';
  }
  function fiberOfWardrobe(w) { return fiberInfo(w.fibers, w.type); }

  /* =========================================================
     Goal plan. The solver lives in planner.js and follows
     Das, Ostrov, Radhakrishnan & Srivastav (2022): cost/utility
     vectors (§2.3), Bellman equation (4) over purchases k and
     hunting strategies l, and the forwards equation (5).
     ========================================================= */
  const Planner = window.SeamPlanner;
  const WEEKS = Planner.WEEKS;
  const STRATS = Planner.STRATEGIES;
  const planCache = new Map();
  const strategiesFor = (hunt) => (hunt === 'auto' ? STRATS : STRATS.filter((s) => s.id === hunt));
  function solvePlan(goals, start, allow, partial, hunt = state.hunt) {
    const key = JSON.stringify([goals.map((g) => [g.imp, g.start, g.end, g.nat, g.syn, !!g.newOnly]), start, allow, round2(partial), hunt]);
    if (planCache.has(key)) return planCache.get(key);
    const res = Planner.solve({ goals, start, allow, partial, strategies: strategiesFor(hunt) });
    planCache.set(key, res);
    if (planCache.size > 120) planCache.delete(planCache.keys().next().value);
    return res;
  }
  function planInputs(extraSpend = 0) {
    const dl = state.whatIf.deadline;
    const open = activeGoals().filter((g) => !state.filled[g.id]).map((g) => (dl ? { ...g, end: Math.min(WEEKS, g.end + dl) } : g));
    const start = Math.max(0, Math.round(remaining() + state.whatIf.now - extraSpend));
    const allow = Math.max(0, Math.round(weekly() + state.whatIf.allow));
    return { open, start, allow, partial: partialShare() };
  }
  // Full solver output for the open goals, or null when nothing is open.
  function planFull(extraSpend = 0, hunt = state.hunt) {
    const { open, start, allow, partial } = planInputs(extraSpend);
    return open.length ? { open, sol: solvePlan(open, start, allow, partial, hunt) } : { open, sol: null };
  }
  function runPlan(extraSpend = 0, hunt = state.hunt) {
    const { open, sol } = planFull(extraSpend, hunt);
    const out = {};
    open.forEach((g, i) => { out[g.id] = sol.goals[i]; });
    activeGoals().forEach((g) => { if (state.filled[g.id]) out[g.id] = { nat: state.filled[g.id] === 'natural' ? 1 : 0, syn: state.filled[g.id] === 'synthetic' ? 1 : 0, total: 1, done: true }; });
    return out;
  }
  const goalTarget = (g) => (state.targets[g.id] != null ? state.targets[g.id] : g.newOnly ? 0.95 : 0.6);
  const fmtImp = (u) => (Math.abs(u - Math.round(u)) < 0.05 ? String(Math.round(u)) : u.toFixed(1));

  /* =========================================================
     Small UI utilities
     ========================================================= */
  const announcer = $('#announce');
  function announce(msg) {
    announcer.textContent = '';
    requestAnimationFrame(() => { announcer.textContent = msg; });
  }
  const toastBox = $('#toasts');
  function toast(msg, actions = [], ms = 7000) {
    while (toastBox.children.length >= 2) toastBox.firstElementChild.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<p>${esc(msg)}</p>${actions.length ? `<div class="toast-actions">${actions.map((a, i) => `<button type="button" class="${a.primary ? 'primary' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}`;
    let timer;
    const close = () => { clearTimeout(timer); el.remove(); };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      const a = actions[Number(b.dataset.i)];
      close();
      if (a && a.fn) a.fn();
    });
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', () => { timer = setTimeout(close, ms); });
    toastBox.append(el);
    timer = setTimeout(close, ms);
  }
  function flip(container, fn) {
    if (reduceMotion()) { fn(); return; }
    const before = new Map($$('[data-key]', container).map((el) => [el.dataset.key, el.getBoundingClientRect().top]));
    fn();
    $$('[data-key]', container).forEach((el) => {
      const was = before.get(el.dataset.key);
      if (was == null) return;
      const dy = was - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) return;
      el.style.transform = `translateY(${dy}px)`;
      el.style.transition = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1)';
        el.style.transform = '';
      }));
    });
  }
  async function copyText(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); } catch (e) { toast('Couldn’t reach the clipboard. Select the list and copy it by hand.'); }
  }
  const tip = $('#tip');
  function showTip(text, target) {
    tip.textContent = text;
    tip.hidden = false;
    const r = target.getBoundingClientRect();
    const tw = tip.offsetWidth;
    tip.style.left = `${clamp(r.left + r.width / 2 - tw / 2, 8, window.innerWidth - tw - 8)}px`;
    tip.style.top = `${Math.max(8, r.top - tip.offsetHeight - 10)}px`;
  }
  const hideTip = () => { tip.hidden = true; };

  const ICON = {
    ok: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    alter: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="4" cy="4.5" r="2" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="4" cy="11.5" r="2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5.6 5.6L14 12M5.6 10.4L14 4" stroke="currentColor" stroke-width="1.2"/></svg>',
    hard: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2l6.5 12h-13z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 6.5v3.5M8 11.6v.8" stroke="currentColor" stroke-width="1.4"/></svg>',
    no: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.3"/></svg>',
    unknown: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="2 2"/><path d="M6.3 6.4a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.5-.7 1v.4M8 11.4v.7" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    money: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="4" width="13" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    wait: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2h8M4 14h8M5 2c0 4 6 4 6 6s-6 2-6 6M11 2c0 4-6 4-6 6s6 2 6 6" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>',
    goal: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    heart: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16.5s-6.5-3.9-6.5-8.6A3.4 3.4 0 0 1 10 6.2a3.4 3.4 0 0 1 6.5 1.7c0 4.7-6.5 8.6-6.5 8.6z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    needle: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 14L13 3" stroke="currentColor" stroke-width="1.2"/><ellipse cx="12.6" cy="3.4" rx="1.3" ry=".6" transform="rotate(-45 12.6 3.4)" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M2 14c3-1 2-4 5-5" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="1.4 1.2"/></svg>',
    lock: '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="2.5" y="6" width="9" height="6.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 6V4.2a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'
  };
  const FIT_LABEL = { ok: 'Fits as-is', alter: 'Fits with tailoring', hard: 'Hard to alter', no: 'Won’t fit', unknown: 'Ask for measurements' };
  function fitBadge(fit) {
    const cls = fit.status === 'unknown' ? 'info' : fit.status;
    const extra = fit.status === 'alter' ? ` (~${money(fit.altMid)})` : '';
    return `<span class="badge ${cls}">${ICON[fit.status]}${FIT_LABEL[fit.status]}${extra}</span>`;
  }
  function budgetBadge(b) {
    if (b.status === 'within') return `<span class="badge ok">${ICON.money}Within budget</span>`;
    if (b.status === 'over') return `<span class="badge hard">${ICON.hard}${money(Math.round(b.over))} over</span>`;
    if (b.status === 'wait') return `<span class="badge wait">${ICON.wait}Affordable in ${b.weeks} ${b.weeks === 1 ? 'week' : 'weeks'}</span>`;
    if (b.status === 'hidden') return `<span class="badge no">${ICON.no}Over budget</span>`;
    return '';
  }
  function ring(nat, syn, size = 'normal') {
    const r = 38; const C = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--linen)" stroke-width="9"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--sage)" stroke-width="9" stroke-dasharray="${(nat * C).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 50 50)"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--blue)" stroke-width="9" stroke-dasharray="${(syn * C).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-nat * C).toFixed(2)}" transform="rotate(-90 50 50)"/>
      <text x="50" y="${size === 'normal' ? 47 : 50}" text-anchor="middle" dominant-baseline="central" font-size="21" font-weight="300">${pct(nat + syn)}</text>
      ${size === 'normal' ? '<text x="50" y="66" text-anchor="middle" font-size="8.5" letter-spacing="1.2" fill="var(--ink-faint)">FILLED</text>' : ''}
    </svg>`;
  }

  /* =========================================================
     Header and budget meters
     ========================================================= */
  function renderHeader() {
    const B = state.budget;
    const left = remaining();
    const txt = hasBudget() ? `${money(Math.max(0, Math.round(left)))} of ${money(B.now)} left` : 'No budget set';
    $('#budget-pill-text').textContent = txt;
    $('#budget-pill').setAttribute('aria-label', `Budget: ${txt}. Edit budget.`);
    $('#budget-pill-fill').style.transform = `scaleX(${B.now > 0 ? clamp(left / B.now, 0, 1) : 0})`;
    const n = state.saved.size;
    $$('[data-saved-count]').forEach((el) => { el.textContent = n || ''; });
  }
  function meterHTML() {
    const B = state.budget; const s = spentTotal(); const left = B.now - s;
    const pctSpent = B.now > 0 ? clamp(s / B.now, 0, 1) * 100 : 0;
    return `<div class="meter-bar" aria-hidden="true"><span class="spent" style="width:${pctSpent}%"></span><span class="left" style="width:${100 - pctSpent}%"></span></div>
      <p class="meter-text"><span><strong>${money(Math.max(0, round2(left)))}</strong> of ${money(B.now)} left</span><span>${money(round2(s))} spent</span></p>`;
  }

  /* =========================================================
     Screen 1: welcome art
     ========================================================= */
  function renderHero() {
    $('#hero-art').innerHTML = `<svg viewBox="0 0 200 250" aria-hidden="true" focusable="false">
      <g class="hang">
        <path d="M100 8 q7 0 7 7 q0 6 -7 8 L42 50 H158 L100 23" fill="none" stroke="var(--ink-faint)" stroke-width="1.6" stroke-linejoin="round"/>
        <svg x="22" y="36" width="156" height="182" viewBox="0 0 120 140">${garmentInner('coat', '#b08a5e')}
          <path d="M88 104 L104 101" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="2.4 1.8"/>
          <path d="M16 101 L32 104" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="2.4 1.8"/>
        </svg>
        <path d="M136 132 l14 26" stroke="var(--ink-faint)" stroke-width=".7"/>
        <g transform="rotate(14 156 170)"><rect x="146" y="158" width="24" height="34" rx="2" fill="var(--vellum)" stroke="var(--rule-strong)"/><circle cx="158" cy="163" r="1.6" fill="none" stroke="var(--rule-strong)"/><text x="158" y="181" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="9" fill="var(--ink)">$30</text></g>
      </g>
      <text x="168" y="222" text-anchor="end" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="10" fill="var(--ink-faint)">shorten 1½ in</text>
    </svg>`;
  }

  /* =========================================================
     Screen 2: style quiz
     ========================================================= */
  function buildStyle() {
    $('#style-tiles').innerHTML = STYLES.map((s) => {
      const pal = [s.top[1], s.bottom ? s.bottom[1] : null].filter(Boolean);
      return `<label class="tile"><input type="checkbox" name="style" value="${s.id}" ${state.styles.has(s.id) ? 'checked' : ''}>
        <span class="tile-face"><span class="tile-art">${outfit(s.top, s.bottom)}<span class="tile-check" aria-hidden="true"></span></span>
        <span class="tile-name">${esc(s.name)}<span class="tile-pal" aria-hidden="true">${pal.map((c) => `<i style="background:${c}"></i>`).join('')}</span></span></span></label>`;
    }).join('');
    $('#garment-chips').innerHTML = GARMENT_TYPES.map((g) => `<label class="chip"><input type="checkbox" name="garment" value="${g}" ${state.garments.has(g) ? 'checked' : ''}><span>${cap1(g)}</span></label>`).join('');
    $('#color-chips').innerHTML = `<label class="chip"><input type="checkbox" name="color-none" value="none" ${state.colors.size ? '' : 'checked'}><span>No preference</span></label>`
      + COLORS.map((c) => `<label class="chip"><input type="checkbox" name="color" value="${c.id}" ${state.colors.has(c.id) ? 'checked' : ''}><span><i class="swatch-dot" style="background:${c.hex}" aria-hidden="true"></i>${cap1(c.id)}</span></label>`).join('');
    $('#hunt').value = state.hunt;
    $('#brands').value = state.brands.join(', ');
    syncTileCount();
  }
  function syncTileCount() {
    const n = state.styles.size;
    $('#tile-count').textContent = `${n} picked`;
  }

  /* =========================================================
     Screen 3: measurements
     ========================================================= */
  const MEASURE_LINES = {
    height: 'M54 5 V116 M51 5 H57 M51 116 H57',
    bust: 'M18 36 Q30 40 42 36',
    waist: 'M21 50 Q30 53 39 50',
    hips: 'M18 64 Q30 68 42 64',
    inseam: 'M31 72 V116',
    shoulder: 'M17 26 H43',
    sleeve: 'M43 27 L49 61'
  };
  const bodyFigure = (field) => `<svg viewBox="0 0 60 120" aria-hidden="true" focusable="false">
    <circle cx="30" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1"/>
    <path d="M26 18 V22 L17 26 L12 60 M34 18 V22 L43 26 L48 60 M19 29 L21 50 L19 64 L21 116 M41 29 L39 50 L41 64 L39 116 M30 72 L28 116 M30 72 L32 116 M21 116 H28 M32 116 H39" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${MEASURE_LINES[field]}" fill="none" stroke="var(--clay)" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
  const toUnit = (inches) => (state.units === 'cm' ? Math.round(inches * 25.4) / 10 : inches);
  function buildMeasure() {
    $('#measure-fields').innerHTML = MEASURES.map((m) => `<div class="m-field">
        <div class="field"><label for="m-${m.id}">${m.name}<span class="estimated" id="m-${m.id}-est" ${state.estimated.has(m.id) ? '' : 'hidden'}>estimated</span></label>
        <div class="affix"><input id="m-${m.id}" data-measure="${m.id}" type="number" inputmode="decimal" step="0.5" min="1" autocomplete="off"><span class="unit-after unit-label">in</span></div></div>
        <details><summary>How to measure</summary><div class="how-to">${bodyFigure(m.id)}<p>${esc(m.how)}</p></div></details>
      </div>`).join('')
      + `<div class="m-field"><div class="field"><label for="m-uw">Underwear size <span class="opt">optional</span></label>
        <div class="select-wrap"><select id="m-uw">${['XS', 'S', 'M', 'L', 'XL'].map((s) => `<option ${state.uwSize === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
        <p class="hint">Used for underwear picks only.</p></div>`;
    $('#fit-size').innerHTML = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => `<option value="${s}">${s}</option>`).join('');
    $('#fit-prefs').innerHTML = FIT_TYPES.map(([k, label]) => `<fieldset class="fit-pref"><legend>${label}</legend>
      <div class="segmented">${['fitted', 'regular', 'relaxed', 'oversized'].map((v) => `<label><input type="radio" name="fit-${k}" value="${v}" data-fitpref="${k}" ${state.fitPref[k] === v ? 'checked' : ''}><span>${cap1(v)}</span></label>`).join('')}</div></fieldset>`).join('');
    $('#brand-sizes').innerHTML = [['Levi’s', 'S'], ['Uniqlo', 'M'], ['', '']].map(([b, s], i) => `<div class="brand-row">
      <input type="text" aria-label="Brand ${i + 1}" placeholder="Brand…" value="${esc(b)}" autocomplete="off" data-bs-brand>
      <div class="select-wrap"><select aria-label="Usual size in brand ${i + 1}" data-bs-size><option value="">Size</option>${['XS', 'S', 'M', 'L', 'XL'].map((z) => `<option ${z === s ? 'selected' : ''}>${z}</option>`).join('')}</select></div></div>`).join('');
    syncMeasure();
  }
  function syncMeasure() {
    $('#fit-size').value = state.fitSize;
    MEASURES.forEach((m) => {
      const el = $(`#m-${m.id}`);
      if (document.activeElement !== el) el.value = toUnit(state.body[m.id]);
      el.step = state.units === 'cm' ? '1' : '0.5';
      $(`#m-${m.id}-est`).hidden = !state.estimated.has(m.id);
    });
    $$('.unit-label').forEach((u) => { u.textContent = state.units; });
    $$('input[name="units"]').forEach((r) => { r.checked = r.value === state.units; });
  }

  /* =========================================================
     Screen 4: wardrobe
     ========================================================= */
  function wardrobeKind(w) { return w.kind || TYPE_KIND[w.type] || 'tee'; }
  function renderWardrobe() {
    const ws = state.wardrobe;
    const known = ws.filter((w) => w.fibers && w.fibers.length);
    const natPct = known.length ? known.reduce((s, w) => s + fiberOfWardrobe(w).natural, 0) / known.length : 0;
    const gp = gaps(); const flags = wardrobeFlags();
    const f = state.railFilter;
    $('#wardrobe-summary').innerHTML = [
      ['all', ws.length, ws.length === 1 ? 'item' : 'items'],
      ['natural', pct(natPct), 'natural fiber'],
      ['gaps', gp.length, gp.length === 1 ? 'gap found' : 'gaps found', gp.length ? 'warn' : ''],
      ['flags', flags.length, flags.length === 1 ? 'item to replace or repair' : 'items to replace or repair', flags.length ? 'warn' : '']
    ].map(([k, num, what, cls]) => `<button type="button" class="${cls || ''}" data-rail-filter="${k}" aria-pressed="${f === k || (!f && k === 'all')}"><span class="num">${num}</span><span class="what">${what}</span></button>`).join('');

    let note = '';
    if (f === 'gaps') note = gp.length ? `Gaps: ${gp.map((g) => g.text).join(' · ')}. They show up as goals on the Plan step.` : 'No gaps against a basic capsule.';
    if (f === 'natural') note = 'Showing pieces that are 90% natural or more.';
    if (f === 'flags') note = 'Showing pieces to repair or replace.';
    $('#rail-filter').innerHTML = note ? `<span>${esc(note)}</span><button type="button" class="text-link" data-rail-filter="all">Show all</button>` : '';

    const flaggedIds = new Set(flags.map((x) => x.item.id));
    $('#wardrobe-rail').innerHTML = ws.length ? ws.map((w) => {
      const fi = fiberOfWardrobe(w);
      const dim = (f === 'natural' && fi.natural < 0.9) || (f === 'flags' && !flaggedIds.has(w.id)) || f === 'gaps';
      const flag = flags.find((x) => x.item.id === w.id);
      return `<li class="${dim ? 'dim' : ''}"><article class="w-card ${flag ? 'flagged' : ''}" aria-label="${esc(w.name)}">
        <div class="w-art">${garment(wardrobeKind(w), colorHex(w.color))}${flag ? `<span class="w-flag">${flag.kind === 'underwear' ? 'Replace' : flag.kind === 'repair' ? 'Repair' : 'Worn'}</span>` : ''}</div>
        <div class="w-body"><p class="w-name">${esc(w.name)}</p><p class="w-fiber">${esc(fi.label)}</p>
          <div class="select-wrap"><select data-cond="${w.id}" aria-label="Condition of ${esc(w.name)}">
            <option value="great" ${w.cond === 'great' ? 'selected' : ''}>Great</option><option value="worn" ${w.cond === 'worn' ? 'selected' : ''}>Worn</option><option value="repair" ${w.cond === 'repair' ? 'selected' : ''}>Needs repair</option></select></div>
          <button type="button" class="text-link" data-action="remove-w" data-id="${w.id}" aria-label="Remove ${esc(w.name)}">Remove</button></div></article></li>`;
    }).join('') : '<li class="empty">Your rail is empty. Add a piece above, or skip this step.</li>';

    $('#pending-items').innerHTML = state.pending.map((p, i) => `<div class="pending-card">
      <div class="thumb">${p.photo ? `<img src="${p.photo}" alt="Your photo" width="72" height="90" style="width:100%;height:100%;object-fit:cover">` : garment(TYPE_KIND[p.type], colorHex(p.color))}</div>
      <div><p>${esc(p.msg)}</p>
        <div class="pending-fields">
          <div class="field"><label for="pt-${i}">Type</label><div class="select-wrap"><select id="pt-${i}" data-pending="${i}" data-pk="type">${[...GARMENT_TYPES, 'underwear'].map((t) => `<option value="${t}" ${p.type === t ? 'selected' : ''}>${cap1(t)}</option>`).join('')}</select></div></div>
          <div class="field"><label for="pc-${i}">Color</label><div class="select-wrap"><select id="pc-${i}" data-pending="${i}" data-pk="color">${COLORS.map((c) => `<option value="${c.id}" ${p.color === c.id ? 'selected' : ''}>${cap1(c.id)}</option>`).join('')}</select></div></div>
          <div class="field"><label for="pf-${i}">Fiber</label><div class="select-wrap"><select id="pf-${i}" data-pending="${i}" data-pk="fiber">${['unknown', ...Object.keys(FIBER_CLASS).filter((k) => k !== 'merino')].map((x) => `<option value="${x}" ${p.fiber === x ? 'selected' : ''}>${x === 'unknown' ? 'Not sure yet' : cap1(x)}</option>`).join('')}</select></div></div>
        </div>
        <div class="pending-actions"><button type="button" class="btn btn-solid btn-small" data-action="confirm-pending" data-i="${i}">Add to rail</button><button type="button" class="text-link" data-action="discard-pending" data-i="${i}">Discard</button></div>
      </div></div>`).join('');
  }
  function addWardrobeItem({ type, color, fiber, pct: p = 100, cond = 'great', acq = '' }) {
    const id = `w-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const fibers = fiber && fiber !== 'unknown' ? (p >= 100 ? [[fiber, 100]] : [[fiber, p], ['polyester', 100 - p]]) : null;
    const name = `${cap1(color)} ${type === 'tops' ? 'top' : type === 'knitwear' ? 'knit' : type === 'outerwear' ? 'jacket' : type === 'skirts' ? 'skirt' : type === 'dresses' ? 'dress' : type}`;
    state.wardrobe.unshift({ id, name, type, color, fibers, cond, acq });
    announce(`${name} added to your wardrobe.`);
    return id;
  }

  /* =========================================================
     Screen 5: budget
     ========================================================= */
  const ENV = [['thrift', 'Thrift finds', '#788c5d'], ['tailoring', 'Tailoring', '#b8975a'], ['underwear', 'Underwear (new)', '#6a9bcc'], ['other', 'Other', '#b0aea5']];
  function syncBudgetForm() {
    const B = state.budget;
    const set = (sel, v) => { const el = $(sel); if (document.activeElement !== el) el.value = v; };
    set('#b-now', B.now || '');
    set('#b-allow', B.allowance || '');
    set('#b-cap', B.cap || '');
    $('#b-per').value = B.per;
    $('#b-include').checked = B.include;
    $$('input[name="b-mode"]').forEach((r) => { r.checked = r.value === B.mode; });
    $('#b-env-on').checked = B.envOn;
    $('#envelopes').hidden = !B.envOn;
    $('#b-weekly-hint').textContent = B.per === 'month' && B.allowance ? `About ${money(Math.round(weekly()))} a week.` : B.per === 'week' && B.allowance ? `About ${money(Math.round(B.allowance * 52 / 12))} a month.` : 'Optional.';
    $('#b-mode-link').textContent = state.locks.has('cost') ? 'Total cost is locked as a must-have on Priorities, which is the same as Strict.' : '';
    renderBudgetSide();
    if (B.envOn) renderEnvelopes();
  }
  function renderEnvelopes() {
    const B = state.budget;
    const ctr = $('#env-controls');
    if (!ctr.children.length) {
      ctr.innerHTML = ENV.map(([k, label, col]) => `<div class="env-row">
        <label for="env-${k}"><i class="env-key" style="background:${col}" aria-hidden="true"></i>${label}</label>
        <div class="affix"><span aria-hidden="true">$</span><input type="number" id="env-${k}" data-env="${k}" inputmode="decimal" min="0" step="5" autocomplete="off"></div>
        <input type="range" data-env-range="${k}" min="0" max="${Math.max(B.now, 10)}" step="5" aria-label="${label} envelope">
        <p class="hint" id="env-${k}-left"></p></div>`).join('');
    }
    ENV.forEach(([k]) => {
      const inp = $(`#env-${k}`); const rng = $(`[data-env-range="${k}"]`);
      if (document.activeElement !== inp) inp.value = B.env[k];
      rng.max = Math.max(B.now, 10);
      if (document.activeElement !== rng) rng.value = B.env[k];
      rng.setAttribute('aria-valuetext', `${money(B.env[k])}`);
      const left = envLeft(k);
      $(`#env-${k}-left`).textContent = envSpent(k) ? `${money(Math.max(0, round2(left)))} left` : '';
    });
    const total = ENV.reduce((s, [k]) => s + B.env[k], 0) || 1;
    const r = 42; const C = 2 * Math.PI * r; let off = 0;
    $('#env-donut').innerHTML = `<title id="env-donut-title">Envelope split: ${ENV.map(([k, l]) => `${l} ${money(B.env[k])}`).join(', ')}</title>`
      + `<circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--linen)" stroke-width="14"/>`
      + ENV.map(([k, , col]) => { const len = B.env[k] / total * C; const s = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-width="14" stroke-dasharray="${len.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 60 60)"/>`; off += len; return s; }).join('')
      + `<text x="60" y="57" text-anchor="middle" font-size="15" font-weight="300">${money(B.now)}</text><text x="60" y="72" text-anchor="middle" font-size="7" letter-spacing="1.2" fill="var(--ink-faint)">TO SPLIT</text>`;
  }
  // keep envelopes summing to the total: whatever one envelope gains, Thrift (or Other) gives up
  function setEnvelope(k, v) {
    const B = state.budget;
    v = clamp(Math.round(v) || 0, 0, B.now);
    B.env[k] = v;
    const sink = k === 'thrift' ? 'other' : 'thrift';
    const rest = ENV.filter(([x]) => x !== sink).reduce((s, [x]) => s + B.env[x], 0);
    B.env[sink] = B.now - rest;
    if (B.env[sink] < 0) {
      // trim the others proportionally so nothing goes negative
      let over = -B.env[sink]; B.env[sink] = 0;
      ENV.forEach(([x]) => { if (x !== k && x !== sink && over > 0) { const cut = Math.min(over, B.env[x]); B.env[x] -= cut; over -= cut; } });
      if (over > 0) B.env[k] -= over;
    }
  }
  function suggestSplit() {
    const B = state.budget; const goals = activeGoals();
    const uw = goals.some((g) => g.id === 'underwear' && !state.filled.underwear) ? 45 : 0;
    const tailoring = Math.round(goals.filter((g) => !state.filled[g.id]).reduce((s, g) => s + (g.id === 'coat' ? 32.5 : g.id === 'trousers' ? 18.5 : 0), 0) / 5) * 5;
    const other = Math.round(B.now * 0.1 / 5) * 5;
    B.env = { underwear: Math.min(uw, B.now), tailoring, other, thrift: 0 };
    B.env.thrift = Math.max(0, B.now - B.env.underwear - B.env.tailoring - B.env.other);
  }
  function renderBudgetSide() {
    $('#spent-meter').innerHTML = meterHTML();
    $('#spent-list').innerHTML = state.spent.length ? state.spent.map((e) => `<li><span>${esc(e.label)}</span><span>${money(e.amount)}</span></li>`).join('') : '<li class="empty-row">Nothing bought yet. “Mark as bought” on any find adds it here.</li>';
    const saved = state.spent.reduce((s, e) => s + (e.newPrice ? e.newPrice - e.amount : 0), 0);
    $('#saved-vs-new').textContent = money(Math.round(saved));
    $('#saved-vs-new-note').textContent = saved > 0 ? 'Thrift plus tailoring, compared with buying a similar piece new.' : 'Mark something as bought to start the count.';
  }

  /* =========================================================
     Screen 6: priorities
     ========================================================= */
  const PREVIEW_IDS = ['ebay-001', 'etsy-014', 'ebay-022'];
  function buildPriorities() {
    $('#weight-presets').innerHTML = Object.keys(WEIGHT_PRESETS).map((n) => `<button type="button" class="chip-btn" data-wpreset="${esc(n)}">${esc(n)}</button>`).join('');
    $('#criteria').innerHTML = CRITERIA.map((c) => `<fieldset class="crit" data-crit="${c.id}">
      <legend><span class="crit-name">${esc(c.name)}</span><span class="crit-desc">${esc(c.desc)}</span></legend>
      <div class="dots">${[0, 1, 2, 3, 4, 5].map((v) => `<label class="dot"><input type="radio" name="imp-${c.id}" value="${v}" data-imp="${c.id}" aria-label="${v}, ${IMP_WORDS[v]}"><span aria-hidden="true">${v}</span></label>`).join('')}</div>
      <label class="lock"><input type="checkbox" data-lock="${c.id}"><span>${ICON.lock}Must-have</span></label>
      <p class="crit-threshold" data-thr="${c.id}" hidden>Locked: ${esc(c.lock)}.</p>
    </fieldset>`).join('');
    $('#dealbreakers').innerHTML = [['wool', 'Wool'], ['cashmere', 'Cashmere'], ['silk', 'Silk'], ['acrylic', 'Acrylic'], ['polyester', 'Polyester'], ['nylon', 'Nylon'], ['rayon', 'Rayon / viscose'], ['elastane', 'Elastane']]
      .map(([v, l]) => `<label class="chip danger"><input type="checkbox" data-deal="${v}" ${state.dealbreakers.has(v) ? 'checked' : ''}><span>Never ${l.toLowerCase()}</span></label>`).join('');
    syncPriorities();
  }
  function syncPriorities() {
    $$('input[name="prio-mode"]').forEach((r) => { r.checked = r.value === state.mode; });
    $('#quick-mode').hidden = state.mode !== 'quick';
    $('#advanced-mode').hidden = state.mode !== 'advanced';
    const bal = $('#balance');
    const v = Math.round(state.balance * 100);
    if (document.activeElement !== bal) bal.value = v;
    bal.style.setProperty('--fill', `${100 - v}%`);
    const name = v <= 30 ? 'Purist' : v >= 75 ? 'I want the look' : 'Balanced';
    const vt = `${name}: style ${v}%, fabric ${100 - v}%`;
    bal.setAttribute('aria-valuetext', vt);
    $('#balance-readout').textContent = vt;
    $$('[data-balance]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.balance) === v)));
    CRITERIA.forEach((c) => {
      $$(`input[data-imp="${c.id}"]`).forEach((r) => {
        r.checked = Number(r.value) === state.imp[c.id];
        r.closest('.dot').classList.toggle('lit', Number(r.value) > 0 && Number(r.value) < state.imp[c.id]);
      });
      const lk = $(`input[data-lock="${c.id}"]`);
      lk.checked = state.locks.has(c.id);
      $(`[data-thr="${c.id}"]`).hidden = !state.locks.has(c.id);
    });
    $$('[data-deal]').forEach((d) => { d.checked = state.dealbreakers.has(d.dataset.deal); });
    $('#semi-half').checked = state.semiHalf;
    $('#stretch-on').checked = state.stretchOn;
    renderWeightBar();
    const hidden = LISTINGS.filter((l) => hitsDealbreaker(l.fibers)).length;
    $('#dealbreaker-count').textContent = hidden ? `Hidden by your rules: ${hidden} ${hidden === 1 ? 'listing' : 'listings'}.` : 'No listings hidden by your rules.';
    renderPreview();
  }
  function renderWeightBar() {
    const w = weights();
    const sum = CRITERIA.reduce((s, c) => s + w[c.id], 0) || 1;
    const live = CRITERIA.filter((c) => w[c.id] > 0);
    $('#weight-bar').innerHTML = live.map((c) => { const share = w[c.id] / sum; return `<span style="flex-grow:${w[c.id]};background:${c.color}" title="${esc(c.name)} ${pct(share)}">${share >= 0.09 ? pct(share) : ''}</span>`; }).join('');
    $('#weight-bar').setAttribute('aria-hidden', 'true');
    $('#weight-legend').innerHTML = live.map((c) => `<li><i style="background:${c.color}" aria-hidden="true"></i>${esc(c.name)} ${pct(w[c.id] / sum)}</li>`).join('') || '<li>Everything is set to ignore. Give at least one criterion a weight.</li>';
  }
  let lastPreviewTop = null;
  function renderPreview() {
    const list = $('#preview-list');
    const evs = PREVIEW_IDS.map((id) => evaluate(LISTINGS.find((l) => l.id === id))).sort((a, b) => b.match - a.match);
    flip(list, () => {
      list.innerHTML = evs.map((e, i) => `<li data-key="${e.item.id}"><span class="rank">${['i', 'ii', 'iii'][i]}</span>
        <span class="thumb">${itemArt(e.item)}</span>
        <span><p class="pname">${esc(e.item.short)}</p><p class="psub">${esc(e.fi.label)}</p></span>
        <span class="pscore">${pct(e.match)}</span></li>`).join('');
    });
    const top = evs[0].item.short;
    if (lastPreviewTop && top !== lastPreviewTop) announce(`Preview re-ordered. Top item: ${top}.`);
    lastPreviewTop = top;
  }
  function renderTot() {
    const box = $('#tot');
    const t = state.tot;
    if (!t) { box.hidden = true; return; }
    if (t.i >= THIS_OR_THAT.length) {
      box.innerHTML = `<p class="tot-q">Done. Your weights are filled in below. Change anything that doesn’t feel right.</p><button type="button" class="text-link" data-action="close-tot">Close</button>`;
      return;
    }
    const q = THIS_OR_THAT[t.i];
    box.innerHTML = `<p class="tot-progress">Question ${t.i + 1} of ${THIS_OR_THAT.length}</p><p class="tot-q">${esc(q.q)}</p>
      <div class="tot-opts"><button type="button" data-tot="a">${esc(q.a[0])}</button><button type="button" data-tot="b">${esc(q.b[0])}</button></div>
      <button type="button" class="text-link" data-action="close-tot">Stop here</button>`;
    box.hidden = false;
  }

  /* =========================================================
     Screen 7: goals and plan
     ========================================================= */
  let whatIfClicked = false;
  const STRAT_FILL = ['transparent', 'color-mix(in srgb, var(--sage) 30%, transparent)', 'color-mix(in srgb, var(--sage) 68%, transparent)'];
  function renderGoals() {
    const now = $('#p-now'); const wk = $('#p-week');
    if (document.activeElement !== now) now.value = Math.max(0, Math.round(remaining()));
    if (document.activeElement !== wk) wk.value = Math.round(weekly());
    const ps = partialShare();
    $('#partial-readout').textContent = `${pct(ps)} of the goal`;
    $$('input[name="hunt"]').forEach((r) => { r.checked = r.value === state.hunt; });
    const S = STRATS.find((s) => s.id === state.hunt);
    $('#hunt-hint').textContent = S ? S.blurb : 'Each week the plan picks racks, saved searches or a wide net, whichever gives you the most.';
    $$('[data-whatif]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    const goals = activeGoals();
    const res = runPlan();
    const { start, allow } = planInputs();
    const { open, sol } = planFull();
    const wi = [state.whatIf.now ? `+${money(state.whatIf.now)} now` : '', state.whatIf.allow ? `+${money(state.whatIf.allow)} a week` : '', state.whatIf.deadline ? `deadlines +${state.whatIf.deadline} weeks` : ''].filter(Boolean);
    const wiTxt = wi.length ? ` What if: ${wi.join(', ')}.` : '';
    $('#plan-status').textContent = `Planned over 12 weeks from ${money(start)} plus ${money(allow)} a week.${wiTxt}`;

    renderPlanLedger(open, sol);

    const order = [...goals].sort((a, b) => b.imp - a.imp || a.end - b.end);
    let cum = 0;
    const changes = [];
    $('#goal-cards').innerHTML = order.length ? order.map((g) => {
      const r = res[g.id] || { nat: 0, syn: 0 };
      const total = r.nat + r.syn;
      const prev = state.lastGoalChance[g.id];
      const delta = prev == null ? 0 : Math.round(total * 100) - Math.round(prev * 100);
      if (delta) changes.push(`${g.name} chance now ${pct(total)}`);
      state.lastGoalChance[g.id] = total;
      const target = goalTarget(g);
      const met = total >= target - 1e-9;
      let afford;
      if (state.filled[g.id]) afford = `Filled${state.filled[g.id] === 'synthetic' ? ' with the synthetic version' : ''}. Nice work.`;
      else {
        cum += g.nat.cost;
        const left = remaining() + state.whatIf.now;
        const A = weekly() + state.whatIf.allow;
        const wks = cum <= left ? 0 : A > 0 ? Math.ceil((cum - left) / A) : Infinity;
        const after = order.filter((x) => x.imp > g.imp && !state.filled[x.id]).map((x) => x.name.toLowerCase());
        afford = `${esc(g.name)} (${money(g.nat.cost)}${g.costNote ? `, ${g.costNote}` : ''}): ${wks === 0 ? 'affordable now' : wks === Infinity ? 'not reachable without an allowance' : `affordable in week ${wks + 1} at your allowance`}${after.length && wks !== Infinity ? `, after the ${after.join(' and ')}` : ''}.${r.week ? ` When it happens, it’s usually around week ${Math.round(r.week)}.` : ''}`;
      }
      return `<article class="goal-card ${state.filled[g.id] ? 'is-filled' : ''}" aria-labelledby="g-${g.id}">
        <div class="goal-top">${ring(r.nat, r.syn)}<div><h2 class="goal-name" id="g-${g.id}">${esc(g.name)} ${delta ? `<span class="goal-delta ${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '+' : '−'}${Math.abs(delta)}</span>` : ''}</h2><p class="goal-source">${esc(goalSource(g))}</p></div></div>
        <p class="goal-split"><span><i style="background:var(--sage)"></i>${pct(r.nat)} ${esc(g.natLabel || 'natural')}</span>${g.syn ? `<span><i style="background:var(--blue)"></i>${pct(r.syn)} synthetic</span>` : '<span>Bought new</span>'}</p>
        <p class="visually-hidden">${esc(g.name)}: ${pct(total)} chance of filling it by week ${g.end}, ${pct(r.nat)} with ${esc(g.natLabel || 'natural fiber')}${g.syn ? ` and ${pct(r.syn)} with the synthetic version` : ''}.</p>
        ${state.filled[g.id] ? '' : `<div class="goal-edit">
          <div class="field"><label for="gi-${g.id}">How much it matters: <output id="gio-${g.id}">${fmtImp(g.imp)}</output> of 10</label><input type="range" id="gi-${g.id}" min="0.5" max="10" step="0.1" value="${g.imp}" data-goal-imp="${g.id}" aria-valuetext="${fmtImp(g.imp)} of 10"></div>
          <div class="field floor"><label for="gt-${g.id}">Lowest chance you’d accept: <output id="gto-${g.id}">${pct(target)}</output> <span class="floor-tag ${met ? 'met' : 'short'}">${met ? 'Met' : 'Not yet'}</span></label><input type="range" id="gt-${g.id}" min="0" max="100" step="5" value="${Math.round(target * 100)}" data-goal-target="${g.id}" aria-valuetext="${pct(target)}"></div>
          <div class="row"><div class="field"><label for="gd-${g.id}">Deadline, week</label><input type="number" id="gd-${g.id}" min="${g.start}" max="12" value="${g.end}" inputmode="numeric" data-goal-end="${g.id}" autocomplete="off"></div>
          <div class="field"><label for="gc-${g.id}">Typical cost</label><div class="affix"><span aria-hidden="true">$</span><input type="number" id="gc-${g.id}" min="1" value="${g.nat.cost}" inputmode="decimal" data-goal-cost="${g.id}" autocomplete="off"></div></div></div>
        </div>`}
        <p class="goal-afford">${afford}</p>
        ${g.auto ? '' : `<button type="button" class="icon-btn goal-remove" data-action="remove-goal" data-id="${g.id}" aria-label="Remove goal ${esc(g.name)}"><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M5 5l8 8M13 5l-8 8"/></svg></button>`}
      </article>`;
    }).join('') : '<p class="empty">No open goals. Add one below, or let the wardrobe step suggest some.</p>';
    if (changes.length) announce(changes.slice(0, 2).join('. ') + '.');
    else if (whatIfClicked) {
      const note = ' No chance moved. Right now the plan is limited by how often a match turns up, not by money. Try a later deadline.';
      $('#plan-status').textContent += note;
      announce(note);
    }
    whatIfClicked = false;

    // timeline
    const head = `<div class="tl-head"><span>Goal</span>${Array.from({ length: 12 }, (_, i) => `<span>W${i + 1}</span>`).join('')}</div>`;
    const rows = order.map((g) => {
      const r = res[g.id] || { nat: 0, syn: 0 };
      const tot = r.nat + r.syn;
      const fill = r.nat / (tot || 1);
      return `<div class="tl-row"><span class="tl-name" title="${esc(g.name)}">${esc(g.name)}</span>
        <span class="tl-bar" style="grid-column:${g.start + 1} / ${g.end + 2}"><span class="tl-fill" style="background:linear-gradient(90deg,var(--sage) 0 ${fill * 100}%,var(--blue) ${fill * 100}%);transform:scaleX(${tot.toFixed(3)})"></span></span>
        <span class="tl-end" style="grid-column:${g.end + 1}; grid-row:1">${pct(tot)}</span></div>`;
    }).join('');
    $('#timeline').innerHTML = head + rows;
    $('#timeline-desc').textContent = order.map((g) => { const r = res[g.id] || { nat: 0, syn: 0 }; return `${g.name}: weeks ${g.start} to ${g.end}, ${pct(r.nat + r.syn)} chance.`; }).join(' ');
    const n = state.goals.length;
    $('#ng-hint').textContent = n >= 5 ? 'Five goals is the limit here, so the plan stays quick to compute.' : 'Up to five goals keeps the plan quick to compute.';
    $('#add-goal-form button[type="submit"]').disabled = n >= 5;

    renderTuneLog();
    // The map and switch points need extra states; draw them after the cards paint.
    // The map's markup is commented out for now, so only draw it if it's on the page.
    clearTimeout(renderGoals.later);
    renderGoals.later = setTimeout(() => { if ($('#plan-map')) renderPlanMap(open, sol); renderSwitch(open, sol); }, 0);
  }

  // What choosing where to hunt is worth, in plain words.
  function renderPlanLedger(open, sol) {
    const box = $('#plan-ledger');
    if (!sol) { box.innerHTML = ''; return; }
    const { start, allow, partial } = planInputs();
    const other = state.hunt === 'auto' ? solvePlan(open, start, allow, partial, 'racks') : solvePlan(open, start, allow, partial, 'auto');
    const gain = Math.round((state.hunt === 'auto' ? sol.fraction - other.fraction : other.fraction - sol.fraction) * 100);
    const weeksWide = sol.strategies.length > 1 ? Math.round(sol.stratUse.slice(1).reduce((s, u) => s + (1 - u[0]), 0)) : 0;
    const huntTxt = state.hunt === 'auto'
      ? (gain > 0 ? `Searching beyond the racks some weeks gives you a better shot at your goals${weeksWide ? `. Expect to widen the search in about ${weeksWide} of 12 weeks` : ''}.` : 'Right now the racks are enough. Searching wider wouldn’t help much.')
      : (gain > 0 ? 'Letting the plan pick where to hunt each week would give you a better shot at your goals.' : 'Letting the plan pick wouldn’t change much here.');
    box.innerHTML = `<div class="pl-fig"><p class="label">Where you hunt</p><p class="pl-text">${huntTxt}</p></div>`;
  }

  // §4.2.1 tuning loop, with a run log in the spirit of the paper's Table 4.
  function runTune() {
    const { open, start, allow, partial } = planInputs();
    if (!open.length) { $('#tune-status').textContent = 'No open goals to tune.'; return; }
    const targets = open.map(goalTarget);
    $('#tune-status').textContent = 'Tuning…';
    $('[data-action="tune"]').disabled = true;
    setTimeout(() => {
      const base = { goals: open, start, allow, partial, strategies: strategiesFor(state.hunt) };
      const out = Planner.tune(base, targets, 10);
      const best = out.best;
      const allMet = best.met.every(Boolean);
      let topUp = null;
      if (!allMet) topUp = Planner.minTopUp({ ...base, goals: open.map((g, i) => ({ ...g, imp: best.imps[i] })) }, targets, 40);
      state.tune = { ids: open.map((g) => g.id), names: open.map((g) => g.name), targets, runs: out.runs, bestIdx: out.runs.indexOf(best), allMet, topUp };
      $('[data-action="tune"]').disabled = false;
      $('#tune-status').textContent = allMet ? 'Done. Every floor is met.' : 'Done. Not every floor can be met on this budget.';
      renderTuneLog();
      announce($('#tune-status').textContent);
    }, 20);
  }
  function renderTuneLog() {
    const T = state.tune; const box = $('#tune-log');
    if (!T) { box.innerHTML = ''; return; }
    const best = T.runs[T.bestIdx];
    const ok = T.allMet ? 'These settings meet every floor.' : T.topUp ? `This is as close as it gets. To meet every floor, add about ${money(T.topUp)} a week.` : `This is as close as it gets. Even ${money(40)} more a week wouldn’t meet every floor, so try a later deadline or a lower floor.`;
    box.innerHTML = `<ul class="tune-picks">${T.names.map((n, j) => `<li><strong>${esc(n)}</strong> matters ${fmtImp(best.imps[j])} of 10, ${pct(best.probs[j])} chance${best.met[j] ? '' : ' (below your floor)'}</li>`).join('')}</ul>
      <p class="tune-result">${ok}</p>
      <div class="tune-actions"><button type="button" class="btn btn-quiet btn-small" data-action="apply-tune">Use these settings</button>${!T.allMet && T.topUp ? `<button type="button" class="btn btn-quiet btn-small" data-action="tune-topup" data-amt="${T.topUp}">Try +${money(T.topUp)} a week</button>` : ''}</div>`;
  }

  // Plate II: shading = best place to hunt at each budget (paper Fig. 2),
  // dots = where the budget is likely to be at the start of each week (paper Fig. 3).
  function renderPlanMap(open, sol) {
    const box = $('#plan-map');
    if (!sol) { box.innerHTML = '<p class="empty">Add a goal to see the plan map.</p>'; $('#map-legend').innerHTML = ''; $('#map-cap').textContent = ''; return; }
    const T = sol.T;
    let hiB = 0;
    for (let t = 1; t <= T; t++) sol.budgetDist[t].forEach((p, b) => { if (p > 0.002 && b > hiB) hiB = b; });
    const maxCost = Math.max(...open.map((g) => g.nat.cost));
    const yMax = Math.min(sol.maxB, Math.max(100, Math.ceil(Math.max(hiB, maxCost + 20) / 20) * 20));
    const step = yMax > 200 ? 10 : 5;
    const W = 720; const H = 380; const L = 52; const R = 116; const Tp = 12; const B = 34;
    const cw = (W - L - R) / T; const yk = (H - Tp - B) / yMax;
    const X = (t) => L + (t - 1) * cw; const Y = (b) => H - B - b * yk;
    let cells = '';
    const switches = [];
    for (let t = 1; t <= T; t++) {
      const f = sol.modeMask(t);
      let prevL = -1;
      for (let b = 0; b < yMax; b += step) {
        const l = sol.policyL(t, Math.min(sol.maxB, b + Math.floor(step / 2)), f);
        const li = sol.strategies.length === 1 ? STRATS.indexOf(sol.strategies[0]) : l;
        if (li > 0) cells += `<rect x="${X(t).toFixed(1)}" y="${Y(b + step).toFixed(1)}" width="${cw.toFixed(1)}" height="${(step * yk).toFixed(1)}" fill="${STRAT_FILL[li]}"><title>Week ${t}, ${money(b)} to ${money(b + step - 1)}: ${esc(STRATS[li].name.toLowerCase())}</title></rect>`;
        if (l !== prevL && prevL !== -1) switches.push({ t, b, l });
        prevL = l;
      }
    }
    let dots = '';
    const maxR = Math.min(cw * 0.36, 10);
    for (let t = 1; t <= T; t++) {
      const bins = new Map();
      sol.budgetDist[t].forEach((p, b) => { const k = Math.min(yMax - step, Math.floor(b / step) * step); bins.set(k, (bins.get(k) || 0) + p); });
      bins.forEach((p, k) => {
        if (p < 0.004) return;
        dots += `<circle cx="${(X(t) + cw / 2).toFixed(1)}" cy="${Y(k + step / 2).toFixed(1)}" r="${Math.max(1.4, Math.sqrt(p) * maxR).toFixed(1)}"><title>Week ${t}: ${pct(p)} chance your budget is ${money(k)} to ${money(k + step - 1)}</title></circle>`;
      });
    }
    // Label each natural-version price on the right, nudged apart so they never overlap.
    let lastY = -Infinity;
    const costLines = open.filter((g) => g.nat.cost < yMax).sort((a, b) => b.nat.cost - a.nat.cost).map((g) => {
      const y = Y(g.nat.cost); const ly = Math.max(y + 3.5, lastY + 13); lastY = ly;
      return `<g class="cost-line"><path d="M${L} ${y.toFixed(1)}H${W - R}"/><text x="${W - R + 6}" y="${ly.toFixed(1)}">${esc(g.name.toLowerCase().replace(/ for spring$/, ''))} ${money(g.nat.cost)}</text></g>`;
    }).join('');
    let yTicks = '';
    for (let b = 0; b <= yMax; b += yMax > 200 ? 50 : 20) yTicks += `<g class="tick"><path d="M${L - 4} ${Y(b).toFixed(1)}H${L}"/><text x="${L - 8}" y="${(Y(b) + 3.5).toFixed(1)}" text-anchor="end">${money(b)}</text></g>`;
    let xTicks = '';
    for (let t = 1; t <= T; t++) xTicks += `<text class="tick" x="${(X(t) + cw / 2).toFixed(1)}" y="${H - B + 18}" text-anchor="middle">W${t}</text>`;
    const deadlines = open.map((g) => `<path class="deadline" d="M${(X(g.end) + cw).toFixed(1)} ${Tp}V${H - B}"><title>${esc(g.name)} deadline, end of week ${g.end}</title></path>`).join('');
    // Text summary for screen readers and the caption.
    const firstWide = switches.find((s) => s.l > 0);
    const modeB = (t) => { let bb = 0; let bp = -1; sol.budgetDist[t].forEach((p, b) => { if (p > bp) { bp = p; bb = b; } }); return bb; };
    const summary = `Plan map over 12 weeks. Most likely budget at the start of week 1 is ${money(modeB(1))}, week 6 ${money(modeB(6))}, week 12 ${money(modeB(12))}.${firstWide ? ` The first switch to a wider search is in week ${firstWide.t} at about ${money(firstWide.b)}.` : ' The plan stays on the racks at every budget shown.'}`;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(summary)}" focusable="false">
      <rect class="frame" x="${L}" y="${Tp}" width="${W - L - R}" height="${H - Tp - B}"/>
      ${cells}${deadlines}${costLines}<g class="mass">${dots}</g>${yTicks}${xTicks}
    </svg>`;
    const used = sol.strategies.length === 1 ? [STRATS.indexOf(sol.strategies[0])] : [0, 1, 2];
    $('#map-legend').innerHTML = used.map((i) => `<span><i class="sw" style="background:${i === 0 ? 'var(--paper)' : STRAT_FILL[i]}"></i>${esc(STRATS[i].name)}</span>`).join('') + '<span><i class="dot"></i>Where your budget is likely to be. Bigger dot, likelier.</span><span><i class="dash"></i>Natural-version price</span>';
    $('#map-cap').textContent = `Shading shows the best place to hunt at each budget, assuming your closet looks the way it most likely does that week. Dots show where your budget is likely to start each week. ${firstWide ? `The plan first widens the search in week ${firstWide.t}, ` : ''}${firstWide ? 'and the dots bunch just above goal prices before deadlines, the same clumping the paper found in its Figure 3.' : 'Watch the dots bunch just above goal prices before deadlines, the same clumping the paper found in its Figure 3.'}`;
  }

  // §4.1.3 switch points: best move at every budget for one goal, week and set of finds.
  function renderSwitch(open, sol) {
    const sel = $('#sw-goal'); const box = $('#switch-bands');
    const cands = open.map((g, i) => ({ g, i })).filter(({ g }) => !g.newOnly);
    if (!sol || !cands.length) { sel.innerHTML = ''; box.innerHTML = '<p class="empty">No thrifted goals open.</p>'; $('#switch-note').textContent = ''; return; }
    if (!cands.some(({ g }) => g.id === state.band.goal)) state.band.goal = cands[0].g.id;
    sel.innerHTML = cands.map(({ g }) => `<option value="${g.id}" ${g.id === state.band.goal ? 'selected' : ''}>${esc(g.name)}</option>`).join('');
    const { g, i: gi } = cands.find((c) => c.g.id === state.band.goal);
    const wk = $('#sw-week');
    wk.min = g.start; wk.max = g.end;
    state.band.week = clamp(state.band.week, g.start, g.end);
    wk.value = state.band.week; $('#sw-week-out').textContent = state.band.week;
    wk.setAttribute('aria-valuetext', `Week ${state.band.week}`);
    if (!g.syn && state.band.seen !== 1) state.band.seen = 1;
    $$('input[name="sw-seen"]').forEach((r) => { r.checked = Number(r.value) === state.band.seen; r.disabled = !g.syn && r.value !== '1'; });
    const t = state.band.week;
    // Most likely closet that week among the ones where this goal is still open.
    let f = 0; let bp = -1;
    (sol.maskDist[t] || new Map()).forEach((p, m) => { if (!((m >> gi) & 1) && p > bp) { bp = p; f = m; } });
    const seen = open.map((x, j) => (j === gi ? state.band.seen : x.newOnly && !((f >> j) & 1) && t >= x.start && t <= x.end ? 1 : 0));
    const bMax = Math.max(120, Math.ceil((g.nat.cost * 2 + 20) / 10) * 10);
    const bands = sol.bands(t, f, seen, 0, bMax);
    const cheapest = Math.min(state.band.seen & 1 ? g.nat.cost : Infinity, state.band.seen & 2 && g.syn ? g.syn.cost : Infinity);
    const nm = (j) => open[j].name.toLowerCase();
    const describe = (bd) => {
      const mine = bd.picks.find(([j]) => j === gi);
      const others = bd.picks.filter(([j]) => j !== gi).map(([j]) => nm(j));
      let main;
      if (mine) main = mine[1] === 'n' ? `Buy the ${g.natLabel || 'natural'} one` : 'Settle for synthetic';
      else main = bd.to < cheapest ? 'Can’t afford it yet' : 'Pass, and keep the money';
      return { main, extra: others.length ? `plus ${others.join(' and ')}` : '', cls: mine ? (mine[1] === 'n' ? 'nat' : 'syn') : bd.to < cheapest ? 'none' : 'wait' };
    };
    const split = [];
    bands.forEach((bd) => {
      if (!bd.picks.length && bd.from < cheapest && bd.to >= cheapest) { split.push({ ...bd, to: cheapest - 1 }); split.push({ ...bd, from: cheapest }); } else split.push(bd);
    });
    const segs = split.map((bd) => ({ ...bd, ...describe(bd) }));
    box.innerHTML = `<div class="band-bar" aria-hidden="true">${segs.map((s) => `<span class="band ${s.cls}" style="flex:${s.to - s.from + 1}"><b>${esc(s.main)}</b></span>`).join('')}</div>
      <div class="band-axis" aria-hidden="true"><span>$0</span><span>${money(Math.round(bMax / 2))}</span><span>${money(bMax)}+</span></div>
      <ol class="band-list">${segs.map((s) => `<li class="${s.cls}"><span class="band-range">${s.to >= bMax ? `${money(s.from)} and up` : `${money(s.from)} to ${money(s.to)}`}</span><span>${esc(s.main)}${s.extra ? `, ${esc(s.extra)}` : ''}</span></li>`).join('')}</ol>`;
    const waits = segs.filter((s) => s.cls === 'wait');
    const closet = open.filter((x, j) => (f >> j) & 1).map((x) => x.name.toLowerCase());
    const flip = segs.find((x, k) => x.cls === 'wait' && segs.slice(0, k).some((y) => y.cls === 'syn' || y.cls === 'nat'));
    const why = flip
      ? ` With ${money(flip.from)} to ${money(flip.to)} the plan passes even though it could buy, because that money is close to the ${g.natLabel || 'natural'} price. More money and it buys again.`
      : waits.length ? ` Between ${money(waits[0].from)} and ${money(waits[0].to)} the plan could buy something but passes, because keeping the money makes a better outcome likelier later.` : '';
    $('#switch-note').textContent = `Assumes week ${t} on the racks${closet.length ? `, with the ${closet.join(' and ')} already done` : ', with nothing bought yet'}.${why}`;
  }

  /* =========================================================
     Screen 8: results feed
     ========================================================= */
  function feedList() {
    const F = state.filters;
    const all = LISTINGS.filter((l) => !state.dismissed.has(l.id)).map(evaluate);
    const counts = { rules: 0, fit: 0, budget: 0, must: 0 };
    const shown = [];
    all.forEach((e) => {
      const pinned = state.pinned.has(e.item.id);
      e.greyed = false;
      if (e.deal && !pinned) { counts.rules++; if (!state.show.rules) return; e.greyed = true; }
      if (e.fit.status === 'no' && !F.fit.has('no')) { counts.fit++; if (!state.show.fit) return; e.greyed = true; }
      if (e.bud.status === 'hidden' || (isStrict() && e.bud.status === 'over')) { counts.budget++; if (!state.show.budget) return; e.greyed = true; }
      const must = pinned ? e.failsMust.filter((k) => k !== 'fiber') : e.failsMust;
      if (must.length) { counts.must++; if (!state.show.must) return; e.greyed = true; }
      if (F.types.size && !F.types.has(e.item.type)) return;
      if (F.sources.size && !F.sources.has(e.item.source)) return;
      if (F.maxPrice && e.item.price > F.maxPrice) return;
      if (F.withinOnly && e.bud.status !== 'within' && e.bud.status !== 'none') return;
      if (F.localOnly && !e.item.local) return;
      if (F.goalOnly && !e.scores.fillsGoal) return;
      if (F.fit.size && !F.fit.has(e.fit.status)) return;
      shown.push(e);
    });
    const sorters = {
      match: (a, b) => b.match - a.match,
      cost: (a, b) => a.total - b.total,
      natural: (a, b) => b.fi.score - a.fi.score,
      new: (a, b) => a.item.days - b.item.days
    };
    shown.sort((a, b) => (state.pinned.has(b.item.id) - state.pinned.has(a.item.id)) || sorters[state.sort](a, b));
    return { shown, counts };
  }
  function duplicateCount(item) {
    return state.wardrobe.filter((w) => w.type === item.type && w.color === item.colorName).length;
  }
  function costBreakdown(e) {
    const parts = [`${money(e.item.price)}`];
    if (state.budget.include) {
      if (e.item.ship) parts.push(`${money(e.item.ship)} ship`);
      else if (e.item.local) parts.push('pickup');
      e.fit.alts.forEach((a) => { if (e.fit.status === 'alter') parts.push(`${money((a.range[0] + a.range[1]) / 2)} ${a.key === 'sleeves' ? 'sleeves' : a.key === 'hem' ? 'hem' : a.key === 'waist' ? 'waist' : 'take-in'}`); });
    }
    return parts.join(' + ');
  }
  function whyHTML(e) {
    const w = e.w; const sum = e.den || 1;
    const rows = CRITERIA.filter((c) => w[c.id] > 0 && e.scores[c.id] != null);
    const maxShare = Math.max(...rows.map((c) => w[c.id] / sum));
    return rows.map((c) => {
      const share = w[c.id] / sum; const s = e.scores[c.id];
      return `<div class="why-row"><span class="why-name">${esc(c.name)}</span><span class="why-track" aria-hidden="true"><span style="width:${share / maxShare * 100}%"></span><b style="width:${share / maxShare * s * 100}%"></b></span><span class="why-val">+${Math.round(share * s * 100)}</span></div>`;
    }).join('') + `<p class="why-note">Bar length is your weight. The green part is how this item scored. The numbers add up to its ${pct(e.match)} match.</p>`;
  }
  function cardHTML(e) {
    const it = e.item; const pinned = state.pinned.has(it.id);
    const gw = goesWithCount(it);
    const dup = duplicateCount(it);
    const notes = [];
    if (gw) notes.push(`<li>Goes with ${gw} ${gw === 1 ? 'thing' : 'things'} you own</li>`);
    if (dup >= 2) notes.push(`<li class="warn">You already own ${dup} similar ${it.colorName} ${it.type === 'tops' ? 'tops' : it.type}.</li>`);
    if (e.deal) notes.push(`<li class="warn">Contains a fiber you said never to show.</li>`);
    if (e.failsMust.length) notes.push(`<li class="warn">Misses a must-have: ${e.failsMust.map((k) => CRITERIA.find((c) => c.id === k).name.toLowerCase()).join(', ')}.</li>`);
    notes.push(`<li class="nudge" data-nudge="${it.id}" hidden></li>`);
    const goalBadge = e.goal ? `<span class="badge goal">${ICON.goal}${state.filled[e.goal.id] ? `${esc(e.goal.name)} goal already filled` : `Fills: ${esc(e.goal.name.toLowerCase())} goal${it.version === 'synthetic' ? ' (synthetic)' : ''}`}</span>` : '';
    const after = e.bud.after != null ? `Remaining after this: ${money(Math.max(0, round2(e.bud.after)))}` : '';
    return `<li data-key="${it.id}"><article class="card ${pinned ? 'is-pinned' : ''} ${e.greyed ? 'is-greyed' : ''}" aria-labelledby="t-${it.id}">
      <div class="card-art">${itemArt(it, ALT_TEXT(it))}
        <span class="card-src">${esc(it.source)}</span>
        <p class="card-match"><strong>${pct(e.match)}</strong><small>match</small></p>
        <button type="button" class="heart" data-action="pin" data-id="${it.id}" aria-pressed="${pinned}" aria-label="I’d buy it anyway: ${esc(it.short)}" title="I’d buy it anyway">${ICON.heart}</button>
      </div>
      <div class="card-body">
        <h2 class="card-title" id="t-${it.id}"><a href="#/item/${it.id}">${esc(it.short)}</a></h2>
        <p class="card-price"><span class="total">${money(e.total)}</span><span class="breakdown">${esc(costBreakdown(e))}</span></p>
        ${fiberBar(e.fi)}
        <div class="card-badges">${fitBadge(e.fit)}${budgetBadge(e.bud)}${goalBadge}</div>
        <ul class="card-notes">${notes.join('')}</ul>
        <div class="why" id="why-${it.id}" ${state.openWhy.has(it.id) ? '' : 'hidden'}>${whyHTML(e)}</div>
        <div class="card-foot">
          <button type="button" class="text-link" data-action="why" data-id="${it.id}" aria-expanded="${state.openWhy.has(it.id)}" aria-controls="why-${it.id}">Why this rank?</button>
          <span class="remaining-after">${after}</span>
          <button type="button" class="text-link" data-action="dismiss" data-id="${it.id}" aria-label="Hide ${esc(it.short)}">Hide</button>
        </div>
      </div></article></li>`;
  }
  let nudgeRun = 0;
  function renderFeed(opts = {}) {
    $('#feed-meter').innerHTML = hasBudget() ? `<span class="visually-hidden">Budget: </span>${meterHTML()}` : '<p class="meter-text"><span>No budget set. Cost is shown but doesn’t affect ranking.</span></p>';
    const sel = $('#sort'); if (sel.value !== state.sort) sel.value = state.sort;
    const { shown, counts } = feedList();
    const list = $('#cards');
    const prevTop = list.firstElementChild && list.firstElementChild.dataset.key;
    const doRender = () => { list.innerHTML = shown.map(cardHTML).join(''); };
    if (opts.flip) flip(list, doRender); else doRender();
    $('#cards-empty').hidden = shown.length > 0;
    const bits = [];
    const lab = { rules: 'Hidden by your rules', fit: 'Won’t fit', budget: 'Over budget', must: 'Hidden by must-haves' };
    Object.keys(lab).forEach((k) => { if (counts[k]) bits.push(`<span>${lab[k]} (${counts[k]})</span><button type="button" class="text-link" data-show="${k}" aria-pressed="${state.show[k]}">${state.show[k] ? 'Hide again' : 'Show'}</button>`); });
    if (state.dismissed.size) bits.push(`<span>You hid ${state.dismissed.size}</span><button type="button" class="text-link" data-action="undismiss">Bring back</button>`);
    $('#hidden-row').innerHTML = bits.join('');
    const fc = activeFilterCount();
    $('#filter-count').textContent = fc || '';
    // underwear nudge
    const flags = underwearFlags();
    const ub = $('#underwear-banner');
    if ((flags.length || state.uwManual) && !state.filled.underwear) {
      ub.hidden = false;
      ub.innerHTML = `${ICON.needle}<p>${flags.length ? `${flags.length} ${flags.length === 1 ? 'piece' : 'pieces'} of underwear ${flags.length === 1 ? 'is' : 'are'} due for replacing.` : 'You asked for new underwear.'} We never send you thrifting for these.</p><a class="btn btn-quiet btn-small" href="#/underwear">See new picks</a>`;
    } else ub.hidden = true;
    const top = shown[0] && shown[0].item.short;
    if (opts.flip && shown[0] && shown[0].item.id !== prevTop) announce(`Results re-ordered. Top item: ${top}.`);
    scheduleNudges(shown);
  }
  function scheduleNudges(shown) {
    const run = ++nudgeRun;
    const base = runPlan();
    const cands = shown.filter((e) => !e.goal && (e.bud.status === 'within' || e.bud.status === 'over'));
    const step = (i) => {
      if (run !== nudgeRun || i >= cands.length) return;
      const e = cands[i];
      const alt = runPlan(e.total);
      let worst = null;
      activeGoals().forEach((g) => {
        if (state.filled[g.id] || g.newOnly || !base[g.id] || !alt[g.id]) return;
        const drop = base[g.id].nat - alt[g.id].nat;
        if (drop >= 0.03 && (!worst || drop > worst.drop)) worst = { g, drop, from: base[g.id].nat, to: alt[g.id].nat };
      });
      const el = $(`[data-nudge="${e.item.id}"]`);
      if (el && worst) { el.hidden = false; el.textContent = `Buying this lowers your ${worst.g.natLabel} ${worst.g.name.toLowerCase().replace(/^(winter|cream) /, '').replace(/ for spring$/, '')} chance from ${pct(worst.from)} to ${pct(worst.to)}.`; }
      setTimeout(() => step(i + 1), 0);
    };
    setTimeout(() => step(0), 30);
  }
  function activeFilterCount() {
    const F = state.filters;
    return F.types.size + F.sources.size + (F.maxPrice ? 1 : 0) + (F.withinOnly ? 1 : 0) + (F.localOnly ? 1 : 0) + (F.goalOnly ? 1 : 0) + F.fit.size;
  }
  function renderFilters() {
    const F = state.filters;
    const chip = (name, v, label, on) => `<label class="chip"><input type="checkbox" data-filter="${name}" value="${esc(v)}" ${on ? 'checked' : ''}><span>${esc(label)}</span></label>`;
    $('#filters-body').innerHTML = `
      <fieldset><legend class="block-title">Garment type</legend><div class="chips">${GARMENT_TYPES.map((t) => chip('types', t, cap1(t), F.types.has(t))).join('')}</div></fieldset>
      <fieldset><legend class="block-title">Source</legend><div class="chips">${['eBay', 'Etsy', 'ShopGoodwill', 'Local shop'].map((s) => chip('sources', s, s, F.sources.has(s))).join('')}</div></fieldset>
      <fieldset><legend class="block-title">Fit</legend><div class="chips">${[['ok', 'Fits as-is'], ['alter', 'With tailoring'], ['hard', 'Hard to alter'], ['no', 'Won’t fit'], ['unknown', 'No measurements']].map(([v, l]) => chip('fit', v, l, F.fit.has(v))).join('')}</div></fieldset>
      <div class="field money-field"><label for="f-max">Max sticker price</label><div class="affix"><span aria-hidden="true">$</span><input id="f-max" type="number" min="1" inputmode="decimal" data-filter-max placeholder="Any…" value="${F.maxPrice || ''}" autocomplete="off"></div></div>
      <fieldset><legend class="block-title">Only show</legend>
        <label class="switch"><input type="checkbox" data-filter-bool="withinOnly" ${F.withinOnly ? 'checked' : ''}><span class="switch-ui" aria-hidden="true"></span><span>Within budget</span></label>
        <label class="switch"><input type="checkbox" data-filter-bool="localOnly" ${F.localOnly ? 'checked' : ''}><span class="switch-ui" aria-hidden="true"></span><span>Local pickup</span></label>
        <label class="switch"><input type="checkbox" data-filter-bool="goalOnly" ${F.goalOnly ? 'checked' : ''}><span class="switch-ui" aria-hidden="true"></span><span>Fills a goal</span></label>
      </fieldset>`;
    const n = feedList().shown.length;
    $('#filters-apply').textContent = `Show ${n} ${n === 1 ? 'result' : 'results'}`;
  }

  /* =========================================================
     Screen 9: item detail
     ========================================================= */
  function fitDiagram(item, fit) {
    if (fit.status === 'unknown') return `<div class="verify"><p>The seller didn’t list measurements, so fit can’t be checked yet.</p><button type="button" class="btn btn-quiet btn-small" data-action="ask-measure" data-id="${item.id}">Ask seller for measurements</button></div>`;
    const lower = isBottom(item.type);
    const s = SHAPES[item.kind] || SHAPES.tee;
    const col = { ok: 'var(--ok)', alter: 'var(--alter)', hard: 'var(--hard)', no: 'var(--no)' };
    const k = 1.65; const ox = 14; const oy = 6;
    const P = (x, y) => [ox + x * k, oy + y * k];
    const zoneAt = {
      shoulder: { a: [40, 20], b: [80, 20] },
      chest: { a: [35, item.kind === 'dress' ? 40 : 52], b: [85, item.kind === 'dress' ? 40 : 52] },
      sleeve: { a: [90, s.cuff || 110], b: [104, (s.cuff || 110) - 2] },
      waist: { a: [36, 20], b: [84, 20] },
      inseam: { a: [30, 128], b: [54, 128] }
    };
    let body = '';
    const chestZ = fit.zones.find((z) => z.key === (lower ? 'waist' : 'chest'));
    if (chestZ) {
      const ratio = clamp(chestZ.target / chestZ.garment, 0.7, 1.3);
      body = `<path d="${s.body}" fill="none" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 2.5" transform="translate(60 0) scale(${ratio.toFixed(3)} 1) translate(-60 0)" vector-effect="non-scaling-stroke"/>`;
    }
    let ends = '';
    fit.zones.filter((z) => z.key === 'sleeve' || z.key === 'inseam').forEach((z) => {
      const anchor = zoneAt[z.key];
      const y = anchor.a[1] - z.diff * 3;
      ends += `<path d="M${anchor.a[0] - 4} ${y} H${anchor.b[0] + 2}" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 2.5" vector-effect="non-scaling-stroke"/>`;
    });
    const labelsX = 236;
    const sorted = [...fit.zones].sort((a, b) => zoneAt[a.key].a[1] - zoneAt[b.key].a[1]);
    let ly = 26;
    const zonesSvg = sorted.map((z) => {
      const za = zoneAt[z.key];
      const [x1, y1] = P(...za.a); const [x2, y2] = P(...za.b);
      const ty = Math.max(ly, y1); ly = ty + 34;
      const sign = z.diff > 0 ? '+' : z.diff < 0 ? '−' : '';
      const aria = `${z.label}: garment ${fmtIn(z.garment)}, you${z.key === 'chest' || z.key === 'waist' ? ' with ease' : ''} ${fmtIn(z.target)}. ${z.note}.`;
      return `<g class="zone" tabindex="0" role="img" aria-label="${esc(aria)}" data-tip="${esc(aria)}">
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col[z.status]}" stroke-width="4" stroke-linecap="round"/>
        <path d="M${Math.max(x1, x2) + 4} ${(y1 + y2) / 2} L${labelsX - 6} ${ty - 3}" stroke="var(--rule-strong)" stroke-width=".7" fill="none"/>
        <circle cx="${labelsX - 6}" cy="${ty - 3}" r="2" fill="${col[z.status]}"/>
        <text x="${labelsX}" y="${ty}" font-weight="500">${esc(z.label)}</text>
        <text x="${labelsX}" y="${ty + 12}" fill="var(--ink-soft)">${z.status === 'ok' ? 'OK' : z.status === 'alter' ? 'Alterable' : z.status === 'hard' ? 'Hard' : 'Can’t fix'}${Math.abs(z.diff) >= 0.05 ? ` ${sign}${fmtIn(Math.abs(z.diff))}` : ''}</text>
        <rect class="zone-hit" x="${Math.min(x1, x2) - 6}" y="${Math.min(y1, y2) - 8}" width="${labelsX + 70 - Math.min(x1, x2)}" height="${Math.abs(y2 - y1) + 16}" rx="3"/>
      </g>`;
    }).join('');
    return `<div class="fit-diagram">
      <svg viewBox="0 0 320 250" role="group" aria-label="Fit diagram: garment outline with your measurements overlaid">
        <g transform="translate(${ox} ${oy}) scale(${k})" opacity=".9">${garmentInner(item.kind, item.color)}${body}${ends}</g>
        ${zonesSvg}
      </svg>
      <ul class="fit-legend"><li><i style="border-color:var(--ink-faint)"></i>Garment</li><li><i class="dash" style="border-color:var(--ink)"></i>You, with your ease</li><li><i style="border-color:var(--ok)"></i>OK</li><li><i style="border-color:var(--alter)"></i>Alterable</li><li><i style="border-color:var(--no)"></i>Not alterable</li></ul>
      <p class="hint">Hover or focus a zone for the numbers. Taking in is easy. Letting out is limited by seam allowance. Shoulders are the hardest to change.</p>
    </div>`;
  }
  function altListHTML(fit) {
    const rows = fit.alts.map((a) => `<li>${ICON.needle}<span>${esc(altLabel(a))}</span><span class="price">est. ${money(a.range[0])} to ${money(a.range[1])}</span></li>`);
    fit.zones.filter((z) => z.status === 'no' || z.status === 'hard').forEach((z) => rows.push(`<li class="cannot">${ICON.hard}<span>${esc(z.note)}</span><span class="price">${z.status === 'no' ? 'can’t fix' : 'risky'}</span></li>`));
    return rows.length ? `<ul class="alt-list">${rows.join('')}</ul><p class="hint">Estimates only. Confirm with your tailor.</p>` : '<p class="hint">No alterations needed.</p>';
  }
  function fiberLabelHTML(e) {
    if (e.fi.unknown) {
      const q = `Hi! Could you check the content tag on the ${e.item.short.toLowerCase()}? I’m looking for the fiber percentages (for example 100% silk or 100% polyester). Thank you!`;
      return `<div class="verify"><p><span class="badge info">${ICON.unknown}Verify fiber</span></p><p>No fiber is listed, so it scores a flat 30% natural and is never hidden automatically. A quick message to the seller settles it:</p>
        <blockquote id="seller-q">${esc(q)}</blockquote>
        <button type="button" class="btn btn-quiet btn-small" data-action="copy-q">Copy message</button></div>`;
    }
    const care = [...new Set(e.item.fibers.map(([n]) => CARE[n === 'merino' ? 'wool' : n === 'viscose' ? 'rayon' : n]).filter(Boolean))];
    const colorFor = { nat: 'var(--sage)', semi: 'url(#stripe)', syn: 'var(--synthetic)', ign: 'var(--synthetic)' };
    return `<div class="fiber-label" aria-label="Fiber facts">
      <h3>Fiber Facts</h3><p class="fl-sub">Per garment · by weight · ${e.item.fiberSource === 'text' ? 'read from the listing text' : 'from the listing’s material field'}</p>
      <div class="fl-thick"></div>
      <div class="fl-row main"><span>Natural score</span><span>${pct(e.fi.score)}</span></div>
      ${e.fi.segs.map((s) => `<div class="fl-row"><span class="fl-k"><i style="background:${s.cls === 'semi' ? 'repeating-linear-gradient(45deg,var(--amber) 0 3px,var(--amber-pale) 3px 6px)' : colorFor[s.cls]}"></i>${esc(s.name)}${s.cls === 'semi' ? ' (semi-synthetic)' : s.cls === 'ign' ? ' (stretch, ignored)' : ''}</span><span>${s.p}%</span></div>`).join('')}
      <p class="fl-care">${esc(care.join(' ') || 'Follow the care tag.')}</p>
    </div>`;
  }
  function renderItem(id) {
    const it = LISTINGS.find((l) => l.id === id);
    const box = $('#item-body');
    if (!it) { box.innerHTML = '<h1 id="item-title" tabindex="-1">That listing isn’t here anymore.</h1><p><a href="#/finds">Back to your finds</a></p>'; return; }
    const e = evaluate(it);
    const owned = state.wardrobe.filter((w) => (it.pairs || []).includes(w.id));
    const B = state.budget;
    const altTxt = e.fit.alts.length && e.fit.status === 'alter' ? e.fit.alts.map((a) => `${money((a.range[0] + a.range[1]) / 2)} ${a.name.toLowerCase()}`).join(' + ') : '';
    const line = `${money(it.price)} ${it.source === 'Local shop' ? 'thrift' : 'item'}${it.ship ? ` + ${money(it.ship)} shipping` : ''}${altTxt ? ` + ${altTxt}` : ''} = <strong>${money(round2(it.price + it.ship + e.fit.altMid))}</strong> <span class="vs">vs. ~${money(it.newPrice)} new</span>`;
    let use = '';
    if (hasBudget()) {
      const rem = remaining();
      use = `Uses ${pct((it.price + it.ship + e.fit.altMid) / Math.max(1, rem))} of your remaining ${money(Math.max(0, round2(rem)))}.`;
      if (B.envOn && e.fit.altMid) use += ` Tailoring uses ${money(e.fit.altMid)} of your ${money(Math.max(0, envLeft('tailoring')))} tailoring envelope.`;
    }
    const saved = state.saved.has(it.id);
    const slides = [
      `<figure class="slide">${itemArt(it, ALT_TEXT(it))}<figcaption>Front</figcaption></figure>`,
      `<figure class="slide"><svg viewBox="0 0 120 120" role="img" aria-label="Fabric close-up, ${esc(it.colorName)}"><rect width="120" height="120" fill="${it.color}"/><rect width="120" height="120" fill="url(#weave)" transform="scale(3)"/>${it.kind === 'sweater' ? '<path d="M30 0 q12 15 0 30 q-12 15 0 30 q12 15 0 30 q-12 15 0 30 M90 0 q-12 15 0 30 q12 15 0 30 q-12 15 0 30 q12 15 0 30" stroke="rgba(20,20,19,.25)" stroke-width="3" fill="none"/>' : ''}</svg><figcaption>Fabric close-up</figcaption></figure>`,
      `<figure class="slide"><svg viewBox="0 0 120 140" role="img" aria-label="Laid flat with measurements">${garmentInner(it.kind, it.color)}${Object.entries(it.meas || {}).map(([k, v], i) => `<text x="${6}" y="${10 + i * 9}" font-size="6" font-family="Poppins, Arial" fill="var(--ink)">${k} ${fmtIn(v)}</text>`).join('')}</svg><figcaption>Measured flat</figcaption></figure>`
    ];
    box.innerHTML = `<article class="detail">
      <div class="detail-media">
        <div class="carousel" aria-roledescription="carousel" aria-label="Photos of ${esc(it.short)}">
          <div class="slides" id="slides" tabindex="0" aria-live="polite">${slides.join('')}</div>
          <div class="carousel-nav"><button type="button" class="icon-btn" data-action="slide" data-dir="-1" aria-label="Previous photo"><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M11 4L6 9l5 5"/></svg></button>
          <div class="carousel-dots" aria-hidden="true"><span class="on"></span><span></span><span></span></div>
          <button type="button" class="icon-btn" data-action="slide" data-dir="1" aria-label="Next photo"><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M7 4l5 5-5 5"/></svg></button></div>
        </div>
        ${owned.length ? `<div><h2 class="block-title">Pairs with ${owned.length} things you own</h2><ul class="pairs">${owned.map((w) => `<li><span class="thumb">${garment(wardrobeKind(w), colorHex(w.color))}</span><span>${esc(w.name)}</span></li>`).join('')}</ul></div>` : ''}
      </div>
      <div class="detail-info">
        <header class="detail-head">
          <p class="label">${esc(it.source)} · ${it.local ? 'local pickup' : `${money(it.ship)} shipping`} · ${pct(e.match)} match</p>
          <h1 id="item-title" tabindex="-1">${esc(it.title)}</h1>
          <p class="seller">“${esc(it.desc)}”</p>
          <div class="card-badges">${fitBadge(e.fit)}${budgetBadge(e.bud)}${e.goal ? `<span class="badge goal">${ICON.goal}Fills: ${esc(e.goal.name.toLowerCase())} goal</span>` : ''}</div>
        </header>
        <section class="detail-sec" aria-labelledby="sec-cost"><h2 id="sec-cost">Total cost</h2>
          <p class="cost-line">${line}</p>${use ? `<p class="hint">${use}</p>` : ''}
          <div class="detail-actions">
            ${e.fit.alts.length ? `<a class="btn btn-solid" href="#/tailors/${it.id}">Find a tailor for this</a>` : ''}
            <button type="button" class="btn ${e.fit.alts.length ? 'btn-quiet' : 'btn-solid'}" data-action="save" data-id="${it.id}" aria-pressed="${saved}">${saved ? 'Saved' : 'Save'}</button>
            <button type="button" class="btn btn-quiet" data-action="bought" data-id="${it.id}">Mark as bought</button>
            <button type="button" class="text-link" data-action="listing">View original listing</button>
          </div>
        </section>
        <section class="detail-sec" aria-labelledby="sec-fiber"><h2 id="sec-fiber">Fiber</h2>${fiberLabelHTML(e)}</section>
        <section class="detail-sec" aria-labelledby="sec-fit"><h2 id="sec-fit">Fit check</h2>${fitDiagram(it, e.fit)}<div class="seam-line" aria-hidden="true"></div><h3 class="block-title">Alterations</h3>${altListHTML(e.fit)}</section>
      </div></article>`;
    state.signals.fiberLooks++;
    maybeSuggestFabric();
  }

  /* =========================================================
     Screen 10: tailors
     ========================================================= */
  function tailorRows() {
    const job = state.tailorJob && LISTINGS.find((l) => l.id === state.tailorJob);
    const fit = job ? fitEval(job) : null;
    const need = fit ? [...new Set(fit.alts.flatMap((a) => a.skills))] : [];
    const R = state.radius;
    return TAILORS.map((t) => {
      const adj = adjusted(t);
      const passes = t.rating >= 4.5 && t.reviews >= 10;
      const skill = need.length ? need.filter((s) => t.skills.includes(s)).length / need.length : 0;
      const score = 0.6 * clamp((adj - 4) / 1, 0, 1) + 0.25 * skill + 0.15 * clamp(1 - t.dist / R, 0, 1);
      return { t, adj, passes, skill, score, need };
    }).filter((r) => r.t.dist <= R && (state.showAllTailors || r.passes)).sort((a, b) => b.score - a.score);
  }
  function renderTailors() {
    const job = state.tailorJob && LISTINGS.find((l) => l.id === state.tailorJob);
    const fit = job ? fitEval(job) : null;
    $('#tailor-job').innerHTML = job && fit.alts.length ? `<div class="job"><span class="thumb">${itemArt(job)}</span><div>
      <h2>${esc(job.short)}</h2><ul>${fit.alts.map((a) => `<li>${esc(altLabel(a))}, est. ${money(a.range[0])} to ${money(a.range[1])}</li>`).join('')}</ul>
      <button type="button" class="btn btn-quiet btn-small" data-action="copy-alts">Copy alteration list</button> <a class="text-link" href="#/tailors">Clear job</a></div></div>`
      : `<div class="job-empty"><p>Pick a find that needs work and tap “Find a tailor for this” to match tailors to the job. Or browse them all below.</p><a class="text-link" href="#/finds">Go to your finds</a></div>`;
    $('#radius').value = state.radius;
    $('#radius-out').textContent = `${state.radius} mi`;
    $('#show-all-tailors').checked = state.showAllTailors;
    const rows = tailorRows();
    const day = TODAY.getDay();
    $('#tailor-list').innerHTML = rows.length ? rows.map((r, i) => {
      const t = r.t;
      const open = t.days ? (t.days.includes(day) ? 'Open today' : 'Closed today') : 'Hours unknown';
      const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.name} ${t.addr}`)}`;
      const dir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(t.addr)}`;
      return `<li class="tailor ${r.passes ? '' : 'below'}" id="tl-${t.id}" data-tailor="${t.id}">
        <div class="tailor-top"><h2>${esc(t.name)}</h2><p class="tailor-rating"><strong>${r.adj.toFixed(2)}</strong><small>adjusted from ${t.rating.toFixed(1)}★ (${t.reviews})</small></p></div>
        <p class="tailor-meta">${fmtNum.format(t.dist)} mi · ${esc(t.addr)}</p>
        <p class="tailor-meta">${open} · ${esc(t.hours)}${r.passes ? '' : ' · <i>below the 4.5★ / 10-review default</i>'}</p>
        <div class="tailor-tags">${t.tags.map((tag) => { const m = r.need.some((s) => tag.includes(s === 'denim' ? 'jean' : s === 'hem' ? 'hem' : s === 'suits' ? 'suit' : s === 'dresses' ? 'dress' : s === 'trousers' ? 'trouser' : s)); return `<span class="tag ${m ? 'match' : ''}">${esc(tag)}</span>`; }).join('')}</div>
        ${r.need.length ? `<p class="tailor-meta"><i>${r.skill >= 1 ? 'Reviews mention exactly this kind of job.' : r.skill > 0 ? 'Reviews mention some of this job.' : 'No reviews mention this kind of job.'}</i></p>` : ''}
        <div class="tailor-actions">
          <a class="btn btn-quiet" href="${maps}" target="_blank" rel="noopener" aria-label="Call ${esc(t.name)}: phone number on Google Maps">Call</a>
          <a class="btn btn-quiet" href="${dir}" target="_blank" rel="noopener" aria-label="Directions to ${esc(t.name)}">Directions</a>
          ${job && fit.alts.length ? '<button type="button" class="btn btn-quiet" data-action="copy-alts">Copy alteration list</button>' : ''}
        </div></li>`;
    }).join('') : '<li class="empty">No tailors in this radius pass the filter. Widen the radius or show all tailors.</li>';
    // map
    const S = 11; const cx = 160; const cy = 125;
    const pins = rows.map((r, i) => {
      const a = r.t.bearing * Math.PI / 180;
      const x = cx + Math.sin(a) * r.t.dist * S; const y = cy - Math.cos(a) * r.t.dist * S;
      return `<g class="map-pin" tabindex="0" role="button" data-pin="${r.t.id}" aria-label="${esc(r.t.name)}, ${r.t.dist} miles. Show in list.">
        <circle class="pin" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${r.passes ? 'var(--clay)' : 'var(--rule-strong)'}" stroke="var(--paper)" stroke-width="1.5"/>
        <text x="${x.toFixed(1)}" y="${(y + 2.6).toFixed(1)}" text-anchor="middle" font-size="7" fill="#faf9f5" style="pointer-events:none">${i + 1}</text></g>`;
    }).join('');
    $('#tailor-map').innerHTML = `<svg viewBox="0 0 320 250" role="group" aria-label="Map of tailors around Milpitas">
      <defs><clipPath id="mapclip"><rect width="320" height="250"/></clipPath></defs>
      <rect width="320" height="250" fill="var(--paper-deep)"/>
      <g clip-path="url(#mapclip)">
        <path d="M0 40 Q80 70 120 40 T320 30" stroke="var(--blue)" stroke-opacity=".35" stroke-width="10" fill="none"/>
        <path d="M60 0 L150 250 M250 0 L190 250 M0 150 L320 120" stroke="var(--rule-strong)" stroke-width="1.2" fill="none" opacity=".6"/>
        <circle cx="${cx}" cy="${cy}" r="${5 * S}" fill="none" stroke="var(--rule-strong)" stroke-width=".6" stroke-dasharray="2 3"/>
        <circle cx="${cx}" cy="${cy}" r="${10 * S}" fill="none" stroke="var(--rule-strong)" stroke-width=".6" stroke-dasharray="2 3"/>
        <circle cx="${cx}" cy="${cy}" r="${state.radius * S}" fill="var(--clay)" fill-opacity=".05" stroke="var(--clay)" stroke-width="1" stroke-dasharray="5 3"/>
        <text x="${cx + 5 * S + 3}" y="${cy - 2}">5 mi</text><text x="${cx + 10 * S + 3}" y="${cy - 2}">10 mi</text>
        <text x="70" y="22" font-size="9">Fremont</text><text x="150" y="232" font-size="9">San Jose</text>
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--ink)"/><text x="${cx + 6}" y="${cy + 12}" font-size="9" fill="var(--ink)">Milpitas</text>
        ${pins}
      </g></svg>`;
  }

  /* =========================================================
     Screen 11: underwear
     ========================================================= */
  function renderUnderwear() {
    const flags = underwearFlags();
    $('#uw-interval').value = String(state.uwInterval);
    $('#uw-flags').innerHTML = flags.length ? flags.map((f) => `<li><span class="thumb">${garment(wardrobeKind(f.item), colorHex(f.item.color))}</span><div><p>${esc(f.item.name)}</p>${f.why.map((w) => `<span class="why">${esc(w)}</span>`).join('')}</div></li>`).join('')
      : `<li class="ok-row">${state.uwManual ? 'Nothing flagged, but you asked for new pairs.' : 'Nothing flagged right now.'}</li>`;
    $('#uw-env-note').textContent = state.budget.envOn ? `checked against your ${money(Math.max(0, envLeft('underwear')))} underwear envelope` : hasBudget() ? `checked against your ${money(Math.max(0, round2(remaining())))} remaining` : '';
    const evs = UNDERWEAR.map(evaluate).sort((a, b) => b.match - a.match);
    $('#uw-recs').innerHTML = evs.map((e) => {
      const u = e.item; const saved = state.saved.has(u.id);
      return `<li class="rec"><div class="art">${garment(u.kind, u.color, `${u.brand} ${u.short}`)}</div>
        <div class="rec-head"><div><p class="brand">${esc(u.brand)}</p><h3>${esc(u.short)}</h3></div><p class="card-match"><strong>${pct(e.match)}</strong><small>match</small></p></div>
        ${fiberBar(e.fi)}
        <p class="per">${money(u.price)} · ${money(round2(u.price / u.pairs))} per pair</p>
        <div class="card-badges">${budgetBadge(e.bud)}</div>
        <p class="hint">${esc(u.note)}</p>
        <div class="detail-actions"><button type="button" class="btn btn-quiet btn-small" data-action="save" data-id="${u.id}" aria-pressed="${saved}">${saved ? 'Saved' : 'Save'}</button>
        <button type="button" class="btn btn-solid btn-small" data-action="bought" data-id="${u.id}">Mark as bought</button>
        <a class="text-link" href="${u.url}" target="_blank" rel="noopener">${esc(u.brand)} site</a></div></li>`;
    }).join('');
  }

  /* =========================================================
     Screen 12: saved and plan
     ========================================================= */
  const GROUPS = [['tailor', 'Buy & tailor'], ['asis', 'Buy as-is'], ['new', 'Buy new (underwear)'], ['maybe', 'Maybe']];
  const findAny = (id) => LISTINGS.find((l) => l.id === id) || UNDERWEAR.find((u) => u.id === id);
  function defaultGroup(item) {
    if (item.id.startsWith('uw-')) return 'new';
    return fitEval(item).status === 'alter' ? 'tailor' : 'asis';
  }
  function renderSaved() {
    const groups = {}; GROUPS.forEach(([k]) => { groups[k] = []; });
    state.saved.forEach((g, id) => { const it = findAny(id); if (it) groups[g].push(evaluate(it)); });
    const html = GROUPS.map(([k, label]) => {
      const list = groups[k]; if (!list.length) return '';
      const sub = list.reduce((s, e) => s + e.total, 0);
      return `<section class="saved-group" aria-labelledby="sg-${k}"><div class="saved-group-head"><h2 id="sg-${k}">${label}</h2><span>${money(round2(sub))}</span></div>
        <ul class="saved-list">${list.map((e) => { const it = e.item; return `<li class="s-item"><span class="thumb">${itemArt(it)}</span>
          <div><h3>${it.id.startsWith('uw-') ? esc(`${it.brand} ${it.short}`) : `<a href="#/item/${it.id}">${esc(it.short)}</a>`}</h3><p class="sub">${it.id.startsWith('uw-') ? 'New' : `${FIT_LABEL[e.fit.status]}${e.fit.alts.length && e.fit.status === 'alter' ? `: ${e.fit.alts.map((a) => a.name.toLowerCase()).join(', ')}` : ''}`}</p></div>
          <span class="amt">${money(e.total)}</span>
          <div class="s-actions"><div class="select-wrap"><select data-group="${it.id}" aria-label="Group for ${esc(it.short)}">${GROUPS.map(([gk, gl]) => `<option value="${gk}" ${gk === k ? 'selected' : ''}>${gl}</option>`).join('')}</select></div>
            <button type="button" class="text-link" data-action="bought" data-id="${it.id}">Mark as bought</button>
            ${e.fit.alts.length && e.fit.status === 'alter' ? `<a class="text-link" href="#/tailors/${it.id}">Find a tailor</a>` : ''}
            <button type="button" class="text-link" data-action="unsave" data-id="${it.id}">Remove</button></div></li>`; }).join('')}</ul></section>`;
    }).join('');
    $('#saved-groups').innerHTML = html || `<div class="saved-empty"><p>Nothing saved yet. Tap Save on any find to plan it here.</p><a class="btn btn-quiet" href="#/finds">Browse finds</a></div>`;
    const all = [...state.saved.keys()].map(findAny).filter(Boolean).map(evaluate);
    const grand = all.reduce((s, e) => s + e.total, 0);
    const noMaybe = all.filter((e) => state.saved.get(e.item.id) !== 'maybe').reduce((s, e) => s + e.total, 0);
    const rem = remaining();
    $('#saved-total').innerHTML = `<p class="label">Totals</p>${GROUPS.map(([k, l]) => { const s = all.filter((e) => state.saved.get(e.item.id) === k).reduce((a, e) => a + e.total, 0); return s ? `<p class="total-row"><span>${l}</span><span>${money(round2(s))}</span></p>` : ''; }).join('')}
      <p class="total-row grand ${noMaybe > rem ? 'over' : ''}"><span>Without maybes</span><span>${money(round2(noMaybe))}</span></p>
      <p class="total-row"><span>Everything</span><span>${money(round2(grand))}</span></p>
      <p class="hint">${hasBudget() ? `${money(Math.max(0, round2(rem)))} left in your budget. ${noMaybe > rem ? `That’s ${money(round2(noMaybe - rem))} more than you have now. ${weekly() > 0 ? `Your allowance covers it in about ${Math.ceil((noMaybe - rem) / weekly())} ${Math.ceil((noMaybe - rem) / weekly()) === 1 ? 'week' : 'weeks'}.` : 'Add an allowance to cover it.'}` : 'It fits.'}` : 'No budget set.'}</p>`;
    // week by week plan
    const plan = runPlan();
    const goals = activeGoals().sort((a, b) => a.start - b.start || b.imp - a.imp);
    const steps = [];
    goals.forEach((g) => {
      const r = plan[g.id] || {};
      if (state.filled[g.id]) return;
      if (g.newOnly) {
        const wk = r.week ? Math.round(r.week) : g.start;
        steps.push([`Week ${wk}`, `Order underwear new, ${g.natLabel}. About ${money(g.nat.cost)}.${wk > g.start ? ` The plan usually waits until week ${wk}, so the cash is free if a good thrift find turns up first.` : ''}`]);
      }
      else steps.push([`Wk ${g.start} to ${g.end}`, `Watch for ${g.name.toLowerCase()} in ${g.natLabel} under ${money(g.nat.cost)}${g.syn ? `, or settle for synthetic under ${money(g.syn.cost)}` : ''}. ${pct((r.nat || 0) + (r.syn || 0))} chance by week ${g.end}.`]);
    });
    const { sol } = planFull();
    if (sol && sol.strategies.length > 1) {
      sol.stratUse.forEach((u, t) => {
        if (!u || u[0] > 0.7) return;
        const l = u[1] >= u[2] ? 1 : 2;
        const due = activeGoals().filter((g) => !state.filled[g.id] && !g.newOnly && g.end >= t && g.end <= t + 2).map((g) => g.name.toLowerCase());
        steps.push([`Week ${t}`, `${due.length ? `If the ${due.join(' and ')} ${due.length === 1 ? 'is' : 'are'} still open` : 'If anything is still open'}, ${l === 1 ? 'add saved searches' : 'cast a wide net online'}. The plan does this in ${pct(1 - u[0])} of its paths.`]);
      });
      steps.sort((x, y) => (parseInt(x[0].replace(/\D+/, ''), 10) || 99) - (parseInt(y[0].replace(/\D+/, ''), 10) || 99));
    }
    const tailorBound = [...state.saved.keys()].map(findAny).filter((it) => it && !it.id.startsWith('uw-')).map((it) => ({ it, fit: fitEval(it) })).filter((x) => x.fit.status === 'alter');
    tailorBound.forEach(({ it, fit }) => {
      const prev = state.tailorJob; state.tailorJob = it.id;
      const best = tailorRows()[0]; state.tailorJob = prev;
      if (best) steps.push(['Then', `Drop the ${it.short.toLowerCase()} at ${best.t.name} to ${fit.alts.map((a) => a.name.toLowerCase()).join(' and ')}.`]);
    });
    $('#week-plan').innerHTML = steps.length ? steps.map(([w, t]) => `<li><span class="wk">${esc(w)}</span><span>${esc(t)}</span></li>`).join('') : '<li><span class="wk">Done</span><span>All goals filled. Enjoy wearing them.</span></li>';
  }

  /* =========================================================
     Screen 13: the method, filled in with the user's numbers
     ========================================================= */
  function renderMethod() {
    const { open, sol } = planFull();
    const { start, allow, partial } = planInputs();
    const setM = (k, v) => $$(`[data-m="${k}"]`).forEach((el) => { el.textContent = v; });
    setM('allow', `${money(allow)} a week`);
    setM('start', money(start));
    setM('partial', pct(partial));
    setM('ms', sol ? `${Math.max(1, sol.ms)} ms` : 'no time');
    setM('states', sol ? sol.states.toLocaleString('en-US') : 'no');
    setM('fraction', sol ? `${pct(sol.fraction)}` : 'not available until you add a goal');
    if (!sol) { $('#m-vector').innerHTML = '<p class="empty">Add a goal on the plan screen to fill this in.</p>'; $('#m-ledger').innerHTML = ''; $('#m-strats').innerHTML = ''; return; }

    // §2.3 vector for week 1, everything in season turning up on the racks.
    const seen = open.map((g) => (g.start <= 1 && 1 <= g.end ? (g.syn ? 3 : 1) : 0));
    const vt = Planner.vectorTable(open, seen, 0, partial);
    const keptDedup = new Set(vt.dedup); const keptFinal = new Set(vt.pruned);
    const name = (picks) => (picks.length ? picks.map(([i, k]) => `${open[i].name.toLowerCase()}${open[i].newOnly ? '' : k === 'n' ? ` (${open[i].natLabel || 'natural'})` : ' (synthetic)'}`).join(' + ') : 'Buy nothing');
    const rows = vt.sorted.map((o) => {
      const why = keptFinal.has(o) ? 'Kept' : keptDedup.has(o) ? 'A cheaper set does as well' : 'Same cost, less utility';
      return `<tr class="${keptFinal.has(o) ? 'kept' : 'cut'}"><td>${esc(cap1(name(o.picks)))}</td><td>${money(o.c)}</td><td>${fmtNum.format(Math.round(o.u * 10) / 10)}</td><td>${why}</td></tr>`;
    }).join('');
    const solverKeeps = sol.vector(0, seen, 0).length;
    $('#m-vector').innerHTML = `<p class="tally"><span><b>${vt.all.length}</b> combinations</span><span aria-hidden="true">→</span><span><b>${vt.dedup.length}</b> after keeping the best at each cost</span><span aria-hidden="true">→</span><span><b>${vt.pruned.length}</b> after dropping dominated ones</span></p>
      <div class="table-wrap scroll"><table class="ptable num vec-table"><caption class="visually-hidden">Every purchase combination in week 1, sorted by cost</caption>
        <thead><tr><th scope="col">Purchases</th><th scope="col">Cost</th><th scope="col">Utility</th><th scope="col">Result</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="vec-final" role="group" aria-label="Final vectors"><p><i>c</i>(1) = (${vt.pruned.map((o) => o.c).join(', ')})</p><p><i>u</i>(1) = (${vt.pruned.map((o) => fmtNum.format(Math.round(o.u * 10) / 10)).join(', ')})</p></div>
      <p class="hint">The paper’s rule keeps ${vt.pruned.length} of ${vt.all.length}. The solver keeps ${solverKeeps}, because it only compares sets that leave your closet in the same state (see §7).</p>`;

    // Hunting strategies, with the coat's weekly find chance under each and how often the plan uses it.
    const ex = open.find((g) => !g.newOnly) || open[0];
    const use = STRATS.map((s, l) => (sol.strategies.length === 1 ? (sol.strategies[0].id === s.id ? 12 : 0) : sol.stratUse.slice(1).reduce((a, u) => a + u[l], 0)));
    $('#m-strats').innerHTML = `<caption>Hunting strategies, the stand-in for the paper’s portfolios</caption>
      <thead><tr><th scope="col">Strategy</th><th scope="col"><i>r<sub>l</sub></i></th><th scope="col">Shipping a piece</th><th scope="col">${esc(ex.name)} turns up</th><th scope="col">Weeks used, on average</th></tr></thead>
      <tbody>${STRATS.map((s, l) => `<tr><th scope="row">${esc(s.name)}</th><td>${s.reach}</td><td>${money(s.ship)}</td><td>${pct(Planner.findChance(ex.nat.p, s.reach))}</td><td>${fmtNum.format(Math.round(use[l] * 10) / 10)}</td></tr>`).join('')}</tbody>`;

    // §6 ledger: V(1, b0, ∅) = Σ u·P.
    const lines = open.map((g, i) => {
      const r = sol.goals[i];
      return `<tr><th scope="row">${esc(g.name)}</th><td>${fmtImp(g.imp)}</td><td>${pct(r.nat)}</td><td>${g.syn ? pct(r.syn) : '·'}</td><td>${r.utility.toFixed(2)}</td></tr>`;
    }).join('');
    const sum = sol.goals.reduce((s, g) => s + g.utility, 0);
    const match = Math.abs(sum - sol.EU) < 1e-6;
    $('#m-ledger').innerHTML = `<div class="table-wrap"><table class="ptable num"><caption class="visually-hidden">Each goal’s share of the expected utility</caption>
      <thead><tr><th scope="col">Goal</th><th scope="col"><i>u</i></th><th scope="col">P(natural)</th><th scope="col">P(synthetic)</th><th scope="col"><i>u</i>·P(nat) + <i>ρu</i>·P(syn)</th></tr></thead>
      <tbody>${lines}</tbody>
      <tfoot><tr><th scope="row" colspan="4">Sum</th><td>${sum.toFixed(2)}</td></tr><tr><th scope="row" colspan="4"><i>V</i>(1, ${money(sol.b0)}, ∅) from equation (4′)</th><td>${sol.EU.toFixed(2)}</td></tr></tfoot></table></div>
      <p class="check ${match ? 'ok' : ''}">${match ? 'They agree to the sixth decimal.' : 'They differ, which would mean a bug.'} The most you could get is ${fmtNum.format(Math.round(sol.maxU * 10) / 10)}, if every goal came through in its natural version.</p>`;
  }

  /* =========================================================
     Actions
     ========================================================= */
  function markBought(id) {
    const it = findAny(id); if (!it) return;
    const isUw = id.startsWith('uw-');
    const fit = isUw ? { altMid: 0, alts: [] } : fitEval(it);
    const amount = round2(isUw ? it.price : it.price + it.ship + fit.altMid);
    const entry = { id: `s-${Date.now()}`, itemId: id, label: isUw ? `${it.brand} ${it.short}` : it.short, amount, newPrice: isUw ? 0 : it.newPrice,
      env: isUw ? { underwear: amount } : { thrift: round2(it.price + it.ship), tailoring: fit.altMid } };
    const prevSaved = state.saved.get(id);
    const goal = isUw ? 'underwear' : it.goal;
    const prevFilled = goal ? state.filled[goal] : undefined;
    state.spent.push(entry);
    state.saved.delete(id);
    if (goal && activeGoals().some((g) => g.id === goal) && !state.filled[goal]) state.filled[goal] = isUw ? 'natural' : it.version || 'natural';
    if (isUw) { state.uwManual = false; state.wardrobe.forEach((w) => { if (w.type === 'underwear') { w.cond = 'great'; w.acq = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}`; } }); }
    rerender();
    const msg = `${entry.label} marked as bought: ${money(amount)}.${goal && state.filled[goal] && prevFilled === undefined ? ' Goal filled.' : ''}`;
    announce(msg);
    toast(msg, [{ label: 'Undo', primary: true, fn: () => {
      state.spent = state.spent.filter((x) => x.id !== entry.id);
      if (prevSaved) state.saved.set(id, prevSaved);
      if (goal && prevFilled === undefined) delete state.filled[goal];
      rerender();
      announce('Undone.');
    } }]);
  }
  function applyWeightNudge(kind) {
    if (state.mode === 'quick') state.balance = clamp(state.balance + (kind === 'style' ? 0.1 : -0.1), 0, 1);
    else if (kind === 'style') { state.imp.style = clamp(state.imp.style + 1, 0, 5); state.imp.fiber = clamp(state.imp.fiber - 1, 0, 5); }
    else { state.imp.fiber = clamp(state.imp.fiber + 1, 0, 5); state.imp.style = clamp(state.imp.style - 1, 0, 5); }
    rerender({ flip: true });
    announce(kind === 'style' ? 'Style weighted higher.' : 'Natural fiber weighted higher.');
  }
  function maybeSuggestFabric() {
    if (state.signals.fiberLooks >= 4 && !state.suggested.has('fabric')) {
      state.suggested.add('fabric');
      toast('You keep opening fiber labels. Fabric seems to matter to you. Weight natural fiber a little higher?', [{ label: 'Adjust', primary: true, fn: () => applyWeightNudge('fiber') }, { label: 'Not now' }], 10000);
    }
  }

  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-action], [data-balance], [data-wpreset], [data-tot], [data-show], [data-rail-filter], [data-whatif]');
    if (!t) return;
    const a = t.dataset.action; const id = t.dataset.id;
    if (t.dataset.balance) { state.balance = Number(t.dataset.balance) / 100; rerender({ flip: true }); return; }
    if (t.dataset.wpreset) { state.imp = { ...WEIGHT_PRESETS[t.dataset.wpreset] }; rerender({ flip: true }); announce(`${t.dataset.wpreset} weights applied.`); return; }
    if (t.dataset.tot) {
      const q = THIS_OR_THAT[state.tot.i]; const d = (t.dataset.tot === 'a' ? q.a : q.b)[1];
      Object.entries(d).forEach(([k, v]) => { state.tot.w[k] = clamp((state.tot.w[k] ?? 2) + v, 0, 5); });
      state.tot.i++;
      state.imp = { ...state.tot.w };
      syncPriorities(); renderTot();
      const first = $('#tot button'); if (first) first.focus();
      return;
    }
    if (t.dataset.show) { state.show[t.dataset.show] = !state.show[t.dataset.show]; renderFeed(); return; }
    if (t.dataset.railFilter) { state.railFilter = t.dataset.railFilter === 'all' ? null : t.dataset.railFilter; renderWardrobe(); return; }
    if (t.dataset.whatif) {
      const w = t.dataset.whatif;
      if (w === 'allow+5') state.whatIf.allow += 5;
      if (w === 'now+50') state.whatIf.now += 50;
      if (w === 'deadline+2') state.whatIf.deadline += 2;
      if (w === 'reset') state.whatIf = { now: 0, allow: 0, deadline: 0 };
      whatIfClicked = w !== 'reset';
      renderGoals(); return;
    }
    switch (a) {
      case 'skip-setup': break;
      case 'toggle-quick-add': {
        const f = $('#quick-add'); f.hidden = !f.hidden; t.setAttribute('aria-expanded', String(!f.hidden));
        if (!f.hidden) $('#qa-type').focus();
        break;
      }
      case 'snap-rail':
        state.pending.push(
          { type: 'knitwear', color: 'grey', fiber: 'wool', msg: 'From your rail photo: a grey knit. The tag looked like wool. Check it.' },
          { type: 'tops', color: 'white', fiber: 'cotton', msg: 'From your rail photo: a white top, probably cotton.' },
          { type: 'outerwear', color: 'blue', fiber: 'unknown', msg: 'From your rail photo: a blue jacket. Couldn’t read the fiber.' });
        renderWardrobe(); announce('Three pieces found in your rail photo. Confirm each one.');
        break;
      case 'confirm-pending': {
        const p = state.pending.splice(Number(t.dataset.i), 1)[0];
        addWardrobeItem({ type: p.type, color: p.color, fiber: p.fiber, pct: p.pct || 100 });
        if (p.photo) URL.revokeObjectURL(p.photo);
        rerender(); break;
      }
      case 'discard-pending': { const p = state.pending.splice(Number(t.dataset.i), 1)[0]; if (p && p.photo) URL.revokeObjectURL(p.photo); renderWardrobe(); break; }
      case 'remove-w': {
        const i = state.wardrobe.findIndex((w) => w.id === id); if (i < 0) break;
        const [w] = state.wardrobe.splice(i, 1);
        rerender();
        toast(`${w.name} removed.`, [{ label: 'Undo', primary: true, fn: () => { state.wardrobe.splice(i, 0, w); rerender(); } }]);
        break;
      }
      case 'suggest-split': suggestSplit(); syncBudgetForm(); renderHeader(); announce('Suggested split applied.'); break;
      case 'estimate': {
        const sizes = $$('[data-bs-size]').map((s) => s.value).filter(Boolean);
        if (!sizes.length) { $('#measure-status').textContent = 'Pick a size for at least one brand first.'; break; }
        const keys = Object.keys(SIZE_TABLE);
        const idx = Math.round(sizes.reduce((s, z) => s + keys.indexOf(z), 0) / sizes.length);
        Object.assign(state.body, SIZE_TABLE[keys[idx]]);
        MEASURES.forEach((m) => state.estimated.add(m.id));
        syncMeasure();
        $('#measure-status').textContent = `Estimated from size ${keys[idx]}. Each field is marked “estimated” until you change it.`;
        break;
      }
      case 'use-garment': {
        const toIn = (v) => (state.units === 'cm' ? v / 2.54 : v);
        const gw = parseFloat($('#g-waist').value); const gi = parseFloat($('#g-inseam').value);
        if (!gw && !gi) { $('#measure-status').textContent = 'Enter the waist or inside leg of your trousers first.'; $('#g-waist').focus(); break; }
        if (gw) { state.body.waist = round2(toIn(gw) - EASE.waist[state.fitPref.trousers]); state.estimated.delete('waist'); }
        if (gi) { state.body.inseam = round2(toIn(gi)); state.estimated.delete('inseam'); }
        syncMeasure();
        $('#measure-status').textContent = 'Trouser targets set from a pair that fits you well.';
        break;
      }
      case 'open-filters': renderFilters(); $('#filters').showModal(); break;
      case 'clear-filters': state.filters = { types: new Set(), sources: new Set(), maxPrice: null, withinOnly: false, localOnly: false, goalOnly: false, fit: new Set() }; renderFilters(); renderFeed({ flip: true }); break;
      case 'pin': {
        const it = LISTINGS.find((l) => l.id === id);
        const on = !state.pinned.has(id);
        if (on) state.pinned.add(id); else state.pinned.delete(id);
        renderFeed({ flip: true });
        const btn = $(`.heart[data-id="${id}"]`); if (btn) btn.focus();
        announce(on ? `${it.short} pinned. You’d buy it anyway.` : `${it.short} unpinned.`);
        if (on && fiberInfo(it.fibers, it.type).score < 0.5) {
          state.signals.synthHearts++;
          if (!state.suggested.has('style')) {
            state.suggested.add('style');
            toast('You’re picking style over fabric. Want Style weighted a little higher and fiber a little lower?', [{ label: 'Adjust', primary: true, fn: () => applyWeightNudge('style') }, { label: 'Not now' }], 10000);
          }
        }
        break;
      }
      case 'dismiss': {
        const it = LISTINGS.find((l) => l.id === id);
        const e = evaluate(it);
        state.dismissed.add(id);
        renderFeed({ flip: true });
        const next = $('#cards .card-title a'); if (next) next.focus();
        const acts = [{ label: 'Undo', primary: true, fn: () => { state.dismissed.delete(id); renderFeed({ flip: true }); } }];
        toast(`${it.short} hidden.`, acts);
        if (e.scores.style >= 0.6 && e.fi.score < 0.5) {
          state.signals.synthDismiss++;
          if (state.signals.synthDismiss >= 1 && !state.suggested.has('fiber-dismiss')) {
            state.suggested.add('fiber-dismiss');
            setTimeout(() => toast('You passed on a stylish synthetic. Weight natural fiber a little higher?', [{ label: 'Adjust', primary: true, fn: () => applyWeightNudge('fiber') }, { label: 'Not now' }], 10000), 400);
          }
        }
        break;
      }
      case 'undismiss': state.dismissed.clear(); renderFeed({ flip: true }); break;
      case 'why': {
        const open = !state.openWhy.has(id);
        if (open) state.openWhy.add(id); else state.openWhy.delete(id);
        $(`#why-${id}`).hidden = !open; t.setAttribute('aria-expanded', String(open));
        break;
      }
      case 'save': {
        const it = findAny(id);
        if (state.saved.has(id)) state.saved.delete(id); else state.saved.set(id, defaultGroup(it));
        const on = state.saved.has(id);
        t.setAttribute('aria-pressed', String(on)); t.textContent = on ? 'Saved' : 'Save';
        renderHeader();
        const dup = !id.startsWith('uw-') && duplicateCount(it) >= 2;
        announce(on ? `Saved to ${GROUPS.find(([k]) => k === state.saved.get(id))[1]}.` : 'Removed from saved.');
        if (on) toast(`Saved to “${GROUPS.find(([k]) => k === state.saved.get(id))[1]}.”${dup ? ' Heads up: you already own similar ones.' : ''}`, [{ label: 'View list', fn: () => { location.hash = '#/saved'; } }]);
        break;
      }
      case 'unsave': {
        const g = state.saved.get(id); state.saved.delete(id); renderSaved(); renderHeader();
        toast('Removed from your list.', [{ label: 'Undo', primary: true, fn: () => { state.saved.set(id, g); renderSaved(); renderHeader(); } }]);
        break;
      }
      case 'bought': markBought(id); break;
      case 'listing': toast('Demo listing. In the real app this opens the seller’s page.'); break;
      case 'ask-measure': toast('Message drafted: “Could you share pit-to-pit, length, shoulder and sleeve measurements, laid flat?”'); break;
      case 'copy-q': state.signals.fiberLooks++; copyText($('#seller-q').textContent, 'Message copied. Paste it to the seller.'); maybeSuggestFabric(); break;
      case 'copy-alts': {
        const it = LISTINGS.find((l) => l.id === state.tailorJob); if (!it) break;
        const f = fitEval(it);
        copyText(`Alterations for ${it.short}:\n${f.alts.map((x) => `- ${altLabel(x)} (est. $${x.range[0]} to $${x.range[1]})`).join('\n')}`, 'Alteration list copied.');
        break;
      }
      case 'slide': {
        const sl = $('#slides'); sl.scrollBy({ left: Number(t.dataset.dir) * sl.clientWidth, behavior: reduceMotion() ? 'auto' : 'smooth' });
        break;
      }
      case 'need-underwear': state.uwManual = true; rerender(); announce('Underwear restock goal added to your plan.'); toast('Added an underwear restock goal to your plan.', [{ label: 'See plan', fn: () => { location.hash = '#/goals'; } }]); break;
      case 'tune': runTune(); break;
      case 'apply-tune': {
        const T = state.tune; if (!T) break;
        const best = T.runs[T.bestIdx];
        const before = T.ids.map((id) => { const g = state.goals.find((x) => x.id === id); return g ? [g, g.imp] : null; }).filter(Boolean);
        T.ids.forEach((id, j) => { const g = state.goals.find((x) => x.id === id); if (g) g.imp = best.imps[j]; });
        renderGoals();
        toast('New settings applied.', [{ label: 'Undo', primary: true, fn: () => { before.forEach(([g, u]) => { g.imp = u; }); renderGoals(); announce('Undone.'); } }]);
        break;
      }
      case 'tune-topup': { state.whatIf.allow += Number(t.dataset.amt) || 0; whatIfClicked = true; renderGoals(); break; }
      case 'remove-goal': {
        const i = state.goals.findIndex((g) => g.id === id); const [g] = state.goals.splice(i, 1);
        renderGoals();
        toast(`Goal “${g.name}” removed.`, [{ label: 'Undo', primary: true, fn: () => { state.goals.splice(i, 0, g); renderGoals(); } }]);
        break;
      }
      case 'open-tot': state.tot = { i: 0, w: { style: 2, fiber: 2, fit: 3, cost: 2, condition: 1, goesWith: 2, fillsGoal: 2, easyCare: 1, local: 0, brand: 0 } }; t.setAttribute('aria-expanded', 'true'); renderTot(); $('#tot button').focus(); break;
      case 'close-tot': state.tot = null; renderTot(); $('[data-action="open-tot"]').setAttribute('aria-expanded', 'false'); $('[data-action="open-tot"]').focus(); break;
      case 'reset': toast('Reset the whole demo? Your setup, wardrobe and list go back to the defaults.', [{ label: 'Reset', primary: true, fn: () => { state = freshState(); planCache.clear(); buildAll(); location.hash = '#/welcome'; route(); } }, { label: 'Cancel' }], 10000); break;
      default: break;
    }
  });

  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.name === 'style') { if (t.checked) state.styles.add(t.value); else state.styles.delete(t.value); syncTileCount(); return; }
    if (t.name === 'garment') { if (t.checked) state.garments.add(t.value); else state.garments.delete(t.value); return; }
    if (t.name === 'color') {
      if (t.checked) state.colors.add(t.value); else state.colors.delete(t.value);
      $('input[name="color-none"]').checked = state.colors.size === 0; return;
    }
    if (t.name === 'color-none') { if (t.checked) { state.colors.clear(); $$('input[name="color"]').forEach((c) => { c.checked = false; }); } else t.checked = state.colors.size === 0; return; }
    if (t.name === 'units') { state.units = t.value; syncMeasure(); return; }
    if (t.id === 'fit-size') { state.fitSize = t.value; return; }
    if (t.dataset.fitpref) { state.fitPref[t.dataset.fitpref] = t.value; return; }
    if (t.id === 'm-uw') { state.uwSize = t.value; return; }
    if (t.dataset.cond) { const w = state.wardrobe.find((x) => x.id === t.dataset.cond); if (w) { w.cond = t.value; if (t.value !== 'great') w.note = w.note || ''; rerender(); announce(`${w.name} marked ${t.value === 'repair' ? 'needs repair' : t.value}.`); } return; }
    if (t.dataset.pending != null) { state.pending[Number(t.dataset.pending)][t.dataset.pk] = t.value; return; }
    if (t.dataset.upload) {
      const file = t.files && t.files[0]; if (!file) return;
      const photo = URL.createObjectURL(file);
      if (t.dataset.upload === 'photo') state.pending.unshift({ photo, type: 'tops', color: 'cream', fiber: 'unknown', msg: 'Looks like a cream top. Fix anything that’s off, and add the care tag for the fiber.' });
      else state.pending.unshift({ photo, type: 'tops', color: 'white', fiber: 'cotton', pct: 100, msg: 'Read from the tag: 100% cotton, machine wash cold. Pick the type and color.' });
      t.value = '';
      renderWardrobe(); announce('Photo added. Confirm the details below.');
      const first = $('#pending-items select'); if (first) first.focus();
      return;
    }
    if (t.id === 'b-per') { const wk = weekly(); state.budget.per = t.value; state.budget.allowance = Math.round(t.value === 'week' ? wk : wk * 52 / 12); rerender(); return; }
    if (t.id === 'b-include') { state.budget.include = t.checked; rerender(); return; }
    if (t.name === 'b-mode') { state.budget.mode = t.value; if (t.value === 'strict') state.locks.add('cost'); else state.locks.delete('cost'); rerender(); return; }
    if (t.id === 'b-env-on') { state.budget.envOn = t.checked; if (t.checked && ENV.reduce((s, [k]) => s + state.budget.env[k], 0) !== state.budget.now) suggestSplit(); rerender(); return; }
    if (t.name === 'prio-mode') { state.mode = t.value; rerender({ flip: true }); return; }
    if (t.dataset.imp) { state.imp[t.dataset.imp] = Number(t.value); rerender({ flip: true }); return; }
    if (t.dataset.lock) {
      const k = t.dataset.lock;
      if (t.checked) state.locks.add(k); else state.locks.delete(k);
      if (k === 'cost') state.budget.mode = t.checked ? 'strict' : 'flexible';
      if (t.checked && state.imp[k] === 0) state.imp[k] = 3;
      rerender({ flip: true });
      announce(t.checked ? `${CRITERIA.find((c) => c.id === k).name} is now a must-have.` : 'Must-have removed.');
      return;
    }
    if (t.dataset.deal) { if (t.checked) state.dealbreakers.add(t.dataset.deal); else state.dealbreakers.delete(t.dataset.deal); rerender({ flip: true }); return; }
    if (t.id === 'semi-half') { state.semiHalf = t.checked; rerender({ flip: true }); return; }
    if (t.id === 'stretch-on') { state.stretchOn = t.checked; rerender({ flip: true }); return; }
    if (t.dataset.goalEnd) { const g = state.goals.find((x) => x.id === t.dataset.goalEnd); g.end = clamp(Math.round(Number(t.value)) || g.end, g.start, 12); renderGoals(); return; }
    if (t.dataset.goalCost) { const g = state.goals.find((x) => x.id === t.dataset.goalCost); const v = Math.max(1, Math.round(Number(t.value)) || g.nat.cost); if (g.syn) g.syn.cost = Math.max(1, Math.round(v * g.syn.cost / g.nat.cost)); g.nat.cost = v; renderGoals(); return; }
    if (t.dataset.goalImp) { renderGoals(); return; }
    if (t.dataset.goalTarget) { state.targets[t.dataset.goalTarget] = Number(t.value) / 100; renderGoals(); return; }
    if (t.name === 'hunt') { state.hunt = t.value; renderGoals(); announce(`Hunting: ${t.value === 'auto' ? 'the plan decides each week' : STRATS.find((x) => x.id === t.value).name.toLowerCase()}.`); return; }
    if (t.id === 'sw-goal') { state.band.goal = t.value; const p = planFull(); renderSwitch(p.open, p.sol); return; }
    if (t.name === 'sw-seen') { state.band.seen = Number(t.value); const p = planFull(); renderSwitch(p.open, p.sol); return; }
    if (t.id === 'p-now') { const v = Math.max(0, Number(t.value) || 0); state.budget.now = round2(v + spentTotal()); rerender(); return; }
    if (t.id === 'p-week') { state.budget.per = 'week'; state.budget.allowance = Math.max(0, Number(t.value) || 0); rerender(); return; }
    if (t.id === 'sort') { state.sort = t.value; history.replaceState(null, '', `#/finds${t.value !== 'match' ? `?sort=${t.value}` : ''}`); renderFeed({ flip: true }); return; }
    if (t.dataset.filter) { const set = state.filters[t.dataset.filter]; if (t.checked) set.add(t.value); else set.delete(t.value); renderFilters(); renderFeed(); return; }
    if (t.dataset.filterBool) { state.filters[t.dataset.filterBool] = t.checked; renderFilters(); renderFeed(); return; }
    if (t.dataset.filterMax != null) { state.filters.maxPrice = Number(t.value) || null; renderFilters(); renderFeed(); return; }
    if (t.dataset.group) { state.saved.set(t.dataset.group, t.value); renderSaved(); return; }
    if (t.id === 'uw-interval') { state.uwInterval = Number(t.value); rerender(); return; }
    if (t.id === 'show-all-tailors') { state.showAllTailors = t.checked; renderTailors(); return; }
  });

  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.id === 'hunt') { state.hunt = t.value; return; }
    if (t.id === 'brands') { state.brands = t.value.split(',').map((s) => s.trim()).filter(Boolean); return; }
    if (t.dataset.measure) {
      const v = parseFloat(t.value);
      if (!Number.isNaN(v) && v > 0) { state.body[t.dataset.measure] = state.units === 'cm' ? round2(v / 2.54) : v; state.estimated.delete(t.dataset.measure); $(`#m-${t.dataset.measure}-est`).hidden = true; }
      return;
    }
    if (t.id === 'balance') { state.balance = Number(t.value) / 100; syncPriorities(); return; }
    if (t.id === 'b-now') { state.budget.now = Math.max(0, Number(t.value) || 0); if (state.budget.envOn) setEnvelope('thrift', state.budget.env.thrift); renderHeader(); renderBudgetSide(); if (state.budget.envOn) renderEnvelopes(); return; }
    if (t.id === 'b-allow') { state.budget.allowance = Math.max(0, Number(t.value) || 0); syncBudgetForm(); renderHeader(); return; }
    if (t.id === 'b-cap') { state.budget.cap = Math.max(0, Number(t.value) || 0); return; }
    if (t.dataset.env) { setEnvelope(t.dataset.env, Number(t.value)); renderEnvelopes(); return; }
    if (t.dataset.envRange) { setEnvelope(t.dataset.envRange, Number(t.value)); renderEnvelopes(); return; }
    if (t.dataset.goalImp) { const g = state.goals.find((x) => x.id === t.dataset.goalImp); g.imp = Number(t.value); $(`#gio-${g.id}`).textContent = fmtImp(g.imp); t.setAttribute('aria-valuetext', `${fmtImp(g.imp)} of 10`); return; }
    if (t.dataset.goalTarget) { $(`#gto-${t.dataset.goalTarget}`).textContent = `${t.value}%`; t.setAttribute('aria-valuetext', `${t.value}%`); return; }
    if (t.id === 'sw-week') { state.band.week = Number(t.value); const p = planFull(); renderSwitch(p.open, p.sol); return; }
    if (t.id === 'radius') { state.radius = Number(t.value); $('#radius-out').textContent = `${state.radius} mi`; renderTailors(); return; }
  });

  $('#quick-add').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target;
    addWardrobeItem({ type: f.type.value, color: f.color.value, fiber: f.fiber.value, pct: clamp(Number(f.pct.value) || 100, 1, 100), cond: f.condition.value, acq: f.acquired.value });
    rerender();
    $('#qa-hint').textContent = 'Added. Add another, or close quick add.';
  });
  $('#add-goal-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (state.goals.length >= 5) return;
    const f = ev.target;
    const cost = Math.max(1, Number(f.cost.value) || 30);
    const name = f.name.value.trim() || 'New goal';
    const id = `g-${Date.now().toString(36)}`;
    state.goals.push({ id, name, short: name.toLowerCase(), imp: clamp(Number(f.imp.value) || 5, 1, 10), start: 1, end: clamp(Number(f.deadline.value) || 12, 1, 12),
      nat: { cost, p: 0.3 }, syn: { cost: Math.max(1, Math.round(cost * 0.65)), p: 0.5 }, natLabel: 'natural', auto: null });
    f.reset();
    renderGoals();
    announce(`Goal “${name}” added.`);
  });
  $('#tailor-bill').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const amt = round2(Number($('#bill-amt').value) || 0);
    if (amt <= 0) return;
    state.spent.push({ id: `s-${Date.now()}`, label: 'Tailor bill', amount: amt, env: { tailoring: amt } });
    $('#bill-amt').value = '';
    rerender();
    toast(`Tailor bill of ${money(amt)} logged.`);
  });
  $('#filters').addEventListener('close', () => { renderFeed({ flip: true }); $('[data-action="open-filters"]').focus(); });
  $('#filters').addEventListener('click', (e) => { if (e.target.id === 'filters') $('#filters').close(); });

  // tooltips on fit-diagram zones, map pins and list hover
  const tipTarget = (e) => e.target.closest && e.target.closest('[data-tip]');
  document.addEventListener('pointerover', (e) => { const z = tipTarget(e); if (z) showTip(z.dataset.tip, z); const p = e.target.closest && e.target.closest('[data-pin]'); if (p) highlightTailor(p.dataset.pin); });
  document.addEventListener('pointerout', (e) => { if (tipTarget(e)) hideTip(); });
  document.addEventListener('focusin', (e) => { const z = tipTarget(e); if (z) showTip(z.dataset.tip, z); else hideTip(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideTip();
    const p = e.target.closest && e.target.closest('[data-pin]');
    if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const li = $(`#tl-${p.dataset.pin}`); if (li) { li.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); highlightTailor(p.dataset.pin); } }
  });
  document.addEventListener('click', (e) => { const p = e.target.closest && e.target.closest('[data-pin]'); if (p) { const li = $(`#tl-${p.dataset.pin}`); if (li) li.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); highlightTailor(p.dataset.pin); } });
  document.addEventListener('pointerover', (e) => { const li = e.target.closest && e.target.closest('[data-tailor]'); if (li) highlightTailor(li.dataset.tailor); });
  function highlightTailor(id) {
    $$('.tailor').forEach((x) => x.classList.toggle('on', x.dataset.tailor === id));
    $$('.map-pin').forEach((x) => x.classList.toggle('on', x.dataset.pin === id));
  }
  // carousel dots
  document.addEventListener('scroll', (e) => {
    if (e.target.id !== 'slides') return;
    const sl = e.target; const i = Math.round(sl.scrollLeft / sl.clientWidth);
    $$('.carousel-dots span').forEach((d, j) => d.classList.toggle('on', j === i));
  }, true);

  /* =========================================================
     Router
     ========================================================= */
  const SETUP = ['style', 'measure', 'wardrobe', 'budget', 'priorities', 'goals'];
  const TITLES = { welcome: 'Second Seam', style: 'Style', measure: 'Measurements', wardrobe: 'My wardrobe', budget: 'Budget', priorities: 'Priorities', goals: 'Goals & plan', finds: 'Your finds', item: 'Item', tailors: 'Tailors', underwear: 'Underwear restock', saved: 'Saved & plan' };
  let current = { name: 'welcome', arg: null };
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, query] = h.split('?');
    const [name, arg] = path.split('/');
    const q = new URLSearchParams(query || '');
    return { name: TITLES[name] ? name : 'welcome', arg: arg || null, q };
  }
  function renderCurrent(opts = {}) {
    renderHeader();
    switch (current.name) {
      case 'welcome': renderHero(); break;
      case 'style': break;
      case 'measure': syncMeasure(); break;
      case 'wardrobe': renderWardrobe(); break;
      case 'budget': syncBudgetForm(); break;
      case 'priorities': syncPriorities(); renderTot(); break;
      case 'goals': renderGoals(); break;
      case 'finds': renderFeed(opts); break;
      case 'item': renderItem(current.arg); break;
      case 'tailors': renderTailors(); break;
      case 'underwear': renderUnderwear(); break;
      case 'saved': renderSaved(); break;
      default: break;
    }
  }
  function rerender(opts = {}) {
    if (current.name === 'priorities') { syncPriorities(); renderHeader(); return; }
    renderCurrent(opts);
  }
  function route() {
    const r = parseHash();
    current = r;
    if (r.name === 'finds' && r.q.get('sort')) state.sort = r.q.get('sort');
    if (r.name === 'tailors') state.tailorJob = r.arg;
    state.visited.add(r.name);
    $$('.screen').forEach((s) => { s.hidden = s.dataset.screen !== r.name; });
    const isSetup = SETUP.includes(r.name);
    $('#stepper').hidden = !isSetup;
    $$('#stepper a').forEach((a) => {
      const on = a.dataset.step === r.name;
      if (on) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      a.classList.toggle('is-done', !on && state.visited.has(a.dataset.step));
    });
    $$('[data-nav]').forEach((a) => {
      const k = a.dataset.nav;
      const on = k === r.name || (k === 'setup' && isSetup && r.name !== 'goals') || (k === 'finds' && r.name === 'item');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    hideTip();
    renderCurrent();
    const screen = $(`.screen[data-screen="${r.name}"]`);
    screen.style.animation = 'none'; void screen.offsetWidth; screen.style.animation = '';
    document.title = r.name === 'welcome' ? 'Second Seam' : `${r.name === 'item' && findAny(r.arg) ? findAny(r.arg).short : TITLES[r.name]} · Second Seam`;
    window.scrollTo(0, 0);
    const h1 = $('h1', screen);
    if (h1 && route.ran) h1.focus({ preventScroll: true });
    route.ran = true;
  }
  window.addEventListener('hashchange', route);
  $('.skip').addEventListener('click', (e) => { e.preventDefault(); const h1 = $('.screen:not([hidden]) h1'); (h1 || $('#main')).focus(); });

  /* =========================================================
     Theme, header rule, build
     ========================================================= */
  const THEME_KEY = 'second-seam-theme';
  const root = document.documentElement;
  const themeBtn = $('#theme-toggle');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    $('meta[name="theme-color"]').setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim());
  }
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage blocked: theme still applies for this visit */ }
  });
  // follow the system until someone picks a theme with the button
  if (root.dataset.theme) applyTheme(root.dataset.theme);
  else {
    const syncLabel = () => { themeBtn.setAttribute('aria-label', systemDark.matches ? 'Switch to light mode' : 'Switch to dark mode'); $('meta[name="theme-color"]').setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim()); };
    syncLabel();
    systemDark.addEventListener('change', () => { if (!root.dataset.theme) syncLabel(); });
  }
  const topbar = $('#topbar');
  const onScroll = () => topbar.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function buildAll() {
    buildStyle();
    buildMeasure();
    buildPriorities();
    $('#env-controls').innerHTML = '';
    $('#qa-type').innerHTML = [...GARMENT_TYPES, 'underwear'].map((t) => `<option value="${t}">${cap1(t)}</option>`).join('');
    $('#qa-color').innerHTML = COLORS.map((c) => `<option value="${c.id}">${cap1(c.id)}</option>`).join('');
    $('#qa-fiber').innerHTML = ['cotton', 'linen', 'wool', 'cashmere', 'silk', 'hemp', 'viscose', 'lyocell', 'modal', 'polyester', 'nylon', 'acrylic', 'unknown'].map((f) => `<option value="${f}">${f === 'unknown' ? 'Not sure' : cap1(f)}</option>`).join('');
    $('#quick-add').hidden = true;
    $('[data-action="toggle-quick-add"]').setAttribute('aria-expanded', 'false');
  }
  buildAll();
  route();

  // expose the solver for checking against the Python reference in the console
  window.secondSeam = { solvePlan, state: () => state };
})();
