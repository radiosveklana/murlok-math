// v35: исправления школьной математики по аудиту методиста + новые темы + «Пробная ВПР».
// node tools/e2e/v35-math.js   (нужен node tools/e2e/serve.js 8765, URL=... — другой адрес)
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V35 OK ' : 'V35 FAIL ') + name + (x && !c ? ' ' + x : '')); };
const NEW = ['million_classes', 'volume_capacity', 'area_big', 'compound_units', 'calendar_time', 'expr4', 'eq_moro', 'motion_chase', 'proportional', 'task_3_4', 'logic_plus'];

/* ---------- 1. генераторы в node: 500 раз на каждом уровне ---------- */
{
  const { run } = require('./v35-gen.js'), { report, bad } = run(+process.env.GEN_N || 500);
  Object.entries(report).forEach(([id, r]) => ok('gen ' + id + ' (' + r.n + ')', !r.err, r.ex.join(' || ')));
  ok('all generators clean', bad === 0);
}

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404|AudioContext/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.setBypassServiceWorker(true); await p.setRequestInterception(true);
  p.on('request', r => { const u = r.url(), H = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization' };
    if (/(murlok-api|\/api)\//.test(u)) return r.respond({ status: 200, contentType: 'application/json', headers: H, body: '{"ok":true,"items":[]}' });
    r.continue(); });
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForSelector('#kid');
  await p.evaluate(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Саша', seenVersion: APP_VERSION, rankV: 2, xp: 3000, lessons: { mul: 1, eq: 1 }, unlockAll: true }))));
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 }); await sleep(1500);
  const E = (f, ...a) => p.evaluate(f, ...a), clean = () => E(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove()));
  const go = async (s, a) => { await clean(); await E((s, a) => go(s, a), s, a); await sleep(450); };
  const txt = sel => E(s => (document.querySelector(s) || {}).innerText || '', sel);
  const pad = async (root, num) => { for (const d of String(num)) await E((r, d) => document.querySelector(r + ' .pad .k[data-k="' + d + '"]').click(), root, d); await E(r => document.querySelector(r + ' .pad .k[data-k="ok"]').click(), root); await sleep(150); };
  try {
    /* ---------- новые темы: в Школе, в тренажёре, в шпаргалках, в копилке дел ---------- */
    await go('school');
    ok('all new topics in School', await E(ids => ids.every(id => !!document.querySelector(`.unit[data-u="${id}"]`)), NEW));
    ok('old topic ids unchanged, new ones appended at the end', await E(ids => { const u = SUBJECTS.math4.units.map(x => x.id); return u[0] === 'million_read' && u[17] === 'data_logic' && ids.every((id, i) => u[18 + i] === id); }, NEW));
    ok('«📝 Пробная ВПР» button', await E(() => !!document.querySelector('.school4 [data-go="vpr"]')));
    for (const id of NEW) {
      await go('aquiz', 'math4:' + id);
      const st = await E(() => ({ q: document.querySelectorAll('.g-dots i').length, html: (document.querySelector('.page') || {}).innerText || '' }));
      ok('trainer ' + id, st.q >= 5 && !/undefined|NaN/.test(st.html), JSON.stringify(st).slice(0, 200));
      ok('cheat sheet for ' + id, await E(() => { const c = Cheats.context(); return !!c && !!Cheats.sheet(c[0]).cards.find(x => x.id === c[1]); }));
    }
    await go('alesson', 'math4:eq_moro'); ok('textbook opens for new topic', /правую часть/i.test(await txt('.page')));
    ok('new topics in case task bank (Новое дело / Енот)', await E(ids => { const L = TaskBank.list().map(x => x.id); return ids.every(id => L.includes('math4:' + id)); }, NEW));
    ok('task bank makes tasks from new topics', await E(ids => ids.every(id => { const t = TaskBank.pick(['math4:' + id], 1, 2)[0]; return t && t.q && t.q.q; }), NEW));

    /* ---------- шпаргалки: регулярное выражение с \d, неразрывные пробелы в числах ---------- */
    await go('cheats', 'ranks');
    ok('cheats: numbers keep non-breaking spaces (regex fixed)', await E(() => document.querySelector('.cs-body').textContent.includes('305\u00a0726') && !/\$1|00a0/.test(document.querySelector('.cs-body').innerHTML)));
    await go('cheats', 'column');
    ok('cheats: first partial dividend defined correctly', /наименьшее начало делимого/.test(await txt('.cs-body')));
    await go('cheats', 'formulas'); ok('cheats: «произведение — умножением, множитель — делением»', /произведение.*умножением.*множитель.*делением/s.test(await txt('.cs-body')));

    /* ---------- столбик: вычитание через 0, из которого уже заняли (240098 − 75282) ---------- */
    await go('school');
    const subMsgs = await E(async () => {
      const el = document.createElement('div'); el.id = 'tsub'; document.querySelector('.page').appendChild(el); const msgs = [];
      const P = Column.addPlan(240098, 75282, '-'); S.prefs.addLv = 3;
      Column.runAdd(el, P, true, h => msgs.push(h), () => {});
      for (let k = 0; k < P.cols.length; k++) { await new Promise(r => setTimeout(r, 30)); el.querySelector('.pad .k[data-k="' + P.cols[k].d + '"]').click(); el.querySelector('.pad .k[data-k="ok"]').click(); await new Promise(r => setTimeout(r, 1300)); }
      return msgs.join(' | ');
    });
    ok('subtraction hint: «0 − 1 нельзя…» instead of «−1 − 5»', /0 − 1 нельзя/.test(subMsgs) && !/−1 −/.test(subMsgs), subMsgs.slice(0, 300));
    ok('subtraction hint: «занимаем 1 сотню = 10 десятков» style', /1 тысячу<\/b> = 10 сотен|1 сотню<\/b> = 10 десятков|1 десяток тысяч<\/b> = 10 тысяч/.test(subMsgs), subMsgs.slice(0, 300));
    await go('collesson', 'div'); for (let i = 0; i < 5; i++) { await E(() => document.querySelector('#next').click()); await sleep(120); }
    const sl = await txt('#slide'); ok('division lesson: 38 : 32 → пробуем 1 (no «30 : 3 → 1»)', /38 : 32/.test(sl) && !/30 : 3 → 1/.test(sl), sl.slice(0, 200));

    /* ---------- умножение по Моро: нулевая строка не пишется, нули на конце ---------- */
    ok('mulPlanMoro 245·302: rows at positions 0 and 2', await E(() => { const M = E.mulPlanMoro(245, 302); return M.rows.length === 2 && M.rows[1].pos === 2 && M.core === 73990; }));
    ok('mulPlanMoro 3400·56: zeros moved to the end', await E(() => { const M = E.mulPlanMoro(3400, 56); return M.a0 === 34 && M.z === 2 && M.core === 1904; }));
    ok('genMul({zeros}) gives 245·302 / 3400·56 / 1250·70 cases on level 3–4, plain genMul — none', await E(() => { let z = 0, z0 = 0; for (let i = 0; i < 300; i++) { const [a, b] = E.genMul(4, { zeros: true }); if (/0/.test(String(b)) || a % 10 === 0) z++; const [c, d] = E.genMul(4); if (/0/.test(String(d))) z0++; } return z > 30 && z0 === 0; }));
    const own = async (type, a, b2) => { await go('paper', type); await E(() => document.querySelector('#pown').click()); await sleep(200); await E((a, b) => { document.querySelector('#oa').value = a; document.querySelector('#ob').value = b; document.querySelector('#pownok').click(); }, a, b2); await sleep(200); };
    const ans = async (v, r) => { await E((v, r) => { document.querySelector('#pans').value = v; if (r != null && document.querySelector('#prem')) document.querySelector('#prem').value = r; document.querySelector('#pchk').click(); }, v, r); await sleep(250); };
    const step = async v => { const q = await txt('.pp-sq'); await E(v => { document.querySelector('#psv').value = v; document.querySelector('#psok').click(); }, v); await sleep(200); return q; };
    await own('mul', 245, 302); await ans(7840);
    const s1 = await step(490), s2 = await step(735), s3 = await step(7840);
    ok('paper 245·302: no «245 × 0» row', !/245 × 0/.test(s1 + s2 + s3) && /245 × 3/.test(s2));
    ok('paper 245·302: second row shifted by 2, zero row skipped', /на 2 клетки/.test(s2) && /строку для нуля не пишем/.test(s2), s2);
    ok('paper 245·302: wrong shift diagnosed', /Строку для нуля в множителе не пишут/.test(await txt('.pp-found')), await txt('#psteps'));
    await own('mul', 3400, 56); await ans(19040);
    ok('paper 3400·56: forgotten zeros diagnosed', /Нули на конце/.test(await txt('.pp-found')), await txt('#psteps'));
    await own('mul', 87, 6); await ans(482);
    const one1 = await txt('#psteps');
    ok('paper 87·6: one-digit multiplier — no «число на шаге», digit check finds forgotten carry', !/на этом шаге/.test(one1) && /не прибавил/.test(one1), one1);
    await own('div', 47, 5); await ans(9, '');
    ok('paper 47:5 with empty remainder: explains, no error card', /остаток есть/.test(await txt('#pbub')) && !(await p.$('.pp-found')), await txt('#pbub'));

    /* ---------- Пробная ВПР ---------- */
    const runVpr = async right => {
      await go('vpr');
      for (let k = 0; k < 14; k++) {
        const q = await E(() => window.__vpr && { type: window.__vpr.type, c: window.__vpr.c, a: window.__vpr.a });
        if (!q) break;
        for (let att = 0; att < 2; att++) {
          if (q.type === 'one') await E((c, right) => { const o = [...document.querySelectorAll('#vbox .opt')].find(b => right ? +b.dataset.i === c : +b.dataset.i !== c); o.click(); }, q.c, right);
          else await pad('#vbox', right ? q.c : +q.c + 1);
          await sleep(1000);
          if (await p.$('#vnext')) break;
        }
        await E(() => document.querySelector('#vnext').click()); await sleep(250);
      }
      return { score: await txt('.vpr-score'), end: await txt('.vpr-end') };
    };
    const r1 = await runVpr(true);
    ok('VPR: all right → 15 of 15, nothing dipped', r1.score === '15' && /Ни один номер не просел/.test(r1.end), JSON.stringify(r1).slice(0, 300));
    ok('VPR: №5 and №11 marked as «появится позже»', (r1.end.match(/появится позже/g) || []).length === 2);
    const r2 = await runVpr(false);
    ok('VPR: all wrong → 0 and the list of dipped numbers with links to topics', r2.score === '0' && /Просели номера: №1, №2, №3, №4, №6, №7, №8, №9, №10, №12/.test(r2.end) && !!(await p.$('[data-vq]')), JSON.stringify(r2).slice(0, 300));
    ok('VPR result saved', await E(() => (S.vpr || []).length === 2 && S.vpr[0].p === 15 && S.vpr[0].m === 15));
    await E(() => document.querySelector('[data-vq]').click()); await sleep(400);
    ok('VPR: «просевший» номер opens the topic trainer', await E(() => curScreen === 'aquiz'));
  } catch (e) { errors.push('CRASH ' + e.message); }
  ok('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  console.log(fails ? `V35 FAIL total ${fails} of ${n}` : `V35 DONE ${n}`);
  await b.close(); process.exit(fails ? 1 : 0);
})();
