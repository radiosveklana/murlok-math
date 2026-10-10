/* fasttap.js — мгновенный отклик в заданиях: цифры клавиатуры, таблица Шульте и ответы в играх на время
   срабатывают сразу при касании (pointerdown), а не после того, как палец поднят (click). Обычные кнопки не трогаем —
   иначе прокрутка списка случайно нажимала бы ответ. Повторный «родной» click после касания гасится. */
'use strict';
(() => {
  const FAST = '.pad .k, .schulte .sc';
  const timed = () => !!document.querySelector('#app .timer, #app .fake-timer, #app #tm, #app .bz-score');
  const target = e => { const b = e.target.closest('button'); if (!b || b.disabled) return null; if (b.matches(FAST)) return b; if (b.matches('.opt') && timed()) return b; return null; };
  document.addEventListener('pointerdown', e => {
    if (e.button > 0) return; const b = target(e); if (!b) return;
    b._fastAt = performance.now(); b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 140);
    b.click(); // тот же обработчик, что и раньше, — только без ожидания
  }, true);
  document.addEventListener('click', e => { // родной click после нашего — лишний
    if (!e.isTrusted) return; const b = e.target.closest('button'); if (b && b._fastAt && performance.now() - b._fastAt < 700) { e.stopImmediatePropagation(); e.preventDefault(); b._fastAt = 0; }
  }, true);
})();
