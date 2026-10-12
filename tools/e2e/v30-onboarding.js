// v30: экскурсии с котиком — большая для ребёнка (один раз, пропуск, повтор из ⚙️), мини-экскурсии экранов,
// экскурсия для взрослых, «что нового» для ветеранов; аккуратное завершение на 320/390/768, без ошибок и вылезаний за край
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V30 OK ' : 'V30 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.setBypassServiceWorker(true); await p.setRequestInterception(true);
  p.on('request', r => { const u = r.url(); if (/murlok-api|\/api\//.test(u)) return r.respond({ status: 404, headers: { 'access-control-allow-origin': '*' }, body: '' }); r.continue(); });
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('murlok-tour-e2e', '1'); } catch (e) { } });
  const E = (f, ...a) => p.evaluate(f, ...a);
  const tourOn = () => E(() => !!document.querySelector('.tour'));
  const waitFor = async (f, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f()) return true; await sleep(150); } return false; };
  const fits = () => E(() => { const vw = innerWidth, vh = innerHeight, in_ = r => r.left >= -1 && r.right <= vw + 1 && r.top >= -1 && r.bottom <= vh + 1;
    const bub = document.querySelector('.tour-bub'), cat = document.querySelector('.tour-cat'); if (!bub || !cat) return 'no bubble/cat';
    const br = bub.getBoundingClientRect(), cr = cat.getBoundingClientRect();
    if (!in_(br)) return 'bubble out ' + JSON.stringify([br.left, br.right, br.top, br.bottom]);
    if (!in_(cr)) return 'cat out ' + JSON.stringify([cr.left, cr.right, cr.top, cr.bottom]);
    if (document.documentElement.scrollWidth > vw + 1) return 'h-scroll ' + document.documentElement.scrollWidth;
    const nx = document.querySelector('.tb-next').getBoundingClientRect(); if (!in_(nx) || nx.width < 40) return 'next button hidden';
    return ''; });
  // пройти экскурсию до конца кнопкой «Дальше» (настоящими нажатиями); вернуть число шагов и проблемы раскладки
  const walk = async (tag) => {
    let steps = 0, bad = '';
    for (let k = 0; k < 20; k++) {
      if (!(await tourOn())) break;
      const got = await waitFor(() => E(() => { const b = document.querySelector('.tour-bub'); return !document.querySelector('.tour') || (b && b.classList.contains('in')); }), 6000);
      if (!(await tourOn())) break;
      if (!got) { bad = bad || 'step ' + k + ' never arrived'; break; }
      steps++; const f = await fits(); if (f && !bad) bad = `step ${k}: ${f}`;
      await p.click('.tour .tb-next'); await sleep(250);
    }
    const gone = await waitFor(async () => !(await tourOn()), 4000);
    ok(tag + ': tour ends cleanly', gone && !(await E(() => document.body.classList.contains('tour-on'))));
    ok(tag + ': layout fits the screen on every step', !bad, bad);
    return steps;
  };

  /* ---------- 390: знакомство → окна по очереди → экскурсия ---------- */
  await p.goto(URL); await p.waitForSelector('#kid');
  await E(() => { localStorage.removeItem('murlok-detective-v1'); }); await p.goto(URL); await p.waitForSelector('#kid');
  await p.type('#kid', 'Маша'); await p.$eval('#nm', i => { i.value = ''; }); await p.type('#nm', 'Пушок'); await p.click('#start');
  await waitFor(() => E(() => !!document.querySelector('.modal')), 4000);
  await sleep(2500);
  ok('tour waits while welcome popup is open', await E(() => !!document.querySelector('.modal')) && !(await tourOn()));
  for (let k = 0; k < 6; k++) { // закрываем все окна (знакомство, подарок за вход…) как ребёнок
    const has = await E(() => { const m = document.querySelector('.modal'); if (!m) return false; const c = m.querySelector('#claim'); if (c) { c.click(); return true; } const x = m.querySelector('[data-close], #newsOk'); if (x) x.click(); else m.remove(); return true; });
    if (!has) { await sleep(1300); if (!(await E(() => !!document.querySelector('.modal')))) break; } else await sleep(700);
  }
  ok('kid tour starts by itself after popups', await waitFor(tourOn, 6000));
  ok('own cat with outfit in the tour', await E(() => !!document.querySelector('.tour-cat svg') && document.querySelector('.hero-cat').style.visibility === 'hidden'));
  ok('spotlight + bubble + dots + skip', await E(() => !!document.querySelector('.tour-hole') && !!document.querySelector('.tb-dots i') && !!document.querySelector('.tb-skip')));
  // котик сначала подбегает, потом пишет текст — под нагрузкой это дольше 1,8 с, поэтому ждём условие
  ok('bubble text mentions kid and cat names', await waitFor(() => E(() => /Маша/.test((document.querySelector('.tb-title') || {}).textContent || '') && /Пушок/.test((document.querySelector('.tb-text') || {}).textContent || '')), 6000));
  const steps = await walk('390 kid');
  ok('kid tour has 8–12 stops', steps >= 8 && steps <= 12, String(steps));
  ok('tour marked done, hero cat back', await E(() => S.tourDone === 1 && document.querySelector('.hero-cat').style.visibility === ''));
  await p.reload(); await sleep(4500);
  ok('tour runs only once', !(await tourOn()) && (await E(() => curScreen === 'home')));

  /* ---------- повтор из ⚙️ и «Пропустить» ---------- */
  await E(() => document.querySelector('#cfg').click()); await sleep(300);
  ok('settings: excursion row', !!(await p.$('.modal #set-tour')));
  await E(() => document.querySelector('.modal #set-tour').click());
  ok('replay starts', await waitFor(tourOn, 3000));
  await waitFor(() => E(() => document.querySelector('.tour-bub.in')), 5000);
  await p.click('.tour .tb-skip');
  ok('skip ends the tour', await waitFor(async () => !(await tourOn()), 3000));

  /* ---------- мини-экскурсии: один раз на экран ---------- */
  for (const [scr, min] of [['school', 2], ['newcase', 2], ['house', 2], ['blitz', 2], ['academy', 2]]) {
    await E(s => go(s), scr);
    ok(scr + ': mini tour on first visit', await waitFor(tourOn, 5000));
    const ms = await walk(scr); ok(scr + ': 2–4 stops', ms >= min && ms <= 4, String(ms));
    ok(scr + ': remembered', await E(s => !!(S.tours || {})[s], scr));
    await E(() => go('home')); await sleep(300); await E(s => go(s), scr); await sleep(2600);
    ok(scr + ': not shown again', !(await tourOn()));
  }
  // Esc и уход с экрана
  await E(() => { delete S.tours.diplomas; go('diplomas'); });
  ok('diplomas mini tour', await waitFor(tourOn, 5000));
  await waitFor(() => E(() => document.querySelector('.tour-bub.in')), 5000);
  await p.keyboard.press('Escape'); ok('Esc closes the tour', await waitFor(async () => !(await tourOn()), 3000));
  await E(() => { delete S.tours.friends; go('friends'); });
  ok('friends mini tour', await waitFor(tourOn, 6000));
  await E(() => go('home')); await sleep(200);
  ok('leaving the screen removes the tour', !(await tourOn()) && !(await E(() => document.body.classList.contains('tour-on'))));

  /* ---------- раздел для взрослых ---------- */
  await E(() => go('parents'));
  ok('adult tour on first visit', await waitFor(tourOn, 5000) && await E(() => document.querySelector('.tour').classList.contains('adult')));
  ok('adult cat wears detective coat', await E(() => !!document.querySelector('.tour-cat .coat')));
  const as = await walk('adult'); ok('adult tour covers the tabs', as >= 5, String(as));
  ok('adult tour remembered, tabs work', await E(() => S.tours.parents === 1 && document.querySelectorAll('.ptab-pane:not([hidden])').length === 1));
  await E(() => go('home')); await sleep(300); await E(() => go('parents')); await sleep(2500);
  ok('adult tour not repeated', !(await tourOn()));
  await E(() => { document.querySelector('.ptabs [data-tab="acc"]').click(); document.querySelector('#tour-adult').click(); });
  ok('adult tour replay button', await waitFor(tourOn, 3000));
  await E(() => Tour.end()); await waitFor(async () => !(await tourOn()), 3000);

  /* ---------- ветеран: без большой экскурсии, но с показом новинки ---------- */
  await E(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Саша', seenVersion: APP_VERSION, login: { last: today(), day: 1 }, xp: 3000, cases: 5, st: { mul: { done: 40, perfect: 30 }, eq: { done: 10, perfect: 5 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } } }))));
  await p.reload(); await sleep(1500); // окна (новая комната и т. п.) закрываем — экскурсия ждёт их
  await waitFor(async () => { await E(() => document.querySelectorAll('.modal').forEach(m => m.remove())); return tourOn(); }, 9000);
  ok('veteran: what\'s-new tour (1 stop) instead of the full tour', await E(() => !S.tourDone && S.tourVet === 1 && Tour.active && document.querySelectorAll('.tb-dots i').length <= 1));
  await walk('whatsnew');
  ok('what\'s-new remembered', await E(() => S.tours['new:excursion'] === 1));
  await E(() => go('school')); await sleep(2600); ok('veteran: no mini tours', !(await tourOn()));

  /* ---------- 320 и 768: полная экскурсия ---------- */
  for (const [w, h] of [[320, 640], [768, 1024]]) {
    await p.setViewport({ width: w, height: h, isMobile: w < 700, hasTouch: true });
    await E(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Саша', seenVersion: APP_VERSION, login: { last: today(), day: 1 } }))));
    await p.reload();
    ok(w + ': kid tour starts', await waitFor(tourOn, 7000));
    const s = await walk(String(w)); ok(w + ': all stops', s >= 8, String(s));
  }
  /* ---------- меньше движения ---------- */
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await E(() => { S.tourDone = 0; Tour.replayKid(); });
  ok('reduced motion: tour runs', await waitFor(tourOn, 3000));
  ok('reduced motion: no footprints', await E(() => new Promise(r => setTimeout(() => r(!document.querySelector('.tour-paw')), 1200))));
  await walk('reduced');

  ok('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  console.log(`V30 DONE ${n - fails}/${n}` + (fails ? ' FAIL' : ''));
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('V30 FAIL crash ' + e.message); process.exit(1); });
