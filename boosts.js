/* boosts.js (v29) — «бонусы-айтемы» из Кондитерской: сладости, которые дают игровые бонусы.
   🍩 Пончик удачи — ×2 конфет за следующие 10 задач (не больше +10 за раз)
   🧁 Кекс-подсказка — подсказка в задаче не снимает «идеально» (тратится сам при нажатии «🐾 Подсказка»)
   🍭 Леденец-заморозка — +10 секунд в режимах на время (кнопка ❄️ во время игры, 1 раз за раунд)
   🍪 Печенье-щит — одна ошибка в задаче не портит «идеально» и «дело без ошибок» (срабатывает само)
   🎂 Торт-праздник — салют из конфетти и праздничный сундук с подарком
   Ограничения: дневной лимит покупок, лимит запаса, торт — раз в день. Сохранение: S.boost (старые поля не трогаем). */
'use strict';
const Boosts = (() => {
  const LIST = [
    { id: 'luck', icon: '🍩', name: 'Пончик удачи', price: 25, day: 2, max: 3, desc: '×2 конфет за следующие 10 задач (до +10 🍬 за задачу).', how: 'Нажми «Съесть» — и начнётся удача.' },
    { id: 'hint', icon: '🧁', name: 'Кекс-подсказка', price: 10, day: 5, max: 5, desc: 'Подсказка в задаче не снимает «идеально» — конфет как без подсказки.', how: 'Срабатывает сам, когда нажмёшь «🐾 Подсказка» в делах и «Решаем вместе».' },
    { id: 'freeze', icon: '🍭', name: 'Леденец-заморозка', price: 10, day: 5, max: 5, desc: '+10 секунд в «Быстрых лапках», блиц-режимах и погоне за вором.', how: 'Во время игры на время появится кнопка ❄️ — один раз за раунд.' },
    { id: 'shield', icon: '🍪', name: 'Печенье-щит', price: 15, day: 3, max: 3, desc: 'Одна ошибка в задаче не помешает ей быть идеальной — и делу без ошибок тоже.', how: 'Срабатывает само, если в задаче ровно одна ошибка.' },
    { id: 'party', icon: '🎂', name: 'Торт-праздник', price: 40, day: 1, max: 2, desc: 'Салют из конфетти и праздничный сундук с конфетами и подарком.', how: 'Нажми «Устроить праздник». Один праздник в день.' },
  ];
  const LUCK_TASKS = 10, LUCK_CAP = 10, FREEZE_SEC = 10;
  const info = id => LIST.find(b => b.id === id);
  function B() {
    const b = S.boost = (S.boost && typeof S.boost === 'object') ? S.boost : {};
    b.inv = b.inv || {}; b.luck = b.luck || 0;
    if (b.day !== today()) { b.day = today(); b.bought = {}; b.party = 0; }
    b.bought = b.bought || {}; return b;
  }
  const have = id => B().inv[id] || 0;
  const total = () => LIST.reduce((n, x) => n + have(x.id), 0);
  const leftToday = x => Math.max(0, x.day - (B().bought[x.id] || 0));
  const spend = id => { const b = B(); b.inv[id] = Math.max(0, (b.inv[id] || 0) - 1); };

  function buy(id) {
    const x = info(id), b = B(); if (!x) return { ok: false, why: 'нет такого' };
    if (have(id) >= x.max) return { ok: false, why: `В запасе уже ${x.max} — сначала используй.` };
    if (!leftToday(x)) return { ok: false, why: 'На сегодня хватит — приходи завтра!' };
    if (S.candies < x.price) return { ok: false, why: `Нужно ${x.price} 🍬, у тебя ${S.candies}.`, poor: true };
    S.candies -= x.price; b.inv[id] = have(id) + 1; b.bought[id] = (b.bought[id] || 0) + 1; save(); updCandy(); refresh();
    return { ok: true };
  }
  function use(id) {
    const b = B();
    if (!have(id)) return { ok: false, why: 'Сначала купи в Кондитерской.' };
    if (id === 'luck') {
      if (b.luck > 0) return { ok: false, why: `Пончик ещё действует: осталось ${b.luck} ${plural(b.luck, 'задача', 'задачи', 'задач')}.` };
      spend(id); b.luck = LUCK_TASKS; save(); refresh(); M.sfx && M.sfx('magic');
      toast(`<span class="tb">🍩</span><div><b>Пончик удачи!</b><br>×2 конфет за ${LUCK_TASKS} задач</div>`); return { ok: true };
    }
    if (id === 'party') {
      if (b.party >= 1) return { ok: false, why: 'Праздник уже был сегодня — завтра можно снова!' };
      if ($('.modal')) $$('.modal').forEach(m => m.remove());
      spend(id); b.party = 1; save(); refresh(); confetti(70); SND.win();
      setTimeout(() => openChest('🎁', 'Праздничный сундук', `Ура, ${esc(S.kid || 'сыщик')}! Торт-праздник в честь твоих успехов!`, 15, true, null), 700);
      return { ok: true };
    }
    if (id === 'freeze') { const r = freezeNow(); return r ? { ok: true } : { ok: false, why: 'Леденец пригодится в игре на время — кнопка ❄️ появится сама.' }; }
    return { ok: false, why: info(id).how };
  }

  /* ========== 🍩 удача: taskDone считает задачи, следующая награда за задачу — вдвое ========== */
  let luckArmed = 0;
  const td = taskDone; taskDone = function () {
    const b = B(); if (b.luck > 0) { b.luck--; luckArmed = Date.now(); save(); if (!b.luck) setTimeout(() => toast('<span class="tb">🍩</span><div>Пончик удачи закончился. Было вкусно!</div>'), 2200); refresh(); }
    return td.apply(this, arguments);
  };
  const aw = award; award = function (c, xp) {
    if (c > 0 && luckArmed && Date.now() - luckArmed < 6000) { luckArmed = 0; const extra = Math.min(c, LUCK_CAP); c += extra; setTimeout(() => floatText(`🍩 ×2`), 350); }
    return aw.apply(this, [c, xp].concat([].slice.call(arguments, 2)));
  };

  /* ========== 🧁 подсказка и 🍪 щит: правим результат задачи до того, как его посчитают ========== */
  function patchMount(name, withHint) {
    const orig = window[name]; if (typeof orig !== 'function') return;
    const wrapped = function (el, opts) {
      if (!opts || !opts.onDone) return orig.apply(this, arguments);
      let reserved = 0;
      if (withHint && el) el.addEventListener('click', e => {
        const h = e.target.closest && e.target.closest('button[id$="-hint"]'); if (!h || !el.contains(h)) return;
        if (have('hint') > reserved) { reserved++; toast(`<span class="tb">🧁</span><div><b>Кекс-подсказка</b><br>Эта подсказка не испортит «идеально»</div>`); }
      }, true);
      const cb = opts.onDone;
      return orig.call(this, el, { ...opts, onDone: res => { try { patchRes(res, reserved); } catch (e) { console.warn(e); } return cb(res); } });
    };
    window[name] = wrapped; // функции app.js объявлены глобально: свойство window и есть их привязка
  }
  function patchRes(res, reserved) {
    if (!res) return;
    if (!res.raw) res.raw = { mistakes: res.mistakes || 0, helped: !!res.helped }; // бонусы меняют только награду: учёба (тренер, «Работа над ошибками») смотрит на res.raw
    if (reserved && res.helped && (res.mistakes || 0) < 3 && have('hint') >= reserved) { // при 3+ ошибках ответ мог показать сам котик — это не подсказка
      for (let i = 0; i < reserved; i++) spend('hint'); res.helped = false; res.cupcake = reserved; save(); refresh();
    }
    if (res.mistakes === 1 && !res.helped && have('shield')) {
      spend('shield'); res.mistakes = 0; res.shielded = true; save(); refresh();
      setTimeout(() => toast(`<span class="tb">🍪</span><div><b>Печенье-щит сработало!</b><br>Одна ошибка не считается — задача идеальная</div>`), 300);
    }
  }

  /* ========== 🍭 заморозка: режимы на время регистрируют, как добавить секунды ========== */
  let timedFn = null, timedAlive = null, timedUsed = false, timedIv = 0;
  function timed(fn, alive) { // fn(секунды) — добавить время; alive() — раунд ещё идёт
    timedFn = fn; timedAlive = alive || null; timedUsed = false; drawFreeze();
    clearInterval(timedIv); timedIv = setInterval(() => { if (timedFn && timedAlive && !timedAlive()) { timedFn = null; drawFreeze(); } if (!timedFn) clearInterval(timedIv); }, 400);
    cleanups.push(() => { if (timedFn === fn) { timedFn = null; drawFreeze(); } });
  }
  function freezeNow() {
    if (!timedFn || timedUsed || !have('freeze') || (timedAlive && !timedAlive())) return false;
    timedUsed = true; spend('freeze'); save(); try { timedFn(FREEZE_SEC); } catch (e) { console.warn(e); }
    floatText(`❄️ +${FREEZE_SEC} с`); M.sfx && M.sfx('magic'); refresh(); return true;
  }
  function drawFreeze() {
    let f = document.getElementById('freezeBtn');
    const show = timedFn && !timedUsed && have('freeze') > 0;
    if (!show) { if (f) f.remove(); return; }
    if (!f) { f = document.createElement('button'); f.id = 'freezeBtn'; f.className = 'freeze-btn'; f.addEventListener('click', () => { freezeNow(); }); document.body.appendChild(f); }
    f.innerHTML = `🍭 ❄️ +${FREEZE_SEC} с <small>×${have('freeze')}</small>`;
  }

  /* ========== индикатор в верхней панели и значок запаса ========== */
  function chipsHTML() {
    const b = B(), parts = [];
    if (b.luck > 0) parts.push(`<i class="bb-luck" title="Пончик удачи: задач осталось">🍩${b.luck}</i>`);
    ['hint', 'shield', 'freeze', 'luck', 'party'].forEach(id => { const n = have(id); if (n && !(id === 'luck' && b.luck > 0)) parts.push(`<i>${info(id).icon}${n > 1 ? n : ''}</i>`); });
    if (b.luck > 0 && have('luck')) parts.push(`<i>🍩+${have('luck')}</i>`);
    return parts.length ? `<button class="boostbar" data-boostbar aria-label="Мои бонусы">${parts.join('')}</button>` : '';
  }
  const tb = topbar; topbar = function () { const h = tb.apply(this, arguments); try { return h.replace('</header>', chipsHTML() + '</header>'); } catch (e) { return h; } };
  function refresh() {
    $$('.top').forEach(t => { const old = $('[data-boostbar]', t); const h = chipsHTML(); if (old) old.outerHTML = h || ''; else if (h) t.insertAdjacentHTML('beforeend', h); });
    $$('.shoptabs [data-t="bonus"] .bn').forEach(e => { const n = total(); e.textContent = n || ''; e.hidden = !n; });
    const tile = $('.tile.t-shop'); if (tile) { let bd = $('.bn29', tile); const n = total() + (B().luck > 0 ? 1 : 0); if (n && !bd) { tile.insertAdjacentHTML('beforeend', '<span class="bn29"></span>'); bd = $('.bn29', tile); } if (bd) { bd.textContent = n ? (B().luck > 0 ? '🍩' : total()) : ''; bd.hidden = !n; } }
    drawFreeze();
  }
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-boostbar]')) { SND.tap(); openInv(); } });
  function openInv() {
    const b = B(), rows = LIST.map(x => `<div class="bi-row"><span class="bi-ic">${x.icon}</span><div class="bi-tx"><b>${x.name} <span class="bi-n">×${have(x.id)}</span></b><small>${x.id === 'luck' && b.luck > 0 ? `Действует: ещё ${b.luck} ${plural(b.luck, 'задача', 'задачи', 'задач')}` : x.how}</small></div>${(x.id === 'luck' || x.id === 'party') && have(x.id) ? `<button class="btn sm pink" data-use="${x.id}">${x.id === 'luck' ? 'Съесть' : 'Праздник!'}</button>` : ''}</div>`).join('');
    const m = modal(`<h2>🧁 Мои бонусы</h2><div class="bi-list">${rows}</div><div class="row-btns"><button class="btn pink" id="biShop">🧁 В Кондитерскую</button><button class="btn" data-close>Закрыть</button></div>`);
    $$('[data-use]', m.el).forEach(btn => btn.addEventListener('click', () => { const r = use(btn.dataset.use); if (!r.ok) { SND.bad(); toast(`<span class="tb">${info(btn.dataset.use).icon}</span><div>${r.why}</div>`); } else if (btn.dataset.use !== 'party') { m.close(); } }));
    $('#biShop', m.el).addEventListener('click', () => { m.close(); SHOP_TAB = 'bonus'; go('shop'); });
  }

  /* ========== вкладка «Бонусы» в Кондитерской ========== */
  function shopHTML() {
    const b = B();
    return `<p class="small">Сладкие бонусы помогают в заданиях. Покупать можно понемногу каждый день — так интереснее! ${b.luck > 0 ? `<br><b>🍩 Удача действует: ещё ${b.luck} ${plural(b.luck, 'задача', 'задачи', 'задач')}.</b>` : ''}</p><div class="items boost-items">${LIST.map(x => { const n = have(x.id), lt = leftToday(x), full = n >= x.max;
      return `<div class="item boost" data-boost="${x.id}"><span class="ii">${x.icon}</span><span class="in">${x.name}</span><small class="bd">${x.desc}</small><span class="bq">в запасе: <b>${n}</b>/${x.max}</span>
        <button class="btn sm ${full || !lt ? '' : 'pink'}" data-bbuy="${x.id}" ${full || !lt ? 'disabled' : ''}>${full ? 'запас полон' : lt ? `${x.price} 🍬` : 'завтра'}</button>
        ${(x.id === 'luck' || x.id === 'party') && n ? `<button class="btn sm" data-buse="${x.id}">${x.id === 'luck' ? (b.luck > 0 ? '🍩 действует' : 'Съесть') : 'Праздник!'}</button>` : ''}<small class="bl">${lt ? `сегодня можно ещё ${lt}` : 'лимит на сегодня'}</small></div>`; }).join('')}</div>`;
  }
  function bindShop(root, redraw) {
    $$('[data-bbuy]', root).forEach(btn => btn.addEventListener('click', () => {
      const x = info(btn.dataset.bbuy), r = buy(x.id);
      if (!r.ok) { SND.bad(); if (r.poor) say(PH.poor[0]); toast(`<span class="tb">${x.icon}</span><div>${r.why}</div>`); return; }
      tone && tone([[988, 0.09], [1319, 0.25, 0.07]]); confetti(14); say(PH.bought[0]); redraw();
    }));
    $$('[data-buse]', root).forEach(btn => btn.addEventListener('click', () => { const r = use(btn.dataset.buse); if (!r.ok) { SND.bad(); toast(`<span class="tb">${info(btn.dataset.buse).icon}</span><div>${r.why}</div>`); } else redraw(); }));
  }
  { const sh = SCREENS.shop; SCREENS.shop = arg => {
    const want = SHOP_TAB === 'bonus'; if (want) SHOP_TAB = 'wear';
    sh(arg);
    const tabs = $('.shoptabs', app); if (!tabs || $('[data-t="bonus"]', tabs)) return;
    tabs.insertAdjacentHTML('beforeend', `<button data-t="bonus">🧁 Бонусы <span class="bn" ${total() ? '' : 'hidden'}>${total() || ''}</span></button>`);
    const mine = $('[data-t="bonus"]', tabs);
    const draw = () => { $$('.shoptabs button', app).forEach(x => x.classList.toggle('on', x === mine)); const sc = $('#sc'); if (sc) sc.innerHTML = myCat({ smile: true }); $('#si').innerHTML = shopHTML(); bindShop($('#si'), draw); refresh(); };
    mine.addEventListener('click', () => { SND.tap(); draw(); });
    $$('.shoptabs button:not([data-t="bonus"])', app).forEach(x => x.addEventListener('click', () => mine.classList.remove('on')));
    if (want) draw();
  }; }
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); try { refresh(); } catch (e) { } return r; }; }

  patchMount('mountMul', true); patchMount('mountEq', true); patchMount('mountBugMul', false); patchMount('mountBugEq', false);

  document.head.insertAdjacentHTML('beforeend', `<style id="boosts29-css">
.boostbar { position: absolute; right: 0; top: calc(100% - 10px); display: inline-flex; gap: 4px; background: #FFF4E8; border: 2px solid #FFD7A8; border-radius: 999px; padding: 2px 8px; font: inherit; font-size: 14px; font-weight: 800; box-shadow: var(--sh); cursor: pointer; z-index: 6; }
.boostbar i { font-style: normal; white-space: nowrap; }
.boostbar .bb-luck { color: #D9534F; animation: bbGlow 1.6s ease-in-out infinite; }
@keyframes bbGlow { 50% { text-shadow: 0 0 8px #FFC93C; } }
.shoptabs .bn, .tile .bn29 { display: inline-block; min-width: 18px; padding: 0 5px; border-radius: 9px; background: #FF6F9C; color: #fff; font-size: 12px; line-height: 18px; text-align: center; margin-left: 2px; }
.tile { position: relative; } .tile .bn29 { position: absolute; top: 6px; right: 8px; }
.boost-items { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
.item.boost { gap: 4px; text-align: center; }
.item.boost .ii { font-size: 44px; } .item.boost .bd { font-size: 12.5px; color: var(--muted); line-height: 1.25; } .item.boost .bq { font-size: 13px; } .item.boost .bl { font-size: 11.5px; color: var(--muted); }
.item.boost .btn[disabled] { opacity: .55; }
.freeze-btn { position: fixed; right: 12px; top: 84px; z-index: 60; border: 0; border-radius: 999px; padding: 10px 14px; font: inherit; font-weight: 900; font-size: 16px; color: #1E5A8A; background: linear-gradient(135deg, #E3F6FF, #CDEBFF); box-shadow: 0 6px 16px rgba(60,120,200,.35); animation: needPulse 1.2s infinite; }
.freeze-btn small { font-size: 12px; opacity: .8; }
.bi-list { display: flex; flex-direction: column; gap: 8px; margin: 8px 0 12px; text-align: left; }
.bi-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 8px; align-items: center; background: #FFF8F0; border-radius: 14px; padding: 8px 10px; }
.bi-ic { font-size: 30px; text-align: center; } .bi-tx { display: flex; flex-direction: column; min-width: 0; } .bi-tx small { color: var(--muted); font-size: 12.5px; } .bi-n { color: var(--pink-d); }
</style>`);
  return { LIST, B, buy, use, have, total, timed, freezeNow, patchRes, refresh, openInv };
})();
window.Boosts = Boosts;
