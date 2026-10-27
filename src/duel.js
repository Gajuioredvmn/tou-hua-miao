// ================= 花界風雲榜：十大高手 =================
// 第二個月起，每個月月初會收到一封挑戰帖：風雲榜上排在你前面的高手，第四天早上上門「花藝論劍」。
// 論劍＝三招：對手先出一束花，你用店裡的花回一束。每招有題目（配色、指定花、包裝、限時……），
// 合題目的花束功力 ×1.3，不合只剩 ×0.5。三招贏兩招（一刀流只比一招）就打敗他，學到他的獨門秘笈（永久效果），
// 牆上的「花界風雲榜」也會劃掉他的名字。輸了，下個月他會再來（一樣的題目，知道要偷什麼了）。
// 十大高手全部打敗以後是「擂台」：每個月有人來挑戰你的天下第一。

let DU_RAW = false;   // 算高手的花束時，不吃你的秘笈加成

const T_ = {
  min: n => ({ d: `至少 ${n} 枝花`, ok: s => s.stems.length >= n }),
  exact: n => ({ d: `剛好 ${n} 枝花`, ok: s => s.stems.length === n }),
  has: (t, n = 1) => ({ d: `要有${FLOWERS[t].name}${n > 1 ? ' ' + n + ' 枝' : ''}`, ok: s => s.stems.filter(x => x === t).length >= n }),
  scheme: k => ({ d: `配色要是「${SCHEMES[k].name}」`, ok: (s, e) => e.scheme === k }),
  recipe: id => { const r = RECIPES.find(x => x.id === id); return { d: `要包成「${r.name}」（${Object.keys(r.need).map(t => FLOWERS[t].name + (r.need[t] > 1 ? '×' + r.need[t] : '')).join('＋')}）`, ok: (s, e) => !!e.recipe && e.recipe.id === id }; },
  paper: p => ({ d: `用${PAPERS[p].name}包`, ok: s => s.paper === p }),
  ribbon: r => ({ d: `綁${RIBBONS[r].name}`, ok: s => s.ribbon === r }),
  scent: n => ({ d: `至少 ${n} 枝香花`, ok: s => s.stems.filter(t => FLOWERS[t].fragrant).length >= n }),
  hybrid: () => ({ d: '要有自己配出來的品種', ok: s => s.stems.some(t => FLOWERS[t].hybrid) }),
  same: () => ({ d: '全部同一種花', ok: s => s.stems.length > 0 && s.stems.every(t => t === s.stems[0]) }),
  free: () => ({ d: '沒有限制，比誰的花束好', ok: () => true }),
  and: (...xs) => ({ d: xs.map(x => x.d).join('，'), ok: (s, e) => xs.every(x => x.ok(s, e)) }),
};
const SP = (stems, paper = 'kraft', ribbon = 'twine') => ({ stems, paper, ribbon });

// 排名從第十名到第一名
const MASTERS = [
  { id: 'ji', rank: 10, lv: 2, nick: '滿天星', name: '阿吉', shop: '夜市花攤', skin: 'shopC', col: '#9ad0ff', k: 0.95,
    style: '夜市擺攤二十年，什麼花都賣，一把一把包得又快又大',
    intro: ['美玲老闆！聽說妳的花店最近很紅喔？', '我是夜市擺花攤的阿吉，風雲榜第十名。', '來來來，切磋一下！我們夜市人講究的就是一個「多」！'],
    win: ['哇靠……我擺攤二十年，第一次被包花包到說不出話。', '這招「滿天星訣」教妳：花束多塞一枝，客人看了就開心！'],
    lose: ['哈哈，小姐，花束要大把才有人買啦！', '下個月我再來，妳多準備一點花吧！'],
    rounds: [
      { t: '多多益善', c: T_.min(5), spec: SP(['periwinkle', 'periwinkle', 'carnation', 'bougain', 'babys']) },
      { t: '夜市的星星', c: T_.has('babys'), spec: SP(['babys', 'babys', 'lisianthus'], 'white', 'ivory') },
      { t: '熱熱鬧鬧', c: T_.scheme('rainbow'), spec: SP(['sunflower', 'hydrangea', 'rose']) },
    ],
    perk: { name: '滿天星訣', desc: '花束最多可以包 6 枝（多一枝花，賣價也更高）' } },
  { id: 'rose', rank: 9, lv: 4, nick: '刺玫瑰', name: 'Rose 姐', shop: '玫瑰專賣店「荊棘」', skin: 'shopE', col: '#ff6a7a', k: 1.0,
    style: '只賣玫瑰的店，紅玫瑰黑紙包裝是她的招牌',
    intro: ['妳就是那個「花店小精靈」的老闆？', '我是 Rose，風雲榜第九。我這輩子只碰玫瑰。', '玫瑰是有刺的。拿得起，才配說自己會包花。'],
    win: ['……妳的玫瑰，比我的還要倔強。', '「玫瑰刺」給妳：以後妳賣的紅玫瑰，每一枝都值得更高的價錢。'],
    lose: ['玫瑰不是隨便插一插就好的。', '下個月，帶真正的紅玫瑰來見我。'],
    rounds: [
      { t: '兩枝紅', c: T_.has('rose', 2), spec: SP(['rose', 'rose', 'babys']) },
      { t: '熱戀', c: T_.recipe('love'), spec: SP(['rose', 'rose', 'rose'], 'kraft', 'red') },
      { t: '黑夜裡的紅', c: T_.paper('black'), spec: SP(['rose', 'rose', 'jasmine'], 'black', 'red') },
    ],
    perk: { name: '玫瑰刺', desc: '紅玫瑰賣價 ×1.4' } },
  { id: 'kui', rank: 8, lv: 6, nick: '乾燥花仙', name: '小葵', shop: '網紅乾燥花店「葵の花」', skin: 'shopA', col: '#ffb3d0', k: 1.05,
    style: '十萬粉絲的網紅花藝師，粉嫩、同色系、拍起來好看最重要',
    intro: ['哈囉大家好～我現在在一間超可愛的老花店！（對著手機）', '我是小葵，風雲榜第八。今天直播踢館喔～', '網友們幫我們評分！誰的花比較好拍，就是誰贏！'],
    win: ['網友都在刷「老闆娘好強」……好啦我認輸。', '我的「打卡術」教妳：以後每天都有網友來打卡、幫妳宣傳。'],
    lose: ['謝謝大家收看～下個月再來這間店直播喔！', '老闆娘，妳的花要「好拍」一點啦。'],
    rounds: [
      { t: '同色系濾鏡', c: T_.scheme('mono'), spec: SP(['carnation', 'carnation', 'periwinkle'], 'pink', 'pink') },
      { t: '少女心', c: T_.paper('pink'), spec: SP(['carnation', 'bougain', 'periwinkle'], 'pink', 'pink') },
      { t: '網友票選', c: T_.free(), rep: true, spec: SP(['lisianthus', 'hydrangea', 'babys', 'babys'], 'sage', 'ivory') },
    ],
    perk: { name: '打卡術', desc: '每天打烊後網友來打卡：口碑越高，宣傳收入越多' } },
  { id: 'liu', rank: 7, lv: 8, nick: '一刀流', name: '劉師傅', shop: '五十年老花店「劉記」', skin: 'bo', col: '#e8c87a', k: 1.2,
    style: '剪刀一揮就是一束。他只出一刀：一招定勝負',
    intro: ['……小姑娘，我開花店的時候，妳爸媽都還沒出生。', '風雲榜第七，劉某。', '我只出一刀。一刀，定勝負。'],
    win: ['好準的眼。', '「一刀流」傳給妳：包裝紙配得好，花束會多值兩成五。'],
    lose: ['手太慢了。花是不等人的。', '下個月，我再來看妳的刀。'],
    rounds: [
      { t: '一刀定勝負', c: T_.exact(3), spec: SP(['rose', 'rose', 'rose'], 'black', 'red') },
    ],
    perk: { name: '一刀流', desc: '包裝紙搭得好：花束 ×1.25（原本 ×1.1）' } },
  { id: 'gui', rank: 6, lv: 10, nick: '香手', name: '桂嬸', shop: '香花行「桂香」', skin: 'wang', col: '#ffc070', k: 1.1,
    style: '一雙手摸過的花都會香，比的是鼻子',
    intro: ['美玲啊，妳店裡怎麼都沒什麼味道？', '我是桂嬸，風雲榜第六。人家都說我是「香手」。', '花，看是看不完的，要用聞的。'],
    win: ['好香……整條巷子都聞得到妳的花。', '「香手」教妳：香花賣價 ×1.35，一進門就讓人想買。'],
    lose: ['唉唷，聞起來都是塑膠袋的味道啦。', '下個月去多找一點香花，桂嬸再來。'],
    rounds: [
      { t: '一縷香', c: T_.scent(1), spec: SP(['osmanthus', 'sunflower', 'babys']) },
      { t: '巷口的香氣', c: T_.recipe('scent'), spec: SP(['osmanthus', 'jasmine', 'magnolia'], 'white', 'ivory') },
      { t: '白色的香', c: T_.and(T_.scent(2), T_.paper('white')), spec: SP(['jasmine', 'magnolia', 'babys'], 'white', 'ivory') },
    ],
    perk: { name: '香手', desc: '香花（茉莉、桂花、玉蘭、曇花……）賣價 ×1.35' } },
  { id: 'kevin', rank: 5, lv: 12, nick: '花漾', name: 'Kevin', shop: '花漾連鎖・旗艦店', skin: 'butler', col: '#7ad0c0', k: 1.15,
    style: '連鎖花店的王牌店長，數字、效率、大單，什麼都算得清清楚楚',
    intro: ['好久不見，美玲老闆。', '花漾總公司把我升成旗艦店店長，順便……我也進了風雲榜，第五名。', '這次不比市佔率，比真功夫。'],
    win: ['我還是輸了。……不過這次輸得心服口服。', '花漾的「連鎖通路」借妳用：以後客人的訂單，獎金 ×1.5。'],
    lose: ['數字不會騙人的，美玲老闆。', '下個月我再來。希望妳到時候有蝴蝶蘭。'],
    rounds: [
      { t: '誰賣得貴', c: T_.free(), spec: SP(['hydrangea', 'lisianthus', 'lisianthus', 'babys', 'babys'], 'sage', 'ivory') },
      { t: '大份量', c: T_.min(4), spec: SP(['rose', 'rose', 'rose', 'babys'], 'black', 'red') },
      { t: '婚禮捧花', c: T_.recipe('wedding'), spec: SP(['rose', 'orchid', 'babys'], 'white', 'ivory') },
    ],
    perk: { name: '連鎖通路', desc: '客人的訂單獎金 ×1.5' } },
  { id: 'bai', rank: 4, lv: 14, nick: '冰心', name: '白先生', shop: '白色花藝工作室', skin: 'teacher', col: '#e8f4ff', k: 1.2,
    style: '一生只用白色的花。三招都要「純白」，不白就輸一半',
    intro: ['……', '白。我只認白色。', '風雲榜第四，白某。三招，都要純白。'],
    win: ['……很白。很乾淨。', '「冰心訣」：純白配色的花束，再 ×1.3。'],
    lose: ['有雜色。心不靜。', '下個月。'],
    rounds: [
      { t: '冰心・一', c: T_.scheme('white'), spec: SP(['jasmine', 'babys', 'magnolia'], 'white', 'ivory') },
      { t: '冰心・二', c: T_.scheme('white'), spec: SP(['tanhua', 'jasmine', 'babys'], 'white', 'ivory') },
      { t: '冰心・三', c: T_.scheme('white'), spec: SP(['orchid', 'jasmine', 'babys', 'babys'], 'white', 'ivory') },
    ],
    perk: { name: '冰心訣', desc: '純白配色的花束賣價再 ×1.3' } },
  { id: 'lin', rank: 3, lv: 16, nick: '蘭花指', name: '林老', shop: '蘭園「幽谷」', skin: 'lin', col: '#d8b0ff', k: 1.2,
    style: '養了六十年蘭花的老園主，比的是最難偷、最貴的花',
    intro: ['呵呵，年輕人。', '老朽林某，風雲榜第三。這輩子只跟蘭花說話。', '妳店裡……有蘭花嗎？'],
    win: ['妳的蘭花，養得比我還好。', '「蘭花指」傳給妳：蝴蝶蘭、幽靈蘭賣價 ×1.4。'],
    lose: ['沒有蘭，談什麼花藝。', '去大宅的溫室看看吧，下個月老朽再來。'],
    rounds: [
      { t: '一枝蘭', c: T_.has('orchid'), spec: SP(['orchid', 'babys', 'babys'], 'white', 'ivory') },
      { t: '幽谷', c: T_.paper('sage'), spec: SP(['hydrangea', 'lisianthus', 'hydrangea'], 'sage', 'green') },
      { t: '大宅的秘密', c: T_.recipe('mansion'), spec: SP(['orchid', 'peony', 'hydrangea'], 'black', 'ivory') },
    ],
    perk: { name: '蘭花指', desc: '蝴蝶蘭、幽靈蘭賣價 ×1.4' } },
  { id: 'peony', rank: 2, lv: 18, nick: '天香國色', name: '牡丹夫人', shop: '大宅御用花藝顧問', skin: 'shopB', col: '#ff9fc2', k: 1.25,
    style: '大宅夫人的御用花藝師，花要富貴、要氣派、要大',
    intro: ['妳就是讓我們大宅花園一直少花的那家店？', '……開玩笑的。我是牡丹夫人，風雲榜第二。', '讓我看看，妳配不配得上「富貴」兩個字。'],
    win: ['好一個天香國色。', '「富貴術」送妳：有名字的花束（具名花束）再 ×1.2。'],
    lose: ['小家子氣。', '富貴的花，下個月再讓我看一次。'],
    rounds: [
      { t: '富貴花開', c: T_.recipe('fortune'), spec: SP(['peony', 'rose', 'rose'], 'black', 'red') },
      { t: '紅緞牡丹', c: T_.and(T_.has('peony'), T_.ribbon('red')), spec: SP(['peony', 'carnation', 'periwinkle'], 'pink', 'red') },
      { t: '滿堂紅', c: T_.min(5), spec: SP(['peony', 'rose', 'rose', 'babys', 'babys'], 'black', 'red') },
    ],
    perk: { name: '富貴術', desc: '具名花束（熱戀、婚禮捧花……）再 ×1.2' } },
  { id: 'saint', rank: 1, lv: 21, nick: '花聖', name: '一枝春', shop: '不知道在哪裡', skin: 'chief', col: '#ffe08a', k: 1.35, hyb: true,
    style: '沒人知道他住哪。只聽說他的花束，看過的人會哭。三招裡，自己配的品種都多算五成',
    intro: ['……', '這條巷子的花，香了一整年。我是循著香味來的。', '老夫一枝春，人稱花聖。', '讓我看看，妳自己種出了什麼。'],
    win: ['……好花。', '天下第一，從今天起是妳的了。', '記住：花不是用偷的，是用心的……（看了一眼花喵）……算了。'],
    lose: ['還差一點。', '去頂樓，種出只屬於妳的花。下個月見。'],
    rounds: [
      { t: '自己的花', c: T_.hybrid(), spec: null },
      { t: '一枝獨秀', c: T_.and(T_.exact(3), T_.same()), spec: SP(['peony', 'peony', 'peony'], 'black', 'red') },
      { t: '萬花歸一', c: T_.free(), spec: SP(['orchid', 'peony', 'hydrangea', 'babys', 'babys'], 'black', 'ivory') },
    ],
    perk: { name: '天下第一', desc: '每一筆生意都 ×1.15（擂台輸了就暫時失去）' } },
];

function duelOf(run) { return run.duel || (run.duel = { beaten: 0, cur: null, losses: {}, fights: 0, arena: { wins: 0, lost: false, n: 0 } }); }
function duelHas(run, id) {
  if (DU_RAW || !run) return false;
  const D = run.duel; if (!D) return false;
  const i = MASTERS.findIndex(m => m.id === id);
  if (D.beaten <= i) return false;
  if (id === 'saint' && D.arena && D.arena.lost) return false;
  return true;
}
function duelRankOf(run) { const D = duelOf(run); return D.beaten ? 11 - D.beaten : 0; }   // 0＝還沒上榜
function duelTitle(run) { const r = duelRankOf(run); return r === 1 ? '天下第一花店' : r ? `風雲榜第 ${r} 名` : '無名小店'; }

// 高手這一招的花束與功力
function masterSpec(run, M, ri) {
  const R = M.rounds[ri];
  if (R.spec) return R.spec;
  // 花聖第一招：用你已經配出來的、最貴的品種（還沒配出來就用最便宜的品種）
  const found = Object.keys((run.breed && run.breed.found) || {}).filter(t => FLOWERS[t]);
  const t = found.sort((a, b) => FLOWERS[b].price - FLOWERS[a].price)[0] || HYBRID_ORDER[0];
  return SP([t, t, 'babys'], 'black', 'ivory');
}
function masterPower(run, M, ri, cur) {
  DU_RAW = true;
  let ev; try { ev = bouquetEval(run, masterSpec(run, M, ri)); } finally { DU_RAW = false; }
  const D = duelOf(run);
  let k = M.k;
  if (cur && cur.arena) k *= 1.1 + 0.05 * (D.arena.wins || 0);
  else k *= Math.max(0.85, 1 - 0.05 * (D.losses[M.id] || 0));   // 輸過的話對手會手下留情一點
  k *= 1 + 0.065 * masterLv(run, M, cur);   // 越後面的高手，花藝功力越深
  k *= 1 - 0.03 * floraSk(run, 'fame');      // 名氣：對手會緊張
  return Math.round(ev.value * 1.3 * k / 10);
}
function masterLv(run, M, cur) { return cur && cur.arena ? 22 + (duelOf(run).arena.wins || 0) : M.lv; }
function playerPower(run, M, ri, spec, ev) {
  const R = M.rounds[ri];
  const ok = R.c.ok(spec, ev);
  const notes = [];
  const hk = floraSk(run, 'heart');
  let v = ev.value * (ok ? 1.3 + 0.06 * hk : 0.5 + 0.04 * hk);
  // 美玲的花藝修練
  const fs = floraMult(run, ev); v *= fs.m; notes.push(...fs.notes);
  if (R.rep) { const lv = repLv(run); v *= 1 + 0.04 * (lv - 1); if (lv > 1) notes.push(`口碑 Lv.${lv}：網友加分 ×${(1 + 0.04 * (lv - 1)).toFixed(2)}`); }
  if (M.hyb) { const h = spec.stems.filter(t => FLOWERS[t].hybrid).length; if (h) { v *= 1 + 0.5 * h / spec.stems.length; notes.push(`自己配的品種 ×${(1 + 0.5 * h / spec.stems.length).toFixed(2)}`); } }
  return { p: Math.round(v / 10), ok, notes };
}

// ---------- 秘笈效果 ----------
(function () {
  const _fv = flowerValue;
  flowerValue = function (run, t, fresh) {
    let v = _fv(run, t, fresh);
    if (!DU_RAW && run && run.duel) {
      if (t === 'rose' && duelHas(run, 'rose')) v *= 1.4;
      if (FLOWERS[t] && FLOWERS[t].fragrant && duelHas(run, 'gui')) v *= 1.35;
      if ((t === 'orchid' || t === 'ghostorchid') && duelHas(run, 'lin')) v *= 1.4;
    }
    return v;
  };
  const _be = bouquetEval;
  bouquetEval = function (run, spec, freshOf) {
    const ev = _be(run, spec, freshOf);
    if (DU_RAW || !run || !run.duel) return ev;
    let m = 1;
    if (ev.match && duelHas(run, 'liu')) m *= 1.25 / 1.1;
    m *= 1 + 0.02 * floraSk(run, 'cut');
    if (ev.scheme !== 'free') m *= 1 + 0.02 * floraSk(run, 'color');
    if (ev.match) m *= 1 + 0.02 * floraSk(run, 'wrap');
    if (ev.scheme === 'white' && duelHas(run, 'bai')) m *= 1.3;
    if (ev.recipe && duelHas(run, 'peony')) m *= 1.2;
    if (m !== 1) { ev.value = Math.round(ev.value * m); ev.mult *= m; ev.duel = m; }
    return ev;
  };
  const _go = genOrder;
  genOrder = function (run, n) { const o = _go(run, n); if (o && o.reward && duelHas(run, 'kevin')) o.reward = Math.round(o.reward * 1.5); return o; };
  const _sell = DayScene.prototype.sell;
  DayScene.prototype.sell = function (v, pot, wrap) { if (v > 0 && duelHas(this.run, 'saint')) v *= 1.15; return _sell.call(this, v, pot, wrap); };
  // 滿天星訣：花束 6 枝
  const _st = UI.bouquetStudio;
  UI.bouquetStudio = function (S, done) { BQ_MAX = duelHas(S.run, 'ji') ? 6 : 5; return _st.call(this, S, done); };
})();
// 打卡術：打烊後的宣傳收入
function duelDaily(run) {
  if (!duelHas(run, 'kui')) return null;
  const v = Math.round(repLv(run) * 450 * (1 + 0.15 * ((run.month || 1) - 1)));
  return { v, msg: `網友來打卡、幫忙宣傳（打卡術） +${money(v)}` };
}

// ---------- 白天：挑戰帖、論劍 ----------
function duelRoundsText(M) { return M.rounds.map((R, i) => `<li><b>${M.rounds.length > 1 ? '第' + NUM[i + 1] + '招・' : ''}${esc(R.t)}</b>${esc(R.c.d)}${M.timer ? `（限時 ${M.timer} 秒）` : ''}</li>`).join(''); }
function* duelLetterScript(S) {
  const run = S.run, m = run.month || 1, D = duelOf(run);
  if (m < 2 || (D.cur && D.cur.m === m)) return;
  let i, arena = false;
  if (D.beaten < MASTERS.length) i = D.beaten;
  else { arena = true; i = Math.max(0, MASTERS.length - 1 - Math.floor(Math.random() * 4)); }
  D.cur = { i, m, arena, done: false };
  const M = MASTERS[i], again = !arena && (D.losses[M.id] || 0) > 0;
  yield S.say(arena ? '門口插了一把紙扇……是擂台的挑戰帖！' : again ? `門縫塞了一封信……是${M.name}，又要來了。` : '門縫塞了一封信……「挑戰帖」？');
  UI.hideDialog();
  yield S.modal(done => UI.modal(`<p class="eyebrow">${arena ? '擂台・天下第一保衛戰' : '花界風雲榜・挑戰帖'}</p>
    <h2>${arena ? '復仇戰：' : ''}第 ${M.rank} 名「${esc(M.nick)}」${esc(M.name)}</h2>
    <p class="lead">${esc(M.shop)}。${esc(M.style)}。</p>
    <p class="lead">這個月<b>第四天早上</b>上門論劍。${M.rounds.length > 1 ? '三招贏兩招就算贏' : '只比一招，一招定勝負'}。用的是<b>第三晚偷回來的花</b>（加上頂樓花園的），每一招會自動幫你配好最強的一束。<b>小心：${esc(M.name)}的店貓這幾晚會溜來巷子偷你要的花！</b></p>
    <ul class="chain-opts du-rounds">${duelRoundsText(M)}</ul>
    <p class="hint"><b>建議花藝 Lv.${masterLv(run, M, D.cur)}</b>（美玲現在 Lv.${floraLv(run)}）：等級不夠，花再好也打不贏。合題目的花束功力 ×1.3，不合只剩 ×0.5。${arena ? `已經守住擂台 ${D.arena.wins} 次，這次對手會更強。` : `打敗他：學到獨門秘笈「${esc(M.perk.name)}」、拿獎金，風雲榜升到第 ${M.rank} 名。`}${again ? `（之前輸了 ${D.losses[M.id]} 次，這次他會稍微手下留情）` : ''}</p>`,
    [{ label: '接下挑戰帖', primary: true, onClick: done }], { pause: true, cls: 'small' }));
  if (!arena && D.beaten === 0) setTimeout(() => UI.toast('「花界風雲榜」在圖鑑裡可以看：十大高手，一個月來一位', 3600), 300);
}
function duelPending(run, n) { const D = run.duel, c = D && D.cur; return n === 4 && !!c && c.m === (run.month || 1) && !c.done; }
function* duelDayScript(S, n) {
  const run = S.run, m = run.month || 1, D = duelOf(run), c = D.cur;
  if (!c || c.m !== m || c.done) return;
  const M = MASTERS[c.i];
  if (n < 4) { setTimeout(() => UI.toast(`${n === 2 ? '後天' : '明天'}早上「${M.nick}」${M.name}來論劍：${M.rounds.map(R => R.c.d).join('／')}`, 4200), 2600); return; }
  const wasOn = S.duelHold ? true : S.shopOn; S.duelHold = false; S.shopOn = false;
  UI.banner('花藝論劍');
  yield wait(0.8);
  const h = S.customer(M.skin);
  yield S.walkIn(h, COUNTER_SPOT2);
  yield* S.talk(h, `「${M.nick}」${M.name}`, (c.arena ? ['天下第一的位子，我要拿回來。'] : M.intro).map(x => [x]));
  UI.hideDialog();
  let res = null;
  yield S.modal(done => duelUI(S, M, c, r => { res = r; done(); }));
  c.done = true; D.fights = (D.fights || 0) + 1;
  floraGain(run, res.win ? 100 : 40);
  const prize = Math.round((3000 + (11 - M.rank) * 2200) * (1 + 0.12 * (m - 2)));
  if (res.win) {
    run.money += prize; S.daySales += 0; run.cans += c.arena ? 30 : 15 + (10 - M.rank) * 4;
    if (c.arena) { D.arena.wins++; D.arena.lost = false; }
    else D.beaten = Math.max(D.beaten, c.i + 1);
    SFX.play('buy');
    yield* S.talk(h, `「${M.nick}」${M.name}`, (c.arena ? ['……天下第一，果然名不虛傳。'] : M.win).map(x => [x]));
    UI.hideDialog();
    yield S.walkOut(h);
    if (c.arena) UI.toast(`守住擂台了！獎金 ${money(prize)}、罐罐 +30（天下第一的加成繼續）`, 4200);
    else {
      UI.banner(`風雲榜第 ${M.rank} 名！`);
      UI.toast(`打敗「${M.nick}」！學到秘笈「${M.perk.name}」：${M.perk.desc}。獎金 ${money(prize)}`, 5200);
      yield wait(1.2);
      yield S.say(M.rank === 1 ? '天下第一……花喵，我們是天下第一的花店了！' : `牆上的風雲榜，${M.name}的名字劃掉了！花喵，我們是第 ${M.rank} 名了。`);
      UI.hideDialog();
    }
  } else {
    if (c.arena) D.arena.lost = true; else D.losses[M.id] = (D.losses[M.id] || 0) + 1;
    SFX.play('nope');
    yield* S.talk(h, `「${M.nick}」${M.name}`, (c.arena ? ['天下第一，我先拿走了。下個月，換妳來拿。'] : M.lose).map(x => [x]));
    UI.hideDialog();
    yield S.walkOut(h);
    UI.toast(c.arena ? '擂台輸了：「天下第一」的加成暫時沒了，下個月贏回來' : `輸給「${M.nick}」……下個月他會再來，題目一樣，先把花準備好！`, 4600);
  }
  S.shopOn = wasOn;
}

// 論劍畫面
function duelUI(S, M, c, cb) {
  const run = S.run, decor = storeOf(run).decor || 0;
  const papers = Object.keys(PAPERS).filter(k => (PAPERS[k].decor || 0) <= decor);
  const ribbons = Object.keys(RIBBONS).filter(k => (RIBBONS[k].decor || 0) <= decor);
  const maxN = duelHas(run, 'ji') ? 6 : 5;
  const st = { r: 0, win: 0, lose: 0, phase: 'pick', last: null, timer: null, left: 0, auto: false };
  const need = Math.ceil(M.rounds.length / 2);
  const sel = { stems: [], paper: papers[0], ribbon: ribbons[0] };
  const pool = () => S.stock.filter(f => S.canSell(f));
  const takePlan = () => { const P = pool().slice().sort((a, b) => b.fresh - a.fresh), used = []; for (const t of sel.stems) { const i = P.findIndex(f => f.t === t && !used.includes(f)); if (i >= 0) used.push(P[i]); } return used; };
  const left = t => pool().filter(f => f.t === t).length - sel.stems.filter(x => x === t).length;
  // 自動配花：店裡的花湊得出的、功力最高的一束（優先合題目）
  const bestPick = () => {
    const P = pool(), cnt = {}; for (const f of P) cnt[f.t] = (cnt[f.t] || 0) + 1;
    const types = Object.keys(cnt).sort((a, b) => FLOWERS[b].price - FLOWERS[a].price).slice(0, 10);
    const R = M.rounds[st.r]; let best = null, bestP = -1;
    const needRb = R.c.d.includes('緞帶');
    const mp = masterPower(run, M, st.r, c); let win = null, winCost = Infinity;
    const cur = [];
    const tryIt = () => {
      for (const pa of papers) {
        const spec = { stems: cur.slice(), paper: pa, ribbon: ribbons[0] };
        let ev = bouquetEval(run, spec), pp = playerPower(run, M, st.r, spec, ev);
        if (!pp.ok && needRb) { for (const rb of ribbons) { const s2 = { stems: spec.stems, paper: pa, ribbon: rb }; const e2 = bouquetEval(run, s2), p2 = playerPower(run, M, st.r, s2, e2); if (p2.ok) { spec.ribbon = rb; pp = p2; break; } } }
        if (pp.p > bestP) { bestP = pp.p; best = spec; }
        // 贏得了的話，挑最省花的那一束（好花留給下一招）
        if (pp.p >= mp + 2 && ev.base < winCost) { winCost = ev.base; win = spec; }
      }
    };
    const rec = (from, left) => {
      if (cur.length >= BQ_MIN) tryIt();
      if (cur.length >= maxN) return;
      for (let i = from; i < types.length; i++) { const t = types[i]; if (cur.filter(x => x === t).length >= cnt[t]) continue; cur.push(t); rec(i, left); cur.pop(); }
    };
    rec(0);
    return win || best;
  };
  const autoFill = () => { const b = bestPick(); if (b) { sel.stems = b.stems.slice(); sel.paper = b.paper; sel.ribbon = b.ribbon; } };
  const stopTimer = () => { if (st.timer) { clearInterval(st.timer); st.timer = null; } };
  const evalSel = () => { const plan = takePlan(); return bouquetEval(run, sel, i => (plan[i] ? plan[i].fresh : 1)); };
  const submit = (forfeit) => {
    stopTimer();
    const mp = masterPower(run, M, st.r, c);
    let me = { p: 0, ok: false, notes: [] }, name = '棄權';
    if (!forfeit && sel.stems.length >= BQ_MIN) {
      const plan = takePlan(); if (plan.length !== sel.stems.length) return;
      const ev = bouquetEval(run, sel, i => plan[i].fresh);
      me = playerPower(run, M, st.r, sel, ev); name = ev.name;
      for (const f of plan) { const i = S.stock.indexOf(f); if (i >= 0) S.stock.splice(i, 1); }
      bookRecord(run, { stems: sel.stems.slice(), paper: sel.paper, ribbon: sel.ribbon }, ev);
    }
    const won = me.p >= mp && me.p > 0;
    if (won) { st.win++; SFX.play('heart'); } else { st.lose++; SFX.play('nope'); }
    st.last = { mp, me, won, name, spec: { stems: sel.stems.slice(), paper: sel.paper, ribbon: sel.ribbon } };
    st.phase = 'show'; render();
  };
  const next = () => {
    if (st.win >= need || st.lose >= need || st.r >= M.rounds.length - 1) { stopTimer(); cb({ win: st.win >= need, wins: st.win, losses: st.lose }); return; }
    st.r++; st.phase = 'pick'; sel.stems = []; st.last = null; st.auto = false; render(); startTimer();
  };
  const render = () => {
    const R = M.rounds[st.r], mp = masterPower(run, M, st.r, c);
    const head = `<p class="eyebrow">${c.arena ? '擂台' : '花藝論劍'}${M.rounds.length > 1 ? `・第${NUM[st.r + 1]}招（三招兩勝）` : '・一招定勝負'}</p>
      <h2>${esc(R.t)}</h2><p class="du-q">${esc(R.c.d)}</p>
      <p class="du-lv">美玲 花藝 Lv.${floraLv(run)}・${esc(M.name)} 花藝 Lv.${masterLv(run, M, c)}</p>
      <div class="du-score"><span>美玲</span><b class="px">${st.win}</b><i>：</i><b class="px">${st.lose}</b><span>${esc(M.name)}</span></div>`;
    if (st.phase === 'show') {
      const L = st.last;
      UI.modal(`${head}<div class="du-vs"><div class="du-side"><canvas class="du-cv" data-w="m" width="150" height="190"></canvas><b>${esc(M.name)}</b><span class="px">功力 ${L.mp}</span></div>
        <div class="du-mid ${L.won ? 'win' : 'lose'}">${L.won ? '勝' : '敗'}</div>
        <div class="du-side"><canvas class="du-cv" data-w="p" width="150" height="190"></canvas><b>${esc(L.name)}</b><span class="px">功力 ${L.me.p}</span></div></div>
        <p class="du-judge">${L.me.p === 0 ? '這一招棄權了。' : `${L.me.ok ? '合題目 ×1.3' : '沒合題目，只剩 ×0.5'}${L.me.notes.length ? '・' + L.me.notes.join('・') : ''}。`}${L.won ? pick(['評審們點點頭：這一招，美玲贏了！', '圍觀的鄰居拍手叫好！', `${M.name}愣了一下。`]) : pick(['評審們搖搖頭。', `${M.name}冷笑了一聲。`, '圍觀的鄰居嘆了一口氣。'])}</p>`,
        [{ label: (st.win >= need || st.lose >= need || st.r >= M.rounds.length - 1) ? '看結果' : '下一招', primary: true, onClick: next }], { pause: true, cls: 'duel' });
      const card = UI.cardEl;
      paintCardCanvas(card.querySelector('[data-w="m"]'), bouquetCanvas(masterSpec(run, M, st.r), 3));
      if (L.spec.stems.length) paintCardCanvas(card.querySelector('[data-w="p"]'), bouquetCanvas(L.spec, 3));
      return;
    }
    if (!st.auto) { st.auto = true; autoFill(); }
    const types = [...new Set(pool().map(f => f.t))].sort((a, b) => FLOWERS[a].price - FLOWERS[b].price);
    const okN = sel.stems.length >= BQ_MIN && sel.stems.length <= maxN;
    let mine = `<b>挑 ${BQ_MIN}～${maxN} 枝</b><span class="px">功力 —</span>`;
    if (sel.stems.length) { const ev = evalSel(), pp = playerPower(run, M, st.r, sel, ev); mine = `<b>${esc(ev.name)}</b><span class="px ${pp.p >= mp ? 'up' : 'dn'}">功力 ${okN ? pp.p : '—'}</span><em class="${pp.ok ? 'ok' : 'no'}">${pp.ok ? '✓ 合題目' : '✗ 不合題目'}</em>`; }
    UI.modal(`${head}${M.timer ? `<div class="du-timer"><i style="width:${Math.round(100 * st.left / M.timer)}%"></i><span>${Math.ceil(st.left)} 秒</span></div>` : ''}
      <div class="du-vs"><div class="du-side"><canvas class="du-cv" data-w="m" width="150" height="190"></canvas><b>${esc(M.name)}出招</b><span class="px">功力 ${mp}</span></div>
      <div class="du-mid">VS</div>
      <div class="du-side"><canvas class="du-cv" data-w="p" width="150" height="190"></canvas>${mine}</div></div>
      <div class="bq-sel">${Array.from({ length: maxN }, (_, i) => sel.stems[i] ? `<button type="button" class="bq-slot full" data-i="${i}"><img src="${G.icons[sel.stems[i]]}" alt=""><i>✕</i></button>` : `<span class="bq-slot${i < BQ_MIN ? ' need' : ''}"></span>`).join('')}</div>
      <div class="bq-pick">${types.length ? types.map(t => `<button type="button" class="bq-chip" data-t="${t}" ${left(t) > 0 && sel.stems.length < maxN ? '' : 'disabled'}>${flowerChip(t)}<em>×${left(t)}</em></button>`).join('') : '<p class="bq-hint">店裡沒有花了……這一招只能棄權。</p>'}</div>
      <div class="bq-sws">${papers.map(k => `<button type="button" class="bq-sw ${sel.paper === k ? 'on' : ''}" data-p="${k}" style="--c:${PAPERS[k].col}">${PAPERS[k].name}</button>`).join('')}</div>
      <div class="bq-sws">${ribbons.map(k => `<button type="button" class="bq-sw ${sel.ribbon === k ? 'on' : ''}" data-r="${k}" style="--c:${RIBBONS[k].col}">${RIBBONS[k].name}</button>`).join('')}</div>`,
      [{ label: '棄權', keep: true, onClick: () => submit(true) }, { label: '自動配花', keep: true, onClick: () => { SFX.play('pick'); autoFill(); rerender(); } }, { label: '出招！', primary: true, keep: true, onClick: () => { if (okN) submit(false); else SFX.play('nope'); } }], { pause: true, cls: 'duel' });
    const card = UI.cardEl;
    const go = card.querySelector('.btns .btn[data-i="2"]'); if (go) go.disabled = !okN;
    paintCardCanvas(card.querySelector('[data-w="m"]'), bouquetCanvas(masterSpec(run, M, st.r), 3));
    if (sel.stems.length) paintCardCanvas(card.querySelector('[data-w="p"]'), bouquetCanvas(sel, 3));
    card.querySelectorAll('.bq-chip').forEach(el => el.addEventListener('click', () => { if (sel.stems.length >= maxN || left(el.dataset.t) <= 0) return; SFX.play('pick'); sel.stems.push(el.dataset.t); rerender(); }));
    card.querySelectorAll('.bq-slot.full').forEach(el => el.addEventListener('click', () => { SFX.play('ui'); sel.stems.splice(+el.dataset.i, 1); rerender(); }));
    card.querySelectorAll('.bq-sw').forEach(el => el.addEventListener('click', () => { SFX.play('ui'); if (el.dataset.p) sel.paper = el.dataset.p; if (el.dataset.r) sel.ribbon = el.dataset.r; rerender(); }));
  };
  const rerender = () => { const y = UI.cardEl.scrollTop; render(); UI.cardEl.scrollTop = y; };
  // 一刀流：每招限時
  const startTimer = () => {
    if (!M.timer) return;
    st.left = M.timer;
    st.timer = setInterval(() => {
      if (st.phase !== 'pick') return;
      st.left -= 0.25;
      const bar = UI.cardEl.querySelector('.du-timer i'), tx = UI.cardEl.querySelector('.du-timer span');
      if (bar) bar.style.width = Math.max(0, Math.round(100 * st.left / M.timer)) + '%';
      if (tx) tx.textContent = Math.max(0, Math.ceil(st.left)) + ' 秒';
      if (st.left <= 0) { submit(!(sel.stems.length >= BQ_MIN && sel.stems.length <= maxN)); }
    }, 250);
  };
  render(); startTimer();
}

// ---------- 圖鑑：風雲榜 ----------
function duelBookHTML(run) {
  const D = duelOf(run), cur = D.cur && !D.cur.done ? D.cur : null;
  const rows = MASTERS.slice().reverse().map(M => {
    const i = MASTERS.indexOf(M), beat = D.beaten > i, met = beat || (cur && cur.i === i) || (D.losses[M.id] || 0) > 0;
    return `<li class="du-row ${beat ? 'beat' : ''} ${cur && cur.i === i ? 'cur' : ''}"><span class="du-rk px">${M.rank}</span>
      <div><b>「${esc(M.nick)}」${met ? esc(M.name) : '？？？'}</b><span>${met ? esc(M.shop) : '還沒現身'}</span>
      <p>${beat ? `已打敗・秘笈「${esc(M.perk.name)}」：${esc(M.perk.desc)}` : cur && cur.i === i ? `這個月第四天來論劍：${M.rounds.map(R => esc(R.c.d)).join('／')}` : met ? `輸過 ${D.losses[M.id]} 次，下個月再來` : `打敗後可以學到「${esc(M.perk.name)}」`}</p></div>${beat ? '<i class="du-seal">敗</i>' : ''}</li>`;
  }).join('');
  const r = duelRankOf(run);
  return `<p class="lead">第二個月起，風雲榜上的高手每個月來一位。打敗他就換你坐他的位子，還能學到他的獨門秘笈。</p>
    <div class="bk-goal ${r === 1 ? 'done' : ''}">美玲花店：<b>${esc(duelTitle(run))}</b>${D.beaten >= MASTERS.length ? `　擂台守住 ${D.arena.wins} 次${D.arena.lost ? '（天下第一被搶走了，下個月搶回來）' : ''}` : ''}</div>
    <ul class="du-list">${rows}</ul>${jhBookHTML(run)}`;
}
// 喵技能頁的提醒
function duelNoteHTML(run) {
  const D = duelOf(run), c = D.cur;
  if (!c || c.done || c.m !== (run.month || 1)) return '';
  const M = MASTERS[c.i];
  return `<p class="hint du-note">⚔ 這個月第四天：「${esc(M.nick)}」${esc(M.name)}來論劍——${M.rounds.map(R => esc(R.c.d)).join('／')}。晚上記得偷齊要的花。</p>`;
}

// ---------- 花店牆上：花界風雲榜、天下第一匾額 ----------
function toonDuelBoard(beaten, lost) {
  return toonFrameInfo(toonFrame('duelboard-' + beaten + (lost ? 'x' : ''), 30, 44, () => {
    O.blobO([[-13, -43], [13, -43], [13, -2], [-13, -2]], '#8a5a34');
    O.blobO([[-11, -41], [11, -41], [11, -4], [-11, -4]], '#f2e2c0');
    O.blobO([[-11, -41], [11, -41], [11, -36], [-11, -36]], '#c8303a');
    for (let k = 0; k < 4; k++) O.dot(-7 + k * 4.6, -38.5, 1.1, '#ffe08a');
    for (let r = 0; r < 10; r++) {
      const y = -33.5 + r * 2.9, i = 9 - r, beat = beaten > i;   // 上面是第一名
      O.curve([[-8.5, y], [beat ? 3 : 8, y]], beat ? '#b8a890' : '#3a2a20', 0.9);
      if (beat) { O.curve([[-9.5, y], [9.5, y]], '#d83a3a', 0.7); }
    }
    // 自己的名字（金色小花）在目前的名次
    if (beaten) { const y = -33.5 + (10 - beaten) * 2.9; O.dot(9.6, y, 1.5, lost ? '#9aa0b0' : '#ffd23a'); O.dot(9.6, y, 0.6, '#ff8a3a'); }
  }), false, 0.5, 0.62);
}
function toonDuelPlaque() {
  return toonFrameInfo(toonFrame('duelplaque', 44, 16, () => {
    O.blobO([[-21, -15], [21, -15], [21, -2], [-21, -2]], '#6a2a1a');
    O.blobO([[-19, -13.5], [19, -13.5], [19, -3.5], [-19, -3.5]], '#2a1a14');
    VXR.shape({}, g => { g.fillStyle = '#ffd23a'; g.font = '700 7.4px "Noto Serif TC","Songti TC",serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('天下第一', TOX, TOY - 8.6); });
  }), false, 0.5, 0.62);
}
function duelDecor3D(sc, F) {
  const run = sc.run; if (!run || !run.duel || !run.duel.beaten) return;
  const D = run.duel, cpd = Math.cos(R3.pitch);
  pushSprite(F.sprites, ART.fix(toonDuelBoard(D.beaten, D.arena && D.arena.lost)), DUEL_BOARD[0] * TS, DUEL_BOARD[1] * TS, { lift: DUEL_BOARD[2] * cpd, minLight: [0.75, 0.7, 0.66] });
  if (D.beaten >= MASTERS.length && !(D.arena && D.arena.lost)) {
    pushSprite(F.sprites, ART.fix(toonDuelPlaque()), DUEL_PLAQUE[0] * TS, DUEL_PLAQUE[1] * TS, { lift: DUEL_PLAQUE[2] * cpd, minLight: [0.85, 0.8, 0.75] });
    glowQuad(F.glow, DUEL_PLAQUE[0], 3.2, DUEL_PLAQUE[1], 0.9, [1, 0.85, 0.4, 0.14]);
  }
}
const DUEL_BOARD = [4.6, 3.05, 0.9], DUEL_PLAQUE = [7.5, 3.05, 2.35];


// ================= 美玲的花藝修練 =================
// 包花束、賣花、論劍都會累積「花藝經驗」，升級拿修練點，點在五門功夫上。
// 論劍看的是：花 × 題目 × 修練。等級太低，花再好也打不過後面的高手（挑戰帖上有建議等級）。
const FLORA_SK = [
  { id: 'cut', name: '剪枝功', desc: '下刀乾淨俐落', duel: '論劍功力 +8%', shop: '花束賣價 +2%' },
  { id: 'color', name: '配色眼', desc: '一眼看出哪些顏色配得起來', duel: '配色不是「隨性」時 +7%', shop: '有配色的花束 +2%' },
  { id: 'wrap', name: '包裝術', desc: '紙和花搭得剛剛好', duel: '包裝很搭時 +8%', shop: '包裝很搭的花束 +2%' },
  { id: 'heart', name: '心法', desc: '看懂題目在考什麼', duel: '合題目 ×1.3 再 +0.06；不合題目少扣一點', shop: '' },
  { id: 'fame', name: '名氣', desc: '名字一報出來，對手手就抖', duel: '對手功力 −3%', shop: '' },
];
const FLORA_MAX = 5;
function floraOf(run) { return run.flora || (run.flora = { xp: 0, sk: {} }); }
function floraNeed(lv) { return Math.round(25 * Math.pow(lv - 1, 1.5)); }   // 到 lv 級需要的總經驗
function floraLv(run) { const F = floraOf(run); let lv = 1; while (lv < 26 && F.xp >= floraNeed(lv + 1)) lv++; return lv; }
function floraSk(run, id) { return (run && run.flora && run.flora.sk[id]) || 0; }
function floraPts(run) { const F = floraOf(run); return floraLv(run) - 1 - FLORA_SK.reduce((a, k) => a + (F.sk[k.id] || 0), 0); }
function floraGain(run, xp, quiet) {
  const F = floraOf(run), lv0 = floraLv(run);
  F.xp += xp;
  const lv1 = floraLv(run);
  if (lv1 > lv0) { setTimeout(() => UI.toast(`美玲的花藝升到 Lv.${lv1}！多了 ${lv1 - lv0} 個修練點（傍晚在「花店升級」裡點）`, 3600), quiet ? 1200 : 200); SFX.play('buy'); }
}
function floraMult(run, ev) {
  const notes = []; let m = 1;
  const c = floraSk(run, 'cut'), co = floraSk(run, 'color'), w = floraSk(run, 'wrap'), h = floraSk(run, 'heart'), f = floraSk(run, 'fame');
  if (c) { m *= 1 + 0.08 * c; notes.push(`剪枝功 +${8 * c}%`); }
  if (co && ev.scheme !== 'free') { m *= 1 + 0.07 * co; notes.push(`配色眼 +${7 * co}%`); }
  if (w && ev.match) { m *= 1 + 0.08 * w; notes.push(`包裝術 +${8 * w}%`); }
  if (h) notes.push(`心法 Lv.${h}`);
  if (f) notes.push(`名氣：對手 −${3 * f}%`);
  return { m, notes };
}
(function () {
  const P = DayScene.prototype;
  const _mb = P.bouquetMade;
  P.bouquetMade = function (bq) { try { floraGain(this.run, 6 + bq.spec.stems.length + (bq.recipe ? 6 : 0)); } catch (e) { } return _mb ? _mb.call(this, bq) : undefined; };
  const _sell = P.sell;
  P.sell = function (v, pot, wrap) { if (v > 0) try { floraGain(this.run, 1, true); } catch (e) { } return _sell.call(this, v, pot, wrap); };
})();
function floraHTML(run) {
  const F = floraOf(run), lv = floraLv(run), pts = floraPts(run);
  const nx = lv < 26 ? floraNeed(lv + 1) : null, cur = floraNeed(lv);
  const pct = nx ? Math.round(100 * (F.xp - cur) / (nx - cur)) : 100;
  const D = duelOf(run), c = D.cur && !D.cur.done ? D.cur : null, M = c ? MASTERS[c.i] : (D.beaten < MASTERS.length ? MASTERS[D.beaten] : null);
  const rec = M ? masterLv(run, M, c) : null;
  const rows = FLORA_SK.map(k => {
    const l = F.sk[k.id] || 0;
    return `<li class="up ${l >= FLORA_MAX ? 'maxed' : ''}"><div class="up-main"><div class="up-name"><span class="grp">花藝</span><b>${k.name}</b><span class="pips">${Array.from({ length: FLORA_MAX }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</span></div>
      <div class="up-now">${esc(k.desc)}</div><div class="up-next">每級：${esc(k.duel)}${k.shop ? '・平常' + esc(k.shop) : ''}</div></div>
      <button type="button" class="buy" data-fl="${k.id}" ${pts > 0 && l < FLORA_MAX ? '' : 'disabled'}>${l >= FLORA_MAX ? '滿級' : '修練'}</button></li>`;
  }).join('');
  return `<h3>美玲的花藝修練<small>包花束、賣花、論劍都會長經驗</small></h3>
    <div class="fl-lv"><b>花藝 Lv.${lv}</b><span class="fl-bar"><i style="width:${pct}%"></i></span><span class="px">${nx ? `${F.xp}/${nx}` : 'MAX'}</span></div>
    <p class="hint">修練點：<b>${pts}</b>${M ? `　下一位高手「${esc(M.nick)}」建議花藝 Lv.${rec}${lv >= rec ? '（夠了！）' : `（還差 ${rec - lv} 級）`}` : ''}</p>
    <ul class="ups">${rows}</ul>`;
}
function bindFlora(card, run, keep) {
  card.querySelectorAll('[data-fl]').forEach(b => b.addEventListener('click', () => {
    const F = floraOf(run), id = b.dataset.fl;
    if (floraPts(run) <= 0 || (F.sk[id] || 0) >= FLORA_MAX) return;
    F.sk[id] = (F.sk[id] || 0) + 1; SFX.play('buy');
    UI.toast(`${FLORA_SK.find(k => k.id === id).name} 升到 ${F.sk[id]} 級！店裡多掛了一張證書`, 2200);
    keep();
  }));
}
// 花店牆上：五張修練證書（每升一級多一顆星）
function toonFloraCerts(key) {
  return toonFrameInfo(toonFrame('floracert-' + key, 44, 14, () => {
    const lv = key.split('').map(Number);
    for (let i = 0; i < 5; i++) {
      if (!lv[i]) continue;
      const x = -18 + i * 9;
      O.blobO([[x - 3.6, -13], [x + 3.6, -13], [x + 3.6, -2], [x - 3.6, -2]], '#c8a060');
      O.blobO([[x - 2.6, -12], [x + 2.6, -12], [x + 2.6, -3], [x - 2.6, -3]], '#fff6e0');
      O.dot(x, -9.6, 1.1, ['#d83a3a', '#3a8ad8', '#8a5ad8', '#3aa860', '#e8a020'][i]);
      for (let k = 0; k < lv[i]; k++) O.dot(x - 2 + k, -5, 0.45, '#e8b020');
    }
  }), false, 0.5, 0.5);
}
function floraDecor3D(sc, F) {
  const run = sc.run; if (!run || !run.flora) return;
  const key = FLORA_SK.map(k => Math.min(5, run.flora.sk[k.id] || 0)).join('');
  if (key === '00000') return;
  pushSprite(F.sprites, ART.fix(toonFloraCerts(key)), 10.4 * TS, 3.05 * TS, { lift: 1.5 * Math.cos(R3.pitch), minLight: [0.75, 0.7, 0.66] });
}
