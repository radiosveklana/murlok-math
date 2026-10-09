/* taskbank.js — «копилка задач»: единый реестр тем Школы. Каждая тема (столбик, уравнения, деление, сложение,
   все темы программы 4 класса, а в будущем — логика, русский язык и т. д.: предмет с school:true и генераторами)
   становится источником задач. Из копилки берут задачи «Новое дело» («Вся программа» / «Выбрать темы»),
   бонусный «Полёт в космос», «Ошибки Енота» и др. */
'use strict';
const TaskBank = (() => {
  const P = [];
  const reg = p => { if (!P.some(x => x.id === p.id)) P.push(p); };
  const lvMul = d => ({ 1: 2, 2: 3, 3: 4 })[d] || 2, lvEq = d => ({ 1: 2, 2: 3, 3: 4 })[d] || 2;
  reg({ id: 'mul', group: '✍️ Письменные вычисления', name: 'Умножение столбиком', icon: '✖️', make: d => makeTask('mul', lvMul(d)) });
  reg({ id: 'eq', group: '📦 Уравнения', name: 'Составные уравнения', icon: '📦', make: d => makeTask('eq', lvEq(d)) });
  reg({ id: 'div', group: '✍️ Письменные вычисления', name: 'Деление столбиком', icon: '➗', make: d => ({ kind: 'div', level: d, P: Column.genDiv(Math.min(4, d + (d === 3 ? 0 : 0))) }) });
  reg({ id: 'add', group: '✍️ Письменные вычисления', name: 'Сложение и вычитание', icon: '➕', make: d => ({ kind: 'add', level: d, P: Column.genAdd(d, Math.random() < 0.5 ? '+' : '-') }) });
  function scan() { // темы с генераторами задач: программа 4 класса и будущие школьные предметы
    const groupOf = (sid, uid) => { const G = window.School4 && sid === 'math4' ? School4.GROUPS.find(g => g.items.includes(uid)) : null; return G ? G.t : '📚 ' + (window.SUBJECTS[sid] || {}).name; };
    Object.values(window.SUBJECTS || {}).filter(s => s.id === 'math4' || s.school).forEach(s => s.units.filter(u => typeof u.gen === 'function').forEach(u => reg({ id: s.id + ':' + u.id, subject: s.id, unit: u.id, group: groupOf(s.id, u.id), name: u.title, icon: u.icon,
      make: d => ({ kind: 'aq', level: d, src: s.id + ':' + u.id, title: u.title, icon: u.icon, q: u.gen(d), regen: () => u.gen(d) }) })));
  }
  const list = () => { scan(); return P.slice(); };
  function pick(ids, n, d) { // n задач из разных тем (если тем меньше — повторяем)
    const pool = list().filter(p => !ids || !ids.length || ids.includes(p.id)), out = []; if (!pool.length) return out;
    let bag = shuffle(pool);
    for (let i = 0; i < n; i++) { if (!bag.length) bag = shuffle(pool); const p = bag.shift(); try { const t = p.make(d); t.pid = p.id; t.title = t.title || p.name; t.icon = t.icon || p.icon; out.push(t); } catch (e) { console.warn(e); i--; if (out.length + bag.length === 0) break; } }
    return out;
  }
  /* ---------- как показать задачу из копилки внутри дела ---------- */
  function mountAQ(el, t, onDone) {
    let mistakes = 0, q = t.q;
    const show = () => {
      el.innerHTML = `<div class="task-title">${t.icon} ${t.title}</div><div class="aq-box">${(ACAD_Q[q.type] || ACAD_Q.one).render(q)}</div><div id="aqwhy" class="aq-why"></div>`; window.__aq = q;
      (ACAD_Q[q.type] || ACAD_Q.one).bind($('.aq-box', el), q, (r, why) => {
        const box = $('#aqwhy', el); if (!box) return;
        if (r) { SND.ok(); box.innerHTML = `<div class="fb">✔ Верно!</div>${why || ''}`; if (window.Coach && t.src) Coach.track('a:' + t.src, mistakes ? 0.6 : 1, { count: false }); setTimeout(() => onDone({ mistakes, helped: mistakes >= 3 }), 1100); return; }
        mistakes++; SND.bad(); if (typeof noteErr === 'function') noteErr('aq');
        box.innerHTML = `<div class="fb bad">Не совсем.</div>${why || ''}<div class="row-btns"><button class="btn pink" id="aqnext">${mistakes >= 3 ? 'Дальше →' : 'Попробовать другую задачу'}</button></div>`;
        $('#aqnext', el).addEventListener('click', () => { if (mistakes >= 3 || !t.regen) onDone({ mistakes, helped: true }); else { q = t.regen(); show(); } });
      });
    };
    show();
  }
  function mountCol(el, t, onDone) {
    el.innerHTML = `<div class="helper"><div class="mini-cat">${myCat({ cls: 'mini' })}</div><div class="bubble" id="tbbub"></div></div><div id="tbcol"></div>`;
    const bub = h => { const b = $('#tbbub', el); if (b) b.innerHTML = h; };
    const fin = (lv, mistakes, helped) => onDone({ mistakes, helped });
    if (t.kind === 'div') Column.runDiv($('#tbcol', el), t.P, false, bub, fin, true); else Column.runAdd($('#tbcol', el), t.P, false, bub, fin, true);
  }
  const mt = mountTask;
  mountTask = function (el, t, guided, onDone) {
    if (t.kind === 'aq') return mountAQ(el, t, onDone);
    if (t.kind === 'div' || t.kind === 'add') return mountCol(el, t, onDone);
    return mt.apply(this, arguments);
  };
  /* ---------- «Новое дело»: «Вся программа» и «Выбрать темы» ---------- */
  const sc = startCase;
  startCase = function (topic, diff) {
    if (topic !== 'all' && topic !== 'pick') return sc.apply(this, arguments);
    sc('mix', diff); if (!CASE) return;
    const ids = topic === 'pick' ? (S.prefs.caseTopics || []) : null;
    const t = pick(ids, 4, diff); if (t.length === 4) CASE.tasks = t; CASE.topic = topic;
  };
  { const nc = SCREENS.newcase; SCREENS.newcase = arg => {
    nc(arg); const grid = $('.choice-grid.topic', app); if (!grid) return; const p = S.prefs;
    grid.insertAdjacentHTML('beforeend', `<button class="choice" data-t="all"><span>📐</span><b>Вся программа</b><small>улики из всех тем Школы · 🍬×1,5</small></button><button class="choice" data-t="pick"><span>🎯</span><b>Выбрать темы</b><small id="pickn">${(p.caseTopics || []).length ? 'тем: ' + p.caseTopics.length : 'какие темы потренировать'} · 🍬×1,5</small></button>`);
    $$('.choice[data-t="all"], .choice[data-t="pick"]', grid).forEach(b => { b.classList.toggle('on', b.dataset.t === p.topic); b.addEventListener('click', () => { p.topic = b.dataset.t; save(); $$('.choice', grid).forEach(x => x.classList.toggle('on', x === b)); SND.tap(); if (b.dataset.t === 'pick') pickTopics(); }); });
  }; }
  function pickTopics() {
    const L = list(), groups = [...new Set(L.map(p => p.group))], sel = new Set(S.prefs.caseTopics || []);
    const m = modal(`<h2>🎯 Какие темы в деле?</h2><div class="tb-pick">${groups.map(g => `<h4>${g}</h4>${L.filter(p => p.group === g).map(p => `<label class="tgl"><input type="checkbox" value="${p.id}" ${sel.has(p.id) ? 'checked' : ''}> ${p.icon} ${p.name}</label>`).join('')}`).join('')}</div><div class="row-btns"><button class="btn pink" id="tbok">Готово</button><button class="btn" id="tball">Все</button></div>`);
    $('#tball', m.el).addEventListener('click', () => $$('input', m.el).forEach(i => { i.checked = true; }));
    $('#tbok', m.el).addEventListener('click', () => { S.prefs.caseTopics = $$('input:checked', m.el).map(i => i.value); save(); m.close(); const n = $('#pickn'); if (n) n.textContent = (S.prefs.caseTopics.length ? 'тем: ' + S.prefs.caseTopics.length : 'какие темы потренировать') + ' · 🍬×1,5'; });
  }
  S.st.aq = S.st.aq || { done: 0, perfect: 0 }; S.st.div = S.st.div || { done: 0, perfect: 0 }; S.st.add = S.st.add || { done: 0, perfect: 0 };
  const sv = solvedTotal; solvedTotal = function () { return sv() + ((S.st.aq || {}).done || 0); }; // задачи из копилки тоже открывают комнаты
  return { reg, list, pick, mountAQ };
})();
window.TaskBank = TaskBank;
