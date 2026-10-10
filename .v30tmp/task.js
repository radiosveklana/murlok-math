// node task.js W H  — task screens: answer field + controls in viewport, viewport screenshots
const puppeteer = require('C:/Users/izzye/projects/murlok-math/tools/e2e/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const W = +process.argv[2], H = +process.argv[3];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LIST = (process.argv[4] || 'practice:mul,practice:eq,lesson:mul,lesson:eq,bugs,bugs2,drill:div,drill:mixall,blitzrun,colwork:div,colwork:add,casetask-mul,casetask-eq,casetask-bug,casetask-interro,game:scales,game:interro,game:color,game:safe,game:logic,game:memo,game:chase,game:pattern,game:estimate,aquiz:safety:personal_data,aquiz:math4:motion,aquiz:math4:data_logic,aquiz:obzh:burns,aquiz:think:fact_opinion,rescue').split(',');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8779/'); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик-Пушистик', kid: 'Александра', seenVersion: APP_VERSION, rankV: 2, xp: 2500, candies: 1234, gems: 12, cases: 14, login: { last: today(), day: 1 }, houseV: 2, st: { mul: { done: 40, perfect: 0 }, eq: { done: 12, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } } }))); });
  const out = [];
  for (const sc of LIST) {
    await p.goto('http://localhost:8779/'); await sleep(700);
    await p.evaluate(sc => {
      document.querySelectorAll('.modal,.toast').forEach(m => m.remove());
      if (sc.startsWith('casetask-')) { const k = sc.slice(9); startCase('mix', 2); for (let i = 0; i < 20 && CASE.tasks[0].kind !== (k === 'bug' ? CASE.tasks[0].kind.startsWith('bug') && CASE.tasks[0].kind : k); i++) { CASE.tasks[0] = makeTask(k === 'bug' ? 'bugmul' : k, k === 'mul' ? 3 : k === 'eq' ? 3 : k === 'interro' ? 'mul' : 2); } return go('casetask'); }
      if (sc === 'blitzrun') { go('blitz'); return document.getElementById('go').click(); }
      const [n, ...a] = sc.split(':'); go(n, a.length ? a.join(':') : undefined);
    }, sc);
    await sleep(2600); // let the .cheer bubble (2.2s) go away
    await p.evaluate(() => { document.querySelectorAll('.modal,.toast,.confetti').forEach(m => m.remove()); window.scrollTo(0, 0); });
    // try to get to numeric step in equation (op choice first): click first .opts button? no — just report
    await sleep(200);
    const r = await p.evaluate(() => {
      const VH = innerHeight, app = document.getElementById('app');
      const vis = e => { const r = e.getBoundingClientRect(); if (!r.height) return false; for (let x = e; x && x !== document.body; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden') return false; } return true; };
      const q = sels => { for (const s of sels) { const l = [...app.querySelectorAll(s)].filter(vis); if (l.length) return [s, l]; } return [null, []]; };
      const box = l => { let t = 1e9, bb = -1e9; l.forEach(e => { const r = e.getBoundingClientRect(); t = Math.min(t, r.top); bb = Math.max(bb, r.bottom); }); return [Math.round(t), Math.round(bb)]; };
      const [as, al] = q(['.cell.target', '.ask .inp', '.ask-eq .inp', '.bz-q .inp', '.inp', 'input.nmi', 'input[type=number]', 'input[inputmode=numeric]', '.eql.last', '.ask']);
      const [cs, cl] = q(['.pad', '.opts', '.rs-opts', '.choices']);
      const covered = el => { if (!el) return null; const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; if (cy < 0 || cy > VH) return 'вне экрана'; const t = document.elementFromPoint(cx, cy); return t && !el.contains(t) && !t.contains(el) ? (t.className || t.tagName) + '' : null; };
      const keys = cl.length ? [...cl[0].querySelectorAll('button')] : [];
      const keyCov = keys.map(k => covered(k)).filter(Boolean);
      const body = document.body, se = document.scrollingElement;
      const cc = app.querySelector('.ctrl-col'); const ccs = cc && getComputedStyle(cc);
      return { as, ans: al.length ? box([al[0]]) : null, ansCov: covered(al[0]), cs, ctl: cl.length ? box(cl) : null, keyCov: keyCov.slice(0, 3), nkeys: keys.length, VH, docH: se.scrollHeight, bodyScroll: body.scrollHeight > body.clientHeight + 2 && getComputedStyle(body).overflowY !== 'visible' ? `${body.scrollHeight}/${body.clientHeight}` : '', cc: cc ? `${ccs.position} ${Math.round(cc.getBoundingClientRect().top)}..${Math.round(cc.getBoundingClientRect().bottom)}` : '', kind: (window.CASE && CASE.tasks[CASE.idx] || {}).kind };
    });
    r.sc = sc; r.fits = !!(r.ctl && r.ctl[0] >= 0 && r.ctl[1] <= H && (!r.ans || (r.ans[0] >= 0 && r.ans[1] <= H)) && !r.ansCov && !r.keyCov.length);
    const f = path.join(__dirname, 'shots', `vp-${W}x${H}-${sc.replace(/:/g, '_')}.png`);
    await p.screenshot({ path: f }); r.shot = f;
    out.push(r);
    console.log(`${r.fits ? 'OK ' : 'BAD'} ${sc.padEnd(28)} ans=${r.as || '-'} ${r.ans || ''}${r.ansCov ? ' COVERED by ' + r.ansCov : ''} | ctl=${r.cs || '-'} ${r.ctl || ''} keys=${r.nkeys}${r.keyCov.length ? ' KEYCOV ' + r.keyCov.join(';') : ''} | VH=${r.VH} doc=${r.docH} cc=${r.cc} ${r.bodyScroll ? 'BODYSCROLL ' + r.bodyScroll : ''} ${r.kind || ''}`);
  }
  fs.writeFileSync(path.join(__dirname, `task-${W}x${H}.json`), JSON.stringify(out, null, 1));
  await b.close();
})();
