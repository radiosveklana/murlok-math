/* nav.js — кнопка «←» ведёт в меню, из которого пришли (история хранит только меню и разделы).
   Экраны заданий, игр, уроков и дел в историю не попадают: из задания «назад» — сразу в меню раздела,
   а не на прошлое (уже сданное) задание. Если истории нет, работает прежний адрес кнопки. */
'use strict';
const Nav = (() => {
  const H = []; let cur = null, back = false;
  // задания и одноразовые экраны: возвращаться в них нельзя
  const TASK = new Set(['hello', 'caseintro', 'casetask', 'accuse', 'solved', 'pauth', 'clogin', 'survey', 'mission',
    'aquiz', 'alesson', 'lesson', 'collesson', 'colwork', 'practice', 'game', 'drill', 'blitz', 'bugs', 'bugs2', 'rescue', 'solar',
    'citywalk', 'fakenews', 'helpharm', 'bodybuild', 'rpchat', 'visit', 'chat']);
  const isTask = s => TASK.has(s.n) || (/^(practice2|ideas)$/.test(s.n) && s.a != null && s.a !== '');
  const eq = (a, b) => a && b && a.n === b.n && String(a.a ?? '') === String(b.a ?? '');
  const g0 = go;
  go = function (name, arg) {
    const prev = cur, next = { n: name, a: arg };
    if (!back && prev && !eq(prev, next) && !isTask(prev)) { const i = H.findIndex(h => eq(h, prev)); if (i >= 0) H.splice(i); H.push(prev); if (H.length > 30) H.shift(); }
    back = false; cur = next; if (name === 'home') H.length = 0;
    return g0.apply(this, arguments);
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('.top .back'); if (!b) return;
    while (H.length && eq(H[H.length - 1], cur)) H.pop();
    if (!H.length) return; // нет истории — сработает обычный адрес кнопки
    e.stopImmediatePropagation(); e.preventDefault(); if (typeof SND !== 'undefined') SND.tap();
    const p = H.pop(); back = true; go(p.n, p.a);
  }, true);
  return { history: () => H.slice(), current: () => cur };
})();
window.Nav = Nav;
