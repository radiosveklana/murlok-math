/* awards.js — «Мои награды» вместо «Блокнота детектива» (дипломы + значки + раскрытые дела + правила),
   «Игры Академии» в детективных играх, «Мысль дня» на главной, новые преступления — первыми в очереди дел. */
'use strict';
const Awards = (() => {
  /* ---------- «Мои награды» ---------- */
  { const dp = SCREENS.diplomas; SCREENS.diplomas = arg => {
    dp(arg); const pg = $('.page.diplomas', app); if (!pg) return; $('.top h1', app).textContent = '🏆 Мои награды';
    const B = typeof BADGES !== 'undefined' ? BADGES : [], got = new Set(S.badges || []), log = (S.caseLog || []).slice(0, 12);
    pg.insertAdjacentHTML('beforeend', `<h3>🎖️ Значки</h3><div class="badge-grid">${B.map(b => `<div class="bdg ${got.has(b.id) ? 'on' : ''}" title="${b.desc}"><span>${got.has(b.id) ? b.icon : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div>
      <h3>📁 Раскрытые дела <small>(${S.cases || 0})</small></h3>${log.length ? `<div class="case-log">${log.map(c => `<div class="cl-it">${c.perfect ? '⭐' : '✔'} №${c.n} «${esc(c.title)}» <small>вор: ${esc(c.who)} · ${new Date(c.date).toLocaleDateString('ru-RU')}</small></div>`).join('')}</div>` : '<p class="small">Пока нет раскрытых дел.</p>'}
      <div class="row-btns"><button class="btn" data-go="book">📒 Правила сыщика</button></div>`);
  }; }
  /* ---------- главная: плитка «Мои награды» вместо «Блокнота», «Мысль дня» ---------- */
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); try {
    const bk = $('.t-book', app); if (bk) bk.remove();
    const dp = $('.t-diploma', app); if (dp) { $('b', dp).textContent = 'Мои награды'; $('small', dp).textContent = `дипломы, значки, дела`; }
    const D = (((window.SUBJECTS || {}).stories || {}).daily) || []; if (D.length && !$('.thought', app)) { const day = Math.floor(Date.now() / 864e5), q = D[day % D.length]; const tiles = $('.tiles', app); if (tiles) tiles.insertAdjacentHTML('beforebegin', `<div class="thought" data-go="subject" data-arg="stories"><b>🌟 Мысль дня</b><p>«${q.t}»</p><small>— ${q.who}</small></div>`); }
  } catch (e) { console.warn(e); } return r; }; }
  /* ---------- детективные игры: игры по темам Академии ---------- */
  { const gm = SCREENS.games; SCREENS.games = arg => { gm(arg); const pg = $('.page', app); if (!pg) return;
    const subs = Object.values(window.SUBJECTS || {}).filter(s => s.id !== 'teen' && s.id !== 'math4' && (s.extras || []).length);
    const items = subs.flatMap(s => (s.extras || []).filter(e => !/growth|rgrowth/.test(e.id)).map(e => ({ s, e })));
    if (window.SpaceTrip) items.unshift({ s: { icon: '🚀', name: 'Бонус' }, e: { id: 'spacetrip', icon: '🚀', name: 'Полёт в космос', run: () => go('spacetrip') } });
    pg.insertAdjacentHTML('beforeend', `<h3>🎓 Игры Академии</h3><div class="games-grid">${items.map(({ s, e }, i) => `<button class="game-card agame" data-ai="${i}"><span class="gi">${e.icon}</span><b>${e.name}</b><small>${s.icon} ${s.name}</small></button>`).join('')}</div>`);
    $$('.agame', pg).forEach(b => b.addEventListener('click', () => { SND.tap(); items[+b.dataset.ai].e.run(); }));
  }; }
  /* ---------- новые преступления — первыми в очереди дел ---------- */
  try { if (!S.crimesV2 && typeof E !== 'undefined' && E.CRIMES.length > 36) { const fresh = []; for (let i = 36; i < E.CRIMES.length; i++) fresh.push(i); S.crimeBag = shuffle(fresh).concat((S.crimeBag || []).filter(i => i < 36)); S.crimesV2 = 1; save(); } } catch (e) { }
  ['diplomas'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return {};
})();
window.Awards = Awards;
