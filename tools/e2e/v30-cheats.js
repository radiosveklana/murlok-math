// v30: «📋 Шпаргалки» — кнопка в шапке экранов с задачами (нужная шпаргалка по теме), полный экран из Школы и с главной,
// интерактивная таблица умножения, «трудные» примеры, отчёт для взрослых, без горизонтальной прокрутки на 320px
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let fails = 0;
const ok = (name, c, x = '') => { if (!c) fails++; console.log((c ? 'V30 OK ' : 'V30 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const W of [320, 390]) {
    const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: W, height: 720, isMobile: true, hasTouch: true });
    p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
    await p.goto(URL); await p.waitForSelector('#kid');
    await p.evaluate(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Саша', seenVersion: APP_VERSION, rankV: 2, login: { last: today(), day: 1 }, facts: { '7×8': 3, '6×9': 1 } }))));
    await p.goto(URL); await sleep(1300);
    const E = (f, ...a) => p.evaluate(f, ...a);
    const go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal,.toast').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(450); };
    const hscroll = () => E(() => document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : 0);
    const sheetOver = () => E(() => { const sh = document.querySelector('.cs-sheet'); if (!sh) return 'no sheet'; const R = sh.getBoundingClientRect(); const bad = [...sh.querySelectorAll('*')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > R.right + 1 || r.left < R.left - 1); }).map(el => el.className || el.tagName); return bad.slice(0, 3).join(',') || (sh.scrollWidth > sh.clientWidth + 1 ? 'sheet scrollW' : ''); });
    const T = W + 'px ';

    // главная: плитка в «Учиться»
    await go('home');
    ok(T + 'home: tile in «Учиться»', await E(() => !!document.querySelector('.hs-learn [data-go="cheats"]')));
    // Школа: кнопка
    await go('school');
    ok(T + 'school: cheats button', await E(() => !!document.querySelector('.page.school4 [data-go="cheats"]')));
    await E(() => document.querySelector('.page.school4 [data-go="cheats"]').click()); await sleep(500);
    ok(T + 'full screen opens', await E(() => curScreen === 'cheats' && document.querySelectorAll('.cs-tab').length === 7 && !!document.querySelector('.cs-tt')));
    // все листы без горизонтальной прокрутки
    for (const id of ['table', 'comp', 'order', 'column', 'units', 'formulas', 'ranks']) {
      await E(id => document.querySelector(`.cs-tab[data-cs="${id}"]`).click(), id); await sleep(150);
      const hs = await hscroll(); const cards = await E(() => document.querySelectorAll('.cs-card').length);
      const over = await E(() => [...document.querySelectorAll('.cheats-page *')].filter(el => { const r = el.getBoundingClientRect(); return r.width && r.right > innerWidth + 1; }).map(el => el.className || el.tagName).slice(0, 3).join(','));
      ok(T + 'sheet ' + id + ': cards, no h-scroll', cards >= 2 && !hs && !over, `cards=${cards} hs=${hs} over=${over}`);
    }
    // таблица: трудные, выбор клетки
    await E(() => document.querySelector('.cs-tab[data-cs="table"]').click()); await sleep(150);
    ok(T + 'table: 10×10 + hard facts marked', await E(() => document.querySelectorAll('.cs-tt button.tc').length === 100 && document.querySelector('.cs-tt .tc[data-p="7"][data-q="8"]').classList.contains('hard') && document.querySelector('.cs-tt .tc[data-p="8"][data-q="7"]').classList.contains('hard') && document.querySelector('.cs-tt .tc[data-p="9"][data-q="6"]').classList.contains('hard') && !document.querySelector('.cs-tt .tc[data-p="2"][data-q="3"]').classList.contains('hard')));
    await E(() => document.querySelector('.cs-tt .tc[data-p="7"][data-q="8"]').click()); await sleep(100);
    ok(T + 'table: tap highlights row/col and shows division', await E(() => document.querySelector('.cs-tt .tc.sel').textContent === '56' && document.querySelectorAll('.cs-tt .tc.hl').length >= 14 && /56 : 8 = 7/.test(document.querySelector('.cs-read').textContent) && /56 : 7 = 8/.test(document.querySelector('.cs-read').textContent)));
    ok(T + 'table cells readable', await E(() => { const c = document.querySelector('.cs-tt button.tc'); return parseFloat(getComputedStyle(c).fontSize) >= 12 && c.getBoundingClientRect().width >= 20; }));
    ok(T + 'voice buttons on every card', await E(() => document.querySelectorAll('.cs-card').length === document.querySelectorAll('.cs-card .cs-say').length));

    // кнопка в шапке и контекст
    const cases = [['practice', 'mul', 'column', 'mul'], ['practice', 'eq', 'comp', 'box'], ['lesson', 'eq', 'comp', 'box'], ['colwork', 'div', 'column', 'div'], ['collesson', 'add', 'column', 'add'],
      ['aquiz', 'math4:motion', 'formulas', 'motion'], ['aquiz', 'math4:motion_two', 'formulas', 'meet'], ['aquiz', 'math4:length_mass', 'units', 'len'], ['aquiz', 'math4:area_units', 'units', 'area'], ['aquiz', 'math4:million_read', 'ranks', 'ranks'], ['aquiz', 'math4:order_ops', 'order', 'order'], ['aquiz', 'math4:part_num', 'formulas', 'part'],
      ['drill', 'div', 'table', 'divrev'], ['blitz', undefined, 'table', 'grid'], ['bugs', undefined, 'comp', 'rules'], ['bugs2', undefined, 'table', 'grid'], ['newcase', undefined, 'table', 'grid']];
    for (const [s, a, sid, card] of cases) {
      await go(s, a);
      const has = await E(() => !!document.querySelector('header.top .cs-btn'));
      const hs = await hscroll();
      const topOk = await E(() => { const t = document.querySelector('header.top'); return [...t.children].every(c => c.getBoundingClientRect().right <= innerWidth + 1); });
      if (!has) { ok(T + `${s}:${a}: 📋 button`, false); continue; }
      await E(() => document.querySelector('header.top .cs-btn').click()); await sleep(250);
      const r = await E(() => ({ sheet: document.querySelector('.cs-modal .cs-wrap').dataset.sheet, focus: (document.querySelector('.cs-modal .cs-card.focus') || {}).dataset?.card }));
      ok(T + `${s}:${a}: 📋 → ${sid}/${card}`, r.sheet === sid && r.focus === card && !hs && topOk, JSON.stringify(r) + ` hs=${hs} top=${topOk}`);
      if (s === 'practice' && a === 'mul') { const so = await sheetOver(); ok(T + 'bottom sheet: nothing sticks out', !so, so);
        await E(() => document.querySelector('.cs-modal .cs-tab[data-cs="units"]').click()); await sleep(120);
        ok(T + 'modal: switch sheet', await E(() => document.querySelector('.cs-modal .cs-wrap').dataset.sheet === 'units'));
        for (const id of ['table', 'column', 'formulas', 'ranks', 'comp']) { await E(id => document.querySelector(`.cs-modal .cs-tab[data-cs="${id}"]`).click(), id); await sleep(100); const so2 = await sheetOver(); ok(T + 'modal sheet ' + id + ' fits', !so2, so2); }
        await E(() => document.querySelector('.cs-modal .cs-x').click()); await sleep(100);
        ok(T + 'modal closes, task kept', await E(() => !document.querySelector('.cs-modal') && curScreen === 'practice'));
      }
    }
    // академия: не математика — без кнопки; дело — по задаче
    const sp = await E(() => window.SUBJECTS.space.units[0].id); await go('aquiz', 'space:' + sp);
    ok(T + 'non-math quiz: no 📋', await E(() => !document.querySelector('header.top .cs-btn')));
    await go('home'); await E(() => { startCase('mul', 1); go('caseintro'); }); await sleep(300); await go('casetask');
    if (await E(() => !!document.querySelector('header.top .cs-btn'))) { const want = await E(() => ({ mul: 'column', eq: 'comp', div: 'column', add: 'column', interro: 'comp', bugmul: 'column', bugeq: 'comp' })[CASE.tasks[CASE.idx].kind] || 'x');
      await E(() => document.querySelector('header.top .cs-btn').click()); await sleep(200);
      const got = await E(() => document.querySelector('.cs-modal .cs-wrap').dataset.sheet); ok(T + 'casetask: 📋 by task kind', got === want || want === 'x', got + ' vs ' + want);
    } else ok(T + 'casetask: 📋 button', false);
    // учёт для взрослых
    ok(T + 'opens noted (no penalty)', await E(() => S.cheats && S.cheats.n >= 10 && S.cheats.task >= 5));
    await E(() => { window.Accounts && (Accounts.adultOk = () => true); }); await go('parents');
    ok(T + 'parents: cheats report', await E(() => { if (window.UX) UX.showAll(); return !!document.querySelector('.cs-rep') && /Шпаргалки/.test(document.querySelector('.cs-rep').textContent); }));
    await ctx.close();
  }
  console.log(errors.length ? 'ERRORS ' + errors.slice(0, 8).join(' | ') : 'errs: none');
  console.log(fails ? 'V30 FAIL total ' + fails : 'V30 DONE');
  await b.close(); process.exit(fails || errors.length ? 1 : 0);
})();
