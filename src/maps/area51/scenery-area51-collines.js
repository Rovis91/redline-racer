// "area51" blockout, zone 5: Collines & périmètre (west up the ridge to +38 m, hairpin at the radar pad, down through a road cut, perimeter road along the fence, gate chicane, back onto runway A; 20 m wide).
// Only this zone's named blocks; put(), at() and mute() are described in scenery-area51.js. The radar is on the ridge because it must see over the range; the fence is on the outside of the perimeter road.
(window.AREA51 = window.AREA51 || {}).collines = ({ put, at, mute, pk }) => {
  const MESA = 0x97644f, WIRE = 0x708071, POST = 0x929782, VIOLET = 0x5c4b89, GLOW = 0xf2c37b, WHITE = 0xe9ece7, CONCRETE = 0xadb7bb;
  at('PLATEFORME', CONCRETE, 300, 672, 60, 1, 40); at('RADAR', WHITE, 290, 672, 14, 22, 14); at('RADOME', WHITE, 325, 672, 16, 16, 16); // the pad on the outside of the hairpin
  at('MESA', MESA, 110, 420, 90, 35, 140); at('MESA', MESA, 330, 180, 120, 30, 80); at('MESA', MESA, 860, 90, 160, 28, 60); // simple volumes, far from the edges
  [[640, 238], [780, 218], [890, 222]].forEach(([x, z], i) => { const c = put('CLOTURE PERIMETRE', WIRE, pk(x, z), -1, 14, 1, 3, 120); if (i) mute(c); }); // the fence, outside the perimeter road
  for (const sd of [-1, 1]) put('GUERITE', POST, pk(1000, 272), sd, 3, 5, 4, 5);               // return checkpoint, in the gate chicane: two side booths and a beam, no narrowing
  put('CHECKPOINT', POST, pk(1000, 272), 1, -26, 32, 1.5, 3, 8.5);
  at('SIGNAL DISTANT', GLOW, -40, 300, 24, 24, 24, 150);                                    // the ambiguous glow above the western range
  // the horizon of the basin: far mountains as big volumes, beyond the playa to the north and behind the range on the other sides
  for (const [x, z, w, ht, d] of [[650, -520, 1100, 150, 120], [1900, -560, 1300, 190, 120], [-330, 700, 120, 150, 900], [1100, 1720, 1400, 160, 120], [2850, 700, 120, 130, 900]]) at('MONTAGNES', VIOLET, x, z, w, ht, d);
};
