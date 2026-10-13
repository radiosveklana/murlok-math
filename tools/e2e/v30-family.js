// v30: семья и друзья (сервер подменён): регистрация через взрослого на первом экране, приглашение взрослых в семью,
// семья = друзья, таблица успехов недели, вызовы на одном и том же задании (общее зерно), челленджи, кабинет и отчёт для взрослых
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V30 OK ' : 'V30 FAIL ') + name + (x ? ' ' + x : '')); };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const SAVE = { v: 1, kid: 'Кэтика', name: 'Котофей', fur: 'galaxy', xp: 32130, candies: 500, gems: 9, cases: 13, seenVersion: '28', rankV: 2, login: { last: today(), day: 1 }, lessons: { mul: true, eq: true }, cloudCode: 'KIDCODE1', st: { mul: { done: 400, perfect: 300 }, eq: { done: 100, perfect: 80 }, bug: { done: 10, perfect: 5 }, blitz: { games: 2, best: 12 } } };
const ME = { id: 'CKID0000001', name: 'Кэтика', cat: 'Котофей', fur: 'galaxy', wear: {} }, MISHA = { id: 'CKID0000002', name: 'Миша', cat: 'Барсик', fur: 'ginger', wear: {} }, PETYA = { id: 'CKID0000003', name: 'Петя', cat: 'Рыжик', fur: 'black', wear: {} };
const row = (p, o) => ({ ...p, me: p.id === ME.id, xp: 0, tasks: 0, streak: 0, schulte: { 3: null, 4: null, 5: null }, stars: 0, wins: 0, ...o });
const INCOMING = { id: 'DINCOMING1', game: 'schulte4', gameName: 'Таблица Шульте 4×4', icon: '🔢', topic: '', seed: 424242, created: Date.now(), exp: Date.now() + 6e8, iStarted: false, other: MISHA, mine: null, theirs: { score: 16, time: 31.2, errs: 1 }, done: false, result: null, claimed: false };
const FAM = { id: 'FTEST000001', email: 'mama@test.ru', code: 'FAM123', priorities: [], plan: 'free', created: Date.now(), consent: { ver: '2026-10-09', at: Date.now() }, ref: { code: 'REFP01', visits: 0, regs: 0 }, me: { email: 'mama@test.ru', role: 'owner' },
  adults: [{ id: 'PADULT001', email: 'mama@test.ru', name: '', role: 'owner', joined: Date.now() }, { id: 'PADULT002', email: 'babushka@test.ru', name: 'Бабушка', role: 'adult', joined: Date.now() }], invites: [],
  children: [{ id: ME.id, name: 'Кэтика', cat: 'Котофей', fur: 'galaxy', wear: {}, xp: 32130, cases: 13, minutesWeek: 40, lastSeen: Date.now(), hasPin: true, cloudCode: 'KIDCODE1', ref: { code: 'REFC01', visits: 0, regs: 0 } }] };
const TPL = [{ id: 'solo_streak', kind: 'solo', icon: '🔥', name: '5 дней подряд по 10 задач', metric: 'streak10', goal: 5, days: 7, reward: { candies: 40, gems: 1, badge: '🔥' } }, { id: 'solo_tasks', kind: 'solo', icon: '🧮', name: '100 задач за неделю', metric: 'tasks', goal: 100, days: 7, reward: { candies: 30, gems: 0, badge: '🧮' } }, { id: 'fr_race', kind: 'friends', mode: 'race', icon: '🏁', name: 'Гонка: кто первым решит 100 задач', metric: 'tasks', goal: 100, days: 7, reward: { candies: 25, gems: 0, badge: '🏁' } }];
const FAMCHAL = { id: 'HFAMCHAL01', tpl: 'fam_tasks', kind: 'family', mode: '', icon: '👨‍👩‍👧', name: '500 задач семьёй за неделю', goal: 500, metric: 'tasks', start: today(), end: today(), daysLeft: 3, progress: 520, members: [{ ...ME, me: true, value: 400 }, { ...MISHA, value: 120 }], complete: true, ended: false, reward: { candies: 40, gems: 1, badge: '🏡' }, claimable: true, claimed: false };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const calls = []; let chalClaimed = false;
  const handler = r => {
    const u = r.url(), H = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization' };
    if (r.method() === 'OPTIONS' && /murlok-api|tech-wave\.ru\/api/.test(u)) return r.respond({ status: 204, headers: { ...H, 'access-control-allow-methods': 'GET,POST,OPTIONS' } });
    const m = u.match(/(?:murlok-api|tech-wave\.ru\/api)\/(acc\/[A-Za-z0-9\/]+|save|load|tts|chat|friend\/\w+)/); if (!m) return r.continue();
    const act = m[1], d = JSON.parse(r.postData() || '{}'); calls.push({ act, d, auth: r.headers().authorization || '' });
    const J = (o, st = 200) => r.respond({ status: st, contentType: 'application/json', headers: H, body: JSON.stringify(o) });
    if (act === 'acc/start') return J({ ok: true, isNew: true, invite: d.email === 'babushka@test.ru' ? { by: 'mama@test.ru' } : null });
    if (act === 'acc/family') return J({ family: FAM });
    if (act === 'acc/child/me') return J({ name: 'Кэтика', priorities: [], survey: { like: [] }, cloudCode: 'KIDCODE1' });
    if (act === 'acc/pending') return J({ items: [] });
    if (act === 'acc/social/news') return J({ incoming: [INCOMING], unclaimedDuels: 0, claimableChals: 1 });
    if (act === 'acc/social/people') return J({ family: [MISHA], friends: [PETYA] });
    if (act === 'acc/social/board') return J({ from: today(), to: today(), family: [row(ME, { xp: 900, tasks: 120, streak: 4, place: 1, schulte: { 3: null, 4: 22.5, 5: null }, stars: 12 }), row(MISHA, { xp: 300, tasks: 40, place: 2 })], friends: [row(ME, { xp: 900, place: 1 }), row(PETYA, { xp: 100, place: 2 })] });
    if (act === 'acc/duel/list') return J({ incoming: [INCOMING], waiting: [], done: [{ ...INCOMING, id: 'DDONE00001', mine: { score: 16, time: 25, errs: 0 }, done: true, result: 'win', claimed: true }], unclaimed: 0 });
    if (act === 'acc/duel/new') return J({ duel: { ...INCOMING, id: 'DNEW000001', game: d.game, topic: d.topic || '', seed: 777, iStarted: true, other: d.to === PETYA.id ? PETYA : MISHA, theirs: null } });
    let dm = act.match(/^acc\/duel\/(D[A-Z0-9]+)\/(result|claim)$/);
    if (dm && dm[2] === 'result') return J({ duel: dm[1] === 'DINCOMING1' ? { ...INCOMING, mine: { score: 16, time: d.time, errs: d.errs }, done: true, result: 'win' } : { ...INCOMING, id: dm[1], game: 'paws', mine: d, theirs: null, iStarted: true } });
    if (dm && dm[2] === 'claim') return J({ candies: 15 });
    if (act === 'acc/chal/list') return J({ templates: TPL, active: chalClaimed ? [] : [FAMCHAL], past: [], claimable: chalClaimed ? 0 : 1 });
    if (act === 'acc/chal/start') return J({ chal: { ...FAMCHAL, id: 'HSOLO00001', tpl: d.tpl, kind: 'solo', complete: false, claimable: false } });
    if (/^acc\/chal\/H[A-Z0-9]+\/claim$/.test(act)) { chalClaimed = true; return J({ candies: 40, gems: 1, badge: '🏡', name: FAMCHAL.name }); }
    if (act === 'acc/fam/social') return J({ board: { from: today(), to: today(), rows: [row(ME, { xp: 900, tasks: 120, place: 1 }), row(MISHA, { xp: 300, place: 2 })] }, chals: [{ ...FAMCHAL, by: 'parent' }], duelsWeek: 3, templates: [{ id: 'fam_tasks', kind: 'family', icon: '👨‍👩‍👧', name: '500 задач семьёй за неделю', reward: { candies: 40, gems: 1, badge: '🏡' } }, { id: 'fam_days', kind: 'family', icon: '📅', name: 'Неделя без пропусков', reward: { candies: 30, gems: 1, badge: '📅' } }] });
    if (act === 'acc/fam/friends' && r.method() === 'GET') return J({ kids: [{ id: ME.id, name: 'Кэтика', friends: [], requests: [{ pub: 'PUBPET', cat: 'Рыжик', kid: 'Петя' }], waiting: [] }] });
    if (act === 'friend/list') return J({ me: 'MYPUB1', friends: [{ pub: 'PUBMSH', cat: 'Барсик', kid: 'Миша', fur: 'ginger', wear: {}, family: true, seen: Date.now() }, { pub: 'PUBPET', cat: 'Рыжик', kid: 'Петя', fur: 'black', wear: {}, seen: Date.now() }], pending: [{ pub: 'PUBLIZ', cat: 'Мурка', kid: 'Лиза', wait: 'parent' }], incoming: [], inbox: [], unread: 0, gifts: [], phrases: [] });
    if (act === 'load') return J(SAVE);
    return J({ ok: true });
  };
  const page = async () => { const ctx = await b.createBrowserContext(), p = await ctx.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
    await p.setBypassServiceWorker(true); await p.setRequestInterception(true); p.on('request', handler); return p; };

  /* ---------- новое устройство: первым делом — взрослый и семейный код ---------- */
  const q = await page(); await q.goto(URL); await q.waitForSelector('#kid');
  const E2 = (f, ...a) => q.evaluate(f, ...a);
  // первый экран в два шага: три дороги, «Просто поиграть» открывает знакомство (?choose=1 — показать шаг 1 и под автотестом)
  await q.goto(URL + '?choose=1'); await sleep(1200);
  ok('fresh hello: three roads, adult first', await E2(() => { const r = [...document.querySelectorAll('.hl-roads .road')].map(b => b.id); return r.join() === 'aparent,achild,atry' && document.querySelector('#kid').offsetParent === null; }));
  await E2(() => document.querySelector('#atry').click()); await sleep(300);
  ok('try without registration opens the form', await E2(() => document.querySelector('#kid').offsetParent !== null && !document.querySelector('.hello').classList.contains('choose')));
  await q.type('#kid', 'Тося'); await q.type('#nm', 'Пушок'); await E2(() => document.querySelector('#start').click()); await sleep(1500);
  ok('local play still works', await E2(() => S.kid === 'Тося' && curScreen === 'home'));
  await E2(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); go('home'); }); await sleep(600);
  ok('unlinked kid: nudge to ask an adult', await E2(() => /Позвать взрослого/.test((document.querySelector('.acc-nudge') || {}).innerText || '')));
  await E2(() => go('board')); await sleep(500); ok('board locked without family cabinet', await E2(() => /Вместе со взрослым/.test(document.body.innerText)));
  await E2(() => { award(0, 50); }); ok('daily XP tracked', await E2(() => S.daily[today()].x === 50));
  /* приглашённый взрослый: другое согласие */
  await E2(() => go('pauth')); await sleep(400); await q.type('#aem', 'babushka@test.ru'); await E2(() => document.querySelector('#asend').click()); await sleep(700);
  ok('invited adult: invitation shown, consent for self', await E2(() => /Приглашение в семейный кабинет от mama@test.ru/.test(document.body.innerText) && /член семьи ребёнка/.test(document.querySelector('#acons').innerText)));

  /* ---------- ребёнок из кабинета семьи ---------- */
  const p = await page(); await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(s => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), s))); localStorage.setItem('murlok-acc:murlok-detective-v1', JSON.stringify({ token: 'CTOKEN', childId: 'CKID0000001', familyCode: 'FAM123', name: 'Кэтика' })); }, SAVE);
  await p.goto(URL); await sleep(1800);
  const E = (f, ...a) => p.evaluate(f, ...a), go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(800); };
  const click = async s => { await p.waitForSelector(s, { timeout: 8000 }); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); try { await p.click(s); } catch (e) { await E(s => document.querySelector(s).click(), s); } await sleep(400); };
  ok('child linked', await E(() => Accounts.linked() && S.kid === 'Кэтика'));
  await go('home');
  ok('home: «Успехи и вызовы» tile in friends section', await E(() => !!document.querySelector('.hs-social .tile[data-go="board"]')));
  let got = false; for (let t = 0; t < 14 && !got; t++) { await sleep(1000); got = await E(() => !!document.querySelector('.modal #dacc')); if (!got) await E(() => document.querySelectorAll('.modal').forEach(m => { if (!m.querySelector('#dacc')) m.remove(); })); }
  ok('incoming duel modal on home', got && await E(() => /Миша бросил/.test(document.querySelector('.modal').innerText)));
  ok('badge counts news', await E(() => { const b = document.querySelector('#fmbadge'); return b && !b.hidden && b.textContent === '2'; }));
  /* ---------- принять вызов: Шульте 4×4 с общим зерном ---------- */
  await click('#dacc'); await sleep(500); ok('duel screen opens with rival result', await E(() => curScreen === 'duelplay' && /31.2 с/.test(document.body.innerText)));
  await click('#dgo');
  ok('same seed → same grid for both players', await E(() => JSON.stringify([...document.querySelectorAll('.schulte .sc')].map(b => +b.dataset.v)) === JSON.stringify(Family.withSeed(424242, () => shuffle(Array.from({ length: 16 }, (_, i) => i + 1))))));
  ok('withSeed restores Math.random', await E(() => { const r = Math.random; Family.withSeed(5, () => 0); return Math.random === r; }));
  const c0 = await E(() => S.candies);
  for (let v = 1; v <= 16; v++) await E(v => document.querySelector(`.schulte .sc[data-v="${v}"]`).click(), v);
  await sleep(1500);
  const res = calls.find(c => c.act === 'acc/duel/DINCOMING1/result');
  ok('result sent with child token', !!res && res.auth === 'Bearer CTOKEN' && res.d.errs === 0 && res.d.time >= 0);
  ok('result screen shows win and both results', await E(() => /Победа/.test(document.body.innerText) && /31.2 с/.test(document.body.innerText)));
  ok('winner candies claimed', calls.some(c => c.act === 'acc/duel/DINCOMING1/claim') && await E(c0 => S.candies === c0 + 15, c0));
  /* ---------- таблица успехов ---------- */
  await go('board'); await p.waitForSelector('.fm-row', { timeout: 8000 }).catch(() => { }); await sleep(300);
  ok('weekly family board', await E(() => document.querySelectorAll('.fm-row').length === 2 && document.querySelector('.fm-row.me') && /900/.test(document.querySelector('.fm-row.me').innerText) && /4×4: 22.5 с/.test(document.body.innerText)));
  ok('board privacy: no codes or emails', await E(() => !/KIDCODE|@/.test(document.querySelector('#fmp').innerText)));
  await click('.fm-scope button[data-s="friends"]'); await sleep(500); ok('friends board', await E(() => /Петя/.test(document.querySelector('.fm-board').innerText)));
  /* ---------- бросить вызов: Быстрые лапки ---------- */
  await click('[data-duel="CKID0000003"]'); await click('.modal [data-g="paws"]'); await sleep(800);
  ok('duel created', calls.some(c => c.act === 'acc/duel/new' && c.d.to === 'CKID0000003' && c.d.game === 'paws') && await E(() => curScreen === 'duelplay'));
  await click('#dgo'); const first = await E(() => document.querySelector('#q').textContent);
  ok('paws questions come from the seed', await E(f => { const L = Family.pawsList(777); return f.startsWith(L[0][0] + ' × ' + L[0][1]); }, first), first);
  for (let i = 0; i < 3; i++) { const t = await E(() => document.querySelector('#q').textContent.split('=')[0]); const [a, c] = t.split('×').map(x => +x.trim()); for (const ch of String(a * c)) await p.keyboard.press(ch); await sleep(120); }
  await E(() => { const d0 = Date.now; Date.now = () => d0() + 61000; }); await sleep(800);
  const r2 = calls.find(c => c.act === 'acc/duel/DNEW000001/result'); ok('paws result: 3 correct', !!r2 && r2.d.score === 3, JSON.stringify(r2 && r2.d));
  ok('challenger sees «sent» screen', await E(() => /Вызов отправлен/.test(document.body.innerText)));
  await E(() => { Date.now = Date.prototype.constructor.now; });
  await p.reload(); await sleep(1500);
  /* ---------- блиц по теме: одинаковые задания у обоих ---------- */
  ok('topic questions deterministic by seed', await E(() => { const u = Family.topicQs((window.SUBJECTS.math4.units.find(x => x.gen) || {}).id, 99); return u.length === 10 && JSON.stringify(u) === JSON.stringify(Family.topicQs(u && window.SUBJECTS.math4.units.find(x => x.gen).id, 99)); }));
  /* ---------- вызовы: список ---------- */
  await go('duels'); await sleep(500);
  ok('duels tab: incoming + history + people', await E(() => !!document.querySelector('[data-play="DINCOMING1"]') && /История вызовов/.test(document.body.innerText) && document.querySelectorAll('.fm-person').length === 2));
  /* ---------- челленджи ---------- */
  await go('chal'); await sleep(500);
  ok('family challenge with members', await E(() => /500 задач семьёй/.test(document.body.innerText) && /Миша: 120/.test(document.body.innerText)));
  const cc = await E(() => S.candies); await click('[data-claim="HFAMCHAL01"]'); await sleep(600);
  ok('challenge reward + badge', await E(cc => S.candies === cc + 40 && (S.chalBadges || []).some(b => b.b === '🏡'), cc));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove())); await click('[data-solo="solo_tasks"]'); await sleep(500);
  ok('start solo challenge', calls.some(c => c.act === 'acc/chal/start' && c.d.tpl === 'solo_tasks'));
  await click('[data-fr="fr_race"]'); await click('.modal [data-p="CKID0000002"]'); await click('#frgo'); await sleep(400);
  ok('start race with family member', calls.some(c => c.act === 'acc/chal/start' && c.d.tpl === 'fr_race' && c.d.with.join() === 'CKID0000002'));
  await go('diplomas', 'collection'); /* v31: значки челленджей — во вкладке «Коллекция» */ ok('challenge badges in «Мои награды»', await E(() => /Значки челленджей/.test(document.body.innerText)));
  /* ---------- друзья: семья без кодов ---------- */
  await go('friends'); await sleep(800);
  ok('family friend marked, cannot be removed', await E(() => { const c = [...document.querySelectorAll('.fr-card')].find(x => /Барсик/.test(x.innerText)); return c && /семья/.test(c.innerText) && !c.querySelector('[data-del]'); }));
  ok('other-family friend removable', await E(() => { const c = [...document.querySelectorAll('.fr-card')].find(x => /Рыжик/.test(x.innerText)); return c && !!c.querySelector('[data-del]'); }));
  ok('waiting for adults shown', await E(() => /Ждём разрешения взрослых/.test(document.body.innerText)));
  ok('friends → board link', !!(await p.$('#fr-board')));
  await go('schulte', 4); ok('schulte: challenge a friend', !!(await p.$('#sch-duel')));
  /* ---------- кабинет взрослого ---------- */
  await E(() => localStorage.setItem('murlok-parent', JSON.stringify({ token: 'PTOKEN', email: 'mama@test.ru' })));
  await go('pcab'); await sleep(1200);
  ok('cabinet: adults of the family', await E(() => { const t = document.querySelector('#fadults').textContent; return /mama@test.ru/.test(t) && /Бабушка/.test(t) && !!document.querySelector('[data-arm="PADULT002"]'); }));
  await E(() => document.querySelectorAll('#app details').forEach(d => { d.open = true; })); await p.type('#iemail', 'papa2@test.ru'); await click('#irole .chip[data-r="Дедушка"]'); await click('#iadd'); await sleep(500);
  ok('invite adult sent', calls.some(c => c.act === 'acc/fam/invite' && c.d.email === 'papa2@test.ru' && c.d.kin === 'Дедушка' && c.auth === 'Bearer PTOKEN'));
  await go('pcab'); await sleep(1500);
  ok('cabinet: weekly table + challenges', await E(() => document.querySelectorAll('#pcab-social .fm-tbl tr').length === 3 && /500 задач семьёй/.test(document.querySelector('#pcab-social').innerText)));
  await E(() => document.querySelectorAll('#app details').forEach(d => { d.open = true; })); await click('[data-cadd="fam_days"]'); await sleep(300); ok('parent creates family challenge', calls.some(c => c.act === 'acc/fam/chal' && c.d.tpl === 'fam_days'));
  await sleep(800); await click('[data-fok="CKID0000001|PUBPET"]'); ok('parent approves friend', calls.some(c => c.act === 'acc/fam/friends' && c.d.ok === true && c.d.pub === 'PUBPET'));
  await click('[data-arm="PADULT002"]'); await click('#armgo'); ok('owner removes invited adult', calls.some(c => c.act === 'acc/fam/adult/PADULT002/remove'));
  await go('parents'); await sleep(1500); await E(() => window.UX && UX.showAll());
  ok('parents report: family, table, challenges', await E(() => { const t = (document.querySelector('#fmrep') || {}).innerText || ''; return /Бабушка/.test(t) && /Миша/.test(t) && /500 задач семьёй/.test(t); }));
  ok('no errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log('V30 DONE', n, fails ? 'FAILS ' + fails : ''); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('V30 FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
