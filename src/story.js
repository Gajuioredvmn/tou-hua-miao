// ================= 鄰居的故事線 =================
// 跟鄰居關係越好（變成粉絲、收到他們送的花、送花賠罪、白天被懷疑時擋下來），「交情」越高。
// 交情夠了、那家人也沒在生氣（零顆星），早上就會解開下一段故事。每段都有獎勵，有的會永久改變晚上的狀況。
const BOND_NEED = [2, 5, 9];
const STORY_CHAPTERS = {
  wang: [
    { title: '玫瑰的由來', key: 'wang', lines: [
      ['美玲，我跟妳說個秘密……院子裡那兩盆玫瑰，是我先生種的。'],
      ['他走了七年了。每年玫瑰開的時候，我都覺得他還在。'],
      ['所以花被偷的時候，我才會那麼生氣……不過現在看到妳把它們插得那麼漂亮，好像也不錯。'],
    ], reward: run => { addCut(run, 'rose', 3); return '王太太送了紅玫瑰的插枝 ×3'; } },
    { title: '孫女小芸', key: 'wang', lines: [
      ['我孫女小芸這禮拜來住，她吵著要看「會偷花的貓」。'],
      ['……我什麼都沒說喔！是她自己在里民群組看到的。'],
      ['可以讓她摸一下花喵嗎？她說要畫一張圖送給牠。'],
    ], cat: true, reward: run => { run.cans += 25; run.flags.wangGift2 = 1; return '小芸塞了 25 個罐罐給花喵；王太太之後更常送花來'; } },
    { title: '重新開始', key: 'wang', lines: [
      ['我報名了社區的園藝班，下個月要自己種一整排玫瑰。'],
      ['花被偷……就當作是借給妳們的吧。反正妳們會好好照顧。'],
      ['對了，這是我先生以前用的澆水壺。放在妳頂樓剛剛好。'],
    ], reward: run => { run.flags.wangSoft = 1; run.money += 3000; return '王太太的花被偷時，她的警戒只會升一半；還收到 NT$ 3,000 的開幕紅包'; } },
  ],
  bo: [
    { title: '溫室的照片', key: 'bo', lines: [
      ['妳看這張照片。三十年前，我在鄉下有一間這麼大的溫室。'],
      ['曇花、蘭花、桂花……整間都是香的。後來颱風一來，什麼都沒了。'],
      ['這兩支曇花的插枝，是從那間溫室一路帶過來的。給妳。'],
    ], reward: run => { addCut(run, 'tanhua', 2); return '阿伯送了曇花的插枝 ×2'; } },
    { title: '阿虎', key: 'bo', lines: [
      ['我以前養過一隻虎斑貓，叫阿虎。跟妳家這隻，連走路的樣子都一樣。'],
      ['阿虎最愛半夜跑出去，天亮才叼一朵花回來放在我枕頭邊。'],
      ['……原來那些花都是去偷的啊。哈哈哈。'],
    ], cat: true, reward: run => { run.cans += 30; return '阿伯每天在門口放罐罐：罐罐 +30'; } },
    { title: '最後一朵曇花', key: 'bo', lines: [
      ['今晚我院子裡的曇花會全部一起開。三十年才一次。'],
      ['妳帶花喵一起來看吧。開了之後……想剪幾朵就剪幾朵。'],
      ['阿虎要是還在，也會想看的。'],
    ], reward: run => { run.flags.tanhuaNight = (run.nightIdx || 0) + 1; heatAdd(run, 'bo', -100); return '今晚阿伯家的曇花整晚都開著，阿伯的警戒也歸零了'; } },
  ],
  lin: [
    { title: '狗派的理由', key: 'lin', lines: [
      ['我小時候被一隻貓抓過，留了一條疤。從那之後就怕貓。'],
      ['可是妳家這隻……每次都只是遠遠看著小柴，從來不兇。'],
      ['院子的茉莉剪了一些，給妳插。'],
    ], reward: run => { addCut(run, 'jasmine', 3); return '林先生送了茉莉的插枝 ×3'; } },
    { title: '小柴走丟了', key: 'lin', lines: [
      ['美玲！小柴昨天晚上掙脫狗鍊跑掉了，妳有沒有看到？'],
      ['……什麼？是花喵把牠帶回來的？牠一直跟在小柴後面，帶牠回到我家門口？'],
      ['……謝謝。真的謝謝。以後小柴看到花喵，絕對不會再叫了。'],
    ], cat: true, reward: run => { run.flags.shibaFriend = 1; return '小柴變成花喵的朋友：晚上再也不會對你叫'; } },
    { title: '貓狗和平', key: 'lin', lines: [
      ['跟妳說，我昨天……去收容所領養了一隻貓。'],
      ['小柴好像很開心，一直舔牠。我也開始覺得貓其實滿可愛的。'],
      ['這個月的咖啡我包了，還有這個，就當作謝禮。'],
    ], reward: run => { run.money += 4000; heatAdd(run, 'lin', -100); return '林先生的謝禮 NT$ 4,000，他家的警戒歸零'; } },
  ],
  public: [
    { title: '里長的煩惱', key: 'chief', lines: [
      ['美玲，社區花圃的預算被砍了，明年可能要變成停車場……'],
      ['如果花圃一直有人照顧、一直開滿花，我就有理由跟市政府爭取。'],
      ['妳願意幫忙嗎？我讓巡守隊少巡一點，大家晚上也睡得好一點。'],
    ], reward: run => { run.flags.patrolLess = 1; addCut(run, 'carnation', 2); return '巡守隊每晚少巡一次；里長送了康乃馨的插枝 ×2'; } },
    { title: '社區花博', key: 'chief', lines: [
      ['花圃保住了！市政府還說要在我們里辦一場小型花博。'],
      ['主角當然是妳的店。攤位、海報、布置，全部交給妳！'],
      ['這是活動的經費，先給妳。'],
    ], reward: run => { run.money += 8000; return '社區花博的布置費 NT$ 8,000'; } },
    { title: '模範里民', key: 'chief', lines: [
      ['這塊匾額是全里一起送的：「巷弄之花」。'],
      ['有人說晚上看過一隻虎斑貓叼著花跑過巷子……大家都說那是我們里的守護神。'],
      ['美玲，謝謝妳讓這條巷子變得這麼漂亮。'],
    ], reward: run => { for (const o of HEAT_OWNERS) heatAdd(run, o, -20); run.flags.plaque = 1; return '全里的警戒都降了；店裡掛上「巷弄之花」匾額'; } },
  ],
};
function addCut(run, t, n) { run.cuttings = run.cuttings || {}; run.cuttings[t] = (run.cuttings[t] || 0) + n; }
function bondOf(run) { return run.bond || (run.bond = {}); }
function addBond(run, o, v) { if (!STORY_CHAPTERS[o]) return; const B = bondOf(run); B[o] = (B[o] || 0) + v; }
function storyDone(run) { return run.storyCh || (run.storyCh = {}); }
// 下一段可以解開的故事
function nextChapter(run) {
  if ((run.month || 1) < 2) return null;
  const D = storyDone(run), B = bondOf(run);
  let best = null;
  for (const o in STORY_CHAPTERS) {
    const k = D[o] || 0; if (k >= STORY_CHAPTERS[o].length) continue;
    if ((B[o] || 0) < BOND_NEED[k] || starsOf(run, o) > 0) continue;
    if (!best || (B[o] - BOND_NEED[k]) > best.score) best = { o, k, score: B[o] - BOND_NEED[k] };
  }
  return best;
}
function* neighborStoryScript(S) {
  const run = S.run, nx = nextChapter(run);
  if (!nx) return false;
  const ch = STORY_CHAPTERS[nx.o][nx.k], O = OWNERS[nx.o];
  storyDone(run)[nx.o] = nx.k + 1;
  const wasOn = S.shopOn; S.shopOn = false;
  { let w = 0; yield { update: dt => { w += dt; return w > 5 || !S.shoppers.length; } }; }
  UI.banner(`${O.person}的故事（${nx.k + 1}/3）：${ch.title}`);
  yield wait(1.2);
  const who = S.customer(ch.key);
  yield S.walkIn(who, COUNTER_SPOT2);
  yield* S.talk(who, O.person, ch.lines);
  if (ch.cat) { S.cat.pose = 'belly'; S.fx.hearts(S.cat.x, S.cat.y - 10, 7); SFX.play('heart'); yield wait(1.0); S.cat.pose = null; }
  const msg = ch.reward(run);
  UI.toast(`解開「${ch.title}」：${msg}`, 4200); SFX.play('chime');
  yield S.walkOut(who);
  UI.hideDialog();
  if (wasOn) S.startShop();
  return true;
}
// 圖鑑用：每位鄰居的進度
function storyProgress(run) {
  const D = storyDone(run), B = bondOf(run);
  return Object.keys(STORY_CHAPTERS).map(o => ({ o, person: OWNERS[o].person, done: D[o] || 0, bond: B[o] || 0, next: BOND_NEED[D[o] || 0], titles: STORY_CHAPTERS[o].map(c => c.title) }));
}
