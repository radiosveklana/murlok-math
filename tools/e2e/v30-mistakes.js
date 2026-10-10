// v30: «Работа над ошибками», предложение повторить, «Проверь мою тетрадь», листок для печати, отчёт;
// без повторов решённых задач/вопросов; уроки открываются по порядку (+ «Открыть все уроки»)
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V30 OK ' : 'V30 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404|AudioContext/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.setBypassServiceWorker(true); await p.setRequestInterception(true);
  p.on('request', r => { const u = r.url(), H = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization' };
    if (/(murlok-api|\/api)\//.test(u)) return r.respond({ status: 200, contentType: 'application/json', headers: H, body: '{"ok":true,"items":[]}' });
    r.continue(); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Саша', seenVersion: APP_VERSION, rankV: 2, xp: 3000, lessons: { mul: 1, eq: 1 } }))));
  await p.goto(URL); await sleep(1500);
  const E = (f, ...a) => p.evaluate(f, ...a), clean = () => E(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove()));
  const go = async (s, a) => { await clean(); await E((s, a) => go(s, a), s, a); await sleep(450); };
  const click = async sel => { await E(s => document.querySelector(s).click(), sel); await sleep(350); };
  const txt = sel => E(s => (document.querySelector(s) || {}).innerText || '', sel);
  const setv = (sel, v) => E((s, v) => { document.querySelector(s).value = v; }, sel, v);
  try {
    /* ---------- главная и хабы ---------- */
    await go('home');
    ok('home tile in «Учиться»', await E(() => !!document.querySelector('.hs-learn .t-mist[data-go="mistakes"]')));
    await go('school'); ok('school hub button', await E(() => !!document.querySelector('.school4 [data-go="mistakes"]')));
    await go('academy'); ok('academy hub button', await E(() => !!document.querySelector('[data-go="mistakes"][data-arg="academy"]')));
    await go('mistakes'); ok('empty state is kind', /Ошибок для разбора нет/.test(await txt('.mk-page')) && !!(await p.$('[data-go="paper"]')) && !!(await p.$('[data-go="worksheet"]')));

    /* ---------- журнал ошибок из настоящей задачи ---------- */
    await go('colwork', 'div'); await E(() => { const [a0, b0] = document.querySelector('#cwork .task-title').textContent.split(':').map(x => +x.trim()), P = Column.divPlan(a0, b0); const w = [...document.querySelectorAll('#cin .opt')].find(b => +b.dataset.v !== P.first); if (w) w.click(); });
    ok('division mistake typed (div:first / div:q)', await E(() => Mistakes._buf().some(x => /^div:/.test(x.t))), JSON.stringify(await E(() => Mistakes._buf())));

    /* ---------- ≥2 ошибок → котик предлагает повторить ---------- */
    await go('practice', 'mul');
    await E(() => { Mistakes.begin({ kind: 'mul', a: 79, b: 41, lv: 2 }); noteErr('carry'); noteErr('carry'); taskDone('mul', { mistakes: 2, helped: false }, { level: 2, guided: false }); });
    ok('mistake logged', await E(() => S.mlog.length === 1 && S.mlog[0].e === 'mul:carry' && S.mlog[0].s === '79 × 41' && !!S.mtop.mul2 && S.mtop.mul2.p.length === 1));
    await sleep(2600);
    ok('offer modal with specific error', /забываешь прибавить запомненное/.test(await txt('.modal')) && !!(await p.$('.modal #mkles')) && !!(await p.$('.modal #mkone')), await txt('.modal'));
    await click('.modal #mkles'); ok('«Повторим урок» opens lesson', await E(() => curScreen === 'lesson'));

    /* ---------- 2 задачи подряд с одной ошибкой ---------- */
    await go('practice', 'eq'); await E(() => { Mistakes._reset && Mistakes._reset(); });
    await E(() => { const eq = E.genEq(2); Mistakes.begin({ kind: 'eq', eq, lv: 2 }); noteErr('rule', null, 'eq:rule:subtrahend'); taskDone('eq', { mistakes: 1 }, { level: 2, guided: false }); });
    await sleep(2600); const firstModal = !!(await p.$('.modal'));
    await E(() => { window.__lp = 0; const eq = E.genEq(2); Mistakes.begin({ kind: 'eq', eq, lv: 2 }); noteErr('rule', null, 'eq:rule:subtrahend'); taskDone('eq', { mistakes: 1 }, { level: 2, guided: false }); });
    await sleep(2600);
    ok('one mistake → no modal; two in a row of the same type → modal', !firstModal && /путаешь правило: неизвестное вычитаемое/.test(await txt('.modal')), await txt('.modal'));
    await click('.modal #mkone'); ok('«Решим ещё один вместе» → guided drill', await E(() => curScreen === 'mdrill' && document.querySelectorAll('.g-dots i').length === 1));

    /* ---------- экран «Работа над ошибками» ---------- */
    await go('mistakes');
    ok('lists topics with plain-words reason', await E(() => document.querySelectorAll('.mk-item').length >= 2) && /забываешь прибавить запомненное/.test(await txt('.mk-page')) && /79 × 41/.test(await txt('.mk-page')));
    await click('[data-mdr="mul2"]');
    ok('3 similar: first is the mistaken problem, guided', await E(() => curScreen === 'mdrill' && /79 × 41/.test(document.querySelector('.task-title').textContent) && document.querySelectorAll('.g-dots i').length === 3) && /вместе/.test(await txt('#mdn')));
    await go('mistakes'); await click('[data-mles="mul"]'); ok('«Повторить урок» → lesson', await E(() => curScreen === 'lesson'));

    /* ---------- тема уходит после 2 верных решений в другой день ---------- */
    const sameDay = await E(() => { Mistakes.begin({ kind: 'mul', a: 23, b: 45 }); taskDone('mul', { mistakes: 0 }, { level: 2, guided: false }); return S.mtop.mul2.ok || 0; });
    ok('same-day solve does not count', sameDay === 0);
    await E(() => { S.mtop.mul2.last = '2020-01-01'; Mistakes.begin({ kind: 'mul', a: 24, b: 46 }); taskDone('mul', { mistakes: 0 }, { level: 2, guided: true }); });
    ok('guided solve does not count', await E(() => (S.mtop.mul2.ok || 0) === 0));
    await E(() => { Mistakes.begin({ kind: 'mul', a: 25, b: 47 }); taskDone('mul', { mistakes: 0 }, { level: 2, guided: false }); Mistakes.begin({ kind: 'mul', a: 26, b: 48 }); taskDone('mul', { mistakes: 0 }, { level: 2, guided: false }); });
    ok('2 solo solves later → fixed, leaves list', await E(() => !!S.mtop.mul2.fixed && !Mistakes.schoolItems().some(e => e.key === 'mul2') && Mistakes.weekFixed() >= 1));

    /* ---------- без повторов решённых задач ---------- */
    ok('solved problems remembered', await E(() => Mistakes.isSolved('m:25x47') && S.solved.length >= 3));
    ok('makeTask never repeats solved', await E(() => { for (let i = 0; i < 60; i++) { const t = makeTask('mul', 1), s = Mistakes.sigOf({ kind: 'mul', a: t.a, b: t.b }); if (Mistakes.isSolved(s)) return false; Mistakes.solve(s); } return true; }));
    ok('genDiv / genAdd never repeat solved', await E(() => { for (let i = 0; i < 40; i++) { const P = Column.genDiv(1), s = 'd:' + P.a + ':' + P.b; if (Mistakes.isSolved(s)) return false; Mistakes.solve(s); const A = Column.genAdd(1, '+'), s2 = 'a:' + A.a + '+' + A.b; if (Mistakes.isSolved(s2)) return false; Mistakes.solve(s2); } return true; }));
    ok('solved list is bounded', await E(() => { for (let i = 0; i < 5100; i++) Mistakes.solve('t:' + i); const n = S.solved.length; S.solved = S.solved.filter(x => !x.startsWith('t:')); return n === 5000; }));

    /* ---------- Академия: верные вопросы не повторяются, «Тема пройдена» ---------- */
    const u0 = await E(() => SUBJECTS.space.units[0].id), u1 = await E(() => SUBJECTS.space.units[1].id);
    await E(u => { const a = acad('space'), u0 = SUBJECTS.space.units.find(x => x.id === u); a.ok = {}; u0.quiz.forEach((q, i) => { if (i >= 2) a.ok[u + '#' + i] = 1; }); save(); }, u0);
    await go('aquiz', 'space:' + u0); ok('only not-yet-correct questions are asked', await E(() => document.querySelectorAll('.g-dots i').length === 2), String(await E(() => document.querySelectorAll('.g-dots i').length)));
    // отвечаем неверно на всё → <2 звёзд: «Повторить урок», следующий урок закрыт
    for (let k = 0; k < 3; k++) { if (!(await p.$('#qarea .q-unit'))) break; await E(() => { const q = window.__aq; const area = document.querySelector('#qarea');
        if (q.type === 'one') { const w = [...area.querySelectorAll('.opt')].find(b => +b.dataset.i !== q.c); w.click(); } else if (q.type === 'tf') area.querySelector(`.opt[data-v="${q.c ? 0 : 1}"]`).click();
        else if (q.type === 'input') { [...String(+q.c + 1)].forEach(d => area.querySelector(`.k[data-k="${d}"]`).click()); area.querySelector('.k[data-k="ok"]').click(); }
        else if (q.type === 'order') { [...area.querySelectorAll('.ord')].reverse().forEach(b => b.click()); area.querySelector('#ochk').click(); }
        else if (q.type === 'sort') { area.querySelectorAll('.sort-it').forEach(b => { b.click(); }); area.querySelector('#schk').click(); }
        else { const o = [...area.querySelectorAll('.opt')]; o[o.length - 1].click(); } }); await sleep(250); await click('#qn'); }
    ok('<2 stars → prominent «Повторить урок»', !!(await p.$('#relearn')), await txt('#qarea'));
    ok('next lesson locked until ⭐', /🔒/.test(await txt('.next-u')));
    ok('wrong answers go to review', await E(u => Object.keys(acad('space').box).filter(k => k.startsWith(u + '#')).length >= 1, u0));
    await click('#relearn'); ok('«Повторить урок» → textbook', await E(() => curScreen === 'alesson'));
    await E(u => { const a = acad('space'); SUBJECTS.space.units.find(x => x.id === u).quiz.forEach((q, i) => { a.ok[u + '#' + i] = 1; }); save(); }, u0);
    await go('aquiz', 'space:' + u0); ok('all solved → «Тема пройдена»', /Тема пройдена/.test(await txt('.page')));
    ok('mistakes screen shows academy subject', await (async () => { await go('mistakes'); return /Космос|космос/i.test(await txt('.mk-page')) || await E(() => document.querySelectorAll('.mk-item').length >= 2); })());

    /* ---------- уроки по порядку ---------- */
    await go('subject', 'space');
    ok('unit 1 open, unit 2 locked with hint', await E(() => { const us = document.querySelectorAll('.units > .unit'); return !us[0].classList.contains('locked') && us[2].classList.contains('locked') && /Откроется после урока 2/.test(us[2].innerText); }));
    await E(u => { const a = acad('space'); a.read[u] = true; a.best[u] = 1; save(); }, u0); await go('subject', 'space');
    ok('read + ⭐ unlocks next', await E(() => !document.querySelectorAll('.units > .unit')[1].classList.contains('locked')));
    await E(() => { const a = acad('space'); a.best[SUBJECTS.space.units[4].id] = 0; save(); }); await go('subject', 'space');
    ok('already started stays open (migration)', await E(() => !document.querySelectorAll('.units > .unit')[4].classList.contains('locked')));
    await go('school');
    ok('school: first item of each group open, next locked', await E(() => !document.querySelector('.school-card.mul').classList.contains('locked') && document.querySelector('.unit[data-u="million_compare"]').classList.contains('locked') && !document.querySelector('.unit[data-u="million_read"]').classList.contains('locked')));
    ok('taskbank skips locked topics', await E(() => !TaskBank.list().some(t => t.id === 'math4:million_compare') && TaskBank.list().some(t => t.id === 'math4:million_read')));
    await E(() => { window.GOD = true; }); await go('subject', 'space');
    ok('god mode: all open, repeats allowed', await E(() => !document.querySelector('.unit.locked') && !Mistakes.isSolved('m:25x47')));
    await E(() => { delete window.GOD; });
    await E(() => { S.unlockAll = true; save(); }); await go('subject', 'space');
    ok('parent override opens all', await E(() => !document.querySelector('.unit.locked') && TaskBank.list().some(t => t.id === 'math4:million_compare')));
    await E(() => { S.unlockAll = false; save(); });

    /* ---------- «Проверь мою тетрадь» ---------- */
    const own = async (type, fill) => { await go('paper', type); await click('#pown'); await E(fill); await click('#pownok'); };
    await own('mul', () => { oa.value = '47'; ob.value = '36'; });
    ok('paper: own problem shown', /47 × 36/.test(await txt('.pp-q')));
    await setv('#pans', '1652'); await click('#pchk');
    ok('paper: wrong answer → step questions', !!(await p.$('.pp-step')) && /Строка 1/.test(await txt('.pp-step')));
    await setv('#psv', '242'); await click('#psok');
    ok('paper mul: forgot carry pinpointed + replay', /запомненное/.test(await txt('.pp-found')) && !!(await p.$('.pp-replay .rp')), await txt('.pp-found'));
    ok('paper mistake goes to the log', await E(() => S.mlog.some(x => x.e === 'mul:carry' && x.s === '47 × 36')));
    await own('div', () => { oa.value = '2416'; ob.value = '8'; }); await setv('#pans', '32'); await click('#pchk');
    for (const v of ['24', '3', '0', '1']) { await setv('#psv', v); await click('#psok'); }
    await setv('#psv', '2'); await click('#psok');
    ok('paper div: zero in quotient pinpointed', /частном 0/.test(await txt('.pp-found')), await txt('#psteps'));
    await own('add', () => { oa.value = '4587'; ob.value = '2675'; oop.value = '+'; }); await setv('#pans', '7252'); await click('#pchk');
    ok('paper add: tens digit, forgot carry', /десятков/.test(await txt('.pp-found')) && /запомненную единицу/.test(await txt('.pp-found')), await txt('#psteps'));
    await own('eq', () => { oeq.value = '(x + 15) · 4 = 120'; }); ok('paper eq: own equation parsed', /120/.test(await txt('.pp-q')));
    await setv('#pans', '465'); await click('#pchk'); await setv('#psv', '480'); await click('#psok');
    ok('paper eq: wrong rule pinpointed', /путаешь правило: неизвестный множитель/.test(await txt('.pp-found')), await txt('#psteps'));
    await own('mul', () => { oa.value = '12'; ob.value = '3'; }); await setv('#pans', '36'); await click('#pchk');
    ok('paper: right answer praised', /Верно/.test(await txt('#pbub')) && !!(await p.$('#pnext')));
    ok('eq parser rejects junk', await E(() => !Mistakes.parseEq('x + y = 3') && !Mistakes.parseEq('x : 7 = 2.5') && Mistakes.parseEq('120 − x = 45').x === 75));

    /* ---------- листок для печати ---------- */
    await go('worksheet', 'm'); await E(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    await click('[data-wn="12"]'); await click('#wsmake');
    ok('worksheet: 12 problems + answer key page', await E(() => document.querySelectorAll('.ws-item').length === 12 && document.querySelectorAll('.ws-key li').length === 12 && document.querySelectorAll('.ws-space').length === 12));
    await click('#wsprint'); ok('print button calls window.print', await E(() => window.__printed === 1));
    ok('A4 print CSS', await E(() => /@page\s*{\s*size:\s*A4/.test(document.getElementById('mk-css').textContent) && /break-before: page/.test(document.getElementById('mk-css').textContent)));
    await E(() => { S.mtop.div1 = { k: 'div', lv: 1, e: { 'div:q': 2 }, p: [], last: today() }; save(); });
    await go('worksheet', 'p:weak'); ok('worksheet by weak topics', await E(() => document.querySelectorAll('.ws-item').length >= 8) && /Деление/.test(await txt('#wsmsg')), await txt('#wsmsg'));

    /* ---------- раздел для взрослых ---------- */
    await go('parents');
    if (await E(() => curScreen === 'parents')) {
      await E(() => window.UX && UX.showAll());
      ok('parents report line', /Работа над ошибками: \d+ (тема|темы|тем), исправлено \d+ за неделю/.test(await txt('.mk-rep')), await txt('.mk-rep'));
      ok('parents: worksheet card + unlock-all setting', !!(await p.$('[data-go="worksheet"][data-arg="p"]')) && !!(await p.$('#unlockAll')));
    } else ok('parents gate (skipped)', true);
  } catch (e) { ok('crash ' + e.message, false); }
  errors.forEach(e => console.log('V30 FAIL ' + e)); if (errors.length) fails++;
  console.log(fails ? `V30 FAIL ${fails}/${n}` : `V30 DONE ${n}`);
  await b.close(); process.exit(fails ? 1 : 0);
})();
