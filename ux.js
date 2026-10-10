/* ux.js (v26) — порядок на экранах: главная разложена по разделам «Учиться / Мой котик / Друзья и награды»,
   раздел для взрослых — по вкладкам «Обзор / Прогресс / Кабинет и настройки». Подключается последним:
   работает поверх всех модулей, ничего не удаляет — только переставляет готовые блоки. */
'use strict';
const UX = (() => {
  const HOME_GROUPS = [
    ['learn', '🎓 Учиться', ['school', 'academy', 'newcase', 'blitz', 'games', 'bugs']],
    ['cat', '🐱 Мой котик', ['house', 'shop', 'fitting', 'photo', 'chat', 'studio']],
    ['social', '🏆 Друзья и награды', ['friends', 'diplomas', 'book', 'earn']]
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
    let last = secs.learn || anchor; ['.coach', '.thought', '.acc-nudge'].forEach(sel => { const el = $(sel, app); if (el) { last.after(el); last = el; } });
    if (secs.cat) { last.after(secs.cat); last = secs.cat; } if (secs.social) last.after(secs.social);
    tiles.remove();
  }

  const PTABS = [['sum', '📊 Обзор'], ['prog', '📈 Прогресс'], ['acc', '⚙️ Кабинет']];
  const ptabOf = el => {
    if (el.classList.contains('acc-card') || el.matches('button.danger')) return 'acc';
    if (el.classList.contains('coach-rep')) return 'sum';
    const h = ((el.querySelector('h2,h3') || el).textContent || '').trim();
    if (/Сильные|Зоны роста|Советы|Коротко/.test(h)) return 'sum';
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
