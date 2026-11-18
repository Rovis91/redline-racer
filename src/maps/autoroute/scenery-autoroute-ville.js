// "autoroute", V2 scenery: the city, generated from its street grid rather than placed along the track (the grid, cityY, the facade half-widths, street(), edge(), MAT and set() come from scenery-autoroute.js).
// Buildings: every cell of the grid is a city block of four buildings assembled from the kit (shapes-autoroute-batiments.js), whose kind follows the district. Vegetation: it grows from where it was planted
// or where water stands (the boulevard's rows of trees, the old park, reeds in the flooded streets), never at random.
// What narrows the road is of several kinds, each with its own shape, and cars are only one of them: a checkpoint's lines of concrete barriers, the rubble fan of a collapsed facade,
// a pile-up packed in its lanes; on the motorway a central reservation, and the traffic jam fills the carriageway the lane is not on. Between them the street is open from kerb to kerb.
(window.AUTOROUTE = window.AUTOROUTE || {}).ville = ({ h, street, edge, metro, cityY, G, colL, colR, row, MAT, set, slab, real, tree, bush, HH, idx, pkS, PK }) => {
  const { inst, insts, near, edgePt } = PLACERS, { S, rnd } = h;
  const far = (x, z) => { const s = S[near(h, x, z)]; return Math.hypot(s.x - x, s.z - z); };
  // districts: office towers along the boulevard (stone, glass for the tallest), brick housing to the south, brick workshops and sheds to the north, warehouses on the low ground by the river. [lowest, highest (m)]
  const KIND = [[45, 110], [28, 55], [16, 30], [12, 24]], kind = (i, j) => i >= 3 ? 3 : j === -1 || j === 0 ? 0 : j >= 1 ? 1 : 2;
  for (let i = -6; i <= 4; i++) for (let j = -6; j <= 5; j++) {
    const x0 = i * G + colR(i), x1 = (i + 1) * G - colL(i + 1), z0 = j * G + row(j), z1 = (j + 1) * G - row(j + 1), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    if (i === -2 && j === -1) { real('ANCIEN PARC', x1 - x0 + 8, 18, z1 - z0 + 8, cx, cityY(cx) - 0.5, cz); continue; } // the park has become a wood and spills onto its pavements
    const k = kind(i, j), [lo, hi] = KIND[k], mx = x0 + (x1 - x0) * (0.35 + 0.3 * rnd()), mz = z0 + (z1 - z0) * (0.35 + 0.3 * rnd()), nearRoute = far(cx, cz) < 260;
    [[x0, mx, z0, mz], [mx, x1, z0, mz], [x0, mx, mz, z1], [mx, x1, mz, z1]].forEach(([a, b, c0, c1], q) => { const ht = lo + rnd() * (hi - lo), x = (a + b) / 2, z = (c0 + c1) / 2, w = b - a - 0.6, d = c1 - c0 - 0.6, v = i * 31 + j * 17 + q * 7, y = cityY(cx) - 1;
      // no two alike: one of three drawings and tints of its facade, its own parts (v) and its own damage (dmg: whole, gutted, topless, cut down, fallen; a glass tower never falls)
      const n3 = 1 + Math.floor(HH(v, 22) * 3), sfx = n3 > 1 ? n3 : '', wall = k === 0 ? (ht > 78 ? (v & 1 ? 'glass' : 'glass2') : 'stone' + sfx) : 'brick' + sfx, dmg = Math.pow(HH(v, 30), 0.6) * (/glass/.test(wall) ? 0.6 : 1); // (more buildings damaged than whole)
      if (!nearRoute) slab(k === 3 ? (v & 1 ? 'tin' : 'tin2') : wall, x, y, z, w, (dmg > 0.6 ? 0.6 : 1) * ht + 1, d);                    // out of sight of the lane: the plain volume in its facade
      else if ((k === 3 && HH(v, 20) < 0.5) || (k === 2 && HH(v, 20) < 0.3)) { const t = HH(v, 21) < 0.5; set('entrepotAutoroute', x, z, { y, ry: t ? 0 : Math.PI / 2, a: [t ? w : d, Math.min(ht, 22), t ? d : w, v & 1 ? 'tin' : 'tin2', v, dmg] }); }
      else { set('immeubleAutoroute', x, z, { y, a: [w, ht, d, wall, v, dmg] }); if (dmg < 0.3 && ht < 60 && HH(v, 23) < 0.5) tree(x + (HH(v, 24) - 0.5) * w * 0.5, z + (HH(v, 25) - 0.5) * d * 0.5, y + ht, 8, 3.2, v); } }); // (a tree has taken root on one whole roof in two)
  }
  // the boulevard's two rows of trees, one every 28 m on the pavements; none at the crossroads, none in the shade of the motorway, none beyond the two ends where the boulevard is buried. Lamp posts between them, some leaning
  let n = 0; for (let x = -324; x <= 320; x += 28) if (Math.abs(x - Math.round(x / G) * G) > 16 && Math.abs(x - 229) > 30) for (const z of [-15.5, 15.5]) { n++;
    tree(x, z, cityY(x) + 0.2, 13 + 6 * HH(n, 1), 4.5 + 2 * HH(n, 2), n);
    if (n % 4 === 1) set('lampadaireAutoroute', x + 14, z * 0.9, { y: cityY(x) + 0.2, ry: z > 0 ? Math.PI / 2 : -Math.PI / 2, a: [HH(n, 3) < 0.3 ? 0.25 : 0] }); }
  // cranes of the river port over the warehouse roofs, far to the east
  for (const [x, z] of [[640, -260], [660, 40], [630, 330]]) { slab('steel', x, -1, z, 6, 46, 6); slab('steel', x - 18, 40, z, 60, 3, 4); slab('rust', x - 44, 30, z, 3, 10, 3); }
  // reeds in the flooded streets that the route does not take (east of column 3)
  for (let i = 3; i <= 5; i++) for (let j = -5; j <= 4; j++) for (const [x, z, wx, dz] of [[i * G, (j + 0.5) * G, 12, 70], [(i - 0.5) * G, j * G, 70, 12]]) if (x > 300 && far(x, z) > 25) real('ROSELIERE', wx, 2.2, dz, x, -0.5, z);

  const on = (ax, c) => S.filter(s => { const st = street(s); return !metro.has(s) && st && st[0] === ax && st[2] === c; }); // the samples of a straight street
  // the boulevard, where the road is narrower than the street (M.wide): west of x = -110 the checkpoint, a line of concrete barriers along each wall and its kit behind (sandbags, crates under canvas);
  // around x = 0 and east of x = 245 a collapsed facade, rubble from the wall to the kerb, higher towards the building it fell from. The first row, against the wall of the lane, has no gap: the collision line is the barriers and the rubble
  on('x', 0).forEach((s, i) => { const th = s.x < -110 ? 1 : (s.x > -55 && s.x < 55) || s.x > 245 ? 2 : 0; if (!th || i % 2) return;
    for (const sd of [-1, 1]) { const gap = edge(s, sd) - s.w; if (gap < 1.5) continue;
      if (th === 1) { const [x, z] = edgePt(s, sd, s.w + 0.5); set('barriereAutoroute', x, z, { y: s.y, ry: h.across(s) });
        if (gap > 5 && i % 12 === 0) { const [a, b] = edgePt(s, sd, s.w + 3 + rnd() * (gap - 4.5)); set('sacsAutoroute', a, b, { y: s.y, ry: rnd() * 3, a: [5] }); } }
      else for (let o = 1; o < gap - 0.5; o += 2.2) { if (rnd() < 0.25 && o > 1) continue; const [x, z] = edgePt(s, sd, s.w + o + 0.5 + rnd() * 0.6), sz = Math.min(1.4 + rnd() * 1.8, o * 0.65 + 0.4), ht = 0.5 + rnd() * 1.2 + 3.5 * o / 13; // (a piece is never wider than its distance to the lane: nothing overhangs the wall)
        set('eboulisAutoroute', x, z, { y: s.y - 0.2, ry: rnd() * 3, a: [sz * 2, ht, sz * 2, i + o] }); } } });
  // cars: jam(axis, half-width, centre, from, to, keep, across): the lanes of a straight street, 3.2 m wide, a car every 6.2 m in each, wherever keep(x, z) and the open lane (wall + 1.3 m) leave room;
  // one in eight is a van. across: where the lane changes carriageway, a long vehicle lies against its wall on the side it leaves, at the lane's own angle
  const NAMES = ['CAMION EN PORTEFEUILLE', 'BUS EN TRAVERS'], TINT = [0x8a4a2a, 0xb8b4a8, 0x5a7a78, 0x7a3a34, 0x9a9486, 0x4a5a6a, 0xa88a50, 0x6a6a62], cars = [[], [], [], []]; let nb = 0;
  const jam = (ax, hw, c, a0, a1, keep, acr, clear = 1) => { const L = on(ax, c), dir = s => ax === 'x' ? Math.sign(s.tx) : Math.sign(s.tz), dev = s => ax === 'x' ? s.tz * dir(s) : -s.tx * dir(s), across = []; // dev > 0: the lane is moving to its right
    for (let i = 1, best = null; acr && i <= L.length; i++) { const s = L[i]; if (s && Math.abs(dev(s)) > 0.25) { if (!best || Math.abs(dev(s)) > Math.abs(dev(best))) best = s; } else if (best) {
      const sd = dev(best) > 0 ? -1 : 1, [x, z] = edgePt(best, sd, best.w + 1.7); across.push([x, z]); real(NAMES[nb++ % NAMES.length], 2.6, 3.4, 12, x, best.y, z, h.across(best)); best = null; } }
    for (let a = a0; a <= a1; a += 6.2) for (let l = -hw + 1.6; l < hw; l += 3.2) { const u = a + (rnd() - 0.5) * 1.2, x = ax === 'x' ? u : c + l, z = ax === 'x' ? c + l : u; if (!keep(x, z)) continue;
      let s = L[0], bd = 1e9; for (const t of L) { const d = (t.x - x) ** 2 + (t.z - z) ** 2; if (d < bd) { bd = d; s = t; } }
      if (Math.abs((x - s.x) * -s.tz + (z - s.z) * s.tx) < s.w + clear || bd > 900 || across.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 7.5)) continue;
      const van = rnd() < 0.12, ry = (rnd() - 0.5) * 0.1 + (ax === 'x' ? Math.PI / 2 : 0), k = van ? 3 : nb++ % 3;
      cars[k].push([x, s.y, z, ry, 1, 1, 1, TINT[(nb * 7 + k) % TINT.length]]); if (nb % 6 === 0 && ax === 'x') bush(x, z, s.y, 3, 2.2, 4, nb); } // one wreck in six is overgrown (in the streets: nothing grows on the motorway)
    return L; };
  // (its first row stands along the wall of the lane itself, a car every 6 m at the lane's angle: the collision line is that row; the lanes behind it are packed)
  on('x', 0).forEach((s, i) => { if (s.x < 108 || s.x > 200 || i % 3) return; for (const sd of [-1, 1]) if (edge(s, sd) - s.w > 2.2) { const [x, z] = edgePt(s, sd, s.w + 1); cars[i % 3 ? 1 : 0].push([x, s.y, z, h.across(s) + (HH(i, sd) - 0.5) * 0.3, 1, 1, 1, TINT[i % TINT.length]]); } });
  jam('x', 13, 0, 108, 200, () => true, 0, 3.4);                                                                           // the pile-up before the motorway bridge: the lanes on the south side, packed
  // the motorway: the west carriageway is jammed up to the gap in the central reservation, the east one from the gap on; the lane takes the other each time,
  // 10 m wide against the reservation: on its own carriageway a queue of cars stands bumper to bumper in the lane along the parapet: the walls of the lane are that queue and the reservation, to within 0.3 m
  const mw = jam('z', 16, 220, -262, 196, (x, z) => Math.abs(x - 220) > 2.5 && ((x < 220 ? z < -104 : z > -66) || true), 1), yAt = z => mw.reduce((b, s) => Math.abs(s.z - z) < Math.abs(b.z - z) ? s : b).y;
  // the motorway's lamp posts, every 48 m along both parapets, standing on the deck at its height there, one in three leaning a little
  for (let z = -250, k = 0; z <= 80; z += 48, k++) for (const sd of [-1, 1]) set('lampadaireAutoroute', 220 + sd * 15.6, z, { y: yAt(z), ry: sd > 0 ? Math.PI : 0, a: [HH(k * 2 + sd, 1) < 0.33 ? 0.12 : 0] });
  // the pavements of the streets driven, every 14 m on each side: brush, a young tree through the slabs, fallen masonry, a wreck left on the kerb; four places in ten stay bare
  S.forEach((s, i) => { const p = pkS(s); if (i % 7 || metro.has(s) || !(p < PK.rampe - 20 || (p > PK.sol + 16 && p < PK.bord - 12) || p > PK.rue + 6)) return;
    for (const sd of [-1, 1]) { const v = i * 2 + sd, r = HH(v, 1), [x, z] = edgePt(s, sd, edge(s, sd) + 2.2), y = s.y + 0.25, ry = h.across(s);
      if (r < 0.3) bush(x, z, y, 3 + 2 * HH(v, 2), 1.6 + HH(v, 3), 3 + 3 * HH(v, 4), v); else if (r < 0.42) tree(x, z, y, 7 + 4 * HH(v, 2), 2.6, v + 1);
      else if (r < 0.5) set('eboulisAutoroute', x, z, { y, ry, a: [3.2, 1.2, 3.2, v] }); else if (r < 0.58) cars[v & 1].push([x, y, z, ry + 0.3 * (HH(v, 5) - 0.5), 1, 1, 1, TINT[Math.abs(v) % TINT.length]]); } });
  cars.forEach((l, k) => insts(h, 'voitureAutoroute', MAT, l, { a: [k], tintMat: 'body' }));
  // the central reservation: a concrete wall 2 m wide down the middle of the deck, broken between z = -110 and z = -55, moss on it
  for (let z = -257; z <= 196; z += 10) if (z < -110 || z > -55) { real('TERRE-PLEIN', 2, 1.1, 10, 220, yAt(z), z); if (HH(z, 1) < 0.6) slab('moss', 220, yAt(z) + 1.1, z, 2.06, 0.03, 10); }
};
