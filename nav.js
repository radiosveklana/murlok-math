/* nav.js — кнопка «←» везде ведёт на предыдущий экран (история переходов).
   Если истории нет (открыли сразу), работает прежний адрес кнопки. Служебные экраны (вход, концовки дел) пропускаются. */
'use strict';
const Nav = (() => {
  const H = []; let cur = null, back = false;
  const SKIP = new Set(['hello', 'caseintro', 'casetask', 'accuse', 'solved', 'pauth', 'clogin', 'survey', 'mission']); // экраны дела и миссии — не возвращаемся в закрытые
  const g0 = go;
  go = function (name, arg) {
    const prev = cur, same = prev && prev.n === name && String(prev.a ?? '') === String(arg ?? '');
    if (!back && prev && !same && !SKIP.has(prev.n)) { H.push(prev); if (H.length > 40) H.shift(); }
    back = false; cur = { n: name, a: arg }; if (name === 'home') H.length = 0;
    return g0.apply(this, arguments);
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('.top .back'); if (!b) return;
    while (H.length && H[H.length - 1].n === (cur && cur.n) && String(H[H.length - 1].a ?? '') === String(cur.a ?? '')) H.pop();
    if (!H.length) return; // нет истории — сработает обычный адрес кнопки
    e.stopImmediatePropagation(); e.preventDefault(); if (typeof SND !== 'undefined') SND.tap();
    let p = H.pop(); if (/^(casetask|accuse|caseintro)$/.test(p.n) && (typeof CASE === 'undefined' || !CASE)) p = { n: 'newcase' }; back = true; go(p.n, p.a);
  }, true);
  return { history: () => H.slice(), current: () => cur };
})();
window.Nav = Nav;
