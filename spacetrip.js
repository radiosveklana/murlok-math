/* spacetrip.js — бонусный уровень «Полёт в космос»: из телескопа котёнок летит по планетам.
   На каждой планете — миссия из 5 заданий по своей теме (задачи из «копилки» и вопросы Академии).
   Открывается после достаточного количества решённых задач основной программы. */
'use strict';
const SpaceTrip = (() => {
  const NEED = 120; // решённых задач, чтобы открыть полёт
  const PL = [
    { id: 'moon', name: 'Луна', c: '#CFCFD8', r: 30, theme: 'Величины: длина, масса, время', src: ['math4:length_mass', 'math4:time'], fact: 'На Луне нет воздуха, поэтому следы космонавтов там хранятся десятилетиями.' },
    { id: 'mercury', name: 'Меркурий', c: '#B5A79A', r: 26, theme: 'Быстрый счёт: круглые числа и удобные вычисления', src: ['math4:round_mul', 'math4:props'], fact: 'Меркурий — самая маленькая планета и ближайшая к Солнцу.' },
    { id: 'venus', name: 'Венера', c: '#E8C67A', r: 34, theme: 'Порядок действий и деление с остатком', src: ['math4:order_ops', 'math4:remainder'], fact: 'Венера — самая горячая планета: там жарче, чем в духовке!' },
    { id: 'earth', name: 'Земля', c: '#4C9BE8', r: 35, theme: 'Природа, забота и безопасность', src: ['@world', '@safety', '@health', '@obzh'], fact: 'Земля — единственная известная планета, где есть жизнь.' },
    { id: 'mars', name: 'Марс', c: '#D2603A', r: 30, theme: 'Задачи на движение', src: ['math4:motion', 'math4:motion_two'], fact: 'На Марсе самый высокий вулкан Солнечной системы — Олимп.' },
    { id: 'jupiter', name: 'Юпитер', c: '#D9A66B', r: 56, theme: 'Числа-гиганты: до миллиона', src: ['math4:million_read', 'math4:million_compare', 'math4:more_less'], fact: 'Внутри Юпитера поместилось бы больше тысячи планет размером с Землю.' },
    { id: 'saturn', name: 'Сатурн', c: '#E6CB8A', r: 48, ring: true, theme: 'Доли и части — как кольца Сатурна', src: ['math4:part_qty', 'math4:part_num'], fact: 'Кольца Сатурна состоят из льда и камней.' },
    { id: 'uranus', name: 'Уран', c: '#8FD8E0', r: 40, theme: 'Логика и таблицы', src: ['math4:data_logic', '@think'], fact: 'Уран вращается «лёжа на боку».' },
    { id: 'neptune', name: 'Нептун', c: '#4B6FE0', r: 40, theme: 'Фигуры, работа и покупки', src: ['math4:shapes', 'math4:work', 'math4:buy', '@space'], fact: 'На Нептуне дуют самые сильные ветры в Солнечной системе.' },
  ];
  const st = () => (S.trip = S.trip || { done: {} });
  const open = () => solvedTotal() >= NEED;
  const planet = (p, s = 1) => { const R = p.r * s, W = (R + (p.ring ? R * 0.7 : 0)) * 2 + 6; return `<svg viewBox="${-W / 2} ${-R - 3} ${W} ${R * 2 + 6}" width="${W}" height="${R * 2 + 6}">${p.ring ? `<ellipse rx="${R * 1.65}" ry="${R * 0.42}" fill="none" stroke="#C9A65A" stroke-width="${R * 0.16}"/>` : ''}<circle r="${R}" fill="${p.c}"/><circle cx="${-R * .35}" cy="${-R * .35}" r="${R * .3}" fill="#fff" opacity=".3"/><circle r="${R}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="${R * .12}"/></svg>`; };
  function questionFrom(src, d) { // один вопрос: из «копилки» (генераторы) или из предмета Академии (@id)
    if (src[0] === '@') { const s = window.SUBJECTS[src.slice(1)]; if (!s) return null; const u = pick(s.units), q = pick(u.quiz.filter(x => ['one', 'tf', 'input'].includes(x.type))); return q ? { q, title: s.name, icon: s.icon } : null; }
    const [sid, uid] = src.split(':'), u = ((window.SUBJECTS[sid] || {}).units || []).find(x => x.id === uid); return u && u.gen ? { q: u.gen(d), title: u.title, icon: u.icon, regen: () => u.gen(d) } : null;
  }
  SCREENS.spacetrip = () => {
    if (!open()) { app.innerHTML = `${topbar('🚀 Полёт в космос', 'starmap')}<div class="page center"><div class="big-emoji">🚀🔒</div><h2>Ракета ещё строится!</h2><p>Полёт откроется, когда ты решишь <b>${NEED}</b> задач в Школе и делах. Сейчас: <b>${solvedTotal()}</b>.</p><span class="bar"><i style="width:${Math.min(100, solvedTotal() / NEED * 100)}%"></i></span><div class="row-btns" style="justify-content:center"><button class="btn pink" data-go="newcase">🔍 Решать задачи</button></div></div>`; return; }
    const T = st(), next = PL.findIndex(p => !T.done[p.id]);
    app.innerHTML = `${topbar('🚀 Полёт в космос', 'starmap')}<div class="page trip"><p class="center small">Котёнок-космонавт летит по Солнечной системе! На каждой планете — миссия. Справишься — откроется следующая.</p>
      <div class="trip-map">${PL.map((p, i) => { const d = T.done[p.id], av = i <= (next < 0 ? PL.length : next); return `<button class="tp ${d ? 'done' : ''} ${av ? '' : 'lock'} ${i === next ? 'next' : ''}" data-p="${p.id}">${planet(p, 0.6)}<b>${p.name}</b><small>${d ? '★'.repeat(d) + '☆'.repeat(3 - d) : av ? 'миссия!' : '🔒'}</small>${i === next ? `<span class="rocket">${myCat({ cls: 'mini', smile: true })}<i>🚀</i></span>` : ''}</button>`; }).join('')}</div>
      ${next < 0 ? '<div class="card center"><div class="big-emoji">🏆🌌</div><h3>Все планеты исследованы!</h3><p>Ты настоящий космический сыщик! Миссии можно проходить снова — задания каждый раз новые.</p></div>' : ''}</div>`;
    $$('.tp').forEach(b => b.addEventListener('click', () => { if (b.classList.contains('lock')) { toast('Сначала исследуй предыдущую планету 🚀'); return; } SND.tap(); go('mission', b.dataset.p); }));
  };
  SCREENS.mission = id => {
    const p = PL.find(x => x.id === id); if (!p || !open()) return go('spacetrip');
    const d = Math.min(3, 1 + Math.floor(PL.indexOf(p) / 3)), N = 5; let k = 0, ok = 0, fuel = 40, cur = null;
    app.innerHTML = `${topbar('🪐 ' + p.name, 'spacetrip')}<div class="page mission"><div class="ms-head"><div class="ms-pl">${planet(p, 1)}</div><div><b>${p.theme}</b><p class="small">💡 ${p.fact}</p></div></div>
      <div class="fuel"><span>⛽ Топливо</span><i><b id="fuelb" style="width:${fuel}%"></b></i></div><div class="g-dots">${Array.from({ length: N }, () => '<i></i>').join('')}</div><div id="mq"></div></div>`;
    const setFuel = () => { const b = $('#fuelb'); if (b) b.style.width = Math.max(0, Math.min(100, fuel)) + '%'; };
    const ask = () => {
      for (let t = 0; t < 10 && !cur; t++) cur = questionFrom(pick(p.src), d); if (!cur) { k = N; return fin(); }
      const q = cur.q, T = ACAD_Q[q.type] || ACAD_Q.one; window.__aq = q;
      $('#mq').innerHTML = `<div class="q-unit">${cur.icon} ${cur.title}</div>${T.render(q)}<div id="mwhy"></div>`;
      T.bind($('#mq'), q, (r, why) => {
        $$('.g-dots i')[k].className = r ? 'ok' : 'bad'; if (r) { ok++; fuel += 15; SND.ok(); M.sfx('whoosh'); } else { fuel -= 10; SND.bad(); } setFuel();
        $('#mwhy').innerHTML = `<div class="${r ? 'fb' : 'fb bad'}">${r ? '✔ Топливо пополнено!' : 'Утечка топлива!'}</div>${why || ''}<button class="btn big pink" id="mn">${k + 1 < N ? 'Дальше →' : '🚀 Итоги миссии'}</button>`;
        $('#mn').addEventListener('click', () => { k++; cur = null; k < N ? ask() : fin(); });
      });
    };
    const fin = () => {
      const stars = ok === N ? 3 : ok >= 4 ? 2 : ok >= 3 ? 1 : 0, T = st();
      if (stars) { T.done[p.id] = Math.max(T.done[p.id] || 0, stars); save(); award(ok * 3, ok * 8); if (stars === 3) awardGems(1, `за миссию на планете ${p.name}`); if (PL.every(x => T.done[x.id]) && !T.allDone) { T.allDone = true; save(); awardGems(3, 'за полёт по всей Солнечной системе!'); confetti(60); } }
      acadTask('space', { mistakes: N - ok }); if (window.Coach) Coach.track('a:space', ok / N, { count: false });
      SND.win(); if (stars >= 2) confetti(30);
      $('#mq').innerHTML = `<div class="center g-result"><div class="big-emoji">${stars ? '🚀✨' : '🛸'}</div><h2>${ok} из ${N}</h2><div class="stars big">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><p>${stars ? `Планета ${p.name} исследована!` : 'Топлива не хватило — попробуй ещё раз, задания будут новые!'}</p><div class="row-btns"><button class="btn big pink" id="mag">${stars ? 'Ещё раз' : 'Попробовать снова'}</button><button class="btn" data-go="spacetrip">К планетам</button></div></div>`;
      $('#mag').addEventListener('click', () => go('mission', p.id));
    };
    ask();
  };
  /* вход: из карты звёзд и из телескопа */
  { const sm = SCREENS.starmap; if (sm) SCREENS.starmap = arg => { sm(arg); const pg = $('.page.starmap', app); if (pg) pg.insertAdjacentHTML('afterbegin', `<button class="btn big ${open() ? 'pink' : ''} trip-btn" data-go="spacetrip">🚀 Полететь в космос ${open() ? '' : `<small>(откроется после ${NEED} задач: ${solvedTotal()}/${NEED})</small>`}</button>`); }; }
  ['spacetrip', 'mission'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { PL, NEED, open };
})();
window.SpaceTrip = SpaceTrip;
