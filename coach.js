/* coach.js — тренер-котик: модель навыков, учёт времени, «Котик советует» (задание роста + испытание мастера),
   честная теория («Проверь себя»), таланты и отчёт для взрослых, ПИН раздела для взрослых.
   Подключается обёртками (taskDone, finishGame, экраны) — старый код не переписывается. */
'use strict';
const Coach = (() => {
  const C = () => { S.coach = S.coach || {}; const c = S.coach; c.stats = Object.assign({ growDone: 0, masterDone: 0, overcome: [], cured: 0, bestStreak: 0, fail: 0, cont: 0 }, c.stats || {}); return c; };
  const SK = () => (S.sk = S.sk || {});
  const TH = () => (S.theory = S.theory || {});
  const CORE = ['mul1', 'mul2', 'mul3', 'mul4', 'eq1', 'eq2', 'eq3', 'eq4'];
  const isCore = id => /^(mul|eq)\d$/.test(id);
  const ago = d => d ? Math.floor((new Date(today()) - new Date(d)) / 864e5) : 999;
  const dayList = (from, n) => { const out = []; for (let k = from + n - 1; k >= from; k--) { const d = new Date(); d.setDate(d.getDate() - k); out.push(dkey(d)); } return out; };

  /* ---------- справочник навыков ---------- */
  function info(id) {
    let m;
    if ((m = id.match(/^(mul|eq)(\d)$/))) { const mul = m[1] === 'mul', L = (mul ? E.MUL_LEVELS : E.EQ_LEVELS)[m[2]]; if (!L) return null; return { name: (mul ? 'Столбик' : 'Уравнения') + ' · ' + L.name, short: mul ? 'умножение столбиком' : 'уравнения', icon: mul ? '✖️' : '📦', area: 'math', need: 3, go: () => { S.prefs[m[1] + 'Lv'] = +m[2]; S.prefs[m[1] + 'LvChosen'] = true; save(); go('practice', m[1]); } }; }
    if (id === 'blitz') return { name: 'Таблица умножения (блиц)', short: 'таблица умножения', icon: '⚡', area: 'math', need: 1, go: () => go('blitz') };
    if (id === 'bug') return { name: 'Поиск ошибок', short: 'поиск ошибок', icon: '🦝', area: 'math', need: 3, go: () => go('bugs') };
    if ((m = id.match(/^g:(\w+)$/))) { const g = (window.GAMES_LIST || []).find(x => x.id === m[1]); if (!g) return null; return { name: g.name, short: g.skill ? g.skill.toLowerCase() : g.name, icon: g.icon, area: 'games', need: 1, go: () => go('game', g.id) }; }
    if ((m = id.match(/^a:(\w+)$/))) { const s = (window.SUBJECTS || {})[m[1]]; if (!s) return null; return { name: s.name, short: s.name.toLowerCase(), icon: s.icon, area: 'academy', need: 1, go: () => go('subject', s.id) }; }
    if ((m = id.match(/^a:(\w+):(\w+)$/))) { const s = (window.SUBJECTS || {})[m[1]], u = s && s.units.find(x => x.id === m[2]); if (!u) return null; return { name: s.name + ': ' + u.title, short: u.title.toLowerCase(), icon: u.icon, area: 'academy', need: 1, go: () => go('aquiz', s.id + ':' + u.id) }; }
    return null;
  }
  function status(s) { if (!s || s.n < 4) return 'new'; if (s.a < 0.55) return 'hard'; if (s.a >= 0.88 && s.n >= 10) return 'star'; if (s.a >= 0.8) return 'solid'; return 'grow'; }
  const ST_NAME = { new: 'знакомится', hard: 'пока трудно', grow: 'учится', solid: 'уверенно', star: '⭐ талант' };
  function trend(s) { // точность за 7 дней против предыдущих 7
    if (!s || !s.d) return null; const sum = days => days.reduce((t, d) => { const x = s.d[d]; if (x) { t[0] += x[0]; t[1] += x[1]; } return t; }, [0, 0]);
    const a = sum(dayList(0, 7)), b = sum(dayList(7, 7)); if (a[0] < 2 || b[0] < 2) return null; return Math.round((a[1] / a[0] - b[1] / b[0]) * 100);
  }

  /* ---------- события ---------- */
  let pendingFail = false, lastEvt = 0, scrAt = Date.now();
  function track(id, v, o = {}) {
    if (!id || !S.kid) return; v = Math.max(0, Math.min(1, +v || 0));
    const all = SK(), s = all[id] = all[id] || { n: 0, a: 0, sp: 0, pf: 0, h: [], d: {} }, before = status(s), w = o.guided ? 0.1 : 0.25;
    s.a = s.n ? s.a * (1 - w) + v * w : v; s.n++; if (v >= 1) s.pf++;
    const sec = o.sec != null ? o.sec : Math.min(600, (Date.now() - Math.max(lastEvt, scrAt)) / 1000); lastEvt = Date.now();
    if (sec > 1) s.sp = s.sp ? s.sp * 0.7 + sec * 0.3 : sec;
    s.h.push(v >= 1 ? 1 : v >= 0.5 ? 0.5 : 0); if (s.h.length > 12) s.h.shift();
    const t = today(); if (!s.d[t]) { Object.keys(s.d).forEach(d => { if (ago(d) > 40) delete s.d[d]; }); s.d[t] = [0, 0]; } s.d[t][0]++; s.d[t][1] = Math.round((s.d[t][1] + v) * 100) / 100;
    s.last = t; if (o.level) s.lv = o.level;
    S.hours = S.hours || Array(24).fill(0); S.hours[new Date().getHours()]++;
    const st = C().stats; if (pendingFail) { st.cont++; pendingFail = false; } if (v < 1) { st.fail++; pendingFail = true; }
    st.bestStreak = Math.max(st.bestStreak || 0, streak());
    const after = status(s), inf = info(id);
    if (before === 'hard' && (after === 'solid' || after === 'star') && !st.overcome.includes(id)) { st.overcome.push(id); setTimeout(() => { toast(`<span class="tb">🌅</span><div><b>Преодоление!</b><br>${inf ? inf.name : ''} — было трудно, а теперь получается!</div>`); confetti(25); }, 1800); }
    if (before !== 'star' && after === 'star' && inf) setTimeout(() => toast(`<span class="tb">⭐</span><div><b>Новый талант!</b><br>${inf.name}</div>`), 2600);
    if (o.count !== false) tick(id, v);
    save();
  }
  const resV = r => r.helped ? 0.5 : [1, 0.6, 0.3][r.mistakes || 0] ?? 0;

  /* ---------- «Котик советует» ---------- */
  function topicN(tp) { return CORE.filter(x => x.startsWith(tp)).reduce((t, x) => t + ((SK()[x] || {}).n || 0), 0); }
  function topicLast(tp) { return CORE.filter(x => x.startsWith(tp)).map(x => (SK()[x] || {}).last).filter(Boolean).sort().pop(); }
  function avoided(tp) { const n = topicN(tp), last = topicLast(tp); if (n < 3 || !last) return false; const recent = dayList(0, 3).some(d => S.days[d]); return ago(last) >= 5 && recent; }
  function plan() {
    const c = C(), t = today();
    if (c.date !== t) { c.date = t; c.grow = pickGrow(); c.master = pickMaster(); save(); }
    if (c.grow && !info(c.grow.id)) c.grow = null; if (c.master && !info(c.master.id)) c.master = null;
    return c;
  }
  function pickGrow() {
    const sk = SK(), cand = [], lv = tp => S.prefs[tp + 'Lv'] || 2;
    CORE.forEach(id => { if (status(sk[id]) === 'hard') cand.push([id, 100 + (id.startsWith('eq') ? 5 : 0), 'hard']); });
    ['mul', 'eq'].forEach(tp => { if (avoided(tp)) cand.push([tp + lv(tp), 85, 'avoid']); });
    const nm = topicN('mul'), ne = topicN('eq');
    if (nm >= 6 && ne < nm * 0.4) cand.push(['eq' + lv('eq'), 75, 'avoid']);
    if (ne >= 6 && nm < ne * 0.4) cand.push(['mul' + lv('mul'), 70, 'avoid']);
    Object.keys(sk).filter(id => !isCore(id) && !id.startsWith('a:teen') && status(sk[id]) === 'hard' && info(id)).forEach(id => cand.push([id, 60, 'hard']));
    if (!cand.length) { const tp = ne <= nm ? 'eq' : 'mul', s = sk[tp + lv(tp)], up = ['solid', 'star'].includes(status(s)) && lv(tp) < 4; cand.push([tp + (up ? lv(tp) + 1 : lv(tp)), 10, up ? 'next' : 'base']); }
    cand.sort((a, b) => b[1] - a[1]); const [id, , why] = cand[0], inf = info(id);
    const theory = isCore(id) && why === 'hard' && !(TH()['t:' + id.replace(/\d/, '')] || {}).verified;
    return { id, why, need: inf ? inf.need : 3, got: 0, done: false, theory };
  }
  function talents() {
    const sk = SK(); return Object.keys(sk).filter(id => !id.startsWith('a:teen') && status(sk[id]) === 'star' && info(id)).sort((a, b) => sk[b].a * Math.log(sk[b].n + 1) - sk[a].a * Math.log(sk[a].n + 1));
  }
  function pickMaster() {
    const t = talents(); if (!t.length) return null; const from = t[0];
    let m = from.match(/^(mul|eq)(\d)$/), id = from;
    if (m && +m[2] < 4) id = m[1] + (+m[2] + 1);
    return { id, from, need: isCore(id) ? 2 : 1, got: 0, done: false };
  }
  function tick(id, v) {
    const c = C(); if (c.date !== today()) return;
    const g = c.grow; if (g && !g.done && g.id === id) { g.got++; if (g.got >= g.need) { g.done = true; c.stats.growDone++; setTimeout(() => { award(6, 20); awardGems(1, 'за задание котика — ты справился с трудным!'); confetti(35); say('Задание котика выполнено! Ты молодец, {n}!', 0, { prio: 1 }); }, 1700); } }
    const m = c.master; if (m && !m.done && m.id === id && v >= 1) { m.got++; if (m.got >= m.need) { m.done = true; c.stats.masterDone++; setTimeout(() => { awardGems(2, 'за испытание мастера — вот это талант!'); confetti(45); }, 2000); } }
  }
  const WHY = { hard: 'Пока трудно — раскроем эту тайну вместе!', avoid: 'Давно не тренировались — котик соскучился!', next: 'Новая ступенька — ты уже готов(а)!', base: 'Потренируем лапки!' };
  function homeHTML() {
    const c = plan(), g = c.grow, m = c.master, t = talents().slice(0, 2), gi = g && info(g.id), mi = m && info(m.id);
    if (!gi && !mi && !t.length) return '';
    const card = (kind, o, inf, ttl, rew, sub) => `<button class="cm ${kind} ${o.done ? 'done' : ''}" data-coach="${kind}"><span class="cmi">${o.done ? '✅' : inf.icon}</span><span class="cmb"><b>${ttl}: ${inf.name}</b><small>${o.done ? 'Выполнено! Награда получена 🎉' : sub}</small><span class="bar"><i style="width:${Math.min(1, o.got / o.need) * 100}%"></i></span></span><span class="cmr">${o.done ? '' : rew}<br><small>${o.got}/${o.need}</small></span></button>`;
    const unit = o => isCore(o.id) || o.id === 'bug' ? plural(o.need, 'задача', 'задачи', 'задач') : o.id.startsWith('a:') ? 'тренажёр' : 'игра';
    return `<section class="coach"><div class="coach-h">🐾 Котик советует</div>
      ${gi ? card('grow', g, gi, '🌱 Задание роста', '+6🍬 +1💎', `${WHY[g.why] || ''} ${g.need} ${unit(g)}${g.theory ? ' · можно начать с урока 📖' : ''}`) : ''}
      ${mi ? card('master', m, mi, '🏆 Испытание мастера', '+2💎', `Ты в этом звезда — попробуй сложнее! ${m.need} ${m.need > 1 ? 'задачи без ошибок' : 'без ошибок'}`) : ''}
      ${t.length ? `<div class="talent">⭐ ${t.length > 1 ? 'Твои таланты' : 'Твой талант'}: <b>${t.map(x => info(x).name).join(', ')}</b></div>` : ''}</section>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-coach]'); if (!b) return; SND.tap(); const c = plan(), o = c[b.dataset.coach]; if (!o) return; const inf = info(o.id);
    if (o.done) { toast('Это задание уже выполнено — завтра будет новое! 🐾'); return; }
    if (b.dataset.coach === 'grow' && o.theory) {
      const tp = o.id.replace(/\d/, ''), m = modal(`<div class="big-emoji">📖🐾</div><h2>С чего начнём?</h2><p>Можно сначала заглянуть в урок — там всё объяснено по шагам. А можно сразу решать: котик подскажет.</p><div class="row-btns"><button class="btn" id="cth">📖 Сначала урок</button><button class="btn pink" id="cgo">🐾 Сразу задачи</button></div>`);
      $('#cth', m.el).addEventListener('click', () => { m.close(); go('lesson', tp); }); $('#cgo', m.el).addEventListener('click', () => { m.close(); inf.go(); }); return;
    }
    inf.go();
  });
  function decorate(scr) { // метки «котик советует»
    const c = C(); if (c.date !== today()) return; const ids = [c.grow, c.master].filter(o => o && !o.done).map(o => o.id);
    const mark = el => { if (el && !el.querySelector('.recb')) { el.classList.add('rec'); el.insertAdjacentHTML('beforeend', '<span class="recb">🔥 Котик советует</span>'); } };
    ids.forEach(id => {
      let m;
      if (scr === 'games' && (m = id.match(/^g:(\w+)$/))) mark($(`.game-card[data-g="${m[1]}"]`, app));
      if (scr === 'academy' && (m = id.match(/^a:(\w+)/))) mark($(`.acad-card[data-s="${m[1]}"]`, app));
      if (scr === 'school' && isCore(id)) mark($(`.school-card.${id.replace(/\d/, '')}`, app));
    });
  }

  /* ---------- честная теория ---------- */
  function lessonTimer(n) {
    const dw = Array(n).fill(0), need = Array(n).fill(3000), heard = Array(n).fill(false); let cur = -1, t0 = 0;
    return {
      show(i, text) { this.leave(); cur = i; t0 = Date.now(); const w = String(text || '').split(/\s+/).filter(Boolean).length; need[i] = Math.min(20000, Math.max(3000, w * 250)); },
      leave() { if (cur >= 0) dw[cur] += Date.now() - t0; cur = -1; },
      heard(i) { heard[i] = true; },
      share() { this.leave(); return dw.filter((d, i) => heard[i] || d >= need[i]).length / n; },
      secs() { return Math.round(dw.reduce((a, b) => a + b, 0) / 1000); },
    };
  }
  const MATH_CHECK = {
    mul: [
      { type: 'one', q: 'С какой цифры начинаем умножать столбиком?', a: ['С правой — с единиц', 'С левой', 'С самой большой', 'С любой'], c: 0, why: 'Столбиком всегда идём <b>справа налево</b>: единицы, потом десятки.' },
      { type: 'one', q: 'Умножаем на цифру десятков. Где пишем результат?', a: ['Со сдвигом на одну клетку влево', 'Прямо под единицами', 'Со сдвигом вправо', 'В самом низу'], c: 0, why: 'Это десятки, поэтому строка сдвигается на одну клетку влево (нолик можно не писать).' },
      { type: 'tf', q: 'Получилось 12: пишем 2, а 1 запоминаем и прибавляем к следующему произведению.', c: true, why: 'Да! Единицы пишем, десятки «запоминаем» над следующей цифрой.' },
      { type: 'one', q: 'Сколько будет 324 × 20?', a: ['6480', '648', '64800', '3240'], c: 0, why: '324 × 2 = 648, а × 20 — ещё и × 10: 6480.' },
    ],
    eq: [
      { type: 'one', q: 'Как найти неизвестное слагаемое?', a: ['Из суммы вычесть известное слагаемое', 'Сложить сумму и слагаемое', 'Умножить сумму на слагаемое', 'Разделить сумму пополам'], c: 0, why: 'x + 5 = 12 → x = 12 − 5.' },
      { type: 'one', q: 'x : 4 = 5. Как найти делимое x?', a: ['5 · 4', '5 : 4', '5 + 4', '4 − 5'], c: 0, why: 'Делимое = частное · делитель: x = 5 · 4 = 20.' },
      { type: 'one', q: 'В уравнении x · 3 + 15 = 60 какое действие последнее?', a: ['Сложение (+ 15)', 'Умножение (· 3)', 'Они одновременно', 'Деление'], c: 0, why: 'Сначала умножение, потом сложение — значит, последнее действие «+ 15». «x · 3» прячем в коробку.' },
      { type: 'tf', q: 'Когда нашли x, его стоит проверить: подставить в уравнение.', c: true, why: 'Проверка — это алиби ответа!' },
    ],
  };
  const mathCheck = tp => shuffle(MATH_CHECK[tp] || []).slice(0, 2);
  function checkpoint(qs, cb) {
    if (!qs || !qs.length || typeof ACAD_Q === 'undefined') return cb(0, 0);
    let k = 0, ok = 0;
    const m = modal(`<div class="cp"><h2>🔎 Проверь себя</h2><p class="small center">Два коротких вопроса по уроку</p><div id="cpq"></div><div id="cpw" class="cp-why"></div><div id="cpa"></div></div>`, 'cp-sheet');
    const show = () => {
      const q = qs[k], T = ACAD_Q[q.type] || ACAD_Q.one; $('#cpw', m.el).innerHTML = ''; $('#cpa', m.el).innerHTML = '';
      $('#cpq', m.el).innerHTML = `<div class="cp-q" data-c="${q.type === 'tf' ? (q.c ? 1 : 0) : q.c}">${T.render(q)}</div>`;
      T.bind($('#cpq', m.el), q, (r, why) => {
        if (r) { ok++; SND.ok(); } else SND.bad();
        $('#cpw', m.el).innerHTML = (r ? '<div class="fb">✔ Верно!</div>' : '<div class="fb bad">Не совсем.</div>') + (why || '');
        $('#cpa', m.el).innerHTML = `<button class="btn pink" id="cpn">${k + 1 < qs.length ? 'Дальше →' : 'Готово ✔'}</button>`;
        $('#cpn', m.el).addEventListener('click', () => { k++; if (k < qs.length) show(); else { m.close(); cb(ok, qs.length); } });
      });
    };
    show();
  }
  function finishLesson(key, timer, qs, next, o = {}) {
    const share = timer.share(), rec = TH()[key] = TH()[key] || { seen: 0, verified: false };
    rec.seen++; rec.at = today(); rec.read = Math.max(rec.read || 0, Math.round(share * 100)); rec.secs = (rec.secs || 0) + timer.secs();
    checkpoint(qs, (score, n) => {
      const good = share >= 0.7 && (!n || score >= Math.ceil(n / 2)), first = good && !rec.verified;
      rec.score = n ? score + '/' + n : ''; if (good) rec.verified = true; save();
      if (first) { award(o.c != null ? o.c : 5, o.xp != null ? o.xp : 20); setTimeout(() => toast(`<span class="tb">📖</span><div><b>Урок изучен!</b><br>Ты прочитал${/[аяь]$/i.test(S.kid || '') ? 'а' : ''} и ответил${/[аяь]$/i.test(S.kid || '') ? 'а' : ''} на вопросы — так и учатся настоящие сыщики.</div>`), 500); }
      else if (!good && !rec.verified) setTimeout(() => toast(`<span class="tb">📖</span><div>${share < 0.7 ? 'Урок пролистан очень быстро. Награда за урок — когда его прочитаешь 🙂' : 'Почти! Загляни в урок ещё раз — и всё получится.'}</div>`), 500);
      next(good);
    });
  }

  /* ---------- учёт времени ---------- */
  const AREA = { practice: 'math', lesson: 'math', school: 'math', casetask: 'math', newcase: 'math', caseintro: 'math', accuse: 'math', solved: 'math', blitz: 'math', bugs: 'math', games: 'games', game: 'games', academy: 'academy', subject: 'academy', alesson: 'academy', aquiz: 'academy', asearch: 'academy', house: 'house', shop: 'shop', chat: 'chat', studio: 'studio', photo: 'photo', home: 'other', book: 'other' };
  const AREA_NAME = { math: 'Математика и дела', games: 'Детективные игры', academy: 'Академия', house: 'Домик котика', shop: 'Кондитерская', chat: 'Разговоры с котиком', studio: 'Студия звуков', photo: 'Фотостудия', other: 'Главная и прочее' };
  let lastAct = Date.now();
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, { capture: true, passive: true }));
  setInterval(() => {
    if (document.hidden || !S.kid || Date.now() - lastAct > 90000 || curScreen === 'parents') return;
    S.time = S.time || {}; const t = today(), d = S.time[t] = S.time[t] || {}, a = AREA[curScreen] || 'other'; d[a] = (d[a] || 0) + 20;
    if (Object.keys(S.time).length > 70) Object.keys(S.time).sort().slice(0, -60).forEach(k => delete S.time[k]);
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
  }, 20000);
  const minsOf = d => { const x = (S.time || {})[d]; return x ? Object.values(x).reduce((a, b) => a + b, 0) / 60 : 0; };

  /* ---------- отчёт для взрослых ---------- */
  const TIPS = {
    mul: 'Попросите проговаривать шаги вслух: «умножаю, пишу единицы, десятки запоминаю». 5 минут «Быстрых лапок» в день укрепят таблицу — на ней держится весь столбик.',
    eq: 'Помогает «метод коробки»: закройте часть уравнения ладонью и спросите «какое число здесь спрятано?». Хвалите за проверку ответа — это главная привычка.',
    blitz: 'Таблица умножения закрепляется короткими частыми повторами: лучше 3 раза по 3 минуты, чем полчаса подряд.',
    bug: 'Предложите ребёнку проверить ваше решение с «ошибкой» — искать чужие ошибки весело и учит внимательности.',
    g: 'Сыграйте вместе: пусть ребёнок объяснит вам правила и стратегию — объяснение закрепляет навык.',
    a: 'Спросите, что нового ребёнок узнал, и попросите рассказать вам — пересказ лучше всего закрепляет знания.',
  };
  const tipFor = id => TIPS[id.replace(/\d$/, '')] || TIPS[id.split(':')[0]] || TIPS.a;
  function report() {
    const sk = SK(), ids = Object.keys(sk).filter(id => !id.startsWith('a:teen') && info(id) && sk[id].n > 0);
    const w0 = dayList(0, 7), w1 = dayList(7, 7);
    const sumDays = (days, f) => days.reduce((t, d) => t + f(d), 0);
    const acc = days => { let n = 0, v = 0; ids.forEach(id => days.forEach(d => { const x = sk[id].d && sk[id].d[d]; if (x) { n += x[0]; v += x[1]; } })); return n ? Math.round(v / n * 100) : null; };
    const areas = {}; Object.values(S.time || {}).forEach(d => Object.entries(d).forEach(([a, s]) => { areas[a] = (areas[a] || 0) + s; }));
    const st = C().stats, hrs = S.hours || [], bestH = hrs.length ? hrs.indexOf(Math.max(...hrs)) : -1;
    return {
      ids, w0, mins: w0.map(minsOf), minsW: Math.round(sumDays(w0, minsOf)), minsP: Math.round(sumDays(w1, minsOf)),
      tasksW: sumDays(w0, d => S.days[d] || 0), tasksP: sumDays(w1, d => S.days[d] || 0), accW: acc(w0), accP: acc(w1),
      stars: talents(), hard: ids.filter(id => status(sk[id]) === 'hard'), avoid: ['mul', 'eq'].filter(avoided),
      areas, grit: st.fail >= 5 ? Math.round(st.cont / st.fail * 100) : null, bestH: hrs.some(Boolean) ? bestH : -1, st,
    };
  }
  function bar(p, cls = '') { return `<span class="cbar ${cls}"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></span>`; }
  function parentsHTML() {
    const R = report(), sk = SK(), th = TH(), name = esc(S.kid || 'Ребёнок');
    const maxM = Math.max(10, ...R.mins), dd = d => new Date(d).toLocaleDateString('ru-RU', { weekday: 'short' });
    const delta = (a, b, u = '') => a == null || b == null || !b ? '' : `<small class="${a >= b ? 'up' : 'down'}">${a >= b ? '▲' : '▼'} ${Math.abs(a - b)}${u} к прошлой неделе</small>`;
    const fact = id => { const s = sk[id], t = trend(s); return `${Math.round(s.a * 100)}% точность · ${s.n} ${plural(s.n, 'попытка', 'попытки', 'попыток')}${t != null && t !== 0 ? ` · ${t > 0 ? '▲ +' : '▼ '}${t}% за неделю` : ''}${s.sp ? ` · ~${Math.round(s.sp)} с на задачу` : ''}`; };
    // теория и практика
    const thRow = (key, title, topic) => { const r = th[key], solidPr = topic && CORE.filter(x => x.startsWith(topic)).some(x => ['solid', 'star'].includes(status(sk[x]))); const s = r && r.verified ? `✅ изучен (прочитано ${r.read}%${r.score ? ', проверка ' + r.score : ''})` : r ? `👀 просмотрен быстро (${r.read}%)` : solidPr ? '🎯 не требуется — освоено практикой' : (topic ? S.lessons[topic] : false) ? '👀 открывали раньше' : '— не открывали'; return `<tr><td>${title}</td><td>${s}</td></tr>`; };
    const acadRows = Object.entries(th).filter(([k]) => k.startsWith('a:') && !k.startsWith('a:teen')).length;
    // академия
    const subj = window.SUBJECTS || {}, acadHTML = Object.values(subj).map(s => { if (s.id === 'teen') return `<tr><td>${s.icon} ${s.name}</td><td colspan="2" class="small">Раздел открыт ребёнку. Что именно читает ребёнок — не показываем, чтобы не было неловко задавать вопросы. Лучшее, что можно сделать, — сказать: «Если захочешь что-то спросить — я рядом».</td></tr>`; const a = (S.acad || {})[s.id] || {}, read = Object.keys(a.read || {}).length, due = Object.keys(a.box || {}).length, p = typeof subjProgress === 'function' ? subjProgress(s.id) : 0; return `<tr><td>${s.icon} ${s.name}</td><td>${bar(p)} ${p}%</td><td class="small">уроков: ${read}/${s.units.length}${due ? ` · на повторении: ${due}` : ''}</td></tr>`; }).join('');
    // советы
    const adv = [];
    if (R.stars.length) adv.push(`Похвалите за <b>${info(R.stars[0]).short}</b> — это сильная сторона. Хвалите за старание и стратегию («ты проверил ответ — это по-сыщицки»), а не за «ум».`);
    if (R.hard.length) adv.push(`<b>${info(R.hard[0]).name}</b> пока трудно. ${tipFor(R.hard[0])}`);
    if (R.avoid.length) adv.push(`${R.avoid[0] === 'eq' ? 'Уравнения' : 'Столбик'} давно не открывались. Котик уже дал «задание роста» с двойной наградой — можно предложить сделать его вместе.`);
    if (R.minsW / 7 > 60) adv.push('В среднем больше часа в день. Договоритесь о перерывах: 25 минут занятий — 5 минут движения.');
    if (R.grit != null && R.grit < 50) adv.push('После ошибки ребёнок часто бросает задачу. Скажите, что ошибки — это улики: по ним видно, что подтянуть. Котик тоже так говорит.');
    if (!adv.length) adv.push('Пока данных мало — загляните сюда через несколько дней занятий.');
    const areas = Object.entries(R.areas).sort((a, b) => b[1] - a[1]), totA = areas.reduce((t, x) => t + x[1], 0) || 1;
    const rows = R.ids.sort((a, b) => (info(a).area + a).localeCompare(info(b).area + b)).map(id => { const s = sk[id], t = trend(s), stt = status(s); return `<tr><td>${info(id).icon} ${info(id).name}</td><td>${bar(s.a * 100, stt)}</td><td class="small">${ST_NAME[stt]}${t ? ` <span class="${t > 0 ? 'up' : 'down'}">${t > 0 ? '▲' : '▼'}</span>` : ''}</td></tr>`; }).join('');
    return `<div class="card coach-rep"><h3>📅 Неделя ${name}</h3>
      <div class="kpis"><div><b>${R.minsW}</b><small>минут занятий</small>${delta(R.minsW, R.minsP, ' мин')}</div><div><b>${R.tasksW}</b><small>задач и заданий</small>${delta(R.tasksW, R.tasksP)}</div><div><b>${R.accW != null ? R.accW + '%' : '—'}</b><small>точность</small>${delta(R.accW, R.accP, '%')}</div><div><b>${Math.max(streak(), 0)}</b><small>дней подряд (рекорд ${R.st.bestStreak || streak()})</small></div></div>
      <div class="act wk">${R.w0.map((d, i) => `<div class="ab"><i style="height:${R.mins[i] / maxM * 100}%"></i><small>${dd(d)}</small><em>${Math.round(R.mins[i])}</em></div>`).join('')}</div><p class="small">Минуты активных занятий в день (считается, только когда ребёнок что-то нажимает).</p></div>
      <div class="card"><h3>⭐ Сильные стороны</h3>${R.stars.length ? R.stars.slice(0, 4).map(id => `<div class="srow"><b>${info(id).icon} ${info(id).name}</b><small>${fact(id)}</small></div>`).join('') + '<p class="small">Принцип «усиливать сильное»: котик даёт «испытания мастера» по сильным темам — с кристаллами и значком таланта.</p>' : '<p class="small">Таланты появятся, когда в какой-то теме будет 10+ попыток с точностью от 88%.</p>'}</div>
      <div class="card"><h3>🌱 Зоны роста</h3>${R.hard.length || R.avoid.length ? R.hard.slice(0, 4).map(id => `<div class="srow"><b>${info(id).icon} ${info(id).name}</b><small>${fact(id)}</small><p class="tip">💡 ${tipFor(id)}</p></div>`).join('') + R.avoid.map(tp => `<div class="srow"><b>${tp === 'eq' ? '📦 Уравнения' : '✖️ Столбик'}</b><small>не открывались ${ago(topicLast(tp))} дн., хотя занятия были</small></div>`).join('') + '<p class="small">Котик ставит «задание роста» по самой полезной теме и даёт за него больше наград — без давления и запретов.</p>' : '<p class="small">Явно трудных тем сейчас нет 👍</p>'}</div>
      <div class="card"><h3>💡 Советы на неделю</h3><ul class="howto">${adv.slice(0, 3).map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="card"><h3>📖 Теория и практика</h3><table class="tbl">${thRow('t:mul', 'Урок: столбик', 'mul')}${thRow('t:eq', 'Урок: уравнения', 'eq')}</table><p class="small">«Изучен» — ребёнок провёл на карточках достаточно времени (не быстрее ~240 слов в минуту) и ответил на вопросы «Проверь себя». Если навык уже уверенный на практике, теория не обязательна — котик её не навязывает.${acadRows ? ` Уроков Академии изучено: ${Object.entries(th).filter(([k, r]) => k.startsWith('a:') && !k.startsWith('a:teen') && r.verified).length}.` : ''}</p></div>
      <div class="card"><h3>🧠 Как ${name} учится</h3><div class="areas">${areas.length ? areas.map(([a, s]) => `<div class="arow"><span>${AREA_NAME[a] || a}</span>${bar(s / totA * 100)}<small>${Math.round(s / 60)} мин</small></div>`).join('') : '<p class="small">Время ещё не накопилось.</p>'}</div>
        <p class="small">${R.grit != null ? `Упорство: после ошибки продолжает в <b>${R.grit}%</b> случаев. ` : ''}${R.bestH >= 0 ? `Чаще всего занимается около <b>${R.bestH}:00</b>. ` : ''}Заданий роста выполнено: <b>${R.st.growDone}</b>, испытаний мастера: <b>${R.st.masterDone}</b>${R.st.overcome.length ? `, преодолено трудных тем: <b>${R.st.overcome.length}</b>` : ''}.</p></div>
      ${acadHTML ? `<div class="card"><h3>🎓 Академия</h3><table class="tbl">${acadHTML}</table>${window.readParentsHTML ? readParentsHTML() : ''}</div>` : ''}
      ${rows ? `<div class="card"><h3>📊 Все навыки</h3><table class="tbl skills">${rows}</table></div>` : ''}`;
  }
  function settingsHTML() {
    return `<div class="card"><h3>🔐 Настройки для взрослых</h3>
      <label class="tgl"><input type="checkbox" id="shareOn" ${S.shareOn !== false ? 'checked' : ''}> Разрешить кнопку «Поделиться» в фотостудии (ВКонтакте и др.)</label>
      <p class="small">На фото — только котик, наряд и (по желанию) имя ребёнка. Камера не используется. Сохранить фото на устройство можно всегда.</p>
      <div class="row-btns">${S.pin ? '<button class="btn" id="pinoff">Убрать ПИН</button>' : '<button class="btn" id="pinset">🔢 Поставить ПИН на этот раздел</button>'}</div></div>`;
  }
  function bindSettings() {
    $('#shareOn')?.addEventListener('change', e => { S.shareOn = e.target.checked; save(); });
    $('#pinoff')?.addEventListener('click', () => { delete S.pin; save(); toast('ПИН убран'); go('parents'); });
    $('#pinset')?.addEventListener('click', () => {
      const m = modal(`<h2>ПИН для раздела взрослых</h2><p>4 цифры. Запишите их — если забудете, раздел откроется по коду облачной копии: <b>${cloudCode()}</b>.</p><input id="pin1" class="nmi" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"><div class="row-btns"><button class="btn pink" id="pinok">Сохранить</button><button class="btn" data-close>Отмена</button></div>`);
      $('#pinok', m.el).addEventListener('click', () => { const v = $('#pin1', m.el).value.trim(); if (!/^\d{4}$/.test(v)) { toast('Нужно ровно 4 цифры'); return; } S.pin = v; save(); m.close(); toast('ПИН сохранён'); go('parents'); });
    });
  }
  let pinOk = false;
  function pinGate(next) {
    app.innerHTML = `${topbar('Для взрослых')}<div class="page center"><div class="big-emoji">🔐</div><h2>Раздел для взрослых</h2><p>Введите ПИН</p><input id="pinin" class="nmi" inputmode="numeric" maxlength="8" placeholder="••••" autocomplete="off" style="text-align:center;max-width:220px"><div class="row-btns" style="justify-content:center"><button class="btn pink" id="pingo">Войти</button></div><p class="small"><button class="link" id="pinforgot">Забыли ПИН?</button></p></div>`;
    const tryIt = () => { const v = $('#pinin').value.trim().toUpperCase(); if (v === S.pin || v === cloudCode()) { pinOk = true; next(); } else { SND.bad(); shake($('#pinin')); $('#pinin').value = ''; } };
    $('#pingo').addEventListener('click', tryIt); $('#pinin').addEventListener('keydown', e => { if (e.key === 'Enter') tryIt(); });
    $('#pinforgot').addEventListener('click', () => toast('Введите вместо ПИНа код облачной копии (8 символов) — его видно в этом разделе и в резервной копии.'));
  }

  /* ---------- подключение ---------- */
  function install() {
    window.GAMES_LIST = typeof GAMES !== 'undefined' ? GAMES : [];
    const td = taskDone; // ловим каждую решённую задачу
    taskDone = function (kind, res, meta = {}) { td(kind, res, meta); try { if (meta.academy || (curScreen === 'game' && !meta.level)) return; track(meta.level && (kind === 'mul' || kind === 'eq') ? kind + meta.level : kind, resV(res), { level: meta.level, guided: meta.guided }); } catch (e) { console.warn(e); } };
    if (typeof finishGame === 'function') { const fg = finishGame; finishGame = function (g, st) { fg(g, st); try { track('g:' + g.id, st.rounds ? st.score / st.rounds : 0); } catch (e) { console.warn(e); } }; }
    const wrap = (name, after) => { const f = SCREENS[name]; if (!f) return; SCREENS[name] = arg => { scrAt = Date.now(); f(arg); try { after(arg); } catch (e) { console.warn(e); } }; };
    wrap('home', () => {
      const tiles = $('.tiles', app); if (!tiles) return;
      tiles.insertAdjacentHTML('beforebegin', homeHTML());
      const sch = $('.t-school', app); if (sch) sch.insertAdjacentHTML('afterend', '<button class="tile t-acad" data-go="academy"><span class="ti">📚</span><b>Академия сыщика</b><small>Космос, безопасность, мышление…</small></button>');
      const shop = $('.t-shop', app); if (shop) shop.insertAdjacentHTML('afterend', '<button class="tile t-photo" data-go="photo"><span class="ti">📸</span><b>Фотостудия</b><small>Фото котика на память</small></button><button class="tile t-fit" data-go="fitting"><span class="ti">👗</span><b>Примерочная</b><small>Примеряй наряды у зеркала</small></button>');
    });
    ['games', 'academy', 'school'].forEach(n => wrap(n, () => decorate(n)));
    const par = SCREENS.parents;
    SCREENS.parents = arg => {
      if (S.pin && !pinOk) return pinGate(() => go('parents'));
      par(arg); const pg = $('.page.parents', app); if (!pg) return;
      pg.insertAdjacentHTML('afterbegin', parentsHTML()); const reset = $('#reset', pg); if (reset) reset.insertAdjacentHTML('beforebegin', settingsHTML()); bindSettings();
    };
    Object.keys(SCREENS).forEach(n => { if (!['home', 'games', 'academy', 'school', 'parents'].includes(n)) { const f = SCREENS[n]; SCREENS[n] = arg => { scrAt = Date.now(); return f(arg); }; } });
  }
  return { install, track, info, status, talents, plan, homeHTML, parentsHTML, report, lessonTimer, finishLesson, checkpoint, mathCheck, cured() { C().stats.cured++; save(); }, stats: () => C().stats, sk: SK, theory: TH };
})();
window.Coach = Coach;
Coach.install(); // подключаемся последними: все экраны и функции уже объявлены
