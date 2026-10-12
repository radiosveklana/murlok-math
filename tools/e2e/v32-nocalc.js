// v32: в предметах Академии (кроме математики) нет задач на счёт — ни в тренажёре (статика + генераторы на всех уровнях),
// ни в «Смешанной тренировке», ни в «Ошибках Енота», ни в «Новом деле». «Новое дело → Выбрать темы» с закрытыми темами Академии не подменяет их математикой.
// node tools/e2e/v32-nocalc.js   (URL=http://localhost:8797/app/)
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let fails = 0;
const ok = (name, c, x = '') => { if (!c) fails++; console.log((c ? 'V32 OK ' : 'V32 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, candies: 100, login: { last: today(), day: 1 } }))); });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Modes === 'object' && typeof go === 'function' && typeof isCalcQ === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await sleep(800); }
  await sleep(1000);
  const E = (f, ...a) => p.evaluate(f, ...a);
  const strip = 'h => String(h || "").replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim()';

  /* ---------- детектор узнаёт задачи на счёт (контроль, что проверка не «пустая») ---------- */
  const det = await E(() => {
    const m4 = SUBJECTS.math4; let n = 0, c = 0;
    ['time', 'motion', 'work', 'buy'].forEach(id => { const u = m4.units.find(x => x.id === id); for (let i = 0; i < 90; i++) { n++; if (isCalcQ(u.gen(1 + i % 3))) c++; } });
    return { n, c, sample: isCalcQ({ type: 'input', q: 'Сова за ночь ловит 3 мыши. Сколько мышей она поймает за неделю?', c: 21, why: '3 × 7 = 21.' }), fact: isCalcQ({ type: 'input', q: 'Сколько сердец у осьминога?', c: 3, why: 'Три сердца.' }) };
  });
  ok('detector: catches math4 story problems, ignores plain facts', det.c / det.n > 0.6 && det.sample && !det.fact, JSON.stringify(det));

  /* ---------- 🔍 Новое дело ---------- */
  const caseRun = (topics, acadIds) => E((topics, acadIds) => {
    document.querySelectorAll('.modal').forEach(m => m.remove()); document.querySelectorAll('.toast').forEach(t => t.remove());
    S.prefs.caseTopics = topics; S.prefs.caseAcad = acadIds; CASE = null; window.GOD = false;
    startCase('pick', 1);
    const toast = [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '), modal = !!document.querySelector('.tb-modal');
    const tasks = CASE ? CASE.tasks : [];
    const r = { started: !!CASE, n: tasks.length, acad: tasks.filter(t => t.acad || (t.kind === 'aq' && /^[a-z]+:/.test(t.src || '') && !/^math4:/.test(t.src || ''))).length, math: tasks.filter(t => !t.acad).length, calc: tasks.filter(t => t.q && isCalcQ(t.q) && !/^math4:/.test(t.src || '')).length, toast, modal };
    document.querySelectorAll('.modal').forEach(m => m.remove()); return r;
  }, topics, acadIds);
  // закрытая тема Академии (последний урок окружайки ещё не открыт) — свидетели спрашивают про открытые темы Академии, без математики
  const locked = await E(() => { const s = subj('world'), u = s.units[s.units.length - 1]; return { id: 'world:' + u.id, open: Mistakes.unitOpen('world', u.id) }; });
  ok('fixture: last world unit is locked', !locked.open, JSON.stringify(locked));
  let r = await caseRun([], [locked.id]);
  ok('new case, locked academy topic: no math substitution', r.started && r.n === 4 && r.math === 0 && r.calc === 0 && /закрыт/.test(r.toast), JSON.stringify(r));
  r = await caseRun([], ['world:no_such_unit', 'space:nope']);
  ok('new case, vanished academy topics: academy only, friendly toast', r.started && r.n === 4 && r.math === 0 && /закрыт/.test(r.toast), JSON.stringify(r));
  const openW = await E(() => { const s = subj('world'); return 'world:' + s.units.find(u => Mistakes.unitOpen('world', u.id)).id; });
  r = await caseRun([], [openW]);
  ok('new case, open academy topic: 4 witnesses from Academy, no calc', r.started && r.n === 4 && r.math === 0 && r.calc === 0, JSON.stringify(r));
  r = await caseRun(['nope-topic'], []);
  ok('new case, vanished school topics: asks to pick again (no silent math)', !r.started && r.modal, JSON.stringify(r));
  // школа + закрытая Академия: 2 школьные задачи + 2 свидетеля Академии (из открытых тем)
  const schoolId = await E(() => TaskBank.list().filter(x => !x.acad)[0].id);
  r = await caseRun([schoolId], [locked.id]);
  ok('new case, school + locked academy: academy witnesses kept', r.started && r.n === 4 && r.acad === 2, JSON.stringify(r));
  // все уроки Академии закрыты — дело не начинается, вместо математики — подсказка и выбор тем
  r = await E(() => { const uo = Mistakes.unitOpen; Mistakes.unitOpen = () => false; try { CASE = null; S.prefs.caseTopics = []; S.prefs.caseAcad = ['world:x']; startCase('pick', 1); return { started: !!CASE, modal: !!document.querySelector('.tb-modal'), toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ') }; } finally { Mistakes.unitOpen = uo; document.querySelectorAll('.modal').forEach(m => m.remove()); } });
  ok('new case, academy fully locked: no case, picker opened', !r.started && r.modal && /закрыт/.test(r.toast), JSON.stringify(r));

  /* ---------- 🎯 тренажёр: по 300+ вопросов на предмет, все темы и все уровни генераторов ---------- */
  const subs = await E(() => ACAD_ORDER.filter(id => SUBJECTS[id]));
  const summary = [];
  for (const sid of subs) {
    const r = await E(async (sid, strip) => {
      const S2 = subj(sid), st = eval(strip), seen = [], bad = []; window.GOD = true; // GOD — без «уже решено», чтобы видеть весь банк
      const units = S2.units.filter(u => u.quiz && u.quiz.length);
      for (let round = 0; seen.length < 300 && round < 40; round++) for (const u of units) {
        const lvs = u.gen ? [1, 2, 3] : [1];
        for (const lv of lvs) { S.prefs.genLv = S.prefs.genLv || {}; S.prefs.genLv[sid + ':' + u.id] = lv; go('aquiz', sid + ':' + u.id); (window.__aqItems || []).forEach(it => { seen.push(it); if (!calcAllowed(S2, it.u) && isCalcQ(it.q)) bad.push(u.id + ' L' + lv + ': ' + st(it.q.q || it.q.story).slice(0, 90)); }); }
      }
      // смешанная тренировка
      units.forEach(u => { acad(sid).read[u.id] = true; });
      for (let i = 0; i < 5; i++) { go('aquiz', sid + ':*mix'); (window.__aqItems || []).forEach(it => { seen.push(it); if (!calcAllowed(S2, it.u) && isCalcQ(it.q)) bad.push('*mix: ' + st(it.q.q).slice(0, 90)); }); }
      window.GOD = false; go('subject', sid);
      return { sid, n: seen.length, gen: seen.filter(x => x.gen).length, bad: bad.length, ex: bad.slice(0, 3) };
    }, sid, strip);
    summary.push(r.sid + ':' + r.n + '/' + r.gen + 'g');
    ok('trainer ' + sid + ': ' + r.n + ' items (' + r.gen + ' generated), no calc', r.n >= 300 && r.bad === 0, r.bad ? JSON.stringify(r.ex) : '');
  }
  console.log('V32 note trainer samples ' + summary.join(' '));

  /* ---------- старые ошибки-«примеры» в разборе ошибок не возвращаются ---------- */
  const rev = await E(() => {
    const out = [];
    ACAD_ORDER.filter(id => SUBJECTS[id]).forEach(id => { const a = acad(id), s = subj(id); a.gq = a.gq || {}; a.gq[s.units[0].id + '#gOLD'] = { type: 'input', q: 'Из бочки каждый день испаряется 4 л воды. Сколько литров испарится за 7 дней?', c: 28, why: '4 × 7 = 28 л.' }; a.box[s.units[0].id + '#gOLD'] = [0, '2020-01-01']; out.push(dueMistakes(id).includes(s.units[0].id + '#gOLD') || !!a.box[s.units[0].id + '#gOLD']); });
    return out.filter(Boolean).length;
  });
  ok('review: legacy calc mistakes are dropped', rev === 0, 'left ' + rev);

  /* ---------- 🦝 Ошибки Енота и «Быстрые лапки»: вопросы Академии без счёта ---------- */
  const modes = await E(() => {
    const bad = []; let n = 0;
    Modes.acadSubs().forEach(s => s.units.forEach(u => { if (calcAllowed(s, u)) return;
      Modes.unitQs(u).forEach(q => { n++; if (isCalcQ(q)) bad.push(s.id + ':' + u.id + ' ' + String(q.q || q.story).replace(/<[^>]+>/g, ' ').slice(0, 80)); });
      for (let i = 0; i < 20; i++) { const q = Modes.qFromUnit(s, u); if (!q) break; n++; if (isCalcQ(q)) bad.push(s.id + ':' + u.id + ' ' + String(q.q || q.story).replace(/<[^>]+>/g, ' ').slice(0, 80)); } }));
    let nb = 0; Modes.acadSubs().forEach(s => { const f = Modes.bugSource('S:' + s.id); for (let i = 0; i < 20; i++) if (f()) nb++; });
    const facts = Modes.acadSubs().flatMap(s => Modes.factItems(s).filter(it => isCalcQ({ type: 'one', q: it.t, a: it.opts, c: it.c, why: it.why })).map(it => s.id + ' ' + it.t.slice(0, 60)));
    return { n, nb, bad: bad.length, ex: bad.slice(0, 3), facts: facts.length, fex: facts.slice(0, 3) };
  });
  ok('raccoon (Academy subjects): no calc questions', modes.n > 2000 && modes.nb > 200 && modes.bad === 0, JSON.stringify(modes));
  ok('fast paws facts: no calc questions', modes.facts === 0, JSON.stringify(modes.fex));

  /* ---------- 🌍 «Задачи о мире» теперь в математике ---------- */
  const w = await E(() => { const m4 = SUBJECTS.math4; let n = 0; ['time', 'motion', 'work'].forEach(id => { const u = m4.units.find(x => x.id === id); for (let i = 0; i < 200; i++) { const q = u.gen(1 + i % 3); if (q && q.world && /Задача о мире/.test(q.q) && Number.isInteger(q.c)) n++; } }); return n; });
  ok('math4: world story problems in time/motion/work', w > 60, 'n=' + w);

  ok('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log(fails ? 'V32 FAIL total ' + fails : 'V32 DONE all ok');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('V32 FAIL crash ' + e.message); process.exit(1); });
