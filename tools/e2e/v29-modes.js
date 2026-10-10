// v29: «по всем темам» — Ошибки Енота в любой теме Школы и Академии, новое «Новое дело» (3 шага, Школа + Академия),
// «Быстрые лапки» с сеткой режимов и фактами Академии, числа по выбору в играх, «Улика или ложь», «Сортировка улик», разнообразие задач
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let fails = 0;
const ok = (name, c, x = '') => { if (!c) fails++; console.log((c ? 'V29 OK ' : 'V29 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, candies: 100, login: { last: today(), day: 1 } }))); });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Modes === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await sleep(800); }
  await sleep(1200);
  const E = (f, ...a) => p.evaluate(f, ...a), go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(500); };
  const click = async s => { await p.waitForSelector(s, { timeout: 8000 }); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await E(s => document.querySelector(s).click(), s); await sleep(250); };
  const shotSafe = async o => { try { await p.screenshot(o); } catch (e) { console.log('V29 note: screenshot skipped (' + e.code + ')'); } };
  const noScroll = () => E(() => document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth);
  const answerAQ = async sel => E(async sel => { // верный ответ на вопрос тренажёра window.__aq внутри sel
    const q = window.__aq, area = document.querySelector(sel), clk = s => area.querySelector(s).click(), sl = ms => new Promise(r => setTimeout(r, ms));
    if (q.type === 'one') clk(`.opt[data-i="${q.c}"]`); else if (q.type === 'tf') clk(`.opt[data-v="${q.c ? 1 : 0}"]`); else if (q.type === 'case') clk(`.opt[data-i="${q.a.findIndex(o => o.ok === true)}"]`);
    else if (q.type === 'order') { for (let i = 0; i < q.items.length; i++) { clk(`.ord[data-i="${i}"]`); await sl(30); } clk('#ochk'); }
    else if (q.type === 'sort') { [...area.querySelectorAll('.sort-it')].forEach((bt, i) => { for (let k = 0; k <= q.items[i][1]; k++) bt.click(); }); clk('#schk'); }
    else if (q.type === 'input') { for (const d of String(q.c)) clk(`.pad .k[data-k="${d}"]`); clk('.pad .k[data-k="ok"]'); }
  }, sel);

  /* ---------- 🦝 Ошибки Енота: любой вопрос любой темы превращается в корректную «ошибку Енота» ---------- */
  const gen = await E(() => {
    const bad = [], keys = Modes.schoolEntries().map(e => e.key); let n = 0;
    Modes.acadSubs().forEach(s => s.units.forEach(u => { if ((u.quiz || []).some(Modes.okQ)) keys.push('u:' + s.id + ':' + u.id); }));
    keys.forEach(k => { const f = Modes.bugSource(k); for (let i = 0; i < 12; i++) { const B = f(); n++;
      if (!B || !B.q || /undefined|NaN|\[object/.test(B.q + B.why) || typeof B.c !== 'boolean' || B.wrong !== !B.c) { bad.push(k + ' ' + (B ? B.q.slice(0, 80) : 'null')); continue; }
      const F = B.fix; if (F && ((F.kind === 'num' && !(Number.isInteger(F.c) && B.correct === F.c)) || (F.kind === 'pick' && !(F.opts && F.opts[F.c] != null)) || (F.kind === 'swap' && !(F.pair && F.pair[0] !== F.pair[1] && F.items[F.pair[1]] != null)))) bad.push(k + ' fix ' + JSON.stringify(F).slice(0, 80));
      if (B.c && F && F.kind === 'swap') bad.push(k + ' swap when right'); } });
    return { keys: keys.length, n, bad: bad.slice(0, 5), nb: bad.length, school: Modes.schoolEntries().length };
  });
  ok('raccoon bugs valid for every topic', gen.nb === 0 && gen.keys > 100, JSON.stringify(gen));
  ok('raccoon: all 22 school topics', gen.school === 22);

  await go('bugs'); ok('bugs hub: school + academy entries', !!(await p.$('.bug-hub [data-go="bugpick"][data-arg="s"]')) && !!(await p.$('.bug-hub [data-go="bugpick"][data-arg="a"]')) && !!(await p.$('.bugs2-link')));
  await click('.bug-hub [data-arg="s"]'); ok('bugpick school: all topics as chips', await E(() => curScreen === 'bugpick' && document.querySelectorAll('#bpbody [data-bug^="u:math4:"]').length === 18 && document.querySelectorAll('#bpbody [data-bug^="c:"]').length === 4 && !!document.querySelector('[data-bug="school"]')));
  await click('.bp-tabs [data-t="a"]'); await click('.bp-sub[data-s="space"]');
  ok('bugpick academy: subject -> units + whole subject', await E(() => document.querySelectorAll('#bpunits [data-bug^="u:space:"]').length >= 5 && !!document.querySelector('#bpunits [data-bug="S:space"]') && !!document.querySelector('[data-bug="acad"]')));
  await shotSafe({ path: __dirname + '/shots/V29-bugpick.png' });
  const noHScroll = () => E(() => document.documentElement.scrollWidth <= innerWidth);
  ok('bugpick: no horizontal scroll', await noHScroll());
  const playBugs = async spec => {
    await go('bugs2', spec); let fixes = 0;
    for (let k = 0; k < 8; k++) {
      await answerAQ('#b2q'); await sleep(250);
      const kind = await E(() => { const F = window.__bug.fix; return document.querySelector('#b2skip') ? 'num' : document.querySelector('#b2skip2') ? F.kind : ''; });
      if (kind === 'num') { const c = await E(() => window.__bug.fix.c); for (const ch of String(c)) await p.keyboard.press(ch); await p.keyboard.press('Enter'); fixes++; }
      else if (kind === 'pick') { await E(() => document.querySelector(`#b2w [data-f="${window.__bug.fix.c}"]`).click()); fixes++; await sleep(800); }
      else if (kind === 'swap') { await E(() => window.__bug.fix.pair.forEach(i => document.querySelector(`#b2w [data-f="${i}"]`).click())); fixes++; await sleep(900); }
      await sleep(200); if (k === 0) await shotSafe({ path: __dirname + `/shots/V29-bugs-${spec.replace(/:/g, '_')}.png` });
      await click('#b2n');
    }
    return E(() => ({ res: !!document.querySelector('.g-result'), dots: document.querySelectorAll('.g-dots i.ok').length }));
  };
  const bug0 = await E(() => S.st.bug.done);
  for (const spec of ['u:math4:motion', 'c:div', 'c:eq', 'S:space', 'u:obzh:' + await E(() => SUBJECTS.obzh.units[0].id), 'acad', 'school']) {
    const r = await playBugs(spec); ok('raccoon topic played: ' + spec, r.res && r.dots === 8, JSON.stringify(r));
  }
  ok('raccoon: counted as tasks + coach per topic', await E(b0 => S.st.bug.done === b0 + 56 && Object.keys(S.sk || {}).some(k => /^a:space:/.test(k)) && Object.keys(S.sk || {}).some(k => /^a:math4:motion/.test(k)), bug0));

  /* ---------- 🔍 Новое дело ---------- */
  await go('newcase');
  ok('newcase: fits 360x740 without scroll', await noScroll(), await E(() => document.documentElement.scrollHeight - innerHeight + ' ' + [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().bottom > innerHeight + 1 && getComputedStyle(e).position !== 'fixed').slice(0, 6).map(e => e.tagName + '.' + String(e.className).slice(0, 30) + ':' + Math.round(e.getBoundingClientRect().bottom)).join(' ')));
  ok('newcase: 3 steps, 4 topics + classic, case teaser', await E(() => document.querySelectorAll('.nc-step').length === 2 && document.querySelectorAll('.nc-t').length === 4 && document.querySelectorAll('.nc-c').length === 3 && /Дело №1/.test(document.querySelector('.nc-case').innerText) && /«.+»/.test(document.querySelector('.nc-case').innerText) && /Взять дело №1/.test(document.querySelector('#go').innerText)));
  await shotSafe({ path: __dirname + '/shots/V29-newcase.png' });
  ok('newcase teaser = next crime', await E(() => document.querySelector('.nc-case b').innerText.includes(E.CRIMES[S.crimeBag[0]].title)));
  await click('.choice[data-t="acad"]'); await click('#go'); await sleep(600);
  ok('academy case: 4 witness questions', await E(() => CASE && CASE.real === 'acad' && CASE.tasks.length === 4 && CASE.tasks.every(t => t.kind === 'aq' && t.acad && t.q)));
  await go('casetask'); await sleep(400);
  ok('witness card shown', await E(() => !!document.querySelector('.wit-card') && !!document.querySelector('.aq-box') && !/undefined/.test(document.querySelector('.task-page').innerText)));
  await shotSafe({ path: __dirname + '/shots/V29-witness.png' });
  const aq0 = await E(() => S.st.aq.done); await answerAQ('.aq-box'); await sleep(1700);
  ok('witness answered -> clue + coach', await E(a0 => S.st.aq.done === a0 + 1 && !!document.querySelector('#clue') && Object.keys(S.sk || {}).some(k => k === 'a:' + CASE.tasks[0].src), aq0));
  await E(() => startCase('all', 2)); await sleep(500);
  ok('whole program: school + academy', await E(() => CASE.tasks.filter(t => t.acad).length === 2 && CASE.tasks.filter(t => !t.acad).length === 2 && CASE.topic === 'all'));
  await E(() => startCase('school', 1)); await sleep(500);
  ok('school: 4 school tasks', await E(() => CASE.real === 'school' && CASE.tasks.length === 4 && CASE.tasks.every(t => !t.acad)));
  // v30 (mistakes.js): уроки открываются по порядку — в выборе тем только открытые темы; с «Открыть все уроки» — все 22
  await E(() => { S.unlockAll = false; save(); }); await go('newcase'); await click('.choice[data-t="pick"]');
  { const r = await E(() => { const v = [...document.querySelectorAll('.tb-pick input')].map(i => i.value), L = TaskBank.list().map(t => t.id); return { ok: v.length > 0 && v.length < 22 && v.every(x => L.includes(x)) && v.length === TaskBank.list().filter(t => !t.acad).length, v: v.join(',') }; }); ok('pick modal: only open school topics while lessons are locked', r.ok, r.v); }
  await E(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); S.unlockAll = true; save(); }); await go('newcase'); await click('.choice[data-t="pick"]');
  ok('pick modal: school chips + academy chips', await E(() => document.querySelectorAll('.tb-pick input').length === 22 && document.querySelectorAll('.tb-acad input').length > 50));
  await E(() => { document.querySelectorAll('.tb-pick input').forEach(i => { i.checked = i.value === 'math4:buy'; }); document.querySelectorAll('.tb-acad input').forEach(i => { i.checked = /^space:/.test(i.value); }); }); await click('#tbok');
  ok('pick saved both', await E(() => S.prefs.caseTopics.length === 1 && S.prefs.caseAcad.length >= 5 && /тем: \d+/.test(document.querySelector('#pickn').innerText)));
  await click('#go'); await sleep(600);
  ok('picked case mixes school + academy', await E(() => CASE.topic === 'pick' && CASE.tasks.filter(t => t.acad && /^space:/.test(t.src)).length === 2 && CASE.tasks.filter(t => t.src === 'math4:buy').length === 2));
  await go('newcase'); await click('.choice[data-t="mix"]'); ok('classic mix still works', await E(() => S.prefs.topic === 'mix')); await click('#go'); await sleep(500);
  ok('classic case built', await E(() => CASE && CASE.topic === 'mix' && CASE.tasks.some(t => ['mul', 'eq', 'interro', 'bugmul', 'bugeq'].includes(t.kind))));

  /* ---------- ⚡ Быстрые лапки ---------- */
  await go('blitz');
  ok('blitz: mode grid + academy facts, no scroll', await E(() => document.querySelectorAll('.bz-m').length === 6 && !!document.querySelector('#bzfp')) && await noScroll());
  await shotSafe({ path: __dirname + '/shots/V29-blitz.png' });
  await click('#bzfp'); ok('facts subjects sheet', await E(() => document.querySelectorAll('.modal [data-fm]').length >= 3)); await click('.modal [data-fm]'); ok('facts mode selected', await E(() => /^f:/.test(S.prefs.blitzMode) && document.querySelector('#bzfp').classList.contains('on')));
  await click('.bz-m[data-m="div"]'); ok('mode remembered', await E(() => S.prefs.blitzMode === 'div' && /Деление/.test(document.querySelector('#bzsel').innerText)));
  await click('#go'); ok('drill: timer + numpad visible without scroll', await E(() => curScreen === 'drill' && !!document.querySelector('.timer') && document.querySelector('.pad .k[data-k="0"]').getBoundingClientRect().bottom <= innerHeight) && await noScroll());
  for (const m of ['tbl', 'div', 'round', 'addsub', 'mul2', 'mixall']) {
    await go('drill', m); let good = 0;
    for (let i = 0; i < 3; i++) { const t = await E(() => document.querySelector('#dq').innerText); const v = Function('return ' + t.replace(/×|·/g, '*').replace(/:/g, '/').replace(/−/g, '-'))(); for (const ch of String(v)) await p.keyboard.press(ch); await sleep(120); good = await E(() => +document.querySelector('#ds').innerText); }
    ok('drill mode counts answers: ' + m, good === 3);
  }
  await shotSafe({ path: __dirname + '/shots/V29-drill.png' });
  await E(() => { window.__dn = Date.now; const d0 = Date.now.bind(Date); Date.now = () => d0() + 61000; }); await sleep(400);
  ok('drill end: record saved', await E(() => !!document.querySelector('.bz-end') && (S.drillBest || {}).mixall === 3)); await E(() => { Date.now = window.__dn; });
  const fk = await E(() => document.querySelector('[data-m^="f:"]') ? null : Modes.acadSubs(false).map(s => 'f:' + s.id).find(k => Modes.getMode(k))) || 'f:space';
  await go('drill', fk); await sleep(200);
  for (let i = 0; i < 3; i++) { await E(() => document.querySelector(`#bzo .opt[data-i="${window.__bz.c}"]`).click()); await sleep(150); }
  ok('facts drill counts right answers', await E(() => document.querySelector('#ds').innerText === '3'));
  ok('facts drill: options visible without scroll', await E(() => document.querySelectorAll('#bzo .opt').length >= 2 && document.querySelector('#bzo .opt').getBoundingClientRect().bottom <= innerHeight) && await noScroll());
  await shotSafe({ path: __dirname + '/shots/V29-facts.png' });

  /* ---------- 🎮 игры ---------- */
  await go('games'); ok('games: number topics + 2 new academy games', await E(() => document.querySelectorAll('[data-gn]').length === 6 && !!document.querySelector('.game-card[data-g="truth"]') && !!document.querySelector('.game-card[data-g="sortclue"]')));
  ok('games: no horizontal scroll', await noHScroll());
  await click('[data-gn="div"]'); ok('number topic saved', await E(() => S.prefs.gameNums === 'div'));
  await go('game', 'chase'); ok('chase uses division', await E(() => /:/.test(document.querySelector('#cq').innerText)));
  const cq = await E(() => document.querySelector('#cq').innerText.split('=')[0]); const cv = Function('return ' + cq.replace(/:/g, '/'))(); for (const ch of String(cv)) await p.keyboard.press(ch); await sleep(200);
  ok('chase: correct answer moves cat', await E(() => parseFloat(document.querySelector('#rc').style.left) > 0));
  await go('game', 'memo'); ok('memo with division: 12 cards', await E(() => document.querySelectorAll('.mc').length === 12 && [...document.querySelectorAll('.mc .mb')].some(x => /:/.test(x.innerText))));
  await go('game', 'safe'); const sq = await E(() => document.querySelector('.ask-eq').innerText.split('=')[0]); for (const ch of String(Function('return ' + sq.replace(/:/g, '/'))())) await p.keyboard.press(ch); await p.keyboard.press('Enter'); await sleep(400);
  ok('safe with division: first code digit', await E(() => document.querySelectorAll('.dg.on').length === 1));
  await sleep(1000); await E(() => { S.prefs.gameNums = 'school'; }); await go('game', 'safe'); ok('safe with school topics', await E(() => !!document.querySelector('.safe-q')));
  await E(() => { S.prefs.gameNums = 'tbl'; }); await go('game', 'chase'); ok('chase default: table', await E(() => /×/.test(document.querySelector('#cq').innerText)));
  await go('game', 'truth'); ok('truth: subject chooser', await E(() => document.querySelectorAll('#garea [data-s]').length > 5));
  await click('#garea [data-s="space"]');
  for (let r = 0; r < 10; r++) { await answerAQ('#garea'); await sleep(150); if (r === 0) await shotSafe({ path: __dirname + '/shots/V29-truth.png' }); await click('#gn'); await sleep(1100); }
  ok('truth: 10 of 10', await E(() => !!document.querySelector('.g-result') && /10 из 10/.test(document.querySelector('.g-result').innerText)));
  await go('game', 'sortclue'); await click('#garea [data-s="*"]');
  for (let r = 0; r < 4; r++) { await answerAQ('#garea'); await sleep(150); if (r === 0) await shotSafe({ path: __dirname + '/shots/V29-sortclue.png' }); await click('#gn'); await sleep(1100); }
  ok('sortclue: 4 of 4', await E(() => !!document.querySelector('.g-result') && /4 из 4/.test(document.querySelector('.g-result').innerText)));

  /* ---------- 🎲 разнообразие задач ---------- */
  const vr = await E(() => { const out = []; SUBJECTS.math4.units.forEach(u => { const qs = []; for (let i = 0; i < 14; i++) qs.push(u.gen(1 + i % 3)); const txt = qs.map(q => q.q.replace(/<[^>]+>/g, '')); const rep = txt.some((t, i) => i && t === txt[i - 1]); const sameAns = qs.some((q, i) => i && q.type === 'input' && qs[i - 1].type === 'input' && String(q.c) === String(qs[i - 1].c)); const distinct = new Set(txt).size; if (rep || sameAns || distinct < 10) out.push(u.id + ' rep=' + rep + ' same=' + sameAns + ' distinct=' + distinct); }); return out; });
  ok('school generators: no repeats in a row, varied', vr.length === 0, vr.join('; '));
  ok('new story templates for school topics', await E(() => Object.keys(Modes.VAR).length >= 10 && Object.keys(Modes.VAR).every(k => SUBJECTS.math4.units.some(u => u.id === k))));
  const ms = await E(() => { const s = []; for (let i = 0; i < 12; i++) { const t = makeTask('mul', 2); s.push(t.story || ''); } return s.filter(Boolean).every((x, i, a) => !i || x.replace(/\d+/g, '') !== a[i - 1].replace(/\d+/g, '')); });
  ok('multiplication stories do not repeat in a row', ms);

  ok('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  console.log(fails ? `V29 FAIL ${fails}` : 'V29 DONE');
  await b.close();
})();
