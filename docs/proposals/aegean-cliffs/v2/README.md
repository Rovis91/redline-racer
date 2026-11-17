# AEGEAN CLIFFS — V2, more winding

V1 is kept in the parent folder. This variant answers the feedback: outline too round, not enough corners, port insufficiently built up.

## Changes
- Additional sequences of corners in the upper village, at the port exit and on the western descent.
- Village still perched: 161 to 172 m over its sector; port at 8 m at the start.
- Port shown with a built front, warehouses, three pontoons, boats and breakwater. V1 showed too little of it to make its activity readable.
- Illustrated support with capes and re-entrants; the detailed terrain of the generated image is an artistic intention.

## Computed measurements
Length 4,700 m in plan / 4,717 m on the road; gain 164 m; width 12–16 m. Minimum radius on dense check: about 38 m in the village (PK2151), against 48 m in V1. Maximum slope +12.61% / −14.09%. The village becomes genuinely more technical; the descent is no longer a continuous full-throttle section: minimum radii close to 79 m, braking needed before the counter-curves.

The independent script from V1 was adapted to read the V2 data, then rerun: position/tangent/curvature/slope/width closure zero; edges simple and disjoint over 100,001 samples. See verification-independante.json. No new human check or new autonomous agent review is claimed: the second agent could not finish its V2 review. The V1 preproduction validation therefore does not count as V2 gameplay validation.

## Reference deliverables
- coordonnees.csv / geometrie.json: metric definition of V2.
- trace-metrique.svg: metric vector centreline.
- plan-support-v2.png / .svg: support for the generation, indicative building placements, graphic road thickness.
- profil-v2.png: altitude along the exact V2 chainage.
- illustration-v2.png: view generated over the plan, as soon as generation finished. It may show deviations and is not a geometric export.

## Points to settle in blockout
The village has a counter-curve R≈38 m near the narrowing to 12 m: reserve overtaking for the wide zones, clear the visibility, test braking and widen locally if needed. On the descent, announce each change of direction and place the nitro windows after the visible exits. The drawn buildings are intentions of volumes; their final placement requires a collision/visibility check. No lap time or target speed is invented.

Image: built-in imagegen tool, generation guided by plan-support-v2.png. Prompt in PROMPT_IMAGEGEN.md. The geometry was computed before the illustration.
