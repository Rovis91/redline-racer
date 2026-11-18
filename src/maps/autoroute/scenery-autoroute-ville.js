// "autoroute": the city, generated from its street grid (the grid, cityY, the facade half-widths, MAT and the placers come from scenery-autoroute.js).
// Buildings: every cell of the grid is a city block of four buildings assembled from the kit (shapes-autoroute-batiments.js), whose kind follows the district. Near the route a block's footprint is its solid box
// of the map (ILOT in M.obst): what is seen is what is hit. Each block stands on a pavement 4 m wide, 10 cm above the street (the car drives onto it).
// The ground: what decades did to the streets, laid flat on the asphalt wherever the lane passes (cracks with grass in them, moss, dead leaves under the trees, the worn lane lines of the boulevard,
// moss and grass along the foot of every facade) and clumps of grass the car drives through. Vegetation grows from where it was planted or where water stands, never at random.
(window.AUTOROUTE = window.AUTOROUTE || {}).ville = ({ h, g, O, zone, MAT, set, slab, decal, real, tree, bush, tuft, HH, cityY, groundY, G, colL, colR, row }) => {
  const { near } = PLACERS, { S, rnd } = h;
  const far = (x, z) => { const s = S[near(h, x, z)]; return Math.hypot(s.x - x, s.z - z); }, BOX = new Map(O.filter(o => o.label === 'ILOT' || o.label === 'PARC').map(o => [Math.floor(o.x / G) + ',' + Math.floor(o.z / G), o]));
  // districts: office towers along the boulevard (stone, glass for the tallest), brick housing to the south, brick workshops and sheds to the north, warehouses on the low ground by the river. [lowest, highest (m)]
  const KIND = [[45, 110], [28, 55], [16, 30], [12, 24]], kind = (i, j) => i >= 3 ? 3 : j === -1 || j === 0 ? 0 : j >= 1 ? 1 : 2;
  for (let i = -6; i <= 4; i++) for (let j = -6; j <= 5; j++) { const b = BOX.get(i + ',' + j);
    const x0 = b ? b.x - b.hx : i * G + colR(i), x1 = b ? b.x + b.hx : (i + 1) * G - colL(i + 1), z0 = b ? b.z - b.hz : j * G + row(j), z1 = b ? b.z + b.hz : (j + 1) * G - row(j + 1), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, gy = groundY(cx);
    if (i === 1 && (j === 1 || j === 2)) { slab('pave', 178, gy - 0.5, cz, 52, 0.6, z1 - z0 + 8); slab('pave', 134.5, gy - 0.5, cz + (j === 1 ? -2 : 2), 35, 0.6, z1 - z0 + 4); } // (the two blocks beside the hole: their pavement on that side went down with the street, the hole's file puts back what is left of it)
    else if (far(cx, cz) < 150 && !(i === -4 && j === 0)) { const m = Math.abs(groundY(x0 - 4) - groundY(x1 + 4)) > 0.15 ? 8 : 1, w = (x1 - x0 + 8) / m; for (let q = 0; q < m; q++) { const px = x0 - 4 + (q + 0.5) * w; slab('pave', px, groundY(px) - 0.5, cz, w, 0.6, z1 - z0 + 8); } } // (in steps where the street slopes to the water)          // its pavement (the block in front of which the metro ramp comes up has its own, in the metro file)
    if (b && b.label === 'PARC') { // the park has become a wood behind its low wall: big trees, brush under them, some of it spilling over the wall
      for (const [wx, wz, lx, lz] of [[cx, z0 + 0.3, x1 - x0, 0.6], [cx, z1 - 0.3, x1 - x0, 0.6], [x0 + 0.3, cz, 0.6, z1 - z0], [x1 - 0.3, cz, 0.6, z1 - z0]]) slab('stone2', wx, gy, wz, lx, 1.3, lz);
      for (let k = 0; k < 16; k++) { const tx = x0 + 8 + ((k % 4) + HH(k, 1) * 0.8) * (x1 - x0 - 16) / 4, tz = z0 + 8 + (Math.floor(k / 4) + HH(k, 2) * 0.8) * (z1 - z0 - 16) / 4; tree(tx, tz, gy, 15 + 9 * HH(k, 3), 6 + 3 * HH(k, 4), k); }
      for (let k = 0; k < 14; k++) { const u = HH(k, 5), e = k % 4, bx = e < 2 ? x0 + u * (x1 - x0) : e === 2 ? x0 + 2 : x1 - 2, bz = e < 2 ? (e ? z1 - 2 : z0 + 2) : z0 + u * (z1 - z0); bush(bx, bz, gy + 0.6, 5 + 4 * HH(k, 7), 2.4 + HH(k, 6), 5 + 4 * HH(k, 8), k); }
      continue; }
    const k = kind(i, j), [lo, hi] = KIND[k], mx = x0 + (x1 - x0) * (0.35 + 0.3 * rnd()), mz = z0 + (z1 - z0) * (0.35 + 0.3 * rnd()), nearRoute = far(cx, cz) < 260;
    [[x0, mx, z0, mz], [mx, x1, z0, mz], [x0, mx, mz, z1], [mx, x1, mz, z1]].forEach(([a, b, c0, c1], q) => { const ht = lo + rnd() * (hi - lo), x = (a + b) / 2, z = (c0 + c1) / 2, w = b - a - 0.6, d = c1 - c0 - 0.6, v = i * 31 + j * 17 + q * 7, y = cityY(cx) - 1;
      // no two alike: one of three drawings and tints of its facade, its own parts (v) and its own damage (dmg: whole, gutted, topless, cut down, fallen; a glass tower never falls)
      const n3 = 1 + Math.floor(HH(v, 22) * 3), sfx = n3 > 1 ? n3 : '', wall = k === 0 ? (ht > 78 ? (v & 1 ? 'glass' : 'glass2') : 'stone' + sfx) : 'brick' + sfx, dmg = Math.pow(HH(v, 30), 0.6) * (/glass/.test(wall) ? 0.6 : 1) * (b ? 0.85 : 1); // (a block the car can touch keeps its walls: its box is its footprint)
      if (!nearRoute) slab(k === 3 ? (v & 1 ? 'tin' : 'tin2') : wall, x, y, z, w, (dmg > 0.6 ? 0.6 : 1) * ht + 1, d);                    // out of sight of the lane: the plain volume in its facade
      else if ((k === 3 && HH(v, 20) < 0.5) || (k === 2 && HH(v, 20) < 0.3)) { const t = HH(v, 21) < 0.5; set('entrepotAutoroute', x, z, { y, ry: t ? 0 : Math.PI / 2, a: [t ? w : d, Math.min(ht, 22), t ? d : w, v & 1 ? 'tin' : 'tin2', v, dmg] }); }
      else { set('immeubleAutoroute', x, z, { y, a: [w, ht, d, wall, v, dmg] }); if (dmg < 0.3 && ht < 60 && HH(v, 23) < 0.5) tree(x + (HH(v, 24) - 0.5) * w * 0.5, z + (HH(v, 25) - 0.5) * d * 0.5, y + ht, 8, 3.2, v); } }); // (a tree has taken root on one whole roof in two)
    // the foot of the block, on its pavement: a ragged band of moss and grass all round, thicker in places, and brush in some of its corners
    if (b) { for (const [ax, c, a0, a1] of [['x', z0 - 1.2, x0, x1], ['x', z1 + 1.2, x0, x1], ['z', x0 - 1.2, z0, z1], ['z', x1 + 1.2, z0, z1]]) for (let u = a0 + 4, n = 0; u < a1 - 2; u += 8, n++) { const v = Math.round(u * 3 + c * 5), px = ax === 'x' ? u : c, pz = ax === 'x' ? c : u;
        if (far(px, pz) > 40 || HH(v, 1) < 0.25) continue; decal('moss', px, gy + 0.13, pz, ax === 'x' ? 8 : 2.6 + 2 * HH(v, 2), ax === 'x' ? 2.6 + 2 * HH(v, 2) : 8);
        if (HH(v, 3) < 0.45) tuft(px + (HH(v, 4) - 0.5) * 5, pz + (HH(v, 5) - 0.5) * 1.5, gy + 0.1, v); } }
  }
  // cranes of the river port over the warehouse roofs, far to the east
  for (const [x, z] of [[640, -260], [660, 40], [630, 330]]) { slab('steel', x, -1, z, 6, 46, 6); slab('steel', x - 18, 40, z, 60, 3, 4); slab('rust', x - 44, 30, z, 3, 10, 3); }
  // reeds in the flooded streets that the route does not take (east of column 3)
  for (let i = 3; i <= 5; i++) for (let j = -5; j <= 4; j++) for (const [x, z, wx, dz] of [[i * G, (j + 0.5) * G, 12, 70], [(i - 0.5) * G, j * G, 70, 12]]) if (x > 300 && far(x, z) > 30) real('ROSELIERE', wx, 2.2, dz, x, -0.5, z);
  // the streets driven: every 10 m of lane, five things laid on the asphalt either side of it and under it. Cracks (their grass drawn in them, a clump growing out of one in three), patches of moss,
  // and where the lane is dry dead leaves blown against whatever stands there. Under water only the cracks show
  S.forEach((s, i) => { if (i % 5 || zone(i) !== 'rue') return; const wet = s.y < 0.05, nx = -s.tz, nz = s.tx;
    for (let k = 0; k < 5; k++) { const v = i * 5 + k, d = (HH(v, 1) - 0.5) * 30, x = s.x + nx * d + s.tx * (HH(v, 2) - 0.5) * 9, z = s.z + nz * d + s.tz * (HH(v, 2) - 0.5) * 9, r = HH(v, 3), y = g.hAt(x, z) + 0.1;
      if (O.some(o => Math.abs(o.x - x) < Math.max(o.hx, o.hz) + 3 && Math.abs(o.z - z) < Math.max(o.hx, o.hz) + 3 && Math.abs(o.y - s.y) < 4)) continue;       // (not under a wreck, a heap or a building)
      if (r < 0.55) { decal('crack', x, y, z, 6 + 6 * HH(v, 4), 6 + 6 * HH(v, 5), HH(v, 6) * 6); if (!wet && HH(v, 7) < 0.4 && Math.abs(d) > 3) tuft(x, z, y, v); }
      else if (!wet && r < 0.8) decal('moss', x, y, z, 4 + 5 * HH(v, 4), 3 + 4 * HH(v, 5), HH(v, 6) * 6);
      else if (!wet && Math.abs(d) > 2.5) { tuft(x, z, y, v); tuft(x + 0.8, z + 0.5, y, v + 1); } } });
  // the boulevard's lane lines, what is left of them: four dashed lines between the kerbs from the checkpoint to the motorway bridge, in lengths of 40 m with gaps where the paint has gone
  for (let x = -300; x < 300; x += 40) for (const z of [-8.6, -4.3, 4.3, 8.6]) if (HH(x, z) < 0.7 && !O.some(o => o.label !== 'ILOT' && Math.abs(o.x - x - 20) < 26 && Math.abs(o.z - z) < o.hx + o.hz + 1)) decal('mark', x + 20, cityY(x + 20) + (Math.abs(z) < 7 ? 0.03 : -0.03), z, 40, 0.5);
};
