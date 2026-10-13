/* outfits.js (v29) — ещё 31 наряд и украшение в том же SVG-стиле, что и cat.js: шапки, очки, шарфы, крылья, плащи,
   вещи в лапку и сезонные (Новый год, добрый Хэллоуин, весна). Часть — за конфеты/кристаллы, часть — за достижения
   (выдаются сами, а в Кондитерской показан прогресс и кнопка «Заработать»). Старые наряды и сохранения не меняются. */
'use strict';
const Outfits = (() => {
  const L = '#3B2A4A', SW = `stroke="${L}" stroke-width="3.5"`, SW2 = `stroke="${L}" stroke-width="2.5"`;
  const mx = x => 200 - x; // зеркально относительно середины мордочки
  const mirror = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${mx(+x)} ${y}`);
  /* обводка в стиле котика: толстая тёмная линия + цветная поверх */
  const line = (d, c, w = 6) => `<path d="${d}" fill="none" stroke="${L}" stroke-width="${w + 4}"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
  const star = (x, y, r, fill, extra = '') => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p.push((x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1)); } return `<path d="M${p.join(' L')} Z" fill="${fill}" ${extra}/>`; };
  const flower = (x, y, r, c, mid = '#FFE27A') => Array.from({ length: 5 }, (_, i) => { const a = i / 5 * Math.PI * 2 - Math.PI / 2; return `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.75).toFixed(1)}" fill="${c}" ${SW2}/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="${(r * 0.55).toFixed(1)}" fill="${mid}" ${SW2}/>`;
  const qpt = (p0, p1, p2, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
  const heart = (x, y, s, fill) => `<path d="M${x} ${y + 12 * s} C${x - 18 * s} ${y} ${x - 14 * s} ${y - 14 * s} ${x - 6 * s} ${y - 14 * s} C${x - 2 * s} ${y - 14 * s} ${x} ${y - 10 * s} ${x} ${y - 8 * s} C${x} ${y - 10 * s} ${x + 2 * s} ${y - 14 * s} ${x + 6 * s} ${y - 14 * s} C${x + 14 * s} ${y - 14 * s} ${x + 18 * s} ${y} ${x} ${y + 12 * s} Z" fill="${fill}" ${SW2}/>`;

  /* ================= голова ================= */
  const antler = `M72 50 Q64 30 58 10 M64 32 Q52 28 44 18 M60 20 Q68 12 74 6`;
  const HEAD = {
    santa: `<path d="M56 60 Q64 18 110 14 Q146 14 162 38 L150 46 Q136 34 122 36 Q142 48 144 60 Z" fill="#E6455A" ${SW}/><path d="M70 30 Q90 22 104 22" stroke="#fff" stroke-width="3" opacity=".45" fill="none"/><rect x="46" y="52" width="108" height="16" rx="8" fill="#fff" ${SW}/><circle cx="160" cy="42" r="10" fill="#fff" ${SW}/>`,
    antlers: `${line('M50 70 Q100 30 150 70', '#E6455A', 5)}${line(antler, '#B07C4F', 6)}${line(mirror(antler), '#B07C4F', 6)}<circle cx="86" cy="50" r="5" fill="#E6455A" ${SW2}/><circle cx="96" cy="46" r="5" fill="#E6455A" ${SW2}/><path d="M78 50 q-8 -10 2 -14 q4 8 -2 14z M104 46 q8 -10 -2 -14 q-4 8 2 14z" fill="#4FA04A" ${SW2}/>`,
    pumpkin: `<g transform="rotate(-8 100 40)"><path d="M98 20 q-2 -10 6 -14" stroke="#4FA04A" stroke-width="5" fill="none"/><path d="M104 10 q12 -8 18 2 q-10 6 -18 -2z" fill="#6CC066" ${SW2}/><ellipse cx="100" cy="40" rx="36" ry="22" fill="#FF9A3C" ${SW}/><path d="M100 19 Q88 40 100 61 M100 19 Q112 40 100 61 M82 22 Q68 40 80 59 M118 22 Q132 40 120 59" fill="none" stroke="#E07A1F" stroke-width="2.5"/><ellipse cx="90" cy="38" rx="3" ry="4" fill="${L}"/><ellipse cx="110" cy="38" rx="3" ry="4" fill="${L}"/><path d="M93 46 q7 6 14 0" fill="none" stroke="${L}" stroke-width="2.5"/><ellipse cx="84" cy="45" rx="4" ry="2.5" fill="#FF7FA6" opacity=".6"/><ellipse cx="116" cy="45" rx="4" ry="2.5" fill="#FF7FA6" opacity=".6"/></g>`,
    sakura: `<path d="M114 58 Q130 40 152 30" stroke="#8A5A33" stroke-width="4" fill="none"/>${flower(126, 44, 7, '#FFC2D6')}${flower(146, 30, 6, '#FF9DBB')}${flower(140, 52, 5, '#FFE3EC')}<path d="M118 30 q4 -4 8 0 q-4 4 -8 0z" fill="#FFC2D6" opacity=".9"/>`,
    strawhat: `<ellipse cx="100" cy="58" rx="70" ry="15" fill="#F4D58D" ${SW}/><path d="M64 58 Q64 24 100 22 Q136 24 136 58 Z" fill="#F7DF9F" ${SW}/><path d="M65 48 Q100 56 135 48 L136 58 Q100 66 64 58 Z" fill="#FF8FB1" ${SW2}/><path d="M76 34 l6 4 M90 28 l4 6 M110 28 l-4 6 M124 34 l-6 4" stroke="#D9B45E" stroke-width="2"/>${flower(130, 52, 6, '#FFFFFF', '#FFC93C')}`,
    heartiara: `${line('M62 58 Q100 42 138 58', '#FFC93C', 5)}<path d="M84 34 Q68 20 58 30 Q68 32 64 42 Q76 38 86 40 Z" fill="#fff" ${SW2}/><path d="${mirror('M84 34 Q68 20 58 30 Q68 32 64 42 Q76 38 86 40 Z')}" fill="#fff" ${SW2}/>${heart(100, 34, 1.15, '#FF5E92')}<path d="M93 24 q3 -3 6 -1" stroke="#fff" stroke-width="2.5" fill="none"/>${star(70, 52, 4, '#7CC4FF')}${star(130, 52, 4, '#7CC4FF')}`,
    donutband: `${line('M48 72 Q100 26 152 72', '#FF8FB1', 6)}<circle cx="132" cy="34" r="18" fill="#E9B072" ${SW}/><path d="M116 30 q6 -14 18 -12 q14 2 14 14 q-4 8 -10 4 q-8 -6 -12 2 q-8 2 -10 -8z" fill="#FF6F9C"/><circle cx="132" cy="34" r="6" fill="#FFF5EA" ${SW2}/><path d="M122 26 l3 -2 M140 24 l2 3 M128 20 l3 1 M144 34 l2 2" stroke="#fff" stroke-width="2.5"/><path d="M124 40 l2 2 M138 42 l2 -2" stroke="#7CC4FF" stroke-width="2.5"/>`,
    cupcake: `<path d="M70 62 L78 34 L122 34 L130 62 Z" fill="#7CC4FF" ${SW}/><path d="M88 36 L86 60 M100 36 V61 M112 36 L114 60" stroke="#fff" stroke-width="3" opacity=".7"/><path d="M68 38 Q62 20 84 18 Q90 2 108 6 Q126 4 128 20 Q142 24 132 40 Z" fill="#FFB3C7" ${SW}/><path d="M80 28 Q100 20 120 28" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><circle cx="106" cy="0" r="7" fill="#E6455A" ${SW2}/><path d="M106 -7 q4 -8 10 -8" stroke="#4FA04A" stroke-width="2.5" fill="none"/><path d="M84 30 l3 2 M96 24 l2 3 M118 30 l-3 2 M110 34 l2 -2" stroke="#FFE27A" stroke-width="3"/>`,
    gradcap: `<path d="M66 44 L66 62 Q100 74 134 62 L134 44" fill="#3A3550" ${SW}/><path d="M36 36 L100 14 L164 36 L100 58 Z" fill="#2F2B3A" ${SW}/><circle cx="100" cy="36" r="4" fill="#FFC93C"/><path d="M100 36 L152 44 L154 70" stroke="#FFC93C" stroke-width="3" fill="none"/><path d="M148 70 h12 l-2 14 h-8 z" fill="#FFC93C" ${SW2}/>`,
    muffs: `${line('M46 88 Q42 30 100 28 Q158 30 154 88', '#FFFFFF', 6)}${[44, 156].map(x => `<circle cx="${x}" cy="94" r="17" fill="#FFB3C7" ${SW}/><circle cx="${x - 5}" cy="89" r="5" fill="#fff" opacity=".7"/><circle cx="${x + 5}" cy="99" r="4" fill="#fff" opacity=".5"/>`).join('')}`,
  };
  /* ================= мордочка ================= */
  const eyeHoles = `M65 96 a13 15 0 1 0 26 0 a13 15 0 1 0 -26 0 Z M109 96 a13 15 0 1 0 26 0 a13 15 0 1 0 -26 0 Z`;
  const maskD = `M46 88 Q76 70 100 86 Q124 70 154 88 Q156 112 128 114 Q110 114 100 104 Q90 114 72 114 Q44 112 46 88 Z`;
  const FACE = {
    cateye: `${[0, 1].map(i => { const d = 'M60 86 Q60 82 66 82 L94 84 Q98 84 97 90 L95 102 Q93 110 84 110 L70 110 Q61 110 60 102 Z M60 88 L46 76 L62 82'; return `<path d="${i ? mirror(d) : d}" fill="rgba(255,182,213,.35)" stroke="#E0447A" stroke-width="4"/>`; }).join('')}<path d="M97 92 q3 -4 6 0" fill="none" stroke="#E0447A" stroke-width="4"/>${star(52, 80, 3.5, '#FFE27A')}${star(148, 80, 3.5, '#FFE27A')}`,
    sparkle: `${star(54, 112, 6, '#FFE27A', SW2)}${star(146, 112, 6, '#FFE27A', SW2)}${star(64, 126, 3.5, '#FF8FB1')}${star(136, 126, 3.5, '#FF8FB1')}${heart(48, 124, 0.35, '#FF5E92')}${heart(152, 124, 0.35, '#FF5E92')}`,
    masq: `<path fill-rule="evenodd" d="${maskD} ${eyeHoles}" fill="#9C6BE0" ${SW}/><path d="M52 92 Q76 78 100 92 Q124 78 148 92" fill="none" stroke="#FFC93C" stroke-width="3"/><path d="M150 86 Q176 50 164 22 Q154 52 140 82 Z" fill="#FF8FB1" ${SW2}/><path d="M152 80 Q164 54 162 34" stroke="#fff" stroke-width="2" fill="none"/>${[64, 136].map(x => `<circle cx="${x}" cy="108" r="3" fill="#FFE27A"/>`).join('')}`,
    batmask: `<path d="M58 84 L60 64 L76 78 Z" fill="#4A3A73" ${SW2}/><path d="${mirror('M58 84 L60 64 L76 78 Z')}" fill="#4A3A73" ${SW2}/><path fill-rule="evenodd" d="${maskD} ${eyeHoles}" fill="#4A3A73" ${SW}/><path d="M50 98 Q76 80 100 96 Q124 80 150 98" fill="none" stroke="#FF8FB1" stroke-width="2.5" opacity=".9"/>${star(100, 92, 4, '#FFE27A')}`,
    rainbowglass: `<defs><linearGradient id="rbg2" x1="0" x2="1"><stop offset="0" stop-color="#FF6F9C"/><stop offset=".33" stop-color="#FFC93C"/><stop offset=".66" stop-color="#7FE0C1"/><stop offset="1" stop-color="#9C84E8"/></linearGradient></defs>${[78, 122].map(x => `<circle cx="${x}" cy="97" r="18" fill="rgba(200,230,255,.35)" stroke="${L}" stroke-width="8"/><circle cx="${x}" cy="97" r="18" fill="none" stroke="url(#rbg2)" stroke-width="5"/><path d="M${x - 9} 90 q4 -6 10 -6" stroke="#fff" stroke-width="3" fill="none"/>`).join('')}<path d="M96 95 q4 -5 8 0" fill="none" stroke="url(#rbg2)" stroke-width="4"/>`,
    skimask: `<path d="M36 94 H164" stroke="${L}" stroke-width="10"/><path d="M36 94 H164" stroke="#FF6F9C" stroke-width="6"/><defs><linearGradient id="skg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9FE3FF"/><stop offset=".5" stop-color="#B9A6FF"/><stop offset="1" stop-color="#FF9DBB"/></linearGradient></defs><path d="M52 82 Q100 72 148 82 Q154 102 140 112 Q120 116 100 106 Q80 116 60 112 Q46 102 52 82 Z" fill="url(#skg)" stroke="#fff" stroke-width="5"/><path d="M52 82 Q100 72 148 82 Q154 102 140 112 Q120 116 100 106 Q80 116 60 112 Q46 102 52 82 Z" fill="none" ${SW}/><path d="M64 88 q14 -8 30 -6" stroke="#fff" stroke-width="4" fill="none" opacity=".8"/>`,
  };
  /* ================= шея и спинка ================= */
  const wingF = 'M56 150 Q16 108 10 136 Q8 166 54 166 Z', wingF2 = 'M56 168 Q22 174 24 196 Q36 212 62 182 Z';
  const wingA = 'M54 150 Q22 118 8 138 Q16 146 10 156 Q24 158 16 170 Q30 172 28 184 Q44 178 56 170 Z';
  const wingB = 'M54 150 L10 128 Q18 146 8 160 Q24 158 22 174 Q34 166 38 184 Q46 170 56 172 Z';
  const capeL = 'M54 144 Q28 192 40 228 L66 216 Q60 180 72 152 Z';
  const lightsPts = Array.from({ length: 7 }, (_, i) => qpt([48, 146], [100, 178], [152, 146], (i + 0.5) / 7));
  const NECK = {
    fairywings: `${[wingF, wingF2].map(d => `<path d="${d}" fill="rgba(180,230,255,.7)" stroke="#5FA8E6" stroke-width="3"/><path d="${mirror(d)}" fill="rgba(255,200,230,.7)" stroke="#E67FB0" stroke-width="3"/>`).join('')}<path d="M48 156 Q30 140 20 138 M152 156 Q170 140 180 138" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>${star(22, 150, 4, '#FFE27A')}${star(178, 150, 4, '#FFE27A')}${star(36, 192, 3, '#fff')}${star(164, 192, 3, '#fff')}`,
    angelwings: `<path d="${wingA}" fill="#FFFFFF" ${SW}/><path d="${mirror(wingA)}" fill="#FFFFFF" ${SW}/><path d="M50 156 Q34 150 24 152 M50 164 Q38 164 30 168 M150 156 Q166 150 176 152 M150 164 Q162 164 170 168" stroke="#C9D6EA" stroke-width="2.5" fill="none"/>`,
    batwings: `<path d="${wingB}" fill="#5B4A8A" ${SW}/><path d="${mirror(wingB)}" fill="#5B4A8A" ${SW}/><path d="M54 152 L22 158 M54 152 L32 174 M146 152 L178 158 M146 152 L168 174" stroke="#8C7BC2" stroke-width="2.5"/>${star(30, 140, 3, '#FFE27A')}${star(170, 140, 3, '#FFE27A')}`,
    xmaslights: `<path d="M48 146 Q100 178 152 146" fill="none" stroke="#2F6B3A" stroke-width="3.5"/>${lightsPts.map(([x, y], i) => `<ellipse cx="${x.toFixed(1)}" cy="${(y + 7).toFixed(1)}" rx="5" ry="7" fill="${['#FF5E7E', '#FFC93C', '#7CC4FF', '#7FE0C1', '#B9A6FF', '#FF8FB1', '#FFE27A'][i]}" ${SW2}/><circle cx="${(x - 1.5).toFixed(1)}" cy="${(y + 5).toFixed(1)}" r="1.6" fill="#fff"/>`).join('')}`,
    scarf2: `<path d="M48 140 Q100 170 152 140 L152 158 Q100 186 48 158 Z" fill="#7FE0C1" ${SW}/><path d="M70 150 v14 M100 156 v16 M130 150 v14" stroke="#fff" stroke-width="6" opacity=".85"/><path d="M84 162 L78 204 L98 206 L102 166 Z" fill="#7FE0C1" ${SW}/><path d="M81 178 h18 M80 192 h18" stroke="#fff" stroke-width="5"/><path d="M80 206 v8 M86 207 v8 M92 207 v8 M97 207 v7" stroke="#4FC4A0" stroke-width="2.5"/>`,
    sailor: `<path d="M50 142 Q100 160 150 142 L162 162 Q130 158 100 188 Q70 158 38 162 Z" fill="#3D5AA8" ${SW}/><path d="M50 152 Q72 154 100 178 Q128 154 150 152" stroke="#fff" stroke-width="3" fill="none"/><path d="M100 180 L82 170 L84 192 Z M100 180 L118 170 L116 192 Z" fill="#E6455A" ${SW2}/><circle cx="100" cy="180" r="5" fill="#FF7A8F" ${SW2}/>`,
    pendant: `<path d="M58 146 Q100 174 142 146" fill="none" stroke="#3B2A4A" stroke-width="5.5"/><path d="M58 146 Q100 174 142 146" fill="none" stroke="#FFC93C" stroke-width="3"/>${star(100, 172, 11, '#FFE27A', SW2)}<circle cx="97" cy="168" r="2" fill="#fff"/>`,
    starcape: `<path d="${capeL}" fill="#6B4FBF" ${SW}/><path d="${mirror(capeL)}" fill="#6B4FBF" ${SW}/><path d="M56 144 Q100 166 144 144 L140 155 Q100 174 60 155 Z" fill="#8E6FE0" ${SW}/>${[[48, 186], [56, 210], [152, 186], [144, 210], [60, 166], [140, 166]].map(([x, y], i) => star(x, y, i > 3 ? 3 : 4.5, '#FFE27A')).join('')}<circle cx="100" cy="162" r="5" fill="#FFC93C" ${SW2}/>`,
  };
  /* ================= в лапку ================= */
  const caneD = 'M156 206 L172 152 Q178 132 192 138 Q202 144 196 158';
  const HAND = {
    candycane: `<path d="${caneD}" fill="none" stroke="${L}" stroke-width="13"/><path d="${caneD}" fill="none" stroke="#fff" stroke-width="8.5"/><path d="${caneD}" fill="none" stroke="#E6455A" stroke-width="8.5" stroke-dasharray="7 7"/><path d="M196 158 l0 0" stroke="${L}" stroke-width="13"/>`,
    jacklamp: `<path d="M150 204 L168 172" stroke="#8A5A33" stroke-width="6"/><path d="M164 160 Q176 146 188 160" fill="none" stroke="${L}" stroke-width="3"/><ellipse cx="176" cy="174" rx="20" ry="16" fill="#FF9A3C" ${SW}/><path d="M176 158 Q168 174 176 190 M176 158 Q184 174 176 190" fill="none" stroke="#E07A1F" stroke-width="2"/><path d="M164 170 l5 -6 5 6 z M178 170 l5 -6 5 6 z" fill="#FFE27A"/><path d="M166 178 q10 8 20 0 q-10 4 -20 0z" fill="#FFE27A" stroke="${L}" stroke-width="1.5"/>`,
    tulips: `<path d="M156 202 Q160 176 162 152 M158 202 Q170 178 178 148 M160 202 Q176 184 192 162" stroke="#4FA04A" stroke-width="4" fill="none"/>${[[162, 148, '#FF8FB1'], [178, 144, '#FFC93C'], [192, 158, '#E6455A']].map(([x, y, c]) => `<path d="M${x - 8} ${y - 10} L${x - 4} ${y - 2} L${x} ${y - 12} L${x + 4} ${y - 2} L${x + 8} ${y - 10} Q${x + 9} ${y + 6} ${x} ${y + 7} Q${x - 9} ${y + 6} ${x - 8} ${y - 10} Z" fill="${c}" ${SW2}/>`).join('')}<path d="M144 206 L162 172 L192 182 L160 212 Z" fill="#FFF2E6" ${SW}/><path d="M154 196 l16 6" stroke="#FF8FB1" stroke-width="4"/>`,
    sparkler: `<path d="M150 204 L180 152" stroke="#9AA3B5" stroke-width="5"/><path d="M180 152 L184 145" stroke="#5A6070" stroke-width="5"/>${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2, r1 = 6, r2 = i % 2 ? 16 : 22; return `<path d="M${(186 + Math.cos(a) * r1).toFixed(1)} ${(142 + Math.sin(a) * r1).toFixed(1)} L${(186 + Math.cos(a) * r2).toFixed(1)} ${(142 + Math.sin(a) * r2).toFixed(1)}" stroke="${i % 3 ? '#FFC93C' : '#FF8F3C'}" stroke-width="2.5"/>`; }).join('')}<circle cx="186" cy="142" r="5" fill="#FFF6C9"/>${star(206, 128, 3, '#FFE27A')}${star(168, 126, 2.5, '#fff')}`,
    cocoa: `<path d="M192 166 q14 0 12 12 q-2 10 -14 8" fill="none" stroke="${L}" stroke-width="4"/><path d="M156 160 L160 196 Q174 202 188 196 L192 160 Z" fill="#FF8FB1" ${SW}/><ellipse cx="174" cy="160" rx="18" ry="5" fill="#8A5A33" ${SW2}/><rect x="164" y="152" width="8" height="8" rx="2" fill="#fff" ${SW2}/><rect x="176" y="150" width="8" height="8" rx="2" fill="#fff" ${SW2}/><path d="M166 144 q-4 -6 0 -12 M178 142 q4 -6 0 -12" stroke="#C9D6EA" stroke-width="2.5" fill="none"/>${heart(174, 180, 0.4, '#fff')}`,
    giftbox: `<rect x="154" y="160" width="40" height="32" rx="4" fill="#B9A6FF" ${SW}/><rect x="150" y="152" width="48" height="12" rx="3" fill="#C9BBFF" ${SW}/><path d="M174 152 V192" stroke="#FF5E92" stroke-width="7"/><path d="M174 152 q-16 -16 -20 -4 q4 8 20 4 q16 -16 20 -4 q-4 8 -20 4z" fill="#FF5E92" ${SW2}/>`,
    macaron: `<g transform="rotate(-14 174 168)"><path d="M152 166 Q152 148 174 148 Q196 148 196 166 Z" fill="#FFB3C7" ${SW}/><rect x="152" y="164" width="44" height="7" rx="3.5" fill="#FFF5EA" ${SW2}/><path d="M152 170 Q152 188 174 188 Q196 188 196 170 Z" fill="#FFB3C7" ${SW}/><path d="M162 156 q8 -4 16 -2" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8"/></g>`,
  };
  Object.assign(Cat.ACC, HEAD, FACE, NECK); Object.assign(Cat.HAND, HAND);

  /* ================= каталог: цена или достижение ================= */
  const casesP = () => S.casesPerfect || 0;
  // earn: [иконка, что сделать, текущее, нужно, куда идти]
  const EARN = {
    gradcap: () => ['✅', 'Решить 100 задач', solvedTotal(), 100, () => go('newcase')],
    rainbowglass: () => ['🔥', 'Заниматься 7 дней подряд', (S.badges || []).includes('streak7') ? 7 : streak(), 7, () => go('home')],
    angelwings: () => ['💎', 'Раскрыть 10 дел без ошибок', casesP(), 10, () => go('newcase')],
    pendant: () => ['📦', 'Решить 50 уравнений', S.st.eq.done, 50, () => go('practice', 'eq')],
    starcape: () => ['🔍', 'Раскрыть 25 дел', S.cases || 0, 25, () => go('newcase')],
    giftbox: () => ['🏅', 'Собрать 10 наград в Блокноте', (S.badges || []).length, 10, () => go('book')],
  };
  const SEASONS = { ny: { icon: '🎄', name: 'Новый год', on: m => m === 11 || m === 0 }, hw: { icon: '🎃', name: 'Добрый Хэллоуин', on: m => m === 9 }, spring: { icon: '🌸', name: 'Весна', on: m => m >= 2 && m <= 4 } };
  const LIST = [
    ['santa', 'head', 'Шапка Деда Мороза', '🎅', 45, 0, 'ny'], ['antlers', 'head', 'Оленьи рожки', '🦌', 35, 0, 'ny'], ['muffs', 'head', 'Меховые наушники', '❄️', 35, 0, 'ny'],
    ['pumpkin', 'head', 'Шапочка-тыковка', '🎃', 40, 0, 'hw'], ['sakura', 'head', 'Веточка сакуры', '🌸', 30, 0, 'spring'], ['strawhat', 'head', 'Соломенная шляпка', '👒', 45, 0, 'spring'],
    ['heartiara', 'head', 'Диадема волшебницы', '💖', 0, 6], ['donutband', 'head', 'Ободок-пончик', '🍩', 30], ['cupcake', 'head', 'Шапочка-капкейк', '🧁', 40], ['gradcap', 'head', 'Шапочка выпускника', '🎓', 0],
    ['cateye', 'face', 'Очки-кошечки', '😺', 35], ['sparkle', 'face', 'Блёстки на щёчках', '✨', 25], ['masq', 'face', 'Карнавальная маска', '🎭', 45, 0, 'ny'], ['batmask', 'face', 'Маска летучей мышки', '🦇', 40, 0, 'hw'],
    ['rainbowglass', 'face', 'Радужные очки', '🌈', 0], ['skimask', 'face', 'Лыжная маска', '🥽', 50, 0, 'ny'],
    ['fairywings', 'neck', 'Крылья феи', '🧚', 0, 12, 'spring'], ['angelwings', 'neck', 'Ангельские крылышки', '🪽', 0], ['batwings', 'neck', 'Крылья летучей мышки', '🦇', 60, 0, 'hw'], ['xmaslights', 'neck', 'Гирлянда-бусы', '🎄', 40, 0, 'ny'],
    ['scarf2', 'neck', 'Шарф в полоску', '🧣', 30], ['sailor', 'neck', 'Матросский воротник', '⚓', 50], ['pendant', 'neck', 'Кулон-звезда', '⭐', 0], ['starcape', 'neck', 'Плащ звездочёта', '🌌', 0],
    ['candycane', 'hand', 'Леденцовая трость', '🍬', 25, 0, 'ny'], ['jacklamp', 'hand', 'Фонарик-тыква', '🏮', 35, 0, 'hw'], ['tulips', 'hand', 'Букет тюльпанов', '🌷', 30, 0, 'spring'], ['sparkler', 'hand', 'Бенгальский огонь', '🎇', 30, 0, 'ny'],
    ['cocoa', 'hand', 'Чашка какао', '☕', 25], ['giftbox', 'hand', 'Подарок', '🎁', 0], ['macaron', 'hand', 'Макарун', '🍪', 20],
  ].map(([id, slot, name, icon, price, gems, season]) => ({ id, slot, name, icon, price, ...(gems ? { gems } : {}), ...(season ? { season } : {}), ...(EARN[id] ? { earn: 1 } : {}) }));
  LIST.forEach(it => { if (!ITEMS.some(x => x.id === it.id)) ITEMS.push(it); });
  const NEW_IDS = LIST.map(i => i.id);
  const inSeason = it => it.season && SEASONS[it.season].on(new Date().getMonth());
  const prog = id => { const e = EARN[id](); return { icon: e[0], text: e[1], a: Math.min(e[2], e[3]), b: e[3], ok: e[2] >= e[3], go: e[4] }; };

  /* достижения проверяем после каждой награды — вещь выдаётся сама */
  function checkEarned() {
    const got = Object.keys(EARN).filter(id => !S.owned.includes(id) && prog(id).ok); if (!got.length) return;
    got.forEach(id => S.owned.push(id)); save();
    got.forEach((id, k) => { const it = ITEMS.find(x => x.id === id); setTimeout(() => { toast(`<span class="tb">${it.icon}</span><div><b>Новый наряд за достижение!</b><br>${it.name} — уже в Кондитерской</div>`); SND.win(); }, 1800 + k * 1200); });
  }
  const aw = award; award = function () { const r = aw.apply(this, arguments); try { checkEarned(); } catch (e) { console.warn(e); } return r; };

  /* ============ Кондитерская: значки сезона и достижений, перехват «купить за 0» ============ */
  const earnModal = it => { const p = prog(it.id); const m = modal(`<div class="big-emoji">${it.icon}</div><h2>${it.name}</h2><p>Эту вещь не купить — её дарят за достижение: <b>${p.text}</b>.</p><div class="bar"><i style="width:${p.a / p.b * 100}%"></i></div><p class="small">${p.a} из ${p.b}</p><div class="row-btns"><button class="btn pink" id="earnGo">▶ Заработать</button><button class="btn" data-close>Позже</button></div>`); $('#earnGo', m.el).addEventListener('click', () => { m.close(); go('earn', 'item:' + it.id); }); };
  const lockedEarn = id => { const it = ITEMS.find(x => x.id === id); return it && it.earn && !S.owned.includes(it.id) ? it : null; };
  // клики по ещё не полученной вещи за достижение — в Кондитерской и в Примерочной («купить за 0» невозможно)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#si .item[data-id], [data-buy]'); if (!b) return;
    const it = lockedEarn(b.dataset.id || b.dataset.buy); if (!it) return;
    e.stopImmediatePropagation(); e.preventDefault(); SND.tap(); earnModal(it);
  }, true);
  /* v35: превью наряда — тот же SVG-кот в этой вещи (а не чужой эмодзи: колпак ≠ 👩‍🍳, бабочка ≠ 🦋, берет ≠ 🎨) */
  const VB = { head: '18 -14 174 158', face: '34 46 132 112', neck: '12 46 186 196', hand: '38 74 170 168' };
  function outfitThumb(it, fur) {
    const C = window.Cat; if (!C || !it || !VB[it.slot] || !(it.slot === 'hand' ? C.HAND[it.id] : C.ACC[it.id])) return '';
    return C.catSVG({ fur: fur || S.fur, wear: { [it.slot]: it.id }, smile: true }).replace(/viewBox="[^"]*"/, `viewBox="${VB[it.slot]}"`);
  }
  function thumbs(root) {
    $$('.item[data-id] .ii:not(.o-thumb)', root).forEach(ii => {
      const b = ii.closest('.item'), it = ITEMS.find(x => x.id === b.dataset.id); if (!it || b.classList.contains('lockd')) return;
      const svg = outfitThumb(it); if (!svg) return; ii.classList.add('o-thumb'); ii.setAttribute('aria-hidden', 'true'); ii.innerHTML = svg;
    });
  }
  /* v35: длинные каталоги (Кондитерская, Примерочная) — разделы-вкладки вместо ленты в 7000 px */
  const secPick = {};
  function sections(box) {
    if (!box) return; const heads = [...box.children].filter(h => /^H[34]$/.test(h.tagName) && h.nextElementSibling && h.nextElementSibling.matches('.items, .furs'));
    const old = $(':scope > .sect-chips', box);
    if (heads.length < 3) { if (old) old.remove(); return; }
    const key = box.id + ':' + heads.map(h => h.textContent).join('|');
    if (old && old.dataset.key === key) return;
    if (old) old.remove();
    const names = heads.map(h => h.textContent.trim());
    let cur = secPick[box.id]; if (!names.includes(cur)) { const on = heads.find(h => h.nextElementSibling.querySelector('.on')); cur = on ? on.textContent.trim() : names[0]; }
    const bar = document.createElement('div'); bar.className = 'sect-chips'; bar.dataset.key = key; bar.setAttribute('role', 'tablist');
    bar.innerHTML = heads.map((h, i) => `<button type="button" role="tab" data-s="${i}">${h.innerHTML}<small>${h.nextElementSibling.children.length}</small></button>`).join('');
    const show = name => { secPick[box.id] = name; heads.forEach((h, i) => { const on = names[i] === name; h.classList.toggle('sect-off', !on); h.nextElementSibling.classList.toggle('sect-off', !on); bar.children[i].classList.toggle('on', on); bar.children[i].setAttribute('aria-selected', on); }); };
    bar.addEventListener('click', e => { const t = e.target.closest('button[data-s]'); if (!t) return; SND.tap(); show(names[+t.dataset.s]); });
    heads[0].before(bar); show(cur);
  }
  function mark(root = document) {
    try { thumbs(root); sections($('#si', root)); sections($('#finv', root)); } catch (e) { console.warn(e); }
    $$('.item[data-id]', root).forEach(b => {
      const it = ITEMS.find(x => x.id === b.dataset.id); if (!it || b.dataset.o29) return; b.dataset.o29 = 1;
      if (it.season) { b.classList.add('season'); if (inSeason(it)) b.classList.add('in-season'); b.insertAdjacentHTML('beforeend', `<span class="o-tag" title="${SEASONS[it.season].name}">${SEASONS[it.season].icon}</span>`); }
      if (NEW_IDS.includes(it.id) && !S.owned.includes(it.id)) b.insertAdjacentHTML('beforeend', '<span class="o-new">new</span>');
      if (it.earn && !S.owned.includes(it.id)) { const p = prog(it.id), ip = $('.ip', b); b.classList.add('earnitem'); if (ip && !b.closest('#finv')) ip.textContent = `🏅 ${p.a}/${p.b}`; }
    });
    $$('[data-buy]', root).forEach(b => { const it = lockedEarn(b.dataset.buy); if (it && !b.dataset.o29) { b.dataset.o29 = 1; b.textContent = `${it.icon} ${it.name} — за достижение`; } });
  }
  let raf = 0; const mo = window.MutationObserver ? new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; mark(app); }); }) : null;
  if (mo) mo.observe(app, { childList: true, subtree: true });

  { const sh = SCREENS.shop; SCREENS.shop = arg => { try { checkEarned(); } catch (e) { } sh(arg); mark(app); }; }
  { const ft = SCREENS.fitting; if (ft) SCREENS.fitting = arg => { ft(arg); mark(app); }; }
  /* ============ «Как заработать» для вещей за достижения ============ */
  { const ea = SCREENS.earn; SCREENS.earn = arg => {
    const [kind, id] = String(arg || '').split(':'), it = kind === 'item' && lockedEarn(id) || (kind === 'item' && EARN[id] ? ITEMS.find(x => x.id === id) : null);
    if (!it || !it.earn) return ea(arg);
    const p = prog(it.id), own = S.owned.includes(it.id);
    app.innerHTML = `${topbar('🎯 Как заработать')}<div class="page earn"><div class="earn-head"><span class="big-emoji">${it.icon}</span><h2>${it.name}</h2><p>${own ? 'Уже твоё! Надень в Кондитерской 🎉' : 'Наряд за достижение — он появится сам, как только получится:'}</p></div><div class="earn-list"><div class="earn-row"><span class="ei">${p.icon}</span><div class="eb"><b>${p.text}</b><span class="bar"><i style="width:${p.a / p.b * 100}%"></i></span><small>${p.a} из ${p.b}</small></div>${p.ok || own ? '<span class="edone">✔</span>' : '<button class="btn sm pink" id="egoo">▶ Заработать</button>'}</div></div><div class="o-preview">${catSVG({ fur: S.fur, wear: { ...S.wear, [it.slot]: it.id }, smile: true })}</div></div>`;
    const g = $('#egoo'); if (g) g.addEventListener('click', () => { SND.tap(); p.go(); });
  }; }

  document.head.insertAdjacentHTML('beforeend', `<style id="outfits29-css">
.item { position: relative; }
.item .o-tag { position: absolute; top: 4px; left: 6px; font-size: 16px; line-height: 1; }
.item.in-season { background: linear-gradient(160deg, #FFF7E0, #FFEFF6); outline: 2px dashed #FFC93C; }
.item .o-new { position: absolute; top: 4px; right: 6px; font-size: 10px; font-weight: 900; color: #fff; background: #FF6F9C; border-radius: 8px; padding: 1px 5px; text-transform: uppercase; }
.item.earnitem { background: linear-gradient(160deg, #F0FFF8, #EAF4FF); outline: 2px dashed #7FE0C1; }
.item.earnitem .ip { color: #2E9E78; }
.o-preview { max-width: 220px; margin: 14px auto 0; }
</style>`);
  return { LIST, EARN, SEASONS, checkEarned, prog, inSeason };
})();
window.Outfits = Outfits;
