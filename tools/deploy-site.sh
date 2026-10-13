#!/usr/bin/env bash
# Выкладка статики на свой сервер: bash tools/deploy-site.sh  → https://murlok.tech-wave.ru
# Код и страницы уходят целиком (это быстро), а тяжёлые папки img/ voice/ music/ — только новые и изменённые файлы:
# остальное на сервере копируется жёсткими ссылками из текущей версии. Подмена версии — одним mv, сайт не «мигает».
set -e; cd "$(dirname "$0")/.."
HEAVY="img voice music video"
EXC="--exclude=./.git --exclude=./.claude --exclude=./tools --exclude=./server --exclude=./docs --exclude=*.md --exclude=./node_modules"
for d in $HEAVY; do EXC="$EXC --exclude=./$d"; done
# 1) лёгкая часть
tar czf - $EXC . | ssh tw 'rm -rf /var/www/murlok.new && mkdir -p /var/www/murlok.new && tar xzf - -C /var/www/murlok.new'
# 2) тяжёлые папки: жёсткие ссылки на текущую версию + дозаливка отличий (сравнение по пути и размеру)
LOCAL=$(mktemp); REMOTE=$(mktemp); trap 'rm -f "$LOCAL" "$REMOTE"' EXIT
find $HEAVY -type f -printf '%p %s\n' 2>/dev/null | sort > "$LOCAL"
ssh tw "cd /var/www/murlok 2>/dev/null && find $HEAVY -type f -printf '%p %s\n' 2>/dev/null | sort; for d in $HEAVY; do [ -d /var/www/murlok/\$d ] && cp -al /var/www/murlok/\$d /var/www/murlok.new/\$d; done; true" > "$REMOTE"
CHANGED=$(comm -23 "$LOCAL" "$REMOTE" | sed 's/ [0-9]*$//')
GONE=$(comm -13 <(sed 's/ [0-9]*$//' "$LOCAL") <(sed 's/ [0-9]*$//' "$REMOTE"))
echo "тяжёлых файлов к отправке: $(printf '%s' "$CHANGED" | grep -c . || true), к удалению: $(printf '%s' "$GONE" | grep -c . || true)"
if [ -n "$CHANGED" ]; then printf '%s\n' "$CHANGED" | tar czf - -T - | ssh tw 'cd /var/www/murlok.new && tar xzf - --unlink-first'; fi
if [ -n "$GONE" ]; then printf '%s\n' "$GONE" | ssh tw 'cd /var/www/murlok.new && xargs -r -d "\n" rm -f'; fi
# 3) подмена версии
ssh tw 'rm -rf /var/www/murlok.old && mv /var/www/murlok /var/www/murlok.old && mv /var/www/murlok.new /var/www/murlok && chown -R www-data:www-data /var/www/murlok && echo deployed'
