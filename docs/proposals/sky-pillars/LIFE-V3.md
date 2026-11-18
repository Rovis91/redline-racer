# Sky Pillars (`piliers`): life and atmosphere, V3 specification

Written for the implementer. No game code was written. Sources: `docs/methods/LIFE.md`, `docs/methods/MAP-ENGINE-OPTIONS.md`, `docs/ART-STYLE.md`, `AMBIANCE-V2.html`, `src/maps/piliers/*`, the `piliers` entry of `src/data/maps.js`, `src/audio/audio.js`, and the shipped maps `barrage`, `chapada`, `wangan`, `paris`. Three boards of the racing camera (`--style=game`, one view every 60 samples, 34 views) were read; the files are in `captures/plans/piliers/`.

## How to read the numbers

- `N` = 2023 samples, one every 2 m; **sample = PK / 2** (`PK` = the chainage of the scenery files, lap 4042 m). Samples are used below, PK in brackets where the code gives one.
- The gold lap is 54.5 s, about **74 m/s**. One sample is 0.027 s; **one board frame (60 samples, 120 m) is 1.7 s**. An element visible over 150 m is on screen for 2 s. Everything below is sized for a 1 to 3 s read: big, slow, simple.
- Zones in samples: start/gate 1980-2023 and 0-60 · forest `foret` 0-367 · corniches 367-855 · bridge `pont` 855-1090 (deck 907-1031) · plateau `plateaux` 1090-1413 (tunnel 1200-1240) · descent `descente` 1413-2023.
- Track points (`M.pts`, used by `th.haze`, `th.seaSpray`, `M.amb`): point = sample / 20.
- Where a position is only approximate it says "check with `plan.js`".
- **One wind**: blows toward -x (west), as on chapada. Flags, smoke, spray, mist drift and leaves all lean that way.

## Summary: what changes the map most (priority order)

1. **A sea of clouds that lives, and layered mist between the pillars.** Two drifting cloud layers with parallax, drifting cloud shadows, three translucent mist sheets between 100 and 140 m, and a fog retune (`fogD`, two `haze` zones) so the far pillars fade in ranks. The sea is on the left for about 50 s of the lap (descent) and under both sides of the bridge.
2. **Waterfalls that fall.** Four: the HERO fall seen from the bridge (about 2 s, the signature), the buttress cascade at sample 1645 (8 m from the wall, spray on the lens, loudest water of the lap), the plateau fall and pool (1145-1165), and the P1 fall on the corniche. Each gets a sliding streak sheet in two layers, a mist boil where it enters the clouds, and a placed sound.
3. **The cable car runs.** Eight cabins already hang still: slide them along the ropes, add a turning bullwheel and a hum at the plateau station. Seen from the whole bridge approach.
4. **Wind in prayer flags.** About 28 strings, all static boxes today; turn them into one moving batch. They appear in every zone, so one cheap system gives life everywhere.
5. **Sound: the map has none.** `amb: []` and no `AMB.piliers` entry mean silence. Wind bed, forest bed, wind in the void, the singing bridge cables, crowd at the gate, temple bells, birds, echo off the pillars.
6. **Dust and leaves on the two dirt stretches.** `th.dust` is not set, so the packed-earth stretches raise nothing. One line, plus `th.leaves`.
7. **Birds.** Egrets rising from the verge ahead of the car (forest), raptors circling over the void on the corniches, and egrets flying below the bridge deck.
8. **Smoke, incense and light shafts**: chimney smoke in the village and tea houses, incense at the temples, pale light columns through the forest.

## Global settings

Exact options for the `piliers` entry (`src/data/maps.js`). Test any of them first with `?opt=<JSON>` and `node tools/plan.js piliers <shot> --before`.

```js
// map block
amb: [[1, 59], [63, 98]],            // the bed was off (amb: []); tunnel is pts 60-62 and has its own bed
// th
dust: [0.72, 0.58, 0.40],            // packed earth: pale clay. Required by leaves; today the dirt raises nothing
leaves: [[0.45, 0.55, 0.20], [0.60, 0.50, 0.15], [0.30, 0.45, 0.25]],  // green and old gold, like the forest
fogD: [420, 3000],                   // was [500, 3600]; far pillars (up to 2.8 km) go ~80% fog, so the ranks read as ranks
haze: [[2, 17, 0.78], [90, 98, 0.72],      // 3-value form: range x k. Damp forest at the start, woods before the line
       [62, 66, 150, 900]],                // 4-value form: mist at the tunnel exit, clears over ~200 m; the summit temple (about 400 m ahead) shows through it
seaSpray: [[81, 83.5, 0.4]],         // lens drops at the buttress cascade (sample 1645 = pt 82.2)
eye: { tun: 0.6, blackM: 0.4, clair: 0.2 },   // the 80 m tunnel opens onto a bright morning: no switch at the exit
orb: { dir: [-0.5, 0.6, 0.5], col: '#fff4d8', shadows: '#fff4d8', imgSize: 200, spokes: 0.7 }  // keep the existing values; only spokes is new
```

Unchanged on purpose: sky gradient, `fog` colour `0xcfe2ea` (the horizon colour, as `ART-STYLE.md` asks), `hemi`, `sun`, `bloom 0.03`, `shadows.soft`, `gloss 0.02`. `surf` stays as is: **do not add `damp` zones** (see "What not to do").

Sound, in `src/audio/audio.js` (the implementer edits it; entries are data in the existing formats):

```js
AMB.piliers = [['bandpass', 380, 0.6, 0.03, 0.08, 0.6],     // wind over the pillars
               ['lowpass', 110, 0.7, 0.05, 0.05, 0.4]];       // deep air of the ravine
AMBZ.piliers = [
  { de: 0.00, a: 0.18, c: [['bandpass', 800, 0.5, 0.03, 0.09, 0.6], ['highpass', 5200, 0.7, 0.006, 0.13, 0.9]] },        // forest: foliage and insects (chapada pattern)
  { de: 0.43, a: 0.54, c: [['bandpass', 190, 8, 0.04, 0.07, 0.6], ['bandpass', 600, 1.2, 0.03, 0.1, 0.6]] },             // bridge: the cables sing, the wind pushes
  { de: 0.17, a: 0.23, c: [['bandpass', 260, 3, 0.03, 0.06, 0.8]] },                                                      // corniche edge: wind in the void
  { de: 0.70, a: 0.90, c: [['bandpass', 260, 3, 0.035, 0.06, 0.8]] },                                                     // descent, open side: wind in the void
  { de: 0.92, a: 0.99, c: [['bandpass', 800, 0.5, 0.03, 0.09, 0.6], ['highpass', 5200, 0.7, 0.006, 0.13, 0.9]] },        // woods before the line
  { de: 0.975, a: 1.0, c: [['bandpass', 500, 0.8, 0.045, 0.13, 0.4], ['bandpass', 1100, 1, 0.02, 0.19, 0.5]] },           // coach park: crowd murmur (perse bazaar pattern); a second entry de 0 a 0.03 for the other side of the line
  { tun: 1, c: [['lowpass', 160, 0.7, 0.06], ['bandpass', 700, 0.9, 0.02, 0.2, 0.4]] }];                                 // tunnel: low drone
ACOUSTICS.piliers = { slap: 0.30, sl: 0.1, intoWall: 0.5, rv: 0.05, dur: 2.6, lp: 3000 };   // a long late echo: the pillars answer from far (touge pattern, longer delay)
```

Fractions are of the lap (sample / 2023); check them against the sample ranges in each zone table. Zones may not straddle the start line, hence the two entries for the coach park.

## Shared systems (built once, referenced by the zone tables)

| ID | System | What it is | Build |
|---|---|---|---|
| SYS-TICK | Scenery tick | `piliers` returns no tick today. Add the chapada pattern: `LIFE = []` of `(dt, car, t)` functions, `tick = (dt, now, car) => { tv += dt; for (const f of LIFE) f(dt, car, tv); for (const [t, u, v] of FLOWS) {...offset} }` (`scenery-chapada.js`, the `LIFE`, `FLOWS`, `flows` definitions and the last line of the function). Zone files receive it through the argument object that `scenery-piliers.js` passes to `PILIERS[z](...)`. Everything that moves carries `userData.dyn = 1`. | reuse |
| SYS-FLOW | Sliding textures | `flows(mat, u, v)` from chapada (copy; LIFE.md asks to move it into `src/render/scenery.js`). | reuse |
| SYS-SPOT | Placed sounds | `SOUND.spots('piliers', [{ p: {x,y,z}, sound, r, vol, int, occ }])` as at the end of `scenery-barrage.js`. Existing sounds: `waterfall`, `turbine`. New sounds to synthesise: `bell`, `chime`. | reuse |
| SYS-CLOUD | Cloud layers | See G-CLOUD below. | new |

## Global elements

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| G-CLOUD | Sea of clouds, two drifting layers + shadows | The existing plane (`scenery-piliers.js`, `clouds`, y 80). Seen: left side of the descent 1413-1830 (about 6 s in all), both sides of the bridge 907-1031 (3.5 s), the edge stretches 320-450 and 1280-1413. Never seen ahead | W | A white floor under you that slides slowly, with darker patches crossing it, and a second thinner layer 8 m above sliding at another speed: parallax when the car moves | NEW: keep `clouds` at y 80, drift via `flows` (0.003 repeats/s toward -x; the tile is 256 m so about 0.8 m/s). Add `clouds2` at y 88, `transparent`, opacity 0.45, `depthWrite: false`, rep different, drift 0.005. Add `shade` plane at y 79.5: a dark-blue (`#8baab7`) low-opacity texture with a few blobs, drift -0.004, so cloud shadows cross the sea. All `fog: true`. | P0 | Shimmer on a large pixel texture at distance: keep drift under 1 m/s, enable `th.smooth` for the layer textures only; check with `--burst=6`. Sorting of the two transparent planes against the fall sheets: fixed order by `renderOrder` |
| G-MIST | Mist sheets between the pillars | Three horizontal sheets at y 100, 120, 140, each about 900 x 900 m, centred on the ravine (650, -500); seen from the same places as G-CLOUD, plus the bridge | F | Pale bands that cross the pillar feet at different heights: the far pillars are cut into layers (what `ART-STYLE.md` calls a far view neither empty nor sharp). Never at road level | NEW: alpha planes with the `haze` texture (`h.mat('haze', { emis: 1 })` as chapada's `HAZE`), opacity 0.25 / 0.2 / 0.15, `depthWrite: false`, `flows` drift toward -x, a hole cut where the road is within 40 m of the sheet (never covers a bend). Fade out by distance to the car, not a switch | P0 | Hides a bend if mis-placed: all sheets stay 10 m or more below the lowest road (150) and are masked above 130 m on the descent. Overdraw: three full planes, one pass each |
| G-FOGTUNE | Fog retune | Whole map | F | Far pillars become pale ranks, not sharp silhouettes | `th.fogD [420, 3000]`, `haze` entries above | P0 | Fog on `far0..far2` materials already tints; verify with plan `--before` that HERO (2 km) stays readable |
| G-FLAG | Prayer flags in the wind | All `flags()` strings of `scenery-piliers-tourisme.js`: paifang poles (PK 3940-120), village strings 352/414/476, shrine poles 470, platform shelters, islet bridges, tea houses 1335/3692, glass-lift pavilion 1570, cable-car station 2150, summit temple, ledge temple 2580-2720 | O | Five-colour flags that ripple toward -x, 0.5 to 0.8 Hz, a travelling wave along each string | NEW but modelled on barrage `MOB` flags (`scenery-barrage.js` line ~19, moving batch with `o.dirty`): change `flags()` to push each flag as an instance of one quad (0.9 x 0.55 m, `fanionPiliers`, `alphaTest`, `userData.dyn = 1`), keep the string line static. Tick: update only strings within 220 m of the car; rotation about the string axis `0.35 sin(2π(0.65 t) - 0.9 k)`, a small vertical offset. 28 strings x 8 flags = 224 instances | P0 | Flicker on thin alpha edges at distance: flags are 0.9 m, fine up to 150 m; fade scale to 0 beyond 220 m rather than popping |
| G-BELL | Temple bells and chimes | Forest shrine 470 (sample 235), ledge temple (1290-1360), summit temple (straight ahead from 1240), glass-lift pavilion | S | A bell struck every 14 to 22 s, heard from 250 m, low and soft; wind chimes under the eaves at the ledge temple | NEW sound `bell` (FM sine 520 Hz plus inharmonic partials, 4 s decay) and `chime` (cluster of 4 high sines, random) in `HITS`; place with `SOUND.spots`, event timer in the tick (`SOUND.brief` as in barrage). Quiet: vol 0.12 | P1 | None; keep the level under the engine |
| G-BIRDCALL | Bird and distant-animal calls | Whole map, random, by zone (forest: songbirds; void: a distant raptor cry) | S | A short call every 8 to 15 s; reads as altitude | NEW: add `piliers` to `ambEvent` in `audio.js` (pattern of the chapada beasts, `evChapada`) | P1 | Repetition: three calls, random choice |
| G-SMOKE | Smoke and incense | Village chimneys 4 houses (PK 306-430); tea houses at 1335, 3692 and the one at 548; incense burner of the ledge temple (court at about sample 1305); shrines 470, 1075, 2700 (thin) | P | Thin grey columns leaning west, 2 to 4 s of view | REUSE: `h.steam(x, y, z)` (permanent plume, `game.js` STMS) | P1 | Colour: it is a white plume; fine against dark forest, weak against sky. Keep 8 sources total |
| G-SHAFT | Light shafts through the trees | Forest 90-300 and woods 1860-1990 | L | 3 to 5 pale columns slanting from upper left (sun is at -x, +z, 37 deg up), each 3 to 8 s apart | NEW but small: `h.beams`-style additive quads (`game.js` line ~2068 turns them toward the camera; `ville` uses it), 4 m x 30 m, opacity 0.12, slant along the sun vector, slow breathing 0.05 to 0.15 over 8 s. Fade with distance | P1 | Shimmer if the breathing is fast: keep 8 s. Must never cross the road line at the vanishing point: place 10 to 25 m beside the road |
| G-GLINT | Glass glints | Glass walkway on P2 (check with `plan.js`, about samples 540-600 above the road), glass lift 780-800, cabin windows | L | A four-point star on the glass every 3 to 5 s | NEW tiny: additive sprite, scale `sin(t)^8`, not on/off (givre/touge blink pattern, smoothed) | P2 | Flicker: use smooth scale |

## Zone 0: park gate and coach park (samples 1980-2023 and 0-60, PK 3940-120)

What the player sees: the start straight, the paifang over the road at sample 48, coaches parked right, flags on two poles, lions at the gate. About 3 s each way. Today it is a clean, quiet stage set.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z0-CROWD | Tourists waving at the line | Both sides of the line, 8 to 14 m out, samples 2000-2023 and 0-30 | O | 20 to 30 small figures with arms up and down in two poses, 2 Hz | REUSE: `PLACERS.crowd(h, ...)` in `src/render/crowd.js` (stade, canal); tourists tinted from `touristePiliers` colours | P1 | Scale and a crowd on a dirt-free road edge: keep behind the parapet |
| Z0-MURMUR | Coach park murmur + idle engines | Samples 1990-2023 right, and 0-15 | S | Low crowd murmur and a deep idle, 2 s | REUSE: `AMBZ.piliers` entry de 0.975 (above); a placed `turbine` spot at the coaches (r 60, vol 0.06) | P1 | None |
| Z0-EXHAUST | Coach exhaust | Two coaches at the head of the park | P | A thin grey puff | REUSE: `h.steam` | P2 | Reads as smoke from a chimney: skip if it does |
| Z0-COACH | A coach pulling out slowly | Along the park path, loops every 60 s | O | One coach moving at 2 m/s inside the park | NEW small: one group on a line, tick | P2 | Must stay inside the park, beyond the parapet: no ghost on the road |
| Z0-FLAGS | Flags on the paifang poles | Poles PK 70 and the gate | O | Flutter | G-FLAG | P0 | See G-FLAG |

## Zone 1: forest and village (samples 60-367, PK 120-735; packed earth 76-348)

The player sees dark green trunks, the village at 150-260 left, the lookout tower at 352, the first open view at the end. Dirt between 76 and 348: the visual centre of the zone. About 4.5 s of village.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z1-DUST | Dust trail and leaves on the dirt | 76-348 | P | A clay plume behind the car, leaves lifted in gold and green | REUSE: `th.dust`, `th.leaves` (engine option, `game.js` line 828) | P0 | Dust colour must not read as fog: pale clay |
| Z1-BED | Forest bed: foliage, insects | 0-367 | S | Continuous rustle with a high chopped insect layer | REUSE: `AMBZ.piliers[0]`, chapada layers | P0 | None |
| Z1-BIRDS | Egrets rising ahead | Left verge at 120, 200, 300, 110 m ahead of the car | O | A flock of 4 white birds takes off when the car nears, 2 s | REUSE: `takeoff()` and the `pigeon` shape in `scenery-barrage.js` (lines ~619-629); tint `0xf0f0e8`, flight toward -x | P1 | Nothing may move at a braking point: none of these is at a corner entry. Keep 110 m ahead |
| Z1-MIST | Ground mist between the trunks | Left of the road at 150-330, 8 to 40 m out, y 0.5 to 2.5 m above the ground | F | Pale mist hugging the verge, drifting slowly west | NEW: alpha strips with the `haze` texture and `flows`, outside the parapets only | P1 | Hides the apex if placed on the road side: strictly beyond 8 m |
| Z1-HAZE | Forest humidity | Pts 2-17 | F | Slightly closer trees | `th.haze` `[2, 17, 0.78]` | P1 | k below 0.7 would hide the next bend |
| Z1-SHAFT | Light columns | 90-300, left | L | Pale slanting columns, 3 to 5 | G-SHAFT | P1 | See G-SHAFT |
| Z1-SMOKE | Chimney smoke in the village | Houses at PK 306-430 (samples 153-215), left | P | Five thin columns toward -x | G-SMOKE | P1 | See G-SMOKE |
| Z1-FLAGS | Flag strings over the road | 176, 207, 238 | O | Three strings crossing above the road, rippling | G-FLAG | P0 | None |
| Z1-BELL | Shrine bell | Forest shrine, sample 235, 250 m range | S | A bell that swells as you pass | G-BELL | P1 | None |
| Z1-WALKERS | Tourists strolling | Village footpath, samples 165-250, outside | O | Six figures moving at 1.2 m/s with a small bob | NEW small: dyn group, move along a line, `touristePiliers` | P2 | Must not cross the road line |
| Z1-FALLP1 | P1 fall seen at the zone end | Sample 400-450 | W | A white thin sheet on the cliff, centre-right | See Z2-FALLA | P1 | See below |

## Zone 2: the corniches (samples 367-855, PK 735-1710)

The player sees the cliff on the right, the void on the left: platform at 416 (PK 832), the cut face 480-595, the glass walkway overhead (about 540-600), rest pavilion 607, tea house 667, glass lift 780-800 (a huge glass panel, visible at sample 780 in the boards), lookout tower 820. Pillars everywhere ahead.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z2-FALLA | Fall A on P1: a 210 m sheet | Flank of P1, tower summit 310; at samples 400-450 (centre-right of the frame, 80 to 150 m off) | W | A white thin vertical band falling into the clouds, 2 to 3 s | NEW sheet (chapada `falls()`, `scenery-chapada.js`): replace the box `fall` of `scenery-piliers.js` for towers q = 0, 2, 5 by two slightly curved sheets. New texture `chutePiliers` in `textures-piliers.js`: vertical streaks, tileable, low contrast, 3 repeats across 5 m. `flows(mat, 0, -0.9)` at 24 m per repeat (about 22 m/s), second layer 0, -1.4. Extend the end to y 76 so it enters the cloud floor | P1 | Shimmer of sliding streaks: low contrast, no sparkle layer, `smooth` on this texture only |
| Z2-FALLFOOT | Mist boil where a fall enters the clouds | Foot of A, C (Z3), D' | P | A soft pale puff that grows and fades at the cloud top | NEW tiny: 2 alpha quads, scale 1 to 1.15 pulse, `flows` | P1 | Same plane as the cloud floor: use `polygonOffset` |
| Z2-FALLSND | Sound for falls A | Spot at the foot, r 250, vol 0.08 | S | Faint rush from the centre-right, 2 s | REUSE: `waterfall` through `SOUND.spots` | P2 | None |
| Z2-BIRDS | Raptors circling over the void | Over the ravine at 400, 560, 740, 20 m below the road, on the axis 110 m ahead (barrage rule) | O | A dark bird gliding in a lazy circle, 1.5 s | REUSE: `BIRDS` batch, `scenery-barrage.js` lines ~630-633 (cubes of the moving batch), radius 24, y = road - 20 | P1 | Nothing near chevrons; the bird is far below the line of sight |
| Z2-LIFT | Glass lift cabin moving | Shafts at PK 1570, samples 780-800, 4 to 8 m beyond the left parapet; travel about 177 m | O | A glass cabin slowly rising or descending in the shafts; it is the biggest moving object at 1.5 s | NEW small: one `box` (`ice` material) in a `dyn` group, position `y = foot + (travel * (0.5 + 0.5 sin(2π t / 90)))`, tick | P1 | The cabin passes through the shaft frame: keep it narrower than the shafts; also a second cabin in antiphase for a 'living' feel |
| Z2-LIFTSND | Lift hum | Spot at the foot, r 40, vol 0.05 | S | A hum that passes in 1 s | REUSE: `turbine` sound | P2 | None |
| Z2-CUTSEEP | Seepage down the cut face | Left cut, samples 480-595, 9.5 m off, 2 rivulets 10 m high | W | Two dark wet streaks with a thin sliding highlight | NEW: ribbon strips on the cut beds (`BANKS` lines in `scenery-piliers.js`), dark `rubble`-tinted static streak plus `flows` highlight | P2 | Fine moving patterns shimmer: keep it a 0.4 m strip, speed 0.5 m/s |
| Z2-STEAM | Tea house smoke | Tea house 667 | P | A column | G-SMOKE | P1 | See G-SMOKE |
| Z2-FLAGS | Flags on islet bridges, pavilions, lift end, tea house | 416, 537, 607, 667, 785 | O | Flutter | G-FLAG | P0 | None |
| Z2-GLINT | Glass glints | Glass walkway, lift | L | Stars on glass | G-GLINT | P2 | See G-GLINT |
| Z2-WIND | Wind in the void | Samples 320-450 left | S | A rising howl on the left | `AMBZ.piliers[2]` | P1 | Level: modest |
| Z2-CABLE | Cabins already visible far ahead | Right-above the frame from sample 780 | O | Red cabins crossing | See Z3-CABIN | P0 | See Z3 |
| Z2-PEOPLE | Tourists on walkways/platforms | 416, 540, 607, 667 | O | Static figures, already present | No change; not animated | - | none |

## Zone 3: the suspension bridge (samples 855-1090, deck 907-1031)

The player sees the anchor blocks, the twin towers (sample 960 board), the cables, the cabins crossing above, HERO's fall left of the deck, and pillars on both sides. A straight 250 m deck: 3.5 s, the longest uninterrupted view of the lap.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z3-CABIN | Cable car cabins on the ropes | Ropes from the plateau station (PK 2150, sample 1075, left 26 m out) to HERO (835, -622) over two pylons at t = 0.33 and 0.68; visible 840-1100 | O | Eight red cabins gliding up and down the two ropes; two cross above the bridge deck; 3 s of view | REUSE pattern: `placeCabo` / `overPath` in `scenery-wangan.js` (lines ~189-197) or the gondolas of the `barrage` moving batch. NEW placement: the cabins are `put(grp, 'cabineTelePiliers')` in `scenery-piliers-tourisme.js`; keep references in a `dyn` group, each cabin `t = (t0 + 0.011 * game_time) mod 1` along the `P(t)` rope line (the rope is a straight chord per span: use the pylon points), left rope up, right rope down. Pause freezes it (use `dt`). Top speed about 6 m/s (cabin 2.2x scaled, 100 s for the whole span) | P0 | Cabins swing: no, rigid. Passing a pylon: slide through, 1 s dwell is fine. Not a collision object |
| Z3-FALLC | HERO fall, 320 m | Flank of HERO (tower q = 5, summit 410, point P[3] = (870, 590)), left of the deck, 200 to 300 m off, samples 935-1000 | W | The map's signature waterfall: a curved white band 320 m high falling into the cloud sea, a mist trail leaning west at the foot, a rush of sound; 2 s | NEW (as Z2-FALLA) but three layers: wide soft sheet, narrow bright core, side ribbons; speed v -1.1 at 24 m per repeat; mist boil (Z2-FALLFOOT); spot sound `waterfall` r 500, vol 0.2 | P0 | The tall thin sheet is seen across a pillar-lit frame: keep it bright but low-contrast. Shimmer check mandatory |
| Z3-CABLEHUM | Singing cables and wind | Deck 907-1031 | S | A thin, wavering tone over the whole deck and a push of wind | `AMBZ.piliers[1]` (above) | P0 | Level: the engine must still dominate |
| Z3-DECK | Steel deck thrum | Deck | S | A hollow rumble from the tyres on the steel, 3.5 s | NEW: in `audio.js`, per-car lowpass noise tied to the car's sample within 907-1031 (no new surface type) | P2 | None |
| Z3-BIRDSBELOW | Egrets flying under the deck | Over the ravine, y 150 to 190, R 30, around 910-1030 | O | White birds circling below the road: the vertigo cue | REUSE: barrage `BIRDS` batch (as Z2-BIRDS), tint white | P1 | None |
| Z3-SEA | Sea of clouds under the bridge | 135 m below the deck | W | The floor slides slowly with shadows | G-CLOUD | P0 | See G-CLOUD |
| Z3-MIST | Mist ranks between the pillars | Needles under and around the bridge | F | Pale bands cutting the needles | G-MIST | P0 | See G-MIST |
| Z3-FLAGS | Flags on the anchor lanterns | Samples 886, 1049 | O | Flutter | G-FLAG | P1 | None |
| Z3-SHADOWS | Cloud shadows crossing the sea | See G-CLOUD | L | Patches of shade | G-CLOUD | P1 | None |

## Zone 4: the plateau and tunnel (samples 1090-1413, tunnel 1200-1240, dirt 1268-1420)

The player sees the belvedere (1125), the basin (right, at sample 1140 a turquoise patch), the plateau fall, the tunnel, then the summit temple straight ahead, then the ledge temple on the right at 1290-1360 (stairs, red wall).

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z4-FALL | Plateau fall and pool | Basin `bassinPiliers` at PK 2290 (sample 1145), stream 20 to 90 m on the right, edge fall at PK 2330 (sample 1165), 150 m, 5 m wide | W | A bright pool that glitters softly, a stream that runs to the edge, the fall that drops out of sight; near and loud: 2 s | NEW: replace the `water`/`fall` boxes in `scenery-piliers-plateaux.js` by: pool and stream with `flows` (0.12 along the stream, gloss 0.5 as `waterJade` on chapada), lip with white foam strip, fall as Z2-FALLA, spray puffs at the lip toward -x (`h.steam` x 3) | P0 | Stream pattern shimmer: speed 0.1, `smooth` on `eauPiliers` (already) |
| Z4-FALLSND | Fall sound | Spot at the lip, r 140, vol 0.18 | S | Strong rush from the right | REUSE: `waterfall` through `SOUND.spots` | P0 | None |
| Z4-BELV | Belvedere flags and tourists | PK 2250 | O | Flutter | G-FLAG | P1 | None |
| Z4-STATION | Station bullwheel and hum | Station at sample 1075 (left, 26 m out), 4 m wheel on the roof | O | A wheel with 4 spokes turning at 0.4 rev/s, plus a mechanical hum | NEW small: a cylinder with 4 box spokes rotating in the tick; `turbine` spot r 60, vol 0.08 | P1 | Spoke aliasing at 30 fps: stay at 0.4 rev/s |
| Z4-TUNNELBED | Tunnel drone and drips | 1200-1240 | S | Low drone, 2.5 s | `AMBZ.piliers` entry `tun: 1` | P2 | None |
| Z4-EXITMIST | Mist at the tunnel exit | Pts 62-66 | F | You leave the dark into a pale mist; the temple appears through it | `th.haze [62, 66, 150, 900]` and `th.eye` | P1 | If too dense the temple is lost: end 900 m |
| Z4-TEMPLE | Ledge temple: incense, bell, chimes | Court at about 1305; the stairs right 1290-1360 | P/S | A grey thread of incense, a bell, chimes; 2 s | G-SMOKE, G-BELL | P1 | See above |
| Z4-FLAGS | Flags: ledge temple (4 strings to the corners), summit temple (4 masts) | 1300-1340, ahead from 1240 | O | The red court framed by flags; far flags flutter | G-FLAG | P0 | None |
| Z4-DUST | Dust on the old service road | 1268-1413 | P | Clay plume | Z1-DUST | P0 | None |
| Z4-STALLS | Stall awnings flutter | Samples 1295-1310 | O | Small cloth moves | Not proposed: too small for 1 s | - | - |

## Zone 5: descent along the buttress (samples 1413-2023, PK 2826-4042)

The player sees the 26 m bedded buttress on the right with its plank walkway, the promenade and platforms on the left cliff edge (1351, 1542, 1600, 1712), the sea of clouds below the left parapet, the tea house (1846), the woods, then the gate again.

| ID | Element | Where | Cat | Player sees or hears | Build | Pri | Risk |
|---|---|---|---|---|---|---|---|
| Z5-CASCADE | Buttress cascade D, 8 m from the wall | Right bank at sample 1645 (PK 3290), culvert headwall `busePiliers`, 26 m bank in five 5 m beds; 130 m of road view | W | A stepped cascade that falls over five beds into the culvert; the loudest, nearest water of the lap; drops on the lens; 2 s | NEW: ribbons following the bed lines of `BANKS` (`scenery-piliers.js`): five sheets, each leaving a bed lip and landing on the next, `flows` v -0.9, foam strip at each step; it crosses under the plank walkway (the walkway deck is at +13.2 m: add a short stone culvert). `th.seaSpray [[81, 83.5, 0.4]]` | P0 | Close and fast: low-contrast streaks, no glitter; spray drops on the lens are light (0.4) |
| Z5-CASCADESND | Cascade sound | Spot at the culvert, r 90, vol 0.25 | S | A hard water rush that sweeps from front to side | REUSE: `waterfall` through `SOUND.spots` | P0 | Level against the engine |
| Z5-SEA | The sea of clouds on the left | Samples 1413-1830 | W | The floor with two layers and shadows | G-CLOUD | P0 | See G-CLOUD |
| Z5-MISTBAND | Mist tongues on the open side | Left, 40 to 70 m below the road, 1413-1830 | F | Pale tongues licking up the pillar feet | G-MIST (heights 120, 140) | P0 | Not on the road line |
| Z5-WIND | Wind in the void | 1413-1830 left | S | A soft howl | `AMBZ.piliers[3]` | P1 | Level |
| Z5-PLATFORMS | Platform flags and islets | 1351, 1542, 1600, 1712 | O | Flutter | G-FLAG | P1 | None |
| Z5-BIRDS | Raptors above the buttress and egrets | 1500, 1560, 1700 | O | Birds circling | Z2-BIRDS | P2 | None |
| Z5-TEAHOUSE | Tea house smoke | Sample 1846 left | P | A column | G-SMOKE | P1 | See G-SMOKE |
| Z5-WOODS | Woods: bed, shafts, birds, takeoffs, leaves | 1860-2023 | S/L/O | The forest again before the line | `AMBZ.piliers[4]`, G-SHAFT, Z1-BIRDS (at 1900, 1950) | P1 | None |
| Z5-HAZE | Woods humidity | Pts 90-98 | F | The horizon closes before the line | `th.haze [90, 98, 0.72]` | P1 | k 0.72 is the floor |
| Z5-LANTERNS | Lanterns glow | Gate and village lanterns | D | Red lantern glows, 2 s | REUSE: `h.emis` (max 4 here), flicker `l.c` | P2 | Daylight: the glow is barely visible; skip unless the author wants a night variant |
| Z5-INCENSE | Shrine incense on the needle shrine | PK 2700 | P | Thin thread | G-SMOKE | P2 | Too far to read |

## What not to do on this map

- **No `damp` / wet road, no `th.wetVisible`.** `surf` damp zones change grip: what you see is what you drive. The mood sheet says the morning is dry and clear. A wet look would also cover the ribbons laid by the scenery (they do not read wetness).
- **No fog on the road.** The mood sheet is explicit: no fog that hides a bend, mist never on an apex or at the vanishing point. Every mist element sits beside or below the road. `haze` k stays 0.72 or more.
- **No sway on the thousands of trees.** There is no shader clock (LIFE.md, "To build" 2). Moving instanced trees with `setMatrixAt` costs a batch per shape. Wind is read in the flags, smoke and mist instead.
- **No ghost coaches or cars on the road.** A moving vehicle on the lane would be driven through. Moving vehicles stay inside the coach park, beyond the parapet.
- **No night or evening light.** The map is at 06:35; lantern lights stay at most four and optional.
- **No moving patterns with fine detail** (water glitter layer like chapada's `sparkles`): the streaks of the falls are low contrast.
- **No rainbow, no god-ray bloom, no soft haze.** `ART-STYLE.md` forbids soft modern effects.
- **No animation on the footbridges or the glass lifts' frames**: too small for the 1 s read.
- **Nothing that moves at a chevron or braking point.** Birds and flights are 110 m ahead on the axis or far below.
- **No HERO summit detail.** It is never in the racing camera.

## Open questions for the author

1. **Sound scale.** Should the wind bed and the singing bridge cables be clearly audible over the engine (identity) or only under it?
2. **Cable car.** Ropes up on the left and down on the right, constant speed, no stops at the stations: is that right, or should the cabins pause at the stations?
3. **Birds.** White egrets are an addition (the mood sheet names none). Keep them, or only dark raptors?
4. **Wind direction.** Chapada's (toward -x) is assumed for all flags, smoke and mist. Any preference?
5. **Dry or damp.** The map stays dry. Does the author want a damp forest stretch (`surf` damp, changes grip) as an exception?

## Verification status

Not verified: nothing was run in the game apart from the three capture boards. Sample positions for the glass walkway, the exact sample of each fall (P1, HERO) and the plateau basin are derived from the code and boards; confirm each with `node tools/plan.js piliers @<sample> --view=...` before building. No performance was measured. Sounds and the proposed `AMBZ` fractions were not heard. The `th.haze` and `th.seaSpray` values are untested; try with `?opt=` first.
