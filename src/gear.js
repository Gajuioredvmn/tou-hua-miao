// ================= 花喵身上的升級配件 =================
// 老貓攤的每個技能都看得到（data.js 的 UPGRADES 說明寫的就是這些）：
//   肉球消音：灰色小襪子 → 黑色忍者襪（白腳尖）     貓步：怪盜眼罩 → 紫色金邊眼罩
//   萌力：小蝴蝶結 → 大蝴蝶結（白點點）→ 花冠        輕輕叼：薄荷綠小領巾 → 粉紅蕾絲領巾
//   大嘴巴：斜背小花袋 → 藤編花籃（插三朵花）        夜貓子：尾巴綁月亮吊飾 → 多一顆星星
//   跳高高：背上的小翅膀                             招財貓：紅項圈小金鈴 → 鈴鐺變大 → 金項圈
//   夜視：眼睛發光 → 更亮                            嗅花：耳朵別一朵小花 → 大朵扶桑花
//   罐罐收買：藍色小背包 → 背包掛著小魚乾
// 橘貓夥伴：藍領巾（白點點）→ 加綠色小背包 → 披上紅披風
// 畫貓的函式都問 gearNow()；toonCat 會把配件組合加進快取名稱，換了配件就會重畫
let CAT_GEAR;   // undefined：照 G.run（玩家）的升級；null：什麼都不戴；物件：指定（橘貓、測試）
function catGearFor(run) {
  if (!run || !run.upg) return null;
  const u = run.upg;
  const g = { socks: u.paws || 0, mask: u.catwalk || 0, bow: u.cute || 0, scarf: u.gentle || 0, bag: u.mouth || 0, moon: u.owl || 0, wings: u.jump || 0, collar: u.lucky || 0, glow: u.nightvis || 0, flower: u.sniff || 0, pack: u.bribe || 0, horn: u.call || 0, lamp: u.tunnel || 0, ahoge: u.tilt || 0, band: u.dead || 0, plank: u.roofway || 0, cape: u.shadow ? 1 + u.shadow : 0, phones: u.ear || 0, hband: u.parkour || 0 };
  Object.assign(g, outfitGear(run));
  for (const k in g) if (g[k]) return g;
  return null;
}
function orangeGearFor(run) {
  const lv = (run && run.upg && run.upg.orange) || 0;
  return lv ? { scarf: 3, pack: lv >= 2 ? 3 : 0, cape: lv >= 3 ? 1 : 0 } : null;
}
function gearNow() { return CAT_GEAR !== undefined ? CAT_GEAR : (G.run ? catGearFor(G.run) : null); }
function gearKeyOf(g) { if (!g) return ''; let s = ''; for (const k in g) if (g[k]) s += k.slice(0, 2) + g[k]; return s ? 'G' + s + '-' : ''; }
function withGear(g, fn) { const old = CAT_GEAR; CAT_GEAR = g; try { return fn(); } finally { CAT_GEAR = old; } }

const GEARC = {
  sock: [null, { c: '#9aa4b8', d: '#7d879b', toe: '#d4dae4' }, { c: '#2c2c3a', d: '#1f1f2a', toe: '#f6f6f6' }],
  scarf: [null, { c: '#86dcb6', d: '#4fb08a' }, { c: '#ffb3c8', d: '#e88aa4', lace: '#ffffff' }, { c: '#4f86d6', d: '#3a68b0', dots: '#ffffff' }],
  mask: [null, { c: '#1d1526' }, { c: '#5a2a8a', trim: '#e8bc52' }],
  bow: [null, { c: '#ff6d9a', d: '#d94a78', s: 0.82 }, { c: '#ff6d9a', d: '#d94a78', s: 1.25, dots: '#ffffff' }],
  flower: [null, { c: '#ff9fcb', ctr: '#ffe48a', s: 0.9 }, { c: '#e8394d', ctr: '#ffd84d', s: 1.3 }],
  pack: [null, { c: '#4f78b8', d: '#34558a' }, { c: '#4f78b8', d: '#34558a', fish: '#d4ecfa' }, { c: '#3f9a72', d: '#2a6e50' }],
  bag: [null, { c: '#f2dfb8', d: '#c8a878' }, { c: '#d6a45a', d: '#9a6a30' }, { c: '#c8843c', d: '#8a5420', rib: '#ff6d9a' }],
  horn: [null, { c: '#ffd84d', d: '#c99a1a' }, { c: '#eef0f6', d: '#9aa0b8', band: '#e8394d' }],
  glow: [null, { eye: '#d6ff5c', eyeD: '#8fdc3c' }, { eye: '#f4ff96', eyeD: '#c8f244' }],
  crown: ['#ff8fb8', '#ffd84d', '#ffffff', '#ff7a8a', '#c9b6f0', '#ffd84d', '#ff8fb8'],
};
const CAPE_C = '#d9363e', CAPE_D = '#a82430';
function capeC(g) { if (g && g.capeO) { const o = outfitById(g.capeO); if (o) return o.c; } return g && g.cape >= 3 ? '#1e2a5a' : g && g.cape >= 2 ? '#3a2f5a' : CAPE_C; }
function capeD(g) { if (g && g.capeO) { const o = outfitById(g.capeO); if (o) return o.d; } return g && g.cape >= 2 ? '#241c3c' : CAPE_D; }
const MASK_LINE = '#efe6ff';   // 戴眼罩時閉眼的線改成淺色，才看得到
function collarCol(g) { return g.collar >= 3 ? '#e8b84a' : '#d9363e'; }

// ---- 兩種畫筆的轉接：GO 場景裡的貓（O，邏輯座標，原點在腳底）、GP 特寫和正面貓頭（PX，絕對座標）----
function gPoly(pts, col) {
  let cx = 0, cy = 0; for (const [x, y] of pts) { cx += x; cy += y; } cx /= pts.length; cy /= pts.length;
  PX.poly(pts, TAB.out); PX.polyEdge(pts, TAB.out);
  PX.poly(pts.map(([x, y]) => { const dx = cx - x, dy = cy - y, l = Math.hypot(dx, dy) || 1, m = Math.min(1, l * 0.45); return [x + dx / l * m, y + dy / l * m]; }), col, { part: 9 });
}
function gEll(x, y, rx, ry, col, rot = 0) { PX.ellipse(x, y, rx + 1, ry + 1, TAB.out, { rot }); PX.ellipse(x, y, rx, ry, col, { rot, part: 9 }); }
const GO = {
  get ink() { return CM.ink; },
  poly(pts, col) { O.blobO(pts, col); },
  fill(pts, col) { O.blob(pts, col); },
  ell(x, y, rx, ry, col, rot = 0) { O.eo(x, y, rx, ry, col, { rot }); },
  ellF(x, y, rx, ry, col, rot = 0) { O.e(x, y, rx, ry, col, { rot }); },
  line(pts, col, w = 1) { O.curve(pts, col, w); },
};
const GP = {
  get ink() { return TAB.out; },
  poly(pts, col) { gPoly(pts, col); },
  fill(pts, col) { PX.poly(pts, col, { part: 9 }); },
  ell(x, y, rx, ry, col, rot = 0) { gEll(x, y, rx, ry, col, rot); },
  ellF(x, y, rx, ry, col, rot = 0) { PX.ellipse(x, y, rx, ry, col, { rot }); },
  line(pts, col, w = 1) { PX.curve(pts, col, { w }); },
};

// ---- 共用零件 ----
function gFlower(Q, x, y, r, col, ctr = '#ffe48a') {
  const pr = r * 0.6, d = r * 0.62;
  for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.5708; Q.ellF(x + Math.cos(a) * d, y + Math.sin(a) * d, pr + 1, pr + 1, Q.ink); }
  for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.5708; Q.ellF(x + Math.cos(a) * d, y + Math.sin(a) * d, pr, pr, col); }
  Q.ellF(x, y, r * 0.36, r * 0.36, ctr);
}
// 扶桑花：大花瓣＋伸出來的花蕊
function gHibiscus(Q, x, y, r, col) {
  gFlower(Q, x, y, r, col, '#ffb0b8');
  Q.line([[x, y], [x + r * 0.9, y + r * 0.75]], '#ffd84d', Math.max(0.8, r * 0.16));
  Q.ellF(x + r * 0.95, y + r * 0.8, r * 0.18, r * 0.18, '#ffd84d');
}
const WING = [[0, 0], [-1.2, -3.2], [-4, -6.8], [-7.6, -8.4], [-9.8, -7.9], [-8.6, -5.8], [-10.4, -4.8], [-8.4, -3.3], [-9.4, -1.7], [-6.2, -0.9], [-3.2, 0.7]];
const WING_F = [[[-2.4, -1.4], [-6.6, -3.8]], [[-2, -3.4], [-5.8, -6.4]]];
function gWing(Q, x, y, sd, k = 1, rot = 0, col = '#ffffff') {
  const cs = Math.cos(rot), sn = Math.sin(rot), m = sd < 0 ? 1 : -1;
  const f = ([u, v]) => { u *= m * k; v *= k; return [x + u * cs - v * sn, y + u * sn + v * cs]; };
  Q.poly(WING.map(f), col);
  for (const [a, b] of WING_F) Q.line([f(a), f(b)], '#b8cfe8', 0.8 * Math.max(1, k * 0.7));
}
// 小背包：x、y 是包包中間
function gPack(Q, x, y, lv, k = 1) {
  const C = GEARC.pack[lv];
  if (C.fish) {
    const fx = x - 5.2 * k, fy = y + 2.2 * k;
    Q.line([[x - 3.4 * k, y - 1.2 * k], [fx + 0.6 * k, fy - 1.1 * k]], Q.ink, 0.6 * k);
    Q.poly([[fx - 2 * k, fy], [fx, fy - 1.35 * k], [fx + 1.7 * k, fy], [fx, fy + 1.35 * k]], C.fish);
    Q.poly([[fx + 1.3 * k, fy], [fx + 3.1 * k, fy - 1.45 * k], [fx + 3.1 * k, fy + 1.45 * k]], C.fish);
    Q.ellF(fx - 0.9 * k, fy - 0.2 * k, 0.42 * k, 0.42 * k, Q.ink);
  }
  Q.poly([[x - 3.9 * k, y - 3.4 * k], [x + 3.9 * k, y - 3.4 * k], [x + 4.3 * k, y + 3.3 * k], [x - 4.3 * k, y + 3.3 * k]], C.c);
  Q.poly([[x - 3.7 * k, y - 3.4 * k], [x + 3.7 * k, y - 3.4 * k], [x + 3.4 * k, y + 0.3 * k], [x - 3.4 * k, y + 0.3 * k]], C.d);
  Q.ellF(x, y + 0.5 * k, 0.9 * k, 0.9 * k, '#ffd84d');
}
// 屋頂走廊：背上的木板（第二級換成登山繩和扣環）
function gPlank(Q, x, y, lv, k = 1) {
  if (lv >= 2) {
    Q.ell(x, y - 2 * k, 3.6 * k, 2.6 * k, '#e0702a'); Q.ellF(x, y - 2 * k, 1.8 * k, 1.1 * k, '#a84a18');
    Q.ell(x + 3.4 * k, y - 0.6 * k, 1.3 * k, 1.8 * k, '#c9ccd8');
    return;
  }
  for (let i = 0; i < 3; i++) Q.poly([[x - 4.6 * k, y - (1.6 + i * 1.5) * k], [x + 4.6 * k, y - (1.2 + i * 1.5) * k], [x + 4.6 * k, y - (0.1 + i * 1.5) * k], [x - 4.6 * k, y - (0.5 + i * 1.5) * k]], ['#c99a62', '#b88a52', '#d8aa72'][i]);
  Q.line([[x - 1, y - 5.6 * k], [x - 1, y + 0.4 * k]], '#7a4a2a', 0.8 * k);
}
// 金色小皇冠：x、y 是底部中間
function gCrown(Q, x, y, k) {
  Q.poly([[-5, 0], [5, 0], [5.6, -5.2], [2.8, -2.6], [0, -6.8], [-2.8, -2.6], [-5.6, -5.2]].map(([a, b]) => [x + a * k, y + b * k]), '#ffd84d');
  Q.line([[x - 4.6 * k, y - 1.1 * k], [x + 4.6 * k, y - 1.1 * k]], '#d9a21a', 0.8 * k);
  for (const [dx, dy, c] of [[0, -6.8, '#ff6d9a'], [-5.6, -5.2, '#7ad3ff'], [5.6, -5.2, '#7ad3ff']]) Q.ellF(x + dx * k, y + dy * k, 0.95 * k, 0.95 * k, c);
  Q.ellF(x, y - 2.5 * k, 1.15 * k, 1.15 * k, '#e8394d');
}
// 小喇叭（喵喵廣播）：x、y 是吹嘴；dir 1 朝右
function gHorn(Q, x, y, lv, k = 1, dir = 1) {
  const C = GEARC.horn[lv], b = lv >= 2 ? 1.45 : 1, X = (a) => x + a * k * dir;
  Q.poly([[X(0), y - 0.9 * k], [X(4.6 * b), y - 2.7 * k * b], [X(4.6 * b), y + 2.7 * k * b], [X(0), y + 0.9 * k]], C.c);
  Q.ellF(X(4.6 * b), y, 0.9 * k, 2.4 * k * b, C.d);
  if (C.band) Q.line([[X(2.6 * b), y - 1.9 * k * b], [X(2.6 * b), y + 1.9 * k * b]], C.band, 0.9 * k);
  Q.ellF(X(-0.5), y, 0.8 * k, 0.8 * k, C.d);
}
// 礦工頭燈（貓道）：x、y 是燈的中心
function gLamp(Q, x, y, k = 1) {
  Q.ell(x, y, 2.8 * k, 2.4 * k, '#3a3a4a');
  Q.ellF(x, y, 1.9 * k, 1.6 * k, '#fff3a0');
  Q.ellF(x - 0.6 * k, y - 0.5 * k, 0.6 * k, 0.5 * k, '#ffffff');
}
// 發光的小燈籠（夜貓子第三級）
function gLantern(Q, x, y, k = 1, lie = false) {
  const cx = lie ? x + 3 * k : x + 0.3 * k, cy = lie ? y - 1.4 * k : y + 4.6 * k;
  if (!lie) Q.line([[x, y], [x + 0.3 * k, y + 1.6 * k]], '#c9a43a', 0.7 * k);
  Q.ellF(cx, cy, 4.2 * k, 4.6 * k, 'rgba(255,200,110,0.35)');
  Q.ell(cx, cy, 2.5 * k, 3 * k, '#ff7a3a');
  for (const dx of [-1.2, 0, 1.2]) Q.line([[cx + dx * k, cy - 2.6 * k], [cx + dx * 1.15 * k, cy + 2.6 * k]], '#c4421a', 0.5 * k);
  Q.ellF(cx, cy, 1.1 * k, 1.5 * k, '#ffe08a');
  Q.poly([[cx - 1.5 * k, cy - 3.4 * k], [cx + 1.5 * k, cy - 3.4 * k], [cx + 1.5 * k, cy - 2.6 * k], [cx - 1.5 * k, cy - 2.6 * k]], '#3a2a20');
  Q.poly([[cx - 1.5 * k, cy + 2.6 * k], [cx + 1.5 * k, cy + 2.6 * k], [cx + 1.5 * k, cy + 3.4 * k], [cx - 1.5 * k, cy + 3.4 * k]], '#3a2a20');
  Q.line([[cx, cy + 3.4 * k], [cx, cy + 5.4 * k]], '#e8394d', 0.7 * k);
  Q.poly(star4Pts(cx - 3.4 * k, cy - 1.2 * k, 1.8 * k), '#fff3a0');
}
// 花袋／花籃：x、y 是底部中間
function gBag(Q, x, y, lv, k = 1) {
  const C = GEARC.bag[lv];
  if (lv >= 3) k *= 1.18;
  if (lv >= 2) {
    const fl = lv >= 3 ? [[-3.6, 4.6, '#e8394d'], [-1.6, 6.8, '#ff8fb8'], [0.6, 7.6, '#ffd84d'], [2.6, 6.2, '#ffffff'], [4.2, 4.4, '#9a6ad0']] : [[-2.6, 5, '#ff8fb8'], [0.4, 6.6, '#ffd84d'], [3, 4.8, '#ffffff']];
    for (const [dx, h] of fl) Q.line([[x + dx * k, y - 4 * k], [x + dx * 1.15 * k, y - (4 + h) * k]], PC.stem, 0.9 * k);
    for (const [dx, h, col] of fl) gFlower(Q, x + dx * 1.15 * k, y - (4 + h) * k, 1.8 * k, col);
    Q.poly([[x - 5.2 * k, y - 4.6 * k], [x + 5.2 * k, y - 4.6 * k], [x + 4.2 * k, y], [x - 4.2 * k, y]], C.c);
    for (let i = 1; i <= 2; i++) Q.line([[x - (5.1 - i * 0.35) * k, y - (4.6 - i * 1.5) * k], [x + (5.1 - i * 0.35) * k, y - (4.6 - i * 1.5) * k]], C.d, 0.7 * k);
    for (let i = -2; i <= 2; i++) Q.line([[x + i * 1.9 * k, y - 4.4 * k], [x + i * 1.6 * k, y - 0.4 * k]], C.d, 0.55 * k);
    Q.poly([[x - 5.8 * k, y - 5.7 * k], [x + 5.8 * k, y - 5.7 * k], [x + 5.8 * k, y - 4.2 * k], [x - 5.8 * k, y - 4.2 * k]], C.d);
    if (C.rib) { for (const sd of [-1, 1]) Q.ell(x + sd * 1.9 * k, y - 2.4 * k, 1.8 * k, 1.1 * k, C.rib, sd * 0.4); Q.ellF(x, y - 2.4 * k, 0.8 * k, 0.8 * k, '#d94a78'); }
  } else {
    Q.line([[x + 0.5 * k, y - 3.6 * k], [x + 1.2 * k, y - 7.2 * k]], PC.stem, 0.9 * k);
    gFlower(Q, x + 1.2 * k, y - 7.5 * k, 1.75 * k, '#ff8fb8');
    Q.poly([[x - 3.9 * k, y - 4 * k], [x + 3.9 * k, y - 4 * k], [x + 4.4 * k, y - 1 * k], [x, y + 0.5 * k], [x - 4.4 * k, y - 1 * k]], C.c);
    Q.line([[x - 3.4 * k, y - 3 * k], [x + 3.4 * k, y - 3 * k]], C.d, 0.8 * k);
    Q.ellF(x + 3.9 * k, y - 2.8 * k, 0.75 * k, 0.75 * k, '#e8394d');
  }
}
function crescentPts(cx, cy, R) {
  const pts = [];
  for (let i = 0; i <= 8; i++) { const a = (60 + i * 30) * Math.PI / 180; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
  for (let i = 1; i < 6; i++) { const b = (270 - i * 30) * Math.PI / 180; pts.push([cx + 0.5 * R + Math.cos(b) * 0.866 * R, cy + Math.sin(b) * 0.866 * R]); }
  return pts;
}
function star4Pts(x, y, r) { const pts = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return pts; }
// 月亮吊飾：x、y 是尾巴尖。lie：尾巴躺在地上（月亮放旁邊）
function gMoon(Q, x, y, lv, k = 1, lie = false) {
  if (lv >= 3) { gLantern(Q, x, y, k, lie); return; }
  const cx = lie ? x + 2.6 * k : x + 0.3 * k, cy = lie ? y - 1 * k : y + 3.9 * k;
  if (!lie) Q.line([[x, y], [x + 0.3 * k, y + 1.7 * k]], '#c9a43a', 0.7 * k);
  Q.poly(crescentPts(cx, cy, 2.4 * k), '#ffe27a');
  if (lv >= 2) Q.poly(star4Pts(cx - 2.9 * k, cy + 1.7 * k, 1.8 * k), '#fff3a0');
}
function strapPts(x0, y0, x1, y1, w) { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2; return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]; }

// ---- 正面的貓頭（drawCatHead 裡呼叫；P 是頭的座標轉換，s 是縮放）----
// 項圈、領巾：在畫頭之前（頭會蓋住上半）
function gearHeadUnder(P, s, g) {
  if (g.scarf) {
    const C = GEARC.scarf[g.scarf];
    // 有項圈的話領巾做長一點，尖端從鈴鐺下面露出來
    const A = P(g.collar ? -15 : -13, 8.5), B = P(g.collar ? 15 : 13, 8.5), T = P(0, g.collar ? 31.5 : 23);
    gPoly([A, B, T], C.c);
    PX.curve([P(-9.5, 10.2), P(0, 12.4), P(9.5, 10.2)], C.d, { w: 0.8 });
    if (C.lace) for (let i = 1; i <= 4; i++) { const q = i / 5; for (const E of [A, B]) PX.ellipse(E[0] + (T[0] - E[0]) * q, E[1] + (T[1] - E[1]) * q, 0.95 * s + 0.35, 0.95 * s + 0.35, C.lace); }
    if (C.dots) for (const [x, y] of [[-5, 11.6], [5, 11.6], [0, 16.6]]) { const [X, Y] = P(x, y); PX.ellipse(X, Y, 1.4 * s + 0.2, 1.4 * s + 0.2, C.dots); }
  }
  if (g.collar) {
    // 項圈是一條彎彎的帶子：外框＝往外擴 1 單位，再填顏色
    const col = collarCol(g), e = 1 / s;
    const band = (d) => { const top = [], bot = []; for (let i = 0; i <= 8; i++) { const u = -1 + i / 4; top.push(P(u * (12.4 + d), 9.6 - d + 2.8 * (1 - u * u))); bot.push(P(u * (11.6 + d), 14.6 + d + 3.3 * (1 - u * u))); } return top.concat(bot.reverse()); };
    PX.poly(band(e), TAB.out); PX.poly(band(0), col, { part: 9 });
    if (g.collar >= 3) for (const u of [-0.6, 0, 0.6]) { const [X, Y] = P(u * 11.8, 12.2 + 3.1 * (1 - u * u)); PX.ellipse(X, Y, 0.7 * s + 0.25, 0.7 * s + 0.25, '#fff4c8'); }
    const big = g.collar >= 2, br = (big ? 3.4 : 2.7) * s, by0 = big ? 19.6 : 18.8, [bx, by] = P(0, by0);
    gEll(bx, by, br, br, '#ffd84d');
    PX.line(...P(-1.9, by0 + 0.8), ...P(1.9, by0 + 0.8), '#a8761a');
    PX.ellipse(bx - br * 0.35, by - br * 0.35, br * 0.28, br * 0.28, '#fffbe0');
  }
  if (g.horn) { const [hx, hy] = P(7.6, 15.6); PX.curve([P(4, 11.6), P(6.4, 14), P(7.6, 15.6)], '#8a6a3a', { w: 0.8 }); gHorn(GP, hx, hy, g.horn, 1.05 * s); }
}
// 眼罩：眼周亮色之後、眼睛之前（眼睛蓋在上面，像挖了洞）
function gearHeadMask(P, s, g) {
  const C = GEARC.mask[g.mask];
  const top = [[-16.6, -4], [-11.5, -6.9], [-4.2, -5.8], [0, -4.6], [4.2, -5.8], [11.5, -6.9], [16.6, -4]];
  const bot = [[16.2, 2.4], [11.5, 3.9], [4.2, 2.6], [0, 1.4], [-4.2, 2.6], [-11.5, 3.9], [-16.2, 2.4]];
  gPoly([P(15.6, -2.4), P(22, -5.8), P(21.2, 0.4)], C.c);
  gPoly([P(15.6, -0.8), P(20.6, 3), P(17.4, 4)], C.c);
  PX.poly(top.concat(bot).map(([x, y]) => P(x, y)), C.c, { part: 9 });
  if (C.trim) { PX.curve(top.map(([x, y]) => P(x, y)), C.trim, { w: 0.9 }); PX.curve(bot.map(([x, y]) => P(x, y)), C.trim, { w: 0.9 }); }
}
// 蝴蝶結／花冠、耳邊的花：頭的最後面
function gearHeadTop(P, s, rot, g) {
  if (g.glass) { const L = P(-7, -1), R = P(7, -1); glassDraw(GP, [L[0], R[0]], (L[1] + R[1]) / 2, 4.4 * s, g.glass, TAB.out); }
  if (g.hat) { const [hx, hy] = P(0, -14.4); hatDraw(GP, hx, hy, 1.02 * s, g.hat); return; }
  if (g.hband) { const pts = [P(-16.4, -6.2), P(-8, -9.4), P(0, -10.2), P(8, -9.4), P(16.4, -6.2)]; PX.curve(pts, TAB.out, { w: 3.2 * s + 1.4 }); PX.curve(pts, '#e8394d', { w: 3.2 * s }); PX.curve([P(-8, -8.6), P(0, -9.4), P(8, -8.6)], '#ffffff', { w: 0.7 * s }); }
  if (g.phones) { const pts = [P(-15.6, -2), P(-14, -13), P(0, -18.2), P(14, -13), P(15.6, -2)]; PX.curve(pts, TAB.out, { w: 2 * s + 1.4 }); PX.curve(pts, '#4a4a5a', { w: 2 * s }); for (const sd of [-1, 1]) { const [x, y] = P(sd * 16.4, -1); gEll(x, y, 3.2 * s, 4 * s, '#7ad3ff'); } }
  if (g.ahoge) { const pts = [P(1, -14.6), P(3.4, -21.5), P(0.4, -25.4), P(-2.4, -23.6)]; PX.curve(pts, TAB.out, { w: 2.6 * s + 1.4 }); PX.curve(pts, TAB.fur, { w: 2.6 * s }); }
  if (g.band) { for (const r of [0.6, -0.6]) { const c = P(8.6, -8.6), dx = Math.cos(r) * 4.2 * s, dy = Math.sin(r) * 4.2 * s, nx = -Math.sin(r) * 1.5 * s, ny = Math.cos(r) * 1.5 * s; gPoly([[c[0] - dx - nx, c[1] - dy - ny], [c[0] + dx - nx, c[1] + dy - ny], [c[0] + dx + nx, c[1] + dy + ny], [c[0] - dx + nx, c[1] - dy + ny]], '#f2cfa2'); } const c = P(8.6, -8.6); PX.ellipse(c[0], c[1], 1.1 * s, 1.1 * s, '#e0b080'); }
  if (g.bow >= 3) {
    for (let i = 0; i < 6; i++) { const u = -1 + (i + 0.5) / 3, [x, y] = P(u * 14, -14.6 - 1.5 * (1 - u * u)); PX.ellipse(x, y, 2.7 * s + 0.9, 1.5 * s + 0.7, TAB.out, { rot: rot + u * 0.8 }); PX.ellipse(x, y, 2.7 * s, 1.5 * s, '#5aa652', { rot: rot + u * 0.8 }); }
    for (let i = 0; i < 7; i++) { const u = -1 + i / 3, [x, y] = P(u * 14, -14.6 - 1.5 * (1 - u * u)); gFlower(GP, x, y, 3.3 * s, GEARC.crown[i]); }
    if (g.bow >= 4) { const [x, y] = P(0, -17.2); gCrown(GP, x, y, 1.2 * s); }
  } else if (g.bow) {
    const C = GEARC.bow[g.bow], k = C.s, bx = -10, by = -14;
    gPoly([P(bx - 0.6, by), P(bx - 3.6 * k, by + 5.8 * k), P(bx - 1.2 * k, by + 5.2 * k)], C.d);
    gPoly([P(bx + 0.6, by), P(bx + 3.1 * k, by + 5.6 * k), P(bx + 0.8 * k, by + 5.4 * k)], C.d);
    for (const sd of [-1, 1]) {
      const [x, y] = P(bx + sd * 5 * k, by - 0.8 * k);
      gEll(x, y, 5 * k * s, 3.4 * k * s, C.c, rot + sd * 0.35);
      const [fx, fy] = P(bx + sd * 2.6 * k, by - 0.3 * k);
      PX.ellipse(fx, fy, 1.5 * k * s, 1.3 * k * s, C.d, { rot: rot + sd * 0.35 });
      if (C.dots) for (const [du, dv] of [[6.2, -1.6], [4.2, 1.2], [7.4, 0.8]]) { const [X, Y] = P(bx + sd * du * k * 0.92, by + dv * k * 0.8 - 0.8 * k); PX.ellipse(X, Y, 0.75 * k * s + 0.2, 0.75 * k * s + 0.2, C.dots); }
    }
    const [kx, ky] = P(bx, by);
    gEll(kx, ky, 2.1 * k * s, 2.1 * k * s, C.c);
  }
  if (g.lamp) {
    PX.curve([P(-16, -6.6), P(-8, -11.6), P(0, -12.6), P(8, -11.6), P(16, -6.6)], TAB.out, { w: 2.4 * s + 1.2 });
    PX.curve([P(-16, -6.6), P(-8, -11.6), P(0, -12.6), P(8, -11.6), P(16, -6.6)], '#3a3a4a', { w: 2.4 * s });
    const [lx, ly] = P(0, -12.2); gLamp(GP, lx, ly, 1.25 * s);
  }
  if (g.flower) {
    const C = GEARC.flower[g.flower], [x, y] = g.bow >= 3 ? P(16, -6.5) : P(12.2, -12.8);
    if (g.flower >= 2) gHibiscus(GP, x, y, 4.4 * C.s * s, C.c);
    else gFlower(GP, x, y, 3.6 * C.s * s, C.c, C.ctr);
  }
}
function gearEyeCol(g) { return g && g.glow ? GEARC.glow[g.glow] : null; }

// ---- 側面的頭（drawCatProfileHead 裡呼叫；O 畫筆，P 是頭的座標）----
function gearSideMask(P, g) {
  const C = GEARC.mask[g.mask];
  GO.poly([P(-3.8, -2.6), P(-9, -5.2), P(-8.2, -1.6)], C.c);
  GO.poly([P(-3.8, -1.4), P(-7.8, 1.6), P(-5.3, 2.2)], C.c);
  O.blob([P(-4, -4.6), P(2.2, -4.9), P(7.6, -3.4), P(7.8, 0.8), P(2.4, 1.3), P(-4, 0.4)], C.c);
  if (C.trim) { O.curve([P(-4, -4.6), P(2.2, -4.9), P(7.6, -3.4)], C.trim, 0.7); O.curve([P(7.8, 0.8), P(2.4, 1.3), P(-4, 0.4)], C.trim, 0.7); }
}
function gearSideTop(P, g) {
  if (g.glass) { const [gx, gy] = P(4.4, -0.8); glassSide(GO, gx, gy, 2.2, g.glass, CM.ink); }
  if (g.hat) { const [hx, hy] = P(0.6, -7.2); hatDraw(GO, hx, hy, 0.5, g.hat); return; }
  if (g.hband) { const pts = [P(-7.6, -2.6), P(-2, -6.6), P(4, -7.2), P(7.8, -4.4)]; O.curve(pts, CM.ink, 3); O.curve(pts, '#e8394d', 1.8); }
  if (g.phones) { const pts = [P(-3, -1), P(-1, -8), P(4, -8.6)]; O.curve(pts, CM.ink, 2.4); O.curve(pts, '#4a4a5a', 1.2); const [x, y] = P(-3.2, -0.6); O.eo(x, y, 2, 2.4, '#7ad3ff'); }
  if (g.ahoge) { const pts = [P(0.4, -7.4), P(1.8, -11.6), P(-0.4, -13.8), P(-2, -12.6)]; O.curve(pts, CM.ink, 2.4); O.curve(pts, TAB.fur, 1.3); }
  if (g.band) { const [x, y] = P(-4.6, -4.4); O.blobO([[x - 2.4, y - 0.8], [x + 2.4, y - 0.8], [x + 2.4, y + 0.8], [x - 2.4, y + 0.8]], '#f2cfa2'); }
  if (g.bow >= 3) {
    for (let i = 0; i < 5; i++) { const a = -2.8 + i * 0.44, [x, y] = P(Math.cos(a) * 7.4, Math.sin(a) * 6.9 - 0.4); O.e(x, y, 2.2, 1.2, CM.ink, { rot: a + 1.57 }); O.e(x, y, 1.6, 0.8, '#5aa652', { rot: a + 1.57 }); }
    for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.4, [x, y] = P(Math.cos(a) * 7.6, Math.sin(a) * 7.1 - 0.6); gFlower(GO, x, y, 1.75, GEARC.crown[i + 1]); }
    if (g.bow >= 4) { const [x, y] = P(0.6, -8.4); gCrown(GO, x, y, 0.62); }
  } else if (g.bow) {
    const C = GEARC.bow[g.bow], k = C.s * 0.74, [cx, cy] = P(1.6, -8.1);
    GO.poly([[cx - 0.3, cy], [cx - 1.9 * k, cy + 3.4 * k], [cx - 0.5 * k, cy + 3 * k]], C.d);
    GO.poly([[cx + 0.3, cy], [cx + 1.7 * k, cy + 3.2 * k], [cx + 0.4 * k, cy + 3.1 * k]], C.d);
    for (const sd of [-1, 1]) O.eo(cx + sd * 2.7 * k, cy - 0.5 * k, 2.7 * k, 1.85 * k, C.c, { rot: sd * 0.35 });
    if (C.dots) for (const sd of [-1, 1]) O.dot(cx + sd * 3.4 * k, cy - 0.9 * k, 0.5 * k + 0.1, C.dots);
    O.eo(cx, cy, 1.2 * k, 1.2 * k, C.c);
  }
  if (g.lamp) { const pts = [P(-6.8, -3.4), P(-3, -7), P(2, -7.4), P(6.6, -4.2)]; O.curve(pts, CM.ink, 2.6); O.curve(pts, '#3a3a4a', 1.4); const [lx, ly] = P(3.4, -6.6); gLamp(GO, lx, ly, 0.72); }
  if (g.flower) {
    const C = GEARC.flower[g.flower], [x, y] = P(-6.4, -5.2);
    if (g.flower >= 2) gHibiscus(GO, x, y, 2.4 * C.s, C.c);
    else gFlower(GO, x, y, 1.95 * C.s, C.c, C.ctr);
  }
}
// 側面的脖子：項圈沿著頭的左下緣、鈴鐺掛在下巴下面、領巾垂在胸前（畫在頭之後）
function gearSideNeck(P, g) {
  if (g.scarf) {
    const C = GEARC.scarf[g.scarf];
    GO.poly([P(-4.8, 5), P(3.8, 6.4), P(3.6, 14.6), P(-1.4, 10.8)], C.c);
    if (C.lace) for (const [x, y] of [[3.6, 9.4], [3.5, 12.2], [1.4, 12.4], [-0.4, 10.6]]) { const [X, Y] = P(x, y); O.dot(X, Y, 0.6, C.lace); }
    if (C.dots) for (const [x, y] of [[0.6, 8], [2.2, 11.2]]) { const [X, Y] = P(x, y); O.dot(X, Y, 0.7, C.dots); }
  }
  if (g.collar) {
    const arc = []; for (let i = 0; i <= 5; i++) { const a = (100 + i * 12) * Math.PI / 180; arc.push(P(Math.cos(a) * 8.3, Math.sin(a) * 7.4)); }
    O.curve(arc, CM.ink, 3.6); O.curve(arc, collarCol(g), 1.9);
    const br = g.collar >= 2 ? 1.85 : 1.45, [bx, by] = P(-1.6, 8.9);
    O.eo(bx, by, br, br, '#ffd84d'); O.dot(bx - br * 0.35, by - br * 0.35, br * 0.3, '#fffbe0');
  }
  if (g.horn) { const [hx, hy] = P(1.2, 10.4); gHorn(GO, hx, hy, g.horn, 0.62, 1); }
}

// ---- 場景裡的身體（O 畫筆）----
function gearSock(near = true) { const g = gearNow(); if (!g || !g.socks) return null; const C = GEARC.sock[g.socks]; return { c: near ? C.c : C.d, toe: C.toe }; }
function gearTailO(x, y, lie) { const g = gearNow(); if (g && g.moon) gMoon(GO, x, y, g.moon, 1, lie); }
// 斜背帶：從背上斜斜繞到身側的花袋
function gStrap(pts, col) { O.curve(pts, CM.ink, 3); O.curve(pts, col, 1.3); }
// 側面（朝右）：B 是身體的座標轉換。'back'：身體之前（遠側翅膀）；'over'：身體之後、近側腳之前
function gearSideBody(stage, B, rx, ry, g) {
  if (stage === 'back') {
    if (g.wings) { const [x, y] = B(5.6, -ry * 0.74); gWing(GO, x, y - 0.4, -1, 0.82, 0.5, '#e3ecf7'); }
    return;
  }
  if (g.cape || g.capeO) {
    GO.poly([B(7, -ry * 0.8), B(-1, -ry * 1.12), B(-10.8, -ry * 0.6), B(-12.2, ry * 0.2), B(-6, ry * 0.45), B(1.5, ry * 0.08), B(5.6, -ry * 0.22)], capeC(g));
    O.curve([B(-2.5, -ry * 0.75), B(-8, ry * 0.25)], capeD(g), 0.9);
  }
  if (g.pack) {
    const C = GEARC.pack[g.pack];
    gStrap([B(0.8, -ry + 0.8), B(2.6, 0), B(1.6, ry * 0.85)], C.d);
    const [x, y] = B(-2.6, -ry - 1.2); gPack(GO, x, y, g.pack, 0.9);
  }
  if (g.wings) { const [x, y] = B(4.4, -ry * 0.8); gWing(GO, x, y, -1, 1, 0.35); }
  if (g.plank) gPlank(GO, ...B(-6.4, -ry - 0.6), g.plank, 0.9);
  if (g.bag) {
    const C = GEARC.bag[g.bag], [x, y] = B(0.6, ry * 0.95);
    gStrap([B(-4.4, -ry * 0.95), B(-2.2, ry * 0.2), [x - 2.6, y - 3.6]], C.d);
    gStrap([B(5, -ry * 0.95), B(3.4, ry * 0.2), [x + 2.6, y - 3.6]], C.d);
    gBag(GO, x, y, g.bag, 0.78);
  }
}
// 正面（朝鏡頭）：'back' 身體之前；'over' 身體之後、前腳之前
function gearFrontBody(stage, bob, g) {
  if (stage === 'back') {
    if (g.cape || g.capeO) GO.poly([[-8.8, -15.6 + bob], [8.8, -15.6 + bob], [11.2, -1.2], [-11.2, -1.2]], capeC(g));
    if (g.wings) for (const sd of [-1, 1]) gWing(GO, sd * 5, -12.4 + bob, sd, 0.95, 0);
    return;
  }
  if (g.pack) for (const sd of [-1, 1]) O.limb(sd * 3.7, -15.4 + bob, sd * 4.5, -7.6 + bob, 1.4, GEARC.pack[g.pack].d);
  if (g.bag) { gStrap([[-5.4, -15 + bob], [0.6, -10.6 + bob], [6.4, -7.4 + bob]], GEARC.bag[g.bag].d); gBag(GO, 8.6, -2.6 + bob, g.bag, 0.74); }
}
// 背面（離開鏡頭）：'cape' 身體之後、尾巴之前；'over' 尾巴之後、頭之前；'head' 頭之後（後腦勺上的蝴蝶結、眼罩帶子）
function gearBackBody(stage, bob, g) {
  if (stage === 'cape') { if (g.cape || g.capeO) GO.poly([[-6.8, -16.4 + bob], [6.8, -16.4 + bob], [9.4, -1.4], [-9.4, -1.4]], capeC(g)); return; }
  const hy = -19.5 + bob;
  if (stage === 'head') {
    if (g.hat) { hatDraw(GO, 0, hy - 6.6, 0.5, g.hat); return; }
    if (g.mask) { const C = GEARC.mask[g.mask]; O.limb(-8, hy - 0.6, 8, hy - 0.6, 1.7, C.c); GO.poly([[-7.4, hy - 1.4], [-11.6, hy - 4.2], [-11, hy + 0.2]], C.c); GO.poly([[-7.4, hy], [-10.6, hy + 3], [-8.4, hy + 3.6]], C.c); }
    if (g.bow >= 3) { for (let i = 0; i < 6; i++) { const u = -1 + i / 2.5; gFlower(GO, u * 6.8, hy - 6.4 - (1 - u * u) * 0.9, 1.7, GEARC.crown[i]); } if (g.bow >= 4) gCrown(GO, 0, hy - 7.6, 0.6); }
    else if (g.bow) { const C = GEARC.bow[g.bow], k = C.s * 0.5, cx = 5, cy = hy - 7; for (const sd of [-1, 1]) O.eo(cx + sd * 2.6 * k, cy - 0.4 * k, 2.6 * k, 1.8 * k, C.c, { rot: sd * 0.35 }); O.eo(cx, cy, 1.1 * k, 1.1 * k, C.c); }
    if (g.flower) { const C = GEARC.flower[g.flower]; gFlower(GO, -6.4, hy - 6.2, 1.9 * C.s, C.c, C.ctr); }
    if (g.lamp) O.limb(-8.2, hy - 2.6, 8.2, hy - 2.6, 1.5, '#3a3a4a');
    if (g.hband) O.limb(-8.4, hy - 1.6, 8.4, hy - 1.6, 1.7, '#e8394d');
    if (g.phones) { O.curve([[-8.6, hy + 1], [-7, hy - 6], [0, hy - 8.6], [7, hy - 6], [8.6, hy + 1]], CM.ink, 2.4); O.curve([[-8.6, hy + 1], [-7, hy - 6], [0, hy - 8.6], [7, hy - 6], [8.6, hy + 1]], '#4a4a5a', 1.2); }
    if (g.ahoge) { const pts = [[0.6, hy - 7.6], [1.8, hy - 11.8], [-0.4, hy - 13.6], [-1.8, hy - 12.4]]; O.curve(pts, CM.ink, 2.4); O.curve(pts, TAB.fur, 1.3); }
    return;
  }
  if (g.wings) for (const sd of [-1, 1]) gWing(GO, sd * 2.4, -13.2 + bob, sd, 1, 0);
  if (g.scarf) { const C = GEARC.scarf[g.scarf]; O.limb(-5.8, -12.4 + bob, 5.8, -12.4 + bob, 1.6, C.c); GO.poly([[-1.6, -12.6 + bob], [1.6, -12.6 + bob], [2.8, -8.8 + bob], [0, -10 + bob], [-2.8, -8.8 + bob]], C.c); }
  if (g.collar) O.limb(-5.8, -13.2 + bob, 5.8, -13.2 + bob, 1.8, collarCol(g));
  if (g.bag) { gStrap([[5.4, -15 + bob], [-0.6, -10.6 + bob], [-6.4, -7.4 + bob]], GEARC.bag[g.bag].d); gBag(GO, -8.6, -2.6 + bob, g.bag, 0.74); }
  if (g.pack) gPack(GO, 0, -9.8 + bob, g.pack, 0.95);
  if (g.plank) gPlank(GO, 0, -14.6 + bob, g.plank, 0.95);
}
// 母雞蹲（正面）：'back' 身體之前；'over' 身體之後、頭之前
function gearLoafBody(stage, g) {
  if (stage === 'back') {
    if (g.cape || g.capeO) GO.poly([[-10.4, -12.2], [10.4, -12.2], [12.4, -0.6], [-12.4, -0.6]], capeC(g));
    if (g.wings) for (const sd of [-1, 1]) gWing(GO, sd * 7.2, -10.2, sd, 0.74, 0);
    return;
  }
  if (g.pack) for (const sd of [-1, 1]) O.limb(sd * 4.3, -11.8, sd * 5.1, -7.2, 1.3, GEARC.pack[g.pack].d);
  if (g.bag) gBag(GO, -12, -0.2, g.bag, 0.66);
}
// 紙箱偽裝：耳朵旁邊的蝴蝶結／花冠／小花
function gearBoxTop(wob, g) {
  if (g.bow >= 3) { for (let i = 0; i < 5; i++) { const u = -1 + i / 2; gFlower(GO, u * 6.4 + wob, -20.4 - (1 - u * u) * 1.2, 1.6, GEARC.crown[i + 1]); } if (g.bow >= 4) gCrown(GO, wob, -21.6, 0.55); }
  if (g.lamp) gLamp(GO, -1 + wob, -18.6, 0.7);
  else if (g.bow) { const C = GEARC.bow[g.bow], k = C.s * 0.55, cx = -6.4 + wob, cy = -21.6; for (const sd of [-1, 1]) O.eo(cx + sd * 2.6 * k, cy - 0.4 * k, 2.6 * k, 1.8 * k, C.c, { rot: sd * 0.35 }); O.eo(cx, cy, 1.1 * k, 1.1 * k, C.c); }
  if (g.flower) { const C = GEARC.flower[g.flower]; gFlower(GO, 7.6 + wob, -21.4, 1.9 * C.s, C.c, C.ctr); }
}

// ---- 特寫（96×64，PX 畫筆）----
// kind：'lie' 趴著喵（正面）、'sit' 招財貓坐姿、'rub' 側面蹭腳（o.x、o.y 是身體中心）
// stage：'back' 身體之前、'over' 身體之後頭之前
function gearClose(kind, stage, o = {}) {
  const g = gearNow(); if (!g) return;
  if (kind === 'lie') {
    if (stage === 'back') {
      if (g.cape || g.capeO) GP.poly([[12, 47], [84, 47], [90, 64], [6, 64]], capeC(g));
      if (g.pack) gPack(GP, 22, 48, g.pack, 1.3);   // 背包從背後露出一半
      if (g.bag) gBag(GP, 87, 62, g.bag, 1.15);
    } else {
      if (g.wings) for (const sd of [-1, 1]) gWing(GP, 48 + sd * 24, 52, sd, 1.3, 0);
      if (g.pack) for (const sd of [-1, 1]) GP.poly(strapPts(48 + sd * 12.5, 46, 48 + sd * 14, 58, 2.2), GEARC.pack[g.pack].d);
    }
  } else if (kind === 'sit') {
    if (stage === 'back') {
      if (g.cape || g.capeO) GP.poly([[31, 34], [65, 34], [70, 63], [26, 63]], capeC(g));
      if (g.pack) gPack(GP, 32, 37, g.pack, 1.3);
      if (g.wings) for (const sd of [-1, 1]) gWing(GP, 48 + sd * 11, 39, sd, 1.4, 0);
      if (g.bag) gBag(GP, 84, 62, g.bag, 1.2);
    } else if (g.pack) for (const sd of [-1, 1]) GP.poly(strapPts(48 + sd * 11.5, 34, 48 + sd * 10.5, 50, 2.2), GEARC.pack[g.pack].d);
  } else if (kind === 'rub') {
    const x = o.x, y = o.y;
    if (stage === 'back') { if (g.wings) gWing(GP, x + 9, y - 8.5, -1, 1.25, 0.5, '#e3ecf7'); return; }
    if (g.cape || g.capeO) GP.poly([[x + 15, y - 7], [x, y - 11], [x - 19, y - 6], [x - 21, y + 3], [x - 9, y + 5], [x + 4, y + 1], [x + 12, y - 2]], capeC(g));
    if (g.pack) { GP.poly(strapPts(x + 2, y - 8, x + 4, y + 6, 1.7), GEARC.pack[g.pack].d); gPack(GP, x - 4, y - 11.5, g.pack, 1.4); }
    if (g.wings) gWing(GP, x + 7, y - 8.5, -1, 1.5, 0.35);
    if (g.bag) { const bd = GEARC.bag[g.bag].d; GP.poly(strapPts(x - 6, y - 9.5, x - 2, y + 4, 1.6), bd); GP.poly(strapPts(x + 9, y - 9.5, x + 6, y + 4, 1.6), bd); gBag(GP, x + 2, y + 9.5, g.bag, 1.25); }
  }
}
function gearPawPX() { const g = gearNow(); return g && g.socks ? GEARC.sock[g.socks] : null; }
function gearTailPX(pts) { const g = gearNow(); if (!g || !g.moon || !pts.length) return; const [x, y] = pts[pts.length - 1]; gMoon(GP, x, y, g.moon, 1.45); }

// ---- 小遊戲裡的簡化貓頭（canvas 2D，頭的半徑 18×15）----
function gearCuteHead(c, stage, pal) {
  const g = pal === ORANGE_HEAD ? orangeGearFor(G.run) : (pal ? null : gearNow());
  if (!g) return;
  const ink = CM.ink;
  const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
  const ell = (x, y, rx, ry, col, rot = 0) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
  const flower = (x, y, r, col) => { for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.5708; ell(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.6 + 1.6, r * 0.6 + 1.6, ink); } for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.5708; ell(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.6, r * 0.6, col); } ell(x, y, r * 0.36, r * 0.36, '#ffe48a'); };
  if (stage === 'under') {
    if (g.scarf) { const C = GEARC.scarf[g.scarf]; poly([[-15, 8], [15, 8], [0, 27]], ink); poly([[-12, 9.6], [12, 9.6], [0, 23.8]], C.c); if (C.dots) for (const [x, y] of [[-4.5, 12.6], [4.5, 12.6], [0, 17.6]]) ell(x, y, 1.6, 1.6, C.dots); if (C.lace) for (let i = 1; i <= 4; i++) { const q = i / 5; ell(-12 + 12 * q, 9.6 + 14.2 * q, 1.2, 1.2, C.lace); ell(12 - 12 * q, 9.6 + 14.2 * q, 1.2, 1.2, C.lace); } }
    if (g.collar) {
      c.lineCap = 'round'; c.strokeStyle = ink; c.lineWidth = 6.4; c.beginPath(); c.moveTo(-12, 11); c.quadraticCurveTo(0, 19, 12, 11); c.stroke();
      c.strokeStyle = collarCol(g); c.lineWidth = 3.6; c.beginPath(); c.moveTo(-12, 11); c.quadraticCurveTo(0, 19, 12, 11); c.stroke();
      const br = g.collar >= 2 ? 3.8 : 3; ell(0, 18.4, br + 1.4, br + 1.4, ink); ell(0, 18.4, br, br, '#ffd84d');
    }
  } else if (stage === 'mask') {
    if (g.mask) { const C = GEARC.mask[g.mask]; poly([[-16, -5], [-6, -7], [0, -5], [6, -7], [16, -5], [15.6, 3], [6, 4], [0, 2.4], [-6, 4], [-15.6, 3]], C.c); if (C.trim) { c.strokeStyle = C.trim; c.lineWidth = 1; c.beginPath(); c.moveTo(-16, -5); c.lineTo(-6, -7); c.lineTo(0, -5); c.lineTo(6, -7); c.lineTo(16, -5); c.stroke(); } }
  } else if (stage === 'top') {
    if (g.glass) glassDraw(canvasPen(c, ink), [-6, 6], -1, 4.2, g.glass, ink);
    if (g.hat) { hatDraw(canvasPen(c, ink), 0, -14.2, 1.0, g.hat); return; }
    if (g.bow >= 3) { for (let i = 0; i < 7; i++) { const u = -1 + i / 3; flower(u * 14, -14.4 - (1 - u * u) * 1.6, 3.4, GEARC.crown[i]); } }
    else if (g.bow) {
      const C = GEARC.bow[g.bow], k = C.s;
      for (const sd of [-1, 1]) ell(-10 + sd * 5.4 * k, -15 - 0.8 * k, 5.4 * k + 1.6, 3.7 * k + 1.6, ink, sd * 0.35);
      for (const sd of [-1, 1]) { ell(-10 + sd * 5.4 * k, -15 - 0.8 * k, 5.4 * k, 3.7 * k, C.c, sd * 0.35); if (C.dots) ell(-10 + sd * 6.6 * k, -15.6 - 0.8 * k, 1, 1, C.dots); }
      ell(-10, -15, 2.4 * k + 1.6, 2.4 * k + 1.6, ink); ell(-10, -15, 2.4 * k, 2.4 * k, C.c);
    }
    if (g.bow >= 4) { const pts = [[-5, 0], [5, 0], [5.6, -5.2], [2.8, -2.6], [0, -6.8], [-2.8, -2.6], [-5.6, -5.2]].map(([a, b]) => [a * 1.3, -17.6 + b * 1.3]); c.lineJoin = 'round'; c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke(); poly(pts, '#ffd84d'); ell(0, -20.8, 1.4, 1.4, '#e8394d'); ell(0, -26.4, 1.2, 1.2, '#ff6d9a'); }
    if (g.hband) { c.strokeStyle = ink; c.lineWidth = 6.4; c.beginPath(); c.moveTo(-16.5, -6); c.quadraticCurveTo(0, -13, 16.5, -6); c.stroke(); c.strokeStyle = '#e8394d'; c.lineWidth = 4; c.beginPath(); c.moveTo(-16.5, -6); c.quadraticCurveTo(0, -13, 16.5, -6); c.stroke(); }
    if (g.phones) { c.strokeStyle = ink; c.lineWidth = 4.4; c.beginPath(); c.moveTo(-16, -1); c.quadraticCurveTo(0, -30, 16, -1); c.stroke(); c.strokeStyle = '#4a4a5a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-16, -1); c.quadraticCurveTo(0, -30, 16, -1); c.stroke(); for (const sd of [-1, 1]) { ell(sd * 16.5, 0, 4.6, 5.6, ink); ell(sd * 16.5, 0, 3.4, 4.4, '#7ad3ff'); } }
    if (g.ahoge) { c.lineCap = 'round'; c.strokeStyle = ink; c.lineWidth = 5; c.beginPath(); c.moveTo(1, -14.5); c.quadraticCurveTo(5, -24, -1, -27); c.stroke(); c.strokeStyle = pal ? pal.fur : TAB.fur; c.lineWidth = 2.6; c.beginPath(); c.moveTo(1, -14.5); c.quadraticCurveTo(5, -24, -1, -27); c.stroke(); }
    if (g.band) { c.save(); c.translate(9, -8.5); for (const r of [0.6, -0.6]) { c.save(); c.rotate(r); c.fillStyle = ink; c.fillRect(-5.4, -2.4, 10.8, 4.8); c.fillStyle = '#f2cfa2'; c.fillRect(-4.4, -1.4, 8.8, 2.8); c.restore(); } c.restore(); }
    if (g.lamp) { c.strokeStyle = ink; c.lineWidth = 4.6; c.beginPath(); c.moveTo(-16, -7); c.quadraticCurveTo(0, -17, 16, -7); c.stroke(); c.strokeStyle = '#3a3a4a'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-16, -7); c.quadraticCurveTo(0, -17, 16, -7); c.stroke(); ell(0, -12.4, 4.6, 4, ink); ell(0, -12.4, 3.4, 2.9, '#3a3a4a'); ell(0, -12.4, 2.4, 2, '#fff3a0'); }
    if (g.flower) { const C = GEARC.flower[g.flower]; flower(g.bow >= 3 ? 16 : 12.4, g.bow >= 3 ? -6 : -13, 3.8 * C.s, C.c); }
  }
  if (stage === 'under' && g.horn) { const C = GEARC.horn[g.horn], b = g.horn >= 2 ? 1.45 : 1; poly([[7, 14.4], [12 * b, 11.6], [12 * b, 19.4], [7, 16.6]].map(([x, y], i) => [x, y]), ink); poly([[7.6, 14.8], [11.4 * b, 12.4], [11.4 * b, 18.6], [7.6, 16.2]], C.c); ell(11.6 * b, 15.5, 1.2, 3 * b, C.d); }
}
function gearCuteEyes(pal) { const g = pal ? null : gearNow(); return { glow: gearEyeCol(g), mask: !!(g && g.mask) }; }

// ---- 3D 夜晚：發光的眼睛 ----
function gearEyeGlow(F, c, lift0) {
  const g = gearNow(); if (!g || !g.glow || c.box || c.pose === 'belly' || c.home) return;
  if (!(G.scene && G.scene.kind === 'night')) return;
  const side = c.dir === 'left' || c.dir === 'right';
  const loaf = c.pose === 'loaf' || (!c.moving && (c.idleT || 0) > 1.8 && !c.pose);
  if (!loaf && !side && c.dir === 'up') return;
  // 立牌是直立的、高度拉長 1/cos(pitch)：眼睛在立牌上的高度也要乘回去
  const k = CAT_SC / TU, x0 = c.x / TS, z0 = (c.y + 0.6) / TS + 0.03, kp = 1 / Math.cos(GL3.pitch || 0.9);
  const col = g.glow >= 2 ? [0.95, 1, 0.55] : [0.8, 1, 0.38];
  const tw = 0.82 + 0.18 * Math.sin((c.t || 0) * 3.3);
  const hop = (c.hop || 0) / TS;
  const pts = [];
  if (loaf) for (const sd of [-1, 1]) pts.push([sd * 3.6, 17]);
  else if (side) pts.push([(c.dir === 'left' ? -1 : 1) * 13.9, c.running ? 20 : 20.8]);
  else for (const sd of [-1, 1]) pts.push([sd * 3.5, 20]);
  for (const [ex, ey] of pts) {
    const h = (ey * k + lift0 + hop) * kp;
    glowQuad(F.glow, x0 + ex * k, h, z0, g.glow >= 2 ? 0.065 : 0.055, [col[0], col[1], col[2], 0.95 * tw]);
    glowQuad(F.glow, x0 + ex * k, h, z0 + 0.01, g.glow >= 2 ? 0.18 : 0.14, [col[0], col[1], col[2], 0.3 * tw]);
  }
}
