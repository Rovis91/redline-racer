# Art style

Redline Racer looks like a late-1990s console racer: low-poly geometry, nearest-neighbour pixel textures, a low internal resolution, few colours, ordered dithering. Everything is drawn in code (see `docs/ASSET-GENERATION.md`). This page lists the rules a frame must follow and where each one is set.

## The retro pipeline

Set at the top of `src/engine/game.js` ("réglages de la lumière et du rendu rétro"):

| Constant | Value | Effect |
|---|---|---|
| `QUANT` | 32 | colour levels per channel in the final pass (a 15-bit console has 32). 0 = off |
| `WEFT` | 0.8 | strength of the 4x4 Bayer ordered dither applied with the quantisation |
| `SHAKES` | 0 | PS1-style vertex snapping, grid step in pixels. Off by default |
| `FAR` | 1.3 | multiplies every map's fog distances and the shadow range |
| `NL`, `BRIGHT_GAIN`, `BRIGHT_STEP`, `TUN_AMB` | | dynamic lights: count, global strength, tunnel lamp spacing, tunnel ambient |

Resolution (`resize` in `game.js`):
- The HUD, dithering, scanlines and glow work on a **270-line grid** (`HH = 270`). Its width follows the window aspect, clamped to 360 to 960 columns.
- The 3D scene renders at twice that (540 lines, `KL = 2`) into a nearest-filtered target, then the final pass composites it.
- The canvas is upscaled with `image-rendering: pixelated` (`index.html`). Split screen gives each view its own 270-line grid.
- No antialiasing (`antialias: false`). Shadows use `BasicShadowMap`. Colour management is off (`ColorManagement.enabled = false`): every colour in the code is tuned by eye with no sRGB conversion. Don't turn it back on.

Final pass (`post` in `game.js`), in order: radial speed blur (none at the centre, grows with speed), chromatic aberration, glow and light rays (`th.bloom`), darkening under lens drops, quantise + dither, HUD, scanlines (`th.scan`), and a vignette that tightens with speed and nitro.

Textures: `magFilter = Nearest`, `minFilter = NearestMipmapLinear`, maximum anisotropy (`tex()` in `game.js`). Mipmap blending stops banding lines from crawling along the ground. Linear filtering is opt-in per texture (`th.smooth`, `mat(…, { smooth: 1 })`, or `?smooth=1` everywhere). Use it for water and water curtains. Never use it on near rock or walls: they smear and break the pixel look.

## `?style=` variants

`STYLES` in `src/engine/game.js` (around line 46) holds alternative final passes. With no parameter the game renders as above, unchanged. Use these to compare looks; none of them is the shipped style.

| `?style=` | Look |
|---|---|
| `ending` | 540 lines, 64 levels, light dither |
| `net` | scene + HUD at screen resolution, nothing else (not even the vignette). The default of `tools/plan.js` |
| `ink` | flat colour bands + black depth-edge outlines |
| `halftint` | 4-ink halftone dots from the map's `PAL` palette, plus one signal ink for lights |
| `cathodic` | 360 lines, barrel distortion, scanlines, RGB triad mask |
| `console32` | 360 lines, vertex snapping, affine texture warp, 32 levels |
| `piping` | flat colours with light rim on depth edges |

Single ingredients can be added alone or on top of a style: `lignes`, `aa`, `smooth`, `levels`, `weft`, `contour`, `piping`, `shades`, `contrast`, `affine`, `shakes`, `softPuffs`, `halo` (list `ING`). Example: `index.html?map=touge&style=console32&outline=.6`. `PAL` (just below `STYLES`) gives each map 4 inks from dark to light plus a signal ink. It is used only by `halftint`, but it also sums up each map's palette well.

## Maps: time, light, palette

Everything per map lives in its `th` (theme) entry in `src/data/maps.js`:
- `sky`: gradient stops `[t, colour]`. `stars`: star count. `orb`: sun or moon direction, colour and size.
- `fog`, `fogD: [start, end]`: the fog colour should be the horizon colour. `th.haze`: denser fog over a stretch of track. `th.isFar`: keeps far silhouettes drawn beyond the fog.
- `hemi: [sky, ground, k]`, `sun: [colour, k]`, `headlights` (headlights), `bloom`, `scan`.
- `road`, `intoWall`, `tun`: road, wall and tunnel colours. `hud`: HUD style and colours.

| Map (`id`) | Time | Palette, one line |
|---|---|---|
| `ville` | night, rain | violet-black sky, magenta/cyan/yellow neon, dark neutral road with cyan edges |
| `touge` | night | black-green forest, cold moonlight, cream and orange road paint |
| `wangan` | night, heavy rain over the port | deep navy, sodium orange, wet reflections |
| `paris` | 5:30, dawn | slate-blue to peach sky, warm stone, granite paving |
| `canal` | golden hour | purple to orange sky, crowded stands, invented sponsors |
| `stade` | indoor arena, night | near-black, floodlights, packed dirt |
| `givre` | dawn, snow | blue snow, pink-orange horizon, grey packed-snow road |
| `terre` | end of day | ochre earth, pines, pale blue sky |
| `perse` | sunset | Persian-miniature flat colours: red, gold, turquoise, lapis, ivory |
| `barrage` | 6:40, spring morning | grey concrete, overcast blue-grey, Soviet orange accents |
| `chapada` | morning, jungle | deep greens, pinkish quartzite, jade water, gold accents; green-gold fog closes the view at 190 m |
| `plage` | midday | cobalt-to-white sky, white sand, turquoise, pink accents |

Each map also has its own HUD style (`th.hud.style`: `cyber`, `strokeLn`, `signPanel`, `plate`, `blk`, `panelBoard`, `rally`, `givre`). It uses the two pixel fonts in `assets/fonts/` (Press Start 2P, DotGothic16).

Lighting notes:
- Tunnels are painted as seen by an eye already used to the dark. The final pass exposes the image by the eye's adaptation (`vu.eye`, `th.eye`, `th.tun.shard`). Entering and leaving a tunnel is a gradual fade, never a switch.
- Low sun (Paris, Canal): all instanced scenery casts shadows (`inst` in `src/render/scenery.js`, `sun[1] > 0.6`). A low sun stretches shadow texels into staircases, so use `th.shadows: { soft: 1 }`.
- Keep headlights weak at dawn and on snow (`givre` `headlights: 0.35`). A full beam on a white road washes out the track and the ice patches.

## Readability rules

The road comes first: at 150-250 km/h and 270 lines, the player must read the road, the next corner and the walls.

1. **The road stands apart from everything else.** Its tone must differ from the walls, verge and tunnel sides (the `ville` tunnel road was made dark and neutral because it merged with the red walls). Nothing is drawn on the road surface: no decals, no ground textures from nearby buildings overlapping it, no translucent planes over the carriageway.
2. **No periodic stripes or sine lines on large surfaces along the driving direction.** At speed they strobe and read as a "wave" (rule DA-10 in `src/maps/plage/textures-plage.js`, the anti-wave note in `src/maps/chapada/scenery-chapada.js`). Boards and paving joints run across the direction of travel, with uneven widths and tones. The same goes for terrain ridges that follow the mesh grid, and for large shaded flanks in even bands.
3. **Constant slopes.** Road altitude never steps inside a slope. One-metre steps made the camera bob (a comment in `src/data/maps.js`, `barrage` profile).
4. **Square pixels.** Match texture resolution to the surface size so pixels stay roughly square (about 8 px per metre). A 16x128 texture on a 2 m x 16 m strip, not a stretched one (`src/maps/stade/textures-stade.js`).
5. **No flat untextured surfaces** except things that emit light (lamps, neon, signal paint). The road is the reference for detail: grain, joints, wear.
6. **Colours you can tell apart at 32 levels.** Neighbouring surfaces need a clear difference in value, not only in hue: quantisation and fog merge close tones. A dark car livery is lightened toward silver so it reads at night (`livery` in `src/render/textures-cars.js`).
7. **Corner signs only where needed.** The engine places chevrons on tight bends (`th.chev`, `th.chevK`, `th.chevExcept`). Don't line every corner with chevrons or text banners. Never put a sign in front of a wall.

## Scenery rules (from the map methods in `docs/methods/`)

- **Place from the race camera, not from the top view.** Anything the race camera doesn't see costs time and adds nothing.
- **The further away, the bigger.** Fine detail reads only at 0-15 m, volumes at 15-80 m, silhouettes only beyond 80 m, so far objects must be large.
- **The further to the side, the simpler.** In peripheral vision at speed, an object reads by bold shape and contrasting colour. Small details there read as noise.
- **Everything is grounded.** No floating lanterns, buildings, trees, poles or clouds. Every object has a support and a base on the ground.
- **Walls only where scenery justifies them**, checked with `?hitbox` (`src/engine/hitbox.js`).
- **Zones blend.** Ground, palette, light and density change gradually across a zone border. The transition band belongs to the zone before it. Density never jumps from crowded to empty.
- **The far view supports the mood.** It is neither empty and repetitive nor sharp all the way to the horizon. A jungle closes the view with fog.
- **Geology and water make sense**: plausible slopes, water levels below the dam crest, rivers with a visible source and outlet.
- **Match the map's intent and reference sheet.** Write the mood as one phrase ("Indiana Jones jungle adventure", not "jungle"). Every major element gets an anti-reference ("not a European castle").

## What to avoid

- Modern effects: soft bloom haze, depth of field, photoreal materials, smooth gradients on large surfaces. Glow stays small (`bloom` 0.015 to 0.13).
- Linear filtering on near, sharply patterned surfaces.
- Moving patterns that shimmer, such as the heat haze (`chaleur`) or rippling textures. Check them in motion, because still frames hide them.
- Light that flips like a switch at a zone or tunnel exit.
- Trusting automatic image critics. They rated the reworked maps above the finished ones, while the author, playing, judged the opposite. They don't see floating objects, textures on the road or pointless walls. Prevent these by construction.

## Judging a frame

`tools/plan.js` renders one spot of a map in about two seconds (full usage at the top of the file). The track is cut into 20 shots.

```bash
node tools/plan.js touge lapRun            # all 20 shots, two contact sheets (12 views per sheet)
node tools/plan.js touge 14 --before      # before a change
node tools/plan.js touge 14              # after: 14.jpg and 14.duo.jpg (before | after)
node tools/plan.js touge 14 --style=game  # the real game look (270 lines, HUD), not the default "net"
node tools/plan.js touge 14 --burst=6   # 6 frames 1/30 s apart: shimmer and blinking only show in motion
node tools/plan.js touge @516 --view=90,12,4   # inspect an object from an orbit camera
```

- Output goes to `captures/plans/<map>/` (ignored by git).
- The default `net` style is sharp, for judging the scenery. Use `--style=game` for the shipped look, or `--style=<name>` for any `STYLES` entry.
- An object passes only if it is seen and recognised from the race camera at lap speed (`--step=15`). `--view=` checks the model but never proves the player sees it.
- Image critics read contact sheets, never single captures, with one critic per zone and a precise question. Compare before/after duos, not impressions.
- For a lap that depends on racing (damage, lap 3), use `tools/captures.html`. `sh tools/capture.sh <map> "<params>"` runs it without a window.
