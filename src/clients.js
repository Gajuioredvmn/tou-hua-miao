// ================= 熟客與大型委託（第二個月起）=================
// 熟客：有名字、有固定想買的花。店裡剛好有，他們會多給一點，來越多次越熟；熟到 VIP 會說出自己的故事、給好處。
// 大型委託：每個月月初接一張大單（婚禮、開幕、告別式、畢業典禮），要在月底前湊齊好幾種花，獎金很高。
const REGULARS = [
  { id: 'chen', name: '陳爺爺', key: 'shopD', want: 'rose', n: 1, ask: '一枝紅玫瑰。給我太太的。', thanks: '她會喜歡的。', vip: ['我太太走了三年了。', '她以前最愛紅玫瑰，每個禮拜我都買一枝放在她照片旁邊。', '謝謝妳一直留著最漂亮的那枝。這個給花喵。'], perk: run => { run.cans += 20; return '陳爺爺塞了 20 個罐罐給花喵'; } },
  { id: 'amy', name: '婚顧 Amy', key: 'shopA', want: 'lisianthus', n: 2, ask: '桔梗兩枝，我拿去給新娘看樣。', thanks: '顏色剛好！', vip: ['妳的花是我合作過最穩的。', '以後我接的婚禮，捧花都找妳做。', '先付妳一筆訂金，下個月的委託獎金也會多一點。'], perk: run => { run.money += 3000; run.flags.amyVip = 1; return '收到 NT$ 3,000 訂金；之後的大型委託獎金 ×1.3'; } },
  { id: 'an', name: '高中生小安', key: 'cust1', want: 'sunflower', n: 1, ask: '向日葵一朵……明天段考，我想要一點勇氣。', thanks: '我會加油的！', vip: ['老闆！我考了全班第一！', '同學都問我是不是有什麼秘密……我就說是這家的向日葵。', '她們說以後都要來這裡買花！'], perk: run => { run.flags.anVip = 1; return '小安的同學們變成常客：上門的客人變多'; } },
  { id: 'cafe', name: '咖啡店老闆娘', key: 'shopE', want: 'jasmine', n: 2, ask: '茉莉兩枝，放在店裡吧台。', thanks: '整間店都香了。', vip: ['客人都問我茉莉哪裡買的，我都說巷子裡的美玲。', '要不要放一些妳的小卡在我店裡？', '以後我每天都跟妳訂一小束。'], perk: run => { run.flags.cafeVip = 1; return '咖啡店每天跟妳訂一小束：每天傍晚多 NT$ 600'; } },
];
const VIP_AT = 3;
function regOf(run) { return run.regulars || (run.regulars = {}); }
function* regularScript(S, n) {
  const run = S.run;
  const forced = run.flags && run.flags.forceReg; if (forced) delete run.flags.forceReg;   // 測試用
  if ((run.month || 1) < 2 || (!forced && Math.random() > 0.55)) return false;
  const R = regOf(run), pool = REGULARS.filter(r => (R[r.id] || 0) < VIP_AT + 1);
  if (!pool.length) return false;
  const r = pool[(n + (run.month || 1)) % pool.length];
  const h = S.customer(r.key);
  yield S.walkIn(h, COUNTER_SPOT2);
  yield* S.talk(h, r.name, [[r.ask]]);
  const have = S.stock.filter(f => f.t === r.want && S.canSell(f)).slice(0, r.n);
  if (have.length >= r.n) {
    let v = 0; for (const f of have) { S.stock.splice(S.stock.indexOf(f), 1); v += flowerValue(run, f.t, f.fresh); }
    v = Math.round(v * 1.5); S.sell(v);
    R[r.id] = (R[r.id] || 0) + 1;
    yield* S.talk(h, r.name, [[r.thanks]]);
    if (R[r.id] === VIP_AT) {
      yield* S.talk(h, r.name, r.vip.map(x => [x]));
      UI.toast(`${r.name}變成 VIP！${r.perk(run)}`, 4000); SFX.play('chime');
      R[r.id] = VIP_AT + 1;
    } else UI.toast(`${r.name}多給了一點（熟客 ${Math.min(R[r.id], VIP_AT)}/${VIP_AT}）`, 2400);
  } else {
    yield* S.talk(h, r.name, [[`今天沒有${FLOWERS[r.want].name}啊……那下次吧。`]]);
    UI.toast(`下次幫${r.name}留${FLOWERS[r.want].name}`, 2400);
  }
  yield S.walkOut(h);
  return true;
}
function regularDaily(run) { return run.flags && run.flags.cafeVip ? 600 : 0; }

// ---------- 大型委託 ----------
const COMMISSIONS = [
  { who: '婚禮', client: '新人小美和阿哲', need: { rose: 4, babys: 3, lisianthus: 2 }, reward: 9000 },
  { who: '咖啡廳開幕', client: '轉角新開的咖啡廳', need: { sunflower: 3, carnation: 3, periwinkle: 3 }, reward: 6000 },
  { who: '告別式', client: '隔壁里的李家', need: { jasmine: 3, magnolia: 2, lisianthus: 2 }, reward: 7000 },
  { who: '畢業典禮', client: '巷口國小', need: { sunflower: 4, carnation: 4 }, reward: 5500 },
  { who: '百貨公司櫥窗', client: '站前百貨', need: { hydrangea: 3, peony: 1, rose: 3 }, reward: 12000 },
  { who: '飯店大廳', client: '巷口的老飯店', need: { orchid: 2, osmanthus: 3, hydrangea: 2 }, reward: 15000 },
];
function commissionOffer(run) {
  const m = run.month || 1;
  const pool = COMMISSIONS.filter(c => !(c.need.orchid && !run.upg.jump) && !(c.need.peony && !run.upg.jump));
  const c = pool[(m * 7 + (run.stats.stolen || 0)) % pool.length];
  const k = 1 + (m - 2) * 0.15;
  return { who: c.who, client: c.client, need: Object.assign({}, c.need), got: {}, reward: Math.round(c.reward * k * (run.flags.amyVip ? 1.3 : 1) / 100) * 100, month: m, done: false };
}
function* commissionScript(S, n) {
  const run = S.run, m = run.month || 1;
  if (m < 2 || n !== 2 || (run.comm && run.comm.month === m)) return false;
  const c = commissionOffer(run);
  const h = S.customer('shopB');
  yield S.walkIn(h, COUNTER_SPOT2);
  const list = Object.keys(c.need).map(t => FLOWERS[t].name + ' ×' + c.need[t]).join('、');
  yield* S.talk(h, c.client, [[`您好，我們是${c.client}。想請妳幫我們準備${c.who}的花。`], [`需要：${list}。這個月底前湊齊就好。`], [`酬勞 ${money(c.reward)}，可以嗎？`]]);
  let ok = false;
  yield S.modal(done => UI.confirm('接下委託？', `${c.who}：${list}\n這個月底（第四晚結束）前湊齊，酬勞 ${money(c.reward)}。湊不齊會丟面子。`, '接', '先不要', v => { ok = v; done(); }));
  if (ok) { run.comm = c; UI.toast(`接下「${c.who}」委託！晚上偷到的花會先留給委託`, 3200); SFX.play('buy'); yield* S.talk(h, c.client, [['太好了，拜託妳了！']]); }
  else { run.comm = { month: m, declined: true }; yield* S.talk(h, c.client, [['好吧……那我們再找找看。']]); }
  yield S.walkOut(h);
  return true;
}
// 天亮前：偷到的花先留給委託（從庫存拿走）
function commissionTake(run, stock) {
  const c = run.comm; if (!c || c.done || c.declined || c.month !== (run.month || 1)) return null;
  const took = {};
  for (const t in c.need) {
    let want = c.need[t] - (c.got[t] || 0);
    for (let i = stock.length - 1; i >= 0 && want > 0; i--) if (stock[i].t === t) { stock.splice(i, 1); c.got[t] = (c.got[t] || 0) + 1; took[t] = (took[t] || 0) + 1; want--; }
  }
  const complete = Object.keys(c.need).every(t => (c.got[t] || 0) >= c.need[t]);
  let paid = 0;
  if (complete) { c.done = true; paid = c.reward; run.stats.comms = (run.stats.comms || 0) + 1; }
  return { took, complete, paid, c };
}
// 月底：沒湊齊
function commissionFail(run) {
  const c = run.comm; if (!c || c.done || c.declined || c.failed) return null;
  c.failed = true; return c;
}
function commissionBriefHTML(run) {
  const c = run.comm; if (!c || c.declined || c.month !== (run.month || 1)) return '';
  if (c.done) return `<div class="newab commbox"><span class="tagnew">委託</span><b>${esc(c.who)}：完成了！</b></div>`;
  return `<div class="newab commbox"><span class="tagnew">委託・月底前</span><b>${esc(c.who)}</b><span class="px comm-r">+${money(c.reward)}</span>
    <div class="comm-need">${Object.keys(c.need).map(t => { const g = Math.min(c.got[t] || 0, c.need[t]); return `<span class="${g >= c.need[t] ? 'ok' : ''}"><img src="${G.icons[t]}" alt="">${FLOWERS[t].name} <b class="px">${g}/${c.need[t]}</b></span>`; }).join('')}</div></div>`;
}
function commissionTallyHTML(R) {
  const r = R.comm; if (!r || !Object.keys(r.took).length && !r.complete) return '';
  return `<div class="newab commbox"><span class="tagnew">委託</span><p>留給「${esc(r.c.who)}」：${Object.keys(r.took).map(t => FLOWERS[t].name + ' ×' + r.took[t]).join('、') || '—'}</p>${r.complete ? `<p><b>委託完成！酬勞 +${money(r.paid)}</b></p>` : ''}</div>`;
}
