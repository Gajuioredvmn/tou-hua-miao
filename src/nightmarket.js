// ================= 夜市花攤（第四個月起）=================
// 晚上花喵出門偷花的同時，美玲的花攤在夜市開張：把店裡剩下的花帶去賣，夜市價比較高。
// 每晚可以選一種「主打花」，主打的花再加價。攤子一級一級變大（傍晚分頁的插畫看得到）。
const NM_LV = [
  { name: '小推車', cost: 40000, cap: 4, mon: 4, desc: '每晚帶 4 朵花去夜市賣（夜市價 ×1.3）', look: '一台掛著燈泡的木頭小推車' },
  { name: '帆布棚＋串燈', cost: 90000, cap: 8, mon: 4, desc: '每晚 8 朵；串燈一亮，客人都圍過來', look: '粉紅條紋帆布棚，掛滿串燈' },
  { name: '人氣招牌攤', cost: 160000, cap: 14, mon: 5, desc: '每晚 14 朵；排隊的人潮，夜市價 ×1.5', look: '大大的霓虹招牌，攤前排了一條長長的隊伍' },
];
function nmOf(run) { return run.nm || (run.nm = { lv: 0, star: null, story: {} }); }
function nmOpen(run) { return (run.month || 1) >= 4; }
function nmMult(run) { return nmOf(run).lv >= 3 ? 1.5 : 1.3; }
// 天亮前結算：從店裡的庫存挑花去賣（主打的先，再挑貴的）
function nmSell(run, stock) {
  const N = nmOf(run); if (!N.lv) return null;
  const cap = NM_LV[N.lv - 1].cap, star = N.star;
  const order = stock.map((f, i) => ({ f, i })).sort((a, b) => ((b.f.t === star) - (a.f.t === star)) || (FLOWERS[b.f.t].price - FLOWERS[a.f.t].price));
  // 最多帶走一半，白天店裡還要有花賣
  const take = order.slice(0, Math.min(cap, Math.ceil(stock.length / 2))).map(x => x.f);
  if (!take.length) return { n: 0, v: 0, star, items: [] };
  let v = 0;
  for (const f of take) { v += flowerValue(run, f.t, f.fresh) * nmMult(run) * (f.t === star ? 1.5 : 1); stock.splice(stock.indexOf(f), 1); }
  const items = {}; for (const f of take) items[f.t] = (items[f.t] || 0) + 1;
  return { n: take.length, v: Math.round(v), star, items: Object.keys(items).map(t => ({ t, n: items[t] })) };
}

// ---------- 劇情 ----------
function* nmStoryScript(S) {
  const run = S.run, N = nmOf(run);
  // 第四個月第一次：夜市主委來邀請（還沒買也會來，告訴你有這件事）
  if (nmOpen(run) && !N.story.invite) {
    N.story.invite = 1;
    const wasOn = S.shopOn; S.shopOn = false;
    const c = S.customer('shopB');
    yield S.walkIn(c, COUNTER_SPOT2);
    yield* S.talk(c, '夜市主委', [['美玲小姐，我是街口夜市的主委。'], ['最近大家都在講妳家的花……夜市剛好空出一個攤位。'], ['要不要晚上也來擺攤？花喵出門的時候，妳的攤子也開張，兩邊一起賺！']]);
    UI.toast('傍晚多了「夜市花攤」分頁：晚上把店裡剩下的花帶去夜市賣，價格比較高', 4000);
    yield S.walkOut(c);
    if (wasOn) S.startShop();
    return true;
  }
  for (let k = 1; k <= N.lv; k++) {
    if (N.story[k]) continue;
    N.story[k] = 1;
    const wasOn = S.shopOn; S.shopOn = false;
    if (k === 1) {
      yield S.say('昨晚夜市第一天擺攤……好緊張，可是大家都說花好香！');
      yield S.say('隔壁賣雞排的阿姨還送我一塊雞排。花喵，分你一口。');
      S.fx.hearts(S.cat.x, S.cat.y - 10, 4); SFX.play('heart');
    } else if (k === 2) {
      const w = S.customer('wang');
      yield S.walkIn(w, COUNTER_SPOT2);
      yield* S.talk(w, '王太太', [['美玲～我昨晚帶姊妹們去夜市逛，妳的攤子好亮好漂亮！'], ['大家都買了一束回家，說明天還要去。']]);
      yield S.walkOut(w);
    } else if (k === 3) {
      const g = S.customer('cust1');
      yield S.walkIn(g, COUNTER_SPOT2);
      yield* S.talk(g, '神秘的老奶奶', [['……我說過，我們還會再見面的。'], ['四十年前，那個攤位是我的。那時候我也養了一隻虎斑貓，每天晚上幫我「找」花。'], ['這把花剪給妳。剪過的花，會開得比較久。']]);
      run.flags.oldShears = 1;
      UI.toast('拿到「老奶奶的花剪」：所有花的賣價 ×1.1', 3600); SFX.play('chime');
      yield S.walkOut(g);
    }
    UI.hideDialog();
    if (wasOn) S.startShop();
    return true;
  }
  return false;
}

// ---------- 傍晚的分頁 ----------
function nmTabHTML(run) {
  if (!nmOpen(run)) return `<p class="lead">「夜市好熱鬧……如果我們也有一個攤位就好了。」</p><p class="hint">第四個月開放。</p>`;
  const N = nmOf(run), next = NM_LV[N.lv], early = next && (run.month || 1) < next.mon;
  const pips = NM_LV.map((_, i) => `<i class="${i < N.lv ? 'on' : ''}"></i>`).join('');
  const row = next ? `<li class="up ${early ? 'locked' : ''}"><div class="up-main"><div class="up-name"><span class="grp nm">夜市</span><b>${next.name}</b><span class="pips">${pips}</span></div>
      <div class="up-now">${N.lv ? '現在：' + esc(NM_LV[N.lv - 1].name) : '還沒有攤位'}</div><div class="up-next">${early ? `第${cn(next.mon)}個月開放：` : '買了：'}${esc(next.desc)}</div></div>
      <button type="button" class="buy cash" data-nm="up" ${!early && run.money >= next.cost ? '' : 'disabled'}><b class="px">${next.cost.toLocaleString('en-US')}</b></button></li>`
    : `<li class="up maxed"><div class="up-main"><div class="up-name"><span class="grp nm">夜市</span><b>人氣招牌攤</b></div><div class="up-now">夜市最紅的花攤</div></div><button type="button" class="buy cash" disabled>完成</button></li>`;
  const stars = N.lv ? `<h3>今晚的主打花<small>主打的花再 ×1.5</small></h3><div class="nm-stars">${FLOWER_ORDER.map(t => `<button type="button" class="nm-star ${N.star === t ? 'on' : ''}" data-star="${t}"><img src="${G.icons[t]}" alt=""><span>${FLOWERS[t].name}</span></button>`).join('')}</div>
      <p class="hint">天亮前，美玲會從帶回來的花挑最多 ${NM_LV[N.lv - 1].cap} 朵帶去夜市（主打的先、再挑貴的；最多帶一半，白天店裡還要賣）。</p>` : '';
  return `<p class="lead">「${N.lv ? '晚上的夜市，是另一個戰場！' : '夜市的攤位……要不要試試看？'}」</p>
    <canvas class="nm-art" width="330" height="150" aria-label="夜市花攤現在的樣子"></canvas>
    ${UI.rentBar(run)}<ul class="ups">${row}</ul>${stars}`;
}
function drawNmArt(cv, run) {
  const lv = nmOf(run).lv, W = cv.width, H = cv.height, x = cv.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1d1840'); sky.addColorStop(1, '#3a2452');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);
  // 遠處的攤子
  for (let i = 0; i < 7; i++) { const bx = i * 52 - 10; x.fillStyle = ['#c84a5a', '#e8a33a', '#4a8ac8'][i % 3]; x.globalAlpha = 0.35; x.fillRect(bx, 40, 44, 28); x.globalAlpha = 1; x.fillStyle = 'rgba(255,220,140,0.5)'; x.fillRect(bx + 4, 50, 36, 3); }
  x.fillStyle = '#2a2236'; x.fillRect(0, H - 36, W, 36);
  x.fillStyle = 'rgba(255,200,120,0.25)'; for (let i = 0; i < 26; i++) { x.beginPath(); x.arc((i * 61) % W, 30 + (i * 37) % 30, 1.6, 0, 7); x.fill(); }
  if (!lv) { x.fillStyle = 'rgba(255,255,255,0.75)'; x.font = '14px sans-serif'; x.textAlign = 'center'; x.fillText('空著的攤位', W / 2, H - 14); return; }
  const cx = W / 2;
  // 推車
  x.fillStyle = '#8a5a34'; x.fillRect(cx - 60, H - 70, 120, 34);
  x.fillStyle = '#6a4224'; x.fillRect(cx - 60, H - 40, 120, 4);
  x.fillStyle = '#2a2a36'; for (const dx of [-42, 42]) { x.beginPath(); x.arc(cx + dx, H - 30, 9, 0, 7); x.fill(); }
  // 花桶
  const cols = ['#e8394d', '#ff9fcb', '#ffd84d', '#ffffff', '#9a6ad0', '#ff7a3a'];
  for (let i = 0; i < 6; i++) { const bx = cx - 50 + i * 20; x.fillStyle = '#c9ccd8'; x.fillRect(bx, H - 82, 14, 14); for (let j = 0; j < 3; j++) { x.fillStyle = cols[(i + j) % 6]; x.beginPath(); x.arc(bx + 3 + j * 4, H - 86 - (j % 2) * 4, 3.4, 0, 7); x.fill(); } }
  if (lv >= 2) {
    x.fillStyle = '#ff8fae'; x.beginPath(); x.moveTo(cx - 84, H - 92); x.lineTo(cx + 84, H - 92); x.lineTo(cx + 70, H - 116); x.lineTo(cx - 70, H - 116); x.closePath(); x.fill();
    x.fillStyle = '#fff6ec'; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(cx - 84 + i * 28 + 14, H - 92); x.lineTo(cx - 84 + i * 28 + 28, H - 92); x.lineTo(cx - 70 + i * 23.3 + 23.3, H - 116); x.lineTo(cx - 70 + i * 23.3 + 11.6, H - 116); x.closePath(); x.fill(); }
    x.fillStyle = '#6a6a7a'; x.fillRect(cx - 82, H - 92, 3, 56); x.fillRect(cx + 79, H - 92, 3, 56);
    for (let i = 0; i <= 12; i++) { const px = cx - 80 + i * 13.3; x.fillStyle = i % 2 ? '#ffd27a' : '#ff9fcb'; x.beginPath(); x.arc(px, H - 90 + Math.abs(Math.sin(i)) * 4, 2.6, 0, 7); x.fill(); }
  } else {
    x.fillStyle = '#ffd27a'; x.beginPath(); x.arc(cx, H - 100, 5, 0, 7); x.fill(); x.strokeStyle = '#6a6a7a'; x.beginPath(); x.moveTo(cx, H - 95); x.lineTo(cx, H - 70); x.stroke();
  }
  if (lv >= 3) {
    x.fillStyle = '#2a2236'; x.fillRect(cx - 50, H - 142, 100, 24);
    x.shadowColor = '#ff6dc0'; x.shadowBlur = 10; x.fillStyle = '#ff9fe0'; x.font = 'bold 15px sans-serif'; x.textAlign = 'center'; x.fillText('美玲的花攤', cx, H - 125); x.shadowBlur = 0;
    for (let i = 0; i < 7; i++) { const px = cx + 96 + i * 13, py = H - 46; x.fillStyle = ['#6a8ad0', '#d06a8a', '#8ad06a'][i % 3]; x.beginPath(); x.arc(px, py - 16, 4, 0, 7); x.fill(); x.fillRect(px - 4, py - 12, 8, 12); }
  }
}
function nmTallyHTML(R) {
  const s = R.nm; if (!s || !s.n) return '';
  return `<div class="newab nmbox"><span class="tagnew">夜市花攤</span><p>賣掉 ${s.items.map(i => FLOWERS[i.t].name + ' ×' + i.n).join('、')}${s.star ? `（主打：${FLOWERS[s.star].name}）` : ''}</p><p><b class="px">+${money(s.v)}</b></p></div>`;
}
