/* wardrobe.js — новые наряды, «Легенда» после высшего звания, коллекция, кнопка «Заработать» и раздел
   «Как заработать», смена имени ребёнка и котика. Старые наряды, звания и магазин не меняются. */
'use strict';
const Wardrobe = (() => {
  const L = '#3B2A4A', SW = `stroke="${L}" stroke-width="3.5"`;
  /* ================= новые наряды (рисунки в системе координат котика 210×248) ================= */
  Object.assign(Cat.ACC, {
    witch: `<path d="M40 62 Q100 48 160 62 Q100 78 40 62Z" fill="#6B4FBF" ${SW}/><path d="M66 60 L106 -14 Q114 22 136 58 Z" fill="#7B5CD6" ${SW}/><path d="M68 52 Q100 44 134 52" stroke="#FFC93C" stroke-width="6" fill="none"/><path d="M104 22 l2.5 5 5.5 .8 -4 3.9 1 5.5 -5 -2.6 -5 2.6 1 -5.5 -4 -3.9 5.5 -.8Z" fill="#FFE27A"/>`,
    cap: `<path d="M54 60 Q56 18 100 16 Q144 18 146 60 Z" fill="#3D8BFD" ${SW}/><path d="M100 58 Q150 50 172 62 Q144 74 100 66 Z" fill="#2E6FD6" ${SW}/><circle cx="100" cy="17" r="5" fill="#fff" ${SW}/><path d="M80 24 Q78 40 80 58 M120 24 Q122 40 120 58" stroke="#2E6FD6" stroke-width="2.5" fill="none"/>`,
    tiara: `<path d="M64 56 Q100 42 136 56 L130 46 L118 30 L108 44 L100 20 L92 44 L82 30 L70 46 Z" fill="#EEF2FB" stroke="#AEB8CF" stroke-width="3"/><circle cx="100" cy="30" r="5.5" fill="#FF6F9C"/><circle cx="82" cy="39" r="3.5" fill="#7CC4FF"/><circle cx="118" cy="39" r="3.5" fill="#7CC4FF"/>`,
    astro: `<circle cx="100" cy="96" r="74" fill="rgba(190,230,255,.22)" stroke="#E8EEF8" stroke-width="7"/><path d="M50 62 q22 -32 60 -38" stroke="#fff" stroke-width="5" fill="none" opacity=".85"/><rect x="56" y="152" width="88" height="15" rx="7" fill="#E8EEF8" ${SW}/><circle cx="72" cy="159" r="3" fill="#E6455A"/><circle cx="84" cy="159" r="3" fill="#2FB37A"/>`,
    cowboy: `<path d="M26 58 Q40 72 100 70 Q160 72 174 58 Q152 78 100 80 Q48 78 26 58 Z" fill="#A86B3C" ${SW}/><path d="M62 64 Q58 20 80 22 Q100 34 120 22 Q142 20 138 64 Z" fill="#C2824A" ${SW}/><path d="M62 54 Q100 62 138 54" stroke="#6B3E1E" stroke-width="6" fill="none"/>`,
    bunny: `<path d="M70 52 Q54 -16 76 -18 Q94 -12 88 50 Z" fill="#fff" ${SW}/><path d="M74 42 Q66 0 77 -6 Q85 0 82 42 Z" fill="#FFB3C7"/><path d="M112 50 Q106 -12 124 -18 Q146 -16 130 52 Z" fill="#fff" ${SW}/><path d="M118 42 Q116 0 123 -6 Q134 0 126 42 Z" fill="#FFB3C7"/><path d="M56 58 Q100 36 144 58" stroke="#FF6F9C" stroke-width="7" fill="none"/>`,
    unihorn: `<path d="M89 50 L100 -6 L111 50 Z" fill="#FFE27A" ${SW}/><path d="M92 38 l16 -4 M94 25 l12 -3 M96 12 l8 -2" stroke="#E0A92A" stroke-width="2.5"/><circle cx="74" cy="52" r="8" fill="#FF8FB1" ${SW}/><circle cx="126" cy="52" r="8" fill="#B9A6FF" ${SW}/>`,
    beanie: `<path d="M52 64 Q50 14 100 12 Q150 14 148 64 Z" fill="#7FE0C1" ${SW}/><path d="M66 22 Q60 40 62 60 M100 13 V60 M134 22 Q140 40 138 60" stroke="#4FC4A0" stroke-width="4" fill="none"/><path d="M48 56 Q100 72 152 56 L152 70 Q100 86 48 70 Z" fill="#FF8FB1" ${SW}/><circle cx="100" cy="8" r="13" fill="#fff" ${SW}/>`,
    halo: `<ellipse cx="100" cy="16" rx="36" ry="10" fill="none" stroke="#FFD34D" stroke-width="8"/><ellipse cx="100" cy="16" rx="36" ry="10" fill="none" stroke="#FFF6C9" stroke-width="2.5"/>`,
    lcrown: `<path d="M56 60 L50 8 L76 34 L100 -4 L124 34 L150 8 L144 60 Z" fill="#FFC93C" ${SW}/><path d="M56 60 L144 60 L144 50 L56 50 Z" fill="#E8A21B" ${SW}/>${[[100, 26, '#E6455A'], [74, 44, '#3D8BFD'], [126, 44, '#2FB37A'], [88, 54, '#B9A6FF'], [112, 54, '#FF8FB1']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="${c}" ${SW}/>`).join('')}<path d="M100 -18 l3 6 6.5 1 -4.7 4.6 1.1 6.5 -5.9 -3.1 -5.9 3.1 1.1 -6.5 -4.7 -4.6 6.5 -1z" fill="#FFF3B0"/>`,
    lhalo: `<g>${Array.from({ length: 8 }, (_, i) => { const a = i / 8 * Math.PI * 2, x = 100 + Math.cos(a) * 40, y = 14 + Math.sin(a) * 11; return `<path d="M${x} ${y - 6} l1.9 4.1 4.1 1.9 -4.1 1.9 -1.9 4.1 -1.9 -4.1 -4.1 -1.9 4.1 -1.9z" fill="${i % 2 ? '#FFE27A' : '#fff'}" stroke="#E0A92A" stroke-width="1"/>`; }).join('')}</g>`,
    /* мордочка */
    starglass: `${[78, 122].map(x => `<path d="M${x} 78 l5.6 11.4 12.6 1.8 -9.1 8.9 2.2 12.5 -11.3 -5.9 -11.3 5.9 2.2 -12.5 -9.1 -8.9 12.6 -1.8Z" fill="rgba(255,111,156,.55)" stroke="#FF4F8B" stroke-width="3"/>`).join('')}<path d="M93 96 q7 -5 14 0" stroke="#FF4F8B" stroke-width="3" fill="none"/>`,
    hero: `<path fill-rule="evenodd" d="M48 86 Q78 72 100 90 Q122 72 152 86 Q154 110 128 112 Q110 112 100 102 Q90 112 72 112 Q46 110 48 86 Z M65 96 a13 15 0 1 0 26 0 a13 15 0 1 0 -26 0 Z M109 96 a13 15 0 1 0 26 0 a13 15 0 1 0 -26 0 Z" fill="#E6455A" ${SW}/>`,
    goggles: `<path d="M38 96 H162" stroke="#7E5332" stroke-width="7"/>${[78, 122].map(x => `<circle cx="${x}" cy="96" r="18" fill="rgba(255,190,90,.45)" stroke="#B98A3E" stroke-width="5"/><path d="M${x - 9} ${88} q5 -5 10 -4" stroke="#fff" stroke-width="3" fill="none"/>`).join('')}`,
    stache: `<path d="M100 119 Q88 112 77 118 Q69 124 60 117 Q64 132 80 129 Q92 127 100 121 Q108 127 120 129 Q136 132 140 117 Q131 124 123 118 Q112 112 100 119 Z" fill="#5A3B2A" ${SW}/>`,
    blush: `${[58, 142].map(x => `<path d="M${x} 124 C${x - 12} 116 ${x - 10} 106 ${x - 4} 106 C${x - 1} 106 ${x} 109 ${x} 110 C${x} 109 ${x + 1} 106 ${x + 4} 106 C${x + 10} 106 ${x + 12} 116 ${x} 124Z" fill="#FF5E92" opacity=".85"/>`).join('')}`,
    lglasses: `${[78, 122].map(x => `<rect x="${x - 19}" y="84" width="38" height="26" rx="10" fill="rgba(255,215,90,.5)" stroke="#E0A92A" stroke-width="4"/><path d="M${x - 11} 90 l10 0" stroke="#fff" stroke-width="3"/>`).join('')}<path d="M97 94 h6 M59 92 L42 86 M141 92 L158 86" stroke="#E0A92A" stroke-width="4"/>`,
    /* шея */
    cape: `<path d="M54 144 Q28 192 40 228 L66 216 Q60 180 72 152 Z" fill="#E6455A" ${SW}/><path d="M146 144 Q172 192 160 228 L134 216 Q140 180 128 152 Z" fill="#E6455A" ${SW}/><path d="M56 144 Q100 164 144 144" stroke="#C7334A" stroke-width="9" fill="none"/><circle cx="100" cy="156" r="8" fill="#FFC93C" ${SW}/>`,
    pearls: `<g>${Array.from({ length: 11 }, (_, i) => { const t = i / 10, x = 54 + t * 92, y = 146 + Math.sin(t * Math.PI) * 20; return `<circle cx="${x}" cy="${y}" r="5.5" fill="#FFF8F0" stroke="#D9C9B8" stroke-width="2"/>`; }).join('')}</g>`,
    tie: `<path d="M93 148 h14 l-3 9 h-8 z" fill="#3D8BFD" ${SW}/><path d="M96 157 h8 l8 32 -12 11 -12 -11 z" fill="#3D8BFD" ${SW}/><path d="M98 170 l6 4 M96 182 l10 4" stroke="#fff" stroke-width="2.5" opacity=".7"/>`,
    lei: `<g>${Array.from({ length: 9 }, (_, i) => { const t = i / 8, x = 52 + t * 96, y = 146 + Math.sin(t * Math.PI) * 18; return `<circle cx="${x}" cy="${y}" r="8" fill="${['#FF8FB1', '#FFC93C', '#B9A6FF'][i % 3]}" ${SW}/><circle cx="${x}" cy="${y}" r="2.5" fill="#fff"/>`; }).join('')}</g>`,
    bandana: `<path d="M50 142 Q100 164 150 142 L100 196 Z" fill="#FFC93C" ${SW}/>${[[86, 158], [112, 158], [100, 174], [94, 186]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`).join('')}`,
    lcape: `<path d="M52 144 Q24 196 36 232 L66 218 Q58 180 70 152 Z" fill="#FFC93C" ${SW}/><path d="M148 144 Q176 196 164 232 L134 218 Q142 180 130 152 Z" fill="#FFC93C" ${SW}/><path d="M54 144 Q100 166 146 144" stroke="#7B5CD6" stroke-width="10" fill="none"/><path d="M100 148 l3.5 7 7.5 1 -5.5 5.3 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.3 7.5 -1z" fill="#fff" ${SW}/><circle cx="44" cy="196" r="3" fill="#fff"/><circle cx="156" cy="200" r="3" fill="#fff"/>`,
  });
  Object.assign(Cat.HAND, {
    umbrella: `<path d="M152 204 L178 144" stroke="#6B4FBF" stroke-width="5"/><path d="M146 146 Q178 100 210 146 Q200 138 189 146 Q178 138 167 146 Q156 138 146 146 Z" fill="#FF8FB1" ${SW}/><path d="M178 112 v-6" ${SW}/>`,
    balloon: `<path d="M152 204 Q168 170 180 132" stroke="${L}" stroke-width="2" fill="none"/><ellipse cx="184" cy="108" rx="20" ry="25" fill="#FF5E7E" ${SW}/><path d="M180 133 l4 -4 4 4z" fill="#FF5E7E" ${SW}/><ellipse cx="177" cy="99" rx="5" ry="8" fill="#fff" opacity=".5"/>`,
    icecream: `<path d="M162 174 L176 210 L190 174 Z" fill="#E9B072" ${SW}/><path d="M166 182 l18 0 M168 192 l14 0" stroke="#C98A4B" stroke-width="2"/><circle cx="168" cy="166" r="12" fill="#FF8FB1" ${SW}/><circle cx="186" cy="166" r="12" fill="#7FE0C1" ${SW}/><circle cx="177" cy="152" r="12" fill="#FFF3D6" ${SW}/><circle cx="177" cy="140" r="4" fill="#E6455A"/>`,
    mic: `<path d="M152 204 L172 168" stroke="#2F2B3A" stroke-width="9"/><circle cx="178" cy="156" r="15" fill="#B9C2D6" ${SW}/><path d="M168 150 h20 M166 158 h24" stroke="#7E879C" stroke-width="2"/>`,
    brush: `<path d="M150 206 L180 150" stroke="#C98A4B" stroke-width="7"/><path d="M178 154 l8 -14" stroke="#B9C2D6" stroke-width="9"/><path d="M184 142 q8 -16 2 -26 q-12 8 -10 22z" fill="#7B5CD6" ${SW}/>`,
    book: `<g transform="rotate(-12 176 168)"><path d="M150 152 Q164 146 176 154 Q188 146 202 152 L202 186 Q188 180 176 188 Q164 180 150 186 Z" fill="#fff" ${SW}/><path d="M176 154 V188" ${SW}/><path d="M156 160 h14 M156 168 h14 M182 160 h14 M182 168 h14" stroke="#B9A6FF" stroke-width="2"/></g>`,
    sunflower: `<path d="M152 204 Q166 176 174 146" stroke="#4FA04A" stroke-width="5" fill="none"/><path d="M162 178 q-12 -4 -14 -14 q12 0 14 14z" fill="#6CC066"/>${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<ellipse cx="${176 + Math.cos(a) * 14}" cy="${134 + Math.sin(a) * 14}" rx="7" ry="4" transform="rotate(${a * 180 / Math.PI} ${176 + Math.cos(a) * 14} ${134 + Math.sin(a) * 14})" fill="#FFC93C"/>`; }).join('')}<circle cx="176" cy="134" r="9" fill="#7E5332" ${SW}/>`,
    lloupe: `<path d="M150 204 L170 172" stroke="#E0A92A" stroke-width="10"/><circle cx="178" cy="158" r="20" fill="rgba(255,240,180,.55)" stroke="#FFC93C" stroke-width="6"/><circle cx="178" cy="158" r="20" fill="none" stroke="${L}" stroke-width="1.5"/><path d="M170 150 q4 -6 10 -5" stroke="#fff" stroke-width="3" fill="none"/><path d="M196 136 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" fill="#FFF3B0"/>`,
  });
  const NEW = [
    ['witch', 'head', 'Шляпа волшебницы', '🧙', 70], ['cap', 'head', 'Кепка', '🧢', 35], ['tiara', 'head', 'Диадема', '👸', 85], ['cowboy', 'head', 'Ковбойская шляпа', '🤠', 60],
    ['bunny', 'head', 'Ушки зайки', '🐰', 50], ['unihorn', 'head', 'Рог единорога', '🦄', 0, 9], ['beanie', 'head', 'Шапка с помпоном', '🧶', 40], ['astro', 'head', 'Шлем космонавта', '👩‍🚀', 0, 12], ['halo', 'head', 'Нимб', '😇', 95],
    ['starglass', 'face', 'Очки-звёзды', '🤩', 55], ['hero', 'face', 'Маска супергероя', '🦸', 65], ['goggles', 'face', 'Очки пилота', '🥽', 50], ['stache', 'face', 'Усы детектива', '🥸', 45], ['blush', 'face', 'Румяные щёчки', '☺️', 30],
    ['cape', 'neck', 'Плащ супергероя', '🦸‍♀️', 90], ['pearls', 'neck', 'Жемчужные бусы', '📿', 75], ['tie', 'neck', 'Галстук', '👔', 35], ['lei', 'neck', 'Гавайские цветы', '🌺', 45], ['bandana', 'neck', 'Бандана', '🟨', 30],
    ['umbrella', 'hand', 'Зонтик', '☂️', 40], ['balloon', 'hand', 'Воздушный шарик', '🎈', 25], ['icecream', 'hand', 'Мороженое', '🍦', 30], ['mic', 'hand', 'Микрофон', '🎤', 55], ['brush', 'hand', 'Кисточка художника', '🖌️', 35], ['book', 'hand', 'Книжка', '📘', 30], ['sunflower', 'hand', 'Подсолнух', '🌻', 35],
  ].map(([id, slot, name, icon, price, gems]) => ({ id, slot, name, icon, price, ...(gems ? { gems } : {}) }));
  const LEGEND_ITEMS = [
    { id: 'lloupe', slot: 'hand', name: 'Золотая лупа легенды', icon: '🔎', price: 0, legend: 1 },
    { id: 'lcape', slot: 'neck', name: 'Плащ легенды', icon: '🦸', price: 0, legend: 2 },
    { id: 'lcrown', slot: 'head', name: 'Корона легенды', icon: '👑', price: 0, legend: 3 },
    { id: 'lglasses', slot: 'face', name: 'Очки звезды', icon: '😎', price: 0, legend: 5 },
    { id: 'lhalo', slot: 'head', name: 'Звёздный нимб', icon: '✨', price: 0, legend: 7 },
  ];
  NEW.concat(LEGEND_ITEMS).forEach(it => { if (!ITEMS.some(x => x.id === it.id)) ITEMS.push(it); });

  if (typeof FSIZE !== 'undefined') Object.assign(FSIZE, { fx_skates: 12, fx_flake: 12, fx_mixer: 18, fx_belt: 26, fx_tscope: 22, fx_starmap: 22, fx_throne: 22, fx_banner: 14, fx_cup: 16, fx_stars: 24,
    wallshelf: 18, table: 16, dresser: 18, sofa2: 26, armchair: 16, chandelier: 14, fireplace: 22, aquarium2: 20, piggy: 9, owl: 8, hedgehog: 8, panda: 14, dino: 14, racecar: 12, lego: 18, console: 11, swing: 20, macatower: 10, waffles: 9, cottoncandy: 10, pancakes2: 9, bigcake: 14, chocoriver: 16,
    skis: 14, sled: 14, snowglobe: 9, igloo: 24, penguin: 10, scarfrack: 12, surf: 14, shell: 7, crab: 8, lighthouse: 18, harp: 12, violin: 11, sax: 11, disco: 12, detectiveboard: 20, safe2: 14, fingerprint: 10, walkie: 8, telescope2: 18, comet2: 14, galaxy: 12, crystal2: 22, firebird: 16, spellbook: 10, statue: 18, goldcat: 14 });
  /* ================= Легенда: уровни после высшего звания ================= */
  const TOP = 32000;
  const legendAt = n => { let t = TOP; for (let k = 1; k <= n; k++) t += 4000 + 1000 * k; return t; }; // ★1 = 37 000, ★2 = 43 000, ★3 = 50 000…
  function legend(xp = S.xp) { if (xp < TOP) return { lv: 0 }; let n = 0; while (xp >= legendAt(n + 1)) n++; const a = legendAt(n), b = legendAt(n + 1); return { lv: n, from: a, to: b, prog: (xp - a) / (b - a), left: b - xp }; }
  function legendCheck() {
    const g = legend(), seen = S.legendSeen || 0; if (!g.lv || g.lv <= seen) return; S.legendSeen = g.lv;
    LEGEND_ITEMS.filter(it => it.legend <= g.lv && !S.owned.includes(it.id)).forEach(it => S.owned.push(it.id));
    S.gems = (S.gems || 0) + 3; S.gemsTotal = (S.gemsTotal || 0) + 3; S.candies += 30; S.totalCandies += 30; save(); updCandy();
    const gift = LEGEND_ITEMS.find(it => it.legend === g.lv);
    setTimeout(() => { modal(`<div class="m-cat">${myCat({ star: true, paw: true, smile: true })}</div><h2>Легенда сыска ★${g.lv}!</h2><p>Ты уже собрал${/[аяь]$/i.test(S.kid || '') ? 'а' : ''} все звания — а теперь растёшь как <b>легенда</b>! Награда: <b>+3 💎</b> и <b>+30 🍬</b>.</p>${gift ? `<p>🎁 Легендарная вещь: <b>${gift.icon} ${gift.name}</b> — уже в Кондитерской!</p>` : g.lv === 4 ? '<p>🎁 Открыт окрас <b>«Северное сияние»</b> в Салоне окрасов!</p>' : ''}<p class="small">До ★${g.lv + 1} — ещё ${legend().left} ⭐</p><button class="btn pink" data-close>Ура!</button>`); confetti(60); SND.win(); }, 1500);
  }
  const aw = award; award = function () { const r = aw.apply(this, arguments); try { legendCheck(); } catch (e) { console.warn(e); } return r; };
  if (window.Salon && !Salon.list.some(x => x.id === 'aurora')) {
    const f = { grad: ['#7CF5D3', '#7C9CFF', '#C77CFF', '#FF7CC8'], light: '#F4FFFC', ai: '#3D3DB8', fx: 'stars', sw: 'linear-gradient(135deg,#7CF5D3,#7C9CFF,#C77CFF,#FF7CC8)' };
    FURS.aurora = { name: 'Северное сияние', salon: true, ...f };
    Salon.list.push({ id: 'aurora', name: 'Северное сияние', gems: 20, f, cond: 'Достигни уровня «Легенда сыска ★4»', p: () => [Math.min(legend().lv, 4), 4] });
  }

  /* ================= «Заработать»: что нужно и где это сделать ================= */
  const lv = (tp, n) => () => { S.prefs[tp + 'Lv'] = n; S.prefs[tp + 'LvChosen'] = true; S.prefs.guided = S.prefs.guided || {}; S.prefs.guided[tp] = false; save(); go('practice', tp); };
  const grow = () => { const c = window.Coach && Coach.plan(); const g = c && c.grow; if (g && !g.done && Coach.info(g.id)) Coach.info(g.id).go(); else go('home'); };
  const master = () => { const c = window.Coach && Coach.plan(); const m = c && c.master; if (m && !m.done && Coach.info(m.id)) Coach.info(m.id).go(); else { toast('Испытание мастера появится, когда в какой-то теме станет 10+ попыток почти без ошибок. Пока — задание роста!'); grow(); } };
  const reviewGo = () => { const s = Object.keys(window.SUBJECTS || {}).find(id => typeof dueMistakes === 'function' && dueMistakes(id).length); s ? go('aquiz', s + ':*review') : go('academy'); };
  const WAYS = {
    candies: [['🔍', 'Раскрыть новое дело', 'до 3 🍬 за задачу, за уравнения — вдвое больше', () => go('newcase')], ['📦', 'Уравнения в «Решаем вместе»', 'за уравнения — двойные конфеты', () => go('practice', 'eq')], ['🎲', 'Детективные игры', '🍬 за каждый верный ответ', () => go('games')], ['🌱', 'Задание роста от котика', '+6 🍬 и +1 💎', grow], ['🎓', 'Академия сыщика', '🍬 за уроки и тренажёры', () => go('academy')]],
    gems: [['🏔️', 'Сложные задачи без ошибок', '1 💎 за каждую: столбик или уравнения уровня 3–4', () => (S.st.eq.done <= S.st.mul.done ? lv('eq', 3) : lv('mul', 3))()], ['🌱', 'Задание роста', '+1 💎', grow], ['🏆', 'Испытание мастера', '+2 💎', master], ['🎯', 'Тренажёр Академии без ошибок', '+1 💎', () => go('academy')], ['🎭', 'Тренажёр разговора на 3 звезды', '+1 💎', () => go('roleplay')], ['🪐', 'Игры Академии без ошибок', '+1 💎', () => go('subject', 'space')]],
    xp: [['🔍', 'Дела и задачи', 'опыт за каждую задачу', () => go('newcase')], ['📦', 'Уравнения', 'за уравнения опыта больше', () => go('practice', 'eq')], ['🎓', 'Академия', 'опыт за уроки и тренажёры', () => go('academy')]],
  };
  const SHADE_GO = { mint: () => go('lesson', 'mul'), lavender: () => go('lesson', 'eq'), peach: grow, rosegold: grow, sunset: grow, sky: () => go('academy'), neon: () => go('academy'), moon: reviewGo, cotton: master, galaxy: lv('eq', 4), gold: () => go('newcase'), cloud: () => go('newcase'), aurora: () => go('newcase') };
  function earnHTML(rows) { return rows.map((r, i) => `<div class="earn-row"><span class="ei">${r.icon}</span><div class="eb"><b>${r.name}</b><small>${r.sub || ''}</small>${r.prog ? `<span class="bar"><i style="width:${Math.min(100, r.prog[0] / r.prog[1] * 100)}%"></i></span><small>${Math.min(r.prog[0], r.prog[1])} из ${r.prog[1]}</small>` : ''}</div>${r.done ? '<span class="edone">✔</span>' : `<button class="btn sm pink" data-earn="${i}">▶ Заработать</button>`}</div>`).join(''); }
  SCREENS.earn = (arg = 'candies') => {
    const [kind, id, need] = String(arg).split(':'); let title = '', icon = '🎯', rows = [], intro = '';
    const cur = (k) => k === 'gems' ? (S.gems || 0) : k === 'candies' ? S.candies : S.xp;
    const ways = k => WAYS[k].map(w => ({ icon: w[0], name: w[1], sub: w[2], go: w[3] }));
    if (kind === 'shade') {
      const x = Salon.list.find(s => s.id === id); if (!x) return go('earn', 'gems');
      const p = Salon.prog(x); title = 'Окрас «' + x.name + '»'; icon = '✨';
      rows.push({ icon: '🏅', name: x.cond, prog: [p.a, p.b], done: p.ok, go: SHADE_GO[id] || grow });
      rows.push({ icon: '💎', name: `Накопить ${x.gems} 💎`, prog: [S.gems || 0, x.gems], done: (S.gems || 0) >= x.gems, go: () => go('earn', 'gems') });
      intro = 'Сначала выполни достижение — окрас откроется. Потом купи его за кристаллы.';
    } else if (kind === 'item') {
      const it = ITEMS.find(x => x.id === id); if (!it) return go('earn', 'candies');
      title = it.name; icon = it.icon;
      if (it.legend) { const g = legend(); rows.push({ icon: '🌟', name: `Достичь уровня «Легенда сыска ★${it.legend}»`, sub: g.lv ? `сейчас ★${g.lv}, до следующего — ${g.left} ⭐` : 'сначала собери все звания', prog: [Math.min(S.xp, legendAt(it.legend)), legendAt(it.legend)], done: g.lv >= it.legend, go: () => go('newcase') }); }
      else rows.push(it.gems ? { icon: '💎', name: `Накопить ${it.gems} 💎`, prog: [S.gems || 0, it.gems], done: (S.gems || 0) >= it.gems, go: () => go('earn', 'gems') } : { icon: '🍬', name: `Накопить ${it.price} 🍬`, prog: [S.candies, it.price], done: S.candies >= it.price, go: () => go('earn', 'candies') });
    } else if (kind === 'furn' || kind === 'room') {
      const HL = window.Lines, c = kind === 'furn' ? HL.CATALOG.find(x => x[0] === id) : HL.ROOMS.find(r => r.id === id); if (!c) return go('earn', 'candies');
      const needT = kind === 'furn' ? c[4] : c.need, needE = kind === 'furn' ? (typeof itemEq === 'function' ? itemEq(c) : 0) : (c.eq || 0);
      title = kind === 'furn' ? c[2] : 'Комната «' + c.name + '»'; icon = kind === 'furn' ? c[1] : c.icon;
      rows.push({ icon: '✅', name: `Решить ${needT} задач`, sub: 'любые: дела, «Решаем вместе», Ошибки Енота', prog: [solvedTotal(), needT], done: solvedTotal() >= needT, go: () => go('newcase') });
      if (needE) rows.push({ icon: '📦', name: `Решить ${needE} уравнений`, prog: [S.st.eq.done, needE], done: S.st.eq.done >= needE, go: () => go('practice', 'eq') });
      if (kind === 'furn') { const gem = (typeof GEM_FURN !== 'undefined' && GEM_FURN[id]); rows.push(gem ? { icon: '💎', name: `Накопить ${gem} 💎`, prog: [S.gems || 0, gem], done: (S.gems || 0) >= gem, go: () => go('earn', 'gems') } : { icon: '🍬', name: `Накопить ${c[3]} 🍬`, prog: [S.candies, c[3]], done: S.candies >= c[3], go: () => go('earn', 'candies') }); }
    } else {
      const k = WAYS[kind] ? kind : 'candies'; title = { candies: 'Конфеты 🍬', gems: 'Кристаллы 💎', xp: 'Опыт ⭐' }[k]; icon = { candies: '🍬', gems: '💎', xp: '⭐' }[k];
      intro = `У тебя сейчас: <b>${cur(k)}</b> ${icon}.${need ? ` Нужно ещё <b>${Math.max(0, need - cur(k))}</b>.` : ''} Вот где это заработать:`; rows = ways(k);
    }
    if (kind !== 'candies' && kind !== 'gems' && kind !== 'xp' && rows.every(r => r.done)) intro = 'Всё готово — можно забирать! 🎉';
    app.innerHTML = `${topbar('🎯 Как заработать')}<div class="page earn"><div class="earn-head"><span class="big-emoji">${icon}</span><h2>${title}</h2>${intro ? `<p>${intro}</p>` : ''}</div><div class="earn-list">${earnHTML(rows)}</div><p class="small center">Задания котика на главной — самый быстрый путь: за них двойная награда 🐾</p></div>`;
    $$('[data-earn]').forEach(b => b.addEventListener('click', () => { SND.tap(); rows[+b.dataset.earn].go(); }));
  };
  const earnModal = (text, target) => { const m = modal(`<div class="big-emoji">🎯</div><h2>Пока не хватает</h2><p>${text}</p><div class="row-btns"><button class="btn pink" id="earnGo">▶ Заработать</button><button class="btn" data-close>Позже</button></div>`); $('#earnGo', m.el).addEventListener('click', () => { m.close(); go('earn', target); }); };
  /* перехватываем клик по недоступному в Кондитерской — вместо «не хватает» предлагаем «Заработать» */
  function guardShop() {
    const si = $('#si', app); if (!si || si.dataset.earnGuard) return; si.dataset.earnGuard = 1;
    si.addEventListener('click', e => {
      const b = e.target.closest('[data-id], [data-sh], [data-f].item'); if (!b) return;
      if (b.dataset.id) { const it = ITEMS.find(x => x.id === b.dataset.id); if (!it || S.owned.includes(it.id)) return;
        if (it.legend && legend().lv < it.legend) { e.stopImmediatePropagation(); earnModal(`<b>${it.icon} ${it.name}</b> — легендарная вещь. Она откроется на уровне «Легенда сыска ★${it.legend}».`, 'item:' + it.id); return; }
        if (it.gems ? (S.gems || 0) < it.gems : S.candies < it.price) { e.stopImmediatePropagation(); earnModal(`Для <b>${it.icon} ${it.name}</b> нужно ${it.gems ? it.gems + ' 💎' : it.price + ' 🍬'}, у тебя ${it.gems ? (S.gems || 0) + ' 💎' : S.candies + ' 🍬'}.`, it.gems ? `gems::${it.gems}` : `candies::${it.price}`); } return; }
      if (b.dataset.sh) { const x = Salon.list.find(s => s.id === b.dataset.sh); if (!x || (S.furs || []).includes(x.id)) return; const p = Salon.prog(x);
        if (!p.ok || (S.gems || 0) < x.gems) { e.stopImmediatePropagation(); earnModal(`Окрас <b>«${x.name}»</b>: ${p.ok ? `открыт! Нужно ${x.gems} 💎, у тебя ${S.gems || 0}.` : `${x.cond} (сейчас ${p.a} из ${p.b}), потом — ${x.gems} 💎.`}`, 'shade:' + x.id); } return; }
      if (b.dataset.f) { const c = window.Lines.CATALOG.find(x => x[0] === b.dataset.f); if (!c || (S.furn || []).includes(c[0])) return; const gem = typeof GEM_FURN !== 'undefined' && GEM_FURN[c[0]];
        const locked = !(typeof itemOpen === 'function' ? itemOpen(c) : true), poor = gem ? (S.gems || 0) < gem : S.candies < c[3];
        if (locked || poor) { e.stopImmediatePropagation(); earnModal(locked ? `<b>${c[1]} ${c[2]}</b> откроется, когда решишь больше задач${typeof itemEq === 'function' && itemEq(c) ? ' и уравнений' : ''}.` : `Для <b>${c[1]} ${c[2]}</b> нужно ${gem ? gem + ' 💎' : c[3] + ' 🍬'}.`, 'furn:' + c[0]); } }
    }, true);
  }
  function collection() {
    const owned = ITEMS.filter(x => S.owned.includes(x.id)).length, furn = window.Lines.CATALOG.filter(c => (S.furn || []).includes(c[0])).length, furs = Object.keys(FURS).filter(k => !FURS[k].salon || (S.furs || []).includes(k)).length;
    return `<div class="collect"><span>👗 <b>${owned}</b>/${ITEMS.length}</span><span>🏠 <b>${furn}</b>/${window.Lines.CATALOG.length}</span><span>🎨 <b>${furs}</b>/${Object.keys(FURS).length}</span><button class="btn sm" data-go="earn" data-arg="candies">🎯 Заработать</button></div>`;
  }
  { const sh = SCREENS.shop; SCREENS.shop = arg => { sh(arg); guardShop(); const pg = $('.page.shop', app); if (pg && !$('.collect', app)) pg.insertAdjacentHTML('beforebegin', `<div class="page collect-wrap">${collection()}</div>`);
    const mark = () => { $$('#si .item[data-id]').forEach(b => { const it = ITEMS.find(x => x.id === b.dataset.id); if (it && it.legend && !S.owned.includes(it.id)) { b.classList.add('legend'); const ip = $('.ip', b); if (ip) ip.textContent = '🌟 ★' + it.legend; } }); };
    mark(); const si = $('#si', app); if (si && window.MutationObserver) { const mo = new MutationObserver(mark); mo.observe(si, { childList: true }); cleanups.push(() => mo.disconnect()); } }; }
  { const hs = SCREENS.house; SCREENS.house = arg => { hs(arg); const add = () => { const lk = $('.room-lock', app); if (lk && !$('.earn-room', lk)) { const tab = $('.rtab.on', app); if (tab) lk.insertAdjacentHTML('beforeend', `<button class="btn pink sm earn-room" data-go="earn" data-arg="room:${tab.dataset.r}">▶ Заработать</button>`); } }; add(); const r = $('#room', app); if (r && window.MutationObserver) { const mo = new MutationObserver(add); mo.observe(r, { childList: true }); cleanups.push(() => mo.disconnect()); } }; }
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); try { const g = legend(); if (g.lv >= 0 && S.xp >= TOP) { const rk = $('.hero-info .rank', app), bar = $('.hero-info .bar i', app), sm = rk && rk.parentElement.querySelectorAll('.small')[1]; if (rk) rk.innerHTML = `🌟 Легенда сыска${g.lv ? ' ★' + g.lv : ''} <span class="xpn">⭐ ${S.xp} опыта${S.cloudAt ? ' · ☁️ сохранено' : ''}</span>`; if (bar) bar.style.width = Math.round(g.prog * 100) + '%'; if (sm) sm.textContent = `До «Легенды ★${g.lv + 1}» — ещё ${g.left} ⭐`; } legendCheck(); } catch (e) { console.warn(e); } return r; }; }

  /* ================= смена имени ребёнка и котика ================= */
  function openNames() {
    const m = modal(`<h2>✏️ Имена</h2><label class="lbl">Как тебя зовут?</label><input id="nkid" class="nmi" maxlength="20" value="${esc(S.kid || '')}" autocomplete="off"><label class="lbl">Как зовут котика?</label><input id="ncat" class="nmi" maxlength="20" value="${esc(S.name || '')}" autocomplete="off"><div class="row-btns"><button class="btn pink" id="nsave">Сохранить</button><button class="btn" data-close>Отмена</button></div>`);
    $('#nsave', m.el).addEventListener('click', () => {
      const clean = v => v.replace(/[<>{}"]/g, '').trim().slice(0, 20); const k = clean($('#nkid', m.el).value), c = clean($('#ncat', m.el).value);
      if (k.length < 2 || c.length < 2) { toast('Имя — хотя бы 2 буквы'); return; }
      S.kid = k[0].toUpperCase() + k.slice(1); S.name = c[0].toUpperCase() + c.slice(1); save(); cloudDirty = true; cloudPush(); m.close(); SND.win();
      toast(`<span class="tb">✏️</span><div>Приятно познакомиться заново, <b>${esc(S.kid)}</b>! Я — <b>${esc(S.name)}</b> 😺</div>`); if (curScreen === 'home') go('home');
    });
  }
  if (typeof openSettings === 'function') {
    const os = openSettings;
    openSettings = function () { const r = os.apply(this, arguments); const L = $$('.modal .set-list').pop(); if (L && !$('#set-names', L)) { L.insertAdjacentHTML('beforeend', '<button class="set-row" id="set-names"><span>✏️</span><b>Имя и имя котика</b><i class="arr">›</i></button>'); $('#set-names', L).addEventListener('click', () => { $$('.modal').forEach(x => x.remove()); openNames(); }); } return r; };
  }
  ['earn'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { legend, legendAt, openNames, NEW, LEGEND_ITEMS };
})();
window.Wardrobe = Wardrobe;
