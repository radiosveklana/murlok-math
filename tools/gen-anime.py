"""Аниме-иллюстрации для «Мурлок и Ко» через FLUX.1-schnell (Hugging Face, токен из hf.env проекта video-channels).
  python tools/gen-anime.py test            — одна пробная картинка
  python tools/gen-anime.py scenes|rooms|items|all
Готовые файлы не перегенерирует."""
import sys, json, pathlib, shutil, time, base64, urllib.request, os
from gradio_client import Client
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOK = pathlib.Path(r'C:\Users\izzye\video-channels\hf.env').read_text(encoding='utf-8').split('=', 1)[1].strip()
STYLE = 'cute kawaii anime illustration, Studio Ghibli inspired, soft pastel colors, gentle cel shading, cozy and magical, clean lines, high detail, no text, no letters, no watermark'
client = None
def cli():
    global client
    if client is None: client = Client('black-forest-labs/FLUX.1-schnell', token=TOK, verbose=False)
    return client

CF = {}
for _l in pathlib.Path(r'C:\Users\izzye\video-channels\cloudflare.env').read_text(encoding='utf-8-sig').splitlines():
    if '=' in _l: k, v = _l.strip().split('=', 1); CF[k.strip()] = v.strip()
TMP = ROOT / 'tools' / '.tmp'; TMP.mkdir(exist_ok=True)
def gen_cf(prompt, out, w, h, seed):
    url = 'https://api.cloudflare.com/client/v4/accounts/' + CF['CF_ACCOUNT_ID'] + '/ai/run/@cf/black-forest-labs/flux-1-schnell'
    body = json.dumps({'prompt': prompt[:2000], 'steps': 6}).encode()
    for a in range(4):
        try:
            req = urllib.request.Request(url, data=body, headers={'Authorization': 'Bearer ' + CF['CF_API_TOKEN'], 'Content-Type': 'application/json'})
            d = json.loads(urllib.request.urlopen(req, timeout=120).read())
            f = TMP / (pathlib.Path(out).stem + '.jpg'); f.write_bytes(base64.b64decode(d['result']['image']))
            if w != h:
                im = Image.open(f); W, H = im.size; nh = int(W * h / w); top = max(0, (H - nh) // 2); im.crop((0, top, W, top + nh)).save(f)
            return str(f)
        except Exception as e:
            print('retry cf', pathlib.Path(out).name, str(e)[:200]); time.sleep(8 * (a + 1))
    return None

def gen(prompt, out, w, h, seed=7):
    if os.environ.get('PROVIDER', 'cf') == 'cf': return gen_cf(prompt, out, w, h, seed)
    out = pathlib.Path(out)
    if out.exists(): return 'skip'
    out.parent.mkdir(parents=True, exist_ok=True)
    for a in range(4):
        try:
            res = cli().predict(prompt=prompt, seed=seed, randomize_seed=False, width=w, height=h, num_inference_steps=4, api_name='/infer')
            src = res[0] if isinstance(res, (list, tuple)) else res
            src = src['path'] if isinstance(src, dict) else src
            return src
        except Exception as e:
            print('retry', out.name, str(e)[:160]); time.sleep(15 * (a + 1))
    return None

def save_jpg(src, out, maxw):
    im = Image.open(src).convert('RGB'); im.thumbnail((maxw, maxw * 2)); im.save(out, 'JPEG', quality=82, optimize=True)

def save_sticker(src, out, size=320):
    """белый фон → прозрачный (заливка от краёв), обрезка, 320 px webp"""
    im = Image.open(src).convert('RGBA'); W, H = im.size
    for xy in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1), (W // 2, 0), (W // 2, H - 1), (0, H // 2), (W - 1, H // 2)]:
        ImageDraw.floodfill(im, xy, (255, 255, 255, 0), thresh=38)
    bb = im.getbbox()
    if bb: im = im.crop(bb)
    im.thumbnail((size, size)); im.save(out, 'WEBP', quality=86, method=6)

def main():
    what = sys.argv[1] if len(sys.argv) > 1 else 'test'
    spec = json.loads((ROOT / 'tools' / 'anime-assets.json').read_text(encoding='utf-8'))
    jobs = []
    if what == 'test': jobs = [spec['scenes'][0]]
    if what in ('scenes', 'all'): jobs += spec['scenes']
    if what in ('rooms', 'all'): jobs += spec['rooms']
    if what in ('items', 'all'): jobs += spec['items']
    done = 0
    for j in jobs:
        out = ROOT / j['out']
        if out.exists(): continue
        if j['kind'] == 'item':
            prompt = f"{j['p']}, single object, centered, full view, sticker style with soft shading, isolated on pure white background, {STYLE}"
            src = gen(prompt, out, 768, 768, j.get('seed', 11))
            if src: save_sticker(src, out)
        else:
            prompt = f"{j['p']}, {STYLE}"
            src = gen(prompt, out, j.get('w', 1280), j.get('h', 720), j.get('seed', 7))
            if src: save_jpg(src, out, j.get('w', 1280))
        if src: done += 1; print('ok', j['out'], flush=True)
        else: print('FAIL', j['out'], flush=True)
    print('done', done)

if __name__ == '__main__': main()
