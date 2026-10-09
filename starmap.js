/* starmap.js — настоящее звёздное небо: 2850 звёзд до 5,5 величины и все 88 созвездий МАС
   (данные — content/extra/sky-data.js, подгружается при первом открытии карты).
   Два режима: «Над головой» — небо в эту минуту над Челябинском (или над твоим местом), стереографическая
   проекция с горизонтом и сторонами света; «Всё небо» — карта всей небесной сферы (проекция Хаммера).
   Касание созвездия — карточка: название, факты (для 16 знаменитых — легенды из content/extra/stars.js),
   яркие звёзды, видно ли его сейчас. За каждое новое созвездие — немного конфет и опыта.
   Прогресс — S.starsSeen: старые id (ursa_major, orion…) для 16 знаменитых, коды МАС (Ant, Cen…) — для остальных. */
'use strict';
const StarMap = (() => {
  const D = () => (window.STAR_MAP || { constellations: [], tips: [] });
  const RAD = Math.PI / 180, SQ2 = Math.SQRT2;
  const HOME = { lat: 55.16, lon: 61.40, name: 'Челябинском' };
  /* 16 знаменитых созвездий (старые id прогресса) ↔ коды МАС */
  const OLD = { ursa_major: 'UMa', ursa_minor: 'UMi', cassiopeia: 'Cas', orion: 'Ori', cygnus: 'Cyg', lyra: 'Lyr', aquila: 'Aql', perseus: 'Per', andromeda: 'And', pegasus: 'Peg', draco: 'Dra', gemini: 'Gem', taurus: 'Tau', leo: 'Leo', scorpius: 'Sco', bootes: 'Boo' };
  const IAU2OLD = Object.fromEntries(Object.entries(OLD).map(([o, i]) => [i, o]));
  const key = id => IAU2OLD[id] || id; // ключ в S.starsSeen
  const toIAU = id => OLD[id] || id;
  const FACTS = {
    CMa: 'Здесь живёт Сириус — самая яркая звезда ночного неба. Это верный пёс охотника Ориона: он бежит следом за хозяином. Зимой Сириус низко на юге и переливается разными цветами — его свет проходит через толстый слой воздуха.',
    CMi: 'Маленький пёс Ориона. Почти всё созвездие — две звезды, и одна из них яркий Процион. Процион, Сириус и Бетельгейзе вместе образуют Зимний треугольник.',
    Aur: 'Возничий — пятиугольник из звёзд с яркой жёлтой Капеллой. Зимним вечером Капелла светит почти над головой. На самом деле Капелла — это четыре звезды, которые кружат парами.',
    Cep: 'Цефей — царь, муж Кассиопеи. Созвездие похоже на домик с острой крышей. Земная ось медленно поворачивается, и через пару тысяч лет полярной звездой станет одна из звёзд Цефея.',
    Her: 'Геркулес — самый сильный герой древних мифов. В нём есть шаровое скопление M13 — сотни тысяч звёзд, собранных в шар. В бинокль оно видно как пушистое пятнышко.',
    Oph: 'Змееносец держит огромную змею. Солнце каждый год проходит через Змееносца, хотя его и не считают знаком зодиака.',
    Ser: 'Единственное созвездие из двух частей: голова змеи с одной стороны от Змееносца, хвост — с другой.',
    Sgr: 'Стрелец похож на чайник! В его сторону находится центр нашей Галактики — Млечного Пути. Летом в Челябинске он виден совсем низко над южным горизонтом.',
    Vir: 'Дева — самое большое созвездие зодиака. Её яркая звезда Спика голубая и очень горячая. За Девой, далеко-далеко, прячутся тысячи галактик.',
    Cru: 'Южный Крест — самое маленькое созвездие неба. Его видно только в южных странах: там по нему находят юг, как мы по Полярной звезде — север.',
    Cen: 'В Центавре есть Альфа Центавра — ближайшие к нам звёзды. Их свет летит до нас чуть больше 4 лет. Из России их не видно: они слишком далеко на юге.',
    Car: 'В Киле сияет Канопус — вторая по яркости звезда ночного неба. Киль — часть огромного древнего созвездия Корабль Арго.',
    Vel: 'Паруса — ещё одна часть древнего корабля Арго, на котором плавали герои за золотым руном.',
    Pup: 'Корма — задняя часть корабля Арго. Древний корабль оказался таким большим, что астрономы разрезали его на три созвездия.',
    Cap: 'Козерог — созвездие зодиака в форме треугольника-улыбки. Древние рисовали его как козла с рыбьим хвостом.',
    Aqr: 'Водолей льёт воду из кувшина. Каждый май с этой стороны неба летят «падающие звёзды» — метеорный поток Эта-Аквариды, пылинки от кометы Галлея.',
    Psc: 'Две рыбы, связанные лентой. В Рыбах находится точка весеннего равноденствия: Солнце бывает там около 20 марта, когда день равен ночи.',
    Ari: 'Овен — созвездие зодиака. По мифу, это волшебный баран с золотым руном, за которым плавали аргонавты.',
    Cnc: 'Рак — тусклое созвездие, но в нём есть скопление Ясли: рой звёзд, который в тёмную ночь виден как светлое облачко.',
    Lib: 'Весы — единственное созвездие зодиака, которое изображает не живое существо, а предмет.',
    Del: 'Маленький ромбик с хвостиком — будто дельфин выпрыгивает из воды. Ищи его рядом с Альтаиром.',
    Sge: 'Стрела — одно из самых маленьких созвездий: четыре звезды, похожие на стрелу, летящую между Лебедем и Орлом.',
    CrB: 'Северная Корона — полукруг из звёзд, словно маленькая диадема. Её самая яркая звезда — Гемма, это значит «жемчужина».',
    Eri: 'Эридан — небесная река, одно из самых длинных созвездий. Она течёт от Ориона далеко на юг, к звезде Ахернар, которую у нас не видно.',
    Lep: 'Заяц прячется прямо под ногами Ориона — охотник его так и не поймал.',
    Mon: 'Единорог — тусклое созвездие внутри Зимнего треугольника. Его звёзды слабые, зато через него проходит Млечный Путь.',
    Com: 'Волосы Вероники названы в честь настоящей царицы Береники, которая отдала свои прекрасные волосы богам, чтобы её муж вернулся с войны живым.',
    Cet: 'Кит — морское чудовище из мифа про Андромеду. В нём есть звезда Мира, которая почти год то разгорается, то гаснет так, что её не видно глазом.',
    Hya: 'Гидра — самое большое созвездие неба! Эта длинная водяная змея тянется почти через треть небосвода.',
    Lyn: 'Рысь — созвездие из слабых звёзд. Говорят, его так назвали, потому что разглядеть его может только тот, у кого глаза зоркие, как у рыси.',
    Cam: 'Жираф — большое, но тусклое созвездие рядом с Полярной звездой. В наших краях оно никогда не заходит за горизонт.',
    Vul: 'Лисичка — маленькое созвездие внутри Летнего треугольника. В нём есть туманность «Гантель» — облако газа вокруг старой звезды.',
    Tri: 'Треугольник — три звезды. Рядом с ним прячется галактика Треугольника — ещё один звёздный город по соседству с нашим.',
    Crv: 'Ворон — четыре звезды в виде паруса. По мифу, ворон опоздал принести воды богу Аполлону и в наказание попал на небо.',
    CVn: 'Гончие Псы — две собаки Волопаса, которые гонятся за Большой Медведицей. Здесь прячется красивая галактика «Водоворот».',
    PsA: 'В Южной Рыбе одна яркая звезда — Фомальгаут. Осенью она одиноко светит низко на юге, и её легко узнать.',
    Lac: 'Ящерица — маленькое зигзагообразное созвездие между Лебедем и Андромедой.',
    LMi: 'Малый Лев — тусклое созвездие над головой Льва. Его придумал астроном Ян Гевелий больше 300 лет назад.',
    Sct: 'Щит — маленькое созвездие в самой яркой части Млечного Пути. В бинокль тут видно «Дикую утку» — плотную стайку звёзд.',
    Equ: 'Малый Конь — второе по малости созвездие неба. Рядом с ним пасётся большой конь — Пегас.'
  };
  const SOUTH = 'Это созвездие южного неба. Его придумали мореплаватели, когда плавали в далёкие южные моря.';
  const BV = b => b < -1 ? '#A9C2FF' : b < 2 ? '#CAD8FF' : b < 5 ? '#F4F6FF' : b < 8 ? '#FFF1D8' : b < 12 ? '#FFD6A0' : '#FFB27A';
  const DIRS = ['на север', 'на северо-восток', 'на восток', 'на юго-восток', 'на юг', 'на юго-запад', 'на запад', 'на северо-запад'];
  const FACE = [[180, 'на юг'], [270, 'на запад'], [0, 'на север'], [90, 'на восток']];

  /* ---------- астрономия ---------- */
  const lst = (ms, lon) => { const d = ms / 86400000 + 2440587.5 - 2451545; return ((280.46061837 + 360.98564736629 * d + lon) % 360 + 360) % 360; };
  /* высота и азимут (от севера через восток), градусы */
  const altAz = (ra, dec, ms, lat, lon) => {
    const H = (lst(ms, lon) - ra) * RAD, d = dec * RAD, f = lat * RAD;
    const sa = Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H);
    const az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.cos(f) * Math.sin(d) - Math.sin(f) * Math.cos(d) * Math.cos(H));
    return [Math.asin(sa) / RAD, ((az / RAD) + 360) % 360];
  };
  const hammer = (ra, dec, ra0) => { let l = ((ra - ra0) % 360 + 540) % 360 - 180; l *= RAD; const p = dec * RAD, k = Math.sqrt(1 + Math.cos(p) * Math.cos(l / 2)); return [-2 * SQ2 * Math.cos(p) * Math.sin(l / 2) / k, -SQ2 * Math.sin(p) / k]; };

  /* ---------- состояние ---------- */
  const st = { mode: 'sky', off: 0, base: Date.now(), lines: true, labels: true, face: 0, faceAz: 180, loc: { ...HOME }, z: 1, px: 0, py: 0, act: null, W: 0, H: 0, drawn: [] };
  let cache = null;
  const now = () => st.base + st.off * 60000;
  const ensureCss = () => {
    if (document.getElementById('sky-css')) return;
    const s = document.createElement('style'); s.id = 'sky-css';
    s.textContent = `.starmap .sky-modes{display:flex;gap:6px;justify-content:center;margin:4px 0 8px;flex-wrap:wrap}
.starmap .sky-modes button{font:inherit;font-size:14px;font-weight:700;padding:7px 14px;border-radius:14px;border:0;background:#fff;color:#2B2F5A;box-shadow:var(--sh)}
.starmap .sky-modes button.on{background:#232E6E;color:#FFE38A}
.starmap .sky-box{position:relative;margin:0 auto;max-width:620px;border-radius:24px;overflow:hidden;background:#05081A;box-shadow:0 6px 22px rgba(10,14,50,.35)}
.starmap .sky-box.full{max-width:980px}
.starmap #skyc{display:block;width:100%;touch-action:none;cursor:grab;-webkit-tap-highlight-color:transparent}
.starmap .sky-hud{position:absolute;left:10px;top:8px;right:10px;color:#DCE4FF;font-size:12px;font-weight:600;line-height:1.3;pointer-events:none;text-shadow:0 1px 3px #000}
.starmap .sky-zoom{display:inline-flex;gap:6px}
.starmap .sky-ctrl .sky-zoom button{width:34px;padding:6px 0;font-size:15px}
.starmap .sky-ctrl{max-width:620px;margin:8px auto;background:#101741;color:#E4EAFF;border-radius:18px;padding:10px 12px;box-sizing:border-box}
.starmap .sky-time{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.starmap .sky-time b{min-width:96px;font-size:14px}
.starmap .sky-time input{flex:1 1 120px;min-width:0;accent-color:#FFD34D}
.starmap .sky-ctrl button{font:inherit;font-size:13px;font-weight:600;padding:6px 10px;border-radius:12px;border:1px solid #3B4C93;background:transparent;color:#E4EAFF}
.starmap .sky-ctrl button.on{background:#FFD34D;color:#1E2148;border-color:#FFD34D}
.starmap .sky-tg{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.starmap .sky-legend{max-width:620px;margin:6px auto;font-size:13px;line-height:1.4;text-align:center}
.starmap .sky-legend i{font-style:normal;color:#E0A800;font-weight:700}
.starmap .cinfo .now{background:#EEF2FF;border-radius:12px;padding:6px 10px}
.starmap .sky-credit{font-size:11px;color:var(--muted);text-align:center;margin:10px 0 4px}
.starmap h3.sky-h{text-align:center;margin:12px 0 0}`;
    document.head.appendChild(s);
  };
  let loading = false;
  const loadData = cb => {
    if (window.SKY) return cb();
    const done = () => { loading = false; cb(); };
    if (loading) return; loading = true;
    const s = document.createElement('script'); s.src = 'content/extra/sky-data.js?v=' + (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1');
    s.onload = done; s.onerror = () => { loading = false; const h = $('#skyload'); if (h) h.innerHTML = 'Не получилось загрузить карту неба. Проверь интернет и открой её ещё раз.'; };
    document.head.appendChild(s);
  };

  /* ---------- проекция с кэшем (пересчёт при смене времени/места/режима) ---------- */
  const build = () => {
    const K = window.SKY, ms = now(), { lat, lon } = st.loc, full = st.mode === 'full', L0 = lst(ms, lon);
    const sl = Math.sin(lat * RAD), cl = Math.cos(lat * RAD);
    const aa = (ra, dec) => { const H = (L0 - ra) * RAD, d = dec * RAD, sd = Math.sin(d), cd = Math.cos(d), ch = Math.cos(H); const alt = Math.asin(sl * sd + cl * cd * ch); const az = Math.atan2(-Math.sin(H) * cd, cl * sd - sl * cd * ch); return [alt / RAD, az / RAD]; };
    const P = (ra, dec) => {
      const [alt, az] = aa(ra, dec);
      if (full) { const [x, y] = hammer(ra, dec, L0); return [x, y, alt]; }
      if (alt < -30) return null;
      const r = Math.tan((90 - alt) * RAD / 2), d = (az - st.faceAz) * RAD;
      return [r * Math.sin(d), r * Math.cos(d), alt];
    };
    const S = K.stars, n = S.length / 4, su = new Float32Array(n), sv = new Float32Array(n), sa = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = P(S[i * 4], S[i * 4 + 1]); if (!p) { sa[i] = -99; continue; } su[i] = p[0]; sv[i] = p[1]; sa[i] = p[2]; }
    const lines = {}, labels = {};
    for (const id in K.lines) lines[id] = K.lines[id].map(pl => pl.map(([ra, dec]) => P(ra, dec)));
    for (const id in K.cons) { const c = K.cons[id]; labels[id] = P(c.ra, c.dec); }
    const names = K.names.map(([nm, ra, dec, m]) => [nm, P(ra, dec), m]);
    const dip = (D().constellations.find(c => c.id === 'ursa_major') || { stars: [] }).stars.map(s => P(s.ra * 15, s.dec));
    const pol = P(37.95, 89.26);
    let hor = null;
    if (full) { hor = []; for (let A = 0; A <= 360; A += 4) { const a = A * RAD, dec = Math.asin(cl * Math.cos(a)) / RAD, H = Math.atan2(-Math.sin(a), -Math.cos(a) * sl) / RAD; hor.push(P(L0 - H, dec)); } }
    const grid = [];
    if (full) {
      for (let dec = -60; dec <= 60; dec += 30) { const g = []; for (let ra = 0; ra <= 360; ra += 5) g.push(P(ra, dec)); grid.push(g); }
      for (let ra = 0; ra < 360; ra += 30) { const g = []; for (let dec = -88; dec <= 88; dec += 4) g.push(P(ra, dec)); grid.push(g); }
    }
    cache = { su, sv, sa, n, lines, labels, names, dip, pol, hor, grid, aa, L0 };
  };

  /* очередь подписей: сначала 16 знаменитых, потом крупные и яркие (по ярким звёздам и длине фигуры) */
  let ORDER = null;
  const order = () => ORDER || (ORDER = (() => {
    const K = window.SKY, fam = Object.values(OLD), sc = id => fam.includes(id) ? 1e5 - fam.indexOf(id) : K.cons[id].st.length * 40 + (K.lines[id] || []).reduce((a, pl) => a + pl.length, 0);
    return Object.keys(K.cons).sort((a, b) => sc(b) - sc(a));
  })());

  /* ---------- рисование ---------- */
  let cv = null, ctx = null, raf = 0;
  const scale = () => st.mode === 'full' ? Math.min(st.W / (4 * SQ2), st.H / (2 * SQ2)) * 0.97 : Math.min(st.W, st.H) / 2 - 24;
  const X = u => st.W / 2 + u * scale() * st.z + st.px, Y = v => st.H / 2 + v * scale() * st.z + st.py;
  const req = () => { if (!raf) raf = requestAnimationFrame(draw); };
  const poly = (pts, jump) => { let pen = false, pu = 0; ctx.beginPath(); for (const p of pts) { if (!p || (jump && pen && Math.abs(p[0] - pu) > 1.5)) { pen = false; if (!p) continue; } const x = X(p[0]), y = Y(p[1]); if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y); pen = true; pu = p[0]; } ctx.stroke(); };
  function draw() {
    raf = 0; if (!ctx || !cache) return;
    const full = st.mode === 'full', W = st.W, H = st.H, s = scale() * st.z, cx = X(0), cy = Y(0), seen = S.starsSeen || [];
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#05081A'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath();
    if (full) ctx.ellipse(cx, cy, 2 * SQ2 * s, SQ2 * s, 0, 0, Math.PI * 2); else ctx.arc(cx, cy, s, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, full ? 2 * SQ2 * s : s); g.addColorStop(0, '#1C2760'); g.addColorStop(0.75, '#0E1440'); g.addColorStop(1, '#0A0F2E');
    ctx.fillStyle = g; ctx.fill(); ctx.clip();
    /* сетка */
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(130,150,230,.16)'; ctx.setLineDash([]);
    if (full) cache.grid.forEach(gp => poly(gp, true));
    else { [30, 60].forEach(a => { ctx.beginPath(); ctx.arc(cx, cy, s * Math.tan((90 - a) * RAD / 2), 0, Math.PI * 2); ctx.stroke(); }); }
    if (full && cache.hor) { ctx.strokeStyle = 'rgba(120,230,170,.75)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]); poly(cache.hor, true); ctx.setLineDash([]); }
    /* линии созвездий */
    if (st.lines) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const id in cache.lines) {
        const act = id === st.act, ok = seen.includes(key(id));
        ctx.strokeStyle = act ? '#FF8FB8' : ok ? 'rgba(255,214,110,.55)' : 'rgba(140,175,255,.5)'; ctx.lineWidth = act ? 2.6 : 1.1;
        cache.lines[id].forEach(pl => poly(pl, full));
      }
    }
    /* звёзды */
    const { su, sv, sa, n } = cache, Sd = window.SKY.stars, zk = Math.min(1.8, 0.8 + st.z * 0.2) * (full ? 0.85 : 1) * Math.max(0.75, Math.min(1.25, Math.min(W, H) / 420));
    for (let i = 0; i < n; i++) {
      const alt = sa[i]; if (alt < -90) continue; if (!full && alt < -1) continue;
      const x = X(su[i]), y = Y(sv[i]); if (x < -5 || y < -5 || x > W + 5 || y > H + 5) continue;
      const m = Sd[i * 4 + 2], r = Math.max(0.45, (5.8 - m) * 0.62) * zk;
      ctx.globalAlpha = (full && alt < 0 ? 0.45 : 1) * Math.min(1, 0.35 + (5.8 - m) * 0.25);
      ctx.fillStyle = BV(Sd[i * 4 + 3]);
      if (m < 1.5) { ctx.globalAlpha *= 0.25; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, 6.2832); ctx.fill(); ctx.globalAlpha /= 0.25; }
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    /* Большой Ковш и Полярная — ориентиры */
    const d = cache.dip, pol = cache.pol;
    if (d.length === 7 && d.every(Boolean) && d.some(p => full || p[2] > -2)) {
      ctx.strokeStyle = 'rgba(255,205,70,.95)'; ctx.lineWidth = 2.4; ctx.shadowColor = '#FFC93D'; ctx.shadowBlur = 8;
      poly([d[0], d[1], d[2], d[3], d[0]], full); poly([d[3], d[4], d[5], d[6]], full); ctx.shadowBlur = 0;
      if (pol && !(full && Math.abs(d[0][0] - pol[0]) > 1.5)) { ctx.strokeStyle = 'rgba(255,230,140,.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 6]); poly([d[1], d[0], pol]); ctx.setLineDash([]); }
    }
    /* подписи */
    st.drawn = [];
    ctx.restore(); ctx.save(); // подписи — без обрезки краем неба
    st.boxes = [];
    if (st.labels) {
      /* подписи без наложений: по очереди важности, подпись, которая задевает уже нарисованную, пропускаем */
      const fs = Math.round((full ? (W < 600 ? 9 : 10.5) : 11) * Math.min(1.5, Math.pow(st.z, 0.3)) * (W < 360 ? 0.94 : 1)), fn = Math.max(9, fs - 1);
      const ins = (x, y) => { const dx = (x - cx) / (full ? 2 * SQ2 * s : s), dy = (y - cy) / (full ? SQ2 * s : s); return dx * dx + dy * dy <= 1 && x >= 0 && x <= W && y >= 0 && y <= H; };
      const boxes = st.boxes, free = b => b[0] >= 0 && b[2] <= W && b[1] >= 0 && b[3] <= H && ins((b[0] + b[2]) / 2, (b[1] + b[3]) / 2) && !boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
      if (pol && (full || pol[2] > -1)) { const x = X(pol[0]), y = Y(pol[1]); boxes.push([x - 9, y - 9, x + 84, y + 9]); }
      const cands = [], K = window.SKY;
      if (st.act) cands.push(['c', st.act]);
      order().forEach((id, i) => { if (id !== st.act) cands.push(['c', id, i]); });
      const nm = cache.names.filter(n => n[0] !== 'Полярная' && n[2] <= (st.z > 2.5 ? 2.3 : st.z > 1.5 ? 1.7 : 1.3));
      cands.splice(17, 0, ...nm.filter(n => n[2] < 0.9).map(n => ['s', n])); // самые яркие звёзды — сразу после знаменитых созвездий
      nm.filter(n => n[2] >= 0.9).forEach(n => cands.push(['s', n]));
      ctx.shadowColor = '#000';
      for (const c of cands) {
        if (c[0] === 'c') {
          const id = c[1], p = cache.labels[id]; if (!p || (!full && p[2] < 1)) continue;
          const x = X(p[0]), y0 = Y(p[1]); if (x < 0 || y0 < 0 || x > W || y0 > H) continue;
          ctx.font = `700 ${fs}px Nunito, system-ui, sans-serif`; const t = K.cons[id].ru, w = ctx.measureText(t).width;
          let y = 0, b = null; for (const dy of [0, fs + 4, -(fs + 4)]) { const bb = [x - w / 2 - 2, y0 + dy - fs, x + w / 2 + 2, y0 + dy + 3]; if (free(bb)) { b = bb; y = y0 + dy; break; } } if (!b) continue; boxes.push(b);
          const act = id === st.act, ok = seen.includes(key(id));
          ctx.fillStyle = act ? '#FFFFFF' : ok ? '#FFD86E' : 'rgba(200,214,255,.85)'; ctx.textAlign = 'center';
          ctx.shadowBlur = 3; ctx.fillText(t, x, y); ctx.shadowBlur = 0;
          st.drawn.push([id, x, y]);
        } else {
          const [t, p] = c[1]; if (!p || (!full && p[2] < 1)) continue;
          const x = X(p[0]) + 6, y = Y(p[1]) - 5; if (x < 0 || y < 0 || x > W || y > H) continue;
          ctx.font = `600 ${fn}px Nunito, system-ui, sans-serif`; const w = ctx.measureText(t).width;
          const b = [x - 1, y - fn, x + w + 1, y + 3]; if (!free(b)) continue; boxes.push(b);
          ctx.fillStyle = 'rgba(255,236,190,.92)'; ctx.textAlign = 'left'; ctx.shadowBlur = 3; ctx.fillText(t, x, y); ctx.shadowBlur = 0;
        }
      }
    }
    ctx.restore();
    if (pol && (full || pol[2] > -1)) { const x = X(pol[0]), y = Y(pol[1]); ctx.strokeStyle = '#FFE38A'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.stroke(); ctx.fillStyle = '#FFE38A'; ctx.font = '700 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('✦ Полярная', x + 10, y + 4); }
    /* горизонт и стороны света */
    if (!full) {
      ctx.strokeStyle = 'rgba(120,230,170,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '800 15px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
      [[0, 'С'], [90, 'В'], [180, 'Ю'], [270, 'З']].forEach(([az, t]) => { const a = (az - st.faceAz) * RAD, x = cx + (s + 12) * Math.sin(a), y = cy + (s + 12) * Math.cos(a) + 5; if (x < 0 || x > W || y < 0 || y > H) return; ctx.fillStyle = az === 0 ? '#FF9DB8' : '#9FF0C4'; ctx.fillText(t, x, y); });
    }
  }

  /* ---------- попадание касанием ---------- */
  const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
  const hit = (x, y) => {
    let best = null, bd = 30; const full = st.mode === 'full';
    st.drawn.forEach(([id, lx, ly]) => { const dd = Math.hypot(lx - x, ly - y - 4) - 6; if (dd < bd) { bd = dd; best = id; } });
    if (st.lines) for (const id in cache.lines) cache.lines[id].forEach(pl => { for (let i = 1; i < pl.length; i++) { const a = pl[i - 1], b = pl[i]; if (!a || !b || (!full && a[2] < 0 && b[2] < 0) || (full && Math.abs(a[0] - b[0]) > 1.5)) continue; const dd = segD(x, y, X(a[0]), Y(a[1]), X(b[0]), Y(b[1])); if (dd < bd) { bd = dd; best = id; } } });
    return best;
  };

  /* ---------- текст «где искать сейчас» ---------- */
  const place = () => st.loc.name || 'твоим местом';
  const nowText = id => {
    const c = window.SKY.cons[id], lat = st.loc.lat, [alt, az] = altAz(c.ra, c.dec, now(), lat, st.loc.lon);
    if (c.dec < -(90 - lat) + 5) return `🌍 Над ${place()} оно не поднимается никогда — его видно только из южных стран.`;
    const circ = c.dec > 90 - lat ? ' Оно никогда не заходит за горизонт — его можно увидеть в любую ясную ночь.' : '';
    if (alt > 3) return `👀 Сейчас над горизонтом: смотри ${DIRS[Math.round(az / 45) % 8]}, на высоту ${alt > 70 ? 'почти над головой' : `около ${Math.round(alt / 5) * 5}°`}.${circ}`;
    return `🌙 Сейчас оно под горизонтом (или совсем низко) — подвинь время и посмотри, когда взойдёт.${circ}`;
  };

  /* ---------- экран ---------- */
  const fmtTime = () => { const t = new Date(now()), d0 = new Date(); const dd = Math.round((new Date(t.getFullYear(), t.getMonth(), t.getDate()) - new Date(d0.getFullYear(), d0.getMonth(), d0.getDate())) / 864e5); return `${dd === 0 ? 'сегодня' : dd === 1 ? 'завтра' : dd === -1 ? 'вчера' : t.toLocaleDateString('ru-RU')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`; };
  SCREENS.starmap = from => {
    ensureCss();
    const back = from === 'house' ? 'house' : 'subject';
    if (!window.SKY) {
      app.innerHTML = `${topbar('🔭 Звёздное небо', back)}<div class="page starmap"><div class="card center" id="skyload"><div class="big-emoji">🌌</div><p>Зажигаем звёзды…</p></div></div>`;
      if (from !== 'house') { $('.back', app).dataset.go = 'subject'; $('.back', app).dataset.arg = 'space'; }
      loadData(() => { if (app.className === 'scr-starmap' && !$('#skyc')) SCREENS.starmap(from); });
      return;
    }
    const K = window.SKY, ALL = Object.keys(K.cons), FAM = D().constellations; S.starsSeen = S.starsSeen || [];
    const seenN = () => ALL.filter(id => S.starsSeen.includes(key(id))).length;
    st.base = Date.now(); st.off = 0; st.z = 1; st.px = st.py = 0; st.act = null;
    app.innerHTML = `${topbar('🔭 Звёздное небо', back)}<div class="page starmap">
      <p class="center small">Настоящее небо со всеми 88 созвездиями. Нажми на созвездие, чтобы узнать о нём. Открыто: <b id="smn">${seenN()}</b> из ${ALL.length}</p>
      <div class="sky-modes"><button data-m="sky" class="${st.mode === 'sky' ? 'on' : ''}">🌙 Над головой сейчас</button><button data-m="full" class="${st.mode === 'full' ? 'on' : ''}">🌌 Всё небо</button></div>
      <div class="sky-box ${st.mode === 'full' ? 'full' : ''}"><canvas id="skyc" aria-label="Карта звёздного неба"></canvas><div class="sky-hud" id="skyhud"></div></div>
      <div class="sky-ctrl"><div class="sky-time">🕘 <b id="sktime"></b><input type="range" id="skr" min="-720" max="720" step="15" value="0" aria-label="Время"><button id="sknow" class="on">Сейчас</button></div>
        <div class="sky-tg"><button id="tgl" class="${st.lines ? 'on' : ''}">✏️ Линии</button><button id="tgn" class="${st.labels ? 'on' : ''}">🔤 Подписи</button><button id="tgf">🧭 Смотрю ${FACE[st.face][1]}</button><button id="tgp">📍 Моё место</button><span class="sky-zoom"><button id="zin" aria-label="Приблизить">＋</button><button id="zout" aria-label="Отдалить">－</button><button id="zreset" aria-label="Всё небо целиком">⟲</button></span></div></div>
      <p class="sky-legend"><i>✦ Полярная звезда</i> всегда стоит над севером. <i>Золотой ковш</i> — Большая Медведица: продли его край пунктиром — и придёшь к Полярной. ${st.mode === 'full' ? '<span style="color:#2E9D63">Зелёный пунктир</span> — горизонт: звёзды над ним видно сейчас.' : 'Зелёный круг — горизонт, в центре — точка прямо над головой.'}</p>
      <h3 class="sky-h">⭐ Знаменитые созвездия</h3>
      <div class="cst-chips">${FAM.map(c => `<button class="chip cst ${S.starsSeen.includes(c.id) ? 'on' : ''}" data-c="${c.id}">${c.emoji} ${c.name}</button>`).join('')}</div>
      <div id="cinfo"></div>
      <div class="card small"><h3>🌌 Советы юному астроному</h3><ul class="howto">${(D().tips || []).map(t => `<li>${t}</li>`).join('')}</ul></div>
      <p class="sky-credit">Данные: d3-celestial (BSD-3), каталог ярких звёзд Йельского университета. Фигуры — 88 созвездий Международного астрономического союза.</p></div>`;
    if (from !== 'house') { $('.back', app).dataset.go = 'subject'; $('.back', app).dataset.arg = 'space'; }
    cv = $('#skyc'); ctx = cv.getContext('2d');
    const hud = () => { $('#sktime').textContent = fmtTime(); const t = fmtTime().split(' '); $('#skyhud').innerHTML = `${st.mode === 'full' ? 'Вся небесная сфера' : st.loc.name === HOME.name ? 'Челябинск' : 'Твоё место'}<br>${st.off ? (t[0] === 'сегодня' ? t[1] : t.join(' ')) : t[1] + ' · сейчас'}`; $('#sknow').classList.toggle('on', !st.off); };
    const size = () => { const box = cv.parentElement, W = box.clientWidth, full = st.mode === 'full'; const H = full ? Math.round(Math.max(170, Math.min(W * 0.5 + 26, innerHeight * 0.75))) : Math.round(Math.min(W, Math.max(300, innerHeight * 0.72))); const dpr = Math.min(2, window.devicePixelRatio || 1); st.W = W; st.H = H; cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); req(); };
    const redo = () => { build(); hud(); req(); };
    const clampPan = () => { const s = scale() * st.z, ex = st.mode === 'full' ? 2 * SQ2 : 1.1, ey = st.mode === 'full' ? SQ2 : 1.1; const mx = Math.max(0, s * ex - st.W / 2) + 30, my = Math.max(0, s * ey - st.H / 2) + 30; st.px = Math.max(-mx, Math.min(mx, st.px)); st.py = Math.max(-my, Math.min(my, st.py)); if (st.z <= 1.001) { st.px = 0; st.py = 0; } };
    const zoomAt = (f, sx, sy) => { const z = Math.max(1, Math.min(10, st.z * f)), k = z / st.z; st.px = sx - st.W / 2 - (sx - st.W / 2 - st.px) * k; st.py = sy - st.H / 2 - (sy - st.H / 2 - st.py) * k; st.z = z; clampPan(); req(); };
    const rerender = () => { teardown(); SCREENS.starmap(from); };
    const setMode = m => { if (st.mode === m) return; st.mode = m; st.z = 1; st.px = st.py = 0; rerender(); };
    $$('.sky-modes button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
    $('#zin').addEventListener('click', () => zoomAt(1.5, st.W / 2, st.H / 2));
    $('#zout').addEventListener('click', () => zoomAt(1 / 1.5, st.W / 2, st.H / 2));
    $('#zreset').addEventListener('click', () => { st.z = 1; st.px = st.py = 0; req(); });
    $('#skr').addEventListener('input', e => { st.off = +e.target.value; if (!st.off) st.base = Date.now(); redo(); });
    $('#sknow').addEventListener('click', () => { st.off = 0; st.base = Date.now(); $('#skr').value = 0; redo(); });
    $('#tgl').addEventListener('click', e => { st.lines = !st.lines; e.currentTarget.classList.toggle('on', st.lines); req(); });
    $('#tgn').addEventListener('click', e => { st.labels = !st.labels; e.currentTarget.classList.toggle('on', st.labels); req(); });
    $('#tgf').addEventListener('click', e => { st.face = (st.face + 1) % 4; st.faceAz = FACE[st.face][0]; e.currentTarget.textContent = `🧭 Смотрю ${FACE[st.face][1]}`; if (st.mode !== 'sky') setMode('sky'); else redo(); });
    $('#tgp').addEventListener('click', e => {
      const b = e.currentTarget; if (!navigator.geolocation) { b.textContent = '📍 Не получилось'; return; }
      b.textContent = '📍 Ищу…';
      navigator.geolocation.getCurrentPosition(p => { st.loc = { lat: Math.round(p.coords.latitude * 10) / 10, lon: Math.round(p.coords.longitude * 10) / 10, name: 'тобой' }; b.textContent = '📍 Моё место ✓'; b.classList.add('on'); redo(); },
        () => { b.textContent = '📍 Челябинск'; st.loc = { ...HOME }; redo(); }, { timeout: 10000, maximumAge: 3600000 });
    });
    /* жесты: перетаскивание, щипок, колесо; касание — выбор созвездия */
    const ptr = new Map(); let g0 = null, moved = 0;
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, pos(e)); moved = ptr.size > 1 ? 99 : 0; g0 = null; });
    cv.addEventListener('pointermove', e => {
      if (!ptr.has(e.pointerId)) return; const p = pos(e), o = ptr.get(e.pointerId); ptr.set(e.pointerId, p);
      if (ptr.size === 1) {
        moved += Math.hypot(p[0] - o[0], p[1] - o[1]); if (moved < 6) return;
        if (st.mode === 'sky' && st.z <= 1.001) { const cx = st.W / 2, cy = st.H / 2, a0 = Math.atan2(o[0] - cx, o[1] - cy), a1 = Math.atan2(p[0] - cx, p[1] - cy); let da = (a1 - a0) / RAD; if (da > 180) da -= 360; if (da < -180) da += 360; st.faceAz = (st.faceAz - da + 360) % 360; build(); req(); return; }
        st.px += p[0] - o[0]; st.py += p[1] - o[1]; clampPan(); req();
      } else if (ptr.size === 2) {
        const [a, b] = [...ptr.values()], dd = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (g0) { zoomAt(dd / g0.d, mx, my); st.px += mx - g0.x; st.py += my - g0.y; clampPan(); }
        g0 = { d: dd, x: mx, y: my };
      }
    });
    const up = e => { if (!ptr.has(e.pointerId)) return; const p = pos(e); ptr.delete(e.pointerId); g0 = null; if (ptr.size === 0 && moved < 6 && e.type === 'pointerup') { const id = hit(p[0], p[1]); if (id) open(id, false); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { e.preventDefault(); const p = pos(e); zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, p[0], p[1]); }, { passive: false });
    /* карточка созвездия */
    const famOf = id => FAM.find(c => c.id === IAU2OLD[id]);
    const open = (id, center) => {
      const c = K.cons[id]; if (!c) return; st.act = id; const f = famOf(id), k = key(id);
      if (center) {
        const p0 = cache.labels[id];
        if (st.mode === 'sky' && (!p0 || p0[2] < 3)) { st.mode = 'full'; rerender(); return StarMap._open(id, true); }
        const p = cache.labels[id]; if (p) { st.z = 2.2; st.px = -p[0] * scale() * st.z; st.py = -p[1] * scale() * st.z; clampPan(); }
      }
      req();
      const first = !S.starsSeen.includes(k);
      if (first) {
        S.starsSeen.push(k); save(); award(1, 4); $('#smn').textContent = seenN();
        const ch = $(`.cst-chips .chip[data-c="${k}"]`); if (ch) ch.classList.add('on');
        if (f && FAM.every(x => S.starsSeen.includes(x.id))) { awardGems(2, 'за все знаменитые созвездия!'); confetti(50); }
        if (seenN() === ALL.length) { awardGems(3, 'за все 88 созвездий неба!'); confetti(80); }
        if (window.Coach) Coach.track('a:space', 1, { count: false });
      }
      const stars = c.st.length ? c.st.join(', ') : '';
      const fact = f ? '' : (FACTS[id] || (c.dec < -40 ? SOUTH : ''));
      const nm = f ? `${f.emoji} ${f.name}` : `✨ ${c.ru}`;
      $('#cinfo').innerHTML = `<div class="card cinfo"><h2>${nm} <small>${c.la}</small></h2><p class="small now">${nowText(id)}</p>
        ${f ? `<p class="small">🗓️ ${f.season}</p><p>${f.story}</p><h3>✨ Интересные факты</h3><ul class="howto">${f.facts.map(x => `<li>${x}</li>`).join('')}</ul><div class="rule">🔎 Как найти: ${f.find}</div>` : fact ? `<p>${fact}</p>` : ''}
        <p class="small">⭐ ${stars ? `Яркие звёзды: ${stars}` : 'В нём нет очень ярких звёзд — ищи его в тёмную ночь, подальше от городских фонарей.'}</p>
        <div class="row-btns"><button class="btn sm ghost" id="cread">🔊 Расскажи</button><button class="btn sm" id="call">🌌 Всё небо</button></div></div>`;
      $('#cread').addEventListener('click', () => { if (typeof wakeAudio === 'function') wakeAudio(); speakRemote(`${f ? f.name : c.ru}. ${f ? `${f.story} ${f.facts.join(' ')}` : fact} ${stars ? 'Яркие звёзды: ' + stars + '.' : ''}`); });
      $('#call').addEventListener('click', () => { st.act = null; st.z = 1; st.px = st.py = 0; $('#cinfo').innerHTML = ''; req(); cv.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
      SND.tap(); M.sfx('magic'); $('#cinfo').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    $$('.cst-chips .chip').forEach(b => b.addEventListener('click', () => open(toIAU(b.dataset.c), true)));
    const onResize = () => { if (cv && cv.isConnected) size(); };
    window.addEventListener('resize', onResize);
    const tick = setInterval(() => { if (!st.off && cv.isConnected) { st.base = Date.now(); build(); hud(); req(); } }, 60000);
    let torn = false; function teardown() { if (torn) return; torn = true; window.removeEventListener('resize', onResize); clearInterval(tick); cancelAnimationFrame(raf); raf = 0; }
    cleanups.push(teardown);
    build(); hud(); size(); draw();
    StarMap._open = open;
  };
  /* телескоп в домике (обсерватория и вещи-телескопы) открывает карту — только касанием, не перетаскиванием */
  let down = null;
  document.addEventListener('pointerdown', e => { const f = e.target.closest('.room:not(.guest) .fx'); down = f ? { id: f.dataset.id, x: e.clientX, y: e.clientY } : null; }, true);
  document.addEventListener('pointerup', e => {
    if (!down || !/^(fx_tscope|fx_starmap|fx_window|telescope2|scope|galaxy)$/.test(down.id) || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return; down = null;
    setTimeout(() => { if (curScreen === 'house' && !$('.modal')) go('starmap', 'house'); }, 1300); // котик договаривает — и открывается звёздное небо
  }, true);
  const total = () => window.SKY ? Object.keys(window.SKY.cons).length : 88;
  const sp = (window.SUBJECTS || {}).space; if (sp) sp.extras = [...(sp.extras || []).filter(e => e.id !== 'starmap'), { id: 'starmap', icon: '🔭', name: 'Карта звёздного неба', run: () => go('starmap'), badge: () => (S.starsSeen || []).length ? `открыто ${(S.starsSeen || []).length} из ${total()}` : '', prog: () => Math.min(1, (S.starsSeen || []).length / total()) }];
  if (!NO_FLOAT.includes('starmap')) NO_FLOAT.push('starmap');
  /* для тестов и других модулей */
  const debug = () => ({ mode: st.mode, labels: st.drawn.length, boxes: (st.boxes || []).map(b => b.map(v => Math.round(v))), z: st.z, act: st.act, loc: st.loc, W: st.W, H: st.H });
  const where = id => { const e = st.drawn.find(d => d[0] === id); if (!e || !cv) return null; const r = cv.getBoundingClientRect(); return { x: r.left + e[1], y: r.top + e[2] - 4 }; };
  const proj = (ra, dec) => { const r = (90 - dec), a = ra / 24 * Math.PI * 2 - Math.PI / 2; return [500 + r * Math.cos(a), 500 + r * Math.sin(a)]; }; // старый экспорт
  const view = (z, px, py) => { st.z = z; st.px = px; st.py = py; if (ctx && cache) draw(); return debug(); };
  return { proj, altAz, lst, debug, where, view, OLD };
})();
window.StarMap = StarMap;
