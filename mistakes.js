/* mistakes.js (v30) — «Работа над ошибками»:
   • журнал ошибок S.mlog (≤200) и темы с ошибками S.mtop — пишутся обёртками taskDone / noteErr / mountTask;
   • экран «🩹 Работа над ошибками» (школа + Академия): что не так простыми словами, «📖 Повторить урок», «✏️ 3 похожих задачи»;
     тема уходит из списка после 2 верных самостоятельных решений в другой день;
   • мягкое предложение котика повторить тему (≥2 ошибок в задаче или 2 задачи подряд с одной и той же ошибкой);
   • «✏️ Проверь мою тетрадь»: решаешь на бумаге, вводишь ответ — котик по шагам ищет первую ошибку (планы column.js / engine.js);
   • листок для печати (A4, страница 2 — ответы);
   • без повторов: решённые без ошибок примеры (S.solved, ≤5000 подписей) больше не выдаются;
   • уроки открываются по порядку (первый в каждой теме открыт; всё начатое остаётся открытым; «Открыть все уроки» у взрослых).
   Подключается до coach.js: старый код не переписывается, только обёртки. */
'use strict';
const Mistakes = (() => {
  const KINDS = ['mul', 'eq', 'div', 'add'];
  const ICON = { mul: '✖️', eq: '📦', div: '➗', add: '➕' };
  const KNAME = { mul: 'Умножение столбиком', eq: 'Составные уравнения', div: 'Деление столбиком', add: 'Сложение и вычитание столбиком' };
  const DAY = () => today();
  const T = () => (S.mtop = S.mtop || {});
  const LOG = () => (S.mlog = S.mlog || []);
  const ERR = {
    'mul:carry': 'забываешь прибавить запомненное число', 'mul:tbl': 'путаешь таблицу умножения', 'mul:add': 'ошибаешься, когда складываешь неполные произведения',
    'mul:shift': 'забываешь сдвинуть вторую строку на клетку влево', 'mul:zeros': 'забываешь приписать нули на конце (или пишешь строку для нуля)', 'eq:order': 'не сразу находишь последнее действие', 'eq:role': 'путаешь названия: слагаемое, вычитаемое, множитель…',
    'eq:rule': 'путаешь правило нахождения неизвестного', 'eq:calc': 'ошибаешься в вычислениях', 'eq:check': 'ошибаешься при проверке',
    'div:first': 'не сразу находишь первое неполное делимое', 'div:q': 'подбираешь цифру частного неточно', 'div:prod': 'ошибаешься, когда умножаешь цифру частного на делитель',
    'div:rem': 'ошибаешься при вычитании (остаток должен быть меньше делителя)', 'div:next': 'путаешься, когда сносишь следующую цифру', 'div:zero': 'забываешь написать 0 в частном',
    'add:carry': 'забываешь прибавить запомненную единицу', 'add:calc': 'ошибаешься, когда складываешь цифры',
    'sub:borrow': 'забываешь занять десяток у соседа (или уменьшить его на 1)', 'sub:calc': 'ошибаешься, когда вычитаешь цифры', 'copy': 'невнимательно переписываешь ответ',
  };
  const errText = (t, f) => { if (!t) return 'иногда ошибаешься'; let m;
    if ((m = t.match(/^eq:rule:(\w+)$/)) && E.ROLES[m[1]]) return 'путаешь правило: ' + E.ROLES[m[1]].gen;
    const base = ERR[t] || ERR[t.replace(/^\w+:(copy)$/, '$1')] || 'иногда ошибаешься'; return t === 'mul:tbl' && f ? base + ` (например, ${f.replace('×', ' × ')})` : base; };
  const LESSON = k => k === 'div' || k === 'add' ? ['collesson', k] : ['lesson', k];
  const name = key => { const k = key.replace(/\d+$/, ''), lv = +key.replace(/^\D+/, ''); let n = ''; try { n = window.Coach && Coach.info(key) ? Coach.info(key).name : ''; } catch (e) { } return n || (KNAME[k] || k) + (lv ? ' · уровень ' + lv : ''); };

  /* ---------- решённые задачи: не повторяем ---------- */
  let sset = null, sref = null;
  const SV = () => { if (!Array.isArray(S.solved)) S.solved = []; if (sref !== S.solved) { sref = S.solved; sset = new Set(S.solved); } return sset; };
  const isSolved = sig => !window.GOD && !(window.withSeed && withSeed.run) && !!sig && SV().has(sig); // внутри withSeed (дуэли) — без учёта решённого, иначе задания у игроков разойдутся // «режим бога» (window.GOD) — повторы разрешены
  function solve(sig) { if (!sig) return; const set = SV(); if (set.has(sig)) return; set.add(sig); S.solved.push(sig); if (S.solved.length > 5000) S.solved.splice(0, S.solved.length - 5000).forEach(x => set.delete(x)); }
  const hashQ = q => typeof qHash === 'function' ? qHash(q) : String(q && q.q).slice(0, 40);
  function sigOf(c) {
    if (!c) return '';
    if (c.kind === 'mul') return 'm:' + c.a + 'x' + c.b;
    if (c.kind === 'eq' && c.eq) return 'e:' + E.eqText(c.eq.lhs) + '=' + c.eq.rhs;
    if (c.kind === 'div') return 'd:' + c.a + ':' + c.b;
    if (c.kind === 'add') return 'a:' + c.a + c.op + c.b;
    if (c.kind === 'aq' && c.q) return 'g:' + hashQ(c.q);
    return '';
  }
  const sampleOf = c => !c ? '' : c.kind === 'mul' ? `${c.a} × ${c.b}` : c.kind === 'eq' ? `${E.eqText(c.eq.lhs)} = ${c.eq.rhs}` : c.kind === 'div' ? `${c.a} : ${c.b}` : c.kind === 'add' ? `${c.a} ${c.op === '-' ? '−' : '+'} ${c.b}` : '';
  const probOf = c => !c ? null : c.kind === 'mul' ? { a: c.a, b: c.b } : c.kind === 'eq' ? { eq: JSON.parse(JSON.stringify(c.eq)) } : c.kind === 'div' ? { a: c.a, b: c.b } : c.kind === 'add' ? { a: c.a, b: c.b, op: c.op } : null;

  /* ---------- контекст текущей задачи и ошибки в ней ---------- */
  let ctx = null, buf = [], lastDom = null, lastPrompt = 0;
  function begin(c) { ctx = c || null; buf = []; }
  const ne = noteErr;
  noteErr = function (type, fact, sub) {
    ne(type, fact);
    try { const k = ctx && ctx.kind; let t = sub || ((k === 'mul' || k === 'eq') ? k + ':' + type : (type === 'div' || type === 'add' || type === 'sub') ? type + ':calc' : null);
      if (t) buf.push({ t, f: fact || '' }); } catch (e) { console.warn(e); }
  };
  // noteErr('rule', null, 'eq:rule:<роль>') — роль приходит из app.js
  const mt = mountTask;
  mountTask = function (el, t, guided, onDone) {
    try {
      if (t && t.kind === 'aq' && t.q && t.regen) { for (let k = 0; k < 10 && isSolved('g:' + hashQ(t.q)); k++) t.q = t.regen(); } // задачи копилки: решённые не повторяем
      if (t && (t.kind === 'mul' || t.kind === 'eq')) begin({ kind: t.kind, a: t.a, b: t.b, eq: t.eq, lv: t.level });
      else if (t && t.kind === 'aq') begin({ kind: 'aq', q: t.q });
      else if (t && t.kind !== 'div' && t.kind !== 'add') begin(null); // деление и сложение сообщают о себе сами (column.js)
    } catch (e) { console.warn(e); }
    return mt.apply(this, arguments);
  };
  const mk = makeTask;
  makeTask = function (kind, level) { let t = mk(kind, level); if (kind === 'mul' || kind === 'eq') for (let k = 0; k < 12 && isSolved(sigOf(t)); k++) t = mk(kind, level); return t; };

  const dominant = list => { const c = {}; list.forEach(x => { c[x.t] = (c[x.t] || 0) + 1; }); return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || null; };
  const td = taskDone;
  taskDone = function (kind, res, meta = {}) {
    td(kind, res, meta);
    try { afterTask(kind, res || {}, meta); } catch (e) { console.warn(e); }
  };
  function afterTask(kind, res, meta) {
    if (meta.academy) return;
    if (res.raw) res = { ...res, ...res.raw }; // ошибка, «закрытая» печеньем-щитом, всё равно попадает в работу над ошибками
    const perfect = !res.mistakes && !res.helped, c = ctx;
    if (perfect && c && (c.kind === kind || c.kind === 'aq')) solve(sigOf(c));
    if (!KINDS.includes(kind) || !meta.level) { buf = []; ctx = null; return; }
    const key = kind + meta.level, tp = T(), sig = c && c.kind === kind ? sigOf(c) : '';
    if (res.mistakes || res.helped) {
      const list = buf.length ? buf : [{ t: kind === 'add' && c && c.op === '-' ? 'sub:calc' : kind === 'add' ? 'add:calc' : kind + ':calc', f: '' }], dom = dominant(list), fact = (list.find(x => x.t === dom && x.f) || {}).f || '';
      const L = LOG(); L.push({ k: kind, lv: meta.level, e: dom, f: fact, at: Date.now(), s: c && c.kind === kind ? sampleOf(c) : '' }); if (L.length > 200) L.splice(0, L.length - 200);
      const e = tp[key] = tp[key] || { k: kind, lv: meta.level, e: {}, p: [] };
      e.last = DAY(); e.ok = 0; e.okd = ''; e.fixed = null; e.e = e.e || {}; list.forEach(x => { e.e[x.t] = (e.e[x.t] || 0) + 1; }); if (fact) e.f = fact;
      if (sig) { e.p = (e.p || []).filter(x => x.sig !== sig); e.p.push({ sig, s: sampleOf(c), d: probOf(c) }); if (e.p.length > 3) e.p.shift(); e.s = sampleOf(c); }
      const again = lastDom && lastDom === dom; lastDom = dom;
      if ((res.mistakes >= 2 || again) && ['practice', 'colwork'].includes(curScreen) && !meta.paper) offer(key, dom, fact);
    } else {
      lastDom = null; const e = tp[key];
      if (e && sig && e.p) e.p = e.p.filter(x => x.sig !== sig);
      if (e && !e.fixed && !meta.guided && DAY() > (e.last || '') && e.okd !== DAY() + ':' + sig) {
        e.ok = (e.ok || 0) + 1; e.okd = DAY() + ':' + sig;
        if (e.ok >= 2) { e.fixed = DAY(); setTimeout(() => toast(`<span class="tb">🩹</span><div><b>Ошибка исправлена!</b><br>${name(key)} — теперь получается. Так держать!</div>`), 1900); }
      }
    }
    buf = []; ctx = null; save();
  }

  /* ---------- котик предлагает повторить ---------- */
  function offer(key, dom, fact) {
    if (Date.now() - lastPrompt < 4 * 60 * 1000) return;
    const k = key.replace(/\d+$/, ''), scr = curScreen;
    setTimeout(() => {
      if ($('.modal') || curScreen !== scr) return; lastPrompt = Date.now();
      const m = modal(`<div class="m-cat">${myCat({ happy: true })}</div><h2>Давай разберёмся вместе 🐾</h2><p>Я заметил: ты <b>${errText(dom, fact)}</b>.</p><p class="small">Ошибаться не страшно — так сыщики находят, что подтянуть. Хочешь, повторим?</p>
        <div class="mk-col"><button class="btn pink" id="mkles">📖 Повторим урок (3 мин)</button><button class="btn" id="mkone">🐾 Решим ещё один вместе</button><button class="btn ghost" data-close>Позже</button></div>`, 'mk-offer');
      $('#mkles', m.el).addEventListener('click', () => { m.close(); const [s, a] = LESSON(k); go(s, a); });
      $('#mkone', m.el).addEventListener('click', () => { m.close(); go('mdrill', key + ':one'); });
      say('Ошибаться не страшно, {n}! Давай разберёмся вместе.', 0, { silent: true });
    }, 2300);
  }

  /* ---------- список «над чем поработать» ---------- */
  function schoolItems() {
    const tp = T(), out = [];
    Object.entries(tp).forEach(([key, e]) => { if (!e.fixed) out.push({ key, ...e }); });
    try { Object.entries(S.sk || {}).forEach(([id, s]) => { if (/^(mul|eq|div|add)\d$/.test(id) && !tp[id] && window.Coach && Coach.status(s) === 'hard') out.push({ key: id, k: id.replace(/\d$/, ''), lv: +id.slice(-1), e: {}, coach: Math.round(s.a * 100), p: [] }); }); } catch (e) { }
    return out.sort((a, b) => String(b.last || '').localeCompare(String(a.last || '')));
  }
  function acadItems() {
    const out = []; if (typeof dueMistakes !== 'function') return out;
    Object.keys(window.SUBJECTS || {}).forEach(sid => {
      if (sid === 'teen' || !(S.acad || {})[sid]) return; const a = S.acad[sid], box = Object.keys(a.box || {}); if (!box.length) return;
      const s = window.SUBJECTS[sid], cnt = {}; box.forEach(q => { const u = q.split('#')[0]; cnt[u] = (cnt[u] || 0) + 1; });
      const top = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]).map(u => s.units.find(x => x.id === u)).filter(Boolean);
      out.push({ sid, s, n: box.length, due: dueMistakes(sid).length, units: top.slice(0, 3) });
    });
    return out;
  }
  const count = () => schoolItems().length + acadItems().length;
  function weekFixed() {
    const wk = new Date(); wk.setDate(wk.getDate() - 7); const from = dkey(wk);
    return Object.values(T()).filter(e => e.fixed && e.fixed > from).length + (S.mcured || []).filter(d => d > from).length;
  }
  function reportHTML() {
    const n = count(), m = weekFixed();
    return `<div class="mk-rep">🩹 Работа над ошибками: <b>${n} ${plural(n, 'тема', 'темы', 'тем')}</b>, исправлено <b>${m}</b> за неделю${n ? ' <button class="btn sm" data-go="mistakes" data-arg="parents">Открыть</button>' : ''}</div>`;
  }

  /* ---------- экран «Работа над ошибками» ---------- */
  SCREENS.mistakes = arg => {
    const back = ['school', 'academy', 'parents'].includes(arg) ? arg : 'home', sc = schoolItems(), ac = acadItems();
    const fixed = Object.entries(T()).filter(([, e]) => e.fixed && ago(e.fixed) <= 14);
    const prog = e => { if (e.coach != null) return `<span class="small">Пока трудно: точность ${e.coach}%. Реши пару задач — и станет легче!</span>`; const ok = e.ok || 0;
      return `<span class="mk-prog">${'●'.repeat(ok)}${'○'.repeat(Math.max(0, 2 - ok))}</span> <span class="small">${e.last === DAY() ? 'Завтра реши 2 задачи сам(а) без ошибок — и тема исправлена.' : `Реши сам(а) без ошибок ещё ${2 - ok} — и тема исправлена.`}</span>`; };
    const what = e => { const ts = Object.entries(e.e || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => errText(t, e.f)); return ts.length ? 'Ты ' + ts.join('; ') + '.' : ''; };
    const schoolCard = e => `<div class="mk-item"><span class="mk-ic">${ICON[e.k] || '✏️'}</span><div class="mk-b"><b>${esc(name(e.key))}</b>${what(e) ? `<p class="mk-what">${what(e)}</p>` : ''}${e.s ? `<small>Пример с ошибкой: <b>${esc(e.s)}</b></small>` : ''}<div>${prog(e)}</div></div>
      <div class="mk-act"><button class="btn sm" data-mles="${e.k}">📖 Повторить урок</button><button class="btn sm pink" data-mdr="${e.key}">✏️ 3 похожих задачи</button></div></div>`;
    const acadCard = x => `<div class="mk-item"><span class="mk-ic">${x.s.icon}</span><div class="mk-b"><b>${esc(x.s.name)}</b><p class="mk-what">Вопросов с ошибками: ${x.n}${x.units.length ? ` — больше всего в теме «${esc(x.units[0].title)}»` : ''}.</p><small>${x.due ? `Пора повторить: ${x.due}` : 'Следующий повтор — завтра (так лучше запоминается)'}</small></div>
      <div class="mk-act">${x.units[0] ? `<button class="btn sm" data-go="alesson" data-arg="${x.sid}:${x.units[0].id}">📖 Повторить урок</button>` : ''}${x.due ? `<button class="btn sm pink" data-go="aquiz" data-arg="${x.sid}:*review">🔁 Разбор ошибок (${x.due})</button>` : ''}</div></div>`;
    app.innerHTML = `${topbar('🩹 Работа над ошибками', back)}<div class="page mk-page">${helperHTML('mkbub')}
      <div class="row-btns"><button class="btn pink" data-go="paper">✏️ Проверь мою тетрадь</button><button class="btn" data-go="worksheet" data-arg="m">🖨️ Листок для тетради</button></div>
      ${sc.length ? `<h3 class="mk-h">✍️ Школа сыщика</h3>${sc.map(schoolCard).join('')}` : ''}
      ${ac.length ? `<h3 class="mk-h">📚 Академия</h3>${ac.map(acadCard).join('')}` : ''}
      ${!sc.length && !ac.length ? `<div class="card center"><div class="big-emoji">🎉</div><h3>Ошибок для разбора нет!</h3><p class="small">Когда в задачах встретится трудное место, оно появится здесь — и мы разберём его вместе.</p></div>` : ''}
      ${fixed.length ? `<h3 class="mk-h">✅ Уже исправлено</h3><div class="mk-fixed">${fixed.map(([k]) => `<span class="chip">✔ ${esc(name(k))}</span>`).join(' ')}</div>` : ''}</div>`;
    $('#mkbub').innerHTML = sc.length || ac.length ? `Ошибаться не страшно, ${esc(S.kid || 'сыщик')}! Каждая ошибка — улика: она показывает, что подтянуть. Выбирай тему 🐾` : 'Чисто! Ни одной нераскрытой ошибки 🐾 Можешь проверить свою тетрадь — я помогу найти ошибку.';
    $$('[data-mles]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); const [s, a] = LESSON(b.dataset.mles); go(s, a); }));
    $$('[data-mdr]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('mdrill', b.dataset.mdr); }));
  };
  const ago = d => Math.floor((new Date(DAY()) - new Date(d)) / 864e5);

  /* ---------- «3 похожих задачи»: вместе → сам → сам ---------- */
  function makeSimilar(kind, lv, fromLog) {
    const e = T()[kind + lv], p = fromLog && e && (e.p || []).slice(-1)[0];
    if (kind === 'mul') { if (p) return { kind, level: lv, a: p.d.a, b: p.d.b, story: '' }; return makeTask('mul', lv); }
    if (kind === 'eq') { if (p) return { kind, level: lv, eq: p.d.eq, story: '' }; return makeTask('eq', lv); }
    if (kind === 'div') return { kind, level: lv, P: p ? Column.divPlan(p.d.a, p.d.b) : Column.genDiv(lv) };
    const op = p ? p.d.op : (e && e.e && Object.keys(e.e).some(t => t.startsWith('sub')) ? '-' : Math.random() < 0.5 ? '+' : '-');
    return { kind, level: lv, P: p ? Column.addPlan(p.d.a, p.d.b, p.d.op) : Column.genAdd(lv, op) };
  }
  SCREENS.mdrill = arg => {
    const [key, mode] = String(arg || 'mul2').split(':'), kind = key.replace(/\d+$/, ''), lv = +key.replace(/^\D+/, '') || 1, one = mode === 'one', N = one ? 1 : 3;
    if (!KINDS.includes(kind)) return go('mistakes');
    let i = 0, solo = 0;
    app.innerHTML = `${topbar(one ? '🐾 Решим вместе' : '✏️ 3 похожих задачи', 'mistakes')}<div class="page task-page mk-drill"><div class="task-head"><div><b>${esc(name(key))}</b></div><div class="g-dots">${Array.from({ length: N }, (_, k) => `<i class="${k === 0 ? 'now' : ''}"></i>`).join('')}</div></div>
      <div class="mk-note" id="mdn"></div><div id="task"></div><div id="after" class="after"></div></div>`;
    const run = () => {
      const guided = i === 0, el = $('#task'); $('#after').innerHTML = '';
      $('#mdn').innerHTML = guided ? '🐾 Сначала решаем <b>вместе</b> — котик подскажет каждый шаг.' : `🕵️ Теперь <b>сам(а)</b>! Задача ${i + 1} из ${N}.`;
      const t = makeSimilar(kind, lv, i === 0);
      const done = res => {
        taskDone(kind, res, { level: lv, guided }); const rr = res.raw || res, perfect = !rr.mistakes && !rr.helped; if (!guided && perfect) solo++;
        award(perfect ? 2 : 1, guided ? 6 : 10); const dot = $$('.g-dots i', app)[i]; if (dot) dot.className = perfect ? 'ok' : 'bad';
        i++;
        if (i < N) { $('#after').innerHTML = `<button class="btn big pink" id="mdnext">Следующая задача →</button>`; $('#mdnext').addEventListener('click', () => { SND.tap(); const d = $$('.g-dots i', app)[i]; if (d) d.className = 'now'; run(); }); return; }
        const e = T()[key];
        $('#after').innerHTML = `<div class="card center mk-end"><div class="big-emoji">${solo >= 2 || (one && perfect) ? '🏆' : '🐾'}</div><h3>${one ? (perfect ? 'Получилось без ошибок!' : 'Разобрались вместе!') : solo >= 2 ? 'Две задачи сам(а) без ошибок — супер!' : 'Хорошая тренировка!'}</h3>
          <p class="small">${e && !e.fixed ? (e.last === DAY() ? 'Чтобы тема ушла из «Работы над ошибками», завтра реши 2 такие задачи сам(а) без ошибок — так знание закрепится надолго.' : 'Тема почти исправлена!') : 'Ошибаться не страшно — главное, разобраться.'}</p>
          <div class="row-btns"><button class="btn pink" data-go="mistakes">🩹 К работе над ошибками</button><button class="btn" id="mdagain">Ещё раз</button></div></div>`;
        $('#mdagain').addEventListener('click', () => go('mdrill', arg)); SND.win(); if (solo >= 2) confetti(25);
      };
      if (kind === 'mul' || kind === 'eq') { mountTask(el, t, guided, done); return; }
      el.innerHTML = `${helperHTML('mdbub')}<div id="mdcol"></div>`;
      const bub = h => { const b = $('#mdbub'); if (!b) return; b.innerHTML = h; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); };
      S.prefs[kind === 'div' ? 'divLv' : 'addLv'] = lv;
      (kind === 'div' ? Column.runDiv : Column.runAdd)($('#mdcol'), t.P, guided, bub, (l, mistakes, helped) => done({ mistakes, helped }));
    };
    run();
  };

  /* ---------- «Проверь мою тетрадь» ---------- */
  const PT = { mul: '✖️ Умножение', div: '➗ Деление', add: '➕ Сложение / −', eq: '📦 Уравнение' };
  function lvOf(kind, p) {
    if (kind === 'mul') { const la = String(p.a).length, lb = String(p.b).length; return lb === 1 ? 1 : la <= 2 && lb === 2 ? 2 : la === 3 && lb === 2 ? 3 : 4; }
    if (kind === 'div') return p.b <= 9 ? (p.a < 1000 ? 1 : 2) : p.a < 10000 ? 3 : 4;
    if (kind === 'add') { const n = Math.max(String(p.a).length, String(p.b).length); return n <= 4 ? 1 : n === 5 ? 2 : 3; }
    const n = E.eqSteps(p.eq).length; return n <= 1 ? 1 : n >= 3 ? 4 : (p.eq.rhs > 200 ? 3 : 2);
  }
  function parseEq(str) { // «(x + 15) · 4 = 120» → дерево как в engine.js
    const s = String(str || '').replace(/\s+/g, '').replace(/[хХX]/g, 'x').replace(/[−–—]/g, '-').replace(/[·×*⋅•]/g, '*').replace(/[:÷/]/g, '/');
    const parts = s.split('='); if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    let id = 9000;
    const P = src => { let i = 0; const pk = () => src[i];
      const fac = () => { if (pk() === '(') { i++; const n = expr(); if (src[i++] !== ')') throw 0; return n; } if (pk() === 'x') { i++; return { k: 'x' }; } const m = /^\d+/.exec(src.slice(i)); if (!m) throw 0; i += m[0].length; return { k: 'n', v: +m[0] }; };
      const term = () => { let n = fac(); while (pk() === '*' || pk() === '/') { const op = src[i++]; n = { k: 'op', op, l: n, r: fac(), id: ++id }; } return n; };
      const expr = () => { let n = term(); while (pk() === '+' || pk() === '-') { const op = src[i++]; n = { k: 'op', op, l: n, r: term(), id: ++id }; } return n; };
      const n = expr(); if (i !== src.length) throw 0; return n; };
    try {
      let L = P(parts[0]), R = P(parts[1]); const cx = n => n.k === 'x' ? 1 : n.k === 'op' ? cx(n.l) + cx(n.r) : 0;
      if (cx(L) + cx(R) !== 1) return null; if (cx(R)) [L, R] = [R, L];
      const fold = n => { if (n.k !== 'op') return n; if (!E.containsX(n)) { const v = E.evalE(n, 0); if (!Number.isInteger(v) || v < 0) throw 0; return { k: 'n', v }; } n.l = fold(n.l); n.r = fold(n.r); return n; };
      L = fold(L); const rv = E.evalE(R, 0); if (!Number.isInteger(rv) || rv < 0) return null;
      const eq = { lhs: L, rhs: rv }, st = E.eqSteps(eq); if (!st.length || st.some(x => !Number.isInteger(x.newC) || x.newC < 0)) return null;
      eq.x = st[st.length - 1].newC; return E.evalE(L, eq.x) === rv ? eq : null;
    } catch (e) { return null; }
  }
  const rp = lines => lines.map((l, k) => `<div class="rp" style="animation-delay:${k * 0.6}s">${l}</div>`).join('');
  /* умножение — по записи Моро (E.mulPlanMoro): нули на конце множителей приписываем в конце, строку для нулевой цифры множителя не пишем */
  const zw = z => `${z} ${plural(z, 'нуль', 'нуля', 'нулей')}`;
  const mulStepLine = s => `${s.bd} × ${s.ad}${s.carry ? ` + <b class="cc">${s.carry}</b>` : ''} = ${s.v} → ${s.last ? `пишем <b>${s.v}</b>` : `пишем <b>${s.v % 10}</b>${s.v >= 10 ? `, <b class="cc">${Math.floor(s.v / 10)}</b> запоминаем` : ''}`}`;
  const rowStepsOf = (a0, bd) => E.mulPlan(a0, bd).steps.filter(s => s.t === 'mul');
  function mulZeros(a, b, v) { // ошибка с нулями на конце: забыли приписать или приписали не столько
    const M = E.mulPlanMoro(a, b); if (!M.z || v === M.total) return null;
    const lostZ = [0, 1, 2, 3, 4, 5, 6].some(j => j !== M.z && v === M.core * 10 ** j), wrongTail = v % 10 ** M.z !== 0;
    if (!lostZ && !wrongTail) return null;
    return { t: 'mul:zeros', h: `Нули на конце: у ${M.za ? M.a : ''}${M.za && M.zb ? ' и у ' : ''}${M.zb ? M.b : ''} вместе <b>${zw(M.z)}</b>. Умножаем без них: ${M.a0} × ${M.b0} = ${M.core}, а потом приписываем ${zw(M.z)} — в ответе на конце должно быть ровно ${zw(M.z)}.`, exp: M.total,
      replay: rp([`Отбрасываем нули на конце: ${M.a} → ${M.a0}, ${M.b} → ${M.b0}`, `${M.a0} × ${M.b0} = ${M.core}`, `Приписываем ${zw(M.z)}: <b>${M.total}</b>`]) };
  }
  function mulDigitFind(a0, bd, got) { // однозначный множитель: сверяем цифры записанной строки справа налево — как они стоят в тетради
    const st = rowStepsOf(a0, bd), s = String(got);
    for (let j = 0; j < st.length; j++) {
      const X = st[j], kd = X.last ? +(s.slice(0, Math.max(0, s.length - j)) || 0) : +(s[s.length - 1 - j] || 0), exp = X.last ? X.v : X.v % 10;
      if (kd === exp) continue;
      const noCarry = X.carry && (X.last ? kd === X.bd * X.ad : kd === (X.bd * X.ad) % 10);
      const place = ['единиц', 'десятков', 'сотен', 'тысяч', 'десятков тысяч'][j] || '';
      return { t: noCarry ? 'mul:carry' : 'mul:tbl', f: noCarry ? '' : factKey(X.bd, X.ad), kd, exp,
        h: `${X.last ? 'Последняя цифра верхнего числа' : `Разряд <b>${place}</b>`}: у тебя ${kd}, а должно быть ${exp}. ${noCarry ? `Ты <b>не прибавил(а) запомненное <b class="cc">${X.carry}</b></b>: ${X.bd} × ${X.ad} = ${X.bd * X.ad}, и ещё + ${X.carry} = ${X.v}.` : `Проверь по таблице: ${X.bd} × ${X.ad} = ${X.bd * X.ad}${X.carry ? `, плюс запомненное ${X.carry} = ${X.v}` : ''}.`}`,
        replay: rp(st.slice(0, j).map(mulStepLine).concat([mulStepLine(X)])) };
    }
    return null;
  }
  function mulSteps(a, b) {
    const M = E.mulPlanMoro(a, b), out = [], a0 = M.a0;
    const rowReplay = r => rp(rowStepsOf(a0, r.bd).map(mulStepLine).concat([`Получилось: <b>${r.val}</b>`]));
    const rowWrong = (r, v) => { for (let j = 1; j < String(a0).length; j++) if (v === E.mulDropCarry(a0, r.bd, j)) return { t: 'mul:carry', h: 'Похоже, ты <b>забыл(а) прибавить запомненное число</b>. После умножения цифры прибавляй то, что записано маленькой цифрой сверху.' };
      return { t: 'mul:tbl', h: `Проверь каждое умножение по таблице и запомненные числа. Вот как идёт строка ${a0} × ${r.bd}:` }; };
    const pre = M.z ? `Нули на конце пока не трогаем: ${a0} × ${M.b0}, а ${zw(M.z)} припишем в конце. ` : '';
    M.rows.forEach((r, i) => {
      const skip = M.rows[i - 1] ? r.pos - M.rows[i - 1].pos > 1 : r.pos > 0;
      out.push({ q: `${i ? '' : pre}Строка ${i + 1}: <b>${a0} × ${r.bd}</b>${r.pos ? ` (это ${r.bd} ${placeWord(r.pos, r.bd)} — запись со сдвигом на ${r.pos} ${plural(r.pos, 'клетку', 'клетки', 'клеток')}${skip ? '; строку для нуля не пишем' : ''})` : ''}. Какое число у тебя в этой строке? <small>(нули сдвига не пиши)</small>`, exp: r.val, wrong: v => rowWrong(r, v), replay: rowReplay(r) });
    });
    const noShift = M.rows.reduce((t, r) => t + r.val, 0), idxShift = M.rows.reduce((t, r) => t + r.val * 10 ** r.idx, 0);
    out.push({ q: `Теперь сложение: какая сумма неполных произведений получилась?${M.z ? ' <small>(до того, как приписать нули)</small>' : ''}`, exp: M.core,
      wrong: v => M.skipped && v === idxShift ? { t: 'mul:shift', h: 'Строку для нуля в множителе не пишут, но <b>следующую строку сдвигают на столько клеток, какой это разряд</b>: умножаем на сотни — начинаем писать под сотнями, на 2 клетки левее.' }
        : v === noShift || v === idxShift ? { t: 'mul:shift', h: 'Похоже, вторую строку <b>не сдвинули влево</b>. Это десятки — пишем её на одну клетку левее!' } : { t: 'mul:add', h: 'Ошибка в сложении строк. Складывай по столбикам справа налево и не забывай запомненное.' },
      replay: rp(M.rows.map(r => `${r.val}<span class="g">${'0'.repeat(r.pos)}</span>${r.pos ? ` — со сдвигом на ${r.pos}` : ''}`).concat([`Сумма: ${M.rows.map(r => r.val * 10 ** r.pos).join(' + ')} = <b>${M.core}</b>`]).concat(M.z ? [`Приписываем ${zw(M.z)}: <b>${M.total}</b>`] : [])) });
    return out;
  }
  function divSteps(a, b) {
    const P = Column.divPlan(a, b), out = [], grid = k => Column.divGrid ? `<div class="mk-grid">${Column.divGrid(P, k + 1, 2)}</div>` : '';
    out.push({ q: `Делим <b>${a} : ${b}</b>. Какое <b>первое неполное делимое</b> у тебя?`, exp: P.first,
      wrong: v => ({ t: 'div:first', h: v < b ? `В ${v} число ${b} не помещается ни разу — надо взять ещё цифру.` : `Можно взять меньше цифр: ${b} помещается уже в ${P.first}.` }),
      replay: rp([`Ищем самое маленькое начало числа, в котором ${b} помещается хотя бы 1 раз`, `Первое неполное делимое — <b>${P.first}</b>`, `Значит, в частном будет <b>${String(P.q).length}</b> ${plural(String(P.q).length, 'цифра', 'цифры', 'цифр')}`]) });
    P.steps.forEach((X, k) => {
      out.push({ q: `${X.cur} : ${b} — какую <b>цифру частного</b> ты написал(а)?`, exp: X.q,
        wrong: v => X.q === 0 ? { t: 'div:zero', h: `${X.cur} меньше ${b} — делитель не помещается ни разу. <b>Пишем в частном 0</b> и сносим следующую цифру!` } : v > X.q ? { t: 'div:q', h: `${b} · ${v} = ${b * v} — это больше, чем ${X.cur}. Цифра частного меньше.` } : { t: 'div:q', h: `${X.cur} − ${b * v} = ${X.cur - b * v} — это не меньше ${b}, значит ${b} помещается ещё раз. Цифра частного больше.` },
        replay: rp([`Сколько раз ${b} помещается в ${X.cur}?`, `${b} · ${X.q} = ${X.prod}${X.q < 9 ? ` — подходит, а ${b} · ${X.q + 1} = ${b * (X.q + 1)} — уже больше ${X.cur}` : ''}`, `Пишем в частное <b>${X.q}</b>`]) + grid(k) });
      if (X.q > 0) out.push({ q: `${X.cur} − ${X.q} · ${b}: какой <b>остаток</b> у тебя получился?`, exp: X.rem,
        wrong: v => ({ t: v >= b ? 'div:rem' : 'div:prod', h: `${X.q} · ${b} = ${X.prod}, а ${X.cur} − ${X.prod} = ${X.rem}.${v >= b ? ' Остаток всегда меньше делителя!' : ''}` }),
        replay: rp([`Умножаем: ${X.q} · ${b} = <b>${X.prod}</b>`, `Вычитаем: ${X.cur} − ${X.prod} = <b>${X.rem}</b>`, `${X.rem} < ${b} ✔`]) + grid(k) });
      const nx = P.steps[k + 1];
      if (nx) { const d = String(a)[nx.end]; out.push({ q: `Сносим следующую цифру. Какое число получилось?`, exp: nx.cur,
        wrong: () => ({ t: 'div:next', h: `К остатку ${X.rem} приписываем следующую цифру делимого <b>${d}</b>: получается ${nx.cur}.` }), replay: rp([`Остаток: ${X.rem}`, `Сносим цифру <b>${d}</b>`, `Получилось <b>${nx.cur}</b>`]) }); }
    });
    return out;
  }
  function addFind(a, b, op, ans) { // сложение/вычитание: сверяем цифры ответа по разрядам справа налево
    const P = Column.addPlan(a, b, op), s = String(ans), place = ['единиц', 'десятков', 'сотен', 'тысяч', 'десятков тысяч', 'сотен тысяч', 'миллионов'];
    for (let k = 0; k < Math.max(P.cols.length, s.length); k++) {
      const c = P.cols[k] || { d: 0, da: 0, db: 0, carryIn: 0, carryOut: 0, top: 0, x: 0, sum: 0 }, kd = +(s[s.length - 1 - k] || 0);
      if (kd === c.d) continue;
      let t, h;
      if (op === '+') { t = c.carryIn && kd === (c.d + 9) % 10 ? 'add:carry' : 'add:calc'; h = t === 'add:carry' ? 'Ты <b>не прибавил(а) запомненную единицу</b> из предыдущего разряда.' : 'Ошибка при сложении цифр этого разряда.'; }
      else { const noBorrow = Math.abs(c.da - c.db) % 10, noReduce = ((c.da - c.db) % 10 + 10) % 10; t = (c.carryOut && kd === noBorrow) || (c.carryIn && kd === noReduce) ? 'sub:borrow' : 'sub:calc'; h = t === 'sub:borrow' ? (c.carryOut && kd === noBorrow ? 'Сверху цифра меньше — надо было <b>занять десяток</b> у соседа, а не вычитать «наоборот».' : 'У этой цифры <b>заняли десяток</b> (точка сверху) — её нужно было уменьшить на 1.') : 'Ошибка при вычитании цифр этого разряда.'; }
      const line = op === '+' ? `${c.da} + ${c.db}${c.carryIn ? ' + <b class="cc">1</b> (запомненная)' : ''} = ${c.sum} → пишем <b>${c.d}</b>${c.carryOut ? ', <b class="cc">1</b> запоминаем' : ''}` : `${c.carryIn ? `${c.da} − 1 (заняли) = ${c.top}; ` : ''}${c.carryOut ? `занимаем десяток: ${c.x} − ${c.db}` : `${c.top} − ${c.db}`} = <b>${c.d}</b>`;
      return { k, kd, exp: c.d, t, h: `Разряд <b>${place[k] || ''}</b>: у тебя ${kd}, а должно быть ${c.d}. ${h}`, replay: rp(P.cols.slice(0, k).map((x, i) => `Разряд ${place[i]}: ${x.d} ✔`).concat([line])) };
    }
    return null;
  }
  function eqStepsQ(eq) {
    return E.eqSteps(eq).map((st, i) => { const f = `${st.f[0]} ${E.SYM[st.f[1]]} ${st.f[2]}`, R = E.ROLES[st.role], what = st.E.k === 'x' ? 'x' : E.eqText(st.E);
      return { q: `Шаг ${i + 1}: последнее действие «${E.SYM[st.node.op]}». Чему у тебя равно <b>${esc(what)}</b>?`, exp: st.newC,
        wrong: v => R.wrong(st.c, st.b).map(w => E.calc(...w)).includes(v) ? { t: 'eq:rule:' + st.role, h: `Ты <b>путаешь правило: ${R.gen}</b>.<div class="rule">📏 ${R.rule}</div>` } : { t: 'eq:calc', h: `Правило верное, а в вычислении ошибка: ${f} = ${st.newC}.` },
        replay: rp([`${E.eqText(st.node)} = ${st.c}`, `${esc(what)} — ${R.gen}`, `📏 ${R.rule}`, `${esc(what)} = ${f} = <b>${st.newC}</b>`]) }; });
  }
  SCREENS.paper = arg => {
    let type = PT[arg] ? arg : (S.prefs.paperT || 'mul'), prob = null, own = false, tried = false;
    app.innerHTML = `${topbar('✏️ Проверь мою тетрадь', 'mistakes')}<div class="page mk-paper">${helperHTML('pbub')}<div class="seg pt">${Object.entries(PT).map(([k, n]) => `<button data-pt="${k}" class="${k === type ? 'on' : ''}">${n}</button>`).join('')}</div><div id="pwork"></div></div>`;
    const bub = h => { const b = $('#pbub'); if (b) { b.innerHTML = h; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } };
    const gen = () => { const lv = S.prefs[{ mul: 'mulLv', div: 'divLv', add: 'addLv', eq: 'eqLv' }[type]] || 2;
      if (type === 'mul') { if (lv >= 3 && Math.random() < 0.35) { const [a, b] = E.genMul(lv, { zeros: true }); return { kind: 'mul', a, b }; } const t = makeTask('mul', lv); return { kind: 'mul', a: t.a, b: t.b }; }
      if (type === 'eq') { const t = makeTask('eq', lv); return { kind: 'eq', eq: t.eq }; }
      if (type === 'div') { const P = Column.genDiv(Math.min(4, lv)); return { kind: 'div', a: P.a, b: P.b }; }
      const P = Column.genAdd(Math.min(3, lv), Math.random() < 0.5 ? '+' : '-'); return { kind: 'add', a: P.a, b: P.b, op: P.op }; };
    const answerOf = p => p.kind === 'mul' ? p.a * p.b : p.kind === 'eq' ? p.eq.x : p.kind === 'div' ? Math.floor(p.a / p.b) : p.op === '-' ? p.a - p.b : p.a + p.b;
    const level = p => lvOf(p.kind, p);
    const show = () => {
      tried = false; begin({ ...prob, lv: level(prob) });
      $('#pwork').innerHTML = `<div class="pp-card"><div class="pp-q">${prob.kind === 'eq' ? E.eqHTML(prob.eq.lhs) + ' = ' + prob.eq.rhs : esc(sampleOf(prob))}</div>
        <p class="small center">Реши в тетради ✏️ — а сюда впиши только ответ.</p>
        <div class="pp-ans">${prob.kind === 'eq' ? '<b>x =</b>' : '<b>Ответ:</b>'}<input id="pans" class="nmi pp-in" inputmode="numeric" autocomplete="off" placeholder="?">${prob.kind === 'div' ? '<b>ост.</b><input id="prem" class="nmi pp-in sm" inputmode="numeric" autocomplete="off" placeholder="0">' : ''}</div>
        <div class="row-btns"><button class="btn pink" id="pchk">Проверить ✔</button><button class="btn" id="pnew">🎲 Другой пример</button><button class="btn" id="pown">✍️ Свой пример</button></div></div><div id="psteps"></div>`;
      bub(own ? 'Твой пример! Решай в тетради, а я проверю ответ 🔍' : 'Перепиши пример в тетрадь и реши его. Если ответ не сойдётся — вместе найдём, на каком шаге спряталась ошибка 🐾');
      $('#pchk').addEventListener('click', check); $('#pnew').addEventListener('click', () => { SND.tap(); own = false; prob = gen(); show(); }); $('#pown').addEventListener('click', ownForm);
      $('#pans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    };
    const record = (mistakes, t, f) => { if (tried) return; tried = true; if (mistakes) buf.push({ t, f: f || '' }); taskDone(prob.kind, { mistakes }, { level: level(prob), guided: false, paper: true }); begin({ ...prob }); };
    function check() {
      const v = parseInt(($('#pans').value || '').replace(/\D/g, ''), 10), remRaw = prob.kind === 'div' ? ($('#prem').value || '').replace(/\D/g, '') : '', r = remRaw ? parseInt(remRaw, 10) : 0;
      if (isNaN(v)) { shake($('#pans')); return; }
      // поле остатка не заполнено: пустое поле считаем нулём — но если остаток есть, сначала подсказываем, а не ругаем
      if (prob.kind === 'div' && !remRaw && v === answerOf(prob) && prob.a % prob.b) { SND.tap(); shake($('#prem')); bub('Частное верное! 👍 А поле «ост.» пустое — пустое поле я считаю нулём, но в этом примере <b>остаток есть</b>. Впиши его (если остатка нет — пиши 0).'); try { $('#prem').focus(); } catch (e) { } return; }
      const right = v === answerOf(prob) && (prob.kind !== 'div' || r === prob.a % prob.b);
      if (right) { SND.win(); confetti(20); if (!tried) award(3, 12); record(0); bub(`🎉 Верно! ${esc(sampleOf(prob))}${prob.kind === 'div' && r ? ` (ост. ${r})` : ''} = ${prob.kind === 'eq' ? 'x = ' : ''}${answerOf(prob)}. Ты решил(а) это на бумаге — настоящий сыщик!`);
        $('#psteps').innerHTML = `<div class="row-btns"><button class="btn big pink" id="pnext">Следующий пример →</button></div>`; $('#pnext').addEventListener('click', () => { own = false; prob = gen(); show(); }); return; }
      SND.bad();
      if (prob.kind === 'add') { const f = addFind(prob.a, prob.b, prob.op, v); return f ? found(f, f.kd) : allOk(); }
      if (prob.kind === 'div' && v === answerOf(prob) && r !== prob.a % prob.b) return found({ t: 'div:rem', h: `Частное верное! А остаток: ${prob.a} − ${prob.b} · ${answerOf(prob)} = ${prob.a % prob.b}. Остаток всегда меньше делителя.`, exp: prob.a % prob.b, replay: rp([`${prob.b} · ${answerOf(prob)} = ${prob.b * answerOf(prob)}`, `${prob.a} − ${prob.b * answerOf(prob)} = <b>${prob.a % prob.b}</b>`]) }, r);
      if (prob.kind === 'mul') { // по Моро: сначала нули на конце, при однозначном множителе — сверяем цифры ответа (промежуточных чисел в тетради нет)
        const z = mulZeros(prob.a, prob.b, v); if (z) return found(z, v);
        const M = E.mulPlanMoro(prob.a, prob.b);
        if (M.rows.length === 1) { const got = M.z && v % 10 ** M.z === 0 ? v / 10 ** M.z : v, f = mulDigitFind(M.a0, M.rows[0].bd, got); return f ? found(f, f.kd) : allOk(); }
      }
      const steps = prob.kind === 'mul' ? mulSteps(prob.a, prob.b) : prob.kind === 'div' ? divSteps(prob.a, prob.b) : eqStepsQ(prob.eq);
      bub('Ответ пока не сходится — не беда! Давай пройдём по шагам твоего решения. Пиши, что у тебя в тетради 🔎'); runSteps(steps);
    }
    function runSteps(steps) {
      let i = 0; const box = $('#psteps');
      const ask = () => {
        if (i >= steps.length) return allOk(); const st = steps[i];
        box.innerHTML = `<div class="pp-step"><div class="pp-sn">Шаг ${i + 1} из ${steps.length}</div><div class="pp-sq">${st.q}</div><div class="pp-ans"><input id="psv" class="nmi pp-in" inputmode="numeric" autocomplete="off" placeholder="?"><button class="btn pink" id="psok">Дальше →</button></div></div>`;
        const inp = $('#psv'), go2 = () => { const v = parseInt((inp.value || '').replace(/\D/g, ''), 10); if (isNaN(v)) { shake(inp); return; } if (v === st.exp) { SND.ok(); bub(pick(['✔ Так и есть!', '✔ Верно, идём дальше.', '✔ Этот шаг правильный.'])); i++; ask(); } else { SND.bad(); const w = st.wrong(v); found({ ...w, exp: st.exp, replay: st.replay }, v); } };
        $('#psok').addEventListener('click', go2); inp.addEventListener('keydown', e => { if (e.key === 'Enter') go2(); }); try { inp.focus({ preventScroll: true }); } catch (e) { }
      };
      ask();
    }
    function found(w, v) {
      record(1, w.t, w.f);
      bub('Нашли! Это не ошибка-навсегда, а улика: теперь ясно, что подтянуть 🐾');
      $('#psteps').innerHTML = `<div class="pp-found"><h3>🔎 Вот где спряталась ошибка!</h3><p>У тебя: <b>${v}</b>, а должно быть: <b>${w.exp}</b>.</p><p>${w.h}</p><div class="pp-replay"><b>▶ Как правильно:</b>${w.replay || ''}</div>
        <div class="row-btns"><button class="btn pink" id="pretry">✏️ Исправлю и проверю снова</button><button class="btn" id="pnew2">🎲 Другой пример</button><button class="btn" id="ples">📖 Урок</button></div></div>`;
      $('#pretry').addEventListener('click', () => { $('#psteps').innerHTML = ''; $('#pans').value = ''; const pr = $('#prem'); if (pr) pr.value = ''; $('#pans').focus(); bub('Исправь в тетради и впиши новый ответ ✏️'); });
      $('#pnew2').addEventListener('click', () => { own = false; prob = gen(); show(); });
      $('#ples').addEventListener('click', () => { const [s, a] = LESSON(prob.kind); go(s, a); });
    }
    function allOk() {
      record(1, 'copy');
      $('#psteps').innerHTML = `<div class="pp-found"><h3>🔎 Все шаги верные!</h3><p>Значит, ошибка закралась, когда ответ переписывали из тетради. Правильный ответ: <b>${answerOf(prob)}${prob.kind === 'div' && prob.a % prob.b ? ` (ост. ${prob.a % prob.b})` : ''}</b>.</p><div class="row-btns"><button class="btn pink" id="pnew2">🎲 Другой пример</button></div></div>`;
      $('#pnew2').addEventListener('click', () => { own = false; prob = gen(); show(); });
    }
    function ownForm() {
      SND.tap(); const n = (id, ph) => `<input id="${id}" class="nmi pp-in" inputmode="numeric" autocomplete="off" placeholder="${ph}">`;
      $('#pwork').innerHTML = `<div class="pp-card"><h3>✍️ Свой пример</h3><p class="small">Впиши пример из учебника или с доски.</p><div class="pp-own">${type === 'eq' ? '<input id="oeq" class="nmi" autocomplete="off" placeholder="(x + 15) · 4 = 120">' : type === 'add' ? `${n('oa', 'число')}<select id="oop" class="pp-op"><option value="+">+</option><option value="-">−</option></select>${n('ob', 'число')}` : `${n('oa', type === 'div' ? 'делимое' : 'число')}<b>${type === 'div' ? ':' : '×'}</b>${n('ob', type === 'div' ? 'делитель' : 'число')}`}</div>
        <p class="small" id="oerr"></p><div class="row-btns"><button class="btn pink" id="pownok">Готово</button><button class="btn" id="pcancel">Отмена</button></div></div><div id="psteps"></div>`;
      $('#pcancel').addEventListener('click', () => { if (!prob) prob = gen(); show(); });
      $('#pownok').addEventListener('click', () => {
        const err = t => { $('#oerr').textContent = t; SND.bad(); };
        if (type === 'eq') { const eq = parseEq($('#oeq').value); if (!eq) return err('Не получилось прочитать уравнение. Пиши так: (x + 15) · 4 = 120 — один x, целые числа.'); prob = { kind: 'eq', eq }; }
        else { const a = parseInt($('#oa').value, 10), b = parseInt($('#ob').value, 10); if (!(a > 0) || !(b > 0)) return err('Впиши оба числа.');
          if (type === 'mul') { if (a > 99999 || b > 9999) return err('Слишком большие числа для тетради 🙂'); prob = { kind: 'mul', a, b }; }
          else if (type === 'div') { if (b < 2 || b > 999 || a < b || a > 9999999) return err('Делитель — от 2, а делимое больше делителя.'); prob = { kind: 'div', a, b }; }
          else { const op = $('#oop').value; if (a > 9999999 || b > 9999999) return err('Слишком большие числа 🙂'); if (op === '-' && b > a) return err('При вычитании первое число должно быть больше.'); prob = { kind: 'add', a, b, op }; } }
        own = true; show();
      });
    }
    $$('[data-pt]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); type = b.dataset.pt; S.prefs.paperT = type; save(); $$('[data-pt]', app).forEach(x => x.classList.toggle('on', x === b)); own = false; prob = gen(); show(); }));
    prob = gen(); show();
  };

  /* ---------- листок для печати ---------- */
  function wsProblem(kind, lv) {
    if (kind === 'mul') { const [a, b] = E.genMul(Math.max(1, Math.min(4, lv)), { zeros: true }); return { t: `${a} × ${b} =`, ans: a * b }; }
    if (kind === 'eq') { const eq = E.genEq(Math.max(1, Math.min(4, lv))); return { t: `${E.eqText(eq.lhs)} = ${eq.rhs}`, ans: 'x = ' + eq.x, eq: true }; }
    if (kind === 'div') { const P = Column.genDiv(Math.max(1, Math.min(4, lv))); return { t: `${P.a} : ${P.b} =`, ans: P.q + (P.r ? ` (ост. ${P.r})` : '') }; }
    const P = Column.genAdd(Math.max(1, Math.min(3, lv)), Math.random() < 0.5 ? '+' : '-'); return { t: `${P.a} ${P.op === '-' ? '−' : '+'} ${P.b} =`, ans: P.res };
  }
  function weakTopics() { const s = schoolItems().map(e => [e.k, e.lv]); return s.length ? s : null; }
  SCREENS.worksheet = arg => {
    const [from, mode] = String(arg || '').split(':'), back = from === 'p' ? 'parents' : 'mistakes', W = S.prefs.ws = S.prefs.ws || { mul: true, eq: true, div: false, add: false, n: 10 };
    const lvl = k => Math.min(k === 'add' ? 3 : 4, S.prefs[k + 'Lv'] || (k === 'div' || k === 'add' ? 1 : 2));
    app.innerHTML = `${topbar('🖨️ Листок для тетради', back)}<div class="page ws-page"><div class="card ws-noprint" id="wsopt"><h3>Что тренируем?</h3>
      ${KINDS.map(k => `<label class="tgl"><input type="checkbox" data-wk="${k}" ${W[k] ? 'checked' : ''}> ${ICON[k]} ${KNAME[k]} <small class="small">· уровень ${lvl(k)}</small></label>`).join('')}
      <div class="ws-n"><b>Сколько примеров:</b> ${[8, 10, 12].map(n => `<button class="chip ${W.n === n ? 'on' : ''}" data-wn="${n}">${n}</button>`).join('')}</div>
      <div class="row-btns"><button class="btn pink" id="wsmake">Сделать листок</button><button class="btn" id="wsweak">🎯 По слабым темам</button></div><p class="small" id="wsmsg"></p></div><div id="wsout"></div></div>`;
    $$('[data-wk]', app).forEach(c => c.addEventListener('change', () => { W[c.dataset.wk] = c.checked; save(); }));
    $$('[data-wn]', app).forEach(b => b.addEventListener('click', () => { W.n = +b.dataset.wn; save(); $$('[data-wn]', app).forEach(x => x.classList.toggle('on', x === b)); }));
    const make = topics => {
      const items = []; for (let i = 0; i < W.n; i++) { const [k, lv] = topics[i % topics.length]; items.push(wsProblem(k, lv)); }
      const nm = esc(S.kid || ''), date = new Date().toLocaleDateString('ru-RU');
      $('#wsout').innerHTML = `<div class="row-btns ws-noprint"><button class="btn big pink" id="wsprint">🖨️ Печать</button><button class="btn" id="wsagain">🔄 Другие примеры</button></div>
        <div class="ws-print"><div class="ws-sheet"><div class="ws-head"><b>🐾 Мурлок и Ко · Листок для тетради</b><span>Имя: ${nm || '__________'} &nbsp; Дата: ${date}</span></div><p class="ws-tip">Реши в клеточках. Не торопись и проверь каждый ответ — ошибаться не страшно!</p>
          <div class="ws-grid">${items.map((p, i) => `<div class="ws-item"><div class="ws-t"><b>${i + 1}.</b> ${esc(p.t)}</div><div class="ws-space"></div></div>`).join('')}</div></div>
        <div class="ws-sheet ws-key"><div class="ws-head"><b>🔑 Ответы (для взрослых)</b><span>${date}</span></div><ol class="ws-ans">${items.map(p => `<li>${esc(p.t.replace(/ =$/, ''))} → <b>${esc(String(p.ans))}</b></li>`).join('')}</ol></div></div>`;
      $('#wsprint').addEventListener('click', () => { SND.tap(); try { window.print(); } catch (e) { } });
      $('#wsagain').addEventListener('click', () => make(topics));
    };
    $('#wsmake').addEventListener('click', () => { const t = KINDS.filter(k => W[k]).map(k => [k, lvl(k)]); if (!t.length) { $('#wsmsg').textContent = 'Отметь хотя бы одну тему 🙂'; return; } SND.tap(); make(t); });
    const weak = () => { const t = weakTopics(); $('#wsmsg').textContent = t ? `Слабые темы: ${[...new Set(t.map(([k, lv]) => name(k + lv)))].join(', ')}` : 'Слабых тем сейчас нет — взяли все темы на текущем уровне 👍'; make(t || KINDS.map(k => [k, lvl(k)])); };
    $('#wsweak').addEventListener('click', () => { SND.tap(); weak(); });
    if (mode === 'weak') weak();
  };

  /* ---------- уроки по порядку ---------- */
  const acadOf = sid => (S.acad || {})[sid] || { read: {}, best: {}, box: {}, seen: {} };
  function acadStarted(sid, uid) {
    const a = acadOf(sid); if ((a.read || {})[uid] || (a.best || {})[uid] != null) return true;
    if ((S.theory || {})['a:' + sid + ':' + uid] || (S.sk || {})['a:' + sid + ':' + uid]) return true;
    const pre = uid + '#'; return Object.keys(a.box || {}).some(k => k.startsWith(pre)) || Object.keys(a.seen || {}).some(k => k.startsWith(pre));
  }
  const CORE = () => (window.School4 && School4.CORE) || {};
  function coreStarted(k) { const c = CORE()[k]; if (!c) return true; return !!(S.lessons[k] || c.done() > 0 || (S.theory || {})[c.th] || (S.sk || {})[k + '1'] || (S.sk || {})[k + '2'] || (S.sk || {})[k + '3'] || (S.sk || {})[k + '4']); }
  function itemDone(x) { // урок пройден + немного практики
    if (x[0] === '@') { const k = x.slice(1), c = CORE()[k]; if (!c) return true; return !!(S.lessons[k] || (S.theory || {})[c.th]) && c.done() > 0; }
    const a = acadOf('math4'); return !!(a.read || {})[x] && (a.best || {})[x] != null;
  }
  const groupOf = x => window.School4 ? School4.GROUPS.find(g => g.items.includes(x)) : null;
  function schoolOpen(x) {
    if (S.unlockAll || window.GOD) return true; const G = groupOf(x); if (!G) return true; const i = G.items.indexOf(x); if (i <= 0) return true;
    if (x[0] === '@' ? coreStarted(x.slice(1)) : acadStarted('math4', x)) return true;
    return itemDone(G.items[i - 1]);
  }
  function unitOpen(sid, uid) {
    if (S.unlockAll || window.GOD) return true; if (sid === 'math4') return schoolOpen(uid);
    const s = (window.SUBJECTS || {})[sid]; if (!s) return true; const i = s.units.findIndex(u => u.id === uid); if (i <= 0) return true;
    if (acadStarted(sid, uid)) return true; const p = s.units[i - 1], a = acadOf(sid);
    return !!(a.read || {})[p.id] && (!(p.quiz && p.quiz.length) || ((a.best || {})[p.id] || 0) >= 1);
  }
  function topicOpen(p) { if (!p) return true; if (KINDS.includes(p.id)) return schoolOpen('@' + p.id); if (p.subject) return unitOpen(p.subject, p.unit); return true; }
  const titleOf = x => { if (x[0] === '@') return (CORE()[x.slice(1)] || {}).title || ''; const u = ((window.SUBJECTS || {}).math4 || { units: [] }).units.find(y => y.id === x); return u ? u.title : ''; };
  const lockHTML = txt => `<span class="lockb">🔒 ${txt}</span>`;
  function lockSchool() {
    if (!window.School4 || S.unlockAll) return;
    School4.GROUPS.forEach(G => G.items.forEach((x, i) => {
      if (schoolOpen(x)) return; const el = x[0] === '@' ? $(`.school-card.${x.slice(1)}`, app) : $(`.unit[data-u="${x}"]`, app); if (!el) return;
      el.classList.add('locked'); const ub = $('.ub', el); if (ub) ub.innerHTML = lockHTML(`Откроется после темы «${esc(titleOf(G.items[i - 1]))}»`);
    }));
  }
  function lockSubject(sid) {
    if (S.unlockAll) return; const s = (window.SUBJECTS || {})[sid]; if (!s) return;
    $$('.units > .unit', app).forEach((el, i) => { const u = s.units[i]; if (!u || unitOpen(sid, u.id)) return; el.classList.add('locked'); const ub = $('.ub', el);
      if (ub) ub.innerHTML = lockHTML(sid === 'math4' ? `Откроется после темы «${esc(titleOf((groupOf(u.id) || { items: [] }).items[(groupOf(u.id) || { items: [] }).items.indexOf(u.id) - 1] || ''))}»` : `Откроется после урока ${i}`); });
  }

  /* ---------- встраивание в экраны ---------- */
  const wrap = (n, f) => { const s = SCREENS[n]; if (!s) return; SCREENS[n] = arg => { const r = s(arg); try { f(arg); } catch (e) { console.warn(e); } return r; }; };
  wrap('home', () => {
    const anchor = $('.tiles .t-bug', app) || $('.tiles .tile:last-child', app); if (!anchor) return; const n = count();
    anchor.insertAdjacentHTML('afterend', `<button class="tile t-mist ${n ? 'mk-has' : ''}" data-go="mistakes"><span class="ti">🩹</span><b>Работа над ошибками</b><small>${n ? `${n} ${plural(n, 'тема', 'темы', 'тем')} — разберём вместе` : 'Проверь тетрадь, распечатай листок'}</small></button>`);
  });
  wrap('school', () => { lockSchool(); const rb = $('.school4 .row-btns', app); if (rb) { const n = count(); rb.insertAdjacentHTML('afterbegin', `<button class="btn mk-btn" data-go="mistakes" data-arg="school">🩹 Работа над ошибками${n ? ` (${n})` : ''}</button>`); } });
  wrap('academy', () => { const p = $('.page > p.center', app); if (p) { const n = acadItems().length; p.insertAdjacentHTML('afterend', `<div class="row-btns"><button class="btn mk-btn" data-go="mistakes" data-arg="academy">🩹 Работа над ошибками${n ? ` (${n})` : ''}</button></div>`); } });
  wrap('subject', id => lockSubject(id));
  wrap('parents', () => {
    const pg = $('.page.parents', app); if (!pg) return; const reset = $('#reset', pg);
    const html = `<div class="card"><h3>🖨️ Листок для тетради</h3><p class="small">8–12 примеров по выбранным темам или по слабым местам ребёнка, с местом для решения. Вторая страница — ответы для проверки.</p><div class="row-btns"><button class="btn pink" data-go="worksheet" data-arg="p">Сделать листок</button><button class="btn" data-go="worksheet" data-arg="p:weak">🎯 По слабым темам</button></div></div>
      <div class="card"><h3>🔓 Настройки уроков</h3><label class="tgl"><input type="checkbox" id="unlockAll" ${S.unlockAll ? 'checked' : ''}> Открыть все уроки</label><p class="small">Обычно уроки открываются по порядку: следующий — когда пройден предыдущий урок и тренажёр (хотя бы на ⭐). Первый урок каждой темы открыт сразу, а всё, что ребёнок уже начинал, остаётся открытым.</p></div>`;
    if (reset) reset.insertAdjacentHTML('beforebegin', html); else pg.insertAdjacentHTML('beforeend', html);
    $('#unlockAll', pg).addEventListener('change', e => { S.unlockAll = e.target.checked; save(); toast(S.unlockAll ? '🔓 Все уроки открыты' : '🔒 Уроки снова открываются по порядку'); });
  });
  ['mistakes', 'mdrill', 'paper', 'worksheet'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  // излеченные вопросы Академии — для «исправлено за неделю» (Coach подключается позже)
  setTimeout(() => { if (window.Coach && Coach.cured && !Coach.cured.mk) { const cu = Coach.cured; Coach.cured = function () { S.mcured = (S.mcured || []).concat(DAY()).slice(-200); return cu.apply(this, arguments); }; Coach.cured.mk = 1; } }, 0);

  /* ---------- стили ---------- */
  const css = `
  .t-mist .ti { background: #FFE9D6; } .t-mist.mk-has .ti { box-shadow: 0 0 0 3px var(--gold) inset; }
  .mk-btn { background: #FFF3E3; }
  .mk-page .mk-h { margin: 18px 4px 8px; }
  .mk-item { display: grid; grid-template-columns: 44px 1fr; gap: 6px 10px; background: #fff; border-radius: 18px; padding: 12px; box-shadow: var(--sh); margin-bottom: 10px; }
  .mk-ic { font-size: 30px; text-align: center; } .mk-b { min-width: 0; } .mk-b small { color: var(--muted); display: block; }
  .mk-what { margin: 4px 0; font-size: 15px; } .mk-prog { color: var(--mint-d); letter-spacing: 2px; font-size: 16px; }
  .mk-act { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; }
  .mk-fixed .chip { background: var(--mint-2); }
  .mk-rep { background: #FFF6E9; border-radius: 14px; padding: 10px 12px; margin: 6px 0 10px; font-size: 15px; }
  .mk-col { display: flex; flex-direction: column; gap: 8px; align-items: stretch; max-width: 360px; margin: 10px auto 0; }
  .mk-note { margin: 6px 4px 8px; font-size: 15px; } .mk-end { margin-top: 12px; }
  .mk-paper .seg.pt { flex-wrap: wrap; margin: 8px 0; }
  .pp-card, .pp-step, .pp-found { background: #fff; border-radius: 20px; padding: 16px; box-shadow: var(--sh2); margin: 10px 0; }
  .pp-q { font-size: clamp(26px, 8vw, 40px); font-weight: 900; text-align: center; margin: 6px 0; word-break: break-word; }
  .pp-ans { display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; margin: 8px 0; }
  .pp-in { max-width: 170px; font-size: 24px; padding: 10px; } .pp-in.sm { max-width: 90px; }
  .pp-own { display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; } .pp-own .nmi { max-width: 150px; } .pp-own #oeq { max-width: 100%; }
  .pp-op { font: inherit; font-size: 24px; font-weight: 900; padding: 8px; border-radius: 12px; border: 3px solid var(--line); background: #fff; }
  .pp-sn { color: var(--muted); font-size: 13px; font-weight: 800; } .pp-sq { font-size: 18px; margin: 6px 0; }
  .pp-found { border: 3px solid var(--gold); } .pp-found h3 { margin-top: 0; }
  .pp-replay { background: var(--plum-2); border-radius: 14px; padding: 10px 12px; margin: 8px 0; }
  .pp-replay .rp { opacity: 0; animation: rpIn .4s ease forwards; padding: 3px 0; font-size: 16px; } .pp-replay .cc { color: var(--pink-d); } .pp-replay .g { color: var(--muted); }
  @keyframes rpIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .mk-grid { margin-top: 8px; overflow-x: auto; }
  .unit.locked { opacity: .62; filter: grayscale(.45); } .lockb { font-size: 14px; font-weight: 800; color: var(--muted); padding: 6px 0; }
  .ws-n { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin: 8px 0; } .ws-n .chip.on { background: var(--pink); color: #fff; }
  .ws-sheet { background: #fff; color: #222; border-radius: 12px; padding: 16px; margin: 12px 0; box-shadow: var(--sh2); }
  .ws-head { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; border-bottom: 2px solid #333; padding-bottom: 6px; }
  .ws-tip { font-size: 13px; color: #555; margin: 6px 0 10px; }
  .ws-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ws-item { border: 1px solid #bbb; border-radius: 8px; padding: 8px; break-inside: avoid; }
  .ws-t { font-size: 18px; font-weight: 800; }
  .ws-space { height: 120px; margin-top: 6px; background-image: linear-gradient(#cfe0f0 1px, transparent 1px), linear-gradient(90deg, #cfe0f0 1px, transparent 1px); background-size: 16px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .ws-ans { columns: 2; font-size: 16px; } .ws-ans li { margin: 4px 0; break-inside: avoid; }
  @media (max-width: 520px) { .ws-grid { grid-template-columns: 1fr; } .ws-ans { columns: 1; } }
  @media print {
    @page { size: A4; margin: 12mm; }
    body { background: #fff !important; } body * { visibility: hidden !important; }
    .ws-print, .ws-print * { visibility: visible !important; }
    .ws-print { position: absolute; left: 0; top: 0; width: 100%; }
    .ws-sheet { box-shadow: none; border-radius: 0; margin: 0; padding: 0; }
    .ws-grid { grid-template-columns: 1fr 1fr; } .ws-space { height: 150px; }
    .ws-key { break-before: page; page-break-before: always; }
    .ws-noprint, #mascot, .toast, .upd { display: none !important; }
  }`;
  if (!document.getElementById('mk-css')) { const st = document.createElement('style'); st.id = 'mk-css'; st.textContent = css; document.head.appendChild(st); }

  return { begin, isSolved, solve, sigOf, count, weekFixed, reportHTML, schoolItems, acadItems, errText, parseEq, unitOpen, schoolOpen, topicOpen, mulSteps, divSteps, addFind, eqStepsQ, _ctx: () => ctx, _buf: () => buf, _reset() { lastPrompt = 0; lastDom = null; } };
})();
window.Mistakes = Mistakes;
