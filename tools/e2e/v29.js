// v29: глубокая проработка Академии — больше карточек и вопросов в каждой теме, новые уроки, генераторы задач
// (вероятности, логические таблицы, факт/мнение, безопасно/опасно…), генераторы Академии в «Новом деле → Выбрать темы».
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V29 OK ' : 'V29 FAIL ') + name + (x ? ' ' + x : '')); };
const SUBJ = { safety: 14, talk: 13, think: 14, creative: 12, read: 6, stories: 13, teen: 16 }; // уроков не меньше
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, candies: 100, login: { last: today(), day: 1 } }))); });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Coach === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await sleep(800); }
  await sleep(1200);
  const E = (f, ...a) => p.evaluate(f, ...a), go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(500); };
  const click = async s => { await p.waitForSelector(s, { timeout: 8000 }); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); try { await p.click(s); } catch (e) { await E(s => document.querySelector(s).click(), s); } await sleep(250); };
  const answer = async () => E(async () => {
    const q = window.__aq, area = document.querySelector('.aq-box') || document.querySelector('#qarea'), clk = s => area.querySelector(s).click(), sl = ms => new Promise(r => setTimeout(r, ms));
    if (q.type === 'one') clk(`.opt[data-i="${q.c}"]`); else if (q.type === 'tf') clk(`.opt[data-v="${q.c ? 1 : 0}"]`); else if (q.type === 'case') clk(`.opt[data-i="${q.a.findIndex(o => o.ok === true)}"]`);
    else if (q.type === 'order') { for (let i = 0; i < q.items.length; i++) { clk(`.ord[data-i="${i}"]`); await sl(30); } clk('#ochk'); }
    else if (q.type === 'sort') { [...area.querySelectorAll('.sort-it')].forEach((bt, i) => { for (let k = 0; k <= q.items[i][1]; k++) bt.click(); }); clk('#schk'); }
    else if (q.type === 'input') { for (const d of String(q.c)) clk(`.pad .k[data-k="${d}"]`); clk('.pad .k[data-k="ok"]'); }
  });
  const runQuiz = async arg => { await go('aquiz', arg); const total = await E(() => document.querySelectorAll('.g-dots i').length); for (let i = 0; i < total; i++) { await answer(); await sleep(150); await click('#qn'); } return { total, res: await E(() => (document.querySelector('.g-result h2') || {}).innerText || '') }; };

  /* ---------- объём: уроки, карточки, вопросы, типы ---------- */
  const stat = await E(S0 => Object.keys(S0).map(id => { const s = subj(id); return { id, units: s.units.length, low: s.units.filter(u => u.quiz.length < 20 || new Set(u.quiz.map(q => q.type)).size < 4 || u.cards.length < 6).map(u => u.id + ':' + u.cards.length + '/' + u.quiz.length) }; }), SUBJ);
  stat.forEach(s => ok(`${s.id}: ${s.units} units (≥${SUBJ[s.id]}), every unit ≥6 cards, ≥20 q, ≥4 types`, s.units >= SUBJ[s.id] && !s.low.length, s.low.join(' ')));
  ok('read: ≥55 texts for timed reading, graded', await E(() => (window.READ_TEXTS || []).length >= 55 && (window.READ_TEXTS || []).filter(t => t.lv).length >= 15));

  /* ---------- генераторы: каждый уровень даёт рисуемые и разные вопросы ---------- */
  const gens = await E(() => Object.values(window.SUBJECTS).filter(s => s.id !== 'math4').flatMap(s => s.units.filter(u => u.gen).map(u => s.id + ':' + u.id)));
  ok('academy generators exist (≥6)', gens.length >= 6, gens.join(' '));
  const gbad = await E(G => { const bad = []; G.forEach(k => { const [sid, uid] = k.split(':'), u = subj(sid).units.find(x => x.id === uid); for (const lv of [1, 2, 3]) { const seen = new Set(); for (let i = 0; i < 25; i++) { try { const q = u.gen(lv); const d = document.createElement('div'); d.innerHTML = ACAD_Q[q.type].render(q); if (!q.why && q.type !== 'case') bad.push(k + ' no why'); seen.add(JSON.stringify(q)); } catch (e) { bad.push(k + ' lv' + lv + ' ' + e.message); break; } } if (seen.size < 5) bad.push(k + ' lv' + lv + ' мало разнообразия ' + seen.size); } }); return bad; }, gens);
  ok('generators render on all levels, varied', !gbad.length, gbad.slice(0, 5).join(' | '));

  /* ---------- тренажёр урока с генератором и нового урока ---------- */
  for (const k of gens.filter(k => /^(think|safety|talk)/.test(k)).slice(0, 3)) {
    await go('aquiz', k); const lv = !!(await p.$('.genlv'));
    const r = await runQuiz(k); ok(`gen trainer ${k}: levels + full run`, lv && r.total === 8 && /8 из 8/.test(r.res), r.res);
  }
  const newUnits = await E(() => ['safety', 'talk', 'think', 'creative', 'read', 'stories', 'teen'].map(id => id + ':' + subj(id).units[subj(id).units.length - 1].id));
  for (const k of newUnits) { const r = await runQuiz(k); ok(`new unit trainer ${k}`, r.total >= 6 && /из/.test(r.res), r.res); }
  await go('alesson', newUnits[0]); ok('new unit lesson opens', await E(() => curScreen === 'alesson' && document.querySelectorAll('.dots i').length >= 6 && !!document.querySelector('#slide h2').innerText));
  /* старый урок: старые карточки на месте, новые — в конце */
  ok('old unit keeps first card, has new ones', await E(() => { const u = subj('safety').units[0]; return u.id === 'personal_data' && u.cards[0].t === 'Что такое личные данные' && u.cards.length >= 9; }));
  ok('extra banks merged after old ones', await E(() => { const u = subj('talk').units.find(x => x.id === 'meet'); return u.quiz.length >= 26; }));

  /* ---------- «Новое дело»: генераторы Академии — в «Выбрать темы», не в «Вся программа», без энциклопедии ---------- */
  ok('taskbank: academy topics only by choice, no teen', await E(() => { const L = TaskBank.list(), A = L.filter(p => p.acad); return A.length >= 6 && A.every(p => p.subject !== 'teen' && /Академия/.test(p.group)); }));
  await go('newcase'); await click('.choice[data-t="pick"]');
  ok('pick modal shows academy group', await E(() => /Академия/.test(document.querySelector('.tb-pick').innerText)));
  const pickId = gens.find(k => k.startsWith('think')) || gens[0];
  await E(id => { document.querySelectorAll('.tb-pick input').forEach(i => { i.checked = i.value === id; }); }, pickId); await click('#tbok'); await click('#go'); await sleep(800);
  ok('case from academy topic', await E(id => CASE && CASE.tasks.length === 4 && CASE.tasks.every(t => t.kind === 'aq' && t.src === id), pickId));
  await go('casetask'); await sleep(500); ok('academy task in case renders', await E(() => !!document.querySelector('.aq-box')));
  await answer(); await sleep(1800); ok('academy task solved -> clue', await E(() => !!document.querySelector('#clue')));
  await E(() => { startCase('all', 2); }); await sleep(400); ok('all-program case has no academy topics', await E(() => CASE.tasks.every(t => !/^(safety|talk|think|creative|read|stories|teen):/.test(t.src || ''))));

  /* ---------- тренер, отчёт родителям, дипломы ---------- */
  ok('coach knows new units', await E(U => U.every(k => { const i = Coach.info('a:' + k); return i && i.name && i.area === 'academy'; }), newUnits));
  await E(k => Coach.track('a:' + k, 1), newUnits[0]);
  ok('parents report: academy rows, teen private', await E(() => { const h = Coach.parentsHTML(); return /Безопасность/.test(h) && !/Дружба в интернете|Стресс перед контрольной/.test(h); }));
  ok('diploma rules cover subjects, not teen', await E(() => { const R = Diplomas.rules().map(r => r.id); return R.includes('subj:safety') && R.includes('subj:think') && !R.includes('subj:teen'); }));
  ok('no errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log('V29 DONE', n, fails ? 'FAILS ' + fails : ''); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('V29 FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
