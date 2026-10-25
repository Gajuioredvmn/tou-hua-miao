// ================= 花店的佈置：地板、牆、花桶、綠植、包花台、黑板花單 =================
// 佈置等級（store.decor）：
// 0 舊倉庫：磨石子地板、紅色塑膠水桶、牆角堆著塑膠籃
// 1 人字拼木地板＋三層鐵桶花架＋左牆長凳（擺得下所有的花，空位放綠葉）
// 2 墨綠色的牆、乾燥花吊掛、龜背芋和琴葉榕、櫥窗吊盆
// 3 包花工作台、黑板花單、櫥窗金字、地毯

// ---------- 地板 ----------
// 磨石子：灰灰的、銅條分格、裂縫和污漬（還沒整理的店）
function paintTerrazzo(g, X, Y, W, H, P, R) {
  // 石子先畫在一小塊磚上再鋪滿（畫幾萬顆石子太慢）
  const TW = 256, [tc, tg] = cvs(TW, TW);
  tg.fillStyle = '#a49e91'; tg.fillRect(0, 0, TW, TW);
  const chips = ['#d6d0c0', '#77736a', '#c0af97', '#8b8679', '#e8e2d2', '#6c786a', '#b0896c', '#5b5853'];
  for (let i = 0; i < 2600; i++) {
    const x = R() * TW, y = R() * TW, r = 0.7 + R() * 2.2, a0 = R() * 6;
    tg.fillStyle = chips[Math.floor(R() * chips.length)];
    tg.beginPath();
    for (let k = 0; k < 5; k++) { const a = a0 + k / 5 * Math.PI * 2, rr = r * (0.6 + R() * 0.5); k ? tg.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : tg.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    tg.closePath(); tg.fill();
  }
  g.fillStyle = g.createPattern(tc, 'repeat'); g.fillRect(X, Y, W, H);
  for (let i = 0; i < W * H / (P * P) * 0.5; i++) {
    const x = X + R() * W, y = Y + R() * H, r = (0.5 + R() * 1.0) * P;
    const gr = g.createRadialGradient(x, y, 1, x, y, r);
    const c = R() < 0.5 ? 'rgba(80,70,55,' : 'rgba(240,235,220,';
    gr.addColorStop(0, c + '0.12)'); gr.addColorStop(1, c + '0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // 銅條分格
  g.strokeStyle = 'rgba(146,118,62,0.8)'; g.lineWidth = 2;
  for (let x = X - (X % (2 * P)); x <= X + W; x += 2 * P) { g.beginPath(); g.moveTo(x, Y); g.lineTo(x, Y + H); g.stroke(); }
  for (let y = Y - (Y % (2 * P)); y <= Y + H; y += 2 * P) { g.beginPath(); g.moveTo(X, y); g.lineTo(X + W, y); g.stroke(); }
  // 污漬、裂縫、補過的水泥
  for (let i = 0; i < 7; i++) {
    const x = X + R() * W, y = Y + R() * H, r = (0.3 + R() * 0.6) * P;
    const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(70,55,40,0.22)'); gr.addColorStop(1, 'rgba(70,55,40,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.3, r, R() * 3, 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(55,48,42,0.55)'; g.lineWidth = 1.3;
  for (let i = 0; i < 6; i++) { let x = X + R() * W, y = Y + R() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (R() - 0.5) * P * 0.5; y += (R() - 0.3) * P * 0.35; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(150,146,138,0.85)'; rrect(g, X + R() * (W - P), Y + R() * (H - P), P * (0.4 + R() * 0.5), P * (0.3 + R() * 0.3), 6); g.fill(); }
}
// 人字拼木地板（深一點的胡桃木色，上一層亮光漆）
function paintChevron(g, X, Y, W, H, P, R) {
  const cw = P * 0.5, ph = P * 0.25;
  const cols = ['#7a5a40', '#6e4f37', '#856346', '#654733', '#8c6a4c', '#5f432f', '#775539', '#80603f'];
  g.fillStyle = '#35231a'; g.fillRect(X, Y, W, H);
  const c0 = Math.floor(X / cw) - 1, c1 = Math.ceil((X + W) / cw) + 1;
  for (let c = c0; c <= c1; c++) {
    const x0 = c * cw, x1 = x0 + cw, d = ((c % 2) + 2) % 2 === 0 ? 1 : -1;
    const k0 = Math.floor((Y - 2 * cw) / ph) - 1, k1 = Math.ceil((Y + H + cw) / ph) + 1;
    for (let k = k0; k <= k1; k++) {
      const y0 = k * ph + (d > 0 ? 0 : cw), y1 = y0 + d * cw;
      const col = cols[Math.floor(R() * cols.length)];
      g.fillStyle = col;
      g.beginPath(); g.moveTo(x0 + 0.6, y0 + 0.7); g.lineTo(x1 - 0.6, y1 + 0.7); g.lineTo(x1 - 0.6, y1 + ph - 0.7); g.lineTo(x0 + 0.6, y0 + ph - 0.7); g.closePath(); g.fill();
      // 木紋
      g.strokeStyle = 'rgba(45,28,16,0.28)'; g.lineWidth = 0.8;
      for (let i = 0; i < 1; i++) { const f = 0.25 + R() * 0.5; g.beginPath(); g.moveTo(x0 + 1, y0 + ph * f); g.bezierCurveTo(x0 + cw * 0.35, y0 + d * cw * 0.35 + ph * (f + (R() - 0.5) * 0.3), x0 + cw * 0.7, y0 + d * cw * 0.7 + ph * f, x1 - 1, y1 + ph * f); g.stroke(); }
      if (R() < 0.05) { g.fillStyle = 'rgba(50,30,18,0.55)'; g.beginPath(); g.ellipse(x0 + cw * (0.3 + R() * 0.4), y0 + d * cw * 0.5 + ph * 0.5, 2.2, 1.4, d * 0.78, 0, 7); g.fill(); }
    }
  }
  // 亮光漆的反光
  for (let i = 0; i < 5; i++) {
    const x = X + R() * W, y = Y + R() * H, r = (1.2 + R() * 1.5) * P;
    const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(255,236,205,0.07)'); gr.addColorStop(1, 'rgba(255,236,205,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

// ---------- 牆 ----------
// 墨綠色灰泥牆＋深色木腰板＋黃銅線、植物畫、門楣上的店徽
function paintShopWallChic(w, h, o = {}) {
  const P = PPU, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  const R = rng(o.seed || 41), Y = v => H - v * P;
  g.fillStyle = '#3b5848'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < w * 14; i++) {
    const x = R() * W, y = R() * H, r = (0.25 + R() * 0.7) * P;
    const gr = g.createRadialGradient(x, y, 1, x, y, r); const cc = R() < 0.55 ? 'rgba(255,255,240,' : 'rgba(10,25,18,';
    gr.addColorStop(0, cc + '0.05)'); gr.addColorStop(1, cc + '0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // 腰板
  g.fillStyle = '#4b3324'; g.fillRect(0, Y(1.06), W, 1.06 * P);
  for (let x = 0; x < W; x += P * 0.55) { g.strokeStyle = '#674733'; g.lineWidth = 2; g.strokeRect(x + 5, Y(0.98), P * 0.55 - 10, 0.82 * P); }
  g.fillStyle = '#c9a65a'; g.fillRect(0, Y(1.08), W, 3);
  g.fillStyle = 'rgba(201,166,90,0.85)'; g.fillRect(0, Y(2.44), W, 2);
  // 後門：深綠色、黃銅門把、「工作室」
  if (o.door !== undefined) {
    const dx = o.door * P + 0.12 * P, dw = 0.76 * P, top = Y(1.75);
    g.fillStyle = '#22332a'; g.fillRect(dx - 5, top - 5, dw + 10, Y(0) - top + 5);
    g.fillStyle = '#2e463a'; g.fillRect(dx, top, dw, Y(0) - top);
    g.strokeStyle = '#1f2e26'; g.lineWidth = 2; g.strokeRect(dx + 6, top + 8, dw - 12, (Y(0) - top) * 0.42); g.strokeRect(dx + 6, top + 14 + (Y(0) - top) * 0.42, dw - 12, (Y(0) - top) * 0.45);
    g.fillStyle = '#d8c48a'; g.fillRect(dx + 12, top + 14, dw - 24, (Y(0) - top) * 0.3);
    g.fillStyle = 'rgba(255,250,230,0.35)'; g.beginPath(); g.moveTo(dx + 14, top + 16); g.lineTo(dx + 24, top + 16); g.lineTo(dx + 16, top + 12 + (Y(0) - top) * 0.3); g.lineTo(dx + 14, top + 12 + (Y(0) - top) * 0.3); g.fill();
    g.fillStyle = '#e0bd62'; g.beginPath(); g.arc(dx + dw - 10, Y(0.85), 3.5, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(dx - 5, top - 5, dw + 10, Y(0) - top + 5);
    g.fillStyle = '#f2ead8'; rrect(g, dx + dw / 2 - 20, top - 22, 40, 14, 3); g.fill();
    g.fillStyle = '#3b5848'; g.font = `10px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('工作室', dx + dw / 2, top - 14.5);
    // 門楣上的金色店徽：貓＋花
    const ex = dx + dw / 2, ey = Y(2.08), er = P * 0.2;
    g.strokeStyle = '#d6b45e'; g.lineWidth = 3; g.beginPath(); g.arc(ex, ey, er, 0, 7); g.stroke();
    g.lineWidth = 1.2; g.beginPath(); g.arc(ex, ey, er - 4, 0, 7); g.stroke();
    g.fillStyle = '#d6b45e';
    g.beginPath(); g.moveTo(ex - 6, ey + 4); g.lineTo(ex - 6, ey - 3); g.lineTo(ex - 4, ey - 7); g.lineTo(ex - 1, ey - 3); g.lineTo(ex + 1, ey - 3); g.lineTo(ex + 4, ey - 7); g.lineTo(ex + 6, ey - 3); g.lineTo(ex + 6, ey + 4); g.closePath(); g.fill();
    for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(ex + 8 + Math.cos(a * 1.26) * 2.4, ey - 5 + Math.sin(a * 1.26) * 2.4, 1.7, 0, 7); g.fill(); }
  }
  // 植物畫
  for (const [px, kind] of (o.prints || [])) {
    const X0 = px * P - P * 0.28, y = Y(2.22), pw = P * 0.56, ph = P * 0.74;
    g.fillStyle = '#1e1a18'; g.fillRect(X0 - 4, y - 4, pw + 8, ph + 8);
    g.fillStyle = '#efe6d0'; g.fillRect(X0, y, pw, ph);
    g.strokeStyle = '#5c7a52'; g.lineWidth = 1.6;
    const cx = X0 + pw / 2;
    if (kind === 0) {
      // 一枝葉子
      g.beginPath(); g.moveTo(cx, y + ph - 6); g.quadraticCurveTo(cx - 2, y + ph * 0.5, cx + 2, y + 8); g.stroke();
      for (let i = 0; i < 5; i++) { const yy = y + ph - 12 - i * ph * 0.15, s = i % 2 ? 1 : -1; g.fillStyle = i % 2 ? '#7a9a6a' : '#5c7a52'; g.beginPath(); g.ellipse(cx + s * 6, yy, 6, 2.6, s * 0.5, 0, 7); g.fill(); }
    } else {
      // 一朵玫瑰
      g.beginPath(); g.moveTo(cx, y + ph - 6); g.lineTo(cx, y + ph * 0.42); g.stroke();
      g.fillStyle = '#6a8a5a'; g.beginPath(); g.ellipse(cx - 5, y + ph * 0.62, 5, 2.2, -0.5, 0, 7); g.fill();
      g.fillStyle = '#c9707a'; g.beginPath(); g.arc(cx, y + ph * 0.34, 7, 0, 7); g.fill();
      g.strokeStyle = '#8e3a46'; g.lineWidth = 1; g.beginPath(); g.arc(cx, y + ph * 0.34, 4, 0.5, 5.2); g.stroke();
    }
    g.fillStyle = '#8a7c66'; g.fillRect(X0 + 6, y + ph - 6, pw - 12, 1.2);
  }
  // 黃銅時鐘
  if (o.clock !== undefined) {
    const X0 = o.clock * P, y = Y(1.98), r = P * 0.2;
    g.fillStyle = '#f4ecda'; g.beginPath(); g.arc(X0, y, r, 0, 7); g.fill(); g.strokeStyle = '#c9a65a'; g.lineWidth = 4; g.stroke();
    g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X0, y); g.lineTo(X0 + r * 0.1, y - r * 0.68); g.moveTo(X0, y); g.lineTo(X0 + r * 0.48, y + r * 0.12); g.stroke();
  }
  const gr = g.createLinearGradient(0, 0, 0, P * 0.7); gr.addColorStop(0, 'rgba(10,18,14,0.35)'); gr.addColorStop(1, 'rgba(10,18,14,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, P * 0.7);
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return c;
}
// 架子：深色木頭，放著玻璃瓶、陶盆、垂下來的綠蘿、小束乾燥花、牛皮紙捲
function paintShelfChic(w, h, o = {}) {
  const P = PPU, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  const R = rng((o.seed || 4) + 31);
  g.fillStyle = '#4a3121'; g.fillRect(0, 0, W, H);
  const rows = 2, rh = (H - 10) / rows;
  for (let r = 0; r < rows; r++) {
    const y = 5 + r * rh, by = y + rh - 7;
    g.fillStyle = '#2c1d14'; g.fillRect(6, y + 4, W - 12, rh - 8);
    let x = 12;
    while (x < W - 24) {
      const k = R(), pw = P * (0.18 + R() * 0.1);
      if (k < 0.24) {
        // 玻璃瓶＋幾枝花
        const vh = pw * 1.3;
        g.strokeStyle = '#6a8a5a'; g.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + pw * 0.5, by - vh * 0.6); g.lineTo(x + pw * (0.2 + i * 0.3), by - vh - 8 - R() * 6); g.stroke(); }
        const fc = ['#f2b8c6', '#fff4e6', '#e8a0b0', '#f6d57a', '#c9b6e8'][Math.floor(R() * 5)];
        g.fillStyle = fc; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + pw * (0.2 + i * 0.3), by - vh - 9 - (i % 2) * 4, 3.2, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(200,230,235,0.5)'; rrect(g, x, by - vh, pw, vh, 3); g.fill();
        g.strokeStyle = 'rgba(235,250,255,0.9)'; g.lineWidth = 1.2; rrect(g, x, by - vh, pw, vh, 3); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x + 2, by - vh + 3, 1.5, vh - 6);
        x += pw + 8;
      } else if (k < 0.52) {
        // 陶盆植物
        const col = ['#c9744d', '#e8e2d6', '#8aa58a', '#3e4a52'][Math.floor(R() * 4)];
        g.fillStyle = '#4f8a4c'; g.beginPath(); g.ellipse(x + pw / 2, by - pw * 0.95, pw * 0.55, pw * 0.42, 0, 0, 7); g.fill();
        g.fillStyle = '#6aa860'; g.beginPath(); g.ellipse(x + pw * 0.38, by - pw * 1.05, pw * 0.28, pw * 0.2, 0, 0, 7); g.fill();
        g.fillStyle = col; g.beginPath(); g.moveTo(x, by - pw * 0.7); g.lineTo(x + pw, by - pw * 0.7); g.lineTo(x + pw * 0.85, by); g.lineTo(x + pw * 0.15, by); g.closePath(); g.fill();
        g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
        x += pw + 7;
      } else if (k < 0.66) {
        // 垂下來的綠蘿
        g.fillStyle = '#d8d2c4'; g.fillRect(x, by - pw * 0.6, pw, pw * 0.6); g.strokeStyle = INK; g.lineWidth = 1.2; g.strokeRect(x, by - pw * 0.6, pw, pw * 0.6);
        g.strokeStyle = '#4f8a4c'; g.lineWidth = 1.3;
        for (let i = 0; i < 2; i++) {
          const sx = x + pw * (0.3 + i * 0.4); let yy = by - pw * 0.55; g.beginPath(); g.moveTo(sx, yy); const L = rh * (0.6 + R() * 0.5);
          g.quadraticCurveTo(sx + (i ? 6 : -6), yy + L * 0.5, sx + (i ? 3 : -3), Math.min(H - 4, yy + L)); g.stroke();
          for (let j = 0; j < 4; j++) { g.fillStyle = j % 2 ? '#7cbf6a' : '#4f9a4c'; g.beginPath(); g.ellipse(sx + (i ? 3 : -3) + (j % 2 ? 3 : -3), Math.min(H - 6, yy + L * (0.25 + j * 0.22)), 3, 2, 0.4, 0, 7); g.fill(); }
        }
        x += pw + 7;
      } else if (k < 0.8) {
        // 一小束乾燥花
        g.strokeStyle = '#a08a62'; g.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + pw * 0.5, by); g.lineTo(x + pw * (0.1 + i * 0.27), by - pw * 1.3 - R() * 5); g.stroke(); }
        g.fillStyle = ['#c8a2c8', '#e8d5b0', '#d9a0a0'][Math.floor(R() * 3)];
        for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(x + pw * (0.1 + i * 0.27), by - pw * 1.35 - (i % 2) * 3, 2, 4, 0, 0, 7); g.fill(); }
        g.fillStyle = '#b8936a'; g.fillRect(x + pw * 0.3, by - pw * 0.5, pw * 0.4, 3);
        x += pw + 6;
      } else {
        // 牛皮紙捲、緞帶
        g.fillStyle = '#c9a272'; rrect(g, x, by - pw * 0.55, pw * 1.3, pw * 0.55, 4); g.fill();
        g.strokeStyle = '#8a6a44'; g.lineWidth = 1; g.beginPath(); g.ellipse(x + pw * 1.3, by - pw * 0.28, 3, pw * 0.27, 0, 0, 7); g.stroke();
        g.fillStyle = ['#e8a0b0', '#9fb8a8', '#f2ead8'][Math.floor(R() * 3)]; g.beginPath(); g.ellipse(x + pw * 0.5, by - pw * 0.75, pw * 0.3, pw * 0.2, 0, 0, 7); g.fill();
        x += pw * 1.4 + 6;
      }
      x += R() * 6;
    }
    // 小價格牌
    if (r === 1) for (let i = 0; i < 3; i++) { const px = W * (0.2 + i * 0.3); g.fillStyle = '#f4ecda'; rrect(g, px, by + 1, P * 0.2, 5, 1.5); g.fill(); }
    g.fillStyle = '#6a4630'; g.fillRect(0, y + rh - 6, W, 7); g.fillStyle = INK; g.fillRect(0, y + rh + 1, W, 1.5);
    g.fillStyle = 'rgba(255,230,190,0.12)'; g.fillRect(0, y + rh - 6, W, 2);
  }
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return c;
}
// 倒吊的乾燥花：一根木棍、皮繩，一束一束綁著麻繩（透明底）
function paintDriedRail(w, h) {
  const P = 128, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  const R = rng(77);
  const rodY = 14;
  // 皮繩掛在釘子上
  g.strokeStyle = '#6a4630'; g.lineWidth = 3;
  for (const fx of [0.08, 0.92]) { g.beginPath(); g.moveTo(W * fx - 10, rodY); g.lineTo(W * fx, 3); g.lineTo(W * fx + 10, rodY); g.stroke(); g.fillStyle = '#c9a65a'; g.beginPath(); g.arc(W * fx, 3, 3, 0, 7); g.fill(); }
  const kinds = ['lavender', 'wheat', 'rose', 'gyp', 'euca', 'bunny', 'statice', 'lavender', 'wheat', 'rose'];
  const n = Math.max(6, Math.round(w * 3.2));
  for (let i = 0; i < n; i++) {
    const x = W * (0.07 + 0.86 * (i + 0.5) / n) + (R() - 0.5) * 6, kind = kinds[i % kinds.length];
    const L = H * (0.48 + R() * 0.32), tieY = rodY + 14;
    // 綁在棍子上的麻繩
    g.strokeStyle = '#b89a6a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, rodY); g.lineTo(x, tieY); g.stroke();
    // 花梗（往下散開）
    const stemCol = kind === 'euca' ? '#7d8f84' : kind === 'wheat' || kind === 'bunny' ? '#c8ad7a' : '#8a8a5a';
    g.strokeStyle = stemCol; g.lineWidth = 1.6;
    const tips = [];
    for (let k = 0; k < 6; k++) { const a = (k / 5 - 0.5) * 0.7, ex = x + Math.sin(a) * L * 0.5, ey = tieY + Math.cos(a) * L; tips.push([ex, ey]); g.beginPath(); g.moveTo(x, tieY + 4); g.quadraticCurveTo(x + Math.sin(a) * L * 0.15, tieY + L * 0.4, ex, ey); g.stroke(); }
    for (const [ex, ey] of tips) {
      if (kind === 'lavender') { g.fillStyle = R() < 0.5 ? '#8e6fb8' : '#a58ad0'; for (let j = 0; j < 5; j++) { g.beginPath(); g.ellipse(ex, ey - 12 + j * 4, 2.6, 2.2, 0, 0, 7); g.fill(); } }
      else if (kind === 'wheat') { g.fillStyle = '#d8b56a'; for (let j = 0; j < 5; j++) { g.beginPath(); g.ellipse(ex + (j % 2 ? 2 : -2), ey - 12 + j * 3.6, 2, 3, j % 2 ? 0.5 : -0.5, 0, 7); g.fill(); } }
      else if (kind === 'rose') { g.fillStyle = R() < 0.5 ? '#b5707a' : '#c98a8e'; g.beginPath(); g.arc(ex, ey, 4.6, 0, 7); g.fill(); g.strokeStyle = '#7a3c46'; g.lineWidth = 1; g.beginPath(); g.arc(ex, ey, 2.4, 0.4, 5.3); g.stroke(); g.fillStyle = '#7d8a5a'; g.beginPath(); g.ellipse(ex - 3, ey - 5, 3, 1.4, -0.6, 0, 7); g.fill(); }
      else if (kind === 'gyp') { g.fillStyle = '#f6f2ea'; for (let j = 0; j < 7; j++) { g.beginPath(); g.arc(ex + (R() - 0.5) * 10, ey + (R() - 0.5) * 8, 1.6, 0, 7); g.fill(); } }
      else if (kind === 'euca') { g.fillStyle = R() < 0.5 ? '#9fb3a6' : '#87a091'; for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(ex + (j % 2 ? 3 : -3), ey - j * 6, 3.4, 0, 7); g.fill(); } }
      else if (kind === 'bunny') { g.fillStyle = '#efe4cc'; g.beginPath(); g.ellipse(ex, ey - 2, 3.2, 5, 0, 0, 7); g.fill(); }
      else { g.fillStyle = R() < 0.5 ? '#9a7ac8' : '#f0eaf6'; for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(ex + (R() - 0.5) * 7, ey + (R() - 0.5) * 6, 2.4, 0, 7); g.fill(); } }
    }
    // 麻繩結
    g.fillStyle = '#c8a878'; g.fillRect(x - 5, tieY, 10, 5); g.strokeStyle = 'rgba(60,40,20,0.6)'; g.lineWidth = 1; g.strokeRect(x - 5, tieY, 10, 5);
  }
  // 木棍
  g.fillStyle = INK; rrect(g, 4, rodY - 6, W - 8, 12, 6); g.fill();
  g.fillStyle = '#8a5f3e'; rrect(g, 6, rodY - 4, W - 12, 8, 4); g.fill();
  g.fillStyle = 'rgba(255,230,190,0.3)'; g.fillRect(10, rodY - 3, W - 20, 2);
  return c;
}
// 地毯：門口到花架的長條波斯地毯
function paintRug(w, h) {
  const P = 64, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  const R = rng(9);
  const fr = 7;   // 流蘇
  g.fillStyle = '#efe2c8'; for (let x = 6; x < W - 6; x += 4) { g.fillRect(x, 0, 2, fr); g.fillRect(x, H - fr, 2, fr); }
  const y0 = fr, y1 = H - fr;
  g.fillStyle = '#2f3550'; g.fillRect(0, y0, W, y1 - y0);
  g.fillStyle = '#8c2f32'; g.fillRect(9, y0 + 9, W - 18, y1 - y0 - 18);
  g.strokeStyle = '#e8d6b0'; g.lineWidth = 2; g.strokeRect(5, y0 + 5, W - 10, y1 - y0 - 10); g.strokeRect(12, y0 + 12, W - 24, y1 - y0 - 24);
  // 邊框的小花紋
  g.fillStyle = '#d9b46a';
  for (let y = y0 + 16; y < y1 - 12; y += 12) { g.beginPath(); g.arc(7.5, y, 1.8, 0, 7); g.fill(); g.beginPath(); g.arc(W - 7.5, y, 1.8, 0, 7); g.fill(); }
  // 中間的菱形圖案
  const cx = W / 2;
  for (const cy of [y0 + (y1 - y0) * 0.25, y0 + (y1 - y0) * 0.5, y0 + (y1 - y0) * 0.75]) {
    const rx = W * 0.3, ry = (y1 - y0) * 0.1;
    g.fillStyle = '#2f3550'; g.beginPath(); g.moveTo(cx, cy - ry); g.lineTo(cx + rx, cy); g.lineTo(cx, cy + ry); g.lineTo(cx - rx, cy); g.closePath(); g.fill();
    g.fillStyle = '#d9b46a'; g.beginPath(); g.moveTo(cx, cy - ry * 0.6); g.lineTo(cx + rx * 0.6, cy); g.lineTo(cx, cy + ry * 0.6); g.lineTo(cx - rx * 0.6, cy); g.closePath(); g.fill();
    g.fillStyle = '#8c2f32'; g.beginPath(); g.arc(cx, cy, Math.min(rx, ry) * 0.35, 0, 7); g.fill();
  }
  // 磨舊的感覺
  for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,240,220,0.06)'; g.fillRect(R() * W, y0 + R() * (y1 - y0), 3 + R() * 6, 1.5); }
  return c;
}
// 櫥窗玻璃上的金字（透明底，從外面看是正的）
function paintGoldLetters(w, h) {
  const P = 128, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const gold = g.createLinearGradient(0, H * 0.15, 0, H * 0.7); gold.addColorStop(0, '#fff0b8'); gold.addColorStop(0.5, '#e0b04a'); gold.addColorStop(1, '#b07a24');
  g.font = `900 ${Math.round(H * 0.42)}px ${BOLD_FONT}`;
  g.lineJoin = 'round'; g.strokeStyle = 'rgba(40,24,10,0.85)'; g.lineWidth = 6; g.strokeText('美玲花藝', W / 2, H * 0.38);
  g.fillStyle = gold; g.fillText('美玲花藝', W / 2, H * 0.38);
  g.font = `700 ${Math.round(H * 0.15)}px Georgia, "Times New Roman", serif`;
  g.fillStyle = '#e8c878'; g.fillText('M E I L I N G   F L O R I S T', W / 2, H * 0.74);
  g.fillStyle = '#e0b04a'; g.fillRect(W * 0.2, H * 0.62, W * 0.6, 2); g.fillRect(W * 0.2, H * 0.86, W * 0.6, 2);
  return c;
}
// 牆上的黑板花單（今天店裡有的花跟價錢）
function paintChalkMenu(items) {
  const W = 236, H = 132;
  const [c, g] = cvs(W, H);
  g.fillStyle = '#5a3c28'; rrect(g, 0, 0, W, H, 6); g.fill();
  g.fillStyle = '#2e3b34'; g.fillRect(8, 8, W - 16, H - 16);
  const R = rng(5);
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,0.035)'; g.beginPath(); g.ellipse(8 + R() * (W - 16), 8 + R() * (H - 16), 10 + R() * 20, 4 + R() * 6, R() * 3, 0, 7); g.fill(); }
  g.textBaseline = 'middle';
  g.fillStyle = '#f6f1e4'; g.font = `700 17px ${UI_FONT}`; g.textAlign = 'center'; g.fillText('今日花材', W / 2, 24);
  g.strokeStyle = 'rgba(246,241,228,0.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W * 0.3, 35); g.lineTo(W * 0.7, 35); g.stroke();
  const list = items.slice(0, 6);
  const cols = ['#f6c6d0', '#fff1b8', '#c8e6c8', '#cfe0f6', '#f6d0b0', '#e2d0f6'];
  g.font = `13px ${UI_FONT}`;
  if (!list.length) { g.fillStyle = 'rgba(246,241,228,0.7)'; g.textAlign = 'center'; g.fillText('今天的花賣完囉', W / 2, 72); }
  list.forEach(([name, price], i) => {
    const col = i < 3 ? 0 : 1, row = i % 3, x = 18 + col * (W - 36) / 2, y = 52 + row * 22;
    g.fillStyle = cols[i % cols.length]; g.beginPath(); g.arc(x + 4, y, 3, 0, 7); g.fill();
    g.fillStyle = '#f6f1e4'; g.textAlign = 'left'; g.fillText(name, x + 11, y);
    g.textAlign = 'right'; g.fillStyle = '#ffe9a8'; g.fillText(price, x + (W - 36) / 2 - 8, y);
  });
  // 角落的小貓塗鴉
  g.strokeStyle = 'rgba(246,241,228,0.85)'; g.lineWidth = 1.5;
  const kx = W - 26, ky = H - 22;
  g.beginPath(); g.moveTo(kx - 8, ky + 6); g.lineTo(kx - 8, ky - 4); g.lineTo(kx - 5, ky - 9); g.lineTo(kx - 2, ky - 4); g.lineTo(kx + 2, ky - 4); g.lineTo(kx + 5, ky - 9); g.lineTo(kx + 8, ky - 4); g.lineTo(kx + 8, ky + 6); g.closePath(); g.stroke();
  g.fillStyle = 'rgba(246,241,228,0.85)'; g.beginPath(); g.arc(kx - 3, ky, 1.1, 0, 7); g.arc(kx + 3, ky, 1.1, 0, 7); g.fill();
  g.strokeStyle = INK; g.lineWidth = 2; rrect(g, 1, 1, W - 2, H - 2, 6); g.stroke();
  return c;
}

// ---------- 花桶（卡通向量）----------
// 花頭：同一種花在花桶裡會放好幾朵
const BUNCH = {
  rose: { stem: PC.stem, leaf: true, head: (x, y, s) => rose(x, y, 2.6 * s) },
  periwinkle: { stem: PC.stem, leaf: true, head: (x, y, s, r) => flower5(x, y, 1.6 * s, r > 0.5 ? '#ffc0dc' : '#ff9fcb', '#d9466e', r * 3) },
  bougain: { stem: '#7a5232', leaf: true, head: (x, y, s) => { O.eo(x, y, 2.9 * s, 2.5 * s, '#d83aa2', { part: 21 }); O.e(x + s, y + s, 1.8 * s, 1.3 * s, '#9e2276', { only: 21 }); O.dot(x - 0.8 * s, y - 0.9 * s, 0.8 * s, '#ff8fd2'); } },
  jasmine: { stem: PC.stem, leaf: true, head: (x, y, s) => { for (const [a, b] of [[-1.6, 0], [1.4, -0.6], [0, 1.4]]) { for (let i = 0; i < 5; i++) O.e(x + a * s + Math.cos(i * 1.26) * 1.1 * s, y + b * s + Math.sin(i * 1.26) * 1.1 * s, 1 * s, 1 * s, '#ffffff'); O.dot(x + a * s, y + b * s, 0.5 * s, '#ffe48a'); } } },
  tanhua: { stem: PC.stem, leaf: false, head: (x, y, s, r) => { for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + r; O.eo(x + Math.cos(a) * 3.2 * s, y + Math.sin(a) * 2.7 * s, 2.4 * s, 1.3 * s, '#ffffff', { rot: a }); } O.dot(x, y, 1.5 * s, '#fffbe8'); for (let i = 0; i < 4; i++) O.dot(x + Math.cos(i * 1.6) * 0.8 * s, y + Math.sin(i * 1.6) * 0.7 * s, 0.4 * s, '#ffd84d'); } },
  orchid: { stem: PC.stem, leaf: false, head: (x, y, s) => { for (let i = 0; i < 5; i++) { const a = i * 1.257 - 1.57; O.eo(x + Math.cos(a) * 1.8 * s, y + Math.sin(a) * 1.7 * s, 1.7 * s, 1.5 * s, '#fbf6ff'); } O.dot(x, y + 0.4 * s, 0.9 * s, '#e05a9c'); } },
  // 不賣的綠葉、配花（店裡空著的花桶）
  euca: { stem: '#7d8f84', leaf: false, filler: true, head: (x, y, s) => { for (let j = 0; j < 3; j++) O.eo(x + (j % 2 ? 1.6 : -1.6) * s, y + j * 2.4 * s, 1.7 * s, 1.6 * s, j % 2 ? '#9fb8a8' : '#86a594'); } },
  fern: { stem: '#4f8a3c', leaf: false, filler: true, head: (x, y, s, r) => { const d = r > 0.5 ? 1 : -1; for (let j = 0; j < 4; j++) O.blob([[x + d * j * 0.6 * s, y + j * 2 * s], [x + d * (j * 0.6 + 2.6) * s, y + (j * 2 - 1) * s], [x + d * (j * 0.6 + 1.2) * s, y + (j * 2 + 0.8) * s]], j % 2 ? '#5aa652' : '#3f8a44'); } },
  willow: { stem: '#6b4a3a', leaf: false, filler: true, head: (x, y, s, r) => { const d = r > 0.5 ? 1 : -1; O.curve([[x, y + 3 * s], [x + d * 2 * s, y], [x + d * 4.5 * s, y + 1 * s]], '#6b4a3a', 0.8); for (let j = 0; j < 5; j++) O.dot(x + d * j * 1 * s, y + 2.6 * s - j * 0.7 * s + (j % 2) * 0.6, 0.7 * s, '#ffffff'); } },
  pampas: { stem: '#c8b48a', leaf: false, filler: true, tall: 1.35, head: (x, y, s, r) => { O.blob([[x, y + 4 * s], [x - 1.8 * s, y - 1 * s], [x + (r - 0.5) * 3 * s, y - 7 * s], [x + 1.8 * s, y - 1 * s]], '#eadbbc'); O.curve([[x, y + 3 * s], [x + (r - 0.5) * 2 * s, y - 5 * s]], '#cdb894', 0.7); } },
  gyp: { stem: '#7a9a5a', leaf: false, filler: true, head: (x, y, s, r) => { for (let j = 0; j < 7; j++) O.dot(x + Math.cos(j * 2.4 + r * 6) * 2.4 * s, y + Math.sin(j * 2.4 + r * 6) * 1.8 * s, 0.75 * s, '#ffffff'); } },
};
const FILLERS = ['euca', 'fern', 'gyp', 'willow', 'pampas'];
// 花頭的位置：0 空、1 少少的、2 半滿、3 滿到冒出來
const BUNCH_POS = [
  [],
  [[-3, -9, 1], [3, -11, 1.05], [0, -6, 0.9]],
  [[-5, -9, 1], [0, -13, 1.05], [5, -9, 1], [-2, -6, 0.9], [3, -6, 0.9]],
  [[-6, -9, 1], [-2, -13, 1.05], [3, -14, 1.05], [7, -9, 1], [-4, -5, 0.95], [1, -8, 1], [5, -5, 0.95], [-8, -4, 0.85], [8, -3.5, 0.85]],
];
function drawBucketBunch(t, n) {
  const B = BUNCH[t];
  if (!B || !n) return;
  const top = -12, pos = BUNCH_POS[Math.min(3, n)], tall = B.tall || 1;
  const R = rng(t.length * 7 + n);
  const P = pos.map(([x, y, s]) => [x, top + y * tall, s, R()]);
  for (const [x, y] of P) { O.curve([[x * 0.2, top + 3], [x * 0.55, (top + y) / 2], [x, y]], CM.ink, 2.4); O.curve([[x * 0.2, top + 3], [x * 0.55, (top + y) / 2], [x, y]], B.stem, 1.2); }
  if (B.leaf) { const L = n >= 3 ? [[-6, -5], [6, -5], [0, -7]] : n === 2 ? [[-4, -5], [4, -5]] : [[0, -5]]; for (const [x, y] of L) leafBall(x, top + y, 4.2, 3.2); }
  for (const [x, y, s, r] of P) B.head(x, y, s, r);
}
function drawBucketBody(style, n) {
  const w = 15, h = 12, top = -h;
  const zinc = style === 'zinc';
  const col = zinc ? '#b9c3cf' : '#d9534f', dark = zinc ? '#8d99a8' : '#a83a3a', hi = zinc ? '#eef3f8' : '#f08a80', rim = zinc ? '#dfe5ec' : '#ef7a70';
  O.p([[-w / 2 - 0.9, top - 0.9], [w / 2 + 0.9, top - 0.9], [w / 2 - 1.3, 0.7], [-w / 2 + 1.3, 0.7]], CM.ink);
  O.p([[-w / 2, top], [w / 2, top], [w / 2 - 2, -0.2], [-w / 2 + 2, -0.2]], col, { part: 22 });
  O.e(w * 0.3, top * 0.5, w * 0.22, h * 0.7, dark, { only: 22 });
  O.e(-w * 0.28, top * 0.55, w * 0.07, h * 0.42, hi, { only: 22 });
  if (zinc) for (const y of [top * 0.72, top * 0.3]) O.limb(-w / 2 + 0.8, y, w / 2 - 0.8, y, 1, '#9aa6b5', { noOutline: true, only: 22 });
  else O.limb(-w / 2 + 0.6, top * 0.78, w / 2 - 0.6, top * 0.78, 1.1, '#b8443e', { noOutline: true, only: 22 });
  O.limb(-w / 2 - 0.6, top, w / 2 + 0.6, top, 1.7, rim, { noOutline: true });
  if (!n) O.e(0, top + 0.6, w / 2 - 1.2, 1.3, zinc ? '#5d6878' : '#7a2a2a');
  // 把手
  if (zinc) { O.curve([[-w / 2 - 0.2, top + 2.2], [-w / 2 - 2.2, top + 3.6], [-w / 2 - 0.6, top + 5]], CM.ink, 1.6); O.curve([[w / 2 + 0.2, top + 2.2], [w / 2 + 2.2, top + 3.6], [w / 2 + 0.6, top + 5]], CM.ink, 1.6); }
}
// style：zinc 鐵桶、plastic 塑膠桶；n：花有多滿（0…3）
function drawBucket2(t, style, n) {
  if (t === 'wilt') { drawBucket('wilt'); return; }
  drawBucketBunch(t, n);
  drawBucketBody(style, n);
}
function toonBucket2(t, style = 'zinc', n = 2) {
  if (t === 'empty') n = 0;
  return toonFrameInfo(toonFrame('bk2-' + style + '-' + t + '-' + n, 30, 40, () => drawBucket2(t, style, n)), false, 0.5, 1.28);
}

// ---------- 綠植與小道具（卡通向量）----------
// 龜背芋：編織籃＋有裂口的大葉子
function drawMonstera() {
  const leaf = (x, y, s, a, col) => {
    const P = (px, py) => { const c = Math.cos(a), sn = Math.sin(a); return [x + px * c - py * sn, y + px * sn + py * c]; };
    const pts = [[0, 4], [-7, 0], [-9, -7], [-5, -13], [0, -11], [5, -13], [9, -7], [7, 0]].map(([px, py]) => P(px * s, py * s));
    O.blobO(pts, col, { part: 23 });
    // 裂口
    for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { const a0 = P(sd * (3 + k * 2.2) * s, (-4 - k * 3) * s), a1 = P(sd * (9 - k) * s, (-3 - k * 3.6) * s); O.limb(a0[0], a0[1], a1[0], a1[1], 1.1 * s, '#2d4a34', { noOutline: true, only: 23 }); }
    const m0 = P(0, 3 * s), m1 = P(0, -10 * s); O.curve([m0, m1], '#9fd08a', 0.8, { only: 23 });
  };
  for (const [x0, y0, x1, y1] of [[0, -14, -9, -34], [2, -14, 10, -38], [0, -14, 2, -44], [-1, -14, -14, -24], [1, -14, 15, -26]]) { O.curve([[x0, y0], [(x0 + x1) / 2, y1 + 8], [x1, y1]], CM.ink, 2.6); O.curve([[x0, y0], [(x0 + x1) / 2, y1 + 8], [x1, y1]], '#4f8a3c', 1.3); }
  leaf(-14, -24, 0.95, -0.9, '#3f8a4a'); leaf(15, -26, 0.95, 0.9, '#3a7f44');
  leaf(-9, -34, 1.05, -0.45, '#4a9a52'); leaf(10, -38, 1.05, 0.4, '#3f8a4a'); leaf(2, -44, 1.1, 0.05, '#52a25a');
  // 編織籃
  O.p([[-11, -15], [11, -15], [9, 0], [-9, 0]], CM.ink);
  O.p([[-10, -14.2], [10, -14.2], [8.2, -0.8], [-8.2, -0.8]], '#d6b88a', { part: 24 });
  for (let i = 0; i < 4; i++) O.limb(-10, -12 + i * 3.4, 10, -12 + i * 3.4, 0.8, '#b8935e', { noOutline: true, only: 24 });
  for (let i = -3; i <= 3; i++) O.limb(i * 2.8, -14, i * 2.4, -1, 0.7, '#c4a272', { noOutline: true, only: 24 });
  O.limb(-11, -14.6, 11, -14.6, 1.8, '#e6cfa2', { noOutline: true });
}
function toonMonstera() { return toonFrameInfo(toonFrame('deco-monstera', 52, 62, drawMonstera), false, 0.5, 1); }
// 琴葉榕：陶盆、細樹幹、提琴形的大葉子
function drawFig() {
  O.curve([[0, -12], [-1, -30], [1, -48], [0, -62]], CM.ink, 3.4); O.curve([[0, -12], [-1, -30], [1, -48], [0, -62]], '#7a5a3e', 2);
  const leaf = (x, y, a, s, col) => {
    const c = Math.cos(a), sn = Math.sin(a), P = (px, py) => [x + (px * c - py * sn) * s, y + (px * sn + py * c) * s];
    O.blobO([P(0, 2), P(-4, -1), P(-5, -6), P(-3, -9), P(-4.4, -13), P(0, -16), P(4.4, -13), P(3, -9), P(5, -6), P(4, -1)], col, { part: 25 });
    O.curve([P(0, 1), P(0, -14)], '#8fc47a', 0.7, { only: 25 });
  };
  const L = [[-5, -30, -1.0, 1, '#3f7a40'], [6, -34, 1.0, 1, '#3a7240'], [-6, -44, -0.8, 1.05, '#4a8a48'], [6, -48, 0.85, 1, '#3f7a40'], [-3, -56, -0.4, 1, '#4f9a4c'], [4, -60, 0.35, 0.95, '#468c46'], [0, -64, 0, 0.9, '#52a252'], [-7, -22, -1.3, 0.9, '#3a7240'], [7, -24, 1.25, 0.9, '#3f7a40']];
  for (const l of L) leaf(...l);
  O.p([[-9, -13], [9, -13], [7, 0], [-7, 0]], CM.ink);
  O.p([[-8, -12.3], [8, -12.3], [6.2, -0.8], [-6.2, -0.8]], '#b8674a', { part: 26 });
  O.e(4, -6, 3, 6, '#8e4a34', { only: 26 });
  O.limb(-9.4, -12.8, 9.4, -12.8, 2, '#d08060', { noOutline: true });
}
function toonFig() { return toonFrameInfo(toonFrame('deco-fig', 40, 84, drawFig), false, 0.5, 1); }
// 櫥窗吊盆：麻繩編的吊籃＋垂下來的綠蘿（繩子一路拉到上面）
function drawHanging(k) {
  const top = -80, py = -22;   // 繩子頂端、盆子位置
  for (const sx of [-6, 0, 6]) O.curve([[0, top], [sx * 1.1, py - 12], [sx, py - 8]], '#c8a878', 0.9);
  O.dot(0, top, 1.4, '#8a6a44');
  // 盆
  O.p([[-7, py - 9], [7, py - 9], [5.4, py], [-5.4, py]], CM.ink);
  O.p([[-6.2, py - 8.4], [6.2, py - 8.4], [4.8, py - 0.6], [-4.8, py - 0.6]], k ? '#e8e2d6' : '#c9744d');
  for (const sx of [-6, 0, 6]) O.curve([[sx, py - 8], [sx * 0.7, py - 2], [0, py + 3]], '#c8a878', 0.9);
  // 綠蘿
  leafBall(-3, py - 11, 5, 3.4); leafBall(3, py - 11.5, 5, 3.4);
  const vines = (k ? [[-6, -12, -9, 6], [5, -12, 8, 10], [0, -10, 1, 14]] : [[-6, -12, -10, 10], [6, -12, 9, 4], [-1, -10, -3, 14]]).map(([a, b, c, d]) => [a, b + py + 6, c, d + py + 6]);
  for (const [x0, y0, x1, y1] of vines) {
    O.curve([[x0, y0], [(x0 + x1) / 2 + (x1 > 0 ? 2 : -2), (y0 + y1) / 2], [x1, y1]], '#4f8a3c', 1);
    for (let j = 1; j <= 4; j++) { const t = j / 4.5, x = x0 + (x1 - x0) * t + (j % 2 ? 1.6 : -1.6), y = y0 + (y1 - y0) * t; O.eo(x, y, 1.9, 1.4, j % 2 ? '#6ab35e' : '#4f9a4c', { rot: j % 2 ? 0.6 : -0.6 }); }
  }
}
function toonHanging(k) { return toonFrameInfo(toonFrame('deco-hang-' + k, 30, 82, () => drawHanging(k)), false, 0.5, 1); }
// 櫥窗台上的小盆花（用盆花的圖縮小）
function toonSillPot(t) { const a = toonFrameInfo(toonFrame('pot-' + t, 34, 38, () => drawPlant(t)), false, 0.5, 0.5); a.lift = -(a.foot || 0); return a; }
// 包花台上的東西：牛皮紙捲架、包到一半的花束、緞帶和剪刀
function drawKraftRoll() {
  O.limb(-9, 0, -9, -22, 1.6, '#3a3a44'); O.limb(9, 0, 9, -22, 1.6, '#3a3a44');
  O.limb(-10, -1, 10, -1, 1.6, '#3a3a44');
  // 紙捲
  O.blobO([[-9, -26], [9, -26], [9, -18], [-9, -18]], '#c9a272');
  O.e(-9, -22, 1.6, 4, '#8a6a44'); O.e(9, -22, 1.6, 4, '#e0c094');
  // 垂下來的紙
  O.blobO([[-8, -19], [8, -19], [8.5, -6], [-7.5, -5]], '#d4ae7e');
  O.curve([[-7, -12], [7, -13]], 'rgba(120,90,50,0.5)', 0.6);
}
function toonKraftRoll() { return toonFrameInfo(toonFrame('deco-kraft', 26, 30, drawKraftRoll), false, 0.5, 1); }
function drawWrapBouquet() {
  // 牛皮紙包著一束花
  for (const [x, y, c] of [[-3, -17, '#f2b8c6'], [2, -19, '#fff4e6'], [5, -15, '#e8394d'], [-5, -13, '#c9b6e8'], [1, -14, '#f6d57a']]) { O.curve([[0, -4], [x * 0.6, -10], [x, y]], PC.stem, 1); O.eo(x, y, 2.4, 2.2, c); }
  leafBall(-4, -12, 3.4, 2.4); leafBall(4, -11, 3.4, 2.4);
  O.blobO([[-8, -12], [8, -12], [3, 0], [-3, 0]], '#d4ae7e');
  O.blob([[-8, -12], [-2, -12], [-1, -1], [-3, 0]], '#c49a68');
  // 緞帶
  O.blobO([[-2.5, -6], [2.5, -6], [2, -4], [-2, -4]], '#e8a0b0');
  O.blobO([[0, -5], [-4, -8], [-4, -3]], '#e8a0b0'); O.blobO([[0, -5], [4, -8], [4, -3]], '#e8a0b0');
}
function toonWrapBouquet() { return toonFrameInfo(toonFrame('deco-wrap', 20, 24, drawWrapBouquet), false, 0.5, 1); }
function drawRibbons() {
  for (const [x, c] of [[-7, '#e8a0b0'], [0, '#9fb8a8'], [7, '#f2ead8']]) { O.eo(x, -4, 3.2, 3.6, c); O.e(x, -4, 1.2, 1.4, '#6a5040'); }
  O.curve([[-7, -1], [-4, 1], [-1, 0]], '#e8a0b0', 1);
  // 剪刀
  O.limb(10, -2, 15, -6, 1, '#9aa6b5'); O.limb(10, -6, 15, -2, 1, '#9aa6b5'); O.eo(9.4, -1.6, 1.2, 1.2, '#2a2a36'); O.eo(9.4, -6.4, 1.2, 1.2, '#2a2a36');
}
function toonRibbons() { return toonFrameInfo(toonFrame('deco-ribbon', 34, 12, drawRibbons), false, 0.5, 1); }
// 還沒整理的店：牆角堆著的塑膠籃、掃把
function drawCrates() {
  const crate = (x, y, col) => {
    O.p([[x - 9, y - 9], [x + 9, y - 9], [x + 9, y], [x - 9, y]], CM.ink);
    O.p([[x - 8.2, y - 8.3], [x + 8.2, y - 8.3], [x + 8.2, y - 0.7], [x - 8.2, y - 0.7]], col);
    for (let i = -2; i <= 2; i++) O.p([[x + i * 3.2 - 1, y - 6.8], [x + i * 3.2 + 1, y - 6.8], [x + i * 3.2 + 1, y - 2.2], [x + i * 3.2 - 1, y - 2.2]], shade(col, -0.35));
  };
  crate(-2, 0, '#4f86c6'); crate(-1, -9, '#d9534f'); crate(1, -18, '#4f86c6');
  O.limb(10, 0, 15, -30, 1.4, '#a8743f'); O.blobO([[8, 0], [13, 0], [12.6, -6], [9.4, -6]], '#c9a85a');
}
function toonCrates() { return toonFrameInfo(toonFrame('deco-crates', 36, 34, drawCrates), false, 0.5, 1); }
// 櫃台上的招財貓（老貓攤的「招財貓」升級）：1 白色小隻、2 大一點抱金幣、3 全身金色
function drawManeki(lv, wave) {
  const gold = lv >= 3, body = gold ? '#f2c24a' : '#fbf6ee', shade2 = gold ? '#c8932a' : '#e2d8cc';
  // 身體
  O.eo(0, -7, 7.5, 7, body, { part: 27 }); O.e(3, -5, 4, 5, shade2, { only: 27 });
  // 舉起來招手的左手
  const ay = wave ? -21 : -19.5;
  O.eo(-7.4, ay, 2.6, 3.2, body); O.dot(-7.4, ay - 1, 0.9, gold ? '#ffe9a8' : '#ffb2c0');
  O.limb(-6, -12, -7.2, ay + 2, 3.2, body);
  // 頭
  for (const sd of [-1, 1]) { O.p([[sd * 2.5, -21], [sd * 6.5, -25.5], [sd * 6.8, -18]], CM.ink); O.p([[sd * 3.2, -21], [sd * 6, -24.2], [sd * 6.1, -18.6]], body); O.p([[sd * 4, -20.8], [sd * 5.6, -23], [sd * 5.6, -19.4]], gold ? '#e0a83a' : '#ffb2c0'); }
  O.eo(0, -16.5, 7, 6, body, { part: 28 }); O.e(2.5, -15, 3.5, 3.6, shade2, { only: 28 });
  O.curve([[-4, -17], [-2.6, -18.2], [-1.2, -17]], CM.ink, 0.9); O.curve([[1.2, -17], [2.6, -18.2], [4, -17]], CM.ink, 0.9);
  O.dot(0, -15.4, 0.8, '#e06a7a'); O.curve([[0, -14.8], [-1.2, -13.8]], CM.ink, 0.6); O.curve([[0, -14.8], [1.2, -13.8]], CM.ink, 0.6);
  if (!gold) for (const [x, y] of [[-3.6, -21], [3.8, -11]]) O.dot(x, y, 1.6, '#f39a45');
  // 紅項圈＋金鈴鐺
  O.limb(-5.6, -11.2, 5.6, -11.2, 1.6, '#d9363e', { noOutline: true });
  O.eo(0, -10.2, 1.5, 1.5, '#ffd84d');
  // 抱著金幣
  if (lv >= 2) { O.eo(3.6, -6.5, 2.8, 3.8, '#ffd84d'); O.curve([[2.6, -8], [4.6, -8]], '#b8862a', 0.6); O.curve([[2.6, -5], [4.6, -5]], '#b8862a', 0.6); }
  O.eo(5.2, -7, 2.2, 2.4, body);
}
function toonManeki(lv, wave) { return toonFrameInfo(toonFrame('maneki-' + lv + (wave ? 'w' : ''), 22, 30, () => drawManeki(lv, wave)), false, 0.5, [0, 0.5, 0.68, 0.85][lv]); }
// 門口人行道上的立式黑板（畫了貓和花）
let AFRAME_CV = null;
function artAFrame() {
  if (!AFRAME_CV) {
    const S = 128, W = Math.round(0.82 * S), H = Math.round(1.12 * S);
    const [c, g] = cvs(W, H);
    g.lineJoin = 'round'; g.lineCap = 'round';
    // 腳
    g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.moveTo(14, H - 4); g.lineTo(22, 10); g.moveTo(W - 14, H - 4); g.lineTo(W - 22, 10); g.stroke();
    g.strokeStyle = '#8a5f3e'; g.lineWidth = 4; g.beginPath(); g.moveTo(14, H - 4); g.lineTo(22, 10); g.moveTo(W - 14, H - 4); g.lineTo(W - 22, 10); g.stroke();
    g.fillStyle = INK; rrect(g, 12, 8, W - 24, H - 30, 6); g.fill();
    g.fillStyle = '#8a5f3e'; rrect(g, 14, 10, W - 28, H - 34, 5); g.fill();
    g.fillStyle = '#2e3b34'; g.fillRect(20, 16, W - 40, H - 46);
    g.fillStyle = '#f6f1e4'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 15px ${UI_FONT}`; g.fillText('今日鮮花', W / 2, 30);
    g.font = `11px ${UI_FONT}`; g.fillStyle = '#ffe9a8'; g.fillText('歡迎進來看看', W / 2, 48);
    // 粉筆畫：小花和貓
    const cx = W / 2, cy = 78;
    g.strokeStyle = '#f6c6d0'; g.lineWidth = 2;
    for (let i = 0; i < 5; i++) { const a = i * 1.257; g.beginPath(); g.arc(cx - 18 + Math.cos(a) * 5, cy + Math.sin(a) * 5, 3.6, 0, 7); g.stroke(); }
    g.strokeStyle = '#c8e6c8'; g.beginPath(); g.moveTo(cx - 18, cy + 8); g.lineTo(cx - 18, cy + 22); g.stroke();
    g.strokeStyle = '#f6f1e4';
    g.beginPath(); g.moveTo(cx + 8, cy + 14); g.lineTo(cx + 8, cy); g.lineTo(cx + 12, cy - 7); g.lineTo(cx + 16, cy); g.lineTo(cx + 22, cy); g.lineTo(cx + 26, cy - 7); g.lineTo(cx + 30, cy); g.lineTo(cx + 30, cy + 14); g.closePath(); g.stroke();
    g.fillStyle = '#f6f1e4'; g.beginPath(); g.arc(cx + 15, cy + 6, 1.4, 0, 7); g.arc(cx + 23, cy + 6, 1.4, 0, 7); g.fill();
    AFRAME_CV = c;
  }
  return { img: AFRAME_CV, w: 0.82, h: 1.12, flip: false, foot: 0, ax: 0.5, lift: 0 };
}

// ---------- 3D 場景裡的佈置 ----------
// 建場景時呼叫：所有佈置的網格先建好，畫的時候看等級挑
function buildShopDecor(st, map) {
  const H = 2.7, U = st.up;
  // 兩種地板（整張地面）
  for (const [key, floor] of [['floorOld', 'terrazzo'], ['floorNew', 'chevron']]) {
    const tex = paintGround(map, PPU, { seed: 5, floor });
    const m = new MeshBuilder(); m.quad(tex, [0, 0, 0], [map.w, 0, 0], [map.w, 0, map.h], [0, 0, map.h], [0, 1, 0]);
    U[key] = m.build();
  }
  // 牆、架子
  {
    const m = new MeshBuilder();
    m.quad(paintShopWallChic(13, H, { door: 6, prints: [[9.9, 0], [11.2, 1]], clock: 12.4 }), [1, H, 3], [14, H, 3], [14, 0, 3], [1, 0, 3], [0, 0, 1]);
    U.wallChic = m.build();
    const s = new MeshBuilder(), W = { img: paintWood('#5a3a26') };
    for (const [a, b] of [[1, 7], [8, 14]]) s.box(a, 0, 3.0, b, 1.05, 3.92, { front: { img: paintShelfChic(b - a, 1.05, { seed: a }) }, top: W, left: W, right: W });
    U.shelfChic = s.build();
  }
  // 三層花架（取代中間的小花台）
  {
    const m = new MeshBuilder(), W = { img: paintWood('#7a5236') }, Wd = { img: paintWood('#5a3a26') };
    m.box(4.45, 0, 8.6, 7.15, 0.62, 9.08, { top: W, front: Wd, left: Wd, right: Wd });
    m.box(4.45, 0, 9.08, 7.15, 0.4, 9.55, { top: W, front: Wd, left: Wd, right: Wd });
    m.box(4.45, 0, 9.55, 7.15, 0.18, 10.0, { top: W, front: Wd, left: Wd, right: Wd });
    U.stand2 = m.build();
    // 左牆的長凳
    const b = new MeshBuilder();
    b.box(1.02, 0.3, 5.0, 1.92, 0.36, 11.0, { top: W, front: Wd, right: Wd });
    for (const z of [5.08, 7.9, 10.86]) b.box(1.08, 0, z - 0.06, 1.86, 0.3, z + 0.06, { front: Wd, right: Wd, left: Wd });
    b.box(1.06, 0.08, 5.1, 1.88, 0.11, 10.9, { top: Wd, right: Wd });
    U.bench = b.build();
  }
  // 乾燥花吊掛
  { const m = new MeshBuilder(); m.quad(paintDriedRail(2.8, 1.05), [1.3, 2.36, 3.04], [4.1, 2.36, 3.04], [4.1, 1.31, 3.04], [1.3, 1.31, 3.04], [0, 0, 1]); U.dried = m.build(); }
  // 包花工作台
  {
    const m = new MeshBuilder(), W = { img: paintWood('#a07448') }, Wd = { img: paintWood('#6a4630') };
    m.box(1.02, 0.78, 11.6, 2.3, 0.85, 14.0, { top: W, front: Wd, right: Wd, left: Wd });
    for (const [x, z] of [[1.08, 11.66], [2.18, 11.66], [1.08, 13.88], [2.18, 13.88]]) m.box(x, 0, z, x + 0.07, 0.78, z + 0.07, { front: Wd, right: Wd, left: Wd });
    m.box(1.06, 0.22, 11.68, 2.26, 0.26, 13.94, { top: Wd, front: Wd, right: Wd });
    U.worktable = m.build();
  }
  // 黑板花單（貼圖畫的時候換）
  { const m = new MeshBuilder(); m.quad(GL3.white, [8.5, 2.26, 3.03], [10.3, 2.26, 3.03], [10.3, 1.24, 3.03], [8.5, 1.24, 3.03], [0, 0, 1]); U.chalk = m.build()[0].mesh; }
  // 櫥窗金字
  { const m = new MeshBuilder(); m.quad(paintGoldLetters(4.0, 0.95), [2.6, 1.86, 16.34], [6.6, 1.86, 16.34], [6.6, 0.91, 16.34], [2.6, 0.91, 16.34], [0, 0, 1]); U.gold = m.build(); }
  // 地毯
  { const m = new MeshBuilder(); m.quad(paintRug(1.7, 3.8), [6.65, 0.004, 11.1], [8.35, 0.004, 11.1], [8.35, 0.004, 14.9], [6.65, 0.004, 14.9], [0, 1, 0]); U.rug = m.build(); }
}
// 黑板花單的貼圖：店裡的花變了才重畫
function chalkTex(sc) {
  const run = sc.run;
  const types = [...new Set(sc.stock.map(f => f.t))].sort((a, b) => FLOWERS[b].price - FLOWERS[a].price);
  const items = types.map(t => [FLOWERS[t].name, '$' + Math.round(flowerValue(run, t, 1)).toLocaleString('en-US')]);
  const key = items.map(i => i.join(':')).join('|');
  if (!sc.chalkCv || sc.chalkKey !== key) { sc.chalkCv = paintChalkMenu(items); sc.chalkKey = key; }
  return sc.chalkCv;
}
// 畫的時候呼叫：依佈置等級把網格、立牌放進這一格
function shopDecor3D(sc, F, st, store) {
  const U = st.up, d = store.decor || 0, cpd = Math.cos(R3.pitch);
  const lit = (list, o) => { for (const p of list) F.lit.push({ mesh: p.mesh, img: p.img, o: o || {} }); };
  if (d >= 1) lit(U.bench);
  // 招財貓公仔：升級一次大一點，最後變金色
  const lk = (sc.run.upg && sc.run.upg.lucky) || 0;
  if (lk > 0) {
    const wave = Math.floor((sc.cat.t || 0) * 2.2) % 2 === 0, x = 9.45, z = 7.42;
    pushSprite(F.sprites, ART.fix(toonManeki(lk, wave)), x * TS, z * TS, { lift: 0.95 * cpd, minLight: [0.62, 0.58, 0.55] });
    if (lk >= 3) glowQuad(F.glow, x, 1.35, z + 0.05, 0.45, [1, 0.85, 0.4, 0.22 + 0.08 * Math.sin((sc.cat.t || 0) * 3)]);
  }
  if (d === 0) { pushSprite(F.sprites, ART.fix(toonCrates()), 1.6 * TS, 13.9 * TS); shadowAt(F, 1.6 * TS, 13.9 * TS, 0.8, 0.3); }
  if (d >= 2) {
    lit(U.dried, { alphaTest: 0.4 });
    pushSprite(F.sprites, ART.fix(toonMonstera()), 1.6 * TS, 4.7 * TS); shadowAt(F, 1.6 * TS, 4.7 * TS, 0.9, 0.34);
    pushSprite(F.sprites, ART.fix(toonFig()), 13.4 * TS, 4.7 * TS); shadowAt(F, 13.4 * TS, 4.7 * TS, 0.7, 0.28);
    // 後牆前垂下來的吊盆、櫥窗台上的小盆花
    for (const [x, k] of [[9.25, 1], [12.95, 0]]) pushSprite(F.sprites, ART.fix(toonHanging(k)), x * TS, 4.2 * TS, { lift: 0.62 * cpd });
    for (const [x, t] of [[2.1, 'periwinkle'], [3.3, 'jasmine'], [5.9, 'bougain'], [9.2, 'jasmine'], [11.4, 'periwinkle'], [13.1, 'rose']]) pushSprite(F.sprites, toonSillPot(t), x * TS, 16.12 * TS, { lift: 0.43 * cpd });
  }
  if (d >= 3) {
    lit(U.worktable); lit(U.rug, { alphaTest: 0.5 });
    F.lit.push({ mesh: U.chalk, img: chalkTex(sc), o: {} });
    for (const p of U.gold) F.blend.push({ mesh: p.mesh, img: p.img, o: { alphaTest: 0.02 } });
    const top = 0.85 * cpd;
    pushSprite(F.sprites, ART.fix(toonKraftRoll()), 1.66 * TS, 11.85 * TS, { lift: top });
    pushSprite(F.sprites, ART.fix(toonRibbons()), 1.66 * TS, 13.75 * TS, { lift: top });
    pushSprite(F.sprites, ART.fix(toonWrapBouquet()), 1.7 * TS, 12.95 * TS, { lift: top });
    pushSprite(F.sprites, artAFrame(), 3.5 * TS, 17.6 * TS); shadowAt(F, 3.5 * TS, 17.6 * TS, 0.7, 0.24);
  }
  expDecor3D(sc, F);
}
