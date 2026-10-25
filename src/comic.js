// ================= 漫畫風的疊加圖層：表情符號、懷疑條、狀聲詞、賣萌特寫 =================
const CM = {
  ink: '#1d1526',
  // 有粗描邊的字
  text(g, x, y, txt, col = '#fff', size = 16, a = 1, o = {}) {
    g.save(); g.globalAlpha = a;
    g.font = `${o.weight || 900} ${size}px ${o.font || BOLD_FONT}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
    g.lineWidth = Math.max(3, size * 0.28); g.strokeStyle = o.stroke || this.ink; g.strokeText(txt, x, y);
    g.fillStyle = col; g.fillText(txt, x, y);
    g.restore();
  },
  emote(g, x, y, kind, s = 1, a = 1) {
    g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
    g.lineWidth = 2.6; g.strokeStyle = this.ink; g.lineJoin = 'round';
    if (kind === 'q' || kind === 'ex') {
      // 漫畫對話泡泡
      g.fillStyle = kind === 'q' ? '#ffe066' : '#ff5a5a';
      g.beginPath(); g.moveTo(-3, -6); g.lineTo(0, 2); g.lineTo(4, -6); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(0, -16, 12, 11, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = kind === 'q' ? '#3a2a10' : '#fff';
      g.font = `900 17px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(kind === 'q' ? '?' : '!', 0, -15.5);
    } else if (kind === 'heart') {
      g.fillStyle = '#ff6d9a';
      g.beginPath(); g.moveTo(0, -2); g.bezierCurveTo(-13, -11, -9, -24, 0, -17); g.bezierCurveTo(9, -24, 13, -11, 0, -2); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(-4.5, -16, 2.4, 1.6, -0.6, 0, 7); g.fill();
    } else if (kind === 'z') {
      this.text(g, -2, -10, 'Z', '#cfe0ff', 13, 1); this.text(g, 7, -20, 'z', '#cfe0ff', 10, 0.85);
    } else if (kind === 'note') {
      g.fillStyle = '#fff6e8';
      g.beginPath(); g.ellipse(-3, -4, 4.4, 3.4, -0.4, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(1, -5); g.lineTo(1, -22); g.lineTo(8, -18); g.stroke();
    } else if (kind === 'anger') {
      g.strokeStyle = '#ff4a4a'; g.lineWidth = 3.2;
      for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2); g.beginPath(); g.moveTo(2, -4); g.quadraticCurveTo(3, -12, 9, -10); g.stroke(); g.restore(); }
    } else if (kind === 'dots') {
      g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-7 + i * 7, -6, 2.4, 0, 7); g.fill(); g.stroke(); }
    }
    g.restore();
  },
  bar(g, x, y, v, alert) {
    const w = 34, h = 7;
    g.fillStyle = this.ink; this.rr(g, x - w / 2 - 2, y - 2, w + 4, h + 4, 5); g.fill();
    g.fillStyle = '#3a3555'; this.rr(g, x - w / 2, y, w, h, 3.5); g.fill();
    g.fillStyle = alert ? '#ff7a5a' : '#ffd25a'; this.rr(g, x - w / 2, y, Math.max(3, w * v), h, 3.5); g.fill();
  },
  rr(g, x, y, w, h, r) { rrect(g, x, y, w, h, r); },
  marker(g, x, y, t) {
    const b = Math.sin(t * 6) * 3;
    g.save(); g.translate(x, y + b);
    g.fillStyle = '#ffd25a'; g.strokeStyle = this.ink; g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(-8, -10); g.lineTo(8, -10); g.lineTo(0, 0); g.closePath(); g.fill(); g.stroke();
    g.restore();
  },
  talk(g, x, y, t) {
    g.save(); g.translate(x, y);
    g.fillStyle = '#fff8ec'; g.strokeStyle = this.ink; g.lineWidth = 2.4;
    this.rr(g, -15, -22, 30, 17, 8); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-4, -5.5); g.lineTo(0, 1); g.lineTo(3, -5.5); g.fill(); g.stroke();
    g.fillStyle = '#fff8ec'; g.fillRect(-4, -8, 8, 3.5);
    const d = Math.floor(t * 3) % 3;
    for (let i = 0; i < 3; i++) { g.fillStyle = i <= d ? this.ink : '#b9b4d6'; g.beginPath(); g.arc(-7 + i * 7, -13.5, 2.2, 0, 7); g.fill(); }
    g.restore();
  },
  homeArrow(g, x, y, a, t) {
    g.save(); g.translate(x, y); g.rotate(a);
    const p = 1 + Math.sin(t * 5) * 0.08; g.scale(p, p);
    g.fillStyle = '#ffd25a'; g.strokeStyle = this.ink; g.lineWidth = 3;
    g.beginPath(); g.moveTo(14, 0); g.lineTo(-2, -12); g.lineTo(-2, -5); g.lineTo(-13, -5); g.lineTo(-13, 5); g.lineTo(-2, 5); g.lineTo(-2, 12); g.closePath(); g.fill(); g.stroke();
    g.restore();
  },
  ring(g, x, y, rx, ry, col, a) {
    g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), 0, 0, 7); g.stroke(); g.restore();
  },
};

// FX（漂浮的字、愛心）畫在 3D 上面
FX.prototype.draw3D = function (g) {
  const s = R3.ppu || 40;
  for (const f of this.list) {
    if (f.delay > 0) continue;
    const a = clamp(f.life / Math.min(0.4, f.max), 0, 1);
    if (f.k === 'ring') continue;   // 聲波畫在地上
    const [sx, sy] = R3.at(f.x, f.y, f.h !== undefined ? f.h : 0.75);
    const up = (1 - f.life / f.max);
    if (f.k === 'txt') {
      const pop = Math.min(1, (f.max - f.life) / 0.12);
      const size = Math.round(s * 0.42 * (f.big || 1) * (0.7 + 0.3 * pop));
      if (f.coin) {
        // 金幣 + 金額
        const w = g.measureText ? size * 0.55 * f.txt.length : 0;
        g.save(); g.globalAlpha = a; g.translate(sx - w / 2 - size * 0.55, sy - 6);
        g.fillStyle = '#ffd84d'; g.strokeStyle = CM.ink; g.lineWidth = 2.4; g.beginPath(); g.arc(0, 0, size * 0.42, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#e0a420'; g.beginPath(); g.arc(0, 0, size * 0.24, 0, 7); g.fill();
        g.restore();
      }
      CM.text(g, sx, sy - 6, f.txt, f.color, size, a);
    } else if (f.k === 'spr') {
      const kind = f.spr === G.S.emote.heart ? 'heart' : f.spr === G.S.emote.note ? 'note' : 'heart';
      CM.emote(g, sx, sy, kind, s / 44, a);
    }
  }
};
FX.prototype.rings3D = function (F) {
  for (const f of this.list) {
    if (f.k !== 'ring' || f.delay > 0) continue;
    const t = 1 - f.life / f.max, a = clamp(f.life / Math.min(0.4, f.max), 0, 1);
    const m = /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(f.color) || [0, 255, 255, 255, 0.6];
    ringVerts(F.decalAdd, f.x / TS, f.y / TS, Math.max(0.05, f.r * t / TS), 0.22, [m[1] / 255, m[2] / 255, m[3] / 255, (+m[4]) * a * 0.9]);
  }
};

// 賣萌特寫：漫畫格子 + 向量畫的虎斑貓
CuteCut.prototype.render3D = function (g, W, H) {
  const t = this.t;
  const pw = Math.min(W - 24, 440), ph = pw * (72 / 104);
  const kin = Math.min(1, t / 0.2), kout = Math.max(0, (t - (this.dur - 0.25)) / 0.25);
  const slide = (1 - smooth(kin)) * -W + smooth(kout) * W;
  const x = W / 2 - pw / 2 + slide, y = H * 0.38 - ph / 2;
  g.save();
  // 背後壓暗
  g.fillStyle = `rgba(10,8,24,${0.35 * Math.min(kin, 1 - kout)})`; g.fillRect(0, 0, W, H);
  g.translate(x + pw / 2, y + ph / 2); g.rotate(-0.025);
  const L = -pw / 2, T = -ph / 2;
  // 框
  g.fillStyle = CM.ink; g.fillRect(L - 5, T - 5, pw + 10, ph + 10);
  g.fillStyle = '#fff6e8'; g.fillRect(L - 2, T - 2, pw + 4, ph + 4);
  const bg = this.move === 'rub' ? ['#ffd6e2', '#ffb3c9'] : this.move === 'belly' ? ['#ffe6c8', '#ffc996'] : ['#e5e2ff', '#c9c2ff'];
  g.beginPath(); g.rect(L, T, pw, ph); g.clip();
  g.fillStyle = bg[0]; g.fillRect(L, T, pw, ph);
  // 集中線
  g.save(); g.translate(pw * 0.08, -ph * 0.05);
  const spin = t * 0.6;
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * Math.PI * 2 + spin, a2 = a + 0.06 + (i % 3) * 0.02;
    g.fillStyle = bg[1]; g.beginPath(); g.moveTo(Math.cos(a) * pw * 0.18, Math.sin(a) * pw * 0.18); g.lineTo(Math.cos(a) * pw, Math.sin(a) * pw); g.lineTo(Math.cos(a2) * pw, Math.sin(a2) * pw); g.closePath(); g.fill();
  }
  g.restore();
  // 網點
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (let yy = T + 6; yy < T + ph; yy += 9) for (let xx = L + ((yy / 9) % 2) * 4.5; xx < L + pw; xx += 9) { const r = 1.6 * (1 - Math.abs((yy - T) / ph - 0.5)); g.beginPath(); g.arc(xx, yy, r, 0, 7); g.fill(); }
  // 檯面
  if (this.move !== 'rub') { g.fillStyle = '#f7f1e6'; g.fillRect(L, T + ph * 0.83, pw, ph * 0.17); g.fillStyle = '#ddd2c0'; g.fillRect(L, T + ph * 0.83, pw, 3); }
  else { g.fillStyle = '#d29a5f'; g.fillRect(L, T + ph * 0.86, pw, ph * 0.14); g.fillStyle = '#a8703c'; g.fillRect(L, T + ph * 0.86, pw, 3); }
  // 貓
  const k = Math.max(2, Math.min(4, (pw / 104) * (R3.dpr || 2)));
  // 特寫每秒重畫 24 次就夠了，省電
  if (!this.art || t - this.artT >= 1 / 24 || this.artK !== k) {
    const a = this.move === 'meow' ? drawMeowArt(t, VXR, k) : this.move === 'belly' ? drawBellyArt(t, VXR, k) : drawRubArt(t, this.who, VXR, k);
    if (!this.art || this.art.width !== a.width || this.art.height !== a.height) this.art = makeCanvas(a.width, a.height);
    const ag = this.art.getContext('2d'); ag.clearRect(0, 0, a.width, a.height); ag.drawImage(a, 0, 0);
    this.artT = t; this.artK = k;
  }
  const art = this.art;
  const s = pw / 104, pad = VXR.pad;
  g.drawImage(art, L + (4 - pad) * s, T + (4 - pad) * s, art.width / k * s, art.height / k * s);
  // 狀聲詞
  const word = this.move === 'meow' ? '喵～' : this.move === 'belly' ? '咕嚕嚕' : '蹭蹭';
  const pop = Math.min(1, Math.max(0, (t - 0.3) / 0.15));
  if (pop > 0) CM.text(g, L + pw * 0.8, T + ph * 0.2, word, '#fff', Math.round(pw * 0.085 * (0.6 + 0.4 * pop)), 1, { rot: 0.12, stroke: '#c43a6a' });
  // 音符、愛心
  for (const n of this.notes) { const a = Math.max(0, 1 - n.t / 1.1); CM.emote(g, L + (n.x + n.t * 10) * s, T + (n.y - n.t * 14) * s, 'note', s * 0.9, a); }
  if (this.move !== 'meow' && t > 0.9) for (let i = 0; i < 3; i++) {
    const q = ((t - 0.9) * 0.9 + i / 3) % 1;
    CM.emote(g, L + ((this.move === 'rub' ? 62 : 30) + i * 8 - 8 + Math.sin(q * 6 + i) * 2) * s, T + (30 - q * 24) * s, 'heart', s * 0.7, 1 - q);
  }
  g.restore();
};

// 標題的大貓臉（向量版）
function titleCatCanvas() {
  const c = makeCanvas(192, 128);
  const g = c.getContext('2d');
  return { c, draw(t) { const a = drawTitleCat(t, VXR, 2); g.clearRect(0, 0, 192, 128); g.drawImage(a, 0, 0, 192 + VXR.pad * 4, 128 + VXR.pad * 4); } };
}
