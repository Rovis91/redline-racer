// "autoroute", zone 5: the tram line (round 5: it was a metro tube). A double-track line built cut-and-cover just under the streets: a concrete box 13 m between its walls and 5 m under its flat roof,
// floor 6 m under the street (a tram is 2.65 m wide and 3.4 m high: two tracks 2.4 m either side of the axis, the lane drives on whichever is free). From the hole in row 2 (x = 66) west under that street,
// round to the north under column -4, through a stop (two platforms 30 cm high, 4.1 m from the axis, the hall 17 m wide), then out: from the stop's north end the trench is open to the sky, curves east
// and climbs 6 % to the boulevard (x = -365), where the rails run on in the roadway, past the start and down the whole boulevard to the water.
// What the car can hit is a box of the map (M.obst in src/data/maps.js): the trams and the masts (built by real() in scenery-autoroute.js), the walls of the open trench (MUR TREMIE), the platforms (QUAI TRAM, drawn here).
// Under cover the walls are the road's own (M.wide 6.5) and are drawn on that line. th.tun.without 'walls': the engine only lays the floor.
(window.AUTOROUTE = window.AUTOROUTE || {}).metro = ({ h, I, O, MAT, LAMPS, slab, quad, tuft, HH, cityY }) => {
  const { S, N, T, THREE } = h, iM = T.t0 - 3, iA = I.station, iB = T.t1, iT = I.tremie, at = (s, d, y) => [s.x - s.tz * d, s.y + y, s.z + s.tx * d], ryOf = s => Math.atan2(s.tx, s.tz);
  const HW = 6.5, H = 5, PQ = 4.1, PB = 8.5, TR = 2.4, up = s => cityY(s.x) - s.y; // half-width, height under the roof, platform edge and back wall, track offset; up: the street above a sample
  // the box: walls, a haunch, the flat roof and a beam across it every 6 m (self-lit in the tones of old concrete, dark: the light is the lamps' and the day's, see scenery-autoroute-vie.js)
  const DS = { side: THREE.DoubleSide, emis: 1 }, WALL = h.mat('tunnelAutoroute', { ...DS, c: 0x74766e }), ROOF = h.mat('tunVouteAutoroute', { ...DS, c: 0x50524c });
  for (const sd of [-1, 1]) { h.ribbon(iM, iA - iM, sd * HW, 0, sd * HW, H - 0.8, WALL, 4); h.ribbon(iM, iA - iM, sd * HW, H - 0.8, sd * (HW - 0.8), H, ROOF, 8); }
  h.ribbon(iM, iB - iM, -(HW - 0.8), H, HW - 0.8, H, ROOF, 8);
  for (let i = iM + 2; i < iB; i += 3) { const s = S[i], [x, y, z] = at(s, 0, H - 0.45); slab('rib', x, y, z, 2 * (i > iA ? PB : HW), 0.45, 0.5, ryOf(s)); }
  // the stop: the hall widens to the back walls of the platforms (tiled), the platforms themselves, a yellow line along their edge; on them benches, the stop's name on the wall, a pole with its sign,
  // a ticket machine, the dark mouth of the stairs to the street; strip lights under the roof
  { const a = iA + 3, n = iB - iA - 6, top = h.mat('trottoirAutoroute', { side: THREE.DoubleSide, rep: [0.75, 1], c: 0xb0b0a8 });
    for (const sd of [-1, 1]) { h.ribbon(a, n, sd * PQ, 0, sd * PQ, 0.3, MAT.concrete); h.ribbon(a, n, sd * PQ, 0.3, sd * PB, 0.3, top, 4); h.ribbon(a, n, sd * (PQ + 0.05), 0.32, sd * (PQ + 0.4), 0.32, MAT.yellow);
      h.ribbon(iA, iB - iA, sd * PB, 0, sd * PB, H, MAT.tile, 8); h.ribbon(iA, iB - iA, sd * (HW - 0.8), H, sd * PB, H, ROOF, 8);
      for (const i of [iA, iB]) { const s = S[i]; quad('tile', at(s, sd * HW, 0), at(s, sd * PB, 0), at(s, sd * PB, H), at(s, sd * HW, H)); }
      for (const i of [a, a + n]) { const s = S[i], [x, y, z] = at(s, sd * (PQ + PB) / 2, 0.3); quad('concrete', at(s, sd * PQ, 0), at(s, sd * PB, 0), at(s, sd * PB, 0.3), at(s, sd * PQ, 0.3)); slab('steel', x, y + 1, z, PB - PQ, 0.1, 0.1, ryOf(s)); slab('stripe', x, y, z, PB - PQ, 0.9, 0.06, ryOf(s)); } // (a guard panel across each end: the end of a platform is a thing one hits)
      for (let i = a + 3, k = sd > 0 ? 0 : 2; i < a + n - 3; i += 5, k++) { const s = S[i], ry = ryOf(s), P = (d, y) => at(s, sd * d, y);
        if (k % 2 === 0) { const [x, y, z] = P(8.1, 0.3); slab('steel', x, y, z, 0.6, 0.5, 3.2, ry); }
        if (k % 3 === 1) { const [x, y, z] = P(PB - 0.08, 2.2); slab('plaque', x, y, z, 0.12, 1.2, 6, ry); }
        if (k % 4 === 1) { const [x, y, z] = P(5, 0.3), [bx, by, bz] = P(5, 2.5); slab('steel', x, y, z, 0.12, 2.9, 0.12, ry); slab('plaque', bx, by, bz, 0.1, 0.5, 1.4, ry); }
        if (k % 4 === 3) { const [x, y, z] = P(7.9, 0.3); slab('stripe', x, y, z, 0.7, 1.7, 0.9, ry); }
        if (k === 3) { const q = S[i + 2], d = sd * (PB - 0.07); quad('hole', at(s, d, 0.3), at(q, d, 0.3), at(q, d, 3), at(s, d, 3)); const [x, y, z] = at(S[i + 1], sd * (PB - 0.1), 3.1); slab('stripe', x, y, z, 0.1, 0.5, 4.4, ry); }
        if (k % 2 === 1) { const [x, y, z] = P(6.3, H - 0.14); slab('lamp', x, y, z, 0.5, 0.1, 4, ry); LAMPS.push([i, x, y - 0.6, z, sd > 0 ? 1 : 2]); } } } }
  // the track bed under cover and in the open trench: ballast from wall to wall, four rails rusted orange that come out of the rubble in the hole; an emergency lamp in its housing on the wall every 14 m, on alternate sides
  h.ribbon(iM, iT - 8 - iM, -HW, 0.03, HW, 0.03, h.mat('ballastAutoroute', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, rep: [2, 1], emis: 1, c: 0xb8b8b0 }), 8);
  const RAILS = [-TR - 0.72, -TR + 0.72, TR - 0.72, TR + 0.72], RAIL = h.mat('carrosserieAutoroute', { side: THREE.DoubleSide, emis: 1, c: 0xb06a3a });
  for (const d of RAILS) { h.ribbon(iM - 12, iT - 8 - iM + 12, d - 0.07, 0.03, d, 0.17, RAIL); h.ribbon(iM - 12, iT - 8 - iM + 12, d, 0.17, d + 0.07, 0.03, RAIL); }
  for (let i = iM + 4, k = 0; i < iA - 2; i += 7, k++) { const s = S[i], sd = k & 1 ? 1 : -1, ry = ryOf(s), [x, y, z] = at(s, sd * (HW - 0.14), 3.3), [fx, fy, fz] = at(s, sd * (HW - 0.06), 3.2); slab('lamp', x, y, z, 0.16, 0.34, 1.9, ry); slab('dark', fx, fy, fz, 0.14, 0.54, 2.3, ry); LAMPS.push([i, ...at(s, sd * (HW - 0.6), 3.3), 0]); }
  // in the street: the rails flush with the roadway, each track on its band of paving, from the top of the ramp past the start and down the boulevard into the water
  { const iW = I.eauA - 3, bed = h.mat('dalleSolAutoroute', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5, c: 0xb4b0a4 }), steel = h.mat('carrosserieAutoroute', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7, c: 0x4a3e34 });
    for (const [a, n] of [[iT - 8, N - iT + 8], [0, iW]]) { for (const sd of [-1, 1]) h.ribbon(a, n, sd * TR - 1.15, 0.02, sd * TR + 1.15, 0.02, bed, 4); for (const d of RAILS) h.ribbon(a, n, d - 0.07, 0.035, d + 0.07, 0.035, steel); } }
  // the overhead wire: one over each track, under the roof, up the trench (struts across it carry them, on posts once the trench is shallow) and along the boulevard between its masts (boxes MAT TRAM), a span wire across at each pair
  { const wire = (a, n, y) => { for (const sd of [-1, 1]) h.ribbon(a, n, sd * TR - 0.05, y, sd * TR + 0.05, y, MAT.dark); }; wire(iM, iT + 4 - iM, 4.6);
    const M = O.filter(o => o.label === 'MAT TRAM'), xs = M.map(o => o.x), i0 = S.findIndex(s => s.x > Math.min(...xs)), i1 = S.findIndex(s => s.x > Math.max(...xs)); wire(i0, i1 - i0, 5.4);
    for (const x of new Set(xs)) { const zs = M.filter(o => o.x === x).map(o => o.z), a = zs.length > 1 ? Math.min(...zs) : Math.min(zs[0], -4), b = zs.length > 1 ? Math.max(...zs) : Math.max(zs[0], 4); slab('dark', x, cityY(x) + 5.45, (a + b) / 2, 0.08, 0.08, b - a); }
    for (let i = iB + 5; i < iT - 3; i += 8) { const s = S[i], ry = ryOf(s), [x, y, z] = at(s, 0, 4.75); slab('steel', x, y, z, 2 * HW + 1.8, 0.2, 0.2, ry);
      if (up(s) + 0.9 < 4.6) for (const sd of [-1, 1]) { const [px, , pz] = at(s, sd * (HW + 0.45), 0); slab('steel', px, s.y + up(s) + 0.9, pz, 0.2, 4.95 - up(s) - 0.9, 0.2, ry); } } }
  // the portal at the north end of the stop: the head beam of the box (its roof is the street), the stop's plate on it, creeper hanging over it
  { const s = S[iB], ry = ryOf(s), [x, y, z] = at(s, 0, H), top = up(s) + 0.9 - H; slab('concrete', x - s.tx * 0.45, y, z - s.tz * 0.45, 2 * HW + 1.8, top, 0.9, ry); slab('plaque', x + s.tx * 0.06, y + 0.35, z + s.tz * 0.06, 5, 1.1, 0.12, ry);
    for (let k = 0; k < 9; k++) { const d = -6 + k * 1.4 + HH(k, 1) * 0.5, l = 0.8 + 2.2 * HH(k, 2), P = (dd, yy) => { const p = at(s, dd, yy); return [p[0] + s.tx * 0.14, p[1], p[2] + s.tz * 0.14]; }; quad(k & 1 ? 'vine' : 'vine2', P(d, H + top - l), P(d + 1, H + top - l), P(d + 1, H + top), P(d, H + top), 4); } }
  // the lids of the open trench: the ground is dug out wider than the trench (level() in scenery-autoroute.js), the square on the inside of the curve and the roadway on the outside are put back at street level, from the top of the walls outward
  { const a = iB - 8, n = iT - a, lid = s => up(s) + 0.1; h.ribbon(a, n, HW + 0.9, lid, 30, lid, MAT.pave, 8); h.ribbon(a, n, -(HW + 0.9), lid, -30, lid, MAT.asphalt, 8); h.ribbon(a, 8, -(HW + 0.9), lid, HW + 0.9, lid, MAT.pave, 8); } // (10 cm proud of the ground: it must not flicker through)
  // the open trench: weeds in the ballast, creeper down the walls of its straight ramp
  for (let i = iB + 2; i < iT; i += 2) { const s = S[i], d = (HH(i, 1) < 0.5 ? -1 : 1) * (0.4 + 5.4 * HH(i, 2)); tuft(s.x - s.tz * d, s.z + s.tx * d, s.y, i); }
  for (const sd of [-1, 1]) for (let i = S.findIndex((s, k) => k > iB && s.x > -398), k = 0; i < iT - 3; i += 2, k++) { if (HH(k, sd) < 0.35) continue; const s = S[i], q = S[i + 1], l = 1 + 3 * HH(k + 3, sd), t = cityY(s.x) + 0.9, P = (p, y) => [p.x - p.tz * sd * (HW - 0.06), y, p.z + p.tx * sd * (HW - 0.06)];
    quad(k & 1 ? 'vine' : 'vine2', P(s, Math.max(s.y, t - l)), P(q, Math.max(q.y, t - l)), P(q, t), P(s, t), 4); }
};
