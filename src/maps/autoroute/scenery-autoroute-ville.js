// "autoroute" blockout: the city, generated from its street grid rather than placed along the track (the grid, cityY and the facade half-widths come from scenery-autoroute.js).
// Buildings: every cell of the grid is a city block of four buildings, whose kind follows the district. Vegetation: it grows from where it was planted or where water stands
// (the boulevard's rows of trees, the old park, reeds in the flooded streets), never at random. Wrecks: the traffic left in the streets, wherever the street is wider than the lane left open.
(window.AUTOROUTE = window.AUTOROUTE || {}).ville = ({ h, edge, metro, cityY, G, colL, colR, row }) => {
  const { inst, block, near, edgePt } = PLACERS, { S, N, rnd } = h, box = h.geo('pierViaduct'), paint = c => h.mat('paint', { c }); // box: 5 x 1 x 5 m, centred
  const far = (x, z) => { const s = S[near(h, x, z)]; return Math.hypot(s.x - x, s.z - z); };
  // districts: offices along the boulevard, warehouses on the low ground by the river, housing to the south, workshops to the north. [label, colour, lowest, highest (m)]
  const KIND = [['IMMEUBLE DE BUREAUX', 0xa89a80, 22, 40], ["IMMEUBLE D'HABITATION", 0x8a5a48, 14, 24], ['ATELIERS', 0x7a6a58, 9, 16], ['ENTREPOT', 0x6f7f86, 8, 13]];
  const kind = (i, j) => i >= 3 ? 3 : j === -1 || j === 0 ? 0 : j >= 1 ? 1 : 2, lists = KIND.map(() => []);
  for (let i = -6; i <= 4; i++) for (let j = -6; j <= 5; j++) {
    const x0 = i * G + colR(i), x1 = (i + 1) * G - colL(i + 1), z0 = j * G + row(j), z1 = (j + 1) * G - row(j + 1), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    if (i === -2 && j === -1) { block(h, 'ANCIEN PARC', 0x3f6f38, x1 - x0 + 8, 16, z1 - z0 + 8, cx, cityY(cx) - 0.5, cz); continue; } // the park has become a wood and spills 4 m onto its pavements
    const k = kind(i, j), [label, c, lo, hi] = KIND[k], mx = x0 + (x1 - x0) * (0.35 + 0.3 * rnd()), mz = z0 + (z1 - z0) * (0.35 + 0.3 * rnd());
    [[x0, mx, z0, mz], [mx, x1, z0, mz], [x0, mx, mz, z1], [mx, x1, mz, z1]].forEach(([a, b, c0, c1], q) => { const top = cityY(cx) + lo + rnd() * (hi - lo), x = (a + b) / 2, z = (c0 + c1) / 2;
      if (!q && far(cx, cz) < 100) block(h, label, c, b - a, top - cityY(cx) + 0.5, c1 - c0, x, cityY(cx) - 0.5, z); // one name per block near the route
      else lists[k].push([x, (top - 10) / 2, z, 0, (b - a) / 5, top + 10, (c1 - c0) / 5]); });
  }
  lists.forEach((l, k) => inst(h, box, paint(KIND[k][1]), l));
  // the boulevard's two rows of trees, one every 28 m on the pavements; none at the crossroads, none in the shade of the motorway
  const trees = []; for (let x = -520; x <= 540; x += 28) if (Math.abs(x - Math.round(x / G) * G) > 16 && Math.abs(x - 229) > 30) for (const z of [-15, 15]) trees.push([x, cityY(x) + 7, z, 0, 1, 14, 1]);
  for (const p of trees.splice(8, 2)) block(h, "ARBRE D'ALIGNEMENT", 0x5a8a40, 5, 14, 5, p[0], cityY(p[0]), p[2]);
  inst(h, box, paint(0x5a8a40), trees);
  // reeds in the flooded streets that the route does not take (east of column 3)
  const reeds = []; for (let i = 3; i <= 5; i++) for (let j = -5; j <= 4; j++) for (const [x, z, sx, sz] of [[i * G, (j + 0.5) * G, 2.4, 14], [(i - 0.5) * G, j * G, 14, 2.4]]) if (x > 300 && far(x, z) > 25) reeds.push([x, 0.6, z, 0, sx, 2.2, sz]);
  { const p = reeds.shift(); block(h, 'ROSELIERE', 0x7a9a50, p[4] * 5, 2.2, p[6] * 5, p[0], -0.5, p[2]); } inst(h, box, paint(0x7a9a50), reeds);
  // wrecks: every 8 m, as many cars abreast as fit between the wall and the edge of the street (seven in ten are there); in the metro the trains do it
  const cars = [[], []]; for (let i = 0; i < N; i += 4) { const s = S[i]; if (metro.has(s)) continue;
    for (const sd of [-1, 1]) for (let k = 0; k < Math.min(3, Math.floor((edge(s, sd) - s.w) / 2.7)); k++) if (rnd() < 0.7) { const [x, z] = edgePt(s, sd, s.w + 1.4 + k * 2.7 + rnd() * 0.4); cars[(i / 4 + k) % 2].push([x, s.y + 0.75, z, h.across(s) + (rnd() - 0.5) * 0.5, 0.4, 1.5, 0.9]); } }
  inst(h, box, paint(0x9a5a3a), cars[0]); inst(h, box, paint(0x8a8f8c), cars[1]);
};
