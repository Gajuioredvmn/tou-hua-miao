// ================= 花喵的新本事：喵喵廣播、貓道 =================
// 喵喵廣播：把叫聲丟到前方幾格，附近的人會走過去看（跟撥倒東西一樣，但隨身帶著）
const TUNNEL_ENDS = [[5.5, 5.5], [7.5, 40.4]];   // 花店門口旁邊、巷底
function callCount(run) { const lv = run.upg.call || 0; return lv >= 2 ? 5 : lv ? 3 : 0; }
NightScene.prototype.initCatSkills = function () {
  this.calls = callCount(this.run);
  if (itemActive(this.run, 'coffee')) this.end += 30;
};
NightScene.prototype.catSkillButtons = function (sk) {
  if (this.mode === 'play' && this.run.upg.call) sk.push({ id: 'call', label: '喵！', n: this.calls, off: this.calls <= 0 });
};
NightScene.prototype.doCall = function () {
  const c = this.cat, lv = this.run.upg.call || 0;
  if (this.calls <= 0) { SFX.play('nope'); UI.toast('今晚喵不出來了，喉嚨要休息'); return; }
  if (c.box) { SFX.play('nope'); return; }
  const d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[c.dir] || [0, 1];
  const far = (lv >= 2 ? 6 : 5) * TS;
  // 沿著面對的方向找最遠、不是牆的位置
  let tx = c.x, ty = c.y;
  for (let k = TS; k <= far; k += TS / 2) { const x = c.x + d[0] * k, y = c.y + d[1] * k; if (this.map.solidPx(x, y) && !this.map.solidPx(x, y + TS)) break; tx = x; ty = y; }
  this.calls--;
  SFX.play('meow');
  this.fx.text(c.x, c.y - 16, '喵——', '#ffe2ea');
  setTimeout(() => {
    if (this.mode !== 'play') return;
    this.noise(tx, ty, (lv >= 2 ? 9 : 7) * TS, 'obj');
    this.fx.text(tx, ty - 10, '喵～？', '#ffd25a', 1.6);
    this.stats.calls = (this.stats.calls || 0) + 1;
  }, 260);
  vibrate(20);
  if (!this.tips.call) { this.tips.call = 1; UI.toast('叫聲飛到前面去了！人會走去那邊看，趁機從另一邊溜', 3200); }
};
// 貓道：兩個洞口
NightScene.prototype.tunnelTarget = function (cx, cy) {
  if (!this.run.upg.tunnel || this.cat.top || this.cat.box) return null;
  for (let i = 0; i < 2; i++) { const [x, y] = TUNNEL_ENDS[i]; if (dist(cx, cy, x * TS, y * TS) < 14) return { kind: 'tunnel', i, ref: { x: x * TS, y: y * TS - 2 } }; }
  return null;
};
NightScene.prototype.useTunnel = function (i) {
  const c = this.cat, [x, y] = TUNNEL_ENDS[1 - i];
  this.fx.text(c.x, c.y - 12, '咻！', '#ffe2ea');
  SFX.play('door');
  c.x = x * TS; c.y = y * TS + 4; c.dir = i === 0 ? 'down' : 'up';
  this.snapCam = true;
  setTimeout(() => SFX.play('door'), 220);
  this.stats.tunnels = (this.stats.tunnels || 0) + 1;
  if (!this.tips.tunnel) { this.tips.tunnel = 1; UI.toast(i === 0 ? '從貓道鑽到巷底了！' : '一下就回到花店門口了', 2600); }
};
function tunnelRender3D(sc, F) {
  if (!sc.run.upg.tunnel) return;
  for (const [x, y] of TUNNEL_ENDS) {
    groundQuad(F.decal, x, y + 0.05, 0.8, 0.42, 0, [1, 1, 1, 1], 0.014);
    groundQuad(F.flat, x, y + 0.05, 0.62, 0.3, 0, [0.06, 0.04, 0.09, 0.92], 0.016);
    pushSprite(F.sprites, ART.sign('貓道'), (x + 0.7) * TS, (y - 0.1) * TS);
  }
}
