/* medals.js (v31) — большая коллекция значков и новый раздел «Мои награды».
   • ~220 значков в 4 уровнях (бронза / серебро / золото / легенда) по всем разделам: школа и каждая тема 4 класса,
     Академия (каждый предмет), дела, «Быстрые лапки», Ошибки Енота, игры, Шульте и скорочтение, работа над ошибками,
     «Проверь мою тетрадь», домик и котик, космос, семья, серии дней, время суток, секретные.
     У каждого значка: иконка, название, как получить, прогресс (37/50), цвет уровня, дата получения (S.badgeAt).
   • Старые значки (BADGES из app.js) входят в коллекцию с теми же id — всё полученное остаётся полученным.
   • При первом запуске v31 значки и дипломы выдаются задним числом по уже накопленному прогрессу — одно праздничное окно на всё.
   • Новые значки празднуются тостом с конфетти не чаще раза за экран (остальные — одним тостом на следующем экране).
   • «Мои награды»: вкладки «Значки · Дипломы · Дела · Коллекция», «Собрано N из M», фильтр «Почти получены», группы по разделам,
     карточка значка по нажатию; лента раскрытых дел — карточки по месяцам, по 20 штук, «Показать ещё».
   • Отчёт для взрослых: строка «Новые значки за неделю».
   Подключается до coach.js; старый код не переписывается — только обёртки. */
'use strict';
const Medals = (() => {
  const TIER = { b: { n: 'Бронза', ic: '🥉', c: '#C9824A' }, s: { n: 'Серебро', ic: '🥈', c: '#8E9BAA' }, g: { n: 'Золото', ic: '🥇', c: '#E3A82B' }, l: { n: 'Легенда', ic: '💜', c: '#8B5CF6' } };
  const AREAS = [
    ['school', '🎓', 'Школа сыщика'], ['m4', '📐', 'Темы 4 класса'], ['acad', '🏛️', 'Академия'], ['cases', '🔍', 'Дела'],
    ['paws', '⚡', 'Быстрые лапки'], ['raccoon', '🦝', 'Ошибки Енота'], ['games', '🎲', 'Игры'], ['read', '📖', 'Шульте и скорочтение'],
    ['fix', '🩹', 'Работа над ошибками'], ['home', '🏠', 'Домик и котик'], ['space', '🚀', 'Космос'], ['family', '👨‍👩‍👧', 'Семья'],
    ['days', '🔥', 'Серии дней'], ['time', '⏰', 'Время суток'], ['secret', '🎁', 'Секреты'],
  ];
  const AREA = Object.fromEntries(AREAS.map(a => [a[0], a]));
  /* ---------- данные прогресса ---------- */
  let memo = {};
  const mm = (k, f) => (k in memo ? memo[k] : (memo[k] = f()));
  const BX = () => { S.bx = S.bx || {}; const b = S.bx; ['paper', 'care', 'run', 'bestRun'].forEach(k => { b[k] = b[k] || 0; }); return b; };
  const at = () => (S.badgeAt = S.badgeAt || {});
  const st = k => ((S.st || {})[k] || { done: 0, perfect: 0 });
  const sk = id => ((S.sk || {})[id] || {});
  const ac = id => ((S.acad || {})[id] || {});
  const subjects = () => Object.values(window.SUBJECTS || {}).filter(s => s.id !== 'teen' && s.id !== 'math4');
  const m4units = () => ((((window.SUBJECTS || {}).math4) || {}).units) || [];
  const dayKeys = () => mm('dk', () => Object.keys(S.days || {}).filter(k => S.days[k] > 0 && /^\d{4}-\d\d-\d\d$/.test(k)).sort());
  const dOf = k => new Date(k + 'T12:00:00');
  function bestWeek() { return mm('bw', () => { const ts = dayKeys().map(k => dOf(k).getTime()).sort((a, b) => a - b); let best = 0; for (let i = 0, j = 0; i < ts.length; i++) { while (ts[i] - ts[j] > 6 * 864e5 + 36e5) j++; best = Math.max(best, i - j + 1); } return best; }); }
  function goodWeeks() { return mm('gw', () => { const W = {}; dayKeys().forEach(k => { const d = dOf(k), mon = new Date(d); mon.setDate(d.getDate() - (d.getDay() + 6) % 7); const w = mon.toDateString(); W[w] = (W[w] || 0) + 1; }); return Object.values(W).filter(n => n >= 4).length; }); }
  function bestStreak() { return mm('bs', () => { let best = 0, run = 0, prev = null; dayKeys().forEach(k => { const t = dOf(k).getTime(); run = prev != null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1; prev = t; best = Math.max(best, run); }); return Math.max(best, (((S.coach || {}).stats) || {}).bestStreak || 0, typeof streak === 'function' ? streak() : 0); }); }
  const hours = (a, b) => { const H = S.hours || []; let n = 0; for (let h = a; h <= b; h++) n += H[h] || 0; return n; };
  const bestWpm = () => mm('wpm', () => Math.max(0, ...(((S.read || {}).wpm) || []).filter(x => x.comp >= 67).map(x => x.wpm)));
  const schT = n => (((S.read || {}).schulte) || {})[n];
  const fixedN = () => mm('fx', () => Object.values(S.mtop || {}).filter(e => e && e.fixed).length + (S.mcured || []).length);
  const culprits = () => mm('cu', () => new Set((S.caseLog || []).map(c => c.who)).size);
  const planets = () => { const A = ((S.trip || {}).ar || {}).done || {}; return ((window.SpaceTrip || {}).PL || []).filter(p => A[p.id]).length; };
  const roomsOpen = () => { try { return window.Lines.ROOMS.filter(r => roomOpen(r)).length; } catch (e) { return 0; } };
  const starsSum = s => s.units.reduce((t, u) => t + Math.min(3, (ac(s.id).best || {})[u.id] || 0), 0);
  const subjFull = () => mm('sf', () => subjects().filter(s => { try { return subjProgress(s.id) >= 100; } catch (e) { return false; } }).length);
  const acadStars = () => mm('as', () => subjects().reduce((t, s) => t + starsSum(s), 0));
  const tg = k => ((window.SUBJECTS || {})[k] || {});
  const extraName = id => { for (const s of Object.values(window.SUBJECTS || {})) { const e = (s.extras || []).find(x => x.id === id); if (e) return [e.icon, e.name, s.id]; } return null; };
  const gameName = id => ((typeof GAMES !== 'undefined' ? GAMES : []).find(g => g.id === id) || {}).name || id;
  /* ---------- каталог ---------- */
  let CAT = null;
  function build() {
    const L = [];
    const add = (a, t, i, n, d, need, c, o = {}) => L.push(Object.assign({ id: o.id, a, t, i, n, d, need, c }, o));
    const A = (id, a, t, i, n, d, need, c, o = {}) => add(a, t, i, n, d, need, c, Object.assign({ id }, o));
    /* школа */
    const TOP = [['mul', '✖️', 'примеров столбиком', ['Мастер столбика', 'Профессор столбика', 'Академик столбика'], [10, 40, 200], 'Столбик без помарок'],
      ['eq', '📦', 'уравнений', ['Открыватель коробок', 'Повелитель иксов', 'Гроссмейстер уравнений'], [10, 40, 200], 'Уравнения без ошибок'],
      ['div', '➗', 'примеров на деление столбиком', ['Делитель-новичок', 'Знаток деления', 'Мастер деления'], [10, 50, 200], 'Деление без ошибок'],
      ['add', '➕', 'примеров на сложение и вычитание столбиком', ['Счетовод', 'Казначей Сладкограда', 'Главный бухгалтер'], [10, 50, 200], 'Сложение без ошибок']];
    TOP.forEach(([k, ic, what, names, ns, pn]) => {
      ns.forEach((n, j) => A(k + n, 'school', 'bsg'[j], ic, names[j], `Решить ${n} ${what}`, n, () => st(k).done, { go: 'school' }));
      A(k + 'p25', 'school', 's', '✨', pn, `Решить 25 ${what} без единой ошибки`, 25, () => st(k).perfect, { go: 'school' });
    });
    A('school', 'school', 'b', '🎓', 'Выпускник', 'Пройти оба урока в Школе сыщика: столбик и уравнения', 2, () => ['mul', 'eq'].filter(k => (S.lessons || {})[k]).length, { go: 'school' });
    [[5, 'b', 'Пять без ошибок'], [10, 's', 'Десять без ошибок'], [25, 'g', 'Безупречный сыщик']].forEach(([n, t, nm]) => A('run' + n, 'school', t, '🎯', nm, `Решить ${n} задач подряд без единой ошибки и подсказки`, n, () => Math.max(BX().bestRun, BX().run)));
    A('sch500', 'school', 'l', '🏫', 'Легенда Школы', 'Решить 500 задач в Школе сыщика', 500, () => ['mul', 'eq', 'div', 'add', 'aq', 'math4'].reduce((t, k) => t + st(k).done, 0), { go: 'school' });
    /* темы 4 класса */
    m4units().forEach(u => {
      A('m4f:' + u.id, 'm4', 'b', u.icon, u.title, `Пройти тренажёр темы «${u.title}» хотя бы раз`, 1, () => (((ac('math4').best || {})[u.id] || 0) > 0 || (sk('a:math4:' + u.id).n || 0) > 0) ? 1 : 0, { go: ['aquiz', 'math4:' + u.id] });
      A('m4s:' + u.id, 'm4', 's', '⭐', '★★★ ' + u.title, `Пройти тренажёр темы «${u.title}» на три звезды`, 3, () => (ac('math4').best || {})[u.id] || 0, { go: ['aquiz', 'math4:' + u.id] });
    });
    if (m4units().length) {
      A('m4all', 'm4', 'g', '📐', 'Вся программа 4 класса', 'Получить хотя бы одну звезду в каждой теме 4 класса', m4units().length, () => m4units().filter(u => ((ac('math4').best || {})[u.id] || 0) > 0).length, { go: ['subject', 'math4'] });
      A('m4all3', 'm4', 'l', '👑', 'Отличник 4 класса', 'Пройти все темы 4 класса на три звезды', m4units().length, () => m4units().filter(u => ((ac('math4').best || {})[u.id] || 0) >= 3).length, { go: ['subject', 'math4'] });
    }
    /* Академия */
    subjects().forEach(s => {
      const n = s.units.length, half = Math.ceil(n * 1.5);
      A('ac1:' + s.id, 'acad', 'b', s.icon, s.name + ': первые уроки', `Прочитать 3 урока предмета «${s.name}»`, Math.min(3, n), () => Object.keys(ac(s.id).read || {}).filter(k => s.units.some(u => u.id === k)).length, { go: ['subject', s.id] });
      A('ac2:' + s.id, 'acad', 's', s.icon, s.name + ': знаток', `Собрать ${half} звёзд в тренажёрах предмета «${s.name}»`, half, () => starsSum(s), { go: ['subject', s.id] });
      A('ac3:' + s.id, 'acad', 'g', s.icon, s.name + ': отличник', `Прочитать все уроки предмета «${s.name}» и пройти каждый тренажёр хотя бы на две звезды`, n, () => s.units.filter(u => (ac(s.id).read || {})[u.id] && ((ac(s.id).best || {})[u.id] || 0) >= 2).length, { go: ['subject', s.id] });
    });
    A('acstar100', 'acad', 'g', '🌟', 'Звёздный ученик', 'Собрать 100 звёзд в тренажёрах Академии', 100, acadStars, { go: 'academy' });
    A('acfull3', 'acad', 'l', '🏛️', 'Академик', 'Пройти три предмета Академии на 100%', 3, subjFull, { go: 'academy' });
    /* дела */
    [['case1', 'b', '🔍', 'Первое дело', 1], ['case5', 'b', '🕵️', 'Опытный сыщик', 5], ['case15', 's', '🏆', 'Гроза воришек', 15], ['case25', 's', '🔦', 'Ночной патруль', 25], ['case50', 'g', '🚔', 'Шеф полиции Сладкограда', 50], ['case100', 'g', '🏅', 'Сотня раскрытых дел', 100], ['case200', 'l', '👑', 'Легенда агентства', 200]]
      .forEach(([id, t, i, n, k]) => A(id, 'cases', t, i, n, k === 1 ? 'Раскрыть первое дело' : `Раскрыть ${k} дел`, k, () => S.cases || 0, { go: 'newcase' }));
    A('clean', 'cases', 'b', '💎', 'Чистая работа', 'Раскрыть дело без единой ошибки', 1, () => S.casesPerfect || 0, { go: 'newcase' });
    A('perf10', 'cases', 's', '💎', 'Десять чистых дел', 'Раскрыть 10 дел без единой ошибки', 10, () => S.casesPerfect || 0, { go: 'newcase' });
    A('perf50', 'cases', 'g', '💠', 'Безупречное агентство', 'Раскрыть 50 дел без единой ошибки', 50, () => S.casesPerfect || 0, { go: 'newcase' });
    A('who10', 'cases', 's', '🦊', 'Знаток подозреваемых', 'Поймать 10 разных воришек', 10, culprits, { go: 'newcase' });
    A('who25', 'cases', 'g', '🦝', 'Картотека воришек', 'Поймать 25 разных воришек', 25, culprits, { go: 'newcase' });
    A('who50', 'cases', 'l', '🗂️', 'Все воришки пойманы', 'Поймать 50 разных воришек', 50, culprits, { go: 'newcase' });
    A('casefast', 'cases', 's', '⏱️', 'Молниеносное расследование', 'Раскрыть дело быстрее чем за 3 минуты', 1, () => (S.caseLog || []).some(c => c.sec && c.sec <= 180) ? 1 : 0, { go: 'newcase' });
    /* быстрые лапки */
    [['blitz10', 'b', '🐾', 'Шустрые лапки', 10], ['blitz20', 's', '⚡', 'Быстрые лапки', 20], ['blitz30', 'g', '🚀', 'Молния', 30], ['blitz40', 'l', '☄️', 'Сверхзвуковой котик', 40]]
      .forEach(([id, t, i, n, k]) => A(id, 'paws', t, i, n, `${k} верных ответов за минуту в таблице умножения`, k, () => st('blitz').best || 0, { go: 'blitz' }));
    [['div', '➗', 'Деление по таблице'], ['round', '🔟', '×10, ×100, ×1000'], ['addsub', '➕', 'Счёт в уме'], ['mul2', '💪', 'Двузначное × однозначное'], ['mixall', '🌀', 'Всё вперемешку']].forEach(([k, ic, nm]) => {
      const name = nm;
      A('dr10:' + k, 'paws', 'b', ic, name + ': 10', `Набрать 10 очков за минуту в режиме «${name}»`, 10, () => (S.drillBest || {})[k] || 0, { go: ['drill', k] });
      A('dr20:' + k, 'paws', 's', ic, name + ': 20', `Набрать 20 очков за минуту в режиме «${name}»`, 20, () => (S.drillBest || {})[k] || 0, { go: ['drill', k] });
    });
    [['bz10', 'b', 10], ['bz50', 's', 50], ['bz150', 'g', 150]].forEach(([id, t, k]) => A(id, 'paws', t, '⏲️', `${k} забегов`, `Сыграть в «Быстрые лапки» ${k} раз`, k, () => st('blitz').games || 0, { go: 'blitz' }));
    /* Ошибки Енота */
    A('bug10', 'raccoon', 'b', '🦝', 'Зоркий глаз', 'Найти 10 ошибок Енота', 10, () => st('bug').done, { go: 'bugs' });
    A('bug50', 'raccoon', 's', '🔎', 'Гроза Енота', 'Найти 50 ошибок Енота', 50, () => st('bug').done, { go: 'bugs' });
    A('bug150', 'raccoon', 'g', '🏳️', 'Енот сдаётся!', 'Найти 150 ошибок Енота', 150, () => st('bug').done, { go: 'bugs' });
    A('bugp25', 'raccoon', 's', '🎯', 'Ни одной промашки', 'Найти 25 ошибок Енота с первой попытки', 25, () => st('bug').perfect, { go: 'bugs' });
    /* игры */
    (typeof GAMES !== 'undefined' ? GAMES : []).forEach(g => {
      A('gm1:' + g.id, 'games', 'b', g.icon, g.name, `Сыграть в «${g.name}»`, 1, () => (((S.gameBest || {})[g.id] || 0) > 0 || (sk('g:' + g.id).n || 0) > 0) ? 1 : 0, { go: ['game', g.id] });
      A('gm8:' + g.id, 'games', 's', '🏆', g.name + ': рекорд', `Набрать 8 очков в игре «${g.name}»`, 8, () => (S.gameBest || {})[g.id] || 0, { go: ['game', g.id] });
    });
    ['solar', 'citywalk', 'fakenews', 'helpharm', 'bodybuild', 'rescue'].forEach(id => { const e = extraName(id); if (!e) return; A('ag:' + id, 'games', 'g', e[0], e[1] + ' без ошибок', `Пройти игру «${e[1]}» без единой ошибки`, 100, () => Math.round(((S.agames || {})[id] || 0) * 100), { go: ['subject', e[2]], pct: true }); });
    A('ideas10', 'games', 'b', '💡', 'Фонтан идей', 'Придумать 10 идей в игре «Фабрика идей»', 10, () => (S.ideas || []).length, { go: ['subject', 'creative'] });
    /* Шульте и скорочтение */
    const sch = (id, t, n, sec, nm) => A(id, 'read', t, '🔢', nm, `Пройти таблицу Шульте ${n}×${n} быстрее ${sec} секунд`, 1, () => (schT(n) && schT(n) <= sec ? 1 : 0), { go: ['schulte', n], note: () => schT(n) ? `Твой рекорд: ${schT(n)} с` : 'Рекорда пока нет' });
    sch('sch3', 'b', 3, 15, 'Шульте 3×3'); sch('sch4', 's', 4, 30, 'Шульте 4×4'); sch('sch5', 'g', 5, 45, 'Шульте 5×5'); sch('sch5l', 'l', 5, 30, 'Орлиный глаз');
    [['wpm60', 'b', 60, 'Уверенный читатель'], ['wpm100', 's', 100, 'Быстрый читатель'], ['wpm150', 'g', 150, 'Скоростной читатель'], ['wpm200', 'l', 200, 'Чтец-молния']].forEach(([id, t, n, nm]) => A(id, 'read', t, '📖', nm, `Читать ${n} слов в минуту и ответить на вопросы к тексту`, n, bestWpm, { go: ['subject', 'read'] }));
    A('flash4', 'read', 'b', '✨', 'Вспышка', 'Дойти до 4-го уровня «Вспышек слов»', 4, () => (S.read || {}).flash || 0, { go: 'flash' });
    A('flash8', 'read', 'g', '🌟', 'Мастер вспышек', 'Дойти до 8-го уровня «Вспышек слов»', 8, () => (S.read || {}).flash || 0, { go: 'flash' });
    A('texts10', 'read', 's', '📚', 'Книжный червь', 'Прочитать 10 текстов на скорость', 10, () => (((S.read || {}).wpm) || []).length, { go: ['subject', 'read'] });
    /* работа над ошибками + тетрадь */
    [['fix1', 'b', 1, 'Первая исправленная ошибка'], ['fix10', 's', 10, 'Исправитель'], ['fix50', 'g', 50, 'Ошибки боятся меня']].forEach(([id, t, n, nm]) => A(id, 'fix', t, '🩹', nm, n === 1 ? 'Исправить первую ошибку в «Работе над ошибками»' : `Исправить ${n} ошибок в «Работе над ошибками»`, n, fixedN, { go: 'mistakes' }));
    [['paper1', 'b', 1, 'Проверь мою тетрадь'], ['paper10', 's', 10, 'Аккуратная тетрадь'], ['paper30', 'g', 30, 'Тетрадь отличника']].forEach(([id, t, n, nm]) => A(id, 'fix', t, '✏️', nm, n === 1 ? 'Решить пример в тетради и проверить ответ у котика' : `Проверить у котика ${n} примеров из тетради`, n, () => BX().paper, { go: 'paper' }));
    /* домик и котик */
    const RN = (() => { try { return window.Lines.ROOMS.length; } catch (e) { return 17; } })();
    [['rooms3', 'b', 3], ['rooms8', 's', 8], ['roomsAll', 'g', RN]].forEach(([id, t, n]) => A(id, 'home', t, '🚪', n === RN ? 'Весь домик открыт' : `${n} ${plural(n, 'комната', 'комнаты', 'комнат')}`, n === RN ? 'Открыть все комнаты домика' : `Открыть ${n} ${plural(n, 'комнату', 'комнаты', 'комнат')} в домике`, n, roomsOpen, { go: 'house' }));
    [['furn5', 'b', 5, 'Уютный уголок'], ['furn20', 's', 20, 'Дизайнер'], ['furn50', 'g', 50, 'Дворец котика']].forEach(([id, t, n, nm]) => A(id, 'home', t, '🛋️', nm, `Купить ${n} вещей для домика`, n, () => (S.furn || []).length, { go: 'house' }));
    [['owned10', 'b', 10, 'Модник'], ['owned25', 's', 25, 'Гардероб'], ['owned50', 'g', 50, 'Икона стиля']].forEach(([id, t, n, nm]) => A(id, 'home', t, '👗', nm, `Собрать ${n} нарядов и аксессуаров для котика`, n, () => (S.owned || []).length, { go: 'shop' }));
    [['care10', 'b', 10, 'Заботливый друг'], ['care50', 's', 50, 'Лучший хозяин'], ['care200', 'g', 200, 'Котик счастлив!']].forEach(([id, t, n, nm]) => A(id, 'home', t, '🍼', nm, `Позаботиться о котике ${n} раз: покормить, напоить, поиграть, уложить, искупать`, n, () => BX().care, { go: 'house' }));
    A('happy', 'home', 's', '😻', 'Счастливый котик', 'Сделать так, чтобы все шкалы котика были выше 85', 1, () => BX().happy ? 1 : 0, { go: 'house' });
    A('looks3', 'home', 'b', '📸', 'Мой стиль', 'Сохранить 3 образа в примерочной', 3, () => (S.looks || []).length, { go: 'fitting' });
    A('photo5', 'home', 'b', '🖼️', 'Фотограф', 'Сделать 5 фото котика', 5, () => S.photos || 0, { go: 'photo' });
    A('furs3', 'home', 's', '🎨', 'Новая шёрстка', 'Открыть 3 окраса шёрстки в салоне', 3, () => (S.furs || []).length, { go: 'salon' });
    /* космос */
    const PN = ((window.SpaceTrip || {}).PL || []).length || 8;
    [['pl1', 'b', 1, 'Первый полёт'], ['pl4', 's', 4, 'Путешественник'], ['pl8', 'g', PN, 'Космонавт']].forEach(([id, t, n, nm]) => A(id, 'space', t, '🪐', nm, n === 1 ? 'Долететь до первой планеты в Космической аркаде' : n === PN ? 'Облететь все планеты Солнечной системы в Космической аркаде' : `Долететь до ${n} планет в Космической аркаде`, n, planets, { go: 'spacetrip' }));
    [['con10', 'b', 10, 'Звездочёт'], ['con30', 's', 30, 'Хранитель неба'], ['con88', 'l', 88, 'Астроном']].forEach(([id, t, n, nm]) => A(id, 'space', t, '✨', nm, `Найти ${n} созвездий на звёздной карте`, n, () => (S.starsSeen || []).length, { go: 'starmap' }));
    /* семья */
    [['ch1', 'b', 1, 'Первый челлендж'], ['ch5', 's', 5, 'Семейная команда'], ['ch15', 'g', 15, 'Чемпион семьи']].forEach(([id, t, n, nm]) => A(id, 'family', t, '🎯', nm, n === 1 ? 'Выполнить первый семейный челлендж' : `Выполнить ${n} семейных челленджей`, n, () => (S.chalBadges || []).length, { go: 'board' }));
    /* серии дней */
    // v34: без «подряд» — пропуск дня ничего не сжигает; награждаем регулярность (дни за неделю, хорошие недели)
    [['streak3', 'b', 3, 'Три дня за неделю'], ['streak7', 's', 5, 'Пять дней за неделю']].forEach(([id, t, n, nm]) => A(id, 'days', t, '📅', nm, `Позаниматься ${n} разных дней за одну неделю (7 дней)`, n, bestWeek));
    [['wk4', 's', 4, 'Месяц регулярности'], ['wk12', 'g', 12, 'Три месяца регулярности'], ['wk26', 'l', 26, 'Полгода регулярности']].forEach(([id, t, n, nm]) => A(id, 'days', t, '🗓️', nm, `${n} хороших недель — когда занятия были хотя бы 4 дня из 7`, n, goodWeeks));
    [['days10', 'b', 10], ['days50', 's', 50], ['days100', 'g', 100]].forEach(([id, t, n]) => A(id, 'days', t, '📅', `${n} дней занятий`, `Позаниматься в ${n} разных днях`, n, () => dayKeys().length));
    /* время суток */
    A('lunch10', 'time', 'b', '🥪', 'Обеденный перерыв', 'Решить 10 заданий днём — с 12 до 14 часов', 10, () => hours(12, 13));
    A('weekend5', 'time', 's', '🎈', 'Сыщик выходного дня', 'Позаниматься в 5 выходных дней (субботы и воскресенья)', 5, () => dayKeys().filter(k => [0, 6].includes(dOf(k).getDay())).length);
    A('allweek', 'time', 'g', '🌈', 'Вся неделя', 'Позаниматься в каждый день недели — от понедельника до воскресенья', 7, () => new Set(dayKeys().map(k => dOf(k).getDay())).size);
    /* секреты и забавные */
    A('gem100', 'secret', 'g', '💎', 'Кладоискатель', 'Заработать 100 кристаллов', 100, () => S.gemsTotal || 0, { secret: true });
    A('rankTop', 'secret', 'l', '👑', 'Легенда сыска', 'Получить самое высокое звание агентства', 15, () => (typeof rank === 'function' ? rank().i : 0), { secret: true });
    A('legend3', 'secret', 'l', '🌠', 'Три звезды легенды', 'Достичь уровня «Легенда сыска ★3»', 3, () => (window.Wardrobe ? Wardrobe.legend().lv || 0 : 0), { secret: true });
    A('talkall', 'secret', 'g', '🎭', 'Душа компании', 'Пройти все сценки тренажёра разговора хотя бы на две звезды', 1, () => { const R = tg('talk').roleplay || []; return R.length && R.every(r => ((S.rp || {})[r.id] || 0) >= 2) ? 1 : 0; }, { secret: true });
    return L;
  }
  const cat = () => (CAT = CAT || build());
  const cur = b => { try { return Math.max(0, +b.c() || 0); } catch (e) { return 0; } };
  const has = b => (S.badges || []).includes(b.id);
  const ratio = b => Math.min(1, cur(b) / (b.need || 1));
  /* ---------- выдача ---------- */
  function grant(silent) {
    if (!S.kid) return []; memo = {}; S.badges = S.badges || []; const have = new Set(S.badges), fresh = [];
    cat().forEach(b => { if (!have.has(b.id) && cur(b) >= b.need) { S.badges.push(b.id); at()[b.id] = today(); fresh.push(b); } });
    if (fresh.length) { save(); if (!silent) celebrate(fresh); }
    return fresh;
  }
  /* праздник: не чаще раза за экран, остальное копится до следующего экрана */
  let visit = 0, shownAt = -1, pending = [], tmr = null;
  const TORD = { b: 0, s: 1, g: 2, l: 3 }, ADULT_SCR = ['parents', 'pcab', 'pauth', 'agate', 'pinset', 'hello'];
  function celebrate(list) {
    pending.push(...list); if (!pending.length || shownAt === visit || ADULT_SCR.includes(curScreen)) return; // в разделе для взрослых не празднуем — дождёмся игры
    shownAt = visit; const all = pending; pending = []; const top = all.slice().sort((x, y) => TORD[y.t] - TORD[x.t])[0];
    setTimeout(() => { if (ADULT_SCR.includes(curScreen)) { pending.push(...all); shownAt = -1; return; } toast(`<span class="tb">${top.i}</span><div><b>${all.length > 1 ? 'Новые значки!' : 'Новый значок!'}</b><br>${esc(top.n)}${all.length > 1 ? ` <small>и ещё ${all.length - 1}</small>` : ''}</div>`); confetti(24); try { SND.win(); } catch (e) { } try { later(() => speakT(PH.badgeNew[0]), 900); } catch (e) { } }, 700);
  }
  const schedule = () => { clearTimeout(tmr); tmr = setTimeout(() => { try { grant(false); } catch (e) { console.warn(e); } }, 400); };
  /* первый запуск v31: значки и дипломы задним числом, одно праздничное окно */
  const autoOff = () => { try { return !!navigator.webdriver && !localStorage.getItem('murlok-awards-e2e'); } catch (e) { return false; } };
  function retro() {
    if (!S.kid || BX().v >= 31) return; const fresh = grant(true); let dn = 0; try { dn = window.Diplomas ? Diplomas.check(true) || 0 : 0; } catch (e) { }
    BX().v = 31; BX().retro = fresh.map(b => b.id); if (fresh.length || dn) BX().sum = { b: fresh.map(b => b.id), d: dn }; save();
  }
  function retroModal() {
    const sm = BX().sum; if (!sm || autoOff() || $('.modal') || curScreen !== 'home') return;
    const L = sm.b.map(id => cat().find(b => b.id === id)).filter(Boolean); delete BX().sum; save();
    const m = modal(`<div class="big-emoji">🏆</div><h2>${esc(S.kid)}, у нас новые награды!</h2><p>Котик пересчитал все твои подвиги — и вот что нашлось:</p>
      ${L.length ? `<div class="aw-retro">${L.slice(0, 36).map(b => `<span style="--tc:${TIER[b.t].c}" title="${esc(b.n)}">${b.i}</span>`).join('')}${L.length > 36 ? `<em>+${L.length - 36}</em>` : ''}</div>` : ''}
      <p><b>${L.length ? `+${L.length} ${plural(L.length, 'значок', 'значка', 'значков')}` : ''}${L.length && sm.d ? ' и ' : ''}${sm.d ? `+${sm.d} ${plural(sm.d, 'диплом', 'диплома', 'дипломов')}` : ''}</b></p>
      <p class="small">Всего значков: ${S.badges.length} из ${cat().length}. Остальные ждут тебя — загляни в «Почти получены»!</p>
      <div class="row-btns"><button class="btn pink" id="awGo">🎖️ Смотреть награды</button><button class="btn" data-close>Потом</button></div>`);
    confetti(60); try { SND.win(); } catch (e) { }
    $('#awGo', m.el).addEventListener('click', () => { m.close(); go('diplomas', 'badges'); });
  }
  /* ---------- обёртки: награды, задачи, экраны, дела, уход за котиком ---------- */
  checkBadges = () => schedule(); // старая проверка (15 значков) → новая коллекция
  { const aw = award; award = function () { const r = aw.apply(this, arguments); schedule(); return r; }; }
  { const td = taskDone; taskDone = function (kind, res) { try { const b = BX(); if (curScreen === 'paper') b.paper++; if (res && !res.mistakes && !res.helped) { b.run++; b.bestRun = Math.max(b.bestRun, b.run); } else b.run = 0; } catch (e) { } const r = td.apply(this, arguments); schedule(); return r; }; }
  { const g0 = go; go = function () { visit++; const r = g0.apply(this, arguments); setTimeout(() => { if (pending.length) celebrate([]); }, 900); return r; }; }
  { const sc = startCase; startCase = function () { const r = sc.apply(this, arguments); try { if (CASE) CASE.t0 = Date.now(); } catch (e) { } return r; }; }
  { const cc = closeCase; closeCase = function () {
    let info = null, keep = null; try { if (CASE) info = { ci: CASE.ci, m: CASE.mistakes, d: CASE.diff, tp: CASE.topic, sec: CASE.t0 ? Math.round((Date.now() - CASE.t0) / 1000) : 0 }; keep = (S.caseLog || []).slice(); } catch (e) { }
    const r = cc.apply(this, arguments);
    try { if (info && S.caseLog && S.caseLog[0]) { Object.assign(S.caseLog[0], info); if (keep) S.caseLog = [S.caseLog[0]].concat(keep).slice(0, 300); save(); } } catch (e) { }
    schedule(); return r; }; }
  { const sv = save; let snap = null; save = function () { try { if (curScreen === 'house' && S.care) { const c = S.care, sum = ['food', 'water', 'fun', 'energy', 'clean'].reduce((t, k) => t + (+c[k] || 0), 0); if (snap != null && sum - snap >= 8) BX().care++; snap = sum; if (['food', 'water', 'fun', 'energy', 'clean'].every(k => (+c[k] || 0) >= 85)) BX().happy = 1; } else snap = null; } catch (e) { } return sv.apply(this, arguments); }; }
  try { retro(); } catch (e) { console.warn(e); }

  /* ---------- общие кусочки разметки ---------- */
  const bar = (a, b) => `<span class="aw-bar"><i style="width:${Math.round(Math.min(1, a / (b || 1)) * 100)}%"></i></span>`;
  const fmt = d => (window.Diplomas ? Diplomas.fmtDate(d) : d || '');
  const progTxt = b => b.note && !has(b) ? b.note() : b.pct ? `${Math.min(cur(b), b.need)}%` : `${Math.min(cur(b), b.need)} / ${b.need}`;
  function card(b) {
    const got = has(b), hide = b.secret && !got, T = TIER[b.t];
    return `<button class="bdg ${got ? 'on' : ''} t-${b.t}" data-b="${esc(b.id)}" style="--tc:${T.c}"><span class="bi">${hide ? '❓' : b.i}</span><b>${hide ? 'Секретный значок' : esc(b.n)}</b>${got ? `<small>✓ ${fmt(at()[b.id]) || 'получен'}</small>` : hide ? '<small>Это сюрприз!</small>' : `<small>${progTxt(b)}</small>${bar(cur(b), b.need)}`}</button>`;
  }
  function detail(id) {
    const b = cat().find(x => x.id === id); if (!b) return; const got = has(b), hide = b.secret && !got, T = TIER[b.t], A = AREA[b.a];
    const tgt = b.go ? (Array.isArray(b.go) ? b.go : [b.go]) : null, canGo = !got && !hide && tgt && SCREENS[tgt[0]];
    const m = modal(`<div class="aw-det" style="--tc:${T.c}"><div class="aw-medal">${hide ? '❓' : b.i}</div><div class="aw-tier">${T.ic} ${T.n} · ${A[1]} ${A[2]}</div><h2>${hide ? 'Секретный значок' : esc(b.n)}</h2>
      ${hide ? '<p>Это сюрприз! Продолжай играть — и однажды он появится сам 🎁</p>' : `<p><b>Как получить:</b> ${esc(b.d)}.</p>`}
      ${got ? `<p class="perfect">🎉 Получен ${fmt(at()[b.id]) || ''}</p>` : hide ? '' : `${bar(cur(b), b.need)}<p class="aw-pn">${progTxt(b)}${b.note ? '' : ` · осталось ${Math.max(0, b.need - cur(b))}`}</p>`}
      <div class="row-btns">${canGo ? '<button class="btn pink" id="awTo">Вперёд, за значком! →</button>' : ''}<button class="btn" data-close>Понятно</button></div></div>`, 'aw-sheet');
    try { SND.tap(); } catch (e) { }
    if (canGo) $('#awTo', m.el).addEventListener('click', () => { m.close(); go(tgt[0], tgt[1]); });
  }
  /* ---------- вкладка «Значки» ---------- */
  let tab = 'badges', flt = 'near', openG = new Set(), casesN = 20;
  function badgesPane() {
    memo = {}; const C = cat(), got = C.filter(has), cnt = t => got.filter(b => b.t === t).length;
    let body = '';
    if (flt === 'near') { const L = C.filter(b => !has(b) && !b.secret).map(b => ({ b, q: ratio(b) })).sort((x, y) => y.q - x.q || TORD[x.b.t] - TORD[y.b.t]).slice(0, 30).map(x => x.b);
      body = L.length ? `<p class="small aw-hint">Сначала — те, до которых осталось совсем чуть-чуть. Нажми на значок, чтобы узнать, как его получить!</p><div class="badge-grid">${L.map(card).join('')}</div>` : '<div class="card center"><div class="big-emoji">👑</div><p>Ты собрал(а) всё, что можно! Остались только секреты…</p></div>'; }
    else if (flt === 'got') { const L = got.slice().sort((x, y) => String(at()[y.id] || '').localeCompare(String(at()[x.id] || ''))); body = L.length ? `<div class="badge-grid">${L.map(card).join('')}</div>` : '<div class="card center"><div class="big-emoji">🎖️</div><p>Первый значок совсем близко — загляни в «Почти получены»!</p></div>'; }
    else body = AREAS.map(([k, ic, nm]) => { const L = C.filter(b => b.a === k); if (!L.length) return ''; const g = L.filter(has).length;
      return `<details class="aw-grp" data-g="${k}" ${openG.has(k) ? 'open' : ''}><summary><span>${ic} ${nm}</span><small>${g} / ${L.length}</small>${bar(g, L.length)}</summary><div class="badge-grid">${L.map(card).join('')}</div></details>`; }).join('');
    return `<div class="aw-sum"><b>🎖️ Собрано ${got.length} из ${C.length}</b>${bar(got.length, C.length)}<div class="aw-tiers">${['b', 's', 'g', 'l'].map(t => `<span style="--tc:${TIER[t].c}">${TIER[t].ic} ${cnt(t)}</span>`).join('')}</div></div>
      <div class="seg aw-flt"><button data-f="near" class="${flt === 'near' ? 'on' : ''}">🔥 Почти получены</button><button data-f="area" class="${flt === 'area' ? 'on' : ''}">📚 По разделам</button><button data-f="got" class="${flt === 'got' ? 'on' : ''}">✅ Мои</button></div>
      <div class="aw-blist">${body}</div>`;
  }
  /* ---------- вкладка «Дела»: лента раскрытых дел ---------- */
  const MON = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const sceneOf = c => { let ci = c.ci; if (ci == null) { ci = (E.CRIMES || []).findIndex(x => x.title === c.title); if (ci < 0) ci = [...String(c.title || '')].reduce((t, ch) => t + ch.charCodeAt(0), 0); } return ((ci % 24) + 24) % 24; };
  function avatar(who) {
    const s = String(who || ''), sp = s.indexOf(' '), emo = sp > 0 ? s.slice(0, sp) : '🐾', name = sp > 0 ? s.slice(sp + 1) : s;
    let pic = `<span class="cs-emo">${emo}</span>`; try { if (window.Chibi && Chibi.has(name)) pic = Chibi.chibiSVG(name, {}); } catch (e) { }
    return `<span class="cs-av">${pic}</span><span class="cs-wn">Вор: <b>${esc(name)}</b></span>`;
  }
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function caseCard(c) {
    const st3 = c.perfect ? 3 : c.m == null ? 0 : c.m <= 2 ? 2 : 1, d = fmt(c.date);
    return `<article class="cs-card"><img class="cs-img" src="img/scene/${sceneOf(c)}.jpg" alt="" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">
      <div class="cs-body"><div class="cs-top"><span class="cs-n">№${esc(c.n)}</span><b class="cs-t">«${esc(c.title)}»</b></div>
      <div class="cs-who">${avatar(c.who)}</div>
      <div class="cs-meta"><span>📅 ${d ? d.slice(0, 5) : ''}</span>${st3 ? `<span class="cs-st" title="оценка">${'★'.repeat(st3)}${'☆'.repeat(3 - st3)}</span>` : ''}${c.sec ? `<span>⏱ ${mmss(c.sec)}</span>` : ''}${c.perfect ? '<span class="cs-pf">💎 без ошибок</span>' : ''}</div></div></article>`;
  }
  function feedHTML(n) {
    const log = S.caseLog || [];
    if (!log.length) return `<div class="card center cs-empty"><div class="big-emoji">🗂️</div><h3>Пока нет раскрытых дел</h3><p>Возьми первое дело — котик-напарник уже держит лупу наготове!</p><button class="btn pink" data-go="newcase">🔍 Взять первое дело</button></div>`;
    const L = log.slice(0, n); let html = '', curM = '';
    L.forEach(c => { const m = /^(\d{4})-(\d\d)/.exec(c.date || ''), key = m ? m[1] + '-' + m[2] : ''; if (key !== curM) { if (curM !== '' || html) html += '</div>'; curM = key; html += `<h4 class="cs-month">${m ? MON[+m[2] - 1] + ' ' + m[1] : 'Раньше'}</h4><div class="cs-list">`; } html += caseCard(c); });
    html += '</div>';
    return `<div class="aw-sum cs-sum"><b>📁 Раскрытые дела: ${S.cases || 0}</b><small>💎 без ошибок: ${S.casesPerfect || 0}${(S.cases || 0) > log.length ? ` · в журнале — последние ${log.length}` : ''}</small></div>${html}${log.length > n ? `<button class="btn cs-more" id="csMore">Показать ещё (${Math.min(20, log.length - n)})</button>` : ''}`;
  }
  function bindFeed(root, rerender) { const b = $('#csMore', root); if (b) b.addEventListener('click', () => { try { SND.tap(); } catch (e) { } casesN += 20; rerender(); }); }
  /* ---------- вкладка «Коллекция» ---------- */
  function collectionHead() {
    const items = (typeof ITEMS !== 'undefined' ? ITEMS : []).length, own = (S.owned || []).length, P = ((window.SpaceTrip || {}).PL || []).length || 8;
    const tiles = [['👗', 'Наряды', own, items], ['🛋️', 'Вещи в домике', (S.furn || []).length, 0], ['🚪', 'Комнаты', roomsOpen(), (() => { try { return Lines.ROOMS.length; } catch (e) { return 0; } })()], ['🪐', 'Планеты', planets(), P], ['✨', 'Созвездия', (S.starsSeen || []).length, 88], ['🎨', 'Окрасы', (S.furs || []).length, 0], ['📸', 'Образы', (S.looks || []).length, 0], ['🎯', 'Челленджи', (S.chalBadges || []).length, 0]];
    return `<div class="aw-coll">${tiles.map(([i, n, a, b]) => `<div class="aw-ct"><span>${i}</span><b>${a}${b ? ` / ${b}` : ''}</b><small>${n}</small>${b ? bar(a, b) : ''}</div>`).join('')}</div>`;
  }
  /* ---------- экран «Мои награды» ---------- */
  function wrapScreen() {
    const inner = SCREENS.diplomas; if (!inner || inner.aw) return;
    SCREENS.diplomas = arg => {
      if (['badges', 'diplomas', 'cases', 'collection'].includes(arg)) tab = arg; casesN = 20;
      try { retro(); } catch (e) { }
      inner(arg); const pg = $('.page.diplomas', app); if (!pg) return;
      grant(true); memo = {};
      const extras = [...pg.children].filter(x => !x.classList.contains('aw-dpl')), dpl = $('.aw-dpl', pg);
      const C = cat(), nb = C.filter(has).length, nd = (S.diplomas || []).length;
      $('.top h1', app).textContent = '🏆 Мои награды';
      pg.innerHTML = `<div class="aw-head"><div class="aw-cat">${myCat({ cls: 'mini', smile: true, star: true })}</div><div class="aw-chips"><span>🎖️ <b>${nb}</b> / ${C.length} значков</span><span>📜 <b>${nd}</b> ${plural(nd, 'диплом', 'диплома', 'дипломов')}</span><span>📁 Раскрытые дела: <b>${S.cases || 0}</b></span></div></div>
        <div class="seg aw-tabs" role="tablist">${[['badges', '🎖️', 'Значки'], ['diplomas', '📜', 'Дипломы'], ['cases', '📁', 'Дела'], ['collection', '🧸', 'Коллекция']].map(([k, i, n]) => `<button role="tab" data-aw="${k}" class="${tab === k ? 'on' : ''}"><span>${i}</span>${n}</button>`).join('')}</div>
        <section class="aw-pane" data-p="badges"></section><section class="aw-pane" data-p="diplomas"></section><section class="aw-pane" data-p="cases"></section>
        <section class="aw-pane" data-p="collection">${collectionHead()}<div class="aw-extra"></div></section>
        <div class="row-btns aw-foot"><button class="btn" data-go="book">📒 Правила сыщика</button></div>`;
      const P = k => $(`.aw-pane[data-p="${k}"]`, pg);
      if (dpl) P('diplomas').appendChild(dpl); const ex = $('.aw-extra', pg); extras.forEach(x => ex.appendChild(x));
      const drawB = () => { P('badges').innerHTML = badgesPane();
        $$('.aw-flt button', P('badges')).forEach(b => b.addEventListener('click', () => { flt = b.dataset.f; try { SND.tap(); } catch (e) { } drawB(); }));
        $$('.aw-grp', P('badges')).forEach(d => d.addEventListener('toggle', () => { if (d.open) openG.add(d.dataset.g); else openG.delete(d.dataset.g); }));
        $$('.bdg', P('badges')).forEach(c => c.addEventListener('click', () => detail(c.dataset.b))); };
      const drawC = () => { P('cases').innerHTML = feedHTML(casesN); bindFeed(P('cases'), drawC); };
      drawB(); drawC();
      const show = () => { $$('.aw-pane', pg).forEach(p => { p.hidden = p.dataset.p !== tab; }); $$('.aw-tabs button', pg).forEach(b => b.classList.toggle('on', b.dataset.aw === tab)); };
      $$('.aw-tabs button', pg).forEach(b => b.addEventListener('click', () => { tab = b.dataset.aw; try { SND.tap(); } catch (e) { } show(); }));
      show();
    };
    SCREENS.diplomas.aw = 1;
  }
  /* ---------- «Блокнот»: вкладки «Награды» и «Дела» — новая коллекция и лента ---------- */
  { const bk = SCREENS.book; if (bk) SCREENS.book = arg => { bk(arg); const T = $$('.tabs button', app), el = $('#bk', app); if (!el) return;
    const fix = t => { if (t === 'awards') { memo = {}; const C = cat(), L = C.filter(b => !has(b) && !b.secret).sort((x, y) => ratio(y) - ratio(x)).slice(0, 6); el.innerHTML = `<div class="aw-sum"><b>🎖️ Собрано ${C.filter(has).length} из ${C.length} значков</b>${bar(C.filter(has).length, C.length)}</div><h3>🔥 Почти получены</h3><div class="badge-grid">${L.map(card).join('')}</div><div class="row-btns"><button class="btn pink" data-go="diplomas" data-arg="badges">🏆 Все награды →</button></div>`; $$('.bdg', el).forEach(c => c.addEventListener('click', () => detail(c.dataset.b))); }
      if (t === 'cases') { casesN = 20; const draw = () => { el.innerHTML = feedHTML(casesN); bindFeed(el, draw); }; draw(); } };
    T.forEach(b => b.addEventListener('click', () => fix(b.dataset.t))); }; }
  /* ---------- главная: плитка с числами, праздничное окно первого запуска ---------- */
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); try { retro(); const dp = $('.t-diploma small', app); if (dp) dp.textContent = `🎖️ ${(S.badges || []).filter(id => cat().some(b => b.id === id)).length}/${cat().length} · 📜 ${(S.diplomas || []).length}`; if (BX().sum) setTimeout(retroModal, 1300); } catch (e) { console.warn(e); } return r; }; }
  /* ---------- отчёт для взрослых: новые значки за неделю ---------- */
  function weekLine() {
    memo = {}; const from = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return dkey(d); })(), retroS = new Set(BX().retro || []);
    const L = cat().filter(b => has(b) && !retroS.has(b.id) && (at()[b.id] || '') >= from), near = cat().filter(b => !has(b) && !b.secret).sort((x, y) => ratio(y) - ratio(x))[0];
    return `<p class="aw-week">🏅 Новые значки за неделю: <b>${L.length}</b>${L.length ? ' ' + L.slice(0, 12).map(b => `<span title="${esc(b.n)}">${b.i}</span>`).join('') : ''}${near ? `<br><small>Ближе всего: ${near.i} «${esc(near.n)}» — ${progTxt(near)}</small>` : ''}</p>`;
  }
  /* ---------- стили ---------- */
  const css = `
  .aw-head { display: flex; gap: 10px; align-items: center; margin: 4px 0 10px; }
  .aw-cat { width: 64px; flex: 0 0 64px; } .aw-cat svg { width: 64px; height: auto; display: block; }
  .aw-chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; } .aw-chips span { background: #fff; border-radius: 12px; padding: 5px 10px; font-size: 14px; box-shadow: var(--sh); white-space: nowrap; }
  .aw-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; margin-bottom: 12px; }
  .aw-tabs button { padding: 7px 2px; font-size: 13px; line-height: 1.15; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .aw-tabs button span { font-size: 20px; }
  .aw-pane[hidden] { display: none !important; }
  .aw-sum { background: #fff; border-radius: 18px; padding: 12px 14px; box-shadow: var(--sh); margin-bottom: 10px; display: grid; gap: 6px; }
  .aw-sum b { font-size: 17px; } .aw-sum small { color: var(--muted); font-size: 13px; }
  .aw-bar { display: block; height: 8px; border-radius: 8px; background: #F1E7DC; overflow: hidden; width: 100%; }
  .aw-bar i { display: block; height: 100%; border-radius: 8px; background: linear-gradient(90deg, var(--gold), var(--pink)); }
  .aw-tiers { display: flex; flex-wrap: wrap; gap: 6px; } .aw-tiers span { border: 2px solid var(--tc); border-radius: 12px; padding: 2px 9px; font-weight: 800; font-size: 14px; }
  .aw-flt { margin-bottom: 10px; display: grid; grid-template-columns: 1.35fr 1fr .8fr; } .aw-flt button { padding: 7px 4px; font-size: 13.5px; line-height: 1.15; min-width: 0; }
  .aw-hint { margin: 0 0 6px; }
  .badge-grid .bdg { font: inherit; color: inherit; cursor: pointer; position: relative; border: 2px solid var(--line); }
  .bdg .bi { font-size: 32px; line-height: 1.1; width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: #fff; box-shadow: 0 0 0 3px var(--tc) inset; }
  .bdg.on { border: 2px solid var(--tc); background: linear-gradient(#FFFBEF, #fff); }
  .bdg.on .bi { background: radial-gradient(circle at 35% 30%, #fff, #FFF3D6); }
  .bdg:not(.on) .bi { filter: grayscale(.85); opacity: .7; }
  .bdg.t-l.on { background: linear-gradient(#F4EDFF, #fff); }
  .bdg > small { font-weight: 700; } .bdg .aw-bar { height: 6px; margin-top: 2px; }
  .aw-grp { background: #fff; border-radius: 16px; box-shadow: var(--sh); margin: 0 0 10px; overflow: hidden; }
  .aw-grp > summary { list-style: none; cursor: pointer; padding: 11px 14px; display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; align-items: center; font-weight: 800; }
  .aw-grp > summary::-webkit-details-marker { display: none; }
  .aw-grp > summary span { min-width: 0; overflow-wrap: anywhere; } .aw-grp > summary span::before { content: '▸ '; color: var(--muted); } .aw-grp[open] > summary span::before { content: '▾ '; }
  .aw-grp > summary small { color: var(--muted); } .aw-grp > summary .aw-bar { grid-column: 1 / -1; height: 6px; }
  .aw-grp > .badge-grid, .aw-grp > .dp-next { padding: 0 10px 12px; margin: 0; }
  .aw-sheet { max-width: 420px; }
  .aw-det .aw-medal { font-size: 64px; width: 110px; height: 110px; margin: 0 auto 8px; border-radius: 50%; display: grid; place-items: center; background: radial-gradient(circle at 35% 30%, #fff, #FFF3D6); box-shadow: 0 0 0 6px var(--tc), 0 10px 24px rgba(59, 42, 74, .2); }
  .aw-det .aw-tier { color: var(--tc); font-weight: 900; font-size: 14px; margin-bottom: 6px; } .aw-det .aw-bar { height: 12px; margin: 8px 0 4px; }
  .aw-pn { font-weight: 800; color: var(--muted); font-size: 14px; font-style: normal; display: block; }
  .dp-n > div { min-width: 0; flex: 1; } .dp-n small { display: block; overflow-wrap: anywhere; } .dp-n .aw-bar { margin-top: 4px; height: 6px; }
  .aw-retro { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin: 8px 0; } .aw-retro span { font-size: 26px; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: #fff; box-shadow: 0 0 0 3px var(--tc) inset; animation: pop .4s both; } .aw-retro em { align-self: center; font-weight: 900; }
  .cs-month { margin: 14px 2px 6px; font-size: 15px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  .cs-list { display: grid; gap: 8px; }
  .cs-card { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 10px; align-items: center; background: #fff; border-radius: 16px; padding: 8px; box-shadow: var(--sh); min-width: 0; }
  .cs-img { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; background: #F1E7DC; display: block; }
  .cs-body { min-width: 0; display: grid; gap: 4px; }
  .cs-top { display: flex; gap: 6px; align-items: baseline; min-width: 0; } .cs-n { flex: none; background: var(--plum-2); color: var(--plum); border-radius: 8px; padding: 0 6px; font-weight: 900; font-size: 13px; }
  .cs-t { min-width: 0; overflow-wrap: anywhere; line-height: 1.2; font-size: 15px; }
  .cs-who { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 14px; } .cs-wn { min-width: 0; overflow-wrap: anywhere; }
  .cs-av { width: 30px; height: 30px; flex: none; display: grid; place-items: center; overflow: hidden; border-radius: 50%; background: var(--gold-2); } .cs-av svg { width: 30px; height: 30px; display: block; } .cs-emo { font-size: 20px; }
  .cs-meta { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 13px; color: var(--muted); font-weight: 700; } .cs-st { color: var(--gold); letter-spacing: 1px; } .cs-pf { color: var(--mint-d); }
  .cs-more { display: block; margin: 12px auto 0; } .cs-empty .big-emoji { font-size: 54px; }
  .aw-coll { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(130px, 100%), 1fr)); gap: 8px; margin-bottom: 12px; }
  .aw-ct { background: #fff; border-radius: 16px; box-shadow: var(--sh); padding: 10px; display: grid; justify-items: center; gap: 2px; text-align: center; min-width: 0; } .aw-ct span { font-size: 28px; } .aw-ct small { color: var(--muted); font-size: 13px; } .aw-ct .aw-bar { height: 6px; }
  .aw-extra h3 { margin-top: 12px; }
  .aw-week { background: #FFF8E6; border-radius: 12px; padding: 8px 12px; margin: 8px 0; } .aw-week span { font-size: 20px; }
  @media (max-width: 360px) { .aw-tabs button { font-size: 11.5px; } .aw-flt button { font-size: 12.5px; } .cs-card { grid-template-columns: 56px minmax(0, 1fr); } .cs-img { width: 56px; height: 56px; } .aw-chips span { font-size: 13px; padding: 4px 8px; } .aw-cat { display: none; } }
  `;
  if (!document.getElementById('medals-css')) { const s = document.createElement('style'); s.id = 'medals-css'; s.textContent = css; document.head.appendChild(s); }
  const late = () => {
    wrapScreen();
    const par = SCREENS.parents; if (par && !par.aw) { SCREENS.parents = arg => { const r = par(arg); try { const wk = $('.coach-rep .act.wk', app); if (wk && !$('.aw-week', app)) wk.insertAdjacentHTML('beforebegin', weekLine()); } catch (e) { console.warn(e); } return r; }; SCREENS.parents.aw = 1; }
  };
  // spacetrip.js и coach.js оборачивают позже (DOMContentLoaded / ниже по списку) — наша обёртка экрана должна быть внешней
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', late); else setTimeout(late, 0);
  return { list: cat, grant, check: () => grant(false), detail, TIER, AREAS, weekLine, feedHTML, bestStreak, has: id => (S.badges || []).includes(id) };
})();
window.Medals = Medals;
