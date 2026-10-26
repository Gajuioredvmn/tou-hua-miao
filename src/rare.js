// ================= 稀有的夜晚 =================
// 第二個月起，每晚有一點機率變成特別的夜晚（第一個月的五種夜晚事件用完之後也會輪到這些）：
//   月下美人：滿月，曇花整晚盛開，今晚偷到的花都沾了月光（白天多賣三成）
//   颱風夜：被風吹倒的盆栽滾到巷子裡，撿到不算偷（不會讓鄰居生氣）
//   神秘白貓：巷子裡出現一隻發光的白貓，慢慢走近摸到牠會有驚喜；用跑的牠就會跳走
//   流星雨：大家抬頭看天空，站著不動還能許願
const RARE_NIGHTS = {
  fullmoon: { name: '月下美人', desc: '今晚是滿月：阿伯家的曇花整晚都開著，偷到的花都沾了月光，明天多賣三成。' },
  storm: { name: '颱風夜', desc: '颱風真的來了：被風吹倒的盆栽滾到巷子裡，撿起來不算偷，鄰居也不會生氣。風聲很大，但一陣一陣的強風會把你吹偏。' },
  whitecat: { name: '神秘白貓', desc: '有人說看過一隻發光的白貓……慢慢走近牠就有驚喜，用跑的牠會跳走。' },
  meteor: { name: '流星雨', desc: '有一陣子大家都會抬頭看天空，誰都不會注意地上的貓。站著不動還能許個願。' },
};
function rollRare(run, n) {
  const forced = run.flags && run.flags.forceRare; if (forced) { delete run.flags.forceRare; return forced; }
  if ((run.month || 1) < 2) return null;
  if (Math.random() > 0.16) return null;
  const seen = run.rareSeen || {};
  const ids = Object.keys(RARE_NIGHTS), fresh = ids.filter(k => !seen[k]);
  return pick(fresh.length && Math.random() < 0.7 ? fresh : ids);
}
// 進場時：佈置稀有夜晚
function initRare(sc) {
  const ev = sc.nev; if (!ev || !ev.rare) return;
  const run = sc.run, id = ev.rare;
  run.rareSeen = run.rareSeen || {}; run.rareSeen[id] = (run.rareSeen[id] || 0) + 1;
  setTimeout(() => { if (G.scene === sc) UI.banner('稀有的夜晚：' + RARE_NIGHTS[id].name); }, 1200);
  if (id === 'fullmoon') run.flags.moonNight = run.nightIdx;
  if (id === 'storm') {
    const spots = [[7, 13], [8, 17], [6, 24], [8, 27], [7, 35], [3, 38], [11, 39]];
    const types = ['rose', 'hydrangea', 'lisianthus', 'jasmine', 'osmanthus', 'peony', 'sunflower'];
    sc.stormPots = [];
    spots.forEach(([x, y], i) => { if (Math.random() < 0.75) { const p = new Pot({ t: types[i], x, y, owner: 'storm' }); p.fallen = true; sc.pots.push(p); sc.stormPots.push(p); } });
    setTimeout(() => { if (G.scene === sc) UI.toast('颱風夜：巷子裡滾了好幾盆被吹倒的花，撿起來不算偷！', 3600); }, 3600);
  }
  if (id === 'whitecat') {
    const spots = [[3.5, 14.5], [11.5, 22.5], [2.5, 35.5], [12.5, 38.5], [7.5, 16.5], [4.5, 26.5]];
    sc.white = { spots, i: Math.floor(Math.random() * spots.length), hops: 0, state: 'sit', t: 0, fade: 0 };
    const [x, y] = spots[sc.white.i]; sc.white.x = x * TS; sc.white.y = y * TS;
  }
}
function updateRare(sc, dt) {
  const W = sc.white; if (!W || W.state === 'gone') return;
  const c = sc.cat; W.t += dt;
  if (W.state === 'hop') { W.fade += dt; if (W.fade > 0.5) { W.state = 'sit'; W.fade = 0; } return; }
  if (W.state === 'caught') { W.fade += dt; if (W.fade > 1.2) W.state = 'gone'; return; }
  const d = dist(c.x, c.y, W.x, W.y);
  if (c.running && d < 3.2 * TS && !c.top) {
    // 被嚇跑：跳到別的地方
    W.hops++; W.state = 'hop'; W.fade = 0;
    let ni = W.i; while (ni === W.i) ni = Math.floor(Math.random() * W.spots.length);
    W.i = ni; W.x = W.spots[ni][0] * TS; W.y = W.spots[ni][1] * TS;
    sc.fx.text(c.x, c.y - 16, '白貓跳走了……', '#e8f0ff'); SFX.tone(1400, 0.15, { to: 2000, vol: 0.06, type: 'sine' });
    if (!sc.tips.white) { sc.tips.white = 1; UI.toast('白貓被嚇跑了！要用走的慢慢靠近', 3000); }
    return;
  }
  if (d < 1.1 * TS && !c.top) {
    W.state = 'caught'; W.fade = 0;
    const run = sc.run, r = Math.random();
    let msg;
    if (r < 0.35) { addCut(run, pick(['orchid', 'peony', 'tanhua']), 2); msg = '白貓叼來兩支稀有的插枝'; }
    else if (r < 0.7) { run.cans += 30; msg = '白貓身邊堆著 30 個罐罐'; }
    else { for (const o of HEAT_OWNERS) heatAdd(run, o, -15); msg = '白貓蹭了蹭花喵……整條巷子的人今晚都睡得特別熟（警戒下降）'; }
    run.stats.whiteCat = (run.stats.whiteCat || 0) + 1;
    sc.fx.hearts(W.x, W.y - 14, 10); SFX.play('chime'); SFX.play('heart');
    UI.toast(`摸到神秘白貓了！${msg}`, 4200);
  }
}
function drawWhiteCat() {
  const m = GANG.find(g => g.id === 'white');
  return gangLoaf(m, 1, 'none');
}
function rareRender3D(sc, F, L) {
  const W = sc.white, vt = sc.cat.t || 0;
  if (W && W.state !== 'gone') {
    const a = W.state === 'hop' ? Math.min(1, W.fade * 2) : W.state === 'caught' ? Math.max(0, 1 - W.fade) : 1;
    pushSprite(F.sprites, drawWhiteCat(), W.x, W.y, { unlit: true, alpha: a < 1 ? a : undefined });
    glowQuad(F.glow, W.x / TS, 0.45, W.y / TS + 0.05, 0.9, [0.85, 0.95, 1, 0.35 * a + 0.1 * Math.sin(vt * 3)]);
    for (let i = 0; i < 4; i++) glowQuad(F.glow, W.x / TS + Math.sin(vt * 2 + i * 1.6) * 0.5, 0.4 + ((vt * 0.5 + i / 4) % 1) * 0.9, W.y / TS, 0.06, [1, 1, 1, 0.7 * a]);
    L.push({ x: W.x / TS, y: 0.8, z: W.y / TS + 0.2, r: 2.2, c: [0.6, 0.7, 0.9], pri: 2 });
  }
  if (sc.nev && sc.nev.rare === 'fullmoon') L.push({ x: 7.5, y: 6, z: (sc.cat.y / TS) - 2, r: 9, c: [0.35, 0.4, 0.6], pri: 0.5 });
}
// 滿月的大月亮（疊在畫面上）
function rareOverlay(sc, g) {
  if (!g || !sc.nev || sc.nev.rare !== 'fullmoon') return;
  const mx = R3.W - 58, my = 128, r = 32;
  const gr = g.createRadialGradient(mx, my, r * 0.6, mx, my, r * 3); gr.addColorStop(0, 'rgba(220,235,255,0.4)'); gr.addColorStop(1, 'rgba(220,235,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(mx, my, r * 3, 0, 7); g.fill();
  g.fillStyle = '#f4f8ff'; g.strokeStyle = CM.ink; g.lineWidth = 2.5; g.beginPath(); g.arc(mx, my, r, 0, 7); g.fill(); g.stroke();
  g.fillStyle = 'rgba(190,205,230,0.55)'; for (const [dx, dy, rr] of [[-10, -6, 6], [9, 5, 8], [-4, 13, 4], [12, -11, 3.5]]) { g.beginPath(); g.arc(mx + dx, my + dy, rr, 0, 7); g.fill(); }
}
