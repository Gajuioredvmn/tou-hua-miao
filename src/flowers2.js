// ================= 新的花：向日葵、繡球花、桔梗、康乃馨、滿天星、桂花、玉蘭花、牡丹 =================
// 每種花都要有：盆栽（夜晚 3D）、叼在嘴上的小花／圖示、花桶裡的花頭、像素版（2D 備援）

// ---- 花頭（花桶、花束、盆栽、小花共用）----
const HEAD2 = {
  sunflower(x, y, s, r) {
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + r; O.eo(x + Math.cos(a) * 2.7 * s, y + Math.sin(a) * 2.5 * s, 1.5 * s, 0.85 * s, i % 2 ? '#ffc61a' : '#ffd84d', { rot: a }); }
    O.eo(x, y, 1.9 * s, 1.8 * s, '#7a4a22'); O.dot(x - 0.5 * s, y - 0.5 * s, 0.6 * s, '#a8723a');
  },
  hydrangea(x, y, s, r) {
    const blue = r > 0.5;
    O.eo(x, y, 3.3 * s, 3 * s, blue ? '#7aa2e8' : '#a58ad8', { part: 30 });
    O.e(x + s, y + s, 2.2 * s, 1.8 * s, blue ? '#5a80c8' : '#8268b8', { only: 30 });
    for (const [dx, dy] of [[-1.6, -1.2], [1, -1.6], [-0.4, 0.4], [1.8, 0.6], [-1.8, 1]]) {
      const cx = x + dx * s, cy = y + dy * s;
      for (let k = 0; k < 4; k++) O.e(cx + Math.cos(k * 1.57 + 0.4) * 0.55 * s, cy + Math.sin(k * 1.57 + 0.4) * 0.55 * s, 0.5 * s, 0.5 * s, blue ? '#bcd2ff' : '#d8c8f6', { only: 30 });
    }
  },
  lisianthus(x, y, s, r) {
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55; O.eo(x + Math.cos(a) * 1.5 * s, y + 0.4 * s + Math.sin(a) * 1.2 * s, 1.6 * s, 1.9 * s, i % 2 ? '#9a6ad0' : '#a97ad8', { rot: a + Math.PI / 2 }); }
    O.e(x, y + 0.8 * s, 1.5 * s, 0.9 * s, '#f2e8fa'); O.dot(x, y + 0.6 * s, 0.45 * s, '#c8e070');
  },
  carnation(x, y, s, r) {
    const col = r > 0.5 ? '#ff7a9a' : '#ff98b0', dk = '#d9587e';
    O.blobO([[x - 2.6 * s, y + 0.6 * s], [x - 2.2 * s, y - 1.4 * s], [x - 1 * s, y - 2.4 * s], [x + 0.6 * s, y - 2.2 * s], [x + 2.2 * s, y - 1.6 * s], [x + 2.7 * s, y + 0.2 * s], [x + 1.6 * s, y + 1.6 * s], [x - 1.4 * s, y + 1.8 * s]], col);
    O.curve([[x - 1.8 * s, y - 0.4 * s], [x - 0.6 * s, y - 1.2 * s], [x + 0.6 * s, y - 0.6 * s], [x + 1.8 * s, y - 1.1 * s]], dk, 0.6);
    O.curve([[x - 1.6 * s, y + 0.8 * s], [x - 0.2 * s, y + 0.2 * s], [x + 1.4 * s, y + 0.7 * s]], dk, 0.6);
  },
  babys(x, y, s, r) {
    for (let j = 0; j < 9; j++) O.dot(x + Math.cos(j * 2.4 + r * 6) * 2.6 * s, y + Math.sin(j * 2.4 + r * 6) * 2 * s, 0.75 * s, '#ffffff');
    for (let j = 0; j < 3; j++) O.dot(x + Math.cos(j * 2.1) * 1.1 * s, y + Math.sin(j * 2.1) * 0.9 * s, 0.6 * s, '#f4f0e6');
  },
  osmanthus(x, y, s, r) {
    O.eo(x - 1 * s, y + 0.6 * s, 2.2 * s, 1.3 * s, '#3f7a40', { rot: -0.4 }); O.eo(x + 1.4 * s, y + 0.2 * s, 2.1 * s, 1.2 * s, '#4a8a48', { rot: 0.5 });
    for (const [dx, dy] of [[-0.8, -1], [0.6, -1.4], [1.6, -0.4], [-1.8, -0.2], [0, -0.2]]) {
      const cx = x + dx * s, cy = y + dy * s;
      for (let k = 0; k < 4; k++) O.e(cx + Math.cos(k * 1.57) * 0.45 * s, cy + Math.sin(k * 1.57) * 0.45 * s, 0.42 * s, 0.42 * s, '#ffa53a');
      O.dot(cx, cy, 0.3 * s, '#e07a14');
    }
  },
  magnolia(x, y, s, r) {
    O.blobO([[x - 0.7 * s, y + 2 * s], [x - 1.5 * s, y - 0.6 * s], [x - 0.4 * s, y - 2.8 * s], [x + 0.3 * s, y - 0.4 * s]], '#fffaf0');
    O.blobO([[x + 0.6 * s, y + 2 * s], [x + 0.2 * s, y - 0.6 * s], [x + 1.2 * s, y - 2.6 * s], [x + 1.6 * s, y - 0.2 * s]], '#fff2da');
    O.blobO([[x - 0.3 * s, y + 2.1 * s], [x - 0.6 * s, y - 1 * s], [x + 0.2 * s, y - 3.1 * s], [x + 0.7 * s, y - 0.8 * s]], '#ffffff');
    O.dot(x - 0.1 * s, y + 1.8 * s, 0.6 * s, '#c8d890');
  },
  peony(x, y, s, r) {
    O.eo(x, y, 3.6 * s, 3.2 * s, '#ff9fc2', { part: 31 });
    O.e(x + 1.2 * s, y + 1.2 * s, 2.4 * s, 1.8 * s, '#e8749c', { only: 31 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + r; O.curve([[x + Math.cos(a) * 1.2 * s, y + Math.sin(a) * 1.1 * s], [x + Math.cos(a + 0.5) * 2.4 * s, y + Math.sin(a + 0.5) * 2.1 * s], [x + Math.cos(a + 0.9) * 2.9 * s, y + Math.sin(a + 0.9) * 2.6 * s]], '#c95a82', 0.6, { only: 31 }); }
    O.eo(x - 0.2 * s, y - 0.3 * s, 1.4 * s, 1.2 * s, '#ffc8dc'); O.dot(x - 0.2 * s, y - 0.3 * s, 0.5 * s, '#ffe08a');
  },
};
const NEW_FLOWERS = Object.keys(HEAD2);
Object.assign(BUNCH, {
  sunflower: { stem: '#5a9a3c', leaf: true, tall: 1.15, head: (x, y, s, r) => HEAD2.sunflower(x, y, s * 1.05, r) },
  hydrangea: { stem: PC.stem, leaf: true, head: HEAD2.hydrangea },
  lisianthus: { stem: PC.stem, leaf: false, head: HEAD2.lisianthus },
  carnation: { stem: '#7aa860', leaf: false, head: HEAD2.carnation },
  babys: { stem: '#7a9a5a', leaf: false, head: HEAD2.babys },
  osmanthus: { stem: '#6b4a3a', leaf: false, head: HEAD2.osmanthus },
  magnolia: { stem: '#6b5a3a', leaf: true, head: HEAD2.magnolia },
  peony: { stem: PC.stem, leaf: true, head: HEAD2.peony },
});

// ---- 盆栽 ----
function drawPlant2(t) {
  const H = HEAD2[t];
  if (t === 'sunflower') {
    O.curve([[-2, -12], [-4, -24], [-5, -30]], CM.ink, 2.8); O.curve([[-2, -12], [-4, -24], [-5, -30]], '#5a9a3c', 1.5);
    O.curve([[2, -12], [4, -21], [6, -25]], CM.ink, 2.8); O.curve([[2, -12], [4, -21], [6, -25]], '#5a9a3c', 1.5);
    for (const [x, y, a] of [[-6, -18, -0.6], [6, -16, 0.6], [-2, -22, -0.3]]) O.eo(x, y, 3.6, 2, '#4f9a4c', { rot: a });
    H(-5, -31, 1.25, 0.2); H(6, -26, 1.05, 0.9);
  } else if (t === 'hydrangea') {
    leafBall(-5, -16, 6, 4.5); leafBall(5, -16.5, 6, 4.5); leafBall(0, -19, 6, 4.4);
    H(-4.5, -21, 1.1, 0.8); H(4.5, -22, 1.05, 0.2); H(0, -25.5, 1.1, 0.9);
  } else if (t === 'lisianthus') {
    for (const [x0, x1, y1] of [[-2, -6, -26], [0, 1, -29], [2, 7, -25]]) { O.curve([[x0, -12], [x1 * 0.7, (y1 - 12) / 2], [x1, y1]], CM.ink, 2.2); O.curve([[x0, -12], [x1 * 0.7, (y1 - 12) / 2], [x1, y1]], PC.stem, 1.1); }
    for (const [x, y, a] of [[-4, -16, -0.7], [4, -17, 0.7], [0, -20, 0]]) O.eo(x, y, 3.2, 1.5, '#5aa652', { rot: a });
    H(-6, -27, 1.05, 0); H(1, -30, 1.1, 0); H(7, -26, 1, 0);
  } else if (t === 'carnation') {
    for (const [x0, x1, y1] of [[-2, -5, -24], [0, 1, -27], [2, 6, -23]]) { O.curve([[x0, -12], [x1 * 0.6, (y1 - 12) / 2], [x1, y1]], CM.ink, 2.2); O.curve([[x0, -12], [x1 * 0.6, (y1 - 12) / 2], [x1, y1]], '#7aa860', 1.1); }
    for (const [x, y, a] of [[-4, -15, -1.1], [4, -16, 1.1], [-1, -18, -0.4], [2, -19, 0.5]]) O.eo(x, y, 3.4, 0.9, '#8ab878', { rot: a });
    H(-5, -25, 1.05, 0.9); H(1, -28, 1.1, 0.2); H(6, -24, 1, 0.7);
  } else if (t === 'babys') {
    for (let i = 0; i < 6; i++) { const a = -1.1 + i * 0.44; O.curve([[0, -12], [Math.sin(a) * 6, -18], [Math.sin(a) * 10, -22 - Math.cos(a) * 4]], '#7a9a5a', 0.9); }
    for (const [x, y] of [[-8, -22], [-4, -26], [0, -27], [4, -26], [8, -22], [-2, -21], [3, -21]]) HEAD2.babys(x, y, 1.05, x * 0.1);
  } else if (t === 'osmanthus') {
    O.curve([[0, -12], [-2, -20], [-6, -26]], '#6b4a3a', 1.8); O.curve([[0, -13], [3, -21], [7, -25]], '#6b4a3a', 1.8);
    leafBall(-5, -21, 6, 4.6, '#3f7a40', '#2c5a30'); leafBall(5, -22, 6, 4.6, '#3f7a40', '#2c5a30'); leafBall(0, -26, 6, 4.4, '#4a8a48', '#2c5a30');
    for (const [x, y] of [[-6, -24], [4, -25], [0, -29], [-2, -21], [6, -20]]) for (let k = 0; k < 3; k++) O.dot(x + k * 1.3, y + (k % 2) * 1, 0.9, '#ffa53a');
  } else if (t === 'magnolia') {
    O.curve([[0, -12], [-1, -22], [-4, -28]], '#6b5a3a', 1.6); O.curve([[0, -13], [2, -22], [5, -27]], '#6b5a3a', 1.6);
    for (const [x, y, a] of [[-5, -19, -0.9], [5, -18, 0.9], [-2, -24, -0.3], [3, -25, 0.4], [0, -16, 0]]) O.eo(x, y, 4, 1.8, '#4f8a4c', { rot: a });
    H(-4, -29, 1.1, 0); H(5, -28, 1, 0); H(0.5, -24, 0.9, 0);
  } else if (t === 'peony') {
    leafBall(-5, -16, 6, 4.4, '#4f8a4c'); leafBall(5, -16.5, 6, 4.4, '#4f8a4c'); leafBall(0, -19, 5, 4);
    H(-4, -22, 1.05, 0.3); H(4.5, -23, 1, 1.2); O.eo(0, -26, 2.2, 2.6, '#ff9fc2'); O.curve([[-1, -25], [0, -27.5], [1, -25]], '#c95a82', 0.6);
  }
  drawPotBase(t === 'peony' || t === 'magnolia' ? 'white' : 'clay', 20);
}

// ---- 叼在嘴上的小花 ----
function drawSprig2(t, x, y) {
  const H = HEAD2[t];
  if (t === 'sunflower') H(x, y - 0.5, 0.95, 0.2);
  else if (t === 'babys') { H(x, y, 0.85, 0.3); H(x + 1.5, y + 2, 0.6, 0.7); }
  else if (t === 'osmanthus') H(x, y, 0.95, 0);
  else H(x, y, t === 'magnolia' ? 0.85 : 0.82, 0.4);
}

// ---- 像素版（2D 備援）----
Object.assign(PAL, { A: '#a07ad8', a: '#6a44a8', C: '#ff9fc2', c: '#d9587e' });
Object.assign(PLANTS, {
  sunflower: ['..YYY.....', '.YuuuY....', '.YuuuY.YY.', '..YYY.YuY.', '...L..LY..', '..LL.LL...', '...LLL....', '....L.....'],
  hydrangea: ['..QqQ.....', '.QQqQQ.Qq.', '.qQQQqQQQ.', '..QqQQ.Q..', '.LLlLLLL..', '.LlLLlL...', '..LLLL....', '...LL.....'],
  lisianthus: ['.AAa..Aa..', 'AAmAA.AmA.', '.AAa..Aa..', '..L....L..', '..LL..LL..', '...LLLL...', '...LlL....', '....L.....'],
  carnation: ['..NnN.....', '.NNnNN.Nn.', '..NNN.NNN.', '...L...L..', '..LLL.LL..', '...L.LL...', '...LLL....', '....L.....'],
  babys: ['M.M.M.M...', '.M.M.M.M..', 'M.L.M.L.M.', '.L.L.L.L..', '..L.L.L...', '...LLL....', '...LlL....', '....L.....'],
  osmanthus: ['..LXLXL...', '.LXLLLXL..', 'LLlXLXlLL.', '.LXLLlXL..', '..LlXLL...', '...LLL....', '...LlL....', '....L.....'],
  magnolia: ['...M..M...', '..MmM.MM..', '..MMM.Mm..', '...L...L..', '..LlL.LL..', '...LLLL...', '....Ll....', '....L.....'],
  peony: ['..CCcC....', '.CcCCcC...', '.CCcCCC...', '..CCcC.L..', '.LL.LLL...', '..LlLL....', '...LL.....', '....L.....'],
});
Object.assign(ICONS, {
  sunflower: ['.YYY.', 'YuuuY', '.YYY.', '..L..', '..L..'],
  hydrangea: ['QqQ..', 'qQQq.', '.QqQ.', '..L..', '..L..'],
  lisianthus: ['A.A..', 'AmAA.', '.AA..', '..L..', '..L..'],
  carnation: ['NnN..', 'nNNn.', '.NN..', '..L..', '..L..'],
  babys: ['M.M.M', '.M.M.', 'M.L.M', '..L..', '..L..'],
  osmanthus: ['X.X..', 'LXLX.', '.XLX.', '..L..', '..L..'],
  magnolia: ['.M.M.', '.MMM.', '..M..', '..L..', '..L..'],
  peony: ['.CC..', 'CcCC.', 'CCcC.', '.CC..', '..L..'],
});

// ================= 新區域的花：山茶花（隔壁巷）、雞蛋花、荷花（公園）、幽靈蘭（下水道） =================
Object.assign(HEAD2, {
  camellia(x, y, s, r) {
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + r; O.eo(x + Math.cos(a) * 2.2 * s, y + Math.sin(a) * 2 * s, 1.9 * s, 1.6 * s, i % 2 ? '#d8304a' : '#e2425a', { rot: a }); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + r + 0.3; O.e(x + Math.cos(a) * 1 * s, y + Math.sin(a) * 0.9 * s, 1.3 * s, 1.1 * s, '#f0566e'); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; O.dot(x + Math.cos(a) * 0.6 * s, y + Math.sin(a) * 0.6 * s, 0.35 * s, '#ffd84d'); }
  },
  plumeria(x, y, s, r) {
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + r; O.eo(x + Math.cos(a) * 1.7 * s, y + Math.sin(a) * 1.6 * s, 1.9 * s, 1.15 * s, '#fffaf0', { rot: a + 0.5 }); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + r; O.e(x + Math.cos(a) * 0.9 * s, y + Math.sin(a) * 0.85 * s, 0.9 * s, 0.6 * s, '#ffd45a', { rot: a + 0.5 }); }
    O.dot(x, y, 0.55 * s, '#f2a83a');
  },
  lotus(x, y, s, r) {
    for (const [a, col, l] of [[-1.05, '#f08ab0', 2.2], [1.05, '#f08ab0', 2.2], [-0.55, '#f7a6c4', 2.6], [0.55, '#f7a6c4', 2.6], [0, '#ffc8dc', 2.9]]) {
      O.eo(x + Math.sin(a) * l * 0.9 * s, y + 1.2 * s - Math.cos(a) * l * 0.9 * s, 1.25 * s, l * s * 0.85, col, { rot: a });
    }
    O.e(x, y - 1.6 * s, 0.8 * s, 1.4 * s, '#ffe2ec');
    O.dot(x, y + 0.9 * s, 0.7 * s, '#ffe08a');
  },
  ghostorchid(x, y, s, r) {
    O.e(x, y, 4 * s, 3.6 * s, 'rgba(160,240,255,0.25)');
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; O.eo(x + Math.cos(a) * 2.2 * s, y + Math.sin(a) * 2 * s, 1.9 * s, 1.3 * s, i % 2 ? '#e4fbff' : '#f4feff', { rot: a + Math.PI / 2 }); }
    O.curve([[x - 3 * s, y + 2.6 * s], [x - 4.2 * s, y + 4.6 * s]], '#bff4ff', 0.6); O.curve([[x + 3 * s, y + 2.6 * s], [x + 4.2 * s, y + 4.6 * s]], '#bff4ff', 0.6);
    O.e(x, y + 0.5 * s, 1 * s, 1.2 * s, '#7ad8f0'); O.dot(x, y - 0.2 * s, 0.45 * s, '#ffffff');
  },
});
Object.assign(BUNCH, {
  camellia: { stem: '#3f6a3a', leaf: true, head: HEAD2.camellia },
  plumeria: { stem: '#8a7a5a', leaf: true, head: HEAD2.plumeria },
  lotus: { stem: '#5a9a5a', leaf: false, tall: 1.1, head: HEAD2.lotus },
  ghostorchid: { stem: '#7ab8c8', leaf: false, head: HEAD2.ghostorchid },
});
const _drawPlant2Old = drawPlant2;
drawPlant2 = function (t) {
  const H = HEAD2[t];
  if (t === 'camellia') {
    leafBall(-5, -17, 6, 5, '#2f6a3a', '#1f4a2a'); leafBall(5, -17.5, 6, 5, '#2f6a3a', '#1f4a2a'); leafBall(0, -22, 6.5, 5, '#3a7a42', '#1f4a2a');
    H(-5, -20, 1.0, 0.2); H(5, -21, 0.95, 1.1); H(0, -26, 1.05, 0.6); H(-1, -16, 0.8, 2);
    drawPotBase('clay', 20);
  } else if (t === 'plumeria') {
    for (const [x1, y1] of [[-7, -24], [0, -28], [7, -23]]) { O.curve([[0, -12], [x1 * 0.5, (y1 - 12) / 2], [x1, y1]], CM.ink, 3.6); O.curve([[0, -12], [x1 * 0.5, (y1 - 12) / 2], [x1, y1]], '#9a8a6a', 2.2); }
    for (const [x, y] of [[-7, -24], [0, -28], [7, -23]]) for (const a of [-0.9, -0.2, 0.5, 1.2]) O.eo(x + Math.cos(a - 1.57) * 3.4, y + Math.sin(a - 1.57) * 2.4 + 1, 3.6, 1.3, '#4f9a4c', { rot: a - 1.57 });
    H(-7, -25.5, 0.9, 0.3); H(-4.5, -24, 0.8, 1.4); H(0, -30, 0.95, 0.8); H(2.6, -28.5, 0.8, 2); H(7, -24.5, 0.9, 1.1);
    drawPotBase('white', 20);
  } else if (t === 'lotus') {
    O.blobO([[-11, -9], [11, -9], [9, -1], [-9, -1]], '#6a5a7a'); O.e(0, -9, 11, 2.6, '#3a6a8a'); O.e(-3, -9.4, 5, 1.2, '#6aa8c8');
    O.eo(-6, -11.5, 5.5, 2, '#4f9a4c'); O.curve([[-6, -11.5], [-3, -12.5]], '#2f6a3a', 0.6);
    O.eo(6.5, -12.5, 4.5, 1.7, '#5aa652');
    O.curve([[1, -10], [1.5, -18], [0, -24]], CM.ink, 2.4); O.curve([[1, -10], [1.5, -18], [0, -24]], '#5a9a5a', 1.2);
    O.curve([[-2, -10], [-4, -15], [-6, -18]], CM.ink, 2); O.curve([[-2, -10], [-4, -15], [-6, -18]], '#5a9a5a', 1);
    O.eo(-6.5, -19, 2.2, 1.6, '#8ab848'); for (const dx of [-1, 0, 1]) O.dot(-6.5 + dx * 0.9, -19.3, 0.35, '#3a5a2a');
    H(0, -26, 1.45, 0);
  } else if (t === 'ghostorchid') {
    O.blobO([[-9, -11], [9, -11], [7, -1], [-7, -1]], '#5a5a6a'); O.e(-2, -10.6, 8, 2, '#3f6a4a'); for (const dx of [-5, -1, 3, 6]) O.dot(dx, -11, 1.2, '#5a8a5a');
    O.curve([[-1, -11], [-3, -19], [2, -26], [7, -27]], CM.ink, 2.2); O.curve([[-1, -11], [-3, -19], [2, -26], [7, -27]], '#9ad8e0', 1.1);
    O.curve([[1, -11], [5, -16], [8, -18]], CM.ink, 2); O.curve([[1, -11], [5, -16], [8, -18]], '#9ad8e0', 1);
    H(7, -27.5, 1.0, 0); H(-2.5, -20, 0.85, 0); H(8.5, -18.5, 0.75, 0);
  } else _drawPlant2Old(t);
};
Object.assign(PLANTS, {
  camellia: ['..RrR.....', '.RRrRR.Rr.', '..RRR.RRR.', '.lLRl.lLl.', '.LlLLlLL..', '..LlLLl...', '...LLL....', '....L.....'],
  plumeria: ['.MYM...MY.', 'MMYMM.MYMM', '.MMM...MM.', '..t..t..t.', '..tt.t.tt.', '...ttttt..', '....tt....', '....t.....'],
  lotus: ['....NN....', '...NMMN...', '..NNMMNN..', '...NNNN...', '....LL....', '.LLL.LLLL.', 'LLlLLLlLL.', '.QQQQQQQQ.'],
  ghostorchid: ['......MM..', '.....MmmM.', '.MM...MM..', 'MmmM..L...', '.MM..L....', '...LL.....', '..LlL.....', '...L......'],
});
Object.assign(ICONS, {
  camellia: ['RrR..', 'rRRr.', '.RrR.', '..L..', '..L..'],
  plumeria: ['M.M..', 'MYM..', '.MM..', '..t..', '..t..'],
  lotus: ['..N..', '.NMN.', 'NNMNN', '..L..', '..L..'],
  ghostorchid: ['.MM..', 'MmmM.', '.MM..', '..L..', '..L..'],
});
