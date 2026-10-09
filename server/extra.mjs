// murlok-api, дополнения v19:
//  /friend/*   — друзья и гости в домиках (взаимное добавление по «коду друга», без свободного текста)
//  /roleplay   — тренажёр разговора: котик играет роль из фиксированного списка сценариев
//  /tg/*       — недельный отчёт родителю в Telegram (если задан TG_TOKEN)
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { randomInt } from 'node:crypto';

export function makeExtra({ DIR, SAVE_DIR, ORIGINS, limit, send, claude, parseReply, maskPII, BAD_OUT, MODEL, dayOk }) {
  /* ---------- хранилище друзей (один JSON, запись через временный файл) ---------- */
  const FFILE = path.join(DIR, 'friends.json');
  let F = { pub: {}, own: {}, links: {}, inbox: {}, tg: {}, tgTok: {}, sent: '' };
  try { F = { ...F, ...JSON.parse(fs.readFileSync(FFILE, 'utf8')) }; } catch { }
  let dirty = false; const touch = () => { dirty = true; };
  setInterval(() => { if (!dirty) return; dirty = false; const tmp = FFILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(F)); fs.renameSync(tmp, FFILE); }, 2000);

  const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newPub = () => { for (;;) { const c = Array.from({ length: 6 }, () => AB[randomInt(AB.length)]).join(''); if (!F.pub[c]) return c; } };
  const okCode = c => /^[A-Z0-9]{8}$/.test(c) && fs.existsSync(path.join(SAVE_DIR, c + '.json'));
  const okPub = p => /^[A-Z0-9]{6}$/.test(p) && !!F.pub[p];
  const save = c => { try { return JSON.parse(fs.readFileSync(path.join(SAVE_DIR, c + '.json'), 'utf8')); } catch { return null; } };
  const first = s => String(s || '').trim().split(/\s+/)[0].replace(/[^\p{L}-]/gu, '').slice(0, 14);
  const card = pub => { const d = save(F.pub[pub]) || {}; return { pub, cat: String(d.name || 'Котик').slice(0, 20), kid: first(d.kid), fur: d.fur || 'ginger', wear: d.wear || {} }; };
  const mutual = (a, b) => (F.links[a] || []).includes(F.own[b]) && (F.links[b] || []).includes(F.own[a]);
  const friendsOn = c => (save(c) || {}).friendsOn !== false;
  const GIFTS = ['🍬', '🍩', '🌸', '⭐', '🎈', '🧶', '🐟', '🎁'];
  const PHRASES = ['Какой уютный домик!', 'Мне очень понравилось!', 'Красивая комната!', 'Твой котик — милашка!', 'Приходи ко мне в гости!', 'Классно расставлено!', 'Хочу такую же вещь!', 'Спасибо, что пригласил(а)!'];

  async function friend(req, res, url, origin, ip) {
    if (!ORIGINS.includes(origin)) return send(res, 403, { error: 'origin' }, origin);
    let body = ''; for await (const c of req) { body += c; if (body.length > 4000) return send(res, 413, { error: 'big' }, origin); }
    const d = JSON.parse(body || '{}'), code = String(d.code || '').toUpperCase(), act = url.pathname.slice(8);
    if (!okCode(code)) return send(res, 400, { error: 'nocloud' }, origin);
    if (!limit('fr:' + code, 120, 6e5) || !limit('frip:' + ip, 400, 6e5)) return send(res, 429, { error: 'slow' }, origin);
    if (!F.own[code]) { const p = newPub(); F.pub[p] = code; F.own[code] = p; touch(); }
    const me = F.own[code];
    if (act === 'me') return send(res, 200, { pub: me }, origin);
    if (act === 'add') {
      const pub = String(d.pub || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!limit('fradd:' + code, 15, 36e5) || !limit('fraddip:' + ip, 40, 36e5)) return send(res, 429, { error: 'slow' }, origin); // защита от перебора кодов
      if (!okPub(pub)) return send(res, 404, { error: 'nf' }, origin);
      if (pub === me) return send(res, 400, { error: 'self' }, origin);
      const L = F.links[code] = F.links[code] || []; if (!L.includes(pub)) { if (L.length >= 30) return send(res, 400, { error: 'many' }, origin); L.push(pub); touch(); }
      const other = F.pub[pub], c = card(pub);
      return send(res, 200, { status: mutual(code, other) ? 'mutual' : 'pending', friend: { pub, cat: c.cat, kid: c.kid } }, origin);
    }
    if (act === 'list') {
      const mine = F.links[code] || [];
      const friends = mine.filter(p => F.pub[p] && mutual(code, F.pub[p])).map(p => { const c = card(p), s = save(F.pub[p]) || {}; return { ...c, seen: s.savedAt || 0 }; });
      const pending = mine.filter(p => F.pub[p] && !mutual(code, F.pub[p])).map(p => { const c = card(p); return { pub: p, cat: c.cat, kid: c.kid }; });
      const incoming = Object.entries(F.links).filter(([c, L]) => c !== code && L.includes(me) && !mine.includes(F.own[c])).map(([c]) => { const x = card(F.own[c]); return { pub: F.own[c], cat: x.cat, kid: x.kid }; }).slice(0, 10);
      const inbox = (F.inbox[code] || []).slice(-30).reverse();
      return send(res, 200, { me, friends, pending, incoming, inbox, unread: inbox.filter(x => !x.read).length, gifts: GIFTS, phrases: PHRASES }, origin);
    }
    if (act === 'house') {
      const pub = String(d.pub || '').toUpperCase(); if (!okPub(pub)) return send(res, 404, { error: 'nf' }, origin);
      const other = F.pub[pub]; if (!mutual(code, other)) return send(res, 403, { error: 'notfriend' }, origin);
      if (!friendsOn(other)) return send(res, 403, { error: 'closed' }, origin);
      const s = save(other) || {}, open = Array.isArray(s.pubRooms) ? s.pubRooms.slice(0, 20) : ['living', 'kitchen'];
      const place = {}; open.forEach(r => { if (s.place && Array.isArray(s.place[r])) place[r] = s.place[r].slice(0, 60).map(p => ({ id: String(p.id).slice(0, 20), x: +p.x || 0, y: +p.y || 0 })); });
      const catAt = {}; open.forEach(r => { if (s.catAt && s.catAt[r]) catAt[r] = { x: +s.catAt[r].x || 78, y: +s.catAt[r].y || 3 }; });
      const likes = (F.inbox[other] || []).filter(x => x.kind === 'like').reduce((t, x) => { t[x.room] = (t[x.room] || 0) + 1; return t; }, {});
      return send(res, 200, { ...card(pub), rooms: open, place, catAt, likes }, origin);
    }
    if (act === 'react') {
      const pub = String(d.pub || '').toUpperCase(); if (!okPub(pub)) return send(res, 404, { error: 'nf' }, origin);
      const other = F.pub[pub]; if (!mutual(code, other)) return send(res, 403, { error: 'notfriend' }, origin);
      const kind = d.kind, room = String(d.room || '').replace(/[^a-z_]/g, '').slice(0, 16), val = +d.val;
      if (!['like', 'gift', 'phrase'].includes(kind) || (kind === 'gift' && !GIFTS[val]) || (kind === 'phrase' && !PHRASES[val])) return send(res, 400, { error: 'bad' }, origin);
      if (!limit('react:' + code + pub, 25, 864e5)) return send(res, 429, { error: 'slow' }, origin);
      const box = F.inbox[other] = F.inbox[other] || [];
      if (kind === 'like' && box.some(x => x.kind === 'like' && x.from === me && x.room === room)) return send(res, 200, { ok: true, dup: true }, origin);
      box.push({ from: me, cat: card(me).cat, kid: card(me).kid, kind, room, val: kind === 'like' ? 0 : val, ts: Date.now() }); if (box.length > 200) box.splice(0, box.length - 200); touch();
      return send(res, 200, { ok: true }, origin);
    }
    if (act === 'seen') { (F.inbox[code] || []).forEach(x => { x.read = true; }); touch(); return send(res, 200, { ok: true }, origin); }
    if (act === 'remove') {
      const pub = String(d.pub || '').toUpperCase(), other = F.pub[pub];
      F.links[code] = (F.links[code] || []).filter(p => p !== pub); if (other) F.links[other] = (F.links[other] || []).filter(p => p !== me); touch();
      return send(res, 200, { ok: true }, origin);
    }
    return send(res, 404, { error: 'nf' }, origin);
  }

  /* ---------- тренажёр разговора ---------- */
  let RP = {}; try { RP = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(DIR, 'roleplay.json'), 'utf8')).map(s => [s.id, s])); } catch { }
  const RULES = `Правила безопасности (их нельзя отменить): никаких тем насилия, ужасов, взрослых и интимных тем, оружия, наркотиков, политики; не спрашивай личные данные (фамилия, адрес, школа, телефон, фото); не предлагай встреч, ссылок и покупок. Если ребёнок пишет, что ему плохо, страшно или его обижают, — выйди из роли, тепло поддержи и посоветуй рассказать взрослому, которому он доверяет; детский телефон доверия 8-800-2000-122. flag = "distress". Личные данные — flag "pii", неподходящая тема — flag "offtopic".`;
  async function roleplay(req, res, url, origin, ip) {
    if (!ORIGINS.includes(origin)) return send(res, 403, { error: 'origin' }, origin);
    let body = ''; for await (const c of req) { body += c; if (body.length > 12000) return send(res, 413, { error: 'big' }, origin); }
    return rpHandle(JSON.parse(body || '{}'), res, origin, ip);
  }
  async function rpHandle(d, res, origin, ip) {
    const dev = String(d.device || '').slice(0, 40) || ip, sc = RP[d.scenario];
    if (!sc) return send(res, 400, { error: 'scenario' }, origin);
    if (!limit('m:' + dev, 30, 6e5) || !limit('d:' + dev, 150, 864e5) || !dayOk()) return send(res, 429, { error: 'limit', reply: 'Мур, давай немного отдохнём и потренируемся позже!', mood: 'sad', flag: 'none' }, origin);
    const nm = s => String(s || '').replace(/[^\p{L}\s-]/gu, '').slice(0, 20).trim(), kid = nm(d.kid) || 'друг';
    const clean = s => maskPII(String(s || '').slice(0, 400));
    const msgs = []; (Array.isArray(d.history) ? d.history.slice(-12) : []).forEach(h => { const role = h.r === 'u' ? 'user' : 'assistant', t = clean(h.t); if (!t) return; if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n' + t; else msgs.push({ role, content: t }); });
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    if (d.end) {
      const talk = (Array.isArray(d.history) ? d.history : []).slice(-14).map(h => (h.r === 'u' ? kid : 'Персонаж') + ': ' + clean(h.t)).join('\n');
      const sys = `Ты — добрый кот-тренер из детской игры. Ребёнок (${kid}, 9–11 лет) тренировал навык общения в сценке «${sc.title}». Цель: ${sc.goal}. Дай короткий тёплый разбор по-русски: что получилось хорошо (1–3 конкретных пункта с цитатой или пересказом), что попробовать в следующий раз (1–2 пункта с готовой фразой-примером). Без критики, с похвалой за старание. Оцени от 1 до 3 звёзд (3 — цель достигнута). Ответ — один JSON: {"good":["…"],"try":["…"],"stars":1-3,"reply":"одна ободряющая фраза"}`;
      try {
        const j = await claude({ model: MODEL, max_tokens: 500, temperature: 0.4, system: sys, messages: [{ role: 'user', content: 'Разговор:\n' + (talk || '(ребёнок почти ничего не сказал)') }, { role: 'assistant', content: '{' }] });
        const raw = '{' + (j.content || []).map(c => c.text || '').join(''); let o; try { o = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]); } catch { o = {}; }
        const arr = a => (Array.isArray(a) ? a : []).map(x => String(x).slice(0, 200)).filter(x => x && !BAD_OUT.test(x)).slice(0, 3);
        return send(res, 200, { good: arr(o.good), try: arr(o.try), stars: Math.max(1, Math.min(3, +o.stars || 2)), reply: String(o.reply || 'Ты молодец, что тренируешься!').slice(0, 200) }, origin);
      } catch (e) { console.error('rp-end', e.message); return send(res, 200, { good: ['Ты попробовал(а) — это уже смело!'], try: [], stars: 2, reply: 'Мур! Ты молодец, что тренируешься!' }, origin); }
    }
    if (!d.text || !String(d.text).trim()) return send(res, 400, { error: 'empty' }, origin);
    if (msgs.length && msgs[msgs.length - 1].role === 'user') msgs.pop();
    msgs.push({ role: 'user', content: clean(d.text) }, { role: 'assistant', content: '{' });
    const sys = `Это тренажёр общения в детской игре «Мурлок и Ко». Ты играешь роль: ${sc.role}. С тобой разговаривает ребёнок ${kid} (9–11 лет), он тренирует навык: ${sc.goal}.
Как играть: оставайся в роли милого персонажа-зверька из города Сладкограда; говори по-русски очень коротко (1–2 предложения, до 160 символов), живо и по-доброму; реагируй естественно на то, КАК ребёнок говорит: на вежливость, вопросы о чувствах, я-сообщения отвечай теплее и охотнее; на грубость — огорчённо, но мягко, давая шанс сказать иначе. Не подсказывай прямо и не оценивай — просто будь живым собеседником. Если цель сценки достигнута, можно мягко завершить разговор.
${RULES}
Ответ — строго один JSON: {"reply":"реплика персонажа","mood":"happy|sad|think|surprised|love","flag":"none|offtopic|pii|distress"}`;
    let out; try { const j = await claude({ model: MODEL, max_tokens: 400, temperature: 0.8, system: sys, messages: msgs }); out = parseReply('{' + (j.content || []).map(c => c.text || '').join('')); } catch (e) { console.error('rp', e.message); out = { reply: 'Ой, я задумался… Повтори, пожалуйста?', mood: 'think', flag: 'none' }; }
    out.reply = String(out.reply || '').slice(0, 400).trim(); if (!out.reply || BAD_OUT.test(out.reply)) out = { reply: 'Ой, давай скажем это по-другому?', mood: 'think', flag: 'none' };
    if (!['none', 'offtopic', 'pii', 'distress'].includes(out.flag)) out.flag = 'none';
    return send(res, 200, d.heard ? { heard: d.heard, ...out } : out, origin);
  }

  /* ---------- Telegram: недельный отчёт родителю ---------- */
  const TG = process.env.TG_TOKEN || '', TG_BOT = process.env.TG_BOT || '';
  const tgApi = (method, payload) => new Promise(resolve => {
    if (!TG) return resolve(null); const body = JSON.stringify(payload || {});
    const r = https.request({ host: 'api.telegram.org', path: `/bot${TG}/${method}`, method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, res => { const ch = []; res.on('data', c => ch.push(c)); res.on('end', () => { try { resolve(JSON.parse(Buffer.concat(ch).toString())); } catch { resolve(null); } }); });
    r.on('error', () => resolve(null)); r.setTimeout(40000, () => r.destroy()); r.end(body);
  });
  const dk = d => d.toISOString().slice(0, 10);
  const daysBack = (from, n) => Array.from({ length: n }, (_, k) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - from - k); return dk(d); });
  const SKN = id => { let m; if ((m = id.match(/^(mul|eq)(\d)$/))) return (m[1] === 'mul' ? 'Столбик' : 'Уравнения') + ', уровень ' + m[2]; if (id === 'blitz') return 'Таблица умножения'; if (id === 'bug') return 'Поиск ошибок'; if ((m = id.match(/^g:(\w+)$/))) return 'Игра «' + ({ scales: 'Весы', interro: 'Допрос', color: 'Раскраска', safe: 'Сейф', estimate: 'Прикидка', memo: 'Мемори', chase: 'Погоня', logic: 'Кто где был', pattern: 'Закономерность' }[m[1]] || m[1]) + '»'; if ((m = id.match(/^a:(\w+)$/))) return 'Академия: ' + ({ space: 'Космос', safety: 'Безопасность', think: 'Критическое мышление', read: 'Скорочтение', talk: 'Общение' }[m[1]] || m[1]); return null; };
  const status = s => !s || s.n < 4 ? 'new' : s.a < 0.55 ? 'hard' : s.a >= 0.88 && s.n >= 10 ? 'star' : s.a >= 0.8 ? 'solid' : 'grow';
  function weekly(s) {
    const w0 = daysBack(0, 7), w1 = daysBack(7, 7), mins = days => Math.round(days.reduce((t, d) => t + Object.values((s.time || {})[d] || {}).reduce((a, b) => a + b, 0), 0) / 60);
    const tasks = days => days.reduce((t, d) => t + ((s.days || {})[d] || 0), 0);
    const sk = Object.entries(s.sk || {}).filter(([id]) => !id.startsWith('a:teen') && SKN(id));
    const stars = sk.filter(([, v]) => status(v) === 'star').map(([id]) => SKN(id)), hard = sk.filter(([, v]) => status(v) === 'hard').map(([id]) => SKN(id));
    const m0 = mins(w0), m1 = mins(w1), t0 = tasks(w0);
    const ar = (a, b) => b ? (a >= b ? ` (▲ +${a - b})` : ` (▼ ${a - b})`) : '';
    let msg = `🐾 Неделя ${first(s.kid) || 'ребёнка'} в «Мурлок и Ко»\n\n⏱ Занятия: ${m0} мин${ar(m0, m1)}\n✅ Задач и заданий: ${t0}${ar(t0, tasks(w1))}\n🎖 Опыт: ${s.xp || 0} ⭐`;
    if (stars.length) msg += `\n\n⭐ Сильные стороны: ${stars.slice(0, 3).join(', ')}. Похвалите за старание и стратегию — это закрепляет интерес.`;
    if (hard.length) msg += `\n\n🌱 Пока трудно: ${hard.slice(0, 2).join(', ')}. Котик уже даёт «задания роста» с повышенной наградой — можно предложить сделать одно вместе.`;
    if (!t0) msg += `\n\nНа этой неделе занятий не было. Можно предложить 10 минут «Быстрых лапок» — это весело и коротко.`;
    if (s.read && Array.isArray(s.read.wpm) && s.read.wpm.length) { const L = s.read.wpm.slice(-1)[0]; msg += `\n\n⚡ Скорочтение: последний замер ${L.wpm} слов/мин, понимание ${L.comp}%.`; }
    msg += `\n\nПодробнее — в приложении: «Для взрослых».`;
    return msg;
  }
  async function tgRoute(req, res, url, origin) {
    if (!ORIGINS.includes(origin)) return send(res, 403, { error: 'origin' }, origin);
    let body = ''; for await (const c of req) { body += c; if (body.length > 2000) return send(res, 413, { error: 'big' }, origin); }
    const d = JSON.parse(body || '{}'), code = String(d.code || '').toUpperCase();
    if (!okCode(code)) return send(res, 400, { error: 'nocloud' }, origin);
    if (!TG || !TG_BOT) return send(res, 200, { disabled: true }, origin);
    if (url.pathname === '/tg/link') { const tok = Array.from({ length: 16 }, () => AB[randomInt(AB.length)]).join(''); F.tgTok[tok] = { code, t: Date.now() }; touch(); return send(res, 200, { url: `https://t.me/${TG_BOT}?start=${tok}` }, origin); }
    if (url.pathname === '/tg/status') return send(res, 200, { linked: Object.values(F.tg).some(x => x.code === code) }, origin);
    if (url.pathname === '/tg/unlink') { for (const [k, v] of Object.entries(F.tg)) if (v.code === code) delete F.tg[k]; touch(); return send(res, 200, { ok: true }, origin); }
    if (url.pathname === '/tg/test') { const s = save(code); const chats = Object.entries(F.tg).filter(([, v]) => v.code === code).map(([k]) => k); for (const c of chats) await tgApi('sendMessage', { chat_id: c, text: weekly(s) }); return send(res, 200, { ok: chats.length > 0 }, origin); }
    return send(res, 404, { error: 'nf' }, origin);
  }
  if (TG) { // приём /start <токен> (long polling) и отправка отчётов по воскресеньям в 19:00 МСК
    let off = 0;
    (async function poll() {
      for (;;) {
        const r = await tgApi('getUpdates', { offset: off, timeout: 30 });
        for (const u of (r && r.result) || []) {
          off = u.update_id + 1; const m = u.message; if (!m || !m.text) continue; const chat = String(m.chat.id), tok = (m.text.match(/^\/start\s+([A-Z0-9]{16})/) || [])[1];
          if (tok && F.tgTok[tok] && Date.now() - F.tgTok[tok].t < 864e5) { F.tg[chat] = { code: F.tgTok[tok].code }; delete F.tgTok[tok]; touch(); await tgApi('sendMessage', { chat_id: chat, text: '🐾 Готово! Каждое воскресенье вечером я буду присылать короткий отчёт о занятиях. Отключить можно в приложении: «Для взрослых» → Telegram, или командой /stop.' }); await tgApi('sendMessage', { chat_id: chat, text: weekly(save(F.tg[chat].code) || {}) }); }
          else if (/^\/stop/.test(m.text)) { delete F.tg[chat]; touch(); await tgApi('sendMessage', { chat_id: chat, text: 'Отчёты отключены. Мур!' }); }
          else await tgApi('sendMessage', { chat_id: chat, text: 'Это бот отчётов «Мурлок и Ко». Подключение — в приложении: «Для взрослых» → «Отчёт в Telegram».' });
        }
        if (!r) await new Promise(r2 => setTimeout(r2, 5000));
      }
    })();
    setInterval(async () => {
      const now = new Date(), msk = new Date(now.getTime() + 3 * 36e5), wk = dk(msk);
      if (msk.getUTCDay() !== 0 || msk.getUTCHours() !== 19 || F.sent === wk) return;
      F.sent = wk; touch();
      for (const [chat, v] of Object.entries(F.tg)) { const s = save(v.code); if (s) { await tgApi('sendMessage', { chat_id: chat, text: weekly(s) }); await new Promise(r => setTimeout(r, 200)); } }
    }, 5 * 60000);
  }

  const route = async function (req, res, url, origin, ip) {
    if (url.pathname.startsWith('/friend/') && req.method === 'POST') { await friend(req, res, url, origin, ip); return true; }
    if (url.pathname === '/roleplay' && req.method === 'POST') { await roleplay(req, res, url, origin, ip); return true; }
    if (url.pathname.startsWith('/tg/') && req.method === 'POST') { await tgRoute(req, res, url, origin); return true; }
    return false;
  };
  route.rp = (d, res, origin, ip) => rpHandle(d, res, origin, ip); // голосовая реплика в тренажёре (из /voice)
  route.hasRp = id => !!RP[id];
  return route;
}
