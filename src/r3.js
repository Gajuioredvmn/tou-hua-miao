// ================= 3D 畫面的共用工具：相機、光、畫面組裝、疊在上面的 2D 圖層 =================
const R3 = {
  on: false, ov: null, ovCv: null, stages: {}, last: 0, dt: 0.016,
  cam: { x: 7.5, z: 10, zoom: 1, tzoom: 1, ready: false },
  pitch: 0.64, fov: 0.62,
  init(glCanvas, ovCanvas) {
    this.ovCv = ovCanvas;
    if (!/[?&]gl=0/.test(location.search) && GL3.init(glCanvas)) {
      this.on = true;
      PPU = GL3.maxTex >= 4096 ? 64 : 40;
      this.waitFonts();
    } else {
      glCanvas.hidden = true;
    }
    return this.on;
  },
  resize(W, H, dpr) {
    if (!this.on) return;
    GL3.resize(W, H, dpr);
    this.dpr = Math.min(dpr || 1, 2.5);
    this.ovCv.width = Math.round(W * this.dpr); this.ovCv.height = Math.round(H * this.dpr);
    this.ovCv.style.width = W + 'px'; this.ovCv.style.height = H + 'px';
    this.ov = this.ovCv.getContext('2d');
    this.W = W; this.H = H;
  },
  fontsOk: false,
  waitFonts() {
    const done = () => { this.fontsOk = true; };
    try {
      if (!document.fonts || !document.fonts.load) { done(); return; }
      Promise.race([document.fonts.load('20px Huninn'), new Promise(r => setTimeout(r, 2500))]).then(done, done);
    } catch (e) { done(); }
  },
  stage(kind) {
    if (!this.stages[kind]) {
      if (!this.fontsOk) return null;
      this.stages[kind] = kind === 'night' ? buildNightStage(G.maps.night) : buildShopStage(G.maps.shop);
    }
    return this.stages[kind];
  },
  blank() {
    const gl = GL3.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, GL3.cv.width, GL3.cv.height);
    gl.clearColor(0.07, 0.08, 0.16, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  },
  // ---- 相機 ----
  // view: {w: 直式螢幕看得到的寬（格）, zmin, zmax}
  camDist(view) {
    const a = GL3.cssW / GL3.cssH;
    return (view.w / 2) / (Math.tan(this.fov / 2) * Math.min(a, 1)) * this.cam.zoom;
  },
  follow(tx, tz, dt, snap, view, map) {
    const c = this.cam;
    c.zoom += (c.tzoom - c.zoom) * Math.min(1, dt * 5);
    const d = this.camDist(view);
    const hw = d * Math.tan(this.fov / 2) * (GL3.cssW / GL3.cssH);
    const W = map.w;
    let x = W <= hw * 2 + 0.4 ? W / 2 : clamp(tx, Math.max(hw - 0.2, view.xmin !== undefined ? Math.min(view.xmin, W / 2) : -1e9), Math.min(W - hw + 0.2, view.xmax !== undefined ? Math.max(view.xmax, W / 2) : 1e9));
    let z = clamp(tz, view.zmin, view.zmax);
    if (snap || !c.ready) { c.x = x; c.z = z; c.ready = true; }
    else { const k = Math.min(1, dt * 6); c.x += (x - c.x) * k; c.z += (z - c.z) * k; }
    GL3.camera(c.x, 0, c.z, d, this.pitch, this.fov);
    this.ppu = GL3.cssW / (hw * 2);
  },
  // 世界像素座標 + 看起來的高度（格）→ 螢幕
  at(xpx, ypx, h = 0) { return GL3.project(xpx / TS, h / Math.cos(this.pitch), ypx / TS); },
  visible(xpx, ypx, m = 40) { const [sx, sy] = this.at(xpx, ypx, 0); return sx > -m && sy > -m && sx < this.W + m && sy < this.H + m; },
  // 挑離鏡頭最近的幾盞燈
  pickLights(list, n) {
    const cx = this.cam.x, cz = this.cam.z + 1;
    return list.map(l => ({ l, d: Math.hypot(l.x - cx, (l.z - cz) * 0.8) - (l.pri || 0) })).sort((a, b) => a.d - b.d).slice(0, n).map(e => e.l);
  },
  // ---- 一個 frame ----
  newFrame() {
    PREWARM.run();
    const now = performance.now();
    this.dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0.016; this.last = now;
    return { sprites: [], bushes: [], over: [], decal: [], flat: [], decalAdd: [], decalCone: [], decalGlow: [], glow: [], soft: [], sil: [], lit: [], blend: [] };
  },
  // 哪些房子擋住主角：變半透明
  updateFades(st, fx, fz, fy = 0.5) {
    const o = [fx, fy, fz], c = GL3.camPos, d = [c[0] - o[0], c[1] - o[1], c[2] - o[2]];
    const k = Math.min(1, this.dt * 7);
    for (const b of st.blocks) {
      const hit = !b.noFade && rayHitsBox(o, d, b.box);
      b.fade += ((hit ? 0.28 : 1) - b.fade) * k;
    }
  },
  render(st, F, env, post) {
    const gl = GL3;
    gl.begin(env);
    if (st.sky) for (const p of st.sky) gl.drawMesh(p.mesh, p.img, { unlit: 1, alphaTest: 0 });
    for (const p of st.ground) gl.drawMesh(p.mesh, p.img, { alphaTest: 0 });
    for (const b of st.blocks) if (b.fade > 0.97) for (const p of b.meshes) gl.drawMesh(p.mesh, p.img, { alphaTest: 0.5 });
    for (const p of st.statics) gl.drawMesh(p.mesh, p.img, { alphaTest: 0.5 });
    if (F.lit.length) for (const m of F.lit) gl.drawMesh(m.mesh, m.img, m.o || {});
    gl.drawSprites(F.sprites);
    gl.drawSilhouettes(F.sil, [1, 0.95, 0.85, 0.42]);
    gl.drawSprites(F.bushes);
    gl.drawColor(F.decal, TEX.shadow, 'alpha', { offset: true });
    if (F.flat.length) gl.drawColor(F.flat, null, 'alpha', { offset: true });
    if (F.decalCone.length) gl.drawColor(F.decalCone, TEX.cone, 'add', { offset: true });
    if (F.decalAdd.length) gl.drawColor(F.decalAdd, null, 'add', { offset: true });
    if (F.decalGlow.length) gl.drawColor(F.decalGlow, TEX.glow, 'add', { offset: true });
    if (F.soft.length) gl.drawColor(F.soft, TEX.glow, 'alpha');
    gl.drawSprites(F.over);
    // 半透明：溫室玻璃、被擋住而變淡的房子（遠的先畫）
    if (st.glassMeshes) for (const p of st.glassMeshes) gl.drawMesh(p.mesh, p.img, { blend: 'alpha', alphaTest: 0 });
    const faded = st.blocks.filter(b => b.fade <= 0.97).sort((a, b) => a.box[2] - b.box[2]);
    for (const b of faded) for (const p of b.meshes) gl.drawMesh(p.mesh, p.img, { blend: 'alpha', alphaTest: 0.02, alpha: b.fade });
    if (F.blend.length) for (const m of F.blend) gl.drawMesh(m.mesh, m.img, Object.assign({ blend: 'alpha', alphaTest: 0 }, m.o || {}));
    if (F.beams && F.beams.length) gl.drawColor(F.beams, null, 'add');
    if (F.glow.length) gl.drawColor(F.glow, TEX.glow, 'add', { depthTest: true });
    gl.postFx(post);
  },
  // ---- 疊在 3D 上面的 2D 圖層（CSS 像素）----
  ovBegin() {
    const g = this.ov; if (!g) return null;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.ovCv.width, this.ovCv.height);
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
    return g;
  },
};

// 亮燈的窗戶：每扇窗的網格只建一次，畫的時候換貼圖
function winQuad(w, img, o) {
  if (!w.mesh) { const m = new MeshBuilder(); m.quad(GL3.white, [w.x0, w.y1, w.z], [w.x1, w.y1, w.z], [w.x1, w.y0, w.z], [w.x0, w.y0, w.z], [0, 0, 1]); w.mesh = m.build()[0].mesh; }
  return { mesh: w.mesh, img, o };
}
// 慢慢把常用的圖先畫好（每格最多用 4ms），避免第一次出現時卡一下
const PREWARM = { q: [], add(fns) { this.q.push(...fns); }, run() { const t0 = performance.now(); while (this.q.length && performance.now() - t0 < 4) { try { this.q.shift()(); } catch (e) { } } } };

// 地上的扇形（視線光錐）：pts 是世界像素座標的多邊形，第一點是眼睛
function coneVerts(out, pts, col, edgeCol) {
  const ex = pts[0][0] / TS, ez = pts[0][1] / TS;
  const [r, g, b, a] = col;
  for (let i = 1; i < pts.length - 1; i++) {
    const x1 = pts[i][0] / TS, z1 = pts[i][1] / TS, x2 = pts[i + 1][0] / TS, z2 = pts[i + 1][1] / TS;
    const d1 = Math.hypot(x1 - ex, z1 - ez), d2 = Math.hypot(x2 - ex, z2 - ez);
    out.push(ex, 0.02, ez, r, g, b, a, 0.5, 0, x1, 0.02, z1, r, g, b, a * 0.35, 0, 1, x2, 0.02, z2, r, g, b, a * 0.35, 1, 1);
  }
  if (edgeCol) {
    // 外緣亮線
    const [er, eg, eb, ea] = edgeCol, w = 0.05;
    for (let i = 1; i < pts.length - 1; i++) {
      const x1 = pts[i][0] / TS, z1 = pts[i][1] / TS, x2 = pts[i + 1][0] / TS, z2 = pts[i + 1][1] / TS;
      const k1 = 1 - w / Math.max(0.1, Math.hypot(x1 - ex, z1 - ez)), k2 = 1 - w / Math.max(0.1, Math.hypot(x2 - ex, z2 - ez));
      const ix1 = ex + (x1 - ex) * k1, iz1 = ez + (z1 - ez) * k1, ix2 = ex + (x2 - ex) * k2, iz2 = ez + (z2 - ez) * k2;
      out.push(x1, 0.022, z1, er, eg, eb, ea, 0, 0, x2, 0.022, z2, er, eg, eb, ea, 0, 0, ix2, 0.022, iz2, er, eg, eb, 0, 0, 0);
      out.push(x1, 0.022, z1, er, eg, eb, ea, 0, 0, ix2, 0.022, iz2, er, eg, eb, 0, 0, 0, ix1, 0.022, iz1, er, eg, eb, 0, 0, 0);
    }
  }
}
// 地上的圓環（聲波）
function ringVerts(out, x, z, r, w, col) {
  const n = 40, [cr, cg, cb, ca] = col;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
    const o0 = [x + Math.cos(a0) * r, z + Math.sin(a0) * r], o1 = [x + Math.cos(a1) * r, z + Math.sin(a1) * r];
    const i0 = [x + Math.cos(a0) * (r - w), z + Math.sin(a0) * (r - w)], i1 = [x + Math.cos(a1) * (r - w), z + Math.sin(a1) * (r - w)];
    out.push(o0[0], 0.03, o0[1], cr, cg, cb, ca, 0, 0, o1[0], 0.03, o1[1], cr, cg, cb, ca, 0, 0, i1[0], 0.03, i1[1], cr, cg, cb, 0, 0, 0);
    out.push(o0[0], 0.03, o0[1], cr, cg, cb, ca, 0, 0, i1[0], 0.03, i1[1], cr, cg, cb, 0, 0, 0, i0[0], 0.03, i0[1], cr, cg, cb, 0, 0, 0);
  }
}
// 影子
function shadowAt(F, xpx, ypx, w = 0.8, d = 0.34, a = 1, y0 = 0) { groundQuad(F.decal, xpx / TS, ypx / TS, w, d, 0, [1, 1, 1, a], 0.012 + y0); }
