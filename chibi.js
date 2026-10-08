/* chibi.js — милые персонажи-подозреваемые в стиле японской анимации (SVG):
   большие блестящие глаза, румянец, у каждого свои уши, окрас и мимика (обычный, говорит, рад, грустит, возмущён). */
(function (root) {
'use strict';
const L = '#3B2A4A';
// вид: цвет, светлая часть, глаза, уши, особенности
const SP = {
  'Енот Тимоша': { c: '#9AA0AA', l: '#EDEFF2', eye: '#5B3A29', ears: 'round', mask: '#4A4A58' },
  'Лиса Алиса': { c: '#F28C38', l: '#FFF3E6', eye: '#3B6E2E', ears: 'fox', cheeks: '#FFF3E6', f: 1 },
  'Мышка Пискля': { c: '#C9C3CF', l: '#F5F0F7', eye: '#3B2A4A', ears: 'mouse', f: 1 },
  'Пёс Барбос': { c: '#D9A86C', l: '#FFF1DC', eye: '#4A2E1C', ears: 'dog', spot: '#B07C45' },
  'Сова Соня': { c: '#A07A5A', l: '#F3E3CF', eye: '#E0A100', ears: 'tuft', owl: 1, f: 1 },
  'Хомяк Хрум': { c: '#F0B76A', l: '#FFF6E6', eye: '#3B2A4A', ears: 'small', puff: 1 },
  'Кролик Пушок': { c: '#F7F2EE', l: '#FFFFFF', eye: '#C2185B', ears: 'bunny' },
  'Белка Шустрик': { c: '#D2733A', l: '#FFE9D2', eye: '#3B2A4A', ears: 'tufted', tail: 1 },
  'Мишка Топтыжка': { c: '#9C6B45', l: '#E9C9A3', eye: '#3B2A4A', ears: 'round', muzzle: 1 },
  'Свинка Хрюша': { c: '#FFB6C8', l: '#FFD9E3', eye: '#3B2A4A', ears: 'pig', snout: 1, f: 1 },
  'Лягушонок Квак': { c: '#7FD36E', l: '#D8F5C8', eye: '#3B2A4A', ears: 'frog' },
  'Пингвин Пинг': { c: '#3E4A63', l: '#FFFFFF', eye: '#3B2A4A', ears: 'none', peng: 1 },
  'Ёжик Колючка': { c: '#B58A64', l: '#FBE8D3', eye: '#3B2A4A', ears: 'small', spikes: '#6E4B33' },
  'Панда Бао': { c: '#FFFFFF', l: '#FFFFFF', eye: '#3B2A4A', ears: 'round', earC: '#3B3B48', panda: 1 },
  'Тигрёнок Полосатик': { c: '#F6A23A', l: '#FFF3E0', eye: '#2F6B3A', ears: 'cat', stripes: '#3B2A4A' },
  'Коала Эвкалиптик': { c: '#A9B1BC', l: '#E8ECF1', eye: '#3B2A4A', ears: 'koala', nose: 1 },
  'Обезьянка Чичи': { c: '#A86A44', l: '#F4D3B0', eye: '#3B2A4A', ears: 'monkey', face: 1, f: 1 },
  'Львёнок Лёва': { c: '#F2C14E', l: '#FFF2C8', eye: '#6B3E12', ears: 'round', mane: '#D9822B' },
  'Бурёнка Мила': { c: '#FFFFFF', l: '#FFD9E3', eye: '#3B2A4A', ears: 'cow', spots: '#3B3B48', snout: 1, f: 1 },
  'Волчонок Вуди': { c: '#8F98A6', l: '#EEF0F4', eye: '#3A7BD5', ears: 'wolf', cheeks: '#EEF0F4' },
  'Единорожка Искорка': { c: '#FFFFFF', l: '#FFF0FA', eye: '#8E5BD6', ears: 'cat', horn: 1, rmane: 1, f: 1 },
  'Дракоша Пыхалка': { c: '#7FC4B8', l: '#E6FAF5', eye: '#C2410C', ears: 'dragon' },
  'Жирафик Тянучка': { c: '#F4C35A', l: '#FFF2CC', eye: '#3B2A4A', ears: 'giraffe', gspots: '#C97A2A' },
  'Осьминожка Лапочка': { c: '#FF8FB1', l: '#FFD3E1', eye: '#3B2A4A', ears: 'none', tent: 1, f: 1 },
  'Попугай Кеша': { c: '#4CC27E', l: '#FFF6C8', eye: '#3B2A4A', ears: 'none', parrot: 1 },
  'Крокодильчик Тото': { c: '#5FB45A', l: '#DFF5C8', eye: '#C49A00', ears: 'none', croc: 1 },
};
let uid = 0;
function ears(s) {
  const c = s.c, e = s.earC || c, o = `stroke="${L}" stroke-width="2.4"`, pink = '#FFB3C7';
  switch (s.ears) {
    case 'cat': return `<path d="M26 40 L30 8 L52 26 Z" fill="${e}" ${o}/><path d="M94 40 L90 8 L68 26 Z" fill="${e}" ${o}/><path d="M32 34 L34 16 L46 27Z M88 34 L86 16 L74 27Z" fill="${pink}"/>`;
    case 'fox': return `<path d="M24 44 L24 4 L54 26 Z" fill="${e}" ${o}/><path d="M96 44 L96 4 L66 26 Z" fill="${e}" ${o}/><path d="M30 34 L30 14 L46 27Z M90 34 L90 14 L74 27Z" fill="#3B2A4A" opacity=".8"/>`;
    case 'wolf': return `<path d="M24 40 L28 6 L52 26 Z" fill="${e}" ${o}/><path d="M96 40 L92 6 L68 26 Z" fill="${e}" ${o}/><path d="M31 33 L33 15 L46 27Z M89 33 L87 15 L74 27Z" fill="#E7EAF0"/>`;
    case 'round': return `<circle cx="26" cy="24" r="14" fill="${e}" ${o}/><circle cx="94" cy="24" r="14" fill="${e}" ${o}/><circle cx="26" cy="24" r="7" fill="${s.panda ? '#55556A' : pink}" opacity=".7"/><circle cx="94" cy="24" r="7" fill="${s.panda ? '#55556A' : pink}" opacity=".7"/>`;
    case 'mouse': return `<circle cx="20" cy="26" r="20" fill="${c}" ${o}/><circle cx="100" cy="26" r="20" fill="${c}" ${o}/><circle cx="20" cy="26" r="12" fill="${pink}"/><circle cx="100" cy="26" r="12" fill="${pink}"/>`;
    case 'small': return `<circle cx="30" cy="24" r="9" fill="${e}" ${o}/><circle cx="90" cy="24" r="9" fill="${e}" ${o}/><circle cx="30" cy="24" r="4" fill="${pink}"/><circle cx="90" cy="24" r="4" fill="${pink}"/>`;
    case 'bunny': return `<ellipse cx="42" cy="0" rx="10" ry="30" fill="${c}" ${o} transform="rotate(-10 42 0)"/><ellipse cx="78" cy="0" rx="10" ry="30" fill="${c}" ${o} transform="rotate(10 78 0)"/><ellipse cx="42" cy="2" rx="5" ry="22" fill="${pink}" transform="rotate(-10 42 0)"/><ellipse cx="78" cy="2" rx="5" ry="22" fill="${pink}" transform="rotate(10 78 0)"/>`;
    case 'dog': return `<path d="M26 30 Q6 34 12 70 Q24 72 32 50 Z" fill="${s.spot}" ${o}/><path d="M94 30 Q114 34 108 70 Q96 72 88 50 Z" fill="${s.spot}" ${o}/>`;
    case 'pig': return `<path d="M28 34 L24 10 L48 22 Z" fill="${c}" ${o}/><path d="M92 34 L96 10 L72 22 Z" fill="${c}" ${o}/>`;
    case 'tuft': return `<path d="M26 34 L22 8 L44 24 Z" fill="${c}" ${o}/><path d="M94 34 L98 8 L76 24 Z" fill="${c}" ${o}/>`;
    case 'tufted': return `<path d="M28 36 L30 8 L48 24 Z" fill="${c}" ${o}/><path d="M92 36 L90 8 L72 24 Z" fill="${c}" ${o}/><path d="M30 8 l-4 -8 M30 8 l4 -8 M90 8 l-4 -8 M90 8 l4 -8" stroke="${c}" stroke-width="3"/>`;
    case 'koala': return `<circle cx="18" cy="34" r="20" fill="${c}" ${o}/><circle cx="102" cy="34" r="20" fill="${c}" ${o}/><circle cx="18" cy="34" r="11" fill="#F5F5F7"/><circle cx="102" cy="34" r="11" fill="#F5F5F7"/>`;
    case 'monkey': return `<circle cx="16" cy="56" r="14" fill="${c}" ${o}/><circle cx="104" cy="56" r="14" fill="${c}" ${o}/><circle cx="16" cy="56" r="8" fill="${s.l}"/><circle cx="104" cy="56" r="8" fill="${s.l}"/>`;
    case 'cow': return `<path d="M36 22 q-4 -16 6 -18 q2 10 2 18z M84 22 q4 -16 -6 -18 q-2 10 -2 18z" fill="#F7E6B5" ${o}/><ellipse cx="16" cy="40" rx="14" ry="8" fill="${c}" ${o} transform="rotate(-20 16 40)"/><ellipse cx="104" cy="40" rx="14" ry="8" fill="${c}" ${o} transform="rotate(20 104 40)"/>`;
    case 'giraffe': return `<path d="M44 20 v-14 M76 20 v-14" stroke="${s.gspots}" stroke-width="5"/><circle cx="44" cy="5" r="5" fill="${s.gspots}" ${o}/><circle cx="76" cy="5" r="5" fill="${s.gspots}" ${o}/><ellipse cx="20" cy="36" rx="12" ry="7" fill="${c}" ${o} transform="rotate(-25 20 36)"/><ellipse cx="100" cy="36" rx="12" ry="7" fill="${c}" ${o} transform="rotate(25 100 36)"/>`;
    case 'dragon': return `<path d="M38 22 L32 0 L48 18 Z M82 22 L88 0 L72 18 Z" fill="#FFD27A" ${o}/><path d="M20 50 L4 40 L18 62 Z M100 50 L116 40 L102 62 Z" fill="${c}" ${o}/>`;
    case 'frog': return `<circle cx="36" cy="26" r="16" fill="${c}" ${o}/><circle cx="84" cy="26" r="16" fill="${c}" ${o}/>`;
    default: return '';
  }
}
function chibiSVG(name, o = {}) {
  const s = SP[name] || SP['Енот Тимоша'], id = 'ch' + (++uid), mood = o.mood || 'idle';
  const ol = `stroke="${L}" stroke-width="2.4"`;
  let g = `<svg viewBox="-8 -22 136 160" class="chibi" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">`;
  // хвосты/грива/иголки — позади
  if (s.tail) g += `<path d="M86 124 C126 120 124 70 100 64 C116 84 104 104 86 108Z" fill="${s.c}" ${ol}/>`;
  if (s.mane) g += `<circle cx="60" cy="58" r="52" fill="${s.mane}" ${ol}/>`;
  if (s.spikes) g += `<path d="M14 64 L2 50 L18 44 L8 26 L28 26 L26 6 L44 16 L50 -2 L60 12 L70 -2 L76 16 L94 6 L92 26 L112 26 L102 44 L118 50 L106 64Z" fill="${s.spikes}" ${ol}/>`;
  if (s.rmane) g += `<path d="M30 26 Q12 50 22 86 Q34 70 34 50 Z" fill="#B9A6FF" ${ol}/><path d="M28 40 Q14 64 26 96 Q36 80 36 62Z" fill="#FFB3D1" ${ol}/>`;
  // тело
  g += `<ellipse cx="60" cy="118" rx="27" ry="19" fill="${s.c}" ${ol}/><ellipse cx="60" cy="122" rx="16" ry="12" fill="${s.l}"/>`;
  if (s.tent) g += `<path d="M34 120 q-8 14 2 16 M48 124 q-4 14 6 13 M72 124 q4 14 -6 13 M86 120 q8 14 -2 16" fill="none" stroke="${s.c}" stroke-width="9"/>`;
  // шарф
  if (o.scarf) g += `<path d="M30 96 Q60 112 90 96 L90 106 Q60 122 30 106 Z" fill="${o.scarf}" ${ol}/><path d="M74 108 L82 128 L70 130 L66 110Z" fill="${o.scarf}" ${ol}/>`;
  // уши и голова
  g += `<g class="ch-head">` + ears(s);
  const headFill = s.peng ? s.c : s.c;
  g += `<ellipse cx="60" cy="58" rx="${s.croc ? 46 : 42}" ry="40" fill="${headFill}" ${ol}/>`;
  if (s.horn) g += `<path d="M54 22 L60 -12 L66 22 Z" fill="#FFE27A" ${ol}/><path d="M56 12 l8 -3 M57 4 l6 -2" stroke="#E0A100" stroke-width="1.6"/>`;
  if (s.parrot) g += `<path d="M50 20 Q56 -6 64 18 Q72 -4 74 22" fill="#FF6B6B" ${ol}/>`;
  // окрас мордочки
  if (s.peng) g += `<path d="M24 64 Q24 34 60 40 Q96 34 96 64 Q96 92 60 96 Q24 92 24 64Z" fill="#fff"/>`;
  if (s.owl) g += `<circle cx="44" cy="60" r="16" fill="${s.l}"/><circle cx="76" cy="60" r="16" fill="${s.l}"/>`;
  if (s.face) g += `<path d="M30 60 Q30 40 46 44 Q60 36 74 44 Q90 40 90 60 Q90 90 60 92 Q30 90 30 60Z" fill="${s.l}"/>`;
  if (s.cheeks) g += `<path d="M22 70 Q34 92 60 86 Q86 92 98 70 Q86 80 60 76 Q34 80 22 70Z" fill="${s.cheeks}"/>`;
  if (s.mask) g += `<path d="M20 62 Q30 48 48 56 Q60 60 72 56 Q90 48 100 62 Q90 72 74 68 Q60 66 46 68 Q30 72 20 62Z" fill="${s.mask}"/>`;
  if (s.panda) g += `<ellipse cx="43" cy="62" rx="13" ry="15" fill="#3B3B48" transform="rotate(-20 43 62)"/><ellipse cx="77" cy="62" rx="13" ry="15" fill="#3B3B48" transform="rotate(20 77 62)"/>`;
  if (s.stripes) g += `<path d="M60 20 v12 M48 22 l3 10 M72 22 l-3 10 M20 56 h10 M100 56 h-10 M22 66 h8 M98 66 h-8" stroke="${s.stripes}" stroke-width="3.5"/>`;
  if (s.spots) g += `<path d="M28 44 q10 -8 16 4 q-6 10 -16 -4z M84 36 q12 0 10 12 q-10 2 -10 -12z" fill="${s.spots}"/>`;
  if (s.gspots) g += `<circle cx="34" cy="44" r="5" fill="${s.gspots}"/><circle cx="86" cy="42" r="6" fill="${s.gspots}"/><circle cx="92" cy="60" r="4" fill="${s.gspots}"/>`;
  if (s.muzzle || s.croc) g += `<ellipse cx="60" cy="80" rx="${s.croc ? 30 : 18}" ry="${s.croc ? 14 : 12}" fill="${s.l}"/>`;
  if (s.puff) g += `<ellipse cx="28" cy="80" rx="12" ry="9" fill="${s.l}"/><ellipse cx="92" cy="80" rx="12" ry="9" fill="${s.l}"/>`;
  if (s.rmane) g += `<path d="M44 24 Q60 10 76 24 Q66 22 60 30 Q54 22 44 24Z" fill="#FFB3D1" ${ol}/>`;
  // глаза (аниме: большие, с бликами)
  const ey = s.peng ? 60 : 62;
  if (mood === 'happy') g += `<path d="M34 ${ey} q10 -12 20 0 M66 ${ey} q10 -12 20 0" fill="none" stroke="${L}" stroke-width="4"/>`;
  else {
    g += `<g class="ch-eyes">`;
    [[44, ey], [76, ey]].forEach(([x, y]) => {
      g += `<ellipse cx="${x}" cy="${y}" rx="10" ry="12.5" fill="#fff" ${ol}/><ellipse cx="${x}" cy="${y + 1.5}" rx="8" ry="10.5" fill="${s.eye}"/><ellipse cx="${x}" cy="${y + 3}" rx="4.5" ry="6" fill="#1E1428"/><ellipse cx="${x - 3}" cy="${y - 4}" rx="3.6" ry="4.4" fill="#fff"/><circle cx="${x + 3.5}" cy="${y + 6}" r="1.8" fill="#fff"/>`;
      if (s.f) g += `<path d="M${x - 10} ${y - 9} l-4 -4 M${x + 10} ${y - 9} l4 -4" stroke="${L}" stroke-width="2.2"/>`;
    });
    g += `</g>`;
  }
  if (mood === 'angry') g += `<path d="M32 44 L54 50 M88 44 L66 50" stroke="${L}" stroke-width="4"/><g class="ch-vein" transform="translate(96 22)"><path d="M-8 -2 q4 -4 8 0 M2 -8 q4 4 0 8 M8 2 q-4 4 -8 0 M-2 8 q-4 -4 0 -8" stroke="#E6455A" stroke-width="3.5" fill="none"/></g>`;
  if (mood === 'sad') g += `<path d="M34 46 L52 42 M86 46 L68 42" stroke="${L}" stroke-width="3.5"/><path d="M40 76 q-2 8 2 12" stroke="#7CC4FF" stroke-width="4" fill="none"/>`;
  // румянец
  g += `<ellipse cx="30" cy="78" rx="8" ry="5" fill="#FF7FA6" opacity="${mood === 'angry' ? 0.75 : 0.45}"/><ellipse cx="90" cy="78" rx="8" ry="5" fill="#FF7FA6" opacity="${mood === 'angry' ? 0.75 : 0.45}"/>`;
  // нос/рот
  if (s.parrot) g += `<path d="M52 74 Q60 64 68 74 Q64 90 60 92 Q56 90 52 74Z" fill="#FFB938" ${ol}/>`;
  else if (s.owl) g += `<path d="M55 74 L60 84 L65 74 Z" fill="#FFB938" ${ol}/>`;
  else if (s.snout) g += `<ellipse cx="60" cy="80" rx="12" ry="8" fill="${s.l === '#FFFFFF' ? '#FFD9E3' : '#FF9DBB'}" ${ol}/><circle cx="56" cy="80" r="2" fill="${L}"/><circle cx="64" cy="80" r="2" fill="${L}"/>`;
  else if (s.nose) g += `<ellipse cx="60" cy="76" rx="8" ry="10" fill="#3B3B48"/>`;
  else if (s.croc) g += `<circle cx="52" cy="76" r="2" fill="${L}"/><circle cx="68" cy="76" r="2" fill="${L}"/><path d="M44 86 l3 4 3 -4 3 4 3 -4 3 4 3 -4 3 4 3 -4 3 4 3 -4" fill="none" stroke="#fff" stroke-width="2"/>`;
  else g += `<path d="M56 74 h8 l-4 4z" fill="#FF7A9C" stroke="${L}" stroke-width="1.8"/>`;
  const my = s.croc ? 92 : 84;
  if (mood === 'angry') g += `<path d="M52 ${my + 4} q8 -6 16 0" fill="none" stroke="${L}" stroke-width="3"/>`;
  else if (mood === 'sad') g += `<path d="M53 ${my + 3} q7 -5 14 0" fill="none" stroke="${L}" stroke-width="3"/>`;
  else if (mood === 'happy') g += `<path d="M52 ${my - 2} q8 12 16 0z" fill="#FF7A9C" stroke="${L}" stroke-width="2.2"/>`;
  else g += `<g class="ch-m-closed"><path d="M60 ${my - 6} q-5 6 -10 2 M60 ${my - 6} q5 6 10 2" fill="none" stroke="${L}" stroke-width="2.6"/></g><g class="ch-m-open"><ellipse cx="60" cy="${my}" rx="6" ry="5" fill="#8A2E55" stroke="${L}" stroke-width="2"/></g>`;
  g += `</g>`;
  // шляпа и вещь (эмодзи как аксессуары)
  if (o.hat) g += `<text x="60" y="${s.ears === 'bunny' ? 2 : 18}" font-size="40" text-anchor="middle" transform="rotate(-8 60 10)">${o.hat}</text>`;
  if (o.item) g += `<text x="104" y="132" font-size="28" text-anchor="middle">${o.item}</text>`;
  return g + '</svg>';
}
root.Chibi = { chibiSVG, has: n => !!SP[n] };
})(this);
