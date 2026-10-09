/* starmap.js — карта звёздного неба: 16 созвездий с реальными координатами звёзд (content/extra/stars.js).
   Касание созвездия — приближение и карточка: легенда, факты, как найти. Открывается телескопом в обсерватории
   и кнопкой в предмете «Космос». За каждое новое созвездие — немного конфет и опыта. */
'use strict';
const StarMap = (() => {
  const D = () => (window.STAR_MAP || { constellations: [], tips: [] });
  const SZ = 1000, C = SZ / 2, K = (SZ / 2 - 20) / 140; // проекция вокруг Полярной: расстояние от центра = 90° − склонение
  const proj = (ra, dec) => { const r = (90 - dec) * K, a = ra / 24 * Math.PI * 2 - Math.PI / 2; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  const rad = mag => Math.max(1.6, 7 - mag * 1.4);
  let bg = null;
  const bgStars = () => bg || (bg = Array.from({ length: 260 }, (_, i) => { const a = (i * 137.5) % 360, r = Math.sqrt((i * 7919) % 1000 / 1000) * (SZ / 2 - 10); return `<circle cx="${(C + r * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(C + r * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="${(0.6 + (i % 5) * 0.25).toFixed(2)}" fill="#fff" opacity="${(0.25 + (i % 7) * 0.08).toFixed(2)}"/>`; }).join(''));
  const box = c => { const P = c.stars.map(s => proj(s.ra, s.dec)), xs = P.map(p => p[0]), ys = P.map(p => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), P }; };
  SCREENS.starmap = from => {
    const L = D().constellations; S.starsSeen = S.starsSeen || [];
    app.innerHTML = `${topbar('🔭 Звёздное небо', from === 'house' ? 'house' : 'subject')}<div class="page starmap">
      <p class="center small">Нажми на созвездие, чтобы приблизить и узнать его историю. Открыто: <b id="smn">${S.starsSeen.length}</b> из ${L.length}</p>
      <div class="sky-wrap"><svg id="sky" viewBox="0 0 ${SZ} ${SZ}" class="sky"><defs><radialGradient id="skyg"><stop offset="0" stop-color="#1B2456"/><stop offset="1" stop-color="#070A1F"/></radialGradient></defs>
        <circle cx="${C}" cy="${C}" r="${C - 4}" fill="url(#skyg)"/>${bgStars()}
        <circle cx="${C}" cy="${C}" r="${(90 - 35) * K}" fill="none" stroke="#3A4A8A" stroke-dasharray="4 8" opacity=".5"/>
        ${L.map(c => { const b = box(c); return `<g class="cst ${S.starsSeen.includes(c.id) ? 'seen' : ''}" data-c="${c.id}"><rect x="${b.x0 - 22}" y="${b.y0 - 22}" width="${b.x1 - b.x0 + 44}" height="${b.y1 - b.y0 + 44}" fill="transparent"/>${c.lines.map(([i, j]) => `<line x1="${b.P[i][0].toFixed(1)}" y1="${b.P[i][1].toFixed(1)}" x2="${b.P[j][0].toFixed(1)}" y2="${b.P[j][1].toFixed(1)}" class="cl"/>`).join('')}${c.stars.map((s, k) => `<circle cx="${b.P[k][0].toFixed(1)}" cy="${b.P[k][1].toFixed(1)}" r="${rad(s.mag).toFixed(1)}" class="st"><title>${s.n || ''}</title></circle>`).join('')}<text x="${((b.x0 + b.x1) / 2).toFixed(0)}" y="${(b.y1 + 34).toFixed(0)}" class="cn">${c.name}</text></g>`; }).join('')}
        <text x="${C}" y="${C - 14}" class="cn polar">✦ Полярная</text></svg></div>
      <div class="cst-chips">${L.map(c => `<button class="chip ${S.starsSeen.includes(c.id) ? 'on' : ''}" data-c="${c.id}">${c.emoji} ${c.name}</button>`).join('')}</div>
      <div id="cinfo"></div>
      <div class="card small"><h3>🌌 Советы юному астроному</h3><ul class="howto">${(D().tips || []).map(t => `<li>${t}</li>`).join('')}</ul></div></div>`;
    if (from !== 'house') { $('.back', app).dataset.go = 'subject'; $('.back', app).dataset.arg = 'space'; }
    const sky = $('#sky'); let anim = null;
    const zoomTo = (vb, ms = 600) => { const cur = sky.getAttribute('viewBox').split(' ').map(Number), t0 = performance.now(); cancelAnimationFrame(anim); const step = t => { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; sky.setAttribute('viewBox', cur.map((v, i) => (v + (vb[i] - v) * e).toFixed(1)).join(' ')); if (k < 1) anim = requestAnimationFrame(step); }; anim = requestAnimationFrame(step); };
    const open = id => {
      const c = L.find(x => x.id === id); if (!c) return; const b = box(c), w = Math.max(b.x1 - b.x0, b.y1 - b.y0) + 160;
      zoomTo([(b.x0 + b.x1) / 2 - w / 2, (b.y0 + b.y1) / 2 - w / 2, w, w]); $$('.cst').forEach(g => g.classList.toggle('act', g.dataset.c === id));
      const first = !S.starsSeen.includes(id); if (first) { S.starsSeen.push(id); save(); award(1, 4); $('#smn').textContent = S.starsSeen.length; $(`.chip[data-c="${id}"]`).classList.add('on'); $(`.cst[data-c="${id}"]`).classList.add('seen'); if (S.starsSeen.length === L.length) { awardGems(2, 'за все созвездия неба!'); confetti(50); } if (window.Coach) Coach.track('a:space', 1, { count: false }); }
      $('#cinfo').innerHTML = `<div class="card cinfo"><h2>${c.emoji} ${c.name} <small>${c.latin}</small></h2><p class="small">🗓️ ${c.season}</p><p>${c.story}</p><h3>✨ Интересные факты</h3><ul class="howto">${c.facts.map(f => `<li>${f}</li>`).join('')}</ul><div class="rule">🔎 Как найти: ${c.find}</div><p class="small">Звёзды: ${c.stars.filter(s => s.n).map(s => s.n).join(', ')}</p><div class="row-btns"><button class="btn sm ghost" id="cread">🔊 Расскажи</button><button class="btn sm" id="call">🌌 Всё небо</button></div></div>`;
      $('#cread').addEventListener('click', () => { if (typeof wakeAudio === 'function') wakeAudio(); speakRemote(`${c.name}. ${c.story} ${c.facts.join(' ')}`); });
      $('#call').addEventListener('click', () => { zoomTo([0, 0, SZ, SZ]); $$('.cst').forEach(g => g.classList.remove('act')); $('#cinfo').innerHTML = ''; });
      SND.tap(); M.sfx('magic'); $('#cinfo').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    $$('.cst').forEach(g => g.addEventListener('click', () => open(g.dataset.c)));
    $$('.cst-chips .chip').forEach(b => b.addEventListener('click', () => open(b.dataset.c)));
    cleanups.push(() => cancelAnimationFrame(anim));
  };
  /* телескоп в домике (обсерватория и вещи-телескопы) открывает карту — только касанием, не перетаскиванием */
  let down = null;
  document.addEventListener('pointerdown', e => { const f = e.target.closest('.room:not(.guest) .fx'); down = f ? { id: f.dataset.id, x: e.clientX, y: e.clientY } : null; }, true);
  document.addEventListener('pointerup', e => {
    if (!down || !/^(fx_tscope|telescope2|scope)$/.test(down.id) || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return; down = null;
    setTimeout(() => { if (curScreen !== 'house' || $('.modal')) return; const m = modal(`<div class="big-emoji">🔭✨</div><h2>Заглянуть в телескоп?</h2><p>Посмотрим на звёздное небо и созвездия!</p><div class="row-btns"><button class="btn pink" id="tsgo">🌌 Смотреть</button><button class="btn" data-close>Потом</button></div>`); $('#tsgo', m.el).addEventListener('click', () => { m.close(); go('starmap', 'house'); }); }, 1200);
  }, true);
  const sp = (window.SUBJECTS || {}).space; if (sp) sp.extras = [...(sp.extras || []).filter(e => e.id !== 'starmap'), { id: 'starmap', icon: '🔭', name: 'Карта звёздного неба', run: () => go('starmap'), badge: () => (S.starsSeen || []).length ? `открыто ${(S.starsSeen || []).length} из ${D().constellations.length}` : '', prog: () => (S.starsSeen || []).length / (D().constellations.length || 1) }];
  if (!NO_FLOAT.includes('starmap')) NO_FLOAT.push('starmap');
  return { proj };
})();
window.StarMap = StarMap;
