# LUNAR OUTPOST

> **Historical version V1.** User feedback on the overly circular layout and the vehicle led to the active V2 (see the `v2/` folder). For future concept art, apply the [closed lunar vehicle rule](ART-DIRECTION.md).

Preproduction for Redline Racer — 17 November 2026.

**A 4.40 km loop that hugs two impact basins, climbs toward an empty horizon and descends to a tiny colony.** Speed and large curves dominate; the relief sets the rhythm. The signature is the reveal of the large eastern basin and the Earth from the high shoulder, before a prolonged descent. The physics stays that of the game. The architecture evokes industrial space installations imagined in the 1970s–1980s.

## Deliverables and status

- [Large board: map on the left, moodboard on the right](planche-lunar-outpost.png), 4,420 × 2,890 px; [SVG version](planche-lunar-outpost.svg) for enlargement.
- [Territorial plan](plan-territorial.png): identical X and Y scale, metric coordinates, 250 m bar, sectors and clockwise arrows.
- [Altitude profile](profil-altimetrique.png): **design indicative**, computed on the same centreline as the plan. It is neither a lunar survey nor a measurement of a map integrated into the game.
- [Geometry and measurements](geometry.json), [centreline sampled every 2 m](centreline.csv), [drawing generator](build_board.py).
- [Game analysis](racing-analysis.md), [World Design / Environment Art and assets memo](world-art.md), [independent skeptical review](SKEPTICAL-REVIEW.md).

The file is a first-mock-up proposal. No gameplay file is modified. Dimensions are verified in this design geometry; driving, collisions, camera views and AI remain to be tested in a playable mock-up. Local sources read at commit `9aaa47b`, with the design guide present in the workspace.

## 1. Territory before the road

Fictional local frame: X toward the east, Y toward the north; altitudes relative to a project zero, with start deck at +18 m. The site is not associated with any real lunar location. The depressions are faceted basins and rims; not holed mountains surrounded by uniform vertical cliffs.

| Mass | Centre X / Y | Rim diameter | Indicative levels | Role |
|---|---:|---:|---|---|
| Western basin | −501 / +96 m | 551 m | Floor −32 m; rim rising to +50 m in the north | First large arc, base on the southern shoulder |
| Large eastern basin | +496 / +32 m | 818 m | Floor −75 m; north rim to +65 m, lower in the south | Dominant landmark, large interior void and long descent |
| Small satellite impact | −64 / −266 m | 266 m | Floor −10 m; rim to +22 m | Justifies the return inflection and undulation |
| Saddle and link shoulder | between the north rims | About 600 m of route | Road from +48 to about +67 m then descent | Change of direction and main reveal |
| Plain and base | south / south-west | Compact placement | Road between about +12 and +25 m | Breathing space, garage, habitat, logistics loop |

The drawn contour lines are a **proposed territory model**. The floor and rim levels are drawing parameters, not precise measurements of the cumulative relief field. The rims lower toward the south; the road follows now the rim, now its outer shoulder, and does not plunge to the basin floors. A prepared 30 m-wide ledge carries the roadway and its margins. Its cut/fill connections extend over about 55 m on either side; local retaining walls on the basin side. This earthwork footprint is not a drivable width. The road profile takes precedence over the schematic relief in the future mock-up.

**Why a loop?** A service road links the habitat, a western relay, an eastern science station and the garage. The loop lets maintenance convoys return without a U-turn; it skirts the basin floors and their walls. The dotted grey paths are off-race service roads, with side accesses closed during the event; they do not become shortcuts.

The large crater is the main landmark. Three secondary landmarks suffice: dome, small relay, gallery portal. The Earth is a fixed celestial landmark, proposed to the east/south-east and about 18° above the horizon: do not make it follow the camera. The exact alignment of the reveal remains to be framed in driving view.

## 2. Layout and driving

| Parameter | Decision |
|---|---|
| Horizontal distance | **4,400 m** |
| Length along the profile | **4,402.6 m** |
| Direction | Clockwise: base → west → north crest → east → south plain → base |
| Drivable width | 18 m; 22 m at the start and its approach, progressive transitions |
| Radii | Measured minimum about **140 m**, no hairpin; large variable arcs |
| Relief | About +12 to +67 m; maximum climb **+6.61%**, maximum descent **−5.70%** |
| Ground | Anthracite industrial surface; normal dry grip of the game |
| Tunnel | Chainage 3,930–4,110 m: **180 m** gallery, usable width 18 m, clear height 8 m |
| Crossings | No crossing of the centreline, no overlapping road passage |

The ribbon is a periodic cubic design spline, with continuous position, tangent and curvature at closure. The profile is also periodic and smooth. The engine geometry uses a centripetal Catmull–Rom: a future conversion must preserve the sampled centreline and re-measure the result, rather than copy a few points assuming the layout is identical.

### The five sectors

| Zone / chainage | Relief and sequence | Intent at the wheel | Reading and installation |
|---|---|---|---|
| **01 Lunar base · 0–500 m** (500 m) | Start in a very open curve, sweep toward the north-west, start of the western rim; +18 → about +25 m | Acceleration and placement; overtaking on the wide deck; optional drift in the tightening curve | Ivory dome set back, grouped modules, outer beacons. The next arc appears before leaving the installations |
| **02 Western crater · 500–1,450 m** (950 m) | Long right arc on the western then northern shoulder; progressive left transition toward the saddle; +25 → +48 m | Prolonged load, possible drift on the tightened part, clean exit then re-acceleration; no hairpin braking | Basin on the right, continuous barrier on the void side. Relay outside the basin. Chevrons announce the inflection before the end of the arc |
| **03 Link crest · 1,450–2,050 m** (600 m) | Left curve that opens, then progressive return to the right; climb to the rounded summit, then change of slope; +48 → summit ~+67 → +64 m | Climb while keeping momentum, reduce the drift angle before the crest; nitro at the exit when the line is readable | Prepared shoulder, no rock in the view cone. Chevrons visible before the summit; Earth/eastern basin reveal. The right curve is committed before the summit, not hidden behind it |
| **04 Large eastern crater · 2,050–3,300 m** (1,250 m) | Large right arc of variable radius, continuous descent on the ledge of the north then east and south rim; ~+64 → +14 m | High speed, line modulation; drift by choice, then acceleration on the southern opening. Several lines possible over 18 m | Longest empty portion. Road and barrier stand out against the dark ground. Small outer science station, no giant antenna or decor on the apex |
| **05 Plain and pressurised tunnel · 3,300–4,400 m** (1,100 m) | Wide S around the small impact; bump at ~3,550 m, dip at ~3,820 m; gallery in a gentle curve, progressive return to the start | Re-acceleration, one readable undulation, a more marked change of loading than the large arc; overtaking on the plain. Airlock exit prepares the next lap's acceleration | Garage, parked rover and conduits off-track; ribbed-rhythm gallery; return of the dome after the exit |

**Variety:** large right loads around the two impacts, link left in the north, return inflections in the south. The six measured curvature sign changes correspond to the spline's inflections, not to six tight corners. The two relief experiences are the climb/link summit and the low return undulation. The eastern descent extends the rhythm instead of adding a succession of bumps.

**Nitro and overtaking:** reserve clear-reading windows on the start (0–250 m), the link opening after the reveal (~1,900–2,100 m) and the return (~3,250–3,550 m). These are placement intentions, not guaranteed times. Do not impose a continuous drift over the 1,250 m of the eastern basin: speed and line precision are the dominant reward.

## 3. Road, relief and readability

- Roadway `#303640` distinct from regolith `#777F8C`; ivory kerb `#E7E2D0`, occasional orange `#D68A42`. The colours of the five sectors appear only in the file.
- Beacons about every 25 m, tightened to 12.5 m at slope changes and portals. Chevrons before inflections; final placement tuned from the camera and at game speed.
- Prepared shoulder of at least 2 m beyond the drivable width, with no objects; wider supporting terrain beneath this platform. Continuous barrier on the basin side, proposed visual height 0.8 m, without hiding the exit.
- Transition from 22 to 18 m over 80 m, and reopening over 80 m before the deck. No abrupt narrowing or furniture in the line.
- Proposed banking zero in this first mock-up. The longitudinal relief suffices; no drivable walls or arbitrary banked corner.
- Horizon visible at exits. Keep at least 120 m of look-ahead as a composition target at crests; this distance must be verified in driving view, it is not established by the 2D map.
- Sharp shadows, moderate artistic fill, readable kerbs in shadow. No lunar fog or volumetric halos. The greyscale test will be done on the mock-up, not deduced from the hexadecimal colours alone.

**Pressurised tunnel:** logistics installation normally pressurisable. During the race, depressurised road gallery, two doors immobilised open and side habitat airlock closed. The ribs stay outside the 18 × 8 m gauge. No force field, no timed door opening; the exit is lit without a white screen. The moodboard perspective is stylistic: the metric plan fixes the real radius of the gallery.

**Physics:** keep the existing driving, nitro and gravity settings; no forced jump and no "lunar" grip. Slope already acts on speed in the engine. The arcade convention keeps the engine sound; the base does not require a spacesuit life simulation.

## 4. Moodboard and art direction

Eight original images generated with the built-in **imagegen** tool, using local game captures as style references. They are neither captures of the future track nor historical photographic references. The [exact prompt](imagegen-prompt.txt) is kept. Order: left then right, line by line.

| Image | What I keep | What I do not borrow |
|---|---|---|
| 1 · Signature curve | Camera behind an angular car, open arc, Earth and bare ground | Proximity to the void without shoulder or protection |
| 2 · Basins | Two impact sizes, large faceted mineral planes | Small relief accidents to transfer onto the drivable surface |
| 3 · Habitat | Ivory triangulated dome, short modules, orange painted bands | A continuous base around the whole track |
| 4 · Crest | Beacons visible before the summit, long slope change | A blind summit imposing a late change of direction |
| 5 · Gallery | Octagonal ribs, sober interior light, readable portal | The illustrated scale or radius as contractual dimensions; moving airlocks |
| 6 · Rover | Six-wheel silhouette, small garage, simple conduits | The rover on the road; illustrated proportions replace the asset table dimensions |
| 7 · Solar and relay | Common inclined tables, energy in a compact island | The gigantism of Area 51's antennas |
| 8 · Kerb | Road/ground contrast, ivory barrier, orange beacon | Repetition of small details invisible at race speed |

Six-colour palette: space black `#070B13`, regolith `#777F8C`, road `#303640`, ivory `#E7E2D0`, technical blue `#547F9E`, orange `#D68A42`. **Isolation, momentum, mineral, analogue, horizon.**

Sun proposed to the south-west, elevation ~25°, no weather or atmosphere. Sharp shadows, no realistic metallic shine. Density: at least 70% of the visible territory left empty as an artistic intention; habitat concentrated, single relay, single station, no systematic alignment of buildings along the road. Materials: regolith, granular surface, painted metal, dark glass and rubber. Coarse textures, 8–12-sided cylinders, simplified distances. Analogue radio and spaced synths; game vibrations and engine, no wind or flapping flag.

**Three prohibitions:** smooth photorealistic science fiction; saturating the terrain with objects; roadway unreadable against the grey or hidden by black shadows.

## 5. Assets to build first

Indicative standard: 4.5 m car. The detail of the silhouettes and their roles is in [world-art.md](world-art.md).

| Family | Indicative dimension | Sector | Priority |
|---|---|---|---|
| Craters, rims and ledges | Ø 551 / 818 / 266 m; shoulders matched to the profile | Whole territory | Essential hero |
| Faceted dome | Ø 60 m, height 22 m (~13 car diameters) | 01 | Essential structure |
| Modules and connectors | 12 × 6 × 6 m; pedestrian conduits Ø 3 m | 01, 05 | Essential modular family |
| Octagonal gallery and airlock | 180 m; usable passage 18 × 8 m | 05 | Essential structure |
| Road kit, retaining walls, beacons | Barriers in 6 m modules; beacons 1.2 m | All | Essential modular family |
| Solar panels | Tables 8 × 4 m, compact field near the base | 01 | Essential structure |
| Antenna | Dish Ø 12 m; mast 18 m | 02 | Secondary landmark |
| Cargo rover | 5 × 3 × 2.7 m, six wheels; garage pocket | 05 | Secondary accent |

## 6. Originality and evidence

The study of the [public Redline Racer project](https://github.com/Rovis91/redline-racer), its local sources and the 12-track overview image confirms the twelve existing ambiences. Lunar Outpost keeps their arcade readability and pixelated low-poly. The map-by-map comparison is documented in the two analysis memos.

Major differences: unlike Tōge, the rhythm rests on large loads and not switchbacks; unlike WAN-9, speed follows natural rims rather than a motorway; unlike Nuit Blanche, the grey evokes neither snow nor ice; unlike Barrage and Chapada, the large volumes stay bare, with no forest or monumental structure.

Area 51 is not one of the twelve implemented maps: it is a proposal from the guide. Its direction of long straights, hangars and large antennas is replaced here by arcs dictated by the impacts, a small colony and the dominant eastern basin. A thumbnail of the layout remains organic even without the space assets.

**Verified numerically:** closure of the centreline at machine precision, absence of self-intersection of the centreline and of the edges of a 22 m envelope, distances, slope extrema and minimum radius. The measurements come from the same generating drawing; the CSV and the parameters allow independent verification. The sectors cover the lap exactly with no gap or overlap, the tunnel is an interval of this centreline.

**Not proven by these checks:** fun at the wheel, 3D visibility from the camera, nitro balance, decor collisions, opponent behaviour, detailed junctions of the service paths. The guide reserves these points for the mock-up; no in-game validation is claimed.

## 7. Three arbitrations for the mock-up

1. Check the link summit from the camera: preserve the announcement of the right curve and frame Earth/basin without moving the sky over the lap.
2. Tune the terraces, retaining walls and technical accesses from the dimensioned ribbon, in particular the outer relay, the science station and the garage/base link.
3. Choose the existing reference car and try a normal/nitro lap then with opponents; possibly adjust the local width, without touching the shared physics.

Detailed modelling, new mechanics, a dedicated car and exhaustive asset production remain out of scope. The file provides the decisions needed to first build a mock-up in simple volumes.
