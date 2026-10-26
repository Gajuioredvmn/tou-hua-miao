// ================= 服裝扭蛋 =================
// 老貓攤的扭蛋機：罐罐扭一次，抽到帽子、眼鏡、披風（普通／稀有／超稀有／傳說）。
// 衍生玩法：重複的變成「閃亮點數」可以指定兌換（保底）；穿齊一整套有套裝效果；十連保證超稀有以上。
const RARITY = { N: { name: '普通', col: '#b8b3d8', rate: 0.6, shard: 1, ex: 5 }, R: { name: '稀有', col: '#7ab8f0', rate: 0.28, shard: 3, ex: 15 }, SR: { name: '超稀有', col: '#c88af0', rate: 0.1, shard: 8, ex: 40 }, SSR: { name: '傳說', col: '#ffd84d', rate: 0.02, shard: 20, ex: 100 } };
const OUTFITS = [
  { id: 'straw', slot: 'hat', name: '草帽', r: 'N' }, { id: 'beret', slot: 'hat', name: '貝雷帽', r: 'N' }, { id: 'beanie', slot: 'hat', name: '毛線帽', r: 'N' },
  { id: 'santa', slot: 'hat', name: '聖誕帽', r: 'R' }, { id: 'deer', slot: 'hat', name: '獵鹿帽', r: 'R' }, { id: 'pirate', slot: 'hat', name: '海盜帽', r: 'R' },
  { id: 'witch', slot: 'hat', name: '巫師帽', r: 'SR' }, { id: 'tophat', slot: 'hat', name: '高禮帽', r: 'SR' }, { id: 'king', slot: 'hat', name: '國王王冠', r: 'SSR' }, { id: 'halo', slot: 'hat', name: '天使光環', r: 'SSR' },
  { id: 'round', slot: 'glass', name: '圓眼鏡', r: 'N' }, { id: 'sun', slot: 'glass', name: '墨鏡', r: 'N' }, { id: 'star', slot: 'glass', name: '星星眼鏡', r: 'R' }, { id: 'heart', slot: 'glass', name: '愛心眼鏡', r: 'R' }, { id: 'mono', slot: 'glass', name: '單片眼鏡', r: 'SR' },
  { id: 'plaid', slot: 'cape', name: '格紋披風', r: 'N', c: '#b8823a', d: '#8a5a24' }, { id: 'xmas', slot: 'cape', name: '紅白斗篷', r: 'R', c: '#d9363e', d: '#ffffff' }, { id: 'pircoat', slot: 'cape', name: '船長外套', r: 'R', c: '#2f4a8a', d: '#e8b84a' },
  { id: 'magic', slot: 'cape', name: '紫星斗篷', r: 'SR', c: '#5a3a8a', d: '#ffd84d' }, { id: 'tail', slot: 'cape', name: '黑燕尾服', r: 'SR', c: '#22202a', d: '#e8e8f0' }, { id: 'rainbow', slot: 'cape', name: '彩虹披風', r: 'SSR', c: '#ff8fae', d: '#7ad3ff' },
];
const OUTFIT_SETS = [
  { id: 'thief', name: '怪盜套裝', items: ['tophat', 'mono', 'tail'], desc: '被發現的速度 −12%' },
  { id: 'detective', name: '偵探套裝', items: ['deer', 'round', 'plaid'], desc: '偷聽只要一半的時間' },
  { id: 'santa', name: '聖誕套裝', items: ['santa', 'star', 'xmas'], desc: '每晚多 3 個罐罐' },
  { id: 'pirate', name: '海盜套裝', items: ['pirate', 'sun', 'pircoat'], desc: '每晚帶回的花多賣 5%' },
  { id: 'wizard', name: '魔法套裝', items: ['witch', 'heart', 'magic'], desc: '賣萌成功率 +6%' },
];
const GACHA_COST = 30, GACHA10 = 270;
function wardrobe(run) { return run.wardrobe || (run.wardrobe = { own: {}, eq: {}, shards: 0, pulls: 0, pity: 0 }); }
function outfitById(id) { return OUTFITS.find(o => o.id === id); }
function rollOne(run, floorSR) {
  const W = wardrobe(run);
  W.pity = (W.pity || 0) + 1;
  let r = Math.random(), rar = r < RARITY.SSR.rate ? 'SSR' : r < RARITY.SSR.rate + RARITY.SR.rate ? 'SR' : r < 0.4 ? 'R' : 'N';
  if (W.pity >= 50) rar = 'SSR';   // 50 抽保底傳說
  if (floorSR && (rar === 'N' || rar === 'R')) rar = 'SR';
  if (rar === 'SSR') W.pity = 0;
  const it = pick(OUTFITS.filter(o => o.r === rar && !o.limited));
  const dup = !!W.own[it.id];
  if (dup) W.shards += RARITY[rar].shard; else W.own[it.id] = 1;
  W.pulls++;
  return { it, dup };
}
function pullGacha(run, ten) {
  const cost = ten ? GACHA10 : GACHA_COST;
  if (run.cans < cost) return null;
  run.cans -= cost;
  const out = [];
  for (let i = 0; i < (ten ? 10 : 1); i++) out.push(rollOne(run, ten && i === 9 && !out.some(x => x.it.r === 'SR' || x.it.r === 'SSR')));
  return out;
}
function exchangeOutfit(run, id) {
  const W = wardrobe(run), it = outfitById(id); if (!it || W.own[id]) return false;
  const cost = RARITY[it.r].ex; if (W.shards < cost) return false;
  W.shards -= cost; W.own[id] = 1; return true;
}
function equipOutfit(run, id) {
  const W = wardrobe(run), it = outfitById(id); if (!it || !W.own[id]) return;
  W.eq[it.slot] = W.eq[it.slot] === id ? null : id;
}
function activeSets(run) { const eq = wardrobe(run).eq; return OUTFIT_SETS.filter(s => s.items.every(i => Object.values(eq).includes(i))); }
function hasSet(run, id) { return activeSets(run).some(s => s.id === id); }
function outfitGear(run) { const eq = (run && run.wardrobe && run.wardrobe.eq) || {}; return { hat: eq.hat || 0, glass: eq.glass || 0, capeO: eq.cape || 0 }; }

// ---------- 畫：Q 是畫筆（poly 有外框、ellF 填色、ell 有外框、line 線） ----------
function hatDraw(Q, x, y, k, id) {
  const P = pts => pts.map(([a, b]) => [x + a * k, y + b * k]);
  if (id === 'straw') { Q.ell(x, y, 17 * k, 4 * k, '#e8c879'); Q.poly(P([[-9, 0], [9, 0], [7, -8], [-7, -8]]), '#e8c879'); Q.line(P([[-8.6, -2], [8.6, -2]]), '#d9363e', 1.6 * k); }
  else if (id === 'beret') { Q.ell(x + 2 * k, y - 4 * k, 13 * k, 6 * k, '#c84a5a'); Q.ellF(x + 2 * k, y - 10 * k, 1.4 * k, 1.4 * k, '#8a2a3a'); }
  else if (id === 'beanie') { Q.poly(P([[-12, 1], [12, 1], [10, -9], [0, -13], [-10, -9]]), '#5a8ad0'); Q.poly(P([[-12.6, 1.6], [12.6, 1.6], [12.4, -2.4], [-12.4, -2.4]]), '#3a6ab0'); Q.ell(x, y - 14 * k, 3 * k, 3 * k, '#ffffff'); }
  else if (id === 'santa') { Q.poly(P([[-12, 0], [12, 0], [6, -12], [14, -11]]), '#d9363e'); Q.poly(P([[-13, 1.6], [13, 1.6], [13, -2.2], [-13, -2.2]]), '#ffffff'); Q.ell(x + 14.5 * k, y - 11 * k, 2.8 * k, 2.8 * k, '#ffffff'); }
  else if (id === 'deer') { Q.poly(P([[-11, 0], [11, 0], [9, -9], [0, -12], [-9, -9]]), '#a8784a'); Q.poly(P([[6, 0], [16, 2], [10, -2]]), '#8a5a34'); Q.poly(P([[-6, 0], [-16, 2], [-10, -2]]), '#8a5a34'); for (const u of [-5, 0, 5]) Q.line(P([[u, -1], [u * 0.8, -10]]), '#6a4224', 0.7 * k); }
  else if (id === 'pirate') { Q.poly(P([[-16, 0], [16, 0], [11, -8], [0, -11], [-11, -8]]), '#2a2430'); Q.line(P([[-14, -1.4], [-10, -7.2], [0, -10], [10, -7.2], [14, -1.4]]), '#e8b84a', 0.9 * k); Q.ellF(x, y - 5 * k, 2 * k, 1.8 * k, '#ffffff'); }
  else if (id === 'witch') { Q.ell(x, y, 16 * k, 3.6 * k, '#5a3a8a'); Q.poly(P([[-8, -1], [8, -1], [5.4, -6], [3.6, -11], [4.4, -15], [8.6, -19.5], [2, -17], [-1.6, -12], [-4.6, -6]]), '#5a3a8a'); Q.poly(P([[-8, -1], [8, -1], [7.4, -3.6], [-7.4, -3.6]]), '#e8b84a'); Q.poly(star4Pts(x + 1 * k, y - 9 * k, 2.4 * k), '#ffd84d'); }
  else if (id === 'tophat') { Q.ell(x, y, 14 * k, 3 * k, '#1e1c24'); Q.poly(P([[-8, -1], [8, -1], [8, -15], [-8, -15]]), '#1e1c24'); Q.poly(P([[-8.2, -2], [8.2, -2], [8.2, -5], [-8.2, -5]]), '#c4303a'); }
  else if (id === 'king') { gCrown(Q, x, y + 1 * k, 2.1 * k); }
  else if (id === 'halo') { const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; pts.push([x + Math.cos(a) * 10 * k, y - 9 * k + Math.sin(a) * 3 * k]); } Q.line(pts, '#8a6a1a', 3.2 * k); Q.line(pts, '#ffe27a', 1.8 * k); }
}
// 側面：只看得到一片鏡片
function glassSide(Q, x, y, r, id, out) {
  if (id === 'round' || id === 'mono') { const pts = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } Q.line(pts, id === 'mono' ? '#e8b84a' : out, r * 0.3); Q.line([[x - r, y], [x - r * 2.6, y - r * 0.4]], id === 'mono' ? '#e8b84a' : out, r * 0.22); }
  else if (id === 'sun') { Q.ellF(x, y, r * 1.2, r * 0.95, out); Q.ellF(x, y, r, r * 0.78, '#2a2a3a'); Q.line([[x - r, y - r * 0.2], [x - r * 2.8, y - r * 0.6]], out, r * 0.25); }
  else if (id === 'star') Q.poly(star4Pts(x, y, r * 1.4), '#ff8fd0');
  else if (id === 'heart') { Q.ellF(x - r * 0.45, y - r * 0.25, r * 0.62, r * 0.62, '#ff4a7a'); Q.ellF(x + r * 0.45, y - r * 0.25, r * 0.62, r * 0.62, '#ff4a7a'); Q.poly([[x - r * 1.05, y - r * 0.1], [x + r * 1.05, y - r * 0.1], [x, y + r]], '#ff4a7a'); }
}
function glassDraw(Q, ex, ey, r, id, out) {
  const circle = (cx, cy, rr) => { const pts = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return pts; };
  const [L, R] = ex;
  if (id === 'round') { for (const x of [L, R]) Q.line(circle(x, ey, r), out, r * 0.28); Q.line([[L + r, ey], [R - r, ey]], out, r * 0.22); }
  else if (id === 'sun') { for (const x of [L, R]) { Q.ellF(x, ey, r * 1.15, r * 0.9, out); Q.ellF(x, ey, r, r * 0.76, '#2a2a3a'); Q.ellF(x - r * 0.35, ey - r * 0.3, r * 0.28, r * 0.18, '#6a6a8a'); } Q.line([[L + r, ey - r * 0.2], [R - r, ey - r * 0.2]], out, r * 0.25); }
  else if (id === 'star') { for (const x of [L, R]) Q.poly(star4Pts(x, ey, r * 1.35), '#ff8fd0'); }
  else if (id === 'heart') { for (const x of [L, R]) { Q.ellF(x - r * 0.45, ey - r * 0.25, r * 0.62, r * 0.62, '#ff4a7a'); Q.ellF(x + r * 0.45, ey - r * 0.25, r * 0.62, r * 0.62, '#ff4a7a'); Q.poly([[x - r * 1.05, ey - r * 0.1], [x + r * 1.05, ey - r * 0.1], [x, ey + r * 1.0]], '#ff4a7a'); } }
  else if (id === 'mono') { Q.line(circle(R, ey, r * 1.1), '#e8b84a', r * 0.3); Q.line([[R + r * 0.8, ey + r * 0.8], [R + r * 1.6, ey + r * 3.4]], '#e8b84a', r * 0.15); }
}
// 小遊戲貓頭（canvas 2D）用的畫筆
function canvasPen(c, ink) {
  const path = pts => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); };
  return {
    ink,
    poly(pts, col) { c.lineJoin = 'round'; c.strokeStyle = ink; c.lineWidth = 2.6; path(pts); c.closePath(); c.stroke(); c.fillStyle = col; c.fill(); },
    ellF(x, y, rx, ry, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); c.fill(); },
    ell(x, y, rx, ry, col) { c.fillStyle = ink; c.beginPath(); c.ellipse(x, y, rx + 1.3, ry + 1.3, 0, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); },
    line(pts, col, w = 1) { c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = w; path(pts); c.stroke(); },
  };
}

// ---------- 傍晚：老貓攤的扭蛋機、衣櫃 ----------
function gachaHTML(run) {
  const W = wardrobe(run), own = Object.keys(W.own).length;
  const sets = activeSets(run);
  const slotName = { hat: '帽子', glass: '眼鏡', cape: '披風' };
  const grid = ['hat', 'glass', 'cape'].map(slot => `<h4>${slotName[slot]}</h4><div class="wd-grid">${OUTFITS.filter(o => o.slot === slot).map(o => {
    const has = W.own[o.id], on = W.eq[slot] === o.id, R = RARITY[o.r];
    return `<button type="button" class="wd-it ${has ? 'got' : ''} ${on ? 'on' : ''}" ${has ? `data-eq="${o.id}"` : o.limited ? '' : `data-ex="${o.id}"`} style="--rc:${R.col}"><b>${has ? esc(o.name) : '？？？'}</b><span>${o.limited ? '季節限定' : R.name}${has ? (on ? '・穿著' : '') : o.limited ? `・${SEASONS.find(x => x.id === o.limited).name}的任務` : `・${R.ex} 點換`}</span></button>`;
  }).join('')}</div>`).join('');
  return `<h3>扭蛋機<small>收集 ${own}/${OUTFITS.length}・閃亮點數 ${W.shards}</small></h3>
    <div class="gacha-row"><button type="button" class="gacha-b" data-gacha="1" ${run.cans < GACHA_COST ? 'disabled' : ''}>扭一次<i><img src="${G.icons.can}" alt="">${GACHA_COST}</i></button>
      <button type="button" class="gacha-b ten" data-gacha="10" ${run.cans < GACHA10 ? 'disabled' : ''}>十連<small>保證超稀有以上</small><i><img src="${G.icons.can}" alt="">${GACHA10}</i></button></div>
    <p class="hint">重複的會變成閃亮點數，可以指定換沒有的。點衣服穿上／脫下。${W.pity ? `再 ${50 - W.pity} 抽保證傳說。` : ''}</p>
    ${sets.length ? `<p class="gset-on">套裝效果：${sets.map(s => `<b>${s.name}</b>（${s.desc}）`).join('、')}</p>` : ''}
    <details class="wd"><summary>衣櫃・套裝</summary>${grid}<h4>套裝</h4><ul class="gsets">${OUTFIT_SETS.map(s => `<li class="${sets.includes(s) ? 'on' : ''}"><b>${s.name}</b><span>${s.items.map(i => (W.own[i] ? outfitById(i).name : '？？？')).join('＋')}</span><em>${s.desc}</em></li>`).join('')}</ul></details>`;
}
function gachaResultHTML(res) {
  return `<p class="eyebrow">扭蛋機</p><h2>${res.length > 1 ? '十連結果' : '扭到了！'}</h2><div class="gacha-res">${res.map(x => `<div class="gr r-${x.it.r}" style="--rc:${RARITY[x.it.r].col}"><b>${esc(x.it.name)}</b><span>${RARITY[x.it.r].name}${x.dup ? '・重複 +' + RARITY[x.it.r].shard + ' 點' : '・NEW'}</span></div>`).join('')}</div>`;
}
