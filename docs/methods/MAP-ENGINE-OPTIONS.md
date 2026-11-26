# Per-map engine options

Reference for the options a map can switch on. All are off by default: a map that sets none renders exactly as before (same shaders, geometries, textures and number of draw passes).

Options are set in the map's entry in `src/data/maps.js` (`th` = theme), except `layerSet`, which can also be passed to `terrain()` in `src/render/scenery.js`. Implementation lives in `src/engine/game.js` (engine options), `src/render/scenery.js` (terrain layers) and `src/render/textures.js` (textures); `M.wide` is read in `src/engine/sim.js`.

## Trying an option without editing `maps.js`

The `?opt=<JSON>` URL parameter is merged into the map at load (`th` into the theme, other keys into the map, `wide` included). It works in the game, in `tools/captures.html` (`opt=`) and in the bench (`OPT='...' node tools/bench-quick.js <map>`).

```
captures.html?map=chapada&step=10&size=1920x1080&game=1&opt=<URL-encoded JSON>
```

`imgSize=LxH` sets the game page size (960x540 by default); `game=1` pastes the real game render (270 lines, with HUD) on the left and the fine render on the right, at the same height. Captures are not pixel-reproducible from one run to the next (random shake and particles): to prove a map did not change, compare shaders and geometries rather than JPEGs.

## Quick index

| Group | Options |
|---|---|
| Textures | `th.smooth`, `th.roadTex` |
| Terrain | `th.layerSet` |
| Light and sky | `th.shadows`, `th.skySeg`, `th.orb.spokes` |
| Fog | `th.haze`, `th.isFar`, `th.headlightsHaze` |
| Road | `th.wetVisible`, `th.reflectionWater`, `th.gloss`, `M.wide`, `M.obst`, `th.chev`, `th.chevTex`, `th.chevExcept`, `th.chevK`, `th.withoutCones` / `th.cones`, `th.startLine[3]` |
| Tunnel and hall | `th.tun.h`, `vault`, `opn`, `spokes`, `raysK`, `ambient`, `day`, `without`, `skyDay`, `gloss`, `tex`, `th.eye` |
| Feedback and particles | `th.graze`, `th.seaSpray`, `th.leaves`, `th.dustBallistic`, `th.vacuum`, `h.emis` |

## Textures

### `th.smooth`, `mat(..., { smooth: 1 })`: linear texture filtering

| | |
|---|---|
| What it does | Switches the named textures to linear filtering with mipmaps (`LinearMipmapLinearFilter`) instead of nearest. Other textures stay sharp. `roadway` is accepted (road and tunnel floor). |
| Default | Off (nearest filtering). The URL parameter `?smooth=1` applies it to every texture, for review. |
| Cost | None (filtering is done by the GPU). |
| Note | Good for water and water curtains. On a sharp-patterned rock such as `rocheStrates` it looks blurry up close and breaks the pixel style: avoid it on nearby walls. |

```js
th: { smooth: ['eauThe', 'waterfall'] }                 // these textures, wherever the map and the engine use them
h.mat('eauThe', { smooth: 1, transparent: true })     // gold a single material
```

### `th.roadTex`: alternative road texture

| | |
|---|---|
| What it does | Replaces the road texture. `'roadwayFine'` is a 128 x 512 drawing instead of 64 x 256: fine soft grain (it blends into one tone at 270 lines), no light patches or cracks, continuous wheel tracks. Edges, dashes, kerbs and puddles keep the same place. It draws its randomness from its own seed (`rand`), so it does not shift the map's scenery. |
| Default | `'roadway'`. Takes the same 7 `th.road` settings. |
| Cost | None in frame time; 256 KB of texture. |
| Combine with | `smooth: ['roadwayFine']`. |

```js
th: { roadTex: 'roadwayFine', road: [ /* same 7 settings as for roadway */ ] }
```

## Terrain

### `th.layerSet` (or `terrain(h, { layerSet })`): multi-material terrain

| | |
|---|---|
| What it does | Up to 4 layers over the terrain material (`o.mat`, which must have a texture), applied in order, each over the previous. A layer's weight is the product of its criteria, each blending smoothly between two bounds. Weights are computed per mesh vertex (every `stepSec` metres) and blended in the shader; the terrain stays **one draw pass**. |
| Default | Off. |
| Cost | One extra texture read per layer, on the terrain only; draw passes unchanged. |

Layer fields:

| Field | Meaning |
|---|---|
| `slope: [a, b]` | 0 to 1 as `1 - normal.y` goes from a to b (0 = flat, 1 = vertical) |
| `edgePt: [a, b]` | 1 within a metres of the road, 0 beyond b |
| `high: [a, b]` | 0 to 1 from altitude a to altitude b |
| `low: [a, b]` | 1 to 0 from altitude a to altitude b |
| `weight: (x, z, y, slope, d) => 0..1` | free criterion |
| `noise` | random offset per vertex, to break edges |
| `rep` | texture scale relative to the terrain's |
| `tex: [name, ...settings]` | a catalogue texture; or `map:` for an already-built texture |

```js
th: { layerSet: [
  { tex: ['rocheStrates'], slope: [0.22, 0.45], rep: 0.6 },              // rock on slopes
  { tex: ['noise', '#7a5a3a', ['#8a6a48']], edgePt: [7, 18] },             // earth near the road
  { tex: ['sableBlanc'], low: [2, 6] },                                   // sand in hollows
] }
```

Note: keep `noise` under 0.1 and widen the gap between a and b; `noise: 0.25` with an 8 m step gives edges that read as hard patches. Roadside ribbons placed by the scenery cover the terrain, so a layer near the road may barely show.

## Light and sky

### `th.shadows: { imgSize, field, soft }`: shadows

| Field | What it does | Default |
|---|---|---|
| `soft: 1` | Replaces three's `getShadow` with 4 bilinear-blended reads: stair-step shadow edges become gradients. Almost free. | off |
| `field` | Half-side covered by the shadow map, in metres. Smaller is finer (0.24 m per texel at 250) but the shadow stops sooner and the fixed-scenery shadow is recomputed more often (every 64 texels of movement). | `300 * FAR` (390 m) |
| `imgSize` | Shadow map side in texels. **4096 is expensive** (roughly 3x frame time on chapada: the moving square copy and the fixed-shadow recompute are four times larger): avoid. | 2048 |

Background: with `BasicShadowMap` (no filtering) a texel is 2 x 390 m / 2048 = 0.38 m, and under a low sun it stretches along the ground by 1 / sin(sun height), which gives stair-stepped tree shadows. `soft: 1` is the recommended fix.

```js
th: { shadows: { soft: 1 } }                  // recommended
th: { shadows: { soft: 1, field: 250 } }      // finer, shadow range 250 m
```

### `th.skySeg`: sky sphere facets

| | |
|---|---|
| What it does | Number of facets of the sky sphere. On a daytime sky with tight colour steps near the horizon, 16 facets break the steps into a fan. |
| Default | 16 |
| Cost | None. |

### `th.orb.spokes`: sun/moon halo strength

| | |
|---|---|
| What it does | Strength of the celestial body's halo in the final pass. Lower it when a bright ground at midday whitens (plage: 0.3). |
| Default | 1 |

## Fog

### `th.haze`: fog by zone

Two forms, both a list of zones between track control points (`M.pts` indices). Zones must not straddle the start line. In split screen each view has its own car's fog.

**Four values `[a, b, startMat, ending]`:** between points a and b the map's fog start and end slide to the given distances in metres, with a 180 m fade at zone entry and exit. It is the scene's real fog (no flat texture in the scenery): everything that receives fog disappears in it; things placed outside fog (`fog: false`, distant silhouettes) stay sharp, so a veil of fog colour is stretched 700 m around the camera inside the zone to hide what escapes the fog (sky, sun, far elements). Veil opacity follows the zone's strength, so a tight fog (`[68, 73, 0, 55]`: you see 55 m) has no sharp horizon above. The zone also acts under a tunnel: if it starts at the tunnel exit, its 180 m fade fills the end of the tunnel and the fog is full at the exit.

**Three values `[a, b, k]`:** the fog range is multiplied by k between the control points, faded over 120 m.

| | |
|---|---|
| Default | Off (no veil created). |
| Cost | One draw pass, in the zone only. |

```js
th: { fogD: [70, 1000], haze: [[68, 75, 30, 380]] }        // fog from 30 m, total at 380 m between points 68 and 75
th: { haze: [[1, 4, 0.62], [29, 34, 0.68]] }               // range x k
```

### `th.isFar` (metres): minimum draw range

The camera does not draw beyond 1.5 x the fog end (3000 m at most). `isFar` sets a minimum range for maps whose far elements are placed outside fog (`fog: false`: peaks, halo, silhouettes) beyond that, otherwise they vanish. Default: none.

### `th.headlightsHaze`

Inside a fog bank (`th.haze` with four values), car headlights come on at this strength, in proportion to the bank. Without it, the headlight level is the map's `th.headlights` and night level.

## Road

### `th.wetVisible`: visible wet road

| | |
|---|---|
| What it does | `surf` zones of type `'damp'` look like asphalt in rain, even where it does not rain: shinier road (sun, moon, headlights and neon leave stretched reflections), screen-space reflections (ssr) computed there, and darker asphalt (down to 30% for a full wet). The wetness follows `T.surf` from `src/engine/sim.js`: what you see is what you drive, faded over 20 m at the edges. The tunnel floor gets it too (seeping galleries), but not the rain, which is cut under the tunnel as in the physics. |
| Default | Off. Value `1`, or a strength (0.5 = half as marked). |
| Cost | On a map without rain, switches on the reflection pass (with its depth) and the reflection fallback, like a rain map (about +0.3 ms and +5 draw calls on chapada). Free on a map that already rains. |
| Caveat | If the map's scenery lays its own surfaces over the road in the wet zones, those surfaces do not read the wetness and nothing shows. Leave the road visible in wet zones, or give that look to the scenery's own surfaces. |

```js
surf: { zones: [[14, 19, 'damp', 0.5]] },
th: { wetVisible: 1 }
```

### `th.reflectionWater`: standing water

`th: { reflectionWater: 1 }` (or a strength). The screen reflections follow what still water really returns: 2 % seen from above, a mirror at grazing angle (Schlick), and the reflection replaces the surface's colour instead of being added to it. Near the car one sees into the water, far away it mirrors the scenery. For a map with a real sheet of water (`autoroute`); wet asphalt keeps the default. A scenery surface joins the reflection pass by leaving 0.5 in the target's alpha (see the water material in `scenery-autoroute.js`). Cost: none beyond the reflection pass.

### `th.gloss`: road shine

Road gloss (sun and luminaire reflection). Default 0.08 (0.2 under rain). Lower values mean less sun reflection (chapada: 0.02).

### `M.wide`: width, wider or narrower than `W`

`M.wide = [[a, b, w], ...]` sets the half-width `w` between track points a and b, blended over 60 m on each side; elsewhere `W`. A half-width below `W` narrows the track between the two points.

```js
{ id: 'plage', W: 8, tun: [26, 34], wide: [[27, 33, 5]] }   // 10 m walkway in the cenote cave
```

Use a value below `W` only under a free-form tunnel (see "Tunnel and hall"), where the engine floor follows `s.w`: in the open, the road ribbon and the engine's guardrails stay at `W` and the scenery would have to cover the extra strip. Check with `node tests/test-maps.js` (autopilot lap, 0 crashes).

### `M.obst`: solid boxes on the drivable ground

`M.obst = [[x, z, halfWidth, halfLength, ry, y, ...], ...]` (map metres, like `pts`) declares solid boxes the cars collide with: wrecks, rubble, trees, piers, whole city blocks. `ry` turns the box like a three.js `rotation.y`. `y` is the altitude of its foot: give it where the track passes over or under itself, the box then only counts for the samples within 4 m of that altitude. Entries may carry more values after `y` (autoroute stores the name of what stands there and its height: its scenery builds each thing inside its box). Read in `src/engine/sim.js`: `buildTrack` files the boxes per sample (`T.obst`), `step()` pushes a car's two circles out of them like the piers of `M.place`, and the autopilot's path keeps 2.1 m clear of them, in the gap nearest the axis of the road. `?hitbox` draws them. A map without `M.obst` is untouched.

With boxes, the road's own walls (`W`, `M.wide`) can lie behind the scenery: on autoroute the streets are 24 m wide either side of the axis and every facade, closed street and wreck is a box, so the car only ever stops against something it sees. `tests/test-maps.js` checks it (random drivers never touch the road's wall outside the deck, the tube and the cave).

### `th.chev`, `th.chevTex`, `th.chevExcept`, `th.chevK`: corner chevrons

- `th.chev: 1` places chevrons on the outside of corners, every 12 m once the radius is under 167 m.
- `th.chevTex`: catalogue texture used instead of `chevron` (yellow and black). Receives the same setting (0 or 1: the direction). Example: `chevronGES`, red on white.
- `th.chevExcept: [[a, b], ...]`: no chevrons between track points a and b, for a passage the scenery already guides.
- `th.chevK`: curvature threshold above which a chevron is placed. Default 0.006 (radius 167 m); 0.02 keeps signs only in corners under 50 m radius.

```js
th: { chev: 1, chevTex: 'chevronGES', chevExcept: [[27, 33]], chevK: 0.02 }
```

### `th.withoutCones` / `th.cones`: no cones at corner entries

`th.withoutCones: 1` (or `th.cones: 0`): the engine places no cones or bins at corner entries. Default: cones placed (`th.nObjects`, 14 by default, sets how many).

### `th.startLine[3]`: start gantry shape

`th.startLine: [accent, frame, text, 'startJungle']`: the fourth value names another start-gantry shape (same zones as `startLine`). Default: the steel gantry.

## Tunnel and hall

Free-form tunnel: `th.tun.h`, `vault`, `opn`, `spokes`; width comes from `M.wide`.

```js
{ id: 'cenote', tun: [30, 35], wide: [[30, 35, 16]],     // width: M.wide (walls of the physics in src/engine/sim.js)
  th: { tun: { ...usualTunnel,
    h:     [[0, 9], [0.3, 20], [0.55, 26], [0.8, 16], [1, 9]],  // height under the keystone (m)
    vault: [[0, 1], [0.3, 9], [0.55, 13], [0.8, 7], [1, 1]],    // vault rise (m), 0 = flat ceiling
    opn:   [[0.4, 0.46], [0.56, 0.6]],                          // ceiling openings
    spokes: '#fff0c8',                                          // one light column per opening
  } } }
```

`f` is 0 at the tunnel entrance and 1 at the exit. `h` and `vault` accept a number, keys `[[f, value], ...]` that are interpolated, or a function `(f, s) => value`.

| Option | What it does | Default |
|---|---|---|
| `tun.h` | Height under the keystone (m). | 8 |
| `tun.vault` | Vault rise (m); 0 = flat ceiling. | 0 |
| `tun.opn` | Ceiling openings `[[fa, fb], ...]`. Under an opening: no vault, no hull (you see the sky), no luminaire. | none |
| `tun.spokes` | Colour of an additive light column per opening, leaning toward the sun and reaching the floor, with a luminaire marking its foot. | off |
| `tun.raysK` | Opacity (so brightness) of the light columns. | 0.55 |
| `tun.ambient` | Share of ambient light on floor, walls and vault (the rest comes from luminaires). City walls (`th.alarm`) keep 0.85. | 0.55 (`TUN_AMB`) |
| `tun.day` | Share of sun and sky kept when the car is in the tunnel (1 = nothing goes dark). For an open cave whose scenery makes the rock (`without: ['faces']`): the outside seen through porches and shafts, trees and wood stay lit. Without it, anything not self-lit goes black in the tunnel. | 0 |
| `tun.without` | What the engine does not place: `'portals'` (both portals), `'fixtures'` (fixture and emergency housings; the lights stay), `'lightSet'` (no fixture light at all: only the daylight of the openings remains), `'faces'` (free-form tunnel only: no walls, vault or hull; floor, lights, black and light columns remain, and the map's scenery makes the hall). | none |
| `tun.skyDay: 1` | Under the tunnel the sky keeps its colour instead of taking the tunnel fog colour: daylight shows through the exit mouth and openings. | off |
| `tun.gloss` | Tunnel floor shine. | 0.3 |
| `tun.tex` | Textures of walls and vault, in place of `wallFace` and `ceiling` (they receive the same arguments, free to ignore them): `['rockCave', 'rockCave']`. | `wallFace`, `ceiling` |
| `tun.shard` | Exit glare level; see `th.eye`. | engine value |

Behaviour once `h`, `vault` or `opn` is set:

- Floor, walls, hull and luminaires follow the drivable half-width `s.w` (the walls of `src/engine/sim.js`, given by `M.wide`) instead of `W`.
- The vault is a 10-facet half-ellipse from the springing (`h - vault`) up to the keystone (`h`).
- Portals scale to the width and height of the entrance.
- Collisions: `src/engine/sim.js` already holds the car inside `s.w`; nothing to add.
- Camera: stays under the ceiling when `h` is at least 6 m (the racing camera is about 3.2 m up). The ceiling has no collision: a jump in a low tunnel goes through it.
- The sun stays off throughout the tunnel, shadow included (light comes from the columns and luminaires). There is no dedicated water-floor option: the map's scenery places its own water.
- Cost: a few extra draw passes (the vault is cut into pieces by the openings and each column is one pass). The vault itself is one pass: fixed-scenery merging already fuses each opaque still facet with the other ribbons of its material, per 500 m tile.

### `tick.indoor(i)`: a hall or underground built by the scenery

A map whose hall or underground is scenery (no engine tunnel, `M.tun` null) can still have it treated as indoors: the tick its scenery returns carries `tick.indoor = i => 0..1` (the level at track sample `i`, 1 = an engine tunnel, with its own ramps at the mouths). The engine takes the larger of this level and its own tunnel: sun and sky light fade, the fog slides to `th.tun.fog` (give `th.tun = { fog, skyDay: 1 }` alone: nothing is built without `M.tun`), the eye adapts (`th.eye`), and the sound takes the tunnel reverb and the `AMBZ { tun: 1 }` bed. The light then comes from the `h.emis` lamps of the scenery. Used by area51 (`scenery-area51-vie.js`). Default: none.

### `th.eye`: eye adaptation

`th.eye = { tun, blackM, clair }` (none of the three required). Visible without the `net` capture style only.

| Field | What it does | Default |
|---|---|---|
| `tun` | True tunnel light relative to outside. Closer to 1: the entrance darkens less, the exit dazzles less. | 0.4 |
| `blackM` | Time constant (s) toward dark. | 0.5 |
| `clair` | Time constant (s) toward light. | 0.35 |

A cave exit that is slow to recover daylight: lower `clair`. A hall too dark on entering: raise `tun`.

```js
th: { tun: { ...usualTunnel, raysK: 0.35, ambient: 0.7 },   // quieter columns, lighter vault
      eye: { tun: 0.7, blackM: 0.5, clair: 0.15 } }
```

## Feedback and particles

### `th.graze`: wall-scrape feedback

`th: { graze: 1 }`. When the car scrapes the wall above 15 m/s (the moment `src/engine/sim.js` fills the gauge, `NI.intoWall`), the HUD nitro gauge brightens and the segment being filled turns white, slightly raised, during the scrape and 0.3 s after. Scrape sparks exist on every map regardless. The sim calculation is not touched. Cost: none. At low fill the brightened gauge stays dull.

### `th.seaSpray`: lens spray

`th: { seaSpray: [[a, b, force], ...] }`. Between these track points, drops land on the lens as under rain of that force (spray from a waterfall or river). Reuses the rain's lens drops (final pass): same drops, same wind. 60 m fade at zone entry and exit. Default: off.

### `th.leaves`: dead leaves

`th: { leaves: [[r, g, b], ...] }`. Colours of the dead leaves each car lifts behind it outside water and tunnel (small sharp squares, 260 at most, one draw pass). Requires `th.dust` (it lives in its per-car loop); on a map without dust surfaces, `th.dust` only turns on the water spray of wet zones.

```js
th: { dust: [r, g, b], leaves: [[0.6, 0.4, 0.12], [0.4, 0.24, 0.1]] }
```

### `th.dustBallistic`: grains on parabolas instead of the dust plume

`th: { dust: [r, g, b], dustBallistic: { grav, rate, size, up } }` (lune: no air). Each car throws small opaque grains from its rear wheels; they fly with no drag, fall back, bounce once, lie still a moment and are reused (700 at most, one draw pass). `grav`: their gravity as a share of the map's (0.4); `rate`: grains per second for a followed car at full speed (50), twice as many in a slide, a third for the other cars; `size` in metres (0.2), capped on screen so a grain near the lens stays a grain; `up`: highest launch speed in m/s (3.5). A grain thrown while its car is in the air keeps the car's velocity and gravity: it stays beside the car down a jump. A landing after more than a quarter of a second in the air throws a ring. None in the engine tunnel nor where the scenery's `tick.indoor` is above 0.5. With the option the engine's three soft effects are off for the map: the dust plume, the tyre smoke of a slide and the puff of a landing. Requires `th.dust` (the grains' tint). Default: off.

### `th.vacuum`: no air for the sound

`th: { vacuum: 1 }` (lune). In `src/audio/audio.js`: the wind roar is silent at any speed, and once a car has been in the air for a quarter of a second its engine drops to a murmur until it lands (the tyres are already cut in the air). The engine is otherwise untouched. Default: off.

### `h.emis` returns its luminaire

`const l = h.emis(i, x, y, z, colour, range, strength);` returns the luminaire, and the engine rereads `l.c` (a `THREE.Color`) every frame: a campfire or brazier can flicker with its flame from the scenery's tick. Do not change `l.x`, `l.y`, `l.z`: distance sorting uses them.

### Splash on landing

`c.waterT` (time in water, scenery only) resets when the car is airborne, so landing in a fully flooded zone replays the bow-wave splash. Applies to any map with a jump into a full `damp` zone.

## Pitfalls

- An `InstancedMesh` that does not move is merged into the fixed scenery (a copy of each instance stays at rest). A batch whose instances are moved with `setMatrixAt` must carry `userData.dyn = 1`.
- Draw-pass counts vary by about 30 from one measurement to the next with the same code; do not read them as exact when benchmarking.
