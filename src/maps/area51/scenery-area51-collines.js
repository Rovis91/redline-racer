// "area51", zone 4: Crête & périmètre (west up the ridge to +38 m, hairpin round the telemetry pad, down through a road cut, munitions depot, perimeter fence, main gate; 20 m wide). Real scenery (V2).
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-relief.js, -perimetre.js, -radio.js and -dish.js. Why this sector exists: it is the security side of the base.
// The ridge carries the telemetry dish and its relay mast for line of sight over the range (passive: a radar there would deafen D1); the munitions igloos are near the gate, so convoys never cross the base,
// and in the lee of the spur, so the relief shields the hangars; the fence and its watchtowers close the basin; the main gate is where the access road from outside comes in, clear of the lake bed.
(window.AREA51 = window.AREA51 || {}).collines = ({ h, g, MAT, set, on, side, along, surf, cube, smp, edgePt, inside, dish, pk, THREE, k, reg }) => {
  [[520, 472], [295, 425]].forEach(([x, z], i) => side('rocherArea51', pk(x, z), inside(pk(x, z)), 6, 9, { a: [16, 10, 22, i + 3], skin: MAT.rock })); // outcrops the climb and the descent bend round
  surf('concrete', 318, 565, 44, 36, null, 9); dish(310, 560, 0.1); set('mastRelaisArea51', 332, 576); // the telemetry pad fills the inside of the hairpin: the road is its access loop
  [[110, 420, 90, 35, 140], [330, 180, 120, 30, 80], [860, 90, 160, 28, 60]].forEach(([x, z, w, ht, d], i) => set('mesaArea51', x, z, { a: [w, ht, d, i], skin: MAT.rock })); // capped mesas, far from the edges
  // Munitions depot, on the slope the road runs down to the airfield. Its logic is the one of a real ammunition supply point:
  // - north of the road, two rows of earth-covered magazines, all doors facing the same way (south, to the road) so no door ever looks into another; 42 m from axis to axis, 18 m of clear ground between two mounds;
  //   the back row is 62 m behind and shifted half a pitch, so each of its doors looks through a gap of the front row;
  // - each row is served by its own lane behind the guardrail, the two lanes tied at both ends: a truck loads at an apron without ever stopping on the through road;
  // - south of the road, in the strip between it and the climb, the lesser hazard: three open pads, each in a three-sided earth revetment open to the road, 64 m apart, with a floodlight mast between two
  //   (the car climbing to the ridge passes behind their banks: it sees the depot once from outside before it drives through it);
  // - lightning masts and catenaries on every magazine, a fire-water tank and the guard post at the uphill entry, the fence 12 m beyond the last row with a watchtower at each far corner.
  const d0 = pk(440, 380), PITCH = 42, N1 = 7, d1 = d0 + N1 * PITCH, piece = (shape, p, sd, off, half, turn, o) => { const q = side(shape, p, sd, off, half, o); q.rotation.y += turn; return q; };
  const mag = (p, off) => { const q = side('iglooArea51', p, -1, off, 13); q.rotation.y -= 0.45; h.pose('butteArea51', MAT.sol, q, [0, 0, 0]); }; // en echelon: every front is turned 25 degrees up the road, toward the car that comes down
  for (let i = 0; i < N1; i++) { mag(d0 + 20 + i * PITCH, 22); if (i < N1 - 1) mag(d0 + 41 + i * PITCH, 84); }
  // a lane: 7 m of tarmac in 8 m pieces laid on the ground, each tilted to the slope it lies on
  const lane = (p0, p1, off) => { for (let p = p0; p < p1; p += 8) { const s = smp(p), at = q => { const [x, z] = edgePt(smp(q), -1, smp(q).w + off); return [x, g.hAt(x, z), z]; }, [x, y, z] = at(p), a = at(p - 4), b = at(p + 4), ry = h.across(s);
    const m = on('boxMesh', x, y - 0.1, z, ry, { a: [7, 0.5, 8.6], skin: MAT.tarmac }); m.rotation.order = 'YXZ'; m.rotation.x = Math.atan2(b[1] - a[1], Math.hypot(b[0] - a[0], b[2] - a[2])) * (Math.sin(ry) * (b[0] - a[0]) + Math.cos(ry) * (b[2] - a[2]) > 0 ? -1 : 1); } };
  lane(d0 - 4, d1 + 8, 9); lane(d0 - 4, d1 + 8, 71);
  for (const p of [d0 - 8, d1 + 8]) { const s = smp(p), [x, z] = edgePt(s, -1, s.w + 40); on('boxMesh', x, g.hAt(x, z) - 0.1, z, h.across(s), { a: [69, 0.5, 7], skin: MAT.tarmac }); }
  for (let j = 0; j < 3; j++) { const p = d0 + 124 + j * 64; side('alveoleArea51', p, 1, 14, 8); side('merlonArea51', p, 1, 31, 6, { a: [12, 5.5, 32, j], skin: MAT.sol });
    for (const e of [-1, 1]) piece('merlonArea51', p + e * 15, 1, 11, 11, Math.PI / 2, { a: [10, 5, 24, j + 3 + e], skin: MAT.sol }); if (j) side('mastLighting', p - 32, 1, 8, 2.5, { s: 0.5 }); }
  side('gueriteArea51', d0 - 30, 1, 4, 2.2); for (const sd of [-1, 1]) side('barriereArea51', d0 - 22, sd, 0.6, 0.5);
  side('cylArea51', d0 + 50, 1, 10, 6, { a: [6, 7, 10], skin: MAT.white });                                    // fire-water tank, uphill of everything it must reach
  side('panneauArea51', d0 - 60, 1, 3, 2, { keep: 1, skin: { ...MAT, sign: h.mat('written', {}, 64, 32, '#e8c040', '#16181c', 'MUNITIONS', 11) } });
  along('clotureArea51', d0 - 20, d1 + 20, -1, 124, 0.5, 10, { tilt: 1 });
  for (const p of [d0 - 20, d1 + 20]) { for (let off = 9; off < 124; off += 10) piece('clotureArea51', p, -1, off, 5, Math.PI / 2, { a: [10.3] }); side('miradorArea51', p, -1, 118, 2); }
  along('clotureArea51', d1 + 30, pk(940, 380), -1, 60, 0.5, 10, { tilt: 1 });                              // the perimeter fence goes on to the main gate
  side('miradorArea51', pk(900, 380), -1, 52, 2);
  // main gate, at the foot of the descent, between the depot and the airfield: a booth and a raised striped barrier on each side, no narrowing
  const gate = pk(870, 380); for (const sd of [-1, 1]) { side('gueriteArea51', gate, sd, 3, 2.2); side('barriereArea51', gate + 9, sd, 0.6, 0.5); }
  // the signal: a still, soft amber glow behind the western crest, never an object (its pulse is for V3). A half disc whose light falls off from its centre to nothing at its rim: no edge shows
  const gl = new THREE.CircleGeometry(1, 24, 0, Math.PI), uv = gl.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5, Math.min(1, Math.hypot(uv.getX(i) - 0.5, uv.getY(i) - 0.5) * 2));
  const glow = new THREE.Mesh(gl, h.addMat(h.tx('gradient', '#b8824e', 1))); glow.scale.set(420, 300, 1); glow.position.set(-470 * k, 120, 480 * k); glow.rotation.y = Math.PI / 2; glow.userData.dyn = 1; h.scene.add(glow); reg('glow', glow); // its pulse: scenery-area51-vie.js
  // the horizon of the basin: far ranges beyond the playa to the north and behind the near range on the other sides
  [[650, -520, 1100, 150, 0], [1900, -560, 1300, 190, 0], [-330, 700, 900, 150, 1], [1100, 1720, 1400, 160, 0], [2850, 700, 900, 130, 1]].forEach(([x, z, L, ht, turn], i) => set('criteArea51', x, z, { a: [L, ht, 140, i], ry: turn * Math.PI / 2, skin: MAT.far }));
};
