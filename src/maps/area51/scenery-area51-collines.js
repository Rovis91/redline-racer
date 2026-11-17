// "area51" blockout, zone 4: Crête & périmètre (west up the ridge to +38 m, hairpin round the radar pad, down through a road cut, munitions depot, perimeter fence, main gate; 20 m wide).
// Only this zone's named blocks; the helpers are described in scenery-area51.js. Why this sector exists: it is the base's security side, and each stretch serves something real.
// The radar is on the ridge because it must see over the range; the munitions igloos are behind the spur, 1.5 km from the hangars, so the relief shields the base; the fence and its watchtowers close the basin;
// the main gate is where the access road from outside meets the airfield.
(window.AREA51 = window.AREA51 || {}).collines = ({ put, at, apex, mute, pk }) => {
  const MESA = 0x97644f, WIRE = 0x708071, POST = 0x929782, VIOLET = 0x5c4b89, GLOW = 0xf2c37b, WHITE = 0xe9ece7, CONCRETE = 0xadb7bb, EARTH = 0x9a7a54, TARMAC = 0x3a424a;
  apex('ROCHER', MESA, pk(520, 472), 16, 9, 22); apex('ROCHER', MESA, pk(295, 425), 16, 10, 22);   // outcrops the climb and the descent bend round
  at('PLATEFORME', CONCRETE, 318, 565, 44, 1, 36); at('RADAR', WHITE, 310, 560, 12, 22, 12); at('RADOME', WHITE, 330, 574, 12, 12, 12); // the radar pad fills the inside of the hairpin: the road is its access loop
  at('MESA', MESA, 110, 420, 90, 35, 140); at('MESA', MESA, 330, 180, 120, 30, 80); at('MESA', MESA, 860, 90, 160, 28, 60); // simple volumes, far from the edges
  // munitions depot: earth-covered igloos in two rows, doors on the road, 34 m apart
  for (let p = pk(500, 277), i = 0; p < pk(720, 225); p += 34, i++) for (const sd of [-1, 1]) { const b = put('IGLOO MUNITIONS', EARTH, p, sd, 16, 24, 5, 9); if (i) mute(b); }
  [[640, 238], [780, 218], [890, 222]].forEach(([x, z], i) => { const c = put('CLOTURE PERIMETRE', WIRE, pk(x, z), -1, 48, 1, 3, 120); if (i) mute(c); }); // the fence, outside the depot and the perimeter road
  [[780, 218], [890, 222]].forEach(([x, z], i) => { const c = put('MIRADOR', POST, pk(x, z), -1, 40, 4, 14, 4); if (i) mute(c); });
  for (const sd of [-1, 1]) put('GUERITE', POST, pk(1000, 272), sd, 3, 5, 4, 5);               // main gate: two booths and a beam, no narrowing
  put('POSTE PRINCIPAL', POST, pk(1000, 272), 1, -26, 32, 1.5, 3, 8.5);
  at("ROUTE D'ACCES", TARMAC, 985, 120, 10, 0.5, 240, -0.3);                                  // the public road that arrives from the playa
  at('SIGNAL DISTANT', GLOW, -40, 300, 24, 24, 24, 150);                                    // the ambiguous glow above the western range
  // the horizon of the basin: far mountains as big volumes, beyond the playa to the north and behind the range on the other sides
  for (const [x, z, w, ht, d] of [[650, -520, 1100, 150, 120], [1900, -560, 1300, 190, 120], [-330, 700, 120, 150, 900], [1100, 1720, 1400, 160, 120], [2850, 700, 120, 130, 900]]) at('MONTAGNES', VIOLET, x, z, w, ht, d);
};
