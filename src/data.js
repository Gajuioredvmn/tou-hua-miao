// ================= 數值與內容 =================
const RENT = 20000;
const NIGHT_START = 22 * 60 + 30;        // 22:30
const NIGHT_END = 26 * 60 + 30;          // 02:30（隔天）
const MIN_PER_SEC = 1 / 0.6;             // 現實 0.6 秒 = 遊戲 1 分鐘

// hue：配色用的色相（白色的花不算顏色）；where：圖鑑上寫在哪裡偷得到
const FLOWERS = {
  periwinkle: { name: '日日春', price: 60, color: '#ff9fcb', hue: 330, where: '社區花圃、空屋' },
  bougain: { name: '九重葛', price: 120, color: '#d83aa2', hue: 318, where: '社區花圃、王家、阿伯家' },
  jasmine: { name: '茉莉', price: 180, color: '#ffffff', fragrant: true, white: true, where: '林家（小柴聞得到）' },
  rose: { name: '紅玫瑰', price: 260, color: '#e8394d', hue: 355, where: '王家院子、林家屋頂' },
  tanhua: { name: '曇花', price: 700, color: '#ffffff', fragrant: true, white: true, where: '阿伯家，00:00–01:00 才開' },
  orchid: { name: '蝴蝶蘭', price: 1500, color: '#f4e6ff', white: true, where: '大宅溫室（要會跳高高）' },
  lily: { name: '百合', price: 0, toxic: true },
  sunflower: { name: '向日葵', price: 150, color: '#ffc61a', hue: 48, where: '巷子右邊的空地' },
  hydrangea: { name: '繡球花', price: 320, color: '#7aa2e8', hue: 222, where: '林家門口、大宅花園' },
  lisianthus: { name: '桔梗', price: 220, color: '#9a6ad0', hue: 272, where: '王家院子、空屋屋頂' },
  carnation: { name: '康乃馨', price: 140, color: '#ff7a9a', hue: 345, where: '社區花圃' },
  babys: { name: '滿天星', price: 90, color: '#ffffff', white: true, where: '社區花圃、空地' },
  osmanthus: { name: '桂花', price: 200, color: '#ffa53a', hue: 32, fragrant: true, where: '阿伯家、王家屋頂' },
  magnolia: { name: '玉蘭花', price: 160, color: '#fff6e0', fragrant: true, white: true, where: '林家屋頂、阿伯家屋頂' },
  peony: { name: '牡丹', price: 900, color: '#ff9fc2', hue: 336, where: '大宅花園（要會跳高高）' },
};
// 圖鑑、行情表的順序（便宜的在前面）
const FLOWER_ORDER = Object.keys(FLOWERS).filter(t => !FLOWERS[t].toxic).sort((a, b) => FLOWERS[a].price - FLOWERS[b].price);

// 夜晚地圖上的盆栽（格子座標）
const NIGHT_POTS = [
  { t: 'periwinkle', x: 2, y: 9, owner: 'public' },
  { t: 'bougain', x: 4, y: 10, owner: 'public' },
  { t: 'periwinkle', x: 2, y: 12, owner: 'public' },
  { t: 'periwinkle', x: 3, y: 15, owner: 'public' },
  { t: 'periwinkle', x: 10, y: 12, owner: 'lin' },
  { t: 'jasmine', x: 13, y: 12, owner: 'lin' },
  { t: 'jasmine', x: 10, y: 15, owner: 'lin' },
  { t: 'rose', x: 1, y: 23, owner: 'wang' },
  { t: 'rose', x: 2, y: 25, owner: 'wang' },
  { t: 'bougain', x: 4, y: 22, owner: 'wang' },
  { t: 'lily', x: 3, y: 32, owner: 'empty' },
  { t: 'periwinkle', x: 1, y: 34, owner: 'empty' },
  { t: 'periwinkle', x: 4, y: 34, owner: 'empty' },
  { t: 'tanhua', x: 13, y: 32, owner: 'bo' },
  { t: 'bougain', x: 11, y: 32, owner: 'bo' },
  { t: 'bougain', x: 10, y: 36, owner: 'bo' },
  { t: 'periwinkle', x: 13, y: 36, owner: 'bo' },
  { t: 'orchid', x: 4, y: 46, owner: 'mansion' },
  { t: 'orchid', x: 8, y: 46, owner: 'mansion' },
  { t: 'orchid', x: 6, y: 48, owner: 'mansion' },
];
// 屋頂上的盆花（要會「飛簷走壁」才拿得到）
const ROOF_POTS = [
  { t: 'jasmine', x: 10, y: 9, owner: 'lin', top: true },
  { t: 'rose', x: 12, y: 10, owner: 'lin', top: true },
  { t: 'bougain', x: 4, y: 19, owner: 'wang', top: true },
  { t: 'rose', x: 2, y: 20, owner: 'wang', top: true },
  { t: 'periwinkle', x: 2, y: 29, owner: 'empty', top: true },
  { t: 'periwinkle', x: 3, y: 30, owner: 'empty', top: true },
  { t: 'bougain', x: 10, y: 29, owner: 'bo', top: true },
  { t: 'jasmine', x: 12, y: 30, owner: 'bo', top: true },
];
// 第二次更新加的花（接在最後面，舊的盆栽編號不變）
const EXTRA_POTS = [
  { t: 'sunflower', x: 10, y: 19, owner: 'public' },
  { t: 'sunflower', x: 12, y: 25, owner: 'public' },
  { t: 'hydrangea', x: 11, y: 12, owner: 'lin' },
  { t: 'hydrangea', x: 13, y: 45, owner: 'mansion' },
  { t: 'lisianthus', x: 3, y: 24, owner: 'wang' },
  { t: 'lisianthus', x: 4, y: 28, owner: 'empty', top: true },
  { t: 'carnation', x: 4, y: 13, owner: 'public' },
  { t: 'carnation', x: 1, y: 16, owner: 'public' },
  { t: 'babys', x: 1, y: 10, owner: 'public' },
  { t: 'babys', x: 13, y: 19, owner: 'public' },
  { t: 'osmanthus', x: 13, y: 34, owner: 'bo' },
  { t: 'osmanthus', x: 1, y: 18, owner: 'wang', top: true },
  { t: 'magnolia', x: 12, y: 8, owner: 'lin', top: true },
  { t: 'magnolia', x: 13, y: 29, owner: 'bo', top: true },
  { t: 'peony', x: 1, y: 47, owner: 'mansion' },
  { t: 'peony', x: 12, y: 49, owner: 'mansion' },
];
const ALL_POTS = NIGHT_POTS.concat(ROOF_POTS, EXTRA_POTS);
// 可以撥倒的東西、障礙物
const NIGHT_OBJECTS = [
  { k: 'trash', x: 2, y: 6, knock: 'trash' },
  { k: 'scooter', x: 11, y: 5, knock: 'scooter' },
  { k: 'trash', x: 13, y: 20, knock: 'trash' },
  { k: 'scooter', x: 13, y: 27, knock: 'scooter' },
  { k: 'trash', x: 1, y: 27, knock: 'trash' },
  { k: 'scooter', x: 11, y: 39, knock: 'scooter' },
  { k: 'trash', x: 3, y: 41, knock: 'trash' },
  { k: 'doghouse', x: 13, y: 14 },
  { k: 'crates', x: 10, y: 41, jump: { to: [10.5, 43.7], need: true } },
  { k: 'crates', x: 12, y: 43, jump: { to: [12.5, 41.6] } },
];
const ROOF_TOWERS = [[11, 8], [2, 18], [4, 28], [12, 28], [3, 1], [11, 1]];
const LAMPS = [[12, 6], [11, 20], [1, 39], [12, 44]];

// 賣萌：每個人吃哪一套
const CUTE = {
  wang: { name: '王太太', base: { belly: 0.85, rub: 0.6, meow: 0.55 }, intel: 'wangCute',
    win: ['哎唷～怎麼這麼可愛！', '翻肚給阿姨看喔～乖乖乖', '好啦好啦，阿姨什麼都沒看到～'], fail: ['原來是你在偷我的花！', '等一下……這是我家的花吧？', '你這隻小賊貓！'] },
  lin: { name: '林先生', base: { belly: 0.25, rub: 0.32, meow: 0.55 }, intel: 'linDog',
    win: ['……好啦，喵成這樣誰受得了。', '不要跟小柴說我摸了貓喔。', '……今天就算了。'], fail: ['撒嬌沒用，我是狗派的。', '小柴，就是牠！', '回家去！'] },
  bo: { name: '阿伯', base: { belly: 0.5, rub: 0.88, meow: 0.45 }, intel: 'boRub',
    win: ['跟我以前那隻一模一樣……', '乖喔……阿伯摸摸。', '好啦，曇花分你聞一下。'], fail: ['給我回去！', '阿伯眼睛可沒花！', '又是你這隻花貓！'] },
  patrol: { name: '里長', base: { belly: 0.42, rub: 0.38, meow: 0.82 }, intel: 'chiefMeow',
    win: ['啊～心都融化了……', '等等，我拍一張傳到里民群組。', '巡守隊今天沒看到貓喔～'], fail: ['巡守隊抓到啦！', '就是你在偷花對不對！', '跟我回里辦公室！'] },
  butler: { name: '管家', base: { belly: 0.3, rub: 0.25, meow: 0.74 }, intel: 'butlerCat',
    win: ['（偷偷拍照）……快走吧。', '……這張可以當新桌布。', '咳。我什麼都沒看到。'], fail: ['大宅禁止動物進入。', '婚禮的花不准碰。', '保全！有貓！'] },
  temple: { name: '遶境的信徒', base: { belly: 0.62, rub: 0.5, meow: 0.7 }, intel: null,
    win: ['貓咪也來湊熱鬧啊～', '媽祖保佑，乖貓咪！', '這隻貓好有靈性喔！'], fail: ['欸！這隻貓叼著別人家的花！', '遶境的路不能擋喔！', '抓到偷花賊了！'] },
  party: { name: '烤肉的鄰居', base: { belly: 0.78, rub: 0.72, meow: 0.75 }, intel: null,
    win: ['來來來，請你吃一塊烤肉！', '中秋節快樂～給你吃香腸！', '好可愛！大家快來看！'], fail: ['欸！這隻貓叼著別人家的花！', '烤肉不給你吃喔！', '是那隻偷花的貓！'] },
};
const CUTE_MOVES = [
  { id: 'belly', name: '翻肚', key: '1' },
  { id: 'rub', name: '蹭腳', key: '2' },
  { id: 'meow', name: '喵喵叫', key: '3' },
];

const UPGRADES = [
  { id: 'mouth', name: '大嘴巴', group: '技能', max: 3, cost: [12, 30, 60], mon: [1, 1, 3], lv: ['一次叼 2 朵（斜背一個小花袋）', '一次叼 3 朵（換成藤編花籃）', '一次叼 4 朵（插滿花、綁著蝴蝶結的大花簍）'], base: '一次叼 1 朵' },
  { id: 'gentle', name: '輕輕叼', group: '技能', max: 2, cost: [8, 20], lv: ['奔跑掉花瓣機率減半（繫上薄荷綠小領巾）', '奔跑完全不掉花瓣（換成粉紅蕾絲領巾）'], base: '奔跑會掉花瓣' },
  { id: 'paws', name: '肉球消音', group: '技能', max: 2, cost: [10, 24], lv: ['腳步聲範圍 −40%（穿上灰色小襪子）', '腳步聲範圍 −70%（換成黑色忍者襪）'], base: '奔跑腳步聲正常' },
  { id: 'catwalk', name: '貓步', group: '技能', max: 2, cost: [10, 24], lv: ['走路時被發現的速度 −30%（戴上怪盜眼罩）', '走路被發現 −50%，走碎石也沒聲音（紫色金邊眼罩）'], base: '走路也會被看到' },
  { id: 'nightvis', name: '夜視', group: '技能', max: 2, cost: [12, 26], lv: ['隔著房子也看得到鄰居（眼睛會發光）', '暗的地方被發現的速度 −25%（眼睛更亮）'], base: '牆後面有誰看不到' },
  { id: 'sniff', name: '嗅花', group: '技能', max: 2, cost: [8, 18], lv: ['畫面邊緣指出最近的三盆花（耳朵別一朵小花）', '再標出價錢、訂單要的花（換成大朵的花）'], base: '花在哪要自己找' },
  { id: 'bribe', name: '罐罐收買', group: '技能', max: 2, cost: [10, 22], lv: ['小柴要叫的時候丟一個罐罐，安靜 18 秒（背上藍色小背包）', '安靜 30 秒，野狗也收買得到（背包掛著小魚乾）'], base: '狗看到你就叫' },
  { id: 'owl', name: '夜貓子', group: '技能', max: 3, cost: [10, 26, 50], mon: [1, 1, 3], lv: ['每晚多 45 分鐘（尾巴綁上月亮吊飾）', '每晚多 90 分鐘（月亮旁邊多一顆星星）', '每晚多 135 分鐘（尾巴掛上會發光的小燈籠）'], base: '02:30 前回家' },
  { id: 'cute', name: '萌力', group: '技能', max: 4, cost: [8, 18, 36, 70], mon: [1, 1, 1, 3], lv: ['賣萌成功率 +12%（頭上小蝴蝶結）', '賣萌成功率 +24%（大蝴蝶結）', '賣萌成功率 +36%（花冠）', '賣萌成功率 +48%（花冠中間多一頂金色小皇冠）'], base: '賣萌靠天分' },
  { id: 'call', name: '喵喵廣播', group: '技能', max: 2, cost: [24, 48], mon: [3, 3], lv: ['多一個「喵！」按鈕：把叫聲丟到前方，附近的人會走過去看（每晚 3 次；脖子掛一個金色小喇叭）', '每晚 5 次、聲音傳得更遠（喇叭換成紅白大聲公）'], base: '只能撥倒東西把人引開' },
  { id: 'tunnel', name: '貓道', group: '技能', max: 1, cost: [80], mon: [4], lv: ['花店貓門和巷底之間挖一條秘密貓道，在洞口按「鑽」一下就到另一頭（戴上礦工頭燈）'], base: '每次都要走完整條巷子' },
  { id: 'jump', name: '跳高高', group: '技能', max: 1, cost: [20], lv: ['翻過大宅圍牆，偷溫室蝴蝶蘭（背上長出小翅膀）'], base: '大宅圍牆太高' },
  { id: 'orange', name: '橘貓夥伴', group: '夥伴', max: 3, cost: [15, 32, 60], lv: ['每晚跟你出門（體力 3），還自己帶回 NT$ 400（藍色領巾）', '體力 4，自己帶回 NT$ 900（加一個小背包）', '體力 5，自己帶回 NT$ 1,600（披上紅披風）'], base: '還沒有夥伴', need: 'orangeCat' },
  { id: 'lucky', name: '招財貓', group: '花店', max: 3, cost: [12, 28, 55], lv: ['花的賣價 ×1.2（紅項圈小金鈴，櫃台多一隻招財貓）', '花的賣價 ×1.45（鈴鐺變大、招財貓抱金幣）', '花的賣價 ×1.75（金項圈，招財貓變金色）'], base: '賣價 ×1' },
];
// 花店升級：用美玲賺的現金（會跟房租搶錢，越早投資回本越多）
const STORE_UPGRADES = [
  { id: 'lights', name: '補光燈', max: 2, cost: [500, 1500], lv: ['軌道投射燈照著花：賣價 ×1.5', '吊燈、串燈，暖暖的：賣價 ×2'], base: '店裡暗暗的，燈管還一閃一閃', reveal: ['哇，燈打在花上，花看起來好有精神！', '暖暖的吊燈一亮，好像換了一家店！'] },
  { id: 'decor', name: '店面佈置', max: 3, cost: [800, 1800, 3000], lv: ['人字拼木地板＋鐵桶花架，擺得下所有的花：賣價 ×1.15', '墨綠牆、乾燥花吊掛、大盆綠植；殘花也能做成乾燥花：賣價 ×1.3', '包花工作台、黑板花單、櫥窗金字：賣價 ×1.5，客人多付包裝費'], base: '磨石子地板、塑膠水桶，看起來像倉庫', reveal: ['木地板、鐵桶花架！花終於有地方好好站著了。', '乾燥花、大盆的龜背芋……這才像一間花店嘛！', '包花台、黑板花單、櫥窗金字——美玲花藝，開張！'] },
  { id: 'fridge', name: '冷藏花櫃', max: 1, cost: [1000], lv: ['花況永遠 100%；曇花、茉莉、蝴蝶蘭再 ×1.5'], base: '嬌貴的花放一晚就不新鮮', reveal: ['有冰櫃了！嬌貴的花也不怕謝了。'] },
  { id: 'neon', name: '霓虹招牌', max: 1, cost: [1200], lv: ['上門的客人變兩倍，還會順手買小盆栽'], base: '招牌舊舊的，沒人注意這家店', reveal: ['招牌亮起來了！路過的人一定會注意到！'] },
  { id: 'scooter', name: '外送機車', max: 1, cost: [1800], lv: ['可以接外送：訂單獎勵 ×2'], base: '只能等客人自己上門', reveal: ['有機車就能接外送了，訂單錢加倍！'] },
  { id: 'expand', name: '花店擴建', max: 4, cost: [30000, 60000, 100000, 180000], mon: [2, 2, 3, 4],
    lv: ['咖啡角：店裡擺兩張小咖啡桌、櫃台多一台咖啡機；每位客人多買一杯咖啡 NT$ 80', '騎樓座位：門口擺上條紋陽傘和桌椅（晚上也看得到）；上門的客人變多', '花藝教室：後門搭起花拱門、開插花課；每天傍晚收學費', '旗艦店：水晶吊燈、門口紅地毯、金色燈；所有花的賣價 ×1.25'],
    base: '小小一間，只賣花', reveal: ['咖啡機到了！花香配咖啡香，好像在國外的小店。', '陽傘撐起來了！路過的人都會想坐一下。', '花拱門好美……花藝教室，開課囉！', '水晶燈亮起來了……這是我們的店嗎？'] },
];
const LIGHTS_MULT = [1, 1.5, 2];
const DECOR_MULT = [1, 1.15, 1.3, 1.5];
const WRAP_FEE = 80;   // 店面佈置第 3 級：每位買花的客人多付包裝費
function storeOf(run) { const s = run.store || (run.store = { lights: 0, fridge: 0, neon: 0, scooter: 0, decor: 0 }); if (s.decor === undefined) s.decor = 0; return s; }
function storeLevel(run) { const s = storeOf(run); return (s.lights || 0) + (s.fridge || 0) + (s.neon || 0) + (s.scooter || 0) + (s.decor || 0); }
const DELICATE = ['tanhua', 'jasmine', 'orchid', 'peony', 'magnolia', 'hydrangea'];
function flowerValue(run, t, fresh) {
  const s = storeOf(run);
  const cold = s.fridge && DELICATE.includes(t) ? 1.5 : 1;
  // 佈置第 2 級起：掉了花瓣的殘花做成乾燥花，最少也有七成價
  const fr = s.fridge ? 1 : (s.decor || 0) >= 2 ? Math.max(0.7, fresh) : fresh;
  return FLOWERS[t].price * fr * cold * LUCKY_MULT[run.upg.lucky] * LIGHTS_MULT[s.lights || 0] * DECOR_MULT[s.decor || 0] * themeBoost(run, t) * EXP_PRICE_MULT[s.expand || 0] * (run.flags && run.flags.oldShears ? 1.1 : 1);
}
const ORANGE_INCOME = [0, 400, 900, 1600];
const LUCKY_MULT = [1, 1.2, 1.45, 1.75];
const CANS_PER = 90; // 每 NT$90 換一個罐罐

const INTEL = {
  wangRose: '王太太家院子有兩盆紅玫瑰',
  wangTV: '王太太 00:00 前在窗邊追劇，會不時往窗外看',
  wangCute: '王太太最愛貓「翻肚」',
  linJasmine: '林家院子有兩盆茉莉',
  linNose: '小柴鼻子很靈，叼著香花（茉莉、曇花）靠近會被聞到',
  linWalk: '23:00–23:40 林先生帶小柴在巷子散步',
  linDog: '林先生是狗派，只有「喵喵叫」還有點機會',
  boTanhua: '阿伯的曇花 00:00–01:00 才開，一朵 NT$ 700',
  boPace: '阿伯失眠，整晚拿手電筒在院子走',
  boTea: '00:30–00:50 阿伯進屋泡茶',
  boRub: '阿伯以前的貓最愛「蹭腳」',
  boLight: '阿伯院子裝了感應燈，一踩進去就亮',
  orangeCat: '隔壁巷有隻很會偷的橘貓，可以找牠當夥伴',
  patrolTimes: '里長的巡守隊 23:30、01:10 各巡一次巷子',
  chiefMeow: '里長聽到小貓「喵喵叫」就心軟',
  orchid: '大宅溫室有蝴蝶蘭，一盆 NT$ 1,500（要會「跳高高」）',
  camera: '大宅花園有監視器左右掃',
  butlerCat: '大宅管家很兇，但手機桌布是貓（喵喵叫有效）',
  wedding: '婚禮前夜：管家整晚在大宅花園巡邏，巡守隊多巡一次',
};

// 每晚的變化：天氣／事件、新能力、看守
const NIGHT_RULES = {
  1: { event: 'clear', ability: null, boLight: false, patrol: [], butler: false },
  2: { event: 'rain', ability: 'climb', boLight: true, patrol: [], butler: false },
  3: { event: 'bbq', ability: 'box', boLight: true, patrol: [[1410, 1450], [1510, 1550]], butler: false },
  4: { event: 'outage', ability: 'orange', boLight: true, patrol: [[1395, 1435], [1470, 1510], [1545, 1585]], butler: true },
};
const ABILITY_ORDER = ['climb', 'box', 'orange'];
const EVENTS = {
  clear: { name: '晴朗的夜晚', desc: '一切照常。' },
  rain: { name: '下雨', desc: '雨聲蓋過腳步聲（聲音傳得比較近），大家撐著傘、看得比較近。' },
  bbq: { name: '中秋烤肉', desc: '鄰居在空地烤肉，人多眼雜。但大家心情好，被發現時賣萌比較容易成功；烤肉的吵鬧聲也會蓋過附近的腳步聲。' },
  outage: { name: '停電', desc: '路燈全暗，只剩手電筒和燭光。大宅有發電機，花園照樣亮。' },
};
const ABILITIES = {
  climb: { name: '飛簷走壁', desc: '靠近鐵窗、柵欄按「爬」就能上屋頂、走牆頭。地上的人看不到屋頂上的貓，屋頂上也有盆花。按「跳下」回到地面。' },
  box: { name: '紙箱偽裝', desc: '按「紙箱」鑽進箱子：不動就像一個普通的箱子；但在別人眼前移動會很可疑。每晚 3 個，一個撐 15 秒。' },
  orange: { name: '指揮橘貓', desc: '橘貓今晚跟著你。按「橘貓」可以叫牠撒嬌引開人、分頭去偷花、或搗蛋把人引走（每晚 2 次）。牠也會幫你把風，你被抓到時還會跳出來救場一次。' },
};
// 鄰居學乖：被偷過的人家，下一晚開始加裝防備
const REACTIONS = {
  wang: { text: '王太太在院子裝了感應燈', desc: '踩進王家院子燈就會亮，王太太會馬上往窗外看' },
  lin: { text: '林先生在院子裝了監視器', desc: '監視器會左右掃院子' },
  bo: { text: '阿伯在院子鋪了碎石', desc: '走在碎石上會有聲音，慢慢走也一樣' },
  public: { text: '里長說要加強巡邏', desc: '巡守隊 00:20 會多巡一次' },
};
// 白天接的訂單，當晚交貨。mode all：湊齊才有獎勵；each：每朵都有獎勵
const ORDERS = {
  2: [
    { id: 'o2a', who: '阿伯', t: 'jasmine', n: 2, mode: 'all', reward: 600 },
    { id: 'o2b', who: '熟客', t: 'periwinkle', n: 3, mode: 'all', reward: 400 },
  ],
  3: [
    { id: 'o3a', who: '里長', t: 'bougain', n: 2, mode: 'all', reward: 500 },
    { id: 'o3b', who: '熟客', t: 'tanhua', n: 1, mode: 'all', reward: 1200 },
  ],
  4: [
    { id: 'o4a', who: '婚禮花藝師', t: 'orchid', n: 3, mode: 'each', reward: 800 },
    { id: 'o4b', who: '王太太', t: 'rose', n: 2, mode: 'all', reward: 900 },
  ],
};
const NIGHT_NEWS = {
  1: ['花店在巷子最上面，鄰居家都在下面。偷到的花叼回花店門口的貓門才算數。'],
  2: ['阿伯院子裝了感應燈。', '偷過的盆栽今晚只剩花梗，要換地方偷。'],
  3: ['巡守隊開始巡邏了。', '大宅溫室的蝴蝶蘭一盆 NT$ 1,500。'],
  4: ['最後一晚！大宅管家整晚在花園巡，巡守隊巡三次。', '大宅為了明天的婚禮，溫室又補滿了蝴蝶蘭。'],
};
// 情報泡泡的圖示
const INTEL_TYPE = {
  wangRose: 'flower', linJasmine: 'flower', orchid: 'flower',
  wangTV: 'time', linWalk: 'time', boTanhua: 'time', boTea: 'time', patrolTimes: 'time', wedding: 'time',
  wangCute: 'heart', linDog: 'heart', boRub: 'heart', chiefMeow: 'heart', butlerCat: 'heart',
  linNose: 'alert', boPace: 'alert', boLight: 'alert', camera: 'alert',
  orangeCat: 'cat',
};
const DAY1_INTEL = ['wangRose', 'wangTV', 'wangCute', 'linJasmine', 'linNose', 'linWalk', 'linDog', 'boTanhua', 'boPace', 'boTea', 'boRub'];
