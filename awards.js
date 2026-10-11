/* awards.js — «Мои награды» вместо «Блокнота детектива» (дипломы + значки + раскрытые дела + правила),
   «Игры Академии» в детективных играх, «Мысль дня» на главной, новые преступления — первыми в очереди дел. */
'use strict';
const Awards = (() => {
  /* ---------- «Мои награды» ---------- */
  // v31: значки, ленту раскрытых дел и вкладки рисует medals.js. Раньше здесь была сетка из 15 значков и список дел
  // с классами .case-log/.cl-it, для которых не было ни одного стиля (строки слипались, длинные названия вылезали), и дата
  // через new Date('ГГГГ-ММ-ДД') — это полночь по UTC, у западных часовых поясов день съезжал на вчера.
  { const dp = SCREENS.diplomas; SCREENS.diplomas = arg => { dp(arg); const h = $('.top h1', app); if (h) h.textContent = '🏆 Мои награды'; }; }
  /* ---------- главная: плитка «Мои награды» вместо «Блокнота», «Мысль дня» ---------- */
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); try {
    const bk = $('.t-book', app); if (bk) bk.remove();
    const dp = $('.t-diploma', app); if (dp) { $('b', dp).textContent = 'Мои награды'; $('small', dp).textContent = `значки, дипломы, дела`; }
    const D = (((window.SUBJECTS || {}).stories || {}).daily) || []; if (D.length && !$('.thought', app)) { const day = Math.floor(Date.now() / 864e5), q = D[day % D.length]; const tiles = $('.tiles', app); if (tiles) tiles.insertAdjacentHTML('beforebegin', `<div class="thought" data-go="subject" data-arg="stories"><i class="th-star s1">✦</i><i class="th-star s2">✧</i><i class="th-star s3">✦</i><div class="th-cat">${myCat({ cls: 'mini', smile: true, star: true })}</div><div class="th-body"><div class="th-label">🌟 Мысль дня</div><p class="th-q">${q.t}</p><div class="th-who">— ${q.who}</div><div class="th-btns"><button class="th-read" type="button">🔊 Прочитай</button><span class="th-more">Истории →</span></div></div></div>`);
        const th = $('.thought', app); $('.th-read', th).addEventListener('click', e => { e.stopPropagation(); if (typeof wakeAudio === 'function') wakeAudio(); speakRemote(`Мысль дня. ${q.t} ${q.who && q.who !== 'факт' ? q.who : ''}`); th.classList.remove('pulse'); void th.offsetWidth; th.classList.add('pulse'); }); }
  } catch (e) { console.warn(e); } return r; }; }
  /* ---------- детективные игры: игры по темам Академии ---------- */
  { const gm = SCREENS.games; SCREENS.games = arg => { gm(arg); const pg = $('.page', app); if (!pg) return;
    const subs = Object.values(window.SUBJECTS || {}).filter(s => s.id !== 'teen' && s.id !== 'math4' && (s.extras || []).length);
    const items = subs.flatMap(s => (s.extras || []).filter(e => !/growth|rgrowth|^starmap$/.test(e.id)).map(e => ({ s, e })));
    if (window.SpaceTrip) items.unshift({ s: { icon: '🚀', name: 'Бонус' }, e: { id: 'spacetrip', icon: '🚀', name: 'Космическая аркада', run: () => go('spacetrip') } });
    pg.insertAdjacentHTML('beforeend', `<h3>🎓 Игры Академии</h3><div class="games-grid">${items.map(({ s, e }, i) => `<button class="game-card agame" data-ai="${i}"><span class="gi">${e.icon}</span><b>${e.name}</b><small>${s.icon} ${s.name}</small></button>`).join('')}</div>`);
    $$('.agame', pg).forEach(b => b.addEventListener('click', () => { SND.tap(); items[+b.dataset.ai].e.run(); }));
  }; }
  /* ---------- новые преступления — первыми в очереди дел ---------- */
  try { if (!S.crimesV2 && typeof E !== 'undefined' && E.CRIMES.length > 36) { const fresh = []; for (let i = 36; i < E.CRIMES.length; i++) fresh.push(i); S.crimeBag = shuffle(fresh).concat((S.crimeBag || []).filter(i => i < 36)); S.crimesV2 = 1; save(); } } catch (e) { }
  ['diplomas'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return {};
})();
window.Awards = Awards;
