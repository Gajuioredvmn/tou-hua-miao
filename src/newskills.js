// ================= 新本事：影子步、偷聽、跑酷連跳 =================
// 影子步：在暗處停住不動一下，就會融進影子裡（半透明），走過去的人幾乎看不到；第二級在亮處也有效。
// 偷聽：躲在有人在的窗戶下面按「聽」，聽到鄰居的秘密：情報、喜好、八卦（交情 +1）。
// 跑酷連跳：爬、跳、過橋一個接一個（1.4 秒內）就是連跳；連跳時腳步沒有聲音、跳得更快，三連以上有罐罐。
const LISTEN_WINDOWS = (() => {
  const out = [];
  for (let y = 0; y < NIGHT_MAP.length; y++) for (let x = 0; x < NIGHT_MAP[y].length; x++) if (NIGHT_MAP[y][x] === 'W') {
    const owner = y < 15 ? 'lin' : y < 26 ? 'wang' : 'bo';
    out.push({ x, y, owner, px: (x + 0.5) * TS, py: (y + 1.45) * TS });
  }
  return out;
})();
const LISTEN_LINES = {
  wang: ['「……我跟你說，林先生最近好像在偷養貓喔。」', '「那隻虎斑貓好可愛，下次要準備罐罐給牠。」', '「我先生以前最喜歡在院子泡茶……」'],
  lin: ['「小柴，明天帶你去公園好不好？」', '「其實……貓也沒那麼可怕啦。」', '「隔壁王太太的玫瑰開得真好。」'],
  bo: ['「阿虎啊……你在那邊過得好嗎？」', '「曇花快開了，要記得半夜起來看。」', '「年輕的時候，我也偷過人家的花喔……」'],
};
const LISTEN_INTEL = { wang: ['wangCute', 'wangTV', 'wangRose'], lin: ['linDog', 'linWalk', 'linNose'], bo: ['boRub', 'boTea', 'boTanhua'] };
NightScene.prototype.initNewSkills = function () {
  this.shadowT = 0; this.listened = {}; this.listening = null; this.pk = { n: 0, t: 9 }; this.wasJump = false;
};
NightScene.prototype.listenTarget = function (cx, cy) {
  if (!this.run.upg.ear || this.cat.top || this.cat.box) return null;
  for (const w of LISTEN_WINDOWS) {
    if (this.listened[w.x + ',' + w.y]) continue;
    const d = dist(cx, cy, w.px, w.py);
    if (d < 13) return { kind: 'listen', w, d, ref: { x: w.px, y: w.py - 4 } };
  }
  return null;
};
NightScene.prototype.startListen = function (w) {
  const c = this.cat;
  this.listening = { w, t: 0 }; c.pose = 'loaf'; c.moving = false;
  this.fx.text(c.x, c.y - 16, '（豎起耳朵……）', '#e8e0ff');
  SFX.tone(520, 0.08, { vol: 0.05, type: 'sine' });
};
NightScene.prototype.finishListen = function () {
  const L = this.listening; this.listening = null;
  const c = this.cat, run = this.run, w = L.w;
  this.listened[w.x + ',' + w.y] = 1; c.pose = null;
  run.stats.listens = (run.stats.listens || 0) + 1;
  const unknown = (LISTEN_INTEL[w.owner] || []).filter(k => INTEL[k] && !run.intel[k]);
  let msg;
  if (unknown.length && Math.random() < 0.6) {
    const k = pick(unknown); run.intel[k] = run.nightIdx || 1;
    msg = `偷聽到情報：${INTEL[k]}`;
  } else {
    addBond(run, w.owner, 1); run.cans += 3; this.stats.cuteCans = (this.stats.cuteCans || 0);
    msg = `${pick(LISTEN_LINES[w.owner])}（交情 +1、罐罐 +3）`;
  }
  SFX.play('chime');
  UI.toast(msg, 3600);
};
NightScene.prototype.updateNewSkills = function (dt) {
  const c = this.cat, up = this.run.upg;
  // 影子步
  if (up.shadow) {
    const still = !c.moving && !c.running && !c.jump && !c.box && !c.home;
    const lit = this.litAt(c.x, c.y);
    if (still && (!lit || up.shadow >= 2)) this.shadowT += dt; else this.shadowT = 0;
    const was = c.shadow;
    c.shadow = this.shadowT >= (up.shadow >= 2 ? 0.8 : 1.6);
    if (c.shadow && !was) {
      this.fx.text(c.x, c.y - 14, '……', '#8a80b8');
      if (!this.tips.shadow) { this.tips.shadow = 1; UI.toast('融進影子裡了！不動的時候，走過來的人幾乎看不到你', 3200); }
    }
  } else c.shadow = false;
  // 偷聽：一動就中斷
  if (this.listening) {
    if (c.moving || c.jump) { this.listening = null; c.pose = null; this.fx.text(c.x, c.y - 14, '沒聽清楚……', '#b8b3d8'); }
    else { this.listening.t += dt; if (this.listening.t >= (hasSet(this.run, 'detective') ? 1.2 : 2.4)) this.finishListen(); }
  }
  // 跑酷連跳
  this.pk.t += dt;
  if (c.jump && !this.wasJump) {
    if (up.parkour && !c.jump.pk) { c.jump.dur *= 0.75; c.jump.pk = true; }
  }
  if (!c.jump && this.wasJump) {
    if (this.pk.t <= 1.4) this.pk.n++; else this.pk.n = 1;
    this.pk.t = 0;
    if (this.pk.n >= 2) {
      this.fx.text(c.x, c.y - 18, `連跳 ×${this.pk.n}`, '#ffd25a', 1.3);
      if (up.parkour && this.pk.n >= 3) { this.run.cans += 1; this.stats.cuteCans = (this.stats.cuteCans || 0) + 1; }
      this.stats.maxPk = Math.max(this.stats.maxPk || 0, this.pk.n);
      if (!this.tips.pk && up.parkour) { this.tips.pk = 1; UI.toast('連跳！一個接一個跳，腳步不會有聲音，三連以上還有罐罐', 3200); }
    }
  }
  this.wasJump = !!c.jump;
};
// 連跳中：腳步沒有聲音
NightScene.prototype.pkSilent = function () { return !!this.run.upg.parkour && this.pk.n >= 2 && this.pk.t <= 1.4; };
// 偷聽時頭上的進度
function listenOverlay(sc, g) {
  const L = sc.listening; if (!L || !g) return;
  const c = sc.cat, [sx, sy] = R3.at(c.x, c.y, 1.6 + (c.h || 0) * Math.cos(R3.pitch));
  g.fillStyle = 'rgba(20,16,40,0.7)'; g.beginPath(); g.arc(sx, sy - 18, 14, 0, TAU); g.fill();
  g.strokeStyle = '#c8b8ff'; g.lineWidth = 3; g.beginPath(); g.arc(sx, sy - 18, 11, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, L.t / (hasSet(sc.run, 'detective') ? 1.2 : 2.4))); g.stroke();
  CM.text(g, sx, sy - 17, '聽', '#ffffff', 11, 1, { weight: 800 });
}
