/* Фото с места происшествия: node tools/gen-scenes.js  (Pollinations / FLUX, бесплатно, без ключа)
   Картинки → img/scene/<номер дела>.jpg. Готовые не перегенерирует. */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const E = require('../engine.js');
const OUT = path.join(__dirname, '..', 'img', 'scene'); fs.mkdirSync(OUT, { recursive: true });
const FF = process.env.FFMPEG || 'ffmpeg';
const STYLE = 'cute mystical children\'s book illustration, cozy and magical, soft moonlight, glowing fireflies and sparkles, light fog, warm and cool colors, detailed, Pixar-like 3D cartoon style, no people, no animals, no text, no letters, wide shot';
const SCENES = [
  'interior of a cozy pastry shop at night, empty glass cake stand where a strawberry cake used to be, cream smears and crumbs on the counter, small paw prints on the floor, open window with curtains blowing',
  'cozy bakery at night, an empty donut box on the counter, sugar sprinkles scattered, tiny paw prints leading to the back door left ajar',
  'magical candy bank vault at night, round vault door open, empty treasure chest, a few colorful gummy candies on the floor, beams of moonlight',
  'autumn fair at night, wooden stall with lanterns, an empty basket where caramel apples were, fallen leaves, paw prints in the dust',
  'charming cafe at night, recipe stand on the table is empty, flour dusted on the table, an open drawer, a feather on the floor',
  'whimsical chocolate factory at night, conveyor belt with an empty golden pedestal, chocolate drips, sparkling dust in the air',
  'school cafeteria at night, an empty baking tray on the table, cookie crumbs trail across the floor to a window',
  'park with a fountain at night, an abandoned ice cream cart with an open lid, melted ice cream puddles, lanterns glowing',
  'old tea house with a samovar at night, an empty pie plate on a lace tablecloth, honey drips, a window open to the moon',
  'toy shop at night, a big empty glass jar on a shelf, a few rainbow lollipops on the floor, toy soldiers watching',
  'cozy grandma cellar at night, shelves with jars, three empty spots on the shelf, a cherry on the floor, lantern light',
  'birthday party garden at night, festive table with balloons, empty cupcake stand, confetti and crumbs, string lights',
  'old lighthouse interior at night, spiral staircase, an empty sack by the window, glowing caramel candies scattered like fireflies',
  'grand old library at night, tall bookshelves, an empty book stand with a glowing outline, floating dust in moonbeams',
  'frozen ice rink at night, a little table with an empty cake plate shaped like a snowman, sled tracks and paw prints in the snow',
  'toy museum at night, glass display case open and empty, painted gingerbread crumbs on velvet, gentle moonlight',
  'observatory dome at night, big telescope pointing at the moon, an empty plate with moon-shaped crumbs, stars through the open roof',
  'harbor pier at night, wooden treasure chest open and empty, a few chocolate coins glinting, ship lanterns, gentle waves',
  'circus tent at night, striped tent interior, empty cotton candy machine, pink fluffy wisps floating in the air',
  'toy train wagon at night, open cargo wagon with only a few gummy bears left, tiny tracks, glowing lamps',
  'castle on a hill at night, royal dining hall with an empty silver dish, candles flickering, moonlit stained glass',
  'beach at night under the moon, an open empty ice cream freezer cart, footprints in the sand leading away, soft waves',
  'baking contest hall at night, a podium with an empty trophy cake stand, ribbons, spotlights, crumbs on the floor',
  'misty park at night, an overturned picnic basket, a few cinnamon bun crumbs, glowing lantern in thick soft fog',
];
(async () => {
  for (let i = 0; i < E.CRIMES.length; i++) {
    const out = path.join(OUT, i + '.jpg'); if (fs.existsSync(out)) continue;
    const prompt = encodeURIComponent(`${SCENES[i]}, ${STYLE}`);
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1280&height=800&model=flux&nologo=true&seed=${100 + i}`;
    for (let a = 0; a < 4; a++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(180000) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const buf = Buffer.from(await r.arrayBuffer()); if (buf.length < 20000) throw new Error('small ' + buf.length);
        const raw = out + '.raw'; fs.writeFileSync(raw, buf);
        execFileSync(FF, ['-v', 'error', '-y', '-i', raw, '-vf', 'scale=1024:-2', '-q:v', '5', out]); fs.unlinkSync(raw);
        console.log('ok', i, E.CRIMES[i].title, fs.statSync(out).size); break;
      } catch (e) { console.log('retry', i, e.message); await new Promise(r => setTimeout(r, 8000 * (a + 1))); }
    }
  }
  console.log('done');
})();
