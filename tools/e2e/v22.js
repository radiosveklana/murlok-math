// v22: Школа = «Математика 4 класс», копилка задач в «Новом деле», космос, карта звёзд, новые персонажи и преступления,
// режимы «Быстрых лапок», ошибки Енота, «Мои награды», «Мысль дня», ОБЖ и «Скорая помощь котика»
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0;
const ok = (name, c, x = '') => { n++; console.log((c ? 'V22 OK ' : 'V22 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, candies: 100, login: { last: today(), day: 1 } }))); });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Coach === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await sleep(800); }
  await sleep(1200);
  const E = (f, ...a) => p.evaluate(f, ...a), go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(600); };
  const click = async s => { await p.waitForSelector(s, { timeout: 8000 }); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); try { await p.click(s); } catch (e) { await E(s => document.querySelector(s).click(), s); } await sleep(300); };
  const answer = async () => E(async () => {
    const q = window.__aq, area = document.querySelector('.aq-box') || document.querySelector('#mq') || document.querySelector('#b2q'), clk = s => area.querySelector(s).click(), sl = ms => new Promise(r => setTimeout(r, ms));
    if (q.type === 'one') clk(`.opt[data-i="${q.c}"]`); else if (q.type === 'tf') clk(`.opt[data-v="${q.c ? 1 : 0}"]`); else if (q.type === 'case') clk(`.opt[data-i="${q.a.findIndex(o => o.ok === true)}"]`);
    else if (q.type === 'order') { for (let i = 0; i < q.items.length; i++) { clk(`.ord[data-i="${i}"]`); await sl(30); } clk('#ochk'); }
    else if (q.type === 'sort') { [...area.querySelectorAll('.sort-it')].forEach((bt, i) => { for (let k = 0; k <= q.items[i][1]; k++) bt.click(); }); clk('#schk'); }
    else if (q.type === 'input') { for (const d of String(q.c)) clk(`.pad .k[data-k="${d}"]`); clk('.pad .k[data-k="ok"]'); }
  });

  /* ---------- Школа = «Математика 4 класс» ---------- */
  await go('school');
  ok('school: one section, all topics', await E(() => /Математика 4 класс/.test(document.querySelector('.school-head').innerText) && document.querySelectorAll('.page.school4 .unit').length === 22));
  ok('school: old lessons kept', !!(await p.$('[data-go="lesson"][data-arg="mul"]')) && !!(await p.$('[data-go="practice"][data-arg="eq"]')) && !!(await p.$('[data-go="colwork"][data-arg="div"]')) && !!(await p.$('[data-go="collesson"][data-arg="add"]')));
  await click('[data-aq="motion"]'); ok('school topic opens trainer', await E(() => curScreen === 'aquiz' && !!document.querySelector('.genlv')));

  /* ---------- «Новое дело» из копилки ---------- */
  ok('taskbank has all school topics', await E(() => TaskBank.list().length === 22));
  await go('newcase'); ok('newcase: all + pick', !!(await p.$('.choice[data-t="all"]')) && !!(await p.$('.choice[data-t="pick"]')));
  await click('.choice[data-t="pick"]'); ok('pick topics modal', (await p.$$('.tb-pick input')).length === 22);
  await E(() => { document.querySelectorAll('.tb-pick input').forEach(i => { i.checked = /^math4:(motion|buy|remainder)$/.test(i.value); }); }); await click('#tbok');
  ok('picked saved', await E(() => S.prefs.caseTopics.length === 3));
  await click('#go'); await sleep(800);
  ok('case built from picked topics', await E(() => CASE && CASE.topic === 'pick' && CASE.tasks.length === 4 && CASE.tasks.every(t => t.kind === 'aq' && /motion|buy|remainder/.test(t.src))));
  await go('casetask'); await sleep(600);
  ok('aq task shows title', await E(() => !/undefined/.test(document.querySelector('.task-head').innerText) && !!document.querySelector('.aq-box')));
  const st0 = await E(() => S.st.aq.done); await answer(); await sleep(1800);
  ok('aq task solved -> clue', await E(st0 => S.st.aq.done === st0 + 1 && !!document.querySelector('#clue'), st0));
  await E(() => { startCase('all', 2); }); await sleep(500); ok('all-program case mixes kinds', await E(() => new Set(CASE.tasks.map(t => t.pid)).size >= 3));
  await E(() => { CASE.tasks[CASE.idx] = TaskBank.pick(['div'], 1, 1)[0]; }); await go('casetask'); await sleep(500);
  ok('division task in case', !!(await p.$('.divbox')) || !!(await p.$('#tbcol .task-title')));

  /* ---------- персонажи и преступления ---------- */
  ok('50 characters, 96 crimes', await E(() => E.ANIMALS.length === 50 && E.CRIMES.length === 96 && Object.keys(window.Lines.PERSONA).length === 50));
  ok('new characters drawn', await E(() => ['Кошечка Мурка', 'Барсук Бобби', 'Пчёлка Жужа'].every(nm => window.Chibi ? Chibi.chibiSVG(nm).length > 500 : true)));
  ok('quirks vary', await E(() => { const s = new Set(); for (let i = 0; i < 40; i++) s.add(window.Lines.personaLines('Енот Тимоша').quirk); return s.size >= 2; }));
  ok('new crimes come first', await E(() => S.crimesV2 === 1 && S.crimeBag.slice(0, 5).every(i => i >= 36)));

  /* ---------- космос ---------- */
  await go('starmap'); ok('star map: 16 constellations', (await p.$$('.cst')).length === 16);
  await click('.cst-chips .chip[data-c="ursa_major"]'); await sleep(800); ok('constellation info + reward', await E(() => /Большая Медведица/.test(document.querySelector('#cinfo').innerText) && S.starsSeen.includes('ursa_major')));
  ok('space trip locked', await E(() => !SpaceTrip.open()) && !!(await p.$('.trip-btn')));
  await E(() => { S.st.mul.done += 130; save(); }); await go('spacetrip'); ok('space trip open: 9 planets', (await p.$$('.tp')).length === 9);
  await click('.tp[data-p="moon"]'); for (let k = 0; k < 5; k++) { await answer(); await sleep(400); await click('#mn'); }
  ok('moon mission done', await E(() => S.trip.done.moon === 3));

  /* ---------- быстрые лапки, ошибки Енота ---------- */
  await go('blitz'); ok('blitz modes', (await p.$$('.drill-modes .chip')).length === 5);
  await go('drill', 'div'); const qtxt = await E(() => document.querySelector('#dq').innerText); const [x, y] = qtxt.split(':').map(Number);
  for (const ch of String(x / y)) await p.keyboard.press(ch); await sleep(300); ok('division drill counts', await E(() => document.querySelector('#ds').innerText === '1'));
  await go('bugs'); ok('bugs: new mode link', !!(await p.$('.bugs2-link')));
  ok('raccoon bugs from whole program', await E(() => { let prog = 0, bad = 0; for (let i = 0; i < 200; i++) { const q = Drills.bugQ(); if (q.topic) prog++; if (!q || !q.q || /NaN|undefined/.test(q.q) || (q.type === 'tf' && typeof q.c !== 'boolean')) bad++; if (q.wrong && q.correct === undefined) bad++; } return prog > 60 && bad === 0; }));
  await go('bugs2'); for (let k = 0; k < 3; k++) { await answer(); await sleep(300); if (await p.$('#b2skip')) { const c = await E(() => window.__aq.correct); for (const ch of String(c)) await p.keyboard.press(ch); await p.keyboard.press('Enter'); await sleep(300); } await click('#b2n'); }
  ok('raccoon bugs answered', (await p.$$('.g-dots i.ok')).length === 3);

  /* ---------- награды, мысль дня, игры Академии, ОБЖ ---------- */
  await go('home'); ok('home: awards instead of notebook', !(await p.$('.t-book')) && /награды/i.test(await E(() => document.querySelector('.t-diploma').innerText)));
  ok('thought of the day', !!(await p.$('.thought')));
  await go('diplomas'); ok('awards: badges + cases', !!(await p.$('.badge-grid')) && /Раскрытые дела/.test(await E(() => document.body.innerText)));
  await go('games'); ok('academy games in detective games', (await p.$$('.agame')).length >= 10 && /Скорая помощь котика/.test(await E(() => document.body.innerText)));
  await go('academy'); ok('obzh + stories in hub', !!(await p.$('.acad-card[data-s="obzh"]')) && !!(await p.$('.acad-card[data-s="stories"]')));
  await go('rescue'); for (let k = 0; k < 5; k++) { await E(() => { const G = window.SUBJECTS.obzh.game, s = document.querySelector('.q-case').innerText.replace('🚑 ', '').trim(), q = G.find(g => s.includes(g.s.slice(0, 30))); q.steps.forEach(st => [...document.querySelectorAll('.rs-opts .opt')].find(b => b.innerText === st).click()); }); await sleep(300); await click('#rn'); }
  ok('rescue game 5/5', await E(() => /5 из 5/.test(document.querySelector('#rq').innerText)));
  ok('obzh in diplomas + space', await E(() => Diplomas.rules().some(r => r.id === 'subj:obzh') && SpaceTrip.PL.find(p => p.id === 'earth').src.includes('@obzh')));

  /* ---------- «Что нового» не пропадает при перезагрузке, пока не закроют ---------- */
  await E(() => { S.seenVersion = '1'; S.cases = Math.max(S.cases, 1); save(); }); await p.goto(URL); await sleep(2500);
  ok('news shown', !!(await p.$('#newsOk')));
  await p.reload(); await sleep(2500); ok('news survives reload', !!(await p.$('#newsOk')));
  await click('#newsOk'); await p.reload(); await sleep(2500); ok('news closed for good', !(await p.$('#newsOk')) && (await E(() => S.seenVersion === APP_VERSION)));
  /* ---------- звёздная карта в обсерватории открывает небо ---------- */
  await go('house', 'observ'); await sleep(900); { const t = await p.$('.fx[data-id="fx_starmap"]'); if (t) { const bb = await t.boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(2200); } }
  ok('star map item opens sky', await E(() => curScreen === 'starmap'));
  /* ---------- «←» ведёт на предыдущий экран ---------- */
  await go('home'); await go('academy'); await go('subject', 'space'); await go('alesson', 'space:sun_system');
  const backTo = async () => { await E(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove())); await p.click('.top .back'); await sleep(500); return E(() => curScreen); };
  ok('back: lesson -> subject', (await backTo()) === 'subject'); ok('back: subject -> academy', (await backTo()) === 'academy'); ok('back: academy -> home', (await backTo()) === 'home');
  await go('games'); await go('rescue'); ok('back: game -> games list', (await backTo()) === 'games');
  await go('starmap'); await go('spacetrip'); ok('back: trip -> starmap', (await backTo()) === 'starmap');
  /* ---------- «Скорая помощь»: шаг не в свою очередь — понятная подсказка ---------- */
  await go('rescue'); await E(() => { const G = window.SUBJECTS.obzh.game, s = document.querySelector('.q-case').innerText.replace('🚑 ', '').trim(), q = G.find(g => s.includes(g.s.slice(0, 30))); [...document.querySelectorAll('.rs-opts .opt')].find(b => b.innerText === q.steps[q.steps.length - 1]).click(); });
  ok('rescue: early step explained', await E(() => /позже/.test(document.querySelector('#rhint').innerText)));
  ok('no errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log('V22 DONE', n); await b.close();
})().catch(e => { console.log('V22 FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
