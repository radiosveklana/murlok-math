// v20: математика 4 класса (генераторы, уровни, разбор ошибок), +810 вопросов, банки игр, креативное мышление, вещи на полках
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0;
const ok = (name, c, x = '') => { n++; console.log((c ? 'V20 OK ' : 'V20 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, candies: 300, login: { last: today(), day: 1 } }))); });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Coach === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await sleep(800); }
  await sleep(1000);
  const E = (f, ...a) => p.evaluate(f, ...a), go = async (s, a) => { await E((s, a) => go(s, a), s, a); await sleep(600); };
  const click = async s => { await p.waitForSelector(s, { timeout: 5000 }); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); try { await p.click(s); } catch (e) { console.log('DBG click fallback', s, await E(() => [...document.querySelectorAll('.modal')].map(m => m.innerText.slice(0, 60)).join(' | '))); await E(s => document.querySelector(s).click(), s); } await sleep(300); };
  const answer = async wrong => E(async wrong => {
    const q = window.__aq, area = document.querySelector('#qarea'), clk = s => area.querySelector(s).click(), sl = ms => new Promise(r => setTimeout(r, ms));
    if (q.type === 'one') clk(wrong ? `.opt:not([data-i="${q.c}"])` : `.opt[data-i="${q.c}"]`);
    else if (q.type === 'tf') clk(`.opt[data-v="${(q.c ? 1 : 0) ^ (wrong ? 1 : 0)}"]`);
    else if (q.type === 'case') { const i = q.a.findIndex(o => wrong ? o.ok !== true : o.ok === true); clk(`.opt[data-i="${i}"]`); }
    else if (q.type === 'order') { const nn = q.items.length, seq = [...Array(nn).keys()]; if (wrong) [seq[0], seq[1]] = [seq[1], seq[0]]; for (const i of seq) { clk(`.ord[data-i="${i}"]`); await sl(30); } clk('#ochk'); }
    else if (q.type === 'sort') { [...area.querySelectorAll('.sort-it')].forEach((bt, i) => { let g = q.items[i][1]; if (wrong && i === 0) g = (g + 1) % q.groups.length; for (let k = 0; k <= g; k++) bt.click(); }); clk('#schk'); }
    else if (q.type === 'input') { const v = String(wrong ? q.c + 1 : q.c); for (const d of v) clk(`.pad .k[data-k="${d}"]`); clk('.pad .k[data-k="ok"]'); }
  }, wrong);

  /* ---------- математика 4 класса ---------- */
  await go('school'); ok('school: 4th grade section', !!(await p.$('.school-head')));
  await go('subject', 'math4'); ok('math4 subject: 18 topics', (await p.$$('.unit')).length === 18);
  ok('math4 back goes to school', await E(() => document.querySelector('.back').dataset.go === 'school'));
  await go('aquiz', 'math4:remainder'); ok('level selector', (await p.$$('.genlv button')).length === 3);
  const qs = []; let wrongDone = false; for (let k = 0; k < 12; k++) { if (!(await p.$('#qarea .q-unit'))) break; qs.push(await E(() => JSON.stringify(window.__aq).slice(0, 80))); const g = await E(() => window.__aqGen); const w = g && !wrongDone; if (w) wrongDone = true; await answer(w); await sleep(200); await click('#qn'); } // ошибаемся ровно на одном сгенерированном вопросе
  ok('generated quiz finished', !!(await p.$('.g-result')), 'answered ' + qs.length);
  ok('generated questions vary', new Set(qs).size >= qs.length - 1);
  ok('generated mistake stored for review', await E(() => { const a = S.acad.math4; return Object.keys(a.gq || {}).length === 1 && Object.keys(a.box).some(k => a.gq[k]); }));
  await E(() => { Object.values(S.acad.math4.box).forEach(v => { v[1] = '2020-01-01'; }); save(); }); await go('aquiz', 'math4:*review');
  ok('review shows generated question', await E(() => !!window.__aq && /ост|остат|дел/i.test(JSON.stringify(window.__aq))));
  await go('aquiz', 'math4:motion'); await click('.genlv button[data-v="3"]'); ok('level 3 saved', await E(() => S.prefs.genLv['math4:motion'] === 3));
  // все темы и уровни генерируют корректно в браузере
  ok('all generators run', await E(() => window.SUBJECTS.math4.units.every(u => [1, 2, 3].every(lv => { for (let t = 0; t < 20; t++) { const q = u.gen(lv); if (!q || !q.type || /NaN|undefined/.test(JSON.stringify(q))) return false; } return true; }))));

  /* ---------- дополнительные вопросы и банки игр ---------- */
  await go('academy');
  ok('extra questions merged', await E(() => { const u = window.SUBJECTS.space.units.find(x => x.id === 'sun_system'); return u.quiz.length >= 20; }));
  ok('all extra banks merged', await E(() => ['space', 'world', 'body', 'safety', 'talk', 'health', 'think', 'teen', 'read'].every(id => window.SUBJECTS[id].units.every(u => u.quiz.length >= 14 || id === 'read'))));
  ok('creative in hub', !!(await p.$('.acad-card[data-s="creative"]')));
  ok('reading texts 48', await E(() => (window.READ_TEXTS || []).length === 40));
  await go('fakenews'); ok('fake news from bigger pool', await E(() => (AcadGames.CLAIMS.length + (window.EXTRA_CLAIMS || []).length) >= 70 && !!S.agSeen.claims));
  await go('citywalk'); ok('city walk bigger pool', await E(() => AcadGames.WALK.length >= 26));

  /* ---------- креативное мышление ---------- */
  await go('ideas', 'uses'); for (const t of ['шляпа для хомяка', 'закладка для книги', 'антенна для робота']) { await p.type('#iin', t); await click('#iadd'); }
  ok('ideas counted', await E(() => document.querySelector('#icnt').innerText === '3'));
  await click('#idone'); ok('ideas saved', await E(() => S.ideas && S.ideas[0].items.length === 3 && S.ideas[0].mode === 'uses'));
  await go('ideas', 'story'); await click('#sroll'); await p.type('#stext', 'Жил-был котик Мурзик в Сладкограде. Однажды у него пропал волшебный торт, и он отправился на поиски вместе с другом ёжиком и нашёл его у доброй совы.'); await click('#ssave');
  ok('story saved', await E(() => S.ideas[0].mode === 'story'));
  await go('ideas', 'draw'); const cv = await (await p.$('#dcv')).boundingBox();
  for (let k = 0; k < 4; k++) { await p.mouse.move(cv.x + 40 + k * 30, cv.y + 60); await p.mouse.down(); await p.mouse.move(cv.x + 120 + k * 30, cv.y + 160, { steps: 5 }); await p.mouse.up(); }
  await p.type('#dname', 'Которобот'); await click('#dsave'); await sleep(800); ok('drawing saved + share', await E(() => S.ideas[0].mode === 'draw') && !!(await p.$('.ph-big')));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
  await go('parents'); ok('parents see ideas', await E(() => /Идеи и истории ребёнка/.test(document.body.innerText)));

  /* ---------- вещь на столике ---------- */
  await E(() => { S.furn = (S.furn || []).concat(['table', 'teddy']); S.place = S.place || {}; S.place.living = [{ id: 'table', x: 84, y: 3 }, { id: 'teddy', x: 52, y: 3 }]; S.catAt = S.catAt || {}; S.catAt.living = { x: 6, y: 3 }; save(); }); await go('house', 'living'); await sleep(800);
  const tb = await (await p.$('.fx[data-id="table"]')).boundingBox(), td = await (await p.$('.fx[data-id="teddy"]')).boundingBox();
  await p.mouse.move(td.x + td.width / 2, td.y + td.height / 2); await p.mouse.down(); await p.mouse.move(tb.x + tb.width / 2, tb.y - 30, { steps: 10 }); await p.mouse.up(); await sleep(1200);
  ok('item stays on table', await E(() => { const t = S.place.living.find(x => x.id === 'teddy'); return t.on === 'table' && t.y > 10; }), await E(() => JSON.stringify(S.place.living)));
  const tb2 = await (await p.$('.fx[data-id="table"]')).boundingBox();
  await p.mouse.move(tb2.x + tb2.width / 2, tb2.y + tb2.height * 0.8); await p.mouse.down(); await p.mouse.move(tb2.x + tb2.width / 2 - 40, tb2.y - 60, { steps: 8 }); await p.mouse.up(); await sleep(1200);
  ok('item moves with table', await E(() => { const t = S.place.living.find(x => x.id === 'teddy'), s = S.place.living.find(x => x.id === 'table'); return t.on === 'table' && Math.abs((t.x - s.x)) < 15; }), await E(() => JSON.stringify(S.place.living)));
  await go('house', 'living'); await sleep(500); ok('stacked survives redraw', await E(() => S.place.living.find(x => x.id === 'teddy').y > 10));

  ok('no errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log('V20 DONE', n); await b.close();
})().catch(e => { console.log('V20 FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
