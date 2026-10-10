#!/usr/bin/env bash
# Выкладка статики на свой сервер: bash tools/deploy-site.sh  → https://murlok.tech-wave.ru
set -e; cd "$(dirname "$0")/.."
tar czf - --exclude=./.git --exclude=./.claude --exclude=./tools --exclude=./server --exclude=./docs --exclude='*.md' --exclude=./node_modules . | ssh tw 'mkdir -p /var/www/murlok.new && tar xzf - -C /var/www/murlok.new && rm -rf /var/www/murlok.old && mv /var/www/murlok /var/www/murlok.old && mv /var/www/murlok.new /var/www/murlok && chown -R www-data:www-data /var/www/murlok && echo deployed'
