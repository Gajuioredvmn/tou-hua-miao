// ================= 競爭對手 =================
// 晚上：隔壁巷的黑貓「煤炭」跑來我們巷子偷花（搶同一批盆栽），被牠偷走的那一家也會更警戒。
//   碰到嘴上叼著花的煤炭可以「對決」（瞪眼比氣勢：指針停在綠色區按，三戰兩勝）：贏了牠的花歸你，輸了你嘴上的花被叼走。
//   贏越多次，煤炭的故事就往前走；最後一次「屋頂決戰」贏了，牠會加入花喵幫。
// 白天：第四個月，對面開了一家連鎖花店「花漾」。每天比「市佔率」：
//   早上選今天的作戰（特價跟進／辦活動／堅持原價），傍晚結算：有新品種、包花束、櫥窗、熟客、粉絲都會加分。
//   市佔率影響每一筆生意的價錢；連續三天七成五以上，連鎖店就撐不下去了。
// ---------- 晚上的煤炭 ----------
function rivalOf(run) { return run.rival || (run.rival = { wins: 0, losses: 0, nights: 0, ch: 0, friend: false, stolen: 0 }); }
function rivalActive(run) {
  const R = rivalOf(run), m = run.month || 1;
  if (R.friend) return false;
  return m >= 4 || (m >= 3 && (run.flags.blackCatSeen || 0) >= 1);
}
const COAL = { id: 'coal', name: '煤炭', pal: RIVAL_LOOK.pal };
function rivalArt(rv) { return withGear(null, () => ART.fix(toonGang(COAL, rv))); }
function initRival(sc) {
  const run = sc.run, R = rivalOf(run);
  sc.rival = null;
  if (!rivalActive(run) || sc.raid) return;
  const final = R.wins >= 6 && !R.friend;
  if (!final && Math.random() > 0.6) return;
  const from = Math.random() < 0.5 ? [7.5, 41.4] : [1.6, 5.6];
  const rv = Object.assign(new Cat(from[0] * TS, from[1] * TS), { state: 'wait', t: 0, at: sc.time + rnd(15, 55), from, carry: [], trips: 0, path: [], speed: 30, final, hiss: 0, skill: Math.min(1, 0.25 + R.wins * 0.1) });
  sc.rival = rv; sc.rivalLog = { took: [], duel: null };
  if (final) setTimeout(() => { if (G.scene === sc) UI.toast('今晚空氣不太一樣……煤炭要來做個了斷。找到牠，打贏最後一次對決！', 4200); }, 2600);
}
function rivalPickPot(sc) {
  const rv = sc.rival;
  const pots = sc.pots.filter(p => p.avail && !p.gone && !p.top && p.t !== 'lily' && p.owner !== 'mansion' && p.owner !== 'storm' && !(p.t === 'tanhua' && sc.tanhuaState() !== 'tanhua'));
  if (!pots.length) return null;
  pots.sort((a, b) => dist(a.x, a.y, rv.x, rv.y) - dist(b.x, b.y, rv.x, rv.y));
  return pick(pots.slice(0, 3));
}
function rivalUpdate(sc, dt) {
  const rv = sc.rival; if (!rv || rv.state === 'gone') return;
  const c = sc.cat; rv.t += dt;
  if (rv.hiss > 0) rv.hiss -= dt;
  if (rv.state === 'wait') { if (sc.time >= rv.at) { rv.state = 'hunt'; rv.target = null; } else return; }
  const go = (x, y) => { rv.path = sc.groundPath(rv.x, rv.y, x, y) || [[x, y]]; };
  if (rv.state === 'hunt') {
    if (!rv.target || !rv.target.avail) { rv.target = rivalPickPot(sc); if (!rv.target) { rv.state = 'leave'; go(rv.from[0] * TS, rv.from[1] * TS); } else go(rv.target.x, rv.target.y + 2); }
    if (rv.target && !rv.path.length) {
      rv.grab = (rv.grab || 0) + dt; rv.moving = false;
      if (rv.grab > 1.0) {
        rv.grab = 0; const p = rv.target;
        if (p.avail) {
          p.avail = false; rv.carry.push(p.t); sc.rivalLog.took.push({ t: p.t, owner: p.owner });
          sc.fx.text(p.x, p.y - 16, '被煤炭叼走了！', '#c8b8ff');
          if (HEAT_OWNERS.includes(p.owner)) heatAdd(sc.run, p.owner, 5);
          if (Cam.visible(p.x, p.y, 40)) SFX.tone(700, 0.08, { to: 500, vol: 0.05, type: 'triangle' });
          if (!sc.tips.rivalSteal && Cam.visible(p.x, p.y, 60)) { sc.tips.rivalSteal = 1; UI.toast('黑貓煤炭在偷我們巷子的花！靠近叼著花的牠，按「對決」把花搶回來', 4200); }
        }
        rv.target = null;
        if (rv.carry.length >= 2) { rv.state = 'leave'; go(rv.from[0] * TS, rv.from[1] * TS); }
      }
    }
  }
  if (rv.state === 'leave' && !rv.path.length) {
    rv.trips++;
    if (rv.trips < 2 && sc.end - sc.time > 50) { rv.carry = []; rv.state = 'wait'; rv.at = sc.time + rnd(20, 40); rv.x = rv.from[0] * TS; rv.y = rv.from[1] * TS; }
    else rv.state = 'gone';
  }
  if (rv.state === 'flee' && !rv.path.length) rv.state = 'gone';
  // 走路
  if (rv.path && rv.path.length) {
    const [tx, ty] = rv.path[0], dx = tx - rv.x, dy = ty - rv.y, d = Math.hypot(dx, dy);
    const sp = rv.speed * (rv.state === 'flee' ? 2.2 : 1) * dt;
    if (d <= sp) { rv.x = tx; rv.y = ty; rv.path.shift(); }
    else { rv.x += dx / d * sp; rv.y += dy / d * sp; }
    rv.moving = true; rv.running = rv.state === 'flee';
    if (Math.abs(dx) > Math.abs(dy) * 0.9) rv.dir = dx > 0 ? 'right' : 'left'; else rv.dir = dy > 0 ? 'down' : 'up';
  } else { rv.moving = false; rv.running = false; }
  // 碰到花喵：沒叼花就哈氣走開
  const d = dist(c.x, c.y, rv.x, rv.y);
  if (d < 1.6 * TS && !c.top && rv.state !== 'flee') {
    if (!rv.met) { rv.met = true; rivalOf(sc.run).met = 1; sc.fx.text(rv.x, rv.y - 18, '嘶——！', '#ffd25a'); SFX.tone(400, 0.25, { to: 260, vol: 0.06, type: 'sawtooth' }); }
    if (!rv.carry.length && rv.hiss <= 0 && !rv.final) { rv.hiss = 3; sc.fx.text(rv.x, rv.y - 18, '哼。', '#c8b8ff'); }
  }
}
// 對決：瞪眼比氣勢（三戰兩勝）
class RivalDuel {
  constructor(sc) {
    this.sc = sc; this.rv = sc.rival; this.round = 0; this.score = [0, 0]; this.t = 0; this.phase = 'intro'; this.pos = 0; this.dir = 1; this.msg = '';
    const k = this.rv.skill + (this.rv.final ? 0.25 : 0);
    this.speeds = [1.3 + k * 0.8, 1.6 + k * 0.9, 1.9 + k * 1.0];
    this.zones = [[0.36, 0.64], [0.4, 0.6], [0.43, 0.57]];
    if (hasSet(sc.run, 'thief')) this.zones = this.zones.map(([a, b]) => [a - 0.03, b + 0.03]);
  }
  input(type) {
    if (type !== 'down' && type !== 'key') return true;
    if (this.phase === 'play') {
      const z = this.zones[this.round], ok = this.pos >= z[0] && this.pos <= z[1];
      this.score[ok ? 0 : 1]++; this.phase = 'result'; this.t = 0; this.msg = ok ? pick(['瞪回去了！', '氣勢贏了！', '煤炭退了一步！']) : pick(['被瞪輸了……', '眨眼了！', '耳朵往後縮了……']);
      SFX.play(ok ? 'heart' : 'fail'); vibrate(ok ? 30 : 60);
    } else if (this.phase === 'intro' && this.t > 0.6) { this.phase = 'play'; this.t = 0; }
    return true;
  }
  update(dt) {
    this.t += dt;
    if (this.phase === 'intro' && this.t > 1.6) { this.phase = 'play'; this.t = 0; }
    if (this.phase === 'play') {
      const sp = this.speeds[this.round];
      this.pos += this.dir * sp * dt; if (this.pos > 1) { this.pos = 1; this.dir = -1; } if (this.pos < 0) { this.pos = 0; this.dir = 1; }
      if (this.t > 4) { this.score[1]++; this.phase = 'result'; this.t = 0; this.msg = '發呆太久了……'; SFX.play('fail'); }
    } else if (this.phase === 'result' && this.t > 0.9) {
      if (this.score[0] >= 2 || this.score[1] >= 2) { this.phase = 'end'; this.t = 0; this.win = this.score[0] >= 2; }
      else { this.round++; this.phase = 'play'; this.t = 0; this.pos = Math.random(); }
    } else if (this.phase === 'end' && this.t > 1.2) { this.done = true; }
  }
  render(g, W, H) {
    g.save();
    g.fillStyle = 'rgba(10,8,24,0.55)'; g.fillRect(0, 0, W, H);
    const cy = H * 0.42;
    // 兩隻貓的大頭
    const sc = this.sc;
    const me = ART.cat(Object.assign({}, sc.cat, { pose: null, dir: 'right', moving: false })), him = rivalArt(Object.assign(new Cat(0, 0), { dir: 'left', moving: false, t: this.t }));
    const big = Math.min(W / 2.6, 170);
    const draw = (a, x, flip) => { if (!a || !a.img) return; const w = big, h = big * a.h / a.w; g.save(); g.translate(x, cy); if (flip) g.scale(-1, 1); g.drawImage(a.img, -w / 2, -h + 20, w, h); g.restore(); };
    for (const [x, col] of [[W * 0.27, 'rgba(255,214,140,'], [W * 0.73, 'rgba(160,255,190,']]) { const gr = g.createRadialGradient(x, cy - big * 0.3, 4, x, cy - big * 0.3, big * 0.75); gr.addColorStop(0, col + '0.55)'); gr.addColorStop(1, col + '0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, cy - big * 0.3, big * 0.75, 0, TAU); g.fill(); }
    // 中間的火花
    for (let i = 0; i < 6; i++) { const a = this.t * 4 + i, r = 6 + (i % 3) * 5; g.fillStyle = i % 2 ? '#ffd25a' : '#ffffff'; g.beginPath(); g.arc(W / 2 + Math.cos(a) * r, cy - big * 0.35 + Math.sin(a * 1.3) * r, 2.2, 0, TAU); g.fill(); }
    draw(me, W * 0.27, false); draw(him, W * 0.73, false);
    CM.text(g, W / 2, cy - big * 0.8, this.rv.final ? '屋頂決戰' : '對決！', '#ffd25a', 30, 1, { rot: -0.05 });
    CM.text(g, W * 0.27, cy + 34, '花喵', '#fff', 15, 1); CM.text(g, W * 0.73, cy + 34, '煤炭', '#c8f0d0', 15, 1);
    // 比分
    for (let i = 0; i < 2; i++) {
      for (let k = 0; k < 2; k++) { g.fillStyle = this.score[i] > k ? (i ? '#ff7a5a' : '#ffd25a') : 'rgba(255,255,255,0.2)'; g.beginPath(); g.arc((i ? W * 0.73 : W * 0.27) - 9 + k * 18, cy + 56, 6.5, 0, TAU); g.fill(); }
    }
    const w = Math.min(280, W - 60), x = (W - w) / 2, y = cy + 92;
    if (this.phase === 'intro') CM.text(g, W / 2, y, '指針停在綠色的地方就按！三戰兩勝', '#fff', 15, 1);
    else if (this.phase === 'play' || this.phase === 'result') {
      const z = this.zones[this.round];
      g.fillStyle = '#3a3555'; CM.rr(g, x, y, w, 18, 9); g.fill();
      g.fillStyle = '#6ad08a'; CM.rr(g, x + w * z[0], y, w * (z[1] - z[0]), 18, 6); g.fill();
      const px = x + w * this.pos;
      g.fillStyle = '#ffd25a'; g.strokeStyle = CM.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px, y + 22); g.lineTo(px - 8, y + 34); g.lineTo(px + 8, y + 34); g.closePath(); g.fill(); g.stroke(); g.fillRect(px - 1.5, y - 3, 3, 22);
      CM.text(g, W / 2, y - 18, `第 ${this.round + 1} 回合`, '#e8e2ff', 14, 1);
      if (this.phase === 'result') CM.text(g, W / 2, y + 60, this.msg, '#fff3c8', 18, 1);
    } else if (this.phase === 'end') CM.text(g, W / 2, y + 10, this.win ? (this.rv.final ? '煤炭低下頭了……' : '贏了！煤炭把花丟下來了') : '輸了……煤炭叼著花跑了', this.win ? '#ffd25a' : '#ff9a8a', 20, 1);
    g.restore();
  }
}
function startDuel(sc) {
  const rv = sc.rival; if (!rv) return;
  sc.duel = new RivalDuel(sc); sc.mode = 'duel'; Input.release(); sc.cat.moving = false; rv.path = []; rv.moving = false;
  Input.game = (type, a) => sc.duel.input(type, a);
  UI.setAction(null); UI.setSkills([]);
}
function endDuel(sc) {
  const D = sc.duel, rv = sc.rival, c = sc.cat, run = sc.run, R = rivalOf(run);
  sc.duel = null; Input.game = null; sc.mode = 'play'; c.inv = 1.5;
  if (D.win) {
    R.wins++; sc.rivalLog.duel = 'win';
    const got = [];
    while (rv.carry.length && c.carry.length < sc.capacity()) { const t = rv.carry.pop(); c.carry.push({ t, fresh: 0.9, pot: { owner: null } }); got.push(t); }
    rv.carry = [];
    if (rv.final) { R.friend = true; R.finalWon = run.nightIdx || 1; UI.toast('煤炭不再瞪你了。牠繞著你走了一圈，蹭了一下……好像認你當老大了！', 4600); SFX.play('heart'); }
    else UI.toast(got.length ? `贏了對決！搶回${got.map(t => FLOWERS[t].name).join('、')}` : '贏了對決！煤炭夾著尾巴跑了', 3000);
  } else {
    R.losses++; sc.rivalLog.duel = 'lose';
    if (c.carry.length) { const f = c.carry.pop(); rv.carry.push(f.t); UI.toast(`輸了……煤炭連你嘴上的${FLOWERS[f.t].name}都叼走了`, 3000); }
    else UI.toast('輸了……煤炭哼了一聲走掉了', 2600);
  }
  rv.state = 'flee'; rv.path = sc.groundPath(rv.x, rv.y, rv.from[0] * TS, rv.from[1] * TS) || [];
  checkAchievements(run);
}
(function () {
  const P = NightScene.prototype;
  const _u = P.update;
  P.update = function (dt) {
    if (!this.rivalInit) { this.rivalInit = true; try { initRival(this); } catch (e) { console.error(e); } }
    if (this.mode === 'duel' && this.duel) {
      this.fx.update(dt); this.duel.update(dt); if (this.duel.done) endDuel(this); UI.nightHud(this); return;
    }
    const r = _u.call(this, dt);
    if (this.mode === 'play' && this.rival) rivalUpdate(this, dt * (this.timeScale || 1));
    return r;
  };
  const _ft = P.findTarget;
  P.findTarget = function () {
    _ft.call(this);
    const rv = this.rival, c = this.cat;
    if (this.mode !== 'play' || !rv || rv.state === 'gone' || rv.state === 'flee' || rv.state === 'wait' || c.top || c.jump) return;
    if ((rv.carry.length || rv.final) && dist(c.x, c.y, rv.x, rv.y) < 1.8 * TS) {
      this.target = { kind: 'rival', ref: { x: rv.x, y: rv.y } };
      UI.setAction('對決');
    }
  };
  const _act = P.onAction;
  P.onAction = function () {
    if (this.mode === 'play' && this.target && this.target.kind === 'rival') { startDuel(this); return; }
    return _act.call(this);
  };
  const _r3 = P.render3D;
  P.render3D = function () { const r = _r3.call(this); if (this.duel && R3.ov) this.duel.render(R3.ov, R3.W, R3.H); return r; };
  const _fin = P.finish;
  P.finish = function (timeUp) {
    if (this.rival && this.rivalLog) { const R = rivalOf(this.run); R.nights++; R.stolen += this.rivalLog.took.length; this.stats.rivalTook = this.rivalLog.took.length; this.stats.rivalDuel = this.rivalLog.duel; }
    return _fin.call(this, timeUp);
  };
})();
function rivalRender3D(sc, F) {
  const rv = sc.rival; if (!rv || rv.state === 'gone' || rv.state === 'wait' || sc.mode === 'zone') return;
  pushSprite(F.sprites, rivalArt(rv), rv.x, rv.y + 0.6, { minLight: [0.32, 0.3, 0.38] });
  shadowAt(F, rv.x, rv.y + 0.6, 0.7, 0.26, 1, 0);
  rv.carry.forEach((t, i) => pushSprite(F.sprites, ART.icon(t), rv.x + (rv.dir === 'left' ? -5 : rv.dir === 'right' ? 5 : (i - 0.5) * 3), rv.y + 1.6, { lift: 0.36 + i * 0.05, minLight: [0.45, 0.42, 0.48] }));
  // 綠色的眼睛在暗處發光
  glowQuad(F.glow, rv.x / TS + (rv.dir === 'left' ? -0.15 : rv.dir === 'right' ? 0.15 : 0), 0.62, rv.y / TS + 0.08, 0.16, [0.5, 1, 0.6, 0.35]);
}
// 早上結算：煤炭昨晚做了什麼
function rivalTallyHTML(R) {
  const n = R.rivalTook || 0, d = R.rivalDuel;
  if (!n && !d) return '';
  return `<div class="newab rival"><span class="tagnew">煤炭</span><p>${n ? `煤炭昨晚從巷子叼走了 ${n} 朵花（被偷的那幾家更警戒了）。` : '煤炭昨晚出現了。'}${d === 'win' ? '<br>對決贏了！' : d === 'lose' ? '<br>對決輸了……' : ''}</p></div>`;
}
{
  const _nd = Flow.nightDone;
  Flow.nightDone = function (res) {
    const r = _nd.call(this, res);
    const L = G.run.lastNight; if (L && res.stats) { L.rivalTook = res.stats.rivalTook || 0; L.rivalDuel = res.stats.rivalDuel || null; }
    return r;
  };
}
// 煤炭加入花喵幫：每晚多叼一朵新區域的花
GANG.push({ id: 'coal', name: '煤炭', cost: 0, need: 999, perk: 'coal', desc: '隔壁巷的老大：每晚多叼回一朵公園或隔壁巷的花', pal: RIVAL_LOOK.pal, hidden: true });
{
  const _gn = gangNight;
  gangNight = function (run, n) {
    const res = _gn(run, n);
    const st = gangOf(run).coal;
    if (st && !st.caught && st.target !== 'shop') { const t = pick(['plumeria', 'camellia', 'camellia', 'lotus']); res.flowers.push({ t, fresh: 1, owner: null, raid: true, gang: 'coal' }); const rep = res.report.find(x => x.id === 'coal'); if (rep) rep.got.push(t); }
    return res;
  };
}
// ---------- 煤炭的故事 ----------
function* rivalStoryScript(S) {
  const run = S.run, R = rivalOf(run), f = run.flags;
  if (R.met && !f.rv1) {
    f.rv1 = 1; S.shopOn = false;
    const b = S.customer('bo'); yield S.walkIn(b);
    yield* S.talk(b, '阿伯', [['昨晚看到一隻黑貓在巷子裡叼花……那是隔壁巷的「煤炭」。'], ['以前是一戶人家養的，搬家的時候沒帶走。從那之後就很兇，誰都不讓靠近。'], ['妳家花喵要是碰到牠，可別輸了氣勢喔。']]);
    yield S.walkOut(b);
    return true;
  }
  if (R.wins >= 3 && !f.rv2) {
    f.rv2 = 1;
    yield S.say('咦？貓門口有一朵山茶花……還有黑色的貓毛。');
    yield S.say('是煤炭放的嗎？好像是在說「下次不會輸給你」。');
    S.stock.push({ t: 'camellia', fresh: 1, owner: 'gift' });
    UI.hideDialog(); UI.toast('煤炭留了一朵山茶花在門口（店裡多一朵花）。再贏牠幾次……', 3600);
    return true;
  }
  if (R.wins >= 6 && !R.friend && !f.rv3) {
    f.rv3 = 1;
    yield S.say('今天整條巷子的貓都怪怪的，一直往屋頂上看。');
    yield S.say('林先生說，煤炭昨晚在屋頂上叫了一整晚……像在等誰。');
    UI.hideDialog(); UI.toast('下一次碰到煤炭，就是「屋頂決戰」：打贏牠，牠就會服你。', 4000);
    return true;
  }
  if (R.friend && !f.rv4) {
    f.rv4 = 1;
    const g = gangOf(run); g.coal = { target: gangDefaultTarget(run), caught: null, hauls: 0 };
    yield S.say('花喵……你後面那隻是……煤炭？！');
    yield S.say('牠跟著你回來了耶。在貓窩旁邊趴下來，好像打算住下來了。');
    yield S.say('好吧！歡迎加入花喵幫，煤炭。');
    UI.hideDialog(); SFX.play('meow'); UI.toast('煤炭加入花喵幫！晚上出門前可以派牠去偷花，牠每次還會多叼一朵新區域的花', 4400);
    return true;
  }
  return false;
}

// ---------- 白天的連鎖花店「花漾」 ----------
function chainOf(run) { return run.chain || (run.chain = { open: false, share: 50, hi: 0, lo: 0, closed: false, days: 0, plan: null, hist: [] }); }
function chainActive(run) { const C = chainOf(run); return C.open && !C.closed; }
function chainMult(run) {
  const C = chainOf(run);
  if (C.closed) return 1.1;
  if (!C.open) return 1;
  return (0.72 + 0.56 * C.share / 100) * (C.plan === 'sale' ? 0.85 : 1);
}
{
  const _sell = DayScene.prototype.sell;
  DayScene.prototype.sell = function (v, pot, wrap) { const m = chainMult(this.run); if (m !== 1 && v > 0) v = v * m; return _sell.call(this, v, pot, wrap); };
  const _us = DayScene.prototype.updateShoppers;
  DayScene.prototype.updateShoppers = function (dt) {
    // 辦活動的那天，客人來得比較快
    if (chainOf(this.run).plan === 'event' && this.shopOn && this.shopT > 0) this.shopT -= dt * 0.45;
    return _us.call(this, dt);
  };
}
function* chainMorningScript(S, n) {
  const run = S.run, C = chainOf(run), m = run.month || 1;
  if (C.closed) return;
  if (!C.open) {
    if (m < 4) return;
    C.open = true; C.share = 55;
    const wasOn = S.shopOn; S.shopOn = false;
    const k = S.customer('butler'); yield S.walkIn(k);
    yield* S.talk(k, '花漾連鎖・店長 Kevin', [
      ['妳好～我是對面新開的「花漾」店長 Kevin。全台灣有八十家分店喔。'],
      ['我們的花都是大量進貨，價錢只要妳的一半。'],
      ['這條巷子的客人……以後就請多指教囉。'],
      ['（Kevin 看了一眼櫃台上的花喵，笑了一下就走了）', null, 'M'],
    ]);
    yield S.walkOut(k);
    yield S.say('……八十家分店？我們只有一家，還有一隻貓。');
    yield S.say('可是我們的花是全世界最特別的。花喵，我們不能輸！');
    UI.hideDialog(); S.shopOn = wasOn;
    UI.toast('對面開了連鎖花店「花漾」！每天會比市佔率：市佔越高，每筆生意賣得越貴。有新品種、包花束、櫥窗佈置、熟客、粉絲都會加分', 5200);
    C.plan = 'keep'; return;
  }
  if (n < 2 || n > 4) { C.plan = null; return; }
  // 今天的作戰
  C.plan = null;
  let pick2 = null;
  yield S.modal(done => UI.modal(`<p class="eyebrow">對面的花漾連鎖</p><h2>今天怎麼打？</h2><p class="lead">市佔率 <b class="px">${Math.round(C.share)}%</b>（${C.share >= 60 ? '我們領先' : C.share <= 40 ? '被搶走不少客人' : '勢均力敵'}）。${C.hi ? `已經連續 ${C.hi} 天七成五以上！` : ''}</p>
      <ul class="chain-opts"><li><b>特價跟進</b>今天每筆生意打 85 折，市佔 +5</li><li><b>辦活動</b>花 NT$ 3,000 辦試插花活動：客人來得快，市佔 +9</li><li><b>堅持原價</b>不跟他們拼價錢（店裡有新品種的話市佔 +3）</li></ul>`,
    [{ label: '特價跟進', onClick: () => { pick2 = 'sale'; done(); } }, { label: run.money >= 3000 ? '辦活動' : '辦活動（錢不夠）', onClick: () => { pick2 = run.money >= 3000 ? 'event' : 'keep'; done(); } }, { label: '堅持原價', primary: true, onClick: () => { pick2 = 'keep'; done(); } }], { cls: 'small' }));
  C.plan = pick2 || 'keep';
  if (C.plan === 'event') { run.money -= 3000; UI.toast('門口擺出試插花的小桌子，路過的人都停下來看！', 2600); }
}
function chainDayEnd(S) {
  const run = S.run, C = chainOf(run);
  if (!chainActive(run) || S.n < 2 || S.n > 4) return null;
  const parts = [];
  const add = (v, why) => { if (v) parts.push([v, why]); };
  add(-4, '對面打廣告');
  if (C.plan === 'sale') add(5, '特價跟進'); else if (C.plan === 'event') add(9, '試插花活動');
  const hy = (S.dayStart || []).some(t => HYBRIDS[t]);
  if (hy) add(C.plan === 'keep' ? 7 : 4, '店裡有新品種');
  const bq = Math.min(6, (S.bqSold || 0) * 2); add(bq, '包了花束');
  if (run.window) add(2, '櫥窗佈置');
  const vip = REGULARS.filter(x => (regOf(run)[x.id] || 0) >= VIP_AT).length; add(vip, 'VIP 熟客');
  add(Math.min(4, (run.fans || []).length), '粉絲幫忙宣傳');
  const kinds = new Set(S.dayStart || []).size; if (kinds >= 6) add(2, '花的種類多');
  if (!(S.dayStart || []).length) add(-6, '店裡沒有花');
  if (Math.random() < 0.25) add(-5, '對面買一送一');
  add(Math.round(rnd(-2, 2)), '');
  const delta = parts.reduce((a, p) => a + p[0], 0);
  const before = C.share;
  C.share = clamp(C.share + delta, 5, 95); C.days++;
  C.hist.push(Math.round(C.share)); if (C.hist.length > 12) C.hist.shift();
  C.hi = C.share >= 75 ? C.hi + 1 : 0; C.lo = C.share <= 20 ? C.lo + 1 : 0;
  C.plan = null;
  return { before, after: C.share, parts };
}
{
  // 早上記下今天店裡有哪些花；包花束時記一筆
  const _mb = DayScene.prototype.bouquetMade;
  if (_mb) DayScene.prototype.bouquetMade = function (bq) { this.bqSold = (this.bqSold || 0) + 1; return _mb.call(this, bq); };
}
function* chainStoryScript(S) {
  const run = S.run, C = chainOf(run), f = run.flags;
  if (C.open && !C.closed && C.hi >= 3) {
    C.closed = true; f.chainWon = run.nightIdx || 1;
    const k = S.customer('butler'); yield S.walkIn(k);
    yield* S.talk(k, 'Kevin', [['……總公司決定，這間分店收掉了。'], ['我做了十年連鎖花店，第一次輸給一家只有一個老闆和一隻貓的店。'], ['妳的花，真的不一樣。'], ['對了，我們店的花藝師小敏說想來妳這裡工作。她很優秀，拜託妳了。']]);
    yield S.walkOut(k);
    yield S.say('我們贏了！花喵，我們打贏八十家分店了！');
    UI.hideDialog(); SFX.play('heart'); S.fx.hearts(S.cat.x, S.cat.y - 10, 10);
    UI.toast('花漾連鎖收掉了！花藝師小敏加入：以後每筆生意都多賣一成', 4600);
    checkAchievements(run);
    return true;
  }
  if (C.open && !C.closed && C.lo >= 3 && !f.chainRally) {
    f.chainRally = 1;
    const bonded = ['wang', 'lin', 'bo', 'public'].filter(o => (run.bond && run.bond[o] || 0) >= 4);
    const w = S.customer('wang'); yield S.walkIn(w);
    if (bonded.length >= 2) {
      yield* S.talk(w, '王太太', [['美玲！我聽說對面在搶妳的客人？'], ['我已經跟社區的太太們說好了，以後買花只來妳這裡！'], ['阿伯和林先生也說要幫妳宣傳喔。']]);
      C.share = Math.min(95, C.share + 18); C.lo = 0;
      UI.toast('老鄰居力挺！市佔率 +18', 3200); SFX.play('heart');
    } else {
      yield* S.talk(w, '王太太', [['對面的花好便宜喔……啊，美玲，我不是那個意思啦。'], ['妳要不要多跟大家打好關係？鄰居都會幫自己人的。']]);
      UI.toast('跟鄰居的交情夠深，被打趴的時候他們會出手幫忙', 3600);
    }
    yield S.walkOut(w);
    return true;
  }
  return false;
}
function chainTodayHTML(res) {
  if (!res) return '';
  const d = Math.round(res.after - res.before);
  return `<div class="chain-res"><b>今天的市佔率：${Math.round(res.after)}%（${d >= 0 ? '+' : ''}${d}）</b><span>${res.parts.filter(p => p[1]).map(p => `${p[1]} ${p[0] > 0 ? '+' : ''}${p[0]}`).join('・')}</span></div>`;
}
function chainShopHTML(run) {
  const C = chainOf(run);
  if (!C.open) return '';
  if (C.closed) return `<p class="hint">對面的花漾連鎖已經收掉了。花藝師小敏在店裡幫忙：每筆生意多賣一成。</p>`;
  const bars = C.hist.map(v => `<i style="height:${Math.max(4, v * 0.36)}px" class="${v >= 75 ? 'hi' : v <= 20 ? 'lo' : ''}"></i>`).join('');
  return `<div class="chain-box"><div class="chain-top"><b>對面的花漾連鎖</b><span>市佔率 <b class="px">${Math.round(C.share)}%</b>　生意 ×${chainMult(run).toFixed(2)}</span></div><div class="chain-bars">${bars}</div><p class="hint">連續 3 天七成五以上，連鎖店就撐不下去了。新品種、花束、櫥窗、VIP、粉絲都會讓客人選我們。</p></div>`;
}
