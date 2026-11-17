# VOLCANIC ISLAND — the great black cornice

Proposal of 17 November 2026, following `docs/methods/TRACK-DESIGN.md`. Preproduction: terrain, driving and composition; track not integrated into the game.

## 1. Promise

Leave a small colourful port, gain height on the black cliffs and go around a volcanic cone before a long plunge toward the Atlantic. A fast loop where you prepare your lines from afar: long uphill curves, a breather on a pass, two more demanding loads in the descent. The signature image is the exit of the second tunnel: ocean on the left, balcony roadway, massive cone on the right. Madeira and Funchal inspire the placements; the cone, the fumaroles and the compact geography belong to a fictional island.

## 2. Territory before decor

- **Sea at 0 m**, around the island. The south shelters a harbour basin protected by a short breakwater; start on the platform at 12 m.
- **West flank**, basaltic cliffs of 40 to 120 m and natural ledges extended by retaining walls. This is the climb, from south to north: no switchbacks to artificially gain height.
- **North shoulder**, two compact radial spurs, crossed by T1 then T2. The road serves the old observation post and the villages on the other slope. Two short tunnels avoid tight detours at the edge of the void.
- **North-east pass**, maximum road altitude 194 m, PK 2,850. The summit of the cone, at 620 m, stays inside the loop: you drive neither in the crater nor on its summit.
- **East valley**, a wide hollow open to the south-east, with two inhabited terraces at about 145 and 65 m. The road descends continuously on its flank; secondary streets stay off-route.
- **South ledge**, cushioned descent to 12 m at PK 4,450, then flat return to the port. No bridge, no branch, no overlapping road levels.

The flat tints of the plan are conceptual masses, not a digital terrain model. Reserve a platform of at least 18 m: 14 m drivable and 2 m margin on each side. The cliffs must never cut this platform; fill or support the ledge under the road. The outer sea cliff and the inner embankment are two distinct surfaces.

## 3. Reference geometry

| Measure | Computed proposal |
|---|---:|
| Horizontal length | 4,800 m |
| Spatial length, relief included | 4,819 m |
| Direction | Clockwise; start heading west |
| Road altitudes | 12 to 194 m |
| Cumulative elevation | +182 / −182 m |
| Extreme slopes | +10.69% / −15.29% |
| Minimum horizontal radius | 142.18 m, PK 3,374 |
| Drivable width | 14 m, constant, tunnels included |
| Loop footprint | 1,568 × 1,387 m |
| Closure | Identical position; periodic tangent; zero slope at the junction |

The centreline is a periodic cubic spline in plan; its length is brought to 4,800 m. Altitude is a monotone PCHIP as a function of horizontal chainage. `definition.json` defines the curve, `trace.csv` samples it every 2 m, `verification.json` contains the measurements. Plan and profile are produced from this single definition. PKs denote **horizontal** distances, not metres travelled along the slope.

Closure of the centreline, absence of self-intersection and validity of a 14 m ribbon are checked in plan. The slope is continuous; the vertical curvature may change at the PCHIP keys. This check does not yet validate the camera, grip or visibility in a built 3D terrain.

Future conversion: East → engine x, altitude → y, North → −z. The current engine uses a centripetal Catmull-Rom (`src/engine/sim.js`): a conversion will need to be re-measured. This preproduction data is not a patch ready to inject into `maps.js`.

## 4. Six sectors, one lap

| Sector / horizontal PK | Relief and driving | World and transition |
|---|---|---|
| **1. Volcanic port · 0–550 m** | 12→14.8 m. Almost straight start, wide progressive right. Acceleration and overtaking; nitro 0–350 m if the line is free. | Working quay, ochre/coral houses, sea on the left. Buildings stop before the first cliff. |
| **2. Basalt cliffs · 550–1,400 m** | 14.8→79.2 m. Large continuous right load, increasingly noticeable climb. Moderate drift on the open part; no hairpin braking. | Black columns and long strata, low guardrail, clear sea horizon. The ledge climbs toward the first spur. |
| **3. Volcano climb · 1,400–2,500 m** | 79.2→183.1 m. Large right curves, two tunnels; priority to precision and reading the exits. Re-acceleration over the 380 m in the open between T1 and T2. | Bare rock, two cut spurs, sparse vegetation. T2 frames the reveal of the cone. |
| **4. Volcanic crest · 2,500–3,050 m** | 183.1→194→182.5 m. Pass at PK 2,850, very open curve. Lift off and prepare the descent; no deliberate jump. | Mineral shoulder, cooled lava field, a few fumaroles set back; Atlantic in the distance. |
| **5. Village descent · 3,050–4,250 m** | 182.5→25.3 m. Right at R142 m at PK3,374, left counter-curve then right toward PK3,960 at R164 m. Brake before the load, hold the drift, re-accelerate after the visible exit. | Open hollow, two small groups of houses off the line, basalt terraces. Road to the port perceptible from clear windows, never through the massif. |
| **6. Coastal return · 4,250–4,800 m** | 25.3→12 m, flat from PK4,450. Right curve that opens and tangent junction to the start. Nitro possible over the last 350 m. | Sea on the left, old solidified black flow, breakwater and port as return landmarks. |

No hairpin: changes of direction spread their angles over long arcs. Speeds and lap times are not announced as validated; the game's braking and real drift capacity will set the final rhythm.

## 5. Tunnels and road readability

| Passage | Dimensions and justification |
|---|---|
| **T1 · PK1,600–1,800** | 200 m horizontal; altitude 100→120.3 m; R≈745–749 m. Pierces the north-west spur, between two ledges at the same slope progression. |
| **T2 · PK2,180–2,320** | 140 m horizontal; altitude 157.3→169.2 m; R≈766–857 m. Pierces the second spur in the north; the exit leads to the shoulder, 530 m before the road summit. |

For both: 14 m roadway, two side strips of 1 m, 7 m clear height. Plan 15–30 m of rock cover in the body of the spur, decreasing toward the portals; no portal set like an isolated arch. Walls light in places, continuous marking, exit without blinding white effect. Target visibility ≥120 m in the tubes, to be checked with their curvature and the real walls. No sudden braking within 120 m after an exit.

Descent: announce the two right loads at least 150 m ahead, aim for 180 m of view over the roadway. For a radius of 142 m, this implies about 28 m of inner clearance at the sight-line chord: reserve **30 m from the centreline** in the sectors concerned, hence lowered embankments and set-back houses. A simple 5 m strip would not suffice. The 14 m drivable width stays constant, with no furniture in the drift margin. Guardrails continue into the next junction; no kerb indicates a false exit toward the sea.

At the pass, preserve the view of the next load with a spread-out summit and upstream signage. Do not place fumaroles in front of the road. The −15.29% is accepted as an arcade accent in a wide descent; its camera/physics compatibility remains a mock-up test.

## 6. Moodboard and art direction

`moodboard.png` contains six **generated intentions**, not captures of the playable track. Built-in imagegen, style references from the repository; prompt kept in `PROMPT_IMAGEGEN.md`. The map is computed independently of the images. The windings in the thumbnails are driving intentions, not the contractual geometry.

| Commented reference | What I keep | What I do not borrow |
|---|---|---|
| Thumbnail 1, port | Simple volumes, colours concentrated on the buildings, basalt quay | A continuous urban front over the whole lap |
| Thumbnail 2, cliff | Dominant basalt, open road, sea on the left | Walls biting into the visibility cone |
| Thumbnail 3, tunnel | Portal cut into a mass, exit contrast | A blinding exit or a naturally empty tunnel |
| Thumbnail 4, crest | Dark cone, red-brown scoria, localised steam | Lava rivers or fumaroles on the road |
| Thumbnail 5, valley | Visible descent, houses as altitude landmarks | Copying its curves at the expense of the metric plan |
| Thumbnail 6, coast | Roadway continuity to the port | A ribbon laid directly on the water |
| The 12-track overview image | Car silhouettes, readable road and kerbs | The neon palettes of the night maps |
| Console-style Karasu-Tōge capture | Big pixels, angular geometry, few details | Dark forest and succession of switchbacks |
| Chapada gameplay capture (plateau view) | Car/roadway scale and landscape layers | Canopy, ruins and vegetation as the main subject |

**Palette:** basalt #34373D, Atlantic #194B72, asphalt #555A60, cream #E8D9AC, terracotta #B75D43, dark green #435A44, coral #D88D72. Faceted shapes; proposed textures of 64–128 px, nearest filtering, readable silhouettes. Retro PS1/Saturn rendering, with no PBR materials or photorealistic details.

**Light:** clear afternoon, south-west sun high enough to light the road; simple shadows, muted blue sky, haze only at the horizon. **Density:** rock/ocean dominant; low, spot vegetation around the villages, no vegetation canopy. The port and villages total a small fraction of the route; no monumental city. **Five words:** mineral, maritime, vertiginous, fluid, inhabited. **Sounds:** swell at the port, wind on the cornice, brief tunnel echo, breath of the fumaroles; discreet gulls and pennants.

**Three prohibitions:** jungle or dominant green mountain; omnipresent lava; glossy/photorealistic modern rendering.

## 7. Priority assets

Reference car: about 4.5 m long, to be adjusted to the game's model.

| Asset / priority | Indicative silhouette and dimensions | Zone / function |
|---|---|---|
| Volcanic cone — essential, hero | Faceted massif, summit 620 m, visual base ≈800 m | Loop interior; dominant landmark |
| Basalt cliffs — essential, modular | Faces 20–60 m wide, columns 5–25 m, escarpments 40–120 m | 2–4; scale and verticality |
| Port and breakwater — essential, structure | Basin ≈180×90 m; low quays and breakwater ≈140 m | 1/6; destination and closing of the lap |
| Tunnel kit — essential, structure | Two tubes 200/140 m, opening 16×7 m | 3; cross two spurs, pace the climb |
| Coloured houses — essential, modular | Footprints 6×8 to 10×12 m, one/two storeys, simple roofs | 1/5/6; human landmarks without race alleys |
| Ledges and protections — essential, modular | Retaining walls 3–15 m; guardrails ≈1 m; shoulders 2 m | Cornices; explain the road support |
| Scoria and fumaroles — essential, accent | Rocks 0.5–5 m; steam in small animated planes off-track | 4; sole geothermal passage, no liquid lava |
| Subtropical vegetation — secondary, modular | Banana trees 2–4 m, low shrubs, a few palms 6–9 m | Villages only; limited contrast |
| Port life — secondary, accent | Boats 5–8 m, pots and pennants grouped | 1/6; local activity and wind |

## 8. Differentiation and review

**Aegean Cliffs:** the local concept has a counter-clockwise loop, a hairpin of about 48 m, a white silhouette and no tunnel. Volcanic adopts the clockwise direction, a minimum radius of 142 m, two tunnels and an off-track volcano as hero; spot villages, dark rock and Atlantic dominant. The architecture accompanies the road instead of constituting it.

**Karasu-Tōge:** replace the forest switchbacks and their repeated braking with a climb in a large arc and an open descending S. **Chapada:** remove canopy, temples, fords and dominant waterfalls; reserve green for inhabited places. The code and captures of the [Redline Racer repository](https://github.com/Rovis91/redline-racer) served as driving and rendering references.

The independent review is in `SKEPTICAL-REVIEW.md`. Correction made: the two anchors of the east slope were moved to raise the minimum radius from 95 to 142 m; the spurs were drawn and the labels moved. The figures in the delivered files are those of the corrected version.

**Three open points for the mock-up:** 1) braking/drift and camera on the pass then the descent; 2) 3D terrain, retaining walls and real tunnel cover; 3) visibility of curves and exits with several cars. No detailed asset production before validation of these volumes.

## Deliverables and reproduction

Open `VOLCANIC_ISLAND-board.png` for the complete proposal; `plan-technique.svg` and `profReport-altimetrique.svg` are the separate diagrams. `definition.json`, `trace.csv` and `verification.json` carry the shared data. The Python scripts in this folder do not modify the game. Reproduction: Python with numpy/scipy/shapely/matplotlib, then `construire_plan.py` and `assembler_sheet.py`.
