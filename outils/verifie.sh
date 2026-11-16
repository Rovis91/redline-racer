#!/bin/sh
# Tous les tests du dépôt (tests/test*.js). Une ligne par test ; au premier rouge, sa sortie puis code 1.
# Lancé avant chaque commit par outils/hooks/pre-commit (à brancher une fois par clone : git config core.hooksPath outils/hooks).
cd "$(dirname "$0")/.." || exit 1
cd tests || exit 1
for t in test-langue.js test-peripheriques.js test-session.js test.js test-cartes.js test-*.js; do
  case " $faits " in *" $t "*) continue ;; esac; faits="$faits $t" # les courts d'abord, puis tout test ajouté depuis
  if s=$(node "$t" 2>&1); then echo "OK     $t"; else echo "ROUGE  $t"; echo "$s" | head -30 | cut -c1-400; exit 1; fi
done
