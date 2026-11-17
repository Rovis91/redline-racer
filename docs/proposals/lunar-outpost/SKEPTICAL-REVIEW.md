# LUNAR OUTPOST — independent skeptical review

**Reviewer: agent distinct from the layout's author.** Preproduction review of 17 November 2026, on the delivered data, generator and images. No lap in Redline Racer was played: this review certifies neither lap time, difficulty, nor camera behaviour in situ.

## Verdict

The proposed loop satisfies the intent of organic speed and has a geometry usable for a first mock-up. The plan and the profile use the same chainage; the altitudes are designed and explicitly indicative, with no claim to a lunar survey. The validation is geometric and editorial, not a driving certification.

## Independent checks

Recalculation from `centreline.csv`, reading of `geometry.json` and of the generator's spline, visual inspection of the board and comparison with the 12-track overview image.

| Check | Result |
|---|---|
| Horizontal length of the 2 m-step polyline | 4,399.995 m, consistent with the 4,400 m target |
| Spatial length of the same line | 4,402.602 m |
| XYZ closure | error 3.46 × 10⁻¹² m, numerically negligible |
| Tangent at the seam | identical by periodic spline; recomputed difference 0 |
| Slope at the seam | difference 0 |
| Direction | clockwise, confirmed by ring orientation |
| Minimum radius | 140.26 m on curvature of the sampled spline |
| Maximum slope after correction | +6.61% / −5.70% |
| Ribbon altitude | 12.47 to 67.03 m, positive elevation gain 63.39 m |
| Continuity | periodic cubic spline: position, tangent and curvature continuous |
| Self-intersection | centreline and two edges at ±11 m simple per the generator's Shapely check |
| Variety | six curvature sign changes; distinct west/east arcs, north link and south return |

The "no crossing" statement concerns the race track. The decorative service roads are not playable branches. Additional independent check: the annular polygon formed by the ±11 m edges is valid, area 96,799.56 m² for 96,800 m² expected (length × width). The uniform 22 m ribbon does not overlap itself.

## Objections raised during the review

1. **Initial climb too abrupt.** First version at +11.95%, due to +30 m in 310 m even before the spline effect. Flagged then corrected: profile points raised/lowered to distribute the ramp. The +6.61% version is compatible with the promise of large ramps, subject to a camera test.
2. **Profile and terrain initially independent.** The first topography could place the roadway several tens of metres below a rim. The revised version lowers the rims to the south and provides a graded ledge set on the profile, then a transition to the relief. This correction is acceptable in preproduction; the embankments remain conceptual and must be built as a volume, not as a flat texture.
3. **Width represented as a step.** The reviewed version used a discrete 22→18 m passage. Transition now smoothed over 80 m in the board (280–360 m and 4,220–4,300 m), consistent with the file.
4. **Service roads.** Relay and science station moved off the overly steep inner flanks. The base→garage→gallery service road now appears on the plan.
5. **Altitude origin.** The start altitude is 18 m: do not call the zero "base deck level". The generator and the concept now use an arbitrary local origin. The crater values designate relief intentions, not measured terrain.

## Design assessment

The layout makes two basins of different sizes and a small return basin readable; the eastern arc descends to a lowered rim. The crest is not a disguised hairpin. The large radius leaves room to overtake and to choose to hold a slide. The buildings stay grouped, the empty intervals ensure isolation. The dark road and its ivory kerbs stand out against the regolith; the occasional orange beacons avoid repeating the city's neon identity.

The difference with Area 51 is convincing: arcs dictated by the craters, with no rectilinear military strip or hero antenna. Mind the vocabulary: Area 51 is a direction from the guide, not an implemented circuit among the twelve. Compared with Canal 6, the asymmetry, curvature inversions and relief avoid a simple drift oval. Compared with Barrage 74 and Karasu-toge, the absence of hairpins preserves speed.

The tunnel is a pressurisable 180 m gallery, depressurised with airlocks open during the race. A continuously pressurised gallery open at both ends would have been incoherent. No moving obstacle or gravity change must be added.

## Limits to keep in the delivery

- The concept spline is a periodic cubic; the engine uses centripetal Catmull–Rom. Importing only the control points may change length, radius and slope: recheck after import, without claiming that the CSV has already been played.
- Slope changes are mathematically smooth, but the visual clearance at the summit and in the tunnel remains to be looked at from the game camera.
- Readability is argued on the moodboard and the plan; it was not measured on a playable 270p capture.
- No quantified target speed or claimed lap time: the game's speedometer applies a sensation factor and does not replace a spatial measurement.


## Final reading of the concept

The final concept takes up the corrections for slope, width, earthworks and service roads. The right curve starts around chainage 1,674 m, before the summit at 1,884 m: the intent to commit to the curve before the crest is therefore consistent. The minimum radius is around 1,418 m and the steepest climb around 1,648 m, coinciding neither with the summit nor the tunnel portal. The eight thumbnails are explicitly generated intentions, and the validation limits are clearly displayed. No blocking point remains at preproduction level; the three mock-up arbitrations of the concept remain relevant.
