// ================= 每個月的新障礙＋專門破解它的技能；花店每個月的新問題＋新設備 =================
// 第五到第十二個月，巷子每個月多一種新的防貓設施（越偷越多人防你）。老貓攤同時進一招專門破解它的本事：
//   沒學就很難偷（警報、被追、被噴濕），學了以後那個障礙反而變成你的優勢。
// 花店也一樣：每個月遇到一個真的會發生的問題（熱浪、颱風、網購、婚禮旺季、觀光客、寒流、年節……），買對設備才解決得了。
// 價錢會跟著物價漲：越晚買越貴，罐罐和錢都不夠全部買，要自己決定先買哪個。
const OBSTACLES = [
  { m: 5, id: 'ir', name: '紅外線警報', where: '各家院子的門口', skill: 'ireye', sname: '紅外線眼', cost: 120, color: '#ff4a5a',
    odesc: '院子門口裝了看不見的紅外線，一走過去就警鈴大作，那一家的警戒大漲', sdesc: '看得到紅外線；用走的就能從光束下面鑽過去（項圈掛上紅色鏡片吊飾）' },
  { m: 6, id: 'bigdog', name: '空屋的大狼狗', where: '空屋的院子', skill: 'doglang', sname: '狗語', cost: 140, color: '#c8864a',
    odesc: '空屋被建商買走，院子裡養了一隻大狼狗：不吃罐罐、跑得快，被撲到會丟花', sdesc: '靠近大狗按「狗語」，牠今晚就是你的朋友（小柴也不會再叫）（掛上骨頭吊飾）' },
  { m: 7, id: 'laser', name: '大宅的雷射網', where: '大宅花園', skill: 'squeeze', sname: '縮骨功', cost: 160, color: '#ff3a8a',
    odesc: '大宅花園裝了會上下掃的雷射光，一碰到管家和監視器馬上過來', sdesc: '把身體縮扁：用走的時候雷射從頭上掃過去（掛上粉紅鑽石吊飾）' },
  { m: 8, id: 'spray', name: '驅貓噴水器', where: '社區花圃、王家、阿伯家', skill: 'waterfur', sname: '撥水毛', cost: 150, color: '#4ab8ff',
    odesc: '花圃和院子裝了感應式驅貓噴水器：被噴到會走不快、嘴上的花被打爛、還很吵', sdesc: '毛會撥水：噴水器、下雨都不怕，被噴到也照樣走（掛上水滴吊飾）' },
  { m: 9, id: 'drone', name: '巡守無人機', where: '整條巷子上空', skill: 'jam', sname: '喵波干擾', cost: 180, color: '#8a9aff',
    odesc: '里長買了無人機，晚上沿著巷子巡邏：探照燈照到就通報，連屋頂上也看得到', sdesc: '多一顆「干擾」按鈕：無人機亂飛 25 秒（每晚兩次）（掛上天線吊飾）' },
  { m: 10, id: 'parrot', name: '王太太的鸚鵡', where: '王家門口', skill: 'birdpal', sname: '鸚鵡朋友', cost: 160, color: '#6ad04a',
    odesc: '王太太養了一隻鸚鵡「小綠」，眼睛很尖，看到你就大叫「有貓！有貓！」', sdesc: '叼一朵向日葵給小綠吃葵花子，牠就永遠是你的朋友（掛上羽毛吊飾）' },
  { m: 11, id: 'motion', name: '感應式警示燈', where: '巷子裡的每一戶門口', skill: 'slowmo', sname: '超慢步', cost: 190, color: '#ffe066',
    odesc: '家家戶戶門口都裝了感應燈：一亮起來大家都看得很遠，窗邊的人也會探頭', sdesc: '輕輕推搖桿慢慢走，感應燈完全感應不到你（掛上月亮吊飾）' },
  { m: 12, id: 'spike', name: '防貓刺墊', where: '所有柵欄上面', skill: 'padguard', sname: '肉球護墊', cost: 210, color: '#c8c8d8',
    odesc: '年底大家聯合起來，所有柵欄都鋪了防貓刺墊，爬不上去了', sdesc: '肉球套上護墊：刺墊照爬，而且爬上爬下更快（掛上星星吊飾）' },
];
for (const o of OBSTACLES) UPGRADES.push({ id: o.skill, name: o.sname, group: '破解', max: 1, cost: [o.cost], mon: [o.m], lv: [o.sdesc], base: `${o.name}：${o.odesc}`, obst: o.id });
function obOn(run, id) { const o = OBSTACLES.find(x => x.id === id); return !!o && (run.month || 1) >= o.m; }
function obSkill(run, id) { const o = OBSTACLES.find(x => x.id === id); return !!o && !!(run.upg && run.upg[o.skill]); }
// 物價：越晚買越貴（開放之後每個月漲一成）
function skillCost(run, u, lv) { const open = (u.mon && u.mon[lv]) || 1; return Math.round(u.cost[lv] * (1 + 0.1 * Math.max(0, (run.month || 1) - open))); }

// ---------- 項圈吊飾（每學一招破解就多一個） ----------
{
  const _cg = catGearFor;
  catGearFor = function (run) {
    const g = _cg(run); if (!run || !run.upg) return g;
    const ch = OBSTACLES.filter(o => run.upg[o.skill]).map((o, i) => OBSTACLES.indexOf(o)).join('');
    if (!ch) return g;
    const out = g || {}; out.charm = 'c' + ch; return out;
  };
  const _hu = gearHeadUnder;
  gearHeadUnder = function (P, s, g) {
    _hu(P, s, g);
    if (!g.charm) return;
    const ids = g.charm.slice(1).split('').map(Number), n = ids.length;
    if (!g.collar) PX.curve([P(-11, 11), P(0, 15.5), P(11, 11)], '#c8a060', { w: 0.6 });
    ids.forEach((k, i) => { const u = n > 1 ? -0.75 + 1.5 * i / (n - 1) : 0, [x, y] = P(u * 9.6, 14.2 + 3.4 * (1 - u * u)); gEll(x, y + 1.6 * s, 1.5 * s, 1.5 * s, OBSTACLES[k].color); });
  };
  const _sn = gearSideNeck;
  gearSideNeck = function (P, g) {
    _sn(P, g);
    if (!g.charm) return;
    const ids = g.charm.slice(1).split('').map(Number);
    ids.forEach((k, i) => { const [x, y] = P(-3.6 + i * 1.1, 9.8 + Math.sin(i) * 0.4); O.eo(x, y, 0.75, 0.75, OBSTACLES[k].color); });
  };
  const _fb = gearFrontBody;
  gearFrontBody = function (stage, bob, g) {
    _fb(stage, bob, g);
    if (stage === 'back' || !g.charm) return;
    const ids = g.charm.slice(1).split('').map(Number), n = ids.length;
    ids.forEach((k, i) => { const u = n > 1 ? -0.8 + 1.6 * i / (n - 1) : 0; O.eo(u * 4.6, -12.2 + bob + (1 - u * u) * 1.4, 0.8, 0.8, OBSTACLES[k].color); });
  };
  const _ch = gearCuteHead;
  gearCuteHead = function (c, stage, pal) {
    _ch(c, stage, pal);
    if (stage !== 'under' || pal) return;
    const g = gearNow(); if (!g || !g.charm) return;
    const ids = g.charm.slice(1).split('').map(Number), n = ids.length;
    ids.forEach((k, i) => { const u = n > 1 ? -0.8 + 1.6 * i / (n - 1) : 0, x = u * 11, y = 17 + 3 * (1 - u * u); c.fillStyle = CM.ink; c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill(); c.fillStyle = OBSTACLES[k].color; c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill(); });
  };
}

// ================= 晚上：障礙 =================
const IR_GATES = [{ x: 9, y: 13, o: 'lin' }, { x: 5, y: 24, o: 'wang' }, { x: 5, y: 33, o: 'empty' }, { x: 9, y: 35, o: 'bo' }];
const SPRAYERS = [{ x: 2.6, y: 10.6, o: 'public' }, { x: 2.6, y: 23.6, o: 'wang' }, { x: 11.6, y: 33.6, o: 'bo' }];
const MLIGHTS = [{ x: 8.6, y: 13.4, o: 'lin' }, { x: 6.2, y: 24.4, o: 'wang' }, { x: 6.2, y: 33.4, o: 'empty' }, { x: 8.6, y: 35.4, o: 'bo' }, { x: 7.5, y: 18.6, o: 'public' }, { x: 7.5, y: 28.6, o: 'public' }];
const DOG_YARD = [1.2, 32.2, 4.8, 36.0];
const PARROT = { x: 1.5, y: 21.9 };
function obAlarm(sc, owner, x, y, msg, key) {
  sc.obCool = sc.obCool || {};
  if (sc.obCool[key] > 0) return;
  sc.obCool[key] = 6;
  const run = sc.run;
  if (owner && HEAT_OWNERS.includes(owner)) heatAdd(run, owner, 10);
  sc.noise(x, y, 7.5 * TS, 'obj');
  for (const v of sc.viewers) if (v && dist(v.eye()[0], v.eye()[1], x, y) < 9 * TS) v.susp = Math.max(v.susp || 0, 0.45);
  if (owner === 'wang' && sc.wang && sc.wang.wake) sc.wang.wake();
  sc.fx.text(x, y - 16, msg, '#ff8a7a', 1.5); SFX.play('alarm'); vibrate([40, 30, 40]);
  sc.stats.alarms = (sc.stats.alarms || 0) + 1;
}
function obInit(sc) {
  const run = sc.run; if ((run.month || 1) < 5) { sc.ob = null; return; }
  const O = sc.ob = { t: 0 };
  if (obOn(run, 'bigdog')) O.dog = { x: 2.6 * TS, y: 34.6 * TS, dir: 'right', state: 'stand', t: 0, barkT: 0, friend: false, moving: false };
  if (obOn(run, 'drone')) O.drone = { x: 7.5 * TS, y: 10 * TS, vy: 1, meter: 0, jam: 0, hover: 0 };
  if (obOn(run, 'parrot')) O.parrot = { awake: true, ct: 6, meter: 0, friend: !!run.flags.parrotFriend, talkT: 0 };
  if (obOn(run, 'spray')) O.spray = SPRAYERS.map(s => Object.assign({ on: 0, cd: 0 }, s));
  if (obOn(run, 'motion')) O.lights = MLIGHTS.map(l => Object.assign({ on: 0 }, l));
  O.jams = obSkill(run, 'drone') ? 2 : 0;
  O.wet = 0; O.prevX = sc.cat.x;
  // 嗅花第二級：今晚香氣最濃的一盆
  if ((run.upg.sniff || 0) >= 2) {
    const ps = sc.pots.filter(p => p.avail && !p.top && p.t !== 'lily' && p.t !== 'tanhua' && p.owner !== 'mansion');
    if (ps.length) { const p = pick(ps); p.fragrant = true; setTimeout(() => { if (G.scene === sc) UI.toast(`聞到了……今晚${OWNERS[p.owner] ? OWNERS[p.owner].name : ''}那盆${FLOWERS[p.t].name}香氣最濃（叼回去算兩朵）`, 3600); }, 3000); }
  }
}
function obUpdate(sc, dt) {
  const O = sc.ob; if (!O) return;
  const run = sc.run, c = sc.cat; O.t += dt;
  for (const k in sc.obCool || {}) sc.obCool[k] -= dt;
  const walking = c.moving && !c.running;
  const inv = c.inv > 0 || c.home;
  // 紅外線：穿過院子門口
  if (obOn(run, 'ir') && !c.top && !inv) {
    for (const g of IR_GATES) {
      const bx = (g.x + 0.5) * TS, ty = Math.floor((c.y - 2) / TS);
      if (ty === g.y && ((O.prevX < bx && c.x >= bx) || (O.prevX > bx && c.x <= bx))) {
        if (obSkill(run, 'ir') && !c.running) { sc.fx.text(c.x, c.y - 14, '（從紅外線下面鑽過去）', '#ffb0b8', 1.2); }
        else obAlarm(sc, g.o, bx, (g.y + 0.5) * TS, '嗶嗶嗶！紅外線警報！', 'ir' + g.o);
      }
    }
  }
  O.prevX = c.x;
  // 大狼狗
  const D = O.dog;
  if (D) {
    D.t += dt; if (D.barkT > 0) D.barkT -= dt;
    const [x0, y0, x1, y1] = DOG_YARD;
    const inYard = !c.top && c.x > x0 * TS && c.x < x1 * TS && c.y > y0 * TS && c.y < (y1 + 0.3) * TS;
    if (!D.friend && inYard && !inv) {
      const dx = c.x - D.x, dy = c.y - D.y, d = Math.hypot(dx, dy) || 1;
      const sp = 50 * dt;
      D.x = clamp(D.x + dx / d * sp, x0 * TS, x1 * TS); D.y = clamp(D.y + dy / d * sp, y0 * TS, y1 * TS); D.moving = true; D.dir = dx > 0 ? 'right' : 'left';
      if (D.barkT <= 0) { D.barkT = 1.2; SFX.play('bark'); sc.noise(D.x, D.y, 6 * TS, 'obj'); sc.fx.text(D.x, D.y - 18, '汪！汪！', '#ffd25a'); }
      if (d < 0.75 * TS) {
        const lost = c.carry.length ? c.carry.splice(Math.floor(Math.random() * c.carry.length), 1)[0] : null;
        c.x = 6.5 * TS; c.y = 34 * TS; c.inv = 1.5; sc.snapCam = true; Input.release();
        SFX.play('fail'); vibrate([60, 40, 60]);
        UI.toast(`大狼狗把你撲出院子了！${lost ? '嘴上的' + FLOWERS[lost.t].name + '掉了。' : ''}${obSkill(run, 'bigdog') ? '（靠近按「狗語」跟牠交朋友）' : '（老貓攤的「狗語」可以跟牠交朋友）'}`, 3600);
        sc.stats.dogHit = (sc.stats.dogHit || 0) + 1;
      }
    } else if (!D.friend) {
      // 回到院子中間踱步
      const hx = 2.8 * TS + Math.sin(D.t * 0.5) * 1.2 * TS, hy = 34.4 * TS, dx = hx - D.x, dy = hy - D.y, d = Math.hypot(dx, dy);
      if (d > 2) { D.x += dx / d * 18 * dt; D.y += dy / d * 18 * dt; D.moving = true; D.dir = dx > 0 ? 'right' : 'left'; } else D.moving = false;
    } else D.moving = false;
  }
  // 雷射網
  if (obOn(run, 'laser') && !c.top && c.y > 43 * TS && !inv) {
    for (let i = 0; i < 2; i++) {
      const by = laserY(O.t, i) * TS;
      if (Math.abs(c.y - by) < 3 && c.x > 1.2 * TS && c.x < 13.8 * TS) {
        if (obSkill(run, 'laser') && !c.running) { if (!O.lzTip) { O.lzTip = 1; sc.fx.text(c.x, c.y - 14, '（縮扁，雷射從頭上掃過）', '#ffb0d8', 1.2); } }
        else obAlarm(sc, 'mansion', c.x, c.y, '雷射被切斷了！', 'laser');
      }
    }
  }
  // 噴水器
  if (O.spray) {
    for (const s of O.spray) {
      if (s.on > 0) s.on -= dt; if (s.cd > 0) s.cd -= dt;
      if (s.cd <= 0 && !c.top && !inv && dist(c.x, c.y, s.x * TS, s.y * TS) < 1.6 * TS) {
        s.on = 2.2; s.cd = 7; SFX.tone(300, 0.4, { to: 700, vol: 0.05, type: 'sawtooth' });
        if (obSkill(run, 'spray')) sc.fx.text(c.x, c.y - 14, '（毛會撥水，不怕！）', '#9ad8ff');
        else {
          O.wet = 4; for (const f of c.carry) f.fresh = Math.max(0.35, f.fresh - 0.25);
          sc.noise(s.x * TS, s.y * TS, 3.5 * TS, 'obj'); sc.fx.text(c.x, c.y - 14, '噗哧——濕答答！', '#9ad0ff');
          if (!sc.tips.spray) { sc.tips.spray = 1; UI.toast('被驅貓噴水器噴到了！走不快、嘴上的花被打爛。老貓攤的「撥水毛」就不怕了', 3800); }
        }
      }
    }
  }
  if (O.walkBase === undefined) O.walkBase = c.walkMul || 1;
  if (O.wet > 0) { O.wet -= dt; c.walkMul = O.walkBase * 0.6; c.dashMul = 0.7; if (O.wet <= 0) { c.walkMul = O.walkBase; c.dashMul = 1; } }
  // 無人機
  const Dr = O.drone;
  if (Dr) {
    if (Dr.jam > 0) { Dr.jam -= dt; Dr.y += (2 * TS - Dr.y) * Math.min(1, dt * 0.8); Dr.x = 7.5 * TS + Math.sin(O.t * 7) * 2 * TS; }
    else if (Dr.hover > 0) { Dr.hover -= dt; Dr.x += (c.x - Dr.x) * Math.min(1, dt * 2); Dr.y += (c.y - Dr.y) * Math.min(1, dt * 2); }
    else { Dr.y += Dr.vy * 1.5 * TS * dt; if (Dr.y > 40.5 * TS) Dr.vy = -1; if (Dr.y < 7 * TS) Dr.vy = 1; Dr.x = 7.5 * TS + Math.sin(O.t * 0.4) * 3 * TS; }
    const seen = Dr.jam <= 0 && !inv && !c.hidden && !(c.box && !c.moving) && !c.shadow && dist(c.x, c.y, Dr.x, Dr.y) < 1.5 * TS;
    Dr.meter = seen ? Dr.meter + dt : Math.max(0, Dr.meter - dt * 0.6);
    if (Dr.meter > 0.7) { Dr.meter = 0; Dr.hover = 3; obAlarm(sc, c.y < 17 * TS ? 'lin' : c.y < 27 * TS ? 'wang' : c.y < 37 * TS ? 'bo' : 'mansion', c.x, c.y, '無人機：發現目標！', 'drone'); if (sc.patrol && sc.patrol.hear) sc.patrol.hear(c.x, c.y, sc); }
  }
  // 鸚鵡
  const Pa = O.parrot;
  if (Pa) {
    Pa.ct -= dt; if (Pa.ct <= 0) { Pa.awake = !Pa.awake; Pa.ct = Pa.awake ? rnd(8, 11) : rnd(4, 6); }
    if (Pa.talkT > 0) Pa.talkT -= dt;
    const ex = PARROT.x * TS, ey = PARROT.y * TS, d = dist(ex, ey, c.x, c.y - 4);
    const vis = Pa.awake && !inv && !c.top && !c.hidden && !(c.box && !c.moving) && d < 6.2 * TS && angDiff(Math.atan2(c.y - 4 - ey, c.x - ex), 0.75) < 0.85 && lineOfSight(sc.map, ex, ey, c.x, c.y - 4, sc.occ);
    if (vis && Pa.friend) { if (Pa.talkT <= 0) { Pa.talkT = 6; sc.fx.text(ex, ey - 14, pick(['好可愛～', '花喵！花喵！', '嘘——']), '#9fe8a8'); } }
    else { Pa.meter = vis ? Pa.meter + dt : Math.max(0, Pa.meter - dt); if (Pa.meter > 0.6) { Pa.meter = 0; obAlarm(sc, 'wang', ex, ey, '有貓！有貓！', 'parrot'); } }
  }
  // 感應燈
  if (O.lights) {
    const slow = obSkill(run, 'motion') && Input.vector().mag < 0.6 && !c.running;
    for (const l of O.lights) {
      if (l.on > 0) l.on -= dt;
      if (!c.top && !inv && c.moving && !slow && dist(c.x, c.y, l.x * TS, l.y * TS) < 1.5 * TS) {
        if (l.on <= 0) { SFX.tone(1800, 0.05, { vol: 0.04, type: 'square' }); sc.fx.text(l.x * TS, l.y * TS - 18, '喀！', '#fff6c8'); if (l.o === 'wang' && sc.wang && sc.wang.wake) sc.wang.wake(); if (!sc.tips.mlight) { sc.tips.mlight = 1; UI.toast('感應燈亮了！燈下大家看得很遠。老貓攤的「超慢步」輕輕推慢慢走就不會亮', 3800); } }
        l.on = 7;
      }
    }
  }
}
function laserY(t, i) { return 43.6 + (Math.sin(t * 0.7 + i * Math.PI) * 0.5 + 0.5) * 6.2; }
function toonDrone() {
  return toonFrameInfo(toonFrame('drone', 30, 18, () => {
    O.blobO([[-6, -8], [6, -8], [7, -4], [-7, -4]], '#3a3e4a');
    for (const sx of [-11, 11]) { O.curve([[sx * 0.55, -7], [sx, -10]], CM.ink, 2.4); O.eo(sx, -10.5, 4.4, 1, '#c8c8d8'); }
    O.dot(0, -3, 1.4, '#ff4a4a');
  }), false, 0.5, 0.9);
}
function toonParrot(awake, friend) {
  return toonFrameInfo(toonFrame('parrot-' + (awake ? 1 : 0) + (friend ? 1 : 0), 22, 30, () => {
    O.curve([[0, -28], [0, -24]], CM.ink, 1.2);
    O.curve([[-8, -2], [-8, -20], [0, -25], [8, -20], [8, -2]], '#c8a050', 1.4);
    O.eo(0, -10, 3.6, 5.2, '#4fc84a'); O.eo(0, -16, 3, 3, '#6ad85a'); O.e(0, -6, 2.4, 2, '#ffd84d');
    O.p([[2.4, -16.4], [5, -15.4], [2.4, -14.6]], '#ff8a2a');
    if (awake) O.dot(1, -17, 0.8, CM.ink); else O.curve([[0, -17], [2, -17]], CM.ink, 0.8);
    if (friend) O.dot(-2.4, -15.4, 0.9, '#ff9fbb');
    O.curve([[-8, -2], [8, -2]], '#c8a050', 1.4);
  }), false, 0.5, 0.95);
}
function toonSprayer(on) {
  return toonFrameInfo(toonFrame('sprayer-' + (on ? 1 : 0), 16, 20, () => {
    O.curve([[0, 0], [0, -8]], CM.ink, 2.4); O.curve([[0, 0], [0, -8]], '#5a5e6a', 1.2);
    O.blobO([[-4, -14], [4, -14], [4, -8], [-4, -8]], '#2a3a2a'); O.dot(0, -11.5, 1.4, on ? '#ff4a4a' : '#4aff8a');
  }), false, 0.5, 0.95);
}
function toonSpike() {
  return toonFrameInfo(toonFrame('spike', 16, 8, () => {
    for (let i = 0; i < 5; i++) O.p([[-7 + i * 3.2, 0], [-5.4 + i * 3.2, -5], [-3.8 + i * 3.2, 0]], '#b8b8c8');
  }), false, 0.5, 0.95);
}
function obRender3D(sc, F, L) {
  const O = sc.ob; if (!O || sc.mode === 'zone') return;
  const run = sc.run, t = O.t, cp = Math.cos(R3.pitch);
  // 紅外線：沒學會只看得到一點點
  if (obOn(run, 'ir')) {
    const a = obSkill(run, 'ir') ? 0.55 : 0.07;
    for (const g of IR_GATES) for (let k = 0; k <= 6; k++) glowQuad(F.glow, g.x + 0.5, 0.25 + (k % 2) * 0.2, g.y + k / 6, 0.07, [1, 0.2, 0.25, a]);
  }
  if (obOn(run, 'laser')) for (let i = 0; i < 2; i++) { const y = laserY(t, i); for (let x = 1.2; x <= 13.8; x += 0.35) glowQuad(F.glow, x, 0.35, y, 0.09, [1, 0.25, 0.6, 0.7]); }
  if (O.dog) { const D = O.dog, a = ART.dog({ dir: D.dir, state: D.friend ? 'sleep' : 'stand', barkT: D.barkT, moving: D.moving, t: t }); if (a) pushSprite(F.sprites, Object.assign({}, a, { w: a.w * 1.45, h: a.h * 1.45 }), D.x, D.y, { tint: D.friend ? undefined : [0.55, 0.48, 0.45, 1] }); shadowAt(F, D.x, D.y, 1.0, 0.36); }
  if (O.spray) for (const s of O.spray) { pushSprite(F.sprites, ART.fix(toonSprayer(s.on > 0)), s.x * TS, s.y * TS); if (s.on > 0) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 3, r = ((t * 2 + i * 0.1) % 1) * 1.6; glowQuad(F.glow, s.x + Math.cos(a) * r, 0.2 + Math.sin(r / 1.6 * Math.PI) * 0.7, s.y + Math.sin(a) * r * 0.7, 0.07, [0.7, 0.85, 1, 0.8]); } }
  if (O.drone) { const D = O.drone; pushSprite(F.sprites, ART.fix(toonDrone()), D.x, D.y, { lift: 3.0 * cp + Math.sin(t * 3) * 0.05, unlit: true }); if (D.jam <= 0) { groundQuad(F.decalGlow, D.x / TS, D.y / TS, 1.5, 1.5, 0, D.meter > 0.2 ? [1, 0.4, 0.3, 0.45] : [0.8, 0.85, 1, 0.32], 0.02); L.push({ x: D.x / TS, y: 2.6, z: D.y / TS, r: 2.2, c: [0.6, 0.65, 0.8], pri: 1.2 }); } }
  if (O.parrot) { const P = O.parrot; pushSprite(F.sprites, ART.fix(toonParrot(P.awake, P.friend)), PARROT.x * TS, PARROT.y * TS, { lift: 0.9 * cp, minLight: [0.6, 0.6, 0.6] }); if (P.meter > 0.05) glowQuad(F.glow, PARROT.x, 1.9, PARROT.y, 0.25, [1, 0.3, 0.2, 0.6]); }
  if (O.lights) for (const l of O.lights) { glowQuad(F.glow, l.x, 1.5, l.y - 0.3, l.on > 0 ? 0.35 : 0.1, l.on > 0 ? [1, 0.98, 0.8, 0.9] : [0.5, 0.5, 0.6, 0.6]); if (l.on > 0) { L.push({ x: l.x, y: 1.6, z: l.y, r: 3.4, c: [1.3, 1.25, 1.0], pri: 1.5 }); groundQuad(F.decalGlow, l.x, l.y + 0.4, 2.4, 1.6, 0, [1, 0.95, 0.75, 0.3], 0.02); } }
  if (obOn(run, 'spike')) { const st = R3.stage('night'); if (st) for (let ty = 0; ty < sc.map.h; ty += 1) for (let tx = 0; tx < sc.map.w; tx++) if (sc.map.at(tx, ty) === 'f' && (tx + ty) % 2 === 0) pushSprite(F.sprites, ART.fix(toonSpike()), (tx + 0.5) * TS, (ty + 0.6) * TS, { lift: 0.75 * cp, minLight: [0.5, 0.5, 0.55] }); }
  // 香氣最濃的一盆
  for (const p of sc.pots) if (p.fragrant && p.avail) { glowQuad(F.glow, p.x / TS, 0.9 + Math.sin(t * 2) * 0.1, p.y / TS - 0.3, 0.5, [1, 0.85, 0.4, 0.3]); for (let i = 0; i < 3; i++) glowQuad(F.glow, p.x / TS + Math.sin(t * 2 + i * 2) * 0.4, 0.6 + ((t * 0.6 + i / 3) % 1) * 1.2, p.y / TS - 0.3, 0.06, [1, 0.95, 0.6, 0.8]); }
}
(function () {
  const P = NightScene.prototype;
  const _u = P.update;
  P.update = function (dt) {
    if (!this.obInited) { this.obInited = true; try { obInit(this); } catch (e) { reportErr(e, 'ob'); } }
    const r = _u.call(this, dt);
    if (this.mode === 'play' && this.ob) obUpdate(this, dt * (this.timeScale || 1));
    return r;
  };
  // 感應燈亮的地方算亮
  const _lit = P.litAt;
  P.litAt = function (x, y) {
    if (this.ob && this.ob.lights) for (const l of this.ob.lights) if (l.on > 0 && dist(x, y, l.x * TS, l.y * TS) < 3.2 * TS) return true;
    return _lit.call(this, x, y);
  };
  // 防貓刺墊：柵欄爬不上去
  const _cl = P.climbable;
  P.climbable = function (tx, ty) {
    if (obOn(this.run, 'spike') && !obSkill(this.run, 'spike') && this.map.at(tx, ty) === 'f') return false;
    return _cl.call(this, tx, ty);
  };
  // 互動：狗語、餵鸚鵡
  const _ft = P.findTarget;
  P.findTarget = function () {
    _ft.call(this);
    const O = this.ob, c = this.cat; if (!O || this.mode !== 'play' || c.top || c.jump) return;
    if (O.dog && !O.dog.friend && obSkill(this.run, 'bigdog') && dist(c.x, c.y, O.dog.x, O.dog.y) < 2.2 * TS) { this.target = { kind: 'doglang', ref: { x: O.dog.x, y: O.dog.y } }; UI.setAction('狗語'); return; }
    if (O.parrot && !O.parrot.friend && obSkill(this.run, 'parrot') && c.carry.some(f => f.t === 'sunflower') && dist(c.x, c.y, PARROT.x * TS, (PARROT.y + 0.8) * TS) < 2.4 * TS) { this.target = { kind: 'parrot', ref: { x: PARROT.x * TS, y: PARROT.y * TS } }; UI.setAction('餵葵花子'); }
  };
  const _oa = P.onAction;
  P.onAction = function () {
    const tg = this.target, O = this.ob, c = this.cat;
    if (this.mode === 'play' && tg && tg.kind === 'doglang' && O && O.dog) {
      O.dog.friend = true; SFX.play('heart'); this.fx.hearts(O.dog.x, O.dog.y - 14, 6); this.fx.text(O.dog.x, O.dog.y - 20, '嗚～（搖尾巴）', '#ffb8d0');
      if (this.dog) this.dog.friendT = 999; this.stats.dogTalk = (this.stats.dogTalk || 0) + 1;
      UI.toast('狗語：大狼狗今晚是你的朋友了（小柴今晚也不會叫）', 3000); return;
    }
    if (this.mode === 'play' && tg && tg.kind === 'parrot' && O && O.parrot) {
      const i = c.carry.findIndex(f => f.t === 'sunflower'); if (i < 0) return;
      c.carry.splice(i, 1); O.parrot.friend = true; this.run.flags.parrotFriend = 1;
      SFX.play('heart'); this.fx.hearts(PARROT.x * TS, PARROT.y * TS - 14, 6); this.fx.text(PARROT.x * TS, PARROT.y * TS - 22, '好吃！花喵好！', '#9fe8a8');
      UI.toast('小綠吃了葵花子，以後看到你只會說「好可愛～」', 3200); return;
    }
    return _oa.call(this);
  };
  // 喵波干擾按鈕
  const _csb = P.catSkillButtons;
  P.catSkillButtons = function (sk) {
    _csb.call(this, sk);
    const O = this.ob;
    if (this.mode === 'play' && O && O.drone && obSkill(this.run, 'drone')) sk.push({ id: 'jam', label: '干擾', n: O.jams, on: O.drone.jam > 0, off: O.jams <= 0 });
  };
  const _os = P.onSkill;
  P.onSkill = function (id) {
    const O = this.ob;
    if (id === 'jam' && this.mode === 'play' && O && O.drone) {
      if (O.jams <= 0 || O.drone.jam > 0) { SFX.play('nope'); return; }
      O.jams--; O.drone.jam = 25; O.drone.meter = 0; SFX.tone(900, 0.3, { to: 300, vol: 0.06, type: 'sawtooth' }); this.fx.text(this.cat.x, this.cat.y - 16, '喵～～～（干擾波）', '#c8d0ff');
      return;
    }
    return _os.call(this, id);
  };
  // 小柴：學了狗語、跟大狗做朋友之後也不叫
  // 嗅花第二級（香氣最濃算兩朵）、輕輕叼第二級（每帶回 4 朵多算 1 朵）
  const _dep = P.depositAll;
  P.depositAll = function () {
    const c = this.cat, carried = c.carry.slice(), before = this.deposited.length;
    _dep.call(this);
    if (this.deposited.length === before) return;
    for (const f of carried) if (f.pot && f.pot.fragrant) { this.deposited.push({ t: f.t, fresh: f.fresh, owner: null }); this.fx.text(c.x, c.y - 26, `香氣最濃的${FLOWERS[f.t].name}：算兩朵！`, '#ffd25a', 1.4); }
    if ((this.run.upg.gentle || 0) >= 2) {
      this.gentleN = (this.gentleN || 0) + carried.length;
      while (this.gentleN >= 4) { this.gentleN -= 4; const f = carried[carried.length - 1]; this.deposited.push({ t: f.t, fresh: 1, owner: null }); this.fx.text(c.x, c.y - 34, '花況完美：多算一朵！', '#ffe2ea', 1.3); }
    }
  };
})();
// 小柴不叫（跟大狼狗做朋友的晚上）
{
  const _da = NightScene.prototype.dogAlert;
  NightScene.prototype.dogAlert = function () { if (this.ob && this.ob.dog && this.ob.dog.friend) return; return _da.call(this); };
}
// 夜視第二級：王太太要往窗外看之前，多 0.6 秒的預警
{
  const _wu = WindowWatcher.prototype.update;
  WindowWatcher.prototype.update = function (dt, scene) {
    const was = this.state;
    const r = _wu.call(this, dt, scene);
    if (scene && (scene.run.upg.nightvis || 0) >= 2 && (this.state === 'pre' || this.state === 'wakepre') && was !== this.state) {
      this.t += 0.6;
      const [x, y] = this.eye(); scene.fx.text(x, y - 10, '（窗簾動了）', '#d6ff5c', 1.2);
    }
    return r;
  };
}

// ---------- 新的一個月：新障礙登場 ----------
function* obstStoryScript(S) {
  const run = S.run, f = run.flags;
  for (const o of OBSTACLES) {
    if ((run.month || 1) < o.m || f['ob_' + o.id]) continue;
    f['ob_' + o.id] = 1;
    const wasOn = S.shopOn; S.shopOn = false;
    const who = { ir: 'wang', bigdog: 'bo', laser: 'chief', spray: 'chief', drone: 'chief', parrot: 'wang', motion: 'lin', spike: 'chief' }[o.id];
    const name = { wang: '王太太', bo: '阿伯', chief: '里長', lin: '林先生' }[who];
    const line = {
      ir: ['美玲，我家院子門口裝了紅外線警報喔！最近花一直少，這次一定抓得到！'],
      bigdog: ['空屋被建商買走了，院子裡養了一隻好大的狼狗，晚上都不睡覺的。'],
      laser: ['大宅那邊聽說裝了雷射網，跟電影一樣，連隻蚊子都飛不進去。'],
      spray: ['社區花圃和幾戶人家都裝了驅貓噴水器，貓一靠近就噴，很有效喔！'],
      drone: ['里裡買了一台巡守無人機！晚上會沿著巷子飛，屋頂也照得到。'],
      parrot: ['我養了一隻鸚鵡叫小綠，好聰明，看到貓就會大叫！'],
      motion: ['我們幾戶人家一起裝了感應燈，一有東西經過就亮。'],
      spike: ['年底了，大家決定一起在柵欄上鋪防貓刺墊，看那隻偷花貓還怎麼爬。'],
    }[o.id];
    const h = S.customer(who); yield S.walkIn(h);
    yield* S.talk(h, name, [line]);
    yield S.walkOut(h);
    UI.toast(`新的防貓設施：${o.name}（${o.where}）。老貓攤進貨了專門破解它的「${o.sname}」`, 5000);
    S.shopOn = wasOn;
    return true;
  }
  return false;
}

// ================= 花店：每個月的新問題＋新設備 =================
const EQUIPS = [
  { id: 'aircon', m: 5, name: '冷氣', cost: [60000], spot: [3.2, 3.2], lv: ['夏天熱浪不怕：花不會蔫，客人也待得住（牆上多一台冷氣）'], base: '夏天熱浪：沒冷氣的話，花一下就蔫了，賣價只剩八成', reveal: ['好涼～花也精神起來了！'] },
  { id: 'shutter', m: 6, name: '防颱鐵捲門', cost: [80000], spot: [7.5, 16.4], lv: ['颱風天店照開，大家還會來搶買（門口裝上綠色鐵捲門）'], base: '每個月第三天颱風來：沒鐵捲門的話，店裡三成的花被吹壞、生意只剩一半', reveal: ['颱風來也不怕了！'] },
  { id: 'online', m: 7, name: '網購包裝台', cost: [90000], spot: [12.6, 12.6], lv: ['傍晚賣剩的花放上網，賣價 ×1.1（多一張包裝台和紙箱）'], base: '第七個月起：傍晚剩下的花沒人買，只能打六折出清', reveal: ['網路下單、隔天到貨！'] },
  { id: 'wedding', m: 8, name: '婚禮花藝工作室', cost: [140000], spot: [3.6, 6.4], lv: ['每個月第二天接一場婚禮：用掉店裡 4 朵花，拿一大筆佈置費（牆上掛婚禮拱門）'], base: '第八個月起是婚禮旺季：沒有工作室，婚顧公司上門也只能拒絕', reveal: ['第一場婚禮的拱門！'] },
  { id: 'tourist', m: 9, name: '外語菜單＋打卡牆', cost: [120000], spot: [1.8, 9.6], lv: ['觀光客愛來打卡：客人來得快兩成、口碑每天 +1（多一面花牆）'], base: '第九個月起有觀光客：看不懂菜單就走掉，口碑每天 −1', reveal: ['Welcome！大家都來拍照了！'] },
  { id: 'class2', m: 10, name: '二樓花藝教室', cost: [200000], spot: [13.4, 4.2], lv: ['教室開到二樓：花藝教室的學費 ×2（牆上多一個「2F 教室」樓梯牌）'], base: '第十個月起：報名花藝課的人太多，擠在一樓上課，學費只收到七成', reveal: ['二樓的教室好亮！'] },
  { id: 'heater', m: 11, name: '暖簾暖燈', cost: [160000], spot: [7.5, 15.6], lv: ['寒流來客人照樣上門，還想多坐一下（門口掛上暖簾和暖燈）'], base: '第十一個月起的寒流：沒暖氣的話客人來得很慢', reveal: ['好暖和～'] },
  { id: 'giftbox', m: 12, name: '年節禮盒線', cost: [220000], spot: [10.2, 12.6], lv: ['年節的月份：每筆生意再 ×1.25，還有公司來訂禮盒（櫃台堆滿紅色禮盒）'], base: '年底大家都在找年節禮盒，沒有禮盒線只能看著客人走掉', reveal: ['紅通通的禮盒，好喜氣！'] },
];
for (const e of EQUIPS) STORE_UPGRADES.push({ id: e.id, name: e.name, max: 1, cost: e.cost, mon: [e.m], lv: e.lv, base: e.base, reveal: e.reveal, spot: e.spot });
function eqHas(run, id) { return !!storeOf(run)[id]; }
function typhoonDay(S) { return (S.run.month || 1) >= 6 && S.n === 3; }
{
  const P = DayScene.prototype;
  const _sell = P.sell;
  P.sell = function (v, pot, wrap) {
    const run = this.run, m = run.month || 1;
    if (v > 0) {
      if (m >= 5 && seasonIdx(run) === 1 && !eqHas(run, 'aircon')) v *= 0.8;
      if (typhoonDay(this)) v *= eqHas(run, 'shutter') ? 1.2 : 0.5;
      if (this.closingSale && m >= 7) v *= eqHas(run, 'online') ? 1.1 : 0.6;
      if (newYearMonth(run) && eqHas(run, 'giftbox')) v *= 1.25;
    }
    return _sell.call(this, v, pot, wrap);
  };
  const _cs = P.closeShop;
  P.closeShop = function* () {
    // 傍晚出清：只算最後一次清貨
    const self = this, sell = this.sell;
    this.sell = function (v, pot, wrap) { if (!self.shopOn && !self.shoppers.length) { self.closingSale = true; try { return sell.call(self, v, pot, wrap); } finally { self.closingSale = false; } } return sell.call(self, v, pot, wrap); };
    try { yield* _cs.call(this); } finally { delete this.sell; }
  };
  const _us = P.updateShoppers;
  P.updateShoppers = function (dt) {
    const run = this.run, m = run.month || 1;
    let k = 1;
    if (m >= 9) k *= eqHas(run, 'tourist') ? 1.25 : 0.9;
    if (m >= 11 && seasonIdx(run) === 3) k *= eqHas(run, 'heater') ? 1.1 : 0.65;
    if (k !== 1 && this.shopOn && this.shopT > 0) this.shopT -= dt * (k - 1);
    return _us.call(this, dt);
  };
}
{
  const _ci = classIncome;
  classIncome = function (run) { const v = _ci(run); if (!v || (run.month || 1) < 10) return v; return Math.round(v * (eqHas(run, 'class2') ? 2 : 0.7)); };
}
// 店面的新設備（3D 小模型）
function toonEquip(id) {
  return toonFrameInfo(toonFrame('equip-' + id, 40, 40, () => {
    if (id === 'aircon') { O.blobO([[-14, -30], [14, -30], [14, -20], [-14, -20]], '#f2f2ee'); O.curve([[-11, -22], [11, -22]], '#c8c8c0', 1); O.dot(10, -27, 1, '#4aff8a'); for (let i = 0; i < 3; i++) O.curve([[-8 + i * 7, -18], [-9 + i * 7, -13]], '#bfe8ff', 0.8); }
    else if (id === 'shutter') { O.blobO([[-18, -34], [18, -34], [18, -28], [-18, -28]], '#5a9a6a'); for (let i = 0; i < 3; i++) O.curve([[-17, -32 + i * 1.6], [17, -32 + i * 1.6]], '#3a6a4a', 0.6); }
    else if (id === 'online') { O.blobO([[-14, -14], [14, -14], [14, -10], [-14, -10]], '#b8864a'); for (const [x, y, w] of [[-8, -14, 5], [2, -14, 6], [-3, -20, 5]]) O.blobO([[x - w, y - 6], [x + w, y - 6], [x + w, y], [x - w, y]], '#d8b07a'); O.dot(9, -18, 2, '#ff6a8a'); }
    else if (id === 'wedding') { O.curve([[-14, 0], [-14, -24], [0, -34], [14, -24], [14, 0]], CM.ink, 3); O.curve([[-14, 0], [-14, -24], [0, -34], [14, -24], [14, 0]], '#ffffff', 1.6); for (let i = 0; i < 9; i++) { const a = Math.PI * (1 - i / 8); gFlower(GO, Math.cos(a) * 14, -24 - Math.sin(a) * 10, 1.6, ['#ff9fbb', '#ffffff', '#ffd0e0'][i % 3]); } }
    else if (id === 'tourist') { O.blobO([[-16, -32], [16, -32], [16, -6], [-16, -6]], '#4f8a4c'); for (let i = 0; i < 12; i++) gFlower(GO, -12 + (i % 4) * 8, -28 + Math.floor(i / 4) * 8, 2, ['#ff9fbb', '#ffd84d', '#ffffff', '#c88af0'][i % 4]); O.blobO([[-6, -4], [6, -4], [6, 0], [-6, 0]], '#fff8ec'); }
    else if (id === 'class2') { O.blobO([[-10, -30], [10, -30], [10, -22], [-10, -22]], '#fff8ec'); O.curve([[-7, -26], [7, -26]], '#5a3a2a', 1); for (let i = 0; i < 4; i++) O.blobO([[-10 + i * 5, -2 - i * 4], [-5 + i * 5, -2 - i * 4], [-5 + i * 5, 0 - i * 4], [-10 + i * 5, 0 - i * 4]], '#a87a4a'); }
    else if (id === 'heater') { O.blobO([[-16, -34], [16, -34], [16, -20], [-16, -20]], '#c8343a'); for (const x of [-8, 0, 8]) O.curve([[x, -34], [x, -20]], '#a82430', 0.8); for (const x of [-12, 12]) O.dot(x, -36, 2.4, '#ffb84a'); }
    else if (id === 'giftbox') { for (const [x, y, w] of [[-6, 0, 6], [6, 0, 6], [0, -10, 6]]) { O.blobO([[x - w, y - 9], [x + w, y - 9], [x + w, y], [x - w, y]], '#d8243a'); O.curve([[x, y - 9], [x, y]], '#ffd84d', 1.2); } }
  }), false, 0.5, 0.95);
}
function equipDecor3D(sc, F) {
  const run = sc.run, cpd = Math.cos(R3.pitch);
  for (const e of EQUIPS) {
    if (!eqHas(run, e.id)) continue;
    const lift = { aircon: 1.6, shutter: 1.5, wedding: 0.2, tourist: 0.3, class2: 0.9, heater: 1.6 }[e.id] || 0;
    pushSprite(F.sprites, ART.fix(toonEquip(e.id)), e.spot[0] * TS, e.spot[1] * TS, { lift: lift * cpd, minLight: [0.7, 0.66, 0.62] });
    if (e.id === 'heater') glowQuad(F.glow, e.spot[0], 2.2, e.spot[1], 0.9, [1, 0.6, 0.3, 0.2]);
  }
}
// 白天：颱風、婚禮、觀光客、熱浪
function* equipDayScript(S, n) {
  const run = S.run, m = run.month || 1;
  if (typhoonDay(S) && (run.flags.typhoon || 0) !== m) {
    run.flags.typhoon = m;
    const wasOn = S.shopOn; S.shopOn = false;
    UI.banner('颱風天');
    if (eqHas(run, 'shutter')) { yield S.say('颱風來了！還好有鐵捲門……大家都跑來買花放家裡。'); }
    else {
      const k = Math.floor(S.stock.length * 0.3); S.stock.splice(0, k);
      yield S.say(`颱風把店裡的花吹壞了${k ? ' ' + k + ' 朵' : ''}……今天生意也只剩一半了。`);
      UI.toast('沒有防颱鐵捲門：颱風天三成的花被吹壞、生意只剩一半', 3600);
    }
    UI.hideDialog(); S.shopOn = wasOn;
  }
  if (m >= 8 && n === 2 && (run.flags.wedding || 0) !== m) {
    run.flags.wedding = m;
    const wasOn = S.shopOn; S.shopOn = false;
    const c = S.customer('shopB'); yield S.walkIn(c);
    if (eqHas(run, 'wedding')) {
      yield* S.talk(c, '婚顧公司', [['美玲小姐，這週末的婚禮佈置就麻煩妳了！']]);
      const use = Math.min(4, S.stock.length); S.stock.splice(0, use);
      const pay = 25000 + (m - 8) * 6000 + use * 2000; run.money += pay; S.daySales += pay; SFX.play('coin');
      UI.toast(`婚禮佈置完成！用了店裡 ${use} 朵花，佈置費 ${money(pay)}`, 3600);
    } else {
      yield* S.talk(c, '婚顧公司', [['請問可以接婚禮佈置嗎？'], ['……沒有工作室啊，那我們再找找別家好了。']]);
      UI.toast('婚禮旺季：花店升級的「婚禮花藝工作室」可以接婚禮（一場好幾萬）', 3600);
    }
    yield S.walkOut(c); S.shopOn = wasOn;
  }
  if (m >= 5 && seasonIdx(run) === 1 && !eqHas(run, 'aircon') && n === 2 && (run.flags.heatwave || 0) !== m) { run.flags.heatwave = m; UI.toast('熱浪來了：店裡好熱，花都蔫了（賣價八成）。花店升級的「冷氣」可以解決', 3800); }
  if (m >= 9 && n === 2 && !eqHas(run, 'tourist') && (run.flags.tourist || 0) !== m) { run.flags.tourist = m; UI.toast('觀光客看不懂菜單就走了……（口碑每天 −1）', 3200); }
}
// 口碑：觀光客
{
  const _rd = repDayEnd;
  repDayEnd = function (S) {
    const r = _rd(S); if (!r) return r;
    const run = S.run;
    if ((run.month || 1) >= 9) { const d = eqHas(run, 'tourist') ? 1 : -1; repOf(run).xp = Math.max(0, repOf(run).xp + d); r.delta += d; r.parts.push([d, eqHas(run, 'tourist') ? '觀光客打卡' : '觀光客看不懂菜單']); }
    return r;
  };
}
// 老貓攤：物價會漲；破解技能另外一組顯示
function obstShopNote(run) {
  const m = run.month || 1, next = OBSTACLES.find(o => o.m > m);
  return `<p class="hint">物價：本事開放之後每個月漲一成，越早買越便宜。${next ? `第${cn(next.m)}個月巷子會出現「${next.name}」。` : ''}</p>`;
}
