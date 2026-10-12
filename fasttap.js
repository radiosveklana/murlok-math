/* fasttap.js — мгновенный отклик в заданиях: цифры клавиатуры, таблица Шульте и ответы в играх на время
   срабатывают сразу при касании (pointerdown), а не после того, как палец поднят (click). Обычные кнопки не трогаем —
   иначе прокрутка списка случайно нажимала бы ответ. Повторный «родной» click после касания гасится. */
'use strict';
(() => {
  const FAST = '.pad .k, .schulte .sc';
  const timed = () => !!document.querySelector('#app .timer, #app .fake-timer, #app #tm, #app .bz-score');
  const target = e => { const b = e.target.closest('button'); if (!b || b.disabled) return null; if (b.matches(FAST)) return b; if (b.matches('.opt') && timed()) return b; return null; };
  // кнопка, уже нажатая текущим касанием. Сбрасывается только следующим pointerdown или клавишей — не по таймеру:
  // на медленном планшете родной click приходит и через секунду, и цифра печаталась дважды
  let last = null;
  document.addEventListener('pointerdown', e => {
    last = null; if (e.button > 0) return; const b = target(e); if (!b) return;
    last = b; b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 140);
    b.click(); // тот же обработчик, что и раньше, — только без ожидания
  }, true);
  document.addEventListener('keydown', () => { last = null; }, true);
  // 📋 шпаргалка в игре на время — нечестный рекорд: пока идёт таймер, не открываем (кнопку ещё и прячет style.css)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.cs-btn'); if (!b || !timed()) return;
    e.stopImmediatePropagation(); e.preventDefault(); if (typeof toast === 'function') toast('⏱ Идёт время! Шпаргалка откроется после игры');
  }, true);
  document.addEventListener('click', e => { // родной click после нашего касания — лишний (и когда клавиатуру уже перерисовали под пальцем)
    if (!e.isTrusted || !last) return; const b = e.target.closest('button');
    if (b && (b === last || b.matches(FAST) || b.matches('.opt'))) { e.stopImmediatePropagation(); e.preventDefault(); last = null; }
  }, true);
})();
