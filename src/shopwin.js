// ================= 櫥窗佈置＋貓咪店長區（第二、三個月起）=================
// 櫥窗：傍晚選一個主題（換一次要材料費），主題花賣得比較貴；櫥窗白天晚上都看得到主題的樣子。
// 貓咪店長區：花喵幫的小弟可以留在店裡「上班」，窩在貓跳台上招客人；每天傍晚有招牌貓的收入。
const WINDOW_THEMES = [
  { id: 'red', name: '紅色浪漫', flowers: ['rose', 'carnation', 'bougain'], col: '#e8394d', col2: '#ff9fb8', light: [1.1, 0.35, 0.4] },
  { id: 'sun', name: '夏日陽光', flowers: ['sunflower', 'periwinkle', 'osmanthus'], col: '#ffc61a', col2: '#fff0a0', light: [1.1, 0.85, 0.3] },
  { id: 'white', name: '白色優雅', flowers: ['jasmine', 'babys', 'magnolia', 'tanhua'], col: '#f4f4f0', col2: '#d8e8f0', light: [0.9, 0.95, 1.1] },
  { id: 'purple', name: '紫色夢幻', flowers: ['lisianthus', 'hydrangea', 'orchid'], col: '#9a6ad0', col2: '#c8b0f0', light: [0.75, 0.5, 1.1] },
  { id: 'peony', name: '富貴牡丹', flowers: ['peony', 'orchid', 'rose'], col: '#ff7aa8', col2: '#ffd84d', light: [1.1, 0.6, 0.6], mon: 4 },
];
const WINDOW_COST = 800, WINDOW_MULT = 1.3;
function winTheme(run) { const id = run.win && run.win.theme; return WINDOW_THEMES.find(w => w.id === id) || null; }
function winMult(run, t) { const w = winTheme(run); return w && w.flowers.includes(t) ? WINDOW_MULT : 1; }
function winOpen(run) { return (run.month || 1) >= 2; }
function setWindow(run, id) {
  const w = WINDOW_THEMES.find(x => x.id === id); if (!w || (w.mon && (run.month || 1) < w.mon)) return false;
  if ((run.win && run.win.theme) === id || run.money < WINDOW_COST) return false;
  run.money -= WINDOW_COST; run.win = { theme: id }; return true;
}
function windowHTML(run) {
  if (!winOpen(run)) return '';
  const cur = winTheme(run);
  return `<h3>櫥窗主題<small>換一次材料費 ${money(WINDOW_COST)}・主題花 ×${WINDOW_MULT}</small></h3><div class="win-themes">${WINDOW_THEMES.map(w => {
    const locked = w.mon && (run.month || 1) < w.mon, on = cur && cur.id === w.id;
    return `<button type="button" class="win-t ${on ? 'on' : ''}" data-win="${w.id}" ${locked || on || run.money < WINDOW_COST ? 'disabled' : ''} style="--wc:${w.col};--wc2:${w.col2}"><b>${w.name}</b><span>${locked ? `第${cn(w.mon)}個月` : w.flowers.map(t => FLOWERS[t].name).join('・')}</span>${on ? '<i>現在的櫥窗</i>' : ''}</button>`;
  }).join('')}</div>`;
}
// ---------- 圖：櫥窗的彩旗、主題花 ----------
function drawBunting(id) {
  const w = WINDOW_THEMES.find(x => x.id === id);
  O.curve([[-30, -18], [-15, -14], [0, -12.6], [15, -14], [30, -18]], '#6a5a4a', 0.9);
  for (let i = 0; i < 9; i++) {
    const x = -27 + i * 6.75, y = -18 + 5.4 * Math.sin((i + 0.5) / 9 * Math.PI) * 1.0;
    O.blobO([[x - 2.6, y], [x + 2.6, y], [x, y + 5]], i % 2 ? w.col : w.col2);
  }
}
function toonBunting(id) { return toonFrameInfo(toonFrame('bunting-' + id, 64, 22, () => drawBunting(id)), false, 0.5, 1.4); }
function winDay3D(sc, F) {
  const w = winTheme(sc.run); if (!w) return;
  const cpd = Math.cos(R3.pitch);
  for (const x of [4.6, 10.4]) pushSprite(F.sprites, ART.fix(toonBunting(w.id)), x * TS, 16.2 * TS, { lift: 1.7 * cpd, minLight: [0.7, 0.66, 0.62] });
  w.flowers.slice(0, 3).forEach((t, i) => pushSprite(F.sprites, toonSillPot(t), [4.4, 7.6, 10.6][i] * TS, 16.12 * TS, { lift: 0.43 * cpd }));
}
function winNight3D(sc, F, L) {
  const w = winTheme(sc.run); if (!w) return;
  for (const x of [3.2, 11.8]) L.push({ x, y: 1.0, z: 5.3, r: 2.6, c: w.light });
  for (const x of [4.0, 11.0]) pushSprite(F.sprites, ART.fix(toonBunting(w.id)), x * TS, 5.05 * TS, { lift: 1.3, minLight: [0.6, 0.55, 0.6] });
}

// ---------- 貓咪店長區 ----------
function catCornerLv(run) { return storeOf(run).catcorner || 0; }
function shopCats(run) { return gangMembers(run).filter(m => { const st = gangOf(run)[m.id]; return st.target === 'shop' && !st.caught; }); }
function catCornerIncome(run) { const lv = catCornerLv(run); return lv ? shopCats(run).length * 400 * lv : 0; }
function drawCatTree(lv) {
  const wood = '#c49a6c', rope = '#e8d8b0', pad = lv >= 2 ? '#f29ab4' : '#9ad0c8';
  O.blobO([[-14, 0], [14, 0], [14, -4], [-14, -4]], wood);
  O.blobO([[-3, -4], [3, -4], [3, -30], [-3, -30]], rope);
  for (let y = -8; y > -30; y -= 3) O.curve([[-3, y], [3, y - 1]], '#c8b088', 0.6);
  O.blobO([[-12, -14], [4, -14], [4, -17], [-12, -17]], pad);
  O.blobO([[-4, -30], [12, -30], [12, -33], [-4, -33]], pad);
  if (lv >= 2) { // 吊床、逗貓棒
    O.curve([[6, -14], [10, -9], [14, -14]], '#8a6a4a', 0.8);
    O.blobO([[5, -14], [15, -14], [12, -10], [8, -10]], '#fff0f4');
    O.curve([[12, -33], [16, -38], [19, -36]], '#6a4a2a', 0.8); O.e(19.4, -35, 1.6, 1.6, '#ff6d9a');
  }
  if (lv >= 3) { // 貓咪小屋
    O.blobO([[-14, -4], [-4, -4], [-4, -12], [-14, -12]], '#e8c48a');
    O.blobO([[-15, -12], [-3, -12], [-9, -18]], '#d9534f');
    O.e(-9, -7.4, 2.6, 3, '#3a2a20');
    O.blobO([[-12, -20], [-6, -20], [-6, -24], [-12, -24]], '#fff6e8'); O.e(-9, -22, 1.2, 1, '#ff8fae');
  }
}
function toonCatTree(lv) { return toonFrameInfo(toonFrame('cattree-' + lv, 42, 44, () => drawCatTree(lv)), false, 0.5, 1.5); }
const CAT_TREE = [13.0, 6.3];
const TREE_SEATS = [[-0.35, 1.18], [0.25, 2.18], [0.65, 0.95], [-0.6, 0.35], [0.55, 0.35]];
function catCornerDay3D(sc, F) {
  const lv = catCornerLv(sc.run); if (!lv) return;
  const cpd = Math.cos(R3.pitch), [tx, tz] = CAT_TREE, t = sc.cat.t || 0;
  pushSprite(F.sprites, ART.fix(toonCatTree(lv)), tx * TS, tz * TS, { minLight: [0.62, 0.58, 0.55] }); shadowAt(F, tx * TS, tz * TS, 1.2, 0.36);
  shopCats(sc.run).slice(0, 5).forEach((m, i) => {
    const [dx, h] = TREE_SEATS[i], act = ['none', 'blink', 'none', 'yawn', 'ear'][(Math.floor((t + i * 1.3) / 2.4)) % 5];
    pushSprite(F.sprites, gangLoaf(m, 1, act), (tx + dx) * TS, (tz + 0.05) * TS, { lift: h * cpd, minLight: [0.62, 0.58, 0.55] });
  });
}
