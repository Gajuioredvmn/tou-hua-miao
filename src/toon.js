// ================= 卡通角色：虎斑貓、鄰居、小柴（向量畫，做成 3D 立牌） =================
// 邏輯座標：1 格 = 32 單位，原點在腳底中間，y 往上是負的。
const TU = 32, TK = 3;
const TOON_CACHE = new Map();
let TOX = 0, TOY = 0;   // 原點在畫布邏輯座標裡的位置
let TOON_PREFIX = '';   // 換色（橘貓）時加在快取名稱前面
function toonFrame(key, w, h, draw) {
  key = TOON_PREFIX + key;
  let c = TOON_CACHE.get(key);
  if (c) return c;
  c = withPen(VXR, () => {
    VXR.begin(w, h, TK, { pad: 3 });
    TOX = w / 2; TOY = h;
    draw();
    return VXR.end();
  });
  c.__lw = w; c.__lh = h; c.__pad = 3;
  TOON_CACHE.set(key, c);
  return c;
}
// 小工具（原點在腳底）。OT 可以整個旋轉（例如叼著的花）
const OT = { a: 0, cs: 1, sn: 0, set(a) { this.a = a; this.cs = Math.cos(a); this.sn = Math.sin(a); } };
function TXY(x, y) { return [TOX + x * OT.cs - y * OT.sn, TOY + x * OT.sn + y * OT.cs]; }
const O = {
  e(x, y, rx, ry, col, o = {}) { const [X, Y] = TXY(x, y); VXR.ellipse(X, Y, rx, ry, col, Object.assign({}, o, { rot: (o.rot || 0) + OT.a })); },
  eo(x, y, rx, ry, col, o = {}) { const [X, Y] = TXY(x, y); VXR.ellipse(X, Y, rx + 1, ry + 1, CM.ink, { rot: (o.rot || 0) + OT.a }); VXR.ellipse(X, Y, rx, ry, col, Object.assign({}, o, { rot: (o.rot || 0) + OT.a })); },
  p(pts, col, o = {}) { VXR.poly(pts.map(([x, y]) => TXY(x, y)), col, o); },
  // 粗線（腿、手臂）：先畫描邊再畫顏色
  limb(x0, y0, x1, y1, w, col, o = {}) {
    const [A, B] = TXY(x0, y0), [C2, D] = TXY(x1, y1);
    if (!o.noOutline) VXR.shape({}, g => { g.strokeStyle = CM.ink; g.lineWidth = w + 2; g.beginPath(); g.moveTo(A, B); g.lineTo(C2, D); g.stroke(); });
    VXR.shape(o, (g, c) => { g.strokeStyle = c || col; g.lineWidth = w; g.beginPath(); g.moveTo(A, B); g.lineTo(C2, D); g.stroke(); });
  },
  // 平滑曲線（尾巴、頭髮線條）
  curve(pts, col, w = 1, o = {}) {
    VXR.shape(o, (g, c) => {
      g.strokeStyle = c || col; g.lineWidth = w; g.beginPath();
      const P = pts.map(([x, y]) => TXY(x, y));
      g.moveTo(P[0][0], P[0][1]);
      if (P.length === 2) g.lineTo(P[1][0], P[1][1]);
      else for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
        g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
      }
      g.stroke();
    });
  },
  // 平滑封閉形狀（頭髮、耳朵）
  blob(pts, col, o = {}) {
    VXR.shape(o, (g, c) => {
      const P = pts.map(([x, y]) => TXY(x, y)), n = P.length;
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
        if (i === 0) g.moveTo(p1[0], p1[1]);
        g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
      }
      g.closePath();
      if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.sw || 2; g.stroke(); }
      g.fillStyle = c || col; g.fill();
    });
  },
  blobO(pts, col, o = {}) { this.blob(pts, col, Object.assign({}, o, { stroke: CM.ink, sw: 2 })); },
  dot(x, y, r, col, o = {}) { const [X, Y] = TXY(x, y); VXR.shape(o, (g, c) => { g.fillStyle = c || col; g.beginPath(); g.arc(X, Y, r, 0, 7); g.fill(); }); },
};

// ---------------------------------------------------------------
// 虎斑貓（側面、正面、背面、趴、翻肚、喵、蹭）
// ---------------------------------------------------------------
const TC = TAB;
// 側面（朝右）。p: {ph 走路相位, mode:'walk'|'run'|'stand'|'meow'|'rub'|'jump', eye, tail}
function drawCatSide(p) {
  const C = TC, GR = gearNow();
  const mode = p.mode || 'stand';
  const ph = p.ph || 0;
  let bob = 0, bodyRot = 0, headX = 10.5, headY = -19.5, headRot = 0, stretch = 1;
  let legs;   // [遠後, 遠前, 近後, 近前] 角度（弧度，0=垂直，正=往前）
  const swing = Math.sin(ph * Math.PI * 2);
  if (mode === 'walk') {
    const s = 0.42;
    legs = [-swing * s, swing * s, swing * s, -swing * s];
    bob = Math.abs(Math.cos(ph * Math.PI * 2)) * -0.8;
  } else if (mode === 'run') {
    const a = Math.sin(ph * Math.PI * 2), b2 = Math.cos(ph * Math.PI * 2);
    legs = [-0.7 + a * 0.6, 0.6 + a * 0.55, -0.55 + a * 0.6, 0.7 + a * 0.55];
    bob = -1.2 - b2 * 1.2; stretch = 1.08; bodyRot = -a * 0.06; headY = -18.5;
  } else if (mode === 'jump') {
    legs = [-1.0, 1.1, -0.9, 1.2]; stretch = 1.12; bodyRot = -0.18; headY = -21; headX = 11.5;
  } else if (mode === 'rub') {
    legs = [-0.1, 0.12, 0.08, 0.05]; bodyRot = 0.05; headX = 11; headY = -16.5; headRot = 0.35;
  } else {
    legs = [-0.08, 0.08, 0.06, -0.06];
    if (mode === 'meow') { headY = -21; headRot = -0.3; }
  }
  const bx = -1, by = -13.5 + bob;
  const rx = 11.2 * stretch, ry = mode === 'rub' ? 7.4 : 6.6;
  const cs = Math.cos(bodyRot), sn = Math.sin(bodyRot);
  const B = (x, y) => [bx + x * cs - y * sn, by + x * sn + y * cs];
  const hip = B(-6.5, 3.2), sho = B(6.2, 3.4);
  const L = 9.6;
  const leg = (h, a, near) => {
    const fx = h[0] + Math.sin(a) * L, fy = Math.min(-1.3, h[1] + Math.cos(a) * L);
    const col = near ? C.fur : C.furD;
    O.limb(h[0], h[1], fx, fy, 4.1, col);
    const sk = GR && GR.socks ? gearSock(near) : null;   // 肉球消音：襪子
    if (sk) O.limb(lerp(h[0], fx, 0.5), lerp(h[1], fy, 0.5), fx, fy, 4.1, sk.c);
    O.eo(fx + 0.8, fy + 0.2, 2.3, 1.5, sk ? sk.c : near ? C.cream : C.creamS);
    if (sk) O.e(fx + 2.2, fy + 0.25, 0.85, 0.9, sk.toe);
  };
  // 尾巴
  const tsw = Math.sin((p.tail || 0) * Math.PI * 2);
  const base = B(-10.5, -2.2);
  let tp;
  if (mode === 'rub') tp = [base, [base[0] - 3, base[1] - 6], [base[0] - 2.5, base[1] - 13], [base[0] + 0.5 + tsw, base[1] - 18], [base[0] + 3 + tsw, base[1] - 19]];
  else if (mode === 'run' || mode === 'jump') tp = [base, [base[0] - 5, base[1] - 1], [base[0] - 10, base[1] - 3 + tsw], [base[0] - 13, base[1] - 6 + tsw]];
  else tp = [base, [base[0] - 4, base[1] - 3], [base[0] - 6 + tsw * 1.5, base[1] - 9], [base[0] - 4 + tsw * 3, base[1] - 14], [base[0] - 1 + tsw * 3.5, base[1] - 16]];
  O.curve(tp, CM.ink, 5.6);
  O.curve(tp, C.fur, 3.6, { part: 5 });
  for (let i = 1; i < tp.length; i++) { const [x, y] = tp[i], [x0, y0] = tp[i - 1]; const mx = (x + x0) / 2, my = (y + y0) / 2, a = Math.atan2(y - y0, x - x0) + Math.PI / 2; O.curve([[mx - Math.cos(a) * 2, my - Math.sin(a) * 2], [mx + Math.cos(a) * 2, my + Math.sin(a) * 2]], C.stripe, 1.3, { only: 5 }); }
  if (GR && GR.moon) gearTailO(tp[tp.length - 1][0], tp[tp.length - 1][1]);
  // 遠側的腳
  leg(hip, legs[0], false); leg(sho, legs[1], false);
  if (GR) gearSideBody('back', B, rx, ry, GR);
  // 身體
  VXR.ellipse(TOX + bx, TOY + by, rx + 1, ry + 1, CM.ink, { rot: bodyRot });
  VXR.ellipse(TOX + bx, TOY + by, rx, ry, C.fur, { rot: bodyRot, part: 1 });
  { const [x, y] = B(0, -ry * 0.42); VXR.ellipse(TOX + x, TOY + y, rx * 0.86, ry * 0.42, C.furL, { rot: bodyRot, only: 1 }); }
  { const [x, y] = B(1.5, ry * 0.62); VXR.ellipse(TOX + x, TOY + y, rx * 0.75, ry * 0.45, C.cream, { rot: bodyRot, only: 1 }); }
  { const [x, y] = B(0, -ry * 0.92); VXR.ellipse(TOX + x, TOY + y, rx * 0.8, ry * 0.22, C.furD, { rot: bodyRot, only: 1 }); }
  for (let i = 0; i < 6; i++) {
    const u = -rx * 0.75 + i * rx * 0.3, a = B(u, -ry), m = B(u + 1.5, -ry * 0.25), e = B(u + 0.6, ry * 0.2);
    O.curve([a, m, e], C.stripe, 1.35, { only: 1 });
  }
  if (GR) gearSideBody('over', B, rx, ry, GR);
  // 近側的腳
  leg(hip, legs[2], true); leg(sho, legs[3], true);
  // 頭
  const [hx, hy] = [headX + (by + 13.5) * 0, headY + bob];
  drawCatProfileHead(hx + bx + 1, hy, headRot, p);
}
// 側面的頭（朝右）
function drawCatProfileHead(cx, cy, rot, p) {
  const C = TC, cs = Math.cos(rot), sn = Math.sin(rot), GR = gearNow();
  const P = (x, y) => [cx + x * cs - y * sn, cy + x * sn + y * cs];
  const earBack = p.earBack || 0;
  // 遠耳
  O.p([P(-2.5, -5.5), P(-1 - earBack, -12.5), P(3, -6.5)], CM.ink);
  O.p([P(-1.8, -5.8), P(-0.9 - earBack, -11.2), P(2.2, -6.6)], C.furD);
  // 頭（側面：略扁、往前一點的吻部）
  O.eo(P(0, 0)[0], P(0, 0)[1], 7.8, 7.0, C.fur, { rot, part: 2 });
  O.e(P(5.6, 1.6)[0], P(5.6, 1.6)[1], 3.6, 2.9, C.cream, { rot });
  O.e(P(-0.5, -2.8)[0], P(-0.5, -2.8)[1], 6, 3.4, C.furL, { rot, only: 2 });
  // 近耳
  O.p([P(-4.8, -4.2), P(-3.5 - earBack * 1.5, -12.2), P(1.2, -6.4)], CM.ink);
  O.p([P(-4.0, -4.6), P(-3.4 - earBack * 1.5, -10.8), P(0.4, -6.4)], C.fur);
  O.p([P(-3.3, -5.4), P(-3.2 - earBack * 1.5, -9.6), P(-0.6, -6.6)], C.ear);
  // 額頭條紋、臉頰條紋
  for (const [a, b] of [[[-1, -6.6], [0, -3.4]], [[1.5, -6.8], [2, -3.8]], [[-3.5, -5.6], [-2, -3]]]) O.curve([P(...a), P(...b)], C.stripe, 1.2, { only: 2 });
  O.curve([P(-6.5, 0.5), P(-3, 1.4)], C.stripe, 1.1, { only: 2 }); O.curve([P(-6.6, 3), P(-3.4, 3.4)], C.stripe, 1.1, { only: 2 });
  if (GR && GR.mask) gearSideMask(P, GR);
  // 眼睛（夜視：發光的眼睛；戴眼罩：閉眼的線用淺色）
  const eye = p.eye || 'open', EC = gearEyeCol(GR), lc = GR && GR.mask ? MASK_LINE : CM.ink;
  const [ex, ey] = P(3.4, -1.2);
  if (eye === 'open') {
    O.e(ex, ey, 2.15, 2.55, CM.ink, { rot });
    O.e(ex, ey, 1.65, 2.05, EC ? EC.eye : C.eye, { rot, part: 3 });
    O.e(ex + 0.5, ey, 0.75, 1.75, C.pupil, { rot, only: 3 });
    O.dot(ex - 0.5, ey - 1, 0.55, C.white);
  } else if (eye === 'happy') {
    O.curve([[ex - 1.9, ey + 0.6], [ex, ey - 1.2], [ex + 1.9, ey + 0.6]], lc, 1.1);
  } else {
    O.curve([[ex - 1.9, ey - 0.2], [ex, ey + 0.9], [ex + 1.9, ey - 0.2]], lc, 1.1);
  }
  // 鼻子、嘴
  const [nx, ny] = P(8.6, 0.3);
  O.p([[nx - 1.3, ny - 0.6], [nx + 0.4, ny - 0.8], [nx + 0.2, ny + 0.8]], C.nose);
  const open = p.mouth || 0;
  if (open > 0.1) {
    const [mx, my] = P(6.6, 3.4);
    O.e(mx, my, 1.8 + open * 0.5, 0.8 + open * 1.8, CM.ink, { rot });
    O.e(mx, my + 0.2, 1.3 + open * 0.4, 0.4 + open * 1.4, C.mouth, { rot, part: 4 });
    O.e(mx, my + 0.6 + open * 0.6, 1.1, 0.6 + open * 0.6, C.tongue, { rot, only: 4 });
  } else {
    O.curve([P(8.3, 1.4), P(7.6, 2.8), P(6.2, 2.7)], CM.ink, 0.9);
  }
  if (GR) { gearSideNeck(P, GR); gearSideTop(P, GR); }
}
// 正面走路（朝鏡頭）
function drawCatFront(p) {
  const C = TC, ph = p.ph || 0, sw = Math.sin(ph * Math.PI * 2), GR = gearNow();
  const bob = Math.abs(Math.cos(ph * Math.PI * 2)) * -0.7;
  // 尾巴（從後面翹起來）
  const tsw = Math.sin((p.tail || 0) * Math.PI * 2);
  const tp = [[4, -12 + bob], [9, -15], [10.5 + tsw, -21], [8.5 + tsw * 1.5, -25]];
  O.curve(tp, CM.ink, 5.4); O.curve(tp, C.fur, 3.4);
  if (GR && GR.moon) gearTailO(tp[3][0], tp[3][1]);
  if (GR) gearFrontBody('back', bob, GR);
  const skF = GR && GR.socks ? gearSock(false) : null, skN = GR && GR.socks ? gearSock(true) : null;
  // 後腳（兩側露一點）
  for (const s of [-1, 1]) O.eo(s * 6.2, -2.2, 2.6, 2.4, skF ? skF.c : C.furD);
  // 身體
  O.eo(0, -9.5 + bob, 7.2, 7.4, C.fur, { part: 1 });
  O.e(0, -8.5 + bob, 4.4, 6, C.cream, { only: 1 });
  if (GR) gearFrontBody('over', bob, GR);
  // 前腳：一隻抬起來
  const lift = (s) => Math.max(0, s) * 2.2;
  for (const s of [-1, 1]) {
    const up = lift(s * sw);
    O.limb(s * 3, -8 + bob, s * 3.2, -2.2 - up, 3.8, C.fur);
    if (skN) O.limb(s * 3.1, -5.2 + bob * 0.5 - up * 0.5, s * 3.2, -2.2 - up, 3.8, skN.c);
    O.eo(s * 3.3, -1.6 - up, 2.2, 1.6, skN ? skN.c : C.cream);
    if (skN) O.e(s * 3.3, -1.0 - up, 1.1, 0.75, skN.toe);
  }
  drawCatHead(TOX, TOY - 19.5 + bob, Math.sin(ph * Math.PI * 2) * 0.04, 0.5, { eyes: p.eye || 'open', open: p.mouth || 0, look: p.look || 0, earL: p.earL || 0, earR: p.earR || 0 }, null);
}
// 背面走路（離開鏡頭）
function drawCatBack(p) {
  const C = TC, ph = p.ph || 0, sw = Math.sin(ph * Math.PI * 2), GR = gearNow();
  const bob = Math.abs(Math.cos(ph * Math.PI * 2)) * -0.7;
  const sk = GR && GR.socks ? gearSock(true) : null;
  for (const s of [-1, 1]) {
    const up = Math.max(0, s * sw) * 2;
    O.limb(s * 3.5, -7 + bob, s * 3.6, -2 - up, 4, C.furD);
    if (sk) O.limb(s * 3.55, -4.6 + bob * 0.5 - up * 0.5, s * 3.6, -2 - up, 4, sk.c);
    O.eo(s * 3.6, -1.4 - up, 2.1, 1.4, sk ? sk.c : C.furD);
  }
  O.eo(0, -9.5 + bob, 7.4, 7.2, C.fur, { part: 1 });
  O.e(0, -13 + bob, 5.6, 3.4, C.furL, { only: 1 });
  for (let i = 0; i < 4; i++) O.curve([[-5 + i * 3.4, -15.5 + bob], [-4.6 + i * 3.4, -11 + bob], [-5.4 + i * 3.4, -6 + bob]], C.stripe, 1.3, { only: 1 });
  if (GR) gearBackBody('cape', bob, GR);
  // 尾巴往上翹
  const tsw = Math.sin((p.tail || 0) * Math.PI * 2);
  const tp = [[0, -5 + bob], [1 + tsw, -10], [2 + tsw * 2, -16], [0.5 + tsw * 2.5, -21], [-1.5 + tsw * 2, -23]];
  O.curve(tp, CM.ink, 5.6); O.curve(tp, C.fur, 3.6, { part: 6 });
  for (let i = 1; i < tp.length; i++) O.curve([[tp[i][0] - 2, tp[i][1]], [tp[i][0] + 2, tp[i][1]]], C.stripe, 1.2, { only: 6 });
  if (GR && GR.moon) gearTailO(tp[4][0], tp[4][1]);
  if (GR) gearBackBody('over', bob, GR);
  // 頭（背面）
  const hy = -19.5 + bob;
  for (const s of [-1, 1]) { O.p([[s * 1.8, hy - 4.5], [s * 7.6, hy - 14], [s * 8.9, hy - 1.5]], CM.ink); O.p([[s * 2.7, hy - 4.8], [s * 7.3, hy - 12.4], [s * 8.0, hy - 2.2]], C.fur); O.p([[s * 4.6, hy - 5.4], [s * 7.0, hy - 10.6], [s * 7.4, hy - 4]], C.furD); }
  O.eo(0, hy, 8.2, 7.2, C.fur, { part: 2 });
  O.e(0, hy - 3, 6.2, 3.2, C.furL, { only: 2 });
  for (const x of [-3.4, 0, 3.4]) O.curve([[x, hy - 6.8], [x * 1.15, hy - 0.5]], C.stripe, 1.35, { only: 2 });
  for (const s of [-1, 1]) O.curve([[s * 7.6, hy + 1], [s * 4.8, hy + 2.4]], C.stripe, 1.2, { only: 2 });
  if (GR) gearBackBody('head', bob, GR);
}
// 母雞蹲（正面）
function drawCatLoaf(p) {
  const C = TC, GR = gearNow();
  const tp = [[-8.5, -2.2], [-3, -0.8], [4, -0.9], [9, -2.4]];
  if (GR) gearLoafBody('back', GR);
  O.e(0, -6.4, 10.4, 6.8, CM.ink); O.e(0, -6.4, 9.4, 5.8, C.fur, { part: 1 });
  O.e(0, -9.6, 7.8, 2.8, C.furL, { only: 1 });
  for (const x of [-7, -4.5, 4.5, 7]) O.curve([[x, -11.2], [x + 0.5, -7], [x - 0.2, -3]], C.stripe, 1.2, { only: 1 });
  O.e(0, -5.4, 4.2, 4.6, C.cream);
  if (GR) gearLoafBody('over', GR);
  O.curve(tp, CM.ink, 4.8); O.curve(tp, C.fur, 2.9);
  if (GR && GR.moon) gearTailO(tp[3][0], tp[3][1], true);
  const sk = GR && GR.socks ? gearSock(true) : null;
  for (const s of [-1, 1]) { O.eo(s * 2.6, -1.4, 2.4, 1.4, sk ? sk.c : C.cream); if (sk) O.e(s * 2.6, -0.9, 1.2, 0.6, sk.toe); }
  // 睡覺：頭低一點、耳朵往後；舔毛：一隻前腳舉到嘴邊、舌頭吐出來
  const hy = p.sleep ? -15 : -16.5;
  drawCatHead(TOX + (p.lick ? -0.6 : 0), TOY + hy, p.lick ? -0.12 : p.sleep ? 0.06 : 0, 0.52, { eyes: p.eye || 'open', open: p.mouth || 0, look: p.look || 0, earL: p.earL || (p.sleep ? 0.25 : 0), earR: p.earR || (p.sleep ? -0.25 : 0), blep: !!p.lick }, null);
  if (p.lick) { O.limb(2.6, -4, 3.2, -10.5, 3.4, C.fur); O.eo(3.4, -11.2, 2.3, 1.9, C.cream); }
}

// 翻肚（場景裡）：四腳朝天、頭倒過來，像影片裡那樣
function drawCatBellyWorld(f) {
  const C = TC, w = Math.sin(f * Math.PI * 2), w2 = Math.cos(f * Math.PI * 2), GR = gearNow();
  const skF = GR && GR.socks ? gearSock(false) : null, skN = GR && GR.socks ? gearSock(true) : null;
  const tp = [[11, -5], [16, -6.5], [18.5 + w * 1.5, -11], [16.5 + w * 2, -14.5]];
  O.curve(tp, CM.ink, 5.4); O.curve(tp, C.fur, 3.4, { part: 5 });
  for (let i = 1; i < tp.length; i++) O.curve([[tp[i][0] - 1.8, tp[i][1] - 1], [tp[i][0] + 1.8, tp[i][1] + 1]], C.stripe, 1.2, { only: 5 });
  if (GR && GR.moon) gearTailO(tp[3][0], tp[3][1]);
  // 遠側的腳
  O.limb(7, -9, 10 + w, -17.5, 3.8, C.furD); O.eo(10.4 + w, -18.6, 2.2, 1.7, skF ? skF.c : C.creamS);
  O.limb(-3.5, -9.5, -6 - w2, -17, 3.8, C.furD); O.eo(-6.4 - w2, -18, 2.2, 1.7, skF ? skF.c : C.creamS);
  // 身體（肚子朝上）
  VXR.ellipse(TOX + 2, TOY - 6.6, 13, 7, CM.ink); VXR.ellipse(TOX + 2, TOY - 6.6, 12, 6, C.fur, { part: 1 });
  O.e(2, -9.4, 10, 3.8, C.cream, { only: 1 });
  for (const x of [-7, -3, 1, 5, 9]) O.curve([[x, -3.6], [x + 0.8, -1.2]], C.stripe, 1.2, { only: 1 });
  for (const [x, y] of [[-1, -9], [3, -9.6], [7, -9]]) O.dot(x, y, 0.55, C.creamS);
  // 近側的腳
  O.limb(9, -8.5, 13 - w, -15.5, 3.9, C.fur); O.eo(13.4 - w, -16.6, 2.3, 1.8, skN ? skN.c : C.cream);
  O.limb(-1, -9.5, 0.5 + w2 * 1.5, -17.8, 3.9, C.fur); O.eo(0.7 + w2 * 1.5, -19, 2.3, 1.8, skN ? skN.c : C.cream);
  // 頭倒過來
  drawCatHead(TOX - 12.5, TOY - 11, Math.PI * 0.88 + w * 0.06, 0.47, { eyes: f > 0.6 && f < 0.75 ? 'blink' : 'open', look: -0.5, open: f > 0.2 && f < 0.45 ? 0.6 : 0 }, null);
}

// 依照 Cat 物件的狀態拿圖；gear 不給就用玩家的升級配件（快取名稱會加上配件組合）
function toonCat(c, gear) {
  const g = gear !== undefined ? gear : catGearFor(G.run);
  const oldP = TOON_PREFIX, oldG = CAT_GEAR;
  TOON_PREFIX = oldP + gearKeyOf(g); CAT_GEAR = g;
  try { return toonCatBase(c); } finally { TOON_PREFIX = oldP; CAT_GEAR = oldG; }
}
function toonCatBase(c) {
  const side = c.dir === 'left' || c.dir === 'right';
  const flip = c.dir === 'left';
  const tailPh = (c.t * 0.7) % 1;
  const tq = Math.floor(tailPh * 6) / 6;
  let key, draw, w = 54, h = 40, ax = 0.5;
  const loaf = c.pose === 'loaf' || (!c.moving && (c.idleT || 0) > 1.8 && !c.pose);
  if (c.pose === 'belly') {
    const f = Math.floor(c.t * 4) % 6;
    return toonFrameInfo(toonFrame('cat-belly-' + f, 50, 30, () => drawCatBellyWorld(f / 6)), flip, 0.5, CAT_SC);
  }
  if (c.pose === 'meow') { key = 'cat-meow-' + (Math.floor(c.t * 3) % 2); draw = () => drawCatSide({ mode: 'meow', mouth: Math.floor(c.t * 3) % 2 ? 0.9 : 0.4, tail: 0.25 }); }
  else if (c.pose === 'rub') { const f = Math.floor(c.t * 4) % 3; key = 'cat-rub-' + f; draw = () => drawCatSide({ mode: 'rub', eye: 'happy', tail: f / 3 }); }
  else if (c.jump) { key = 'cat-jump'; draw = () => drawCatSide({ mode: 'jump', earBack: 1 }); if (!side) { return toonFrameInfo(toonFrame(key, w, h, draw), c.jump.x1 < c.jump.x0, 0.5, CAT_SC); } }
  else if (loaf) {
    const act = c.act || 'none';
    key = 'cat-loaf-' + act;
    const opt = { lookL: { look: -1 }, lookR: { look: 1 }, blink: { eye: 'blink' }, ear: { earL: -0.4 }, yawn: { eye: 'blink', mouth: 1 }, meow: { mouth: 0.75 }, lick: { eye: 'blink', lick: true }, sleep: { eye: 'blink', sleep: true }, none: {} }[act] || {};
    return toonFrameInfo(toonFrame(key, 40, 34, () => drawCatLoaf(opt)), false, 0.5, CAT_SC);
  }
  else if (c.moving && side) {
    if (c.running) { const f = Math.floor(c.t * 12) % 6; key = 'cat-run-' + f; draw = () => drawCatSide({ mode: 'run', ph: f / 6, tail: f / 6, earBack: 0.6 }); }
    else { const f = Math.floor(c.t * 10) % 8; key = 'cat-walk-' + f; draw = () => drawCatSide({ mode: 'walk', ph: f / 8, tail: tq }); }
  }
  else if (c.moving && c.dir === 'down') { const f = Math.floor(c.t * (c.running ? 12 : 8)) % 4; key = 'cat-front-' + f + (c.carry.length ? 'm' : ''); return toonFrameInfo(toonFrame(key, 36, 38, () => drawCatFront({ ph: f / 4, tail: f / 4 })), false, 0.5, CAT_SC); }
  else if (c.moving && c.dir === 'up') { const f = Math.floor(c.t * (c.running ? 12 : 8)) % 4; key = 'cat-back-' + f; return toonFrameInfo(toonFrame(key, 36, 38, () => drawCatBack({ ph: f / 4, tail: f / 4 })), false, 0.5, CAT_SC); }
  else if (c.dir === 'down') { key = 'cat-front-idle' + (c.act === 'blink' ? 'b' : ''); return toonFrameInfo(toonFrame(key, 36, 38, () => drawCatFront({ ph: 0.25, eye: c.act === 'blink' ? 'blink' : 'open' })), false, 0.5, CAT_SC); }
  else if (c.dir === 'up') { key = 'cat-back-idle'; return toonFrameInfo(toonFrame(key, 36, 38, () => drawCatBack({ ph: 0.25 })), false, 0.5, CAT_SC); }
  else { key = 'cat-stand-' + tq.toFixed(2) + (c.act === 'blink' ? 'b' : ''); draw = () => drawCatSide({ mode: 'stand', tail: tq, eye: c.act === 'blink' ? 'blink' : 'open' }); }
  return toonFrameInfo(toonFrame(key, w, h, draw), flip, ax, CAT_SC);
}
function toonFrameInfo(cv, flip, ax = 0.5, sc = 1) {
  const pad = cv.__pad;
  return { img: cv, w: (cv.__lw + pad * 2) / TU * sc, h: (cv.__lh + pad * 2) / TU * sc, flip, foot: pad / TU * sc, ax };
}
const CAT_SC = 0.94;
const BELLY_CACHE = {};
function bellyFrame(t, key) {
  if (BELLY_CACHE[key]) return BELLY_CACHE[key];
  const a = drawBellyArt(t, VXR, 1.5);
  const c = makeCanvas(a.width, a.height); c.getContext('2d').drawImage(a, 0, 0);
  BELLY_CACHE[key] = c; return c;
}

// ---------------------------------------------------------------
// 鄰居們
// ---------------------------------------------------------------
const PEOPLE = {
  meiling: { skin: '#f7d1b0', hair: '#4a2e26', hairStyle: 'pony', shirt: '#f28aa0', clothes: 'apron', extra: '#5fb36c', pants: '#3d3f5a', shoes: '#c9405a', blush: true },
  wang: { skin: '#f4cba8', hair: '#6a3f7a', hairStyle: 'perm', shirt: '#e2557f', clothes: 'blouse', pants: '#3a3550', shoes: '#7a2b3b', blush: true, pearls: true, glasses: true },
  lin: { skin: '#eec39e', hair: '#1f1d29', hairStyle: 'short', shirt: '#3f84d6', clothes: 'polo', pants: '#c7a76c', shoes: '#4a3a2a' },
  bo: { skin: '#e9b48e', hair: '#d9d9e0', hairStyle: 'bald', shirt: '#f7f7f2', clothes: 'tank', pants: '#3b5fb4', shoes: '#4a7be0', slippers: true, brows: true, flashlight: true },
  chief: { skin: '#eab995', hair: '#c9c9d2', hairStyle: 'cap', cap: '#2f6f4f', shirt: '#8a6a4a', clothes: 'vest', extra: '#d7f23c', pants: '#3a3a4a', shoes: '#2a2a36', flashlight: true },
  patrol: { skin: '#eab995', hair: '#26222e', hairStyle: 'cap', cap: '#2d3b66', shirt: '#2d3b66', clothes: 'vest', extra: '#d7f23c', pants: '#2a2f45', shoes: '#1f1f2a', flashlight: true },
  butler: { skin: '#f0c7a4', hair: '#1c1a24', hairStyle: 'slick', shirt: '#25252e', clothes: 'suit', pants: '#22222c', shoes: '#111118', mustache: true, gloves: true },
  cust1: { skin: '#f6cfac', hair: '#7a4e2a', hairStyle: 'pony', shirt: '#f0b44a', clothes: 'plain', pants: '#3a4a7a', shoes: '#f4f4f0', blush: true },
  cust2: { skin: '#e8b994', hair: '#3a2a20', hairStyle: 'short', shirt: '#7cc28a', clothes: 'plain', pants: '#55506a', shoes: '#3a2a20' },
  // 白天上門買花的客人
  shopA: { skin: '#f6d2b4', hair: '#2a2230', hairStyle: 'short', shirt: '#f4f4f0', clothes: 'polo', pants: '#2f3f7a', shoes: '#2a2a36' },
  shopB: { skin: '#f3cdb0', hair: '#5a3a2a', hairStyle: 'pony', shirt: '#9fc0e8', clothes: 'blouse', pants: '#3a3a4a', shoes: '#2a2230', blush: true },
  shopC: { skin: '#efc4a0', hair: '#e6e2ea', hairStyle: 'perm', shirt: '#e86a8a', clothes: 'blouse', pants: '#5a4a6a', shoes: '#4a3a3a', glasses: true },
  shopD: { skin: '#e8b892', hair: '#2a2230', hairStyle: 'cap', cap: '#e8394d', shirt: '#4a4a5a', clothes: 'plain', pants: '#3a5a8a', shoes: '#f4f4f0' },
  shopE: { skin: '#f4cfae', hair: '#3a2420', hairStyle: 'pony', shirt: '#ffd27a', clothes: 'plain', pants: '#6a8ab0', shoes: '#c9405a', blush: true },
  shopF: { skin: '#e2ad86', hair: '#3a3440', hairStyle: 'short', shirt: '#5fa86a', clothes: 'polo', pants: '#4a4a4a', shoes: '#3a2a2a' },
};
// view: 'down'|'up'|'right'；ph 走路相位（null = 站著）；talk 張嘴
function drawPerson(spec, view, ph, o = {}) {
  const S = spec;
  const walking = ph !== null && ph !== undefined;
  const sw = walking ? Math.sin(ph * Math.PI * 2) : 0;
  const bob = walking ? -Math.abs(Math.cos(ph * Math.PI * 2)) * 1.1 : (o.breath ? -0.5 : 0);
  const hunch = S.hairStyle === 'bald' ? 1.2 : 0;
  const side = view === 'right';
  const hipY = -15 + bob, shY = -31 + bob + hunch * 0.6, headY = -41 + bob + hunch;
  const shirtD = shade(S.shirt, -0.22);
  // ---- 腿 ----
  const legW = 5.2;
  const pantsCol = S.clothes === 'tank' ? S.pants : S.pants;
  const leg = (x0, a, near, liftF) => {
    const len = S.clothes === 'tank' ? 11 : 12.5;
    const fx = x0 + Math.sin(a) * len, fy = Math.min(-1.8, hipY + Math.cos(a) * len - (liftF || 0));
    if (S.clothes === 'tank') {
      // 短褲 + 小腿
      const kx = x0 + Math.sin(a) * 5, ky = hipY + Math.cos(a) * 5;
      O.limb(kx, ky, fx, fy, 3.8, near ? S.skin : shade(S.skin, -0.15));
      O.limb(x0, hipY - 0.5, kx, ky, legW + 0.6, near ? S.pants : shade(S.pants, -0.2));
    } else O.limb(x0, hipY, fx, fy, legW, near ? pantsCol : shade(pantsCol, -0.2));
    // 鞋子
    if (S.slippers) { O.eo(fx + (side ? 1.2 : 0), fy + 0.6, 3.6, 1.4, '#3f6fd0'); O.e(fx + (side ? 1.2 : 0), fy + 0.2, 2.6, 0.6, '#ffffff'); }
    else O.eo(fx + (side ? 1.5 : 0), fy + 0.4, side ? 3.9 : 3.3, 2.0, near ? S.shoes : shade(S.shoes, -0.2));
  };
  if (side) { leg(-0.5, -sw * 0.45, false); }
  else {
    const l1 = walking ? Math.max(0, sw) * 2.4 : 0, l2 = walking ? Math.max(0, -sw) * 2.4 : 0;
    leg(-3.4, 0, true, l1); leg(3.4, 0, true, l2);
  }
  // ---- 遠側手臂（側面）----
  const armLen = 12;
  const arm = (x0, y0, a, near, hold) => {
    const hx = x0 + Math.sin(a) * armLen, hy = y0 + Math.cos(a) * armLen;
    const sleeve = S.clothes === 'tank' ? null : (near ? S.shirt : shirtD);
    if (sleeve) {
      const mx = x0 + Math.sin(a) * 6, my = y0 + Math.cos(a) * 6;
      O.limb(mx, my, hx, hy, 3.4, near ? S.skin : shade(S.skin, -0.15));
      O.limb(x0, y0, mx, my, 4.6, sleeve);
      if (S.clothes === 'suit') O.limb(mx, my, mx + Math.sin(a) * 0.5, my + Math.cos(a) * 0.5, 4.6, '#ffffff', { noOutline: true });
    } else O.limb(x0, y0, hx, hy, 3.6, near ? S.skin : shade(S.skin, -0.15));
    O.eo(hx, hy + 0.6, 2.2, 2.2, S.gloves ? '#f4f4f0' : (near ? S.skin : shade(S.skin, -0.15)));
    if (hold === 'flash') {
      O.limb(hx, hy + 1, hx + (side ? 4.5 : 1.5), hy + 2.5, 2.8, '#3a3f52');
      O.eo(hx + (side ? 5.6 : 2), hy + 2.8, 1.8, 1.8, '#ffe58a');
    }
  };
  const flash = o.night && S.flashlight;
  if (side) arm(-0.5, shY + 2, sw * 0.5, false);
  // ---- 身體 ----
  const tw = side ? 11 : 15.5, tb = side ? 11.5 : 16.5;
  const top = shY, bot = hipY + 1.2;
  if (S.clothes === 'tank') {
    // 背心：露出肩膀
    O.blobO([[-tw / 2, top + 2], [-tw / 2 + 2, top], [tw / 2 - 2, top], [tw / 2, top + 2], [tb / 2, bot], [-tb / 2, bot]], S.skin);
    O.blobO([[-tw / 2 + 2.6, top + 1.5], [-tw / 2 + 4, top], [tw / 2 - 4, top], [tw / 2 - 2.6, top + 1.5], [tb / 2 - 0.5, bot], [-tb / 2 + 0.5, bot]], S.shirt);
  } else {
    O.blobO([[-tw / 2, top + 1.5], [-tw / 2 + 2.5, top - 0.5], [tw / 2 - 2.5, top - 0.5], [tw / 2, top + 1.5], [tb / 2, bot], [0, bot + 0.6], [-tb / 2, bot]], S.shirt, { part: 7 });
    O.e(side ? 2.5 : tw * 0.28, (top + bot) / 2 + 2, tw * 0.35, (bot - top) * 0.55, shirtD, { only: 7 });
  }
  if (!side && S.clothes === 'apron') {
    O.blobO([[-5.6, top + 3.5], [5.6, top + 3.5], [6.8, bot + 2.5], [-6.8, bot + 2.5]], S.extra);
    O.e(0, top + 10, 2.6, 1.8, shade(S.extra, -0.2));
    O.curve([[-5.4, top + 3.5], [-6.5, top - 0.2]], CM.ink, 1.3); O.curve([[5.4, top + 3.5], [6.5, top - 0.2]], CM.ink, 1.3);
  }
  if (side && S.clothes === 'apron') O.blobO([[2.5, top + 4], [6, top + 4], [6.6, bot + 2.5], [3, bot + 2.5]], S.extra);
  if (S.clothes === 'vest') {
    if (!side) { O.blobO([[-tw / 2 + 0.5, top + 1.5], [-2, top + 1], [-2.5, bot], [-tb / 2 + 0.5, bot]], '#ff8a2a'); O.blobO([[tw / 2 - 0.5, top + 1.5], [2, top + 1], [2.5, bot], [tb / 2 - 0.5, bot]], '#ff8a2a'); }
    else O.blobO([[-tw / 2 + 0.5, top + 1.5], [tw / 2 - 0.5, top + 1.5], [tb / 2 - 0.5, bot], [-tb / 2 + 0.5, bot]], '#ff8a2a');
    O.limb(-tb / 2 + 1, bot - 5, tb / 2 - 1, bot - 5, 1.6, S.extra, { noOutline: true });
    O.limb(-tb / 2 + 1, bot - 2.4, tb / 2 - 1, bot - 2.4, 1.6, S.extra, { noOutline: true });
  }
  if (S.clothes === 'suit' && !side && view === 'down') {
    O.p([[-2.6, top + 0.5], [2.6, top + 0.5], [0, top + 7]], '#ffffff');
    O.p([[-0.9, top + 1.5], [0.9, top + 1.5], [1.2, top + 8], [0, top + 9.5], [-1.2, top + 8]], '#d63a4a');
    O.curve([[-2.6, top + 0.5], [0, top + 7], [2.6, top + 0.5]], CM.ink, 1);
  }
  if (S.clothes === 'polo' && view === 'down') { O.p([[-2.8, top], [0, top + 3], [2.8, top], [0, top + 1.2]], '#ffffff'); }
  if (S.pearls && view === 'down') for (let i = 0; i < 7; i++) { const a = Math.PI * (0.15 + i / 6 * 0.7); O.dot(Math.cos(a) * 3.6, top + 0.6 + Math.sin(a) * 2.4, 0.9, '#fff8ee'); }
  // ---- 近側手臂 ----
  if (side) arm(0.5, shY + 2, -sw * 0.5, true, flash ? 'flash' : null);
  else {
    arm(-tw / 2 - 0.6, shY + 2, -0.16 + (walking ? sw * 0.08 : 0), true, null);
    arm(tw / 2 + 0.6, shY + 2, 0.16 + (walking ? sw * 0.08 : 0), true, flash ? 'flash' : null);
  }
  // ---- 頭 ----
  drawPersonHead(S, view, headY, o);
}
function drawPersonHead(S, view, hy, o) {
  const side = view === 'right', back = view === 'up';
  const R = 9.6, hx = side ? 0.8 : 0;
  const hairD = shade(S.hair, -0.25);
  // 後面的頭髮（馬尾、捲髮）
  if (S.hairStyle === 'pony') {
    const px = side ? -9 : back ? 0 : 0;
    if (side || back) { O.blobO([[px - 2.5, hy - 2], [px + 2.5, hy - 2], [px + 3.4, hy + 8], [px, hy + 12], [px - 3.4, hy + 8]], S.hair); }
  }
  if (S.hairStyle === 'perm') {
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.9 + i / 8 * 1.2); O.eo(hx + Math.cos(a) * 9.5, hy - 1 + Math.sin(a) * 9, 4, 4, S.hair); }
  }
  // 耳朵
  if (!back) for (const s of side ? [-1] : [-1, 1]) O.eo(hx + s * (side ? 3 : R - 0.2), hy + 1, 1.7, 2.2, S.skin);
  // 臉
  O.eo(hx, hy, R, R * 0.98, back && S.hairStyle !== 'bald' ? S.hair : S.skin, { part: 8 });
  if (!back) O.e(hx + (side ? 2.5 : 0), hy + 3.5, R * 0.75, R * 0.55, shade(S.skin, 0.06), { only: 8 });
  // 頭髮
  const style = S.hairStyle;
  if (back) {
    if (style === 'bald') { O.e(hx, hy - 4.5, R * 0.55, R * 0.32, shade(S.skin, 0.18), { only: 8 }); O.e(hx, hy + 4.2, R * 1.05, 4.2, S.hair, { only: 8 }); for (const s2 of [-1, 1]) O.eo(hx + s2 * (R - 0.2), hy + 1, 1.7, 2.2, S.skin); }
    else if (style === 'cap') { O.e(hx, hy - 3, R + 0.5, 6.5, S.cap, { only: 8 }); }
    else { O.e(hx, hy - 2, R * 0.9, R * 0.8, hairD, { only: 8 }); for (const x of [-4, 0, 4]) O.curve([[x, hy - 7], [x * 1.1, hy + 4]], shade(S.hair, -0.4), 0.9, { only: 8 }); }
    if (style === 'pony') { O.eo(hx, hy + 2.5, 2.4, 1.6, '#ff8fae'); }
  } else if (style === 'short' || style === 'slick') {
    O.blobO(side
      ? [[-9.2, hy + 1], [-9.6, hy - 6], [-4, hy - 10.8], [4, hy - 10.5], [9, hy - 5.6], [6, hy - 6.6], [1, hy - 5.8], [-3, hy - 3.6], [-5.4, hy + 2]]
      : [[-9.8, hy + 1], [-9.6, hy - 6], [-4, hy - 10.6], [4, hy - 10.6], [9.6, hy - 6], [9.8, hy + 1], [7.6, hy - 4], [2, hy - 6.2], [-4, hy - 4.8], [-7.6, hy - 3]], S.hair);
    if (style === 'slick') O.curve(side ? [[-6, hy - 7], [2, hy - 8.6], [7, hy - 6.4]] : [[-6, hy - 8], [0, hy - 9], [6, hy - 8]], '#5a5868', 1);
  } else if (style === 'pony') {
    O.blobO(side
      ? [[-9.4, hy + 3], [-9.8, hy - 6], [-4, hy - 10.8], [4, hy - 10.4], [9.2, hy - 5], [5, hy - 6], [0, hy - 4.6], [-4, hy - 2], [-6, hy + 4]]
      : [[-9.8, hy + 3], [-9.6, hy - 6], [-4, hy - 10.6], [4, hy - 10.6], [9.6, hy - 6], [9.8, hy + 3], [8, hy - 2], [4.5, hy - 6], [0, hy - 4.2], [-4.5, hy - 6], [-8, hy - 2]], S.hair);
    O.eo(side ? -7.5 : 6.8, hy - 6.5, 1.8, 1.4, '#ff8fae');
  } else if (style === 'perm') {
    O.blobO(side
      ? [[-9.6, hy + 1], [-9, hy - 8], [-2, hy - 11.4], [5, hy - 10.4], [9.6, hy - 5], [6, hy - 5.2], [2, hy - 6.8], [-3, hy - 4]]
      : [[-10.2, hy + 1], [-9.4, hy - 8], [-3, hy - 11.6], [3, hy - 11.6], [9.4, hy - 8], [10.2, hy + 1], [7.4, hy - 4.6], [3, hy - 7], [-3, hy - 7], [-7.4, hy - 4.6]], S.hair);
    for (let i = 0; i < 5; i++) O.curve([[-6 + i * 3, hy - 9], [-5 + i * 3, hy - 7.6]], shade(S.hair, 0.25), 1.1);
  } else if (style === 'bald') {
    O.e(hx + (side ? -3 : 0), hy - 6.5, side ? 4.5 : 6, 2.4, shade(S.skin, 0.18), { only: 8 });
    for (const s of side ? [-1] : [-1, 1]) O.blobO([[hx + s * 9.8, hy - 2], [hx + s * 10.3, hy + 3], [hx + s * 7.6, hy + 4], [hx + s * 7.2, hy - 1.6]], S.hair);
  } else if (style === 'cap') {
    O.blobO(side
      ? [[-9.6, hy - 2], [-8.4, hy - 9], [0, hy - 12], [7, hy - 8.4], [8, hy - 3.6], [-6, hy - 3.6]]
      : [[-9.8, hy - 2.6], [-8.6, hy - 9.4], [0, hy - 12], [8.6, hy - 9.4], [9.8, hy - 2.6]], S.cap);
    if (side) O.blobO([[5, hy - 4.6], [13.4, hy - 3.4], [13, hy - 2], [5, hy - 2.6]], shade(S.cap, -0.15));
    else O.blobO([[-8.4, hy - 3.8], [8.4, hy - 3.8], [9.6, hy - 1.2], [-9.6, hy - 1.2]], shade(S.cap, -0.15));
    O.e(side ? 0 : 0, hy - 8, 2.6, 1.8, '#ffd84d');
    O.blob(side ? [[-9.4, hy - 1.8], [-6, hy - 1.6], [-6.2, hy + 3], [-9.4, hy + 2]] : [[-9.6, hy - 1], [-7.2, hy - 1], [-7.4, hy + 2.4], [-9.6, hy + 2]], S.hair);
    if (!side) O.blob([[9.6, hy - 1], [7.2, hy - 1], [7.4, hy + 2.4], [9.6, hy + 2]], S.hair);
  }
  if (back) return;
  // 五官
  const eyeY = hy + 1.6;
  const ex = side ? [5.2] : [-3.9, 3.9];
  const blink = o.blink;
  for (const x of ex) {
    if (blink) O.curve([[x - 1.5, eyeY], [x + 1.5, eyeY]], CM.ink, 1);
    else { O.e(x, eyeY, 1.35, 1.9, CM.ink); O.dot(x - 0.4, eyeY - 0.8, 0.5, '#ffffff'); }
    if (S.brows) O.curve([[x - 2, eyeY - 3.6], [x + 1.6, eyeY - 3.2]], '#d9d9e0', 1.4);
  }
  if (S.glasses) {
    for (const x of ex) VXR.shape({}, g => { g.strokeStyle = '#b8862e'; g.lineWidth = 0.9; g.beginPath(); g.arc(TOX + x, TOY + eyeY, 2.8, 0, 7); g.stroke(); });
    if (!side) O.curve([[-1.1, eyeY], [1.1, eyeY]], '#b8862e', 0.9);
  }
  if (S.blush) for (const x of side ? [3.4] : [-6.2, 6.2]) O.e(x, hy + 5.2, 1.9, 1.1, 'rgba(255,120,140,0.55)');
  if (side) O.curve([[9.4, hy + 2], [10.6, hy + 4], [9.2, hy + 4.8]], CM.ink, 0.9);
  const mx = side ? 6.8 : 0, my = hy + 6.6;
  if (S.mustache) O.blob(side ? [[mx - 1, my - 1.6], [mx + 3.2, my - 1.4], [mx + 3, my - 0.4], [mx - 0.6, my - 0.6]] : [[-3.6, my - 1.4], [0, my - 2.2], [3.6, my - 1.4], [3, my - 0.4], [0, my - 1], [-3, my - 0.4]], S.hair);
  if (o.talk) { O.e(mx, my, 1.6, 1.3, CM.ink); O.e(mx, my + 0.3, 1.0, 0.7, '#e06a7a'); }
  else O.curve(side ? [[mx - 1, my - 0.4], [mx + 0.6, my + 0.4], [mx + 1.8, my - 0.2]] : [[mx - 1.6, my - 0.3], [mx, my + 0.8], [mx + 1.6, my - 0.3]], CM.ink, 0.9);
}
function toonHuman(h, night) {
  const spec = PEOPLE[h.key] || PEOPLE.lin;
  const view = h.dir === 'left' || h.dir === 'right' ? 'right' : h.dir;
  const flip = h.dir === 'left';
  const walking = h.moving;
  const f = walking ? Math.floor(h.t * 9) % 6 : -1;
  const talk = h.bubble && Math.floor(h.t * 7) % 2 === 0;
  const blink = !walking && (h.t % 3.1) < 0.12;
  const fl = night && spec.flashlight ? 'n' : '';
  const key = `h-${h.key}-${view}-${f}-${talk ? 1 : 0}${blink ? 'b' : ''}${fl}`;
  const cv = toonFrame(key, 40, 58, () => drawPerson(spec, view, walking ? f / 6 : null, { talk, blink, night: !!fl }));
  return toonFrameInfo(cv, flip, 0.5, 1.06);
}

// ---------------------------------------------------------------
// 小柴
// ---------------------------------------------------------------
const SHIBA = { fur: '#e2964e', furD: '#b86f30', cream: '#fff1dc', nose: '#2a1d22' };
function drawShiba(p) {
  const C = SHIBA, mode = p.mode || 'stand', ph = p.ph || 0;
  if (mode === 'sleep') {
    O.eo(0, -6.5, 11.5, 6.6, C.fur, { part: 1 });
    O.e(0, -4, 9, 3.6, C.cream, { only: 1 });
    // 捲尾巴蓋住鼻子
    O.eo(-6.5, -6, 4.6, 3.6, C.fur); O.e(-6.5, -6, 2.4, 1.6, C.cream);
    O.eo(6.5, -7.5, 5.5, 4.6, C.fur, { part: 2 }); O.e(8, -6, 3.4, 2.4, C.cream, { only: 2 });
    O.p([[3.5, -10.5], [4.6, -15], [7.2, -11.2]], CM.ink); O.p([[4.2, -11], [4.8, -13.8], [6.4, -11.4]], C.furD);
    O.curve([[6.2, -8.4], [7.6, -7.6], [9, -8.4]], CM.ink, 1);
    O.dot(11, -6.6, 1, C.nose);
    return;
  }
  const sw = Math.sin(ph * Math.PI * 2);
  const bob = mode === 'walk' ? -Math.abs(Math.cos(ph * Math.PI * 2)) * 0.8 : (mode === 'bark' ? -Math.abs(sw) * 1.5 : 0);
  const legs = mode === 'walk' ? [-sw * 0.45, sw * 0.45, sw * 0.45, -sw * 0.45] : [0, 0, 0, 0];
  const by = -10 + bob;
  const leg = (x, a, near) => { const fx = x + Math.sin(a) * 7, fy = Math.min(-1.2, by + 3 + Math.cos(a) * 7); O.limb(x, by + 3, fx, fy, 3.6, near ? C.fur : C.furD); O.eo(fx + 0.6, fy + 0.2, 2, 1.3, C.cream); };
  // 捲尾巴
  O.eo(-8.5, by - 6, 4.2, 4.2, C.fur, { part: 3 }); O.e(-8.5, by - 6, 2.2, 2.2, C.cream, { only: 3 });
  leg(-5.5, legs[0], false); leg(5, legs[1], false);
  O.eo(0, by, 9.4, 5.4, C.fur, { part: 1 });
  O.e(1, by + 2.8, 7, 2.6, C.cream, { only: 1 });
  O.e(-1, by - 3, 7, 2, shade(C.fur, 0.15), { only: 1 });
  leg(-5, legs[2], true); leg(5.5, legs[3], true);
  // 頭
  const hx = 9.2, hy = by - 6;
  O.p([[hx - 4.6, hy - 2.5], [hx - 3.4, hy - 10.4], [hx + 0.2, hy - 4]], CM.ink); O.p([[hx - 4, hy - 3], [hx - 3.3, hy - 9], [hx - 0.6, hy - 4]], C.fur);
  O.eo(hx, hy, 5.8, 5.2, C.fur, { part: 2 });
  O.e(hx + 2.4, hy + 2, 4, 2.8, C.cream, { only: 2 });
  O.p([[hx - 1.6, hy - 3.4], [hx - 0.2, hy - 10.6], [hx + 2.8, hy - 3.6]], CM.ink); O.p([[hx - 1, hy - 3.8], [hx - 0.1, hy - 9.2], [hx + 2.1, hy - 4]], C.fur); O.p([[hx - 0.4, hy - 4.2], [hx, hy - 8], [hx + 1.4, hy - 4.4]], '#f2a28a');
  O.eo(hx + 5.4, hy + 0.8, 2.8, 2.2, C.cream);
  O.dot(hx + 7.6, hy + 0.2, 1.2, C.nose);
  O.e(hx + 1.6, hy - 0.8, 1.05, 1.35, CM.ink); O.dot(hx + 1.3, hy - 1.3, 0.4, '#fff');
  O.e(hx + 0.5, hy - 2.8, 1.1, 0.5, C.cream);
  if (mode === 'bark') { O.e(hx + 5.4, hy + 3.1, 2.2, 1.4, CM.ink); O.e(hx + 5.4, hy + 3.4, 1.4, 0.8, '#e86a7a'); }
  else O.curve([[hx + 4, hy + 2.6], [hx + 5.4, hy + 3.2], [hx + 6.8, hy + 2.6]], CM.ink, 0.8);
  // 項圈
  O.limb(hx - 3.8, hy + 2.8, hx - 1.4, hy + 4.6, 1.7, '#e94a5a', { noOutline: true });
}
function toonDog(d) {
  const flip = d.dir === 'left';
  let key, p;
  if (d.state === 'sleep') { key = 'dog-sleep'; p = { mode: 'sleep' }; }
  else if (d.barkT > 0) { const f = Math.floor(d.t * 10) % 2; key = 'dog-bark-' + f; p = { mode: 'bark', ph: f / 2 }; }
  else if (d.moving) { const f = Math.floor(d.t * 12) % 6; key = 'dog-walk-' + f; p = { mode: 'walk', ph: f / 6 }; }
  else { key = 'dog-stand'; p = { mode: 'stand' }; }
  return toonFrameInfo(toonFrame(key, 40, 28, () => drawShiba(p)), flip, 0.5, 1.05);
}

// ---------------------------------------------------------------
// 賣萌時鄰居的臉部特寫：neutral / smile / heart / blush / tears / angry / shock / phone / meat
// ---------------------------------------------------------------
function drawFaceCloseup(key, expr, f) {
  const S = PEOPLE[key] || PEOPLE.lin;
  const hy = -15, eyeY = hy + 1.6, ex = [-3.9, 3.9];
  O.blobO([[-16, 1], [-13, -6.5], [-5, -8], [5, -8], [13, -6.5], [16, 1]], S.shirt);
  if (S.clothes === 'vest') { O.blobO([[-13, -6], [-5, -7.5], [-4, 1], [-15, 1]], '#ff8a2a'); O.blobO([[13, -6], [5, -7.5], [4, 1], [15, 1]], '#ff8a2a'); }
  if (S.clothes === 'suit') { O.p([[-3, -8], [3, -8], [0, -2]], '#ffffff'); O.p([[-1, -7], [1, -7], [1.2, -1], [-1.2, -1]], '#d63a4a'); }
  if (S.clothes === 'apron') O.blobO([[-6, -6], [6, -6], [7, 1], [-7, 1]], S.extra);
  const closed = expr === 'tears' || expr === 'happy';
  drawPersonHead(S, 'down', hy, { blink: closed, talk: expr === 'shock' || expr === 'angry' });
  const blush = () => { for (const x of [-6.2, 6.2]) O.e(x, hy + 5, 2.2, 1.3, 'rgba(255,110,140,0.7)'); };
  const smile = (wide) => { if (wide) { O.e(0, hy + 7, 2.4, 1.7, CM.ink); O.e(0, hy + 7.5, 1.6, 0.9, '#e06a7a'); } else O.curve([[-3, hy + 5.8], [0, hy + 8.2], [3, hy + 5.8]], CM.ink, 1.2); };
  const cover = (x) => O.e(x, eyeY, 2.1, 2.5, S.skin);
  if (expr === 'smile') { smile(false); blush(); }
  else if (expr === 'heart' || expr === 'phone' || expr === 'meat') {
    for (const x of ex) { cover(x); O.blobO([[x, eyeY + 2.3], [x - 2.7, eyeY - 0.3], [x - 1.5, eyeY - 2.3], [x, eyeY - 1.2], [x + 1.5, eyeY - 2.3], [x + 2.7, eyeY - 0.3]], '#ff5a8a'); }
    smile(true); blush();
  } else if (expr === 'blush') {
    // 林先生：嘴硬但臉紅，眼睛飄開
    for (const x of ex) { cover(x); O.e(x + 1.2, eyeY, 1.2, 1.7, CM.ink); }
    O.curve([[-2, hy + 6.6], [0.5, hy + 7.4], [2.6, hy + 6.2]], CM.ink, 1.1); blush();
    O.blobO([[9.5, hy - 6], [11, hy - 2.6], [9.5, hy - 1.6], [8, hy - 2.6]], '#9fd8ff');
  } else if (expr === 'tears') {
    for (const x of ex) { O.curve([[x - 1.9, eyeY + 0.6], [x, eyeY - 1.3], [x + 1.9, eyeY + 0.6]], CM.ink, 1.2); O.blobO([[x + 0.6, eyeY + 1.6], [x + 1.7, eyeY + 4.4], [x + 0.6, eyeY + 5.4], [x - 0.5, eyeY + 4.4]], '#8fd0ff'); }
    smile(false); blush();
  } else if (expr === 'happy') { smile(true); blush(); }
  else if (expr === 'angry') {
    for (const sd of [-1, 1]) O.limb(sd * 6.4, eyeY - 4.6, sd * 1.6, eyeY - 2.6, 1.6, CM.ink, { noOutline: true });
    for (const x of [-6.2, 6.2]) O.e(x, hy + 5, 2, 1.1, 'rgba(255,80,80,0.55)');
    // 生氣的青筋
    const vx = 7, vy = hy - 6.5;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.785; O.curve([[vx + Math.cos(a) * 0.8, vy + Math.sin(a) * 0.8], [vx + Math.cos(a + 0.4) * 2.2, vy + Math.sin(a + 0.4) * 2.2]], '#ff3a4a', 1.3); }
  } else if (expr === 'shock') {
    for (const x of ex) { cover(x); O.e(x, eyeY, 1.9, 2.2, '#ffffff'); O.e(x, eyeY, 0.7, 0.8, CM.ink); }
    O.blobO([[9.5, hy - 6.5], [11.2, hy - 2.8], [9.5, hy - 1.6], [7.8, hy - 2.8]], '#9fd8ff');
  }
  if (expr === 'phone') {
    // 掏手機拍照（閃光燈一閃一閃）
    O.blobO([[6.6, hy + 2], [13.6, hy + 1], [14.2, hy + 12], [7.2, hy + 12.8]], '#2a2a36');
    O.blobO([[7.8, hy + 3], [12.8, hy + 2.3], [13.2, hy + 10.6], [8.2, hy + 11.2]], '#6aa8e8');
    if (f) for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; O.curve([[12.4 + Math.cos(a) * 1.6, hy + 1.6 + Math.sin(a) * 1.6], [12.4 + Math.cos(a) * 4.2, hy + 1.6 + Math.sin(a) * 4.2]], '#fff6b0', 1.4); }
    O.e(12.4, hy + 1.6, 1.2, 1.2, f ? '#ffffff' : '#ffe58a');
  }
  if (expr === 'meat') {
    O.limb(6, hy + 13, 14.5, hy - 3, 1.1, '#c8a46a');
    O.eo(9.2, hy + 7, 2.6, 2.1, '#a0522d'); O.eo(11.4, hy + 3, 2.4, 1.9, '#b8643a'); O.eo(13.1, hy - 0.4, 1.9, 1.6, '#5fae5a');
    if (f) O.curve([[8, hy + 3.5], [8.6, hy + 1.2], [8, hy - 1]], 'rgba(255,255,255,0.7)', 1);
  }
}
function toonFace(key, expr, f) { return toonFrame('face-' + key + '-' + expr + (f ? 1 : 0), 34, 30, () => drawFaceCloseup(key, expr, f)); }

// ---------------------------------------------------------------
// 橘貓夥伴：同一套畫法，換成橘色
// ---------------------------------------------------------------
const ORANGE_PAL = { out: '#2a170a', fur: '#ec9440', furL: '#f8bb6c', furD: '#c46a22', stripe: '#a24c14', cream: '#fff4e4', creamS: '#efd6b4', eye: '#f4cf4e', eyeD: '#b8902a', ear: '#f6a890', nose: '#e8908a', noseD: '#b25e56' };
function toonOrange(oc) {
  const save = {};
  for (const k in ORANGE_PAL) { save[k] = TAB[k]; TAB[k] = ORANGE_PAL[k]; }
  TOON_PREFIX = 'o-';
  try { return toonCat(oc, orangeGearFor(G.run)); } finally { TOON_PREFIX = ''; Object.assign(TAB, save); }
}
// 紙箱偽裝：箱子上面露出兩隻耳朵，箱子的洞裡有一雙眼睛
function drawCatBox(f, peek) {
  const wob = Math.sin(f * Math.PI * 2) * 0.8;
  // 耳朵
  if (peek) for (const sx of [-1, 1]) { O.p([[sx * 3 + wob, -19], [sx * 6.5 + wob, -26], [sx * 8.5 + wob, -18.5]], CM.ink); O.p([[sx * 3.8 + wob, -19.2], [sx * 6.4 + wob, -24.4], [sx * 7.8 + wob, -19.2]], TAB.fur); O.p([[sx * 5 + wob, -19.4], [sx * 6.3 + wob, -22.6], [sx * 7.1 + wob, -19.4]], TAB.ear); }
  // 箱子
  O.blobO([[-12, -18.5], [12, -18.5], [11.5, -1], [-11.5, -1]], '#c9965c', { part: 20 });
  O.e(5, -9, 6, 8, '#b07e48', { only: 20 });
  O.blobO([[-12.5, -19.5], [-3, -19.5], [-5, -24 + wob], [-13.5, -22.5]], '#d8a86c');
  O.blobO([[12.5, -19.5], [3, -19.5], [5, -24 - wob], [13.5, -22.5]], '#d8a86c');
  O.limb(-11, -14.5, 11, -14.5, 2.2, '#e6c48a', { noOutline: true });
  // 洞和眼睛
  O.blobO([[-6, -11.5], [6, -11.5], [5.5, -7], [-5.5, -7]], '#2a1d16');
  const GR = gearNow(), EC = gearEyeCol(GR);
  if (peek) { for (const sx of [-1, 1]) { O.e(sx * 2.6, -9.2, 1.3, 1.5, EC ? EC.eye : TAB.eye); O.dot(sx * 2.6 + 0.2, -9.1, 0.6, '#15100b'); } }
  if (peek && GR) gearBoxTop(wob, GR);
  // 紙箱上的字
  VXR.shape({}, g => { const [X, Y] = TXY(-8, -3.6); g.fillStyle = 'rgba(90,50,20,0.65)'; g.font = `900 4.4px ${BOLD_FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('易碎', X, Y); });
}
function toonCatBox(c) {
  const f = c.moving ? Math.floor(c.t * 8) % 4 : 0;
  const peek = !c.moving || f % 2 === 0;
  const g = catGearFor(G.run);
  return withGear(g, () => toonFrameInfo(toonFrame(gearKeyOf(g) + 'catbox-' + f + (peek ? 'p' : ''), 32, 28, () => drawCatBox(f / 4, peek)), false, 0.5, 0.95));
}
// 下雨天的傘
const UMB_COL = { lin: '#4f86d6', bo: '#5fae5a', chief: '#ffd84d', patrol: '#ffd84d', butler: '#2a2a36', wang: '#ff86a8' };
function drawUmbrella(col) {
  O.limb(0, -2, 0, 6, 1.4, '#3a3440');
  O.blobO([[-17, 0], [-14, -7], [-6, -11.5], [0, -12.5], [6, -11.5], [14, -7], [17, 0], [11, -1.5], [5.6, 0], [0, -1.5], [-5.6, 0], [-11, -1.5]], col, { part: 21 });
  O.e(-4, -6, 6, 2.6, 'rgba(255,255,255,0.35)', { only: 21, rot: -0.2 });
  for (const x of [-11, -5.6, 0, 5.6, 11]) O.curve([[0, -12], [x, x === 0 ? -1.5 : 0]], shade(col, -0.25), 0.8, { only: 21 });
  O.dot(0, -13, 1.2, CM.ink);
}
function toonUmbrella(key) { const col = UMB_COL[key] || '#8a8ab8'; return toonFrameInfo(toonFrame('umb-' + key, 38, 21, () => { TOY -= 6; drawUmbrella(col); TOY += 6; }), false, 0.5, 1.0); }
// 告示牌（偷花必究）
function drawSignBoard(text) {
  O.limb(-6, 0, -6, -10, 2, '#7a5232'); O.limb(6, 0, 6, -10, 2, '#7a5232');
  O.blobO([[-12, -22], [12, -22], [12, -9], [-12, -9]], '#fff6e6');
  O.limb(-12, -21, 12, -21, 2.4, '#d94a5a', { noOutline: true });
  VXR.shape({}, g => { const [X, Y] = TXY(0, -15); g.fillStyle = '#c42a3a'; g.font = `900 6px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, X, Y); });
}
function toonSignBoard(text) { return toonFrameInfo(toonFrame('sign-' + text, 30, 26, () => drawSignBoard(text)), false, 0.5, 1.0); }

// 給 3D 生成工具用的參考圖：不戴配件、站好、同一個比例和地面線（view：front / side / back）
function catRefArt(view, k = 18, gear = null) {
  return withGear(gear, () => withPen(VXR, () => {
    const w = 50, h = 40;
    VXR.begin(w, h, k, { pad: 1 });
    TOX = w / 2; TOY = h - 1.5;
    if (view === 'side') drawCatSide({ mode: 'stand', tail: 0, eye: 'open' });
    else if (view === 'front') drawCatFront({ ph: 0, tail: 0, eye: 'open' });
    else drawCatBack({ ph: 0, tail: 0 });
    return VXR.end();
  }));
}
// 場景開始時先把常用的圖排進預畫清單
function warmCat() {
  const C = (o) => Object.assign(new Cat(0, 0), o), fns = [];
  for (let f = 0; f < 8; f++) fns.push(() => toonCat(C({ moving: true, dir: 'right', t: f / 10 + 0.001 })));
  for (let f = 0; f < 6; f++) fns.push(() => toonCat(C({ moving: true, running: true, dir: 'right', t: f / 12 + 0.001 })));
  for (let f = 0; f < 4; f++) { fns.push(() => toonCat(C({ moving: true, dir: 'down', t: f / 8 + 0.001 }))); fns.push(() => toonCat(C({ moving: true, dir: 'up', t: f / 8 + 0.001 }))); }
  for (const act of ['none', 'lookL', 'lookR', 'blink', 'ear', 'yawn', 'meow']) fns.push(() => toonCat(C({ pose: 'loaf', act, t: 1 })));
  for (let i = 0; i < 6; i++) fns.push(() => toonCat(C({ dir: 'right', t: i / 6 / 0.7 + 0.01 })));
  return fns;
}
function warmOrange() {
  const C = (o) => Object.assign(new Cat(0, 0), o), fns = [];
  for (let f = 0; f < 8; f++) fns.push(() => toonOrange(C({ moving: true, dir: 'right', t: f / 10 + 0.001 })));
  for (let f = 0; f < 6; f++) fns.push(() => toonOrange(C({ moving: true, running: true, dir: 'right', t: f / 12 + 0.001 })));
  for (let f = 0; f < 4; f++) { fns.push(() => toonOrange(C({ moving: true, dir: 'down', t: f / 8 + 0.001 }))); fns.push(() => toonOrange(C({ moving: true, dir: 'up', t: f / 8 + 0.001 }))); }
  for (let f = 0; f < 6; f++) fns.push(() => toonOrange(C({ pose: 'belly', t: f / 4 + 0.001 })));
  for (const act of ['none', 'lookL', 'lookR', 'blink', 'ear', 'yawn', 'meow', 'lick', 'sleep']) fns.push(() => toonOrange(C({ pose: 'loaf', act, t: 1 })));
  for (let f = 0; f < 2; f++) fns.push(() => toonOrange(C({ pose: 'meow', dir: 'right', t: f / 3 + 0.001 })));
  for (let f = 0; f < 3; f++) fns.push(() => toonOrange(C({ pose: 'rub', dir: 'right', t: f / 4 + 0.001 })));
  fns.push(() => toonOrange(C({ jump: { x0: 0, x1: 1 }, dir: 'right', t: 1 })));
  for (let i = 0; i < 6; i++) fns.push(() => toonOrange(C({ dir: 'right', t: i / 6 / 0.7 + 0.01 })));
  fns.push(() => toonOrange(C({ dir: 'down', t: 1 }))); fns.push(() => toonOrange(C({ dir: 'up', t: 1 })));
  return fns;
}
function warmPeople(keys, night) {
  const fns = [];
  for (const k of keys) for (const dir of ['down', 'right', 'up']) {
    fns.push(() => toonHuman(Object.assign(new Human(k, 0, 0, dir), { t: 1 }), night));
    for (let f = 0; f < 6; f++) fns.push(() => toonHuman(Object.assign(new Human(k, 0, 0, dir), { moving: true, t: f / 9 + 0.001 }), night));
  }
  return fns;
}
