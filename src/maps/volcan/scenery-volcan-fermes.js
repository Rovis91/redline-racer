// "volcan", zone 3: Les Fermes (PK 900 to 1900, 20 to 85 m): the sweep out of the village, the straight through the farmland (x = 623, northwards), then two hairpins up the scarp of an old lava flow (legs at x = 623, 575, 527).
// The only soil of the island lies on the old flows of the east side. A pasture belongs to a farm: the fields are walled in dry stone from the roadside to the cliff, each farm has its house in one colour, its red barn, its turf sheep shed and its gate on the road; the sheep are inside the walls.
// set(), by(), wall(), track(), flock(), line(), drape() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js. Plan: x east, z south. Island on the left (-1, west), sea on the right (1, east).
(window.VOLCAN = window.VOLCAN || {}).fermes = ({ set, by, beside, range, line, drape, wall, track, flock }) => {
  const PI = Math.PI, along = (a, b, sd, off) => [...range(a, b, 14), b].map(pk => beside(pk, sd, off));
  // fields(a, b, sd, deep, cuts, gates): the roadside wall from PK a to b on side sd, 5 m behind the guard rail, open at each gate; a back wall `deep` m from the road; a cross wall at each chainage of `cuts`
  const fields = (a, b, sd, deep, cuts, gates) => { let from = a; for (const gt of [...gates, b + 3]) { wall(along(from, gt - 3, sd, 5)); from = gt + 3; }
    wall(along(a, b, sd, deep)); for (const pk of [a, ...cuts, b]) wall([beside(pk, sd, 5), beside(pk, sd, deep)]);
    for (const gt of gates) { by('barriereVolcan', gt, sd, 5); track([beside(gt, sd, 0.5), beside(gt, sd, 14)], 1.8); } };
  // farm(pk, sd, tint): the yard behind the gate at PK pk: the house facing the road, the barn end-on beside it, the turf shed, a flag
  const farm = (pk, sd, tint) => { by('maisonVolcan', pk - 14, sd, 18, { a: [11, 5.2, 8, tint] }); by('grangeVolcan', pk + 16, sd, 22, { turn: PI / 2, a: [15, 5, 9, 'red'] }); by('torfVolcan', pk - 32, sd, 20, { a: [9, 6, tint] }); by('drapeauVolcan', pk - 5, sd, 9, { a: [7, 'red'] }); };
  // graze(pk, sd, n): a flock in the field at PK pk, close behind the wall; mown(a, b, sd): a hay field between two chainages: the pale mown strip and its white bales
  const graze = (pk, sd, n, k) => flock(...beside(pk, sd, 26), n, 17, k);
  const mown = (a, b, sd, k) => { drape('hay', range(a + 8, b - 4, 16).map(pk => [...beside(pk, sd, 34), 24]), 0.3); by('balleVolcan', (a + b) / 2, sd, 13, { a: [6, k] }); by('balleVolcan', (a + b) / 2 + 20, sd, 30, { turn: 1.2, a: [4, k + 1] }); };
  // sea side, from the last houses to the first hairpin: two farms, six fields down to the cliff edge
  fields(850, 1372, 1, 78, [915, 985, 1065, 1140, 1215, 1295], [1010, 1245]);
  farm(1010, 1, 'yellow'); farm(1245, 1, 'blue'); graze(880, 1, 9, 12); graze(945, 1, 11, 1); mown(1068, 1138, 1, 2); graze(1178, 1, 12, 3); graze(1335, 1, 9, 5);
  // island side: the fields of the third farm run back to the black scarp of the lava lobe
  fields(915, 1346, -1, 56, [1000, 1090, 1180, 1262], [1135]);
  farm(1135, -1, 'green'); mown(918, 998, -1, 6); graze(1045, -1, 10, 7); graze(1222, -1, 10, 8); graze(1305, -1, 8, 9);
  // the sorting fold where the farm tracks meet at the foot of the scarp: a ring of stone with its pens round a middle ring, used in autumn; and one small field between the legs of the hairpins
  const ring = (x, z, r, n = 14) => Array.from({ length: n }, (_, i) => [x + Math.cos(i / n * 6.283) * r, z + Math.sin(i / n * 6.283) * r]);
  wall(ring(656, -672, 13), true); wall(ring(656, -672, 5, 8), true); for (let i = 0; i < 6; i++) wall([[656 + Math.cos(i * 1.047) * 5, -672 + Math.sin(i * 1.047) * 5], [656 + Math.cos(i * 1.047) * 13, -672 + Math.sin(i * 1.047) * 13]]);
  flock(662, -700, 7, 12, 6); wall([[588, -548], [612, -548], [612, -640], [588, -640]], true); flock(600, -596, 7, 9, 8);
  // the power line leaves the village for the base camp: wooden poles on the island side of the road, straight across the hairpins
  line([...range(700, 1340, 46), [599, -612], [551, -640], ...range(1790, 1900, 46)], -1, 2.5, 'poteauVolcan', [10], [['dark', 0.07, -1.3, 9.45], ['dark', 0.07, 1.3, 9.45]]);
  by('panneauVolcan', 1290, 1, 1.6, { a: ['yellow', 1.3] }); by('panneauVolcan', 930, 1, 1.6, { a: ['yellow', 1.3] });   // hairpins ahead; sheep on the road
  // the scarp of the old flow behind the hairpins: black columns facing the road, fallen blocks at its foot; in the rock cut of the third leg, the same columns on both banks
  set('orguesVolcan', 599, -708, { ry: PI, a: [44, 12] }); set('orguesVolcan', 551, -470, { a: [40, 10] });
  by('orguesVolcan', [1690, 1722], -1, 5, { a: [30, 7] }); by('orguesVolcan', [1700, 1730], 1, 5, { a: [26, 5] });
  [[640, -704, 7], [566, -716, 9], [520, -486, 6], [586, -462, 8]].forEach(([x, z, w], i) => set('rocherVolcan', x, z, { m: 'rock', a: [w, w * 0.6, w, i + 2] }));
};
