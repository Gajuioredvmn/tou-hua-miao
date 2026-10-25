// ================= 夜晚：潛行偷花 =================
const T = (tx, ty) => [(tx + 0.5) * TS, (ty + 0.5) * TS];

class NightNPC extends Human {
  constructor(key, cuteKey, o) {
    super(key, o.x, o.y, o.dir || 'down');
    this.type = 'npc'; this.cuteKey = cuteKey;
    this.route = o.route || []; this.loop = !!o.loop;
    this.bounds = o.bounds || null; this.home = o.home || null;
    this.baseSpeed = o.speed || 26; this.speed = this.baseSpeed;
    this.range = o.range || 4.6 * TS; this.half = o.half || 0.56;
    this.state = o.inside ? 'inside' : 'route'; this.hidden = !!o.inside;
    this.ri = 0; this.susp = 0; this.lookT = 0; this.lookBase = 0; this.petT = 0;
    this.returnInside = false; this.lastSeen = null; this.flash = o.flash !== false;
    if (!o.inside && this.route.length) this.goTo([this.route[0]], this.baseSpeed);
  }
  active() { return !this.hidden && this.state !== 'inside' && this.state !== 'pet' && this.state !== 'gohome'; }
  eye() { return [this.x + Math.cos(this.ang) * 3, this.y - 3 + Math.sin(this.ang) * 3]; }
  appearAt(p) { this.hidden = false; this.x = p[0]; this.y = p[1]; }
  startRoute() { this.hidden = false; this.state = 'route'; this.ri = 0; this.goTo([this.route[0]], this.baseSpeed); }
  goInside() {
    if (this.home) { this.state = 'gohome'; this.goTo([this.home], this.baseSpeed); }
    else { this.state = 'inside'; this.hidden = true; }
  }
  resume() {
    if (this.returnInside) { this.returnInside = false; this.goInside(); return; }
    if (!this.route.length) { this.state = 'idle'; return; }
    let best = 0, bd = 1e9;
    this.route.forEach((p, i) => { const d = dist(this.x, this.y, p[0], p[1]); if (d < bd) { bd = d; best = i; } });
    this.ri = best; this.state = 'route'; this.goTo([this.route[best]], this.baseSpeed);
  }
  clampPt(x, y, scene) {
    if (this.bounds) { const b = this.bounds; x = clamp(x, b[0], b[2]); y = clamp(y, b[1], b[3]); }
    // 目標是牆的話往自己這邊退
    for (let i = 0; i < 12 && scene.npcSolid(x, y); i++) { x = lerp(x, this.x, 0.25); y = lerp(y, this.y, 0.25); }
    return [x, y];
  }
  hear(x, y, scene, emote = true) {
    if (!this.active() || this.state === 'alert') return false;
    const p = this.clampPt(x, y, scene);
    this.state = 'investigate'; this.goTo([p], this.baseSpeed * 1.3);
    if (emote) this.setEmote('q', 1.0);
    return true;
  }
  update(dt, scene) {
    super.update(dt);
    if (this.state === 'inside') return;
    switch (this.state) {
      case 'route':
        if (this.stepPath(dt)) {
          this.ri++;
          if (this.ri >= this.route.length) {
            if (this.loop) this.ri = 0;
            else { this.goInside(); scene.onRouteEnd && scene.onRouteEnd(this); return; }
          }
          this.goTo([this.route[this.ri]], this.baseSpeed);
        }
        break;
      case 'investigate':
        if (this.stepPath(dt)) { this.state = 'look'; this.lookT = 2.6; this.lookBase = this.ang; }
        break;
      case 'look':
        this.moving = false; this.lookT -= dt;
        this.ang = this.lookBase + Math.sin((2.6 - this.lookT) * 2.3) * 0.95; this.dir = angToDir(this.ang);
        if (this.lookT <= 0) this.resume();
        break;
      case 'alert': {
        this.moving = false;
        if (this.lastSeen) {
          const [lx, ly] = this.lastSeen;
          const want = Math.atan2(ly - this.y, lx - this.x);
          this.ang = angLerp(this.ang, want, Math.min(1, dt * 6)); this.dir = angToDir(this.ang);
          const d = dist(this.x, this.y, lx, ly);
          if (d > 14) {
            const st = this.baseSpeed * 0.45 * dt;
            const nx = this.x + Math.cos(want) * st, ny = this.y + Math.sin(want) * st;
            const ok = !scene.npcSolid(nx, ny) && (!this.bounds || (nx >= this.bounds[0] && nx <= this.bounds[2] && ny >= this.bounds[1] && ny <= this.bounds[3]));
            if (ok) { this.x = nx; this.y = ny; this.moving = true; }
          }
        }
        if (this.susp < 0.12) { this.state = 'look'; this.lookT = 1.8; this.lookBase = this.ang; }
        break;
      }
      case 'pet':
        this.moving = false; this.petT -= dt;
        if (this.petT <= 0) { this.resume(); }
        break;
      case 'gohome':
        if (this.stepPath(dt)) { this.state = 'inside'; this.hidden = true; scene.sfxNear(this.x, this.y, 'door'); }
        break;
      case 'idle': this.moving = false; break;
    }
  }
}

class WindowWatcher {
  constructor() {
    this.type = 'window'; this.cuteKey = 'wang';
    this.wins = [[2, 21], [4, 21]]; this.wi = 0;
    this.state = 'tv'; this.t = rnd(3, 5); this.susp = 0;
    this.range = 5 * TS; this.half = 0.72; this.ang = Math.PI / 2; this.lastSeen = null;
  }
  eye() { const [tx, ty] = this.wins[this.wi]; return [(tx + 0.5) * TS, (ty + 1) * TS + 1]; }
  active() { return this.state === 'look'; }
  wake() {
    if (this.state === 'sleep') { this.state = 'wakepre'; this.t = 0.9; }
    else if (this.state === 'tv') { this.state = 'pre'; this.t = 0.5; }
  }
  update(dt, scene) {
    this.t -= dt;
    if (this.state === 'away') return;
    switch (this.state) {
      case 'tv':
        if (scene.time >= 1440) { this.state = 'sleep'; break; }
        if (this.t <= 0) { this.state = 'pre'; this.t = 0.9; this.wi = (this.wi + 1) % 2; }
        break;
      case 'pre': case 'wakepre':
        if (this.t <= 0) { this.state = 'look'; this.t = this.state === 'wakepre' ? 3.2 : 2.6; }
        break;
      case 'look':
        if (this.susp > 0.3) this.t = Math.max(this.t, 0.4);
        if (this.t <= 0) { this.state = scene.time >= 1440 ? 'sleep' : 'tv'; this.t = (scene.run.flags.wangSaw ? rnd(3, 5) : rnd(4.5, 7.5)) * (scene.event === 'rain' ? 1.3 : 1); }
        break;
    }
  }
  lit(tx) {
    if (this.state === 'sleep' || this.state === 'away') return null;
    const mine = this.wins[this.wi][0] === tx;
    if (this.state === 'tv') return mine ? 'tv' : 'warm';
    return 'warm';
  }
  face(tx) { return (this.state === 'pre' || this.state === 'look' || this.state === 'wakepre') && this.wins[this.wi][0] === tx; }
}

class SecurityCam {
  constructor(x, y, o = {}) {
    this.type = 'camera'; this.cuteKey = o.cuteKey || 'butler'; this.owner = o.owner || 'mansion';
    this.x = x; this.y = y; this.a0 = o.a0 !== undefined ? o.a0 : 2.55; this.a1 = o.a1 !== undefined ? o.a1 : 3.8; this.t = o.t0 || 0; this.ang = (this.a0 + this.a1) / 2;
    this.range = o.range || 6.6 * TS; this.half = o.half || 0.34; this.susp = 0; this.lastSeen = null; this.beep = 0;
    this.poleH = o.poleH !== undefined ? o.poleH : 1.45; this.wall = !!o.wall;
  }
  eye() { return [this.x, this.y]; }
  active() { return true; }
  update(dt, scene) {
    this.t += dt;
    if (this.susp > 0.3 && this.lastSeen) {
      const want = Math.atan2(this.lastSeen[1] - this.y, this.lastSeen[0] - this.x);
      this.ang = angLerp(this.ang, want, Math.min(1, dt * 4));
      this.beep -= dt; if (this.beep <= 0) { this.beep = 0.5; scene.sfxNear(this.x, this.y, 'q'); }
    } else {
      const k = (Math.sin(this.t * 0.95) + 1) / 2;
      this.ang = angLerp(this.ang, lerp(this.a0, this.a1, k), Math.min(1, dt * 5));
    }
  }
}

// 中秋夜在空地烤肉的鄰居：大多看著烤肉架，偶爾回頭看巷子
class PartyWatcher extends Human {
  constructor(key, x, y, faceAng, lookAng, delay) {
    super(key, x, y, angToDir(faceAng));
    this.type = 'party'; this.cuteKey = 'party';
    this.seat = [x, y]; this.base = faceAng; this.lookA = lookAng; this.ang = faceAng; this.dir = angToDir(faceAng);
    this.state = 'chat'; this.next = delay; this.lookT = 0; this.susp = 0; this.lastSeen = null; this.petT = 0;
    this.range = 4.2 * TS; this.half = 0.6;
  }
  active() { return !this.hidden && (this.state === 'look' || this.state === 'alert'); }
  eye() { return [this.x + Math.cos(this.ang) * 3, this.y - 3 + Math.sin(this.ang) * 3]; }
  hear(x, y) { if (this.state === 'chat') { this.state = 'look'; this.lookT = 2.4; this.lookA = Math.atan2(y - this.y, x - this.x); this.setEmote('q', 1); } }
  update(dt, scene) {
    super.update(dt);
    switch (this.state) {
      case 'chat':
        this.ang = angLerp(this.ang, this.base, Math.min(1, dt * 4)); this.dir = angToDir(this.ang);
        this.next -= dt; if (this.next <= 0) { this.state = 'look'; this.lookT = 2.8; }
        break;
      case 'look':
        this.lookT -= dt; this.ang = angLerp(this.ang, this.lookA + Math.sin((2.8 - this.lookT) * 1.6) * 0.6, Math.min(1, dt * 5)); this.dir = angToDir(this.ang);
        if (this.lookT <= 0 && this.susp < 0.3) { this.state = 'chat'; this.next = rnd(4, 8); }
        break;
      case 'alert':
        if (this.lastSeen) { const want = Math.atan2(this.lastSeen[1] - this.y, this.lastSeen[0] - this.x); this.ang = angLerp(this.ang, want, Math.min(1, dt * 6)); this.dir = angToDir(this.ang); }
        if (this.susp < 0.12) { this.state = 'look'; this.lookT = 1.8; }
        break;
      case 'pet':
        this.petT -= dt; if (this.petT <= 0) { this.state = 'chat'; this.next = rnd(3, 6); }
        break;
    }
  }
  resume() { this.x = this.seat[0]; this.y = this.seat[1]; this.state = 'chat'; this.next = rnd(3, 6); }
}

// 屋頂、牆頭、柵欄頂：可以走的高處（格子 → 高度）
let TOPGRID = null;
function topGrid(map) {
  if (TOPGRID) return TOPGRID;
  const g = [];
  for (let ty = 0; ty < map.h; ty++) g.push(new Array(map.w).fill(null));
  for (const b of NIGHT_HOUSES) for (let ty = b.z0; ty < b.z1; ty++) for (let tx = b.x0; tx < b.x1; tx++) g[ty][tx] = { h: b.h - 0.3, kind: 'roof', b };
  for (let ty = SHOP_FRONT.z0; ty < SHOP_FRONT.z1; ty++) for (let tx = SHOP_FRONT.x0; tx < SHOP_FRONT.x1; tx++) if (map.at(tx, ty) !== 'C') g[ty][tx] = { h: SHOP_FRONT.h - 0.3, kind: 'roof', b: SHOP_FRONT };
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) if (map.at(tx, ty) === 'f') g[ty][tx] = { h: 0.8, kind: 'fence' };
  TOPGRID = g; return g;
}

class NightScene {
  constructor(n) {
    this.kind = 'night'; this.n = n; this.run = G.run; this.rules = Object.assign({}, nightRulesFor(G.run, n));
    // 大宅警戒兩顆星：管家整晚在花園巡
    if (starsOf(G.run, 'mansion') >= 2) this.rules.butler = true;
    this.map = G.maps.night; this.bg = G.bg.night;
    this.time = NIGHT_START; this.end = NIGHT_END + 45 * this.run.upg.owl;
    this.fx = new FX(); this.mode = 'play'; this.timeScale = 1; this.waiting = false;
    this.cat = new Cat(7.5 * TS, 5.9 * TS);
    this.blocked = new Set(); this.occ = [];
    // 事件、能力
    this.event = this.rules.event || 'clear';
    const unlock = { climb: 2, box: 3, orange: 4 };
    // 第二個月起爬屋頂、紙箱都會了；橘貓要在老貓攤收過才會跟（第一個月第四晚是免費來幫忙）
    this.abil = new Set(Object.keys(unlock).filter(k => n >= unlock[k] || ((this.run.month || 1) > 1 && k !== 'orange')));
    this.boxes = this.abil.has('box') ? 3 : 0;
    // 橘貓夥伴：收了之後每晚都來；第四晚沒收也會來幫忙。體力＝今晚能下幾次指令
    this.hasOrange = this.abil.has('orange') || (this.run.upg.orange || 0) > 0;
    this.oranges = this.hasOrange ? orangeEnergy(this.run) : 0;
    this.initCatSkills();
    this.visMult = this.event === 'rain' || this.event === 'outage' ? 0.85 : 1;
    this.top = topGrid(this.map); this.topBlocked = new Set();
    for (const [tx, ty] of ROOF_TOWERS) this.topBlocked.add(tx + ',' + ty);
    // 盆栽：昨晚被偷的今晚只剩花梗
    const regrow = this.run.regrow || {}, ni = this.run.nightIdx || n;
    // （大宅有錢，蘭花被偷了隔天就補滿）
    this.pots = ALL_POTS.map((d, i) => { const p = new Pot(d); p.idx = i; p.top = !!d.top; if (regrow[i] === ni - 1 && d.owner !== 'mansion') { p.avail = false; p.regrowing = true; } return p; });
    for (const p of this.pots) (p.top ? this.topBlocked : this.blocked).add(p.tx + ',' + p.ty);
    // 鄰居學乖：警戒兩顆星的人家裝防貓設施；三顆星的人家門口貼告示、盯得更緊
    this.reacts = HEAT_OWNERS.filter(o => REACTIONS[o] && starsOf(this.run, o) >= 2);
    this.alert3 = HEAT_OWNERS.filter(o => starsOf(this.run, o) >= 3);
    this.heatHit = {}; this.seenWith = {}; this.raid = null;
    // 訂單
    this.orders = (this.run.orders && this.run.orders[n]) || [];
    this.objs = NIGHT_OBJECTS.map(d => Object.assign({}, d, { px: (d.x + 0.5) * TS, py: (d.y + 1) * TS - 1, used: false }));
    for (const o of this.objs) {
      this.blocked.add(o.x + ',' + o.y);
      if (o.k !== 'crates' || o.y < 42) this.occ.push({ x0: o.x * TS + 1, y0: o.y * TS + 1, x1: (o.x + 1) * TS - 1, y1: (o.y + 1) * TS - 1 });
    }
    this.bushes = [];
    for (let ty = 0; ty < this.map.h; ty++) for (let tx = 0; tx < this.map.w; tx++) {
      if (this.map.at(tx, ty) === 'b') this.bushes.push({ x: (tx + 0.5) * TS, y: (ty + 1) * TS, spr: G.S.bush[(tx * 7 + ty * 3) % G.S.bush.length] });
    }
    this.lamps = LAMPS.map(([tx, ty]) => ({ x: (tx + 0.5) * TS, y: (ty + 1) * TS - 1, hx: (tx + 0.5) * TS, hy: (ty + 1) * TS - 22 }));
    this.petals = []; this.deposited = []; this.petalsByType = {};
    this.stats = { caught: 0, cuteWin: 0, cuteFail: 0, petals: 0, knocks: 0, cuteCans: 0 };
    this.cuteCombo = 0;
    this.tips = {};

    // 林先生 + 小柴
    const linDoor = T(12, 12);
    this.lin = new NightNPC('lin', 'lin', {
      x: linDoor[0], y: linDoor[1], inside: true, home: linDoor, speed: 30,
      route: [T(11, 13), T(9, 13), T(7, 13), T(7, 40), T(7, 13), T(9, 13), T(11, 13), linDoor],
      bounds: [6 * TS, 11.5 * TS, 14 * TS - 2, 41 * TS],
    });
    this.dog = new Dog(12.4 * TS, 14.9 * TS); this.dogHome = [12.4 * TS, 14.9 * TS];
    this.linWalked = false;
    // 阿伯
    const boDoor = T(10, 32);
    this.bo = new NightNPC('bo', 'bo', {
      x: T(10, 33)[0], y: T(10, 33)[1], home: boDoor, speed: 20, loop: true,
      route: [T(10, 33), T(12, 33), T(12, 35), T(10, 35)],
      bounds: [10 * TS + 3, 32 * TS + 4, 14 * TS - 3, 37 * TS - 2],
    });
    this.boTea = 0; // 0 還沒、1 泡茶中、2 泡完
    // 王太太（窗邊）
    this.wang = new WindowWatcher();
    // 巡守隊（被偷過社區花圃後會多巡一次）
    this.patrolTimes = this.rules.patrol.slice();
    if (this.reacts.includes('public')) this.patrolTimes.push([1460, 1500]);
    this.patrolTimes.sort((a, b) => a[0] - b[0]);
    this.patrol = null;
    if (this.patrolTimes.length) {
      this.patrol = new NightNPC('chief', 'patrol', {
        x: T(7, 5)[0], y: T(7, 5)[1], inside: true, home: T(7, 5), speed: 34,
        route: [T(7, 7), T(7, 40), T(7, 6)],
        bounds: [1 * TS, 5 * TS, 14 * TS, 41.5 * TS],
      });
      this.patrolDone = this.patrolTimes.map(() => false);
    }
    // 大宅
    this.cam = new SecurityCam(11.5 * TS, 46.6 * TS);
    this.butler = null;
    if (this.rules.butler) {
      this.butler = new NightNPC('butler', 'butler', {
        x: T(2, 44)[0], y: T(2, 44)[1], speed: 22, loop: true,
        route: [T(2, 44), T(10, 44), T(11, 50), T(2, 50)],
        bounds: [1 * TS, 43 * TS, 14 * TS, 51 * TS - 2],
      });
    }
    // 感應燈：阿伯家（第二晚起）、王家（被偷過之後）
    this.motions = [];
    if (this.rules.boLight) this.motions.push({ owner: 'bo', on: 0, x: 12 * TS, y: 33 * TS, r: 3.2 * TS, rect: [10 * TS, 32 * TS, 14 * TS, 37 * TS], fx: 12.5, fz: 32.02 });
    if (this.reacts.includes('wang')) this.motions.push({ owner: 'wang', on: 0, x: 3 * TS, y: 23.6 * TS, r: 3.2 * TS, rect: [1 * TS, 22 * TS, 5 * TS, 26 * TS], fx: 3.5, fz: 22.02 });
    this.motion = this.motions.find(m => m.owner === 'bo') || null;
    // 林家的監視器（被偷過之後）
    this.linCam = this.reacts.includes('lin') ? new SecurityCam(12.55 * TS, 12.2 * TS, { a0: 1.75, a1: 3.0, range: 5.2 * TS, half: 0.36, cuteKey: 'lin', owner: 'lin', poleH: 1.55, wall: true, t0: 1.3 }) : null;
    // 阿伯的碎石（被偷過之後）
    this.gravel = this.reacts.includes('bo') ? [10 * TS, 32 * TS, 14 * TS, 37 * TS] : null;
    // 中秋烤肉
    this.party = [];
    if (this.event === 'bbq') {
      this.grill = [11.5 * TS, 22.5 * TS];
      this.blocked.add('11,22');
      this.party.push(new PartyWatcher('wang', 10.35 * TS, 22.7 * TS, 0, Math.PI, 2.5));
      this.party.push(new PartyWatcher('cust1', 12.65 * TS, 22.6 * TS, Math.PI, -2.3, 5.5));
      this.party.push(new PartyWatcher('cust2', 11.5 * TS, 23.75 * TS, -Math.PI / 2, 2.45, 8));
      this.wang.state = 'away';
    }
    // 下雨撐傘、停電大家拿手電筒
    for (const npc of [this.lin, this.bo, this.patrol, this.butler]) if (npc) { npc.umbrella = this.event === 'rain'; npc.torch = this.event === 'outage' || npc === this.bo || npc === this.patrol; }
    // 橘貓
    this.orange = this.hasOrange ? new OrangeCat(7.5 * TS, 6.7 * TS) : null;
    this.pcut = null; this.prankFx = null;

    this.viewers = [this.lin, this.bo, this.wang, this.cam];
    if (this.patrol) this.viewers.push(this.patrol);
    if (this.butler) this.viewers.push(this.butler);
    if (this.linCam) this.viewers.push(this.linCam);
    for (const p of this.party) this.viewers.push(p);
    this.cute = null; this.target = null; this.cricketT = 2;
    initNightPlus(this);
    Cam.zoom = 1; Cam.follow(this.cat.x, this.cat.y + View.h * 0.06, this.map, 0, true);
    if (R3.on) PREWARM.add([...warmCat(), ...warmPeople(['lin', 'bo'].concat(this.patrol ? ['chief'] : [], this.butler ? ['butler'] : [], this.party.map(p => p.key)), true)]);
    if (R3.on && this.orange) PREWARM.add(warmOrange());
    if (R3.on && this.abil.has('box')) for (let f = 0; f < 4; f++) PREWARM.add([() => toonCatBox({ moving: true, t: f / 8 + 0.001 }), () => toonCatBox({ moving: false, t: 0 })]);
    if (R3.on && this.event === 'rain') PREWARM.add(['lin', 'bo', 'chief', 'butler'].map(k => () => toonUmbrella(k)));
  }

  // ---------- 碰撞 ----------
  solid(x, y) {
    if (this.map.solidPx(x, y)) return true;
    return this.blocked.has(Math.floor(x / TS) + ',' + Math.floor(y / TS));
  }
  npcSolid(x, y) { return this.solid(x, y); }
  topAt(tx, ty) { return (ty >= 0 && ty < this.map.h && tx >= 0 && tx < this.map.w) ? this.top[ty][tx] : null; }
  topH(x, y) { const t = this.topAt(Math.floor(x / TS), Math.floor(y / TS)); return t ? t.h : 0; }
  catSolid(x, y, c) {
    if (c && c.top) { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return !this.topAt(tx, ty) || this.topBlocked.has(tx + ',' + ty); }
    return this.solid(x, y);
  }
  onRoof() { const c = this.cat; const t = c.top && this.topAt(Math.floor(c.x / TS), Math.floor((c.y - 2) / TS)); return !!(t && t.kind === 'roof'); }
  // 從地上爬得上去的地方：柵欄，或有鐵窗、冷氣的牆面
  climbable(tx, ty) {
    const t = this.topAt(tx, ty); if (!t || this.topBlocked.has(tx + ',' + ty)) return false;
    if (t.kind === 'fence') return true;
    const ch = this.map.at(tx, ty);
    if (ch === 'W' || ch === 'w') return true;
    return !!(t.b && t.b.ac === tx && ty === t.b.z1 - 1);
  }
  edgeNear(c, dx, dy) {
    const ctx = Math.floor(c.x / TS), cty = Math.floor((c.y - 3) / TS), cy = c.y - 3;
    if (dy < 0) return cy - cty * TS < 9;
    if (dy > 0) return (cty + 1) * TS - cy < 9;
    if (dx < 0) return c.x - ctx * TS < 9;
    return (ctx + 1) * TS - c.x < 9;
  }
  // 只看貓面對的方向：走向牆壁就會出現「爬」
  dirOrder(c) {
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    return [D[c.dir] || [0, 1]];
  }
  climbSpot() {
    const c = this.cat, ctx = Math.floor(c.x / TS), cty = Math.floor((c.y - 3) / TS);
    for (const [dx, dy] of this.dirOrder(c)) {
      const nx = ctx + dx, ny = cty + dy;
      if (!this.climbable(nx, ny) || !this.edgeNear(c, dx, dy)) continue;
      const t = this.topAt(nx, ny);
      return { kind: 'climb', x: (nx + 0.5) * TS, y: (ny + 0.5) * TS + 2.5, h: t.h, ref: { px: (nx + 0.5) * TS, py: (ny + 0.9) * TS, h: t.h } };
    }
    return null;
  }
  dropSpot() {
    const c = this.cat, ctx = Math.floor(c.x / TS), cty = Math.floor((c.y - 3) / TS);
    for (const [dx, dy] of this.dirOrder(c)) {
      const nx = ctx + dx, ny = cty + dy;
      if (this.topAt(nx, ny) || !this.edgeNear(c, dx, dy)) continue;
      const x = (nx + 0.5) * TS, y = (ny + 0.5) * TS + 3;
      if (this.solid(x - 4, y - 4) || this.solid(x + 4, y - 4) || this.solid(x - 4, y) || this.solid(x + 4, y)) continue;
      return { kind: 'drop', x, y, ref: { px: x, py: y, h: 0 } };
    }
    return null;
  }
  // 地上的格子找路（BFS），回傳一串格子中心
  groundPath(x0, y0, x1, y1) {
    const W = this.map.w, H = this.map.h;
    const s0 = [Math.floor(x0 / TS), Math.floor((y0 - 2) / TS)], s1 = [Math.floor(x1 / TS), Math.floor((y1 - 2) / TS)];
    const free = (tx, ty) => tx >= 0 && ty >= 0 && tx < W && ty < H && !this.solid((tx + 0.5) * TS, (ty + 0.5) * TS);
    const key = (tx, ty) => ty * W + tx;
    const prev = new Map([[key(...s0), -1]]), q = [s0];
    let found = false;
    for (let qi = 0; qi < q.length && qi < 900; qi++) {
      const [cx, cy] = q[qi];
      if (cx === s1[0] && cy === s1[1]) { found = true; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, k = key(nx, ny);
        if (prev.has(k) || (!free(nx, ny) && !(nx === s1[0] && ny === s1[1]))) continue;
        prev.set(k, key(cx, cy)); q.push([nx, ny]);
      }
    }
    if (!found) return null;
    const out = [];
    for (let k = key(...s1); k !== -1 && k !== key(...s0); k = prev.get(k)) out.push([(k % W + 0.5) * TS, (Math.floor(k / W) + 0.7) * TS]);
    out.reverse();
    if (out.length) out[out.length - 1] = [x1, y1];
    return out;
  }
  tanhuaState() { return this.time < 1440 ? 'tanhuaBud' : this.time < 1500 ? 'tanhua' : 'tanhuaDead'; }
  capacity() { return 1 + this.run.upg.mouth; }
  pawsMult() { return [1, 0.6, 0.3][this.run.upg.paws]; }
  sfxNear(x, y, name) { if (Cam.visible(x, y, 60)) SFX.play(name); }

  // ---------- 聲音事件 ----------
  noise(x, y, r, src) {
    if (this.event === 'rain') r *= src === 'cat' ? 0.6 : 0.85;
    if (src === 'cat') r *= noiseMulPlus(this, x, y);
    const masked = src === 'cat' && this.grill && dist(x, y, this.grill[0], this.grill[1]) < 5 * TS;
    this.fx.ring(x, y, r, src === 'cat' ? 'rgba(255,255,255,0.5)' : 'rgba(255,214,90,0.8)', src === 'cat' ? 0.5 : 0.9);
    if (!masked) for (const npc of [this.lin, this.bo, this.patrol, this.butler]) {
      if (!npc || !npc.active()) continue;
      if (dist(npc.x, npc.y, x, y) <= r) npc.hear(x, y, this);
    }
    if (!masked) for (const p of this.party) if (dist(p.x, p.y, x, y) <= r && src !== 'cat') p.hear(x, y);
    // 小柴：睡著被吵醒、散步時聽到
    if (this.dog.state !== 'gone' && dist(this.dog.x, this.dog.y, x, y) <= r && src === 'cat') this.dogAlert();
    // 王太太：在窗邊時馬上看，睡了被大聲吵醒
    const [wx, wy] = this.wang.eye();
    if (dist(wx, wy, x, y) <= Math.max(r, 7 * TS) && r >= 5 * TS) this.wang.wake();
    else if (this.wang.state === 'tv' && dist(wx, wy, x, y) <= r + 2 * TS) this.wang.wake();
  }
  dogAlert() {
    const d = this.dog;
    if (d.cool > 0 || d.charmT > 0) return;
    if (this.lv && this.lv.bribe && this.run.cans > 0) { bribeDog(this, d); return; }
    d.cool = 4; d.barkT = 1.2; d.emote = 'ex'; d.emoteT = 1.2;
    if (d.state === 'sleep') d.state = 'awake';
    d.dir = this.cat.x < d.x ? 'left' : 'right';
    this.sfxNear(d.x, d.y, 'bark');
    if (!this.tips.dog) { this.tips.dog = 1; UI.toast('小柴在叫！林先生要出來看了'); }
    this.fx.ring(d.x, d.y, 5 * TS, 'rgba(255,214,90,0.8)', 0.9);
    const L = this.lin;
    if (L.state === 'inside') {
      L.appearAt(L.home); L.returnInside = true; L.state = 'idle';
      this.sfxNear(L.x, L.y, 'door');
      L.hear(this.cat.x, this.cat.y, this);
    } else if (L.active()) {
      L.hear(this.cat.x, this.cat.y, this);
    }
  }

  // ---------- 主更新 ----------
  update(dt) {
    const c = this.cat;
    this.fx.update(dt);
    if (this.mode === 'cute') { this.updateCute(dt); this.followCam(dt); return; }
    if (this.mode === 'raid') { this.updateRaid(dt); this.followCam(dt); UI.nightHud(this); return; }
    if (this.mode !== 'play') { this.followCam(dt); return; }

    // 時間
    this.time += dt * MIN_PER_SEC * this.timeScale;
    this.schedules();
    if (this.time >= this.end) { this.finish(true); return; }

    const sub = this.timeScale > 1 ? 3 : 1;
    const sdt = dt * this.timeScale / sub;
    for (let i = 0; i < sub; i++) this.simulate(i === 0 ? dt : 0, sdt);
    this.followCam(dt);
    this.cricketT -= dt; if (this.cricketT <= 0) { this.cricketT = rnd(1.5, 4); SFX.play('cricket'); }
    UI.nightHud(this);
  }
  simulate(realDt, dt) {
    const c = this.cat;
    if (realDt > 0) {
      c.move(realDt, this);
      if (c.moving && this.waiting) this.stopWait();
      if (c.inv > 0) c.inv -= realDt;
      // 狀態
      const tile = this.map.at(Math.floor(c.x / TS), Math.floor((c.y - 2) / TS));
      c.hidden = tile === 'b' && !c.top;
      c.home = tile === 'C' && !c.top;
      if (c.box) { c.box.t += realDt; if (c.box.t > 15) { c.box = null; this.fx.text(c.x, c.y - 14, '啪！', '#e8c08a'); UI.toast('紙箱撐不住，破掉了！'); SFX.play('knock'); } }
      if (this.orange) {
        this.orange.update(realDt, this);
        this.orangeLookout(realDt); this.orangeSeen(realDt);
        if (!this.tips.ocIntro) { this.tips.ocIntro = 1; if (!this.run.flags.ocMet) { this.run.flags.ocMet = 1; setTimeout(() => { if (this.mode === 'play') UI.toast('橘貓夥伴跟你出門了！按「橘貓」下指令，牠也會幫你把風', 3600); }, 900); } }
      }
      if (this.pcut) { this.pcut.t += realDt; if (this.pcut.done) this.pcut = null; }
      if (this.prankFx) { this.prankFx.t += realDt; if (this.prankFx.t > 1.4) this.prankFx = null; }
      if (c.hidden && !this.tips.bush) { this.tips.bush = 1; UI.toast('躲進草叢，鄰居就看不到你。也可以「母雞蹲」快轉時間'); }
      if (c.home) this.depositAll();
      this.catNoise(realDt);
      this.findTarget();
    }
    this.updateNPCs(dt);
    updateNightPlus(this, dt, realDt);
    this.detect(dt);
  }
  stopWait() { this.waiting = false; this.timeScale = 1; if (this.cat.pose === 'loaf') this.cat.pose = null; UI.setWait(this.cat.hidden || this.cat.home, false); }

  schedules() {
    const t = this.time;
    // 林先生 23:00 遛狗
    if (!this.linWalked && t >= 1380) {
      this.linWalked = true;
      const L = this.lin;
      if (L.state === 'inside' || L.returnInside) { L.returnInside = false; L.appearAt(L.home); L.startRoute(); this.sfxNear(L.x, L.y, 'door'); }
      this.dog.state = 'walk';
    }
    // 阿伯 00:30–00:50 泡茶
    if (this.boTea === 0 && t >= 1470) {
      this.boTea = 1; this.bo.returnInside = false; this.bo.goInside();
    }
    if (this.boTea === 1 && t >= 1490) {
      this.boTea = 2; this.bo.appearAt(this.bo.home); this.bo.state = 'idle'; this.bo.resume(); this.sfxNear(this.bo.x, this.bo.y, 'door');
    }
    // 巡守隊
    if (this.patrol) {
      this.patrolTimes.forEach(([s, e], i) => {
        if (!this.patrolDone[i] && t >= s) {
          this.patrolDone[i] = true;
          const P = this.patrol;
          if (P.state === 'inside') { P.appearAt(P.home); P.startRoute(); }
          if (Cam.visible(P.x, P.y, 200)) UI.toast('巡守隊來了！');
        }
      });
    }
  }
  onRouteEnd(npc) {
    if (npc === this.lin) { this.dog.state = 'home'; }
  }

  updateNPCs(dt) {
    const c = this.cat;
    this.lin.update(dt, this); this.bo.update(dt, this);
    if (this.patrol) this.patrol.update(dt, this);
    if (this.butler) this.butler.update(dt, this);
    this.wang.update(dt, this); this.cam.update(dt, this);
    if (this.linCam) this.linCam.update(dt, this);
    for (const p of this.party) p.update(dt, this);
    // 小柴
    const d = this.dog; d.update(dt);
    if (d.charmT > 0) d.charmT -= dt;
    if (d.state === 'walk') {
      const L = this.lin;
      const ahead = L.moving ? 9 : 6;
      const tx = L.x + Math.cos(L.ang) * ahead + 3, ty = L.y + Math.sin(L.ang) * ahead + 1;
      const dx = tx - d.x, dy = ty - d.y; const dd = Math.hypot(dx, dy);
      d.moving = dd > 1.5;
      if (dd > 0.5) { const k = Math.min(1, dt * 6); d.x += dx * k; d.y += dy * k; }
      if (Math.abs(dx) > 0.4) d.dir = dx < 0 ? 'left' : 'right';
      if (L.hidden) { d.state = 'home'; }
    } else if (d.state === 'home' || d.state === 'awake') {
      const [hx, hy] = this.dogHome;
      const dx = hx - d.x, dy = hy - d.y, dd = Math.hypot(dx, dy);
      if (dd > 1) { d.moving = true; const st = Math.min(dd, 40 * dt); d.x += dx / dd * st; d.y += dy / dd * st; d.dir = dx < 0 ? 'left' : 'right'; }
      else { d.moving = false; if (d.cool <= 0 && d.barkT <= 0) d.state = 'sleep'; }
    }
    // 小柴的鼻子
    const frag = c.carry.filter(f => FLOWERS[f.t].fragrant).length;
    if (frag > 0 && d.state !== 'gone' && !(d.charmT > 0)) {
      const r = (d.state === 'sleep' ? 2.0 : 2.6) * TS + (frag - 1) * 1.2 * TS;
      if (dist(d.x, d.y, c.x, c.y) < r && !c.home) {
        if (!this.tips.smell) { this.tips.smell = 1; UI.toast('小柴聞到花香了！'); }
        this.dogAlert();
      }
    }
    // 感應燈
    for (const m of this.motions) {
      if (m.on > 0) m.on -= dt;
      const [x0, y0, x1, y1] = m.rect;
      if (!c.top && c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1 && m.on <= 0.5) {
        if (m.on <= 0) { this.sfxNear(m.x, m.y, 'light'); if (!this.tips.motion) { this.tips.motion = 1; UI.toast('感應燈亮了！'); } }
        m.on = 5;
        if (m.owner === 'bo' && this.bo.active()) { this.bo.susp = Math.max(this.bo.susp, 0.4); this.bo.lastSeen = [c.x, c.y]; this.bo.state = 'alert'; }
        if (m.owner === 'wang') {
          const pw = this.party.find(p => p.key === 'wang');
          if (pw) pw.hear(m.x, m.y);
          else { this.wang.wake(); if (this.wang.state === 'look') { this.wang.susp = Math.max(this.wang.susp, 0.4); this.wang.lastSeen = [c.x, c.y]; } }
        }
      }
    }
  }
  // 橘貓撒嬌：把人（或狗）引開
  // 每次演出不一樣（不會連續重複），左上角跳出漫畫特寫
  charm(T, oc) {
    SFX.play('meow'); setTimeout(() => SFX.play('purr'), 300);
    this.fx.hearts(T.x, T.y - 18, 5);
    const dog = T === this.dog;
    const pool = ORANGE_ROUTINES.filter(r => r !== ORANGE_LAST && !(dog && (r === 'rub' || r === 'headbutt')));
    const routine = CharmCut.force || pick(pool); ORANGE_LAST = routine;   // force：測試用
    oc.routine = routine; oc.rt = 0; oc.lastBump = -1; oc.orbA = Math.atan2(oc.y - T.y, oc.x - T.x);
    oc.gift = routine === 'gift' ? pick(['periwinkle', 'bougain', 'jasmine']) : null;
    const key = dog ? 'dog' : T.cuteKey;
    this.pcut = new CharmCut(routine, key, dog ? null : T.key, pick(ORANGE_LINES[key] || ORANGE_LINES.wang), oc.gift);
    if (dog) { T.charmT = 6; T.barkT = 0; T.cool = 6; T.emote = 'heart'; T.emoteT = 1.6; }
    else { T.state = 'pet'; T.petT = 6; T.susp = 0; T.path = []; T.moving = false; T.setEmote('heart', 1.6); }
    if (!this.tips.charm) { this.tips.charm = 1; UI.toast('橘貓撒嬌中！趁現在溜過去'); }
  }

  catNoise(dt) {
    const c = this.cat;
    // 阿伯的碎石：慢慢走也會沙沙響
    if (this.gravel && !c.top && !c.jump && c.moving && !c.running && !(this.lv && this.lv.catwalk >= 2)) {
      const [x0, y0, x1, y1] = this.gravel;
      if (c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1) {
        c.gravelT = (c.gravelT || 0) - dt;
        if (c.gravelT <= 0) { c.gravelT = 0.55; this.noise(c.x, c.y - 3, 2.6 * TS, 'cat'); SFX.play('step'); if (!this.tips.gravel) { this.tips.gravel = 1; UI.toast('碎石沙沙響！慢慢走也會被聽到'); this.fx.text(c.x, c.y - 14, '沙沙…', '#e8dcc0'); } }
      }
    }
    if (c.running && !c.jump) {
      c.noiseT -= dt;
      if (c.noiseT <= 0) { c.noiseT = 0.45; const gv = this.gravel && !c.top && c.x > this.gravel[0] && c.x < this.gravel[2] && c.y > this.gravel[1] && c.y < this.gravel[3]; this.noise(c.x, c.y - 3, 3.4 * TS * this.pawsMult() * (gv ? 1.3 : 1), 'cat'); SFX.play('step'); }
      if (c.carry.length) {
        c.petalT -= dt;
        if (c.petalT <= 0) {
          c.petalT = 0.3;
          const chance = [0.6, 0.3, 0][this.run.upg.gentle];
          if (Math.random() < chance) {
            const f = c.carry[Math.floor(Math.random() * c.carry.length)];
            f.fresh = Math.max(0.4, f.fresh - 0.06);
            const col = FLOWERS[f.t].color;
            this.petals.push({ x: c.x + rnd(-4, 4), y: c.y - rnd(0, 3), col, r: Math.random() < 0.5, base: c.h || 0 });
            this.stats.petals++; this.run.stats.petals++;
            this.petalsByType[f.t] = (this.petalsByType[f.t] || 0) + 1;
            SFX.play('petal');
            if (!this.tips.petal) { this.tips.petal = 1; UI.toast('叼著花奔跑會掉花瓣，花會變便宜'); }
          }
        }
      }
    } else { c.noiseT = Math.min(c.noiseT, 0.15); }
  }

  // 看不看得到貓
  litAt(x, y) {
    for (const l of this.lamps) { if (this.event === 'outage' && l.y < 42 * TS) continue; if (dist(l.hx, l.hy + 14, x, y) < 2.7 * TS) return true; }
    for (const m of this.motions) if (m.on > 0 && dist(m.x, m.y, x, y) < m.r * 0.8) return true;
    return false;
  }
  canSee(v) {
    const c = this.cat;
    if (c.home || c.inv > 0 || c.jump) return false;
    if (!v.active()) return false;
    if (this.lookUp && v.type !== 'camera') return false;   // 流星雨：大家都在看天空
    if (c.top && this.onRoof()) return false;          // 地上的人不會往屋頂看
    if (c.box && !c.moving) return false;              // 只是一個紙箱
    const [ex, ey] = v.eye();
    const tx = c.x, ty = c.y - 4;
    const d = dist(ex, ey, tx, ty);
    const lit = this.litAt(tx, ty);
    const vr = v.range * (v.type === 'camera' ? 1 : this.visMult);
    const range = lit ? Math.max(vr, 6 * TS) : vr;
    if (d > range) return false;
    const half = lit && d > vr ? v.half + 0.3 : v.half;
    if (angDiff(Math.atan2(ty - ey, tx - ex), v.ang) > half) return false;
    if (c.hidden && d > 14) return false;
    return lineOfSight(this.map, ex, ey, tx, ty, this.occ);
  }
  detect(dt) {
    const c = this.cat;
    for (const v of this.viewers) {
      if (!v) continue;
      if ((v.type === 'npc' || v.type === 'party') && !v.active()) { v.susp = Math.max(0, v.susp - dt); continue; }
      if (this.canSee(v)) {
        const [ex, ey] = v.eye();
        const d = dist(ex, ey, c.x, c.y - 4);
        let rate = 0.95 * (1.5 - 0.9 * Math.min(1, d / v.range));
        rate *= c.running ? 1.45 : c.moving ? 0.85 : 0.6;
        if (c.box) { rate *= 1.25; if (!this.tips.boxSeen && v.susp > 0.2) { this.tips.boxSeen = 1; UI.toast('「那個箱子……剛剛是不是動了？」不動就沒事'); } }
        const litC = this.litAt(c.x, c.y);
        if (litC) rate *= 1.2;
        rate *= detectMulPlus(this, litC);
        if (this.alert3.length && this.alert3.includes(ownerOfViewer(v))) rate *= 1.25;
        const before = v.susp;
        v.susp = Math.min(1, v.susp + rate * dt);
        v.lastSeen = [c.x, c.y];
        if (before < 0.35 && v.susp >= 0.35) {
          this.sfxNear(ex, ey, 'q');
          if (v.type === 'npc' || v.type === 'party') { v.state = 'alert'; v.path = []; }
          const ow = ownerOfViewer(v);
          if (ow && !this.seenWith[ow] && c.carry.some(f => f.pot && f.pot.owner === ow)) { this.seenWith[ow] = 1; this.heatEvent(ow, HEAT.seen, 'seen'); }
        }
        if (this.waiting && v.susp > 0.3) this.stopWait();
        if (v.susp >= 1) { this.startCute(v); return; }
      } else {
        v.susp = Math.max(0, v.susp - 0.38 * dt);
      }
    }
  }

  // ---------- 互動 ----------
  findTarget() {
    const c = this.cat;
    let best = null, bd = 17;
    const cx = c.x, cy = c.y - 4;
    for (const p of this.pots) {
      if (!p.avail || p.gone || p.top !== c.top) continue;
      const d = dist(cx, cy, p.x, p.y - 6);
      if (d < bd) { bd = d; best = { kind: 'pot', ref: p }; }
    }
    if (!best && this.abil.has('climb') && !c.jump) best = c.top ? this.dropSpot() : this.climbSpot();
    if (!best && !c.top) {
      bd = 17;
      for (const o of this.objs) {
        if (!(o.knock && !o.used) && !o.jump) continue;
        const d = dist(cx, cy, o.px, o.py - 6);
        if (d < bd) { bd = d; best = { kind: o.jump ? 'jump' : 'knock', ref: o }; }
      }
    }
    if (!best) { const tt = this.tunnelTarget(cx, cy); if (tt) best = tt; }
    if (c.home) best = { kind: 'home' };
    this.target = best;
    let label = null;
    if (best) {
      if (best.kind === 'pot') label = c.carry.length >= this.capacity() ? '嘴巴滿了' : '叼';
      else if (best.kind === 'knock') label = '撥';
      else if (best.kind === 'jump') label = '跳';
      else if (best.kind === 'climb') label = '爬';
      else if (best.kind === 'drop') label = '跳下';
      else if (best.kind === 'home') label = '收工';
      else if (best.kind === 'tunnel') label = '鑽';
      if (best.kind === 'climb' && !this.tips.climb) { this.tips.climb = 1; UI.toast('按「爬」從鐵窗、柵欄爬上去！屋頂上地面的人看不到你', 3200); }
      if (best.kind === 'knock' && !this.tips.knock) { this.tips.knock = 1; UI.toast('按「撥」把它弄倒，聲音能把人引過去'); }
    }
    UI.setAction(this.mode === 'play' ? label : null);
    UI.setWait(this.mode === 'play' && (c.hidden || c.home), this.waiting);
    const sk = [];
    if (this.mode === 'play' && this.abil.has('box')) sk.push({ id: 'box', label: c.box ? '出來' : '紙箱', n: this.boxes, on: !!c.box, off: !c.box && this.boxes <= 0 });
    this.catSkillButtons(sk);
    if (this.mode === 'play' && this.orange) sk.push({ id: 'orange', label: '橘貓', n: this.oranges, on: this.orange.state !== 'follow', off: this.oranges <= 0 || this.orange.state !== 'follow' });
    // 在花店貓門：紙箱用不到，換成「熟門熟路」
    if (this.mode === 'play' && c.home && raidUnlocked(this.run) && masteredList(this.run).length) { const ok = this.raidOptions().filter(o => o.ok).length; const i = sk.findIndex(x => x.id === 'box'); const it = { id: 'raid', label: '熟門', n: ok, off: !ok }; if (i >= 0 && !c.box) sk[i] = it; else sk.unshift(it); if (sk.length > 3) sk.length = 3; }
    UI.setSkills(sk);
  }
  // 能力按鈕：紙箱、橘貓
  onSkill(id) {
    if (this.mode !== 'play') return;
    const c = this.cat;
    if (id === 'box' && this.abil.has('box')) {
      if (c.box) { c.box = null; SFX.play('door'); return; }
      if (this.boxes <= 0) { SFX.play('nope'); UI.toast('今晚的紙箱用完了'); return; }
      if (c.top || c.jump) { SFX.play('nope'); return; }
      this.boxes--; c.box = { t: 0 }; c.pose = null; SFX.play('door');
      this.fx.text(c.x, c.y - 14, '躲！', '#e8c08a');
      if (!this.tips.box) { this.tips.box = 1; UI.toast('紙箱裡不動，大家只會看到一個箱子。在人家眼前移動會很可疑！', 3400); }
    } else if (id === 'orange' && this.orange) {
      this.orangeOrder();
    } else if (id === 'call') {
      this.doCall();
    } else if (id === 'raid' && c.home && raidUnlocked(this.run)) {
      this.openRaid();
    }
  }
  onAction() {
    if (this.mode !== 'play') return;
    const c = this.cat, tg = this.target;
    if (!tg || c.jump) return;
    if (tg.kind === 'pot') {
      const p = tg.ref;
      if (p.t === 'lily') { SFX.play('nope'); UI.toast('百合碰不得！現實中百合連花粉對貓都有劇毒'); return; }
      if (p.t === 'tanhua') {
        const st = this.tanhuaState();
        if (st === 'tanhuaBud') { SFX.play('nope'); UI.toast('曇花還是花苞，00:00 才會開'); return; }
        if (st === 'tanhuaDead') { SFX.play('nope'); UI.toast('曇花已經謝了……一個小時就謝'); return; }
      }
      if (c.carry.length >= this.capacity()) { SFX.play('nope'); UI.toast('嘴巴滿了，先帶回花店（老貓攤可以升級「大嘴巴」）'); return; }
      p.avail = false;
      c.carry.push({ t: p.t, fresh: 1, pot: p });
      SFX.play('pick');
      const f = FLOWERS[p.t];
      this.fx.text(p.x, p.y - 16, f.name, '#ffe2ea', 1.4, p.top ? 0.75 + this.topH(p.x, p.y - 2) * Math.cos(0.64) : undefined);
      if (!this.tips.carry) { this.tips.carry = 1; UI.toast('叼到了！帶回花店門口的貓門才算數'); }
      // 偷別人家的花，被聽見的機會
      this.noise(p.x, p.y - 4, 1.4 * TS, 'cat');
    } else if (tg.kind === 'knock') {
      const o = tg.ref; o.used = true; this.stats.knocks++;
      if (o.knock === 'trash') {
        SFX.play('knock'); this.noise(o.px, o.py - 4, 7 * TS, 'obj');
        this.fx.text(o.px, o.py - 14, '鏗鏘！', '#ffd25a');
      } else {
        SFX.play('scooter'); this.noise(o.px, o.py - 4, 9 * TS, 'obj');
        this.fx.text(o.px, o.py - 14, '嗶嗶嗶！', '#ffd25a');
        setTimeout(() => { if (this.mode === 'play') this.fx.ring(o.px, o.py - 4, 9 * TS, 'rgba(255,214,90,0.8)', 0.9); }, 600);
      }
      vibrate(30);
    } else if (tg.kind === 'jump') {
      const o = tg.ref;
      if (o.jump.need && !this.run.upg.jump) { SFX.play('nope'); UI.toast('圍牆太高了……老貓攤的「跳高高」學會就翻得過去'); return; }
      const [jx, jy] = o.jump.to;
      c.box = null;
      c.jump = { x0: c.x, y0: c.y, x1: jx * TS, y1: jy * TS, t: 0, dur: 0.55 };
      c.dir = jy > o.y ? 'down' : 'up';
      SFX.play('jump');
      if (o.jump.need && !this.tips.mansion) { this.tips.mansion = 1; UI.toast('進到大宅了！小心監視器'); }
    } else if (tg.kind === 'climb') {
      c.box = null;
      c.jump = { x0: c.x, y0: c.y, x1: tg.x, y1: tg.y, t: 0, dur: 0.45, h0: c.h, h1: tg.h, top: true, hopPx: 9 };
      SFX.play('jump');
      if (!this.tips.roof && tg.h > 1.2) { this.tips.roof = 1; setTimeout(() => UI.toast('在屋頂上！屋頂也有盆花。按「跳下」回地面', 3000), 500); }
    } else if (tg.kind === 'drop') {
      c.jump = { x0: c.x, y0: c.y, x1: tg.x, y1: tg.y, t: 0, dur: 0.42, h0: c.h, h1: 0, top: false, hopPx: 6 };
      SFX.play('jump');
    } else if (tg.kind === 'tunnel') {
      this.useTunnel(tg.i);
    } else if (tg.kind === 'home') {
      UI.confirm('今晚收工？', '回花店睡覺，結算今晚的花。', '收工', '再偷一下', ok => { if (ok) this.finish(false); });
    }
  }
  onWait() {
    if (this.mode !== 'play') return;
    const c = this.cat;
    if (this.waiting) { this.stopWait(); return; }
    if (!(c.hidden || c.home)) return;
    this.waiting = true; this.timeScale = 5; c.pose = 'loaf'; SFX.play('purr');
    UI.setWait(true, true);
  }
  depositAll() {
    const c = this.cat, oc = this.orange;
    const theirs = oc && oc.carry.length && oc.state === 'follow' && dist(oc.x, oc.y, c.x, c.y) < 3 * TS ? oc.carry : [];
    if (!c.carry.length && !theirs.length) return;
    const all = c.carry.concat(theirs);
    let v = 0;
    const book = bookOf(this.run), fresh = [];
    for (const f of all) {
      this.deposited.push({ t: f.t, fresh: f.fresh, owner: f.pot.owner, idx: f.pot.idx }); v += flowerValue(this.run, f.t, f.fresh);
      if (!book.flowers[f.t]) fresh.push(f.t);
      book.flowers[f.t] = (book.flowers[f.t] || 0) + 1;
    }
    // 第一次偷到的花：收進圖鑑
    if (fresh.length) setTimeout(() => UI.toast('新的花收進圖鑑：' + [...new Set(fresh)].map(t => FLOWERS[t].name).join('、'), 2600), 2700);
    const names = all.map(f => FLOWERS[f.t].name).join('、') + (theirs.length ? '（橘貓叼了' + theirs.map(f => FLOWERS[f.t].name).join('、') + '）' : '');
    const types = all.map(f => f.t);
    c.carry = []; if (theirs.length) { oc.carry = []; oc.setEmote('heart', 1.2); }
    SFX.play('drop');
    this.fx.text(c.x, c.y - 16, '+' + money(v), '#ffd25a');
    this.checkOrders(types);
    if (!this.tips.home) { this.tips.home = 1; UI.toast('放進店裡：' + names + '。可以再出門，或按「收工」結束今晚', 3600); }
    else UI.toast('放進店裡：' + names);
  }

  checkOrders(types) {
    for (const o of this.orders) {
      if (!types.includes(o.t)) continue;
      const got = this.deposited.filter(f => f.t === o.t).length;
      if (o.mode === 'all' && got >= o.n && !o.doneAt) { o.doneAt = this.time; SFX.play('heart'); setTimeout(() => UI.toast('訂單湊齊了！' + o.who + '的' + FLOWERS[o.t].name + ' ×' + o.n, 2600), 900); }
      if (o.mode === 'each' && got <= o.n) { SFX.play('coin'); setTimeout(() => UI.toast(o.who + '的' + FLOWERS[o.t].name + ' ' + got + '/' + o.n + '（每朵 +' + money(o.reward) + '）', 2600), 900); }
    }
  }

  // ---------- 被發現：賣萌 ----------
  startCute(v) {
    const c = this.cat;
    this.mode = 'cute'; this.stopWait(); Input.release();
    this.stats.caught++; this.run.stats.caught++;
    let actor = v;
    if (v.type === 'window') {
      actor = this.tempActor('wang');
    } else if (v.type === 'camera') {
      SFX.play('alarm');
      if (v.cuteKey === 'lin') { actor = this.lin; if (actor.state === 'inside' || actor.hidden) actor.returnInside = true; }
      else actor = this.butler || this.tempActor('butler');
    }
    if (actor !== v || v.type !== 'npc' || dist(actor.x, actor.y, c.x, c.y) > 22) {
      // 把人放到貓旁邊（像是衝過來）
      const pref = actor.hidden ? (c.x < 7.5 * TS ? 1 : -1) : (actor.x < c.x ? -1 : 1);
      const cand = [[c.x + pref * 16, c.y], [c.x - pref * 16, c.y], [c.x, c.y + 14], [c.x, c.y - 14], [c.x + pref * 10, c.y + 10]];
      let spot = cand.find(([px, py]) => !this.solid(px, py) && !this.solid(px - 3, py - 3) && !this.solid(px + 3, py - 3));
      if (!spot) spot = [c.x + pref * 8, c.y];
      actor.hidden = false; actor.x = spot[0]; actor.y = spot[1];
    }
    if (actor.state !== undefined) { actor.state = 'idle'; actor.path = []; }
    actor.face(c.x, c.y); actor.moving = false;
    c.dir = actor.x < c.x ? 'left' : 'right'; c.moving = false;
    actor.setEmote('ex', 1.5);
    SFX.play('ex'); vibrate([60, 40, 60]);
    // 橘貓在旁邊：雙貓合體，輸一回合可以讓牠救場
    const oc = this.orange, assist = !!(oc && oc.state === 'follow' && dist(oc.x, oc.y, c.x, c.y) < 6 * TS);
    if (oc && oc.state === 'follow') { oc.endBeh(this, false); oc.ws = null; oc.warn = null; oc.pose = 'loaf'; oc.act = null; oc.dir = oc.x < c.x ? 'right' : 'left'; }
    this.cute = { v, actor, key: v.cuteKey, phase: 'choose', t: 0, assist };
    Cam.zoom = 2;
    const info = CUTE[v.cuteKey];
    const known = info.intel ? !!this.run.intel[info.intel] : true;
    const opts = CUTE_MOVES.map(m => ({ id: m.id, name: m.name, key: m.key, p: this.cuteChance(v.cuteKey, m.id) }));
    UI.cuteChoice(info.name, opts, known, this.run.immune[v.cuteKey] || 0, id => this.resolveCute(id), this.cuteCombo, assist);
  }
  tempActor(key) {
    if (!this.temps) this.temps = {};
    if (!this.temps[key]) { const h = new NightNPC(key, key, { x: 0, y: 0, inside: true }); h.state = 'idle'; this.temps[key] = h; }
    return this.temps[key];
  }
  cuteChance(key, move) {
    const info = CUTE[key];
    return clamp(info.base[move] + 0.12 * this.run.upg.cute - 0.22 * (this.run.immune[key] || 0) + (this.event === 'bbq' ? 0.15 : 0), 0.05, 0.95);
  }
  // 選了招式：開始賣萌小遊戲（要操作，做得好才成功）
  resolveCute(move) {
    const cu = this.cute; if (!cu || cu.phase !== 'choose') return;
    const p = this.cuteChance(cu.key, move);
    cu.move = move; cu.phase = 'game'; cu.t = 0; cu.ok = null;
    const c = this.cat;
    const game = this.cutin = new CuteGame(move, cu.key, cu.actor.key || cu.key, p, { assist: cu.assist });
    Input.stick = null; Input.showStick(false);
    Input.game = (type, a) => game.input(type, a);
    if (move === 'belly') { c.pose = 'belly'; }
    else if (move === 'meow') { c.pose = 'meow'; }
    else { c.pose = 'rub'; c.wiggle = 1; cu.rubFrom = [c.x, c.y]; }
  }
  updateCute(dt) {
    const cu = this.cute; if (!cu) return;
    cu.actor.update(dt, this);
    this.cat.t += dt;
    if (cu.phase === 'choose') { this.cat.moving = false; return; }
    cu.t += dt;
    const c = this.cat, a = cu.actor, game = this.cutin;
    if (game) game.update(dt);
    // 橘貓跳出來救場
    if (game && game.assistUsed && !cu.assistSeen && this.orange) {
      cu.assistSeen = true;
      const oc = this.orange, side = c.dir === 'left' ? 1 : -1, nx = c.x + side * 12;
      if (!this.solid(nx, c.y) && !this.solid(nx, c.y - 3)) { oc.x = nx; oc.y = c.y + 1; }
      oc.pose = null; oc.hop(0.4); oc.setEmote('heart', 1.4); oc.dir = side > 0 ? 'left' : 'right';
    }

    if (cu.move === 'rub' && cu.t < 2.0) {
      // 蹭過去，但不穿牆
      const tx = a.x + (c.x < a.x ? -6 : 6), ty = a.y;
      const k = Math.min(1, dt * 6);
      const nx = c.x + (tx - c.x) * k, ny = c.y + (ty - c.y) * k;
      if (!c.hits(this, nx, c.y)) c.x = nx;
      if (!c.hits(this, c.x, ny)) c.y = ny;
      c.moving = cu.t < 0.5;
    }
    if (game && game.ok !== null && !cu.shown) {
      cu.shown = true; cu.ok = game.ok;
      const info = CUTE[cu.key];
      if (cu.ok) {
        // 萌連擊：鄰居塞罐罐，連擊越高送越多；完美再 +1
        this.cuteCombo++;
        const cans = Math.min(4, this.cuteCombo) + (game.perfect ? 1 : 0);
        this.run.cans += cans; this.stats.cuteCans += cans;
        game.reward = { combo: this.cuteCombo, cans, perfect: game.perfect };
        this.fx.hearts(a.x, a.y - 18, 6); SFX.play('heart'); a.setEmote('heart', 1.6);
        setTimeout(() => { [0, 0.09, 0.18].slice(0, Math.min(3, cans)).forEach(d => SFX.tone(1320 + d * 2000, 0.06, { delay: d, vol: 0.08, type: 'square' })); }, 320);
        UI.say(info.name, pick(info.win), { auto: 2.0 });
      } else {
        game.broke = this.cuteCombo; this.cuteCombo = 0;
        a.setEmote('anger', 1.6); SFX.play('fail');
        UI.say(info.name, pick(info.fail), { auto: 2.0 });
      }
    }
    if (game && game.done) this.endCute();
    else if (!game && cu.t > 6) this.endCute();
  }
  endCute() {
    const cu = this.cute, c = this.cat, v = cu.v, a = cu.actor;
    c.pose = null; c.wiggle = 0; c.box = null; Cam.zoom = 1; this.cutin = null; Input.game = null;
    if (cu.ok === null || cu.ok === undefined) cu.ok = false;
    Input.release(); c.unstick(this);
    this.run.immune[cu.key] = (this.run.immune[cu.key] || 0) + (cu.ok ? 1 : 0);
    UI.hideDialog();
    const real = a === this.lin || a === this.bo || a === this.patrol || a === this.butler;
    const hOwner = ownerOfViewer(v);
    if (cu.ok) {
      this.stats.cuteWin++; this.run.stats.cuteWin++;
      this.heatEvent(hOwner, HEAT.cuteWin, 'cute');
      v.susp = 0; c.inv = 2.6;
      if (v.type === 'npc' || v.type === 'party') { v.state = 'pet'; v.petT = 2.4; }
      if (a !== v && real && a !== this.butler) { a.state = 'pet'; a.petT = 2.4; }
      else if (a !== v && a.state !== undefined && a !== this.butler) { a.hidden = true; a.state = 'inside'; }
      if (v.type === 'window') { v.state = 'tv'; v.t = rnd(5, 7); if (this.time >= 1440) v.state = 'sleep'; }
      if (v.type === 'camera') { v.susp = 0; v.t += 2; if (this.butler && a === this.butler) { a.state = 'pet'; a.petT = 2.4; } else { a.hidden = true; } }
      UI.toast(c.carry.length ? '完全沒注意到你嘴裡的花！' : '成功脫身！');
    } else {
      this.stats.cuteFail++; this.run.stats.cuteFail++;
      this.run.flags[cu.key + 'Saw'] = true;
      this.heatEvent(hOwner, HEAT.cuteFail, 'caught');
      // 花沒收，抱回花店
      for (const f of c.carry) { f.pot.avail = true; }
      c.carry = [];
      for (const vv of this.viewers) if (vv) vv.susp = 0;
      if (a !== v && real && a !== this.butler) { a.state = 'idle'; a.resume(); }
      else if (a !== v && a.state !== undefined && a !== this.butler) { a.hidden = true; a.state = 'inside'; }
      if (v.type === 'npc' || v.type === 'party') { v.state = 'idle'; v.resume(); }
      c.top = false; c.h = 0;
      if (v.type === 'window') { v.state = this.time >= 1440 ? 'sleep' : 'tv'; v.t = rnd(5, 7); }
      if (this.butler && a === this.butler) { a.state = 'idle'; a.resume(); }
      c.x = 7.5 * TS; c.y = 5.9 * TS; c.dir = 'down'; c.inv = 2;
      // 橘貓也一起被抱回去（牠叼的花也還回去）
      const oc = this.orange;
      if (oc && oc.state === 'follow') {
        for (const f of oc.carry) f.pot.avail = true;
        oc.carry = []; oc.x = c.x + 10; oc.y = c.y + 6; oc.h = 0; oc.pose = null; oc.beh = null; oc.resetTrail(c);
      }
      this.time += 20;
      Cam.follow(c.x, c.y, this.map, 0, true); this.snapCam = true;
      UI.toast('被抱回花店了……叼著的花也被拿回去（時間 −20 分）', 3200);
    }
    if (v.type === 'party' && cu.ok) { v.x = v.seat[0]; v.y = v.seat[1]; }
    if (this.orange && this.orange.state === 'follow') { this.orange.pose = null; this.orange.stillT = 0; if (cu.ok) this.orange.setEmote('heart', 1.2); }
    this.cute = null; this.mode = 'play';
  }

  finish(timeUp) {
    if (this.mode === 'done') return;
    const c = this.cat;
    let lost = false;
    if (timeUp && !c.home && c.carry.length) { lost = true; c.carry = []; }
    this.mode = 'done'; Input.release();
    UI.setAction(null); UI.setWait(false, false); UI.setSkills([]);
    if (this.raid) this.finishRaid(true);
    Flow.nightDone({ n: this.n, deposited: this.deposited, stats: this.stats, timeUp, lost, tanhua: this.deposited.some(f => f.t === 'tanhua'), rose: this.deposited.some(f => f.t === 'rose'), rosePetals: this.petalsByType.rose || 0, heatHit: this.heatHit });
  }

  followCam(dt) {
    const c = this.cat;
    if (this.cute) {
      const a = this.cute.actor;
      Cam.follow((c.x + a.x) / 2, (c.y + a.y) / 2 - 8, this.map, dt, false);
    } else Cam.follow(c.x, c.y + View.h * 0.06, this.map, dt, false);
  }

  // ---------- 畫面 ----------
  render(ctx) {
    ctx.fillStyle = '#12142a'; ctx.fillRect(0, 0, View.w, View.h);
    Cam.begin(ctx);
    ctx.drawImage(this.bg, 0, 0);
    this.drawWindows(ctx);
    for (const p of this.petals) { ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.r ? 2 : 1, p.r ? 1 : 2); }
    // 依 y 排序畫
    const L = [];
    for (const p of this.pots) if (!p.gone) L.push({ y: p.y, d: g => p.draw(g, this) });
    for (const o of this.objs) {
      const spr = o.k === 'trash' ? (o.used ? G.S.obj.trashDown : G.S.obj.trash) : G.S.obj[o.k];
      L.push({ y: o.py, d: g => { shadow(g, o.px, o.py, 10); drawSpr(g, spr, o.px, o.py + 1); } });
    }
    for (const l of this.lamps) L.push({ y: l.y, d: g => drawSpr(g, G.S.lamp, l.x, l.y + 1) });
    L.push({ y: this.cam.y, d: g => { drawSpr(g, G.S.camPole, this.cam.x, this.cam.y + 1); this.drawCamHead(g); } });
    for (const b of this.bushes) L.push({ y: b.y - 1, d: g => drawSpr(g, b.spr, b.x, b.y + 1) });
    for (const n of [this.lin, this.bo, this.patrol, this.butler, ...this.party]) if (n && !n.hidden) L.push({ y: n.y, d: g => n.draw(g) });
    if (this.temps) for (const k in this.temps) { const h = this.temps[k]; if (!h.hidden) L.push({ y: h.y, d: g => h.draw(g) }); }
    L.push({ y: this.dog.y, d: g => this.dog.draw(g) });
    L.push({ y: this.stray ? this.stray.y : 0, d: g => nightPlus2D(this, g) });
    if (this.grill) L.push({ y: this.grill[1] + 6, d: g => { g.fillStyle = '#3a3440'; g.fillRect(Math.round(this.grill[0]) - 6, Math.round(this.grill[1]) - 2, 12, 5); g.fillStyle = Math.floor(this.cat.t * 6) % 2 ? '#ff7a3a' : '#ffb04a'; g.fillRect(Math.round(this.grill[0]) - 5, Math.round(this.grill[1]) - 3, 10, 1); } });
    if (this.linCam) L.push({ y: this.linCam.y, d: g => { const cm = this.linCam; g.fillStyle = '#d8d8e0'; g.fillRect(Math.round(cm.x) - 3, Math.round(cm.y) - 14, 6, 4); if (Math.floor(cm.t * 2) % 2 === 0) { g.fillStyle = '#ff4a4a'; g.fillRect(Math.round(cm.x), Math.round(cm.y) - 13, 1, 1); } } });
    if (this.orange) { const oc = this.orange; L.push({ y: oc.y, d: g => { g.save(); try { g.filter = 'saturate(1.8) hue-rotate(-12deg) brightness(1.25)'; } catch (e) { } const carry = oc.carry.map(f => ({ t: f.t })).concat(oc.gift ? [{ t: oc.gift }] : []); const fake = Object.assign(Object.create(Cat.prototype), { x: oc.x, y: oc.y - (oc.h || 0) * 8, dir: oc.dir, t: oc.t, moving: oc.moving, running: oc.running, carry, pose: oc.pose, act: oc.act, idleT: oc.idleT, inv: 0, hop: (oc.hopZ || 0) * 20 }); fake.draw(g); g.restore(); } }); }
    if (this.mode !== 'raid') L.push({ y: this.cat.y + 0.5, d: g => { if (this.cat.box) { shadow(g, this.cat.x, this.cat.y, 12); drawSpr(g, G.S.obj.box, this.cat.x, this.cat.y + 1); } else this.cat.draw(g); } });
    L.sort((a, b) => a.y - b.y);
    for (const it of L) it.d(ctx);
    Cam.end(ctx);

    // 光
    const lights = [], cones = [];
    for (const l of this.lamps) if (this.event !== 'outage' || l.y > 42 * TS) lights.push({ x: l.hx, y: l.hy + 12, r: 3.6 * TS, tint: 'rgba(255,190,90,0.22)' });
    for (const w of [[2, 21], [4, 21]]) { const s = this.wang.lit(w[0]); if (s) lights.push({ x: (w[0] + 0.5) * TS, y: 22.5 * TS, r: 2.3 * TS, tint: s === 'tv' ? 'rgba(120,160,255,0.25)' : 'rgba(255,200,110,0.22)' }); }
    if (this.time < 1470) lights.push({ x: 10.5 * TS, y: 12.5 * TS, r: 2 * TS, tint: 'rgba(255,200,110,0.18)' });
    lights.push({ x: 11.5 * TS, y: 32.5 * TS, r: 2 * TS, tint: 'rgba(255,200,110,0.18)' });
    lights.push({ x: 7 * TS, y: 5 * TS, r: 3 * TS, a: 0.7, tint: 'rgba(255,170,190,0.12)' });
    for (const m of this.motions) if (m.on > 0) lights.push({ x: m.x, y: m.y, r: m.r, tint: 'rgba(255,250,210,0.35)' });
    if (this.grill) lights.push({ x: this.grill[0], y: this.grill[1], r: 3 * TS, tint: 'rgba(255,150,70,0.25)' });
    lights.push({ x: this.cat.x, y: this.cat.y - 5, r: 1.7 * TS, a: 0.72 });
    const th = this.pots.find(p => p.t === 'tanhua');
    if (this.tanhuaState() === 'tanhua' && th && th.avail) lights.push({ x: th.x, y: th.y - 10, r: 1.3 * TS, a: 0.6, tint: 'rgba(255,255,255,0.25)' });
    for (const n of [this.lin, this.bo, this.patrol, this.butler, ...this.party]) {
      if (!n || n.hidden) continue;
      lights.push({ x: n.x, y: n.y - 6, r: 1.1 * TS, a: 0.5 });
      if ((n.active() || n.state === 'alert') && this.mode !== 'cute') {
        const [ex, ey] = n.eye();
        cones.push({ pts: conePoly(this.map, ex, ey, n.ang, n.half, n.range, this.occ), tint: n.susp > 0.35 ? 'rgba(255,120,90,0.2)' : undefined, edge: n.susp > 0.35 ? 'rgba(255,140,110,0.7)' : undefined });
      }
    }
    if (this.wang.state === 'look' && this.mode !== 'cute') {
      const [ex, ey] = this.wang.eye();
      cones.push({ pts: conePoly(this.map, ex, ey, this.wang.ang, this.wang.half, this.wang.range, this.occ), tint: 'rgba(255,214,120,0.16)' });
    }
    if (this.wang.state === 'pre' || this.wang.state === 'wakepre') {
      const [ex, ey] = this.wang.eye();
      lights.push({ x: ex, y: ey + 8, r: 1.6 * TS, a: 0.6 });
    }
    for (const cm of [this.cam, this.linCam]) {
      if (!cm) continue;
      const [ex, ey] = cm.eye();
      if (Cam.visible(ex, ey, 120) && this.mode !== 'cute') cones.push({ pts: conePoly(this.map, ex, ey, cm.ang, cm.half, cm.range, this.occ), a: 0.55, tint: cm.susp > 0.3 ? 'rgba(255,80,80,0.22)' : 'rgba(255,90,90,0.1)', edge: 'rgba(255,110,110,0.55)' });
    }
    renderDarkness(ctx, lights, cones, this.event === 'outage' ? 0.86 : 0.8);
    if (this.event === 'rain') { ctx.strokeStyle = 'rgba(190,210,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); const t = this.cat.t; for (let i = 0; i < 60; i++) { const x = ((i * 53.7 + t * 40) % (View.w + 20)) - 10, y = ((i * 97.3 + t * 260) % (View.h + 20)) - 10; ctx.moveTo(Math.round(x), Math.round(y)); ctx.lineTo(Math.round(x - 2), Math.round(y + 6)); } ctx.stroke(); }

    // 光線之上：表情、互動提示
    Cam.begin(ctx);
    for (const n of [this.lin, this.bo, this.patrol, this.butler, ...this.party]) if (n && !n.hidden) this.drawAlert(ctx, n, n.x, n.y - 21);
    if (this.linCam && this.linCam.susp > 0.02) this.drawAlert(ctx, this.linCam, this.linCam.x, this.linCam.y - 18);
    if (this.temps) for (const k in this.temps) { const h = this.temps[k]; if (!h.hidden) h.drawOver(ctx); }
    if (this.wang.susp > 0.02 || this.wang.state === 'pre') { const [ex, ey] = this.wang.eye(); this.drawAlert(ctx, this.wang, ex, ey - 12); }
    if (this.cam.susp > 0.02) this.drawAlert(ctx, this.cam, this.cam.x, this.cam.y - 22);
    this.dog.drawOver(ctx);
    if (this.orange) { const oc = this.orange; if (oc.emote) drawSpr(ctx, G.S.emote[oc.emote], oc.x, oc.y - 12 - (oc.h || 0) * 8, 0.5, 1); if (oc.bug) { ctx.fillStyle = '#d8ff8a'; ctx.fillRect(Math.round(oc.bug.x), Math.round(oc.bug.y - oc.bug.hz * 12), 1, 1); } }
    if (this.prankFx) { const pf = this.prankFx; ctx.fillStyle = '#c9ccd8'; ctx.fillRect(Math.round(pf.x + pf.dx * pf.t * 14) - 1, Math.round(pf.y) - 2, 3, 2); }
    const vt = this.cat.t;
    for (const [li, l] of this.lamps.entries()) {
      if (!Cam.visible(l.hx, l.hy, 30)) continue;
      for (let i = 0; i < 3; i++) {
        const a = vt * (2.1 + i * 0.7) + i * 2.1 + li;
        const mx = l.hx + Math.cos(a) * (4 + i * 2) + Math.sin(a * 2.3) * 1.5, my = l.hy + 3 + Math.sin(a * 1.4) * (2 + i);
        ctx.fillStyle = (Math.floor(vt * 12 + i) % 3) ? '#fff2c0' : '#d8c890'; ctx.fillRect(Math.round(mx), Math.round(my), 1, 1);
      }
    }
    for (let i = 0; i < this.bushes.length; i += 2) {
      const b = this.bushes[i]; if (!Cam.visible(b.x, b.y, 20)) continue;
      const ph = vt * 0.9 + i * 1.7, glow = Math.sin(ph * 2.2);
      if (glow < 0.3) continue;
      const fx = b.x + Math.sin(ph) * 7, fy = b.y - 10 + Math.cos(ph * 1.3) * 4;
      ctx.globalAlpha = (glow - 0.3) / 0.7; ctx.fillStyle = '#d8ff8a'; ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
      ctx.fillStyle = 'rgba(216,255,138,0.35)'; ctx.fillRect(Math.round(fx) - 1, Math.round(fy), 3, 1); ctx.fillRect(Math.round(fx), Math.round(fy) - 1, 1, 3);
      ctx.globalAlpha = 1;
    }
    if (this.mode === 'play' && this.target && this.target.kind !== 'home') {
      const r = this.target.ref; const bob = Math.round(Math.sin(this.cat.t * 6));
      const tx = r.x !== undefined ? r.x : r.px, ty = (r.y !== undefined ? r.y : r.py) - 18 + bob;
      ctx.fillStyle = '#ffd25a'; ctx.fillRect(Math.round(tx) - 2, Math.round(ty), 5, 1); ctx.fillRect(Math.round(tx) - 1, Math.round(ty) + 1, 3, 1); ctx.fillRect(Math.round(tx), Math.round(ty) + 2, 1, 1);
    }
    if (this.cat.hidden && this.mode === 'play') { ctx.fillStyle = 'rgba(255,255,255,0.75)'; const e = Math.floor(this.cat.t * 2) % 6 ? 1 : 0; ctx.fillRect(Math.round(this.cat.x) - 3, Math.round(this.cat.y) - 9, 1, e); ctx.fillRect(Math.round(this.cat.x) + 2, Math.round(this.cat.y) - 9, 1, e); }
    this.fx.draw(ctx);
    Cam.end(ctx);

    // 回家箭頭
    if (this.cat.carry.length && this.mode === 'play') {
      const hx = 7.5 * TS, hy = 4.6 * TS;
      if (!Cam.visible(hx, hy, -6)) {
        const [sx, sy] = Cam.toScreen(hx, hy);
        const cx = View.w / 2, cy = View.h / 2;
        const a = Math.atan2(sy - cy, sx - cx);
        const ex = clamp(cx + Math.cos(a) * 200, 10, View.w - 10), ey = clamp(cy + Math.sin(a) * 200, 34, View.h - 14);
        ctx.save(); ctx.translate(Math.round(ex), Math.round(ey)); ctx.rotate(a);
        ctx.fillStyle = '#1d1526'; ctx.fillRect(-5, -4, 9, 8);
        ctx.fillStyle = '#ffd25a'; ctx.fillRect(-4, -1, 5, 2); ctx.fillRect(0, -3, 1, 6); ctx.fillRect(1, -2, 1, 4); ctx.fillRect(2, -1, 1, 2);
        ctx.restore();
      }
    }
    if (this.pcut && this.mode !== 'cute') this.pcut.render(ctx);
    if (this.cutin) this.cutin.render(ctx);
  }
  drawCamHead(g) {
    const cm = this.cam;
    const hx = cm.x, hy = cm.y - 17;
    const flip = Math.cos(cm.ang) < 0;
    g.save(); g.translate(Math.round(hx), Math.round(hy)); if (flip) g.scale(-1, 1);
    drawSpr(g, G.S.obj.camera, 0, 3, 0.2, 0.5);
    g.restore();
    if (Math.floor(cm.t * 2) % 2 === 0) { g.fillStyle = '#ff4a4a'; g.fillRect(Math.round(hx) + (flip ? -2 : 1), Math.round(hy) - 2, 1, 1); }
  }
  drawAlert(ctx, v, x, y) {
    if (v.susp >= 0.35) {
      drawSpr(ctx, G.S.emote[v.susp >= 0.98 ? 'ex' : 'q'], x, y, 0.5, 1);
    }
    if (v.susp > 0.02 && v.susp < 1) {
      const w = 12;
      ctx.fillStyle = '#1d1526'; ctx.fillRect(Math.round(x - w / 2) - 1, Math.round(y) + 1, w + 2, 3);
      ctx.fillStyle = v.susp >= 0.35 ? '#ff7a5a' : '#ffd25a'; ctx.fillRect(Math.round(x - w / 2), Math.round(y) + 2, Math.round(w * v.susp), 1);
    }
    if (v.drawOver) v.drawOver(ctx);
  }
  drawWindows(ctx) {
    for (const [tx, ty] of [[2, 21], [4, 21]]) {
      const s = this.wang.lit(tx);
      if (s) drawWindow(ctx, tx * TS, ty * TS, tx, ty, true, s === 'tv' && Math.floor(this.cat.t * 6) % 3 !== 0);
      if (this.wang.face(tx)) ctx.drawImage(G.S.people.wang.down[0], 1, 1, 10, 7, tx * TS + 1, ty * TS + 2, 10, 7);
    }
    if (this.time < 1470) drawWindow(ctx, 10 * TS, 11 * TS, 10, 11, true, false);
    drawWindow(ctx, 11 * TS, 31 * TS, 11, 31, true, false);
  }
}
