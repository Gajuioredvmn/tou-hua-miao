// ================= 每晚評價＋成就 =================
// 天亮結算時依照表現給 S / A / B / C；成就跨周目保留（重新開始也帶著），解開有罐罐或現金。
function gradeNight(run, res, R) {
  const own = res.deposited.filter(f => !f.gang), st = res.stats || {};
  const checks = [
    { ok: own.length >= 6, half: own.length >= 3, txt: `帶回 ${own.length} 朵`, w: 2 },
    { ok: (st.caught || 0) === 0, half: (st.caught || 0) <= 1 && (st.cuteWin || 0) >= (st.caught || 0), txt: (st.caught || 0) ? `被發現 ${st.caught} 次` : '沒被發現', w: 2 },
    { ok: (st.petals || 0) === 0 && own.length > 0, txt: '花瓣一片都沒掉', w: 1 },
    { ok: !res.lost && !res.timeUp, txt: '天亮前回到家', w: 1 },
    { ok: R.oRes.length > 0 && R.oRes.every(o => o.ok), txt: '訂單全部達成', w: 1 },
    { ok: own.some(f => ['tanhua', 'orchid', 'peony'].includes(f.t)), txt: '偷到稀有的花', w: 1 },
  ];
  let score = 0; for (const c of checks) score += c.ok ? c.w : c.half ? c.w / 2 : 0;
  const g = score >= 7 ? 'S' : score >= 5 ? 'A' : score >= 3 ? 'B' : 'C';
  const cans = { S: 10, A: 5, B: 2, C: 0 }[g];
  run.cans += cans;
  const S = run.stats;
  S.grades = S.grades || {}; S.grades[g] = (S.grades[g] || 0) + 1;
  S.sStreak = g === 'S' ? (S.sStreak || 0) + 1 : 0;
  S.bestStreak = Math.max(S.bestStreak || 0, S.sStreak);
  if (score >= 8) S.perfect = (S.perfect || 0) + 1;
  return { g, score, checks, cans };
}
function gradeHTML(G2) {
  if (!G2) return '';
  return `<div class="grade grade-${G2.g}"><b class="grade-l">${G2.g}</b><div class="grade-c">${G2.checks.map(c => `<span class="${c.ok ? 'ok' : c.half ? 'half' : ''}">${c.ok ? '✔' : c.half ? '△' : '✕'} ${esc(c.txt)}</span>`).join('')}${G2.cans ? `<em>評價獎勵：罐罐 +${G2.cans}</em>` : ''}</div></div>`;
}
// 晚上的小統計累加到整局
function accumNightStats(run, st) {
  const S = run.stats;
  for (const k of ['bridges', 'calls', 'tunnels', 'knocks']) S[k] = (S[k] || 0) + (st[k] || 0);
  S.maxCombo = Math.max(S.maxCombo || 0, st.maxCombo || 0);
}

// ---------- 成就 ----------
const ACH = [
  // 偷花
  { id: 'first', name: '第一朵花', desc: '偷到第一朵花', c: r => r.stats.stolen >= 1, cans: 3 },
  { id: 'hundred', name: '百花大盜', desc: '累計偷到 100 朵花', c: r => r.stats.stolen >= 100, cans: 20 },
  { id: 'thousand', name: '千花怪盜', desc: '累計偷到 1,000 朵花', c: r => r.stats.stolen >= 1000, cans: 80, title: '千花怪盜' },
  { id: 'gradeS', name: '無聲無息', desc: '拿到一次 S 評價', c: r => (r.stats.grades || {}).S >= 1, cans: 10 },
  { id: 'streak3', name: '影子大盜', desc: '連續三晚 S 評價', c: r => (r.stats.bestStreak || 0) >= 3, cans: 30, title: '影子大盜' },
  { id: 'perfect', name: '完美之夜', desc: '一晚全部評價項目都達成', c: r => (r.stats.perfect || 0) >= 1, cans: 25 },
  { id: 'tanhua', name: '曇花一現', desc: '偷到曇花', c: r => !!bookOf(r).flowers.tanhua, cans: 8 },
  { id: 'orchid', name: '溫室潛入', desc: '偷到大宅的蝴蝶蘭', c: r => !!bookOf(r).flowers.orchid, cans: 12 },
  { id: 'peony', name: '富貴牡丹', desc: '偷到牡丹', c: r => !!bookOf(r).flowers.peony, cans: 12 },
  { id: 'allflowers', name: '花的圖鑑', desc: '每一種花都偷過', c: r => FLOWER_ORDER.every(t => bookOf(r).flowers[t]), cans: 50, title: '花博士' },
  { id: 'whitecat', name: '神秘白貓', desc: '摸到神秘的白貓', c: r => (r.stats.whiteCat || 0) >= 1, cans: 20 },
  { id: 'rare4', name: '奇妙的夜晚', desc: '四種稀有的夜晚都遇過', c: r => Object.keys(RARE_NIGHTS).every(k => (r.rareSeen || {})[k]), cans: 40, title: '夜之貓' },
  // 賣萌
  { id: 'cute10', name: '萌翻全巷', desc: '賣萌成功 10 次', c: r => r.stats.cuteWin >= 10, cans: 15 },
  { id: 'cute50', name: '萌力無邊', desc: '賣萌成功 50 次', c: r => r.stats.cuteWin >= 50, cans: 40, title: '萌到犯規' },
  { id: 'combo5', name: '萌連擊', desc: '一晚萌連擊 5 次', c: r => (r.stats.maxCombo || 0) >= 5, cans: 20 },
  // 花店
  { id: 'm2', name: '撐過第一個月', desc: '繳清第一個月房租', c: r => (r.month || 1) >= 2, cans: 5 },
  { id: 'm6', name: '半年老店', desc: '撐到第六個月', c: r => (r.month || 1) >= 6, cans: 30, money: 10000 },
  { id: 'm12', name: '一週年', desc: '撐到第十二個月', c: r => (r.month || 1) >= 12, cans: 100, money: 50000, title: '巷弄老店' },
  { id: 'million', name: '百萬花店', desc: '帶回的花累計價值 NT$ 1,000,000', c: r => (r.nightTotals || []).reduce((a, b) => a + b, 0) >= 1000000, cans: 60, title: '百萬花店' },
  { id: 'flagship', name: '旗艦店', desc: '花店擴建到最高級', c: r => (storeOf(r).expand || 0) >= 4, cans: 40 },
  { id: 'glass', name: '玻璃花房', desc: '頂樓花園蓋到最高級', c: r => gardenOf(r).lv >= 5, cans: 40 },
  { id: 'nmstar', name: '夜市之星', desc: '夜市花攤升到人氣招牌攤', c: r => nmOf(r).lv >= 3, cans: 30 },
  { id: 'cathouse', name: '貓咖啡', desc: '蓋好貓咪小屋', c: r => (storeOf(r).catcorner || 0) >= 3, cans: 30 },
  // 鄰居
  { id: 'fan1', name: '第一位粉絲', desc: '有鄰居變成粉絲', c: r => (r.fans || []).length >= 1, cans: 8 },
  { id: 'fan4', name: '人見人愛', desc: '四位鄰居都變成粉絲', c: r => (r.fans || []).length >= 4, cans: 30 },
  { id: 'story', name: '巷子的故事', desc: '鄰居的 12 段故事全部看完', c: r => storyProgress(r).every(p => p.done >= 3), cans: 60, title: '巷子的守護神' },
  { id: 'vip4', name: '熟客滿堂', desc: '四位熟客都變成 VIP', c: r => REGULARS.every(x => (regOf(r)[x.id] || 0) > VIP_AT - 1), cans: 30 },
  { id: 'comm3', name: '接案高手', desc: '完成 3 次大型委託', c: r => (r.stats.comms || 0) >= 3, cans: 30 },
  // 花喵幫、本事
  { id: 'gang5', name: '花喵幫全員到齊', desc: '收編全部五隻流浪貓', c: r => gangMembers(r).length >= 5, cans: 40, title: '花喵老大' },
  { id: 'strays10', name: '巷子的朋友', desc: '流浪貓好感 10', c: r => (r.strays || 0) >= 10, cans: 15 },
  { id: 'bridge30', name: '屋頂上的貓', desc: '屋頂過橋 30 次', c: r => (r.stats.bridges || 0) >= 30, cans: 20 },
  { id: 'call30', name: '腹語大師', desc: '喵喵廣播 30 次', c: r => (r.stats.calls || 0) >= 30, cans: 20 },
  { id: 'tunnel20', name: '地道戰', desc: '鑽貓道 20 次', c: r => (r.stats.tunnels || 0) >= 20, cans: 20 },
  // 扭蛋
  { id: 'wd1', name: '第一件新衣', desc: '扭蛋扭到第一件衣服', c: r => Object.keys((r.wardrobe || {}).own || {}).length >= 1, cans: 5 },
  { id: 'wdset', name: '整套穿上', desc: '穿齊一整套套裝', c: r => r.wardrobe && activeSets(r).length >= 1, cans: 20 },
  { id: 'wdssr', name: '傳說降臨', desc: '扭到傳說等級的衣服', c: r => OUTFITS.some(o => o.r === 'SSR' && ((r.wardrobe || {}).own || {})[o.id]), cans: 20 },
  { id: 'wdall', name: '時尚大貓', desc: '衣櫃裡每一件都收集到', c: r => OUTFITS.every(o => ((r.wardrobe || {}).own || {})[o.id]), cans: 80, title: '時尚大貓' },
  { id: 'gear', name: '全副武裝', desc: '老貓攤的本事全部學到滿級', c: r => UPGRADES.every(u => (r.upg[u.id] || 0) >= u.max || (u.need && !r.intel[u.need])), cans: 50 },
];
function checkAchievements(run) {
  const A = run.ach || (run.ach = {}), got = [];
  for (const a of ACH) {
    if (A[a.id]) continue;
    let ok = false; try { ok = a.c(run); } catch (e) { }
    if (!ok) continue;
    A[a.id] = Date.now(); got.push(a);
    if (a.cans) run.cans += a.cans;
    if (a.money) run.money += a.money;
  }
  if (got.length) {
    got.forEach((a, i) => setTimeout(() => { UI.toast(`🏆 成就：${a.name}（${[a.cans ? `罐罐 +${a.cans}` : '', a.money ? money(a.money) : '', a.title ? `稱號「${a.title}」` : ''].filter(Boolean).join('、')}）`, 3000); SFX.play('chime'); }, 600 + i * 3200));
  }
  return got;
}
function achTitle(run) {
  const A = run.ach || {};
  const t = ACH.filter(a => a.title && A[a.id]).sort((a, b) => A[b.id] - A[a.id])[0];
  return t ? t.title : null;
}
function achBookHTML(run) {
  const A = run.ach || {}, n = ACH.filter(a => A[a.id]).length;
  return `<p class="lead">成就重新開始也會留著。解開會給罐罐，有的還有稱號。</p>
    <div class="bk-goal">已解開 <b class="px">${n}/${ACH.length}</b>${achTitle(run) ? `　目前稱號：<b>${esc(achTitle(run))}</b>` : ''}</div>
    <ul class="ach-list">${ACH.map(a => `<li class="${A[a.id] ? 'got' : ''}"><b>${A[a.id] ? '🏆 ' : ''}${esc(a.name)}</b><span>${esc(a.desc)}</span><i>${a.cans ? `罐罐 +${a.cans}` : ''}${a.money ? ` ${money(a.money)}` : ''}${a.title ? ` 稱號` : ''}</i></li>`).join('')}</ul>`;
}
