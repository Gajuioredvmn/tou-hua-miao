// ================= 被發現時的賣萌小遊戲 =================
// 選一招（翻肚／蹭腳／喵喵叫），從那一招的五種小遊戲裡隨機抽一種來玩（最近玩過的不會再抽到），一次撒嬌只玩一個。
// 開始前有準備時間（說明＋手勢示範），計時才開始；拍子、位置、速度每次都隨機。
// 鄰居越吃哪一招（白天偷聽到的喜好、萌力升級），判定就越寬鬆。橘貓在旁邊的話，失敗時牠會救場，再玩一次。
const CUTE_KINDS = {
  meow: ['beat', 'morse', 'hearts', 'blink', 'chorus'],
  belly: ['hold', 'mash', 'circle', 'laser', 'knead'],
  rub: ['swipe', 'follow', 'simon', 'pet', 'yarn'],
};
const CUTE_TITLE = {
  beat: '跟著拍子喵', morse: '長短喵', hearts: '點愛心', blink: '慢慢眨眼', chorus: '喵喵合唱',
  hold: '翻肚時機', mash: '連打翻身', circle: '扭扭畫圈', laser: '追雷射光點', knead: '踩踩揉揉',
  swipe: '蹭蹭來回', follow: '黏著腳走', simon: '記住蹭法', pet: '討摸摸', yarn: '撥毛線球',
};
const CUTE_HELP = {
  beat: '跟著拍子點！', morse: '照著長短喵：點一下短、按住長', hearts: '點冒出來的愛心！',
  blink: '鄰居閉眼時，你也按住閉眼', chorus: '上下拖，讓貓唱到音符那一行',
  hold: '按住翻肚，在粉紅區放開！', mash: '連打！一口氣翻過去！', circle: '在畫面上畫圈圈，扭扭身體！',
  laser: '點紅點！撲到雷射光點', knead: '左右輪流點，穩穩的踩踩',
  swipe: '左右來回滑！', follow: '左右拖，黏著鄰居的腳！', simon: '記住順序，照著左右蹭！',
  pet: '左右拖貓頭，手拍下來時要在下面', yarn: '箭頭對準鄰居的腳時點，撥出毛線球',
};
const CUTE_KEYS = {
  beat: '鍵盤：空白鍵', morse: '鍵盤：點一下／按住空白鍵', hearts: '鍵盤：愛心出現時按空白鍵',
  blink: '鍵盤：按住空白鍵', chorus: '鍵盤：↑ ↓',
  hold: '鍵盤：按住空白鍵', mash: '鍵盤：連打空白鍵', circle: '鍵盤：照 ↑ → ↓ ← 轉圈',
  laser: '鍵盤：方向鍵移動肉球，空白鍵撲', knead: '鍵盤：← → 輪流',
  swipe: '鍵盤：← → 交替', follow: '鍵盤：按住 ← →', simon: '鍵盤：← →',
  pet: '鍵盤：按住 ← →', yarn: '鍵盤：空白鍵',
};
// 喵喵叫的拍子（秒）：兩小節，五到六拍
const MEOW_BEATS = [
  [0.6, 1.0, 1.4, 2.0, 2.4], [0.6, 1.2, 1.5, 1.8, 2.4], [0.55, 0.95, 1.55, 1.95, 2.55],
  [0.6, 0.9, 1.2, 1.8, 2.1, 2.4], [0.7, 1.3, 1.6, 2.2, 2.5], [0.6, 1.05, 1.5, 1.75, 2.0, 2.6],
];
const MEOW_WORDS = [['喵！', '喵～', '喵嗚'], ['喵喵！', '招財喵', '喵～'], ['咪？', '喵嗚？', '咪～']];
const CUTE_WIN_WORD = ['萌翻了！', '可愛到犯規！', '被萌倒了！', '心都化了！', '這誰受得了！'];
const CUTE_GAG = {
  crack: '喵……咳咳！', wrong: '喵得亂七八糟……', missed: '愛心都飛走了……', fooled: '被假眨眼騙了……', stare: '一直瞪著人家……', offkey: '唱走音了……',
  over: '翻過頭了……', idle: '……發呆了', early: '翻不過去……', tired: '翻不動了……', dizzy: '扭到頭暈……', laser: '光點跑掉了……', sleepy: '踩到睡著了……',
  slip: '腳一滑……', lost: '跟丟了……', forget: '忘記順序了……', nopet: '沒摸到……', yarn: '毛線球滾歪了……',
};
const CUTE_FACE_WIN = { wang: 'heart', lin: 'blush', bo: 'tears', patrol: 'phone', butler: 'phone', party: 'meat' };
const CUTE_LAST = {};
const CUTE_SEEN = new Set();   // 看過說明的玩法：準備時間短一點
const pick = a => (Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const TAU = Math.PI * 2;

class CuteGame {
  constructor(move, who, faceKey, p, opt = {}) {
    this.move = move; this.who = who; this.faceKey = faceKey; this.p = p;
    // 橘貓在旁邊：失敗時牠會跳出來救場，再玩一次
    this.assist = !!opt.assist; this.assistUsed = false; this.retry = false; this.assistMeow = false;
    // 從這一招的五種裡抽一種，最近兩次玩過的不抽；force 是測試用
    const recent = CUTE_LAST[move] || [];
    let pool = CUTE_KINDS[move].filter(k => !recent.includes(k));
    if (!pool.length) pool = CUTE_KINDS[move].filter(k => k !== recent[0]);
    if (!pool.length) pool = CUTE_KINDS[move];
    this.kind = CuteGame.force && CUTE_KINDS[move].includes(CuteGame.force) ? CuteGame.force : pick(pool);
    CUTE_LAST[move] = [this.kind].concat(recent).slice(0, 2);
    let v = Math.floor(Math.random() * 3);
    if (CUTE_LAST[move + 'v'] === v) v = (v + 1 + Math.floor(Math.random() * 2)) % 3;
    CUTE_LAST[move + 'v'] = v; this.v = v;
    this.bgv = Math.floor(Math.random() * 3);
    this.t = 0; this.pt = 0; this.tries = 0;
    this.ok = null; this.perfect = false; this.done = false; this.gag = null; this.word = '';
    this.pops = []; this.notes = []; this.hearts = [];
    this.open = 0; this.reward = null; this.broke = 0; this.flash = 0;
    this.uiScale = 1;
    this.start();
    this.phase = 'intro'; this.pt = 0;
  }
  get playing() { return this.phase === 'play'; }
  get roundSub() { return this.retry ? '橘貓救場・再玩一次！' : ''; }
  // 開始（或救場後重來）：重新擲一次參數
  start() {
    this.tries++;
    this.rok = null; this.gag = null; this.word = '';
    this.r = 0; this.rT = 0; this.wig = 0; this.open = 0;
    this.uiRect = null; this.trackRect = null; this.laneRect = null; this.dragging = false; this.kx = 0; this.ky = 0;
    this.limit = 3;
    CUTE_KIND[this.kind].init(this, this.p);
    this.readyT = CUTE_SEEN.has(this.kind) ? 1.05 : 1.75;
    CUTE_SEEN.add(this.kind);
    this.phase = 'ready'; this.pt = 0;
  }
  // ---- 輸入：down / up / move（手指、滑鼠），key / keyup（鍵盤）----
  input(type, a) {
    if (this.phase === 'ready') {
      // 準備時間按一下可以直接開始
      if ((type === 'down' || type === 'key') && this.pt > 0.3) this.pt = Math.max(this.pt, this.readyT - 0.12);
      return true;
    }
    if (this.phase !== 'play') return true;
    const K = CUTE_KIND[this.kind];
    if (type === 'key' || type === 'keyup') {
      const k = a, down = type === 'key';
      if (k === ' ' || k === 'enter' || k === 'e') { K.input(this, down ? 'down' : 'up', { key: true }); return true; }
      const ar = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down' }[k];
      if (ar) {
        // 方向鍵按住的狀態（有些玩法用）
        if (ar === 'left' || ar === 'right') this.kx = down ? (ar === 'left' ? -1 : 1) : (this.kx === (ar === 'left' ? -1 : 1) ? 0 : this.kx);
        else this.ky = down ? (ar === 'up' ? -1 : 1) : (this.ky === (ar === 'up' ? -1 : 1) ? 0 : this.ky);
        K.input(this, down ? 'arrow' : 'arrowUp', ar); return true;
      }
      return false;
    }
    K.input(this, type, a);
    return true;
  }
  // 手指位置換成畫面座標
  pos(a) { return a && a.clientX !== undefined ? { x: a.clientX / this.uiScale, y: a.clientY / this.uiScale } : null; }
  // ---- 共用的小反應 ----
  meow(long, pitch) {
    this.open = 1;
    const f = pitch || 640 + this.v * 60 + Math.random() * 60;
    SFX.tone(f, long ? 0.5 : 0.2, { to: long ? f * 0.88 : f * 0.78, vol: 0.18, type: 'sawtooth', vib: 8 });
    this.notes.push({ x: this.v === 1 ? 50 : 56, y: 26, t: 0, w: long ? '喵～～' : pick(MEOW_WORDS[this.v]) });
  }
  purr(d = 0) {
    SFX.noise(0.12, { vol: 0.1, freq: 320 });
    this.hearts.push({ x: 58 + d * 4, y: 30, t: 0, s: 0.6 + Math.random() * 0.4 });
  }
  judge(j, text, x, y) {
    const T = { perfect: ['讚！', '#ffe27a'], good: ['不錯', '#ffffff'], miss: ['走音', '#b8b3d8'] }[j];
    this.pops.push({ text: text || T[0], col: T[1], t: 0, where: 'ui', x, y });
    if (j === 'perfect') { SFX.tone(1568, 0.08, { vol: 0.1, type: 'triangle' }); SFX.tone(2093, 0.12, { delay: 0.05, vol: 0.09, type: 'triangle' }); }
    else if (j === 'good') SFX.tone(1320, 0.06, { vol: 0.08, type: 'triangle' });
    else SFX.play('nope');
  }
  panelPop(text, x, y, col = '#ff86a8') { this.pops.push({ text, col, t: 0, where: 'panel', x, y }); }
  burst(n) { for (let i = 0; i < n; i++) this.hearts.push({ x: 40 + Math.random() * 30, y: 30 + Math.random() * 10, t: -i * 0.08, s: 0.8 + Math.random() * 0.5 }); }
  gagSfx(gag) {
    if (gag === 'over' || gag === 'slip' || gag === 'dizzy' || gag === 'yarn') SFX.tone(300, 0.3, { to: 110, vol: 0.16, type: 'square' });
    else if (gag === 'crack' || gag === 'wrong' || gag === 'offkey') SFX.tone(900, 0.18, { to: 280, vol: 0.14, type: 'square' });
    else SFX.play('nope');
  }
  // 小遊戲結束（各玩法呼叫這個）
  finish(ok, perfect, gag) {
    if (this.phase !== 'play') return;
    if (!ok && this.assist && !this.assistUsed) {
      // 橘貓救場：等一下再玩一次
      this.assistUsed = true; this.rok = false; this.gag = gag;
      this.phase = 'assist'; this.pt = 0; this.word = CUTE_GAG[gag] || '失手了……';
      this.gagSfx(gag);
      return;
    }
    this.ok = ok; this.perfect = !!(ok && perfect); this.gag = ok ? null : gag; this.rok = ok;
    this.phase = 'result'; this.pt = 0;
    this.word = ok ? (this.perfect ? '完美！' : pick(CUTE_WIN_WORD)) : CUTE_GAG[gag] || '失手了……';
    if (ok) { this.burst(this.perfect ? 9 : 6); this.flash = 0.3; }
    else this.gagSfx(gag);
  }
  update(dt) {
    this.t += dt; this.pt += dt;
    this.open = Math.max(0, this.open - dt * 3.2);
    this.wig = Math.max(0, this.wig - dt * 1.5);
    this.r += (this.rT - this.r) * Math.min(1, dt * 14);
    if (this.flash > 0) this.flash -= dt;
    for (const n of this.notes) n.t += dt; this.notes = this.notes.filter(n => n.t < 1.1);
    for (const q of this.pops) q.t += dt; this.pops = this.pops.filter(q => q.t < 0.9);
    for (const h of this.hearts) h.t += dt; this.hearts = this.hearts.filter(h => h.t < 1.2);
    if (this.phase === 'intro') { if (this.pt >= 0.35) { this.phase = 'ready'; this.pt = 0; } }
    else if (this.phase === 'ready') { if (this.pt >= this.readyT) { this.phase = 'play'; this.pt = 0; SFX.tone(988, 0.07, { vol: 0.1, type: 'square' }); SFX.tone(1480, 0.12, { delay: 0.08, vol: 0.1, type: 'square' }); } }
    else if (this.phase === 'play') { CUTE_KIND[this.kind].update(this, dt); if (this.phase === 'play' && this.pt > this.limit + 0.5) this.finish(false, false, 'idle'); }
    else if (this.phase === 'assist') {
      if (!this.assistMeow && this.pt >= 0.5) { this.assistMeow = true; SFX.play('meow'); this.burst(3); }
      if (this.pt >= 1.8) { this.retry = true; this.start(); }
    }
    else if (this.phase === 'result') { if (this.pt >= 1.9) { this.phase = 'outro'; this.pt = 0; } }
    else if (this.phase === 'outro') { if (this.pt >= 0.28) this.done = true; }
    return this.done;
  }
  progress() { return CUTE_KIND[this.kind].progress(this); }
  faceExpr() {
    const stoic = this.who === 'lin' || this.who === 'butler';
    const upset = g => (['over', 'slip', 'dizzy', 'lost', 'yarn'].includes(g) ? 'shock' : 'angry');
    if (this.phase === 'result' || this.phase === 'outro') return this.ok ? (CUTE_FACE_WIN[this.who] || 'heart') : upset(this.gag);
    if (this.phase === 'assist') return this.pt > 0.6 ? (stoic ? 'neutral' : 'smile') : 'shock';
    if (this.phase !== 'play') return this.retry && !stoic ? 'smile' : 'neutral';
    const pr = this.progress();
    if (stoic) return pr > 0.75 ? 'blush' : 'neutral';
    return pr > 0.75 ? 'heart' : pr > 0.35 ? 'smile' : 'neutral';
  }
  mood() {
    if (this.phase === 'result' || this.phase === 'outro') return this.ok ? 'happy' : 'fail';
    if (this.phase === 'assist') return 'fail';
    return 'play';
  }
  artState() {
    const mood = this.mood(), st = CUTE_KIND[this.kind].art(this, mood);
    st.t = this.t; st.v = st.v !== undefined ? st.v : this.v; st.mood = mood;
    return st;
  }
  drawArt(pen, k) {
    const st = this.artState();
    const am = cuteArtMove(this.move);
    return am === 'meow' ? drawMeowArt2(st, pen, k) : am === 'belly' ? drawBellyArt2(st, pen, k) : drawRubArt2(st, this.who, pen, k);
  }
}

// ---------------------------------------------------------------
// 十五種玩法
// ---------------------------------------------------------------
const meowArt = (g, mood) => ({ open: mood === 'happy' ? 0.5 + Math.sin(g.t * 10) * 0.3 : g.open, blink: Math.floor(g.t * 2.3) % 9 === 4 });
const CUTE_KIND = {
  // ---- 喵喵叫 1：跟拍子（縮小的圈圈碰到肉球時點）----
  beat: {
    init(g, p) {
      const pat = MEOW_BEATS[Math.floor(Math.random() * MEOW_BEATS.length)], k = 0.92 + Math.random() * 0.16;
      g.beats = pat.map(t => ({ t: t * k, j: null }));
      g.win = lerp(0.055, 0.15, p);
      g.limit = g.beats[g.beats.length - 1].t + g.win + 0.3;
    },
    input(g, type) {
      if (type !== 'down') return;
      g.meow();
      let best = null, bd = 9;
      for (const b of g.beats) if (!b.j) { const d = Math.abs(g.pt - b.t); if (d < bd) { bd = d; best = b; } }
      if (best && bd <= 0.3) { best.j = bd <= g.win * 0.5 ? 'perfect' : bd <= g.win ? 'good' : 'miss'; g.judge(best.j); }
    },
    update(g) {
      for (const b of g.beats) if (!b.j && g.pt > b.t + g.win) { b.j = 'miss'; g.judge('miss'); }
      const last = g.beats[g.beats.length - 1];
      if (g.beats.every(b => b.j) && g.pt > last.t + 0.15) {
        const sc = g.beats.reduce((s, b) => s + (b.j === 'perfect' ? 1 : b.j === 'good' ? 0.7 : 0), 0) / g.beats.length;
        g.finish(sc >= 0.6, g.beats.every(b => b.j === 'perfect'), 'crack');
      }
    },
    progress: g => g.beats.reduce((s, b) => s + (b.j === 'perfect' ? 1 : b.j === 'good' ? 0.7 : 0), 0) / g.beats.length,
    art: meowArt,
    ui(g, c, ux, B) {
      const tx = ux, ty = B + 56, R = 24, SP = 60;
      c.fillStyle = 'rgba(255,214,90,0.18)'; c.beginPath(); c.arc(tx, ty, R + g.win * SP, 0, TAU); c.arc(tx, ty, Math.max(4, R - g.win * SP), 0, TAU, true); c.fill();
      cutePaw(c, tx, ty, R);
      for (const b of g.beats) {
        if (b.j) continue;
        const dtb = b.t - g.pt;
        if (dtb > 0.6 || dtb < -g.win) continue;
        c.strokeStyle = Math.abs(dtb) <= g.win ? '#ff4a88' : '#ffd25a'; c.lineWidth = 5; c.globalAlpha = Math.min(1, (0.6 - dtb) / 0.15); c.beginPath(); c.arc(tx, ty, R + Math.max(0, dtb) * SP, 0, TAU); c.stroke(); c.globalAlpha = 1;
      }
      const n = g.beats.length;
      g.beats.forEach((b, i) => { c.fillStyle = b.j === 'perfect' ? '#ffd25a' : b.j === 'good' ? '#fff6e8' : b.j === 'miss' ? '#5a5478' : 'rgba(255,255,255,0.25)'; c.strokeStyle = CM.ink; c.lineWidth = 2.5; c.beginPath(); c.arc(tx - (n - 1) * 11 + i * 22, ty + SP + 8, 6.5, 0, TAU); c.fill(); c.stroke(); });
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, tx + 60, ty - 6 - q.t * 18, q.text, q.col, 20, 1 - q.t / 0.9);
    },
  },
  // ---- 喵喵叫 2：長短喵（點一下是短喵、按住是長喵）----
  morse: {
    init(g, p) {
      const len = p >= 0.55 ? 4 : p >= 0.25 ? 5 : 6;
      let seq;
      do { seq = Array.from({ length: len }, () => (Math.random() < 0.5 ? 'S' : 'L')); } while (!seq.includes('S') || !seq.includes('L'));
      g.seq = seq; g.mi = 0; g.mres = []; g.pressT = null; g.longSnd = false;
      g.longMin = lerp(0.5, 0.38, p); g.longMax = g.longMin + lerp(0.28, 0.5, p); g.shortMax = lerp(0.24, 0.33, p);
      g.limit = 1.2 + len * 0.95;
    },
    input(g, type) {
      if (type === 'down' && g.pressT === null && g.mi < g.seq.length) { g.pressT = g.pt; g.meow(false); g.longSnd = false; }
      else if (type === 'up' && g.pressT !== null) {
        const d = g.pt - g.pressT; g.pressT = null;
        const got = d >= g.longMin ? (d <= g.longMax ? 'L' : 'T') : d <= g.shortMax ? 'S' : '?';
        const ok = got === g.seq[g.mi];
        g.mres.push(ok); g.judge(ok ? 'good' : 'miss', ok ? (got === 'L' ? '長～' : '短！') : (got === '?' ? '不長不短' : got === 'T' ? '太長了' : '不對'));
        g.mi++;
        if (g.mi >= g.seq.length) CUTE_KIND.morse.end(g);
      }
    },
    end(g) {
      while (g.mres.length < g.seq.length) g.mres.push(false);
      const good = g.mres.filter(Boolean).length;
      g.finish(good >= g.seq.length - 1, good === g.seq.length, 'wrong');
    },
    update(g) {
      if (g.pressT !== null) { g.open = 1; if (!g.longSnd && g.pt - g.pressT >= g.longMin) { g.longSnd = true; g.meow(true); } }
      if (g.pt > g.limit) CUTE_KIND.morse.end(g);
    },
    progress: g => g.mres.filter(Boolean).length / g.seq.length,
    art: meowArt,
    ui(g, c, ux, B) {
      const n = g.seq.length, gap = 52, y = B + 34;
      g.seq.forEach((sym, i) => {
        const x = ux - (n - 1) * gap / 2 + i * gap, cur = i === g.mi && g.playing;
        const res = g.mres[i];
        const fill = res === true ? '#9fe8a8' : res === false ? '#5a5478' : cur ? '#fff6b8' : '#fff6e8';
        c.fillStyle = fill; c.strokeStyle = cur ? '#ffd25a' : CM.ink; c.lineWidth = cur ? 4.5 : 3;
        if (sym === 'S') { c.beginPath(); c.arc(x, y, 11 * (cur ? 1 + Math.sin(g.t * 9) * 0.06 : 1), 0, TAU); c.fill(); c.stroke(); }
        else {
          CM.rr(c, x - 20, y - 9, 40, 18, 9); c.fill(); c.stroke();
          if (cur && g.pressT !== null) {
            const d = g.pt - g.pressT, k = Math.min(1, d / g.longMin);
            c.fillStyle = d > g.longMax ? '#ff5a4a' : k >= 1 ? '#ff86a8' : '#ffd25a'; CM.rr(c, x - 17, y - 6, 34 * k, 12, 6); c.fill();
            if (k >= 1) CM.text(c, x, y - 22, d > g.longMax ? '太長！' : '放！', d > g.longMax ? '#ff7a6a' : '#ff86a8', 15, 1);
          }
        }
        if (cur && sym === 'S' && g.pressT !== null) { c.fillStyle = (g.pt - g.pressT) > g.shortMax ? '#ff7a6a' : '#ffd25a'; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); }
      });
      CM.text(c, ux, y + 30, '●＝點一下　━＝按住，變粉紅就放', '#b8b3d8', 13, 0.9, { weight: 700 });
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, ux, y + 60 - q.t * 10, q.text, q.col, 19, 1 - q.t / 0.9);
    },
  },
  // ---- 喵喵叫 3：點愛心（一顆一顆冒出來，快點下去）----
  hearts: {
    init(g, p) { g.hn = 6; g.hneed = p >= 0.6 ? 4 : 5; g.hlife = lerp(0.75, 1.1, p); g.hList = []; g.hNext = 0.2; g.hHits = 0; g.hDone = 0; g.limit = 0.6 + g.hn * (g.hlife + 0.12) + 0.3; },
    live(g) { return g.hList.find(h => !h.done); },
    hit(g, h) { h.done = true; h.hit = true; g.hHits++; g.hDone++; g.hNext = 0.1; const fast = h.t < g.hlife * 0.45; g.judge(fast ? 'perfect' : 'good', fast ? '秒點！' : '喵到了', h.sx, h.sy); for (let i = 0; i < 2; i++) g.hearts.push({ x: 50 + Math.random() * 20, y: 30, t: -i * 0.06, s: 0.7 }); },
    input(g, type, a) {
      if (type !== 'down') return;
      g.meow();
      const h = CUTE_KIND.hearts.live(g); if (!h) return;
      if (a && a.key) { if (h.t > 0.12) CUTE_KIND.hearts.hit(g, h); return; }
      const p = g.pos(a);
      if (p && h.sx !== undefined && Math.hypot(p.x - h.sx, p.y - h.sy) < h.sr * 1.35) CUTE_KIND.hearts.hit(g, h);
    },
    update(g, dt) {
      g.hNext -= dt;
      const live = CUTE_KIND.hearts.live(g);
      if (!live && g.hNext <= 0 && g.hList.length < g.hn) {
        let u, v, tries = 0;
        do { u = 0.12 + Math.random() * 0.76; v = 0.18 + Math.random() * 0.64; tries++; } while (tries < 8 && g.hList.length && Math.hypot(u - g.hList[g.hList.length - 1].u, (v - g.hList[g.hList.length - 1].v) * 0.6) < 0.25);
        g.hList.push({ u, v, t: 0, done: false, hit: false });
        SFX.tone(980, 0.05, { vol: 0.06, type: 'triangle' });
      }
      for (const h of g.hList) if (!h.done) { h.t += dt; if (h.t > g.hlife) { h.done = true; g.hDone++; g.hNext = 0.12; g.judge('miss', '飛走了', h.sx, h.sy); } }
      if (g.hHits >= g.hneed) g.finish(true, g.hDone === g.hHits);
      else if (g.hDone - g.hHits > g.hn - g.hneed) g.finish(false, false, 'missed');
    },
    progress: g => g.hHits / g.hneed,
    art: meowArt,
    ui(g, c, ux, B, pw) {
      const w = pw * 0.86, h = 120, x0 = ux - w / 2, y0 = B + 2;
      g.uiRect = { x: x0, y: y0, w, h };
      c.fillStyle = 'rgba(255,246,232,0.08)'; CM.rr(c, x0, y0, w, h, 14); c.fill();
      c.strokeStyle = 'rgba(255,246,232,0.25)'; c.lineWidth = 2; c.setLineDash([6, 6]); CM.rr(c, x0, y0, w, h, 14); c.stroke(); c.setLineDash([]);
      for (const ht of g.hList) {
        const sx = x0 + ht.u * w, sy = y0 + ht.v * h;
        ht.sx = sx; ht.sy = sy; ht.sr = 26;
        if (ht.done && !ht.hit) continue;
        if (ht.done) { const k = Math.min(1, (g.t - (ht.doneT || (ht.doneT = g.t))) / 0.3); if (k < 1) CM.emote(c, sx, sy + 14, 'heart', 1.4 + k, 1 - k); continue; }
        const left = 1 - ht.t / g.hlife, pop = Math.min(1, ht.t / 0.12);
        c.strokeStyle = left > 0.35 ? '#ffd25a' : '#ff6a5a'; c.lineWidth = 4; c.beginPath(); c.arc(sx, sy, 26, -Math.PI / 2, -Math.PI / 2 + TAU * left); c.stroke();
        CM.emote(c, sx, sy + 13, 'heart', 1.25 * pop, 1);
      }
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, q.x !== undefined ? clamp(q.x, x0 + 30, x0 + w - 30) : ux, (q.y !== undefined ? Math.max(y0 + 22, q.y - 34) : y0 + h / 2) - q.t * 14, q.text, q.col, 18, 1 - q.t / 0.9);
      CM.text(c, ux, y0 + h + 16, `${g.hHits} / ${g.hneed}`, '#ffffff', 16, 1);
    },
  },
  // ---- 翻肚 1：按住，在粉紅區放開（要翻兩次，第二次粉紅區會換位置）----
  hold: {
    init(g, p) { g.fill = 0; g.holding = false; g.inZone = false; g.zw = lerp(0.16, 0.34, p); g.flips = 0; g.flipNeed = 2; g.flipPerf = 0; CUTE_KIND.hold.zone(g); g.limit = 4.4; },
    zone(g) { let z; do { z = 0.95 - Math.random() * 0.16; } while (g.zTop !== undefined && g.flips > 0 && Math.abs(z - g.zTop) < 0.06); g.zTop = z; g.z0 = z - g.zw; },
    input(g, type) {
      if (type === 'down') g.holding = true;
      else if (type === 'up' && g.holding) {
        g.holding = false;
        if (g.fill >= g.z0 && g.fill <= g.zTop) {
          const mid = (g.z0 + g.zTop) / 2, perf = Math.abs(g.fill - mid) < g.zw * 0.22;
          g.flips++; if (perf) g.flipPerf++;
          if (g.flips >= g.flipNeed) { g.finish(true, g.flipPerf === g.flips); return; }
          // 翻過去一次：滾回來，粉紅區換位置再翻一次
          g.purr(); g.burst(2); g.panelPop(pick(['翻！', '再一次！']), 66, 16, '#ffb36b');
          g.pops.push({ text: perf ? '漂亮！' : '翻過去了！', col: '#ffe27a', t: 0, where: 'ui' });
          SFX.tone(1320, 0.06, { vol: 0.09, type: 'triangle' }); SFX.tone(1760, 0.08, { delay: 0.06, vol: 0.08, type: 'triangle' });
          CUTE_KIND.hold.zone(g);
        }
        else if (g.fill < g.z0) { g.pops.push({ text: '還不夠！', col: '#ffffff', t: 0, where: 'ui' }); SFX.play('nope'); }
        else g.finish(false, false, 'over');   // 放太晚：翻過頭
      }
    },
    update(g, dt) {
      if (g.holding) { g.fill += (0.5 + 0.42 * g.fill) * dt; if (g.fill > 1.03) { g.finish(false, false, 'over'); return; } }
      else g.fill = Math.max(0, g.fill - dt * 1.7);
      const inZ = g.fill >= g.z0 && g.fill <= g.zTop;
      if (inZ && !g.inZone) SFX.tone(1320, 0.05, { vol: 0.08, type: 'triangle' });
      g.inZone = inZ;
      if (g.pt > g.limit) g.finish(false, false, g.fill > 0.05 || g.flips ? 'early' : 'idle');
    },
    progress: g => (g.flips + (g.inZone ? 0.8 : g.fill / Math.max(0.1, g.z0) * 0.5)) / g.flipNeed,
    art(g, mood) {
      const mid = (g.z0 + g.zTop) / 2;
      let p = g.fill / mid;
      if (mood === 'happy') p = 1; else if (mood === 'fail') p = g.gag === 'over' ? 1.35 : Math.min(0.5, p);
      return { p, open: mood === 'happy' ? 0.4 : (g.inZone ? 0.2 : 0) };
    },
    ui(g, c, ux, B, pw, W, fade) {
      const bw = pw * 0.8, bh = 22, bx = ux - bw / 2, by = B + 20;
      c.fillStyle = CM.ink; CM.rr(c, bx - 4, by - 4, bw + 8, bh + 8, 14); c.fill();
      c.fillStyle = '#3a3555'; CM.rr(c, bx, by, bw, bh, 11); c.fill();
      c.fillStyle = '#ff7aa8'; c.fillRect(bx + bw * g.z0, by, bw * g.zw, bh);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(bx + bw * (g.z0 + g.zw * 0.39), by, bw * g.zw * 0.22, bh);
      c.fillStyle = g.inZone ? '#fff2a8' : '#ffd25a'; CM.rr(c, bx, by + 3, Math.max(6, bw * Math.min(1, g.fill)), bh - 6, 8); c.fill();
      c.fillStyle = '#fff'; c.fillRect(bx + bw * Math.min(1, g.fill) - 2, by - 5, 4, bh + 10);
      CM.text(c, bx + bw + 2, by - 12, '翻過頭', '#ff9a9a', 12, 0.8, { align: 'right' });
      // 翻了幾次
      for (let i = 0; i < g.flipNeed; i++) CM.emote(c, bx + 10 + i * 22, by - 4, 'heart', 0.62, i < g.flips ? 1 : 0.28);
      if (!g.holding) { const pu = 0.85 + Math.sin(g.t * 8) * 0.15; CM.text(c, ux, by + bh + 26, g.flips ? '再按住一次！' : '按住！', '#ffffff', Math.round(20 * pu), fade); }
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, ux, by + bh + 56 - q.t * 10, q.text, q.col, 18, 1 - q.t / 0.9);
    },
  },
  // ---- 翻肚 2：連打（每點一下翻多一點，停下來會慢慢翻回去）----
  mash: {
    // 一秒大約要點 6 下（萌力高時 4～5 下就夠）
    init(g, p) { g.roll = 0; g.per = lerp(0.09, 0.16, p); g.taps = 0; g.limit = 3.4; g.tapT = -9; },
    input(g, type) {
      if (type !== 'down') return;
      g.roll = Math.min(1.05, g.roll + g.per); g.taps++; g.tapT = g.t;
      SFX.tone(420 + g.roll * 500, 0.05, { vol: 0.08, type: 'triangle' });
      if (g.taps % 3 === 0) g.panelPop(pick(['翻！', '嘿！', '咻！']), 30 + Math.random() * 40, 14 + Math.random() * 10, '#ffb36b');
      if (g.roll >= 1) g.finish(true, g.pt < g.limit - 1.2);
    },
    update(g, dt) { g.roll = Math.max(0, g.roll - dt * 0.3); if (g.pt > g.limit) g.finish(false, false, 'tired'); },
    progress: g => g.roll,
    art(g, mood) { return { p: mood === 'happy' ? 1 : mood === 'fail' ? 0.3 : g.roll, open: g.t - g.tapT < 0.12 ? 0.3 : 0 }; },
    ui(g, c, ux, B, pw, W, fade) {
      const pu = 1 + (g.t - g.tapT < 0.1 ? 0.12 : 0) + Math.sin(g.t * 12) * 0.03, y = B + 40;
      c.fillStyle = CM.ink; c.beginPath(); c.arc(ux, y, 34 * pu, 0, TAU); c.fill();
      c.fillStyle = '#ffd25a'; c.beginPath(); c.arc(ux, y, 30 * pu, 0, TAU); c.fill();
      CM.text(c, ux, y + 1, '點！', '#5a3010', Math.round(22 * pu), 1, { stroke: '#fff6e8' });
      const bw = pw * 0.7, bx = ux - bw / 2, by = y + 46;
      c.fillStyle = CM.ink; CM.rr(c, bx - 3, by - 3, bw + 6, 16, 8); c.fill();
      c.fillStyle = '#3a3555'; CM.rr(c, bx, by, bw, 10, 5); c.fill();
      c.fillStyle = g.roll > 0.8 ? '#ff86a8' : '#ffd25a'; CM.rr(c, bx, by, Math.max(4, bw * Math.min(1, g.roll)), 10, 5); c.fill();
      CM.text(c, ux + bw / 2 + 24, by + 5, g.taps + '', '#ffffff', 14, fade);
    },
  },
  // ---- 翻肚 3：畫圈圈（在畫面上轉圈，貓就扭來扭去）----
  circle: {
    init(g, p) { g.cneed = Math.round(lerp(5, 3, p)); g.cacc = 0; g.clast = null; g.cprev = null; g.cnt = 0; g.lastArrow = null; g.limit = 5.0; },
    turn(g, d) {
      g.cacc += d; g.wig = Math.min(1.5, g.wig + Math.abs(d) * 0.25);
      const n = Math.floor(Math.abs(g.cacc) / TAU);
      if (n > g.cnt) { g.cnt = n; g.purr(); g.panelPop(pick(['扭～', '扭扭！', '滾滾～']), 60 + Math.random() * 20, 16, '#ffb36b'); SFX.tone(880 + n * 120, 0.08, { vol: 0.08, type: 'triangle' }); if (g.cnt >= g.cneed) g.finish(true, g.pt < g.limit - 1.4); }
    },
    input(g, type, a) {
      if (type === 'down') { const p = g.pos(a); g.cprev = p; g.clast = null; }
      else if (type === 'up') g.cprev = null;
      else if (type === 'move' && g.cprev) {
        const p = g.pos(a); if (!p) return;
        const dx = p.x - g.cprev.x, dy = p.y - g.cprev.y;
        if (Math.hypot(dx, dy) < 5) return;
        const ang = Math.atan2(dy, dx);
        if (g.clast !== null) { let d = ang - g.clast; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; if (Math.abs(d) < 1.6) CUTE_KIND.circle.turn(g, d); }
        g.clast = ang; g.cprev = p;
      } else if (type === 'arrow') {
        const order = ['up', 'right', 'down', 'left'], i = order.indexOf(a), j = order.indexOf(g.lastArrow);
        if (j >= 0) { if ((j + 1) % 4 === i) CUTE_KIND.circle.turn(g, Math.PI / 2); else if ((j + 3) % 4 === i) CUTE_KIND.circle.turn(g, -Math.PI / 2); }
        g.lastArrow = a;
      }
    },
    update(g) { if (g.pt > g.limit) g.finish(false, false, g.cnt > 0 ? 'dizzy' : 'idle'); },
    progress: g => Math.min(1, Math.abs(g.cacc) / TAU / g.cneed),
    art(g, mood) { return { p: mood === 'fail' ? 0.45 : 1, wigAmp: mood === 'happy' ? 1 : 0.4 + g.wig, open: g.wig > 0.8 ? 0.2 : 0, dizzy: g.gag === 'dizzy' }; },
    ui(g, c, ux, B, pw, W, fade) {
      const y = B + 52, R = 40, part = (Math.abs(g.cacc) % TAU) / TAU;
      c.strokeStyle = CM.ink; c.lineWidth = 12; c.beginPath(); c.arc(ux, y, R, 0, TAU); c.stroke();
      c.strokeStyle = '#3a3555'; c.lineWidth = 7; c.beginPath(); c.arc(ux, y, R, 0, TAU); c.stroke();
      const sgn = g.cacc < 0 ? -1 : 1;
      c.strokeStyle = '#ffd25a'; c.lineWidth = 7; c.beginPath(); c.arc(ux, y, R, -Math.PI / 2, -Math.PI / 2 + sgn * TAU * part, sgn < 0); c.stroke();
      // 轉動的箭頭提示
      const a = g.t * 3.2;
      c.save(); c.translate(ux + Math.cos(a) * R, y + Math.sin(a) * R); c.rotate(a + Math.PI / 2);
      c.fillStyle = '#fff6e8'; c.strokeStyle = CM.ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, -7); c.lineTo(-6, 7); c.closePath(); c.fill(); c.stroke(); c.restore();
      CM.text(c, ux, y + 1, `${g.cnt} / ${g.cneed}`, '#ffffff', 20, fade);
    },
  },
  // ---- 蹭腳 1：左右來回滑 ----
  swipe: {
    init(g, p) { g.need = Math.round(lerp(14, 8, p)); g.rubs = 0; g.dir = 0; g.acc = 0; g.lastX = null; g.limit = 3.6; },
    rub(g, d) {
      if (!g.playing || d === g.dir) return;
      g.dir = d; g.rubs++; g.rT = d; g.purr(d);
      g.panelPop('蹭', 52 + d * 14, 20);
      if (g.rubs >= g.need) g.finish(true, g.pt < g.limit - 1.0);
    },
    input(g, type, a) {
      if (type === 'arrow') { if (a === 'left' || a === 'right') CUTE_KIND.swipe.rub(g, a === 'left' ? -1 : 1); return; }
      if (type === 'down') {
        if (a && a.key) { CUTE_KIND.swipe.rub(g, g.dir === 1 ? -1 : 1); return; }
        const x = a && a.clientX !== undefined ? a.clientX : null; g.lastX = x;
        if (x !== null) CUTE_KIND.swipe.rub(g, x < window.innerWidth / 2 ? -1 : 1);
      } else if (type === 'up') g.lastX = null;
      else if (type === 'move' && a && g.lastX !== null) {
        const dx = a.clientX - g.lastX; g.lastX = a.clientX;
        if (Math.sign(dx) !== Math.sign(g.acc)) g.acc = 0;
        g.acc += dx;
        if (Math.abs(g.acc) >= 14) { CUTE_KIND.swipe.rub(g, Math.sign(g.acc)); g.acc = 0; }
      }
    },
    update(g) { if (g.pt > g.limit) g.finish(false, false, 'slip'); },
    progress: g => g.rubs / g.need,
    art(g, mood) { return { r: mood === 'happy' ? Math.sin(g.t * 7) : g.r }; },
    ui(g, c, ux, B, pw, W, fade) {
      const n = g.need, hs = Math.min(26, (pw * 0.86) / n), y = B + 24;
      for (let i = 0; i < n; i++) CM.emote(c, ux - (n - 1) * hs / 2 + i * hs, y + 8, 'heart', hs / 30, i < g.rubs ? 1 : 0.25);
      const ay = y + 40, wob = Math.sin(g.t * 10) * 4;
      CM.text(c, ux - 56 + (g.dir === 1 ? -wob : 0), ay, '◀', g.dir === 1 ? '#ffd25a' : '#fff6e8', 26, fade);
      CM.text(c, ux + 56 + (g.dir === -1 ? wob : 0), ay, '▶', g.dir === -1 ? '#ffd25a' : '#fff6e8', 26, fade);
      CM.text(c, ux, ay, `${g.rubs} / ${n}`, '#ffffff', 18, fade);
    },
  },
  // ---- 蹭腳 2：跟著腳走（鄰居的腳會左右移動，拖著貓黏住它）----
  follow: {
    init(g, p) { g.legX = 0.5; g.catX = Math.random() < 0.5 ? 0.06 : 0.94; g.fmeter = 0;   // 貓從旁邊開始，放著不動不會贏
      g.ftol = lerp(0.1, 0.16, p); g.fspd = lerp(1.1, 0.8, p) * (0.9 + Math.random() * 0.2); g.fph = [Math.random() * 6, Math.random() * 6]; g.fkey = 0; g.aligned = false; g.flost = 0; g.limit = 5.0; },
    input(g, type, a) {
      if (type === 'arrow') { if (a === 'left') g.fkey = -1; else if (a === 'right') g.fkey = 1; return; }
      if (type === 'arrowUp') { if ((a === 'left' && g.fkey < 0) || (a === 'right' && g.fkey > 0)) g.fkey = 0; return; }
      if ((type === 'down' || type === 'move') && a && !a.key && g.trackRect) {
        if (type === 'move' && !g.dragging) return;
        g.dragging = true;
        const p = g.pos(a); g.catX = clamp((p.x - g.trackRect.x) / g.trackRect.w, 0, 1);
      }
      if (type === 'up') g.dragging = false;
    },
    update(g, dt) {
      g.legX = 0.5 + 0.38 * Math.sin(g.pt * 1.8 * g.fspd + g.fph[0]) * (0.65 + 0.35 * Math.sin(g.pt * 3.1 * g.fspd + g.fph[1]));
      if (g.fkey) g.catX = clamp(g.catX + g.fkey * dt * 1.15, 0, 1);
      const al = Math.abs(g.catX - g.legX) < g.ftol;
      if (al && !g.aligned) { g.purr(); SFX.tone(1100, 0.05, { vol: 0.07, type: 'triangle' }); }
      if (!al && g.aligned && g.fmeter > 0.1) g.flost++;
      g.aligned = al;
      g.fmeter = clamp(g.fmeter + (al ? dt / 2.0 : -dt * 0.3), 0, 1);
      if (al && Math.random() < dt * 3) g.purr((g.legX - 0.5) * 2);
      g.rT = al ? Math.sin(g.t * 9) : clamp((g.legX - g.catX) * 4, -1, 1);
      if (g.fmeter >= 1) g.finish(true, g.flost === 0);
      else if (g.pt > g.limit) g.finish(false, false, 'lost');
    },
    progress: g => g.fmeter,
    art(g, mood) { return { r: mood === 'happy' ? Math.sin(g.t * 7) : g.r }; },
    ui(g, c, ux, B, pw, W, fade) {
      const tw = pw * 0.84, tx = ux - tw / 2, ty = B + 50;
      g.trackRect = { x: tx, y: ty - 30, w: tw, h: 60 };
      c.fillStyle = CM.ink; CM.rr(c, tx - 4, ty - 7, tw + 8, 14, 7); c.fill();
      c.fillStyle = '#5a4a6a'; CM.rr(c, tx, ty - 3, tw, 6, 3); c.fill();
      const lx = tx + tw * g.legX;
      // 黏住的範圍
      c.fillStyle = g.aligned ? 'rgba(255,134,168,0.4)' : 'rgba(255,214,90,0.2)'; CM.rr(c, lx - tw * g.ftol, ty - 50, tw * g.ftol * 2, 86, 10); c.fill();
      cuteLeg(c, lx, ty, g.who, 1);
      cuteHead(c, tx + tw * g.catX, ty + 22 + (g.aligned ? Math.sin(g.t * 14) * 2 : 0), g.aligned ? Math.sin(g.t * 9) * 0.15 : clamp((g.legX - g.catX) * 2, -0.4, 0.4), g.aligned, 1);
      const mw = pw * 0.5, mx = ux - mw / 2, my = ty + 50;
      c.fillStyle = CM.ink; CM.rr(c, mx - 3, my - 3, mw + 6, 14, 7); c.fill();
      c.fillStyle = '#3a3555'; CM.rr(c, mx, my, mw, 8, 4); c.fill();
      c.fillStyle = '#ff86a8'; CM.rr(c, mx, my, Math.max(4, mw * g.fmeter), 8, 4); c.fill();
    },
  },
  // ---- 蹭腳 3：記順序（先看左右順序，再照著蹭）----
  simon: {
    init(g, p) {
      const len = p >= 0.55 ? 3 : 4, seq = [];
      for (let i = 0; i < len; i++) { let d = Math.random() < 0.5 ? -1 : 1; if (i >= 2 && seq[i - 1] === d && seq[i - 2] === d) d = -d; seq.push(d); }
      g.sseq = seq; g.ssh = lerp(0.45, 0.6, p); g.si = 0; g.sres = []; g.sphase = 'show'; g.sx0 = null; g.scounted = false; g.slastShow = -1;
      g.showEnd = len * g.ssh + 0.3; g.limit = g.showEnd + 3.5;
    },
    enter(g, d) {
      if (g.sphase !== 'input' || g.si >= g.sseq.length) return;
      const ok = d === g.sseq[g.si];
      g.sres.push(ok); g.si++; g.rT = d; g.purr(d);
      g.judge(ok ? 'good' : 'miss', ok ? '對！' : '錯了');
      if (g.si >= g.sseq.length) CUTE_KIND.simon.end(g);
    },
    end(g) {
      while (g.sres.length < g.sseq.length) g.sres.push(false);
      const bad = g.sres.filter(x => !x).length;
      g.finish(bad === 0, bad === 0 && g.pt < g.showEnd + g.sseq.length * 0.5 + 0.5, 'forget');
    },
    input(g, type, a) {
      if (type === 'arrow') { if (a === 'left' || a === 'right') CUTE_KIND.simon.enter(g, a === 'left' ? -1 : 1); return; }
      if (type === 'down' && a && !a.key) { g.sx0 = a.clientX; g.scounted = false; }
      else if (type === 'move' && a && g.sx0 !== null && !g.scounted) { const dx = a.clientX - g.sx0; if (Math.abs(dx) >= 16) { g.scounted = true; CUTE_KIND.simon.enter(g, Math.sign(dx)); } }
      else if (type === 'up' && a && !a.key) { if (g.sx0 !== null && !g.scounted) CUTE_KIND.simon.enter(g, a.clientX < window.innerWidth / 2 ? -1 : 1); g.sx0 = null; }
    },
    update(g) {
      if (g.sphase === 'show') {
        const i = Math.floor(g.pt / g.ssh);
        if (i !== g.slastShow && i < g.sseq.length) { g.slastShow = i; g.rT = g.sseq[i]; SFX.tone(g.sseq[i] < 0 ? 660 : 880, 0.08, { vol: 0.08, type: 'triangle' }); }
        if (g.pt >= g.showEnd) { g.sphase = 'input'; g.rT = 0; g.pops.push({ text: '換你！', col: '#ffe27a', t: 0, where: 'ui' }); SFX.tone(1320, 0.06, { vol: 0.09, type: 'square' }); }
      }
      if (g.pt > g.limit) CUTE_KIND.simon.end(g);
    },
    progress: g => g.sres.filter(Boolean).length / g.sseq.length,
    art(g, mood) { return { r: mood === 'happy' ? Math.sin(g.t * 7) : g.r }; },
    ui(g, c, ux, B, pw, W, fade) {
      const n = g.sseq.length, gap = 54, y = B + 34;
      const showI = g.sphase === 'show' ? Math.floor(g.pt / g.ssh) : -1;
      g.sseq.forEach((d, i) => {
        const x = ux - (n - 1) * gap / 2 + i * gap;
        const res = g.sres[i], cur = g.sphase === 'input' && i === g.si;
        c.fillStyle = res === true ? '#9fe8a8' : res === false ? '#ff8a8a' : i === showI ? '#ffd25a' : '#fff6e8';
        c.strokeStyle = cur ? '#ffd25a' : CM.ink; c.lineWidth = cur ? 4.5 : 3;
        CM.rr(c, x - 20, y - 20, 40, 40, 10); c.fill(); c.stroke();
        const shown = (g.sphase === 'show' && i <= showI) || res !== undefined;
        CM.text(c, x, y + 1, shown ? (d < 0 ? '◀' : '▶') : '？', shown ? CM.ink : '#8a83a8', 22, 1, { stroke: '#fff6e8' });
      });
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, ux, y + 40 + q.t * 4, q.text, q.col, 20, 1 - q.t / 0.9);
      if (g.sphase === 'show') CM.text(c, ux, y + 40, '記住！', '#ffffff', 16, fade);
    },
  },
  // ---- 喵喵叫 4：慢慢眨眼（貓咪的「我愛你」：鄰居閉眼時你也按住閉眼、睜眼時放開；小心假眨眼）----
  blink: {
    init(g, p) {
      g.btol = lerp(0.14, 0.28, p); g.held = false; g.bOK = 0; g.bFool = 0; g.bDone = 0; g.cur = null;
      const n = 3; let t = 0.5; g.sched = [];
      for (let i = 0; i < n; i++) {
        const wait = rnd(0.7, 1.4);
        if (i > 0 && Math.random() < lerp(0.65, 0.35, p)) g.sched.push({ fake: true, t0: t + wait * 0.3, t1: t + wait * 0.3 + 0.5 });
        t += wait;
        const d = rnd(0.55, 0.9);
        g.sched.push({ t0: t, c0: t + 0.28, c1: t + 0.28 + d, t1: t + 0.56 + d });
        t += 0.56 + d;
      }
      g.bn = n; g.limit = t + 0.7;
    },
    // 鄰居眼皮蓋下來多少：0 張開、1 閉上；假眨眼只會瞇一半
    lid(g) {
      for (const b of g.sched) if (g.pt >= b.t0 && g.pt <= b.t1) {
        if (b.fake) return 0.55 * Math.sin((g.pt - b.t0) / (b.t1 - b.t0) * Math.PI);
        return Math.min(clamp((g.pt - b.t0) / 0.28, 0, 1), clamp((b.t1 - g.pt) / 0.28, 0, 1));
      }
      return 0;
    },
    input(g, type) {
      if (type === 'down' && !g.held) {
        g.held = true;
        const b = g.sched.find(b => !b.fake && !b.j && g.pt >= b.t0 - g.btol && g.pt <= b.c1);
        if (b) { b.pressed = true; g.cur = b; SFX.tone(520, 0.14, { to: 470, vol: 0.08, type: 'sine' }); }
        else if (g.sched.find(b => b.fake && g.pt >= b.t0 && g.pt <= b.t1)) { g.bFool++; g.judge('miss', '被騙了！'); }
        else g.judge('miss', '還沒閉眼喔');
      } else if (type === 'up' && g.held) {
        g.held = false;
        const b = g.cur; g.cur = null;
        if (!b || b.j) return;
        g.bDone++;
        if (g.pt >= b.c1 - g.btol * 0.7 && g.pt <= b.t1 + g.btol) {
          b.j = 'ok'; g.bOK++;
          const pf = Math.abs(g.pt - (b.c1 + 0.14)) < g.btol * 0.5;
          g.judge(pf ? 'perfect' : 'good', pf ? '同步！' : '對上眼了～'); g.purr(); g.burst(2);
        } else { b.j = 'miss'; g.judge('miss', '太早睜眼'); }
      }
    },
    update(g) {
      for (const b of g.sched) if (!b.fake && !b.j && g.pt > b.t1 + g.btol) { b.j = 'miss'; g.bDone++; g.judge('miss', b.pressed ? '睜眼太慢' : '沒跟上'); if (g.cur === b) g.cur = null; }
      if (g.bDone >= g.bn) g.finish(g.bOK === g.bn || (g.bOK >= g.bn - 1 && g.bFool === 0), g.bOK === g.bn && g.bFool === 0, g.bFool ? 'fooled' : 'stare');
    },
    progress: g => g.bOK / g.bn,
    art(g, mood) { return { open: mood === 'happy' ? 0.3 : 0, blink: mood === 'play' && g.held }; },
    panel(g, c, L, T, pw, ph, s) { if (g.held && g.playing) CM.text(c, L + pw * 0.72, T + ph * 0.22, '眨～', '#fff', Math.round(pw * 0.07), 1, { stroke: '#7a5ad8', rot: 0.1 }); },
    ui(g, c, ux, B, pw) {
      // 鄰居的臉放大：看眼睛
      const lid = CUTE_KIND.blink.lid(g), full = lid > 0.97;
      const fc = toonFace(g.faceKey, full ? 'happy' : 'neutral', 0), fs = 116 / (fc.height / TK);
      const fw = fc.width / TK * fs, fh = fc.height / TK * fs, fx0 = ux - fw / 2, fy0 = B - 6;
      c.save(); c.beginPath(); c.arc(ux, fy0 + fh * 0.5, fh * 0.52, 0, TAU); c.fillStyle = 'rgba(255,240,210,0.16)'; c.fill(); c.restore();
      c.drawImage(fc, fx0, fy0, fw, fh);
      if (!full && lid > 0.02) {
        const skin = (PEOPLE[g.faceKey] || PEOPLE.lin).skin;
        for (const ox of [-3.9, 3.9]) {
          const ex = fx0 + (20 + ox) * fs, ey = fy0 + 19.6 * fs, rx = 2.5 * fs, ry = 2.9 * fs, edge = ey - ry + ry * 2 * lid;
          c.save(); c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, 0, TAU); c.clip(); c.fillStyle = skin; c.fillRect(ex - rx, ey - ry, rx * 2, ry * 2 * lid); c.restore();
          c.strokeStyle = CM.ink; c.lineWidth = Math.max(1.6, fs * 0.45); c.beginPath(); c.moveTo(ex - rx * 0.9, edge); c.quadraticCurveTo(ex, edge + ry * 0.35, ex + rx * 0.9, edge); c.stroke();
        }
      }
      // 三次眨眼的結果
      const real = g.sched.filter(b => !b.fake);
      real.forEach((b, i) => { const x = ux + 70 + i * 0, y = B + 18 + i * 26; c.fillStyle = b.j === 'ok' ? '#ff86a8' : b.j === 'miss' ? '#5a5478' : 'rgba(255,255,255,0.25)'; c.strokeStyle = CM.ink; c.lineWidth = 2.5; c.beginPath(); c.arc(ux + pw * 0.36, y, 8, 0, TAU); c.fill(); c.stroke(); if (b.j === 'ok') CM.emote(c, ux + pw * 0.36, y + 6, 'heart', 0.45, 1); });
      CM.text(c, ux - pw * 0.36, B + 30, g.held ? '閉眼中' : '睜眼', g.held ? '#ff86a8' : '#ffffff', 14, 1);
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, ux, B + 120 - q.t * 10, q.text, q.col, 18, 1 - q.t / 0.9);
    },
  },
  // ---- 喵喵叫 5：喵喵合唱（音符從右邊飄過來，上下拖讓貓唱到那一行）----
  chorus: {
    init(g, p) {
      const n = p >= 0.55 ? 7 : 9; g.travel = lerp(1.35, 1.05, p); g.lane = 1; g.cn = n; g.cHits = 0; g.cDone = 0;
      g.cnotes = []; let t = 0.4 + g.travel, last = 1;
      for (let i = 0; i < n; i++) { let ln = Math.floor(Math.random() * 3); if (i && Math.random() < 0.3) ln = last; last = ln; g.cnotes.push({ t, ln, j: null }); t += rnd(0.42, 0.6); }
      g.limit = t + 0.4;
    },
    input(g, type, a) {
      if (type === 'arrow') { if (a === 'up') g.lane = Math.max(0, g.lane - 1); else if (a === 'down') g.lane = Math.min(2, g.lane + 1); return; }
      if ((type === 'down' || type === 'move') && a && !a.key && g.laneRect) {
        if (type === 'move' && !g.dragging) return;
        g.dragging = true; const p = g.pos(a); g.lane = clamp(Math.floor((p.y - g.laneRect.y) / g.laneRect.h * 3), 0, 2);
      }
      if (type === 'up') g.dragging = false;
    },
    update(g) {
      for (const n of g.cnotes) if (!n.j && g.pt >= n.t) {
        g.cDone++;
        if (n.ln === g.lane) { n.j = 'hit'; g.cHits++; g.meow(false, [880, 660, 494][n.ln]); g.judge('good', pick(['喵♪', '喵～', '喵！'])); }
        else { n.j = 'miss'; g.judge('miss', '走音'); }
      }
      if (g.cDone >= g.cn && g.pt > g.cnotes[g.cn - 1].t + 0.2) g.finish(g.cHits / g.cn >= 0.7, g.cHits === g.cn, 'offkey');
    },
    progress: g => g.cHits / g.cn,
    art: meowArt,
    ui(g, c, ux, B, pw) {
      const w = pw * 0.88, h = 112, x0 = ux - w / 2, y0 = B + 2, lh = h / 3, lineX = x0 + w * 0.2;
      g.laneRect = { x: x0, y: y0, w, h };
      for (let i = 0; i < 3; i++) { c.fillStyle = i === g.lane ? 'rgba(255,214,90,0.24)' : 'rgba(255,246,232,0.07)'; CM.rr(c, x0, y0 + i * lh + 2, w, lh - 4, 10); c.fill(); }
      c.strokeStyle = 'rgba(255,246,232,0.25)'; c.lineWidth = 1.5;
      for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(x0 + 8, y0 + i * lh); c.lineTo(x0 + w - 8, y0 + i * lh); c.stroke(); }
      c.strokeStyle = '#ff86a8'; c.lineWidth = 3; c.beginPath(); c.moveTo(lineX, y0 + 2); c.lineTo(lineX, y0 + h - 2); c.stroke();
      for (const n of g.cnotes) {
        const dtn = n.t - g.pt; if (dtn > g.travel || dtn < -0.45) continue;
        const x = lineX + w * 0.76 * (dtn / g.travel) - (dtn < 0 ? 0 : 0), y = y0 + n.ln * lh + lh / 2;
        const col = n.j === 'hit' ? '#ffd25a' : n.j === 'miss' ? '#6a6488' : ['#ff9fbb', '#9fd8ff', '#b9f0a8'][n.ln];
        const pop = n.j === 'hit' ? 1 + Math.min(1, -dtn * 4) * 0.4 : 1;
        c.save(); c.translate(x, y + 3); c.scale(pop, pop); c.globalAlpha = n.j ? Math.max(0, 1 + dtn * 2.2) : 1;
        c.fillStyle = col; c.strokeStyle = CM.ink; c.lineWidth = 2.4;
        c.beginPath(); c.ellipse(0, 3, 7.5, 5.8, -0.4, 0, TAU); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(6.5, 1.5); c.lineTo(6.5, -16); c.quadraticCurveTo(13, -12, 12, -6); c.stroke();
        c.restore();
      }
      cuteHead(c, lineX - 24, y0 + g.lane * lh + lh / 2 + 4, Math.sin(g.t * 8) * 0.06, g.open > 0.3, 0.6);
      CM.text(c, x0 + 14, y0 + 12, '高', '#ff9fbb', 11, 0.9); CM.text(c, x0 + 14, y0 + h - 12, '低', '#b9f0a8', 11, 0.9);
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, lineX + 40, y0 + g.lane * lh + 4 - q.t * 14, q.text, q.col, 17, 1 - q.t / 0.9);
    },
  },
  // ---- 翻肚 4：追雷射光點（點紅點就撲上去；鍵盤用方向鍵移動肉球）----
  laser: {
    init(g, p) {
      g.ln = p >= 0.6 ? 4 : 5; g.lHits = 0; g.lMiss = 0; g.lr = lerp(0.085, 0.125, p); g.lspd = lerp(1.25, 0.8, p);
      g.dot = { u: 0.5, v: 0.5, tu: rnd(0.2, 0.8), tv: rnd(0.25, 0.75), wait: 0.3 }; g.cur = { u: 0.5, v: 0.75 };
      g.limit = 7.5; g.pounceT = -9; g.caughtT = -9; g.lastP = null;
    },
    hop(g) { const d = g.dot; let u, v, n = 0; do { u = rnd(0.1, 0.9); v = rnd(0.18, 0.82); n++; } while (n < 6 && Math.hypot(u - d.u, v - d.v) < 0.3); d.tu = u; d.tv = v; d.wait = rnd(0.25, 0.7) / g.lspd; },
    input(g, type, a) {
      if (type !== 'down') return;
      const d = g.dot, R = g.uiRect; g.pounceT = g.t;
      let hit = false;
      if (a && a.key) { hit = R && Math.hypot(g.cur.u - d.u, (g.cur.v - d.v) * R.h / R.w) < g.lr * 1.3; g.lastP = R ? { x: R.x + g.cur.u * R.w, y: R.y + g.cur.v * R.h } : null; }
      else { const p = g.pos(a); if (p && R) { hit = Math.hypot((p.x - (R.x + d.u * R.w)) / R.w, (p.y - (R.y + d.v * R.h)) / R.w) < g.lr * 1.3; g.lastP = p; } }
      if (hit) {
        g.lHits++; g.caughtT = g.t; g.judge(g.lHits === g.ln ? 'perfect' : 'good', pick(['抓到了！', '撲！', '喵哈！'])); g.burst(2);
        SFX.tone(640, 0.09, { to: 1100, vol: 0.1, type: 'triangle' });
        CUTE_KIND.laser.hop(g); d.wait = 0;
        if (g.lHits >= g.ln) g.finish(true, g.lMiss === 0);
      } else { g.lMiss++; g.judge('miss', '撲空'); }
    },
    update(g, dt) {
      const d = g.dot;
      if (Math.hypot(d.tu - d.u, d.tv - d.v) < 0.01) { d.wait -= dt; if (d.wait <= 0) CUTE_KIND.laser.hop(g); }
      const k = Math.min(1, dt * 7 * g.lspd); d.u += (d.tu - d.u) * k; d.v += (d.tv - d.v) * k;
      if (g.kx || g.ky) { g.cur.u = clamp(g.cur.u + g.kx * dt * 0.9, 0.05, 0.95); g.cur.v = clamp(g.cur.v + g.ky * dt * 1.6, 0.08, 0.92); }
      if (g.pt > g.limit) g.finish(false, false, 'laser');
    },
    progress: g => g.lHits / g.ln,
    art(g, mood) { const caught = g.t - g.caughtT < 0.5; return { p: mood === 'happy' || caught ? 1 : mood === 'fail' ? 0.3 : 0.12, open: caught ? 0.4 : 0, wigAmp: caught ? 1.3 : undefined }; },
    panel(g, c, L, T, pw, ph, s) {
      if (g.phase !== 'play') return;
      const x = L + pw * (0.1 + g.dot.u * 0.8), y = T + ph * 0.92, pu = 1 + Math.sin(g.t * 20) * 0.15;
      c.fillStyle = 'rgba(255,40,40,0.25)'; c.beginPath(); c.arc(x, y, 9 * s * pu, 0, TAU); c.fill();
      c.fillStyle = '#ff3a3a'; c.beginPath(); c.arc(x, y, 3.2 * s, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 0.8 * s, y - 0.8 * s, 1 * s, 0, TAU); c.fill();
    },
    ui(g, c, ux, B, pw) {
      const w = pw * 0.88, h = 118, x0 = ux - w / 2, y0 = B - 2, d = g.dot;
      g.uiRect = { x: x0, y: y0, w, h };
      c.fillStyle = 'rgba(120,80,50,0.35)'; CM.rr(c, x0, y0, w, h, 14); c.fill();
      c.strokeStyle = 'rgba(255,220,180,0.12)'; c.lineWidth = 2; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(x0 + 6, y0 + i * h / 6); c.lineTo(x0 + w - 6, y0 + i * h / 6); c.stroke(); }
      if (g.lastP && g.t - g.pounceT < 0.35) { const k = (g.t - g.pounceT) / 0.35; c.save(); c.globalAlpha = 1 - k; cutePaw(c, g.lastP.x, g.lastP.y, 14 + k * 6); c.restore(); }
      const dx = x0 + d.u * w, dy = y0 + d.v * h, pu = 1 + Math.sin(g.t * 22) * 0.18;
      const gr = c.createRadialGradient(dx, dy, 0, dx, dy, 22 * pu); gr.addColorStop(0, 'rgba(255,60,60,0.75)'); gr.addColorStop(1, 'rgba(255,60,60,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(dx, dy, 22 * pu, 0, TAU); c.fill();
      c.fillStyle = '#ff2a2a'; c.beginPath(); c.arc(dx, dy, 6.5, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(dx - 1.8, dy - 1.8, 2, 0, TAU); c.fill();
      if (typeof matchMedia === 'function' && matchMedia('(hover: hover)').matches) { c.save(); c.globalAlpha = 0.85; cutePaw(c, x0 + g.cur.u * w, y0 + g.cur.v * h, 11); c.restore(); }
      CM.text(c, x0 + w - 30, y0 + 16, `${g.lHits} / ${g.ln}`, '#ffffff', 15, 1);
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, clamp(dx, x0 + 40, x0 + w - 40), Math.max(y0 + 14, dy - 26) - q.t * 14, q.text, q.col, 18, 1 - q.t / 0.9);
    },
  },
  // ---- 翻肚 5：踩踩揉揉（左右輪流點，節奏要穩）----
  knead: {
    init(g, p) { g.kneed = Math.round(lerp(12, 8, p)); g.kn = 0; g.kside = 0; g.kT = -9; g.kmin = lerp(0.2, 0.14, p); g.kmax = lerp(0.6, 0.85, p); g.kbad = 0; g.kph = 0; g.limit = 6.5; },
    tap(g, side) {
      const d = g.t - g.kT;
      if (g.kside === side) { g.kbad++; g.kn = Math.max(0, g.kn - 1); g.judge('miss', '同一隻腳！'); }
      else if (g.kside && d < g.kmin) { g.kbad++; g.kn = Math.max(0, g.kn - 1); g.judge('miss', '太急了'); }
      else if (g.kside && d > g.kmax) { g.kbad++; g.judge('miss', '慢了一拍'); }
      else { g.kn++; g.judge('good', pick(['踩～', '揉～', '踩踩'])); g.purr(side); if (g.kn % 3 === 0) g.panelPop(pick(['呼嚕～', '軟綿綿', '踩踩～']), 30 + Math.random() * 30, 16, '#ff9fbb'); }
      g.kside = side; g.kT = g.t; g.kph = side;
      SFX.tone(side < 0 ? 520 : 620, 0.05, { vol: 0.07, type: 'triangle' });
      if (g.kn >= g.kneed) g.finish(true, g.kbad === 0);
    },
    input(g, type, a) {
      if (type === 'arrow') { if (a === 'left' || a === 'right') CUTE_KIND.knead.tap(g, a === 'left' ? -1 : 1); return; }
      if (type === 'down' && a && !a.key) CUTE_KIND.knead.tap(g, a.clientX < window.innerWidth / 2 ? -1 : 1);
    },
    update(g, dt) { g.kph *= Math.exp(-dt * 3); if (g.pt > g.limit) g.finish(false, false, 'sleepy'); },
    progress: g => g.kn / g.kneed,
    art(g, mood) { return { v: 1, p: mood === 'fail' ? 0.5 : 1, knead: mood === 'play' ? g.kph : undefined, open: 0.15 }; },
    bg(g, c, L, T, pw, ph) {
      // 軟軟的格子毯
      c.fillStyle = '#ffd7e2'; c.fillRect(L, T + ph * 0.62, pw, ph * 0.38);
      c.fillStyle = 'rgba(255,140,170,0.35)';
      for (let i = 0; i < 12; i++) c.fillRect(L + i * pw / 12, T + ph * 0.62, pw / 24, ph * 0.38);
      for (let j = 0; j < 4; j++) c.fillRect(L, T + ph * (0.62 + j * 0.1), pw, ph * 0.04);
    },
    ui(g, c, ux, B, pw) {
      const y = B + 50, sp = pw * 0.26, next = g.kside === 0 ? 0 : -g.kside;
      for (const sd of [-1, 1]) {
        const x = ux + sd * sp, lit = g.kside === sd && g.t - g.kT < 0.15, want = next === 0 || next === sd;
        c.save(); c.translate(x, y); c.scale(lit ? 1.12 : 1, lit ? 1.12 : 1);
        c.globalAlpha = want ? 1 : 0.45; cutePaw(c, 0, 0, 30); c.restore();
        CM.text(c, x, y + 44, sd < 0 ? '左' : '右', want ? '#ffffff' : '#8a83a8', 14, 1);
      }
      // 節拍：理想的間隔
      const ideal = (g.kmin + g.kmax) / 2, ph2 = ((g.t - g.kT) / ideal);
      c.strokeStyle = ph2 >= g.kmin / ideal && ph2 <= g.kmax / ideal ? '#9fe8a8' : 'rgba(255,255,255,0.3)'; c.lineWidth = 4;
      c.beginPath(); c.arc(ux, y, 16, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(ph2, 0, 1)); c.stroke();
      CM.text(c, ux, y, `${g.kn}/${g.kneed}`, '#ffffff', 13, 1);
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, ux, y - 40 - q.t * 12, q.text, q.col, 18, 1 - q.t / 0.9);
    },
  },
  // ---- 蹭腳 4：討摸摸（手移到哪就把頭湊過去，手拍下來那一刻頭要在下面）----
  pet: {
    init(g, p) { g.pneed = p >= 0.6 ? 4 : 5; g.pats = 0; g.pmiss = 0; g.head = 0.5; g.hand = { u: rnd(0.2, 0.8), tu: rnd(0.15, 0.85), patting: false, t: 0, wait: 0.6, judged: false }; g.prad = lerp(0.11, 0.17, p); g.pspd = lerp(1.25, 0.85, p); g.limit = 8; },
    input(g, type, a) {
      if ((type === 'down' || type === 'move') && a && !a.key && g.uiRect) { if (type === 'move' && !g.dragging) return; g.dragging = true; const p = g.pos(a); g.head = clamp((p.x - g.uiRect.x) / g.uiRect.w, 0.05, 0.95); }
      if (type === 'up') g.dragging = false;
    },
    update(g, dt) {
      if (g.kx) g.head = clamp(g.head + g.kx * dt * 1.2, 0.05, 0.95);
      const h = g.hand;
      if (!h.patting) {
        h.u += (h.tu - h.u) * Math.min(1, dt * 3 * g.pspd); h.wait -= dt;
        if (h.wait <= 0 && Math.abs(h.tu - h.u) < 0.03) { h.patting = true; h.t = 0; h.judged = false; }
      } else {
        h.t += dt;
        if (h.t >= 0.3 && !h.judged) {
          h.judged = true;
          if (Math.abs(g.head - h.u) < g.prad) { g.pats++; g.judge('good', pick(['摸摸～', '乖～', '好軟！'])); g.purr(); g.burst(2); g.rT = 1; }
          else { g.pmiss++; g.judge('miss', '摸空了'); }
        }
        if (h.t >= 0.62) { h.patting = false; let u; do { u = rnd(0.12, 0.88); } while (Math.abs(u - h.u) < 0.22); h.tu = u; h.wait = rnd(0.35, 0.75) / g.pspd; g.rT = 0; }
      }
      if (g.pats >= g.pneed) g.finish(true, g.pmiss === 0);
      else if (g.pt > g.limit) g.finish(false, false, 'nopet');
    },
    progress: g => g.pats / g.pneed,
    art(g, mood) { return { r: mood === 'happy' ? Math.sin(g.t * 7) : g.hand.patting ? 0.8 : Math.sin(g.t * 2) * 0.2 }; },
    panel(g, c, L, T, pw, ph, s) {
      const h = g.hand, down = h.patting ? Math.sin(Math.min(1, h.t / 0.62) * Math.PI) : 0;
      cuteHand(c, L + 62 * s, T + (2 + down * 20) * s, s * 0.9, g.faceKey);
    },
    ui(g, c, ux, B, pw) {
      const w = pw * 0.88, h = 118, x0 = ux - w / 2, y0 = B - 2, hd = g.hand;
      g.uiRect = { x: x0, y: y0, w, h };
      c.fillStyle = 'rgba(255,246,232,0.07)'; CM.rr(c, x0, y0, w, h, 14); c.fill();
      const hx = x0 + hd.u * w, down = hd.patting ? Math.sin(Math.min(1, hd.t / 0.62) * Math.PI) : 0;
      // 手的影子：會拍在這裡
      c.fillStyle = hd.patting ? 'rgba(255,134,168,0.45)' : 'rgba(255,214,90,0.22)'; c.beginPath(); c.ellipse(hx, y0 + h - 22, w * g.prad, 10, 0, 0, TAU); c.fill();
      cuteHand(c, hx, y0 + 8 + down * 46, 1.15, g.faceKey);
      cuteHead(c, x0 + g.head * w, y0 + h - 26, hd.patting && down > 0.6 ? Math.sin(g.t * 20) * 0.08 : 0, hd.patting && Math.abs(g.head - hd.u) < g.prad, 0.9);
      CM.text(c, x0 + w - 30, y0 + 16, `${g.pats} / ${g.pneed}`, '#ffffff', 15, 1);
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, x0 + g.head * w, y0 + h - 64 - q.t * 14, q.text, q.col, 18, 1 - q.t / 0.9);
    },
  },
  // ---- 蹭腳 5：撥毛線球（箭頭左右擺，對準走來走去的腳時點，把毛線球撥過去）----
  yarn: {
    // aim 在 -1…1 之間來回擺；球會落在 land(aim)，箭頭就指著那裡
    init(g, p) { g.yn = 3; g.yneed = 2; g.yi = 0; g.yHits = 0; g.ball = null; g.aim = rnd(-0.6, 0.6); g.aimDir = Math.random() < 0.5 ? -1 : 1; g.aimSpd = lerp(1.6, 1.05, p); g.tu = rnd(0.25, 0.75); g.tdu = Math.random() < 0.5 ? -1 : 1; g.tw = lerp(0.1, 0.16, p); g.tspd = lerp(0.32, 0.16, p); g.limit = 10; g.yarnCol = pick(['#ff7aa8', '#7ac8ff', '#ffd25a', '#9fe08a']); g.yres = []; },
    land: a => 0.5 + a * 0.42,
    shoot(g) { if (g.ball || g.yi >= g.yn) return; g.ball = { a: g.aim, d: 0 }; SFX.tone(380, 0.08, { to: 520, vol: 0.1, type: 'triangle' }); g.rT = 1; },
    input(g, type) { if (type === 'down') CUTE_KIND.yarn.shoot(g); },
    update(g, dt) {
      g.tu += g.tdu * g.tspd * dt; if (g.tu > 0.85) { g.tu = 0.85; g.tdu = -1; } if (g.tu < 0.15) { g.tu = 0.15; g.tdu = 1; }
      if (!g.ball) { g.aim += g.aimDir * g.aimSpd * dt; if (g.aim > 1) { g.aim = 1; g.aimDir = -1; } if (g.aim < -1) { g.aim = -1; g.aimDir = 1; } }
      else {
        g.ball.d += dt / 0.7;
        if (g.ball.d >= 1) {
          const land = CUTE_KIND.yarn.land(g.ball.a), hit = Math.abs(land - g.tu) < g.tw;
          g.yi++; g.yres.push(hit);
          if (hit) { g.yHits++; g.judge('good', pick(['接住了！', '好球！', '踢回來了'])); g.purr(); g.burst(2); }
          else g.judge('miss', land < g.tu ? '偏左了' : '偏右了');
          g.ball = null; g.rT = 0;
          if (g.yHits >= g.yneed) { g.finish(true, g.yHits === g.yi); return; }
          if (g.yi >= g.yn) { g.finish(false, false, 'yarn'); return; }
        }
      }
      if (g.pt > g.limit) g.finish(false, false, 'yarn');
    },
    progress: g => g.yHits / g.yneed,
    art(g, mood) { return { v: 1, r: mood === 'happy' ? Math.sin(g.t * 7) : g.ball ? Math.max(0, 1 - g.ball.d * 2) : 0 }; },
    panel(g, c, L, T, pw, ph, s) {
      if (!g.ball) return;
      const k = g.ball.d, x = L + (40 + 28 * k) * s, y = T + (56 - Math.sin(k * Math.PI) * 7) * s;
      c.strokeStyle = g.yarnCol; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(L + 38 * s, T + 58 * s); c.quadraticCurveTo((L + 38 * s + x) / 2, y + 6 * s, x, y); c.stroke();
      cuteYarn(c, x, y, 5 * s, g.yarnCol, k * 9);
    },
    ui(g, c, ux, B, pw) {
      const w = pw * 0.88, h = 118, x0 = ux - w / 2, y0 = B - 2;
      c.fillStyle = 'rgba(210,154,95,0.22)'; CM.rr(c, x0, y0, w, h, 14); c.fill();
      // 鄰居的腳（目標）
      const tx = x0 + g.tu * w;
      c.fillStyle = 'rgba(255,134,168,0.3)'; CM.rr(c, tx - g.tw * w, y0 + 4, g.tw * w * 2, 40, 10); c.fill();
      cuteLeg(c, tx, y0 + 42, g.who, 0.6);
      // 球和瞄準箭頭
      const bx = x0 + w / 2, by = y0 + h - 16, ly = y0 + 36;
      if (g.ball) {
        const k = g.ball.d, lx = x0 + CUTE_KIND.yarn.land(g.ball.a) * w;
        cuteYarn(c, lerp(bx, lx, k), lerp(by, ly, k) - Math.sin(k * Math.PI) * 12, 11, g.yarnCol, k * 12);
      } else {
        // 虛線一路指到球會落下的地方
        const lx = x0 + CUTE_KIND.yarn.land(g.aim) * w, len = Math.hypot(lx - bx, ly - by);
        c.save(); c.translate(bx, by); c.rotate(Math.atan2(lx - bx, by - ly));
        c.strokeStyle = 'rgba(255,255,255,0.4)'; c.setLineDash([5, 6]); c.lineWidth = 3; c.beginPath(); c.moveTo(0, -14); c.lineTo(0, -len); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#ffd25a'; c.strokeStyle = CM.ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -46); c.lineTo(-8, -30); c.lineTo(8, -30); c.closePath(); c.fill(); c.stroke();
        c.restore();
        c.strokeStyle = 'rgba(255,214,90,0.8)'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(lx, ly + 4, 9, 4, 0, 0, TAU); c.stroke();
        if (g.yi < g.yn) cuteYarn(c, bx, by, 11, g.yarnCol, 0);
      }
      for (let i = 0; i < g.yn; i++) { const r = g.yres[i]; c.save(); c.globalAlpha = r === undefined ? (i === g.yi ? 1 : 0.4) : 1; cuteYarn(c, x0 + 18 + i * 22, y0 + h - 14, 7, r === false ? '#6a6488' : g.yarnCol, 0); c.restore(); if (r === true) CM.emote(c, x0 + 18 + i * 22, y0 + h - 22, 'heart', 0.4, 1); }
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, tx, y0 + 62 - q.t * 12, q.text, q.col, 17, 1 - q.t / 0.9);
    },
  },
};

// ---------------------------------------------------------------
// 小圖示：肉球、腳、貓頭、手指（介面和準備時間的示範共用）
// ---------------------------------------------------------------
function cutePaw(c, x, y, R) {
  c.fillStyle = '#fff6e8'; c.strokeStyle = CM.ink; c.lineWidth = 4; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill(); c.stroke();
  const k = R / 24;
  c.fillStyle = '#ff9fbb'; c.beginPath(); c.ellipse(x, y + 4 * k, 7 * k, 5.5 * k, 0, 0, TAU); c.fill();
  for (const [dx, dy] of [[-8, -5], [-3, -9], [3, -9], [8, -5]]) { c.beginPath(); c.ellipse(x + dx * k, y + dy * k, 2.8 * k, 3.2 * k, 0, 0, TAU); c.fill(); }
}
function cuteLeg(c, lx, ty, who, s = 1) {
  const L = LEGS[who] || LEGS.lin;
  c.save(); c.translate(lx, ty); c.scale(s, s);
  c.fillStyle = CM.ink; c.fillRect(-12, -52, 24, 46);
  if (L.bare) { c.fillStyle = L.pants; c.fillRect(-10, -52, 20, 14); c.fillStyle = L.skin; c.fillRect(-8, -38, 16, 32); }
  else { c.fillStyle = L.pants; c.fillRect(-10, -52, 20, 44); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-1, -52, 2, 42); }
  c.fillStyle = CM.ink; CM.rr(c, -15, -11, 32, 13, 6); c.fill(); c.fillStyle = L.shoe; CM.rr(c, -13, -9, 28, 9, 4); c.fill();
  c.restore();
}
function cuteHead(c, x, y, rot, happy, s = 1, pal) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  gearCuteHead(c, 'under', pal);
  c.fillStyle = CM.ink;
  c.beginPath(); c.moveTo(-15, -4); c.lineTo(-12, -21); c.lineTo(-3, -12); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(15, -4); c.lineTo(12, -21); c.lineTo(3, -12); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(0, 0, 18, 15, 0, 0, TAU); c.fill();
  c.fillStyle = pal ? pal.fur : '#d9a36a';
  c.beginPath(); c.moveTo(-12.5, -5); c.lineTo(-10.5, -17.5); c.lineTo(-4, -11); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(12.5, -5); c.lineTo(10.5, -17.5); c.lineTo(4, -11); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(0, 0, 15.5, 12.5, 0, 0, TAU); c.fill();
  c.fillStyle = pal ? pal.stripe : '#a8703c'; c.fillRect(-2, -12, 4, 6); c.fillRect(-7, -11, 3, 4); c.fillRect(4, -11, 3, 4);
  gearCuteHead(c, 'mask', pal);
  const ge = gearCuteEyes(pal), eyeInk = ge.mask ? MASK_LINE : CM.ink;
  c.fillStyle = eyeInk;
  if (happy) { c.lineWidth = 2.4; c.strokeStyle = eyeInk; c.beginPath(); c.arc(-6, 0, 3, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.beginPath(); c.arc(6, 0, 3, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  else if (ge.glow) { for (const ex of [-6, 6]) { c.fillStyle = ge.mask ? MASK_LINE : CM.ink; c.beginPath(); c.ellipse(ex, -1, 3.2, 4, 0, 0, TAU); c.fill(); c.fillStyle = ge.glow.eye; c.beginPath(); c.ellipse(ex, -1, 2.4, 3.2, 0, 0, TAU); c.fill(); c.fillStyle = CM.ink; c.beginPath(); c.ellipse(ex, -1, 0.9, 2.6, 0, 0, TAU); c.fill(); } }
  else { c.beginPath(); c.ellipse(-6, -1, 2.4, 3.2, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(6, -1, 2.4, 3.2, 0, 0, TAU); c.fill(); }
  c.fillStyle = '#ff9fbb'; c.beginPath(); c.ellipse(0, 4, 2.4, 1.7, 0, 0, TAU); c.fill();
  gearCuteHead(c, 'top', pal);
  c.restore();
}
// 鄰居的手（討摸摸）：袖子＋手掌＋四根指頭
function cuteHand(c, x, y, s, faceKey) {
  const P = PEOPLE[faceKey] || PEOPLE.lin;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = CM.ink; CM.rr(c, -11, -34, 22, 24, 5); c.fill();
  c.fillStyle = P.shirt || '#8a8ab8'; CM.rr(c, -9, -34, 18, 22, 4); c.fill();
  c.fillStyle = CM.ink; c.beginPath(); c.ellipse(0, -2, 13, 11, 0, 0, TAU); c.fill();
  for (const fx of [-8, -3, 2, 7]) { c.beginPath(); c.ellipse(fx, 8, 3.6, 5.2, 0, 0, TAU); c.fill(); }
  c.fillStyle = P.skin || '#f4cba8'; c.beginPath(); c.ellipse(0, -2, 11, 9, 0, 0, TAU); c.fill();
  for (const fx of [-8, -3, 2, 7]) { c.beginPath(); c.ellipse(fx, 8, 2.4, 4, 0, 0, TAU); c.fill(); }
  c.restore();
}
// 毛線球
function cuteYarn(c, x, y, r, col, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = CM.ink; c.beginPath(); c.arc(0, 0, r + 2, 0, TAU); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = Math.max(1, r * 0.14);
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(0, 0, r * 0.95, r * (0.25 + Math.abs(i) * 0.15), i * 0.5, 0, Math.PI); c.stroke(); }
  c.restore();
}
// 白色圓點＝手指；press 0…1 是按下去的程度
function cuteFinger(c, x, y, press = 0, a = 1) {
  c.save(); c.globalAlpha *= a;
  if (press > 0) { c.strokeStyle = `rgba(255,255,255,${0.75 * press})`; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 19 + (1 - press) * 8, 0, TAU); c.stroke(); }
  c.fillStyle = press > 0 ? '#ffe9a8' : '#ffffff'; c.strokeStyle = CM.ink; c.lineWidth = 3;
  c.beginPath(); c.arc(x, y, press > 0 ? 11 : 13, 0, TAU); c.fill(); c.stroke();
  c.restore();
}
// 手指走過的軌跡
function cuteTrail(c, pts) {
  for (let i = 1; i < pts.length; i++) { c.strokeStyle = `rgba(255,255,255,${0.45 * i / pts.length})`; c.lineWidth = 3 + 7 * i / pts.length; c.lineCap = 'round'; c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
}
// ---- 準備時間的手勢示範（每種玩法一段小動畫）----
const CUTE_DEMO = {
  beat(c, x, y, t) {
    const q = t % 1, d = 0.7 - q;
    cutePaw(c, x, y, 20);
    if (d > -0.06) { c.strokeStyle = Math.abs(d) < 0.08 ? '#ff4a88' : '#ffd25a'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 20 + Math.max(0, d) * 55, 0, TAU); c.stroke(); }
    const pr = q >= 0.7 && q < 0.84 ? 1 - (q - 0.7) / 0.14 : 0;
    cuteFinger(c, x + 26, y + 24, pr);
    if (pr > 0) CM.text(c, x + 62, y - 10, '喵！', '#ffe27a', 17, pr);
    CM.text(c, x, y + 54, '圈圈碰到肉球時點', '#b8b3d8', 13, 0.9, { weight: 700 });
  },
  morse(c, x, y, t) {
    // 先點一下（短），再按住到變粉紅就放（長）
    const q = t % 2.7, sx = x - 46, lx = x + 34, sy = y - 12;
    const sOn = q > 0.25 && q < 0.4, lOn = q > 0.95 && q < 1.95, lk = clamp((q - 0.95) / 0.7, 0, 1);
    c.strokeStyle = CM.ink; c.lineWidth = 3;
    c.fillStyle = sOn ? '#ffd25a' : '#fff6e8'; c.beginPath(); c.arc(sx, sy, 11, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#fff6e8'; CM.rr(c, lx - 22, sy - 9, 44, 18, 9); c.fill(); c.stroke();
    if (q > 0.95 && q < 2.3) { c.fillStyle = lk < 1 ? '#ffd25a' : '#ff86a8'; CM.rr(c, lx - 19, sy - 6, 38 * lk, 12, 6); c.fill(); }
    if (lk >= 1 && q < 1.95) CM.text(c, lx, sy - 22, '放！', '#ff86a8', 15, 1);
    cuteFinger(c, q < 0.7 || q > 2.4 ? sx : lx, y + 20, sOn ? 1 : lOn ? 0.85 : 0);
    CM.text(c, sx, y + 50, '點一下＝短', '#ffffff', 13, 0.9); CM.text(c, lx, y + 50, '按住，粉紅就放', '#ffffff', 13, 0.9);
  },
  hearts(c, x, y, t) {
    const n = Math.floor(t / 0.9), q = (t % 0.9) / 0.9;
    const P = i => [x + Math.sin(i * 2.7 + 1) * 92, y - 4 + Math.cos(i * 1.9) * 26];
    const [hx, hy] = P(n), [px, py] = P(n - 1);
    if (q < 0.6) CM.emote(c, hx, hy + 16, 'heart', 1.4 * Math.min(1, q / 0.1), 1);
    else { const k = Math.min(1, (q - 0.6) / 0.3); CM.emote(c, hx, hy + 16, 'heart', 1.4 + k * 0.8, 1 - k); }
    const m = smooth(clamp((q - 0.1) / 0.42, 0, 1));
    cuteFinger(c, lerp(px, hx, m) + 12, lerp(py, hy, m) + 16, q > 0.52 && q < 0.66 ? 1 : 0);
  },
  hold(c, x, y, t) {
    const q = t % 2.3, bw = 180, bh = 16, bx = x - bw / 2, by = y - 20, z0 = 0.62, z1 = 0.82;
    const pressing = q > 0.25 && q < 1.45;
    const fill = q < 0.25 ? 0 : q < 1.45 ? (q - 0.25) * 0.6 : Math.max(0, 0.72 - (q - 1.45) * 1.4);
    c.fillStyle = CM.ink; CM.rr(c, bx - 3, by - 3, bw + 6, bh + 6, 10); c.fill();
    c.fillStyle = '#3a3555'; CM.rr(c, bx, by, bw, bh, 8); c.fill();
    c.fillStyle = '#ff7aa8'; c.fillRect(bx + bw * z0, by, bw * (z1 - z0), bh);
    c.fillStyle = '#ffd25a'; CM.rr(c, bx, by + 3, Math.max(5, bw * fill), bh - 6, 5); c.fill();
    cuteFinger(c, x, y + 22, pressing ? 1 : 0);
    CM.text(c, x, y + 52, pressing ? '按住…' : q >= 1.45 && q < 1.9 ? '在粉紅區放開！' : '', pressing ? '#ffffff' : '#ff86a8', 15, 1);
  },
  mash(c, x, y, t) {
    const q = t % 0.18, pr = q < 0.08 ? 1 : 0, pu = 1 + pr * 0.1;
    c.fillStyle = CM.ink; c.beginPath(); c.arc(x, y - 6, 28 * pu, 0, TAU); c.fill();
    c.fillStyle = '#ffd25a'; c.beginPath(); c.arc(x, y - 6, 24 * pu, 0, TAU); c.fill();
    CM.text(c, x, y - 5, '點！', '#5a3010', 18, 1, { stroke: '#fff6e8' });
    cuteFinger(c, x + 22, y + 18 - pr * 3, pr);
    CM.text(c, x, y + 50, '一直點，越快越好', '#b8b3d8', 13, 0.9, { weight: 700 });
  },
  circle(c, x, y, t) {
    const R = 36, a = t * 4.4, pts = [];
    c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 4; c.setLineDash([6, 8]); c.beginPath(); c.arc(x, y, R, 0, TAU); c.stroke(); c.setLineDash([]);
    for (let i = 0; i <= 10; i++) { const b = a - 1.6 + i * 0.16; pts.push([x + Math.cos(b) * R, y + Math.sin(b) * R]); }
    cuteTrail(c, pts);
    cuteFinger(c, x + Math.cos(a) * R, y + Math.sin(a) * R, 0.85);
    CM.text(c, x, y + 58, '畫面上哪裡都可以畫', '#b8b3d8', 13, 0.9, { weight: 700 });
  },
  swipe(c, x, y, t) {
    const f = b => x + Math.sin(b * 6.4) * 74, pts = [];
    for (let i = 0; i <= 8; i++) pts.push([f(t - 0.16 + i * 0.02), y]);
    CM.text(c, x - 112, y, '◀', '#fff6e8', 22, 0.8); CM.text(c, x + 112, y, '▶', '#fff6e8', 22, 0.8);
    cuteTrail(c, pts);
    cuteFinger(c, f(t), y, 0.85);
  },
  follow(c, x, y, t) {
    const L = b => x + Math.sin(b * 2.3) * 92 * (0.7 + 0.3 * Math.sin(b * 3.4));
    const lx = L(t), hx = L(t - 0.16);
    c.fillStyle = CM.ink; CM.rr(c, x - 130, y + 4, 260, 10, 5); c.fill();
    cuteLeg(c, lx, y + 8, 'lin', 0.9);
    cuteHead(c, hx, y + 34, 0, Math.abs(lx - hx) < 16, 0.95);
    cuteFinger(c, hx + 20, y + 52, 0.85);
  },
  simon(c, x, y, t) {
    const q = t % 2.8, seq = [-1, 1, -1];
    seq.forEach((d, i) => {
      const bx = x - 50 + i * 50, lit = q > i * 0.4 && q < i * 0.4 + 0.35, shown = q > i * 0.4 && q < 1.35, done = q > 1.6 + i * 0.4;
      c.fillStyle = done ? '#9fe8a8' : lit ? '#ffd25a' : '#fff6e8'; c.strokeStyle = CM.ink; c.lineWidth = 3;
      CM.rr(c, bx - 16, y - 34, 32, 32, 8); c.fill(); c.stroke();
      CM.text(c, bx, y - 17, shown || done ? (d < 0 ? '◀' : '▶') : '？', shown || done ? CM.ink : '#8a83a8', 17, 1, { stroke: '#fff6e8' });
    });
    if (q < 1.4) CM.text(c, x, y + 22, '先記住…', '#ffffff', 15, 1);
    else {
      const i = Math.min(2, Math.floor((q - 1.4) / 0.4)), k = clamp(((q - 1.4) % 0.4) / 0.3, 0, 1);
      cuteFinger(c, x + seq[i] * 40 * smooth(k), y + 24, 0.85);
      CM.text(c, x, y + 54, '再照著左右滑', '#b8b3d8', 13, 0.9, { weight: 700 });
    }
  },
  blink(c, x, y, t) {
    // 一張臉慢慢閉眼，手指跟著按住；睜眼時放開
    const q = t % 2.4, lid = q < 0.6 ? 0 : q < 0.85 ? (q - 0.6) / 0.25 : q < 1.5 ? 1 : q < 1.75 ? 1 - (q - 1.5) / 0.25 : 0;
    c.fillStyle = '#f4cba8'; c.strokeStyle = CM.ink; c.lineWidth = 3; c.beginPath(); c.arc(x - 30, y - 6, 30, 0, TAU); c.fill(); c.stroke();
    for (const sx of [-12, 12]) {
      const ex = x - 30 + sx, ey = y - 10;
      if (lid > 0.95) { c.beginPath(); c.arc(ex, ey - 2, 5, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
      else { c.fillStyle = CM.ink; c.beginPath(); c.ellipse(ex, ey, 3.4, 4.2 * (1 - lid) + 0.6, 0, 0, TAU); c.fill(); }
    }
    c.beginPath(); c.arc(x - 30, y + 6, 7, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
    const pressing = q > 0.7 && q < 1.62;
    cuteFinger(c, x + 50, y - 6, pressing ? 1 : 0);
    CM.text(c, x + 50, y + 26, pressing ? '按住…' : q > 1.62 && q < 2 ? '放開！' : '', pressing ? '#ffffff' : '#ff86a8', 15, 1);
    CM.text(c, x, y + 52, '對方閉眼就按住，睜眼就放開', '#b8b3d8', 13, 0.9, { weight: 700 });
  },
  chorus(c, x, y, t) {
    const w = 220, h = 78, x0 = x - w / 2, y0 = y - 44, lh = h / 3, lineX = x0 + 40;
    for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(255,246,232,0.08)'; CM.rr(c, x0, y0 + i * lh + 2, w, lh - 4, 8); c.fill(); }
    c.strokeStyle = '#ff86a8'; c.lineWidth = 3; c.beginPath(); c.moveTo(lineX, y0); c.lineTo(lineX, y0 + h); c.stroke();
    const seq = [0, 2, 1, 0], per = 0.7, q = t % (per * seq.length), idx = Math.floor(q / per), lane = seq[idx];
    for (let i = 0; i < seq.length; i++) {
      const dt = (i * per + per) - q; if (dt < -0.2 || dt > 1.4) continue;
      const nx = lineX + dt * 120, ny = y0 + seq[i] * lh + lh / 2;
      c.fillStyle = ['#ff9fbb', '#9fd8ff', '#b9f0a8'][seq[i]]; c.strokeStyle = CM.ink; c.lineWidth = 2;
      c.beginPath(); c.ellipse(nx, ny + 3, 6, 4.6, -0.4, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(nx + 5, ny + 2); c.lineTo(nx + 5, ny - 11); c.stroke();
    }
    const nextLane = seq[(idx + 1) % seq.length], k = smooth(clamp((q % per) / per * 1.6 - 0.4, 0, 1));
    const cy2 = y0 + lerp(lane, nextLane, k) * lh + lh / 2;
    cuteHead(c, lineX - 18, cy2 + 3, 0, false, 0.45);
    cuteFinger(c, x0 + w + 10, cy2, 0.85);
    CM.text(c, x, y + 52, '上下拖，讓貓待在音符那一行', '#b8b3d8', 13, 0.9, { weight: 700 });
  },
  laser(c, x, y, t) {
    const n = Math.floor(t / 0.8), q = (t % 0.8) / 0.8;
    const P = i => [x + Math.sin(i * 2.3 + 0.5) * 95, y - 10 + Math.cos(i * 1.7) * 26];
    const [dx, dy] = P(n), [px, py] = P(n - 1);
    const gr = c.createRadialGradient(dx, dy, 0, dx, dy, 18); gr.addColorStop(0, 'rgba(255,60,60,0.7)'); gr.addColorStop(1, 'rgba(255,60,60,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(dx, dy, 18, 0, TAU); c.fill();
    c.fillStyle = '#ff2a2a'; c.beginPath(); c.arc(dx, dy, 5.5, 0, TAU); c.fill();
    const m = smooth(clamp((q - 0.1) / 0.45, 0, 1));
    cuteFinger(c, lerp(px, dx, m) + 10, lerp(py, dy, m) + 12, q > 0.55 && q < 0.7 ? 1 : 0);
    CM.text(c, x, y + 52, '紅點跑到哪，就點哪裡', '#b8b3d8', 13, 0.9, { weight: 700 });
  },
  knead(c, x, y, t) {
    const q = t % 0.9, side = q < 0.45 ? -1 : 1, pr = (q % 0.45) < 0.12 ? 1 : 0;
    for (const sd of [-1, 1]) { c.save(); c.translate(x + sd * 50, y - 6); const s2 = sd === side && pr ? 1.1 : 1; c.scale(s2, s2); c.globalAlpha = sd === side ? 1 : 0.5; cutePaw(c, 0, 0, 22); c.restore(); }
    cuteFinger(c, x + side * 50 + 14, y + 16, pr);
    CM.text(c, x, y + 52, '左、右、左、右……穩穩的', '#b8b3d8', 13, 0.9, { weight: 700 });
  },
  pet(c, x, y, t) {
    const q = t % 2, hu = Math.sin(Math.floor(t / 2) * 2.1) * 70, patting = q > 1.1 && q < 1.7, down = patting ? Math.sin((q - 1.1) / 0.6 * Math.PI) : 0;
    const hx = x + hu, headX = lerp(x - Math.sin((Math.floor(t / 2) - 1) * 2.1) * 70, hx, smooth(clamp(q / 0.9, 0, 1)));
    cuteHand(c, hx, y - 40 + down * 30, 0.9, 'lin');
    cuteHead(c, headX, y + 22, 0, patting, 0.7);
    cuteFinger(c, headX + 18, y + 40, 0.85);
    CM.text(c, x, y + 58, '手拍下來時，頭要在手的下面', '#b8b3d8', 13, 0.9, { weight: 700 });
  },
  yarn(c, x, y, t) {
    const q = t % 2.2, aim = Math.sin(t * 1.8) * 0.8, tu = Math.sin(t * 0.7) * 60;
    cuteLeg(c, x + tu, y - 24, 'lin', 0.5);
    const shot = q > 1.2;
    if (!shot) { c.save(); c.translate(x, y + 26); c.rotate(aim); c.fillStyle = '#ffd25a'; c.strokeStyle = CM.ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -36); c.lineTo(-7, -22); c.lineTo(7, -22); c.closePath(); c.fill(); c.stroke(); c.restore(); cuteYarn(c, x, y + 26, 9, '#ff7aa8', 0); }
    else { const k = clamp((q - 1.2) / 0.6, 0, 1); cuteYarn(c, x + tu * k, y + 26 - k * 50, 9, '#ff7aa8', k * 10); }
    cuteFinger(c, x + 60, y + 30, q > 1.1 && q < 1.25 ? 1 : 0);
    CM.text(c, x, y + 56, '箭頭對準腳的時候點', '#b8b3d8', 13, 0.9, { weight: 700 });
  },
};

// ---- 3D 版：漫畫格 + 鄰居反應小格 + 操作介面 ----
const CUTE_BG = {
  meow: [['#e5e2ff', '#c9c2ff'], ['#dff3ff', '#b9e2fa'], ['#efe0ff', '#d7bfff']],
  belly: [['#ffe6c8', '#ffc996'], ['#fff1c4', '#ffdc7a'], ['#ffe0d4', '#ffb9a0']],
  rub: [['#ffd6e2', '#ffb3c9'], ['#ffe2f0', '#ffc2de'], ['#e2ffe8', '#bdf0c8']],
};
CuteGame.prototype.render3D = function (g, W, H) {
  const t = this.t, m = this.move, ph0 = this.phase;
  this.uiScale = 1;
  const pw = Math.min(W - 28, 430), ph = pw * (72 / 104);
  const kin = ph0 === 'intro' ? Math.min(1, this.pt / 0.22) : 1;
  const kout = ph0 === 'outro' ? Math.min(1, this.pt / 0.28) : 0;
  const slide = (1 - smooth(kin)) * -W + smooth(kout) * W, fade = Math.min(kin, 1 - kout);
  const cx = W / 2 + slide, cy = H * 0.34;
  const L = -pw / 2, T = -ph / 2;
  g.save();
  g.fillStyle = `rgba(10,8,24,${0.42 * fade})`; g.fillRect(0, 0, W, H);
  // ---- 主格 ----
  g.save();
  g.translate(cx, cy); g.rotate(-0.025);
  g.fillStyle = CM.ink; g.fillRect(L - 5, T - 5, pw + 10, ph + 10);
  g.fillStyle = '#fff6e8'; g.fillRect(L - 2, T - 2, pw + 4, ph + 4);
  g.save();
  g.beginPath(); g.rect(L, T, pw, ph); g.clip();
  const bg = CUTE_BG[m][this.bgv];
  g.fillStyle = bg[0]; g.fillRect(L, T, pw, ph);
  if (this.bgv === 0) {
    g.save(); g.translate(pw * 0.08, -ph * 0.05);
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU + t * 0.6, a2 = a + 0.06 + (i % 3) * 0.02; g.fillStyle = bg[1]; g.beginPath(); g.moveTo(Math.cos(a) * pw * 0.18, Math.sin(a) * pw * 0.18); g.lineTo(Math.cos(a) * pw, Math.sin(a) * pw); g.lineTo(Math.cos(a2) * pw, Math.sin(a2) * pw); g.closePath(); g.fill(); }
    g.restore();
  } else if (this.bgv === 1) {
    g.fillStyle = bg[1];
    for (let yy = T + 8; yy < T + ph; yy += 16) for (let xx = L + ((Math.floor((yy - T) / 16) % 2) * 8) + ((t * 14) % 16); xx < L + pw + 16; xx += 16) { g.beginPath(); g.arc(xx - 16, yy, 3.6, 0, TAU); g.fill(); }
  } else {
    g.fillStyle = bg[1];
    for (let i = -ph; i < pw; i += 22) { g.beginPath(); g.moveTo(L + i + (t * 30) % 22, T); g.lineTo(L + i + 11 + (t * 30) % 22, T); g.lineTo(L + i + 11 + ph + (t * 30) % 22, T + ph); g.lineTo(L + i + ph + (t * 30) % 22, T + ph); g.closePath(); g.fill(); }
    for (let i = 0; i < 7; i++) { const q = (t * 0.5 + i / 7) % 1, x = L + pw * ((i * 0.37) % 1), y = T + ph * (0.15 + ((i * 0.53) % 0.7)); g.globalAlpha = Math.sin(q * Math.PI); CM.text(g, x, y, '✦', '#ffffff', 12, 1, { stroke: bg[1] }); g.globalAlpha = 1; }
  }
  g.fillStyle = 'rgba(255,255,255,0.32)';
  for (let yy = T + 6; yy < T + ph; yy += 9) for (let xx = L + ((yy / 9) % 2) * 4.5; xx < L + pw; xx += 9) { const r = 1.5 * (1 - Math.abs((yy - T) / ph - 0.5)); g.beginPath(); g.arc(xx, yy, r, 0, TAU); g.fill(); }
  if (m !== 'rub') { g.fillStyle = '#f7f1e6'; g.fillRect(L, T + ph * 0.83, pw, ph * 0.17); g.fillStyle = '#ddd2c0'; g.fillRect(L, T + ph * 0.83, pw, 3); }
  else { g.fillStyle = '#d29a5f'; g.fillRect(L, T + ph * 0.86, pw, ph * 0.14); g.fillStyle = '#a8703c'; g.fillRect(L, T + ph * 0.86, pw, 3); }
  const KK = CUTE_KIND[this.kind];
  if (KK.bg) KK.bg(this, g, L, T, pw, ph);
  // 貓（每秒最多重畫 30 次）
  const k = Math.max(2, Math.min(4, (pw / 104) * (R3.dpr || 2)));
  if (!this.art || t - this.artT >= 1 / 30 || this.artK !== k || this.artR !== this.tries) {
    const a = this.drawArt(VXR, k);
    if (!this.art || this.art.width !== a.width || this.art.height !== a.height) this.art = makeCanvas(a.width, a.height);
    const ag = this.art.getContext('2d'); ag.clearRect(0, 0, a.width, a.height); ag.drawImage(a, 0, 0);
    this.artT = t; this.artK = k; this.artR = this.tries;
  }
  const s = pw / 104, pad = VXR.pad;
  const showRes = ph0 === 'result' || ph0 === 'outro' || ph0 === 'assist';
  const over = m === 'belly' && this.gag === 'over' && showRes ? Math.min(1, this.pt / 0.4) : 0;
  g.save();
  if (over) { g.translate(L + 52 * s, T + 40 * s); g.rotate(over * 0.5); g.translate(-(L + 52 * s) + over * 18 * s, -(T + 40 * s)); }
  g.drawImage(this.art, L + (4 - pad) * s, T + (4 - pad) * s, this.art.width / k * s, this.art.height / k * s);
  g.restore();
  if (KK.panel) KK.panel(this, g, L, T, pw, ph, s);
  for (const n of this.notes) {
    const a = Math.max(0, 1 - n.t / 1.1);
    CM.emote(g, L + (n.x + n.t * 12) * s, T + (n.y - n.t * 16) * s, 'note', s * 0.85, a);
    if (n.t < 0.5) CM.text(g, L + (n.x - 14) * s, T + (n.y - 6 - n.t * 10) * s, n.w, '#fff', Math.round(pw * 0.06), 1 - n.t * 2, { stroke: '#7a5ad8', rot: -0.1 });
  }
  for (const h of this.hearts) { if (h.t < 0) continue; const a = Math.max(0, 1 - h.t / 1.2); CM.emote(g, L + (h.x + Math.sin(h.t * 6 + h.x) * 2) * s, T + (h.y - h.t * 22) * s, 'heart', s * 0.7 * h.s, a); }
  for (const q of this.pops) if (q.where === 'panel') CM.text(g, L + q.x * s, T + (q.y - q.t * 12) * s, q.text, q.col, Math.round(pw * 0.07), 1 - q.t / 0.9, { stroke: '#c43a6a', rot: 0.1 });
  if (this.kind === 'hold' && this.inZone && this.playing) CM.text(g, L + pw * 0.78, T + ph * 0.2, '咕嚕嚕', '#fff', Math.round(pw * 0.075), 1, { rot: 0.12, stroke: '#c46a2a' });
  // 計時條：準備時是滿的，開始後才會減少
  if (ph0 === 'play' || ph0 === 'ready' || ph0 === 'intro') {
    const left = ph0 === 'play' ? Math.max(0, 1 - this.pt / this.limit) : 1;
    g.fillStyle = 'rgba(29,21,38,0.55)'; g.fillRect(L, T + ph - 7, pw, 7);
    g.fillStyle = left > 0.3 ? '#ffd25a' : '#ff6a5a'; g.fillRect(L, T + ph - 7, pw * left, 7);
  }
  // 準備：小遊戲名稱；開始的瞬間：開始！
  if (ph0 === 'intro' || ph0 === 'ready' || (ph0 === 'play' && this.pt < 0.45)) {
    const go = ph0 === 'play', kk = go ? 1 - this.pt / 0.45 : ph0 === 'ready' && !this.retry ? 1 : smooth(Math.min(1, this.pt / 0.2));
    // 帶子放在主格下半部，不擋住貓的臉
    const RY = ph * 0.26, RH = ph * 0.13;
    g.save(); g.globalAlpha = go ? kk : 1;
    g.fillStyle = 'rgba(29,21,38,0.8)'; g.fillRect(L, RY - RH, pw * (go ? 1 : kk), RH * 2);
    g.fillStyle = go ? '#ffd25a' : '#ff86a8'; g.fillRect(L, RY - RH, pw * (go ? 1 : kk), 3); g.fillRect(L, RY + RH - 3, pw * (go ? 1 : kk), 3);
    const sub = go ? '' : this.roundSub;
    if (go) CM.text(g, 0, RY, '開始！', '#ffe27a', Math.round(pw * 0.11 * (1 + (1 - kk) * 0.25)), 1, { stroke: '#c43a6a' });
    else {
      CM.text(g, 0, RY - (sub ? ph * 0.035 : 0), CUTE_TITLE[this.kind], '#ffffff', Math.round(pw * 0.085), 1, { stroke: '#2a1a40' });
      if (sub) CM.text(g, 0, RY + ph * 0.07, sub, '#ff86a8', Math.round(pw * 0.045), 1, { stroke: '#2a1a40' });
    }
    g.restore();
  }
  // 橘貓：救場時從右邊跳進來；救過之後坐在左下角幫你加油
  if (ph0 === 'assist') {
    const k = smooth(clamp((this.pt - 0.3) / 0.3, 0, 1)), bounce = Math.abs(Math.sin(this.pt * 9)) * 6 * (1 - k * 0.6);
    const ox = L + pw + 40 - k * (pw * 0.34 + 40), oy = T + ph * 0.6 - bounce;
    cuteHead(g, ox, oy, Math.sin(this.pt * 6) * 0.12, this.pt > 0.9, s * 0.95, ORANGE_HEAD);
    if (this.pt > 0.55) {
      const bw = pw * 0.36, bh = pw * 0.1, bx = ox - bw - 10, by = oy - ph * 0.3;
      g.fillStyle = '#fff'; g.strokeStyle = CM.ink; g.lineWidth = 3; CM.rr(g, bx, by, bw, bh, 10); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(bx + bw - 14, by + bh - 1); g.lineTo(bx + bw + 6, by + bh + 8); g.lineTo(bx + bw - 4, by + bh - 1); g.closePath(); g.fill();
      CM.text(g, bx + bw / 2, by + bh / 2 + 1, '交給我！喵！', '#c45a10', Math.round(pw * 0.05), 1, { stroke: '#ffffff' });
    }
  } else if (this.assistUsed) {
    const bob = Math.abs(Math.sin(t * 5)) * 3;
    cuteHead(g, L + s * 11, T + ph - s * 11 - bob, Math.sin(t * 3) * 0.1, true, s * 0.5, ORANGE_HEAD);
    if (Math.floor(t * 1.5) % 2 === 0) CM.emote(g, L + s * 19, T + ph - s * 19 - bob, 'heart', s * 0.3, 0.9);
  }
  if (showRes) {
    const pop = Math.min(1, this.pt / 0.18), okNow = ph0 === 'assist' ? false : this.ok;
    CM.text(g, 0, T + ph * 0.2, this.word, okNow ? '#ffe27a' : '#dfe4ff', Math.round(pw * 0.1 * (0.6 + 0.4 * smooth(pop))), 1, { stroke: okNow ? '#c43a6a' : '#3a3a6a', rot: -0.05 });
  }
  if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${this.flash * 2})`; g.fillRect(L, T, pw, ph); }
  g.restore();
  // ---- 鄰居反應小格 ----
  const iw = pw * 0.34, ih = iw * 0.86;
  g.save();
  g.translate(L + pw - iw * 0.42, T - ih * 0.18); g.rotate(0.07);
  g.fillStyle = CM.ink; g.fillRect(-iw / 2 - 4, -ih / 2 - 4, iw + 8, ih + 8);
  g.fillStyle = '#fff6e8'; g.fillRect(-iw / 2 - 1.5, -ih / 2 - 1.5, iw + 3, ih + 3);
  const expr = this.faceExpr();
  g.fillStyle = expr === 'angry' ? '#ffd0c8' : expr === 'neutral' ? '#e8eef8' : expr === 'shock' ? '#dfe8ff' : '#fff0c8';
  g.fillRect(-iw / 2, -ih / 2, iw, ih);
  if (expr !== 'neutral' && expr !== 'angry' && expr !== 'shock') { g.fillStyle = 'rgba(255,170,190,0.35)'; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * iw, Math.sin(a) * iw); g.lineTo(Math.cos(a + 0.18) * iw, Math.sin(a + 0.18) * iw); g.closePath(); g.fill(); } }
  g.beginPath(); g.rect(-iw / 2, -ih / 2, iw, ih); g.clip();
  const fc = toonFace(this.faceKey, expr, Math.floor(t * 6) % 2);
  const fs = ih * 1.02 / (fc.height / TK);
  g.drawImage(fc, -fc.width / TK * fs / 2, ih / 2 - fc.height / TK * fs + 3, fc.width / TK * fs, fc.height / TK * fs);
  if ((ph0 === 'result' || ph0 === 'outro') && !this.ok && expr === 'angry') CM.emote(g, iw * 0.3, -ih * 0.2, 'anger', iw / 90);
  g.restore();
  g.restore();   // 主格的位移、旋轉到這裡結束
  // ---- 操作說明與介面（在主格下面）----
  let B = cy + ph / 2 + 14;
  if (ph0 === 'intro' || ph0 === 'ready' || ph0 === 'play') {
    // 操作區的底板：讓說明和按鈕從背景裡跳出來
    g.save(); g.globalAlpha = fade;
    g.fillStyle = 'rgba(16,12,32,0.42)'; CM.rr(g, cx - pw / 2, B - 4, pw, 172, 18); g.fill();
    g.strokeStyle = 'rgba(255,246,232,0.12)'; g.lineWidth = 2; CM.rr(g, cx - pw / 2, B - 4, pw, 172, 18); g.stroke();
    g.restore();
    const pop = ph0 === 'ready' ? smooth(Math.min(1, this.pt / 0.25)) : ph0 === 'intro' ? 0.6 : 1;
    CM.text(g, cx, B + 14, CUTE_HELP[this.kind], ph0 === 'play' ? '#ffffff' : '#ffe9a8', Math.round(Math.min(23, W * 0.056) * (0.6 + 0.4 * pop)), fade, { stroke: '#2a1a40' });
    B += 32;
    if (ph0 === 'play') CUTE_KIND[this.kind].ui(this, g, cx, B, pw, W, fade);
    else if (ph0 === 'ready') {
      CUTE_DEMO[this.kind](g, cx, B + 46, this.pt);
      if (this.pt > 0.3) CM.text(g, cx, B + 124, '點一下直接開始', '#8a83a8', 12, 0.9, { weight: 700 });
    }
    if (typeof matchMedia === 'function' && matchMedia('(hover: hover)').matches) CM.text(g, cx, B + 150, CUTE_KEYS[this.kind], '#b8b3d8', 13, 0.9 * fade, { weight: 700 });
  } else if (ph0 === 'assist') {
    if (this.pt > 0.5) {
      const pop = smooth(Math.min(1, (this.pt - 0.5) / 0.2));
      CM.text(g, cx, B + 30, '橘貓跳出來救場！', '#ffcf8a', Math.round(24 * (0.6 + 0.4 * pop)), fade, { stroke: '#4a2008' });
      CM.text(g, cx, B + 64, '再玩一次！', '#ffffff', 16, fade * pop);
    }
  } else if (ph0 === 'result' || ph0 === 'outro') {
    const pop = Math.min(1, Math.max(0, (this.pt - 0.3) / 0.2));
    if (this.reward && pop > 0) {
      const R = this.reward;
      CM.text(g, cx, B + 30, R.combo >= 2 ? `萌連擊 ×${R.combo}！` : '萌成功！', '#ff86a8', Math.round(26 * (0.6 + 0.4 * smooth(pop))), fade, { stroke: '#4a1030' });
      CM.text(g, cx, B + 66, `鄰居塞了 ${R.cans} 個罐罐` + (R.perfect ? '（完美 +1）' : ''), '#ffe27a', Math.round(17 * (0.6 + 0.4 * smooth(pop))), fade);
    } else if (pop > 0 && this.broke >= 2) CM.text(g, cx, B + 34, `萌連擊 ×${this.broke} 中斷……`, '#b8b3d8', 20, fade);
  }
  g.restore();
};

// ---- 2D 備援版（像素畫）：同一套規則，畫得簡單一點 ----
CuteGame.prototype.render = function (ctx) {
  const W = View.w, H = View.h, m = this.move, K = this.kind, ph0 = this.phase;
  this.uiScale = View.scale;
  const pw = 104, ph = 72;
  const kin = ph0 === 'intro' ? Math.min(1, this.pt / 0.22) : 1;
  const kout = ph0 === 'outro' ? Math.min(1, this.pt / 0.28) : 0;
  const slide = (1 - smooth(kin)) * -W + smooth(kout) * W;
  const x = Math.round(W / 2 - pw / 2 + slide), y = Math.round(H * 0.3 - ph / 2);
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,24,0.55)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = OUTLINE; ctx.fillRect(x - 2, y - 2, pw + 4, ph + 4);
  ctx.fillStyle = CUTE_BG[m][this.bgv][0]; ctx.fillRect(x, y, pw, ph);
  ctx.drawImage(this.drawArt(PXR, 1), x + 4, y + 4);
  const face = G.S.people[this.faceKey] || G.S.people.cust1;
  ctx.fillStyle = OUTLINE; ctx.fillRect(x + pw - 26, y - 10, 30, 26); ctx.fillStyle = '#fff6e8'; ctx.fillRect(x + pw - 25, y - 9, 28, 24);
  ctx.drawImage(face.down[0], 0, 0, face.down[0].width, 12, x + pw - 21, y - 7, face.down[0].width * 1.5, 18);
  ctx.font = '8px "Huninn", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const txt = (s, tx, ty, col) => { ctx.fillStyle = '#1d1526'; ctx.fillText(s, tx + 1, ty + 1); ctx.fillStyle = col; ctx.fillText(s, tx, ty); };
  const cx = W / 2, by = y + ph + 16;
  if (ph0 === 'intro' || ph0 === 'ready') {
    txt(CUTE_TITLE[K] + (this.roundSub ? '・' + this.roundSub : ''), cx, y + ph / 2, '#ffe27a');
    txt(CUTE_HELP[K], cx, by, '#ffe9a8');
  } else if (ph0 === 'play') {
    if (this.pt < 0.4) txt('開始！', cx, y + ph / 2, '#ffe27a');
    txt(CUTE_HELP[K], cx, by, '#fff');
    const uy = by + 14;
    if (K === 'beat') {
      ctx.strokeStyle = '#fff6e8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, uy + 12, 8, 0, TAU); ctx.stroke();
      for (const b of this.beats) { if (b.j) continue; const d = b.t - this.pt; if (d > 0.7 || d < -this.win) continue; ctx.strokeStyle = Math.abs(d) <= this.win ? '#ff4a88' : '#ffd25a'; ctx.beginPath(); ctx.arc(cx, uy + 12, 8 + Math.max(0, d) * 30, 0, TAU); ctx.stroke(); }
    } else if (K === 'morse') {
      this.seq.forEach((sm, i) => { ctx.fillStyle = this.mres[i] === true ? '#9fe8a8' : this.mres[i] === false ? '#5a5478' : i === this.mi ? '#ffd25a' : '#fff6e8'; const xx = cx - (this.seq.length - 1) * 10 + i * 20; if (sm === 'S') ctx.fillRect(xx - 3, uy + 8, 6, 6); else ctx.fillRect(xx - 8, uy + 9, 16, 4); });
    } else if (K === 'hearts') {
      const w = 140, h = 60, x0 = cx - w / 2, y0 = uy;
      this.uiRect = { x: x0, y: y0, w, h };
      for (const ht of this.hList) { const sx = x0 + ht.u * w, sy = y0 + ht.v * h; ht.sx = sx; ht.sy = sy; ht.sr = 10; if (ht.done) continue; drawSpr(ctx, G.S.emote.heart, sx, sy + 4, 0.5, 1); ctx.strokeStyle = '#ffd25a'; ctx.beginPath(); ctx.arc(sx, sy, 9, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - ht.t / this.hlife)); ctx.stroke(); }
    } else if (K === 'hold') {
      ctx.fillStyle = '#3a3555'; ctx.fillRect(cx - 40, uy + 4, 80, 8);
      ctx.fillStyle = '#ff7aa8'; ctx.fillRect(cx - 40 + 80 * this.z0, uy + 4, 80 * this.zw, 8);
      ctx.fillStyle = '#ffd25a'; ctx.fillRect(cx - 40, uy + 6, 80 * Math.min(1, this.fill), 4);
      txt(`${this.flips} / ${this.flipNeed}`, cx + 52, uy + 8, '#fff');
    } else if (K === 'mash' || K === 'circle' || K === 'follow') {
      const v = K === 'mash' ? this.roll : K === 'circle' ? Math.abs(this.cacc) / TAU / this.cneed : this.fmeter;
      ctx.fillStyle = '#3a3555'; ctx.fillRect(cx - 40, uy + 4, 80, 8);
      ctx.fillStyle = '#ff86a8'; ctx.fillRect(cx - 40, uy + 4, 80 * Math.min(1, v), 8);
      if (K === 'follow') { const tw = 120, tx0 = cx - tw / 2; this.trackRect = { x: tx0, y: uy + 14, w: tw, h: 20 }; ctx.fillStyle = '#c7a76c'; ctx.fillRect(tx0 + tw * this.legX - 3, uy + 16, 6, 10); ctx.fillStyle = '#d9a36a'; ctx.fillRect(tx0 + tw * this.catX - 4, uy + 28, 8, 6); }
    } else if (K === 'swipe') {
      ctx.fillStyle = '#ff86a8'; for (let i = 0; i < this.need; i++) ctx.fillRect(cx - this.need * 4 + i * 8, uy + 6, 6, i < this.rubs ? 6 : 2);
    } else if (K === 'simon') {
      const showI = this.sphase === 'show' ? Math.floor(this.pt / this.ssh) : -1;
      this.sseq.forEach((d, i) => { const shown = (this.sphase === 'show' && i <= showI) || this.sres[i] !== undefined; txt(shown ? (d < 0 ? '◀' : '▶') : '？', cx - (this.sseq.length - 1) * 10 + i * 20, uy + 10, this.sres[i] === false ? '#ff8a8a' : i === showI ? '#ffd25a' : '#fff'); });
    } else if (K === 'blink') {
      const lid = CUTE_KIND.blink.lid(this);
      ctx.fillStyle = '#f4cba8'; ctx.fillRect(cx - 14, uy, 28, 22);
      ctx.fillStyle = '#1d1526'; for (const sx of [-6, 4]) ctx.fillRect(cx + sx, uy + 8 + Math.round(lid * 2), 3, Math.max(1, Math.round(3 * (1 - lid))));
      txt(this.held ? '閉眼中' : '睜眼', cx + 40, uy + 10, this.held ? '#ff86a8' : '#fff');
    } else if (K === 'chorus') {
      const w = 140, h = 36, x0 = cx - w / 2, y0 = uy; this.laneRect = { x: x0, y: y0, w, h };
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i === this.lane ? 'rgba(255,214,90,0.35)' : 'rgba(255,255,255,0.08)'; ctx.fillRect(x0, y0 + i * 12, w, 11); }
      for (const n of this.cnotes) { const d = n.t - this.pt; if (d > this.travel || d < -0.3) continue; ctx.fillStyle = n.j === 'hit' ? '#ffd25a' : n.j === 'miss' ? '#6a6488' : '#ff9fbb'; ctx.fillRect(x0 + 24 + (w - 28) * d / this.travel - 2, y0 + n.ln * 12 + 3, 5, 5); }
      ctx.fillStyle = '#ff86a8'; ctx.fillRect(x0 + 24, y0, 1, h);
    } else if (K === 'laser' || K === 'pet') {
      const w = 140, h = 50, x0 = cx - w / 2, y0 = uy; this.uiRect = { x: x0, y: y0, w, h };
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x0, y0, w, h);
      if (K === 'laser') { ctx.fillStyle = '#ff3a3a'; ctx.fillRect(Math.round(x0 + this.dot.u * w) - 2, Math.round(y0 + this.dot.v * h) - 2, 4, 4); txt(`${this.lHits}/${this.ln}`, x0 + w - 12, y0 + 6, '#fff'); }
      else { const hd = this.hand, dn = hd.patting ? Math.sin(Math.min(1, hd.t / 0.62) * Math.PI) : 0; ctx.fillStyle = '#f4cba8'; ctx.fillRect(Math.round(x0 + hd.u * w) - 4, Math.round(y0 + 2 + dn * 22), 8, 7); ctx.fillStyle = '#d9a36a'; ctx.fillRect(Math.round(x0 + this.head * w) - 4, y0 + h - 9, 8, 7); txt(`${this.pats}/${this.pneed}`, x0 + w - 12, y0 + 6, '#fff'); }
    } else if (K === 'knead') {
      for (const sd of [-1, 1]) { ctx.fillStyle = this.kside === sd ? '#ff9fbb' : '#fff6e8'; ctx.fillRect(cx + sd * 26 - 6, uy + 4, 12, 10); }
      txt(`${this.kn}/${this.kneed}`, cx, uy + 9, '#fff');
    } else if (K === 'yarn') {
      const w = 140, h = 44, x0 = cx - w / 2, y0 = uy;
      ctx.fillStyle = 'rgba(255,134,168,0.35)'; ctx.fillRect(Math.round(x0 + (this.tu - this.tw) * w), y0, Math.round(this.tw * 2 * w), 6);
      const bx = cx, by = y0 + h - 4;
      if (this.ball) { const k = this.ball.d, lx = x0 + CUTE_KIND.yarn.land(this.ball.a) * w; ctx.fillStyle = this.yarnCol; ctx.fillRect(Math.round(lerp(bx, lx, k)) - 2, Math.round(lerp(by, y0 + 3, k)) - 2, 5, 5); }
      else { const lx = x0 + CUTE_KIND.yarn.land(this.aim) * w; ctx.strokeStyle = '#ffd25a'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(lx, y0 + 3); ctx.stroke(); }
      txt(`${this.yHits}/${this.yneed}`, x0 + w - 12, y0 + 14, '#fff');
    }
  } else if (ph0 === 'assist') {
    txt(this.word, cx, y + 14, '#dfe4ff');
    if (this.pt > 0.5) txt('橘貓救場！再玩一次', cx, by, '#ffcf8a');
  } else {
    txt(this.word, cx, y + 14, this.ok ? '#ffe27a' : '#dfe4ff');
    if (this.reward) txt(`萌連擊 ×${this.reward.combo}　+${this.reward.cans} 罐罐`, cx, by, '#ff86a8');
  }
  ctx.restore();
};
