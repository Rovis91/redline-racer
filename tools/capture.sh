#!/bin/sh
# Headless capture: Chrome headless opens tools/captures.html and waits for captures/<map>.json. The tools/capture.py server must be running.
# Usage, from the root: sh tools/capture.sh terre "pas=6"     or     sh tools/capture.sh terre "idx=300,340&view=90,12,4"     (PORT=8841 by default; ATTENTE=300: maximum wait in 2 s steps, 120 by default, raise it with jeu=1 or taille=)
carte=$1; port=${PORT:-8841}; rm -f captures/$carte.json captures/$carte-*.jpg
"${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}" --headless=new --no-first-run --user-data-dir="${TEMP:-/tmp}/chr-$carte" --window-size=1000,700 --enable-unsafe-swiftshader --ignore-gpu-blocklist --remote-debugging-port=0 "http://127.0.0.1:$port/tools/captures.html?map=$carte&$2" >/dev/null 2>&1 &
p=$!; i=0; while [ ! -f captures/$carte.json ] && [ $i -lt ${ATTENTE:-120} ]; do sleep 2; i=$((i+1)); done; kill $p 2>/dev/null
[ -f captures/$carte.json ] && ls captures/$carte-*.jpg && grep -E '"(idx|erreurs|msParImage)"' captures/$carte.json | tr -d '\n' || { echo "FAILED: no captures/$carte.json"; exit 1; }
