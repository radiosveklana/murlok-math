// Академия, честная теория, тренер-котик, салон окрасов, отчёт для взрослых, ПИН, фотостудия, скорочтение
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [], res = [];
const ok = (name, cond, extra = '') => { res.push(name); console.log((cond ? 'ACAD OK ' : 'ACAD FAIL ') + name + (extra ? ' ' + extra : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.evaluateOnNewDocument(() => { const real = Date.now; window.__off = 0; Date.now = () => real() + window.__off; });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Coach === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await new Promise(r => setTimeout(r, 800)); } await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, login: { last: today(), day: 1 } }))); });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Coach === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await new Promise(r => setTimeout(r, 800)); } await sleep(1200);
  const E = (f, ...a) => p.evaluate(f, ...a);
  const go = async (n, a) => { await E((n, a) => go(n, a), n, a); await sleep(500); };
  const clickSel = async s => { await p.waitForSelector(s, { timeout: 5000 }); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.click(s); await sleep(250); };

  await p.waitForSelector('.t-acad', { timeout: 30000 }).catch(() => { }); // под нагрузкой главная грузится дольше
  // главная: новые плитки
  ok('home tiles', await E(() => !!document.querySelector('.t-acad') && !!document.querySelector('.t-photo') && !!document.querySelector('.t-school')));
  // хаб Академии — все 5 предметов
  await clickSel('.t-acad'); ok('hub subjects', (await p.$$('.acad-card[data-s]')).length === (await E(() => ACAD_ORDER.filter(x => window.SUBJECTS[x]).length)));

  /* ---------- урок «быстро пролистан» → без награды ---------- */
  await clickSel('.acad-card[data-s="space"]'); await clickSel('[data-l]');
  const c0 = await E(() => S.candies);
  for (let i = 0; i < 12; i++) { if (await p.$('.cp')) break; await clickSel('#next'); }
  ok('checkpoint shown', !!(await p.$('.cp')));
  const answerCp = async right => { for (let i = 0; i < 3; i++) { await sleep(300); if (!(await p.$('.cp .opt'))) break; const c = await E(() => document.querySelector('.cp-q').dataset.c); const t = await E(() => document.querySelector('.cp-q .opt[data-v]') ? 'tf' : 'one'); const sel = t === 'tf' ? `.cp .opt[data-v="${right ? c : 1 - c}"]` : (right ? `.cp .opt[data-i="${c}"]` : `.cp .opt:not([data-i="${c}"])`); await p.click(sel); await sleep(250); await p.click('#cpn'); } await sleep(500); };
  await answerCp(true);
  const th1 = await E(() => S.theory['a:space:' + window.SUBJECTS.space.units[0].id]);
  ok('fast lesson not verified', th1 && th1.verified === false && (await E(() => S.candies)) === c0, JSON.stringify(th1));
  ok('went to quiz', await E(() => curScreen === 'aquiz'));

  /* ---------- тренажёр: все ответы через знание вопроса, одна ошибка нарочно ---------- */
  const answer = async wrong => E(async wrong => {
    const q = window.__aq, area = document.querySelector('#qarea'), clk = s => area.querySelector(s).click(), sl = ms => new Promise(r => setTimeout(r, ms));
    if (q.type === 'one') clk(wrong ? `.opt:not([data-i="${q.c}"])` : `.opt[data-i="${q.c}"]`);
    else if (q.type === 'tf') clk(`.opt[data-v="${(q.c ? 1 : 0) ^ (wrong ? 1 : 0)}"]`);
    else if (q.type === 'case') { const i = q.a.findIndex(o => wrong ? o.ok !== true : o.ok === true); clk(`.opt[data-i="${i}"]`); }
    else if (q.type === 'order') { const n = q.items.length, seq = [...Array(n).keys()]; if (wrong) [seq[0], seq[1]] = [seq[1], seq[0]]; for (const i of seq) { clk(`.ord[data-i="${i}"]`); await sl(30); } clk('#ochk'); }
    else if (q.type === 'sort') { const its = [...area.querySelectorAll('.sort-it')]; its.forEach((b, i) => { let g = q.items[i][1]; if (wrong && i === 0) g = (g + 1) % q.groups.length; for (let k = 0; k <= g; k++) b.click(); }); clk('#schk'); }
    else if (q.type === 'input') { const v = String(wrong ? q.c + 1 : q.c); for (const d of v) clk(`.pad .k[data-k="${d}"]`); clk('.pad .k[data-k="ok"]'); }
  }, wrong);
  let n = 0; for (; n < 12; n++) { if (!(await p.$('#qarea .q-unit'))) break; await answer(n === 1); await sleep(250); await clickSel('#qn'); }
  ok('quiz finished', !!(await p.$('.g-result')), 'answered ' + n);
  const acad = await E(() => S.acad.space);
  ok('mistake in review box', Object.keys(acad.box).length === 1, JSON.stringify(acad.box));
  ok('stars saved', Object.values(acad.best)[0] >= 2);
  ok('coach tracked subject', await E(() => !!S.sk['a:space'] && S.sk['a:space'].n === 1));

  /* ---------- урок «прочитан честно» → награда (время подкручиваем) ---------- */
  await go('alesson', 'safety:' + (await E(() => window.SUBJECTS.safety.units[0].id)));
  const c1 = await E(() => S.candies);
  for (let i = 0; i < 12; i++) { if (await p.$('.cp')) break; await E(() => { window.__off += 25000; }); await clickSel('#next'); }
  await answerCp(true);
  ok('honest lesson verified + reward', (await E(() => S.theory['a:safety:' + window.SUBJECTS.safety.units[0].id].verified)) && (await E(() => S.candies)) > c1);

  // математический урок с «Проверь себя»
  await go('lesson', 'mul'); for (let i = 0; i < 8; i++) { if (await p.$('.cp')) break; await E(() => { window.__off += 25000; }); await clickSel('#next'); }
  const c2 = await E(() => S.candies); await answerCp(true);
  ok('math lesson verified', (await E(() => S.theory['t:mul'] && S.theory['t:mul'].verified && S.lessons.mul)) && (await E(() => S.candies)) >= c2 + 5 && (await E(() => curScreen)) === 'practice');

  /* ---------- разбор ошибок ---------- */
  await E(() => { Object.values(S.acad.space.box).forEach(v => { v[1] = '2020-01-01'; }); save(); });
  await go('subject', 'space'); ok('review button', !!(await p.$('#rev')));
  await clickSel('#rev'); await answer(false); await sleep(250);
  ok('review moves box', await E(() => Object.values(S.acad.space.box)[0][0] === 1));

  /* ---------- поиск в энциклопедии + приватность ---------- */
  await go('asearch', 'teen'); await p.type('#sq', 'месячные'); await sleep(300);
  ok('teen search', (await p.$$('.sres-it')).length > 0);
  await E(() => document.querySelector('.sres-it').click()); await sleep(400); ok('search opens exact card', await E(() => /месячн/i.test(document.querySelector('#slide h2').innerText))); for (let i = 0; i < 12; i++) { if (await p.$('.cp')) break; await clickSel('#next'); } await answerCp(true);
  if (await E(() => curScreen === 'aquiz')) { for (let k = 0; k < 10; k++) { if (!(await p.$('#qarea .q-unit'))) break; await answer(false); await sleep(200); await clickSel('#qn'); } }
  ok('teen not tracked', await E(() => !Object.keys(S.sk).some(k => k.startsWith('a:teen'))));

  /* ---------- тренер: трудные уравнения → задание роста → награда ---------- */
  await E(() => { for (let i = 0; i < 5; i++) Coach.track('eq2', 0); S.coach.date = ''; save(); });
  await go('home');
  ok('grow mission for hard skill', await E(() => S.coach.grow.id === 'eq2' && S.coach.grow.why === 'hard' && !!document.querySelector('.cm.grow')));
  const g0 = await E(() => S.gems || 0), gd0 = await E(() => S.coach.stats.growDone);
  await E(() => { for (let i = 0; i < 3; i++) Coach.track('eq2', 1); }); await sleep(2600);
  ok('grow mission reward', await E((g0, gd0) => S.coach.grow.done && S.coach.stats.growDone === gd0 + 1 && S.gems > g0, g0, gd0));
  // талант и испытание мастера
  await E(() => { for (let i = 0; i < 12; i++) Coach.track('mul2', 1); S.coach.date = ''; save(); });
  await go('home'); ok('talent + master', await E(() => S.coach.master && S.coach.master.id === 'mul3' && !!document.querySelector('.cm.master') && /Талант|талант/.test(document.querySelector('.coach').innerText)));
  await go('school'); ok('school decorated', !!(await p.$('.school-card.rec')));

  /* ---------- салон окрасов ---------- */
  await E(() => { S.gems = 60; S.sk.eq4 = { n: 12, a: 1, pf: 10, h: [], d: {} }; save(); SHOP_TAB = 'salon'; go('shop'); }); await sleep(500);
  ok('salon shown', (await p.$$('.shade')).length >= 12);
  ok('basic shop hides salon furs', await E(() => { SHOP_TAB = 'wear'; go('shop'); return !document.querySelector('.fur[data-f="galaxy"]'); }));
  await E(() => { SHOP_TAB = 'salon'; go('shop'); }); await sleep(300);
  await clickSel('.shade[data-sh="peach"]'); ok('locked shade not sold', !(await p.$('#buysh')) && !!(await p.$('#earnGo'))); await E(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
  await clickSel('.shade[data-sh="galaxy"]'); await clickSel('#buysh');
  ok('galaxy bought + gradient cat', await E(() => S.fur === 'galaxy' && S.furs.includes('galaxy') && myCat().includes('url(#fg-galaxy)') && myCat().includes('furfx')));

  /* ---------- отчёт для взрослых + ПИН ---------- */
  await go('parents'); const ptxt = await E(() => document.querySelector('.page.parents').innerText);
  ok('parents report', !!(await p.$('.coach-rep')) && !/NaN|undefined|\[object/.test(ptxt), (ptxt.match(/NaN|undefined|\[object/) || [''])[0]);
  ok('parents old cards kept', /Облачная копия|Резервная копия|Разговоры с котиком|Где ошибается/.test(ptxt) && !!(await p.$('#reset')) && !!(await p.$('#sndtest')));
  const teenUnits = await E(() => window.SUBJECTS.teen.units.map(u => u.title));
  ok('teen private in report', !teenUnits.some(t => ptxt.includes(t)));
  ok('talents in report', /Сильные стороны[\s\S]*Столбик/.test(ptxt));
  await E(() => { S.pin = '4321'; save(); }); await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Coach === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await new Promise(r => setTimeout(r, 800)); } await sleep(1200); await go('parents');
  ok('pin gate', !!(await p.$('#pinin')) && !(await p.$('.coach-rep')));
  await p.type('#pinin', '4321'); await clickSel('#pingo'); await sleep(400); ok('pin unlock', !!(await p.$('.coach-rep')));

  /* ---------- фотостудия ---------- */
  await go('photo'); ok('photo bg thumbs', await E(() => [...document.querySelectorAll('.ph-bg')].filter(b => /url\(/.test(getComputedStyle(b).backgroundImage)).length >= 6));
  await clickSel('.ph-s[data-e="⭐"]'); await clickSel('.ph-bg:nth-child(2)');
  await clickSel('#snap'); await p.waitForSelector('.ph-big', { timeout: 8000 }).catch(() => { });
  ok('photo rendered', (await E(() => window.__lastPhoto || 0)) > 50000 && !!(await p.$('.ph-big')), 'size ' + (await E(() => window.__lastPhoto)));
  ok('share buttons', !!(await p.$('#pshare')) && !!(await p.$('#pvk')));
  await E(() => document.querySelector('.modal [data-close]').click()); await sleep(800);
  ok('gallery', (await p.$$('.ph-th')).length >= 1);
  await E(() => { S.shareOn = false; }); await clickSel('.ph-th'); ok('share off hides buttons', !(await p.$('#pshare')) && !!(await p.$('#psave')));
  await E(() => { S.shareOn = true; document.querySelectorAll('.modal').forEach(m => m.remove()); });
  await go('house'); ok('photo button in house', !!(await p.$('.photo-fab')));

  /* ---------- примерочная ---------- */
  await E(() => { S.candies = 500; S.fur = 'ginger'; save(); }); await go('fitting');
  ok('fitting mirror + reflection', !!(await p.$('.mirror .refl svg')) && !!(await p.$('.fit-cat svg')));
  await clickSel('#poses button[data-p="hi"]'); ok('pose paw', await E(() => document.querySelector('#fcat').innerHTML.includes('wave-paw') && document.querySelector('#refl').innerHTML.includes('wave-paw')));
  await clickSel('#poses button[data-p="wink"]');
  const wear0 = await E(() => JSON.stringify(S.wear));
  await clickSel('#finv .item[data-id="crown"]'); ok('try unowned item', !!(await p.$('[data-buy="crown"]')));
  await clickSel('#fsave'); ok('cannot wear unbought', (await E(() => JSON.stringify(S.wear))) === wear0);
  await clickSel('[data-buy="crown"]'); await clickSel('#fbuy'); await clickSel('#fsave');
  ok('buy + wear look', await E(() => S.owned.includes('crown') && S.wear.head === 'crown'));
  await clickSel('#admire'); await sleep(300); ok('admire bubble', await E(() => !document.querySelector('#fsay').hidden));
  await clickSel('.look.empty'); ok('look saved', await E(() => !!(S.looks && S.looks[0])));
  await clickSel('#fphoto'); await sleep(400);
  ok('photo from fitting keeps pose', await E(() => curScreen === 'photo' && Photo.state.pose === 'wink' && document.querySelector('#stc').innerHTML.includes('q11 -14 22 0') && document.querySelector('#mood button.on').dataset.v === 'wink'));
  await clickSel('#snap'); await p.waitForSelector('.ph-big', { timeout: 8000 }).catch(() => { }); ok('pose photo rendered', !!(await p.$('.ph-big')));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
  await go('shop'); ok('shop link to fitting', !!(await p.$('.fit-link')));

  /* ---------- скорочтение ---------- */
  await go('schulte', 3); for (let v = 1; v <= 9; v++) await p.click(`.sc[data-v="${v}"]`);
  await sleep(400); ok('schulte', !!(await E(() => S.read && S.read.schulte[3])));
  await go('rtext', 0); await clickSel('#rgo'); await E(() => { window.__off += 60000; }); await clickSel('#rgo');
  for (let k = 0; k < 3; k++) { await sleep(300); const q = await E(() => { const t = document.querySelector('#rq'); return !!t.querySelector('.opt, .pad'); }); if (!q) break;
    await E(() => { const o = document.querySelector('#rq .opt[data-i="0"]') || document.querySelector('#rq .opt[data-v="1"]'); if (o) o.click(); else { document.querySelector('#rq .pad .k[data-k="3"]').click(); document.querySelector('#rq .pad .k[data-k="ok"]').click(); } }); await sleep(1100); }
  await sleep(500); ok('timed reading', await E(() => S.read.wpm.length === 1 && S.read.wpm[0].wpm > 0 && !!document.querySelector('#rn')), JSON.stringify(await E(() => S.read.wpm)));
  await go('rgrowth'); ok('growth chart', (await p.$$('.act.wpm .ab')).length === 1);
  await go('flash'); await sleep(1400); await p.waitForSelector('#fopts .opt', { timeout: 3000 }).catch(() => { }); ok('flash words', (await p.$$('#fopts .opt')).length === 4);

  /* ---------- кнопки .btn.ghost (Подозреваемые, Подсказка) видны и нажимаются ---------- */
  await E(() => startCase('mix', 1)); await sleep(300); await go('casetask'); await sleep(300);
  ok('ghost buttons clickable', await E(() => { const b = document.querySelector('#sus'); if (!b) return false; const st = getComputedStyle(b); return st.position !== 'absolute' && st.pointerEvents !== 'none' && st.opacity === '1'; }));
  /* ---------- старое: прогресс на месте ---------- */
  ok('time tracked or ok', await E(() => typeof S.time === 'object' || S.time === undefined));
  /* ---------- задание роста по трудному уроку Академии засчитывается ---------- */
  await E(() => { S.sk = { 'a:think:fact_opinion': { n: 6, a: 0.3, sp: 0, pf: 0, h: [], d: {} } }; S.coach.date = ''; save(); });
  await go('home'); ok('unit grow mission', await E(() => S.coach.grow.id === 'a:think:fact_opinion'));
  await go('subject', 'think'); ok('unit marked in subject', !!(await p.$('.unit.rec')));
  const gd1 = await E(() => S.coach.stats.growDone);
  await go('aquiz', 'think:fact_opinion'); for (let k = 0; k < 12; k++) { if (!(await p.$('#qarea .q-unit'))) break; await answer(false); await sleep(200); await clickSel('#qn'); }
  ok('unit mission completes', await E(gd1 => S.coach.grow.done && S.coach.stats.growDone === gd1 + 1, gd1));
  ok('no errors', !errors.length, errors.slice(0, 5).join(' | '));
  console.log('ACAD DONE', res.length);
  await b.close();
})().catch(async e => { console.log('ACAD FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
