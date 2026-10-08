# Пишет img/items/index.json и img/rooms/index.json — какие аниме-картинки уже готовы
import json, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
for d, ext in [('items', '*.webp'), ('rooms', '*.jpg')]:
    p = R / 'img' / d; p.mkdir(parents=True, exist_ok=True)
    ids = sorted(f.stem for f in p.glob(ext)); (p / 'index.json').write_text(json.dumps(ids), encoding='utf-8'); print(d, len(ids))
