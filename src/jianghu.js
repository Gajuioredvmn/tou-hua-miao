// ================= 巷子江湖：晚上的對手與麻煩 =================
// 第二個月起，每個月巷子裡會多一個新角色（貓或人）。每個都有自己的麻煩，也有一種解法：
//   瞪眼比氣勢、分罐罐、擺姿勢、趁他偷花時嚇他、搖醒、躲紙箱、送白色的花、單挑。
// 解決了就變成朋友，送你一個永久的好處（圖鑑「風雲榜」頁下面的「巷子江湖」看得到）。
// 一個晚上最多出現一個；這個月新來的那個，第一晚一定會出現。

const JH = [
  { id: 'tiger', m: 2, kind: 'cat', name: '虎爺', tag: '巷口老大', beh: 'block', solve: 'stare', skill: 0.3,
    pal: { fur: '#e8913a', furL: '#ffb066', furD: '#b8641e', stripe: '#a8521a', cream: '#fff0dc', creamS: '#f0d8b8', eye: '#ffe066', eyeD: '#c8a02a', ear: '#f6a890' },
    intro: '巷口來了一隻大橘貓「虎爺」，霸佔了一盆好花。靠近按「瞪眼」跟牠比氣勢！',
    how: '霸佔一盆好花不讓你碰。靠近「瞪眼」比氣勢（指針停在綠色按）',
    perk: { name: '虎爺的貢品', desc: '每晚收工，虎爺會叼一朵好花放進店裡' } },
  { id: 'trio', m: 3, kind: 'cat', name: '小偷三兄弟', tag: '三隻小虎斑', beh: 'chase', solve: 'cans', cost: 3,
    pal: { fur: '#b8a890', furL: '#d8ccb8', furD: '#8a7a64', stripe: '#5a4a3a', cream: '#f4ece0', creamS: '#e0d4c4', eye: '#9ae0ff', eyeD: '#4a9ac8', ear: '#f0b0a0' },
    intro: '三隻小虎斑在巷子裡亂跑，碰到你就搶走嘴上的花！靠近按「分罐罐」收買牠們。',
    how: '追著你跑，碰到就搶走一朵花。靠近「分罐罐」（3 個）收買牠們',
    perk: { name: '小跟班', desc: '三兄弟幫忙叼花：叼花上限 +1' } },
  { id: 'photo', m: 4, kind: 'human', key: 'shopD', name: '夜拍阿傑', tag: '街頭攝影師', beh: 'flash', solve: 'pose',
    intro: '有人在巷子裡拍夜景，閃光燈一閃就會照到你！嘴巴空空的時候靠近他「擺姿勢」。',
    how: '閃光燈照到你就會吵醒鄰居。嘴巴沒叼花時靠近他「擺姿勢」',
    perk: { name: '網紅貓', desc: '阿傑每晚幫你 PO 照片：口碑每晚多加一點' } },
  { id: 'thief', m: 5, kind: 'human', key: 'shopF', name: '偷花賊', tag: '戴口罩的怪叔叔', beh: 'thief', solve: 'scare', need: 2,
    intro: '有個戴口罩的人也在偷花！趁他蹲下來偷花的時候，從旁邊「嚇他」。',
    how: '跟你搶花，偷走的人家會更警戒。趁他蹲著偷花時「嚇他」，嚇跑兩次就不敢來了',
    perk: { name: '巷子安全了', desc: '偷花賊不敢來了，鄰居比較安心：每晚收工每一家警戒 −3' } },
  { id: 'fat', m: 6, kind: 'cat', name: '肥仔', tag: '睡不醒的胖貓', beh: 'block', solve: 'shake', taps: 5,
    pal: { fur: '#f4f0ea', furL: '#ffffff', furD: '#d8d0c4', stripe: '#9a8a7a', cream: '#ffffff', creamS: '#ece4d8', eye: '#c8e070', eyeD: '#8aa040', ear: '#f6b8b0' },
    intro: '一隻超胖的貓「肥仔」睡在花盆上，怎麼推都推不動。靠近連按「搖醒」！',
    how: '整隻壓在一盆花上睡覺。靠近連按五下「搖醒」',
    perk: { name: '肥仔的地圖', desc: '肥仔睡遍整條巷子：每晚都有「老貓的地圖」效果' } },
  { id: 'net', m: 7, kind: 'human', key: 'patrol', name: '捕貓大叔', tag: '拿網子的大叔', beh: 'net', solve: 'box', need: 2,
    intro: '捕貓大叔拿著網子在巷子裡巡！被他追上嘴上的花全掉光。他靠近時躲進「紙箱」騙過他。',
    how: '看到你就追，被抓到嘴上的花全掉光。他靠近時躲進紙箱騙過他（兩次）',
    perk: { name: '大叔改當志工', desc: '大叔現在幫流浪貓送飯：每晚收工 +3 罐罐' } },
  { id: 'snow', m: 8, kind: 'cat', name: '雪姬', tag: '高冷的白貓', beh: 'block', solve: 'white',
    pal: { fur: '#f8f8fc', furL: '#ffffff', furD: '#dcdce8', stripe: '#e4e4f0', cream: '#ffffff', creamS: '#eeeef6', eye: '#8ac8ff', eyeD: '#3a7ac8', ear: '#f8c8d0' },
    intro: '一隻高冷的白貓「雪姬」坐在花盆前，誰都不理。聽說她只喜歡白色的花……',
    how: '坐在一盆花前面誰都不理。叼一朵白色的花（茉莉、滿天星、玉蘭……）去「送花」',
    perk: { name: '雪姬的祝福', desc: '白色的花賣價 ×1.2' } },
  { id: 'boss', m: 9, kind: 'cat', name: '黑輪老大', tag: '夜市後巷的老大', beh: 'block', solve: 'stare', skill: 0.95, final: true, allies: 4,
    pal: { fur: '#3a3036', furL: '#544850', furD: '#241c22', stripe: '#1a1418', cream: '#6a5a62', creamS: '#544850', eye: '#ff6a5a', eyeD: '#c83a2a', ear: '#6a4a52' },
    intro: '夜市後巷的「黑輪老大」親自來了，帶著一道疤。打贏牠，整條巷子都是你的！',
    how: '交到 4 個朋友後才會出現。「單挑」瞪眼（很快、很難）',
    perk: { name: '新老大', desc: '整條巷子都聽你的：每晚多 20 分鐘' } },
];
function jhOf(run) { return run.jh || (run.jh = { met: {}, solved: {}, prog: {} }); }
function jhHas(run, id) { return !!(run && run.jh && run.jh.solved[id]); }
function jhAllies(run) { return JH.filter(j => jhHas(run, j.id)).length; }
function jhUnlocked(run, j) { return (run.month || 1) >= j.m && (!j.allies || jhAllies(run) >= j.allies); }

// ---------- 好處 ----------
(function () {
  const P = NightScene.prototype;
  const _cap = P.capacity;
  P.capacity = function () { return _cap.call(this) + (jhHas(this.run, 'trio') ? 1 : 0); };
  const _ia = itemActive;
  itemActive = function (run, id) { return _ia(run, id) || (id === 'map' && jhHas(run, 'fat') && G.scene instanceof NightScene); };
  const _fv = flowerValue;
  flowerValue = function (run, t, fresh) { const v = _fv(run, t, fresh); return (FLOWERS[t] && FLOWERS[t].white && jhHas(run, 'snow')) ? v * 1.2 : v; };
})();

// ---------- 每晚：誰出來 ----------
function jhInit(sc) {
  const run = sc.run, J = jhOf(run);
  sc.jh = null;
  if (jhHas(run, 'boss')) sc.end += 20;
  if (sc.raid || (run.month || 1) < 2) return;
  const open = JH.filter(j => !jhHas(run, j.id) && jhUnlocked(run, j));
  if (!open.length) return;
  const fresh = open.filter(j => !J.met[j.id]);
  let j = fresh.length ? fresh[fresh.length - 1] : (Math.random() < 0.5 ? pick(open) : null);
  if (!j) return;
  J.met[j.id] = (J.met[j.id] || 0) + 1;
  const isCat = j.kind === 'cat';
  const n = Object.assign(isCat ? new Cat(0, 0) : { dir: 'down', moving: false }, { j, state: 'idle', t: 0, path: [], carry: [], cool: 0, taps: 0, tapT: 0, said: 0 });
  const pots = sc.pots.filter(p => p.avail && !p.gone && !p.top && p.owner !== 'mansion' && p.owner !== 'storm' && p.t !== 'lily');
  if (j.beh === 'block' || j.beh === 'flash') {
    const good = pots.slice().sort((a, b) => FLOWERS[b.t].price - FLOWERS[a.t].price).slice(0, 4);
    const p = good.length ? pick(good) : null; if (!p) return;
    n.x = p.x + (j.beh === 'flash' ? 0 : 9); n.y = p.y + (j.beh === 'flash' ? 14 : 3);
    if (j.beh === 'block') { n.pot = p; p.avail = false; p.jhBlock = true; }
    n.owner = p.owner; n.dir = 'left';
    if (j.id === 'fat') n.pose = 'loaf';
    n.flashT = 3 + Math.random() * 2;
  } else {
    const from = Math.random() < 0.5 ? [7.5, 41.4] : [1.6, 5.6];
    n.x = from[0] * TS; n.y = from[1] * TS; n.from = from;
    n.state = j.beh === 'thief' ? 'wait' : 'roam'; n.at = sc.time + rnd(5, 25);
    n.speed = { chase: 36, thief: 24, net: 27 }[j.beh];
  }
  sc.jh = n;
  setTimeout(() => { if (G.scene === sc) UI.toast((J.met[j.id] === 1 ? '新面孔：' : '') + j.intro, 4600); }, J.met[j.id] === 1 ? 4200 : 3200);
}
function jhGo(sc, n, x, y) { n.path = sc.groundPath(n.x, n.y, x, y) || [[x, y]]; }
function jhWalk(n, dt, sp) {
  if (!n.path.length) { n.moving = false; return true; }
  const [tx, ty] = n.path[0], dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy), s = sp * dt;
  if (d <= s) { n.x = tx; n.y = ty; n.path.shift(); } else { n.x += dx / d * s; n.y += dy / d * s; }
  n.moving = true;
  if (Math.abs(dx) > Math.abs(dy) * 0.9) n.dir = dx > 0 ? 'right' : 'left'; else n.dir = dy > 0 ? 'down' : 'up';
  return false;
}
function jhSeen(sc, n, r) { const c = sc.cat; return !c.top && !c.hidden && !c.box && dist(c.x, c.y, n.x, n.y) < r * TS; }
function jhUpdate(sc, dt, n) {
  n = n || sc.jh; if (!n || n.state === 'gone') return;
  const j = n.j, c = sc.cat, run = sc.run, d = dist(c.x, c.y, n.x, n.y);
  n.t += dt; if (n.cool > 0) n.cool -= dt; if (n.tapT > 0) { n.tapT -= dt; if (n.tapT <= 0) n.taps = 0; }
  if (d < 4 * TS && !n.said) { n.said = 1; sc.fx.text(n.x, n.y - 20, j.name, '#ffd25a'); }
  if (j.beh === 'block') {
    if (d < 1.2 * TS && !c.top && n.cool <= 0 && j.id !== 'fat' && j.id !== 'snow') { n.cool = 2.5; sc.fx.text(n.x, n.y - 18, j.final ? '……滾。' : '嘶——！', '#ff9a7a'); }
    if (j.id === 'fat' && n.t % 2.2 < dt) sc.fx.text(n.x + 4, n.y - 16, 'Zzz', '#c8d8ff');
  } else if (j.beh === 'flash') {
    n.flashT -= dt;
    if (n.flashT < 1 && !n.ready) { n.ready = true; if (Cam.visible(n.x, n.y, 80)) sc.fx.text(n.x, n.y - 22, '要拍囉～', '#fff3c8'); }
    if (n.flashT <= 0) {
      n.flashT = 4.5 + Math.random() * 2; n.ready = false; n.flash = 0.35;
      if (Cam.visible(n.x, n.y, 80)) SFX.tone(1400, 0.05, { vol: 0.04 });
      if (jhSeen(sc, n, 3.6)) { if (sc.obCool) sc.obCool['jh-photo'] = 0; obAlarm(sc, n.owner, c.x, c.y, '喀嚓！', 'jh-photo'); UI.toast('被閃光燈照到了！鄰居被吵醒……', 2200); }
    }
    if (n.flash > 0) n.flash -= dt;
  } else if (j.beh === 'chase') {
    if (n.state === 'roam') {
      if (n.cool <= 0 && jhSeen(sc, n, 5) && c.carry.length) { n.state = 'chase'; }
      else if (!n.path.length) { const p = pick(sc.pots); jhGo(sc, n, p.x, p.y + 4); }
      jhWalk(n, dt, n.speed * 0.6);
    } else if (n.state === 'chase') {
      if (!jhSeen(sc, n, 7) || !c.carry.length) { n.state = 'roam'; n.path = []; }
      else {
        n.path = [[c.x, c.y]]; jhWalk(n, dt, n.speed);
        if (d < 0.8 * TS && c.inv <= 0) {
          const f = c.carry.pop(); n.carry.push(f.t); c.inv = 1.2;
          sc.fx.text(c.x, c.y - 18, `${FLOWERS[f.t].name}被搶走了！`, '#ff9a7a'); SFX.play('fail');
          n.state = 'roam'; n.cool = 8; const p = pick(sc.pots); jhGo(sc, n, p.x, p.y + 4);
        }
      }
    }
  } else if (j.beh === 'thief') {
    if (n.state === 'wait') { if (sc.time >= n.at) n.state = 'hunt'; else return; }
    if (n.state === 'hunt') {
      if (!n.target || !n.target.avail) {
        const ps = sc.pots.filter(p => p.avail && !p.gone && !p.top && p.owner !== 'mansion' && p.t !== 'lily');
        const want = n.want ? ps.filter(p => n.want.includes(p.t)) : [];
        n.target = want.length ? pick(want) : ps.length ? pick(ps) : null;
        if (!n.target || n.carry.length >= 3) { n.state = 'leave'; jhGo(sc, n, n.from[0] * TS, n.from[1] * TS); }
        else jhGo(sc, n, n.target.x, n.target.y + 6);
      }
      if (n.target && jhWalk(n, dt, n.speed)) {
        n.grab = (n.grab || 0) + dt; n.crouch = true;
        if (n.grab > 2.2) {
          n.grab = 0; n.crouch = false; const p = n.target;
          if (p.avail) { p.avail = false; n.carry.push(p.t); sc.fx.text(p.x, p.y - 16, n.j.shop ? `被${n.j.name}叼走了！` : '被偷花賊拿走了！', '#ffb0a0'); if (HEAT_OWNERS.includes(p.owner)) heatAdd(run, p.owner, 5); }
          n.target = null;
        }
      } else n.crouch = false;
    }
    if (n.state === 'leave' || n.state === 'flee') { if (jhWalk(n, dt, n.speed * (n.state === 'flee' ? 2.4 : 1))) n.state = 'gone'; }
  } else if (j.beh === 'net') {
    if (n.state === 'roam') {
      if (sc.time < n.at) return;
      if (jhSeen(sc, n, 5)) { n.state = 'chase'; sc.fx.text(n.x, n.y - 24, '站住！', '#ff9a7a'); SFX.tone(500, 0.12, { vol: 0.05 }); }
      else if (!n.path.length) { const p = pick(sc.pots); jhGo(sc, n, p.x, p.y + 8); }
      jhWalk(n, dt, n.speed * 0.7);
    } else if (n.state === 'chase') {
      if (c.box && d < 2.6 * TS) {
        n.fooled = (n.fooled || 0) + dt; n.moving = false;
        if (n.fooled > 1.4) {
          const J = jhOf(run); J.prog.net = (J.prog.net || 0) + 1;
          sc.fx.text(n.x, n.y - 24, '咦？只是紙箱啊……', '#fff3c8');
          if (J.prog.net >= j.need) jhSolve(sc, n); else { UI.toast(`騙過捕貓大叔了！（${J.prog.net}/${j.need}）他今晚先回家了`, 3000); n.state = 'flee'; jhGo(sc, n, (n.from || [7.5, 41.4])[0] * TS, (n.from || [7.5, 41.4])[1] * TS); }
        }
      } else if (!jhSeen(sc, n, 8) && !c.box) { n.state = 'roam'; n.path = []; }
      else {
        n.fooled = 0; n.path = [[c.x, c.y]]; jhWalk(n, dt, n.speed);
        if (d < 0.8 * TS && !c.box && c.inv <= 0) {
          const lost = c.carry.splice(0); c.inv = 2;
          sc.fx.text(c.x, c.y - 20, '被網子罩住了！', '#ff9a7a'); SFX.play('fail'); vibrate(80);
          UI.toast(lost.length ? `被捕貓大叔的網子罩住了！嘴上的${lost.map(f => FLOWERS[f.t].name).join('、')}全掉了……` : '被網子罩住了！還好嘴上沒叼花，掙脫跑掉了', 3200);
          n.state = 'flee'; jhGo(sc, n, (n.from || [7.5, 41.4])[0] * TS, (n.from || [7.5, 41.4])[1] * TS);
        }
      }
    } else if (n.state === 'flee') { if (jhWalk(n, dt, n.speed)) n.state = 'gone'; }
  }
}
// 解決了：變成朋友
function jhSolve(sc, n) {
  const run = sc.run, j = n.j, J = jhOf(run);
  if (j.shop) {   // 店貓：搶回花、趕跑牠（下次牠主人來論劍時還會再來）
    const got = []; while (n.carry.length && sc.cat.carry.length < sc.capacity()) { const t = n.carry.pop(); sc.cat.carry.push({ t, fresh: 0.9, pot: { owner: null } }); got.push(t); }
    n.carry = []; SFX.play('heart'); sc.fx.text(n.x, n.y - 24, '喵嗚……', '#c8d8ff');
    UI.toast(`趕跑了${j.name}！${got.length ? '搶回' + got.map(t => FLOWERS[t].name).join('、') : ''}`, 3000);
    J.shopWins = (J.shopWins || 0) + 1;
    n.state = 'flee'; jhGo(sc, n, n.from[0] * TS, n.from[1] * TS); checkAchievements(run); return;
  }
  if (J.solved[j.id]) return;
  J.solved[j.id] = run.nightIdx || 1;
  if (n.pot) { n.pot.avail = true; n.pot.jhBlock = false; }
  while (n.carry.length && sc.cat.carry.length < sc.capacity()) sc.cat.carry.push({ t: n.carry.pop(), fresh: 0.9, pot: { owner: null } });
  run.cans += 10;
  SFX.play('heart'); vibrate(40);
  sc.fx.text(n.x, n.y - 24, '♥', '#ff8ab0');
  UI.toast(`${j.name}變成朋友了！學到「${j.perk.name}」：${j.perk.desc}（罐罐 +10）`, 5000);
  n.state = 'friend'; n.leaveT = 2.5;
  checkAchievements(run);
}
// ---------- 互動 ----------
function jhAction(sc, n0) {
  const n = n0 || sc.jh, j = n.j, c = sc.cat, run = sc.run;
  if (n.cool > 0 && j.solve !== 'shake') { SFX.play('nope'); return; }
  if (j.solve === 'stare') {
    sc.jhDuel = new RivalDuel(sc, { rv: { skill: j.skill, final: !!j.final }, name: j.name, title: j.final ? '單挑！' : '比氣勢！',
      art: t => jhCatArt(Object.assign(new Cat(0, 0), { j, dir: 'left', moving: false, t })),
      winText: `${j.name}低下頭了……`, loseText: `輸了……${j.name}瞪得你耳朵都縮起來了` });
    sc.jhDuelN = n; sc.mode = 'jhduel'; Input.release(); c.moving = false;
    Input.game = (type, a) => sc.jhDuel.input(type, a);
    UI.setAction(null); UI.setSkills([]);
  } else if (j.solve === 'cans') {
    if (run.cans < j.cost) { SFX.play('nope'); UI.toast(`罐罐不夠（要 ${j.cost} 個）`, 2000); n.cool = 1; return; }
    run.cans -= j.cost; jhSolve(sc, n);
  } else if (j.solve === 'pose') {
    if (c.carry.length) { SFX.play('nope'); UI.toast('嘴巴叼著花，拍起來不可愛……先把花放回店裡再來', 2600); n.cool = 1.5; return; }
    n.flash = 0.35; SFX.tone(1400, 0.05, { vol: 0.04 }); sc.fx.text(n.x, n.y - 24, '好可愛！！', '#ffd25a');
    jhSolve(sc, n);
  } else if (j.solve === 'scare') {
    const J = jhOf(run);
    if (!n.crouch) { n.cool = 3; sc.fx.text(n.x, n.y - 24, '走開啦臭貓！', '#ff9a7a'); SFX.play('nope'); UI.toast('他正盯著你……等他蹲下去偷花的時候再嚇他', 2400); return; }
    J.prog.thief = (J.prog.thief || 0) + 1;
    sc.fx.text(n.x, n.y - 24, '哇啊啊！', '#ffd25a'); SFX.play('heart'); vibrate(40);
    const got = []; while (n.carry.length && c.carry.length < sc.capacity()) { const t = n.carry.pop(); c.carry.push({ t, fresh: 0.9, pot: { owner: null } }); got.push(t); }
    n.carry = []; n.crouch = false; n.target = null;
    if (J.prog.thief >= j.need) { jhSolve(sc, n); n.state = 'flee'; jhGo(sc, n, n.from[0] * TS, n.from[1] * TS); }
    else { UI.toast(`偷花賊嚇得跑掉了！${got.length ? '搶回' + got.map(t => FLOWERS[t].name).join('、') : ''}（${J.prog.thief}/${j.need}）`, 3000); n.state = 'flee'; jhGo(sc, n, n.from[0] * TS, n.from[1] * TS); }
  } else if (j.solve === 'shake') {
    n.taps++; n.tapT = 1.6; SFX.tone(300 + n.taps * 80, 0.06, { vol: 0.05 }); sc.fx.text(n.x, n.y - 16 - n.taps * 2, n.taps >= j.taps ? '喵嗚？' : '搖～', '#fff3c8');
    if (n.taps >= j.taps) { n.pose = null; jhSolve(sc, n); }
  } else if (j.solve === 'white') {
    const i = c.carry.findIndex(f => FLOWERS[f.t].white);
    if (i < 0) { SFX.play('nope'); UI.toast('雪姬看都不看你一眼。她只喜歡白色的花（茉莉、滿天星、玉蘭、曇花……）', 2800); n.cool = 1.5; return; }
    const f = c.carry.splice(i, 1)[0]; sc.fx.text(n.x, n.y - 24, `收下了${FLOWERS[f.t].name}`, '#ffffff');
    jhSolve(sc, n);
  }
}
function jhEndDuel(sc) {
  const D = sc.jhDuel, n = sc.jhDuelN || sc.jh;
  sc.jhDuel = null; Input.game = null; sc.mode = 'play'; sc.cat.inv = 1.5;
  if (D.win) jhSolve(sc, n);
  else if (n.j.shop) { const c = sc.cat; n.cool = 6; if (c.carry.length) { const f = c.carry.pop(); n.carry.push(f.t); UI.toast(`輸給${n.j.name}了……連嘴上的${FLOWERS[f.t].name}都被叼走`, 2800); } else UI.toast(`輸給${n.j.name}了……`, 2400); }
  else { n.cool = 6; UI.toast(`輸給${n.j.name}了……等一下再來挑戰`, 2600); }
}
function jhLabel(sc, n) {
  const j = n.j, c = sc.cat;
  if (j.solve === 'stare') return j.final ? '單挑' : '瞪眼';
  if (j.solve === 'cans') return `分罐罐（${j.cost}）`;
  if (j.solve === 'pose') return '擺姿勢';
  if (j.solve === 'scare') return '嚇他';
  if (j.solve === 'shake') return n.taps ? `搖醒 ${n.taps}/${j.taps}` : '搖醒';
  if (j.solve === 'white') return c.carry.some(f => FLOWERS[f.t].white) ? '送花' : '送花？';
  return null;
}
(function () {
  const P = NightScene.prototype;
  const _u = P.update;
  P.update = function (dt) {
    if (!this.jhInited) { this.jhInited = true; try { jhInit(this); } catch (e) { reportErr(e, 'jh'); } }
    if (this.mode === 'jhduel' && this.jhDuel) { this.fx.update(dt); this.jhDuel.update(dt); if (this.jhDuel.done) jhEndDuel(this); UI.nightHud(this); return; }
    const r = _u.call(this, dt);
    for (const n of [this.jh, this.jhShop]) {
      if (!n || this.mode !== 'play') continue;
      try { jhUpdate(this, dt * (this.timeScale || 1), n); } catch (e) { reportErr(e, 'jhu'); }
      if (n.state === 'friend') { n.leaveT -= dt; if (n.leaveT <= 0) n.state = 'gone'; }
    }
    return r;
  };
  const _ft = P.findTarget;
  P.findTarget = function () {
    _ft.call(this);
    const c = this.cat;
    if (this.mode !== 'play' || c.top || c.jump) return;
    for (const n of [this.jh, this.jhShop]) {
      if (!n || !n.j || ['gone', 'friend', 'wait', 'flee', 'leave'].includes(n.state) || n.j.solve === 'box') continue;
      if (n.j.shop && !n.carry.length) continue;
      if (dist(c.x, c.y, n.x, n.y) < 1.9 * TS) { this.target = { kind: 'jh', ref: { x: n.x, y: n.y }, n }; UI.setAction(jhLabel(this, n)); return; }
    }
  };
  const _act = P.onAction;
  P.onAction = function () {
    if (this.mode === 'play' && this.target && this.target.kind === 'jh' && this.target.n) { jhAction(this, this.target.n); return; }
    return _act.call(this);
  };
  const _r3 = P.render3D;
  P.render3D = function () { const r = _r3.call(this); if (this.jhDuel && R3.ov) this.jhDuel.render(R3.ov, R3.W, R3.H); return r; };
  const _fin = P.finish;
  P.finish = function (timeUp) {
    const run = this.run;
    if (this.jh && this.jh.pot && this.jh.pot.jhBlock) { this.jh.pot.jhBlock = false; }
    try {
      if (jhHas(run, 'tiger')) this.deposited.push({ t: pick(['rose', 'hydrangea', 'lisianthus', 'carnation', 'osmanthus']), fresh: 1, owner: 'gift' });
      if (jhHas(run, 'photo')) { const R = repOf(run); R.xp += 3; }
      if (jhHas(run, 'thief')) for (const o of HEAT_OWNERS) heatAdd(run, o, -3);
      if (jhHas(run, 'net')) run.cans += 3;
    } catch (e) { reportErr(e, 'jhf'); }
    return _fin.call(this, timeUp);
  };
})();
// ---------- 畫 ----------
function jhCatArt(n) { const j = n.j; return withGear(null, () => ART.fix(toonGang({ id: 'jh' + j.id, pal: j.pal, scarf: 0 }, n))); }
function jhRender3D(sc, F) { jhRenderOne(sc, F, sc.jh); jhRenderOne(sc, F, sc.jhShop); }
function jhRenderOne(sc, F, n) {
  if (!n || n.state === 'gone' || n.state === 'wait' || sc.mode === 'zone') return;
  if (n.j.kind === 'cat') {
    const offs = n.j.id === 'trio' ? [[0, 0], [-6, 3], [6, 4]] : [[0, 0]];
    for (const [ox, oy] of offs) {
      pushSprite(F.sprites, jhCatArt(n), n.x + ox, n.y + 0.6 + oy, { minLight: [0.36, 0.34, 0.4] });
      shadowAt(F, n.x + ox, n.y + 0.6 + oy, n.j.id === 'fat' ? 1.1 : 0.7, 0.28, 1, 0);
    }
    glowQuad(F.glow, n.x / TS + (n.dir === 'left' ? -0.15 : n.dir === 'right' ? 0.15 : 0), 0.62, n.y / TS + 0.08, 0.14, n.j.id === 'boss' ? [1, 0.4, 0.3, 0.4] : [1, 0.95, 0.5, 0.3]);
    n.carry.forEach((t, i) => pushSprite(F.sprites, ART.icon(t), n.x + (n.dir === 'left' ? -5 : 5), n.y + 1.6, { lift: 0.36 + i * 0.05, minLight: [0.45, 0.42, 0.48] }));
  } else {
    pushSprite(F.sprites, ART.human({ key: n.j.key, dir: n.dir, moving: n.moving, t: n.t }), n.x, n.y + 0.5, { minLight: [0.32, 0.3, 0.36] });
    shadowAt(F, n.x, n.y + 0.5, 0.7, 0.28);
    if (n.flash > 0) glowQuad(F.glow, n.x / TS, 1.4, n.y / TS, 3.6, [1, 1, 0.95, n.flash * 1.6]);
    if (n.ready) glowQuad(F.glow, n.x / TS, 1.5, n.y / TS, 0.25, [1, 0.3, 0.3, 0.6]);
    n.carry.forEach((t, i) => pushSprite(F.sprites, ART.icon(t), n.x + 6, n.y + 1, { lift: 0.9 + i * 0.12, minLight: [0.45, 0.42, 0.48] }));
  }
  // 還沒解決的：頭上一個小驚嘆號
  if (n.state !== 'friend' && n.j.kind) glowQuad(F.glow, n.x / TS, n.j.kind === 'cat' ? 1.05 : 1.9, n.y / TS, 0.12, [1, 0.85, 0.3, 0.55 + 0.3 * Math.sin(n.t * 5)]);
}
// ---------- 圖鑑 ----------
function jhBookHTML(run) {
  const J = jhOf(run);
  const rows = JH.map(j => {
    const ok = jhHas(run, j.id), met = J.met[j.id];
    return `<li class="du-row ${ok ? 'beat' : ''}"><span class="du-rk">${j.kind === 'cat' ? '🐾' : '👤'}</span><div><b>${met ? esc(j.name) : '？？？'}<small>　${met ? esc(j.tag) : `第 ${j.m} 個月出現`}</small></b>
      <p>${ok ? `朋友・「${esc(j.perk.name)}」：${esc(j.perk.desc)}` : met ? esc(j.how) : (j.allies ? `交到 ${j.allies} 個朋友以後才會出現` : '還沒碰過')}</p></div>${ok ? '<i class="du-seal jh">友</i>' : ''}</li>`;
  }).join('');
  return `<h3>巷子江湖　朋友 ${jhAllies(run)}/${JH.length}</h3><p class="lead">晚上巷子裡的貓和人。每個都有麻煩、也都有解法；解決了就變成朋友，送你一個永久的好處。</p><ul class="du-list">${rows}</ul>`;
}

// ================= 對手花店的店貓 =================
// 這個月有高手要來論劍的話，他店裡的貓晚上會溜過來，專挑論劍要用的花叼走。
// 叼著花的店貓可以「瞪眼」對決：贏了花搶回來，輸了連你嘴上的花都被叼走。
const SHOP_CATS = {
  ji: { name: '星星', pal: { fur: '#f0e8dc', furL: '#ffffff', furD: '#cfc4b4', stripe: '#8a7a6a', cream: '#ffffff', creamS: '#ece4d8', eye: '#ffd23a', eyeD: '#c8a020', ear: '#f6b0a0' } },
  rose: { name: '刺刺', pal: { fur: '#5a3a3a', furL: '#7a5050', furD: '#3a2424', stripe: '#2a1818', cream: '#c89a9a', creamS: '#a87a7a', eye: '#ff6a7a', eyeD: '#c83a4a', ear: '#e08a8a' } },
  kui: { name: '網美', pal: { fur: '#f4d8e0', furL: '#ffeef2', furD: '#d8b0bc', stripe: '#c88a9a', cream: '#ffffff', creamS: '#f4e4ea', eye: '#9ad0ff', eyeD: '#4a8ac8', ear: '#ffb0c4' } },
  liu: { name: '剪刀', pal: { fur: '#8a8a90', furL: '#aaaab0', furD: '#5a5a62', stripe: '#3a3a42', cream: '#d8d8dc', creamS: '#b8b8c0', eye: '#e8f070', eyeD: '#a0a830', ear: '#c8a0a0' } },
  gui: { name: '桂圓', pal: { fur: '#c8803a', furL: '#e8a060', furD: '#985a20', stripe: '#704010', cream: '#fff0d8', creamS: '#f0d8b0', eye: '#ffe066', eyeD: '#c8a02a', ear: '#f0a888' } },
  kevin: { name: 'Logo', pal: { fur: '#e8f4f0', furL: '#ffffff', furD: '#c0d8d0', stripe: '#3aa890', cream: '#ffffff', creamS: '#e0f0ea', eye: '#3ad0b0', eyeD: '#1a8a70', ear: '#a8e0d0' } },
  bai: { name: '雪球', pal: { fur: '#fcfcff', furL: '#ffffff', furD: '#e0e0ea', stripe: '#ececf4', cream: '#ffffff', creamS: '#f0f0f8', eye: '#a0c8ff', eyeD: '#5080c0', ear: '#f8d0d8' } },
  lin: { name: '蘭蘭', pal: { fur: '#a890c0', furL: '#c8b4dc', furD: '#806898', stripe: '#5a4470', cream: '#ece4f4', creamS: '#d8cce8', eye: '#e8d070', eyeD: '#a89030', ear: '#e0b8d8' } },
  peony: { name: '富貴', pal: { fur: '#f0c8a0', furL: '#ffe0c0', furD: '#c89870', stripe: '#a87048', cream: '#fff4e8', creamS: '#f0dcc4', eye: '#5ac8ff', eyeD: '#2a88c8', ear: '#f8b8a8' } },
  saint: { name: '春', pal: { fur: '#3a4a3a', furL: '#546454', furD: '#243024', stripe: '#1a221a', cream: '#8a9a7a', creamS: '#6a7a5a', eye: '#d8ff9a', eyeD: '#88b050', ear: '#7a6a5a' } },
};
function jhShopInit(sc) {
  const run = sc.run; sc.jhShop = null;
  const D = run.duel, c = D && D.cur;
  if (!c || c.done || c.m !== (run.month || 1) || sc.raid) return;
  const M = MASTERS[c.i], C = SHOP_CATS[M.id]; if (!C) return;
  const J = jhOf(run), k = 'sc' + c.m;
  if (J[k] && Math.random() > 0.55) return;   // 第一晚一定來，之後一半機率
  J[k] = (J[k] || 0) + 1;
  const want = [...new Set(M.rounds.flatMap((R, i) => masterSpec(run, M, i).stems))].filter(t => !FLOWERS[t].hybrid);
  const j = { id: 'shop-' + M.id, shop: true, kind: 'cat', name: `${M.name}的店貓「${C.name}」`, tag: '', beh: 'thief', solve: 'stare', skill: Math.min(0.9, 0.2 + (10 - M.rank) * 0.07), pal: C.pal };
  const from = Math.random() < 0.5 ? [7.5, 41.4] : [1.6, 5.6];
  const n = Object.assign(new Cat(from[0] * TS, from[1] * TS), { j, state: 'wait', at: sc.time + rnd(10, 40), t: 0, path: [], carry: [], cool: 0, taps: 0, tapT: 0, said: 0, from, speed: 30, want });
  sc.jhShop = n;
  if (J[k] === 1) setTimeout(() => { if (G.scene === sc) UI.toast(`${M.name}店裡的貓「${C.name}」溜進巷子了！牠專挑論劍要用的花（${want.slice(0, 4).map(t => FLOWERS[t].name).join('、')}）。追上叼著花的牠，按「瞪眼」搶回來！`, 5200); }, 6500);
}
(function () {
  const P = NightScene.prototype;
  const _u = P.update;
  P.update = function (dt) {
    if (!this.jhShopInited) { this.jhShopInited = true; try { jhShopInit(this); } catch (e) { reportErr(e, 'jhs'); } }
    return _u.call(this, dt);
  };
})();
