// v26: «назад» из заданий ведёт в меню раздела, главная по разделам, вход для взрослых только из ⚙️ (удержание/ПИН),
// вкладки раздела для взрослых, выход родителя и ребёнка
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V26 OK ' : 'V26 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.setBypassServiceWorker(true); await p.setRequestInterception(true); const saves = [];
  p.on('request', r => { const u = r.url(), H = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization' };
    if (r.method() === 'OPTIONS' && /murlok-api|\/api\//.test(u)) return r.respond({ status: 204, headers: { ...H, 'access-control-allow-methods': 'GET,POST,OPTIONS' } });
    if (/(murlok-api|\/api)\/save/.test(u)) { saves.push(r.postData()); return r.respond({ status: 200, contentType: 'application/json', headers: H, body: '{"ok":true}' }); }
    if (/acc\/start/.test(u)) return r.respond({ status: 200, contentType: 'application/json', headers: H, body: '{"ok":true,"isNew":false}' });
    if (/acc\/verify/.test(u)) return r.respond({ status: 200, contentType: 'application/json', headers: H, body: '{"token":"PT","family":{}}' });
    if (/(murlok-api|\/api)\/acc\//.test(u)) return r.respond({ status: 200, contentType: 'application/json', headers: H, body: '{"ok":true,"items":[]}' });
    r.continue(); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Саша', seenVersion: APP_VERSION, rankV: 2, xp: 3000, lessons: { mul: 1, eq: 1 } }))));
  await p.goto(URL); await sleep(1500);
  const E = (f, ...a) => p.evaluate(f, ...a), clean = () => E(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove()));
  const go = async (s, a) => { await clean(); await E((s, a) => go(s, a), s, a); await sleep(500); };
  const back = async () => { await clean(); await E(() => document.querySelector('.top .back').click()); await sleep(500); };
  const cur = () => E(() => curScreen + ':' + (Nav.current().a ?? ''));

  /* ---------- главная ---------- */
  await go('home');
  ok('no adult button on kids home', !(await p.$('.foot')) && !(await E(() => !!document.querySelector('#app [data-go="parents"]'))));
  ok('home grouped into sections', await E(() => document.querySelectorAll('.home-sec').length === 3 && !!document.querySelector('.hs-learn [data-go="school"]') && !!document.querySelector('.hs-cat [data-go="house"]') && !!document.querySelector('.hs-social [data-go="friends"]')));
  ok('all tiles kept', await E(() => document.querySelectorAll('.home-sec .tile').length) >= 14, String(await E(() => document.querySelectorAll('.home-sec .tile').length)));

  /* ---------- «назад» из заданий — в меню ---------- */
  const unit = await E(() => window.SUBJECTS.space.units[0].id), unit2 = await E(() => window.SUBJECTS.space.units[1].id);
  await go('academy'); await go('subject', 'space'); await go('aquiz', 'space:' + unit); await go('aquiz', 'space:' + unit2); await back();
  ok('back from academy quiz → subject menu', (await cur()) === 'subject:space', await cur());
  await back(); ok('back from subject → academy', (await cur()).startsWith('academy'), await cur());
  await go('home'); await go('school'); await go('practice', 'mul'); await go('practice', 'mul'); await back();
  ok('back from practice → school', (await cur()).startsWith('school'), await cur());
  await go('home'); await go('games'); await go('game', 'scales'); await back();
  ok('back from game → games', (await cur()).startsWith('games'), await cur());
  await go('home'); await go('subject', 'creative'); await go('ideas'); await go('ideas', 'story'); await back();
  ok('back from idea task → ideas menu', (await cur()) === 'ideas:', await cur());

  /* ---------- замок раздела для взрослых: ПИН или код из почты ---------- */
  await E(() => localStorage.setItem('murlok-strict-gate', '1'));
  await go('home'); await E(() => document.querySelector('#cfg').click()); await sleep(300);
  ok('settings: adult entry', !!(await p.$('.modal #set-adult')));
  await E(() => document.querySelector('.modal #set-adult').click()); await sleep(500);
  ok('no PIN: gate asks for email code, not a simple tap', await E(() => curScreen === 'agate') && !!(await p.$('#gmail')) && !(await p.$('.coach-rep')));
  await go('parents'); ok('direct jump to adult section is locked', await E(() => curScreen === 'agate'));
  await go('pcab'); ok('cabinet is locked too', await E(() => curScreen === 'agate' || curScreen === 'pauth'));
  await go('agate', 'parents'); await E(() => document.querySelector('#gmail').click()); await sleep(500);
  await E(() => { document.querySelector('#aem').value = 'mama@test.ru'; document.querySelector('#asend').click(); }); await sleep(800);
  await E(() => { document.querySelector('#acode').value = '123456'; document.querySelector('#averify').click(); }); await sleep(900);
  ok('after email code: create PIN', await E(() => curScreen === 'pinset'));
  await E(() => { pin1.value = '1111'; pin2.value = '1111'; pinok.click(); }); await sleep(300);
  ok('too simple PIN rejected', await E(() => curScreen === 'pinset' && /простой/.test(perr.textContent)));
  await E(() => { pin1.value = '2580'; pin2.value = '2580'; pinok.click(); }); await sleep(700);
  ok('PIN saved and section opens', await E(() => curScreen === 'parents' && S.pin === '2580'));
  await go('home'); await go('parents'); ok('leaving locks again: PIN asked', await E(() => curScreen === 'agate') && !!(await p.$('#pinin')));
  for (let k = 0; k < 5; k++) { await E(() => { pinin.value = '0000'; pingo.click(); }); await sleep(120); }
  await E(() => { pinin.value = '2580'; pingo.click(); }); await sleep(400);
  ok('5 wrong PINs → pause, even the right one waits', await E(() => curScreen === 'agate' && /попыток/.test(pinerr.textContent)));
  await E(() => { S.pinLock = { n: 0, until: 0 }; save(); }); await go('home'); await go('parents');
  await E(() => { pinin.value = '2580'; pingo.click(); }); await sleep(600);
  ok('right PIN opens', await E(() => curScreen === 'parents'));
  ok('adult section has tabs', await E(() => document.querySelectorAll('.ptabs [role=tab]').length === 3 && document.querySelectorAll('.ptab-pane:not([hidden])').length === 1));
  await E(() => document.querySelector('.ptabs [data-tab="acc"]').click()); await sleep(300);
  ok('cabinet tab shows account + settings', await E(() => { const v = document.querySelector('.ptab-pane:not([hidden])'); return !!v.querySelector('.acc-card') && !!v.querySelector('#reset'); }));
  await E(() => { delete S.pin; save(); localStorage.removeItem('murlok-strict-gate'); });

  /* ---------- выход родителя ---------- */
  await E(() => localStorage.setItem('murlok-parent', JSON.stringify({ token: 'T', email: 'mama@test.ru' })));
  await go('home'); await E(() => document.querySelector('#cfg').click()); await sleep(300);
  ok('settings: parent logout row', !!(await p.$('.modal #set-pout')));
  await E(() => document.querySelector('.modal #set-pout').click()); await sleep(600);
  ok('parent logged out', await E(() => !localStorage.getItem('murlok-parent')));
  await E(() => localStorage.setItem('murlok-parent', JSON.stringify({ token: 'T', email: 'mama@test.ru' })));
  await go('parents'); ok('adult section: logout button in cabinet card', !!(await p.$('#aout3')));
  await E(() => document.querySelector('#aout3').click()); await sleep(600); ok('logout from adult section', await E(() => !localStorage.getItem('murlok-parent')));

  /* ---------- выход ребёнка ---------- */
  await E(() => localStorage.setItem('murlok-acc:' + KEY, JSON.stringify({ token: 'C', name: 'Саша' })));
  await p.goto(URL); await sleep(1500); await go('home'); await E(() => document.querySelector('#cfg').click()); await sleep(300);
  ok('settings: logout button on top', !!(await p.$('.modal #set-exit')) && !!(await p.$('.modal #set-site')));
  await E(() => document.querySelector('.modal #set-exit').click()); await sleep(300); const s0 = saves.length;
  await E(() => document.querySelector('.modal #cout').click()); await sleep(2500);
  ok('child logout saves to cloud and clears device', saves.length > s0 && await E(() => !JSON.parse(localStorage.getItem('murlok-detective-v1') || '{}').kid && !localStorage.getItem('murlok-acc:murlok-detective-v1')), saves.length + ' ' + s0 + ' ' + await E(() => (localStorage.getItem('murlok-detective-v1') || '').slice(0, 60)));
  ok('after logout: back to the site', await E(() => location.pathname.endsWith('/about/')));
  ok('no errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log('V26 DONE', n, fails ? 'FAILED ' + fails : ''); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('V26 FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
