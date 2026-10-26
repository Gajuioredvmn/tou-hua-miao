// ================= 口碑等級 =================
// 第二個月起，每天傍晚結算「口碑」：賣得好、包花束、有新品種、VIP 熟客、比對面連鎖店受歡迎都會加分；
// 可是鄰居起疑（警戒兩顆星以上）就會有「花是偷來的？」的謠言，口碑會掉。偷太兇，名聲也會受影響。
// 衍生：
//   ・客人每天留評論（評論牆），會提到店裡真的發生過的事
//   ・升級有獎勵：賣價加成、雜誌採訪、網紅打卡、電視台採訪、婚禮包場……
//   ・店面跟著變：門口的口碑星星招牌越掛越亮，晚上也看得到
const REP_LV = [
  { xp: 0, name: '巷子裡的小花店' },
  { xp: 12, name: '附近有點名氣', perk: '雜誌來採訪' },
  { xp: 30, name: '鄰里口耳相傳', perk: '賣價 ×1.05' },
  { xp: 55, name: '網路上的話題', perk: '網紅來打卡（客人來得比較快）' },
  { xp: 85, name: '區域人氣店', perk: '門口掛上金色星星招牌' },
  { xp: 120, name: '城市裡的名店', perk: '賣價 ×1.10' },
  { xp: 165, name: '電視台指定', perk: '電視台來採訪' },
  { xp: 220, name: '婚禮花藝首選', perk: '大型委託的報酬 ×1.3' },
  { xp: 285, name: '巷弄名店', perk: '牆上掛「巷弄名店」匾額，賣價 ×1.15' },
  { xp: 360, name: '傳說中的花店', perk: '稱號「傳說花店」，賣價 ×1.20' },
];
const REP_PRICE = [1, 1, 1.05, 1.05, 1.05, 1.1, 1.1, 1.1, 1.15, 1.2];
function repOf(run) { return run.rep || (run.rep = { xp: 0, lv: 1, reviews: [], seen: {} }); }
function repLv(run) { const R = repOf(run); let lv = 1; for (let i = 0; i < REP_LV.length; i++) if (R.xp >= REP_LV[i].xp) lv = i + 1; return lv; }
{
  const _fv = flowerValue;
  flowerValue = function (run, t, fresh) { return _fv(run, t, fresh) * (run && run.rep ? REP_PRICE[repLv(run) - 1] : 1); };
}
// 大型委託報酬加成
if (typeof commissionTake === 'function') {
  const _ct = commissionTake;
  commissionTake = function (run, stock) { const r = _ct(run, stock); if (r && r.paid && repLv(run) >= 8) r.paid = Math.round(r.paid * 1.3); return r; };
}
// ---------- 評論 ----------
const REVIEW_WHO = ['路過的上班族', '附近的大學生', '帶小孩的媽媽', '散步的阿公', '外地來的觀光客', '咖啡廳老闆', '花藝愛好者', '隔壁里的太太', '剛下班的護理師', '騎腳踏車的高中生'];
function makeReview(S, ctx) {
  const run = S.run, good = [], bad = [];
  if (ctx.hy.length) good.push(`買到${FLOWERS[pick(ctx.hy)].name}！全世界好像只有這家有。`);
  if (ctx.bq) good.push('老闆娘包的花束配色好美，送人超有面子。');
  if (ctx.kinds >= 6) good.push('花的種類好多，每次來都有新東西。');
  if (storeOf(run).catcorner) good.push('店裡有好多貓，順便吸貓，太療癒了。');
  good.push(pick(['櫃台那隻虎斑貓好可愛，一直對我眨眼睛。', '花很新鮮，老闆娘人超好。', '價錢實在，比連鎖店有溫度。', '店裡好香，一進門心情就變好。']));
  if ((storeOf(run).expand || 0) >= 1) good.push('買花還可以喝咖啡，週末來坐一下剛好。');
  if (ctx.season) good.push(`${ctx.season}的花擺得好有季節感。`);
  if (ctx.rumor.length) bad.push(`聽說${ctx.rumor.map(o => OWNERS[o].person).join('、')}家的花一直被偷……這家店的花該不會是……？`);
  if (!ctx.kinds) bad.push('今天去的時候店裡沒什麼花，有點可惜。');
  if (ctx.chainLow) bad.push('對面的連鎖店比較便宜耶……');
  let score = 3.4 + good.length * 0.35 - bad.length * 0.9 + rnd(-0.6, 0.6);
  score = clamp(Math.round(score), 1, 5);
  const text = score <= 2 && bad.length ? pick(bad) : score >= 4 ? pick(good) : pick(good.concat(bad));
  return { who: pick(REVIEW_WHO), s: score, text, n: run.nightIdx || 1 };
}
// 傍晚結算口碑
function repDayEnd(S) {
  const run = S.run;
  if ((run.month || 1) < 2 || S.n < 2 || S.n > 4) return null;
  const R = repOf(run), before = repLv(run);
  const start = S.dayStart || [];
  const ctx = {
    hy: start.filter(t => HYBRIDS[t]), bq: S.bqSold || 0, kinds: new Set(start).size,
    rumor: HEAT_OWNERS.filter(o => starsOf(run, o) >= 2 && o !== 'mansion'),
    chainLow: chainActive(run) && chainOf(run).share < 40,
    season: (run.month || 1) > 1 ? seasonOf(run).name : null,
  };
  const parts = [];
  const add = (v, why) => { if (v) parts.push([v, why]); };
  add(Math.min(6, Math.floor((S.daySales || 0) / 3000)), '生意');
  add(Math.min(4, ctx.bq * 2), '花束');
  if (ctx.hy.length) add(3, '新品種');
  add(REGULARS.filter(x => (regOf(run)[x.id] || 0) >= VIP_AT).length, 'VIP 熟客');
  if (chainActive(run) && chainOf(run).share >= 60) add(2, '比對面受歡迎');
  if (chainOf(run).closed) add(1, '打敗連鎖店的名聲');
  add(Math.min(2, (run.fans || []).length), '粉絲');
  if (ctx.rumor.length) add(-3 * ctx.rumor.length, '偷花的謠言');
  if (!ctx.kinds) add(-2, '店裡沒花');
  const n = 1 + (Math.random() < 0.5 ? 1 : 0), revs = [];
  for (let i = 0; i < n; i++) { const r = makeReview(S, ctx); revs.push(r); R.reviews.unshift(r); }
  if (R.reviews.length > 30) R.reviews.length = 30;
  const avg = revs.reduce((a, r) => a + r.s, 0) / revs.length;
  add(avg >= 4.5 ? 2 : avg >= 4 ? 1 : avg <= 2 ? -2 : 0, '評論');
  const delta = parts.reduce((a, p) => a + p[0], 0);
  R.xp = Math.max(0, R.xp + delta);
  const after = repLv(run);
  if (after > before) R.lvUp = after;
  return { delta, parts, revs, before, after };
}
// ---------- 升級的小故事 ----------
function* repStoryScript(S) {
  const run = S.run, R = repOf(run), lv = repLv(run);
  for (let k = 2; k <= lv; k++) {
    if (R.seen[k]) continue;
    R.seen[k] = 1;
    const wasOn = S.shopOn; S.shopOn = false;
    UI.banner(`口碑 Lv.${k}・${REP_LV[k - 1].name}`);
    if (k === 2) {
      const c = S.customer('shopB'); yield S.walkIn(c);
      yield* S.talk(c, '雜誌編輯', [['您好，我們是《城市散步》雜誌。最近好多讀者推薦妳的店！'], ['可以拍幾張照片嗎？……那隻貓也一起！']]);
      yield S.walkOut(c);
      run.money += 5000; run.cans += 10; SFX.play('coin');
      UI.toast('上雜誌了！採訪費 NT$ 5,000、罐罐 +10', 3600);
    } else if (k === 4) {
      const c = S.customer('shopE'); yield S.walkIn(c);
      yield* S.talk(c, '網紅小花', [['哈囉大家～我現在在一間超可愛的巷弄花店！'], ['你們看這隻貓！（花喵配合地翻肚）'], ['連結放在下面，大家快來打卡～']]);
      yield S.walkOut(c);
      run.flags.buzz = (run.nightIdx || 0) + 4; SFX.play('heart');
      UI.toast('網紅打卡！接下來幾天客人來得特別快', 3600);
    } else if (k === 7) {
      const c = S.customer('shopA'); yield S.walkIn(c);
      yield* S.talk(c, '電視台記者', [['我們是晚間新聞的「巷弄裡的小確幸」單元！'], ['聽說這家店的老闆娘，一個人撐起了整條巷子的花香……'], ['還有一隻傳說中會帶來好運的貓？']]);
      yield S.walkOut(c);
      run.money += 20000; run.cans += 30; SFX.play('coin');
      UI.toast('上電視了！通告費 NT$ 20,000、罐罐 +30', 3600);
    } else {
      yield S.say(k === 10 ? '花喵……我們變成「傳說中的花店」了。從快倒閉的小店，走到這裡……謝謝你。' : `大家都說我們是「${REP_LV[k - 1].name}」了！`);
      if (REP_LV[k - 1].perk) UI.toast(`口碑 Lv.${k}：${REP_LV[k - 1].perk}`, 3600);
    }
    UI.hideDialog(); S.shopOn = wasOn;
    checkAchievements(run);
    return true;
  }
  return false;
}
// ---------- 花店分頁：口碑 ----------
function repShopHTML(run) {
  if ((run.month || 1) < 2) return '';
  const R = repOf(run), lv = repLv(run), cur = REP_LV[lv - 1], nx = REP_LV[lv];
  const k = nx ? (R.xp - cur.xp) / (nx.xp - cur.xp) : 1;
  const revs = R.reviews.slice(0, 3).map(r => `<li><span class="rv-s">${'★'.repeat(r.s)}<i>${'★'.repeat(5 - r.s)}</i></span><b>${esc(r.who)}</b><p>${esc(r.text)}</p></li>`).join('');
  return `<div class="rep-box"><div class="rep-top"><b>口碑 Lv.${lv}</b><span>${esc(cur.name)}${REP_PRICE[lv - 1] > 1 ? `・賣價 ×${REP_PRICE[lv - 1]}` : ''}</span></div>
    <div class="rep-bar"><i style="width:${Math.round(k * 100)}%"></i></div>
    <p class="hint">${nx ? `下一級：${esc(nx.perk || nx.name)}（${R.xp}/${nx.xp}）` : '已經是最高級了！'}　鄰居起疑會傳出偷花的謠言，口碑會掉。</p>
    ${revs ? `<ul class="rv-list">${revs}</ul>` : ''}</div>`;
}
function repBookHTML(run) {
  const R = repOf(run);
  if (!R.reviews.length) return '<p class="lead">第二個月起，客人會留下評論。</p>';
  const avg = R.reviews.reduce((a, r) => a + r.s, 0) / R.reviews.length;
  return `<p class="lead">客人留下的評論（最近 30 則）。平均 <b class="px">${avg.toFixed(1)}</b> 顆星。</p><ul class="rv-list">${R.reviews.map(r => `<li><span class="rv-s">${'★'.repeat(r.s)}<i>${'★'.repeat(5 - r.s)}</i></span><b>${esc(r.who)}</b><p>${esc(r.text)}</p></li>`).join('')}</ul>`;
}
// ---------- 店面：口碑招牌 ----------
function toonRepSign(lv) {
  return toonFrameInfo(toonFrame('repsign-' + lv, 46, 30, () => {
    const gold = lv >= 5, plaque = lv >= 9;
    O.blobO([[-20, -26], [20, -26], [20, -6], [-20, -6]], plaque ? '#5a2a1a' : gold ? '#2a2440' : '#f2e8d8');
    O.blobO([[-18, -24], [18, -24], [18, -8], [-18, -8]], plaque ? '#8a3a24' : gold ? '#3a3260' : '#fff8ec');
    const n = Math.min(5, Math.ceil(lv / 2));
    for (let i = 0; i < n; i++) { const x = -((n - 1) * 6) / 2 + i * 6; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; O.e(x + Math.cos(a) * 1.4, -16 + Math.sin(a) * 1.4, 1.5, 1.5, gold || plaque ? '#ffd84d' : '#ff9fbb'); } O.dot(x, -16, 1.2, gold || plaque ? '#fff2a8' : '#ffd0de'); }
    O.curve([[-8, -26], [0, -32], [8, -26]], CM.ink, 1.2);
  }), false, 0.5, 0.95);
}
function repDecor3D(sc, F) {
  const run = sc.run; if ((run.month || 1) < 2) return;
  const lv = repLv(run); if (lv < 2) return;
  const cpd = Math.cos(R3.pitch);
  pushSprite(F.sprites, ART.fix(toonRepSign(lv)), 10.6 * TS, 3.6 * TS, { lift: 1.25 * cpd, minLight: [0.75, 0.7, 0.65] });
  if (lv >= 5) glowQuad(F.glow, 10.6, 1.9, 3.7, 0.7, [1, 0.85, 0.4, 0.22]);
}
function repNight3D(sc, F, L) {
  const run = sc.run; if ((run.month || 1) < 2) return;
  const lv = repLv(run); if (lv < 5) return;
  pushSprite(F.sprites, ART.fix(toonRepSign(lv)), 10.2 * TS, 5.15 * TS, { lift: 1.6 * Math.cos(R3.pitch), unlit: true });
  glowQuad(F.glow, 10.2, 2.2, 5.2, 0.8, [1, 0.85, 0.4, 0.3 + 0.05 * Math.sin((sc.cat.t || 0) * 2)]);
  L.push({ x: 10.2, y: 2.2, z: 5.6, r: 2.2, c: [0.6, 0.48, 0.2], pri: 0.8 });
}
