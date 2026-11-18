# Lunar Outpost (`lune`): life and atmosphere, V3 specification

Written for the implementer. No game code was written. Sources: `docs/methods/LIFE.md`, `docs/methods/MAP-ENGINE-OPTIONS.md`, `docs/ART-STYLE.md`, `AMBIANCE-V2.html`, `src/maps/lune/*` (all files), the `lune` entry of `src/data/maps.js`, `src/audio/audio.js` (read only), `src/engine/game.js` (particles, dust, tunnel wind), and the shipped maps `barrage`, `wangan`, `chapada`, `perse` and the `area51` / `sky-pillars` V3 specifications. Four boards of the racing camera (`--style=game`, one view every 60 samples, 45 views) were read: `captures/plans/lune/0-60-…-660.jpg`, `720-…-1380.jpg`, `1440-…-2100.jpg`, `2160-…-2640.jpg`. The headless browser was closed afterwards.

## How to read the numbers

- `N` = 2678 samples, one every 2 m. **Sample = PK × 0.506** (PK = the chainage of the scenery files, `LAP` 5288). Track points (`M.pts`, used by `th.haze`, `M.amb`, `th.seaSpray`): 132 points, **point = sample / 20**. Where a position is approximate it says "check with `plan.js`".
- Gold lap about 88 s for ~5.35 km, so about **61 m/s**. One board frame (60 samples = 120 m) is **2 s**. A thing visible over 150 m is on screen for 2.5 s. Everything is sized for a 1 to 3 s read: big, slow, simple.
- Zones in samples: hall and base out 0-253 (hall -26 to 56) · west crater and chicane 253-679 (hairpin round the relay at 550) · ridge 679-1540 (hairpin 1387, run-up from ~1450) · **jump: lip 1540 (pt 77), flight to ~1600** · arena 1600-1830 · tunnel 1820-1980 (pts 91-99, `M.tun`) · south basin and ramp 1980-2540 · base return and hall 2540-2678 (door frame at 2640).
- **No wind, no air**: there is no "one wind" on this map. Nothing drifts, nothing flutters, nothing hangs. Everything thrown into the air follows a parabola and falls back.
- Moving parts must sit **outside `kit`** (`weld(h, kit)` merges everything in it) with `userData.dyn = 1`. The scenery function currently returns nothing: it must return `{ tick(dt, now, car) }` (see `docs/methods/LIFE.md`, "A scenery's tick"). Animate on `dt`.

## Summary: what changes the map most (priority order)

1. **A sound bed that tells the truth.** Today `amb: []` and no `AMB.lune` mean silence, and the engine's wind roar would play at 200 km/h on the Moon. The bed is the cabin: life-support hum, the suit's slow breathing, a faint radio carrier; radio chatter with beeps every 15 to 30 s; a navigation ping from each antenna as the car passes it; the engine and wind muffled outside and **full only in the two pressurised places** (start hall, tunnel), with a hiss of pressure at the tunnel mouths.
2. **Dust that behaves like dust.** Grey, opaque grains thrown from the wheels in ballistic arcs, no growth, no hang, falling straight back (the engine's plume is a soft growing cloud, which reads as atmosphere). In the jump the grains follow the car down the arc. In the arena they make the drifts readable. This is the map's visual signature.
3. **The jump as a staged event.** Flat-out run-up with a sequenced guide-light chase and ping at the lip masts; in flight the cabin goes silent except the breathing, a radar-altimeter beep that accelerates to the floor, the Earth above, the car's shadow growing on the crater floor, a thump through the chassis on landing.
4. **A lander that comes down** (alternate laps, lifts off on the others) beside the base, with a ballistic dust ring at touchdown: the "aircraft taking off" of this map, seen from the first bend.
5. **Antennas that turn, masts that pulse, a crawler on a service track.** Four lattice masts and the control tower get a slowly turning cross-arm / radar; mast tips pulse in their own material (orange rail beacons stay steady, as the mood sheet says); a cargo crawler crawls toward the car along a service lane in the base zone.
6. **Light that has no air to soften it.** Real dynamic lights inside the hall (cold ceiling light on the rover) and tunnel (amber pools passing), sun glints that flash off solar fields and the tower cab, blue-tinted earthshine in the shadows, a hard sun disc with weaker halo, eye adaptation at the tunnel mouths.
7. **Pressurised places feel pressurised.** Hall and tunnel get their own reverb (`ACOUSTICS.spots`), a fan drone, a hazard beacon and a PA chime at the mouths, and a hiss at each door.
8. **Vented gas and impact flashes**: a cryo vent at the dome lock and the maintenance tank (a short fan of white grains that does not drift), and a meteor impact flash with a ballistic ejecta fountain in the west crater, once every few laps.

## Global settings

Exact options for the `lune` entry (`src/data/maps.js`). Test with `?opt=<JSON>` and `node tools/plan.js lune <shot> --before`.

```js
// map block
amb: [[1, 89], [101, 131]],        // the bed sounds everywhere except the tunnel (pts 91-99, which has its own bed); the hall is handled by AMBZ entries (it straddles the start)
// th
dust: [0.55, 0.56, 0.62],          // grey regolith. Required before any dust exists. Check that the dust call runs on the lune roadway (surf rollAmt > 0.25 is the gate, game.js ~828)
eye: { tun: 0.5, blackM: 0.45, clair: 0.25 },   // hall and tunnel are bright inside, the sunlit crater outside is brighter: no switch at the exit
hemi: [0x7c8eb4, 0x6c7288, 0.6],   // was [0x8090a8, 0x747988, 0.6]: the sky fill leans blue = earthshine in the shadows; shadows stay nearly black
orb: { dir: [-0.6, 0.5, 0.5], col: '#ffffff', shadows: '#ffffff', imgSize: 120, spokes: 0.35 }  // keep existing values; only spokes is new: a hard disc with a weak halo (no atmosphere to scatter)
gloss: 0.02                        // dry vacuum regolith: no road sheen (road already has lit ivory rails)
```

Unchanged on purpose: `fog` / `fogD` (sharp horizon, as the mood sheet says), black `sky`, `stars: 90` and the `cielLune` texture, `bloom 0.03`, `scan 0.05`, `headlights 0`, `wetVisible` (no `damp` zones), `th.haze` (none). `th.shadows`: keep the default; check `plan.js lune @180` and `@1000` for stair-stepped shadow edges against the sun; if present, `shadows: { soft: 1 }` is the only fix (it softens edges slightly: judge it, hard shadows are the look).

Sound, in `src/audio/audio.js` (the implementer edits it; entries are data in the existing formats, `AMB` ~line 45, `AMBZ` ~60, `ACOUSTICS` ~728):

```js
AMB.lune = [['lowpass', 90, 0.7, 0.05, 0.04, 0.3],       // life-support hum, the cabin's floor
            ['bandpass', 700, 0.8, 0.018, 0.2, 0.95],    // the suit's breathing: 0.2 Hz = one breath per 5 s, deep swell
            ['highpass', 6500, 0.6, 0.003, 0.37, 0.9]];  // faint radio carrier hiss
AMBZ.lune = [
  { de: 0.985, a: 1.0,   c: [['lowpass', 160, 0.7, 0.07], ['bandpass', 900, 1.5, 0.02, 0.13, 0.6]] },  // start hall, east half: air handlers
  { de: 0.0,   a: 0.022, c: [['lowpass', 160, 0.7, 0.07], ['bandpass', 900, 1.5, 0.02, 0.13, 0.6]] },  // start hall, west half (the lap number wraps)
  { tun: 1, c: [['lowpass', 140, 0.7, 0.06], ['bandpass', 480, 0.9, 0.025, 0.17, 0.5]] }];              // the tunnel: ventilation drone
ACOUSTICS.lune = { slap: 0.012, sl: 0.03, intoWall: 0.15, rv: 0.01, dur: 0.5, lp: 1400,                // outside: no echo at all, only the cabin
                   spots: [[0.985, 1, 3.5], [0, 0.022, 3.5], [0.68, 0.74, 5]] };                       // [from, to, factor] on the room: hall (both sides of the line) and tunnel: here the sound has real walls
```

New code in `audio.js` (marked NEW in the tables): outside-the-air filtering of engine, tyres and wind; the radio-chatter event in `ambEvent('lune')`; `HITS.ping`, `HITS.chime`, `HITS.hiss`; the altimeter beep. The scenery calls `SOUND.spots('lune', [...])` and `SOUND.brief(label, p, vol, range)` (pattern: `scenery-barrage.js` ~653); scenery never calls anything else.

## G: global elements

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| G-01 | Cabin bed | whole lap outside hall and tunnel | SND | A low hum, a breath every 5 s, a trace of radio hiss. Never loud. | REUSE: `AMB.lune` above (same format as `AMB.perse`), `amb` list above. | P0 | Breathing must stay under the engine: level 0.018. |
| G-02 | No wind outside, no echo outside | whole lap | SND | At speed there is no wind roar, no tyre echo; the engine is the cabin's muffled version of itself. | NEW in `audio.js`: wind gains are `(1 - tun)` at ~1026 (`windG`, `windL`): on `lune` multiply by the "in a pressurised place" factor (`tun`, or hall fractions 0.985-1 and 0-0.022) instead; engine and tyre families through a lowpass at ~1100 Hz when outside, open (lowpass 6000) in hall and tunnel, crossfade 0.3 s. `ACOUSTICS.lune` above removes the slap echo. | P0 | If the muffling is too heavy the car feels dead: keep the engine audible, only duller; the author should listen (`pages/listen.html`). |
| G-03 | Radio chatter with beeps | whole lap, more often near base | SND | Every 15 to 30 s: a squelch, a short beep, three to five syllables of walkie-talkie babble, a closing click. Every few events a two-tone "roger". | REUSE: `radio(n, f0, spd)` and `beep(f)` of `audio.js` (~921), called from a new `if (id === 'lune')` branch in `ambEvent` that returns the delay; vary `f0` between two voices (the three drivers' names are in `maps.js`: GENE, VALYA, DEKE). Level low (0.04). Shorter gap (8-15 s) in base zones: use `ambPos`. | P0 | Repetition: three syllable counts, two pitches, random gap. |
| G-04 | Navigation pings | masts and antennas, see zone tables | SND | A short soft ping (1320 Hz sine, 0.12 s, then a 660 Hz tail) in the cabin when the car passes within 60 m of a navigation antenna: the radio picks up its transponder. | REUSE: `SOUND.brief(label, p, vol, range)`; NEW `HITS.ping` in `audio.js` (pattern `HITS.hammer`, ~549). Triggered from the tick when `car.idx` crosses the antenna's sample (the scenery tick receives `car`). | P1 | Brief only; never at a braking point more than once. |
| G-05 | Earthshine in the shadows | whole lap | LIGHT | Shadow sides of modules and crater walls lean slightly blue instead of neutral grey. | `th.hemi` above. | P1 | Do not lift the shadow level: hard near-black shadows are the look. Check `plan.js lune @180 @1700`. |
| G-06 | Sun disc, hard | where the sun is in frame (seen at 2160, top left) | LIGHT | A small white disc with a weak halo. | `th.orb.spokes: 0.35`. | P1 | Low. |
| G-07 | Ballistic dust from the wheels | roadway and arena, whole lap, strongest in arena and after landing | PART | Small grey opaque grains kicked back and up from each rear wheel in short parabolas, no growth, no fade-out before landing, they bounce once and lie still. Slides throw twice as many. 1 to 3 s trail behind the car, always in the chase camera's view. | NEW, in `game.js` (shared: **propose to the author before touching**). The engine plume (`dust()` in the `TH.dust` loop, ~828) uses `softPuffs` (growing, fading clouds): wrong here. Use `strokeLn(x, y, z, vx, vy, vz, vitality, grav, k, rgb, ground)` (~782): it takes a gravity and a ground height. Gate on a new `th.dustBallistic: { grav: 1.62 × the game's lune scale, n: 2 }` option so other maps are bit-identical: emit from the rear wheels, `vy` 0.8 to 2.5 m/s, backward speed 0.3 × car speed + jitter, `ground` = the ground height under the car (`c.y - 0.5`). Flight time must be 1 to 3 s. | P0 | Cost 480 particles max (existing pool). Confirm that `th.dust` fires on the lune surface (`rollAmt`), otherwise set it on the roadway material. Grains must be opaque squares (no alpha: alpha blending reads as a modern effect). |
| G-08 | Dust follows the car in the air | the jump, any hop | PART | After the lip the grains keep the car's velocity and stay beside the car all the way down: a string of dots tracing the arc. | Same as G-07: while `c.air`, emit with `v = car velocity × 0.9` instead of the backward burst. | P1 | Do not exceed the pool when airborne at 3 s. |
| G-09 | Tyre tracks that stay | arena especially | PART | The tyre traces left on the regolith do not vanish. | Check: `traces de gomme` ring buffer (`gP`/`gC`, `GN`, `game.js` ~714). If it persists for the lap, tint it dark grey on lune and that is all; if it does not, leave it. | P2 | Unverified (see end of document). |
| G-10 | Sun glints on flat metal | solar fields (samples ~203 and ~230, ~2460), tower cab (68), dome | REFL | A small white four-point star flashes for 0.3 s when the car's bearing meets the specular angle of the panel, then fades: the only "reflection" this map has. | NEW: one `PlaneGeometry` quad per field, camera-facing by yaw (as `h.beams`, ville), additive, `dyn = 1`. Alpha = `smoothstep(0.96, 0.995, dot(reflect(-sunDir, panelNormal), dirToCamera))` eased with `dt` (rise 0.08 s, fall 0.3 s). Sun dir is `th.orb.dir`. | P1 | A sparkle in motion can shimmer: quad is large (3 m), one per field, eased. Never on the road. |
| G-11 | Earth cloud turn and star drift | sky, seen 1680, 2100-2200 | OBJ | Almost imperceptible: stars drift 3° per lap; Earth's cloud layer turns. | NEW: `sky.rotation.y += 0.0006 × dt` on the sphere found by radius 2500 in `scenery-lune.js`; Earth: a second `CircleGeometry` of cloud texture at 1 turn per 600 s. | P2 | Nearest-filtered stars hop one texel every ~10 s: drop this if the hop is visible. |
| G-12 | Beacon material and mast material | all `baliseLune` and `antenneLune` | LIGHT | Orange rail beacons steady (mood sheet: "lit but not blinking"). Mast tips and tower top pulse slowly. | NEW: split `MAT.glow` into `MAT.glow` (beacons, steady) and `MAT.mast` (`h.mat('paint', { emis: 1, c: 0xffa040 })` cloned) for the `glow` boxes of `antenneLune`, `tourLune`, `relaisLune`, `landerLune`; tick sets `MAT.mast.color` from `0.55 + 0.45 × smooth(sin(t × 2.6))` (period 2.4 s, ramped). | P1 | `src/engine/rhythm.js` rewrites the colour of opaque `MeshBasic` every frame: check the material type and scale `color` via a uniform if it is overwritten (LIFE.md, Pitfalls). |

## Zone 1. Start hall and base out (samples 0-253; hall -26 to 56, dome 101, tower 68, hangar 134, solar fields 203 and 230, tanks 195-215)

What the player sees: on the grid, the airlock bay frames repeating, the exit door as a black rectangle; then out of the hall at 105 km/h the dome (70 m) fills the outside of the first bend, modules, tower, a hangar, solar fields and tanks go by on both sides over about 8 s; rail beacons every 80 m. Black sky behind it all. Today nothing moves and nothing sounds; the landing pad and lander (60 m off, sample 30) sit at the edge of the frame at 60 and are never really seen.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z1-01 | Hall acoustics and air-handler hum | hall, samples 2640-56 | SND | The engine suddenly open and loud, close echoes off the bays, a 100 Hz hum of air handlers. About 3 s at lap speed, longer on the grid. | REUSE: `AMBZ.lune` hall entries and `ACOUSTICS.lune.spots` above (pattern: `ACOUSTICS.perse.spots`); lift the engine muffling (G-02). | P0 | Low. |
| Z1-02 | Hall ceiling lights on the rover | four bays, PK LAP-30, 10, 50, 90 (samples ~2663, 5, 25, 45), 14 m up | DYNL | Cold blue-white pools sliding over the car and road bay after bay, in front of the black outdoors: the only enclosed warm-cold light of the lap. | REUSE: `h.emis(i, x, y, z, 0xcfe8ff, 28, 0.9)` (signature in MAP-ENGINE-OPTIONS, "`h.emis` returns its luminaire"), 4 luminaires at ceiling level over the axis. | P0 | Uses 4 of the 20 luminaires; see the budget at the end. |
| Z1-03 | Door-frame hazard beacons | two portiques: PK LAP-52 (sample 2640) and PK 112 (sample 57) | OBJ + DYNL | An amber light turning on each frame: one turn per 1.5 s, throwing a moving orange glow over the walls. | REUSE: `scenery-barrage.js` ~648 (rotating box `lapRun.push([g, 'y', 2.2])` plus `h.emis` pulse `l.c.copy(c0).multiplyScalar(0.6 + 0.4 × sin(t × 2.2))`). One 2-box dyn group per frame, in place of the static `glow` boxes. | P1 | Not at a braking point (start straight). Keep the turn steady, no hard flash. |
| Z1-04 | PA chime at each door | same two frames | SND | A two-note descending chime as the car crosses each door frame. | REUSE: `SOUND.brief`; NEW `HITS.chime` (two sine notes 880 / 660 Hz, 0.3 s each, through a lowpass 2200). Trigger when `car.idx` crosses the frame's sample. | P2 | Low. |
| Z1-05 | A lander comes down, or lifts off | new pad, left of the road at PK ~300, 150 to 200 m off (samples ~150, seen from 100 to 250) | OBJ + PART + DYNL | A descent stage on a short orange flame sinks onto its pad in 12 s, the last 2 s throwing a ring of dust outward in flat parabolas, then stands. On the next lap the same craft lifts off: flame, dust ring, then it climbs and shrinks straight up. About 4 s in view over the dome (from sample 100 to 250). | REUSE: `landerLune` shape (already used on the pad at PK 60: take one out of `kit` for the mover) and `padLune` for a second pad (copy the `by()` call of `scenery-lune-base.js`, bigger offset). NEW: a dyn group with an emissive flame cone (`MAT.glow`, scaled with thrust) and a ring of 24 opaque grey grains launched from the pad centre on parabolas (same recipe as G-07, in scenery: 24 instanced cubes, `dyn = 1`). Descent: `y = 110 × (1 - t/12)²` (decelerating), ascent mirrored. Alternation by lap parity; **trigger when `car.idx` crosses sample 60** so the event starts about 3 s before the car sees it (the tick gets `car`). Sound: see Z1-06. | P0 | The pad must be flat ground away from the guardrail view. 150 m off, 40 m craft: reads as a clear small ship. Not collidable (LIFE.md rules). |
| Z1-06 | Lander through the ground | same | SND | No sound in vacuum: a low swell felt through the chassis, a 55 Hz sine and rumble that rises over 8 s, thumps at touchdown or lift-off, then silence. | NEW `HITS.thump` (sine 55 Hz plus lowpass 120 Hz noise, 1.2 s) through `SOUND.brief('thump', padPos, 0.6, 600)`; the swell as a second `brief` at start. | P1 | Low. |
| Z1-07 | Control tower radar | `tourLune` at PK 135 (sample 68), 46 m, left 34 m | OBJ | A small lattice radar turning on the roof mast, one turn per 6 s, seen face-on then edge-on as the car leaves the hall. 3 s. | NEW: split the roof `steel` mast box and add a flat dish (reuse `soucoupeLune`, `dish` material) as a dyn group at the mast top (y 44); `rotation.y += 1.05 × dt`; mast `glow` uses `MAT.mast` (G-12). | P1 | Check a thin dish at 270 lines in motion: `--burst=6`. |
| Z1-08 | Mast cross-arms turn | `antenneLune` at PK 230 (sample 116, 120 m right) and PK 350 (sample 177, 30 m right, 24 m high) | OBJ | The cross-arm (7 m) at 86% of the mast height turns one turn per 8 s with the amber tip pulsing. 2 s each. | NEW: the `steel` 7 × 0.3 × 0.3 box becomes a dyn group, `rotation.y += 0.785 × dt`, per mast (the shape keeps a static copy elsewhere: add a parameter `arm = false` to `antenneLune` to leave it out and pose it separately). | P1 | Thin lattice: alphaTest edge; check `--burst=6`. |
| Z1-09 | Navigation ping at the first masts | samples 116 and 177 | SND | A ping as each passes abeam. | G-04. | P1 | Low. |
| Z1-10 | Cargo crawler on a service lane | lane at offset 35-45 m on the left from sample 90 to 250, passing the hangar (sample 134) | OBJ + PART | A slab-sided crawler (8 × 3 × 4 m, an amber light bar) rolls toward the car at 6 m/s, tracks turning, a trail of grains falling behind it. Closing at 67 m/s, seen for about 4 s, big in the frame at the end. | NEW: boxes from `roverLune` pattern (ivory body, dark cabin, amber bar, tyre boxes) as a dyn group; path = `S` samples at `edgePt(s, -1, s.w + 38)` walked backward (pattern: area51 Z4-04, `lane()` of `scenery-area51-collines.js`); wheels turning by distance; resets while hidden behind the hangar. Grains: the G-07 recipe from the tracks, 2 per second. | P1 | At least 25 m off the rail. No collision. A moving shape against static ones is the most readable thing on the board: keep the colour ivory with a single amber light, no flashing. |
| Z1-11 | Hangar door | `hangarLune` front, PK 265 (sample 134) | OBJ | The dark door panel (0.6 × 10.6 × 32 m) slides up 6 m as the crawler comes out and down when it is gone. | NEW: that box split off the hangar group, dyn, ease in/out over 8 s, tied to Z1-10's state. | P2 | Low. |
| Z1-12 | Solar fields aimed at the sun, glints | `champSolaireLune` at PK 400 and 455 (samples 203, 230), 30 m left | OBJ + REFL | Rows of panels face the sun (they do not move: sun trackers are slow); a star glint flashes as the car passes the specular angle. 2 s. | REUSE: `by()` with `ry` set so the panel normal points at `th.orb.dir`'s azimuth (free). Glint: G-10. | P1 | Static aim must not hide the road: fields are set back. |
| Z1-13 | Cryo vent at the dome lock | habitat dome, PK 200 (sample 101), entry lock on the road side | PART | Every 25 s a jet of white grains shoots out of the lock in a fan, flies straight and falls: no cloud, no drift. 1.5 s. | NEW: 20 white opaque grains instanced (`dyn = 1`), 8 m/s fan 30° wide, gravity 1.62 scaled; one `VENT` helper reused at Z6-05. | P2 | Low. |
| Z1-14 | Windows of the dome | window ring, 12 `hublot` boxes | LIGHT | Steady warm windows. A single window dark for a while is more alive than flicker: skip. | none | Rule | n/a |

## Zone 2. West crater and chicane (samples 253-679; fresh impacts 253-405, relay hairpin 550)

What the player sees: the chicane between two fresh impacts with their bright thrown blocks (253-405), then a rim road over the western crater (Ø 545 m, to the left, 272 m radius) with rock terraces on its wall and instrument stations on the rim, then the hairpin round the relay (about 550, the braking point) and its tilted dish. About 7 s of open crater view; no human object for 200 m at a time.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z2-01 | Meteor impact in the west crater | crater floor, 150 to 250 m left of the road around samples 430-520 | PART + LIGHT | Once every three laps (lap parity) a white flash on the crater floor for two frames, then a fountain of dark chips flung 40 m up in slow parabolas and falling back, and a flat ring of grains that expands and lies still. 3 s, seen across the open crater. | NEW: one dyn group: a quad flash (additive white, 0.1 s), 40 instanced dark cubes on parabolas (`g = 1.62 × scale`), 24 grain ring. Trigger: car crossing sample 380 on a lap where `lap % 3 === 1`. The point is chosen once and fixed (hash). | P1 | Not near the hairpin. One flash only, no flicker. Opaque particles. |
| Z2-02 | The impact through the chassis | same | SND | A dull thump in the cabin 0.5 s after the flash (the ground carries it), then silence. | `SOUND.brief('thump', p, 0.5, 700)` (HITS.thump, Z1-06). | P2 | Low. |
| Z2-03 | Relay hairpin: stays still | `relaisLune` PK 1086 (sample 550), 24 m left; its dish and red light | OBJ | Nothing moves and nothing blinks at the braking point (LIFE.md rule). The dish stays tilted toward the base, light steady. | none | Rule | n/a |
| Z2-04 | Relay ping | sample 550 | SND | A ping as the car brakes in. | G-04, on the approach side (sample 535, before the corner), not at the apex. | P2 | Must not mask the braking sound: level 0.5. |
| Z2-05 | A rover on the rim opposite | far rim of the west crater, 400 m left, samples 430-520 | OBJ + PART | A small ivory rover creeps along the far rim leaving a grey trail of grains that falls at once; 3 s, tiny but the only living thing across the crater. | NEW: `roverLune` shape in a dyn group on a polyline along the crater rim (centre (-555, -101), r 272 + 40), 5 m/s; grains like Z1-10 but 1 per s. | P2 | Too small at 400 m if it is not ivory against the dark wall: keep it light. |
| Z2-06 | Instrument stations | `capteurLune` PK 760, 900, 1040, 1260 (samples 385-640), 5 m behind the rail | OBJ | Orange flags that do not flutter: still. A tiny panel that turns slowly is invisible at speed. | none | Rule | n/a |
| Z2-07 | Chicane beacons steady, bright blocks lit | beacons PK 520, 640 | LIGHT | Steady orange: the guide through the chicane. | `MAT.glow` steady (G-12). | Rule | n/a |

## Zone 3. The ridge and the run-up (samples 679-1540; six bends 710-1300, hairpin 1387, run-up from ~1450, lip 1540)

What the player sees: flanks on the outside of each bend, pale crests inside, antennas and instrument stations small and far, a mostly black sky full of stars with the Earth not yet visible; about 14 s of winding ridge. The run-up (1450-1540, 90 m, 1.5 s) is empty with two lattice masts framing the lip and the Earth above the far rim. Nothing is alive here today.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z3-01 | Guide-light chase to the lip | rail beacons at PK 2900-3080 (samples ~1470-1540), one pair every 10 samples | LIGHT | Orange lights lighting one after another toward the lip at 1.5 chases per second, ramped (90 ms rise), so the road seems to pull the car to the edge. 1.5 s, the last read before the jump. | NEW: 8 beacons in the run-up each with its own cloned `glow` material (8 materials, the only exception to G-12), tick sets `0.25 + 0.75 × smoothstep(phase)` with `phase = frac(t × 1.5 - k × 0.12)`. | P0 | A fast alternation can flicker: ramp 90 ms and keep under 2 Hz per light. Not at a braking point: it is a flat-out straight. |
| Z3-02 | Lip masts ping | `antenneLune` pair at `sit(lip, 0, ±15)` (sample ~1510) | SND | A clear ping on each mast, left then right, as the gate of the jump. | G-04 (two pings 0.1 s apart). | P1 | Low. |
| Z3-03 | Lip mast tips pulse | same masts | LIGHT | The two amber tips pulse together slowly (2.4 s), a pair of eyes on either side of the run-up. | G-12 (`MAT.mast`). | P1 | Low. |
| Z3-04 | Hairpin antenna (static) | `antenneLune` PK 2740 (sample 1387), 20 m outside | OBJ | Still: the hairpin is a braking point. Tip light steady. | `MAT.glow` steady for this one, not `MAT.mast`. | Rule | n/a |
| Z3-05 | Dust in the bends | whole ridge | PART | Grey grains thrown outward on each bend, arcs short, a thin falling curtain at the outside edge. | G-07. | P0 | See G-07. |
| Z3-06 | Ridge stars and the Earth appear at the crest | samples 1450-1540 | OBJ | The Earth appears small above the far rim as the car climbs the run-up, then holds still. | existing: `terreLune` at (-310, 2230, 480). Optionally the cloud turn of G-11. | Exists | Low. |
| Z3-07 | A crawler far across the great crater | far rim, 600 m right beyond the north wall, samples 1200-1450 | OBJ | A tiny pale crawler moving on the far rim with a grain trail: only readable in gaps between flanks. | Same shape as Z1-10, path on a circle of radius 380 round (470, -200), 4 m/s. | P2 | Often hidden by the flanks; cheap, but expect it to be missed. |

## The jump (samples 1540-1620): the map's long moment

Seen in the boards at 1500 (masts), 1560 (flight) and 1620 (floor): the road lifts 3 m at the lip, the car leaves at about 63 m/s, falls roughly 100 m onto the arena floor over 2 to 3 s (`loft`, `fallCam: 1`), the camera drops with the car and the look target tips down. At 1560 the player sees the whole floor from above: the concentric rings of the wall, 28 small craters of the floor, the tunnel mouth far ahead in the foot of the wall; the Earth is above the top edge and leaves the frame during the dive.

What the player should see and hear in flight: the sun-lit floor and its craters coming up; the car's own **hard shadow** growing on the floor (shadows are on, field 390 m: check that the car casts one; if not, a dark quad is not acceptable, leave it); a string of grey grains along the car's arc (G-08); the two mouth beacons pulsing ahead; and **silence**: no engine, no tyres, only breath and the altimeter.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| J-01 | Cabin falls silent in flight | from `c.air` for more than 0.25 s | SND | The engine and tyre sound drop to nothing over 0.2 s; the hum, the breath and the radio carrier stay. 2 to 3 s of near silence, the loudest moment of the lap because of it. | NEW in `audio.js`: the `car.air` flag is available (`~1013`, `air = c.air ? 0 : 1`): multiply `mot` and `pneu` gains by `air` on lune with a 0.2 s ramp. | P0 | Short hops over small craters in the arena would flicker the sound: require 0.25 s airborne before cutting. |
| J-02 | Radar altimeter beeps | during flight, height above the arena floor | SND | A soft beep (1000 Hz sine, 0.06 s) whose interval shrinks from 0.6 s to 0.1 s as the floor approaches: the sound of falling. | NEW in `audio.js`: height = `car.y - (-29.9)` (arena floor `EAST[5] + 0.08`), only while `car.air` and `car.x, car.z` inside the arena circle `M.place` (c (470, -200), r 320). | P0 | Hard-coded floor height: mark it with a `shortcut:` comment; if later maps jump, move to a `th.altimeter` option. |
| J-03 | Landing | arena floor, ~1600 | SND + PART | A heavy thump in the chassis, a short dull ring, then the engine returns; a ring of grains jumps off the wheels and falls. | REUSE: the existing impact sound and G-07's burst (a stronger `n` for 0.3 s after `air` ends). | P1 | Low. |
| J-04 | Mouth beacons pulse in anti-phase | arena side of the tunnel mouth, `baliseLune` pair at `sit(tunnel[0], 0, ±23)` (sample ~1820) | LIGHT | The two beacons breathe alternately at 1.4 s, a target 360 m ahead from the top of the flight. | NEW: two cloned materials, `0.3 + 0.7 × smoothstep(sin)` in anti-phase. | P1 | Mood sheet says "no beacon on the floor": these stand at the tunnel mouth, not on the floor of the arena. |
| J-05 | Earth above the lip | `terreLune`, dead ahead from 1500 | OBJ | Visible small and blue for 1.5 s until the camera tips. | existing. | Exists | Low. |
| J-06 | Glints from the arena wall strata | wall rings (`strata`, `crest`) | REFL | none: the strata are matte regolith. Do not add specular. | none | Rule | n/a |

## Zone 4. The great crater: arena (samples 1600-1830)

What the player sees: a flat floor 400 m across with 28 craters (10 to 34 m) driven freely, the wall rising on every side (360 m rim), a ring of boulders high up, the tunnel mouth in the wall straight ahead, the study station on the far rim. Time spent here depends on the player (5 to 10 s): this is where dust and tracks matter most, and the one place in the lap where the player looks around.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z4-01 | Dust on the floor and the small craters | arena, whole | PART | Grains thrown in arcs from each wheel; slides throw sheets of grains that fall in half a second; a crater lip makes the car hop and the grains follow. | G-07, G-08. | P0 | Particle pool is shared by up to 8 cars in a race: check the budget (`softPuffs(480, …)`). |
| Z4-02 | Tracks that stay | floor | PART | Dark double lines behind every car, never erased (no wind). | G-09. | P2 | See G-09. |
| Z4-03 | Static discharge on landing | player car, after the jump and a hard hop | LIGHT | A small blue-white spark crawls on the rover's antenna tip and the wheel arches for 1 s after a landing: lunar dust is charged. | NEW, small: 4 short additive line quads on the whip antenna of the player's car (the car model is shared; gate by `th.dustBallistic`), alpha from `c.air` end time. Reuse `crackle` sound (`HITS.crackle`, existing). | P2 | The car model is shared: if the antenna cannot be reached from scenery, drop it. |
| Z4-04 | Tunnel mouth: hazard beacon and chime | `boucheLune` at sample 1820 | OBJ + SND | A rotating amber light over the arch (1 turn per 1.5 s) and the PA chime as the car enters. | REUSE: Z1-03 and Z1-04 pattern. The mouth beacons are the J-04 pair. | P1 | At the tunnel entry, not at a corner. |
| Z4-05 | Study station on the far rim | (359, 147), dome and mast | LIGHT | Tiny windows and a pulsing tip, 500 m away, to give scale. | `MAT.mast` for the mast tip (G-12). | P2 | Too small to read at 270 lines: free. |
| Z4-06 | Pressure hiss at the mouth | sample 1818-1826 | SND | A 0.5 s hiss and the sudden open sound of the engine as the car passes the doors: an airlock without a door. | NEW `HITS.hiss` (highpass 3000 Hz noise, 0.5 s, envelope), `SOUND.brief('hiss', mouth, 0.7, 120)`; the engine opens through G-02. | P0 | Low. |
| Z4-07 | Meteor flashes: none in the arena | | | A flash in the arena would hide the road choice: keep impacts to Z2. | none | Rule | n/a |

## Zone 5. The tunnel (samples 1820-1980; 160 m, 2.7 s)

What the player sees: the pressurised covered way: ivory wall panels, an orange band at wheel-arch height, cold blue strips, a warm light on the rover, a chevron at the bend (1980). 2.7 s at lap speed, the only warm interior after the hall. The only acoustic space of the lap besides the hall.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z5-01 | Tunnel acoustics and fan drone | tunnel | SND | Short strong reflections, the engine full and open, a low ventilation drone. | `AMBZ.lune` `{ tun: 1 }`, engine opens (G-02); the engine already routes the tunnel reverb. | P0 | Low. |
| Z5-02 | Passing amber pools | tunnel, samples ~1845, 1885, 1925, 1965 | DYNL | An amber pool slides over the car and walls every 40 samples (0.65 s): the speed. | REUSE: `h.emis(i, x, y, z, 0xdf8c40, 22, 0.9)` ×4 on the axis at the vault height (the engine's `lamps` are switched off in `maps.js`: these replace them as true lights). | P1 | Uses 4 luminaires. |
| Z5-03 | A failing strip | one `h.emis` at sample 1905 | DYNL | One of the four pools dims for 0.3 s every 12 s and returns by ramp: a sign the base is old. | `l.c` rewritten from the tick (pattern: LIFE.md, `h.emis` returns its luminaire); amplitude ±35%, ramp 0.15 s. | P2 | A flicker can read as a bug: keep to once per 12 s. |
| Z5-04 | Eye adaptation at the mouths | entry 1820, exit 1980 | LIGHT | Entering the tunnel the outside goes dark slowly; leaving it, the basin floor is bright but does not dazzle. | `th.eye` above. | P1 | Tune by playing. |
| Z5-05 | Hiss and chime at the exit mouth | sample 1980 | SND | The same hiss and chime in reverse. | Z4-06 and Z1-04 at `sit(tunnel[1])`. | P1 | Low. |
| Z5-06 | A passing maintenance light on the wall | tunnel wall, right | OBJ | Nothing: a tunnel with 160 m has no space for objects the player can read. | none | Rule | n/a |

## Zone 6. South basin, the ramp and the base return (samples 1980-2678; ramp 2000-2300, rim ~2300, garage 2440, return to the hall 2540-2640)

What the player sees: out of the tunnel on the basin floor (-28 m) the long ramp up the wall (8%), rock terraces on the left, instrument stations on the basin side; at 2100-2200 the Earth (small, blue) and the sun at the top left of the frame, the one composed view of the lap; the rim, the maintenance area (garage, rover, tank, solar field, pipes, mast), then the beacons return and the hall door frame at 2640.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z6-01 | The Earth and the sun in one frame | samples 2100-2200 | OBJ + LIGHT | The blue Earth at the left of the ramp and the sun above it for about 3 s: nothing to add except clarity. | Keep `terreLune` (world position) and `th.orb`; check with `plan.js lune @2100 @2160 --style=game` after G-06. | Exists | Low. |
| Z6-02 | Maintenance rover leaves the garage | `garageLune` PK LAP-470 (sample ~2440), `roverLune` PK LAP-425 (sample ~2463), 14 m off the road | OBJ + PART | When the player passes sample 2380 the parked rover pulls away from the road toward the solar field at 6 m/s, wheels turning, a falling trail behind it; the garage door goes up first (Z1-11 pattern). 2 s as the car passes. | NEW: split `roverLune` into body and 4 wheel groups (the `tire` boxes at 0 and 45°) so the wheels can turn by distance; path of 60 m ending in a stop; resets 12 s later. | P1 | Wheels turning at 270 lines: check `--burst=6`. Keep clear of the rail (14 m). |
| Z6-03 | Mast cross-arm turns and pings | `antenneLune` PK LAP-400 (sample ~2465) | OBJ + SND | As Z1-08 and G-04. | Z1-08, G-04. | P1 | Low. |
| Z6-04 | Solar field glint | `champSolaireLune` PK LAP-430 (sample ~2460) | REFL | A glint as the car passes (G-10). | G-10. | P1 | Low. |
| Z6-05 | Cryo tank vent | `citerneLune` PK LAP-515 (sample ~2420) | PART | The same fan of white grains as Z1-13 every 30 s. | Reuse the `VENT` helper of Z1-13. | P2 | Low. |
| Z6-06 | Hall door ahead | portique PK LAP-52 (sample 2640) | OBJ + SND | The hazard beacon and chime of Z1-03 and Z1-04 greet the car as the lap ends, the hall's light ahead on the black. | Z1-03, Z1-04. | P1 | The turn into the hall is not a braking point (straight). |
| Z6-07 | Ramp: nothing else | ramp, samples 2000-2300 | | The ramp is climbed at full speed against a wall; a moving object would compete with the Earth view at 2100. | none | Rule | n/a |

## Luminaire budget (`h.emis`, 20 at most)

Hall 4 (Z1-02) · tunnel 4 (Z5-02) · hazard beacons on the hall frames 2 (Z1-03) · tunnel mouth 2 (Z4-04) = **12 used**, 8 spare. Keep the spare for a field test, not for filling the map: a light that does not reach a surface the player sees is wasted.

## What NOT to do on this map

- **No wind, no flutter, no fog, no haze, no weather.** No flags that wave, no drifting smoke, no fog bank, no clouds, no haze at the horizon. The horizon is sharp at any distance (the mood sheet says so). No `th.haze`, no `th.seaSpray`, no `th.leaves`, no `surf` `damp` zones.
- **No water, no ice, no frost.** There is none in this version of the Moon; `wetVisible` must stay off.
- **No outside sound that has a source in the air**: no wind, no waterfall, no engine echo off crater walls, no birds, no distant machinery heard by ear. Everything outside is the cabin, the radio, the ground (thumps, rumble) or a ping. The only places with a real room are the hall and the tunnel.
- **No soft dust clouds** (`softPuffs` growing and fading) and no alpha particles: a cloud that hangs is atmosphere. Opaque grains in parabolas only.
- **No flicker of stars and no twinkle**: no atmosphere. Stars are still; at most a slow turn (G-11).
- **No moving or blinking object at a braking point**: the relay hairpin (550) and the ridge hairpin (1387) stay still with steady lights; the pings there are on the approach.
- **No floodlight masts**: it is lunar morning, the sun is the only light; floodlights would be wasted and would compete with the hall's lit/dark contrast. Light is only inside the hall, the tunnel and the beacons.
- **No headlight beams** (`headlights 0`): they would light the dark of the shadows that earthshine should paint.
- **No beacon or light on the arena floor**: the mood sheet and `scenery-lune-arene.js` say so. The only lights near it are the two mouth beacons.
- **No sun-glint on the road or the strata**: they are matte; glints only on solar fields, the tower cab and the dome.
- **No animated door strips or SF light bars** (mood sheet "Not this": a science-fiction door with animated light strips). The doors get a rotating beacon and a chime, nothing more.
- **No collidable moving objects**: the crawler, rovers and lander are visual only (LIFE.md rule), they depend on `dt` and lap parity so they stay deterministic for ghosts and online play.

## Open questions for the author

1. **Engine and wind muffling outside (G-02).** The plan makes the engine duller outside the hall and tunnel, and kills the wind roar. Is that wanted, or should the rover keep its normal engine sound everywhere (as a game concession) and only the wind goes?
2. **Ballistic dust touches `game.js` (G-07, G-08).** It needs an option `th.dustBallistic` in the shared dust loop. Shall the implementer propose that change in the same batch (inert on other maps, checked by `tests/test-maps.js`)?
3. **The lander event (Z1-05): every lap or alternating?** Descent on odd laps and lift-off on even is the proposal. Should it also happen on the first lap (the one the player is learning)?
4. **Radio chatter language.** The beeps and babble are wordless (the existing `radio()` is syllables). Is that right, or should a short spoken-style line (a countdown at the lip, "ten, five…" in beeps) mark the jump?
5. **The Earth: world object or sky object?** It is a disc placed 3 km away, so it moves across the screen with the car's turns (seen at 1680, 2100, 2160). A sky-locked Earth would stay at one place in the sky as the mood sheet says, but would be visible only on some stretches. Which is the author's intention?

## Not verified (the implementer checks first)

- Whether `th.dust` fires on the lune roadway (`rollAmt` gate, `game.js` ~828) and whether gravity in `strokeLn` can be scaled to the lune `grav: 8`.
- Whether the tyre-gum ring buffer persists for a lap (G-09) and whether the car casts a shadow in flight.
- Material types for `MAT.glow` / `MAT.mast` against `src/engine/rhythm.js` (G-12).
- Where exactly the new lander pad and the service lane fit (flat ground, clear of rails): positions are by chainage and must be confirmed with `plan.js`.
- Nothing was heard: all sound entries are data in existing formats plus described new `HITS`; listen in `pages/listen.html`.
- Boards were captured with the autopilot at about 100 km/h, not at the gold lap speed; durations use 61 m/s.
