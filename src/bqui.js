// ================= 包花台、圖鑑的畫面 =================
// 把 canvas 畫進卡片裡的 <canvas data-bq>
function paintCardCanvas(el, src) {
  const g = el.getContext('2d'), W = el.width, H = el.height;
  g.clearRect(0, 0, W, H);
  const k = Math.min(W / src.width, H / src.height);
  g.imageSmoothingEnabled = true;
  g.drawImage(src, (W - src.width * k) / 2, (H - src.height * k) / 2, src.width * k, src.height * k);
}
const flowerChip = t => `<img src="${G.icons[t] || ''}" alt="">${esc(FLOWERS[t].name)}`;
const needText = r => Object.keys(r.need).map(t => FLOWERS[t].name + (r.need[t] > 1 ? '×' + r.need[t] : '')).join('＋');

// ---------- 包花台 ----------
// S：白天的場景（用它的庫存 S.stock、做好的花束放 S.bouquets）
UI.bouquetStudio = function (S, done) {
  const run = S.run, decor = storeOf(run).decor || 0;
  const papers = Object.keys(PAPERS).filter(k => (PAPERS[k].decor || 0) <= decor);
  const ribbons = Object.keys(RIBBONS).filter(k => (RIBBONS[k].decor || 0) <= decor);
  const sel = { stems: [], paper: papers[0], ribbon: ribbons[0] };
  let note = null;   // 剛包好的那一束
  const sellable = () => S.stock.filter(f => S.canSell(f));
  // 照選的順序從庫存拿花（同一種先拿最新鮮的）
  const takePlan = () => {
    const pool = sellable().slice().sort((a, b) => b.fresh - a.fresh), used = [];
    for (const t of sel.stems) { const i = pool.findIndex(f => f.t === t && !used.includes(f)); if (i >= 0) used.push(pool[i]); }
    return used;
  };
  const left = t => sellable().filter(f => f.t === t).length - sel.stems.filter(x => x === t).length;
  const render = () => {
    const types = [...new Set(sellable().map(f => f.t))].sort((a, b) => FLOWERS[a].price - FLOWERS[b].price);
    const ok = sel.stems.length >= BQ_MIN && sel.stems.length <= BQ_MAX;
    const plan = takePlan();
    const ev = sel.stems.length ? bouquetEval(run, sel, i => (plan[i] ? plan[i].fresh : 1)) : null;
    const single = plan.reduce((s, f) => s + flowerValue(run, f.t, f.fresh), 0);
    const B = bookOf(run);
    const isNew = ev && ok && ((ev.recipe && !B.recipes[ev.recipe.id]) || !B.schemes[ev.scheme]);
    let info;
    if (!sel.stems.length) info = `<b class="bq-name dim">挑 ${BQ_MIN}～${BQ_MAX} 枝花</b><p class="bq-hint">點下面店裡的花，一枝一枝放進花束。配色漂亮、或湊成有名字的花束，就能賣更貴。</p>`;
    else {
      const tags = [`<span>配色・${SCHEMES[ev.scheme].name} ×${SCHEMES[ev.scheme].mult}</span>`];
      if (ev.recipe) tags.push(`<span class="rc">${esc(ev.recipe.name)} ×${ev.recipe.mult}</span>`);
      if (ev.match) tags.push('<span class="pm">包裝很搭 ×1.1</span>');
      if (ev.sig) tags.push('<span class="pm">招牌 ×1.1</span>');
      info = `<b class="bq-name">${esc(ev.name)}${isNew ? '<i class="bq-new">新！</i>' : ''}</b><div class="bq-tags">${tags.join('')}</div>
        ${ok ? `<div class="bq-price"><span>單賣 ${money(single)}</span><b class="px">${money(ev.value)}</b></div>` : `<p class="bq-hint">${sel.stems.length < BQ_MIN ? `再挑 ${BQ_MIN - sel.stems.length} 枝` : '最多 5 枝'}</p>`}`;
    }
    // 提示：店裡現有的花湊得出、但還沒做過的具名花束
    const have = {}; for (const f of sellable()) have[f.t] = (have[f.t] || 0) + 1;
    const can = RECIPES.filter(r => !B.recipes[r.id] && Object.keys(r.need).every(t => (have[t] || 0) >= r.need[t]));
    const tip = can.length ? `<p class="bq-tip">湊得出來：${can.slice(0, 2).map(r => `<b>${esc(r.name)}</b>（${esc(needText(r))}）`).join('、')}</p>` : '';
    const req = S.request && !S.request.done ? `<p class="bq-req">今天有熟客指定：<b>${esc(S.request.label)}</b>，包好馬上買走，多給 ${money(S.request.bonus)}</p>` : '';
    const made = note ? `<div class="bq-made${note.isNew ? ' new' : ''}"><b>${note.gift ? '送出去了！' : note.isNew ? '新花束！' : '包好了！'}${esc(note.name)}</b><span>${esc(note.msg)}</span></div>` : '';
    // 送花賠罪：警戒一顆星以上的鄰居
    const targets = apologyTargets(run);
    const gift = ok && targets.length ? `<div class="bq-gift"><span>或是送去賠罪（警戒會降）：</span>${targets.map(o => `<button type="button" class="bq-giftbtn" data-o="${o}">${esc(OWNERS[o].person)}<em>${starStr(starsOf(run, o))}</em></button>`).join('')}</div>` : '';
    const html = `<p class="eyebrow">美玲的包花台</p><h2>包花束</h2>${made}${req}
      <div class="bq-top"><canvas class="bq-prev" width="300" height="380"></canvas><div class="bq-info">${info}</div></div>${gift}
      <div class="bq-sel">${Array.from({ length: BQ_MAX }, (_, i) => sel.stems[i] ? `<button type="button" class="bq-slot full" data-i="${i}" aria-label="拿掉${FLOWERS[sel.stems[i]].name}"><img src="${G.icons[sel.stems[i]]}" alt=""><i>✕</i></button>` : `<span class="bq-slot${i < BQ_MIN ? ' need' : ''}"></span>`).join('')}</div>
      <h3>店裡的花</h3>
      <div class="bq-pick">${types.length ? types.map(t => `<button type="button" class="bq-chip" data-t="${t}" ${left(t) > 0 && sel.stems.length < BQ_MAX ? '' : 'disabled'}>${flowerChip(t)}<em>×${left(t)}</em></button>`).join('') : '<p class="bq-hint">店裡沒有花了……晚上再去「進貨」吧。</p>'}</div>
      ${tip}
      <h3>包裝紙</h3><div class="bq-sws">${papers.map(k => `<button type="button" class="bq-sw ${sel.paper === k ? 'on' : ''}" data-p="${k}" style="--c:${PAPERS[k].col}">${PAPERS[k].name}</button>`).join('')}</div>
      <h3>緞帶</h3><div class="bq-sws">${ribbons.map(k => `<button type="button" class="bq-sw ${sel.ribbon === k ? 'on' : ''}" data-r="${k}" style="--c:${RIBBONS[k].col}">${RIBBONS[k].name}</button>`).join('')}</div>
      ${decor < 3 ? `<p class="bq-hint small">店面佈置升級，會多出${decor < 2 ? '粉紙、霧綠紙、' : ''}${decor < 1 ? '粉緞帶、墨綠緞帶、' : ''}黑紙、紅緞帶。</p>` : ''}`;
    UI.modal(html, [
      { label: '圖鑑', keep: true, onClick: () => UI.book(run, render, 'bq') },
      { label: '完成', onClick: () => done && done() },
      { label: '包好了', primary: true, keep: true, onClick: () => make() },
    ], { pause: true, cls: 'studio' });
    const card = UI.cardEl;
    const mk = card.querySelector('.btns .btn[data-i="2"]'); if (mk) mk.disabled = !ok;
    paintCardCanvas(card.querySelector('.bq-prev'), bouquetCanvas(sel, 5));
    card.querySelectorAll('.bq-chip').forEach(el => el.addEventListener('click', () => { if (sel.stems.length >= BQ_MAX || left(el.dataset.t) <= 0) return; SFX.play('pick'); sel.stems.push(el.dataset.t); note = null; rerender(); }));
    card.querySelectorAll('.bq-slot.full').forEach(el => el.addEventListener('click', () => { SFX.play('ui'); sel.stems.splice(+el.dataset.i, 1); note = null; rerender(); }));
    card.querySelectorAll('.bq-sw').forEach(el => el.addEventListener('click', () => { SFX.play('ui'); if (el.dataset.p) sel.paper = el.dataset.p; if (el.dataset.r) sel.ribbon = el.dataset.r; note = null; rerender(); }));
    card.querySelectorAll('.bq-giftbtn').forEach(el => el.addEventListener('click', () => make(el.dataset.o)));
  };
  const rerender = () => { const sc = UI.cardEl.scrollTop; render(); UI.cardEl.scrollTop = sc; };
  const GIFT_LINE = { wang: '哎唷，美玲真貼心～', lin: '……謝了。', bo: '好漂亮！阿伯拿去送老伴。', public: '社區活動剛好用得到，謝啦。', mansion: '主人會很高興的。' };
  const make = (gift) => {
    if (sel.stems.length < BQ_MIN || sel.stems.length > BQ_MAX) { SFX.play('nope'); return; }
    const plan = takePlan(); if (plan.length !== sel.stems.length) return;
    const spec = { stems: sel.stems.slice(), paper: sel.paper, ribbon: sel.ribbon };
    const ev = bouquetEval(run, spec, i => plan[i].fresh);
    for (const f of plan) { const i = S.stock.indexOf(f); if (i >= 0) S.stock.splice(i, 1); }
    const rec = bookRecord(run, spec, ev);
    const bq = { spec, value: ev.value, name: ev.name, scheme: ev.scheme, recipe: ev.recipe && ev.recipe.id };
    let msg = `賣價 ${money(ev.value)}，擺在櫃台上等客人。`;
    if (gift) {
      const st = apologize(run, gift);
      msg = `${OWNERS[gift].person}收下了：「${GIFT_LINE[gift] || '謝謝。'}」警戒 ${starStr(st)}`;
    } else if (S.request && !S.request.done && S.requestOk(bq)) {
      // 熟客指定的花束：包好馬上買走
      S.request.done = true;
      S.sell(ev.value + S.request.bonus, 0);
      msg = `熟客馬上買走了！${money(ev.value)}＋指定獎勵 ${money(S.request.bonus)}`;
    } else S.bouquets.push(bq);
    if (rec.cans) msg += `　圖鑑 +${rec.cans} 罐罐`;
    if (rec.sig) msg += '　收集 6 種：以後花束都 ×1.1（招牌花束）';
    note = { name: ev.name, msg, isNew: rec.newRecipe || rec.newScheme, gift: !!gift };
    SFX.play('heart'); if (note.isNew) setTimeout(() => SFX.play('buy'), 200);
    sel.stems = [];
    S.bouquetMade(bq);
    rerender();
  };
  render();
};

// ---------- 圖鑑 ----------
UI.book = function (run, back, tab = 'bq') {
  const B = bookOf(run), cnt = bookCount(run);
  const totalBq = RECIPES.length + SCHEME_ORDER.length;
  const render = () => {
    let body;
    if (tab === 'bq') {
      const rc = RECIPES.map(r => {
        const m = B.recipes[r.id];
        return `<li class="bk ${m ? 'got' : ''}"><canvas data-r="${r.id}" width="120" height="150"></canvas><div class="bk-t"><b>${esc(r.name)}</b><span class="px">×${r.mult}</span></div>
          <div class="bk-need">${Object.keys(r.need).map(t => `<span class="${(B.flowers[t] ? '' : 'miss')}"><img src="${G.icons[t]}" alt="">${esc(FLOWERS[t].name)}${r.need[t] > 1 ? '×' + r.need[t] : ''}</span>`).join('')}</div>
          <p>${m ? esc(r.line) : '還沒包過'}</p></li>`;
      }).join('');
      const sc = SCHEME_ORDER.map(k => {
        const m = B.schemes[k], S2 = SCHEMES[k];
        return `<li class="bk ${m ? 'got' : ''}"><canvas data-s="${k}" width="120" height="150"></canvas><div class="bk-t"><b>${S2.name}</b><span class="px">×${S2.mult}</span></div><p>${esc(S2.desc)}</p></li>`;
      }).join('');
      body = `<p class="lead">包過的花束會記在這裡。灰色的還沒包過：看要哪些花，晚上就知道該去偷什麼。</p>
        <div class="bk-goal ${run.flags.bqSig ? 'done' : ''}">收集 6 種：招牌花束（以後花束都 ×1.1）<b class="px">${Math.min(6, cnt.recipes + cnt.schemes)}/6</b></div>
        <h3>有名字的花束　${cnt.recipes}/${RECIPES.length}</h3><ul class="bk-grid">${rc}</ul>
        <h3>配色　${cnt.schemes}/${SCHEME_ORDER.length}</h3><ul class="bk-grid">${sc}</ul>`;
    } else {
      const fl = FLOWER_ORDER.map(t => {
        const n = B.flowers[t] || 0, F = FLOWERS[t];
        const traits = [F.fragrant ? '香花' : '', DELICATE.includes(t) ? '嬌貴' : '', F.white ? '白色' : ''].filter(Boolean);
        return `<li class="fl ${n ? 'got' : ''}"><img src="${G.icons[t]}" alt=""><div><b>${esc(F.name)}</b><span class="px">${F.price}</span>${traits.map(x => `<em>${x}</em>`).join('')}<p>${esc(F.where || '')}</p></div><i class="px">${n ? '×' + n : '—'}</i></li>`;
      }).join('');
      body = `<p class="lead">偷回家過的花才算收集到。</p><ul class="fl-list">${fl}</ul>`;
    }
    const html = `<p class="eyebrow">美玲的筆記本</p><h2>圖鑑</h2>
      <div class="tabs" role="tablist">
        <button type="button" class="tab ${tab === 'bq' ? 'on' : ''}" data-tab="bq" role="tab" aria-selected="${tab === 'bq'}">花束<small>${cnt.recipes + cnt.schemes} / ${totalBq}</small></button>
        <button type="button" class="tab ${tab === 'fl' ? 'on' : ''}" data-tab="fl" role="tab" aria-selected="${tab === 'fl'}">花<small>${cnt.flowers} / ${FLOWER_ORDER.length}</small></button>
      </div>${body}`;
    UI.modal(html, [{ label: '返回', primary: true, onClick: () => back && back() }], { pause: true, cls: 'book' });
    const card = UI.cardEl;
    card.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { SFX.play('ui'); tab = b.dataset.tab; render(); }));
    // 還沒包過的：畫示範花束，用灰階＋變暗（CSS）當剪影，看得出是哪些花
    card.querySelectorAll('canvas[data-r]').forEach(el => { const r = RECIPES.find(x => x.id === el.dataset.r), m = B.recipes[r.id]; paintCardCanvas(el, bouquetCanvas(m || recipeSpec(r), 2.5)); });
    card.querySelectorAll('canvas[data-s]').forEach(el => { const k = el.dataset.s, m = B.schemes[k]; paintCardCanvas(el, bouquetCanvas(m || { stems: SCHEME_DEMO[k], paper: 'white', ribbon: 'ivory' }, 2.5)); });
  };
  render();
};
