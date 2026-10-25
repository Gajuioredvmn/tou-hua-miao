// ================= 地圖與地磚 =================
const TS = 12;
function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

// solid：擋移動；opaque：擋視線；hide：可以躲
const TILES = {
  X: { solid: 1, opaque: 1 },
  s: { solid: 1, opaque: 1 }, S: { solid: 1, opaque: 1 }, Q: { solid: 1, opaque: 1 }, E: { solid: 1, opaque: 1 },
  C: { solid: 0, opaque: 1, home: 1 },
  '.': {}, ',': {}, '"': {}, b: { hide: 1 },
  R: { solid: 1, opaque: 1 }, '#': { solid: 1, opaque: 1 }, W: { solid: 1, opaque: 1, win: 1 }, w: { solid: 1, opaque: 1 },
  D: { solid: 1, opaque: 1 },
  f: { solid: 1 }, g: {},
  L: { solid: 1 },
  H: { solid: 1, opaque: 1 },
  G: { solid: 1 }, o: {}, '~': {},
  M: { solid: 1, opaque: 1 },
  // 花店室內
  T: { solid: 1, opaque: 1 }, h: { solid: 1 }, F: {}, n: { solid: 1 }, k: { solid: 1, opaque: 1 },
  q: { solid: 1, opaque: 1 }, e: { solid: 1, opaque: 1 }, r: {}, Z: { solid: 1, opaque: 1 },
};

// 夜晚巷弄（寬 15 格）：上方是花店，往下是林家、王家、空屋、阿伯家，最底是大宅
const NIGHT_MAP = [
  'XXXXXXXXXXXXXXX', // 0
  'XsssssssssssssX',
  'XsssssssssssssX',
  'XsssssssssssssX',
  'XSQQSSECSSQQSSX', // 4 花店門面，C=貓門
  'X.............X',
  'X...........L.X',
  'Xbb.........bbX',
  'X"""""...RRRRRX', // 8 左：社區花圃　右：林家
  'X"""""...RRRRRX',
  'X"""""...RRRRRX',
  'X""""....#W#D#X',
  'X""""....f,,,,X',
  'X""""b...g,,,,X',
  'X""""....f,,,,X',
  'X""""b...f,,,,X',
  'X""""....fffffX',
  'Xbbbb....b...bX',
  'XRRRRR...""b""X', // 18 左：王家　右：空地
  'XRRRRR..."""""X',
  'XRRRRR...""L""X',
  'X#WDW#..."""""X',
  'X,,,,f...b"""bX',
  'X,,,,f..."""""X',
  'X,,,,g...""b""X',
  'X,,,,f..."""""X',
  'Xfffff...b"""bX',
  'X....b...b....X',
  'XRRRRR...RRRRRX', // 28 左：空屋　右：阿伯家
  'XRRRRR...RRRRRX',
  'XRRRRR...RRRRRX',
  'X#w#D#...#DW##X',
  'X""""f...f,,,,X',
  'X"b""g...f,,,,X',
  'X""""f...f,,,,X',
  'X"""bf...g,,,,X',
  'Xfffff...f,,,,X',
  'X........fffffX',
  'X.b.........b.X', // 38 巷底
  'XL............X',
  'X.b.........b.X',
  'X.............X',
  'XHHHHHHHHHHHHHX', // 42 大宅圍牆
  'X~~~~~~~~~~~~~X',
  'X~~~~~~~~~~~L~X',
  'X~~GGGoGGG~~~~X', // 45 溫室
  'X~~GoooooG~~~~X',
  'X~~GoooooG~~~~X',
  'X~~GoooooG~~~~X',
  'X~~GGGGGGG~~~~X',
  'X~~~~~~~~~~~~~X',
  'XMMMMMMMMMMMMMX',
  'XMMMMMMMMMMMMMX',
  'XXXXXXXXXXXXXXX',
];

// 花店室內（白天）
const SHOP_MAP = [
  'XXXXXXXXXXXXXXX',
  'XTTTTTTTTTTTTTX',
  'XTTTTTTkTTTTTTX',
  'XhhhhhhFhhhhhhX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFFFnnnnnX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFFFFFFFFX',
  'XFFFFFFrrrFFFFX',
  'XqqqqqqeqqqqqqX',
  'X.............X',
  'XXXXXXXXXXXXXXX',
];

class TileMap {
  constructor(rows) {
    this.rows = rows;
    this.h = rows.length; this.w = rows[0].length;
    this.pw = this.w * TS; this.ph = this.h * TS;
  }
  at(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return 'X';
    return this.rows[ty][tx] || 'X';
  }
  info(tx, ty) { return TILES[this.at(tx, ty)] || TILES.X; }
  solidPx(x, y) { return !!this.info(Math.floor(x / TS), Math.floor(y / TS)).solid; }
  opaquePx(x, y) { return !!this.info(Math.floor(x / TS), Math.floor(y / TS)).opaque; }
  hidePx(x, y) { return !!this.info(Math.floor(x / TS), Math.floor(y / TS)).hide; }
}

// ---------- 地磚繪製 ----------
function rect(g, c, x, y, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function speckle(g, X, Y, tx, ty, colors, n) {
  for (let i = 0; i < n; i++) {
    const a = hash(tx, ty, i * 3 + 1), b = hash(tx, ty, i * 3 + 2), c = hash(tx, ty, i * 3 + 3);
    rect(g, colors[Math.floor(c * colors.length)], X + Math.floor(a * TS), Y + Math.floor(b * TS));
  }
}
function drawAsphalt(g, X, Y, tx, ty) {
  rect(g, '#3c4055', X, Y, TS, TS);
  speckle(g, X, Y, tx, ty, ['#464b62', '#33374b', '#4d5269'], 8);
  if (hash(tx, ty, 77) < 0.08) { rect(g, '#2f3245', X + 3, Y + 6, 5, 1); rect(g, '#2f3245', X + 7, Y + 5, 2, 1); }
}
function drawYard(g, X, Y, tx, ty) {
  rect(g, '#a4a2b0', X, Y, TS, TS);
  rect(g, '#8d8b9c', X, Y + 5, TS, 1); rect(g, '#8d8b9c', X, Y + 11, TS, 1);
  rect(g, '#8d8b9c', X + 5, Y, 1, 5); rect(g, '#8d8b9c', X + 10, Y + 6, 1, 5);
  speckle(g, X, Y, tx, ty, ['#b3b1bd', '#9896a6'], 4);
}
function drawGrass(g, X, Y, tx, ty, base = '#3f7d46') {
  rect(g, base, X, Y, TS, TS);
  for (let i = 0; i < 9; i++) {
    const a = hash(tx, ty, i * 2 + 9), b = hash(tx, ty, i * 2 + 10);
    const x = X + Math.floor(a * 11), y = Y + Math.floor(b * 11);
    rect(g, i % 3 ? '#4f9654' : '#2f6436', x, y, 1, 2);
  }
}
function drawLawn(g, X, Y, tx, ty) {
  rect(g, (tx % 2) ? '#3f8a50' : '#47965a', X, Y, TS, TS);
  speckle(g, X, Y, tx, ty, ['#56a868', '#367a46'], 5);
}
function drawRoof(g, X, Y, tx, ty, map, kind) {
  const same = (dx, dy) => map.at(tx + dx, ty + dy) === kind;
  const base = kind === 'M' ? '#4c5070' : '#8f8d9c';
  const dark = kind === 'M' ? '#3a3d58' : '#777584';
  const lite = kind === 'M' ? '#5e6386' : '#a7a5b3';
  rect(g, base, X, Y, TS, TS);
  if (kind === 'M') {
    for (let yy = 0; yy < TS; yy += 4) rect(g, dark, X, Y + yy + 3, TS, 1);
    for (let yy = 0; yy < TS; yy += 4) rect(g, dark, X + ((yy / 4) % 2 ? 2 : 8), Y + yy, 1, 3);
  } else {
    speckle(g, X, Y, tx, ty, [dark, lite], 6);
    if (hash(tx, ty, 5) < 0.12) { rect(g, '#6f6d7c', X + 2, Y + 3, 4, 3); }
  }
  if (!same(0, -1)) rect(g, lite, X, Y, TS, 2);
  if (!same(-1, 0)) rect(g, lite, X, Y, 2, TS);
  if (!same(1, 0)) rect(g, dark, X + TS - 2, Y, 2, TS);
  if (!same(0, 1)) { rect(g, dark, X, Y + TS - 2, TS, 2); rect(g, '#55536a', X, Y + TS - 1, TS, 1); }
}
function drawVoid(g, X, Y, tx, ty) {
  rect(g, '#23263a', X, Y, TS, TS);
  speckle(g, X, Y, tx, ty, ['#2b2f46', '#1d2032'], 5);
}
function drawBrick(g, X, Y, tx, ty, base = '#c8a07a', mortar = '#a77f5d', foot = '#7d5f48') {
  rect(g, base, X, Y, TS, TS);
  for (let r = 0; r < 4; r++) {
    const yy = Y + r * 3;
    rect(g, mortar, X, yy + 2, TS, 1);
    const off = (r + ty) % 2 ? 0 : 3;
    for (let c = 0; c < 3; c++) { const xx = off + c * 6; if (xx < TS) rect(g, mortar, X + xx, yy, 1, 2); }
  }
  rect(g, foot, X, Y + TS - 2, TS, 2);
}
function drawWindow(g, X, Y, tx, ty, lit, tv) {
  drawBrick(g, X, Y, tx, ty);
  rect(g, '#3a3644', X + 1, Y + 1, 10, 9);
  rect(g, lit ? (tv ? '#8fb6ff' : '#ffd77a') : '#283150', X + 2, Y + 2, 8, 7);
  if (lit) rect(g, tv ? '#c8dcff' : '#fff1bf', X + 2, Y + 2, 3, 2);
  // 鐵窗
  for (let i = 0; i < 4; i++) rect(g, '#5d6274', X + 2 + i * 2 + 1, Y + 1, 1, 9);
  rect(g, '#5d6274', X + 1, Y + 5, 10, 1);
  rect(g, '#7a8094', X + 1, Y + 1, 10, 1);
}
function drawDarkWindow(g, X, Y, tx, ty) {
  drawBrick(g, X, Y, tx, ty, '#a88f78', '#8a705c', '#6a5446');
  rect(g, '#3a3644', X + 1, Y + 1, 10, 9);
  rect(g, '#1c2034', X + 2, Y + 2, 8, 7);
  rect(g, '#7a5a3a', X + 1, Y + 3, 10, 2); rect(g, '#6a4a2e', X + 1, Y + 7, 10, 2);
}
function drawDoor(g, X, Y, tx, ty) {
  drawBrick(g, X, Y, tx, ty);
  rect(g, '#3a2a2e', X + 1, Y, 10, TS);
  rect(g, '#b8323c', X + 2, Y + 1, 8, TS - 1);
  rect(g, '#d2474f', X + 3, Y + 2, 6, 3); rect(g, '#d2474f', X + 3, Y + 6, 6, 4);
  rect(g, '#ffd84d', X + 8, Y + 6, 1, 2);
}
function drawShopRoof(g, X, Y, tx, ty, map) {
  rect(g, '#b5584b', X, Y, TS, TS);
  for (let yy = 2; yy < TS; yy += 4) rect(g, '#934339', X, Y + yy, TS, 1);
  for (let yy = 0; yy < TS; yy += 4) rect(g, '#c96a5c', X + ((yy / 4 + tx) % 2 ? 1 : 7), Y + yy, 3, 1);
  if (map.at(tx, ty + 1) !== 's') {
    // 遮雨棚
    for (let i = 0; i < TS; i++) rect(g, ((i + tx * TS) >> 2) % 2 ? '#ff8fae' : '#fff3f0', X + i, Y + 6, 1, 6);
    rect(g, '#d06a86', X, Y + 11, TS, 1);
    for (let i = 0; i < TS; i += 4) rect(g, '#ff8fae', X + i + 1, Y + 12 - 1, 2, 1);
  }
  if (map.at(tx, ty - 1) !== 's') rect(g, '#d47466', X, Y, TS, 1);
}
function drawShopWall(g, X, Y, tx, ty) {
  rect(g, '#efe3cf', X, Y, TS, TS);
  rect(g, '#5aa36a', X, Y + TS - 3, TS, 3);
  rect(g, '#dfd1ba', X, Y + 2, TS, 1);
}
function drawShopWindow(g, X, Y, tx, ty) {
  drawShopWall(g, X, Y, tx, ty);
  rect(g, '#4a7a5a', X, Y + 1, TS, 8);
  rect(g, '#9fd4e8', X + 1, Y + 2, 10, 6);
  rect(g, '#cdeaf4', X + 2, Y + 2, 3, 2);
  rect(g, '#8e8e9e', X + 1, Y + 7, 10, 1);
  rect(g, '#8a6a3a', X + 3, Y + 5, 2, 2); rect(g, '#7d8a5a', X + 4, Y + 4, 1, 1);
}
function drawShopDoor(g, X, Y) {
  rect(g, '#efe3cf', X, Y, TS, TS);
  rect(g, '#4a7a5a', X + 1, Y, 10, TS);
  rect(g, '#9fd4e8', X + 2, Y + 1, 8, TS - 1);
  rect(g, '#cdeaf4', X + 3, Y + 2, 2, 5);
  rect(g, '#ffd84d', X + 8, Y + 6, 1, 2);
  rect(g, '#fff', X + 3, Y + 4, 6, 3); rect(g, '#d0476a', X + 4, Y + 5, 4, 1);
}
function drawCatFlap(g, X, Y, tx, ty) {
  drawShopWall(g, X, Y, tx, ty);
  rect(g, '#3a2e2a', X + 3, Y + 5, 6, 7);
  rect(g, '#7d5a3e', X + 4, Y + 6, 4, 6);
  rect(g, '#9a7552', X + 4, Y + 6, 4, 1);
  rect(g, '#ffd84d', X + 5, Y + 2, 2, 2);
}
function groundAt(map, tx, ty) {
  // 柵欄、草叢、路燈底下的地面：看鄰居決定
  const cand = [map.at(tx - 1, ty), map.at(tx + 1, ty), map.at(tx, ty + 1), map.at(tx, ty - 1)];
  if (cand.includes(',')) return ',';
  if (cand.includes('~')) return '~';
  if (cand.filter(c => c === '"').length >= 2) return '"';
  return '.';
}
function drawGround(g, kind, X, Y, tx, ty) {
  if (kind === ',') drawYard(g, X, Y, tx, ty);
  else if (kind === '"') drawGrass(g, X, Y, tx, ty);
  else if (kind === '~') drawLawn(g, X, Y, tx, ty);
  else if (kind === 'F') drawFloor(g, X, Y, tx, ty);
  else drawAsphalt(g, X, Y, tx, ty);
}
function drawFence(g, X, Y, tx, ty, map, gap) {
  const isF = c => c === 'f' || c === 'g';
  const vert = isF(map.at(tx, ty - 1)) || isF(map.at(tx, ty + 1));
  const horiz = isF(map.at(tx - 1, ty)) || isF(map.at(tx + 1, ty));
  drawGround(g, groundAt(map, tx, ty), X, Y, tx, ty);
  const bar = '#2a2d3c', hi = '#62677e';
  if (horiz && !vert || (horiz && vert && !gap && map.at(tx, ty + 1) !== 'f' && map.at(tx, ty + 1) !== 'g')) {
    rect(g, 'rgba(0,0,0,0.25)', X, Y + 10, TS, 2);
    rect(g, bar, X, Y + 2, TS, 1); rect(g, hi, X, Y + 1, TS, 1);
    for (let i = 0; i < TS; i += 3) { if (gap && i > 2 && i < 9) continue; rect(g, bar, X + i, Y + 2, 1, 8); }
    rect(g, bar, X, Y + 9, TS, 1);
  } else {
    rect(g, 'rgba(0,0,0,0.25)', X + 7, Y, 2, TS);
    if (gap) {
      rect(g, bar, X + 5, Y, 2, 2); rect(g, hi, X + 5, Y, 1, 2);
      rect(g, bar, X + 5, Y + 10, 2, 2); rect(g, hi, X + 5, Y + 10, 1, 2);
      rect(g, bar, X + 3, Y + 2, 1, 2); rect(g, bar, X + 8, Y + 9, 1, 1);
    } else {
      rect(g, bar, X + 5, Y, 2, TS); rect(g, hi, X + 5, Y, 1, TS);
      for (let i = 1; i < TS; i += 3) rect(g, bar, X + 4, Y + i, 4, 1);
    }
  }
}
function drawHighWall(g, X, Y, tx, ty) {
  rect(g, '#7c3c36', X, Y, TS, TS);
  for (let r = 0; r < 4; r++) {
    rect(g, '#5e2a26', X, Y + r * 3 + 2, TS, 1);
    const off = (r + tx) % 2 ? 1 : 5;
    rect(g, '#5e2a26', X + off, Y + r * 3, 1, 2); rect(g, '#5e2a26', X + off + 6, Y + r * 3, 1, 2);
  }
  rect(g, '#8a8a9a', X, Y, TS, 2);
  // 牆頭碎玻璃
  for (let i = 0; i < 4; i++) rect(g, ['#9fe0c8', '#d0f0ff', '#7fc8a8'][i % 3], X + 1 + i * 3, Y - 1 + (i % 2), 1, 2);
}
function drawGlass(g, X, Y, tx, ty, map) {
  drawGround(g, 'o', X, Y, tx, ty);
  const isG = c => c === 'G';
  rect(g, 'rgba(170,225,255,0.35)', X, Y, TS, TS);
  const vert = isG(map.at(tx, ty - 1)) || isG(map.at(tx, ty + 1));
  const horiz = isG(map.at(tx - 1, ty)) || isG(map.at(tx + 1, ty));
  rect(g, '#d6f1fa', X, Y, 1, TS); rect(g, '#d6f1fa', X, Y, TS, 1);
  if (horiz) { rect(g, '#bfe6f2', X, Y + 6, TS, 1); }
  if (vert) { rect(g, '#bfe6f2', X + 6, Y, 1, TS); }
  rect(g, '#ffffff', X + 2, Y + 2, 2, 1);
}
function drawGravel(g, X, Y, tx, ty) {
  rect(g, '#b8b2a4', X, Y, TS, TS);
  speckle(g, X, Y, tx, ty, ['#a49e90', '#cbc5b6', '#9a9486'], 12);
}
function drawFloor(g, X, Y, tx, ty) {
  rect(g, '#c99a69', X, Y, TS, TS);
  rect(g, '#b4875a', X, Y + 3, TS, 1); rect(g, '#b4875a', X, Y + 7, TS, 1); rect(g, '#b4875a', X, Y + 11, TS, 1);
  const o = (tx * 5 + ty * 3) % TS;
  rect(g, '#a77c52', X + o, Y, 1, 3); rect(g, '#a77c52', X + ((o + 6) % TS), Y + 4, 1, 3); rect(g, '#a77c52', X + ((o + 3) % TS), Y + 8, 1, 3);
  speckle(g, X, Y, tx, ty, ['#d4a776'], 3);
}
function drawShopInnerWall(g, X, Y, tx, ty, map) {
  rect(g, '#f2e8d6', X, Y, TS, TS);
  for (let i = 0; i < TS; i += 4) rect(g, '#cfe3c8', X + i + ((tx % 2) ? 0 : 2), Y, 1, TS);
  if (map.at(tx, ty + 1) !== 'T' && map.at(tx, ty + 1) !== 'k') { rect(g, '#b08a62', X, Y + TS - 2, TS, 2); }
  if (map.at(tx, ty - 1) === 'X') rect(g, '#d8c8ac', X, Y, TS, 2);
  // 牆上掛畫
  if (ty === 1 && (tx === 3 || tx === 11)) { rect(g, '#8a6a4a', X + 2, Y + 3, 8, 7); rect(g, '#fff6e6', X + 3, Y + 4, 6, 5); rect(g, '#ff8fae', X + 5, Y + 5, 2, 2); rect(g, '#62c35f', X + 5, Y + 7, 2, 1); }
}
function drawShelf(g, X, Y, tx, ty) {
  drawFloor(g, X, Y, tx, ty);
  rect(g, '#8a5e3c', X, Y, TS, 9);
  rect(g, '#a77650', X, Y, TS, 2);
  rect(g, '#6a452c', X, Y + 8, TS, 1);
  const k = Math.floor(hash(tx, ty, 3) * 3);
  const col = ['#ff94ab', '#ffd84d', '#d83aa2'][k];
  rect(g, '#b3c4d6', X + 2, Y + 4, 3, 4); rect(g, '#b3c4d6', X + 7, Y + 4, 3, 4);
  rect(g, '#62c35f', X + 3, Y + 2, 1, 2); rect(g, '#62c35f', X + 8, Y + 2, 1, 2);
  rect(g, col, X + 2, Y + 1, 3, 2); rect(g, col, X + 7, Y + 1, 3, 2);
}
function drawCounter(g, X, Y, tx, ty, map) {
  drawFloor(g, X, Y, tx, ty);
  rect(g, '#7a4f33', X, Y + 2, TS, 10);
  rect(g, '#b07a4e', X, Y, TS, 4);
  rect(g, '#c99266', X, Y, TS, 1);
  rect(g, '#5e3a24', X, Y + TS - 1, TS, 1);
  if (tx === 12) { rect(g, '#3a3a4a', X + 2, Y - 3, 8, 5); rect(g, '#6a6a7a', X + 3, Y - 2, 6, 2); rect(g, '#9fe0a0', X + 4, Y - 2, 3, 1); }
}
function drawBackDoor(g, X, Y, tx, ty) {
  rect(g, '#f2e8d6', X, Y, TS, TS);
  rect(g, '#6a452c', X + 1, Y + 1, 10, TS - 1);
  rect(g, '#8a5e3c', X + 2, Y + 2, 8, TS - 2);
  rect(g, '#ffd84d', X + 8, Y + 7, 1, 1);
}
function drawFrontWindow(g, X, Y, tx, ty) {
  rect(g, '#5aa36a', X, Y, TS, TS);
  rect(g, '#9fd4e8', X + 1, Y + 1, 10, 8);
  rect(g, '#d5eef6', X + 2, Y + 2, 3, 3);
  rect(g, '#3f7a4c', X, Y + 9, TS, 3);
}
function drawFrontDoor(g, X, Y) {
  rect(g, '#5aa36a', X, Y, TS, TS);
  rect(g, '#b8e2ee', X + 1, Y, 10, TS);
  rect(g, '#e2f4fa', X + 2, Y + 1, 2, 7);
  rect(g, '#3f7a4c', X + 1, Y + 5, 10, 1);
}
function drawMat(g, X, Y, tx, ty) {
  drawFloor(g, X, Y, tx, ty);
  rect(g, '#7a4a5a', X, Y + 1, TS, 10);
  rect(g, '#9a5a6e', X, Y + 2, TS, 1); rect(g, '#9a5a6e', X, Y + 9, TS, 1);
}

function drawTile(g, map, tx, ty) {
  const ch = map.at(tx, ty);
  const X = tx * TS, Y = ty * TS;
  switch (ch) {
    case '.': return drawAsphalt(g, X, Y, tx, ty);
    case ',': return drawYard(g, X, Y, tx, ty);
    case '"': return drawGrass(g, X, Y, tx, ty);
    case 'b': return drawGround(g, groundAt(map, tx, ty), X, Y, tx, ty);
    case '~': return drawLawn(g, X, Y, tx, ty);
    case 'o': return drawGravel(g, X, Y, tx, ty);
    case 'R': return drawRoof(g, X, Y, tx, ty, map, 'R');
    case 'M': return drawRoof(g, X, Y, tx, ty, map, 'M');
    case '#': return drawBrick(g, X, Y, tx, ty);
    case 'W': return drawWindow(g, X, Y, tx, ty, false);
    case 'w': return drawDarkWindow(g, X, Y, tx, ty);
    case 'D': return drawDoor(g, X, Y, tx, ty);
    case 's': return drawShopRoof(g, X, Y, tx, ty, map);
    case 'S': return drawShopWall(g, X, Y, tx, ty);
    case 'Q': return drawShopWindow(g, X, Y, tx, ty);
    case 'E': return drawShopDoor(g, X, Y);
    case 'C': return drawCatFlap(g, X, Y, tx, ty);
    case 'f': return drawFence(g, X, Y, tx, ty, map, false);
    case 'g': return drawFence(g, X, Y, tx, ty, map, true);
    case 'L': return drawGround(g, groundAt(map, tx, ty), X, Y, tx, ty);
    case 'H': return drawHighWall(g, X, Y, tx, ty);
    case 'G': return drawGlass(g, X, Y, tx, ty, map);
    case 'F': return drawFloor(g, X, Y, tx, ty);
    case 'T': return drawShopInnerWall(g, X, Y, tx, ty, map);
    case 'h': return drawShelf(g, X, Y, tx, ty);
    case 'n': return drawCounter(g, X, Y, tx, ty, map);
    case 'k': return drawBackDoor(g, X, Y, tx, ty);
    case 'q': return drawFrontWindow(g, X, Y, tx, ty);
    case 'e': return drawFrontDoor(g, X, Y);
    case 'r': return drawMat(g, X, Y, tx, ty);
    default: return drawVoid(g, X, Y, tx, ty);
  }
}

function renderMap(map) {
  const cv = document.createElement('canvas');
  cv.width = map.pw; cv.height = map.ph;
  const g = cv.getContext('2d');
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) drawTile(g, map, tx, ty);
  return cv;
}

// 用來在場上畫草叢（蓋在貓上面）
function makeBushSprite(seed) {
  const cv = document.createElement('canvas');
  cv.width = 14; cv.height = 13;
  const g = cv.getContext('2d');
  const blobs = [[7, 7, 6], [4, 8, 4], [10, 8, 4], [7, 4, 4]];
  const dark = '#24563a', mid = '#2f7046', lite = '#46955a';
  for (const [x, y, r] of blobs) { g.fillStyle = dark; g.beginPath(); g.arc(x, y, r + 0.5, 0, Math.PI * 2); g.fill(); }
  for (const [x, y, r] of blobs) { g.fillStyle = mid; g.beginPath(); g.arc(x - 0.5, y - 0.5, r - 0.5, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = lite;
  for (let i = 0; i < 7; i++) g.fillRect(2 + Math.floor(hash(seed, i, 4) * 10), 2 + Math.floor(hash(seed, i, 5) * 7), 1, 1);
  g.fillStyle = '#1d1526';
  g.fillRect(2, 12, 10, 1);
  // 像素化
  const img = g.getImageData(0, 0, 14, 13);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0;
  g.putImageData(img, 0, 0);
  return cv;
}
function makeLampSprite() {
  const rows = [
    '.YYYY.',
    'YyyyyY',
    '.IIII.',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '..ii..',
    '.iiii.',
  ];
  return buildSprite(rows, PAL);
}
function makeCamPole() {
  const rows = [];
  for (let i = 0; i < 16; i++) rows.push('..ii..');
  rows.push('.iiii.');
  return buildSprite(rows, PAL);
}
