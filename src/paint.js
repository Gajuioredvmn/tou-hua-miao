// ================= 3D 場景的手繪貼圖 =================
// 全部用程式畫：卡通筆觸、深色描邊、台灣巷弄的小細節（水溝蓋、紅線、鐵窗、綠釉花磚）。
let PPU = 64;
const INK = '#2b2233';
const UI_FONT = '"Huninn", "PingFang TC", "Noto Sans TC", "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif';
const BOLD_FONT = '"Noto Sans CJK TC", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function cvs(w, h) { const c = makeCanvas(w, h); return [c, c.getContext('2d')]; }
function rrect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function shade(hex, k) {
  // k>0 變亮、k<0 變暗
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  if (k >= 0) { r += (255 - r) * k; gg += (255 - gg) * k; b += (255 - b) * k; } else { r *= 1 + k; gg *= 1 + k; b *= 1 + k; }
  return '#' + [r, gg, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function dots(g, x, y, w, h, n, colors, r0, r1, R) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(R() * colors.length)];
    const rr = r0 + R() * (r1 - r0);
    g.beginPath(); g.arc(x + R() * w, y + R() * h, rr, 0, Math.PI * 2); g.fill();
  }
}

// ---------- 地面 ----------
const WALLISH = new Set(['X', 'R', '#', 'W', 'w', 'D', 's', 'S', 'Q', 'E', 'C', 'H', 'M', 'T', 'k', 'q', 'e']);
function groundKind(map, tx, ty) {
  const ch = map.at(tx, ty);
  if (ch === '.') return 'road';
  if (ch === ',') return 'yard';
  if (ch === '"') return 'grass';
  if (ch === '~') return 'lawn';
  if (ch === 'o' || ch === 'G') return 'gravel';
  if (ch === 'F' || ch === 'h' || ch === 'n') return 'floor';
  if (ch === 'r') return 'mat';
  if (ch === 'b' || ch === 'L' || ch === 'f' || ch === 'g') {
    const k = groundAt(map, tx, ty);
    return k === ',' ? 'yard' : k === '"' ? 'grass' : k === '~' ? 'lawn' : 'road';
  }
  return 'under';
}
function paintGround(map, ppu, o = {}) {
  const P = ppu, W = map.w * P, H = map.h * P;
  const [c, g] = cvs(W, H);
  const R = rng(o.seed || 7);
  const K = [];
  for (let ty = 0; ty < map.h; ty++) { K[ty] = []; for (let tx = 0; tx < map.w; tx++) K[ty][tx] = groundKind(map, tx, ty); }
  const kind = (tx, ty) => (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) ? 'under' : K[ty][tx];
  g.fillStyle = '#3c3a48'; g.fillRect(0, 0, W, H);
  // 底色
  const base = { road: '#64677a', yard: '#d3c9b6', grass: '#5f9c4e', lawn: '#62ad5c', gravel: '#cdc3ad', floor: '#d8a167', mat: '#d8a167', under: '#3c3a48' };
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) { g.fillStyle = base[K[ty][tx]]; g.fillRect(tx * P, ty * P, P, P); }
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
    const k = K[ty][tx], X = tx * P, Y = ty * P;
    if (k === 'road') {
      dots(g, X, Y, P, P, 90, ['#6d7085', '#5a5d70', '#727589', '#55586a'], 0.6, 1.6, R);
      if (R() < 0.18) { g.fillStyle = 'rgba(40,40,60,0.18)'; rrect(g, X + R() * P * 0.4, Y + R() * P * 0.4, P * (0.3 + R() * 0.4), P * (0.25 + R() * 0.3), 4); g.fill(); }
      if (R() < 0.3) { g.strokeStyle = 'rgba(38,36,52,0.55)'; g.lineWidth = 1.4; g.beginPath(); let x = X + R() * P, y = Y + R() * P; g.moveTo(x, y); for (let i = 0; i < 4; i++) { x += (R() - 0.5) * P * 0.5; y += (R() - 0.5) * P * 0.5; g.lineTo(x, y); } g.stroke(); }
    } else if (k === 'grass') {
      for (let i = 0; i < 3; i++) { g.fillStyle = R() < 0.5 ? 'rgba(120,190,90,0.25)' : 'rgba(40,90,50,0.22)'; g.beginPath(); g.ellipse(X + R() * P, Y + R() * P, P * (0.15 + R() * 0.2), P * (0.1 + R() * 0.15), R() * 3, 0, Math.PI * 2); g.fill(); }
      for (let i = 0; i < 16; i++) {
        const x = X + R() * P, y = Y + R() * P, s = 3 + R() * 4;
        g.strokeStyle = R() < 0.5 ? '#3f7a3c' : '#86c467'; g.lineWidth = 1.6; g.beginPath();
        g.moveTo(x - s * 0.6, y - s); g.lineTo(x, y); g.lineTo(x + s * 0.5, y - s * 1.1); g.moveTo(x, y); g.lineTo(x + 0.5, y - s * 1.3); g.stroke();
      }
      if (R() < 0.45) for (let i = 0; i < 3; i++) {
        const x = X + R() * P, y = Y + R() * P; const col = ['#fff4f0', '#ffd84d', '#ff9fc4'][Math.floor(R() * 3)];
        g.fillStyle = col; for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(x + Math.cos(a * 1.26) * 2.2, y + Math.sin(a * 1.26) * 2.2, 1.7, 0, 7); g.fill(); }
        g.fillStyle = '#f2a33a'; g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill();
      }
    } else if (k === 'yard') {
      const n = 2, s = P / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const v = R(); g.fillStyle = v < 0.2 ? '#cbbfaa' : v > 0.85 ? '#ddd4c3' : '#d3c9b6';
        g.fillRect(X + i * s + 1, Y + j * s + 1, s - 2, s - 2);
        dots(g, X + i * s, Y + j * s, s, s, 6, ['#c2b7a2', '#e0d8c8'], 0.6, 1.2, R);
      }
      g.strokeStyle = '#a99f8b'; g.lineWidth = 1.5;
      for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(X + i * s, Y); g.lineTo(X + i * s, Y + P); g.stroke(); g.beginPath(); g.moveTo(X, Y + i * s); g.lineTo(X + P, Y + i * s); g.stroke(); }
      if (R() < 0.12) { g.strokeStyle = 'rgba(90,80,70,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X + R() * P, Y + R() * P); g.lineTo(X + R() * P, Y + R() * P); g.stroke(); }
    } else if (k === 'lawn') {
      g.fillStyle = (tx % 2) ? 'rgba(255,255,255,0.07)' : 'rgba(0,40,0,0.06)'; g.fillRect(X, Y, P, P);
      for (let i = 0; i < 12; i++) { const x = X + R() * P, y = Y + R() * P; g.strokeStyle = R() < 0.5 ? '#4f9a50' : '#7cc56f'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 4); g.stroke(); }
    } else if (k === 'gravel') {
      dots(g, X, Y, P, P, 120, ['#b9ae96', '#e2dac6', '#a89f88', '#d6ccb5'], 1, 2.4, R);
    } else if ((k === 'floor' || k === 'mat') && !o.floor) {
      const ph = P / 4;
      for (let j = 0; j < 4; j++) {
        const off = ((ty * 4 + j) * 37 % 5) / 5 * P;
        const col = ['#d8a167', '#d29a5f', '#dda96f', '#cf965b'][(ty * 4 + j + tx) % 4];
        g.fillStyle = col; g.fillRect(X, Y + j * ph, P, ph);
        g.strokeStyle = 'rgba(150,95,45,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X, Y + j * ph + ph * 0.5); g.bezierCurveTo(X + P * 0.3, Y + j * ph + ph * 0.3, X + P * 0.6, Y + j * ph + ph * 0.75, X + P, Y + j * ph + ph * 0.45); g.stroke();
        g.strokeStyle = '#a8703c'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X, Y + j * ph); g.lineTo(X + P, Y + j * ph); g.stroke();
        const ex = X + ((off + tx * P * 0.37) % P);
        g.beginPath(); g.moveTo(ex, Y + j * ph); g.lineTo(ex, Y + j * ph + ph); g.stroke();
      }
    }
  }
  // 花店的地板樣式：磨石子 / 人字拼（整片連續畫，不是一格一格）
  if (o.floor) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    g.save(); g.beginPath();
    for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
      if (K[ty][tx] !== 'floor' && K[ty][tx] !== 'mat') continue;
      g.rect(tx * P, ty * P, P, P);
      x0 = Math.min(x0, tx * P); y0 = Math.min(y0, ty * P); x1 = Math.max(x1, (tx + 1) * P); y1 = Math.max(y1, (ty + 1) * P);
    }
    g.clip();
    if (x1 > x0) (o.floor === 'terrazzo' ? paintTerrazzo : paintChevron)(g, x0, y0, x1 - x0, y1 - y0, P, R);
    g.restore();
  }
  // 地墊
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
    if (K[ty][tx] !== 'mat' || kind(tx - 1, ty) === 'mat') continue;
    let n = 1; while (kind(tx + n, ty) === 'mat') n++;
    const X = tx * P + 6, Y = ty * P + 8, w = n * P - 12, h = P - 16;
    g.fillStyle = '#b4566c'; rrect(g, X, Y, w, h, 8); g.fill();
    g.strokeStyle = '#f6d6a8'; g.lineWidth = 3; rrect(g, X + 6, Y + 6, w - 12, h - 12, 5); g.stroke();
    g.fillStyle = '#f6d6a8'; g.font = `${Math.round(h * 0.42)}px ${UI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('歡迎光臨', X + w / 2, Y + h / 2 + 1);
    g.strokeStyle = INK; g.lineWidth = 2; rrect(g, X, Y, w, h, 8); g.stroke();
  }
  // 草地、院子跟馬路交界：路緣石
  const edge = (tx, ty, dx, dy, col, w) => {
    const X = tx * P, Y = ty * P;
    g.fillStyle = col;
    if (dx === -1) g.fillRect(X, Y, w, P); if (dx === 1) g.fillRect(X + P - w, Y, w, P);
    if (dy === -1) g.fillRect(X, Y, P, w); if (dy === 1) g.fillRect(X, Y + P - w, P, w);
  };
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
    const k = K[ty][tx];
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const n = kind(tx + dx, ty + dy);
      if (n === k || n === 'under') continue;
      if (k === 'grass' || k === 'lawn') { edge(tx, ty, dx, dy, '#b9b1a1', P * 0.09); edge(tx, ty, dx, dy, 'rgba(0,0,0,0)', 0); }
      if (k === 'road' && (n === 'grass' || n === 'yard' || n === 'lawn')) {
        // 水溝蓋 + 紅線
        const X = tx * P, Y = ty * P, gw = P * 0.26;
        g.save();
        g.translate(X + P / 2, Y + P / 2); g.rotate(dx === -1 ? 0 : dx === 1 ? Math.PI : dy === -1 ? Math.PI / 2 : -Math.PI / 2);
        g.fillStyle = '#a9a59b'; g.fillRect(-P / 2, -P / 2, gw, P);
        g.strokeStyle = '#6f6b63'; g.lineWidth = 1.3;
        for (let i = 0; i < 2; i++) { g.strokeRect(-P / 2 + 1, -P / 2 + i * P / 2 + 1, gw - 2, P / 2 - 2); }
        g.fillStyle = '#4a4740'; for (let i = 0; i < 2; i++) for (let s = 0; s < 4; s++) g.fillRect(-P / 2 + 4 + s * (gw - 8) / 4, -P / 2 + i * P / 2 + 7, 2, P / 2 - 14);
        g.fillStyle = '#d64a3c'; g.fillRect(-P / 2 + gw + 2, -P / 2, P * 0.055, P);
        g.restore();
      }
    }
  }
  // 牆腳陰影（AO）
  const ao = (x, y, w, h, dir, a = 0.32) => {
    const gr = dir === 'x' ? g.createLinearGradient(x, 0, x + w, 0) : g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, `rgba(18,12,30,${a})`); gr.addColorStop(1, 'rgba(18,12,30,0)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  };
  const wall = (tx, ty) => WALLISH.has(map.at(tx, ty)) && map.at(tx, ty) !== 'C';
  const aw = P * 0.32;
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
    if (K[ty][tx] === 'under') continue;
    const X = tx * P, Y = ty * P;
    if (wall(tx, ty - 1)) ao(X, Y, P, aw, 'y');
    if (wall(tx - 1, ty)) ao(X, Y, aw, P, 'x');
    if (wall(tx + 1, ty)) { const gr = g.createLinearGradient(X + P, 0, X + P - aw, 0); gr.addColorStop(0, 'rgba(18,12,30,0.32)'); gr.addColorStop(1, 'rgba(18,12,30,0)'); g.fillStyle = gr; g.fillRect(X + P - aw, Y, aw, P); }
    if (wall(tx, ty + 1)) { const gr = g.createLinearGradient(0, Y + P, 0, Y + P - aw * 0.6); gr.addColorStop(0, 'rgba(18,12,30,0.22)'); gr.addColorStop(1, 'rgba(18,12,30,0)'); g.fillStyle = gr; g.fillRect(X, Y + P - aw * 0.6, P, aw * 0.6); }
    const ch = map.at(tx, ty);
    if (ch === 'b') { g.fillStyle = 'rgba(15,25,20,0.35)'; g.beginPath(); g.ellipse(X + P / 2, Y + P * 0.72, P * 0.46, P * 0.22, 0, 0, 7); g.fill(); }
  }
  // 路上的「慢」字
  for (const [tx, ty] of (o.slow || [])) {
    const X = (tx + 0.5) * P, Y = (ty + 0.5) * P;
    g.save(); g.fillStyle = 'rgba(236,232,220,0.62)'; g.font = `900 ${Math.round(P * 1.15)}px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.translate(X, Y); g.scale(1, 1.35); g.fillText('慢', 0, 0); g.restore();
    g.save(); g.globalCompositeOperation = 'destination-over'; g.restore();
    // 磨損
    g.fillStyle = base.road; for (let i = 0; i < 40; i++) { g.globalAlpha = 0.5; g.beginPath(); g.arc(X + (R() - 0.5) * P * 1.6, Y + (R() - 0.5) * P * 2, 1 + R() * 2.2, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  // 人孔蓋
  for (const [x, y] of (o.manholes || [])) {
    const X = x * P, Y = y * P, r = P * 0.36;
    g.fillStyle = '#4e4f5c'; g.beginPath(); g.arc(X, Y, r + 3, 0, 7); g.fill();
    g.fillStyle = '#7a7b88'; g.beginPath(); g.arc(X, Y, r, 0, 7); g.fill();
    g.strokeStyle = '#5c5d6a'; g.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(X - r * 0.8, Y + i * r * 0.3); g.lineTo(X + r * 0.8, Y + i * r * 0.3); g.stroke(); }
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.arc(X, Y, r + 3, 0, 7); g.stroke();
  }
  // 地上的落葉、垃圾小細節
  for (let i = 0; i < map.w * map.h * 0.12; i++) {
    const tx = Math.floor(R() * map.w), ty = Math.floor(R() * map.h); const k = K[ty][tx];
    if (k !== 'road' && k !== 'yard') continue;
    const x = (tx + R()) * P, y = (ty + R()) * P;
    g.fillStyle = ['#c4893c', '#9c6a30', '#7f9a46'][Math.floor(R() * 3)];
    g.save(); g.translate(x, y); g.rotate(R() * 6); g.beginPath(); g.ellipse(0, 0, 3.4, 1.8, 0, 0, 7); g.fill(); g.restore();
  }
  return c;
}

// ---------- 牆面材質 ----------
// 回傳一張 w×h（格）的牆，沒有開口
function paintWallBase(g, W, H, mat, R) {
  g.fillStyle = mat.base; g.fillRect(0, 0, W, H);
  const P = PPU;
  if (mat.kind === 'tile') {
    // 二丁掛磁磚
    const tw = P * 0.26, th = P * 0.11;
    for (let y = 0, r = 0; y < H; y += th, r++) {
      for (let x = (r % 2) * -tw / 2; x < W; x += tw) {
        const v = R(); g.fillStyle = v < 0.25 ? shade(mat.base, -0.06) : v > 0.85 ? shade(mat.base, 0.08) : mat.base;
        g.fillRect(x + 1, y + 1, tw - 2, th - 2);
      }
      g.fillStyle = mat.line; g.fillRect(0, y, W, 1.2);
    }
    for (let y = 0, r = 0; y < H; y += th, r++) for (let x = (r % 2) * -tw / 2; x < W; x += tw) { g.fillStyle = mat.line; g.fillRect(x, y, 1.2, th); }
  } else if (mat.kind === 'brick') {
    const bw = P * 0.3, bh = P * 0.12;
    for (let y = 0, r = 0; y < H; y += bh, r++) {
      for (let x = (r % 2) * -bw / 2; x < W; x += bw) {
        const v = R(); g.fillStyle = v < 0.3 ? shade(mat.base, -0.1) : v > 0.8 ? shade(mat.base, 0.1) : mat.base;
        rrect(g, x + 1.2, y + 1.2, bw - 2.4, bh - 2.4, 2); g.fill();
      }
    }
    g.fillStyle = mat.line; g.globalCompositeOperation = 'destination-over'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  } else if (mat.kind === 'concrete') {
    dots(g, 0, 0, W, H, W * H / 90, [shade(mat.base, -0.05), shade(mat.base, 0.05)], 0.8, 2.2, R);
    g.fillStyle = mat.line; for (let y = P * 0.5; y < H; y += P * 0.9) g.fillRect(0, y, W, 1.2);
  } else {
    // 油漆牆
    dots(g, 0, 0, W, H, W * H / 120, [shade(mat.base, -0.03), shade(mat.base, 0.04)], 1, 3, R);
  }
}
// 雨水留下的髒污
function grime(g, x, y, w, h, a, R) {
  for (let i = 0; i < Math.max(1, w / 14); i++) {
    const gx = x + R() * w, gw = 3 + R() * 8, gh = h * (0.3 + R() * 0.7);
    const gr = g.createLinearGradient(0, y, 0, y + gh);
    gr.addColorStop(0, `rgba(40,35,50,${a})`); gr.addColorStop(1, 'rgba(40,35,50,0)');
    g.fillStyle = gr; g.fillRect(gx, y, gw, gh);
  }
}

// ---------- 房子正面 ----------
// o: {w, h, mat, gf(一樓高), openings:[{t, x, w}], parapet:'lattice'|'plain', sign, num, seed}
function paintFacade(o) {
  const P = PPU, W = Math.round(o.w * P), H = Math.round(o.h * P);
  const [c, g] = cvs(W, H);
  const R = rng(o.seed || 1);
  paintWallBase(g, W, H, o.mat, R);
  const Y = v => H - v * P;   // 高度（格）→ 畫布 y
  const gf = o.gf || 1.5;
  // 牆腳
  g.fillStyle = o.mat.foot || shade(o.mat.base, -0.3); g.fillRect(0, Y(0.16), W, 0.16 * P);
  g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, Y(0.16), W, 2);
  // 女兒牆：綠釉花磚
  if (o.parapet === 'lattice') {
    const y0 = gf + 0.22, y1 = o.h - 0.12, s = Math.min(0.34, (y1 - y0) * 0.9);
    const n = Math.floor((o.w - 0.3) / (s + 0.06));
    const start = (o.w - n * (s + 0.06) + 0.06) / 2;
    const yc = (y0 + y1) / 2;
    for (let i = 0; i < n; i++) {
      const x = (start + i * (s + 0.06)) * P, y = Y(yc + s / 2), S = s * P;
      g.fillStyle = '#e9e3d4'; g.fillRect(x - 2, y - 2, S + 4, S + 4);
      g.fillStyle = '#3f8f6a'; g.fillRect(x, y, S, S);
      g.fillStyle = '#e9e3d4';
      const q = S / 4;
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { g.beginPath(); g.arc(x + q + a * 2 * q, y + q + b * 2 * q, q * 0.62, 0, 7); g.fill(); }
      g.fillStyle = '#5fb58a'; g.beginPath(); g.arc(x + S / 2, y + S / 2, q * 0.45, 0, 7); g.fill();
      g.strokeStyle = INK; g.lineWidth = 1.6; g.strokeRect(x, y, S, S);
    }
  }
  // 開口
  for (const op of o.openings || []) {
    const x0 = op.x * P, w = op.w * P;
    if (op.t === 'door') {
      const dw = 0.78 * P, dx = x0 + (w - dw) / 2, top = Y(1.34);
      g.fillStyle = '#5a3a34'; g.fillRect(dx - 4, top - 4, dw + 8, Y(0) - top + 4);
      g.fillStyle = op.col || '#c4433a'; g.fillRect(dx, top, dw, Y(0.02) - top);
      // 鐵門上的壓花
      g.strokeStyle = shade(op.col || '#c4433a', -0.3); g.lineWidth = 2;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { rrect(g, dx + 5 + i * (dw / 2 - 2), top + 6 + j * (Y(0.02) - top - 10) / 3, dw / 2 - 12, (Y(0.02) - top - 10) / 3 - 6, 3); g.stroke(); }
      g.fillStyle = shade(op.col || '#c4433a', 0.25); for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) g.fillRect(dx + 7 + i * (dw / 2 - 2), top + 8 + j * (Y(0.02) - top - 10) / 3, dw / 2 - 16, 2);
      g.fillStyle = '#ffd84d'; g.beginPath(); g.arc(dx + dw * 0.82, Y(0.68), 2.6, 0, 7); g.fill();
      g.strokeStyle = INK; g.lineWidth = 2.4; g.strokeRect(dx, top, dw, Y(0.02) - top);
      // 門牌
      if (op.num) {
        const px = dx + dw + 6, py = Y(1.2), pw = 0.3 * P, ph = 0.14 * P;
        g.fillStyle = '#2f5fa8'; rrect(g, px, py, pw, ph, 2); g.fill();
        g.fillStyle = '#fff'; g.font = `${Math.round(ph * 0.72)}px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(op.num, px + pw / 2, py + ph / 2 + 0.5);
      }
    } else if (op.t === 'win' || op.t === 'dark') {
      const ww = 0.82 * P, wx = x0 + (w - ww) / 2, top = Y(1.34), bot = Y(0.56);
      g.fillStyle = '#d9d6cc'; g.fillRect(wx - 4, top - 4, ww + 8, bot - top + 8);
      if (op.t === 'win') {
        const gr = g.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, '#2c3a62'); gr.addColorStop(1, '#1c2440');
        g.fillStyle = gr; g.fillRect(wx, top, ww, bot - top);
        g.fillStyle = 'rgba(160,190,255,0.22)'; g.beginPath(); g.moveTo(wx + ww * 0.15, top); g.lineTo(wx + ww * 0.35, top); g.lineTo(wx + ww * 0.1, bot); g.lineTo(wx - 2, bot); g.closePath(); g.fill();
        // 窗簾
        g.fillStyle = op.curtain || '#e8b4b8'; g.fillRect(wx + 2, top + 2, ww * 0.22, bot - top - 4); g.fillRect(wx + ww * 0.78 - 2, top + 2, ww * 0.22, bot - top - 4);
        g.fillStyle = 'rgba(0,0,0,0.15)'; for (let i = 0; i < 3; i++) { g.fillRect(wx + 4 + i * 5, top + 2, 1.5, bot - top - 4); g.fillRect(wx + ww * 0.8 + i * 5, top + 2, 1.5, bot - top - 4); }
        g.fillStyle = '#d9d6cc'; g.fillRect(wx + ww / 2 - 1.5, top, 3, bot - top);
      } else {
        g.fillStyle = '#1a1c2a'; g.fillRect(wx, top, ww, bot - top);
        // 封起來的木板
        for (let i = 0; i < 3; i++) {
          g.save(); g.translate(wx + ww / 2, top + (i + 0.5) * (bot - top) / 3); g.rotate((i - 1) * 0.12 + 0.05);
          g.fillStyle = ['#8a6a48', '#7a5c3c', '#937252'][i]; g.fillRect(-ww * 0.58, -6, ww * 1.16, 12);
          g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(-ww * 0.58, -6, ww * 1.16, 12);
          g.fillStyle = '#cfcfd8'; g.fillRect(-ww * 0.48, -1.5, 3, 3); g.fillRect(ww * 0.44, -1.5, 3, 3);
          g.restore();
        }
      }
      g.strokeStyle = INK; g.lineWidth = 2.2; g.strokeRect(wx - 4, top - 4, ww + 8, bot - top + 8);
      // 窗台
      g.fillStyle = '#e6e2d6'; g.fillRect(wx - 8, bot + 3, ww + 16, 5); g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(wx - 8, bot + 3, ww + 16, 5);
      grime(g, wx - 4, bot + 8, ww + 8, P * 0.5, 0.14, R);
    } else if (op.t === 'shopwin') {
      const top = Y(1.62), bot = Y(0.34), wx = x0 + 3, ww = w - 6;
      g.fillStyle = '#4a8a5c'; g.fillRect(wx - 3, top - 3, ww + 6, bot - top + 6);
      const gr = g.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, '#2d4a60'); gr.addColorStop(1, '#203242');
      g.fillStyle = gr; g.fillRect(wx + 2, top + 2, ww - 4, bot - top - 4);
      // 櫥窗裡的花
      for (let i = 0; i < 3; i++) {
        const fx = wx + ww * (0.2 + i * 0.3), fy = bot - 8;
        g.fillStyle = '#b8714a'; g.fillRect(fx - 6, fy - 10, 12, 10);
        const col = ['#ff8fae', '#ffd84d', '#ffffff', '#d83aa2'][(i + Math.floor(op.x)) % 4];
        g.fillStyle = '#5fae5a'; g.beginPath(); g.arc(fx, fy - 16, 7, 0, 7); g.fill();
        g.fillStyle = col; for (let a = 0; a < 4; a++) { g.beginPath(); g.arc(fx + Math.cos(a * 1.6 + i) * 5, fy - 18 + Math.sin(a * 1.6 + i) * 4, 3, 0, 7); g.fill(); }
      }
      g.fillStyle = 'rgba(200,240,255,0.18)'; g.beginPath(); g.moveTo(wx + ww * 0.2, top + 2); g.lineTo(wx + ww * 0.42, top + 2); g.lineTo(wx + ww * 0.15, bot - 2); g.lineTo(wx + 2, bot - 2); g.closePath(); g.fill();
      g.strokeStyle = INK; g.lineWidth = 2.2; g.strokeRect(wx - 3, top - 3, ww + 6, bot - top + 6);
      g.fillStyle = '#4a8a5c'; g.fillRect(wx - 3, bot + 3, ww + 6, Y(0.16) - bot - 3);
    } else if (op.t === 'shopdoor') {
      const top = Y(1.62), dx = x0 + 0.1 * P, dw = w - 0.2 * P;
      g.fillStyle = '#4a8a5c'; g.fillRect(dx - 3, top - 3, dw + 6, Y(0) - top + 3);
      g.fillStyle = '#2d4a60'; g.fillRect(dx + 3, top + 3, dw - 6, Y(0.04) - top - 6);
      g.fillStyle = 'rgba(200,240,255,0.2)'; g.fillRect(dx + 6, top + 6, 5, Y(0.04) - top - 14);
      // 掛牌
      g.strokeStyle = '#c9b48a'; g.lineWidth = 1; g.beginPath(); g.moveTo(dx + dw / 2 - 8, top + 8); g.lineTo(dx + dw / 2, top + 3); g.lineTo(dx + dw / 2 + 8, top + 8); g.stroke();
      g.fillStyle = '#fff3e6'; rrect(g, dx + dw / 2 - 13, top + 8, 26, 12, 3); g.fill();
      g.fillStyle = '#c94a6a'; g.font = `${9}px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.night ? '休息中' : '營業中', dx + dw / 2, top + 14.5);
      g.fillStyle = '#ffd84d'; g.fillRect(dx + dw - 9, Y(0.8), 3, 10);
      g.strokeStyle = INK; g.lineWidth = 2.2; g.strokeRect(dx - 3, top - 3, dw + 6, Y(0) - top + 3);
    } else if (op.t === 'flap') {
      const fw = 0.46 * P, fx = x0 + (w - fw) / 2, top = Y(0.5);
      g.fillStyle = '#3a2a24'; rrect(g, fx - 4, top - 4, fw + 8, Y(0) - top + 4, 10); g.fill();
      g.fillStyle = '#9a6a42'; rrect(g, fx, top, fw, Y(0.02) - top, 8); g.fill();
      g.fillStyle = '#b5845a'; g.fillRect(fx + 3, top + 4, fw - 6, 3);
      g.strokeStyle = INK; g.lineWidth = 2; rrect(g, fx, top, fw, Y(0.02) - top, 8); g.stroke();
      // 肉球招牌
      const px = x0 + w / 2, py = Y(0.72);
      g.fillStyle = '#ff8fae'; g.beginPath(); g.ellipse(px, py + 3, 6, 5, 0, 0, 7); g.fill();
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(px - 6 + i * 4, py - 4 - (i === 1 || i === 2 ? 2 : 0), 2.4, 0, 7); g.fill(); }
    }
  }
  // 整面描邊與底部陰影
  grime(g, 0, Y(o.h - 0.1), W, P * 0.6, 0.1, R);
  const gr = g.createLinearGradient(0, Y(0.5), 0, H); gr.addColorStop(0, 'rgba(20,14,30,0)'); gr.addColorStop(1, 'rgba(20,14,30,0.3)');
  g.fillStyle = gr; g.fillRect(0, Y(0.5), W, 0.5 * P);
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return c;
}

// 屋頂：隔熱磚
function paintRoof(w, d, o = {}) {
  const P = PPU, W = Math.round(w * P), H = Math.round(d * P);
  const [c, g] = cvs(W, H);
  const R = rng(o.seed || 3);
  const base = o.base || '#b8735c';
  g.fillStyle = shade(base, -0.25); g.fillRect(0, 0, W, H);
  const s = P * 0.5;
  for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
    const v = R(); g.fillStyle = v < 0.2 ? shade(base, -0.08) : v > 0.8 ? shade(base, 0.07) : base;
    g.fillRect(x + 1.5, y + 1.5, s - 3, s - 3);
    if (R() < 0.15) { g.fillStyle = 'rgba(60,40,40,0.18)'; g.fillRect(x + 4, y + 4, s * 0.4, s * 0.3); }
  }
  // 水漬
  for (let i = 0; i < w * d * 0.15; i++) { g.fillStyle = 'rgba(40,30,40,0.12)'; g.beginPath(); g.ellipse(R() * W, R() * H, P * (0.3 + R() * 0.5), P * (0.2 + R() * 0.3), R() * 3, 0, 7); g.fill(); }
  // 排水孔
  g.fillStyle = '#3a3038'; g.beginPath(); g.arc(W - P * 0.4, H - P * 0.4, 5, 0, 7); g.fill();
  return c;
}

// 女兒牆頂、窗台這類小水泥條
function paintFlat(col, o = {}) {
  const [c, g] = cvs(64, 64);
  g.fillStyle = col; g.fillRect(0, 0, 64, 64);
  const R = rng(o.seed || 9);
  dots(g, 0, 0, 64, 64, 50, [shade(col, -0.06), shade(col, 0.06)], 0.6, 1.6, R);
  if (o.edge) { g.fillStyle = shade(col, -0.35); g.fillRect(0, 60, 64, 4); g.fillRect(0, 0, 64, 2); }
  return c;
}

// 鐵窗：只有欄杆的透明貼圖
function paintGrille(o = {}) {
  const [c, g] = cvs(128, 128);
  const col = o.col || '#d8dde6', dark = o.dark || '#2a2e3c';
  const bars = o.bars || 7;
  g.lineCap = 'round';
  const draw = (cl, w) => {
    g.strokeStyle = cl; g.lineWidth = w;
    for (let i = 0; i <= bars; i++) { const x = 4 + i * (120 / bars); g.beginPath(); g.moveTo(x, 3); g.lineTo(x, 125); g.stroke(); }
    for (const y of [4, 64, 124]) { g.beginPath(); g.moveTo(3, y); g.lineTo(125, y); g.stroke(); }
    // 捲花
    for (let i = 0; i < bars; i++) { const x = 4 + (i + 0.5) * (120 / bars); g.beginPath(); g.arc(x, 20, 120 / bars * 0.36, 0, 7); g.stroke(); }
  };
  draw(dark, 7); draw(col, 3.2);
  return c;
}
// 柵欄：鐵欄杆
function paintFence() {
  const [c, g] = cvs(128, 64);
  g.lineCap = 'round';
  const draw = (cl, w) => {
    g.strokeStyle = cl; g.lineWidth = w;
    for (let i = 0; i < 8; i++) { const x = 8 + i * 16; g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 62); g.stroke(); }
    for (const y of [12, 54]) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
  };
  draw('#1c1d27', 7); draw('#454a5e', 3.4);
  // 尖頭
  for (let i = 0; i < 8; i++) { const x = 8 + i * 16; g.fillStyle = '#1c1d27'; g.beginPath(); g.moveTo(x - 5, 12); g.lineTo(x, 1); g.lineTo(x + 5, 12); g.closePath(); g.fill(); g.fillStyle = '#5a6078'; g.beginPath(); g.moveTo(x - 2.5, 10); g.lineTo(x, 4); g.lineTo(x + 2.5, 10); g.closePath(); g.fill(); }
  return c;
}
// 浪板（雨遮、鐵皮）
function paintCorrugated(col) {
  const [c, g] = cvs(64, 64);
  for (let x = 0; x < 64; x += 8) {
    const gr = g.createLinearGradient(x, 0, x + 8, 0);
    gr.addColorStop(0, shade(col, -0.25)); gr.addColorStop(0.5, shade(col, 0.2)); gr.addColorStop(1, shade(col, -0.25));
    g.fillStyle = gr; g.fillRect(x, 0, 8, 64);
  }
  g.fillStyle = 'rgba(80,50,30,0.15)'; for (let i = 0; i < 6; i++) g.fillRect(Math.random() * 60, 50 + Math.random() * 10, 4, 14);
  g.fillStyle = INK; g.fillRect(0, 61, 64, 3);
  return c;
}
// 粉白條紋遮雨棚（含花邊）
function paintAwning(w) {
  const P = PPU, W = Math.round(w * P), H = Math.round(0.7 * P);
  const [c, g] = cvs(W, H);
  const sw = P * 0.25;
  for (let x = 0, i = 0; x < W; x += sw, i++) { g.fillStyle = i % 2 ? '#ff8fae' : '#fff4ee'; g.fillRect(x, 0, sw, H * 0.78); }
  // 荷葉邊
  for (let x = 0, i = 0; x < W; x += sw, i++) {
    g.fillStyle = i % 2 ? '#ff8fae' : '#fff4ee';
    g.beginPath(); g.moveTo(x, H * 0.76); g.arc(x + sw / 2, H * 0.76, sw / 2, 0, Math.PI); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.arc(x + sw / 2, H * 0.76, sw / 2, 0, Math.PI); g.stroke();
  }
  g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, H * 0.6, W, H * 0.18);
  g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 1.5); g.lineTo(W, 1.5); g.stroke();
  return c;
}
// 花店招牌
function paintSign(w, h, text) {
  const P = PPU, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  g.fillStyle = '#4a8a5c'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff6e8'; rrect(g, 5, 5, W - 10, H - 10, 8); g.fill();
  g.strokeStyle = '#ff8fae'; g.lineWidth = 3; rrect(g, 10, 10, W - 20, H - 20, 6); g.stroke();
  g.fillStyle = '#3a2a3a'; g.font = `${Math.round(H * 0.52)}px ${UI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, W / 2, H / 2 + 2);
  // 兩邊的小花
  for (const x of [H * 0.6, W - H * 0.6]) {
    g.fillStyle = '#ff8fae'; for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(x + Math.cos(a * 1.26) * H * 0.13, H / 2 + Math.sin(a * 1.26) * H * 0.13, H * 0.1, 0, 7); g.fill(); }
    g.fillStyle = '#ffd84d'; g.beginPath(); g.arc(x, H / 2, H * 0.07, 0, 7); g.fill();
  }
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return c;
}
// 窗戶亮燈的樣子（貼在窗洞上，不受光照）
function paintLitWindow(kind) {
  const [c, g] = cvs(64, 64);
  const top = kind === 'tv' ? ['#a9c8ff', '#6f8fe0'] : ['#ffe7a6', '#ffb85c'];
  const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, top[0]); gr.addColorStop(1, top[1]);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  // 窗簾的影子
  g.fillStyle = kind === 'tv' ? 'rgba(60,80,160,0.35)' : 'rgba(190,110,60,0.35)'; g.fillRect(0, 0, 14, 64); g.fillRect(50, 0, 14, 64);
  if (kind === 'face') {
    // 王太太探頭：捲髮剪影
    g.fillStyle = 'rgba(60,30,60,0.85)';
    g.beginPath(); g.arc(32, 40, 15, 0, 7); g.fill();
    for (let a = 0; a < 8; a++) { g.beginPath(); g.arc(32 + Math.cos(a * 0.8 - 2.6) * 14, 34 + Math.sin(a * 0.8 - 2.6) * 12, 6, 0, 7); g.fill(); }
    g.fillRect(14, 54, 36, 10);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(27, 41, 2.4, 0, 7); g.arc(37, 41, 2.4, 0, 7); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(6, 4, 3, 56);
  return c;
}
// 遠景：夜晚天際線（地圖最上面那一片）
function paintSkyline(w, h) {
  const P = 32, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0d1030'); gr.addColorStop(1, '#2a2d5c');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const R = rng(11);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + R() * 0.6})`; g.fillRect(R() * W, R() * H * 0.6, 1.5, 1.5); }
  // 月亮
  g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(W * 0.78, H * 0.28, P * 0.9, 0, 7); g.fill();
  g.fillStyle = '#e8dcae'; g.beginPath(); g.arc(W * 0.78 - 6, H * 0.28 + 4, 5, 0, 7); g.arc(W * 0.78 + 8, H * 0.28 - 6, 3, 0, 7); g.fill();
  // 樓房剪影
  let x = 0;
  while (x < W) {
    const bw = P * (1.5 + R() * 2.5), bh = H * (0.25 + R() * 0.45);
    g.fillStyle = R() < 0.5 ? '#171a3a' : '#1d2146'; g.fillRect(x, H - bh, bw, bh);
    for (let wy = H - bh + 6; wy < H - 6; wy += 9) for (let wx = x + 4; wx < x + bw - 6; wx += 8) if (R() < 0.18) { g.fillStyle = R() < 0.7 ? '#ffd27a' : '#9fc0ff'; g.fillRect(wx, wy, 4, 5); }
    if (R() < 0.4) { g.fillStyle = '#171a3a'; g.fillRect(x + bw * 0.3, H - bh - 10, bw * 0.3, 10); }
    x += bw;
  }
  return c;
}
// 水塔金屬
function paintSteel() {
  const [c, g] = cvs(128, 64);
  const gr = g.createLinearGradient(0, 0, 128, 0);
  for (let i = 0; i <= 8; i++) gr.addColorStop(i / 8, i % 2 ? '#e8edf2' : '#a8b1bd');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
  g.fillStyle = 'rgba(40,50,70,0.35)'; for (const y of [10, 32, 54]) g.fillRect(0, y, 128, 3);
  g.fillStyle = INK; g.fillRect(0, 0, 128, 2); g.fillRect(0, 62, 128, 2);
  return c;
}
function paintWood(col = '#b07a4a') {
  const [c, g] = cvs(64, 64);
  g.fillStyle = col; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 16) {
    g.fillStyle = shade(col, ((y / 16) % 2) ? -0.06 : 0.05); g.fillRect(0, y, 64, 15);
    g.strokeStyle = shade(col, -0.25); g.lineWidth = 1; g.beginPath(); g.moveTo(0, y + 8); g.bezierCurveTo(20, y + 5, 40, y + 11, 64, y + 7); g.stroke();
    g.fillStyle = shade(col, -0.4); g.fillRect(0, y + 15, 64, 1.5);
  }
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 61);
  return c;
}
function paintGlass() {
  const [c, g] = cvs(64, 64);
  g.fillStyle = 'rgba(190,230,255,0.22)'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(8, 0); g.lineTo(18, 0); g.lineTo(4, 30); g.lineTo(0, 30); g.lineTo(0, 16); g.closePath(); g.fill();
  g.fillStyle = 'rgba(245,250,255,0.95)'; g.fillRect(0, 0, 64, 3); g.fillRect(0, 61, 64, 3); g.fillRect(0, 0, 3, 64); g.fillRect(61, 0, 3, 64);
  return c;
}
// 圍牆頂的碎玻璃
function paintShards() {
  const [c, g] = cvs(128, 32);
  const R = rng(5);
  for (let i = 0; i < 16; i++) {
    const x = 4 + i * 7.6 + R() * 3, h = 10 + R() * 16;
    g.fillStyle = ['#9fe0c8', '#d0f0ff', '#7fc8a8', '#c8f2e0'][i % 4];
    g.beginPath(); g.moveTo(x - 3, 32); g.lineTo(x + (R() - 0.5) * 4, 32 - h); g.lineTo(x + 3.5, 32); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,60,60,0.6)'; g.lineWidth = 1; g.stroke();
  }
  return c;
}
// 柔和的圓形漸層（影子、光暈）
function paintRadial(inner, outer, size = 64) {
  const [c, g] = cvs(size, size);
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return c;
}
// 光錐的漸層（越遠越淡，邊緣亮一點）
function paintConeTex() {
  const [c, g] = cvs(64, 64);
  const gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0.12)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return c;
}

// ---------- 花店室內 ----------
// 後牆：淡綠條紋壁紙、掛畫、時鐘、後門
function paintShopWall(w, h, o = {}) {
  if (o.shabby) return paintShopWallOld(w, h, o);
  const P = PPU, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  const R = rng(o.seed || 12);
  g.fillStyle = '#f4ecd9'; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += P * 0.25) { g.fillStyle = 'rgba(150,200,160,0.28)'; g.fillRect(x, 0, P * 0.08, H); }
  // 小花紋
  for (let y = P * 0.2; y < H - P * 0.9; y += P * 0.5) for (let x = (y / (P * 0.5) % 2) * P * 0.25 + P * 0.12; x < W; x += P * 0.5) {
    g.fillStyle = 'rgba(255,150,180,0.35)'; for (let a = 0; a < 4; a++) { g.beginPath(); g.arc(x + Math.cos(a * 1.57) * 3, y + Math.sin(a * 1.57) * 3, 2.2, 0, 7); g.fill(); }
  }
  const Y = v => H - v * P;
  // 腰板
  g.fillStyle = '#c99a69'; g.fillRect(0, Y(0.85), W, 0.85 * P);
  for (let x = 0; x < W; x += P * 0.5) { g.strokeStyle = '#a8743f'; g.lineWidth = 2; g.strokeRect(x + 4, Y(0.78), P * 0.5 - 8, 0.62 * P); }
  g.fillStyle = '#e9d2a8'; g.fillRect(0, Y(0.9), W, 0.07 * P); g.fillStyle = INK; g.fillRect(0, Y(0.9) - 1, W, 2);
  // 後門
  if (o.door !== undefined) {
    const dx = o.door * P + 0.12 * P, dw = 0.76 * P, top = Y(1.75);
    g.fillStyle = '#6a452c'; g.fillRect(dx - 5, top - 5, dw + 10, Y(0) - top + 5);
    g.fillStyle = '#9a6a42'; g.fillRect(dx, top, dw, Y(0) - top);
    g.fillStyle = '#b5845a'; g.strokeStyle = '#6a452c'; g.lineWidth = 2;
    g.strokeRect(dx + 6, top + 8, dw - 12, (Y(0) - top) * 0.42); g.strokeRect(dx + 6, top + 14 + (Y(0) - top) * 0.42, dw - 12, (Y(0) - top) * 0.45);
    g.fillStyle = '#9fd4e8'; g.fillRect(dx + 12, top + 14, dw - 24, (Y(0) - top) * 0.3);
    g.fillStyle = '#ffd84d'; g.beginPath(); g.arc(dx + dw - 10, Y(0.85), 3.5, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(dx - 5, top - 5, dw + 10, Y(0) - top + 5);
    // 門上的小招牌「員工」
    g.fillStyle = '#fff8ee'; rrect(g, dx + dw / 2 - 18, top - 22, 36, 14, 3); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; rrect(g, dx + dw / 2 - 18, top - 22, 36, 14, 3); g.stroke();
    g.fillStyle = '#6a452c'; g.font = `10px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('倉庫', dx + dw / 2, top - 14.5);
  }
  // 掛畫
  for (const [px, kind] of (o.pics || [])) {
    const X = px * P, y = Y(2.0), pw = P * 0.7, ph = P * 0.55;
    g.fillStyle = '#8a6a4a'; g.fillRect(X - 5, y - 5, pw + 10, ph + 10);
    g.fillStyle = '#fff6e6'; g.fillRect(X, y, pw, ph);
    if (kind === 0) { g.fillStyle = '#5fae5a'; g.fillRect(X + pw / 2 - 1.5, y + ph * 0.4, 3, ph * 0.5); g.fillStyle = '#ff8fae'; for (let a = 0; a < 6; a++) { g.beginPath(); g.arc(X + pw / 2 + Math.cos(a) * 8, y + ph * 0.35 + Math.sin(a) * 7, 5, 0, 7); g.fill(); } g.fillStyle = '#ffd84d'; g.beginPath(); g.arc(X + pw / 2, y + ph * 0.35, 4, 0, 7); g.fill(); }
    else { g.fillStyle = '#9fd4e8'; g.fillRect(X, y, pw, ph * 0.55); g.fillStyle = '#7cc56f'; g.beginPath(); g.moveTo(X, y + ph); g.lineTo(X + pw * 0.4, y + ph * 0.35); g.lineTo(X + pw * 0.7, y + ph * 0.6); g.lineTo(X + pw, y + ph * 0.4); g.lineTo(X + pw, y + ph); g.closePath(); g.fill(); g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(X + pw * 0.78, y + ph * 0.22, 5, 0, 7); g.fill(); }
    g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(X - 5, y - 5, pw + 10, ph + 10);
  }
  // 時鐘
  if (o.clock !== undefined) {
    const X = o.clock * P, y = Y(2.15), r = P * 0.22;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(X, y, r, 0, 7); g.fill(); g.strokeStyle = '#c94a6a'; g.lineWidth = 4; g.stroke();
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(X, y); g.lineTo(X, y - r * 0.7); g.moveTo(X, y); g.lineTo(X + r * 0.5, y + r * 0.1); g.stroke();
  }
  const gr = g.createLinearGradient(0, 0, 0, P * 0.6); gr.addColorStop(0, 'rgba(40,30,20,0.18)'); gr.addColorStop(1, 'rgba(40,30,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, P * 0.6);
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return c;
}
// 還沒整理的店：泛黃、水漬、壁紙剝落、蜘蛛網、掉下來的畫、停掉的時鐘
function paintShopWallOld(w, h, o = {}) {
  const P = PPU, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  const R = rng((o.seed || 12) + 5);
  g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += P * 0.25) { g.fillStyle = 'rgba(120,140,110,0.16)'; g.fillRect(x, 0, P * 0.08, H); }
  // 泛黃、水漬
  for (let i = 0; i < Math.max(6, w * 1.2); i++) {
    const x = R() * W, y = R() * H * 0.5, r = (0.25 + R() * 0.5) * P;
    const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(150,110,60,0.28)'); gr.addColorStop(0.7, 'rgba(150,110,60,0.12)'); gr.addColorStop(1, 'rgba(150,110,60,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y + r * 0.4, r * 0.7, r * 1.3, 0, 0, 7); g.fill();
  }
  // 漏水的痕跡（往下流）
  for (let i = 0; i < Math.max(2, Math.floor(w / 4)); i++) {
    const x = (0.1 + R() * 0.8) * W; g.strokeStyle = 'rgba(120,90,50,0.3)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, H * 0.15, x - 4, H * 0.3, x + 3, H * (0.35 + R() * 0.2)); g.stroke();
  }
  const Y = v => H - v * P;
  // 剝落的壁紙：露出灰灰的水泥
  for (let i = 0; i < Math.max(3, Math.floor(w / 2.5)); i++) {
    const x = R() * (W - P), y = Y(2.3) + R() * P * 0.9, pw = (0.35 + R() * 0.4) * P, ph = (0.3 + R() * 0.35) * P;
    g.fillStyle = '#a9a49a'; g.beginPath(); g.moveTo(x, y); for (let k = 0; k <= 8; k++) g.lineTo(x + pw * k / 8, y + (k % 2 ? 6 : 0) + R() * 5); g.lineTo(x + pw, y + ph); for (let k = 8; k >= 0; k--) g.lineTo(x + pw * k / 8, y + ph - (k % 2 ? 7 : 0) - R() * 5); g.closePath(); g.fill();
    g.fillStyle = 'rgba(80,80,80,0.25)'; for (let k = 0; k < 6; k++) g.fillRect(x + R() * pw, y + 6 + R() * (ph - 12), 2, 2);
    // 捲起來的壁紙角
    g.fillStyle = '#efe6cf'; g.beginPath(); g.moveTo(x + pw, y); g.quadraticCurveTo(x + pw + 14, y + 10, x + pw + 4, y + 26); g.lineTo(x + pw - 6, y + 4); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(43,34,51,0.55)'; g.lineWidth = 1.5; g.stroke();
  }
  // 裂縫
  g.strokeStyle = 'rgba(60,50,40,0.45)'; g.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) { let x = R() * W, y = Y(2.6); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (R() - 0.5) * 18; y += 10 + R() * 12; g.lineTo(x, y); } g.stroke(); }
  // 腰板：漆掉了
  g.fillStyle = '#a78a66'; g.fillRect(0, Y(0.85), W, 0.85 * P);
  for (let x = 0; x < W; x += P * 0.5) { g.strokeStyle = '#86683f'; g.lineWidth = 2; g.strokeRect(x + 4, Y(0.78), P * 0.5 - 8, 0.62 * P); if (R() < 0.5) { g.fillStyle = '#8f7a5e'; g.fillRect(x + 8 + R() * 10, Y(0.6), 10 + R() * 14, 8 + R() * 10); } }
  g.fillStyle = '#c9b48e'; g.fillRect(0, Y(0.9), W, 0.07 * P); g.fillStyle = INK; g.fillRect(0, Y(0.9) - 1, W, 2);
  // 後門（舊舊的）
  if (o.door !== undefined) {
    const dx = o.door * P + 0.12 * P, dw = 0.76 * P, top = Y(1.75);
    g.fillStyle = '#5a3e2a'; g.fillRect(dx - 5, top - 5, dw + 10, Y(0) - top + 5);
    g.fillStyle = '#7e5a3e'; g.fillRect(dx, top, dw, Y(0) - top);
    g.strokeStyle = '#4a3020'; g.lineWidth = 2; g.strokeRect(dx + 6, top + 8, dw - 12, (Y(0) - top) * 0.42); g.strokeRect(dx + 6, top + 14 + (Y(0) - top) * 0.42, dw - 12, (Y(0) - top) * 0.45);
    g.fillStyle = '#7a8a90'; g.fillRect(dx + 12, top + 14, dw - 24, (Y(0) - top) * 0.3);
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(dx + 14, top + 18); g.lineTo(dx + dw - 16, top + 14 + (Y(0) - top) * 0.28); g.stroke();
    g.fillStyle = '#b89a4a'; g.beginPath(); g.arc(dx + dw - 10, Y(0.85), 3.5, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(dx - 5, top - 5, dw + 10, Y(0) - top + 5);
  }
  // 掉了一幅畫：只剩一個比較白的方塊跟釘子；另一幅歪掉
  for (const [px, kind] of (o.pics || [])) {
    const X = px * P, y = Y(2.0), pw = P * 0.7, ph = P * 0.55;
    if (kind === 0) {
      g.fillStyle = 'rgba(255,248,230,0.55)'; g.fillRect(X - 5, y - 5, pw + 10, ph + 10);
      g.fillStyle = '#6a6a72'; g.beginPath(); g.arc(X + pw / 2, y - 12, 2.5, 0, 7); g.fill();
    } else {
      g.save(); g.translate(X + pw / 2, y + ph / 2); g.rotate(0.16);
      g.fillStyle = '#6e5a46'; g.fillRect(-pw / 2 - 5, -ph / 2 - 5, pw + 10, ph + 10);
      g.fillStyle = '#c9c0a8'; g.fillRect(-pw / 2, -ph / 2, pw, ph);
      g.fillStyle = '#9aa898'; g.beginPath(); g.moveTo(-pw / 2, ph / 2); g.lineTo(-pw * 0.1, -ph * 0.15); g.lineTo(pw * 0.2, ph * 0.1); g.lineTo(pw / 2, -ph * 0.1); g.lineTo(pw / 2, ph / 2); g.closePath(); g.fill();
      g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(-pw / 2 - 5, -ph / 2 - 5, pw + 10, ph + 10);
      g.restore();
    }
  }
  // 停掉的時鐘（電池沒電）
  if (o.clock !== undefined) {
    const X = o.clock * P, y = Y(2.15), r = P * 0.22;
    g.fillStyle = '#e8e2d4'; g.beginPath(); g.arc(X, y, r, 0, 7); g.fill(); g.strokeStyle = '#8a6a5a'; g.lineWidth = 4; g.stroke();
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(X, y); g.lineTo(X - r * 0.55, y + r * 0.35); g.moveTo(X, y); g.lineTo(X + r * 0.2, y + r * 0.65); g.stroke();
    g.strokeStyle = 'rgba(43,34,51,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X - r * 0.7, y - r * 0.2); g.lineTo(X + r * 0.3, y + r * 0.5); g.stroke();
  }
  // 撕了一半的「特價」海報
  {
    const X = W * 0.42, y = Y(2.25);
    g.fillStyle = '#f6efe0'; g.beginPath(); g.moveTo(X, y); g.lineTo(X + P * 0.6, y); g.lineTo(X + P * 0.55, y + P * 0.25); g.lineTo(X + P * 0.4, y + P * 0.35); g.lineTo(X + P * 0.2, y + P * 0.3); g.lineTo(X, y + P * 0.42); g.closePath(); g.fill();
    g.fillStyle = '#d9465a'; g.font = `${Math.round(P * 0.16)}px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('特價', X + P * 0.3, y + P * 0.13);
    g.strokeStyle = 'rgba(43,34,51,0.6)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(220,210,170,0.8)'; g.fillRect(X - 3, y - 3, 12, 8); g.fillRect(X + P * 0.6 - 9, y - 3, 12, 8);
  }
  // 蜘蛛網（左上、右上）
  const web = (x, y, sx) => {
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1;
    const L = P * 0.55;
    for (let k = 0; k <= 4; k++) { const a = k / 4 * Math.PI / 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sx * Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    for (let rr = 0.25; rr <= 1; rr += 0.25) { g.beginPath(); for (let k = 0; k <= 4; k++) { const a = k / 4 * Math.PI / 2; const px = x + sx * Math.cos(a) * L * rr, py = y + Math.sin(a) * L * rr; if (k) g.quadraticCurveTo((px + x + sx * Math.cos(a - 0.2) * L * rr) / 2, (py + y + Math.sin(a - 0.2) * L * rr) / 2 + 3, px, py); else g.moveTo(px, py); } g.stroke(); }
  };
  web(4, 4, 1); web(W - 4, 4, -1);
  const gr = g.createLinearGradient(0, 0, 0, P * 0.8); gr.addColorStop(0, 'rgba(40,30,20,0.3)'); gr.addColorStop(1, 'rgba(40,30,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, P * 0.8);
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return c;
}
// 空空的架子：灰塵、倒掉的空盆、枯掉的一兩盆
function paintShelfEmpty(w, h, o = {}) {
  const P = PPU, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  const R = rng((o.seed || 4) + 9);
  g.fillStyle = '#6e5038'; g.fillRect(0, 0, W, H);
  const rows = 2, rh = (H - 10) / rows;
  for (let r = 0; r < rows; r++) {
    const y = 5 + r * rh;
    g.fillStyle = '#3e2a1c'; g.fillRect(6, y + 4, W - 12, rh - 8);
    for (let x = 14; x < W - 14; x += P * 0.42) {
      const pw = P * 0.24, py = y + rh - 8, k = R();
      if (k < 0.18) {
        // 枯掉的
        g.fillStyle = '#9a6a4a'; g.fillRect(x, py - pw * 0.8, pw, pw * 0.8); g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x, py - pw * 0.8, pw, pw * 0.8);
        g.strokeStyle = '#8a7a52'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + pw / 2, py - pw * 0.8); g.quadraticCurveTo(x + pw / 2 + 3, py - pw * 1.4, x + pw, py - pw * 1.2); g.stroke();
        g.fillStyle = '#a07a5a'; g.beginPath(); g.ellipse(x + pw + 1, py - pw * 1.15, 3, 2, 0.4, 0, 7); g.fill();
      } else if (k < 0.3) {
        // 倒下來的空盆
        g.save(); g.translate(x + pw / 2, py - pw * 0.3); g.rotate(1.3);
        g.fillStyle = '#b88a6a'; g.fillRect(-pw * 0.4, -pw * 0.35, pw * 0.8, pw * 0.7); g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(-pw * 0.4, -pw * 0.35, pw * 0.8, pw * 0.7);
        g.restore();
      } else if (k < 0.42) {
        // 空盆
        g.fillStyle = '#a8a294'; g.fillRect(x, py - pw * 0.7, pw * 0.9, pw * 0.7); g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x, py - pw * 0.7, pw * 0.9, pw * 0.7);
      }
    }
    // 灰塵
    g.fillStyle = 'rgba(220,214,200,0.35)'; for (let i = 0; i < W / 6; i++) g.fillRect(8 + R() * (W - 16), y + rh - 10 - R() * 4, 2, 1.5);
    g.fillStyle = '#86603e'; g.fillRect(0, y + rh - 6, W, 7); g.fillStyle = INK; g.fillRect(0, y + rh + 1, W, 1.5);
    g.fillStyle = 'rgba(230,226,214,0.4)'; g.fillRect(0, y + rh - 6, W, 2);
  }
  // 褪色的價格牌
  g.fillStyle = '#efe6cf'; rrect(g, W * 0.62, H * 0.56, P * 0.42, P * 0.18, 3); g.fill();
  g.fillStyle = '#b06a5a'; g.font = `${Math.round(P * 0.11)}px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('出清 $50', W * 0.62 + P * 0.21, H * 0.56 + P * 0.09);
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return c;
}
// 玻璃上的「頂讓」告示
function paintNotice() {
  const [c, g] = cvs(160, 200);
  g.fillStyle = '#fbf8f0'; g.fillRect(6, 6, 148, 188);
  g.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 30; i++) g.fillRect(6 + Math.random() * 148, 6 + Math.random() * 188, 6, 1);
  g.fillStyle = '#d42a3a'; g.font = `900 64px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('頂', 80, 52); g.fillText('讓', 80, 118);
  g.fillStyle = '#4a3a4a'; g.font = `16px ${BOLD_FONT}`; g.fillText('店面便宜出租', 80, 160);
  for (let i = 0; i < 6; i++) { g.save(); g.translate(20 + i * 24, 186); g.rotate(-0.06); g.fillStyle = '#e6e0d0'; g.fillRect(-9, -10, 18, 14); g.fillStyle = '#4a3a4a'; g.font = '9px sans-serif'; g.fillText('09', 0, -3); g.restore(); }
  g.fillStyle = 'rgba(240,220,150,0.85)'; g.fillRect(0, 0, 34, 14); g.fillRect(126, 0, 34, 14);
  g.strokeStyle = 'rgba(43,34,51,0.4)'; g.lineWidth = 2; g.strokeRect(6, 6, 148, 188);
  return c;
}
// 架子正面：一格一格放著盆花
function paintShelfFront(w, h, o = {}) {
  const P = PPU, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  const R = rng(o.seed || 4);
  g.fillStyle = '#8a5e3c'; g.fillRect(0, 0, W, H);
  const rows = 2, rh = (H - 10) / rows;
  for (let r = 0; r < rows; r++) {
    const y = 5 + r * rh;
    g.fillStyle = '#5a3a26'; g.fillRect(6, y + 4, W - 12, rh - 8);
    for (let x = 14; x < W - 14; x += P * 0.42) {
      const pw = P * 0.24, py = y + rh - 8;
      g.fillStyle = ['#c26a4a', '#d9d6cc', '#5f86b5', '#c9a03a'][Math.floor(R() * 4)]; g.fillRect(x, py - pw * 0.8, pw, pw * 0.8);
      g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x, py - pw * 0.8, pw, pw * 0.8);
      g.fillStyle = '#5fae5a'; g.beginPath(); g.arc(x + pw / 2, py - pw * 1.05, pw * 0.42, 0, 7); g.fill();
      const col = ['#ff8fae', '#ffd84d', '#ffffff', '#d83aa2', '#ff9a4a'][Math.floor(R() * 5)];
      g.fillStyle = col; for (let a = 0; a < 3; a++) { g.beginPath(); g.arc(x + pw / 2 + (a - 1) * pw * 0.28, py - pw * 1.2 - (a % 2) * 3, pw * 0.16, 0, 7); g.fill(); }
    }
    g.fillStyle = '#a77650'; g.fillRect(0, y + rh - 6, W, 7); g.fillStyle = INK; g.fillRect(0, y + rh + 1, W, 1.5);
  }
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return c;
}
function paintCounterFront(w, h) {
  const P = PPU, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  g.fillStyle = '#9a6a42'; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += P * 0.5) { g.fillStyle = '#8a5e3c'; g.fillRect(x + 6, 10, P * 0.5 - 12, H - 20); g.strokeStyle = '#6a452c'; g.lineWidth = 2; g.strokeRect(x + 6, 10, P * 0.5 - 12, H - 20); }
  g.fillStyle = '#c99266'; g.fillRect(0, 0, W, 6);
  // 招財貓貼紙
  const sx = W * 0.5, sy = H * 0.5;
  g.fillStyle = '#fff6e8'; g.beginPath(); g.arc(sx, sy, 14, 0, 7); g.fill(); g.strokeStyle = '#d94a5a'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#d94a5a'; g.font = `14px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('福', sx, sy + 1);
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return c;
}

// 花店外面：紅磚人行道 + 馬路
function paintStreet(w, d) {
  const P = 40, W = Math.round(w * P), H = Math.round(d * P);
  const [c, g] = cvs(W, H);
  const R = rng(19);
  const sw = 2.2 * P;
  g.fillStyle = '#b8705a'; g.fillRect(0, 0, W, sw);
  for (let y = 0, r = 0; y < sw; y += P * 0.25, r++) for (let x = (r % 2) * P * 0.25; x < W; x += P * 0.5) {
    g.fillStyle = R() < 0.3 ? '#a8604c' : R() > 0.8 ? '#c98a72' : '#b8705a'; g.fillRect(x + 1, y + 1, P * 0.5 - 2, P * 0.25 - 2);
  }
  g.fillStyle = '#d9d4c8'; g.fillRect(0, sw, W, P * 0.22); g.fillStyle = '#8f8a80'; g.fillRect(0, sw + P * 0.22, W, 3);
  g.fillStyle = '#5c5f70'; g.fillRect(0, sw + P * 0.25, W, H);
  dots(g, 0, sw + P * 0.25, W, H, W * H / 70, ['#666a7c', '#535667', '#70738a'], 0.6, 1.6, R);
  g.fillStyle = '#f2efe4'; for (let x = 0; x < W; x += P * 1.6) g.fillRect(x, sw + P * 2.6, P * 0.9, P * 0.12);
  g.fillStyle = '#e8c44a'; g.fillRect(0, sw + P * 0.45, W, P * 0.07);
  return c;
}

// ---------- 花店升級的道具 ----------
// 霓虹燈：透明底、發光的管子（不受光照，靠光暈發亮）
function paintNeon(kind) {
  const W = kind === 'open' ? 256 : 192, H = kind === 'open' ? 96 : 160;
  const [c, g] = cvs(W, H);
  g.fillStyle = 'rgba(30,20,40,0.85)'; rrect(g, 4, 4, W - 8, H - 8, 14); g.fill();
  g.strokeStyle = 'rgba(80,60,90,0.9)'; g.lineWidth = 3; rrect(g, 4, 4, W - 8, H - 8, 14); g.stroke();
  const tube = (draw, col) => {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = col; g.shadowBlur = 14; g.strokeStyle = col; g.lineWidth = 9; draw(); g.stroke();
    g.shadowBlur = 0; g.strokeStyle = '#fff6fb'; g.lineWidth = 3.2; draw(); g.stroke();
    g.restore();
  };
  if (kind === 'open') {
    g.font = `900 52px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.save(); g.shadowColor = '#ff5aa8'; g.shadowBlur = 18; g.fillStyle = '#ff7ab8'; g.fillText('營業中', W / 2, H / 2 + 2); g.restore();
    g.fillStyle = '#fff0f8'; g.font = `900 50px ${BOLD_FONT}`; g.fillText('營業中', W / 2, H / 2 + 2);
    tube(() => { g.beginPath(); g.moveTo(22, 22); g.lineTo(W - 22, 22); }, '#5ad8ff');
    tube(() => { g.beginPath(); g.moveTo(22, H - 22); g.lineTo(W - 22, H - 22); }, '#5ad8ff');
  } else {
    // 愛心 + 小貓 + 花
    tube(() => { g.beginPath(); const cx = W / 2, cy = H * 0.56; g.moveTo(cx, cy + 46); g.bezierCurveTo(cx - 90, cy - 10, cx - 46, cy - 76, cx, cy - 34); g.bezierCurveTo(cx + 46, cy - 76, cx + 90, cy - 10, cx, cy + 46); }, '#ff5aa8');
    tube(() => { g.beginPath(); const cx = W / 2, cy = H * 0.52; g.moveTo(cx - 24, cy + 14); g.lineTo(cx - 24, cy - 10); g.lineTo(cx - 14, cy - 22); g.lineTo(cx - 6, cy - 10); g.lineTo(cx + 6, cy - 10); g.lineTo(cx + 14, cy - 22); g.lineTo(cx + 24, cy - 10); g.lineTo(cx + 24, cy + 14); g.closePath(); }, '#ffd25a');
    tube(() => { g.beginPath(); const cx = W / 2, cy = H * 0.52; g.arc(cx - 9, cy, 2, 0, 7); g.moveTo(cx + 11, cy); g.arc(cx + 9, cy, 2, 0, 7); }, '#ffd25a');
  }
  return c;
}
// 冷藏花櫃的玻璃門（內部亮著）
function paintFridge(w, h) {
  const P = PPU, W = Math.round(w * P), H = Math.round(h * P);
  const [c, g] = cvs(W, H);
  g.fillStyle = '#e8eef4'; g.fillRect(0, 0, W, H);
  const gx = 8, gy = 14, gw = W - 16, gh = H - 34;
  const gr = g.createLinearGradient(0, gy, 0, gy + gh); gr.addColorStop(0, '#f4fbff'); gr.addColorStop(1, '#cfe8f4');
  g.fillStyle = gr; g.fillRect(gx, gy, gw, gh);
  const R = rng(33);
  for (let r = 0; r < 3; r++) {
    const sy = gy + (r + 1) * gh / 3;
    for (let x = gx + 12; x < gx + gw - 8; x += 26) {
      g.fillStyle = '#9aa8b8'; g.fillRect(x - 8, sy - 16, 16, 14);
      const col = ['#e8394d', '#ff9fcb', '#ffffff', '#d83aa2', '#ffd84d'][Math.floor(R() * 5)];
      g.fillStyle = '#5fae5a'; g.beginPath(); g.arc(x, sy - 22, 9, 0, 7); g.fill();
      g.fillStyle = col; for (let a = 0; a < 4; a++) { g.beginPath(); g.arc(x + Math.cos(a * 1.7) * 6, sy - 25 + Math.sin(a * 1.7) * 4, 4, 0, 7); g.fill(); }
    }
    g.fillStyle = '#b8c4d0'; g.fillRect(gx, sy - 2, gw, 3);
  }
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(gx + gw * 0.15, gy); g.lineTo(gx + gw * 0.32, gy); g.lineTo(gx + gw * 0.12, gy + gh); g.lineTo(gx, gy + gh); g.closePath(); g.fill();
  g.fillStyle = '#5a6a7e'; g.fillRect(gx + gw - 10, gy + gh * 0.35, 5, gh * 0.3);
  g.fillStyle = '#3f8f6a'; g.fillRect(0, 0, W, 12); g.fillStyle = '#fff'; g.font = `9px ${BOLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('冷藏鮮花', W / 2, 6.5);
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3); g.strokeRect(gx, gy, gw, gh);
  return c;
}
