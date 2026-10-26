// ================= 新區域：下水道、公園、隔壁巷、清晨市場 =================
// 巷子裡的人孔蓋（老貓攤學「下水道探險」）可以鑽進下水道。下水道是連到新區域的樞紐：
//   ・從另一個人孔爬出來＝巷子裡的捷徑
//   ・撿失物（白天還給失主換交情，或賣給回收阿伯）、幽靈蘭、罐罐、零錢
//   ・生鏽的鑰匙打開往公園的鐵柵；老鼠王收下亮晶晶的東西，就幫你打通往隔壁巷的洞
//   ・找到市場的排水溝之後，每天天亮前可以順路去清晨市場
// 公園：管理員拿手電筒巡邏、夜跑大叔、長椅上的情侶、會飛起來的鴨子、定時噴水的灑水器、荷花池（要跳高高踩荷葉）、撈錦鯉
// 隔壁巷：感應燈、熬夜的大學生、花藝老師的山茶花、會叫的柴犬（餵魚就變朋友）、一隻神秘的黑貓
// 清晨市場：一分鐘，撿花販不要的花、偷魚攤的魚（魚可以拿去收買柴犬、老鼠王），掃地阿伯會把你趕走
// 新區域都畫在 2D 疊加層上（俯視、帶一點立體），不另外蓋 3D 場景。

Object.assign(PEOPLE, {
  ranger: { skin: '#e8b892', hair: '#2a2230', hairStyle: 'cap', cap: '#4a6a3a', shirt: '#5a7a4a', clothes: 'vest', extra: '#f2d23c', pants: '#3a4a3a', shoes: '#2a2a2a', flashlight: true },
  jogger: { skin: '#e2ad86', hair: '#2a2230', hairStyle: 'short', shirt: '#ff7a4a', clothes: 'tank', pants: '#2a2f45', shoes: '#f4f4f0' },
  coupleA: { skin: '#f6d2b4', hair: '#3a2420', hairStyle: 'pony', shirt: '#f4a8c4', clothes: 'blouse', pants: '#4a4a6a', shoes: '#f4f4f0', blush: true },
  coupleB: { skin: '#eec39e', hair: '#1f1d29', hairStyle: 'short', shirt: '#6a8ad0', clothes: 'plain', pants: '#3a3a4a', shoes: '#2a2a36' },
  student: { skin: '#f3cdb0', hair: '#2a2230', hairStyle: 'short', shirt: '#9a9aa8', clothes: 'plain', pants: '#3a3a4a', shoes: '#2a2a36', glasses: true },
  teacher: { skin: '#f4cba8', hair: '#3a2a3a', hairStyle: 'perm', shirt: '#7a5aa8', clothes: 'blouse', pants: '#3a3550', shoes: '#4a2a3a', pearls: true },
  fishlady: { skin: '#eab995', hair: '#2a2230', hairStyle: 'perm', shirt: '#f2f2f2', clothes: 'apron', extra: '#3a7ac8', pants: '#3a3a4a', shoes: '#ffd23a' },
  sweeper: { skin: '#e2ad86', hair: '#d9d9e0', hairStyle: 'cap', cap: '#e86a2a', shirt: '#e86a2a', clothes: 'vest', extra: '#f2f2f2', pants: '#3a3a4a', shoes: '#2a2a2a' },
  aunt: { skin: '#f4cfae', hair: '#5a3a2a', hairStyle: 'pony', shirt: '#ffd27a', clothes: 'apron', extra: '#e8394d', pants: '#5a4a6a', shoes: '#c9405a', blush: true },
});

// ---------- 格子 ----------
// solid：擋路；opaque：擋視線；hide：躲得進去
const ZT = {
  '#': { solid: 1, opaque: 1, wall: 0.55 }, H: { solid: 1, opaque: 1, wall: 1.0, house: 1 }, w: { solid: 1, opaque: 1, wall: 1.0, house: 1, win: 1 },
  T: { solid: 1, opaque: 1, tree: 1 }, '~': { solid: 1, water: 1 }, P: { solid: 1, water: 2 }, o: { lily: 1 },
  '=': { plank: 1 }, '.': {}, g: { grass: 1 }, ',': { soil: 1 }, b: { hide: 1, bush: 1 }, f: { solid: 1, fence: 1 },
  B: { solid: 1, bench: 1 }, L: { solid: 1, lamp: 1 }, S: { solid: 1, stall: 1 }, l: { laundry: 1, hide: 1 }, c: { crate: 1, solid: 1 },
};

// ---------- 失物（下水道撿到；白天還給失主或賣掉） ----------
const LOST_ITEMS = {
  ring: { name: '婚戒', owner: 'wang', who: '王太太', desc: '內圈刻著兩個人的名字和一個日期。', sell: 2400, back: '這是我先生送我的……我找了好久！花喵，謝謝你。' },
  tag: { name: '小柴的名牌', owner: 'lin', who: '林先生', desc: '骨頭形狀的名牌，背面寫著電話。', sell: 300, back: '小柴的名牌！散步的時候弄丟的……這隻貓真的是……謝謝啦。' },
  watch: { name: '老懷錶', owner: 'bo', who: '阿伯', desc: '錶蓋裡有一張泛黃的照片，是一隻虎斑貓。', sell: 1800, back: '……阿虎的照片。我以為再也看不到了。' },
  card: { name: '學生證', owner: 'public', who: '社區的國中生', desc: '照片上的男生笑得有點傻。', sell: 0, back: '我的學生證！明天要段考，沒有它進不了學校……謝謝貓貓！' },
  coin: { name: '古錢幣', owner: null, desc: '看起來很老的銅錢，回收阿伯說他收。', sell: 1500 },
  doll: { name: '舊布偶', owner: 'public', who: '社區的小妹妹', desc: '一隻缺了一顆眼睛的兔子布偶。', sell: 50, back: '小兔子！（小妹妹抱著布偶，在花喵頭上親了一下）' },
};
function zonesOf(run) { return run.zones || (run.zones = { visits: {}, lostSeen: {}, lost: [], fish: 0, heat: {} }); }
function sewerOpen(run) { return !!(run.upg && run.upg.sewer); }
// 新區域的花：去得到那個地方才會有人來訂
function zoneFlowerOk(run, t) {
  const Z = run.zones || {};
  if (t === 'plumeria') return !!Z.parkKey;
  if (t === 'lotus') return !!Z.parkKey && !!run.upg.jump;
  if (t === 'camellia') return !!Z.kingFriend;
  if (t === 'ghostorchid') return !!(run.upg && run.upg.sewer);
  return true;
}
function marketOpen(run) { return !!zonesOf(run).market; }

// ---------- 地圖 ----------
const ZONES = {
  sewer: {
    name: '下水道', owner: 'sewer', dark: 0.84, theme: 'sewer',
    rows: [
      '#############',
      '##A###~###.##',
      '#...#.~.#...#',
      '#.#.#.~.#.#.#',
      '#.#...=...#.#',
      '#.###.~.###.#',
      '#.....~.....N',
      '###.#.~.#.###',
      '#...#.~.#...#',
      '#.###.=.###.#',
      '#.#...~...#.#',
      '#.#.#.~.#.#.#',
      'B...#.~.#...#',
      '###.#.=.#.###',
      '#...#.~.#...#',
      '#.#.#.~.#.#.#',
      '#.#...~...#.#',
      'K.###.=.###.#',
      '#...#.~.#...#',
      '#.#.#.~.#.#.#',
      '#.#.#.~.#...#',
      '#...#.=.#.#.#',
      '###.#.~.#.#.C',
      '#...#.~.#...#',
      '#.#...~...#.#',
      '#.#########M#',
    ],
    exits: [
      { id: 'A', x: 2, y: 1, stand: [2, 2], to: 'alley', i: 0, label: '爬上去', name: '往花店那頭的人孔' },
      { id: 'B', x: 0, y: 12, stand: [1, 12], to: 'alley', i: 1, label: '爬上去', name: '往空屋前的人孔' },
      { id: 'C', x: 12, y: 22, stand: [11, 22], to: 'alley', i: 2, label: '爬上去', name: '往巷底的人孔' },
      { id: 'K', x: 0, y: 17, stand: [1, 17], to: 'park', gate: 'park', label: '往公園', name: '往公園的鐵柵' },
      { id: 'N', x: 12, y: 6, stand: [11, 6], to: 'nb', gate: 'nb', label: '往隔壁巷', name: '往隔壁巷的破洞' },
      { id: 'M', x: 11, y: 25, stand: [11, 24], to: 'marketPeek', label: '看看', name: '市場的排水溝' },
    ],
    lights: [[2, 2.2, 1.6, [0.55, 0.65, 0.9]], [1.2, 12, 1.4, [0.55, 0.65, 0.9]], [11.8, 22, 1.4, [0.55, 0.65, 0.9]], [11, 24.6, 1.5, [1, 0.8, 0.5]]],
    loot: [[10, 1], [1, 3], [11, 3], [3, 8], [9, 10], [1, 14], [11, 14], [3, 20], [9, 20], [11, 23], [3, 23], [9, 2]],
  },
  park: {
    name: '公園', owner: 'park', dark: 0.62, theme: 'park',
    rows: [
      '#############',
      '#TT.......TT#',
      '#T..PPPPP..T#',
      '#b..PoPoP..b#',
      '#...PPoPP...#',
      '#.L.PPPPP.L.#',
      '#...........#',
      '#.fff...fff.#',
      '#.f,,...,,f.#',
      '#.f,,.B.,,f.#',
      '#.f,,...,,f.#',
      '#b....L....b#',
      '#..T.....T..#',
      '#...........#',
      '#.,,,.T.,,,.#',
      '#.,,,...,,,.#',
      '#...b...b...#',
      '#L....B....L#',
      '#..T.....T..#',
      '#...........#',
      '#.gg.....gg.#',
      '#.gg.b.b.gg.#',
      '#.T.......T.#',
      '#...........#',
      '#b....,....b#',
      '#############',
    ],
    exits: [{ id: 'S', x: 6, y: 24, stand: [6, 24], floor: true, to: 'sewer', back: 'K', label: '鑽回下水道', name: '公園的人孔' }],
    lights: [[2, 5.2, 2.6, [1.2, 0.95, 0.6]], [10, 5.2, 2.6, [1.2, 0.95, 0.6]], [6, 11.2, 2.8, [1.2, 0.95, 0.6]], [1, 17.2, 2.6, [1.2, 0.95, 0.6]], [11, 17.2, 2.6, [1.2, 0.95, 0.6]]],
  },
  nb: {
    name: '隔壁巷', owner: 'nb', dark: 0.7, theme: 'nb',
    rows: [
      '#############',
      '#HHHHH.HHHHH#',
      '#HHwHH.HHwHH#',
      '#,,,,f.f,,,,#',
      '#,,,,f.f,,,,#',
      '#,,,,..f,,,,#',
      '#fffff.ffff.#',
      '#b..........#',
      '#...........#',
      '#HHHH...llll#',
      '#HwHH...l..l#',
      '#,,,f...l..l#',
      '#,,,f.......#',
      '#,,,,...l..l#',
      '#ffff...llll#',
      '#...........#',
      '#b.........b#',
      '#ccc....HHHH#',
      '#.......HwHH#',
      '#.......f,,,#',
      '#b......,,,,#',
      '#.......f,,,#',
      '#.......ffff#',
      '#...........#',
      '#b....,....c#',
      '#############',
    ],
    exits: [{ id: 'S', x: 6, y: 24, stand: [6, 24], floor: true, to: 'sewer', back: 'N', label: '鑽回下水道', name: '隔壁巷的人孔' }],
    lights: [[6, 8, 2.4, [1.2, 0.95, 0.6]], [6, 16, 2.4, [1.2, 0.95, 0.6]]],
  },
  market: {
    name: '清晨市場', owner: 'market', dark: 0, theme: 'market', timer: 60,
    rows: [
      '#############',
      '#SSS.SSS.SSS#',
      '#...........#',
      '#...........#',
      '#SS.......SS#',
      '#SS.......SS#',
      '#...........#',
      '#.SSS...SSS.#',
      '#...........#',
      '#...........#',
      '#SS.......SS#',
      '#SS...c...SS#',
      '#...........#',
      '#...........#',
      '#.....,.....#',
      '#############',
    ],
    exits: [{ id: 'S', x: 6, y: 14, stand: [6, 14], floor: true, to: 'home', label: '回家', name: '排水溝' }],
    lights: [],
  },
};

// ---------- 區域本體 ----------
class Zone {
  constructor(sc, id) {
    this.sc = sc; this.run = sc.run; this.id = id; this.def = ZONES[id];
    this.rows = this.def.rows.slice(); this.w = this.rows[0].length; this.h = this.rows.length;
    this.t = 0; this.pots = []; this.items = []; this.npcs = []; this.pops = []; this.birds = []; this.sprinklers = []; this.motion = []; this.wins = [];
    this.cx = 6.5; this.cy = 6.5; this.noiseT = 0; this.wet = 0; this.alarmT = 0; this.mini = null; this.msgT = 0;
    this.Z = zonesOf(this.run);
    this.heat = this.Z.heat[id] || 0;
    ZONE_INIT[id](this);
  }
  // ---- 格子 ----
  ch(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return '#'; return this.rows[y][x]; }
  info(x, y) {
    const c = this.ch(x, y);
    if (c === 'o') return this.run.upg.jump ? { lily: 1 } : { solid: 1, water: 2, lily: 1 };
    if ('ABCKNM'.includes(c)) return { solid: 1, opaque: 1, wall: 0.55, exit: c };
    return ZT[c] || ZT['#'];
  }
  solidAt(x, y) { return !!this.info(Math.floor(x), Math.floor(y)).solid; }
  opaqueAt(x, y) { return !!this.info(Math.floor(x), Math.floor(y)).opaque; }
  npcBlocked(x, y) { const i = this.info(x, y); return !!(i.solid || i.lily); }
  catSolid(x, y) {
    const r = 0.26;
    return this.solidAt(x - r, y - r) || this.solidAt(x + r, y - r) || this.solidAt(x - r, y + r) || this.solidAt(x + r, y + r);
  }
  los(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 4);
    for (let i = 1; i < n; i++) { const k = i / n; if (this.opaqueAt(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k)) return false; }
    return true;
  }
  // 格子尋路（npc 用）
  path(x0, y0, x1, y1) {
    const sx = Math.floor(x0), sy = Math.floor(y0), tx = Math.floor(x1), ty = Math.floor(y1);
    if (sx === tx && sy === ty) return [[x1, y1]];
    const W = this.w, prev = new Int32Array(W * this.h).fill(-1), q = [sy * W + sx]; prev[q[0]] = q[0];
    let found = false;
    for (let qi = 0; qi < q.length && !found; qi++) {
      const cur = q[qi], cx = cur % W, cy = (cur - cx) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= this.h) continue;
        const ni = ny * W + nx; if (prev[ni] >= 0) continue;
        if (this.npcBlocked(nx, ny) && !(nx === tx && ny === ty)) continue;
        prev[ni] = cur; q.push(ni); if (nx === tx && ny === ty) { found = true; break; }
      }
    }
    if (!found) return null;
    const out = []; let cur = ty * W + tx;
    while (cur !== sy * W + sx) { const cx = cur % W, cy = (cur - cx) / W; out.unshift([cx + 0.5, cy + 0.5]); cur = prev[cur]; }
    return out;
  }
  catCell() { return this.ch(Math.floor(this.cx), Math.floor(this.cy)); }
  catHidden() { const i = this.info(Math.floor(this.cx), Math.floor(this.cy)); return !!i.hide && !this.sc.cat.running; }
  lightsNow() {
    const L = [];
    for (const l of this.def.lights) L.push({ x: l[0], y: l[1], r: l[2], c: l[3] });
    for (const m of this.motion) if (m.on > 0) L.push({ x: m.x, y: m.y, r: 3.2, c: [1.3, 1.25, 1.0] });
    for (const w of this.wins) if (w.lit) L.push({ x: w.x + 0.5, y: w.y + 1.4, r: w.state === 'look' ? 2.6 : 1.8, c: [1.2, 0.95, 0.6] });
    if (this.id === 'sewer' && this.pots.some(p => p.t === 'ghostorchid' && p.avail)) { const p = this.pots.find(p => p.t === 'ghostorchid' && p.avail); L.push({ x: p.x, y: p.y, r: 1.4, c: [0.6, 1.1, 1.3] }); }
    return L;
  }
  litAt(x, y) { for (const l of this.lightsNow()) if (Math.hypot(l.x - x, l.y - y) < l.r * 0.75) return true; return false; }
  pop(x, y, txt, col = '#fff') { this.pops.push({ x, y, txt, col, t: 0 }); }
  noise(x, y, r) {
    for (const n of this.npcs) if (n.hear && Math.hypot(n.x - x, n.y - y) < r) this.investigate(n, x, y);
    this.rings = this.rings || []; this.rings.push({ x, y, r, t: 0 });
  }
  investigate(n, x, y) {
    if (n.state === 'chase' || n.kind !== 'guard') { if (n.kind === 'static' || n.kind === 'win') { n.s = Math.max(n.s, 0.35); n.lookAt = Math.atan2(y - n.y, x - n.x); } return; }
    n.state = 'inv'; n.tgt = [x, y]; n.path = this.path(n.x, n.y, x, y); n.invT = 0; n.emote = 'q'; n.emoteT = 1.2;
  }
  // ---- 進出 ----
  place(x, y) { this.cx = x; this.cy = y; }
  // ---- 每一格更新 ----
  update(dt) {
    const sc = this.sc, c = sc.cat, run = this.run;
    this.t += dt; c.t += dt;
    if (this.def.timer) { this.left = (this.left === undefined ? this.def.timer : this.left) - dt; if (this.left <= 0) { this.left = 0; ZONE_END[this.id] && ZONE_END[this.id](this, 'time'); return; } }
    if (this.mini) { this.updateMini(dt); }
    // 移動
    const v = this.mini || this.frozen > 0 ? { x: 0, y: 0, mag: 0 } : Input.vector();
    if (this.frozen > 0) this.frozen -= dt;
    const running = v.mag > 0.72;
    let sp = (running ? 4.3 : 2.5) * (this.wet > 0 ? 0.6 : 1) * (run.upg.catwalk ? 1.06 : 1);
    c.moving = v.mag > 0.05; c.running = running && c.moving;
    if (c.moving) {
      if (Math.abs(v.x) > Math.abs(v.y) * 0.9) c.dir = v.x > 0 ? 'right' : 'left'; else c.dir = v.y > 0 ? 'down' : 'up';
      const nx = this.cx + v.x * sp * dt, ny = this.cy + v.y * sp * dt;
      if (!this.catSolid(nx, this.cy)) this.cx = nx;
      if (!this.catSolid(this.cx, ny)) this.cy = ny;
      c.idleT = 0;
    } else c.idleT = (c.idleT || 0) + dt;
    // 奔跑的腳步聲
    if (c.running) {
      this.noiseT -= dt;
      if (this.noiseT <= 0) { this.noiseT = 0.32; const r = 2.6 * sc.pawsMult() * (this.def.theme === 'sewer' ? 1.3 : 1); if (r > 0.4) this.noise(this.cx, this.cy, r); }
    }
    if (this.wet > 0) this.wet -= dt;
    // 撿東西（碰到就拿）
    for (const it of this.items) {
      if (it.got || Math.hypot(it.x - this.cx, it.y - this.cy) > 0.6) continue;
      it.got = true; this.takeItem(it);
    }
    ZONE_UPD[this.id] && ZONE_UPD[this.id](this, dt);
    for (const n of this.npcs) this.updateNpc(n, dt);
    this.detect(dt);
    for (const p of this.pops) p.t += dt; this.pops = this.pops.filter(p => p.t < 1.4);
    if (this.rings) { for (const r of this.rings) r.t += dt; this.rings = this.rings.filter(r => r.t < 0.7); }
    this.findTarget();
  }
  takeItem(it) {
    const run = this.run, Z = this.Z;
    SFX.play('pick');
    if (it.kind === 'cans') { run.cans += it.n; this.pop(it.x, it.y - 0.6, `罐罐 +${it.n}`, '#ffd25a'); }
    else if (it.kind === 'coins') { run.money += it.n; this.pop(it.x, it.y - 0.6, `零錢 ${money(it.n)}`, '#ffd25a'); }
    else if (it.kind === 'lost') {
      Z.lost.push(it.id); Z.lostSeen[it.id] = 1;
      const L = LOST_ITEMS[it.id];
      this.pop(it.x, it.y - 0.6, L.name, '#aef0ff'); SFX.play('chime');
      UI.toast(`撿到「${L.name}」：${L.desc}${L.owner ? '（白天可以還給' + L.who + '）' : '（白天可以賣給回收阿伯）'}`, 4200);
    } else if (it.kind === 'key') {
      Z.parkKey = 1; SFX.play('chime');
      this.pop(it.x, it.y - 0.6, '生鏽的鑰匙', '#ffe27a');
      UI.toast('撿到一把生鏽的鑰匙……上面掛著「公園管理處」的牌子。下水道左邊好像有一道鐵柵？', 4600);
    } else if (it.kind === 'fish') {
      Z.fish = (Z.fish || 0) + 1; this.pop(it.x, it.y - 0.6, '小魚 +1', '#9ad8ff'); SFX.play('chime');
    }
  }
  // ---- npc ----
  updateNpc(n, dt) {
    n.t += dt; if (n.emoteT > 0) n.emoteT -= dt;
    if (n.kind === 'static') {
      // 坐著，偶爾轉頭看看四周
      n.lookT -= dt;
      if (n.lookT <= 0) { n.lookT = rnd(2.2, 4); n.ang = pick(n.looks); }
      if (n.lookAt !== undefined) { n.ang = n.lookAt; n.lookAt = undefined; n.lookT = 2.5; }
      n.moving = false; n.dir = angDir(n.ang); return;
    }
    if (n.kind === 'win') {
      n.ct -= dt;
      if (n.state === 'off' && n.ct <= 0) { n.state = 'pre'; n.ct = 0.9; }
      else if (n.state === 'pre' && n.ct <= 0) { n.state = 'look'; n.ct = rnd(2.4, 3.4); }
      else if (n.state === 'look' && n.ct <= 0) { n.state = 'off'; n.ct = rnd(n.gap[0], n.gap[1]); n.s = Math.max(0, n.s - 0.3); }
      if (n.wake) { n.wake = false; if (n.state === 'off') { n.state = 'pre'; n.ct = 0.6; } }
      return;
    }
    if (n.kind !== 'guard') return;
    let sp = n.speed * (1 + this.heat * 0.07);
    if (n.state === 'route') {
      if (!n.path || !n.path.length) { const wp = n.route[n.wi]; n.wi = (n.wi + 1) % n.route.length; n.path = this.path(n.x, n.y, wp[0], wp[1]) || []; if (n.pause) n.wait = n.pause; }
    } else if (n.state === 'inv') {
      if (!n.path || !n.path.length) { n.invT += dt; n.ang += dt * 2.2 * Math.sin(n.invT * 2); if (n.invT > 2.6) { n.state = 'route'; n.path = null; } }
      sp *= 1.1;
    } else if (n.state === 'chase') {
      n.repath -= dt;
      if (n.repath <= 0) { n.repath = 0.35; n.path = this.path(n.x, n.y, this.cx, this.cy) || []; }
      sp *= n.chaseMul || 1.35;
      n.lost = this.canSee(n) ? 0 : n.lost + dt;
      if (n.lost > 2.4) { n.state = 'inv'; n.path = this.path(n.x, n.y, this.cx, this.cy); n.invT = 0; n.emote = 'q'; n.emoteT = 1; n.s = 0.4; }
      if (Math.hypot(n.x - this.cx, n.y - this.cy) < 0.55 && !this.leaving) { this.caught(n); return; }
    }
    if (n.wait > 0) { n.wait -= dt; n.moving = false; return; }
    if (n.path && n.path.length) {
      const [tx, ty] = n.path[0], dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
      if (d < 0.08) { n.path.shift(); }
      else { const k = Math.min(1, sp * dt / d); n.x += dx * k; n.y += dy * k; const a = Math.atan2(dy, dx); n.ang = lerpAng(n.ang, a, Math.min(1, dt * 8)); n.moving = true; n.dir = angDir(n.ang); }
    } else n.moving = false;
  }
  canSee(n) {
    if (n.kind === 'win' && n.state !== 'look') return 0;
    if (this.catHidden()) return 0;
    const ex = n.kind === 'win' ? n.x + 0.5 : n.x, ey = n.kind === 'win' ? n.y + 1.3 : n.y;
    const dx = this.cx - ex, dy = this.cy - ey, d = Math.hypot(dx, dy);
    const lit = this.litAt(this.cx, this.cy);
    let R = n.range * (lit ? 1.3 : this.def.dark && !n.torch ? 0.62 : 1) * (1 + this.heat * 0.06);
    if (this.sc.cat.running) R *= 1.15;
    if (d > R) return 0;
    let da = Math.abs(normAng(Math.atan2(dy, dx) - n.ang));
    if (da > n.half && d > 0.9) return 0;
    if (!this.los(ex, ey, this.cx, this.cy)) return 0;
    return 1 - (d / R) * 0.55;
  }
  detect(dt) {
    if (this.leaving) return;
    const thief = hasSet(this.run, 'thief') ? 0.88 : 1;
    for (const n of this.npcs) {
      if (!n.range) continue;
      const v = this.canSee(n);
      if (v > 0) n.s = Math.min(1, n.s + dt * v * (n.rate || 1.25) * thief * (this.sc.cat.running ? 1.4 : 1));
      else if (n.state !== 'chase') n.s = Math.max(0, n.s - dt * 0.35);
      if (n.s >= 1 && !n.alarmed) this.alarm(n);
      if (n.s < 0.5) n.alarmed = false;
    }
  }
  alarm(n) {
    n.alarmed = true; n.emote = 'ex'; n.emoteT = 1.6;
    this.sc.stats.spotted = (this.sc.stats.spotted || 0) + 1;
    SFX.play('ex'); vibrate(40);
    if (n.kind === 'guard') { n.state = 'chase'; n.repath = 0; n.lost = 0; if (n.shout) this.say(n, pick(n.shout)); }
    else {
      // 坐著／窗邊的人：大叫，叫管理員過來
      if (n.shout) this.say(n, pick(n.shout));
      for (const g of this.npcs) if (g.kind === 'guard') this.investigate(g, this.cx, this.cy);
      n.s = 0.45;
    }
  }
  say(n, txt) { this.pop(n.x + (n.kind === 'win' ? 0.5 : 0), n.y - (n.kind === 'win' ? 0 : 1.6), txt, '#fff3c8'); }
  caught(n) {
    const sc = this.sc, c = sc.cat;
    sc.stats.caught = (sc.stats.caught || 0) + 1;
    (ZONE_CAUGHT[this.id] || zoneCaughtDefault)(this, n);
  }
  // ---- 目標 ----
  findTarget() {
    const sc = this.sc, c = sc.cat;
    let best = null, bd = 0.95;
    for (const p of this.pots) {
      if (!p.avail) continue;
      const d = Math.hypot(p.x - this.cx, p.y - 0.15 - this.cy);
      if (d < bd) { bd = d; best = { kind: 'pot', ref: p, x: p.x, y: p.y }; }
    }
    if (!best) for (const e of this.def.exits) {
      const sx = e.stand[0] + 0.5, sy = e.stand[1] + 0.5;
      if (Math.hypot(sx - this.cx, sy - this.cy) < 0.9) { best = { kind: 'exit', ref: e, x: e.x + 0.5, y: e.y + (e.floor ? 0.5 : 0.8) }; break; }
    }
    if (!best && ZONE_TGT[this.id]) best = ZONE_TGT[this.id](this);
    this.target = best;
    let label = null;
    if (best) {
      if (best.kind === 'pot') label = c.carry.length >= sc.capacity() ? '嘴巴滿了' : '叼';
      else if (best.kind === 'exit') label = (best.ref.gate && !zoneGateOpen(this.run, best.ref.gate)) ? '打不開' : best.ref.label;
      else label = best.label;
    }
    UI.setAction(this.mini ? (this.mini.label || '！') : label);
    UI.setWait(false, false); UI.setSkills([]);
  }
  action() {
    if (this.leaving) return;
    if (this.mini) { this.miniPress(); return; }
    const tg = this.target; if (!tg) return;
    const sc = this.sc, c = sc.cat, run = this.run;
    if (tg.kind === 'pot') {
      const p = tg.ref;
      if (p.gate && !p.gate(this)) return;
      if (c.carry.length >= sc.capacity()) { SFX.play('nope'); UI.toast('嘴巴滿了，先帶回花店'); return; }
      p.avail = false;
      c.carry.push({ t: p.t, fresh: 1, pot: { owner: this.def.owner, zone: this.id } });
      SFX.play('pick'); this.pop(p.x, p.y - 1.2, FLOWERS[p.t].name, '#ffe2ea');
      this.Z.heat[this.id] = Math.min(6, (this.Z.heat[this.id] || 0) + 0.25);
      this.noise(p.x, p.y, 1.4);
      if (!sc.tips.zcarry) { sc.tips.zcarry = 1; UI.toast('新區域的花一樣要帶回花店貓門才算數：從下水道爬回巷子，再走回家', 3800); }
    } else if (tg.kind === 'exit') {
      const e = tg.ref;
      if (e.gate && !zoneGateOpen(run, e.gate)) { SFX.play('nope'); UI.toast(zoneGateHint(run, e.gate), 3600); return; }
      zoneExit(sc, this, e);
    } else if (tg.act) tg.act(this);
  }
  // ---- 小遊戲（撈魚）：指針來回跑，停在綠色區按 ----
  startMini(o) { this.mini = Object.assign({ t: 0, pos: 0, dir: 1, speed: 1.6, zone: [0.38, 0.62], label: '撈！' }, o); this.sc.cat.moving = false; }
  updateMini(dt) {
    const m = this.mini; m.t += dt;
    m.pos += m.dir * m.speed * dt; if (m.pos > 1) { m.pos = 1; m.dir = -1; } if (m.pos < 0) { m.pos = 0; m.dir = 1; }
    if (m.t > (m.limit || 4.5)) { const f = m.done; this.mini = null; f && f(false, true); }
  }
  miniPress() { const m = this.mini, ok = m.pos >= m.zone[0] && m.pos <= m.zone[1]; this.mini = null; m.done && m.done(ok); }

  // ================= 畫 =================
  render(g, W, H) {
    const cs = this.cs = Math.max(24, Math.min(W / 10.4, H / 15.5));
    const sc = this.sc, c = sc.cat, vt = this.t, TH = ZONE_THEME[this.def.theme];
    // 相機
    const vw = W / cs, vh = H / cs;
    const tx = clamp(this.cx - vw / 2, -0.6, Math.max(-0.6, this.w - vw + 0.6)), ty = clamp(this.cy - vh * 0.52, -1.6, Math.max(-1.6, this.h - vh + 1.2));
    if (this.camX === undefined || this.snap) { this.camX = tx; this.camY = ty; this.snap = false; }
    this.camX += (tx - this.camX) * Math.min(1, R3.dt * 6); this.camY += (ty - this.camY) * Math.min(1, R3.dt * 6);
    const ox = -this.camX * cs, oy = -this.camY * cs;
    const S = (x, y) => [ox + x * cs, oy + y * cs];
    g.fillStyle = TH.bg; g.fillRect(0, 0, W, H);
    // 地板
    const y0 = Math.max(0, Math.floor(this.camY) - 1), y1 = Math.min(this.h - 1, Math.ceil(this.camY + vh) + 1);
    for (let y = y0; y <= y1; y++) for (let x = 0; x < this.w; x++) {
      const ch = this.ch(x, y), [sx, sy] = S(x, y);
      zoneFloor(g, this, ch, x, y, sx, sy, cs, TH, vt);
    }
    // 噴水的範圍、聲音
    for (const s of this.sprinklers) if (s.on) {
      const [sx, sy] = S(s.x, s.y);
      g.fillStyle = 'rgba(150,200,255,0.18)'; g.beginPath(); g.ellipse(sx, sy, s.r * cs, s.r * cs * 0.8, 0, 0, TAU); g.fill();
    }
    // 視線光錐（在牆和人物下面）
    for (const n of this.npcs) zoneCone(g, this, n, S, cs);
    // 牆與人物：一列一列畫
    const spr = [];
    const push = (y, f) => spr.push({ y, f });
    for (const p of this.pots) push(p.y, () => zoneDrawArt(g, ART.pot({ t: p.t, avail: p.avail }, { tanhuaState: () => 'tanhua' }), ...S(p.x, p.y), cs * (p.s || 0.95), p.glow && p.avail ? 0 : null));
    for (const it of this.items) if (!it.got) push(it.y, () => zoneItem(g, it, ...S(it.x, it.y), cs, vt));
    for (const n of this.npcs) if (n.art !== false) push(n.kind === 'win' ? -99 : n.y, () => zoneNpcDraw(g, this, n, S, cs, vt));
    for (const b of this.birds) push(b.y, () => zoneBird(g, b, ...S(b.x, b.y), cs, vt));
    ZONE_SPR[this.id] && ZONE_SPR[this.id](this, push, S, cs, g, vt);
    // 貓
    push(this.cy, () => {
      const [sx, sy] = S(this.cx, this.cy);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(sx, sy, cs * 0.34, cs * 0.12, 0, 0, TAU); g.fill();
      zoneDrawArt(g, ART.cat(c), sx, sy, cs, null, this.wet > 0 ? 0.9 : 1);
      if (c.carry.length) c.carry.forEach((f, i) => zoneDrawArt(g, ART.icon(f.t), sx + (c.dir === 'left' ? -0.32 : c.dir === 'right' ? 0.32 : (i - (c.carry.length - 1) / 2) * 0.22) * cs, sy - cs * 0.42 + i * 2, cs * 0.9));
      if (this.wet > 0) for (let i = 0; i < 3; i++) { g.fillStyle = '#9ad0ff'; g.beginPath(); g.arc(sx + Math.sin(vt * 9 + i * 2) * cs * 0.3, sy - cs * 0.7 + ((vt * 2 + i / 3) % 1) * cs * 0.5, 2, 0, TAU); g.fill(); }
    });
    // 牆（每一列）
    for (let y = y0; y <= y1; y++) push(y + 1.001, () => { for (let x = 0; x < this.w; x++) zoneWall(g, this, this.ch(x, y), x, y, ...S(x, y), cs, TH, vt); });
    spr.sort((a, b) => a.y - b.y);
    for (const s of spr) s.f();
    // 灑水器的水花
    for (const s of this.sprinklers) if (s.on) {
      const [sx, sy] = S(s.x, s.y);
      g.strokeStyle = 'rgba(200,230,255,0.8)'; g.lineWidth = 1.6;
      for (let i = 0; i < 10; i++) { const a = vt * 3 + i * 0.63, r = ((vt * 1.8 + i * 0.37) % 1) * s.r * cs; g.beginPath(); g.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r * 0.8 - Math.sin((r / (s.r * cs)) * Math.PI) * cs * 0.6, 1.6, 0, TAU); g.stroke(); }
    }
    // 黑暗
    if (this.def.dark) zoneDark(g, this, S, cs, W, H);
    // 聲音的圈圈
    if (this.rings) for (const r of this.rings) { const [sx, sy] = S(r.x, r.y), k = r.t / 0.7; g.strokeStyle = `rgba(255,220,120,${0.6 * (1 - k)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(sx, sy, r.r * cs * k, r.r * cs * k * 0.8, 0, 0, TAU); g.stroke(); }
    // 頭上的懷疑條、表情
    for (const n of this.npcs) {
      const hx = n.x + (n.kind === 'win' ? 0.5 : 0), hy = n.kind === 'win' ? n.y + 0.1 : n.y - 1.55;
      const [sx, sy] = S(hx, hy);
      if (n.s > 0.05 && n.range) CM.bar(g, sx, sy - 6, n.s, n.s >= 1 || n.state === 'chase');
      if (n.emoteT > 0) CM.emote(g, sx, sy - 10, n.emote, 1, Math.min(1, n.emoteT * 3));
    }
    // 目標標記
    if (this.target && !this.mini) { const [sx, sy] = S(this.target.x, this.target.y - 1.05); CM.marker(g, sx, sy, vt); }
    for (const p of this.pops) { const [sx, sy] = S(p.x, p.y); CM.text(g, sx, sy - p.t * 26, p.txt, p.col, 14, Math.min(1, (1.4 - p.t) * 2.5)); }
    // 上方的區域名稱、計時
    const top = 92;
    g.fillStyle = 'rgba(16,14,32,0.72)'; CM.rr(g, 10, top, 132, 26, 13); g.fill();
    CM.text(g, 76, top + 13.5, this.def.name + (this.heat >= 2 && this.id !== 'market' ? ' ・加強巡邏' : ''), this.heat >= 2 ? '#ffb48a' : '#e8e2ff', 13, 1, { weight: 800 });
    if (this.def.timer) {
      const k = this.left / this.def.timer;
      g.fillStyle = 'rgba(16,14,32,0.72)'; CM.rr(g, W - 150, top, 140, 26, 13); g.fill();
      g.fillStyle = k > 0.25 ? '#ffd25a' : '#ff7a5a'; CM.rr(g, W - 144, top + 7, 128 * k, 12, 6); g.fill();
      CM.text(g, W - 80, top + 13.5, `${Math.ceil(this.left)} 秒`, '#fff', 12, 1, { weight: 800 });
    }
    ZONE_HUD[this.id] && ZONE_HUD[this.id](this, g, W, H, top);
    if (this.mini) zoneMiniDraw(g, this.mini, W, H);
  }
}
function angDir(a) { const c = Math.cos(a), s = Math.sin(a); return Math.abs(c) > Math.abs(s) * 0.9 ? (c > 0 ? 'right' : 'left') : (s > 0 ? 'down' : 'up'); }
function normAng(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }
function lerpAng(a, b, k) { return a + normAng(b - a) * k; }

// ---------- 畫圖的小工具 ----------
const ZONE_THEME = {
  sewer: { bg: '#0b0c14', floor: '#5a5e6e', floor2: '#53576a', line: '#454858', wallT: '#7a7488', wallF: '#2a2a38', water: '#1f4a5a', water2: '#4a8a9a' },
  park: { bg: '#10150f', floor: '#9a9484', floor2: '#8e887a', line: '#7a7468', grass: '#3f6a3a', grass2: '#467540', soil: '#6a4a32', wallT: '#5a5a62', wallF: '#3a3a44', water: '#24486a', water2: '#3a6a8a' },
  nb: { bg: '#0e0f18', floor: '#4a4e62', floor2: '#474b5f', line: '#3c4054', yard: '#a8a4b0', yard2: '#a19dab', wallT: '#6a6a7a', wallF: '#d8c8b0', roof: '#9a5a44', roof2: '#7a4434' },
  market: { bg: '#2a2420', floor: '#bdb2a0', floor2: '#b2a894', line: '#9a907e', wallT: '#e8dcc8', wallF: '#a89a84' },
};
function zoneFloor(g, z, ch, x, y, sx, sy, cs, TH, vt) {
  const h = hash(x, y, 3);
  if (ch === '~' || ch === 'P' || ch === 'o') {
    g.fillStyle = TH.water; g.fillRect(sx, sy, cs + 0.5, cs + 0.5);
    g.strokeStyle = TH.water2; g.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) { const yy = sy + ((vt * (ch === '~' ? 0.9 : 0.15) + h + i * 0.5) % 1) * cs; g.beginPath(); g.moveTo(sx + cs * 0.18, yy); g.quadraticCurveTo(sx + cs * 0.5, yy - 3, sx + cs * 0.82, yy); g.stroke(); }
    if (ch === 'o') { g.fillStyle = '#4f9a4c'; g.strokeStyle = CM.ink; g.lineWidth = 2; g.beginPath(); g.ellipse(sx + cs / 2, sy + cs / 2, cs * 0.42, cs * 0.3, 0, 0.3, TAU - 0.1); g.lineTo(sx + cs / 2, sy + cs / 2); g.closePath(); g.fill(); g.stroke(); }
    return;
  }
  if (ch === '=') { g.fillStyle = TH.water; g.fillRect(sx, sy, cs + 0.5, cs + 0.5); g.fillStyle = '#8a5a3a'; g.fillRect(sx - 1, sy + cs * 0.12, cs + 2, cs * 0.76); g.strokeStyle = '#5a3a24'; g.lineWidth = 1.2; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(sx + i * cs / 4, sy + cs * 0.12); g.lineTo(sx + i * cs / 4, sy + cs * 0.88); g.stroke(); } return; }
  let col = (x + y) % 2 ? TH.floor : TH.floor2;
  if ((ch === 'g' || ch === 'T' || ch === 'b') && TH.grass) col = h < 0.5 ? TH.grass : TH.grass2;
  if (z.def.theme === 'park' && (ch === '.' ) && !(x === 6 || y === 6 || y === 13 || y === 19 || y === 23)) col = h < 0.5 ? TH.grass : TH.grass2;
  if (ch === ',' ) col = TH.soil || (TH.yard ? ((x + y) % 2 ? TH.yard : TH.yard2) : TH.floor);
  if (ch === 'l') col = TH.yard || TH.floor;
  g.fillStyle = col; g.fillRect(sx, sy, cs + 0.5, cs + 0.5);
  if (z.def.theme === 'sewer') { g.strokeStyle = TH.line; g.lineWidth = 1; g.strokeRect(sx + 0.5, sy + 0.5, cs - 1, cs - 1); if (h < 0.15) { g.fillStyle = 'rgba(90,140,90,0.35)'; g.beginPath(); g.ellipse(sx + cs * 0.5, sy + cs * 0.6, cs * 0.3, cs * 0.14, 0, 0, TAU); g.fill(); } }
  if (z.def.theme === 'market' && h < 0.2) { g.fillStyle = 'rgba(120,150,170,0.3)'; g.beginPath(); g.ellipse(sx + cs * 0.4, sy + cs * 0.6, cs * 0.28, cs * 0.12, 0, 0, TAU); g.fill(); }
  // 地上的人孔
  for (const e of z.def.exits) if (e.floor && e.x === x && e.y === y) {
    g.fillStyle = '#2a2c34'; g.strokeStyle = CM.ink; g.lineWidth = 2; g.beginPath(); g.ellipse(sx + cs / 2, sy + cs / 2, cs * 0.38, cs * 0.3, 0, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = '#4a4c58'; g.lineWidth = 1.4; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(sx + cs * 0.26, sy + cs / 2 + i * cs * 0.1); g.lineTo(sx + cs * 0.74, sy + cs / 2 + i * cs * 0.1); g.stroke(); }
  }
}
function zoneWall(g, z, ch, x, y, sx, sy, cs, TH, vt) {
  const I = z.info(x, y);
  if (I.wall) {
    const hh = cs * I.wall * (z.def.theme === 'market' ? 0.6 : 1);
    const isH = I.house;
    // 正面
    g.fillStyle = isH ? (TH.wallF) : TH.wallF; g.fillRect(sx, sy + cs - hh * 0.6, cs + 0.5, hh * 0.6);
    // 頂面
    g.fillStyle = isH ? (TH.roof || TH.wallT) : TH.wallT; g.fillRect(sx, sy - hh * 0.4, cs + 0.5, cs);
    if (isH) { g.strokeStyle = TH.roof2 || 'rgba(0,0,0,0.2)'; g.lineWidth = 1.2; for (let i = 1; i < 4; i++) { const yy = sy - hh * 0.4 + i * cs / 4; g.beginPath(); g.moveTo(sx, yy); g.lineTo(sx + cs, yy); g.stroke(); } if (!z.info(x, y - 1).house) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(sx, sy - hh * 0.4, cs + 0.5, 3); } }
    if (z.def.theme === 'sewer') { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(sx, sy + cs - hh * 0.6 + i * hh * 0.2); g.lineTo(sx + cs, sy + cs - hh * 0.6 + i * hh * 0.2); g.stroke(); } }
    const below = z.info(x, y + 1);
    if (!below.wall) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(sx, sy + cs, cs + 0.5, cs * 0.18); }
    if (I.win) {
      const W2 = z.wins.find(w => w.x === x && w.y === y), lit = W2 ? W2.lit : true;
      g.fillStyle = CM.ink; g.fillRect(sx + cs * 0.18, sy + cs - hh * 0.55, cs * 0.64, hh * 0.42);
      g.fillStyle = lit ? (W2 && W2.state === 'look' ? '#fff0b0' : '#ffd27a') : '#3a3a52'; g.fillRect(sx + cs * 0.22, sy + cs - hh * 0.52, cs * 0.56, hh * 0.36);
      if (W2 && (W2.state === 'look' || W2.state === 'pre')) { g.fillStyle = 'rgba(40,30,40,0.85)'; g.beginPath(); g.arc(sx + cs * 0.5, sy + cs - hh * 0.3, cs * 0.13, Math.PI, 0); g.fill(); g.fillRect(sx + cs * 0.37, sy + cs - hh * 0.3, cs * 0.26, hh * 0.14); }
    }
    if (I.exit) zoneExitArt(g, z, I.exit, sx, sy, cs, hh);
    return;
  }
  if (I.tree) {
    g.fillStyle = '#5a3a2a'; g.fillRect(sx + cs * 0.42, sy + cs * 0.2, cs * 0.16, cs * 0.7);
    g.fillStyle = CM.ink; g.beginPath(); g.arc(sx + cs / 2, sy - cs * 0.2, cs * 0.66, 0, TAU); g.fill();
    g.fillStyle = hash(x, y, 9) < 0.5 ? '#2f5a34' : '#355f36'; g.beginPath(); g.arc(sx + cs / 2, sy - cs * 0.2, cs * 0.6, 0, TAU); g.fill();
    g.fillStyle = 'rgba(120,180,110,0.35)'; g.beginPath(); g.arc(sx + cs * 0.36, sy - cs * 0.38, cs * 0.26, 0, TAU); g.fill();
    return;
  }
  if (I.bush) {
    g.fillStyle = CM.ink; g.beginPath(); g.ellipse(sx + cs / 2, sy + cs * 0.55, cs * 0.52, cs * 0.42, 0, 0, TAU); g.fill();
    g.fillStyle = '#3f7a42'; g.beginPath(); g.ellipse(sx + cs / 2, sy + cs * 0.55, cs * 0.47, cs * 0.37, 0, 0, TAU); g.fill();
    g.fillStyle = '#5a9a52'; g.beginPath(); g.ellipse(sx + cs * 0.4, sy + cs * 0.42, cs * 0.2, cs * 0.14, 0, 0, TAU); g.fill();
    return;
  }
  if (I.fence) {
    g.strokeStyle = CM.ink; g.lineWidth = 3.2; g.beginPath(); g.moveTo(sx, sy + cs * 0.5); g.lineTo(sx + cs, sy + cs * 0.5); g.stroke();
    g.strokeStyle = '#e8e0d0'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(sx, sy + cs * 0.5); g.lineTo(sx + cs, sy + cs * 0.5); g.stroke();
    for (const k of [0.2, 0.8]) { g.fillStyle = CM.ink; g.fillRect(sx + cs * k - 2.5, sy + cs * 0.2, 5, cs * 0.55); g.fillStyle = '#f2ece0'; g.fillRect(sx + cs * k - 1.5, sy + cs * 0.22, 3, cs * 0.5); }
    return;
  }
  if (I.bench) {
    g.fillStyle = CM.ink; g.fillRect(sx - cs * 0.3, sy + cs * 0.3, cs * 1.6, cs * 0.42);
    g.fillStyle = '#a8724a'; g.fillRect(sx - cs * 0.27, sy + cs * 0.33, cs * 1.54, cs * 0.16); g.fillStyle = '#8a5a3a'; g.fillRect(sx - cs * 0.27, sy + cs * 0.52, cs * 1.54, cs * 0.16);
    return;
  }
  if (I.lamp) {
    g.fillStyle = CM.ink; g.fillRect(sx + cs * 0.42, sy - cs * 1.2, cs * 0.16, cs * 2);
    g.fillStyle = '#5a5e6a'; g.fillRect(sx + cs * 0.45, sy - cs * 1.15, cs * 0.1, cs * 1.95);
    g.fillStyle = CM.ink; g.beginPath(); g.arc(sx + cs / 2, sy - cs * 1.25, cs * 0.24, 0, TAU); g.fill();
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(sx + cs / 2, sy - cs * 1.25, cs * 0.18, 0, TAU); g.fill();
    return;
  }
  if (I.stall) {
    const hue = ['#e8394d', '#3a8ad0', '#f2a83a', '#5aa652'][Math.floor(hash(Math.floor(x / 3), y, 4) * 4)];
    g.fillStyle = CM.ink; g.fillRect(sx - 0.5, sy - cs * 0.15, cs + 1, cs * 1.05);
    g.fillStyle = '#c8b498'; g.fillRect(sx, sy + cs * 0.3, cs + 0.5, cs * 0.55);
    g.fillStyle = (x + y) % 2 ? hue : '#ffffff'; g.fillRect(sx, sy - cs * 0.12, cs + 0.5, cs * 0.4);
    return;
  }
  if (I.crate) {
    g.fillStyle = CM.ink; g.fillRect(sx + cs * 0.08, sy - cs * 0.05, cs * 0.84, cs * 0.9);
    g.fillStyle = '#b8864a'; g.fillRect(sx + cs * 0.12, sy, cs * 0.76, cs * 0.8); g.strokeStyle = '#7a5a2a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(sx + cs * 0.12, sy); g.lineTo(sx + cs * 0.88, sy + cs * 0.8); g.stroke();
    return;
  }
  if (I.laundry && (x + y) % 2 === 0) {
    g.strokeStyle = CM.ink; g.lineWidth = 1.4; g.beginPath(); g.moveTo(sx, sy + cs * 0.1); g.lineTo(sx + cs, sy + cs * 0.1); g.stroke();
    const cols = ['#ff9fbb', '#9fc8ff', '#fff2a8', '#c8f0c0'];
    g.fillStyle = cols[(x * 3 + y) % 4]; g.strokeStyle = CM.ink; g.lineWidth = 1.6; g.beginPath(); g.rect(sx + cs * 0.15, sy + cs * 0.1, cs * 0.7, cs * 0.65); g.fill(); g.stroke();
  }
}
function zoneExitArt(g, z, id, sx, sy, cs, hh) {
  const e = z.def.exits.find(e => e.id === id); if (!e) return;
  const fy = sy + cs - hh * 0.6;
  if (e.to === 'alley') {
    // 往上的梯子
    g.strokeStyle = '#9aa0b0'; g.lineWidth = 2.2;
    for (const k of [0.3, 0.7]) { g.beginPath(); g.moveTo(sx + cs * k, sy - hh * 0.4); g.lineTo(sx + cs * k, sy + cs); g.stroke(); }
    for (let i = 0; i < 5; i++) { const yy = sy - hh * 0.4 + i * (cs + hh * 0.4) / 5 + 3; g.beginPath(); g.moveTo(sx + cs * 0.3, yy); g.lineTo(sx + cs * 0.7, yy); g.stroke(); }
  } else if (e.to === 'park' || e.to === 'nb') {
    const open = zoneGateOpen(z.run, e.gate);
    g.fillStyle = open ? '#1a1c24' : '#2a2c38'; g.fillRect(sx + cs * 0.1, fy, cs * 0.8, hh * 0.6);
    if (e.to === 'park') { g.strokeStyle = open ? '#6a5a4a' : '#a8643a'; g.lineWidth = 2; for (let i = 1; i < 5; i++) { if (open && i % 2) continue; g.beginPath(); g.moveTo(sx + cs * (0.1 + i * 0.16), fy); g.lineTo(sx + cs * (0.1 + i * 0.16), fy + hh * 0.6); g.stroke(); } }
    else if (!open) { g.fillStyle = '#5a4a4a'; for (let i = 0; i < 4; i++) g.fillRect(sx + cs * (0.15 + (i % 2) * 0.35), fy + (i >> 1) * hh * 0.3 + 1, cs * 0.32, hh * 0.26); }
  } else if (e.to === 'marketPeek') {
    g.fillStyle = '#1a1c24'; g.fillRect(sx + cs * 0.1, fy, cs * 0.8, hh * 0.6);
    g.strokeStyle = '#a8a090'; g.lineWidth = 1.6; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(sx + cs * (0.1 + i * 0.13), fy); g.lineTo(sx + cs * (0.1 + i * 0.13), fy + hh * 0.6); g.stroke(); }
    g.fillStyle = 'rgba(255,200,120,0.35)'; g.fillRect(sx + cs * 0.1, fy, cs * 0.8, hh * 0.6);
  }
}
function zoneDrawArt(g, a, x, y, cs, glow, alpha = 1) {
  if (!a || !a.img) return;
  const k = cs, w = a.w * k, h = a.h * k, ax = a.ax !== undefined ? a.ax : 0.5;
  g.save(); if (alpha < 1) g.globalAlpha = alpha;
  if (a.flip) { g.translate(x, 0); g.scale(-1, 1); x = 0; }
  g.drawImage(a.img, x - w * ax, y - h - (a.lift || 0) * k, w, h);
  g.restore();
}
function zoneItem(g, it, sx, sy, cs, vt) {
  const b = Math.sin(vt * 4 + it.x) * 2;
  g.fillStyle = 'rgba(255,240,180,0.25)'; g.beginPath(); g.arc(sx, sy - cs * 0.25 + b, cs * 0.32, 0, TAU); g.fill();
  if (it.kind === 'cans') zoneDrawArt(g, { img: G.S.obj.can, w: 0.55, h: 0.42 }, sx, sy - cs * 0.05 + b, cs);
  else if (it.kind === 'coins') { for (let i = 0; i < 3; i++) { g.fillStyle = CM.ink; g.beginPath(); g.ellipse(sx - 4 + i * 4, sy - 6 - i * 2 + b, 5, 3.4, 0, 0, TAU); g.fill(); g.fillStyle = '#ffd84d'; g.beginPath(); g.ellipse(sx - 4 + i * 4, sy - 6 - i * 2 + b, 4, 2.6, 0, 0, TAU); g.fill(); } }
  else if (it.kind === 'key') { g.strokeStyle = CM.ink; g.lineWidth = 4; g.beginPath(); g.arc(sx - 5, sy - 10 + b, 4, 0, TAU); g.moveTo(sx - 1, sy - 10 + b); g.lineTo(sx + 9, sy - 10 + b); g.stroke(); g.strokeStyle = '#c8843c'; g.lineWidth = 2; g.beginPath(); g.arc(sx - 5, sy - 10 + b, 4, 0, TAU); g.moveTo(sx - 1, sy - 10 + b); g.lineTo(sx + 9, sy - 10 + b); g.moveTo(sx + 6, sy - 10 + b); g.lineTo(sx + 6, sy - 6 + b); g.stroke(); }
  else if (it.kind === 'fish') { g.fillStyle = CM.ink; g.beginPath(); g.ellipse(sx, sy - 8 + b, 9, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#9ad0e8'; g.beginPath(); g.ellipse(sx, sy - 8 + b, 7.5, 3.6, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(sx + 6, sy - 8 + b); g.lineTo(sx + 12, sy - 13 + b); g.lineTo(sx + 12, sy - 3 + b); g.fill(); }
  else if (it.kind === 'lost') { g.fillStyle = CM.ink; g.beginPath(); g.arc(sx, sy - 9 + b, 7, 0, TAU); g.fill(); g.fillStyle = '#aef0ff'; g.beginPath(); g.arc(sx, sy - 9 + b, 5.5, 0, TAU); g.fill(); CM.text(g, sx, sy - 9 + b, '?', '#2a3a5a', 10, 1, { stroke: '#aef0ff' }); for (let i = 0; i < 3; i++) { const a = vt * 3 + i * 2.1; g.fillStyle = '#ffffff'; g.fillRect(sx + Math.cos(a) * 11 - 1, sy - 9 + b + Math.sin(a) * 9 - 1, 2, 2); } }
}
function zoneNpcDraw(g, z, n, S, cs, vt) {
  if (n.kind === 'win') return;
  const [sx, sy] = S(n.x, n.y);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(sx, sy, cs * 0.36, cs * 0.12, 0, 0, TAU); g.fill();
  if (n.draw) { n.draw(g, sx, sy, cs, vt, z); return; }
  zoneDrawArt(g, ART.human({ key: n.key, dir: n.dir, moving: n.moving, t: n.t, bubble: n.emoteT > 0 }), sx, sy, cs * 1.0);
}
function zoneCone(g, z, n, S, cs) {
  if (!n.range) return;
  if (n.kind === 'win' && n.state !== 'look' && n.state !== 'pre') return;
  const ex = n.kind === 'win' ? n.x + 0.5 : n.x, ey = n.kind === 'win' ? n.y + 1.3 : n.y - 0.15;
  const R = n.range * (z.def.dark && !n.torch ? 0.62 : 1) * (1 + z.heat * 0.06), [sx, sy] = S(ex, ey);
  const alarm = n.state === 'chase' || n.s >= 1;
  g.save();
  g.fillStyle = alarm ? 'rgba(255,110,80,0.22)' : n.state === 'pre' ? 'rgba(255,230,140,0.08)' : 'rgba(255,226,120,0.17)';
  g.beginPath(); g.moveTo(sx, sy);
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const a = n.ang - n.half + (i / N) * n.half * 2;
    // 被牆擋住就短一點
    let r = R; for (let s = 0.25; s <= R; s += 0.25) if (z.opaqueAt(ex + Math.cos(a) * s, ey + Math.sin(a) * s)) { r = s; break; }
    g.lineTo(sx + Math.cos(a) * r * cs, sy + Math.sin(a) * r * cs);
  }
  g.closePath(); g.fill();
  g.restore();
}
function zoneBird(g, b, sx, sy, cs, vt) {
  if (b.fly > 0) { const k = 1 - b.fly / 1.6; sx += b.vx * k * cs * 3; sy -= k * cs * 3; g.globalAlpha = Math.max(0, b.fly / 1.6); }
  const f = b.fly > 0 ? Math.sin(vt * 30) * 4 : 0;
  g.fillStyle = CM.ink; g.beginPath(); g.ellipse(sx, sy - 6, 8, 5.5, 0, 0, TAU); g.fill();
  g.fillStyle = b.duck ? '#f4f0e6' : '#9a9ab0'; g.beginPath(); g.ellipse(sx, sy - 6, 6.8, 4.4, 0, 0, TAU); g.fill();
  g.fillStyle = b.duck ? '#3a7a4a' : '#7a7a90'; g.beginPath(); g.arc(sx + 5, sy - 10, 3.2, 0, TAU); g.fill();
  g.fillStyle = '#f2a83a'; g.beginPath(); g.moveTo(sx + 7.6, sy - 10.5); g.lineTo(sx + 11, sy - 9.6); g.lineTo(sx + 7.6, sy - 8.8); g.fill();
  if (b.fly > 0) { g.strokeStyle = CM.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(sx - 2, sy - 8); g.lineTo(sx - 8, sy - 12 - f); g.moveTo(sx + 1, sy - 8); g.lineTo(sx + 6, sy - 13 + f); g.stroke(); }
  else if (!b.duck && Math.sin(vt * 2 + b.x * 3) > 0.8) CM.emote(g, sx, sy - 12, 'z', 0.6, 0.8);
  g.globalAlpha = 1;
}
function zoneDark(g, z, S, cs, W, H) {
  const dk = z.dk || (z.dk = document.createElement('canvas'));
  const dw = Math.ceil(W / 2), dh = Math.ceil(H / 2);
  if (dk.width !== dw || dk.height !== dh) { dk.width = dw; dk.height = dh; }
  const d = dk.getContext('2d');
  d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, dw, dh);
  d.fillStyle = `rgba(6,7,18,${z.def.dark})`; d.fillRect(0, 0, dw, dh);
  d.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a = 1) => { const [sx, sy] = S(x, y), R = r * cs / 2; const gr = d.createRadialGradient(sx / 2, sy / 2, R * 0.2, sx / 2, sy / 2, R); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gr; d.beginPath(); d.arc(sx / 2, sy / 2, R, 0, TAU); d.fill(); };
  const run = z.run;
  hole(z.cx, z.cy - 0.4, z.id === 'sewer' ? (run.upg.sewer >= 2 ? 4.6 : 3.4) + (run.upg.nightvis || 0) * 0.4 : 2.6, z.id === 'sewer' ? 0.95 : 0.8);
  for (const l of z.lightsNow()) hole(l.x, l.y, l.r * 1.25, 0.9);
  // 手電筒
  for (const n of z.npcs) if (n.torch) {
    const [sx, sy] = S(n.x, n.y - 0.15), R = n.range * cs * (1 + z.heat * 0.06) / 2;
    d.fillStyle = 'rgba(0,0,0,0.75)'; d.beginPath(); d.moveTo(sx / 2, sy / 2); d.arc(sx / 2, sy / 2, R, n.ang - n.half, n.ang + n.half); d.closePath(); d.fill();
  }
  g.drawImage(dk, 0, 0, W, H);
}
function zoneMiniDraw(g, m, W, H) {
  const w = Math.min(280, W - 60), x = (W - w) / 2, y = H * 0.58;
  g.fillStyle = 'rgba(16,14,32,0.85)'; CM.rr(g, x - 12, y - 34, w + 24, 64, 14); g.fill();
  CM.text(g, W / 2, y - 18, m.title || '時機到了按一下！', '#fff', 14, 1, { weight: 800 });
  g.fillStyle = '#3a3555'; CM.rr(g, x, y, w, 16, 8); g.fill();
  g.fillStyle = '#6ad08a'; CM.rr(g, x + w * m.zone[0], y, w * (m.zone[1] - m.zone[0]), 16, 6); g.fill();
  const px = x + w * m.pos;
  g.fillStyle = '#ffd25a'; g.strokeStyle = CM.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px, y + 20); g.lineTo(px - 7, y + 30); g.lineTo(px + 7, y + 30); g.closePath(); g.fill(); g.stroke();
  g.fillRect(px - 1.5, y - 2, 3, 20);
}
// 老鼠
function drawRat(g, sx, sy, cs, vt, o = {}) {
  const k = (o.king ? 1.7 : 1) * cs / 36, f = o.moving ? Math.sin(vt * 24) * 1.5 : 0, dir = o.flip ? -1 : 1;
  g.save(); g.translate(sx, sy); g.scale(dir * k, k);
  g.strokeStyle = CM.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(-8, -4); g.quadraticCurveTo(-16, -2 + f, -20, -8); g.stroke();
  g.strokeStyle = '#e8a0a8'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-8, -4); g.quadraticCurveTo(-16, -2 + f, -20, -8); g.stroke();
  g.fillStyle = CM.ink; g.beginPath(); g.ellipse(0, -6, 10.5, 7, 0, 0, TAU); g.fill();
  g.fillStyle = o.king ? '#8a8a9a' : '#9a96a6'; g.beginPath(); g.ellipse(0, -6, 9, 5.6, 0, 0, TAU); g.fill();
  g.fillStyle = CM.ink; g.beginPath(); g.ellipse(8, -8, 5.6, 4.6, 0, 0, TAU); g.fill();
  g.fillStyle = '#a8a4b4'; g.beginPath(); g.ellipse(8, -8, 4.4, 3.5, 0, 0, TAU); g.fill();
  g.fillStyle = CM.ink; g.beginPath(); g.arc(5, -13, 3.4, 0, TAU); g.fill(); g.fillStyle = '#f2b8c0'; g.beginPath(); g.arc(5, -13, 2.2, 0, TAU); g.fill();
  g.fillStyle = CM.ink; g.beginPath(); g.arc(10, -9.4, 1.1, 0, TAU); g.fill(); g.fillStyle = '#ff8fa0'; g.beginPath(); g.arc(13, -7.6, 1.3, 0, TAU); g.fill();
  if (o.king) { g.fillStyle = '#ffd84d'; g.strokeStyle = CM.ink; g.lineWidth = 1.6; g.beginPath(); g.moveTo(3, -15); g.lineTo(4, -21); g.lineTo(6.5, -17.5); g.lineTo(8.5, -22); g.lineTo(10.5, -17.5); g.lineTo(13, -21); g.lineTo(13, -15); g.closePath(); g.fill(); g.stroke(); }
  if (o.flower) { g.fillStyle = FLOWERS[o.flower] ? FLOWERS[o.flower].color : '#ff9fcb'; g.beginPath(); g.arc(15, -6, 3, 0, TAU); g.fill(); }
  g.restore();
}
function drawZDog(g, sx, sy, cs, vt, d) { zoneDrawArt(g, ART.dog({ dir: d.dir || 'right', state: d.state, barkT: d.barkT, moving: false, t: vt }), sx, sy, cs * 1.0); }

// ---------- 門：要條件 ----------
function zoneGateOpen(run, gate) { const Z = zonesOf(run); return gate === 'park' ? !!Z.parkKey : gate === 'nb' ? !!Z.kingFriend : true; }
function zoneGateHint(run, gate) {
  if (gate === 'park') return '生鏽的鐵柵鎖住了，掛著「公園管理處」的大鎖。下水道裡也許有鑰匙？';
  if (gate === 'nb') return '牆上有一個被磚頭堵住的破洞，後面傳來吱吱聲……聽說下水道住著一隻老鼠王，牠的手下會挖洞。';
  return '打不開';
}

// ---------- 各區域：佈置 ----------
const ZONE_INIT = {
  sewer(z) {
    const run = z.run, Z = z.Z;
    // 戰利品：零錢、罐罐、失物（每晚隨機放 4 個）
    const spots = shuffle(z.def.loot.slice());
    const lostLeft = Object.keys(LOST_ITEMS).filter(k => !Z.lostSeen[k]);
    let n = 0;
    for (const [x, y] of spots) {
      if (n >= 4) break; n++;
      const r = Math.random();
      if (lostLeft.length && r < 0.42) { const id = lostLeft.splice(Math.floor(Math.random() * lostLeft.length), 1)[0]; z.items.push({ kind: 'lost', id, x: x + 0.5, y: y + 0.5 }); }
      else if (r < 0.75) z.items.push({ kind: 'cans', n: 2 + Math.floor(Math.random() * 4), x: x + 0.5, y: y + 0.5 });
      else z.items.push({ kind: 'coins', n: 100 * (2 + Math.floor(Math.random() * 6)), x: x + 0.5, y: y + 0.5 });
    }
    if (!Z.parkKey) z.items.push({ kind: 'key', x: 9.5, y: 20.5 });
    // 幽靈蘭：最深的死巷，四成機率
    if (Math.random() < (Z.visits.sewer ? 0.4 : 1)) z.pots.push({ t: 'ghostorchid', x: 1.5, y: 24.6, avail: true, glow: true });
    // 老鼠
    const ratSpots = [[3, 4], [9, 8], [3, 16], [9, 18], [3, 21], [11, 11]];
    z.rats = shuffle(ratSpots).slice(0, 3 + Math.min(2, Math.floor((Z.visits.sewer || 0) / 2))).map(([x, y]) => ({ x: x + 0.5, y: y + 0.5, tx: x + 0.5, ty: y + 0.5, t: Math.random() * 3, state: 'wander', carry: null }));
    // 老鼠王：第二次下來以後坐在中間的小房間
    if ((Z.visits.sewer || 0) >= 1 && !Z.kingFriend) z.king = { x: 9.5, y: 15.6 };
    else if (Z.kingFriend) z.king = { x: 9.5, y: 15.6, friend: true };
  },
  park(z) {
    const run = z.run, Z = z.Z;
    const P = (t, x, y, o = {}) => z.pots.push(Object.assign({ t, x: x + 0.5, y: y + 0.75, avail: true }, o));
    const bedA = ['plumeria', 'periwinkle', 'carnation', 'plumeria', 'babys', 'sunflower', 'plumeria', 'carnation'];
    let i = 0;
    for (const [x, y] of [[3, 8], [4, 9], [3, 10], [8, 8], [9, 9], [8, 10]]) P(bedA[i++ % bedA.length], x, y);
    for (const [x, y] of [[2, 14], [4, 15], [8, 14], [10, 15], [3, 15], [9, 14]]) P(pick(['periwinkle', 'babys', 'carnation', 'plumeria', 'sunflower', 'hydrangea']), x, y);
    // 荷花：荷葉中間
    P('lotus', 6, 3, { s: 0.9 }); if (Math.random() < 0.6) P('lotus', 5, 4, { s: 0.85 });
    // 管理員（拿手電筒）、夜跑大叔
    z.npcs.push(zNpc({ kind: 'guard', key: 'ranger', torch: true, x: 6.5, y: 18.5, speed: 1.35, range: 4.4, half: 0.5, hear: true, pause: 1.2,
      route: [[6.5, 18.5], [1.5, 19.5], [1.5, 12.5], [6.5, 12.5], [11.5, 12.5], [11.5, 6.5], [6.5, 6.5], [1.5, 6.5], [6.5, 12.5], [11.5, 19.5]],
      shout: ['喂！哪來的貓！', '又是你這隻偷花貓！', '站住！'] }));
    if (z.heat >= 3) z.npcs.push(zNpc({ kind: 'guard', key: 'ranger', torch: true, x: 6.5, y: 6.5, speed: 1.2, range: 4.0, half: 0.5, hear: true, pause: 2, route: [[6.5, 6.5], [10.5, 10.5], [6.5, 15.5], [2.5, 10.5]], shout: ['這裡也有！'] }));
    z.npcs.push(zNpc({ kind: 'guard', key: 'jogger', x: 1.5, y: 23.5, speed: 3.6, range: 2.8, half: 0.45, hear: false, chaseMul: 0.9,
      route: [[1.5, 23.5], [1.5, 6.5], [11.5, 6.5], [11.5, 23.5]], shout: ['咦？貓咪？'] }));
    // 長椅上的情侶
    z.npcs.push(zNpc({ kind: 'static', key: 'coupleA', x: 6.2, y: 17.2, range: 3.0, half: 0.7, looks: [Math.PI / 2, 2.2, 0.9, -0.4, -2.6], shout: ['啊，有貓叼著花！', '管理員～這裡有貓！'] }));
    z.npcs.push(zNpc({ kind: 'static', key: 'coupleB', x: 7.2, y: 17.2, range: 0, half: 0, looks: [Math.PI / 2], art: true }));
    // 池邊睡覺的鴨子、廣場的鴿子
    for (const [x, y] of [[3.4, 5.8], [3.8, 6.2], [9.2, 5.8], [8.8, 6.3]]) z.birds.push({ x, y, duck: true, fly: 0 });
    for (const [x, y] of [[5.6, 13.4], [6.4, 13.7], [7.2, 13.3]]) z.birds.push({ x, y, duck: false, fly: 0 });
    // 灑水器
    for (const [x, y] of [[2.5, 20.5], [10.5, 20.5], [2.5, 21.5], [10.5, 21.5]]) z.sprinklers.push({ x, y, r: 1.5, on: false, ph: (x > 6 ? 7 : 0) });
    // 撈錦鯉的地方
    z.fishSpots = [[6.5, 5.5], [3.5, 3.5], [9.5, 3.5]].map(([x, y]) => ({ x, y, used: false }));
  },
  nb(z) {
    const run = z.run, Z = z.Z;
    const P = (t, x, y, o = {}) => z.pots.push(Object.assign({ t, x: x + 0.5, y: y + 0.75, avail: true }, o));
    // 花藝老師（左上）：山茶花、蝴蝶蘭
    P('camellia', 1, 3); P('camellia', 3, 4); P('camellia', 1, 5); P('orchid', 4, 3);
    // 大學生（右上）：多肉不能偷，陽台上有桔梗
    P('lisianthus', 9, 3); P('rose', 11, 4); P('lisianthus', 8, 5);
    // 柴犬家（左中）
    P('hydrangea', 1, 11); P('rose', 3, 13); P('camellia', 1, 13);
    // 右下：一戶人家的院子
    P('magnolia', 9, 19); P('osmanthus', 11, 20); P('camellia', 10, 21);
    // 窗邊：大學生（一直醒著）、花藝老師（感應燈亮了才會看）、柴犬家
    z.wins.push(z.npcs[z.npcs.push(zNpc({ kind: 'win', key: 'student', x: 9, y: 2, range: 4.8, half: 0.75, ang: Math.PI / 2, state: 'off', ct: 4, gap: [4, 8], lit: true, shout: ['……有貓在偷花？我要拍下來！'] })) - 1]);
    z.wins.push(z.npcs[z.npcs.push(zNpc({ kind: 'win', key: 'teacher', x: 3, y: 2, range: 4.4, half: 0.7, ang: Math.PI / 2, state: 'off', ct: 99, gap: [40, 60], lit: false, shout: ['我的山茶花！'] })) - 1]);
    z.wins.push(z.npcs[z.npcs.push(zNpc({ kind: 'win', key: 'lin', x: 2, y: 10, range: 3.6, half: 0.7, ang: Math.PI / 2, state: 'off', ct: 7, gap: [8, 14], lit: true, shout: ['阿福在叫什麼？'] })) - 1]);
    z.wins.push(z.npcs[z.npcs.push(zNpc({ kind: 'win', key: 'shopC', x: 9, y: 18, range: 4.0, half: 0.7, ang: Math.PI / 2, state: 'off', ct: 10, gap: [9, 15], lit: true, shout: ['誰在院子裡？'] })) - 1]);
    // 巡守隊（隔壁里的）
    z.npcs.push(zNpc({ kind: 'guard', key: 'patrol', torch: true, x: 6.5, y: 15.5, speed: 1.25, range: 4.0, half: 0.5, hear: true, pause: 1.5,
      route: [[6.5, 15.5], [6.5, 7.5], [1.5, 7.5], [11.5, 7.5], [6.5, 7.5], [6.5, 23.5], [1.5, 23.5], [6.5, 23.5]], shout: ['隔壁巷的偷花貓！', '站住！'] }));
    // 感應燈：花藝老師門口、柴犬家門口
    z.motion.push({ x: 5.5, y: 5.5, r: 1.3, on: 0, win: z.wins[1] }, { x: 4.5, y: 12.5, r: 1.2, on: 0, win: z.wins[2] });
    // 柴犬阿福
    z.dog = { x: 2.5, y: 12.2, r: 2.0, state: 'sleep', ct: 6, barkT: 0, friend: !!Z.dogFriend, dir: 'right' };
    // 神秘黑貓（之後的對手）
    if (!run.flags.blackCatSeen || Math.random() < 0.5) z.blackcat = { x: 11.5, y: 23.6, state: 'sit', t: 0 };
  },
  market(z) {
    const run = z.run;
    z.left = z.def.timer;
    // 花販丟掉的花（一桶一桶）：每桶可以撿幾次
    z.discard = [{ x: 2.5, y: 2.6, n: 3 }, { x: 10.5, y: 2.6, n: 3 }, { x: 6.5, y: 8.6, n: 2 }];
    z.haul = [];
    // 魚攤：桌上的魚
    z.fishTray = { x: 2.5, y: 6.6, n: 2 }; z.fishTray2 = { x: 10.5, y: 12.6, n: 1 };
    // 早餐店阿姨（撒嬌給罐罐）
    z.aunt = { x: 10.5, y: 6.4, done: false };
    z.npcs.push(zNpc({ kind: 'static', key: 'fishlady', x: 3.4, y: 6.2, range: 2.8, half: 0.9, looks: [0, 0.8, -0.8, Math.PI / 2], shout: ['死貓仔！不要偷我的魚！', '去去去！'] }));
    z.npcs.push(zNpc({ kind: 'guard', key: 'sweeper', x: 6.5, y: 12.5, speed: 1.6, range: 3.2, half: 0.6, hear: true, pause: 0.8, chaseMul: 1.2,
      route: [[6.5, 12.5], [1.5, 9.5], [6.5, 3.5], [11.5, 9.5]], shout: ['掃把來囉！', '又是你這隻貓！'] }));
    for (let i = 0; i < 4; i++) z.npcs.push(zNpc({ kind: 'walker', key: pick(['shopA', 'shopB', 'shopD', 'shopE', 'shopF', 'cust1']), x: 2 + i * 3 + 0.5, y: 3.5 + (i % 2) * 6, speed: 1.0, range: 0 }));
    z.place(6.5, 13.5); z.snap = true;
  },
};
function zNpc(o) { return Object.assign({ x: 0, y: 0, t: Math.random() * 3, dir: 'down', moving: false, s: 0, state: 'route', wi: 0, speed: 1.4, range: 4, half: 0.6, ang: Math.PI / 2, lookT: 1, path: null, emoteT: 0, wait: 0 }, o); }

// ---------- 各區域：每一格 ----------
const ZONE_UPD = {
  sewer(z, dt) {
    const run = z.run, Z = z.Z, c = z.sc.cat;
    for (const r of z.rats) {
      r.t += dt;
      if (r.state === 'gone') { if (r.t > 12) { r.state = 'wander'; r.t = 0; } continue; }
      const d = Math.hypot(r.x - z.cx, r.y - z.cy);
      const friend = Z.kingFriend;
      if (!friend && c.carry.length && d < 3.2 && r.state !== 'flee') r.state = 'chase';
      if (r.state === 'chase' && (d > 4.5 || !c.carry.length)) r.state = 'wander';
      let tx = r.tx, ty = r.ty, sp = 1.6;
      if (r.state === 'chase') { tx = z.cx; ty = z.cy; sp = 2.7; }
      else if (r.state === 'flee') { sp = 3.2; }
      else if (Math.hypot(tx - r.x, ty - r.y) < 0.15 || r.t > 3) {
        r.t = 0;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [Math.floor(r.x) + dx, Math.floor(r.y) + dy]).filter(([x, y]) => !z.npcBlocked(x, y));
        if (opts.length) { const [x, y] = pick(opts); r.tx = x + 0.5; r.ty = y + 0.5; }
        tx = r.tx; ty = r.ty;
      }
      if (r.state === 'flee') {
        // 叼著花逃走，跑到下一個格子就消失（鑽進洞裡）
        tx = r.tx; ty = r.ty;
        if (Math.hypot(tx - r.x, ty - r.y) < 0.15) { r.state = 'gone'; r.t = 0; r.carry = null; z.pop(r.x, r.y - 0.6, '（鑽進洞裡了）', '#b8b3d8'); continue; }
      }
      const dx = tx - r.x, dy = ty - r.y, dd = Math.hypot(dx, dy) || 1, k = Math.min(1, sp * dt / dd);
      const nx = r.x + dx * k, ny = r.y + dy * k;
      if (!z.npcBlocked(Math.floor(nx), Math.floor(ny))) { r.x = nx; r.y = ny; } else { r.tx = Math.floor(r.x) + 0.5; r.ty = Math.floor(r.y) + 0.5; }
      r.flip = dx < 0; r.moving = dd > 0.05;
      if (r.state === 'chase' && d < 0.5 && c.carry.length) {
        const f = c.carry.pop(); r.carry = f.t; r.state = 'flee';
        const back = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([ax, ay]) => [Math.floor(r.x) + ax * 2, Math.floor(r.y) + ay * 2]).filter(([x, y]) => !z.npcBlocked(x, y));
        const [bx, by] = back.length ? pick(back) : [Math.floor(r.x), Math.floor(r.y)]; r.tx = bx + 0.5; r.ty = by + 0.5;
        SFX.play('fail'); z.pop(z.cx, z.cy - 1.2, `老鼠搶走了${FLOWERS[f.t].name}！`, '#ff9a8a'); vibrate(60);
        z.sc.stats.ratStolen = (z.sc.stats.ratStolen || 0) + 1;
        if (!z.sc.tips.rat) { z.sc.tips.rat = 1; UI.toast('下水道的老鼠會搶你嘴上的花！看到老鼠就繞路，或用跑的甩掉牠', 3800); }
      }
    }
  },
  park(z, dt) {
    const c = z.sc.cat;
    // 灑水器：一陣一陣
    for (const s of z.sprinklers) {
      const ph = (z.t + s.ph) % 16; const was = s.on; s.on = ph > 10;
      if (s.on && !was && Math.hypot(s.x - z.cx, s.y - z.cy) < 5) SFX.tone(260, 0.3, { to: 520, vol: 0.03, type: 'sine' });
      if (s.on && Math.hypot(s.x - z.cx, s.y - z.cy) < s.r) {
        if (z.wet <= 0) { z.pop(z.cx, z.cy - 1.3, '濕答答！', '#9ad0ff'); if (!z.sc.tips.wet) { z.sc.tips.wet = 1; UI.toast('被灑水器噴到了：走不快，嘴上的花也會被水打爛。看準它停下來的時候再過去', 3800); } }
        z.wet = 1.8;
        for (const f of c.carry) f.fresh = Math.max(0.35, f.fresh - dt * 0.12);
      }
    }
    // 鴨子、鴿子：用跑的靠近會飛起來（很吵）
    for (const b of z.birds) {
      if (b.fly > 0) { b.fly -= dt; if (b.fly <= 0) { b.fly = 0; b.hidden = 18; } continue; }
      if (b.hidden > 0) { b.hidden -= dt; continue; }
      const d = Math.hypot(b.x - z.cx, b.y - z.cy);
      if (d < (c.running ? 1.9 : 0.8)) {
        for (const o of z.birds) if (!o.fly && !(o.hidden > 0) && Math.hypot(o.x - b.x, o.y - b.y) < 1.6) { o.fly = 1.6; o.vx = Math.sign(o.x - z.cx) || 1; }
        SFX.tone(900, 0.12, { to: 1300, vol: 0.06, type: 'square' }); z.noise(b.x, b.y, 6); z.pop(b.x, b.y - 1, b.duck ? '呱呱呱！' : '啪啪啪！', '#fff3c8');
        if (!z.sc.tips.duck) { z.sc.tips.duck = 1; UI.toast('嚇到鴨子了！牠們飛起來的聲音會把管理員引過來，經過要用走的', 3600); }
      }
    }
  },
  nb(z, dt) {
    const c = z.sc.cat, Z = z.Z, d = z.dog;
    for (const m of z.motion) {
      if (m.on > 0) m.on -= dt;
      if (Math.hypot(m.x - z.cx, m.y - z.cy) < m.r) {
        if (m.on <= 0) { SFX.tone(1800, 0.05, { vol: 0.04, type: 'square' }); if (m.win) { m.win.wake = true; m.win.lit = true; } if (!z.sc.tips.motion) { z.sc.tips.motion = 1; UI.toast('感應燈！燈一亮，屋裡的人就會探頭出來看。燈亮的地方大家看得比較遠', 3800); } }
        m.on = 5;
      }
    }
    for (const w of z.wins) if (w.key === 'teacher') w.lit = z.motion[0].on > 0 || w.state !== 'off';
    // 柴犬：睡一陣子醒一陣子；醒著的時候走進牠的範圍就會大叫
    if (d) {
      d.ct -= dt; if (d.barkT > 0) d.barkT -= dt;
      if (d.friend) { d.state = d.ct % 6 < 4 ? 'sleep' : 'stand'; if (d.ct < 0) d.ct = 12; }
      else {
        if (d.ct <= 0) { d.state = d.state === 'sleep' ? 'stand' : 'sleep'; d.ct = d.state === 'sleep' ? rnd(7, 11) : rnd(5, 8); }
        const dd = Math.hypot(d.x - z.cx, d.y - z.cy);
        d.dir = z.cx < d.x ? 'left' : 'right';
        if (dd < d.r * (d.state === 'sleep' ? 0.45 : 1) && d.barkT <= 0) {
          d.state = 'stand'; d.barkT = 2.2; d.ct = 6;
          SFX.play('bark'); z.noise(d.x, d.y, 9); z.pop(d.x, d.y - 1.2, '汪汪汪！', '#ffd25a');
          for (const w of z.wins) if (w.key === 'lin') w.wake = true;
          if (!z.sc.tips.nbdog) { z.sc.tips.nbdog = 1; UI.toast('柴犬阿福醒著的時候靠近牠就會大叫。帶一條魚來（清晨市場偷得到），牠就會變朋友', 4200); }
        }
      }
    }
    if (z.blackcat && z.blackcat.state === 'sit' && Math.hypot(z.blackcat.x - z.cx, z.blackcat.y - z.cy) < 2.4) {
      z.blackcat.state = 'leave'; z.blackcat.t = 0; z.run.flags.blackCatSeen = (z.run.flags.blackCatSeen || 0) + 1;
      SFX.tone(400, 0.25, { to: 260, vol: 0.06, type: 'sawtooth' });
      z.pop(z.blackcat.x, z.blackcat.y - 1.2, '嘶——', '#ffd25a');
      UI.toast(z.run.flags.blackCatSeen > 1 ? '又是那隻黑貓……牠嘴上叼著一朵花。' : '一隻黑貓瞪了你一眼，嘴上好像叼著什麼，轉身跳上牆走了。這一帶是牠的地盤？', 4200);
    }
    if (z.blackcat && z.blackcat.state === 'leave') { z.blackcat.t += dt; if (z.blackcat.t > 0.8) z.blackcat = null; }
  },
  market(z, dt) {
    for (const n of z.npcs) if (n.kind === 'walker') {
      n.t += dt;
      if (!n.path || !n.path.length) { const x = 1 + Math.floor(Math.random() * 11), y = 2 + Math.floor(Math.random() * 11); if (!z.npcBlocked(x, y)) n.path = z.path(n.x, n.y, x + 0.5, y + 0.5) || []; }
      if (n.path && n.path.length) { const [tx, ty] = n.path[0], dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy); if (d < 0.08) n.path.shift(); else { const k = Math.min(1, n.speed * dt / d); n.x += dx * k; n.y += dy * k; n.ang = Math.atan2(dy, dx); n.dir = angDir(n.ang); n.moving = true; } }
      // 擠過人群：被擋一下
      if (Math.hypot(n.x - z.cx, n.y - z.cy) < 0.45) { const a = Math.atan2(z.cy - n.y, z.cx - n.x); const nx = z.cx + Math.cos(a) * 0.08, ny = z.cy + Math.sin(a) * 0.08; if (!z.catSolid(nx, ny)) { z.cx = nx; z.cy = ny; } }
    }
  },
};

// ---------- 各區域：特別的目標 ----------
const ZONE_TGT = {
  sewer(z) {
    const K = z.king; if (!K) return null;
    if (Math.hypot(K.x - z.cx, K.y - z.cy) < 1.3) return { kind: 'king', x: K.x, y: K.y, label: '老鼠王', act: kingTalk };
    return null;
  },
  park(z) {
    for (const s of z.fishSpots) if (!s.used && Math.hypot(s.x - z.cx, s.y - z.cy) < 0.9) return { kind: 'fish', x: s.x, y: s.y - 0.4, label: '撈魚', act: z2 => {
      z2.startMini({ title: '錦鯉游過來了……按！', speed: 1.8, zone: [0.42, 0.6], done: (ok, timeout) => {
        s.used = true;
        if (ok) { z2.Z.fish = (z2.Z.fish || 0) + 1; z2.run.cans += 2; SFX.play('chime'); z2.pop(z2.cx, z2.cy - 1.3, '撈到一條小魚！（罐罐 +2）', '#9ad8ff'); if (!z2.sc.tips.fishGot) { z2.sc.tips.fishGot = 1; UI.toast('撈到的小魚可以拿去收買隔壁巷的柴犬、下水道的老鼠王', 3600); } }
        else { SFX.play('drop'); z2.noise(s.x, s.y, 4.5); z2.pop(z2.cx, z2.cy - 1.3, '噗通！（好大聲）', '#9ad0ff'); }
      } });
    } };
    return null;
  },
  nb(z) {
    const d = z.dog;
    if (d && !d.friend && (z.Z.fish || 0) > 0 && Math.hypot(d.x - z.cx, d.y - z.cy) < d.r + 0.6) return { kind: 'dog', x: d.x, y: d.y, label: '給魚', act: z2 => {
      z2.Z.fish--; z2.Z.dogFriend = 1; d.friend = true; d.state = 'stand'; d.barkT = 0;
      SFX.play('heart'); z2.pop(d.x, d.y - 1.4, '（阿福搖尾巴）', '#ffb8d0');
      UI.toast('柴犬阿福變成朋友了！以後牠不會再叫，還會幫你看著巡守隊', 3800);
    } };
    return null;
  },
  market(z) {
    const c = z.sc.cat;
    for (const b of z.discard) if (b.n > 0 && Math.hypot(b.x - z.cx, b.y - z.cy) < 1.0) return { kind: 'bucket', x: b.x, y: b.y, label: z.haul.length >= 6 ? '拿不動了' : '撿花', act: z2 => {
      if (z2.haul.length >= 6) { SFX.play('nope'); return; }
      b.n--; const t = pick(['rose', 'carnation', 'lisianthus', 'babys', 'sunflower', 'hydrangea', 'periwinkle', 'magnolia']);
      z2.haul.push(t); SFX.play('pick'); z2.pop(b.x, b.y - 1.2, `${FLOWERS[t].name}（還能賣）`, '#ffe2ea');
    } };
    for (const T of [z.fishTray, z.fishTray2]) if (T.n > 0 && Math.hypot(T.x - z.cx, T.y - z.cy) < 1.0) return { kind: 'tray', x: T.x, y: T.y, label: '叼魚', act: z2 => {
      T.n--; z2.Z.fish = (z2.Z.fish || 0) + 1; z2.run.cans += 3; SFX.play('pick'); z2.noise(T.x, T.y, 2.2);
      z2.pop(T.x, T.y - 1.2, '叼到一條魚！（罐罐 +3）', '#9ad8ff');
    } };
    if (!z.aunt.done && Math.hypot(z.aunt.x - z.cx, z.aunt.y - z.cy) < 1.2) return { kind: 'aunt', x: z.aunt.x, y: z.aunt.y, label: '撒嬌', act: z2 => {
      z2.startMini({ title: '在阿姨腳邊蹭蹭……抓準時機！', speed: 1.4, zone: [0.35, 0.65], label: '蹭！', done: ok => {
        z2.aunt.done = true;
        if (ok) { z2.run.cans += 6; SFX.play('heart'); z2.pop(z2.aunt.x, z2.aunt.y - 1.6, '「好可愛～給你吃蛋餅的肉鬆！」罐罐 +6', '#ffb8d0'); }
        else { z2.pop(z2.aunt.x, z2.aunt.y - 1.6, '「去去，阿姨在忙！」', '#fff3c8'); }
      } });
    } };
    return null;
  },
};

// ---------- 各區域：額外的圖 ----------
const ZONE_SPR = {
  sewer(z, push, S, cs, g, vt) {
    for (const r of z.rats) if (r.state !== 'gone') push(r.y, () => { const [sx, sy] = S(r.x, r.y); drawRat(g, sx, sy, cs, vt, { flip: r.flip, moving: r.moving, flower: r.carry }); if (r.state === 'chase') CM.emote(g, sx, sy - cs * 0.6, 'ex', 0.7, 1); });
    if (z.king) push(z.king.y, () => {
      const [sx, sy] = S(z.king.x, z.king.y);
      // 亮晶晶的寶物堆
      for (let i = 0; i < 7; i++) { g.fillStyle = ['#ffd84d', '#c8d0e0', '#ff9fbb', '#aef0ff'][i % 4]; g.beginPath(); g.arc(sx - cs * 0.5 + (i % 4) * cs * 0.32, sy - (i >> 2) * 5 + 2, 4, 0, TAU); g.fill(); }
      drawRat(g, sx, sy - 6, cs, vt, { king: true, flip: z.cx < z.king.x });
      if (z.king.friend && Math.sin(vt * 1.5) > 0.6) CM.emote(g, sx + 10, sy - cs * 1.2, 'heart', 0.7, 1);
    });
    for (const p of z.pots) if (p.glow && p.avail) push(p.y - 0.01, () => { const [sx, sy] = S(p.x, p.y - 0.6); g.fillStyle = `rgba(150,240,255,${0.18 + 0.08 * Math.sin(vt * 3)})`; g.beginPath(); g.arc(sx, sy, cs * 0.9, 0, TAU); g.fill(); });
  },
  park(z, push, S, cs, g, vt) {
    // 池裡的錦鯉
    push(0, () => { for (let i = 0; i < 3; i++) { const a = vt * 0.6 + i * 2.1, [sx, sy] = S(6.5 + Math.cos(a) * 1.6, 3.6 + Math.sin(a) * 1.1); g.fillStyle = i === 1 ? '#ffffff' : '#ff8a3a'; g.beginPath(); g.ellipse(sx, sy, 6, 2.8, a + Math.PI / 2, 0, TAU); g.fill(); } });
    for (const s of z.fishSpots) if (!s.used) push(s.y, () => { const [sx, sy] = S(s.x, s.y - 0.5); g.strokeStyle = 'rgba(200,230,255,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(sx, sy, 8 + Math.sin(vt * 3) * 2, 4, 0, 0, TAU); g.stroke(); });
  },
  nb(z, push, S, cs, g, vt) {
    if (z.dog) push(z.dog.y, () => { const [sx, sy] = S(z.dog.x, z.dog.y); if (!z.dog.friend) { g.strokeStyle = 'rgba(255,200,120,0.25)'; g.setLineDash([4, 4]); g.lineWidth = 1.5; g.beginPath(); g.ellipse(sx, sy, z.dog.r * cs, z.dog.r * cs * 0.8, 0, 0, TAU); g.stroke(); g.setLineDash([]); } g.strokeStyle = CM.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(sx - cs * 0.9, sy - 2); g.quadraticCurveTo(sx - cs * 0.4, sy + 4, sx, sy - 6); g.stroke(); drawZDog(g, sx, sy, cs, vt, z.dog); if (z.dog.state === 'sleep') CM.emote(g, sx + 8, sy - cs * 0.9, 'z', 0.8, 1); if (z.dog.friend && Math.sin(vt * 2) > 0.7) CM.emote(g, sx + 6, sy - cs, 'heart', 0.6, 1); });
    for (const m of z.motion) push(m.y - 0.6, () => { const [sx, sy] = S(m.x, m.y - 1.1); g.fillStyle = CM.ink; g.fillRect(sx - 7, sy - 4, 14, 8); g.fillStyle = m.on > 0 ? '#fff6c8' : '#5a5a6a'; g.fillRect(sx - 5.5, sy - 2.5, 11, 5); if (m.on > 0) { g.fillStyle = 'rgba(255,250,200,0.12)'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - cs * 2, sy + cs * 2.6); g.lineTo(sx + cs * 2, sy + cs * 2.6); g.closePath(); g.fill(); } });
    if (z.blackcat) push(z.blackcat.y, () => { const [sx, sy] = S(z.blackcat.x, z.blackcat.y - (z.blackcat.state === 'leave' ? z.blackcat.t * 2 : 0)); g.globalAlpha = z.blackcat.state === 'leave' ? Math.max(0, 1 - z.blackcat.t * 1.3) : 1; zoneDrawArt(g, gangLoaf(RIVAL_LOOK, vt, Math.floor(vt) % 4 === 0 ? 'blink' : 'none'), sx, sy, cs); g.globalAlpha = 1; });
  },
  market(z, push, S, cs, g, vt) {
    for (const b of z.discard) push(b.y, () => { const [sx, sy] = S(b.x, b.y); g.fillStyle = CM.ink; g.fillRect(sx - 10, sy - 16, 20, 16); g.fillStyle = '#5a8ad0'; g.fillRect(sx - 8.5, sy - 14.5, 17, 13); for (let i = 0; i < b.n * 2; i++) { g.fillStyle = ['#ff9fbb', '#ffd84d', '#ffffff', '#c8a0f0'][i % 4]; g.beginPath(); g.arc(sx - 6 + (i % 3) * 6, sy - 17 - (i >> 1) * 3, 3.2, 0, TAU); g.fill(); } });
    for (const T of [z.fishTray, z.fishTray2]) push(T.y, () => { const [sx, sy] = S(T.x, T.y); g.fillStyle = CM.ink; g.fillRect(sx - 14, sy - 10, 28, 9); g.fillStyle = '#e8eef4'; g.fillRect(sx - 12.5, sy - 8.5, 25, 6); for (let i = 0; i < T.n + 1; i++) { g.fillStyle = i < T.n ? '#9ad0e8' : '#c8d8e0'; g.beginPath(); g.ellipse(sx - 6 + i * 9, sy - 9, 5, 2.4, 0, 0, TAU); g.fill(); } });
    push(z.aunt.y, () => { const [sx, sy] = S(z.aunt.x, z.aunt.y); zoneDrawArt(g, ART.human({ key: 'aunt', dir: 'down', moving: false, t: vt }), sx, sy, cs); if (!z.aunt.done && Math.sin(vt * 2) > 0) CM.emote(g, sx + 8, sy - cs * 1.5, 'note', 0.7, 1); });
    if (z.haul.length) push(99, () => {});
  },
};
const RIVAL_LOOK = { id: 'rival', pal: { fur: '#1e1c24', furL: '#34303e', furD: '#121016', stripe: '#16141a', cream: '#2a2832', creamS: '#1e1c24', eye: '#7af0a0', eyeD: '#3aa860', ear: '#4a3a44', nose: '#3a2c34', noseD: '#2a1c24', out: '#0a080c' } };
const ZONE_HUD = {
  market(z, g, W, H, top) {
    if (!z.haul.length) return;
    g.fillStyle = 'rgba(16,14,32,0.72)'; CM.rr(g, 10, top + 32, 30 + z.haul.length * 22, 26, 13); g.fill();
    CM.text(g, 26, top + 45, '花', '#ffe2ea', 12, 1);
    z.haul.forEach((t, i) => { g.fillStyle = FLOWERS[t].color; g.strokeStyle = CM.ink; g.lineWidth = 2; g.beginPath(); g.arc(46 + i * 22, top + 45, 7, 0, TAU); g.fill(); g.stroke(); });
  },
  sewer(z, g, W, H, top) {
    const Z = z.Z, n = (Z.lost || []).length;
    if (n) { g.fillStyle = 'rgba(16,14,32,0.72)'; CM.rr(g, 10, top + 32, 112, 24, 12); g.fill(); CM.text(g, 66, top + 44, `身上的失物 ${n} 件`, '#aef0ff', 12, 1, { weight: 800 }); }
  },
};

// ---------- 被抓到 ----------
function zoneCaughtDefault(z, n) {
  const sc = z.sc, c = sc.cat;
  const mine = c.carry.filter(f => f.pot && f.pot.zone === z.id);
  c.carry = c.carry.filter(f => !(f.pot && f.pot.zone === z.id));
  SFX.play('fail'); vibrate([60, 40, 60]);
  const back = z.def.exits.find(e => e.to === 'sewer');
  UI.toast(`被${n.key === 'ranger' ? '管理員' : n.key === 'patrol' ? '巡守隊' : '人'}抓到，丟回下水道了！${mine.length ? '在這裡叼的花被沒收了。' : ''}`, 3600);
  z.Z.heat[z.id] = Math.min(6, (z.Z.heat[z.id] || 0) + 1);
  zoneExit(sc, z, back, true);
}
const ZONE_CAUGHT = {
  market(z, n) {
    SFX.play('fail'); z.pop(z.cx, z.cy - 1.3, '被掃地阿伯趕走了！（−6 秒）', '#ff9a8a');
    z.left = Math.max(0, z.left - 6); z.place(6.5, 13.5); z.snap = true; z.frozen = 0.6;
    n.state = 'route'; n.path = null; n.s = 0; n.alarmed = false;
  },
};
// 時間到
const ZONE_END = {
  market(z) { marketFinish(z.sc, z); },
};

// ---------- 老鼠王 ----------
function kingTalk(z) {
  const K = z.king, Z = z.Z, sc = z.sc;
  if (K.friend) { UI.toast(pick(['老鼠王：「吱。（我的手下不會再搶你的花了）」', '老鼠王：「吱吱！（隔壁巷的洞我們挖好了）」', '老鼠王：「吱……（那隻黑貓，連我們都怕牠）」']), 3200); return; }
  const shiny = (Z.lost || []).filter(id => LOST_ITEMS[id]);
  if (!shiny.length && !(Z.fish > 0)) { UI.toast('老鼠王坐在一堆亮晶晶的東西上：「吱！（帶亮晶晶的東西來，或是一條魚，我就幫你）」', 4200); return; }
  const id = shiny.find(i => i === 'coin') || shiny[0];
  const what = id ? `「${LOST_ITEMS[id].name}」` : '一條小魚';
  sc.mode = 'zonewait';
  UI.confirm('老鼠王', `老鼠王盯著你身上的${what}，口水都流出來了。給牠的話，牠的手下就不會再搶你的花，還會幫你打通往隔壁巷的洞。`, '給牠', '不要', ok => {
    sc.mode = 'zone';
    if (!ok) return;
    if (id) Z.lost.splice(Z.lost.indexOf(id), 1); else Z.fish--;
    Z.kingFriend = 1; K.friend = true;
    SFX.play('heart'); z.pop(K.x, K.y - 1.6, '吱吱吱！（成交）', '#ffd25a');
    UI.toast('老鼠王成了你的朋友：老鼠不再搶花，下水道右邊往隔壁巷的洞打通了！', 4200);
  });
}

// ---------- 進出 ----------
const MANHOLES = [[7.5, 15.5], [7.4, 27.2], [6.6, 40.5]];
function zoneEnter(sc, id, from) {
  const Z = zonesOf(sc.run);
  sc.zones = sc.zones || {};
  let z = sc.zones[id];
  const first = !z;
  if (!z) z = sc.zones[id] = new Zone(sc, id);
  if (first) Z.visits[id] = (Z.visits[id] || 0) + 1;
  sc.zone = z; sc.mode = 'zone'; z.leaving = false;
  const c = sc.cat; c.jump = null; c.box = null; c.pose = null; c.top = false; c.h = 0; Input.release();
  // 從哪裡進來
  let e = null;
  if (from && from.to === 'alley') e = null;
  if (id === 'sewer') e = z.def.exits.find(x => x.to === 'alley' && x.i === (from && from.i !== undefined ? from.i : 0));
  if (from && from.back) e = z.def.exits.find(x => x.id === from.back);
  if (id !== 'sewer' && id !== 'market') e = z.def.exits[0];
  if (e) z.place(e.stand[0] + 0.5, e.stand[1] + 0.5);
  z.snap = true;
  for (const n of z.npcs) if (n.kind === 'guard' && Math.hypot(n.x - z.cx, n.y - z.cy) < 3) { n.x = n.route ? n.route[Math.floor(n.route.length / 2)][0] : n.x; n.y = n.route ? n.route[Math.floor(n.route.length / 2)][1] : n.y; n.path = null; }
  UI.banner(z.def.name);
  SFX.play('door');
  if (first && !sc.tips['z_' + id]) {
    sc.tips['z_' + id] = 1;
    const tip = {
      sewer: Z.visits.sewer === 1 ? '下水道！黑漆漆的，只看得到身邊一點點。每個人孔都通到巷子不同的地方；到處找找看有沒有好東西' : null,
      park: Z.visits.park === 1 ? '公園的花圃很大，可是管理員拿著手電筒在巡邏。黃色光錐被照到太久就會被抓' : null,
      nb: Z.visits.nb === 1 ? '隔壁巷！花藝老師家的山茶花、還有一隻柴犬。小心門口的感應燈' : null,
      market: '清晨市場！一分鐘之內：撿花販不要的花、叼魚攤的魚、跟早餐店阿姨撒嬌。小心掃地阿伯' ,
    }[id];
    if (tip) setTimeout(() => { if (sc.zone === z) UI.toast(tip, 4200); }, 900);
  }
  if (z.heat >= 2 && first && id !== 'market') setTimeout(() => { if (sc.zone === z) UI.toast(`最近太常來${z.def.name}偷花，${id === 'park' ? '管理處' : '大家'}加強巡邏了（走得比較快、看得比較遠）`, 3600); }, 2600);
}
function zoneExit(sc, z, e, kicked) {
  if (!e) return;
  z.leaving = true;
  if (e.to === 'alley') {
    const [mx, my] = MANHOLES[e.i];
    sc.zone = null; sc.mode = 'play';
    const c = sc.cat; c.x = mx * TS; c.y = my * TS; c.top = false; c.h = 0; c.moving = false; c.inv = 1.2; sc.snapCam = true;
    SFX.play('door'); UI.banner('巷子');
    return;
  }
  if (e.to === 'marketPeek') {
    z.leaving = false;
    if (!z.Z.market) { z.Z.market = 1; SFX.play('chime'); UI.toast('排水溝外面是傳統市場，天還沒亮就有人在搬貨了……記住這條路：以後每天收工，可以順路去清晨市場逛一下！', 5200); }
    else UI.toast('市場還沒開……天亮前收工的時候再來', 2600);
    return;
  }
  if (e.to === 'home') { marketFinish(sc, z); return; }
  // 換區域
  zoneEnter(sc, e.to, e);
}
// 清晨市場結束：撿的花直接算進店裡
function marketFinish(sc, z) {
  if (z.done) return; z.done = true; z.leaving = true;
  for (const t of z.haul) sc.deposited.push({ t, fresh: 0.75, owner: 'market' });
  if (z.haul.length) { const book = bookOf(sc.run); for (const t of z.haul) book.flowers[t] = (book.flowers[t] || 0) + 1; }
  sc.zone = null;
  sc.stats.market = z.haul.length;
  UI.toast(z.haul.length ? `從市場帶回 ${z.haul.length} 朵花（有點不新鮮，但還能賣）` : '在市場逛了一圈，空手回家', 2600);
  const f = sc.marketThen; sc.marketThen = null; f && f();
}

// ---------- 接到夜晚場景 ----------
(function () {
  const P = NightScene.prototype;
  const _upd = P.update;
  P.update = function (dt) {
    if (this.mode === 'zone' && this.zone) {
      this.fx.update(dt);
      const z = this.zone;
      if (z.id !== 'market') {
        this.time += dt * MIN_PER_SEC;
        if (this.time >= this.end) { this.zone = null; this.mode = 'play'; this.finish(true); return; }
      }
      z.update(dt);
      UI.nightHud(this);
      return;
    }
    if (this.mode === 'zonewait') { UI.nightHud(this); return; }
    return _upd.call(this, dt);
  };
  const _act = P.onAction;
  P.onAction = function () {
    if (this.mode === 'zone' && this.zone) { this.zone.action(); return; }
    const tg = this.target;
    if (this.mode === 'play' && tg && tg.kind === 'manhole' && !this.cat.jump) { zoneEnter(this, 'sewer', { to: 'alley', i: tg.i }); return; }
    return _act.call(this);
  };
  const _sk = P.onSkill;
  P.onSkill = function (id) { if (this.mode === 'zone') return; return _sk.call(this, id); };
  const _wait = P.onWait;
  P.onWait = function () { if (this.mode === 'zone') return; return _wait.call(this); };
  // 巷子裡的人孔：鑽下水道
  const _ft = P.findTarget;
  P.findTarget = function () {
    _ft.call(this);
    const c = this.cat;
    if (this.mode !== 'play' || !sewerOpen(this.run) || c.top || c.jump || c.home) return;
    if (this.target && this.target.kind !== 'listen') return;
    for (let i = 0; i < MANHOLES.length; i++) {
      const [mx, my] = MANHOLES[i];
      if (dist(c.x, c.y - 2, mx * TS, my * TS) < 12) {
        this.target = { kind: 'manhole', i, ref: { x: mx * TS, y: my * TS - 2 } };
        UI.setAction('鑽下去');
        if (!this.tips.manhole) { this.tips.manhole = 1; UI.toast('人孔蓋！按「鑽下去」進下水道', 2600); }
        return;
      }
    }
  };
  // 畫面：在新區域時整個畫面換成 2D
  const _r3 = P.render3D;
  P.render3D = function () {
    if (this.zone && (this.mode === 'zone' || this.mode === 'zonewait')) { R3.blank(); const g = R3.ovBegin(); if (g) this.zone.render(g, R3.W, R3.H); return; }
    return _r3.call(this);
  };
  const _r2 = P.render;
  P.render = function (ctx) {
    if (this.zone && (this.mode === 'zone' || this.mode === 'zonewait')) { this.zone.render(ctx, View.w, View.h); return; }
    return _r2.call(this, ctx);
  };
  // 收工：如果知道清晨市場，問要不要順路去
  const _fin = P.finish;
  P.finish = function (timeUp) {
    if (this.mode === 'done' || this.mode === 'marketask') return;
    const c = this.cat;
    const lost = timeUp && !c.home && c.carry.length;
    if (!this.marketDone && marketOpen(this.run) && !lost && this.mode !== 'zone') {
      this.marketDone = true; this.mode = 'marketask'; Input.release();
      UI.setAction(null); UI.setSkills([]); UI.setWait(false, false);
      UI.confirm('天快亮了', '要不要順路去清晨市場？（一分鐘：撿花販不要的花、叼魚攤的魚）', '去市場', '回家睡覺', ok => {
        if (ok) { this.marketThen = () => { this.mode = 'play'; _fin.call(this, timeUp); }; zoneEnter(this, 'market'); }
        else { this.mode = 'play'; _fin.call(this, timeUp); }
      });
      return;
    }
    return _fin.call(this, timeUp);
  };
})();
// 3D 巷子裡人孔的提示（亮一圈）
function manholeRender3D(sc, F) {
  if (!sewerOpen(sc.run) || sc.mode !== 'play') return;
  const t = sc.cat.t || 0;
  for (const [x, z] of MANHOLES) glowQuad(F.glow, x, 0.05, z, 0.55 + Math.sin(t * 3) * 0.05, [0.6, 0.85, 1, 0.16]);
}

// ---------- 白天：失物招領 ----------
function* lostFoundScript(S) {
  const run = S.run, Z = zonesOf(run);
  if (!Z.lost || !Z.lost.length) return false;
  const wasOn = S.shopOn; S.shopOn = false;
  const items = Z.lost.slice(); Z.lost = [];
  yield S.say(`花喵昨晚叼回來${items.length > 1 ? '好幾樣' : '一樣'}奇怪的東西……`);
  for (const id of items) {
    const L = LOST_ITEMS[id]; if (!L) continue;
    if (!L.owner) {
      S.run.money += L.sell; SFX.play('coin');
      yield S.say(`「${L.name}」……回收阿伯說這個值錢！賣了 ${money(L.sell)}。`);
      continue;
    }
    const c = askChoice(S, `撿到「${L.name}」`, `${L.desc}\n還給${L.who}（交情 +2、罐罐 +5），還是賣給回收阿伯（${money(L.sell)}）？`, `還給${L.who}`, L.sell ? '賣掉' : '先收著');
    yield c.p;
    if (c.v) {
      addBond(run, L.owner, 2); run.cans += 5; SFX.play('heart');
      run.stats.returned = (run.stats.returned || 0) + 1;
      if (L.owner === 'wang' || L.owner === 'lin' || L.owner === 'bo') heatAdd(run, L.owner, -25);
      yield S.say(`把${L.name}送回去了。${L.who}：${L.back}`);
    } else if (L.sell) { run.money += L.sell; SFX.play('coin'); yield S.say(`賣了 ${money(L.sell)}……希望失主不會太難過。`); }
    else Z.lost.push(id);
  }
  UI.hideDialog(); S.shopOn = wasOn;
  return true;
}
// ---------- 白天：新區域的小故事（解鎖時各一次） ----------
function* zoneStoryScript(S) {
  const run = S.run, Z = zonesOf(run), f = run.flags;
  if ((run.month || 1) >= 3 && !f.zSewerTalk) {
    f.zSewerTalk = 1; S.shopOn = false;
    const b = S.customer('bo'); yield S.walkIn(b);
    yield* S.talk(b, '阿伯', [['美玲啊，巷子裡那幾個人孔蓋……我小時候常常鑽下去玩。'], ['下面四通八達，聽說連到公園、隔壁巷，還有菜市場。'], ['現在住了一隻好大的老鼠，大家都叫牠老鼠王。'], ['那隻花貓這麼會鑽，搞不好也下得去喔。', null]]);
    yield S.walkOut(b);
    UI.toast('老貓攤可以學「下水道探險」了：巷子裡的人孔蓋可以鑽下去', 4200);
    return true;
  }
  if (Z.parkKey && (Z.visits.park || 0) >= 1 && !f.zParkTalk) {
    f.zParkTalk = 1;
    const r = S.customer('shopD'); yield S.walkIn(r);
    yield* S.talk(r, '公園管理員', [['老闆娘，我是公園管理處的。最近半夜一直有人……呃，有貓偷公園的花。'], ['雞蛋花、荷花都被叼走好幾朵。如果看到一隻虎斑貓，麻煩跟我說一聲。'], ['（花喵在櫃台下面縮成一團）', null, 'M']]);
    yield S.walkOut(r);
    return true;
  }
  if (Z.dogFriend && !f.zDogTalk) {
    f.zDogTalk = 1;
    const s = S.customer('shopF'); yield S.walkIn(s);
    yield* S.talk(s, '隔壁巷的阿姨', [['我家阿福最近好奇怪，半夜都不叫了，還一直往你們這邊看。'], ['牠好像交了一個貓朋友……是你們家這隻嗎？'], ['（花喵假裝在睡覺）', null, 'M']]);
    yield S.walkOut(s);
    return true;
  }
  if (f.blackCatSeen >= 2 && !f.zBlackTalk) {
    f.zBlackTalk = 1;
    const l = S.customer('lin'); yield S.walkIn(l);
    yield* S.talk(l, '林先生', [['美玲，最近隔壁巷有一隻黑貓，很兇，小柴每次看到都夾著尾巴。'], ['聽說牠也會叼花……妳家花喵要小心，不要跟牠打架。']]);
    yield S.walkOut(l);
    return true;
  }
  return false;
}
// ---------- 老貓攤：新區域的狀態 ----------
function zoneBriefHTML(run) {
  if (!sewerOpen(run)) return '';
  const Z = zonesOf(run), bits = [];
  bits.push('下水道');
  if (Z.parkKey) bits.push('公園'); if (Z.kingFriend) bits.push('隔壁巷'); if (Z.market) bits.push('清晨市場');
  const lost = Object.keys(LOST_ITEMS).filter(k => Z.lostSeen[k]).length;
  return `<p class="hint">新區域：${bits.join('、')}${Z.fish ? `｜身上的小魚 ${Z.fish} 條` : ''}｜失物 ${lost}/${Object.keys(LOST_ITEMS).length}</p>`;
}
// ---------- 圖鑑：新區域 ----------
function zoneBookHTML(run) {
  if (!sewerOpen(run) && !(run.zones && run.zones.visits && run.zones.visits.sewer)) return '<h3>新區域</h3><p class="hint">第三個月，老貓攤可以學「下水道探險」。</p>';
  const Z = zonesOf(run), V = Z.visits || {};
  const places = [['sewer', '下水道', true], ['park', '公園', Z.parkKey], ['nb', '隔壁巷', Z.kingFriend], ['market', '清晨市場', Z.market]];
  const pl = places.map(([id, name, ok]) => `<li class="${V[id] ? 'got' : ''}"><b>${ok || V[id] ? name : '？？？'}</b><span class="px">${V[id] ? '×' + V[id] : ok ? '還沒去' : ''}</span></li>`).join('');
  const lost = Object.keys(LOST_ITEMS).map(k => `<li class="${Z.lostSeen[k] ? 'got' : ''}"><b>${Z.lostSeen[k] ? LOST_ITEMS[k].name : '？？？'}</b><span>${Z.lostSeen[k] ? (LOST_ITEMS[k].who || '回收阿伯') : ''}</span></li>`).join('');
  const fr = [['老鼠王', Z.kingFriend], ['柴犬阿福', Z.dogFriend]].map(([n, ok]) => `<li class="${ok ? 'got' : ''}"><b>${ok ? n : '？？？'}</b><span>${ok ? '朋友' : ''}</span></li>`).join('');
  return `<h3>新區域　${places.filter(p => V[p[0]]).length}/4</h3><ul class="ev-list">${pl}</ul>
    <h3>下水道的失物　${Object.keys(Z.lostSeen).length}/${Object.keys(LOST_ITEMS).length}</h3><ul class="ev-list">${lost}</ul>
    <h3>新朋友</h3><ul class="ev-list">${fr}</ul>${Z.fish ? `<p class="hint">身上的小魚：${Z.fish} 條（給柴犬、老鼠王）</p>` : ''}`;
}
// 每晚結束：新區域的戒備慢慢降下來
(function () {
  const _nd = Flow.nightDone;
  Flow.nightDone = function (res) {
    const Z = zonesOf(G.run);
    for (const k in Z.heat) Z.heat[k] = Math.max(0, Z.heat[k] - 0.6);
    return _nd.call(this, res);
  };
})();
