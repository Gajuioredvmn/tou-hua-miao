// ================= 夜晚的新東西：新技能＋每晚的隨機事件 =================
// 技能：貓步（走路比較不會被發現）、夜視（隔著房子看得到人）、嗅花（畫面邊緣指出花在哪）、罐罐收買（狗要叫時丟罐罐）
// 事件（第二晚起每晚一個，不重複）：垃圾車、流星雨、廟會遶境、颱風前夕、野狗

const NIGHT_EVENTS = {
  truck: { name: '垃圾車', desc: '「少女的祈禱」響起，垃圾車會開過巷子。鄰居跑出來倒垃圾，家裡就沒人顧；音樂很大聲，腳步聲傳不遠。', when: true },
  meteor: { name: '流星雨', desc: '有一陣子大家都會抬頭看天空，誰都不會注意地上的貓。站著不動還能許個願。', when: true },
  temple: { name: '廟會遶境', desc: '遶境隊伍會從巷子走過去，鞭炮聲蓋過所有聲音，小柴嚇得躲起來。別擋在隊伍前面。', when: true },
  typhoon: { name: '颱風前夕', desc: '風很大：好幾家把盆栽收進屋裡了，風聲蓋過腳步聲，大家瞇著眼睛看得比較近。強風一陣一陣的，會把你吹偏。', when: false },
  stray: { name: '野狗', desc: '一隻野狗在巷子裡晃。被牠看到會一直叫，把人引過來。', when: true },
};
// 這一晚的事件（第二晚起，整局不重複）；時間也先決定好，簡報上看得到
function nightEventFor(run, n) {
  const E = run.nightEvents || (run.nightEvents = {});
  const key = (run.month || 1) > 1 ? (run.month + '-' + n) : n;
  if (E[key] !== undefined) return E[key];
  // 稀有的夜晚
  const rare = rollRare(run, n);
  if (rare) {
    const id = rare === 'storm' ? 'typhoon' : rare;
    const t0 = rare === 'meteor' ? rnd(1420, 1520) : NIGHT_START;
    return (E[key] = { id, t0: Math.round(t0), rare });
  }
  if (n < 2) return (E[key] = null);
  const used = Object.values(E).filter(Boolean).map(e => e.id);
  const pool = Object.keys(NIGHT_EVENTS).filter(k => !used.includes(k));
  if (!pool.length) return (E[key] = null);
  const id = pool[Math.floor(Math.random() * pool.length)];
  const t0 = { truck: rnd(1395, 1435), meteor: rnd(1420, 1520), temple: rnd(1385, 1425), typhoon: NIGHT_START, stray: rnd(1380, 1410) }[id];
  return (E[key] = { id, t0: Math.round(t0) });
}

// ---------- 開始 ----------
function initNightPlus(sc) {
  const run = sc.run, up = run.upg;
  sc.lv = { catwalk: up.catwalk || 0, nightvis: up.nightvis || 0, sniff: itemActive(sc.run, 'map') ? 2 : (up.sniff || 0), bribe: up.bribe || 0 };
  const ev = nightEventFor(run, sc.n);
  sc.nev = ev ? { id: ev.id, t0: ev.t0, phase: 'wait', t: 0, rare: ev.rare } : null;
  sc.lookUp = false; sc.wished = false;
  if (!ev) return;
  if (ev.id === 'typhoon') {
    sc.visMult *= 0.85;
    // 盆栽收進屋裡：地面上、不是大宅的，三成多
    const R = rng(sc.n * 31 + 7);
    for (const p of sc.pots) if (!p.top && p.owner !== 'mansion' && p.avail && p.t !== 'tanhua' && R() < 0.38) { p.gone = true; p.avail = false; sc.blocked.delete(p.tx + ',' + p.ty); }
    sc.nev.phase = 'on'; sc.nev.gustT = 4; sc.nev.gust = 0; sc.nev.leaves = [];
    setTimeout(() => { if (G.scene === sc) UI.toast('颱風前夕：風好大，好幾家把盆栽收進屋裡了', 3400); }, 4200);
  }
  initRare(sc);
  if (ev.id === 'stray') {
    sc.stray = new Dog(7.5 * TS, 40 * TS); sc.stray.state = 'roam'; sc.stray.hidden = true; sc.stray.stray = true; sc.stray.wait = 0; sc.stray.tx = null;
  }
}

// ---------- 每一格 ----------
function updateNightPlus(sc, dt, realDt) {
  const E = sc.nev, c = sc.cat;
  if (realDt > 0 && sc.lv.sniff && !sc.tips.sniff) { sc.tips.sniff = 1; setTimeout(() => { if (G.scene === sc && sc.mode === 'play') UI.toast('嗅花：畫面邊緣的小花指著最近的盆栽', 2800); }, 1500); }
  if (!E) return;
  updateRare(sc, dt);
  const t = sc.time;
  if (E.id === 'truck') updateTruck(sc, E, dt, realDt);
  else if (E.id === 'meteor') updateMeteor(sc, E, dt, realDt);
  else if (E.id === 'temple') updateTemple(sc, E, dt, realDt);
  else if (E.id === 'typhoon') updateTyphoon(sc, E, dt, realDt);
  else if (E.id === 'stray') updateStray(sc, E, dt, realDt);
}
// 聲音被蓋掉：回傳倍率
function noiseMulPlus(sc, x, y) {
  const E = sc.nev; if (!E) return 1;
  if (E.id === 'typhoon') return 0.6;
  if (E.id === 'truck' && E.phase === 'on') return 0.5;
  if (E.id === 'temple' && E.phase === 'on' && dist(x, y, 7.5 * TS, E.y * TS) < 12 * TS) return 0.3;
  return 1;
}

// ---- 垃圾車 ----
const TRUCK_STOPS = [{ y: 20.6, who: 'wang', x: 6.25, face: 0 }, { y: 32.4, who: 'bo' }];
function updateTruck(sc, E, dt, realDt) {
  if (E.phase === 'wait') {
    if (sc.time >= E.t0) {
      E.phase = 'on'; E.y = 3.2; E.stop = -1; E.stopT = 0; E.noteT = 0; E.mi = 0; E.notes = [];
      UI.toast('♪ 少女的祈禱……垃圾車來了！鄰居要出來倒垃圾', 3200);
    }
    return;
  }
  if (E.phase !== 'on') return;
  // 停下來收垃圾
  const next = TRUCK_STOPS.findIndex((s, i) => i > E.stop && E.y < s.y + 0.01);
  if (E.stopT > 0) {
    E.stopT -= dt;
    if (E.stopT <= 0) truckLeave(sc, E);
  } else {
    E.y += dt * 0.62;
    const s = TRUCK_STOPS.findIndex((st, i) => i > E.stop && E.y >= st.y);
    if (s >= 0) { E.stop = s; E.stopT = 9; truckStop(sc, E, TRUCK_STOPS[s]); }
  }
  // 音樂（每半秒一個音）
  if (realDt > 0) {
    E.noteT -= realDt;
    if (E.noteT <= 0) {
      const MEL = [659, 622, 659, 622, 659, 494, 587, 523, 440, 0, 262, 330, 440, 494, 0, 330, 415, 494, 523];
      const f = MEL[E.mi++ % MEL.length]; E.noteT = 0.26;
      const near = Math.abs(sc.cat.y / TS - E.y) < 9;
      if (f && near) SFX.tone(f, 0.22, { vol: 0.05, type: 'triangle' });
      if (f) E.notes.push({ x: 7.5 + rnd(-0.6, 0.6), y: E.y, h: 1.6, t: 0 });
    }
    for (const n of E.notes) n.t += realDt; E.notes = E.notes.filter(n => n.t < 1.6);
  }
  if (E.y > 43) { E.phase = 'done'; truckLeave(sc, E); }
}
function truckStop(sc, E, s) {
  if (s.who === 'wang' && sc.event !== 'bbq' && sc.wang.state !== 'away') {
    E.wangPrev = sc.wang.state; sc.wang.state = 'away';
    const w = new PartyWatcher('wang', s.x * TS, 21.75 * TS, 0, Math.PI / 2, 2.2);
    w.range = 3.6 * TS; w.cuteKey = 'wang'; w.setEmote('dots', 1.2); E.wang = w;
    sc.party.push(w); sc.viewers.push(w);
    if (Cam.visible(w.x, w.y, 80)) UI.toast('王太太拎著垃圾出來了！窗邊沒人', 2400);
  }
  if (s.who === 'bo' && sc.bo.active() && sc.boTea !== 1) {
    E.bo = true; sc.bo.state = 'idle'; sc.bo.path = []; sc.bo.x = 10.4 * TS; sc.bo.y = 33.2 * TS; sc.bo.ang = Math.PI; sc.bo.dir = 'left'; sc.bo.setEmote('dots', 1.2);
  }
}
function truckLeave(sc, E) {
  if (E.wang) {
    sc.party = sc.party.filter(p => p !== E.wang); sc.viewers = sc.viewers.filter(v => v !== E.wang);
    sc.wang.state = E.wangPrev === 'look' || E.wangPrev === 'pre' ? 'tv' : (E.wangPrev || 'tv'); if (sc.time >= 1440) sc.wang.state = 'sleep';
    E.wang = null;
  }
  if (E.bo) { E.bo = false; if (sc.bo.state === 'idle') sc.bo.resume(); }
}

// ---- 流星雨 ----
function updateMeteor(sc, E, dt, realDt) {
  if (E.phase === 'wait') {
    if (sc.time >= E.t0) { E.phase = 'on'; E.t = 0; E.streaks = []; UI.toast('流星雨！大家都抬頭看天空', 2800); SFX.tone(1568, 0.3, { vol: 0.06, type: 'sine' }); }
    return;
  }
  if (E.phase !== 'on') return;
  if (realDt <= 0) return;
  E.t += realDt;
  const look = E.t > 1.2 && E.t < 21;
  if (look !== sc.lookUp) {
    sc.lookUp = look;
    for (const n of [sc.lin, sc.bo, sc.patrol, sc.butler, ...sc.party]) if (n && !n.hidden) {
      if (look) { n.skyPrev = n.state; if (n.state !== 'inside' && n.state !== 'gohome') { n.state = n.type === 'party' ? n.state : 'idle'; n.path = n.type === 'party' ? n.path : []; } n.setEmote('ex', 1); n.susp = 0; }
      else if (n.type !== 'party' && n.state === 'idle' && n.skyPrev !== 'idle') n.resume();
    }
    if (!look) UI.toast('流星雨結束了', 1800);
  }
  if (look) for (const n of [sc.lin, sc.bo, sc.patrol, sc.butler, ...sc.party]) if (n && !n.hidden && n.state !== 'inside') { n.dir = 'up'; n.ang = -Math.PI / 2; n.moving = false; n.susp = Math.max(0, n.susp - realDt); }
  // 許願：站著不動
  if (look && !sc.wished && !sc.cat.moving && !sc.cat.top && E.t > 3) {
    sc.wishT = (sc.wishT || 0) + realDt;
    if (sc.wishT > 2.2) { sc.wished = true; sc.run.cans += 3; sc.fx.text(sc.cat.x, sc.cat.y - 18, '許願成功 +3 罐罐', '#ffe27a'); SFX.play('heart'); }
  } else if (sc.cat.moving) sc.wishT = 0;
  E.spawn = (E.spawn || 0) - realDt;
  if (E.t < 22 && E.spawn <= 0) { E.spawn = rnd(0.15, 0.5); E.streaks.push({ x: rnd(0.1, 1.1), y: rnd(0.02, 0.32), t: 0, l: rnd(0.5, 0.9), s: rnd(0.8, 1.4) }); }
  for (const s of E.streaks) s.t += realDt; E.streaks = E.streaks.filter(s => s.t < s.l);
  if (E.t > 23) { E.phase = 'done'; sc.lookUp = false; }
}

// ---- 廟會遶境 ----
class Marcher extends PartyWatcher {
  constructor(key, ox, oy, role) { super(key, 7.5 * TS + ox, oy * TS, Math.PI / 2, ox < 0 ? Math.PI : 0, rnd(2, 5)); this.ox = ox; this.role = role; this.range = 3.4 * TS; this.half = 0.5; this.state = 'chat'; this.cuteKey = 'temple'; }
  active() { return !this.hidden && this.state !== 'pet'; }
  march(y) { this.x = 7.5 * TS + this.ox; this.y = (y + this.oy) * TS; this.moving = true; }
}
function updateTemple(sc, E, dt, realDt) {
  if (E.phase === 'wait') {
    if (sc.time >= E.t0) {
      E.phase = 'on'; E.y = 3.4; E.fx = [];
      E.members = [['shopB', -0.7, 1.2, 'flag'], ['shopD', 0.7, 1.2, 'flag'], ['chief', 0, 0, 'drum'], ['shopA', -0.55, -1.1, 'chair'], ['shopC', 0.55, -1.1, 'chair']].map(([k, ox, oy, role]) => { const m = new Marcher(k, ox * TS, E.y + oy, role); m.oy = oy; return m; });
      for (const m of E.members) { sc.party.push(m); sc.viewers.push(m); }
      UI.toast('咚咚鏘！遶境隊伍來了，別擋在隊伍前面', 3000);
    }
    return;
  }
  if (E.phase !== 'on') return;
  E.y += dt * 0.5;
  for (const m of E.members) { m.march(E.y); if (m.state === 'chat') { m.base = Math.PI / 2 + Math.sin(sc.time * 0.4 + m.ox) * 0.3; } }
  // 小柴嚇得躲起來
  const d = sc.dog;
  if (Math.abs(d.y / TS - E.y) < 12 && d.state !== 'gone') { if (!d.hideP) { d.hideP = true; d.charmT = Math.max(d.charmT || 0, 3); } d.charmT = Math.max(d.charmT, 0.5); }
  if (realDt > 0) {
    E.boomT = (E.boomT || 0) - realDt;
    if (E.boomT <= 0) {
      E.boomT = rnd(0.35, 0.9);
      E.fx.push({ x: 7.5 + rnd(-1.2, 1.2), y: E.y + 2 + rnd(0, 1.5), t: 0 });
      if (Math.abs(sc.cat.y / TS - E.y) < 10) { SFX.noise(0.08, { vol: 0.12, freq: 2400 }); }
    }
    E.drumT = (E.drumT || 0) - realDt;
    if (E.drumT <= 0) { E.drumT = 0.42; if (Math.abs(sc.cat.y / TS - E.y) < 10) SFX.tone(110, 0.12, { vol: 0.12, type: 'sine' }); }
    for (const f of E.fx) f.t += realDt; E.fx = E.fx.filter(f => f.t < 0.6);
  }
  if (E.y > 43) {
    E.phase = 'done';
    for (const m of E.members) { sc.party = sc.party.filter(p => p !== m); sc.viewers = sc.viewers.filter(v => v !== m); }
    E.members = []; if (sc.dog.hideP) sc.dog.hideP = false;
  }
}

// ---- 颱風前夕 ----
function updateTyphoon(sc, E, dt, realDt) {
  if (realDt <= 0) return;
  const c = sc.cat;
  E.gustT -= realDt;
  if (E.gustT <= 0) { E.gustT = rnd(5.5, 9); E.gust = 1.6; E.gdir = Math.random() < 0.5 ? -1 : 1; SFX.noise(0.9, { vol: 0.08, freq: 500 }); }
  if (E.gust > 0) {
    E.gust -= realDt;
    const k = Math.sin(Math.min(1, E.gust / 1.6) * Math.PI);
    // 被風吹偏（躲在草叢、紙箱、屋頂上不會）
    if (!c.hidden && !c.box && !c.home && !c.jump && sc.mode === 'play') {
      const nx = c.x + E.gdir * 9 * k * realDt;
      if (!c.hits(sc, nx, c.y)) c.x = nx;
    }
  }
  E.leafT = (E.leafT || 0) - realDt;
  if (E.leafT <= 0) { E.leafT = E.gust > 0 ? 0.05 : 0.25; E.leaves.push({ x: rnd(-0.1, 1.1), y: rnd(0, 1), t: 0, r: rnd(0, 6), s: rnd(0.7, 1.3), c: Math.random() < 0.5 ? '#7cae52' : '#c4893c' }); }
  for (const l of E.leaves) l.t += realDt; E.leaves = E.leaves.filter(l => l.t < 2.2);
}

// ---- 野狗 ----
function updateStray(sc, E, dt, realDt) {
  const d = sc.stray; if (!d) return;
  if (E.phase === 'wait') { if (sc.time >= E.t0) { E.phase = 'on'; d.hidden = false; d.x = 7.6 * TS; d.y = 40.5 * TS; UI.toast('巷子裡有野狗在晃，小心別被牠看到', 2800); } return; }
  if (E.phase !== 'on' || realDt <= 0) return;
  const c = sc.cat; d.update(realDt);
  if (d.friendT > 0) {
    // 吃了罐罐：跟在你後面一陣子
    d.friendT -= realDt;
    const tx = c.x + (c.dir === 'left' ? 10 : -10), ty = c.y + 2, dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy);
    d.moving = dd > 6; if (dd > 6 && !c.top) { d.x += dx / dd * Math.min(dd, 34 * realDt); d.y += dy / dd * Math.min(dd, 34 * realDt); d.dir = dx < 0 ? 'left' : 'right'; }
    if (d.friendT <= 0) { d.state = 'roam'; d.emote = 'heart'; d.emoteT = 1; }
    return;
  }
  const see = !c.top && !c.hidden && !(c.box && !c.moving) && !c.home && dist(d.x, d.y, c.x, c.y) < 3.2 * TS && lineOfSight(sc.map, d.x, d.y - 4, c.x, c.y - 4, sc.occ);
  if (d.state === 'chase') {
    d.chaseT -= realDt;
    const dx = c.x - d.x, dy = c.y - d.y, dd = Math.hypot(dx, dy) || 1;
    if (!c.top && !c.hidden) { const st = 44 * realDt; const nx = d.x + dx / dd * st, ny = d.y + dy / dd * st; if (!sc.npcSolid(nx, ny)) { d.x = nx; d.y = ny; } d.moving = true; d.dir = dx < 0 ? 'left' : 'right'; }
    d.barkLoop = (d.barkLoop || 0) - realDt;
    if (d.barkLoop <= 0) { d.barkLoop = 0.9; d.barkT = 0.6; sc.sfxNear(d.x, d.y, 'bark'); sc.noise(d.x, d.y, 5 * TS, 'obj'); }
    if (dd < 7 && c.inv <= 0 && sc.mode === 'play') {
      // 被撲到：嚇一跳，嘴裡的花掉一點花瓣
      c.inv = 1.4; sc.fx.text(c.x, c.y - 16, '嚇！', '#ff9a7a'); SFX.play('nope');
      for (const f of c.carry) f.fresh = Math.max(0.4, f.fresh - 0.1);
      d.chaseT = 0;
    }
    if (d.chaseT <= 0 || c.top || c.hidden) { d.state = 'roam'; d.cool = 5; d.emote = 'q'; d.emoteT = 1; }
    return;
  }
  if (see && d.cool <= 0 && sc.mode === 'play') {
    // 收買得到（罐罐收買 Lv2）就丟罐罐
    if (sc.lv.bribe >= 2 && sc.run.cans > 0) { bribeDog(sc, d); return; }
    d.state = 'chase'; d.chaseT = 3.2; d.barkLoop = 0; d.emote = 'ex'; d.emoteT = 1.2;
    if (!sc.tips.stray) { sc.tips.stray = 1; UI.toast('野狗追過來了！跳上屋頂或躲進草叢甩掉牠', 2800); }
    return;
  }
  d.cool = Math.max(0, d.cool - realDt);
  // 閒晃
  if (!d.tx || dist(d.x, d.y, d.tx[0], d.tx[1]) < 3) {
    d.wait -= realDt; d.moving = false;
    if (d.wait <= 0) { d.wait = rnd(1.5, 4); d.tx = [rnd(6.2, 8.8) * TS, rnd(6.5, 41) * TS]; }
  } else {
    const dx = d.tx[0] - d.x, dy = d.tx[1] - d.y, dd = Math.hypot(dx, dy), st = 18 * realDt;
    d.x += dx / dd * Math.min(st, dd); d.y += dy / dd * Math.min(st, dd); d.moving = true; d.dir = dx < 0 ? 'left' : 'right';
  }
}

// ---------- 技能 ----------
// 罐罐收買：丟一個罐罐，狗安靜一陣子
function bribeDog(sc, d) {
  const lv = sc.lv.bribe;
  sc.run.cans = Math.max(0, sc.run.cans - 1);
  const T = lv >= 2 ? 30 : 18;
  if (d.stray) { d.friendT = T * 0.6; d.state = 'friend'; d.cool = T; }
  else { d.charmT = T; d.cool = T; d.barkT = 0; }
  d.canT = 2.4; d.emote = 'heart'; d.emoteT = 1.6;
  sc.fx.text(d.x, d.y - 16, '罐罐！', '#ffd25a'); SFX.play('pick'); setTimeout(() => SFX.play('purr'), 200);
  if (!sc.tips.bribe) { sc.tips.bribe = 1; UI.toast(`丟了一個罐罐，${d.stray ? '野狗' : '小柴'}吃得好開心（安靜 ${T} 秒）`, 2600); }
}
// 偵測速度的修正：貓步、夜視
function detectMulPlus(sc, lit) {
  const c = sc.cat; let k = 1;
  if (c.moving && !c.running && sc.lv.catwalk) k *= [1, 0.7, 0.5][sc.lv.catwalk];
  if (!lit && sc.lv.nightvis >= 2) k *= 0.75;
  if (c.shadow) k *= lit ? 0.4 : 0.08;
  if (hasSet(sc.run, 'thief')) k *= 0.88;
  return k;
}
// 嗅花：最近的幾盆花
function sniffTargets(sc) {
  const c = sc.cat, out = [];
  for (const p of sc.pots) { if (!p.avail || p.gone) continue; out.push({ p, d: dist(c.x, c.y, p.x, p.y) }); }
  out.sort((a, b) => a.d - b.d);
  const want = new Set((sc.orders || []).map(o => o.t));
  return out.slice(0, 3).map(o => ({ p: o.p, d: o.d, order: want.has(o.p.t) }));
}
function drawSniffOverlay(sc, g, W, H, at, t) {
  if (!sc.lv.sniff || sc.mode !== 'play') return;
  for (const s of sniffTargets(sc)) {
    const p = s.p, [sx, sy] = at(p);
    const m = 30, onScr = sx > m && sx < W - m && sy > 90 && sy < H - 120;
    const icon = G.icons[p.t], img = sniffImg(icon);
    if (onScr) {
      if (s.d < 2 * TS) continue;
      const bob = Math.sin(t * 4 + p.x) * 3;
      if (img && img.complete) g.drawImage(img, sx - 9, sy - 34 + bob, 18, 21);
      if (sc.lv.sniff >= 2) CM.text(g, sx, sy - 40 + bob, (s.order ? '訂單 ' : '') + Math.round(flowerValue(sc.run, p.t, 1)), s.order ? '#ff9fbb' : '#ffe27a', 11, 0.95);
    } else {
      const cx = W / 2, cy = H / 2, a = Math.atan2(sy - cy, sx - cx);
      const k = Math.min((W / 2 - m) / Math.abs(Math.cos(a) || 1e-3), (H / 2 - 110) / Math.abs(Math.sin(a) || 1e-3));
      const ex = cx + Math.cos(a) * k, ey = cy + Math.sin(a) * k;
      g.save(); g.translate(ex, ey);
      g.fillStyle = s.order && sc.lv.sniff >= 2 ? 'rgba(255,134,168,0.92)' : 'rgba(255,246,232,0.9)'; g.strokeStyle = CM.ink; g.lineWidth = 2.5;
      g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); g.stroke();
      g.rotate(a); g.beginPath(); g.moveTo(19, 0); g.lineTo(12, -6); g.lineTo(12, 6); g.closePath(); g.fillStyle = CM.ink; g.fill(); g.rotate(-a);
      if (img && img.complete) g.drawImage(img, -8, -10, 16, 19);
      if (sc.lv.sniff >= 2) CM.text(g, 0, 22, String(Math.round(flowerValue(sc.run, p.t, 1))), '#ffe27a', 10, 0.95);
      g.restore();
    }
  }
}
const SNIFF_IMG = {};
function sniffImg(src) { if (!src) return null; if (!SNIFF_IMG[src]) { const im = new Image(); im.src = src; SNIFF_IMG[src] = im; } return SNIFF_IMG[src]; }

// ---------- 畫面：3D ----------
// 垃圾車、遶境的轎子和旗子、野狗
function drawTruck() {
  // 車頭朝下（鏡頭這邊），看到的是側前方
  O.blobO([[-14, -2], [-14, -24], [8, -24], [10, -2]], '#f2c230', { part: 40 });
  O.e(4, -10, 7, 12, '#d9a420', { only: 40 });
  for (let i = 0; i < 3; i++) O.p([[-12 + i * 7, -21], [-7 + i * 7, -21], [-7 + i * 7, -6], [-12 + i * 7, -6]], 'rgba(0,0,0,0.12)', { only: 40 });
  O.limb(-14, -14, 10, -14, 2.2, '#3f9a5a', { noOutline: true, only: 40 });
  O.blobO([[8, -2], [8, -18], [15, -18], [18, -11], [18, -2]], '#f6d250');
  O.blobO([[9.5, -16.5], [14.5, -16.5], [16.6, -11.5], [9.5, -11.5]], '#9fd4e8');
  for (const x of [-9, 12]) { O.eo(x, -1.5, 3.6, 3.6, '#2a2a36'); O.e(x, -1.5, 1.5, 1.5, '#b8bcc8'); }
  O.eo(17.4, -5, 1.4, 1.2, '#fff6c0');
  O.blobO([[-6, -27.5], [2, -27.5], [2, -24], [-6, -24]], '#ff9a2b'); O.dot(-2, -26, 1, '#ffe08a');
}
function toonTruck() { return toonFrameInfo(toonFrame('ev-truck', 40, 32, drawTruck), false, 0.5, 1.15); }
function drawPalanquin() {
  O.limb(-15, -12, 15, -12, 1.6, '#8a5a2a');
  O.blobO([[-7, -12], [7, -12], [6, -26], [-6, -26]], '#c8302a');
  O.blobO([[-8.5, -26], [8.5, -26], [0, -32]], '#e8b84a');
  O.blobO([[-4, -24], [4, -24], [4, -15], [-4, -15]], '#f6d27a');
  O.dot(0, -33, 1.4, '#ffd84d');
  for (const x of [-7, 7]) O.curve([[x, -12], [x, -5]], '#e8b84a', 1.2);
}
function toonPalanquin() { return toonFrameInfo(toonFrame('ev-chair', 34, 36, drawPalanquin), false, 0.5, 1); }
function drawFlag(k) {
  O.limb(0, 0, 0, -30, 1.2, '#6a4a2a');
  O.blobO([[0.5, -30], [11, -26], [0.5, -20]], k ? '#e8b84a' : '#c8302a');
  O.curve([[2, -26], [7, -25.5]], k ? '#c8302a' : '#ffd84d', 0.8);
}
function toonFlag(k) { return toonFrameInfo(toonFrame('ev-flag-' + k, 16, 32, () => drawFlag(k)), false, 0.3, 1); }
const STRAY_PAL = { fur: '#8a7a68', furD: '#5e5248', cream: '#d8cfc0', nose: '#2a1d22' };
function toonStray(d) {
  const keep = Object.assign({}, SHIBA); Object.assign(SHIBA, STRAY_PAL); const old = TOON_PREFIX; TOON_PREFIX = 'stray-';
  try { return toonDog(d); } finally { Object.assign(SHIBA, keep); TOON_PREFIX = old; }
}
function nightPlusLights(sc, L) {
  const E = sc.nev; if (!E) return;
  if (E.id === 'truck' && E.phase === 'on') {
    const bl = Math.floor(sc.cat.t * 4) % 2;
    L.push({ x: 7.5, y: 1.2, z: E.y + 0.9, r: 4.5, c: [1.2, 1.1, 0.8], pri: 3 });
    if (bl) L.push({ x: 7.5, y: 2.2, z: E.y, r: 3.2, c: [1.3, 0.6, 0.15], pri: 2 });
  }
  if (E.id === 'temple' && E.phase === 'on') L.push({ x: 7.5, y: 1.5, z: E.y, r: 4.6, c: [1.3, 0.55, 0.3], pri: 3 });
}
function nightPlus3D(sc, F) {
  const E = sc.nev, cp = Math.cos(R3.pitch), vt = sc.cat.t;
  // 夜視：隔著房子也看得到人（紅色剪影）
  if (sc.lv.nightvis) for (const s of F.sprites) if (s.npc) { s.sil = [1, 0.45, 0.45, 0.55]; F.sil.push(s); }
  // 被罐罐收買的狗：旁邊有個罐罐
  for (const d of [sc.dog, sc.stray]) if (d && d.canT > 0) { d.canT -= R3.dt; pushSprite(F.sprites, ART.fix(toonFrameInfo(toonFrame('icon-can', 20, 15, drawCanIcon), false, 0.5, 0.55)), d.x + (d.dir === 'left' ? -6 : 6), d.y + 1); }
  if (!E) return;
  if (E.id === 'truck' && E.phase === 'on') {
    pushSprite(F.sprites, toonTruck(), 7.5 * TS, (E.y + 0.6) * TS, { minLight: [0.45, 0.42, 0.4] }); shadowAt(F, 7.5 * TS, (E.y + 0.6) * TS, 1.6, 0.5);
    if (Math.floor(vt * 4) % 2) glowQuad(F.glow, 7.4, 1.35, E.y + 0.3, 0.5, [1, 0.6, 0.15, 0.7]);
    for (const n of E.notes) { const k = n.t / 1.6; glowQuad(F.glow, n.x + Math.sin(n.t * 4) * 0.2, n.h + k * 1.2, n.y, 0.08, [1, 0.95, 0.7, 0.8 * (1 - k)]); }
  }
  if (E.id === 'temple' && E.phase === 'on') {
    for (const m of E.members) {
      if (m.role === 'flag') pushSprite(F.sprites, ART.fix(toonFlag(m.ox > 0 ? 1 : 0)), m.x + (m.ox > 0 ? 3 : -3), m.y + 0.6, { lift: 0.45, minLight: [0.4, 0.36, 0.36] });
    }
    pushSprite(F.sprites, ART.fix(toonPalanquin()), 7.5 * TS, (E.y - 1.05) * TS, { lift: 0.5, minLight: [0.45, 0.4, 0.38] });
    for (const f of E.fx) { const k = f.t / 0.6; for (let i = 0; i < 4; i++) glowQuad(F.glow, f.x + Math.cos(i * 1.7 + f.t * 9) * k * 0.6, 0.2 + k * 0.6, f.y, 0.12 * (1 - k) + 0.04, [1, 0.7 + 0.3 * (i % 2), 0.3, 0.9 * (1 - k)]); }
  }
  if (E.id === 'stray' && sc.stray && !sc.stray.hidden) {
    const d = sc.stray, jump = d.barkT > 0 ? Math.abs(Math.sin(d.t * 18)) * 0.12 : 0;
    pushSprite(F.sprites, toonStray(d), d.x, d.y + 0.5, { lift: jump, minLight: [0.26, 0.24, 0.28] }); shadowAt(F, d.x, d.y + 0.5, 0.75, 0.28);
  }
}
function nightPlusOverlay(sc, g, W, H, sc2) {
  const E = sc.nev, vt = sc.cat.t;
  drawSniffOverlay(sc, g, W, H, p => R3.at(p.x, p.y + 0.5, 0.9 + (p.top ? sc.topH(p.x, p.y - 2) * Math.cos(R3.pitch) : 0)), vt);
  if (sc.stray && !sc.stray.hidden && sc.stray.emote) { const [sx, sy] = R3.at(sc.stray.x, sc.stray.y + 0.5, 1.0); CM.emote(g, sx, sy, sc.stray.emote, sc2); }
  if (!E) return;
  if (E.id === 'meteor' && E.phase === 'on') {
    // 流星：天空（畫面上半部）
    g.save();
    for (const s of E.streaks) {
      const k = s.t / s.l, x = (s.x - k * 0.45 * s.s) * W, y = (s.y + k * 0.22 * s.s) * H, len = 60 * s.s;
      const gr = g.createLinearGradient(x, y, x + len, y - len * 0.48); gr.addColorStop(0, `rgba(255,250,220,${0.95 * (1 - k)})`); gr.addColorStop(1, 'rgba(255,250,220,0)');
      g.strokeStyle = gr; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y - len * 0.48); g.stroke();
      g.fillStyle = `rgba(255,255,240,${1 - k})`; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill();
    }
    g.restore();
    if (sc.lookUp && !sc.wished && E.t > 3) CM.text(g, W / 2, 128, '站著不動，許個願吧', '#ffe9a8', 15, 0.85);
  }
  if (E.id === 'temple' && E.phase === 'on') {
    for (const f of E.fx) if (f.t < 0.3) { const [sx, sy] = R3.at(f.x * TS, f.y * TS, 0.6); if (Math.random() < 0.3) CM.text(g, sx, sy - 10, pick(['劈哩啪啦', '砰！', '啪！']), '#ffcf5a', 13, 1 - f.t / 0.3, { rot: rnd(-0.2, 0.2) }); }
  }
  if (E.id === 'typhoon') {
    // 風、樹葉
    g.save();
    const gust = Math.max(0, E.gust || 0) / 1.6;
    g.strokeStyle = `rgba(220,230,255,${0.12 + 0.25 * gust})`; g.lineWidth = 1.4; g.beginPath();
    for (let i = 0; i < 26; i++) { const y = ((i * 0.137 + vt * 0.05) % 1) * H, x = ((i * 0.31 + vt * (0.9 + gust * 1.5) * (E.gdir || 1)) % 1 + 1) % 1 * W; g.moveTo(x, y); g.lineTo(x - 28 * (E.gdir || 1), y + 3); }
    g.stroke();
    for (const l of E.leaves) { const x = ((l.x + l.t * 0.5 * l.s * (E.gdir || 1)) % 1.2) * W, y = (l.y + Math.sin(l.t * 3 + l.r) * 0.03) * H; g.save(); g.translate(x, y); g.rotate(l.r + l.t * 6); g.fillStyle = l.c; g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, 7); g.fill(); g.restore(); }
    g.restore();
  }
}
// ---------- 畫面：2D 備援 ----------
function nightPlus2D(sc, ctx) {
  const E = sc.nev;
  if (sc.stray && !sc.stray.hidden) sc.stray.draw(ctx);
  if (!E) return;
  if (E.id === 'truck' && E.phase === 'on') { ctx.fillStyle = '#f2c230'; ctx.fillRect(7.5 * TS - 10, E.y * TS - 10, 20, 12); ctx.fillStyle = '#2a2a36'; ctx.fillRect(7.5 * TS - 8, E.y * TS + 1, 4, 3); ctx.fillRect(7.5 * TS + 4, E.y * TS + 1, 4, 3); }
  if (E.id === 'temple' && E.phase === 'on') { ctx.fillStyle = '#c8302a'; ctx.fillRect(7.5 * TS - 5, (E.y - 1.4) * TS, 10, 9); }
}
