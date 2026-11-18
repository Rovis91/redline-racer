// "volcan", zone 3: La Couronne (PK 2210 to 3780, 177 to 232 to 200 m), the horseshoe round the needle. set(), by() and slab() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).couronne = ({ set, by }) => {
  set('aiguilleVolcan', 276, -1428, { m: 'rock', a: [105, 24] });                                // hero landmark: the basalt needle inside the horseshoe, off the roadway
  [[236, -1400], [312, -1410], [300, -1466], [246, -1462], [276, -1380]].forEach(([x, z], i) => set('rocherVolcan', x, z, { m: 'rock', a: [16, 9 + i * 2, 16, i] })); // the scree at its foot
  by('belvedereVolcan', 3116, 1, 16, { road: true, a: [44, 24] }); by('posteVolcan', 3206, 1, 18); // at the pass (232 m), sea side, on the deck of the terrain (DECK in scenery-volcan.js): the reason for the detour
  [[212, -1440, 14, -46], [450, -890, 17, 37]].forEach(([x, z, dx, dz], i) => { set('dalleVolcan', x, z, { m: 'scoria', a: [i ? 24 : 18, 2, i, 11] }); set('coneVolcan', x + dx, z + dz, { m: 'scoria', a: [12, 15, i] }); }); // red-brown slag fields and their small cones
  [[330, -1370, 20], [180, -1390, 16], [120, -1300, 22], [360, -1250, 18], [520, -1130, 20], [610, -1010, 24]].forEach(([x, z, r], i) => set('dalleVolcan', x, z, { m: 'snow', a: [r, 0.5, i + 3, 10] })); // snow fields with hard edges
  [[-1060, -700], [-1010, -1180], [-760, -1500], [-1090, -760]].forEach(([x, z], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [15 + i * 2, 42 + i * 9, i] })); // black sea stacks off the roadless west and north coast
  [[-1180, -980, 14], [-900, -1420, 10], [-420, -1640, 12], [700, -1400, 9], [880, -700, 11]].forEach(([x, z, w], i) => set('rocherVolcan', x, z, { y: -1, m: 'ice', a: [w * 2, w * 0.7, w * 1.4, i + 20] })); // a few small icebergs
  by('cairnVolcan', [2300, 2700, 3400, 3700], 1, 3, { a: [2.2], seed: 1 });                      // cairns of the old service road
};
