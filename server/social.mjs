// murlok-api, v30: семья и друзья — таблица успехов за неделю, вызовы (дуэли на одном и том же задании), челленджи.
// Всё считается из облачных сохранений детей (readSave). Наружу — только имя (первое слово), имя котика и наряд.
// Свободного текста нет: игры, шаблоны челленджей и награды — из фиксированных списков.
import fs from 'node:fs';
import path from 'node:path';
import { randomInt } from 'node:crypto';

export const DUEL_GAMES = {
  schulte4: { icon: '🔢', name: 'Таблица Шульте 4×4', lower: true },
  schulte5: { icon: '🔢', name: 'Таблица Шульте 5×5', lower: true },
  paws: { icon: '⚡', name: 'Быстрые лапки: умножение за 60 секунд' },
  topic: { icon: '🎯', name: 'Блиц по теме' },
};
export const CHAL_TPL = {
  solo_streak: { kind: 'solo', icon: '🔥', name: '5 дней подряд по 10 задач', metric: 'streak10', goal: 5, days: 7, reward: { candies: 40, gems: 1, badge: '🔥' } },
  solo_acad: { kind: 'solo', icon: '🎓', name: '20 заданий Академии за неделю', metric: 'acad', goal: 20, days: 7, reward: { candies: 30, gems: 1, badge: '🎓' } },
  solo_tasks: { kind: 'solo', icon: '🧮', name: '100 задач за неделю', metric: 'tasks', goal: 100, days: 7, reward: { candies: 30, gems: 0, badge: '🧮' } },
  solo_xp: { kind: 'solo', icon: '⭐', name: '1000 опыта за неделю', metric: 'xp', goal: 1000, days: 7, reward: { candies: 30, gems: 1, badge: '⭐' } },
  fam_tasks: { kind: 'family', icon: '👨‍👩‍👧', name: '500 задач семьёй за неделю', metric: 'tasks', goal: 500, days: 7, reward: { candies: 40, gems: 1, badge: '🏡' } },
  fam_days: { kind: 'family', icon: '📅', name: 'Неделя без пропусков: каждый день кто-то из семьи занимается', metric: 'activeDays', goal: 7, days: 7, reward: { candies: 30, gems: 1, badge: '📅' } },
  fam_acad: { kind: 'family', icon: '🎓', name: '50 заданий Академии семьёй', metric: 'acad', goal: 50, days: 7, reward: { candies: 30, gems: 0, badge: '📚' } },
  fam_xp: { kind: 'family', icon: '⭐', name: '3000 опыта семьёй за неделю', metric: 'xp', goal: 3000, days: 7, reward: { candies: 35, gems: 1, badge: '🌟' } },
  fr_tasks: { kind: 'friends', mode: 'group', icon: '🤝', name: '1000 задач вместе с друзьями за неделю', metric: 'tasks', goal: 1000, days: 7, reward: { candies: 40, gems: 1, badge: '🤝' } },
  fr_race: { kind: 'friends', mode: 'race', icon: '🏁', name: 'Гонка: кто первым решит 100 задач', metric: 'tasks', goal: 100, days: 7, reward: { candies: 25, gems: 0, badge: '🏁' } },
};

export function makeSocial({ A, touch, readSave, rnd, SNAP, friendCodes }) {
  A.duels = A.duels || {}; A.chals = A.chals || {};
  const now = () => Date.now();
  const MSK = 3 * 36e5, dk = ts => new Date(ts + MSK).toISOString().slice(0, 10); // день по Москве
  const today = () => dk(now());
  const addDays = (key, n) => { const d = new Date(key + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const weekStart = () => { const t = today(), wd = (new Date(t + 'T00:00:00Z').getUTCDay() + 6) % 7; return addDays(t, -wd); };
  const range = (from, to) => { const out = []; for (let d = from; d <= to && out.length < 60; d = addDays(d, 1)) out.push(d); return out; };
  const first = s => String(s || '').trim().split(/\s+/)[0].replace(/[^\p{L}-]/gu, '').slice(0, 14);
  const byCode = () => { const m = new Map(); for (const c of Object.values(A.children)) m.set(c.cloudCode, c); return m; };
  const snapXp = (code, day) => { try { return JSON.parse(fs.readFileSync(path.join(SNAP, day, code + '.json'), 'utf8')).xp || 0; } catch { return null; } };

  /* ---------- метрики ребёнка за период ---------- */
  function metrics(ch, from, to, s = readSave(ch.cloudCode) || {}) {
    const days = range(from, to), D = s.days || {}, daily = s.daily || {};
    const tasks = days.reduce((t, d) => t + (+D[d] || 0), 0), acad = days.reduce((t, d) => t + (+(daily[d] || {}).a || 0), 0);
    let xp = 0; if (Object.keys(daily).length) xp = days.reduce((t, d) => t + (+(daily[d] || {}).x || 0), 0);
    else { const x0 = snapXp(ch.cloudCode, from); if (x0 != null) xp = Math.max(0, (s.xp || 0) - x0); } // старые версии приложения: по снимку на начало периода
    let run = 0, streak10 = 0; days.forEach(d => { run = (+D[d] || 0) >= 10 ? run + 1 : 0; streak10 = Math.max(streak10, run); });
    const active = days.filter(d => (+D[d] || 0) > 0);
    return { tasks, acad, xp, streak10, active };
  }
  function streakNow(s) { const D = s.days || {}; let d = today(), n = 0; if (!D[d]) d = addDays(d, -1); while ((+D[d] || 0) > 0 && n < 400) { n++; d = addDays(d, -1); } return n; }
  const stars = s => Object.entries(s.acad || {}).filter(([k]) => k !== 'teen').reduce((t, [, a]) => t + Object.values((a && a.best) || {}).reduce((x, y) => x + (+y || 0), 0), 0);
  const card = (ch, s = readSave(ch.cloudCode) || {}) => ({ id: ch.id, name: first(ch.name), cat: String(s.name || ch.cat || 'Котик').slice(0, 20), fur: s.fur || 'ginger', wear: s.wear || {} });

  /* ---------- кто кого видит: семья (автоматически) и одобренные друзья ---------- */
  const famKids = ch => ((A.families[ch.familyId] || {}).children || []).map(id => A.children[id]).filter(Boolean);
  function friendKids(ch) { const m = byCode(), fam = new Set(famKids(ch).map(c => c.id)); return [...new Set(friendCodes(ch.cloudCode) || [])].map(c => m.get(c)).filter(c => c && !fam.has(c.id)); }
  const related = (ch, id) => id !== ch.id && (famKids(ch).some(c => c.id === id) || friendKids(ch).some(c => c.id === id));
  function people(ch) { return { family: famKids(ch).filter(c => c.id !== ch.id).map(c => card(c)), friends: friendKids(ch).map(c => card(c)) }; }

  /* ---------- таблица успехов за неделю ---------- */
  function row(ch, me, from, to) {
    const s = readSave(ch.cloudCode) || {}, m = metrics(ch, from, to, s), sch = (s.read || {}).schulte || {};
    const wins = Object.values(A.duels).filter(d => d.done && d.winner === ch.id && dk(d.doneAt || 0) >= from).length;
    return { ...card(ch, s), me: ch.id === me, xp: m.xp, tasks: m.tasks, streak: streakNow(s), schulte: { 3: sch[3] || null, 4: sch[4] || null, 5: sch[5] || null }, stars: stars(s), wins };
  }
  const sortRows = L => L.sort((a, b) => b.xp - a.xp || b.tasks - a.tasks).map((r, i) => ({ ...r, place: i + 1 }));
  function board(ch) {
    const from = weekStart(), to = today();
    return { from, to, family: sortRows(famKids(ch).map(c => row(c, ch.id, from, to))), friends: sortRows([ch, ...friendKids(ch)].map(c => row(c, ch.id, from, to))) };
  }
  const famBoard = f => { const from = weekStart(), to = today(); return { from, to, rows: sortRows((f.children || []).map(id => A.children[id]).filter(Boolean).map(c => row(c, null, from, to))) }; };

  /* ---------- вызовы ---------- */
  const DUEL_EXP = 7 * 864e5;
  const cleanNum = (v, max, dec = 0) => { const x = Math.max(0, Math.min(max, +v || 0)); return dec ? Math.round(x * 10 ** dec) / 10 ** dec : Math.round(x); };
  function better(d, a, b) { // 1 — a лучше, -1 — b лучше, 0 — ничья
    if (DUEL_GAMES[d.game].lower) { const x = a.time + a.errs, y = b.time + b.errs; return x < y ? 1 : x > y ? -1 : 0; }
    if (a.score !== b.score) return a.score > b.score ? 1 : -1;
    if (d.game === 'paws') return a.errs < b.errs ? 1 : a.errs > b.errs ? -1 : 0;
    return a.time < b.time ? 1 : a.time > b.time ? -1 : 0;
  }
  function duelView(d, me) {
    const other = d.from === me ? d.to : d.from, o = A.children[other], mine = d.r[me] || null, theirs = d.r[other] || null;
    return { id: d.id, game: d.game, gameName: DUEL_GAMES[d.game].name, icon: DUEL_GAMES[d.game].icon, topic: d.topic || '', seed: d.seed, created: d.created, exp: d.exp, iStarted: d.from === me,
      other: o ? card(o) : { id: other, name: '—', cat: 'Котик', fur: 'ginger', wear: {} }, mine, theirs, done: !!d.done, result: d.done ? (d.winner === me ? 'win' : d.winner ? 'lose' : 'draw') : null, claimed: !!(d.claimed || {})[me] };
  }
  function duelList(ch) {
    const t = now(), mine = Object.values(A.duels).filter(d => d.from === ch.id || d.to === ch.id).sort((a, b) => b.created - a.created);
    const incoming = mine.filter(d => !d.done && d.to === ch.id && d.r[d.from] && !d.r[ch.id] && d.exp > t);
    const waiting = mine.filter(d => !d.done && d.r[ch.id] && d.exp > t);
    const done = mine.filter(d => d.done).slice(0, 20);
    return { incoming: incoming.map(d => duelView(d, ch.id)), waiting: waiting.map(d => duelView(d, ch.id)), done: done.map(d => duelView(d, ch.id)), unclaimed: done.filter(d => !(d.claimed || {})[ch.id]).length };
  }
  setInterval(() => { const t = now(); for (const [k, d] of Object.entries(A.duels)) if ((!d.done && (d.exp < t || (!d.r[d.from] && t - d.created > 864e5))) || t - d.created > 60 * 864e5) { delete A.duels[k]; touch(); } }, 36e5);

  /* ---------- челленджи ---------- */
  function chalMembers(c) { if (c.kind === 'family') return ((A.families[c.fam] || {}).children || []).map(id => A.children[id]).filter(Boolean); return (c.members || []).map(id => A.children[id]).filter(Boolean); }
  function chalView(c, me) {
    const T = CHAL_TPL[c.tpl], to = today() < c.end ? today() : c.end, mem = chalMembers(c);
    const vals = mem.map(ch => { const m = metrics(ch, c.start, to); return { ch, v: T.metric === 'activeDays' ? m.active : m[T.metric] }; });
    let progress, members;
    if (T.metric === 'activeDays') { const u = new Set(); vals.forEach(x => x.v.forEach(d => u.add(d))); progress = u.size; members = vals.map(x => ({ ...card(x.ch), me: x.ch.id === me, value: x.v.length })); }
    else { members = vals.map(x => ({ ...card(x.ch), me: x.ch.id === me, value: x.v })); progress = T.kind === 'friends' && T.mode === 'race' ? ((members.find(x => x.me) || {}).value || 0) : members.reduce((t, x) => t + x.value, 0); }
    if (T.mode === 'race') { members.sort((a, b) => b.value - a.value); c.reached = c.reached || {}; members.forEach(x => { if (x.value >= T.goal && !c.reached[x.id]) { c.reached[x.id] = now(); touch(); } }); }
    const complete = progress >= T.goal, isMember = mem.some(x => x.id === me), ended = today() > c.end;
    const firstId = T.mode === 'race' ? Object.entries(c.reached || {}).sort((a, b) => a[1] - b[1]).map(x => x[0])[0] : null;
    return { id: c.id, tpl: c.tpl, kind: T.kind, mode: T.mode || '', icon: T.icon, name: T.name, goal: T.goal, metric: T.metric, start: c.start, end: c.end, daysLeft: ended ? 0 : range(today(), c.end).length,
      progress: Math.min(progress, T.goal * 10), members: T.kind === 'solo' ? [] : members, complete, ended, reward: T.reward, claimable: complete && isMember && !(c.claimed || {})[me], claimed: !!(c.claimed || {})[me], first: firstId === me };
  }
  const chalsOf = ch => Object.values(A.chals).filter(c => (c.kind === 'family' ? c.fam === ch.familyId : (c.members || []).includes(ch.id)));
  const isActive = c => today() <= c.end;
  function chalList(ch) {
    const L = chalsOf(ch).sort((a, b) => (b.start > a.start ? 1 : -1)), views = L.map(c => chalView(c, ch.id));
    const templates = Object.entries(CHAL_TPL).filter(([, t]) => t.kind !== 'family').map(([id, t]) => ({ id, ...t }));
    return { templates, active: views.filter(v => !v.ended || v.claimable), past: views.filter(v => v.ended && !v.claimable).slice(0, 10), claimable: views.filter(v => v.claimable).length };
  }
  setInterval(() => { const cut = addDays(today(), -30); for (const [k, c] of Object.entries(A.chals)) if (c.end < cut) { delete A.chals[k]; touch(); } }, 36e5);
  const newChal = (tpl, extra) => { const T = CHAL_TPL[tpl], id = 'H' + rnd(9), start = today(); A.chals[id] = { id, tpl, kind: T.kind, start, end: addDays(start, T.days - 1), created: now(), claimed: {}, ...extra }; touch(); return A.chals[id]; };

  /* ---------- API ребёнка (токен ребёнка) ---------- */
  async function child(r, req, d, s, ok, bad) {
    const ch = A.children[s.c]; if (!ch) return bad(401, 'auth');
    if (r === 'social/board') return ok(board(ch));
    if (r === 'social/people') return ok({ ...people(ch), games: DUEL_GAMES });
    if (r === 'social/news') { const dl = duelList(ch), cl = chalList(ch); return ok({ incoming: dl.incoming, unclaimedDuels: dl.unclaimed, claimableChals: cl.claimable }); }
    if (r === 'duel/list') return ok(duelList(ch));
    if (r === 'duel/new') {
      const to = String(d.to || ''), game = String(d.game || ''), topic = String(d.topic || '').replace(/[^a-z0-9_]/gi, '').slice(0, 30);
      if (!DUEL_GAMES[game] || (game === 'topic' && !topic)) return bad(400, 'game');
      if (!related(ch, to)) return bad(403, 'notfriend');
      if (Object.values(A.duels).filter(x => x.from === ch.id && now() - x.created < 864e5).length >= 15) return bad(429, 'many');
      const id = 'D' + rnd(9); A.duels[id] = { id, from: ch.id, to, game, topic: game === 'topic' ? topic : '', seed: randomInt(1, 2 ** 31 - 1), created: now(), exp: now() + DUEL_EXP, r: {}, claimed: {} }; touch();
      return ok({ duel: duelView(A.duels[id], ch.id) });
    }
    let m = r.match(/^duel\/(D[A-Z0-9]{9})(?:\/(result|claim))?$/);
    if (m) {
      const du = A.duels[m[1]]; if (!du || (du.from !== ch.id && du.to !== ch.id)) return bad(404, 'nf');
      if (!m[2]) return ok({ duel: duelView(du, ch.id) });
      if (m[2] === 'result') {
        if (du.r[ch.id]) return bad(400, 'played'); if (du.exp < now()) return bad(400, 'expired');
        if (du.to === ch.id && !du.r[du.from]) return bad(400, 'early');
        du.r[ch.id] = { score: cleanNum(d.score, 500), time: cleanNum(d.time, 3600, 1), errs: cleanNum(d.errs, 999), at: now() };
        const other = du.from === ch.id ? du.to : du.from;
        if (du.r[other]) { const w = better(du, du.r[ch.id], du.r[other]); du.done = true; du.doneAt = now(); du.winner = w > 0 ? ch.id : w < 0 ? other : null; }
        touch(); return ok({ duel: duelView(du, ch.id) });
      }
      if (!du.done) return bad(400, 'notdone'); if ((du.claimed = du.claimed || {})[ch.id]) return bad(400, 'claimed');
      du.claimed[ch.id] = true; touch();
      return ok({ candies: du.winner === ch.id ? 15 : du.winner ? 3 : 8 });
    }
    if (r === 'chal/list') return ok(chalList(ch));
    if (r === 'chal/start') {
      const T = CHAL_TPL[d.tpl]; if (!T || T.kind === 'family') return bad(400, 'tpl');
      const mine = chalsOf(ch).filter(isActive);
      if (T.kind === 'solo') { if (mine.some(c => c.tpl === d.tpl)) return bad(400, 'dup'); if (mine.filter(c => c.kind === 'solo').length >= 3) return bad(400, 'many'); return ok({ chal: chalView(newChal(d.tpl, { members: [ch.id], by: ch.id }), ch.id) }); }
      const withIds = [...new Set((Array.isArray(d.with) ? d.with : []).map(String))].slice(0, 8).filter(id => related(ch, id));
      if (!withIds.length) return bad(400, 'with');
      if (mine.filter(c => c.kind === 'friends' && c.by === ch.id).length >= 2) return bad(400, 'many');
      return ok({ chal: chalView(newChal(d.tpl, { members: [ch.id, ...withIds], by: ch.id }), ch.id) });
    }
    m = r.match(/^chal\/(H[A-Z0-9]{9})\/claim$/);
    if (m) {
      const c = A.chals[m[1]]; if (!c || !chalMembers(c).some(x => x.id === ch.id)) return bad(404, 'nf');
      const v = chalView(c, ch.id); if (!v.claimable) return bad(400, v.claimed ? 'claimed' : 'notdone');
      (c.claimed = c.claimed || {})[ch.id] = true; touch(); const R = CHAL_TPL[c.tpl].reward;
      return ok({ candies: R.candies, gems: R.gems + (v.first ? 1 : 0), badge: R.badge, name: CHAL_TPL[c.tpl].name });
    }
    return null;
  }

  /* ---------- API родителя (токен взрослого семьи) ---------- */
  async function parent(r, req, d, f, ok, bad) {
    if (r === 'fam/social') {
      const kids = (f.children || []).map(id => A.children[id]).filter(Boolean), ids = new Set(kids.map(k => k.id));
      const chals = Object.values(A.chals).filter(c => (c.kind === 'family' ? c.fam === f.id : (c.members || []).some(id => ids.has(id))) && isActive(c)).map(c => ({ ...chalView(c, null), by: c.kind === 'family' ? 'parent' : 'kid' }));
      const wk = weekStart(), duels = Object.values(A.duels).filter(x => x.done && (ids.has(x.from) || ids.has(x.to)) && dk(x.doneAt || 0) >= wk).length;
      return ok({ board: famBoard(f), chals, duelsWeek: duels, templates: Object.entries(CHAL_TPL).filter(([, t]) => t.kind === 'family').map(([id, t]) => ({ id, ...t })) });
    }
    if (r === 'fam/chal') {
      const T = CHAL_TPL[d.tpl]; if (!T || T.kind !== 'family') return bad(400, 'tpl');
      const act = Object.values(A.chals).filter(c => c.kind === 'family' && c.fam === f.id && isActive(c));
      if (act.some(c => c.tpl === d.tpl)) return bad(400, 'dup'); if (act.length >= 3) return bad(400, 'many');
      return ok({ chal: chalView(newChal(d.tpl, { fam: f.id, by: 'parent' }), null) });
    }
    const m = r.match(/^fam\/chal\/(H[A-Z0-9]{9})\/remove$/);
    if (m) { const c = A.chals[m[1]]; if (!c || c.kind !== 'family' || c.fam !== f.id) return bad(404, 'nf'); delete A.chals[m[1]]; touch(); return ok({ ok: true }); }
    return null;
  }

  function stats() {
    const wk = weekStart(), D = Object.values(A.duels);
    return { multiAdultFamilies: Object.values(A.families).filter(f => (f.parents || []).length > 1).length, duelsPlayed: D.filter(x => x.done).length, duelsWeek: D.filter(x => x.done && dk(x.doneAt || 0) >= wk).length, duelsOpen: D.filter(x => !x.done).length, challengesActive: Object.values(A.chals).filter(isActive).length };
  }
  function forgetChild(id) { for (const [k, d] of Object.entries(A.duels)) if (d.from === id || d.to === id) delete A.duels[k]; for (const [k, c] of Object.entries(A.chals)) if (c.members) { c.members = c.members.filter(x => x !== id); if (!c.members.length) delete A.chals[k]; } touch(); }
  function forgetFamily(fid) { for (const [k, c] of Object.entries(A.chals)) if (c.fam === fid) delete A.chals[k]; touch(); }
  return { child, parent, stats, board, famBoard, metrics, people, forgetChild, forgetFamily, weekStart, today };
}
