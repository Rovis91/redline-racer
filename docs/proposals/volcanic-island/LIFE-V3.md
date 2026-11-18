# Volcanic Island (`volcan`, "Couronne Brisée"): life and atmosphere, V3 specification

Written for the implementer. No game code was written. Sources: `docs/methods/LIFE.md`, `docs/methods/MAP-ENGINE-OPTIONS.md`, `docs/ART-STYLE.md`, `AMBIANCE-V2.html`, `src/maps/volcan/*` (all zone files read), the `volcan` entry of `src/data/maps.js`, `src/audio/audio.js`, and the shipped maps `plage`, `barrage`, `chapada`, `wangan`. Five boards of the racing camera (`--style=game`, one view every 60 samples, 55 views, `captures/plans/volcan/`) were read. The sibling specs (`aegean-cliffs`, `area51`, `sky-pillars`) were used as the format reference.

## How to read the numbers

- `N` = 3296 samples, one every 2 m; **sample = PK / 2** (`LAP` = 6578 m in the zone files). The zone files give PK; both are quoted where it helps.
- Speed in the boards: 120 m (60 samples, one board frame) takes about **2.2 s**, so about **54 m/s** on the autopilot lap (the real gold lap was not measured). An element visible over 100 m is on screen about 2 s. Everything below is sized for a 1 to 3 s read: big, slow, simple.
- Zones in samples: Port 3195-3296 and 0-150 · Village 3045-3296 and 0-200 · Fermes 200-780 · Falaises 780-2010 (base camp 1870-1995) · Cratere 2010-2335 (north gallery about 2020-2125, caldera floor 2125-2255, south-west gallery about 2255-2345) · Descente 2335-2990 (hairpins 2536, 2716, 2916) · Cote 2930-3195.
- Track points (`M.pts`, 164 of them, used by `th.haze`, `amb`, `surf`): **point = sample / 20.1** (check with `tun: [101, 106]` = north gallery, about 2030-2130). Zones in `haze` and `amb` must not straddle the start line.
- Sides follow the zone files: island on the left (-1), sea on the right (+1). Positions marked "check" must be confirmed with `node tools/plan.js volcan @<sample>` before building.
- **One wind: it blows toward +x (a westerly, from the sea past the island's west flank).** This is what the engine already does for steam (`game.js` line ~838 gives each puff a +x drift), so no shared file has to change. Flags, smoke, steam, spray, cloud drift and the sea's scroll all lean that way.

## Summary: what changes the map most (priority order)

1. **The sea moves, and breaks on black rock.** Today the sea is a still texture (`merVolcan`) on a 16 km plane and the stacks and skerries stand dry. Two scrolling layers on the sea, a pulsing foam ring round each of the 18 skerries and stacks, and foam along the breakwater. It is on the right for roughly 45 s of the lap (port, pass, descent, coast).
2. **The volcano breathes.** The lava lake becomes the one glowing thing on the map: flowing crust, a breathing orange light on the road and the rig, an occasional spatter. The nine steam vents (static white columns today) rise and sway; the first view out of the north gallery is a steam haze.
3. **Sound: the map has none.** `amb: []` and no `AMB.volcan` entry mean silence. A cold wind and distant swell bed, a bed per zone (harbour, farmland, highland, caldera floor, descent, coast), wire singing along the power line, gulls and sheep as events, placed sources (lava, vents, generators, foghorn, church bell), and both galleries as echoing spaces.
4. **A working harbour.** Gulls circling the fish racks and market, a trawler crossing the bay, spray at the breakwater head, a bell and a foghorn: the start/finish straight is where the player spends the most time, and where the mood sheet promises the busiest scene.
5. **One wind, in everything that hangs.** About ten flags, drying fish, anemometers, a radar dish at the camp, the derrick's block: one moving batch (the barrage pattern) and a handful of rotating parts. It is what makes the expedition read as a working place.
6. **A sky with weather.** A drifting broken cloud deck, a cap of cloud on the cone and a fog retune so the far islands go pale in ranks. The boards show a clean gradient with only the sun disc.
7. **Light that serves the road.** Soft shadows (long low-sun shadows lose their stair-steps), real luminaires in the south-west gallery (it is dark today, the lamps are only drawn), eye adaptation at both gallery mouths, seeping gallery floors.
8. **Expedition traffic.** Tracked vehicles that drive the supply track with an amber beacon; an optional survey helicopter over the cone (needs the author's yes).

## Global settings

Exact options for the `volcan` entry (`src/data/maps.js`). Test each first with `?opt=<JSON>` and `node tools/plan.js volcan <shot> --before`.

```js
// map block
amb: [[0, 100], [107, 163]],       // was []; the bed sounds everywhere except the north gallery (engine tunnel, pts 101-106), which has its own bed (AMBZ tun)
surf: { zones: [[101, 106, 'damp', 0.35], [112, 117, 'damp', 0.35]] },   // seeping galleries: see C-WET, and open question 3 (damp changes grip)
// th
fogD: [450, 4200],                 // was [600, 5200]; the far islands (3.4 to 4.5 km) go about 75% fog, so the horizon is a haze with ranks, not four sharp silhouettes
isFar: 7000,                       // unchanged, the islands are placed outside fog
haze: [[106, 110, 90, 800]],       // 4-value form: steam haze on the caldera floor, filling the end of the north gallery (see C-HAZE)
skySeg: 24,                        // smoother sky steps near the horizon
shadows: { soft: 1 },              // low sun (about 25 deg): stair-stepped shadows otherwise
eye: { tun: 0.6, blackM: 0.4, clair: 0.2 },    // both galleries open onto bright day: no switch at the exit
wetVisible: 1, dust: [0.42, 0.42, 0.45],       // only the gallery floors are damp; dust turns on the spray of the wet zones, grey like the ash road
```

Unchanged on purpose: the sky gradient and `fog 0xdbe5e8` (the horizon colour), `orb` (sun dir [-0.6, 0.42, 0.55], warm `#ffe9c4`), `hemi`, `sun`, `bloom 0.03`, `gloss 0.02` (it keeps the low sun from whitening the asphalt), `tun` block, `chev`, `headlights 0`. **No `seaSpray`, no `leaves`, no `headlightsHaze`** (see "What not to do").

Dynamic lights (`h.emis`, 20 at most): five used. Four in the south-west gallery (C-GAL2), one on the lava lake (C-GLOW).

Sound, in `src/audio/audio.js` (the implementer edits it; entries are data in the existing formats; fractions are `sample / 3296`):

```js
AMB.volcan = [['bandpass', 420, 0.6, 0.03, 0.08, 0.6],        // cold westerly over bare ground, gusting
              ['lowpass', 120, 0.7, 0.05, 0.06, 0.5]];         // swell on distant rock
AMBZ.volcan = [
  { de: 0.924, a: 1.0,   c: [['lowpass', 700, 0.8, 0.05, 0.13, 0.7], ['bandpass', 2600, 0.7, 0.01, 0.2, 0.8]] },   // harbour and village: swell on stone (an 8 s breath) and rigging; second entry below for the other side of the line
  { de: 0.0,   a: 0.061, c: [['lowpass', 700, 0.8, 0.05, 0.13, 0.7], ['bandpass', 2600, 0.7, 0.01, 0.2, 0.8]] },
  { de: 0.061, a: 0.237, c: [['highpass', 3500, 0.5, 0.008, 0.1, 0.8], ['bandpass', 380, 14, 0.012, 0.06, 0.7]] },    // farmland: grass hush; the power line singing (a high-Q band, quiet)
  { de: 0.237, a: 0.61,  c: [['bandpass', 300, 3, 0.04, 0.05, 0.8], ['bandpass', 380, 14, 0.012, 0.06, 0.7]] },      // lava highland: stronger gusts, the line again
  { tun: 1, c: [['lowpass', 150, 0.7, 0.06], ['bandpass', 700, 0.9, 0.02, 0.2, 0.4]] },                                // north gallery: low drone and ventilation (same as the south-west one below)
  { de: 0.645, a: 0.683, c: [['highpass', 4200, 0.6, 0.015, 0.1, 0.6], ['lowpass', 90, 0.7, 0.05, 0.05, 0.5]] },        // caldera floor: steam hiss and a deep rumble
  { de: 0.684, a: 0.711, c: [['lowpass', 150, 0.7, 0.06], ['bandpass', 700, 0.9, 0.02, 0.2, 0.4]] },                    // south-west gallery (not an engine tunnel, so an open-air entry)
  { de: 0.711, a: 0.889, c: [['bandpass', 380, 0.8, 0.035, 0.07, 0.6], ['lowpass', 500, 0.8, 0.035, 0.09, 0.6]] },      // descent: wind, and the sea hush that grows as you go down
  { de: 0.889, a: 0.924, c: [['lowpass', 600, 0.8, 0.05, 0.11, 0.7], ['bandpass', 1100, 0.7, 0.012, 0.18, 0.7]] }];     // coast: surf, nearer
ACOUSTICS.volcan = { slap: 0.28, sl: 0.1, intoWall: 0.55, rv: 0.06, dur: 2.0, lp: 3200,
                     spots: [[0.613, 0.645, 4], [0.684, 0.711, 4]] };   // quick returns off basalt scarps in the open; the two galleries get four times the reverb (perse pattern)
```

Events (`ambEvent`, add `volcan`, pattern of `evChapada`, returns the delay to the next one): `gull` in harbour, coast and descent zones every 6-12 s; `bleat` in farmland and descent every 5-9 s; `buoy` (a dull bell) in the harbour every 14-22 s; `raven` on the highland every 12-20 s; nothing under either gallery or on the caldera floor. New short synthesised sounds in `HITS` (noise bursts and FM sweeps, a few lines each): `gull`, `bleat`, `buoy`, `raven`, `bell`, `lava`, `hiss`. Existing: `horn` (the fog horn), `turbine` (generators), `waterfall`.

## Shared systems (built once, referenced by the zone tables)

| ID | System | What it is | Build |
|---|---|---|---|
| SYS-TICK | Scenery tick | `SCENERY.volcan` returns nothing today. Add the chapada pattern: `LIFE = []` of `(dt, car, t)`, `tick = (dt, now, car) => { dt = Math.min(dt, 0.1); tv += dt; for (const f of LIFE) f(dt, car, tv); }`, returned at the end of the function (`scenery-chapada.js`: `LIFE`, `FLOWS`, `flows`; `scenery-barrage.js` line ~699). Zone files receive `LIFE` through the argument object passed to `VOLCAN[z](...)`. | reuse |
| SYS-LIFE | Moving pieces outside the merge | `weld(h, kit)` merges everything in `kit` per material. Anything animated is built with the same `h.pose` calls but into a separate group `life` (scene child, `userData.dyn = 1`), never into `kit`. Check that `weld` skips `dyn` (src/render/scenery.js line 40) before relying on it. | reuse |
| SYS-FLOW | Sliding textures | `flows(mat, u, v)` as in plage/chapada: `Texture.offset` advanced by the tick. | reuse |
| SYS-MOB | One moving batch of cubes | The barrage `MOB`/`mb` batch (`scenery-barrage.js` lines ~19-21 and ~677-681): objects of painted cubes in local coordinates, the tick rewrites matrices, one pass. Used for flags and fish. | reuse |
| SYS-PUFF | Particles | `h.steam(x, y, z)` (permanent plume, `game.js` `STMS`, already leans +x) for fixed sources; `h.softPuffs` through the barrage `puffFn` (`scenery-barrage.js` line ~23) for bursts (spray, spatter gas); plage `grains(...)` (`scenery-plage.js` line ~432) for sparks and spatter. Keep fixed steam sources to 14 in all. | reuse |
| SYS-SPOT | Placed sounds | `SOUND.spots('volcan', [{ p: {x,y,z}, son, r, vol, int, occ }])` and `SOUND.brief` as at the end of `scenery-barrage.js` (line ~653). | reuse |
| SYS-BIRD | Birds | The plage bird shape (`shapes-plage.js` line ~147: slim body, wings in a V, a negative Y scale folds the wings: the flap) and plage's `group(...)` for take-offs (`scenery-plage.js` line ~494); chapada's `egretFlight` + `wingsV` as the alternative. Tint `0xf4f4f0` for gulls, `0x8a8e94` for fulmars. | reuse |
| SYS-RING | Foam ring | A flat ring mesh (`RingGeometry`, 16 segments) per skerry, y 0.1, a new `foamVolcan` texture (white flecks on transparent, 64 px, nearest) like `foamSea` in plage, scale `1 + 0.12 sin(2π t/5 + phase)` and alpha breathing 0.55-0.9. Helper: plage `wave(g, m, x, y, z)` (line ~430). | new (small) |

## Global elements

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| G-SEA | Sea surface in motion | The 16 km plane at y 0 (`scenery-volcan.js`, `sea`). Seen on the right over the quay lip (3180-3296, 0-150), from the pass (about 1500-1700), the whole descent and coast (2340-3195) | W | Dark water whose pattern slides slowly with the wind; a second finer layer slides at another speed: parallax of the pattern as the car moves | REUSE: SYS-FLOW on `merVolcan`; two planes, the second at y 0.05, `transparent`, opacity 0.35, `depthWrite: false`, another `rep` (170) and speed. Speeds 0.004 and 0.007 repeats/s toward +x (about 0.25 m/s on a 64 m tile). `th.smooth: ['merVolcan']` so the scroll does not shimmer | P0 | Shimmer on a nearest texture at 3 km: smooth filter, drift under 0.5 m/s, check with `--burst=6` |
| G-ISLES | Foam rings round skerries and stacks | The 18 `ilotVolcan` of `falaises` (8, north and east), `descente` (6, west) and `cote` (4, south). Seen from 1500-1700, 2400-2900, 3000-3195 | W | A white halo that swells and falls round each black stack: "surf on black rock", readable at 400 m | NEW: SYS-RING, positions from the lists in the zone files (read them, do not retype) | P0 | Z-fighting with the sea plane: y 0.1, `renderOrder` above G-SEA's layers; rings under 25 m from the stack's foot only |
| G-FOG | Fog retune | Whole map | F | Far islands become pale ranks; the horizon haze the mood sheet asks for | OPTION: `th.fogD [450, 4200]` | P0 | The cone (2 km) must stay readable: compare with `--before` at `@1800` |
| G-SHAD | Soft shadows | Whole map | L | Long shadows of houses, racks and poles with soft edges | OPTION: `th.shadows { soft: 1 }` | P0 | None (almost free) |
| G-SKY | Broken cloud deck | One plane at y 900, 16 km, centred on the island | L | White patches with gaps, sliding slowly; the pale cold sky gets weather. Seen 10 to 60 deg above the horizon on every straight | NEW: a `nuagesVolcan` texture (faceted white blotches on transparent, 128 px, about 35% coverage), `transparent`, opacity 0.85, `fog: true` (far patches dissolve in the haze), `depthWrite: false`, SYS-FLOW at 0.002 repeats/s (3 m/s toward +x); `th.smooth` for it only | P1 | Pixel shimmer: slow drift, smooth filter. A cloud can cross the sun disc while the shadows stay: accepted, the sun's halo is drawn in the final pass |
| G-CAP | Cap of cloud on the cone | Round the cone near the rim, y about 290-340 (centre `CONE`, `RELIEF_VOLCAN.CONE`; check with `@1800`) | F | A flat, ragged cloud wrapped on the crest that thickens and thins, seen ahead-left on the whole run 1500-2010 (about 9 s) | NEW: two faceted ring meshes (`ringsVolcan` style, radius 230 to 150), translucent white (the `steam` material, opacity 0.5 and 0.35), `fog: true`; tick: rotate 0.01 rad/s in opposite senses, scale `1 + 0.06 sin(2π t/11)` | P1 | Covers the rim crags that read the cone: opacity under 0.55, never lower than y 280 |
| G-FLAG | Flags in the wind | `drapeauVolcan`: school flag (PK 96, sample 48, left), farm flags PK 655, 945, 1245, 1080 (samples 327, 472, 622, 540), camp flag (PK 3756, sample 1878), farm flag on the coast (PK 6034, sample 3017), the orange flag of the expedition panels | O | A flag that ripples toward +x, 0.6 Hz, a travelling wave | NEW but modelled on barrage's flags (SYS-MOB): split the panel (`[tint, 1.8, 1.1, 0.04, ...]` in `shapes-volcan-expedition.js` line 54) into 4 vertical cubes per flag, tick sets `rotation.y` of each cube `0.5 sin(2π(0.6 t) - 0.9 k)`; only for flags within 200 m of the car (scale to zero beyond, no pop). About 10 flags, 40 cubes | P1 | Thin edges flicker at distance: fade by distance. Build the flags in `life`, remove them from the static `drapeauVolcan` calls |
| G-WIRE | Power line singing | Along the pole line: fermes 200-780 and falaises 780-1870 on the left, descent on the left | S | A faint high whistle that follows you for 40 s: the island is wired | OPTION: layer in `AMBZ` entries (`bandpass 380 Q14`, level 0.012) | P1 | Annoying if loud: keep under 0.015 |
| G-EYE | Eye adaptation at the galleries | Both mouths | L | The mouths neither blind nor black you | OPTION: `th.eye { tun: 0.6, blackM: 0.4, clair: 0.2 }` | P1 | Check the exit of the north gallery at `@2125` and the south-west one at `@2345` |
| G-VENT | Steam vents, animated | The 6 vents of `falaises` (PK 2330-3300 left, samples 1165-1650, 18-36 m off) and the 6 of the caldera floor (`VENTS` in `scenery-volcan-cratere.js`, 40 to 200 m off) | P | Columns of white steam that lean toward +x, breathe in height and drift: the ground is warm. Left side, 2 to 3 s each | NEW but cheap: take the 12 `vapeurVolcan` columns (`steam` material, 7 rings) out of `kit` into `life`; tick: `rotation.y += 0.15 dt` with its own phase, `scale.y = 1 + 0.1 sin(2π t/6 + k)`, a lean `rotation.z = -0.12` (toward +x). Add `h.steam` at the crown of the 3 vents nearest the road in each group (SYS-PUFF) for real puffs | P0 | A static white column reads as a rock tower: the breathing must be visible. Opaque white against pale sky is weak: keep `opacity 0.4` and tint the base `#d8dcdc`. 15 steam sources in all, no more |

## Zone 1: Le Port (samples 3195-3296 and 0-150, PK 6390 to 300, quay on the right)

What the player sees: the start/finish straight, a quay of basalt blocks on the right with the harbour basin 12 m below it, fish racks and net stores on the right, the fish market, the lighthouse at the end of the breakwater (visible from the grid), houses of the village on the left. About 4 s each way. Boats are low in the basin and are barely seen from the race camera (the boards at 3120-3240 show only the sea); the sea, the breakwater and the sky are what the right side offers.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z1-GULLS | Gulls circling the racks and market | Over the racks (PK 6570-6642, samples 3285-3321 i.e. 3285-3296 and 0-25), the market (PK 6726, sample 67), the second racks (PK 6788-6836, samples 98-122); radius 22 m, height 12 to 22 m | A | Eight to ten white birds turning slowly above the racks, a few crossing the road line high up: the harbour is a fishing harbour. 2 to 3 s | REUSE: SYS-BIRD, flap by Y-scale; new path code: each bird on a circle (centre, radius 18-30, speed 6 m/s, height 12-22, phase), no `loopSec` needed. Entirely above 11 m so none ever crosses at car height | P0 | Gull shadows are one pixel and cost a pass: `castShadow = false` (plage line ~500). Nothing near a braking point: this is the straight |
| Z1-CRY | Gull and buoy sounds | Harbour and village zone | S | A cry every 6-12 s; a dull bell from a buoy every 14-22 s | NEW: `gull`, `buoy` in `HITS`, in `ambEvent` | P0 | Repetition: three gull variants chosen at random |
| Z1-BED | Harbour bed | Samples 3045-3296 and 0-200 | S | Swell on stone with an 8 s breath, rigging clatter, the line of flags | OPTION: `AMBZ.volcan` entries 1 and 2 | P0 | None |
| Z1-SHIP | A trawler crossing the bay | A loop on the sea 120-300 m off the quay, from sample 3100 to 200 (PK 6200 to 400), 6 m/s, with a wake | O | A red or blue trawler sliding along the horizon, a white wake behind it. Seen 3 to 4 s on the right, once per lap | REUSE: wangan `loopSec(u, p)` (line ~213) for the path, `bateauVolcan` with the `a: [22, c, 'trim']` of the zone file, wake = a thin white wedge mesh with SYS-FLOW. Hull bobs `0.25 sin(2π t/4)` in roll | P1 | Must stay on the water: path checked against the shoreline with a plan from above (`--view`). Pure scenery, no collision |
| Z1-HEAD | Breakwater spray and foam | The 150 m breakwater `digueVolcan` (PK 6860, sample 141, check; its head carries the lighthouse) and the 80 m west mole (PK 6396, sample 3198) | W | White foam running along the sea face of the breakwater, and a burst of spray that rises 5 to 8 m and falls every 5-8 s: the signature of an exposed harbour, seen ahead-right for the whole run | REUSE: plage swell foam (`wave`, `foamSea`, line ~430-453) as a thin strip at y 0.1 along the sea side (SYS-FLOW u at 0.08); spray: `puffFn` bursts at random points of the face (SYS-PUFF), white, size 5, rise 4 m/s | P1 | Heading the car into a white cloud at the start line: spray at least 20 m from the road line and below 10 m. Do not move the camera, no lens drops |
| Z1-HORN | Fog horn | Lighthouse at the breakwater head (sample 141, 6 m high on the red band) | S | A deep two-note horn every 30 s, heard from the grid to the village, fading out toward the fermes | REUSE: `HITS.horn` (corne de brume) via `SOUND.brief`, timer in the tick, `SOUND.spots` for the position, vol 0.2, range 450 m | P1 | Must not fire during the start countdown: arm it once the race is on (`h.time()` -1) |
| Z1-GLINT | Lighthouse glint | Lantern of the lighthouse (white tower with red band, 34 m up) | L | A white four-point star on the lantern every 4 s, seen from the grid | NEW tiny: additive sprite, scale `sin(t)^8` (no on/off; the givre/touge pattern, smoothed). In daylight a beam would not show: no beam | P2 | Flicker: smooth scale only. Do not pass it to the halo |
| Z1-PERCH | Gulls on the bollards lift off | Quay, samples 3225-3290 (bollards every 25 m), right, 19 m off | A | Four gulls that hold the bollards and take off over the basin when the car is 70 m away | REUSE: plage `group(...)` take-off (line ~494), tint white | P1 | Nothing moves at a braking point: none here. Birds go out toward the sea, never across the road |
| Z1-RACKS | Drying fish swinging | The `sechoirVolcan` racks of the port: 3285-3321, 3323-3350 (second row 16 m out), 3395-3420 and 98-122 | O | The hanging cod sway a few degrees in the wind, row against row; the A-frames stay | NEW: SYS-MOB, fish as 3 x 0.3 x 0.6 cubes (`fish` colour `0xd8cfae`) hung in rows from the beam, tick: rotation about the beam `0.18 sin(2π(0.5 t) + 0.7 k)` | P2 | Visible only as a shimmer at 54 m/s: do it last, only for racks within 120 m |
| Z1-WET | Wet quay and reflections | Samples 3195-3296 and 0-140, the road itself | R | The bright houses of the left row streak the road in colour | OPTION: `surf` damp zone `[159.5, 163.5, 'damp', 0.35]` and `[0, 7, 'damp', 0.35]` with `th.wetVisible` | P2 | Changes grip on the start straight: **open question 3**. Off by default. Wet and white lines at 54 m/s: check readability |
| Z1-HAND | Dockers at the depot | Depot (PK 6420-6450, samples 3210-3225, right, 14 m) and the market | O | Four small figures lifting crates in two poses, 1 Hz | REUSE: `PLACERS.crowd(h, ...)` (`src/render/crowd.js`, stade/canal) with the `shepherd` or `passerby` shape tinted orange and white | P2 | At 14 m from the road, 1 s of view: skip if the figures read as noise |

## Zone 2: Le Village (island side -1, samples 3045-3296 and 0-200, PK 6090 to 400)

Four rows of timber houses in five colours parallel to the quay, the church in the middle (spire visible from 3240), the churchyard, the school flag. The wall of colour is the left side of the whole start straight, about 7 s in all. It is static and must stay readable: the life here is smoke, a bell and a flag, not more.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z2-SMOKE | Chimney smoke | Six houses of the front two rows (offsets 5 and 23 m), chosen among samples 3100-3290 and 20-180, alternating | P | Six thin grey plumes leaning toward +x: somebody lives in these houses. 3 s | REUSE: `h.steam(x, y, z)` (SYS-PUFF) at the ridge; NEW tiny: `maisonVolcan` has no chimney, add a 0.5 m dark box at the ridge (one extra cube in `shapes-volcan-bati.js`) so the smoke has a source; positions from the group `by` returns | P1 | White plume against a bright house wall is weak: choose dark roofs and houses red or blue. Count toward the 15-source limit |
| Z2-BELL | Church bell | Church (sample 3267, left 34 m back) | S | A bell struck every 20 s, swelling as you pass; Sunday feeling | NEW: `bell` in `HITS` (FM sine 520 Hz plus inharmonic partials, 4 s decay), `SOUND.spots`, vol 0.15, range 280 m. If the Sky Pillars bell exists by then, reuse it | P1 | None |
| Z2-FLAG | School flag | PK 96 (sample 48, left, 3 m back, 9 m high) | O | A red flag rippling at the edge of the village | G-FLAG | P1 | See G-FLAG |
| Z2-LINES | Washing lines | Two lines between houses at the cross lanes (PK 6260 and 6350, samples 3130 and 3175), 6 m high | O | Coloured cloths flapping between the walls | NEW: SYS-MOB, 5 cubes per line, same wave as the flags | P2 | A glimpse of 0.5 s: only if everything else is done |
| Z2-DOG | Distant dog | Village, random | S | A bark far to the left every 25 s | NEW tiny `bark` in `HITS`, in `ambEvent` for the village zone only | P2 | Repetition: rare |

## Zone 3: Les Fermes (samples 200-780, PK 400 to 1560, S-bends up the east side)

Walled pastures on both sides (black scarp behind the farms on the left, narrow fields on the right), three farms and one on the sea side, flocks inside the walls, power line, mown fields with bales, orange cones at the corners. The boards (300-720) show a green ribbon between stone walls: the sea is not seen here. Many bends: no moving thing near a chevron or corner entry.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z3-BED | Farmland bed | 200-780 | S | Grass hush and, under it, the line singing; bleats on both sides | OPTION: `AMBZ.volcan` entry 3, `bleat` in `ambEvent` every 5-9 s | P0 | None |
| Z3-FLAGS | Farm flags | Farms at PK 660, 950, 1250 (left, samples 330, 475, 625) and 1085 (right, sample 542); 7 m flagpoles, 9 m off | O | Four red flags rippling | G-FLAG | P1 | See G-FLAG |
| Z3-FALL | A fall over the black scarp | On the scarp behind the middle farm (PK 950, sample 475, left, 44 to 60 m back; check with `@475`) and a stream to the road culvert | W | A thin white stream that falls 18 m down the scarp and ends in a small boil of spray, seen 2 s on the left, with the sound of water as you pass | REUSE: barrage's `burst` and `foamGES` fall textures and `waterfall` shape (designed to scroll, `docs/methods/LIFE.md` "Shapes ready to place"), SYS-FLOW at 0.9 repeats/s down; `SOUND.spots` with `waterfall`, vol 0.08, range 90. NEW: a 2 x 18 m sheet and a small pool | P1 | **Adds scenery the mood sheet does not list: open question 2.** Far from any corner; white against black reads at 150 m |
| Z3-STARTLE | Flocks that bolt | Two flocks near the road (PK 470 left, 1450 left, samples 235, 725), 9 sheep each, 22 m off | A | When the car is 60 m away the sheep inside the wall trot away from the road (2 m/s) and stop | NEW: take 18 `moutonVolcan` out of `kit` into `life` as one instanced batch (`dyn`), tick moves them 6 m away from the road inside the wall; the rest of the flock stays static | P2 | Not near a chevron: 235 and 725 are both straights. Sheep must not cross a wall |
| Z3-PLOVER | Birds rising from the fields | Right verge at samples 345, 440 (110 m ahead of the car) | A | A flock of 6 small black-and-white birds that rise and veer over the wall | REUSE: plage `group(...)` take-off (line ~494), tint `0xe8e8e8`, `vx` away from the road | P1 | Never at a corner entry: 345 and 440 are straight (check chevrons with `@345`) |
| Z3-TRACTOR | Tractor in a mown field | Hay field PK 802-898 (samples 401-449, left, 26 m off) | O | A small tractor with a baler crawling along the hay, a small dust puff | NEW small: box tractor and cart on a line, 1.5 m/s, `dyn` | P2 | Must stay in the field behind the wall. 1.5 s of view |

## Zone 4: Les Falaises (samples 780-2010, PK 1560 to 4020: upper bends, the needle, the pass, the north cliffs, the base camp)

The expedition's ground: survey stakes and seismic stations on the left, steam vents on the warm ground (samples 1165-1650), the needle (sample 1440 ahead), the red and white relay mast at the pass (sample 1560-1600, right), skerries off the north cliffs, the base camp of domes and containers (1870-1995), and the cone filling the left sky. Boards 720-1380: bare green and black ground with orange stakes; the cone and the sun are the scenery.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z4-VENTS | Warm ground steaming | 6 vents, PK 2330-3300 (samples 1165-1650), left, 18-36 m off | P | Columns that breathe and lean, with puffs at the crown, one after another along the left for about 8 s | G-VENT | P0 | See G-VENT |
| Z4-HISS | Vent hiss and sensors | The three nearest vents (samples 1165, 1175, 1182) | S | A hiss that swells as you pass | REUSE: `SOUND.spots` with a new `hiss` (highpass noise 4 kHz, slow modulation), vol 0.05, range 60 | P1 | None |
| Z4-CAP | Cloud on the cone | The cone ahead-left | F | The crest wears a cloud | G-CAP | P1 | See G-CAP |
| Z4-SEAFOAM | Surf round the stacks | North skerries (samples 1500-1700, right, far below) | W | White halos round black stacks, small at 300 m | G-ISLES | P0 | See G-ISLES |
| Z4-FULMAR | Fulmars gliding along the cliff | Right, over the sea between samples 1500 and 1700, 20-60 m beyond the cliff edge, 5 to 25 m below road level | A | Six grey-and-white birds gliding the same way as the car, almost still: height and wind. 2 to 3 s | REUSE: SYS-BIRD, no flap (V held), path along the cliff line at 9 m/s, slight altitude waves | P1 | They must stay on the sea side; entirely below the road so none is at car height |
| Z4-WINDSOCK | Anemometers turning | `meteoVolcan` at PK 2250 (sample 1125, left, 12 m) and PK 3938 (sample 1969, left, 22 m) | O | Three cups spinning, a vane that points +x. Stands for the instruments | NEW small: cups and vane as separate `life` meshes on the existing mast; cups `rotation.y += 9 dt` (nearest texture, no blur), vane fixed at 0 rad | P1 | 0.5 s of view at 12 m: only the first reads |
| Z4-DISH | Rotating dish at the camp | On the camp's mast `mastVolcan` (PK 3818, sample 1909, left 34 m, 28 m high) | O | A small white dish at the top of the mast that turns slowly, seen over the domes from 1860 to 1990 (about 3 s). "Antennas that rotate" | NEW small: a flat cone dish and arm, `rotation.y += 0.8 dt`, mounted on top of the mast in `life` | P1 | Tiny at 150 m: scale 1.5 over the 28 m mast |
| Z4-MAST | Relay mast light | Mast at the pass (PK 3160, sample 1580, right, 10 m, 30 m high), mast at the camp, mast on the west flank (seen from the descent) | E | A red point at the top that swells and fades over 1.6 s: the island is watched | NEW tiny: an emissive sphere on the mast, intensity `0.6 + 0.4 sin(2π t/1.6)` (smooth, not an on/off blink) | P2 | At 10 m from the road, not near a braking point (the pass is a straight on the boards). A blink would be read as a hazard: keep it a pulse |
| Z4-WIRES | Wind in the stays | Mast at the pass | S | A faint whistle on the right | OPTION: `SOUND.spots` with a high-Q `bandpass 900 Q12`, vol 0.03, range 120 | P1 | None |
| Z4-TRACKED | Tracked vehicles on the supply track | Track sections PK 1600-2020, 2460-2740, 3460-3720 (samples 800-1010, 1230-1370, 1730-1860), left, 9 m off | O | One tracked vehicle (orange or white) crawling the track at 5 m/s with an amber beacon pulsing, seen 1 to 2 s | REUSE: `chenilleVolcan` and the `track()` line, shuttled along it by the tick (the cumulative distance of the track polyline; `loopSec` of wangan as a model). The beacon: an emissive amber cube, pulse as Z4-MAST | P1 | Pure scenery on its own track 9 m from the road; stays out of the roadway. At 59 m/s relative it flashes by in half a second: one vehicle per section only |
| Z4-GEN | Camp generator | Camp (PK 3840, sample 1920, left 6 m) | S | A low diesel hum on the left for 2 s | REUSE: `SOUND.spots` with `turbine`, vol 0.05, range 70, `occ` 0.2 | P1 | None |
| Z4-RAVEN | Ravens over the lava | Random, highland | S | A hoarse call every 12-20 s | NEW: `raven` in `HITS`, `ambEvent` for 780-1870 | P2 | Repetition |
| Z4-HELI | Survey helicopter | Circling the cone, 120-200 m above the left side, between samples 1500 and 2000 | O | A small orange helicopter with a turning rotor, a low rotor beat that rises and falls with its distance: the expedition has aircraft | NEW: a box cabin, tail boom and rotor disc (a flat translucent ring), `rotation.y += 25 dt` on the rotor, a circle of radius 250 m at 6 m/s; `SOUND.spots` with `turbine` retuned (a chopped 18 Hz), vol 0.06, range 400 | P2 | Needs a new model and sound: **open question 1**. A flicker at the rotor: use a disc, not blades |

## Zone 5: Le Cratere (samples 2010-2335, PK 4020 to 4670: north gallery, caldera floor, south-west gallery)

The point of the map. The north gallery (engine tunnel, lamps warm orange, concrete portal and basalt organ pipes at the mouths), the exit onto the caldera floor with the lava lake on the left and the drilling rig on the right, steam vents, the cable climbing the south wall to the observatory dome on the rim straight ahead, then the south-west gallery. In the boards: 2040-2100 an orange-lit tunnel; 2160 the orange lake at the left with a dark floor; 2220 the mouth of the second gallery; 2280 a dark second gallery (the lamps are drawn, nothing is lit); 2340 the sea in the exit.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| C-LAVA | Lava lake flowing | Disc `LAKE` (x -62, z -930, r 34, y 153), left of the road, about 60 m off, seen from 2125 to 2250 (about 4 s) | W | Orange crust with black cracks that slides slowly, rafts that drift: the only liquid light on the map | REUSE: SYS-FLOW on `laveVolcan` (the lake is its only user, so no shared material), two layers, 0.02 repeats/s in a swirl (u and v of opposite sign) | P0 | Nothing else uses `laveVolcan`: check. A nearest texture sliding at 0.02/s does not shimmer |
| C-GLOW | Lava light on the road and the rig | One luminaire at the lake centre (x -62, y 156, z -930) | E | The road and the rig take a breathing orange tint when you come out of the gallery | REUSE: `h.emis(i, x, y, z, 0xff6a20, 70, 1.4)` and `l.c` re-read every frame (`docs/methods/MAP-ENGINE-OPTIONS.md` "h.emis returns its luminaire"): `k = 1.2 + 0.2 sin(2π t/7)` | P0 | Never an on/off switch: smooth only. Within the 20-luminaire budget |
| C-SPATTER | Spatter | Random point of the lake every 6 to 11 s | P | A short orange fountain that falls back in 1.5 s | REUSE: plage `grains(...)` (line ~432), additive orange points, gravity, 24 points per burst | P1 | One burst at a time; never lit near the camera path (the lake is 25 m from the road at the nearest) |
| C-CRUST | Crust rafts drifting | The three `dalleVolcan` rafts of the lake | O | Black plates that turn and drift across the glow | NEW tiny: take the 3 rafts out of `kit` into `life`, `position += 0.4 dt` and `rotation.y += 0.08 dt`, wrapped inside the pit | P1 | Must stay inside the lake radius |
| C-GAS | Gas over the lake | Two points over the lake at y 160 | P | A pale yellowish plume that rises and leans to +x | REUSE: `h.steam(x, y, z)` (grey, light) | P1 | Counts toward the 15-source limit |
| C-HAZE | Steam haze on the floor | Points 106-110, samples about 2130-2210 | F | Out of the north gallery into a pale haze that clears over about 4 s; the lake and the rig appear through it | OPTION: `th.haze [[106, 110, 90, 800]]` (the 180 m fade fills the end of the gallery) | P0 | Fog from 90 m hides the rig at 100+ m: it must read at the exit. Check at `@2125` |
| C-VENTS | Vents of the floor | The 6 vents of `VENTS` (`scenery-volcan-cratere.js`), 40-200 m left and right, samples 2130-2250 | P | Columns breathing in the haze | G-VENT | P0 | See G-VENT |
| C-GAL2 | Light in the south-west gallery | Four luminaires, every other lamp (a lamp is drawn every 24 m from `g0 + 6`: samples about 2263, 2287, 2311, 2335), y 7.6 | E | The second gallery becomes a lit tube like the first, orange pools on the floor, instead of a dark slot | REUSE: `h.emis(i, x, 7.6, z, 0xffc878, 16, 1.0)` with `tun` flag, colour of the engine neons; the lamps already drawn are the sources | P0 | The road in the gallery is unreadable without it (board 2280). Within budget |
| C-WET | Seeping galleries | Both galleries | R | The floors shine: the lamps streak the road in long reflections | OPTION: `surf` damp zones `[101, 106, 'damp', 0.35]`, `[112, 117, 'damp', 0.35]` and `th.wetVisible` | P1 | Damp changes grip (what you see is what you drive): **open question 3**. Without the damp the lamps still show |
| C-ECHO | The galleries as rooms | Both galleries | S | Engine and tyres ring in the tube, then a dry crack outside | OPTION: `ACOUSTICS.volcan.spots [[0.613, 0.645, 4], [0.684, 0.711, 4]]`, `AMBZ` tun entry and entry 7 | P0 | Check with `pages/listen.html`, not by ear alone |
| C-LAVASND | Lava and vents sound | The lake, the three nearest vents of the floor | S | A low burble with a plop every few seconds on the left; hiss on the right | REUSE: `SOUND.spots`: new `lava` (lowpass noise 120 Hz with random plops), vol 0.1, range 100; `hiss` | P1 | None |
| C-RIG | Derrick block | `derrickVolcan` (mid of the floor, right 24 m, 26 m high, about sample 2190) | O | A block that rises and falls inside the mast, 6 m in 8 s: it is working | NEW small: the traveling block as a `life` mesh in the derrick, `y = 3 + 3 sin(2π t/8)` | P1 | 1.5 s of view at 24 m |
| C-RIGSND | Rig and generator | Same | S | A diesel throb on the right | REUSE: `turbine` spot, vol 0.06, range 80 | P1 | None |
| C-OBS | Observatory dome and cable | The dome on the rim (x -77, z -708, about 150 m ahead, 100 m up, seen from 2125 to 2250) | O | A white dome that turns slowly with a dark slit, straight ahead on the cliff; the pylons climb to it | NEW small: `rotation.y += 0.1 dt` on `domeVolcan` (built in `life`) with a dark cube slit | P1 | Tiny at 150 m: scale 1.4. The slit makes the rotation readable |
| C-FALL | Rocks off the wall | Scree at the foot of the left wall, samples 2150-2230 | P | One pebble stream and a puff of dust every 15 s | REUSE: `grains(...)`, grey, 10 points | P2 | Visible 1 s: skip if over budget |

## Zone 6: La Descente (samples 2335-2990, PK 4670 to 5980: out of the gallery, three hairpins at 2536, 2716, 2916)

Out of the south-west gallery onto the sea: the horizon high ahead, the road dropping in three hairpins through the summer farms, flocks loose round the folds, survey stakes outside each hairpin, the hot-water pipe on the right, power line on the left, the relay mast on the west flank, skerries off the west shore. Boards 2400-2820: sea band above the green slope, farms, flocks and the black stacks. The sea and the sky are above the road for 25 s.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z6-SEA | The sea ahead | The horizon band | W | Water that moves, haze, far islands in ranks | G-SEA, G-FOG | P0 | See G-SEA |
| Z6-ISLES | Foam on the west stacks | Six `ilotVolcan` off the west shore, ahead-right on 2400-2900 | W | White halos | G-ISLES | P0 | See G-ISLES |
| Z6-BED | Descent bed | 2340-2930 | S | Wind and a sea hush that grows with the descent | OPTION: `AMBZ.volcan` entry 8 | P0 | None |
| Z6-SHIP2 | Boats on the west horizon | Two fishing boats 700-900 m off, west and south-west, moving 3 m/s | O | Two small boats sliding along the horizon, in the haze | REUSE: Z1-SHIP (the same trawler on a longer loop and a second hull), no wake | P1 | They must stay on the sea; small enough not to read as a path marker |
| Z6-BLEAT | Sheep on the hillside | Seven shielings with flocks (PK 4900, 5080, 5250, 5330, 5480, 5620, 5720; samples 2450-2860), 15-30 m off | S | Bleats and a bell from the flocks, left or right | REUSE: `bleat` in `ambEvent` every 5-9 s; `SOUND.spots` for the three nearest (`bleat`, vol 0.05, range 80) | P1 | None |
| Z6-STARTLE | Flocks that bolt | Two flocks (PK 4900 right, 5620 left, samples 2450 and 2810) | A | As Z3-STARTLE | Z3-STARTLE | P2 | Not at a hairpin: 2450 and 2810 are 80+ samples from a hairpin (2536, 2716, 2916): check |
| Z6-PIPE | Hot-water pipe vapour | Three points on the pipe, right 2.4 m (PK 5300, 5700, samples 2650, 2850; check clear of the hairpins) | P | A white wisp from a joint: the village heating | REUSE: `h.steam(x, y, z)` small | P2 | At 2.4 m from the road, near enough to read as a smoke screen: keep one wisp per straight and 1 m high |
| Z6-SMOKE | Summer farm smoke | Two shielings, the red (PK 4900) and the blue (PK 5250), ridge | P | A thin plume from a chimney | REUSE: as Z2-SMOKE (needs the chimney cube) | P2 | Count toward 15 |
| Z6-MAST | Relay mast light | West flank (x -690, z -930), seen from the whole descent | E | A red pulse on a hill, far ahead-left | G-MAST pulse | P2 | See Z4-MAST |
| Z6-WIRE | Pole line | Left, whole zone | S | The line singing | G-WIRE | P1 | None |

## Zone 7: La Cote (samples 2930-3195, PK 5860 to 6390: out of the last hairpin, along the shore to the head of the quay)

Sea on the right all along, the west landing: boathouse, boats on the apron, racks, nets, the pump house where the hot-water pipe ends, the farm of the shore on the left with its pink house, red barn, hay field and flock, skerries off the south shore, the port and its lighthouse growing ahead. Boards 3000-3180: pink house left, sea and a black stack right, the village far ahead.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z7-SEA | Sea and stacks | Right side, 3000-3195 | W | Water moving, halos round the four south skerries | G-SEA, G-ISLES | P0 | See above |
| Z7-BED | Coast bed | 2930-3045 | S | Nearer surf, rigging of the landing | OPTION: `AMBZ.volcan` entry 9 | P0 | None |
| Z7-PUMP | Pump house | `posteVolcan` at PK 6244 (sample 3122, right 7 m) | S, P | A hum from the right and a white vapour from the pipe end, which says what the pipe is for | REUSE: `turbine` spot, vol 0.06, range 70; `h.steam` at the outlet | P1 | At 7 m from the road, 1 s: the vapour must not cross the line of sight at the bend before it (check) |
| Z7-FARM | Farm of the shore | PK 6034 (sample 3017) flag; flock PK 5990 | O, A | A red flag and the sheep; a bleat | G-FLAG; Z3-STARTLE for the flock at PK 5990 (sample 2995) | P1 | See G-FLAG |
| Z7-GULLS | Gulls round the landing racks | Racks PK 6094-6142 and 6284-6332 (samples 3047-3071 and 3142-3166), radius 18 m | A | Five gulls turning above the racks, a smaller flock than in the port | REUSE: Z1-GULLS, five birds | P1 | Same rules; all above 11 m |
| Z7-RACKS | Swinging fish | The two racks | O | As Z1-RACKS | Z1-RACKS | P2 | Same |
| Z7-SPRAY | Spray on the stack | One black stack 60 m off the road at the straight (samples 3050-3090) | P | A burst of spray every 6 s on the rock | REUSE: Z1-HEAD `puffFn` bursts | P2 | Keep off the road line |

## What NOT to do on this map

- **No rain, drizzle or falling snow.** The mood sheet is a clear late-summer afternoon; falling particles at 54 m/s are the visual noise the author found hard to read. Snow stays on the highest crags.
- **No lens drops (`th.seaSpray`) and no wet road on the open road.** The wind is a westerly along the shore, so nothing blows onto the road; drops on the lens would hide the sea and the chevrons. Damp only in the galleries, and only if the author accepts the grip change.
- **No fog bank on the road in the hairpins or the S-bends.** `th.haze` is used once, on the caldera floor, where the road is straight. Fog over the bends of the fermes or the descent would hide corner entries.
- **No wave geometry and no planar reflection on the sea.** The sea is a plane: moving texture, foam rings and breakwater foam give the life; a vertex wave or a mirror would shimmer at 54 m/s and cost a pass.
- **No grass waving by animating the terrain texture.** One texture serves the whole terrain: moving it moves the rock too and shimmers. The wind is shown in flags, smoke and steam only.
- **No eruption, no ash fall, no volcanic lightning, no lava fountain larger than the lake.** The mood sheet says "quiet, watched, not erupting".
- **No lighthouse beam, no aurora, no lit windows.** It is day. A beam in daylight is invisible and a lit window flips like a switch.
- **No blinking beacons.** Red and amber lights pulse smoothly (cosine); a hard blink beside a braking point reads as a hazard.
- **No animation on every sheep, house, rack or sign.** A thousand things moving at 54 m/s read as noise; the table picks the dozen that carry the island (flags, smoke, steam, gulls, lake, sea).
- **No sound from scenery files.** Sounds are placed through `SOUND.spots` and `AMBZ` only (`docs/methods/LIFE.md`); nothing calls `SOUND` from the zone files except through SYS-SPOT.
- **No collidable life.** Trawlers, vehicles, birds, sheep, the helicopter and the tractor do not collide and stay off the road; any collidable object would have to depend on race time.
- **No change to `src/engine/sim.js` or `src/engine/game.js`.** The wind is chosen to match `game.js`'s steam drift; shared files are proposed to the author first.

## Open questions for the author

1. **A survey helicopter over the cone (Z4-HELI)?** It brings a new model, a rotor beat and a circle path, and is the "aircraft" of this map. Without it the expedition has vehicles only. Costs a model and a sound; no engine change.
2. **A waterfall on the scarp above the middle farm (Z3-FALL)?** It is what makes the island read as Iceland, but the mood sheet lists no water on the land and says nothing is set beside the road "to fill a gap". Yes keeps the stream and the culvert; no leaves the farmland as it is.
3. **May the gallery floors be damp (C-WET, and the quay in Z1-WET)?** `th.wetVisible` follows the physics: damp surface means less grip in the gallery. If not, the galleries stay dry and the lamps only reflect weakly through `tun.gloss`.
4. **How loud may the sea and wind beds be?** The speed of the map is high, and the wind bed masks the engine at the level written above (0.03-0.05). Would the author prefer a quieter bed with louder events (gull, bleat, bell, horn)?
5. **May the foghorn sound at the start (Z1-HORN)?** It gives the start straight a signature, but it plays over the countdown if not armed; the plan arms it only once the race is on.
