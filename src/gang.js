// ================= 花喵幫（第三個月起）=================
// 巷子裡的流浪貓被花喵收編。每晚出門前派牠們去一戶人家，天亮前各自叼花回來。
// 每隻貓長得不一樣、本事不一樣；收編越多，白天店裡窩著的貓就越多（看得到）。
// 被派去戒備森嚴（兩顆星以上）的人家，有機會被抓到，隔天那家人會抱著牠來店裡討公道。
const GANG = [
  { id: 'calico', name: '三花', cost: 30, need: 0, perk: 'luck', desc: '運氣好：偶爾叼回稀有的花（牡丹、蝴蝶蘭）', scarf: 1,
    pal: { fur: '#f6f1e8', furL: '#ffffff', furD: '#ddd2c2', stripe: '#e08a3c', cream: '#ffffff', creamS: '#efe6d8', eye: '#f2c94c', eyeD: '#b8902a', ear: '#f6b0a0' } },
  { id: 'black', name: '小黑', cost: 50, need: 1, perk: 'stealth', desc: '影子一樣：從來不會被抓到', scarf: 3,
    pal: { fur: '#2e2b36', furL: '#4a4656', furD: '#1e1c24', stripe: '#26232d', cream: '#3c3946', creamS: '#2e2b36', eye: '#e8d84a', eyeD: '#a89a2a', ear: '#6a5260', nose: '#5a4450', noseD: '#3a2c34', out: '#141218' } },
  { id: 'ginger', name: '獨眼大橘', cost: 80, need: 2, perk: 'strong', desc: '力氣大：一次叼回 3 朵', scarf: 2,
    pal: { fur: '#e2852e', furL: '#f4ae5e', furD: '#b8641c', stripe: '#984210', cream: '#fff0dc', creamS: '#ecd2ae', eye: '#f4cf4e', eyeD: '#b8902a' } },
  { id: 'white', name: '小白', cost: 120, need: 3, perk: 'charm', desc: '人見人愛：被看到也只會被摸摸，那家的警戒不會上升', scarf: 2,
    pal: { fur: '#f8f6f2', furL: '#ffffff', furD: '#e2ddd4', stripe: '#ebe6de', cream: '#ffffff', creamS: '#efeae2', eye: '#7ab8f0', eyeD: '#4a88c0', ear: '#ffb8c0' } },
  { id: 'grey', name: '阿灰', cost: 160, need: 4, perk: 'scout', desc: '會看訂單：專挑今晚訂單要的花', scarf: 1,
    pal: { fur: '#9a9aa8', furL: '#bcbcc8', furD: '#76768a', stripe: '#5c5c6c', cream: '#e8e8ee', creamS: '#cfcfd8', eye: '#8fdc5c', eyeD: '#5aa83a' } },
];
const GANG_TARGETS = ['public', 'empty', 'lin', 'wang', 'bo', 'mansion'];
function gangOf(run) { return run.gang || (run.gang = {}); }
function gangMembers(run) { const g = gangOf(run); return GANG.filter(m => g[m.id]); }
function gangOpen(run) { return !!(run.flags && run.flags.gangIntro); }
function gangTargetOk(run, o) { return o === 'shop' ? catCornerLv(run) >= 1 : (o !== 'mansion' || !!run.upg.jump); }
function gangDefaultTarget(run) {
  const ok = GANG_TARGETS.filter(o => gangTargetOk(run, o));
  return ok.sort((a, b) => (heatOf(run, a) || 0) - (heatOf(run, b) || 0))[0];
}
function recruitGang(run, id) {
  const m = GANG.find(x => x.id === id), g = gangOf(run);
  if (!m || g[id] || run.cans < m.cost || (run.strays || 0) < m.need) return false;
  run.cans -= m.cost; g[id] = { target: gangDefaultTarget(run), caught: null, hauls: 0 };
  return true;
}
function cycleGangTarget(run, id) {
  const st = gangOf(run)[id]; if (!st || st.caught) return;
  const ok = GANG_TARGETS.concat(['shop']).filter(o => gangTargetOk(run, o));
  st.target = ok[(ok.indexOf(st.target) + 1) % ok.length];
}
// 天亮：各自帶花回來（回傳 { flowers, report }）
function gangNight(run, n) {
  const out = [], report = [];
  const orders = (run.orders && run.orders[n]) || [];
  for (const m of gangMembers(run)) {
    const st = gangOf(run)[m.id];
    if (st.caught) continue;
    const o = st.target || gangDefaultTarget(run);
    if (o === 'shop') continue;   // 在店裡上班
    const types = NIGHT_POTS.filter(p => p.owner === o && p.t !== 'lily').map(p => p.t);
    if (!types.length) continue;
    // 戒備森嚴的人家可能被抓（小黑不會）
    const stars = starsOf(run, o);
    if (m.perk !== 'stealth' && stars >= 2 && Math.random() < (stars >= 3 ? 0.5 : 0.3)) {
      st.caught = o; report.push({ id: m.id, name: m.name, o, caught: true, got: [] });
      continue;
    }
    const k = m.perk === 'strong' ? 3 : 2, got = [];
    for (let i = 0; i < k; i++) {
      let t = pick(types);
      if (m.perk === 'scout' && orders.length) { const want = orders.map(x => x.t); t = pick(want); }
      if (m.perk === 'luck' && Math.random() < 0.25) t = pick(['peony', 'orchid']);
      got.push(t);
      out.push({ t, fresh: 1, owner: m.perk === 'charm' ? null : o, raid: true, gang: m.id });
    }
    st.hauls = (st.hauls || 0) + got.length;
    report.push({ id: m.id, name: m.name, o, caught: false, got });
  }
  return { flowers: out, report };
}

// ---------- 劇情 ----------
// 第三個月的某天早上：流浪貓集會，花喵幫成立
function* gangIntroScript(S) {
  const run = S.run;
  if (gangOpen(run) || (run.month || 1) < 2) return false;
  run.flags.gangIntro = 1;
  const wasOn = S.shopOn; S.shopOn = false;
  yield S.say('花喵……門口怎麼聚了這麼多貓？');
  yield S.say('三花、小黑、還有那隻獨眼的大橘……牠們全部都看著你耶。');
  yield S.say((run.strays || 0) > 0 ? '是你之前分罐罐的那些朋友嗎？牠們好像想跟著你。' : '牠們好像……想跟著你？');
  S.cat.pose = 'loaf'; S.fx.hearts(S.cat.x, S.cat.y - 10, 5); SFX.play('meow');
  yield wait(1.0); S.cat.pose = null;
  yield S.say('好吧，花喵老大。以後牠們就是你的小弟了！');
  UI.hideDialog();
  UI.toast('花喵幫成立！傍晚到「老貓攤」用罐罐收編流浪貓，晚上出門前派牠們去偷花', 4200);
  if (wasOn) S.startShop();
  return true;
}
// 被抓到的貓：隔天早上那家人抱著牠來
function* gangRescueScript(S) {
  const run = S.run;
  for (const m of gangMembers(run)) {
    const st = gangOf(run)[m.id]; if (!st.caught) continue;
    const o = st.caught, O = OWNERS[o];
    const fine = 600 * (run.month || 1);
    const wasOn = S.shopOn; S.shopOn = false;
    const who = O.key ? S.customer(O.key) : null;
    if (who) {
      yield S.walkIn(who, COUNTER_SPOT2);
      yield* S.talk(who, O.person, [[`美玲，這隻${m.name}是妳家的吧？昨晚在我家院子叼花被我抓到了。`], ['最近一直有貓來偷花……妳要好好管管。'], [`真、真的很對不起！花我賠給你……`, null, 'M']]);
      yield S.walkOut(who);
    } else yield S.say(`${m.name}一跛一跛地自己走回來了……昨晚好像被嚇到了。`);
    run.money -= fine; heatAdd(run, o, -8); st.caught = null;
    UI.toast(`把${m.name}帶回來了，賠了 ${money(fine)}`, 3000); SFX.play('fail');
    if (wasOn) S.startShop();
    return true;
  }
  return false;
}

// ---------- 圖：每隻貓換毛色 ----------
function toonGang(m, oc, k = 0.9) {
  const save = {};
  for (const key in m.pal) { save[key] = TAB[key]; TAB[key] = m.pal[key]; }
  TOON_PREFIX = 'g' + m.id + '-';
  try { const a = toonCat(oc, { scarf: m.scarf }); return a; } finally { TOON_PREFIX = ''; Object.assign(TAB, save); }
}
function gangLoaf(m, t, act) { const c = Object.assign(new Cat(0, 0), { pose: 'loaf', act: act || 'none', t: t || 1, dir: 'down' }); return ART.fix(toonGang(m, c)); }
// 白天：收編的貓窩在店裡（越收越多）
const GANG_SPOTS = [[2.3, 9.4], [13.2, 10.6], [9.2, 15.3], [4.0, 15.2], [12.0, 15.6], [1.6, 13.4]];
function gangDay3D(sc, F) {
  const ms = gangMembers(sc.run); if (!ms.length) return;
  const t = sc.cat.t || 0;
  ms.forEach((m, i) => {
    const st = gangOf(sc.run)[m.id]; if (st.caught || st.away || (st.target === 'shop' && catCornerLv(sc.run))) return;
    const [x, z] = GANG_SPOTS[i], ph = Math.floor((t + i * 1.7) / 2.6) % 5;
    const act = ['none', 'blink', 'none', 'ear', 'yawn'][ph];
    pushSprite(F.sprites, gangLoaf(m, 1, act), x * TS, z * TS, { minLight: [0.6, 0.56, 0.55] });
    shadowAt(F, x * TS, z * TS, 0.7, 0.26);
  });
}
// 傍晚老貓攤裡的收編區
function gangShopHTML(run) {
  if (!gangOpen(run)) return '';
  const rows = GANG.filter(m => !m.hidden || gangOf(run)[m.id]).map(m => {
    const st = gangOf(run)[m.id], need = (run.strays || 0) < m.need;
    const btn = st ? `<button type="button" class="buy" disabled>${st.caught ? '被抓了' : '小弟'}</button>`
      : `<button type="button" class="buy" data-gang="${m.id}" ${need || run.cans < m.cost ? 'disabled' : ''}><img src="${G.icons.can}" alt="罐罐"><b class="px">${m.cost}</b></button>`;
    return `<li class="up gang ${st ? 'maxed' : ''} ${need && !st ? 'locked' : ''}"><canvas class="gang-face" data-gid="${m.id}" width="64" height="56"></canvas>
      <div class="up-main"><div class="up-name"><span class="grp gangtag">花喵幫</span><b>${m.name}</b></div>
      <div class="up-now">${esc(m.desc)}</div><div class="up-next">${st ? `已經帶回 ${st.hauls || 0} 朵花` : need ? `要先跟 ${m.need} 隻流浪貓打好關係（白天分罐罐；現在 ${run.strays || 0}）` : '收編後晚上可以派牠出門'}</div></div>${btn}</li>`;
  }).join('');
  return `<h3 class="gang-h">花喵幫<small>收編 ${gangMembers(run).length}/${GANG.length}</small></h3><ul class="ups">${rows}</ul>`;
}
function drawGangFaces(root) {
  root.querySelectorAll('canvas.gang-face').forEach(cv => {
    const m = GANG.find(x => x.id === cv.dataset.gid); if (!m) return;
    const a = gangLoaf(m, 1, 'none'), img = a.img, g = cv.getContext('2d');
    const s = Math.min(cv.width / img.width, cv.height / img.height);
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(img, (cv.width - img.width * s) / 2, cv.height - img.height * s, img.width * s, img.height * s);
  });
}
// 出門前：派貓
function gangBriefHTML(run) {
  const ms = gangMembers(run); if (!ms.length) return '';
  const rows = ms.map(m => {
    const st = gangOf(run)[m.id];
    if (st.away) { const d = EXPEDS.find(x => x.id === st.away), a = expOf(run).active.find(x => x.id === st.away); return `<li class="gang-row"><b>${m.name}</b><span class="gang-t off">去${d ? d.name : '遠方'}遠征中${a ? `（還要 ${a.left} 晚）` : ''}</span></li>`; }
    if (st.rest > 0) return `<li class="gang-row"><b>${m.name}</b><span class="gang-t off">遠征回來累壞了，在貓窩休息</span></li>`;
    if (st.caught) return `<li class="gang-row"><b>${m.name}</b><span class="gang-t off">被${OWNERS[st.caught] ? OWNERS[st.caught].person : '鄰居'}抓走了，明天會帶回來</span></li>`;
    const o = st.target;
    if (o === 'shop') return `<li class="gang-row"><b>${m.name}</b><button type="button" class="gang-t" data-gangt="${m.id}">店裡上班</button><em class="ok">招客人</em></li>`;
    const stars = starsOf(run, o);
    return `<li class="gang-row"><b>${m.name}</b><button type="button" class="gang-t" data-gangt="${m.id}">${OWNERS[o].name} <span class="stars">${starStr(stars)}</span></button>${stars >= 2 && m.perk !== 'stealth' ? '<em>有被抓的危險</em>' : ''}</li>`;
  }).join('');
  return `<h3>花喵幫今晚去哪？<small>點一下換地方</small></h3><ul class="gang-list">${rows}</ul>`;
}
function gangTallyHTML(R) {
  const rep = R.gang || []; if (!rep.length) return '';
  return `<div class="newab gangbox"><span class="tagnew">花喵幫</span>${rep.map(r => r.caught ? `<p><b>${r.name}</b>在${OWNERS[r.o].name}被抓到了……</p>` : `<p><b>${r.name}</b>從${OWNERS[r.o].name}叼回 ${r.got.map(t => FLOWERS[t].name).join('、')}</p>`).join('')}</div>`;
}
