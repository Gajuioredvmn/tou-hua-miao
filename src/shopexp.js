// ================= 花店擴建（第二個月起）=================
// 是 STORE_UPGRADES 裡的 'expand'（四級）。每一級：店裡和晚上的門口都變得更漂亮、
// 多一種收入，隔天早上有人來看（劇情），有的人會變成粉絲。
const COFFEE_PRICE = 80;
const EXP_PRICE_MULT = [1, 1, 1, 1, 1.25];
function expLv(run) { return (storeOf(run).expand) || 0; }
function classIncome(run) { return expLv(run) >= 3 ? 1500 * (run.month || 1) : 0; }

// ---------- 劇情（蓋好的隔天早上；一天只演一段，花園的劇情優先） ----------
function* storeStoryScript(S) {
  const run = S.run, lv = expLv(run), done = run.storeStory || (run.storeStory = {});
  for (let k = 1; k <= lv; k++) {
    if (done[k]) continue;
    done[k] = 1;
    const wasOn = S.shopOn; S.shopOn = false;
    if (k === 1) {
      const l = S.customer('lin');
      yield S.walkIn(l, COUNTER_SPOT2);
      yield* S.talk(l, '林先生', [
        ['……聽說妳們開始賣咖啡？'],
        ['遛小柴遛到一半，總要有個地方坐一下。'],
        ['小柴好像很喜歡妳家那隻貓……牠們剛剛在門口對看了好久。'],
        ['以後我每天早上都來。院子的茉莉開了，我順便帶一點過來。'],
      ]);
      addFan(run, 'lin'); heatAdd(run, 'lin', -30);
      UI.toast('林先生變成常客了！他偶爾會帶茉莉來（他家的警戒也降了）', 3600); SFX.play('heart');
      yield S.walkOut(l);
    } else if (k === 2) {
      const c = S.customer('chief');
      yield S.walkIn(c, COUNTER_SPOT2);
      yield* S.talk(c, '里長', [
        ['美玲！騎樓擺了座位跟陽傘，整條巷子都亮起來了！'],
        ['里民群組都在傳照片，說我們里終於有一間像樣的店。'],
        ['社區花圃的事……之前那些花，就當作是社區送給妳的開幕禮吧。'],
        ['以後里裡辦活動，花都跟妳訂！'],
      ]);
      addFan(run, 'chief'); heatAdd(run, 'public', -30);
      UI.toast('里長也變成粉絲了！之後客人變多，偶爾還會收到里長送的花', 3600); SFX.play('heart');
      yield S.walkOut(c);
    } else if (k === 3) {
      const w = S.customer('wang');
      yield S.walkIn(w, COUNTER_SPOT2);
      const fan = (run.fans || []).includes('wang');
      yield* S.talk(w, '王太太', fan ? [
        ['美玲老師～我來上第一堂插花課了！'],
        ['我還幫妳拉了三個姊妹來，大家都說要學「玫瑰的十種插法」。'],
        ['對了，那隻貓可以當我們的模特兒嗎？'],
      ] : [
        ['花藝教室……學費多少？'],
        ['我家的玫瑰一直被偷，我想乾脆學怎麼插，至少剩下的要插得漂亮。'],
        ['……那隻貓為什麼一直看我？'],
      ]);
      UI.toast(`花藝教室開課了！每天傍晚收學費 ${money(classIncome(run))}`, 3600); SFX.play('heart');
      yield S.walkOut(w);
    } else if (k === 4) {
      const r = S.customer('shopC');
      yield S.walkIn(r, COUNTER_SPOT2);
      yield* S.talk(r, '電視台製作人', [
        ['您好！我們是《巷弄裡的好店》節目。'],
        ['水晶燈、紅地毯、頂樓花園……還有那隻會招財的虎斑貓。'],
        ['下週想來拍一整集，可以嗎？'],
        ['花喵，你要上電視了！', null, 'M'],
      ]);
      S.cat.pose = 'belly'; S.fx.hearts(S.cat.x, S.cat.y - 10, 8); SFX.play('heart');
      yield wait(1.2); S.cat.pose = null;
      run.flags.tv = 1;
      UI.toast('旗艦店開幕：所有花的賣價 ×1.25', 3400);
      yield S.walkOut(r);
    }
    if (wasOn) S.startShop();
    return true;
  }
  return false;
}

// ---------- 圖 ----------
function drawCafeTable(k) {
  const wood = '#a8784a', woodD = '#6a4630';
  // 椅子（後面那張）
  O.limb(-11, -1, -11, -10, 1.4, woodD); O.limb(-7, -1, -7, -10, 1.4, woodD);
  O.blobO([[-13, -11], [-5, -11], [-5, -9], [-13, -9]], wood);
  O.blobO([[-12.5, -20], [-5.5, -20], [-5.5, -11], [-12.5, -11]], k ? '#e98aa0' : '#7cbf9a');
  // 桌子
  O.limb(2, 0, 2, -12, 1.8, '#3a3a4a');
  O.blobO([[-4, 0], [8, 0], [6, -1.4], [-2, -1.4]], '#3a3a4a');
  O.eo(2, -13, 9, 2.6, '#f4efe6');
  // 咖啡杯、小花瓶
  O.blobO([[-2.6, -14.4], [0.6, -14.4], [0.4, -17.4], [-2.4, -17.4]], '#ffffff');
  O.curve([[0.6, -16.6], [1.8, -16], [0.5, -15]], CM.ink, 0.8);
  O.blobO([[4, -14], [6.4, -14], [6, -18], [4.4, -18]], '#9ad0e8');
  O.curve([[5.2, -18], [5, -22]], PC.stem, 1); flower5(5, -22.6, 1.6, k ? '#ff8fae' : '#ffd84d', '#fff4c0');
  // 椅子（前面那張）
  O.limb(10, -1, 10, -9, 1.4, woodD); O.limb(14, -1, 14, -9, 1.4, woodD);
  O.blobO([[8.5, -10], [15.5, -10], [15.5, -8], [8.5, -8]], wood);
}
function toonCafeTable(k) { return toonFrameInfo(toonFrame('exp-table-' + k, 34, 28, () => drawCafeTable(k)), false, 0.5, 1); }
function drawEspresso() {
  O.blobO([[-8, 0], [8, 0], [8, -14], [-8, -14]], '#c9ccd8');
  O.blobO([[-8, -14], [8, -14], [7, -17], [-7, -17]], '#3a3a4a');
  O.blobO([[-5, -8], [5, -8], [5, -11], [-5, -11]], '#2a2a36');
  O.e(-3, -12.6, 1, 1, '#ff6d6d'); O.e(0, -12.6, 1, 1, '#7ad37a');
  O.blobO([[-2, -2], [2, -2], [1.8, -5], [-1.8, -5]], '#ffffff');
  O.curve([[-1, -7], [-1.5, -9]], 'rgba(255,255,255,0.7)', 0.8); O.curve([[1, -7], [1.6, -9.5]], 'rgba(255,255,255,0.7)', 0.8);
  for (let i = 0; i < 3; i++) O.blobO([[10 + i * 3.2, 0], [12.4 + i * 3.2, 0], [12.2 + i * 3.2, -3], [10.2 + i * 3.2, -3]], ['#ffffff', '#f2c6a0', '#9ad0e8'][i]);
}
function toonEspresso() { return toonFrameInfo(toonFrame('exp-espresso', 34, 22, drawEspresso), false, 0.4, 0.8); }
function drawUmbrellaTable(k) {
  const c1 = k ? '#ff8fae' : '#7cbf9a', c2 = '#fff6ec';
  O.limb(0, 0, 0, -26, 1.4, '#6a6a7a');
  // 陽傘：條紋
  const pts = []; for (let i = 0; i <= 8; i++) { const a = Math.PI + i * Math.PI / 8; pts.push([Math.cos(a) * 16, -26 + Math.sin(a) * 6]); }
  O.blobO([...pts, [16, -24], [-16, -24]], c1);
  for (let i = 0; i < 4; i++) { const a0 = Math.PI + (i * 2 + 1) * Math.PI / 8, a1 = a0 + Math.PI / 8; O.blob([[0, -32], [Math.cos(a0) * 16, -26 + Math.sin(a0) * 6], [Math.cos(a0) * 16, -24], [Math.cos(a1) * 16, -24], [Math.cos(a1) * 16, -26 + Math.sin(a1) * 6]], c2); }
  O.e(0, -32.5, 1.2, 1.2, '#ffd84d');
  // 桌椅
  O.eo(0, -10, 8, 2.2, '#f4efe6'); O.limb(0, 0, 0, -9, 1.6, '#3a3a4a');
  for (const sd of [-1, 1]) { O.limb(sd * 11, 0, sd * 11, -7, 1.2, '#3a3a4a'); O.blobO([[sd * 8, -7], [sd * 14, -7], [sd * 14, -5.5], [sd * 8, -5.5]], '#3a3a4a'); O.blobO([[sd * 13, -14], [sd * 14.5, -14], [sd * 14.5, -6], [sd * 13, -6]], '#3a3a4a'); }
  O.curve([[2, -12], [2.4, -16]], PC.stem, 1); flower5(2.4, -16.6, 1.6, '#ff6d9a', '#fff4c0');
}
function toonUmbrellaTable(k) { return toonFrameInfo(toonFrame('exp-umb-' + k, 36, 38, () => drawUmbrellaTable(k)), false, 0.5, 1.05); }
function drawFlowerArch() {
  const cols = ['#ff8fae', '#ffd84d', '#ffffff', '#e8394d', '#9a6ad0', '#ff9fcb'];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + i * Math.PI / 14, x = Math.cos(a) * 15, y = -18 + Math.sin(a) * 16;
    leafBall(x, y, 3.4, 2.8);
  }
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + i * Math.PI / 14, x = Math.cos(a) * 15, y = -18 + Math.sin(a) * 16;
    flower5(x + (i % 2 ? 1 : -1), y - 1, 1.9, cols[i % cols.length], '#fff4c0', i);
  }
  for (const sd of [-1, 1]) for (let y = -18; y <= 0; y += 3.5) { leafBall(sd * 15, y, 2.8, 2.4); flower5(sd * 15 + sd, y - 0.5, 1.5, cols[(y + 30) % 6 | 0], '#fff4c0'); }
  O.blobO([[-8, -36], [8, -36], [8, -30], [-8, -30]], '#2a2a36');
  O.blob([[-7, -35], [7, -35], [7, -31], [-7, -31]], '#ff6d9a');
}
function toonFlowerArch() { return toonFrameInfo(toonFrame('exp-arch', 40, 40, drawFlowerArch), false, 0.5, 1.15); }
function drawChandelier() {
  O.curve([[0, -30], [0, -20]], '#c9a43a', 1.2);
  O.eo(0, -14, 9, 3, '#e8b84a');
  for (let i = -2; i <= 2; i++) { O.curve([[i * 4, -14], [i * 4.4, -8]], '#e8b84a', 0.9); O.eo(i * 4.4, -7, 1.3, 2, '#fff6d0'); }
  for (let i = -3; i <= 3; i++) O.e(i * 2.8, -11, 0.9, 1.6, 'rgba(220,240,255,0.9)');
  O.eo(0, -19, 3, 2, '#e8b84a');
}
function toonChandelier() { return toonFrameInfo(toonFrame('exp-chand', 24, 32, drawChandelier), false, 0.5, 1); }

// ---------- 白天：店裡、騎樓 ----------
const CAFE_TABLES = [[10.7, 12.4, 0], [12.7, 14.0, 1]];
const PATIO_TABLES = [[9.4, 17.55, 0], [13.2, 17.55, 1]];
function expBlocked(run) {
  const lv = expLv(run), out = [];
  if (lv >= 1) for (const [x, z] of CAFE_TABLES) { out.push(Math.floor(x) + ',' + Math.floor(z)); out.push(Math.floor(x - 0.6) + ',' + Math.floor(z)); }
  return out;
}
function expDecor3D(sc, F) {
  const lv = expLv(sc.run); if (!lv) return;
  const cpd = Math.cos(R3.pitch), t = sc.cat.t || 0;
  for (const [x, z, k] of CAFE_TABLES) { pushSprite(F.sprites, ART.fix(toonCafeTable(k)), x * TS, z * TS); shadowAt(F, x * TS, z * TS, 1.2, 0.36); }
  pushSprite(F.sprites, ART.fix(toonEspresso()), 10.2 * TS, 7.42 * TS, { lift: 0.95 * cpd, minLight: [0.6, 0.56, 0.55] });
  if (lv >= 2) for (const [x, z, k] of PATIO_TABLES) { pushSprite(F.sprites, ART.fix(toonUmbrellaTable(k)), x * TS, z * TS); shadowAt(F, x * TS, z * TS, 1.4, 0.4); }
  if (lv >= 3) { pushSprite(F.sprites, ART.fix(toonFlowerArch()), 6.5 * TS, 3.15 * TS, { minLight: [0.65, 0.6, 0.6] }); glowQuad(F.glow, 6.5, 2.05, 3.2, 0.5, [1, 0.45, 0.7, 0.25]); }
  if (lv >= 4) {
    for (const [x, z] of [[5.2, 8.2], [10.4, 11.6]]) {
      pushSprite(F.sprites, ART.fix(toonChandelier()), x * TS, z * TS, { lift: 2.0 * cpd, unlit: true });
      glowQuad(F.glow, x, 2.0, z + 0.05, 0.9, [1, 0.85, 0.55, 0.28 + 0.04 * Math.sin(t * 2 + x)]);
    }
    groundQuad(F.flat, 7.5, 17.2, 0.9, 1.4, 0, [0.72, 0.12, 0.18, 0.95], 0.008);
  }
}
function expLights(sc, L) {
  const lv = expLv(sc.run);
  if (lv >= 4) for (const [x, z] of [[5.2, 8.2], [10.4, 11.6]]) L.push({ x, y: 2.0, z, r: 4.2, c: [1.0, 0.8, 0.5] });
}
// ---------- 夜晚：花店門口 ----------
function expNight3D(sc, F, L) {
  const lv = expLv(sc.run); if (!lv) return;
  const t = sc.cat.t || 0;
  if (lv >= 2) for (const [x, k] of [[10.4, 0], [12.9, 1]]) { pushSprite(F.sprites, ART.fix(toonUmbrellaTable(k)), x * TS, 5.75 * TS); shadowAt(F, x * TS, 5.75 * TS, 1.4, 0.4); }
  if (lv >= 3) { pushSprite(F.sprites, ART.fix(toonFlowerArch()), 7.5 * TS, 5.05 * TS, { minLight: [0.6, 0.55, 0.6] }); glowQuad(F.glow, 7.5, 2.0, 5.1, 0.55, [1, 0.45, 0.7, 0.3 + 0.08 * Math.sin(t * 2.4)]); }
  if (lv >= 4) {
    groundQuad(F.flat, 7.5, 5.9, 0.75, 1.1, 0, [0.6, 0.1, 0.16, 0.9], 0.008);
    for (const x of [5.6, 9.4]) { glowQuad(F.glow, x, 1.5, 5.15, 0.32, [1, 0.8, 0.4, 0.8]); L.push({ x, y: 1.4, z: 5.4, r: 2.4, c: [0.9, 0.65, 0.3] }); }
  }
}
