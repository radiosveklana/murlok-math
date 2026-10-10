/* cheats.js (v29) — «📋 Шпаргалки» в стиле блокнота сыщика: таблица умножения, компоненты и метод коробки,
   порядок действий и свойства, алгоритмы столбиком, величины, формулы, разряды и классы.
   Кнопка «📋» в шапке экранов с задачами открывает нужную шпаргалку снизу (по теме задания),
   полный экран «Шпаргалки» — из Школы и с главной («Учиться»). Подглядывать можно: котик не снимает за это ничего,
   только отмечает для взрослых, какие шпаргалки нужны чаще. Подключается перед coach.js. */
'use strict';
const Cheats = (() => {
  const nb = s => String(s).replace(/ /g, ' '); // неразрывные пробелы внутри чисел и формул
  const col = s => `<pre class="cs-col">${s}</pre>`;
  const f = s => `<div class="cs-f">${s}</div>`;
  const eqr = (a, b) => `<div class="cs-eq"><b>${nb(a)}</b><span>=</span><span>${nb(b)}</span></div>`;
  const steps = arr => `<ol class="cs-steps">${arr.map(x => `<li>${x}</li>`).join('')}</ol>`;
  const ex = s => `<div class="cs-ex">🔎 ${s}</div>`;

  /* ---------- шпаргалки: карточки { id, h, b (html), say (текст для голоса, иначе берётся из b) } ---------- */
  const SHEETS = [
    { id: 'table', sh: 'Таблица ×', icon: '✖️', t: 'Таблица умножения', cards: [
      { id: 'grid', h: 'Таблица умножения', b: () => tableHTML(), say: 'Нажми на число в таблице — подсветится строка и столбец, а внизу появится пример и обратное деление.' },
      { id: 'divrev', h: 'Деление — обратное умножение', b: () => `${f('6 · 7 = 42')}<p>значит</p>${f('42 : 6 = 7 &nbsp; и &nbsp; 42 : 7 = 6')}<p>Чтобы разделить 42 на 6, спроси себя: <b>на сколько умножить 6, чтобы получилось 42?</b></p>`,
        say: 'Деление — это обратное умножение. Если шесть умножить на семь, будет сорок два. Значит, сорок два разделить на шесть — семь, а сорок два разделить на семь — шесть. Чтобы разделить, спроси себя: на сколько умножить делитель, чтобы получилось делимое?' },
      { id: 'special', h: 'Особые случаи', b: () => `${eqr('a · 1', 'a')}${eqr('a · 0', '0')}${eqr('a : 1', 'a')}${eqr('a : a', '1')}${eqr('0 : a', '0')}<p class="cs-warn">⛔ На 0 делить <b>нельзя</b>!</p>`,
        say: 'Число, умноженное на один, не меняется. Умножить на ноль — получится ноль. Разделить на один — число не меняется. Число, разделённое само на себя, — один. Ноль разделить на число — ноль. На ноль делить нельзя!' },
      { id: 'tips', h: 'Хитрости сыщика', b: () => `<ul class="cs-list"><li><b>× 5</b> — ответ всегда кончается на 0 или 5.</li><li><b>× 9</b> — сумма цифр ответа равна 9: 9 · 7 = 63, 6 + 3 = 9.</li><li><b>× 4</b> — удвой и ещё раз удвой: 4 · 8 = 16 + 16 = 32.</li><li><b>× 10</b> — припиши справа 0.</li><li>От перестановки множителей ответ не меняется: <b>3 · 8 = 8 · 3</b>.</li></ul>`,
        say: 'Хитрости сыщика. Умножение на пять всегда кончается на ноль или пять. При умножении на девять сумма цифр ответа равна девяти. Умножить на четыре — значит удвоить и ещё раз удвоить. Умножить на десять — приписать справа ноль. От перестановки множителей ответ не меняется.' },
    ] },
    { id: 'comp', sh: 'Компоненты', icon: '📦', t: 'Компоненты и неизвестное', cards: [
      { id: 'names', h: 'Как называются числа', b: () => `<div class="cs-names">
        <div><span class="cs-ex2">8 + 5 = 13</span><small>слагаемое + слагаемое = <b>сумма</b></small></div>
        <div><span class="cs-ex2">13 − 5 = 8</span><small>уменьшаемое − вычитаемое = <b>разность</b></small></div>
        <div><span class="cs-ex2">6 · 4 = 24</span><small>множитель · множитель = <b>произведение</b></small></div>
        <div><span class="cs-ex2">24 : 4 = 6</span><small>делимое : делитель = <b>частное</b></small></div></div>`,
        say: 'Восемь плюс пять равно тринадцать: слагаемое, слагаемое, сумма. Тринадцать минус пять: уменьшаемое, вычитаемое, разность. Шесть умножить на четыре: множитель, множитель, произведение. Двадцать четыре разделить на четыре: делимое, делитель, частное.' },
      { id: 'rules', h: 'Как найти неизвестное', b: () => `<div class="cs-rules">${[
        ['слагаемое', 'x + 15 = 40', 'из суммы вычесть известное слагаемое', 'x = 40 − 15 = 25'],
        ['уменьшаемое', 'x − 12 = 30', 'к разности прибавить вычитаемое', 'x = 30 + 12 = 42'],
        ['вычитаемое', '50 − x = 18', 'из уменьшаемого вычесть разность', 'x = 50 − 18 = 32'],
        ['множитель', 'x · 7 = 56', 'произведение разделить на известный множитель', 'x = 56 : 7 = 8'],
        ['делимое', 'x : 6 = 9', 'частное умножить на делитель', 'x = 9 · 6 = 54'],
        ['делитель', '72 : x = 8', 'делимое разделить на частное', 'x = 72 : 8 = 9'],
      ].map(([n, e, r, s]) => `<div class="cs-rule"><b class="cs-rn">${n}</b><span class="cs-rr">${r}</span><span class="cs-rx">${nb(e)} → ${nb(s)}</span></div>`).join('')}</div>`,
        say: 'Чтобы найти неизвестное слагаемое, нужно из суммы вычесть известное слагаемое. Чтобы найти неизвестное уменьшаемое, нужно к разности прибавить вычитаемое. Чтобы найти неизвестное вычитаемое, нужно из уменьшаемого вычесть разность. Чтобы найти неизвестный множитель, нужно произведение разделить на известный множитель. Чтобы найти неизвестное делимое, нужно частное умножить на делитель. Чтобы найти неизвестный делитель, нужно делимое разделить на частное.' },
      { id: 'box', h: 'Метод коробки 📦', b: () => `${steps(['Найди <b>последнее действие</b> (его делают последним по порядку действий).', 'Всё, что вместе с <i class="x">x</i>, спрячь в <b>коробку 📦</b> — будто это одно неизвестное число.', 'Назови, кем является коробка: слагаемым, вычитаемым, множителем…', 'Примени <b>правило</b> и найди, чему равна коробка.', 'Открой коробку — внутри снова уравнение. Повторяй, пока не найдёшь <i class="x">x</i>.', 'Сделай <b>проверку</b>: подставь ответ в уравнение.'])}
        ${ex('<b>(x + 12) · 3 = 60</b><br>последнее действие — «·», коробка — множитель:<br>📦 · 3 = 60 → 📦 = 60 : 3 = 20<br>открываем: x + 12 = 20 → x = 20 − 12 = <b>8</b><br>проверка: (8 + 12) · 3 = 60 ✔')}`,
        say: 'Метод коробки. Найди последнее действие. Всё, что вместе с иксом, спрячь в коробку — будто это одно неизвестное число. Назови, кем является коробка. Примени правило и найди, чему равна коробка. Открой коробку и повторяй, пока не найдёшь икс. И сделай проверку.' },
      { id: 'onv', h: 'Больше / меньше: «на» и «в»', b: () => `<div class="cs-names">
        <div><span class="cs-ex2">больше <b>на</b> 3 → + 3</span><small>меньше <b>на</b> 3 → − 3</small></div>
        <div><span class="cs-ex2">больше <b>в</b> 3 раза → · 3</span><small>меньше <b>в</b> 3 раза → : 3</small></div>
        <div><span class="cs-ex2">на сколько больше? → −</span><small>во сколько раз больше? → :</small></div></div>`,
        say: 'Больше на — прибавляем, меньше на — вычитаем. Больше в несколько раз — умножаем, меньше в несколько раз — делим. На сколько больше — узнаём вычитанием. Во сколько раз больше — узнаём делением.' },
    ] },
    { id: 'order', sh: 'Порядок', icon: '🚦', t: 'Порядок действий и свойства', cards: [
      { id: 'order', h: 'Порядок действий', b: () => `<div class="cs-order"><span>1️⃣ ( ) скобки</span><span>2️⃣ · и : слева направо</span><span>3️⃣ + и − слева направо</span></div>
        ${ex('<b>48 − (6 + 2) · 5</b><br>1) 6 + 2 = 8<br>2) 8 · 5 = 40<br>3) 48 − 40 = <b>8</b>')}${ex('Если действия одной ступени — просто слева направо:<br><b>36 : 4 · 3</b> = 9 · 3 = <b>27</b>')}`,
        say: 'Порядок действий. Сначала выполняем действия в скобках. Потом умножение и деление по порядку слева направо. Потом сложение и вычитание слева направо.' },
      { id: 'props', h: 'Свойства действий', b: () => `<div class="cs-prop"><b>Переместительное</b>${f('a + b = b + a')}${f('a · b = b · a')}<small>от перестановки слагаемых (множителей) результат не меняется</small></div>
        <div class="cs-prop"><b>Сочетательное</b>${f('(a + b) + c = a + (b + c)')}${f('(a · b) · c = a · (b · c)')}<small>соседние числа можно группировать как удобно</small></div>
        <div class="cs-prop"><b>Распределительное</b>${f('(a + b) · c = a · c + b · c')}${f('(a − b) · c = a · c − b · c')}<small>на число умножаем <b>каждое</b> число в скобках</small></div>`,
        say: 'Переместительное свойство: от перестановки слагаемых или множителей результат не меняется. Сочетательное свойство: соседние числа можно группировать как удобно. Распределительное свойство: чтобы умножить сумму на число, можно умножить на это число каждое слагаемое и результаты сложить.' },
      { id: 'smart', h: 'Удобный счёт', b: () => `${ex('<b>37 + 48 + 63</b> = (37 + 63) + 48 = 100 + 48 = <b>148</b>')}${ex('<b>25 · 7 · 4</b> = (25 · 4) · 7 = 100 · 7 = <b>700</b>')}${ex('<b>19 · 6</b> = 20 · 6 − 1 · 6 = 120 − 6 = <b>114</b>')}${ex('<b>23 · 4</b> = 20 · 4 + 3 · 4 = 80 + 12 = <b>92</b>')}<p class="small">Ищи пары, которые дают круглое число: 2 и 5, 4 и 25, 8 и 125.</p>`,
        say: 'Удобный счёт: ищи пары чисел, которые дают круглое число, и складывай или умножай их первыми. Двадцать пять умножить на четыре — сто. Восемь умножить на сто двадцать пять — тысяча.' },
    ] },
    { id: 'column', sh: 'Столбик', icon: '✍️', t: 'Столбик', cards: [
      { id: 'add', h: 'Сложение столбиком', b: () => `<div class="cs-two">${steps(['Пиши <b>разряд под разрядом</b>: единицы под единицами.', 'Складывай <b>справа налево</b>, начиная с единиц.', 'Получилось 10 или больше — пиши единицы, а 1 <b>запомни</b> и прибавь к следующему разряду.'])}${col('  ¹¹¹\n  4587\n+ 2675\n──────\n  7262')}</div>`,
        say: 'Сложение столбиком. Пиши разряд под разрядом: единицы под единицами. Складывай справа налево. Если получилось десять или больше, пиши единицы, а один запомни и прибавь к следующему разряду.' },
      { id: 'sub', h: 'Вычитание столбиком', b: () => `<div class="cs-two">${steps(['Пиши разряд под разрядом.', 'Вычитай <b>справа налево</b>.', 'Сверху цифра меньше? <b>Займи 1 десяток</b> у соседа слева (поставь над ним точку): соседу −1, тебе +10.', 'Сосед 0? Занимай дальше — нули становятся девятками.', 'Проверка: разность + вычитаемое = уменьшаемое.'])}${col('  ···\n  5003\n− 2768\n──────\n  2235')}</div>`,
        say: 'Вычитание столбиком. Пиши разряд под разрядом и вычитай справа налево. Если сверху цифра меньше, займи один десяток у соседа слева: у соседа станет на один меньше, а у тебя на десять больше. Если сосед ноль — занимай дальше, нули становятся девятками. Проверка: разность плюс вычитаемое равно уменьшаемому.' },
      { id: 'mul', h: 'Умножение столбиком', b: () => `<div class="cs-two">${steps(['Умножай <b>справа налево</b>, «запомненное» прибавляй к следующему произведению.', 'На двузначное: сначала на <b>единицы</b> — первое неполное произведение.', 'Потом на <b>десятки</b> — второе неполное произведение пиши <b>со сдвигом</b> на одну клетку влево.', 'Сложи неполные произведения.'])}${col('   324\n×   23\n──────\n+  972\n  648\n──────\n  7452')}</div>`,
        say: 'Умножение столбиком. Умножай справа налево, запомненное прибавляй к следующему произведению. На двузначное число сначала умножь на единицы — это первое неполное произведение. Потом на десятки — второе неполное произведение пиши со сдвигом на одну клетку влево. Сложи неполные произведения.' },
      { id: 'div', h: 'Деление столбиком', b: () => `<div class="cs-two">${steps(['Найди <b>первое неполное делимое</b> — число, которое делится на делитель.', 'Узнай, <b>сколько цифр</b> будет в частном (поставь точки).', 'Подбери цифру, умножь на делитель, вычти. <b>Остаток меньше делителя!</b>', 'Снеси следующую цифру и повторяй.', 'Не делится? Пиши в частном <b>0</b> и сноси дальше.'])}${col(' 1752 │4\n−16   ├───\n  15  │438\n −12\n   32\n  −32\n    0')}</div>
        ${ex('<b>С остатком:</b> 59 : 8 = 7 (ост. 3)<br>остаток 3 &lt; делителя 8 ✔<br>проверка: <b>7 · 8 + 3 = 59</b> ✔')}<p class="small">Проверка деления: частное · делитель + остаток = делимое.</p>`,
        say: 'Деление столбиком. Найди первое неполное делимое. Узнай, сколько цифр будет в частном. Подбери цифру, умножь на делитель и вычти. Остаток всегда должен быть меньше делителя. Снеси следующую цифру и повторяй. Если не делится — пиши в частном ноль. Проверка: частное умножить на делитель плюс остаток равно делимому.' },
      { id: 'round', h: 'На 10, 100, 1000 и круглые числа', b: () => `${eqr('34 · 100', '3400')}<small class="cs-c">припиши столько нулей, сколько их у 10, 100, 1000</small>${eqr('5600 : 100', '56')}<small class="cs-c">зачеркни столько нулей</small>${ex('<b>40 · 30</b> = 4 · 3 = 12 и два нуля → <b>1200</b>')}${ex('<b>2400 : 60</b> = 240 : 6 = <b>40</b> (убрали по одному нулю)')}`,
        say: 'Умножить на десять, сто, тысячу — приписать справа столько нулей, сколько их у этого числа. Разделить — зачеркнуть столько нулей. Сорок умножить на тридцать: четыре на три — двенадцать, и приписываем два нуля — тысяча двести.' },
    ] },
    { id: 'units', sh: 'Величины', icon: '📏', t: 'Величины', cards: [
      { id: 'len', h: 'Длина', b: () => `${eqr('1 см', '10 мм')}${eqr('1 дм', '10 см = 100 мм')}${eqr('1 м', '10 дм = 100 см')}${eqr('1 м', '1000 мм')}${eqr('1 км', '1000 м')}`,
        say: 'Длина. Один сантиметр — десять миллиметров. Один дециметр — десять сантиметров. Один метр — десять дециметров, или сто сантиметров, или тысяча миллиметров. Один километр — тысяча метров.' },
      { id: 'mass', h: 'Масса', b: () => `${eqr('1 кг', '1000 г')}${eqr('1 ц', '100 кг')}${eqr('1 т', '10 ц = 1000 кг')}`,
        say: 'Масса. Один килограмм — тысяча граммов. Один центнер — сто килограммов. Одна тонна — десять центнеров, или тысяча килограммов.' },
      { id: 'time', h: 'Время', b: () => `${eqr('1 мин', '60 с')}${eqr('1 ч', '60 мин = 3600 с')}${eqr('1 сут', '24 ч')}${eqr('1 нед', '7 сут')}${eqr('1 мес', '28, 29, 30 или 31 сут')}${eqr('1 год', '12 мес = 365 или 366 сут')}${eqr('1 век', '100 лет')}
        ${ex('полчаса = 30 мин · четверть часа = 15 мин')}`,
        say: 'Время. Одна минута — шестьдесят секунд. Один час — шестьдесят минут. Одни сутки — двадцать четыре часа. Одна неделя — семь суток. В месяце от двадцати восьми до тридцати одних суток. Один год — двенадцать месяцев, триста шестьдесят пять или триста шестьдесят шесть суток. Один век — сто лет.' },
      { id: 'area', h: 'Площадь', b: () => `${eqr('1 см²', '100 мм²')}${eqr('1 дм²', '100 см²')}${eqr('1 м²', '100 дм² = 10 000 см²')}${eqr('1 а (ар, «сотка»)', '100 м²')}${eqr('1 га', '100 а = 10 000 м²')}${eqr('1 км²', '100 га = 1 000 000 м²')}
        <p class="small">💡 У длины соседние единицы — в 10 раз, у площади — в <b>100</b> раз: квадрат 1 дм × 1 дм = 10 см × 10 см = 100 см².</p>`,
        say: 'Площадь. Один квадратный сантиметр — сто квадратных миллиметров. Один квадратный дециметр — сто квадратных сантиметров. Один квадратный метр — сто квадратных дециметров. Один ар, или сотка, — сто квадратных метров. Один гектар — сто аров, или десять тысяч квадратных метров. Один квадратный километр — сто гектаров.' },
      { id: 'parts', h: 'Доли величин', b: () => `${eqr('½ ч', '30 мин')}${eqr('¼ ч', '15 мин')}${eqr('½ кг', '500 г')}${eqr('¼ кг', '250 г')}${eqr('½ м', '50 см')}${eqr('½ сут', '12 ч')}<p class="small">Как узнать: раздели величину на столько частей, сколько показывает знаменатель.</p>`,
        say: 'Доли величин. Полчаса — тридцать минут, четверть часа — пятнадцать минут. Полкилограмма — пятьсот граммов, четверть килограмма — двести пятьдесят граммов. Полметра — пятьдесят сантиметров.' },
    ] },
    { id: 'formulas', sh: 'Формулы', icon: '🚗', t: 'Формулы', cards: [
      { id: 'geo', h: 'Прямоугольник и квадрат', b: () => `<div class="cs-two"><div><b>Прямоугольник</b> (a — длина, b — ширина)${f('P = (a + b) · 2')}${f('S = a · b')}<small>сторона: b = S : a</small></div><div><b>Квадрат</b> (a — сторона)${f('P = a · 4')}${f('S = a · a')}</div></div><p class="small">P — периметр (сумма длин сторон, в см, м). S — площадь (в см², м²).</p>`,
        say: 'Периметр прямоугольника: длину сложить с шириной и умножить на два. Площадь прямоугольника: длину умножить на ширину. Периметр квадрата: сторону умножить на четыре. Площадь квадрата: сторону умножить на сторону.' },
      { id: 'motion', h: 'Движение', b: () => `<div class="cs-tri"><span class="t">s</span><span class="l">v</span><span class="r">t</span></div>${f('s = v · t')}${f('v = s : t')}${f('t = s : v')}<p class="small">s — расстояние (км, м), v — скорость (км/ч, м/мин), t — время (ч, мин). Закрой пальцем то, что ищешь: если остались рядом — умножай, одно над другим — дели.</p>`,
        say: 'Движение. Расстояние равно скорости, умноженной на время. Скорость равна расстоянию, делённому на время. Время равно расстоянию, делённому на скорость.' },
      { id: 'meet', h: 'Навстречу и в разные стороны', b: () => `<div class="cs-prop"><b>🚶‍♀️→ ←🚶 Навстречу</b>${f('v сбл. = v₁ + v₂')}${f('t встречи = s : (v₁ + v₂)')}</div><div class="cs-prop"><b>←🚶 🚶‍♀️→ В разные стороны</b>${f('v удал. = v₁ + v₂')}${f('s = (v₁ + v₂) · t')}<small>если стартовали не из одной точки — прибавь начальное расстояние</small></div><div class="cs-prop"><b>🚶‍♀️→ 🚶→ Вдогонку</b>${f('v сбл. = v₁ − v₂')}</div>`,
        say: 'Встречное движение и движение в разные стороны: скорость сближения или удаления равна сумме скоростей. Время встречи — расстояние разделить на скорость сближения. Если догоняют — скорость сближения равна разности скоростей.' },
      { id: 'work', h: 'Работа', b: () => `${f('A = p · t')}${f('p = A : t')}${f('t = A : p')}<p class="small">A — объём работы (сколько сделано), p — производительность (сколько за 1 час), t — время.</p>`,
        say: 'Работа. Объём работы равен производительности, умноженной на время. Производительность — объём работы разделить на время. Время — объём работы разделить на производительность.' },
      { id: 'buy', h: 'Покупки', b: () => `${f('стоимость = цена · количество')}${f('цена = стоимость : количество')}${f('количество = стоимость : цена')}`,
        say: 'Покупки. Стоимость равна цене, умноженной на количество. Цена — стоимость разделить на количество. Количество — стоимость разделить на цену.' },
      { id: 'part', h: 'Доли числа', b: () => `<div class="cs-prop"><b>Доля числа</b><small>делим на знаменатель, умножаем на числитель</small>${ex('¾ от 20 = 20 : 4 · 3 = <b>15</b>')}</div><div class="cs-prop"><b>Число по его доле</b><small>делим на числитель, умножаем на знаменатель</small>${ex('⅓ числа — 7, число = 7 · 3 = <b>21</b>')}${ex('¾ числа — 15, число = 15 : 3 · 4 = <b>20</b>')}</div>`,
        say: 'Чтобы найти долю числа, раздели число на знаменатель и умножь на числитель. Чтобы найти число по его доле, раздели на числитель и умножь на знаменатель.' },
      { id: 'idea', h: 'Главный секрет', b: () => `<p>Во всех таких задачах <b>три величины</b>: одна равна произведению двух других. Знаешь две — найдёшь третью: <b>большую</b> — умножением, <b>меньшую</b> — делением.</p>`,
        say: 'Главный секрет: во всех таких задачах три величины, и одна равна произведению двух других. Знаешь две — найдёшь третью.' },
    ] },
    { id: 'ranks', sh: 'Разряды', icon: '🔢', t: 'Разряды и классы', cards: [
      { id: 'ranks', h: 'Числа до миллиона', b: () => `<div class="cs-rk"><div class="cs-cl" style="grid-column:span 3">класс тысяч</div><div class="cs-cl u" style="grid-column:span 3">класс единиц</div>
        ${['сот.', 'дес.', 'ед.', 'сот.', 'дес.', 'ед.'].map((x, i) => `<div class="cs-rh ${i > 2 ? 'u' : ''}">${x}</div>`).join('')}${'305726'.split('').map((d, i) => `<div class="cs-rd ${i > 2 ? 'u' : ''}">${d}</div>`).join('')}</div>
        <p class="cs-c"><b>305 726</b> — триста пять тысяч семьсот двадцать шесть</p><p class="small">сот. — сотни, дес. — десятки, ед. — единицы. В каждом классе три разряда.</p>`,
        say: 'Числа до миллиона. Справа — класс единиц: единицы, десятки, сотни. Слева — класс тысяч: единицы тысяч, десятки тысяч, сотни тысяч. Читаем по классам: сначала тысячи, потом единицы.' },
      { id: 'rules', h: 'Как читать, писать, сравнивать', b: () => `<ul class="cs-list"><li>Пиши классы <b>через пробел</b>: 48 006.</li><li>Пустой разряд — это <b>0</b>: «сорок восемь тысяч шесть» = 48 006.</li><li><b>Разрядные слагаемые:</b> 305 726 = 300 000 + 5 000 + 700 + 20 + 6.</li><li><b>Сравнение:</b> больше цифр — больше число; поровну — сравнивай разряды слева.</li><li>1 000 000 — <b>миллион</b>: 1 и шесть нулей. 999 999 + 1 = 1 000 000.</li><li>Увеличить в 10 раз — приписать 0; в 1000 раз — три нуля.</li></ul>`,
        say: 'Классы пишем через пробел. Пустой разряд — это ноль. Число можно разложить на разрядные слагаемые. Сравнивая, смотри: где больше цифр, то число больше. Если цифр поровну — сравнивай разряды слева. Миллион — это единица и шесть нулей.' },
    ] },
  ];
  const sheet = id => SHEETS.find(s => s.id === id) || SHEETS[0];

  /* ---------- таблица умножения ---------- */
  function tableHTML() {
    const facts = S.facts || {}; let h = '<div class="cs-tt" role="grid"><div class="tc hd c0">×</div>';
    for (let q = 1; q <= 10; q++) h += `<div class="tc hd" data-q="${q}">${q}</div>`;
    for (let p = 1; p <= 10; p++) { h += `<div class="tc hd" data-p="${p}">${p}</div>`; for (let q = 1; q <= 10; q++) { const e = p <= 9 && q <= 9 ? facts[factKey(p, q)] || 0 : 0; h += `<button class="tc ${e ? 'hard' : ''} ${p === q ? 'sq' : ''} ${p * q > 99 ? 'n3' : ''}" data-p="${p}" data-q="${q}" aria-label="${p} на ${q}">${p * q}</button>`; } }
    const hard = Object.keys(facts).filter(k => facts[k] > 0).length;
    return h + `</div><div class="cs-read" aria-live="polite">Нажми на число 👆</div>${hard ? '<p class="small">🔴 Красным отмечены «трудные» примеры — в них были ошибки. Повтори их!</p>' : ''}`;
  }
  function bindTable(root) {
    const tt = $('.cs-tt', root); if (!tt) return;
    tt.addEventListener('click', e => {
      const c = e.target.closest('.tc[data-p], .tc[data-q]'); if (!c) return; SND.tap();
      const p = +c.dataset.p || 0, q = +c.dataset.q || 0;
      $$('.tc', tt).forEach(x => { const xp = +x.dataset.p || 0, xq = +x.dataset.q || 0; x.classList.toggle('hl', (p && xp === p && (!q || xq <= q)) || (q && xq === q && (!p || xp <= p))); x.classList.toggle('sel', !!(p && q && xp === p && xq === q)); });
      const rd = $('.cs-read', root);
      if (p && q) rd.innerHTML = `<b>${p} · ${q} = ${p * q}</b>${p !== q ? `<span>${q} · ${p} = ${p * q}</span>` : ''}<span>${p * q} : ${q} = ${p}</span>${p !== q ? `<span>${p * q} : ${p} = ${q}</span>` : ''}`;
      else { const n = p || q; rd.innerHTML = `Строка на <b>${n}</b>: ${Array.from({ length: 10 }, (_, i) => n * (i + 1)).join(', ')}`; }
    });
  }

  /* ---------- какая шпаргалка нужна на этом экране ---------- */
  const AQ = { million_read: ['ranks', 'ranks'], million_compare: ['ranks', 'rules'], more_less: ['comp', 'onv'], length_mass: ['units', 'len'], time: ['units', 'time'], area_units: ['units', 'area'], part_qty: ['units', 'parts'],
    round_mul: ['column', 'round'], remainder: ['column', 'div'], order_ops: ['order', 'order'], props: ['order', 'props'], motion: ['formulas', 'motion'], motion_two: ['formulas', 'meet'], work: ['formulas', 'work'], buy: ['formulas', 'buy'], part_num: ['formulas', 'part'], shapes: ['formulas', 'geo'], data_logic: ['order', 'order'] };
  const BY_KIND = { mul: ['column', 'mul'], bugmul: ['column', 'mul'], eq: ['comp', 'box'], bugeq: ['comp', 'box'], interro: ['comp', 'rules'], div: ['column', 'div'], add: ['column', 'add'] };
  const TASK_SCREENS = ['practice', 'lesson', 'colwork', 'collesson', 'aquiz', 'alesson', 'drill', 'blitz', 'casetask', 'bugs', 'bugs2', 'newcase'];
  function context() {
    const c = (window.Nav && Nav.current()) || { n: curScreen }, n = c.n, a = String(c.a == null ? '' : c.a);
    if (n === 'practice' || n === 'lesson') return a === 'eq' ? ['comp', 'box'] : ['column', 'mul'];
    if (n === 'colwork' || n === 'collesson') { const k = a.split(':')[0]; return k === 'add' ? ['column', 'add'] : ['column', 'div']; }
    if (n === 'aquiz' || n === 'alesson') { const [sid, uid] = a.split(':'); if (sid !== 'math4') return null; return AQ[uid] || ['table', 'grid']; }
    if (n === 'drill') return { div: ['table', 'divrev'], round: ['column', 'round'], addsub: ['order', 'smart'] }[a] || ['table', 'grid'];
    if (n === 'casetask') { const t = typeof CASE !== 'undefined' && CASE && CASE.tasks && CASE.tasks[CASE.idx]; if (!t) return ['table', 'grid']; if (t.kind === 'aq' && t.src) return AQ[String(t.src).split(':')[1]] || ['table', 'grid']; return BY_KIND[t.kind] || ['table', 'grid']; }
    if (n === 'bugs') return ['comp', 'rules'];
    if (TASK_SCREENS.includes(n)) return ['table', 'grid'];
    return null;
  }

  /* ---------- учёт для взрослых (не штраф!) ---------- */
  function note(id, inTask) {
    const c = S.cheats = S.cheats || { n: 0, task: 0, by: {}, d: {} }; c.n++; if (inTask) c.task++; c.by[id] = (c.by[id] || 0) + 1; const d = today(); c.d[d] = (c.d[d] || 0) + 1;
    const keys = Object.keys(c.d).sort(); while (keys.length > 60) delete c.d[keys.shift()]; save();
  }

  /* ---------- отрисовка ---------- */
  const tabsHTML = cur => `<div class="cs-tabs" role="tablist">${SHEETS.map(s => `<button class="cs-tab ${s.id === cur ? 'on' : ''}" role="tab" aria-selected="${s.id === cur}" data-cs="${s.id}"><span>${s.icon}</span> ${s.sh}</button>`).join('')}</div>`;
  const bodyHTML = s => `<div class="cs-cards">${s.cards.map(c => `<section class="cs-card" data-card="${c.id}"><div class="cs-ch"><h3>${c.h}</h3><button class="cs-say" data-say="${c.id}" aria-label="Прочитай вслух">🔊</button></div><div class="cs-cb">${c.b().replace(/(d) (?=d{3}(?!d))/g, "$100a0")}</div></section>`).join('')}</div>`;
  function mount(root, sid, focus) {
    const draw = (id, fc) => {
      const s = sheet(id); root.dataset.sheet = s.id;
      $('.cs-tabs', root).outerHTML = tabsHTML(s.id); $('.cs-body', root).innerHTML = bodyHTML(s); bindTable(root);
      const on = $('.cs-tab.on', root); if (on && on.scrollIntoView) try { on.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { }
      const fcEl = fc && $(`.cs-card[data-card="${fc}"]`, root);
      if (fcEl) { fcEl.classList.add('focus'); setTimeout(() => { try { fcEl.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { } }, 60); }
      else { const sc = root.closest('.sheet') || null; if (sc) sc.scrollTop = 0; }
    };
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-cs]'); if (t) { SND.tap(); draw(t.dataset.cs); return; }
      const sy = e.target.closest('[data-say]'); if (sy) { SND.tap(); const s = sheet(root.dataset.sheet), c = s.cards.find(x => x.id === sy.dataset.say); if (!c) return;
        const h = c.say || $(`.cs-card[data-card="${c.id}"] .cs-cb`, root).textContent; try { if (typeof wakeAudio === 'function') wakeAudio(); readCard({ t: c.h.replace(/<[^>]+>/g, ''), h }); } catch (er) { console.warn(er); } }
    });
    draw(sid, focus);
  }
  const shell = () => `<div class="cs-tabs"></div><div class="cs-body"></div>`;
  let lastOpen = null;
  function open(sid, focus) {
    const cx = context(); if (!sid && cx) { sid = cx[0]; focus = cx[1]; }
    const inTask = TASK_SCREENS.includes(curScreen);
    $$('.modal.cs-modal').forEach(m => m.remove());
    const m = modal(`<div class="cs-grab"></div><div class="cs-head"><h2>📋 Шпаргалки</h2><button class="cs-x" data-close aria-label="Закрыть">✕</button></div>${inTask ? '<p class="cs-ok">🐾 Подглядывать можно — котик ничего за это не снимает!</p>' : ''}<div class="cs-wrap notebook">${shell()}</div>`, 'cs-sheet');
    m.el.classList.add('cs-modal'); m.el.addEventListener('click', e => { if (e.target === m.el) m.close(); });
    mount($('.cs-wrap', m.el), sid || 'table', focus);
    note(sid || 'table', inTask); lastOpen = { sid: sid || 'table', focus, screen: curScreen }; window.__cheatOpened = lastOpen;
    return m;
  }

  /* ---------- полный экран ---------- */
  SCREENS.cheats = arg => {
    app.innerHTML = `${topbar('📋 Шпаргалки')}<div class="page cheats-page"><div class="cs-intro notebook-cover"><span class="cs-clip">📎</span><b>Блокнот сыщика</b><small>Правила, таблицы и формулы 4 класса — подглядывай, когда нужно!</small></div><div class="cs-wrap notebook">${shell()}</div></div>`;
    const [sid, fc] = String(arg || '').split(':');
    mount($('.cs-wrap', app), SHEETS.some(s => s.id === sid) ? sid : 'table', fc || null);
    if (arg) note(sid || 'table', false);
  };
  if (typeof NO_FLOAT !== 'undefined' && !NO_FLOAT.includes('cheats')) NO_FLOAT.push('cheats');

  /* ---------- кнопка «📋» в шапке экранов с задачами ---------- */
  function ensureBtn() {
    const top = $('#app > header.top, #app header.top'); if (!top || $('.cs-btn', top)) return;
    if (!TASK_SCREENS.includes(curScreen) || !context()) return;
    const b = document.createElement('button'); b.className = 'cs-btn'; b.type = 'button'; b.setAttribute('aria-label', 'Шпаргалки'); b.title = 'Шпаргалки'; b.textContent = '📋';
    b.addEventListener('click', e => { e.stopPropagation(); SND.tap(); open(); });
    const pill = $('.pill', top); if (pill) top.insertBefore(b, pill); else top.appendChild(b);
  }
  new MutationObserver(ensureBtn).observe(document.getElementById('app'), { childList: true, subtree: true });
  { const g0 = go; go = function () { const r = g0.apply(this, arguments); try { ensureBtn(); } catch (e) { } return r; }; }

  /* ---------- вход из Школы и с главной ---------- */
  { const sc = SCREENS.school; SCREENS.school = arg => { sc(arg); const rb = $('.page .row-btns', app); if (rb && !$('[data-go="cheats"]', rb)) rb.insertAdjacentHTML('beforeend', '<button class="btn mint" data-go="cheats">📋 Шпаргалки</button>'); }; }
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); const tiles = $('.tiles', app); if (tiles && !$('[data-go="cheats"]', tiles)) tiles.insertAdjacentHTML('beforeend', '<button class="tile t-cheats" data-go="cheats"><span class="ti">📋</span><b>Шпаргалки</b><small>Таблицы, правила и формулы</small></button>'); return r; }; }

  /* ---------- отчёт для взрослых ---------- */
  { const par = SCREENS.parents; SCREENS.parents = arg => { const r = par(arg); const pg = $('.page.parents', app), c = S.cheats; if (pg && c && c.n) {
    const wk = []; for (let k = 0; k < 7; k++) { const d = new Date(); d.setDate(d.getDate() - k); wk.push(dkey(d)); } const n7 = wk.reduce((t, d) => t + ((c.d || {})[d] || 0), 0);
    const top = Object.entries(c.by || {}).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([id, n]) => `${sheet(id).icon} ${sheet(id).t} (${n})`).join(', ');
    pg.insertAdjacentHTML('beforeend', `<div class="card cs-rep"><h3>📋 Шпаргалки</h3><p>За неделю открывались <b>${n7}</b> ${plural(n7, 'раз', 'раза', 'раз')}, всего — ${c.n}${c.task ? `, из них во время задач — ${c.task}` : ''}.</p>${top ? `<p class="small">Чаще всего: ${top}.</p>` : ''}<p class="small">Подглядывать не наказывается: так ребёнок учится находить правило сам. Если какую-то шпаргалку открывают постоянно — эту тему стоит повторить вместе.</p></div>`); } return r; }; }

  /* ---------- стили ---------- */
  const css = `
  .cs-btn { flex-shrink: 0; width: 42px; height: 42px; border-radius: 14px; background: #FFF8D6; box-shadow: var(--sh); font-size: 21px; display: grid; place-items: center; border: 2px solid #F1DFA0; padding: 0; }
  .cs-btn:active { transform: scale(.94); }
  @media (max-width: 420px) { .cs-btn { width: 36px; height: 36px; font-size: 18px; border-radius: 12px; } }
  @media (max-width: 340px) { .cs-btn { width: 32px; height: 32px; font-size: 16px; } }
  .modal.cs-modal { align-items: flex-end; padding: 0; }
  .sheet.cs-sheet { max-width: 680px; border-radius: 26px 26px 0 0; max-height: 90vh; padding: 8px 14px 18px; text-align: left; animation: up .25s; background: #FBF3DF; }
  .cs-grab { width: 48px; height: 5px; border-radius: 3px; background: #D8C9A8; margin: 2px auto 6px; }
  .cs-head { display: flex; align-items: center; gap: 10px; position: sticky; top: -8px; background: #FBF3DF; z-index: 2; padding: 4px 0; }
  .cs-head h2 { flex: 1; margin: 0; font-size: 22px; }
  .cs-x { width: 40px; height: 40px; border-radius: 50%; background: #fff; box-shadow: var(--sh); font-size: 18px; flex-shrink: 0; }
  .cs-ok { margin: 2px 0 8px; font-size: 15px; color: var(--mint-d); font-weight: 700; }
  .cs-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 10px; }
  .cs-tab { padding: 8px 12px; border-radius: 999px; background: #fff; box-shadow: 0 3px 0 rgba(59,42,74,.1); font-weight: 800; font-size: 15px; line-height: 1.15; max-width: 100%; }
  .cs-tab.on { background: var(--ink); color: #fff; }
  .notebook .cs-card { position: relative; background: #FFFDF6; background-image: repeating-linear-gradient(transparent 0 31px, #E3EDF7 31px 32px); border-radius: 6px 18px 18px 6px; padding: 12px 12px 14px 22px; margin-bottom: 14px; box-shadow: 0 4px 0 rgba(120, 90, 40, .12), 0 8px 18px rgba(120, 90, 40, .08); border-left: 3px double #F08A8A; scroll-margin-top: 64px; font-size: 17px; line-height: 1.45; overflow-wrap: break-word; }
  .notebook .cs-card.focus { outline: 3px solid var(--gold); animation: csglow 1.6s 2; }
  @keyframes csglow { 50% { outline-color: transparent; } }
  .cs-ch { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .cs-ch h3 { flex: 1; margin: 0; font-size: 19px; color: #6B3E1E; }
  .cs-say { width: 38px; height: 38px; border-radius: 50%; background: var(--mint-2); font-size: 17px; flex-shrink: 0; }
  .cs-cb p { margin: 6px 0; } .cs-cb .small, .cs-cb small { font-size: 15px; color: var(--muted); display: block; line-height: 1.35; }
  .cs-f { font-size: 21px; font-weight: 800; margin: 4px 0; color: var(--ink); font-variant-numeric: tabular-nums; }
  .cs-eq { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; padding: 4px 0; border-bottom: 1px dashed #E8DCC2; font-size: 19px; }
  .cs-eq b { min-width: 74px; color: #6B3E1E; } .cs-eq span:first-of-type { color: var(--muted); }
  .cs-ex { background: #FFF4C4; border-radius: 12px; padding: 8px 10px; margin: 8px 0; font-size: 17px; }
  .cs-warn { color: var(--red); font-weight: 800; }
  .cs-c { text-align: center; }
  .cs-list { margin: 4px 0; padding-left: 20px; } .cs-list li { margin: 4px 0; }
  .cs-steps { margin: 4px 0; padding-left: 24px; } .cs-steps li { margin: 4px 0; }
  .cs-two { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 14px; align-items: start; }
  @media (max-width: 480px) { .cs-two { grid-template-columns: minmax(0, 1fr); } }
  .cs-col { font: 800 20px/1.2 ui-monospace, 'Courier New', monospace; background: #fff; border: 2px solid var(--grid); border-radius: 10px; padding: 8px 12px; margin: 4px auto; width: max-content; max-width: 100%; overflow: hidden; white-space: pre; color: #3B4A8A; }
  .cs-names > div, .cs-rule { display: flex; flex-direction: column; padding: 6px 0; border-bottom: 1px dashed #E8DCC2; }
  .cs-ex2 { font-size: 20px; font-weight: 800; }
  .cs-rn { font-size: 18px; color: var(--pink-d); } .cs-rr { font-size: 16px; } .cs-rx { font-size: 17px; font-weight: 700; color: #3B4A8A; }
  .cs-order { display: flex; flex-direction: column; gap: 6px; font-size: 19px; font-weight: 800; }
  .cs-order span { background: #fff; border-radius: 12px; padding: 6px 10px; box-shadow: 0 2px 0 rgba(59,42,74,.08); }
  .cs-prop { padding: 6px 0 8px; border-bottom: 1px dashed #E8DCC2; } .cs-prop > b { font-size: 18px; color: #6B3E1E; }
  .cs-prop .cs-f { font-size: 19px; }
  .cs-tri { position: relative; width: 120px; height: 96px; margin: 4px auto 6px; background: linear-gradient(to bottom right, transparent 49.5%, #C9B48A 50%, transparent 51.5%) left/50% 100% no-repeat, linear-gradient(to bottom left, transparent 49.5%, #C9B48A 50%, transparent 51.5%) right/50% 100% no-repeat; border-bottom: 2px solid #C9B48A; font-weight: 900; font-size: 24px; }
  .cs-tri::after { content: ''; position: absolute; left: 28px; right: 28px; top: 54px; border-top: 2px solid #C9B48A; }
  .cs-tri span { position: absolute; } .cs-tri .t { left: 0; right: 0; text-align: center; top: 22px; color: var(--pink-d); } .cs-tri .l { left: 34px; bottom: 6px; color: var(--plum); } .cs-tri .r { right: 34px; bottom: 6px; color: var(--mint-d); }
  .cs-tt { display: grid; grid-template-columns: repeat(11, minmax(0, 1fr)); gap: 2px; max-width: 480px; margin: 4px auto; }
  .cs-tt .tc { aspect-ratio: 1; display: grid; place-items: center; font-weight: 800; font-size: clamp(12px, 3.7vw, 18px); background: #fff; border-radius: 6px; padding: 0; min-width: 0; color: var(--ink); box-shadow: none; font-variant-numeric: tabular-nums; }
  .cs-tt .tc.hd { background: #FFE7B8; color: #6B3E1E; cursor: pointer; } .cs-tt .tc.c0 { background: transparent; cursor: default; }
  .cs-tt .tc.sq { background: #F3EEFF; }
  .cs-tt .tc.n3 { font-size: clamp(10px, 3vw, 16px); letter-spacing: -.5px; white-space: nowrap; }
  .cs-tt .tc.hard { background: #FFD6E2; color: #B0204E; box-shadow: inset 0 0 0 2px #FF8FB1; }
  .cs-tt .tc.hl { background: #DDF4EC; } .cs-tt .tc.hd.hl { background: var(--mint); color: #fff; }
  .cs-tt .tc.sel { background: var(--pink); color: #fff; transform: scale(1.12); position: relative; z-index: 1; box-shadow: 0 3px 8px rgba(224,68,122,.4); }
  .cs-read { min-height: 52px; margin: 8px 0 4px; text-align: center; font-size: 18px; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 14px; align-items: center; }
  .cs-read b { font-size: 24px; color: var(--pink-d); width: 100%; } .cs-read span { font-weight: 700; color: #3B4A8A; }
  .cs-rk { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 3px; max-width: 420px; margin: 4px auto; text-align: center; }
  .cs-cl { background: var(--plum); color: #fff; font-weight: 800; border-radius: 8px; font-size: 15px; padding: 3px 0; } .cs-cl.u { background: var(--mint-d); }
  .cs-rh { background: var(--plum-2); border-radius: 6px; font-size: 14px; font-weight: 700; padding: 3px 0; } .cs-rh.u { background: var(--mint-2); }
  .cs-rd { background: #fff; border-radius: 8px; font-size: 28px; font-weight: 900; padding: 4px 0; color: var(--plum); } .cs-rd.u { color: var(--mint-d); }
  .cheats-page .cs-intro { display: grid; grid-template-columns: auto 1fr; column-gap: 10px; align-items: center; background: #8A5A35; color: #FFF6E0; border-radius: 18px; padding: 12px 14px; margin-bottom: 12px; box-shadow: var(--sh); }
  .cheats-page .cs-clip { grid-row: span 2; font-size: 32px; } .cheats-page .cs-intro b { font-size: 20px; } .cheats-page .cs-intro small { font-size: 15px; opacity: .9; }
  .t-cheats .ti { background: #FFF1C7; }
  `;
  { const st = document.createElement('style'); st.id = 'cheats-css'; st.textContent = css; document.head.appendChild(st); }

  return { SHEETS, open, context, sheet, last: () => lastOpen };
})();
window.Cheats = Cheats;
