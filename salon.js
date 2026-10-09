/* salon.js — «Салон окрасов»: модные окрасы шерсти за особые достижения (трудные задачи, задания роста, честная теория).
   Окрас открывается достижением, а покупается за 💎. Базовые окрасы в Кондитерской не меняются. */
'use strict';
const Salon = (() => {
  const st = () => (window.Coach ? Coach.stats() : { growDone: 0, masterDone: 0, overcome: [], cured: 0, bestStreak: 0 });
  const th = k => ((S.theory || {})[k] || {}).verified;
  const acadVerified = () => Object.entries(S.theory || {}).filter(([k, r]) => k.startsWith('a:') && r.verified).length;
  const acad3 = () => Object.values(S.acad || {}).reduce((t, a) => t + Object.values(a.best || {}).filter(x => x >= 3).length, 0);
  const pf = id => ((S.sk || {})[id] || {}).pf || 0;
  const SH = [
    { id: 'mint', name: 'Мятная карамель', gems: 5, f: { base: '#9FE6C8', light: '#E8FFF5', stripe: '#6FCFA8', ai: '#E86FA0', sw: '#9FE6C8' }, cond: 'Изучи урок «Умножение столбиком» и ответь на «Проверь себя»', p: () => [th('t:mul') ? 1 : 0, 1] },
    { id: 'lavender', name: 'Лавандовый туман', gems: 5, f: { base: '#C9B6F2', light: '#F3EDFF', stripe: '#A58BE0', ai: '#5B4BB7', sw: '#C9B6F2' }, cond: 'Изучи урок «Уравнения» и ответь на «Проверь себя»', p: () => [th('t:eq') ? 1 : 0, 1] },
    { id: 'peach', name: 'Персик', gems: 6, f: { base: '#FFC1A1', light: '#FFF0E6', stripe: '#F49A72', ai: '#3F9A4A', sw: '#FFC1A1' }, cond: 'Выполни 3 задания роста от котика', p: () => [st().growDone, 3] },
    { id: 'sky', name: 'Небесный', gems: 8, f: { grad: ['#A8D8FF', '#D6ECFF', '#FFFFFF'], light: '#F2FAFF', ai: '#2D7FE0', sw: 'linear-gradient(135deg,#A8D8FF,#fff)' }, cond: 'Изучи 5 уроков в Академии (с «Проверь себя»)', p: () => [acadVerified(), 5] },
    { id: 'cloud', name: 'Облачко', gems: 8, f: { grad: ['#FFFFFF', '#E6EBF8', '#FFFFFF'], light: '#FFFFFF', ai: '#9B7BFF', sw: 'linear-gradient(135deg,#fff,#DDE3F5)' }, cond: 'Занимайся 7 дней подряд', p: () => [Math.max(st().bestStreak || 0, streak()), 7] },
    { id: 'moon', name: 'Лунное серебро', gems: 10, f: { grad: ['#E7EAF2', '#B9C0D0', '#F5F7FB'], light: '#FAFBFF', ai: '#5AA9E6', fx: 'sparkle', sw: 'linear-gradient(135deg,#E7EAF2,#B9C0D0,#F5F7FB)' }, cond: 'Вылечи 15 ошибок в «Разборе ошибок» Академии', p: () => [st().cured, 15] },
    { id: 'sunset', name: 'Закат', gems: 10, f: { grad: ['#FFB347', '#FF6F91', '#9B5DE5'], light: '#FFE7D6', ai: '#2E8B57', sw: 'linear-gradient(135deg,#FFB347,#FF6F91,#9B5DE5)' }, cond: '«Преодоление»: тема, которая была трудной, стала получаться', p: () => [st().overcome.length, 1] },
    { id: 'rosegold', name: 'Розовое золото', gems: 12, f: { grad: ['#F7C6C7', '#E8A0A8', '#F9D9C4'], light: '#FFF1EE', ai: '#B5651D', fx: 'sparkle', sw: 'linear-gradient(135deg,#F7C6C7,#E8A0A8,#F9D9C4)' }, cond: 'Выполни 10 заданий роста от котика', p: () => [st().growDone, 10] },
    { id: 'cotton', name: 'Сахарная вата', gems: 12, f: { grad: ['#FFC8DD', '#CDB4DB', '#A2D2FF'], light: '#FFF5FB', ai: '#FF4F9A', sw: 'linear-gradient(135deg,#FFC8DD,#CDB4DB,#A2D2FF)' }, cond: 'Пройди 3 испытания мастера', p: () => [st().masterDone, 3] },
    { id: 'galaxy', name: 'Галактика', gems: 15, f: { grad: ['#2B1E5C', '#5B2C83', '#1E3A7A'], light: '#7D6BC7', ai: '#FFD34D', fx: 'stars', sw: 'linear-gradient(135deg,#2B1E5C,#5B2C83,#1E3A7A)' }, cond: 'Реши 10 тройных уравнений (уровень 4) без ошибок', p: () => [pf('eq4'), 10] },
    { id: 'neon', name: 'Неоновая радуга', gems: 15, f: { grad: ['#FF5EDB', '#7B61FF', '#00E5FF', '#5CFF8F'], light: '#FFFFFF', ai: '#7B61FF', fx: 'sparkle', sw: 'linear-gradient(135deg,#FF5EDB,#7B61FF,#00E5FF,#5CFF8F)' }, cond: 'Получи 3 звезды в 10 тренажёрах Академии', p: () => [acad3(), 10] },
    { id: 'gold', name: 'Золотой', gems: 20, f: { grad: ['#FFE08A', '#F5B700', '#FFF1B8'], light: '#FFF8DC', ai: '#8B4513', fx: 'sparkle', sw: 'linear-gradient(135deg,#FFE08A,#F5B700,#FFF1B8)' }, cond: 'Получи звание «Детектив»', p: () => [Math.min(rank().i, 5), 5] },
  ];
  SH.forEach(x => { FURS[x.id] = Object.assign({ name: x.name, salon: true }, x.f); });
  const owned = () => (S.furs = S.furs || []);
  const prog = x => { const [a, b] = x.p(); return { a: Math.min(a, b), b, ok: a >= b }; };
  function html() {
    const own = owned();
    return `<p class="small center">Особые окрасы открываются за <b>достижения</b> — трудные задачи, задания котика и изученные уроки. Открыл — покупай за 💎!</p><div class="salon">${SH.map(x => {
      const p = prog(x), has = own.includes(x.id), on = S.fur === x.id;
      return `<button class="shade ${has ? 'own' : p.ok ? 'open' : 'locked'} ${on ? 'on' : ''}" data-sh="${x.id}"><span class="sw" style="background:${x.f.sw}">${x.f.fx ? '✨' : ''}</span><b>${x.name}</b>${has ? `<small>${on ? 'надет ✔' : 'нажми, чтобы надеть'}</small>` : `<small>${x.cond}</small><span class="bar"><i style="width:${p.a / p.b * 100}%"></i></span><span class="sp">${p.ok ? `🔓 ${x.gems} 💎` : `🔒 ${p.a}/${p.b}`}</span>`}</button>`;
    }).join('')}</div>`;
  }
  function bind(root, redraw) {
    $$('.shade', root).forEach(b => b.addEventListener('click', () => {
      const x = SH.find(s => s.id === b.dataset.sh), own = owned();
      if (own.includes(x.id)) { S.fur = x.id; save(); SND.meow(); catMood('happy', 1500); redraw(); return; }
      const p = prog(x);
      if (!p.ok) { SND.tap(); toast(`<span class="tb">🔒</span><div><b>${x.name}</b><br>${x.cond}. Сейчас: ${p.a} из ${p.b}.</div>`); return; }
      if ((S.gems || 0) < x.gems) { SND.bad(); toast(`<span class="tb">💎</span><div>Окрас открыт! Нужно <b>${x.gems} 💎</b>, у тебя ${S.gems || 0}.<br>Кристаллы — за сложные задачи и задания котика.</div>`); return; }
      const m = modal(`<div class="m-cat">${catSVG({ fur: x.id, wear: S.wear, happy: true })}</div><h2>${x.name}</h2><p>Купить окрас за <b>${x.gems} 💎</b>?</p><div class="row-btns"><button class="btn pink" id="buysh">Купить!</button><button class="btn" data-close>Не сейчас</button></div>`);
      $('#buysh', m.el).addEventListener('click', () => { S.gems -= x.gems; own.push(x.id); S.fur = x.id; save(); updCandy(); m.close(); confetti(40); M.sfx('magic'); SND.win(); say('Новый окрас! Я теперь самый модный котик, {n}!', 0, { prio: 1 }); redraw(); });
    }));
  }
  return { html, bind, list: SH, prog };
})();
window.Salon = Salon;
