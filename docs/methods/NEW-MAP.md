# Making a map, new or redone

Complements `docs/methods/SCENERY.md` (capture tools, Opus and Sonnet roles, perimeters). Upstream, `docs/methods/TRACK-DESIGN.md` turns an idea into a concept; this method builds it.

Why this method: building the scenery before the layout and terrain are validated means the author discovers on a decorated map that the layout is "only tunnels", that the lake overshoots the dam, or that the road has no jungle mood, and all the scenery placed goes back to scratch. And when every session places objects wherever it likes, the result is floating objects, textures on the road, walls without scenery, and empty zones next to overloaded ones. AI critics do not see these defects: avoid them by construction rather than counting on a review to find them.

The principle: **three validations by the author, each on a playable version, and nothing from the next phase before validation.** The phase 2 blockout fixes where each thing goes; phase 3 only fills those slots.

## Phase 1: moodboard and art direction

The author supplies the moodboard (images). The session writes a one-page spec in the map's proposal folder, `docs/proposals/<map>/`:

- the place, time, light, palette, and the mood in one sentence ("jungle adventure in the Indiana Jones style", not "jungle");
- the zones, in lap order, each with its main landmark and **what makes the transition** to the next (ground, palette, light, density changing gradually);
- the anti-reference of each important element ("not a European castle");
- the references sheet, also in `docs/proposals/<map>/`: two sources per element, 3 to 5 features recognisable at 150 km/h.

**Validation 1:** the author accepts or rejects the spec, point by point. No code before.

## Phase 2: the playable blockout

A single session builds the whole map, without any detail:

- the layout (`pts`, `wide`, `tun`, `jumps`, `surf`), the terrain and its relief, the water levels;
- **all the scenery as blocks**: basic shapes (cubes, cylinders, cones) in a flat colour, at the real size of what they will replace, set on the ground, each with its name written above it ("house", "grove", "temple", "market"). A grove is one big volume, not twenty trees; a district, a few blocks. While driving you must be able to read how things fit together: what lines the road, what closes the view, what serves as a braking landmark, where each transition passes. The named-block placer is one of the shared placers of `src/render/scenery.js` (next to `boxMesh`); a first blockout that lacks it adds it;
- the blocks placed and sized from the racing camera, following "Where to place scenery" in `SCENERY.md`;
- **collision walls only where a block carries them**, checked with `?hitbox`;
- the gearbox and the speedometer scale tuned for the map (no more than a quarter of the lap at the limiter);
- corner notifications on tight corners only;
- one scenery file per zone, `src/maps/<map>/scenery-<map>-<zone>.js`, declared in `index.html`, containing only the zone's blocks: this is what makes phase 3 possible in parallel.

Before handing over: `sh tools/check.sh` green, gold trace redone.

**Validation 2:** the author plays the blockout. They judge the layout, rhythm, speed, width, relief, and the placement of the blocks: what is missing, what is too much, what blocks the view. Every change to layout, terrain or blocks is made here, when it costs nothing. After this validation, **the layout, terrain, water and blocks are frozen**: a change goes through the author.

## Phase 3: the zones, in parallel

One session per zone, each in its own scenery file and shapes. Its job is to **replace each block in the zone with the real scenery, within its footprint**:

- the scenery stays within the block's volume and keeps its base on the block's ground;
- nothing is placed outside a block, except roadside furniture (lamp posts, barriers, signs) listed in the spec;
- every block is filled: no empty zone, no extra object;
- the layout, terrain and collision walls do not move; transition bands between zones belong to the preceding zone;
- reuse the shapes of the existing maps (the birds of paris, the firs of touge) before creating new ones.

For each block replaced: a before (`--before`) and after board from `node tools/plan.js`, `--view=` on the new object, compared with the references sheet; then the validation by driving from "Where to place scenery" (`SCENERY.md`). A zone does not touch animation.

**Validation 3:** the author plays the complete static map and gives feedback as a numbered list. Each point carries its status (done, refused with the reason, checked by which capture). A point marked done without a capture is not done.

## Phase 4: life

Only after validation 3: animations, particles, birds, boats, ambient sounds, destructible elements, following `docs/methods/LIFE.md`. Every new sound is tuned against the map's music before handing over. Every animation is checked with `--burst`. Reuse what exists on the other maps before creating.

## Phase 5: performance

`node tools/bench-quick.js <map>` against the budget of `tools/perf.js`, two passes to tell a spike at the same place (a real problem) from a random spike (the machine). A change visible to the player is put to the author first.

## What each session hands back

The commits on its branch, nothing pushed; the points of the request one by one (done, or not done with the reason); what was not verified, in particular motion.
