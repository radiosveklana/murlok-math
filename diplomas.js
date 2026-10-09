/* diplomas.js — дипломы за прохождение и окончание: Школа, предметы Академии, звания, легенда, дела, скорочтение, общение.
   Копятся в разделе «Мои дипломы», рисуются картинкой и отправляются так же, как фото (Photo.view).
   За «Энциклопедию подростка» диплома нет — этот раздел остаётся личным. */
'use strict';
const Diplomas = (() => {
  const RANKN = i => (typeof RANKS !== 'undefined' && RANKS[i] ? RANKS[i][1] : '');
  const subjDone = id => { const s = (window.SUBJECTS || {})[id], a = (S.acad || {})[id]; if (!s || !a) return false; return s.units.every(u => (a.read || {})[u.id] && (!u.quiz || !u.quiz.length || ((a.best || {})[u.id] || 0) >= 2)); };
  function rules() {
    const R = [
      { id: 'school', icon: '🎓', title: 'Выпускник Школы сыщика', sub: 'изучил(а) уроки «Умножение столбиком» и «Составные уравнения»', ok: () => ['t:mul', 't:eq'].every(k => ((S.theory || {})[k] || {}).verified) },
      { id: 'cases10', icon: '🔍', title: 'Сыщик-следопыт', sub: 'раскрыл(а) 10 дел о пропавших сладостях', ok: () => S.cases >= 10 },
      { id: 'cases50', icon: '🕵️', title: 'Гроза воришек', sub: 'раскрыл(а) 50 дел', ok: () => S.cases >= 50 },
      { id: 'cases100', icon: '🏆', title: 'Великий сыщик Сладкограда', sub: 'раскрыл(а) 100 дел', ok: () => S.cases >= 100 },
      { id: 'rank5', icon: '🎖️', title: 'Звание «' + RANKN(5) + '»', sub: 'получил(а) звание ' + RANKN(5), ok: () => rank().i >= 5 },
      { id: 'rank10', icon: '🎖️', title: 'Звание «' + RANKN(10) + '»', sub: 'получил(а) звание ' + RANKN(10), ok: () => rank().i >= 10 },
      { id: 'rank15', icon: '👑', title: 'Все звания агентства!', sub: 'собрал(а) все 16 званий и стал(а) «' + RANKN(15) + '»', ok: () => rank().i >= 15 },
      { id: 'read', icon: '⚡', title: 'Быстрый читатель', sub: 'читает больше 100 слов в минуту и понимает прочитанное', ok: () => ((S.read || {}).wpm || []).some(x => x.wpm >= 100 && x.comp >= 67) },
      { id: 'talk', icon: '🎭', title: 'Мастер общения', sub: 'прошёл(а) все сценки тренажёра разговора', ok: () => { const L = ((window.SUBJECTS || {}).talk || {}).roleplay || []; return L.length && L.every(r => ((S.rp || {})[r.id] || 0) >= 2); } },
    ];
    Object.values(window.SUBJECTS || {}).filter(s => s.id !== 'teen').forEach(s => R.push({ id: 'subj:' + s.id, icon: s.icon, title: 'Предмет «' + s.name + '»', sub: 'прошёл(а) все уроки и тренажёры предмета «' + s.name + '»', ok: () => subjDone(s.id) }));
    const lv = window.Wardrobe ? Wardrobe.legend().lv : 0; for (let n = 1; n <= lv; n++) R.push({ id: 'legend' + n, icon: '🌟', title: 'Легенда сыска ★' + n, sub: 'достиг(ла) уровня «Легенда сыска ★' + n + '»', ok: () => true });
    return R;
  }
  const own = () => (S.diplomas = S.diplomas || []);
  const fem = () => /[аяь]$/i.test(S.kid || '');
  const g = t => t.replace(/\(а\)/g, fem() ? 'а' : '').replace(/\(ла\)/g, fem() ? 'ла' : '');
  function check(quiet) {
    if (!S.kid) return; const have = new Set(own().map(d => d.id)), fresh = rules().filter(r => !have.has(r.id) && (() => { try { return r.ok(); } catch (e) { return false; } })());
    if (!fresh.length) return;
    fresh.forEach(r => own().push({ id: r.id, icon: r.icon, title: r.title, sub: g(r.sub), date: today() })); save();
    if (quiet) return;
    const d = fresh[0]; setTimeout(() => { if ($('.modal')) { toast(`<span class="tb">📜</span><div><b>Новый диплом!</b><br>${d.title}</div>`); return; } const m = modal(`<div class="big-emoji">📜</div><h2>Новый диплом!</h2><p><b>${d.icon} ${d.title}</b></p><p class="small">${esc(g(d.sub))}</p>${fresh.length > 1 ? `<p class="small">И ещё ${fresh.length - 1} — в разделе «Мои дипломы».</p>` : ''}<div class="row-btns"><button class="btn pink" id="dpView">📜 Посмотреть</button><button class="btn" data-close>Потом</button></div>`); confetti(40); SND.win(); $('#dpView', m.el).addEventListener('click', () => { m.close(); show(own().find(x => x.id === d.id)); }); }, 1800);
  }
  /* ---------- рисуем диплом ---------- */
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  function wrap(g2, text, x, y, maxW, lh) { const words = text.split(' '); let line = '', yy = y; for (const w of words) { const t = line ? line + ' ' + w : w; if (g2.measureText(t).width > maxW && line) { g2.fillText(line, x, yy); line = w; yy += lh; } else line = t; } if (line) g2.fillText(line, x, yy); return yy; }
  async function render(d) {
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#FFF9EC'); bg.addColorStop(1, '#FFEFD9'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#D9A21B'; c.lineWidth = 18; c.strokeRect(36, 36, W - 72, H - 72); c.strokeStyle = '#7B5CD6'; c.lineWidth = 5; c.strokeRect(70, 70, W - 140, H - 140);
    c.fillStyle = '#E8B23A'; [[70, 70], [W - 70, 70], [70, H - 70], [W - 70, H - 70]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 22, 0, Math.PI * 2); c.fill(); });
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = '#7B5CD6'; c.font = '700 40px Nunito, "Segoe UI", sans-serif'; c.fillText('Детективное агентство «Мурлок и Ко»', W / 2, 170);
    c.fillStyle = '#B5651D'; c.font = '900 150px Georgia, "Times New Roman", serif'; c.fillText('ДИПЛОМ', W / 2, 330);
    c.fillStyle = '#3B2A4A'; c.font = '600 44px Nunito, sans-serif'; c.fillText(fem() ? 'награждается' : 'награждается', W / 2, 410);
    c.fillStyle = '#E0447A'; c.font = '900 92px Georgia, serif'; c.fillText(S.kid || 'Сыщик', W / 2, 520, W - 200);
    c.fillStyle = '#3B2A4A'; c.font = '800 54px Nunito, sans-serif'; const yT = wrap(c, (d.icon ? d.icon + ' ' : '') + d.title, W / 2, 620, W - 220, 64);
    c.fillStyle = '#6E5B80'; c.font = '500 38px Nunito, sans-serif'; wrap(c, 'за то, что ' + d.sub, W / 2, yT + 70, W - 240, 50);
    try { const svg = catSVG({ fur: S.fur, wear: S.wear, smile: true, star: true, paw: true }).replace('<svg ', '<svg width="360" height="425" '); const im = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)); c.drawImage(im, 120, H - 560, 360, 425); } catch (e) { }
    // печать
    const sx = W - 270, sy = H - 330; c.fillStyle = '#E6455A'; c.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, r = k % 2 ? 118 : 132; c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.font = '900 30px Nunito, sans-serif'; c.fillText('МУРЛОК', sx, sy - 18); c.fillText('и Ко', sx, sy + 20); c.font = '60px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; c.fillText('🐾', sx, sy + 86);
    c.fillStyle = '#3B2A4A'; c.font = '600 34px Nunito, sans-serif'; c.textAlign = 'left';
    c.fillText('Котик-напарник: ' + (S.name || ''), 520, H - 210, 330); c.fillText('Дата: ' + new Date(d.date).toLocaleDateString('ru-RU'), 520, H - 160);
    return new Promise(res => cv.toBlob(b => res(b), 'image/png'));
  }
  async function show(d) { if (!d) return; try { const blob = await render(d); window.__lastDiploma = blob.size; Photo.view(blob, null, false); } catch (e) { console.warn(e); toast('Не получилось нарисовать диплом 😿'); } }
  /* ---------- раздел «Мои дипломы» ---------- */
  SCREENS.diplomas = () => {
    check(true); const mine = own(), all = rules(), have = new Set(mine.map(d => d.id)), next = all.filter(r => !have.has(r.id)).slice(0, 6);
    app.innerHTML = `${topbar('📜 Мои дипломы')}<div class="page diplomas"><p class="center">Дипломы выдаются за то, что ты <b>прошёл(а) до конца</b>. Каждым можно поделиться — как фото!</p>
      ${mine.length ? `<div class="dp-grid">${mine.slice().reverse().map(d => `<button class="dp" data-d="${d.id}"><span class="dpi">${d.icon}</span><b>${esc(d.title)}</b><small>${new Date(d.date).toLocaleDateString('ru-RU')}</small></button>`).join('')}</div>` : '<div class="card center"><div class="big-emoji">📜</div><p>Первый диплом уже близко!</p></div>'}
      ${next.length ? `<h3>Следующие дипломы</h3><div class="dp-next">${next.map(r => `<div class="dp-n"><span>${r.icon}</span><div><b>${r.title}</b><small>${esc(g(r.sub))}</small></div></div>`).join('')}</div>` : ''}</div>`.replace(/\(а\)/g, fem() ? 'а' : '');
    $$('.dp').forEach(b => b.addEventListener('click', () => { SND.tap(); show(own().find(x => x.id === b.dataset.d)); }));
  };
  /* ---------- подключение: проверка после наград и на главной, плитка ---------- */
  const aw = award; award = function () { const r = aw.apply(this, arguments); try { check(); } catch (e) { console.warn(e); } return r; };
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); try { check(); const sh = $('.t-shop', app); if (sh && !$('.t-diploma', app)) sh.insertAdjacentHTML('afterend', `<button class="tile t-diploma" data-go="diplomas"><span class="ti">📜</span><b>Мои дипломы</b><small>${own().length ? 'Собрано: ' + own().length : 'За пройденные темы'}</small></button>`); } catch (e) { console.warn(e); } return r; }; }
  if (!NO_FLOAT.includes('diplomas')) NO_FLOAT.push('diplomas');
  return { check, render, rules, show };
})();
window.Diplomas = Diplomas;
