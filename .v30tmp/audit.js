// node audit.js <width> <height> [screens csv]
const puppeteer = require('C:/Users/izzye/projects/murlok-math/tools/e2e/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const URL = 'http://localhost:8779/';
const W = +process.argv[2], H = +process.argv[3];
const OUT = path.join(__dirname, 'shots');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = ['home', 'school', 'newcase', 'practice:mul', 'practice:eq', 'games', 'game:scales', 'game:interro', 'game:color', 'game:safe', 'game:logic', 'game:memo', 'game:chase', 'game:pattern', 'game:estimate', 'bugs', 'blitz', 'shop', 'house:bedroom', 'book', 'parents', 'chat', 'studio', 'lesson:mul', 'lesson:eq', 'academy', 'subject:space', 'subject:safety', 'subject:teen', 'subject:think', 'subject:read', 'alesson:safety:personal_data', 'aquiz:safety:personal_data', 'aquiz:think:fact_opinion', 'asearch:teen', 'photo', 'schulte:5', 'flash', 'rtext:0', 'rgrowth', 'salon', 'fitting', 'friends', 'earn', 'earn:shade:galaxy', 'earn:room:fame', 'diplomas', 'solar', 'citywalk', 'fakenews', 'roleplay', 'rpchat:new_kid', 'house:fame', 'subject:talk', 'subject:world', 'subject:body', 'subject:health', 'helpharm', 'bodybuild', 'practice2', 'practice2:square_breath', 'colwork:div', 'colwork:add', 'collesson:div', 'subject:math4', 'aquiz:math4:motion', 'aquiz:math4:data_logic', 'subject:creative', 'ideas', 'ideas:uses', 'ideas:story', 'ideas:draw', 'starmap', 'spacetrip', 'drill:div', 'drill:mixall', 'bugs2', 'rescue', 'subject:obzh', 'subject:stories', 'aquiz:obzh:burns'];
const EXTRA = ['agate', 'agate-pin', 'pinset', 'pauth', 'caseintro', 'casetask', 'accuse', 'blitzrun'];
const screens = process.argv[4] ? process.argv[4].split(',') : BASE.concat(EXTRA);
const SEED = () => ({ name: 'Мурзик-Пушистик', kid: 'Александра', seenVersion: APP_VERSION, rankV: 2, xp: 2500, candies: 1234, gems: 12, cases: 14, login: { last: today(), day: 1 }, houseV: 2, owned: ['deer', 'loupe', 'crown', 'cape'], st: { mul: { done: 40, perfect: 0 }, eq: { done: 12, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } }, roomsSeen: ['kitchen', 'living', 'bedroom', 'play', 'bath'], care: { food: 90, water: 90, fun: 90, energy: 90, clean: 90, t: Date.now() } });

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage();
  const mobile = W < 600;
  await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 150)));
  let errs = [];
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(s => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), eval('(' + s + ')')()))); }, SEED.toString());
  const results = [];
  for (const sc of screens) {
    errs = [];
    await p.evaluate(() => localStorage.removeItem('murlok-strict-gate'));
    if (sc === 'agate' || sc === 'agate-pin') await p.evaluate(() => localStorage.setItem('murlok-strict-gate', '1'));
    if (sc === 'agate-pin') await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('murlok-detective-v1')); s.pin = '4826'; localStorage.setItem('murlok-detective-v1', JSON.stringify(s)); });
    await p.goto(URL); await sleep(700);
    try {
      await p.evaluate(sc => {
        document.querySelectorAll('.modal,.toast').forEach(m => m.remove());
        if (sc === 'salon') { SHOP_TAB = 'salon'; return go('shop'); }
        if (sc === 'agate' || sc === 'agate-pin') return go('agate', 'parents');
        if (sc === 'caseintro') return startCase('mix', 2);
        if (sc === 'casetask') { startCase('mix', 2); return go('casetask'); }
        if (sc === 'accuse') { startCase('mix', 2); CASE.idx = 4; return go('accuse'); }
        if (sc === 'blitzrun') { go('blitz'); return document.getElementById('go').click(); }
        const [n, ...a] = sc.split(':'); go(n, a.length ? a.join(':') : undefined);
      }, sc);
    } catch (e) { results.push({ sc, error: e.message.slice(0, 200) }); continue; }
    await sleep(1000);
    await p.evaluate(() => { document.querySelectorAll('.modal,.toast,.confetti,.floater,.flycandy,.heart,.pawfx').forEach(m => m.remove()); window.scrollTo(0, 0); });
    await sleep(150);
    const r = await p.evaluate(() => {
      const VW = innerWidth, VH = innerHeight, app = document.getElementById('app');
      const vis = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };
      const desc = el => { const c = (typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '').trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.'); return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : ''); };
      const txt = el => (el.innerText || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      const inter = (a, b) => ({ w: Math.min(a.right, b.right) - Math.max(a.left, b.left), h: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) });
      // effective clip from ancestors
      const clipRect = el => { let L = -1e9, R = 1e9, T = -1e9, B = 1e9; for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) { const s = getComputedStyle(e); if (s.overflowX !== 'visible' || s.overflowY !== 'visible') { const rc = e.getBoundingClientRect(); if (s.overflowX !== 'visible') { L = Math.max(L, rc.left); R = Math.min(R, rc.right); } if (s.overflowY !== 'visible') { T = Math.max(T, rc.top); B = Math.min(B, rc.bottom); } } if (s.position === 'fixed') break; } return { L, R, T, B }; };
      const out = { hover: [], overlap: [], clip: [], docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight };
      // 1. horizontal overflow
      const all = [...app.querySelectorAll('*')].filter(el => !el.closest('svg') || el.tagName === 'svg');
      for (const el of all) {
        const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
        if (rc.right <= VW + 1 && rc.left >= -1) continue;
        if (!vis(el)) continue;
        const c = clipRect(el); const effR = Math.min(rc.right, c.R), effL = Math.max(rc.left, c.L);
        if (effR > VW + 1 || effL < -1) {
          // only report outermost
          const par = el.parentElement; const pr = par && par.getBoundingClientRect();
          if (pr && par !== app && (Math.min(pr.right, clipRect(par).R) > VW + 1 || Math.max(pr.left, clipRect(par).L) < -1)) continue;
          out.hover.push(`${desc(el)} [${Math.round(rc.left)}..${Math.round(rc.right)}] «${txt(el)}»`);
        }
      }
      // 2. text overlap
      const tn = []; const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const o = n.parentElement; if (o.closest('svg,#mascot,script,style')) continue; if (!vis(o)) continue; const rg = document.createRange(); rg.selectNodeContents(n); const c = clipRect(o); for (const r of rg.getClientRects()) { if (r.width < 2 || r.height < 2) continue; const cr = { left: Math.max(r.left, c.L), right: Math.min(r.right, c.R), top: Math.max(r.top, c.T), bottom: Math.min(r.bottom, c.B) }; if (cr.right - cr.left < 2 || cr.bottom - cr.top < 2) continue; tn.push({ o, r: cr, t: n.textContent.trim().slice(0, 30) }); } }
      const seen = new Set();
      for (let i = 0; i < tn.length; i++) for (let j = i + 1; j < tn.length; j++) {
        const A = tn[i], B = tn[j]; if (A.o === B.o || A.o.contains(B.o) || B.o.contains(A.o)) continue;
        const x = inter(A.r, B.r); if (x.w > 3 && x.h > 4) { const k = desc(A.o) + '|' + desc(B.o); if (seen.has(k)) continue; seen.add(k); out.overlap.push(`текст/текст: ${desc(A.o)} «${A.t}» ⨯ ${desc(B.o)} «${B.t}» (${Math.round(x.w)}x${Math.round(x.h)})`); }
      }
      const boxes = [...app.querySelectorAll('button,.btn,input,textarea,select,.k,.chip,.card,.tile')].filter(e => vis(e) && e.getBoundingClientRect().width);
      for (const A of tn) for (const bx of boxes) {
        if (bx.contains(A.o) || A.o.contains(bx)) continue;
        // ignore if text owner is ancestor container of box (e.g. text in card behind button)
        const br = bx.getBoundingClientRect(); const x = inter(A.r, br); if (x.w > 3 && x.h > 4) {
          // skip if box is positioned behind (z) — check topmost at overlap center
          const cx = (Math.max(A.r.left, br.left) + Math.min(A.r.right, br.right)) / 2, cy = (Math.max(A.r.top, br.top) + Math.min(A.r.bottom, br.bottom)) / 2;
          const k = desc(A.o) + '#' + desc(bx); if (seen.has(k)) continue; seen.add(k);
          const top = document.elementFromPoint(cx, cy);
          out.overlap.push(`текст/блок: ${desc(A.o)} «${A.t}» ⨯ ${desc(bx)} «${txt(bx).slice(0, 20)}» (${Math.round(x.w)}x${Math.round(x.h)}) сверху: ${top ? desc(top) : '-'}`);
        }
      }
      // 3. clipped text
      for (const el of all) {
        if (!el.childNodes.length) continue; const t = txt(el); if (!t) continue;
        const s = getComputedStyle(el); if (s.overflowX === 'visible' && s.overflowY === 'visible') continue; if (!vis(el)) continue;
        if (el.closest('header.top') && el.tagName === 'H1') continue;
        const horiz = el.scrollWidth > el.clientWidth + 2 && (s.overflowX === 'hidden' || s.overflowX === 'clip');
        const vert = el.scrollHeight > el.clientHeight + 3 && (s.overflowY === 'hidden' || s.overflowY === 'clip');
        if (horiz || vert) {
          // only leaf-ish: text directly
          const direct = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || el.children.length <= 2;
          if (!direct) continue;
          out.clip.push(`${desc(el)} ${horiz ? 'по ширине ' + el.scrollWidth + '>' + el.clientWidth : ''}${vert ? ' по высоте ' + el.scrollHeight + '>' + el.clientHeight : ''}${s.textOverflow === 'ellipsis' ? ' (ellipsis)' : ''} «${t}»`);
        }
      }
      // 4. task: answer field + controls
      const firstVis = sels => { for (const s of sels) { const els = [...app.querySelectorAll(s)].filter(e => vis(e) && e.getBoundingClientRect().height); if (els.length) return { s, el: els[0], all: els }; } return null; };
      const ans = firstVis(['.cell.target', '.ask .inp', '.ask', '.ask-eq', '.bz-q', '.eql.last', '.inp', 'input.nmi', 'input[type=number]', 'input[inputmode=numeric]', 'input[type=text]', 'textarea']);
      const ctl = firstVis(['.pad', '.opts', '.choices', '.rs-opts']);
      if (ctl) {
        const rr = e => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; };
        let cb = 0, ct = 1e9; ctl.all.forEach(e => { const [t, bb] = rr(e); ct = Math.min(ct, t); cb = Math.max(cb, bb); });
        // covered keys
        const keys = [...ctl.el.querySelectorAll('button')]; const covered = [];
        keys.forEach(k => { const r = k.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; if (cy < 0 || cy > VH) return; const top = document.elementFromPoint(cx, cy); if (top && !k.contains(top)) covered.push(`${txt(k)}→${desc(top)}`); });
        out.task = { ans: ans ? { sel: ans.s, pos: rr(ans.el), text: txt(ans.el) } : null, ctl: { sel: ctl.s, pos: [ct, cb], n: ctl.all.length }, VH, fits: (!ans || (rr(ans.el)[0] >= 0 && rr(ans.el)[1] <= VH)) && cb <= VH && ct >= 0, covered };
      }
      out.title = (document.querySelector('header.top h1') || {}).innerText || '';
      return out;
    });
    r.sc = sc; r.errs = errs.slice();
    const bad = r.hover.length || r.overlap.length || r.clip.length || (r.task && !r.task.fits) || r.docW > W;
    const file = path.join(OUT, `${W}-${sc.replace(/[:]/g, '_')}.png`);
    await p.screenshot({ path: file, fullPage: true });
    r.shot = file;
    results.push(r);
    fs.writeFileSync(path.join(__dirname, `part-${W}x${H}.json`), JSON.stringify(results));
    process.stdout.write(bad ? '!' : '.');
  }
  fs.writeFileSync(path.join(__dirname, `res-${W}x${H}.json`), JSON.stringify(results, null, 1));
  await b.close(); console.log('\ndone', W);
})();
