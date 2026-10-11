// v31: «Мои награды» — 120+ значков в 4 уровнях, выдача задним числом с одним окном, больше дипломов (закрытые — с прогрессом),
// вкладки «Значки · Дипломы · Дела · Коллекция», «Почти получены», карточка значка, лента дел (по месяцам, по 20, без вылезания на 320 px),
// праздник не чаще раза за экран, строка «Новые значки за неделю» в отчёте для взрослых.
const puppeteer = require('puppeteer-core');
try { require('fs').mkdirSync(__dirname + '/shots', { recursive: true }); } catch (e) { }
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V31 OK ' : 'V31 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.setBypassServiceWorker(true); await p.setRequestInterception(true);
  p.on('request', r => { if (/murlok-api|\/api\//.test(r.url())) return r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }); r.continue(); });
  const shot = async nm => { await sleep(300); await p.screenshot({ path: __dirname + `/shots/v31-${nm}.png` }); };
  await p.goto(URL); await p.waitForSelector('#kid');
  // «старое» сохранение: 13 из 15 старых значков, 45 дел в журнале старого формата (без ci/времени), прогресс по разделам
  await p.evaluate(() => {
    const d = new Date(), key = k => { const x = new Date(d); x.setDate(x.getDate() - k); return dkey(x); }, days = {}; for (let k = 0; k < 40; k++) if (k % 9 !== 8) days[key(k)] = 3 + (k % 4);
    const titles = E.CRIMES.map(c => c.title), A = E.ANIMALS, log = []; for (let i = 0; i < 45; i++) log.push({ n: 45 - i, title: titles[i % titles.length] + (i === 3 ? ' — очень-очень длинное название дела про пропавшие пирожные с кремом' : ''), who: A[i % A.length].join(' '), date: key(i * 2), perfect: i % 3 === 0 });
    const s = Object.assign(fresh(), { name: 'Мурзик', kid: 'Аня', seenVersion: APP_VERSION, rankV: 2, xp: 9000, candies: 300, totalCandies: 1500, gems: 10, gemsTotal: 40, lessons: { mul: true, eq: true },
      badges: ['case1', 'case5', 'case15', 'clean', 'mul10', 'mul40', 'eq10', 'eq40', 'bug10', 'blitz20', 'streak3', 'streak7', 'sweet100'], cases: 45, casesPerfect: 15, caseLog: log, days,
      st: { mul: { done: 120, perfect: 70 }, eq: { done: 60, perfect: 30 }, bug: { done: 35, perfect: 20 }, blitz: { games: 30, best: 24 }, div: { done: 12, perfect: 6 }, add: { done: 8, perfect: 8 } },
      read: { wpm: [{ d: key(3), t: 'x', wpm: 88, comp: 80 }], schulte: { 3: 12, 4: 33 }, flash: 4 }, drillBest: { div: 14, round: 9 }, gameBest: { scales: 9, memo: 5 },
      acad: { space: { read: { [SUBJECTS.space.units[0].id]: 1, [SUBJECTS.space.units[1].id]: 1, [SUBJECTS.space.units[2].id]: 1 }, best: { [SUBJECTS.space.units[0].id]: 3, [SUBJECTS.space.units[1].id]: 2 }, box: {} }, math4: { read: {}, best: { [SUBJECTS.math4.units[0].id]: 3, [SUBJECTS.math4.units[1].id]: 1 }, box: {} } },
      hours: Array.from({ length: 24 }, (_, h) => h === 7 ? 3 : h === 12 ? 11 : 2), starsSeen: ['ursa_major', 'orion', 'Cen', 'Ant', 'Lyr', 'Cyg', 'Aql', 'Leo', 'Sco', 'Tau', 'Gem'],
      trip: { done: {}, ar: { done: { mercury: 1, venus: 1 }, best: {}, used: 0, base: 0, flights: 2 } }, owned: ['deer', 'loupe', 'bow', 'crown', 'scarf1'], furn: ['a', 'b', 'c', 'd', 'e', 'f'] });
    localStorage.setItem('murlok-detective-v1', JSON.stringify(s)); localStorage.setItem('murlok-awards-e2e', '1');
  });
  await p.goto(URL); await sleep(1800);
  const E = (f, ...a) => p.evaluate(f, ...a), clean = () => E(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove()));
  const go = async (s, a) => { await clean(); await E((s, a) => go(s, a), s, a); await sleep(500); };
  const noOverflow = () => E(() => { const W = document.documentElement.clientWidth, bad = [...document.querySelectorAll('#app *')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > W + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed' && !el.closest('[hidden]'); }); return { ok: document.documentElement.scrollWidth <= W + 1 && !bad.length, n: bad.length, ex: bad.slice(0, 3).map(e => e.className || e.tagName).join(',') }; });

  /* ---------- 1. каталог ---------- */
  const C = await E(() => { const L = Medals.list(); return { n: L.length, tiers: [...new Set(L.map(b => b.t))].sort().join(''), areas: [...new Set(L.map(b => b.a))].length, ids: new Set(L.map(b => b.id)).size, okFields: L.every(b => b.i && b.n && b.d && b.need > 0 && typeof b.c === 'function') }; });
  ok('120+ badges', C.n >= 120, 'count ' + C.n);
  ok('4 tiers', C.tiers === 'bgls', C.tiers);
  ok('15 areas covered', C.areas === 15, 'areas ' + C.areas);
  ok('unique ids', C.ids === C.n);
  ok('icon/name/how/need on every badge', C.okFields);
  ok('per-topic badges for every 4th-grade topic', await E(() => SUBJECTS.math4.units.every(u => Medals.list().some(b => b.id === 'm4f:' + u.id) && Medals.list().some(b => b.id === 'm4s:' + u.id))));
  ok('per-subject Academy badges (no teen)', await E(() => ['space', 'safety', 'think', 'read', 'talk', 'world', 'body', 'health', 'creative', 'stories', 'obzh'].every(id => ['ac1:', 'ac2:', 'ac3:'].every(pf => Medals.list().some(b => b.id === pf + id))) && !Medals.list().some(b => /teen/.test(b.id))));
  ok('per-game badges', await E(() => GAMES.every(g => Medals.list().some(b => b.id === 'gm1:' + g.id))));

  /* ---------- 2. задним числом: старые значки сохранены, новые выданы, одно окно ---------- */
  const R = await E(() => ({ kept: ['case1', 'case5', 'case15', 'clean', 'mul10', 'mul40', 'eq10', 'eq40', 'bug10', 'blitz20', 'streak3', 'streak7', 'sweet100'].every(id => S.badges.includes(id)), n: S.badges.length, v: S.bx.v, retro: (S.bx.retro || []).length, dates: S.badges.every(id => !Medals.list().some(b => b.id === id) || ['case1'].includes(id) || S.badgeAt[id]) }));
  ok('legacy badges stay earned', R.kept);
  ok('retro badges granted from progress', R.n >= 40 && R.retro >= 25, `total ${R.n}, retro ${R.retro}`);
  ok('v31 flag set', R.v === 31);
  ok('specific retro badges', await E(() => ['case25', 'who10', 'who25', 'blitz10', 'sch3', 'flash4', 'early1', 'lunch10', 'm4f:' + SUBJECTS.math4.units[0].id, 'm4s:' + SUBJECTS.math4.units[0].id, 'ac1:space', 'pl1', 'con10', 'furn5', 'days10', 'sweet1000'].every(id => S.badges.includes(id))));
  ok('not over-granted', await E(() => !['case50', 'blitz30', 'streak100', 'pl8', 'con30', 'ch1', 'sch4', 'wpm100'].some(id => S.badges.includes(id))));
  ok('retro diplomas granted', await E(() => ['cases10', 'cases25', 'top:mul', 'm4:' + SUBJECTS.math4.units[0].id].every(id => (S.diplomas || []).some(d => d.id === id))));
  await sleep(1200);
  ok('one celebratory modal on home', await E(() => document.querySelectorAll('.modal').length === 1 && !!document.querySelector('.modal .aw-retro') && /новые награды/.test(document.querySelector('.modal').innerText)));
  await shot('01-retro-modal');
  await E(() => document.querySelector('#awGo').click()); await sleep(600);
  ok('modal leads to awards / badges tab', await E(() => curScreen === 'diplomas' && !document.querySelector('.aw-pane[data-p="badges"]').hidden));
  ok('summary shown once', await E(() => !S.bx.sum)); await go('home'); await sleep(1600);
  ok('no second retro modal', await E(() => !document.querySelector('.modal .aw-retro')));
  ok('home tile shows counts', await E(() => /🎖️ \d+\/\d+ · 📜 \d+/.test(document.querySelector('.t-diploma small').textContent)));

  /* ---------- 3. «Мои награды»: значки ---------- */
  await go('diplomas', 'badges');
  ok('4 tabs', await E(() => [...document.querySelectorAll('.aw-tabs button')].map(b => b.innerText.replace(/\s+/g, ' ').trim()).join('|') === '🎖️ Значки|📜 Дипломы|📁 Дела|🧸 Коллекция'));
  ok('progress header «Собрано N из M»', await E(() => new RegExp('Собрано ' + Medals.list().filter(b => S.badges.includes(b.id)).length + ' из ' + Medals.list().length).test(document.querySelector('.aw-pane[data-p="badges"]').innerText)));
  ok('v22 compat: badge grid + «Раскрытые дела» visible', await E(() => !!document.querySelector('.badge-grid') && /Раскрытые дела/.test(document.body.innerText)));
  const near = await E(() => [...document.querySelectorAll('.aw-pane[data-p="badges"] .bdg')].map(c => { const b = Medals.list().find(x => x.id === c.dataset.b); return Math.min(1, b.c() / b.need); }));
  ok('«Почти получены» sorted closest first', near.length >= 10 && near.every((q, i) => i === 0 || q <= near[i - 1] + 1e-9) && near.every(q => q < 1), `n ${near.length}, first ${near[0] && near[0].toFixed(2)}`);
  ok('progress bar + «x / y» on locked cards', await E(() => { const c = document.querySelector('.aw-pane[data-p="badges"] .bdg:not(.on)'); return !!c.querySelector('.aw-bar i') && /\d+ \/ \d+|\d+%|рекорд/i.test(c.innerText); }));
  ok('tier colour on cards', await E(() => [...document.querySelectorAll('.bdg')].every(c => /#/.test(c.style.getPropertyValue('--tc')))));
  await shot('02-badges-near');
  await E(() => document.querySelector('.aw-pane[data-p="badges"] .bdg').click()); await sleep(300);
  ok('badge detail sheet: how-to + progress + go button', await E(() => { const m = document.querySelector('.modal .aw-det'); return !!m && /Как получить/.test(m.innerText) && /осталось/.test(m.innerText) && !!m.querySelector('.aw-bar') && !!document.querySelector('#awTo'); }));
  await shot('03-badge-detail');
  await clean(); await E(() => document.querySelector('.aw-flt [data-f="area"]').click()); await sleep(300);
  ok('groups by area (collapsible)', await E(() => document.querySelectorAll('.aw-blist .aw-grp').length === 15 && [...document.querySelectorAll('.aw-blist .aw-grp')].every(d => !d.open)));
  await E(() => { const d = document.querySelector('.aw-grp[data-g="cases"]'); d.open = true; d.dispatchEvent(new Event('toggle')); }); await sleep(200);
  ok('open group shows earned date', await E(() => /✓ \d\d\.\d\d\.\d{4}/.test(document.querySelector('.aw-grp[data-g="cases"]').innerText)));
  await shot('04-badges-areas');
  await E(() => document.querySelector('.aw-grp[data-g="cases"] .bdg.on[data-b="case25"]').click()); await sleep(300);
  ok('earned badge detail shows date', await E(() => /Получен \d\d\.\d\d\.\d{4}/.test(document.querySelector('.modal .aw-det').innerText)));
  await clean();
  await E(() => { const d = document.querySelector('.aw-grp[data-g="secret"]'); d.open = true; }); await sleep(100);
  ok('secret badges hidden until earned', await E(() => /Секретный значок/.test(document.querySelector('.aw-grp[data-g="secret"]').innerText) && !/Шоколадная фабрика/.test(document.querySelector('.aw-grp[data-g="secret"]').innerText)));
  await E(() => document.querySelector('.aw-flt [data-f="got"]').click()); await sleep(200);
  ok('«Мои» = earned only', await E(() => document.querySelectorAll('.aw-blist .bdg').length === Medals.list().filter(b => S.badges.includes(b.id)).length && !document.querySelector('.aw-blist .bdg:not(.on)')));

  /* ---------- 4. дипломы ---------- */
  await E(() => document.querySelector('.aw-tabs [data-aw="diplomas"]').click()); await sleep(300);
  ok('diplomas tab: earned grid', await E(() => document.querySelectorAll('.aw-pane[data-p="diplomas"] .dp').length === S.diplomas.length && S.diplomas.length >= 8), 'n ' + (await E(() => S.diplomas.length)));
  ok('many diploma rules', await E(() => Diplomas.rules().length >= 80), 'rules ' + (await E(() => Diplomas.rules().length)));
  ok('locked diplomas show what is needed + progress', await E(() => { const r = document.querySelector('.aw-pane[data-p="diplomas"] .dp-n'); return !!r && /Нужно:/.test(r.innerText) && !!r.querySelector('.aw-bar') && /\d+ \/ \d+/.test(r.innerText); }));
  ok('diploma kinds present', await E(() => { const R = Diplomas.rules().map(r => r.id); return ['sp25:space', 'sp75:obzh', 'top:div', 'cosmo', 'fam3', 'read150', 'cases200', 'bdg50'].every(id => R.includes(id)) && R.some(id => /^week:/.test(id)) && R.some(id => /^m4:/.test(id)); }));
  ok('weekly diploma retro (5 days a week)', await E(() => S.diplomas.some(d => /^week:/.test(d.id))));
  ok('gender: «прошла», not «прошёла»', await E(() => !/прошёла/.test(document.body.innerText)));
  await shot('05-diplomas');
  await E(() => document.querySelector('.aw-pane[data-p="diplomas"] .dp').click()); await p.waitForSelector('.ph-big', { timeout: 8000 }).catch(() => { });
  ok('diploma share still works', (await E(() => window.__lastDiploma || 0)) > 50000 && !!(await p.$('#pshare')));
  await clean();

  /* ---------- 5. лента дел ---------- */
  await go('diplomas', 'cases');
  ok('cases feed: 20 cards first', await E(() => document.querySelectorAll('.cs-card').length === 20));
  ok('grouped by month', await E(() => document.querySelectorAll('.cs-month').length >= 2 && /^(Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь) \d{4}$/.test(document.querySelector('.cs-month').textContent)));
  ok('card: number, title, scene thumb, culprit, date, stars', await E(() => { const c = document.querySelector('.cs-card'); return /№45/.test(c.innerText) && /img\/scene\/\d+\.jpg/.test(c.querySelector('.cs-img').getAttribute('src')) && /Вор:/.test(c.innerText) && !!c.querySelector('.cs-av') && /📅 \d\d\.\d\d/.test(c.innerText) && /★★★/.test(c.innerText) && /без ошибок/.test(c.innerText); }));
  await E(() => document.querySelector('#csMore').click()); await sleep(300);
  ok('«Показать ещё» → 40', await E(() => document.querySelectorAll('.cs-card').length === 40));
  await E(() => document.querySelector('#csMore').click()); await sleep(300);
  ok('all 45, no more button', await E(() => document.querySelectorAll('.cs-card').length === 45 && !document.querySelector('#csMore')));
  const o1 = await noOverflow(); ok('no overflow at 390', o1.ok, JSON.stringify(o1));
  await shot('06-cases-390');
  await p.setViewport({ width: 320, height: 640, isMobile: true, hasTouch: true }); await go('diplomas', 'cases'); await sleep(300);
  const o2 = await noOverflow(); ok('no overflow at 320 (cases)', o2.ok, JSON.stringify(o2));
  ok('cards do not overlap', await E(() => { const r = [...document.querySelectorAll('.cs-card')].map(c => c.getBoundingClientRect()); return r.every((x, i) => i === 0 || x.top >= r[i - 1].bottom - 1 || x.left >= r[i - 1].right - 1); }));
  await shot('07-cases-320');
  await E(() => document.querySelector('.aw-tabs [data-aw="badges"]').click()); await E(() => document.querySelector('.aw-flt [data-f="near"]').click()); await sleep(300);
  const o3 = await noOverflow(); ok('no overflow at 320 (badges)', o3.ok, JSON.stringify(o3)); await shot('08-badges-320');
  await E(() => document.querySelector('.aw-tabs [data-aw="diplomas"]').click()); await sleep(200);
  const o4 = await noOverflow(); ok('no overflow at 320 (diplomas)', o4.ok, JSON.stringify(o4));
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  /* ---------- 6. коллекция ---------- */
  await go('diplomas', 'collection');
  ok('collection: tiles + space stickers moved in', await E(() => { const pn = document.querySelector('.aw-pane[data-p="collection"]'); return !pn.hidden && pn.querySelectorAll('.aw-ct').length >= 6 && /Космические наклейки \(2\/8\)/.test(pn.innerText) && !!document.querySelector('.aw-foot [data-go="book"]'); }));
  await shot('09-collection');

  /* ---------- 7. живые награды: не чаще раза за экран ---------- */
  await go('school'); await sleep(300);
  await E(() => { window.__t = 0; const t0 = window.toast; window.toast = function (h) { if (/Нов(ый|ые) знач/.test(h)) window.__t++; return t0.apply(this, arguments); }; S.st.eq.done = 199; S.st.mul.done = 199; });
  await E(() => { S.st.eq.done = 200; award(1, 1); }); await p.waitForFunction(() => S.badges.includes('eq200'), { timeout: 5000 }).catch(() => { }); await sleep(1000);
  ok('new badge → toast', await E(() => window.__t === 1 && S.badges.includes('eq200') && !!S.badgeAt.eq200));
  await E(() => { S.st.mul.done = 200; award(1, 1); }); await p.waitForFunction(() => S.badges.includes('mul200'), { timeout: 5000 }).catch(() => { }); await sleep(1000);
  ok('second badge on same screen → no second toast', await E(() => window.__t === 1 && S.badges.includes('mul200')));
  await E(() => go('games')); await sleep(1800);
  ok('pending badge celebrated on next screen', await E(() => window.__t === 2));

  /* ---------- 8. новые дела пишутся в ленту с картинкой и временем; журнал больше 60 ---------- */
  await clean(); await E(() => { startCase('mul', 1); }); await sleep(500); await E(() => { CASE.mistakes = 0; closeCase(); }); await sleep(600);
  ok('closed case logged with scene + time', await E(() => S.caseLog[0].ci != null && S.caseLog[0].sec >= 0 && S.caseLog[0].m === 0 && S.caseLog.length === 46));
  await E(() => { for (let i = 0; i < 20; i++) { startCase('mul', 1); CASE.mistakes = 1; closeCase(); } }); await sleep(300);
  ok('case log keeps more than 60', await E(() => S.caseLog.length === 66));
  /* ---------- 9. тетрадь и серия без ошибок ---------- */
  await E(() => { curScreen = 'paper'; taskDone('mul', { mistakes: 0 }); curScreen = 'home'; for (let i = 0; i < 5; i++) taskDone('mul', { mistakes: 0 }); }); await p.waitForFunction(() => S.badges.includes('paper1') && S.badges.includes('run5'), { timeout: 5000 }).catch(() => { });
  ok('«Проверь мою тетрадь» counted + run of 5', await E(() => S.bx.paper === 1 && S.bx.bestRun >= 5 && S.badges.includes('paper1') && S.badges.includes('run5')), await E(() => JSON.stringify(S.bx).slice(0, 200) + ' P1=' + S.badges.includes('paper1') + ' R5=' + S.badges.includes('run5') + ' c=' + Medals.list().find(b => b.id === 'paper1').c()));
  /* ---------- 10. отчёт для взрослых ---------- */
  ok('week line excludes retro badges', await E(() => { const t = Medals.weekLine(); const m = /Новые значки за неделю: <b>(\d+)<\/b>/.exec(t); return m && +m[1] >= 3 && +m[1] < 20; }), await E(() => Medals.weekLine().slice(0, 80)));
  await go('parents'); await sleep(1500);
  ok('parents report: new badges this week line', await E(() => /Новые значки за неделю/.test((document.querySelector('.coach-rep') || {}).innerText || '')));
  ok('no kid celebration toast in adult section', await E(() => !/Нов(ый|ые) знач/.test([...document.querySelectorAll('.toast')].map(t => t.innerText).join(' ')))); await E(() => document.querySelector('.aw-week').scrollIntoView({ block: 'center' })); await shot('10-parents');
  /* ---------- 11. блокнот ---------- */
  await go('book'); await E(() => document.querySelector('.tabs [data-t="cases"]').click()); await sleep(300);
  ok('book: cases tab uses new feed', await E(() => document.querySelectorAll('#bk .cs-card').length === 20), await E(() => curScreen + ' ' + (document.querySelector('#bk') || {}).innerHTML.slice(0, 150)));
  await E(() => document.querySelector('.tabs [data-t="awards"]').click()); await sleep(300);
  ok('book: awards tab → new collection', await E(() => /Собрано \d+ из \d+/.test(document.querySelector('#bk').innerText) && !!document.querySelector('#bk .bdg')));
  /* ---------- 12. пустая лента ---------- */
  await E(() => { S.caseLog = []; }); await go('diplomas', 'cases');
  ok('empty state', await E(() => !!document.querySelector('.cs-empty [data-go="newcase"]')));
  /* ---------- 13. новый игрок: нет окна, нет значков ---------- */
  await E(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Барсик', kid: 'Петя', seenVersion: APP_VERSION }))); }); await p.goto(URL); await sleep(2500);
  ok('fresh player: no retro modal, nothing earned', await E(() => !document.querySelector('.modal .aw-retro') && S.badges.length === 0 && S.bx.v === 31));

  console.log('V31 errors:', errors.length ? errors.join('\n') : 'none');
  console.log(`V31 DONE ${n - fails}/${n}`); await b.close(); process.exit(fails || errors.length ? 1 : 0);
})();
