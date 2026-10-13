// v35: исправления по отзыву ребёнка-тестировщика (пункты 1–7 + телефон):
// весы после ошибки, двойная цифра при медленном click, утечка ввода и шпаргалка в «Быстрых лапках», нейтральный отклик при ошибке,
// «Давай разберёмся» не поверх победы и не чаще раза на тип, одно правило открытия тем, вкладки «Проверь мою тетрадь», телефон 390×844
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V35 OK ' : 'V35 FAIL ') + name + (x ? ' ' + x : '')); };
async function page(b, vp) {
  const p = await b.newPage(); await p.setViewport(vp);
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404|AudioContext/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.setBypassServiceWorker(true); await p.setRequestInterception(true);
  p.on('request', r => { const u = r.url(); if (/(murlok-api|\/api)\//.test(u)) return r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"items":[]}' }); r.continue(); });
  await p.goto(URL); await p.waitForSelector('#app'); await sleep(800); // второй вкладке профиль уже есть — экрана знакомства не будет
  await p.evaluate(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Василиса', seenVersion: APP_VERSION, rankV: 2, xp: 3000, lessons: { mul: 1, eq: 1 }, login: { last: today(), day: 1 } }))));
  await p.goto(URL); await sleep(1500);
  return p;
}
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await page(b, { width: 820, height: 1180 });
  const E = (f, ...a) => p.evaluate(f, ...a), clean = () => E(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove()));
  const go = async (s, a) => { await clean(); await E((s, a) => go(s, a), s, a); await sleep(500); };
  // медленный «палец»: нажали — и отпустили только через ms (родной click приходит поздно)
  const slowPress = async (sel, ms) => { const h = await p.$(sel); const bx = await h.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await sleep(ms); await p.mouse.up(); await sleep(150); };
  try {
    /* ---------- 1. весы: ошибка не убирает клавиатуру, ответ не виден ---------- */
    await E(() => { S.st.eq.done = 0; save(); }); await go('game', 'scales');
    ok('scales: one box + weight (level 0)', await E(() => document.querySelectorAll('#scw .box3').length === 1 && document.querySelectorAll('#sq .opt').length === 3));
    await E(() => [...document.querySelectorAll('#sq .opt')].find(o => /только с левой/.test(o.innerText)).click()); await sleep(300);
    ok('scales: wrong option tilts beam, buttons stay', await E(() => document.querySelector('#scw .scales').style.getPropertyValue('--tilt') === '-14deg' && document.querySelectorAll('#sq .opt').length === 3 && document.querySelector('#sq .opt.wrong').disabled));
    await sleep(800); await E(() => [...document.querySelectorAll('#sq .opt')].find(o => /обеих/.test(o.innerText)).click()); await sleep(800);
    const eqTxt = await E(() => document.querySelector('.eqline').innerText), right = await E(() => +document.querySelector('.pan.r .wt').innerText);
    ok('scales: answer is not shown in equation line', /x = \?/.test(eqTxt) && !new RegExp('= ' + right + '$').test(eqTxt), eqTxt);
    await E(r => { const k = d => document.querySelector(`#sq .k[data-k="${d}"]`).click(); String(r + 1).split('').forEach(k); k('ok'); }, right); await sleep(1500);
    ok('scales: after wrong answer keypad is still there', await E(() => !!document.querySelector('#sq .pad') && document.querySelector('#sin').textContent === '?'));
    await E(r => { const k = d => document.querySelector(`#sq .k[data-k="${d}"]`).click(); String(r).split('').forEach(k); k('ok'); }, right); await sleep(300);
    ok('scales: then the right answer is accepted', await E(() => !!document.querySelector('#sq .ask-eq.win')));

    /* ---------- 2. двойная цифра: родной click пришёл через 1,1 с ---------- */
    await go('game', 'scales'); await E(() => [...document.querySelectorAll('#sq .opt')].find(o => /обеих/.test(o.innerText)).click()); await sleep(800);
    await slowPress('#sq .k[data-k="5"]', 1100);
    ok('slow tap types one digit, not two', await E(() => document.querySelector('#sin').textContent) === '5', await E(() => document.querySelector('#sin').textContent));
    await slowPress('#sq .k[data-k="3"]', 200);
    ok('next tap still works', await E(() => document.querySelector('#sin').textContent) === '53');

    /* ---------- 3. «Быстрые лапки»: цифры во время показа ответа не уходят в новый пример; 📋 спрятана ---------- */
    await go('drill', 'tbl'); await sleep(300);
    ok('blitz: cheat sheet button hidden while timer runs', await E(() => { const c = document.querySelector('.cs-btn'); return !c || getComputedStyle(c).display === 'none'; }));
    await E(() => { const c = document.querySelector('.cs-btn'); if (c) c.click(); }); await sleep(300);
    ok('blitz: cheat sheet does not open during the game', !(await p.$('.cs-sheet')));
    // headless рисует медленно: показ правильного ответа (800 мс) растягиваем до 10 с, чтобы точно попасть пальцем в это окно
    await E(() => { const st0 = window.__st0 = window.setTimeout; window.setTimeout = (f, ms, ...a) => st0(f, ms === 800 ? 10000 : ms, ...a); });
    const wrong = await E(() => String(window.__bz.a + 1));
    for (const d of wrong.slice(0, -1)) await slowPress(`.pad .k[data-k="${d}"]`, 30);
    // последняя неверная цифра и сразу (пока показан правильный ответ) — нажатие 7, отпускаем уже после показа
    { const h = await p.$(`.pad .k[data-k="${wrong.slice(-1)}"]`), h7 = await p.$('.pad .k[data-k="7"]'), b1 = await h.boundingBox(), b7 = await h7.boundingBox();
      await p.mouse.click(b1.x + 10, b1.y + 10); await p.mouse.move(b7.x + 10, b7.y + 10); await p.mouse.down();
      ok('blitz: wrong answer shows the right one', await E(() => !!document.querySelector('#dv.bad, .inp.bad')));
      await p.waitForFunction(() => !document.querySelector('#dv.bad'), { timeout: 40000 }); await p.mouse.up(); await sleep(300); } // отпустили уже после показа ответа
    ok('blitz: digit pressed during the answer does not leak into next task', await E(() => document.querySelector('#dv').textContent) === '?', await E(() => document.querySelector('#q').innerText));
    await E(() => { window.setTimeout = window.__st0; }); await go('home');

    /* ---------- 4. при ошибке — без зелёной ✅; «Да!» не в начале разбора неверного ответа ---------- */
    const gp = await E(() => gpFb('Первый разряд — верно', 'Проверь'));
    ok('mistake feedback: no green check mark', !/✅/.test(gp) && /✏️/.test(gp), gp.replace(/<[^>]+>/g, ' ').slice(0, 80));
    await go('practice', 'mul'); await E(h => { const b = document.querySelector('.bubble'); b.innerHTML = h; }, gp);
    ok('mistake feedback: neutral color', await E(() => { const c = getComputedStyle(document.querySelector('.fb.gp-ok')).color, m = getComputedStyle(document.querySelector('.fb:not(.gp-ok)') || document.body).color; return c !== 'rgb(30, 158, 90)' && !/rgb\(4[0-9], 1[89][0-9], 1[45][0-9]\)/.test(c); }));
    const tf = await E(() => { const el = document.createElement('div'); document.body.appendChild(el); const q = { type: 'tf', q: 'Получилось 12: пишем 2…', c: true, why: 'Да! Единицы пишем.' }; el.innerHTML = ACAD_Q.tf.render(q); let out = null; ACAD_Q.tf.bind(el, q, (r, w) => { out = { r, w }; }); el.querySelector('.opt[data-v="0"]').click(); const right = el.querySelector('.opt[data-v="1"]').classList.contains('right'); el.remove(); return { ...out, right }; });
    ok('tf wrong: explanation starts with the right answer, not «Да!»', tf.r === false && /^Правильный ответ — <b>Правда<\/b>/.test(tf.w) && !/Да!/.test(tf.w) && tf.right, tf.w);

    /* ---------- 5. «Давай разберёмся»: не поверх победы и не чаще раза за сессию на тип ---------- */
    await go('practice', 'mul'); await E(() => { Mistakes._reset(); document.querySelector('#task').insertAdjacentHTML('beforeend', '<div class="ask-eq win">12 × 3 = 36</div>'); Mistakes.begin({ kind: 'mul', a: 79, b: 41, lv: 2 }); noteErr('carry'); noteErr('carry'); taskDone('mul', { mistakes: 2, helped: false }, { level: 2, guided: false }); });
    await sleep(2700);
    ok('offer: win on screen → no modal, soft card under it', !(await p.$('.modal')) && !!(await p.$('#after .mk-soft #mkles')));
    await go('practice', 'mul'); await E(() => { Mistakes._lp0(); Mistakes.begin({ kind: 'mul', a: 78, b: 42, lv: 2 }); noteErr('carry'); noteErr('carry'); taskDone('mul', { mistakes: 2, helped: false }, { level: 2, guided: false }); });
    await sleep(2700);
    ok('offer: same mistake type again → not shown twice', !(await p.$('.modal')) && !(await p.$('.mk-soft')));
    await E(() => { Mistakes._lp0(); Mistakes.begin({ kind: 'mul', a: 77, b: 43, lv: 2 }); noteErr('tbl', '7×7'); noteErr('tbl', '7×7'); taskDone('mul', { mistakes: 2, helped: false }, { level: 2, guided: false }); });
    await sleep(2700);
    ok('offer: other mistake type → modal (no win on screen)', /путаешь таблицу/.test(await E(() => (document.querySelector('.modal') || {}).innerText || '')));

    /* ---------- 6. открытие тем: одно правило «хотя бы ⭐ в тренажёре», текст правдивый ---------- */
    await E(() => { const a = acad('math4'); a.read = {}; a.best = { motion: 2 }; a.seen = {}; a.box = {}; save(); });
    ok('math4: ★★ without textbook opens next topic', await E(() => Mistakes.unitOpen('math4', 'motion_two')));
    await E(() => { const a = acad('math4'); a.best = { motion: 0 }; a.read = { motion: true }; save(); });
    ok('math4: 0 stars keeps next topic locked', await E(() => !Mistakes.unitOpen('math4', 'motion_two')));
    await go('school'); await E(() => document.querySelectorAll('details.sgroup').forEach(d => { d.open = true; }));
    ok('lock text says what is needed (⭐)', /хотя бы ⭐/.test(await E(() => document.querySelector('.unit[data-u="motion_two"] .lockb').innerText)));
    ok('written computations: addition first, all three open', await E(() => { const cs = [...document.querySelectorAll('.school-card')].map(c => c.className); return /add/.test(cs[0]) && !document.querySelector('.school-card.div.locked') && !document.querySelector('.school-card.mul.locked'); }));
    await E(() => document.querySelector('.unit[data-u="motion_two"]').click()); await sleep(300);
    ok('tap on locked topic → toast explains', /хотя бы ⭐/.test(await E(() => [...document.querySelectorAll('.toast')].map(t => t.innerText).join(' '))));
    const sp = await E(() => { const s = SUBJECTS.space, a = acad('space'); a.read = {}; a.best = {}; a.seen = {}; a.box = {}; a.best[s.units[0].id] = 1; save(); return [Mistakes.unitOpen('space', s.units[1].id), Mistakes.unitOpen('space', s.units[2].id)]; });
    ok('other subjects: same rule (⭐ opens next)', sp[0] === true && sp[1] === false, JSON.stringify(sp));

    /* ---------- 7. «Проверь мою тетрадь»: вкладки — не портреты ---------- */
    await go('paper', 'mul');
    ok('paper tabs: no .pt portrait class, normal size', await E(() => { const t = document.querySelector('.mk-paper .seg'); return t && !t.classList.contains('pt') && t.classList.contains('pp-tabs') && parseFloat(getComputedStyle(t).fontSize) < 30 && getComputedStyle(t).animationName === 'none'; }));

    /* ---------- 9. тексты ---------- */
    ok('texts: no «(а)» in mistake hints for a known girl name', await E(() => !/\(а\)/.test(Mistakes.mulSteps ? JSON.stringify(Mistakes.mulSteps(47, 36)) : '')));
  } catch (e) { ok('crash ' + e.message, false); }

  /* ---------- 15. телефон 390×844: столбик ---------- */
  try {
    const q = await page(b, { width: 390, height: 844, isMobile: true, hasTouch: true });
    const E2 = (f, ...a) => q.evaluate(f, ...a);
    await E2(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); go('practice', 'mul'); }); await sleep(2500);
    await E2(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
    const L = await E2(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; }; const top = r('header.top'), cs = r('header.top .cs-btn'), st = document.querySelector('.story-card'), ti = r('.task-title');
      return { csIn: !cs || (cs.top >= top.top && cs.bottom <= top.bottom + 1 && cs.top < top.top + 60), storyFull: !st || st.scrollHeight <= st.clientHeight + 2, storyAbove: !st || !ti || st.getBoundingClientRect().bottom <= ti.top + 1, stB: st && Math.round(st.getBoundingClientRect().bottom), tiT: ti && Math.round(ti.top), sw: document.documentElement.scrollWidth }; });
    ok('phone: 📋 sits in the header row, not on a second line', L.csIn, JSON.stringify(L));
    ok('phone: task story fully visible and above the title', L.storyFull && L.storyAbove, JSON.stringify(L));
    ok('phone: no horizontal scroll', L.sw <= 390, String(L.sw));
    await E2(() => { const cells = [...document.querySelectorAll('.mgrid .cell')]; const last = cells[cells.length - 2]; document.querySelectorAll('.cell.target').forEach(c => c.classList.remove('target')); last.classList.add('target'); }); await sleep(900);
    const vis = await E2(() => { const t = document.querySelector('.cell.target').getBoundingClientRect(), c = document.querySelector('.ctrl-col').getBoundingClientRect(); return { t: Math.round(t.bottom), c: Math.round(c.top) }; });
    ok('phone: bottom (sum) cell scrolled above the keypad panel', vis.t <= vis.c, JSON.stringify(vis));
  } catch (e) { ok('phone crash ' + e.message, false); }
  errors.forEach(e => console.log('V35 FAIL ' + e)); if (errors.length) fails++;
  console.log(fails ? `V35 FAIL ${fails}/${n}` : `V35 DONE ${n}`);
  await b.close(); process.exit(fails ? 1 : 0);
})();
