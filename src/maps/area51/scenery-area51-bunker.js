// "area51" blockout, zone 2: Complexe souterrain B1 (up the fan to +9 m, gate between berms, then a curved ramp that dives at 10 % under the mesa: 850 m underground, 18 m below the mesa foot, 20 m wide). Only this zone's named blocks; the helpers are described in scenery-area51.js.
// Why it is there: the base's research reactor and its labs, dug into the mesa so the rock contains an accident and hides the work (the Black Mesa of Half-Life is the mood: a transit tram on its rail,
// a security lock, a reactor hall, test chambers behind armoured doors, a silo). The road is the complex's own service loop: it bends round the reactor pool, runs the labs cavern, dodges the silo and leaves by the same flank.
(window.AREA51 = window.AREA51 || {}).bunker = ({ g, S, put, at, box, apex, mute, pk, idx, t0: i0, t1: i1, rooms: ROOMS, room }) => {
  const CONCRETE = 0x8f918c, ROCK = 0x8a5a48, POST = 0x929782, AMBER = 0xf2a23a, STEEL = 0x52616e, CYAN = 0x7fd6dc, BLUE = 0x4fb8ff, GLASS = 0x333f52, WHITE = 0xe8e9df;
  const { edgePt } = PLACERS;
  // the rooms (ROOMS in scenery-area51.js) are cut in the ground; here their shell: every 6 samples (about 12 m) a rock cap from the ceiling up to the surface, the walls, the tram rail
  for (let i = i0, pL = 12, pR = 12; i <= i1; i += 6) { const [, , L, wide, clear, R] = room(i), s = S[i], surf = Math.min(g.hAt(...edgePt(s, -1, L + 30)), g.hAt(...edgePt(s, 1, wide + 30)));
    if (L !== pL) mute(box('B1', CONCRETE, S[i], -(L + pL) / 2 - 3, Math.abs(L - pL) + 6, 34, 4, -2)); if (wide !== pR) mute(box('B1', CONCRETE, S[i], (wide + pR) / 2 + 3, Math.abs(wide - pR) + 6, 34, 4, -2)); pL = L; pR = wide; // where a room opens or closes: the end wall
    const cap = Math.max(4, surf - s.y - clear + 1); mute(box('B1', ROCK, s, (wide - L) / 2, L + wide + 30, cap, 16, clear)); mute(box('B1', 0xd69a72, s, (wide - L) / 2, L + wide + 32, 1, 17, clear + cap)); // the cap ends in a lid of the ground's colour: from outside only the mesa shows mute(box('B1', CONCRETE, S[i], -L - 3, 6, clear + 3, 16, -2)); if (R) mute(box('B1', CONCRETE, S[i], wide + 3, 6, clear + 3, 16, -2));
    mute(box('RAIL TRAM', AMBER, S[i], -7, 1.2, 0.8, 16, 8.5)); }
  box('PORTAIL EST', CONCRETE, S[i0 - 8], 0, 36, 4, 4, 11); box('PORTAIL OUEST', CONCRETE, S[i1 + 8], 0, 36, 4, 4, 11); // a lintel in front of each mouth
  for (const i of [ROOMS[0][0] + 2, i1 - 30]) box('PORTIQUE DECONTAMINATION', AMBER, S[i], 0, 26, 1.2, 3, 8); // a monitoring arch at each lock
  box('SAS SECURITE', AMBER, S[ROOMS[0][0] + 8], 15, 4, 3, 12, 0); mute(box('SAS SECURITE', AMBER, S[ROOMS[0][0] + 8], -15, 4, 3, 12, 0)); // the lock: two booths in the lobby
  // reactor hall: the vessel in its pool at the centre of the bend, the control room on a gallery of the outer wall, waste casks, a footbridge from the wall to the vessel
  at('REACTEUR', STEEL, 1210, 1262, 30, 24, 30, -25); at('PISCINE', BLUE, 1210, 1262, 84, 0.8, 84, -25); at('PONT POLAIRE', AMBER, 1210, 1262, 104, 2, 6, 2); // the pool glows blue 6 m below the gallery the road runs on; the polar crane spans the hall
  const south = S[idx(1210, 1324)]; box('SALLE DE CONTROLE', GLASS, south, -21, 6, 7, 44, 7); box('PASSERELLE', AMBER, S[idx(1148, 1262)], 22, 70, 1, 3, 13);
  [idx(1254, 1306), idx(1166, 1306)].forEach((i, k) => { const c = box('FUTS DECHETS', AMBER, S[i], -19, 6, 5, 14, 0); if (k) mute(c); });
  // labs cavern: the building on the left, armoured doors and a test chamber on the right, a tram car on the rail
  const m = (ROOMS[2][0] + ROOMS[2][1]) >> 1; box('LABORATOIRE', WHITE, S[m], -23, 14, 12, 70, 0); for (const k of [-22, 22]) box('PORTE BLINDEE', AMBER, S[m + k], 31, 1, 10, 20, 0);
  box('CHAMBRE DE TEST', CYAN, S[m], 24, 12, 9, 22, 0); box('TRAM', WHITE, S[m - 10], -7, 3, 3.5, 12, 5);
  box('SILO', GLASS, S[(ROOMS[3][0] + ROOMS[3][1]) >> 1], 28, 18, 29, 18, 0);                  // the shaft the last dog-leg goes round
  // outside: what a reactor needs and shows. Cooling towers on the mesa, the power line down to the base, the gate between two berms
  at('CHEMINEE', CONCRETE, 1300, 1350, 4, 60, 4); at('FILTRES', CONCRETE, 1328, 1350, 20, 8, 12); at('CHEVALEMENT', STEEL, 930, 1268, 8, 18, 8); // on the mesa, beside the hall and the silo below: all that shows of B1 from outside, with the two portals
  at('BASSIN DE SECOURS', BLUE, 1200, 1420, 40, 0.6, 25); at('AEROREFRIGERANT', CONCRETE, 1285, 1440, 30, 14, 16); // a research reactor has a low cooler and a pond, not hyperbolic towers
  [[1540, 1100], [1600, 1045], [1660, 990]].forEach(([x, z], k) => { const p = at('PYLONE HT', STEEL, x, z, 4, 30, 4); if (k) mute(p); }); at('TRANSFORMATEUR', STEEL, 1535, 1150, 20, 6, 14);
  for (const sd of [-1, 1]) put('MERLON', ROCK, pk(1440, 1020), sd, 8, 12, 6, 70);
  put('POSTE DE GARDE', POST, pk(1425, 955), 1, 4, 6, 4, 6); for (const p of [pk(1450, 905), pk(1425, 955)]) apex('CHICANE BETON', CONCRETE, p, 3, 1.2, 14, 1); // anti-ram serpentine: the S is the guard post's
  at('PUITS VENTILATION', CONCRETE, 1300, 1380, 8, 10, 8); mute(at('PUITS VENTILATION', CONCRETE, 1050, 1300, 8, 10, 8)); // on the mesa, above the halls
};
