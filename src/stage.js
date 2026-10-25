// ================= 3D 場景：把格子地圖蓋成立體小模型 =================
const NIGHT_HOUSES = [
  { id: 'lin', x0: 9, x1: 14, z0: 8, z1: 12, h: 2.3, mat: { kind: 'tile', base: '#b9c7d4', line: '#93a2b2', foot: '#6f7c8c' }, door: '#c4433a', num: '7號', curtain: '#9ec5e8', ac: 13 },
  { id: 'wang', x0: 1, x1: 6, z0: 18, z1: 22, h: 2.3, mat: { kind: 'tile', base: '#ecd7b4', line: '#cdb48d', foot: '#8c7356' }, door: '#c4433a', num: '5號', curtain: '#f0a8bf', ac: 1 },
  { id: 'empty', x0: 1, x1: 6, z0: 28, z1: 32, h: 2.2, mat: { kind: 'concrete', base: '#a8a59c', line: '#8f8c84', foot: '#6d6a63' }, door: '#7a5a46', num: '', curtain: '#999', worn: true },
  { id: 'bo', x0: 9, x1: 14, z0: 28, z1: 32, h: 2.3, mat: { kind: 'brick', base: '#b8644c', line: '#8a4a3a', foot: '#6a3a30' }, door: '#4f8f5f', num: '9號', curtain: '#e8d8a0', ac: 9 },
];
const SHOP_FRONT = { x0: 1, x1: 14, z0: 1, z1: 5, h: 3.0 };

// 動態元素的位置（世界座標，格）
function T3(tx, ty) { return [tx + 0.5, ty + 0.5]; }

const TEX = {};   // 共用貼圖
function makeSharedTextures() {
  if (TEX.ready) return;
  TEX.grille = paintGrille(); TEX.fence = paintFence();
  TEX.tin = paintCorrugated('#8fa1b5'); TEX.tinRed = paintCorrugated('#c26a52'); TEX.tinBlue = paintCorrugated('#5f86b5');
  TEX.cap = paintFlat('#e7e2d6', { edge: true }); TEX.concrete = paintFlat('#9b9790'); TEX.darkRoof = paintRoof(4, 4, { base: '#5c5866', seed: 21 });
  TEX.steel = paintSteel(); TEX.wood = paintWood(); TEX.woodDark = paintWood('#8a5a3a'); TEX.glass = paintGlass();
  TEX.shards = paintShards(); TEX.pole = paintFlat('#a9a59c', { seed: 4 });
  TEX.litWarm = paintLitWindow('warm'); TEX.litTv = paintLitWindow('tv'); TEX.litFace = paintLitWindow('face');
  TEX.shadow = paintRadial('rgba(10,6,20,0.55)', 'rgba(10,6,20,0)');
  TEX.glow = paintRadial('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  TEX.cone = paintConeTex();
  TEX.lampHead = paintFlat('#3c4050', { seed: 2 });
  TEX.ac = (() => { const [c, g] = cvs(64, 48); g.fillStyle = '#dcdcd4'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#5a5e6a'; g.beginPath(); g.arc(24, 24, 16, 0, 7); g.fill(); g.strokeStyle = '#c4c4bc'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(8, 10 + i * 7); g.lineTo(40, 10 + i * 7); g.stroke(); } g.fillStyle = '#b8b8b0'; g.fillRect(46, 8, 12, 32); g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 45); return c; })();
  TEX.ready = true;
}

// ---------- 夜晚巷子 ----------
function buildNightStage(map) {
  makeSharedTextures();
  const st = { kind: 'night', map, blocks: [], statics: [], glassMeshes: [], bushes: [], windows: [], lamps: [], towers: [] };
  // 地面：大張手繪
  const ground = paintGround(map, PPU, { seed: 7, slow: [[7, 9], [7, 33]], manholes: [[7.5, 15.5], [7.4, 27.2], [6.6, 40.5]] });
  const gm = new MeshBuilder();
  gm.quad(ground, [0, 0, 0], [map.w, 0, 0], [map.w, 0, map.h], [0, 0, map.h], [0, 1, 0]);
  // 地圖外圍：一大片暗暗的屋頂，避免看到空白
  gm.quad(TEX.darkRoof, [-30, -0.02, -30], [map.w + 30, -0.02, -30], [map.w + 30, -0.02, map.h + 30], [-30, -0.02, map.h + 30], [0, 1, 0], [0, 0, 12, 12]);
  TEX.darkRoof.__repeat = true;
  st.ground = gm.build();
  // 遠景天際線
  {
    const sky = paintSkyline(34, 12);
    const m = new MeshBuilder(); m.quad(sky, [-10, 14, -1.2], [map.w + 10, 14, -1.2], [map.w + 10, 0, -1.2], [-10, 0, -1.2], [0, 0, 1]);
    st.sky = m.build();
  }
  // 房子
  for (const b of NIGHT_HOUSES) st.blocks.push(buildHouse(map, b));
  st.blocks.push(buildShopFront(map, true));
  // 兩側的鄰居高牆 + 屋頂
  st.blocks.push(buildBoundary(map, 0, 1, 0, map.h, 2.8, 'w'));
  st.blocks.push(buildBoundary(map, 14, 15, 0, map.h, 2.8, 'e'));
  st.blocks.push(buildBoundary(map, 0, 15, -0.2, 1, 3.6, 'n'));
  // 大宅圍牆
  st.blocks.push(buildHighWall(1, 14, 42, 1.75));
  // 大宅本體（只看得到屋頂）
  st.blocks.push(buildMansion(1, 14, 51, 53));
  // 花園步道燈、溫室上的小燈泡串（婚禮佈置）
  st.gardenLights = [{ x: 1.6, z: 43.6 }, { x: 10.6, z: 45.2 }, { x: 2.2, z: 50.3 }, { x: 11.2, z: 50.3 }, { x: 6.5, z: 50.4 }];
  {
    const m = new MeshBuilder(), P = { img: TEX.lampHead }, G2 = { img: TEX.cap };
    for (const gl of st.gardenLights) { m.box(gl.x - 0.06, 0, gl.z - 0.06, gl.x + 0.06, 0.55, gl.z + 0.06, { front: P, left: P, right: P }); m.box(gl.x - 0.12, 0.55, gl.z - 0.12, gl.x + 0.12, 0.7, gl.z + 0.12, { top: G2, front: G2, left: G2, right: G2 }); }
    st.statics.push(...m.build());
  }
  st.fairy = [{ x: 4.5, z: 47.5 }, { x: 8.5, z: 47.5 }];
  st.fairyBulbs = [];
  for (let i = 0; i <= 16; i++) { const k = i / 16; const x = 3.5 + k * 6, sag = Math.sin(k * Math.PI * 4) * 0.08; st.fairyBulbs.push({ x, y: 2.28 - Math.abs(sag), z: 47.5, ph: i * 1.7 }); }
  for (let i = 0; i <= 10; i++) { const k = i / 10; st.fairyBulbs.push({ x: 3.5 + k * 6, y: 1.5 - Math.sin(k * Math.PI) * 0.12, z: 49.52, ph: i * 2.3 }); }
  // 柵欄
  st.statics.push(...buildFences(map));
  // 溫室
  st.glassMeshes = buildGreenhouse(3.5, 9.5, 45.5, 49.5, [[6, 7]]);
  // 屋頂水塔
  const tm = new MeshBuilder();
  for (const [tx, ty] of ROOF_TOWERS) {
    const b = [...NIGHT_HOUSES, SHOP_FRONT].find(h => tx >= h.x0 && tx < h.x1 && ty >= h.z0 && ty < h.z1);
    const y0 = b ? b.h - 0.28 : 2.3;
    addWaterTower(tm, tx + 0.5, y0, ty + 0.6);
  }
  st.statics.push(...tm.build());
  // 路燈（電線桿）
  const lm = new MeshBuilder();
  for (const [tx, ty] of LAMPS) {
    const side = tx < 7 ? -1 : 1;
    const px = tx + 0.5 + side * 0.42, pz = ty + 0.62, hx = tx + 0.5 - side * 0.05, hy = 2.75;
    lm.cyl(TEX.pole, px, 0, pz, 0.09, 3.3, 10);
    lm.box(Math.min(px, hx) - 0.02, hy + 0.08, pz - 0.03, Math.max(px, hx) + 0.02, hy + 0.13, pz + 0.03, { top: { img: TEX.lampHead }, front: { img: TEX.lampHead }, back: { img: TEX.lampHead } });
    lm.box(hx - 0.22, hy - 0.02, pz - 0.12, hx + 0.22, hy + 0.1, pz + 0.12, { top: { img: TEX.lampHead }, front: { img: TEX.lampHead }, left: { img: TEX.lampHead }, right: { img: TEX.lampHead } });
    st.lamps.push({ x: hx, y: hy - 0.06, z: pz, tx, ty });
  }
  // 監視器的桿子
  lm.cyl(TEX.pole, 11.5, 0, 46.6 + 0.05, 0.06, 1.45, 8);
  st.statics.push(...lm.build());
  // 木箱、狗屋
  const om = new MeshBuilder();
  for (const o of NIGHT_OBJECTS) {
    if (o.k === 'crates') addCrates(om, o.x + 0.5, o.y + 0.55, o.x * 7 + o.y);
    if (o.k === 'doghouse') addDoghouse(om, o.x + 0.5, o.y + 0.55);
  }
  st.statics.push(...om.build());
  // 草叢
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
    if (map.at(tx, ty) !== 'b') continue;
    const R = rng(tx * 31 + ty * 7);
    st.bushes.push({ x: tx + 0.5 + (R() - 0.5) * 0.12, z: ty + 0.86, k: Math.floor(R() * 3), s: 1.0 + R() * 0.15, flip: R() < 0.5 });
  }
  // 花店升級：屋頂霓虹招牌（買了才畫）
  st.up = {};
  {
    const nm = new MeshBuilder(), D = { img: TEX.lampHead };
    nm.quad(paintNeon('heart'), [6.6, 4.55, 4.86], [8.4, 4.55, 4.86], [8.4, 3.05, 4.86], [6.6, 3.05, 4.86], [0, 0, 1]);
    nm.box(6.9, 2.9, 4.7, 6.98, 3.1, 4.86, { front: D, left: D, right: D }); nm.box(8.02, 2.9, 4.7, 8.1, 3.1, 4.86, { front: D, left: D, right: D });
    st.up.neon = nm.build();
  }
  // 還沒整理的店：門上貼著「頂讓」
  { const n2 = new MeshBuilder(); n2.quad(paintNotice(), [6.2, 1.42, 5.02], [6.8, 1.42, 5.02], [6.8, 0.68, 5.02], [6.2, 0.68, 5.02], [0, 0, 1]); st.up.notice = n2.build(); }
  // 亮燈的窗戶（位置是牆面上的窗洞）
  const win = (tx, b, id) => st.windows.push({ id, x0: tx + 0.09, x1: tx + 0.91, y0: 0.56, y1: 1.34, z: b.z1 + 0.012 });
  win(2, NIGHT_HOUSES[1], 'wang2'); win(4, NIGHT_HOUSES[1], 'wang4');
  win(10, NIGHT_HOUSES[0], 'lin'); win(11, NIGHT_HOUSES[3], 'bo');
  st.windows.push({ id: 'shop2a', x0: 1.75, x1: 3.25, y0: 2.12, y1: 2.6, z: 5.012 }, { id: 'shop2b', x0: 11.75, x1: 13.25, y0: 2.12, y1: 2.6, z: 5.012 });
  return st;
}

function facadeOpenings(map, b) {
  const row = b.z1 - 1, ops = [];
  for (let tx = b.x0; tx < b.x1; tx++) {
    const ch = map.at(tx, row), x = tx - b.x0;
    if (ch === 'W') ops.push({ t: 'win', x, w: 1, curtain: b.curtain, tx });
    else if (ch === 'w') ops.push({ t: 'dark', x, w: 1, tx });
    else if (ch === 'D') ops.push({ t: 'door', x, w: 1, col: b.door, num: b.num, tx });
    else if (ch === 'Q') ops.push({ t: 'shopwin', x, w: 1, tx });
    else if (ch === 'E') ops.push({ t: 'shopdoor', x, w: 1, tx });
    else if (ch === 'C') ops.push({ t: 'flap', x, w: 1, tx });
  }
  return ops;
}

// 一棟房子：正面、側面、凹下去的屋頂、女兒牆、鐵窗、雨遮、冷氣
function buildHouse(map, b) {
  const R = rng(b.x0 * 13 + b.z0);
  const { x0, x1, z0, z1, h } = b, w = x1 - x0, d = z1 - z0;
  const ops = facadeOpenings(map, b);
  const facade = paintFacade({ w, h, mat: b.mat, gf: 1.5, openings: ops, parapet: 'lattice', seed: b.x0 * 7 + b.z0 });
  const side = paintFacade({ w: d, h, mat: b.mat, gf: 1.5, openings: [], parapet: 'none', seed: b.z0 });
  const roof = paintRoof(w, d, { seed: b.x0 + b.z0 * 3, base: b.worn ? '#9c8478' : '#b8735c' });
  const wallIn = paintFlat(b.mat.base);
  const m = new MeshBuilder();
  const rh = h - 0.3, t = 0.14;
  m.quad(facade, [x0, h, z1], [x1, h, z1], [x1, 0, z1], [x0, 0, z1], [0, 0, 1]);
  m.quad(side, [x0, h, z0], [x0, h, z1], [x0, 0, z1], [x0, 0, z0], [-1, 0, 0]);
  m.quad(side, [x1, h, z1], [x1, h, z0], [x1, 0, z0], [x1, 0, z1], [1, 0, 0]);
  m.quad(roof, [x0, rh, z0], [x1, rh, z0], [x1, rh, z1], [x0, rh, z1], [0, 1, 0]);
  // 女兒牆內側與頂
  m.quad(wallIn, [x0 + t, h, z1 - t], [x1 - t, h, z1 - t], [x1 - t, rh, z1 - t], [x0 + t, rh, z1 - t], [0, 0, -1]);
  m.quad(wallIn, [x1 - t, h, z0 + t], [x0 + t, h, z0 + t], [x0 + t, rh, z0 + t], [x1 - t, rh, z0 + t], [0, 0, 1]);
  m.quad(wallIn, [x0 + t, h, z0 + t], [x0 + t, h, z1 - t], [x0 + t, rh, z1 - t], [x0 + t, rh, z0 + t], [1, 0, 0]);
  m.quad(wallIn, [x1 - t, h, z1 - t], [x1 - t, h, z0 + t], [x1 - t, rh, z0 + t], [x1 - t, rh, z1 - t], [-1, 0, 0]);
  const cap = { img: TEX.cap };
  m.box(x0 - 0.03, h - 0.02, z1 - t, x1 + 0.03, h + 0.05, z1 + 0.03, { top: cap, front: cap, left: cap, right: cap });
  m.box(x0 - 0.03, h - 0.02, z0, x1 + 0.03, h + 0.05, z0 + t, { top: cap, left: cap, right: cap });
  m.box(x0 - 0.03, h - 0.02, z0 + t, x0 + t, h + 0.05, z1 - t, { top: cap, left: cap });
  m.box(x1 - t, h - 0.02, z0 + t, x1 + 0.03, h + 0.05, z1 - t, { top: cap, right: cap });
  // 一樓上方的水泥條
  m.box(x0, 1.5, z1, x1, 1.6, z1 + 0.07, { top: cap, front: cap, left: cap, right: cap });
  for (const op of ops) {
    const tx = x0 + op.x;
    if (op.t === 'win' || op.t === 'dark') {
      // 鐵窗（立體的籠子）
      const gx0 = tx + 0.06, gx1 = tx + 0.94, gy0 = 0.47, gy1 = 1.43, gz = z1 + 0.26;
      const G = { img: TEX.grille };
      m.box(gx0, gy0, z1, gx1, gy1, gz, { front: G, left: G, right: G });
      m.quad(TEX.grille, [gx0, gy0, gz], [gx1, gy0, gz], [gx1, gy0, z1], [gx0, gy0, z1], [0, 1, 0]);
      // 鐵窗上的小雨遮
      m.quad(TEX.tin, [gx0 - 0.05, gy1 + 0.1, z1], [gx1 + 0.05, gy1 + 0.1, z1], [gx1 + 0.05, gy1 - 0.02, gz + 0.08], [gx0 - 0.05, gy1 - 0.02, gz + 0.08]);
    } else if (op.t === 'door') {
      m.quad(b.worn ? TEX.tinRed : TEX.tin, [tx - 0.02, 1.47, z1], [tx + 1.02, 1.47, z1], [tx + 1.02, 1.32, z1 + 0.4], [tx - 0.02, 1.32, z1 + 0.4]);
      m.quad(TEX.tin, [tx + 1.02, 1.47, z1], [tx + 1.02, 1.47, z1], [tx + 1.02, 1.32, z1 + 0.4], [tx + 1.02, 1.32, z1]);
    }
  }
  // 冷氣室外機
  if (b.ac !== undefined) {
    const ax = b.ac + 0.5, A = { img: TEX.ac }, C = { img: TEX.cap };
    m.box(ax - 0.3, 1.66, z1, ax + 0.3, 2.0, z1 + 0.3, { front: A, top: C, left: C, right: C });
  }
  return { id: b.id, meshes: m.build(), box: [x0 - 0.05, 0, z0, x1 + 0.05, h + 0.1, z1 + 0.4], fade: 1, h };
}

// 花店：比較高、粉白條紋遮雨棚、招牌、二樓窗
function buildShopFront(map, night) {
  const b = SHOP_FRONT, { x0, x1, z0, z1, h } = b, w = x1 - x0, d = z1 - z0;
  const mat = { kind: 'paint', base: '#f3e6cf', line: '#e0d0b4', foot: '#4a8a5c' };
  const ops = facadeOpenings(map, b);
  const facade = paintFacade({ w, h, mat, gf: 1.8, openings: ops, parapet: 'none', seed: 3, night });
  // 二樓的窗（畫在牆上）
  {
    const g = facade.getContext('2d'), P = PPU, Y = v => facade.height - v * P;
    for (const wx of [0.75, 10.75]) {
      const X = wx * P, ww = 1.5 * P, top = Y(2.6), bot = Y(2.12);
      g.fillStyle = '#4a8a5c'; g.fillRect(X - 4, top - 4, ww + 8, bot - top + 8);
      g.fillStyle = '#2c3a5c'; g.fillRect(X, top, ww, bot - top);
      g.fillStyle = '#4a8a5c'; g.fillRect(X + ww / 2 - 2, top, 4, bot - top);
      g.strokeStyle = INK; g.lineWidth = 2.2; g.strokeRect(X - 4, top - 4, ww + 8, bot - top + 8);
      // 窗台的小盆栽
      for (let i = 0; i < 3; i++) { const px = X + 14 + i * (ww - 28) / 2, py = bot + 6; g.fillStyle = '#c26a4a'; g.fillRect(px - 6, py, 12, 9); g.fillStyle = '#5fae5a'; g.beginPath(); g.arc(px, py - 3, 7, 0, 7); g.fill(); g.fillStyle = ['#ff8fae', '#ffd84d', '#fff'][i]; g.beginPath(); g.arc(px - 2, py - 5, 2.5, 0, 7); g.arc(px + 3, py - 3, 2.5, 0, 7); g.fill(); }
    }
    // 女兒牆的粉色飾條
    g.fillStyle = '#ff9fbb'; g.fillRect(0, Y(2.92), facade.width, 0.06 * P);
    g.fillStyle = INK; g.fillRect(0, Y(2.86), facade.width, 2);
  }
  const side = paintFacade({ w: d, h, mat, gf: 1.8, openings: [], parapet: 'none', seed: 5 });
  const roof = paintRoof(w, d, { seed: 31, base: '#a8b0a0' });
  const m = new MeshBuilder();
  const rh = h - 0.3, t = 0.14;
  m.quad(facade, [x0, h, z1], [x1, h, z1], [x1, 0, z1], [x0, 0, z1], [0, 0, 1]);
  m.quad(side, [x0, h, z0], [x0, h, z1], [x0, 0, z1], [x0, 0, z0], [-1, 0, 0]);
  m.quad(side, [x1, h, z1], [x1, h, z0], [x1, 0, z0], [x1, 0, z1], [1, 0, 0]);
  m.quad(roof, [x0, rh, z0], [x1, rh, z0], [x1, rh, z1], [x0, rh, z1], [0, 1, 0]);
  const wallIn = paintFlat(mat.base);
  m.quad(wallIn, [x0 + t, h, z1 - t], [x1 - t, h, z1 - t], [x1 - t, rh, z1 - t], [x0 + t, rh, z1 - t], [0, 0, -1]);
  const cap = { img: TEX.cap };
  m.box(x0 - 0.03, h - 0.02, z1 - t, x1 + 0.03, h + 0.05, z1 + 0.03, { top: cap, front: cap, left: cap, right: cap });
  // 遮雨棚：斜斜的條紋布
  const aw = paintAwning(w);
  m.quad(aw, [x0, 1.86, z1], [x1, 1.86, z1], [x1, 1.5, z1 + 0.62], [x0, 1.5, z1 + 0.62]);
  m.quad(aw, [x0, 1.86, z1], [x0, 1.86, z1], [x0, 1.5, z1 + 0.62], [x0, 1.5, z1], null, [0, 0, 0.05, 0.78]);
  m.quad(aw, [x1, 1.86, z1], [x1, 1.86, z1], [x1, 1.5, z1], [x1, 1.5, z1 + 0.62], null, [0, 0, 0.05, 0.78]);
  // 招牌
  const sign = paintSign(6.4, 0.62, '美玲花坊');
  const S = { img: TEX.cap };
  m.box(4.3, 2.0, z1, 10.7, 2.62, z1 + 0.1, { front: { img: sign }, top: S, left: S, right: S });
  return { id: 'shop', meshes: m.build(), box: [x0, 0, z0, x1, h + 0.1, z1 + 0.65], fade: 1, h, noFade: true };
}

// 地圖兩側的鄰居：一面高牆 + 往外延伸的屋頂
function buildBoundary(map, x0, x1, z0, z1, h, side) {
  const R = rng(x0 * 3 + 1);
  const m = new MeshBuilder();
  const mat = { kind: 'concrete', base: '#a7a59f', line: '#8f8d88', foot: '#76736c' };
  if (side === 'w' || side === 'e') {
    // 分段畫，每段 6 格，有窗戶、水管
    for (let z = z0; z < z1; z += 6) {
      const len = Math.min(6, z1 - z);
      const tex = paintFacade({ w: len, h, mat, gf: 1.6, openings: [], parapet: 'none', seed: Math.floor(z) + x0 * 5 });
      const g = tex.getContext('2d'), P = PPU;
      // 一些窗戶跟水管
      for (let i = 0; i < len; i += 2) {
        if (R() < 0.45) {
          const wx = (i + 0.4 + R() * 0.6) * P, wy = tex.height - (1.4 + R() * 0.7) * P;
          g.fillStyle = '#d6d2c8'; g.fillRect(wx - 3, wy - 3, 0.6 * P + 6, 0.45 * P + 6);
          g.fillStyle = R() < 0.3 ? '#e8c27a' : '#2a3352'; g.fillRect(wx, wy, 0.6 * P, 0.45 * P);
          g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(wx - 3, wy - 3, 0.6 * P + 6, 0.45 * P + 6);
        }
      }
      const px = (0.3 + R() * (len - 0.6)) * P;
      g.fillStyle = '#8a8e96'; g.fillRect(px, 0, 7, tex.height); g.fillStyle = '#b5b9c0'; g.fillRect(px + 1, 0, 2, tex.height);
      if (side === 'w') m.quad(tex, [x1, h, z], [x1, h, z + len], [x1, 0, z + len], [x1, 0, z], [1, 0, 0]);
      else m.quad(tex, [x0, h, z + len], [x0, h, z], [x0, 0, z], [x0, 0, z + len], [-1, 0, 0]);
    }
    const roof = paintRoof(3, 6, { seed: x0 + 70, base: '#8e8a92' });
    roof.__repeat = false;
    const rx0 = side === 'w' ? x0 - 8 : x0, rx1 = side === 'w' ? x1 : x1 + 8;
    for (let z = z0; z < z1; z += 6) m.quad(roof, [rx0, h, z], [rx1, h, z], [rx1, h, Math.min(z1, z + 6)], [rx0, h, Math.min(z1, z + 6)], [0, 1, 0]);
    const cap = { img: TEX.cap };
    m.box(side === 'w' ? x1 - 0.12 : x0, h, z0, side === 'w' ? x1 : x0 + 0.12, h + 0.12, z1, { top: cap, left: cap, right: cap });
    return { id: 'edge-' + side, meshes: m.build(), box: [x0, 0, z0, x1, h, z1], fade: 1, h, noFade: true };
  }
  // 北邊：花店後面的高牆
  const tex = paintFacade({ w: x1 - x0, h, mat, gf: 2, openings: [], parapet: 'none', seed: 77 });
  m.quad(tex, [x0, h, z1], [x1, h, z1], [x1, 0, z1], [x0, 0, z1], [0, 0, 1]);
  m.quad(TEX.darkRoof, [x0 - 10, h, z0 - 6], [x1 + 10, h, z0 - 6], [x1 + 10, h, z1], [x0 - 10, h, z1], [0, 1, 0], [0, 0, 6, 2]);
  return { id: 'edge-n', meshes: m.build(), box: [x0, 0, z0, x1, h, z1], fade: 1, h, noFade: true };
}

function buildHighWall(x0, x1, row, h) {
  const z0 = row + 0.25, z1 = row + 0.78;
  const mat = { kind: 'brick', base: '#9a4a40', line: '#5e2a26', foot: '#4a2420' };
  const tex = paintFacade({ w: x1 - x0, h, mat, gf: 1.5, openings: [], parapet: 'none', seed: 42 });
  const m = new MeshBuilder();
  m.quad(tex, [x0, h, z1], [x1, h, z1], [x1, 0, z1], [x0, 0, z1], [0, 0, 1]);
  const cap = { img: TEX.cap };
  m.box(x0, h, z0 - 0.04, x1, h + 0.1, z1 + 0.04, { top: cap, front: cap });
  // 碎玻璃：兩片交叉
  for (let x = x0; x < x1; x += 2) {
    const xe = Math.min(x1, x + 2), u1 = (xe - x) / 2;
    m.quad(TEX.shards, [x, h + 0.34, (z0 + z1) / 2], [xe, h + 0.34, (z0 + z1) / 2], [xe, h + 0.08, (z0 + z1) / 2], [x, h + 0.08, (z0 + z1) / 2], [0, 0, 1], [0, 0, u1, 1]);
  }
  return { id: 'highwall', meshes: m.build(), box: [x0, 0, z0, x1, h + 0.35, z1], fade: 1, h };
}

function buildMansion(x0, x1, z0, z1) {
  const m = new MeshBuilder();
  const roofTex = (() => {
    const [c, g] = cvs(512, 128);
    g.fillStyle = '#4a5a8a'; g.fillRect(0, 0, 512, 128);
    for (let y = 0; y < 128; y += 16) for (let x = (y / 16 % 2) * 12; x < 512; x += 24) { g.fillStyle = '#6274aa'; rrect(g, x + 1, y + 1, 22, 14, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 4, y + 3, 14, 2); }
    g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 509, 125);
    return c;
  })();
  const eh = 2.2, rh = 3.3, zr = (z0 + z1) / 2;
  const wallTex = paintFacade({ w: x1 - x0, h: eh, mat: { kind: 'paint', base: '#efe6d8', line: '#d6cab4' }, gf: 1.6, openings: [], parapet: 'none', seed: 9 });
  m.quad(wallTex, [x0, eh, z0], [x0, eh, z0], [x0, 0, z0], [x0, 0, z0]);
  // 北面斜屋頂（朝相機那一面）
  m.quad(roofTex, [x0 + 1.2, rh, zr], [x1 - 1.2, rh, zr], [x1 + 0.2, eh, z0 - 0.3], [x0 - 0.2, eh, z0 - 0.3]);
  m.quad(roofTex, [x0 - 0.2, eh, z1 + 0.3], [x1 + 0.2, eh, z1 + 0.3], [x1 - 1.2, rh, zr], [x0 + 1.2, rh, zr]);
  m.tri(roofTex, [x0 - 0.2, eh, z0 - 0.3], [x0 - 0.2, eh, z1 + 0.3], [x0 + 1.2, rh, zr], null, [0, 1], [1, 1], [0.5, 0]);
  m.tri(roofTex, [x1 + 0.2, eh, z1 + 0.3], [x1 + 0.2, eh, z0 - 0.3], [x1 - 1.2, rh, zr], null, [0, 1], [1, 1], [0.5, 0]);
  m.box(x0, 0, z0, x1, eh, z1, { left: { img: wallTex }, right: { img: wallTex } });
  return { id: 'mansion', meshes: m.build(), box: [x0 - 0.2, 0, z0 - 0.3, x1 + 0.2, rh, z1 + 0.3], fade: 1, h: rh };
}

// 柵欄：每格中心往相連的方向畫半段
function buildFences(map) {
  const m = new MeshBuilder();
  const isF = c => c === 'f';
  const H = 0.72;
  const seg = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az); if (len < 0.01) return;
    const u1 = len * 1.6;
    // 欄杆（兩面都要看得到）
    m.quad(TEX.fence, [ax, H, az], [bx, H, bz], [bx, 0.02, bz], [ax, 0.02, az], null, [0, 0, u1, 1]);
    m.quad(TEX.fence, [bx, H, bz], [ax, H, az], [ax, 0.02, az], [bx, 0.02, bz], null, [u1, 0, 0, 1]);
  };
  const post = (x, z) => { const P = { img: TEX.lampHead }; m.box(x - 0.05, 0, z - 0.05, x + 0.05, H + 0.08, z + 0.05, { top: P, front: P, left: P, right: P, back: P }); };
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
    if (!isF(map.at(tx, ty))) continue;
    const cx = tx + 0.5, cz = ty + 0.5;
    let any = false;
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const n = map.at(tx + dx, ty + dz);
      if (n === 'f' || n === 'g' || (WALLISH.has(n) && n !== 'C')) {
        seg(cx, cz, cx + dx * 0.5, cz + dz * 0.5); any = true;
        if (n === 'g') post(cx + dx * 0.5, cz + dz * 0.5);
      }
    }
    post(cx, cz);
  }
  return m.build();
}

function buildGreenhouse(x0, x1, z0, z1, doors, y0 = 0, k = 1) {
  const m0 = new MeshBuilder(), G = TEX.glass, h = 1.5 * k, rh = 2.25 * k, zr = (z0 + z1) / 2;
  // 可以整個抬高（蓋在頂樓上）
  const m = y0 ? { quad: (t, a, b, c, d, ...r) => m0.quad(t, ...[a, b, c, d].map(p => [p[0], p[1] + y0, p[2]]), ...r), tri: (t, a, b, c, ...r) => m0.tri(t, ...[a, b, c].map(p => [p[0], p[1] + y0, p[2]]), ...r), build: () => m0.build() } : m0;
  // 南面（朝相機）與北面
  m.quad(G, [x0, h, z1], [x1, h, z1], [x1, 0, z1], [x0, 0, z1], [0, 0, 1], [0, 0, (x1 - x0) / 1.2, 1]);
  for (let x = x0; x < x1; x += 1) {
    const xe = Math.min(x1, x + 1);
    const door = doors.some(([a, b]) => x + 0.5 >= a && x + 0.5 < b);
    m.quad(G, [xe, door ? h : h, z0], [x, h, z0], [x, door ? 1.1 : 0, z0], [xe, door ? 1.1 : 0, z0], [0, 0, -1]);
  }
  m.quad(G, [x0, h, z0], [x0, h, z1], [x0, 0, z1], [x0, 0, z0], [-1, 0, 0], [0, 0, (z1 - z0) / 1.2, 1]);
  m.quad(G, [x1, h, z1], [x1, h, z0], [x1, 0, z0], [x1, 0, z1], [1, 0, 0], [0, 0, (z1 - z0) / 1.2, 1]);
  m.quad(G, [x0, rh, zr], [x1, rh, zr], [x1, h, z1], [x0, h, z1], null, [0, 0, (x1 - x0) / 1.2, 1]);
  m.quad(G, [x1, rh, zr], [x0, rh, zr], [x0, h, z0], [x1, h, z0], null, [0, 0, (x1 - x0) / 1.2, 1]);
  m.tri(G, [x0, h, z1], [x0, rh, zr], [x0, h, z0], null, [0, 1], [0.5, 0], [1, 1]);
  m.tri(G, [x1, h, z0], [x1, rh, zr], [x1, h, z1], null, [0, 1], [0.5, 0], [1, 1]);
  TEX.glass.__repeat = true;
  return m.build();
}

function addWaterTower(m, x, y0, z) {
  const S = TEX.steel, L = { img: TEX.lampHead };
  for (const [dx, dz] of [[-0.24, -0.2], [0.24, -0.2], [-0.24, 0.2], [0.24, 0.2]]) m.box(x + dx - 0.03, y0, z + dz - 0.03, x + dx + 0.03, y0 + 0.32, z + dz + 0.03, { front: L, left: L, right: L });
  m.box(x - 0.34, y0 + 0.3, z - 0.3, x + 0.34, y0 + 0.36, z + 0.3, { top: L, front: L, left: L, right: L });
  m.cyl(S, x, y0 + 0.36, z, 0.34, 0.62, 16, [0, 0, 1, 1], { img: TEX.steel, uv: [0.2, 0.1, 0.4, 0.9] });
  m.cyl(S, x, y0 + 0.98, z, 0.2, 0.08, 12, [0, 0, 1, 0.2], { img: TEX.steel, uv: [0.6, 0.2, 0.8, 0.8] });
}
function addCrates(m, x, z, seed) {
  const W = { img: TEX.wood };
  m.box(x - 0.42, 0, z - 0.38, x + 0.42, 0.62, z + 0.38, { top: W, front: W, left: W, right: W });
  m.box(x - 0.3, 0.62, z - 0.26, x + 0.26, 1.08, z + 0.26, { top: W, front: W, left: W, right: W });
}
function addDoghouse(m, x, z) {
  const W = { img: TEX.wood }, Rf = { img: TEX.tinRed };
  const front = (() => { const c = makeCanvas(64, 64); const g = c.getContext('2d'); g.drawImage(TEX.wood, 0, 0); g.fillStyle = '#1f1622'; g.beginPath(); g.moveTo(20, 64); g.lineTo(20, 34); g.arc(32, 34, 12, Math.PI, 0); g.lineTo(44, 64); g.closePath(); g.fill(); g.fillStyle = '#ffd84d'; rrect(g, 22, 8, 20, 9, 2); g.fill(); g.fillStyle = INK; g.font = '7px sans-serif'; g.textAlign = 'center'; g.fillText('小柴', 32, 15); return c; })();
  m.box(x - 0.4, 0, z - 0.35, x + 0.4, 0.55, z + 0.35, { front: { img: front }, left: W, right: W, top: W });
  m.quad(TEX.tinRed, [x - 0.48, 0.92, z], [x + 0.48, 0.92, z], [x + 0.48, 0.5, z + 0.45], [x - 0.48, 0.5, z + 0.45]);
  m.quad(TEX.tinRed, [x + 0.48, 0.92, z], [x - 0.48, 0.92, z], [x - 0.48, 0.5, z - 0.45], [x + 0.48, 0.5, z - 0.45]);
  m.tri(TEX.wood, [x - 0.4, 0.55, z + 0.35], [x - 0.4, 0.88, z], [x - 0.4, 0.55, z - 0.35], null, [0, 1], [0.5, 0], [1, 1]);
  m.tri(TEX.wood, [x + 0.4, 0.55, z - 0.35], [x + 0.4, 0.88, z], [x + 0.4, 0.55, z + 0.35], null, [0, 1], [0.5, 0], [1, 1]);
  m.tri(front, [x - 0.4, 0.55, z + 0.35], [x + 0.4, 0.55, z + 0.35], [x, 0.88, z + 0.35], null, [0, 0.95], [1, 0.95], [0.5, 0.75]);
}

// 中秋烤肉：烤肉架、燈籠串、擺月餅柚子的小桌子（第三晚才建）
function buildBBQProps() {
  const m = new MeshBuilder();
  const S = { img: TEX.steel }, D = { img: TEX.lampHead }, Wd = { img: TEX.wood };
  const gx = 11.5, gz = 22.5;
  for (const [dx, dz] of [[-0.34, -0.16], [0.34, -0.16], [-0.34, 0.16], [0.34, 0.16]]) m.box(gx + dx - 0.025, 0, gz + dz - 0.025, gx + dx + 0.025, 0.46, gz + dz + 0.025, { front: D, left: D, right: D });
  m.box(gx - 0.42, 0.44, gz - 0.2, gx + 0.42, 0.6, gz + 0.2, { front: S, left: S, right: S, back: S });
  const rack = paintGrille({ col: '#a8aeb8', dark: '#2a2a30', bars: 10 });
  m.quad(rack, [gx - 0.4, 0.62, gz - 0.18], [gx + 0.4, 0.62, gz - 0.18], [gx + 0.4, 0.62, gz + 0.18], [gx - 0.4, 0.62, gz + 0.18], [0, 1, 0]);
  // 香腸、玉米
  const saus = { img: paintFlat('#d9605a', { seed: 2 }) }, corn = { img: paintFlat('#f2c94a', { seed: 5 }) };
  for (let i = 0; i < 3; i++) m.box(gx - 0.3 + i * 0.18, 0.63, gz - 0.1, gx - 0.2 + i * 0.18, 0.68, gz + 0.1, { top: saus, front: saus, left: saus, right: saus });
  m.box(gx + 0.16, 0.63, gz - 0.12, gx + 0.34, 0.69, gz - 0.02, { top: corn, front: corn, left: corn, right: corn });
  // 小桌子 + 月餅 + 柚子
  const tx = 13.2, tz = 23.9;
  for (const [dx, dz] of [[-0.36, -0.2], [0.36, -0.2], [-0.36, 0.2], [0.36, 0.2]]) m.box(tx + dx - 0.02, 0, tz + dz - 0.02, tx + dx + 0.02, 0.48, tz + dz + 0.02, { front: D, left: D, right: D });
  const cloth = { img: (() => { const [c, g] = cvs(64, 64); g.fillStyle = '#e8394d'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff6e8'; for (let i = 0; i < 64; i += 16) for (let j = 0; j < 64; j += 16) if ((i + j) / 16 % 2) g.fillRect(i, j, 16, 16); g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 61); return c; })() };
  m.box(tx - 0.44, 0.48, tz - 0.27, tx + 0.44, 0.52, tz + 0.27, { top: cloth, front: cloth, left: cloth, right: cloth });
  const cake = { img: paintFlat('#d9a04a', { seed: 7 }) }, pom = { img: paintFlat('#c8d65a', { seed: 9 }) };
  for (let i = 0; i < 3; i++) m.cyl(cake.img, tx - 0.25 + i * 0.13, 0.52, tz - 0.05, 0.055, 0.04, 10, [0, 0, 1, 1], cake);
  m.cyl(pom.img, tx + 0.22, 0.52, tz + 0.02, 0.1, 0.16, 12, [0, 0, 1, 1], pom);
  // 燈籠串
  const lan = [];
  const x0 = 9.3, x1 = 13.8, zl = 21.35;
  for (let i = 0; i <= 12; i++) { const k = i / 12, k2 = (i + 1) / 12; if (i < 12) { const ya = 2.05 - Math.sin(k * Math.PI) * 0.18, yb = 2.05 - Math.sin(k2 * Math.PI) * 0.18; m.box(x0 + (x1 - x0) * k, Math.min(ya, yb) - 0.01, zl - 0.01, x0 + (x1 - x0) * k2, Math.max(ya, yb) + 0.01, zl + 0.01, { front: D, top: D }); } }
  for (let i = 1; i <= 5; i++) {
    const k = i / 6, x = x0 + (x1 - x0) * k, y = 2.05 - Math.sin(k * Math.PI) * 0.18 - 0.24;
    m.cyl(TEX.tinRed, x, y, zl, 0.11, 0.2, 10, [0, 0, 1, 1], { img: TEX.cap, uv: [0, 0, 1, 1] });
    lan.push({ x, y: y + 0.1, z: zl + 0.05, ph: i * 1.3 });
  }
  return { meshes: m.build(), grill: { x: gx, z: gz }, lanterns: lan };
}
// 感應燈的燈頭（裝在牆上）
function buildFixture(x, z) {
  const m = new MeshBuilder(), D = { img: TEX.lampHead }, Y = { img: TEX.cap };
  m.box(x - 0.04, 1.72, z, x + 0.04, 1.8, z + 0.12, { top: D, front: D, left: D, right: D });
  m.box(x - 0.16, 1.62, z + 0.08, x + 0.16, 1.8, z + 0.26, { top: D, front: Y, left: D, right: D });
  return m.build();
}

// 射線（貓 → 相機）有沒有穿過這個盒子
function rayHitsBox(o, d, b) {
  let t0 = 0, t1 = 1e9;
  for (let i = 0; i < 3; i++) {
    const lo = b[i], hi = b[i + 3];
    if (Math.abs(d[i]) < 1e-6) { if (o[i] < lo || o[i] > hi) return false; continue; }
    let a = (lo - o[i]) / d[i], c = (hi - o[i]) / d[i]; if (a > c) [a, c] = [c, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) return false;
  }
  return true;
}

// ---------- 花店室內（白天） ----------
function buildShopStage(map) {
  makeSharedTextures();
  const st = { kind: 'shop', map, blocks: [], statics: [], glassMeshes: [], bushes: [], windows: [], lamps: [] };
  // 地板有兩種（磨石子／人字拼），在 buildShopDecor 裡建，畫的時候挑
  const gm = new MeshBuilder();
  gm.quad(TEX.darkRoof, [-30, -0.02, -30], [map.w + 30, -0.02, -30], [map.w + 30, -0.02, map.h + 30], [-30, -0.02, map.h + 30], [0, 1, 0], [0, 0, 12, 12]);
  const street = paintStreet(27, 9);
  gm.quad(street, [-6, 0.005, 17], [21, 0.005, 17], [21, 0.005, 26], [-6, 0.005, 26], [0, 1, 0]);
  st.ground = gm.build();
  const H = 2.7;
  // 後牆：整理過（補光燈第 2 級）跟還沒整理的
  st.up = {};
  {
    const back = paintShopWall(13, H, { door: 6, pics: [[1.6, 0], [10.6, 1]], clock: 9.0 });
    const backOld = paintShopWall(13, H, { door: 6, pics: [[1.6, 0], [10.6, 1]], clock: 9.0, shabby: true });
    const a = new MeshBuilder(), b = new MeshBuilder();
    a.quad(back, [1, H, 3], [14, H, 3], [14, 0, 3], [1, 0, 3], [0, 0, 1]);
    b.quad(backOld, [1, H, 3], [14, H, 3], [14, 0, 3], [1, 0, 3], [0, 0, 1]);
    st.up.wallNew = a.build(); st.up.wallOld = b.build();
  }
  const m = new MeshBuilder();
  const cap = { img: TEX.cap };
  m.box(1, H, 0, 14, H + 0.08, 3, { top: { img: TEX.woodDark }, front: cap });
  // 兩側牆
  const sideW = paintShopWall(14, H, { seed: 3 });
  m.quad(sideW, [1, H, 3], [1, H, 16.2], [1, 0, 16.2], [1, 0, 3], [1, 0, 0], [0, 0, 1, 1]);
  m.quad(sideW, [14, H, 16.2], [14, H, 3], [14, 0, 3], [14, 0, 16.2], [-1, 0, 0], [0, 0, 1, 1]);
  m.box(0, 0, 0, 1, H, 17, { top: { img: TEX.woodDark } });
  m.box(14, 0, 0, 15, H, 17, { top: { img: TEX.woodDark } });
  st.blocks.push({ id: 'shopwalls', meshes: m.build(), box: [0, 0, 0, 15, H, 3], fade: 1, h: H, noFade: true });
  // 架子（後牆前面一整排）：擺滿花的、空空的
  {
    const a2 = new MeshBuilder(), b2 = new MeshBuilder();
    for (const [a, b] of [[1, 7], [8, 14]]) {
      const W = { img: TEX.wood }, Wo = { img: TEX.woodDark };
      a2.box(a, 0, 3.0, b, 1.05, 3.92, { front: { img: paintShelfFront(b - a, 1.05, { seed: a }) }, top: W, left: W, right: W });
      b2.box(a, 0, 3.0, b, 1.05, 3.92, { front: { img: paintShelfEmpty(b - a, 1.05, { seed: a }) }, top: Wo, left: Wo, right: Wo });
    }
    st.up.shelfNew = a2.build(); st.up.shelfOld = b2.build();
  }
  // 店中間的階梯花台
  {
    const m2 = new MeshBuilder(), W = { img: TEX.wood }, Wd = { img: TEX.woodDark };
    m2.box(4.55, 0, 8.78, 7.05, 0.45, 9.38, { top: W, front: Wd, left: Wd, right: Wd });
    m2.box(4.55, 0, 9.38, 7.05, 0.2, 9.95, { top: W, front: Wd, left: Wd, right: Wd });
    st.stand = m2.build();
  }
  // 一閃一閃的舊燈管、玻璃上的「頂讓」
  {
    const t = new MeshBuilder(), W2 = { img: paintFlat('#f4f8f2', { seed: 3 }) }, D = { img: TEX.lampHead };
    t.box(9.1, 2.3, 3.0, 11.1, 2.36, 3.1, { top: D, front: D, left: D, right: D });
    t.box(9.25, 2.22, 3.04, 10.95, 2.3, 3.14, { front: W2, left: W2, right: W2 });
    st.up.tube = t.build();
    st.up.tubeAt = { x: 10.1, y: 2.24, z: 3.2 };
    const n = new MeshBuilder();
    n.quad(paintNotice(), [9.55, 1.95, 16.335], [10.45, 1.95, 16.335], [10.45, 0.82, 16.335], [9.55, 0.82, 16.335], [0, 0, 1]);
    st.up.notice = n.build();
  }
  const sm = new MeshBuilder();
  // 櫃檯
  {
    const front = paintCounterFront(5, 0.95);
    const W = { img: TEX.wood };
    sm.box(9, 0, 7.12, 14, 0.95, 7.88, { front: { img: front }, top: W, left: W });
    // 收銀機
    const reg = { img: TEX.lampHead };
    sm.box(12.05, 0.95, 7.25, 12.85, 1.22, 7.75, { top: reg, front: reg, left: reg, right: reg });
    sm.box(12.15, 1.22, 7.3, 12.75, 1.4, 7.42, { front: { img: TEX.ac }, top: reg });
  }
  // 貓窩紙箱
  {
    const box = paintFlat('#c9965c', { seed: 8 });
    const inner = paintFlat('#8a6038', { seed: 2 });
    const B = { img: box };
    const x0 = 12.0, x1 = 13.05, z0 = 12.4, z1 = 13.25, h = 0.42;
    sm.box(x0, 0, z1 - 0.04, x1, h, z1, { front: B, top: B });
    sm.box(x0, 0, z0, x1, h, z0 + 0.04, { top: B, front: { img: inner } });
    sm.box(x0, 0, z0, x0 + 0.04, h, z1, { left: B, top: B, right: { img: inner } });
    sm.box(x1 - 0.04, 0, z0, x1, h, z1, { right: B, top: B, left: { img: inner } });
    // 小毯子
    const blanket = (() => { const [c, g] = cvs(64, 64); g.fillStyle = '#f2a4b8'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff4ee'; for (let i = 0; i < 64; i += 16) { g.fillRect(i, 0, 8, 64); } return c; })();
    sm.quad(blanket, [x0 + 0.04, 0.12, z0 + 0.04], [x1 - 0.04, 0.12, z0 + 0.04], [x1 - 0.04, 0.12, z1 - 0.04], [x0 + 0.04, 0.12, z1 - 0.04], [0, 1, 0]);
  }
  st.statics.push(...sm.build());
  // 前面：矮牆 + 玻璃
  const fm = new MeshBuilder(), gm2 = new MeshBuilder();
  const sill = paintFacade({ w: 13, h: 0.42, mat: { kind: 'paint', base: '#5aa36a', line: '#4a8a5c', foot: '#3f7a4c' }, gf: 1, openings: [], parapet: 'none', seed: 2 });
  for (const [a, b] of [[1, 7], [8, 14]]) {
    fm.box(a, 0, 16.1, b, 0.42, 16.5, { front: { img: sill, uv: [(a - 1) / 13, 0, (b - 1) / 13, 1] }, top: cap, back: { img: sill } });
    for (let x = a; x < b; x += 1.5) {
      const xe = Math.min(b, x + 1.5);
      gm2.quad(TEX.glass, [x, 2.3, 16.3], [xe, 2.3, 16.3], [xe, 0.42, 16.3], [x, 0.42, 16.3], [0, 0, 1]);
    }
  }
  const frame = { img: TEX.lampHead };
  for (const x of [1, 7, 8, 14]) fm.box(x - 0.05, 0, 16.22, x + 0.05, 2.35, 16.38, { front: frame, left: frame, right: frame });
  fm.box(1, 2.3, 16.18, 14, 2.42, 16.42, { front: frame, top: frame });
  st.statics.push(...fm.build());
  st.glassMeshes = gm2.build();
  // ---- 花店升級：買了才出現 ----
  {
    const m = new MeshBuilder(), D = { img: TEX.lampHead }, Y = { img: TEX.cap };
    st.up.lampSpots = [3.2, 7.5, 11.8].map(x => ({ x, y: 2.28, z: 3.24 }));
    for (const l of st.up.lampSpots) {
      m.box(l.x - 0.03, 2.4, 3.0, l.x + 0.03, 2.46, 3.26, { top: D, front: D, left: D, right: D });
      m.box(l.x - 0.13, 2.2, 3.12, l.x + 0.13, 2.36, 3.34, { top: Y, front: D, left: D, right: D });
    }
    st.up.lights1 = m.build();
    const m2 = new MeshBuilder();
    st.up.pendants = [{ x: 10.4, z: 7.5 }, { x: 12.6, z: 7.5 }];
    for (const p2 of st.up.pendants) {
      m2.box(p2.x - 0.012, 1.95, p2.z - 0.012, p2.x + 0.012, 3.4, p2.z + 0.012, { front: D, left: D, right: D });
      m2.cyl(TEX.tinRed, p2.x, 1.72, p2.z, 0.2, 0.24, 12, [0, 0, 1, 1], { img: TEX.tinRed });
    }
    st.up.lights2 = m2.build();
    st.up.fairy = [];
    for (let i = 0; i <= 24; i++) { const k = i / 24; st.up.fairy.push({ x: 1.2 + k * 12.6, y: 2.55 - Math.abs(Math.sin(k * Math.PI * 6)) * 0.12, z: 3.05, ph: i * 1.3 }); }
  }
  {
    const fr = paintFridge(1.06, 1.95), F2 = { img: paintFlat('#e8eef4', { seed: 6 }) };
    const m = new MeshBuilder();
    m.box(12.92, 0, 9.05, 13.98, 1.95, 9.9, { top: F2, left: F2, front: { img: fr } });
    st.up.fridge = m.build();
  }
  {
    const nm = new MeshBuilder();
    nm.quad(paintNeon('open'), [4.4, 2.62, 3.02], [6.6, 2.62, 3.02], [6.6, 1.8, 3.02], [4.4, 1.8, 3.02], [0, 0, 1]);
    st.up.neon = nm.build();
  }
  buildShopDecor(st, map);
  return st;
}
