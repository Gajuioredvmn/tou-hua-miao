// ================= 程序化像素畫：賣萌特寫 =================
// 照影片裡的虎斑貓畫：趴著喵喵叫、翻身露肚、蹭腳。每一格都即時用形狀算出像素，不會有縮放糊掉。
const TAB = {
  out: '#24160d', fur: '#b37645', furL: '#d9a36a', furD: '#8c5631', stripe: '#4a2b18',
  cream: '#f5eadb', creamS: '#ddcab0', nose: '#d98b7d', noseD: '#a3574c',
  eye: '#acd46c', eyeD: '#5c8935', pupil: '#15100b', mouth: '#3d1418', tongue: '#ea717e',
  ear: '#eda290', whisker: '#fff7ea', white: '#ffffff',
};

const PXR = {
  w: 0, h: 0, buf: null, part: null, cv: null, g: null, img: null, cache: {},
  begin(w, h) {
    if (w !== this.w || h !== this.h) {
      this.w = w; this.h = h;
      this.cv = document.createElement('canvas'); this.cv.width = w; this.cv.height = h;
      this.g = this.cv.getContext('2d'); this.img = this.g.createImageData(w, h);
      this.buf = new Uint32Array(this.img.data.buffer); this.part = new Uint8Array(w * h);
    }
    this.buf.fill(0); this.part.fill(0);
  },
  c(hex) {
    let v = this.cache[hex]; if (v !== undefined) return v;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    v = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; this.cache[hex] = v; return v;
  },
  put(x, y, col, part, only) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    if (only && this.part[i] !== only) return;
    this.buf[i] = col; if (part) this.part[i] = part;
  },
  ellipse(cx, cy, rx, ry, hex, o = {}) {
    if (rx <= 0 || ry <= 0) return;
    const col = this.c(hex), rot = o.rot || 0, cs = Math.cos(rot), sn = Math.sin(rot);
    const R = Math.max(rx, ry) + 1;
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(this.w - 1, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(this.h - 1, Math.ceil(cy + R));
    const irx = 1 / (rx * rx), iry = 1 / (ry * ry);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const u = dx * cs + dy * sn, v = -dx * sn + dy * cs;
      if (u * u * irx + v * v * iry <= 1) this.put(x, y, col, o.part, o.only);
    }
  },
  poly(pts, hex, o = {}) {
    const col = this.c(hex);
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (const [x, y] of pts) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
    for (let y = Math.max(0, Math.floor(miny)); y <= Math.min(this.h - 1, Math.ceil(maxy)); y++) {
      for (let x = Math.max(0, Math.floor(minx)); x <= Math.min(this.w - 1, Math.ceil(maxx)); x++) {
        const px = x + 0.5, py = y + 0.5; let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
          if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.put(x, y, col, o.part, o.only);
      }
    }
  },
  line(x0, y0, x1, y1, hex, o = {}) {
    const col = this.c(hex);
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let k = 0; k < 300; k++) {
      this.put(x0, y0, col, o.part, o.only);
      if (o.thick) this.put(x0 + 1, y0, col, o.part, o.only);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  },
  curve(pts, hex, o = {}) { for (let i = 1; i < pts.length; i++) this.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], hex, o); },
  polyEdge(pts, hex, o = {}) { for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; this.line(a[0], a[1], b[0], b[1], hex, o); } },
  // 外框：空白像素旁邊有東西就描邊
  outline(hex) {
    const col = this.c(hex), w = this.w, h = this.h, b = this.buf;
    const mark = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (b[i]) continue;
      if ((x > 0 && b[i - 1]) || (x < w - 1 && b[i + 1]) || (y > 0 && b[i - w]) || (y < h - 1 && b[i + w])) mark.push(i);
    }
    for (const i of mark) b[i] = col;
  },
  end() { this.g.putImageData(this.img, 0, 0); return this.cv; },
};

const smooth = t => t * t * (3 - 2 * t);
const pulse = (t, a, b) => (t < a || t > b ? 0 : Math.pow(Math.sin(Math.PI * (t - a) / (b - a)), 0.7));

// 正面的貓頭。o: open 張嘴、eyes 'open'|'blink'|'happy'、earL/earR 耳朵角度
function drawCatHead(cx, cy, rot, s, o, late) {
  const C = TAB, cs = Math.cos(rot), sn = Math.sin(rot), GR = gearNow();
  const P = (x, y) => [cx + (x * cs - y * sn) * s, cy + (x * sn + y * cs) * s];
  if (GR && (GR.scarf || GR.collar)) gearHeadUnder(P, s, GR);   // 項圈、領巾（頭會蓋住上半）
  const ear = (side, ang) => {
    const bx = side * 9, by = -8, ca = Math.cos(ang * side), sa = Math.sin(ang * side);
    const R = (x, y) => { const dx = x - bx, dy = y - by; return P(bx + dx * ca - dy * sa, by + dx * sa + dy * ca); };
    return { outer: [R(side * 15.5, -4), R(side * 12, -22), R(side * 3, -12.5)], inner: [R(side * 13, -7), R(side * 11.2, -18.5), R(side * 6, -12)] };
  };
  const eL = ear(-1, o.earL || 0), eR = ear(1, o.earR || 0);
  // 先畫外框（放大一圈），再填色
  PX.poly(eL.outer, C.out); PX.poly(eR.outer, C.out);
  PX.polyEdge(eL.outer, C.out); PX.polyEdge(eR.outer, C.out);
  const [hx, hy] = P(0, 0);
  PX.ellipse(hx, hy, 17 * s + 1, 13.6 * s + 1, C.out, { rot });
  for (const sd of [-1, 1]) { const [x, y] = P(sd * 10.5, 4.8); PX.ellipse(x, y, 7.6 * s + 1, 6 * s + 1, C.out, { rot }); }
  // 填色
  const shrink = pts => { const mx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, my = (pts[0][1] + pts[1][1] + pts[2][1]) / 3; return pts.map(([x, y]) => [x + (mx - x) * 0.12, y + (my - y) * 0.12]); };
  PX.poly(shrink(eL.outer), C.fur, { part: 1 }); PX.poly(shrink(eR.outer), C.fur, { part: 1 });
  PX.ellipse(hx, hy, 17 * s, 13.6 * s, C.fur, { rot, part: 1 });
  for (const sd of [-1, 1]) { const [x, y] = P(sd * 10.5, 4.8); PX.ellipse(x, y, 7.6 * s, 6 * s, C.fur, { rot, part: 1 }); }
  PX.poly(eL.inner, C.ear); PX.poly(eR.inner, C.ear);
  // 額頭的 M 字和臉頰條紋
  const st = (a, b) => { const p = P(a[0], a[1]), q = P(b[0], b[1]); PX.line(p[0], p[1], q[0], q[1], C.stripe, { only: 1 }); };
  st([-5.5, -12.5], [-3.6, -5.5]); st([0, -13.5], [0, -6]); st([5.5, -12.5], [3.6, -5.5]);
  st([-1.2, -13.5], [-1.2, -8]); st([1.2, -13.5], [1.2, -8]);
  st([-10, -9.5], [-8, -5.5]); st([10, -9.5], [8, -5.5]);
  for (const sd of [-1, 1]) { st([sd * 16.5, 0.5], [sd * 11, 2]); st([sd * 16.5, 4], [sd * 12, 5]); st([sd * 15.5, 7.5], [sd * 12, 8]); }
  // 亮一點的眼周
  for (const sd of [-1, 1]) { const [x, y] = P(sd * 7, -1); PX.ellipse(x, y, 5.6 * s, 4.4 * s, C.furL, { rot, only: 1 }); }
  if (GR && GR.mask) gearHeadMask(P, s, GR);
  // 眼睛（夜視：發光的眼睛；戴眼罩：閉眼的線用淺色）
  const eyes = o.eyes || 'open', EC = gearEyeCol(GR), lc = GR && GR.mask ? MASK_LINE : C.out;
  for (const sd of [-1, 1]) {
    const [x, y] = P(sd * 7, -1);
    if (eyes === 'open') {
      const look = o.look || 0, big = !!o.big;
      PX.ellipse(x, y, (big ? 5.1 : 4.7) * s, (big ? 4.4 : 3.9) * s, C.out, { rot });
      PX.ellipse(x, y, (big ? 4.3 : 3.9) * s, (big ? 3.7 : 3.2) * s, EC ? EC.eye : C.eye, { rot, part: 2 });
      const [lx, ly] = P(sd * 7 + look * 1.6, -0.6);
      PX.ellipse(lx, ly + 0.8 * s, 3.3 * s, 1.6 * s, EC ? EC.eyeD : C.eyeD, { rot, only: 2 });
      PX.ellipse(lx, ly, (big ? 2.7 : 1.2) * s, (big ? 3.2 : 2.9) * s, C.pupil, { rot, only: 2 });
      const [gx, gy] = P(sd * 7 + look * 1.6 - 1.3, -2.3);
      PX.put(Math.round(gx), Math.round(gy), PX.c(C.white));
      if (big) { PX.ellipse(gx + 0.4, gy + 0.6, 1.1 * s, 1.1 * s, C.white, { rot }); const [hx2, hy2] = P(sd * 7 + look * 1.6 + 1.2, 0.8); PX.ellipse(hx2, hy2, 0.6 * s, 0.6 * s, C.white, { rot }); }
    } else if (eyes === 'dizzy') {
      // 暈頭轉向的圈圈眼
      const pts = []; for (let i = 0; i <= 14; i++) { const a = i * 0.9, r = (0.6 + i * 0.26) * s; pts.push(P(sd * 7 + Math.cos(a) * r / s, -1 + Math.sin(a) * r / s)); }
      PX.curve(pts, lc);
    } else if (eyes === 'blink') {
      const a = P(sd * 7 - 4, -0.6), b = P(sd * 7, 0.4), c = P(sd * 7 + 4, -0.6);
      PX.curve([a, b, c], lc);
    } else {
      // 開心瞇眼 ^ ^
      const a = P(sd * 7 - 4, 0.6), b = P(sd * 7, -1.8), c = P(sd * 7 + 4, 0.6);
      PX.curve([a, b, c], lc);
    }
  }
  // 口鼻
  for (const sd of [-1, 1]) { const [x, y] = P(sd * 3.7, 7.2); PX.ellipse(x, y, 4.7 * s, 3.7 * s, C.cream, { rot }); }
  { const [x, y] = P(0, 11); PX.ellipse(x, y, 4.2 * s, 2.8 * s, C.cream, { rot }); }
  if (!(GR && GR.mask)) { const [x, y] = P(0, -3); PX.ellipse(x, y, 1.6 * s, 3 * s, C.furL, { rot }); }
  PX.poly([P(-2.8, 3.3), P(2.8, 3.3), P(0, 6.2)], C.nose);
  PX.line(...P(-2.4, 3.3), ...P(2.4, 3.3), C.noseD);
  const open = o.open || 0;
  if (open > 0.06) {
    const [mx, my] = P(0, 8.8 + open * 1.3);
    PX.ellipse(mx, my, (2.8 + open * 1.2) * s, (0.9 + open * 3.4) * s, C.out, { rot });
    PX.ellipse(mx, my, (2.2 + open * 1.1) * s, (0.5 + open * 3.0) * s, C.mouth, { rot, part: 3 });
    const [tx, ty] = P(0, 9.8 + open * 3.2);
    PX.ellipse(tx, ty, 2.2 * s, Math.max(0.6, open * 1.9) * s, C.tongue, { rot, only: 3 });
    if (open > 0.35) for (const sd of [-1, 1]) { const [fx, fy] = P(sd * 1.8, 7.6 + open * 0.6); PX.put(Math.round(fx), Math.round(fy), PX.c(C.white)); }
  } else {
    PX.curve([P(0, 6), P(-1.6, 8.2), P(-3.4, 7.4)], C.out);
    PX.curve([P(0, 6), P(1.6, 8.2), P(3.4, 7.4)], C.out);
    if (o.blep) { const [bx, by] = P(0.6, 9.4); PX.ellipse(bx, by, 2.1 * s, 1.9 * s, C.out, { rot }); PX.ellipse(bx, by, 1.5 * s, 1.4 * s, C.tongue, { rot }); }
  }
  if (GR) gearHeadTop(P, s, rot, GR);   // 蝴蝶結／花冠、耳邊的花
  // 鬍鬚最後畫（不描邊）
  if (late) late.push(() => {
    for (const sd of [-1, 1]) {
      const w = o.whisk || 0;
      for (const [sy, ex, ey] of [[6.4, 19, 4.4 + w], [7.8, 20, 8 + w], [9.2, 18.5, 11.4 + w]]) {
        const a = P(sd * 9, sy), b = P(sd * ex, ey);
        PX.line(a[0], a[1], b[0], b[1], C.whisker);
      }
    }
  });
}

// 帶斑紋的毛（橢圓）
function furBlob(cx, cy, rx, ry, rot, stripeDir = 0, stripes = 6) {
  const C = TAB;
  PX.ellipse(cx, cy, rx + 1, ry + 1, C.out, { rot });
  PX.ellipse(cx, cy, rx, ry, C.fur, { rot, part: 1 });
  PX.ellipse(cx - Math.sin(rot) * ry * 0.35, cy - Math.cos(rot) * ry * 0.35, rx * 0.8, ry * 0.45, C.furL, { rot, only: 1 });
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const T = (u, v) => [cx + u * cs - v * sn, cy + u * sn + v * cs];
  // 背脊深色線
  PX.ellipse(...T(0, -ry * 0.82), rx * 0.78, ry * 0.2, C.furD, { rot, only: 1 });
  for (let i = 0; i < stripes; i++) {
    const u = (i / (stripes - 1) - 0.5) * 1.7 * rx;
    const len = 0.55 + ((i * 37) % 5) * 0.08;
    const a = T(u, -ry), m = T(u + stripeDir * 2.2, -ry + ry * len), b = T(u + stripeDir * 1.2, -ry + ry * len * 1.6);
    PX.curve([a, m, b], C.stripe, { only: 1 });
    if (i % 2 === 0) { const a2 = T(u + 1, -ry), m2 = T(u + 1 + stripeDir * 2.2, -ry + ry * len * 0.7); PX.line(a2[0], a2[1], m2[0], m2[1], C.stripe, { only: 1 }); }
  }
}
function paw(cx, cy, rx, ry, rot = 0) {
  const sk = gearPawPX();   // 肉球消音：襪子（黑襪是白腳尖）
  PX.ellipse(cx, cy, rx + 1, ry + 1, TAB.out, { rot });
  PX.ellipse(cx, cy, rx, ry, sk ? sk.c : TAB.furL, { rot, part: 4 });
  const cs = Math.cos(rot), sn = Math.sin(rot), toe = sk ? (sk === GEARC.sock[2] ? sk.toe : sk.d) : TAB.furD;
  for (const k of [-0.35, 0.35]) { const x = cx + k * rx * cs, y = cy + k * rx * sn; PX.line(x - sn * ry * 0.2, y + cs * ry * 0.2, x + sn * ry * 0.9, y - cs * ry * 0.9, toe, { only: 4 }); }
}
function tail(pts, w) {
  for (const [x, y] of pts) PX.ellipse(x, y, w + 1, w + 1, TAB.out);
  pts.forEach(([x, y], i) => PX.ellipse(x, y, w, w, i % 3 === 1 ? TAB.stripe : TAB.fur));
  gearTailPX(pts);
}

// ---- 特寫 1：趴著喵喵叫（影片前半段）----
function drawMeowArt(t, pen = PXR, k = 4) {
  return withPen(pen, () => {
  PX.begin(96, 64, k, { reuse: true });
  const late = [];
  const open = Math.max(pulse(t, 0.25, 0.8), pulse(t, 1.05, 1.6));
  const tilt = Math.sin(t * 2.4) * 0.07 - 0.03;
  const blink = (t > 1.75 && t < 1.9);
  const earL = t > 0.85 && t < 1.15 ? -0.35 * Math.sin((t - 0.85) / 0.3 * Math.PI) : 0;
  const earR = Math.sin(t * 7) * 0.04;
  furBlob(48, 57, 34, 12, 0, 0.6, 9);
  PX.ellipse(48, 50, 11, 7, TAB.cream);
  paw(35, 60, 7.5, 3.8, -0.05); paw(61, 60, 7.5, 3.8, 0.05);
  drawCatHead(48, 30 + open * 0.8, tilt, 1.12, { open, eyes: blink ? 'blink' : 'open', earL, earR, look: Math.sin(t * 1.3) * 0.3, whisk: open * 0.8 }, late);
  PX.outline(TAB.out);
  late.forEach(f => f());
  return PX.end();
  });
}

// ---- 特寫 2：翻肚（影片後半段：側翻、頭倒過來、一隻手伸出去）----
function drawBellyArt(t, pen = PXR, k = 4) {
  return withPen(pen, () => {
  PX.begin(96, 64, k, { reuse: true });
  const late = [];
  const p = smooth(Math.min(1, t / 0.85));
  const hold = Math.max(0, t - 0.85);
  const wig = Math.sin(hold * 8) * Math.exp(-hold * 1.2) * (hold > 0 ? 1 : 0);
  const reach = smooth(Math.min(1, Math.max(0, (t - 1.0) / 0.5)));
  const open = pulse(t, 1.35, 1.95);
  // 尾巴
  const tx = 86, ty = 47 - p * 4;
  const tpts = []; for (let i = 0; i < 9; i++) { const k = i / 8; tpts.push([tx + k * 8 - k * k * 4, ty - k * 14 * (0.4 + p * 0.6) + Math.sin(t * 4 + k * 2) * k * 3]); }
  tail(tpts, 2.4);
  // 後腳
  const blx = lerp(78, 80, p), bly = lerp(52, 30, p);
  furBlob(lerp(78, 77, p), lerp(50, 38, p), 8, 6, lerp(0, -0.9, p), 0, 3);
  paw(blx + lerp(0, 4, p), bly - lerp(0, 4, p), 3.6, 5, lerp(1.4, 0.2, p));
  // 身體
  const brot = lerp(0, -0.08, p) + wig * 0.05;
  furBlob(56, 45 - p * 2, 27, 12 - p, brot, 0.8, 8);
  if (p > 0.05) PX.ellipse(56, 40 - p * 2, 20 * p, 7.2 * p, TAB.cream, { rot: brot });
  if (p > 0.5) for (const [x, y] of [[48, 39], [56, 38], [64, 39]]) PX.put(x, y + Math.round(-p * 2), PX.c(TAB.creamS));
  // 前腳：一隻舉起來、一隻伸出去
  const upx = lerp(26, 40, p), upy = lerp(55, 30, p);
  PX.ellipse(lerp(34, 42, p), lerp(53, 37, p), 3.2 + 1, 7 + 1, TAB.out, { rot: lerp(1.5, -0.7, p) });
  PX.ellipse(lerp(34, 42, p), lerp(53, 37, p), 3.2, 7, TAB.fur, { rot: lerp(1.5, -0.7, p), part: 1 });
  paw(upx, upy, 4, 3.2, lerp(0, -0.6, p));
  const rx2 = lerp(28, 18 - reach * 4, p), ry2 = lerp(57, 55 + reach * 4, p);
  PX.ellipse((rx2 + 38) / 2, (ry2 + 50) / 2, 9 + 1, 3 + 1, TAB.out, { rot: Math.atan2(ry2 - 50, rx2 - 38) });
  PX.ellipse((rx2 + 38) / 2, (ry2 + 50) / 2, 9, 3, TAB.fur, { rot: Math.atan2(ry2 - 50, rx2 - 38), part: 1 });
  paw(rx2, ry2, 4.4, 3.4, 0.2);
  // 頭：慢慢倒過來
  const hrot = p * Math.PI * 0.92 + wig * 0.1;
  drawCatHead(lerp(30, 27, p), lerp(27, 45, p), hrot, 0.78, { open, eyes: (t > 0.3 && t < 0.42) ? 'blink' : 'open', earL: p * 0.25, earR: p * 0.15, look: -0.4, whisk: 0 }, late);
  PX.outline(TAB.out);
  late.forEach(f => f());
  return PX.end();
  });
}

// ---- 特寫 3：蹭腳 ----
const LEGS = {
  wang: { pants: '#3a3550', shoe: '#7a2b3b' },
  lin: { pants: '#c7a76c', shoe: '#4a3a2a' },
  bo: { pants: '#3b5fb4', skin: '#f6c9a0', shoe: '#4a7be0', bare: true },
  patrol: { pants: '#2a2f45', shoe: '#1f1f2a' },
  butler: { pants: '#22222c', shoe: '#111118' },
  party: { pants: '#55506a', shoe: '#3a2a20' },
};
function drawRubArt(t, who, pen = PXR, k = 4) {
  return withPen(pen, () => {
  PX.begin(96, 64, k, { reuse: true });
  const late = [];
  const L = LEGS[who] || LEGS.lin;
  // 人的腳
  const lx = 70;
  if (L.bare) {
    PX.poly([[lx - 1, -1], [lx + 15, -1], [lx + 15, 12], [lx - 1, 12]], L.pants);
    PX.poly([[lx + 1, 12], [lx + 13, 12], [lx + 12, 54], [lx + 2, 54]], L.skin);
    PX.poly([[lx - 2, 54], [lx + 18, 54], [lx + 18, 59], [lx - 2, 59]], '#f2f2f2');
    PX.poly([[lx + 1, 51], [lx + 13, 51], [lx + 13, 55], [lx + 1, 55]], L.shoe);
  } else {
    PX.poly([[lx - 1, -1], [lx + 15, -1], [lx + 14, 52], [lx, 52]], L.pants);
    PX.line(lx + 7, 0, lx + 7, 50, TAB.out);
    PX.poly([[lx - 3, 52], [lx + 19, 52], [lx + 20, 59], [lx - 3, 59]], L.shoe);
  }
  // 貓：身體拱起、尾巴豎高、頭蹭過去
  const r = Math.sin(t * 6.5);
  const tpts = []; for (let i = 0; i < 12; i++) { const k = i / 11; tpts.push([22 - k * 6 + Math.sin(k * 3 + t * 3) * 2, 44 - k * 32 + (k > 0.85 ? (k - 0.85) * 30 : 0) * 0.3]); }
  tpts.push([tpts[11][0] + 3, tpts[11][1] - 2]);
  tail(tpts, 2.3);
  for (const [x, ph] of [[27, 0], [33, Math.PI], [50, Math.PI], [56, 0]]) {
    const lift = Math.max(0, Math.sin(t * 6.5 + ph)) * 1.2;
    PX.ellipse(x, 52 - lift, 3 + 1, 6 + 1, TAB.out); PX.ellipse(x, 52 - lift, 3, 6, TAB.fur, { part: 1 });
    paw(x + 1, 57 - lift, 3.8, 2.4);
  }
  furBlob(40, 43 + r * 0.6, 21, 10, -0.06, -0.5, 7);
  PX.ellipse(46, 49 + r * 0.6, 12, 4, TAB.cream, { rot: -0.06 });
  drawCatHead(61 + r * 1.5, 33 + r * 2.4, -0.35 + r * 0.08, 0.72, { eyes: 'happy', earL: -0.3, earR: -0.25, whisk: r * 0.6 }, late);
  PX.outline(TAB.out);
  late.forEach(f => f());
  return PX.end();
  });
}

// ================= 賣萌小遊戲用的特寫：由操作驅動，每招三種演出 =================
// 汗滴
function sweatDrop(x, y, s = 1) { PX.ellipse(x, y, 1.9 * s + 1, 2.6 * s + 1, TAB.out); PX.ellipse(x, y, 1.9 * s, 2.6 * s, '#9fd8ff'); PX.poly([[x - 1.6 * s, y - 1.2 * s], [x, y - 4.6 * s], [x + 1.6 * s, y - 1.2 * s]], '#9fd8ff'); }
// s: { t, v 演出, open 張嘴, mood: 'play'|'happy'|'fail', wave }
function drawMeowArt2(s, pen = PXR, k = 4) {
  return withPen(pen, () => {
    PX.begin(96, 64, k, { reuse: true });
    const late = [], t = s.t, v = s.v || 0, open = s.open || 0;
    const fail = s.mood === 'fail', happy = s.mood === 'happy';
    const eyes = happy ? 'happy' : fail ? 'blink' : (s.blink ? 'blink' : 'open');
    if (v === 1) {
      // 招財貓：坐起來，一隻手一直招
      const wave = fail ? -0.4 : Math.sin(t * 9) * (happy ? 1.3 : 1);
      const tp = []; for (let i = 0; i < 10; i++) { const q = i / 9; tp.push([60 + q * 14 - q * q * 3, 60 - q * 14 + Math.sin(t * 3 + q * 3) * q * 2]); }
      tail(tp, 2.3);
      gearClose('sit', 'back');
      furBlob(48, 47, 15, 16, 0, 0.3, 5);
      PX.ellipse(48, 52, 9.5, 10.5, TAB.cream);
      paw(38, 61, 6.4, 3.3); paw(58, 61, 6.4, 3.3);
      paw(43, 57.5, 4.2, 3.1);
      gearClose('sit', 'over');
      const ax = 64, ay = (fail ? 46 : 30) + wave * 2.4, sx = 58, sy = 43;
      PX.ellipse((sx + ax) / 2, (sy + ay) / 2, 3.4 + 1, Math.hypot(ax - sx, ay - sy) / 2 + 1.5, TAB.out, { rot: Math.atan2(ax - sx, sy - ay) });
      PX.ellipse((sx + ax) / 2, (sy + ay) / 2, 3.4, Math.hypot(ax - sx, ay - sy) / 2 + 0.5, TAB.fur, { rot: Math.atan2(ax - sx, sy - ay), part: 1 });
      paw(ax, ay, 4.3, 3.7, wave * 0.3);
      drawCatHead(46, 24 + open * 0.6, -0.06 + wave * 0.03, 0.98, { open, eyes, earL: fail ? 0.5 : 0, earR: fail ? -0.5 : 0.1, look: 0.25, whisk: open }, late);
      if (fail) sweatDrop(60, 14);
    } else {
      // v0 趴著喵；v2 歪頭、瞳孔放大
      const tilt = v === 2 ? 0.34 + Math.sin(t * 2) * 0.04 : Math.sin(t * 2.4) * 0.07 - 0.03;
      gearClose('lie', 'back');
      furBlob(48, 57, 34, 12, 0, 0.6, 9);
      PX.ellipse(48, 50, 11, 7, TAB.cream);
      paw(35, 60, 7.5, 3.8, -0.05); paw(61, 60, 7.5, 3.8, 0.05);
      gearClose('lie', 'over');
      drawCatHead(48 + (v === 2 ? -2 : 0), 30 + open * 0.8 + (fail ? 2 : 0), fail ? -0.12 : tilt, 1.12, { open, eyes, earL: fail ? 0.6 : v === 2 ? 0.25 : 0, earR: fail ? -0.6 : v === 2 ? -0.2 : 0, look: v === 2 ? 0 : Math.sin(t * 1.3) * 0.3, whisk: open * 0.8, big: v === 2 && !fail && !happy }, late);
      if (fail) sweatDrop(70, 12);
    }
    PX.outline(TAB.out);
    late.forEach(f => f());
    return PX.end();
  });
}
// s: { t, v, p 翻身進度（>1 是翻過頭）, open, mood }
function drawBellyArt2(s, pen = PXR, k = 4) {
  return withPen(pen, () => {
    PX.begin(96, 64, k, { reuse: true });
    const late = [], t = s.t, v = s.v || 0;
    const p = smooth(clamp(s.p, 0, 1)), over = Math.max(0, s.p - 1);
    const fail = s.mood === 'fail', happy = s.mood === 'happy';
    // wigAmp：畫圈圈玩法會讓貓扭得更用力
    const wig = fail ? 0 : s.wigAmp !== undefined ? Math.sin(t * 9) * s.wigAmp : p > 0.92 ? Math.sin(t * 8) * (happy ? 1 : 0.6) : 0;
    const knead = s.knead !== undefined ? s.knead : v === 1 && p > 0.75 && !fail ? Math.sin(t * 12) : 0;
    const reach = smooth(clamp((p - 0.55) / 0.45, 0, 1));
    const open = s.open || 0;
    const tx = 86, ty = 47 - p * 4;
    const tpts = []; for (let i = 0; i < 9; i++) { const q = i / 8; tpts.push([tx + q * 8 - q * q * 4, ty - q * 14 * (0.4 + p * 0.6) + Math.sin(t * 4 + q * 2) * q * 3]); }
    tail(tpts, 2.4);
    const blx = lerp(78, 80, p), bly = lerp(52, 30, p);
    furBlob(lerp(78, 77, p), lerp(50, 38, p), 8, 6, lerp(0, -0.9, p), 0, 3);
    paw(blx + lerp(0, 4, p) + knead * 0.8, bly - lerp(0, 4, p), 3.6, 5, lerp(1.4, 0.2, p));
    const brot = lerp(0, -0.08, p) + wig * 0.05;
    furBlob(56, 45 - p * 2, 27, 12 - p, brot, 0.8, 8);
    if (p > 0.05) PX.ellipse(56, 40 - p * 2, 20 * p, 7.2 * p, TAB.cream, { rot: brot });
    if (p > 0.5) for (const [x, y] of [[48, 39], [56, 38], [64, 39]]) PX.put(x, y + Math.round(-p * 2), PX.c(TAB.creamS));
    const upx = lerp(26, 40, p), upy = lerp(55, 30, p) + knead * 3;
    PX.ellipse(lerp(34, 42, p), lerp(53, 37, p) + knead * 1.5, 3.2 + 1, 7 + 1, TAB.out, { rot: lerp(1.5, -0.7, p) });
    PX.ellipse(lerp(34, 42, p), lerp(53, 37, p) + knead * 1.5, 3.2, 7, TAB.fur, { rot: lerp(1.5, -0.7, p), part: 1 });
    paw(upx, upy, 4, 3.2, lerp(0, -0.6, p));
    const rx2 = lerp(28, 18 - reach * 4, p), ry2 = lerp(57, 55 + reach * 4, p) - knead * 3;
    PX.ellipse((rx2 + 38) / 2, (ry2 + 50) / 2, 9 + 1, 3 + 1, TAB.out, { rot: Math.atan2(ry2 - 50, rx2 - 38) });
    PX.ellipse((rx2 + 38) / 2, (ry2 + 50) / 2, 9, 3, TAB.fur, { rot: Math.atan2(ry2 - 50, rx2 - 38), part: 1 });
    paw(rx2, ry2, 4.4, 3.4, 0.2);
    const hrot = p * Math.PI * 0.92 + wig * 0.1 + over * 0.6;
    const eyes = fail ? (over > 0 || s.dizzy ? 'dizzy' : 'blink') : happy ? 'happy' : (Math.floor(t * 2.2) % 7 === 3 ? 'blink' : 'open');
    drawCatHead(lerp(30, 27, p), lerp(27, 45, p), hrot, 0.78, { open, eyes, earL: p * 0.25, earR: p * 0.15, look: -0.4, whisk: 0, blep: v === 2 && p > 0.85 && !fail, big: v === 0 && p > 0.9 && !fail && !happy }, late);
    if (fail) sweatDrop(16, 30);
    PX.outline(TAB.out);
    late.forEach(f => f());
    return PX.end();
  });
}
// s: { t, v, r 蹭的方向（-1…1）, mood }
function drawRubArt2(s, who, pen = PXR, k = 4) {
  return withPen(pen, () => {
    PX.begin(96, 64, k, { reuse: true });
    const late = [], t = s.t, v = s.v || 0;
    const fail = s.mood === 'fail', happy = s.mood === 'happy';
    const L = LEGS[who] || LEGS.lin;
    const lx = 70;
    const legs = () => {
      if (L.bare) {
        PX.poly([[lx - 1, -1], [lx + 15, -1], [lx + 15, 12], [lx - 1, 12]], L.pants);
        PX.poly([[lx + 1, 12], [lx + 13, 12], [lx + 12, 54], [lx + 2, 54]], L.skin);
        PX.poly([[lx - 2, 54], [lx + 18, 54], [lx + 18, 59], [lx - 2, 59]], '#f2f2f2');
        PX.poly([[lx + 1, 51], [lx + 13, 51], [lx + 13, 55], [lx + 1, 55]], L.shoe);
      } else {
        PX.poly([[lx - 1, -1], [lx + 15, -1], [lx + 14, 52], [lx, 52]], L.pants);
        PX.line(lx + 7, 0, lx + 7, 50, TAB.out);
        PX.poly([[lx - 3, 52], [lx + 19, 52], [lx + 20, 59], [lx - 3, 59]], L.shoe);
      }
    };
    legs();
    const r = fail ? 0 : (s.r || 0), drop = fail ? 5 : 0, splay = fail ? 5 : 0;
    // 尾巴：v2 會繞到人的腳前面
    const tpts = [];
    if (v === 2 && !fail) { for (let i = 0; i < 14; i++) { const q = i / 13; tpts.push([22 + q * 52 + Math.sin(q * Math.PI) * -6, 40 - Math.sin(q * Math.PI) * 26 + q * 4 + Math.sin(t * 3 + q * 4) * 1.2]); } }
    else { for (let i = 0; i < 12; i++) { const q = i / 11; tpts.push([22 - q * 6 + Math.sin(q * 3 + t * 3) * 2, 44 - q * 32 * (fail ? 0.4 : 1) + (q > 0.85 ? (q - 0.85) * 30 : 0) * 0.3 + drop]); } tpts.push([tpts[11][0] + 3, tpts[11][1] - 2]); }
    if (!(v === 2 && !fail)) tail(tpts, 2.3);
    for (const [x, ph, sd] of [[27, 0, -1], [33, Math.PI, -1], [50, Math.PI, 1], [56, 0, 1]]) {
      const lift = fail ? 0 : Math.max(0, Math.sin(t * 6.5 + ph)) * 1.2;
      const fx = x + sd * splay;
      PX.ellipse(fx, 52 - lift + drop * 0.5, 3 + 1, 6 + 1, TAB.out); PX.ellipse(fx, 52 - lift + drop * 0.5, 3, 6, TAB.fur, { part: 1 });
      paw(fx + 1, 57 - lift, 3.8, 2.4);
    }
    const body = { x: 40 + r * 1.5, y: 43 + drop + Math.abs(r) * 0.6 };
    gearClose('rub', 'back', body);
    furBlob(body.x, body.y, 21, 10, -0.06 + r * 0.03, -0.5, 7);
    PX.ellipse(46 + r * 1.5, 49 + drop, 12, 4, TAB.cream, { rot: -0.06 });
    gearClose('rub', 'over', body);
    const push = v === 1 ? 3.4 : 1.6;
    drawCatHead(61 + r * push, 33 + drop + r * 1.6, -0.35 + r * 0.1, 0.72, { eyes: fail ? 'blink' : (v === 1 && r > 0.4) ? 'blink' : 'happy', earL: -0.3, earR: -0.25, whisk: r * 0.6 }, late);
    if (v === 1 && r > 0.6 && !fail) for (let i = 0; i < 3; i++) { const a = -0.9 + i * 0.6; PX.line(70 + Math.cos(a) * 3, 30 + Math.sin(a) * 3, 70 + Math.cos(a) * 7, 30 + Math.sin(a) * 7, TAB.out, { w: 1.4 }); }
    if (v === 2 && !fail) tail(tpts, 2.2);
    if (fail) sweatDrop(48, 22);
    PX.outline(TAB.out);
    late.forEach(f => f());
    return PX.end();
  });
}

// ---- 特寫的外框與背景 ----
class CuteCut {
  constructor(move, who) { this.move = move; this.who = who; this.t = 0; this.dur = 2.3; this.notes = []; }
  update(dt) {
    this.t += dt;
    if (this.move === 'meow') { if ((this.t > 0.35 && !this.n1) || (this.t > 1.15 && !this.n2)) { if (this.t > 1.15) this.n2 = 1; else this.n1 = 1; this.notes.push({ x: 60, y: 30, t: 0 }); } }
    for (const n of this.notes) n.t += dt;
    return this.t >= this.dur;
  }
  render(ctx) {
    const t = this.t, W = 96, H = 64, pw = W + 8, ph = H + 8;
    const kin = Math.min(1, t / 0.2), kout = Math.max(0, (t - (this.dur - 0.25)) / 0.25);
    const slide = (1 - smooth(kin)) * -(View.w) + smooth(kout) * View.w;
    const x = Math.round(View.w / 2 - pw / 2 + slide), y = Math.round(View.h * 0.4 - ph / 2);
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,24,0.45)'; ctx.fillRect(0, y - 6, View.w, ph + 12);
    ctx.fillStyle = OUTLINE; ctx.fillRect(x - 2, y - 2, pw + 4, ph + 4);
    ctx.fillStyle = '#fff3e8'; ctx.fillRect(x - 1, y - 1, pw + 2, ph + 2);
    // 背景：粉色加集中線
    const bg = this.move === 'rub' ? ['#ffd6e2', '#ffc1d3'] : this.move === 'belly' ? ['#ffe2c6', '#ffcfa8'] : ['#e3e1ff', '#cfcaff'];
    ctx.fillStyle = bg[0]; ctx.fillRect(x, y, pw, ph);
    const off = Math.floor(t * 40) % 12;
    ctx.beginPath(); ctx.rect(x, y, pw, ph); ctx.clip();
    for (let i = -ph; i < pw; i += 10) {
      ctx.fillStyle = bg[1];
      for (let j = 0; j < ph; j++) ctx.fillRect(x + i + j + ((off * 2) % 10), y + j, 4, 1);
    }
    // 檯面（影片裡的白色櫃子）
    if (this.move !== 'rub') {
      ctx.fillStyle = '#f4efe6'; ctx.fillRect(x, y + ph - 12, pw, 12);
      ctx.fillStyle = '#d9cfbf'; ctx.fillRect(x, y + ph - 12, pw, 1); ctx.fillRect(x, y + ph - 3, pw, 3);
    } else {
      ctx.fillStyle = '#c99a69'; ctx.fillRect(x, y + ph - 10, pw, 10);
      ctx.fillStyle = '#b4875a'; ctx.fillRect(x, y + ph - 10, pw, 1); ctx.fillRect(x, y + ph - 5, pw, 1);
    }
    const art = this.move === 'meow' ? drawMeowArt(t) : this.move === 'belly' ? drawBellyArt(t) : drawRubArt(t, this.who);
    ctx.drawImage(art, x + 4, y + 4);
    // 音符、愛心
    for (const n of this.notes) {
      const a = Math.max(0, 1 - n.t / 1.1);
      ctx.globalAlpha = a; drawSpr(ctx, G.S.emote.note, x + 4 + n.x + n.t * 10, y + 4 + n.y - n.t * 14, 0.5, 1); ctx.globalAlpha = 1;
    }
    if (this.move !== 'meow' && t > 0.9) {
      for (let i = 0; i < 3; i++) {
        const k = ((t - 0.9) * 0.9 + i / 3) % 1;
        ctx.globalAlpha = 1 - k;
        drawSpr(ctx, G.S.emote.heart, x + (this.move === 'rub' ? 62 : 30) + i * 8 - 8 + Math.sin(k * 6 + i) * 2, y + 30 - k * 24, 0.5, 1);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

// 標題畫面的大貓臉：趴著東張西望，偶爾喵一聲
function drawTitleCat(t, pen = PXR, k = 4) {
  return withPen(pen, () => {
  PX.begin(96, 64, k, { reuse: true });
  const late = [];
  const cyc = t % 6;
  const open = pulse(cyc, 3.2, 3.75);
  const look = Math.sin(t * 0.7) * 0.8;
  const blink = (cyc > 1.4 && cyc < 1.53) || (cyc > 4.6 && cyc < 4.73);
  const earL = cyc > 2.2 && cyc < 2.5 ? -0.3 * Math.sin((cyc - 2.2) / 0.3 * Math.PI) : 0;
  furBlob(48, 57, 34, 12, 0, 0.6, 9);
  PX.ellipse(48, 50, 11, 7, TAB.cream);
  paw(35, 60, 7.5, 3.8, -0.05); paw(61, 60, 7.5, 3.8, 0.05);
  drawCatHead(48, 30, Math.sin(t * 0.6) * 0.06, 1.12, { open, eyes: blink ? 'blink' : 'open', earL, earR: 0, look, whisk: Math.sin(t * 2) * 0.4 }, late);
  PX.outline(TAB.out);
  late.forEach(f => f());
  return PX.end();
  });
}

// ================= 場景裡的小虎斑貓 =================
const TABPAL = {
  A: '#b37645', L: '#d9a36a', D: '#8c5631', S: '#4a2b18', W: '#f5eadb', w: '#ddcab0',
  G: '#acd46c', E: '#15100b', P: '#d98b7d', I: '#eda290', M: '#3d1418', T: '#ea717e', K: '#24160d',
};
const TC_SIDE = [
  '.........A...A..',
  'S.......AIA.AIA.',
  'A.......ASASSAA.',
  'S......AALAAGEA.',
  'AS.....ALAAAAWWP',
  '.SDDSDDSDDSAAWW.',
  '..ASAASAASAAWW..',
  '..SAASAASAAW....',
  '..DLLLLLLLLD....',
  '...DD....DD.....',
  '...AA....AA.....',
  '...WW....WW.....',
];
const TC_SIDE_LEGS = [
  ['..DD......DD....', '..AA.......AA...', '..WW.......WW...'],
  ['...DD....DD.....', '...AA....AA.....', '...WW....WW.....'],
  ['....DD..DD......', '.....AA.AA......', '.....WW.WW......'],
  ['...DD....DD.....', '...AA....AA.....', '...WW....WW.....'],
];
const TC_SIDE_TAIL = [
  { 0: '................', 1: 'S...............', 2: 'A...............', 3: 'S...............', 4: 'AS..............' },
  { 0: 'S...............', 1: 'A...............', 2: 'S...............', 3: 'A...............', 4: 'AS..............' },
  { 0: '.S..............', 1: '.A..............', 2: 'S...............', 3: 'A...............', 4: 'AS..............' },
];
const TC_RUN = [
  ['.DD........DD...', 'AA...........AA.', 'WW...........WW.'],
  ['....DD..DD......', '.....AAAA.......', '.....WWWW.......'],
];
const TC_FRONT = [
  '.A........A.',
  'AIA......AIA',
  'AAASASSASAAA',
  'ALGEAAAAGELA',
  'AAAAAPPAAAAA',
  '.AWWWKKWWWA.',
  '..AWWWWWWA..',
  '..ASWWWWSA..',
  '..AAWWWWAA..',
  '..DAADDAAD..',
  '..AA....AA..',
  '..WW....WW..',
];
const TC_FRONT_LEGS = [
  ['..AA....AA..', '..WW....WW..'],
  ['..AA....WW..', '..WW........'],
  ['..AA....AA..', '..WW....WW..'],
  ['..WW....AA..', '........WW..'],
];
const TC_BACK = [
  '.A........A.',
  'AAA......AAA',
  'AAASASSASAAA',
  'AASAAAAAASAA',
  '.AAAASSAAAA.',
  '..ADDDDDDA.S',
  '.ASAASSAASAS',
  '.AAAAAAAAAS.',
  '.ASAASSAASA.',
  '..AAAAAAAA..',
  '..AA....AA..',
  '..DD....DD..',
];
const TC_LOAF = [
  '.A........A.',
  'AIA......AIA',
  'AAASASSASAAA',
  'ALGEAAAAGELA',
  'AAAAAPPAAAAA',
  '.AWWWKKWWWA.',
  'AAAAWWWWAAAA',
  'ASAAWWWWAASA',
  'AAAAAAAAAAAA',
  '.LLL....LLL.',
];
const TC_BELLY = [
  '.....A.A...A.A..',
  '.....W.W...W.W..',
  '.WW..AAA...AAA..',
  'WPWWAWWWWWWWWWA.',
  'GEGEAWWWWWWWWWAS',
  'ASSAAAAAAAAAAAAS',
  'I.IAAASASASASA.S',
];
const TC_BELLY_B = override(TC_BELLY, { 0: '....A..A....AA..', 1: '....W..W....WW..', 2: '.WW..AAA...AAA..' });

function makeTabbySprites() {
  const b = rows => buildSprite(rows, TABPAL);
  const side = (legs, tail, extra) => {
    let r = override(TC_SIDE, { 9: legs[0], 10: legs[1], 11: legs[2] });
    if (tail) { r = r.map((row, i) => tail[i] !== undefined ? tail[i].slice(0, 2) + row.slice(2) : row); }
    if (extra) r = override(r, extra);
    return r;
  };
  const S = {};
  S.walkR = TC_SIDE_LEGS.map((l, i) => b(side(l, TC_SIDE_TAIL[i % 3])));
  S.runR = TC_RUN.map((l, i) => b(side(l, TC_SIDE_TAIL[2 - i])));
  S.standR = [0, 1, 2].map(i => b(side(TC_SIDE_LEGS[1], TC_SIDE_TAIL[i])));
  S.blinkR = b(side(TC_SIDE_LEGS[1], TC_SIDE_TAIL[0], { 3: 'S......AALAADDA.' }));
  S.meowR = b(side(TC_SIDE_LEGS[1], TC_SIDE_TAIL[1], { 5: '.SDDSDDSDDSAAMT.' }));
  S.rubR = b(side(TC_SIDE_LEGS[1], TC_SIDE_TAIL[2], { 3: 'S......AALAADDA.', 2: 'A.......ASASSAA.' }));
  for (const k of ['walkR', 'runR', 'standR']) S[k.replace('R', 'L')] = S[k].map(flipCanvas);
  S.blinkL = flipCanvas(S.blinkR); S.meowL = flipCanvas(S.meowR); S.rubL = flipCanvas(S.rubR);
  S.walkD = TC_FRONT_LEGS.map(l => b(override(TC_FRONT, { 10: l[0], 11: l[1] })));
  S.walkU = TC_FRONT_LEGS.map(l => b(override(TC_BACK, { 10: l[0].replace(/W/g, 'D'), 11: l[1].replace(/W/g, 'D') })));
  S.loaf = b(TC_LOAF);
  S.loafL = b(override(TC_LOAF, { 3: 'ALEGAAAAEGLA' }));
  S.loafR = b(override(TC_LOAF, { 3: 'ALGEAAAAGELA' }));
  S.loafBlink = b(override(TC_LOAF, { 3: 'ALDDAAAADDLA' }));
  S.loafMeow = b(override(TC_LOAF, { 5: '.AWWMTTMWWA.' }));
  S.loafYawn = b(override(TC_LOAF, { 3: 'ALDDAAAADDLA', 4: 'AAAAAPPAAAAA', 5: '.AWMMTTMMWA.', 6: 'AAAAWMMWAAAA' }));
  S.loafEar = b(override(TC_LOAF, { 0: '..........A.', 1: 'AA.......AIA', 2: 'AAASASSASAAA' }));
  S.belly = [b(TC_BELLY), b(TC_BELLY_B)];
  return S;
}
