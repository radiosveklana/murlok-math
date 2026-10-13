require('../../content/extra/cases-extra.js'); // кладёт CASES_EXTRA в global
const E = require('../../engine.js'), fs = require('fs');
const src = fs.readFileSync(__dirname + '/../../app.js', 'utf8');
const code = src.slice(src.indexOf('const SCENE_READY'), src.indexOf('function sceneHTML'));
const f = new Function('E', code + '; return crimeScene;')(E);
const names = require('../anime-assets.json').scenes.map(x => x.p.split(',')[0]);
let neutral = 0;
E.CRIMES.forEach((c, i) => { const s = f(c, i); if (s < 0) neutral++; console.log(i, c.place, '→', s, s >= 0 ? names[s] : 'НЕЙТРАЛЬНАЯ'); });
console.log('всего', E.CRIMES.length, 'нейтральных', neutral);
