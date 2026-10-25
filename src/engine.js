// ================= 引擎：輸入、聲音、畫面、視線 =================
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); }
function angLerp(a, b, t) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function fmtTime(min) { const m = ((Math.floor(min) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function money(n) { return 'NT$ ' + Math.round(n).toLocaleString('en-US'); }
function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }

// ---------- 聲音（全部用合成，不載入檔案） ----------
const SFX = {
  ctx: null, master: null, muted: false,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  resume() { try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { } },
  tone(freq, dur, o = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.to), t + dur);
    const v = o.vol === undefined ? 0.25 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + dur + 0.02);
    if (o.vib) { const l = this.ctx.createOscillator(), lg = this.ctx.createGain(); l.frequency.value = o.vib; lg.gain.value = freq * 0.04; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur); }
  },
  noise(dur, o = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = o.ftype || 'lowpass'; f.frequency.value = o.freq || 1500;
    const g = this.ctx.createGain(); g.gain.value = o.vol === undefined ? 0.3 : o.vol;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  },
  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'ui': this.tone(660, 0.06, { vol: 0.12 }); break;
      case 'pick': this.tone(520, 0.08, { to: 980, vol: 0.18 }); this.tone(1200, 0.06, { delay: 0.07, vol: 0.1, type: 'triangle' }); break;
      case 'drop': [660, 880, 1320].forEach((f, i) => this.tone(f, 0.12, { delay: i * 0.07, vol: 0.14, type: 'triangle' })); break;
      case 'petal': this.tone(1800, 0.03, { vol: 0.05, type: 'triangle' }); break;
      case 'step': this.noise(0.03, { vol: 0.05, freq: 700 }); break;
      case 'knock': this.noise(0.25, { vol: 0.5, freq: 2600 }); this.tone(320, 0.3, { to: 180, vol: 0.18, type: 'triangle' }); this.tone(1240, 0.2, { delay: 0.05, vol: 0.08, type: 'triangle' }); break;
      case 'bark': [0, 0.22].forEach(d => { this.tone(330, 0.11, { to: 200, delay: d, vol: 0.28 }); this.noise(0.08, { delay: d, vol: 0.25, freq: 900 }); }); break;
      case 'q': this.tone(500, 0.09, { to: 760, vol: 0.14 }); break;
      case 'ex': this.tone(880, 0.07, { vol: 0.2 }); this.tone(1320, 0.12, { delay: 0.08, vol: 0.2 }); break;
      case 'meow': this.tone(620, 0.45, { to: 520, vol: 0.2, type: 'sawtooth', vib: 7 }); this.tone(820, 0.2, { to: 640, delay: 0.02, vol: 0.06, type: 'triangle' }); break;
      case 'purr': this.noise(0.6, { vol: 0.12, freq: 260 }); break;
      case 'heart': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.16, { delay: i * 0.08, vol: 0.13, type: 'triangle' })); break;
      case 'fail': [440, 370, 294].forEach((f, i) => this.tone(f, 0.2, { delay: i * 0.12, vol: 0.16, type: 'square' })); break;
      case 'coin': this.tone(1320, 0.05, { vol: 0.08, type: 'square' }); this.tone(1760, 0.07, { delay: 0.04, vol: 0.08, type: 'square' }); break;
      case 'buy': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.1, { delay: i * 0.05, vol: 0.13, type: 'square' })); break;
      case 'alarm': [0, 0.25, 0.5].forEach(d => { this.tone(1400, 0.12, { delay: d, vol: 0.16 }); this.tone(1000, 0.1, { delay: d + 0.12, vol: 0.16 }); }); break;
      case 'scooter': for (let i = 0; i < 6; i++) this.tone(i % 2 ? 900 : 1300, 0.12, { delay: i * 0.13, vol: 0.14, type: 'sawtooth' }); break;
      case 'light': this.tone(2200, 0.04, { vol: 0.1 }); this.tone(1400, 0.05, { delay: 0.03, vol: 0.08 }); break;
      case 'jump': this.tone(300, 0.22, { to: 900, vol: 0.14, type: 'triangle' }); break;
      case 'door': this.noise(0.12, { vol: 0.2, freq: 500 }); this.tone(180, 0.1, { vol: 0.1 }); break;
      case 'nope': this.tone(220, 0.15, { vol: 0.15 }); break;
      case 'chime': [1047, 1319].forEach((f, i) => this.tone(f, 0.25, { delay: i * 0.12, vol: 0.12, type: 'triangle' })); break;
      case 'cricket': this.tone(4200 + Math.random() * 500, 0.04, { vol: 0.025, type: 'triangle' }); this.tone(4300, 0.04, { delay: 0.06, vol: 0.02, type: 'triangle' }); break;
    }
  },
};

// ---------- 輸入：浮動搖桿 + 鍵盤 ----------
const Input = {
  stick: null, keys: new Set(), onAction: null, onWait: null, onPause: null, onKey: null, onSkill: null, game: null,
  knobEl: null, baseEl: null, R: 46,
  init(zone, baseEl, knobEl) {
    this.baseEl = baseEl; this.knobEl = knobEl;
    zone.addEventListener('pointerdown', e => {
      if (this.game) { SFX.init(); SFX.resume(); e.preventDefault(); this.game('down', e); return; }
      if (this.stick) return;
      SFX.init(); SFX.resume();
      this.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, cx: e.clientX, cy: e.clientY, x: 0, y: 0 };
      try { zone.setPointerCapture(e.pointerId); } catch (er) { }
      this.showStick(true);
      e.preventDefault();
    });
    const move = e => {
      if (this.game) { this.game('move', e); return; }
      if (!this.stick || e.pointerId !== this.stick.id) return;
      this.stick.cx = e.clientX; this.stick.cy = e.clientY;
      let dx = e.clientX - this.stick.ox, dy = e.clientY - this.stick.oy;
      const d = Math.hypot(dx, dy);
      if (d > this.R) {
        // 拖太遠時，底座跟著手指走
        const k = (d - this.R) / d;
        this.stick.ox += dx * k; this.stick.oy += dy * k;
        dx = e.clientX - this.stick.ox; dy = e.clientY - this.stick.oy;
      }
      this.stick.x = dx / this.R; this.stick.y = dy / this.R;
      this.showStick(true);
      e.preventDefault();
    };
    const up = e => {
      if (this.game) { this.game('up', e); if (this.stick && e.pointerId === this.stick.id) { this.stick = null; this.showStick(false); } return; }
      if (!this.stick || e.pointerId !== this.stick.id) return;
      this.stick = null; this.showStick(false);
    };
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerup', up);
    zone.addEventListener('pointercancel', up);
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (this.game) { if (!e.repeat && this.game('key', k)) e.preventDefault(); else if (e.repeat) e.preventDefault(); return; }
      if (this.onKey && this.onKey(k, e)) { e.preventDefault(); return; }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift', 'w', 'a', 's', 'd', 'e', 'q', 'enter', 'escape', 'p'].includes(k)) e.preventDefault();
      if (k === ' ' || k === 'e' || k === 'enter') { if (!e.repeat && this.onAction) this.onAction(); return; }
      if (k === 'q') { if (!e.repeat && this.onWait) this.onWait(); return; }
      if (k === 'f' || k === 'r' || k === 't') { e.preventDefault(); if (!e.repeat && this.onSkill) this.onSkill('frt'.indexOf(k)); return; }
      if (k === 'escape' || k === 'p') { if (!e.repeat && this.onPause) this.onPause(); return; }
      this.keys.add(k);
    });
    window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); this.keys.delete(k); if (this.game) this.game('keyup', k); });
    window.addEventListener('blur', () => { this.keys.clear(); this.stick = null; this.showStick(false); });
  },
  showStick(on) {
    if (!this.baseEl) return;
    if (!on || !this.stick) { this.baseEl.hidden = true; return; }
    this.baseEl.hidden = false;
    this.baseEl.style.transform = `translate(${this.stick.ox}px, ${this.stick.oy}px)`;
    const m = Math.min(1, Math.hypot(this.stick.x, this.stick.y));
    const a = Math.atan2(this.stick.y, this.stick.x);
    this.knobEl.style.transform = `translate(${Math.cos(a) * m * this.R}px, ${Math.sin(a) * m * this.R}px)`;
    this.baseEl.classList.toggle('run', m > 0.72);
  },
  // 暫停移動但不放開手指：搖桿以手指目前位置重新置中，之後繼續拖就能走
  release() {
    this.keys.clear();
    if (this.stick) { this.stick.ox = this.stick.cx; this.stick.oy = this.stick.cy; this.stick.x = 0; this.stick.y = 0; this.showStick(true); }
  },
  // 回傳 {x, y, mag}；mag>0.72 視為奔跑
  vector() {
    let x = 0, y = 0, mag = 0;
    if (this.stick) {
      x = this.stick.x; y = this.stick.y; mag = Math.min(1, Math.hypot(x, y));
    } else {
      const K = this.keys;
      if (K.has('arrowleft') || K.has('a')) x -= 1;
      if (K.has('arrowright') || K.has('d')) x += 1;
      if (K.has('arrowup') || K.has('w')) y -= 1;
      if (K.has('arrowdown') || K.has('s')) y += 1;
      if (x || y) mag = K.has('shift') ? 1 : 0.5;
    }
    const l = Math.hypot(x, y) || 1;
    return { x: x / l, y: y / l, mag };
  },
};

// ---------- 畫面 ----------
const View = {
  w: 180, h: 300, scale: 2, dpr: 1,
  screen: null, sctx: null, back: null, ctx: null, light: null, lctx: null,
  init(screen) {
    this.screen = screen; this.sctx = screen.getContext('2d');
    this.back = document.createElement('canvas'); this.ctx = this.back.getContext('2d');
    this.light = document.createElement('canvas'); this.lctx = this.light.getContext('2d');
    this.resize();
  },
  resize() {
    const host = this.screen.parentElement;
    const W = Math.max(200, host.clientWidth || window.innerWidth), H = Math.max(200, host.clientHeight || window.innerHeight);
    const scale = Math.min(W / 180, H / 240);
    this.scale = scale;
    this.w = Math.floor(W / scale); this.h = Math.floor(H / scale);
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.back.width = this.w; this.back.height = this.h;
    this.light.width = this.w; this.light.height = this.h;
    this.ctx.imageSmoothingEnabled = false;
    if (R3.on) { R3.resize(W, H, window.devicePixelRatio || 1); return; }
    this.screen.width = Math.round(W * this.dpr); this.screen.height = Math.round(H * this.dpr);
    this.screen.style.width = W + 'px'; this.screen.style.height = H + 'px';
    this.ctx.imageSmoothingEnabled = false;
  },
  present() {
    const s = this.sctx;
    s.imageSmoothingEnabled = false;
    s.fillStyle = '#12142a'; s.fillRect(0, 0, this.screen.width, this.screen.height);
    const k = this.scale * this.dpr;
    s.drawImage(this.back, 0, 0, this.w, this.h, 0, 0, Math.round(this.w * k), Math.round(this.h * k));
  },
};

// 攝影機：cx, cy 是畫面中心的世界座標
const Cam = {
  cx: 90, cy: 150, zoom: 1, tz: 1,
  follow(tx, ty, map, dt, snap) {
    const z = this.zoom;
    const hw = View.w / (2 * z), hh = View.h / (2 * z);
    let x = tx, y = ty;
    x = map.pw <= hw * 2 ? map.pw / 2 : clamp(x, hw, map.pw - hw);
    y = map.ph <= hh * 2 ? map.ph / 2 : clamp(y, hh, map.ph - hh);
    if (snap) { this.cx = x; this.cy = y; return; }
    const k = Math.min(1, dt * 7);
    this.cx += (x - this.cx) * k; this.cy += (y - this.cy) * k;
  },
  begin(ctx) {
    ctx.save();
    ctx.translate(Math.round(View.w / 2), Math.round(View.h / 2));
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.round(this.cx), -Math.round(this.cy));
  },
  end(ctx) { ctx.restore(); },
  toScreen(x, y) { return [(x - Math.round(this.cx)) * this.zoom + Math.round(View.w / 2), (y - Math.round(this.cy)) * this.zoom + Math.round(View.h / 2)]; },
  visible(x, y, m = 24) {
    const [sx, sy] = this.toScreen(x, y);
    return sx > -m && sy > -m && sx < View.w + m && sy < View.h + m;
  },
};

// ---------- 視線 ----------
function blockedAt(map, x, y, occ) {
  if (map.opaquePx(x, y)) return true;
  if (occ) for (const o of occ) if (x > o.x0 && x < o.x1 && y > o.y0 && y < o.y1) return true;
  return false;
}
function lineOfSight(map, x0, y0, x1, y1, occ) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
  const steps = Math.ceil(d / 3);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blockedAt(map, x0 + dx * t, y0 + dy * t, occ)) return false;
  }
  return true;
}
function conePoly(map, ox, oy, ang, half, range, occ, n = 16) {
  const pts = [[ox, oy]];
  for (let i = 0; i <= n; i++) {
    const a = ang - half + (2 * half * i) / n;
    const c = Math.cos(a), s = Math.sin(a);
    let r = range;
    for (let st = 4; st <= range; st += 3) {
      if (blockedAt(map, ox + c * st, oy + s * st, occ)) { r = st; break; }
    }
    pts.push([ox + c * r, oy + s * r]);
  }
  return pts;
}

// ---------- 畫圖小工具 ----------
function drawSpr(ctx, img, x, y, ax = 0.5, ay = 1) {
  if (!img) return;
  ctx.drawImage(img, Math.round(x - img.width * ax), Math.round(y - img.height * ay));
}
function shadow(ctx, x, y, w = 10) {
  ctx.fillStyle = 'rgba(10,8,20,0.35)';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - 1), w, 2);
  ctx.fillRect(Math.round(x - w / 2 + 1), Math.round(y - 2), w - 2, 1);
}

// 浮動的小東西：表情、愛心、文字、聲波
class FX {
  constructor() { this.list = []; }
  emote(x, y, spr, life = 1.2, vy = -6) { this.list.push({ k: 'spr', x, y, spr, life, max: life, vy }); }
  text(x, y, txt, color = '#fff', life = 1.4, h) { this.list.push({ k: 'txt', x, y, txt, color, life, max: life, vy: -10, h }); }
  coin(x, y, txt, h = 1.4, big = 1) { this.list.push({ k: 'txt', x, y, txt, color: '#ffd84d', life: 1.6, max: 1.6, vy: -9, h, big, coin: true }); }
  ring(x, y, r, color = 'rgba(255,255,255,0.6)', life = 0.6) { this.list.push({ k: 'ring', x, y, r, color, life, max: life }); }
  hearts(x, y, n = 5) { for (let i = 0; i < n; i++) this.list.push({ k: 'spr', x: x + rnd(-8, 8), y: y + rnd(-4, 4), spr: G.S.emote.heart, life: 1 + Math.random() * 0.6, max: 1.6, vy: -12 - Math.random() * 10, delay: i * 0.12 }); }
  update(dt) {
    for (const f of this.list) {
      if (f.delay > 0) { f.delay -= dt; continue; }
      f.life -= dt; if (f.vy) f.y += f.vy * dt;
    }
    this.list = this.list.filter(f => f.life > 0);
  }
  draw(ctx) {
    for (const f of this.list) {
      if (f.delay > 0) continue;
      const a = clamp(f.life / Math.min(0.4, f.max), 0, 1);
      ctx.globalAlpha = a;
      if (f.k === 'spr') drawSpr(ctx, f.spr, f.x, f.y, 0.5, 1);
      else if (f.k === 'ring') {
        const t = 1 - f.life / f.max;
        ctx.strokeStyle = f.color; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(Math.round(f.x), Math.round(f.y), Math.max(1, f.r * t), 0, Math.PI * 2); ctx.stroke();
      } else if (f.k === 'txt') {
        ctx.font = '8px Silkscreen, "Huninn", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1d1526'; ctx.fillText(f.txt, Math.round(f.x) + 1, Math.round(f.y) + 1);
        ctx.fillStyle = f.color; ctx.fillText(f.txt, Math.round(f.x), Math.round(f.y));
      }
      ctx.globalAlpha = 1;
    }
  }
}

// 黑夜遮罩：先蓋一層黑，再挖出光
function renderDarkness(ctx, lights, cones, darkness = 0.8) {
  const L = View.lctx, w = View.w, h = View.h;
  L.globalCompositeOperation = 'source-over';
  L.clearRect(0, 0, w, h);
  L.fillStyle = `rgba(7,9,26,${darkness})`;
  L.fillRect(0, 0, w, h);
  L.globalCompositeOperation = 'destination-out';
  const z = Cam.zoom;
  for (const l of lights) {
    const [sx, sy] = Cam.toScreen(l.x, l.y);
    const R = l.r * z;
    if (sx < -R || sy < -R || sx > w + R || sy > h + R) continue;
    const gr = L.createRadialGradient(sx, sy, 0, sx, sy, R);
    gr.addColorStop(0, `rgba(0,0,0,${l.a || 0.95})`);
    gr.addColorStop(0.55, `rgba(0,0,0,${(l.a || 0.95) * 0.7})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    L.fillStyle = gr; L.fillRect(sx - R, sy - R, R * 2, R * 2);
  }
  for (const c of cones) {
    L.fillStyle = `rgba(0,0,0,${c.a || 0.8})`;
    L.beginPath();
    c.pts.forEach((p, i) => { const [sx, sy] = Cam.toScreen(p[0], p[1]); i ? L.lineTo(sx, sy) : L.moveTo(sx, sy); });
    L.closePath(); L.fill();
  }
  L.globalCompositeOperation = 'source-over';
  ctx.drawImage(View.light, 0, 0);
  // 暖色光暈
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    if (!l.tint) continue;
    const [sx, sy] = Cam.toScreen(l.x, l.y);
    const R = l.r * z * 0.9;
    if (sx < -R || sy < -R || sx > w + R || sy > h + R) continue;
    const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
    gr.addColorStop(0, l.tint); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(sx - R, sy - R, R * 2, R * 2);
  }
  for (const c of cones) {
    ctx.fillStyle = c.tint || 'rgba(255,214,120,0.16)';
    ctx.beginPath();
    c.pts.forEach((p, i) => { const [sx, sy] = Cam.toScreen(p[0], p[1]); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
    ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const c of cones) {
    ctx.strokeStyle = c.edge || 'rgba(255,226,150,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath();
    c.pts.forEach((p, i) => { const [sx, sy] = Cam.toScreen(p[0], p[1]); i ? ctx.lineTo(Math.round(sx) + 0.5, Math.round(sy) + 0.5) : ctx.moveTo(Math.round(sx) + 0.5, Math.round(sy) + 0.5); });
    ctx.closePath(); ctx.stroke();
  }
}
