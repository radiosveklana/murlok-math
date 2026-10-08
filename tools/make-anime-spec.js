// Собирает tools/anime-assets.json — что рисовать в аниме-стиле: сцены дел, фоны комнат, вещи домика
const fs = require('fs'), path = require('path');
const L = require('../lines.js');
const SCENES = [
  'interior of a cozy pastry shop at night, empty glass cake stand, cream smears and crumbs on the counter, tiny paw prints on the floor, curtains blowing at an open window, moonlight',
  'cozy bakery at night, an empty donut box on the counter, sugar sprinkles scattered, tiny paw prints leading to a back door left ajar, warm lamp light',
  'magical candy bank vault, round vault door open, empty treasure chest, a few colorful gummy candies on the floor, beams of moonlight',
  'autumn fair at dusk, wooden stall with paper lanterns, an empty basket where caramel apples were, fallen orange leaves, paw prints in the dust',
  'charming cafe at night, empty recipe stand on a table, flour dusted on the table, an open drawer, a feather on the floor',
  'whimsical chocolate factory, conveyor belts and pipes, an empty golden pedestal, chocolate drips, sparkling dust in the air',
  'school cafeteria at night, an empty baking tray on a table, a trail of cookie crumbs across the floor to a window',
  'park with a fountain at night, an abandoned ice cream cart with an open lid, melted ice cream puddles, glowing lanterns, fireflies',
  'old tea house with a samovar at night, an empty pie plate on a lace tablecloth, honey drips, window open to a big moon',
  'toy shop at night, a big empty glass jar on a shelf, a few rainbow lollipops on the floor, toy soldiers watching',
  'cozy cellar with shelves of jars at night, three empty spots on the shelf, a cherry on the floor, lantern light',
  'birthday party garden at night, festive table with balloons, empty cupcake stand, confetti and crumbs, string lights',
  'old lighthouse interior at night, spiral staircase, an empty sack by the window, glowing caramel candies scattered like fireflies',
  'grand old library at night, tall bookshelves, an empty book stand with a glowing outline, floating dust in moonbeams',
  'frozen ice rink at night, a little table with an empty snowman-shaped cake plate, sled tracks and paw prints in the snow',
  'toy museum at night, glass display case open and empty, gingerbread crumbs on velvet, gentle moonlight',
  'observatory dome at night, big telescope pointing at the moon, an empty plate with moon-shaped crumbs, stars through the open roof',
  'harbor pier at night, an open empty wooden treasure chest, a few chocolate coins glinting, ship lanterns, gentle waves',
  'circus tent interior at night, striped tent, an empty cotton candy machine, pink fluffy wisps floating in the air',
  'toy train at a tiny station at night, open cargo wagon with only a few gummy bears left, glowing lamps',
  'castle dining hall at night, an empty silver dish on a long table, candles flickering, moonlit stained glass',
  'beach at night under a big moon, an open empty ice cream freezer cart, footprints in the sand leading away, soft waves',
  'baking contest hall at night, a podium with an empty trophy cake stand, ribbons, spotlights, crumbs on the floor',
  'misty park at night, an overturned picnic basket, a few cinnamon bun crumbs, glowing lantern in soft fog',
  'cute underwater cafe with glass dome, jellyfish lamps, an empty cake stand on a table, pearls scattered, bubbles',
  'magical greenhouse at night, glowing flowers, an empty candy flower pot, garden tools, moonlight through glass roof',
  'hot air balloon festival at dusk, colorful balloons, an empty picnic basket on the grass, lanterns',
  'cute zoo at night, empty fruit basket near a monkey enclosure, banana peels, lanterns, stars',
  'puppet theater stage with red curtains, an open empty little chest, spotlight, puppets hanging',
  'ice palace hall, glittering ice columns, an empty ice pedestal, snowflakes floating, blue light',
  'old windmill interior at night, flour sacks, one torn sack with sugar spilled, moonlight through the window',
  'toy spaceport at night, little rockets, an empty crate, glowing runway lights, stars',
  'cute pirate ship deck at night, an empty barrel, rope, lantern, moon over the sea',
  'rainbow waterfall in a magical forest, an empty jar on a rock, sparkles and mist',
  'cozy night market with paper lanterns, an empty stall, a fallen lantern, warm lights',
  'candy mine tunnel, glowing gem-like chocolates in the walls, an empty mine cart, lantern light',
];
const ROOMS = {
  kitchen: 'cozy cute kitchen interior, front view, pastel tiled wall with shelves and hanging pots, window with flowers, light wooden floor taking the lower third, empty open floor space in the middle',
  living: 'cozy cute living room interior, front view, warm peach wallpaper, window with curtains, framed pictures, soft rug on wooden floor in the lower third, empty open floor space in the middle',
  bedroom: 'cozy cute bedroom interior, front view, lilac wallpaper with stars, round window with night sky, soft carpet floor in the lower third, empty open floor space in the middle',
  play: 'cute playroom interior, front view, mint wallpaper with polka dots, colorful bunting flags, window, pink soft floor in the lower third, empty open floor space in the middle',
  bath: 'cute bathroom interior, front view, light blue tiles, round window, little shelves with bubbles, light blue tiled floor in the lower third, empty open floor space in the middle',
  office: 'cute detective office interior, front view, wooden wall panels, bookshelves, window with rain, cork board, wooden floor in the lower third, empty open floor space in the middle',
  garden: 'cute sunny garden, front view, blue sky with fluffy clouds, white fence with flowers, green lawn in the lower third, empty open grass space in the middle',
  pool: 'cute indoor swimming pool room, front view, light blue tiles, big window with sun, palm plant, blue water area in the lower third, empty space in the middle',
  music: 'cute music room interior, front view, pink wallpaper with music notes, small stage lights, wooden floor in the lower third, empty open floor space in the middle',
  library: 'cozy cute library room interior, front view, tall bookshelves on the walls, round window, wooden floor with rug in the lower third, empty open floor space in the middle',
  station: 'cute space station interior, front view, round windows with planets and stars, soft blue lights, metal floor in the lower third, empty open floor space in the middle',
  attic: 'cute attic observatory at night, front view, sloped wooden roof with big round window full of stars, purple night glow, wooden floor in the lower third, empty open floor space in the middle',
};
const EN = {
  fx_pool: 'a cute small round swimming pool with water', fx_ring: 'a cute swim ring', fx_mic: 'a cute microphone on a stand', fx_notes: 'a music sheet with notes', fx_shelf: 'a tall wooden bookshelf with books', fx_globe: 'a cute desk globe', fx_window: 'a round spaceship porthole with a planet view', fx_panel: 'a cute spaceship control panel with buttons',
  lamp2: 'a soft round pouf', vase: 'a cute vase with flowers', rug: 'a round knitted rug', hammock: 'a cute hammock on a stand', bookcase: 'a small shelf with fairy tale books', catwheel: 'a cat exercise wheel',
  plush: 'a giant teddy bear', blocks: 'colorful toy building blocks', puzzle: 'a jigsaw puzzle', dollhouse: 'a cute dollhouse', bubbles: 'soap bubbles with a bubble wand', slide: 'a small playground slide', trampoline: 'a small trampoline', scooter: 'a kick scooter',
  macarons: 'a tower of colorful macarons', pancakes: 'a stack of pancakes with honey', jelly: 'a wobbly jelly pudding', candyhouse: 'a gingerbread house', chocofountain: 'a chocolate fountain with fruits',
  kitten: 'a cute little kitten', puppy: 'a cute puppy', owlet: 'a cute baby owl', snail: 'a cute snail', ladybug: 'a cute ladybug',
  balloonarch: 'a balloon arch', garland: 'a string of colorful bunting flags', partyhat: 'a party table with cake and party hats', mirrorball: 'a disco mirror ball', magicbook: 'a glowing magic spell book', potion: 'a glowing magic potion bottle', magichat: 'a magician top hat with a bunny', phoenix: 'a cute fire phoenix bird',
  comet: 'a shooting comet', astronaut: 'a cute empty astronaut space suit', satellite: 'a cute satellite', rainbowtree: 'a blooming sakura tree', pond: 'a small pond with lotus flowers', palm: 'a palm tree', rainbowfox: 'a plush fox toy', beanbag: 'a bean bag chair',
  fx_bowl: 'a cute cat food bowl', fx_water: 'a cute pet water bowl with water drop', fx_stove: 'a cute little kitchen stove with a pan', fx_sofa: 'a cozy cute pink sofa', fx_lamp: 'a cute hanging ceiling lamp', fx_bed: 'a cozy cute cat bed with pillow and blanket', fx_yarn: 'a ball of pink yarn', fx_scratch: 'a cute cat scratching post', fx_tub: 'a cute bathtub full of bubbles', fx_duck: 'a yellow rubber duck', fx_soap: 'a pink soap bar with bubbles', fx_map: 'a cute treasure map of a candy town', fx_desk: 'a cute wooden filing cabinet', fx_house: 'a cute little cat house with a red roof', fx_tulip: 'a bunch of tulips in a pot', fx_scope: 'a cute brass telescope on a tripod',
  chair: 'a cozy armchair', plant: 'a potted plant', pic: 'a framed painting of a cat', clock: 'a cute round wall clock', tv: 'a cute retro television', lantern: 'a paper lantern', books: 'a stack of colorful books', mirror: 'a round mirror with a golden frame', lights: 'a garland of star fairy lights', piano: 'a small upright piano', guitar: 'a cute acoustic guitar', drum: 'a cute toy drum', trophy: 'a golden trophy cup',
  teddy: 'a teddy bear', ball: 'a soccer ball', balloons: 'a bunch of colorful balloons', yoyo: 'a yo-yo', kite: 'a colorful kite', skate: 'a cute skateboard', game: 'a game console with a controller', train: 'a cute toy steam train', robot: 'a cute friendly toy robot', unicorn: 'a rocking unicorn toy', castle: 'a cute toy castle for cats', tent: 'a circus tent toy', carousel: 'a cute carousel with horses', ferris: 'a cute ferris wheel',
  cake: 'a strawberry birthday cake', cookies: 'a jar of cookies', cupcakes: 'a stand with cupcakes', icecream: 'an ice cream cone', candyjar: 'a big jar of candies', lolly: 'a lollipop tree', donuts: 'a tower of donuts', choco: 'a mountain of chocolate bars',
  fishtank: 'a round fish tank with goldfish', butterfly: 'a cute butterfly', chick: 'a cute baby chick', parrot: 'a cute green parrot on a perch', hamster: 'a cute hamster', turtle: 'a cute little turtle', bunny: 'a cute baby bunny',
  gift: 'a stack of gift boxes', confetti: 'a party popper with confetti', pinata: 'a colorful llama pinata', fireworks: 'colorful fireworks burst',
  rainbow: 'a rainbow with clouds', crystal: 'a glowing crystal ball', wand: 'a magic wand with stars', fairy: 'a tiny cute fairy', gem: 'a sparkling treasure chest with gems', genie: 'a magic lamp with a friendly genie', dragon: 'a cute baby dragon',
  star: 'a shining star', moon: 'a crescent moon', planet: 'the planet Saturn with rings', rocket: 'a cute rocket', ufo: 'a cute flying saucer', alien: 'a cute friendly alien',
  sunflower: 'a sunflower in a pot', cactus: 'a cute cactus in a pot', mushroom: 'a red spotted mushroom', tree: 'a round green tree', snowman: 'a cute snowman', fountain: 'a small stone fountain',
  f_fish: 'a fish', f_milk: 'a glass of milk', f_cheese: 'a piece of cheese', f_shrimp: 'a fried shrimp', f_cake: 'a cupcake',
};
const NOPETS = id => ', empty, no animals, no cats, no people';
const items = [];
L.ROOMS.forEach(r => r.fixed.forEach(f => items.push({ kind: 'item', id: f[0], out: `img/items/${f[0]}.webp`, p: EN[f[0]] + NOPETS(f[0]) })));
L.CATALOG.forEach(c => items.push({ kind: 'item', id: c[0], out: `img/items/${c[0]}.webp`, p: EN[c[0]] + (['Питомцы', 'Волшебство', 'Космос'].includes(c[5]) ? '' : NOPETS(c[0])) }));
L.FOODS.forEach(f => items.push({ kind: 'item', id: f[0], out: `img/items/${f[0]}.webp`, p: EN[f[0]] }));
const miss = items.filter(i => !i.p); if (miss.length) throw new Error('no EN: ' + miss.map(m => m.id));
const spec = {
  scenes: SCENES.map((p, i) => ({ kind: 'scene', out: `img/scene2/${i}.jpg`, p: p + ', mysterious detective mood, magical night atmosphere, no characters', w: 1280, h: 720, seed: 30 + i })),
  rooms: Object.entries(ROOMS).map(([id, p], i) => ({ kind: 'room', out: `img/rooms/${id}.jpg`, p, w: 1280, h: 800, seed: 60 + i })),
  items,
};
fs.writeFileSync(path.join(__dirname, 'anime-assets.json'), JSON.stringify(spec, null, 1));
console.log('scenes', spec.scenes.length, 'rooms', spec.rooms.length, 'items', items.length);
