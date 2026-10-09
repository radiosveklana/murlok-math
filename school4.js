/* school4.js — «Школа сыщика» = один раздел «Математика 4 класс»: все темы программы в одном месте.
   Старые темы (столбик, уравнения, деление, сложение/вычитание) — с теми же уроками, «Решаем вместе», уровнями и прогрессом;
   темы программы — учебник и тренажёр с бесконечными задачами. */
'use strict';
const School4 = (() => {
  const GROUPS = [
    { t: '✍️ Письменные вычисления', items: ['@mul', '@div', '@add'] },
    { t: '📦 Уравнения', items: ['@eq'] },
    { t: '🔢 Числа до миллиона', items: ['million_read', 'million_compare', 'more_less'] },
    { t: '📏 Величины', items: ['length_mass', 'time', 'area_units', 'part_qty'] },
    { t: '🧮 Вычисления', items: ['round_mul', 'remainder', 'order_ops', 'props'] },
    { t: '🚗 Задачи', items: ['motion', 'motion_two', 'work', 'buy', 'part_num'] },
    { t: '📐 Геометрия и данные', items: ['shapes', 'data_logic'] },
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
      <div class="row-btns">${due ? `<button class="btn pink" data-go="aquiz" data-arg="math4:*review">🔁 Разбор ошибок (${due})</button>` : ''}<button class="btn" data-go="newcase">🔍 Решать в деле</button></div>
      ${GROUPS.map((g, gi) => { const n = g.items.length, done = g.items.filter(x => x[0] === '@' ? CORE[x.slice(1)].done() > 0 : (a.read || {})[x]).length;
        return `<details class="sgroup" data-g="${gi}" ${openG(gi) ? 'open' : ''}><summary><h3 class="sg-title">${g.t}</h3><span class="sg-n">${done} из ${n}</span></summary><div class="units">${g.items.map(x => x[0] === '@' ? coreRow(x.slice(1)) : unitRow(x)).join('')}</div></details>`; }).join('')}
    </div>`;
    $$('details.sgroup', app).forEach(d => d.addEventListener('toggle', () => { try { sessionStorage.setItem('school-open', JSON.stringify($$('details.sgroup', app).filter(x => x.open).map(x => +x.dataset.g))); } catch (e) { } }));
    $$('[data-al]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('alesson', 'math4:' + b.dataset.al); }));
    $$('[data-aq]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('aquiz', 'math4:' + b.dataset.aq); }));
  };
  return { GROUPS, CORE };
})();
window.School4 = School4;
