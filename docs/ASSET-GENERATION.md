# Asset generation

Almost nothing in the game is an image or a model file. Textures are painted on 2D canvases at load time, shapes are three.js geometry built in code, music and sound are synthesised. The rules for how things should look are in `docs/ART-STYLE.md`. This page covers how assets are made and where each kind lives.

The scenery has three separate parts, each in its own file:

| Part | Shared catalogue | Per-map addition | Says only |
|---|---|---|---|
| Texture | `src/render/textures.js` (`TEXTURES`) | `src/maps/<map>/textures-<map>.js` | what a surface looks like |
| Shape | `src/render/shapes.js` (`SHAPES`) | `src/maps/<map>/shapes-<map>.js` | the geometry |
| Placement | `src/render/scenery.js` (`PLACERS`, empty `SCENERY`) | `src/maps/<map>/scenery-<map>.js` | where to put which shape with which texture |

Per-map files extend the catalogues with `Object.assign(TEXTURES, { … })`, `Object.assign(SHAPES, { … })` and `Object.assign(SCENERY, { … })`. Treat the shared catalogues as read-only from map work. Every new file needs a `<script defer>` line in `index.html`, in load order (`tests/test-maps.js` checks this). File names are unique across the repo.

## Textures (canvas)

An entry takes one of two forms (see the header of `src/render/textures.js`):

```js
lampObj: 0xfff2d0,                                   // flat colour: ONLY for things that emit light (lamps, lights, neon, signal paint)
concretePart: (...settings) => [64, 64, (g, o) => { … }, 8] // drawing: [width, height, draw(ctx, tools), tile metres (optional)]
```

`o` holds the tools passed by `tx()` in `src/engine/game.js`:
- `R(g, colour, x, y, w, h)`: fill a rectangle. Everything is drawn with whole-pixel rectangles; gradients are rare (soft mist sprites only).
- `veil(g, alpha, f)`: draw `f` at that opacity (dirt, wear, joints over any tint).
- `rand()`: **the texture's own random generator, seeded by its name and settings.** Use it for every new drawing.
- `rnd`: the random generator shared with placement. Never add calls to it: every later object on the map would move. `speckle` uses `rnd` for the same historical reason.

Conventions:
- **Density: 8 px per metre** (the `M = 8` tile: 64 px for 8 m), the density of the road. A drawing with `tile` repeats every `tile` metres on boxes instead of stretching over each face (`clothe` in `game.js` uses the geometry's `userData.dim`). Choose sizes that keep pixels square on the target surface.
- **Sizes are small powers of two**: 16, 32, 64, 128, rarely 256 or 512 (`roadwayFine` is 128x512). Bigger textures cost memory and blur into one tone at 270 lines anyway.
- **No plain surfaces**: a base tone, then grain (`patina`), joints or ribs, then wear (`drips`, chips, rust). The shared recipes `concretePart`, `stone`, `metal`, `ground`, `bark`, `leaves` in `textures.js` show the pattern.
- **Light tints get coloured at placement**: `mat('paint', { c: 0xf08a1a })`. Map-specific colours (road, walls, rails) stay in the map's theme in `src/data/maps.js` and arrive as settings (for example `roadway(asph, spk, edge, dash, k1, k2, wet)` takes `th.road`).
- **Text on signs**: bold sans-serif drawn with `fillText` at pixel size, shrunk to fit (see `plainText` in `src/maps/terre/textures-terre.js`). Brands and sponsors are invented.
- **Comment every entry** with what it depicts, its real-world scale and its tile (e.g. "4 m per tile, 12 x 9 cm setts"). Reference-driven textures cite their refs line (`REFS 1 — …` in `src/maps/barrage/textures-barrage.js`).
- No periodic stripes along the driving direction on large surfaces (`docs/ART-STYLE.md`, rule 2).

Using a texture: `mat('name', options, ...settings)` in `game.js` (`h.mat` from a decor file). Options: `emis` (unlit, emits), `c` (tint), `gloss`, `retroRefl` (retroreflective under the dynamic lights), `rep` (repeat), `net` (no mipmaps), `smooth` (linear filtering), plus any three.js material option. Lit materials are `MeshLambertMaterial`, `emis` ones `MeshBasicMaterial`.

**To add one:** write the entry in `textures-<map>.js` (or `textures.js` for something truly shared), draw it with `rand`, use it via `h.mat`, then check it with `node tools/plan.js <map> <shot>` before/after.

## Shapes (low-poly geometry)

Header of `src/render/shapes.js`: **metres, origin at the foot of the object**. Two kinds:
- **Simple shape**: returns a three.js geometry, placed once (`pose`) or many times (`inst`). Build boxes with `B(w, h, d, H)` so that `userData.dim = [w, H, d]` drives texture density; `H` is the typical height of a box stretched per instance. Low segment counts: `ConeGeometry(3.6, 15, 5)`, `IcosahedronGeometry(r, 0)`, cylinders with 8 sides.
- **Assembly**: returns a list of boxes `[zone, width, height, depth, x, y, z, [rx, ry, rz], castsShadow]`. The zone names the part, and placement maps zones to materials: `pose('station', { steelMat: …, lampObj: … }, parent, [x, y, z])`.

Orientation is per file and stated in each `shapes-<map>.js` header. Read it before adding:
- `src/maps/touge/shapes-touge.js`: X away from the road, Z along it.
- `src/maps/perse/shapes-perse.js`: roadside pieces have X along the track and Z away from it. Pieces on the road use the road frame (`marker` in `scenery.js`): X across, Z backwards, toward the oncoming car.

Placement tools (`PLACERS` in `src/render/scenery.js`):

| Tool | Use |
|---|---|
| `inst` | many copies of one shape, one draw call |
| `insts` | many copies of an assembly, one draw call per zone, optional per-copy tint |
| `boxMesh` | a single box of free size |
| `edgePt` | a point beside the road |
| `marker` | a group in the road frame at a track sample |
| `near`, `pt` | nearest track sample |
| `weld` | merge a group into few meshes |
| `terrain` | height field through the road, with material layers (`layerSet`) |

Lights are declared with `h.emis(i, x, y, z, colour, range, strength)`.

Performance: prefer instancing and merging. Share one material per tint across neighbours, because one material per tint makes one batch per tint. Check with `node tools/bench-quick.js --profile <map>`, which reports draw calls per placing line.

**To add one:** define it in `shapes-<map>.js` at real size, reusing shapes from other maps before creating new ones (Paris birds, touge pines). Place it from the race camera, then check `--view=` for the model and `--step=15` for visibility (see `docs/ART-STYLE.md`). A new map starts as a block mock-up: plain boxes, cylinders and cones at final size, labelled, then replaced zone by zone (`docs/methods/`).

## Cars

- **Shape**: `src/render/shapes-cars.js`. Each model in `MODELS` (`gtr`, `fd`, `a80`, `peykan`, `r5`, `gts`, `zil`, `onca`) has a side profile extruded across the width, with wheel arches cut out and chamfered edges, a narrower cabin, and parts (bumpers, wing, mirrors, lights). These are merged into one geometry per zone: `carBody` (body, takes the livery), `blackM` (plastics), `headlight`, `fire`. Frame: metres, **X forward, Y up, origin on the ground at the car's centre**. Wheels are separate (`wheelCar`) because they spin and steer.
- **Livery**: `livery(plan, colour, stripes)` in `src/render/textures-cars.js`. It is a 128x128 image at 24 px/m, painted like a technical drawing: side view, top view, front and rear, at the coordinates given by `plan` (`plan.sideOf`, `plan.above`, `plan.av`, `plan.ar`). Each face takes the view of its main axis. Undersides take a dark flat colour. Bold base colour, no material tint (glass, plastics and plate keep their colour). Shine comes from `gloss`. Dark colours are lightened toward silver so they read at night.
- **Per map**: `car.look` in `src/data/maps.js`. It sets `type` (a `MODELS` key), `col`, `stripes` (stripe colour), size factors `l`/`w`/`h`, `nose`, `cab` and `tailFin`. `game.js` builds one livery per colour: the player's and one per opponent (`OPP`).
- **To add a model:** add a `MODELS` entry (profile, cabin, wheels, door lines, parts) and set `look.type` on the map. Car names are invented; specs are inspired by real cars.

## Audio (synthesised)

- `src/audio/audio.js` produces all sound in real time with Web Audio. Each map has three radio stations, defined as data in `RADIO` at the top of `src/data/maps.js` (tempo, kit, timbres, progressions, motifs, sections, form). The code also has the instrument timbres (`PATCH`), drum kits (`KIT`), menu music, place ambience by zone (`amb`), tunnels, engine, gearbox, tyres, rain, impacts and UI sounds. Music reacts to the race.
- Samples are base64 in JS, so the game also runs from `file://`:
  - `src/audio/samples.js`: TR-808 from `assets/samples/*.ogg`. Re-encode by hand into `window.SMP` after changing a sample.
  - `src/audio/instruments.js`: waveforms and drums, generated by `python -I tools/instruments.py <FluidR3_GM> <AKWF> <ffmpeg>`.
  - `src/audio/instruments-notes.js`: sampled notes (FluidR3_GM, CC BY 3.0). `audio.js` loads it on demand at the first station, not at start-up.
- Tools: `pages/listen.html` (listen to each station, ambience and effect alone; mix by family; levels) and `pages/editor.html` (music editor). Tune every new sound against the map's music before shipping.

## Files in `assets/`

| Path | Content |
|---|---|
| `assets/fonts/` | Press Start 2P, and DotGothic16 full plus a game subset. Regenerate `dotgothic16-game.woff2` with `python -I tools/font.py` after any new Japanese text; `tests/test-font.js` checks no glyph is missing |
| `assets/samples/` | original TR-808 `.ogg` files and their licence note `TR808.TXT` |
| `assets/icon.svg` | site icon |
| `assets/ui.css` | shared style of the tool pages |

`vendor/three/three.classic.js` is three.js r187 as a classic script, generated by `tools/three-classic.js`. README images live in `.github/images/`.

## Moodboards (image generation)

Each folder in `docs/proposals/<map>/` holds the prompt used for its `moodboard.png`:
- `sky-pillars/PROMPT.md`
- `aegean-cliffs/PROMPT_IMAGEGEN.md`
- `sunken-highway/PROMPT_IMAGEGEN.md`
- `lunar-outpost/imagegen-prompt.txt`

These images are references for direction only and never ship in the game. How the prompts are written:
- **A contact sheet, not a single picture**: a fixed grid (2 columns x 4 or 5 rows), equal panels, thin dark gutters, usually no text (or only short row headers).
- **Rows follow the lap**: one row per zone, in driving order.
- **Left column: the real reference** (place, architecture, geology). **Right column: the same idea as a retro game frame**, seen from a chase camera behind a small boxy 1980s-90s car, with the road visible (width in metres, barriers, open readable curve). A variant puts gameplay on the left and an asset close-up on the right.
- **State the style explicitly**, then what to avoid. For example: "actual 1995-1998 low-poly console racing graphics, coarse nearest-neighbor pixel textures, flat angular faces, 480x270 aesthetic, dithered distance; NOT photoreal, NOT modern Unreal, NOT painterly".
- **Give the palette and the time of day** in one line.
- **List the anti-references and the map's known failure modes**: no floating islands, rooted bases visible, readable asphalt, no repeated bridges.
- Optionally pass real game frames as style references (`.github/images/circuits.jpg`).

## Loading budget

`node tools/load.js [map]` measures the game as a player opens it on GitHub Pages: gzip, `max-age=600`, cold cache, 10 Mbit/s with 100 ms latency, CPU slowed x2. `--all` measures every map, `--detail` lists the 15 largest files, `--profile` lists the slow functions. `BUDGET` in `tools/load.js`:

| Measure | Limit |
|---|---|
| bytes transferred (gzip) | 2.5 MB |
| requests | 60 |
| ready (`window.__g.M`) | 6 s |
| next visit (warm cache) | 3 s |

What this means for assets:
- Canvas textures and code shapes cost almost no bytes.
- Large data waits until it is needed (the sampled notes).
- Fonts are subset.
- Any new binary file (image, sound, model) must justify its weight against this budget.

The runtime frame budget is separate: `node tools/bench-quick.js [map]` against `tools/perf.js`.
