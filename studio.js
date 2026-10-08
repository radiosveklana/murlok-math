/* studio.js — «Студия звуков»: ребёнок записывает свои звуки, персонажи потом говорят ими.
   Записи хранятся только на этом устройстве (IndexedDB). */
'use strict';
const SLOTS_REC = [
  { id: 'meow', icon: '😺', name: 'Мяу котика', who: 'Котик мяукает, когда его гладят', rate: 1.1 },
  { id: 'laugh', icon: '😹', name: 'Смех котика', who: 'Котик смеётся, когда ему щекотно', rate: 1.1 },
  { id: 'purr', icon: '😻', name: 'Мурлыканье', who: 'Котик мурлычет, когда доволен', rate: 1 },
  { id: 'oops', icon: '🙀', name: '«Ой!»', who: 'Когда в задаче ошибка', rate: 1.1 },
  { id: 'yay', icon: '🎉', name: '«Ура!»', who: 'Когда задача решена', rate: 1.05 },
  { id: 'hello', icon: '👋', name: 'Приветствие', who: 'Котик здоровается на главном экране', rate: 1.1 },
  { id: 'hiss', icon: '😾', name: 'Фырканье подозреваемого', who: 'Когда арестовали не того', rate: 0.85 },
  { id: 'thief', icon: '🦝', name: 'Голос пойманного вора', who: 'Когда вор пойман', rate: 0.9 },
];
const Studio = (() => {
  let db = null;
  const open = () => db ? Promise.resolve(db) : new Promise((res, rej) => { try { const r = indexedDB.open('murlok-sounds', 1); r.onupgradeneeded = () => r.result.createObjectStore('rec'); r.onsuccess = () => { db = r.result; res(db); }; r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  const tx = (mode, fn) => open().then(d => new Promise((res, rej) => { const t = d.transaction('rec', mode), st = t.objectStore('rec'), q = fn(st); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
  const get = id => tx('readonly', st => st.get(id));
  const put = (id, blob) => tx('readwrite', st => st.put({ blob, ts: Date.now() }, id));
  const del = id => tx('readwrite', st => st.delete(id));
  async function loadAll() { for (const s of SLOTS_REC) { try { const r = await get(s.id); if (r && r.blob) await M.setCustom(s.id, await r.blob.arrayBuffer(), s.rate); } catch (e) { } } }
  return { get, put, del, loadAll };
})();
document.addEventListener('pointerdown', function once() { document.removeEventListener('pointerdown', once, true); setTimeout(() => Studio.loadAll(), 100); }, true);

SCREENS.studio = () => {
  app.innerHTML = `${topbar('Студия звуков')}<div class="page studio">
    <div class="studio-head"><div class="big-emoji">🎙️</div><p>Запиши свои звуки — и персонажи будут говорить твоим голосом! Нажми <b>⏺</b>, издай звук и нажми <b>⏹</b>. Не понравилось — перезапиши.</p></div>
    <div class="rec-grid" id="rg"></div><p class="small center">Записи хранятся только на этом планшете.</p></div>`;
  const draw = async () => {
    const rows = await Promise.all(SLOTS_REC.map(async s => ({ s, has: !!(await Studio.get(s.id).catch(() => null)) })));
    $('#rg').innerHTML = rows.map(({ s, has }) => `<div class="rec ${has ? 'has' : ''}" data-id="${s.id}"><span class="rec-ic">${s.icon}</span><div class="rec-t"><b>${s.name}</b><small>${s.who}</small><small class="rec-st">${has ? '✅ Твоя запись' : 'Сейчас стандартный звук'}</small></div>
      <div class="rec-b"><button class="rb play" title="Послушать">▶</button><button class="rb rec-btn" title="Записать">⏺</button>${has ? '<button class="rb del" title="Вернуть стандартный">↺</button>' : ''}</div><div class="meter"><i></i></div></div>`).join('');
    $$('.rec', app).forEach(row => {
      const id = row.dataset.id, slot = SLOTS_REC.find(x => x.id === id);
      $('.play', row).addEventListener('click', () => { M.ctx(); if (!M.custom(id)) demo(id); });
      $('.rec-btn', row).addEventListener('click', () => record(row, slot));
      const d = $('.del', row); if (d) d.addEventListener('click', async () => { await Studio.del(id); M.setCustom(id, null); SND.tap(); draw(); });
    });
  };
  const demo = id => ({ meow: () => M.meow(), laugh: () => M.kitten(), purr: () => M.purr(1.5), oops: () => M.meow({ shape: 'question' }), yay: () => SND.win(), hello: () => M.trill(), hiss: () => M.hiss(), thief: () => M.meow({ shape: 'sad', pitch: 0.8 }) }[id] || (() => { }))();
  let rec = null;
  async function record(row, slot) {
    const btn = $('.rec-btn', row);
    if (rec) { rec.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Этот браузер не умеет записывать звук 😿'); return; }
    let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { toast('Разреши доступ к микрофону 🎤'); return; }
    Music.setDuck(true); M.hush();
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    const mr = new MediaRecorder(stream, type ? { mimeType: type } : {}), chunks = [];
    rec = mr; btn.textContent = '⏹'; row.classList.add('recording');
    // индикатор громкости
    const ac = M.ctx(), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser(); an.fftSize = 256; src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount), meter = $('.meter i', row);
    const iv = setInterval(() => { an.getByteTimeDomainData(data); let pk = 0; for (const v of data) pk = Math.max(pk, Math.abs(v - 128)); meter.style.width = Math.min(100, pk / 1.28 * 1.6) + '%'; }, 60);
    const stopT = setTimeout(() => mr.state === 'recording' && mr.stop(), 4000);
    mr.ondataavailable = e => e.data.size && chunks.push(e.data);
    mr.onstop = async () => {
      clearInterval(iv); clearTimeout(stopT); src.disconnect(); stream.getTracks().forEach(t => t.stop()); rec = null; Music.setDuck(false);
      const blob = new Blob(chunks, { type: mr.mimeType || type || 'audio/webm' });
      if (blob.size < 1500) { toast('Ничего не записалось — попробуй ещё раз'); draw(); return; }
      await Studio.put(slot.id, blob); const ok = await M.setCustom(slot.id, await blob.arrayBuffer(), slot.rate);
      if (!ok) { toast('Не получилось прочитать запись 😿'); }
      confetti(15); SND.tap(); setTimeout(() => M.custom(slot.id), 200); draw();
    };
    mr.start();
  }
  draw();
};
