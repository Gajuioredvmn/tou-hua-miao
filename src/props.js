// ================= 卡通道具：盆花、草叢、機車、垃圾桶、水桶花、小花、監視器、情報泡泡 =================
const PC = {
  pot: '#c9744d', potD: '#9a5236', potL: '#e3956a', leaf: '#5aa652', leafD: '#3a7a3c', leafL: '#86c96a', stem: '#4f8a3c',
};
function drawPotBase(kind = 'clay', w = 20) {
  if (kind === 'white') {
    O.blobO([[-w / 2 + 1, -10], [w / 2 - 1, -10], [w / 2 - 3, -1], [-w / 2 + 3, -1]], '#f2f0f6');
    O.e(2, -6, 3, 3, '#dcd8e6');
    O.blobO([[-w / 2 - 0.5, -12.5], [w / 2 + 0.5, -12.5], [w / 2 + 0.5, -9.5], [-w / 2 - 0.5, -9.5]], '#ffffff');
    return;
  }
  O.p([[-w / 2 + 1, -10.5], [w / 2 - 1, -10.5], [w / 2 - 3.4, -1], [-w / 2 + 3.4, -1]], CM.ink);
  O.p([[-w / 2 + 2, -10], [w / 2 - 2, -10], [w / 2 - 4, -1.8], [-w / 2 + 4, -1.8]], PC.pot, { part: 9 });
  O.e(w * 0.22, -5, w * 0.18, 5, PC.potD, { only: 9 });
  O.blobO([[-w / 2 - 0.5, -13.4], [w / 2 + 0.5, -13.4], [w / 2 + 0.6, -9.8], [-w / 2 - 0.6, -9.8]], PC.potL);
}
function leafBall(x, y, rx, ry, col = PC.leaf, dark = PC.leafD) {
  O.eo(x, y, rx, ry, col, { part: 10 });
  O.e(x + rx * 0.25, y + ry * 0.35, rx * 0.8, ry * 0.55, dark, { only: 10 });
  O.e(x - rx * 0.3, y - ry * 0.35, rx * 0.45, ry * 0.3, PC.leafL, { only: 10 });
}
function flower5(x, y, r, col, center, rot = 0) {
  for (let i = 0; i < 5; i++) { const a = rot + i * Math.PI * 2 / 5; O.eo(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, r * 0.8, col); }
  O.dot(x, y, r * 0.55, center);
}
function rose(x, y, r) {
  O.eo(x, y, r, r * 0.92, '#e8394d', { part: 11 });
  O.e(x + r * 0.3, y + r * 0.35, r * 0.7, r * 0.5, '#b8243a', { only: 11 });
  O.curve([[x - r * 0.5, y - r * 0.1], [x, y - r * 0.5], [x + r * 0.45, y - r * 0.05], [x, y + r * 0.3]], '#8f1a2c', 0.9);
}
function drawPlant(t) {
  if (HEAD2[t]) { drawPlant2(t); return; }
  if (t === 'orchid' || t === 'orchidStub') {
    // 白色盆 + 弧形花梗 + 白色蝴蝶蘭
    for (const [a, l] of [[-0.7, 9], [0.6, 8], [-0.1, 7]]) O.blobO([[0, -12], [Math.sin(a) * l * 1.3 - 2, -12 - Math.cos(a) * 3], [Math.sin(a) * l * 1.4, -12 - Math.cos(a) * 4.5], [Math.sin(a) * l * 1.3 + 2, -12 - Math.cos(a) * 3]], PC.leaf);
    drawPotBase('white', 18);
    if (t === 'orchid') {
      O.curve([[1, -14], [3, -24], [7, -31], [12, -32]], CM.ink, 2.4); O.curve([[1, -14], [3, -24], [7, -31], [12, -32]], PC.stem, 1.2);
      for (const [x, y, s] of [[3, -24, 1], [7.5, -29.5, 1.05], [12.5, -31, 0.9], [-1, -19, 0.85]]) {
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; O.eo(x + Math.cos(a) * 2.6 * s, y + Math.sin(a) * 2.4 * s, 2.4 * s, 2.1 * s, '#fbf6ff'); }
        O.e(x, y + 0.6, 1.2 * s, 1.4 * s, '#e05a9c'); O.dot(x, y - 0.2, 0.5, '#ffd84d');
      }
    }
    return;
  }
  // 植物在盆子後面
  if (t === 'rose') {
    O.curve([[-2, -12], [-4, -20]], PC.stem, 1.4); O.curve([[2, -12], [5, -21]], PC.stem, 1.4);
    leafBall(-5, -17, 5.5, 4.5); leafBall(5, -18, 5.5, 4.6); leafBall(0, -21, 5.5, 4.4);
    rose(-5.5, -22.5, 3.2); rose(4.8, -23.5, 3.4); rose(0, -27, 3.1); rose(-1.5, -18.5, 2.5);
  } else if (t === 'jasmine') {
    leafBall(-5, -17, 6, 5); leafBall(5, -17.5, 6, 5); leafBall(0, -23, 6.5, 5.5);
    for (const [x, y] of [[-6, -20], [-2, -26], [4, -24], [7, -19], [0, -19], [-4, -15], [3, -28]]) {
      for (let i = 0; i < 5; i++) { const a = i * 1.257; O.e(x + Math.cos(a) * 1.4, y + Math.sin(a) * 1.4, 1.2, 1.2, '#ffffff'); }
      O.dot(x, y, 0.6, '#ffe48a');
    }
  } else if (t === 'periwinkle') {
    leafBall(-4.5, -15.5, 5.5, 4); leafBall(4.5, -16, 5.5, 4.2); leafBall(0, -19.5, 5.5, 4.2);
    flower5(-5, -18.5, 1.8, '#ff9fcb', '#d9466e', 0.3); flower5(4, -20.5, 1.9, '#ff9fcb', '#d9466e', 1); flower5(0, -23, 1.8, '#ffc0dc', '#d9466e', 0.6); flower5(6, -15.5, 1.6, '#ff9fcb', '#d9466e', 0);
  } else if (t === 'bougain') {
    O.curve([[0, -12], [-1, -18], [-5, -24]], '#7a5232', 1.8); O.curve([[0, -14], [3, -20], [6, -25]], '#7a5232', 1.8);
    leafBall(-4, -19, 5, 4); leafBall(4, -21, 5, 4);
    for (const [x, y, r] of [[-6, -24, 3.6], [6, -26, 3.8], [0, -28, 3.6], [-1, -21, 3], [7, -19, 2.8], [-7, -18, 2.6]]) {
      O.eo(x, y, r, r * 0.85, '#d83aa2', { part: 12 }); O.e(x + r * 0.3, y + r * 0.3, r * 0.6, r * 0.45, '#9e2276', { only: 12 });
      O.dot(x - r * 0.25, y - r * 0.3, r * 0.25, '#ff8fd2');
    }
  } else if (t === 'tanhuaBud' || t === 'tanhua' || t === 'tanhuaDead') {
    // 曇花：扁平的葉狀莖
    for (const [a, l] of [[-0.9, 13], [-0.35, 16], [0.3, 15], [0.85, 12]]) {
      const ex = Math.sin(a) * l, ey = -12 - Math.cos(a) * l;
      O.blobO([[0, -12], [ex * 0.5 - 2.5, (ey - 12) / 2 - 1], [ex, ey], [ex * 0.5 + 2.5, (ey - 12) / 2 + 1]], PC.leaf);
      O.curve([[0, -12], [ex, ey]], PC.leafD, 0.8);
    }
    if (t === 'tanhuaBud') {
      O.curve([[3, -20], [8, -24], [11, -21]], PC.stem, 1.2);
      O.blobO([[10, -22], [13, -19.5], [12.5, -15], [10, -16.5]], '#f6e9e2'); O.e(12, -16.4, 1.4, 1.2, '#ff8fae');
    } else if (t === 'tanhua') {
      O.curve([[3, -20], [7, -26], [9, -28]], PC.stem, 1.2);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; O.eo(9 + Math.cos(a) * 4.2, -29 + Math.sin(a) * 3.6, 3.2, 1.7, '#ffffff', { rot: a }); }
      O.eo(9, -29, 3.4, 3, '#fffbe8'); for (let i = 0; i < 6; i++) O.dot(9 + Math.cos(i) * 1.6, -29 + Math.sin(i) * 1.4, 0.55, '#ffd84d');
    } else {
      O.curve([[3, -20], [8, -23], [10, -19]], '#8a7a52', 1.2);
      O.blobO([[9, -20], [12, -18], [11, -13], [8.5, -15]], '#a07a5a'); O.blobO([[8.6, -15], [10.6, -12], [9, -11]], '#8a6a4a');
    }
  } else if (t === 'lily') {
    O.curve([[-1, -12], [-2, -26]], PC.stem, 1.4); O.curve([[2, -12], [4, -24]], PC.stem, 1.4);
    O.blobO([[-1, -14], [-6, -18], [-4, -15]], PC.leaf); O.blobO([[2, -15], [7, -19], [5, -15.5]], PC.leaf);
    const lily = (x, y, d) => {
      O.blobO([[x, y], [x + d * 7, y - 4.5], [x + d * 8.5, y - 1], [x + d * 7, y + 3.5]], '#ffffff');
      O.curve([[x + d * 2, y], [x + d * 7.5, y - 0.6]], '#e8d8f0', 0.9);
      O.dot(x + d * 8.6, y - 2.6, 0.9, '#ff8a2a'); O.dot(x + d * 8.8, y + 0.4, 0.9, '#ff8a2a');
    };
    lily(-2, -26, -1); lily(4, -24, 1);
  } else if (t === 'stub') {
    O.curve([[-3, -12], [-3.5, -16]], PC.stem, 1.6); O.curve([[1, -12], [1.5, -17]], PC.stem, 1.6); O.curve([[4, -12], [5, -15]], PC.stem, 1.6);
    O.blobO([[-3.5, -14], [-7, -16], [-4, -13]], PC.leaf);
  }
  drawPotBase('clay', 20);
}
function toonPot(t) { return toonFrameInfo(toonFrame('pot-' + t, 34, 38, () => drawPlant(t)), false, 0.5, 0.95); }

// 草叢
function drawBush(k) {
  const R = rng(k * 17 + 3);
  const blobs = [[-9, -9, 9, 7.5], [9, -9, 9, 7.5], [0, -14, 10, 8.5], [-3, -7, 9, 6.5], [5, -6.5, 8.5, 6]];
  for (const [x, y, rx, ry] of blobs) O.e(x, y, rx + 1.2, ry + 1.2, CM.ink);
  for (const [x, y, rx, ry] of blobs) O.e(x, y, rx, ry, '#3f8f4c', { part: 13 });
  for (const [x, y, rx, ry] of blobs) O.e(x + 1, y + ry * 0.45, rx * 0.85, ry * 0.5, '#2c6a3c', { only: 13 });
  for (const [x, y, rx, ry] of blobs) O.e(x - rx * 0.25, y - ry * 0.4, rx * 0.5, ry * 0.32, '#62b066', { only: 13 });
  for (let i = 0; i < 14; i++) { const x = (R() - 0.5) * 30, y = -4 - R() * 18; O.curve([[x - 1.4, y + 0.8], [x, y - 0.8], [x + 1.4, y + 0.8]], '#7cc874', 1, { only: 13 }); }
  if (k % 3 === 1) for (let i = 0; i < 5; i++) { const x = (R() - 0.5) * 24, y = -8 - R() * 12; flower5(x, y, 1.1, '#fff4f0', '#ffd84d', R() * 3); }
  if (k % 3 === 2) for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * 24, y = -8 - R() * 12; O.dot(x, y, 1.3, '#ff6a8a'); }
}
function toonBush(k) { return toonFrameInfo(toonFrame('bush-' + k, 44, 26, () => drawBush(k)), false, 0.5, 1.05); }

// 機車（台灣巷子的靈魂）
const SCOOTER_COL = ['#e8394d', '#4f86d6', '#5fc2a4'];
function drawScooter(ci) {
  const col = SCOOTER_COL[ci % 3], colD = shade(col, -0.25);
  // 輪子
  for (const x of [-12, 11]) { O.eo(x, -4.6, 4.6, 4.6, '#2a2a36'); O.e(x, -4.6, 2, 2, '#b8bcc8'); }
  // 車身
  O.blobO([[-17, -9], [-15, -15], [-5, -17], [2, -13], [5, -8], [9, -9], [13, -11], [14, -7], [10, -5], [-14, -5]], col, { part: 14 });
  O.e(-6, -8, 9, 3, colD, { only: 14 });
  // 座墊
  O.blobO([[-14, -16], [-3, -18.5], [0, -16.5], [-12, -14.5]], '#2f2a35');
  // 龍頭
  O.limb(10, -10, 13, -21, 2.6, '#55596a');
  O.blobO([[9, -21], [17, -22.5], [17.5, -20], [10, -19]], col);
  O.limb(12, -23, 15.5, -24, 1.8, '#2a2a36');
  O.eo(17.6, -20.6, 1.8, 1.6, '#fff6c0');
  // 腳踏板
  O.blobO([[-4, -8], [7, -8], [8, -6], [-4, -6]], '#3a3a48');
  // 後照鏡
  O.curve([[13, -23], [11, -27]], '#2a2a36', 1); O.e(11, -27.5, 1.6, 1.1, '#cfe6ff');
}
function toonScooter(ci, alarm) { return toonFrameInfo(toonFrame('scooter-' + ci, 40, 30, () => drawScooter(ci)), false, 0.5, 1.05); }
// 外送機車：後座綁著裝滿花的箱子
function toonDelivery() {
  return toonFrameInfo(toonFrame('scooter-delivery', 40, 40, () => {
    drawScooter(2);
    O.blobO([[-17, -17], [-5, -17], [-5, -27], [-17, -27]], '#c9965c');
    O.limb(-17, -22, -5, -22, 1.2, '#a8743f', { noOutline: true });
    for (const [x, col] of [[-15, '#e8394d'], [-11, '#ffd84d'], [-7.5, '#ff9fcb']]) { O.curve([[x, -27], [x, -31]], PC.stem, 1.2); flower5(x, -32, 1.6, col, '#fff4c0'); }
    O.blobO([[-16, -25], [-6, -25], [-6, -19], [-16, -19]], '#fff6e8');
    O.e(-11, -22, 2.2, 2, '#ff8fae');
  }), false, 0.5, 1.05);
}

// 垃圾桶
function drawTrash(down) {
  if (!down) {
    O.blobO([[-6.5, -17], [6.5, -17], [5.6, -1.5], [-5.6, -1.5]], '#3f9a6a', { part: 15 });
    O.e(3, -9, 2.5, 7, '#2e7a50', { only: 15 });
    for (const x of [-3, 0, 3]) O.curve([[x, -15], [x * 0.9, -3]], '#2e7a50', 0.9, { only: 15 });
    O.blobO([[-7.6, -20], [7.6, -20], [7.4, -16.6], [-7.4, -16.6]], '#4fb07c');
    O.e(0, -21, 2.4, 1.1, '#2e7a50');
  } else {
    // 倒下來：垃圾散一地
    O.blobO([[-14, -4], [-12, -12], [3, -13], [4, -2], [-12, -1.5]], '#3f9a6a', { part: 15 });
    O.e(-5, -4, 8, 2, '#2e7a50', { only: 15 });
    O.blobO([[4, -13.5], [6.5, -14], [7, -1.5], [4.5, -1.5]], '#4fb07c');
    O.eo(-15, -6, 2.4, 3.6, '#1f3a2a');
    O.blobO([[9, -3], [12, -6], [14, -4], [12.5, -1.5]], '#ffd84d'); O.curve([[11, -5.6], [12.6, -7.6]], '#8a6a2a', 1);
    O.eo(14.5, -2, 2.6, 1.4, '#e8e8f0'); O.eo(-17, -2, 2.2, 1.2, '#c9b48a');
    O.blobO([[7, -2], [9, -4], [10, -1.5]], '#f4f4f4');
  }
}
function toonTrash(down) { return toonFrameInfo(toonFrame('trash-' + (down ? 1 : 0), 40, 24, () => drawTrash(down)), false, 0.5, 1); }

// 花店的鐵桶花
function drawBucket(t) {
  const bunch = {
    rose: () => { for (const [x, y] of [[-5, -16], [0, -19], [5, -16], [-2, -14], [3, -13]]) rose(x, y, 2.8); },
    jasmine: () => { leafBall(0, -16, 7, 5); for (const [x, y] of [[-4, -17], [0, -20], [4, -17], [2, -14], [-2, -14]]) { O.dot(x, y, 1.4, '#ffffff'); } },
    periwinkle: () => { leafBall(0, -15, 7, 4.5); for (const [x, y] of [[-4, -16], [1, -18], [5, -15]]) flower5(x, y, 1.6, '#ff9fcb', '#d9466e'); },
    bougain: () => { for (const [x, y] of [[-4, -16], [1, -19], [5, -15], [0, -14]]) { O.eo(x, y, 3, 2.6, '#d83aa2'); } },
    tanhua: () => { leafBall(-2, -14, 5, 4); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; O.eo(2 + Math.cos(a) * 3.5, -19 + Math.sin(a) * 3, 2.6, 1.4, '#ffffff', { rot: a }); } O.dot(2, -19, 1.6, '#fffbe8'); },
    orchid: () => { for (const [x, y] of [[-3, -17], [2, -20], [5, -16]]) { for (let i = 0; i < 5; i++) { const a = i * 1.257; O.eo(x + Math.cos(a) * 1.8, y + Math.sin(a) * 1.7, 1.7, 1.5, '#fbf6ff'); } O.dot(x, y + 0.4, 0.9, '#e05a9c'); } },
    wilt: () => { for (const [x, a] of [[-3, -0.5], [1, 0.3], [4, 0.8]]) { O.curve([[x, -10], [x + Math.sin(a) * 3, -16], [x + Math.sin(a) * 7, -15]], '#8a7a52', 1.2); O.eo(x + Math.sin(a) * 7.5, -14.5, 1.8, 1.3, '#a07a6a'); } },
  }[t] || (() => { });
  if (t !== 'empty') { for (const x of [-4, 0, 4]) O.curve([[x * 0.6, -9], [x, -14]], PC.stem, 1.2); bunch(); }
  else { O.e(0, -10.6, 6.2, 1.2, '#7a8aa0'); }
  O.p([[-7.5, -11], [7.5, -11], [6, -1], [-6, -1]], CM.ink);
  O.p([[-6.8, -10.4], [6.8, -10.4], [5.4, -1.7], [-5.4, -1.7]], '#c3ccd8', { part: 16 });
  O.e(3.5, -6, 2.5, 5, '#98a4b4', { only: 16 }); O.e(-3.5, -7, 1.2, 3.5, '#eef2f8', { only: 16 });
  O.limb(-7.5, -10.6, 7.5, -10.6, 1.4, '#e3e8f0', { noOutline: true });
}
function toonBucket(t) { return toonFrameInfo(toonFrame('bucket-' + t, 22, 26, () => drawBucket(t)), false, 0.5, 1.05); }

// 店裡可以撥倒的小盆栽
function drawSmallPot(down) {
  if (!down) {
    O.blobO([[-2, -12], [-5, -16], [-1, -14]], PC.leaf); O.blobO([[1, -13], [4, -17.5], [2.5, -13]], PC.leaf); O.blobO([[0, -12], [0, -18], [1.4, -13]], PC.leafL);
    O.p([[-5.5, -9.5], [5.5, -9.5], [4, -1], [-4, -1]], CM.ink); O.p([[-4.8, -9], [4.8, -9], [3.4, -1.6], [-3.4, -1.6]], '#7fb6d9');
    O.blobO([[-6.2, -11.6], [6.2, -11.6], [6.2, -8.8], [-6.2, -8.8]], '#9fd0ee');
  } else {
    O.blobO([[-8, -2], [-3, -5], [1, -3], [-2, -1]], '#7a5a3a');
    O.p([[0, -9], [8, -6], [6, -1], [-1, -3]], CM.ink); O.p([[0.6, -8.2], [7.2, -5.8], [5.6, -1.8], [-0.2, -3.6]], '#7fb6d9');
    O.blobO([[-6, -4], [-10, -7], [-6.5, -3]], PC.leaf);
  }
}
function toonSmallPot(down) { return toonFrameInfo(toonFrame('spot-' + (down ? 1 : 0), 22, 20, () => drawSmallPot(down)), false, 0.5, 1); }

// 叼在嘴上的小花
function drawSprig(t) {
  O.curve([[0, 0], [1, -6]], CM.ink, 2.6); O.curve([[0, 0], [1, -6]], PC.stem, 1.3);
  O.blobO([[0.6, -3], [-3, -5], [-0.4, -2]], PC.leaf);
  const x = 1, y = -8;
  if (t === 'rose') rose(x, y, 3);
  else if (t === 'jasmine') { for (const [a, b] of [[-2, -1], [1.8, -0.4], [0, 1.6], [0.4, -2.4]]) { for (let i = 0; i < 5; i++) O.e(x + a + Math.cos(i * 1.26) * 1.1, y + b + Math.sin(i * 1.26) * 1.1, 1, 1, '#ffffff'); } }
  else if (t === 'periwinkle') flower5(x, y, 1.9, '#ff9fcb', '#d9466e');
  else if (t === 'bougain') { O.eo(x - 1.5, y, 2.6, 2.2, '#d83aa2'); O.eo(x + 1.8, y - 1, 2.4, 2, '#e85ab8'); }
  else if (t === 'tanhua') { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; O.eo(x + Math.cos(a) * 2.8, y + Math.sin(a) * 2.4, 2.2, 1.2, '#ffffff', { rot: a }); } O.dot(x, y, 1.4, '#fffbe8'); }
  else if (t === 'orchid') { for (let i = 0; i < 5; i++) { const a = i * 1.257 - 1.57; O.eo(x + Math.cos(a) * 2, y + Math.sin(a) * 1.8, 1.9, 1.6, '#fbf6ff'); } O.dot(x, y + 0.4, 1, '#e05a9c'); }
  else if (HEAD2[t]) drawSprig2(t, x, y);
}
function toonSprig(t) { return toonFrameInfo(toonFrame('sprig-' + t, 12, 14, () => drawSprig(t)), false, 0.5, 0.8); }
// 叼著的花：花梗斜斜往前
function toonSprigCarry(t, flip) { return toonFrameInfo(toonFrame('sprigc-' + t, 28, 14, () => { OT.set(1.0); drawSprig(t); OT.set(0); }), flip, 0.5, 0.9); }

// 監視器
function drawCamHead() {
  O.limb(-6, -2, -2, -6, 2.2, '#5a5e6e');
  O.blobO([[-4, -10], [9, -11], [10, -5], [-3, -4]], '#f2f2f6', { part: 17 });
  O.e(2, -5.6, 7, 1.6, '#c8c8d4', { only: 17 });
  O.eo(10.2, -8, 2.2, 2.6, '#2a2a36'); O.dot(10.6, -8.4, 0.9, '#5fa8ff');
}
function toonCamHead() { return toonFrameInfo(toonFrame('camhead', 22, 14, drawCamHead), false, 0.5, 1); }

// 情報泡泡
const BUBBLE_COL = { time: '#ffd25a', flower: '#ff86a8', heart: '#ff5a7a', alert: '#ff9a2b', cat: '#f39a45', rent: '#77d48a', gold: '#ffc83a' };
function drawBubbleIcon(type) {
  const ring = BUBBLE_COL[type] || '#ffd25a';
  O.p([[-2.4, -3], [0, 0.6], [2.6, -3]], CM.ink);
  O.e(0, -13, 11, 11, CM.ink);
  O.e(0, -13, 10, 10, ring);
  O.e(0, -13, 7.6, 7.6, '#fff8ec');
  O.e(-4, -17, 2.2, 1.4, '#ffffff', { rot: -0.6 });
  const y = -13;
  if (type === 'time') { O.eo(0, y, 5, 5, '#ffffff'); O.limb(0, y, 0, y - 3.4, 1.1, CM.ink, { noOutline: true }); O.limb(0, y, 2.6, y + 0.8, 1.1, CM.ink, { noOutline: true }); }
  else if (type === 'flower') { rose(0, y - 0.6, 3.6); O.curve([[0, y + 3], [0, y + 6]], PC.stem, 1.2); }
  else if (type === 'heart') { O.blobO([[0, y + 4], [-5, y - 1], [-3, y - 4.5], [0, y - 2.5], [3, y - 4.5], [5, y - 1]], '#ff6d9a'); }
  else if (type === 'alert') { O.p([[0, y - 6], [6, y + 4.5], [-6, y + 4.5]], CM.ink); O.p([[0, y - 4.4], [4.6, y + 3.6], [-4.6, y + 3.6]], '#ffb02e'); O.limb(0, y - 1.6, 0, y + 1, 1.3, CM.ink, { noOutline: true }); O.dot(0, y + 2.6, 0.7, CM.ink); }
  else if (type === 'cat') { O.p([[-4.6, y - 1], [-3.4, y - 6], [-0.8, y - 2.6]], CM.ink); O.p([[4.6, y - 1], [3.4, y - 6], [0.8, y - 2.6]], CM.ink); O.eo(0, y + 0.6, 4.8, 4, '#f39a45'); O.dot(-1.8, y, 0.8, CM.ink); O.dot(1.8, y, 0.8, CM.ink); O.dot(0, y + 1.6, 0.6, '#d96a7a'); }
  else if (type === 'rent') { O.eo(0, y, 5, 5, '#ffd84d'); O.e(0, y, 3.4, 3.4, '#f0b832'); O.limb(0, y - 2.2, 0, y + 2.2, 1.1, '#a87a10', { noOutline: true }); }
  else if (type === 'gold') { O.e(0, -13, 7.6, 7.6, '#fff1a8'); drawCanIcon2(0, y + 3.5); for (const [sx, sy] of [[-6, -18], [6, -9]]) { O.limb(sx - 1.6, sy, sx + 1.6, sy, 0.9, '#ffffff', { noOutline: true }); O.limb(sx, sy - 1.6, sx, sy + 1.6, 0.9, '#ffffff', { noOutline: true }); } }
}
function toonBubble(type) { return toonFrameInfo(toonFrame('bub-' + type, 26, 26, () => drawBubbleIcon(type)), false, 0.5, 0.95); }

// ---- 介面用的小圖示（向量）----
function drawCanIcon() {
  O.e(0, -4, 9, 3.2, CM.ink); O.p([[-9, -10], [9, -10], [9, -4], [-9, -4]], CM.ink);
  O.e(0, -4.5, 8, 2.4, '#9aa6b8'); O.p([[-8, -10], [8, -10], [8, -4.6], [-8, -4.6]], '#4f8fd6');
  O.p([[-8, -9], [8, -9], [8, -6], [-8, -6]], '#ffd84d');
  O.blobO([[-3.5, -7.5], [1.5, -9], [3.4, -7.5], [1.5, -6], [-3.5, -7.5]], '#ff9a5a'); O.p([[3, -7.5], [5.5, -9.2], [5.5, -5.8]], '#ff9a5a');
  O.e(0, -10.2, 8, 2.6, CM.ink); O.e(0, -10.4, 7.2, 2, '#dfe6f0'); O.e(1.5, -10.6, 2.6, 0.9, '#b4bccb');
}
// 小一號的罐罐（畫在金色泡泡裡）
function drawCanIcon2(x, y) {
  O.e(x, y - 1, 5.4, 1.9, CM.ink); O.p([[x - 5.4, y - 5], [x + 5.4, y - 5], [x + 5.4, y - 1], [x - 5.4, y - 1]], CM.ink);
  O.p([[x - 4.8, y - 5], [x + 4.8, y - 5], [x + 4.8, y - 1.3], [x - 4.8, y - 1.3]], '#4f8fd6');
  O.p([[x - 4.8, y - 4.4], [x + 4.8, y - 4.4], [x + 4.8, y - 2.6], [x - 4.8, y - 2.6]], '#ffd84d');
  O.e(x, y - 5.2, 4.8, 1.5, CM.ink); O.e(x, y - 5.3, 4.3, 1.1, '#dfe6f0');
}
function drawOrangeCatIcon() {
  for (const s of [-1, 1]) { O.p([[s * 3, -12], [s * 8, -19], [s * 9, -9]], CM.ink); O.p([[s * 3.8, -12.2], [s * 7.6, -17.4], [s * 8.2, -10]], '#f39a45'); O.p([[s * 5, -12.6], [s * 7.2, -15.6], [s * 7.5, -11.2]], '#ffb2a0'); }
  O.eo(0, -8, 9.4, 7.6, '#f39a45', { part: 18 });
  for (const x of [-2.5, 0, 2.5]) O.curve([[x, -15], [x * 0.9, -11.5]], '#c96d2b', 1.1, { only: 18 });
  O.e(0, -5, 4.6, 3, '#fff3e6');
  for (const s of [-1, 1]) { O.e(s * 3.6, -8.6, 1.4, 1.9, CM.ink); O.dot(s * 3.6 - 0.4, -9.3, 0.5, '#fff'); }
  O.p([[-1, -6.6], [1, -6.6], [0, -5.6]], '#e06a7a');
  O.curve([[0, -5.6], [-1.2, -4.4]], CM.ink, 0.8); O.curve([[0, -5.6], [1.2, -4.4]], CM.ink, 0.8);
}
function vectorIcons() {
  const out = {};
  for (const k of FLOWER_ORDER) out[k] = toonFrame('icon-' + k, 10, 12.5, () => { OT.set(0); drawSprig(k); }).toDataURL();
  out.can = toonFrame('icon-can', 20, 15, drawCanIcon).toDataURL();
  out.orange = toonFrame('icon-orange', 20, 20, drawOrangeCatIcon).toDataURL();
  return out;
}
