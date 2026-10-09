/* fitting.js — «Примерочная»: котик примеряет наряды и окрасы перед зеркалом, позирует, любуется собой,
   сохраняет образы и фотографируется в образе. Примерять можно и некупленное — купить можно тут же. */
'use strict';
const Fitting = (() => {
  const POSES = [
    { id: 'smile', name: '😊 Улыбка', o: { smile: true } },
    { id: 'wink', name: '😉 Подмигнуть', o: { smile: true, wink: true } },
    { id: 'hi', name: '👋 Привет!', o: { smile: true, paw: true } },
    { id: 'star', name: '🤩 Звезда', o: { smile: true, star: true, paw: true } },
    { id: 'model', name: '💃 Модель', o: { smile: true, wink: true }, tilt: true },
    { id: 'happy', name: '😸 Счастье', o: { happy: true } },
  ];
  const poseOf = id => POSES.find(p => p.id === id) || POSES[0];
  const COMPL = ['Мур, какой я красивый!', 'Ну просто звезда подиума!', 'Зеркальце, скажи, кто на свете всех милее?', 'Мне так идёт, мур-р!', 'Вот это стиль, вот это котик!', 'Хоть сейчас на обложку журнала!'];
  let look = null, fur = null, pose = 'smile';
  const owned = id => S.owned.includes(id);
  const furOwned = k => !FURS[k].salon || (S.furs || []).includes(k);
  const catNow = (extra = {}) => catSVG({ fur, wear: look, ...poseOf(pose).o, ...extra });
  const tried = () => Object.entries(look).filter(([, id]) => id && !owned(id)).map(([, id]) => ITEMS.find(x => x.id === id));
  let bt = null;
  function bubble(t) { const b = $('#fsay'); if (!b) return; b.textContent = t.replace(/\{n\}/g, S.kid || ''); b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); clearTimeout(bt); bt = setTimeout(() => { const x = $('#fsay'); if (x) x.hidden = true; }, 3500); }
  function compliment(item) {
    const t = item ? `${item.name} — ${pick(['мне очень идёт!', 'просто восторг!', 'какая красота!'])}` : pick(COMPL);
    bubble(t); if (typeof speakRemote === 'function') speakRemote(t.replace(/[^\p{L}\p{N}\s,.!?—-]/gu, ''));
  }

  SCREENS.fitting = () => {
    look = look || { ...S.wear }; fur = fur && FURS[fur] ? fur : S.fur;
    app.innerHTML = `${topbar('👗 Примерочная')}<div class="page fitting">
      <div class="boutique" id="btq"><div class="mirror" id="mir"><div class="glass"><div class="refl" id="refl"></div><i class="shine"></i></div></div><div class="fit-cat" id="fcat"></div><div class="fit-say" id="fsay" hidden></div></div>
      <div class="seg poses" id="poses">${POSES.map(p => `<button data-p="${p.id}" class="${p.id === pose ? 'on' : ''}">${p.name}</button>`).join('')}</div>
      <div class="row-btns fit-act"><button class="btn" id="admire">🪞 Полюбоваться</button><button class="btn pink" id="fphoto">📸 Фото в образе</button><button class="btn mint" id="fsave">✔ Надеть образ</button></div>
      <div id="ftried"></div>
      <h3>Мои образы</h3><div class="looks" id="looks"></div>
      <div class="seg tabs" id="ftabs"><button data-t="wear" class="on">👗 Наряды</button><button data-t="fur">🎨 Окрас</button></div><div id="finv"></div></div>`;
    let tab = 'wear';
    $$('#ftabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; $$('#ftabs button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); inv(); }));
    $$('#poses button').forEach(b => b.addEventListener('click', () => { pose = b.dataset.p; $$('#poses button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); M.meow({ shape: 'happy' }); drawCat(true); }));
    $('#fcat').addEventListener('click', () => { const i = POSES.findIndex(p => p.id === pose); pose = POSES[(i + 1) % POSES.length].id; $$('#poses button').forEach(x => x.classList.toggle('on', x.dataset.p === pose)); drawCat(true); SND.meow(); });
    const admire = () => { const c = $('#fcat'); c.classList.remove('admire'); void c.offsetWidth; c.classList.add('admire'); hearts(c, 4); M.purr(1.6); compliment(); S.admired = (S.admired || 0) + 1; save(); };
    $('#admire').addEventListener('click', admire); $('#mir').addEventListener('click', admire);
    $('#fsave').addEventListener('click', () => {
      const t = tried(); if (t.length) { toast(`<span class="tb">🛍️</span><div>Сначала купи: <b>${t.map(x => x.name).join(', ')}</b> — или сними эти вещи.</div>`); SND.bad(); return; }
      if (!furOwned(fur)) { toast('Этот окрас ещё не открыт — загляни в «Салон окрасов» ✨'); return; }
      S.wear = { ...look }; S.fur = fur; save(); SND.win(); confetti(25); bubble('Образ готов! Я неотразим, {n}!');
    });
    $('#fphoto').addEventListener('click', () => {
      const w = { ...look }; let stripped = false; Object.keys(w).forEach(k => { if (w[k] && !owned(w[k])) { w[k] = S.wear[k]; stripped = true; } });
      if (stripped) toast('В фото — только твои вещи. Примеренное можно купить 🛍️');
      Object.assign(Photo.state, { wear: w, fur: furOwned(fur) ? fur : S.fur, pose, bg: 'g:fit' }); go('photo', 'g:fit');
    });
    const inv = () => {
      if (tab === 'fur') { $('#finv').innerHTML = `<div class="furs">${Object.entries(FURS).map(([k, f]) => `<button class="fur ${k === fur ? 'on' : ''} ${furOwned(k) ? '' : 'lock'}" data-f="${k}"><i style="background:${f.sw}"></i>${f.name}${furOwned(k) ? '' : ' 🔒'}</button>`).join('')}</div><p class="small center">Окрасы с 🔒 можно примерить, а открыть — в «Салоне окрасов».</p>`;
        $$('#finv .fur').forEach(b => b.addEventListener('click', () => { fur = b.dataset.f; SND.tap(); drawCat(true); inv(); if (!furOwned(fur)) toast('Это примерка! Окрас открывается в «Салоне окрасов» ✨'); })); return; }
      $('#finv').innerHTML = Object.entries(SLOTS).map(([slot, nm]) => `<h4>${nm}</h4><div class="items">${ITEMS.filter(it => it.slot === slot).map(it => `<button class="item ${owned(it.id) ? 'own' : 'try'} ${look[slot] === it.id ? 'on' : ''}" data-id="${it.id}"><span class="ii">${it.icon}</span><span class="in">${it.name}</span><span class="ip">${look[slot] === it.id ? 'надето' : owned(it.id) ? 'моё' : 'примерить'}</span></button>`).join('')}</div>`).join('');
      $$('#finv .item').forEach(b => b.addEventListener('click', () => { const it = ITEMS.find(x => x.id === b.dataset.id); look[it.slot] = look[it.slot] === it.id ? null : it.id; SND.tap(); drawCat(true); inv(); if (look[it.slot]) { catMood('happy', 900); compliment(it); } }));
    };
    const drawTried = () => {
      const t = tried(); $('#ftried').innerHTML = t.length ? `<div class="tried">🛍️ Примерка: ${t.map(it => `<button class="btn sm pink" data-buy="${it.id}">${it.icon} ${it.name} — ${it.gems ? it.gems + ' 💎' : it.price + ' 🍬'}</button>`).join(' ')}</div>` : '';
      $$('[data-buy]').forEach(b => b.addEventListener('click', () => buy(ITEMS.find(x => x.id === b.dataset.buy))));
    };
    const buy = it => {
      const gem = !!it.gems, cost = gem ? it.gems : it.price, have = gem ? (S.gems || 0) : S.candies;
      if (have < cost) { SND.bad(); toast(`<span class="tb">${gem ? '💎' : '🍬'}</span><div>Не хватает: нужно ещё <b>${cost - have}</b> ${gem ? '💎' : '🍬'}. Реши пару задач — и возвращайся!</div>`); return; }
      const m = modal(`<div class="big-emoji">${it.icon}</div><h2>${it.name}</h2><p>Купить за <b>${cost} ${gem ? '💎' : '🍬'}</b>?</p><div class="row-btns"><button class="btn pink" id="fbuy">Купить!</button><button class="btn" data-close>Не сейчас</button></div>`);
      $('#fbuy', m.el).addEventListener('click', () => { if (gem) S.gems -= cost; else S.candies -= cost; S.owned.push(it.id); save(); updCandy(); m.close(); confetti(20); SND.win(); drawCat(); inv(); });
    };
    const drawLooks = () => {
      S.looks = S.looks || [];
      $('#looks').innerHTML = [0, 1, 2].map(i => { const L = S.looks[i]; return L ? `<button class="look" data-l="${i}">${catSVG({ fur: L.fur, wear: L.wear, smile: true })}<small>Образ ${i + 1}</small></button>` : `<button class="look empty" data-l="${i}"><span>＋</span><small>Сохранить</small></button>`; }).join('');
      $$('#looks .look').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.l, L = S.looks[i];
        if (!L) { S.looks[i] = { wear: { ...look }, fur }; save(); SND.tap(); toast('Образ сохранён 💾'); drawLooks(); return; }
        look = { ...L.wear }; fur = L.fur; SND.tap(); drawCat(true); inv(); }));
      $$('#looks .look:not(.empty)').forEach(b => b.addEventListener('contextmenu', e => { e.preventDefault(); S.looks[+b.dataset.l] = null; save(); drawLooks(); }));
    };
    function drawCat(anim) {
      const P = poseOf(pose), svg = catNow();
      $('#fcat').innerHTML = svg; $('#refl').innerHTML = svg; $('#fcat').classList.toggle('tilt', !!P.tilt); $('#refl').classList.toggle('tilt', !!P.tilt);
      if (anim) { const c = $('#fcat'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
      drawTried();
    }
    drawCat(); inv(); drawLooks();
    cleanups.push(() => { look = null; fur = null; });
  };
  { const sh = SCREENS.shop; SCREENS.shop = arg => { sh(arg); const pg = $('.page.shop', app); if (pg) pg.insertAdjacentHTML('beforebegin', '<div class="page fit-wrap"><button class="btn mint fit-link" data-go="fitting">👗 В примерочную — примерить всё перед зеркалом</button></div>'); }; }
  if (!NO_FLOAT.includes('fitting')) NO_FLOAT.push('fitting');
  PH.fitting = ['Примерим что-нибудь модное, {n}?', 'Посмотри, какой я в зеркале!'];
  return { POSES, poseOf };
})();
window.Fitting = Fitting;
