// "volcan", zone 3: La Couronne (PK 2210 to 3780, 177 to 232 to 200 m), the horseshoe round the needle. set(), by(), slab(), line(), drape() and scatter() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).couronne = ({ set, by, beside, drape, scatter }) => {
  scatter(2210, 3780, 'rock', 24);                                                                // the verge up here: black slabs and boulders
  set('aiguilleVolcan', 276, -1428, { m: 'rock', a: [105, 24] });                                // hero landmark: the basalt needle inside the horseshoe, off the roadway
  [[236, -1400], [312, -1410], [300, -1466], [246, -1462], [276, -1380]].forEach(([x, z], i) => set('rocherVolcan', x, z, { m: 'rock', a: [16, 9 + i * 2, 16, i] })); // the scree at its foot
  by('belvedereVolcan', 3116, 1, 16, { road: true, a: [44, 24] }); by('posteVolcan', 3206, 1, 18); // at the pass (232 m), sea side, on the deck of the terrain (DECK in scenery-volcan.js): the reason for the detour
  [[212, -1440, 14, -46], [450, -890, 17, 37]].forEach(([x, z, dx, dz], i) => { set('dalleVolcan', x, z, { m: 'scoria', a: [i ? 24 : 18, 2, i, 11] }); set('coneVolcan', x + dx, z + dz, { m: 'scoria', a: [12, 15, i] }); }); // red-brown slag fields and their small cones
  // snow fields with hard edges, lying along the road on the island side all round the horseshoe
  for (let pk = 2260, n = 0; pk < 3760; pk += 125, n++) drape('snow', [[-40, 14, 5], [-14, 22, 10], [12, 26, 11], [40, 15, 5]].map(([d, off, w]) => [...beside(pk + d, -1, off + (n % 3) * 5), w]), 1);
  // two glacier tongues come down the outer flank of the volcano from its white rim: one to the road of Les Cendres, one to the approach of the north gallery
  drape('ice', [[80, -960, 9], [110, -968, 20], [150, -980, 24], [185, -990, 16], [206, -995, 6]], 2);
  drape('ice', [[-53, -1097, 10], [-41, -1135, 24], [-23, -1192, 30], [-5, -1249, 22], [10, -1298, 7]], 2);
  [[-1060, -700], [-1010, -1180], [-760, -1500], [-1090, -760]].forEach(([x, z], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [15 + i * 2, 42 + i * 9, i] })); // black sea stacks off the roadless west and north coast
  [[560, -1420, 20, 60], [470, -1700, 16, 44], [120, -1760, 22, 70]].forEach(([x, z, r, ht], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [r, ht, i + 9] })); // and off the north-east point, under the guardrail of the horseshoe
  [[-1180, -980, 14], [-900, -1420, 10], [-420, -1640, 12], [700, -1400, 9], [880, -700, 11], [300, -1720, 13], [620, -1560, 9]].forEach(([x, z, w], i) => set('rocherVolcan', x, z, { y: -1, m: 'ice', a: [w * 2, w * 0.7, w * 1.4, i + 20] })); // a few small icebergs
  by('cairnVolcan', [2300, 2700, 3400, 3700], 1, 3, { a: [3], seed: 1 });                        // cairns of the old service road
  by('capteurVolcan', [2520, 2900, 3330, 3560], -1, 3);                                           // the instruments of the observers along the service road
};
