// "area51" blockout, zone 4: Crête & périmètre (west up the ridge to +38 m, hairpin round the telemetry pad, down through a road cut, munitions depot, perimeter fence, main gate; 20 m wide).
// Only this zone's named blocks; the helpers are described in scenery-area51.js. Why this sector exists: it is the base's security side, and each stretch serves something real.
// The ridge carries the telemetry dish and its relay mast for line of sight over the range (passive: a radar there would deafen D1); the munitions igloos are near the gate, so convoys never cross the base,
// and in the lee of the spur, so the relief shields the hangars; the fence and its watchtowers close the basin; the main gate is where the access road from outside comes in, clear of the lake bed.
(window.AREA51 = window.AREA51 || {}).collines = ({ put, at, apex, mute, pk }) => {
  const MESA = 0x97644f, WIRE = 0x708071, POST = 0x929782, VIOLET = 0x5c4b89, GLOW = 0xf2c37b, WHITE = 0xe9ece7, CONCRETE = 0xadb7bb, EARTH = 0x9a7a54, TARMAC = 0x3a424a, STEEL = 0x52616e;
  apex('ROCHER', MESA, pk(520, 472), 16, 9, 22); apex('ROCHER', MESA, pk(295, 425), 16, 10, 22);   // outcrops the climb and the descent bend round
  at('PLATEFORME', CONCRETE, 318, 565, 44, 1, 36); at('ANTENNE TELEMESURE', WHITE, 310, 560, 12, 14, 12); at('MAT RELAIS', STEEL, 332, 574, 2, 22, 2); // the pad fills the inside of the hairpin: the road is its access loop
  at('MESA', MESA, 110, 420, 90, 35, 140); at('MESA', MESA, 330, 180, 120, 30, 80); at('MESA', MESA, 860, 90, 160, 28, 60); // simple volumes, far from the edges
  // munitions depot: earth-covered igloos 40 m apart. North row: doors on the road. South row: 46 m back, so no two doors face each other at less than 70 m. Its own fence and guard hut
  for (let p = pk(500, 277), i = 0; p < pk(720, 225); p += 40, i++) { const a = put('IGLOO MUNITIONS', EARTH, p, -1, 16, 24, 5, 9), b = put('IGLOO MUNITIONS', EARTH, p + 20, 1, 46, 24, 5, 9); mute(b); if (i) mute(a); }
  put('POSTE DEPOT', POST, pk(500, 277) - 30, 1, 4, 5, 3, 5);
  [[560, 255], [700, 228], [840, 220]].forEach(([x, z], i) => { const c = put('CLOTURE PERIMETRE', WIRE, pk(x, z), -1, 60, 1, 3, 140); if (i) mute(c); }); // the fence, outside the depot and the perimeter road
  [[700, 228], [840, 220]].forEach(([x, z], i) => { const c = put('MIRADOR', POST, pk(x, z), -1, 52, 4, 14, 4); if (i) mute(c); });
  // main gate, where the access road meets the perimeter road: two booths and a beam, no narrowing; the inspection pad is inside the bend that follows
  for (const sd of [-1, 1]) put('GUERITE', POST, pk(905, 224), sd, 3, 5, 4, 5);
  put('POSTE PRINCIPAL', POST, pk(905, 224), 1, -26, 32, 1.5, 3, 8.5); at("ROUTE D'ACCES", TARMAC, 880, 95, 10, 0.5, 220); apex('AIRE DE CONTROLE', CONCRETE, pk(1000, 272), 30, 0.5, 24, 6);
  at('SIGNAL DISTANT', GLOW, -40, 300, 24, 24, 24, 150);                                    // the ambiguous glow above the western range
  // the horizon of the basin: far mountains as big volumes, beyond the playa to the north and behind the range on the other sides
  for (const [x, z, w, ht, d] of [[650, -520, 1100, 150, 120], [1900, -560, 1300, 190, 120], [-330, 700, 120, 150, 900], [1100, 1720, 1400, 160, 120], [2850, 700, 120, 130, 900]]) at('MONTAGNES', VIOLET, x, z, w, ht, d);
};
