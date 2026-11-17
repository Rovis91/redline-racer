# LUNAR OUTPOST — World Design / Environment Art

Preproduction memo, 16 November 2026. Proposed dimensions, not surveyed from a playable map. Reading standard: 4.5 m-long car, used here as a drawing convention.

## Territory before objects

Two impacts structure the territory: a smaller western basin, a dominant eastern basin. The rims are eroded and irregular; the roads occupy their graded shoulders, never an edge impossible to widen. The north crest is a saddle between the two ejecta rims. The base sits on a stable plateau in the south-west; the return plain stays in the south. A small satellite impact can explain a single bypass undulation, without turning every metre into an obstacle.

The loop is a maintenance road linking the habitat, a relay on the western rim, the eastern instruments and the garage. It avoids loose floors and steep walls. On balcony sections, a ledge cut into the slope, lower embankment and small retaining wall say how the road holds. Reserve at least 70% of the visible territory for empty ground and relief; this percentage is a composition intention, not a current measurement.

The return tunnel is a **pressurisable** logistics gallery, linked to the garage by a sealed side branch. During the race, its road volume is depressurised, its two airlocks are immobilised open, the inhabited branch is closed. No stop, no moving door on the line. The zone name "pressurised tunnel" describes the usual installation, not the state of the volume during the race.

## Eight asset families

| Asset | Silhouette and indicative dimension | Size / 4.5 m car | Placement and function | Priority |
|---|---|---|---|---|
| Craters and graded shoulders | Two faceted basins; final dimensions in the plan, discontinuous rims and walls without artificial stairs | Several tens to hundreds of cars | West and east; the large basin is the dominant landmark, its depth reads from the edge | Essential |
| Habitat dome | Polygonal dome Ø 60 m, high 22 m; opaque base, glazing in a few large panels | 13 lengths in diameter | South-west base; return landmark, small base against the territory | Essential |
| Cylindrical modules | Sections 12 × 6 × 6 m, 8 sides, short feet, orange bands and painted numbers | 2.7 lengths per section | Base, garage and one isolated science station; 4–6 units grouped, not a housing estate | Essential |
| Relay antenna | Polygonal dish Ø 12 m on 18 m mast | 4 lengths in height | West, set back from the roadside; secondary landmark, never a giant antenna competing with the basin | Secondary |
| Solar field | Tables 8 × 4 m, common inclination, midnight-blue blocks | 1.8 lengths per table | Plateau near the base, outside the dome's permanent shadow; a single compact group | Essential |
| Rover and cargo cart | Rover 5 × 3 × 2.7 m, 6 octagonal wheels; low trailer | 1.1 length | Garage, maintenance pocket away from the roadway; human scale and activity | Secondary |
| Gallery, airlocks and links | Road gallery: usable width 18 m, clear height 8 m; length set by the plan. Airlocks with octagonal rings. Separate Ø 3 m pedestrian conduits | 4 lengths of usable width | South return; closed/open contrast, readable ribs, doors outside the car and camera gauge | Essential |
| Lunar road kit | Ledge 2 m beyond the drivable width; low off-white kerb; beacons 1.2 m, barrier modules 6 m | Beacon ≈ 0.27 length | Whole loop, continuous barrier on the basin side, regular marking; no furniture in the drift clearance | Essential |

The Earth is a fixed sky landmark, not a ninth terrain object. The main reveal must align Earth and the eastern basin from the crest. Choose a single coherent celestial direction over the whole lap.

## Art mini-bible

- **Shapes:** 8–12 sides for cylinders and dishes, faceted dome, large triangulated terrain planes; no micro-greebles. The architecture evokes 1970–1980 industrial space models, with rectangular portholes, mechanical feet, boxes and large joints.
- **Materials:** cold grey regolith, anthracite road surface, ivory painted metal, midnight-blue panels, almost-black rubber. Wear by pixelated stains and deposited dust, never abundant rust.
- **Palette:** space black `#070B13`, ground `#777F8C`, road `#303640`, ivory `#E7E2D0`, technical blue `#547F9E`, signal orange `#D68A42`. Continuous cyan and neon magenta are excluded.
- **Texture:** take as a starting point the existing standard `src/render/textures.js`: 8 pixels/m, 64-pixel tiles over 8 m. Surface joints reinforce motion; ground pixels stay calmer than the roadway. Final density is for the mock-up.
- **Light:** low sun but high enough to read the bottom of the hollows; sharp shadows, moderate artistic fill light to keep road contrast. No terrestrial atmospheric fog. Small ivory lamps at the airlocks, orange markers at slope changes.
- **Three distances:** near = kerbs and beacons; medium = one spot infrastructure; far = silhouette of the craters and Earth. The decor must not compete with the corner exit.
- **Sound / movement:** synthetic analogue radio, engine noise maintained per arcade conventions, chassis vibrations; a few slow indicator lights. No wind, vegetation, flapping flag or convective smoke. The sound choices are stylised, not a simulation of the vacuum.
- **Three prohibitions:** smooth photorealistic futuristic space station; terrain covered in buildings; indistinguishable grey road or black shadow hiding a slope break.

## Position against the twelve observed tracks

The local 12-track overview image shows the twelve maps, and `src/maps` confirms their identifiers. Lunar Outpost keeps the simple volumes, visible textures, bold colours and readable road of this reference.

| Existing reference | What distinguishes Lunar Outpost |
|---|---|
| Ville / Redline Racer | Mineral void and low density, with no facades or neon corridors |
| Karasu-Tōge | Extended arcs on rims, with no forest or repeated switchbacks |
| WAN-9 | Speed produced by relief curves, with no rectilinear motorway or traffic |
| Premier Métro | Compact, isolated placement, with no urban mesh |
| Canal 6 | Natural basin edge, with no repeated drivable walls or crowd |
| Grand Vacarme | Open horizon and visual silence, with no enclosure or stands |
| Nuit Blanche | Grey mineral and black sky, with no snow or bluish atmospheric ambience |
| Spéciale des Ocres | Contrasting graded track, with no terrestrial dust or large ochre plains |
| Perse | Rare utilitarian architecture, with no bazaar or tight monumental sequences |
| Barrage | Natural dominant crater, with no dam structure or wooded valley |
| Chapada | Reveal by bare relief, with no canopy, waterfalls or ruins |
| Plage | Monochrome isolation and sharp shadows, with no festive coast or vegetation |

**Area 51 is not one of these twelve tracks**: it is a concept from the guide. The differentiation rests on its documented promise (test strip, hangars, long straights): here, the impacts dictate the arcs, the antennas stay subordinate and the colony occupies a small part of the landscape.

## Review vigilance points

1. The road profile must follow the basin shoulders, not enter a flank without an explicit terrace.
2. Open airlocks cannot claim to keep an atmosphere in the road gallery; isolate the side inhabited volumes.
3. The sector colours of the plan are document conventions, not five roadway colours in the game.
4. Displayed km/h are not a geometric unit: `maps.js` documents a `kmh` factor that adjusts the speedometer. Size on the layout's metres.

Sources consulted: local guide; README; local board of the 12 tracks; header of `src/data/maps.js`; `src/render/textures.js` and `src/render/shapes-cars.js`. No change to the game.
