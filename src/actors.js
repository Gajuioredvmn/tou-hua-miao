// ================= 角色 =================
function angToDir(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return Math.abs(c) >= Math.abs(s) ? (c > 0 ? 'right' : 'left') : (s > 0 ? 'down' : 'up');
}
const DIR_ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const tileC = (tx, ty) => [(tx + 0.5) * TS, (ty + 0.5) * TS];

class Cat {
  constructor(x, y) {
    this.x = x; this.y = y; this.dir = 'down'; this.t = 0;
    this.moving = false; this.running = false;
    this.carry = []; this.hidden = false; this.home = false;
    this.pose = null; this.inv = 0; this.jump = null; this.wiggle = 0;
    this.noiseT = 0; this.petalT = 0; this.stepT = 0;
    this.top = false; this.h = 0; this.box = null;   // 在屋頂／牆頭上、離地高度（格）、紙箱
  }
  move(dt, scene, allowRun = true) {
    this.t += dt;
    if (this.jump) {
      const j = this.jump; j.t += dt;
      const k = Math.min(1, j.t / j.dur);
      this.x = lerp(j.x0, j.x1, k); this.y = lerp(j.y0, j.y1, k);
      this.h = lerp(j.h0 || 0, j.h1 || 0, smooth(k));
      this.hop = Math.sin(k * Math.PI) * (j.hopPx || 14);
      if (k >= 1) { this.jump = null; this.hop = 0; this.h = j.h1 || 0; if (j.top !== undefined) this.top = j.top; }
      this.moving = true; this.running = false;
      return;
    }
    this.unstick(scene);
    const v = Input.vector();
    this.moving = v.mag > 0.15;
    this.running = allowRun && !this.box && v.mag > 0.72;
    this.updateIdle(dt);
    if (this.top && scene.topH) { const th = scene.topH(this.x, this.y); this.h += (th - this.h) * Math.min(1, dt * 9); }
    if (!this.moving) { this.running = false; return; }
    if (this.pose === 'loaf') this.pose = null;
    const sp = this.box ? 17 : this.running ? 62 : 30;
    const dx = v.x * sp * dt, dy = v.y * sp * dt;
    if (Math.abs(v.x) > Math.abs(v.y) * 0.9) this.dir = v.x > 0 ? 'right' : 'left';
    else this.dir = v.y > 0 ? 'down' : 'up';
    const st = sp * dt;
    if (!this.hits(scene, this.x + dx, this.y)) this.x += dx;
    else if (Math.abs(v.x) > 0.3) this.nudge(scene, Math.sign(dx) * 1.5, 0, st);
    if (!this.hits(scene, this.x, this.y + dy)) this.y += dy;
    else if (Math.abs(v.y) > 0.3) this.nudge(scene, 0, Math.sign(dy) * 1.5, st);
  }
  hits(scene, x, y) {
    if (scene.catSolid) {
      const r = this.top ? 2.5 : 4, S = (a, b) => scene.catSolid(a, b, this);
      return S(x - r, y - r) || S(x + r, y - r) || S(x - r, y) || S(x + r, y);
    }
    return scene.solid(x - 4, y - 4) || scene.solid(x + 4, y - 4) || scene.solid(x - 4, y) || scene.solid(x + 4, y);
  }
  // 萬一卡進牆或盆栽裡，推到最近的空位
  unstick(scene) {
    if (!this.hits(scene, this.x, this.y)) return false;
    for (let r = 1; r <= 30; r++) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const x = this.x + Math.cos(a) * r, y = this.y + Math.sin(a) * r;
        if (!this.hits(scene, x, y)) { this.x = x; this.y = y; return true; }
      }
    }
    return false;
  }
  // 卡在牆邊時，往附近的缺口滑過去（柵欄門、貓門）
  nudge(scene, dx, dy, st) {
    for (let s = 1; s <= 8; s++) {
      for (const sg of [1, -1]) {
        const o = s * sg;
        if (dx) {
          if (!this.hits(scene, this.x + dx, this.y + o)) {
            const m = Math.sign(o) * Math.min(Math.abs(o), st);
            if (!this.hits(scene, this.x, this.y + m)) this.y += m;
            return;
          }
        } else {
          if (!this.hits(scene, this.x + o, this.y + dy)) {
            const m = Math.sign(o) * Math.min(Math.abs(o), st);
            if (!this.hits(scene, this.x + m, this.y)) this.x += m;
            return;
          }
        }
      }
    }
  }
  // 待機動作：站著甩尾巴、眨眼；久了就母雞蹲，東張西望、轉耳朵、打哈欠、喵一下（像影片裡那樣）
  updateIdle(dt) {
    if (this.moving || this.jump || this.pose === 'belly' || this.pose === 'meow' || this.pose === 'rub') { this.idleT = 0; this.act = null; this.actT = 0; return; }
    this.idleT = (this.idleT || 0) + dt;
    if (this.actT > 0) { this.actT -= dt; if (this.actT <= 0) this.act = null; }
    this.nextAct = (this.nextAct === undefined ? 1.2 : this.nextAct) - dt;
    if (this.nextAct <= 0 && !this.act) {
      const loaf = this.pose === 'loaf' || this.idleT > 1.8;
      const opts = loaf ? ['lookL', 'lookR', 'blink', 'ear', 'yawn', 'blink', 'meow', 'lookL', 'lookR'] : ['blink', 'blink'];
      this.act = opts[Math.floor(Math.random() * opts.length)];
      this.actT = { lookL: 1.3, lookR: 1.3, blink: 0.16, ear: 0.45, yawn: 1.1, meow: 0.55 }[this.act];
      this.nextAct = rnd(1.2, 2.6);
    }
  }
  sprite() {
    const S = G.S.tabby, side = this.dir === 'left' ? 'L' : 'R';
    if (this.pose === 'belly') return S.belly[Math.floor(this.t * 4) % 2];
    if (this.pose === 'meow') return S['meow' + (this.dir === 'left' ? 'L' : 'R')];
    if (this.pose === 'rub') return S['rub' + (this.dir === 'left' ? 'L' : 'R')];
    const loaf = this.pose === 'loaf' || (!this.moving && (this.idleT || 0) > 1.8);
    if (loaf) {
      switch (this.act) {
        case 'lookL': return S.loafL;
        case 'lookR': return S.loafR;
        case 'blink': return S.loafBlink;
        case 'ear': return S.loafEar;
        case 'yawn': return S.loafYawn;
        case 'meow': return S.loafMeow;
      }
      return S.loaf;
    }
    if (this.moving) {
      if (this.dir === 'left' || this.dir === 'right') {
        if (this.running) return S['run' + side][Math.floor(this.t * 12) % 2];
        return S['walk' + side][Math.floor(this.t * 8) % 4];
      }
      const fr = Math.floor(this.t * (this.running ? 12 : 8)) % 4;
      return this.dir === 'up' ? S.walkU[fr] : S.walkD[fr];
    }
    if (this.dir === 'up') return S.walkU[1];
    if (this.dir === 'down') return S.walkD[0];
    if (this.act === 'blink') return this.dir === 'left' ? S.blinkL : S.blinkR;
    return S['stand' + side][Math.floor(this.t * 2.2) % 3];
  }
  bob() {
    if (!this.moving || this.jump) return 0;
    if (this.running) return Math.floor(this.t * 12) % 2 ? -1 : 0;
    return Math.floor(this.t * 8) % 2 ? -1 : 0;
  }
  mouth() {
    switch (this.dir) {
      case 'right': return [this.x + 8, this.y - 6];
      case 'left': return [this.x - 8, this.y - 6];
      case 'up': return [this.x, this.y - 13];
      default: return [this.x, this.y - 5];
    }
  }
  drawCarry(ctx) {
    if (!this.carry.length || this.pose === 'belly') return;
    const loaf = this.pose === 'loaf' || (!this.moving && (this.idleT || 0) > 1.8);
    const [mx, my] = loaf ? [this.x, this.y - 3] : this.mouth();
    this.carry.forEach((c, i) => {
      const ox = (i - (this.carry.length - 1) / 2) * 4;
      drawSpr(ctx, G.S.icon[c.t], mx + ox, my - (this.hop || 0) + (i % 2) + this.bob(), 0.5, 0.6);
    });
  }
  draw(ctx) {
    const hop = this.hop || 0;
    shadow(ctx, this.x, this.y, 12);
    const loaf = this.pose === 'loaf' || (!this.moving && (this.idleT || 0) > 1.8);
    const behind = this.dir === 'up' && !loaf;
    if (behind) this.drawCarry(ctx);
    const w = this.wiggle ? Math.round(Math.sin(this.t * 40) * 1.5) : 0;
    ctx.globalAlpha = this.inv > 0 ? 0.55 + 0.3 * Math.sin(this.t * 20) : 1;
    drawSpr(ctx, this.sprite(), this.x + w, this.y + 1 - hop + this.bob());
    ctx.globalAlpha = 1;
    if (!behind) this.drawCarry(ctx);
  }
}

class Human {
  constructor(key, x, y, dir = 'down') {
    this.key = key; this.x = x; this.y = y; this.dir = dir; this.ang = DIR_ANG[dir];
    this.t = 0; this.moving = false; this.hidden = false;
    this.path = []; this.speed = 26; this.onArrive = null;
    this.emote = null; this.emoteT = 0; this.bubble = false;
  }
  goTo(pts, speed, cb) { this.path = pts.map(p => p.slice()); if (speed) this.speed = speed; this.onArrive = cb || null; }
  face(x, y) { this.ang = Math.atan2(y - this.y, x - this.x); this.dir = angToDir(this.ang); }
  stepPath(dt) {
    if (!this.path.length) { this.moving = false; return true; }
    const [tx, ty] = this.path[0];
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
    const st = this.speed * dt;
    if (d <= st || d < 0.01) {
      this.x = tx; this.y = ty; this.path.shift();
      if (!this.path.length) {
        this.moving = false;
        const cb = this.onArrive; this.onArrive = null; if (cb) cb();
        return true;
      }
    } else {
      this.x += (dx / d) * st; this.y += (dy / d) * st;
      this.ang = Math.atan2(dy, dx); this.dir = angToDir(this.ang); this.moving = true;
    }
    return false;
  }
  setEmote(k, t = 1.2) { this.emote = k; this.emoteT = t; }
  update(dt) { this.t += dt; if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; } }
  draw(ctx) {
    if (this.hidden) return;
    shadow(ctx, this.x, this.y, 10);
    const fr = this.moving ? Math.floor(this.t * 6) % 2 : 0;
    const P = G.S.people[this.key] || G.S.people[['cust1', 'cust2'][(this.key || '').length % 2]];
    drawSpr(ctx, P[this.dir][fr], this.x, this.y + 1);
  }
  drawOver(ctx) {
    if (this.hidden) return;
    const hx = this.x, hy = this.y - 21;
    if (this.bubble) {
      ctx.fillStyle = '#fff8ec'; ctx.fillRect(Math.round(hx - 5), Math.round(hy - 6), 11, 7);
      ctx.fillStyle = '#1d1526'; ctx.fillRect(Math.round(hx - 5), Math.round(hy + 1), 11, 1);
      ctx.fillRect(Math.round(hx - 1), Math.round(hy + 1), 2, 2);
      const d = Math.floor(this.t * 3) % 3;
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i <= d ? '#1d1526' : '#b9b4d6'; ctx.fillRect(Math.round(hx - 3 + i * 3), Math.round(hy - 3), 1, 1); }
    }
    if (this.emote) drawSpr(ctx, G.S.emote[this.emote], hx, hy + (this.bubble ? -8 : 0), 0.5, 1);
  }
}

class Dog {
  constructor(x, y) { this.x = x; this.y = y; this.state = 'sleep'; this.dir = 'right'; this.t = 0; this.moving = false; this.barkT = 0; this.cool = 0; this.emote = null; this.emoteT = 0; }
  update(dt) {
    this.t += dt; if (this.cool > 0) this.cool -= dt; if (this.barkT > 0) this.barkT -= dt;
    if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
  }
  draw(ctx) {
    shadow(ctx, this.x, this.y, 10);
    if (this.state === 'sleep') {
      drawSpr(ctx, G.S.dog.sleep, this.x, this.y + 1);
      if (Math.floor(this.t * 1.2) % 2 === 0) drawSpr(ctx, G.S.emote.z, this.x + 7, this.y - 7, 0.5, 1);
      return;
    }
    const fr = this.moving ? Math.floor(this.t * 9) % 2 : 0;
    const jump = this.barkT > 0 ? Math.round(Math.abs(Math.sin(this.t * 18)) * 2) : 0;
    drawSpr(ctx, G.S.dog[this.dir === 'left' ? 'left' : 'right'][fr], this.x, this.y + 1 - jump);
  }
  drawOver(ctx) { if (this.emote) drawSpr(ctx, G.S.emote[this.emote], this.x, this.y - 12, 0.5, 1); }
}

class Pot {
  constructor(d) {
    this.t = d.t; this.tx = d.x; this.ty = d.y; this.owner = d.owner;
    this.x = (d.x + 0.5) * TS; this.y = (d.y + 1) * TS - 1;
    this.avail = true;
  }
  sprite(scene) {
    if (!this.avail) return G.S.pot[this.t === 'orchid' ? 'orchidStub' : 'stub'];
    if (this.t === 'tanhua') return G.S.pot[scene.tanhuaState ? scene.tanhuaState() : 'tanhua'];
    return G.S.pot[this.t];
  }
  draw(ctx, scene) { shadow(ctx, this.x, this.y, 10); drawSpr(ctx, this.sprite(scene), this.x, this.y + 1); }
}
