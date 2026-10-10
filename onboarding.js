/* onboarding.js (v30) — экскурсии с котиком.
   1) Большая экскурсия для ребёнка: после знакомства котик ребёнка (с его нарядом) выпрыгивает из карточки героя
      и бегает по главной от раздела к разделу — подсветка, пузырь с текстом, голос, искры и звуки. Повтор: ⚙️ «Экскурсия с котиком».
   2) Мини-экскурсии при первом заходе на ключевые экраны (Школа, Академия, Новое дело, Домик, Быстрые лапки, Друзья, Награды).
   3) Экскурсия для взрослых: котик в плаще сыщика спокойно проходит по вкладкам раздела и по личному кабинету (на «Вы»).
   4) «Что нового»: Tour.whatsNew({ id, ver, screen, steps }) — короткий показ новинки один раз после обновления.
   Движение — только transform/opacity через requestAnimationFrame; prefers-reduced-motion — без прыжков, следов и искр.
   Окна (новости, подарки, сундуки, опрос) не ломаем: экскурсия стартует, только когда ни одного окна нет. */
'use strict';
const Tour = (() => {
  const RM = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  // автотесты (puppeteer) экскурсию сами не получают — иначе она закрывала бы экран; свой тест включает её флагом
  const autoOff = () => { try { return !!navigator.webdriver && !localStorage.getItem('murlok-tour-e2e'); } catch (e) { return false; } };
  const fem = () => /[ая]$/i.test(S.kid || '');
  const fill = t => String(t || '').replace(/\{kid\}/g, S.kid || 'сыщик').replace(/\{cat\}/g, S.name || 'котик').replace(/\{g:([^|}]*)\|([^}]*)\}/g, (_, m, f) => (fem() ? f : m));
  const EMO = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
  const plain = t => String(t).replace(/<[^>]+>/g, ' ').replace(EMO, '').replace(/\s+/g, ' ').trim();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // кадр анимации: requestAnimationFrame, а если браузер его придерживает (экономия, встроенные окна) — таймер ~30 к/с
  const nextFrame = cb => { let done = false; const f = () => { if (done) return; done = true; cb(performance.now()); }; requestAnimationFrame(f); setTimeout(f, 34); };
  const tours = () => (S.tours = S.tours || {});
  const visible = el => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[hidden]'); };
  const byH = (txt, root = document) => { const h = [...root.querySelectorAll('h2, h3')].find(x => x.textContent.includes(txt)); return h ? h.closest('.card') || h : null; };

  /* ---------- стили ---------- */
  function css() {
    if (document.getElementById('tour-css')) return;
    const s = document.createElement('style'); s.id = 'tour-css';
    s.textContent = `
.tour{position:fixed;inset:0;z-index:66;touch-action:none;-webkit-user-select:none;user-select:none;overflow:hidden}
.tour-hole{position:absolute;left:0;top:0;width:0;height:0;border-radius:20px;pointer-events:none;box-shadow:0 0 0 var(--sp) rgba(40,26,58,.6),0 0 0 4px rgba(255,255,255,.95),0 0 28px 10px rgba(255,214,120,.7);transition:transform .45s cubic-bezier(.3,.8,.3,1),width .45s cubic-bezier(.3,.8,.3,1),height .45s cubic-bezier(.3,.8,.3,1)}
.tour-hole.none{box-shadow:0 0 0 var(--sp) rgba(40,26,58,.6)}
.tour-hole:not(.none)::after{content:'';position:absolute;inset:-7px;border-radius:26px;border:3px solid rgba(255,214,120,.95);will-change:transform,opacity;animation:tourPulse 1.6s ease-out infinite}
.tour.adult .tour-hole{box-shadow:0 0 0 var(--sp) rgba(40,26,58,.55),0 0 0 3px rgba(255,255,255,.95),0 0 18px 4px rgba(190,170,255,.6)}
.tour.adult .tour-hole:not(.none)::after{border-color:rgba(190,170,255,.9)}
@keyframes tourPulse{0%{opacity:.95;transform:scale(.97)}100%{opacity:0;transform:scale(1.07)}}
.tour-cat{position:absolute;left:0;top:0;width:var(--cw);height:calc(var(--cw) * 1.18);will-change:transform;cursor:pointer;z-index:2}
.tc-shadow{position:absolute;left:20%;right:20%;bottom:-3px;height:12px;border-radius:50%;background:rgba(20,10,30,.35);will-change:transform,opacity}
.tc-jump,.tc-bob,.tc-in{position:absolute;inset:0;transform-origin:50% 100%}
.tc-jump,.tc-in{will-change:transform}
.tc-in svg{width:100%;height:100%;display:block;filter:drop-shadow(0 6px 5px rgba(0,0,0,.28))}
.tc-bob.idle{animation:tcIdle 2.4s ease-in-out infinite}
.tc-bob.land{animation:tcLand .5s cubic-bezier(.3,1.6,.5,1)}
.tc-bob.appear{animation:tcAppear .6s cubic-bezier(.3,1.6,.5,1)}
.tc-bob.leave{animation:tcLeave .45s ease-in forwards}
.tc-bob.wiggle{animation:tcWiggle .5s ease-in-out}
@keyframes tcIdle{0%,100%{transform:scale(1,1)}50%{transform:scale(1.025,.97)}}
@keyframes tcLand{0%{transform:scale(1.22,.74)}45%{transform:translateY(-12px) scale(.92,1.1)}75%{transform:scale(1.05,.95)}100%{transform:none}}
@keyframes tcAppear{0%{transform:scale(.1) rotate(-25deg);opacity:0}60%{opacity:1}100%{transform:none;opacity:1}}
@keyframes tcLeave{to{transform:translateY(-16px) scale(.1);opacity:0}}
@keyframes tcWiggle{25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}
.tour-paw{position:absolute;left:0;top:0;font-size:15px;line-height:1;pointer-events:none;opacity:0;animation:tourPaw 1.6s ease-out forwards}
@keyframes tourPaw{12%{opacity:.8}100%{opacity:0}}
.tour-spark{position:absolute;pointer-events:none;font-size:20px;line-height:1;opacity:0;animation:tourSpark .95s ease-out forwards}
@keyframes tourSpark{0%{transform:translate(-50%,-50%) scale(.2);opacity:0}30%{opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.1) rotate(50deg);opacity:0}}
.tour-bub{position:absolute;left:12px;right:12px;margin:0 auto;max-width:400px;background:#fff;color:var(--ink);border-radius:22px;padding:14px 16px 12px;box-shadow:0 14px 40px rgba(30,15,50,.35);border:3px solid var(--pink-2);z-index:3;opacity:0;transform:translateY(10px) scale(.97);transition:opacity .25s,transform .3s cubic-bezier(.3,1.4,.5,1);max-height:48vh;overflow:auto;touch-action:pan-y}
.tour-bub.in{opacity:1;transform:none}
.tour.adult .tour-bub{border-color:var(--plum-2)}
.tb-title{font-weight:900;font-size:18px;line-height:1.2;margin:0 0 6px;padding-right:38px}
.tb-text{font-size:16px;line-height:1.38;margin:0 0 10px}
.tb-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.tb-dots{display:flex;gap:5px;flex:1 1 60px;flex-wrap:wrap;min-width:0}
.tb-dots i{width:8px;height:8px;border-radius:50%;background:var(--line);transition:transform .2s,background .2s}
.tb-dots i.past{background:var(--pink-2)} .tb-dots i.on{background:var(--pink);transform:scale(1.35)}
.tour.adult .tb-dots i.on{background:var(--plum)} .tour.adult .tb-dots i.past{background:var(--plum-2)}
.tb-skip{font-weight:800;color:var(--muted);padding:8px 10px;border-radius:14px;font-size:15px}
.tour-bub .tb-next{margin:0;min-height:44px;padding:9px 18px}
.tour.adult .tb-next{background:var(--plum);box-shadow:0 5px 0 #5B40B0}
.tb-mute{position:absolute;right:10px;top:10px;width:36px;height:36px;border-radius:50%;background:var(--plum-2);font-size:16px;line-height:36px;text-align:center}
body.tour-on #mascot{visibility:hidden}
.tour-card .row-btns{margin-top:6px}
@media (prefers-reduced-motion: reduce){.tour-hole{transition:none}.tour-hole::after,.tc-bob.idle{animation:none!important}.tour-bub{transition:opacity .2s}}`;
    document.head.appendChild(s);
  }

  /* ---------- котик в плаще сыщика (для взрослых) ---------- */
  const COAT = '<g class="coat"><path d="M48 158 Q44 214 66 218 L134 218 Q156 214 152 158 Q128 144 100 149 Q72 144 48 158 Z" fill="#C9A36B" stroke="#3B2A4A" stroke-width="5"/>'
    + '<path d="M100 149 L80 182 L100 174 L120 182 Z" fill="#A9824D" stroke="#3B2A4A" stroke-width="3"/><path d="M100 174 V214" stroke="#3B2A4A" stroke-width="3"/>'
    + '<rect x="50" y="190" width="100" height="10" rx="3" fill="#8E6A3D" stroke="#3B2A4A" stroke-width="3"/><rect x="93" y="188" width="14" height="14" rx="3" fill="#FFD36B" stroke="#3B2A4A" stroke-width="3"/>'
    + '<circle cx="88" cy="208" r="3" fill="#3B2A4A"/><circle cx="112" cy="208" r="3" fill="#3B2A4A"/></g>';
  const detectiveCat = () => catSVG({ fur: S.fur, wear: { head: 'deer', hand: 'loupe' }, smile: true }).replace('<g class="head">', COAT + '<g class="head">');
  const kidCat = () => myCat({ smile: true });

  /* ---------- движок ---------- */
  let T = null;
  function build(def) {
    css();
    const root = document.createElement('div'); root.className = 'tour' + (def.adult ? ' adult' : '');
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', def.adult ? 'Экскурсия по разделу для взрослых' : 'Экскурсия с котиком');
    const cw = innerWidth < 700 ? 76 : 100; root.style.setProperty('--cw', cw + 'px'); root.style.setProperty('--sp', Math.ceil(Math.max(innerWidth, innerHeight) * 1.05) + 'px');
    const voiceOk = S.sound && S.voice !== false && typeof speakRemote === 'function';
    root.innerHTML = `<div class="tour-hole none"></div><div class="tour-fx"></div>
      <div class="tour-cat" aria-hidden="true"><div class="tc-shadow"></div><div class="tc-jump"><div class="tc-bob"><div class="tc-in">${def.adult ? detectiveCat() : kidCat()}</div></div></div></div>
      <div class="tour-bub" aria-live="polite">${voiceOk ? '<button class="tb-mute" type="button" aria-label="Голос котика: выключить">🔊</button>' : ''}<div class="tb-title"></div><p class="tb-text"></p>
        <div class="tb-row"><div class="tb-dots" aria-hidden="true"></div><button class="tb-skip" type="button">Пропустить</button><button class="btn pink tb-next" type="button">Дальше →</button></div></div>`;
    document.body.appendChild(root); document.body.classList.add('tour-on');
    const q = s => root.querySelector(s);
    return { def, root, hole: q('.tour-hole'), fx: q('.tour-fx'), cat: q('.tour-cat'), shadow: q('.tc-shadow'), jump: q('.tc-jump'), bob: q('.tc-bob'), inn: q('.tc-in'), bub: q('.tour-bub'),
      cw, ch: Math.round(cw * 1.18), x: -200, y: innerHeight, face: 1, i: -1, tok: 0, moving: false, mute: !!S.tourMute, hidden: [], started: false, seen: 0 };
  }
  function stopVoice() { try { if (typeof stopRemote === 'function') stopRemote(); M.hush(); } catch (e) { } }
  function speak(st) {
    if (!T || T.mute || !S.sound || S.voice === false || typeof speakRemote !== 'function') return;
    const t = plain(fill(st.say || ((st.title ? st.title + '. ' : '') + st.text))); if (!t) return;
    try { if (typeof wakeAudio === 'function') wakeAudio(); const p = speakRemote(t); if (p && p.catch) p.catch(() => { }); } catch (e) { }
  }
  const setCat = (x, y) => { T.x = x; T.y = y; T.cat.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; };
  const replay = (el, cls) => { el.classList.remove('land', 'appear', 'leave', 'idle', 'wiggle'); void el.offsetWidth; el.classList.add(cls); };

  function findEl(st, needVisible = true) {
    if (st.find) { try { const e = st.find(); return e && (!needVisible || visible(e)) ? e : null; } catch (e) { return null; } }
    if (!st.sel) return null;
    for (const s of [].concat(st.sel)) { const list = [...document.querySelectorAll(s)]; const e = needVisible ? list.find(visible) : list[0]; if (e) return e; }
    return null;
  }
  async function findWait(st, ms) { const t0 = Date.now(); let e = findEl(st); while (!e && Date.now() - t0 < ms) { await wait(120); e = findEl(st); } return e; }

  function scrollToEl(el) {
    let p = el; while (p && p !== document.body) { const pos = getComputedStyle(p).position; if (pos === 'fixed') return Promise.resolve(); p = p.parentElement; }
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const want = r.height > vh * 0.42 ? 64 : vh * 0.24;
    const top = Math.max(0, Math.min(scrollY + r.top - want, document.documentElement.scrollHeight - vh));
    if (Math.abs(top - scrollY) < 6) return Promise.resolve();
    window.scrollTo({ top, behavior: RM() ? 'auto' : 'smooth' });
    return new Promise(res => { let last = -1, same = 0; const t0 = performance.now(); const tick = () => { if (Math.abs(scrollY - last) < 0.5) same++; else same = 0; last = scrollY; if (same > 4 || performance.now() - t0 > 1000) return res(); nextFrame(tick); }; nextFrame(tick); });
  }

  // где подсветка, где пузырь (прижат к низу или к верху экрана — никогда не вылезает за край) и куда бежит котик
  function layout() {
    const vw = innerWidth, vh = innerHeight, cw = T.cw, ch = T.ch, G = 12, bh = T.bub.offsetHeight;
    let r = T.el && visible(T.el) ? T.el.getBoundingClientRect() : null;
    let hole = null, dockTop = false;
    if (r) {
      const p = T.def.adult ? 6 : 8, l = Math.max(4, r.left - p), t = Math.max(4, r.top - p), rr = Math.min(vw - 4, r.right + p), b = Math.min(vh - 4, r.bottom + p);
      hole = { l, t, w: Math.max(0, rr - l), h: Math.max(0, b - t) };
      dockTop = (Math.max(r.top, 0) + Math.min(r.bottom, vh)) / 2 > vh * 0.55;
    }
    const bubTop = dockTop ? G : vh - bh - G;
    let cx, cy;
    if (!r) { cx = vw / 2 - cw / 2; cy = bubTop - ch - 6; }
    else {
      cx = r.left + r.width * (T.i % 2 ? 0.2 : 0.8) - cw / 2;
      cy = dockTop ? Math.max(r.top - ch * 0.72, bubTop + bh - 4) : Math.min(r.bottom - ch * 0.3, bubTop - ch + 4);
    }
    return { hole, dockTop, cx: clamp(cx, 4, vw - cw - 4), cy: clamp(cy, 4, vh - ch - 4) };
  }
  function applyLayout(L, moveCat) {
    const h = T.hole;
    if (L.hole) { h.classList.remove('none'); h.style.width = L.hole.w + 'px'; h.style.height = L.hole.h + 'px'; h.style.transform = `translate3d(${L.hole.l}px,${L.hole.t}px,0)`; }
    else { h.classList.add('none'); h.style.width = h.style.height = '0px'; h.style.transform = `translate3d(${innerWidth / 2}px,${innerHeight / 2}px,0)`; }
    const b = T.bub; if (L.dockTop) { b.style.top = '12px'; b.style.bottom = 'auto'; } else { b.style.top = 'auto'; b.style.bottom = 'calc(12px + env(safe-area-inset-bottom, 0px))'; }
    if (moveCat && !T.moving) setCat(L.cx, L.cy);
  }

  // прыжки по дуге: кривая Безье + подскоки, сплющивание при приземлении, вытягивание в полёте, поворот по ходу, следы лапок
  function hopTo(x, y) {
    return new Promise(res => {
      const x0 = T.x, y0 = T.y, dx = x - x0, dy = y - y0, dist = Math.hypot(dx, dy);
      if (dist < 3) return res();
      if (RM()) { T.cat.style.opacity = '0'; setTimeout(() => { if (T) { setCat(x, y); T.cat.style.opacity = '1'; } res(); }, 160); return; }
      const adult = T.def.adult, tok = T.tok;
      const dur = clamp(dist * (adult ? 2.1 : 1.5), adult ? 600 : 480, adult ? 1600 : 1300);
      const hops = Math.max(1, Math.round(dist / (adult ? 70 : 115))), hopH = adult ? 8 : Math.min(64, 26 + dist * 0.07);
      const side = T.i % 2 ? 1 : -1, mx = x0 + dx / 2 - (dy / (dist || 1)) * dist * 0.22 * side, my = y0 + dy / 2 + (dx / (dist || 1)) * dist * 0.22 * side - (adult ? 0 : dist * 0.12);
      if (Math.abs(dx) > 4) T.face = dx < 0 ? -1 : 1;
      const ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      T.moving = true; T.bob.classList.remove('idle', 'land', 'appear');
      if (!adult && dist > 220) M.sfx('whoosh');
      let lastPh = 0; const t0 = performance.now();
      const frame = now => {
        if (!T || T.tok !== tok) { if (T) T.moving = false; return res(); }
        const t = Math.min(1, (now - t0) / dur), p = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, u = 1 - p;
        const bx = u * u * x0 + 2 * u * p * mx + p * p * x, by = u * u * y0 + 2 * u * p * my + p * p * y;
        const ph = t >= 1 ? 0 : (p * hops) % 1, air = Math.sin(ph * Math.PI), lift = air * hopH;
        const sy = adult ? 1 + 0.03 * air : 0.84 + 0.28 * air, sx = adult ? 1 : 2 - sy, rot = (adult ? 2 : 7) * Math.cos(ph * Math.PI) * T.face;
        setCat(bx, by);
        T.jump.style.transform = `translate3d(0,${(-lift).toFixed(1)}px,0)`;
        T.inn.style.transform = `scale(${(sx * T.face).toFixed(3)},${sy.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
        T.shadow.style.transform = `scale(${(1 - air * 0.45).toFixed(3)})`; T.shadow.style.opacity = (1 - air * 0.6).toFixed(2);
        if (ph < lastPh || t >= 1) paw(bx + T.cw / 2 + (Math.random() * 10 - 5), by + T.ch - 8, ang);
        lastPh = ph;
        if (t < 1) return nextFrame(frame);
        T.moving = false; T.jump.style.transform = ''; T.inn.style.transform = `scale(${T.face},1)`; T.shadow.style.transform = ''; T.shadow.style.opacity = '';
        res();
      };
      nextFrame(frame);
    });
  }
  let pawN = 0;
  function paw(x, y, ang) {
    if (!T || RM()) return; pawN++;
    if (pawN % 2 === 0) M.pawStep();
    const e = document.createElement('div'); e.className = 'tour-paw'; e.textContent = '🐾';
    e.style.transform = `translate3d(${(x + (pawN % 2 ? 6 : -6)).toFixed(0)}px,${y.toFixed(0)}px,0) rotate(${ang.toFixed(0)}deg)`;
    T.fx.appendChild(e); setTimeout(() => e.remove(), 1700);
  }
  function sparkle(r, set = ['✨', '⭐', '💫', '✨']) {
    if (!T || RM() || !r) return;
    for (let k = 0; k < 10; k++) {
      const e = document.createElement('div'); e.className = 'tour-spark'; e.textContent = set[k % set.length];
      const a = (k / 10) * Math.PI * 2, rad = 30 + Math.random() * 40;
      e.style.left = clamp(r.left + r.width / 2, 10, innerWidth - 10) + 'px'; e.style.top = clamp(r.top + r.height / 2, 10, innerHeight - 10) + 'px';
      e.style.setProperty('--dx', (Math.cos(a) * rad).toFixed(0) + 'px'); e.style.setProperty('--dy', (Math.sin(a) * rad).toFixed(0) + 'px'); e.style.animationDelay = (k * 0.03) + 's';
      T.fx.appendChild(e); setTimeout(() => e.remove(), 1300);
    }
  }
  function typeText(el, text) {
    clearInterval(T.typeT);
    if (RM()) { el.textContent = text; return; }
    const ch = Array.from(text); let n = 0; el.textContent = '';
    T.typeT = setInterval(() => { n += 2; el.textContent = ch.slice(0, n).join(''); if (n >= ch.length) clearInterval(T.typeT); }, 20);
  }
  function fillBubble(st, i) {
    const n = T.list.length, last = i === n - 1;
    T.bub.querySelector('.tb-title').textContent = fill(st.title || '');
    T.bub.querySelector('.tb-title').hidden = !st.title;
    const txt = T.bub.querySelector('.tb-text'); txt.style.minHeight = ''; txt.textContent = fill(st.text);
    txt.style.minHeight = txt.offsetHeight + 'px'; // высота с полным текстом — пузырь не «прыгает», пока буквы печатаются
    T.bub.querySelector('.tb-dots').innerHTML = n > 1 ? T.list.map((_, k) => `<i class="${k < i ? 'past' : k === i ? 'on' : ''}"></i>`).join('') : '';
    T.bub.querySelector('.tb-next').textContent = last ? (T.def.lastLabel || (T.def.adult ? 'Спасибо, понятно' : 'Понятно! 🐾')) : 'Дальше →';
    T.bub.querySelector('.tb-skip').hidden = last;
  }
  async function show(i) {
    if (!T) return; const tok = ++T.tok;
    if (i >= T.list.length) return end(true);
    T.i = i; const st = T.list[i];
    T.bub.classList.remove('in'); stopVoice(); clearInterval(T.typeT);
    if (st.before) { try { st.before(); } catch (e) { } await wait(150); if (!T || tok !== T.tok) return; }
    const el = (st.sel || st.find) ? await findWait(st, st.wait || 500) : null;
    if (!T || tok !== T.tok) return;
    if ((st.sel || st.find) && !el) { T.list.splice(i, 1); return show(i); } // цели нет на экране — шаг пропускаем
    T.el = el;
    if (el) { await scrollToEl(el); if (!T || tok !== T.tok) return; }
    fillBubble(st, i);
    const L = layout(); applyLayout(L, false);
    if (!T.started) { T.started = true; await enter(L); }
    else await hopTo(L.cx, L.cy);
    if (!T || tok !== T.tok) return;
    applyLayout(layout(), true);
    replay(T.bob, 'land'); setTimeout(() => { if (T && tok === T.tok) replay(T.bob, 'idle'); }, 520);
    M.haptic(10);
    if (T.def.adult) M.tone([[620, 0.07, 0, 'sine', 0.05]]);
    else { M.sfx('pop'); if (i % 3 === 1) setTimeout(() => SND.meow(), 200); else if (i % 3 === 2) M.trill(); }
    T.seen = Math.max(T.seen, i + 1);
    T.bub.classList.add('in'); typeText(T.bub.querySelector('.tb-text'), fill(st.text)); speak(st);
    if (el && st.fx !== false && !T.def.adult) sparkle(el.getBoundingClientRect(), st.fx === 'candy' ? ['🍬', '💎', '✨', '🍭'] : undefined);
    try { T.bub.querySelector('.tb-next').focus({ preventScroll: true }); } catch (e) { }
  }
  // появление: котик выпрыгивает из своей карточки (на главной) или вбегает из угла экрана
  async function enter(L) {
    const from = T.def.from ? document.querySelector(T.def.from) : null;
    if (from && visible(from)) {
      const r = from.getBoundingClientRect();
      setCat(clamp(r.left + r.width / 2 - T.cw / 2, 4, innerWidth - T.cw - 4), clamp(r.top + r.height - T.ch, 4, innerHeight - T.ch - 4));
      from.style.visibility = 'hidden'; T.hidden.push(from);
      replay(T.bob, 'appear'); sparkle(r); if (!T.def.adult) { M.sfx('magic'); setTimeout(() => SND.meow(), 250); }
      await wait(RM() ? 50 : 650); if (!T) return;
    } else { setCat(-T.cw - 10, clamp(innerHeight - T.ch - 30, 4, innerHeight)); if (!T.def.adult) M.trill(); }
    await hopTo(L.cx, L.cy);
  }
  async function end(completed, how = completed ? 'done' : 'skip') {
    const t = T; if (!t) return; t.tok++;
    document.removeEventListener('keydown', t.onKey, true); removeEventListener('resize', t.onScroll); removeEventListener('scroll', t.onScroll);
    clearInterval(t.typeT); stopVoice();
    if (how !== 'nav') {
      t.bub.classList.remove('in'); t.hole.classList.add('none');
      const from = t.hidden[0];
      if (completed && !RM() && from && visible(from)) { const r = from.getBoundingClientRect(); t.i++; await hopTo(clamp(r.left + r.width / 2 - t.cw / 2, 4, innerWidth - t.cw - 4), clamp(r.top + r.height - t.ch, 4, innerHeight - t.ch - 4)); }
      replay(t.bob, 'leave'); await wait(RM() ? 0 : 420);
    }
    t.root.remove(); t.hidden.forEach(e => { e.style.visibility = ''; });
    document.body.classList.remove('tour-on'); if (T === t) T = null;
    try { if (t.def.onEnd) t.def.onEnd(completed, how, t.seen); } catch (e) { console.warn(e); }
    if (how !== 'nav' && t.hidden[0] && !t.def.adult) { const hc = t.hidden[0]; hc.classList.remove('wiggle'); void hc.offsetWidth; hc.classList.add('wiggle'); }
    t.resolve && t.resolve(completed);
  }
  function run(def) {
    if (T) return Promise.resolve(false);
    const list = def.steps.filter(s => (!s.sel && !s.find) || s.before || findEl(s, false));
    if (!list.length) return Promise.resolve(false);
    T = build(def); T.list = list; const t = T;
    const next = () => { if (!T || T !== t) return; SND.tap(); show(T.i + 1); };
    T.bub.querySelector('.tb-next').addEventListener('click', next);
    T.bub.querySelector('.tb-skip').addEventListener('click', () => { SND.tap(); end(false, 'skip'); });
    const mb = T.bub.querySelector('.tb-mute');
    const paintMute = () => { if (!mb) return; mb.textContent = T.mute ? '🔇' : '🔊'; mb.setAttribute('aria-label', T.mute ? 'Голос котика: включить' : 'Голос котика: выключить'); };
    if (mb) { paintMute(); mb.addEventListener('click', () => { T.mute = !T.mute; S.tourMute = T.mute; save(); paintMute(); if (T.mute) stopVoice(); else speak(T.list[T.i]); }); }
    T.cat.addEventListener('click', () => { if (!T || T.moving) return; replay(T.bob, 'wiggle'); setTimeout(() => T && !T.moving && replay(T.bob, 'idle'), 520); if (T.def.adult) M.trill(); else { SND.meow(); hearts(T.cat, 3); } });
    let raf = 0; T.onScroll = () => { if (raf) return; raf = 1; nextFrame(() => { raf = 0; if (T !== t) return; T.root.style.setProperty('--sp', Math.ceil(Math.max(innerWidth, innerHeight) * 1.05) + 'px'); if (T.started) applyLayout(layout(), true); }); };
    addEventListener('resize', T.onScroll); addEventListener('scroll', T.onScroll, { passive: true });
    T.onKey = e => { if (T !== t) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false, 'skip'); } else if ((e.key === 'Enter' || e.key === 'ArrowRight') && !e.target.closest('.tb-skip, .tb-mute')) { e.preventDefault(); e.stopPropagation(); next(); } };
    document.addEventListener('keydown', T.onKey, true);
    return new Promise(res => { t.resolve = res; show(0); });
  }

  // уход с экрана (кнопка «назад» браузера, программный переход) — экскурсия тихо заканчивается
  { const g0 = go; go = function () { if (T) end(false, 'nav'); const r = g0.apply(this, arguments); setTimeout(() => newCheck(curScreen), 1300); return r; }; }

  // ждём, пока на экране не будет ни одного окна (новости, подарок за вход, сундуки, опрос) — quiet мс подряд
  function quiet(ms, max, screen) {
    return new Promise(res => { const t0 = Date.now(); let calm = 0;
      const tick = () => { if (curScreen !== screen || document.hidden && Date.now() - t0 > max) return res(false);
        if (document.querySelector('.modal') || T || document.hidden) calm = 0; else calm += 300;
        if (calm >= ms) return res(true); if (Date.now() - t0 > max) return res(false); setTimeout(tick, 300); };
      setTimeout(tick, 300); });
  }

  /* ---------- состояние: кто уже видел экскурсию ---------- */
  // игрок, который занимался до появления экскурсий, — «ветеран»: большую экскурсию сам не получает (ему — показ новинки), мини-экскурсии отмечены
  function initState() {
    if (S.tourInit || !S.kid) return; S.tourInit = 1; tours();
    if (solvedTotal() || S.cases || S.xp >= 50) { S.tourVet = 1; Object.keys(MINI).forEach(k => { S.tours[k] = 1; }); }
    save();
  }

  /* ---------- большая экскурсия для ребёнка ---------- */
  const KID = [
    { sel: '.hero-cat', title: 'Привет, {kid}! 🐾', text: 'Это я, {cat}! Сейчас я пробегусь по всему агентству и всё-всё покажу. Беги за мной!', say: 'Привет, {kid}! Это я, {cat}! Сейчас я пробегусь по всему агентству и всё покажу. Беги за мной!' },
    { sel: '[data-go="school"]', title: '🎓 Школа сыщика', text: 'Начни отсюда! Я объясню каждую тему по шагам, а потом решаем вместе. Ошибаться не страшно — я подскажу.' },
    { sel: '[data-go="academy"]', title: '📚 Академия', text: 'Космос, тело человека, безопасность, общение… Прочитай урок, нажми «Проверь себя» — и получи награду!' },
    { sel: '[data-go="newcase"]', title: '🔍 Новое дело', text: 'В Сладкограде кто-то ворует сладости! Решай задачи — за каждую дают улику. Четыре улики — и вор пойман!' },
    { sel: '[data-go="blitz"]', title: '⚡ Быстрые лапки', text: '60 секунд на таблицу умножения. Сможешь побить свой рекорд? Я буду болеть за тебя!' },
    { sel: '[data-go="games"]', title: '🎲 Детективные игры', text: 'Волшебные весы, сейф, допрос, погоня… Играешь — и думаешь как настоящий сыщик.' },
    { sel: '.hs-cat .hs-title', title: '🐱 Мой котик', text: 'А тут всё про меня! Наряды, примерочная, фотостудия, болтовня со мной и студия звуков.' },
    { sel: '[data-go="house"]', title: '🏠 Мой домик', text: 'Корми меня, играй со мной, укладывай спать. Новые комнаты открываются за решённые задачи. Мур!' },
    { sel: '.hs-social .hs-title', title: '🏆 Друзья и награды', text: 'Дипломы за пройденные темы, значки за подвиги и гости в домиках у друзей.' },
    { sel: ['.home-top .candy', '.pill.candy'], title: '🍬 Конфеты и 💎 кристаллы', fx: 'candy', text: 'Конфеты дают за задачи, кристаллы — за сложные. Тратим их в Кондитерской! А огонёк 🔥 — сколько дней подряд ты занимаешься.' },
    { sel: '.daily', title: '🎁 Задание дня', text: 'Реши 5, 10 и 20 задач за день — и откроются сундуки с подарками!' },
    { sel: '#cfg', title: '⚙️ Настройки', text: 'Звук, голос, музыка — здесь. И сюда можно снова позвать меня на экскурсию. Ну что, {g:готов|готова} раскрывать дела?' }
  ];
  function kidTour() {
    if (curScreen !== 'home') return Promise.resolve(false);
    return run({ id: 'kid', from: '.hero-cat', steps: KID, lastLabel: 'Начинаем! 🐾', onEnd(done) {
      S.tourDone = 1; tours(); NEWT.forEach(d => { S.tours['new:' + d.id] = 1; }); save();
      if (done) { SND.win(); confetti(50); setTimeout(() => say(['Ура! Теперь ты знаешь всё агентство!', 'Начнём со Школы сыщика?'], 4500), 600); }
    } });
  }

  /* ---------- мини-экскурсии на экранах (один раз на экран) ---------- */
  const MINI = {
    school: [
      { sel: '.school-head', title: '📐 Вся математика 4 класса', text: 'Полоска показывает, сколько программы ты уже {g:прошёл|прошла}.' },
      { sel: '.sgroup > summary', title: 'Темы в группах', text: 'Нажми на группу — она раскроется. В каждой теме урок, тренажёр и три уровня сложности.' },
      { sel: '.page .row-btns [data-go="newcase"]', title: '🔍 Решать в деле', text: 'Задачи из школы превращаются в улики. Так учиться ещё интереснее!' }
    ],
    academy: [
      { sel: '.acad-card', title: '📚 Предметы Академии', text: 'Каждая карточка — свой предмет: уроки с картинками, игры и вопросы.' },
      { sel: '.acad-card .bar', title: 'Твой прогресс', text: 'Полоска растёт с каждым уроком. Пройдёшь предмет до конца — получишь диплом 📜!' }
    ],
    newcase: [
      { sel: '.choice-grid.topic', title: 'Выбери улики', text: 'Столбик, уравнения или всё вперемешку. За уравнения — двойные конфеты!' },
      { sel: '.seg.diff', title: 'Сложность', text: 'Чем сложнее дело, тем больше награда. На сложном бывают кристаллы 💎.' },
      { sel: '#go', title: 'Вперёд!', text: 'Жми «Взять дело» — и начнём искать вора сладостей!' }
    ],
    house: [
      { sel: '#cb', title: '🐟 Что мне нужно', text: 'Еда, вода, игра, сон и чистота. Нажимай на полоски — и я буду довольный!' },
      { sel: '#rt', title: 'Комнаты', text: 'Замочки открываются за решённые задачи. Сколько комнат ты откроешь?' },
      { sel: '#room', title: 'Двигай и гладь', text: 'Вещи двигаются пальцем, а меня можно гладить. Попробуй!' },
      { sel: '#hshop', title: '🛍️ Магазин вещей', text: 'Конфеты — на мебель и игрушки для домика.' }
    ],
    blitz: [
      { sel: ['.bz-grid', '.drill-modes'], title: 'Выбери режим', text: 'Таблица умножения, деление, ×10 и ×100, счёт в уме — у каждого режима свой рекорд 🏆.' },
      { sel: '#bzfp', title: '🎓 Факты Академии', text: 'Правда или нет? 60 секунд вопросов по любому предмету Академии.' },
      { sel: '#go', title: '⚡ 60 секунд!', text: 'Отвечай быстро: каждый верный ответ — очко. Побей свой рекорд!' }
    ],
    friends: [
      { sel: ['.fr-me', '.page .card'], title: '🤝 Друзья', text: 'Обменяйтесь кодами — и можно ходить в гости в домики, ставить ❤️ и дарить подарки.' },
      { sel: ['.fr-add', '.fr-list', '.page .btn.pink'], title: 'Как добавить друга', text: 'Введи код друга. Если кнопка просит взрослого — позови маму или папу.' }
    ],
    diplomas: [
      { sel: ['.dp-next', '.page.diplomas .card'], title: '📜 Дипломы', text: 'Пройди тему до конца — получишь диплом. Его можно сохранить и показать маме!' },
      { sel: '.badge-grid', title: '🎖️ Значки', text: 'Первое дело, три дня подряд, быстрые лапки… Собери все!' }
    ]
  };
  function miniTour(n) {
    return run({ id: n, steps: MINI[n], onEnd(done, how, seen) { if (how !== 'nav' || seen) { tours()[n] = 1; save(); } } });
  }
  async function miniCheck(n) {
    if (T || autoOff() || !S.kid) return; initState();
    if (tours()[n] || !(S.tourDone || S.tourVet)) return;
    if (!await quiet(700, 15000, n) || T || tours()[n]) return;
    miniTour(n);
  }

  /* ---------- экскурсия для взрослых ---------- */
  const tab = id => { const b = document.querySelector(`.ptabs [data-tab="${id}"]`); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); };
  const pane = id => document.querySelector(`.ptab-pane[data-tab="${id}"]`);
  const ADULT = [
    { sel: '.ptabs', title: 'Здравствуйте! Я {cat} 🕵️', text: 'Проведу вас по разделу для взрослых — это займёт минуту. Здесь три вкладки: «Обзор», «Прогресс» и «Кабинет».' },
    { before: () => tab('sum'), find: () => { const p = pane('sum'); return p && (p.querySelector('.coach-rep .card, .coach-rep, .kpis') || p.querySelector('.card')); }, title: '📊 Обзор', text: 'Главные цифры: дни занятий, решённые задачи, раскрытые дела, серия дней подряд и минуты активных занятий за неделю.' },
    { before: () => tab('sum'), find: () => byH('Зоны роста', pane('sum') || document) || byH('Сильные', pane('sum') || document), title: 'Сильные стороны и зоны роста', text: 'Что получается лучше всего и где ребёнку пока трудно — с конкретными советами на неделю.' },
    { before: () => tab('prog'), find: () => { const p = pane('prog'); return p && p.querySelector('.card'); }, title: '📈 Прогресс', text: 'Подробно по темам: сколько решено и сколько без ошибок, типичные ошибки, трудные примеры и активность за две недели.' },
    { before: () => tab('acc'), find: () => document.querySelector('.ptab-pane .acc-card'), title: '👨‍👩‍👧 Личный кабинет', text: 'Семья и дети, семейный код для входа на других устройствах, приглашения, отчёты в Telegram, приоритетные темы, ваши данные и согласие.' },
    { before: () => tab('acc'), find: () => byH('Разговоры', pane('acc') || document), title: '💬 Разговоры с котиком', text: 'Здесь можно разрешить или выключить разговоры с котиком и посмотреть, что он отметил как важное.' },
    { before: () => tab('acc'), find: () => { const e = document.querySelector('#timelimit, .time-limit'); return e && (e.closest('.card') || e); }, title: '⏱️ Ограничение времени', text: 'Сколько минут в день ребёнок может заниматься.' },
    { before: () => tab('acc'), find: () => { const b = document.querySelector('.ptab-pane #pinset'); return b && (b.closest('.card') || b); }, title: '🔐 ПИН', text: 'Раздел закрыт замком. Здесь можно поставить или сменить ПИН. Не показывайте его ребёнку; если забудете — войдёте по коду из почты.' },
    { before: () => tab('acc'), sel: '.tour-card', title: 'Готово!', text: 'Экскурсию можно повторить здесь в любой момент. Спасибо, что занимаетесь вместе с ребёнком!' }
  ];
  function adultTour() {
    let was = 'sum'; try { was = sessionStorage.getItem('ptab') || 'sum'; } catch (e) { }
    return run({ id: 'parents', adult: true, steps: ADULT, onEnd(done, how, seen) { if (how !== 'nav') { tab(was); window.scrollTo({ top: 0 }); } if (how !== 'nav' || seen) { tours().parents = 1; save(); } } });
  }
  const PCAB = [
    { find: () => { const c = document.querySelector('.acc .ccode'); return c && c.closest('.card'); }, wait: 1500, title: 'Семья и семейный код 🕵️', text: 'По этому коду ребёнок входит на новом устройстве: «У меня есть семейный код», выбирает себя и вводит картинку-ПИН.' },
    { find: () => byH('Дети', document.querySelector('.acc') || document), title: 'Дети', text: 'Прогресс каждого ребёнка: опыт, дела, минуты за неделю, картинка-ПИН. Здесь же можно добавить ребёнка.' },
    { sel: '.acc .prio', title: '🎯 Приоритеты', text: 'Отметьте важные темы — котик-тренер будет чаще их предлагать и поднимет выше в Академии.' },
    { find: () => byH('Реферальные', document.querySelector('.acc') || document), title: '🔗 Приглашения', text: 'Ваша ссылка для знакомых. Это только счётчик переходов — друзьями в игре она не делает.' },
    { sel: '#tgcard2', title: '📬 Отчёт в Telegram', text: 'По воскресеньям в 19:00 бот присылает отчёт по всем детям: минуты, задачи, сильные стороны и трудности.' },
    { find: () => byH('Данные и согласие', document.querySelector('.acc') || document), title: '📄 Данные и согласие', text: 'Выгрузка всех данных, удаление аккаунта, политика и согласие на обработку данных.' }
  ];
  async function pcabCheck() {
    if (T || autoOff() || tours().pcab) return;
    const t0 = Date.now(); while (!document.querySelector('.acc .ccode') && Date.now() - t0 < 10000) { await wait(300); if (curScreen !== 'pcab') return; }
    if (!document.querySelector('.acc .ccode') || !await quiet(500, 10000, 'pcab') || T) return;
    run({ id: 'pcab', adult: true, steps: PCAB, onEnd(done, how, seen) { if (how !== 'nav' || seen) { tours().pcab = 1; save(); } } });
  }

  /* ---------- «Что нового»: короткие показы новинок после обновления ---------- */
  const NEWT = [];
  function whatsNew(def) { if (def && def.id && def.steps && !NEWT.some(d => d.id === def.id)) NEWT.push(def); }
  const pendingNew = screen => S.kid && (S.tourDone || S.tourVet) && S.seenVersion === APP_VERSION && NEWT.find(d => (d.screen || 'home') === screen && !tours()['new:' + d.id] && +d.ver <= +APP_VERSION);
  async function newCheck(screen) {
    if (T || autoOff() || screen === 'home') return; // главная проверяется в homeCheck
    if (!pendingNew(screen) || !await quiet(800, 15000, screen) || T) return;
    const d = pendingNew(screen); if (d) runNew(d);
  }
  const runNew = d => run({ id: 'new:' + d.id, steps: d.steps.slice(0, 3), adult: !!d.adult, lastLabel: d.lastLabel || 'Здорово! 🐾', onEnd(done, how, seen) { if (how !== 'nav' || seen) { tours()['new:' + d.id] = 1; save(); } } });
  whatsNew({ id: 'excursion', ver: '29', steps: [{ sel: '#cfg', title: 'Новинка: экскурсия с котиком! 🐾', text: 'Нажми ⚙️ → «Экскурсия с котиком» — и я пробегусь по всему агентству и всё покажу.' }] });
  try { if (Array.isArray(NEWS) && !NEWS.some(x => /Экскурсия с котиком/.test(x))) NEWS.unshift('🐾 Экскурсия с котиком: котик сам бегает по разделам и рассказывает, что где и как играть'); } catch (e) { }

  /* ---------- подключение к экранам ---------- */
  let homeTok = 0;
  async function homeCheck() {
    const my = ++homeTok;
    if (T || autoOff() || !S.kid) return; initState();
    const need = () => (!S.tourDone && !S.tourVet) || pendingNew('home');
    if (!need() || !await quiet(1500, 120000, 'home') || my !== homeTok || T) return;
    if (!S.tourDone && !S.tourVet) return kidTour();
    const d = pendingNew('home'); if (d) runNew(d);
  }
  const after = (name, f) => { const s = SCREENS[name]; if (!s) return; SCREENS[name] = arg => { const r = s(arg); try { f(arg); } catch (e) { console.warn(e); } return r; }; };
  after('home', () => setTimeout(homeCheck, 900));
  Object.keys(MINI).forEach(n => after(n, () => setTimeout(() => miniCheck(n), 900)));
  after('parents', () => {
    const pg = $('.page.parents', app); if (!pg) return;
    const rs = $('#reset', pg), html = '<div class="card tour-card"><h3>🐾 Как устроен этот раздел</h3><p class="small">Котик-сыщик за минуту покажет, где отчёты, прогресс, кабинет и настройки.</p><div class="row-btns"><button class="btn" id="tour-adult">🕵️ Экскурсия по разделу</button></div></div>';
    if (rs) rs.insertAdjacentHTML('beforebegin', html); else pg.insertAdjacentHTML('beforeend', html);
    $('#tour-adult', pg).addEventListener('click', () => { SND.tap(); adultTour(); });
    setTimeout(async () => { if (T || autoOff() || tours().parents) return; if (await quiet(600, 15000, 'parents') && !T && !tours().parents) adultTour(); }, 900);
  });
  after('pcab', () => setTimeout(pcabCheck, 600));
  // ⚙️ → «Экскурсия с котиком»: большая экскурсия заново, мини-экскурсии на экранах тоже покажутся ещё раз
  { const os = openSettings; openSettings = function () { const r = os.apply(this, arguments); const L = $$('.modal .set-list').pop();
    if (L && !$('#set-tour', L)) {
      const row = '<button class="set-row" id="set-tour"><span>🐾</span><b>Экскурсия с котиком</b><i class="arr">›</i></button>';
      const mus = $('#mus', L); if (mus) mus.insertAdjacentHTML('afterend', row); else L.insertAdjacentHTML('beforeend', row);
      $('#set-tour', L).addEventListener('click', () => { $$('.modal').forEach(x => x.remove()); replayKid(); });
    } return r; }; }
  function replayKid() {
    tours(); Object.keys(MINI).forEach(k => { delete S.tours[k]; }); delete S.tourVet; save();
    if (curScreen !== 'home') { go('home'); setTimeout(kidTour, 700); } else setTimeout(kidTour, 150);
  }
  return { run, whatsNew, kidTour, miniTour: n => (MINI[n] ? miniTour(n) : Promise.resolve(false)), adultTour, replayKid, end: () => end(false, 'skip'), get active() { return !!T; }, get step() { return T ? T.i : -1; }, MINI, KID, ADULT };
})();
window.Tour = Tour;
