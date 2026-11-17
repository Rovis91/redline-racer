// "autoroute" blockout: the city, generated from its street grid rather than placed along the track (the grid, cityY, the facade half-widths, street() and edge() come from scenery-autoroute.js).
// Buildings: every cell of the grid is a city block of four buildings, whose kind follows the district. Vegetation: it grows from where it was planted or where water stands
// (the boulevard's rows of trees, the old park, reeds in the flooded streets), never at random.
// What narrows the road is of several kinds, each with its own shape, and cars are only one of them: a checkpoint's lines of concrete barriers, the rubble fan of a collapsed facade,
// a pile-up packed in its lanes; on the motorway a central reservation, and the traffic jam fills the carriageway the lane is not on. Between them the street is open from kerb to kerb.
(window.AUTOROUTE = window.AUTOROUTE || {}).ville = ({ h, street, edge, metro, cityY, G, colL, colR, row }) => {
  const { inst, block, near, edgePt } = PLACERS, { S, rnd } = h, box = h.geo('pierViaduct'), paint = c => h.mat('paint', { c }); // box: 5 x 1 x 5 m, centred
  const far = (x, z) => { const s = S[near(h, x, z)]; return Math.hypot(s.x - x, s.z - z); };
  // districts: office towers along the boulevard, warehouses on the low ground by the river, housing to the south, workshops to the north. [label, colour, lowest, highest (m)]
  const KIND = [['IMMEUBLE DE BUREAUX', 0xa89a80, 45, 110], ["IMMEUBLE D'HABITATION", 0x8a5a48, 28, 55], ['ATELIERS', 0x7a6a58, 16, 30], ['ENTREPOT', 0x6f7f86, 12, 24]];
  const kind = (i, j) => i >= 3 ? 3 : j === -1 || j === 0 ? 0 : j >= 1 ? 1 : 2, lists = KIND.map(() => []);
  for (let i = -6; i <= 4; i++) for (let j = -6; j <= 5; j++) {
    const x0 = i * G + colR(i), x1 = (i + 1) * G - colL(i + 1), z0 = j * G + row(j), z1 = (j + 1) * G - row(j + 1), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    if (i === -2 && j === -1) { block(h, 'ANCIEN PARC', 0x3f6f38, x1 - x0 + 8, 18, z1 - z0 + 8, cx, cityY(cx) - 0.5, cz); continue; } // the park has become a wood and spills 4 m onto its pavements
    const k = kind(i, j), [label, c, lo, hi] = KIND[k], mx = x0 + (x1 - x0) * (0.35 + 0.3 * rnd()), mz = z0 + (z1 - z0) * (0.35 + 0.3 * rnd());
    [[x0, mx, z0, mz], [mx, x1, z0, mz], [x0, mx, mz, z1], [mx, x1, mz, z1]].forEach(([a, b, c0, c1], q) => { const top = cityY(cx) + lo + rnd() * (hi - lo), x = (a + b) / 2, z = (c0 + c1) / 2;
      if (!q && far(cx, cz) < 100) block(h, label, c, b - a, top - cityY(cx) + 0.5, c1 - c0, x, cityY(cx) - 0.5, z); // one name per block near the route
      else lists[k].push([x, (top - 1) / 2, z, 0, (b - a) / 5, top + 1, (c1 - c0) / 5]); }); // base at -1 m: the metro station runs under the edge of some blocks
  }
  lists.forEach((l, k) => inst(h, box, paint(KIND[k][1]), l));
  // the boulevard's two rows of trees, one every 28 m on the pavements; none at the crossroads, none in the shade of the motorway
  const trees = []; for (let x = -520; x <= 540; x += 28) if (Math.abs(x - Math.round(x / G) * G) > 16 && Math.abs(x - 229) > 30) for (const z of [-15, 15]) trees.push([x, cityY(x) + 7, z, 0, 1, 14, 1]);
  for (const p of trees.splice(8, 2)) block(h, "ARBRE D'ALIGNEMENT", 0x5a8a40, 5, 14, 5, p[0], cityY(p[0]), p[2]);
  inst(h, box, paint(0x5a8a40), trees);
  // reeds in the flooded streets that the route does not take (east of column 3)
  const reeds = []; for (let i = 3; i <= 5; i++) for (let j = -5; j <= 4; j++) for (const [x, z, sx, sz] of [[i * G, (j + 0.5) * G, 2.4, 14], [(i - 0.5) * G, j * G, 14, 2.4]]) if (x > 300 && far(x, z) > 25) reeds.push([x, 0.6, z, 0, sx, 2.2, sz]);
  { const p = reeds.shift(); block(h, 'ROSELIERE', 0x7a9a50, p[4] * 5, 2.2, p[6] * 5, p[0], -0.5, p[2]); } inst(h, box, paint(0x7a9a50), reeds);

  const on = (ax, c) => S.filter(s => { const st = street(s); return !metro.has(s) && st && st[0] === ax && st[2] === c; }); // the samples of a straight street
  // the boulevard, where the road is narrower than the street (M.wide): west of x = -110 the checkpoint, a line of concrete barriers along each wall and its kit behind;
  // around x = 0 and east of x = 245 a collapsed facade, rubble from the wall to the kerb, higher towards the building it fell from
  const barriers = [], kit = [], rubble = [];
  on('x', 0).forEach((s, i) => { const th = s.x < -110 ? 1 : (s.x > -55 && s.x < 55) || s.x > 245 ? 2 : 0; if (!th || i % 2) return;
    for (const sd of [-1, 1]) { const gap = edge(s, sd) - s.w; if (gap < 1.5) continue;
      if (th === 1) { const [x, z] = edgePt(s, sd, s.w + 0.5); barriers.push([x, s.y + 0.5, z, h.across(s), 0.12, 1, 0.76]);
        if (gap > 5 && i % 12 === 0) { const [a, b] = edgePt(s, sd, s.w + 3 + rnd() * (gap - 4.5)); kit.push([a, s.y + 1.1, b, rnd() * 3, 0.5, 2.2, 0.5]); } }
      else for (let o = 1; o < gap - 0.5; o += 2.2) { if (rnd() < 0.25) continue; const [x, z] = edgePt(s, sd, s.w + o + rnd()), sz = 1.4 + rnd() * 1.8, ht = 0.5 + rnd() * 1.2 + 3.5 * o / 13; rubble.push([x, s.y + ht / 2, z, rnd() * 3, sz / 5, ht, sz / 5]); } } });
  inst(h, box, paint(0xb8b4a8), barriers); inst(h, box, paint(0x5a6240), kit); inst(h, box, paint(0x7a756c), rubble);
  // cars: jam(axis, half-width, centre, from, to, keep, across): the lanes of a straight street, 3.2 m wide, a car every 6.2 m in each, wherever keep(x, z) and the open lane (wall + 1.3 m) leave room;
  // one in eight is a van. across: where the lane changes carriageway, a long vehicle lies against its wall on the side it leaves, at the lane's own angle
  const NAMES = ['CAMION EN PORTEFEUILLE', 'BUS EN TRAVERS'], COL = [0x9a5a3a, 0xb8a050], cars = [[], [], []]; let nb = 0;
  const jam = (ax, hw, c, a0, a1, keep, acr) => { const L = on(ax, c), dir = s => ax === 'x' ? Math.sign(s.tx) : Math.sign(s.tz), dev = s => ax === 'x' ? s.tz * dir(s) : -s.tx * dir(s), across = []; // dev > 0: the lane is moving to its right
    for (let i = 1, best = null; acr && i <= L.length; i++) { const s = L[i]; if (s && Math.abs(dev(s)) > 0.25) { if (!best || Math.abs(dev(s)) > Math.abs(dev(best))) best = s; } else if (best) {
      const sd = dev(best) > 0 ? -1 : 1, [x, z] = edgePt(best, sd, best.w + 1.7), k = nb++ % NAMES.length; across.push([x, z]);
      block(h, NAMES[k], COL[k], 2.6, 3.4, 12, x, best.y, z, h.across(best)); best = null; } }
    for (let a = a0; a <= a1; a += 6.2) for (let l = -hw + 1.6; l < hw; l += 3.2) { if (rnd() > 0.95) continue; const u = a + (rnd() - 0.5) * 1.2, x = ax === 'x' ? u : c + l, z = ax === 'x' ? c + l : u; if (!keep(x, z)) continue;
      let s = L[0], bd = 1e9; for (const t of L) { const d = (t.x - x) ** 2 + (t.z - z) ** 2; if (d < bd) { bd = d; s = t; } }
      if (Math.abs((x - s.x) * -s.tz + (z - s.z) * s.tx) < s.w + 1.3 || bd > 900 || across.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 7.5)) continue;
      const van = rnd() < 0.12, ln = van ? 6 : 4.4, ht = van ? 2.6 : 1.5, ry = (rnd() - 0.5) * 0.1;
      cars[van ? 2 : (nb++ & 1)].push([x, s.y + ht / 2, z, ry, (ax === 'x' ? ln : 2) / 5, ht, (ax === 'x' ? 2 : ln) / 5]); }
    return L; };
  jam('x', 13, 0, 108, 200, () => true);                                                                           // the pile-up before the motorway bridge: the lanes on the south side, packed
  // the motorway: the west carriageway is jammed up to the gap in the central reservation, the east one from the gap on; the lane takes the other each time,
  // 11 m wide against the reservation: on its own carriageway a few cars are left in the lane along the parapet (one place in three)
  const mw = jam('z', 16, 220, -262, 196, (x, z) => Math.abs(x - 220) > 2.5 && ((x < 220 ? z < -104 : z > -66) || rnd() < 0.35), 1), yAt = z => mw.reduce((b, s) => Math.abs(s.z - z) < Math.abs(b.z - z) ? s : b).y;
  [0x9a5a3a, 0x8a8f8c, 0xc8c2b0].forEach((c, k) => inst(h, box, paint(c), cars[k]));
  // the central reservation: a concrete wall 2 m wide down the middle of the deck, broken between z = -110 and z = -55
  const median = []; for (let z = -257; z <= 196; z += 10) if (z < -110 || z > -55) median.push([220, yAt(z) + 0.55, z, 0, 0.4, 1.1, 2]);
  { const p = median.splice(6, 1)[0]; block(h, 'TERRE-PLEIN', 0x8f8c82, 2, 1.1, 10, 220, p[1] - 0.55, p[2]); } inst(h, box, paint(0x8f8c82), median);
};
