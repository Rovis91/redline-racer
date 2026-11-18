// "autoroute", zone 3: L'autoroute (above column 2, heading south). One carriageway is left, 14 m between its parapet (east) and its central barrier (west): the slip road climbs onto it along the east side,
// it rises to 20 m over the boulevard, then its last span has fallen and makes the way down to row 2. The other carriageway has gone: three lengths of it still hang beside the lane, their ends broken off
// (slabs hanging on their bars), and between them its piers stand alone over the street it fell into. Gantries lean over the lane, lamp posts lean from the parapet, the lane lines are still there in places.
// The wrecks, the jack-knifed lorry, the crushed barriers and the fallen lamp post on the deck are solid boxes of the map (M.obst), built by real() in scenery-autoroute.js; the deck's parapets are the road's own walls.
(window.AUTOROUTE = window.AUTOROUTE || {}).pont = ({ h, I, MAT, set, slab, quad, real, HH, cityY, groundY }) => {
  const { S, THREE } = h, i0 = I.rampe, n = I.sol - i0, iF = I.fusion, iT = I.travee, across = h.across, zi = z => { let b = iF; for (let i = iF; i <= I.sol; i++) if (Math.abs(S[i].z - z) < Math.abs(S[b].z - z)) b = i; return b; }, yD = z => z < -211 ? 12 : S[zi(z)].y;
  // the lane's own structure, from the foot of the slip road to the foot of the fallen span: a parapet 0.9 m high on each side (inner face 7 m from the axis), a deck 1.6 m thick; the slip road is a solid ramp
  // (west side, where the other carriageway has gone: the barrier is down to a broken kerb 0.35 m high, bars and lumps of it left standing: the void, the lone piers and the street below show from the lane)
  const WEST = [[-211, -168], [-34, 38], [62, 96]], held = z => z < -128 || (z > -74 && z < 38) || z > 62, hb = sd => s => sd < 0 || held(s.z) ? 0.9 : 0.35;
  for (let z = -124, k = 0; z < 60; z += 5.5, k++) if (!held(z)) { const y = yD(z); if (k % 3 === 0) slab('concrete', 221.1, y, z, 0.5, 0.9, 2.2 + HH(k, 1) * 1.5, (HH(k, 2) - 0.5) * 0.3); for (let j = 0; j < 2; j++) slab('rust', 220.9, y + 0.3, z + 1.5 + j * 1.6, 0.08, 0.5 + HH(k, j) * 0.9, 0.08); }
  for (const sd of [-1, 1]) { h.ribbon(i0, n, sd * 7, 0, sd * 7, hb(sd), MAT.concrete); h.ribbon(i0, n, sd * 7, hb(sd), sd * 7.5, hb(sd), MAT.concrete); h.ribbon(i0, n, sd * 7.5, hb(sd), sd * 7.5, -1.6, MAT.concrete);
    h.ribbon(i0, iF - i0, sd * 7.5, -1.6, sd * 7.5, s => cityY(s.x) - 1 - s.y, MAT.concrete); h.ribbon(i0, n, sd * 5.5, 0.04, sd * 6.95, 0.04, MAT.moss, 8); }           // (moss along the foot of both parapets)
  h.ribbon(i0, n, -7.5, -1.6, 7.5, -1.6, MAT.dark);
  // lane lines: two dashed lines and the two edge lines, worn
  { const m = h.mat('marquageAutoroute', { side: THREE.DoubleSide, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }, 1); for (const d of [-6.2, -2.3, 2.3, 6.2]) h.ribbon(iF - 20, iT - iF + 30, d - 0.11, 0.03, d + 0.11, 0.03, m, 16); }
  // piers every 40 m under the deck (none over a street that crosses under it), an expansion joint over each; the west carriageway's piers stand beside them, bars sticking out of their heads where it has gone
  const on = z => WEST.some(([a, b]) => z > a && z < b);
  for (let i = iF + 6; i < iT; i += 20) { const s = S[i], y0 = groundY(s.x) - 1, top = s.y - 1.6; if (Math.abs(s.z - Math.round(s.z / 110) * 110) < 15) continue;
    slab('concrete', 228, y0, s.z, 9, top - y0, 2.4); slab('concrete', 228, top - 0.9, s.z, 13, 0.9, 3); slab('dark', 228, s.y - 0.02, s.z, 14, 0.05, 0.3);
    slab('concrete', 213, y0, s.z, 9, top - y0, 2.4); slab('concrete', 213, top - 0.9, s.z, 13, 0.9, 3);
    if (!on(s.z)) { for (let k = 0; k < 6; k++) slab('rust', 209 + k * 1.6, top, s.z + (HH(i, k) - 0.5) * 2, 0.1, 0.6 + 1.4 * HH(i, k + 9), 0.1);
      set('dalleAutoroute', 213.5, s.z, { y: top - 0.3, ry: 1.2 + HH(i, 3) * 4, a: [8, 7.5, 0.5] }); } }                                               // (and a stump of its deck still lies tipped on the head of each lone pier, higher than the lane's barrier)
  // what is left of the west carriageway (x = 206 to 220.5): deck, parapet, and at each broken end a slab hanging on its bars and the bars of the one that fell
  // (the first is level, the two others have dropped on their outer side and tip away from the lane, 2.4 and 4.5 m: wrecks have slid down the last one against its parapet)
  WEST.forEach(([a, b], q) => { const ia = zi(a), nb = zi(b) - ia, t = [0, -2.4, -4.5][q]; h.ribbon(ia, nb, 7.5, 0, 21.5, t, h.mat('asphalteAutoroute', { side: THREE.DoubleSide }, '#55585c')); h.ribbon(ia, nb, 7.5, -1.6, 21.5, t - 1.6, MAT.dark);
    h.ribbon(ia, nb, 21.5, t + 0.9, 21.5, t - 1.6, MAT.concrete); h.ribbon(ia, nb, 21, t, 21, t + 0.9, MAT.concrete); h.ribbon(ia, nb, 21, t + 0.9, 21.5, t + 0.9, MAT.concrete);
    // a span of it hinged on its last pier at each broken end towards a gap, its far end down on the street 40 m on: a road going down into the ground beside the lane, a lorry and two cars still on the first
    for (const [z, dir] of q === 0 ? [[b, 1]] : q === 1 ? [[a, -1], [b, 1]] : [[a, -1]]) { const i1 = zi(z), i2 = zi(z + dir * 40), ja = Math.min(i1, i2), drop = s => -Math.min(1, Math.abs(s.z - z) / 40) * (s.y - groundY(213) - 0.6) + t, AS = h.mat('asphalteAutoroute', { side: THREE.DoubleSide }, '#55585c');
      h.ribbon(ja, Math.abs(i2 - i1), 7.6, drop, 21.5, drop, AS); h.ribbon(ja, Math.abs(i2 - i1), 7.6, s => drop(s) - 1.4, 21.5, s => drop(s) - 1.4, MAT.dark); h.ribbon(ja, Math.abs(i2 - i1), 7.6, drop, 7.6, s => drop(s) - 1.4, MAT.concrete); h.ribbon(ja, Math.abs(i2 - i1), 21, drop, 21, s => drop(s) + 0.9, MAT.concrete);
      if (q === 0) { const s1 = S[zi(z + 14)], s2 = S[zi(z + 24)]; set('camionAutoroute', 212, s1.z, { y: s1.y + drop(s1), ry: 0.25, rx: 0.3, a: [0], skin: { ...MAT, body: MAT.rust } }); set('voitureAutoroute', 217, s2.z, { y: s2.y + drop(s2), ry: 2.6, rx: 0.3, a: [1] }); } }
    if (q === 2) for (let k = 0; k < 3; k++) set('voitureAutoroute', 209.5 + k * 0.8, a + 7 + k * 8.5, { y: yD(a + 7 + k * 8.5) - 3.9 + k * 0.25, ry: 0.5 + k * 1.3, rz: -0.31, a: [k] });
    for (const [z, dir] of q === 2 ? [[b, 1]] : []) { const y = yD(z), ang = 0.6 + 0.3 * HH(z, 1), d = 7 + 4 * HH(z, 2);
      slab('concrete', 213.5, y - 1.6, z, 14, 1.6, 0.4); set('dalleAutoroute', 213.5, z + dir * (d / 2) * Math.cos(ang), { y: y - Math.sin(ang) * d - 0.9, ry: dir > 0 ? 0 : Math.PI, a: [9 + 3 * HH(z, 3), d, ang] });
      for (let k = 0; k < 8; k++) slab('rust', 207.5 + k * 1.7, y - 0.9 - HH(z, k) * 0.5, z + dir * 0.9, 0.09, 0.09, 1.8); } });
  // the fallen span: under it and beside it, what came down with it (out of reach behind its parapets); a dark open joint where it broke off the deck
  slab('dark', 228, S[iT].y - 0.01, S[iT].z, 14, 0.05, 0.9); for (let k = 0; k < 7; k++) slab('rust', 222 + k * 2, S[iT].y - 1.2, S[iT].z + 0.8, 0.09, 0.09, 2);
  real('EBOULIS', 13, 3, 26, 228, 2.3, 168);
  // sign gantries over the lane, the first leaning forward, the second with a leg gone, its beam down on the central barrier; lamp posts along the parapet, one in two leaning
  { const sk = t => ({ ...MAT, sign: h.mat('panneauAutoroute', {}, t) }), a = S[zi(-150)], b = S[zi(25)];
    set('portiqueAutoroute', a.x, a.z, { y: a.y, ry: across(a), rx: 0.16, a: [7.7], skin: sk('CENTRE VILLE  2 KM') }); set('portiqueAutoroute', b.x, b.z, { y: b.y - 0.4, ry: across(b), rz: 0.3, rx: -0.08, a: [7.7], skin: sk('PONT SUD  FERME') }); }
  for (let z = -190, k = 0; z <= 110; z += 50, k++) set('lampadaireAutoroute', 236, z, { y: yD(z) - 0.4, ry: Math.PI, a: [k & 1 ? 0.14 + 0.1 * HH(k, 1) : 0] });
  // the motorway beyond both ends of the lane, never reached: north of the slip road the same deck runs on, cut off; south of the fallen span both carriageways stand, their broken end facing the lane
  const deck = (x, y, z, w, d) => { slab('concrete', x, y - 1.6, z, w, 1.6, d); for (const s of [-1, 1]) slab('concrete', x + s * (w / 2 - 0.25), y, z, 0.5, 0.9, d); for (let t = -d / 2 + 20; t < d / 2; t += 40) slab('concrete', x, groundY(x) - 1, z + t, w * 0.6, y - 1.6 - groundY(x) + 1, 2.4); };
  for (let k = 0; k < 6; k++) { const z = -300 + k * 7 + HH(k, 1) * 3, l = 3 + 6 * HH(k, 2); quad(k & 1 ? 'vine' : 'vine2', [235.7, 12.9 - l, z], [235.7, 12.9 - l, z + 1.5 + HH(k, 3) * 2], [235.7, 12.9, z + 1.5 + HH(k, 3) * 2], [235.7, 12.9, z], 4); } // creeper down the flank of the deck the slip road climbs along
  deck(220.75, 12, -320, 29.5, 130); deck(220.75, 12.5, 350, 29.5, 180); slab('concrete', 220.75, 12.5, 350, 1, 0.9, 180);
  for (const [x, w] of [[211, 10], [222, 8], [231, 9]]) set('dalleAutoroute', x, 260 - 3.4, { y: 12.5 - 5.2 - 0.9, ry: Math.PI, a: [w, 8, 0.7] });
};
