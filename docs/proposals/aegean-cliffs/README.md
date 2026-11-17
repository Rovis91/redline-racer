# AEGEAN CLIFFS — design sheet

Version of 17 November 2026. Preproduction proposal following `docs/methods/TRACK-DESIGN.md`; no change to the game.

## Promise
A service road links a sheltered Cycladic port to a perched village, then returns by the cornice and the western slope. Driving favours flow, reading the relief and re-accelerations: two turnarounds on the climb, a curved village, then an open descent without hairpins. The white silhouette and blue dome are the main landmark; the windmill and the breakwater are secondary. Fictional island inspired by Santorini, not a reconstruction of its geography.

## Deliverables
- **AEGEAN_CLIFFS-planche.png / .svg**: large complete board, metric map on the left, profile below, ten thumbnails per zone on the right.
- **plan-metrique.svg / profil-altimetrique.svg**: separate documents.
- **trace-metrique.svg**: vector centreline only, one unit = one metre.
- **coordonnees.csv**: centreline sampled every 2 m of horizontal chainage, last point identical to the first.
- **geometrie.json**: exact definition of the spline and height/width keys; mesures.json: computed values.
- **VALIDATION.md / verifier.py**: skeptical review and independent calculation.
- **COMPARISON.md**: explicit comparison with the 12 existing tracks.
- **ART-DIRECTION.md**: ten sourced and commented references, palette, sounds and eight priority assets.

## Geometry and territory
Horizontal length 4,300 m; spatial length 4,318 m, rounded to the metre. Design altitudes 8–172 m, gain and loss 164 m. Extreme slopes +12.61% / −14.72%. Width 12–16 m, minimum radius about 48 m. These data are **computed on a fictional geometry in metres** and are not measurements of Santorini.

A single counter-clockwise loop, no branch, no bridge or tunnel. Start in the south, climb over two eastern shoulders, village to the north-east, balcony to the north, long western descent. The cornice rests on a cut/supported ledge; the west slope is less steep. The basin in the south is protected by a breakwater. The flat tints of the plan indicate schematic relief masses, not computed contour lines. The inner plateau may rise above the road; its 3D surface remains to be built.

The schematic houses are placed outside a 25 m reserve from the centreline; future walls/terraces must respect the road strip and the visibility cones. The village is a modern service road on the fringe of the old fabric; alleys and stairs are pedestrian, off-route.

## Zones and rhythm
| Zone / horizontal chainage | Width and altitude | Driving / curves | Essential assets |
|---|---|---|---|
| 01 Port, 0–650 m | 16 m; 8→20 m | Acceleration, overtaking, preparation for A; minimum R ≈303 m | Quay, breakwater, caiques, white warehouse |
| 02 Ascent, 650–2,000 m | 16→15 m; 20→161 m | A large turnaround R≈97 m at PK785; B hairpin R≈48 m at PK1297; C village entry R≈73 m at PK1891 | Layered cliffs, retaining walls, chevrons |
| 03 Village, 2,000–2,500 m | 15→12 m between PK2000 and PK2150; 161→172 m | Precise placement, continuous curves R≥166 m; no labyrinth or 90° turn | Dome, terraced houses, bougainvillea, side stairs |
| 04 Balcony, 2,500–3,100 m | 12→14 m; 172→135 m | D counter-curve R≈124 m at PK2527, then large curves; announce D from the village | Windmill, continuous parapet, opening onto the sea |
| 05 Descent, 3,100–4,300 m | 14→16 m before PK3300; 135→8 m | R≥280 m, open lines, early braking, flat finish | Low scrub, low walls, cove and return to the port |

The two climb turnarounds are not just two braking points: C is a third heavily loaded curve. The village sector is technical through placement and width, not extreme radii.

## Readability and arcade use
- Overtaking favoured at the port and on the widened descent; avoid forcing four cars abreast in the village.
- Nitro proposed on PK0–400 and after the visible exits of the descent; these are intentions, not a validated calibration.
- A/B/C: reserve clear entries and continuous chevrons. Visibility targets must be sized from real speeds and braking in blockout; no invented lap time.
- Main reveal at the summit: sea and windmill; reminder of the port in the last third of the descent. No obligation to see the port from the north balcony through the plateau.
- Anthracite roadway, light stone shoulders, floral details set back; parapets without ambiguous visual gates to the void.

## Verification and corrections
The independent verifier rebuilds the spline from the JSON, integrates its length and tests the two edges offset at real width over 100,001 samples. Position/tangent/curvature closure, slope and width: zero deviation. Centreline and edges simple, edges disjoint.

Review correction: the initial narrowing at PK1800–1950 combined corner C and a loss of width. It is moved to PK2000–2150; the village now starts at PK2000. The skeptical agent lifted this reservation after a new check.

Three validations still open for the mock-up: (1) drift/nitro behaviour and visibility with four cars; (2) earthworks and real building positions; (3) camera comfort at vertical transitions. The slope is continuous, but the PCHIP vertical acceleration may change at the keys. The file is ready for a blockout, not for declaring the track tested in game.

## Data reuse
CSV: s_horizontal_m, x_est_m, y_nord_m, altitude_m, largeur_m, rayon_m, pente_pct, secteur. Width = TOTAL width. Local metric system, sea = 0. For Three.js: position [x_est, altitude, -y_nord]. In the repository's [x,z,altitude] format: [x_est,-y_nord,altitude]; W=width/2. Do not apply an additional `sc` factor.

The exact centreline is a periodic CubicSpline parametrized by the chords of the control points; altitude and width are PCHIP along horizontal chainage. The engine uses another interpolation: importing these points into its Catmull-Rom may slightly change the measurements. Revalidate after conversion; the JSON/CSV and the plan are the reference here.

Reproduction: Python + numpy/scipy/shapely/matplotlib/Pillow; run construire.py, verifier.py, sheet.py and export-svg.py from any folder. The scripts are preproduction tools, not an addition to the game runtime.

## Moodboard and provenance
The ten thumbnails were generated with the built-in imagegen tool; the file moodboard.png is kept in this folder. Left column: synthetic inspirations, not documentary photographs; right: low-poly intentions, not game captures. The map was computed before generation and is not deduced from these images. See PROMPT_IMAGEGEN.md for the prompt and ART-DIRECTION.md for the documentary sources. Game reference: https://github.com/Rovis91/redline-racer; local captures: the 12-track overview image and course-1.png.
