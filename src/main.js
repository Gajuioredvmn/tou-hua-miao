// ================= 啟動 =================
const G = { S: null, maps: {}, bg: {}, run: null, scene: null, icons: {}, paused: false };

function stampDecor() {
  // 屋頂水塔、牆上的冷氣室外機
  const g = G.bg.night.getContext('2d');
  for (const [tx, ty] of ROOF_TOWERS) drawSpr(g, G.S.obj.tower, (tx + 0.5) * TS, (ty + 1) * TS - 1);
  const ac = buildSprite(['IIIIIIII', 'IiiiiiiI', 'IiIIIIiI', 'IiiiiiiI', 'IIIIIIII', '.i....i.'], PAL);
  for (const [tx, ty] of [[11, 11], [1, 21], [12, 31], [13, 11]]) {
    if (G.maps.night.at(tx, ty) === '#') drawSpr(g, ac, (tx + 0.5) * TS, (ty + 1) * TS - 3);
  }
  // 花店招牌
  const sg = g;
  sg.fillStyle = '#4a7a5a'; sg.fillRect(4 * TS + 2, 3 * TS + 2, 2 * TS - 4, 5);
  sg.fillStyle = '#fff3e8'; sg.fillRect(4 * TS + 3, 3 * TS + 3, 2 * TS - 6, 3);
  sg.fillStyle = '#ff8fae'; for (let i = 0; i < 4; i++) sg.fillRect(4 * TS + 5 + i * 4, 3 * TS + 4, 2, 1);
}
function makeIcons() {
  const big = (cv, k = 1) => {
    const c = document.createElement('canvas'); c.width = cv.width * k; c.height = cv.height * k;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, c.width, c.height);
    return c.toDataURL();
  };
  for (const k in G.S.icon) G.icons[k] = big(G.S.icon[k], 4);
  G.icons.can = big(G.S.obj.can, 4);
  G.icons.orange = big(buildSprite([
    '.O......O.', '.OO....OO.', '.OOOOOOOO.', 'OOEOOOOEOO', 'OOOOPPOOOO', '.OOOOOOOO.',
  ], PAL), 4);
  G.icons.catBig = big(G.S.cat.down[0], 6);
  try { Object.assign(G.icons, vectorIcons()); } catch (e) { console.error(e); }
}

// 出錯時：記下來、跳一次提示（方便截圖回報），不讓遊戲停住
const ERR_SEEN = {};
function reportErr(err, where) {
  const msg = (err && err.message) || String(err), key = where + msg;
  if (ERR_SEEN[key]) return; ERR_SEEN[key] = 1;
  console.error(err);
  const line = ((err && err.stack) || '').split('\n').find(l => /at /.test(l)) || '';
  try { UI.toast(`遊戲出了點小問題（可以截圖給我）：${msg} ${line.trim().slice(0, 60)}`, 9000); } catch (e) { }
}
function boot(data) {
  if (R3.init($('gl'), $('screen'))) $('screen').classList.add('ov');
  View.init($('screen'));
  G.S = makeAllSprites();
  G.S.tabby = makeTabbySprites();
  G.S.bush = [makeBushSprite(1), makeBushSprite(2), makeBushSprite(3)];
  G.S.lamp = makeLampSprite(); G.S.camPole = makeCamPole();
  G.S.bubble = {}; for (const k in BUBBLE_ICONS) G.S.bubble[k] = makeBubbleSprite(k);
  G.maps.night = new TileMap(NIGHT_MAP); G.maps.shop = new TileMap(SHOP_MAP);
  G.bg.night = renderMap(G.maps.night); G.bg.shop = renderMap(G.maps.shop);
  stampDecor(); makeIcons();
  try { SFX.muted = localStorage.getItem('thm-mute') === '1'; } catch (e) { }
  UI.init();
  Input.init($('touch'), $('stick'), $('knob'));
  Input.onAction = () => Flow.action();
  Input.onWait = () => Flow.wait();
  Input.onSkill = i => Flow.skill(i);
  Input.onPause = () => UI.pause();
  window.addEventListener('resize', () => View.resize());
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.scene && G.scene.kind === 'night' && G.scene.mode === 'play') UI.pause(); });

  // 換版時保留進度（只在 claude 檢視器裡有用）
  try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ run: G.run, kind: G.scene && G.scene.kind, n: G.scene && G.scene.n })); } catch (e) { }
  if (data && data.run && data.kind && data.kind !== 'title') {
    G.run = data.run;
    if (data.kind === 'night') setScene(new NightScene(data.n));
    else setScene(new DayScene(data.n || 1));
  } else {
    setScene(new TitleScene(), 'none');
    const sv = loadSave();
    const showTitle = s => UI.title(() => { SFX.init(); SFX.resume(); Flow.start(); }, s, () => { SFX.init(); SFX.resume(); Flow.resume(s); });
    showTitle(sv);
    // 雲端存檔比較新（或這台裝置沒有存檔）：標題畫面換成雲端的進度
    Cloud.load().then(cd => {
      const c = normSave(cd);
      if (!c || (sv && sv.t >= c.t)) return;
      if (G.scene && G.scene.kind === 'title' && UI.modalOpen) showTitle(c);
    });
  }
  let last = performance.now();
  const loop = now => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    // 更新和畫面分開接錯：其中一邊出錯，另一邊照樣跑，不會整個卡住
    try { if (G.scene && !G.paused) G.scene.update(dt); } catch (err) { reportErr(err, 'u'); }
    try {
      if (G.scene) {
        if (R3.on && G.scene.render3D) G.scene.render3D();
        else { G.scene.render(View.ctx); View.present(); }
      }
    } catch (err) { reportErr(err, 'r'); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__TH = { loadSave, clearSave, G, Flow, UI, Input, Cam, View, R3, GL3, DayScene, NightScene, setScene, newRun, CuteGame, CharmCut, OrangeCat, ART, RP: { repOf, repLv, repDayEnd }, ST: { setBranch, mLv, hasCombo, hasLegend, MASTERY }, FV: (r, t, f) => flowerValue(r, t, f), RENT: rentFor, EX: { startExped, expOf, EXPEDS }, RV: { rivalOf, chainOf, initRival, startDuel, chainDayEnd }, BR: { startBreed, breedTick, breedOf, HYBRIDS, HYBRID_ORDER, royaltyOf }, ZN: { zoneEnter, zonesOf, LOST_ITEMS, ZONES }, OUT: { pullGacha, equipOutfit, exchangeOutfit, hasSet, activeSets, wardrobe, OUTFITS }, GEAR: { drawMeowArt2, drawBellyArt2, drawRubArt2, VXR, orangeCloseup, cuteHead, withGear, catGearFor, catRefArt, toonOrangePal: ORANGE_PAL, TAB } };
}

(function start() {
  const go = d => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot(d || {})); else boot(d || {}); };
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(go); else go(hot && hot.data ? hot.data : {});
})();
