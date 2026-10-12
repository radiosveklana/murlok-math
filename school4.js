/* school4.js — «Школа сыщика» = один раздел «Математика 4 класс»: все темы программы в одном месте.
   Старые темы (столбик, уравнения, деление, сложение/вычитание) — с теми же уроками, «Решаем вместе», уровнями и прогрессом;
   темы программы — учебник и тренажёр с бесконечными задачами. */
'use strict';
const School4 = (() => {
  const GROUPS = [
    { t: '✍️ Письменные вычисления', items: ['@mul', '@div', '@add'] },
    { t: '📦 Уравнения', items: ['@eq', 'eq_moro'] },
    { t: '🔢 Числа до миллиона', items: ['million_read', 'million_compare', 'more_less', 'million_classes'] },
    { t: '📏 Величины', items: ['length_mass', 'time', 'area_units', 'part_qty', 'volume_capacity', 'area_big', 'compound_units', 'calendar_time'] },
    { t: '🧮 Вычисления', items: ['round_mul', 'remainder', 'order_ops', 'props', 'expr4'] },
    { t: '🚗 Задачи', items: ['motion', 'motion_two', 'work', 'buy', 'part_num', 'motion_chase', 'proportional', 'task_3_4'] },
    { t: '📐 Геометрия и данные', items: ['shapes', 'data_logic', 'logic_plus'] },
  ];
  const CORE = {
    mul: { icon: '✖️', title: 'Умножение столбиком', sub: 'Справа налево, «запомненное», сдвиг строки', lesson: ['lesson', 'mul'], prac: ['practice', 'mul'], done: () => S.st.mul.done, th: 't:mul' },
    eq: { icon: '📦', title: 'Составные уравнения', sub: 'Метод коробки: последнее действие → компонент → правило', lesson: ['lesson', 'eq'], prac: ['practice', 'eq'], done: () => S.st.eq.done, th: 't:eq' },
    div: { icon: '➗', title: 'Деление столбиком', sub: 'На одно- и двузначное, с нулём в частном и с остатком', lesson: ['collesson', 'div'], prac: ['colwork', 'div'], done: () => (S.st.div || {}).done || 0, th: 't:div' },
    add: { icon: '➕', title: 'Сложение и вычитание столбиком', sub: 'Числа до миллиона: переход через разряд, «занимаем десяток»', lesson: ['collesson', 'add'], prac: ['colwork', 'add'], done: () => (S.st.add || {}).done || 0, th: 't:add' },
  };
  // какие группы раскрыты (по умолчанию — письменные вычисления и уравнения); помним в пределах сеанса
  const openSet = () => { try { return JSON.parse(sessionStorage.getItem('school-open') || '[0,1]'); } catch (e) { return [0, 1]; } };
  const openG = i => openSet().includes(i);
  SCREENS.school = () => {
    const s = (window.SUBJECTS || {}).math4, a = s && typeof acad === 'function' ? acad('math4') : { read: {}, best: {} }, due = s && typeof dueMistakes === 'function' ? dueMistakes('math4').length : 0;
    const coreRow = k => { const c = CORE[k], th = ((S.theory || {})[c.th] || {}).verified, n = c.done(); return `<div class="unit school-card ${k}"><span class="ui">${c.icon}</span><div class="ut"><b>${c.title}</b><small>${c.sub}</small><span class="small">${n ? `решено: ${n}` : 'ещё не начинали'}</span></div><div class="ub"><button class="btn sm" data-go="${c.lesson[0]}" data-arg="${c.lesson[1]}">📖 Урок${th || S.lessons[k] ? ' ✔' : ''}</button><button class="btn sm pink" data-go="${c.prac[0]}" data-arg="${c.prac[1]}">🐾 Решаем вместе</button></div></div>`; };
    const unitRow = id => { const u = s && s.units.find(x => x.id === id); if (!u) return ''; const st = (a.best || {})[u.id] || 0; return `<div class="unit ${(a.read || {})[u.id] ? 'read' : ''}" data-u="${u.id}"><span class="ui">${u.icon}</span><div class="ut"><b>${u.title}</b><small>${u.sub || ''}</small><span class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span></div><div class="ub"><button class="btn sm" data-al="${u.id}">📖 Учебник${(a.read || {})[u.id] ? ' ✔' : ''}</button><button class="btn sm pink" data-aq="${u.id}">🎯 Тренажёр</button></div></div>`; };
    const prog = s && typeof subjProgress === 'function' ? subjProgress('math4') : 0;
    app.innerHTML = `${topbar('Школа сыщика')}<div class="page school4">
      <div class="school-head"><div class="sc-ic">📐</div><div><h2>Математика 4 класс</h2><p class="small">Вся программа 4 класса по федеральной программе. Сначала урок, потом «Решаем вместе» с подсказками, а когда получается — дела и тренажёр самостоятельно!</p><span class="bar"><i style="width:${prog}%"></i></span><small>${prog}% программы</small></div></div>
      <div class="row-btns">${due ? `<button class="btn pink" data-go="aquiz" data-arg="math4:*review">🔁 Разбор ошибок (${due})</button>` : ''}<button class="btn" data-go="newcase">🔍 Решать в деле</button><button class="btn vpr-btn" data-go="vpr">📝 Пробная ВПР</button></div>
      ${GROUPS.map((g, gi) => { const n = g.items.length, done = g.items.filter(x => x[0] === '@' ? CORE[x.slice(1)].done() > 0 : (a.read || {})[x]).length;
        return `<details class="sgroup" data-g="${gi}" ${openG(gi) ? 'open' : ''}><summary><h3 class="sg-title">${g.t}</h3><span class="sg-n">${done} из ${n}</span></summary><div class="units">${g.items.map(x => x[0] === '@' ? coreRow(x.slice(1)) : unitRow(x)).join('')}</div></details>`; }).join('')}
    </div>`;
    $$('details.sgroup', app).forEach(d => d.addEventListener('toggle', () => { try { sessionStorage.setItem('school-open', JSON.stringify($$('details.sgroup', app).filter(x => x.open).map(x => +x.dataset.g))); } catch (e) { } }));
    $$('[data-al]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('alesson', 'math4:' + b.dataset.al); }));
    $$('[data-aq]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('aquiz', 'math4:' + b.dataset.aq); }));
  };

  /* ================= 📝 Пробная ВПР (v35) =================
     12 номеров, как во Всероссийской проверочной работе за 4 класс; баллы как в ВПР: за задание 1 или 2 балла.
     Задание на 2 балла: верно с первой попытки — 2, со второй — 1, иначе 0. Задание на 1 балл: верно сразу — 1.
     №5 (геометрия на клетчатой бумаге) и №11 (пространственное мышление) пока не проверяются — нужны рисунки. */
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const VPR = [
    { n: 1, max: 1, t: 'Вычисления', u: 'order_ops', make: () => { const a = R(120, 900), b = R(20, 99), c = R(10, 99), plus = R(0, 1) === 1, v = a + b - c; return { type: 'input', q: `Найди значение выражения:<br><b>${plus ? `${a} + ${b} − ${c}` : `${a} − ${c} + ${b}`}</b>`, c: v, why: `Действия одной ступени выполняем слева направо: ${plus ? `${a} + ${b} = ${a + b}; ${a + b} − ${c} = ${v}` : `${a} − ${c} = ${a - c}; ${a - c} + ${b} = ${v}`}. Ответ: <b>${v}</b>.` }; } },
    { n: 2, max: 1, t: 'Порядок действий', src: [['order_ops', 1]] },
    { n: 3, max: 2, t: 'Простая задача', src: [['buy', 1], ['work', 1], ['part_num', 1]] },
    { n: 4, max: 1, t: 'Величины', src: [['time', 2], ['length_mass', 2], ['compound_units', 1]] },
    { n: 5, skip: 'Геометрия на клетчатой бумаге — появится позже' },
    { n: 6, max: 2, t: 'Таблицы и диаграммы', src: [['data_logic', 1]], need: q => /<table/.test(q.q) },
    { n: 7, max: 1, t: 'Действия с многозначными числами', src: [['expr4', 2]] },
    { n: 8, max: 2, t: 'Задача в несколько действий', src: [['task_3_4', 2], ['buy', 3]] },
    { n: 9, max: 2, t: 'Время, календарь, логика', src: [['calendar_time', 2], ['logic_plus', 1]] },
    { n: 10, max: 1, t: 'Движение и пропорции', src: [['motion', 2], ['motion_two', 1], ['proportional', 2]] },
    { n: 11, skip: 'Пространственное мышление (развёртки, кубики) — появится позже' },
    { n: 12, max: 2, t: 'Задача повышенной сложности', src: [['logic_plus', 3]] },
  ];
  const VPR_MAX = VPR.reduce((t, x) => t + (x.max || 0), 0);
  function vprQ(spec) { // вопрос для номера — из генераторов тем Школы (только ответ числом или выбор варианта)
    if (spec.make) return { q: spec.make(), u: spec.u };
    const m4 = (window.SUBJECTS || {}).math4;
    for (let t = 0; t < 60; t++) {
      const [uid, lv] = spec.src[R(0, spec.src.length - 1)], u = m4 && m4.units.find(x => x.id === uid); if (!u || !u.gen) continue;
      let q; try { q = u.gen(lv); } catch (e) { q = null; }
      if (q && (q.type === 'input' || q.type === 'one') && !q.world && (!spec.need || spec.need(q))) return { q, u: uid };
    }
    return { q: { type: 'input', q: 'Найди значение выражения: <b>48 + 6 · 7</b>', c: 90, why: '6 · 7 = 42; 48 + 42 = 90.' }, u: 'order_ops' };
  }
  const ptsW = n => `${n} ${n === 1 ? 'балл' : n >= 2 && n <= 4 ? 'балла' : 'баллов'}`;
  SCREENS.vpr = () => {
    const res = []; let i = -1, cur = null, tries = 0, busy = false;
    app.innerHTML = `${topbar('📝 Пробная ВПР', 'school')}<div class="page vpr-page">${helperHTML('vbub')}<div class="vpr-dots">${VPR.map(x => `<i class="${x.skip ? 'skip' : ''}" title="№${x.n}">${x.n}</i>`).join('')}</div><div id="vbox"></div></div>`;
    const bub = h => { const b = $('#vbub'); if (b) { b.innerHTML = h; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } };
    const dot = (n, cls) => { const d = $$('.vpr-dots i', app)[n - 1]; if (d) d.className = cls; };
    bub(`Это <b>пробная ВПР</b>: ${VPR.filter(x => !x.skip).length} заданий, как на настоящей проверочной. За задание — 1 или 2 балла. В заданиях на 2 балла есть вторая попытка (за неё — 1 балл). Решай в черновике, не торопись 🐾`);
    const next = () => {
      i++; while (i < VPR.length && VPR[i].skip) { res.push({ n: VPR[i].n, skip: true }); i++; }
      if (i >= VPR.length) return finish();
      cur = vprQ(VPR[i]); tries = 0; dot(VPR[i].n, 'now'); show();
    };
    const show = () => {
      const sp = VPR[i], q = cur.q; window.__vpr = q; keyHandler = null;
      $('#vbox').innerHTML = `<div class="card vpr-card"><div class="vpr-h"><b>Задание №${sp.n}</b><span class="small">${sp.t} · до ${ptsW(sp.max)}</span></div><div class="q-text">${q.q}</div>
        ${q.type === 'one' ? `<div class="opts">${shuffle(q.a.map((t, k) => ({ t, k }))).map(o => `<button class="opt wide" data-i="${o.k}">${o.t}</button>`).join('')}</div>` : `<div class="ask-eq"><span class="inp" id="vin">?</span></div>${numpad(true)}`}<div id="vwhy"></div></div>`;
      if (q.type === 'one') $$('#vbox .opt').forEach(b => b.addEventListener('click', () => answer(+b.dataset.i === q.c, b)));
      else { let buf = ''; bindPad($('#vbox'), { digit: x => { if (buf.length < 7) { buf += x; $('#vin').textContent = buf; } }, back: () => { buf = buf.slice(0, -1); $('#vin').textContent = buf || '?'; }, ok: () => { if (buf) answer(String(q.c) === buf); } }); }
    };
    const answer = (ok, btn) => {
      if (busy) return; const sp = VPR[i], q = cur.q; tries++;
      if (!ok && sp.max === 2 && tries === 1) { SND.bad(); if (btn) btn.classList.add('wrong'); bub('Не сходится 🤔 Проверь решение в черновике — есть ещё одна попытка (за неё — 1 балл).'); busy = true; setTimeout(() => { busy = false; show(); }, btn ? 900 : 400); return; }
      busy = true; keyHandler = null;
      const pts = ok ? (tries === 1 ? sp.max : 1) : 0; res.push({ n: sp.n, pts, max: sp.max, u: cur.u, t: sp.t });
      dot(sp.n, pts === sp.max ? 'ok' : pts ? 'half' : 'bad'); if (ok) SND.ok(); else SND.bad();
      $$('#vbox .opt').forEach(b => { b.disabled = true; if (+b.dataset.i === q.c) b.classList.add('right'); }); if (btn && !ok) btn.classList.add('wrong');
      const inp = $('#vin'); if (inp && !ok) { inp.classList.add('bad'); inp.textContent = inp.textContent + ' → ' + q.c; }
      $('#vwhy').innerHTML = `<div class="fb ${ok ? '' : 'bad'}">${ok ? `✔ Верно! +${ptsW(pts)}` : '🔎 Разберём'}</div>${q.why || ''}<div class="row-btns"><button class="btn pink" id="vnext">${i < VPR.length - 1 ? 'Дальше →' : 'Итог →'}</button></div>`;
      $('#vnext').addEventListener('click', () => { busy = false; SND.tap(); next(); });
    };
    const finish = () => {
      window.__vpr = null; keyHandler = null;
      const done = res.filter(r => !r.skip), got = done.reduce((t, r) => t + r.pts, 0), weak = done.filter(r => r.pts < r.max);
      S.vpr = (S.vpr || []).concat([{ d: today(), p: got, m: VPR_MAX, by: done.map(r => [r.n, r.pts]) }]).slice(-20); save();
      try { award(Math.max(1, got), 10 + got * 2); } catch (e) { }
      const m4 = (window.SUBJECTS || {}).math4, title = u => { const x = m4 && m4.units.find(y => y.id === u); return x ? x.icon + ' ' + x.title : u; };
      $('#vbox').innerHTML = `<div class="card vpr-end center"><div class="big-emoji">${got >= VPR_MAX * 0.8 ? '🏆' : got >= VPR_MAX / 2 ? '🐾' : '📚'}</div><h3>Итог: <b class="vpr-score">${got}</b> из ${VPR_MAX} баллов</h3>
        <table class="vpr-tbl"><tr><th>№</th><th>Тема</th><th>Баллы</th></tr>${res.map(r => r.skip ? `<tr class="skip"><td>${r.n}</td><td colspan="2" class="small">${VPR.find(x => x.n === r.n).skip}</td></tr>` : `<tr class="${r.pts < r.max ? 'weak' : ''}"><td>${r.n}</td><td>${r.t}</td><td>${r.pts} / ${r.max}</td></tr>`).join('')}</table>
        ${weak.length ? `<h4>Просели номера: <span class="vpr-weak">${weak.map(r => '№' + r.n).join(', ')}</span></h4><p class="small">Потренируй эти темы — и на следующей пробной ВПР баллов будет больше:</p><div class="row-btns">${[...new Set(weak.map(r => r.u))].map(u => `<button class="btn sm" data-vq="${u}">${title(u)}</button>`).join('')}</div>` : '<h4>Ни один номер не просел — отлично! 🎉</h4>'}
        <div class="row-btns"><button class="btn pink" data-go="vpr">🔄 Ещё одна пробная ВПР</button><button class="btn" data-go="school">К Школе</button></div></div>`;
      $$('[data-vq]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('aquiz', 'math4:' + b.dataset.vq); }));
      bub(weak.length ? `Ты набрал(а) <b>${got}</b> из ${VPR_MAX}. Просели номера ${weak.map(r => r.n).join(', ')} — это подсказка, что повторить. Ошибаться на пробной — нормально!` : `Все номера решены! <b>${got}</b> из ${VPR_MAX} 🎉`);
      if (got >= VPR_MAX * 0.8 && typeof confetti === 'function') confetti(25);
    };
    next();
  };
  if (typeof NO_FLOAT !== 'undefined' && !NO_FLOAT.includes('vpr')) NO_FLOAT.push('vpr');
  { const st = document.createElement('style'); st.id = 'vpr-css'; st.textContent = `
  .vpr-dots { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; margin: 6px 0 10px; }
  .vpr-dots i { font-style: normal; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 800; background: #fff; box-shadow: 0 2px 0 rgba(59,42,74,.1); }
  .vpr-dots i.now { background: var(--gold, #FFC23D); } .vpr-dots i.ok { background: var(--mint, #2FB37A); color: #fff; } .vpr-dots i.half { background: #FFD48A; } .vpr-dots i.bad { background: #FFB3C6; } .vpr-dots i.skip { opacity: .35; }
  .vpr-h { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 10px; align-items: baseline; margin-bottom: 6px; }
  .vpr-tbl { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 15px; text-align: left; } .vpr-tbl td, .vpr-tbl th { padding: 4px 6px; border-bottom: 1px solid #eee; }
  .vpr-tbl tr.weak td { color: var(--red, #D33); font-weight: 700; } .vpr-tbl tr.skip td { opacity: .6; }
  `; document.head.appendChild(st); }

  return { GROUPS, CORE, VPR, vprQ };
})();
window.School4 = School4;
