// "area51" blockout, zone 2: Complexe souterrain B1 (up the fan to +13 m, gate between berms, curved ramp into the mesa, then 850 m under rock at 0 m, 20 m wide). Only this zone's named blocks; the helpers are described in scenery-area51.js.
// Why it is there: the base's research reactor and its labs, dug into the mesa so the rock contains an accident and hides the work (the Black Mesa of Half-Life is the mood: a transit tram on its rail,
// a security lock, a reactor hall, test chambers behind armoured doors, a silo). The road is the complex's own service loop: it bends round the reactor pool, runs the labs cavern, dodges the silo and leaves by the same flank.
(window.AREA51 = window.AREA51 || {}).bunker = ({ S, put, at, box, mute, pk, idx }) => {
  const CONCRETE = 0x8f918c, ROCK = 0x8a5a48, POST = 0x929782, AMBER = 0xf2a23a, STEEL = 0x52616e, CYAN = 0x7fd6dc, GLASS = 0x333f52, WHITE = 0xe8e9df;
  const i0 = idx(1472, 1125), i1 = idx(850, 1220);
  // the rooms along the tube, [first sample, last sample, free width left, free width right (0: no wall, the room goes on), free height]; elsewhere a 24 × 10 m gallery
  const ROOMS = [[idx(1360, 1226), idx(1325, 1228), 20, 20, 12], [idx(1292, 1240), idx(1146, 1218), 26, 0, 26], [idx(1085, 1178), idx(965, 1180), 32, 32, 20], [idx(940, 1190), idx(900, 1212), 14, 40, 30]];
  for (let i = i0, pL = 12, pR = 12; i <= i1; i += 6) { const [, , L, R, clear] = ROOMS.find(r => i >= r[0] && i <= r[1]) || [0, 0, 12, 12, 10], wide = R || 130;
    if (L !== pL) mute(box('B1', CONCRETE, S[i], -(L + pL) / 2 - 3, Math.abs(L - pL) + 6, 34, 4, -2)); if (wide !== pR) mute(box('B1', CONCRETE, S[i], (wide + pR) / 2 + 3, Math.abs(wide - pR) + 6, 34, 4, -2)); pL = L; pR = wide; // where a room opens or closes: the end wall // every 6 samples (about 12 m): rock cap, walls, tram rail
    mute(box('B1', ROCK, S[i], (wide - L) / 2, L + wide + 12, 40, 16, clear)); mute(box('B1', CONCRETE, S[i], -L - 3, 6, clear + 3, 16, -2)); if (R) mute(box('B1', CONCRETE, S[i], R + 3, 6, clear + 3, 16, -2));
    mute(box('RAIL TRAM', AMBER, S[i], -7, 1.2, 0.8, 16, 8.5)); }
  box('PORTAIL EST', CONCRETE, S[i0 - 8], 0, 36, 4, 4, 11); box('PORTAIL OUEST', CONCRETE, S[i1 + 8], 0, 36, 4, 4, 11); // a lintel in front of each mouth
  box('SAS SECURITE', AMBER, S[ROOMS[0][0] + 8], 15, 4, 3, 12, 0); mute(box('SAS SECURITE', AMBER, S[ROOMS[0][0] + 8], -15, 4, 3, 12, 0)); // the lock: two booths in the lobby
  // reactor hall: the vessel in its pool at the centre of the bend, the control room on a gallery of the outer wall, waste casks, a footbridge from the wall to the vessel
  at('REACTEUR', STEEL, 1210, 1262, 34, 20, 34, -0.5); at('PISCINE', CYAN, 1210, 1262, 84, 0.8, 84, -0.5);
  const south = S[idx(1210, 1324)]; box('SALLE DE CONTROLE', GLASS, south, -21, 6, 7, 44, 7); box('PASSERELLE', AMBER, S[idx(1148, 1262)], 22, 70, 1, 3, 13);
  [idx(1254, 1306), idx(1166, 1306)].forEach((i, k) => { const c = box('FUTS DECHETS', AMBER, S[i], -19, 6, 5, 14, 0); if (k) mute(c); });
  // labs cavern: the building on the left, armoured doors and a test chamber on the right, a tram car on the rail
  const m = (ROOMS[2][0] + ROOMS[2][1]) >> 1; box('LABORATOIRE', WHITE, S[m], -23, 14, 12, 70, 0); for (const k of [-22, 22]) box('PORTE BLINDEE', AMBER, S[m + k], 31, 1, 10, 20, 0);
  box('CHAMBRE DE TEST', CYAN, S[m], 24, 12, 9, 22, 0); box('TRAM', WHITE, S[m - 10], -7, 3, 3.5, 12, 5);
  box('SILO', GLASS, S[(ROOMS[3][0] + ROOMS[3][1]) >> 1], 28, 18, 29, 18, 0);                  // the shaft the last dog-leg goes round
  // outside: what a reactor needs and shows. Cooling towers on the mesa, the power line down to the base, the gate between two berms
  at('TOUR DE REFROIDISSEMENT', CONCRETE, 1150, 1440, 44, 50, 44); mute(at('TOUR DE REFROIDISSEMENT', CONCRETE, 1265, 1450, 44, 50, 44));
  [[1540, 1100], [1600, 1045], [1660, 990]].forEach(([x, z], k) => { const p = at('PYLONE HT', STEEL, x, z, 4, 30, 4); if (k) mute(p); }); at('TRANSFORMATEUR', STEEL, 1535, 1150, 20, 6, 14);
  for (const sd of [-1, 1]) put('MERLON', ROCK, pk(1440, 1020), sd, 8, 12, 6, 70);
  put('POSTE DE GARDE', POST, pk(1425, 955), 1, 4, 6, 4, 6);
  at('PUITS VENTILATION', CONCRETE, 1300, 1380, 8, 10, 8); mute(at('PUITS VENTILATION', CONCRETE, 1050, 1300, 8, 10, 8)); // on the mesa, above the halls
};
