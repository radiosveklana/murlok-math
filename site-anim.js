/* site-anim.js — оживление лендинга «Мурлок и Ко». Без библиотек: IntersectionObserver + CSS + Web Animations API.
   Всё — прогрессивное улучшение: если скрипт не загрузился, контент уже виден (см. страховку в site-anim.css).
   Анимируем только transform / translate / rotate / scale и opacity. prefers-reduced-motion — всё лишнее выключено. */
(() => {
  'use strict';
  const D = document, ROOT = D.documentElement, NS = 'http://www.w3.org/2000/svg';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const SMALL = matchMedia('(max-width: 700px)').matches;
  const $ = (s, r = D) => r.querySelector(s), $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const el = (tag, cls, html) => { const e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const hide = n => { n.setAttribute('aria-hidden', 'true'); return n; };
  ROOT.classList.add('mk-js');

  /* ── общий наблюдатель «попал в кадр»: один раз ставит .mk-in и зовёт колбэк ── */
  const hooks = new WeakMap();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('mk-in'); io.unobserve(e.target);
    const f = hooks.get(e.target); if (f) f(e.target);
  }), { rootMargin: '0px 0px -12% 0px' }) : null;
  const onView = (node, f) => { if (!node) return; if (f) hooks.set(node, f); if (io) io.observe(node); else { node.classList.add('mk-in'); if (f) f(node); } };
  // постоянный наблюдатель видимости — чтобы ставить на паузу то, что за экраном
  const vis = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    e.target.classList.toggle('mk-off', !e.isIntersecting); if (e.target._mk) e.target._mk.off = !e.isIntersecting;
  })) : null;

  /* ══════════ 1. Первый экран: заголовок по словам, порядок появления, пульс кнопки ══════════ */
  const hero = $('.hero');
  function heroIntro() {
    if (!hero) return;
    const h1 = $('h1', hero);
    let t = .12, i = 0;
    if (h1 && !RM) {
      const setD = n => { n.classList.add('mk-w'); n.style.setProperty('--d', (t + i++ * .075).toFixed(3) + 's'); };
      [...h1.childNodes].forEach(n => {
        if (n.nodeType === 3) { // текст → слова; пробелы остаются текстом, переносы строк не ломаются
          const frag = D.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(D.createTextNode(part));
            else { const s = el('span'); s.textContent = part; setD(s); frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) setD(n); // <em>расследование</em> — одним словом, с подчёркиванием
      });
      t += i * .075;
      h1.style.setProperty('--ud', (t + .2).toFixed(2) + 's');
    }
    [['.lead', t + .1], ['.cta', t + .22], ['.note', t + .34]].forEach(([s, d]) => { const n = $(s, hero); if (n) n.style.setProperty('--d', d.toFixed(2) + 's'); });
    $$('.phone', hero).forEach((p, k) => p.style.setProperty('--d', (.2 + k * .18).toFixed(2) + 's'));
    const cta = $('.cta .btn.pink', hero); if (cta) cta.classList.add('mk-pulse');
    ROOT.classList.add('mk-go');
    if (vis) vis.observe(hero);
  }

  /* ══════════ 2. Плавающие сладости и улики + параллакс ══════════ */
  const layers = []; // { n, d } — элемент и глубина
  function heroFx() {
    if (!hero || RM) return;
    const fx = hide(el('div', 'mk-fx'));
    // x%, y%, эмодзи, размер, глубина
    const ALL = [[3, 12, '🍬', 34, .5], [93, 8, '🔍', 30, .8], [46, 3, '🧁', 26, .3], [2, 60, '👣', 28, .7], [95, 52, '🍭', 34, .45],
      [44, 90, '🗝️', 26, .9], [56, 44, '🍩', 24, .25], [22, 94, '🍪', 26, .6], [80, 94, '📜', 26, .35], [70, 2, '⭐', 22, .55]];
    // на телефоне частиц меньше и они не лезут на текст: сверху у края и в зоне телефонов
    const list = SMALL ? [[5, 1.5, '🍬', 34, .5], [88, 2.5, '🔍', 30, .8], [3, 60, '👣', 28, .7], [93, 64, '🍭', 34, .45], [6, 93, '🍪', 28, .6]] : ALL;
    list.forEach(([x, y, e, s, d]) => {
      const p = el('span', 'mk-p', '<i>' + e + '</i>');
      p.style.cssText = `left:${x}%;top:${y}%;--s:${SMALL ? Math.round(s * .72) : s}px;--t:${rnd(4.5, 7.5).toFixed(1)}s;--dl:${(-rnd(0, 6)).toFixed(1)}s` + (SMALL ? ';opacity:.6' : '');
      fx.appendChild(p); layers.push({ n: p, d });
    });
    hero.prepend(fx);
    $$('.stk', hero).forEach((n, k) => { n.classList.add('mk-px'); layers.push({ n, d: [.6, .85, .4][k] || .5 }); });
  }

  /* ══════════ 3. Живой котик Мурлок (SVG из about/shots/cat.svg — его же рисует catSVG из cat.js) ══════════ */
  const cats = [];
  const SAY = ['Мур!', 'Мяу! Найдём вора?', 'Мур-р-р…', 'Улика где-то рядом!', 'Ещё задачку?'];
  let catSrc = null;
  const loadCat = () => catSrc || (catSrc = fetch('about/shots/cat.svg').then(r => r.ok ? r.text() : '').catch(() => ''));
  async function makeCat(cls) {
    const txt = await loadCat();
    if (!/^<svg[\s>]/.test(txt.trim())) return null;
    const box = el('div', 'mk-cat' + (cls ? ' ' + cls : ''), '<div class="mk-shadow"></div>' + txt.replace(/\swidth="\d+"\s+height="\d+"/, ''));
    const svg = $('svg', box), head = $('.head', svg), eyes = $('.eyes', svg);
    if (!svg || !head) return null;
    // всё, что после головы, — лапка с лупой: собираем в группу, чтобы водить ею
    const loupe = D.createElementNS(NS, 'g'); loupe.setAttribute('class', 'mk-loupe');
    for (let n = head.nextElementSibling; n;) { const nx = n.nextElementSibling; loupe.appendChild(n); n = nx; }
    if (loupe.childNodes.length) svg.appendChild(loupe);
    // зрачки (радужка + зрачок + блики) — в отдельные группы, чтобы смотрели на курсор
    const pupils = [];
    if (eyes && eyes.children.length === 12) {
      const kids = [...eyes.children];
      [0, 6].forEach(k => { const g = D.createElementNS(NS, 'g'); g.setAttribute('class', 'mk-pupil'); kids[k].after(g); kids.slice(k + 1, k + 5).forEach(c => g.appendChild(c)); pupils.push(g); });
    }
    const bub = el('div', 'mk-bub'); box.appendChild(bub);
    const cat = { box, svg, head, eyes, pupils, bub, shadow: $('.mk-shadow', box), earR: $('.ear-r', svg), earL: $('.ear-l', svg), off: false, lookT: 0 };
    box._mk = cat;
    svg.style.transformOrigin = '50% 100%';
    box.addEventListener('pointerdown', e => { e.stopPropagation(); poke(cat); });
    cats.push(cat);
    if (vis) vis.observe(box);
    if (!RM) life(cat);
    return cat;
  }
  // моргание и подёргивание ушком — случайные интервалы, только когда котик на экране
  function life(cat) {
    const blink = () => {
      if (!cat.off && !D.hidden && cat.eyes) {
        const k = [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)', offset: .45 }, { transform: 'scaleY(1)' }];
        cat.eyes.animate(k, { duration: 190, easing: 'ease-in-out' });
        if (Math.random() < .25) setTimeout(() => cat.eyes.animate(k, { duration: 170 }), 260); // двойное моргание
      }
      setTimeout(blink, rnd(2200, 5200));
    };
    setTimeout(blink, rnd(900, 2000));
    const ear = () => {
      const e = Math.random() < .5 ? cat.earR : cat.earL, s = e === cat.earR ? 1 : -1;
      if (e && !cat.off && !D.hidden) e.animate([{ transform: 'rotate(0)' }, { transform: `rotate(${-14 * s}deg)`, offset: .3 }, { transform: `rotate(${5 * s}deg)`, offset: .65 }, { transform: 'rotate(0)' }], { duration: 420, easing: 'ease-out' });
      setTimeout(ear, rnd(3500, 8000));
    };
    setTimeout(ear, rnd(2500, 5000));
  }
  function say(cat, text) {
    cat.bub.textContent = text || SAY[(cat.sayI = ((cat.sayI ?? -1) + 1) % SAY.length)];
    cat.bub.classList.add('on'); clearTimeout(cat.bt); cat.bt = setTimeout(() => cat.bub.classList.remove('on'), 1700);
  }
  // тап по котику: прыжок с «пружиной», довольные глазки, хвост виляет, сладости разлетаются
  function poke(cat, text) {
    say(cat, text);
    if (RM) return;
    cat.svg.animate([{ transform: 'none' }, { transform: 'translateY(2%) scale(1.07,.9)', offset: .14 }, { transform: 'translateY(-17%) scale(.95,1.06)', offset: .45 }, { transform: 'translateY(0) scale(1.05,.95)', offset: .78 }, { transform: 'none' }], { duration: 700, easing: 'ease-out' });
    if (cat.shadow) cat.shadow.animate([{ transform: 'none' }, { transform: 'scale(.6)', opacity: .5, offset: .45 }, { transform: 'none' }], { duration: 700, easing: 'ease-out' });
    if (cat.eyes) cat.eyes.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.32)', offset: .12 }, { transform: 'scaleY(.32)', offset: .85 }, { transform: 'scaleY(1)' }], { duration: 950 });
    cat.box.classList.add('mk-happy'); clearTimeout(cat.ht); cat.ht = setTimeout(() => cat.box.classList.remove('mk-happy'), 1300);
    ['❤️', '🍬', '⭐', '🍭', '🐾'].slice(0, SMALL ? 3 : 5).forEach((e, k, a) => {
      const s = hide(el('span', 'mk-spark', e)), ang = (-140 + k * (100 / Math.max(1, a.length - 1))) * Math.PI / 180;
      s.style.cssText = `--x:${Math.round(Math.cos(ang) * rnd(70, 110))}px;--y:${Math.round(Math.sin(ang) * rnd(80, 120))}px;--r:${Math.round(rnd(-40, 40))}deg;animation-delay:${k * 40}ms`;
      s.addEventListener('animationend', () => s.remove()); cat.box.appendChild(s);
    });
  }
  // взгляд и наклон головы в сторону точки (курсор или тап)
  function look(cat, rect, x, y) {
    const cx = rect.left + rect.width * .48, cy = rect.top + rect.height * .38, dx = x - cx, dy = y - cy;
    const dist = Math.hypot(dx, dy) || 1, k = clamp(dist / 260), ux = dx / dist * k, uy = dy / dist * k;
    cat.pupils.forEach(p => { p.style.transform = `translate(${(ux * 3.8).toFixed(2)}px,${(uy * 3.4).toFixed(2)}px)`; });
    cat.head.style.transform = `rotate(${(ux * 7).toFixed(2)}deg) translate(${(ux * 2).toFixed(2)}px,${(uy * 2.5).toFixed(2)}px)`;
  }
  function lookHome(cat) { cat.pupils.forEach(p => { p.style.transform = ''; }); cat.head.style.transform = ''; }

  /* ══════════ 4. Скролл: каскады, веер карточек, счётчики, улика ══════════ */
  function stagger() {
    $$('.grid3.rv, .stats.rv, .steps.rv').forEach(g => {
      [...g.children].forEach((c, i) => c.style.setProperty('--dl', (i * .07).toFixed(2) + 's'));
      g.classList.add('mk-stag');
    });
  }
  function counters() {
    const box = $('.stats'); if (!box || RM) return;
    const items = $$('.stat b', box).map(b => { const m = b.textContent.trim().match(/^(\d+)(\D*)$/); return m && { b, to: +m[1], suf: m[2] }; }).filter(Boolean);
    items.forEach(it => { it.b.textContent = '0' + it.suf; });
    onView(box, () => {
      const t0 = performance.now(), dur = 1600;
      const step = now => {
        const p = clamp((now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        items.forEach(it => { it.b.textContent = Math.round(it.to * e) + it.suf; });
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  function fan() { // карточки предметов Академии раскладываются веером поверх телефона
    const shot = $('#kids .shot.c-gold'); if (!shot) return;
    const subj = [['🚀', 'Космос'], ['🌍', 'Окружа&shy;ющий мир'], ['⛑️', 'ОБЖ'], ['🧠', 'Мышление'], ['⚡', 'Скоро&shy;чтение']];
    const f = hide(el('div', 'mk-fan'));
    subj.forEach(([e, t], k) => {
      const c = el('div', 'mk-card', `<b>${e}</b><span>${t}</span>`);
      c.style.setProperty('--k', k - 2); c.style.setProperty('--a', (k - 2) * 8 + 'deg'); c.style.setProperty('--y', Math.abs(k - 2) * 9 + 'px'); c.style.setProperty('--dl', (.2 + k * .08).toFixed(2) + 's');
      f.appendChild(c);
    });
    shot.appendChild(f); onView(shot);
  }
  let clue = null;
  function clueInit() { // конверт с уликой в «Детективных делах»: открывается по мере прокрутки
    const shot = $('#kids .feat .shot.c-pink'); if (!shot) return;
    const c = hide(el('div', 'mk-clue', '<div class="mk-env-back"></div><div class="mk-note"><b>👣</b>Улика<br><span>найдена!</span></div><div class="mk-env-front"></div><div class="mk-flap"></div>'));
    shot.appendChild(c);
    clue = { shot, flap: $('.mk-flap', c), note: $('.mk-note', c), p: -1 };
    clueSet(RM ? 1 : 0);
  }
  function clueSet(p) {
    if (!clue || Math.abs(p - clue.p) < .002) return; clue.p = p;
    const f = clamp(p / .45), n = clamp((p - .38) / .62), ne = 1 - Math.pow(1 - n, 3);
    clue.flap.style.transform = `rotateX(${(f * 180).toFixed(1)}deg)`;
    clue.flap.classList.toggle('back', f > .5);
    clue.note.style.opacity = clamp((p - .3) / .1).toFixed(2);
    clue.note.style.transform = `translateY(${(-ne * 62).toFixed(1)}%) rotate(${(ne * 4).toFixed(1)}deg)`;
  }

  /* ══════════ 5. Родителям: макет отчёта + «Проверь мою тетрадь» ══════════ */
  function report() {
    const grid = $('#parents .grid3'); if (!grid) return;
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], hs = [.55, .8, .38, .95, .7, .45, .62];
    const row = hide(el('div', 'mk-rep-row', `<div class="mk-rep">
      <div class="mk-rep-h"><b>📬 Отчёт за неделю</b><span>пример · Кэтика</span></div>
      <div class="mk-rep-b">
        <div><div class="mk-cap">Минуты по дням</div><div class="mk-bars">${days.map((d, k) => `<div class="mk-bar" style="--h:${hs[k]};--dl:${(k * .08).toFixed(2)}s"><i></i><span>${d}</span></div>`).join('')}</div></div>
        <div class="mk-acc"><div class="mk-cap">Точность</div><b>87%</b><div class="mk-track" style="--v:.87"><i></i></div></div>
      </div>
      <div class="mk-tags">
        <div class="mk-tag good" style="--dl:.9s"><small>Сильные стороны</small>💪 Умножение столбиком, деление с остатком</div>
        <div class="mk-tag grow" style="--dl:1.1s"><small>Зоны роста</small>🌱 Уравнения в два действия</div>
      </div></div>`));
    grid.after(row);
    const rep = $('.mk-rep', row), acc = $('.mk-acc b', row);
    if (RM) { rep.classList.add('mk-in'); return; }
    acc.textContent = '0%';
    onView(rep, () => {
      const t0 = performance.now() + 300, dur = 1400;
      const step = now => { const p = clamp((now - t0) / dur), e = 1 - Math.pow(1 - p, 3); acc.textContent = Math.round(87 * e) + '%'; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  function column() { // мини-демо «решение столбиком» печатается по шагам: 347 × 24 = 8328
    const q = $('.report .quote'); if (!q) return;
    const R = [['', '', '3', '4', '7', ''], ['×', '', '', '2', '4', ''], 'ln', ['', '1', '3', '8', '8', '✓'], ['', '6', '9', '4', '', '✓'], 'ln', ['', '8', '3', '2', '8', '✓']];
    const col = hide(el('div', 'mk-col', '<div class="mk-col-h">✏️ Проверь мою тетрадь</div><div class="mk-grid"></div><div class="mk-col-ok">🐾 Все шаги верны!</div>'));
    const grid = $('.mk-grid', col), seq = [];
    R.forEach((r, ri) => {
      if (r === 'ln') { const l = el('i', 'ln'); grid.appendChild(l); seq.push([l]); return; }
      const cells = r.map((v, ci) => { const s = el('span', ci === 5 && v ? 'ok' : '', v || ''); grid.appendChild(s); return s; });
      if (ri < 2) seq.push(cells.filter(s => s.textContent)); // условие появляется строкой
      else { for (let ci = 4; ci >= 0; ci--) if (cells[ci].textContent) seq.push([cells[ci], 'cur']); seq.push([cells[5]]); } // цифры — справа налево, как считают
    });
    seq.push([$('.mk-col-ok', col)]);
    q.after(col);
    if (RM) return;
    col.classList.add('mk-typing');
    let timers = [];
    const play = () => {
      timers.forEach(clearTimeout); timers = [];
      col.classList.add('mk-typing'); $$('.on, .cur', col).forEach(n => n.classList.remove('on', 'cur'));
      seq.forEach((step, k) => timers.push(setTimeout(() => {
        $$('.cur', col).forEach(n => n.classList.remove('cur'));
        step.forEach(n => { if (n === 'cur') return; n.classList.add('on'); if (step[1] === 'cur') n.classList.add('cur'); });
        if (k === seq.length - 1) timers.push(setTimeout(() => $$('.cur', col).forEach(n => n.classList.remove('cur')), 300));
      }, 250 + k * 190)));
    };
    onView(col, play);
    col.addEventListener('click', play); // тап — напечатать заново
  }

  /* ══════════ 6. Микровзаимодействия: лёгкий tilt карточек ══════════ */
  function tilt() {
    if (!FINE || RM) return;
    $$('.card, .stat, .step, .feat .shot, .mk-rep').forEach(n => {
      n.classList.add('mk-tilt');
      let raf = 0, ev = null;
      n.addEventListener('pointermove', e => {
        ev = e; if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0; const r = n.getBoundingClientRect();
          const x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5, m = Math.hypot(x, y);
          const max = n.classList.contains('shot') ? 5 : 9;
          n.classList.add('mk-tilting');
          n.style.rotate = m < .01 ? '' : `${(-y).toFixed(3)} ${x.toFixed(3)} 0 ${(m * max * 1.6).toFixed(2)}deg`;
          n.style.scale = '1.02';
        });
      });
      n.addEventListener('pointerleave', () => { n.classList.remove('mk-tilting'); n.style.rotate = ''; n.style.scale = ''; });
    });
  }

  /* ══════════ 7. Видео-обзор: показываем секцию, только если файл есть ══════════ */
  function video() {
    const sec = $('#video'), v = sec && $('video', sec); if (!v) return;
    const box = $('.mk-vbox', sec), btn = $('.mk-play', sec), src = ($('source', v) || v).getAttribute('src');
    if (src) fetch(src, { method: 'HEAD', cache: 'no-store' }).then(r => {
      const t = r.headers.get('content-type') || '';
      if (r.ok && !/text\/html/i.test(t)) { if (v.dataset.poster) v.poster = v.dataset.poster; sec.hidden = false; } // постер грузим, только когда видео есть
    }).catch(() => { });
    if (btn) btn.addEventListener('click', () => { const p = v.play(); if (p && p.catch) p.catch(() => { }); });
    v.addEventListener('play', () => box && box.classList.add('playing'));
    v.addEventListener('error', () => { sec.hidden = true; }, true); // ошибка <source> ловится на погружении
  }

  /* ══════════ общий кадр: сначала все чтения, потом все записи ══════════ */
  const prog = RM ? null : hide(el('div', 'mk-prog'));
  if (prog) D.body.prepend(prog);
  let queued = false, px = -1, py = -1, pointerAt = 0, moved = false;
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  function frame() {
    queued = false;
    // чтения
    const y = scrollY, vh = innerHeight, max = ROOT.scrollHeight - vh;
    const heroH = hero ? hero.offsetHeight : 0;
    const clueTop = clue && !RM ? clue.shot.getBoundingClientRect().top : null;
    const looks = moved ? cats.filter(c => !c.off).map(c => [c, c.svg.getBoundingClientRect()]) : [];
    // записи
    if (prog) prog.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    if (layers.length && y < heroH + 100) {
      const mx = FINE && px >= 0 ? px / innerWidth - .5 : 0, my = FINE && py >= 0 ? py / vh - .5 : 0;
      layers.forEach(({ n, d }) => { n.style.translate = `${(-mx * d * 36).toFixed(1)}px ${(-my * d * 24 - y * d * .35).toFixed(1)}px`; });
    }
    if (clueTop != null) clueSet(clamp((vh * .85 - clueTop) / (vh * .6)));
    if (moved) { looks.forEach(([c, r]) => look(c, r, px, py)); moved = false; }
  }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  if (!RM) {
    addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; px = e.clientX; py = e.clientY; pointerAt = Date.now(); moved = true; queue(); }, { passive: true });
    addEventListener('pointerdown', e => { px = e.clientX; py = e.clientY; pointerAt = Date.now(); moved = true; queue(); }, { passive: true });
    D.addEventListener('mouseleave', () => { pointerAt = 0; });
    // если курсор давно не двигался — сыщик сам осматривается по сторонам
    setInterval(() => {
      if (D.hidden || Date.now() - pointerAt < 2600) return;
      cats.forEach(c => {
        if (c.off) return;
        if (Math.random() < .55) { const r = c.svg.getBoundingClientRect(); look(c, r, r.left + r.width * rnd(-1.2, 2.2), r.top + r.height * rnd(-.6, 1)); }
        else lookHome(c);
      });
    }, 1800);
  }

  /* ══════════ запуск ══════════ */
  heroIntro();
  heroFx();
  stagger();
  counters();
  fan();
  clueInit();
  report();
  column();
  tilt();
  video();
  queue();
  const stage = hero && $('.stage', hero);
  if (stage) makeCat().then(cat => {
    if (!cat) return;
    stage.appendChild(cat.box); layers.push({ n: cat.box, d: .12 });
    if (!RM) cat.svg.animate([{ opacity: 0, transform: 'translateY(35%) scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 650, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' });
    queue();
  });
  const finalImg = $('.final img.cat');
  if (finalImg) makeCat('mk-cat-final').then(cat => {
    if (!cat) return;
    cat.box.setAttribute('role', 'img'); cat.box.setAttribute('aria-label', finalImg.alt || 'Котик-сыщик');
    finalImg.replaceWith(cat.box);
    onView(cat.box, () => setTimeout(() => poke(cat, 'Мяу! Найдём вора?'), 350));
  });
})();
