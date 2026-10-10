/* spacetrip.js — бонус «Космическая аркада»: котик-космонавт ведёт ракету по Солнечной системе (Меркурий → Нептун).
   Собирай звёзды и конфеты, хватай топливо, облетай астероиды. 3 сердечка, у каждой планеты — чекпоинт,
   по прилёту — настоящий факт «Знаешь ли ты?» и наклейка. Вход — «космический билет» за каждые 30 решённых задач,
   сама аркада открывается после NEED решённых задач. За все 8 планет — особый наряд «Звёздный плащ космонавта». */
'use strict';
const SpaceTrip = (() => {
  const NEED = 120;   // решённых задач, чтобы открыть аркаду
  const TICKET = 30;  // решённых задач на один космический билет
  const PL = [
    { id: 'mercury', name: 'Меркурий', c: '#B9AC9F', c2: '#6E625A', r: 26, bg: ['#160F1E', '#3A2526'], neb: '#FF9A5A', rock: '#8C7B6E', kind: 'craters', dur: 60, stk: 'Быстрый Меркурий',
      fact: 'Год на Меркурии длится всего 88 земных суток — быстрее него вокруг Солнца не бегает ни одна планета. Днём там жарче +400 °C, а ночью мороз почти −180 °C.' },
    { id: 'venus', name: 'Венера', c: '#F0CF86', c2: '#B9853E', r: 34, bg: ['#1E1206', '#4A2A10'], neb: '#FFD36B', rock: '#A27A4C', kind: 'swirl', dur: 64, stk: 'Жаркая Венера',
      fact: 'Венера крутится в обратную сторону, поэтому Солнце там встаёт на западе. А сутки на Венере длиннее, чем её год!' },
    { id: 'earth', name: 'Земля', c: '#4C9BE8', c2: '#1F4E9C', r: 35, bg: ['#06122A', '#0D3352'], neb: '#5BD6FF', rock: '#7D7A86', kind: 'earth', dur: 68, stk: 'Наш дом — Земля',
      fact: 'Земля — единственная известная планета, где на поверхности есть жидкая вода и живут растения, звери и котики. Океаны занимают больше двух третей её поверхности.' },
    { id: 'mars', name: 'Марс', c: '#D9673E', c2: '#8A2E1A', r: 30, bg: ['#1A0806', '#4A160E'], neb: '#FF6A4A', rock: '#9A5038', kind: 'mars', dur: 72, stk: 'Красный Марс',
      fact: 'Марс красный из-за ржавчины: в его пыли много оксида железа. А ещё там самый высокий вулкан Солнечной системы — Олимп, он примерно в 2,5 раза выше Эвереста.' },
    { id: 'jupiter', name: 'Юпитер', c: '#DDAE76', c2: '#9C6A3C', r: 56, bg: ['#140D08', '#3B2716'], neb: '#FFB46B', rock: '#8E7358', kind: 'bands', dur: 78, stk: 'Великан Юпитер',
      fact: 'Большое Красное Пятно на Юпитере — это буря, которая бушует уже больше 300 лет. Она такая огромная, что в неё поместилась бы вся Земля!' },
    { id: 'saturn', name: 'Сатурн', c: '#E8CF92', c2: '#A98A4E', r: 48, ring: true, bg: ['#141008', '#3A3018'], neb: '#FFE08A', rock: '#B4A27A', kind: 'bands', dur: 82, stk: 'Кольца Сатурна',
      fact: 'Сатурн очень лёгкий для своего размера: в среднем он легче воды. Если бы нашлась ванна размером с планету, Сатурн бы в ней плавал! Его кольца — из льда и камней.' },
    { id: 'uranus', name: 'Уран', c: '#97DDE4', c2: '#4C9AA6', r: 40, bg: ['#04141A', '#0B3A44'], neb: '#7FF3FF', rock: '#6E9AA2', kind: 'uranus', dur: 86, stk: 'Уран на боку',
      fact: 'Уран вращается «лёжа на боку»: его ось наклонена почти на 98 градусов. Поэтому на полюсах Урана день и ночь длятся по 42 года!' },
    { id: 'neptune', name: 'Нептун', c: '#4F74E6', c2: '#1F3596', r: 40, bg: ['#03061C', '#0E1A55'], neb: '#6E8CFF', rock: '#5D6894', kind: 'neptune', dur: 90, stk: 'Ветреный Нептун',
      fact: 'На Нептуне дуют самые быстрые ветры в Солнечной системе — около 2000 км/ч, это быстрее звука. Один год там длится 165 земных лет.' },
  ];
  const OUTFIT = 'cosmocape';
  const RM = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const st = () => {
    const T = S.trip = S.trip || { done: {} };
    if (!T.ar) T.ar = { done: {}, best: {}, used: 0, base: Math.max(NEED, solvedTotal()) - TICKET, flights: 0 };
    return T.ar;
  };
  const open = () => solvedTotal() >= NEED;
  const earned = () => { const A = st(); return open() ? Math.max(0, Math.floor((solvedTotal() - A.base) / TICKET)) : 0; };
  const tickets = () => Math.max(0, earned() - st().used);
  const toNext = () => { if (!open()) return NEED - solvedTotal() + TICKET; const d = solvedTotal() - st().base; return TICKET - (((d % TICKET) + TICKET) % TICKET); };
  const cpIndex = () => { const A = st(), i = PL.findIndex(p => !A.done[p.id]); return i < 0 ? PL.length : i; };
  const planet = (p, s = 1) => { const R = p.r * s, W = (R + (p.ring ? R * 0.7 : 0)) * 2 + 6; return `<svg viewBox="${-W / 2} ${-R - 3} ${W} ${R * 2 + 6}" width="${W}" height="${R * 2 + 6}" aria-hidden="true">${p.ring ? `<ellipse rx="${R * 1.65}" ry="${R * 0.42}" fill="none" stroke="#C9A65A" stroke-width="${R * 0.16}"/>` : ''}<circle r="${R}" fill="${p.c}"/><circle cx="${-R * .35}" cy="${-R * .35}" r="${R * .3}" fill="#fff" opacity=".3"/><circle r="${R}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="${R * .12}"/></svg>`; };
  const sticker = (p, got) => `<div class="sa-sticker ${got ? 'on' : ''}" title="${p.stk}"><span class="sa-sk-pl">${got ? planet(p, 22 / p.r) : '❔'}</span><b>${got ? p.stk : p.name}</b></div>`;

  /* ---------- особый наряд за все планеты ---------- */
  try {
    const SW = 'stroke="#3B2A4A" stroke-width="3.5"';
    Cat.ACC[OUTFIT] = `<path d="M54 144 Q26 192 38 230 L66 216 Q60 180 72 152 Z" fill="#2B2F7A" ${SW}/><path d="M146 144 Q174 192 162 230 L134 216 Q140 180 128 152 Z" fill="#2B2F7A" ${SW}/>`
      + [[46, 190], [54, 212], [60, 172], [154, 190], [146, 212], [140, 172]].map(([x, y], i) => `<path d="M${x} ${y - 5} l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6z" fill="${i % 2 ? '#FFE27A' : '#fff'}"/>`).join('')
      + `<path d="M56 144 Q100 164 144 144" stroke="#7C9CFF" stroke-width="9" fill="none"/><ellipse cx="100" cy="157" rx="15" ry="4.5" fill="none" stroke="#FFC93C" stroke-width="3"/><circle cx="100" cy="157" r="8" fill="#FF8FB1" ${SW}/>`;
    if (!ITEMS.some(x => x.id === OUTFIT)) ITEMS.push({ id: OUTFIT, slot: 'neck', name: 'Звёздный плащ космонавта', icon: '🌌', price: 0, space: 1 });
  } catch (e) { console.warn(e); }
  { const sh = SCREENS.shop; if (sh) SCREENS.shop = arg => { sh(arg); const si = $('#si', app); if (!si) return;
    si.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (!b || b.dataset.id !== OUTFIT || S.owned.includes(OUTFIT)) return; e.stopImmediatePropagation(); e.preventDefault(); SND.tap(); toast('<span class="tb">🌌</span><div><b>Звёздный плащ космонавта</b><br>Приз за полёт через все 8 планет в Космической аркаде 🚀</div>'); }, true);
    const mark = () => { const b = $(`#si .item[data-id="${OUTFIT}"]`); if (b && !S.owned.includes(OUTFIT)) { const ip = $('.ip', b); if (ip && ip.textContent !== '🚀 приз') ip.textContent = '🚀 приз'; } };
    mark(); if (window.MutationObserver) { const mo = new MutationObserver(mark); mo.observe(si, { childList: true, subtree: true }); cleanups.push(() => mo.disconnect()); } }; }

  /* ---------- стили ---------- */
  function ensureCss() {
    if (document.getElementById('spacearcade-css')) return;
    const s = document.createElement('style'); s.id = 'spacearcade-css';
    s.textContent = `.sa-hub .sa-tk{display:flex;gap:12px;align-items:center;background:linear-gradient(135deg,#232E6E,#4B2E8A);color:#fff;border-radius:22px;padding:14px;margin-bottom:12px}
.sa-hub .sa-tk-ic{font-size:44px;line-height:1;flex-shrink:0}.sa-hub .sa-tk>div:not(.sa-tk-ic){flex:1;min-width:0}.sa-hub .sa-tk b{font-size:18px;display:block}
.sa-hub .sa-tk small{display:block;opacity:.9;font-size:13px}.sa-hub .sa-tk .bar{display:block;background:rgba(255,255,255,.2);margin:6px 0 4px}
.sa-hub .trip-map{grid-template-columns:repeat(auto-fill,minmax(88px,1fr))}
.sa-hub .tp{border:2px solid transparent;font:inherit;cursor:pointer;min-height:96px;justify-content:center}.sa-hub .tp svg{max-width:100%;height:auto}
.sa-hub .tp.sel{border-color:#FFD34D;background:rgba(255,211,77,.16)}.sa-hub .tp.lock{opacity:.45}.sa-hub .tp small{font-size:12px;color:#FFE38A}
.sa-hub .sa-fly{width:100%;margin:12px 0 4px;min-height:58px;font-size:19px}.sa-hub .sa-fly[disabled]{opacity:.55;filter:grayscale(.4)}
.sa-hub .sa-nofly{text-align:center;font-size:14px;margin:4px 0 10px}
.sa-stk{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:8px;margin:6px 0 12px}
.sa-sticker{background:#fff;border-radius:18px;padding:8px 4px;text-align:center;box-shadow:var(--sh);opacity:.55;min-width:0}
.sa-sticker.on{opacity:1;background:radial-gradient(circle at 50% 30%,#FFF6D8,#fff 70%);transform:rotate(-2deg)}.sa-sticker:nth-child(2n).on{transform:rotate(2deg)}
.sa-sticker .sa-sk-pl{display:flex;justify-content:center;align-items:center;height:52px;font-size:30px}.sa-sticker .sa-sk-pl svg{max-width:100%;height:auto}
.sa-sticker b{display:block;font-size:12px;line-height:1.2;overflow-wrap:anywhere}
.sa-prize{display:flex;gap:10px;align-items:center;background:#fff;border-radius:18px;padding:10px 14px;box-shadow:var(--sh);font-size:15px}.sa-prize.on{background:#EEF2FF}.sa-prize span{font-size:34px}
.sa-wrap{position:fixed;inset:0;z-index:40;background:#05081A;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;color:#fff}
.sa-wrap canvas{display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.sa-hud{position:absolute;left:0;right:0;top:0;padding:max(8px,env(safe-area-inset-top)) 10px 6px;display:flex;flex-direction:column;gap:4px;pointer-events:none;background:linear-gradient(rgba(3,5,20,.75),rgba(3,5,20,0))}
.sa-row{display:flex;align-items:center;gap:8px;min-width:0}.sa-hearts{font-size:22px;letter-spacing:1px;white-space:nowrap}.sa-sc{flex:1;text-align:center;font-weight:800;font-size:17px;white-space:nowrap;text-shadow:0 1px 3px #000}
.sa-sc b{display:inline-block;min-width:1.4em}.sa-sc b.pop{animation:saPop .3s}
@keyframes saPop{50%{transform:scale(1.5)}}
.sa-btn{pointer-events:auto;width:52px;height:52px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer}
.sa-btn:active{background:rgba(255,255,255,.32)}
.sa-lbl{width:24px;text-align:center;font-size:16px}.sa-bar{flex:1;height:10px;border-radius:6px;background:rgba(255,255,255,.18);overflow:hidden;min-width:0}
.sa-bar b{display:block;height:100%;width:0;border-radius:6px;background:linear-gradient(90deg,#FFD34D,#FF8FB1)}.sa-bar.fuel b{background:linear-gradient(90deg,#46D39A,#B6F36B)}.sa-bar.fuel.low b{background:linear-gradient(90deg,#FF5E5E,#FFB35E)}
.sa-row small{font-size:13px;font-weight:700;white-space:nowrap;max-width:34%;overflow:hidden;text-overflow:ellipsis}
.sa-ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(3,5,20,.6);overflow-y:auto}
.sa-ov[hidden]{display:none}
.sa-card{background:#fff;color:var(--ink);border-radius:26px;padding:18px 16px;max-width:420px;width:100%;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.4);box-sizing:border-box;margin:auto}
@keyframes saIn{from{opacity:0;transform:scale(.92)}}.sa-card.sa-late{animation:saIn .35s .6s both}
.sa-card h2{margin:6px 0}.sa-card p{margin:6px 0}.sa-card .sa-pl{display:flex;justify-content:center}.sa-card .sa-pl svg{max-width:100%;height:auto}
.sa-card .row-btns{flex-direction:column;align-items:stretch;gap:8px;margin-top:12px}.sa-card .row-btns .btn{min-height:52px;width:100%;max-width:none;flex:0 0 auto;margin:0;justify-content:center}
.sa-fact{background:#FFF6D8;border-radius:16px;padding:10px 12px;text-align:left;margin:10px 0;font-size:15px;line-height:1.45}.sa-fact b{color:#C07A00}
.sa-rew{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;font-weight:800}.sa-rew span{background:#F3EEFF;border-radius:12px;padding:5px 10px}
.sa-howto{text-align:left;font-size:15px;margin:8px 0;padding-left:20px}.sa-howto li{margin:3px 0}
.sa-say{font-size:13px;padding:6px 12px;border-radius:12px;border:0;background:#EEF2FF;font:inherit;cursor:pointer}
@media (prefers-reduced-motion: reduce){.sa-sc b.pop{animation:none}.sa-sticker.on{transform:none!important}}`;
    document.head.appendChild(s);
  }

  /* ---------- экран-хаб: билеты, планеты, наклейки ---------- */
  let flight = null, sel = null;
  SCREENS.spacetrip = (arg, keep) => {
    ensureCss(); if (!keep) sel = null;
    if (!open()) { app.innerHTML = `${topbar('🚀 Космическая аркада', 'starmap')}<div class="page center"><div class="big-emoji">🚀🔒</div><h2>Ракета ещё строится!</h2><p>Космическая аркада откроется, когда ты решишь <b>${NEED}</b> задач в Школе и делах. Сейчас: <b>${solvedTotal()}</b>.</p><span class="bar"><i style="width:${Math.min(100, solvedTotal() / NEED * 100)}%"></i></span><div class="row-btns" style="justify-content:center"><button class="btn pink" data-go="newcase">🔍 Решать задачи</button></div></div>`; return; }
    const A = st(), cp = cpIndex(), n = tickets(), left = toNext();
    if (sel == null || sel > Math.min(cp, PL.length - 1)) sel = Math.min(cp, PL.length - 1);
    const got = PL.filter(p => A.done[p.id]).length, outfit = S.owned.includes(OUTFIT);
    app.innerHTML = `${topbar('🚀 Космическая аркада', 'starmap')}<div class="page trip sa-hub">
      <div class="sa-tk"><div class="sa-tk-ic">🎫</div><div><b>Космических билетов: <span id="satk">${n}</span></b><small>Билет даётся за каждые ${TICKET} решённых задач. Учишься — летаешь!</small><span class="bar"><i style="width:${Math.round((TICKET - left) / TICKET * 100)}%"></i></span><small>До следующего билета: ещё ${left} ${plural(left, 'задача', 'задачи', 'задач')}</small></div></div>
      <div class="trip-map">${PL.map((p, i) => { const d = A.done[p.id], av = i <= cp; return `<button class="tp ${d ? 'done' : ''} ${av ? '' : 'lock'} ${i === sel ? 'sel' : ''}" data-i="${i}" data-p="${p.id}" aria-label="${p.name}">${planet(p, 0.55)}<b>${p.name}</b><small>${d ? '★'.repeat(A.best[p.id] || 1) + '☆'.repeat(3 - (A.best[p.id] || 1)) : av ? 'чекпоинт' : '🔒'}</small></button>`; }).join('')}</div>
      <button class="btn big pink sa-fly" id="stFly" ${n ? '' : 'disabled'}>🚀 Полететь: ${PL[sel].name} · 🎫 1</button>
      ${n ? '' : `<p class="sa-nofly">Билетов пока нет. Реши ещё <b>${left}</b> ${plural(left, 'задачу', 'задачи', 'задач')} — и полетим! <button class="btn sm" data-go="newcase">🔍 Решать задачи</button></p>`}
      <div class="card small"><h3>🕹️ Как играть</h3><ul class="howto"><li>Веди ракету пальцем по экрану (на компьютере — стрелками).</li><li>⭐ и 🍬 собирай, ⛽ хватай — без топлива ракета теряет сердечко.</li><li>Облетай астероиды: у тебя 3 ❤️ на каждую планету.</li><li>Долетишь — узнаешь настоящий факт о планете и получишь наклейку. Каждая планета — чекпоинт.</li></ul></div>
      <h3>🌌 Космические наклейки <small>(${got}/${PL.length})</small></h3><div class="sa-stk">${PL.map(p => sticker(p, A.done[p.id])).join('')}</div>
      <div class="sa-prize ${outfit ? 'on' : ''}"><span>🌌</span><div><b>Звёздный плащ космонавта</b><br><small>${outfit ? 'Твой! Надень его в Кондитерской 👗' : 'Особый наряд за полёт через все 8 планет'}</small></div></div></div>`;
    $$('.tp', app).forEach(b => b.addEventListener('click', () => { if (b.classList.contains('lock')) { SND.tap(); toast('Сначала долети до предыдущей планеты 🚀'); return; } SND.tap(); sel = +b.dataset.i; SCREENS.spacetrip(null, true); }));
    $('#stFly', app).addEventListener('click', () => {
      if (tickets() < 1) { SND.bad(); toast(`<span class="tb">🎫</span><div>Нужен космический билет — реши ещё ${toNext()} ${plural(toNext(), 'задачу', 'задачи', 'задач')}!</div>`); return; }
      const A2 = st(); A2.used++; A2.flights = (A2.flights || 0) + 1; save(); flight = { spare: 1 }; SND.tap(); go('spacefly', PL[sel].id);
    });
  };
  SCREENS.mission = () => go('spacetrip'); // старый адрес миссий ведёт в аркаду

  /* ---------- графика ---------- */
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  function emojiSprite(ch, px, dpr) { const c = mkCanvas(px * dpr * 1.3, px * dpr * 1.3), x = c.getContext('2d'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${px * dpr}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; x.fillText(ch, c.width / 2, c.height / 2 + px * dpr * 0.06); return c; }
  function rockSprite(R, col, dpr, seed) {
    const c = mkCanvas(R * 2.4 * dpr, R * 2.4 * dpr), x = c.getContext('2d'), m = c.width / 2; x.scale(dpr, dpr); const cm = m / dpr;
    let r = seed; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    x.beginPath(); const N = 11; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, rr = R * (0.78 + rnd() * 0.3); x[i ? 'lineTo' : 'moveTo'](cm + Math.cos(a) * rr, cm + Math.sin(a) * rr); } x.closePath();
    const g = x.createRadialGradient(cm - R * .35, cm - R * .35, R * .1, cm, cm, R * 1.1); g.addColorStop(0, '#fff'); g.addColorStop(0.08, col); g.addColorStop(1, '#2A2230');
    x.fillStyle = g; x.fill(); x.lineWidth = 2.5; x.strokeStyle = 'rgba(20,10,30,.55)'; x.stroke();
    x.fillStyle = 'rgba(0,0,0,.22)'; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(cm + (rnd() - .5) * R, cm + (rnd() - .5) * R, R * (0.12 + rnd() * 0.14), 0, 7); x.fill(); }
    return c;
  }
  function planetSprite(p, R, dpr) {
    const ext = p.ring ? 1.9 : p.kind === 'uranus' ? 1.3 : 1.05, c = mkCanvas(R * 2 * ext * dpr, R * 2 * ext * dpr), x = c.getContext('2d'); x.scale(dpr, dpr);
    const cx = R * ext, cy = R * ext;
    const ring = front => { if (!p.ring && p.kind !== 'uranus') return; x.save(); x.translate(cx, cy); if (p.kind === 'uranus') x.rotate(1.45); else x.rotate(-0.18); x.beginPath(); x.ellipse(0, 0, R * (p.ring ? 1.75 : 1.3), R * (p.ring ? 0.42 : 0.3), 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); x.lineWidth = R * (p.ring ? 0.2 : 0.05); x.strokeStyle = p.ring ? 'rgba(214,180,110,.9)' : 'rgba(200,250,255,.55)'; x.stroke(); x.restore(); };
    ring(false);
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip();
    const g = x.createRadialGradient(cx - R * .4, cy - R * .45, R * .1, cx, cy, R * 1.05); g.addColorStop(0, '#fff8ee'); g.addColorStop(0.18, p.c); g.addColorStop(1, p.c2); x.fillStyle = g; x.fillRect(cx - R, cy - R, R * 2, R * 2);
    let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    if (p.kind === 'bands' || p.kind === 'swirl') { for (let k = -5; k <= 5; k++) { x.fillStyle = k % 2 ? 'rgba(120,70,30,.18)' : 'rgba(255,255,255,.12)'; x.beginPath(); x.ellipse(cx, cy + k * R * 0.19, R * 1.2, R * (p.kind === 'swirl' ? 0.05 : 0.07), p.kind === 'swirl' ? 0.25 : 0, 0, 7); x.fill(); } if (p.id === 'jupiter') { x.fillStyle = '#C4553A'; x.beginPath(); x.ellipse(cx + R * .3, cy + R * .35, R * .22, R * .12, 0, 0, 7); x.fill(); } }
    if (p.kind === 'craters' || p.kind === 'mars') { x.fillStyle = p.kind === 'mars' ? 'rgba(90,25,10,.3)' : 'rgba(0,0,0,.18)'; for (let k = 0; k < 9; k++) { x.beginPath(); x.arc(cx + (rnd() - .5) * R * 1.6, cy + (rnd() - .5) * R * 1.6, R * (0.06 + rnd() * 0.14), 0, 7); x.fill(); } if (p.kind === 'mars') { x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.ellipse(cx, cy - R * .93, R * .35, R * .12, 0, 0, 7); x.fill(); } }
    if (p.kind === 'earth') { x.fillStyle = '#4DB45A'; [[-.3, -.2, .32, .22], [.35, .15, .26, .34], [-.2, .45, .2, .14]].forEach(([a, b, w, h]) => { x.beginPath(); x.ellipse(cx + a * R, cy + b * R, w * R, h * R, a, 0, 7); x.fill(); }); x.fillStyle = 'rgba(255,255,255,.55)'; [[-.1, -.55], [.3, -.25], [-.45, .25]].forEach(([a, b]) => { x.beginPath(); x.ellipse(cx + a * R, cy + b * R, R * .3, R * .06, .2, 0, 7); x.fill(); }); }
    if (p.kind === 'neptune') { x.fillStyle = 'rgba(10,20,80,.45)'; x.beginPath(); x.ellipse(cx - R * .25, cy + R * .2, R * .2, R * .11, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(cx + R * .2, cy - R * .3, R * .3, R * .05, 0, 0, 7); x.fill(); }
    x.restore();
    x.beginPath(); x.arc(cx, cy, R, 0, 7); x.lineWidth = Math.max(1.5, R * 0.04); x.strokeStyle = 'rgba(0,0,0,.25)'; x.stroke();
    ring(true);
    return { c, ext };
  }
  function catImage() { // котик игрока как картинка для иллюминатора ракеты
    const img = new Image(); try { img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(myCat({ smile: true, happy: true })); } catch (e) { } return img;
  }

  /* ---------- сама аркада ---------- */
  SCREENS.spacefly = pid => {
    ensureCss();
    let li = PL.findIndex(p => p.id === pid); if (li < 0 || !open() || !flight) return go('spacetrip');
    app.innerHTML = `<div class="sa-wrap" id="sa"><canvas id="sacv" aria-label="Космическая аркада: веди ракету пальцем или стрелками"></canvas>
      <div class="sa-hud"><div class="sa-row"><span class="sa-hearts" id="sah" aria-label="Сердечки"></span><span class="sa-sc">⭐ <b id="sast">0</b> &nbsp;🍬 <b id="sacn">0</b></span><button class="sa-btn" id="sap" aria-label="Пауза">⏸</button></div>
        <div class="sa-row"><span class="sa-lbl">⛽</span><i class="sa-bar fuel" id="safb"><b id="saf"></b></i></div>
        <div class="sa-row"><span class="sa-lbl">🪐</span><i class="sa-bar"><b id="sad"></b></i><small id="san"></small></div></div>
      <div class="sa-ov" id="sao" hidden></div></div>`;
    const cv = $('#sacv'), ctx = cv.getContext('2d'), ov = $('#sao'), rm = RM();
    const catImg = catImage();
    let W = 0, H = 0, dpr = 1, s = 1, raf = 0, last = 0, alive = true;
    const g = { state: 'intro', t: 0, dur: 60, hearts: 3, fuel: 100, stars: 0, candies: 0, inv: 0, shake: 0, flash: 0, x: 0, y: 0, tx: 0, ty: 0, objs: [], parts: [], pops: [], acc: {}, at: 0, fuelHits: 0, drag: null, keys: {}, scroll: 0 };
    let SPR = {}, bg = null, bgStars = [], P = null, pSpr = null, hudCache = {};
    window.__spaceArcade = g; // для автотестов

    const resize = () => {
      const r = cv.getBoundingClientRect(); const nW = Math.max(240, r.width || innerWidth), nH = Math.max(300, r.height || innerHeight);
      const fx = W ? g.x / W : 0.5, fy = H ? g.y / H : 0.8;
      W = nW; H = nH; dpr = Math.min(2, window.devicePixelRatio || 1); s = Math.max(0.8, Math.min(1.35, Math.min(W, H) / 420));
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      g.x = g.tx = fx * W; g.y = g.ty = fy * H; buildArt();
    };
    function buildArt() {
      P = PL[li];
      SPR = { star: emojiSprite('⭐', 30 * s, dpr), candy: emojiSprite('🍬', 30 * s, dpr), fuel: emojiSprite('⛽', 32 * s, dpr), rocks: [0, 1, 2, 3].map(k => rockSprite(26 * s, P.rock, dpr, 11 + k * 37 + li * 5)) };
      bg = mkCanvas(W * dpr, H * dpr); const b = bg.getContext('2d'), gr = b.createLinearGradient(0, 0, 0, H * dpr); gr.addColorStop(0, P.bg[0]); gr.addColorStop(1, P.bg[1]); b.fillStyle = gr; b.fillRect(0, 0, bg.width, bg.height);
      for (let k = 0; k < 3; k++) { const cx = (0.2 + 0.3 * k + Math.random() * 0.2) * bg.width, cy = Math.random() * bg.height, rr = (0.35 + Math.random() * 0.3) * Math.max(bg.width, bg.height) * 0.5, ng = b.createRadialGradient(cx, cy, 0, cx, cy, rr); ng.addColorStop(0, P.neb + '33'); ng.addColorStop(1, P.neb + '00'); b.fillStyle = ng; b.fillRect(0, 0, bg.width, bg.height); }
      const n = Math.round(Math.min(110, W * H / 5200)); bgStars = Array.from({ length: n }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, l: i % 3, a: 0.4 + Math.random() * 0.6 }));
      pSpr = planetSprite(P, Math.min(W, H) * 0.3, dpr);
    }
    const setOv = html => { ov.innerHTML = html; ov.hidden = !html; };
    const hearts = () => '❤️'.repeat(g.hearts) + '🤍'.repeat(Math.max(0, 3 - g.hearts));
    function hud() {
      const p = Math.min(1, g.t / g.dur), f = Math.max(0, Math.min(100, g.fuel));
      if (hudCache.h !== g.hearts) { hudCache.h = g.hearts; $('#sah').textContent = hearts(); }
      if (hudCache.s !== g.stars) { const e = $('#sast'); hudCache.s = g.stars; e.textContent = g.stars; if (!rm) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
      if (hudCache.c !== g.candies) { const e = $('#sacn'); hudCache.c = g.candies; e.textContent = g.candies; if (!rm) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
      const fr = Math.round(f), pr = Math.round(p * 200) / 2;
      if (hudCache.f !== fr) { hudCache.f = fr; $('#saf').style.width = fr + '%'; $('#safb').classList.toggle('low', fr < 25); }
      if (hudCache.p !== pr) { hudCache.p = pr; $('#sad').style.width = pr + '%'; }
      if (hudCache.n !== li) { hudCache.n = li; $('#san').textContent = P.name; }
    }

    /* звуки и отклик */
    let lastBeep = 0, combo = 0, comboT = 0;
    const beep = seq => { const t = performance.now(); if (t - lastBeep < 55) return; lastBeep = t; try { M.tone(seq); } catch (e) { } };
    const haptic = p => { try { M.haptic(p); } catch (e) { } };
    const burst = (x, y, col, n, sp = 160) => { n = rm ? Math.ceil(n / 3) : n; for (let i = 0; i < n && g.parts.length < 180; i++) { const a = Math.random() * Math.PI * 2, v = sp * (0.3 + Math.random() * 0.7) * s; g.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.4 + Math.random() * 0.4, c: col, r: (2 + Math.random() * 3) * s }); } };
    const pop = (x, y, txt, col) => { if (g.pops.length < 12) g.pops.push({ x, y, txt, col, life: 0 }); };

    function spawn(type) {
      const p = Math.min(1, g.t / g.dur), sp = (H / 700) * (115 + li * 9 + p * 40);
      if (type === 'rock') { const R = (15 + Math.random() * 15) * s; g.objs.push({ type, x: R + Math.random() * (W - 2 * R), y: -R - 10, r: R, vy: sp * (0.85 + Math.random() * 0.35), vx: (Math.random() - .5) * 30 * s, rot: Math.random() * 6, vr: (Math.random() - .5) * 2, k: (Math.random() * 4) | 0 }); return; }
      const r = (type === 'fuel' ? 17 : 14) * s; g.objs.push({ type, x: r + Math.random() * (W - 2 * r), y: -r - 10, r, vy: sp * 0.9, vx: 0, rot: 0, vr: 0, ph: Math.random() * 6 });
    }
    function hurt(why) {
      if (g.inv > 0 && why !== 'fuel') return;
      g.hearts--; g.inv = 1.6; g.flash = 0.35; if (!rm) g.shake = 9 * s; haptic([50, 40, 90]);
      beep([[220, 0.16, 0, 'triangle', 0.22], [150, 0.25, 0.1, 'triangle', 0.2]]);
      burst(g.x, g.y, '#FF7A5A', 16, 220); pop(g.x, g.y - 40 * s, why === 'fuel' ? 'Топливо кончилось!' : 'Ой!', '#FF9A9A');
      combo = 0;
      if (g.hearts <= 0) gameOver();
    }
    function collect(o) {
      if (o.type === 'star') { g.stars++; combo++; comboT = 1.2; burst(o.x, o.y, '#FFE36B', 8); beep([[880 + Math.min(combo, 8) * 60, 0.07, 0, 'sine', 0.12]]); if (combo > 0 && combo % 5 === 0) pop(o.x, o.y - 20, 'Серия ×' + combo + '!', '#FFE36B'); }
      if (o.type === 'candy') { g.candies++; burst(o.x, o.y, '#FF8FB1', 10); beep([[988, 0.08, 0, 'sine', 0.14], [1319, 0.14, 0.06, 'sine', 0.12]]); haptic(12); pop(o.x, o.y - 20, '+1 🍬', '#FFB3CC'); }
      if (o.type === 'fuel') { g.fuel = Math.min(100, g.fuel + 38); burst(o.x, o.y, '#7CF0A8', 12); beep([[440, 0.06, 0, 'sine', 0.14], [660, 0.08, 0.05, 'sine', 0.14], [880, 0.12, 0.1, 'sine', 0.12]]); haptic(20); pop(o.x, o.y - 20, '⛽ +топливо', '#9CF5BE'); }
    }

    function update(dt) {
      const play = g.state === 'play', p = Math.min(1, g.t / g.dur);
      if (play) g.t += dt;
      const scrollV = (H / 700) * (play ? 90 + li * 6 + p * 30 : g.state === 'arrive' ? 40 : 30);
      g.scroll += scrollV * dt;
      // управление
      const kx = (g.keys.ArrowRight || g.keys.d ? 1 : 0) - (g.keys.ArrowLeft || g.keys.a ? 1 : 0), ky = (g.keys.ArrowDown || g.keys.s ? 1 : 0) - (g.keys.ArrowUp || g.keys.w ? 1 : 0);
      const minY = H * 0.32, maxY = H - 46 * s, pad = 24 * s;
      if (g.state === 'arrive') { g.at += dt; const k = Math.min(1, dt * 2.2); g.x += (W / 2 - g.x) * k; g.y += (H * 0.3 - g.y) * k; }
      else if (play) {
        if (kx || ky) { const v = Math.max(260, W * 0.85); g.x += kx * v * dt; g.y += ky * v * 0.8 * dt; g.tx = g.x; g.ty = g.y; }
        else { const k = Math.min(1, dt * 16); g.x += (g.tx - g.x) * k; g.y += (g.ty - g.y) * k; }
        g.x = Math.max(pad, Math.min(W - pad, g.x)); g.y = Math.max(minY, Math.min(maxY, g.y));
        g.fuel -= (4.2 + li * 0.15) * dt; if (g.fuel <= 0) { g.fuel = 60; g.fuelHits++; hurt('fuel'); if (g.state !== 'play') return; }
        if (p < 0.96) {
          const rates = { rock: 0.5 + li * 0.08 + p * 0.35, star: 1.5, candy: 0.42, fuel: g.fuel < 45 ? 0.32 : 0.12 };
          for (const k in rates) { g.acc[k] = (g.acc[k] || 0) + rates[k] * dt * (0.5 + Math.random()); while (g.acc[k] >= 1) { g.acc[k]--; spawn(k); } }
        }
        if (g.t >= g.dur) startArrive();
      }
      if (g.inv > 0) g.inv -= dt; if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 30); if (g.flash > 0) g.flash -= dt;
      if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
      // объекты
      const hx = g.x, hy = g.y - 4 * s, hr = 14 * s;
      for (let i = g.objs.length - 1; i >= 0; i--) {
        const o = g.objs[i]; o.y += o.vy * dt; o.x += o.vx * dt; o.rot += o.vr * dt;
        if (o.type !== 'rock' && play) { const dx = hx - o.x, dy = hy - o.y, d = Math.hypot(dx, dy); if (d < 90 * s && d > 1) { o.x += dx / d * 160 * s * dt; o.y += dy / d * 160 * s * dt; } } // лёгкий магнит
        const d = Math.hypot(o.x - hx, o.y - hy);
        if (play && o.type === 'rock' && d < o.r * 0.82 + hr) { burst(o.x, o.y, '#C9B8A8', 12, 200); g.objs.splice(i, 1); hurt('rock'); if (g.state !== 'play') return; continue; }
        if (play && o.type !== 'rock' && d < o.r + hr + 6 * s) { collect(o); g.objs.splice(i, 1); continue; }
        if (g.state === 'arrive' && o.type === 'rock') { burst(o.x, o.y, '#FFE36B', 6); g.objs.splice(i, 1); continue; }
        if (o.y > H + 50 || o.x < -60 || o.x > W + 60) g.objs.splice(i, 1);
      }
      // выхлоп
      if (!rm || Math.random() < 0.35) { if (g.parts.length < 180) g.parts.push({ x: g.x + (Math.random() - .5) * 8 * s, y: g.y + 30 * s, vx: (Math.random() - .5) * 30 * s, vy: (120 + Math.random() * 80) * s, life: 0, max: 0.35 + Math.random() * 0.2, c: Math.random() < .5 ? '#FFB347' : '#FFE36B', r: (2.5 + Math.random() * 2.5) * s }); }
      for (let i = g.parts.length - 1; i >= 0; i--) { const q = g.parts[i]; q.life += dt; if (q.life >= q.max) { g.parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; q.vy *= 0.97; }
      for (let i = g.pops.length - 1; i >= 0; i--) { const q = g.pops[i]; q.life += dt; q.y -= 40 * dt; if (q.life > 1) g.pops.splice(i, 1); }
      if (g.state === 'arrive' && g.at > 1.9) finishLevel();
    }

    function drawRocket() {
      if (g.inv > 0 && g.state === 'play' && Math.floor(g.inv * 10) % 2) return;
      const x = g.x, y = g.y, k = s;
      ctx.save(); ctx.translate(x, y); const tilt = Math.max(-0.35, Math.min(0.35, (g.tx - g.x) / (W * 0.25))); ctx.rotate(g.state === 'play' ? tilt * 0.6 : 0);
      // пламя
      const fl = 18 + Math.sin(performance.now() / 45) * 5; ctx.fillStyle = '#FFB347'; ctx.beginPath(); ctx.moveTo(-9 * k, 24 * k); ctx.quadraticCurveTo(0, (30 + fl) * k, 9 * k, 24 * k); ctx.fill();
      ctx.fillStyle = '#FFF3A0'; ctx.beginPath(); ctx.moveTo(-5 * k, 24 * k); ctx.quadraticCurveTo(0, (26 + fl * .6) * k, 5 * k, 24 * k); ctx.fill();
      // крылья
      ctx.fillStyle = '#FF5E92'; ctx.strokeStyle = '#3B2A4A'; ctx.lineWidth = 2.5 * k;
      [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(sd * 12 * k, 4 * k); ctx.lineTo(sd * 24 * k, 22 * k); ctx.lineTo(sd * 12 * k, 20 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); });
      // корпус
      ctx.fillStyle = '#F4F1FF'; ctx.beginPath(); ctx.moveTo(0, -34 * k); ctx.bezierCurveTo(16 * k, -22 * k, 16 * k, 8 * k, 12 * k, 24 * k); ctx.lineTo(-12 * k, 24 * k); ctx.bezierCurveTo(-16 * k, 8 * k, -16 * k, -22 * k, 0, -34 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FF5E92'; ctx.beginPath(); ctx.moveTo(0, -34 * k); ctx.bezierCurveTo(7 * k, -29 * k, 10 * k, -25 * k, 11.5 * k, -21 * k); ctx.lineTo(-11.5 * k, -21 * k); ctx.bezierCurveTo(-10 * k, -25 * k, -7 * k, -29 * k, 0, -34 * k); ctx.fill();
      // иллюминатор с котиком
      ctx.save(); ctx.beginPath(); ctx.arc(0, -4 * k, 10.5 * k, 0, 7); ctx.fillStyle = '#BFE8FF'; ctx.fill(); ctx.clip();
      if (catImg.complete && catImg.naturalWidth) { const iw = 34 * k, ih = iw * 248 / 210; ctx.drawImage(catImg, -iw * 100 / 210, -4 * k - ih * 0.43, iw, ih); }
      else { ctx.fillStyle = '#F4A04A'; ctx.beginPath(); ctx.arc(0, -2 * k, 8 * k, 0, 7); ctx.fill(); }
      ctx.restore(); ctx.beginPath(); ctx.arc(0, -4 * k, 10.5 * k, 0, 7); ctx.lineWidth = 3 * k; ctx.strokeStyle = '#7C9CFF'; ctx.stroke();
      ctx.restore();
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (g.shake > 0) ctx.translate((Math.random() - .5) * g.shake, (Math.random() - .5) * g.shake);
      ctx.drawImage(bg, 0, 0, W, H);
      // звёзды-параллакс
      ctx.fillStyle = '#fff';
      for (const q of bgStars) { const sp = [0.25, 0.55, 1][q.l], yy = (q.y + g.scroll * sp) % H; ctx.globalAlpha = q.a * (0.6 + 0.4 * q.l / 2); const z = (q.l + 1) * 0.8; ctx.fillRect(q.x, yy, z, rm ? z : z * (1 + q.l * 0.8)); }
      ctx.globalAlpha = 1;
      // планета назначения растёт по мере полёта
      const p = Math.min(1, g.t / g.dur), pk = g.state === 'arrive' ? 1 + Math.min(1, g.at / 1.9) * 0.15 : p, R0 = Math.min(W, H) * 0.3, R = R0 * (0.12 + 0.88 * pk * pk), py = -R * 0.55 + (H * 0.16 + R * 0.55) * pk;
      if (pSpr) { const sz = R * 2 * pSpr.ext; ctx.drawImage(pSpr.c, W / 2 - sz / 2, py - sz / 2, sz, sz); }
      // объекты
      const now = performance.now() / 1000;
      for (const o of g.objs) {
        if (o.type === 'rock') { const sp = SPR.rocks[o.k], sz = o.r * 2.4; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot); ctx.drawImage(sp, -sz / 2, -sz / 2, sz, sz); ctx.restore(); continue; }
        const sp = SPR[o.type], tw = o.type === 'star' && !rm ? 1 + Math.sin(now * 6 + o.ph) * 0.12 : 1, sz = o.r * 2.6 * tw;
        if (o.type === 'fuel') { ctx.globalAlpha = 0.35 + 0.15 * Math.sin(now * 5 + o.ph); ctx.fillStyle = '#7CF0A8'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 1.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
        ctx.drawImage(sp, o.x - sz / 2, o.y - sz / 2, sz, sz);
      }
      for (const q of g.parts) { ctx.globalAlpha = 1 - q.life / q.max; ctx.fillStyle = q.c; ctx.fillRect(q.x - q.r / 2, q.y - q.r / 2, q.r, q.r); }
      ctx.globalAlpha = 1;
      if (g.state !== 'over') drawRocket();
      ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(16 * s)}px Nunito, system-ui, sans-serif`;
      for (const q of g.pops) { ctx.globalAlpha = Math.max(0, 1 - q.life); ctx.fillStyle = '#05081A'; ctx.fillText(q.txt, q.x + 1, q.y + 1); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); }
      ctx.globalAlpha = 1;
      if (g.flash > 0) { ctx.fillStyle = `rgba(255,70,70,${Math.min(0.35, g.flash)})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
    }
    const loop = now => {
      raf = 0; if (!alive) return;
      const dt = Math.min(0.066, Math.max(0, (now - last) / 1000)); last = now;
      if (g.state === 'play' || g.state === 'arrive' || g.state === 'intro') { update(dt); hud(); }
      draw();
      if (g.state === 'play' || g.state === 'arrive' || g.state === 'intro') raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf && alive) { last = performance.now(); raf = requestAnimationFrame(loop); } };

    /* состояния */
    function intro() {
      g.state = 'intro'; g.t = 0; g.dur = P.dur; g.hearts = 3; g.fuel = 100; g.inv = 0; g.objs.length = 0; g.acc = {}; g.at = 0; g.stars = 0; g.candies = 0; g.fuelHits = 0; g.x = g.tx = W / 2; g.y = g.ty = H * 0.78; hudCache = {};
      setOv(`<div class="sa-card"><div class="sa-pl">${planet(P, 1.3)}</div><h2>Курс на ${P.name}!</h2><p class="small">Планета ${li + 1} из ${PL.length} · полёт ${P.dur} секунд</p>
        <ul class="sa-howto"><li>👆 Веди ракету пальцем (или стрелками)</li><li>⭐ 🍬 — собирай, ⛽ — заправляйся</li><li>🪨 Астероиды облетай — у тебя 3 ❤️</li></ul>
        <div class="row-btns"><button class="btn big pink" id="saGo">🚀 Поехали!</button><button class="btn" id="saQuit">Выйти</button></div></div>`);
      $('#saGo').addEventListener('click', () => { SND.tap(); setOv(''); g.state = 'play'; try { M.sfx('whoosh'); } catch (e) { } haptic(20); kick(); });
      $('#saQuit').addEventListener('click', quit); kick();
    }
    function pause() { if (g.state !== 'play') return; g.state = 'paused'; setOv(`<div class="sa-card"><div class="big-emoji">⏸️</div><h2>Пауза</h2><p>Котик-космонавт ждёт тебя на орбите.</p><div class="row-btns"><button class="btn big pink" id="saRes">▶ Продолжить</button><button class="btn" id="saQuit">Выйти</button></div></div>`); $('#saRes').addEventListener('click', resume); $('#saQuit').addEventListener('click', quit); }
    function resume() { if (g.state !== 'paused') return; SND.tap(); setOv(''); g.state = 'play'; kick(); }
    function quit() { SND.tap(); flight = null; sel = null; go('spacetrip'); }
    function startArrive() { g.state = 'arrive'; g.at = 0; try { M.sfx('magic'); } catch (e) { } haptic([20, 40, 20]); }
    function finishLevel() {
      g.state = 'done'; const A = st(), first = !A.done[P.id], starsR = g.hearts; // ★ = сколько сердечек сохранил
      A.done[P.id] = 1; A.best[P.id] = Math.max(A.best[P.id] || 0, starsR); save();
      const c = Math.min(first ? 20 : 10, g.candies) + (first ? 5 : 0), xp = 10 + g.stars;
      const allNow = PL.every(x => A.done[x.id]), prize = allNow && !S.owned.includes(OUTFIT);
      if (prize) { S.owned.push(OUTFIT); save(); }
      award(c, xp); SND.win(); confetti(first ? 40 : 20);
      if (prize) { setTimeout(() => { awardGems(3, 'за полёт через всю Солнечную систему!'); confetti(70); }, 900); }
      const next = PL[li + 1];
      setOv(`<div class="sa-card"><div class="sa-pl">${planet(P, 1.5)}</div><h2>Прилетели: ${P.name}!</h2><div class="stars big">${'★'.repeat(starsR)}${'☆'.repeat(3 - starsR)}</div>
        <div class="sa-fact"><b>💡 Знаешь ли ты?</b><p>${P.fact}</p>${typeof speakRemote === 'function' ? '<button class="sa-say" id="saSay">🔊 Прочитать вслух</button>' : ''}</div>
        <div class="sa-rew"><span>⭐ ${g.stars}</span><span>🍬 +${c}</span>${first ? `<span>🏷️ Наклейка «${P.stk}»</span>` : ''}</div>
        ${prize ? '<p><b>🌌 Ты пролетел(а) всю Солнечную систему! Твой приз — «Звёздный плащ космонавта». Он уже в твоём гардеробе!</b></p>' : ''}
        <p class="small">✅ Чекпоинт сохранён${next ? ` — следующий полёт начнётся с планеты ${next.name}` : ''}.</p>
        <div class="row-btns">${next ? `<button class="btn big pink" id="saNext">🚀 Лететь дальше: ${next.name}</button>` : ''}<button class="btn ${next ? '' : 'big pink'}" id="saQuit">${next ? 'На карту полёта' : '🏠 На карту полёта'}</button></div></div>`);
      const say = $('#saSay'); if (say) say.addEventListener('click', () => { try { if (typeof wakeAudio === 'function') wakeAudio(); speakRemote(`${P.name}. ${P.fact}`); } catch (e) { } });
      const nb = $('#saNext'); if (nb) nb.addEventListener('click', () => { SND.tap(); li++; buildArt(); intro(); });
      $('#saQuit').addEventListener('click', quit);
    }
    function gameOver() {
      g.state = 'over'; haptic([60, 50, 60, 50, 120]); burst(g.x, g.y, '#FFB347', 30, 260); draw();
      const spare = flight && flight.spare > 0, tk = tickets();
      { setOv(`<div class="sa-card sa-late"><div class="big-emoji">🛠️🚀</div><h2>Ракете нужен ремонт!</h2><p>Ты собрал(а) ⭐ ${g.stars} и 🍬 ${g.candies}. Котик цел и машет лапкой 🐾</p>
        <p class="small">✅ Чекпоинт: планета ${P.name} — начнём отсюда, ничего не потеряно.</p>
        <div class="row-btns">${spare ? '<button class="btn big pink" id="saAgain">🚀 Запасная ракета — ещё попытка</button>' : tk ? `<button class="btn big pink" id="saTk">🎫 Ещё полёт (билетов: ${tk})</button>` : `<p class="small">Билеты кончились — реши ещё ${toNext()} ${plural(toNext(), 'задачу', 'задачи', 'задач')}, и будет новый!</p>`}<button class="btn" id="saQuit">Выйти</button></div></div>`);
        const a = $('#saAgain'); if (a) a.addEventListener('click', () => { flight.spare--; SND.tap(); intro(); });
        const t = $('#saTk'); if (t) t.addEventListener('click', () => { if (tickets() < 1) return; const A = st(); A.used++; A.flights = (A.flights || 0) + 1; save(); flight = { spare: 1 }; SND.tap(); intro(); });
        $('#saQuit').addEventListener('click', quit); }
    }

    /* ввод */
    const pt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', e => { if (g.state !== 'play') return; e.preventDefault(); const [x, y] = pt(e); g.drag = { id: e.pointerId, ox: g.x - x, oy: g.y - y }; try { cv.setPointerCapture(e.pointerId); } catch (er) { } });
    cv.addEventListener('pointermove', e => { if (!g.drag || g.drag.id !== e.pointerId) return; const [x, y] = pt(e); g.tx = x + g.drag.ox; g.ty = y + g.drag.oy; });
    const up = e => { if (g.drag && g.drag.id === e.pointerId) g.drag = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    $('#sap').addEventListener('click', () => { if (g.state === 'play') { SND.tap(); pause(); } else if (g.state === 'paused') resume(); });
    const KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, a: 1, d: 1, w: 1, s: 1 };
    keyHandler = e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (KEYS[k]) { e.preventDefault(); g.keys[k] = true; } else if (k === 'Escape' || k === 'p' || k === 'з') { g.state === 'play' ? pause() : resume(); } else if ((k === 'Enter' || k === ' ') && g.state === 'intro') { const b = $('#saGo'); if (b) { e.preventDefault(); b.click(); } } };
    const keyup = e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (KEYS[k]) g.keys[k] = false; };
    const vis = () => { if (document.hidden) { pause(); } };
    const blur = () => { g.keys = {}; pause(); };
    document.addEventListener('keyup', keyup); document.addEventListener('visibilitychange', vis); window.addEventListener('blur', blur); window.addEventListener('resize', resize);
    cleanups.push(() => { alive = false; if (raf) cancelAnimationFrame(raf); raf = 0; document.removeEventListener('keyup', keyup); document.removeEventListener('visibilitychange', vis); window.removeEventListener('blur', blur); window.removeEventListener('resize', resize); if (window.__spaceArcade === g) window.__spaceArcade = null; });
    // для автотестов: прокрутить симуляцию вперёд без ожидания кадров (в headless-браузере rAF бывает почти остановлен)
    g.step = sec => { for (let k = 0; k < Math.round(sec * 60) && alive && (g.state === 'play' || g.state === 'arrive' || g.state === 'intro'); k++) update(1 / 60); if (alive) { hud(); draw(); } };
    resize(); intro();
  };

  /* ---------- наклейки в «Моих наградах» ---------- */
  const wrapAwards = () => { const dp = SCREENS.diplomas; if (dp) SCREENS.diplomas = arg => { dp(arg); const pg = $('.page.diplomas', app); if (!pg || !S.trip || !S.trip.ar) return; ensureCss(); const A = S.trip.ar;
    pg.insertAdjacentHTML('beforeend', `<h3>🚀 Космические наклейки <small>(${PL.filter(p => A.done[p.id]).length}/${PL.length})</small></h3><div class="sa-stk">${PL.map(p => sticker(p, A.done[p.id])).join('')}</div>`); }; };
  // diplomas.js подключается позже — оборачиваем, когда все скрипты загружены
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wrapAwards); else wrapAwards();

  /* ---------- вход: из карты звёзд (и из телескопа — он открывает карту звёзд) ---------- */
  { const sm = SCREENS.starmap; if (sm) SCREENS.starmap = arg => { sm(arg); const pg = $('.page.starmap', app); if (pg) pg.insertAdjacentHTML('afterbegin', `<button class="btn big ${open() ? 'pink' : ''} trip-btn" data-go="spacetrip">🚀 Космическая аркада ${open() ? `<small>🎫 билетов: ${tickets()}</small>` : `<small>(откроется после ${NEED} задач: ${solvedTotal()}/${NEED})</small>`}</button>`); }; }
  ['spacetrip', 'mission', 'spacefly'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { PL, NEED, TICKET, open, tickets, toNext, OUTFIT, state: st };
})();
window.SpaceTrip = SpaceTrip;
