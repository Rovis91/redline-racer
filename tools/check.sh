#!/bin/sh
# All repo tests (tests/test*.js). One line per test; on the first failure, its output then exit code 1.
# Run before each commit by tools/hooks/pre-commit (hook it up once per clone: git config core.hooksPath tools/hooks).
cd "$(dirname "$0")/.." || exit 1
cd tests || exit 1
for t in test-lang.js test-devices.js test-session.js test.js test-maps.js test-*.js; do
  case " $faits " in *" $t "*) continue ;; esac; faits="$faits $t" # short ones first, then any test added since
  if s=$(node "$t" 2>&1); then echo "OK     $t"; else echo "FAIL   $t"; echo "$s" | head -30 | cut -c1-400; exit 1; fi
done
