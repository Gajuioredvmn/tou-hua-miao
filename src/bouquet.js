// ================= 包花束：配色、具名花束、成品圖、花束圖鑑 =================
// 從店裡的花挑 3～5 枝，選包裝紙跟緞帶。賣價＝每枝花的價錢加起來 × 花束倍率。
// 倍率取「配色」或「具名花束」比較高的那個；包裝紙搭配得好再 ×1.1。

const PAPERS = {
  kraft: { name: '牛皮紙', col: '#d4ae7e', dark: '#b88d5a', line: 'rgba(120,84,40,0.45)' },
  white: { name: '白紙', col: '#f6f2ea', dark: '#d9d2c4', line: 'rgba(150,140,120,0.4)' },
  pink: { name: '粉紙', col: '#f6c6d4', dark: '#e09ab0', line: 'rgba(190,90,120,0.35)', decor: 2 },
  sage: { name: '霧綠紙', col: '#b9cdb8', dark: '#94ad93', line: 'rgba(70,100,70,0.35)', decor: 2 },
  black: { name: '黑紙', col: '#3a3640', dark: '#24212a', line: 'rgba(255,255,255,0.18)', decor: 3 },
};
const RIBBONS = {
  twine: { name: '麻繩', col: '#c8a878' },
  ivory: { name: '米白緞帶', col: '#f4ecd8' },
  pink: { name: '粉緞帶', col: '#ff9fbb', decor: 1 },
  green: { name: '墨綠緞帶', col: '#3e6a50', decor: 1 },
  red: { name: '紅緞帶', col: '#d9363e', decor: 3 },
};
// 配色
const SCHEMES = {
  white: { name: '純白', mult: 1.35, desc: '全部都是白色的花，乾淨又高雅' },
  mono: { name: '同色系', mult: 1.3, desc: '同一個顏色，深深淺淺' },
  analog: { name: '漸層', mult: 1.25, desc: '相鄰的顏色排在一起，像夕陽' },
  comp: { name: '對比色', mult: 1.3, desc: '顏色剛好相反，互相襯托（例如黃配藍）' },
  rainbow: { name: '繽紛', mult: 1.2, desc: '三種以上差很多的顏色，熱熱鬧鬧' },
  free: { name: '隨性', mult: 1.1, desc: '沒什麼章法，但包成花束還是比較好賣' },
};
const SCHEME_ORDER = ['white', 'mono', 'analog', 'comp', 'rainbow', 'free'];
// 具名花束：要的花（至少幾枝）
const RECIPES = [
  { id: 'love', name: '熱戀', need: { rose: 3 }, mult: 1.6, line: '三枝紅玫瑰，什麼都不用說' },
  { id: 'street', name: '街坊鄰居', need: { periwinkle: 1, bougain: 1, sunflower: 1 }, mult: 1.45, line: '巷子裡最常見的花，最親切' },
  { id: 'bubble', name: '粉紅泡泡', need: { periwinkle: 1, bougain: 1, carnation: 1 }, mult: 1.5, line: '粉紅色一層一層冒出來' },
  { id: 'mom', name: '謝謝媽媽', need: { carnation: 2, babys: 1 }, mult: 1.6, line: '康乃馨配滿天星，母親節最好賣' },
  { id: 'star', name: '滿天星空', need: { babys: 2, lisianthus: 1 }, mult: 1.55, line: '紫色的夜空，白色的星星' },
  { id: 'summer', name: '夏日陽光', need: { sunflower: 2, hydrangea: 1 }, mult: 1.7, line: '向日葵配藍色繡球，黃藍對比' },
  { id: 'dream', name: '紫色夢境', need: { lisianthus: 2, hydrangea: 1 }, mult: 1.7, line: '紫到藍的漸層，像在做夢' },
  { id: 'scent', name: '巷口的香氣', need: { osmanthus: 1, jasmine: 1, magnolia: 1 }, mult: 1.8, line: '三種香花，一打開整間店都香' },
  { id: 'moon', name: '月光香氛', need: { tanhua: 1, jasmine: 1 }, mult: 1.9, line: '曇花只開一個晚上，配茉莉更香' },
  { id: 'wedding', name: '婚禮捧花', need: { rose: 1, orchid: 1, babys: 1 }, mult: 2.0, line: '白色裡面一點紅，新娘最愛' },
  { id: 'fortune', name: '富貴花開', need: { peony: 1, rose: 1 }, mult: 2.0, line: '牡丹配玫瑰，開店送禮都氣派' },
  { id: 'mansion', name: '大宅的秘密', need: { orchid: 1, peony: 1, hydrangea: 1 }, mult: 2.3, line: '全是大宅花園裡的花……噓' },
];
const BQ_MIN = 3; let BQ_MAX = 5;

// ---------- 判定 ----------
function hueSpread(hs) {
  if (hs.length <= 1) return 0;
  const a = hs.slice().sort((x, y) => x - y);
  let gap = 0;
  for (let i = 0; i < a.length; i++) { const g = (i === a.length - 1 ? a[0] + 360 : a[i + 1]) - a[i]; if (g > gap) gap = g; }
  return 360 - gap;
}
function hueGroups(hs) {
  const a = [...new Set(hs)].sort((x, y) => x - y), out = [];
  for (const h of a) { const g = out.find(g => Math.min(Math.abs(g[0] - h), 360 - Math.abs(g[0] - h)) <= 30); if (g) g.push(h); else out.push([h]); }
  return out;
}
function bouquetScheme(stems) {
  const hs = stems.filter(t => !FLOWERS[t].white).map(t => FLOWERS[t].hue);
  if (!hs.length) return 'white';
  const sp = hueSpread(hs);
  if (sp <= 25) return 'mono';
  if (sp <= 75) return 'analog';
  const gs = hueGroups(hs);
  if (gs.length === 2) {
    const m = gs.map(g => g.reduce((s, h) => s + h, 0) / g.length), d = Math.min(Math.abs(m[0] - m[1]), 360 - Math.abs(m[0] - m[1]));
    if (Math.abs(d - 180) <= 45) return 'comp';
  }
  if (gs.length >= 3 && sp >= 150) return 'rainbow';
  return 'free';
}
function bouquetRecipe(stems) {
  const n = {}; for (const t of stems) n[t] = (n[t] || 0) + 1;
  let best = null;
  for (const r of RECIPES) if (Object.keys(r.need).every(t => (n[t] || 0) >= r.need[t]) && (!best || r.mult > best.mult)) best = r;
  return best;
}
// 包裝紙搭不搭
function paperMatch(paper, stems, scheme, recipe) {
  const col = stems.filter(t => !FLOWERS[t].white).map(t => FLOWERS[t].hue);
  const id = recipe && recipe.id;
  if (paper === 'white') return scheme === 'white' || ['wedding', 'moon', 'star', 'scent'].includes(id);
  if (paper === 'pink') return col.length > 0 && col.every(h => h >= 300);
  if (paper === 'sage') return col.length > 0 && col.every(h => h >= 200 && h <= 290);
  if (paper === 'black') return (stems.some(t => t === 'rose' || t === 'peony') && stems.some(t => FLOWERS[t].white)) || scheme === 'comp';
  if (paper === 'kraft') return scheme === 'free' || scheme === 'rainbow' || ['street', 'summer', 'love'].includes(id);
  return false;
}
// 完整判定：spec = { stems: [花], paper, ribbon }
function bouquetEval(run, spec, freshOf) {
  const stems = spec.stems;
  const scheme = bouquetScheme(stems), recipe = bouquetRecipe(stems);
  const sm = SCHEMES[scheme].mult, rm = recipe ? recipe.mult : 0;
  const match = paperMatch(spec.paper, stems, scheme, recipe);
  const sig = run.flags && run.flags.bqSig ? 1.1 : 1;
  const mult = Math.max(sm, rm) * (match ? 1.1 : 1) * sig;
  const base = stems.reduce((s, t, i) => s + flowerValue(run, t, freshOf ? freshOf(i) : 1), 0);
  return { scheme, recipe, match, mult, base, value: Math.round(base * mult), name: recipe ? recipe.name : SCHEMES[scheme].name + '花束', sig: sig > 1 };
}

// ---------- 成品圖 ----------
// 花頭排成一個圓頂，大朵的放上面；外面包紙、綁緞帶
const BQ_POS = {
  3: [[0, -47, 1.9], [-8, -38, 1.8], [8, -38, 1.8]],
  4: [[-5, -47, 1.85], [5.5, -48, 1.85], [-10, -37, 1.7], [10, -37, 1.7]],
  5: [[0, -51, 1.8], [-8.5, -45, 1.75], [8.5, -45, 1.75], [-11, -36, 1.65], [11, -36, 1.65]],
  6: [[-4.5, -52, 1.75], [5, -53, 1.75], [-10.5, -45, 1.7], [10.5, -45, 1.7], [-12, -36, 1.6], [12, -36, 1.6]],
};
const HEAD_SIZE = { sunflower: 1.1, hydrangea: 1.05, peony: 1.05, babys: 1.05, orchid: 1.1, tanhua: 1.0 };
function drawBouquetArt(spec) {
  // spec.fl＝包的人的功夫 [剪枝, 配色, 包裝]（0～5）：同樣的花，功夫越好包得越漂亮
  const fl = spec.fl || [1, 1, 1], cu = fl[0] || 0, co = fl[1] || 0, wr = fl[2] || 0;
  let stems = spec.stems.slice().sort((a, b) => (FLOWERS[b].price + (HEAD_SIZE[b] || 1) * 200) - (FLOWERS[a].price + (HEAD_SIZE[a] || 1) * 200));
  if (co >= 4 && stems.length >= 4) {   // 配色眼：依顏色排成漸層，白花放兩邊
    const hue = t => FLOWERS[t].white ? 999 : (FLOWERS[t].hue || 0);
    const big = stems[0], rest = stems.slice(1).sort((a, b) => hue(a) - hue(b));
    stems = [big, ...rest];
  }
  const P = PAPERS[spec.paper] || PAPERS.kraft, Rb = RIBBONS[spec.ribbon] || RIBBONS.twine;
  const n = Math.max(1, Math.min(6, stems.length)), pos = BQ_POS[Math.max(3, n)] || BQ_POS[3];
  const mess = Math.max(0, 1 - cu / 2);   // 剪枝功不夠：歪七扭八
  // 露在下面的花梗
  if (cu >= 3) for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) { O.curve([[x * 0.55, -12], [x * 0.9, -1.5]], CM.ink, 2.2); O.curve([[x * 0.55, -12], [x * 0.9, -1.5]], PC.stem, 1.0); }
  else for (const x of [-2.4, 0, 2.4]) { O.curve([[x * 0.6, -12], [x, -2]], CM.ink, 2.4); O.curve([[x * 0.6, -12], [x, -2]], PC.stem, 1.2); }
  if (mess > 0) { O.curve([[-2, -12], [-6.5, -0.5]], CM.ink, 2.2); O.curve([[-2, -12], [-6.5, -0.5]], PC.stem, 1); O.curve([[2.2, -12], [4.4, -4.5], [7, -3.6]], CM.ink, 2); O.curve([[2.2, -12], [4.4, -4.5], [7, -3.6]], PC.stem, 0.9); }
  // 剪枝功滿級：後面插一圈尤加利葉
  if (cu >= 5) for (const [x0, y0, x1, y1] of [[-8, -44, -22, -60], [8, -44, 22, -60], [0, -50, 0, -66]]) {
    O.curve([[x0, y0], [x1, y1]], '#5a7a5a', 1);
    for (let k = 1; k <= 4; k++) { const f = k / 4.6; O.eo(x0 + (x1 - x0) * f + (k % 2 ? 1.6 : -1.6), y0 + (y1 - y0) * f, 1.5, 1.3, '#8ab49a'); }
  }
  // 後面那層紙（內側比較暗）
  O.blobO([[-21, -35], [-13, -53], [0, -58], [13, -53], [21, -35], [4, -12], [-4, -12]], P.dark);
  // 包裝術 4：紙邊有蕾絲
  if (wr >= 4) for (let k = 0; k <= 8; k++) { const a = Math.PI * (0.06 + 0.88 * k / 8), x = -Math.cos(a) * 20.5, y = -35 - Math.sin(a) * 22; O.eo(x, y, 1.4, 1.4, '#fffaf2'); }
  // 葉子墊底
  for (const [x, y] of [[-14, -40], [14, -40], [-7, -51], [7, -52], [0, -42], [-16, -32], [16, -32]]) leafBall(x + mess * (x > 0 ? 1.5 : -1), y + mess * 1.5, 5.4, 4);
  if (mess > 0) { O.blobO([[-17, -30], [-23, -24], [-19, -22]], PC.leaf || '#5aa060'); }   // 垂下來的葉子
  // 配色眼 2：花和花中間塞小碎花
  if (co >= 2) for (const [x, y] of [[-12, -47], [12, -47], [-3, -55], [4, -44], [-15, -38], [15, -38]]) { O.dot(x, y, 1.3, '#ffffff'); O.dot(x + 1.6, y + 1, 1.1, '#ffffff'); O.dot(x - 1.2, y + 1.4, 1, '#f4f0ff'); }
  if (co >= 4) for (const [x, y] of [[-9, -56], [9, -56], [-18, -44], [18, -44]]) O.eo(x, y, 1.2, 1.2, Rb.col);
  // 花頭
  pos.forEach(([x, y, s], i) => {
    const t = stems[i]; if (!t) return;
    const B = BUNCH[t];
    const dx = Math.sin(i * 7.3 + 1) * 2.6 * mess, dy = Math.cos(i * 5.1) * 2.2 * mess, ds = 1 - 0.1 * mess * (i % 2);
    if (B) B.head(x + dx, y + dy, s * (HEAD_SIZE[t] || 1) * ds, ((i * 0.37) % 1));
  });
  // 包裝術 2：前面多一層透明紗紙
  if (wr >= 2) { O.blobO([[-20, -34], [-9, -31], [-2, -12], [-5, -12]], 'rgba(255,255,255,0.75)'); O.blobO([[20, -35], [9, -31], [2, -12], [5, -12]], 'rgba(255,255,255,0.75)'); }
  // 前面那層紙（兩片交疊）；包裝術 0：歪一邊、皺皺的
  const sk = wr === 0 ? 1.8 : 0;
  O.blobO([[-19 + sk, -31], [-7, -28 + sk], [2, -26], [3.6, -10], [-3.6, -10]], P.col, { part: 32 });
  O.blobO([[19 + sk, -32 + sk], [8, -28], [-1, -27], [-3.4, -10], [3.6, -10]], P.col, { part: 32 });
  O.curve([[-10, -28], [-2, -14]], P.line, 0.8, { only: 32 }); O.curve([[10, -29], [1.5, -14]], P.line, 0.8, { only: 32 });
  if (wr === 0) { O.curve([[-14, -27], [-11, -24], [-13, -21], [-9, -18]], P.line, 0.7, { only: 32 }); O.curve([[13, -26], [10, -22], [12, -19]], P.line, 0.7, { only: 32 }); }
  O.e(-6, -24, 3, 9, 'rgba(255,255,255,0.12)', { only: 32 });
  if (wr >= 5) { O.curve([[-19, -31], [-7, -28], [2, -26]], '#ffd23a', 0.9, { only: 32 }); O.curve([[19, -32], [8, -28], [-1, -27]], '#ffd23a', 0.9, { only: 32 }); }
  // 緞帶（包裝術越好，蝴蝶結越大、尾巴越長）
  const by = -16, bw = wr >= 4 ? 1.35 : wr >= 2 ? 1.12 : 0.9;
  O.blobO([[-4, by - 1.6], [4, by - 1.6], [4, by + 1.6], [-4, by + 1.6]], Rb.col);
  O.blobO([[0, by], [-6.5 * bw, by - 4 * bw], [-7 * bw, by + 2.4 * bw]], Rb.col); O.blobO([[0, by], [6.5 * bw, by - 4 * bw], [7 * bw, by + 2.4 * bw]], Rb.col);
  if (wr >= 4) { O.curve([[-1, by + 1], [-5, by + 7], [-2, by + 11], [-6, by + 15]], CM.ink, 2.4); O.curve([[-1, by + 1], [-5, by + 7], [-2, by + 11], [-6, by + 15]], Rb.col, 1.4); O.curve([[1, by + 1], [5, by + 7], [2.5, by + 11], [6, by + 14]], CM.ink, 2.4); O.curve([[1, by + 1], [5, by + 7], [2.5, by + 11], [6, by + 14]], Rb.col, 1.4); }
  else { O.blobO([[-1, by + 1], [-4, by + 8], [-1.8, by + 8.4]], Rb.col); O.blobO([[1, by + 1], [4, by + 8], [1.8, by + 8.4]], Rb.col); }
  O.eo(0, by, 1.6, 1.6, Rb.col);
  // 三門功夫加起來很高：名作，會閃
  if (cu + co + wr >= 12) for (const [x, y, r] of [[-17, -55, 1.3], [16, -58, 1.1], [-21, -42, 0.9], [20, -44, 1.2]]) { O.dot(x, y, r, '#fffbe0'); O.curve([[x - r * 2, y], [x + r * 2, y]], '#fffbe0', 0.5); O.curve([[x, y - r * 2], [x, y + r * 2]], '#fffbe0', 0.5); }
}
function bqKey(spec) { return spec.stems.slice().sort().join('+') + '|' + spec.paper + '|' + spec.ribbon + '|' + (spec.fl || [1, 1, 1]).join(''); }
// 3D 立牌（櫃台上、客人手上）
function toonBouquet(spec, sc = 0.42) { return toonFrameInfo(toonFrame('bq-' + bqKey(spec), 44, 60, () => drawBouquetArt(spec)), false, 0.5, sc); }
// 介面用的大圖（k 倍）
const BQ_CV = new Map();
function bouquetCanvas(spec, k = 4, shadow = false) {
  const key = bqKey(spec) + '|' + k + (shadow ? '|s' : '');
  if (BQ_CV.has(key)) return BQ_CV.get(key);
  let cv = withPen(VXR, () => { VXR.begin(44, 60, k, { pad: 3 }); TOX = 22; TOY = 60; drawBouquetArt(spec); return VXR.end(); });
  const out = makeCanvas(cv.width, cv.height), g = out.getContext('2d');
  g.drawImage(cv, 0, 0);
  if (shadow) { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#3a3558'; g.fillRect(0, 0, out.width, out.height); }
  if (BQ_CV.size > 120) BQ_CV.clear();
  BQ_CV.set(key, out);
  return out;
}
// 配方的示範花束（圖鑑裡還沒做過的剪影）
function recipeSpec(r) { const stems = []; for (const t in r.need) for (let i = 0; i < r.need[t]; i++) stems.push(t); while (stems.length < BQ_MIN) stems.push('babys'); return { stems, paper: 'kraft', ribbon: 'twine' }; }
const SCHEME_DEMO = {
  white: ['jasmine', 'babys', 'magnolia'], mono: ['carnation', 'peony', 'carnation'], analog: ['lisianthus', 'hydrangea', 'lisianthus'],
  comp: ['sunflower', 'hydrangea', 'sunflower'], rainbow: ['rose', 'sunflower', 'hydrangea', 'lisianthus'], free: ['rose', 'hydrangea', 'babys'],
};

// ---------- 圖鑑紀錄 ----------
function bookOf(run) { return run.book || (run.book = { recipes: {}, schemes: {}, flowers: {} }); }
// 做好一束：記到圖鑑，第一次做到有罐罐；收集到 6 種「招牌花束」以後花束都 ×1.1
function bookRecord(run, spec, ev) {
  const B = bookOf(run), out = { newRecipe: false, newScheme: false, cans: 0, sig: false };
  if (ev.recipe && !B.recipes[ev.recipe.id]) { B.recipes[ev.recipe.id] = { stems: spec.stems.slice(), paper: spec.paper, ribbon: spec.ribbon }; out.newRecipe = true; out.cans += 6; }
  if (!B.schemes[ev.scheme]) { B.schemes[ev.scheme] = { stems: spec.stems.slice(), paper: spec.paper, ribbon: spec.ribbon }; out.newScheme = true; out.cans += 3; }
  const got = Object.keys(B.recipes).length + Object.keys(B.schemes).length;
  if (got >= 6 && !run.flags.bqSig) { run.flags.bqSig = 1; out.sig = true; }
  if (out.cans) run.cans += out.cans;
  return out;
}
function bookCount(run) { const B = bookOf(run); return { recipes: Object.keys(B.recipes).length, schemes: Object.keys(B.schemes).length, flowers: Object.keys(B.flowers).length }; }
