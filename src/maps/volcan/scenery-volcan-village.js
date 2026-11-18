// "volcan", zone 2: Le Village (PK 490 to 900, 8 to 20 m): left into the main street (x = 300, northwards), right round the church square (z = -170, eastwards): the first braking of the lap.
// The village grew along the street that climbs from the harbour to the church: houses close on both sides of it, and blocks of houses along the lanes parallel to it. Colours: green, yellow, blue, red, pink, never two alike side by side.
// set(), by(), wall(), track() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js. Plan: x east, z south.
(window.VOLCAN = window.VOLCAN || {}).village = ({ set, by, range, wall, track }) => {
  const C = ['green', 'yellow', 'blue', 'red', 'pink'], dims = i => [9 + i % 3, 4.2 + (i * 7 % 4) * 0.5, 7.5, C[(i * 2 + (i / 5 | 0)) % 5]], PI = Math.PI;
  // the main street and the church street: a house every 13 m on both sides, 1 m of verge between the door and the road
  range(548, 640, 13).forEach((pk, i) => { by('maisonVolcan', pk, -1, 5, { a: dims(i * 2) }); by('maisonVolcan', pk + 5, 1, 5, { a: dims(i * 2 + 3) }); });
  range(708, 822, 13.5).forEach((pk, i) => { if (i < 3 || i > 4) by('maisonVolcan', pk, -1, 5, { a: dims(i * 3 + 1) }); by('maisonVolcan', pk + 4, 1, 5, { a: dims(i * 3 + 2) }); });
  [834, 848, 862, 876, 890].forEach((pk, i) => { by('maisonVolcan', pk, -1, 6, { a: dims(i * 2 + 1) }); if (i < 2) by('maisonVolcan', pk + 4, 1, 6, { a: dims(i * 3) }); }); // the last houses, along the sweep out of the village
  by('reverbereVolcan', range(540, 830, 30), 1, 1.2); by('panneauVolcan', 556, 1, 1.6, { a: ['white', 2.2, 3.4] }); // street lamps; the sign of the shop
  // the blocks: five lanes parallel to the main street, houses on both sides of each lane, door to the lane; two cross lanes
  [200, 250, 350, 400, 450].forEach((lx, n) => { track([[lx, -24], [lx, -150]], 2);
    for (let k = 0; k < 8; k++) for (const sd of [-1, 1]) { const z = -36 - k * 14.5 + (sd > 0 ? 7 : 0); if (Math.abs(z + 92) > 8) set('maisonVolcan', lx + sd * 9.5, z, { ry: -sd * PI / 2, a: dims(n * 11 + k * 2 + (sd > 0 ? 1 : 0)) }); } });
  track([[190, -92], [289, -92]], 2); track([[311, -92], [462, -92]], 2); track([[190, -170], [289, -170]], 2);
  for (let i = 0; i < 6; i++) { set('maisonVolcan', 198 + i * 14, -181, { a: dims(i * 3 + 2), ry: PI }); set('maisonVolcan', 205 + i * 14, -159, { a: dims(i * 3 + 4) }); } // the lane west of the church
  for (let i = 0; i < 5; i++) set('maisonVolcan', 412 + i * 14, -206, { a: dims(i * 2 + 6), ry: PI });                                                            // a last row above the church street
  // the church closes the main street: white, its door and spire facing the harbour, the churchyard behind a low stone wall with its white crosses; the school and its flag beside it
  set('egliseVolcan', 300, -208, { ry: PI, s: 1.25 }); wall([[268, -190], [287, -190]], false, 'stone', 1); wall([[313, -190], [336, -190], [336, -250], [268, -250], [268, -190]], false, 'stone', 1);
  set('croixVolcan', 322, -222, { ry: PI / 2, a: [12] }); set('croixVolcan', 280, -232, { ry: PI / 2, a: [8] });
  set('maisonVolcan', 385, -203, { ry: PI, a: [18, 5.8, 9, 'yellow'] }); set('drapeauVolcan', 371, -188, { a: [9, 'red'] });
};
