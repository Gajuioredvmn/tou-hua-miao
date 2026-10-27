// ================= 屋頂任務：拉麵店後巷（橫向關卡） =================
// 第二個月起，阿伯說拉麵店後面那排老房子要都更了，屋頂、陽台上種了幾十年的花沒人要。
// 巷子右上角的防火巷鑽進去，就是一關「側面看」的屋頂任務：
//   拉麵店招牌 → 頂樓生鏽的廣告鐵架（破帆布可以躲）→ 走電線 → 老木屋的鐵窗陽台（曬衣服可以躲）
//   → 鐵皮屋頂（用跑的會「空空空」很吵）→ 冷氣室外機一台一台跳上去 → 新大樓頂樓的水塔旁邊
// 看守：都更建商的保全（手電筒）、會轉頭的監視器、陽台上抽菸的阿伯、熬夜的大學生、睡在水桶旁邊的土狗、拉麵店的感應燈
// 每晚可以進去很多次；花帶回巷子以後，一樣要走回花店貓門才算數。第一次全部偷光有額外獎勵。
const HE = {
  W: 33, G: 22,
  // 平台：x0, x1, y（腳站的高度），kind：roof 一般／iron 鐵皮（跑步很吵）／thin 細鐵架／ac 冷氣機（落地會鏗一聲）／ground 地面
  plats: [
    { x0: 0, x1: 33, y: 22, k: 'ground' },
    { x0: 0.2, x1: 9.6, y: 15.2, k: 'sign' },
    { x0: 0, x1: 9.8, y: 12, k: 'roof' },
    { x0: 2, x1: 7.4, y: 9, k: 'thin' }, { x0: 2, x1: 7.4, y: 6, k: 'thin' }, { x0: 2, x1: 7.4, y: 3.2, k: 'thin' },
    { x0: 12, x1: 15.6, y: 12, k: 'balcony' },
    { x0: 16.6, x1: 19.6, y: 17, k: 'sill' },
    { x0: 16.4, x1: 19.8, y: 9.4, k: 'sill' },
    { x0: 21.4, x1: 23.2, y: 18, k: 'ac' }, { x0: 24.2, x1: 26, y: 14.6, k: 'ac' }, { x0: 21.4, x1: 23.2, y: 10.8, k: 'ac' }, { x0: 24.2, x1: 26, y: 7, k: 'ac' },
    { x0: 21, x1: 33, y: 3.4, k: 'roof' },
  ],
  // 斜的鐵皮屋頂（老木屋）：從 (11.8, 8.2) 到屋脊 (16, 5.4) 再到 (20.2, 8.2)
  slope: { x0: 11.8, xr: 16, x1: 20.2, ye: 8.2, yr: 5.4 },
  // 可以爬：水管、鐵窗、鐵架柱子
  climbs: [
    { x: 2, y0: 3.2, y1: 12 }, { x: 7.4, y0: 3.2, y1: 12 },
    { x: 12.3, y0: 8.2, y1: 22 }, { x: 18, y0: 9.4, y1: 17 }, { x: 31.8, y0: 3.4, y1: 22 }, { x: 9.4, y0: 12, y1: 15.2 },
  ],
  // 電線：從 a 到 b，中間垂下 sag
  wires: [
    { a: [7.4, 6], b: [12.4, 8.0], sag: 0.6 },
    { a: [9.8, 12], b: [12, 12], sag: 0.35 },
    { a: [20.2, 8.2], b: [24.2, 7], sag: 0.5 },
  ],
  hides: [
    { x0: 3, x1: 5.6, y0: 3.8, y1: 8.8, name: '破帆布' },
    { x0: 14, x1: 15.6, y0: 9.6, y1: 12, name: '曬的衣服' },
    { x0: 18.8, x1: 20.6, y0: 20.6, y1: 22, name: '藍色水桶' },
    { x0: 27.2, x1: 29.6, y0: 0.4, y1: 3.4, name: '水塔後面' },
  ],
  puddles: [[10.6, 1.2], [14.6, 0.9], [25.4, 1.1]],
  pots: [
    { t: 'bougain', x: 1.2, y: 12 }, { t: 'periwinkle', x: 8.8, y: 12 },
    { t: 'magnolia', x: 12.8, y: 12 }, { t: 'jasmine', x: 13.6, y: 12 },
    { t: 'osmanthus', x: 17.2, y: 17 }, { t: 'rose', x: 19.1, y: 9.4 },
    { t: 'orchid', x: 16, y: 5.4, prize: true },
    { t: 'hydrangea', x: 23.6, y: 3.4 }, { t: 'peony', x: 30.6, y: 3.4, prize: true },
  ],
  start: [10.6, 22],
};
function heistOpen(run) { return !!(run.flags && run.flags.heistTalk); }
function heistOf(run) { return run.heist || (run.heist = { runs: 0, clears: 0, best: 0, perfect: 0 }); }
class Heist {
  constructor(sc) {
    this.sc = sc; this.run = sc.run; this.id = 'heist'; this.t = 0;
    this.cx = HE.start[0]; this.cy = HE.start[1]; this.vx = 0; this.vy = 0; this.ground = true; this.climb = null; this.plat = HE.plats[0];
    this.pots = HE.pots.map(p => Object.assign({ avail: true }, p));
    this.pops = []; this.rings = []; this.taken = 0; this.spotted = 0;
    this.noiseT = 0; this.downT = 0; this.stun = 0; this.wob = 0; this.flood = 0; this.leaving = false;
    const rain = sc.event === 'rain', moon = sc.nev && sc.nev.rare === 'fullmoon';
    this.rain = rain; this.moon = moon;
    this.jumpV = this.run.upg.jump ? 13.2 : 11.6;
    this.dbl = typeof hasCombo === 'function' && hasCombo(this.run, 'wall');
    // 看守
    const r = Math.random;
    this.watch = [
      { id: 'cam', kind: 'cam', x: 21.15, y: 8.6, ang: Math.PI * 0.82, base: Math.PI * 0.82, sweep: 0.55, range: 7.2, half: 0.32, s: 0, ph: r() * 6 },
      { id: 'student', kind: 'win', x: 18.2, y: 10.6, ang: Math.PI * 0.85, range: 4.6, half: 0.55, s: 0, state: 'off', ct: 3 + r() * 4, gap: [5, 9], who: '熬夜的大學生' },
      { id: 'c3', kind: 'win', x: 27, y: 11.6, ang: Math.PI * 0.9, range: 6, half: 0.4, s: 0, state: 'off', ct: 6 + r() * 6, gap: [8, 13], who: '大樓的住戶' },
      { id: 'smoker', kind: 'smoker', x: 12.9, y: 12, ang: 0, range: 4.2, half: 0.6, s: 0, state: 'off', ct: 10 + r() * 8, who: '抽菸的阿伯' },
      { id: 'guard', kind: 'guard', x: 4, y: 22, dir: 1, ang: -0.32, range: 6.2, half: 0.38, s: 0, speed: 1.3, wait: 0, who: '都更建商的保全' },
    ];
    this.dog = { x: 26.6, y: 22, state: 'sleep', barkT: 0, ct: 0 };
    this.cat = sc.cat; this.cat.carry = this.cat.carry || [];
  }
  // ---- 地形 ----
  slopeY(x) { const S = HE.slope; if (x < S.x0 || x > S.x1) return null; return x <= S.xr ? S.ye + (S.yr - S.ye) * (x - S.x0) / (S.xr - S.x0) : S.yr + (S.ye - S.yr) * (x - S.xr) / (S.x1 - S.xr); }
  wireY(w, x) { const [ax, ay] = w.a, [bx, by] = w.b; if (x < Math.min(ax, bx) || x > Math.max(ax, bx)) return null; const k = (x - ax) / (bx - ax); return ay + (by - ay) * k + Math.sin(k * Math.PI) * w.sag; }
  // 腳下可以站的東西（往下掉時從 yPrev 掉到 yNow 之間碰到的最高一層）
  landing(x, yPrev, yNow, dropping) {
    let best = null;
    const test = (y, info) => { if (y >= yPrev - 0.02 && y <= yNow + 0.02 && (!best || y < best.y)) best = Object.assign({ y }, info); };
    for (const p of HE.plats) if (x >= p.x0 && x <= p.x1 && !(dropping && p.k !== 'ground')) test(p.y, { k: p.k, p });
    if (!dropping) {
      const sy = this.slopeY(x); if (sy !== null) test(sy, { k: 'iron', slope: true });
      for (const w of HE.wires) { const wy = this.wireY(w, x); if (wy !== null) test(wy, { k: 'wire', w }); }
    }
    return best;
  }
  surfaceAt(x) {
    // 目前站的那一層，走到邊緣就會掉下去
    const on = this.on; if (!on) return null;
    if (on.slope) return this.slopeY(x);
    if (on.w) return this.wireY(on.w, x);
    if (on.p && x >= on.p.x0 && x <= on.p.x1) return on.p.y;
    return null;
  }
  climbAt(x, y) { return HE.climbs.find(c => Math.abs(c.x - x) < 0.6 && y >= c.y0 - 0.05 && y <= c.y1 + 0.05); }
  inHide() { return HE.hides.find(h => this.cx >= h.x0 && this.cx <= h.x1 && this.cy - 0.3 >= h.y0 && this.cy - 0.3 <= h.y1); }
  hidden() { return !!this.inHide() && Math.abs(this.vx) < 0.3 && !this.climb; }
  lit(x, y) {
    if (this.flood > 0 && Math.hypot(x - 7.6, y - 4) < 9) return true;
    for (const w of this.watch) if (w.kind === 'win' && w.state !== 'off' && Math.hypot(x - w.x, y - w.y) < 2.6) return true;
    if (Math.hypot(x - 10.6, y - 20) < 3) return true;
    return false;
  }
  pop(x, y, txt, col = '#fff') { this.pops.push({ x, y, txt, col, t: 0 }); }
  noise(x, y, r) {
    this.rings.push({ x, y, r, t: 0 });
    const d = this.dog; if (d.state === 'sleep' && Math.hypot(d.x - x, d.y - y) < r) { d.state = 'bark'; d.barkT = 3; SFX.play('bark'); this.pop(d.x, d.y - 1.2, '汪汪汪！', '#ffd25a'); this.alarmAll(x, y, false); }
    for (const w of this.watch) {
      if (Math.hypot(w.x - x, w.y - y) > r + 1) continue;
      if (w.kind === 'win' && w.state === 'off') { w.state = 'pre'; w.ct = 0.7; }
      if (w.kind === 'guard' && w.state !== 'chase') { w.inv = [x, y]; w.state = 'inv'; w.emote = 'q'; w.emoteT = 1.2; }
    }
  }
  alarmAll(x, y, hard) {
    for (const w of this.watch) {
      if (w.kind === 'win' && w.state === 'off') { w.state = 'pre'; w.ct = 0.5; }
      if (w.kind === 'guard') { w.inv = [x, y]; w.state = 'inv'; w.emote = 'ex'; w.emoteT = 1.4; }
    }
    if (hard) this.flood = 6;
  }
  // ---- 每一格 ----
  update(dt) {
    const sc = this.sc, c = this.cat, run = this.run;
    this.t += dt; c.t += dt;
    const v = this.stun > 0 || this.leaving ? { x: 0, y: 0, mag: 0 } : Input.vector();
    if (this.stun > 0) this.stun -= dt;
    const running = v.mag > 0.72 && Math.abs(v.x) > 0.4;
    // 爬
    const cl = this.climbAt(this.cx, this.cy);
    if (!this.climb && cl && Math.abs(v.y) > 0.55 && Math.abs(v.y) > Math.abs(v.x) * 0.8 && !(this.ground && v.y > 0 && this.cy >= cl.y1 - 0.05)) { this.climb = cl; this.cx = cl.x; this.vx = 0; this.vy = 0; this.ground = false; this.on = null; }
    if (this.climb) {
      const C = this.climb, sp = 2.6 * (typeof hasCombo === 'function' && hasCombo(run, 'wall') ? 1.5 : 1);
      this.cy = clamp(this.cy + v.y * sp * dt, C.y0, C.y1);
      if (Math.abs(v.x) > 0.75) {
        // 往旁邊推：附近有平台就直接踏上去
        const dir = Math.sign(v.x), nx = this.cx + dir * 0.5;
        const P = HE.plats.find(p => nx >= p.x0 && nx <= p.x1 && Math.abs(p.y - this.cy) < 0.8 && p.k !== 'ground');
        this.climb = null;
        if (P) { this.cx = nx; this.cy = P.y; this.ground = true; this.on = { y: P.y, k: P.k, p: P }; this.vx = dir * 1.5; }
        else this.vx = dir * 2.5;
      }
      else if ((this.cy <= C.y0 + 0.01 && v.y < -0.3) || (this.cy >= C.y1 - 0.01 && v.y > 0.3)) {
        // 爬到頂或底：站上去
        const L = this.landing(this.cx, this.cy - 0.1, this.cy + 0.1, false);
        if (L) { this.climb = null; this.ground = true; this.on = L; this.cy = L.y; }
      }
      c.dir = 'up'; c.moving = Math.abs(v.y) > 0.2; c.running = false;
    } else {
      // 左右
      const onWire = this.ground && this.on && this.on.k === 'wire';
      const sp = (running ? 4.6 : 2.6) * (onWire ? 0.65 : 1) * (c.walkMul && !running ? c.walkMul : 1) * (this.rain && running && this.on && this.on.k === 'iron' ? 1.15 : 1);
      const tvx = Math.abs(v.x) > 0.15 ? Math.sign(v.x) * sp * Math.min(1, Math.abs(v.x) * 1.4) : 0;
      this.vx += (tvx - this.vx) * Math.min(1, dt * (this.ground ? 14 : 5));
      this.cx = clamp(this.cx + this.vx * dt, 0.3, HE.W - 0.3);
      if (Math.abs(this.vx) > 0.2) c.dir = this.vx > 0 ? 'right' : 'left';
      c.moving = Math.abs(this.vx) > 0.3; c.running = running && this.ground && c.moving;
      // 站著：跟著地面高低，走出邊緣就掉
      if (this.ground) {
        const sy = this.surfaceAt(this.cx);
        if (sy === null) { this.ground = false; this.on = null; this.vy = 0; }
        else this.cy = sy;
        // 往下推：從平台跳下去
        if (this.ground && v.y > 0.6 && Math.abs(v.x) < 0.5 && this.on && this.on.k !== 'ground') { this.downT += dt; if (this.downT > 0.22) { this.ground = false; this.dropping = 0.25; this.on = null; this.vy = 1; this.downT = 0; } } else this.downT = 0;
        // 跑電線會晃，可能掉下去
        if (onWire && c.running) { this.wob += dt; if (Math.random() < dt * 0.6) { this.ground = false; this.on = null; this.vy = 0; this.pop(this.cx, this.cy - 1, '哇——！', '#ffd25a'); } } else this.wob = Math.max(0, this.wob - dt);
      }
      if (!this.ground) {
        const g = 30;
        this.vy = Math.min(16, this.vy + g * dt);
        const y0 = this.cy; this.cy += this.vy * dt;
        if (this.dropping > 0) this.dropping -= dt;
        if (this.vy > 0) {
          const L = this.landing(this.cx, y0, this.cy, this.dropping > 0);
          if (L) this.land(L, y0);
        }
        if (this.cy > HE.G) { this.cy = HE.G; this.land({ y: HE.G, k: 'ground', p: HE.plats[0] }, y0); }
        if (this.cy < -1) { this.cy = -1; this.vy = 0; }
      }
    }
    // 聲音
    if (this.ground && c.running) {
      this.noiseT -= dt;
      if (this.noiseT <= 0) {
        this.noiseT = 0.34;
        const k = this.on && this.on.k, paws = sc.pawsMult ? sc.pawsMult() : 1;
        const quiet = typeof hasBr === 'function' && hasBr(run, 'paws', 'A');
        let r = k === 'iron' ? 5.2 : k === 'ground' ? 2.4 : k === 'ac' ? 3.2 : 1.8;
        if (k === 'ground' && HE.puddles.some(([x, w]) => Math.abs(this.cx - x) < w)) { r = 3.6; this.pop(this.cx, this.cy - 0.5, '啪嚓', '#9ad0ff'); }
        if (this.rain) r *= 0.6;
        r *= quiet ? 0 : paws;
        if (r > 0.5) { this.noise(this.cx, this.cy, r); if (k === 'iron') { SFX.tone(220, 0.06, { vol: 0.05, type: 'square' }); if (!sc.tips.ironRoof) { sc.tips.ironRoof = 1; UI.toast('鐵皮屋頂用跑的會「空空空」很大聲！慢慢走就沒事', 3200); } } }
      }
    }
    // 感應燈：走到拉麵店頂樓附近就亮
    if (this.flood > 0) this.flood -= dt;
    if (Math.abs(this.cx - 6) < 4 && this.cy <= 12.5 && this.cy > 8 && this.flood <= 0) { this.flood = 5; SFX.tone(1800, 0.05, { vol: 0.04, type: 'square' }); this.pop(7.6, 3.2, '喀！（感應燈）', '#fff6c8'); }
    // 狗
    const d = this.dog; if (d.state === 'bark') { d.barkT -= dt; if (d.barkT <= 0) { d.state = 'sleep'; } }
    // 撿花
    this.updateWatch(dt);
    this.detect(dt);
    for (const p of this.pops) p.t += dt; this.pops = this.pops.filter(p => p.t < 1.4);
    for (const r of this.rings) r.t += dt; this.rings = this.rings.filter(r => r.t < 0.7);
    this.findTarget();
  }
  land(L, y0) {
    const fall = L.y - (this.fallFrom === undefined ? y0 : this.fallFrom);
    this.cy = L.y; this.vy = 0; this.ground = true; this.on = L; this.jumps = 0; this.dropping = 0;
    if (L.k === 'ac') { this.noise(this.cx, this.cy, 2.6); SFX.play('knock'); this.pop(this.cx, this.cy - 0.6, '鏗', '#e8e8f0'); }
    if (L.k === 'iron' && fall > 1.5) { this.noise(this.cx, this.cy, 4.2); SFX.tone(200, 0.08, { vol: 0.06, type: 'square' }); this.pop(this.cx, this.cy - 0.6, '空！', '#c8c8d8'); }
    if (fall > 6.5) { this.stun = 0.8; this.noise(this.cx, this.cy, 3.5); this.pop(this.cx, this.cy - 1, '喵嗚！（摔得好痛）', '#ff9a8a'); vibrate(40); }
    this.fallFrom = undefined;
  }
  jump() {
    if (this.stun > 0) return;
    if (this.ground || this.climb) { this.vy = -this.jumpV; this.ground = false; this.on = null; this.climb = null; this.jumps = 1; this.fallFrom = this.cy; SFX.play('jump'); return; }
    if (this.dbl && this.jumps === 1) { this.vy = -this.jumpV * 0.85; this.jumps = 2; this.fallFrom = this.cy; SFX.play('jump'); this.pop(this.cx, this.cy - 0.8, '飛簷走壁！', '#c8f0d0'); }
  }
  updateWatch(dt) {
    for (const w of this.watch) {
      if (w.emoteT > 0) w.emoteT -= dt;
      if (w.kind === 'cam') { w.ang = w.base + Math.sin(this.t * 0.8 + w.ph) * w.sweep; continue; }
      if (w.kind === 'win') {
        w.ct -= dt;
        if (w.state === 'off' && w.ct <= 0) { w.state = 'pre'; w.ct = 0.8; }
        else if (w.state === 'pre' && w.ct <= 0) { w.state = 'look'; w.ct = 2.4 + Math.random(); }
        else if (w.state === 'look' && w.ct <= 0) { w.state = 'off'; w.ct = w.gap[0] + Math.random() * (w.gap[1] - w.gap[0]); }
        continue;
      }
      if (w.kind === 'smoker') {
        w.ct -= dt;
        if (w.state === 'off' && w.ct <= 0) { w.state = 'on'; w.ct = 9 + Math.random() * 5; this.pop(w.x, w.y - 2, '（阿伯出來抽菸）', '#e8e2ff'); }
        else if (w.state === 'on' && w.ct <= 0) { w.state = 'off'; w.ct = 12 + Math.random() * 10; }
        if (w.state === 'on') w.ang = Math.sin(this.t * 0.4) > 0 ? -0.15 : Math.PI + 0.15;
        continue;
      }
      if (w.kind === 'guard') {
        const sp = w.speed * (w.state === 'chase' ? 1.6 : w.state === 'inv' ? 1.2 : 1);
        let tx = null;
        if (w.state === 'inv' && w.inv) tx = w.inv[0];
        else if (w.state === 'chase') tx = this.cx;
        if (tx !== null) {
          if (Math.abs(tx - w.x) > 0.2) { w.dir = Math.sign(tx - w.x); w.x += w.dir * sp * dt; }
          else { w.look = (w.look || 0) + dt; if (w.look > 2.5) { w.state = null; w.look = 0; } }
        } else {
          if (w.wait > 0) w.wait -= dt;
          else { w.x += w.dir * sp * dt; if (w.x > 31) { w.dir = -1; w.wait = 1.5; } if (w.x < 1.5) { w.dir = 1; w.wait = 1.5; } }
        }
        w.ang = w.dir > 0 ? -0.3 : Math.PI + 0.3;
        if (w.state === 'chase' && Math.abs(w.x - this.cx) < 0.6 && Math.abs(w.y - this.cy) < 1.2) this.caught(w);
        if (w.state === 'chase' && this.cy < 18) { w.lost = (w.lost || 0) + dt; if (w.lost > 3) { w.state = null; w.lost = 0; w.emote = 'q'; w.emoteT = 1; } }
      }
    }
  }
  canSee(w) {
    if (w.kind === 'win' && w.state !== 'look') return 0;
    if (w.kind === 'smoker' && w.state !== 'on') return 0;
    if (this.hidden()) return 0;
    if (this.cat.inv > 0) return 0;
    const ex = w.x, ey = w.y - (w.kind === 'guard' || w.kind === 'smoker' ? 1.3 : 0);
    const dx = this.cx - ex, dy = (this.cy - 0.35) - ey, d = Math.hypot(dx, dy);
    const lit = this.lit(this.cx, this.cy - 0.3) || this.moon;
    const R = w.range * (lit ? 1.3 : 0.75);
    if (d > R) return 0;
    let da = Math.abs(normAng(Math.atan2(dy, dx) - w.ang));
    if (da > w.half && d > 0.8) return 0;
    // 冷氣機、招牌擋住
    for (const p of HE.plats) if ((p.k === 'ac' || p.k === 'sign') && ey < p.y && this.cy - 0.2 > p.y + 0.3 && Math.abs(this.cx - (p.x0 + p.x1) / 2) < (p.x1 - p.x0) / 2 + 0.2 && Math.abs(ex - this.cx) < 3) return 0;
    return 1 - d / R * 0.5;
  }
  detect(dt) {
    if (this.leaving) return;
    let k = hasSet(this.run, 'thief') ? 0.88 : 1;
    if (typeof detectMulPlus === 'function') { const c = this.cat; k *= c.running ? 1.3 : c.moving ? 0.9 : 0.6; }
    for (const w of this.watch) {
      const v = this.canSee(w);
      if (v > 0) w.s = Math.min(1, w.s + dt * v * 1.2 * k);
      else if (w.state !== 'chase') w.s = Math.max(0, w.s - dt * 0.4);
      if (w.s >= 1 && !w.alarmed) {
        w.alarmed = true; w.emote = 'ex'; w.emoteT = 1.6; this.spotted++; this.sc.stats.spotted = (this.sc.stats.spotted || 0) + 1;
        SFX.play('ex'); vibrate(40);
        const line = { cam: '（嗶嗶嗶！監視器的紅燈亮了）', student: '……有貓在偷花？我要拍下來！', c3: '對面陽台那隻貓在幹嘛？', smoker: '欸！哪來的貓！', guard: '站住！又是你這隻貓！' }[w.id];
        this.pop(w.x, w.y - 2, line, '#fff3c8');
        if (w.kind === 'guard') { w.state = 'chase'; w.lost = 0; }
        else this.alarmAll(this.cx, this.cy, w.kind === 'cam');
        if (w.kind !== 'guard' && this.cy > 17.5) { const g = this.watch.find(x => x.kind === 'guard'); g.state = 'chase'; }
      }
      if (w.s < 0.5) w.alarmed = false;
    }
  }
  caught(w) {
    const sc = this.sc, c = sc.cat;
    sc.stats.caught = (sc.stats.caught || 0) + 1;
    const lost = c.carry.filter(f => f.pot && f.pot.zone === 'heist').length;
    c.carry = c.carry.filter(f => !(f.pot && f.pot.zone === 'heist'));
    SFX.play('fail'); vibrate([60, 40, 60]);
    UI.toast(`被保全抓住，丟出防火巷了！${lost ? '在這裡叼的花都被拿走了。' : ''}`, 3400);
    heistExit(sc, this, false);
  }
  findTarget() {
    let best = null;
    for (const p of this.pots) if (p.avail && Math.abs(p.x - this.cx) < 0.7 && Math.abs(p.y - this.cy) < 0.6) best = { kind: 'pot', ref: p };
    if (!best && Math.abs(this.cx - HE.start[0]) < 0.8 && this.cy > 21.5) best = { kind: 'exit' };
    this.target = best;
    const c = this.cat;
    UI.setAction(best ? (best.kind === 'pot' ? (c.carry.length >= this.sc.capacity() ? '嘴巴滿了' : '叼') : '回巷子') : (this.ground || this.climb || (this.dbl && this.jumps === 1) ? '跳' : null));
    UI.setWait(false, false); UI.setSkills([]);
  }
  action() {
    if (this.leaving) return;
    const tg = this.target, c = this.cat, sc = this.sc;
    if (tg && tg.kind === 'pot') {
      const p = tg.ref;
      if (c.carry.length >= sc.capacity()) { SFX.play('nope'); UI.toast('嘴巴滿了，先帶回花店'); return; }
      p.avail = false; c.carry.push({ t: p.t, fresh: 1, pot: { owner: 'heist', zone: 'heist' } });
      this.taken++; SFX.play('pick'); this.pop(p.x, p.y - 1.2, FLOWERS[p.t].name + (p.prize ? '！' : ''), p.prize ? '#ffd25a' : '#ffe2ea');
      if ((sc.pickNoise === undefined ? 1 : sc.pickNoise) > 0) this.noise(p.x, p.y, 1.2);
      return;
    }
    if (tg && tg.kind === 'exit') { heistExit(sc, this, true); return; }
    this.jump();
  }
  // ================= 畫 =================
  render(g, W, H) {
    const cs = this.cs = Math.max(26, Math.min(W / 8.2, H / 13));
    const vw = W / cs, vh = H / cs;
    const tx = clamp(this.cx - vw / 2, 0, Math.max(0, HE.W - vw)), ty = clamp(this.cy - vh * 0.55, -3, Math.max(-3, HE.G + 1.2 - vh));
    if (this.camX === undefined || this.snap) { this.camX = tx; this.camY = ty; this.snap = false; }
    const kk = Math.min(1, (R3.dt || 0.016) * 5); this.camX += (tx - this.camX) * kk; this.camY += (ty - this.camY) * kk;
    const S = (x, y) => [(x - this.camX) * cs, (y - this.camY) * cs];
    heistBackdrop(g, this, S, cs, W, H);
    heistBuildings(g, this, S, cs);
    // 盆栽
    for (const p of this.pots) { const [sx, sy] = S(p.x, p.y); zoneDrawArt(g, ART.pot({ t: p.t, avail: p.avail }, { tanhuaState: () => 'tanhua' }), sx, sy, cs * 0.95); if (p.avail && p.prize) { g.fillStyle = `rgba(255,220,120,${0.18 + 0.08 * Math.sin(this.t * 3)})`; g.beginPath(); g.arc(sx, sy - cs * 0.6, cs * 0.75, 0, TAU); g.fill(); } }
    // 看守
    for (const w of this.watch) heistWatcher(g, this, w, S, cs);
    // 狗
    { const d = this.dog, [sx, sy] = S(d.x, d.y); zoneDrawArt(g, ART.dog({ dir: 'left', state: d.state === 'sleep' ? 'sleep' : 'stand', barkT: d.state === 'bark' ? 1 : 0, moving: false, t: this.t }), sx, sy, cs); if (d.state === 'sleep') CM.emote(g, sx + 8, sy - cs * 0.8, 'z', 0.8, 1); }
    // 貓
    {
      const c = this.cat, [sx, sy] = S(this.cx, this.cy);
      const art = ART.cat(Object.assign({}, c, { jump: !this.ground && !this.climb ? { x0: 0, x1: 1 } : null, pose: this.hidden() ? 'loaf' : null }));
      const hid = this.hidden();
      zoneDrawArt(g, art, sx + (this.wob > 0 ? Math.sin(this.t * 20) * 2 : 0), sy, cs, null, hid ? 0.55 : 1);
      if (c.carry.length) c.carry.forEach((f, i) => zoneDrawArt(g, ART.icon(f.t), sx + (c.dir === 'left' ? -0.32 : 0.32) * cs, sy - cs * 0.45 + i * 2, cs * 0.9));
      if (this.stun > 0) CM.emote(g, sx, sy - cs, 'dots', 0.8, 1);
    }
    // 前景：遮擋物（帆布、衣服、水桶、水塔）
    heistForeground(g, this, S, cs);
    // 黑暗、光
    heistDark(g, this, S, cs, W, H);
    // 聲音圈
    for (const r of this.rings) { const [sx, sy] = S(r.x, r.y), k = r.t / 0.7; g.strokeStyle = `rgba(255,220,120,${0.6 * (1 - k)})`; g.lineWidth = 2; g.beginPath(); g.arc(sx, sy, r.r * cs * k, 0, TAU); g.stroke(); }
    // 懷疑條、表情
    for (const w of this.watch) { const [sx, sy] = S(w.x, w.y - (w.kind === 'guard' || w.kind === 'smoker' ? 2.1 : 0.9)); if (w.s > 0.05) CM.bar(g, sx, sy - 6, w.s, w.s >= 1 || w.state === 'chase'); if (w.emoteT > 0) CM.emote(g, sx, sy - 10, w.emote, 1, Math.min(1, w.emoteT * 3)); }
    if (this.target && this.target.kind === 'pot') { const [sx, sy] = S(this.target.ref.x, this.target.ref.y - 1.15); CM.marker(g, sx, sy, this.t); }
    if (this.hidden()) { const [sx, sy] = S(this.cx, this.cy - 1.1); CM.text(g, sx, sy, `躲在${this.inHide().name}`, '#d8ff8a', 11, 0.9); }
    for (const p of this.pops) { const [sx, sy] = S(p.x, p.y); CM.text(g, sx, sy - p.t * 26, p.txt, p.col, 13, Math.min(1, (1.4 - p.t) * 2.5)); }
    const top = 92;
    g.fillStyle = 'rgba(16,14,32,0.72)'; CM.rr(g, 10, top, 150, 26, 13); g.fill();
    CM.text(g, 85, top + 13.5, `屋頂任務・偷了 ${this.taken}/${this.pots.length}`, '#e8e2ff', 12.5, 1, { weight: 800 });
  }
}
// ---------- 畫：背景、房子 ----------
function heistBackdrop(g, h, S, cs, W, H) {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#141a3a'); sky.addColorStop(1, '#2a2450');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,250,230,0.8)'; for (let i = 0; i < 26; i++) { const x = (i * 97.3 + 13) % W, y = (i * 53.7) % (H * 0.45); g.fillRect(x, y, 1.4, 1.4); }
  // 遠方的大樓（視差）
  const par = h.camX * cs * 0.3;
  for (let i = 0; i < 14; i++) {
    const bx = (i * 90 - par) % (W + 200) - 60, bw = 50 + (i * 37) % 40, bh = 120 + (i * 71) % 160;
    g.fillStyle = i % 2 ? '#1e2244' : '#232850'; g.fillRect(bx, H * 0.5 - bh, bw, bh + H);
    g.fillStyle = 'rgba(255,214,140,0.55)'; for (let k = 0; k < 6; k++) if ((i * 7 + k * 3) % 4 === 0) g.fillRect(bx + 6 + (k % 3) * 14, H * 0.5 - bh + 12 + Math.floor(k / 3) * 22, 6, 9);
  }
  if (h.moon) { g.fillStyle = '#f4f8ff'; g.beginPath(); g.arc(W - 60, 130, 26, 0, TAU); g.fill(); }
}
function heistBuildings(g, h, S, cs) {
  const R = (x0, y0, x1, y1, col) => { const [a, b] = S(x0, y0), [c, d] = S(x1, y1); g.fillStyle = col; g.fillRect(a, b, c - a, d - b); };
  const L = (pts, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = S(x, y); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); };
  const ink = CM.ink, t = h.t;
  // ---- 地面、巷子 ----
  R(-1, 22, 34, 26, '#55525e'); R(-1, 22, 34, 22.25, '#6a6774');
  for (const [x, w] of HE.puddles) { const [a, b] = S(x, 22.12); g.fillStyle = 'rgba(120,150,190,0.45)'; g.beginPath(); g.ellipse(a, b, w * cs * 0.6, cs * 0.08, 0, 0, TAU); g.fill(); }
  // 紅線
  L([[0, 22.4], [9, 22.4]], '#d84a5a', 3); L([[20.5, 22.4], [33, 22.4]], '#d84a5a', 3);
  // 水溝蓋
  for (const x of [4, 15.5, 28]) { const [a, b] = S(x, 22.05); g.fillStyle = '#2e2c34'; g.fillRect(a, b, cs * 1.2, cs * 0.12); }
  // ---- 拉麵店（左）----
  R(0, 12, 9.8, 22, '#3a3640');
  R(0, 12, 9.8, 12.35, '#56525e');
  // 店面（亮著）
  R(0.6, 17.2, 8.8, 22, '#2a2026'); R(1, 17.6, 6.2, 22, 'rgba(255,200,140,0.55)'); R(6.6, 18, 8.4, 22, '#6a4a32');
  for (let i = 0; i < 5; i++) R(1 + i * 1.04, 17.6, 1.06 + i * 1.04, 22, 'rgba(60,40,40,0.6)');
  // 招牌
  R(0.2, 15.2, 9.6, 17.2, '#1c1a20'); R(0.2, 15.2, 9.6, 15.35, '#3a3640');
  { const [a, b] = S(1.0, 16.4); CM.text(g, a + cs * 1.6, b, '豚太郎', '#f2d26a', cs * 0.9, 1, { align: 'center' }); CM.text(g, a + cs * 5.4, b, '拉麵', '#ff6a8a', cs * 0.7, 1, { align: 'center' }); }
  // 2 樓窗戶
  for (const x of [1.4, 4.2, 7]) { R(x, 13.2, x + 1.8, 14.6, '#1e1c26'); R(x + 0.1, 13.3, x + 1.7, 14.5, '#2a2a3e'); }
  // 頂樓生鏽的廣告鐵架
  const rust = '#8a4a34';
  for (const x of [2, 7.4]) L([[x, 12], [x, 3.2]], rust, cs * 0.14);
  for (const y of [3.2, 6, 9]) L([[2, y], [7.4, y]], rust, cs * 0.1);
  L([[2, 12], [7.4, 9], [2, 6], [7.4, 3.2]], rust, cs * 0.07); L([[7.4, 12], [2, 9], [7.4, 6], [2, 3.2]], rust, cs * 0.07);
  // 感應燈
  L([[7.4, 3.2], [8.4, 2.6]], '#4a4a56', cs * 0.08); { const [a, b] = S(8.4, 2.6); g.fillStyle = ink; g.fillRect(a - cs * 0.3, b - cs * 0.18, cs * 0.6, cs * 0.36); g.fillStyle = h.flood > 0 ? '#fffbe0' : '#6a6a74'; g.fillRect(a - cs * 0.24, b - cs * 0.12, cs * 0.48, cs * 0.24); }
  // ---- 老木屋（中）----
  R(11.8, 8.2, 20.2, 22, '#7a5a42');
  for (let y = 9; y < 22; y += 0.55) L([[11.8, y], [20.2, y]], 'rgba(40,24,16,0.35)', 1);
  R(11.8, 17, 20.2, 17.25, '#5a3e2c'); R(11.8, 12, 20.2, 12.2, '#5a3e2c');
  // 一樓鐵門
  R(13, 18.6, 16.6, 22, '#9a9aa4'); for (let y = 18.8; y < 22; y += 0.3) L([[13, y], [16.6, y]], 'rgba(60,60,70,0.4)', 1);
  // 二樓鐵窗（鐵窗花）
  R(16.8, 13.4, 19.4, 16.8, '#2a2830'); R(16.9, 13.5, 19.3, 16.7, h.watch[1].state !== 'off' ? 'rgba(255,214,140,0.5)' : '#3a3850');
  for (let x = 16.8; x <= 19.4; x += 0.43) L([[x, 13.4], [x, 16.8]], '#e8e4dc', 1.6);
  for (const y of [14.4, 15.6]) L([[16.8, y], [19.4, y]], '#e8e4dc', 1.6);
  for (let i = 0; i < 3; i++) { const [a, b] = S(17.4 + i * 0.86, 15); g.strokeStyle = '#e8e4dc'; g.lineWidth = 1.3; g.beginPath(); g.arc(a, b, cs * 0.22, 0, TAU); g.stroke(); }
  // 三樓：學生的窗、陽台
  { const W2 = h.watch[1]; R(17, 9.6, 19.4, 11.6, '#2a2830'); R(17.1, 9.7, 19.3, 11.5, W2.state !== 'off' ? (W2.state === 'look' ? '#ffe9a8' : '#ffd27a') : '#3a3850'); }
  // 陽台欄杆（生鏽）
  L([[12, 10.8], [15.6, 10.8]], '#a85a3a', cs * 0.09);
  for (let x = 12.2; x <= 15.6; x += 0.45) L([[x, 10.8], [x, 12]], '#a85a3a', cs * 0.05);
  // 曬衣竿
  L([[13.6, 9.6], [15.8, 9.6]], '#c8c8d0', 2);
  // 水管
  L([[12.3, 8.2], [12.3, 22]], '#e8e8ec', cs * 0.12); L([[12.3, 8.2], [12.3, 22]], '#c8c8d0', cs * 0.05);
  // 斜鐵皮屋頂
  { const Sx = HE.slope, pts = [[Sx.x0 - 0.3, Sx.ye + 0.2], [Sx.xr, Sx.yr], [Sx.x1 + 0.3, Sx.ye + 0.2]];
    g.fillStyle = '#8a929e'; g.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = S(x, y); i ? g.lineTo(a, b) : g.moveTo(a, b); }); const [a2, b2] = S(Sx.x1 + 0.3, Sx.ye + 0.7), [a3, b3] = S(Sx.x0 - 0.3, Sx.ye + 0.7); g.lineTo(a2, b2); g.lineTo(a3, b3); g.closePath(); g.fill();
    for (let x = Sx.x0; x <= Sx.x1; x += 0.35) { const y = h.slopeY(x); L([[x, y], [x, Sx.ye + 0.6]], 'rgba(60,66,80,0.5)', 1.4); }
    L(pts, ink, 3); }
  // ---- 新大樓（右）----
  R(21, 3.4, 33, 22, '#3e4250');
  for (let x = 21.3; x < 33; x += 0.5) L([[x, 3.4], [x, 22]], '#2c2f3a', cs * 0.12);
  R(21, 3.4, 33, 3.7, '#5a5e6c');
  { const W3 = h.watch[2]; R(26, 10.6, 28.4, 12.6, '#1e1e28'); R(26.1, 10.7, 28.3, 12.5, W3.state !== 'off' ? '#ffd27a' : '#2a2a3e'); }
  // 電表
  { const [a, b] = S(23.4, 19.4); g.fillStyle = ink; g.fillRect(a, b, cs * 0.7, cs * 0.9); g.fillStyle = '#5a8a6a'; g.fillRect(a + 2, b + 2, cs * 0.7 - 4, cs * 0.9 - 4); g.fillStyle = '#e8f0e8'; g.beginPath(); g.arc(a + cs * 0.35, b + cs * 0.35, cs * 0.16, 0, TAU); g.fill(); }
  // 冷氣室外機
  for (const p of HE.plats) if (p.k === 'ac') {
    const [a, b] = S(p.x0, p.y), w = (p.x1 - p.x0) * cs, hh = cs * 1.1;
    g.fillStyle = ink; g.fillRect(a - 2, b - 2, w + 4, hh + 4); g.fillStyle = '#e4e4dc'; g.fillRect(a, b, w, hh);
    g.fillStyle = '#5a5e6a'; g.beginPath(); g.arc(a + w * 0.38, b + hh * 0.5, hh * 0.36, 0, TAU); g.fill();
    g.strokeStyle = '#c4c4bc'; g.lineWidth = 2; const ang = t * 9; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(a + w * 0.38, b + hh * 0.5); g.lineTo(a + w * 0.38 + Math.cos(ang + i * 2.1) * hh * 0.32, b + hh * 0.5 + Math.sin(ang + i * 2.1) * hh * 0.32); g.stroke(); }
    // 滴水
    const dk = (t * 0.9 + p.x0) % 1; g.fillStyle = 'rgba(160,200,255,0.8)'; g.beginPath(); g.arc(a + w * 0.8, b + hh + dk * cs * 3, 2, 0, TAU); g.fill();
  }
  // 監視器
  { const w = h.watch[0], [a, b] = S(w.x, w.y); g.save(); g.translate(a, b); g.rotate(w.ang); g.fillStyle = ink; g.fillRect(-4, -6, cs * 0.6, 12); g.fillStyle = '#dcdce4'; g.fillRect(-2, -4, cs * 0.55, 8); g.fillStyle = w.s > 0.3 ? '#ff4a4a' : '#4aff8a'; g.beginPath(); g.arc(cs * 0.5, 0, 2.2, 0, TAU); g.fill(); g.restore(); }
  // 頂樓水塔
  { const [a, b] = S(27.4, 0.6), [c, d] = S(29.4, 3.4); g.fillStyle = ink; g.fillRect(a - 2, b - 2, c - a + 4, d - b + 4); g.fillStyle = '#d8d8e0'; g.fillRect(a, b, c - a, d - b); g.fillStyle = '#b8b8c4'; g.fillRect(a, b + (d - b) * 0.45, c - a, 3); }
  // 水管（大樓右邊）
  L([[31.8, 3.4], [31.8, 22]], '#8a8e9a', cs * 0.12);
  // ---- 電線 ----
  for (const w of HE.wires) { const pts = []; for (let i = 0; i <= 16; i++) { const k = i / 16, x = w.a[0] + (w.b[0] - w.a[0]) * k; pts.push([x, h.wireY(w, x)]); } L(pts, '#0e0c12', 2.4); }
  L([[9.8, 6.8], [21, 5.2]].map(([x, y], i) => [x, y]), 'rgba(14,12,18,0.6)', 1.4);
  // 路燈
  { const [a, b] = S(10.6, 18.6); g.fillStyle = '#4a4a56'; g.fillRect(a - 2, b, 4, cs * 3.4); g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(a, b, cs * 0.22, 0, TAU); g.fill(); }
  // 防火巷入口
  { const [a, b] = S(HE.start[0], 22); CM.text(g, a, b - cs * 2.2, '← 回巷子', '#e8e2ff', 11, 0.8); }
}
function heistForeground(g, h, S, cs) {
  const t = h.t;
  // 破帆布
  { const [a, b] = S(3, 3.8), [c, d] = S(5.6, 8.8); g.fillStyle = 'rgba(238,232,214,0.86)'; g.beginPath(); g.moveTo(a, b); g.lineTo(c, b); for (let i = 0; i <= 6; i++) { const k = i / 6, x = c - (c - a) * k; g.lineTo(x + Math.sin(t * 2 + i) * 3, d - (i % 2) * cs * 0.8 + Math.sin(t * 3 + i) * 2); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(160,150,130,0.6)'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(a + (c - a) * i / 4, b); g.lineTo(a + (c - a) * i / 4 + Math.sin(t + i) * 4, d - cs * 0.5); g.stroke(); } }
  // 曬的衣服
  const cols = ['#ff9fbb', '#9fc8ff', '#fff2a8'];
  for (let i = 0; i < 3; i++) { const [a, b] = S(14.05 + i * 0.52, 9.6); g.fillStyle = CM.ink; g.fillRect(a - 1, b - 1, cs * 0.5 + 2, cs * (1.5 + (i % 2) * 0.4) + 2); g.fillStyle = cols[i]; g.fillRect(a, b, cs * 0.5, cs * (1.5 + (i % 2) * 0.4)); }
  // 陽台的盆栽葉子
  for (const x of [15.2]) { const [a, b] = S(x, 12); g.fillStyle = '#3f7a42'; g.beginPath(); g.ellipse(a, b - cs * 0.5, cs * 0.45, cs * 0.55, 0, 0, TAU); g.fill(); }
  // 藍色水桶
  for (const x of [19.1, 19.9]) { const [a, b] = S(x, 22); g.fillStyle = CM.ink; g.fillRect(a - cs * 0.38, b - cs * 1.2, cs * 0.76, cs * 1.2); g.fillStyle = '#3a7ad0'; g.fillRect(a - cs * 0.33, b - cs * 1.15, cs * 0.66, cs * 1.1); g.fillStyle = '#5a9ae8'; g.fillRect(a - cs * 0.33, b - cs * 1.15, cs * 0.66, cs * 0.18); }
}
function heistWatcher(g, h, w, S, cs) {
  // 視線光錐
  const show = (w.kind === 'cam') || (w.kind === 'win' && w.state !== 'off') || (w.kind === 'smoker' && w.state === 'on') || w.kind === 'guard';
  if (show && w.range) {
    const ex = w.x, ey = w.y - (w.kind === 'guard' || w.kind === 'smoker' ? 1.3 : 0), [sx, sy] = S(ex, ey);
    const R = w.range * (h.moon ? 1.3 : 0.75) * cs, alarm = w.state === 'chase' || w.s >= 1;
    g.fillStyle = alarm ? 'rgba(255,110,80,0.22)' : w.state === 'pre' ? 'rgba(255,230,140,0.08)' : 'rgba(255,226,120,0.16)';
    g.beginPath(); g.moveTo(sx, sy); g.arc(sx, sy, R, w.ang - w.half, w.ang + w.half); g.closePath(); g.fill();
  }
  if (w.kind === 'guard') { const [sx, sy] = S(w.x, w.y); zoneDrawArt(g, ART.human({ key: 'patrol', dir: w.dir > 0 ? 'right' : 'left', moving: true, t: h.t }), sx, sy, cs); }
  if (w.kind === 'smoker' && w.state === 'on') { const [sx, sy] = S(w.x, w.y); zoneDrawArt(g, ART.human({ key: 'bo', dir: Math.cos(w.ang) > 0 ? 'right' : 'left', moving: false, t: h.t }), sx, sy, cs); g.fillStyle = 'rgba(220,220,230,0.5)'; for (let i = 0; i < 3; i++) { const k = (h.t * 0.5 + i / 3) % 1; g.beginPath(); g.arc(sx + cs * 0.3 + Math.sin(k * 6) * 4, sy - cs * 1.6 - k * cs, 3 + k * 5, 0, TAU); g.fill(); } }
  if (w.kind === 'win' && (w.state === 'look' || w.state === 'pre')) { const [sx, sy] = S(w.x, w.y + 0.3); g.fillStyle = 'rgba(40,30,40,0.85)'; g.beginPath(); g.arc(sx, sy - cs * 0.2, cs * 0.3, Math.PI, 0); g.fill(); g.fillRect(sx - cs * 0.3, sy - cs * 0.2, cs * 0.6, cs * 0.4); }
}
function heistDark(g, h, S, cs, W, H) {
  const dk = h.dk || (h.dk = document.createElement('canvas'));
  const dw = Math.ceil(W / 2), dh = Math.ceil(H / 2);
  if (dk.width !== dw || dk.height !== dh) { dk.width = dw; dk.height = dh; }
  const d = dk.getContext('2d');
  d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, dw, dh);
  d.fillStyle = `rgba(8,8,24,${h.moon ? 0.35 : 0.55})`; d.fillRect(0, 0, dw, dh);
  d.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a = 1) => { const [sx, sy] = S(x, y), R = r * cs / 2; const gr = d.createRadialGradient(sx / 2, sy / 2, R * 0.15, sx / 2, sy / 2, R); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gr; d.beginPath(); d.arc(sx / 2, sy / 2, R, 0, TAU); d.fill(); };
  hole(h.cx, h.cy - 0.5, 3.2, 0.7);
  hole(10.6, 18.8, 4.2, 0.9);
  hole(4, 19.5, 5, 0.8);
  if (h.flood > 0) hole(7.6, 6, 9, 1);
  for (const w of h.watch) if (w.kind === 'win' && w.state !== 'off') hole(w.x, w.y + 0.6, 3, 0.9);
  const gd = h.watch.find(w => w.kind === 'guard'); if (gd) { const [sx, sy] = S(gd.x, gd.y - 1.3); d.fillStyle = 'rgba(0,0,0,0.7)'; d.beginPath(); d.moveTo(sx / 2, sy / 2); d.arc(sx / 2, sy / 2, gd.range * cs * 0.75 / 2, gd.ang - gd.half, gd.ang + gd.half); d.closePath(); d.fill(); }
  g.drawImage(dk, 0, 0, W, H);
  if (h.rain) { g.strokeStyle = 'rgba(200,215,255,0.3)'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i < 60; i++) { const x = ((i * 47.3 + h.t * 30) % W), y = ((i * 91.7 + h.t * 520) % H); g.moveTo(x, y); g.lineTo(x - 4, y + 14); } g.stroke(); }
}

// ---------- 進出 ----------
const HEIST_DOOR = [13.6, 6.6];
function heistEnter(sc) {
  sc.heistZ = sc.heistZ || new Heist(sc);
  const z = sc.heistZ;
  z.cx = HE.start[0]; z.cy = HE.start[1]; z.vx = 0; z.vy = 0; z.ground = true; z.on = { y: HE.G, k: 'ground', p: HE.plats[0] }; z.climb = null; z.leaving = false; z.snap = true;
  for (const w of z.watch) { w.s = 0; if (w.kind === 'guard') { w.state = null; w.x = 26; } }
  sc.zone = z; sc.mode = 'zone';
  const c = sc.cat; c.jump = null; c.box = null; c.pose = null; c.top = false; c.h = 0; Input.release();
  const H = heistOf(sc.run); H.runs++;
  UI.banner('屋頂任務・拉麵店後巷'); SFX.play('door');
  if (!sc.tips.heist) { sc.tips.heist = 1; setTimeout(() => { if (sc.zone === z) UI.toast('左右移動、往上推爬水管和鐵窗、按「跳」跳躍、往下推從陽台跳下去。鐵皮屋頂用跑的很吵；躲進帆布、曬的衣服後面不動就看不到', 6000); }, 900); }
}
function heistExit(sc, z, ok) {
  z.leaving = true;
  sc.zone = null; sc.mode = 'play';
  const c = sc.cat; c.x = HEIST_DOOR[0] * TS; c.y = HEIST_DOOR[1] * TS + 4; c.inv = 1.2; c.moving = false; sc.snapCam = true;
  SFX.play('door'); UI.banner('巷子');
  if (ok) {
    const H = heistOf(sc.run), left = z.pots.filter(p => p.avail).length;
    if (!left && !z.cleared) {
      z.cleared = true; H.clears++;
      const perfect = z.spotted === 0;
      if (perfect) H.perfect++;
      const cans = perfect ? 30 : 15; sc.run.cans += cans;
      setTimeout(() => UI.toast(`屋頂任務：九盆花全部救出來了！${perfect ? '而且一次都沒被發現（完美）' : ''}罐罐 +${cans}`, 4200), 600);
      checkAchievements(sc.run);
    }
  }
}
(function () {
  const P = NightScene.prototype;
  const _ft = P.findTarget;
  P.findTarget = function () {
    _ft.call(this);
    const c = this.cat;
    if (this.mode !== 'play' || !heistOpen(this.run) || c.top || c.jump || c.home) return;
    if (this.target && this.target.kind !== 'listen') return;
    if (dist(c.x, c.y - 2, HEIST_DOOR[0] * TS, HEIST_DOOR[1] * TS) < 13) { this.target = { kind: 'heist', ref: { x: HEIST_DOOR[0] * TS, y: HEIST_DOOR[1] * TS } }; UI.setAction('鑽防火巷'); }
  };
  const _oa = P.onAction;
  P.onAction = function () {
    if (this.mode === 'play' && this.target && this.target.kind === 'heist' && !this.cat.jump) { heistEnter(this); return; }
    return _oa.call(this);
  };
})();
function heistRender3D(sc, F) {
  if (!heistOpen(sc.run) || sc.mode !== 'play') return;
  const t = sc.cat.t || 0;
  glowQuad(F.glow, HEIST_DOOR[0], 0.6, HEIST_DOOR[1] + 0.1, 0.5 + Math.sin(t * 3) * 0.05, [1, 0.8, 0.5, 0.18]);
}
// ---------- 白天：阿伯說老房子要都更 ----------
function* heistStoryScript(S) {
  const run = S.run, f = run.flags;
  if ((run.month || 1) < 2 || f.heistTalk) return false;
  f.heistTalk = 1; S.shopOn = false;
  const b = S.customer('bo'); yield S.walkIn(b);
  yield* S.talk(b, '阿伯', [
    ['美玲，拉麵店後面那排老房子要都更了，下個月就要拆。'],
    ['那邊的屋頂、陽台，種了幾十年的花……玉蘭、桂花、還有一盆好大的蝴蝶蘭。'],
    ['建商說拆的時候全部丟掉，還請了保全晚上顧著。'],
    ['唉，可惜啊。要是有誰能把它們救出來就好了……（阿伯看了花喵一眼）'],
  ]);
  yield S.walkOut(b);
  UI.toast('新任務：巷子右上角花店旁邊的「防火巷」可以鑽進去，從屋頂救出老房子的花！', 4800);
  return true;
}
