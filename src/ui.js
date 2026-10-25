// ================= 介面與流程 =================
const NUM = ['零', '一', '二', '三', '四', '五'];
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const UI = {
  last: {}, toastTimer: 0, dialogTimer: 0, modalOpen: false,
  init() {
    this.hudEl = $('hud'); this.phaseEl = $('hud-phase'); this.moneyEl = $('hud-money'); this.cansEl = $('hud-cans');
    this.carryEl = $('hud-carry'); this.toastEl = $('toast'); this.bannerEl = $('banner');
    this.dialogEl = $('dialog'); this.dNameEl = this.dialogEl.querySelector('.d-name'); this.dTextEl = this.dialogEl.querySelector('.d-text');
    this.actBtn = $('btn-act'); this.waitBtn = $('btn-wait'); this.meterEl = $('meter');
    this.modalEl = $('modal'); this.cardEl = this.modalEl.querySelector('.card'); this.sheetEl = $('sheet'); this.fadeEl = $('fade');
    const press = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SFX.init(); SFX.resume(); fn(); });
    press(this.actBtn, () => Flow.action());
    press(this.waitBtn, () => Flow.wait());
    this.skBtns = [$('btn-sk1'), $('btn-sk2'), $('btn-sk3')]; this.skIds = [null, null, null];
    this.skBtns.forEach((b, i) => press(b, () => Flow.skill(i)));
    this.ordersEl = $('hud-orders');
    press($('btn-pause'), () => this.pause());
    this.dialogEl.addEventListener('pointerdown', e => { e.stopPropagation(); if (G.scene) G.scene.skip = true; });
  },
  hud(mode) {
    this.mode = mode;
    this.hudEl.hidden = mode === 'none';
    this.carryEl.hidden = mode !== 'night';
    this.ordersEl.hidden = true; this.ordersEl.innerHTML = '';
    this.last = {};
    if (mode !== 'night') { this.setAction(null); this.setWait(false, false); this.setSkills([]); }
    this.meter(false);
  },
  // 能力按鈕（紙箱、橘貓）
  setSkills(list) {
    const key = list.map(it => it.id + it.label + it.n + (it.on ? 1 : 0) + (it.off ? 1 : 0)).join('|');
    if (this.last.sk === key) return;
    this.last.sk = key;
    this.skBtns.forEach((b, i) => {
      const it = list[i];
      this.skIds[i] = it ? it.id : null;
      b.hidden = !it;
      if (!it) return;
      b.innerHTML = `<span>${esc(it.label)}</span><i class="px">${it.n}</i><kbd>${'FRT'[i]}</kbd>`;
      b.classList.toggle('on', !!it.on); b.classList.toggle('off', !!it.off);
      b.setAttribute('aria-label', it.label + '，剩 ' + it.n + ' 次');
    });
  },
  orderChip(o, got) {
    const done = got >= o.n;
    return `<span class="ochip ${done ? 'done' : ''}" title="${esc(o.who)}"><img src="${G.icons[o.t]}" alt="${FLOWERS[o.t].name}"><b class="px">${Math.min(got, o.n)}/${o.n}</b></span>`;
  },
  setOrders(key, html) {
    if (this.last.ord === key) return;
    this.last.ord = key; this.ordersEl.innerHTML = html; this.ordersEl.hidden = !html;
  },
  closeModal() { this.modalEl.hidden = true; this.modalOpen = false; G.paused = false; Input.onKey = null; },
  setText(el, key, v) { if (this.last[key] !== v) { this.last[key] = v; el.textContent = v; } },
  setHTML(el, key, v) { if (this.last[key] !== v) { this.last[key] = v; el.innerHTML = v; } },
  nightHud(sc) {
    const run = G.run;
    const late = sc.end - sc.time < 30;
    this.setHTML(this.phaseEl, 'phase', `<span class="lbl">${(run.month || 1) > 1 ? '第' + cn(run.month) + '個月 ' : ''}第${NUM[sc.n]}晚</span><b class="px">${fmtTime(sc.time)}</b>`);
    this.phaseEl.classList.toggle('late', late);
    const v = sc.deposited.reduce((s, f) => s + flowerValue(run, f.t, f.fresh), 0);
    this.setHTML(this.moneyEl, 'money', `<span class="lbl">今晚</span><b class="px">${Math.round(v).toLocaleString('en-US')}</b>`);
    this.setHTML(this.cansEl, 'cans', `<img src="${G.icons.can}" alt=""><b class="px">${run.cans}</b>`);
    const ords = sc.orders || [];
    const got = o => sc.deposited.filter(f => f.t === o.t).length;
    this.setOrders(ords.map(o => o.t + got(o)).join('|'), ords.map(o => this.orderChip(o, got(o))).join(''));
    const cap = sc.capacity();
    const key = sc.cat.carry.map(f => f.t + Math.round(f.fresh * 10)).join('|') + '/' + cap + '/' + (sc.orange && sc.orange.carry[0] ? sc.orange.carry[0].t : '');
    if (this.last.carry !== key) {
      this.last.carry = key;
      let h = '';
      for (let i = 0; i < cap; i++) {
        const f = sc.cat.carry[i];
        h += f ? `<span class="slot full"><img src="${G.icons[f.t]}" alt="${FLOWERS[f.t].name}"><i style="width:${Math.round(f.fresh * 100)}%"></i></span>` : '<span class="slot"></span>';
      }
      const of = sc.orange && sc.orange.carry[0];
      if (of) h += `<span class="slot full oc" title="橘貓叼著"><img src="${G.icons[of.t]}" alt="橘貓叼著${FLOWERS[of.t].name}"></span>`;
      this.carryEl.innerHTML = h;
    }
  },
  dayHud(sc) {
    const run = G.run;
    this.setHTML(this.phaseEl, 'phase', `<span class="lbl">${sc.monthStart ? '第' + cn(run.month) + '個月' : ((run.month || 1) > 1 ? '第' + cn(run.month) + '個月 ' : '') + (sc.n === 5 ? '月底' : '第' + NUM[sc.n] + '天')}</span><b>${sc.tint === 'evening' ? '傍晚' : '早上'}</b>`);
    this.phaseEl.classList.remove('late');
    if (sc.n === 1) {
      const got = DAY1_INTEL.filter(k => run.intel[k]).length;
      this.setHTML(this.moneyEl, 'money', `<span class="lbl">情報</span><b class="px">${got}</b><span class="of">/${DAY1_INTEL.length}</span>`);
    } else this.setHTML(this.moneyEl, 'money', `<span class="lbl">房租</span><b class="px">${Math.round(run.money).toLocaleString('en-US')}</b><span class="of">/${Math.round(rentDue(run) / 1000)}k</span>`);
    this.setHTML(this.cansEl, 'cans', `<img src="${G.icons.can}" alt=""><b class="px">${run.cans}</b>`);
    // 店裡還有幾束花、今晚的訂單
    const left = sc.stock ? sc.stock.length : 0, nb = sc.bouquets ? sc.bouquets.length : 0, rq = sc.request && !sc.request.done ? sc.request : null;
    const ords = (run.orders && run.orders[sc.n]) || [];
    const html = (left ? `<span class="ochip stock"><span class="lbl">店裡</span><b class="px">${left}</b><span class="lbl">枝</span></span>` : '') +
      (nb ? `<span class="ochip stock bq"><span class="lbl">花束</span><b class="px">${nb}</b></span>` : '') +
      (rq ? `<span class="ochip lbl-only req">指定${esc(rq.label)}</span>` : '') +
      (ords.length ? `<span class="ochip lbl-only">今晚訂單</span>` + ords.map(o => this.orderChip(o, 0)).join('') : '');
    this.setOrders(left + '/' + nb + '/' + (rq ? rq.id : '') + '/' + ords.map(o => o.id).join(','), html);
    this.setSkills(sc.canBouquet && sc.canBouquet() ? [{ id: 'bouquet', label: '包花束', n: sc.sellableCount() }] : []);
  },
  toast(msg, ms = 2600) {
    const el = this.toastEl;
    el.textContent = msg; el.hidden = false;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { el.hidden = true; }, ms);
  },
  banner(text) {
    const el = this.bannerEl;
    el.textContent = text; el.hidden = false;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => { el.hidden = true; }, 2200);
  },
  say(name, text, o = {}) {
    this.dialogEl.hidden = false;
    this.setText(this.dNameEl, 'dname', name);
    this.setText(this.dTextEl, 'dtext', text);
    this.dialogEl.classList.toggle('dim', !!o.dim);
    this.dialogEl.classList.toggle('intel', !!o.intel && !o.dim);
    clearTimeout(this.dialogTimer);
    if (o.auto) this.dialogTimer = setTimeout(() => this.hideDialog(), o.auto * 1000);
  },
  hideDialog() { this.dialogEl.hidden = true; this.last.dname = this.last.dtext = null; },
  setAction(label) {
    if (this.last.act === label) return;
    this.last.act = label;
    this.actBtn.hidden = !label;
    if (label) { this.actBtn.textContent = label; this.actBtn.classList.toggle('off', label === '嘴巴滿了'); this.actBtn.classList.toggle('long', label.length > 2); }
  },
  setWait(visible, active) {
    const k = visible + ':' + active;
    if (this.last.wait === k) return;
    this.last.wait = k;
    this.waitBtn.hidden = !visible;
    this.waitBtn.textContent = active ? '起來' : '母雞蹲';
    this.waitBtn.classList.toggle('on', !!active);
  },
  meter(show, label, v, sub, alert) {
    this.meterEl.hidden = !show;
    if (this.ordersEl) this.ordersEl.style.visibility = show ? 'hidden' : '';
    if (!show) return;
    this.setText(this.meterEl.querySelector('.m-label'), 'mlabel', label);
    this.setText(this.meterEl.querySelector('.m-sub'), 'msub', sub);
    this.meterEl.querySelector('i').style.width = Math.round(v * 100) + '%';
    this.meterEl.classList.toggle('alert', !!alert);
  },
  // ---------- 視窗 ----------
  modal(html, buttons = [], o = {}) {
    this.modalOpen = true; G.paused = !!o.pause;
    Input.release();
    this.cardEl.className = 'card' + (o.cls ? ' ' + o.cls : '');
    this.modalEl.classList.toggle('see', o.cls === 'title' && R3.on);
    this.cardEl.innerHTML = html + (buttons.length ? `<div class="btns">${buttons.map((b, i) => `<button type="button" class="btn ${b.primary ? 'primary' : ''}" data-i="${i}">${b.label}</button>`).join('')}</div>` : '');
    this.modalEl.hidden = false;
    this.cardEl.scrollTop = 0;
    const close = () => { this.modalEl.hidden = true; this.modalOpen = false; G.paused = false; Input.onKey = null; };
    this.cardEl.querySelectorAll('.btns .btn').forEach(el => el.addEventListener('click', () => {
      SFX.init(); SFX.resume(); SFX.play('ui');
      const b = buttons[+el.dataset.i];
      if (b.keep) { b.onClick && b.onClick(); return; }
      close(); b.onClick && b.onClick();
    }));
    const primary = buttons.findIndex(b => b.primary);
    Input.onKey = (k) => {
      if ((k === 'enter' || k === ' ') && primary >= 0) { this.cardEl.querySelector(`.btns .btn[data-i="${primary}"]`).click(); return true; }
      return false;
    };
    setTimeout(() => { const f = this.cardEl.querySelector('.btn.primary') || this.cardEl.querySelector('.btn'); if (f) try { f.focus({ preventScroll: true }); } catch (e) { } }, 30);
    return close;
  },
  confirm(title, text, okLabel, cancelLabel, cb) {
    this.modal(`<h2>${esc(title)}</h2><p class="lead">${esc(text)}</p>`, [
      { label: cancelLabel, onClick: () => cb(false) },
      { label: okLabel, primary: true, onClick: () => cb(true) },
    ], { pause: true, cls: 'small' });
  },
  pause() {
    if (this.modalOpen || !G.scene || G.scene.kind === 'title') return;
    if (G.scene.cute) return;
    const html = `<h2>暫停</h2>
      <div class="howto">
        <div><b>移動</b>按住畫面任何地方拖曳。輕推潛行，推到底奔跑（有腳步聲、會掉花瓣）</div>
        <div><b>互動</b>右下角按鈕：叼花、撥倒東西、跳、爬、收工</div>
        <div><b>躲藏</b>走進草叢鄰居就看不到；躲好時可以「母雞蹲」快轉</div>
        <div><b>能力</b>第二晚起學會爬屋頂、第三晚紙箱、第四晚帶橘貓出門（右下角按鈕）</div>
        <div><b>熟門熟路</b>同一家偷熟了（帶回 6 朵），第二個月起在花店貓門按「熟門」，花喵自己去帶回來</div>
        <div><b>警戒</b>偷太多、被抓到，那一家就會起疑：一顆星上門盤問、兩顆星裝防貓設施、三顆星里長約談。送花賠罪、幾晚不去就會降</div>
        <div><b>鍵盤</b>方向鍵移動、Shift 奔跑、空白鍵互動、Q 母雞蹲、F 紙箱、R 橘貓</div>
      </div>`;
    this.modal(html, [
      { label: SFX.muted ? '打開音效' : '關掉音效', onClick: () => { SFX.muted = !SFX.muted; try { localStorage.setItem('thm-mute', SFX.muted ? '1' : '0'); } catch (e) { } this.pause(); } },
      { label: '重新開始', onClick: () => this.confirm('重新開始？', '這一輪的進度會清掉。', '重新開始', '取消', ok => { if (ok) Flow.restart(); }) },
      { label: '繼續', primary: true },
    ], { pause: true });
  },
  cuteChoice(name, opts, known, immune, cb, combo = 0, assist = false) {
    const hearts = p => p >= 0.7 ? '♥♥♥' : p >= 0.45 ? '♥♥' : '♥';
    // 每一招有三種玩法，被抓到時隨機抽一種
    this.sheetEl.innerHTML = `<div class="sheet-head"><b>被${esc(name)}發現了！</b><span>${combo ? `萌連擊 ×${combo} 中` : '快賣萌'}</span></div>
      <div class="cute-row">${opts.map(o => `<button type="button" class="cute-btn" data-id="${o.id}"><span class="cn">${o.name}</span><span class="ch ${known ? '' : 'unk'}">${known ? hearts(o.p) : '？'}</span><span class="how">${esc(o.how || '')}</span><kbd>${o.key}</kbd></button>`).join('')}</div>
      <p class="sheet-note">${known ? '白天偷聽過' + esc(name) + '的喜好：♥ 越多越好做' : '沒聽過' + esc(name) + '的喜好，只能用猜的'}${immune ? `。同一個人萌越多次越難（已萌 ${immune} 次）` : ''}${assist ? '<br><b class="oc-note">橘貓在旁邊：失敗時牠會救場，再玩一次</b>' : ''}</p>`;
    this.sheetEl.hidden = false;
    this.setAction(null); this.setWait(false, false); this.setSkills([]);
    let picked = false;
    const pick = id => {
      if (picked) return; picked = true;
      SFX.play('ui'); this.sheetEl.hidden = true; Input.onKey = null; cb(id);
    };
    this.sheetEl.querySelectorAll('.cute-btn').forEach(el => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); pick(el.dataset.id); }));
    Input.onKey = k => { const o = opts.find(x => x.key === k); if (o) { pick(o.id); return true; } return false; };
  },
  // 給橘貓下指令（選的時候時間暫停）
  orangeChoice(opts, energy, cb) {
    this.sheetEl.innerHTML = `<div class="sheet-head"><b>要橘貓做什麼？</b><span>體力 <em class="oc-e">${'●'.repeat(energy)}</em></span></div>
      <div class="cute-row">${opts.map(o => `<button type="button" class="cute-btn oc-btn${o.ok ? '' : ' dis'}" data-id="${o.id}"><span class="cn">${o.name}</span><span class="how">${esc(o.desc)}</span><kbd>${o.key}</kbd></button>`).join('')}</div>
      <div class="sheet-foot"><p class="sheet-note">牠也會幫你把風：豎耳朵喵一聲，就是有人要往這邊看了。</p><button type="button" class="btn sheet-x">算了</button></div>`;
    this.sheetEl.hidden = false;
    let picked = false;
    const done = id => { if (picked) return; picked = true; this.sheetEl.hidden = true; Input.onKey = null; cb(id); };
    const choose = o => {
      if (!o.ok) { SFX.play('nope'); const el = this.sheetEl.querySelector(`[data-id="${o.id}"]`); if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } return; }
      SFX.play('ui'); done(o.id);
    };
    this.sheetEl.querySelectorAll('.oc-btn').forEach(el => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); choose(opts.find(x => x.id === el.dataset.id)); }));
    this.sheetEl.querySelector('.sheet-x').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SFX.play('ui'); done(null); });
    Input.onKey = k => {
      if (k === 'escape' || k === 'f' || k === 'r') { done(null); return true; }
      const o = opts.find(x => x.key === k); if (o) { choose(o); return true; }
      return false;
    };
  },
  // 熟門熟路：挑一家，花喵自己去偷（選的時候時間暫停）
  raidChoice(opts, cap, cb) {
    this.sheetEl.innerHTML = `<div class="sheet-head"><b>熟門熟路</b><span>一次叼 ${cap} 朵</span></div>
      <div class="raid-list">${opts.map((o, i) => `<button type="button" class="cute-btn raid-btn${o.ok ? '' : ' dis'}" data-id="${o.id}"><span class="rn">${esc(o.name)}<small>${starStr(starsOf(G.run, o.id))}</small></span><span class="rf">${o.pots.map(p => `<img src="${G.icons[p.t]}" alt="${FLOWERS[p.t].name}">`).join('') || '—'}</span><span class="rt">${o.ok ? `${o.mins} 分鐘・約 ${money(o.value)}` : esc(o.why)}</span><kbd>${i + 1}</kbd></button>`).join('')}</div>
      <div class="sheet-foot"><p class="sheet-note">花喵會自己溜過去把花一趟一趟叼回來，你在店裡等。偷得越多，那一家越緊張。</p><button type="button" class="btn sheet-x">算了</button></div>`;
    this.sheetEl.hidden = false;
    let picked = false;
    const done = id => { if (picked) return; picked = true; this.sheetEl.hidden = true; Input.onKey = null; cb(id); };
    const choose = o => {
      if (!o || !o.ok) { SFX.play('nope'); const el = o && this.sheetEl.querySelector(`[data-id="${o.id}"]`); if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } return; }
      SFX.play('ui'); done(o.id);
    };
    this.sheetEl.querySelectorAll('.raid-btn').forEach(el => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); choose(opts.find(x => x.id === el.dataset.id)); }));
    this.sheetEl.querySelector('.sheet-x').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SFX.play('ui'); done(null); });
    Input.onKey = k => {
      if (k === 'escape' || k === 'f' || k === 'r') { done(null); return true; }
      const i = parseInt(k, 10); if (i >= 1 && i <= opts.length) { choose(opts[i - 1]); return true; }
      return false;
    };
  },
  // ---------- 各種結算畫面 ----------
  rentBar(run, extra = 0, pending = 0) {
    const R = rentDue(run), p = clamp((run.money + extra) / R, 0, 1), q = clamp((run.money + extra + pending) / R, 0, 1) - p;
    return `<div class="rent"><div class="rent-top"><span>${(run.month || 1) > 1 ? '第' + cn(run.month) + '個月房租' : '月底房租'}${run.debt ? '<small>（含上個月欠的）</small>' : ''}</span><b class="px">${Math.round(run.money + extra).toLocaleString('en-US')} / ${R.toLocaleString('en-US')}</b></div><div class="rent-bar"><i style="width:${(p * 100).toFixed(1)}%"></i>${pending > 0 ? `<s style="width:${(q * 100).toFixed(1)}%"></s>` : ''}</div>${pending > 0 ? `<p class="rent-note">淡色：今天賣完花之後（+${Math.round(pending).toLocaleString('en-US')}）</p>` : ''}</div>`;
  },
  tally(run, done, S) {
    const R = run.lastNight, st = storeOf(run);
    if (!R || !R.stock) { done(); return; }
    const canBq = S && S.sellableCount && S.sellableCount() >= BQ_MIN;
    const N = v => Math.round(v).toLocaleString('en-US');
    const groups = {};
    for (const f of R.stock) { const g = groups[f.t] || (groups[f.t] = { t: f.t, count: 0, value: 0, fsum: 0 }); g.count++; g.value += flowerValue(run, f.t, f.fresh); g.fsum += st.fridge ? 1 : f.fresh; }
    const items = Object.values(groups).sort((a, b) => b.value - a.value);
    const rows = items.map(i => `<li><img src="${G.icons[i.t]}" alt=""><span class="nm">${FLOWERS[i.t].name} <em>×${i.count}</em></span><span class="fr">花況 ${Math.round(i.fsum / i.count * 100)}%</span><b class="px">${N(i.value)}</b></li>`).join('');
    const mults = [];
    if (R.lucky > 1) mults.push(`招財貓 ×${R.lucky}`);
    if (R.lights > 1) mults.push(`補光燈 ×${R.lights}`);
    if (R.decor > 1) mults.push(`店面佈置 ×${R.decor}`);
    if (st.fridge) mults.push('冷藏花櫃：花況 100%，嬌貴的花 ×1.5');
    const orders = R.oRes.map(r => `<li class="ord ${r.ok ? 'ok' : 'no'}"><img src="${G.icons[r.o.t]}" alt=""><span class="nm">${esc(r.o.who)}・${FLOWERS[r.o.t].name} <em>${Math.min(r.got, r.o.n)}/${r.o.n}</em></span><span class="fr">${r.ok ? (r.o.mode === 'each' ? '每朵加價' : '交貨了') : '沒湊齊'}</span><b class="px">${r.bonus ? '+' + N(r.bonus) : '—'}</b></li>`).join('');
    const extra = [];
    if (R.orderSales > 0) extra.push(`<li class="mult"><span></span><span class="nm">訂單的花照價付</span><b class="px">+${N(R.orderSales)}</b></li>`);
    if (R.orange > 0) extra.push(`<li class="mult"><img src="${G.icons.orange}" alt=""><span class="nm">橘貓夥伴自己帶回來的</span><b class="px">+${N(R.orange)}</b></li>`);
    if (R.cuteCans > 0) extra.push(`<li class="mult"><img src="${G.icons.can}" alt=""><span class="nm">賣萌連擊，鄰居塞的罐罐</span><b class="px">+${R.cuteCans}</b></li>`);
    const note = R.lost ? '<p class="warn">天亮前沒趕回家，嘴裡的花掉在路上了。</p>' : '';
    const HS = R.heat || { changes: [], newMaster: [] };
    const heatHtml = HS.changes.length ? `<h3>鄰居的警戒</h3><ul class="tally heat">${HS.changes.map(c => `<li class="${c.to > c.from ? 'up' : c.to < c.from ? 'down' : ''}"><span class="nm">${esc(OWNERS[c.o].person)}<em>${c.taken ? '昨晚少了 ' + c.taken + ' 朵' : '昨晚沒去'}</em></span><span class="fr">${c.to > c.from ? '變緊張了' : c.to < c.from ? '放鬆了' : ''}</span><b class="stars">${starStr(c.to)}</b></li>`).join('')}</ul>${HS.changes.some(c => c.to >= 1) ? '<p class="hint">一顆星：隔天會來店裡問問題　兩顆星：裝防貓設施　三顆星：里長約談。送花賠罪、幾晚不去，星星就會降。</p>' : ''}` : '';
    const masterHtml = HS.newMaster.length ? `<div class="newab master"><span class="tagnew">熟門熟路</span><b>${HS.newMaster.map(o => OWNERS[o].name).join('、')}</b><p>偷熟了！${raidUnlocked(run) ? '' : '第二個月起，'}晚上在花店貓門按「熟門」，花喵就會自己去把那一家的花帶回來（會花一點時間）。</p></div>` : '';
    const gv = R.gardenValue || 0, GH = R.garden || [], GF = R.gifts || [], CU = R.cuts || [];
    const gardenHtml = (GH.length || GF.length || (CU.length && gardenOpen(run))) ? `<div class="newab garden"><span class="tagnew">頂樓花園</span>
      ${GH.length ? `<p>收成：<b>${GH.map(h => FLOWERS[h.t].name + ' ×' + h.n).join('、')}</b></p>` : ''}
      ${GF.length ? `<p>門口的禮物：${GF.map(g => FAN_NAMES[g.who] + '送的' + FLOWERS[g.t].name).join('、')}</p>` : ''}
      ${CU.length && gardenOpen(run) ? `<p>順便叼回插枝：${CU.map(t => FLOWERS[t].name).join('、')}</p>` : ''}</div>` : '';
    const title = R.deposited.length ? `帶回 ${R.deposited.length} 朵花` : '昨晚空手而回';
    const prev = run.nightTotals && run.nightTotals.length > 1 ? run.nightTotals[run.nightTotals.length - 2] : 0;
    const growth = prev > 0 && R.total > 0 ? `<p class="growth">這一晚的總價值 <b class="px">${N(R.total)}</b>，是上一晚的 <b class="px">×${(R.total / prev).toFixed(1)}</b></p>` : '';
    const html = `<p class="eyebrow">第${NUM[R.n]}晚的成果</p><h2>${title}</h2>
      ${items.length ? `<h3>今天店裡要賣的花</h3><ul class="tally">${rows}</ul>` : (R.deposited.length ? '' : '<p class="lead">店裡今天又是空的……</p>')}
      ${mults.length ? `<p class="mults">${mults.map(esc).join('<span>・</span>')}</p>` : ''}
      ${orders ? `<h3>訂單${st.scooter ? '<small>外送機車：獎勵 ×2</small>' : ''}</h3><ul class="tally">${orders}</ul>` : ''}
      ${extra.length ? `<ul class="tally">${extra.join('')}</ul>` : ''}${note}${commissionTallyHTML(R)}${gangTallyHTML(R)}${nmTallyHTML(R)}${gardenHtml}${masterHtml}${heatHtml}
      <div class="total"><span>現在入帳</span><b class="px" id="tally-total">0</b></div>
      ${R.stockValue + gv > 0 ? `<div class="total sub"><span>白天客人上門買花</span><b class="px">≈ ${N(R.stockValue + gv)}</b></div>` : ''}
      ${growth}
      <div class="cans-earn"><img src="${G.icons.can}" alt=""><span>美玲賞你罐罐</span><b class="px" id="tally-cans">+0</b></div>
      ${this.rentBar(run, -R.now, R.stockValue + gv)}`;
    const req = S && S.request ? `<p class="bq-req">今天有熟客指定：<b>${esc(S.request.label)}</b>（包好馬上買走，多給 ${money(S.request.bonus)}）</p>` : '';
    const sorry = apologyTargets(run);
    this.modal(html + (canBq ? `<p class="hint">可以先把花包成花束：配色漂亮、或湊成有名字的花束，賣得比一枝一枝還貴。${sorry.length ? `<br>${sorry.map(o => OWNERS[o].person).join('、')}在起疑：包好的花束也可以送去賠罪，警戒會降。` : ''}</p>${req}` : ''),
      canBq ? [{ label: '先包花束', onClick: () => UI.bouquetStudio(S, done) }, { label: '開店', primary: true, onClick: done }] : [{ label: R.stock.length ? '開店' : '好', primary: true, onClick: done }], { pause: false });
    // 數字往上跳
    const totEl = $('tally-total'), canEl = $('tally-cans'), bar = this.cardEl.querySelector('.rent-bar i'), top = this.cardEl.querySelector('.rent-top b');
    let t = 0; const dur = 1.1; const from = run.money - R.now;
    const step = () => {
      t += 1 / 60; const k = Math.min(1, t / dur); const e = 1 - Math.pow(1 - k, 3);
      if (!totEl.isConnected) return;
      totEl.textContent = '+' + N(R.now * e);
      canEl.textContent = '+' + Math.round(R.cans * e);
      const m = from + R.now * e;
      bar.style.width = (clamp(m / rentDue(run), 0, 1) * 100).toFixed(1) + '%';
      top.textContent = N(m) + ' / ' + rentDue(run).toLocaleString('en-US');
      if (R.now > 0 && Math.floor(t * 60) % 4 === 0) SFX.play('coin');
      if (k < 1) requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), 250);
  },
  shop(run, done) {
    const st = storeOf(run);
    let tab = 'store', pickIdx = -1;
    const render = () => {
      const pips = (lv, max) => Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
      let body;
      if (tab === 'store') {
        const nightsLeft = Math.max(0, 4 - (run.night || 1));
        const rows = STORE_UPGRADES.map(u => {
          const lv = st[u.id] || 0, maxed = lv >= u.max, cost = maxed ? 0 : u.cost[lv];
          const monNeed = !maxed && u.mon ? u.mon[lv] : 1, early = (run.month || 1) < monNeed;
          const can = !maxed && !early && run.money >= cost;
          const now = lv > 0 ? u.lv[lv - 1] : u.base, next = maxed ? '已經裝好了' : early ? `第${cn(monNeed)}個月開放：${u.lv[lv]}` : '買了：' + u.lv[lv];
          return `<li class="up ${maxed ? 'maxed' : ''}">
            <div class="up-main"><div class="up-name"><span class="grp store">花店</span><b>${u.name}</b><span class="pips">${pips(lv, u.max)}</span></div>
            <div class="up-now">${esc(now)}</div><div class="up-next">${esc(next)}</div></div>
            <button type="button" class="buy cash" data-id="${u.id}" ${can ? '' : 'disabled'}>${maxed ? '已裝' : `<b class="px">${cost.toLocaleString('en-US')}</b>`}</button></li>`;
        }).join('');
        body = `<p class="lead">「先投資店面，之後每天都多賺一點……可是房租也要留著。」</p>
          <p class="hint">還剩 <b>${nightsLeft}</b> 晚。越早裝回本越多；買下去馬上會看到店裡變樣。</p>
          ${this.rentBar(run)}
          <ul class="ups">${rows}</ul>${windowHTML(run)}`;
      } else if (tab === 'garden') {
        body = gardenTabHTML(run, pickIdx);
      } else if (tab === 'nm') {
        body = nmTabHTML(run);
      } else {
        const rows = UPGRADES.map(u => {
          const lv = run.upg[u.id] || 0;
          const maxed = lv >= u.max;
          const monNeed = !maxed && u.mon ? u.mon[lv] : 1;
          const locked = (u.need && !run.intel[u.need]) || (run.month || 1) < monNeed;
          const cost = maxed ? 0 : u.cost[lv];
          const can = !locked && !maxed && run.cans >= cost;
          const now = lv > 0 ? u.lv[lv - 1] : u.base;
          const next = maxed ? '已經滿級' : (u.need && !run.intel[u.need]) ? '白天沒聽說過這號人物' : (run.month || 1) < monNeed ? `第${cn(monNeed)}個月才進貨：${u.lv[lv]}` : '下一級：' + u.lv[lv];
          return `<li class="up ${maxed ? 'maxed' : ''} ${locked ? 'locked' : ''}">
            <div class="up-main"><div class="up-name"><span class="grp">${u.group}</span><b>${u.name}</b><span class="pips">${pips(lv, u.max)}</span></div>
            <div class="up-now">${esc(now)}</div><div class="up-next">${esc(next)}</div></div>
            <button type="button" class="buy" data-id="${u.id}" ${can ? '' : 'disabled'}>${maxed ? '滿級' : `<img src="${G.icons.can}" alt="罐罐"><b class="px">${cost}</b>`}</button></li>`;
        }).join('');
        body = `<p class="lead">「罐罐拿來，本事教你。」<br><small>學到的本事都會穿戴在花喵身上。</small></p>
          <div class="wallet"><img src="${G.icons.can}" alt=""><b class="px">${run.cans}</b><span>個罐罐</span></div>
          <div class="cat-looks"><figure><canvas class="cat-look" data-who="tab"></canvas><figcaption>花喵現在的樣子</figcaption></figure>${run.upg.orange ? '<figure><canvas class="cat-look" data-who="orange"></canvas><figcaption>橘貓夥伴</figcaption></figure>' : ''}</div>
          <ul class="ups">${rows}</ul>${gangShopHTML(run)}`;
      }
      const html = `<p class="eyebrow">傍晚</p><h2>${tab === 'store' ? '美玲的花店' : tab === 'garden' ? '頂樓花園' : tab === 'nm' ? '夜市花攤' : '巷口・老貓的攤子'}</h2>
        <div class="tabs" role="tablist">
          <button type="button" class="tab ${tab === 'store' ? 'on' : ''}" data-tab="store" role="tab" aria-selected="${tab === 'store'}">花店升級<small>現金 ${Math.round(run.money).toLocaleString('en-US')}</small></button>
          <button type="button" class="tab ${tab === 'garden' ? 'on' : ''}" data-tab="garden" role="tab" aria-selected="${tab === 'garden'}">頂樓花園<small>${gardenOpen(run) ? (gardenOf(run).lv ? GARDEN_LV[gardenOf(run).lv - 1].pots + ' 盆' : '還沒蓋') : '第二個月'}</small></button>
          ${nmOpen(run) ? `<button type="button" class="tab ${tab === 'nm' ? 'on' : ''}" data-tab="nm" role="tab" aria-selected="${tab === 'nm'}">夜市<small>${nmOf(run).lv ? NM_LV[nmOf(run).lv - 1].cap + ' 朵' : '還沒擺'}</small></button>` : ''}
          <button type="button" class="tab ${tab === 'cat' ? 'on' : ''}" data-tab="cat" role="tab" aria-selected="${tab === 'cat'}">老貓攤<small>罐罐 ${run.cans}</small></button>
        </div>${body}`;
      this.modal(html, [{ label: '圖鑑', keep: true, onClick: () => UI.book(run, () => render(), 'bq') }, { label: '天黑了，出門', primary: true, onClick: done }], { cls: 'shop' });
      this.cardEl.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { SFX.play('ui'); tab = b.dataset.tab; pickIdx = -1; render(); }));
      // 頂樓花園
      const keep = () => { const sc = this.cardEl.scrollTop; render(); this.cardEl.scrollTop = sc; };
      this.cardEl.querySelectorAll('canvas.garden-art').forEach(cv => drawGardenArt(cv, run));
      drawGangFaces(this.cardEl);
      this.cardEl.querySelectorAll('[data-win]').forEach(b => b.addEventListener('click', () => {
        if (setWindow(run, b.dataset.win)) { SFX.play('buy'); this.toast(`櫥窗換成「${winTheme(run).name}」！主題花 ×${WINDOW_MULT}`, 2600); }
        keep();
      }));
      this.cardEl.querySelectorAll('canvas.nm-art').forEach(cv => drawNmArt(cv, run));
      this.cardEl.querySelectorAll('[data-nm="up"]').forEach(b => b.addEventListener('click', () => {
        const N = nmOf(run), nx = NM_LV[N.lv]; if (!nx || run.money < nx.cost || (run.month || 1) < nx.mon) return;
        run.money -= nx.cost; N.lv++; if (!N.star) N.star = 'rose'; SFX.play('buy');
        this.toast(`${nx.name}擺好了！${nx.look}`, 3000); keep();
      }));
      this.cardEl.querySelectorAll('[data-star]').forEach(b => b.addEventListener('click', () => { nmOf(run).star = b.dataset.star; SFX.play('ui'); keep(); }));
      this.cardEl.querySelectorAll('[data-gang]').forEach(b => b.addEventListener('click', () => {
        const m = GANG.find(x => x.id === b.dataset.gang);
        if (recruitGang(run, b.dataset.gang)) { SFX.play('meow'); this.toast(`${m.name}加入花喵幫了！晚上出門前可以派牠出去`, 2800); }
        keep();
      }));
      this.cardEl.querySelectorAll('[data-garden="up"]').forEach(b => b.addEventListener('click', () => {
        const g = gardenOf(run), nx = GARDEN_LV[g.lv]; if (!nx || run.money < nx.cost) return;
        run.money -= nx.cost; g.lv++; SFX.play('buy');
        this.toast(`${nx.name}蓋好了！${nx.look}${g.story[g.lv] ? '' : '（明天早上有人會注意到）'}`, 3200);
        keep();
      }));
      this.cardEl.querySelectorAll('[data-pot]').forEach(b => b.addEventListener('click', () => { SFX.play('ui'); pickIdx = pickIdx === +b.dataset.pot ? -1 : +b.dataset.pot; keep(); }));
      this.cardEl.querySelectorAll('[data-plant]').forEach(b => b.addEventListener('click', () => {
        if (plantPot(run, pickIdx, b.dataset.plant)) { SFX.play('buy'); this.toast(`種下${FLOWERS[b.dataset.plant].name}，${growNights(run, b.dataset.plant)} 晚後開花`, 2200); }
        pickIdx = -1; keep();
      }));
      this.cardEl.querySelectorAll('[data-pull]').forEach(b => b.addEventListener('click', () => {
        const i = +b.dataset.pull, p = gardenOf(run).plots[i]; if (!p) return;
        this.confirm('拔掉這盆？', `${FLOWERS[p.t].name}會被拔掉，插枝不會還給你。`, '拔掉', '算了', ok => { if (ok) pullPot(run, i); render(); });
      }));
      // 老貓攤：畫出花喵（和橘貓）現在穿戴的樣子
      this.cardEl.querySelectorAll('canvas.cat-look').forEach(cv => {
        const k = 2, art = cv.dataset.who === 'orange' ? orangeCloseup('maneki', 0.35, 'lin', 0, VXR, k) : withGear(catGearFor(run), () => drawMeowArt2({ t: 0.35, v: 1, open: 0.15, mood: 'happy' }, VXR, k));
        cv.width = art.width; cv.height = art.height; cv.getContext('2d').drawImage(art, 0, 0);
      });
      this.cardEl.querySelectorAll('.buy[data-id]').forEach(b => b.addEventListener('click', () => {
        if (tab === 'store') {
          const u = STORE_UPGRADES.find(x => x.id === b.dataset.id), lv = st[u.id] || 0;
          if (lv >= u.max || run.money < u.cost[lv] || (u.mon && (run.month || 1) < u.mon[lv])) return;
          run.money -= u.cost[lv]; st[u.id] = lv + 1;
          SFX.play('buy');
          if (G.scene && G.scene.reveal) {
            this.closeModal();
            G.scene.reveal(u.id, lv + 1, () => { tab = 'store'; render(); });
            return;
          }
          this.toast(u.name + ' 裝好了！', 1800);
        } else {
          const u = UPGRADES.find(x => x.id === b.dataset.id);
          const lv = run.upg[u.id] || 0;
          if (lv >= u.max || run.cans < u.cost[lv]) return;
          run.cans -= u.cost[lv]; run.upg[u.id] = lv + 1;
          SFX.play('buy');
          const m = u.lv[lv].match(/（(.+?)）/);
          if (m) this.toast('換裝：' + m[1] + '！', 2200);
        }
        const sc = this.cardEl.scrollTop; render(); this.cardEl.scrollTop = sc;
      }));
    };
    render();
  },
  brief(n, run, done) {
    const rules = nightRulesFor(run, n), ev = eventInfo(run, rules.event), m = run.month || 1;
    const th = themeOf(run);
    const newsList = m <= 1 ? (NIGHT_NEWS[n] || []) : [
      th ? `這個月是${th.name}：${Object.keys(th.boost).map(t => FLOWERS[t].name + ' ×' + th.boost[t]).join('、')}` : null,
      `巡守隊今晚巡 ${rules.patrol.length} 次。`,
      rules.butler ? '大宅管家今晚在花園巡。' : null,
      n === 4 ? `明天月底要繳房租 ${money(rentDue(run))}！` : null,
    ].filter(Boolean);
    const news = newsList.map(t => `<li>${esc(t)}</li>`).join('');
    const known = Object.keys(INTEL).filter(k => run.intel[k]);
    const fresh = known.filter(k => run.intel[k] === n);
    const old = known.filter(k => run.intel[k] !== n);
    const li = ks => ks.map(k => `<li>${esc(INTEL[k])}</li>`).join('');
    const intel = (fresh.length ? `<ul class="intel">${li(fresh)}</ul>` : '') +
      (old.length ? `<details class="old"${fresh.length ? '' : ' open'}><summary>之前聽到的 ${old.length} 則</summary><ul class="intel">${li(old)}</ul></details>` : '');
    const prices = FLOWER_ORDER.map(t => { const b = themeBoost(run, t); return `<span class="price${b > 1 ? ' boost' : ''}"><img src="${G.icons[t]}" alt=""><span>${FLOWERS[t].name}</span><b class="px">${Math.round(FLOWERS[t].price * b)}</b></span>`; }).join('');
    const end = NIGHT_END + 45 * run.upg.owl;
    const ab = m <= 1 ? ABILITY_ORDER.find(k => ({ climb: 2, box: 3, orange: 4 })[k] === n) : null;
    const ocLv = run.upg.orange || 0;
    const abHtml = (ab ? `<div class="newab"><span class="tagnew">新能力</span><b>${ABILITIES[ab].name}</b><p>${esc(ABILITIES[ab].desc)}</p></div>` : '') +
      (ocLv > 0 ? `<div class="newab partner"><span class="tagnew">夥伴</span><b>橘貓・體力 ${orangeEnergy(run)}</b><p>${ab === 'orange' ? '你收的橘貓今晚更有幹勁。' : '按「橘貓」可以叫牠撒嬌引開、分頭偷花、搗蛋引開；牠也會把風，你被抓到時還會救場一次。'}</p></div>` : '');
    // 鄰居的警戒：兩顆星就會裝防貓設施
    const fresh2 = (run.lastNight && run.lastNight.newReact) || [];
    const alertO = HEAT_OWNERS.filter(o => starsOf(run, o) >= 1).sort((a, b) => heatOf(run, b) - heatOf(run, a));
    const reactHtml = alertO.length ? `<h3>鄰居的警戒</h3><ul class="news react">${alertO.map(o => { const st = starsOf(run, o), R2 = st >= 2 && REACTIONS[o]; return `<li class="${fresh2.includes(o) ? 'fresh' : ''}"><b>${esc(OWNERS[o].person)} <span class="stars">${starStr(st)}</span></b><span>${esc(R2 ? REACTIONS[o].text + '：' + REACTIONS[o].desc : STAR_EFFECT[st])}${st >= 3 ? '。他家的人看得更仔細' : ''}</span></li>`; }).join('')}</ul>` : '';
    const ms = masteredList(run);
    const masterHtml = ms.length ? `<h3>熟門熟路</h3><p class="lead">${ms.map(o => `<b>${esc(OWNERS[o].name)}</b>${starsOf(run, o) >= 2 ? '<small>（防貓設施，不能用）</small>' : ''}`).join('、')}<br><small>${raidUnlocked(run) ? '在花店貓門按「熟門」，花喵自己去把那一家的花帶回來。大嘴巴越大，跑的趟數越少、越快。' : '這些人家已經偷熟了，第二個月起可以「熟門熟路」一鍵帶回。'}</small></p>` : '';
    const ords = (run.orders && run.orders[n]) || [];
    const st = storeOf(run);
    const ordHtml = ords.length ? `<h3>今晚的訂單${st.scooter ? '<small>外送機車：獎勵 ×2</small>' : ''}</h3><ul class="tally">${ords.map(o => `<li class="mult"><img src="${G.icons[o.t]}" alt=""><span class="nm">${esc(o.who)}・${FLOWERS[o.t].name} ×${o.n}</span><b class="px">${o.mode === 'each' ? '每朵 ' : '湊齊 '}+${(o.reward * (st.scooter ? 2 : 1)).toLocaleString('en-US')}</b></li>`).join('')}</ul>` : '';
    const xe = nightEventFor(run, n), XE = xe && NIGHT_EVENTS[xe.id];
    const xeHtml = XE ? `<div class="event ev-x"><b>還有：${esc(XE.name)}${XE.when ? `<small>大約 ${fmtTime(xe.t0)}</small>` : ''}</b><span>${esc(XE.desc)}</span></div>` : '';
    const html = `<p class="eyebrow">${monthPre(run)}22:30 – ${fmtTime(end)}</p><h2>第${NUM[n]}晚</h2>
      <div class="event ev-${rules.event}"><b>${esc(ev.name)}</b><span>${esc(ev.desc)}</span></div>${xeHtml}
      ${abHtml}${commissionBriefHTML(run)}${gangBriefHTML(run)}${masterHtml}${reactHtml}${ordHtml}
      ${news ? `<ul class="news">${news}</ul>` : ''}
      ${m <= 1 ? `<h3>${n === 1 ? '白天聽到的情報' : '今天聽到的情報'}</h3>
      ${intel || '<p class="lead">什麼都沒聽到……今晚只能見機行事。</p>'}` : (known.length ? `<details class="old"><summary>之前聽到的情報 ${known.length} 則</summary><ul class="intel">${li(known)}</ul></details>` : '')}
      ${n === 1 && m <= 1 && known.length < DAY1_INTEL.length ? `<p class="miss">有 ${DAY1_INTEL.length - known.length} 個情報泡泡飛走了</p>` : ''}
      <h3>行情</h3><div class="prices">${prices}</div>
      ${this.rentBar(run)}`;
    this.modal(html, [{ label: '出門 0 元購', primary: true, onClick: done }], { cls: 'brief' });
    this.cardEl.querySelectorAll('[data-gangt]').forEach(b => b.addEventListener('click', () => { SFX.play('ui'); cycleGangTarget(run, b.dataset.gangt); const sc = this.cardEl.scrollTop; this.brief(n, run, done); this.cardEl.scrollTop = sc; }));
  },
  title(onStart, save, onContinue) {
    const html = `<div class="title-logo">${R3.on ? '<canvas class="title-cat" width="336" height="224" aria-hidden="true"></canvas>' : `<img src="${G.icons.catBig}" alt="">`}<h1>偷花喵</h1></div>
      <p class="tag">白天招財貓，晚上偷花喵</p>
      <p class="lead">美玲的花店撐不過這個月了。四個晚上，叼鄰居家的花回來賣，湊出月底房租 NT$ 20,000。</p>
      <ul class="howto-mini"><li>拖曳畫面移動，推到底奔跑</li><li>白天靠近客人偷聽情報</li><li>被發現就賣萌</li></ul>`;
    if (save) {
      const html2 = html + `<p class="save-note">上次玩到：<b>${esc(saveLabel(save))}</b>　現金 ${money(save.run.money || 0)}</p>`;
      this.modal(html2, [
        { label: '重新開始', onClick: () => this.confirm('重新開始？', '上次的進度會被蓋掉，從第一個月重來。', '重新開始', '算了', ok => { if (ok) { clearSave(); onStart(); } else this.title(onStart, save, onContinue); }) },
        { label: '繼續', primary: true, onClick: onContinue },
      ], { cls: 'title' });
      return;
    }
    this.modal(html, [{ label: '開始', primary: true, onClick: onStart }], { cls: 'title' });
  },
  ending(run, ok, onRestart) {
    const s = run.stats;
    let title = '認真的小偷貓';
    if (s.caught === 0) title = '來無影去無蹤';
    else if (s.cuteWin >= 3 && s.cuteWin > s.cuteFail) title = '萌到犯規的大盜';
    if (run.money >= 30000) title = '巷口零元購之王';
    if (!ok) title = '差一點點的小偷貓';
    const html = `<p class="eyebrow">撐了 ${run.month || 1} 個月</p><h2>${ok ? '房租繳清了！' : '花店收起來了……'}</h2>
      <p class="badge">${esc(title)}</p>
      ${this.rentBar(run)}
      <div class="stats">
        <div><b class="px">${s.stolen}</b><span>偷到的花</span></div>
        <div><b class="px">${s.caught}</b><span>被發現</span></div>
        <div><b class="px">${s.cuteWin}/${s.cuteWin + s.cuteFail}</b><span>賣萌成功</span></div>
        <div><b class="px">${s.petals}</b><span>掉的花瓣</span></div>
      </div>
      <h3>每晚收入</h3>
      <div class="curve">${(run.nightTotals || []).slice(-8).map((v, i, a) => { const mx = Math.max(...a, 1), k = (run.nightTotals || []).length - a.length + i; return `<div class="bar"><b class="px">${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}</b><i style="height:${Math.max(4, Math.round(v / mx * 100))}%"></i><span>${k < 4 ? '第' + NUM[k + 1] + '晚' : (Math.floor(k / 4) + 1) + '-' + (k % 4 + 1)}</span></div>`; }).join('')}</div>
      <h3>接下來會長出來的</h3>
      <ul class="future">
        <li>夜市花攤：第四個月起在夜市擺第二個攤位</li>
        <li>鄰居的故事：關係越好，越會聽到王太太、阿伯、林先生的過去</li>
        <li>稀有的夜晚：流星雨、颱風、神秘的白貓</li>
      </ul>`;
    this.modal(html, [{ label: '再玩一次', primary: true, onClick: onRestart }], { cls: 'end' });
  },
  fade(cb) {
    const f = this.fadeEl; f.hidden = false; f.classList.remove('in'); void f.offsetWidth; f.classList.add('in');
    setTimeout(() => { cb && cb(); f.classList.remove('in'); f.classList.add('out'); setTimeout(() => { f.hidden = true; f.classList.remove('out'); }, 420); }, 380);
  },
};

// ---------- 流程 ----------
function newRun() {
  return {
    money: 0, cans: 0,
    upg: { mouth: 0, gentle: 0, paws: 0, owl: 0, cute: 0, jump: 0, orange: 0, lucky: 0, catwalk: 0, nightvis: 0, sniff: 0, bribe: 0, call: 0, tunnel: 0, tilt: 0, dead: 0, roofway: 0 },
    store: { lights: 0, fridge: 0, neon: 0, scooter: 0, decor: 0 },
    intel: {}, immune: {}, flags: {},
    stats: { caught: 0, cuteWin: 0, cuteFail: 0, petals: 0, stolen: 0 },
    garden: { lv: 0, plots: [], story: {} }, cuttings: {}, fans: [], gang: {}, strays: 0, nm: { lv: 0, star: null, story: {} }, bond: {}, storyCh: {}, regulars: {}, comm: null,
    month: 1, debt: 0, graceUsed: false, heat: {}, familiar: {}, nightIdx: 0, plan: {}, rentPaid: [],
    lastNight: null, rosePending: false, roseDone: false, night: 0,
    stock: [], orders: {}, regrow: {}, react: {},
  };
}
// ---------- 存檔：每次天亮、天黑出門時自動存在這台裝置的瀏覽器 ----------
const SAVE_KEY = 'thm-save-v1';
// 在 Claude 裡打開時，同時存到這個遊戲自己的雲端資料庫（每個人私有的那一格），
// 換裝置、重新打開都讀得到；GitHub 版沒有雲端，就只用瀏覽器的存檔。
const Cloud = {
  ref: null, busy: false, pending: null,
  async doc() {
    if (this.ref !== null) return this.ref;
    try {
      const C = window.claude;
      if (!C || !C.use) return (this.ref = false);
      const [db, user] = await Promise.all([C.use('db'), C.use('user')]);
      const id = user ? await user.id() : null;
      this.ref = db && id ? db.doc('data/users/' + id + '/save') : false;
    } catch (e) { this.ref = false; }
    return this.ref;
  },
  // 一次只寫一筆；寫的時候又有新存檔，就等這筆寫完再寫最新的
  async save(payload) {
    this.pending = payload;
    if (this.busy) return;
    this.busy = true;
    try {
      while (this.pending) {
        const p = this.pending; this.pending = null;
        const d = await this.doc(); if (!d) break;
        try { await d.set({ v: 1, kind: p.kind, n: p.n, t: p.t, run: JSON.stringify(p.run) }); } catch (e) { }
      }
    } finally { this.busy = false; }
  },
  async load() {
    try {
      const d = await this.doc(); if (!d) return null;
      const snap = await d.get(); if (!snap || !snap.exists) return null;
      const x = snap.data(); if (!x || !x.run) return null;
      return { v: x.v, kind: x.kind, n: x.n, t: x.t, run: JSON.parse(x.run) };
    } catch (e) { return null; }
  },
};
function saveGame(kind, n) {
  if (!G.run) return;
  const p = { v: 1, kind, n, t: Date.now(), run: G.run };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch (e) { }
  try { Cloud.save(JSON.parse(JSON.stringify(p))); } catch (e) { }
}
function normSave(d) {
  if (!d || d.v !== 1 || !d.run || (d.kind !== 'day' && d.kind !== 'night')) return null;
  try {
    const base = newRun(), r = Object.assign(base, d.run);
    for (const k of ['upg', 'store', 'stats']) r[k] = Object.assign(newRun()[k], d.run[k] || {});
    d.run = r;
    return d;
  } catch (e) { return null; }
}
function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!d || d.v !== 1 || !d.run || (d.kind !== 'day' && d.kind !== 'night')) return null;
    // 舊存檔少了新欄位時，用新遊戲的預設值補上
    const base = newRun(), r = Object.assign(base, d.run);
    for (const k of ['upg', 'store', 'stats']) r[k] = Object.assign(newRun()[k], d.run[k] || {});
    d.run = r;
    return d;
  } catch (e) { return null; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } Cloud.doc().then(d => { if (d) d.delete().catch(() => { }); }); }
function saveLabel(d) {
  const m = d.run.month || 1, n = d.n || 1;
  if (d.kind === 'night') return `第${cn(m)}個月・第${NUM[n]}晚出門前`;
  if (n >= 5) return `第${cn(m)}個月・月底繳房租`;
  return `第${cn(m)}個月・第${NUM[n]}天早上`;
}
function setScene(sc, hudMode) {
  if (sc.kind === 'day' || sc.kind === 'night') saveGame(sc.kind, sc.n);
  G.scene = sc; R3.cam.ready = false; R3.cam.zoom = R3.cam.tzoom = 1;
  // 換場景時把賣萌小遊戲的輸入、選招面板一起收掉（例如小遊戲中按暫停→重新開始）
  Input.game = null;
  if (UI.sheetEl && !UI.sheetEl.hidden) { UI.sheetEl.hidden = true; Input.onKey = null; }
  UI.hideDialog(); UI.setAction(null); UI.setWait(false, false);
  UI.hud(hudMode || (sc.kind === 'title' ? 'none' : sc.kind));
}
const Flow = {
  start() { G.run = newRun(); UI.fade(() => setScene(new DayScene(1))); },
  restart() { UI.fade(() => { G.run = newRun(); setScene(new DayScene(1)); }); },
  action() { if (G.scene && G.scene.onAction && !UI.modalOpen) G.scene.onAction(); },
  skill(i) { if (G.scene && G.scene.onSkill && !UI.modalOpen && UI.skIds[i]) G.scene.onSkill(UI.skIds[i]); },
  wait() { if (G.scene && G.scene.onWait && !UI.modalOpen) G.scene.onWait(); },
  dayDone(n) {
    const run = G.run;
    if (n === 1 && (run.month || 1) <= 1) { UI.brief(1, run, () => this.startNight(1)); return; }
    UI.shop(run, () => UI.brief(n, run, () => this.startNight(n)));
  },
  startNight(n) {
    const run = G.run;
    run.night = n; run.nightIdx = ((run.month || 1) - 1) * 4 + n;
    UI.fade(() => {
      setScene(new NightScene(n)); UI.banner(`${monthPre(run)}第${NUM[n]}晚　22:30`);
      const tip = {
        1: '黃色光錐是視線，被照到太久就會被發現',
        2: '下雨了：腳步聲變小、大家看得比較近。靠近鐵窗、柵欄按「爬」上屋頂',
        3: '中秋烤肉！空地人很多。鑽進「紙箱」不動，大家只看到一個箱子',
        4: '停電了！路燈全暗。按「橘貓」派牠去撒嬌把人引開',
      }[(run.month || 1) > 1 ? 0 : n];
      if (tip) setTimeout(() => { if (G.scene && G.scene.kind === 'night') UI.toast(tip, 4200); }, 2400);
    });
  },
  nightDone(res) {
    const run = G.run, st = storeOf(run), n = res.n;
    const dep = res.deposited;
    // 花喵幫：天亮前各自叼回來的花（算訂單、算鄰居警戒）
    const gangRes = gangNight(run, n);
    dep.push(...gangRes.flowers);
    // 訂單：湊齊（或每朵）就有獎勵；交給客人的花照價付錢
    const orders = (run.orders && run.orders[n]) || [];
    const used = {};
    const oRes = orders.map(o => {
      const have = dep.filter(f => f.t === o.t).length - (used[o.t] || 0);
      const k = o.mode === 'each' ? Math.min(o.n, have) : (have >= o.n ? o.n : 0);
      used[o.t] = (used[o.t] || 0) + k;
      const bonus = (o.mode === 'each' ? k * o.reward : (k ? o.reward : 0)) * (st.scooter ? 2 : 1);
      return { o, k, got: Math.max(0, have), ok: o.mode === 'each' ? k > 0 : k >= o.n, bonus };
    });
    const left = Object.assign({}, used), stock = [], orderSold = [];
    for (const f of dep) { if (left[f.t] > 0) { left[f.t]--; orderSold.push(f); } else stock.push({ t: f.t, fresh: f.fresh, owner: f.owner }); }
    // 大型委託：先把要的花留下來；夜市花攤：再把一部分的花帶去夜市賣掉
    const commRes = commissionTake(run, stock);
    const nmRes = nmSell(run, stock);
    const ordersBonus = oRes.reduce((s, r) => s + r.bonus, 0);
    const orderSales = orderSold.reduce((s, f) => s + flowerValue(run, f.t, f.fresh), 0);
    const stockValue = stock.reduce((s, f) => s + flowerValue(run, f.t, f.fresh), 0);
    const orange = ORANGE_INCOME[run.upg.orange] * LUCKY_MULT[run.upg.lucky];
    const now = Math.round(ordersBonus + orderSales + orange + (nmRes ? nmRes.v : 0) + (commRes ? commRes.paid : 0));
    // 頂樓花園：收成直接進店裡；粉絲在門口放的花；順便叼回的插枝
    const cuts = collectCuttings(run, dep);
    const hv = gardenTick(run), gifts = fanGifts(run);
    let gardenValue = 0;
    for (const h of hv) for (let i = 0; i < h.n; i++) { stock.push({ t: h.t, fresh: 1, owner: 'garden' }); gardenValue += flowerValue(run, h.t, 1); }
    for (const gf of gifts) { stock.push({ t: gf.t, fresh: 1, owner: 'gift' }); gardenValue += flowerValue(run, gf.t, 1); }
    const total = Math.round(now + stockValue + gardenValue);
    const cans = Math.floor(total / CANS_PER);
    run.money += now; run.cans += cans; run.stats.stolen += dep.length;
    run.stock = stock;
    run.nightTotals = (run.nightTotals || []).concat([total]);
    // 被偷的盆栽明天只剩花梗；鄰居的警戒、摸熟的人家
    run.regrow = run.regrow || {};
    for (const f of dep) if (f.idx !== undefined) run.regrow[f.idx] = run.nightIdx || n;
    const heat = settleNight(run, dep, res);
    const newReact = heat.changes.filter(c => c.to >= 2 && c.from < 2 && REACTIONS[c.o]).map(c => c.o);
    run.lastNight = { n, deposited: dep, stock: stock.slice(), stockValue, oRes, ordersBonus, orderSales, orange, now, total, cans, lucky: LUCKY_MULT[run.upg.lucky], lights: LIGHTS_MULT[st.lights || 0], decor: DECOR_MULT[st.decor || 0], lost: res.lost, tanhua: res.tanhua, rosePetals: res.rosePetals, newReact, heat, cuteCans: (res.stats && res.stats.cuteCans) || 0, garden: hv, gifts, gardenValue, cuts, gang: gangRes.report, nm: nmRes, comm: commRes };
    if (stock.some(f => f.t === 'rose' && f.owner === 'wang') && !run.roseDone) run.rosePending = true;
    setTimeout(() => UI.fade(() => setScene(new DayScene(n + 1))), res.timeUp ? 900 : 200);
    if (res.timeUp) UI.toast(res.lost ? '天亮了！嘴裡的花來不及帶回家……' : '天快亮了，回家睡覺', 2400);
  },
  resume(d) {
    G.run = d.run;
    UI.fade(() => setScene(d.kind === 'night' ? new NightScene(d.n) : new DayScene(d.n || 1)));
  },
  ending(ok) {
    if (!ok) clearSave();
    UI.ending(G.run, ok, () => this.restart());
  },
};

// ---------- 標題畫面 ----------
class TitleScene {
  constructor() {
    this.kind = 'title'; this.map = G.maps.night; this.bg = G.bg.night; this.t = 0;
    this.cat = new Cat(7.5 * TS, 6.4 * TS); this.cat.pose = 'loaf';
    this.lamps = LAMPS.map(([tx, ty]) => ({ x: (tx + 0.5) * TS, y: (ty + 1) * TS - 1, hx: (tx + 0.5) * TS, hy: (ty + 1) * TS - 22 }));
    this.bushes = [];
    for (let ty = 0; ty < this.map.h; ty++) for (let tx = 0; tx < this.map.w; tx++) if (this.map.at(tx, ty) === 'b') this.bushes.push({ x: (tx + 0.5) * TS, y: (ty + 1) * TS, spr: G.S.bush[(tx * 7 + ty * 3) % G.S.bush.length] });
    this.petals = [];
    this.pots = NIGHT_POTS.map(d => new Pot(d));
    this.potCtx = { tanhuaState: () => 'tanhua' };
    Cam.zoom = 1; Cam.follow(7.5 * TS, 9 * TS, this.map, 0, true);
  }
  update(dt) {
    this.t += dt; this.cat.t += dt;
    if (R3.on) {
      // 標題的大貓臉（向量畫）
      if (!this.tc || !this.tc.canvas.isConnected) { const el = document.querySelector('.title-cat'); this.tc = el ? el.getContext('2d') : null; }
      this.tcT = (this.tcT || 0) + dt;
      if (this.tc && this.tcT >= 1 / 20) { this.tcT = 0; const a = drawTitleCat(this.t, VXR, 3.5); this.tc.clearRect(0, 0, 336, 224); this.tc.drawImage(a, -VXR.pad * 3.5, -VXR.pad * 3.5); }
      this.petals3 = this.petals3 || [];
      if (Math.random() < dt * 4) this.petals3.push({ x: rnd(-20, R3.W || 400), y: -10, vx: rnd(10, 30), vy: rnd(30, 55), c: Math.random() < 0.7 ? '#ff9fbb' : '#fff6f0', ph: rnd(0, 6) });
      for (const p of this.petals3) { p.ph += dt * 2.5; p.x += (p.vx + Math.sin(p.ph) * 14) * dt; p.y += p.vy * dt; }
      this.petals3 = this.petals3.filter(p => p.y < (R3.H || 900) + 20);
    }
    Cam.follow(7.5 * TS, 8 * TS + (1 - Math.cos(this.t * 0.12)) * 70, this.map, dt, false);
    if (Math.random() < dt * 3) this.petals.push({ x: rnd(0, 180), y: Cam.cy - View.h / 2 - 4, vx: rnd(4, 12), vy: rnd(10, 18), c: Math.random() < 0.7 ? '#ff8fae' : '#ffffff', ph: rnd(0, 6) });
    for (const p of this.petals) { p.ph += dt * 3; p.x += (p.vx + Math.sin(p.ph) * 6) * dt; p.y += p.vy * dt; }
    this.petals = this.petals.filter(p => p.y < Cam.cy + View.h / 2 + 10);
  }
  render(ctx) {
    ctx.fillStyle = '#12142a'; ctx.fillRect(0, 0, View.w, View.h);
    Cam.begin(ctx);
    ctx.drawImage(this.bg, 0, 0);
    const L = [];
    for (const pt of this.pots) L.push({ y: pt.y, d: g => pt.draw(g, this.potCtx) });
    for (const l of this.lamps) L.push({ y: l.y, d: g => drawSpr(g, G.S.lamp, l.x, l.y + 1) });
    for (const b of this.bushes) L.push({ y: b.y - 1, d: g => drawSpr(g, b.spr, b.x, b.y + 1) });
    L.push({ y: this.cat.y, d: g => this.cat.draw(g) });
    L.sort((a, b) => a.y - b.y); for (const it of L) it.d(ctx);
    Cam.end(ctx);
    const lights = this.lamps.map(l => ({ x: l.hx, y: l.hy + 12, r: 3.6 * TS, tint: 'rgba(255,190,90,0.22)' }));
    lights.push({ x: 7 * TS, y: 5 * TS, r: 3.4 * TS, a: 0.8, tint: 'rgba(255,170,190,0.16)' });
    renderDarkness(ctx, lights, [], 0.78);
    Cam.begin(ctx);
    for (const p of this.petals) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1); }
    Cam.end(ctx);
  }
}
