#!/usr/bin/env bash
# Параллельный прогон всех тестов (≈10 мин): bash tools/e2e/run-par.sh
cd "$(dirname "$0")"; [ -d node_modules ] || npm i --silent
ROOT=$(cd ../.. && pwd); OUT=$(mktemp -d); FAIL=0
AV=$(grep -o "APP_VERSION = '[0-9]*'" "$ROOT/app.js" | grep -o "[0-9]*"); VJ=$(grep -o "[0-9]\+" "$ROOT/version.json"); IV=$(grep -o "app.js?v=[0-9]*" "$ROOT/index.html" | grep -o "[0-9]*$")
echo "версии: app=$AV version.json=$VJ index=$IV"; [ "$AV" = "$VJ" ] && [ "$AV" = "$IV" ] || { echo "ВЕРСИИ НЕ СОВПАДАЮТ ✖"; exit 1; }
for f in "$ROOT"/*.js "$ROOT"/content/*.js; do node --check "$f" || { echo "СИНТАКСИС ✖ $f"; exit 1; }; done
node "$ROOT/tools/validate-content.js" "$ROOT"/content/*.js >/dev/null || { echo "КОНТЕНТ ✖"; exit 1; }
curl -s -o /dev/null http://localhost:8765/ || { (cd "$ROOT" && python -m http.server 8765 >/dev/null 2>&1 &); sleep 2; }
T="overflow.js;full.js|820 1180 E;academy.js;v19.js;v20.js;voice.js;games.js;house-touch.js;login.js;cloud.js"
IFS=';' read -ra TESTS <<< "$T"
for t in "${TESTS[@]}"; do n=${t%%|*}; a=""; [[ "$t" == *"|"* ]] && a=${t#*|}; ( timeout 600 node $n $a > "$OUT/$n.log" 2>&1 || echo "FAIL timeout/crash" >> "$OUT/$n.log" ) & sleep 3; done
wait
for t in "${TESTS[@]}"; do n=${t%%|*}; echo "== $n"; grep -E "ERRORS|errs|MISSES|VOICE|FAIL|cat class|water:|login modal|music-on|CLOUD|PHYSICS|INTERRO|COLLIDE|OVERFLOW|TALK|ACAD DONE|V19 DONE|V20 DONE" "$OUT/$n.log" | grep -v "^sec"; grep -qE "FAIL|PAGEERR|errs: [^n]|OVERFLOW [0-9]" "$OUT/$n.log" && FAIL=1; done
[ $FAIL = 0 ] && echo "ВСЁ ЗЕЛЁНОЕ ✔" || { echo "ЕСТЬ ОШИБКИ ✖ (логи: $OUT)"; exit 1; }
