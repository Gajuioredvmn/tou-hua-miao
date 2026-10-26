// ================= 花喵幫遠征 =================
// 派花喵幫的貓去遠一點的地方（一到三晚），回來帶著花、插枝、罐罐、紀念品，還有一篇遠征日記。
//   ・去遠征的貓那幾晚不能幫忙偷巷子的花
//   ・每隻貓會升級（最多五級）：級數越高，遠征越順利、帶回越多
//   ・特定的組合有默契加成（例如小黑＋煤炭：影子雙人組，絕對不會失手）
//   ・完成遠征會解鎖更遠的地方；每個地方第一次去會帶回一樣紀念品（圖鑑「事件」頁）
//   ・山上的苗圃有稀有插枝（配種用）、花博公園有神秘的種子（新品種的線索）
const EXPEDS = [
  { id: 'river', name: '河堤花海', nights: 1, need: 1, risk: 0.08, unlock: 0, souvenir: '河堤撿到的漂亮石頭', desc: '河堤邊開滿野花，近又安全。', loot: { flowers: [['sunflower', 'babys', 'periwinkle', 'carnation'], 4, 6], cans: [4, 8] } },
  { id: 'market', name: '夜市後巷', nights: 1, need: 1, risk: 0.15, unlock: 0, souvenir: '夜市的小木頭彈珠', desc: '攤販收攤後，後巷有吃不完的東西。', loot: { cans: [10, 20], fish: [1, 2], flowers: [['rose', 'carnation'], 1, 3] } },
  { id: 'campus', name: '大學校園', nights: 2, need: 2, risk: 0.18, unlock: 2, souvenir: '一張被叼回來的考卷（58 分）', desc: '校園裡的繡球和桔梗開得很好，可是晚上有警衛。', loot: { flowers: [['hydrangea', 'lisianthus', 'magnolia', 'jasmine'], 5, 8], cans: [6, 12], gacha: [0, 1] } },
  { id: 'wholesale', name: '花市批發場', nights: 2, need: 2, risk: 0.22, unlock: 2, souvenir: '批發場的紅色拍賣號碼牌', desc: '凌晨的花市，地上掉了好多插枝。', loot: { cuts: [['rose', 'hydrangea', 'jasmine', 'osmanthus', 'lisianthus', 'carnation', 'sunflower', 'magnolia', 'babys', 'bougain'], 3, 5], flowers: [['rose', 'lisianthus', 'hydrangea'], 3, 5] } },
  { id: 'nursery', name: '山上的苗圃', nights: 3, need: 3, risk: 0.28, unlock: 4, souvenir: '苗圃老闆的舊草帽', desc: '路很遠，可是有平常拿不到的稀有插枝。', loot: { cuts: [['peony', 'orchid', 'tanhua', 'camellia', 'plumeria'], 2, 4], flowers: [['peony', 'orchid', 'tanhua'], 1, 3], clue: [1, 1] } },
  { id: 'expo', name: '花博公園', nights: 3, need: 3, risk: 0.32, unlock: 6, souvenir: '花博紀念徽章', desc: '全台灣最大的花園。帶回來的東西可能改變一切。', loot: { flowers: [['peony', 'orchid', 'hydrangea', 'lisianthus', 'rose'], 6, 10], cans: [20, 40], seed: [1, 1], money: [8000, 16000] } },
];
const EXP_SYNERGY = [
  { a: 'black', b: 'coal', name: '影子雙人組', desc: '絕對不會失手', safe: true },
  { a: 'calico', b: 'white', name: '招福組合', desc: '帶回的東西多三成', more: 1.3 },
  { a: 'ginger', b: 'calico', name: '大橘帶路', desc: '多叼回 2 朵花', plus: 2 },
  { a: 'white', b: 'coal', name: '黑白配', desc: '帶回一條魚', fish: 1 },
];
const EXP_XP = [0, 2, 5, 9, 14];
function expOf(run) { return run.exped || (run.exped = { active: [], done: 0, seen: {}, log: [] }); }
function memberLv(st) { let lv = 1; for (let i = 0; i < EXP_XP.length; i++) if ((st.xp || 0) >= EXP_XP[i]) lv = i + 1; return lv; }
function expUnlocked(run, d) { return expOf(run).done >= d.unlock; }
function freeMembers(run) { return gangMembers(run).filter(m => { const st = gangOf(run)[m.id]; return !st.caught && !st.away && !st.rest; }); }
function synergyOf(ids) { return EXP_SYNERGY.filter(s => ids.includes(s.a) && ids.includes(s.b)); }
function startExped(run, id, ids) {
  const d = EXPEDS.find(x => x.id === id), E = expOf(run);
  if (!d || !expUnlocked(run, d) || ids.length < d.need || E.active.some(a => a.id === id)) return false;
  const G2 = gangOf(run);
  for (const m of ids) { const st = G2[m]; if (!st || st.caught || st.away || st.rest) return false; }
  for (const m of ids) G2[m].away = id;
  E.active.push({ id, ids: ids.slice(), left: d.nights });
  return true;
}
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function resolveExped(run, a) {
  const d = EXPEDS.find(x => x.id === a.id), E = expOf(run), G2 = gangOf(run);
  const mem = a.ids.map(id => GANG.find(m => m.id === id)).filter(Boolean);
  const lvSum = a.ids.reduce((s, id) => s + memberLv(G2[id] || {}), 0);
  const syn = synergyOf(a.ids);
  const safe = syn.some(s => s.safe) || a.ids.includes('black') && d.risk < 0.2;
  const fail = !safe && Math.random() < Math.max(0.02, d.risk - lvSum * 0.03);
  const more = syn.reduce((k, s) => k * (s.more || 1), 1) * (1 + (lvSum - a.ids.length) * 0.06);
  const out = { id: d.id, name: d.name, ids: a.ids, names: mem.map(m => m.name), fail, flowers: [], cuts: [], cans: 0, fish: 0, money: 0, gacha: 0, clue: null, seed: null, souvenir: null, syn: syn.map(s => s.name), lvup: [], diary: '' };
  if (!fail) {
    const L = d.loot;
    if (L.flowers) { const n = Math.round(rint(L.flowers[1], L.flowers[2]) * more) + syn.reduce((k, s) => k + (s.plus || 0), 0) + (a.ids.includes('ginger') ? 1 : 0); for (let i = 0; i < n; i++) out.flowers.push(pick(L.flowers[0])); if (a.ids.includes('calico') && Math.random() < 0.4) out.flowers.push(pick(['peony', 'orchid'])); }
    if (L.cuts) { const n = Math.round(rint(L.cuts[1], L.cuts[2]) * more); for (let i = 0; i < n; i++) out.cuts.push(pick(L.cuts[0])); }
    if (L.cans) out.cans = Math.round(rint(L.cans[0], L.cans[1]) * more);
    if (L.fish) out.fish = rint(L.fish[0], L.fish[1]);
    out.fish += syn.reduce((k, s) => k + (s.fish || 0), 0);
    if (L.money) out.money = Math.round(rint(L.money[0], L.money[1]) * more / 100) * 100;
    if (L.gacha) out.gacha = rint(L.gacha[0], L.gacha[1]);
    if (L.clue && typeof breedOf === 'function') {
      const B = breedOf(run), cand = HYBRID_ORDER.filter(k => !B.found[k] && !(B.hints[k] && B.hints[k].a && B.hints[k].b));
      if (cand.length) { const k = pick(cand); const h = B.hints[k] || (B.hints[k] = {}); if (!h.a) h.a = 1; else h.b = 1; out.clue = k; }
    }
    if (L.seed && typeof breedOf === 'function') {
      const B = breedOf(run), cand = HYBRID_ORDER.filter(k => !B.found[k]);
      if (cand.length) { const k = pick(cand); B.hints[k] = { a: 1, b: 1 }; out.seed = k; }
    }
    if (!E.seen[d.id]) { E.seen[d.id] = run.nightIdx || 1; out.souvenir = d.souvenir; }
  } else {
    for (const id of a.ids) if (G2[id]) G2[id].rest = 2;
    out.cans = rint(1, 3);
  }
  // 經驗值
  for (const id of a.ids) {
    const st = G2[id]; if (!st) continue;
    const was = memberLv(st); st.xp = (st.xp || 0) + d.nights + (fail ? 0 : 1); st.exps = (st.exps || 0) + 1;
    if (memberLv(st) > was) out.lvup.push(GANG.find(m => m.id === id).name + ' Lv.' + memberLv(st));
  }
  E.done += fail ? 0 : 1;
  out.diary = expDiary(d, out);
  E.log.unshift({ n: run.nightIdx || 1, id: d.id, fail, names: out.names }); if (E.log.length > 12) E.log.length = 12;
  return out;
}
function expDiary(d, o) {
  const who = o.names.join('和');
  if (o.fail) return pick([`${who}在${d.name}被人發現，一路逃回來，累得趴在貓窩裡起不來（休息一晚）。`, `${who}在${d.name}迷路了，繞了好久才回家，什麼都沒帶到（休息一晚）。`]);
  const lines = {
    river: [`${who}在河堤上追了一整晚的螢火蟲，順便叼回一大把野花。`, `河堤的風好舒服，${who}在草地上打滾，回來全身都是花瓣。`],
    market: [`${who}在夜市後巷被炸雞攤的老闆餵得飽飽的，還偷偷帶了魚回來。`, `${who}跟夜市的流浪貓們交換了情報，順便叼回幾個罐頭。`],
    campus: [`${who}在大學圖書館的窗台上睡了一晚，回程經過繡球花步道。`, `${who}被一群熬夜的大學生拍照、餵食，臨走前從花壇叼了好幾朵花。`],
    wholesale: [`凌晨三點的花市好熱鬧，${who}在推車底下撿了一堆插枝。`, `${who}跟著送貨的機車溜進批發場，叼回來的插枝夠種好幾盆。`],
    nursery: [`山上的苗圃好冷，${who}縮在溫室旁邊，等老闆睡著才行動。`, `${who}爬了一整晚的山路，在苗圃的角落找到幾支稀有的插枝。`],
    expo: [`${who}在花博公園的大溫室裡迷路，卻意外找到一顆神秘的種子。`, `${who}躲過三個警衛、兩隻狗，從全台灣最大的花園凱旋歸來。`],
  }[d.id];
  return pick(lines);
}
// 每晚結束：遠征的進度
{
  const _gn = gangNight;
  gangNight = function (run, n) {
    // 休息、遠征中的貓不出門
    const G2 = gangOf(run), hide = [];
    for (const id in G2) { const st = G2[id]; if (st && (st.away || st.rest) && !st.caught) { hide.push([id, st.caught]); st.caught = st.away || 'rest'; } }
    const res = _gn(run, n);
    for (const [id, c] of hide) G2[id].caught = c;
    for (const id in G2) if (G2[id] && G2[id].rest > 0 && !G2[id].away) G2[id].rest--;
    return res;
  };
  const _nd = Flow.nightDone;
  Flow.nightDone = function (res) {
    const run = G.run, E = expOf(run), back = [];
    for (const a of E.active) a.left--;
    for (const a of E.active.filter(a => a.left <= 0)) back.push(resolveExped(run, a));
    E.active = E.active.filter(a => a.left > 0);
    // 帶回來的花直接進店裡（算在今晚的花裡）
    for (const o of back) for (const t of o.flowers) res.deposited.push({ t, fresh: 0.9, owner: null, raid: true, gang: 'exp' });
    const r = _nd.call(this, res);
    // 今晚才回來的貓：明晚開始可以出門
    for (const o of back) for (const id of o.ids) if (gangOf(run)[id]) gangOf(run)[id].away = null;
    const L = run.lastNight;
    if (L) L.exped = back;
    for (const o of back) {
      run.cans += o.cans; run.money += o.money; if (L) L.now += o.money;
      if (o.fish) { const Z = zonesOf(run); Z.fish = (Z.fish || 0) + o.fish; }
      if (o.cuts.length) { const cut = run.cuttings || (run.cuttings = {}); for (const t of o.cuts) cut[t] = Math.min(9, (cut[t] || 0) + 1); }
      if (o.gacha) { const W = wardrobe(run); for (let i = 0; i < o.gacha; i++) { const x = rollOne(run, false); o.gachaGot = (o.gachaGot || []).concat(x.it.name); } }
    }
    if (back.length) checkAchievements(run);
    return r;
  };
}
function expedTallyHTML(R) {
  const ex = R.exped || []; if (!ex.length) return '';
  return `<div class="newab exped"><span class="tagnew">遠征回來了</span>${ex.map(o => {
    const bits = [];
    if (o.flowers.length) bits.push(`花 ${o.flowers.length} 朵`);
    if (o.cuts.length) bits.push(`插枝：${[...new Set(o.cuts)].map(t => FLOWERS[t].name).join('、')}`);
    if (o.cans) bits.push(`罐罐 +${o.cans}`); if (o.fish) bits.push(`小魚 +${o.fish}`); if (o.money) bits.push(money(o.money));
    if (o.gachaGot) bits.push(`撿到衣服：${o.gachaGot.join('、')}`);
    if (o.clue) bits.push('新品種的線索 +1'); if (o.seed) bits.push(`神秘的種子：${FLOWERS[o.seed].name}的配方！`);
    return `<p><b>${o.name}</b>（${o.names.join('、')}）${o.syn.length ? `<em class="syn">${o.syn.join('、')}</em>` : ''}<br><i class="diary">${esc(o.diary)}</i>${bits.length ? '<br>' + bits.join('・') : ''}${o.souvenir ? `<br>紀念品：${esc(o.souvenir)}` : ''}${o.lvup.length ? `<br>升級了：${o.lvup.join('、')}` : ''}</p>`;
  }).join('')}</div>`;
}
// ---------- 傍晚：老貓攤的遠征板 ----------
let EXSEL = null;   // { id, ids: [] }
function expedHTML(run) {
  if (!gangOpen(run) || !gangMembers(run).length) return '';
  const E = expOf(run), G2 = gangOf(run), free = freeMembers(run);
  const act = E.active.map(a => { const d = EXPEDS.find(x => x.id === a.id); return `<li class="exp-on"><b>${d.name}</b><span>${a.ids.map(id => GANG.find(m => m.id === id).name).join('、')}　還要 ${a.left} 晚</span></li>`; }).join('');
  const rows = EXPEDS.map(d => {
    const ok = expUnlocked(run, d), busy = E.active.some(a => a.id === d.id), sel = EXSEL && EXSEL.id === d.id;
    if (!ok) return `<li class="exp locked"><div><b>？？？</b><span>完成 ${d.unlock} 次遠征後解鎖</span></div></li>`;
    const pickHTML = sel ? `<div class="exp-pick">${gangMembers(run).map(m => { const st = G2[m.id], can = free.includes(m), on = EXSEL.ids.includes(m.id); return `<button type="button" class="exp-m ${on ? 'on' : ''}" data-expm="${m.id}" ${can ? '' : 'disabled'}>${m.name}<small>Lv.${memberLv(st)}${st.away ? '・遠征中' : st.rest ? '・休息' : st.caught ? '・被抓' : ''}</small></button>`; }).join('')}
      ${synergyOf(EXSEL.ids).map(s => `<p class="exp-syn">默契：${s.name}（${s.desc}）</p>`).join('')}
      <button type="button" class="buy exp-go" data-expgo="1" ${EXSEL.ids.length >= d.need ? '' : 'disabled'}>出發（${EXSEL.ids.length}/${d.need}）</button></div>` : '';
    return `<li class="exp ${busy ? 'busy' : ''} ${sel ? 'sel' : ''}"><div><b>${d.name}${E.seen[d.id] ? ' ✔' : ''}</b><span>${esc(d.desc)}</span><span class="exp-meta">${d.nights} 晚・要 ${d.need} 隻貓・危險 ${'！'.repeat(Math.ceil(d.risk * 10 / 1.2))}</span></div>
      ${busy ? '<em>遠征中</em>' : `<button type="button" class="exp-b" data-exp="${d.id}">${sel ? '取消' : '派貓去'}</button>`}${pickHTML}</li>`;
  }).join('');
  return `<h3 class="gang-h">花喵幫遠征<small>完成 ${E.done} 次・遠征的貓那幾晚不會幫忙偷花</small></h3>${act ? `<ul class="exp-act">${act}</ul>` : ''}<ul class="exp-list">${rows}</ul>`;
}
function bindExped(card, run, keep) {
  card.querySelectorAll('[data-exp]').forEach(b => b.addEventListener('click', () => { SFX.play('ui'); const id = b.dataset.exp; EXSEL = EXSEL && EXSEL.id === id ? null : { id, ids: [] }; keep(); }));
  card.querySelectorAll('[data-expm]').forEach(b => b.addEventListener('click', () => {
    if (!EXSEL) return; const id = b.dataset.expm, d = EXPEDS.find(x => x.id === EXSEL.id);
    const i = EXSEL.ids.indexOf(id);
    if (i >= 0) EXSEL.ids.splice(i, 1); else if (EXSEL.ids.length < Math.max(d.need, 3)) EXSEL.ids.push(id);
    SFX.play('ui'); keep();
  }));
  card.querySelectorAll('[data-expgo]').forEach(b => b.addEventListener('click', () => {
    if (!EXSEL) return; const d = EXPEDS.find(x => x.id === EXSEL.id);
    if (startExped(run, EXSEL.id, EXSEL.ids)) { SFX.play('meow'); UI.toast(`${EXSEL.ids.map(id => GANG.find(m => m.id === id).name).join('、')}出發去${d.name}了！${d.nights} 晚後回來`, 3000); }
    EXSEL = null; keep();
  }));
}
function expedBookHTML(run) {
  const E = expOf(run);
  if (!gangOpen(run)) return '';
  return `<h3>遠征紀念品　${Object.keys(E.seen).length}/${EXPEDS.length}</h3><ul class="ev-list">${EXPEDS.map(d => `<li class="${E.seen[d.id] ? 'got' : ''}"><b>${E.seen[d.id] ? esc(d.souvenir) : '？？？'}</b><span>${E.seen[d.id] ? d.name : ''}</span></li>`).join('')}</ul>`;
}
