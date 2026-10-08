/* cat.js — котик-детектив в SVG, окрасы и наряды */
(function (root) {
'use strict';
const FURS = {
  ginger: { name: 'Рыжий', base: '#F6A65A', light: '#FFE3C4', stripe: '#D97F2E', sw: '#F6A65A', ai: '#3F9A4A' },
  grey: { name: 'Серый', base: '#A9B2BD', light: '#EEF0F3', stripe: '#808B97', sw: '#A9B2BD', ai: '#3A7BD5' },
  black: { name: 'Чёрный', base: '#44405A', light: '#6A6582', iris: '#B7E36B', sw: '#44405A' },
  white: { name: 'Белый', base: '#FFFFFF', light: '#FFF2E6', iris: '#7CC4FF', sw: '#FFFFFF' },
  calico: { name: 'Трёхцветный', base: '#FFFFFF', light: '#FFF2E6', p1: '#F6A65A', p2: '#44405A', ai: '#C98A2B', sw: 'linear-gradient(135deg,#F6A65A 33%,#fff 33% 66%,#44405A 66%)' },
  cream: { name: 'Кремовый', base: '#F2D7AE', light: '#FFF6E8', stripe: '#DDB07A', sw: '#F2D7AE', ai: '#8E5BD6' },
};
const L = '#3B2A4A';
const SW = 'stroke="' + L + '" stroke-width="3.5"';

const ACC = {
  /* голова */
  deer: `<path d="M46 64 Q50 14 100 12 Q150 14 154 64 Z" fill="#B07C4F" ${SW}/>
    <path d="M66 22 Q58 40 60 62 M100 12 V62 M134 22 Q142 40 140 62 M50 42 Q100 34 150 42" fill="none" stroke="#7E5332" stroke-width="2.5"/>
    <path d="M36 64 Q100 80 164 64 Q100 52 36 64 Z" fill="#94653E" ${SW}/>
    <circle cx="100" cy="11" r="6" fill="#94653E" ${SW}/>`,
  bow: `<g transform="translate(142 40) rotate(18)"><path d="M0 0 L-24 -14 L-24 14 Z M0 0 L24 -14 L24 14 Z" fill="#FF6F9C" ${SW}/><circle r="7" fill="#FF9DBB" ${SW}/></g>`,
  beret: `<g transform="rotate(-10 100 50)"><ellipse cx="100" cy="50" rx="54" ry="18" fill="#E6455A" ${SW}/><path d="M100 32 v-10" ${SW}/></g>`,
  chef: `<path d="M64 60 Q50 30 72 26 Q78 6 100 12 Q122 4 130 26 Q152 28 136 60 Z" fill="#fff" ${SW}/><rect x="64" y="52" width="72" height="14" rx="4" fill="#FFE3EC" ${SW}/>`,
  tophat: `<rect x="70" y="-6" width="60" height="52" rx="5" fill="#2F2B3A" ${SW}/><rect x="70" y="30" width="60" height="10" fill="#E6455A"/><ellipse cx="100" cy="48" rx="48" ry="9" fill="#2F2B3A" ${SW}/>`,
  crown: `<path d="M62 56 L58 16 L80 36 L100 8 L120 36 L142 16 L138 56 Z" fill="#FFC93C" ${SW}/><circle cx="100" cy="40" r="5" fill="#E6455A"/><circle cx="78" cy="46" r="4" fill="#3D8BFD"/><circle cx="122" cy="46" r="4" fill="#2FB37A"/>`,
  /* лицо */
  glasses: `<circle cx="78" cy="97" r="17" fill="rgba(255,255,255,.25)" ${SW}/><circle cx="122" cy="97" r="17" fill="rgba(255,255,255,.25)" ${SW}/><path d="M95 95 q5 -5 10 0 M61 94 L44 88 M139 94 L156 88" fill="none" ${SW}/>`,
  monocle: `<circle cx="122" cy="97" r="18" fill="rgba(255,255,255,.3)" stroke="#D9A21B" stroke-width="4"/><path d="M138 106 Q150 130 140 150" fill="none" stroke="#D9A21B" stroke-width="2.5"/>`,
  shades: `<path d="M58 88 h38 v10 q-2 14 -19 14 q-17 0 -19 -14 Z M104 88 h38 v10 q-2 14 -19 14 q-17 0 -19 -14 Z" fill="#2F2B3A" ${SW}/><path d="M96 92 h8" ${SW}/><path d="M64 93 l8 0" stroke="#fff" stroke-width="3" opacity=".6"/>`,
  /* шея */
  goldhat: `<path d="M46 64 Q50 14 100 12 Q150 14 154 64 Z" fill="#FFC93C" ${SW}/><path d="M66 22 Q58 40 60 62 M100 12 V62 M134 22 Q142 40 140 62 M50 42 Q100 34 150 42" fill="none" stroke="#D99A1B" stroke-width="2.5"/><path d="M36 64 Q100 80 164 64 Q100 52 36 64 Z" fill="#F2B21B" ${SW}/><circle cx="100" cy="11" r="7" fill="#7CC4FF" ${SW}/><path d="M70 30 l4 -6 4 6 M126 30 l4 -6 4 6" stroke="#fff" stroke-width="2"/>`,
  rainbow: `<defs><linearGradient id="rbw" x1="0" x2="1"><stop offset="0" stop-color="#FF6F9C"/><stop offset=".25" stop-color="#FFC93C"/><stop offset=".5" stop-color="#7FE0C1"/><stop offset=".75" stop-color="#7CC4FF"/><stop offset="1" stop-color="#B9A6FF"/></linearGradient></defs><path d="M48 140 Q100 170 152 140 L152 158 Q100 186 48 158 Z" fill="url(#rbw)" ${SW}/><path d="M118 162 L128 200 L110 204 L104 166 Z" fill="url(#rbw)" ${SW}/>`,
  headph: `<path d="M44 96 Q40 30 100 28 Q160 30 156 96" fill="none" stroke="#7B5CD6" stroke-width="9"/><rect x="30" y="84" width="22" height="34" rx="9" fill="#FF6F9C" ${SW}/><rect x="148" y="84" width="22" height="34" rx="9" fill="#FF6F9C" ${SW}/>`,
  pirate: `<path d="M38 60 Q100 -4 162 60 Q100 44 38 60 Z" fill="#2F2B3A" ${SW}/><path d="M42 60 Q100 46 158 60" fill="none" stroke="#FFC93C" stroke-width="4"/><circle cx="100" cy="36" r="8" fill="#fff"/><path d="M95 33 l3 3 M105 33 l-3 3 M96 41 h8" stroke="#2F2B3A" stroke-width="2"/>`,
  flower: `<g>${[60, 78, 100, 122, 140].map((x, i) => `<circle cx="${x}" cy="${50 - (i % 2) * 6}" r="11" fill="${['#FF8FB1', '#FFC93C', '#7CC4FF', '#B7E36B', '#FF8FB1'][i]}" ${SW}/><circle cx="${x}" cy="${50 - (i % 2) * 6}" r="4" fill="#fff"/>`).join('')}</g>`,
  hearts: `<path d="M78 112 C58 100 60 82 72 82 C78 82 78 88 78 90 C78 88 78 82 84 82 C96 82 98 100 78 112 Z M122 112 C102 100 104 82 116 82 C122 82 122 88 122 90 C122 88 122 82 128 82 C140 82 142 100 122 112 Z" fill="#FF5E92" opacity=".9" ${SW}/><path d="M92 94 h16" ${SW}/>`,
  bell: `<path d="M50 146 Q100 170 150 146" fill="none" stroke="#E6455A" stroke-width="9"/><circle cx="100" cy="166" r="11" fill="#FFC93C" ${SW}/><path d="M92 166 h16" stroke="${L}" stroke-width="2"/><circle cx="100" cy="171" r="2.5" fill="${L}"/>`,
  scarf: `<path d="M48 140 Q100 170 152 140 L152 158 Q100 186 48 158 Z" fill="#E6455A" ${SW}/><path d="M118 162 L128 200 L110 204 L104 166 Z" fill="#E6455A" ${SW}/><path d="M60 150 l0 10 M80 158 l0 12 M140 150 l0 10" stroke="#fff" stroke-width="3" opacity=".7"/>`,
  bowtie: `<path d="M100 156 L76 142 L76 170 Z M100 156 L124 142 L124 170 Z" fill="#7B5CD6" ${SW}/><circle cx="100" cy="156" r="6" fill="#9C84E8" ${SW}/>`,
  medal: `<path d="M86 146 L100 178 L114 146" fill="none" stroke="#3D8BFD" stroke-width="7"/><circle cx="100" cy="184" r="13" fill="#FFC93C" ${SW}/><path d="M100 176 l2.5 5 5.5 .8 -4 3.9 1 5.5 -5 -2.6 -5 2.6 1 -5.5 -4 -3.9 5.5 -.8 Z" fill="#fff"/>`,
};
const HAND = {
  starwand: `<path d="M150 204 L178 156" stroke="#B9A6FF" stroke-width="7"/><path d="M182 132 l6 12 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2 Z" fill="#FFE27A" ${SW}/><circle cx="196" cy="128" r="3" fill="#fff"/><circle cx="168" cy="138" r="2.5" fill="#fff"/>`,
  fish: `<g transform="rotate(-25 172 165)"><ellipse cx="172" cy="165" rx="22" ry="12" fill="#7CC4FF" ${SW}/><path d="M192 165 l14 -10 v20 z" fill="#7CC4FF" ${SW}/><circle cx="160" cy="162" r="2.5" fill="${L}"/></g>`,
  yarn: `<circle cx="174" cy="168" r="18" fill="#FF8FB1" ${SW}/><path d="M160 160 q14 6 28 0 M158 170 q16 8 32 0 M164 180 q10 -14 20 -26" fill="none" stroke="#E0447A" stroke-width="2.5"/><path d="M160 184 q-10 10 -4 22" fill="none" stroke="#FF8FB1" stroke-width="3"/>`,
  loupe: `<path d="M150 204 L170 172" stroke="#8A5A33" stroke-width="9"/><circle cx="178" cy="158" r="19" fill="rgba(180,225,255,.6)" stroke="${L}" stroke-width="4.5"/><path d="M170 150 q4 -6 10 -5" stroke="#fff" stroke-width="3" fill="none"/>`,
  lolly: `<path d="M152 204 L172 160" stroke="#fff" stroke-width="7"/><path d="M152 204 L172 160" stroke="${L}" stroke-width="1.5" opacity=".3"/><circle cx="176" cy="150" r="18" fill="#FF6F9C" ${SW}/><path d="M176 150 m-10 0 a10 10 0 1 0 10 -10 a6 6 0 1 1 -6 6" fill="none" stroke="#fff" stroke-width="3"/>`,
  donut: `<circle cx="172" cy="168" r="20" fill="#E9B072" ${SW}/><path d="M154 162 q8 -16 22 -14 q14 2 16 16 q-4 8 -12 4 q-8 -6 -14 2 q-8 2 -12 -8z" fill="#FF8FB1"/><circle cx="172" cy="168" r="6" fill="#FFF5EA" ${SW}/>`,
  note: `<rect x="156" y="146" width="34" height="42" rx="4" fill="#FFC93C" ${SW} transform="rotate(12 173 167)"/><path d="M163 160 h18 M162 168 h18 M161 176 h12" stroke="${L}" stroke-width="2" transform="rotate(12 173 167)"/>`,
  cake: `<rect x="152" y="160" width="40" height="28" rx="5" fill="#FFE3EC" ${SW}/><path d="M152 170 q10 6 20 0 q10 -6 20 0" fill="none" stroke="#FF6F9C" stroke-width="4"/><path d="M172 160 v-12" stroke="${L}" stroke-width="3"/><path d="M172 146 q-4 -6 0 -10 q4 4 0 10" fill="#FFB938"/>`,
};

function catSVG(o = {}) {
  const f = FURS[o.fur] || FURS.ginger, w = o.wear || {}, happy = o.happy;
  const outline = SW;
  let s = `<svg viewBox="0 -12 210 248" class="cat${o.cls ? ' ' + o.cls : ''}" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">`;
  s += `<g class="tail"><path d="M146 198 C 200 192, 204 128, 174 110" fill="none" stroke="${L}" stroke-width="21"/><path d="M146 198 C 200 192, 204 128, 174 110" fill="none" stroke="${f.p2 || f.base}" stroke-width="14"/></g>`;
  s += `<g class="body"><ellipse cx="100" cy="180" rx="54" ry="44" fill="${f.base}" ${outline}/>`;
  if (f.p1) s += `<circle cx="128" cy="172" r="17" fill="${f.p1}"/><circle cx="70" cy="196" r="11" fill="${f.p2}"/>`;
  s += `<ellipse cx="100" cy="190" rx="31" ry="29" fill="${f.light}"/>`;
  s += `<ellipse cx="76" cy="221" rx="17" ry="9" fill="${f.base}" ${outline}/><ellipse cx="124" cy="221" rx="17" ry="9" fill="${f.base}" ${outline}/>`;
  s += '</g>';
  if (w.neck && ACC[w.neck]) s += ACC[w.neck];
  s += `<g class="head"><g class="ear-l"><path d="M48 80 L54 22 L94 52 Z" fill="${f.p2 || f.base}" ${outline}/><path d="M59 66 L62 37 L84 54 Z" fill="#FFB3C7"/></g>`;
  s += `<g class="ear-r"><path d="M152 80 L146 22 L106 52 Z" fill="${f.p1 || f.base}" ${outline}/><path d="M141 66 L138 37 L116 54 Z" fill="#FFB3C7"/></g>`;
  s += `<ellipse cx="100" cy="98" rx="60" ry="52" fill="${f.base}" ${outline}/>`;
  if (f.p1) s += `<path d="M58 72 Q70 56 88 62 Q86 82 66 84 Z" fill="${f.p2}"/><path d="M118 56 Q138 56 146 76 Q130 82 120 72 Z" fill="${f.p1}"/>`;
  if (f.stripe) s += `<path d="M100 50 v14 M86 52 l3 12 M114 52 l-3 12 M43 96 h10 M157 96 h-10" stroke="${f.stripe}" stroke-width="5"/>`;
  s += `<ellipse cx="100" cy="121" rx="27" ry="18" fill="${f.light}"/>`;
  if (happy) s += `<path d="M67 99 q11 -14 22 0 M111 99 q11 -14 22 0" fill="none" stroke="${L}" stroke-width="5"/>`;
  else if (o.sad) s += `<ellipse cx="78" cy="100" rx="8.5" ry="9" fill="${L}"/><ellipse cx="122" cy="100" rx="8.5" ry="9" fill="${L}"/><circle cx="80.5" cy="96" r="3" fill="#fff"/><circle cx="124.5" cy="96" r="3" fill="#fff"/><path d="M64 84 L88 90 M136 84 L112 90" stroke="${L}" stroke-width="4"/><path d="M84 112 q-3 8 0 12" fill="none" stroke="#7CC4FF" stroke-width="4" opacity=".8"/>`;
  else { // аниме-глаза: крупные, с цветной радужкой, бликами и ресничками
    const iris = f.ai || f.iris || '#3F9A4A';
    s += `<g class="eyes">${[78, 122].map((x, i) => `<ellipse cx="${x}" cy="96" rx="13" ry="16" fill="#fff" stroke="${L}" stroke-width="3"/><ellipse cx="${x}" cy="98" rx="10.5" ry="13.5" fill="${iris}"/><ellipse cx="${x}" cy="101" rx="6" ry="8" fill="#1E1428"/><ellipse cx="${x - 4}" cy="91" rx="4.6" ry="5.6" fill="#fff"/><circle cx="${x + 4.5}" cy="104" r="2.4" fill="#fff"/><path d="M${x + (i ? 11 : -11)} ${84} l${i ? 6 : -6} -5" stroke="${L}" stroke-width="3"/>`).join('')}</g>`;
  }
  s += `<ellipse cx="60" cy="116" rx="10" ry="6" fill="#FF7FA6" opacity=".55"/><ellipse cx="140" cy="116" rx="10" ry="6" fill="#FF7FA6" opacity=".55"/>`;
  s += `<path d="M94 110 h12 l-6 7 z" fill="#FF7A9C" stroke="${L}" stroke-width="2"/>`;
  s += happy ? `<path d="M88 120 q12 16 24 0 z" fill="#FF7A9C" stroke="${L}" stroke-width="2.5"/>` : o.sad ? `<path d="M100 117 v4 M90 128 q10 -8 20 0" fill="none" stroke="${L}" stroke-width="3"/>` : `<path d="M100 117 q-5 8 -12 4 M100 117 q5 8 12 4" fill="none" stroke="${L}" stroke-width="3"/>`;
  s += `<ellipse class="mo" cx="100" cy="125" rx="7" ry="6" fill="#8A2E55" stroke="${L}" stroke-width="2"/>`;
  s += `<path d="M72 118 L42 112 M72 124 L42 129 M128 118 L158 112 M128 124 L158 129" stroke="${L}" stroke-width="2.2" opacity=".65"/>`;
  if (w.face && ACC[w.face]) s += ACC[w.face];
  if (w.head && ACC[w.head]) s += ACC[w.head];
  s += '</g>';
  if (w.hand && HAND[w.hand]) s += `<circle cx="150" cy="204" r="11" fill="${f.base}" ${outline}/>` + HAND[w.hand];
  return s + '</svg>';
}

const ITEMS = [
  { id: 'deer', slot: 'head', name: 'Шапка сыщика', icon: '🕵️', price: 0 },
  { id: 'bow', slot: 'head', name: 'Бантик', icon: '🎀', price: 15 },
  { id: 'beret', slot: 'head', name: 'Берет', icon: '🎨', price: 25 },
  { id: 'chef', slot: 'head', name: 'Колпак кондитера', icon: '👩‍🍳', price: 35 },
  { id: 'tophat', slot: 'head', name: 'Цилиндр', icon: '🎩', price: 45 },
  { id: 'crown', slot: 'head', name: 'Корона', icon: '👑', price: 90 },
  { id: 'goldhat', slot: 'head', name: 'Золотая шапка сыщика', icon: '🏆', price: 0, gems: 10 },
  { id: 'rainbow', slot: 'neck', name: 'Радужный шарф', icon: '🌈', price: 0, gems: 7 },
  { id: 'starwand', slot: 'hand', name: 'Звёздная палочка', icon: '🪄', price: 0, gems: 8 },
  { id: 'flower', slot: 'head', name: 'Венок', icon: '🌸', price: 30 },
  { id: 'headph', slot: 'head', name: 'Наушники', icon: '🎧', price: 40 },
  { id: 'pirate', slot: 'head', name: 'Пиратская шляпа', icon: '🏴‍☠️', price: 55 },
  { id: 'hearts', slot: 'face', name: 'Очки-сердечки', icon: '😍', price: 40 },
  { id: 'bell', slot: 'neck', name: 'Колокольчик', icon: '🔔', price: 30 },
  { id: 'fish', slot: 'hand', name: 'Рыбка', icon: '🐟', price: 25 },
  { id: 'yarn', slot: 'hand', name: 'Клубок', icon: '🧶', price: 20 },
  { id: 'glasses', slot: 'face', name: 'Очки отличника', icon: '👓', price: 20 },
  { id: 'monocle', slot: 'face', name: 'Монокль', icon: '🧐', price: 35 },
  { id: 'shades', slot: 'face', name: 'Тёмные очки', icon: '🕶️', price: 50 },
  { id: 'scarf', slot: 'neck', name: 'Шарф', icon: '🧣', price: 20 },
  { id: 'bowtie', slot: 'neck', name: 'Бабочка', icon: '🦋', price: 25 },
  { id: 'medal', slot: 'neck', name: 'Медаль героя', icon: '🏅', price: 70 },
  { id: 'loupe', slot: 'hand', name: 'Лупа', icon: '🔍', price: 0 },
  { id: 'lolly', slot: 'hand', name: 'Леденец', icon: '🍭', price: 15 },
  { id: 'donut', slot: 'hand', name: 'Пончик', icon: '🍩', price: 20 },
  { id: 'note', slot: 'hand', name: 'Блокнот', icon: '📒', price: 25 },
  { id: 'cake', slot: 'hand', name: 'Тортик', icon: '🎂', price: 60 },
];
const SLOTS = { head: 'На голову', face: 'На мордочку', neck: 'На шею', hand: 'В лапку' };
root.Cat = { FURS, catSVG, ITEMS, SLOTS };
})(this);
