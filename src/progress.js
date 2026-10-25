// ================= 月循環、熟門熟路、被發現的後果 =================
// 成長路線：一朵一朵偷 →（偷熟了）熟門熟路一鍵帶回 →（偷太兇）鄰居警戒、上門盤問、裝防貓設施
// 每個月繳一次房租，房租一個月比一個月高；每個月有一個節慶，行情跟著變

const CN_D = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
function cn(n) { n = Math.max(0, Math.floor(n)); if (n <= 10) return n === 10 ? '十' : CN_D[n]; if (n < 20) return '十' + CN_D[n - 10]; const t = Math.floor(n / 10), o = n % 10; return CN_D[t] + '十' + (o ? CN_D[o] : ''); }

// ---------- 房租 ----------
function rentFor(m) { return 20000 + (m - 1) * 10000 + (m - 1) * (m - 2) * 1000; }
function rentDue(run) { return rentFor(run.month || 1) + (run.debt || 0); }
function monthPre(run) { return (run.month || 1) > 1 ? `第${cn(run.month)}個月・` : ''; }

// ---------- 每個月的節慶 ----------
const MONTH_THEMES = [
  { id: 'valentine', name: '情人節', boost: { rose: 1.8, lisianthus: 1.5, babys: 1.3 }, recipe: 'love', line: '這個月有情人節！紅玫瑰、桔梗會很好賣。' },
  { id: 'mother', name: '母親節', boost: { carnation: 2, babys: 1.4, hydrangea: 1.3 }, recipe: 'mom', line: '這個月有母親節，康乃馨一定搶手！' },
  { id: 'qixi', name: '七夕', boost: { rose: 1.5, hydrangea: 1.5, lisianthus: 1.5 }, recipe: 'dream', line: '七夕快到了，浪漫一點的花都會漲。' },
  { id: 'moon', name: '中秋', boost: { osmanthus: 2, sunflower: 1.4, tanhua: 1.3 }, recipe: 'scent', line: '中秋節！桂花香香的，大家都想買。' },
];
function themeOf(run) { const m = (run && run.month) || 1; return m <= 1 ? null : MONTH_THEMES[(m - 2) % MONTH_THEMES.length]; }
function themeBoost(run, t) { const th = themeOf(run); return (th && th.boost[t]) || 1; }

// ---------- 每晚的規則：第一個月照劇本，之後每個月重新排 ----------
function nightRulesFor(run, n) {
  const m = run.month || 1;
  if (m <= 1) return NIGHT_RULES[n];
  const P = run.plan || (run.plan = {});
  if (!P[m]) {
    const evs = ['clear', 'rain', 'bbq', 'outage'].sort(() => Math.random() - 0.5);
    const slots = [[1405, 1445], [1470, 1510], [1530, 1570]];
    P[m] = evs.map((ev, i) => ({ event: ev, ability: null, boLight: true, patrol: slots.slice(0, clamp(Math.floor((m + i) / 2), 1, 3)), butler: i === 3 || Math.random() < 0.25 }));
  }
  return P[m][n - 1];
}
function eventInfo(run, ev) {
  const E = EVENTS[ev];
  if (ev === 'bbq' && (run.month || 1) > 1 && !(themeOf(run) && themeOf(run).id === 'moon')) return { name: '空地辦桌', desc: E.desc.replace('鄰居在空地烤肉', '鄰居在空地辦桌').replace('烤肉的吵鬧聲', '辦桌的吵鬧聲') };
  return E;
}

// ---------- 鄰居：警戒星 ----------
const OWNERS = {
  wang: { name: '王太太家', person: '王太太', key: 'wang' },
  lin: { name: '林先生家', person: '林先生', key: 'lin' },
  bo: { name: '阿伯家', person: '阿伯', key: 'bo' },
  public: { name: '社區花圃', person: '里長', key: 'chief' },
  mansion: { name: '大宅', person: '管家', key: 'butler' },
  empty: { name: '空屋', person: null, key: null },
};
const HEAT_OWNERS = ['wang', 'lin', 'bo', 'public', 'mansion'];
// 熱度 0～100：被偷的花 +6（大宅 +3）、撒嬌失敗 +35、叼著他家的花被看到 +12；沒去偷 −18／晚、撒嬌成功 −10、送花賠罪 −45
const HEAT = { flower: 6, mansion: 3, cuteFail: 35, cuteWin: -10, seen: 12, decay: 18, apology: 45, visitWin: -15, visitFail: 10, visitNone: -10 };
const STAR_AT = [30, 55, 80];
const STAR_EFFECT = ['', '隔天會到店裡來問問題', '院子裝了防貓設施，熟門熟路也不管用了', '門口貼「偷花必究」、盯得更緊，里長還要來約談'];
function heatOf(run, o) { return (run.heat && run.heat[o]) || 0; }
function starsOf(run, o) { const h = heatOf(run, o); return h >= STAR_AT[2] ? 3 : h >= STAR_AT[1] ? 2 : h >= STAR_AT[0] ? 1 : 0; }
function heatAdd(run, o, v) {
  if (!HEAT_OWNERS.includes(o)) return 0;
  const H = run.heat || (run.heat = {}), s0 = starsOf(run, o);
  H[o] = clamp(Math.round((H[o] || 0) + v), 0, 100);
  return starsOf(run, o) - s0;
}
function starStr(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
// 被誰看到 → 算哪一家的警戒
function ownerOfViewer(v) {
  if (!v) return null;
  if (v.type === 'party') return v.key === 'wang' ? 'wang' : 'public';
  if (v.owner) return v.owner;
  return ({ wang: 'wang', lin: 'lin', bo: 'bo', patrol: 'public', chief: 'public', butler: 'mansion', camera: 'mansion' })[v.cuteKey] || null;
}
// 三顆星的人家門口插「偷花必究」（格子座標）
const SIGN_SPOTS = { lin: [8.45, 13.3], wang: [6.45, 24.3], bo: [8.45, 35.3], mansion: [8.5, 41.7] };

// ---------- 熟門熟路 ----------
const MASTER_AT = 6;   // 從同一家帶回 6 朵就摸熟了
// 第一個月一朵一朵自己偷；第二個月起，摸熟的人家才能「熟門熟路」
function raidUnlocked(run) { return (run.month || 1) >= 2; }
function familiarOf(run, o) { return (run.familiar && run.familiar[o]) || 0; }
function isMastered(run, o) { return familiarOf(run, o) >= MASTER_AT; }
function masteredList(run) { return Object.keys(OWNERS).filter(o => isMastered(run, o)); }

// ---------- 晚上結算時：熱度、熟悉度 ----------
// 回傳要在早上結算畫面顯示的變化
function settleNight(run, deposited, sc) {
  const H = run.heat || (run.heat = {}), F = run.familiar || (run.familiar = {});
  const before = {}; for (const o of HEAT_OWNERS) before[o] = starsOf(run, o);
  const taken = {}, newMaster = [];
  for (const f of deposited) {
    if (!f.owner) continue;
    taken[f.owner] = (taken[f.owner] || 0) + 1;
    if (!f.raid) { const was = isMastered(run, f.owner); F[f.owner] = (F[f.owner] || 0) + 1; if (!was && isMastered(run, f.owner)) newMaster.push(f.owner); }
  }
  for (const o of HEAT_OWNERS) {
    if (taken[o]) heatAdd(run, o, taken[o] * (o === 'mansion' ? HEAT.mansion : HEAT.flower));
    else if (!(sc && sc.heatHit && sc.heatHit[o])) heatAdd(run, o, -HEAT.decay);
  }
  const changes = HEAT_OWNERS.map(o => ({ o, from: before[o], to: starsOf(run, o), taken: taken[o] || 0 })).filter(c => c.from !== c.to || (c.to > 0));
  return { changes, newMaster };
}

// ---------- 晚上：熟門熟路（在花店貓門按一下，花喵自己出門偷回來） ----------
NightScene.prototype.raidOptions = function () {
  const run = this.run, cap = this.capacity();
  return masteredList(run).map(o => {
    const pots = this.pots.filter(p => p.owner === o && p.avail && !p.gone && p.t !== 'lily' && !(p.t === 'tanhua' && this.tanhuaState() !== 'tanhua') && (!p.top || this.abil.has('climb')));
    const trips = Math.ceil(pots.length / cap), mins = pots.length ? 8 + trips * 12 : 0;
    let why = null;
    if (!pots.length) why = '今晚沒有花可以偷了';
    else if (starsOf(run, o) >= 2) why = (REACTIONS[o] ? REACTIONS[o].text.replace(/^.+?在院子/, '院子') : '戒備變嚴了') + '，熟門熟路不管用';
    else if (o === 'mansion' && !run.upg.jump) why = '圍牆太高（要先學「跳高高」）';
    else if (this.time + mins > this.end - 4) why = '時間不夠了';
    return { id: o, name: OWNERS[o].name, pots, mins, trips, ok: !why, why, value: pots.reduce((s, p) => s + flowerValue(run, p.t, 1), 0) };
  });
};
NightScene.prototype.openRaid = function () {
  const opts = this.raidOptions();
  if (!opts.length) return;
  this.mode = 'order'; this.stopWait(); Input.release();
  UI.setAction(null); UI.setSkills([]); UI.setWait(false, false);
  SFX.play('ui');
  UI.raidChoice(opts, this.capacity(), id => {
    if (this.mode === 'order') this.mode = 'play';
    if (id) this.startRaid(id);
  });
};
NightScene.prototype.startRaid = function (o) {
  const opt = this.raidOptions().find(x => x.id === o);
  if (!opt || !opt.ok) return;
  const c = this.cat;
  this.raid = { owner: o, name: opt.name, start: this.time, until: this.time + opt.mins, mins: opt.mins, flowers: opt.pots.map(p => ({ t: p.t, fresh: 1, pot: p })), speed: Math.max(4, opt.mins / (2.6 * MIN_PER_SEC)) };
  for (const p of opt.pots) p.avail = false;
  this.mode = 'raid'; Input.release(); c.moving = false; c.inv = 999; c.pose = null; c.box = null;
  UI.setAction(null); UI.setSkills([]); UI.setWait(false, false);
  SFX.play('jump'); SFX.play('meow');
  this.stats.raids = (this.stats.raids || 0) + 1;
};
NightScene.prototype.updateRaid = function (dt) {
  const R = this.raid, c = this.cat;
  this.time += dt * MIN_PER_SEC * R.speed;
  this.schedules();
  const sub = 3, sdt = dt * R.speed / sub;
  for (let i = 0; i < sub; i++) { this.updateNPCs(sdt); updateNightPlus(this, sdt, 0); }
  for (const v of this.viewers) if (v) v.susp = Math.max(0, v.susp - 0.4 * sdt * sub);
  c.t += dt; c.moving = false;
  UI.meter(true, '熟門熟路：' + R.name, clamp((this.time - R.start) / R.mins, 0, 1), `花喵出門偷花中……${R.flowers.length} 朵`);
  if (this.time >= R.until) this.finishRaid();
  else if (this.time >= this.end) { this.finishRaid(); }
};
NightScene.prototype.finishRaid = function (fromFinish) {
  const R = this.raid, c = this.cat;
  this.raid = null; c.inv = 0.6;
  if (!fromFinish) this.mode = 'play';
  UI.meter(false);
  const book = bookOf(this.run);
  let v = 0;
  for (const f of R.flowers) {
    this.deposited.push({ t: f.t, fresh: 1, owner: f.pot.owner, idx: f.pot.idx, raid: true });
    v += flowerValue(this.run, f.t, 1);
    book.flowers[f.t] = (book.flowers[f.t] || 0) + 1;
  }
  SFX.play('drop'); setTimeout(() => SFX.play('coin'), 200);
  this.fx.text(c.x, c.y - 16, '+' + money(v), '#ffd25a');
  this.fx.hearts(c.x, c.y - 10, 3);
  UI.toast(`熟門熟路：從${R.name}帶回 ${R.flowers.map(f => FLOWERS[f.t].name).join('、')}（${R.mins} 分鐘）`, 3200);
  this.checkOrders(R.flowers.map(f => f.t));
  if (!fromFinish && this.time >= this.end) this.finish(true);
};

// ---------- 晚上：警戒變化 ----------
NightScene.prototype.heatEvent = function (o, v, why) {
  if (!o || !HEAT_OWNERS.includes(o)) return;
  const run = this.run;
  const ds = heatAdd(run, o, v);
  if (v > 0) { this.heatHit = this.heatHit || {}; this.heatHit[o] = true; }
  const st = starsOf(run, o), who = OWNERS[o].person;
  if (why === 'seen') UI.toast(`${who}好像看到你叼著他家的花了！（警戒 ${starStr(st)}）`, 2800);
  else if (ds > 0) UI.toast(`${who}的警戒 ${starStr(st)}：${STAR_EFFECT[st]}`, 3200);
  else if (ds < 0) setTimeout(() => UI.toast(`${who}覺得你太可愛，不太懷疑了（警戒 ${starStr(st)}）`, 2600), 1400);
};

// ---------- 白天：鄰居上門盤問 ----------
const VISIT_LINES = {
  wang: { open: '美玲啊，我家院子的花最近一直少……我來看看妳店裡的花喔。', none: '嗯……好像沒有我家的花。是我多心了，打擾啦。', win: '哎唷，是我多心了。妳家的花真的好新鮮！', fail: '等一下！這明明是我家的', bye: '……妳家那隻貓，晚上要看好喔。' },
  lin: { open: '老闆娘，我家院子的花最近常常不見。我看一下妳的花，不介意吧？', none: '……沒有。打擾了。', win: '嗯，應該是小柴自己啃的吧。', fail: '這是我家的', bye: '我會裝監視器的。' },
  bo: { open: '美玲，阿伯家的花又不見了……我來看看喔。', none: '沒有啦沒有啦，阿伯老花眼。', win: '唉，是我記錯了，這盆不是我家的。', fail: '這盆我認得！是我家的', bye: '阿伯今晚會拿手電筒顧院子。' },
  public: { open: '美玲，社區花圃的花最近一直被偷，里長來看看。', none: '妳這裡沒有花圃的花，那就好。', win: '好好好，跟妳沒關係。巡守隊會再加強。', fail: '這不是花圃種的', bye: '下次再這樣，里長要開罰了喔。' },
  mansion: { open: '老闆娘，大宅溫室的花有短少。主人請我來看看。', none: '……沒有本宅的花。失禮了。', win: '看來是我弄錯了。告辭。', fail: '這株是本宅溫室的', bye: '本宅的監視器會再加強。' },
};
// 盤問時對方會在店裡走動，停留點裡一半看得到那桶花
const INSPECT_CANDS = [[6.0, 10.9], [4.4, 12.3], [2.8, 9.6], [5.6, 13.5], [9.6, 12.2], [3.9, 13.0], [7.8, 11.4], [3.2, 7.4], [8.4, 13.6], [10.6, 10.4], [7.0, 12.6], [2.6, 11.6], [8.0, 9.8], [11.4, 12.8]];
function inspectRoute(S, tx, ty) {
  const view = [], other = [];
  for (const [x, y] of INSPECT_CANDS) {
    if (S.solid(x * TS, y * TS)) continue;
    const d = Math.hypot(x - tx, y - 0.33 - ty);
    const sees = d > 1.1 && d < 3.4 && lineOfSight(S.map, x * TS, y * TS - 4, tx * TS, ty * TS, null);
    (sees ? view : other).push({ p: [x, y], a: sees ? Math.atan2(ty - (y - 0.33), tx - x) : rnd(-Math.PI, Math.PI), d });
  }
  view.sort(() => Math.random() - 0.5); other.sort(() => Math.random() - 0.5);
  const route = [];
  for (let i = 0; i < 3; i++) { if (other[i]) route.push(other[i]); if (view[i]) route.push(view[i]); }
  // 走過去細看的位置：從那桶花往最近的停留點退 1.5 格左右，要站在走得到的地板上
  const best = view.slice().sort((a, b) => a.d - b.d)[0];
  let near = [tx, ty + 1.6];
  if (best) {
    const dx = best.p[0] - tx, dy = best.p[1] - ty, l = Math.hypot(dx, dy) || 1;
    for (let k = 1.4; k <= l; k += 0.2) { const x = tx + dx / l * k, y = ty + dy / l * k; if (!S.solid(x * TS, y * TS) && !S.solid(x * TS, (y - 0.3) * TS)) { near = [x, y]; break; } near = best.p; }
  }
  return { route: route.length ? route : [{ p: [6.0, 10.9], a: -Math.PI / 2 }], near };
}
function* visitScript(S, owner) {
  const run = S.run, O = OWNERS[owner], L = VISIT_LINES[owner], M = S.meiling;
  const st = starsOf(run, owner);
  const wasOn = S.shopOn; S.shopOn = false;
  { let w = 0; yield { update: dt => { w += dt; return w > 6 || !S.shoppers.length; } }; }
  // 三顆星：里長來約談、罰錢
  if (st >= 3) {
    const ch = S.customer('chief');
    yield S.walkIn(ch);
    const fine = 500 * (run.month || 1);
    yield* S.talk(ch, '里長', [
      [owner === 'public' ? '美玲，社區花圃的花被偷得太誇張了。' : `美玲，${O.person}來找我投訴，說他家的花一直被偷。`],
      ['有人看到一隻花貓……就是妳家這隻吧？'],
      [`這次先罰 ${money(fine)}，再有下次我就要報警了喔！`],
      ['對不起對不起……', null, 'M'],
    ]);
    run.money -= fine; heatAdd(run, owner, -(heatOf(run, owner) - 62));
    UI.toast(`被里長罰了 ${money(fine)}。${O.person}的氣消了一點（警戒 ${starStr(starsOf(run, owner))}）`, 3400);
    SFX.play('fail');
    yield S.walkOut(ch);
    if (wasOn) S.startShop();
    return;
  }
  const who = S.customer(O.key);
  yield S.walkIn(who);
  const mine = S.stock.filter(f => f.owner === owner);
  const t = mine.length ? mine.slice().sort((a, b) => FLOWERS[b.t].price - FLOWERS[a.t].price)[0].t : null;
  const d = t && S.displays.find(x => x.t === t && !x.filler);
  if (!d) {
    yield* S.talk(who, O.person, [[L.open], [L.none]]);
    heatAdd(run, owner, HEAT.visitNone);
    UI.toast(`${O.person}沒找到他家的花（警戒 ${starStr(starsOf(run, owner))}）`, 2600);
    yield S.walkOut(who);
    if (wasOn) S.startShop();
    return;
  }
  yield* S.talk(who, O.person, [[L.open], ['好啊好啊，我去後面泡杯茶給你～', null, 'M']]);
  UI.hideDialog();
  M.goTo([[7.5 * TS, 4.4 * TS], [7.5 * TS, 3.2 * TS]], 40);
  yield until(() => !M.path.length);
  M.hidden = true; SFX.play('door');
  const tx = d.x / TS, ty = (d.y - (d.h || 0) * 7 - 6) / TS;
  const R = inspectRoute(S, tx, ty);
  S.startHide({ who, name: O.person, target: { x: d.x, y: d.y - (d.h || 0) * 7 }, route: R.route, near: R.near, t: 25, label: O.person + '的懷疑', sub: '美玲泡茶中', start: clamp(0.1 + st * 0.12, 0, 0.5), toast: `別讓${O.person}認出那桶${FLOWERS[t].name}！擋住他的視線、撥倒東西引開，或對他賣萌` });
  yield until(() => S.hide && S.hide.done);
  const res = S.hide.result;
  M.hidden = false; M.x = 7.5 * TS; M.y = 3.4 * TS;
  M.goTo([[7.5 * TS, 4.6 * TS], [11.5 * TS, 6.6 * TS]], 40);
  if (res === 'win') {
    yield* S.talk(who, O.person, [[L.win]]);
    heatAdd(run, owner, HEAT.visitWin);
    UI.toast(`${O.person}放心回家了（警戒 ${starStr(starsOf(run, owner))}）`, 2600);
    SFX.play('heart');
  } else {
    const comp = Math.max(300, Math.round(mine.reduce((s, f) => s + flowerValue(run, f.t, f.fresh), 0) * 1.2));
    yield* S.talk(who, O.person, [[L.fail + FLOWERS[t].name + '！'], ['對、對不起！我賠給你……', null, 'M'], [L.bye]]);
    const keep = S.stock.filter(f => f.owner !== owner); S.stock.length = 0; S.stock.push(...keep);
    run.money -= comp; heatAdd(run, owner, HEAT.visitFail);
    S.layoutDisplays && S.layoutDisplays();
    UI.toast(`${O.person}把他家的花全拿回去，美玲還賠了 ${money(comp)}（警戒 ${starStr(starsOf(run, owner))}）`, 3600);
    SFX.play('fail');
  }
  yield S.walkOut(who);
  S.hide = null;
  if (wasOn) S.startShop();
}
// 今天誰會上門：警戒最高（至少一顆星）的那一家
function pickVisit(run) {
  let best = null, bh = 0;
  for (const o of HEAT_OWNERS) { if (starsOf(run, o) < 1) continue; const h = heatOf(run, o); if (h > bh) { bh = h; best = o; } }
  return best;
}

// ---------- 白天：送花賠罪 ----------
function apologyTargets(run) { return HEAT_OWNERS.filter(o => starsOf(run, o) >= 1); }
function apologize(run, o) {
  heatAdd(run, o, -HEAT.apology);
  run.stats.apology = (run.stats.apology || 0) + 1;
  return starsOf(run, o);
}

// ---------- 白天：第二個月起的訂單（照節慶挑花） ----------
const ORDER_WHO = ['熟客', '上班族', '咖啡店老闆', '婚禮花藝師', '學生', '隔壁巷的阿姨', '飯店採購'];
function genOrder(run, n) {
  const th = themeOf(run), m = run.month || 1;
  const pool = FLOWER_ORDER.filter(t => t !== 'lily' && !(t === 'orchid' && !run.upg.jump));
  const boosted = th ? Object.keys(th.boost).filter(t => pool.includes(t)) : [];
  const t = boosted.length && Math.random() < 0.6 ? pick(boosted) : pick(pool);
  const each = Math.random() < 0.35 || FLOWERS[t].price >= 800;
  const k = 1 + (m - 1) * 0.25;
  const nn = each ? 2 + Math.floor(Math.random() * 2) : (FLOWERS[t].price >= 500 ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3));
  const base = FLOWERS[t].price;
  const reward = Math.round((each ? base * 0.6 : base * nn * 0.5 + 200) * k / 50) * 50;
  return { id: 'g' + m + '-' + n + '-' + Math.floor(Math.random() * 1e6), who: pick(ORDER_WHO), t, n: nn, mode: each ? 'each' : 'all', reward };
}
