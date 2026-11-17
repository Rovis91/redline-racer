// "area51" blockout, zone 3: Souterrain B1 (up the fan to +13 m, gate between berms, curved ramp into the mesa, then 700 m under rock at 0 m, 20 m wide). Only this zone's named blocks; put(), at(), box() and mute() are described in scenery-area51.js.
// Why it is there: a hardened shelter for the prototypes, dug into the mesa flank like the mountain air bases. Both portals open in the same flank; the entry is curved and each end has a dog-leg so a blast cannot run the gallery,
// and the protected space is the cavern in the middle, with its building and its armoured doors on the side.
(window.AREA51 = window.AREA51 || {}).bunker = ({ S, put, at, box, mute, pk, idx }) => {
  const CONCRETE = 0xa9a8a0, ROCK = 0x8a5a48, POST = 0x929782, AMBER = 0xf2ca7e, STEEL = 0x52616e;
  const i0 = idx(1472, 1125), i1 = idx(850, 1220), c0 = idx(1175, 1168), c1 = idx(1005, 1170); // portals, and the two ends of the cavern
  // the tube: every 6 samples (about 12 m) a rock cap over the road and two walls; 24 × 10 m free in the galleries, 64 × 20 m in the cavern
  for (let i = i0; i <= i1; i += 6) { const cav = i >= c0 && i <= c1, half = cav ? 32 : 12, clear = cav ? 20 : 10;
    mute(box('B1', ROCK, S[i], 0, 2 * half + 12, 40, 16, clear)); for (const sd of [-1, 1]) mute(box('B1', CONCRETE, S[i], sd * (half + 3), 6, clear + 3, 16, -2)); }
  box('PORTAIL EST', CONCRETE, S[i0 - 8], 0, 36, 4, 4, 11); box('PORTAIL OUEST', CONCRETE, S[i1 + 8], 0, 36, 4, 4, 11); // a lintel in front of each mouth
  const m = S[(c0 + c1) >> 1]; box('B1 CAVERNE', STEEL, m, 0, 30, 1, 30, 19);                // its board hangs under the vault, mid-cavern
  box('LABORATOIRE', CONCRETE, m, -23, 14, 12, 70, 0); for (const k of [-30, 30]) box('PORTE BLINDEE', AMBER, S[((c0 + c1) >> 1) + k], 31, 1, 10, 26, 0); // the building on the left, two armoured doors on the right wall
  for (const sd of [-1, 1]) put('MERLON', ROCK, pk(1440, 1020), sd, 8, 12, 6, 70);            // the gate S runs between two berms
  put('POSTE DE GARDE', POST, pk(1425, 955), 1, 4, 6, 4, 6);
  at('PUITS VENTILATION', CONCRETE, 1300, 1290, 8, 10, 8); mute(at('PUITS VENTILATION', CONCRETE, 1050, 1280, 8, 10, 8)); // on the mesa, above the galleries
};
