# Proposal: cars, roads and tunnels for the six new maps

Status: **to validate by the author. Nothing is built.** Written against `main` at `079caaa` and the six blockout branches (`claude/blockout-{egee,area51,piliers,volcan,lune,autoroute}-*`). Car names are invented, specs are inspired by real cars (from memory, not checked against spec sheets). Figures marked "rpm.js" come from `tools/rpm.js` (autopilot lap, no browser), see "How the figures were made" at the end.

## Summary

| Map (id) | Car | Inspiration | Body (`MODELS`) | Road in one phrase | Tunnel in one phrase |
|---|---|---|---|---|---|
| Aegean Cliffs (`egee`) | MELTEMI GTA-SA | Alfa Romeo Giulia Sprint GTA-SA (1967) | `gtr`, scaled down (acceptable) | sun-bleached island tarmac, fine grain, lime paint, no kerb stripes | none |
| Area 51 / Signal Unknown (`area51`) | DELOREAN-style DMC-12: **KELVIN DM-12** | DeLorean DMC-12 (1981) | **new body needed** (gullwing wedge, stainless) | dark segmented tarmac on base roads; pale runway tarmac with white marks (scenery ribbon) | B1 reactor complex (850 m) = engine `tun`, scenery makes the shell; hangar H1 is scenery only |
| Sky Pillars (`piliers`) | TIANMEN SW-22 | Subaru Impreza 22B STi (1998) | `groupeb` (acceptable) | cool blue-grey mountain asphalt, cream paint, stone parapets by the scenery | 80 m rock tunnel, bare sandstone lining, warm sodium lamps, exit seen as a bright dot |
| Volcanic Island (`volcan`) | LEVADA HF EVO | Lancia Delta HF Integrale Evoluzione (1993) | `r5` (acceptable) | lighter basalt-grey asphalt (it must leave the black rock), stone-yellow paint | north gallery (200 m, engine); south gallery is scenery; dark basalt, sparse warm lamps |
| Lunar Outpost (`lune`) | SELENE MOLAB-1 | GM MOLAB (1964) / Apollo Lunar Roving Vehicle, closed cabin | **new body needed** (closed rover) | matt dark graded regolith, loose regolith in the arena (scenery + `terre`), ivory pad in the base | 320 m pressurised ivory tube, cold instrument-blue lamps, black outside |
| Sunken Highway (`autoroute`) | HERON 240 TURBO | Volvo 240 Turbo, touring-car tune (1985) | `peykan` (acceptable) | the city's own patched street asphalt (scenery material), no paint, no kerb stripes | metro tunnel (PK 1877 to 2553): engine lays floor and lights only, scenery builds everything else |

### What is shared

- **Several road types per map are possible, see the new section "Road sections" below.** The engine draws one road texture for the whole lap; extra types are scenery ribbons laid over it (as `autoroute` and `lune` already do), plus `surf` zones for grip.
- **One white-patch fix for every map that has a lit road** (diagnosis in each "Road style"): `th.roadTex: 'roadwayFine'` (no light patches or cracks), `th.gloss: 0.02` (0 on the moon), paint colours one notch below pure cream, and, if needed, hemisphere intensity 0.8 and sun 0.8 (the shipped midday map `plage` runs 0.6 / 0.72). This is one recipe, applied to egee, area51, piliers, volcan, lune. Autoroute uses its own scenery asphalt and only needs the gloss line.
- **Same road structure on the three "daylight mountain" maps** (egee, piliers, volcan): dark cool-grey tarmac, no kerb stripes (the scenery draws parapets or the engine draws `wallH` walls), paint one cream, `chevronGES` chevrons on egee and piliers.
- **Gearing rule found with `rpm.js` on all six layouts:** these layouts are wide and fast, so any car whose top speed is above about 200 km/h spends over 95 % of the lap in top gear whatever the ratios (the touge car does on every one of them). What a car changes here is the speed band and the number of brakings, and the lever is the car's own `grip` multiplier (0.85 to 1), not the gears. Only `autoroute` (slow street layout) really uses several gears. The map-level `grip` field has no effect on the simulation (`sim.js` reads only `car.grip`), so it is not changed here.
- **`kmh` rule used:** `kmh` = (top speed the real car would show) / (top speed `rpm.js` reaches), then lowered a little on very wide roads. Values below are taste values.
- **Engine vocabulary warning (blocks any tunnel work, not part of this proposal):** `docs/methods/MAP-ENGINE-OPTIONS.md` and `plage`/`chapada` in `src/data/maps.js` write `th.tun.without` as `'portals' | 'fixtures' | 'lightSet' | 'faces'`, but `src/engine/game.js` on `main` still tests `'gates' | 'lamps' | 'lights' | 'walls'` (lines 522, 523, 536 to 538, 552; checked with `git grep`). The branches use the code strings. Until one side is renamed, the English names do nothing, which also means `volcan`'s blockout `without: ['portals']` is currently ignored. This document writes the **code strings** and gives the doc name in brackets.
- The `surf` field names in the header of `src/data/maps.js` (`fond`, `large`) are also stale: the code reads `backdrop`, `zones`, `wide`.

### How `th.road` is read (`roadway` / `roadwayFine`, `src/render/textures.js`)

The seven values are `[asph, spk, edge, dash, k1, k2, wet]`:

| # | Name | Colours |
|---|---|---|
| 1 | `asph` | base colour of the whole slab |
| 2 | `spk` | colour of the grain (speckle) laid over it |
| 3 | `edge` | the two solid lines near the road edges |
| 4 | `dash` | the centre dashes |
| 5 | `k1` | outer edge blocks, first half of each 32 m |
| 6 | `k2` | outer edge blocks, second half (k1 / k2 alternate = painted kerb; both = `asph` means no kerb) |
| 7 | `wet` | `false` dry; `true` more puddles and gloss 0.2; `2` central gutter (canal) |

`roadway` also lays white (`#fff`) patches and speckle at low opacity, plus dark cracks; `roadwayFine` only darkens (patches "a little darker, never lighter"). Gloss defaults to 0.08 (0.2 wet) and is the sun/lamp reflection.

## Road sections: do the textures we have suffice?

**How a map gets several road types.** The engine draws one road ribbon for the whole lap with one texture (`th.roadTex`) and one set of seven colours (`th.road`). A section with another surface is obtained in three ways, which combine:

1. **A scenery ribbon laid over the road** for that stretch (what `autoroute` does with `asphalteAutoroute` and `lune` does with its relaid road): `h.ribbon(t0, n, -w, 0, w, 0, h.mat(<texture>, opts, …args), 4)`. It is static scenery, merged with the rest, so it is cheap.
2. **The same procedural road with other colours.** `roadway` and `roadwayFine` take the seven colour arguments, so a ribbon can reuse them with a pale concrete or a faded-paint variant without any new texture.
3. **`surf` zones** (`sec`, `damp`, `cobbles`, `terre`, `iceSurf`, `snowSurf`) change grip, braking and roll for the stretch; the look still comes from 1 or 2 (`wetVisible` only darkens `damp`). Use them only where the surface should also drive differently.

`th.road` should always match the **dominant** surface, because the engine road is what shows wherever no ribbon covers it.

**What exists.** Catalogue (all texture files are loaded by `index.html`, so another map's texture can be reused; reuse across maps not tried here): `roadway`, `roadwayFine` (any asphalt or concrete tone), `roadwayTerre` (packed earth), `roadwayGES`, `slabsJungle`, `slabsQuay` (quay slabs), `slabsStreet`, `slabsPerse`, `slabsEdge`, `groundHangar` (grey 8 m tile floor), `groundPort` (yard), `concreteGES`, `cobbles`, `sandHard`, `sandDry`, `sandDamp`, `sandTraces`. On the six branches, per map: egee `pavageEgee`, `solEgee`, `terreEgee`; area51 `tarmacArea51`, `solArea51`, `playaArea51`, `jauneArea51`, `blancArea51`, `dangerArea51`; piliers `pierrePiliers`, `acierPiliers`, `solPiliers`; volcan `betonVolcan`, `solVolcan`, `basalteVolcan`; lune `terreLune`, `regolitheLune`, `coqueLune`; autoroute `asphalteAutoroute`, `trottoirAutoroute`, `carrelageAutoroute`. **Judged from names and signatures, not from renders**: whether each reads well at 270 lines is a `plan.js` question.

**Verdict.** The textures we have should be enough for every section of the six maps; no new road texture is required. Two small additions are optional (area51 tow line and hall-floor marking, lune deck plate for the garage floor). The tables below are what each section should be.

### Aegean Cliffs

| Section (zone) | Points | Surface | How | Enough? |
|---|---|---|---|---|
| Port, the quay | 0 to 16 | asphalt on the quay road, stone slabs at the edges | engine road (`roadwayFine`) | yes |
| Quarry road | 16 to 50 | old dry asphalt, pale dust at the edges | engine road | yes |
| Village | 50 to 70 | whitewashed stone paving (kalderimi) between the houses | ribbon `pavageEgee`, optional `surf` `cobbles` 0.4 for slightly slippery marble | yes, `pavageEgee` exists |
| Balcony | 70 to 88 | asphalt | engine road | yes |
| Terraces descent | 88 to 0 | patched asphalt | engine road | yes |

Two road types. The village paving is the signature change of surface and a good place for the `cobbles` zone (a small fishtail in the one narrow passage).

### Area 51

| Section | Points | Surface | How | Enough? |
|---|---|---|---|---|
| Apron and fire alley | 0 to about 8 | pale concrete apron | ribbon `solArea51` or `groundHangar` | yes |
| Hall H1 | start line, 300 m | dark polished concrete floor with a yellow tow line | scenery floor; `jauneArea51` for the line | needs a small tow-line marking (already a "CREATE" in the area51 inventory) |
| Base roads, B1 ramp and complex | 8 to 60 | dark tarmac; B1 floor concrete | engine road; B1 via `th.tun.ground` | yes |
| Antenna field, ridge | 60 to about 185 | service tarmac, dusty at the edges | engine road | yes |
| Runway A and taxiways | about 185 to 201, plus the crossing and connector | pale grey runway tarmac with white edge, centre and threshold marks; yellow taxiway centre line | ribbon `tarmacArea51` + `blancArea51` / `jauneArea51` markings | yes, they exist on the branch |

Three road types (service tarmac, concrete apron and hall, runway). The runway must be paler and greyer than the base road: it is the one section where the road changes tone, which also helps the 30 m half-width read as "runway". `th.road` stays the dark service tarmac.

### Sky Pillars

| Section (zone) | PK | Surface | How | Enough? |
|---|---|---|---|---|
| Forest | 0 to 735 and 3700 to the line | asphalt | engine road | yes |
| Corniches | 735 to 1710 | asphalt, 16 m | engine road | yes |
| Suspension bridge | 1710 to 2181 | asphalt on a steel deck (deck structure is scenery) | engine road; steel expansion joints as scenery strips with `acierPiliers` if wanted | yes |
| Plateau and tunnel | 2181 to 2826 | asphalt; tunnel floor via `th.tun.ground` | engine road | yes |
| Descent | 2826 to 3700 | asphalt | engine road | yes |

One road type. The sheet gives no change of surface; the variety is in the parapets, the rock and the bridge. A timber deck would contradict the "16 m of asphalt" and the road-bridge brief.

### Volcanic Island

| Section (zone) | PK | Surface | How | Enough? |
|---|---|---|---|---|
| Le Phare, the harbour | 0 to 690 | concrete quay road | ribbon `betonVolcan` (or `slabsQuay`) | yes |
| Les Cendres, ash slope | 690 to 2210 | asphalt, ash drifted at the edges | engine road | yes |
| La Couronne, the pass | 2210 to 3780 | asphalt; concrete belvedere deck is scenery | engine road | yes |
| Le Cratère | 3780 to 4890 | north gallery floor (`th.tun.ground`), asphalt dusted black on the crater floor, south gallery floor by the scenery | engine road, tunnel floor | yes |
| Les Lacets | 4890 to 6100 | asphalt | engine road | yes |
| Les Quais, home straight | 6100 to the line | concrete quay road again | ribbon `betonVolcan` | yes |

Two road types, bookending the lap: concrete quay at both ends, asphalt between. Start and finish read as the same harbour. A `damp` zone is not proposed.

### Lunar Outpost

| Section (zone) | PK | Surface | How | Enough? |
|---|---|---|---|---|
| Base and start airlock | 5080 to 500 | garage and hall floor (ivory deck or dark floor under a 160 m hall), concrete pad outside | scenery floor with `coqueLune` or `groundHangar`; a deck-plate texture would be nicer | yes (deck plate optional) |
| Western crater, ridge | 500 to 3000 | graded, sintered, dark regolith track | engine road (`roadwayFine`, gloss 0) | yes |
| Eastern crater, arena | 3000 to 3920 | bare loose regolith, no road, driven anywhere | scenery `terreLune` + `surf` `terre` 0.4 over points 78 to 90 | yes |
| Tunnel | points 91 to 99 | tube floor via `th.tun.ground` | engine tunnel | yes |
| South basin | 3920 to 5130 | graded track on the basin floor and the 8 % ramp, then the maintenance pad | engine road, pad ribbon `coqueLune` | yes |

Three surfaces, and the only map where a section changes the **driving** (loose regolith in the arena), which `surf` already supports. The sheet says the tunnel is 280 m; the blockout's `tun: [91, 99]` spans 320 m (PK 3620 to 3941): to reconcile.

### Sunken Highway

| Section (zone) | Surface | How | Enough? |
|---|---|---|---|
| Boulevard (26 m, kerb to kerb) | patched asphalt, a few surviving lane marks | scenery ribbon `asphalteAutoroute` over the engine road (already there) | yes |
| Warehouse district (16 m streets) | stained asphalt, dry road, water at the kerbs | same ribbon, other tint (the texture takes a colour) | yes |
| Motorway (two 14 m carriageways) | grey asphalt, faded white lane dashes, hard shoulder | `roadwayFine` ribbon with `dash` at a faded `#b8b4a0` and `edge` at `#a8a494` | yes, no new texture |
| Fallen street | asphalt between brick blocks | `asphalteAutoroute` | yes |
| Metro | track bed and platform tiles; the lane crosses between tracks | scenery (`carrelageAutoroute`, track bed); engine floor under it | yes |

Three looks from one texture family. The faded dashes are the one place paint survives; they come from the existing `roadwayFine` dash argument, not from a decal (the ART-STYLE rule against decals on the road still holds).

---

## 1. Aegean Cliffs (`egee`)

Greek island, early afternoon, hard white light. 4 698 m, harbour quay, quarry climb, village on a 12 m wide crest, cornice, descent.

### 1.1 Car: MELTEMI GTA-SA

**Why.** A Mediterranean coupe from the 1960s that raced on islands and mountain roads: Alfa Romeo Giulia Sprint GTA-SA (supercharged, about 220 hp, 760 kg). Light, short, loud, red on white lime walls. It fits a one-day race on a closed island road and, unlike the borrowed 280 hp rear-drive coupe, it tops out in the low 230s (sim) instead of 296, so the quay and descent are fast but not absurd. Supercharger whine uses the `turbo` flag.

**Body.** Existing `gtr` (two-door saloon, high tail) scaled down (`l 0.86`). It reads as a 1960s notchback coupe. A dedicated `giulia` body (round fastback roof) would be nicer but is optional.

```js
// Alfa Romeo Giulia Sprint GTA-SA (1967): 1.6 L twin-cam, supercharged, about 220 hp, 760 kg, 5-speed, rear-wheel drive (ratios approximate)
car: car({ label: 'MELTEMI GTA-SA', ratios: [3.3, 2.1, 1.5, 1.15, 0.92], final: 3.7, wheel: 0.28, mass: 800, idle: 1000, red: 7500, cd: 0.38, area: 1.7,
  tq: [0, 130, 170, 200, 220, 230, 235, 225, 190], trac: 10, rwd: 1, grip: 0.85, sound: 1.3, engine: 'l4', turbo: 1,
  look: { type: 'gtr', col: 0xc4302b, stripes: 0xf7efe0, l: 0.86, w: 0.94, h: 0.94, nose: 0.6, cab: [-0.4, 2.0, 0.52], tailFin: 0 } }),
```

**On this layout (rpm.js, with the map entry of the blockout).** 233 km/h at the limiter, 184 to 233 km/h, average 220, about 13 brakings, over 95 % of the lap in 5th. Without `grip: 0.85` (grip 1): 9 brakings, 191 to 233. The first gear is used only at the start. Braking happens at the village and the tight climb bends. Gearing is **backed by figures** (this is what `rpm.js` reports) but it cannot create gear changes on this layout.

**Map-level settings.** `kmh: 0.85` (shows 198 km/h at 233 true, about the real car's top), `spd: [180, 230]`, keep the map's `grip: 21` field untouched (unused by the sim), `med` default (recalibrate with the gold lap after the car lands).

### 1.2 Road style

**What it is.** A working harbour quay and an old quarry road: dark tarmac baked white by the sun, lime road paint, stone and lime parapets. The brief's three values are dark asphalt, warm stone, white lime.

```js
roadTex: 'roadwayFine', gloss: 0.02,
road: ['#3a3d42', '#46494f', '#efe6d2', '#efe6d2', '#3a3d42', '#3a3d42', false],
//      asph       grain      edge lines  dashes     k1 = asph   k2 = asph   dry   (no kerb stripes)
intoWall: ['#f7efe0', '#d7ac74', '#b96e4b', '#8a7a68'],   // unchanged: lime face, stone coping, rust groove, shadow base
wallH: 1.1,                                               // unchanged
startLine: [0xd74e92, 0xf7efe0, '#f7efe0'],               // unchanged: flower pink gantry, lime frame and checker
chev: 1, chevTex: 'chevronGES', chevExcept: [[52, 69]],   // red/white chevrons; none through the village (to confirm on a plan.js shot)
```

No `surf` zone and no wet option: the road is dry all lap.

**Readability check (`docs/ART-STYLE.md`).** Road `#3a3d42` against lime walls `#f7efe0`, stone verge `#d7ac74` and rock `#b96e4b`: strong tone separation (dark road, light surroundings). Paint is `#efe6d2` (was `#f7efe0`), five per cent under the lime so it stays below the bloom at midday. Nothing is drawn on the asphalt.

**Do the current blockout values explain the white patches?** Yes, probably, by four stacked causes (reasoning from values; not confirmed by a render): (1) `th.gloss` unset, so 0.08 with the sun at 0.9 over a 1.0 hemisphere; (2) the classic `roadway` texture, which paints white patches and white speckle (`veil 0.2 #fff`); (3) light levels above the shipped midday map (`plage`: hemi 0.6, sun 0.72; here 1.0 and 0.9); (4) near-white paint. The roadTex and gloss lines fix (1) and (2) without changing the mood. If a hot sheen remains, trim `hemi` to `[0xd8e8ff, 0xd7ac74, 0.8]` and `sun` to `[0xfff4dc, 0.8]`.

### 1.3 Tunnel style

**None.** The map has `tun: null` and the sheet has no covered section (the village is open streets). Keep `tun: null` and no `th.tun`.

### 1.4 Open choices

1. **Flat out or braking?** With the GTA at grip 0.85 the lap is flat out except about 13 spots. Lower `grip` to 0.7 gives 38 brakings and a 159 to 233 km/h band (more driving, a slower car). Recommendation: **0.85**, then play it; the real fix for a flat layout is more bends, not a slower car.
2. **Painted kerbs?** Blue and white kerb blocks along the quay would help read the edge but are one step towards the Santorini postcard the sheet rejects. Recommendation: **no kerb stripes**.
3. **Car colour.** Red (`0xc4302b`) pops against lime and sea; the alternative is a cream car with a pink stripe. Recommendation: **red with lime stripe**.

---

## 2. Area 51 / Signal Unknown (`area51`)

Nevada flight-test base at blue hour. 6 778 m, W 10 (runway half-width 30 at points 185 to 201): hangar line with hall H1 at the start, reactor complex B1 under the mesa (points 33 to 60), listening dish, security ridge, runways. 1960s to 1980s concrete and steel, in use and worn.

### 2.1 Car: KELVIN DM-12 (a DeLorean)

**Why.** The author's choice, and it fits: a stainless-steel, gullwing, rear-engined 1981 wedge in a 1960s-to-1980s secret base at blue hour. Real car: DeLorean DMC-12 (PRV 2.85 L V6, 130 hp, 1 230 kg, five-speed, rear engine and rear drive; famously slow, about 175 km/h). Unpainted brushed steel reads silver against the dark `#313a46` tarmac and the violet sky, and the car becomes the map's joke: the slowest car of the six, on the fastest, flattest runway. Name: kelvin (colour temperature of the base lights); change freely, "DeLorean" itself should not be used in-game.

**Body: new body needed, no existing one fits.** `berlinette` is a wedge but a rally coupe with louvres and long-range lights. Silhouette needed (later): a low, flat, slab-sided wedge about 4.2 m long and 1.85 m wide; flat horizontal bonnet and tail; a steep windscreen and a near-horizontal roof; **gullwing doors** (raised, or a door line drawn high on the roof); a black louvred panel over the rear window and engine cover; large round wheels with the rear wider; small rectangular headlights flush in a black nose panel; unpainted brushed-steel body with a black lower sill. Livery: flat brushed-grey `col`, black `stripes`; there is no paint to take.

```js
// DeLorean DMC-12 (1981): PRV 2.85 L V6, 130 hp, 1 230 kg, 5-speed, rear engine, rear-wheel drive (ratios approximate)
car: car({ label: 'KELVIN DM-12', ratios: [3.17, 1.88, 1.30, 0.97, 0.76], final: 3.7, wheel: 0.31, mass: 1230, idle: 900, red: 6000, cd: 0.35, area: 1.9,
  tq: [0, 150, 200, 215, 220, 215, 200, 170, 0], trac: 9, rwd: 1, sound: 0.9, engine: 'v8',
  look: { type: 'delorean', col: 0xb9bec4, stripes: 0x16161c, l: 1.0, w: 1.0, h: 0.86, nose: 0.62, cab: [-0.2, 1.9, 0.5], tailFin: 0 } }),  // 'delorean' = the new MODELS body; use 'berlinette' as a stopgap
```

`engine: 'v8'` is the closest timbre to a V6 with a low burble (`l6` is the alternative, brighter).

**On this layout (rpm.js).** Top 206 km/h, 142 to 206, average 185, about 50 brakings, 4th 26 %, 5th 74 %. Simulated lap 130 s (the borrowed car: 112 s). It is flat out on the runways and braking at the hangar chicane, serpentine, ramp and dish loop. Optional "turbo conversion" variant if the author wants more punch: peak torque 340 N·m, `red: 6500`, `tq: [0, 170, 260, 320, 340, 340, 320, 290, 0]` gives 212 average, 142 to 254. Gearing is backed by figures; the ratio table is approximate.

**Map-level settings.** `kmh: 0.85` (shows 175 at 206, the real car's top), `spd: [140, 205]`, car `grip` default, `med` default.


### 2.2 Road style

**What it is.** The base's own service roads: dark segmented tarmac, a yellow taxiway-style centre line, concrete barriers (no barrier on the runway), and for the long straights real runway markings made by the scenery.

```js
roadTex: 'roadwayFine', gloss: 0.02,
road: ['#313a46', '#3d4650', '#e8e2d7', '#f2c37b', '#313a46', '#313a46', false],
//      tarmac    grain      edge: pale  dash: amber (taxiway)      no kerb stripes
intoWall: ['#e8e9df', '#d69a72', '#a97459', '#708071'],   // unchanged: light concrete barrier
wallH: 0,                                                 // unchanged: the scenery places the barriers, none on the runway
startLine: [0xf5aa75, 0xe8e9df, '#e8e9df'],               // unchanged
chev: 1, chevExcept: [[33, 60], [185, 201]],              // none in B1 (the scenery guides) and none on the runway
```

`roadwayFine` joints every 16 m give the "segmented asphalt" of the sheet. No `surf` zone.

The runway, apron and hall floor are other surfaces: see "Road sections" (area51).

**Readability.** Tarmac `#313a46` against sand verge `#D69A72` and light concrete `#E8E9DF`: good separation. Paint is pale, not white; the centre dash is amber, which also makes it different from the white runway markings. The tarmac is a cool dark blue-grey, close to the dark floor of the hall (scenery), but the hall is inside a shell, so no conflict.

**White patches?** Yes, likely. Same causes as egee, worse because the sun is low (`orb.dir` y 0.35) so the 0.08 gloss gives long glancing reflections, with hemi 1.0 and sun 0.8. Fix: the two lines above, then hemi 0.8 if needed (blue hour wants a dimmer base anyway).

### 2.3 Tunnel style

**What it is.** Two covered sections, both **built by the scenery**: hall H1 at the start (300 m, trusses, strip lights, olive walls, polished floor) and the reactor complex B1 (points 33 to 60, PK 986 to 1791, a ramp that dives 18 m under the mesa, rooms 12 to 32 m high, the scenery makes shell, rock cap and portals). The engine allows **one** `tun` span per map, so the recommendation is: **engine `tun` over B1, bare; H1 stays scenery-only.**

```js
tun: [33, 60],
th: { tun: {
  without: ['faces', 'gates'],            // [faces, portals]: the scenery builds walls, vault, rock cap and portals; the engine keeps floor, lights, darkness, echo
  ground: ['#2a313a', '#353d47', '#9fd8e8', '#f2c37b', '#2a313a', '#2a313a'],   // dark concrete floor, cold edge line, amber dash
  neons: [0xbfe8f0, 0x7fd6dc],            // cold lamps inside (the sheet: warm outside, cold inside)
  wallMeshes: ['#bfe8f0', '#bfe8f0'], wallFace: ['#757a68', '#282f39', '#c5bca8', '#101418'], ceiling: ['#282f39', '#bfe8f0', '#bfe8f0', '#101418'],  // unused with 'faces', kept valid
  fog: 0x10151c, portal: 0x708071, hull: 0,
  h: 12,                                  // lamp height: set after checking ROOMS in scenery-area51.js (rooms run 12 to 32 m); 12 = the lowest room
  ambient: 0.35, day: 0, gloss: 0.15 },
  eye: { tun: 0.5, blackM: 0.5, clair: 0.3 } },
```

Keep the engine shell off: `faces` removed means no engine walls, vault or hull. H1 has no engine darkness or echo; its light is the scenery's own strip lights (`h.emis`). Today's blockout has `tun: null`, so B1 has neither darkness nor echo.

### 2.4 Open choices

1. **Which section gets the engine tunnel?** B1 (recommended: 800 m, dark, echo and eye adaptation matter most) or H1 (at the start, 300 m, cannot straddle the start line). Recommendation: **B1**.
2. **DeLorean tune.** Stock 130 hp (recommended: slowest car, 142 to 206 km/h, the joke is the point) or the turbo conversion (142 to 254). Recommendation: **stock**; the body is new either way.
3. **Runway markings and `chev`.** Keep the hazard chevrons on the base roads (yellow/black reads as industrial) but not on the runway or in B1. Recommendation: **yes, with `chevExcept` as above**.

---

## 3. Sky Pillars (`piliers`)

Zhangjiajie-style sandstone pillars, early morning, mist below the road. 4 042 m, W 7 (8 on the ledge and bridge approaches), forest, ledge round two towers, suspension bridge, plateau with an 80 m rock tunnel (points 60 to 62, PK 2395 to 2475), buttress descent. 1995 to 1998 console look.

### 3.1 Car: TIANMEN SW-22

**Why.** A late-1990s four-wheel-drive mountain car for a road of tight, linked bends over a void: Subaru Impreza 22B STi (2.2 L flat four turbo, 280 hp, 1 270 kg, five speeds, four-wheel drive). Pitch-perfect for the era the sheet names, and the blue-and-gold livery stands out against cream rock and sage-grey forest (red would be lost against the `#a65949` pavilions). Name from Tianmen mountain next door.

**Body.** `groupeb` (short hatchback two-box, wing boxes, hatch spoiler), the body of `givre`'s BOREALE. Acceptable: boxed arches and a big wing read as a 22B. Same silhouette as a shipped map, different colour and stripes.

```js
// Subaru Impreza 22B STi (1998): 2.2 L flat-four turbo, 280 hp, 1 270 kg, 5-speed, four-wheel drive (ratios approximate)
car: car({ label: 'TIANMEN SW-22', ratios: [3.54, 2.06, 1.54, 1.19, 0.95], final: 3.8, wheel: 0.31, mass: 1270, idle: 900, red: 7500, cd: 0.36, area: 1.95,
  tq: [0, 170, 260, 330, 360, 370, 360, 330, 260], trac: 11, rwd: 0, grip: 0.9, sound: 1.15, engine: 'l4', turbo: 1,
  look: { type: 'groupeb', col: 0x2457c5, stripes: 0xf0c040, l: 0.92, w: 1.03, h: 1.04, nose: 0.5, cab: [-0.2, 2.1, 0.58], tailFin: 2 } }),
```

**On this layout (rpm.js).** Top 243 km/h, 193 to 243 km/h, average 237, about 37 brakings, over 95 % in 5th. With the borrowed car: 207 to 263, 33 brakings and one wall touch. The brakings are the ledge bends, the bridge approach and the tunnel mouth. Gearing backed by figures (and, as on egee, it does not create gear changes).

**Map-level settings.** `kmh: 0.92` (shows 224 at 243), `spd: [190, 240]`, `grip` car 0.9 (see above), `med` default.

### 3.2 Road style

**What it is.** A maintained scenic service road: cool blue-grey asphalt (sheet `#343e44`), 14 to 16 m wide, stone parapets everywhere (made by the scenery, `wallH: 0`), cream paint, bridge deck by the scenery.

```js
roadTex: 'roadwayFine', gloss: 0.02,
road: ['#343e44', '#414c52', '#ece4d2', '#ece4d2', '#343e44', '#343e44', false],
intoWall: ['#e3dcc0', '#b6aa8f', '#9b9a7e', '#687c65'],   // unchanged: lit rock, coping, sage, shade
wallH: 0,                                                 // unchanged: stone parapets by the scenery
startLine: [0xed8f89, 0xf0e8d8, '#f0e8d8'],               // unchanged: coral accent
chev: 1, chevTex: 'chevronGES',                            // red/white, echoes the pavilion red; add chevExcept for the bridge span at implementation
```

No `surf`, no wet option: the sheet forbids water on the road and mist at road level.

**Readability.** Asphalt `#343e44` is a clear step darker than the lit rock `#e3dcc0` and sage `#9b9a7e`; the shade colour `#687c65` on the inner wall is the nearest, still lighter than the road. The paint is warm cream, below the sky's value.

**White patches?** Yes, likely: same four causes as egee (gloss 0.08, classic `roadway`, hemi 1.0 / sun 0.9, near-white paint), plus `shadows: { soft: 1 }` which does not matter here. Same fix. Note the bridge deck is scenery (`laquePiliers` and steel): check its gloss separately on a `plan.js` shot.

### 3.3 Tunnel style

**What it is.** A short straight road tunnel cut through a spur of tower P4: 80 m, about 75 m of rock above, stone portals built by the scenery at both mouths, rough-cut sandstone lining texture `tunnelPiliers` (the scenery's texture, the engine's own settings are ignored by it). The sheet wants the exit visible as a bright dot, not a long or curved tunnel and no natural arch.

```js
tun: [60, 62],                               // unchanged: PK 2395 to 2475
th: { tun: { ...G.MAPS.find(m => m.id === 'barrage').th.tun,   // as the blockout: base palette, replaced below
  tex: ['tunnelPiliers', 'tunnelPiliers'],
  without: ['gates'],                         // [portals]: the scenery's stone portals stand at the mouths
  h: 7.5, vault: 2.5,                         // 14 m wide x 7.5 m: a shallow arch
  fog: 0x1c2622, neons: [0xffc878, 0xffc878], // sparse warm sodium lamps (the car is lit from them)
  ambient: 0.45, day: 0, skyDay: 1,           // skyDay: daylight shows through the exit mouth
  gloss: 0.1, raysK: 0.4 },
  eye: { tun: 0.5, blackM: 0.5, clair: 0.25 } },   // moderate dark on entry, the exit dot recovers in 0.25 s
```

The engine builds walls and vault here (the scenery supplies the texture), so no `faces` removal. The blockout already fits `tex` and `without: ['gates']`; `h`, `vault`, `ambient`, `eye` are new.

### 3.4 Open choices

1. **Chevron colour.** Red/white (`chevronGES`) fits the pavilion red and the cream rock; the default yellow/black is louder. Recommendation: **`chevronGES`**.
2. **Tunnel darkness.** Dark enough to read the exit dot (recommended `eye.tun 0.5`) or bright (`0.8`, almost no tunnel feeling at 80 m). Recommendation: **0.5**.
3. **Car colour.** Sonic blue with gold stripe (recommended) or a white car with a coral stripe like the start gantry. Recommendation: **blue**, for contrast against sage and cream.

---

## 4. Volcanic Island (`volcan`)

Madeira-like Atlantic island, afternoon, hard shadows. 6 575 m, W 7, climb out of the harbour on terraced ash slopes, basalt needle at the pass, **north gallery (points 100 to 105, PK 3991 to 4190, engine tunnel)**, crater floor with a lava lake, **south gallery (PK 4520 to 4780, built by the scenery)**, hairpins down.

### 4.1 Car: LEVADA HF EVO

**Why.** Rally-island car: Lancia Delta HF Integrale Evoluzione (1993), 2.0 L four turbo, about 215 hp, 1 260 kg, five speeds, four-wheel drive. Madeira is a rally island and the boxy flared hatch is the right shape for steep hairpins and short galleries. Name from the island's levadas (irrigation channels). White with a red stripe reads against the black rock and the Atlantic blue.

**Body.** `r5` (short three-box hatch with wide wings, roof spoiler), the body of `paris`'s LUTECE 5 TURBO MAXI (yellow, mid-engine). The flared arches and roof spoiler suit a Delta. Acceptable stopgap.

```js
// Lancia Delta HF Integrale Evoluzione (1993): 2.0 L four turbo, about 215 hp, 1 260 kg, 5-speed, four-wheel drive (ratios approximate)
car: car({ label: 'LEVADA HF EVO', ratios: [3.58, 2.06, 1.38, 1.03, 0.76], final: 4.4, wheel: 0.3, mass: 1200, idle: 900, red: 7000, cd: 0.38, area: 1.9,
  tq: [0, 150, 230, 290, 310, 300, 290, 260, 200], trac: 11, rwd: 0, sound: 1.2, engine: 'l4', turbo: 1,
  look: { type: 'r5', col: 0xf2f0e6, stripes: 0xc8322a, l: 0.9, w: 1.0, h: 1.06, nose: 0.4, cab: [-0.25, 2.2, 0.6], tailFin: 1 } }),
```

**On this layout (rpm.js).** Top 237 km/h (the borrowed car reaches 289), 161 to 237, average 216, 59 brakings (hairpins, needle, crater), about 48 % of the lap above 92 % of the limiter. Over 95 % in 5th. Gearing backed by figures; in practice 4th is touched only on hairpins.

**Map-level settings.** `kmh: 0.9` (shows 213), `spd: [160, 235]`, car `grip` default, `med` default.

### 4.2 Road style

**What it is.** A coastal mountain road: asphalt over ash and basalt, concrete posts and parapets, galleries cut in the rock.

```js
roadTex: 'roadwayFine', gloss: 0.02,   // gloss line already in the blockout; roadTex is new
road: ['#555a60', '#61666c', '#e8d9ac', '#e8d9ac', '#555a60', '#555a60', false],
//      lighter asphalt than the blockout (#3a3d42), so it leaves the black basalt
intoWall: ['#e8d9ac', '#555a60', '#34373d', '#23292d'],   // unchanged: stone-yellow face, basalt coping
wallH: 1.1,                                               // unchanged
startLine: [0xb75d43, 0xe8d9ac, '#e8d9ac'],               // unchanged
chev: 1,                                                  // default yellow/black
```

No wet option in the open. Optional: a light `damp` zone in the north gallery with `th.wetVisible: 0.5` for the dripping rock, at the cost of the reflection pass (about +0.3 ms); not recommended by default.

**Readability, and the problem here.** The blockout asphalt `#3a3d42` is almost the colour of the verge: the sheet's basalt is `#34373D` and the ash is darker still. This **breaks the first readability rule** ("the road stands apart from everything else"). Lifting the road to `#555a60` keeps the paint and the stone-yellow wall face readable and leaves the road a clear step above the rock. The gallery floor stays darker (`#2c2f34`) than the lined walls (`#555a60`).

**White patches?** Partly explained, partly fixed already. The blockout already has `gloss: 0.02` with a comment saying the afternoon sun left white patches, which confirms the diagnosis for the gloss. What remains: the classic `roadway` white patches, hemi 1.0 / sun 0.95 and pale paint. Same recipe: `roadwayFine`, then hemi 0.8 if patches persist.

### 4.3 Tunnel style

**What it is.** Basalt galleries: a rough rectangular opening cut in black rock, no portal frame, a sparse line of warm lamps, dark and a little damp. The north gallery (200 m) is the engine tunnel; the south gallery is built by the scenery (no darkness, no echo, as `scenery-volcan-cratere.js` notes), so the engine tunnel stays a single span.

```js
tun: [100, 105],                                          // unchanged: PK 3991 to 4190
th: { tun: {
  ground: ['#2c2f34', '#3a3d42', '#e8d9ac', '#e8d9ac', '#2c2f34', '#2c2f34'],
  wallMeshes: ['#e8d9ac', '#e8d9ac'], wallFace: ['#555a60', '#6a7078', '#80868e', '#23292d'], ceiling: ['#34373d', '#e8d9ac', '#e8d9ac', '#555a60'],
  tex: ['galerieVolcan', 'galerieVolcan'],                 // the scenery's basalt texture
  without: ['gates'],                                      // [portals]: the blockout writes 'portals', which the engine ignores today; plain mouths = no engine portal
  h: 6, vault: 1.5,                                        // low, almost flat roof: a cut gallery, not a dome
  neons: [0xffc878, 0xffc878], fog: 0x23292d, hull: 80,
  ambient: 0.3, day: 0, gloss: 0.1 },
  eye: { tun: 0.4, blackM: 0.5, clair: 0.3 } },
```

The engine shell is wanted here (the scenery supplies only the texture, so no `faces` removal). The sheet's "crater floor in shade lit by its own lava lake" is outside the tunnel.

### 4.4 Open choices

1. **Road lightness.** `#555a60` (recommended, clear of the basalt) or keep `#3a3d42` and rely on bright paint and kerbs. Recommendation: **lift to `#555a60`**.
2. **Damp galleries.** Visible seepage in the north gallery (`damp` + `wetVisible`) adds mood and grip loss but costs a reflection pass. Recommendation: **no**.
3. **Delta body.** `r5` stopgap, or a new boxy `delta` hatch. Recommendation: **`r5`**; the white livery already separates it from the yellow LUTECE.

---

## 5. Lunar Outpost (`lune`)

1970s lunar colony between impact craters, black sky, one hard white sun, no haze. 5 280 m, W 9, a jump off the rim of an immense crater (`grav: 8`, `jumps: [[77, 40, 3]]`), arena floor driven anywhere, a pressurised tunnel out (points 91 to 99, PK 3620 to 3941 = 320 m).

### 5.1 Car: SELENE MOLAB-1 (a closed lunar rover)

**Why.** The author's brief: a lunar-rover type vehicle, but with a roof and walls. The retro-futurist real thing is the 1964 GM MOLAB (Mobile Laboratory) concept, a pressurised six-wheel cabin on big mesh wheels, crossed with the proportions of the Apollo Lunar Roving Vehicle (open chassis, wire wheels, dish antenna). The sheet bans open rovers with a visible driver, so the cabin is closed. A 1970s colony would run it as a pressurised utility car: boxy, tall, high-set cabin, big wheels, solar roof, ivory and orange. It is also physically sensible for the jump and the bowl: big wheels, long travel.

**Body: new body needed, no existing one fits** (`buggy` is an open beach buggy with a visible driver, `pickup` is a stadium truck). Silhouette needed (later): a boxy pressurised cabin about 3.6 m long and 2.2 m wide, set high on a flat chassis; large rounded-rectangle windscreen strip and small round portholes along the sides; flat roof carrying a solar panel and a small dish; very large wheels (radius about 0.45 m, wire-mesh look) at the four corners, wide track; short stubby nose with two flat lamps; a rear radiator or battery pack panel; a thin ivory rail or skirt at the sill. Livery: ivory `col` with an orange `stripes` band under the windows. Sound: `engine: 'rot'` (smooth rotary whine reads as an electric drive; there is no electric timbre).

```js
// GM MOLAB (1964) concept / Apollo LRV: pressurised electric rover, game-tuned: 4-wheel drive, 1 500 kg, 3 gears, big wheels
car: car({ label: 'SELENE MOLAB-1', ratios: [3.6, 2.0, 1.2], final: 3.5, wheel: 0.45, mass: 1500, idle: 600, red: 6000, cd: 0.3, area: 2.6,
  tq: [0, 300, 330, 320, 300, 260, 200, 0, 0], trac: 9, rwd: 0, sound: 1.6, engine: 'rot',
  look: { type: 'molab', col: 0xe8e2d0, stripes: 0xd78a40, l: 1.0, w: 1.0, h: 1.0, nose: 0.3, cab: [0.0, 2.6, 0.7], tailFin: 0 } }),  // 'molab' = the new MODELS body; no existing body is a usable stopgap
```

**On this layout (rpm.js, with `grav: 8` and the jump).** Top 192 km/h, 81 to 192, average 164, about 35 brakings, 2nd 7 %, 3rd 93 %. It is the slow, heavy, high car of the lap: it brakes earlier for the six ridge bends and the hairpin and is the least flat-out of the six on this map. The jump (landing distance with `grav: 8`) was not simulated: only the lap speeds come from `rpm.js`. A three-gear table is deliberate (a rover has few); gearing is backed by figures for the speed band only.

**Map-level settings.** `kmh: 0.9` (shows 173 at 192), `spd: [100, 190]`, car `grip` default, `med` default.

### 5.2 Road style

**What it is.** A sintered, graded regolith track between the base and the craters: very dark, matt, almost no sheen (no air, no wet), ivory rail on the crater side, instrument-blue and guidance-orange details. On the arena floor there is no road at all: bare regolith driven anywhere.

```js
roadTex: 'roadwayFine', gloss: 0,
road: ['#23262d', '#2c3038', '#e8e2d0', '#d78a40', '#23262d', '#23262d', false],
//      sintered  grain      edge: ivory  dash: guidance orange     no kerb stripes
intoWall: ['#e8e2d0', '#747988', '#d78a40', '#526c80'],   // unchanged: ivory rail, regolith, orange, instrument blue
wallH: 1.1, guardM: 0, withoutCones: 1,                   // unchanged: the scenery places the rails
startLine: [0xd78a40, 0xe8e2d0, '#e8e2d0'],               // unchanged
chev: 1, chevK: 0.02, chevExcept: [[77, 91]],             // signs only in tight bends (sheet: three to five things per frame), none on the run-up and arena
```

Optional, the arena only: `surf: { zones: [[78, 90, 'terre', 0.4]] }`, loose regolith that lets the car drift (`terre` is the closest of the six `SURF` types; no new type is proposed).

**Readability.** Road `#23262d` against regolith `#747988` and the ivory rails: strong separation; the road is the darkest band in the frame. Paint is ivory and orange only.

**White patches?** Yes, likely and the worst case: a hard white sun at 1.1 over hemi 0.6, `gloss` unset (0.08) on a surface that should be fully matt, classic `roadway` white patches, and ivory paint at full value under that sun. Fix: `roadwayFine`, `gloss: 0`, and sun `[0xffffff, 0.9]` if a sheen remains (the sun is the only light; hemi 0.6 already carries the shadows). Not confirmed by a render.

### 5.3 Tunnel style

**What it is.** A pressurised covered way: a sealed ivory tube going into the crater wall, straight and clean, lit with cold instrument-blue lamps, black outside the frame and "the cold light of the tunnel" inside, no light or beacon at the mouth. 320 m is long for the "not an endless tunnel" anti-reference; it is kept because it is the map's exit and its length was set with the layout. The mouth (a plain ivory frame, `portiqueLune`) is the scenery's.

```js
tun: [91, 99],                                            // unchanged: PK 3620 to 3941
th: { tun: {
  without: ['gates'],                                     // [portals]: the scenery's ivory frame is the mouth
  ground: ['#23262d', '#2c3038', '#e8e2d0', '#d78a40', '#23262d', '#23262d'],
  wallMeshes: ['#6fabc6', '#6fabc6'], wallFace: ['#b8b2a2', '#efe6d4', '#df8c40', '#3b3e4b'], ceiling: ['#3b3e4b', '#6fabc6', '#6fabc6', '#efe6d4'],   // as the blockout: ivory panels, orange band
  neons: [0x6fabc6, 0xdf8c40],
  h: 7, vault: 3.2,                                       // a tube: tall, strongly arched, 18 m wide
  fog: 0x101521, portal: 0xdf8c40, hull: 80,
  ambient: 0.65, day: 0, gloss: 0.12 },                   // a clean lit tube: more ambient than a cave
  eye: { tun: 0.6, blackM: 0.4, clair: 0.3 } },
```

The blockout has `without: ['gates', 'lamps']`; this proposal drops `'lamps'` ([fixtures]) so the engine places its lamp housings: they give a tube a readable repeating rhythm.

### 5.4 Open choices

1. **Rover body.** The closed rover needs a new model; there is no stopgap (the DeLorean wedge and the rover are the two new bodies of this proposal). Recommendation: **build it as one small boxy model with the big wheels**; the wheel size does most of the work.
2. **Loose regolith in the arena** (`terre` zone 0.4) or the same grip as the track. Recommendation: **yes, 0.4**: with `grav: 8` the drift is the fun of the bowl.
3. **Tunnel length.** 320 m of tube or shorten it to about 200 m. Recommendation: **keep 320 m** unless the author finds it long in play.

---

## 6. Sunken Highway (`autoroute`)

Evacuated coastal city taken back by plants, low orange sun, shallow water in side streets. 2 551 m, W 6 (12 on the boulevard), boulevard, motorway viaduct, warehouse streets, **metro with a station (points 113 to 144, PK 1873 to 2337 for the engine span; the scenery's metro runs PK 1877 to 2553)**. Speeds are low: `spd: [90, 150]`.

### 6.1 Car: HERON 240 TURBO

**Why.** The one car that fits a city that was left in a hurry decades ago and still runs: a boxy, indestructible 1980s saloon. Volvo 240 Turbo in touring-car tune (the 1985 Group A "flying brick" made about 300 hp; the road car 155 hp), rear drive, 1 350 kg. The long wheelbase and tall body suit 16 m streets and the traffic-weaving line. Faded mustard with a teal stripe (the water). The name: a heron wades in the flooded streets. Not a sports car: it is the right car for a map whose speed band is 75 to 175.

**Body.** `peykan` (three square volumes, four doors, round headlights), the body of `perse`'s PEYKAR 1725 RALLYE. The boxy three-box saloon fits a 240.

```js
// Volvo 240 Turbo (1985, touring-car tune): 2.1 L four turbo, about 230 hp, 1 350 kg, 5-speed, rear-wheel drive (ratios approximate)
car: car({ label: 'HERON 240 TURBO', ratios: [3.71, 2.16, 1.37, 1.0, 0.77], final: 3.9, wheel: 0.31, mass: 1350, idle: 800, red: 6000, cd: 0.4, area: 2.1,
  tq: [0, 170, 230, 260, 280, 290, 280, 230, 0], trac: 9, rwd: 1, sound: 0.95, engine: 'l4', turbo: 1,
  look: { type: 'peykan', col: 0xd9a52c, stripes: 0x2a8f8a, l: 1.0, w: 1.0, h: 1.0, nose: 0.5, cab: [-0.2, 2.2, 0.6], tailFin: 0 } }),
```

**On this layout (rpm.js).** Top 173 km/h, 75 to 173, average 114, over 150 brakings (dense street corners; many are short), **gears 3 62 %, 4 34 %, 5 4 %**: this is the only map of the six where gears change across the lap, and the gearing was left as drawn. The borrowed car gives 75 to 195 with 2nd 32 %, 3rd 45 %, 4th 23 %. The 240 is slower and heavier, so the metro and the hairpins around stalled cars get harder, which is the point.

**Map-level settings.** `kmh: 0.9` (shows 156), `spd: [80, 170]`, car `grip` default, `med` default (the many corners mean the autopilot's lap is the better reference than a multiple: recalibrate after the car lands).

### 6.2 Road style

**What it is.** There is no track: it is a street. The scenery lays its own `asphalteAutoroute` ribbon over the engine's road (polygon offset) in the open and in the metro, so what the player sees is the city's asphalt, patched, cracked and stained, with no lane markings or kerb stripes. The engine road only shows where the scenery ribbon does not cover.

```js
roadTex: 'roadwayFine', gloss: 0.02,                 // engine road under the scenery asphalt: quiet and matt where it shows
road: ['#3e4146', '#3e4146', '#3e4146', '#3e4146', '#3e4146', '#3e4146', false],   // unchanged: one tone, no paint, as the sheet wants
intoWall: ['#c8c2b0', '#9a9484', '#7a8a5a', '#6a6a60'],   // unchanged: grey concrete barrier module
wallH: 0, guardM: 0, chev: 0, withoutCones: 1,            // unchanged: the scenery places barriers; no chevrons, no cones
startLine: [0xe9b850, 0xf0e6c8, '#f0e6c8'],               // unchanged
```

No `surf` zone: the sheet says water at the kerb, never on the driven road.

**Readability.** `#3e4146` asphalt against stone `#A89A80`, brick `#8A5A48` and leaf `#5A8A40`: good separation; against the grey concrete barrier `#c8c2b0` also fine. The mustard car against grey asphalt reads.

**White patches?** Probably **not from the current `th.road`**: the visible surface is the scenery's own asphalt (no white pixels in its texture, no gloss set). A hot patch here would come from the engine road showing through the scenery ribbon, or from the very low sun (`orb.dir` y 0.35 behind the car at the start) on the engine road at gloss 0.08. The two lines above remove that source. Not confirmed by a render.

### 6.3 Tunnel style

**What it is.** The metro: a rectangular double-track concrete tunnel under a street, 18 m between walls, floor at -8.5 m, columns between the tracks, trains stalled across the lane, the station with its platform, a corridor and stairs up to daylight, and 170 m more tunnel closed by a derailed train. Lit by green-white emergency lights, near-dark, damp, "never to black". The scenery builds all of it (tiled walls, concrete ceiling, trains); the engine tunnel is bare: floor and lights only.

```js
tun: [113, 144],                                          // unchanged: PK 1873 to 2337
th: { tun: {
  without: ['walls', 'gates', 'lamps'],                   // [faces, portals, fixtures]: the scenery makes walls, ceiling, stairs, portal; the engine keeps floor and lights
  ground: ['#33383a', '#33383a', '#33383a', '#33383a', '#33383a', '#33383a'],
  wallMeshes: ['#2c2a24', '#2c2a24'], wallFace: ['#2c3a34', '#3a4a40', '#4a5a4c', '#141a16'], ceiling: ['#1c1a16', '#2a2620', '#2a2620', '#2a2620'],   // unused with 'walls', kept valid
  neons: [0xa8ffc0, 0xa8ffc0],                            // the sheet's emergency green-white
  h: [[0, 9], [0.82, 9], [0.86, 4.5], [1, 4.5]],          // unchanged: tunnel and station, then the passenger corridor
  fog: 0x2e3c34, portal: 0x8f8c82, hull: 0,
  ambient: 0.35, day: 0.2, gloss: 0.1 },                  // day 0.2: the stairwell keeps some daylight on the sun-lit part; gloss: damp, never standing water
  eye: { tun: 0.5, blackM: 0.5, clair: 0.3 } },
```

The blockout already has everything but `ambient`, `gloss` and `eye`, which are new. Keep `lamps` removed only if the scenery places its own housings (it places emergency fixtures: "the engine only lays the floor and the lights"). Do not set `tex` or `vault`: nothing of the engine shell is drawn.

### 6.4 Open choices

1. **Which car for a flooded city?** The 240 saloon (recommended) or a high 4x4 (Land Cruiser) that would need a new body (the `pickup` is the stadium truck). Recommendation: **240 on `peykan`**.
2. **Tunnel darkness.** Near-dark with green emergency lights (recommended, `ambient 0.35`) or lighter so the trains read (`0.5`). Recommendation: **0.35, then check the trains on a `plan.js` shot**.
3. **Mustard livery.** Faded mustard with a teal stripe (recommended) or a dusty blue car that blends with the water. Recommendation: **mustard**.

---

## Cars that need a new body model

- **Area 51, KELVIN DM-12: yes**, a gullwing stainless wedge (brief in 2.1).
- **Lunar Outpost, SELENE MOLAB-1: yes**, a closed pressurised rover with big wheels (brief in 5.1).
- The other four use existing bodies: egee `gtr` scaled, piliers `groupeb`, volcan `r5`, autoroute `peykan`. Each is already used by a shipped map (`ville`, `givre`, `paris`, `perse`), so livery and proportions carry the difference.

## How the figures were made

`tools/rpm.js` loads `touge`'s entry and lets `CAR`, `MAP` and `PTS` override it, so each map was run from the main checkout with the branch's control points. Extract them once, per map, from its branch:

```bash
node -e "const s=require('child_process').execSync('git show claude/blockout-egee-62a530:src/data/maps.js',{maxBuffer:1e8}).toString();const i=s.indexOf(\"if (id === 'egee')\"),j=s.indexOf('pts:',i);let k=s.indexOf('[',j),d=0,e=k;for(;;e++){if(s[e]=='[')d++;if(s[e]==']'&&--d==0)break}console.log(s.slice(k,e+1))" > egee.pts.json
```

Then, for example the egee car above:

```bash
PTS="$(cat egee.pts.json)" MAP='{"W":6,"wide":[[71,53,7],[87,50,7.5],[89,19,8]],"kmh":0.8}' \
CAR='{"ratios":[3.3,2.1,1.5,1.15,0.92],"final":3.7,"wheel":0.28,"mass":800,"idle":1000,"red":7500,"cd":0.38,"area":1.7,"tq":[0,130,170,200,220,230,235,225,190],"trac":10,"rwd":1,"grip":0.85}' \
node tools/rpm.js touge
```

The other five use the same form (`MAP` copies the blockout's `W`, `wide`, `grav`, `jumps` for that map; `CAR` is the data of its section; area51 `W 10, wide [[185,201,30]]`, piliers `W 7, wide [[96,5,8],[20,42,8]]`, volcan `W 7`, lune `W 9, wide [[129,6,11],[78,81,25]], grav 8, jumps [[77,40,3]]`, autoroute `W 6, wide [[0,1,12],[18,20,12],[30,32,12],[41,43,12],[85,103,6.2]], jumps []`).

## What could not be verified

- **White patches are diagnosed from values and from the shaders' code, not from a render** (no `plan.js` shot was taken on the six branches). The volcan blockout comment is the only independent confirmation of the gloss cause.
- **`rpm.js` is an autopilot lap**, not a human one; the braking counts include short lifts. It does not model the jump of `lune` (landing distance not checked) and it does not cover the tunnels' darkness, the bridge deck or the surface zones.
- **Real car specs and ratios are from memory** (marked "approximate"); the `tq` curves are shaped for the game, not copied. Several peak above what the real car makes (egee, volcan, lune, autoroute are deliberately tuned versions).
- **The tunnel options** follow `docs/methods/MAP-ENGINE-OPTIONS.md`, the engine code on `main`, and the branch scenery; none was tried in the game. The `h` of the area51 B1 lamps and the `chevExcept` indices for the piliers bridge and the egee village still need one look with `plan.js`.
- **Pre-rename vocabulary (`without`, `surf`)** as described in "What is shared" must be settled before any of the tunnel blocks is pasted.
