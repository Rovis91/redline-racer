// "volcan", zone 2: Les Cendres (PK 690 to 2210, 40 to 177 m), the terraced ash slope, climbed. set(), by(), slab() and gate() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).cendres = ({ set, by }) => {
  for (let pk = 720, i = 0; pk < 2120; pk += 140, i++) by('terrasseVolcan', pk, -1, 26, { a: [40, 3, i % 3 === 2 ? 'olive' : 'vine'] }); // three steps of black dry-stone walls, vines on top
  by('jardinVolcan', [926, 1436, 1956], -1, 33, { a: [36, 14, 'leaf'] });                        // small cultivated plots between two terraces
  for (const [x, z, ry] of [[421, -494, 0.3], [445, -809, -0.5]]) {                              // the two hamlets of the plan, away from the apexes: houses, a chapel, a cistern, a few trees
    [[0, 0, 'cream', 0], [-8, 30, 'cream', 0.4], [44, -14, 'ochre', -0.3], [26, 12, 'coral', 1.6], [18, -26, 'cream', 1.2], [-30, 4, 'ochre', 0.8]].forEach(([dx, dz, c, r], i) => set('maisonVolcan', x + dx, z + dz, { ry: ry + r, a: [11 + (i & 1) * 2, 4.5 + (i % 3) * 0.8, 8, c] }));
    set('chapelleVolcan', x + 4, z - 56, { ry: ry + 3.1 }); set('cylVolcan', x - 36, z - 24, { m: 'concrete', a: [4, 4, 5, 10], dy: -1 });
    [[50, 20], [-26, 42], [24, 46]].forEach(([dx, dz]) => set('arbreVolcan', x + dx, z + dz, { a: [9] })); }
  by('arbusteVolcan', [800, 1000, 1256, 1500, 1906, 2100], 1, 4, { a: [1.2] });                   // low sparse bushes on the sea side, never above the wall
  by('rocherVolcan', [860, 1300, 1640, 2040], -1, 8, { m: 'rock', a: [8, 4, 10], seed: 1 }); by('rocherVolcan', [868, 1310, 1650, 2050], -1, 13, { m: 'rock', a: [5, 3, 6], seed: 1 }); // scree at the foot of the bank
};
