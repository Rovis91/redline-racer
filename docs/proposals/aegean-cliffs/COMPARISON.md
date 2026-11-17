# AEGEAN CLIFFS — comparison with the twelve tracks

Racing Track Designer / Level Designer review, 16 November 2026. Analysis of the repository's local data, design comments and screenshots. This document separates observed characteristics from the choices recommended for Aegean; it does not claim to be a driving test of the new track.

## Sources and method

- `src/data/maps.js`, definitions of the twelve maps, lines 328–591; `src/engine/sim.js:95`, track construction.
- The 12-track overview image (ambiences and minimaps), inspected visually.
- The Barrage 74 high-view rework image (relief, ramp, crest and descent), inspected visually.
- Public repository requested: https://github.com/Rovis91/redline-racer; the local copy uses the same origin.

The values below are **computed on the design curves**, not measured on a screenshot: closed centripetal Catmull-Rom identical to `buildTrack`, horizontal coordinates multiplied by `sc`, 20,000 subdivisions, sum of 3D chords rounded to the metre. Altitude is the extent of the base spline, not the positive cumulative gain. Ramps added afterwards by the engine are excluded. Widths are `2*W`, excluding local widenings. The length may differ slightly from the length the game uses, whose arc table is less dense.

| Track (identifier) | Computed length | Spline altitudes | Base width | Observed signature and decision for Aegean |
|---|---:|---:|---:|---|
| Ville à plein régime (`ville`) | 2,318 m | −14.5 to 12.2 m | 18 m | Nocturnal urban loop, fast curves and tunnel; Aegean keeps a natural open-air road, a sea horizon and dominant relief. No return tunnel. |
| Karasu-Tōge (`touge`) | 3,918 m | 9.8 to 136.0 m | 12 m | Forest climb, four repeated hairpins on the descent; Aegean reserves its two hairpins for the climb, spaces them out and descends by fast arcs. High risk if hairpins are multiplied. |
| WAN-9 (`wangan`) | 6,381 m | −15.2 to 30.2 m | 16 m | Long marina straight, bridge, lighthouse hairpin, containers, immersed tunnel and traffic; Aegean uses a small fishing port and a steep coast, with no motorway structure or pier out-and-back. |
| Premier Métro (`paris`) | 4,485 m | −12.7 to 44.2 m | 14 m | Urban climb, accelerations between corners, monumental square and underground section; Aegean crosses a village by a curved service road, with no street grid or monumental roundabout. |
| Canal 6 (`canal`) | 4,851 m | −8.3 to 4.2 m | 28 m | Very wide large oval, repeated undulations and sustained slide; Aegean offers curves of different radius and duration, separated by climb, village and balcony. No regular decorative meanders. |
| Grand Vacarme (`stade`) | 2,199 m | −0.1 to 4.0 m | 18 m | Three hairpin straights, chicane, hairpin, bumps and drivable walls; Aegean stays anchored to the terrain and keeps its wheels on the ground. No ramp or show-off shortcut. |
| Nuit Blanche (`givre`) | 3,285 m | −0.1 to 122.0 m | 14 m | Ascent, two switchbacks, crest and long descending return; this is the closest rhythm kinship. Aegean must add a real village sector at the top and an extended sea balcony, and avoid the same rectangular silhouette and the two adjacent switchbacks. |
| Spéciale des Ocres (`terre`) | 2,554 m | 28.5 to 43.2 m | 18 m | Bumpy dirt, rally curves, small relief and jumps; Aegean is a continuous asphalt road: the challenge comes from lines, slopes and precision, with no surface changes. |
| Route Royale (`perse`) | 2,372 m | −0.7 to 14.3 m | 16 m | Monumental terrace, staircase, columned space and covered-bazaar bends; Aegean arranges its houses around the road and does not turn monuments, staircases or squares into drivable obstacles. |
| Barrage 74 (`barrage`) | 5,816 m | 13.8 to 105.3 m | 18 m | Valley floor, west-slope climb, tunnel, dam crest and two descending hairpins; Aegean avoids the tunnel–dam crest–hairpins sequence. Its balcony is a road on a rock ledge and its descent stays open and fast. |
| Manuscrit 512 (`chapada`) | 3,583 m | 14.0 to 63.2 m | 9 m | Compact switchbacks, gorge, city, bridge, cave and fords; Aegean is wider and more open, with few switchbacks and no signature tunnel, ford or bridge. Dry relief and the lived-in village replace tropical enclosure. |
| Playa 307 (`plage`) | 2,479 m | −6.1 to 3.2 m | 16 m | Drivable beach, U-turn on a jetty, town, cenote and lagoon dyke; Aegean avoids being a mere new palette of a seaside map. The sea stays below the cliff, the port is low, the village high; no drivable sand, mangrove or cenote. |

## Recommended decisions

1. **Driving signature:** gain altitude through two wide changes of direction, cross the village without right angles, then find the sea again for a long time in a balcony curve and a fast descent. The inhabited summit must be a real sequence, not three houses at the edge of a pass.
2. **Topological difference:** do not reuse the ladder of parallel switchbacks of Tōge/Chapada or the almost rectangular outline of Nuit Blanche. The two hairpins must follow two distinct shoulders of the cliff; the sea arcs form a more open, irregular side.
3. **Geography:** a modern 12–16 m service road skirts the pedestrian core and links port, village and outer slope. The route passes between two spaced built blocks; stairs and alleys remain visible off-track. The road does not cut through an alignment of existing houses.
4. **Nitro and overtaking:** reserve the seafront, the exit of the second hairpin and the balcony for re-accelerations; announce the slowdown before the village. Do not place the crest of a bump exactly on the first technical braking point.
5. **Readability:** dark grey asphalt, light edge lines, readable low parapets and off-white facades. One dominant blue dome and a secondary windmill are enough; do not saturate every house with a dome or bougainvillea.
6. **Validation still needed:** track diversity is also judged on the final metric plan. Radii, slopes, sight distances and drift durations must then be checked against the prototype; no target speed or lap time is validated by this review.

## Points to pass to the skeptic

- Two wide hairpins can remain very slow turns if the transitions tighten the curve: check the actual minimum radius, not only the radius announced at the middle.
- A high altitude on a short loop can force an excessive slope or a village perched on an artificial wall: examine the profile and the volume available between roads.
- Check the parapets and braking zones of the balcony: a panorama must not hide the corner exit.
- The port must have a sheltered basin and a continuous quay; the jetties are decor, not a branch of the track.
- If the route still looks like Nuit Blanche after removing colours and buildings, rework the plan and the rhythm, not only the decor.
