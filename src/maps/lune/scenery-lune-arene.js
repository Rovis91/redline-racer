// "lune" blockout, zone 4: Grand cratère oriental (PK 3000 to 3920): the jump from the rim (73 m) to the floor (-30 m), the arena (M.place: a flat floor Ø 400 m with its small craters, M.dents, and the foot of the wall, M.bowls, driven up to 50 m above the floor)
// and its only way out: the tunnel under the rampart (PK 3640 to 3920, M.tun), which leaves from the edge of the floor straight ahead of the jump and goes into the wall as a covered way: lip, centre and tunnel are on one line. Nothing points to it: no road on the floor, no beacon, no light.
// The crater (Ø 720 m), its strata, its crest and the small craters are terrain and rings (scenery-lune.js). Only this zone's named blocks; far() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).arene = ({ put, over, far }) => {
  const SLATE = 0x526d82, IVORY = 0xe4e3d9;
  for (const sd of [-1, 1]) put('PORTAIL DU TUNNEL', IVORY, 3636, sd, 0, 3, 11, 3); over('PORTAIL DU TUNNEL', IVORY, 3636, 26, 3, 3, 8.5); // the mouth of the tunnel, a plain frame, unlit
  far('STATION SCIENTIFIQUE', IVORY, 359, 147, 30, 11, 20); far('COUPOLE', SLATE, 323, 155, 12, 20, 12);   // the study station on the far rim, dead ahead of the jump and above the tunnel: it gives the scale of the crater
};
