// ================= 白天的隨機事件（第二個月起）=================
// 每天早上有一定機率發生一件事；沒看過的優先，同一件事不會連著出。
// 有的要做選擇，有的會帶來插枝、罐罐、粉絲，或是幫「花喵幫」鋪路（流浪貓好感）。
const DAY_EVENTS = [
  { id: 'kids', name: '校外教學', w: 3, script: evKids },
  { id: 'propose', name: '求婚急件', w: 3, script: evPropose },
  { id: 'market', name: '花市阿姨', w: 2, cond: run => gardenOf(run).lv >= 1, script: evMarket },
  { id: 'influencer', name: '網紅來打卡', w: 2, script: evInfluencer },
  { id: 'granny', name: '神秘老奶奶', w: 2, script: evGranny },
  { id: 'stray', name: '門口的流浪貓', w: 3, script: evStray },
  { id: 'borrow', name: '阿伯來借剪刀', w: 2, cond: run => starsOf(run, 'bo') < 3, script: evBorrow },
  { id: 'rainy', name: '午後雷陣雨', w: 2, script: evRainy },
];
function pickDayEvent(run) {
  if (run.flags && run.flags.forceEv) { const f = DAY_EVENTS.find(x => x.id === run.flags.forceEv); delete run.flags.forceEv; if (f) return f; }   // 測試用
  if ((run.month || 1) < 2) return null;
  if (Math.random() > 0.65) return null;
  const seen = run.evSeen || (run.evSeen = {});
  const pool = DAY_EVENTS.filter(e => e.id !== run.lastEv && (!e.cond || e.cond(run)));
  if (!pool.length) return null;
  const wt = e => e.w * (seen[e.id] ? 1 : 3);
  let r = Math.random() * pool.reduce((s, e) => s + wt(e), 0);
  for (const e of pool) { r -= wt(e); if (r <= 0) return e; }
  return pool[0];
}
function* dayEventScript(S) {
  const run = S.run, e = pickDayEvent(run);
  if (!e) return false;
  run.lastEv = e.id; run.evSeen = run.evSeen || {}; run.evSeen[e.id] = (run.evSeen[e.id] || 0) + 1;
  const wasOn = S.shopOn; S.shopOn = false;
  { let w = 0; yield { update: dt => { w += dt; return w > 5 || !S.shoppers.length; } }; }
  UI.banner('今日事件：' + e.name);
  yield wait(1.0);
  yield* e.script(S);
  UI.hideDialog();
  if (wasOn) S.startShop();
  return true;
}
function askChoice(S, title, text, ok, no) {
  let res = false;
  return { p: S.modal(done => UI.confirm(title, text, ok, no, v => { res = v; done(); })), get v() { return res; } };
}

function* evKids(S) {
  const t = S.customer('cust2');
  yield S.walkIn(t, COUNTER_SPOT2);
  yield* S.talk(t, '帶隊老師', [['不好意思，我們班在做「認識社區」的作業……'], ['小朋友可以每個人買一朵小花嗎？還有……可以摸摸那隻貓嗎？']]);
  const cheap = S.stock.filter(f => S.canSell(f)).sort((a, b) => FLOWERS[a.t].price - FLOWERS[b.t].price).slice(0, 6);
  let v = 0; for (const f of cheap) { S.stock.splice(S.stock.indexOf(f), 1); v += flowerValue(S.run, f.t, f.fresh); }
  S.cat.pose = 'belly'; S.fx.hearts(S.cat.x, S.cat.y - 10, 8); SFX.play('heart');
  yield S.say('花喵被摸得好開心……');
  S.cat.pose = null;
  if (v) S.sell(v);
  S.run.cans += 8;
  UI.toast(`小朋友買了 ${cheap.length} 朵花${v ? '（+' + money(Math.round(v)) + '）' : ''}，還塞給花喵 8 個罐罐`, 3200);
  yield S.walkOut(t);
}
function* evPropose(S) {
  const g = S.customer('shopA');
  yield S.walkIn(g, COUNTER_SPOT2);
  yield* S.talk(g, '緊張的年輕人', [['老闆！我、我今天晚上要求婚！'], ['有沒有紅玫瑰？三朵就好，多少錢都可以！']]);
  const roses = S.stock.filter(f => f.t === 'rose' && S.canSell(f)).slice(0, 3);
  if (roses.length >= 3) {
    let v = 0; for (const f of roses) { S.stock.splice(S.stock.indexOf(f), 1); v += flowerValue(S.run, f.t, 1); }
    v = Math.round(v * 3);
    yield S.say('有！我幫你包得漂漂亮亮的。祝你成功！');
    S.sell(v); S.fx.hearts(g.x, g.y - 16, 10); SFX.play('heart');
    yield* S.talk(g, '緊張的年輕人', [['謝謝！如果她答應了，婚禮的花也找妳！']]);
    UI.toast(`求婚玫瑰賣了 ${money(v)}（三倍價）`, 3000);
    S.run.flags.proposeOk = (S.run.flags.proposeOk || 0) + 1;
  } else {
    yield S.say(roses.length ? `只剩 ${roses.length} 朵玫瑰……` : '今天沒有紅玫瑰……');
    yield* S.talk(g, '緊張的年輕人', [['沒關係……我再去別家問問看。'], ['（垂頭喪氣地走了）']]);
    UI.toast('下次店裡多留幾朵紅玫瑰吧', 2400);
  }
  yield S.walkOut(g);
}
function* evMarket(S) {
  const run = S.run, a = S.customer('shopE');
  const t = pick(['tanhua', 'peony', 'orchid', 'hydrangea', 'osmanthus']);
  const price = Math.round(FLOWERS[t].price * 2.5 / 50) * 50;
  yield S.walkIn(a, COUNTER_SPOT2);
  yield* S.talk(a, '花市的阿姨', [['聽說妳在頂樓種花？我這裡有一支' + FLOWERS[t].name + '的插枝，品種很好喔。'], [`算妳 ${money(price)} 就好，要不要？`]]);
  const c = askChoice(S, '買插枝？', `${FLOWERS[t].name}插枝 ×1，${money(price)}${GARDEN_RARE.includes(t) && gardenOf(run).lv < 5 ? '（要玻璃花房才種得活）' : ''}`, '買', '不用了');
  yield c.p;
  if (c.v && run.money >= price) {
    run.money -= price; run.cuttings = run.cuttings || {}; run.cuttings[t] = (run.cuttings[t] || 0) + 1;
    SFX.play('buy'); UI.toast(`買到${FLOWERS[t].name}的插枝！傍晚可以種到頂樓`, 2800);
    yield* S.talk(a, '花市的阿姨', [['好好照顧它喔～']]);
  } else {
    yield* S.talk(a, '花市的阿姨', [[c.v ? '錢不夠啊……下次吧。' : '好啦，下次再來找妳。']]);
  }
  yield S.walkOut(a);
}
function* evInfluencer(S) {
  const i = S.customer('shopF');
  yield S.walkIn(i, COUNTER_SPOT2);
  yield* S.talk(i, '網紅', [['哈囉大家好～今天我來到一間超可愛的花店！'], ['老闆，可以跟貓咪拍一張嗎？我有二十萬粉絲喔！']]);
  S.cat.pose = 'belly'; S.fx.hearts(S.cat.x, S.cat.y - 10, 6); SFX.play('heart');
  yield wait(1.0); S.cat.pose = null;
  S.run.flags.buzz = (S.run.nightIdx || 0) + 2;
  UI.toast('影片爆紅了！今天和明天上門的客人變多', 3000);
  yield S.walkOut(i);
}
function* evGranny(S) {
  const run = S.run, g = S.customer('cust1');
  yield S.walkIn(g, COUNTER_SPOT2);
  yield* S.talk(g, '神秘的老奶奶', [['這隻貓……長得跟我年輕時養的一模一樣。'], ['來，這個籤給你。好好收著。']]);
  const r = Math.random();
  if (r < 0.34) { run.cans += 20; UI.toast('上上籤：罐罐 +20', 2800); }
  else if (r < 0.67) { const t = pick(['tanhua', 'orchid', 'peony']); run.cuttings = run.cuttings || {}; run.cuttings[t] = (run.cuttings[t] || 0) + 1; UI.toast(`上籤：籤裡包著一支${FLOWERS[t].name}的插枝！`, 3000); }
  else { run.money += 2000; UI.toast('大吉：籤裡夾著 NT$ 2,000……老奶奶說是「給貓的零用錢」', 3200); }
  SFX.play('chime');
  yield* S.talk(g, '神秘的老奶奶', [['……我們還會再見面的。']]);
  yield S.walkOut(g);
}
function* evStray(S) {
  const run = S.run;
  const who = pick(['三花貓', '黑貓', '獨眼的大橘', '小白']);
  yield S.say(`門口有一隻${who}在探頭探腦……花喵，是你的朋友嗎？`);
  const c = askChoice(S, '分罐罐給牠？', `給${who} 3 個罐罐（現在有 ${run.cans} 個）`, '分給牠', '算了');
  yield c.p;
  if (c.v && run.cans >= 3) {
    run.cans -= 3; run.strays = (run.strays || 0) + 1;
    run.strayNames = run.strayNames || []; if (!run.strayNames.includes(who)) run.strayNames.push(who);
    SFX.play('meow'); S.fx.hearts(S.cat.x, S.cat.y - 10, 4);
    yield S.say(`${who}吃得好開心，蹭了花喵一下才走。`);
    UI.toast(`巷子裡的流浪貓對花喵的好感 +1（已經 ${run.strays}）`, 3000);
  } else {
    yield S.say(`${who}看了花喵一眼，轉身走了。`);
  }
}
function* evBorrow(S) {
  const run = S.run, b = S.customer('bo');
  yield S.walkIn(b, COUNTER_SPOT2);
  yield* S.talk(b, '阿伯', [['美玲啊，妳的花剪借我一下。我家的桂花長太亂了。'], ['好啊，阿伯慢慢用～', null, 'M']]);
  yield wait(0.8);
  yield* S.talk(b, '阿伯', [['還妳。剪下來的枝妳拿去插，丟掉可惜。']]);
  heatAdd(run, 'bo', -12);
  run.cuttings = run.cuttings || {}; run.cuttings.osmanthus = (run.cuttings.osmanthus || 0) + 2;
  UI.toast('拿到桂花插枝 ×2，阿伯的戒心也鬆了一點', 2800);
  yield S.walkOut(b);
}
function* evRainy(S) {
  yield S.say('外面突然下大雨了……客人應該會少一點。');
  const st = storeOf(S.run);
  if ((st.expand || 0) >= 2) {
    yield S.say('還好有騎樓座位，躲雨的人都進來買咖啡了！');
    const v = 6 * COFFEE_PRICE; S.sell(v); UI.toast(`躲雨的客人買了 6 杯咖啡（+${money(v)}）`, 2600);
  } else {
    S.run.flags.rainDay = (S.run.nightIdx || 0) + 1;
    yield S.say('……要是門口有遮雨的騎樓就好了。');
  }
}
