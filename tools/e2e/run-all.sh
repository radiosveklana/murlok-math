#!/usr/bin/env bash
# Полная проверка перед выкладкой: bash tools/e2e/run-all.sh   (URL=https://... — проверить живой сайт)
cd "$(dirname "$0")"; [ -d node_modules ] || npm i --silent
ROOT=$(cd ../.. && pwd); FAIL=0
# версии должны совпадать: app.js, version.json, index.html, sw.js
AV=$(grep -o "APP_VERSION = '[0-9]*'" "$ROOT/app.js" | grep -o "[0-9]*"); VJ=$(grep -o "[0-9]\+" "$ROOT/version.json"); IV=$(grep -o "app.js?v=[0-9]*" "$ROOT/index.html" | grep -o "[0-9]*$")
echo "версии: app=$AV version.json=$VJ index=$IV"; [ "$AV" = "$VJ" ] && [ "$AV" = "$IV" ] || { echo "ВЕРСИИ НЕ СОВПАДАЮТ ✖"; exit 1; }
for f in "$ROOT"/*.js "$ROOT"/content/*.js; do node --check "$f" || { echo "СИНТАКСИС ✖ $f"; exit 1; }; done
node "$ROOT/tools/validate-content.js" "$ROOT"/content/*.js >/dev/null || { echo "КОНТЕНТ ✖"; node "$ROOT/tools/validate-content.js" "$ROOT"/content/*.js | grep ✘; exit 1; }
if [ -z "$URL" ]; then (cd "$ROOT" && python -m http.server 8765 >/dev/null 2>&1 &) ; sleep 2; fi
run() { echo "== $1"; out=$(timeout 420 node "$1" $2 2>&1 || echo "FAIL timeout/crash"); echo "$out" | grep -E "ERRORS|errs|MISSES|VOICE|FAIL|cat class|water:|login modal|music-on|CLOUD|PHYSICS|INTERRO|COLLIDE|OVERFLOW|TALK|ACAD FAIL|ACAD DONE|V19 FAIL|V19 DONE" ; echo "$out" | grep -qE "FAIL|PAGEERR|errs: [^n]|OVERFLOW [0-9]|ACAD FAIL|V19 FAIL" && FAIL=1; }
run full.js "820 1180 E"; run games.js; run voice.js; run house-touch.js; run login.js; run cloud.js; run overflow.js; run academy.js; run v19.js
[ $FAIL = 0 ] && echo "ВСЁ ЗЕЛЁНОЕ ✔" || { echo "ЕСТЬ ОШИБКИ ✖"; exit 1; }
