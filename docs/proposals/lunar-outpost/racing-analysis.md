# Racing Track Design / Level Design analysis

Static reading of the repository, without a driving test. The recommendations are not measurements of the final layout.

## Technical facts

- `src/data/maps.js:6`: W = half-width in metres; kmh = visual speedometer factor, so do not deduce geometric speed from a displayed speed.
- `src/engine/sim.js:94–102`: x/z multiplied by sc, altitudes not multiplied; closed centripetal Catmull–Rom; 3D length, samples close to 2 m. A different design spline is not yet the engine's exact layout.
- `sim.js:106–110`: width changes blended over 60 m on either side.
- `sim.js:9–19`: arcade driving by common yaw, not a simple v²/r grip model.
- `sim.js:56–60`: three seconds of nitro, recharge notably by sliding; reserve several re-acceleration windows.
- `sim.js:75–78,118,303`: flight active only for maps declaring jumps or drivable walls; otherwise the car follows the ribbon. Gravity 9.81 m/s².
- `sim.js:235`: slope genuinely pushes/holds back the car, even without active flight. Keep this physics.
- `src/data/maps.js:462`: feedback on small altitude steps causing camera pitch; smooth the ramps.
- `src/engine/game.js:88,121`: low-definition 270p target and chase camera FOV 70°; reading by masses, not micro-texture.

## Comparison of the twelve tracks

Total base widths deduced from W in `src/data/maps.js`; local variations possible.

| Track / line | Width | Proposed difference for Lunar Outpost |
|---|---:|---|
| Ville à plein régime / 328 | 18 m | Sparse placement, no neon density |
| Karasu-toge / 347 | 12 m | Open arcs instead of forest switchbacks |
| WAN-9 / 359 | 16 m | Organic road without motorway traffic |
| Premier Métro / 373 | 14 m | Mineral void instead of monumental city |
| Canal 6 / 390 | 28 m | Two asymmetric basins and relief, not a drift oval |
| Grand Vacarme / 406 | 18 m | Isolation, with no arena or jumps |
| Nuit Blanche / 428 | 14 m | Normal grip, not ice |
| Spéciale des Ocres / 441 | 18 m | Off-road regolith, not a dirt rally |
| Route Royale / 454 | 16 m | Large ramps, without bazaar or built density |
| Barrage 74 / 482 | 18 m | Impact rims instead of a linear structure and hairpins |
| Manuscrit 512 / 514 | 9 m | Stable width and open views, with no narrow bridge or jungle |
| Playa 307 / 546 | 16 m | Cold grey and black sky, with no tropical coast |

Area 51 is a concept from the guide, not one of the twelve implemented tracks. Its rectilinear military geometry must stay distinct from the crater arcs.

## Recommendations before final geometry

Target 4.3 km; usual width 18 m, up to 22 m for overtaking. Large arcs of 200–400 m radius; a tighter transition around 100–150 m may suffice to vary. Do not combine minimum radius, summit and tunnel portal at the same point. Plan readable curvature inversions and nitro windows, to avoid the elongated oval.

Ramps of 3–6%, peaks under about 7% at this stage; low-amplitude undulations over long lengths. Road graded on the crater shoulder, not suspended without a base above a wall. Dark road, light kerbs, more frequent beacons at transitions. Airlocks open and tube depressurised during the race, pressurisable infrastructure outside the race. No change to lunar physics.
