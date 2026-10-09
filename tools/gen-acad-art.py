"""Картинки для Академии: иллюстрации (FLUX schnell, единый стиль) и настоящие фото (Википедия/Commons, свободные лицензии).
  python tools/gen-acad-art.py photos [subject...]   — скачать фото (быстро, без лимитов)
  python tools/gen-acad-art.py covers [subject...]   — обложки тем
  python tools/gen-acad-art.py cards  [subject...]   — картинки карточек
  python tools/gen-acad-art.py manifest              — собрать content/extra/art.js
Описания — tools/art/prompts-<subject>.json. Готовые файлы не перегенерирует. Провайдеры: Cloudflare → Hugging Face (ZeroGPU);
когда оба лимита исчерпаны, выходит с кодом 2 (запустить снова завтра — продолжит с места остановки)."""
import sys, json, pathlib, time, base64, urllib.request, urllib.parse, os, io
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT / 'tools' / 'art'; OUT = ROOT / 'img' / 'acad'; TMP = ROOT / 'tools' / '.tmp'; TMP.mkdir(exist_ok=True)
CREDITS = ART / 'credits.json'
# тот же стиль, что у сцен дел и вещей домика (tools/gen-anime.py) — вся отрисовка в одном ключе
STYLE = 'cute kawaii anime illustration, Studio Ghibli inspired, soft pastel colors, gentle cel shading, cozy and magical, clean lines, high detail, no text, no letters, no watermark'
W, H = 640, 480  # 4:3 для карточек и обложек
UA = 'MurlokEdu/1.0 (kids learning app; team@tech-wave.ru)'
ORDER = ['world', 'space', 'stories', 'body', 'safety', 'health', 'obzh', 'talk', 'think', 'creative', 'read', 'teen', 'math4']

def specs(subjects):
    for s in (subjects or ORDER):
        f = ART / f'prompts-{s}.json'
        if f.exists(): yield s, json.loads(f.read_text(encoding='utf-8'))

def out_path(subj, key):  # cover:unit → c-unit.webp, unit:i → unit-i.webp
    return OUT / subj / ((('c-' + key.split(':', 1)[1]) if key.startswith('cover:') else key.replace(':', '-')) + '.webp')

def save_webp(src_bytes, out):
    im = Image.open(io.BytesIO(src_bytes)).convert('RGB'); w, h = im.size; r = W / H
    if w / h > r: nw = int(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = int(w / r); top = max(0, int((h - nh) * 0.35)); im = im.crop((0, top, w, top + nh))  # чуть выше центра — лица и головы
    im = im.resize((W, H), Image.LANCZOS); out.parent.mkdir(parents=True, exist_ok=True); im.save(out, 'WEBP', quality=78, method=6)

# ---------- иллюстрации ----------
CF = {}
try:
    for l in pathlib.Path(r'C:\Users\izzye\video-channels\cloudflare.env').read_text(encoding='utf-8-sig').splitlines():
        if '=' in l: k, v = l.strip().split('=', 1); CF[k.strip()] = v.strip()
except Exception: pass
dead = set()
def gen_cf(prompt):
    url = 'https://api.cloudflare.com/client/v4/accounts/' + CF['CF_ACCOUNT_ID'] + '/ai/run/@cf/black-forest-labs/flux-1-schnell'
    for a in range(3):
        try:
            req = urllib.request.Request(url, data=json.dumps({'prompt': prompt[:2000], 'steps': 6}).encode(), headers={'Authorization': 'Bearer ' + CF['CF_API_TOKEN'], 'Content-Type': 'application/json'})
            return base64.b64decode(json.loads(urllib.request.urlopen(req, timeout=120).read())['result']['image'])
        except Exception as e:
            if getattr(e, 'code', 0) == 429 or '429' in str(e) or 'neurons' in str(e).lower(): dead.add('cf'); print('Cloudflare: дневной лимит исчерпан'); return None
            print('retry cf', str(e)[:160]); time.sleep(6 * (a + 1))
    return None
hf_client = None
def gen_hf(prompt):
    global hf_client
    try:
        from gradio_client import Client
        if hf_client is None:
            tok = pathlib.Path(r'C:\Users\izzye\video-channels\hf.env').read_text(encoding='utf-8').split('=', 1)[1].strip()
            hf_client = Client('black-forest-labs/FLUX.1-schnell', token=tok, verbose=False)
        res = hf_client.predict(prompt=prompt, seed=7, randomize_seed=True, width=1024, height=768, num_inference_steps=4, api_name='/infer')
        src = res[0] if isinstance(res, (list, tuple)) else res; src = src['path'] if isinstance(src, dict) else src
        return pathlib.Path(src).read_bytes()
    except Exception as e:
        m = str(e)
        if 'quota' in m.lower() or 'exceeded' in m.lower(): dead.add('hf'); print('Hugging Face: лимит GPU исчерпан')
        else: print('hf error', m[:160])
        return None
def gen(prompt):
    for name, f in (('cf', gen_cf), ('hf', gen_hf)):
        if name in dead: continue
        b = f(prompt)
        if b: return b
    return None

def run_art(kind, subjects):
    n = 0
    for subj, sp in specs(subjects):
        for key, v in sp.items():
            if v.get('type') != 'art' or (kind == 'covers') != key.startswith('cover:'): continue
            out = out_path(subj, key)
            if out.exists(): continue
            if len(dead) == 2: print('Оба лимита исчерпаны — продолжим завтра. Сделано сейчас:', n); manifest(); sys.exit(2)
            b = gen(f"{v['p']}, {STYLE}")
            if b: save_webp(b, out); n += 1; print('ok', out.relative_to(ROOT), flush=True)
            elif len(dead) < 2: print('FAIL', key)
    print('готово', n); manifest()

# ---------- фото ----------
def jget(url):
    return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40).read())
def strip_html(s):
    import re; return re.sub(r'<[^>]+>', '', s or '').strip()
def find_photo(q):
    api = 'https://ru.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'titles': q, 'redirects': 1, 'prop': 'pageimages', 'piprop': 'name', 'pilicense': 'free'})
    pages = jget(api)['query'].get('pages', {})
    name = next((p.get('pageimage') for p in pages.values() if p.get('pageimage')), None)
    if not name:  # нет точной статьи — поиск
        r = jget('https://ru.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q, 'gsrlimit': 1, 'prop': 'pageimages', 'piprop': 'name', 'pilicense': 'free'}))
        name = next((p.get('pageimage') for p in r.get('query', {}).get('pages', {}).values() if p.get('pageimage')), None)
    if not name or name.lower().endswith(('.svg', '.gif', '.tif', '.tiff')): return None
    ii = jget('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'titles': 'File:' + name, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 1000}))
    p = next(iter(ii['query']['pages'].values())); info = (p.get('imageinfo') or [None])[0]
    if not info: return None
    md = info.get('extmetadata', {}); lic = strip_html(md.get('LicenseShortName', {}).get('value', ''))
    if not lic or 'fair' in lic.lower() or 'non-free' in lic.lower(): return None
    return {'url': info.get('thumburl') or info['url'], 'author': strip_html(md.get('Artist', {}).get('value', ''))[:80] or 'Wikimedia Commons', 'lic': lic, 'page': info.get('descriptionurl', '')}
def run_photos(subjects):
    cr = json.loads(CREDITS.read_text(encoding='utf-8')) if CREDITS.exists() else {}; n = miss = 0
    for subj, sp in specs(subjects):
        for key, v in sp.items():
            if v.get('type') != 'photo': continue
            out = out_path(subj, key); ck = f'{subj}/{key}'
            if out.exists() and ck in cr: continue
            try:
                ph = find_photo(v['q'])
                if not ph: miss += 1; print('нет фото', v['q']); continue
                data = urllib.request.urlopen(urllib.request.Request(ph['url'], headers={'User-Agent': UA}), timeout=60).read()
                save_webp(data, out); cr[ck] = {'alt': v.get('alt', v['q']), 'author': ph['author'], 'lic': ph['lic'], 'page': ph['page'], 'q': v['q']}; n += 1
                print('ok', ck, '←', v['q'], flush=True); time.sleep(0.4)
            except Exception as e: miss += 1; print('ошибка', v['q'], str(e)[:120])
        CREDITS.write_text(json.dumps(cr, ensure_ascii=False, indent=1), encoding='utf-8')
    print('фото:', n, 'не найдено:', miss); manifest()

# ---------- манифест для приложения ----------
def manifest():
    cr = json.loads(CREDITS.read_text(encoding='utf-8')) if CREDITS.exists() else {}
    art = {}
    for subj, sp in specs(None):
        for key, v in sp.items():
            out = out_path(subj, key)
            if not out.exists(): continue
            e = {'f': str(out.relative_to(ROOT)).replace('\\', '/')}
            c = cr.get(f'{subj}/{key}')
            if v.get('type') == 'photo' and c: e.update({'alt': c['alt'], 'cr': f"Фото: {c['author']} · {c['lic']} · Wikimedia Commons"})
            elif v.get('type') == 'photo': continue
            art[f'{subj}/{key}'] = e
    js = '/* создаётся tools/gen-acad-art.py manifest — картинки и фото Академии (иллюстрации FLUX, фото Wikimedia Commons со свободными лицензиями) */\nwindow.ACAD_ART = ' + json.dumps(art, ensure_ascii=False, separators=(',', ':')) + ';\n'
    (ROOT / 'content' / 'extra' / 'art.js').write_text(js, encoding='utf-8'); print('манифест:', len(art), 'картинок')

if __name__ == '__main__':
    cmd, rest = (sys.argv[1] if len(sys.argv) > 1 else 'manifest'), sys.argv[2:]
    if cmd == 'photos': run_photos(rest)
    elif cmd in ('covers', 'cards'): run_art(cmd, rest)
    else: manifest()
