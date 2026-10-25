// ================= 各場景的 3D 畫面 =================
const WARM = [0.95, 0.68, 0.36], WARM_HI = [1.35, 0.88, 0.45];
const NIGHT_ENV = { clear: [0.04, 0.05, 0.12], amb: [0.1, 0.12, 0.23], sky: [0.06, 0.07, 0.13], sunDir: [0.35, 0.75, 0.55], sunCol: [0.15, 0.17, 0.29], toon: 0.45 };
const NIGHT_POST = { bloom: 0.75, thresh: 0.7, tilt: [0.15, 0.9], vig: 0.42, grade: [0.98, 1, 1.06], sat: 1.08 };

function pushSprite(list, a, xpx, ypx, o = {}) {
  if (!a) return null;
  const b = billboard(a.img, xpx / TS, ypx / TS, a.w, a.h, { flip: o.flip !== undefined ? o.flip : a.flip, lift: (o.lift || 0) + (a.lift || 0), dz: o.dz, tint: o.tint, minLight: o.minLight, unlit: o.unlit, alpha: o.alpha, ax: a.ax });
  list.push(b); return b;
}
// 貓：本體 + 叼著的花 + 影子 + 剪影
function catSprites(F, c, o = {}) {
  const hop = (c.hop || 0) / TS * (c.jump && c.jump.big ? 1.5 : 1);
  const w = c.wiggle ? Math.sin(c.t * 40) * 1.2 : 0;
  const alpha = c.inv > 0 ? 0.6 + 0.3 * Math.sin(c.t * 20) : 1;
  const hw = (c.h || 0), lift0 = hw * Math.cos(R3.pitch) + (o.lift || 0);
  const a = c.box ? ART.catBox(c) : ART.cat(c);
  const b = pushSprite(F.sprites, a, c.x + w, c.y + 0.6, { lift: hop + lift0, minLight: o.minLight || [0.4, 0.37, 0.44], alpha: alpha < 1 ? alpha : undefined });
  if (b && !c.home) F.sil.push(b);
  shadowAt(F, c.x, c.y + 0.6, 0.78 * (1 - hop * 0.35), 0.3 * (1 - hop * 0.35), 1 - hop * 0.4, hw);
  if (c.box) return b;
  if (!o.noGear) gearEyeGlow(F, c, lift0);
  if (c.carry.length && c.pose !== 'belly') {
    const loaf = c.pose === 'loaf' || (!c.moving && (c.idleT || 0) > 1.8);
    let dx = 0, dz = 0.6, lift = 0.16, side = 0;
    if (!loaf) {
      if (c.dir === 'right') { dx = 5.6; lift = 0.36; side = 1; } else if (c.dir === 'left') { dx = -5.6; lift = 0.36; side = -1; }
      else if (c.dir === 'up') { dz = -1.5; lift = 0.5; } else { dz = 1.8; lift = 0.2; }
    }
    c.carry.forEach((f, i) => {
      const ox = (i - (c.carry.length - 1) / 2) * 2.6;
      const a = side ? ART.carry(f.t, side < 0) : ART.icon(f.t);
      pushSprite(F.sprites, a, c.x + dx + ox * (side ? 0.4 : 1), c.y + dz + (c.dir === 'up' ? -0.5 : 0.8) + i * 0.05, { lift: lift + hop + lift0 + (i % 2) * 0.06 - c.bob() * 0.03, minLight: [0.45, 0.42, 0.48] });
    });
  }
  // 奔跑時腳邊揚起的小煙
  if (!c.puffs) c.puffs = [];
  if (c.running && c.moving && !c.jump) {
    c.puffT = (c.puffT || 0) - R3.dt;
    if (c.puffT <= 0) { c.puffT = 0.11; const back = c.dir === 'left' ? 5 : c.dir === 'right' ? -5 : 0; c.puffs.push({ x: c.x + back + rnd(-2, 2), y: c.y + rnd(-1, 2), t: 0 }); }
  }
  for (const p of c.puffs) {
    p.t += R3.dt; const k = p.t / 0.55;
    glowQuad(F.soft, p.x / TS, 0.08 + k * 0.18 + hw, p.y / TS + 0.3, 0.1 + k * 0.16, [0.92, 0.9, 0.86, 0.5 * (1 - k)]);
  }
  c.puffs = c.puffs.filter(p => p.t < 0.55);
  return b;
}

// ---------- 夜晚 ----------
const ENV_BY_EVENT = {
  clear: {},
  rain: { clear: [0.03, 0.04, 0.09], amb: [0.085, 0.1, 0.2], sky: [0.05, 0.06, 0.12], sunCol: [0.1, 0.12, 0.23] },
  bbq: { amb: [0.12, 0.12, 0.23], sunCol: [0.2, 0.2, 0.3] },
  outage: { clear: [0.02, 0.025, 0.06], amb: [0.075, 0.08, 0.16], sky: [0.04, 0.045, 0.09], sunCol: [0.13, 0.14, 0.26] },
};
const POST_BY_EVENT = {
  clear: {},
  rain: { grade: [0.93, 0.98, 1.1], sat: 0.92, vig: 0.5 },
  bbq: { grade: [1.03, 1.0, 0.99], sat: 1.12 },
  outage: { grade: [0.98, 0.98, 1.05], vig: 0.52, bloom: 0.9 },
};
const PUDDLES = [[7.2, 9.5, 1.3], [7.8, 18.6, 1.0], [6.6, 25.4, 1.5], [7.6, 33.2, 1.1], [3.5, 38.6, 1.4], [10.8, 40.2, 1.0], [12.2, 7.3, 0.9]];
NightScene.prototype.render3D = function () {
  const st = R3.stage('night'); if (!st) { R3.blank(); R3.ovBegin(); return; }
  const F = R3.newFrame(), c = this.cat, vt = c.t;
  const ev = this.event, rain = ev === 'rain', outage = ev === 'outage', bbq = ev === 'bbq';
  R3.pitch = 0.64;
  const cp = Math.cos(R3.pitch), ch = c.h || 0;
  let fx = c.x, fz = c.y + 1.0 * TS - ch * TS / Math.tan(R3.pitch);
  if (this.cute) { const a = this.cute.actor; fx = (c.x + a.x) / 2; fz = (c.y + a.y) / 2 + 0.25 * TS; R3.cam.tzoom = 0.58; } else R3.cam.tzoom = 1;
  R3.follow(fx / TS, fz / TS, R3.dt, !!this.snapCam, { w: 7.2, zmin: 6.9, zmax: 44.6 }, this.map);
  this.snapCam = false;
  R3.updateFades(st, c.x / TS, c.y / TS, ch + 0.5);
  const roofH = p => this.topH(p.x, p.y - 2);
  // ---- 光 ----
  const L = [], S = [];
  const lampOn = l => !outage || l.ty >= 42;
  for (const l of st.lamps) if (lampOn(l)) L.push({ x: l.x, y: l.y - 0.1, z: l.z + 0.25, r: 5.4, c: WARM_HI, pri: 1 });
  const flick = 0.75 + 0.25 * Math.sin(vt * 23) * Math.sin(vt * 7.3);
  const candle = 0.8 + 0.2 * Math.sin(vt * 13) * Math.sin(vt * 5.1);
  const CANDLE = [1.0 * candle, 0.55 * candle, 0.24 * candle];
  for (const tx of [2, 4]) { const s = this.wang.lit(tx); if (s) L.push({ x: tx + 0.5, y: 1.0, z: 22.75, r: outage ? 2.3 : 2.9, c: outage ? CANDLE : s === 'tv' ? [0.35 * flick, 0.5 * flick, 1.1 * flick] : WARM }); }
  if (this.time < 1470) L.push({ x: 10.5, y: 1.0, z: 12.75, r: 2.7, c: outage ? CANDLE : WARM });
  L.push({ x: 11.5, y: 1.0, z: 32.75, r: 2.7, c: outage ? CANDLE : WARM });
  const store = storeOf(this.run);
  if (!outage) {
    L.push({ x: 7.5, y: 1.25, z: 5.75, r: 3.4, c: [1.1, 0.58, 0.72], pri: 0.6 });
    L.push({ x: 2.5, y: 2.3, z: 5.6, r: 2.2, c: [0.7, 0.5, 0.3] }, { x: 12.5, y: 2.3, z: 5.6, r: 2.2, c: [0.7, 0.5, 0.3] });
    if (store.neon) L.push({ x: 7.5, y: 3.6, z: 5.6, r: 5.5, c: [1.2, 0.35, 0.75], pri: 0.8 });
    if (store.lights) { L.push({ x: 2.6, y: 0.9, z: 5.5, r: 2.6, c: [1.0, 0.8, 0.5] }, { x: 11.4, y: 0.9, z: 5.5, r: 2.6, c: [1.0, 0.8, 0.5] }); }
  } else L.push({ x: 7.5, y: 0.9, z: 5.6, r: 2.0, c: CANDLE, pri: 0.6 });
  for (const m of this.motions) if (m.on > 0) L.push({ x: m.fx, y: 1.75, z: m.fz + 0.5, r: 4.2, c: [1.35, 1.28, 1.0], pri: 4 });
  for (const gl of st.gardenLights) L.push({ x: gl.x, y: 0.75, z: gl.z + 0.1, r: 3.2, c: [1.0, 0.75, 0.42] });
  if (c.y / TS > 40) for (const fl of st.fairy) L.push({ x: fl.x, y: 2.0, z: fl.z, r: 3.4, c: [0.75, 0.6, 0.4] });
  const th = this.pots.find(p => p.t === 'tanhua');
  if (this.tanhuaState() === 'tanhua' && th && th.avail) L.push({ x: th.x / TS, y: 0.75, z: th.y / TS + 0.2, r: 1.8, c: [0.75, 0.8, 0.95], pri: 1 });
  L.push({ x: c.x / TS, y: 0.95 + ch, z: c.y / TS + 0.35, r: 1.9, c: [0.3, 0.28, 0.38], pri: 6 });
  nightPlusLights(this, L);
  let bb = null;
  if (bbq) {
    if (!st.bbq) st.bbq = buildBBQProps();
    bb = st.bbq;
    const gf = 0.8 + 0.2 * Math.sin(vt * 17) * Math.sin(vt * 6.3);
    L.push({ x: bb.grill.x, y: 0.75, z: bb.grill.z + 0.3, r: 3.8, c: [1.5 * gf, 0.62 * gf, 0.25 * gf], pri: 2 });
    L.push({ x: 11.5, y: 1.9, z: 21.6, r: 3.6, c: [1.0, 0.32, 0.26], pri: 1.5 });
  }
  const npcs = [this.lin, this.bo, this.patrol, this.butler, ...this.party].filter(n => n && !n.hidden);
  for (const n of npcs) {
    if (n.type === 'party') continue;
    if (n === this.lin && !outage) continue;
    if (!(n.active() || n.state === 'alert') || this.mode === 'cute') continue;
    const dx = Math.cos(n.ang), dz = Math.sin(n.ang), l = Math.hypot(dx, 0.45, dz);
    S.push({ x: n.x / TS + dx * 0.25, y: 1.0, z: n.y / TS + dz * 0.25, r: 6, dx: dx / l, dy: -0.45 / l, dz: dz / l, cos: 0.86, c: n.susp > 0.35 ? [1.5, 0.75, 0.55] : [1.35, 1.2, 0.85] });
  }
  // ---- 東西 ----
  for (const p of this.pots) {
    if (p.gone) continue;
    const ph = p.top ? roofH(p) : 0;
    pushSprite(F.sprites, ART.pot(p, this), p.x, p.y + 0.5, { lift: ph * cp });
    shadowAt(F, p.x, p.y + 0.4, 0.7, 0.28, 1, ph);
  }
  for (const o of this.objs) {
    if (o.k === 'crates' || o.k === 'doghouse') continue;
    const blink = o.used && o.knock === 'scooter' && Math.floor(vt * 4) % 2 === 0;
    pushSprite(F.sprites, ART.obj(o), o.px, o.py + 0.5, { tint: blink ? [1.4, 1.25, 0.9, 1] : undefined });
    shadowAt(F, o.px, o.py + 0.4, 0.9, 0.32);
    if (o.used && o.knock === 'scooter' && blink) glowQuad(F.glow, o.px / TS + 0.35, 0.55, o.py / TS + 0.1, 0.5, [1, 0.6, 0.2, 0.7]);
  }
  if (store.scooter) { pushSprite(F.sprites, ART.delivery(), 3.1 * TS, 5.62 * TS); shadowAt(F, 3.1 * TS, 5.62 * TS, 1.3, 0.34); }
  // 監視器：大宅的、林家（被偷過之後）的
  {
    const cm = this.cam, flip = Math.cos(cm.ang) < 0;
    pushSprite(F.sprites, ART.camHead(), cm.x + (flip ? -2 : 2), cm.y + 0.6, { lift: 1.2, flip });
    if (Math.floor(cm.t * 2) % 2 === 0) glowQuad(F.glow, cm.x / TS + (flip ? -0.25 : 0.25), 1.75, cm.y / TS + 0.1, 0.12, [1, 0.2, 0.2, 0.9]);
  }
  if (this.linCam) {
    const cm = this.linCam, flip = Math.cos(cm.ang) < 0;
    pushSprite(F.sprites, ART.camHead(), cm.x + (flip ? -2 : 2), cm.y + 0.4, { lift: 1.72 * cp, flip });
    if (Math.floor(cm.t * 2) % 2 === 0) glowQuad(F.glow, cm.x / TS + (flip ? -0.25 : 0.25), 2.0, cm.y / TS + 0.08, 0.12, [1, 0.2, 0.2, 0.9]);
  }
  // 感應燈的燈頭
  for (const m of this.motions) {
    if (!st['fix' + m.owner]) st['fix' + m.owner] = buildFixture(m.fx, m.fz);
    for (const q of st['fix' + m.owner]) F.lit.push({ mesh: q.mesh, img: q.img, o: { minLight: m.on > 0 ? [1, 1, 0.9] : undefined } });
  }
  // 阿伯的碎石
  if (this.gravel) {
    if (!this.gravelQuads) {
      const R = rng(77), out = [];
      for (let i = 0; i < 150; i++) { const x = 10.15 + R() * 3.7, z = 32.25 + R() * 4.6; if (x < 10.2 || z < 32.3) continue; groundQuad(out, x, z, 0.07 + R() * 0.07, 0.05 + R() * 0.05, R() * 3, R() < 0.5 ? [0.78, 0.76, 0.7, 0.85] : [0.58, 0.56, 0.54, 0.85], 0.014); }
      groundQuad(out, 12.0, 34.6, 3.8, 4.7, 0, [0.62, 0.6, 0.55, 0.35], 0.011);
      this.gravelQuads = out;
    }
    for (let i = 0; i < this.gravelQuads.length; i++) F.flat.push(this.gravelQuads[i]);
  }
  // 「偷花必究」告示牌（里長加強巡邏之後）
  if (this.reacts.includes('public')) { pushSprite(F.sprites, ART.sign('偷花必究'), 5.55 * TS, 8.4 * TS); shadowAt(F, 5.55 * TS, 8.4 * TS, 0.7, 0.24); }
  // 警戒三顆星的人家門口也插告示
  for (const o of this.alert3 || []) { const sp = SIGN_SPOTS[o]; if (!sp) continue; pushSprite(F.sprites, ART.sign('偷花必究'), sp[0] * TS, sp[1] * TS); shadowAt(F, sp[0] * TS, sp[1] * TS, 0.7, 0.24); }
  // 人
  for (const n of npcs) {
    const nb = pushSprite(F.sprites, ART.human(n), n.x, n.y + 0.5, { minLight: [0.26, 0.25, 0.32] }); if (nb) nb.npc = true;
    shadowAt(F, n.x, n.y + 0.5, 0.7, 0.28);
    if (rain && n.umbrella) pushSprite(F.sprites, ART.umbrella(n.key), n.x + (n.dir === 'left' ? -1.5 : n.dir === 'right' ? 1.5 : 0), n.y + 0.5, { lift: 1.6, dz: -0.04, minLight: [0.3, 0.3, 0.36] });
  }
  if (this.temps) for (const k in this.temps) { const h = this.temps[k]; if (!h.hidden) { pushSprite(F.sprites, ART.human(h), h.x, h.y + 0.5); shadowAt(F, h.x, h.y + 0.5, 0.7, 0.28); } }
  const d = this.dog;
  { const jump = d.barkT > 0 ? Math.abs(Math.sin(d.t * 18)) * 0.12 : 0; pushSprite(F.sprites, ART.dog(d), d.x, d.y + 0.5, { lift: jump, minLight: [0.24, 0.22, 0.28] }); shadowAt(F, d.x, d.y + 0.5, 0.75, 0.28); }
  // 橘貓
  if (this.orange) {
    const oc = this.orange, hop = oc.hopZ || 0, lift0 = (oc.h || 0) * cp + hop;
    const ob = pushSprite(F.sprites, ART.orange(oc), oc.x, oc.y + 0.55, { lift: lift0, minLight: [0.42, 0.36, 0.34] });
    if (ob) F.sil.push(ob);
    shadowAt(F, oc.x, oc.y + 0.55, 0.72 * (1 - hop * 0.4), 0.28 * (1 - hop * 0.4), 1 - hop * 0.5, oc.h || 0);
    // 橘貓叼著的花（偷來的、要送人的）
    const items = oc.carry.map(f => f.t).concat(oc.gift ? [oc.gift] : []);
    if (items.length && oc.pose !== 'belly') {
      const loaf = oc.pose === 'loaf';
      let dx = 0, dz = 0.6, lift = 0.16, side = 0;
      if (!loaf) {
        if (oc.dir === 'right') { dx = 5.6; lift = 0.36; side = 1; } else if (oc.dir === 'left') { dx = -5.6; lift = 0.36; side = -1; }
        else if (oc.dir === 'up') { dz = -1.5; lift = 0.5; } else { dz = 1.8; lift = 0.2; }
      }
      items.forEach((t, i) => pushSprite(F.sprites, side ? ART.carry(t, side < 0) : ART.icon(t), oc.x + dx + i * 1.5, oc.y + dz + 0.85 + i * 0.05, { lift: lift + lift0, minLight: [0.45, 0.42, 0.48] }));
    }
    // 牠在追的螢火蟲
    if (oc.bug) { const b = oc.bug, tw = 0.65 + 0.35 * Math.sin(vt * 11); glowQuad(F.glow, b.x / TS, b.hz + 0.15, b.y / TS + 0.2, 0.07, [0.88, 1, 0.5, tw]); glowQuad(F.glow, b.x / TS, b.hz + 0.15, b.y / TS + 0.21, 0.24, [0.7, 1, 0.4, 0.3 * tw]); }
  }
  if (this.mode !== 'raid') catSprites(F, c);   // 熟門熟路：花喵出門去了
  nightPlus3D(this, F);
  const gustK = this.nev && this.nev.id === 'typhoon' ? Math.max(0, this.nev.gust || 0) / 1.6 : 0;
  for (const b of st.bushes) { const a = ART.bush(b.k), sway = gustK ? Math.sin(vt * 9 + b.x) * 0.06 * gustK + 0.04 * gustK * (this.nev.gdir || 1) : 0; F.bushes.push(billboard(a.img, b.x + sway, b.z, a.w * b.s, a.h * b.s, { flip: b.flip, lift: a.lift * b.s })); }
  // ---- 中秋烤肉 ----
  if (bb) {
    for (const q of bb.meshes) F.lit.push({ mesh: q.mesh, img: q.img, o: {} });
    const gf = 0.75 + 0.25 * Math.sin(vt * 19) * Math.sin(vt * 5.7);
    glowQuad(F.glow, bb.grill.x, 0.66, bb.grill.z + 0.22, 0.42, [1, 0.45, 0.15, 0.55 * gf]);
    glowQuad(F.glow, bb.grill.x, 0.66, bb.grill.z + 0.23, 0.18, [1, 0.8, 0.4, 0.8 * gf]);
    for (let i = 0; i < 5; i++) { const k = (vt * 0.45 + i / 5) % 1; glowQuad(F.soft, bb.grill.x + Math.sin(k * 5 + i) * 0.15 + k * 0.3, 0.75 + k * 1.3, bb.grill.z, 0.12 + k * 0.32, [0.78, 0.76, 0.8, 0.32 * (1 - k)]); }
    for (const ln of bb.lanterns) { const tw = 0.8 + 0.2 * Math.sin(vt * 3 + ln.ph); glowQuad(F.glow, ln.x, ln.y, ln.z, 0.32, [1, 0.35, 0.25, 0.42 * tw]); glowQuad(F.glow, ln.x, ln.y, ln.z + 0.01, 0.12, [1, 0.8, 0.5, 0.8 * tw]); }
  }
  // ---- 地上：光錐、聲波、花瓣、水窪 ----
  if (this.mode !== 'cute') {
    for (const n of npcs) {
      if (!(n.active() || n.state === 'alert')) continue;
      const [ex, ey] = n.eye();
      const al = n.susp > 0.35;
      const range = n.range * this.visMult;
      coneVerts(F.decalCone, conePoly(this.map, ex, ey, n.ang, n.half, range, this.occ), al ? [1, 0.38, 0.28, 0.42] : [1, 0.85, 0.45, 0.3], al ? [1, 0.5, 0.4, 0.8] : [1, 0.92, 0.65, 0.55]);
    }
    if (this.wang.state === 'look') { const [ex, ey] = this.wang.eye(); coneVerts(F.decalCone, conePoly(this.map, ex, ey, this.wang.ang, this.wang.half, this.wang.range * this.visMult, this.occ), this.wang.susp > 0.35 ? [1, 0.4, 0.3, 0.4] : [1, 0.85, 0.5, 0.28], [1, 0.9, 0.65, 0.5]); }
    for (const cm of [this.cam, this.linCam]) {
      if (!cm) continue;
      const [ex, ey] = cm.eye();
      if (R3.visible(ex, ey, 300)) coneVerts(F.decalCone, conePoly(this.map, ex, ey, cm.ang, cm.half, cm.range, this.occ), cm.susp > 0.3 ? [1, 0.25, 0.25, 0.42] : [1, 0.3, 0.3, 0.2], [1, 0.4, 0.4, 0.55]);
    }
  }
  this.fx.rings3D(F);
  for (const p of this.petals) {
    if (p.h === undefined) { p.h = 0.42; p.sw = rnd(0, 6); }
    if (p.h > 0.016) { p.h = Math.max(0.016, p.h - R3.dt * 0.55); p.sw += R3.dt * 6; p.x += Math.sin(p.sw) * R3.dt * 6; }
    groundQuad(F.flat, p.x / TS, p.y / TS, p.r ? 0.12 : 0.07, p.r ? 0.07 : 0.11, (p.x * 7) % 3 + (p.h > 0.02 ? p.sw : 0), hexRGBA(p.col, 0.95), p.h + (p.base || 0));
  }
  if (rain) {
    // 水窪：暗暗的、映著路燈
    for (const [x, z, r] of PUDDLES) {
      groundQuad(F.decal, x, z, r * 1.2, r * 0.55, 0, [1, 1, 1, 0.55], 0.009);
      groundQuad(F.decalGlow, x, z, r * 0.9, r * 0.4, 0, [0.5, 0.6, 0.85, 0.22], 0.011);
    }
    for (const l of st.lamps) if (lampOn(l)) groundQuad(F.decalGlow, l.x, l.z + 1.1, 1.0, 2.2, 0, [1, 0.72, 0.4, 0.28], 0.012);
    // 雨滴打在地上的小圈圈
    if (!this.splash) this.splash = [];
    this.splashT = (this.splashT || 0) - R3.dt;
    while (this.splashT <= 0) { this.splashT += 0.03; this.splash.push({ x: R3.cam.x + rnd(-5, 5), z: R3.cam.z + rnd(-7, 4), t: 0 }); }
    for (const sp of this.splash) { sp.t += R3.dt; const k = sp.t / 0.35; ringVerts(F.decalAdd, sp.x, sp.z, 0.04 + k * 0.16, 0.03, [0.7, 0.8, 1, 0.5 * (1 - k)]); }
    this.splash = this.splash.filter(sp => sp.t < 0.35);
  }
  // 停電夜：手電筒在地上照出的光圈
  if (outage) for (const n of npcs) {
    if (n.type === 'party' || !(n.active() || n.state === 'alert')) continue;
    const dx = Math.cos(n.ang), dz = Math.sin(n.ang);
    groundQuad(F.decalGlow, n.x / TS + dx * 1.6, n.y / TS + dz * 1.6, 1.4, 1.1, n.ang, [1, 0.92, 0.7, 0.35], 0.013);
  }
  // ---- 亮燈的窗戶 ----
  const wlit = (id, img, o) => { const w = st.windows.find(q => q.id === id); if (w) F.lit.push(winQuad(w, img, Object.assign({ unlit: 1, alphaTest: 0 }, o || {}))); };
  const cu = outage ? 0.55 + 0.25 * candle : 1;
  for (const tx of [2, 4]) {
    const s = this.wang.lit(tx); if (!s) continue;
    const img = this.wang.face(tx) ? TEX.litFace : s === 'tv' && !outage ? (Math.floor(vt * 6) % 3 ? TEX.litTv : TEX.litWarm) : TEX.litWarm;
    wlit('wang' + tx, img, { unlit: cu });
    glowQuad(F.glow, tx + 0.5, 0.95, 22.1, 0.85, outage ? [1, 0.6, 0.3, 0.22 * candle] : s === 'tv' ? [0.5, 0.65, 1, 0.3] : [1, 0.75, 0.45, 0.28]);
  }
  if (this.time < 1470) { wlit('lin', TEX.litWarm, { unlit: cu }); glowQuad(F.glow, 10.5, 0.95, 12.1, 0.8, [1, 0.75, 0.45, 0.25 * cu]); }
  wlit('bo', TEX.litWarm, { unlit: cu }); glowQuad(F.glow, 11.5, 0.95, 32.1, 0.8, [1, 0.75, 0.45, 0.25 * cu]);
  wlit('shop2a', TEX.litWarm, { unlit: cu }); wlit('shop2b', TEX.litWarm, { unlit: cu });
  if (store.neon && !outage) {
    const on = !(Math.floor(vt * 1.7) % 9 === 0 && (vt * 10) % 1 < 0.5);
    for (const p of st.up.neon) F.lit.push({ mesh: p.mesh, img: p.img, o: { unlit: on ? 1 : 0.4, alphaTest: 0.05 } });
    if (on) { glowQuad(F.glow, 7.5, 3.8, 4.95, 1.5, [1, 0.35, 0.7, 0.35]); }
  } else if (store.neon) for (const p of st.up.neon) F.lit.push({ mesh: p.mesh, img: p.img, o: { alphaTest: 0.05 } });
  if (storeLevel(this.run) === 0 && st.up.notice) for (const p of st.up.notice) F.lit.push({ mesh: p.mesh, img: p.img, o: { alphaTest: 0.3 } });
  // ---- 光暈、螢火蟲、飛蛾 ----
  for (const l of st.lamps) { if (!lampOn(l)) continue; glowQuad(F.glow, l.x, l.y - 0.08, l.z + 0.15, 1.1, [1, 0.75, 0.42, 0.5]); glowQuad(F.glow, l.x, l.y - 0.08, l.z + 0.16, 0.28, [1, 0.95, 0.8, 0.95]); }
  if (!outage) glowQuad(F.glow, 7.5, 0.95, 5.15, 0.55, [1, 0.55, 0.7, 0.55]);
  else glowQuad(F.glow, 7.5, 0.7, 5.15, 0.3, [1, 0.6, 0.3, 0.5 * candle]);
  for (const gl of st.gardenLights) { glowQuad(F.glow, gl.x, 0.62, gl.z + 0.08, 0.5, [1, 0.8, 0.5, 0.55]); glowQuad(F.glow, gl.x, 0.62, gl.z + 0.09, 0.14, [1, 0.97, 0.85, 0.95]); }
  for (const fl of st.fairyBulbs) { const tw = 0.6 + 0.4 * Math.sin(vt * 3 + fl.ph); glowQuad(F.glow, fl.x, fl.y, fl.z, 0.09, [1, 0.88, 0.55, 0.9 * tw]); glowQuad(F.glow, fl.x, fl.y, fl.z, 0.28, [1, 0.75, 0.4, 0.22 * tw]); }
  for (const m of this.motions) if (m.on > 0) { glowQuad(F.glow, m.fx, 1.72, m.fz + 0.3, 1.0, [1, 1, 0.85, 0.5]); glowQuad(F.glow, m.fx, 1.72, m.fz + 0.31, 0.25, [1, 1, 0.95, 0.9]); groundQuad(F.decalGlow, m.x / TS, m.y / TS, m.r / TS * 1.5, m.r / TS * 1.2, 0, [1, 1, 0.85, 0.16], 0.013); }
  if (this.tanhuaState() === 'tanhua' && th && th.avail) glowQuad(F.glow, th.x / TS, 0.75, th.y / TS + 0.1, 0.55 + Math.sin(vt * 3) * 0.08, [0.9, 0.95, 1, 0.5]);
  st.lamps.forEach((l, li) => {
    if (!lampOn(l) || rain) return;
    for (let i = 0; i < 3; i++) {
      const a = vt * (2.1 + i * 0.7) + i * 2.1 + li;
      glowQuad(F.glow, l.x + Math.cos(a) * (0.35 + i * 0.15), l.y - 0.25 + Math.sin(a * 1.4) * 0.2, l.z + 0.2 + Math.sin(a * 2.3) * 0.1, 0.05, [1, 0.95, 0.75, 0.9]);
    }
  });
  if (!rain) for (let i = 0; i < st.bushes.length; i += 2) {
    const b = st.bushes[i], ph = vt * 0.9 + i * 1.7, gl = Math.sin(ph * 2.2);
    if (gl < 0.25) continue;
    glowQuad(F.glow, b.x + Math.sin(ph) * 0.55, 0.45 + Math.cos(ph * 1.3) * 0.25, b.z - 0.2 + Math.cos(ph) * 0.3, 0.13, [0.8, 1, 0.45, (gl - 0.25) / 0.75]);
  }
  const env = Object.assign({}, NIGHT_ENV, ENV_BY_EVENT[ev] || {}, { points: R3.pickLights(L, NPL), spots: R3.pickLights(S, NSL) });
  R3.render(st, F, env, Object.assign({}, NIGHT_POST, POST_BY_EVENT[ev] || {}));
  // ---- 疊加層 ----
  const g = R3.ovBegin(); if (!g) return;
  const sc = (R3.ppu || 40) / 44;
  if (bbq) {
    // 中秋的大月亮
    const mx = R3.W - 54, my = 132, r = 30;
    const gr = g.createRadialGradient(mx, my, r * 0.6, mx, my, r * 2.6); gr.addColorStop(0, 'rgba(255,240,190,0.35)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(mx, my, r * 2.6, 0, 7); g.fill();
    g.fillStyle = '#fff3c4'; g.strokeStyle = CM.ink; g.lineWidth = 2.5; g.beginPath(); g.arc(mx, my, r, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(220,200,140,0.5)'; for (const [dx, dy, rr] of [[-9, -6, 6], [8, 4, 8], [-4, 12, 4], [12, -10, 3.5]]) { g.beginPath(); g.arc(mx + dx, my + dy, rr, 0, 7); g.fill(); }
  }
  const alert = (v, sx, sy) => {
    if (v.susp >= 0.35) CM.emote(g, sx, sy - 4, v.susp >= 0.98 ? 'ex' : 'q', sc * 1.1);
    if (v.susp > 0.02 && v.susp < 1) CM.bar(g, sx, sy + 2, v.susp, v.susp >= 0.35);
  };
  if (this.lin && this.dog.state === 'walk' && !this.lin.hidden) {
    const Ln = this.lin, side = Ln.dir === 'left' ? -1 : 1;
    const [hx, hy] = R3.at(Ln.x + side * 4, Ln.y + 0.5, 0.72), [dx, dy] = R3.at(d.x + (d.dir === 'left' ? -3 : 3), d.y + 0.5, 0.5);
    g.strokeStyle = '#e94a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo((hx + dx) / 2, Math.max(hy, dy) + 10, dx, dy); g.stroke();
  }
  for (const n of npcs) { const [sx, sy] = R3.at(n.x, n.y + 0.5, rain && n.umbrella ? 2.25 : 1.72); alert(n, sx, sy); if (n.emote && n.susp < 0.35) CM.emote(g, sx, sy - 2, n.emote, sc); }
  if (this.temps) for (const k in this.temps) { const h = this.temps[k]; if (!h.hidden && h.emote) { const [sx, sy] = R3.at(h.x, h.y + 0.5, 1.72); CM.emote(g, sx, sy, h.emote, sc * 1.1); } }
  if (this.wang.susp > 0.02 || this.wang.state === 'pre') { const tx = this.wang.wins[this.wang.wi][0]; const [sx, sy] = GL3.project(tx + 0.5, 1.9, 22.05); alert(this.wang, sx, sy); if (this.wang.state === 'pre') CM.emote(g, sx, sy - 4, 'dots', sc); }
  if (this.cam.susp > 0.02) { const [sx, sy] = R3.at(this.cam.x, this.cam.y, 1.9); alert(this.cam, sx, sy); }
  if (this.linCam && this.linCam.susp > 0.02) { const [sx, sy] = R3.at(this.linCam.x, this.linCam.y, 2.1); alert(this.linCam, sx, sy); }
  if (d.emote) { const [sx, sy] = R3.at(d.x, d.y + 0.5, 1.0); CM.emote(g, sx, sy, d.emote, sc); }
  if (d.charmT > 0 && Math.floor(vt * 3) % 2 === 0) { const [sx, sy] = R3.at(d.x, d.y + 0.5, 1.0); CM.emote(g, sx, sy, 'heart', sc * 0.9); }
  if (d.state === 'sleep' && Math.floor(d.t * 1.2) % 2 === 0) { const [sx, sy] = R3.at(d.x + 6, d.y, 0.85); CM.emote(g, sx, sy, 'z', sc); }
  nightPlusOverlay(this, g, R3.W, R3.H, sc);
  if (this.orange) {
    const oc = this.orange, [sx, sy] = R3.at(oc.x, oc.y + 0.5, 0.92 + (oc.h || 0) * cp + (oc.hopZ || 0));
    if (oc.emote) CM.emote(g, sx, sy, oc.emote, sc * 0.95);
    else if (oc.state === 'charm' && Math.floor(vt * 2.5) % 2 === 0) CM.emote(g, sx, sy, 'heart', sc * 0.9);
    // 把風：在你身邊畫一個箭頭指向那個人
    if (oc.warn && this.mode === 'play') {
      const [ex, ey] = oc.warn.v.eye(), [px, py] = R3.at(c.x, c.y + 0.6, 0.55 + ch * cp), [vx, vy] = R3.at(ex, ey + 0.5, 1.3);
      const a = Math.atan2(vy - py, vx - px), k = oc.warn.t / 1.8, r = 40 + Math.sin(vt * 14) * 3;
      g.save(); g.translate(px + Math.cos(a) * r, py + Math.sin(a) * r); g.rotate(a); g.globalAlpha = Math.min(1, k * 3);
      g.fillStyle = '#ff9a3a'; g.strokeStyle = CM.ink; g.lineWidth = 3; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(14, 0); g.lineTo(-4, -11); g.lineTo(-4, -4.5); g.lineTo(-13, -4.5); g.lineTo(-13, 4.5); g.lineTo(-4, 4.5); g.lineTo(-4, 11); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
  }
  // 搗蛋時滾來滾去的空罐（在畫面外的話，在畫面邊緣提示一下）
  if (this.prankFx) {
    const pf = this.prankFx, k = pf.t / 1.4, [sx, sy] = R3.at(pf.x + pf.dx * pf.t * 14, pf.y + 0.3, 0.12);
    if (sx < 20 || sx > R3.W - 20 || sy < 80 || sy > R3.H - 120) {
      const ex = clamp(sx, 44, R3.W - 44), ey = clamp(sy, 110, R3.H - 150);
      CM.text(g, ex, ey - k * 10, '匡啷！', '#ffd25a', 20, Math.min(1, (1 - k) * 3), { rot: -0.1 });
    }
    g.save(); g.globalAlpha = Math.min(1, (1 - k) * 3); g.translate(sx, sy); g.rotate(pf.t * 9 * pf.dx);
    g.fillStyle = '#c9ccd8'; g.strokeStyle = CM.ink; g.lineWidth = 2.2; CM.rr(g, -6 * sc, -4.5 * sc, 12 * sc, 9 * sc, 2.5 * sc); g.fill(); g.stroke();
    g.fillStyle = '#e94a5a'; g.fillRect(-6 * sc, -1.5 * sc, 12 * sc, 3 * sc);
    g.restore();
  }
  if (this.mode === 'play' && this.target && this.target.kind !== 'home') {
    const tg = this.target, r = tg.ref; const tx = r.x !== undefined ? r.x : r.px, ty = r.y !== undefined ? r.y : r.py;
    const hh = tg.kind === 'pot' && r.top ? roofH(r) : (r.h || 0);
    const [sx, sy] = R3.at(tx, ty + 0.5, 1.35 + hh * cp); CM.marker(g, sx, sy, vt);
  }
  if (c.hidden && this.mode === 'play' && Math.floor(vt * 2) % 6) {
    const [sx, sy] = R3.at(c.x, c.y + 0.6, 0.52);
    g.fillStyle = '#d8ff8a'; for (const ox of [-4, 4]) { g.beginPath(); g.ellipse(sx + ox, sy, 2.2, 3, 0, 0, 7); g.fill(); }
  }
  if (c.box && this.mode === 'play') {
    // 紙箱還能撐多久
    const [sx, sy] = R3.at(c.x, c.y + 0.6, 1.05 + ch * cp), k = 1 - c.box.t / 15;
    g.lineWidth = 4; g.strokeStyle = CM.ink; g.beginPath(); g.arc(sx, sy, 7, 0, 7); g.stroke();
    g.strokeStyle = k > 0.3 ? '#e8c08a' : '#ff7a5a'; g.lineWidth = 2.4; g.beginPath(); g.arc(sx, sy, 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke();
  }
  this.fx.draw3D(g);
  if (c.carry.length && this.mode === 'play') {
    const [sx, sy] = GL3.project(7.5, 0.5, 4.8);
    const m = 26;
    if (sx < m || sy < 70 || sx > R3.W - m || sy > R3.H - 110) {
      const cx = R3.W / 2, cy = R3.H / 2, a = Math.atan2(sy - cy, sx - cx);
      const k = Math.min((R3.W / 2 - m) / Math.abs(Math.cos(a) || 1e-3), (R3.H / 2 - 90) / Math.abs(Math.sin(a) || 1e-3));
      CM.homeArrow(g, cx + Math.cos(a) * k, cy + Math.sin(a) * k, a, vt);
    }
  }
  if (rain) {
    // 雨絲
    if (!this.drops) { this.drops = []; for (let i = 0; i < 110; i++) this.drops.push({ x: Math.random(), y: Math.random(), s: rnd(0.7, 1.3) }); }
    g.save(); g.strokeStyle = 'rgba(200,215,255,0.32)'; g.lineWidth = 1.2; g.beginPath();
    for (const dr of this.drops) {
      dr.y += R3.dt * 1.6 * dr.s; dr.x -= R3.dt * 0.12 * dr.s; if (dr.y > 1.05) { dr.y -= 1.1; dr.x = Math.random() * 1.1; }
      const x = dr.x * R3.W, y = dr.y * R3.H; g.moveTo(x, y); g.lineTo(x - 4 * dr.s, y + 16 * dr.s);
    }
    g.stroke(); g.restore();
  }
  if (this.pcut && this.mode !== 'cute') this.pcut.render3D(g, R3.W, R3.H);
  if (this.cutin) this.cutin.render3D(g, R3.W, R3.H);
};

function hexRGBA(hex, a = 1) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a]; }

// ---------- 白天：花店 ----------
DayScene.prototype.render3D = function () {
  const st = R3.stage('shop'); if (!st) { R3.blank(); R3.ovBegin(); return; }
  const F = R3.newFrame(), c = this.cat, t = c.t;
  R3.pitch = 0.8;
  const fo = this.focus;
  if (fo) { R3.cam.tzoom = 0.8; R3.follow(fo.x, fo.z + 0.6, R3.dt, false, { w: 10.6, zmin: 4.2, zmax: 17.2 }, this.map); }
  else { R3.cam.tzoom = 1; R3.follow(c.x / TS, 9.1 + (c.y / TS - 9.6) * 0.2, R3.dt, false, { w: 10.6, zmin: 8.4, zmax: 10.2, xmax: 9.3 }, this.map); }
  R3.updateFades(st, c.x / TS, c.y / TS);
  const eve = this.tint === 'evening';
  // 畫面上的店：剛買的那一項，揭曉前 0.55 秒先畫舊的樣子
  const real = storeOf(this.run), store = Object.assign({}, real);
  const showNew = !fo || fo.t >= 0.55;
  if (fo && !showNew) store[fo.id] = fo.lv - 1;
  const decor = store.decor || 0;
  const level = (store.lights || 0) + (store.fridge || 0) + (store.neon || 0) + (store.scooter || 0) + decor;
  const fadeIn = (id) => fo && fo.id === id && showNew && fo.t < 1.15 ? Math.min(1, (fo.t - 0.55) / 0.5) : 1;
  const fresh = (id) => fo && fo.id === id && showNew;
  const cpd = Math.cos(R3.pitch);
  const lit = (list, o) => { for (const p of list) F.lit.push({ mesh: p.mesh, img: p.img, o: o || {} }); };
  // 地板：磨石子 → 人字拼木地板
  lit(decor >= 1 ? st.up.floorNew : st.up.floorOld, { alphaTest: 0 });
  // 花桶：塑膠桶 → 鐵桶；花越多越滿，空位放綠葉
  const style = decor >= 1 ? 'zinc' : 'plastic';
  for (const dsp of this.displaysFor(decor)) {
    pushSprite(F.sprites, ART.bucket(this.displayArt(dsp), style, this.fullness(dsp)), dsp.x, dsp.y + 0.5, { lift: (dsp.h || 0) * cpd, minLight: [0.6, 0.56, 0.52] });
    shadowAt(F, dsp.x, dsp.y + 0.4, 0.7, 0.26, 1, dsp.h || 0);
  }
  if (this.roseDisplay) { const dsp = this.roseDisplay; pushSprite(F.sprites, ART.bucket('rose', style, 2), dsp.x, dsp.y + 0.5); shadowAt(F, dsp.x, dsp.y + 0.4, 0.7, 0.26); }
  // 包好的花束：擺在櫃台上等客人
  (this.bouquets || []).slice(0, 4).forEach((bq, i) => pushSprite(F.sprites, ART.bouquet(bq.spec, 0.42), (9.75 + i * 0.52) * TS, 7.42 * TS, { lift: 0.95 * cpd, minLight: [0.62, 0.58, 0.55] }));
  lit(decor >= 1 ? st.up.stand2 : st.stand);
  for (const k of this.knocks) { pushSprite(F.sprites, ART.smallPot(k.used), k.x, k.y + 0.5); shadowAt(F, k.x, k.y + 0.4, 0.6, 0.24); }
  // 後牆、架子：破舊 → 翻新 → 墨綠色的花藝店
  lit(decor >= 2 ? st.up.wallChic : (store.lights || 0) >= 2 ? st.up.wallNew : st.up.wallOld);
  lit(decor >= 2 ? st.up.shelfChic : (store.lights || 0) >= 1 ? st.up.shelfNew : st.up.shelfOld);
  shopDecor3D(this, F, st, store);
  const tubeOn = (store.lights || 0) === 0 ? (Math.sin(t * 31) * Math.sin(t * 7.7) < -0.6 || Math.floor(t * 3) % 11 === 4 ? 0 : 1) : -1;
  if (tubeOn >= 0) {
    lit(st.up.tube, { minLight: tubeOn ? [0.95, 1, 0.95] : undefined });
    const ta = st.up.tubeAt;
    if (tubeOn) { glowQuad(F.glow, ta.x, ta.y, ta.z, 0.75, [0.8, 0.95, 1, 0.28]); glowQuad(F.glow, ta.x, ta.y, ta.z + 0.01, 0.22, [0.9, 1, 1, 0.7]); }
  }
  if (level === 0) {
    lit(st.up.notice, { alphaTest: 0.3 });
    // 地上的枯葉、灰塵
    if (!this.leaves) { const R = rng(51); this.leaves = []; for (let i = 0; i < 14; i++) this.leaves.push([1.6 + R() * 11.8, 4.3 + R() * 2.2 + (i % 3) * 3.5, R() * 3, R() < 0.5]); }
    for (const [x, z, r, k] of this.leaves) groundQuad(F.flat, x, z, k ? 0.16 : 0.11, k ? 0.08 : 0.07, r, k ? [0.62, 0.46, 0.28, 0.85] : [0.72, 0.6, 0.38, 0.75], 0.013);
  }
  // 店門口：停著的機車（買了外送機車就換成載花的那台）、門邊的盆栽
  pushSprite(F.sprites, store.scooter ? ART.delivery() : ART.obj({ k: 'scooter', x: 1, y: 0 }), 11.6 * TS, 18.6 * TS, { alpha: fresh('scooter') && fadeIn('scooter') < 1 ? fadeIn('scooter') : undefined }); shadowAt(F, 11.6 * TS, 18.6 * TS, 1.3, 0.34);
  const upPts = [];
  if (store.lights >= 1) {
    for (const p of st.up.lights1) F.lit.push({ mesh: p.mesh, img: p.img, o: {} });
    for (const l of st.up.lampSpots) { glowQuad(F.glow, l.x, 2.2, l.z + 0.15, 0.45, [1, 0.9, 0.65, 0.6]); upPts.push({ x: l.x, y: 1.9, z: 3.9, r: 3.6, c: [0.42, 0.34, 0.22] }); }
  }
  if (store.lights >= 2) {
    for (const p of st.up.lights2) F.lit.push({ mesh: p.mesh, img: p.img, o: {} });
    for (const p2 of st.up.pendants) { glowQuad(F.glow, p2.x, 1.66, p2.z + 0.05, 0.42, [1, 0.85, 0.55, 0.6]); upPts.push({ x: p2.x, y: 1.5, z: p2.z + 0.3, r: 3.2, c: [0.4, 0.3, 0.18] }); }
    for (const b of st.up.fairy) { const tw = 0.55 + 0.45 * Math.sin(t * 3 + b.ph); glowQuad(F.glow, b.x, b.y, b.z, 0.07, [1, 0.9, 0.6, tw]); glowQuad(F.glow, b.x, b.y, b.z, 0.2, [1, 0.75, 0.45, 0.2 * tw]); }
  }
  if (store.fridge) {
    const fa = fadeIn('fridge');
    for (const p of st.up.fridge) F.lit.push({ mesh: p.mesh, img: p.img, o: fa < 1 ? { minLight: [0.75, 0.8, 0.85], blend: 'alpha', alpha: fa } : { minLight: [0.75, 0.8, 0.85] } });
    glowQuad(F.glow, 13.45, 1.0, 9.95, 0.9, [0.7, 0.9, 1, 0.22 * fa]);
  }
  if (store.neon) {
    const fa = fadeIn('neon');
    for (const p of st.up.neon) F.lit.push({ mesh: p.mesh, img: p.img, o: { unlit: fa, alphaTest: 0.05 } });
    glowQuad(F.glow, 5.5, 2.2, 3.1, 1.2, [1, 0.4, 0.75, 0.25 * fa]);
  }
  // 揭曉：閃一下 + 亮晶晶
  if (fo && fo.t > 0.45 && fo.t < 1.1) { const k = 1 - Math.abs(fo.t - 0.6) / 0.5; glowQuad(F.glow, fo.x, { lights: 1.8, fridge: 1.1, neon: 2.2, scooter: 0.7 }[fo.id] || 1, fo.z - 0.6, 2.2, [1, 0.95, 0.8, 0.55 * Math.max(0, k)]); }
  for (const sp of this.sparks) { if (sp.t < 0) continue; const k = sp.t / sp.life, tw = 0.6 + 0.4 * Math.sin(sp.t * 30 + sp.x * 9); glowQuad(F.glow, sp.x, sp.y, sp.z, 0.07 + 0.05 * (1 - k), [1, 0.92, 0.55, (1 - k) * tw]); glowQuad(F.glow, sp.x, sp.y, sp.z, 0.22, [1, 0.8, 0.4, 0.25 * (1 - k)]); }
  // 收銀機：叮！
  if (this.regPop > 0) glowQuad(F.glow, 12.45, 1.45, 7.6, 0.5 + (0.3 - this.regPop), [1, 0.85, 0.35, this.regPop * 2]);
  pushSprite(F.sprites, ART.pot({ t: 'bougain', avail: true }, null), 5.6 * TS, 17.55 * TS); shadowAt(F, 5.6 * TS, 17.5 * TS, 0.7, 0.26);
  pushSprite(F.sprites, ART.pot({ t: 'periwinkle', avail: true }, null), 9.4 * TS, 17.55 * TS); shadowAt(F, 9.4 * TS, 17.5 * TS, 0.7, 0.26);
  for (const p of this.people) if (!p.hidden) {
    pushSprite(F.sprites, ART.human(p), p.x, p.y + 0.5, { minLight: [0.66, 0.62, 0.58] }); shadowAt(F, p.x, p.y + 0.5, 0.7, 0.28);
    if (p.shop && p.shop.carry) { const side = p.dir === 'left' ? -1 : 1; p.shop.carry.slice(0, 2).forEach((f, i) => pushSprite(F.sprites, ART.icon(f.t), p.x + side * (4.5 + i * 2.2), p.y + 1.2 + i * 0.1, { lift: 0.62 + i * 0.08 })); }
    const hb = p.shop && (p.shop.carryB || p.shop.outB);
    if (hb) { const side = p.dir === 'left' ? -1 : 1; pushSprite(F.sprites, ART.bouquet(hb.spec, 0.3), p.x + side * 5, p.y + 1.4, { lift: 0.5, minLight: [0.62, 0.58, 0.55] }); }
  }
  if (this.dog) { const d = this.dog, jump = d.barkT > 0 ? Math.abs(Math.sin(d.t * 18)) * 0.12 : 0; pushSprite(F.sprites, ART.dog(d), d.x, d.y + 0.5, { lift: jump }); shadowAt(F, d.x, d.y + 0.5, 0.75, 0.28); }
  catSprites(F, c, { minLight: [0.62, 0.58, 0.55] });
  // 情報泡泡：浮在空中，地上有影子告訴你去哪抓
  for (const b of this.bubbles) {
    const left = b.life - b.t;
    if (left < 2.5 && Math.floor(b.t * 8) % 2 === 0) continue;
    if (b.type === 'cat' && b.blinkT < 0.3 && Math.floor(b.t * 16) % 2 === 0) continue;
    const bob = Math.sin(b.t * 4 + b.seed) * 0.06, a = ART.bubble(b.type), sc = b.half ? 0.72 : 1;
    pushSprite(F.over, sc === 1 ? a : Object.assign({}, a, { w: a.w * sc, h: a.h * sc, lift: a.lift * sc }), b.x, b.y + 6, { lift: 0.75 + bob, unlit: 0.85 });
    shadowAt(F, b.x, b.y + 6, 0.5 * sc, 0.2 * sc, 0.8);
    const hy = (0.75 + bob) / Math.cos(R3.pitch) + 0.42 * sc;
    if (b.type === 'gold') { glowQuad(F.glow, b.x / TS, hy, b.y / TS + 0.6, 0.62, [1, 0.85, 0.3, 0.45 + 0.15 * Math.sin(b.t * 9)]); }
    if (b.type === 'time' && b.dash > 0) { const sp = Math.hypot(b.vx, b.vy) || 1; for (let i = 1; i <= 3; i++) glowQuad(F.glow, (b.x - b.vx / sp * i * 4) / TS, hy, (b.y - b.vy / sp * i * 4) / TS + 0.6, 0.16 - i * 0.03, [1, 0.9, 0.5, 0.5 - i * 0.12]); }
  }
  if (this.hide && !this.hide.done && this.hide.who && this.hide.petT <= 0) {
    const w = this.hide.who;
    coneVerts(F.decalCone, conePoly(this.map, w.x, w.y - 4, w.ang, 0.62, 3.7 * TS, null, 12), w.emote === 'q' ? [1, 0.4, 0.3, 0.45] : [1, 0.85, 0.5, 0.35], [1, 0.9, 0.6, 0.6]);
  }
  this.fx.rings3D(F);
  // 窗外照進來的光束、灰塵
  for (const bx of [2.6, 10.4]) {
    const col = eve ? [1, 0.55, 0.3, 0.12] : [1, 0.92, 0.75, 0.08];
    const x0 = bx - 1.2, x1 = bx + 1.2, sh = eve ? -1.6 : 1.1;
    const v = F.beams || (F.beams = []);
    const [r, gg, b, a] = col;
    v.push(x0, 2.2, 16.2, r, gg, b, a, 0, 0, x0 + sh, 0.02, 11.5, r, gg, b, 0, 0, 1, x1 + sh, 0.02, 11.5, r, gg, b, 0, 1, 1);
    v.push(x0, 2.2, 16.2, r, gg, b, a, 0, 0, x1 + sh, 0.02, 11.5, r, gg, b, 0, 1, 1, x1, 2.2, 16.2, r, gg, b, a, 1, 0);
  }
  for (let i = 0; i < 18; i++) {
    const ph = t * 0.25 + i * 1.37, a = (Math.sin(ph * 1.7) + 1) / 2;
    if (a < 0.4) continue;
    glowQuad(F.glow, 2.5 + (i * 37) % 11 + Math.sin(ph) * 0.7, 0.4 + ((i * 53) % 10) * 0.18 + Math.cos(ph * 0.7) * 0.3, 6 + (i * 29) % 9, 0.05, [1, 0.97, 0.85, a * 0.8]);
  }
  // 店裡的光：底光壓低，亮的地方交給燈（投射燈打在花上、吊燈照著櫃台），才有層次、不會整片白
  // 還沒裝燈 → 灰灰暗暗只有窗外的光；補光燈 1 → 三盞投射燈；2 → 再加吊燈、串燈，整體暖一點
  const lv = store.lights || 0;
  if (tubeOn === 1) upPts.push({ x: st.up.tubeAt.x, y: 2.1, z: 4.2, r: 4.5, c: [0.26, 0.32, 0.34] });
  const winC = eve ? [0.42, 0.24, 0.12] : [0.2, 0.2, 0.18];
  const pts = [{ x: 3, y: 1.6, z: 15.4, r: 6, c: winC }, { x: 11.5, y: 1.6, z: 15.4, r: 6, c: winC }].concat(upPts).slice(0, NPL);
  const spotC = eve ? [1.15, 0.8, 0.48] : [1.15, 0.92, 0.6];
  const aim = (x, y, z, tx, ty, tz, c, cos = 0.8, r = 9) => { const dx = tx - x, dy = ty - y, dz = tz - z, l = Math.hypot(dx, dy, dz); return { x, y, z, r, dx: dx / l, dy: dy / l, dz: dz / l, cos, c }; };
  const spots = lv >= 1 ? [aim(5.8, 3.6, 12.6, 5.8, 0.3, 9.3, spotC, 0.84, 10), aim(3.0, 3.6, 10.8, 1.5, 0.3, 7.9, spotC.map(v => v * 0.85), 0.84, 10), aim(11.4, 3.6, 11.0, 11.6, 0.9, 7.4, spotC.map(v => v * 0.75), 0.82, 10)] : [];
  const warm = lv >= 2 ? 1.04 : 1;
  const env = eve
    ? { clear: [0.2, 0.13, 0.14], amb: [0.36 * warm, 0.29, 0.29], sky: [0.1, 0.08, 0.1], sunDir: [-0.55, 0.5, 0.67], sunCol: [0.42, 0.26, 0.14], toon: 0.2, points: pts, spots }
    : lv === 0 ? { clear: [0.42, 0.42, 0.44], amb: [0.4, 0.4, 0.42], sky: [0.12, 0.12, 0.13], sunDir: [0.35, 0.8, 0.5], sunCol: [0.2, 0.19, 0.17], toon: 0, points: pts, spots }
    : { clear: [0.4, 0.36, 0.32], amb: [0.38 * warm, 0.35, 0.32], sky: [0.1, 0.09, 0.09], sunDir: [0.35, 0.8, 0.5], sunCol: [0.18, 0.16, 0.13], toon: 0, points: pts, spots };
  const grade = eve ? [1.05, 0.96, 0.9] : lv === 0 ? [0.97, 0.98, 1.0] : [1.03, 0.99, 0.93];
  R3.render(st, F, env, { bloom: lv === 2 ? 0.3 : 0.22, thresh: 0.9, tilt: [0.12, 0.93], vig: 0.42, grade, sat: lv === 0 ? 0.88 : 1.05 });
  const g = R3.ovBegin(); if (!g) return;
  const sc = (R3.ppu || 40) / 44;
  for (const p of this.people) {
    if (p.hidden) continue;
    const [sx, sy] = R3.at(p.x, p.y + 0.5, 1.72);
    if (p.bubble) CM.talk(g, sx, sy, p.t);
    if (p.emote) CM.emote(g, sx, sy - (p.bubble ? 18 : 0), p.emote, sc * 1.05);
  }
  if (this.dog && this.dog.emote) { const d = this.dog; const [sx, sy] = R3.at(d.x, d.y + 0.5, 1.0); CM.emote(g, sx, sy, d.emote, sc); }
  if (this.target && this.target.kind === 'knock') { const r = this.target.ref; const [sx, sy] = R3.at(r.x, r.y + 0.5, 1.15); CM.marker(g, sx, sy, t); }
  this.fx.draw3D(g);
  // 揭曉：大大的升級名稱＋效果
  if (fo && fo.t > 0.55) {
    const u = STORE_UPGRADES.find(x => x.id === fo.id);
    if (u) {
      const k = Math.min(1, (fo.t - 0.55) / 0.22), a = Math.min(1, (fo.dur - fo.t) / 0.35);
      CM.text(g, R3.W / 2, 158, u.name + (u.max > 1 ? ' Lv.' + fo.lv : '') + ' 裝好了！', '#ffe27a', Math.round(28 * (0.55 + 0.45 * smooth(k))), a, { stroke: '#6a2a10' });
      // 說明太長就在「：」斷成兩行
      const desc = u.lv[fo.lv - 1], cut = desc.indexOf('：');
      const lines = cut > 0 && desc.length > 18 ? [desc.slice(0, cut), desc.slice(cut + 1)] : [desc];
      lines.forEach((ln, i) => CM.text(g, R3.W / 2, 194 + i * 22, ln, i ? '#ffe27a' : '#fff6e8', ln.length > 22 ? 13 : 15, a * k, { stroke: '#4a2a10' }));
    }
  }
  if (this.cutin) this.cutin.render3D(g, R3.W, R3.H);
};

// ---------- 標題 ----------
TitleScene.prototype.render3D = function () {
  const st = R3.stage('night'); if (!st) { R3.blank(); R3.ovBegin(); return; }
  const F = R3.newFrame(), t = this.t;
  R3.cam.tzoom = 1.0; R3.pitch = 0.64;
  R3.follow(7.5, 9.5 + (1 - Math.cos(t * 0.1)) * 8, R3.dt, false, { w: 8.6, zmin: 7.2, zmax: 45 }, G.maps.night);
  for (const b of st.blocks) b.fade += (1 - b.fade) * 0.1;
  const L = [];
  for (const l of st.lamps) L.push({ x: l.x, y: l.y - 0.1, z: l.z + 0.25, r: 5.4, c: WARM_HI, pri: 1 });
  L.push({ x: 2.5, y: 1, z: 22.75, r: 2.9, c: WARM }, { x: 4.5, y: 1, z: 22.75, r: 2.9, c: [0.35, 0.5, 1.1] }, { x: 10.5, y: 1, z: 12.75, r: 2.7, c: WARM }, { x: 11.5, y: 1, z: 32.75, r: 2.7, c: WARM });
  L.push({ x: 7.5, y: 1.25, z: 5.75, r: 3.4, c: [1.1, 0.58, 0.72], pri: 0.6 });
  for (const p of this.pots) { pushSprite(F.sprites, ART.pot(p, this.potCtx), p.x, p.y + 0.5); shadowAt(F, p.x, p.y + 0.4, 0.7, 0.28); }
  catSprites(F, this.cat);
  for (const b of st.bushes) { const a = ART.bush(b.k); F.bushes.push(billboard(a.img, b.x, b.z, a.w * b.s, a.h * b.s, { flip: b.flip, lift: a.lift * b.s })); }
  for (const l of st.lamps) { glowQuad(F.glow, l.x, l.y - 0.08, l.z + 0.15, 1.1, [1, 0.75, 0.42, 0.5]); glowQuad(F.glow, l.x, l.y - 0.08, l.z + 0.16, 0.28, [1, 0.95, 0.8, 0.95]); }
  for (const w of st.windows) F.lit.push(winQuad(w, w.id === 'wang4' ? TEX.litTv : TEX.litWarm, { unlit: 1, alphaTest: 0 }));
  for (let i = 0; i < st.bushes.length; i += 2) {
    const b = st.bushes[i], ph = t * 0.9 + i * 1.7, gl = Math.sin(ph * 2.2);
    if (gl > 0.25) glowQuad(F.glow, b.x + Math.sin(ph) * 0.55, 0.45 + Math.cos(ph * 1.3) * 0.25, b.z - 0.2, 0.13, [0.8, 1, 0.45, (gl - 0.25) / 0.75]);
  }
  R3.render(st, F, Object.assign({}, NIGHT_ENV, { points: R3.pickLights(L, NPL), spots: [] }), NIGHT_POST);
  const g = R3.ovBegin(); if (!g) return;
  // 飄落的花瓣
  for (const p of this.petals3) {
    g.save(); g.translate(p.x, p.y); g.rotate(p.ph); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, 4.5, 2.6, 0, 0, 7); g.fill(); g.restore();
  }
};
