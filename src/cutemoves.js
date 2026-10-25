// ================= 更多賣萌招式 =================
// 歪頭殺（老貓攤學）、招財手（招財貓升級就會）、裝死（老貓攤學）、獻花（嘴裡有花就能用，花會還給人家）
// 每位鄰居吃的招不一樣：阿伯、里長吃招財手，王太太吃歪頭殺，林先生和管家反而會被裝死嚇到。
const CUTE_MOVES_EXTRA = [
  { id: 'tilt', name: '歪頭殺', key: '4', how: '時機・水汪汪', cond: sc => !!sc.run.upg.tilt },
  { id: 'maneki', name: '招財手', key: '5', how: '節奏・接金幣', cond: sc => (sc.run.upg.lucky || 0) >= 1 },
  { id: 'dead', name: '裝死', key: '6', how: '憋住・偷呼吸', cond: sc => !!sc.run.upg.dead },
  { id: 'gift', name: '獻花', key: '7', how: '把花還給人家', cond: sc => sc.cat.carry.length > 0 && (sc.run.month || 1) >= 2 },
];
const CUTE_HOW = { meow: '節奏・聲音・眼神', belly: '時機・連打・撲光點', rub: '貼貼・討摸・毛線球' };
function cuteMovesFor(sc) { return CUTE_MOVES.concat(CUTE_MOVES_EXTRA.filter(m => m.cond(sc))); }
const CUTE_BASE_EXTRA = {
  tilt: { wang: 0.78, lin: 0.42, bo: 0.6, patrol: 0.66, butler: 0.5, temple: 0.72, party: 0.78 },
  maneki: { wang: 0.55, lin: 0.3, bo: 0.9, patrol: 0.84, butler: 0.45, temple: 0.86, party: 0.72 },
  dead: { wang: 0.38, lin: 0.68, bo: 0.5, patrol: 0.45, butler: 0.64, temple: 0.5, party: 0.55 },
  gift: {},
};
function cuteBase(info, key, move) {
  if (info.base[move] !== undefined) return info.base[move];
  if (move === 'gift') return 0.88;
  const B = CUTE_BASE_EXTRA[move]; return (B && B[key] !== undefined) ? B[key] : 0.5;
}
Object.assign(CUTE_KINDS, { tilt: ['gaze', 'sparkle'], maneki: ['wave', 'coin'], dead: ['still', 'sneak'] });
Object.assign(CUTE_TITLE, { gaze: '對上眼就歪頭', sparkle: '水汪汪大眼', wave: '招財招手', coin: '接金幣', still: '憋住不動', sneak: '偷偷呼吸' });
Object.assign(CUTE_HELP, {
  gaze: '視線掃到中間時點，歪頭！', sparkle: '按住變水汪汪，他看你時放開',
  wave: '金幣亮起來時點，招一下手', coin: '左右拖，用肉球接住掉下來的金幣',
  still: '按住憋氣，「真的死了？」才放開', sneak: '他轉頭時點一下，偷呼吸',
});
Object.assign(CUTE_KEYS, { gaze: '鍵盤：空白鍵', sparkle: '鍵盤：按住空白鍵', wave: '鍵盤：空白鍵', coin: '鍵盤：← →', still: '鍵盤：按住空白鍵', sneak: '鍵盤：空白鍵' });
Object.assign(CUTE_GAG, { awkward: '歪錯時機，好尷尬……', dry: '眼睛乾掉了……', offbeat: '招手招亂了……', drop: '金幣都掉了……', twitch: '忍不住動了一下……', gasp: '憋不住，大口喘氣……' });
Object.assign(CUTE_BG, {
  tilt: [['#ffe0ee', '#ffc2dc'], ['#e8e4ff', '#cfc6ff'], ['#fff0d8', '#ffd9a0']],
  maneki: [['#fff1c4', '#ffd86a'], ['#ffe2c8', '#ffbf8a'], ['#fff6d8', '#ffe39a']],
  dead: [['#e2e6f2', '#c6cce2'], ['#e8e2f0', '#cfc2e2'], ['#e0ecf0', '#bcd4dc']],
  gift: [['#ffe6f0', '#ffc6dc'], ['#ffe6f0', '#ffc6dc'], ['#ffe6f0', '#ffc6dc']],
});
// 這些招用哪一張特寫
function cuteArtMove(move) { return move === 'dead' ? 'belly' : move === 'tilt' || move === 'maneki' || move === 'gift' ? 'meow' : move; }

// ---------------------------------------------------------------
// 歪頭殺 1：視線來回掃，掃到中間時點（歪頭）
Object.assign(CUTE_KIND, {
  gaze: {
    init(g, p) { g.gx = -1; g.gdir = 1; g.gsp = lerp(1.9, 1.3, p); g.gzone = lerp(0.18, 0.3, p); g.ghit = 0; g.gmiss = 0; g.gneed = 3; g.tiltT = 0; g.limit = 6.5; },
    input(g, type) {
      if (type !== 'down') return;
      g.tiltT = 0.5;
      if (Math.abs(g.gx) <= g.gzone) {
        g.ghit++; const pf = Math.abs(g.gx) < g.gzone * 0.4;
        g.judge(pf ? 'perfect' : 'good', pf ? '歪頭殺！' : '歪～'); g.purr(); g.burst(2);
        g.gdir = Math.random() < 0.5 ? 1 : -1; g.gx = g.gdir > 0 ? -1 : 1; g.gsp *= 1.08;
        if (g.ghit >= g.gneed) g.finish(true, g.gmiss === 0, null);
      } else { g.gmiss++; g.judge('miss', '他沒在看……'); if (g.gmiss >= 2) g.finish(false, false, 'awkward'); }
    },
    update(g, dt) {
      g.tiltT = Math.max(0, g.tiltT - dt);
      g.gx += g.gdir * g.gsp * dt;
      if (g.gx > 1) { g.gx = 1; g.gdir = -1; } else if (g.gx < -1) { g.gx = -1; g.gdir = 1; }
      if (g.pt > g.limit) g.finish(false, false, 'awkward');
    },
    progress: g => g.ghit / g.gneed,
    art(g, mood) { return { v: 2, tilt: g.tiltT > 0 || mood === 'happy' ? 0.42 : 0.05, open: mood === 'happy' ? 0.3 : 0 }; },
    ui(g, c, ux, B, pw) {
      const w = pw * 0.8, x0 = ux - w / 2, y = B + 50;
      c.fillStyle = 'rgba(255,255,255,0.12)'; CM.rr(c, x0, y - 14, w, 28, 14); c.fill();
      c.fillStyle = 'rgba(255,134,168,0.4)'; CM.rr(c, ux - g.gzone * w / 2, y - 14, g.gzone * w, 28, 10); c.fill();
      // 視線：一隻眼睛
      const ex = ux + g.gx * w / 2;
      c.fillStyle = '#fff'; c.strokeStyle = CM.ink; c.lineWidth = 3; c.beginPath(); c.ellipse(ex, y, 15, 10, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#2a1d16'; c.beginPath(); c.arc(ex + g.gdir * 3, y, 5, 0, TAU); c.fill();
      CM.text(c, ux, y + 34, '視線到粉紅區時點！', '#b8b3d8', 13, 0.9, { weight: 700 });
      for (let i = 0; i < g.gneed; i++) { c.fillStyle = i < g.ghit ? '#ff86a8' : 'rgba(255,255,255,0.25)'; c.strokeStyle = CM.ink; c.lineWidth = 2.5; c.beginPath(); c.arc(ux - 22 + i * 22, y + 60, 7, 0, TAU); c.fill(); c.stroke(); }
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, ux + 70, y - 26 - q.t * 18, q.text, q.col, 18, 1 - q.t / 0.9);
    },
  },
  // 歪頭殺 2：按住讓眼睛水汪汪，他看過來時放開
  sparkle: {
    init(g, p) {
      g.sp = 0; g.holding = false; g.sOK = 0; g.sNeed = 2; g.look = false; g.lookT = rnd(0.6, 1.2); g.sMiss = 0; g.sRate = lerp(0.75, 1.05, p); g.limit = 7;
    },
    input(g, type) {
      if (type === 'down') g.holding = true;
      else if (type === 'up' && g.holding) {
        g.holding = false;
        if (g.sp >= 0.75 && g.look) { g.sOK++; g.judge(g.sp >= 0.92 ? 'perfect' : 'good', '水汪汪～'); g.purr(); g.burst(3); g.sp = 0; if (g.sOK >= g.sNeed) g.finish(true, g.sMiss === 0, null); }
        else if (!g.look) { g.sMiss++; g.judge('miss', '他沒在看'); g.sp *= 0.3; if (g.sMiss >= 3) g.finish(false, false, 'dry'); }
        else { g.judge('miss', '還不夠水汪汪'); g.sp *= 0.5; }
      }
    },
    update(g, dt) {
      if (g.holding) { g.sp = Math.min(1.15, g.sp + g.sRate * dt); if (g.sp >= 1.15) { g.finish(false, false, 'dry'); return; } }
      else g.sp = Math.max(0, g.sp - dt * 0.5);
      g.lookT -= dt; if (g.lookT <= 0) { g.look = !g.look; g.lookT = g.look ? rnd(0.7, 1.1) : rnd(0.8, 1.6); }
      if (g.pt > g.limit) g.finish(false, false, 'dry');
    },
    progress: g => (g.sOK + Math.min(1, g.sp) * 0.6) / g.sNeed,
    art(g, mood) { return { v: 2, tilt: 0.2 + Math.min(1, g.sp) * 0.25, open: 0, blink: false }; },
    ui(g, c, ux, B, pw) {
      const fc = toonFace(g.faceKey, g.look ? 'smile' : 'neutral', 0), fs = 70 / (fc.height / TK), fw = fc.width / TK * fs, fh = fc.height / TK * fs;
      const fx = ux - pw * 0.28;
      c.save(); if (!g.look) { c.translate(fx, 0); c.scale(-1, 1); c.translate(-fx, 0); c.globalAlpha = 0.55; }
      c.drawImage(fc, fx - fw / 2, B + 6, fw, fh); c.restore();
      CM.text(c, fx, B + fh + 18, g.look ? '在看你！' : '沒在看', g.look ? '#ff86a8' : '#b8b3d8', 14, 1, { weight: 700 });
      const bx = ux + pw * 0.08, bw = pw * 0.32, by = B + 18, bh = 22;
      c.fillStyle = 'rgba(255,255,255,0.15)'; CM.rr(c, bx, by, bw, bh, 11); c.fill();
      c.fillStyle = 'rgba(255,214,90,0.35)'; c.fillRect(bx + bw * 0.75 / 1.15, by, bw * (1 - 0.75 / 1.15) - 6, bh);
      c.fillStyle = g.sp >= 0.75 ? '#7ad3ff' : '#cfe8ff'; CM.rr(c, bx + 2, by + 2, Math.max(0, (bw - 4) * Math.min(1, g.sp / 1.15)), bh - 4, 9); c.fill();
      CM.text(c, bx + bw / 2, by + bh + 18, '水汪汪度', '#b8b3d8', 12, 0.9);
      for (let i = 0; i < g.sNeed; i++) { c.fillStyle = i < g.sOK ? '#7ad3ff' : 'rgba(255,255,255,0.25)'; c.strokeStyle = CM.ink; c.lineWidth = 2.5; c.beginPath(); c.arc(bx + bw / 2 - 11 + i * 22, by + bh + 42, 7, 0, TAU); c.fill(); c.stroke(); }
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, ux + 40, B + 100 - q.t * 12, q.text, q.col, 18, 1 - q.t / 0.9);
    },
  },
  // 招財手 1：金幣亮起來時點（招手）
  wave: {
    init(g, p) {
      const n = 6; let t = 0.6; g.wb = [];
      for (let i = 0; i < n; i++) { g.wb.push({ t, j: null }); t += rnd(0.42, 0.62); }
      g.win = lerp(0.07, 0.15, p); g.limit = t + 0.4; g.waveT = 0;
    },
    input(g, type) {
      if (type !== 'down') return;
      g.waveT = 0.25; SFX.tone(1180, 0.05, { vol: 0.06, type: 'triangle' });
      let best = null, bd = 9;
      for (const b of g.wb) if (!b.j) { const d = Math.abs(g.pt - b.t); if (d < bd) { bd = d; best = b; } }
      if (best && bd <= 0.3) { best.j = bd <= g.win * 0.5 ? 'perfect' : bd <= g.win ? 'good' : 'miss'; g.judge(best.j, best.j === 'miss' ? '招早了' : best.j === 'perfect' ? '招財進寶！' : '招～'); if (best.j !== 'miss') SFX.play('coin'); }
    },
    update(g, dt) {
      g.waveT = Math.max(0, g.waveT - dt);
      for (const b of g.wb) if (!b.j && g.pt > b.t + g.win) { b.j = 'miss'; g.judge('miss', '慢了'); }
      if (g.wb.every(b => b.j)) { const s = g.wb.reduce((a, b) => a + (b.j === 'perfect' ? 1 : b.j === 'good' ? 0.75 : 0), 0) / g.wb.length; g.finish(s >= 0.62, g.wb.every(b => b.j === 'perfect'), 'offbeat'); }
    },
    progress: g => g.wb.reduce((a, b) => a + (b.j === 'perfect' ? 1 : b.j === 'good' ? 0.75 : 0), 0) / g.wb.length,
    art(g, mood) { return { v: 1, wave: mood === 'play' ? (g.waveT > 0 ? 1 : -0.6) : undefined, open: mood === 'happy' ? 0.4 : 0 }; },
    ui(g, c, ux, B, pw) {
      const y = B + 50;
      g.wb.forEach((b, i) => {
        const x = ux - (g.wb.length - 1) * 24 + i * 48, dtb = b.t - g.pt;
        const lit = !b.j && Math.abs(dtb) <= g.win * 1.2, near = !b.j && dtb > 0 && dtb < 0.5;
        c.fillStyle = b.j === 'perfect' || b.j === 'good' ? '#ffd84d' : b.j === 'miss' ? '#5a5478' : lit ? '#fff3a0' : near ? '#e8c060' : '#8a7a50';
        c.strokeStyle = CM.ink; c.lineWidth = 3; c.beginPath(); c.arc(x, y, lit ? 17 : 14, 0, TAU); c.fill(); c.stroke();
        CM.text(c, x, y + 1, '福', b.j === 'miss' ? '#9a96b8' : '#a8761a', lit ? 15 : 13, 1, { weight: 800 });
        if (near && !lit) { c.strokeStyle = 'rgba(255,214,90,0.8)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 14 + dtb * 40, 0, TAU); c.stroke(); }
      });
      CM.text(c, ux, y + 44, '金幣亮起來的瞬間點！', '#b8b3d8', 13, 0.9, { weight: 700 });
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, ux, y - 32 - q.t * 18, q.text, q.col, 18, 1 - q.t / 0.9);
    },
  },
  // 招財手 2：接金幣（三條路，左右拖）
  coin: {
    init(g, p) {
      const n = 7; g.cl = 1; g.cn = n; g.cGot = 0; g.cDone = 0; g.fall = lerp(1.15, 1.45, p); g.coins = []; let t = 0.4;
      for (let i = 0; i < n; i++) { g.coins.push({ t: t + g.fall, ln: Math.floor(Math.random() * 3), j: null }); t += rnd(0.4, 0.6); }
      g.limit = t + g.fall + 0.4;
    },
    input(g, type, a) {
      if (type === 'arrow') { if (a === 'left') g.cl = Math.max(0, g.cl - 1); else if (a === 'right') g.cl = Math.min(2, g.cl + 1); return; }
      if ((type === 'down' || type === 'move') && a && !a.key && g.laneRect) {
        if (type === 'move' && !g.dragging) return;
        g.dragging = true; const q = g.pos(a); g.cl = clamp(Math.floor((q.x - g.laneRect.x) / g.laneRect.w * 3), 0, 2);
      }
      if (type === 'up') g.dragging = false;
    },
    update(g) {
      for (const k of g.coins) if (!k.j && g.pt >= k.t) {
        g.cDone++;
        if (k.ln === g.cl) { k.j = 'hit'; g.cGot++; SFX.play('coin'); g.judge('good', '接到！'); g.purr(); }
        else { k.j = 'miss'; g.judge('miss', '掉了'); }
      }
      if (g.cDone >= g.cn) g.finish(g.cGot / g.cn >= 0.7, g.cGot === g.cn, 'drop');
    },
    progress: g => g.cGot / g.cn,
    art(g, mood) { return { v: 1, wave: mood === 'play' ? [-0.5, 0.2, 0.9][g.cl] : undefined, open: mood === 'happy' ? 0.4 : 0 }; },
    ui(g, c, ux, B, pw) {
      const w = pw * 0.78, h = 118, x0 = ux - w / 2, y0 = B, lw = w / 3;
      g.laneRect = { x: x0, y: y0, w, h };
      for (let i = 0; i < 3; i++) { c.fillStyle = i === g.cl ? 'rgba(255,214,90,0.2)' : 'rgba(255,246,232,0.06)'; CM.rr(c, x0 + i * lw + 2, y0, lw - 4, h, 10); c.fill(); }
      for (const k of g.coins) {
        const d = k.t - g.pt; if (d > g.fall || d < -0.3 || k.j === 'hit') continue;
        const x = x0 + (k.ln + 0.5) * lw, y = y0 + (1 - d / g.fall) * (h - 26);
        c.fillStyle = k.j === 'miss' ? '#7a6a40' : '#ffd84d'; c.strokeStyle = CM.ink; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 11, 0, TAU); c.fill(); c.stroke();
        CM.text(c, x, y + 1, '$', '#a8761a', 12, 1, { weight: 800 });
      }
      cutePaw(c, x0 + (g.cl + 0.5) * lw, y0 + h - 12, 15);
      CM.text(c, ux, y0 + h + 16, `${g.cGot} / ${g.cn}`, '#ffe27a', 15, 1, { weight: 800 });
    },
  },
  // 裝死 1：一直按住，聽到「真的死了？」才放開（「咦？」是假的）
  still: {
    init(g, p) {
      g.held = false; g.started = false; g.calls = []; let t = rnd(1.4, 2.0);
      const fakes = p >= 0.55 ? 1 : 2;
      for (let i = 0; i < fakes; i++) { g.calls.push({ t, fake: true }); t += rnd(0.7, 1.1); }
      g.calls.push({ t, fake: false }); g.endT = t; g.win = lerp(0.5, 0.8, p); g.limit = t + g.win + 0.6; g.poke = 0;
    },
    input(g, type) {
      if (type === 'down') { if (!g.started) { g.started = true; g.held = true; } else if (!g.held) { g.held = true; } return; }
      if (type === 'up' && g.held) {
        g.held = false;
        if (!g.started) return;
        const cur = g.calls.slice().reverse().find(k => g.pt >= k.t);
        if (cur && !cur.fake && g.pt <= cur.t + g.win) g.finish(true, g.pt <= cur.t + g.win * 0.5, null);
        else g.finish(false, false, cur && cur.fake ? 'twitch' : 'twitch');
      }
    },
    update(g, dt) {
      g.poke = Math.max(0, g.poke - dt);
      if (g.started && g.held) for (const k of g.calls) if (!k.said && g.pt >= k.t) { k.said = true; g.poke = 0.4; g.pops.push({ text: k.fake ? pick(['咦？', '……動了嗎？', '戳戳']) : '真的死了？', col: k.fake ? '#ffffff' : '#ff86a8', t: 0, where: 'ui' }); SFX.play(k.fake ? 'q' : 'ex'); }
      if (!g.started && g.pt > 1.2) g.finish(false, false, 'idle');
      const last = g.calls[g.calls.length - 1];
      if (g.held && g.pt > last.t + g.win) g.finish(false, false, 'gasp');
    },
    progress: g => (g.started ? Math.min(1, g.pt / (g.endT + 0.3)) : 0),
    art(g, mood) { return { p: 1, dead: mood === 'play' && g.held, open: mood === 'happy' ? 0.3 : 0, wigAmp: g.poke > 0 ? 0.6 : 0 }; },
    ui(g, c, ux, B, pw) {
      const y = B + 44;
      cuteFinger(c, ux, y, g.held ? 1 : 0, 1);
      CM.text(c, ux, y + 46, g.held ? '憋住……' : g.started ? '' : '按住開始裝死！', g.held ? '#b8b3d8' : '#ffe27a', 15, 1, { weight: 700 });
      for (const q of g.pops) if (q.where === 'ui') CM.text(c, ux + pw * 0.22, y - 20 - q.t * 14, q.text, q.col, 20, 1 - q.t / 0.9);
    },
  },
  // 裝死 2：他轉頭時點一下偷呼吸，看你時不能動
  sneak: {
    init(g, p) { g.air = 1; g.look = true; g.lookT = rnd(0.7, 1.1); g.breaths = 0; g.drain = lerp(0.42, 0.3, p); g.survive = 5; g.limit = g.survive + 0.3; g.puff = 0; },
    input(g, type) {
      if (type !== 'down') return;
      if (g.look) g.finish(false, false, 'twitch');
      else { g.air = Math.min(1, g.air + 0.45); g.breaths++; g.puff = 0.35; SFX.tone(420, 0.1, { to: 520, vol: 0.06, type: 'sine' }); g.judge('good', '呼～'); }
    },
    update(g, dt) {
      g.puff = Math.max(0, g.puff - dt);
      g.air -= g.drain * dt; if (g.air <= 0) { g.finish(false, false, 'gasp'); return; }
      g.lookT -= dt; if (g.lookT <= 0) { g.look = !g.look; g.lookT = g.look ? rnd(0.7, 1.3) : rnd(0.45, 0.8); if (g.look) SFX.tone(700, 0.05, { vol: 0.05 }); }
      if (g.pt >= g.survive) g.finish(true, g.air > 0.4, null);
    },
    progress: g => Math.min(1, g.pt / g.survive),
    art(g, mood) { return { p: 1, dead: mood === 'play' && g.puff <= 0, open: g.puff > 0 ? 0.4 : 0 }; },
    ui(g, c, ux, B, pw) {
      const fc = toonFace(g.faceKey, g.look ? 'neutral' : 'neutral', 0), fs = 66 / (fc.height / TK), fw = fc.width / TK * fs, fh = fc.height / TK * fs, fx = ux - pw * 0.26;
      c.save(); if (!g.look) { c.translate(fx, 0); c.scale(-1, 1); c.translate(-fx, 0); c.globalAlpha = 0.55; }
      c.drawImage(fc, fx - fw / 2, B + 6, fw, fh); c.restore();
      CM.text(c, fx, B + fh + 18, g.look ? '在看！別動' : '轉頭了！', g.look ? '#ff86a8' : '#7ad37a', 14, 1, { weight: 700 });
      const bx = ux + pw * 0.06, bw = pw * 0.34, by = B + 20, bh = 20;
      c.fillStyle = 'rgba(255,255,255,0.15)'; CM.rr(c, bx, by, bw, bh, 10); c.fill();
      c.fillStyle = g.air < 0.3 ? '#ff7a7a' : '#9ad0e8'; CM.rr(c, bx + 2, by + 2, Math.max(0, (bw - 4) * g.air), bh - 4, 8); c.fill();
      CM.text(c, bx + bw / 2, by + bh + 16, '空氣', '#b8b3d8', 12, 0.9);
      CM.text(c, bx + bw / 2, by + bh + 40, `再撐 ${Math.max(0, g.survive - g.pt).toFixed(1)} 秒`, '#ffe27a', 14, 1, { weight: 800 });
    },
  },
});
Object.assign(CUTE_DEMO, {
  gaze(c, x, y, t) { const gx = Math.sin(t * 2.2); c.fillStyle = 'rgba(255,134,168,0.4)'; CM.rr(c, x - 16, y - 12, 32, 24, 8); c.fill(); c.fillStyle = '#fff'; c.strokeStyle = CM.ink; c.lineWidth = 3; c.beginPath(); c.ellipse(x + gx * 60, y, 13, 9, 0, 0, TAU); c.fill(); c.stroke(); cuteFinger(c, x + 30, y + 30, Math.abs(gx) < 0.2 ? 1 : 0); CM.text(c, x, y + 56, '眼睛到中間時點', '#b8b3d8', 13, 0.9, { weight: 700 }); },
  sparkle(c, x, y, t) { const q = (t % 2) / 2; c.fillStyle = '#cfe8ff'; CM.rr(c, x - 50, y - 8, 100 * Math.min(1, q * 1.3), 16, 8); c.fill(); cuteFinger(c, x + 60, y + 24, q < 0.8 ? 1 : 0); CM.text(c, x, y + 50, '按住→他看過來時放開', '#b8b3d8', 13, 0.9, { weight: 700 }); },
  wave(c, x, y, t) { const q = t % 1; for (let i = 0; i < 3; i++) { const lit = i === Math.floor(t * 2) % 3; c.fillStyle = lit ? '#fff3a0' : '#8a7a50'; c.strokeStyle = CM.ink; c.lineWidth = 3; c.beginPath(); c.arc(x - 40 + i * 40, y, lit ? 15 : 12, 0, TAU); c.fill(); c.stroke(); } cuteFinger(c, x + 50, y + 26, q < 0.2 ? 1 : 0); CM.text(c, x, y + 50, '亮的那一下點', '#b8b3d8', 13, 0.9, { weight: 700 }); },
  coin(c, x, y, t) { const ln = Math.floor(t) % 3, q = t % 1; c.fillStyle = '#ffd84d'; c.strokeStyle = CM.ink; c.lineWidth = 2.5; c.beginPath(); c.arc(x - 40 + ln * 40, y - 30 + q * 50, 10, 0, TAU); c.fill(); c.stroke(); cutePaw(c, x - 40 + ln * 40, y + 30, 13); CM.text(c, x, y + 58, '左右移動接金幣', '#b8b3d8', 13, 0.9, { weight: 700 }); },
  still(c, x, y, t) { const q = t % 3; cuteFinger(c, x, y, q < 2.4 ? 1 : 0); CM.text(c, x + 50, y - 20, q > 1 && q < 1.6 ? '咦？' : q >= 2.2 ? '真的死了？' : '', q >= 2.2 ? '#ff86a8' : '#fff', 15, 1); CM.text(c, x, y + 50, '一直按住，聽到「真的死了？」再放開', '#b8b3d8', 12, 0.9, { weight: 700 }); },
  sneak(c, x, y, t) { const look = Math.floor(t * 1.2) % 2 === 0; CM.text(c, x - 40, y, look ? '看你' : '轉頭', look ? '#ff86a8' : '#7ad37a', 18, 1, { weight: 800 }); cuteFinger(c, x + 40, y + 20, !look && (t % 0.8) < 0.2 ? 1 : 0); CM.text(c, x, y + 50, '他轉頭時點一下呼吸', '#b8b3d8', 13, 0.9, { weight: 700 }); },
});

// ---------- 獻花：不用玩小遊戲，把嘴裡最貴的花還給人家 ----------
NightScene.prototype.giftCute = function (p) {
  const cu = this.cute, c = this.cat, info = CUTE[cu.key];
  const owner = ownerOfViewer(cu.v);
  let i = c.carry.findIndex(f => f.pot && f.pot.owner === owner);
  if (i < 0) { let best = 0; c.carry.forEach((f, k) => { if (FLOWERS[f.t].price > FLOWERS[c.carry[best].t].price) best = k; }); i = best; }
  const f = c.carry.splice(i, 1)[0];
  if (f && f.pot) f.pot.avail = true;   // 花回到盆子裡
  cu.phase = 'game'; cu.t = 0; cu.gift = true; cu.shown = true; this.cutin = null;
  c.pose = 'meow';
  const ok = Math.random() < p;
  cu.ok = ok;
  this.fx.text(c.x, c.y - 16, '（叼著花遞過去）', '#ffe2ea');
  if (ok) {
    this.fx.hearts(cu.actor.x, cu.actor.y - 18, 6); SFX.play('heart'); cu.actor.setEmote('heart', 1.6);
    UI.say(info.name, pick(['……你是把花還給我嗎？好乖。', '哎呀，送我的？好啦好啦。', '這隻貓……怎麼這麼懂事。']), { auto: 2.2 });
    if (owner && STORY_CHAPTERS[owner]) addBond(this.run, owner, 1);
  } else {
    cu.actor.setEmote('anger', 1.6); SFX.play('fail');
    UI.say(info.name, pick(['拿我的花來送我？想得美！', '這本來就是我的花吧！']), { auto: 2.2 });
  }
};
