// "area51", zone 4: Crête & périmètre (west up the ridge to +38 m, hairpin round the telemetry pad, down through a road cut, munitions depot, perimeter fence, main gate; 20 m wide). Real scenery (V2).
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-relief.js, -perimetre.js, -radio.js and -dish.js. Why this sector exists: it is the security side of the base.
// The ridge carries the telemetry dish and its relay mast for line of sight over the range (passive: a radar there would deafen D1); the munitions igloos are near the gate, so convoys never cross the base,
// and in the lee of the spur, so the relief shields the hangars; the fence and its watchtowers close the basin; the main gate is where the access road from outside comes in, clear of the lake bed.
(window.AREA51 = window.AREA51 || {}).collines = ({ h, MAT, set, side, surf, inside, dish, pk, THREE, k }) => {
  [[520, 472], [295, 425]].forEach(([x, z], i) => side('rocherArea51', pk(x, z), inside(pk(x, z)), 6, 9, { a: [16, 10, 22, i + 3], skin: MAT.rock })); // outcrops the climb and the descent bend round
  surf('concrete', 318, 565, 44, 36, null, 9); dish(310, 560, 0.1); set('mastRelaisArea51', 332, 576); // the telemetry pad fills the inside of the hairpin: the road is its access loop
  [[110, 420, 90, 35, 140], [330, 180, 120, 30, 80], [860, 90, 160, 28, 60]].forEach(([x, z, w, ht, d], i) => set('mesaArea51', x, z, { a: [w, ht, d, i], skin: MAT.rock })); // capped mesas, far from the edges
  // munitions depot: earth-covered igloos 40 m apart. North row: doors on the road. South row: 46 m back, so no two doors face each other at less than 70 m. Its guard hut at the entry
  for (let p = pk(500, 277); p < pk(720, 225); p += 40) for (const [q, sd, off] of [[p, -1, 16], [p + 20, 1, 46]]) { side('butteArea51', q, sd, off, 12, { skin: MAT.sol }); side('iglooArea51', q, sd, off, 12); }
  side('gueriteArea51', pk(500, 277) - 30, 1, 4, 2.2);
  for (const [x, z] of [[560, 255], [700, 228], [840, 220]]) side('clotureArea51', pk(x, z), -1, 60, 0.5, { a: [140] }); // the fence, outside the depot and the perimeter road
  for (const [x, z] of [[700, 228], [840, 220]]) side('miradorArea51', pk(x, z), -1, 52, 2);
  // main gate, where the access road meets the perimeter road: a booth and a raised striped barrier on each side, no narrowing; the inspection pad is inside the bend that follows
  const gate = pk(905, 224); for (const sd of [-1, 1]) { side('gueriteArea51', gate, sd, 3, 2.2); side('barriereArea51', gate + 9, sd, 0.6, 0.5); }
  surf('piste', 880, 95, 10, 220, null, 2); side('boxMesh', pk(1000, 272), inside(pk(1000, 272)), 6, 15, { a: [30, 0.4, 24], skin: MAT.concrete });
  // the signal: a still, soft amber glow behind the western crest, never an object (its pulse is for V3). A half disc whose light falls off from its centre to nothing at its rim: no edge shows
  const gl = new THREE.CircleGeometry(1, 24, 0, Math.PI), uv = gl.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5, Math.min(1, Math.hypot(uv.getX(i) - 0.5, uv.getY(i) - 0.5) * 2));
  const glow = new THREE.Mesh(gl, h.addMat(h.tx('gradient', '#b8824e', 1))); glow.scale.set(420, 300, 1); glow.position.set(-470 * k, 120, 480 * k); glow.rotation.y = Math.PI / 2; h.scene.add(glow);
  // the horizon of the basin: far ranges beyond the playa to the north and behind the near range on the other sides
  [[650, -520, 1100, 150, 0], [1900, -560, 1300, 190, 0], [-330, 700, 900, 150, 1], [1100, 1720, 1400, 160, 0], [2850, 700, 900, 130, 1]].forEach(([x, z, L, ht, turn], i) => set('criteArea51', x, z, { a: [L, ht, 140, i], ry: turn * Math.PI / 2, skin: MAT.far }));
};
