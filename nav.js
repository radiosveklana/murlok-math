/* nav.js — кнопка «←» ведёт в меню, из которого пришли (история хранит только меню и разделы).
   Экраны заданий, игр, уроков и дел в историю не попадают: из задания «назад» — сразу в меню раздела,
   а не на прошлое (уже сданное) задание. Если истории нет, работает прежний адрес кнопки. */
'use strict';
const Nav = (() => {
  const H = []; let cur = null, back = false;
  // задания и одноразовые экраны: возвращаться в них нельзя
  const TASK = new Set(['hello', 'caseintro', 'casetask', 'accuse', 'solved', 'pauth', 'agate', 'pinset', 'linknow', 'adultswitch', 'clogin', 'survey', 'mission', 'spacefly',
    'aquiz', 'alesson', 'mdrill', 'lesson', 'collesson', 'colwork', 'practice', 'game', 'drill', 'blitz', 'bugs', 'bugs2', 'rescue', 'solar',
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
  // v35: на телефоне панель с клавиатурой прижата к низу и закрывала нижние клетки столбика (строку суммы) —
  // подвигаем страницу, чтобы клетка, в которую сейчас пишем, была видна над панелью
  let raf = 0;
  const keepVisible = () => { raf = 0;
    const t = document.querySelector('#app .cell.target, #app .cell.tap'), c = document.querySelector('#app .task-page .ctrl-col'); if (!t || !c) return;
    if (getComputedStyle(c).position !== 'sticky') return; const tr = t.getBoundingClientRect(), cr = c.getBoundingClientRect(), top = (document.querySelector('#app header.top') || { getBoundingClientRect: () => ({ bottom: 0 }) }).getBoundingClientRect().bottom;
    if (cr.top < tr.bottom + 8 && cr.top > 0) window.scrollBy({ top: Math.min(tr.bottom + 12 - cr.top, Math.max(0, tr.top - top - 8)), behavior: 'smooth' });
  };
  const app0 = document.getElementById('app');
  if (app0 && window.MutationObserver) new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(keepVisible); }).observe(app0, { subtree: true, attributes: true, attributeFilter: ['class'] });
  return { history: () => H.slice(), current: () => cur, keepVisible };
})();
window.Nav = Nav;
