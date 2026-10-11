// murlok-api, v23: админка (одна роль «владелец»): /admin — страница, /admin/api/* — данные и действия.
import { randomInt } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function makeAdmin({ DIR, SAVE_DIR, acc, send, mail, tg, tgLinks, TG_BOT }) {
  const A = acc.A, SESS = new Map();
  const USER = process.env.ADMIN_USER || '', HASH = process.env.ADMIN_HASH || ''; // HASH = "соль:scrypt-хэш"
  const checkPass = (u, p) => { if (!USER || !HASH || u !== USER) return false; const [salt, h] = HASH.split(':'); const x = scryptSync(String(p), salt, 32); return timingSafeEqual(x, Buffer.from(h, 'hex')); };
  const cookie = req => (String(req.headers.cookie || '').match(/(?:^|;\s*)madm=([a-f0-9]{48})/) || [])[1];
  const authed = req => { const k = cookie(req), s = k && SESS.get(k); return s && s.exp > Date.now(); };
  const json = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
  const body = async req => { let b = ''; for await (const c of req) { b += c; if (b.length > 200000) throw new Error('big'); } return b ? JSON.parse(b) : {}; };
  const day = k => { const d = new Date(); d.setDate(d.getDate() - k); return d.toISOString().slice(0, 10); };
  const AREA = { math: 'Математика и дела', games: 'Детективные игры', academy: 'Академия', house: 'Домик', shop: 'Кондитерская', chat: 'Разговоры с котиком', studio: 'Студия звуков', photo: 'Фотостудия', other: 'Главная и прочее' };

  function allSaves() { const out = []; for (const f of fs.readdirSync(SAVE_DIR)) if (f.endsWith('.json')) { try { out.push({ code: f.slice(0, 8), s: JSON.parse(fs.readFileSync(path.join(SAVE_DIR, f), 'utf8')) }); } catch { } } return out; }
  function stats() {
    const all = allSaves(), anyLinked = new Set(Object.values(A.children).map(c => c.cloudCode)), linked = new Set(Object.values(A.children).filter(c => !acc.isPlayer(c)).map(c => c.cloudCode)), t = Date.now();
    const saves = all.filter(x => linked.has(x.code) || !anyLinked.has(x.code)); // игроки-взрослые — не в детской статистике
    const active = days => saves.filter(x => linked.has(x.code) && t - (x.s.savedAt || 0) < days * 864e5).length;
    const wk = Array.from({ length: 7 }, (_, k) => day(k)); const areas = {}; let mins = 0, kids = 0;
    saves.filter(x => linked.has(x.code)).forEach(x => { let m = 0; wk.forEach(d => Object.entries((x.s.time || {})[d] || {}).forEach(([a, sec]) => { areas[a] = (areas[a] || 0) + sec; m += sec; })); if (m) { mins += m; kids++; } });
    const subj = {}; saves.filter(x => linked.has(x.code)).forEach(x => Object.entries(x.s.sk || {}).forEach(([id, v]) => { const m = id.match(/^a:(\w+)$/); if (m) subj[m[1]] = (subj[m[1]] || 0) + (v.n || 0); }));
    const refs = Object.entries(A.refs).map(([c, r]) => ({ code: c, visits: r.visits, regs: r.regs, owner: r.owner.c ? 'ребёнок ' + ((A.children[r.owner.c] || {}).name || '') : 'семья ' + ((A.families[r.owner.f] || {}).email || '') })).filter(r => r.visits || r.regs).sort((a, b) => b.regs - a.regs || b.visits - a.visits).slice(0, 15);
    return { families: Object.keys(A.families).length, children: Object.values(A.children).filter(c => !acc.isPlayer(c)).length, adultPlayers: Object.values(A.children).filter(c => acc.isPlayer(c)).length, active: { day: active(1), week: active(7), month: active(30) }, minutesPerKidDay: kids ? Math.round(mins / kids / 60 / 7) : 0,
      areas: Object.entries(areas).sort((a, b) => b[1] - a[1]).map(([a, s]) => ({ name: AREA[a] || a, minutes: Math.round(s / 60) })), subjects: Object.entries(subj).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, n })),
      sources: { viaRef: Object.values(A.families).filter(f => f.refBy).length, direct: Object.values(A.families).filter(f => !f.refBy).length, top: refs }, unlinkedSaves: saves.filter(x => !linked.has(x.code)).length, flagsNew: A.flags.filter(f => !f.seen).length, social: acc.social ? acc.social.stats() : null };
  }
  /* ---------- v30: метрики по разделам и внедрение новых функций (считаются из сохранений, кэш 10 минут) ---------- */
  const SECT = [['school', '🎓 Школа сыщика'], ['case', '🔍 Новое дело'], ['paws', '⚡ Быстрые лапки'], ['raccoon', '🦝 Енот (поиск ошибок)'], ['games', '🎲 Детективные игры'], ['academy', '📚 Академия'],
    ['house', '🏠 Домик и Кондитерская'], ['photo', '📸 Фотостудия и звуки'], ['arcade', '🚀 Космическая аркада'], ['starmap', '🔭 Звёздная карта'], ['duels', '⚔️ Вызовы'], ['chal', '🎯 Челленджи'],
    ['board', '🏆 Таблица успехов'], ['friends', '🤝 Друзья'], ['chat', '💬 Разговоры с котиком'], ['awards', '📜 Награды и дипломы'], ['other', '🏡 Главная и прочее']];
  const sumObj = o => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
  const EVER = { // «когда-либо пользовался» — по накопленному прогрессу (есть и в старых сохранениях)
    school: s => ((s.st || {}).mul || {}).done + ((s.st || {}).eq || {}).done > 0 || Object.keys(s.sk || {}).some(k => /^(mul|eq|div|add)\d$/.test(k)),
    case: s => (s.cases || 0) > 0, paws: s => (((s.st || {}).blitz || {}).games || 0) > 0 || Object.keys(s.drillBest || {}).length > 0, raccoon: s => (((s.st || {}).bug || {}).done || 0) > 0,
    games: s => Object.keys(s.sk || {}).some(k => k.startsWith('g:')), academy: s => Object.keys(s.acad || {}).some(k => k !== 'teen'), house: s => (s.furn || []).length > 0,
    photo: s => !!s.photos, arcade: s => Object.keys((s.trip || {}).done || {}).length > 0, starmap: s => (s.starsSeen || []).length > 0, awards: s => (s.diplomas || []).length > 0,
    chal: s => (s.chalBadges || []).length > 0,
  };
  let mCache = null;
  function metrics(fresh) {
    if (!fresh && mCache && Date.now() - mCache.at < 10 * 6e4) return { ...mCache.data, cached: true };
    const t0 = Date.now(), all = allSaves(), byCode = new Map(all.map(x => [x.code, x.s])), wk = Array.from({ length: 7 }, (_, k) => day(k));
    const kids = Object.values(A.children).filter(c => !acc.isPlayer(c)), players = Object.values(A.children).filter(c => acc.isPlayer(c));
    const kidSaves = kids.map(c => ({ c, s: byCode.get(c.cloudCode) })).filter(x => x.s);
    const sec = {}, reach = {}, ever = {}, subj = {};
    SECT.forEach(([id]) => { sec[id] = 0; reach[id] = 0; ever[id] = 0; });
    let withUse = 0, totSec = 0, totTasks = 0, totXp = 0, totDays = 0, review = 0, reviewKids = 0, blocks = 0, unlocks = 0;
    kidSaves.forEach(({ s }) => {
      const used = {}; let any = false;
      wk.forEach(d => { const u = (s.use || {})[d]; if (!u) return; any = true; Object.entries(u).forEach(([k, v]) => { if (k.startsWith('a:')) { const id = k.slice(2); (subj[id] = subj[id] || { id, sec: 0, kids: new Set(), read: 0, stars: 0, trained: 0 }).sec += v; subj[id].kids.add(s); } else { used[k] = (used[k] || 0) + v; } }); });
      if (any) withUse++; Object.entries(used).forEach(([k, v]) => { if (sec[k] == null) { sec[k] = 0; reach[k] = 0; } sec[k] += v; if (v > 0) reach[k]++; });
      Object.entries(EVER).forEach(([k, f]) => { try { if (f(s)) ever[k]++; } catch { } });
      wk.forEach(d => { totSec += sumObj((s.time || {})[d]); totTasks += +((s.days || {})[d] || 0); totXp += +(((s.daily || {})[d] || {}).x || 0); if ((s.days || {})[d] || (s.time || {})[d]) totDays++; });
      Object.entries(s.acad || {}).forEach(([id, a]) => { if (id === 'teen' || !a) return; const x = subj[id] = subj[id] || { id, sec: 0, kids: new Set(), read: 0, stars: 0, trained: 0 }; x.read += Object.keys(a.read || {}).length; x.stars += sumObj(a.best); const b = Object.keys(a.box || {}).length; review += b; });
      if (Object.values(s.acad || {}).some(a => a && Object.keys(a.box || {}).length)) reviewKids++;
      Object.entries(s.sk || {}).forEach(([k, v]) => { const m = k.match(/^a:(\w+)$/); if (m && m[1] !== 'teen') { const x = subj[m[1]] = subj[m[1]] || { id: m[1], sec: 0, kids: new Set(), read: 0, stars: 0, trained: 0 }; x.trained += v.n || 0; } });
      blocks += (s.limitStat || {}).blocks || 0; unlocks += (s.limitStat || {}).unlocks || 0;
    });
    // вызовы и челленджи — из данных сервера (кто участвовал)
    const inDuel = new Set(), inChal = new Set(); Object.values(A.duels).forEach(d => Object.keys(d.r || {}).forEach(id => inDuel.add(id)));
    Object.values(A.chals).forEach(c => (c.kind === 'family' ? ((A.families[c.fam] || {}).children || []) : (c.members || [])).forEach(id => inChal.add(id)));
    ever.duels = kids.filter(c => inDuel.has(c.id)).length; ever.chal = Math.max(ever.chal, kids.filter(c => inChal.has(c.id)).length);
    const n = kidSaves.length || 1, fams = Object.values(A.families);
    const onb = { started: 0, firstTask: 0, survey: 0, firstCase: 0, lesson: 0, days3: 0, linked: 0 }, unl = all.filter(x => !Object.values(A.children).some(c => c.cloudCode === x.code));
    [...kidSaves.map(x => ({ s: x.s, linked: true })), ...unl.map(x => ({ s: x.s, linked: false }))].forEach(({ s, linked }) => { if (!(s.kid && s.name)) return; onb.started++; const dn = Object.keys(s.days || {}).length; if (dn) onb.firstTask++; if (s.profile) onb.survey++; if ((s.cases || 0) > 0) onb.firstCase++; if ((s.lessons || {}).mul || (s.lessons || {}).eq) onb.lesson++; if (dn >= 3) onb.days3++; if (linked) onb.linked++; });
    const lim = kids.filter(c => acc.hasLimits(c.limits)), pSaves = players.map(c => byCode.get(c.cloudCode)).filter(Boolean);
    const data = {
      at: Date.now(), ms: 0, kids: kidSaves.length, kidsWithNewTracking: withUse,
      sections: SECT.map(([id, name]) => ({ id, name, minutes: Math.round(sec[id] / 60), reach: reach[id], ever: ever[id] != null ? ever[id] : null, avgPerKid: Math.round(sec[id] / 60 / n * 10) / 10, avgPerUser: reach[id] ? Math.round(sec[id] / 60 / reach[id]) : 0 })),
      subjects: Object.values(subj).map(x => ({ id: x.id, minutes: Math.round(x.sec / 60), kidsWeek: x.kids.size, read: x.read, stars: x.stars, trained: x.trained })).sort((a, b) => b.minutes - a.minutes || b.trained - a.trained),
      perKidWeek: { minutes: Math.round(totSec / 60 / n), tasks: Math.round(totTasks / n), xp: Math.round(totXp / n), activeDays: Math.round(totDays / n * 10) / 10 },
      review: { cards: review, kids: reviewKids }, onboarding: onb,
      adoption: { families: fams.length, tg: fams.filter(f => (f.tg || []).length).length, multiAdult: fams.filter(f => (f.parents || []).length > 1).length, limits: fams.filter(f => (f.children || []).some(id => acc.hasLimits((A.children[id] || {}).limits))).length,
        limitKids: lim.length, limitDaily: lim.filter(c => c.limits.daily).length, limitHours: lim.filter(c => c.limits.from).length, limitBreaks: lim.filter(c => c.limits.breaks).length, limitBlocks: blocks, limitUnlocks: unlocks,
        adultPlayers: players.length, adultPlayerFamilies: new Set(players.map(c => c.familyId)).size, adultMinutesWeek: Math.round(pSaves.reduce((t, s) => t + wk.reduce((x, d) => x + sumObj((s.time || {})[d]), 0), 0) / 60),
        famChallenges: Object.values(A.chals).filter(c => c.kind === 'family').length, famWithDuelWeek: new Set(Object.values(A.duels).filter(d => d.done && Date.now() - (d.doneAt || 0) < 7 * 864e5).flatMap(d => [d.from, d.to]).map(id => (A.children[id] || {}).familyId).filter(Boolean)).size },
      social: acc.social ? acc.social.stats() : null,
    };
    data.ms = Date.now() - t0; mCache = { at: Date.now(), data }; return data;
  }
  function familyFull(f) {
    const v = acc.famView(f); v.children = v.children.map(k => { const ch = A.children[k.id], s = acc.readSave(ch.cloudCode) || {}; const sk = Object.entries(s.sk || {}).map(([id, x]) => ({ id, n: x.n, a: Math.round((x.a || 0) * 100) })).sort((a, b) => b.n - a.n).slice(0, 15);
      const snaps = fs.existsSync(acc.SNAP) ? fs.readdirSync(acc.SNAP).filter(d => fs.existsSync(path.join(acc.SNAP, d, ch.cloudCode + '.json'))).sort().reverse() : [];
      return { ...k, skills: sk, rank: s.xp, diplomas: (s.diplomas || []).length, acad: Object.keys(s.acad || {}).filter(x => x !== 'teen'), snapshots: snaps, flags: A.flags.filter(fl => fl.code === ch.cloudCode).slice(0, 10) }; });
    v.tg = (f.tg || []).length;
    v.refBy = f.refBy; v.adults = (f.parents || [{ email: f.email, role: 'owner' }]).map(a => ({ email: a.email, role: a.role, joined: a.joined })); return v;
  }
  const PAGE = path.join(DIR, 'admin.html');
  async function route(req, res, url) {
    const p = url.pathname;
    if (p === '/admin' || p === '/admin/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY' }); return res.end(fs.readFileSync(PAGE)); }
    if (p === '/admin/api/login' && req.method === 'POST') {
      const d = await body(req); if (!checkPass(d.user, d.pass)) { await new Promise(r => setTimeout(r, 800)); return json(res, 401, { error: 'login' }); }
      const k = randomBytes(24).toString('hex'); SESS.set(k, { exp: Date.now() + 12 * 36e5 });
      res.writeHead(200, { 'content-type': 'application/json', 'set-cookie': `madm=${k}; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=43200` }); return res.end('{"ok":true}');
    }
    if (!authed(req)) return json(res, 401, { error: 'auth' });
    if (p === '/admin/api/logout') { SESS.delete(cookie(req)); return json(res, 200, { ok: true }); }
    if (p === '/admin/api/stats') return json(res, 200, stats());
    if (p === '/admin/api/metrics') return json(res, 200, metrics(url.searchParams.get('fresh') === '1'));
    if (p === '/admin/api/families') { const q = String(url.searchParams.get('q') || '').toLowerCase(); const L = Object.values(A.families).filter(f => !q || f.email.includes(q) || (f.children || []).some(id => ((A.children[id] || {}).name || '').toLowerCase().includes(q))).sort((a, b) => b.created - a.created).slice(0, 100).map(f => { const v = acc.famView(f); return { id: f.id, email: f.email, created: f.created, plan: v.plan, kids: v.children.map(k => ({ name: k.name, xp: k.xp, lastSeen: k.lastSeen, minutesWeek: k.minutesWeek, limits: acc.hasLimits(k.limits) })), players: v.players.map(x => x.name) }; }); return json(res, 200, { families: L }); }
    let m = p.match(/^\/admin\/api\/family\/(F[A-Z0-9]{10})$/);
    if (m) { const f = A.families[m[1]]; return f ? json(res, 200, familyFull(f)) : json(res, 404, { error: 'nf' }); }
    m = p.match(/^\/admin\/api\/child\/(C[A-Z0-9]{10})\/(grant|resetpin|restore)$/);
    if (m && req.method === 'POST') {
      const ch = A.children[m[1]]; if (!ch) return json(res, 404, { error: 'nf' }); const d = await body(req);
      if (m[2] === 'grant') { const c = Math.max(0, Math.min(1000, +d.candies || 0)), g = Math.max(0, Math.min(100, +d.gems || 0)); (A.pending[ch.cloudCode] = A.pending[ch.cloudCode] || []).push({ type: 'grant', candies: c, gems: g, note: String(d.note || '').slice(0, 120), at: Date.now() }); acc.touch(); return json(res, 200, { ok: true }); }
      if (m[2] === 'resetpin') { ch.pinHash = null; acc.touch(); return json(res, 200, { ok: true }); }
      if (m[2] === 'restore') { const dd = String(d.day || ''), src = path.join(acc.SNAP, dd, ch.cloudCode + '.json'); if (!/^\d{4}-\d{2}-\d{2}$/.test(dd) || !fs.existsSync(src)) return json(res, 400, { error: 'day' }); fs.copyFileSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), path.join(SAVE_DIR, ch.cloudCode + '.before-restore.json')); fs.copyFileSync(src, path.join(SAVE_DIR, ch.cloudCode + '.json')); (A.pending[ch.cloudCode] = A.pending[ch.cloudCode] || []).push({ type: 'restore', day: dd, at: Date.now() }); acc.touch(); return json(res, 200, { ok: true }); }
    }
    // код входа от поддержки: если письмо не дошло, админ выдаёт взрослому одноразовый код (15 минут), тот вводит его в «У меня уже есть код»
    m = p.match(/^\/admin\/api\/family\/(F[A-Z0-9]{10})\/logincode$/);
    if (m && req.method === 'POST') { const f = A.families[m[1]]; if (!f) return json(res, 404, { error: 'nf' }); const d = await body(req), email = String(d.email || f.email).trim().toLowerCase();
      const ok = email === f.email || (f.parents || []).some(x => x.email === email); if (!ok) return json(res, 400, { error: 'email' });
      const code = String(randomInt(100000, 1000000)); A.codes[email] = { h: acc.sha(email + ':' + code), exp: Date.now() + 15 * 6e4, tries: 0, ref: null }; acc.touch();
      return json(res, 200, { code, email }); }
    m = p.match(/^\/admin\/api\/family\/(F[A-Z0-9]{10})\/(export|delete)$/);
    if (m) { const f = A.families[m[1]]; if (!f) return json(res, 404, { error: 'nf' }); if (m[2] === 'export') { res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="family-${f.id}.json"` }); return res.end(JSON.stringify({ family: familyFull(f), progress: (f.children || []).map(id => acc.readSave((A.children[id] || {}).cloudCode)) }, null, 1)); } const d = await body(req); if (d.confirm !== 'УДАЛИТЬ') return json(res, 400, { error: 'confirm' }); acc.wipeFamily(f, 'admin-delete'); return json(res, 200, { ok: true }); }
    if (p === '/admin/api/flags') { if (req.method === 'POST') { A.flags.forEach(f => { f.seen = true; }); acc.touch(); return json(res, 200, { ok: true }); } return json(res, 200, { flags: A.flags.slice(0, 200) }); }
    if (p === '/admin/api/consents') { const L = fs.existsSync(acc.CLOG) ? fs.readFileSync(acc.CLOG, 'utf8').trim().split('\n').filter(Boolean).slice(-300).reverse().map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []; return json(res, 200, { consents: L }); }
    if (p === '/admin/api/tglink') { A.admin.tgTok = 'A' + acc.rnd(15); acc.touch(); return json(res, 200, { url: TG_BOT ? `https://t.me/${TG_BOT}?start=${A.admin.tgTok}` : null, linked: !!A.admin.tg }); }
    if (p === '/admin/api/broadcast' && req.method === 'POST') {
      const d = await body(req), text = String(d.text || '').slice(0, 4000), subject = String(d.subject || 'Новости «Мурлок и Ко»').slice(0, 120); if (text.length < 5) return json(res, 400, { error: 'text' });
      let fams = Object.values(A.families); if (d.target === 'active7') fams = fams.filter(f => (f.children || []).some(id => { const s = acc.readSave((A.children[id] || {}).cloudCode) || {}; return Date.now() - (s.savedAt || 0) < 7 * 864e5; }));
      let em = 0, tgn = 0;
      if (d.channel !== 'tg') for (const f of fams) { try { await mail(f.email, subject, text + '\n\n—\nКоманда «Мурлок и Ко» · murlok.tech-wave.ru\nОтписаться от новостей можно ответом на это письмо.'); em++; await new Promise(r => setTimeout(r, 1200)); } catch (e) { console.error('bcast mail', e.message); } }
      if (d.channel !== 'email') { const codes = new Set(fams.flatMap(f => (f.children || []).map(id => (A.children[id] || {}).cloudCode))); for (const [chat, v] of Object.entries(tgLinks())) if (codes.has(v.code)) { await tg('sendMessage', { chat_id: chat, text: `📣 ${subject}\n\n${text}` }); tgn++; await new Promise(r => setTimeout(r, 120)); } }
      return json(res, 200, { ok: true, email: em, tg: tgn });
    }
    return json(res, 404, { error: 'nf' });
  }
  return { route };
}
