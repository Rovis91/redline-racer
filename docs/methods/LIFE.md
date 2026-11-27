# Bringing a map to life

The phase that follows static scenery: water, light, motion, wildlife, sound and interactive objects. For where this fits in the sequence, see `docs/methods/NEW-MAP.md` (phase 4). Code is located by name, not line number: search the map's own file in `src/maps/<map>/` (`scenery-<map>.js`) and `src/render/scenery.js` for shared helpers.

## Rules

- **Develop first, measure after.** No performance bench during this phase. Prune at the end if it is too heavy.
- **An idea counts if it is perceptible from the car while driving.** One strong moment per zone beats ten details.
- **Visible to you is not visible to the player**: the rule "Where to place scenery" in `docs/methods/SCENERY.md` applies to what moves too. An object not seen in the racing camera gets neither additions nor animation.
- **Nothing that moves or blinks at a braking point or near the chevrons.**
- **One wind per map**: palms, garlands, smoke and waves all in the same direction.
- **Pure scenery by default**: trains, boats and animals do not collide. Any collidable object must depend on race time, otherwise ghosts and online play desynchronise.
- **Reuse before writing**: the inventory below first.
- Scope and git: one branch per sub-session, nothing pushed; `src/engine/sim.js` and `src/engine/game.js` are shared by all maps: propose to the author before changing them.

## Steps

1. **Common base** (one session): the building blocks in "To build" below.
2. **Per-map analysis** (one read-only sub-session per map): produces a written proposal in `docs/proposals/<map>/`. Grid: each zone of the map x six families (water, light, mechanical motion, living things, sound, interactive). For each idea: what the player perceives, the `idx`, the building block used, the priority. The author's requests come first. Zones that are empty or overloaded are listed separately: that is scenery (`docs/methods/SCENERY.md`), to handle before.
3. **The author ticks** the ideas retained.
4. **Implementation** per map, in batches (water, motion, sound, interactive), `sh tools/check.sh` after each batch.
5. **The author plays**, gives feedback, merge.

## What exists and can be reused

### A scenery's tick

- A scenery function can return `tick(dt, now, car)` (see the `tick` handling in `src/render/scenery.js` and its call in `src/engine/game.js`). `car` is player 1's car.
- `dt` is 0 when paused; `now` (wall clock) keeps running. **Animate on `dt`** so that pause freezes everything.
- `tick.view(car)` is called once per view (split screen): only wangan uses it.
- `h.time()`: traffic clock, -1 during a race.
- **Everything that moves carries `userData.dyn = 1`**, otherwise the scenery merge freezes it.

### Techniques already written (to copy)

| Need | Model | Where |
|---|---|---|
| Flowing water | `flows(m, u, v)`: `Texture.offset` advanced by the tick, two layers | chapada, `src/maps/chapada/scenery-chapada.js` |
| Mover on a loop | `loopSec(u, p)`: ships | wangan, `src/maps/wangan/scenery-wangan.js` |
| Mover on a path, synced to the lap | `overPath`, `trackPath`, `placeCabo` | wangan |
| Instanced vehicles that drive | `fleet()` + `traffic(T, t)` | wangan |
| Mover along the track | cyclist delivery rider | paris, `src/maps/paris/scenery-paris.js` |
| Continuous rotation | lighthouse, fairground ride, big wheel with gondolas kept upright, rotor | wangan, terre |
| Triggered on approach | metal shutter, pigeons taking off | paris |
| Reaction to the race | the wave, sparks on a jump, confetti, hall lights off on the last lap | stade, `src/maps/stade/scenery-stade.js` |
| Blinking | alternating `visible`, `color.setHex` | givre, touge |
| Crowd in two poses, wave | `PLACERS.crowd(h, { tiers, ola })` | `src/render/crowd.js` (stade, canal) |
| Crowd reacting to the race | `PLACERS.crowd(…, placards)`, `tick.lifts(car, kind)`, `SOUND.roar()`: giant banner (tifo) and placards at least 80 m ahead of the car | `src/render/crowd.js` (stade, canal) |
| Scenery object that can be knocked over | `h.breakable(parts, x, y, z, r, h, shards)` | stade barrels, perse jars |
| Screen showing the race live | `tick.liveFeed(renderer)` (320 × 136 target, one frame in four) | stade: video cube hung above the arena, faces turned to the crowd, low enough for the race camera |
| Instanced flames | scale by `setMatrixAt` | stade |
| Undulating vertex strip | auroras | givre |
| Rising points | steam `STM` | chapada |
| Permanent plume | `h.steam(x, y, z)` | `src/engine/game.js` |
| Beam turned toward the camera | `h.beams` | ville |
| Moving group in one pass | `weld(h, grp, fmly)` (a fourth argument is for a static kit: ART-STYLE.md, shadows) | `src/render/scenery.js` |

### Shapes ready to place

- **perse**: `character` (robe tinted per instance), `camel`, `donkey` (`src/maps/perse/shapes-perse.js`).
- **plage**: `flamingo(t)` with the head-in-water variant, `bike` (`src/maps/plage/shapes-plage.js`).
- **shared**: `wagonCovered`, `pumpsetBalancier` (`src/render/shapes.js`).
- **barrage**: shape and textures `burst`, `foamGES`, designed to scroll.
- Characters from other maps: `shepherd`, `passerby`, `partygoer`, `extra`, `courier`. Birds: `pigeon`, `owl`.

### Sound (`src/audio/audio.js`, all synthesis, `window.SOUND`)

- Ambience beds `AMB[M.id]` and events `ambEvent`; place acoustics `ACOUSTICS[M.id]`.
- Tunnel reverb through a `ConvolverNode`, the same everywhere.
- A source placed in space: only the other vehicles (`voiceFar`: panning, Doppler, occlusion).
- Scenery never calls sound. `SOUND.frame(dt, SE)` receives `amb` (0..1) and `car.idx`, with no zone identifier.
- Listening bench: `pages/listen.html`, scenes in `pages/listen/listen.js`; `autotest` and offline measurements serve as a check without ears.

### Engine

- Wet: `th.wetVisible`, `surf` `damp` zones. Fog: `th.haze`. Luminaires: `h.emis()`, 20 at most, fixed. Halo: `TH.bloom`. See `docs/methods/MAP-ENGINE-OPTIONS.md`.
- Collidable objects: cones and `th.objects`, purely visual, not synchronised online.
- Particles: `softPuffs()`, `emit()`, `strokeLn()` are internal to `src/engine/game.js`; only `h.steam` is open to scenery.

## To build (base)

1. **Per-zone sound ambience**: tell `src/audio/audio.js` which zone the car is in; beds and events per map; point sources with distance (waterfall, turbine, train, modelled on `voiceFar`); reverb per place (cenote, hall). Matching scenes in the listening bench.
2. **A common shader clock**: there is none. It unlocks waves, wind in vegetation and flags in the vertex shader. Caution: `illuminates` replaces `onBeforeCompile` without chaining it.
3. **Waves and shore foam**: the engine has no water surface; water on the maps is static.
4. **Wet on slopes**: the reflection pass takes the world's vertical as the reflection plane instead of the road's slope, and `flatPart = step(.8, n.y)` adds to it. Cause inferred from the code, to confirm with a before/after plan.
5. **Headlight beams in fog**: nothing exists for the player's car; the final-pass halo does not follow `th.haze`.
6. **Particles open to scenery**: expose `softPuffs` in `h` (spray, smoke, dust).
7. **Animation helpers in `src/render/scenery.js`**: move `flows` and `loopSec` out of their maps so they serve everywhere.
8. **Seeing motion**: plans at several instants with `tools/plan.js`.

## Pitfalls

- **barrage**: train, tram and gondolas are cubes fused into a single batch (`paintedBlocks`); take them out of it to move them. There is no locomotive shape.
- **perse, barrage**: materials are shared through a cache; animating a `map.offset` affects every piece using that material.
- **plage**: batches of more than 120 instances are re-split at the end; a kept reference no longer points to the displayed object. The big wheel is in one piece.
- **A road re-laid by scenery**: it does not read wetness (chapada).
- **`src/engine/rhythm.js`** rewrites the colour of opaque `MeshBasic` every frame: it can overwrite a blink.
- **Split screen**: a single tick, driven by player 1; sound follows the best-placed human.
- **A still `InstancedMesh` is merged into fixed scenery** (a copy of each instance stays at its rest position). A batch whose instances are moved with `setMatrixAt` must carry `userData.dyn = 1`.
