// ================= 向量畫筆：跟 PXR 一樣的介面，畫出平滑的卡通線條 =================
// 座標用「邏輯像素」，k 是放大倍率。part / only 用遮罩模擬 PXR 的「只畫在某部位上」。
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}

const VXR = {
  k: 4, w: 0, h: 0, pad: 0, cv: null, g: null, masks: {}, maskG: {}, tmp: null, tg: null,
  batchOnly: 0, batchHas: false, keep: null,
  begin(w, h, k = 4, o = {}) {
    this.k = k; this.w = w; this.h = h; this.pad = o.pad === undefined ? 2 : o.pad;
    const W = Math.ceil((w + this.pad * 2) * k), H = Math.ceil((h + this.pad * 2) * k);
    if (o.reuse) {
      if (!this.keep || this.keep.width !== W || this.keep.height !== H) this.keep = makeCanvas(W, H);
      this.cv = this.keep;
    } else this.cv = makeCanvas(W, H);
    this.g = this.cv.getContext('2d');
    this.g.setTransform(1, 0, 0, 1, 0, 0); this.g.clearRect(0, 0, W, H);
    this.g.setTransform(k, 0, 0, k, this.pad * k, this.pad * k);
    this.g.lineCap = 'round'; this.g.lineJoin = 'round';
    if (!this.tmp || this.tmp.width < W || this.tmp.height < H) { this.tmp = makeCanvas(Math.max(W, this.tmp ? this.tmp.width : 0), Math.max(H, this.tmp ? this.tmp.height : 0)); this.tg = this.tmp.getContext('2d'); }
    this.W = W; this.H = H;
    for (const p in this.masks) this.maskG[p].setTransform(1, 0, 0, 1, 0, 0), this.maskG[p].clearRect(0, 0, this.masks[p].width, this.masks[p].height);
    this.used = {};
    this.batchOnly = 0; this.batchHas = false;
    this.clearTmp();
  },
  c(hex) { return hex; },
  clearTmp() {
    const t = this.tg; t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, this.W, this.H);
    t.setTransform(this.k, 0, 0, this.k, this.pad * this.k, this.pad * this.k);
    t.lineCap = 'round'; t.lineJoin = 'round';
  },
  mask(p) {
    let m = this.masks[p];
    if (!m || m.width < this.W || m.height < this.H) {
      m = makeCanvas(Math.max(this.W, m ? m.width : 0), Math.max(this.H, m ? m.height : 0));
      this.masks[p] = m; this.maskG[p] = m.getContext('2d');
    }
    const g = this.maskG[p];
    g.setTransform(this.k, 0, 0, this.k, this.pad * this.k, this.pad * this.k);
    g.lineCap = 'round'; g.lineJoin = 'round';
    return g;
  },
  flush() {
    if (!this.batchHas) { this.batchOnly = 0; return; }
    const t = this.tg, p = this.batchOnly;
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalCompositeOperation = 'destination-in';
    if (this.used[p]) t.drawImage(this.masks[p], 0, 0);
    else t.clearRect(0, 0, this.W, this.H);
    t.globalCompositeOperation = 'source-over';
    this.g.save(); this.g.setTransform(1, 0, 0, 1, 0, 0); this.g.drawImage(this.tmp, 0, 0, this.W, this.H, 0, 0, this.W, this.H); this.g.restore();
    this.batchHas = false; this.batchOnly = 0;
    this.clearTmp();
  },
  // 畫一個形狀：fn(ctx) 建立路徑後呼叫 fill 或 stroke
  shape(o, paint) {
    const only = o && o.only, part = o && o.part;
    if (only) {
      if (this.batchHas && this.batchOnly !== only) this.flush();
      this.batchOnly = only; this.batchHas = true;
      paint(this.tg);
      return;
    }
    if (this.batchHas) this.flush();
    paint(this.g);
    if (part) {
      for (const q in this.masks) {
        if (+q === part || !this.used[q]) continue;
        const g = this.mask(q); g.globalCompositeOperation = 'destination-out'; paint(g, '#000'); g.globalCompositeOperation = 'source-over';
      }
      const g = this.mask(part); paint(g, '#fff'); this.used[part] = true;
    }
  },
  ellipse(cx, cy, rx, ry, hex, o = {}) {
    if (rx <= 0 || ry <= 0) return;
    this.shape(o, (g, col) => { g.fillStyle = col || hex; g.beginPath(); g.ellipse(cx, cy, rx, ry, o.rot || 0, 0, Math.PI * 2); g.fill(); });
  },
  poly(pts, hex, o = {}) {
    if (pts.length < 3) return;
    this.shape(o, (g, col) => { g.fillStyle = col || hex; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill('evenodd'); });
  },
  line(x0, y0, x1, y1, hex, o = {}) {
    const w = o.w || (o.thick ? 1.7 : 1);
    this.shape(o, (g, col) => { g.strokeStyle = col || hex; g.lineWidth = w; g.beginPath(); g.moveTo(x0 + 0.5, y0 + 0.5); g.lineTo(x1 + 0.5, y1 + 0.5); g.stroke(); });
  },
  // 平滑曲線：穿過每個點（Catmull-Rom）
  curve(pts, hex, o = {}) {
    if (pts.length < 2) return;
    const w = o.w || (o.thick ? 1.7 : 1);
    this.shape(o, (g, col) => {
      g.strokeStyle = col || hex; g.lineWidth = w; g.beginPath();
      const P = pts.map(([x, y]) => [x + 0.5, y + 0.5]);
      g.moveTo(P[0][0], P[0][1]);
      if (P.length === 2) g.lineTo(P[1][0], P[1][1]);
      else for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
        g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
      }
      g.stroke();
    });
  },
  polyEdge(pts, hex, o = {}) {
    const w = o.w || 1;
    this.shape(o, (g, col) => { g.strokeStyle = col || hex; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke(); });
  },
  put(x, y, hex, part, only) {
    this.shape({ part, only }, (g, col) => { g.fillStyle = col || hex; g.beginPath(); g.arc(x + 0.5, y + 0.5, 0.62, 0, Math.PI * 2); g.fill(); });
  },
  // 外框：整個剪影往外長一圈
  outline(hex, r = 1) {
    this.flush();
    dilateInto(this.cv, r * this.k, hex);
    this.g.setTransform(this.k, 0, 0, this.k, this.pad * this.k, this.pad * this.k);
  },
  end() { this.flush(); this.g.setTransform(1, 0, 0, 1, 0, 0); return this.cv; },
};

// 把 canvas 的剪影往外擴 r 像素並塗上 color（原圖保留在上面）
const DIL = { cv: null, g: null };
function dilateInto(cv, r, color) {
  const W = cv.width, H = cv.height;
  if (!DIL.cv || DIL.cv.width < W || DIL.cv.height < H) { DIL.cv = makeCanvas(Math.max(W, DIL.cv ? DIL.cv.width : 0), Math.max(H, DIL.cv ? DIL.cv.height : 0)); DIL.g = DIL.cv.getContext('2d'); }
  const t = DIL.g;
  t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, W, H);
  for (const rr of r > 1.6 ? [r, r * 0.5] : [r]) {
    const n = Math.max(8, Math.ceil(2 * Math.PI * rr / 1.4));
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; t.drawImage(cv, Math.cos(a) * rr, Math.sin(a) * rr); }
  }
  t.drawImage(cv, 0, 0);
  t.globalCompositeOperation = 'source-in'; t.fillStyle = color; t.fillRect(0, 0, W, H);
  t.globalCompositeOperation = 'source-over';
  const g = cv.getContext('2d');
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-over'; g.drawImage(DIL.cv, 0, 0, W, H, 0, 0, W, H); g.restore();
}

// 把 PXR 的畫法切到向量版：PX 是目前用的畫筆
let PX = null;
function withPen(pen, fn) { const old = PX; PX = pen; try { return fn(); } finally { PX = old; } }
