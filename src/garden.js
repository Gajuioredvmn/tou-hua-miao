// ================= 頂樓花園：不用偷也有花 =================
// 第二個月開放。用現金一級一級蓋；花喵偷花時順便叼回插枝，種在頂樓，每天早上收成。
// 每升一級都會帶出一段劇情（誰來看花園、誰變成粉絲）和新的玩法。
const GARDEN_OPEN_MONTH = 2;
const GARDEN_LV = [
  { name: '木頭花架', cost: 6000, pots: 3, desc: '頂樓擺上木頭花架，種得下 3 盆', look: '頂樓多了一排木花架' },
  { name: '層架＋遮陽網', cost: 15000, pots: 6, desc: '6 盆；串燈亮起來，路過的人抬頭就看得到', look: '加了層架、遮陽網和串燈' },
  { name: '小溫室', cost: 32000, pots: 9, desc: '9 盆；每種花早一晚長好', look: '頂樓蓋了一間玻璃小溫室' },
  { name: '自動灑水＋補光燈', cost: 60000, pots: 12, desc: '12 盆；每次收成多一朵', look: '溫室裡亮起補光燈，噴頭會噴水霧' },
  { name: '玻璃花房', cost: 110000, pots: 16, desc: '16 盆；曇花、牡丹、蝴蝶蘭也種得活', look: '整片頂樓變成發光的玻璃花房' },
];
const GARDEN_RARE = ['tanhua', 'peony', 'orchid'];
function gardenOf(run) {
  const g = run.garden || (run.garden = { lv: 0, plots: [], story: {} });
  if (!g.plots) g.plots = []; if (!g.story) g.story = {};
  return g;
}
function gardenOpen(run) { return (run.month || 1) >= GARDEN_OPEN_MONTH; }
function gardenPots(run) { const lv = gardenOf(run).lv; return lv ? GARDEN_LV[lv - 1].pots : 0; }
function growNights(run, t) {
  const p = FLOWERS[t].price;
  let g = p <= 150 ? 1 : p <= 400 ? 2 : 3;
  if (gardenOf(run).lv >= 3) g = Math.max(1, g - 1);
  return g;
}
function gardenYield(run) { return gardenOf(run).lv >= 4 ? 2 : 1; }
function plantable(run, t) { return !GARDEN_RARE.includes(t) || gardenOf(run).lv >= 5; }
// 晚上偷到的每一種花，順便帶回一支插枝（每種最多存 9 支）
function collectCuttings(run, dep) {
  const cut = run.cuttings || (run.cuttings = {}), got = [];
  for (const t of new Set(dep.map(f => f.t))) {
    if (!FLOWERS[t] || FLOWERS[t].toxic) continue;
    if ((cut[t] || 0) < 9) { cut[t] = (cut[t] || 0) + 1; got.push(t); }
  }
  return got;
}
function plantPot(run, i, t) {
  const g = gardenOf(run), cut = run.cuttings || {};
  if (i >= gardenPots(run) || g.plots[i] || !(cut[t] > 0) || !plantable(run, t)) return false;
  cut[t]--; g.plots[i] = { t, age: 0, n: 0 };
  return true;
}
function pullPot(run, i) { const g = gardenOf(run); g.plots[i] = null; }
// 過了一晚：花長大，長好的就收成（回傳 [{t, n}]）
function gardenTick(run) {
  const g = gardenOf(run), out = {};
  const pots = gardenPots(run);
  for (let i = 0; i < pots; i++) {
    const p = g.plots[i]; if (!p) continue;
    p.age++;
    if (p.age >= growNights(run, p.t)) { p.age = 0; p.n = (p.n || 0) + 1; out[p.t] = (out[p.t] || 0) + gardenYield(run); }
  }
  return Object.keys(out).map(t => ({ t, n: out[t] }));
}
// 明天早上會收成什麼
function gardenForecast(run) {
  const g = gardenOf(run), out = {};
  for (let i = 0; i < gardenPots(run); i++) {
    const p = g.plots[i]; if (!p) continue;
    if (p.age + 1 >= growNights(run, p.t)) out[p.t] = (out[p.t] || 0) + gardenYield(run);
  }
  return Object.keys(out).map(t => ({ t, n: out[t] }));
}

// ---------- 粉絲：花園讓鄰居變成粉絲，早上會在門口放花 ----------
const FAN_GIFTS = { wang: ['rose', 'lisianthus'], bo: ['osmanthus', 'tanhua'], lin: ['jasmine', 'hydrangea'], chief: ['carnation', 'sunflower'] };
const FAN_NAMES = { wang: '王太太', bo: '阿伯', lin: '林先生', chief: '里長' };
const FAN_OWNER = { wang: 'wang', bo: 'bo', lin: 'lin', chief: 'public' };
function addFan(run, who) { run.fans = run.fans || []; if (!run.fans.includes(who)) { run.fans.push(who); addBond(run, FAN_OWNER[who], 2); } }
function fanGifts(run) {
  const out = [];
  for (const who of run.fans || []) if (Math.random() < (who === 'wang' && run.flags && run.flags.wangGift2 ? 0.75 : 0.45)) out.push({ who, t: pick(FAN_GIFTS[who]) });
  return out;
}

// ---------- 每一級的劇情（蓋好的隔天早上） ----------
function* gardenStoryScript(S) {
  const run = S.run, g = gardenOf(run), M = S.meiling;
  for (let lv = 1; lv <= g.lv; lv++) {
    if (g.story[lv]) continue;
    g.story[lv] = 1;
    const wasOn = S.shopOn; S.shopOn = false;
    if (lv === 1) {
      yield S.say('花喵！我昨天在頂樓擺了花架。');
      yield S.say('我發現你每天晚上叼回來的花，都會連著一小段枝……');
      yield S.say('那就是插枝呀！插進土裡，就會長出新的花。以後我們也有自己種的花了！');
      UI.hideDialog();
      UI.toast('頂樓花園開張：傍晚的「頂樓花園」分頁可以種插枝，花長好了早上自動收成', 4200);
    } else if (lv === 2) {
      const w = S.customer('wang');
      yield S.walkIn(w);
      yield* S.talk(w, '王太太', [
        ['美玲啊，妳家頂樓晚上亮晶晶的，那是什麼？'],
        ['是我們的小花園！我跟花喵一起種的。', null, 'M'],
        ['哎唷，好漂亮……我也好想要一個這樣的陽台。'],
        ['我家玫瑰開太多了，以後我剪一些放妳門口，換妳教我種花好不好？'],
      ]);
      addFan(run, 'wang'); heatAdd(run, 'wang', -30);
      UI.toast('王太太變成花園的粉絲了！她偶爾會在門口放花（她家的警戒也降了）', 3800); SFX.play('heart');
      yield S.walkOut(w);
    } else if (lv === 3) {
      const b = S.customer('bo');
      yield S.walkIn(b);
      yield* S.talk(b, '阿伯', [
        ['……聽說妳頂樓蓋了溫室？'],
        ['阿伯年輕的時候也有一間。曇花、桂花，什麼都種過。'],
        ['那隻花貓……我在溫室裡看過牠，叼著插枝跑來跑去。'],
        ['……算了。種花的人不會是壞人。我家的桂花，開了我就分妳一點。'],
      ]);
      addFan(run, 'bo'); heatAdd(run, 'bo', -30);
      UI.toast('阿伯也變成粉絲了！小溫室讓每種花早一晚長好', 3800); SFX.play('heart');
      yield S.walkOut(b);
    } else if (lv === 4) {
      const r = S.customer('shopC');
      yield S.walkIn(r);
      yield* S.talk(r, '雜誌記者', [
        ['您好，我是《城市花事》的記者！'],
        ['網路上都在傳「巷子裡有一間頂樓會發光的花店」，就是這裡吧？'],
        ['可以拍一下頂樓和……那隻虎斑貓嗎？讀者一定會愛死。'],
        ['花喵，看鏡頭～', null, 'M'],
      ]);
      S.cat.pose = 'belly'; S.fx.hearts(S.cat.x, S.cat.y - 10, 6); SFX.play('heart');
      yield wait(1.2); S.cat.pose = null;
      run.flags.famous = 1;
      UI.toast('上雜誌了！之後每天上門的客人變多', 3600);
      yield S.walkOut(r);
    } else if (lv === 5) {
      const bt = S.customer('butler');
      yield S.walkIn(bt);
      yield* S.talk(bt, '管家', [
        ['打擾了。我是巷底大宅的管家。'],
        ['夫人從窗戶看到您的玻璃花房，十分欣賞。'],
        ['下個月小姐的婚禮，夫人希望由您負責花藝。今晚請先準備三株蝴蝶蘭。'],
        ['蝴蝶蘭……！好、好的！', null, 'M'],
      ]);
      run.flags.weddingAsked = 1;
      S.addOrderObj({ id: 'wedding-' + (run.month || 1), who: '大宅婚禮', t: 'orchid', n: 3, mode: 'all', reward: 9000 });
      UI.toast('玻璃花房：曇花、牡丹、蝴蝶蘭也種得活了', 3400);
      yield S.walkOut(bt);
    }
    if (wasOn) S.startShop();
    return true;   // 一天只演一段，留到明天
  }
  return false;
}
// 早上：收成、粉絲送的花
function* gardenMorningScript(S) {
  const run = S.run, nb = run.lastNight || {};
  const hv = nb.garden || [], gifts = nb.gifts || [];
  if (hv.length) {
    yield S.say('頂樓收成了：' + hv.map(h => FLOWERS[h.t].name + ' ×' + h.n).join('、') + '！');
    S.fx.hearts(S.cat.x, S.cat.y - 10, 3);
  }
  for (const gf of gifts) {
    addBond(run, FAN_OWNER[gf.who], 1);
    yield S.say(`門口有${FAN_NAMES[gf.who]}放的${FLOWERS[gf.t].name}，還夾了一張小卡片。`);
  }
  if (hv.length || gifts.length) UI.hideDialog();
}

// ---------- 圖：花苗、空盆 ----------
function toonSprout(k) {
  return toonFrameInfo(toonFrame('sprout-' + k, 34, 38, () => {
    if (k > 0) {
      const s = 0.6 + k * 0.35;
      O.curve([[0, -12], [0, -12 - 6 * s]], PC.stem, 1.4);
      leafBall(-3.5 * s, -13 - 4 * s, 3.4 * s, 2.6 * s); leafBall(3.5 * s, -13 - 4.5 * s, 3.4 * s, 2.6 * s);
      if (k >= 2) leafBall(0, -15 - 7 * s, 3.6 * s, 2.8 * s);
    }
    drawPotBase('clay', 18);
    if (k === 0) { O.e(0, -12.4, 6.5, 1.4, '#5a3a2a'); O.curve([[-1, -12.5], [0, -16], [1.5, -18]], PC.stem, 1.2); O.e(2.2, -18.2, 1.8, 1.1, PC.leaf); }
  }), false, 0.5, 0.95);
}
function gardenPlotArt(run, p) {
  if (!p) return null;
  const g = growNights(run, p.t);
  if (p.age >= g - 1) return toonPot(p.t);           // 明天就開：已經結滿花苞
  if (p.n > 0) return toonSprout(2);                  // 收成過，正在長下一批
  return toonSprout(Math.min(2, Math.floor((p.age / (g - 1)) * 2)));
}

// ---------- 夜晚 3D：頂樓長出花園 ----------
const ROOF_Y = 3.0;
const GARDEN_SPOTS = (() => {
  const out = [];
  const xs = [1.9, 3.5, 5.0, 6.5, 8.0, 9.5, 11.0, 12.6];
  for (const z of [4.05, 3.15]) for (const x of xs) out.push([x, z]);
  // 依照蓋花架的順序：中間先、往兩邊
  const order = [3, 4, 2, 5, 1, 6, 0, 7];
  return [...order.map(i => out[i]), ...order.map(i => out[8 + i])];
})();
function gardenRender3D(sc, F, L, st) {
  const run = sc.run, g = gardenOf(run), lv = g.lv;
  // 溫室玻璃（第 3 級起）
  const want = lv >= 5 ? 2 : lv >= 3 ? 1 : 0;
  if ((st.roofGH || 0) !== want) {
    st.glassMeshes = (st.glassMeshes || []).filter(p => !p.roofGH);
    if (want === 1) st.glassMeshes.push(...buildGreenhouse(4.4, 10.6, 2.75, 4.5, [[7, 8]], ROOF_Y, 0.5).map(p => Object.assign(p, { roofGH: 1 })));
    if (want === 2) st.glassMeshes.push(...buildGreenhouse(1.2, 13.8, 2.7, 4.55, [[7, 8]], ROOF_Y, 0.56).map(p => Object.assign(p, { roofGH: 1 })));
    st.roofGH = want;
  }
  if (!lv) return;
  const cp = Math.cos(R3.pitch), vt = sc.cat.t;
  const pots = gardenPots(run);
  for (let i = 0; i < pots; i++) {
    const [x, z] = GARDEN_SPOTS[i];
    const a = gardenPlotArt(run, g.plots[i]) || toonSprout(-1);
    pushSprite(F.sprites, ART.fix(a), x * TS, z * TS, { lift: ROOF_Y * cp, minLight: [0.5, 0.45, 0.5] });
    shadowAt(F, x * TS, z * TS - 1, 0.6, 0.24, 1, ROOF_Y);
  }
  // 串燈（第 2 級起）
  if (lv >= 2) {
    for (let i = 0; i <= 14; i++) {
      const k = i / 14, x = 1.6 + k * 11.8, y = ROOF_Y + 1.15 - Math.abs(Math.sin(k * Math.PI * 3)) * 0.18;
      const on = 0.7 + 0.3 * Math.sin(vt * 3 + i * 1.3);
      glowQuad(F.glow, x, y, 4.6, 0.09, [1, 0.8, 0.45, 0.9 * on]);
    }
    L.push({ x: 7.5, y: ROOF_Y + 0.9, z: 3.9, r: 3.6, c: [0.6, 0.42, 0.24], pri: 0.7 });
  }
  // 補光燈（第 4 級起）：粉紫色的光、水霧
  if (lv >= 4) {
    L.push({ x: 7.5, y: ROOF_Y + 1.0, z: 3.5, r: 3.8, c: [0.5, 0.26, 0.6], pri: 0.9 });
    for (let i = 0; i < 6; i++) {
      const ph = (vt * 0.6 + i / 6) % 1, x = 2.5 + i * 2, z = 3.6;
      glowQuad(F.glow, x + Math.sin(i * 7 + vt) * 0.2, ROOF_Y + 0.5 + ph * 0.6, z, 0.16 + ph * 0.12, [0.65, 0.85, 1, 0.35 * (1 - ph)]);
    }
  }
  if (lv >= 5) L.push({ x: 7.5, y: ROOF_Y + 1.1, z: 3.4, r: 4.4, c: [0.6, 0.46, 0.3], pri: 1.1 });
}

// ---------- 傍晚的分頁 ----------
function gardenTabHTML(run, pickIdx) {
  const g = gardenOf(run), lv = g.lv, pots = gardenPots(run), cut = run.cuttings || {};
  if (!gardenOpen(run)) {
    return `<p class="lead">「頂樓空空的……以後如果有自己的花園就好了。」</p><p class="hint">第二個月開放。</p>`;
  }
  const next = GARDEN_LV[lv];
  const lvRow = next ? `<li class="up">
      <div class="up-main"><div class="up-name"><span class="grp garden">頂樓</span><b>${next.name}</b><span class="pips">${GARDEN_LV.map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</span></div>
      <div class="up-now">${lv ? '現在：' + esc(GARDEN_LV[lv - 1].name) : '頂樓還空空的'}</div><div class="up-next">蓋了：${esc(next.desc)}</div></div>
      <button type="button" class="buy cash" data-garden="up" ${run.money >= next.cost ? '' : 'disabled'}><b class="px">${next.cost.toLocaleString('en-US')}</b></button></li>`
    : `<li class="up maxed"><div class="up-main"><div class="up-name"><span class="grp garden">頂樓</span><b>玻璃花房</b></div><div class="up-now">頂樓已經蓋到最高級了</div></div><button type="button" class="buy cash" disabled>完成</button></li>`;
  let potsHTML = '';
  if (lv) {
    const cells = [];
    for (let i = 0; i < pots; i++) {
      const p = g.plots[i];
      if (!p) { cells.push(`<button type="button" class="gpot empty ${pickIdx === i ? 'on' : ''}" data-pot="${i}"><span class="gp-plus">＋</span><small>種插枝</small></button>`); continue; }
      const gn = growNights(run, p.t), left = gn - p.age;
      cells.push(`<div class="gpot"><img src="${G.icons[p.t]}" alt=""><b>${FLOWERS[p.t].name}</b><small>${left <= 1 ? '明天收成' : `再 ${left} 晚`}</small><button type="button" class="gp-pull" data-pull="${i}" aria-label="拔掉${FLOWERS[p.t].name}">拔掉</button></div>`);
    }
    potsHTML = `<div class="gpots">${cells.join('')}</div>`;
    if (pickIdx >= 0) {
      const types = FLOWER_ORDER.filter(t => (cut[t] || 0) > 0);
      potsHTML += types.length ? `<div class="gpick"><p>選一支插枝種下去：</p>${types.map(t => {
        const ok = plantable(run, t);
        return `<button type="button" class="gpick-b" data-plant="${t}" ${ok ? '' : 'disabled'}><img src="${G.icons[t]}" alt=""><b>${FLOWERS[t].name}</b><small>${ok ? `${growNights(run, t)} 晚開花・NT$ ${Math.round(flowerValue(run, t, 1))}` : '要玻璃花房'}</small><i class="px">×${cut[t]}</i></button>`;
      }).join('')}</div>` : `<div class="gpick"><p>還沒有插枝。晚上偷到花，就會順便帶回那種花的插枝。</p></div>`;
    }
    const fc = gardenForecast(run);
    const val = fc.reduce((s, f) => s + flowerValue(run, f.t, 1) * f.n, 0);
    potsHTML += `<p class="gforecast">${fc.length ? `明天早上收成：${fc.map(f => FLOWERS[f.t].name + ' ×' + f.n).join('、')}（約 ${money(Math.round(val))}）` : '明天沒有花會開。'}</p>`;
    const inv = FLOWER_ORDER.filter(t => (cut[t] || 0) > 0);
    potsHTML += `<p class="gcuts">插枝：${inv.length ? inv.map(t => `${FLOWERS[t].name} ×${cut[t]}`).join('、') : '還沒有'}</p>`;
  }
  return `<p class="lead">「${lv ? '自己種的花，不用怕被鄰居認出來！' : '頂樓空著好可惜……蓋個花架，把插枝種起來吧！'}」</p>
    <canvas class="garden-art" width="330" height="150" aria-label="頂樓花園現在的樣子"></canvas>
    ${UI.rentBar(run)}
    <ul class="ups">${lvRow}</ul>${potsHTML}`;
}
// 傍晚分頁裡的頂樓插畫
function drawGardenArt(cv, run) {
  const g = gardenOf(run), lv = g.lv, W = cv.width, H = cv.height, x = cv.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2b2457'); sky.addColorStop(1, '#5a3f6e');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,240,200,0.8)'; for (let i = 0; i < 18; i++) x.fillRect((i * 97) % W, (i * 53) % 60, 1.5, 1.5);
  // 屋頂地板
  x.fillStyle = '#8c7f86'; x.fillRect(0, H - 46, W, 46);
  x.fillStyle = '#7a6d75'; for (let i = 0; i < W; i += 22) x.fillRect(i, H - 46, 1, 46);
  x.fillStyle = '#b4a5aa'; x.fillRect(0, H - 48, W, 3);
  // 水塔
  const tower = tx => { x.fillStyle = '#6c7a86'; x.fillRect(tx - 14, H - 96, 28, 34); x.fillStyle = '#8e9ca8'; x.fillRect(tx - 14, H - 96, 28, 6); x.fillStyle = '#4b5560'; x.fillRect(tx - 12, H - 62, 3, 16); x.fillRect(tx + 9, H - 62, 3, 16); };
  tower(30); tower(W - 30);
  if (lv >= 3) {
    const big = lv >= 5, gx0 = big ? 18 : 80, gx1 = big ? W - 18 : W - 80, gy = H - (big ? 128 : 118);
    x.fillStyle = big ? 'rgba(255,214,150,0.22)' : 'rgba(190,230,255,0.18)'; x.fillRect(gx0, gy + 20, gx1 - gx0, H - 46 - gy - 18);
    x.beginPath(); x.moveTo(gx0, gy + 20); x.lineTo((gx0 + gx1) / 2, gy); x.lineTo(gx1, gy + 20); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(240,250,255,0.75)'; x.lineWidth = 1.5;
    x.strokeRect(gx0, gy + 20, gx1 - gx0, H - 46 - gy - 18);
    x.beginPath(); x.moveTo(gx0, gy + 20); x.lineTo((gx0 + gx1) / 2, gy); x.lineTo(gx1, gy + 20); x.stroke();
    for (let i = gx0; i < gx1; i += 26) { x.beginPath(); x.moveTo(i, gy + 20); x.lineTo(i, H - 28); x.stroke(); }
  }
  if (lv >= 2) {
    x.strokeStyle = '#3a2f3c'; x.lineWidth = 1; x.beginPath();
    for (let i = 0; i <= 20; i++) { const k = i / 20, px = 10 + k * (W - 20), py = 28 + Math.abs(Math.sin(k * Math.PI * 3)) * 10; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
    for (let i = 0; i <= 20; i++) { const k = i / 20, px = 10 + k * (W - 20), py = 28 + Math.abs(Math.sin(k * Math.PI * 3)) * 10; x.fillStyle = i % 2 ? '#ffd27a' : '#ff9fcb'; x.beginPath(); x.arc(px, py + 3, 2.4, 0, 7); x.fill(); }
  }
  if (lv >= 4) { x.fillStyle = 'rgba(220,120,255,0.14)'; x.fillRect(0, 0, W, H); }
  // 花架和盆栽
  const pots = gardenPots(run);
  if (lv >= 1) { x.fillStyle = '#8a5a34'; x.fillRect(14, H - 30, W - 28, 6); x.fillStyle = '#6a4224'; x.fillRect(14, H - 24, W - 28, 2); }
  const cols = Math.min(8, Math.max(3, pots > 8 ? 8 : pots)), rows = pots > 8 ? 2 : 1;
  for (let i = 0; i < pots; i++) {
    const r = Math.floor(i / 8), c = i % 8, n = Math.min(8, pots - r * 8);
    const px = W / 2 + (c - (n - 1) / 2) * 36, py = H - 30 - (rows === 2 && r === 1 ? 26 : 0) - (rows === 2 && r === 0 ? -6 : 0);
    const a = gardenPlotArt(run, g.plots[i]) || toonSprout(-1), img = a.img;
    const hh = 50, s = hh / img.height, w = img.width * s;
    x.drawImage(img, px - w / 2, py - hh + 4, w, hh);
  }
  if (!lv) { x.fillStyle = 'rgba(255,255,255,0.75)'; x.font = '14px sans-serif'; x.textAlign = 'center'; x.fillText('空空的頂樓', W / 2, H - 20); }
  void cols;
}
