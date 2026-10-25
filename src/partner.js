// ================= 橘貓夥伴 =================
// 在老貓攤收了「橘貓夥伴」之後，牠每晚都跟你出門（第四晚沒收也會來幫忙）。
// 指令（按「橘貓」）：撒嬌引開（每次演出不一樣＋漫畫特寫）、分頭偷花、搗蛋引開。
// 自動：幫你把風、你被抓到時跳出來救場一次。你停下來時牠會舔毛、聞花、追螢火蟲、蹭你、打瞌睡。

const ORANGE_ROUTINES = ['roll', 'rub', 'maneki', 'chase', 'gift', 'headbutt'];
const ORANGE_ROUTINE_NAME = { roll: '翻肚打滾', rub: '繞著腳蹭蹭', maneki: '招財貓招手', chase: '追自己的尾巴', gift: '叼小花送人', headbutt: '頭槌討摸' };
const ORANGE_LINES = {
  wang: ['哎唷～好可愛！', '來，阿姨摸摸～', '是誰家的小橘子呀？'],
  lin: ['……就摸一下。', '我是狗派的……可是……', '小柴，不要吃醋喔。'],
  bo: ['乖喔～阿伯摸摸。', '跟我以前那隻好像……', '阿伯有小魚乾喔。'],
  patrol: ['來來來，拍一張！', '巡守隊吉祥物就是你了！', '里民群組要爆了！'],
  butler: ['……失禮了。（偷摸）', '僅此一次。', '（默默拿出手機）'],
  party: ['來，給你一塊肉！', '大家快來看橘貓！', '中秋節快樂～'],
  dog: ['汪！（尾巴狂搖）', '（聞聞）……汪～', '汪汪！（想一起玩）'],
};
const ORANGE_FACE = { wang: 'heart', lin: 'blush', bo: 'tears', patrol: 'phone', butler: 'phone', party: 'meat' };
const ORANGE_HEAD = { fur: '#ec9440', stripe: '#a24c14' };
let ORANGE_LAST = null;
// 夥伴等級：0＝還沒收（第四晚來幫忙），1～3＝老貓攤升級
function orangeEnergy(run) { const L = run.upg.orange || 0; return L > 0 ? 2 + L : 2; }

class OrangeCat {
  constructor(x, y) {
    this.x = x; this.y = y; this.h = 0; this.state = 'follow'; this.t = 0; this.dir = 'right';
    this.moving = false; this.running = false; this.target = null; this.charmT = 0; this.carry = []; this.pose = null; this.idleT = 0; this.act = null; this.jump = null;
    this.trail = [{ x, y, h: 0 }]; this.path = []; this.repath = 0; this.hopT = 0; this.hopDur = 0.35; this.hopZ = 0;
    this.emote = null; this.emoteT = 0;
    this.beh = null; this.behT = 0; this.nextBeh = 2; this.stillT = 0; this.actT = 0; this.nextAct = 1;
    this.talkCD = 5; this.wsCD = 6; this.ws = null;
    this.routine = null; this.rt = 0; this.gift = null; this.bug = null; this.warn = null; this.seenT = 0; this.kt = 0;
  }
  setEmote(k, t = 1.2) { this.emote = k; this.emoteT = t; }
  hop(t = 0.35) { if (t > 0) { this.hopT = t; this.hopDur = t; } }
  say(scene, txt, chance = 1) {
    if (Math.random() > chance) return;
    scene.fx.text(this.x, this.y - 14, txt, '#ffcf8a', 1.3, 0.95 + (this.h || 0) * Math.cos(0.64));
  }
  record(c) {
    const L = this.trail[this.trail.length - 1];
    if (dist(L.x, L.y, c.x, c.y) > 2.5 || Math.abs(L.h - c.h) > 0.3) { this.trail.push({ x: c.x, y: c.y, h: c.h }); if (this.trail.length > 90) this.trail.shift(); }
  }
  resetTrail(c) { this.trail = [{ x: c.x, y: c.y, h: c.h || 0 }]; }
  // 從貓往回數 back 像素的那個點
  trailPoint(back) {
    let acc = 0;
    for (let i = this.trail.length - 1; i > 0; i--) {
      const a = this.trail[i], b = this.trail[i - 1], d = dist(a.x, a.y, b.x, b.y);
      if (acc + d >= back) { const k = (back - acc) / Math.max(0.01, d); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), h: lerp(a.h, b.h, k) }; }
      acc += d;
    }
    return this.trail[0];
  }
  invalid(T) { return !T || T.hidden || T.state === 'inside' || T.state === 'gohome' || T.state === 'gone'; }
  get busy() { return this.state !== 'follow'; }

  update(dt, scene) {
    this.t += dt;
    if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
    if (this.hopT > 0) this.hopT -= dt;
    if (this.talkCD > 0) this.talkCD -= dt;
    if (this.warn) { this.warn.t -= dt; if (this.warn.t <= 0) this.warn = null; }
    this.record(scene.cat);
    let goal = null;
    if (this.state === 'follow') goal = this.follow(dt, scene);
    else if (this.state === 'charm') this.charmUpdate(dt, scene);
    else if (this.state === 'knock') this.knockUpdate(dt, scene);
    else goal = this.travel(dt, scene);
    if (goal) {
      const dx = goal.x - this.x, dy = goal.y - this.y, d = Math.hypot(dx, dy);
      this.moving = goal.sp > 0 && d > 0.8; this.running = goal.sp > 50;
      if (this.moving) {
        const st = Math.min(d, goal.sp * dt); this.x += dx / d * st; this.y += dy / d * st;
        if (Math.abs(dx) > Math.abs(dy) * 0.8) this.dir = dx < 0 ? 'left' : 'right'; else this.dir = dy < 0 ? 'up' : 'down';
      }
    } else if (this.state !== 'charm') { this.moving = false; this.running = false; }
    if (this.moving) this.idleT = 0; else this.idleT += dt;
    // 跳躍的高度（小跳、撲螢火蟲）
    let hz = this.hopT > 0 ? Math.sin((1 - this.hopT / this.hopDur) * Math.PI) * 0.3 : 0;
    if (this.jump) hz = Math.max(hz, Math.sin(clamp(this.jump.t / this.jump.dur, 0, 1) * Math.PI) * 0.45);
    this.hopZ = hz;
  }

  // ---------- 跟著你 ----------
  follow(dt, scene) {
    const c = scene.cat;
    const still = !c.moving && !c.jump;
    this.stillT = still ? this.stillT + dt : 0;
    if (!still && this.beh) this.endBeh(scene, true);
    const p = this.trailPoint(17);
    const dd = dist(this.x, this.y, p.x, p.y);
    if (dd > 7 * TS) { this.x = p.x; this.y = p.y; this.h = p.h; this.ws = null; }
    // 把風：豎起耳朵、轉向危險
    if (this.warn && (still || dd < 12)) { this.pose = null; this.act = null; this.h += (p.h - this.h) * Math.min(1, dt * 10); return null; }
    // 走路途中偶爾停下來聞一下花，再跑著追上
    if (this.ws) {
      this.ws.t -= dt; this.pose = 'rub'; this.act = null; this.dir = this.ws.pot.x < this.x ? 'left' : 'right';
      if (this.ws.t <= 0) { this.ws = null; this.pose = null; if (this.talkCD <= 0) { this.say(scene, '等等我！', 0.6); this.talkCD = 8; } }
      return null;
    }
    if (!still || this.stillT < 0.9) {
      this.h += (p.h - this.h) * Math.min(1, dt * 10);
      this.pose = null; this.act = null;
      this.wsCD -= dt;
      if (this.wsCD <= 0 && c.moving && !c.top && (this.h || 0) < 0.05) {
        const pot = scene.pots.find(q => q.avail && !q.top && dist(q.x, q.y, this.x, this.y) < 1.6 * TS);
        if (pot) { this.ws = { pot, t: 0.85 }; this.wsCD = rnd(9, 15); this.setEmote('note', 0.9); } else this.wsCD = 1.5;
      }
      return { x: p.x, y: p.y, sp: dd > 30 ? 70 : dd > 3 ? 34 : 0 };
    }
    return this.idle(dt, scene, this.trailPoint(14));
  }
  // 你停下來了：牠在旁邊做自己的事
  idle(dt, scene, home) {
    const c = scene.cat;
    if (this.stillT > 20 && (!this.beh || this.beh === 'sit')) this.startBeh('sleep', scene);
    if (!this.beh) { this.nextBeh -= dt; if (this.nextBeh <= 0) this.pickBeh(scene); }
    else { this.behT -= dt; if (this.behT <= 0) { this.endBeh(scene, false); this.nextBeh = rnd(1.1, 2.4); } }
    const b = this.beh;
    if (b === 'rub') {
      const side = this.x < c.x ? -1 : 1, tx = c.x + side * 9, ty = c.y + 1;
      if (dist(this.x, this.y, tx, ty) > 2) { this.pose = null; this.act = null; return { x: tx, y: ty, sp: 30 }; }
      this.pose = 'rub'; this.dir = side < 0 ? 'right' : 'left';
      if (Math.random() < dt * 0.9) scene.fx.hearts(this.x, this.y - 10, 1);
      return null;
    }
    if (b === 'sniff' && this.sniffPot) {
      const P = this.sniffPot, tx = P.x + (this.x < P.x ? -9 : 9), ty = P.y + 1;
      if (dist(this.x, this.y, tx, ty) > 2) { this.pose = null; this.act = null; return { x: tx, y: ty, sp: 28 }; }
      this.pose = 'rub'; this.dir = tx < P.x ? 'right' : 'left';
      return null;
    }
    if (b === 'bug') { this.bugUpdate(dt, scene); return null; }
    if (b === 'roll') { this.pose = 'belly'; this.act = null; return null; }
    if (b === 'groom' || b === 'yawn' || b === 'sleep') {
      if (dist(this.x, this.y, home.x, home.y) > 3 && b !== 'sleep') { this.pose = null; this.act = null; return { x: home.x, y: home.y, sp: 30 }; }
      this.pose = 'loaf'; this.act = b === 'groom' ? 'lick' : b;
      if (b === 'sleep' && !this.emote && Math.floor(this.t * 1.2) % 2 === 0) this.setEmote('z', 0.8);
      return null;
    }
    // 坐在你後面東張西望
    this.h += (home.h - this.h) * Math.min(1, dt * 10);
    if (dist(this.x, this.y, home.x, home.y) > 3) { this.pose = null; this.act = null; return { x: home.x, y: home.y, sp: 30 }; }
    this.pose = 'loaf';
    if (this.actT > 0) { this.actT -= dt; if (this.actT <= 0) this.act = null; }
    this.nextAct -= dt;
    if (this.nextAct <= 0 && !this.act) {
      this.act = pick(['lookL', 'lookR', 'blink', 'ear', 'blink', 'lookL', 'lookR']);
      this.actT = { lookL: 1.3, lookR: 1.3, blink: 0.16, ear: 0.45 }[this.act];
      this.nextAct = rnd(1, 2.4);
    }
    return null;
  }
  pickBeh(scene) {
    const c = scene.cat, ground = !c.top && (this.h || 0) < 0.05;
    let opts = [['groom', 3], ['yawn', 1.2], ['sit', 1]];
    this.sniffPot = null;
    if (ground) {
      const side = this.x < c.x ? -1 : 1;
      if (!scene.solid(c.x + side * 9, c.y + 1)) opts.push(['rub', 2.6]);
      opts.push(['bug', 1.8], ['roll', 1]);
      const pot = scene.pots.find(p => p.avail && !p.top && dist(p.x, p.y, this.x, this.y) < 2.6 * TS && lineOfSight(scene.map, this.x, this.y - 3, p.x, p.y - 4, scene.occ));
      if (pot) { opts.push(['sniff', 3]); this.sniffPot = pot; }
    }
    opts = opts.filter(o => o[0] !== this.lastBeh);   // 不要連續做同一件事
    let sum = opts.reduce((s, o) => s + o[1], 0), r = Math.random() * sum, name = 'sit';
    for (const [k, w] of opts) { r -= w; if (r <= 0) { name = k; break; } }
    this.startBeh(name, scene);
  }
  startBeh(b, scene) {
    this.beh = b; this.lastBeh = b; this.act = null; this.actT = 0;
    this.behT = { groom: 1.9, yawn: 1.2, sit: 2.4, rub: 2.2, bug: 2.4, roll: 1.8, sniff: 2.2, sleep: 99 }[b] || 2;
    if (b === 'groom') this.say(scene, pick(['舔舔～', '（舔毛）', '理毛中']), 0.35);
    else if (b === 'yawn') this.say(scene, '哈～啊……', 0.45);
    else if (b === 'rub') { this.setEmote('heart', 1.2); SFX.play('purr'); }
    else if (b === 'sniff') { this.setEmote('note', 1.4); this.say(scene, pick(['香香～', '聞聞……', '這盆好香']), 0.45); }
    else if (b === 'roll') this.say(scene, '翻～', 0.3);
    else if (b === 'sleep') { this.setEmote('z', 1); }
    else if (b === 'bug') {
      // 旁邊飛來一隻螢火蟲
      const side = Math.random() < 0.5 ? -1 : 1;
      let bx = this.x + side * rnd(11, 16), by = this.y + rnd(-6, 3);
      if (scene.solid(bx, by) || !lineOfSight(scene.map, this.x, this.y - 2, bx, by - 2, scene.occ)) { bx = this.x - side * 12; by = this.y; }
      if (scene.solid(bx, by)) { this.beh = 'groom'; this.behT = 1.9; return; }
      this.bug = { x: bx, y: by, hz: 0.42, t: 0, phase: 'stalk', dx: side };
      this.setEmote('ex', 0.5);
    }
  }
  endBeh(scene, woke) {
    if (this.beh === 'sleep' && woke) { this.setEmote('ex', 0.7); this.hop(0.3); this.say(scene, '喵！？', 0.8); }
    this.beh = null; this.pose = null; this.act = null; this.bug = null; this.jump = null;
  }
  bugUpdate(dt, scene) {
    const b = this.bug; if (!b) { this.pose = 'loaf'; return; }
    b.t += dt;
    if (b.phase === 'stalk') {
      this.pose = 'loaf'; this.act = b.x < this.x ? 'lookL' : 'lookR';
      b.y += Math.sin(b.t * 7) * dt * 6;
      if (b.t > 0.8) { b.phase = 'pounce'; b.t = 0; this.pose = null; this.act = null; this.jump = { x0: this.x, y0: this.y, x1: b.x, y1: b.y + 1, t: 0, dur: 0.42 }; this.dir = b.x < this.x ? 'left' : 'right'; }
    } else if (b.phase === 'pounce') {
      const j = this.jump; j.t += dt;
      const k = Math.min(1, j.t / j.dur);
      this.x = lerp(j.x0, j.x1, k); this.y = lerp(j.y0, j.y1, k);
      b.x += dt * 34 * b.dx; b.hz += dt * 0.9;
      if (k >= 1) { this.jump = null; b.phase = 'miss'; b.t = 0; this.setEmote(Math.random() < 0.5 ? 'q' : 'note', 1); this.say(scene, pick(['跑掉了……', '差一點！', '抓到了？']), 0.5); }
    } else {
      b.x += dt * 24 * b.dx; b.y -= dt * 7; b.hz += dt * 0.7;
      this.pose = 'loaf'; this.act = b.x < this.x ? 'lookL' : 'lookR';
      if (b.t > 1.3) this.bug = null;
    }
  }

  // ---------- 出任務：撒嬌、偷花、搗蛋，然後回來 ----------
  travel(dt, scene) {
    const c = scene.cat;
    this.pose = null; this.act = null; this.beh = null; this.ws = null;
    if (this.h > 0) this.h = Math.max(0, this.h - dt * 5);
    let T, sp, near;
    if (this.state === 'go') {
      T = this.target; sp = 88; near = 13;
      if (this.invalid(T)) { this.state = 'back'; this.path = []; scene.oranges++; UI.toast('橘貓撲了個空，回來了'); return null; }
    } else if (this.state === 'fetch') {
      T = this.pot; sp = 80; near = 9;
      if (!T.avail) { this.state = 'back'; this.path = []; scene.oranges++; UI.toast('那盆花已經沒了，橘貓撲了個空'); return null; }
    } else if (this.state === 'prank') { T = this.spot; sp = 86; near = 5; }
    else {
      T = c; sp = this.state === 'flee' ? 98 : this.state === 'bring' ? 70 : 74; near = 20;
      if (c.top || dist(this.x, this.y, c.x, c.y) < near) { this.arrive(scene); return null; }
      // 找不到路又很遠（例如你跳進大宅）：直接回到跟隨，牠會從你走過的路追上來
      if (this.repath > 0 && !this.path.length && this.noPath && dist(this.x, this.y, c.x, c.y) > 5 * TS) { this.arrive(scene); return null; }
    }
    if (this.state === 'go' || this.state === 'fetch' || this.state === 'prank') {
      if (dist(this.x, this.y, T.x, T.y) < near) { this.arrive(scene); return null; }
    }
    this.repath -= dt;
    if (this.repath <= 0 || !this.path.length) { this.repath = 0.6; const pth = scene.groundPath(this.x, this.y, T.x, T.y); this.noPath = !pth; this.path = pth || []; }
    const wp = this.path[0];
    let tx = T.x, ty = T.y;
    if (wp) { tx = wp[0]; ty = wp[1]; if (dist(this.x, this.y, tx, ty) < 3) this.path.shift(); }
    return { x: tx, y: ty, sp };
  }
  arrive(scene) {
    const c = scene.cat;
    if (this.state === 'go') { this.state = 'charm'; this.charmT = 6; this.path = []; scene.charm(this.target, this); }
    else if (this.state === 'fetch') scene.orangeGrab(this, this.pot);
    else if (this.state === 'prank') { this.state = 'knock'; this.kt = 0; this.boomed = false; this.path = []; }
    else {
      const wasFlee = this.state === 'flee';
      this.state = 'follow'; this.path = []; this.beh = null; this.stillT = 0; this.hop(Math.abs(this.h - (c.h || 0)) > 0.2 ? 0.35 : 0.2);
      if (wasFlee) this.setEmote('dots', 1.2);
      if (this.carry.length && c.home) scene.depositAll();
    }
  }
  knockUpdate(dt, scene) {
    this.kt += dt; this.moving = false; this.pose = null;
    if (!this.boomed && this.kt >= 0.25) { this.boomed = true; this.hop(0.3); scene.prankBoom(this.x, this.y); this.setEmote('note', 1); }
    if (this.kt >= 0.85) { this.state = 'back'; this.path = []; }
  }
  // 撒嬌：每次演出不一樣
  charmUpdate(dt, scene) {
    this.charmT -= dt; this.rt += dt;
    const T = this.target;
    if (T && T.face && T.state === 'pet') T.face(this.x, this.y);
    this.moving = false; this.running = false; this.pose = null; this.act = null;
    const tx = T ? T.x : this.x, ty = T ? T.y : this.y;
    switch (this.routine) {
      case 'roll': this.pose = 'belly'; break;
      case 'rub': {
        this.orbA += dt * 2.4;
        const nx = tx + Math.cos(this.orbA) * 11, ny = ty + 2 + Math.sin(this.orbA) * 5, dx = nx - this.x, dy = ny - this.y;
        if (!scene.solid(nx, ny)) { this.x = nx; this.y = ny; }
        this.moving = true;
        if (Math.abs(dx) > Math.abs(dy) * 0.8) this.dir = dx < 0 ? 'left' : 'right'; else this.dir = dy < 0 ? 'up' : 'down';
        if (Math.random() < dt * 1.2) scene.fx.hearts(this.x, this.y - 10, 1);
        break;
      }
      case 'maneki': this.pose = 'meow'; this.dir = tx < this.x ? 'left' : 'right'; break;
      case 'chase':
        if (this.rt < 4) { this.moving = true; this.dir = ['right', 'down', 'left', 'up'][Math.floor(this.rt * 8) % 4]; }
        else { this.pose = 'loaf'; this.act = 'blink'; if (!this.emote) this.setEmote('dots', 1.4); }
        break;
      case 'gift':
        this.dir = tx < this.x ? 'left' : 'right';
        if (this.rt >= 1.4) {
          if (this.gift) { this.gift = null; scene.fx.text(this.x, this.y - 14, '送你！', '#ffcf8a'); if (T && T.setEmote) T.setEmote('heart', 1.4); scene.fx.hearts(tx, ty - 18, 3); }
          this.pose = 'loaf'; this.act = Math.floor(this.rt * 2) % 4 === 0 ? 'meow' : null;
        }
        break;
      case 'headbutt': {
        const ph = (this.rt % 0.7) / 0.7, n = Math.floor(this.rt / 0.7);
        this.pose = ph < 0.5 ? 'rub' : null; this.dir = tx < this.x ? 'left' : 'right';
        if (ph >= 0.5 && this.lastBump !== n) { this.lastBump = n; this.hop(0.25); scene.fx.hearts(this.x, this.y - 12, 1); }
        break;
      }
    }
    if (this.charmT <= 0) { this.state = 'back'; this.pose = null; this.act = null; this.gift = null; this.routine = null; this.path = []; }
  }
}

// ---------------------------------------------------------------
// 夜晚場景：給橘貓下指令、牠被看到、把風、搗蛋
// ---------------------------------------------------------------
NightScene.prototype.nameOf = function (v) { return v === this.dog ? '小柴' : (CUTE[v.cuteKey] || {}).name || '鄰居'; };
// 撒嬌的對象：附近最可疑（或最近）的人，或醒著的小柴
NightScene.prototype.charmTarget = function () {
  const c = this.cat, oc = this.orange;
  const cand = [this.lin, this.bo, this.patrol, this.butler, ...this.party].filter(n => n && !n.hidden && n.state !== 'inside' && n.state !== 'gohome' && n.state !== 'pet');
  if (this.dog.state !== 'sleep' && this.dog.state !== 'gone' && !(this.dog.charmT > 0)) cand.push(this.dog);
  let best = null, bs = -1e9;
  for (const n of cand) { const d = dist(n.x, n.y, c.x, c.y); if (d > 9 * TS) continue; const sc = (n.susp || 0) * 200 - d; if (sc > bs) { bs = sc; best = n; } }
  if (!best) return null;
  return { v: best, path: this.groundPath(oc.x, oc.y, best.x, best.y) };
};
// 偷花的目標：附近牠拿得到的地上盆栽（屋頂的牠上不去、百合不碰、曇花要開了才拿）
NightScene.prototype.fetchTarget = function () {
  const c = this.cat, oc = this.orange;
  const ok = p => p.avail && !p.top && p.t !== 'lily' && !(p.t === 'tanhua' && this.tanhuaState() !== 'tanhua');
  const list = this.pots.filter(p => ok(p) && dist(p.x, p.y, c.x, c.y) < 10 * TS && dist(p.x, p.y, c.x, c.y) > 18).sort((a, b) => dist(a.x, a.y, c.x, c.y) - dist(b.x, b.y, c.x, c.y));
  for (const p of list.slice(0, 5)) { const path = this.groundPath(oc.x, oc.y, p.x, p.y); if (path && path.length < 60) return { p, path }; }
  return null;
};
// 搗蛋：在附近那個人「背對你」的方向弄出聲音，把人引過去
NightScene.prototype.prankPlan = function () {
  const c = this.cat, oc = this.orange;
  const cand = [this.lin, this.bo, this.patrol, this.butler, ...this.party].filter(n => n && !n.hidden && n.state !== 'inside' && n.state !== 'gohome' && n.state !== 'pet' && dist(n.x, n.y, c.x, c.y) < 10 * TS);
  cand.sort((a, b) => ((b.susp || 0) * 200 - dist(b.x, b.y, c.x, c.y)) - ((a.susp || 0) * 200 - dist(a.x, a.y, c.x, c.y)));
  // 第一輪只找畫面裡看得到的地方（看得到搗蛋比較好玩），找不到再放寬
  for (const onScreen of [true, false]) for (const P of cand.slice(0, 3)) {
    const base = Math.atan2(P.y - c.y, P.x - c.x);
    for (const k of [3.2, 4, 2.4, 5]) for (const side of [0, 0.6, -0.6, 1.1, -1.1, 1.6, -1.6]) {
      const x = P.x + Math.cos(base + side) * k * TS, y = P.y + Math.sin(base + side) * k * TS;
      if (x < TS || y < TS || x > (this.map.w - 1) * TS || y > (this.map.h - 1) * TS) continue;
      if (onScreen && (Math.abs(x - c.x) > 3.4 * TS || Math.abs(y - c.y) > 6 * TS)) continue;
      if (this.solid(x, y) || this.solid(x, y - 3) || this.solid(x - 3, y - 2) || this.solid(x + 3, y - 2)) continue;
      if (dist(x, y, c.x, c.y) < 2.6 * TS) continue;
      const path = this.groundPath(oc.x, oc.y, x, y);
      if (!path || path.length > 46) continue;
      return { v: P, x, y, path };
    }
  }
  return null;
};
NightScene.prototype.orangeOptions = function () {
  const oc = this.orange, ct = this.charmTarget(), ft = oc.carry.length ? null : this.fetchTarget(), pr = this.prankPlan();
  return [
    { id: 'charm', key: '1', name: '撒嬌引開', tgt: ct, path: ct && ct.path, ok: !!(ct && ct.path), desc: !ct ? '附近沒有人' : !ct.path ? '橘貓過不去那邊' : `引開${this.nameOf(ct.v)} 6 秒` },
    { id: 'fetch', key: '2', name: '分頭偷花', tgt: ft, path: ft && ft.path, ok: !!ft, desc: oc.carry.length ? '牠嘴裡已經有花了' : ft ? `去叼${FLOWERS[ft.p.t].name}` : '附近沒有牠拿得到的花' },
    { id: 'prank', key: '3', name: '搗蛋引開', tgt: pr, path: pr && pr.path, ok: !!pr, desc: pr ? `把${this.nameOf(pr.v)}引走` : '附近沒有人' },
  ];
};
// 按「橘貓」：先停下來選指令（選的時候時間暫停）
NightScene.prototype.orangeOrder = function () {
  const oc = this.orange;
  if (!oc) return;
  if (this.oranges <= 0) { SFX.play('nope'); UI.toast('橘貓累了，今晚不想再出動了'); return; }
  if (oc.state !== 'follow') { SFX.play('nope'); UI.toast('橘貓還在忙'); return; }
  const opts = this.orangeOptions();
  this.mode = 'order'; this.stopWait(); Input.release();
  UI.setAction(null); UI.setSkills([]); UI.setWait(false, false);
  SFX.play('ui');
  UI.orangeChoice(opts, this.oranges, id => {
    if (this.mode === 'order') this.mode = 'play';
    const o = id && opts.find(x => x.id === id);
    if (o && o.ok) this.orangeDo(o);
  });
};
NightScene.prototype.orangeDo = function (o) {
  const oc = this.orange;
  oc.endBeh(this, false); oc.ws = null; oc.warn = null;
  this.oranges--;
  oc.path = (o.path || []).slice(); oc.repath = 0.6; oc.seenT = 0;
  SFX.play('meow');
  if (o.id === 'charm') { oc.state = 'go'; oc.target = o.tgt.v; oc.say(this, pick(['喵～交給我！', '看我的！', '撒嬌我最會！'])); }
  else if (o.id === 'fetch') {
    oc.state = 'fetch'; oc.pot = o.tgt.p; oc.say(this, pick(['我去叼！', '那盆交給我！', '分頭行動！']));
    if (!this.tips.fetch) { this.tips.fetch = 1; UI.toast('橘貓去偷花了！牠被看到會嚇得丟下花跑回來', 3000); }
  } else {
    oc.state = 'prank'; oc.spot = { x: o.tgt.x, y: o.tgt.y }; oc.prankV = o.tgt.v; oc.say(this, pick(['搗蛋時間～', '嘿嘿嘿……', '看我的！']));
  }
};
// 叼到花了
NightScene.prototype.orangeGrab = function (oc, p) {
  if (!p.avail) { oc.state = 'back'; oc.path = []; this.oranges++; return; }
  p.avail = false;
  oc.carry = [{ t: p.t, fresh: 1, pot: p }];
  SFX.play('pick');
  this.fx.text(p.x, p.y - 16, FLOWERS[p.t].name, '#ffcf8a', 1.4);
  this.noise(p.x, p.y - 4, 1.4 * TS, 'cat');
  oc.state = 'bring'; oc.path = []; oc.repath = 0; oc.setEmote('note', 1);
};
// 搗蛋：匡啷一聲，附近的人都會過去看
NightScene.prototype.prankBoom = function (x, y) {
  SFX.play('knock');
  this.noise(x, y - 4, 6.5 * TS, 'obj');
  this.fx.text(x, y - 16, pick(['匡啷！', '鏗鏘！', '碰！']), '#ffd25a');
  this.prankFx = { x, y, t: 0, dx: Math.random() < 0.5 ? -1 : 1 };
  vibrate(20);
  if (!this.tips.prank) { this.tips.prank = 1; UI.toast('橘貓搗蛋！附近的人會被聲音引過去'); }
};
// 某一點看不看得到（橘貓比較小，看得比較近）
NightScene.prototype.canSeeAt = function (v, x, y) {
  if (!v.active()) return false;
  const [ex, ey] = v.eye();
  const d = dist(ex, ey, x, y), lit = this.litAt(x, y);
  const vr = v.range * (v.type === 'camera' ? 1 : this.visMult) * 0.9;
  if (d > (lit ? Math.max(vr, 5.5 * TS) : vr)) return false;
  if (angDiff(Math.atan2(y - ey, x - ex), v.ang) > (lit && d > vr ? v.half + 0.3 : v.half)) return false;
  if (this.map.at(Math.floor(x / TS), Math.floor((y + 1) / TS)) === 'b' && d > 14) return false;
  return lineOfSight(this.map, ex, ey, x, y, this.occ);
};
// 出任務時被看到：丟下花、嚇得跑回來，那個人會過來看
NightScene.prototype.orangeSeen = function (dt) {
  const oc = this.orange;
  if (!oc) return;
  if (oc.state !== 'fetch' && oc.state !== 'bring' && oc.state !== 'prank') { oc.seenT = 0; return; }
  const who = this.viewers.find(v => v && this.canSeeAt(v, oc.x, oc.y - 3));
  if (!who) { oc.seenT = Math.max(0, oc.seenT - dt); return; }
  oc.seenT += dt;
  if (oc.seenT < 0.45) return;
  oc.seenT = 0;
  if (oc.carry.length) { for (const f of oc.carry) f.pot.avail = true; oc.carry = []; this.fx.text(oc.x, oc.y - 14, '花掉了！', '#ff9a9a'); }
  oc.state = 'flee'; oc.path = []; oc.repath = 0; oc.setEmote('ex', 1);
  oc.say(this, '嚇！', 1);
  SFX.play('nope');
  if (who.type === 'npc') who.hear(oc.x, oc.y, this);
  else if (who.type === 'party') who.hear(oc.x, oc.y);
  if (who.setEmote) who.setEmote('ex', 1.2);
  const [ex, ey] = who.eye();
  this.fx.text(ex, ey - 14, '欸？橘貓！', '#ffffff', 1.6);
  if (!this.tips.ocSeen) { this.tips.ocSeen = 1; UI.toast('橘貓被看到了，嚇得跑回來！派牠出門前先看看路上有沒有人', 3200); }
};
// 把風：有人快看到你的時候，橘貓豎耳朵、喵一聲、轉頭看那個方向
NightScene.prototype.orangeLookout = function (dt) {
  const oc = this.orange, c = this.cat;
  for (const v of this.viewers) if (v && v.warnCD > 0) v.warnCD -= dt;
  if (!oc || oc.state !== 'follow' || oc.beh === 'sleep') return;
  this.lookT = (this.lookT || 0) - dt; if (this.lookT > 0) return; this.lookT = 0.2;
  if (c.home || c.hidden || c.inv > 0 || (c.top && this.onRoof()) || (c.box && !c.moving)) return;
  for (const v of this.viewers) {
    if (!v || !v.active() || v.susp > 0.25 || (v.warnCD || 0) > 0) continue;
    const [ex, ey] = v.eye(), tx = c.x, ty = c.y - 4;
    const d = dist(ex, ey, tx, ty), vr = v.range * (v.type === 'camera' ? 1 : this.visMult);
    if (d > vr * 1.7 || d < 6) continue;
    const ad = angDiff(Math.atan2(ty - ey, tx - ex), v.ang);
    let danger = d < vr * 1.45 && ad < v.half + 0.6 && !(d <= vr && ad <= v.half);
    if (!danger && v.type === 'npc' && v.moving && ad < 0.55) danger = true;
    if (!danger || !lineOfSight(this.map, ex, ey, tx, ty, this.occ)) continue;
    v.warnCD = 7;
    oc.warn = { v, t: 1.8 };
    oc.setEmote('ex', 1.1); oc.hop(0.25);
    oc.dir = Math.abs(ex - oc.x) > Math.abs(ey - oc.y) ? (ex < oc.x ? 'left' : 'right') : (ey < oc.y ? 'up' : 'down');
    SFX.tone(860, 0.12, { to: 640, vol: 0.12, type: 'sawtooth', vib: 6 });
    oc.say(this, '喵！', 1);
    if (!this.tips.lookout) { this.tips.lookout = 1; UI.toast('橘貓豎起耳朵：有人要往這邊看了！', 2800); }
    break;
  }
};

// ---------------------------------------------------------------
// 撒嬌的漫畫特寫（畫面左上角跳出來，不會擋住你溜過去）
// ---------------------------------------------------------------
// 把虎斑貓的特寫畫法換成橘色來畫
function orangeCloseup(routine, t, who, v, pen, k) {
  const save = {};
  for (const kk in ORANGE_PAL) { save[kk] = TAB[kk]; TAB[kk] = ORANGE_PAL[kk]; }
  const oldG = CAT_GEAR; CAT_GEAR = orangeGearFor(G.run);   // 橘貓穿自己的衣服（藍領巾、背包、披風）
  try {
    const lw = LEGS[who] ? who : 'lin';
    switch (routine) {
      case 'roll': return drawBellyArt2({ t, v: v === 1 ? 1 : 0, p: 1, mood: 'play', wigAmp: 1.2, open: 0.2 }, pen, k);
      case 'rub': return drawRubArt2({ t, v: 0, r: Math.sin(t * 6.5), mood: 'play' }, lw, pen, k);
      case 'headbutt': return drawRubArt2({ t, v: 1, r: Math.max(-0.2, Math.sin(t * 9)), mood: 'play' }, lw, pen, k);
      case 'maneki': return drawMeowArt2({ t, v: 1, open: Math.max(0, Math.sin(t * 5)) * 0.6, mood: 'play' }, pen, k);
      case 'gift': return drawMeowArt2({ t, v: 2, open: 0, mood: 'play' }, pen, k);
      default: return drawMeowArt2({ t, v: 0, open: 0.5, mood: 'happy' }, pen, k);
    }
  } finally { Object.assign(TAB, save); CAT_GEAR = oldG; }
}
class CharmCut {
  constructor(routine, key, faceKey, line, gift) {
    this.routine = routine; this.key = key; this.faceKey = faceKey; this.line = line; this.gift = gift;
    this.t = 0; this.dur = 3.6; this.art = null; this.artT = -1; this.v = Math.floor(Math.random() * 3);
  }
  get done() { return this.t >= this.dur; }
  slide() { return smooth(Math.min(1, this.t / 0.25)) - smooth(clamp((this.t - this.dur + 0.3) / 0.3, 0, 1)); }
  expr() { return this.t < 0.7 ? 'shock' : (ORANGE_FACE[this.key] || 'heart'); }
  // 追尾巴：用場景裡的橘貓圖，轉來轉去
  chaseImg() {
    const f = Math.floor(this.t * 8) % 4;
    return toonOrange(Object.assign(new Cat(0, 0), { moving: true, dir: ['right', 'down', 'left', 'up'][f], t: this.t + 0.001 }));
  }
  render3D(g, W, H) {
    const k0 = this.slide(); if (k0 <= 0.001) return;
    const pw = Math.min(W * 0.58, 250), ph = pw * 0.64;
    const x0 = 10 - (1 - k0) * (pw + 30), y0 = Math.max(126, H * 0.17);
    const t = this.t, s = pw / 104;
    g.save(); g.translate(x0 + pw / 2, y0 + ph / 2); g.rotate(-0.03);
    const L = -pw / 2, T = -ph / 2;
    g.fillStyle = CM.ink; g.fillRect(L - 4, T - 4, pw + 8, ph + 8);
    g.fillStyle = '#fff6e8'; g.fillRect(L - 1.5, T - 1.5, pw + 3, ph + 3);
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
    g.fillStyle = '#ffe9c8'; g.fillRect(L, T, pw, ph);
    g.save(); g.translate(-pw * 0.12, ph * 0.05); g.fillStyle = '#ffd4a0';
    for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + t * 0.5, a2 = a + 0.08; g.beginPath(); g.moveTo(Math.cos(a) * pw * 0.12, Math.sin(a) * pw * 0.12); g.lineTo(Math.cos(a) * pw, Math.sin(a) * pw); g.lineTo(Math.cos(a2) * pw, Math.sin(a2) * pw); g.closePath(); g.fill(); }
    g.restore();
    g.fillStyle = this.routine === 'rub' || this.routine === 'headbutt' ? '#d29a5f' : '#f7f1e6'; g.fillRect(L, T + ph * 0.84, pw, ph * 0.16);
    // 橘貓
    if (this.routine === 'chase') {
      const a = this.chaseImg(), sc = ph * 0.78 / (a.h * TU);
      const w = a.img.width / TK * sc, h = a.img.height / TK * sc;
      g.save(); g.translate(-pw * 0.12, T + ph * 0.86 + a.img.__pad * sc - h / 2);
      if (a.flip) g.scale(-1, 1);
      g.drawImage(a.img, -w / 2, -h / 2, w, h); g.restore();
      g.strokeStyle = 'rgba(160,80,20,0.55)'; g.lineWidth = 3;
      for (let i = 0; i < 3; i++) { const r = pw * (0.18 + i * 0.05), a0 = t * 9 + i * 2; g.beginPath(); g.arc(-pw * 0.12, T + ph * 0.56, r, a0, a0 + 1.2); g.stroke(); }
      CM.text(g, -pw * 0.12, T + ph * 0.14, '轉轉轉～', '#fff', Math.round(pw * 0.07), 1, { stroke: '#c46a2a', rot: -0.08 });
    } else {
      const kk = Math.max(2, Math.min(3, s * (R3.dpr || 2)));
      if (!this.art || t - this.artT >= 1 / 24) {
        const a = orangeCloseup(this.routine, t, this.key, this.v, VXR, kk);
        if (!this.art || this.art.width !== a.width || this.art.height !== a.height) this.art = makeCanvas(a.width, a.height);
        const ag = this.art.getContext('2d'); ag.clearRect(0, 0, a.width, a.height); ag.drawImage(a, 0, 0);
        this.artT = t; this.artK = kk;
      }
      const pad = VXR.pad, sx = s * 0.92, ox = L + 4 * sx, oy = T + 5 * sx;
      g.drawImage(this.art, ox + (1 - pad) * sx, oy - pad * sx, this.art.width / this.artK * sx, this.art.height / this.artK * sx);
      // 送花：嘴邊叼一朵小花
      if (this.routine === 'gift' && this.gift) {
        const ic = ART.icon(this.gift), iw = ic.w * TU * s * 1.35, ih = ic.h * TU * s * 1.35;
        g.save(); g.translate(ox + 44 * sx, oy + 41 * sx); g.rotate(0.9 + Math.sin(t * 4) * 0.08);
        g.drawImage(ic.img, -iw / 2, -ih * 0.75, iw, ih); g.restore();
      }
    }
    // 飄愛心（在左邊，不擋到貓臉）
    for (let i = 0; i < 4; i++) { const q = (t * 0.7 + i / 4) % 1; CM.emote(g, L + pw * (0.06 + (i % 2) * 0.07) + Math.sin(q * 6 + i) * 3, T + ph * (0.78 - q * 0.62), 'heart', s * 0.3, Math.sin(q * Math.PI)); }
    // 招式名稱
    g.fillStyle = 'rgba(29,21,38,0.82)'; g.fillRect(L, T + ph - ph * 0.2, pw, ph * 0.2);
    CM.text(g, L + pw * 0.04, T + ph - ph * 0.1, `橘貓・${ORANGE_ROUTINE_NAME[this.routine]}！`, '#ffcf8a', Math.round(pw * 0.068), 1, { align: 'left', stroke: '#2a1a40' });
    g.restore();
    // 鄰居的反應（右上小格）
    const iw = pw * 0.36, ih = iw * 0.86;
    g.save(); g.translate(L + pw - iw * 0.38, T + ih * 0.32); g.rotate(0.06);
    g.fillStyle = CM.ink; g.fillRect(-iw / 2 - 3, -ih / 2 - 3, iw + 6, ih + 6);
    const ex = this.expr();
    g.fillStyle = ex === 'shock' ? '#dfe8ff' : '#fff0c8'; g.fillRect(-iw / 2, -ih / 2, iw, ih);
    g.save(); g.beginPath(); g.rect(-iw / 2, -ih / 2, iw, ih); g.clip();
    if (this.faceKey) {
      const fc = toonFace(this.faceKey, ex, Math.floor(t * 6) % 2), fs = ih * 1.02 / (fc.height / TK);
      g.drawImage(fc, -fc.width / TK * fs / 2, ih / 2 - fc.height / TK * fs + 3, fc.width / TK * fs, fc.height / TK * fs);
    } else {
      // 小柴
      const d = toonDog({ dir: 'left', state: 'awake', barkT: t < 0.7 ? 1 : 0, moving: false, t });
      const sc = ih * 0.9 / (d.img.height / TK), w = d.img.width / TK * sc, h = d.img.height / TK * sc;
      g.drawImage(d.img, -w / 2, ih / 2 - h + 2, w, h);
    }
    g.restore();
    if (ex === 'shock') CM.emote(g, iw * 0.3, -ih * 0.18, 'ex', iw / 70);
    g.restore();
    // 對白泡泡
    const by = T + ih * 0.32 + ih * 0.62, bx = L + pw - iw * 0.5;
    const fs = Math.round(Math.min(14, pw * 0.058));
    g.font = `900 ${fs}px ${BOLD_FONT}`;
    const tw = Math.min(pw * 0.62, g.measureText(this.line).width + 16);
    g.fillStyle = '#fff'; g.strokeStyle = CM.ink; g.lineWidth = 2.5;
    CM.rr(g, bx - tw / 2, by, tw, fs + 12, 9); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(bx + 6, by + 1); g.lineTo(bx + 14, by - 8); g.lineTo(bx + 16, by + 1); g.closePath(); g.fill();
    CM.text(g, bx, by + (fs + 12) / 2 + 0.5, this.line, CM.ink, fs, 1, { stroke: '#ffffff' });
    g.restore();
  }
  // 2D 備援版
  render(ctx) {
    const k0 = this.slide(); if (k0 <= 0.001) return;
    const pw = 76, ph = 52, x = Math.round(4 - (1 - k0) * 90), y = 30;
    ctx.save();
    ctx.fillStyle = OUTLINE; ctx.fillRect(x - 2, y - 2, pw + 4, ph + 4);
    ctx.fillStyle = '#ffe9c8'; ctx.fillRect(x, y, pw, ph);
    const a = orangeCloseup(this.routine === 'chase' ? 'maneki' : this.routine, this.t, this.key, this.v, PXR, 1);
    ctx.drawImage(a, x - 6, y - 4, a.width * 0.85, a.height * 0.85);
    ctx.fillStyle = 'rgba(29,21,38,0.85)'; ctx.fillRect(x, y + ph - 11, pw, 11);
    ctx.font = '8px "Huninn", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffcf8a'; ctx.fillText('橘貓・' + ORANGE_ROUTINE_NAME[this.routine], x + 3, y + ph - 5.5);
    ctx.restore();
  }
}
