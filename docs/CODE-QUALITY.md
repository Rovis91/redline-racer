# Code quality

Rules this repo actually follows. When in doubt, match the code around you. Architecture and tools: [ARCHITECTURE.md](ARCHITECTURE.md).

## Style

- Identifiers, comments and docs are in English. Only on-screen game text is written in French (see the UI strings rule below).
- Plain browser JavaScript, no build, no transpiler, no lint config, no npm dependencies. 2-space indent, semicolons, single quotes, `const` and arrow functions, short names, dense lines. Follow the surrounding density rather than reformatting.
- Every file starts with a comment that says what it does; tools also give their usage there (`tools/plan.js`, `tools/bench-quick.js`, …). Keep that header true when you change the file.
- Comments explain why (a measured cost, a trap, a choice), not what the line does. Units and ranges go in the comment next to the value (`grip` in m/s², point indices, metres).
- A shortcut with a known limit gets a comment in this form: `// shortcut: <the limit>, <when to upgrade>`. List them with `grep -rn "shortcut:" src tools tests pages`.
- Files that run under Node as well as in the page (`sim.js`, `session.js`, `lang.js`, `devices.js`) use the `(function (G) { … Object.assign(G, { … }) })(typeof window !== 'undefined' ? window : globalThis)` pattern and touch no DOM.

## Repo layout rules

- No JavaScript at the repo root.
- File names are unique across the whole repo (`scenery-perse.js`, not `perse/scenery.js`): tools, profiles and stack traces cite bare names (`scenery-perse.js:29`), and `tools/origins.js` relies on it.
- Declare scripts in `src/data/map-assets.js`: shared engine scripts in `core`, circuit scripts in their ordered `maps[scenery]` list. Only the selected circuit is downloaded. `tests/test-loading.js` checks every circuit file and isolated registration.
- `local/` and `captures/` are ignored by git: tool output goes to `captures/`, never into tracked folders.
- Menu response is bounded by 500 ms: never construct scenes or run simulation in a menu command. Keep `node tools/bench-menu.js` and its offline-preview variant passing. Track/scenery edits need fresh menu cards/previews.
- Do not hand-edit generated files; rerun their generator: `src/data/menu-cards.js` (`node tools/build-menu-cards.js`), `assets/previews/*.webp` (`node tools/build-menu-previews.js`), `src/data/gold-laps.js` (`node tools/build-gold-laps.js`), `vendor/three/three.classic.js` (`node tools/three-classic.js`), `src/audio/instruments.js` and `instruments-notes.js` (`tools/instruments.py`), `assets/fonts/dotgothic16-game.woff2` (`tools/font.py`).
- Patches inside `vendor/three/three.module.js` are marked `// vpr` and must be redone on any three.js update.

## Tests and the pre-commit hook

- Run `sh tools/check.sh` before committing. Once per clone: `git config core.hooksPath tools/hooks`; the hook then runs it for any commit that touches a `.js` file. Do not bypass it.
- A new test is a `tests/test-<name>.js` file that exits non-zero on failure (`assert`); `check.sh` picks it up automatically.
- Tests check what can be observed from outside (positions, times, places, scores, finishing order), not internal state, so they survive rewrites.
- What is not covered (rendering, HUD, sound, split screen) is checked by hand in the browser and with `node tools/plan.js` captures before and after.

## Determinism

- `src/engine/sim.js` has no rendering, no DOM, no `Math.random`, and reads no global map: everything comes through `buildTrack(THREE, map)` and the track `T`. Physics steps at a fixed `H = 1/120` s. Keep it that way: tests, benches, gold traces and medals all depend on it.
- `tests/test.js` freezes the reference times of `ville`. If a physics change moves them, that is a decision, not a test to update quietly: rerun `node tools/build-gold-laps.js`, check `tests/test-maps.js`, and bump the record/link version (`CHALLENGE_V`, `vpr7` prefix) if old times are no longer comparable.
- Scenery placement draws from the seeded `rnd` of `game.js`. Order of calls matters: `h.mat` draws from `rnd` (its textures), so it must still be called even when you reuse a shared material; skipping a call moves the rest of the scenery.
- Challenge links carry positions, never inputs: the sim is not bit-identical across browsers.

## Shared files need care

All 18 maps run on the same engine. These files are shared: `src/engine/sim.js`, `src/engine/game.js`, `src/engine/session.js`, `src/audio/audio.js`, `src/data/maps.js`, `src/render/textures.js`, `src/render/shapes.js`, `src/render/scenery.js`, `vendor/three/`.

- Fix a map in its own folder (`src/maps/<map>/`) first. Touch the engine only when several maps need the same thing.
- A new engine feature is an option **absent by default**, switched on by a field of the map entry (`th.smooth`, `th.layerSet`, `jumps`, `surf`, …). A map that does not set it must behave and render exactly as before: same shaders, geometries, textures and draw calls. See [methods/MAP-ENGINE-OPTIONS.md](methods/MAP-ENGINE-OPTIONS.md); try an option without editing data with `?opt=<JSON>` or `OPT='…' node tools/bench-quick.js <map>`.
- After an engine change, prove the other maps did not move: `tests/test-maps.js` output unchanged, `node tools/bench-quick.js` on all maps, captures of a few maps.
- Debug and review switches are URL parameters (`?auto`, `?hitbox`, `?opt`, `?style`, `?perf`), off by default; nothing they do is saved.
- With 2+ players nothing is read from or written to records, medals, ghosts, trophies or the Tour.

## Map instance lifecycle

Each map is a `launchGame` instance that can be suspended and resumed without reloading the page.

- Page listeners go through the file's local `addEventListener` (one `AbortController`, cut in `ending()`). A new timer or DOM element must also be undone in `ending()`.
- GPU resources outside the scene must be freed in `frees()`.
- `chain()` from `tools/perf.js` must show the same geometry, texture and shader counts on the second pass through all maps as on the first.

## Performance rules

Budgets and how to measure are in [ARCHITECTURE.md](ARCHITECTURE.md#performance-budgets). After touching rendering or scenery, run `node tools/bench-quick.js [map]`. Draw calls and vertices are the numbers to compare; milliseconds are noisy. Do not undo these:

- **Static scenery is merged** into one mesh per material. Anything that moves, animates or toggles visibility must carry `userData.dyn = 1` (itself or a parent), including a moving `InstancedMesh`; `(await import('./tools/perf.js')).movables()` lists the ones you missed. A static object must not carry `dyn`.
- One material per tint makes one draw call per tint: share materials with the same settings (but still call `h.mat`, see Determinism). An emissive material is not shared between a small and a large object.
- Fewer vertices: no detail smaller than a pixel at 270 lines; low segment counts; remove what is far or hidden by terrain; faces hidden by a neighbour or the ground go.
- `castShadow` only where it shows. Moving shadow casters go on the `SHDD` / `SHDI` layers; static shadows are redrawn only when the light steps.
- Everything is compiled and uploaded at load (`renderer.compileAsync`, 8 × 8 warm-up frame): no material or texture should appear for the first time mid-race.
- No arrays or objects allocated per frame in per-particle or per-drop loops (garbage-collector hitches). Empty particle clouds are hidden.
- Sound: one-shot sounds create their nodes after the frame (`defer`), bursts of short hits go into a buffer, and an audio parameter is sent only when it changed (`setParam`). Never create hundreds of nodes in one frame.
- Load size: keep heavy files out of `index.html` (they load on demand); new Japanese text means rerunning `python -I tools/font.py` (`tests/test-font.js` checks it).

## UI text

- UI strings are written in French capitals. Every new displayed string needs its English line in `EN` of `src/engine/lang.js`; `tests/test-lang.js` fails otherwise. A new map needs its English title (`HEADING_EN`, or `th.hud.heading`).

## Docs

- Keep docs current with the code: when you change a behaviour, a tool or a budget, update the doc that states it. Docs say what is true now; no history, changelogs or dated measurements beyond the current reference.
