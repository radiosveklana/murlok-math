/* ux.js (v26) — порядок на экранах: главная разложена по разделам «Учиться / Мой котик / Друзья и награды»,
   раздел для взрослых — по вкладкам «Обзор / Прогресс / Кабинет и настройки». Подключается последним:
   работает поверх всех модулей, ничего не удаляет — только переставляет готовые блоки. */
'use strict';
const UX = (() => {
  { const st = document.createElement('style'); st.textContent = '.to-game{width:100%;margin:0 0 10px}'; document.head.appendChild(st); }
  const HOME_GROUPS = [
    ['learn', '🎓 Учиться', ['school', 'academy', 'mistakes', 'newcase', 'blitz', 'games', 'bugs', 'cheats']],
    ['cat', '🐱 Мой котик', ['house', 'shop', 'fitting', 'photo', 'chat', 'studio']],
    ['social', '🏆 Друзья и награды', ['friends', 'board', 'diplomas', 'book', 'earn']]
  ];
  function regroupHome() {
    const tiles = $('.tiles', app); if (!tiles || tiles.dataset.ux) return;
    const all = $$('.tile', tiles), used = new Set(), secs = {};
    HOME_GROUPS.forEach(([id, title, gos]) => {
      const list = gos.map(g => all.find(t => t.dataset.go === g)).filter(Boolean); list.forEach(t => used.add(t));
      if (!list.length) return;
      const s = document.createElement('section'); s.className = 'home-sec hs-' + id; s.innerHTML = `<h3 class="hs-title">${title}</h3><div class="tiles" data-ux="1"></div>`;
      list.forEach(t => $('.tiles', s).appendChild(t)); secs[id] = s;
    });
    all.filter(t => !used.has(t)).forEach(t => (secs.learn || secs.cat) && $('.tiles', secs.learn || secs.cat).appendChild(t)); // новые плитки модулей — в «Учиться»
    // учёба — сразу под героем (после продолжения дела и квеста), советы котика и мысль дня — под ней, остальное — ниже
    const anchor = $('.quest', app) || $('.resume', app) || $('.care-alert', app) || $('.hero', app);
    if (secs.learn) anchor.after(secs.learn);
    let last = secs.learn || anchor; ['.coach', '.thought', '.m-know', '.acc-nudge'].forEach(sel => { const el = $(sel, app); if (el) { last.after(el); last = el; } });
    if (secs.cat) { last.after(secs.cat); last = secs.cat; } if (secs.social) last.after(secs.social);
    tiles.remove();
  }

  const PTABS = [['sum', '📊 Обзор'], ['prog', '📈 Прогресс'], ['acc', '⚙️ Кабинет']];
  const ptabOf = el => {
    if (el.classList.contains('acc-card') || el.matches('button.danger')) return 'acc';
    if (el.classList.contains('coach-rep')) return 'sum';
    const h = ((el.querySelector('h2,h3') || el).textContent || '').trim();
    if (/Сильные|Зоны роста|Советы|Коротко|зелёной ручки/.test(h)) return 'sum';
    if (/Облачная|Резервная|Друзья в игре|Telegram|Разговоры|Настройки|Как устроен|Личный кабинет/.test(h)) return 'acc';
    return 'prog';
  };
  let ptab = 'sum'; try { ptab = sessionStorage.getItem('ptab') || 'sum'; } catch (e) { }
  function tabParents() {
    const pg = $('.page.parents', app); if (!pg || $('.ptabs', pg)) return;
    const kids = [...pg.children]; const panes = {};
    PTABS.forEach(([id]) => { const d = document.createElement('div'); d.className = 'ptab-pane'; d.dataset.tab = id; panes[id] = d; });
    kids.forEach(el => panes[ptabOf(el)].appendChild(el));
    const bar = document.createElement('div'); bar.className = 'ptabs'; bar.setAttribute('role', 'tablist');
    bar.innerHTML = PTABS.map(([id, n]) => `<button role="tab" data-tab="${id}">${n}</button>`).join('');
    pg.append(bar, ...PTABS.map(([id]) => panes[id]));
    if (S.kid) pg.insertAdjacentHTML('afterbegin', '<button class="btn mint big to-game" data-go="home">🎮 Вернуться в игру</button>'); // взрослый раздел всегда можно покинуть
    const show = id => { if (!panes[id] || !panes[id].children.length) id = 'sum'; ptab = id; try { sessionStorage.setItem('ptab', id); } catch (e) { }
      PTABS.forEach(([t]) => { panes[t].hidden = t !== id; }); $$('button', bar).forEach(b => b.setAttribute('aria-selected', b.dataset.tab === id)); };
    bar.addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (!b) return; SND.tap(); show(b.dataset.tab); window.scrollTo({ top: 0 }); });
    show(ptab);
  }

  const wrap = (n, f) => { const s = SCREENS[n]; if (!s) return; SCREENS[n] = arg => { const r = s(arg); try { f(arg); } catch (e) { console.warn(e); } return r; }; };
  wrap('home', regroupHome); wrap('parents', tabParents);
  return { showAll: () => $$('.ptab-pane').forEach(p => { p.hidden = false; }) };
})();
window.UX = UX;
/* экран решения на телефоне: условие задачи раскрывается по нажатию, а подсказка котика сама прокручивается к последней фразе (там вопрос) */
document.addEventListener('click', e => { const st = e.target.closest('.task-page .story-card'); if (st) st.classList.toggle('open'); });
new MutationObserver(() => { document.querySelectorAll('.task-page .ctrl-col .helper .bubble').forEach(b => { if (b.scrollHeight > b.clientHeight) b.scrollTop = b.scrollHeight; }); })
  .observe(document.getElementById('app'), { childList: true, subtree: true, characterData: true });
/* v30: клавиатура/варианты ответа прижаты к низу экрана (.v30-dock), поле ответа над ними (.v30-askdock), а выделенная клетка
   столбика сама прокручивается в видимую часть над панелью. Только классы и прокрутка — логика заданий не меняется. */
(() => {
  const appEl = document.getElementById('app'); let raf = 0, lastTarget = null;
  const DOCK_IN = '#garea, #qarea, #bz, #rq, #cwork, #b2q', DOCK = '.pad, .opts, .rs-opts, #sq, #cin', ASK = '.ask-eq, .bz-q, .eqline, .ask';
  const tog = (el, c, on) => { if (el.classList.contains(c) !== on) el.classList.toggle(c, on); }; // без лишних мутаций — иначе наблюдатель зациклится
  function docks() {
    appEl.querySelectorAll(DOCK_IN).forEach(box => {
      [...box.children].forEach(el => {
        const docked = el.classList.contains('v30-dock');
        let on = el.matches('.pad') || (el.matches(DOCK) && !!el.querySelector('button'));
        if (on && el.offsetHeight + (docked ? 0 : 14) > innerHeight * 0.5) on = false; // огромная сетка вариантов — остаётся в потоке
        tog(el, 'v30-dock', on);
        const prev = el.previousElementSibling, askOn = on && !!prev && prev.matches(ASK);
        if (prev && (askOn || prev.classList.contains('v30-askdock'))) tog(prev, 'v30-askdock', askOn);
        if (on) { const h = el.offsetHeight + 'px'; if (box.style.getPropertyValue('--dock-h') !== h) box.style.setProperty('--dock-h', h); }
      });
    });
  }
  let changedAt = 0;
  function keepTarget() {
    const t = appEl.querySelector('.task-page .cell.target'); if (!t) { lastTarget = null; return; }
    if (t !== lastTarget) { lastTarget = t; changedAt = Date.now(); setTimeout(kick, 300); setTimeout(kick, 1000); } // панель ещё дорастает: подсказка, вопрос
    else if (Date.now() - changedAt > 1600) return; // дальше не мешаем ребёнку листать самому
    const cc = t.closest('.task-page') && t.closest('.task-page').querySelector('.ctrl-col'); if (!cc || getComputedStyle(cc).position !== 'sticky') return;
    const r = t.getBoundingClientRect(), cr = cc.getBoundingClientRect(), top = appEl.querySelector(':scope > .top');
    const minY = (top ? top.getBoundingClientRect().bottom : 0) + 6;
    let maxY = innerHeight - 6;
    if (cr.left < r.right && cr.right > r.left && cr.bottom >= innerHeight - 2 && cr.top > minY) maxY = cr.top - 8; // панель снизу перекрывает лист
    if (r.top >= minY && r.bottom <= maxY) return;
    const d = (r.top + r.bottom) / 2 - (minY + Math.max(minY + r.height, maxY)) / 2;
    window.scrollBy(0, Math.round(d)); // мгновенно: плавная прокрутка срывается, пока котик дописывает подсказку
  }
  const run = () => { raf = 0; try { docks(); keepTarget(); } catch (e) { console.warn(e); } };
  const kick = () => { if (!raf) raf = requestAnimationFrame(run); };
  new MutationObserver(kick).observe(appEl, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', kick);
})();
