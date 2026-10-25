// ================= 屋頂走廊（老貓攤「屋頂走廊」）=================
// 屋頂之間搭木板（第二級多一條電線），花喵在屋頂上就能從一家走到另一家，不用下地面。
// 但屋頂上有鴿子：跑太快會把牠們嚇飛，翅膀拍得很大聲（附近的人會過來看）。
const ROOF_BRIDGES = [
  { id: 'shop-lin', a: [12.5, 4.55], b: [12.5, 8.45], lv: 1, kind: 'plank' },
  { id: 'wang-empty', a: [4.6, 21.55], b: [4.6, 28.45], lv: 1, kind: 'plank' },
  { id: 'empty-bo', a: [5.55, 30.0], b: [9.45, 30.0], lv: 1, kind: 'plank' },
  { id: 'lin-wang', a: [9.45, 11.2], b: [5.55, 20.8], lv: 2, kind: 'wire' },
  { id: 'shop-wang', a: [2.5, 4.55], b: [2.5, 18.45], lv: 2, kind: 'wire' },
];
const PIGEON_SPOTS = [[4.5, 2.4], [10.5, 9.6], [2.5, 19.6], [4.6, 29.4], [11.6, 30.4], [8.6, 2.0]];
function roofLv(run) { return run.upg.roofway || 0; }
NightScene.prototype.initRoofway = function () {
  const lv = roofLv(this.run);
  this.bridges = ROOF_BRIDGES.filter(b => b.lv <= lv);
  this.pigeons = lv ? PIGEON_SPOTS.filter(() => Math.random() < 0.75).map(([x, y]) => ({ x: x * TS, y: y * TS, state: 'sit', t: Math.random() * 3, fly: 0, vx: 0, vy: 0 })) : [];
};
// 在屋頂上、靠近橋頭：可以「過」
NightScene.prototype.bridgeTarget = function (cx, cy) {
  const c = this.cat; if (!c.top || c.jump || !this.bridges || !this.bridges.length) return null;
  for (const b of this.bridges) for (const end of ['a', 'b']) {
    const [x, y] = b[end];
    const d = dist(cx, cy, x * TS, y * TS);
    if (d < 15) { const o = end === 'a' ? b.b : b.a; return { kind: 'bridge', d, b, to: o, ref: { x: x * TS, y: y * TS - 2, h: this.topH(x * TS, y * TS) } }; }
  }
  return null;
};
NightScene.prototype.crossBridge = function (tg) {
  const c = this.cat, [x, y] = tg.to, X = x * TS, Y = y * TS + 2;
  const len = Math.hypot(X - c.x, Y - c.y) / TS, wire = tg.b.kind === 'wire';
  const fast = roofLv(this.run) >= 2;
  c.box = null;
  c.jump = { x0: c.x, y0: c.y, x1: X, y1: Y, t: 0, dur: (wire ? 0.18 + len * 0.045 : 0.22 + len * 0.07) * (fast ? 0.8 : 1), h0: c.h, h1: this.topH(X, Y - 2) || c.h, top: true, hopPx: wire ? 3 : 5 };
  c.dir = Math.abs(X - c.x) > Math.abs(Y - c.y) ? (X > c.x ? 'right' : 'left') : (Y > c.y ? 'down' : 'up');
  SFX.play(wire ? 'jump' : 'step'); if (!wire) setTimeout(() => SFX.play('step'), 120);
  this.fx.text(c.x, c.y - 14, wire ? '咻——' : '躂躂躂', '#ffe2ea');
  this.stats.bridges = (this.stats.bridges || 0) + 1;
  if (!this.tips.bridge) { this.tips.bridge = 1; UI.toast('從屋頂直接過去了！屋頂上地面的人看不到你，但小心別嚇到鴿子', 3400); }
};
// 鴿子：跑步靠近就飛走、發出聲音
NightScene.prototype.updatePigeons = function (dt) {
  if (!this.pigeons) return;
  const c = this.cat;
  for (const p of this.pigeons) {
    p.t += dt;
    if (p.state === 'sit') {
      const d = dist(c.x, c.y, p.x, p.y);
      if (c.top && d < (c.running ? 2.6 : 1.1) * TS) {
        p.state = 'fly'; p.fly = 0; const a = Math.atan2(p.y - c.y, p.x - c.x); p.vx = Math.cos(a) * 40; p.vy = Math.sin(a) * 24;
        SFX.play('knock');
        this.noise(p.x, p.y, (c.running ? 6 : 4) * TS, 'obj');
        this.fx.text(p.x, p.y - 14, '啪啪啪！', '#e8e8f0');
        if (!this.tips.pigeon) { this.tips.pigeon = 1; UI.toast('鴿子被嚇飛了！屋頂上用走的就不會驚動牠們', 3000); }
      }
    } else if (p.state === 'fly') {
      p.fly += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.fly > 2.2) p.state = 'gone';
    }
  }
};
// ---------- 圖 ----------
function drawPigeon(f) {
  const flap = f % 2;
  O.eo(0, -5, 5.2, 3.6, '#9aa0b0');
  O.eo(4.6, -8, 2.6, 2.4, '#8a90a2');
  O.e(5.6, -8.4, 0.6, 0.6, '#ffb84a'); O.e(5.8, -8.5, 0.3, 0.3, CM.ink);
  O.p([[7, -8], [8.6, -7.6], [7, -7.2]], '#e8a040');
  O.e(3.6, -6.4, 1.6, 1, '#6aa08a');
  if (flap) { O.blobO([[-2, -6], [-8, -14], [-1, -9]], '#b8bec8'); O.blobO([[0, -6], [5, -15], [2, -8]], '#c8cdd6'); }
  else O.blobO([[-4, -5], [2, -7], [1, -3]], '#7a8092');
  O.limb(-1, -1.6, -1, 0, 0.8, '#e8a040', { noOutline: true }); O.limb(1.4, -1.6, 1.4, 0, 0.8, '#e8a040', { noOutline: true });
}
function toonPigeon(f) { return toonFrameInfo(toonFrame('pigeon-' + f, 22, 18, () => drawPigeon(f)), false, 0.5, 0.75); }
function roofwayRender3D(sc, F, st) {
  const lv = roofLv(sc.run);
  if ((st.roofwayLv || 0) !== lv) {
    st.roofwayLv = lv; st.roofway = [];
    if (lv) {
      const m = new MeshBuilder(), W = TEX.wood, Wr = TEX.pole || TEX.wood;
      const hAt = (x, z) => { const t = sc.topAt(Math.floor(x), Math.floor(z)); return (t ? t.h : 2.3) + 0.02; };
      for (const b of ROOF_BRIDGES.filter(q => q.lv <= lv)) {
        const [x0, z0] = b.a, [x1, z1] = b.b, h0 = hAt(x0, z0 - 0.05), h1 = hAt(x1, z1 + 0.05);
        const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, w = b.kind === 'wire' ? 0.04 : 0.24;
        const img = b.kind === 'wire' ? Wr : W;
        m.quad(img, [x0 - nx * w, h0, z0 - nz * w], [x1 - nx * w, h1, z1 - nz * w], [x1 + nx * w, h1, z1 + nz * w], [x0 + nx * w, h0, z0 + nz * w], [0, 1, 0]);
        if (b.kind === 'plank') m.quad(img, [x0 + nx * w, h0, z0 + nz * w], [x1 + nx * w, h1, z1 + nz * w], [x1 + nx * w, h1 - 0.06, z1 + nz * w], [x0 + nx * w, h0 - 0.06, z0 + nz * w], [0, 0, 1]);
      }
      st.roofway = m.build();
    }
  }
  for (const p of st.roofway || []) F.lit.push({ mesh: p.mesh, img: p.img, o: { alphaTest: 0.3 } });
  const cp = Math.cos(R3.pitch);
  for (const p of sc.pigeons || []) {
    if (p.state === 'gone') continue;
    const h = sc.topH(p.x, p.y - 2) + (p.state === 'fly' ? p.fly * 1.4 : 0);
    const f = p.state === 'fly' ? Math.floor(p.fly * 10) % 2 : (Math.floor(p.t * 0.7) % 7 === 0 ? 1 : 0);
    pushSprite(F.sprites, ART.fix(toonPigeon(f)), p.x, p.y, { lift: h * cp, flip: p.vx < 0, minLight: [0.45, 0.45, 0.5] });
    if (p.state === 'sit') shadowAt(F, p.x, p.y, 0.35, 0.14, 1, h);
  }
}
