"""Листы-превью фото для ручной проверки: python tools/art-sheets.py <outdir> [subject...] — только фото из Commons-поиска (с полем file)"""
import json, sys, pathlib
from PIL import Image, ImageDraw, ImageFont
ROOT = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]); args = sys.argv[2:]
only = set(w for a in args if a.endswith('.txt') for w in open(a, encoding='utf-8').read().split()); subs = set(a for a in args if not a.endswith('.txt'))
cr = json.load(open(ROOT / 'tools/art/credits.json', encoding='utf-8'))
items = [(k, v) for k, v in cr.items() if v.get('file') and (not subs or k.split('/')[0] in subs) and (not only or k in only)]
W, H, cols = 260, 195, 6; f = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 13)
for part in range(0, len(items), 36):
    ch = items[part:part + 36]; rows = (len(ch) + cols - 1) // cols
    c = Image.new('RGB', (W * cols, (H + 34) * rows), 'white'); d = ImageDraw.Draw(c)
    for i, (k, v) in enumerate(ch):
        s, key = k.split('/', 1); fn = ROOT / 'img/acad' / s / (((('c-' + key.split(':', 1)[1]) if key.startswith('cover:') else key.replace(':', '-'))) + '.webp')
        x, y = (i % cols) * W, (i // cols) * (H + 34)
        try: c.paste(Image.open(fn).resize((W - 4, H)), (x, y))
        except Exception: pass
        d.text((x + 2, y + H + 1), f"{k}"[:38], fill='black', font=f); d.text((x + 2, y + H + 16), v['alt'][:38], fill='#a03', font=f)
    p = out / f'sheet{part // 36}.jpg'; c.save(p, quality=80); print(p)
