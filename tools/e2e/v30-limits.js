// v30: время игры (норма в день, разрешённые часы, перерывы, продление через замок взрослого, учёт по разделам)
// и «Играть самому» (профиль взрослого в семье, пометка «взрослый», вход в профиль взрослого только через замок). Сервер подменён.
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V30L OK ' : 'V30L FAIL ') + name + (x ? ' ' + x : '')); };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const SAVE = { v: 1, kid: 'Кэтика', name: 'Котофей', fur: 'galaxy', xp: 3200, candies: 50, gems: 2, cases: 3, seenVersion: '29', rankV: 2, login: { last: today(), day: 1 }, lessons: { mul: true, eq: true }, cloudCode: 'KIDCODE1' };
const LIM = { daily: 30, from: null, to: null, breaks: false, at: 1 };
const ME = { id: 'CKID0000001', name: 'Кэтика', cat: 'Котофей', fur: 'galaxy', wear: {} }, PAPA = { id: 'CADULT00001', name: 'Папа', cat: 'Мурзик', fur: 'ginger', wear: {}, adult: true };
const row = (p, o) => ({ ...p, me: false, xp: 0, tasks: 0, streak: 0, schulte: { 3: null, 4: null, 5: null }, stars: 0, wins: 0, ...o });
const FAM = () => ({ id: 'FTEST000001', email: 'mama@test.ru', code: 'FAM123', priorities: [], plan: 'free', created: Date.now(), consent: { ver: '2026-10-09', at: Date.now() }, ref: { code: 'REFP01', visits: 0, regs: 0 }, me: { email: 'mama@test.ru', role: 'owner' },
  adults: [{ id: 'PADULT001', email: 'mama@test.ru', name: '', role: 'owner', joined: Date.now() }], invites: [], players: played ? [{ id: PAPA.id, name: 'Папа', cat: 'Мурзик', fur: 'ginger', wear: {}, xp: 0, minutesWeek: 0, mine: true, cloudCode: 'ADULTC01' }] : [],
  children: [{ id: ME.id, name: 'Кэтика', cat: 'Котофей', fur: 'galaxy', wear: {}, xp: 3200, cases: 3, minutesWeek: 40, lastSeen: Date.now(), hasPin: true, cloudCode: 'KIDCODE1', limits: LIM, timeDays: { [today()]: 12 } },
    { id: 'CKID0000002', name: 'Миша', cat: 'Барсик', fur: 'ginger', wear: {}, xp: 10, cases: 0, minutesWeek: 0, lastSeen: 0, hasPin: true, cloudCode: 'KIDCODE2', limits: null, timeDays: { [today()]: 7 } }] });
let played = false;
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const calls = [];
  const handler = r => {
    const u = r.url(), H = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization' };
    if (r.method() === 'OPTIONS' && /murlok-api|tech-wave\.ru\/api/.test(u)) return r.respond({ status: 204, headers: { ...H, 'access-control-allow-methods': 'GET,POST,OPTIONS' } });
    const m = u.match(/(?:murlok-api|tech-wave\.ru\/api)\/(acc\/[A-Za-z0-9\/]+|save|load|tts|chat|friend\/\w+)/); if (!m) return r.continue();
    const act = m[1], d = JSON.parse(r.postData() || '{}'), auth = r.headers().authorization || ''; calls.push({ act, d, auth });
    const J = (o, st = 200) => r.respond({ status: st, contentType: 'application/json', headers: H, body: JSON.stringify(o) });
    if (act === 'acc/child/me') return J(auth === 'Bearer ATOKEN' ? { name: 'Папа', priorities: [], survey: null, cloudCode: 'ADULTC01', limits: null, role: 'adult-player' } : { name: 'Кэтика', priorities: [], survey: { like: [] }, cloudCode: 'KIDCODE1', limits: LIM, role: 'child' });
    if (act === 'acc/family') return J({ family: FAM() });
    if (act === 'acc/play') { played = true; return J({ token: 'ATOKEN', childId: PAPA.id, cloudCode: 'ADULTC01', name: d.name, cat: d.cat, familyCode: 'FAM123', hasSave: false }); }
    if (/^acc\/child\/C[A-Z0-9]+\/limits$/.test(act)) return J({ ok: true, limits: { ...d, at: Date.now() } });
    if (act === 'acc/social/board') return J({ from: today(), to: today(), family: [row(PAPA, { xp: 900, place: 1, me: auth === 'Bearer ATOKEN' }), row(ME, { xp: 300, place: 2, me: auth !== 'Bearer ATOKEN' })], friends: [] });
    if (act === 'acc/social/news') return J({ incoming: [], unclaimedDuels: 0, claimableChals: 0 });
    if (act === 'acc/social/people') return J({ family: [auth === 'Bearer ATOKEN' ? ME : PAPA], friends: [] });
    if (act === 'acc/chal/list') return J({ templates: [], active: [{ id: 'HFAM000001', tpl: 'fam_tasks', kind: 'family', mode: '', icon: '👨‍👩‍👧', name: '500 задач семьёй за неделю', goal: 500, metric: 'tasks', start: today(), end: today(), daysLeft: 3, progress: 520, members: [], complete: true, ended: false, reward: { candies: 40, gems: 1, badge: '🏡' }, claimable: false, claimed: false, kidsOnly: auth === 'Bearer ATOKEN' }], past: [], claimable: 0 });
    if (act === 'acc/fam/social') return J({ board: { from: today(), to: today(), rows: [row(PAPA, { xp: 900, place: 1 }), row(ME, { xp: 300, place: 2 })] }, chals: [], duelsWeek: 0, templates: [] });
    if (act === 'acc/fam/friends') return J({ kids: [] });
    if (act === 'acc/pending') return J({ items: [] });
    if (act === 'load') return J({}, 404);
    return J({ ok: true });
  };
  const p = await (await b.createBrowserContext()).newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.setBypassServiceWorker(true); await p.setRequestInterception(true); p.on('request', handler);
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(s => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), s))); localStorage.setItem('murlok-acc:murlok-detective-v1', JSON.stringify({ token: 'CTOKEN', childId: 'CKID0000001', familyCode: 'FAM123', name: 'Кэтика' })); }, SAVE);
  await p.goto(URL); await sleep(2200);
  const E = (f, ...a) => p.evaluate(f, ...a), clean = () => E(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove()));
  const go = async (s, a) => { await clean(); await E((s, a) => go(s, a), s, a); await sleep(500); };
  const setUsed = min => E(min => { S.time = S.time || {}; S.time[today()] = { math: min * 60 }; save(); }, min);

  /* ---------- настройки приходят с сервера ---------- */
  for (let i = 0; i < 20 && !(await E(() => !!(S.limits && S.limits.daily === 30))); i++) await sleep(500);
  ok('limits pulled from /acc/child/me', await E(() => S.limits && S.limits.daily === 30) && calls.some(c => c.act === 'acc/child/me' && c.auth === 'Bearer CTOKEN'), JSON.stringify(await E(() => S.limits || null)) + ' ' + calls.map(c => c.act + ':' + c.auth.slice(7)).join(','));
  await go('home'); await setUsed(26); await clean(); await E(() => Limits.check()); await sleep(300);
  ok('soft warning 5 minutes before', await E(() => [...document.querySelectorAll('.toast')].some(t => /Ещё 4 минуты/.test(t.innerText))));
  await setUsed(31); await E(() => Limits.check()); await sleep(600);
  ok('daily limit → «Пора отдохнуть» screen', await E(() => curScreen === 'rest' && /На сегодня всё/.test(document.body.innerText) && !!document.querySelector('#rst-adult')));
  await go('games'); ok('navigation blocked while resting', await E(() => curScreen === 'rest'));
  await go('parents'); ok('adult section still open (not blocked)', await E(() => curScreen === 'parents'));
  await go('home'); ok('back to rest', await E(() => curScreen === 'rest'));
  ok('block counted once', await E(() => S.limitStat && S.limitStat.blocks === 1));
  /* ---------- продление на 15 минут через ПИН ---------- */
  await E(() => { S.pin = '2580'; save(); }); await clean();
  await E(() => document.querySelector('#rst-adult').click()); await sleep(500);
  ok('unlock asks for adult PIN', await E(() => curScreen === 'agate' && !!document.querySelector('#pinin')));
  await p.type('#pinin', '1111'); await E(() => document.querySelector('#pingo').click()); await sleep(300);
  ok('wrong PIN keeps the block', await E(() => curScreen === 'agate' && /Неверный ПИН/.test(document.body.innerText) && !(S.limitX && S.limitX.add)));
  await E(() => { document.querySelector('#pinin').value = ''; }); await p.type('#pinin', '2580'); await E(() => document.querySelector('#pingo').click()); await sleep(800);
  ok('PIN → +15 minutes, play again', await E(() => curScreen === 'home' && S.limitX.add === 15 && !Limits.state() && S.limitStat.unlocks === 1));
  await setUsed(46); await E(() => Limits.check()); await sleep(500); ok('limit with extension reached again', await E(() => curScreen === 'rest'));
  await E(() => { S.limitX = null; S.time[today()] = {}; S.pin = null; save(); }); await E(() => Limits.check()); await sleep(600); ok('new allowance → rest screen leaves by itself', await E(() => curScreen === 'home'));
  /* ---------- разрешённые часы ---------- */
  await E(() => { const d = new Date(Date.now() + 2 * 36e5), e = new Date(Date.now() + 3 * 36e5), f = x => String(x.getHours()).padStart(2, '0') + ':00'; S.limits = { daily: 0, from: f(d), to: f(e), breaks: false }; save(); Limits.check(); }); await sleep(600);
  ok('outside allowed hours → rest', await E(() => curScreen === 'rest' && /время отдыха/.test(document.body.innerText)));
  await E(() => { const d = new Date(Date.now() - 36e5), e = new Date(Date.now() + 36e5), f = x => String(x.getHours()).padStart(2, '0') + ':00'; S.limits = { daily: 0, from: f(d), to: f(e), breaks: false }; save(); Limits.check(); }); await sleep(600);
  ok('inside allowed hours → play', await E(() => curScreen === 'home'));
  /* ---------- перерыв каждые 25 минут ---------- */
  await E(() => { S.limits = { daily: 0, from: null, to: null, breaks: true }; S.limitRun = { sec: 25 * 60 - 20, at: Date.now() }; save(); Limits.tick('casetask', 20); }); await sleep(700);
  ok('25 minutes of play → 5-minute break with countdown', await E(() => curScreen === 'rest' && /Перерыв/.test(document.body.innerText) && /^[45]:\d\d$/.test(document.querySelector('#rcd').textContent)));
  await E(() => { S.limitBrk.until = Date.now() - 1; Limits.check(); }); await sleep(600);
  ok('break over → back to play', await E(() => curScreen === 'home' && !S.limitBrk));
  await E(() => { S.limitRun = { sec: 25 * 60 - 20, at: Date.now() - 6 * 60e3 }; Limits.tick('casetask', 20); }); ok('pause of 5+ min resets the 25-minute run', await E(() => S.limitRun.sec === 20 && !S.limitBrk));
  /* ---------- учёт по разделам ---------- */
  await E(() => { S.use = {}; Limits.tick('casetask', 20); Limits.tick('blitz', 20); Limits.tick('spacetrip', 20); }); await go('subject', 'space'); await E(() => Limits.tick('subject', 20));
  ok('S.use: sections + academy subject', await E(() => { const u = S.use[today()]; return u.case === 20 && u.paws === 20 && u.arcade === 20 && u.academy === 20 && u['a:space'] === 20; }));
  /* ---------- время в разделе для взрослых не считается ---------- */
  await E(() => { S.limits = null; save(); }); await go('parents');
  const t0 = await E(() => Object.values(S.time[today()] || {}).reduce((a, x) => a + x, 0));
  for (let i = 0; i < 5; i++) { await E(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))); await sleep(4500); }
  ok('no time counted in parents section', await E(t0 => Object.values(S.time[today()] || {}).reduce((a, x) => a + x, 0) === t0, t0));
  await go('home'); for (let i = 0; i < 5; i++) { await E(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))); await sleep(4500); }
  ok('time counted while playing', await E(t0 => Object.values(S.time[today()] || {}).reduce((a, x) => a + x, 0) > t0, t0));

  /* ---------- кабинет: время игры ---------- */
  await E(() => { S.limits = { daily: 30, from: null, to: null, breaks: false }; S.time[today()] = { math: 600 }; save(); localStorage.setItem('murlok-parent', JSON.stringify({ token: 'PTOKEN', email: 'mama@test.ru' })); });
  await go('pcab'); await p.waitForSelector('#glim', { timeout: 8000 }).catch(() => { }); await sleep(300);
  ok('cabinet: time card per child with today minutes', await E(() => { const t = document.querySelector('#glim').innerText; return document.querySelectorAll('.lim-kid').length === 2 && /Сегодня: 10 минут из 30/.test(t) && /Сегодня: 7 минут/.test(t); }));
  await E(() => { const k = document.querySelector('.lim-kid[data-k="CKID0000001"]'); k.querySelector('.lim-daily .chip[data-d="45"]').click(); const h = k.querySelector('.lim-hrs'); h.click(); k.querySelector('.lim-from').value = '09:00'; k.querySelector('.lim-to').value = '19:30'; k.querySelector('.lim-brk').click(); k.querySelector('.lim-save').click(); }); await sleep(700);
  const lc = calls.find(c => c.act === 'acc/child/CKID0000001/limits');
  ok('limits saved with parent token', !!lc && lc.auth === 'Bearer PTOKEN' && lc.d.daily === 45 && lc.d.from === '09:00' && lc.d.to === '19:30' && lc.d.breaks === true, JSON.stringify(lc && lc.d));
  ok('same device: applied at once', await E(() => S.limits.daily === 45 && S.limits.breaks === true));
  /* ---------- «Играть самому» ---------- */
  ok('cabinet: «Играть самому» card', await E(() => /Играть самому/.test(document.querySelector('#gplay').textContent) && document.querySelectorAll('#gp-role .chip').length === 4));
  await E(() => { S.pin = '2580'; save(); document.querySelector('#gp-role .chip[data-r="Папа"]').click(); document.querySelector('#gp-cat').value = 'Мурзик'; });
  ok('role chip fills the name', await E(() => document.querySelector('#gp-name').value === 'Папа'));
  await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => { }), E(() => document.querySelector('#gp-go').click())]); await sleep(2500);
  ok('play request with parent token', calls.some(c => c.act === 'acc/play' && c.d.name === 'Папа' && c.d.cat === 'Мурзик' && c.auth === 'Bearer PTOKEN'));
  ok('adult profile opened: own cat + cloud link', await E(() => S.role === 'adult' && S.kid === 'Папа' && S.name === 'Мурзик' && S.cloudCode === 'ADULTC01' && Accounts.linked() && Accounts.child().token === 'ATOKEN'));
  ok('adult PIN copied (lock kept)', await E(() => window.pinOk('2580')));
  ok('device profiles: child kept, adult marked', await E(() => { const P = Extras.profs(); return P.list.some(x => x.id === 'main' && x.kid === 'Кэтика') && P.list.some(x => x.adult && x.kid === 'Папа' && x.id === P.active); }));
  ok('no limits for adult player', await E(() => !Limits.state() && !Limits.rules()));
  await go('board'); await p.waitForSelector('.fm-row', { timeout: 8000 }).catch(() => { }); await sleep(300);
  ok('family board: «взрослый» label', await E(() => { const r = [...document.querySelectorAll('.fm-row')].find(x => /Папа/.test(x.innerText)); return r && !!r.querySelector('.fm-adl'); }));
  await go('chal'); await sleep(600); ok('family challenge reward is for kids', await E(() => /награду за семейный челлендж получают дети/.test(document.body.innerText)));
  await go('friends'); ok('adult: no friends from other families', await E(() => /Друзья — для детей/.test(document.body.innerText)));
  /* ---------- обратно к ребёнку и вход в профиль взрослого только через замок ---------- */
  await E(() => Extras.openProfiles()); await sleep(300);
  ok('profiles modal marks adult', await E(() => /взрослый/.test(document.querySelector('.modal').innerText)));
  await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => { }), E(() => document.querySelector('.modal .prof[data-p="main"]').click())]); await sleep(2500);
  ok('switched back to child (no lock needed)', await E(() => S.kid === 'Кэтика' && S.role !== 'adult' && Accounts.child().token === 'CTOKEN'));
  await go('home'); await E(() => Extras.openProfiles()); await sleep(300);
  await E(() => document.querySelector('.modal .prof[data-adl] small.prof-adl').closest('.prof').click()); await sleep(700);
  ok('child → adult profile asks for PIN', await E(() => curScreen === 'agate' && S.kid === 'Кэтика'));
  await p.type('#pinin', '2580'); await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => { }), E(() => document.querySelector('#pingo').click())]); await sleep(2500);
  ok('PIN → adult profile', await E(() => S.kid === 'Папа' && S.role === 'adult'));
  ok('no errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log('V30L DONE', n, fails ? 'FAILS ' + fails : ''); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('V30L FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
