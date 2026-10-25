// ================= 老貓攤的道具（罐罐可以一直花的地方）=================
// 每晚出門前可以買，只對今晚有效（小魚乾禮盒是馬上送出去）。一晚每種只能買一個。
const ITEMS = [
  { id: 'catnip', name: '貓薄荷', cost: 8, desc: '今晚賣萌成功率 +20%' },
  { id: 'coffee', name: '夜貓咖啡', cost: 10, desc: '今晚多 30 分鐘' },
  { id: 'bell', name: '幸運鈴鐺', cost: 15, desc: '今晚帶回的花，明天賣價 ×1.2' },
  { id: 'fish', name: '小魚乾禮盒', cost: 12, desc: '送給最生氣的鄰居，他的警戒馬上降 25', now: true },
  { id: 'map', name: '老貓的地圖', cost: 20, desc: '今晚畫面邊緣標出所有還沒偷的花（像嗅花第二級）' },
];
function itemsPending(run) { return run.items || (run.items = {}); }
function itemActive(run, id) { const a = run.act; return !!(a && a.idx === run.nightIdx && a[id]); }
function buyItem(run, id) {
  const it = ITEMS.find(x => x.id === id), P = itemsPending(run);
  if (!it || P[id] || run.cans < it.cost) return null;
  if (it.now) {
    const o = HEAT_OWNERS.slice().sort((a, b) => heatOf(run, b) - heatOf(run, a))[0];
    if (!o || heatOf(run, o) <= 0) return { msg: '大家都沒在生氣，小魚乾留著吧', none: true };
    run.cans -= it.cost; P[id] = 1; heatAdd(run, o, -25);
    return { msg: `把小魚乾禮盒放在${OWNERS[o].person}家門口了（警戒 ${starStr(starsOf(run, o))}）` };
  }
  run.cans -= it.cost; P[id] = 1;
  return { msg: `買了${it.name}：${it.desc}` };
}
// 出門時：買的道具變成今晚的效果
function itemsStartNight(run) {
  const P = itemsPending(run), a = { idx: run.nightIdx };
  for (const k in P) a[k] = 1;
  run.act = a; run.items = {};
}
function itemsHTML(run) {
  const P = itemsPending(run);
  return `<h3>今晚的道具<small>只對今晚有效</small></h3><div class="item-grid">${ITEMS.map(it => `<button type="button" class="item-b ${P[it.id] ? 'on' : ''}" data-item="${it.id}" ${P[it.id] || run.cans < it.cost ? 'disabled' : ''}>
    <b>${it.name}</b><span>${esc(it.desc)}</span><i>${P[it.id] ? '已買' : `<img src="${G.icons.can}" alt="罐罐">${it.cost}`}</i></button>`).join('')}</div>`;
}

// ---------- 分頁上的紅點：有東西買得起 ----------
function shopBadges(run) {
  const st = storeOf(run), m = run.month || 1;
  const storeB = STORE_UPGRADES.some(u => { const lv = st[u.id] || 0; return lv < u.max && run.money >= u.cost[lv] && !(u.mon && m < u.mon[lv]); });
  const g = gardenOf(run), cut = run.cuttings || {};
  const gardenB = gardenOpen(run) && ((GARDEN_LV[g.lv] && run.money >= GARDEN_LV[g.lv].cost) || (g.lv && Array.from({ length: gardenPots(run) }, (_, i) => !g.plots[i]).some(Boolean) && Object.keys(cut).some(t => cut[t] > 0 && plantable(run, t))));
  const catB = UPGRADES.some(u => { const lv = run.upg[u.id] || 0; return lv < u.max && run.cans >= u.cost[lv] && !(u.need && !run.intel[u.need]) && !(u.mon && m < u.mon[lv]); })
    || (gangOpen(run) && GANG.some(x => !gangOf(run)[x.id] && run.cans >= x.cost && (run.strays || 0) >= x.need));
  const N = nmOf(run), nx = NM_LV[N.lv];
  const nmB = nmOpen(run) && nx && run.money >= nx.cost && m >= nx.mon;
  return { store: storeB, garden: gardenB, cat: catB, nm: nmB };
}
