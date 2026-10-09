/* column.js — письменные вычисления 4 класса, которых не было: ДЕЛЕНИЕ СТОЛБИКОМ (на одно- и двузначное, с остатком)
   и СЛОЖЕНИЕ / ВЫЧИТАНИЕ СТОЛБИКОМ. Как «Умножение столбиком»: урок → «Решаем вместе» (котик спрашивает каждый шаг) →
   самостоятельно. Задачи засчитываются в задание дня, комнаты домика и навыки котика-тренера. */
'use strict';
const Column = (() => {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const st = k => (S.st[k] = S.st[k] || { done: 0, perfect: 0 });
  /* ================= план деления столбиком ================= */
  function divPlan(a, b) {
    const ds = String(a).split('').map(Number), steps = []; let i = 0, cur = 0;
    while (i < ds.length && cur * 10 + ds[i] < b && i < ds.length - 1) { cur = cur * 10 + ds[i]; i++; }
    cur = cur * 10 + ds[i];
    for (;;) {
      const q = Math.floor(cur / b), prod = q * b, rem = cur - prod; steps.push({ cur, q, prod, rem, end: i });
      i++; if (i >= ds.length) break; cur = rem * 10 + ds[i];
    }
    return { a, b, steps, q: Math.floor(a / b), r: a % b, first: steps[0].cur, firstLen: steps[0].end + 1 };
  }
  function genDiv(lv) {
    for (let t = 0; t < 200; t++) {
      let a, b;
      if (lv === 1) { b = R(2, 9); a = b * R(Math.ceil(100 / b), Math.floor(999 / b)); }
      else if (lv === 2) { b = R(3, 9); a = R(1000, 9999); if (Math.random() < 0.45) a = a - a % b; if (Math.random() < 0.35) { const q = R(100, 999) * 10 + R(0, 9); a = Math.min(99999, q * b + (Math.random() < 0.5 ? 0 : R(1, b - 1))); } }
      else if (lv === 3) { b = R(12, 48); a = R(1000, 99999); if (Math.random() < 0.5) a = a - a % b; }
      else { b = R(12, 98); a = R(10000, 99999); }
      const P = divPlan(a, b); if (P.q < 10 || P.q > 99999) continue;
      const key = a + ':' + b; if ((S.recent || []).includes('d' + key)) continue;
      S.recent = S.recent || []; S.recent.push('d' + key); if (S.recent.length > 300) S.recent.splice(0, S.recent.length - 300);
      return P;
    }
    return divPlan(1752, 4);
  }
  /* ================= план сложения / вычитания ================= */
  function addPlan(a, b, op) {
    const W = Math.max(String(a).length, String(b).length) + 1, A = String(a).padStart(W, ' '), B = String(b).padStart(W, ' '), res = op === '+' ? a + b : a - b, cols = [];
    let carry = 0;
    for (let k = 0; k < String(res).length || k < Math.max(String(a).length, String(b).length); k++) {
      const da = +(String(a)[String(a).length - 1 - k] || 0), db = +(String(b)[String(b).length - 1 - k] || 0);
      if (op === '+') { const s = da + db + carry; cols.push({ k, da, db, carryIn: carry, sum: s, d: s % 10, carryOut: s >= 10 ? 1 : 0 }); carry = s >= 10 ? 1 : 0; }
      else { let x = da - carry, borrow = 0; if (x < db) { x += 10; borrow = 1; } cols.push({ k, da, db, carryIn: carry, top: da - carry, x, d: x - db, carryOut: borrow }); carry = borrow; }
    }
    while (cols.length > String(res).length && cols[cols.length - 1].d === 0) cols.pop();
    return { a, b, op, res, cols, W };
  }
  function genAdd(lv, op) {
    for (let t = 0; t < 100; t++) {
      const n = lv === 1 ? R(3, 4) : lv === 2 ? 5 : 6, lo = 10 ** (n - 1), hi = 10 ** n - 1;
      let a = R(lo, hi), b = R(Math.floor(lo / (lv === 1 ? 1 : 10)), op === '-' ? a - 1 : hi);
      if (op === '-' && lv === 3 && Math.random() < 0.5) { a = R(1, 9) * 10 ** (n - 1) + R(0, 9) * (Math.random() < 0.5 ? 1 : 0); b = R(lo / 10, a - 1); } // 50003 − 2768: занимаем через нули
      if (op === '+' && a + b > 999999) continue; if (op === '-' && b >= a) continue;
      const P = addPlan(a, b, op); if (!P.cols.some(c => c.carryOut) && Math.random() < 0.8) continue; // хотим переходы через разряд
      return P;
    }
    return addPlan(4587, 2675, op);
  }

  /* ================= экраны ================= */
  const LV = { div: ['На однозначное', 'С нулём и остатком', 'На двузначное', 'Большие числа'], add: ['3–4 знака', '5 знаков', 'Миллион'] };
  SCREENS.colwork = (arg = 'div') => {
    const [kind, sub] = String(arg).split(':'), isDiv = kind === 'div', key = isDiv ? 'divLv' : 'addLv';
    S.prefs[key] = S.prefs[key] || 1; S.prefs.colGuided = S.prefs.colGuided || {}; let guided = S.prefs.colGuided[kind] !== false, op = sub === '-' ? '-' : '+';
    app.innerHTML = `${topbar(isDiv ? '➗ Деление столбиком' : '➕ Сложение и вычитание', 'school')}<div class="page task-page col-page">
      <div class="task-head wrap"><div class="seg lv">${LV[isDiv ? 'div' : 'add'].map((n, i) => `<button data-v="${i + 1}" class="${S.prefs[key] === i + 1 ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="seg mode"><button data-m="1" class="${guided ? 'on' : ''}">🐾 Вместе</button><button data-m="0" class="${guided ? '' : 'on'}">🕵️ Сам</button></div>
      ${isDiv ? '' : `<div class="seg ops"><button data-o="+" class="${op === '+' ? 'on' : ''}">＋</button><button data-o="-" class="${op === '-' ? 'on' : ''}">－</button></div>`}</div>
      ${helperHTML('cbub')}<div id="cwork"></div><div id="cafter" class="after"></div></div>`;
    $$('.lv button', app).forEach(b => b.addEventListener('click', () => { S.prefs[key] = +b.dataset.v; save(); go('colwork', arg); }));
    $$('.mode button', app).forEach(b => b.addEventListener('click', () => { S.prefs.colGuided[kind] = b.dataset.m === '1'; save(); go('colwork', arg); }));
    $$('.ops button', app).forEach(b => b.addEventListener('click', () => go('colwork', 'add:' + b.dataset.o)));
    const bub = h => { const b = $('#cbub'); if (!b) return; b.innerHTML = h; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); };
    const finish = (lv, mistakes, helped, t0) => {
      const res = { mistakes, helped }, perfect = !mistakes && !helped, k = isDiv ? 'div' : 'add'; st(k);
      taskDone(k, res, { level: lv, guided }); const c = (perfect ? 3 : 1) * (isDiv ? 2 : 1); award(c, (guided ? 6 : 10) + (isDiv ? 6 : 2));
      if (!guided && lv >= 3 && perfect) awardGems(1, 'за сложное вычисление без ошибок');
      SND.win(); if (perfect) confetti(25);
      $('#cafter').innerHTML = `<button class="btn big pink" id="cnext">Следующий пример →</button>`; $('#cnext').addEventListener('click', () => go('colwork', arg));
    };
    if (isDiv) runDiv($('#cwork'), genDiv(S.prefs[key]), guided, bub, finish); else runAdd($('#cwork'), genAdd(S.prefs[key], op), guided, bub, finish);
  };

  /* ---------- деление: рисуем «уголок» ---------- */
  function divGrid(P, upto, part) { // upto — сколько шагов показано, part — что показано в текущем шаге (0: делимое, 1: +произведение, 2: +остаток)
    const A = String(P.a), n = A.length, rows = [];
    rows.push(A.split('').map(d => ({ t: d })));
    for (let s = 0; s < P.steps.length && s < upto; s++) {
      const S2 = P.steps[s], last = s === upto - 1, show = last ? part : 2, endCol = S2.end;
      if (s > 0) { const curS = String(S2.cur); rows.push(Array.from({ length: n }, (_, c) => { const p = c - (endCol - curS.length + 1); return { t: p >= 0 && p < curS.length ? curS[p] : '', cur: last && show === 0 }; })); }
      if (show >= 1 && S2.q > 0) { const pr = String(S2.prod); rows.push(Array.from({ length: n }, (_, c) => { const p = c - (endCol - pr.length + 1); return { t: p >= 0 && p < pr.length ? pr[p] : '', minus: p === 0, ul: p >= 0 && p < Math.max(pr.length, String(S2.cur).length) }; })); }
      if (show >= 2 && s === P.steps.length - 1) { const r = String(S2.rem); rows.push(Array.from({ length: n }, (_, c) => { const p = c - (endCol - r.length + 1); return { t: p >= 0 && p < r.length ? r[p] : '', rem: true }; })); }
    }
    const qDigits = P.steps.slice(0, upto).map((x, i) => (i < upto - 1 || part >= 0) ? x.q : '').join('');
    return `<div class="divbox"><div class="dgrid" style="--n:${n}">${rows.map((r, ri) => r.map(c => `<span class="dc ${c.cur ? 'cur' : ''} ${c.ul ? 'ul' : ''} ${c.rem ? 'rem' : ''}">${c.minus ? '<i class="mn">−</i>' : ''}${c.t}</span>`).join('')).join('')}</div><div class="dright"><div class="dvs">${P.b}</div><div class="dq">${qDigits || '&nbsp;'}</div></div></div>`;
  }
  function runDiv(el, P, guided, bub, finish) {
    let s = 0, phase = guided ? 'first' : 'q', mistakes = 0, helped = false, tries = 0; const t0 = Date.now(), lv = S.prefs.divLv;
    const draw = (part) => { el.innerHTML = `<div class="task-title">${P.a} : ${P.b}</div>${divGrid(P, Math.max(1, s + 1), part)}<div class="ask" id="cask"></div><div id="cin"></div>`; };
    const pad = (label, check) => {
      let buf = ''; $('#cask').innerHTML = `${label} <span class="inp" id="cv">?</span>`; $('#cin').innerHTML = numpad(true);
      bindPad($('#cin'), { digit: x => { if (buf.length < 6) { buf += x; $('#cv').textContent = buf; } }, back: () => { buf = buf.slice(0, -1); $('#cv').textContent = buf || '?'; }, ok: () => { if (!buf) return; const v = +buf; buf = ''; $('#cv').textContent = '?'; check(v); } });
    };
    const wrong = (h, show) => { mistakes++; tries++; SND.bad(); noteErr('div'); bub(`<div class="fb bad">Не совсем.</div>${tries >= 2 && show != null ? `${h}<br>Ответ: <b>${show}</b>` : h}`); if (tries >= 3) { helped = true; return true; } return false; };
    const ok = (h) => { tries = 0; SND.ok(); if (h) bub(`<div class="fb">✔ Верно!</div>${h}`); };
    function step() {
      if (!el.isConnected) return; // ушли с экрана — отложенный шаг не рисуем
      const X = P.steps[s];
      if (phase === 'first') {
        draw(-1); const opts = []; const A = String(P.a); for (let k = 1; k <= Math.min(A.length, P.firstLen + 1); k++) opts.push(+A.slice(0, k));
        bub(`Делим <b>${P.a}</b> на <b>${P.b}</b>. Сначала найдём <b>первое неполное делимое</b> — самое маленькое начало числа, в котором ${P.b} помещается хотя бы один раз.`);
        $('#cask').innerHTML = 'Какое первое неполное делимое?'; $('#cin').innerHTML = `<div class="opts">${[...new Set(opts)].map(v => `<button class="opt" data-v="${v}">${v}</button>`).join('')}</div>`;
        $$('#cin .opt').forEach(b => b.addEventListener('click', () => { const v = +b.dataset.v; if (v === P.first) { ok(`Первое неполное делимое — <b>${P.first}</b>. Значит, в частном будет <b>${String(P.q).length}</b> ${plural(String(P.q).length, 'цифра', 'цифры', 'цифр')}.`); phase = 'q'; setTimeout(step, 900); } else { b.classList.add('wrong'); if (wrong(v < P.b ? `${v} меньше ${P.b} — ${P.b} в нём не помещается ни разу. Возьми ещё цифру.` : `Можно взять меньше цифр: ${P.b} помещается уже в ${P.first}.`, P.first)) { phase = 'q'; setTimeout(step, 1500); } } }));
        return;
      }
      if (phase === 'q') {
        draw(0);
        if (guided) bub(X.q === 0 && s > 0 ? `Число <b>${X.cur}</b> меньше <b>${P.b}</b>. Сколько раз ${P.b} в нём помещается?` : `Сколько раз <b>${P.b}</b> помещается в <b>${X.cur}</b>? Подбирай: ${P.b} · ? должно быть не больше ${X.cur}.`);
        pad(`${X.cur} : ${P.b} ≈`, v => {
          if (v === X.q) { ok(X.q === 0 ? `Пишем в частном <b>0</b>.` : guided ? `${P.b} · ${X.q} = ${X.prod} — не больше ${X.cur}, а ${P.b} · ${X.q + 1} = ${P.b * (X.q + 1)} — уже больше.` : ''); phase = X.q === 0 ? 'next' : 'prod'; setTimeout(step, guided ? 900 : 250); return; }
          const h = v > X.q ? `${P.b} · ${v} = ${P.b * v} — это больше, чем ${X.cur}. Возьми меньше.` : `Мало: ${X.cur} − ${P.b * v} = ${X.cur - P.b * v}, а остаток должен быть меньше ${P.b}. Возьми больше.`;
          if (wrong(h, X.q)) { phase = X.q === 0 ? 'next' : 'prod'; setTimeout(step, 1600); }
        });
        return;
      }
      if (phase === 'prod') {
        draw(0); if (guided) bub(`Умножаем: <b>${X.q} · ${P.b}</b> — и пишем под ${X.cur}.`);
        pad(`${X.q} · ${P.b} =`, v => { if (v === X.prod) { ok(''); phase = 'rem'; step(); } else if (wrong(`Проверь умножение: ${X.q} · ${P.b}.`, X.prod)) { phase = 'rem'; setTimeout(step, 1500); } });
        return;
      }
      if (phase === 'rem') {
        draw(1); if (guided) bub(`Вычитаем: <b>${X.cur} − ${X.prod}</b>. Остаток должен быть меньше ${P.b}!`);
        pad(`${X.cur} − ${X.prod} =`, v => { if (v === X.rem) { ok(''); phase = 'next'; step(); } else if (wrong(`Посчитай ${X.cur} − ${X.prod} столбиком или в уме.`, X.rem)) { phase = 'next'; setTimeout(step, 1500); } });
        return;
      }
      if (phase === 'next') {
        if (s < P.steps.length - 1) {
          const d = String(P.a)[P.steps[s + 1].end]; s++; draw(0);
          if (guided) bub(`Сносим следующую цифру <b>${d}</b> — получилось <b>${P.steps[s].cur}</b>.`);
          phase = 'q'; setTimeout(step, guided ? 1300 : 400); return;
        }
        draw(2);
        const check = `${P.b} · ${P.q}${P.r ? ' + ' + P.r : ''} = ${P.a}`;
        $('#cask').innerHTML = `<b>${P.a} : ${P.b} = ${P.q}${P.r ? ` (ост. ${P.r})` : ''}</b>`; $('#cin').innerHTML = '';
        bub(`🎉 Готово, ${esc(S.kid)}! ${P.r ? `Остаток <b>${P.r}</b> меньше делителя ${P.b} — всё верно.` : 'Разделилось без остатка!'}<br>Проверка: <b>${check}</b> ✔`);
        say(pick(PH.done)); finish(S.prefs.divLv, mistakes, helped, t0);
      }
    }
    step();
  }

  /* ---------- сложение / вычитание столбиком ---------- */
  function runAdd(el, P, guided, bub, finish) {
    const W = Math.max(String(P.a).length, String(P.b).length, String(P.res).length) + 1, got = [], marks = {}; let k = 0, mistakes = 0, helped = false, tries = 0; const t0 = Date.now();
    const cell = (s, c) => { const i = s.length - (W - c); return i >= 0 && i < s.length ? s[i] : ''; };
    const draw = () => {
      const res = String(P.res), resShown = got.slice().reverse().join('');
      el.innerHTML = `<div class="task-title">${P.a} ${P.op === '+' ? '+' : '−'} ${P.b}</div><div class="paper"><div class="agrid" style="--w:${W}">
        ${Array.from({ length: W }, (_, c) => `<span class="ac carry">${marks[W - 1 - c] || ''}</span>`).join('')}
        ${Array.from({ length: W }, (_, c) => `<span class="ac ${W - 1 - c === k ? 'hl' : ''}">${cell(String(P.a), c)}</span>`).join('')}
        ${Array.from({ length: W }, (_, c) => `<span class="ac ul ${W - 1 - c === k ? 'hl' : ''}">${c === 0 ? (P.op === '+' ? '+' : '−') : cell(String(P.b), c)}</span>`).join('')}
        ${Array.from({ length: W }, (_, c) => `<span class="ac res ${W - 1 - c === k && k < res.length ? 'now' : ''}">${cell(resShown, c)}</span>`).join('')}
      </div></div><div class="ask" id="cask"></div><div id="cin"></div>`;
    };
    const next = () => {
      if (!el.isConnected) return;
      draw(); if (k >= P.cols.length) { $('#cask').innerHTML = `<b>${P.a} ${P.op === '+' ? '+' : '−'} ${P.b} = ${P.res}</b>`; bub(`🎉 Готово! ${P.op === '+' ? `Проверка вычитанием: ${P.res} − ${P.b} = ${P.a} ✔` : `Проверка сложением: ${P.res} + ${P.b} = ${P.a} ✔`}`); say(pick(PH.done)); finish(S.prefs.addLv, mistakes, helped, t0); return; }
      const c = P.cols[k], place = ['единицы', 'десятки', 'сотни', 'тысячи', 'десятки тысяч', 'сотни тысяч'][k] || 'разряд';
      if (guided) {
        if (P.op === '+') bub(`Складываем <b>${place}</b>: ${c.da} + ${c.db}${c.carryIn ? ' + 1 (запомненная)' : ''} = <b>?</b> Пишем единицы этого числа.`);
        else bub(c.da - c.carryIn < c.db ? `Вычитаем <b>${place}</b>: ${c.da - c.carryIn} − ${c.db} — не хватает! <b>Занимаем десяток</b> у соседа: ${c.x} − ${c.db} = <b>?</b>` : `Вычитаем <b>${place}</b>: ${c.da}${c.carryIn ? ' − 1 (заняли)' : ''} − ${c.db} = <b>?</b>`);
      }
      let buf = ''; $('#cask').innerHTML = `Цифра в разряде: <span class="inp" id="cv">?</span>`; $('#cin').innerHTML = numpad(true);
      bindPad($('#cin'), { digit: x => { buf = String(x); $('#cv').textContent = buf; }, back: () => { buf = ''; $('#cv').textContent = '?'; }, ok: () => {
        if (buf === '') return; const v = +buf;
        if (v === c.d) { tries = 0; SND.ok(); got.push(c.d); if (c.carryOut) marks[k + 1] = P.op === '+' ? '1' : '•'; if (guided && c.carryOut) bub(P.op === '+' ? `✔ Пишем <b>${c.d}</b>, а <b>1</b> запоминаем — пишем сверху над следующим разрядом.` : `✔ Пишем <b>${c.d}</b>. Над соседом ставим точку — у него заняли единицу.`); k++; setTimeout(next, guided && c.carryOut ? 1100 : 200); }
        else { mistakes++; tries++; SND.bad(); noteErr(P.op === '+' ? 'add' : 'sub'); const h = P.op === '+' ? `${c.da} + ${c.db}${c.carryIn ? ' + 1' : ''} = ${c.sum}. Пишем последнюю цифру.` : (c.carryOut ? `Заняли десяток: ${c.x} − ${c.db} = ${c.d}.` : `${c.top} − ${c.db} = ${c.d}.`); bub(`<div class="fb bad">Не совсем.</div>${tries >= 2 ? h : (P.op === '+' ? 'Не забудь про запомненную единицу!' : 'Хватает ли цифры сверху? Если нет — занимай десяток.')}`); if (tries >= 3) { helped = true; got.push(c.d); if (c.carryOut) marks[k + 1] = P.op === '+' ? '1' : '•'; k++; setTimeout(next, 1400); } }
      } });
    };
    next();
  }

  /* ================= уроки ================= */
  const LESSONS2 = {
    div: [
      { t: 'Зачем делить столбиком?', h: 'На склад привезли <b>1752 конфеты</b> и разложили поровну в <b>4 коробки</b>. Сколько в каждой? Нужно <b>1752 : 4</b>. В уме трудно, а столбиком — легко! Делим <b>слева направо</b>, кусочек за кусочком.', tip: 'Деление столбиком идёт слева направо — наоборот, не как умножение!' },
      { t: 'Шаг 1. Первое неполное делимое', h: 'Ищем самое маленькое начало числа, в котором делитель помещается. В 1752: «1» — 4 не помещается, «17» — помещается! <b>17</b> — первое неполное делимое. Осталось ещё 2 цифры (5 и 2), значит, в частном будет <b>3 цифры</b>.', tip: 'Сразу считаем, сколько цифр будет в ответе — это защита от ошибок.' },
      { t: 'Шаг 2. Подбираем цифру', h: 'Сколько раз 4 помещается в 17? 4 · 4 = 16 — подходит, 4 · 5 = 20 — уже много. Пишем в частное <b>4</b>. Умножаем 4 · 4 = 16, пишем под 17 и вычитаем: 17 − 16 = <b>1</b>.', tip: 'Остаток всегда меньше делителя! Если больше — цифру взяли мало.' },
      { t: 'Шаг 3. Сносим цифру', h: 'К остатку 1 «сносим» следующую цифру 5 — получилось <b>15</b>. 15 : 4 → по <b>3</b> (4 · 3 = 12), остаток 3. Сносим 2 — получилось <b>32</b>. 32 : 4 = <b>8</b>, остаток 0. Ответ: <b>1752 : 4 = 438</b>.' },
      { t: 'Если «не помещается» — пишем 0', h: 'Делим 2416 : 8. 24 : 8 = 3, остаток 0. Сносим 1 — получилось 1, а 8 в 1 не помещается! Пишем в частное <b>0</b> и сносим следующую цифру: 16 : 8 = 2. Ответ: <b>302</b>.', tip: 'Снесли цифру, а делитель не помещается — в частном 0!' },
      { t: 'Деление с остатком и проверка', h: 'Иногда в конце остаётся остаток: 47 : 5 = 9 (ост. 2). Проверка-алиби: <b>делитель · частное + остаток = делимое</b>: 5 · 9 + 2 = 47 ✔. На двузначное число делим так же — только цифру подбираем прикидкой: 384 : 32 ≈ 30 : 3 → 1, потом 64 : 32 = 2.' },
    ],
    add: [
      { t: 'Числа — друг под другом', h: 'Пишем <b>единицы под единицами</b>, десятки под десятками. Считаем <b>справа налево</b> — с единиц. Так можно сложить даже числа до миллиона!' },
      { t: 'Сложение с переходом', h: '4587 + 2675: 7 + 5 = <b>12</b> — пишем 2, <b>1 запоминаем</b> (пишем сверху над десятками). 8 + 7 + 1 = 16 — пишем 6, 1 запоминаем. 5 + 6 + 1 = 12, 4 + 2 + 1 = 7. Ответ: <b>7262</b>.', tip: 'Не забывай прибавлять запомненную единицу!' },
      { t: 'Вычитание: занимаем десяток', h: '5243 − 1768: 3 − 8 — не хватает! <b>Занимаем десяток</b> у соседа (ставим над ним точку): 13 − 8 = 5. У десятков теперь 3: 3 − 6 — снова занимаем: 13 − 6 = 7. Дальше 1 − 7 → 11 − 7 = 4, и 4 − 1 = 3. Ответ: <b>3475</b>.', tip: 'Точка над цифрой — «у неё заняли», уменьши её на 1.' },
      { t: 'Хитрость с нулями', h: '5003 − 268: у десятков и сотен нули, занять не у кого! Идём дальше — к тысячам: занимаем у 5, и нули превращаются в <b>9</b>, а единицы — в 13. 13 − 8 = 5, 9 − 6 = 3, 9 − 2 = 7, 4 − 0 = 4. Ответ: <b>4735</b>.' },
      { t: 'Проверка', h: 'Сложение проверяем вычитанием, вычитание — сложением: 3475 + 1768 = 5243 ✔. Это алиби ответа!' },
    ],
  };
  SCREENS.collesson = kind => {
    const L = LESSONS2[kind] || LESSONS2.div; let i = 0; const tm = window.Coach ? Coach.lessonTimer(L.length) : null;
    app.innerHTML = `${topbar(kind === 'div' ? 'Урок: деление столбиком' : 'Урок: сложение и вычитание', 'school')}<div class="page lesson"><div class="slide" id="slide"></div><div class="slide-nav"><button class="btn" id="prev">←</button><div class="dots">${L.map(() => '<i></i>').join('')}</div><button class="btn pink" id="next">Дальше →</button></div></div>`;
    const draw = () => { const c = L[i]; $('#slide').innerHTML = `<div class="slide-head"><div class="mini-cat">${myCat({ cls: 'mini' })}</div><h2>${c.t}</h2></div><div class="story">${c.h}</div>${c.tip ? `<div class="rule">💡 ${c.tip}</div>` : ''}${kind === 'div' && i === 3 ? divGrid(divPlan(1752, 4), 3, 2) : ''}<div class="row-btns"><button class="btn sm ghost" id="readit">🔊 Прочитай мне</button></div>`; $$('.dots i').forEach((d, k) => d.classList.toggle('on', k === i)); $('#prev').style.visibility = i ? 'visible' : 'hidden'; $('#next').textContent = i < L.length - 1 ? 'Дальше →' : '🐾 Решаем вместе!'; if (tm) tm.show(i, $('#slide').textContent); const k = i; $('#readit').addEventListener('click', () => { wakeAudio(); speakRemote((c.t + '. ' + c.h).replace(/<[^>]+>/g, ' ')).then(ok => { if (ok && tm) tm.heard(k); }); }); };
    $('#prev').addEventListener('click', () => { if (i > 0) { i--; draw(); } });
    $('#next').addEventListener('click', () => { SND.tap(); if (i < L.length - 1) { i++; draw(); return; } S.prefs.colGuided = S.prefs.colGuided || {}; S.prefs.colGuided[kind] = true; save(); const go2 = () => go('colwork', kind); if (!tm) return go2(); Coach.finishLesson('t:' + kind, tm, CHECK[kind], go2); });
    draw();
  };
  const CHECK = {
    div: [{ type: 'one', q: 'С какой стороны начинаем делить столбиком?', a: ['Слева — со старших разрядов', 'Справа — с единиц', 'С середины', 'Как удобно'], c: 0, why: 'Деление идёт слева направо.' }, { type: 'tf', q: 'Остаток всегда должен быть меньше делителя.', c: true, why: 'Если остаток больше или равен делителю — в частном цифру взяли мало.' }],
    add: [{ type: 'one', q: '7 + 8 в разряде единиц. Что пишем?', a: ['5, а 1 запоминаем', '15', '1, а 5 запоминаем', '0'], c: 0, why: '7 + 8 = 15: пишем 5, а десяток запоминаем.' }, { type: 'tf', q: 'Если сверху цифра меньше, чем снизу, при вычитании занимаем десяток у соседа.', c: true, why: 'Да! А над соседом ставим точку.' }],
  };

  /* ================= подключение: Школа сыщика ================= */
  { const sch = SCREENS.school; SCREENS.school = arg => { sch(arg); const pg = $('.page', app); if (!pg) return;
    const card = (cls, ic, title, txt, kind) => `<div class="school-card ${cls}"><div class="sc-ic">${ic}</div><div class="sc-body"><h2>${title}</h2><p>${txt}</p><div class="row-btns"><button class="btn pink" data-go="collesson" data-arg="${kind}">📖 Урок ${((S.theory || {})['t:' + kind] || {}).verified ? '✔' : ''}</button><button class="btn" data-go="colwork" data-arg="${kind}">🐾 Решаем</button></div></div></div>`;
    const tip = $('p.small.center', pg);
    const html = card('div', '➗', 'Деление столбиком', 'На одно- и двузначное число, с нулём в частном и с остатком — шаг за шагом.', 'div') + card('add', '➕', 'Сложение и вычитание столбиком', 'Многозначные числа до миллиона: переход через разряд и «занимаем десяток».', 'add')
      + (window.SUBJECTS && window.SUBJECTS.math4 ? `<div class="school-card m4"><div class="sc-ic">📐</div><div class="sc-body"><h2>Вся программа 4 класса</h2><p>Числа до миллиона, величины, деление с остатком, порядок действий, задачи на движение, работу и покупки, доли, геометрия, диаграммы.</p><div class="row-btns"><button class="btn pink" id="m4go">📚 Открыть темы</button><span class="small">${typeof subjProgress === 'function' ? subjProgress('math4') + '%' : ''}</span></div></div></div>` : '');
    if (tip) tip.insertAdjacentHTML('beforebegin', html); else pg.insertAdjacentHTML('beforeend', html);
    $('#m4go')?.addEventListener('click', () => { SND.tap(); go('subject', 'math4'); });
  }; }
  const sv = solvedTotal; solvedTotal = function () { return sv() + ((S.st.div || {}).done || 0) + ((S.st.add || {}).done || 0); }; // деление и сложение тоже открывают комнаты
  ['colwork', 'collesson'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { divPlan, addPlan, genDiv, genAdd };
})();
window.Column = Column;
