/* house.js — домик котика: комнаты, расстановка вещей пальцем, сундук с вещами, уход за котом */
'use strict';
const HL = window.Lines;
const OLD_FURN = { sofa: 20, plant: 10, pic: 15, tv: 30, fishtank: 40, clock: 20, bowl: 10, milk: 10, cake: 25, cookies: 15, teapot: 20, cupcakes: 35, bed: 30, teddy: 15, lamp: 15, books: 20, lights: 25, pillow: 15, map: 20, dossier: 15, flash: 15, phone: 20, puzzle: 25, case: 20, yarn: 10, balloons: 15, ball: 10, game: 30, kite: 15, paint: 20, tree: 25, sunflower: 15, fountain: 50, butterfly: 15, mushroom: 10, ladybug: 10, scope: 50, planet: 30, moon: 20, star: 15, rocket: 60, ufo: 70 };
const CARE_RATE = { food: 5, water: 7, fun: 6, energy: 4, clean: 3 }; // убывание в час
const catItem = id => HL.CATALOG.find(c => c[0] === id);
const GEM_FURN = { unicorn: 6, castle: 8, dragon: 10, carousel: 12, ferris: 15, gem: 5 }; // особые вещи — только за 💎
/* аниме-наклейки вещей (img/items), если нарисованы; иначе эмодзи */
let ITEM_IMG = new Set(), ROOM_IMG = new Set();
fetch('img/items/index.json').then(r => r.json()).then(a => { ITEM_IMG = new Set(a); }).catch(() => { });
fetch('img/rooms/index.json').then(r => r.json()).then(a => { ROOM_IMG = new Set(a); }).catch(() => { });
const icon = (id, emo, cls = '') => ITEM_IMG.has(id) ? `<img class="ic-img ${cls}" src="img/items/${id}.webp" alt="" draggable="false">` : emo;
const roomOpen = r => r.need <= solvedTotal() && (r.eq || 0) <= S.st.eq.done;
const itemEq = c => (c[5] === 'Волшебство' || c[5] === 'Космос') ? Math.max(3, Math.round(c[4] / 4)) : 0; // волшебные и космические вещи — за уравнения
const itemOpen = c => c[4] <= solvedTotal() && itemEq(c) <= S.st.eq.done;
function lockText(r) { const t = Math.max(0, r.need - solvedTotal()), e = Math.max(0, (r.eq || 0) - S.st.eq.done); return [t ? `ещё ${t} ${plural(t, 'задачу', 'задачи', 'задач')}` : '', e ? `ещё ${e} ${plural(e, 'уравнение', 'уравнения', 'уравнений')} 📦` : ''].filter(Boolean).join(' и '); }

/* переход со старого домика: возвращаем конфеты за прежнюю мебель */
function houseMigrate() {
  if (S.houseV === 2) return;
  let refund = 0; (S.furn || []).forEach(id => { refund += OLD_FURN[id] || 0; });
  S.furn = []; S.place = {}; S.catAt = {}; S.houseV = 2;
  S.care = S.care || { food: 85, water: 85, fun: 85, energy: 85, clean: 85, t: Date.now() };
  ['kitchen', 'living'].forEach(r => { if (!S.roomsSeen.includes(r)) S.roomsSeen.push(r); });
  if (refund) { S.candies += refund; S.houseRefund = refund; }
  save();
}
/* потребности котика убывают со временем, но не ниже 5 — котик только грустит */
function careNow() {
  houseMigrate();
  const c = S.care, h = (Date.now() - c.t) / 3.6e6;
  if (h > 0.02) {
    for (const k in CARE_RATE) { const room = HL.ROOMS.find(r => r.id === HL.CARE[k].room); if (room && roomOpen(room)) c[k] = Math.max(5, c[k] - CARE_RATE[k] * h); }
    c.t = Date.now(); save();
  }
  return c;
}
function careLow() { const c = careNow(); return Object.keys(HL.CARE).filter(k => roomOpen(HL.ROOMS.find(r => r.id === HL.CARE[k].room)) && c[k] < 35).sort((a, b) => c[a] - c[b]); }
function careAlertHTML() {
  const low = careLow(); if (!low.length) return '';
  const k = low[0], C = HL.CARE[k];
  return `<button class="care-alert" data-go="house" data-arg="${C.room}">😿 ${C.low} <b>→</b></button>`;
}

function roomPlace(room) {
  S.place = S.place || {}; S.catAt = S.catAt || {};
  if (!S.place[room.id]) { S.place[room.id] = room.fixed.map(f => ({ id: f[0], x: f[3], y: f[4] })); save(); }
  room.fixed.forEach(f => { if (!S.place[room.id].some(p => p.id === f[0])) S.place[room.id].push({ id: f[0], x: f[3], y: f[4] }); });
  return S.place[room.id];
}
function placedIds() { return Object.values(S.place || {}).flat().map(p => p.id); }
function itemInfo(room, id) {
  const f = room.fixed.find(x => x[0] === id); if (f) return { icon: f[1], name: f[2], care: f[5], line: f[6], fixed: true };
  const c = catItem(id); return c ? { icon: c[1], name: c[2], line: c[6], cat: c[5], wall: !!c[7] } : null;
}

/* ================= ЭКРАН: Домик ================= */
// размер вещи в % ширины комнаты (кот ≈ 15%)
const FSIZE = { fx_bed: 30, fx_sofa: 28, fx_tub: 27, fx_bowl: 8, fx_water: 8, fx_stove: 13, fx_lamp: 9, fx_yarn: 7, fx_scratch: 15, fx_duck: 6, fx_soap: 6, fx_map: 17, fx_desk: 15, fx_house: 22, fx_tulip: 9, fx_scope: 18,
  chair: 15, plant: 10, pic: 11, clock: 9, tv: 15, lantern: 8, books: 9, mirror: 12, lights: 13, piano: 22, guitar: 13, drum: 12, trophy: 10, teddy: 10, ball: 7, balloons: 13, yoyo: 6, kite: 12, skate: 11, game: 9, train: 16, robot: 14, unicorn: 19, castle: 26, tent: 26, carousel: 28, ferris: 30,
  cake: 9, cookies: 8, cupcakes: 9, icecream: 8, candyjar: 9, lolly: 15, donuts: 12, choco: 17, fishtank: 15, butterfly: 6, chick: 6, parrot: 9, hamster: 7, turtle: 8, bunny: 8, gift: 10, confetti: 8, pinata: 12, fireworks: 17, rainbow: 24, crystal: 9, wand: 8, fairy: 10, gem: 9, genie: 15, dragon: 19,
  fx_pool: 30, fx_ring: 9, fx_mic: 12, fx_notes: 14, fx_shelf: 22, fx_globe: 11, fx_window: 20, fx_panel: 18, lamp2: 10, vase: 10, rug: 18, hammock: 24, bookcase: 15, catwheel: 22, plush: 18, blocks: 10, puzzle: 10, dollhouse: 20, bubbles: 10, slide: 24, trampoline: 24, scooter: 13, macarons: 11, pancakes: 10, jelly: 9, candyhouse: 20, chocofountain: 20, kitten: 9, puppy: 10, owlet: 8, snail: 7, ladybug: 6, balloonarch: 26, garland: 22, partyhat: 20, mirrorball: 11, magicbook: 10, potion: 8, magichat: 11, phoenix: 15, comet: 14, astronaut: 16, satellite: 14, rainbowtree: 26, pond: 24, palm: 22, rainbowfox: 10, beanbag: 14,
  star: 8, moon: 12, planet: 15, rocket: 19, ufo: 17, alien: 12, sunflower: 13, cactus: 11, mushroom: 8, tree: 28, snowman: 17, fountain: 24 };
const CAT_W = 15;
SCREENS.house = (roomId) => {
  houseMigrate();
  const ROOMS = HL.ROOMS; let cur = ROOMS.find(r => r.id === roomId) || ROOMS[0], placing = null, busy = false;
  app.innerHTML = `${topbar('Домик котика')}<div class="page house">
    <div class="care-bars" id="cb"></div>
    <div class="room-tabs" id="rt"></div>
    <div class="room big" id="room"></div>
    <div class="house-tools"><button class="btn sm" id="invb">🎒 Сундук с вещами <b id="invn"></b></button><button class="btn sm pink" id="hshop">🛍️ Магазин вещей</button></div>
    <div class="tray" id="tray" hidden></div><p class="small center" id="hint"></p></div>`;
  if (S.houseRefund) { const n = S.houseRefund; S.houseRefund = 0; save(); later(() => { modal(`<div class="big-emoji">🏠✨</div><h2>Домик обновился!</h2><p>Комнаты стали больше, вещи можно расставлять пальцем, а за котиком теперь можно ухаживать.</p><p>Конфеты за прежние покупки вернулись: <b>+${n} 🍬</b></p><button class="btn pink" data-close>Ура!</button>`); speakT(PH.room[3]); }, 300); }
  const roomEl = $('#room');
  const setUnit = () => roomEl.style.setProperty('--u', (roomEl.clientWidth / 100) + 'px');
  const ro = window.ResizeObserver ? new ResizeObserver(setUnit) : null; ro && ro.observe(roomEl); cleanups.push(() => ro && ro.disconnect());

  const drawCare = () => {
    const c = careNow();
    $('#cb').innerHTML = Object.entries(HL.CARE).map(([k, C]) => { const open = roomOpen(ROOMS.find(r => r.id === C.room)); return `<button class="cbar ${!open ? 'off' : c[k] < 35 ? 'low' : ''}" data-r="${C.room}" title="${C.name}"><span>${open ? C.icon : '🔒'}</span><i><b style="width:${open ? Math.round(c[k]) : 0}%"></b></i></button>`; }).join('');
    $$('.cbar', app).forEach(b => b.addEventListener('click', () => { const r = ROOMS.find(x => x.id === b.dataset.r); if (roomOpen(r)) { cur = r; SND.tap(); drawTabs(); drawRoom(); } else say((r.eq || 0) > S.st.eq.done ? PH.quest[0] : PH.room[1]); }));
  };
  const drawTabs = () => {
    $('#rt').innerHTML = ROOMS.map(r => `<button class="rtab ${r === cur ? 'on' : ''} ${roomOpen(r) ? '' : 'lock'}" data-r="${r.id}"><span>${roomOpen(r) ? r.icon : '🔒'}</span>${r.name}</button>`).join('');
    $$('.rtab', app).forEach(b => b.addEventListener('click', () => { if (busy) return; cur = ROOMS.find(r => r.id === b.dataset.r); placing = null; SND.tap(); drawTabs(); drawRoom(); }));
    $('.rtab.on', app)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };
  const invList = () => S.furn.filter(id => !placedIds().includes(id) && catItem(id));
  const hint = t => { $('#hint').innerHTML = t; };
  const drawRoom = () => {
    const open = roomOpen(cur), n = solvedTotal();
    roomEl.className = `room big ${cur.dark ? 'dark' : ''} ${open ? '' : 'closed'} ${placing ? 'placing' : ''} ${ROOM_IMG.has(cur.id) ? 'hasbg' : ''}`;
    roomEl.style.backgroundImage = ROOM_IMG.has(cur.id) ? `url('img/rooms/${cur.id}.jpg')` : '';
    roomEl.style.setProperty('--wall', cur.wall); roomEl.style.setProperty('--floor', cur.floor); setUnit();
    const pl = roomPlace(cur), low = careLow(), cat = S.catAt[cur.id] || { x: 78, y: 3 };
    roomEl.innerHTML = `<div class="wall"><div class="window">${cur.dark ? '✨' : '☁️'}</div></div><div class="floor"></div>
      ${pl.map(p => itemHTML(p, low)).join('')}
      <div class="room-cat" id="rcat" style="left:${cat.x}%;bottom:${cat.y}%;z-index:${zOf(cat.y) + 1}">${myCat()}</div>
      <div class="trash" id="trash">🗑️<small>в сундук</small></div>
      ${placing ? `<div class="ghost" id="ghost" style="--s:${FSIZE[placing] || 10}">${icon(placing, catItem(placing)[1])}</div>` : ''}
      ${open ? '' : `<div class="room-lock"><div class="big-emoji">🔒</div><h3>«${cur.name}»</h3><p>Чтобы открыть, реши <b>${lockText(cur)}</b>.</p><div class="bar"><i style="width:${Math.min(1, (Math.min(n, cur.need) + Math.min(S.st.eq.done, cur.eq || 0)) / (cur.need + (cur.eq || 0) || 1)) * 100}%"></i></div><p class="small">Задач: ${n} из ${cur.need} · уравнений: ${S.st.eq.done} из ${cur.eq || 0}</p>${(cur.eq || 0) > S.st.eq.done ? '<button class="btn pink sm" id="goeq">📦 Решать уравнения</button>' : ''}</div>`}`;
    $('#invn').textContent = invList().length || '';
    drawCare();
    if (!open) { hint(''); say((cur.eq || 0) > S.st.eq.done ? PH.quest[0] : PH.room[1]); const ge = $('#goeq'); if (ge) ge.addEventListener('click', goEquations); return; }
    hint(placing ? `👆 Нажми в комнате туда, куда поставить <b>${catItem(placing)[2]}</b>` : `${cur.care}. Нажми на вещь — котик ею воспользуется. Вещи и котика можно <b>перетаскивать пальцем</b>, а лишнее — утащить на 🗑️.`);
    $$('.fx', roomEl).forEach(b => pointerItem(b));
    pointerItem($('#rcat'), true);
  };
  const zOf = y => 200 - Math.round(y * 2);
  function itemHTML(p, low) {
    const it = itemInfo(cur, p.id); if (!it) return '';
    const needK = { food: 'food', water: 'water', sleep: 'energy', play: 'fun', wash: 'clean' }[it.care];
    return `<button class="fx ${it.fixed ? 'fixed' : ''} ${needK && low.includes(needK) ? 'needs' : ''}" data-id="${p.id}" style="left:${p.x}%;bottom:${p.y}%;z-index:${zOf(p.y)};--s:${FSIZE[p.id] || 10}">${icon(p.id, it.icon)}${it.care ? `<small class="ctag">${{ food: '🍽️', water: '💧', sleep: '💤', play: '🎾', wash: '🫧', rest: '🛋️' }[it.care]}</small>` : ''}</button>`;
  }
  /* одно касание = пользоваться, ведение пальцем = перетащить */
  function pointerItem(el, isCat) {
    el.addEventListener('pointerdown', e => {
      if (busy || placing) return; e.preventDefault(); el.setPointerCapture && el.setPointerCapture(e.pointerId);
      const R = roomEl.getBoundingClientRect(), sx = e.clientX, sy = e.clientY; let drag = false, xy = null;
      const trash = $('#trash');
      const move = ev => {
        if (!drag && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 10) return;
        if (!drag) { drag = true; el.classList.add('dragging'); if (!isCat && !el.classList.contains('fixed')) trash.classList.add('show'); }
        const x = Math.max(4, Math.min(96, (ev.clientX - R.left) / R.width * 100)), y = Math.max(0, Math.min(88, (R.bottom - ev.clientY) / R.height * 100 - 4));
        el.style.left = x + '%'; el.style.bottom = y + '%'; el.style.zIndex = 400; xy = [x, y];
        const T = trash.getBoundingClientRect(); trash.classList.toggle('over', ev.clientX > T.left - 10 && ev.clientX < T.right + 10 && ev.clientY > T.top - 10 && ev.clientY < T.bottom + 10);
      };
      const up = () => {
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        el.classList.remove('dragging'); trash.classList.remove('show');
        if (!drag) { isCat ? petRoomCat() : interact(el); return; }
        const over = trash.classList.contains('over'); trash.classList.remove('over'); M.haptic(10);
        if (isCat) { S.catAt[cur.id] = { x: xy[0], y: xy[1] }; save(); el.style.zIndex = zOf(xy[1]) + 1; return; }
        const pl = roomPlace(cur), p = pl.find(q => q.id === el.dataset.id);
        if (over && !el.classList.contains('fixed')) { S.place[cur.id] = pl.filter(q => q !== p); save(); say(HL.HOUSE_PH[1]); M.sfx('pop'); drawRoom(); return; }
        p.x = xy[0]; p.y = xy[1]; save(); el.style.zIndex = zOf(p.y); M.sfx('pop');
      };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  }
  /* поставить вещь из сундука: призрак следует за пальцем, касание — поставить */
  roomEl.addEventListener('pointermove', e => { const g = $('#ghost'); if (!g || !placing) return; const R = roomEl.getBoundingClientRect(); g.style.left = ((e.clientX - R.left) / R.width * 100) + '%'; g.style.bottom = Math.max(0, (R.bottom - e.clientY) / R.height * 100 - 4) + '%'; });
  roomEl.addEventListener('pointerup', e => {
    if (!placing) return; const R = roomEl.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, (e.clientX - R.left) / R.width * 100)), y = Math.max(0, Math.min(88, (R.bottom - e.clientY) / R.height * 100 - 4));
    roomPlace(cur).push({ id: placing, x, y }); save(); placing = null; confetti(10); M.sfx('pop'); say(HL.HOUSE_PH[0]); drawRoom();
  });

  /* ---------- кот пользуется вещами ---------- */
  const catEl = () => $('#rcat');
  const geo = b => ({ x: parseFloat(b.style.left), y: parseFloat(b.style.bottom), s: FSIZE[b.dataset.id] || 10, z: +b.style.zIndex });
  function catMoveTo(x, y, z, o = {}) { const c = catEl(); c.classList.add('walking'); c.style.left = x + '%'; c.style.bottom = y + '%'; if (z != null) c.style.zIndex = z; if (o.scale) c.style.setProperty('--cs', o.scale); return new Promise(r => setTimeout(() => { c.classList.remove('walking'); r(); }, 750)); }
  function catBack() { const c = catEl(); if (!c) return; const at = S.catAt[cur.id] || { x: 78, y: 3 }; c.className = 'room-cat'; c.style.removeProperty('--cs'); c.innerHTML = myCat(); catMoveTo(at.x, at.y, zOf(at.y) + 1); }
  function catFace(o) { const c = catEl(); if (c) c.innerHTML = myCat(o); }
  function parts(b, chars, n = 8, spread = 90) { const R = b.getBoundingClientRect(); for (let i = 0; i < n; i++) { const p = document.createElement('div'); p.className = 'heart'; p.textContent = pick(chars); p.style.left = (R.left + R.width * Math.random()) + 'px'; p.style.top = (R.top + R.height * 0.2) + 'px'; p.style.setProperty('--dx', (Math.random() * spread - spread / 2) + 'px'); p.style.animationDelay = (i * 0.12) + 's'; document.body.appendChild(p); setTimeout(() => p.remove(), 2600); } }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const bump = (k, v) => { const c = careNow(); c[k] = Math.min(100, c[k] + v); save(); drawCare(); };
  const anim = (b, cls, ms) => { b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls); setTimeout(() => b.classList.remove(cls), ms); };
  async function run(fn) { if (busy) return; busy = true; try { await fn(); } finally { busy = false; } }
  function interact(b) {
    const id = b.dataset.id, it = itemInfo(cur, id), c = careNow(), g = geo(b); if (!it) return;
    M.haptic(15);
    if (it.care === 'food') return openFood(b);
    if (it.care === 'water') { if (c.water >= 95) return say(HL.HOUSE_PH[6]); return run(async () => { await catMoveTo(g.x + g.s * 0.55, g.y, g.z + 1); catEl().classList.add('eating'); M.sfx('lap'); parts(b, ['💧', '💦'], 6); await wait(1600); catEl().classList.remove('eating'); bump('water', 100); catFace({ happy: true }); say(HL.CARE.water.ok); await wait(1200); catBack(); }); }
    if (it.care === 'sleep') { if (c.energy >= 95) return say(HL.HOUSE_PH[5]); return run(async () => {
      await catMoveTo(g.x - g.s * 0.12, g.y + g.s * 0.16, g.z + 1, { scale: 0.8 });
      const cc = catEl(); cc.classList.add('sleeping'); catFace({ happy: true }); b.classList.add('in-use');
      const bl = document.createElement('div'); bl.className = 'blanket'; bl.style.cssText = `left:${g.x + g.s * 0.12}%;bottom:${g.y + g.s * 0.14}%;width:${g.s * 0.6}%;z-index:${g.z + 2}`; roomEl.appendChild(bl);
      M.purr(4.5); M.sfx('snore'); parts(b, ['💤', '⭐', '🌙'], 9); say(PH.purr[0]);
      await wait(4500); bl.remove(); b.classList.remove('in-use'); cc.classList.remove('sleeping'); bump('energy', 100); anim(cc, 'm-happy', 700); say(HL.CARE.energy.ok); await wait(900); catBack(); }); }
    if (it.care === 'wash') { if (c.clean >= 95) return say(HL.HOUSE_PH[4]); return run(async () => {
      await catMoveTo(g.x, g.y + g.s * 0.44, g.z - 1, { scale: 0.85 }); catFace({ happy: true }); M.sfx('splash'); M.sfx('bubbles');
      const iv = setInterval(() => parts(b, ['🫧', '🫧', '💦', '✨'], 4, 140), 600); await wait(3200); clearInterval(iv);
      await catMoveTo(g.x + g.s * 0.6, g.y, g.z + 1, { scale: 1 }); const cc = catEl(); anim(cc, 'shaking', 900); parts(cc, ['💧', '💦'], 8, 160); M.sfx('splash'); await wait(900);
      bump('clean', 100); say(HL.CARE.clean.ok); await wait(800); catBack(); }); }
    if (it.care === 'rest') return run(async () => { await catMoveTo(g.x, g.y + g.s * 0.3, g.z + 1, { scale: 0.9 }); catFace({ happy: true }); M.purr(2.5); catEl().classList.add('m-purr'); say(it.line); bump('energy', 8); await wait(2600); catBack(); });
    if (id === 'fx_yarn' || id === 'ball') return run(async () => { // клубок катится, кот догоняет
      const to = Math.max(8, Math.min(92, g.x + (g.x < 50 ? 30 : -30))); b.classList.add('rolling'); b.style.left = to + '%'; M.sfx('bounce');
      await catMoveTo(to + (g.x < 50 ? -6 : 6), g.y, g.z + 1); anim(catEl(), 'm-happy', 600); M.meow({ shape: 'happy' }); b.classList.remove('rolling');
      const p = roomPlace(cur).find(q => q.id === id); p.x = to; save(); bump('fun', 22); say(careNow().fun >= 85 && c.fun < 85 ? HL.CARE.fun.ok : it.line); await wait(700); catBack(); });
    if (id === 'fx_scratch') return run(async () => { await catMoveTo(g.x + g.s * 0.35, g.y, g.z + 1); catEl().classList.add('scratching'); M.sfx('scratch'); await wait(1300); catEl().classList.remove('scratching'); bump('fun', 15); say(it.line); await wait(600); catBack(); });
    // вещи из магазина
    const near = (dx = 0.55) => catMoveTo(Math.max(4, Math.min(96, g.x + g.s * (g.x < 70 ? dx : -dx))), g.y, g.z + 1);
    const ACT = {
      piano: async () => { await near(); catEl().classList.add('playing'); M.sfx('melody'); parts(b, ['🎵', '🎶'], 10); await wait(2000); catEl().classList.remove('playing'); },
      guitar: async () => { await near(); catEl().classList.add('playing'); M.sfx('strum'); parts(b, ['🎸', '🎵'], 6); await wait(1300); catEl().classList.remove('playing'); },
      drum: async () => { await near(); catEl().classList.add('playing'); M.sfx('drum'); anim(b, 'boing', 900); await wait(1100); catEl().classList.remove('playing'); },
      tv: async () => { await catMoveTo(g.x, Math.max(0, g.y - 3), g.z + 2); b.classList.add('tv-on'); M.sfx('tv'); await wait(2500); b.classList.remove('tv-on'); },
      skate: async () => { await catMoveTo(g.x, g.y + g.s * 0.25, g.z + 1); const to = g.x < 50 ? 85 : 15; b.style.transition = 'left 1.4s ease-in-out'; b.style.left = to + '%'; catMoveTo(to, g.y + g.s * 0.25, g.z + 1); M.sfx('whoosh'); await wait(1500); b.style.transition = ''; roomPlace(cur).find(q => q.id === id).x = to; save(); },
      unicorn: async () => { await catMoveTo(g.x, g.y + g.s * 0.45, g.z + 1, { scale: 0.8 }); b.classList.add('rocking'); catEl().classList.add('rocking'); M.sfx('boing'); M.meow({ shape: 'happy' }); await wait(2400); b.classList.remove('rocking'); },
      train: async () => { M.sfx('chug'); b.style.transition = 'left 2.2s linear'; const x0 = g.x; b.style.left = (x0 < 50 ? 88 : 12) + '%'; await wait(2300); b.style.left = x0 + '%'; await wait(2300); b.style.transition = ''; },
      carousel: async () => { b.classList.add('spinning'); M.sfx('melody'); await wait(2600); b.classList.remove('spinning'); },
      ferris: async () => { b.classList.add('spinning'); M.sfx('magic'); await wait(2600); b.classList.remove('spinning'); },
      rocket: async () => { b.classList.add('launch'); M.sfx('whoosh'); parts(b, ['🔥', '✨', '💨'], 10); await wait(2600); b.classList.remove('launch'); },
      ufo: async () => { b.classList.add('hover'); M.sfx('magic'); parts(b, ['✨', '👽'], 6); await wait(2000); b.classList.remove('hover'); },
      tree: async () => { await catMoveTo(g.x, g.y + g.s * 0.6, g.z + 1, { scale: 0.8 }); anim(catEl(), 'm-happy', 600); M.meow({ shape: 'happy' }); await wait(1600); },
      fireworks: async () => { M.sfx('fire'); parts(b, ['🎆', '🎇', '✨', '💥'], 14, 200); await wait(1500); },
      fishtank: async () => { await near(0.5); M.sfx('bubbles'); parts(b, ['🫧', '🐟'], 6); M.trill(); await wait(1500); },
      fountain: async () => { M.sfx('splash'); parts(b, ['💧', '💦', '✨'], 12, 140); await wait(1500); },
      gift: async () => { anim(b, 'boing', 600); M.sfx('pop'); confetti(15); await wait(800); },
      pinata: async () => { b.classList.add('rocking'); M.sfx('pop'); parts(b, ['🍬', '🍭', '🍫'], 10, 160); await wait(1500); b.classList.remove('rocking'); },
      balloons: async () => { anim(b, 'floaty', 2000); M.sfx('boing'); await wait(1200); },
      kite: async () => { anim(b, 'floaty', 2000); M.sfx('whoosh'); await wait(1200); },
      mirror: async () => { await near(); catEl().classList.add('flip'); await wait(1400); catEl().classList.remove('flip'); },
      books: async () => { await near(); parts(b, ['📖', '✨'], 5); await wait(1400); },
      snowman: async () => { parts(b, ['❄️', '⛄', '❄️'], 12, 180); M.sfx('magic'); await wait(1500); },
      dragon: async () => { anim(b, 'boing', 700); M.sfx('fire'); parts(b, ['🔥', '✨'], 8); await wait(1500); },
    };
    return run(async () => {
      anim(b, 'boing', 600);
      if (ACT[id]) await ACT[id](); else {
        if (it.cat === 'Вкусняшки') { await near(); catEl().classList.add('eating'); M.crunch(4); await wait(1200); catEl().classList.remove('eating'); }
        else if (it.cat === 'Питомцы') { anim(b, 'hop', 900); M.chirp(); await wait(900); }
        else if (it.cat === 'Волшебство' || it.cat === 'Космос' || it.cat === 'Праздник') { M.sfx('magic'); parts(b, ['✨', '⭐', '💫'], 9); await wait(1000); }
        else if (it.cat === 'Игрушки') { await near(); anim(catEl(), 'm-happy', 600); M.meow({ shape: 'happy' }); await wait(900); }
        else { M.trill(); await wait(600); }
      }
      if (it.cat === 'Игрушки') bump('fun', 8);
      catFace({ happy: true }); say(it.line); await wait(900); catBack();
    });
  }
  function petRoomCat() { const c = catEl(); anim(c, 'm-happy', 600); catFace({ happy: true }); M.meow({ shape: 'happy' }); hearts(c, 3); say(pick(PH.pet)); setTimeout(() => c.isConnected && catFace({}), 1500); }
  function openFood(b) {
    const c = careNow();
    if (c.food >= 95) return say(HL.HOUSE_PH[3]);
    const m = modal(`<h2>🥣 Чем покормим котика?</h2><p class="small">Сытость: ${Math.round(c.food)}%. Еда покупается за конфеты, заработанные примерами.</p><div class="items">${HL.FOODS.map(f => `<button class="item" data-food="${f[0]}"><span class="ii">${icon(f[0], f[1])}</span><span class="in">${f[2]}</span><span class="ip">${f[3]} 🍬 · +${f[4]}%</span></button>`).join('')}</div><button class="btn" data-close>Потом</button>`);
    $$('[data-food]', m.el).forEach(x => x.addEventListener('click', () => {
      const f = HL.FOODS.find(y => y[0] === x.dataset.food);
      if (S.candies < f[3]) { SND.bad(); say(PH.poor[0]); return; }
      S.candies -= f[3]; save(); updCandy(); m.close();
      run(async () => {
        const g = geo(b); const food = document.createElement('div'); food.className = 'food-in'; food.innerHTML = icon(f[0], f[1]); food.style.cssText = `left:${g.x}%;bottom:${g.y + g.s * 0.5}%;z-index:${g.z + 1}`; roomEl.appendChild(food);
        await catMoveTo(g.x + g.s * 0.55, g.y, g.z + 2); catEl().classList.add('eating'); M.crunch(7);
        await wait(700); food.classList.add('gone'); await wait(1300); food.remove(); catEl().classList.remove('eating');
        M.purr(1.5); bump('food', f[4]); catFace({ happy: true }); hearts(catEl(), 3); say(f[5]); await wait(1200); catBack();
      });
    }));
  }
  $('#invb').addEventListener('click', () => {
    const t = $('#tray'), list = invList(); t.hidden = !t.hidden; SND.tap();
    if (t.hidden) return;
    t.innerHTML = list.length ? `<p class="small center">Выбери вещь, а потом нажми в комнате, куда её поставить:</p><div class="items">${list.map(id => { const c = catItem(id); return `<button class="item" data-put="${id}"><span class="ii">${icon(id, c[1])}</span><span class="in">${c[2]}</span></button>`; }).join('')}</div>` : `<p class="center">Сундук пуст. Вещи покупаются в <b>Магазине вещей</b> за конфеты, заработанные примерами 🍬</p>`;
    $$('[data-put]', t).forEach(x => x.addEventListener('click', () => {
      if (!roomOpen(cur)) return say((cur.eq || 0) > S.st.eq.done ? PH.quest[0] : PH.room[1]);
      placing = x.dataset.put; t.hidden = true; SND.tap(); drawRoom(); roomEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }));
  });
  $('#hshop').addEventListener('click', () => { SHOP_TAB = 'home'; go('shop'); });
  drawTabs(); drawRoom();
  const low = careLow(); if (low.length) later(() => say(HL.CARE[low[0]].low), 700); else later(() => say(pick(PH.house)), 700);
  const iv = setInterval(drawCare, 60000); cleanups.push(() => clearInterval(iv));
};

/* ================= магазин вещей для домика ================= */
let SHOP_TAB = 'wear';
function furnShopHTML() {
  houseMigrate(); const n = solvedTotal(), cats = [...new Set(HL.CATALOG.map(c => c[5]))];
  return `<p class="small">✨ <b>Волшебство</b> и 🚀 <b>Космос</b> открываются за решённые уравнения. Купленные вещи попадают в <b>сундук</b> в домике — оттуда их можно поставить в любую комнату и передвинуть пальцем.</p>` + cats.map(cat => `<h3>${cat}</h3><div class="items">${HL.CATALOG.filter(c => c[5] === cat).map(c => { const own = S.furn.includes(c[0]), lock = !itemOpen(c); return `<button class="item ${own ? 'own on' : ''} ${lock ? 'lockd' : ''}" data-f="${c[0]}"><span class="ii">${lock ? '🔒' : icon(c[0], c[1])}</span><span class="in">${c[2]}</span><span class="ip">${own ? 'куплено ✔' : lock ? (c[4] > n ? `после ${c[4]} задач` : `после ${itemEq(c)} уравнений 📦`) : GEM_FURN[c[0]] ? GEM_FURN[c[0]] + ' 💎' : c[3] + ' 🍬'}</span></button>`; }).join('')}</div>`).join('');
}
function bindFurnShop(root, redraw) {
  $$('.item[data-f]', root).forEach(b => b.addEventListener('click', () => {
    const c = catItem(b.dataset.f), n = solvedTotal();
    if (S.furn.includes(c[0])) { say(c[6]); return; }
    if (!itemOpen(c)) { SND.bad(); const e = itemEq(c) > S.st.eq.done; toast(`<span class="tb">🔒</span><div>${e ? `Волшебные вещи открываются за уравнения: нужно <b>${itemEq(c)}</b>, решено ${S.st.eq.done}.` : `Откроется после <b>${c[4]}</b> решённых задач. Решено: ${n}.`}</div>`); say(e ? PH.quest[2] : PH.room[1]); return; }
    if (GEM_FURN[c[0]]) { const g = GEM_FURN[c[0]]; if ((S.gems || 0) < g) { SND.bad(); toast(`<span class="tb">💎</span><div>Особая вещь: нужно <b>${g} 💎</b>, у тебя ${S.gems || 0}.<br>Кристаллы дают за сложные задачи!</div>`); return; } const mg = modal(`<div class="big-emoji">${icon(c[0], c[1], 'big')}</div><h2>${c[2]}</h2><p>Особая вещь за <b>${g} 💎</b>. Купить?</p><div class="row-btns"><button class="btn pink" id="buyg">Купить!</button><button class="btn" data-close>Не сейчас</button></div>`); $('#buyg', mg.el).addEventListener('click', () => { S.gems -= g; S.furn.push(c[0]); save(); updCandy(); mg.close(); M.sfx('magic'); confetti(30); say(PH.boughtHome[0]); redraw && redraw(); }); return; }
    if (S.candies < c[3]) { SND.bad(); say(PH.poor[0]); toast(`<span class="tb">🍬</span><div>Не хватает конфет: нужно ещё <b>${c[3] - S.candies}</b>.<br>Реши ещё несколько примеров!</div>`); return; }
    const m = modal(`<div class="big-emoji">${icon(c[0], c[1], 'big')}</div><h2>${c[2]}</h2><p>Купить за <b>${c[3]} 🍬</b>? Вещь попадёт в сундук в домике.</p><div class="row-btns"><button class="btn pink" id="buy">Купить!</button><button class="btn" data-close>Не сейчас</button></div>`);
    $('#buy', m.el).addEventListener('click', () => { S.candies -= c[3]; S.furn.push(c[0]); save(); updCandy(); m.close(); tone([[988, 0.09], [1319, 0.25, 0.07]]); confetti(20); say(PH.boughtHome[0]); catMood('happy', 1500); redraw && redraw(); });
  }));
}
function surprise() { // редкий подарок из сундука 20 задач / 7-го дня
  houseMigrate();
  const outfits = ITEMS.filter(i => i.price > 0 && !i.gems && i.price <= 50 && !S.owned.includes(i.id)).map(i => ({ icon: i.icon, name: i.name, give: () => S.owned.push(i.id) }));
  const furn = HL.CATALOG.filter(c => itemOpen(c) && !GEM_FURN[c[0]] && c[3] <= 50 && !S.furn.includes(c[0])).map(c => ({ icon: c[1], name: c[2], give: () => S.furn.push(c[0]) }));
  const all = outfits.concat(furn); if (!all.length) return null;
  const g = pick(all); g.give(); save(); return g;
}
function checkRooms() {
  houseMigrate();
  const fresh = HL.ROOMS.find(r => roomOpen(r) && !S.roomsSeen.includes(r.id)); if (!fresh || $('.modal')) return;
  S.roomsSeen.push(fresh.id); save(); SND.win(); confetti(30);
  const m = modal(`<div class="big-emoji">${fresh.icon}🔓</div><h2>Открыта новая комната: «${fresh.name}»!</h2><p>${fresh.care}. Загляни и обустрой её!</p><div class="row-btns"><button class="btn pink" id="gohouse">🏠 Посмотреть</button><button class="btn" data-close>Позже</button></div>`);
  speakT([PH.room[0], `${fresh.name}!`]);
  $('#gohouse', m.el).addEventListener('click', () => { m.close(); go('house', fresh.id); });
}

/* квест: путь к следующей комнате — с упором на уравнения */
function nextQuest() {
  const r = HL.ROOMS.find(x => !roomOpen(x)); if (!r) return null;
  const t = Math.max(0, r.need - solvedTotal()), e = Math.max(0, (r.eq || 0) - S.st.eq.done);
  return { r, t, e };
}
function questHTML() {
  const q = nextQuest(); if (!q) return '';
  return `<div class="quest"><span class="q-ic">${q.r.icon}</span><div class="q-t"><b>Квест: открыть «${q.r.name}»</b><small>Осталось: ${lockText(q.r)}</small></div>${q.e ? '<button class="btn pink sm" id="qgo">📦 Уравнения</button>' : '<button class="btn sm" data-go="newcase">🔍 Дело</button>'}</div>`;
}
function goEquations() { // лёгкий вход: простые уравнения с подсказками
  if (!S.prefs.eqLvChosen) S.prefs.eqLv = S.st.eq.done < 4 ? 1 : S.st.eq.done < 15 ? 2 : S.prefs.eqLv || 2; save(); go('practice', 'eq');
}
