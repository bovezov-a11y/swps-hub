#!/bin/sh
# Rebuilds the demo database from scratch and seeds it, so every recording starts from the same state.
set -e
cd "$(dirname "$0")"
docker compose -p swps-demo -f compose.demo.yaml down -v
docker compose -p swps-demo -f compose.demo.yaml up -d
until [ "$(curl -s -o /dev/null -w '%{http_code}' localhost:3100/api/programs)" = "401" ]; do sleep 2; done
node seed.mjs > /dev/null
echo "Demo data ready at http://localhost:3100"
