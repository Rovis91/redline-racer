// "autoroute", zone 5: Le metro. A single-track tube 7 m wide (the width of two cars) and 5.2 m to the crown, from the cave under row 2 (x = 66) west under the street, round to the north,
// through a station (a platform on the east side, 6 m deep: its edge is the wall of the lane), round to the east, and up the line's own ramp: the tube ends at a portal (x = -405) and the ramp climbs
// in an open trench along the south side of the boulevard, beside it, to street level (x = -365), where the lane crosses the forecourt back onto the boulevard.
// The tube's walls are the road's own walls (M.wide 3.6); the trench's walls are solid boxes of the map (MUR TREMIE, built by real() in scenery-autoroute.js). th.tun.without 'walls': the engine only lays the floor and the lights.
(window.AUTOROUTE = window.AUTOROUTE || {}).metro = ({ h, I, MAT, BODIES, LAMPS, set, slab, quad, tuft, HH }) => {
  const { S, T, THREE } = h, iM = T.t0 - 3, at = (s, d, y) => [s.x - s.tz * d, s.y + y, s.z + s.tx * d];
  // the station: the samples of the northward run, from 8 m after the first bend to 8 m before the second
  const iA = S.findIndex((s, i) => i > T.t0 && s.x < -463.9 && s.z < 172), iB = S.findIndex((s, i) => i > iA && s.z < 74);
  // the tube: a wall 3 m high and half a vault in three facets on each side; in the station the east side opens onto the platform
  // (no light from the engine's fixtures in a tube this low: walls and vault are self-lit, in the tones of old concrete: dark, the lamps and the daylight at both ends stand out)
  const DS = { side: THREE.DoubleSide, emis: 1 }, WALL = h.mat('tunnelAutoroute', { ...DS, c: 0x74766e }), ARCH = h.mat('tunVouteAutoroute', { ...DS, c: 0x50524c }); // dark: the light is the lamps' (LAMPS: every lamp drawn here is a real light, set by scenery-autoroute-vie.js)
  const V = [[3.5, 0], [3.5, 3], [2.6, 4.3], [1.2, 5.05], [0, 5.2]], side = (i0, n, sd) => { for (let k = 0; k < 4; k++) h.ribbon(i0, n, sd * V[k][0], V[k][1], sd * V[k + 1][0], V[k + 1][1], k ? ARCH : WALL, k ? 8 : 4); };
  for (const sd of [-1, 1]) { side(iM, iA - iM, sd); side(iB, T.t1 - iB, sd); }
  { const n = iB - iA, lit = h.mat('trottoirAutoroute', { side: THREE.DoubleSide, rep: [0.75, 1], c: 0xb0b0a8 });
    h.ribbon(iA, n, 3.5, 0, 3.5, 1.1, MAT.concrete); h.ribbon(iA, n, 3.5, 1.1, 9.5, 1.1, lit, 4); h.ribbon(iA, n, 3.55, 1.12, 3.95, 1.12, MAT.yellow); h.ribbon(iA, n, 9.5, 5.2, 9.5, 1.1, MAT.tile, 8); h.ribbon(iA, n, 0, 5.2, 9.5, 5.2, MAT.vault, 8);
    for (const i of [iA, iB]) { const s = S[i]; quad('tile', at(s, 3.5, 0), at(s, 9.5, 0), at(s, 9.5, 5.2), at(s, 3.5, 5.2)); quad('vault', at(s, 3.5, 5.2), at(s, 3.5, 3), at(s, 2.6, 4.3), at(s, 1.2, 5.05)); }
    // on the platform: a row of tiled columns, benches and the station's enamel plates on the back wall, strip lights on the ceiling (two in three dead), grass in the joints
    for (let i = iA + 4, k = 0; i < iB - 2; i += 4, k++) { const s = S[i], [x, y, z] = at(s, 5.2, 1.1); slab('tile', x, y, z, 0.7, 4.1, 0.7);
      if (k % 3 === 1) { const [bx, by, bz] = at(s, 9, 1.1); slab('steel', bx, by, bz, 0.9, 0.5, 3.4); } if (k % 4 === 2) { const [px, py, pz] = at(s, 9.4, 2.6); slab('plaque', px, py, pz, 0.15, 2, 8); }
      if (k % 3 === 0) { const [lx, ly, lz] = at(s, 6.8, 5.05); slab('lamp', lx, ly, lz, 0.5, 0.1, 4); LAMPS.push([i, lx, ly - 0.6, lz, 1]); } } }
  // the second track, on the west side of the station: a bay 4.8 m deep with its own rails, and the train that never left, four cars stopped along the lane. Its flank is the wall of the lane (M.wide 3.6: the cars stand 3.65 m from the axis),
  // each car set on the track at its own place (the station climbs in its northern half). Both ends of the bay: a tiled wall, the black mouth of the second tube in it
  { const n = iB - iA, D2 = -5.05, RAIL2 = h.mat('carrosserieAutoroute', { side: THREE.DoubleSide, emis: 1, c: 0x8a5a36 });
    h.ribbon(iA, n, -8.3, 0.03, -3.5, 0.03, h.mat('ballastAutoroute', { side: THREE.DoubleSide, rep: [0.7, 1], emis: 1, c: 0xa8a8a0 }), 8); h.ribbon(iA, n, -8.3, 0, -8.3, 5.2, MAT.tile, 8); h.ribbon(iA, n, -8.3, 5.2, 0, 5.2, MAT.vault, 8);
    for (const d of [-0.72, 0.72]) { h.ribbon(iA, n, D2 + d - 0.05, 0.16, D2 + d + 0.05, 0.16, RAIL2); h.ribbon(iA, n, D2 + d + 0.05, 0, D2 + d + 0.05, 0.16, RAIL2); }
    for (const i of [iA, iB]) { const s = S[i]; quad('tile', at(s, -3.5, 0), at(s, -8.3, 0), at(s, -8.3, 5.2), at(s, -3.5, 5.2)); quad('vault', at(s, -3.5, 5.2), at(s, -3.5, 3), at(s, -2.6, 4.3), at(s, -1.2, 5.05));
      const e = i === iA ? 0.06 : -0.06, q = S[i + (i === iA ? 1 : -1)], o = [(q.x - s.x) * e * 0.5, 0, (q.z - s.z) * e * 0.5], pt = (d, y) => at(s, d, y).map((v, k) => v + o[k]); quad('hole', pt(-3.7, 0), pt(-6.6, 0), pt(-6.6, 4.1), pt(-3.7, 4.1)); }
    for (let k = 0; k < 4; k++) { const i = iA + 6 + k * 9, s = S[i], [x, y, z] = at(s, D2, 0.05); set('rameAutoroute', x, z, { y, ry: Math.atan2(s.tx, s.tz), rx: -Math.atan2(S[i + 4].y - S[i - 4].y, 16), a: [1], skin: { ...MAT, body: BODIES[1] } }); }
    for (let i = iA + 4, k = 0; i < iB - 2; i += 12, k++) { const [lx, ly, lz] = at(S[i], -6.9, 5.05); slab('lamp', lx, ly, lz, 0.5, 0.1, 4); LAMPS.push([i, lx, ly - 0.6, lz, 2]); } }
  // the track: ballast and sleepers from the mouth of the tube to the top of the ramp, two rails that come out of the rubble in the cave and end under the weeds of the ramp; rails rusted orange; a lamp in its housing on the wall every 14 m, on alternate sides
  h.ribbon(iM, I.tremie - iM, -3.5, 0.03, 3.5, 0.03, h.mat('ballastAutoroute', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, rep: [1, 1], emis: 1, c: 0xb8b8b0 }), 8);
  const RAIL = h.mat('carrosserieAutoroute', { side: THREE.DoubleSide, emis: 1, c: 0xb06a3a }); for (const d of [-0.72, 0.72]) { h.ribbon(iM - 12, I.tremie - 6 - iM + 12, d - 0.05, 0.16, d + 0.05, 0.16, RAIL); h.ribbon(iM - 12, I.tremie - 6 - iM + 12, d - 0.05, 0, d - 0.05, 0.16, RAIL); h.ribbon(iM - 12, I.tremie - 6 - iM + 12, d + 0.05, 0, d + 0.05, 0.16, RAIL); }
  for (let i = iM + 4, k = 0; i < T.t1 - 3; i += 7, k++) { if (i > iA - 4 && i < iB + 4) continue; const s = S[i], sd = k & 1 ? 1 : -1, ry = Math.atan2(s.tx, s.tz), [x, y, z] = at(s, sd * 3.36, 3.05), [fx, fy, fz] = at(s, sd * 3.44, 2.95); slab('lamp', x, y, z, 0.16, 0.34, 1.9, ry); slab('dark', fx, fy, fz, 0.14, 0.54, 2.3, ry); LAMPS.push([i, ...at(s, sd * 2.9, 3.05), 0]); } // (each in its housing)
  // the portal: a concrete head wall round the mouth of the tube, the station's plate on it, creeper hanging over it; the tube's roof behind it is the pavement of the forecourt
  { const s = S[T.t1], x = s.x; slab('concrete', x - 0.4, s.y + 5.2, 24, 0.9, 1.4, 7.2); slab('plaque', x + 0.1, s.y + 5.35, 24, 0.12, 1.1, 5);
    for (let k = 0; k < 6; k++) { const z = 20.6 + k * 1.15 + HH(k, 1) * 0.4, l = 1 + 2.4 * HH(k, 2); quad(k & 1 ? 'vine' : 'vine2', [x + 0.2, s.y + 6.6 - l, z], [x + 0.2, s.y + 6.6 - l, z + 0.9], [x + 0.2, s.y + 6.6, z + 0.9], [x + 0.2, s.y + 6.6, z], 4); }
    slab('pave', x - 9.6, 2, 24, 18.4, 0.6, 7.2); }
  // the lids of the trench: the ground is dug out wider than the trench (a terrain vertex every 10 m), the boulevard's roadway and pavement north of it and the forecourt south of it are put back as slabs
  slab('asphalt', -393, 1.96, 7.5, 54, 0.5, 11); slab('pave', -393, 1.9, 15.1, 54, 0.6, 4.2); slab('pave', -393, 1.9, 37.3, 54, 0.6, 17.5); slab('asphalt', -361, 1.88, 24, 13, 0.5, 44); // (the last: the forecourt at the top of the ramp)
  // the ramp in the open: weeds between the sleepers and against the walls, a totem of the metro at the top of the ramp on the forecourt side (behind the trench wall, out of reach)
  for (let i = T.t1 + 2; i < I.tremie; i += 2) { const s = S[i], d = (HH(i, 1) < 0.5 ? -1 : 1) * (1.6 + 1.6 * HH(i, 2)); tuft(s.x - s.tz * d, s.z + s.tx * d, s.y, i); }
  slab('steel', -368, 2.5, 29.2, 0.3, 5, 0.3); slab('plaque', -368, 6.6, 29.2, 5, 1.3, 0.2);
  // the trench's walls: a steel railing on each parapet, creeper falling down the concrete, rust runs under the railing posts
  for (const zw of [20.35, 27.65]) { const zr = zw < 24 ? 18.8 : 28.05; slab('steel', -385, 4.4, zr, 40, 0.08, 0.08); for (let x = -404; x <= -366; x += 3.8) slab('steel', x, 3.5, zr, 0.08, 0.95, 0.08);
    for (let k = 0; k < 9; k++) { const x = -403 + k * 4.2 + HH(k, zw) * 2, w = 1 + 2 * HH(k, 2), l = 1.5 + 3.5 * HH(k + 3, zw), zq = zw < 24 ? zw + 0.06 : zw - 0.06; quad(k & 1 ? 'vine' : 'vine2', [x, 3.5 - l, zq], [x + w, 3.5 - l, zq], [x + w, 3.5, zq], [x, 3.5, zq], 4); } }
};
