# Reworking a map's scenery without wasting tokens

Goal: one session per map, run in parallel, that do not step on each other and where the expensive model never reads an image.

## Who does what

| Step | Who | Input | Output |
|---|---|---|---|
| 1. Map analysis | **Sonnet** subagent | the two boards of the lap (`plan.js <map> lapRun`) | a written list of findings, one per capture (what is seen, what is wrong, at which track sample) |
| 2. Modelling | the orchestrator (**Opus**) decides and writes, or hands a well-specified shape to a Sonnet subagent | the findings + the author's request | shapes, textures, placement |
| 3. Model validation | **Sonnet** subagent | the before/after pair of each modified plan, `--view=` for one object | per object: conforms / precise defect |
| 4. Lap revalidation | **Sonnet** subagent | the two redone boards of the lap + the tests | comparison with step 1, console errors, frame time, tests |

Economy rules:
- **The orchestrator reads no image.** Only the Sonnet subagents open the captures; they return short text, with the file name and the track sample.
- **A critic reads boards** (12 views per image), never captures one by one. A full lap fits on two boards.
- **One critic per zone or per step**, with its boards and a precise question. Two critics never receive the same images.
- The full lap is redone only at step 4; in between, only the touched plans, as before/after pairs.

## Where to place scenery: where the player sees it

The most frequent mistake: scenery placed in the empty spaces of the map but outside the racing camera's field of view. It is only seen when stopped, turning the camera: it costs without bringing anything.

- **Start from the camera, not from the map plan.** The gaps to fill are those shown by the racing-camera captures, not those seen on the top-view map. The player does not move their camera: an object hidden by a building, out of the field of view or seen only from very far does not exist for them (on a beach map, a big wheel seen from afar then hidden up close between two buildings).
- **The further away, the bigger.** Fine detail reads only at the edge (0 to 15 m). At mid range (15 to 80 m), volumes read. In the background (beyond 80 m), only a silhouette: it must be large to exist.
- **The more to the side, the simpler.** In peripheral vision and at full speed, an object is understood by its shape and colour, bold and contrasting with the background. An object loaded with small details at the side reads as noise.
- **Validate by driving.** Scenery is accepted when it is seen and recognised on `node tools/plan.js <map> <plan> --step=15`, in the racing camera, at lap speed. `--view=` is for inspecting the model; it never proves that it is seen. What appears in no racing-camera capture is moved or removed.

## The capture tool

`node tools/plan.js` renders an image in about two seconds, without driving to the spot. The track is cut into 20 plans (plan 14 is the fourteenth twentieth).

```bash
node tools/plan.js wangan lapRun          # the 20 plans, on two boards
node tools/plan.js wangan 14 --before    # before modifying
node tools/plan.js wangan 14            # after: 14.jpg and 14.duo.jpg (before | after)
```

- a precise spot: `@700` (track sample); an object seen up close: `--view=angle,distance,hauteur`; a spot you revisit often: `--name=bridge`, then `node tools/plan.js wangan bridge`;
- what ripples or blinks is only visible in motion: `--burst=6`;
- the image has no interface, to see all the scenery; `--hud` puts it back.

Output goes to `captures/plans/<map>/` (ignored by git), nothing is ever erased. Each copy of the game has its own port, derived from its path. The full manual is at the top of `tools/plan.js`.

`tools/captures.html` remains the tool for a **driven** lap (what depends on the race: damage, forced crashes, lap 3); its parameters are at the top of the file, and `sh tools/capture.sh <map> "<parametres>"` runs it headless.

## Not stepping on each other

Each session works in its own worktree and writes only within its perimeter:

| Session | New shapes and textures | Placement | Other allowed files |
|---|---|---|---|
| wangan | `src/maps/wangan/shapes-wangan.js`, `src/maps/wangan/textures-wangan.js` (create as needed, with their line in `index.html`) | `src/maps/wangan/scenery-wangan.js` | `wangan` entry of `src/data/maps.js`, rain block of `src/engine/game.js` |
| touge | `src/maps/touge/shapes-touge.js`, `src/maps/touge/textures-touge.js` (create as needed, with their line in `index.html`) | `src/maps/touge/scenery-touge.js` | `terrain` function of `src/render/scenery.js`, `touge` entry of `src/data/maps.js` |
| paris | `src/maps/paris/shapes-paris.js`, `src/maps/paris/textures-paris.js` | `src/maps/paris/scenery-paris.js` | `paris` entry of `src/data/maps.js`; `src/engine/sim.js` only if the layout requires it, backed by tests |
| canal | `src/maps/canal/shapes-canal.js`, `src/maps/canal/textures-canal.js` | `src/maps/canal/scenery-canal.js` | `canal` entry of `src/data/maps.js` |
| cars | `src/render/shapes-cars.js`, `src/render/textures-cars.js` | "car" section of `src/engine/game.js` | none |
| start | `startLine` shape of `src/render/shapes.js` | "start line and gantry" block of `src/engine/game.js` | none |

`src/render/shapes.js` and `src/render/textures.js` (shared catalogues) are read, not modified, except by the "start" session for its shape. The per-map files complete the catalogues with `Object.assign(SHAPES, { … })` and `Object.assign(TEXTURES, { … })` (a name exists only once in the whole repo, otherwise the last file loaded silently overwrites the other: suffix it with the map, `kioskPlage`, `chapelTerre`; `tests/test-catalogs.js` checks it), and the placement with `Object.assign(SCENERY, { … })`; the placers that maps share (`inst`, `insts`, `boxMesh`, `terrain`...) are in `src/render/scenery.js`. Nobody touches `src/audio/audio.js`.

## Done when

- the author's request is handled point by point, or a point is flagged as not done with the reason;
- step 4 finds no console error on the map and `sh tools/check.sh` is green;
- frame time has not slipped compared with step 1 (note it before / after);
- everything is committed on the session's branch, nothing pushed; the final message starts with the commits, then lists what changed and what could not be verified (motion, in particular).
