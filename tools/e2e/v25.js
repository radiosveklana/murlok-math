// v25: личные кабинеты в приложении (сервер подменён): вход родителя с согласием, кабинет, привязка прогресса,
// вход ребёнка по семейному коду и картинке-ПИН, опрос, подарки от админа, облако и друзья только с кабинетом, подстройка Академии
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0;
const ok = (name, c, x = '') => { n++; console.log((c ? 'V25 OK ' : 'V25 FAIL ') + name + (x ? ' ' + x : '')); };
const FAM = { id: 'FTEST000001', email: 'mama@test.ru', code: 'FAM123', priorities: [], plan: 'free', created: Date.now(), consent: { ver: '2026-10-09', at: Date.now() }, ref: { code: 'REFP01', visits: 3, regs: 1 }, children: [] };
const SAVE = { v: 1, kid: 'Кэтика', name: 'Котофей', fur: 'galaxy', xp: 32130, candies: 500, gems: 9, cases: 13, seenVersion: '25', rankV: 2, login: { last: new Date().toISOString().slice(0, 10), day: 1 }, st: { mul: { done: 400, perfect: 300 }, eq: { done: 100, perfect: 80 }, bug: { done: 10, perfect: 5 }, blitz: { games: 2, best: 12 } } };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  const calls = []; let pendingItems = []; await p.setBypassServiceWorker(true); // на https офлайн-кэш иначе уводит запросы мимо подмены
  await p.setRequestInterception(true);
  const handler = r => {
    const u = r.url(); const H = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization' };
    if (r.method() === 'OPTIONS' && /murlok-api|tech-wave\.ru\/api/.test(u)) return r.respond({ status: 204, headers: { ...H, 'access-control-allow-methods': 'GET,POST,OPTIONS' } });
    const m = u.match(/(?:murlok-api|tech-wave\.ru\/api)\/(acc\/[a-z\/]+|save|load|tts|chat|friend\/\w+)/); if (!m) return r.continue();
    const act = m[1], d = JSON.parse(r.postData() || '{}'); calls.push(act + ' ' + (r.postData() || '').slice(0, 80));
    const J = (o, st = 200) => r.respond({ status: st, contentType: 'application/json', headers: H, body: JSON.stringify(o) });
    if (act === 'acc/start') return J({ ok: true, isNew: true });
    if (act === 'acc/verify') return d.consent ? J({ token: 'PTOKEN', family: FAM }) : J({ error: 'consent' }, 400);
    if (act === 'acc/family') return J({ family: FAM });
    if (act === 'acc/child') { const k = { id: 'CKID0000001', name: d.name, cat: d.cat, fur: 'ginger', wear: {}, xp: 0, cases: 0, minutesWeek: 0, lastSeen: 0, hasPin: true, cloudCode: d.cloudCode || 'NEWCODE1', ref: { code: 'REFC01', visits: 0, regs: 0 } }; FAM.children.push(k); return J({ child: k, token: 'CTOKEN' }); }
    if (act === 'acc/child/list') return J({ kids: [{ id: 'CKID0000001', name: 'Кэтика', fur: 'galaxy', wear: {}, hasPin: true }] });
    if (act === 'acc/child/login') return JSON.stringify(d.pin) === '[1,5,9]' ? J({ token: 'CTOKEN', cloudCode: 'KIDCODE1', name: 'Кэтика', needSurvey: true }) : J({ error: 'pin' }, 400);
    if (act === 'acc/child/me') return J({ name: 'Кэтика', priorities: ['read'], survey: null, cloudCode: 'KIDCODE1' });
    if (act === 'acc/survey') return J({ ok: true });
    if (act === 'acc/pending') { const it = pendingItems; pendingItems = []; return J({ items: it }); }
    if (act === 'acc/priorities') return J({ ok: true });
    if (act === 'load') return J(SAVE);
    return J({ ok: true });
  };
  p.on('request', handler);
  await p.goto(URL); await p.waitForSelector('#kid');
  const E = (f, ...a) => p.evaluate(f, ...a), go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(700); };
  const click = async s => { await p.waitForSelector(s, { timeout: 8000 }); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); try { await p.click(s); } catch (e) { await E(s => document.querySelector(s).click(), s); } await sleep(400); };

  /* ---------- первый экран ---------- */
  ok('hello: adult and family-code entries', !!(await p.$('#aparent')) && !!(await p.$('#achild')));
  /* ---------- вход ребёнка по семейному коду ---------- */
  await click('#achild'); await p.type('#fcode', 'fam123'); await click('#fgo'); await click('[data-k="CKID0000001"]');
  for (const i of [1, 5, 8]) await click(`#pkc .pp[data-i="${i}"]`); await click('#cgo'); await sleep(600); ok('wrong pictures rejected', await E(() => curScreen === 'clogin'));
  for (const i of [1, 5, 9]) await click(`#pkc .pp[data-i="${i}"]`); await click('#cgo'); await sleep(3500);
  for (let t = 0; t < 3 && !(await E(() => typeof go === 'function').catch(() => false)); t++) await sleep(1000);
  ok('child progress loaded from cloud', await E(() => S.kid === 'Кэтика' && S.xp === 32130 && S.cloudCode === 'KIDCODE1'));
  ok('child linked on device', await E(() => Accounts.linked()));
  for (let t = 0; t < 12 && !(await E(() => curScreen === 'survey')); t++) { await E(() => document.querySelectorAll('.modal').forEach(m => m.remove())); await sleep(1500); }
  ok('survey opens for new child', await E(() => curScreen === 'survey'));
  for (let i = 0; i < 6; i++) { await click('#sv .opt'); await click('#svn'); }
  ok('survey saved', await E(() => !!S.profile && !!S.profile.like) && calls.some(c => c.startsWith('acc/survey')));
  /* ---------- подстройка Академии и облако ---------- */
  await go('academy'); ok('academy: favourite subjects first', await E(() => { const c = document.querySelector('.acad-grid .acad-card'); return c && c.classList.contains('fav') && ['read', 'think', 'world'].includes(c.dataset.s); }), await E(() => [...document.querySelectorAll('.acad-grid .acad-card')].slice(0, 3).map(c => c.dataset.s + (c.classList.contains('fav') ? '*' : '')).join(',')));
  const saves0 = calls.filter(c => c.startsWith('save')).length; await E(() => { window.ALLOW_CLOUD = true; cloudDirty = true; cloudPush(); }); await sleep(800);
  ok('linked child syncs to cloud', calls.filter(c => c.startsWith('save')).length > saves0);
  /* ---------- подарок от админа ---------- */
  pendingItems = [{ type: 'grant', candies: 50, gems: 5, note: 'За старание!' }]; const c0 = await E(() => S.candies); await go('home'); await sleep(2500);
  ok('admin grant received', await E(c0 => S.candies === c0 + 50 && /Подарок от команды/.test(document.body.innerText), c0));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove()));

  /* ---------- новое устройство без кабинета: облако и друзья закрыты, родитель привязывает ---------- */
  const ctx2 = await b.createBrowserContext(); const q = await ctx2.newPage(); await q.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true }); await q.setBypassServiceWorker(true); await q.setRequestInterception(true);
  q.on('request', handler); q.on('pageerror', e => errors.push('PAGEERR2 ' + e.message));
  await q.goto(URL); await q.waitForSelector('#kid');
  await q.evaluate(s => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), s, { cloudCode: 'DEVICE01' }))); }, SAVE); await q.goto(URL); await sleep(1500);
  const E2 = (f, ...a) => q.evaluate(f, ...a), click2 = async s => { await q.waitForSelector(s, { timeout: 8000 }); await E2(() => document.querySelectorAll('.toast').forEach(t => t.remove())); try { await q.click(s); } catch (e) { await E2(s => document.querySelector(s).click(), s); } await sleep(400); };
  const sv0 = calls.filter(c => c.startsWith('save')).length; await E2(() => { window.ALLOW_CLOUD = true; cloudDirty = true; cloudPush(); }); await sleep(600);
  ok('unlinked device does not push to cloud', calls.filter(c => c.startsWith('save')).length === sv0);
  await E2(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); go('friends'); }); await sleep(600); ok('friends locked without cabinet', await E2(() => /вместе со взрослым/.test(document.body.innerText)));
  await E2(() => go('parents')); await sleep(600); ok('parents: cabinet entry', !!(await q.$('.acc-card')));
  await E2(() => go('pauth')); await sleep(500); await q.type('#aem', 'mama@test.ru'); await click2('#asend'); ok('consent checkboxes for new parent', await E2(() => !document.querySelector('#acons').hidden));
  await q.type('#acode', '123456'); await click2('#averify'); ok('consent is required', await E2(() => /согласие/.test(document.querySelector('#aerr').innerText)));
  await click2('#ac1'); await click2('#ac2'); await click2('#averify'); await sleep(1200);
  ok('after code: parent creates adult PIN', await E2(() => curScreen === 'pinset'));
  await E2(() => { pin1.value = '2580'; pin2.value = '2580'; pinok.click(); }); await sleep(1500);
  ok('parent cabinet opened', await E2(() => curScreen === 'pcab' && /FAM123/.test(document.body.innerText)));
  ok('referral counters shown', await E2(() => /Переходы: 3/.test(document.body.innerText) && /регистрации: 1/.test(document.body.innerText)));
  ok('link-this-device card', !!(await q.$('#linkhere')));
  for (const i of [2, 3, 4]) await click2(`#pk0 .pp[data-i="${i}"]`); await click2('#linkhere'); await sleep(1500);
  ok('device progress linked', (await E2(() => Accounts.linked())) && calls.some(c => c.startsWith('acc/child') && c.includes('DEVICE01')));
  ok('parent token kept out of game state', await E2(() => !JSON.stringify(S).includes('PTOKEN')));
  ok('no errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log('V25 DONE', n); await b.close();
})().catch(e => { console.log('V25 FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
