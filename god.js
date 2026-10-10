/* god.js — «режим бога» для тестирования владельцем: всё открыто сразу.
   Включается на устройстве, где вошёл взрослый, которому сервер выдал god (GOD_EMAILS в настройках сервера или флаг семьи в админке).
   Что даёт: открыты все комнаты, уроки и космос; в ⚙️ — панель: конфеты/кристаллы, все вещи, переход на любой экран, сброс экскурсий. */
'use strict';
(() => {
  const K = 'murlok-god';
  const on = () => { try { return localStorage.getItem(K) === '1'; } catch (e) { return false; } };
  window.GOD = on();
  // кабинет родителя сообщает, что этот взрослый — «бог»: запоминаем на устройстве
  if (window.Accounts && Accounts.api) { const P = Accounts.parent(); if (P && P.token && !sessionStorage.getItem('godChk')) { sessionStorage.setItem('godChk', 1); Accounts.api('family', null, P.token).then(d => { const g = !!(d.family && d.family.god); try { g ? localStorage.setItem(K, '1') : localStorage.removeItem(K); } catch (e) { } if (g !== window.GOD) location.reload(); }).catch(() => { }); } }
  if (!window.GOD) return;
  // всё, что открывается «за решённые задачи» (комнаты, космос), — открыто
  const st0 = solvedTotal; solvedTotal = function () { return Math.max(st0.apply(this, arguments), 100000); };
  const css = document.createElement('style'); css.id = 'god-css'; css.textContent = `.god-badge{position:fixed;left:6px;bottom:6px;z-index:9999;background:#FFD54A;color:#3B2A4A;font:800 12px Nunito,sans-serif;border-radius:10px;padding:3px 8px;box-shadow:0 2px 6px rgba(0,0,0,.2);pointer-events:none}.god-grid{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.god-sel{width:100%;padding:10px;border-radius:12px;font:inherit;margin:6px 0}`;
  document.head.appendChild(css); const b = document.createElement('div'); b.className = 'god-badge'; b.textContent = '👑 режим бога'; document.body.appendChild(b);
  function panel() {
    const scr = Object.keys(SCREENS).sort();
    const m = modal(`<h2>👑 Режим бога</h2><p class="small">Для быстрого тестирования. Всё открыто, награды — по кнопке.</p>
      <div class="god-grid"><button class="btn" id="g-c">+1000 🍬</button><button class="btn" id="g-g">+100 💎</button><button class="btn" id="g-all">Все вещи и окрасы</button><button class="btn" id="g-tour">Сбросить экскурсии и подсказки</button><button class="btn" id="g-news">Показать «Что нового»</button></div>
      <label class="small">Перейти на экран</label><select class="god-sel" id="g-scr">${scr.map(s => `<option>${s}</option>`).join('')}</select><input class="nmi" id="g-arg" placeholder="аргумент (необязательно), напр. space:moon">
      <div class="row-btns"><button class="btn pink" id="g-go">Перейти</button><button class="btn" id="g-off">Выключить на этом устройстве</button><button class="btn" data-close>Закрыть</button></div>`, 'wide');
    const done = t => { save(); updCandy && updCandy(); toast(t); };
    $('#g-c', m.el).onclick = () => { S.candies += 1000; S.totalCandies = (S.totalCandies || 0) + 1000; done('+1000 🍬'); };
    $('#g-g', m.el).onclick = () => { S.gems = (S.gems || 0) + 100; done('+100 💎'); };
    $('#g-all', m.el).onclick = () => { const C = window.Cat || {}; S.owned = [...new Set([...(S.owned || []), ...(C.ITEMS || []).map(i => i.id)])]; S.furs = [...new Set([...(S.furs || []), ...Object.keys(C.FURS || {})])]; done('Все вещи и окрасы открыты'); };
    $('#g-tour', m.el).onclick = () => { delete S.tourDone; S.tours = {}; done('Экскурсии сброшены'); };
    $('#g-news', m.el).onclick = () => { S.seenVersion = '0'; save(); m.close(); go('home'); };
    $('#g-go', m.el).onclick = () => { const a = $('#g-arg', m.el).value.trim(); m.close(); go($('#g-scr', m.el).value, a || undefined); };
    $('#g-off', m.el).onclick = () => { try { localStorage.removeItem(K); } catch (e) { } location.reload(); };
  }
  const os = openSettings; openSettings = function () { const r = os.apply(this, arguments); const L = $$('.modal .set-list').pop(); if (L && !$('#set-god', L)) { L.insertAdjacentHTML('afterbegin', '<button class="set-row" id="set-god" style="background:#FFF3C4"><span>👑</span><b>Режим бога</b><i class="arr">›</i></button>'); $('#set-god', L).addEventListener('click', () => { $$('.modal').forEach(x => x.remove()); panel(); }); } return r; };
  window.GodMode = { panel };
})();
