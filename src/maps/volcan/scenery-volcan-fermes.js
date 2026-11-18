// "volcan", zone 3: Les Fermes (PK 400 to 1560, 20 to 127 m): the S-bends up the east side, the sea cliffs on the right (1).
// The only soil of the island lies on the old flows of the east side. A pasture belongs to a farm: the fields are walled in dry stone from the roadside back to the black scarp, each farm has its house in one colour, its red barn, its turf sheep shed and its gate on the road; the sheep are inside the walls.
// by(), wall(), track(), flock(), line(), drape() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).fermes = ({ by, beside, range, line, drape, wall, track, flock }) => {
  const PI = Math.PI, along = (a, b, sd, off) => [...range(a, b, 14), b].map(pk => beside(pk, sd, off));
  // fields(a, b, sd, deep, cuts, gates): the roadside wall from PK a to b on side sd, 5 m behind the guard rail, open at each gate; a back wall deep m from the road; a cross wall at each chainage of cuts
  const fields = (a, b, sd, deep, cuts, gates) => { let from = a; for (const gt of [...gates, b + 3]) { wall(along(from, gt - 3, sd, 5)); from = gt + 3; }
    wall(along(a, b, sd, deep)); for (const pk of [a, ...cuts, b]) wall([beside(pk, sd, 5), beside(pk, sd, deep)]);
    for (const gt of gates) { by('barriereVolcan', gt, sd, 5); track([beside(gt, sd, 0.5), beside(gt, sd, 14)], 1.8); } };
  // farm(pk, sd, tint): the yard behind the gate at PK pk: the house facing the road, the barn end-on beside it, the turf shed, a flag
  const farm = (pk, sd, tint) => { by('maisonVolcan', pk - 14, sd, 18, { a: [11, 5.2, 8, tint] }); by('grangeVolcan', pk + 16, sd, 22, { turn: PI / 2, a: [15, 5, 9, 'red'] }); by('torfVolcan', pk - 32, sd, 20, { a: [9, 6, tint] }); by('drapeauVolcan', pk - 5, sd, 9, { a: [7, 'red'] }); };
  const graze = (pk, sd, n, k, off = 22) => flock(...beside(pk, sd, off), n, 13, k);
  const mown = (a, b, sd, k) => { drape('hay', range(a + 8, b - 4, 16).map(pk => [...beside(pk, sd, 26), 16]), 0.3); by('balleVolcan', (a + b) / 2, sd, 13, { a: [6, k] }); by('balleVolcan', (a + b) / 2 + 20, sd, 26, { turn: 1.2, a: [4, k + 1] }); };
  // island side: three farms, their fields one after the other all the way up
  fields(420, 1500, -1, 44, [520, 620, 700, 800, 900, 1010, 1100, 1200, 1300, 1400], [660, 950, 1250]);
  farm(660, -1, 'yellow'); farm(950, -1, 'blue'); farm(1250, -1, 'green');
  graze(470, -1, 9, 1); mown(522, 618, -1, 2); graze(750, -1, 11, 3); mown(802, 898, -1, 4); graze(1055, -1, 10, 5); graze(1150, -1, 9, 6); mown(1302, 1398, -1, 7); graze(1450, -1, 9, 8);
  // sea side: narrow fields between the road and the cliff edge, one farm where the ground is widest
  fields(470, 1480, 1, 30, [600, 730, 860, 990, 1120, 1250, 1370], [1085]);
  farm(1085, 1, 'pink'); graze(535, 1, 8, 11, 18); graze(795, 1, 9, 12, 18); graze(925, 1, 8, 13, 18); graze(1310, 1, 9, 14, 18); graze(1425, 1, 7, 15, 18);
  // the power line leaves the village for the base camp: wooden poles on the island side of the road
  line(range(400, 1560, 46), -1, 2.5, 'poteauVolcan', [10], [['dark', 0.07, -1.3, 9.45], ['dark', 0.07, 1.3, 9.45]]);
  by('panneauVolcan', 430, 1, 1.6, { a: ['yellow', 1.3] });                                       // sheep on the road
};
