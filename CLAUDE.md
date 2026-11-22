# Redline Racer

three.js racing game, static site with no build step. Main doc: `docs/ARCHITECTURE.md` (repo map, technical choices, "where to tune what"). All documentation is in English. `README.md` is the public page.

- **Docs**: `docs/ART-STYLE.md` (graphic style), `docs/ASSET-GENERATION.md` (textures, shapes, cars, sound), `docs/CODE-QUALITY.md` (conventions), `docs/PHYSICS.md` (simulation, damage), `docs/methods/` (new map, track design, scenery, life, per-map engine options), `docs/proposals/` (new maps in preproduction).
- **See a spot on a map**: `node tools/plan.js <map> <shot>`, two seconds, before/after with `--before`. Usage at the top of the file.
- **Map scenery**: `docs/methods/SCENERY.md`; new map or rework: `docs/methods/NEW-MAP.md`. Image critics read contact sheets, one critic per zone.
- **Tests**: `sh tools/check.sh`. The pre-commit hook runs it; once per clone: `git config core.hooksPath tools/hooks`.
- **Performance**: `node tools/bench-quick.js [map]`, `docs/ARCHITECTURE.md` "Performance".
- **Run the game for the author**: the `game` configuration in `.claude/launch.json`. It serves the copy the session runs in; state the branch and commit served, and the map opened.
- **Feedback stays in the conversation**: no feedback logs, specs or dated reports in `docs/`. When a proposal map is built, its folder leaves `docs/proposals/`.

## Repo map (no JS at the root)

`index.html` (game) · `src/{engine,data,audio,render,maps/<map>}` · `pages/` (web tools) · `assets/` · `vendor/` · `tests/` · `tools/` · `docs/`. File names are unique across the repo: `glob **/scenery-perse.js` is enough. `local/` and `captures/` are git-ignored. A new map file must be declared in `src/data/map-assets.js` (test-loading.js checks it).
