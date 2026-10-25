// ================= 像素素材 =================
// 每張圖只畫「填色」，外框由 buildSprite 自動加上一圈。
const OUTLINE = '#1d1526';
const PAL = {
  K: '#1d1526', E: '#1d1526',
  W: '#fff8ec', w: '#e3d6c2',
  O: '#f39a45', o: '#c96d2b',
  B: '#5c4640', b: '#3b2c29',
  P: '#ff94ab', p: '#e06a86',
  S: '#f6c9a0', s: '#d99f78',
  R: '#e8394d', r: '#a11f37',
  L: '#62c35f', l: '#2f7f45',
  T: '#d2723f', t: '#8f4426',
  M: '#ffffff', m: '#d9d3ef',
  V: '#d83aa2', v: '#8e2373',
  N: '#ff9fcb', n: '#d95c97',
  Y: '#ffd84d', y: '#cf9a1b',
  X: '#ff9a2b',
  U: '#a3714a', u: '#6b4630',
  I: '#b3c4d6', i: '#64788f',
  G: '#94e07a', g: '#4f9a5a',
  Q: '#7fd6ff', q: '#3f86b8',
  Z: '#4fae6a', z: '#2e7a48',
  D: '#2e3350',
};

function buildSprite(rows, pal, opts = {}) {
  const outline = opts.outline === undefined ? OUTLINE : opts.outline;
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const pad = outline ? 1 : 0;
  const cv = document.createElement('canvas');
  cv.width = w + pad * 2; cv.height = h + pad * 2;
  const g = cv.getContext('2d');
  const filled = new Uint8Array(cv.width * cv.height);
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (!ch || ch === '.' || ch === ' ') continue;
      const col = pal[ch] || PAL[ch];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x + pad, y + pad, 1, 1);
      filled[(y + pad) * cv.width + x + pad] = 1;
    }
  }
  if (outline) {
    g.fillStyle = outline;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
      if (filled[y * cv.width + x]) continue;
      const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < cv.width && yy < cv.height && filled[yy * cv.width + xx];
      if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) g.fillRect(x, y, 1, 1);
    }
  }
  return cv;
}
function flipCanvas(src) {
  const cv = document.createElement('canvas');
  cv.width = src.width; cv.height = src.height;
  const g = cv.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return cv;
}
function override(base, rowsByIndex) {
  const out = base.slice();
  for (const k in rowsByIndex) out[+k] = rowsByIndex[k];
  return out;
}

// ---------- 花貓 ----------
const CAT_SIDE_A = [
  '........O....W',
  '........OO..WW',
  'B.......OOOWWW',
  'B.......OOWWEW',
  'BB......OWWWWP',
  '.BBBBBBWWWWWW.',
  '..BBBBWWWWWW..',
  '..WBBWWWWWWW..',
  '..WWWWWWWWWW..',
  '..WW.....WW...',
  '..WW.....WW...',
];
const CAT_SIDE_B = override(CAT_SIDE_A, { 9: '....WW.WW.....', 10: '....WW.WW.....' });
const CAT_FRONT_A = [
  '.O......W.',
  '.OO....WW.',
  '.OOOWWWWW.',
  'OOEOWWWEWW',
  'OOWWPPWWWW',
  '.WWWWWWWW.',
  '..WBBBBW..',
  '..WWBBWW..',
  '..WWWWWW..',
  '..WW..WW..',
  '..WW......',
];
const CAT_FRONT_B = override(CAT_FRONT_A, { 10: '......WW..' });
const CAT_BACK_A = [
  '.O......W.',
  '.OO....WW.',
  '.OOOWWWWW.',
  'OOOOWWWWWW',
  'OOOWWWWWWW',
  '.WWWWWWWWB',
  '..BBBBBBB.',
  '..BBBBWW..',
  '..WWWWWW..',
  '..WW..WW..',
  '..WW......',
];
const CAT_BACK_B = override(CAT_BACK_A, { 10: '......WW..' });
const CAT_BELLY = [
  '..W.W...W.W...',
  '..W.W...W.W...',
  '.WWWWWWWWWWWO.',
  'BWWWWWWWWWWOOW',
  'BBBWWWWWWWWKOK',
  '..BBBBBWWWWOPO',
  '...........O.W',
];
const CAT_LOAF = [
  '.O......W.',
  '.OO....WW.',
  '.OOOWWWWW.',
  'OOKKWWKKWW',
  'OWWWPPWWWW',
  'BBBBWWWWWW',
  'BBBWWWWWWW',
  '.WWWWWWWW.',
];
const CAT_MEOW = override(CAT_SIDE_A, { 4: 'BB......OWWWWP', 5: '.BBBBBBWWWWWKK' });

// ---------- 人 ----------
const HUMAN_FRONT = [
  '...HHHH...',
  '..HHHHHH..',
  '..HSSSSH..',
  '..SESSES..',
  '..SSSSSS..',
  '...SssS...',
  '..CCCCCC..',
  '.CCCCCCCC.',
  '.SCCCCCCS.',
  '.SCCCCCCS.',
  '..CCCCCC..',
  '..AAAAAA..',
  '..AA..AA..',
  '..AA..AA..',
  '..AA..AA..',
  '..FF..FF..',
];
const HUMAN_FRONT_B = { 14: '..AA..FF..', 15: '..FF......' };
const HUMAN_BACK = override(HUMAN_FRONT, {
  2: '..HHHHHH..', 3: '..HHHHHH..', 4: '..SHHHHS..', 5: '...SSSS...',
});
const HUMAN_SIDE = [
  '...HHHH...',
  '..HHHHHH..',
  '..HHHSSS..',
  '..HHSSES..',
  '...HSSSSS.',
  '....SSS...',
  '...CCCC...',
  '...CCCCC..',
  '...CCSCC..',
  '...CCSCC..',
  '...CCCC...',
  '...AAAA...',
  '...AAAA...',
  '...AA.AA..',
  '..AA...AA.',
  '..FF...FF.',
];
const HUMAN_SIDE_B = { 13: '....AAA...', 14: '....AA....', 15: '....FFF...' };

const HAIR = {
  short: {},
  perm: {
    front: { 0: '..HHHHHH..', 1: '.HHhHHhHH.', 2: '.HHSSSSHH.', 3: '.HSESSESH.' },
    back: { 0: '..HHHHHH..', 1: '.HHhHHhHH.', 2: '.HHHHHHHH.', 3: '.HHHhHHHH.', 4: '..HHHHHH..' },
    side: { 0: '..HHHHH...', 1: '.HHhHHHH..', 2: '.HHHHSSS..', 3: '.HHHSSES..', 4: '..HHSSSSS.' },
  },
  bald: {
    front: { 0: '...SSSS...', 1: '..SSSSSS..', 2: '..hSSSSh..' },
    back: { 0: '...SSSS...', 1: '..SSSSSS..', 2: '..hSSSSh..', 3: '..hhhhhh..', 4: '..ShhhhS..' },
    side: { 0: '...SSSS...', 1: '..SSSSSS..', 2: '..hhSSSS..', 3: '..hhSSES..', 4: '...hSSSSS.' },
  },
  pony: {
    front: { 2: '..HHSSHH..' },
    back: { 5: '...SHHS...', 6: '..CCHHCC..' },
    side: { 1: '.HHHHHHH..', 2: 'HHHHHSSS..', 3: 'H.HHSSES..', 4: 'H..HSSSSS.' },
  },
  cap: {
    front: { 0: '..ZZZZZZ..', 1: '.ZZZZZZZZ.' },
    back: { 0: '..ZZZZZZ..', 1: '..ZZZZZZ..' },
    side: { 0: '..ZZZZZ...', 1: '..ZZZZZZZZ' },
  },
  slick: {
    front: { 4: '..SKKKKS..' },
    side: { 4: '...HSSKKS.' },
  },
};
const CLOTHES = {
  plain: {},
  apron: {
    front: { 7: '.CZZZZZZC.', 8: '.SZZZZZZS.', 9: '.SZZZZZZS.', 10: '..ZZZZZZ..', 11: '..ZZZZZZ..' },
    side: { 7: '...CZZZZ..', 8: '...CZZZZ..', 9: '...CZZZZ..', 10: '...CZZZ...', 11: '...ZZZZ...' },
  },
  tank: {
    front: { 6: '..SCCCCS..', 7: '.SSCCCCSS.', 8: '.S.CCCC.S.', 9: '.S.CCCC.S.', 12: '..SS..SS..', 13: '..SS..SS..', 14: '..SS..SS..' },
    back: { 6: '..SCCCCS..', 7: '.SSCCCCSS.', 8: '.S.CCCC.S.', 9: '.S.CCCC.S.', 12: '..SS..SS..', 13: '..SS..SS..', 14: '..SS..SS..' },
    side: { 7: '...SCCCC..', 8: '...CCSCC..', 12: '...SSSS...', 13: '...SS.SS..', 14: '..SS...SS.' },
  },
  vest: {
    front: { 7: '.CZZCCZZC.', 8: '.SZZCCZZS.', 9: '.SccccccS.' },
    side: { 7: '...ZZZCC..', 8: '...ZZSCC..', 9: '...ccccc..' },
  },
  suit: {
    front: { 6: '..CCMMCC..', 7: '.CCCMRCCC.', 8: '.SCCMRCCS.', 9: '.SCCCCCCS.' },
    side: { 6: '...CCCM...', 7: '...CCCMM..' },
  },
};

function makeHuman(spec) {
  const pal = Object.assign({}, PAL, {
    H: spec.hair || '#2a2230', h: spec.hairShade || '#4b3f58',
    C: spec.shirt || '#5d8fd8', c: spec.shirtShade || '#3a64a8',
    A: spec.pants || '#3b3d58', F: spec.shoes || '#2a2a36',
    Z: spec.extra || '#4fae6a', S: spec.skin || PAL.S, s: spec.skinShade || PAL.s,
  });
  const hair = HAIR[spec.hairStyle || 'short'] || {};
  const clo = CLOTHES[spec.clothes || 'plain'] || {};
  const mk = (base, view, walk) => {
    let rows = override(base, clo[view] || {});
    rows = override(rows, hair[view] || {});
    if (walk) rows = override(rows, walk);
    return buildSprite(rows, pal);
  };
  const right = [mk(HUMAN_SIDE, 'side'), mk(HUMAN_SIDE, 'side', HUMAN_SIDE_B)];
  // 正面走路第二格要保留衣服/短褲的腿色
  const frontB = Object.assign({}, HUMAN_FRONT_B);
  if (spec.clothes === 'tank') { frontB[14] = '..SS..FF..'; }
  return {
    down: [mk(HUMAN_FRONT, 'front'), mk(HUMAN_FRONT, 'front', frontB)],
    up: [mk(HUMAN_BACK, 'back'), mk(HUMAN_BACK, 'back', frontB)],
    right,
    left: right.map(flipCanvas),
  };
}

// ---------- 狗：柴犬 ----------
const DOG_SIDE_A = [
  '.........O..O',
  '.........OOOO',
  '.OO.....OOOEOW',
  'O..O....OOOOWK',
  '.OOOOOOOOOWWW.',
  '..OOOOOOOWW...',
  '..WOOOOOOW....',
  '..O.O...O.O...',
  '..O.O...O.O...',
];
const DOG_SIDE_B = override(DOG_SIDE_A, { 7: '...OO..OO.....', 8: '...OO..OO.....' });
const DOG_SLEEP = [
  '...OOOOO....',
  '.OOOOOOOOO..',
  'OOOOOOOOOWO.',
  'OOOOOOOWKWWO',
  '.OOOOOOOOOO.',
  '..OOOOOOOO..',
];

// ---------- 盆栽 ----------
const POT_ROWS = [
  '.TTTTTTTT.',
  '..TTTTTT..',
  '..tTTTTt..',
  '...tttt...',
];
const PLANTS = {
  rose: [
    '..R....R..',
    '.RrR..RrR.',
    '.RRRLLRRR.',
    '..RLlLRL..',
    '..LlRRlL..',
    '..LLrRLL..',
    '...LllL...',
    '....LL....',
  ],
  jasmine: [
    '...M..M...',
    '..MLM.LM..',
    '.MLLLMLLM.',
    '.LLMLLLML.',
    '.LlLLMLlL.',
    '..LLlLLL..',
    '...LllL...',
    '....LL....',
  ],
  periwinkle: [
    '..........',
    '..N....N..',
    '.NnN..NnN.',
    '..NLN.NL..',
    '.LLNnNLL..',
    '.LlLNLlL..',
    '..LLLLL...',
    '...LllL...',
  ],
  bougain: [
    '..V..V.V..',
    '.VvVVVvV..',
    '.VVvVVVVV.',
    '..VVLVvV..',
    '..uVVLVu..',
    '...uLLu...',
    '....uu....',
    '....uu....',
  ],
  tanhuaBud: [
    '....P.....',
    '....pP....',
    '....L.....',
    '.LL.L.LL..',
    'LlLLLLLlL.',
    'L.LlLlL.L.',
    '..LLlLL...',
    '...LLL....',
  ],
  tanhua: [
    '..M.M.M...',
    '.MMMYMMM..',
    '..MMMMM...',
    '.LL.L.LL..',
    'LlLLLLLlL.',
    'L.LlLlL.L.',
    '..LLlLL...',
    '...LLL....',
  ],
  tanhuaDead: [
    '..........',
    '....uw....',
    '....uu....',
    '.LL.L.LL..',
    'LlLLLLLlL.',
    'L.LlLlL.L.',
    '..LLlLL...',
    '...LLL....',
  ],
  lily: [
    'MM....MM..',
    'MXM..MXM..',
    '.ML..LM...',
    '..L.ML....',
    '..LMXM....',
    '..L.LL....',
    '.LlLlL....',
    '..LLL.....',
  ],
  orchid: [
    '....MM.MM.',
    '...MnMMnM.',
    '...MMM.MM.',
    '..L..L..L.',
    '..L.......',
    '.LLL......',
    'LlLlL.....',
    '.LLL......',
  ],
  stub: [
    '..........',
    '..........',
    '..........',
    '..........',
    '...L..L...',
    '...LL.L...',
    '....LLL...',
    '....LL....',
  ],
  orchidStub: [
    '..........',
    '..........',
    '..........',
    '..L.......',
    '..L.......',
    '.LLL......',
    'LlLlL.....',
    '.LLL......',
  ],
};
const ORCHID_POT = [
  '.MMMMMMMM.',
  '..MMmMMM..',
  '..mMMMMm..',
  '...mmmm...',
];

// 叼在嘴上的小花
const ICONS = {
  rose: ['.RR..', 'RrRR.', 'RRrR.', '.RR..', '..L..'],
  jasmine: ['M.M..', '.LML.', 'MLL.M', '.L.L.', '..L..'],
  tanhua: ['M.M.M', '.MYM.', 'MMMMM', '.MMM.', '..L..'],
  periwinkle: ['.NN..', 'NnNN.', '.NN..', '..L..', '..L..'],
  bougain: ['V.V..', 'VVvV.', '.VVV.', '..L..', '..L..'],
  orchid: ['M.M..', 'MMnM.', 'MMMM.', '.n.L.', '...L.'],
};

// ---------- 物件 ----------
const OBJ = {
  trash: [
    '.zzzzzz.',
    'zZZZZZZz',
    '.ZZZZZZ.',
    '.ZzZZzZ.',
    '.ZzZZzZ.',
    '.ZzZZzZ.',
    '.ZzZZzZ.',
    '.ZZZZZZ.',
    '..zzzz..',
  ],
  trashDown: [
    '....zzzzzz.',
    '..zZZZZZZZz',
    'YzZzZzZzZZz',
    '.WzZZZZZZZz',
    'uY.zzzzzzz.',
  ],
  scooter: [
    '.........II.',
    '..RRRRR..iI.',
    '.RRRRRRR.i..',
    '.DDDDDDRRRR.',
    '.RRRRRRRRRR.',
    '..RRRRRRRR..',
    '.DD.....DD..',
    'DIID...DIID.',
    '.DD.....DD..',
  ],
  doghouse: [
    '....rr....',
    '...rRRr...',
    '..rRRRRr..',
    '.rRRRRRRr.',
    'rrrrrrrrrr',
    '.UUUUUUUU.',
    '.UUDDDDUU.',
    '.UUDDDDUU.',
    '.uuDDDDuu.',
  ],
  crates: [
    'UUUUUUUU..',
    'UuUUUUuU..',
    'UUuUUuUU..',
    'UUUuuUUU..',
    'uuuuuuuu..',
    'UUUUUUUUUU',
    'UuUUUUUUuU',
    'UUuUUUUuUU',
    'UUUuUUuUUU',
    'uuuuuuuuuu',
  ],
  tower: [
    '..IIIIII..',
    '.IiIIIIiI.',
    'IIIIIIIIII',
    'IiIIIIIIiI',
    'IIIIIIIIII',
    'IiIIIIIIiI',
    'IIIIIIIIII',
    '.iiiiiiii.',
    '.i......i.',
    '.i......i.',
  ],
  camera: [
    'DDDDD.',
    'DIIIDD',
    'DIQIDD',
    'DDDDD.',
    '..D...',
  ],
  bucket: [
    'IIIIIIII',
    '.IiIIiI.',
    '.IIIIII.',
    '..iiii..',
  ],
  smallPot: [
    '..LL..',
    '.LlLL.',
    'LLLlL.',
    'TTTTTT',
    '.TttT.',
  ],
  smallPotDown: [
    '..L...TT',
    '.LlL.TTt',
    'LLLlLTTt',
  ],
  box: [
    'UUUUUUUUUUUU',
    'UuuuuuuuuuuU',
    'Uu........uU',
    'Uu........uU',
    'UUUUUUUUUUUU',
    'UuUUUUUUUUuU',
    'uuuuuuuuuuuu',
  ],
  can: [
    '.IIII.',
    'IiiiiI',
    'QQQQQQ',
    'QqQQqQ',
    'IiiiiI',
  ],
};

const EMOTE = {
  q: ['.YYY.', 'Y...Y', '...Y.', '..Y..', '.....', '..Y..'],
  ex: ['.R.', '.R.', '.R.', '.R.', '...', '.R.'],
  heart: ['.P.P.', 'PPPPP', 'PPPPP', '.PPP.', '..P..'],
  z: ['WWWW', '..W.', '.W..', 'WWWW'],
  note: ['..WW', '..WW', '..W.', 'WWW.', 'WW..'],
  anger: ['R.R', '.R.', 'R.R'],
  dots: ['W.W.W'],
};

function makeAllSprites() {
  const S = {};
  const catPal = PAL;
  const cat = (rows) => buildSprite(rows, catPal);
  const right = [cat(CAT_SIDE_A), cat(CAT_SIDE_B)];
  S.cat = {
    right, left: right.map(flipCanvas),
    down: [cat(CAT_FRONT_A), cat(CAT_FRONT_B)],
    up: [cat(CAT_BACK_A), cat(CAT_BACK_B)],
    belly: cat(CAT_BELLY), loaf: cat(CAT_LOAF),
    meowR: cat(CAT_MEOW), meowL: flipCanvas(cat(CAT_MEOW)),
  };
  S.dog = {
    right: [buildSprite(DOG_SIDE_A, PAL), buildSprite(DOG_SIDE_B, PAL)],
    sleep: buildSprite(DOG_SLEEP, PAL),
  };
  S.dog.left = S.dog.right.map(flipCanvas);
  S.people = {
    meiling: makeHuman({ hairStyle: 'pony', clothes: 'apron', hair: '#3a2a26', hairShade: '#5a4038', shirt: '#f08aa0', shirtShade: '#c9607a', pants: '#3d3f5a', extra: '#5fb36c' }),
    wang: makeHuman({ hairStyle: 'perm', hair: '#5a3a66', hairShade: '#7d5590', shirt: '#e2557f', shirtShade: '#b03a62', pants: '#3a3550', shoes: '#7a2b3b' }),
    lin: makeHuman({ hairStyle: 'short', hair: '#1f1d29', shirt: '#3f84d6', shirtShade: '#2c5fa5', pants: '#c7a76c', shoes: '#4a3a2a' }),
    bo: makeHuman({ hairStyle: 'bald', clothes: 'tank', hairShade: '#bfbfc8', shirt: '#f4f4f0', shirtShade: '#d4d4dc', pants: '#3b5fb4', shoes: '#4a7be0' }),
    patrol: makeHuman({ hairStyle: 'cap', clothes: 'vest', hair: '#26222e', shirt: '#2d3b66', shirtShade: '#1f2a4a', extra: '#c9ef3c', pants: '#2a2f45' }),
    butler: makeHuman({ hairStyle: 'slick', clothes: 'suit', hair: '#24202c', shirt: '#2a2a35', shirtShade: '#1a1a22', pants: '#22222c', shoes: '#111118' }),
    cust1: makeHuman({ hairStyle: 'pony', hair: '#6b4a2a', shirt: '#f0b44a', shirtShade: '#c98d2a', pants: '#3a4a7a' }),
    cust2: makeHuman({ hairStyle: 'short', hair: '#3a2a20', shirt: '#7cc28a', shirtShade: '#4f9a62', pants: '#45405a' }),
    chief: makeHuman({ hairStyle: 'cap', clothes: 'vest', hair: '#bfbfc8', shirt: '#7a5a3a', shirtShade: '#5a4028', extra: '#c9ef3c', pants: '#3a3a4a' }),
  };
  S.pot = {};
  for (const k in PLANTS) {
    const potRows = (k === 'orchid' || k === 'orchidStub') ? ORCHID_POT : POT_ROWS;
    S.pot[k] = buildSprite(PLANTS[k].concat(potRows), PAL);
  }
  S.icon = {};
  for (const k in ICONS) S.icon[k] = buildSprite(ICONS[k], PAL);
  S.obj = {};
  for (const k in OBJ) S.obj[k] = buildSprite(OBJ[k], PAL);
  S.emote = {};
  for (const k in EMOTE) S.emote[k] = buildSprite(EMOTE[k], PAL);
  return S;
}

// ---------- 情報泡泡 ----------
const BUBBLE_ICONS = {
  time: { rows: ['.DDD.', 'D.K.D', 'D.KKD', 'D...D', '.DDD.'], ring: '#ffd25a' },
  flower: { rows: ['.R.R.', 'RRrRR', '.RRR.', '..L..', '.LL..'], ring: '#ff86a8' },
  heart: { rows: ['.p.p.', 'ppppp', 'ppppp', '.ppp.', '..p..'], ring: '#ff5a7a' },
  alert: { rows: ['..X..', '.XKX.', '.XKX.', 'XXXXX', 'XXKXX'], ring: '#ff9a2b' },
  cat: { rows: ['O...O', 'OOOOO', 'OKOKO', 'OOPOO', '.OOO.'], ring: '#f39a45' },
  rent: { rows: ['.YYY.', 'YyyyY', 'YyKyY', 'YyyyY', '.YYY.'], ring: '#77d48a' },
  gold: { rows: ['.YYY.', 'YKyKY', 'YyYyY', 'YKyKY', '.YYY.'], ring: '#ffc83a' },
};
function makeBubbleSprite(type) {
  const info = BUBBLE_ICONS[type];
  const cv = document.createElement('canvas'); cv.width = 17; cv.height = 19;
  const g = cv.getContext('2d');
  const cx = 8, cy = 8;
  for (let y = 0; y < 17; y++) for (let x = 0; x < 17; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= 6.6) { g.fillStyle = d > 5.2 ? info.ring : '#fff8ec'; g.fillRect(x, y, 1, 1); }
    else if (d <= 7.6) { g.fillStyle = OUTLINE; g.fillRect(x, y, 1, 1); }
  }
  // 尾巴
  g.fillStyle = OUTLINE; g.fillRect(7, 15, 3, 1); g.fillRect(8, 16, 1, 2);
  g.fillStyle = info.ring; g.fillRect(8, 15, 1, 1);
  // 反光
  g.fillStyle = '#ffffff'; g.fillRect(4, 4, 2, 1); g.fillRect(4, 5, 1, 1);
  const icon = buildSprite(info.rows, PAL, { outline: null });
  g.drawImage(icon, cx - 2, cy - 2);
  return cv;
}
