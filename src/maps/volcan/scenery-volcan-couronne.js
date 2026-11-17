// "volcan", zone 3: La Couronne (PK 2210 to 3780, 177 to 232 to 200 m), the horseshoe round the needle. set(), by(), slab() and gate() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).couronne = ({ set, by }) => {
  set('aiguilleVolcan', 276, -1428, { m: 'rock', a: [105, 24] });                                // hero landmark: the basalt needle inside the horseshoe, off the roadway
  [[236, -1400], [312, -1410], [300, -1466], [246, -1462], [276, -1380]].forEach(([x, z], i) => set('rocherVolcan', x, z, { m: 'rock', a: [16, 9 + i * 2, 16, i] })); // the scree at its foot
  by('belvedereVolcan', 3116, 1, 16, { road: true, a: [44, 24] }); by('posteVolcan', 3206, 1, 18); // at the pass (232 m), sea side, on the deck of the terrain (DECK in scenery-volcan.js): the reason for the detour
  [[335, -1345], [-490, -1210], [450, -890]].forEach(([x, z], i) => { set('dalleVolcan', x, z, { m: 'scoria', a: [24, 3, i, 11] }); set('coneVolcan', x + 17, z + 37, { m: 'scoria', a: [12, 15, i] }); }); // red-brown slag fields and their small cones
  by('dalleVolcan', [2506, 2756], -1, 30, { m: 'scoria', a: [20, 4], seed: 1 }); by('coneVolcan', [2526, 2776], -1, 44, { m: 'scoria', a: [11, 13], seed: 1 });
  [[150, -930], [60, -1150]].forEach(([x, z], i) => { set('vapeurVolcan', x, z, { m: 'steam', a: [26] }); set('rocherVolcan', x, z, { m: 'scoria', a: [6, 2, 6, i] }); }); // faint steam on the outer slope, seen across the horseshoe
  set('dalleVolcan', 270, -560, { m: 'crust', a: [46, 2.5, 4, 11] }); set('dalleVolcan', 300, -480, { m: 'crust', a: [34, 2, 5, 11] }); // an old flow at the foot of the south-east flank, seen from Les Cendres
  [[-1060, -700], [-1010, -1180], [-760, -1500], [-1090, -760]].forEach(([x, z], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [15 + i * 2, 42 + i * 9, i] })); // sea stacks off the roadless west and north coast
  by('borneVolcan', [2300, 2700, 3400, 3700], 1, 2);                                             // marker stones of the old service road
};
