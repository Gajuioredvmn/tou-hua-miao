// ================= 本事進階：熟練度、進階分支、組合技、傳說技能 =================
// 每一樣都要真的有用：全部都會改變晚上的玩法（數字、按鈕、規則），不是只有好看。
//   熟練度：技能用越多次越熟（Lv1–5），每一級都有加成，Lv3、Lv5 有額外效果
//   進階分支：技能學滿以後，二選一走一條進階路線（花罐罐；之後可以花一點罐罐換路線），花喵身上的配件也跟著變
//   組合技：兩個指定的技能都學滿，自動學會一招新的
//   傳說技能：罐罐買不到，要靠劇情和成就（白貓、煤炭、老鼠王、滿月、新品種、口碑）
// ---------- 熟練度 ----------
const MASTERY = [
  { id: 'box', name: '紙箱', need: r => r.night >= 3 || (r.month || 1) > 1, stat: 'boxes', th: [3, 10, 25, 45, 80], per: '紙箱多撐 2 秒', l3: '每晚多一個紙箱', l5: '紙箱慢慢挪，連近一點的人也看不出來' },
  { id: 'mouth', name: '叼花', need: r => true, stat: 'stolen', th: [25, 80, 180, 350, 600], per: '叼花的聲音小 15%', l3: '叼花時花況不會掉', l5: '叼花完全沒有聲音' },
  { id: 'cute', name: '賣萌', need: r => true, stat: 'cuteWin', th: [5, 15, 35, 70, 120], per: '賣萌成功率 +2%', l3: '連擊多給 1 罐', l5: '失敗一次還可以再賣一次（每晚一次）' },
  { id: 'call', name: '喵喵廣播', need: r => r.upg.call, stat: 'calls', th: [5, 15, 35, 60, 100], per: '叫聲傳得遠 8%', l3: '每晚多喵 1 次', l5: '每晚再多喵 1 次' },
  { id: 'roofway', name: '屋頂走廊', need: r => r.upg.roofway, stat: 'bridges', th: [8, 25, 50, 90, 150], per: '過橋快 6%', l3: '過橋時鴿子不會飛', l5: '過橋時完全看不到你' },
  { id: 'tunnel', name: '貓道', need: r => r.upg.tunnel, stat: 'tunnels', th: [4, 12, 25, 45, 80], per: '鑽出來後安全 0.3 秒', l3: '鑽貓道時大家會跟丟你（懷疑歸零）', l5: '鑽完一陣子跑步沒有聲音' },
  { id: 'ear', name: '偷聽', need: r => r.upg.ear, stat: 'listens', th: [3, 10, 22, 40, 70], per: '偷聽快 8%', l3: '偷聽多給 2 罐', l5: '一定聽得到情報' },
  { id: 'parkour', name: '跑酷', need: r => r.upg.parkour, stat: 'pk3', th: [3, 10, 25, 50, 90], per: '連跳的時間寬 0.1 秒', l3: '三連以上罐罐 ×2', l5: '連跳中大家看不清楚你（被發現慢一半）' },
  { id: 'shadow', name: '影子步', need: r => r.upg.shadow, stat: 'shadowSec', th: [30, 100, 240, 480, 900], per: '融進影子快 8%', l3: '影子裡被看到慢更多', l5: '在影子裡也可以慢慢走' },
];
function masteryLv(run, m) { const v = (run.stats && run.stats[m.stat]) || 0; let lv = 0; for (const t of m.th) if (v >= t) lv++; return lv; }
function mLv(run, id) { const m = MASTERY.find(x => x.id === id); return m ? masteryLv(run, m) : 0; }

// ---------- 進階分支 ----------
const BRANCHES = {
  mouth: { name: '大嘴巴', A: { name: '花束叼法', desc: '一次多叼 1 朵花', look: '背包變成粉紅花束包' }, B: { name: '保鮮叼', desc: '嘴上的花永遠新鮮，跑步也不掉花瓣，帶回家多賣一成', look: '背包變成藍色保冷袋' } },
  paws: { name: '肉球消音', A: { name: '無聲奔跑', desc: '奔跑也完全沒有腳步聲', look: '襪子變成深紫色忍者襪' }, B: { name: '重拳貓', desc: '撥倒東西的聲音傳得遠 60%，撥倒的東西 40 秒後還能再撥', look: '襪子變成紅色拳擊手套' } },
  catwalk: { name: '貓步', A: { name: '躡手躡腳', desc: '走路時被發現再慢 25%', look: '眼罩換成紫色銀邊' }, B: { name: '疾行', desc: '走路快 30%（不會有聲音）', look: '眼罩換成橘色閃電邊' } },
  cute: { name: '萌力', A: { name: '萌殺', desc: '賣萌成功率 +10%', look: '眼睛變成粉紅愛心光' }, B: { name: '討賞', desc: '賣萌成功拿到的罐罐 ×2', look: '眼睛變成金色招財光' } },
  call: { name: '喵喵廣播', A: { name: '回音', desc: '每一聲都會在反方向多出一個回音，兩邊的人都被引開', look: '喇叭變成金色雙喇叭' }, B: { name: '大聲公', desc: '每晚多喵 3 次', look: '喇叭變成紅色大聲公' } },
  shadow: { name: '影子步', A: { name: '暗影', desc: '融進影子快一倍', look: '披風變成全黑' }, B: { name: '殘影', desc: '離開影子後 1.5 秒內，大家還是看不清楚你', look: '披風變成半透明紫色' } },
};
const BRANCH_COST = 60, BRANCH_SWAP = 30;
function branchOf(run, id) { return (run.branch || {})[id] || null; }
function hasBr(run, id, k) { return branchOf(run, id) === k; }
function canBranch(run, id) { const u = UPGRADES.find(x => x.id === id); return u && (run.upg[id] || 0) >= u.max; }
function setBranch(run, id, k) {
  const B = run.branch || (run.branch = {}), cur = B[id];
  if (!canBranch(run, id) || cur === k) return false;
  const cost = cur ? BRANCH_SWAP : BRANCH_COST;
  if (run.cans < cost) return false;
  run.cans -= cost; B[id] = k; return true;
}
// 配件跟著換
{
  const _cg = catGearFor;
  catGearFor = function (run) {
    const g = _cg(run); if (!g || !run || !run.branch) return g;
    const B = run.branch;
    if (B.mouth && g.bag) g.bag = B.mouth === 'A' ? 4 : 5;
    if (B.paws && !(run.upg.sewer)) g.socks = B.paws === 'A' ? 5 : 6;
    if (B.catwalk && g.mask) g.mask = B.catwalk === 'A' ? 3 : 4;
    if (B.cute) g.glow = B.cute === 'A' ? 3 : 4;
    if (B.call && g.horn) g.horn = B.call === 'A' ? 3 : 4;
    if (B.shadow && g.cape && !g.capeO) g.cape = B.shadow === 'A' ? 4 : 5;
    return g;
  };
  GEARC.bag[4] = { c: '#ff9fcb', d: '#d86a9a', rib: '#ffffff' };
  GEARC.bag[5] = { c: '#9fd8ff', d: '#5aa0d0', rib: '#ffffff' };
  GEARC.sock[5] = { c: '#3a2a5a', d: '#2a1e44', toe: '#8a7ab8' };
  GEARC.sock[6] = { c: '#e8394d', d: '#b8243a', toe: '#ffffff' };
  GEARC.mask[3] = { c: '#3a1a5a', trim: '#d8d8f0' };
  GEARC.mask[4] = { c: '#1d1526', trim: '#ff8a2a' };
  GEARC.glow[3] = { eye: '#ff8fc8', eyeD: '#e85a9a' };
  GEARC.glow[4] = { eye: '#ffd84d', eyeD: '#e8a820' };
  GEARC.horn[3] = { c: '#ffd84d', d: '#c99a1a', band: '#ffffff' };
  GEARC.horn[4] = { c: '#e8394d', d: '#a82430', band: '#ffffff' };
  const _cc = capeC, _cd = capeD;
  capeC = function (g) { if (g && !g.capeO && g.cape === 4) return '#16141c'; if (g && !g.capeO && g.cape === 5) return '#8a6ad0'; return _cc(g); };
  capeD = function (g) { if (g && !g.capeO && g.cape === 4) return '#0a080e'; if (g && !g.capeO && g.cape === 5) return '#5a4a9a'; return _cd(g); };
}

// ---------- 組合技 ----------
const COMBOS = [
  { id: 'invis', name: '隱身術', a: 'shadow', b: 'catwalk', desc: '燈下也融得進影子，而且只要站 0.5 秒' },
  { id: 'wall', name: '飛簷走壁', a: 'parkour', b: 'roofway', desc: '過屋頂橋快一倍、爬上爬下更快，跳起來的時候沒人看得到' },
  { id: 'ventri', name: '腹語術', a: 'call', b: 'ear', desc: '每喵一聲，附近所有人的懷疑都降低一截' },
  { id: 'thief', name: '神偷之手', a: 'mouth', b: 'gentle', desc: '叼花完全沒有聲音，花況也不會掉' },
  { id: 'charm', name: '萌翻全場', a: 'cute', b: 'lucky', desc: '賣萌成功，那一家的警戒會降，還多給 2 罐' },
  { id: 'nightking', name: '夜行俠', a: 'nightvis', b: 'owl', desc: '每晚多 20 分鐘，停電的晚上也看得一清二楚（被發現慢 20%）' },
];
function maxed(run, id) { const u = UPGRADES.find(x => x.id === id); return !!u && (run.upg[id] || 0) >= u.max; }
function hasCombo(run, id) { const c = COMBOS.find(x => x.id === id); return !!c && maxed(run, c.a) && maxed(run, c.b); }

// ---------- 傳說技能 ----------
const LEGENDS = [
  { id: 'whiteBless', name: '白貓的祝福', how: '摸到神秘白貓 3 次', ok: r => (r.stats.whiteCat || 0) >= 3, desc: '每晚一次：被發現的瞬間，白貓的光會讓大家眨個眼，你直接溜走（不用賣萌）' },
  { id: 'shadowRaid', name: '黑影突襲', how: '屋頂決戰打贏煤炭', ok: r => !!(r.rival && r.rival.friend), desc: '每晚兩次：「突襲」按鈕，3 秒內隱形又跑得飛快' },
  { id: 'ratPost', name: '鼠道快遞', how: '跟老鼠王做朋友', ok: r => !!(r.zones && r.zones.kingFriend), desc: '在巷子的人孔蓋旁按「交給老鼠」，嘴上的花直接送回店裡（每晚兩次）' },
  { id: 'moonStep', name: '月光步', how: '遇過 2 次滿月的晚上', ok: r => ((r.rareSeen || {}).fullmoon || 0) >= 2, desc: '過了午夜，月光讓你的影子變淡：被發現慢 20%' },
  { id: 'florabless', name: '花神的眷顧', how: '配出 6 個新品種', ok: r => Object.keys((r.breed || {}).found || {}).length >= 6, desc: '頂樓花園每次收成多一朵，新品種的權利金 ×1.5' },
  { id: 'legendName', name: '巷子傳說', how: '口碑升到 Lv.8', ok: r => r.rep && repLv(r) >= 8, desc: '大家都捨不得生你的氣：每晚鄰居的警戒多降一點' },
];
function hasLegend(run, id) { const L = LEGENDS.find(x => x.id === id); return !!L && L.ok(run); }

// ================= 套到晚上 =================
function skillInitNight(sc) {
  const run = sc.run, c = sc.cat;
  // 熟練度
  const box = mLv(run, 'box'); sc.boxMax = 15 + 2 * box; if (box >= 3 && sc.boxes) sc.boxes += 1;
  const mo = mLv(run, 'mouth'); sc.pickNoise = mo >= 5 || hasCombo(run, 'thief') ? 0 : 1 - 0.15 * mo;
  const ca = mLv(run, 'call'); sc.callMul = 1 + 0.08 * ca; if (run.upg.call) { sc.calls += (ca >= 3 ? 1 : 0) + (ca >= 5 ? 1 : 0) + (hasBr(run, 'call', 'B') ? 3 : 0); }
  const ea = mLv(run, 'ear'); sc.listenMul = 1 - 0.08 * ea; sc.intelP = ea >= 5 ? 1 : 0.6;
  const pk = mLv(run, 'parkour'); sc.pkBonus = 0.1 * pk;
  const sh = mLv(run, 'shadow'); sc.shadowMul = (1 - 0.08 * sh) * (hasBr(run, 'shadow', 'A') ? 0.5 : 1); if (hasCombo(run, 'invis')) { sc.shadowAny = true; sc.shadowMul = Math.min(sc.shadowMul, 0.5 / 1.6); }
  // 分支
  c.walkMul = hasBr(run, 'catwalk', 'B') ? 1.3 : 1;
  if (hasCombo(run, 'nightking')) sc.end += 20;
  sc.legend = { bless: hasLegend(run, 'whiteBless') ? 1 : 0, raid: hasLegend(run, 'shadowRaid') ? 2 : 0, post: hasLegend(run, 'ratPost') ? 2 : 0 };
  sc.cuteRetry = mLv(run, 'cute') >= 5 ? 1 : 0;
  sc.lingerT = 0;
}
(function () {
  const P = NightScene.prototype;
  const _u = P.update;
  P.update = function (dt) {
    if (!this.skillInit) { this.skillInit = true; try { skillInitNight(this); } catch (e) { console.error(e); } }
    const r = _u.call(this, dt);
    if (this.mode === 'play') {
      const c = this.cat, run = this.run;
      if (c.shadow) this.stats.shadowSec = (this.stats.shadowSec || 0) + dt;
      // 殘影：離開影子後一小段時間還看不清楚
      if (hasBr(run, 'shadow', 'B')) { if (c.shadow) this.lingerT = 1.5; else if (this.lingerT > 0) this.lingerT -= dt; }
      // 保鮮叼／神偷之手／叼花熟練 Lv3：花況不會掉
      if (hasBr(run, 'mouth', 'B') || hasCombo(run, 'thief') || mLv(run, 'mouth') >= 3) for (const f of c.carry) f.fresh = Math.max(f.fresh, f.keepFresh || f.fresh), f.keepFresh = f.fresh;
      // 黑影突襲
      if (this.dashT > 0) { this.dashT -= dt; c.inv = Math.max(c.inv, 0.1); if (this.dashT <= 0) { c.dashMul = 1; this.fx.text(c.x, c.y - 14, '……', '#8a80b8'); } }
      // 重拳貓：撥倒的東西會再立起來
      if (hasBr(run, 'paws', 'B')) for (const o of this.objs) if (o.knock && o.used) { o.usedT = (o.usedT || 0) + dt; if (o.usedT > 40) { o.used = false; o.usedT = 0; } }
    }
    return r;
  };
  // 一次多叼
  const _cap = P.capacity;
  P.capacity = function () { return _cap.call(this) + (hasBr(this.run, 'mouth', 'A') ? 1 : 0); };
  // 賣萌成功率
  const _cc = P.cuteChance;
  P.cuteChance = function (key, move) {
    const run = this.run;
    return clamp(_cc.call(this, key, move) + 0.02 * mLv(run, 'cute') + (hasBr(run, 'cute', 'A') ? 0.1 : 0), 0.05, 0.97);
  };
  // 賣萌的結果：討賞、萌翻全場、熟練 Lv3、Lv5 再一次
  const _uc = P.updateCute;
  P.updateCute = function (dt) {
    const cu = this.cute, before = cu && cu.shown;
    _uc.call(this, dt);
    if (cu && !before && cu.shown) {
      const run = this.run, g = this.cutin, rew = g && g.reward;
      if (cu.ok) {
        let extra = 0;
        if (rew && hasBr(run, 'cute', 'B')) extra += rew.cans;
        if (mLv(run, 'cute') >= 3) extra += 1;
        if (hasCombo(run, 'charm')) { extra += 2; const ow = ownerOfViewer(cu.v); if (ow && HEAT_OWNERS.includes(ow)) heatAdd(run, ow, -8); }
        if (extra) { run.cans += extra; this.stats.cuteCans = (this.stats.cuteCans || 0) + extra; if (rew) rew.cans += extra; }
      } else if (this.cuteRetry > 0 && g && !g.assistUsed) {
        this.cuteRetry--; cu.retryOK = true;
      }
    }
  };
  const _ec = P.endCute;
  P.endCute = function () {
    const cu = this.cute;
    if (cu && cu.retryOK && !cu.ok) {
      // 熟練 Lv5：再賣一次
      cu.retryOK = false; this.cutin = null; Input.game = null;
      cu.phase = 'choose'; cu.shown = false; cu.ok = null; cu.t = 0;
      UI.toast('賣萌熟練：再試一次！', 1800);
      if (UI.cuteChoose) UI.cuteChoose(this); else { this.resolveCute(cu.move === 'gift' ? 'belly' : cu.move); }
      return;
    }
    return _ec.call(this);
  };
  // 白貓的祝福：被發現的瞬間溜走
  const _sc = P.startCute;
  P.startCute = function (v) {
    if (this.legend && this.legend.bless > 0) {
      this.legend.bless--;
      for (const w of this.viewers) if (w) w.susp = 0;
      this.cat.inv = 2.5; Input.release();
      this.fx.hearts(this.cat.x, this.cat.y - 12, 6); SFX.play('chime');
      UI.toast('白貓的祝福！一道白光閃過，大家揉揉眼睛，你已經溜走了（今晚用掉了）', 3200);
      return;
    }
    return _sc.call(this, v);
  };
  // 聲音：喵喵廣播的距離、回音、腹語術；重拳貓
  const _no = P.noise;
  P.noise = function (x, y, r, src) {
    const run = this.run;
    if (src === 'obj') {
      const calling = this._callUntil && performance.now() < this._callUntil;
      if (calling) {
        r *= this.callMul || 1;
        if (hasCombo(run, 'ventri')) for (const w of this.viewers) if (w && w.susp) w.susp = Math.max(0, w.susp - 0.35);
        if (hasBr(run, 'call', 'A') && !this._echo) {
          this._echo = true; const c = this.cat, ex = c.x - (x - c.x), ey = c.y - (y - c.y);
          setTimeout(() => { if (this.mode === 'play' && !this.map.solidPx(ex, ey)) { _no.call(this, ex, ey, r * 0.85, 'obj'); this.fx.text(ex, ey - 10, '喵～（回音）', '#ffd25a', 1.4); } this._echo = false; }, 420);
        }
      } else if (hasBr(run, 'paws', 'B')) r *= 1.6;
    }
    return _no.call(this, x, y, r, src);
  };
  const _dc = P.doCall;
  P.doCall = function () { this._callUntil = performance.now() + 900; return _dc.call(this); };
  // 腳步聲：無聲奔跑、貓道熟練 Lv5
  const _cn = P.catNoise;
  P.catNoise = function (dt) {
    const c = this.cat, quiet = hasBr(this.run, 'paws', 'A') || (this.quietT > 0);
    if (this.quietT > 0) this.quietT -= dt;
    if (!quiet) return _cn.call(this, dt);
    const was = c.running; c.running = false; try { return _cn.call(this, dt); } finally { c.running = was; }
  };
  // 屋頂橋
  const _cb = P.crossBridge;
  P.crossBridge = function (tg) {
    const r = _cb.call(this, tg), c = this.cat, run = this.run, lv = mLv(run, 'roofway');
    if (c.jump) { c.jump.dur *= (1 - 0.06 * lv) * (hasCombo(run, 'wall') ? 0.5 : 1); if (lv >= 5 || hasCombo(run, 'wall')) c.inv = Math.max(c.inv, c.jump.dur + 0.2); if (lv >= 3) this.noPigeonT = c.jump.dur + 0.5; }
    return r;
  };
  if (P.updatePigeons) { const _up = P.updatePigeons; P.updatePigeons = function (dt) { if (this.noPigeonT > 0) { this.noPigeonT -= dt; return; } return _up.call(this, dt); }; }
  // 貓道
  const _ut = P.useTunnel;
  P.useTunnel = function (i) {
    const r = _ut.call(this, i), lv = mLv(this.run, 'tunnel');
    this.cat.inv = Math.max(this.cat.inv, 0.3 * lv);
    if (lv >= 3) for (const w of this.viewers) if (w) w.susp = 0;
    if (lv >= 5) this.quietT = 4;
    return r;
  };
  // 跳起來（爬、跳）：飛簷走壁
  const _oa = P.onAction;
  P.onAction = function () {
    const tg = this.target, c = this.cat;
    if (this.mode === 'play' && tg && tg.kind === 'ratpost') { ratPost(this); return; }
    const r = _oa.call(this);
    if (this.mode === 'play' && c.jump && hasCombo(this.run, 'wall') && tg && (tg.kind === 'climb' || tg.kind === 'drop' || tg.kind === 'jump')) { c.jump.dur *= 0.7; c.inv = Math.max(c.inv, c.jump.dur); }
    return r;
  };
  // 突襲按鈕
  const _csb = P.catSkillButtons;
  P.catSkillButtons = function (sk) {
    _csb.call(this, sk);
    if (this.mode === 'play' && this.legend && hasLegend(this.run, 'shadowRaid')) sk.push({ id: 'raidDash', label: '突襲', n: this.legend.raid, on: this.dashT > 0, off: this.legend.raid <= 0 });
  };
  const _os = P.onSkill;
  P.onSkill = function (id) {
    if (id === 'raidDash' && this.mode === 'play' && this.legend) {
      if (this.legend.raid <= 0 || this.dashT > 0) { SFX.play('nope'); return; }
      this.legend.raid--; this.dashT = 3; this.cat.dashMul = 1.9; this.cat.box = null;
      SFX.play('jump'); this.fx.text(this.cat.x, this.cat.y - 16, '黑影突襲！', '#c8f0d0');
      return;
    }
    if (id === 'box' && this.mode === 'play' && !this.cat.box && this.boxes > 0) this.stats.boxes = (this.stats.boxes || 0) + 1;
    return _os.call(this, id);
  };
  // 鼠道快遞：人孔蓋旁邊
  const _ft = P.findTarget;
  P.findTarget = function () {
    _ft.call(this);
    const c = this.cat;
    if (this.mode !== 'play' || !this.legend || this.legend.post <= 0 || !c.carry.length || c.top || c.jump) return;
    if (this.target && this.target.kind !== 'manhole' && this.target.kind !== 'listen') return;
    for (let i = 0; i < MANHOLES.length; i++) {
      const [mx, my] = MANHOLES[i];
      if (dist(c.x, c.y - 2, mx * TS, my * TS) < 12) { this.target = { kind: 'ratpost', i, ref: { x: mx * TS, y: my * TS - 2 } }; UI.setAction('交給老鼠'); return; }
    }
  };
})();
function ratPost(sc) {
  if (!sc.legend || sc.legend.post <= 0) return;
  sc.legend.post--;
  SFX.tone(1200, 0.08, { to: 1500, vol: 0.05, type: 'square' });
  sc.fx.text(sc.cat.x, sc.cat.y - 16, '吱吱！（老鼠扛走了）', '#c8b8ff');
  sc.depositAll();
  UI.toast(`老鼠們從下水道把花送回店裡了！（今晚還能用 ${sc.legend.post} 次）`, 2800);
}
// 被發現的速度：分支、組合技、傳說、熟練
{
  const _dm = detectMulPlus;
  detectMulPlus = function (sc, lit) {
    let k = _dm(sc, lit);
    const c = sc.cat, run = sc.run;
    if (c.moving && !c.running && hasBr(run, 'catwalk', 'A')) k *= 0.75;
    if (sc.lingerT > 0 && !c.shadow) k *= lit ? 0.45 : 0.15;
    if (c.shadow && mLv(run, 'shadow') >= 3) k *= 0.7;
    if (sc.pk && sc.pk.n >= 2 && sc.pkSilent && sc.pkSilent() && mLv(run, 'parkour') >= 5) k *= 0.5;
    if (hasCombo(run, 'nightking')) k *= 0.8;
    if (hasLegend(run, 'moonStep') && sc.time >= 24 * 60) k *= 0.8;
    return k;
  };
}
// 影子步熟練 Lv5：在影子裡慢慢走也不會出影子
{
  const P = NightScene.prototype, _us = P.updateNewSkills;
  P.updateNewSkills = function (dt) {
    const c = this.cat, keep = mLv(this.run, 'shadow') >= 5 && c.shadow && c.moving && !c.running;
    const was = c.moving;
    if (keep) c.moving = false;
    try { return _us.call(this, dt); } finally { c.moving = was; }
  };
}
// 跑酷熟練 Lv3：三連以上罐罐 ×2
{
  const P = NightScene.prototype, _us = P.updateNewSkills;
  P.updateNewSkills = function (dt) {
    const before = this.run.cans, pk = this.pk ? this.pk.n : 0;
    const r = _us.call(this, dt);
    if (this.run.cans > before && this.pk && this.pk.n >= 3 && this.pk.n !== pk && mLv(this.run, 'parkour') >= 3) this.run.cans += this.run.cans - before;
    // 偷聽熟練 Lv3：多 2 罐
    return r;
  };
  const _fl = P.finishListen;
  P.finishListen = function () { const r = _fl.call(this); if (mLv(this.run, 'ear') >= 3) this.run.cans += 2; return r; };
}
// 保鮮叼：帶回家多賣一成
{
  const _fv = flowerValue;
  flowerValue = function (run, t, fresh) { return _fv(run, t, fresh) * (run && hasBr(run, 'mouth', 'B') ? 1.1 : 1); };
}
// 花神的眷顧
{
  const _gy = gardenYield;
  gardenYield = function (run) { return _gy(run) + (hasLegend(run, 'florabless') ? 1 : 0); };
  const _ro = royaltyOf;
  royaltyOf = function (run) { return Math.round(_ro(run) * (hasLegend(run, 'florabless') ? 1.5 : 1)); };
}
// 每晚結束：熟練度的統計、巷子傳說、升級提示
{
  const _acc = accumNightStats;
  accumNightStats = function (run, st) {
    const before = MASTERY.map(m => masteryLv(run, m));
    _acc(run, st);
    const S = run.stats;
    for (const k of ['boxes', 'shadowSec', 'pk3']) S[k] = (S[k] || 0) + (st[k] || 0);
    S.listens = S.listens || 0;
    const ups = MASTERY.filter((m, i) => masteryLv(run, m) > before[i]);
    if (ups.length) setTimeout(() => UI.toast('熟練度提升：' + ups.map(m => `${m.name} Lv.${masteryLv(run, m)}`).join('、'), 3600), 2400);
    if (hasLegend(run, 'legendName')) for (const o of HEAT_OWNERS) heatAdd(run, o, -6);
  };
}
// ================= 老貓攤：本事進階 =================
function skillTreeHTML(run) {
  const mast = MASTERY.filter(m => m.need(run)).map(m => {
    const lv = masteryLv(run, m), v = (run.stats && run.stats[m.stat]) || 0, nx = m.th[lv];
    const k = nx ? (v - (m.th[lv - 1] || 0)) / (nx - (m.th[lv - 1] || 0)) : 1;
    return `<li><div class="ms-top"><b>${m.name}</b><span class="px">Lv.${lv}</span></div><div class="ms-bar"><i style="width:${Math.round(clamp(k, 0, 1) * 100)}%"></i></div>
      <small>每級：${m.per}${lv >= 3 ? '' : `・Lv3：${m.l3}`}${lv >= 5 ? '・已練滿' : `・Lv5：${m.l5}`}${lv >= 3 ? `<br>已學會：${m.l3}${lv >= 5 ? '、' + m.l5 : ''}` : ''}</small></li>`;
  }).join('');
  const br = Object.keys(BRANCHES).map(id => {
    const B = BRANCHES[id], cur = branchOf(run, id), ok = canBranch(run, id);
    const opt = k => `<button type="button" class="br-b ${cur === k ? 'on' : ''}" data-br="${id}:${k}" ${!ok || cur === k || run.cans < (cur ? BRANCH_SWAP : BRANCH_COST) ? 'disabled' : ''}><b>${B[k].name}</b><span>${B[k].desc}</span><em>${B[k].look}</em><i>${cur === k ? '使用中' : `<img src="${G.icons.can}" alt="">${cur ? BRANCH_SWAP : BRANCH_COST}`}</i></button>`;
    return `<li class="${ok ? '' : 'locked'}"><div class="br-h"><b>${B.name}</b><span>${ok ? (cur ? '可以換路線' : '學滿了！選一條進階路線') : '學滿後解鎖'}</span></div><div class="br-opts">${opt('A')}${opt('B')}</div></li>`;
  }).join('');
  const nm = id => (UPGRADES.find(u => u.id === id) || {}).name || id;
  const co = COMBOS.map(c => { const on = hasCombo(run, c.id); return `<li class="${on ? 'got' : ''}"><b>${on ? '✦ ' : ''}${c.name}</b><span>${nm(c.a)}＋${nm(c.b)} 學滿${on ? '' : `（${maxed(run, c.a) ? '✔' : '✕'}${maxed(run, c.b) ? '✔' : '✕'}）`}</span><p>${c.desc}</p></li>`; }).join('');
  const lg = LEGENDS.map(L => { const on = L.ok(run); return `<li class="${on ? 'got' : ''}"><b>${on ? '★ ' + L.name : '？？？'}</b><span>${on ? '已經會了' : '條件：' + L.how}</span><p>${on ? L.desc : '罐罐買不到，要靠劇情和挑戰'}</p></li>`; }).join('');
  return `<details class="stree" open><summary>本事進階：熟練度・進階路線・組合技・傳說</summary>
    <h4>熟練度<small>用越多次越熟練</small></h4><ul class="ms-list">${mast}</ul>
    <h4>進階路線<small>技能學滿，二選一（${BRANCH_COST} 罐，換路線 ${BRANCH_SWAP} 罐）</small></h4><ul class="br-list">${br}</ul>
    <h4>組合技<small>兩個技能都學滿就會</small></h4><ul class="co-list">${co}</ul>
    <h4>傳說技能<small>${LEGENDS.filter(L => L.ok(run)).length}/${LEGENDS.length}</small></h4><ul class="co-list legend">${lg}</ul></details>`;
}
function bindSkillTree(card, run, keep) {
  card.querySelectorAll('[data-br]').forEach(b => b.addEventListener('click', () => {
    const [id, k] = b.dataset.br.split(':');
    if (setBranch(run, id, k)) { SFX.play('buy'); UI.toast(`${BRANCHES[id].name}：走「${BRANCHES[id][k].name}」路線！${BRANCHES[id][k].look}`, 3200); checkAchievements(run); }
    else SFX.play('nope');
    keep();
  }));
}
