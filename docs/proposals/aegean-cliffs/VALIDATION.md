# AEGEAN CLIFFS — independent skeptical validation

Review separate from the author of the track. Calculations run by `verifier.py`, without importing `construire.py` or reusing the values of the `report` field. The definition JSON and the exported CSV are the inputs. The dimensions describe a fictional project, not a survey of Santorini.

## Numerical checks

| Check | Independent method | Final result |
|---|---|---|
| Plan length | Quadrature of the norm of the derivative of each spline piece | 4,300.00014 m |
| Spatial length | Sum of the XYZ segments of the 2 m-step CSV | 4,317.73047 m |
| Closure | Comparison of analytic endpoints | Position, tangent, second derivative: zero deviation |
| Vertical closure and width | PCHIP, endpoint comparison | Altitude, slope and width matched |
| Self-intersections | Centreline + real edges offset by width, 100,001 samples | Centreline simple; each edge simple; edges disjoint |
| Minimum radius | Analytic spline derivatives, dense sampling | 47.92 m at PK 1,297 |
| Altitude / elevation change | Monotone interpolation and sum of variations | 8–172 m; gain 164 m and loss 164 m |
| Slopes | Analytic derivative of altitude | +12.607% / −14.717% |
| Width | Monotone interpolation of the width table | 12–16 m |

The difference of a few centimetres between the minimum-radius estimates comes from the sampling step; announce **about 48 m**, not centimetre precision. Lengths can be announced as **4.30 km in plan / 4.32 km on the road**. A valid buffer does not alone prove the absence of overlap: hence the explicit check of the two edges.

## Objections and requested corrections

1. **Village entry: curve + narrowing combined.** The radius is about 73 m at PK 1,891 and the initial profile narrowed from 15 to 12 m between PK 1,800 and 1,950. This combination disadvantages multiplayer and contradicts a readable transition. Request: keep 15 m until PK 2,000, then reduce progressively until PK 2,150; place the village limit at PK 2,000. The narrowing must be announced before braking, with no furniture on the outside of the corner.
2. **A fast descent is not guaranteed full throttle.** A slope of −14.7% requires very distant reading even with radii above 280 m. Keep 16 m on the fastest portion, avoid a bump or a final tightening, keep the flat finish. Place the signage and reserve the nitro windows after the visible exits. Speeds and lap times remain to be established in a playable mock-up.
3. **Two hairpins do not mean two corners in total.** The dominant changes of direction on the climb are spaced out; a third heavily loaded curve prepares the village. Describe it explicitly as an entry corner and do not hide it in a promise of only two braking points.
4. **12 m roadway in the village: modern service road.** A traditional Cycladic alley this wide would be implausible. Keep a service axis on the edge of the old fabric, with terraces and side stairs. Houses must be placed after the road, outside its strip and visibility zone.
5. **The geography remains a terrain project.** The south port must be protected by a cape or a breakwater; deep sea stays blue, turquoise accompanies the shallows. The north plateau and the cliffs are consistent with a long descent on the western flank, provided that flank is less steep and carries retaining walls. No detailed terrain section was provided: the absence of impossible earthworks cannot yet be demonstrated.

## Opinion

**Geometric loop validated for preproduction.** The closed plan has no junction, branch or overlapping crossing; the edges have a sufficient margin at the tightest radius. The profile is continuous in slope; the vertical second derivative of the PCHIPs is not necessarily continuous at the keys, to be smoothed if the camera reveals a troublesome movement in the mock-up.

**Not a gameplay certification.** 3D visibility, drift/nitro behaviour, collisions, flow with four cars and lap times require the blockout in the engine. The intersection check is dense numerical, not a symbolic proof. As no building has final geometry, their non-intersection with the road will have to be checked at placement.


## Re-check after correction

The final width profile keeps **15 m until PK 2,000**, then narrows progressively to **12 m at PK 2,150**. The village sector now starts at PK 2,000. This correction is present in the definition and the coordinates; a new independent run of `verifier.py` confirms the closures and the absence of edge intersection. Blocking reservation no. 1 is therefore **lifted**.

The minimum radius of the village sector thus redefined is about **166 m**. Its difficulty is placement precision on a 12 m roadway, followed by the balcony inflection; do not promise a maze of tight corners or a hairpin between the houses. The sharper curvature change at PK 2,527 belongs to the balcony and must remain visible from the village exit.

**Final opinion: concept admissible for a first mock-up.** No blocking inconsistency in the supplied geometry remains. The visibility and driving reservations described above are blockout checks, with no artificial validation through the mood image.
