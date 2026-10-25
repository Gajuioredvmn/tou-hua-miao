// ================= 白天：花店 =================
// 小型劇本執行器：yield 出去的東西都要有 update(dt) → 完成時回傳 true
class Runner {
  constructor(gen) { this.it = gen; this.w = null; this.done = false; this.advance(); }
  advance() { const r = this.it.next(); if (r.done) { this.done = true; this.w = null; } else this.w = r.value; }
  update(dt) {
    let guard = 0;
    while (!this.done && guard++ < 30) {
      if (!this.w || this.w.update(dt)) { dt = 0; this.advance(); } else break;
    }
  }
}
const wait = s => ({ t: s, update(dt) { this.t -= dt; return this.t <= 0; } });
const until = fn => ({ update() { return !!fn(); } });

const SHOP_DOOR_OUT = [7.5 * TS, 17.7 * TS];
const SHOP_DOOR_IN = [7.5 * TS, 14.6 * TS];
const COUNTER_SPOT = [10.5 * TS, 8.9 * TS];
const COUNTER_SPOT2 = [12.2 * TS, 8.9 * TS];
// 花桶擺在店中間的階梯花台上（鏡頭一定看得到）：x、z 是格子座標，h 是放在第幾層的高度
const DISPLAY_SPOTS = [{ x: 5.45, z: 9.68, h: 0.2 }, { x: 6.3, z: 9.68, h: 0.2 }, { x: 5.85, z: 9.12, h: 0.45 }, { x: 5.0, z: 9.12, h: 0.45 }, { x: 6.7, z: 9.12, h: 0.45 }];
// 店面佈置第 1 級起：三層鐵桶花架（後排最高、先放貴的花）＋左牆長凳
const DISPLAY_SPOTS2 = [
  { x: 4.9, z: 8.86, h: 0.62 }, { x: 5.8, z: 8.86, h: 0.62 }, { x: 6.7, z: 8.86, h: 0.62 },
  { x: 4.9, z: 9.34, h: 0.4 }, { x: 5.8, z: 9.34, h: 0.4 }, { x: 6.7, z: 9.34, h: 0.4 },
  { x: 4.9, z: 9.82, h: 0.18 }, { x: 5.8, z: 9.82, h: 0.18 }, { x: 6.7, z: 9.82, h: 0.18 },
];
const BENCH_SPOTS = [5.7, 6.8, 7.9, 9.0, 10.1].map(z => ({ x: 1.47, z, h: 0.36, bench: true }));
const BENCH_WAY = [3.4, 11.6];   // 去左牆長凳看花的客人先繞到花架前面
const STAND_TILES = ['4,8', '5,8', '6,8', '4,9', '5,9', '6,9'];
const ROSE_SPOT = [2, 14];
const SHOP_KNOCKS = [[3, 12], [11, 11], [4, 6]];
// 白天上門買花的客人
const PAY_SPOTS = [[9.25, 9.0], [8.05, 9.55], [6.95, 10.15], [5.9, 10.8]];
const REGISTER = [12.45, 8.1];
const SHOPPER_KEYS = ['shopA', 'shopB', 'shopC', 'shopD', 'cust1', 'shopE', 'cust2', 'shopF'];
const SMALL_POT_PRICE = 100;
const BQ_BROWSE = [10.7, 8.75];   // 想買花束的客人站在櫃台前面

class DayScene {
  constructor(n) {
    this.kind = 'day'; this.n = n; this.run = G.run;
    this.map = G.maps.shop; this.bg = G.bg.shop;
    this.fx = new FX(); this.mode = 'play'; this.skip = false; this.tint = 'morning';
    this.cat = new Cat(12.5 * TS, 12.9 * TS); this.cat.pose = 'loaf'; this.cat.dir = 'down';
    this.meiling = new Human('meiling', 11.5 * TS, 6.6 * TS, 'down');
    this.people = [this.meiling]; this.dog = null;
    this.blocked = new Set();
    this.displays = [];
    // 昨晚帶回來的花＝今天店裡的庫存（跟 run.stock 是同一份）
    if (n > 1) { this.stock = this.run.stock || (this.run.stock = []); }
    else { this.stock = []; this.run.stock = this.stock; }
    if (n === 5) this.run.roseDone = true;
    for (const k of STAND_TILES) this.blocked.add(k);
    // 花桶：每一種花一桶（貴的放前面）；賣完的桶子會空掉
    this.dispTypes = n === 1 ? ['wilt', 'wilt'] : [...new Set(this.stock.map(f => f.t))].sort((a, b) => FLOWERS[b].price - FLOWERS[a].price);
    this.layoutDisplays();
    this.shoppers = []; this.queue = []; this.shopOn = false; this.shopT = 1.2; this.shopperN = 0; this.daySales = 0; this.rush = false;
    this.bouquets = []; this.request = null;   // 包好待售的花束、熟客指定的花束
    this.focus = null; this.sparks = [];
    this.knocks = SHOP_KNOCKS.map(([x, y]) => ({ x: (x + 0.5) * TS, y: (y + 1) * TS - 1, tx: x, ty: y, used: false }));
    for (const k of this.knocks) this.blocked.add(k.tx + ',' + k.ty);
    if (storeOf(this.run).fridge) this.blocked.add('13,9');
    this.hide = null; this.target = null; this.tips = {};
    this.heardCount = 0; this.bubbles = []; this.practiceDone = false;
    Cam.zoom = 1; Cam.follow(this.cat.x, this.cat.y, this.map, 0, true);
    if (R3.on) PREWARM.add([...warmCat(), ...warmPeople(['meiling'], false)]);
    if (R3.on && n > 1) PREWARM.add(warmPeople(SHOPPER_KEYS, false));
    this.runner = new Runner(dayScript(this, n));
  }
  // 花桶的位置跟著店面佈置等級（3D 揭曉動畫時會先畫舊的樣子，所以兩種都算得出來）
  displaysFor(decor) {
    const k = this.n === 1 || !decor ? 0 : 1;
    const C = this.dispCache || (this.dispCache = {});
    if (C[k]) return C[k];
    const out = [], types = this.dispTypes;
    if (k === 0) types.slice(0, DISPLAY_SPOTS.length).forEach((t, i) => { const d = DISPLAY_SPOTS[i]; out.push({ t, x: d.x * TS, y: d.z * TS, h: d.h, sx: d.x, sy: 10.45 }); });
    else DISPLAY_SPOTS2.concat(BENCH_SPOTS).forEach((d, i) => {
      const t = types[i] || FILLERS[i % FILLERS.length];
      out.push({ t, x: d.x * TS, y: d.z * TS, h: d.h, sx: d.bench ? 2.65 : d.x, sy: d.bench ? d.z + 0.3 : 10.45, bench: !!d.bench, filler: !types[i] });
    });
    return (C[k] = out);
  }
  // 依現在的佈置擺花桶、擋住家具佔的格子
  layoutDisplays() {
    const decor = storeOf(this.run).decor || 0;
    for (const k of this.decorBlocks || []) this.blocked.delete(k);
    this.decorBlocks = [];
    const add = k => { if (!this.blocked.has(k)) { this.blocked.add(k); this.decorBlocks.push(k); } };
    if (decor === 0) add('1,13');
    if (decor >= 1) for (let z = 5; z <= 10; z++) add('1,' + z);
    if (decor >= 2) { add('1,4'); add('13,4'); }
    if (decor >= 3) for (const k of ['1,11', '1,12', '1,13', '2,11', '2,12', '2,13']) add(k);
    for (const k of expBlocked(this.run)) add(k);
    this.displays = this.displaysFor(decor);
  }
  // 花桶裡的花有多滿：看店裡還剩幾朵
  fullness(d) {
    if (d.filler) return 3;
    let n = 0; for (const f of this.stock) if (f.t === d.t) n++;
    return n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3;
  }
  solid(x, y) { return this.map.solidPx(x, y) || this.blocked.has(Math.floor(x / TS) + ',' + Math.floor(y / TS)); }
  // ---- 店裡的花：客人上門買 ----
  canSell(f) { return !(f.t === 'rose' && this.run.rosePending && !this.run.roseDone); }
  displayArt(d) { if (d.filler || d.t === 'wilt' || d.t === 'rose' && d === this.roseDisplay) return d.t; return this.stock.some(f => f.t === d.t) ? d.t : 'empty'; }
  dispFor(t) { return this.displays.find(d => d.t === t && !d.filler) || this.displays.find(d => !d.filler) || { x: 5.8 * TS, y: 9.3 * TS, sx: 5.8, sy: 10.45 }; }
  startShop() { if (this.n > 1 && this.n < 5) { this.shopOn = true; this.shopT = 1.0; } }
  spawnShopper() {
    const st = storeOf(this.run);
    const avail = this.stock.filter(f => this.canSell(f));
    if (!avail.length && !st.neon && !this.bouquets.length) return false;
    const key = SHOPPER_KEYS[(this.shopperN++ * 3 + this.n) % SHOPPER_KEYS.length];
    const h = new Human(key, SHOP_DOOR_OUT[0] + rnd(-5, 5), SHOP_DOOR_OUT[1], 'up');
    h.shop = { st: 'in', want: null, wantN: 0, carry: null, t: 0, via: null };
    if (this.bouquets.length && (!avail.length || Math.random() < 0.7)) {
      // 花束擺在櫃台上：客人走到櫃台前面挑
      h.shop.want = 'bouquet'; h.shop.wantN = 1;
      h.goTo([SHOP_DOOR_IN, [7.6 * TS, 12.0 * TS], [BQ_BROWSE[0] * TS + rnd(-3, 3), BQ_BROWSE[1] * TS]], this.rush ? 60 : 40);
    } else if (avail.length) {
      const f = avail[Math.floor(Math.random() * avail.length)];
      const same = avail.filter(x => x.t === f.t).length;
      h.shop.want = f.t; h.shop.wantN = Math.min(same, this.rush ? 3 : 1 + (Math.random() < 0.4 ? 1 : 0));
      const d = this.dispFor(f.t), pts = [SHOP_DOOR_IN, [7.6 * TS, 12.0 * TS]];
      if (d.bench) pts.push([BENCH_WAY[0] * TS, BENCH_WAY[1] * TS]);
      pts.push([d.sx * TS + rnd(-2, 2), d.sy * TS]);
      h.shop.disp = d;
      h.goTo(pts, this.rush ? 60 : 40);
    } else h.goTo([SHOP_DOOR_IN, [7.9 * TS, 11.6 * TS]], 40);
    SFX.play('chime');
    this.people.push(h); this.shoppers.push(h);
    return true;
  }
  queueUp(h) {
    // 從左牆長凳過來的客人先繞到花架前面，不要穿過花架
    h.shop.via = h.shop.want ? (h.shop.disp && h.shop.disp.bench ? [[BENCH_WAY[0] * TS, BENCH_WAY[1] * TS], [7.4 * TS, 10.6 * TS]] : [[7.4 * TS, 10.6 * TS]]) : null;
    this.queue.push(h); this.advanceQueue();
  }
  advanceQueue() {
    this.queue.forEach((q, i) => {
      const p = PAY_SPOTS[Math.min(i, PAY_SPOTS.length - 1)], pts = [];
      const v = q.shop.via;
      if (v && q.shop.st !== 'pay' && dist(q.x, q.y, v[v.length - 1][0], v[v.length - 1][1]) > 4) pts.push(...v); else q.shop.via = null;
      pts.push([p[0] * TS, p[1] * TS]);
      q.goTo(pts, this.rush ? 60 : 40);
    });
  }
  updateShoppers(dt) {
    const st = storeOf(this.run);
    if (this.shopOn && !(this.hide && !this.hide.done) && !this.focus) {
      this.shopT -= dt;
      if (this.shopT <= 0) {
        const max = this.rush ? 4 : 3;
        if (this.shoppers.length < max && this.spawnShopper()) this.shopT = this.rush ? rnd(0.45, 0.75) : (st.neon ? 4 : 8) * (this.run.flags && this.run.flags.famous ? 0.65 : 1) * ((st.expand || 0) >= 2 ? 0.7 : 1) * ((this.run.flags && this.run.flags.buzz || 0) > (this.run.nightIdx || 0) ? 0.7 : 1) * rnd(0.8, 1.2);
        else this.shopT = 1;
      }
    }
    for (const h of this.shoppers) {
      const S = h.shop; S.t += dt;
      if (S.st === 'in' && !h.path.length) {
        if (S.want) { S.st = 'browse'; S.t = 0; if (S.disp && S.disp.bench) h.face(h.x - 10, h.y); else h.face(h.x, h.y - 10); if (S.want === 'bouquet') h.setEmote('heart', 0.9); }
        else { S.st = 'queue'; this.queueUp(h); }
      } else if (S.st === 'browse' && S.t > (this.rush ? 0.4 : 1.1) && S.want === 'bouquet') {
        const bq = this.bouquets.shift();
        if (!bq) { S.st = 'out'; h.goTo([SHOP_DOOR_IN, SHOP_DOOR_OUT], 46); h.setEmote('q', 1); continue; }
        S.carryB = bq; SFX.play('pick');
        S.st = 'queue'; S.via = null; this.queue.push(h); this.advanceQueue();
      } else if (S.st === 'browse' && S.t > (this.rush ? 0.4 : 1.1)) {
        const take = [];
        for (let i = this.stock.length - 1; i >= 0 && take.length < S.wantN; i--) if (this.stock[i].t === S.want && this.canSell(this.stock[i])) take.push(this.stock.splice(i, 1)[0]);
        if (!take.length && !st.neon) { S.st = 'out'; h.goTo([SHOP_DOOR_IN, SHOP_DOOR_OUT], 46); h.setEmote('q', 1); continue; }
        S.carry = take.length ? take : null; if (take.length) SFX.play('pick');
        S.st = 'queue'; this.queueUp(h);
      } else if (S.st === 'queue') {
        if (!h.path.length && this.queue[0] === h) { S.st = 'pay'; S.t = 0; h.face(REGISTER[0] * TS, REGISTER[1] * TS - 10); }
      } else if (S.st === 'pay' && S.t > (this.rush ? 0.35 : 0.75)) {
        let v = S.carry ? S.carry.reduce((a, f) => a + flowerValue(this.run, f.t, f.fresh), 0) : 0;
        if (S.carryB) v += S.carryB.value;
        const pot = st.neon ? SMALL_POT_PRICE : 0, wrap = (S.carry || S.carryB) && (st.decor || 0) >= 3 ? WRAP_FEE : 0;
        const coffee = (st.expand || 0) >= 1 ? COFFEE_PRICE : 0;
        this.sell(v + pot + wrap + coffee, pot, wrap);
        if (coffee) this.fx.text(REGISTER[0] * TS - 16, REGISTER[1] * TS - 4, '咖啡', '#e8c49a', 1.2, 1.1);
        if (S.carryB) this.fx.text(REGISTER[0] * TS - 6, REGISTER[1] * TS - 10, S.carryB.name, '#ffb3c8', 1.4, 1.2);
        S.carry = null; S.st = 'out'; S.outB = S.carryB; S.carryB = null; this.queue.shift(); this.advanceQueue();
        h.goTo([SHOP_DOOR_IN, SHOP_DOOR_OUT], this.rush ? 64 : 46);
      } else if (S.st === 'out' && !h.path.length) S.st = 'gone';
    }
    if (this.shoppers.some(h => h.shop.st === 'gone')) {
      this.people = this.people.filter(p => !p.shop || p.shop.st !== 'gone');
      this.shoppers = this.shoppers.filter(h => h.shop.st !== 'gone');
    }
  }
  sell(v, pot, wrap) {
    if (v <= 0) return;
    this.run.money += v; this.daySales += v;
    this.fx.coin(REGISTER[0] * TS, REGISTER[1] * TS, '+' + Math.round(v).toLocaleString('en-US'), 1.55, 1.15);
    if (pot) this.fx.text(REGISTER[0] * TS - 20, REGISTER[1] * TS + 8, '小盆栽', '#a8f0bc', 1.3, 1.1);
    if (wrap) this.fx.text(REGISTER[0] * TS + 4, REGISTER[1] * TS + 16, '包裝費', '#f6d0a8', 1.3, 1.1);
    SFX.play('coin'); setTimeout(() => SFX.play('coin'), 90);
    this.regPop = 0.3;
  }
  // 傍晚收店：剩下的花一次賣完
  *closeShop() {
    this.shopOn = false;
    let w = 0;
    yield { update: dt => { w += dt; return w > 7 || !this.shoppers.length; } };
    const rest = this.stock.filter(f => this.canSell(f)), bqs = this.bouquets.splice(0);
    if (rest.length || bqs.length) {
      const v = rest.reduce((a, f) => a + flowerValue(this.run, f.t, f.fresh), 0) + bqs.reduce((a, b) => a + b.value, 0);
      const keep = this.stock.filter(f => !this.canSell(f));
      this.stock.length = 0; this.stock.push(...keep);
      this.sell(v, 0);
      UI.toast(`剩下的${rest.length ? ` ${rest.length} 束花` : ''}${bqs.length ? `${rest.length ? '和' : ''} ${bqs.length} 個花束` : ''}，傍晚也全部賣掉了（+${money(v)}）`, 2800);
      yield wait(1.3);
    }
  }
  // 月底：一早客人擠進來，把昨晚的花買光
  *rushSale() {
    if (!this.stock.length && !this.bouquets.length) return;
    yield this.say('月底了！先把昨晚的花賣完再算帳。');
    UI.hideDialog();
    this.rush = true; this.shopOn = true; this.shopT = 0.2;
    let w = 0;
    yield { update: dt => { w += dt; return w > 9 || (!this.stock.length && !this.bouquets.length && w > 2); } };
    yield* this.closeShop();
    this.rush = false;
  }
  // ---- 花束 ----
  sellableCount() { return this.stock.filter(f => this.canSell(f)).length; }
  canBouquet() { return this.n > 1 && this.mode === 'play' && !this.focus && !(this.hide && !this.hide.done) && this.sellableCount() >= BQ_MIN; }
  openStudio(done) { UI.bouquetStudio(this, () => { if (done) done(); }); }
  // 熟客指定：今天店裡的花湊得出來的花束（優先沒做過的）
  pickRequest() {
    if (this.n < 2 || this.n > 4 || this.request) return;
    const have = {}; for (const f of this.stock) if (this.canSell(f)) have[f.t] = (have[f.t] || 0) + 1;
    const types = Object.keys(have); if (types.length < 2 || this.sellableCount() < BQ_MIN) return;
    const B = bookOf(this.run), cand = [];
    for (const r of RECIPES) if (Object.keys(r.need).every(t => (have[t] || 0) >= r.need[t])) cand.push({ kind: 'recipe', id: r.id, label: '「' + r.name + '」', fresh: !B.recipes[r.id] });
    // 配色：試所有三枝的組合
    const seen = new Set();
    for (let i = 0; i < types.length; i++) for (let j = i; j < types.length; j++) for (let k = j; k < types.length; k++) {
      const st = [types[i], types[j], types[k]], need = {}; for (const t of st) need[t] = (need[t] || 0) + 1;
      if (!Object.keys(need).every(t => have[t] >= need[t])) continue;
      const sc = bouquetScheme(st); if (sc === 'free' || seen.has(sc)) continue;
      seen.add(sc); cand.push({ kind: 'scheme', id: sc, label: '「' + SCHEMES[sc].name + '」配色的花束', fresh: !B.schemes[sc] });
    }
    if (!cand.length) return;
    const pool = cand.filter(c => c.fresh).length ? cand.filter(c => c.fresh) : cand;
    const c = pool[Math.floor(Math.random() * pool.length)];
    this.request = Object.assign(c, { bonus: 300 + this.n * 150, done: false });
  }
  requestOk(bq) { const r = this.request; return !!r && (r.kind === 'recipe' ? bq.recipe === r.id : bq.scheme === r.id); }
  bouquetMade(bq) {
    const x = 11 * TS, y = 7.4 * TS;
    this.fx.text(x, y - 18, bq.name + '！', '#ffb3c8', 1.5, 1.4);
    for (let i = 0; i < 14; i++) { const a = Math.random() * Math.PI * 2, r = rnd(0.2, 0.9); this.sparks.push({ x: 11 + Math.cos(a) * r * 0.5, y: 1.3 + rnd(-0.2, 0.3), z: 7.5 + Math.sin(a) * r * 0.2, vx: Math.cos(a) * r, vy: rnd(0.3, 1), vz: Math.sin(a) * r * 0.3, t: -i * 0.02, life: rnd(0.6, 1.1) }); }
  }
  onSkill(id) { if (id === 'bouquet' && this.canBouquet()) this.openStudio(); }

  // 接訂單
  addOrder(id, who) {
    const o = (ORDERS[this.n] || []).find(x => x.id === id); if (!o) return;
    const list = this.run.orders[this.n] || (this.run.orders[this.n] = []);
    if (list.some(x => x.id === id)) return;
    list.push(Object.assign({}, o, who ? { who } : {}));
    SFX.play('ui'); SFX.play('coin');
    const k = storeOf(this.run).scooter ? 2 : 1;
    UI.toast(`接到訂單：${who || o.who}要 ${FLOWERS[o.t].name} ×${o.n}（${o.mode === 'each' ? '每朵' : '湊齊'} +${money(o.reward * k)}${k > 1 ? '，外送 ×2' : ''}）`, 3400);
  }
  addOrderObj(o, night = this.n) {
    const list = this.run.orders[night] || (this.run.orders[night] = []);
    list.push(Object.assign({}, o));
    SFX.play('ui'); SFX.play('coin');
    const k = storeOf(this.run).scooter ? 2 : 1;
    UI.toast(`接到訂單：${o.who}要 ${FLOWERS[o.t].name} ×${o.n}（${o.mode === 'each' ? '每朵' : '湊齊'} +${money(o.reward * k)}${k > 1 ? '，外送 ×2' : ''}）`, 3400);
  }
  // ---- 花店升級：鏡頭帶過去看 ----
  reveal(id, lv, cb) {
    const spot = { lights: [7.5, 5.2], fridge: [12.6, 9.9], neon: [5.5, 4.4], scooter: [11.2, 17.6], decor: [[5.4, 9.6], [3.4, 6.2], [3.2, 12.4]][lv - 1], expand: [[11.6, 12.4], [11.2, 16.6], [6.5, 5.6], [7.6, 10.2]][lv - 1] }[id] || [7.5, 9];
    const u = STORE_UPGRADES.find(x => x.id === id);
    this.focus = { x: spot[0], z: spot[1], t: 0, dur: 3.0, cb, id, lv };
    if (id === 'decor' || id === 'expand') { this.layoutDisplays(); this.cat.unstick(this); }
    this.mode = 'reveal'; Input.release(); this.cat.moving = false;
    SFX.play('heart'); setTimeout(() => SFX.play('buy'), 250);
    const hy = { lights: 2.2, fridge: 1.2, neon: 2.2, scooter: 0.8, decor: 1.0, expand: lv === 4 ? 2.0 : 1.0 }[id] || 1;
    for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, r = rnd(0.2, 1.4); this.sparks.push({ x: spot[0] + Math.cos(a) * r * 0.4, y: hy + rnd(-0.3, 0.4), z: spot[1] + Math.sin(a) * r * 0.25, vx: Math.cos(a) * r, vy: rnd(0.4, 1.4), vz: Math.sin(a) * r * 0.4, t: -i * 0.02, life: rnd(0.8, 1.4) }); }
    this.fx.ring(spot[0] * TS, spot[1] * TS, 3 * TS, 'rgba(255,214,90,0.9)', 0.8);
    setTimeout(() => { if (this.focus) UI.say('美玲', (u.reveal && (u.reveal[lv - 1] || u.reveal[0])) || '好漂亮！', { auto: 2.6 }); }, 500);
  }
  inEar(a) { return dist(this.cat.x, this.cat.y - 4, a.x, a.y - 6) <= 3.5 * TS; }
  customer(key) {
    const h = new Human(key, SHOP_DOOR_OUT[0], SHOP_DOOR_OUT[1], 'up');
    this.people.push(h); return h;
  }
  remove(h) { this.people = this.people.filter(p => p !== h); }

  // ---- 劇本小動作 ----
  walk(h, pts, speed = 34) { h.goTo(pts, speed); return { update: () => h.path.length === 0 }; }
  walkIn(h, spot = COUNTER_SPOT) {
    SFX.play('chime');
    return this.walk(h, [SHOP_DOOR_IN, spot], 46);
  }
  walkOut(h) {
    const self = this;
    h.goTo([SHOP_DOOR_IN, SHOP_DOOR_OUT], 50);
    return { update() { if (h.path.length) return false; self.remove(h); return true; } };
  }
  // 一句話。重點句會冒出情報泡泡，要貓衝過去抓
  line(who, name, text, o = {}) {
    const self = this;
    return {
      started: false, t: 0,
      dur: o.dur || clamp(1.1 + text.length * 0.075, 2.0, 4.0),
      update(dt) {
        if (!this.started) {
          this.started = true; self.skip = false;
          if (who && who !== self.meiling) who.face(o.faceX || self.meiling.x, o.faceY || self.meiling.y);
          if (o.listener) o.listener.face(who.x, who.y);
          if (o.intel && !self.run.intel[o.intel] && who) self.spawnBubble(who, o.intel);
          else if (!o.intel && who && who !== self.meiling && !o.always && Math.random() < (self.n === 1 ? 0.12 : 0.2)) self.spawnBubble(who, null, false, 'gold');
        }
        if (who) who.bubble = true;
        UI.say(name, text, { intel: !!o.intel && !self.run.intel[o.intel] });
        this.t += dt;
        if (this.t >= this.dur || (self.skip && this.t > 0.5)) {
          self.skip = false; if (who) who.bubble = false;
          return true;
        }
        return false;
      },
    };
  }
  *talk(who, name, lines) {
    // lines: [文字, 情報key, 說話的人(預設 who)]
    const keys = [];
    for (const l of lines) {
      const [text, intel, sp] = l;
      const speaker = sp === 'M' ? this.meiling : who;
      const nm = sp === 'M' ? '美玲' : name;
      if (intel) keys.push([speaker, nm, text, intel]);
      yield this.line(speaker, nm, text, { intel, listener: speaker === this.meiling ? who : this.meiling });
    }
    UI.hideDialog();
    // 等這段話的泡泡被抓完或飛走
    let waitT = 0;
    yield { update: dt => { waitT += dt; return waitT > 8 || !this.bubbles.some(bb => keys.some(k => k[3] === bb.key)); } };
    // 沒抓到的重點再講一次
    const miss = keys.filter(k => !this.run.intel[k[3]]);
    if (miss.length) {
      yield this.line(who, name, '我剛剛是說啊——', { dur: 1.4, listener: this.meiling });
      for (const [sp, nm, text, intel] of miss) yield this.line(sp, nm, text, { intel, listener: sp === this.meiling ? who : this.meiling });
      UI.hideDialog();
    }
  }
  // ---- 情報泡泡 ----
  // 每種泡泡躲法不一樣：一般的會飄、時間的會衝刺、喜好的害羞躲在人後面、警告的一碰就分裂、橘貓的會瞬間移動、金色的跑很快但有罐罐
  spawnBubble(who, key, practice = false, kind) {
    const type = kind || (practice ? 'rent' : (INTEL_TYPE[key] || 'time'));
    const side = Math.random() < 0.5 ? -1 : 1;
    const b = { key, type, practice, x: who.x, y: who.y - 24, vx: side * rnd(10, 22), vy: rnd(-24, -12), t: 0, life: practice ? 1e9 : type === 'gold' ? 4.6 : 8.5, seed: rnd(0, 6), who, dashT: rnd(0.5, 0.9), blinkT: rnd(1.4, 1.9) };
    this.bubbles.push(b);
    SFX.play(type === 'gold' ? 'coin' : 'q');
    const hint = { time: '時間泡泡會突然衝刺！看準了再撲', heart: '喜好泡泡很害羞，會躲在說話的人後面', alert: '警告泡泡一碰就分成兩半，兩半都要抓到', cat: '這顆泡泡會瞬間移動！', gold: '金色泡泡！抓到有罐罐，但跑很快' }[type];
    if (!practice) {
      if (!this.run.flags.bub_any && type !== 'gold') { this.run.flags.bub_any = 1; UI.toast('有重點！慢慢靠近，按「撲」撲過去抓', 2600); }
      else if (hint && !this.run.flags['bub_' + type]) { this.run.flags['bub_' + type] = 1; UI.toast(hint, 2800); }
    }
    return b;
  }
  updateBubbles(dt) {
    const c = this.cat, cx = c.x, cy = c.y - 6;
    const x0 = 1.5 * TS, x1 = 13.5 * TS, y0 = 4.0 * TS, y1 = 15.2 * TS;
    const pouncing = !!(c.jump && c.jump.pounce);
    // 跑步會嚇跑泡泡，慢慢走比較不會
    const fleeR = pouncing ? 8 : c.running ? 52 : c.moving ? 28 : 18, fleeF = pouncing ? 20 : c.running ? 150 : c.moving ? 62 : 30;
    const add = [];
    for (const b of this.bubbles) {
      b.t += dt;
      if (b.held) {
        const d = this.dog;
        if (!d) { this.popBubble(b, 'eaten'); continue; }
        b.heldT += dt;
        b.x = d.x + (d.dir === 'left' ? -7 : 7); b.y = d.y - 9;
        if (dist(d.x, d.y - 4, cx, cy + 2) < 12) { this.popBubble(b, 'cat'); this.fx.text(d.x, d.y - 18, '搶回來了！', '#ffd25a'); d.emote = 'q'; d.emoteT = 1; d.cool = 1.5; }
        else if (b.heldT > 5) this.popBubble(b, 'eaten');
        continue;
      }
      const tp = b.type;
      const wander = tp === 'heart' ? 16 : 34;
      b.vx += Math.cos(b.t * 1.9 + b.seed) * wander * dt;
      b.vy += Math.sin(b.t * 1.5 + b.seed * 1.3) * wander * dt;
      const d = Math.max(0.01, dist(b.x, b.y, cx, cy));
      if (!b.practice && d < fleeR * (tp === 'gold' ? 1.4 : 1)) { const f = fleeF * (tp === 'gold' ? 1.5 : tp === 'heart' ? 0.6 : 1); b.vx += (b.x - cx) / d * f * dt; b.vy += (b.y - cy) / d * f * dt; }
      if (b.practice && b.t > 6 && d > 20) { b.vx += (cx - b.x) / d * 20 * dt; b.vy += (cy - b.y) / d * 20 * dt; }
      let max = b.practice ? 9 : 26;
      if (tp === 'time') {
        // 一陣一陣衝刺
        b.dashT -= dt;
        if (b.dashT <= 0) { b.dashT = rnd(0.75, 1.15); const a = Math.atan2(b.y - cy, b.x - cx) + rnd(-1.4, 1.4); b.vx = Math.cos(a) * 46; b.vy = Math.sin(a) * 46; b.dash = 0.25; }
        if (b.dash > 0) b.dash -= dt;
        max = b.dash > 0 ? 48 : 22;
      } else if (tp === 'heart' && b.who && !b.who.hidden) {
        // 害羞：躲到說話的人身後（離貓的另一邊）
        const w = b.who, ax = w.x - cx, ay = (w.y - 22) - cy, al = Math.hypot(ax, ay) || 1;
        const hx = w.x + ax / al * 13, hy = w.y - 22 + ay / al * 9;
        b.vx += (hx - b.x) * 2.4 * dt; b.vy += (hy - b.y) * 2.4 * dt;
        max = 22;
      } else if (tp === 'cat') {
        b.blinkT -= dt;
        if (b.blinkT <= 0) {
          b.blinkT = rnd(1.3, 1.9);
          this.fx.ring(b.x, b.y, 10, 'rgba(255,170,90,0.8)', 0.35);
          for (let k = 0; k < 12; k++) { const nx = rnd(x0, x1), ny = rnd(y0, y1); if (dist(nx, ny, cx, cy) > 34 && dist(nx, ny, b.x, b.y) < 60) { b.x = nx; b.y = ny; break; } }
          this.fx.ring(b.x, b.y, 10, 'rgba(255,170,90,0.8)', 0.35); SFX.tone(1200, 0.06, { to: 600, vol: 0.08, type: 'triangle' });
        }
      } else if (tp === 'gold') max = 40;
      if (b.half) max = 30;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
      b.vx *= 1 - 0.4 * dt; b.vy *= 1 - 0.4 * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < x0) { b.x = x0; b.vx = Math.abs(b.vx); } if (b.x > x1) { b.x = x1; b.vx = -Math.abs(b.vx); }
      if (b.y < y0) { b.y = y0; b.vy = Math.abs(b.vy); } if (b.y > y1) { b.y = y1; b.vy = -Math.abs(b.vy); }
      const catchR = (pouncing ? 16 : 11) + (b.half ? -1 : 0);
      if (dist(b.x, b.y, cx, cy) < catchR) {
        if (tp === 'alert' && !b.half) {
          // 分裂成兩半
          b.dead = true; const grp = { left: 2, key: b.key };
          for (const sd of [-1, 1]) add.push({ key: b.key, type: 'alert', half: true, grp, x: b.x + sd * 6, y: b.y, vx: sd * 44, vy: -26, t: 0, life: 5.5, seed: rnd(0, 6), who: b.who, dashT: 1, blinkT: 9 });
          SFX.tone(900, 0.08, { to: 1400, vol: 0.12, type: 'square' }); this.fx.text(b.x, b.y - 8, '分裂了！', '#ffb36b');
        } else this.popBubble(b, 'cat', pouncing);
      }
      else if (this.dog && !b.practice && tp !== 'gold' && !this.bubbles.some(o => o.held) && dist(b.x, b.y, this.dog.x, this.dog.y - 6) < 9) {
        b.held = true; b.heldT = 0; SFX.play('bark');
        this.fx.text(this.dog.x, this.dog.y - 18, '汪！', '#ffd25a');
        if (!this.tips.dogGrab) { this.tips.dogGrab = 1; UI.toast('小柴叼走泡泡了！追上去搶回來', 2600); }
      }
      else if (b.t > b.life) this.popBubble(b, 'gone');
    }
    this.bubbles = this.bubbles.filter(b => !b.dead).concat(add);
    if (this.pounceCD > 0) this.pounceCD -= dt;
  }
  popBubble(b, by, pounce) {
    b.dead = true;
    if (by === 'cat') {
      SFX.play('pick'); SFX.play('coin');
      this.fx.ring(b.x, b.y, 14, 'rgba(255,214,90,0.9)', 0.4);
      if (b.practice) { this.fx.text(b.x, b.y - 8, '記下了！', '#ffd25a'); this.practiceDone = true; return; }
      if (b.half && b.grp.left > 1) { b.grp.left--; this.fx.text(b.x, b.y - 8, pounce ? '漂亮的一撲！' : '抓到一半！', '#ffd25a'); UI.toast('還有另一半！', 1400); return; }
      // 連抓：一顆都沒漏掉就一直累積，第二顆起每顆送一個罐罐
      this.bubbleCombo = (this.bubbleCombo || 0) + 1;
      let cans = b.type === 'gold' ? 3 : 0;
      if (this.bubbleCombo >= 2) cans += 1;
      if (cans) { this.run.cans += cans; this.bubbleCans = (this.bubbleCans || 0) + cans; }
      const words = [];
      if (pounce) words.push('漂亮的一撲！');
      if (this.bubbleCombo >= 2) words.push('連抓 ×' + this.bubbleCombo);
      this.fx.text(b.x, b.y - 8, words.length ? words.join('　') : '記下了！', pounce ? '#ff9fcb' : '#ffd25a', 1.6);
      if (cans) this.fx.coin(b.x, b.y + 4, '+' + cans + ' 罐罐', 1.0, 0.9);
      if (b.type === 'gold') return;
      if (!this.run.intel[b.key]) { this.run.intel[b.key] = this.n; this.heardCount++; }
      UI.toast('記下了：' + INTEL[b.key], 2600);
    } else {
      if (!b.practice && b.type !== 'gold') { if ((this.bubbleCombo || 0) >= 2) this.fx.text(b.x, b.y - 18, '連抓中斷', '#b8b3d8'); this.bubbleCombo = 0; }
      if (by === 'eaten') {
        SFX.play('bark'); this.fx.text(b.x, b.y - 8, '被吃掉了…', '#ff9a7a');
        this.fx.ring(b.x, b.y, 10, 'rgba(255,140,110,0.8)', 0.4);
        if (!this.tips.dogAte) { this.tips.dogAte = 1; UI.toast('太慢了，小柴把情報吃掉了', 2400); }
      } else this.fx.text(b.x, b.y - 6, b.type === 'gold' ? '金泡泡飛走了…' : '飛走了…', '#b8b3d8');
    }
  }
  // 撲：往泡泡（預測它等一下的位置）撲過去，不會穿牆
  pounce(b) {
    const c = this.cat;
    let tx = b.x + b.vx * 0.22, ty = b.y + 6 + b.vy * 0.22;
    const dx = tx - c.x, dy = ty - c.y, dd = Math.hypot(dx, dy), maxD = 42;
    if (dd > maxD) { tx = c.x + dx / dd * maxD; ty = c.y + dy / dd * maxD; }
    const steps = Math.max(1, Math.ceil(Math.hypot(tx - c.x, ty - c.y) / 2));
    let fx = c.x, fy = c.y;
    for (let i = 1; i <= steps; i++) { const k = i / steps, x = lerp(c.x, tx, k), y = lerp(c.y, ty, k); if (c.hits(this, x, y)) break; fx = x; fy = y; }
    c.jump = { x0: c.x, y0: c.y, x1: fx, y1: fy, t: 0, dur: 0.3, hopPx: 10, pounce: true };
    c.dir = Math.abs(fx - c.x) > Math.abs(fy - c.y) * 0.5 ? (fx < c.x ? 'left' : 'right') : (fy < c.y ? 'up' : 'down');
    c.pose = null; this.pounceCD = 0.55;
    SFX.noise(0.14, { vol: 0.14, freq: 1800, ftype: 'highpass' }); SFX.tone(380, 0.2, { to: 760, vol: 0.12, type: 'triangle' });
  }
  drawBubbles(ctx) {
    for (const b of this.bubbles) {
      const left = b.life - b.t;
      if (left < 2.5 && Math.floor(b.t * 8) % 2 === 0) continue;
      if (b.type === 'cat' && b.blinkT < 0.3 && Math.floor(b.t * 16) % 2 === 0) continue;
      const bob = Math.round(Math.sin(b.t * 4 + b.seed) * 1.5);
      ctx.fillStyle = 'rgba(10,8,20,0.25)'; ctx.fillRect(Math.round(b.x) - 3, Math.round(b.y) + 13, 7, 1);
      drawSpr(ctx, G.S.bubble[b.type] || G.S.bubble.time, b.x, b.y + 8 + bob, 0.5, 1);
    }
  }
  say(text, o = {}) { return this.line(this.meiling, '美玲', text, Object.assign({ always: true }, o)); }
  modal(fn) {
    let done = false;
    return { started: false, update() { if (!this.started) { this.started = true; fn(() => { done = true; }); } return done; } };
  }

  // ---- 王太太認花 ----
  // 她會在店裡東張西望，一半的停留點看得到玫瑰；看過就記住（懷疑度不會掉回去太多），
  // 懷疑到一半會直接走過去細看。要擋住她的視線、撥倒東西引開、或對她賣萌才過得了。
  // o：{ who, name, target, route, near, t, label, sub, start, toast }（不給就是王太太認玫瑰）
  startHide(o = {}) {
    const w = o.who || this.hideWang;
    const sus = o.start !== undefined ? o.start : clamp(0.12 + (this.run.lastNight ? this.run.lastNight.rosePetals : 0) * 0.04 + (this.run.flags.wangSaw ? 0.25 : 0), 0, 0.6);
    const rx = ROSE_SPOT[0] + 0.5, ry = ROSE_SPOT[1] + 0.42;
    const at = (x, y) => Math.atan2(ry - (y - 0.33), rx - x);
    this.hide = {
      who: w, name: o.name || '王太太', target: o.target || this.roseDisplay, label: o.label || '王太太的懷疑', sub: o.sub || '美玲包花中',
      t: o.t || 30, meter: sus, floor: sus, done: false, result: null, petUses: 0, petT: 0, distractT: 0, stop: 0, pauseT: 0,
      mode: 'browse', stareT: 0, approachCD: 0, seenOnce: false,
      near: o.near || [ROSE_SPOT[0] + 1.4, ROSE_SPOT[1] - 0.5],
      route: o.route || [
        { p: [6.0, 10.9], a: -Math.PI / 2 },   // 看花架
        { p: [4.4, 12.3], a: at(4.4, 12.3) },   // 往窗邊走，瞄到玫瑰
        { p: [2.8, 9.6], a: -2.5 },              // 看左邊牆上的花
        { p: [5.6, 13.5], a: at(5.6, 13.5) },   // 走到門口又回頭看
        { p: [9.6, 12.2], a: 0.7 },              // 看右邊櫥窗
        { p: [3.9, 13.0], a: at(3.9, 13.0) },   // 又晃回玫瑰旁邊
      ],
    };
    w.goTo([[this.hide.route[0].p[0] * TS, this.hide.route[0].p[1] * TS]], 22);
    UI.meter(true, this.hide.label, this.hide.meter, this.hide.sub + ' ' + this.hide.t + ' 秒');
    UI.toast(o.toast || '別讓王太太認出那盆玫瑰！擋住她的視線、撥倒東西引開她，或對她賣萌', 4200);
  }
  hideNext(H, w) { H.mode = 'browse'; const p = H.route[H.stop].p; w.goTo([[p[0] * TS, p[1] * TS]], 22); }
  updateHide(dt) {
    const H = this.hide, w = H && H.who, c = this.cat;
    if (!H || H.done) return;
    H.t -= dt; H.approachCD = Math.max(0, H.approachCD - dt);
    const rose = H.target;
    const roseA = rose ? Math.atan2(rose.y - 6 - (w.y - 4), rose.x - w.x) : 0;
    if (H.petT > 0) {
      H.petT -= dt; w.moving = false; w.face(c.x, c.y);
      H.meter = Math.max(0, H.meter - 0.12 * dt); H.floor = Math.min(H.floor, H.meter);
      if (H.petT <= 0) this.hideNext(H, w);
    } else if (H.distractT > 0) {
      H.distractT -= dt;
      if (w.stepPath(dt)) { w.ang = H.lookA + Math.sin(H.distractT * 3) * 0.5; w.dir = angToDir(w.ang); }
      if (H.distractT <= 0) this.hideNext(H, w);
    } else if (H.mode === 'approach') {
      // 走過去細看那盆玫瑰
      if (w.path.length) w.stepPath(dt);
      else {
        w.moving = false; w.ang = angLerp(w.ang, roseA + Math.sin(H.stareT * 2.2) * 0.12, Math.min(1, dt * 5)); w.dir = angToDir(w.ang);
        H.stareT -= dt;
        if (H.stareT <= 0) {
          // 被擋住看不清楚：先放過
          H.meter = Math.max(H.floor, H.meter - 0.08); H.approachCD = 6;
          UI.say(H.name, '……應該是我看錯了吧。', { auto: 1.6 });
          H.stop = (H.stop + 1) % H.route.length; this.hideNext(H, w);
        }
      }
    } else if (w.path.length) {
      w.stepPath(dt);
      if (!w.path.length) { H.pauseT = 3.2; }
    } else {
      H.pauseT -= dt;
      const st = H.route[H.stop];
      w.ang = angLerp(w.ang, st.a + Math.sin(H.pauseT * 1.7) * 0.4, Math.min(1, dt * 4)); w.dir = angToDir(w.ang);
      if (H.pauseT <= 0) { H.stop = (H.stop + 1) % H.route.length; this.hideNext(H, w); }
    }
    // 看到玫瑰？
    let seeing = false;
    if (H.petT <= 0 && rose) {
      const ex = w.x, ey = w.y - 4, rx = rose.x, ry = rose.y - 6;
      const d = dist(ex, ey, rx, ry);
      if (d < 3.7 * TS && angDiff(Math.atan2(ry - ey, rx - ex), w.ang) < 0.62 && lineOfSight(this.map, ex, ey, rx, ry, null)) {
        // 貓擋在中間？
        const cx = c.x, cy = c.y - 4;
        const t = clamp(((cx - ex) * (rx - ex) + (cy - ey) * (ry - ey)) / (d * d), 0, 1);
        const px = ex + (rx - ex) * t, py = ey + (ry - ey) * t;
        const blocked = t > 0.12 && t < 0.98 && dist(cx, cy, px, py) < 7.5;
        if (blocked) { if (!this.tips.block) { this.tips.block = 1; UI.toast('擋得好！王太太只看到一隻貓'); } }
        else seeing = true;
      }
    }
    if (seeing) {
      H.meter = Math.min(1, H.meter + 0.24 * dt * (1.25 - 0.5 * dist(w.x, w.y, rose.x, rose.y) / (3.7 * TS)));
      H.floor = Math.max(H.floor, H.meter * 0.6);   // 看過就記得
      if (!H.seenOnce) { H.seenOnce = true; if (!this.tips.wangLook) { this.tips.wangLook = 1; UI.toast(H.name + '往那桶花看了！站到中間擋住視線', 2600); } }
      // 懷疑到一半：直接走過去細看
      if (H.mode === 'browse' && H.meter >= 0.55 && H.approachCD <= 0 && H.distractT <= 0) {
        H.mode = 'approach'; H.stareT = 3.2;
        w.goTo([[H.near[0] * TS, H.near[1] * TS]], 26); w.setEmote('q', 1.2);
        UI.say(H.name, '咦……那個花……', { auto: 1.6 });
      }
    } else if (H.mode !== 'approach') H.meter = Math.max(H.floor, H.meter - 0.02 * dt);
    w.emote = seeing ? 'q' : null;
    UI.meter(true, H.label, H.meter, H.sub + ' ' + Math.max(0, Math.ceil(H.t)) + ' 秒', seeing);
    if (H.meter >= 1) { H.done = true; H.result = 'fail'; }
    else if (H.t <= 0) { H.done = true; H.result = 'win'; }
    if (H.done) { UI.meter(false); w.emote = H.result === 'fail' ? 'ex' : 'heart'; w.emoteT = 2; }
  }

  // ---- 每格更新 ----
  update(dt) {
    this.fx.update(dt);
    if (this.mode === 'play') {
      this.cat.move(dt, this, true);
      if (this.cat.inv > 0) this.cat.inv -= dt;
    } else { this.cat.t += dt; this.cat.moving = false; }
    for (const p of this.people) { p.update(dt); if (!this.hide || this.hide.done || p !== this.hide.who) p.stepPath(dt); }
    this.updateShoppers(dt);
    if (this.regPop > 0) this.regPop -= dt;
    for (const sp of this.sparks) { sp.t += dt; if (sp.t > 0) { sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.z += sp.vz * dt; sp.vy -= dt * 0.8; } }
    this.sparks = this.sparks.filter(sp => sp.t < sp.life);
    if (this.focus) {
      this.focus.t += dt;
      // 點一下畫面就跳過揭曉
      if ((this.skip || Input.stick) && this.focus.t > 1.1 && this.focus.t < this.focus.dur - 0.2) { this.focus.t = this.focus.dur - 0.2; this.skip = false; }
      if (this.focus.t >= this.focus.dur) { const cb = this.focus.cb; this.focus = null; this.mode = 'play'; UI.hideDialog(); if (cb) cb(); }
    }
    if (this.dog) this.updateDog(dt);
    this.updateBubbles(dt);
    if (this.cutin && this.cutin.update(dt)) this.cutin = null;
    if (this.hide && !this.hide.done) this.updateHide(dt);
    this.runner.update(dt);
    this.findTarget();
    if (!this.tips.move && this.runner && this.allowTip) { this.tips.move = 1; }
    if (this.focus) Cam.follow(this.focus.x * TS, this.focus.z * TS, this.map, dt, false);
    else Cam.follow(this.cat.x, this.cat.y, this.map, dt, false);
    UI.dayHud(this);
  }
  updateDog(dt) {
    const d = this.dog, L = this.dogOwner; d.update(dt);
    let tx = L.x + 9, ty = L.y + 2;
    if (this.bubbles.some(b => b.held)) {
      // 叼著泡泡，躲貓
      const c = this.cat;
      let ax = d.x - c.x, ay = d.y - c.y; const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
      d.wander = (d.wander || 0) + dt * 2.3;
      ax += Math.cos(d.wander) * 0.5; ay += Math.sin(d.wander * 1.3) * 0.5;
      const sp = (al < 50 ? 46 : 26) * dt;
      let moved = false;
      for (const rot of [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9, 2.6, -2.6]) {
        const ca = Math.cos(rot), sa = Math.sin(rot);
        const vx = ax * ca - ay * sa, vy = ax * sa + ay * ca, vl = Math.hypot(vx, vy) || 1;
        const nx = d.x + vx / vl * sp, ny = d.y + vy / vl * sp;
        if (nx < 1.5 * TS || nx > 13.5 * TS || ny < 4.4 * TS || ny > 15.4 * TS) continue;
        if (this.solid(nx - 3, ny - 2) || this.solid(nx + 3, ny - 2) || this.solid(nx, ny)) continue;
        if (Math.abs(nx - d.x) > 0.05) d.dir = nx < d.x ? 'left' : 'right';
        d.x = nx; d.y = ny; moved = true; break;
      }
      d.moving = moved;
      return;
    }
    const prey = this.bubbles.filter(b => !b.practice && dist(b.x, b.y, d.x, d.y) < 5 * TS).sort((a, b) => dist(a.x, a.y, d.x, d.y) - dist(b.x, b.y, d.x, d.y))[0];
    if (prey) {
      const ddx = prey.x - d.x, ddy = prey.y + 6 - d.y, dd2 = Math.hypot(ddx, ddy) || 1;
      const st = Math.min(dd2, 30 * dt);
      d.x += ddx / dd2 * st; d.y += ddy / dd2 * st; d.moving = true;
      if (Math.abs(ddx) > 0.4) d.dir = ddx < 0 ? 'left' : 'right';
      return;
    }
    const dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy);
    d.moving = dd > 1.5; if (dd > 0.5) { const k = Math.min(1, dt * 5); d.x += dx * k; d.y += dy * k; }
    if (Math.abs(dx) > 0.4) d.dir = dx < 0 ? 'left' : 'right';
    if (dist(d.x, d.y, this.cat.x, this.cat.y) < 2 * TS && d.cool <= 0) {
      d.cool = 3; d.barkT = 1; d.emote = 'ex'; d.emoteT = 1; SFX.play('bark');
      d.dir = this.cat.x < d.x ? 'left' : 'right';
      this.fx.text(d.x, d.y - 12, '汪！', '#ffd25a');
    }
  }
  findTarget() {
    const c = this.cat; let label = null; this.target = null;
    if (this.mode === 'play' && !c.jump && !(this.pounceCD > 0)) {
      let bd = 46;
      for (const b of this.bubbles) { if (b.held) continue; const d = dist(c.x, c.y - 6, b.x, b.y); if (d < bd) { bd = d; this.target = { kind: 'pounce', ref: b }; label = '撲'; } }
    }
    if (this.mode === 'play' && !this.target) {
      let bd = 17;
      for (const k of this.knocks) { if (k.used) continue; const d = dist(c.x, c.y - 4, k.x, k.y - 5); if (d < bd) { bd = d; this.target = { kind: 'knock', ref: k }; label = '撥'; } }
      if (this.hide && !this.hide.done && this.hide.who && dist(c.x, c.y, this.hide.who.x, this.hide.who.y) < 1.7 * TS) { this.target = { kind: 'cute' }; label = '賣萌'; }
    }
    UI.setAction(label); UI.setWait(false, false);
  }
  onAction() {
    const tg = this.target; if (!tg) return;
    if (tg.kind === 'pounce') { if (!tg.ref.dead) this.pounce(tg.ref); return; }
    if (tg.kind === 'knock') {
      const k = tg.ref; k.used = true; SFX.play('knock'); vibrate(30);
      this.fx.text(k.x, k.y - 14, '鏗！', '#ffd25a'); this.fx.ring(k.x, k.y - 4, 5 * TS, 'rgba(255,214,90,0.8)', 0.8);
      if (this.hide && !this.hide.done) {
        const H = this.hide, w = H.who;
        H.distractT = 3; H.pauseT = 0; H.lookA = Math.atan2(k.y - w.y, k.x - w.x); H.mode = 'browse'; H.approachCD = Math.max(H.approachCD, 4);
        const tx = lerp(w.x, k.x, 0.6), ty = lerp(w.y, k.y, 0.6);
        w.goTo([[tx, ty]], 30); w.setEmote('q', 1);
        UI.say('美玲', '（後面傳來）花喵！不要亂撥東西啦！', { auto: 1.6 });
      } else UI.say('美玲', '花喵！不要亂撥東西啦！', { auto: 1.6 });
    } else if (tg.kind === 'cute') {
      const H = this.hide, c = this.cat, w = H.who;
      const dur = [3, 2, 1.2, 0.6][Math.min(3, H.petUses)];
      H.petUses++; H.petT = dur; H.distractT = 0; H.mode = 'browse'; H.approachCD = Math.max(H.approachCD, dur + 2.5);
      c.pose = 'belly'; c.dir = w.x < c.x ? 'left' : 'right';
      setTimeout(() => { if (c.pose === 'belly') c.pose = null; }, dur * 1000);
      if (H.petUses <= 2) this.cutin = new CuteCut('belly', w.key);
      this.fx.hearts(w.x, w.y - 18, 4); SFX.play('purr');
      UI.say(H.name, dur > 1 ? '哎唷～翻肚給我看喔～' : '好啦好啦，可愛可愛。', { auto: 1.6 });
      if (H.petUses >= 3 && !this.tips.immune) { this.tips.immune = 1; UI.toast('同一招用太多次，' + H.name + '快免疫了'); }
    }
  }
  onWait() { }

  render(ctx) {
    ctx.fillStyle = '#12142a'; ctx.fillRect(0, 0, View.w, View.h);
    Cam.begin(ctx);
    ctx.drawImage(this.bg, 0, 0);
    drawSpr(ctx, G.S.obj.box, 12.5 * TS, 13 * TS, 0.5, 1);
    const L = [];
    for (const d of this.displays) L.push({ y: d.y, d: g => this.drawDisplay(g, d, this.displayArt(d)) });
    if (this.roseDisplay) { const d = this.roseDisplay; L.push({ y: d.y, d: g => this.drawDisplay(g, d) }); }
    for (const k of this.knocks) L.push({ y: k.y, d: g => { drawSpr(g, k.used ? G.S.obj.smallPotDown : G.S.obj.smallPot, k.x, k.y + 1); } });
    for (const p of this.people) if (!p.hidden) L.push({ y: p.y, d: g => { p.draw(g); if (p.shop && p.shop.carry) drawSpr(g, G.S.icon[p.shop.carry[0].t], p.x + 5, p.y - 6, 0.5, 1); } });
    if (this.dog) L.push({ y: this.dog.y, d: g => this.dog.draw(g) });
    L.push({ y: this.cat.y + 0.5, d: g => this.cat.draw(g) });
    L.sort((a, b) => a.y - b.y);
    for (const it of L) it.d(ctx);
    // 王太太的視線
    if (this.hide && !this.hide.done && this.hide.who && this.hide.petT <= 0) {
      const w = this.hide.who;
      const pts = conePoly(this.map, w.x, w.y - 4, w.ang, 0.62, 3.7 * TS, null, 12);
      ctx.fillStyle = w.emote === 'q' ? 'rgba(255,110,90,0.22)' : 'rgba(255,214,120,0.18)';
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    }
    // 窗外照進來的光、飄著的灰塵
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = this.tint === 'evening' ? 'rgba(255,140,70,0.08)' : 'rgba(255,236,190,0.07)';
    for (const bx of [2.6, 10.4]) {
      const x0 = bx * TS, y0 = 16 * TS;
      ctx.beginPath(); ctx.moveTo(x0 - 8, y0); ctx.lineTo(x0 + 16, y0); ctx.lineTo(x0 + 40, y0 - 100); ctx.lineTo(x0 + 16, y0 - 100); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < 16; i++) {
      const ph = this.cat.t * 0.25 + i * 1.37;
      const x = (2.5 + (i * 37) % 11) * TS + Math.sin(ph) * 9, y = (5 + (i * 53) % 10) * TS + Math.cos(ph * 0.7) * 7;
      const a = (Math.sin(ph * 1.7) + 1) / 2;
      if (a < 0.4) continue;
      ctx.globalAlpha = a * 0.8; ctx.fillStyle = '#fff4d6'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); ctx.globalAlpha = 1;
    }
    for (const p of this.people) p.drawOver(ctx);
    if (this.dog) this.dog.drawOver(ctx);
    this.drawBubbles(ctx);
    if (this.target && this.target.kind === 'knock') {
      const r = this.target.ref, bob = Math.round(Math.sin(this.cat.t * 6));
      ctx.fillStyle = '#ffd25a'; ctx.fillRect(Math.round(r.x) - 2, Math.round(r.y) - 16 + bob, 5, 1); ctx.fillRect(Math.round(r.x) - 1, Math.round(r.y) - 15 + bob, 3, 1); ctx.fillRect(Math.round(r.x), Math.round(r.y) - 14 + bob, 1, 1);
    }
    this.fx.draw(ctx);
    Cam.end(ctx);
    // 早晨或傍晚的光
    if (this.tint === 'evening') { ctx.fillStyle = 'rgba(255,120,60,0.16)'; ctx.fillRect(0, 0, View.w, View.h); ctx.fillStyle = 'rgba(30,20,60,0.18)'; ctx.fillRect(0, 0, View.w, View.h); }
    else { ctx.fillStyle = 'rgba(255,236,200,0.06)'; ctx.fillRect(0, 0, View.w, View.h); }
    if (this.cutin) this.cutin.render(ctx);
  }
  drawDisplay(g, d, t = d.t) {
    if (d.h) d = { x: d.x, y: d.y - d.h * 7 };
    shadow(g, d.x, d.y, 10);
    drawSpr(g, G.S.obj.bucket, d.x, d.y + 1);
    if (t === 'empty') return;
    if (t === 'wilt') {
      g.fillStyle = '#8a7a52'; g.fillRect(Math.round(d.x) - 2, Math.round(d.y) - 8, 1, 4); g.fillRect(Math.round(d.x) + 1, Math.round(d.y) - 7, 1, 3);
      g.fillStyle = '#a07a6a'; g.fillRect(Math.round(d.x) - 3, Math.round(d.y) - 9, 2, 1); g.fillRect(Math.round(d.x) + 1, Math.round(d.y) - 8, 2, 1);
    } else {
      const ic = G.S.icon[t];
      drawSpr(g, ic, d.x - 2, d.y - 3, 0.5, 1); drawSpr(g, ic, d.x + 2, d.y - 4, 0.5, 1);
    }
  }
}

// ================= 劇本 =================
function* dayScript(S, n) {
  const run = S.run, M = S.meiling, mo = run.month || 1;
  if (n < 5) run.orders[n] = [];
  if (n > 1 && n < 5) {
    S.pickRequest();
    yield S.modal(done => UI.tally(run, done, S));
    S.startShop();
    if (S.stock.length) setTimeout(() => UI.toast(storeOf(run).neon ? '開店！霓虹招牌一亮，客人一個接一個進來' : '開店！客人會進來買昨晚的花', 2600), 300);
    if (mo > 1) { yield* monthDayScript(S, n); return; }
  }
  if (n === 5) yield S.modal(done => UI.tally(run, done, S));
  if (n === 1) {
    UI.banner('第一天・早上');
    yield wait(1.0);
    yield S.say('花喵，早安。店裡只剩這兩桶快謝的花了……');
    yield S.say('月底要繳兩萬塊房租，再沒花賣，這間店就要收起來了。');
    S.spawnBubble(S.meiling, 'rent', true);
    UI.hideDialog();
    UI.toast('講到重點會冒出泡泡。拖曳畫面靠近，按「撲」撲過去抓！', 6000);
    yield until(() => S.practiceDone);
    UI.toast('就是這樣！跑太快泡泡會被嚇跑，慢慢走近再撲', 3000);
    yield wait(1.4);
    // 王太太
    const w = S.customer('wang');
    yield S.walkIn(w);
    yield* S.talk(w, '王太太', [
      ['美玲啊，我女兒下禮拜結婚，想訂一束紅玫瑰。'],
      ['歹勢……最近都批不到貨。', null, 'M'],
      ['唉，我家院子那兩盆紅玫瑰開得正好，可是那是我的寶貝，捨不得剪。', 'wangRose'],
      ['我每天晚上都在窗邊追劇，追到十二點才睡。', 'wangTV'],
      ['對了，你們家貓好可愛！我最喜歡貓咪翻肚了～', 'wangCute'],
    ]);
    yield S.walkOut(w);
    // 林先生 + 小柴
    const l = S.customer('lin');
    S.dog = new Dog(SHOP_DOOR_OUT[0] + 9, SHOP_DOOR_OUT[1]); S.dog.state = 'walk'; S.dogOwner = l;
    yield S.walkIn(l, COUNTER_SPOT2);
    yield* S.talk(l, '林先生', [
      ['老闆娘，有沒有茉莉？我家院子那兩盆快被小柴啃光了。', 'linJasmine'],
      ['這傢伙鼻子超靈，一點花香都聞得到。', 'linNose'],
      ['我每天晚上十一點帶牠出去散步，繞巷子一圈，四十分鐘。', 'linWalk'],
      ['我是狗派的啦，貓咪撒嬌對我沒用……喵喵叫倒是有點可憐。', 'linDog'],
    ]);
    yield S.walkOut(l);
    for (const bb of S.bubbles) if (bb.held) S.popBubble(bb, 'eaten');
    S.bubbles = S.bubbles.filter(bb => !bb.dead);
    S.dog = null;
    // 阿伯
    const b = S.customer('bo');
    yield S.walkIn(b);
    yield* S.talk(b, '阿伯', [
      ['美玲，我那盆曇花今晚要開了，十二點開，一個鐘頭就謝。', 'boTanhua'],
      ['人老了睡不著，半夜都拿手電筒在院子走來走去。', 'boPace'],
      ['十二點半我一定進去泡茶，老習慣了。', 'boTea'],
      ['以前我也養過一隻貓，最愛蹭我的腳……', 'boRub'],
    ]);
    yield S.walkOut(b);
    S.tint = 'evening';
    UI.banner('傍晚');
    yield wait(1);
    yield S.say('唉，今天一朵花都沒賣出去……');
    yield S.say('花喵，晚安。明天再想辦法吧。');
    UI.hideDialog();
    yield wait(0.5);
    Flow.dayDone(n);
    return;
  }

  UI.banner(monthPre(run) + ['', '', '第二天', '第三天', '第四天', '月底'][n] + '・早上');
  yield wait(1);
  if (n === 5) { yield* S.rushSale(); yield* endingScript(S); return; }
  const nightBefore = run.lastNight || {};
  if (nightBefore.total > 0) yield S.say(n === 2 ? '咦？門口怎麼多了這些花……難道真的有花店小精靈？' : '門口又有花了！小精靈今天也來了耶。');
  else yield S.say('今天門口還是沒有花……');

  if (n === 2) {
    const b = S.customer('bo');
    yield S.walkIn(b);
    if (nightBefore.tanhua) {
      yield* S.talk(b, '阿伯', [
        ['美玲！我的曇花昨晚被偷了！'],
        ['這麼慘……要不要喝碗冰糖曇花湯？剛好有人在我們門口放了一朵。', null, 'M'],
        ['嗯……這湯好香，跟我家那朵一樣香。'],
      ]);
    } else {
      yield* S.talk(b, '阿伯', [['昨晚我的曇花開得真漂亮，香了一整晚。']]);
    }
    yield* S.talk(b, '阿伯', [['最近巷子怪怪的，我在院子裝了感應燈，看誰還敢來！', 'boLight']]);
    if (run.flags.boSaw) yield* S.talk(b, '阿伯', [['……昨晚那隻花貓，該不會就是你吧？'], ['我們家花喵很乖的啦！', null, 'M']]);
    yield* S.talk(b, '阿伯', [['對了美玲，初一要拜拜，幫我留兩朵茉莉，價錢好說。']]);
    S.addOrder('o2a');
    yield wait(0.6);
    yield S.walkOut(b);
  }
  if (n === 3) {
    const ch = S.customer('chief');
    yield S.walkIn(ch);
    yield* S.talk(ch, '里長', [
      ['美玲，最近巷子一直有花被偷，大家都在講。'],
      ['從今晚開始，巡守隊十一點半、一點十分各巡一次巷子！', 'patrolTimes'],
      ['……不過我最受不了小貓喵喵叫，叫兩聲我就心軟了。', 'chiefMeow'],
      ['啊對，今晚中秋，大家會在空地烤肉。明天里民活動要兩盆九重葛，幫我留喔！'],
    ]);
    S.addOrder('o3a');
    yield wait(0.6);
    yield S.walkOut(ch);
    const cu = S.customer('cust1');
    yield S.walkIn(cu, COUNTER_SPOT2);
    yield* S.talk(cu, '熟客', [
      ['妳知道巷底那間大宅嗎？下禮拜辦婚禮，從國外訂了蝴蝶蘭，一盆一千五！', 'orchid'],
      ['就放在花園的溫室，圍牆超高，還有監視器在掃。', 'camera'],
      ['那個管家超兇，可是我看到他手機桌布是一隻小貓。', 'butlerCat'],
      ['對了，我一直想看曇花。妳要是有，一朵我出一千二！'],
    ]);
    S.addOrder('o3b');
    yield wait(0.6);
    yield S.walkOut(cu);
  }
  if (n === 4) {
    const left = Math.max(0, rentDue(run) - run.money);
    yield S.say(left > 0 ? `這個月還差 ${money(left)}……還有最後一晚的花。` : '房租夠了！可是多存一點總是好的。');
    const cu = S.customer('cust2');
    yield S.walkIn(cu, COUNTER_SPOT2);
    yield* S.talk(cu, '花藝師', [
      ['我在幫大宅明天的婚禮做花藝。', null],
      ['聽說今晚管家要整晚在花園巡，巡守隊也會多巡一次。', 'wedding'],
      ['蝴蝶蘭有多少我收多少，一盆再多給妳八百！'],
    ]);
    S.addOrder('o4a');
    yield wait(0.6);
    if (run.flags.wangSaw || run.flags.linSaw || run.flags.patrolSaw) {
      yield* S.talk(cu, '花藝師', [['對了，大家都說最近巷子裡有一隻花貓鬼鬼祟祟的……'], ['我們家花喵每天晚上都在睡覺啦。', null, 'M']]);
    }
    yield S.walkOut(cu);
    yield S.say('（手機叮咚）王太太傳訊息：「婚禮花束還缺兩朵紅玫瑰，拜託拜託！」');
    S.addOrder('o4b');
    yield wait(0.8);
  }
  // 王太太認花：昨晚有偷到她家的玫瑰，而且還沒發生過
  let roseToday = false;
  if (run.rosePending && !run.roseDone) {
    roseToday = true;
    yield* roseScript(S);
  }
  // 警戒一顆星以上的鄰居會上門盤問
  { const vo = pickVisit(run); if (vo && !(vo === 'wang' && roseToday)) yield* visitScript(S, vo); }
  if (n === 2) {
    const cu = S.customer('cust2');
    yield S.walkIn(cu, COUNTER_SPOT2);
    yield* S.talk(cu, '熟客', [
      ['聽說隔壁巷有隻橘貓，什麼都偷得到。', 'orangeCat'],
      ['只要給牠罐罐，牠什麼都肯做。'],
      ['啊，我想訂三朵日日春，放在辦公室。'],
    ]);
    S.addOrder('o2b');
    yield wait(0.6);
    yield S.walkOut(cu);
  }
  // 讓客人再逛一下，然後收店
  if (S.stock.some(f => S.canSell(f)) || S.bouquets.length || storeOf(run).neon) { let w = 0; yield { update: dt => { if (!UI.modalOpen) w += dt; return w > 10 || (!S.stock.length && !S.bouquets.length && !storeOf(run).neon && !S.shoppers.length); } }; }
  yield* S.closeShop();
  S.tint = 'evening';
  UI.banner('傍晚');
  yield wait(0.8);
  if (S.daySales > 0) yield S.say(`今天賣了 ${money(S.daySales)}！` + ['', '', '花喵，賞你罐罐。', '店好像越來越有樣子了。', '明天就要繳房租了……'][n]);
  else yield S.say(['', '', '今天一朵花都沒賣……花喵，罐罐還是給你。', '今天沒花可賣……', '明天就要繳房租了……'][n] || '花喵，罐罐給你。');
  UI.hideDialog();
  yield wait(0.4);
  Flow.dayDone(n);
}

function* roseScript(S) {
  const run = S.run, M = S.meiling;
  const wasOn = S.shopOn; S.shopOn = false;
  { let w = 0; yield { update: dt => { w += dt; return w > 6 || !S.shoppers.length; } }; }
  S.roseDisplay = { t: 'rose', x: (ROSE_SPOT[0] + 0.5) * TS, y: (ROSE_SPOT[1] + 1) * TS - 1, tx: ROSE_SPOT[0], ty: ROSE_SPOT[1] };
  S.blocked.add(ROSE_SPOT[0] + ',' + ROSE_SPOT[1]);
  const w = S.customer('wang'); S.hideWang = w;
  yield S.walkIn(w);
  yield* S.talk(w, '王太太', [
    ['美玲，聽說妳這裡有紅玫瑰了？我女兒的婚禮就靠妳了！'],
    ['剛好有！我去後面拿包裝紙，等我一下喔～', null, 'M'],
  ]);
  UI.hideDialog();
  M.goTo([[7.5 * TS, 4.4 * TS], [7.5 * TS, 3.2 * TS]], 40);
  yield until(() => !M.path.length);
  M.hidden = true; SFX.play('door');
  S.startHide();
  yield until(() => S.hide && S.hide.done);
  const res = S.hide.result;
  S.hide.done = true;
  M.hidden = false; M.x = 7.5 * TS; M.y = 3.4 * TS;
  M.goTo([[7.5 * TS, 4.6 * TS], [11.5 * TS, 6.6 * TS]], 40);
  const roses = S.stock.filter(f => f.t === 'rose');
  const keep = S.stock.filter(f => f.t !== 'rose'); S.stock.length = 0; S.stock.push(...keep);
  run.roseDone = true;
  if (res === 'win') {
    yield* S.talk(w, '王太太', [
      ['哇，這朵玫瑰好漂亮！跟我家院子那朵一模一樣耶～'],
      ['那當然，我們家的花最新鮮了。', null, 'M'],
      ['包成婚禮花束！多少錢我都付！'],
    ]);
    const v = roses.reduce((a, f) => a + flowerValue(run, f.t, f.fresh), 0) * 1.5 + 200;
    S.sell(v, 0); run.roseResult = 'win';
    UI.toast(`王太太用婚禮價買回了自己家的玫瑰（+${money(v)}）`, 3600);
    SFX.play('heart');
  } else {
    yield* S.talk(w, '王太太', [
      ['等一下……這根本就是我家的玫瑰！'],
      ['蛤？！', null, 'M'],
      ['……這盆土我認得。這隻貓，該不會……'],
    ]);
    run.flags.wangSaw = true; run.roseResult = 'fail';
    UI.toast('王太太把玫瑰全抱回家了，一毛都沒賺到。她以後會更提防', 3600);
    SFX.play('fail');
  }
  yield S.walkOut(w);
  S.hideWang = null; S.roseDisplay = null; S.blocked.delete(ROSE_SPOT[0] + ',' + ROSE_SPOT[1]);
  if (wasOn) S.startShop();
}

function* endingScript(S) {
  const run = S.run, due = rentDue(run), ok = run.money >= due;
  yield S.say('今天要繳房租了……我來算算這個月賺了多少。');
  yield S.say('總共是…… ' + money(run.money) + '！');
  if (ok) {
    yield S.say((run.month || 1) <= 1 ? '夠了！房租夠了！花店保住了！' : '房租夠了！這個月也撐過去了！');
    yield S.say('花喵，謝謝你每天晚上都乖乖陪著我。');
    S.cat.pose = 'belly'; S.fx.hearts(S.cat.x, S.cat.y - 10, 8); SFX.play('heart');
    run.money -= due; run.debt = 0; run.rentPaid.push(due);
    UI.toast(`繳了房租 ${money(due)}，剩下 ${money(run.money)}`, 3000);
    yield wait(1.4);
    S.cat.pose = null;
    yield* newMonthScript(S);
    return;
  }
  if (!run.graceUsed) {
    const short = due - run.money;
    yield S.say('還差 ' + money(short) + '……');
    yield S.say('房東說可以寬限一個月，差的錢加到下個月一起繳。花喵，我們要更努力了。');
    run.graceUsed = true; run.debt = short; run.rentPaid.push(run.money); run.money = 0;
    yield* newMonthScript(S);
    return;
  }
  yield S.say('還差 ' + money(due - run.money) + '……');
  yield S.say('房東說不能再等了……花喵，對不起，花店要收起來了。');
  UI.hideDialog();
  yield wait(1.2);
  Flow.ending(false);
}

// 新的一個月：房租漲價、這個月的節慶，接著就是傍晚、出門
function* newMonthScript(S) {
  const run = S.run;
  run.month = (run.month || 1) + 1; run.night = 0;
  run.roseDone = true; run.rosePending = false;
  S.monthStart = true;
  const th = themeOf(run);
  UI.banner(`第${cn(run.month)}個月`);
  yield wait(1.2);
  yield S.say(`這個月的房租是 ${money(rentDue(run))}${run.debt ? '（含上個月欠的）' : ''}……房東又漲價了。`);
  if (th) yield S.say(th.line);
  if (run.month === 2) setTimeout(() => UI.toast('偷熟的人家可以「熟門熟路」一鍵帶回；但偷太兇，鄰居會起疑、上門盤問、裝防貓設施', 5200), 400);
  UI.hideDialog();
  // 今晚（新的一個月第一晚）的訂單
  run.orders[1] = [];
  const o = genOrder(run, 1), cu = S.customer(pick(['cust1', 'cust2', 'shopB', 'shopD']));
  yield S.walkIn(cu, COUNTER_SPOT2);
  yield* S.talk(cu, o.who, [[orderLine(o)]]);
  S.addOrderObj(o, 1);
  yield wait(0.6);
  yield S.walkOut(cu);
  S.tint = 'evening';
  UI.banner('傍晚');
  yield wait(0.8);
  UI.hideDialog();
  yield wait(0.3);
  Flow.dayDone(1);
}
function orderLine(o) { return `我想訂${FLOWERS[o.t].name} ${o.n} 朵，今晚湊得到嗎？${o.mode === 'each' ? '一朵多給' : '湊齊就多給'} ${money(o.reward)}！`; }

// 第二個月起的白天：鄰居盤問、客人訂花、慢慢賣花
function* monthDayScript(S, n) {
  const run = S.run;
  UI.banner(`第${cn(run.month)}個月・第${NUM[n]}天`);
  yield wait(1);
  const nb = run.lastNight || {};
  yield S.say(nb.total > 0 ? pick(['門口又有花了！小精靈今天也來了耶。', '今天的花也好漂亮～花喵，你知道是誰放的嗎？', '花店小精靈又來了！']) : '今天門口沒有花……');
  UI.hideDialog();
  yield* gardenMorningScript(S);
  if (!(yield* gangRescueScript(S)) && !(yield* gangIntroScript(S)) && !(yield* gardenStoryScript(S)) && !(yield* storeStoryScript(S)) && !(yield* nmStoryScript(S)) && !(yield* neighborStoryScript(S))) yield* dayEventScript(S);
  const vo = pickVisit(run);
  if (vo) yield* visitScript(S, vo);
  const k = 1 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < k; i++) {
    const o = genOrder(run, n), cu = S.customer(pick(['cust1', 'cust2', 'shopA', 'shopC', 'shopE', 'shopF']));
    yield S.walkIn(cu, COUNTER_SPOT2);
    yield* S.talk(cu, o.who, [[orderLine(o)]]);
    S.addOrderObj(o);
    yield wait(0.6);
    yield S.walkOut(cu);
  }
  if (n === 4) { const left = Math.max(0, rentDue(run) - run.money); yield S.say(left > 0 ? `這個月還差 ${money(left)}……還有最後一晚。` : '房租夠了！可是多存一點總是好的。'); UI.hideDialog(); }
  if (S.stock.some(f => S.canSell(f)) || S.bouquets.length || storeOf(run).neon) { let w = 0; yield { update: dt => { if (!UI.modalOpen) w += dt; return w > 10 || (!S.stock.length && !S.bouquets.length && !storeOf(run).neon && !S.shoppers.length); } }; }
  yield* S.closeShop();
  S.tint = 'evening';
  UI.banner('傍晚');
  yield wait(0.8);
  const tuition = classIncome(run);
  if (tuition) { run.money += tuition; S.daySales += tuition; UI.toast(`花藝教室的學費 +${money(tuition)}`, 2400); SFX.play('coin'); }
  yield S.say(S.daySales > 0 ? `今天賣了 ${money(S.daySales)}！花喵，賞你罐罐。` : '今天沒什麼生意……花喵，罐罐還是給你。');
  UI.hideDialog();
  yield wait(0.4);
  Flow.dayDone(n);
}
