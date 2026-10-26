// ================= 四季 =================
// 每三個月換一季：第 1–3 個月春天、4–6 夏天、7–9 秋天、10–12 冬天，之後又是春天（第二年）。
// 每一季：
//   ・當季的花賣得比較貴，巷子裡有些盆栽換成季節限定的花（鬱金香、菊花、聖誕紅、梅花）
//   ・晚上的樣子和規則不一樣：春天花瓣飄、被偷的花隔天就長回來；夏天螢火蟲、颱風比較多；
//     秋天落葉、夜比較長；冬天寒流，大家躲在家裡（巡守少一趟），呼出白白的氣
//   ・季節任務：三個目標全部完成，拿到只有那一季拿得到的限定衣服
//   ・花店門口跟著季節換擺設；冬天最後一個月是年節，客人買花特別大方
const SEASONS = [
  { id: 'spring', name: '春天', emoji: '🌸', boost: { tulip: 1.3, rose: 1.15, babys: 1.15, periwinkle: 1.2 }, line: '春天來了！巷子裡開滿了花，鬱金香也冒出來了。',
    rules: '被偷的花隔天就長回來；常常下雨', quest: [{ k: 'tulip', n: 8, txt: '偷到 8 朵鬱金香' }, { k: 'bq', n: 3, txt: '包 3 個花束' }, { k: 'rainS', n: 1, txt: '下雨的晚上拿到 S 評價' }], reward: 'sakura' },
  { id: 'summer', name: '夏天', emoji: '🌻', boost: { sunflower: 1.35, jasmine: 1.25, lotus: 1.25, plumeria: 1.25 }, line: '好熱的夏天……向日葵和茉莉最好賣。晚上會有螢火蟲喔。',
    rules: '螢火蟲飛來飛去；颱風夜比較多', quest: [{ k: 'sunflower', n: 6, txt: '偷到 6 朵向日葵' }, { k: 'cute', n: 15, txt: '賣萌成功 15 次' }, { k: 'clean', n: 2, txt: '兩個晚上都沒被發現' }], reward: 'melon' },
  { id: 'autumn', name: '秋天', emoji: '🍁', boost: { chrysanthemum: 1.3, osmanthus: 1.3, lisianthus: 1.15 }, line: '秋天了，桂花好香。菊花也開了。',
    rules: '夜晚比較長（多 20 分鐘）；落葉沙沙響', quest: [{ k: 'autumnF', n: 8, txt: '偷到 8 朵桂花或菊花' }, { k: 'breed', n: 2, txt: '配種 2 次' }, { k: 'haul8', n: 1, txt: '一晚帶回 8 朵以上' }], reward: 'maple' },
  { id: 'winter', name: '冬天', emoji: '❄️', boost: { poinsettia: 1.35, plumblossom: 1.35, camellia: 1.3, carnation: 1.1 }, line: '寒流來了，好冷……聖誕紅和梅花開了。',
    rules: '寒流：大家躲在家裡，巡守少一趟', quest: [{ k: 'poinsettia', n: 6, txt: '偷到 6 朵聖誕紅' }, { k: 'plum', n: 3, txt: '偷到 3 枝梅花' }, { k: 'sales', n: 60000, txt: '這一季白天賣出 NT$ 60,000' }], reward: 'muff' },
];
function seasonIdx(run) { return Math.floor((((run && run.month) || 1) - 1) / 3) % 4; }
function seasonOf(run) { return SEASONS[seasonIdx(run)]; }
function seasonKey(run) { return seasonIdx(run) + '-' + Math.floor((((run && run.month) || 1) - 1) / 12); }
function seasonBoost(run, t) { return seasonOf(run).boost[t] || 1; }
const SEASON_FLOWERS = { tulip: 0, chrysanthemum: 2, poinsettia: 3, plumblossom: 3 };
function seasonFlowerOk(run, t) { return SEASON_FLOWERS[t] === undefined || SEASON_FLOWERS[t] === seasonIdx(run); }
function newYearMonth(run) { return seasonIdx(run) === 3 && (((run.month || 1) - 1) % 3) === 2; }
{
  const _fv = flowerValue;
  flowerValue = function (run, t, fresh) { return _fv(run, t, fresh) * (run ? seasonBoost(run, t) : 1); };
}
// 訂單只訂得到當季的花
{
  const _go = genOrder;
  genOrder = function (run, n) { for (let i = 0; i < 12; i++) { const o = _go(run, n); if (seasonFlowerOk(run, o.t)) return o; } return _go(run, n); };
}
// ---------- 季節任務 ----------
function seasonQ(run) {
  const key = seasonKey(run);
  if (!run.seasonQ || run.seasonQ.key !== key) run.seasonQ = { key, prog: {}, done: false };
  return run.seasonQ;
}
function seasonAdd(run, k, n = 1) {
  const Q = seasonQ(run); if (Q.done) return;
  const S = seasonOf(run); if (!S.quest.some(q => q.k === k)) return;
  Q.prog[k] = (Q.prog[k] || 0) + n;
  if (S.quest.every(q => (Q.prog[q.k] || 0) >= q.n)) {
    Q.done = true;
    const W = wardrobe(run); W.own[S.reward] = 1;
    run.seasonsDone = (run.seasonsDone || 0) + 1;
    setTimeout(() => { UI.toast(`${S.name}的季節任務全部完成！拿到限定衣服「${outfitById(S.reward).name}」（老貓攤的衣櫃）`, 4600); SFX.play('heart'); }, 1200);
  }
}
function seasonQuestHTML(run) {
  const S = seasonOf(run), Q = seasonQ(run), R = outfitById(S.reward);
  return `<div class="season-box s-${S.id}"><div class="season-top"><b>${S.emoji} ${S.name}</b><span>${esc(S.rules)}</span></div>
    <ul class="season-q">${S.quest.map(q => { const v = Math.min(q.n, Q.prog[q.k] || 0); return `<li class="${v >= q.n ? 'ok' : ''}"><span>${esc(q.txt)}</span><b class="px">${q.k === 'sales' ? Math.round(v / 1000) + 'k/' + q.n / 1000 + 'k' : v + '/' + q.n}</b></li>`; }).join('')}</ul>
    <p class="hint">${Q.done ? `完成了！限定衣服「${R.name}」已經在衣櫃裡。` : `全部完成：限定衣服「${R.name}」（只有${S.name}拿得到）`}　當季的花：${Object.keys(S.boost).map(t => FLOWERS[t] ? FLOWERS[t].name : t).join('、')}</p></div>`;
}
{
  const _nd = Flow.nightDone;
  Flow.nightDone = function (res) {
    const run = G.run, sc = G.scene;
    const ev = sc && sc.kind === 'night' ? sc.event : null;
    const dep = res.deposited || [];
    const cnt = t => dep.filter(f => f.t === t && !f.gang).length;
    const r = _nd.call(this, res);
    const L = run.lastNight || {}, st = res.stats || {};
    seasonAdd(run, 'tulip', cnt('tulip')); seasonAdd(run, 'sunflower', cnt('sunflower'));
    seasonAdd(run, 'autumnF', cnt('osmanthus') + cnt('chrysanthemum'));
    seasonAdd(run, 'poinsettia', cnt('poinsettia')); seasonAdd(run, 'plum', cnt('plumblossom'));
    if (L.grade && L.grade.g === 'S' && ev === 'rain') seasonAdd(run, 'rainS');
    if ((st.caught || 0) === 0 && dep.filter(f => !f.gang).length > 0) seasonAdd(run, 'clean');
    if (st.cuteWin) seasonAdd(run, 'cute', st.cuteWin);
    if (dep.filter(f => !f.gang).length >= 8) seasonAdd(run, 'haul8');
    if (L.breed) seasonAdd(run, 'breed', L.breed.length);
    return r;
  };
  const _mb = DayScene.prototype.bouquetMade;
  DayScene.prototype.bouquetMade = function (bq) { seasonAdd(this.run, 'bq'); return _mb.call(this, bq); };
  const _sell = DayScene.prototype.sell;
  DayScene.prototype.sell = function (v, pot, wrap) {
    if (v > 0 && newYearMonth(this.run)) v *= 1.3;
    if (v > 0) seasonAdd(this.run, 'sales', v);
    return _sell.call(this, v, pot, wrap);
  };
}
// ---------- 晚上：季節的規則 ----------
{
  const _rules = nightRulesFor;
  nightRulesFor = function (run, n) {
    const R = _rules(run, n);
    if (!R || (run.month || 1) <= 1) return R;
    const s = seasonIdx(run);
    if (s === 3) return Object.assign({}, R, { patrol: R.patrol.slice(0, Math.max(0, R.patrol.length - 1)), event: R.event === 'bbq' ? 'clear' : R.event });
    if (s === 0 && R.event === 'clear' && (n % 2 === 0)) return Object.assign({}, R, { event: 'rain' });
    if (s === 2 && R.event === 'outage' && Math.random() < 0.5) return Object.assign({}, R, { event: 'bbq' });
    return R;
  };
  const _rr = rollRare;
  rollRare = function (run, n) {
    const r = _rr(run, n);
    if (!r && seasonIdx(run) === 1 && (run.month || 1) >= 2 && Math.random() < 0.08) return 'storm';
    return r;
  };
}
// 季節限定的花換進巷子的盆栽
const SEASON_SWAP = [
  { s: 0, from: ['periwinkle'], owners: ['public', 'empty', 'lin'], to: 'tulip', k: 0.6 },
  { s: 2, from: ['bougain', 'periwinkle'], owners: ['public', 'bo', 'empty'], to: 'chrysanthemum', k: 0.55 },
  { s: 3, from: ['rose', 'bougain'], owners: ['wang', 'public'], to: 'poinsettia', k: 0.6 },
  { s: 3, from: ['periwinkle', 'bougain', 'jasmine'], owners: ['bo', 'lin'], to: 'plumblossom', k: 0.45 },
];
function seasonInitNight(sc) {
  const run = sc.run, s = seasonIdx(run);
  if ((run.month || 1) <= 1 && s === 0) { sc.seasonFx = 'spring'; return; }
  for (const R of SEASON_SWAP) {
    if (R.s !== s) continue;
    for (const p of sc.pots) if (R.from.includes(p.t) && R.owners.includes(p.owner) && hash(p.tx, p.ty, 77) < R.k) p.t = R.to;
  }
  if (s === 0) for (const p of sc.pots) if (p.regrowing) { p.avail = true; p.regrowing = false; }
  if (s === 2) sc.end += 20;
  sc.seasonFx = SEASONS[s].id;
}
(function () {
  const P = NightScene.prototype;
  const _u = P.update;
  P.update = function (dt) {
    if (!this.seasonInit) { this.seasonInit = true; try { seasonInitNight(this); } catch (e) { console.error(e); } }
    return _u.call(this, dt);
  };
  const _r3 = P.render3D;
  P.render3D = function () {
    const r = _r3.call(this);
    if (R3.ov && this.mode !== 'zone' && this.mode !== 'zonewait' && !this.duel) seasonOverlay(this, R3.ov, R3.W, R3.H);
    return r;
  };
})();
// 季節的粒子（疊在畫面上）
function seasonOverlay(sc, g, W, H) {
  const id = sc.seasonFx; if (!id) return;
  const P = sc.seasonP || (sc.seasonP = []);
  const dt = R3.dt || 0.016, want = id === 'summer' ? 18 : id === 'winter' ? 0 : 26;
  while (P.length < want) P.push({ x: Math.random() * W, y: Math.random() * H, vx: rnd(-12, 12), vy: id === 'summer' ? rnd(-6, 6) : rnd(18, 40), ph: rnd(0, 6), s: rnd(0.7, 1.3) });
  g.save();
  for (const p of P) {
    p.ph += dt * (id === 'summer' ? 2 : 2.4);
    p.x += (p.vx + Math.sin(p.ph) * (id === 'summer' ? 14 : 18)) * dt; p.y += (p.vy + (id === 'summer' ? Math.cos(p.ph * 0.7) * 10 : 0)) * dt;
    if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; } if (p.y < -12) p.y = H + 8; if (p.x < -12) p.x = W + 8; if (p.x > W + 12) p.x = -8;
    if (id === 'spring') { g.save(); g.translate(p.x, p.y); g.rotate(p.ph); g.fillStyle = 'rgba(255,190,215,0.85)'; g.beginPath(); g.ellipse(0, 0, 4 * p.s, 2.4 * p.s, 0, 0, TAU); g.fill(); g.restore(); }
    else if (id === 'autumn') { g.save(); g.translate(p.x, p.y); g.rotate(p.ph * 0.6); g.fillStyle = p.s > 1 ? 'rgba(230,110,50,0.85)' : 'rgba(240,170,60,0.85)'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.lineTo(Math.cos(a) * 5 * p.s, Math.sin(a) * 5 * p.s); g.lineTo(Math.cos(a + 0.6) * 2 * p.s, Math.sin(a + 0.6) * 2 * p.s); } g.closePath(); g.fill(); g.restore(); }
    else if (id === 'summer') { const a = 0.45 + 0.45 * Math.sin(p.ph * 2.3); const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9); gr.addColorStop(0, `rgba(220,255,140,${a})`); gr.addColorStop(1, 'rgba(220,255,140,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, 9, 0, TAU); g.fill(); g.fillStyle = `rgba(250,255,200,${a})`; g.beginPath(); g.arc(p.x, p.y, 1.8, 0, TAU); g.fill(); }
  }
  if (id === 'winter') {
    // 寒流：冷冷的藍色、花喵呼出白氣
    g.fillStyle = 'rgba(150,180,255,0.07)'; g.fillRect(0, 0, W, H);
    const c = sc.cat, t = c.t || 0;
    if (R3.at && sc.mode === 'play' && (Math.floor(t * 0.8) % 2 === 0)) {
      const k = (t * 0.8) % 1, side = c.dir === 'left' ? -1 : c.dir === 'right' ? 1 : 0;
      const [sx, sy] = R3.at(c.x + side * 6, c.y, 1.0 + (c.h || 0) * Math.cos(R3.pitch));
      g.fillStyle = `rgba(240,248,255,${0.5 * (1 - k)})`; g.beginPath(); g.arc(sx + side * k * 14, sy - k * 10, 3 + k * 7, 0, TAU); g.fill();
    }
  }
  g.restore();
}
// ---------- 白天：換季的那天 ----------
function* seasonStartScript(S) {
  const run = S.run, key = seasonKey(run);
  run.seasonSeen = run.seasonSeen || {};
  if ((run.month || 1) <= 1 || run.seasonSeen[key]) return false;
  run.seasonSeen[key] = 1;
  const Sx = seasonOf(run), wasOn = S.shopOn; S.shopOn = false;
  UI.banner(Sx.emoji + ' ' + Sx.name);
  yield S.say(Sx.line);
  if (Sx.id === 'winter') yield S.say('這一季的最後一個月是年節，大家買花都很大方喔！');
  UI.hideDialog(); S.shopOn = wasOn;
  UI.toast(`${Sx.name}：${Sx.rules}。季節任務在老貓攤可以看，完成有${Sx.name}限定的衣服`, 4800);
  return true;
}
function* newYearScript(S, n) {
  const run = S.run;
  if (!newYearMonth(run) || n !== 2 || (run.flags.newYear || 0) === run.month) return false;
  run.flags.newYear = run.month;
  const wasOn = S.shopOn; S.shopOn = false;
  yield S.say('快過年了！門口貼了春聯，花喵也收到紅包了。');
  run.cans += 20; SFX.play('coin');
  yield S.say('這個月客人買花都會多給一點，大家都想討個吉利。');
  UI.hideDialog(); S.shopOn = wasOn;
  UI.toast('年節：這個月白天每筆生意多三成！紅包：罐罐 +20', 3800);
  return true;
}
// ---------- 花店門口的季節擺設 ----------
function toonSeasonDecor(id) {
  return toonFrameInfo(toonFrame('sdecor-' + id, 44, 46, () => {
    if (id === 'spring') { for (const [x, c] of [[-9, '#ff7a9a'], [-3, '#ffd84d'], [3, '#e8394d'], [9, '#ffffff']]) { O.curve([[x, -10], [x, -22]], CM.ink, 2); O.curve([[x, -10], [x, -22]], PC.stem, 1); HEAD2.tulip(x, -24, 0.9, 0); } O.blobO([[-15, -12], [15, -12], [13, -1], [-13, -1]], '#b8864a'); }
    else if (id === 'summer') { O.curve([[0, -2], [0, -22]], CM.ink, 2.4); O.curve([[0, -2], [0, -22]], '#8a8a9a', 1.2); O.eo(0, -28, 9, 9, '#cfe8ff'); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; O.e(Math.cos(a) * 4.5, -28 + Math.sin(a) * 4.5, 3.4, 2, '#7ab8f0', { rot: a }); } O.dot(0, -28, 1.6, '#4a6a9a'); O.eo(0, -1.5, 7, 2, '#8a8a9a'); }
    else if (id === 'autumn') { O.eo(0, -7, 11, 7.5, '#f2953a'); for (const dx of [-5, 0, 5]) O.curve([[dx, -14], [dx * 0.6, -7], [dx, -0.5]], '#c86a1a', 0.8); O.curve([[0, -14], [1.5, -18]], '#6a4a2a', 1.6); for (const [x, y] of [[-12, -16], [11, -15]]) HEAD2.chrysanthemum(x, y, 0.9, 0); }
    else if (id === 'winter') { for (const x of [-9, 9]) { O.curve([[x, -40], [x, -30]], CM.ink, 1); O.eo(x, -24, 5.5, 6.5, '#e8394d'); O.e(x, -24, 3, 6, '#c8243a'); O.blobO([[x - 2, -18], [x + 2, -18], [x + 1.4, -15], [x - 1.4, -15]], '#ffd84d'); } HEAD2.poinsettia(0, -12, 1.2, 0); O.blobO([[-7, -6], [7, -6], [6, -1], [-6, -1]], '#c9744d'); }
  }), false, 0.5, 0.95);
}
function seasonDecor3D(sc, F) {
  const run = sc.run; if ((run.month || 1) <= 1) return;
  const id = seasonOf(run).id, cpd = Math.cos(R3.pitch);
  pushSprite(F.sprites, ART.fix(toonSeasonDecor(id)), 2.2 * TS, 15.6 * TS, { minLight: [0.65, 0.6, 0.6] });
  pushSprite(F.sprites, ART.fix(toonSeasonDecor(id)), 12.8 * TS, 15.6 * TS, { minLight: [0.65, 0.6, 0.6], flip: true });
  if (id === 'winter' && newYearMonth(run)) glowQuad(F.glow, 7.5, 2.6, 5.4, 1.2, [1, 0.3, 0.2, 0.18]);
}

// ---------- 新的花：鬱金香、菊花、聖誕紅、梅花 ----------
Object.assign(HEAD2, {
  tulip(x, y, s, r) {
    const col = ['#ff7a9a', '#ffd84d', '#e8394d', '#ffffff', '#c88af0'][Math.floor(Math.abs(r * 7)) % 5];
    O.blobO([[x - 2.4 * s, y - 2.2 * s], [x - 1.2 * s, y - 0.8 * s], [x, y - 2.8 * s], [x + 1.2 * s, y - 0.8 * s], [x + 2.4 * s, y - 2.2 * s], [x + 2.2 * s, y + 1.2 * s], [x, y + 2.4 * s], [x - 2.2 * s, y + 1.2 * s]], col);
    O.curve([[x, y - 1.6 * s], [x, y + 1.6 * s]], 'rgba(0,0,0,0.18)', 0.7);
  },
  chrysanthemum(x, y, s, r) {
    O.eo(x, y, 3.3 * s, 3.1 * s, '#ffc63a');
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + r; O.e(x + Math.cos(a) * 2.3 * s, y + Math.sin(a) * 2.1 * s, 1.2 * s, 0.45 * s, i % 2 ? '#ffd86a' : '#ffe9a0', { rot: a }); }
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + r; O.e(x + Math.cos(a) * 1.1 * s, y + Math.sin(a) * 1 * s, 0.8 * s, 0.4 * s, '#f2a81a', { rot: a }); }
    O.dot(x, y, 0.6 * s, '#c8781a');
  },
  poinsettia(x, y, s, r) {
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + r; O.eo(x + Math.cos(a) * 2.2 * s, y + Math.sin(a) * 2 * s, 2.3 * s, 1 * s, i % 2 ? '#d8243a' : '#e8394d', { rot: a }); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + r + 0.4; O.e(x + Math.cos(a) * 1.2 * s, y + Math.sin(a) * 1.1 * s, 1.2 * s, 0.5 * s, '#ff5a6a', { rot: a }); }
    for (let i = 0; i < 4; i++) O.dot(x + Math.cos(i * 1.6) * 0.5 * s, y + Math.sin(i * 1.6) * 0.5 * s, 0.35 * s, '#ffd84d');
  },
  plumblossom(x, y, s, r) {
    O.curve([[x - 3.4 * s, y + 1.6 * s], [x - 0.6 * s, y + 0.4 * s], [x + 2.6 * s, y - 1.8 * s]], '#5a3a2a', 1.2);
    for (const [dx, dy, k] of [[-1.6, 0.6, 0.9], [1.4, -1.2, 1], [3, -2.4, 0.7]]) {
      const cx = x + dx * s, cy = y + dy * s;
      O.eo(cx, cy, 1.9 * s * k, 1.9 * s * k, '#ffc8d8');
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; O.e(cx + Math.cos(a) * 0.95 * s * k, cy + Math.sin(a) * 0.95 * s * k, 0.85 * s * k, 0.85 * s * k, '#ffe4ee'); }
      O.dot(cx, cy, 0.45 * s * k, '#e8577e');
    }
  },
});
Object.assign(BUNCH, {
  tulip: { stem: '#5a9a4c', leaf: true, head: HEAD2.tulip },
  chrysanthemum: { stem: '#4f8a3c', leaf: true, head: HEAD2.chrysanthemum },
  poinsettia: { stem: '#3f7a3a', leaf: true, head: HEAD2.poinsettia },
  plumblossom: { stem: '#5a3a2a', leaf: false, tall: 1.1, head: HEAD2.plumblossom },
});
{
  const _dp2 = drawPlant2;
  drawPlant2 = function (t) {
    const H = HEAD2[t];
    if (t === 'tulip') {
      for (const [x0, x1, y1, r] of [[-3, -6, -22, 0.1], [0, 0.5, -26, 0.3], [3, 6, -23, 0.6]]) { O.curve([[x0, -12], [x1 * 0.6, (y1 - 12) / 2], [x1, y1]], CM.ink, 2.2); O.curve([[x0, -12], [x1 * 0.6, (y1 - 12) / 2], [x1, y1]], '#5a9a4c', 1.1); H(x1, y1 - 2, 1.05, r); }
      for (const [x, a] of [[-5, -0.5], [5, 0.5]]) O.eo(x, -15, 2, 5.5, '#6aaa5a', { rot: a });
      drawPotBase('clay', 20);
    } else if (t === 'chrysanthemum') {
      leafBall(-5, -16, 6, 4.4, '#4f8a3c'); leafBall(5, -16.5, 6, 4.4, '#4f8a3c'); leafBall(0, -19.5, 6, 4.2, '#5a9a48');
      H(-5, -21, 1.0, 0.2); H(5, -22, 1.0, 1); H(0, -26, 1.1, 0.5);
      drawPotBase('clay', 20);
    } else if (t === 'poinsettia') {
      leafBall(-5, -16, 6, 4.4, '#2f6a3a', '#1f4a2a'); leafBall(5, -16.5, 6, 4.4, '#2f6a3a', '#1f4a2a');
      H(-4, -21, 1.15, 0.3); H(5, -22, 1.1, 0.9); H(0.5, -25.5, 1.2, 0.6);
      drawPotBase('clay', 20); O.blobO([[-9.6, -8.4], [9.6, -8.4], [9.2, -6.6], [-9.2, -6.6]], '#e8c45a');
    } else if (t === 'plumblossom') {
      O.curve([[0, -12], [-2, -20], [-6, -27], [-9, -29]], CM.ink, 2.6); O.curve([[0, -12], [-2, -20], [-6, -27], [-9, -29]], '#5a3a2a', 1.5);
      O.curve([[-1, -18], [3, -23], [7, -26]], CM.ink, 2.2); O.curve([[-1, -18], [3, -23], [7, -26]], '#5a3a2a', 1.2);
      H(-6, -27, 1.0, 0); H(5, -24, 0.95, 0); H(-2, -21, 0.8, 0);
      O.blobO([[-10, -11], [10, -11], [8, -1], [-8, -1]], '#4a5a6a'); O.e(0, -11, 9.6, 1.6, '#6a7a6a');
    } else _dp2(t);
  };
}
Object.assign(PLANTS, {
  tulip: ['.N...Y..R.', 'NNN.YYY.RR', '.N...Y..R.', '..L..L..L.', '..L.LL.LL.', '...LLLL...', '....LL....', '....L.....'],
  chrysanthemum: ['..YYY.....', '.YuYuY.YY.', '..YYY.YuY.', '.LL.L..Y..', '.LlLL.LL..', '..LLlLL...', '...LLL....', '....L.....'],
  poinsettia: ['..R.R.....', '.RRrRR.R..', '..RRR.RRR.', '.R.L..RR..', '.LlLL.L...', '..LLlLL...', '...LLL....', '....L.....'],
  plumblossom: ['N.......N.', '.Nt...tN..', '..tN.Nt...', '...t.t....', '...ttt....', '....t.....', '....t.....', '....t.....'],
});
Object.assign(ICONS, {
  tulip: ['N.N..', 'NNN..', '.N...', '..L..', '..L..'],
  chrysanthemum: ['YuY..', 'uYYu.', 'YuY..', '..L..', '..L..'],
  poinsettia: ['R.R..', 'RrRR.', '.RR..', '..L..', '..L..'],
  plumblossom: ['N..N.', '.tN..', '..t..', '..t..', '..t..'],
});

// ---------- 限定衣服 ----------
OUTFITS.push(
  { id: 'sakura', slot: 'hat', name: '櫻花髮夾', r: 'SR', limited: 'spring' },
  { id: 'melon', slot: 'hat', name: '西瓜帽', r: 'SR', limited: 'summer' },
  { id: 'maple', slot: 'cape', name: '楓葉披風', r: 'SR', limited: 'autumn', c: '#d8602a', d: '#ffb84a' },
  { id: 'muff', slot: 'hat', name: '毛毛耳罩', r: 'SR', limited: 'winter' },
);
{
  const _hd = hatDraw;
  hatDraw = function (Q, x, y, k, id) {
    const P = pts => pts.map(([a, b]) => [x + a * k, y + b * k]);
    if (id === 'sakura') { for (const [dx, dy, s] of [[-7, 1, 1], [-2.5, -1, 0.8]]) { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; Q.ell(x + (dx + Math.cos(a) * 2.2 * s) * k, y + (dy + Math.sin(a) * 2.2 * s) * k, 1.9 * s * k, 1.9 * s * k, '#ffc8dc'); } Q.ellF(x + dx * k, y + dy * k, 1.1 * s * k, 1.1 * s * k, '#ff7aa0'); } return; }
    if (id === 'melon') { Q.poly(P([[-12, 1], [12, 1], [9, -7], [0, -10], [-9, -7]]), '#4fa84a'); for (const u of [-6, 0, 6]) Q.line(P([[u, 0], [u * 0.8, -9]]), '#2f6a2a', 1.4 * k); Q.poly(P([[-12.6, 1.8], [12.6, 1.8], [12.2, -1.6], [-12.2, -1.6]]), '#ff6a6a'); for (const u of [-7, -2, 3, 8]) Q.ellF(x + u * k, y - 0.2 * k, 0.8 * k, 0.6 * k, '#2a1a1a'); return; }
    if (id === 'muff') { Q.line(P([[-10, 2], [-7, -8], [0, -11], [7, -8], [10, 2]]), '#e86a8a', 2.2 * k); for (const s of [-1, 1]) { Q.ell(x + s * 11 * k, y + 3 * k, 4.6 * k, 5.2 * k, '#fff2f6'); Q.ellF(x + s * 11 * k, y + 3 * k, 2.4 * k, 2.8 * k, '#ffd0de'); } return; }
    return _hd(Q, x, y, k, id);
  };
  const _ex = exchangeOutfit;
  exchangeOutfit = function (run, id) { const o = outfitById(id); if (o && o.limited) return false; return _ex(run, id); };
}

function seasonBriefHTML(run) {
  if ((run.month || 1) <= 1) return '';
  const S = seasonOf(run), Q = seasonQ(run);
  const left = S.quest.filter(q => (Q.prog[q.k] || 0) < q.n).map(q => q.txt);
  return `<p class="hint">${S.emoji} ${S.name}：${esc(S.rules)}${Q.done ? '　季節任務完成了！' : left.length ? `　季節任務還差：${esc(left.join('、'))}` : ''}${rivalActive(run) ? '　今晚煤炭可能會出現。' : ''}</p>`;
}
