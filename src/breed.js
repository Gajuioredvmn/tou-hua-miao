// ================= 配種新品種 =================
// 頂樓花園蓋到第二級（層架）起，多一張「配種台」：拿兩支插枝配在一起，過兩晚看會開出什麼。
//   ・配對了 → 新品種（偷不到，只有自己的花園種得出來，價錢高）
//   ・沒配對 → 插枝用掉，但會留下「線索」：知道這種花跟哪個新品種有關係（圖鑑的「品種」頁）
//   ・同一個品種跟自己配 → 選育，品質★往上升（最多三顆星，賣得更貴）
//   ・新品種收成時會多帶回一支它的插枝，可以多種幾盆、拿去配第二代
// 衍生：品種權利金（每天早上花市付一筆）、每月第三天的社區花展（拿最好的品種去比賽）
const HYBRIDS = {
  firebougain: { name: '火焰九重葛', a: 'bougain', b: 'sunflower', price: 460, color: '#ff6a2a', hue: 18, desc: '像火一樣的橘紅色苞片。' },
  perfcarn: { name: '香水康乃馨', a: 'carnation', b: 'jasmine', price: 560, color: '#e4c4f2', hue: 285, fragrant: true, desc: '淡紫色，帶著茉莉的香味。' },
  goldsun: { name: '金色向日葵', a: 'sunflower', b: 'osmanthus', price: 680, color: '#ffb81a', hue: 40, fragrant: true, desc: '花瓣金得發亮，聞起來有桂花香。' },
  rainbowhyd: { name: '彩虹繡球', a: 'hydrangea', b: 'lisianthus', price: 820, color: '#c88af0', hue: 280, desc: '一球裡有好幾種顏色。' },
  bluerose: { name: '藍玫瑰', a: 'rose', b: 'hydrangea', price: 950, color: '#5a7ae8', hue: 225, desc: '世界上本來沒有的藍色玫瑰。' },
  dreamcam: { name: '夢幻山茶', a: 'camellia', b: 'plumeria', price: 1150, color: '#ffc0d8', hue: 338, desc: '從粉紅漸層到雪白的山茶。' },
  starbaby: { name: '星空滿天星', a: 'babys', b: 'ghostorchid', price: 1450, color: '#3a4a9a', hue: 232, desc: '深藍色的小花，晚上會一閃一閃。' },
  nightlotus: { name: '夜睡蓮', a: 'lotus', b: 'lisianthus', price: 1650, color: '#7a6ae0', hue: 252, desc: '只在晚上張開的紫色睡蓮。' },
  pinktanhua: { name: '粉曇花', a: 'tanhua', b: 'peony', price: 2700, color: '#ffd0e0', hue: 340, fragrant: true, rare: true, desc: '粉紅色的曇花，開得比較久。' },
  moonorchid: { name: '月光蘭', a: 'orchid', b: 'magnolia', price: 3100, color: '#fff4c0', hue: 50, rare: true, desc: '淡黃色的蝴蝶蘭，像月光。' },
  phoenix: { name: '鳳凰花', a: 'firebougain', b: 'goldsun', price: 2500, color: '#ff4a2a', hue: 10, gen2: true, desc: '第二代：像鳳凰的尾羽。' },
  galaxyrose: { name: '銀河玫瑰', a: 'bluerose', b: 'starbaby', price: 5400, color: '#4a2a8a', hue: 260, gen2: true, desc: '第二代：花瓣上灑滿星星。' },
};
const HYBRID_ORDER = Object.keys(HYBRIDS).sort((a, b) => HYBRIDS[a].price - HYBRIDS[b].price);
for (const k of HYBRID_ORDER) { const h = HYBRIDS[k]; FLOWERS[k] = { name: h.name, price: h.price, color: h.color, hue: h.hue, fragrant: !!h.fragrant, hybrid: true, where: '自己的頂樓花園（配種）' }; }
const QMULT = [1, 1, 1.35, 1.8];
function breedOf(run) {
  const b = run.breed || (run.breed = { slots: [], found: {}, q: {}, hints: {}, tries: 0, shows: {} });
  for (const k of ['slots', 'found', 'q', 'hints', 'shows']) if (!b[k]) b[k] = k === 'slots' ? [] : {};
  return b;
}
function breedOpen(run) { return gardenOf(run).lv >= 2; }
function breedSlots(run) { const lv = gardenOf(run).lv; return lv >= 5 ? 3 : lv >= 4 ? 2 : lv >= 2 ? 1 : 0; }
function hybridOf(a, b) { for (const k in HYBRIDS) { const h = HYBRIDS[k]; if ((h.a === a && h.b === b) || (h.a === b && h.b === a)) return k; } return null; }
function hybridQ(run, t) { return breedOf(run).q[t] || 1; }
function cutOrder() { return FLOWER_ORDER.concat(HYBRID_ORDER); }
// 價錢：品質星星
{
  const _fv = flowerValue;
  flowerValue = function (run, t, fresh) { const v = _fv(run, t, fresh); return HYBRIDS[t] && run ? v * QMULT[hybridQ(run, t)] : v; };
  const _pl = plantable;
  plantable = function (run, t) { if (HYBRIDS[t] && HYBRIDS[t].rare) return gardenOf(run).lv >= 5; return _pl(run, t); };
}
// 開始配種
function startBreed(run, slot, a, b) {
  const B = breedOf(run), cut = run.cuttings || (run.cuttings = {});
  if (slot >= breedSlots(run) || B.slots[slot] || !a || !b) return false;
  const need = {}; need[a] = (need[a] || 0) + 1; need[b] = (need[b] || 0) + 1;
  for (const t in need) if ((cut[t] || 0) < need[t]) return false;
  for (const t in need) cut[t] -= need[t];
  const h = a === b && HYBRIDS[a] ? a : hybridOf(a, b);
  B.slots[slot] = { a, b, left: h && HYBRIDS[h].gen2 ? 3 : 2 };
  return true;
}
// 過一晚：配種台的進度（回傳早上要顯示的結果）
function breedTick(run) {
  const B = breedOf(run), out = [];
  for (let i = 0; i < breedSlots(run); i++) {
    const s = B.slots[i]; if (!s) continue;
    s.left--; if (s.left > 0) continue;
    B.slots[i] = null; B.tries++;
    const cut = run.cuttings || (run.cuttings = {});
    if (s.a === s.b && HYBRIDS[s.a]) {
      // 選育：品質往上升
      const q = hybridQ(run, s.a);
      if (q < 3) { B.q[s.a] = q + 1; out.push({ kind: 'up', t: s.a, q: q + 1 }); }
      else { cut[s.a] = Math.min(9, (cut[s.a] || 0) + 2); out.push({ kind: 'max', t: s.a }); }
      continue;
    }
    const h = hybridOf(s.a, s.b);
    if (h) {
      const isNew = !B.found[h];
      if (isNew) { B.found[h] = run.nightIdx || 1; B.hints[h] = { a: 1, b: 1 }; }
      let mut = false;
      if (isNew && Math.random() < 0.15) { B.q[h] = 2; mut = true; } else if (!B.q[h]) B.q[h] = 1;
      cut[h] = Math.min(9, (cut[h] || 0) + 2);
      out.push({ kind: isNew ? 'new' : 'again', t: h, mut, a: s.a, b: s.b });
    } else {
      // 沒配對：留下線索
      const clues = [];
      for (const k in HYBRIDS) {
        if (B.found[k]) continue;
        const H = HYBRIDS[k], hn = B.hints[k] || (B.hints[k] = {});
        for (const side of ['a', 'b']) if ((H[side] === s.a || H[side] === s.b) && !hn[side]) { hn[side] = 1; clues.push(k); }
      }
      const back = Math.random() < 0.5 ? s.a : s.b; cut[back] = Math.min(9, (cut[back] || 0) + 1);
      out.push({ kind: 'fail', a: s.a, b: s.b, clues: [...new Set(clues)], back });
    }
  }
  return out;
}
// 品種權利金：每天早上花市付一筆
function royaltyOf(run) {
  const B = breedOf(run); let v = 0;
  for (const k in B.found) v += Math.round(HYBRIDS[k].price * 0.25 * QMULT[hybridQ(run, k)]);
  return v;
}
// 花園收成：新品種多帶回一支插枝
{
  const _gt = gardenTick;
  gardenTick = function (run) {
    const hv = _gt(run), cut = run.cuttings || (run.cuttings = {});
    for (const h of hv) if (HYBRIDS[h.t]) cut[h.t] = Math.min(9, (cut[h.t] || 0) + 1);
    return hv;
  };
}
// 每晚結束：配種台、權利金
{
  const _nd = Flow.nightDone;
  Flow.nightDone = function (res) {
    const run = G.run;
    const br = breedOpen(run) ? breedTick(run) : [];
    const roy = royaltyOf(run);
    const r = _nd.call(this, res);
    const R = run.lastNight;
    if (R) {
      R.breed = br; R.royalty = roy;
      if (roy) { run.money += roy; R.now += roy; R.total += roy; }
      if (br.some(x => x.kind === 'new')) checkAchievements(run);
    }
    return r;
  };
}
function breedTallyHTML(R) {
  const br = R.breed || [], roy = R.royalty || 0;
  if (!br.length && !roy) return '';
  const line = x => {
    if (x.kind === 'new') return `<p><b>新品種誕生：${FLOWERS[x.t].name}！</b>${x.mut ? '（突變！一開始就是 ★★）' : ''}　${FLOWERS[x.a].name} × ${FLOWERS[x.b].name}，多了 2 支插枝</p>`;
    if (x.kind === 'again') return `<p>又配出${FLOWERS[x.t].name}：插枝 +2</p>`;
    if (x.kind === 'up') return `<p>選育成功：${FLOWERS[x.t].name} 變成 ${'★'.repeat(x.q)}（賣價 ×${QMULT[x.q]}）</p>`;
    if (x.kind === 'max') return `<p>${FLOWERS[x.t].name}已經是最好的品質了，多了 2 支插枝</p>`;
    return `<p>${FLOWERS[x.a].name} × ${FLOWERS[x.b].name}：沒有開出新的花……${x.clues.length ? `<br>可是看得出來，它們跟 ${x.clues.length} 個還沒發現的新品種有關係（配種台和圖鑑多了線索）` : '<br>這兩種花好像都跟新品種沒什麼關係。'}${x.back ? `（${FLOWERS[x.back].name}的插枝還留著一支）` : ''}</p>`;
  };
  return `<div class="newab breed"><span class="tagnew">配種台</span>${br.map(line).join('')}${roy ? `<p>品種權利金：花市付了 <b class="px">${money(roy)}</b>（已算進入帳）</p>` : ''}</div>`;
}

// ---------- 傍晚：配種台 ----------
let BSEL = null;   // { slot, a }
function breedHTML(run) {
  if (!gardenOpen(run)) return '';
  if (!breedOpen(run)) return `<h3>配種台</h3><p class="hint">頂樓蓋到「層架＋遮陽網」就可以把兩種花配在一起，培育偷不到的新品種。</p>`;
  const B = breedOf(run), cut = run.cuttings || {}, n = breedSlots(run);
  const found = Object.keys(B.found).length;
  const slots = [];
  for (let i = 0; i < n; i++) {
    const s = B.slots[i];
    if (s) slots.push(`<div class="bslot busy"><span class="bp"><img src="${G.icons[s.a]}" alt="">${FLOWERS[s.a].name}</span><i>×</i><span class="bp"><img src="${G.icons[s.b]}" alt="">${FLOWERS[s.b].name}</span><small>${s.left <= 1 ? '明天早上揭曉' : `再 ${s.left} 晚`}</small></div>`);
    else slots.push(`<button type="button" class="bslot ${BSEL && BSEL.slot === i ? 'on' : ''}" data-bslot="${i}"><span class="gp-plus">＋</span><small>${BSEL && BSEL.slot === i ? (BSEL.a ? `${FLOWERS[BSEL.a].name} × ？` : '選第一種花') : '配種'}</small></button>`);
  }
  let pick = '';
  if (BSEL) {
    const okT = t => BSEL.a ? (t === BSEL.a ? !!HYBRIDS[t] && (cut[t] || 0) >= 2 : (cut[t] || 0) >= 1) : (cut[t] || 0) >= 1;
    const list = cutOrder().filter(t => (cut[t] || 0) > 0);
    pick = list.length ? `<div class="gpick"><p>${BSEL.a ? `${FLOWERS[BSEL.a].name}要配什麼？${HYBRIDS[BSEL.a] ? '（選同一種＝選育，品質會變好）' : ''}` : '選第一種花的插枝：'}</p>${list.map(t => {
      const ok = okT(t);
      const known = BSEL.a ? hybridOf(BSEL.a, t) : null;
      const tag = BSEL.a && known && B.found[known] ? `<em class="bk-known">${FLOWERS[known].name}</em>` : '';
      return `<button type="button" class="gpick-b" data-bpick="${t}" ${ok ? '' : 'disabled'}><img src="${G.icons[t]}" alt=""><b>${FLOWERS[t].name}${HYBRIDS[t] ? ` ${'★'.repeat(hybridQ(run, t))}` : ''}</b><small>${tag || (HYBRIDS[t] ? '新品種' : '')}</small><i class="px">×${cut[t]}</i></button>`;
    }).join('')}<button type="button" class="gpick-b cancel" data-bpick="">取消</button></div>` : `<div class="gpick"><p>還沒有插枝。晚上偷到花，就會順便帶回那種花的插枝。</p></div>`;
  }
  const clues = HYBRID_ORDER.filter(k => !B.found[k] && B.hints[k] && (B.hints[k].a || B.hints[k].b));
  const clueHTML = clues.length ? `<p class="gcuts">線索：${clues.map(k => { const H = HYBRIDS[k], h = B.hints[k]; return `${h.a ? FLOWERS[H.a].name : '？？？'} × ${h.b ? FLOWERS[H.b].name : '？？？'}`; }).join('、')}</p>` : '';
  return `<h3>配種台<small>發現 ${found}/${HYBRID_ORDER.length} 個新品種・權利金每天 ${money(royaltyOf(run))}</small></h3>
    <p class="hint">兩支插枝配在一起，${n > 1 ? `同時可以配 ${n} 組，` : ''}兩晚後揭曉。沒配對也會留下線索；新品種跟自己配可以提升品質。</p>
    <div class="bslots">${slots.join('')}</div>${pick}${clueHTML}`;
}
function bindBreed(card, run, keep) {
  card.querySelectorAll('[data-bslot]').forEach(b => b.addEventListener('click', () => { SFX.play('ui'); const i = +b.dataset.bslot; BSEL = BSEL && BSEL.slot === i ? null : { slot: i, a: null }; keep(); }));
  card.querySelectorAll('[data-bpick]').forEach(b => b.addEventListener('click', () => {
    const t = b.dataset.bpick;
    if (!t || !BSEL) { BSEL = null; keep(); return; }
    if (!BSEL.a) { BSEL.a = t; SFX.play('ui'); keep(); return; }
    const a = BSEL.a, slot = BSEL.slot;
    if (a === t && !HYBRIDS[t]) { SFX.play('nope'); UI.toast('同一種花配在一起不會變。新品種才能跟自己配（選育）', 2600); return; }
    if (startBreed(run, slot, a, t)) { SFX.play('buy'); UI.toast(`${FLOWERS[a].name} × ${FLOWERS[t].name} 放上配種台了！`, 2400); }
    else { SFX.play('nope'); UI.toast('插枝不夠', 1800); }
    BSEL = null; keep();
  }));
}
// 花園分頁接上配種台；插枝清單也列出新品種
{
  const _gt = gardenTabHTML;
  gardenTabHTML = function (run, pickIdx) { return _gt(run, pickIdx) + breedHTML(run); };
}

// ---------- 白天：配種的故事、花展 ----------
function* breedStoryScript(S) {
  const run = S.run, f = run.flags, B = breedOf(run);
  if (breedOpen(run) && !f.breedIntro) {
    f.breedIntro = 1; S.shopOn = false;
    const t = S.customer('teacher'); yield S.walkIn(t);
    yield* S.talk(t, '花藝老師', [
      ['妳好，我是隔壁巷教插花的。聽說妳頂樓有一座小花園？'],
      ['我年輕的時候做過育種：把兩種花的花粉配在一起，運氣好就會開出世界上沒有的花。'],
      ['像是紅玫瑰配繡球……說不定會開出藍色的玫瑰喔。'],
      ['妳試試看。配出新品種的話，花市會付妳權利金呢。'],
    ]);
    yield S.walkOut(t);
    B.hints.bluerose = { a: 1, b: 1 };
    UI.toast('頂樓花園多了「配種台」：兩支插枝配在一起，兩晚後揭曉。先試試紅玫瑰 × 繡球花！', 4600);
    return true;
  }
  // 第一次配出新品種：美玲好興奮
  const firstNew = Object.keys(B.found).length >= 1 && !f.breedFirst;
  if (firstNew) {
    f.breedFirst = 1;
    const k = Object.keys(B.found)[0];
    yield S.say(`花喵！頂樓的配種台開花了……是${FLOWERS[k].name}！`);
    yield S.say('全世界只有我們有這種花耶。今天就擺在櫃台最前面！');
    const t = S.customer('teacher'); yield S.walkIn(t);
    yield* S.talk(t, '花藝老師', [[`${FLOWERS[k].name}！妳真的配出來了……`], ['我已經幫妳跟花市登記了。以後每賣出一株，他們都會付妳權利金。'], ['對了，每個月第三天社區有花展。拿妳最好的品種去參加吧！']]);
    yield S.walkOut(t);
    return true;
  }
  return false;
}
const SHOW_PRIZE = [null, { name: '銅牌', money: 4000, cans: 10 }, { name: '銀牌', money: 12000, cans: 20 }, { name: '金牌', money: 30000, cans: 40 }];
function* flowerShowScript(S, n) {
  const run = S.run, B = breedOf(run), m = run.month || 1;
  if (n !== 3 || !Object.keys(B.found).length || B.shows[m]) return false;
  // 拿最好的：品質 × 價錢
  const best = Object.keys(B.found).sort((a, b) => FLOWERS[b].price * QMULT[hybridQ(run, b)] - FLOWERS[a].price * QMULT[hybridQ(run, a)])[0];
  const q = hybridQ(run, best);
  const score = FLOWERS[best].price * QMULT[q] * (0.85 + Math.random() * 0.3);
  const tier = score >= 2600 ? 3 : score >= 1100 ? 2 : 1;
  const P = SHOW_PRIZE[tier];
  const wasOn = S.shopOn; S.shopOn = false;
  const c = S.customer('chief'); yield S.walkIn(c);
  yield* S.talk(c, '里長', [['美玲！今天社區花展，妳的花也報名了喔！'], [`評審看到${FLOWERS[best].name}${'★'.repeat(q)}都嚇一跳……`], [`結果出爐：${P.name}！獎金 ${money(P.money)}！`]]);
  B.shows[m] = 1; run.money += P.money; run.cans += P.cans; B.medals = B.medals || {}; B.medals[tier] = (B.medals[tier] || 0) + 1;
  SFX.play('coin'); S.fx.hearts(S.cat.x, S.cat.y - 10, 8);
  UI.toast(`社區花展：${FLOWERS[best].name} 拿到${P.name}！現金 ${money(P.money)}、罐罐 +${P.cans}${tier < 3 ? '（品質★越高、品種越稀有，越有機會拿金牌）' : ''}`, 4800);
  yield S.walkOut(c);
  S.shopOn = wasOn;
  return true;
}

// ---------- 圖鑑：品種 ----------
function breedBookHTML(run) {
  const B = breedOf(run);
  if (!breedOpen(run) && !Object.keys(B.found).length) return '<p class="lead">頂樓花園蓋到「層架＋遮陽網」就可以開始配種。</p>';
  const rows = HYBRID_ORDER.map(k => {
    const H = HYBRIDS[k], got = B.found[k], h = B.hints[k] || {};
    const pa = got || h.a ? FLOWERS[H.a].name : '？？？', pb = got || h.b ? FLOWERS[H.b].name : '？？？';
    return `<li class="fl ${got ? 'got' : ''}"><img src="${G.icons[k]}" alt=""><div><b>${got ? H.name : '？？？'}</b>${got ? `<span class="px">${H.price}</span><em>${'★'.repeat(hybridQ(run, k))}</em>` : ''}${H.gen2 ? '<em>第二代</em>' : ''}${H.rare ? '<em>要玻璃花房</em>' : ''}<p>${pa} × ${pb}${got ? '　' + esc(H.desc) : ''}</p></div><i class="px">${got ? '✔' : '—'}</i></li>`;
  }).join('');
  const md = B.medals || {};
  return `<p class="lead">配出來的新品種、知道的線索。沒配對也會留下線索，慢慢推理出來吧。</p>
    <div class="bk-goal">發現 <b class="px">${Object.keys(B.found).length}/${HYBRID_ORDER.length}</b>　配了 ${B.tries} 次${md[3] || md[2] || md[1] ? `　花展：金 ${md[3] || 0}・銀 ${md[2] || 0}・銅 ${md[1] || 0}` : ''}</div>
    <ul class="fl-list">${rows}</ul>`;
}

// ---------- 圖：新品種的花頭、盆栽 ----------
function hRose(x, y, r, c1, c2, c3, part) {
  O.eo(x, y, r, r * 0.92, c1, { part });
  O.e(x + r * 0.3, y + r * 0.35, r * 0.7, r * 0.5, c2, { only: part });
  O.curve([[x - r * 0.5, y - r * 0.1], [x, y - r * 0.5], [x + r * 0.45, y - r * 0.05], [x, y + r * 0.3]], c3, 0.9);
}
Object.assign(HEAD2, {
  bluerose(x, y, s, r) { hRose(x, y, 3.1 * s, '#5a7ae8', '#3a54b8', '#22348a', 41); },
  galaxyrose(x, y, s, r) { hRose(x, y, 3.3 * s, '#5a3aa8', '#3a2478', '#1e1450', 42); for (let i = 0; i < 5; i++) O.dot(x + Math.cos(i * 2.3 + r) * 1.8 * s, y + Math.sin(i * 2.3 + r) * 1.6 * s, 0.4 * s, '#ffffff'); },
  firebougain(x, y, s, r) { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + r; O.eo(x + Math.cos(a) * 1.6 * s, y + Math.sin(a) * 1.5 * s, 2 * s, 1.6 * s, i % 2 ? '#ff6a2a' : '#ff8a3a', { rot: a }); } O.dot(x, y, 0.7 * s, '#ffe66a'); },
  perfcarn(x, y, s, r) {
    O.blobO([[x - 2.6 * s, y + 0.6 * s], [x - 2.2 * s, y - 1.4 * s], [x - 1 * s, y - 2.4 * s], [x + 0.6 * s, y - 2.2 * s], [x + 2.2 * s, y - 1.6 * s], [x + 2.7 * s, y + 0.2 * s], [x + 1.6 * s, y + 1.6 * s], [x - 1.4 * s, y + 1.8 * s]], '#e4c4f2');
    O.curve([[x - 1.8 * s, y - 0.4 * s], [x - 0.6 * s, y - 1.2 * s], [x + 0.6 * s, y - 0.6 * s], [x + 1.8 * s, y - 1.1 * s]], '#b88ad0', 0.6);
    O.curve([[x - 1.6 * s, y + 0.8 * s], [x - 0.2 * s, y + 0.2 * s], [x + 1.4 * s, y + 0.7 * s]], '#b88ad0', 0.6);
  },
  goldsun(x, y, s, r) {
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + r; O.eo(x + Math.cos(a) * 2.8 * s, y + Math.sin(a) * 2.6 * s, 1.5 * s, 0.8 * s, i % 2 ? '#ffb81a' : '#ff9a1a', { rot: a }); }
    O.eo(x, y, 1.9 * s, 1.8 * s, '#8a4a12'); O.dot(x - 0.5 * s, y - 0.5 * s, 0.6 * s, '#ffe08a'); O.dot(x + 2.6 * s, y - 2.4 * s, 0.4 * s, '#ffffff');
  },
  rainbowhyd(x, y, s, r) {
    O.eo(x, y, 3.3 * s, 3 * s, '#c8a8f0', { part: 43 });
    const cols = ['#ff9fbb', '#ffd84d', '#9fe8a8', '#7ab8f0', '#c88af0'];
    [[-1.6, -1.2], [1, -1.6], [-0.4, 0.4], [1.8, 0.6], [-1.8, 1]].forEach(([dx, dy], i) => { const cx = x + dx * s, cy = y + dy * s; for (let k = 0; k < 4; k++) O.e(cx + Math.cos(k * 1.57 + 0.4) * 0.55 * s, cy + Math.sin(k * 1.57 + 0.4) * 0.55 * s, 0.55 * s, 0.55 * s, cols[i], { only: 43 }); });
  },
  dreamcam(x, y, s, r) {
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + r; O.eo(x + Math.cos(a) * 2.2 * s, y + Math.sin(a) * 2 * s, 1.9 * s, 1.6 * s, '#ff9fc2', { rot: a }); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + r + 0.3; O.e(x + Math.cos(a) * 1 * s, y + Math.sin(a) * 0.9 * s, 1.3 * s, 1.1 * s, '#fff0f6'); }
    O.dot(x, y, 0.5 * s, '#ffd84d');
  },
  starbaby(x, y, s, r) {
    O.e(x, y, 3.4 * s, 2.8 * s, 'rgba(90,110,220,0.35)');
    for (let j = 0; j < 9; j++) O.dot(x + Math.cos(j * 2.4 + r * 6) * 2.6 * s, y + Math.sin(j * 2.4 + r * 6) * 2 * s, 0.8 * s, '#3a4a9a');
    for (let j = 0; j < 5; j++) O.dot(x + Math.cos(j * 1.9 + r) * 1.8 * s, y + Math.sin(j * 1.9 + r) * 1.4 * s, 0.4 * s, '#ffffff');
  },
  nightlotus(x, y, s, r) {
    for (const [a, col, l] of [[-1.05, '#5a4ab8', 2.2], [1.05, '#5a4ab8', 2.2], [-0.55, '#7a6ae0', 2.6], [0.55, '#7a6ae0', 2.6], [0, '#a89af0', 2.9]]) O.eo(x + Math.sin(a) * l * 0.9 * s, y + 1.2 * s - Math.cos(a) * l * 0.9 * s, 1.25 * s, l * s * 0.85, col, { rot: a });
    O.dot(x, y + 0.9 * s, 0.7 * s, '#ffe08a');
  },
  pinktanhua(x, y, s, r) {
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + r; O.eo(x + Math.cos(a) * 2.3 * s, y + Math.sin(a) * 2.1 * s, 1.9 * s, 0.6 * s, i % 2 ? '#ffd0e0' : '#ffe4ee', { rot: a }); }
    O.e(x, y, 1.4 * s, 1.3 * s, '#fff6f8'); for (let i = 0; i < 5; i++) O.dot(x + Math.cos(i * 1.26) * 0.7 * s, y + Math.sin(i * 1.26) * 0.7 * s, 0.3 * s, '#ffd84d');
  },
  moonorchid(x, y, s, r) {
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; O.eo(x + Math.cos(a) * 2.4 * s, y + Math.sin(a) * 2.2 * s, 2.2 * s, 1.9 * s, '#fff4c0'); }
    O.e(x, y + 0.6 * s, 1.2 * s, 1.4 * s, '#7a9ae8'); O.dot(x, y - 0.2 * s, 0.5 * s, '#ffffff');
  },
  phoenix(x, y, s, r) {
    for (const [a, col, l] of [[-1.1, '#ff4a2a', 2.4], [1.1, '#ff4a2a', 2.4], [-0.55, '#ff8a2a', 3], [0.55, '#ff8a2a', 3], [0, '#ffd84d', 3.4]]) O.eo(x + Math.sin(a) * l * 0.8 * s, y + 1 * s - Math.cos(a) * l * 0.8 * s, 1 * s, l * s * 0.8, col, { rot: a });
    O.dot(x, y + 1 * s, 0.7 * s, '#ffe9a8');
  },
});
for (const k of HYBRID_ORDER) BUNCH[k] = { stem: '#4f8a3c', leaf: true, head: HEAD2[k] };
{
  const _dp2 = drawPlant2;
  drawPlant2 = function (t) {
    if (!HYBRIDS[t]) { _dp2(t); return; }
    const H = HEAD2[t];
    leafBall(-5, -16, 6, 4.6); leafBall(5, -16.5, 6, 4.6); leafBall(0, -20, 6, 4.4);
    for (const [x0, x1, y1] of [[-2, -5, -23], [0, 0.5, -27], [2, 5.5, -24]]) { O.curve([[x0, -14], [x1 * 0.6, (y1 - 14) / 2 - 6], [x1, y1]], CM.ink, 2.2); O.curve([[x0, -14], [x1 * 0.6, (y1 - 14) / 2 - 6], [x1, y1]], PC.stem, 1.1); }
    H(-5, -24, 1.0, 0.3); H(5.5, -25, 0.95, 1.1); H(0.5, -28.5, 1.1, 0.7);
    // 新品種的盆：白瓷金邊
    drawPotBase('white', 20);
    O.blobO([[-9.4, -8.2], [9.4, -8.2], [9.0, -6.6], [-9.0, -6.6]], '#e8c45a');
  };
}
for (const k of HYBRID_ORDER) { const p = HYBRIDS[k].a; if (PLANTS[p]) PLANTS[k] = PLANTS[p]; else if (PLANTS[HYBRIDS[p] && HYBRIDS[p].a]) PLANTS[k] = PLANTS[HYBRIDS[p].a]; if (ICONS[p]) ICONS[k] = ICONS[p]; else if (HYBRIDS[p] && ICONS[HYBRIDS[p].a]) ICONS[k] = ICONS[HYBRIDS[p].a]; }
{
  const _vi = vectorIcons;
  vectorIcons = function () { const out = _vi(); for (const k of HYBRID_ORDER) out[k] = toonFrame('icon-' + k, 10, 12.5, () => { OT.set(0); drawSprig(k); }).toDataURL(); return out; };
}
