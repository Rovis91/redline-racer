// "lune" blockout, zone 4: Grand cratère oriental (PK 2920 to 3840): the jump from the rim (73 m) to the floor (-30 m), the round arena (M.place, Ø 524 m, driven anywhere, small craters = M.dents)
// and its only way out: the tunnel under the rampart (PK 3680 to 3840, M.tun), whose mouth opens in the rock face at the foot of the wall, straight ahead of the jump: lip, centre and tunnel are on one line. Nothing points to it: no road on the floor, no beacon, no light.
// The crater (Ø 900 m), its strata, its crest and the small craters are terrain and rings (scenery-lune.js). Only this zone's named blocks; far() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).arene = ({ put, over, far }) => {
  const SLATE = 0x526d82, IVORY = 0xe4e3d9;
  for (const sd of [-1, 1]) put('PORTAIL DU TUNNEL', IVORY, 3676, sd, 0, 3, 11, 3); over('PORTAIL DU TUNNEL', IVORY, 3676, 26, 3, 3, 8.5); // the mouth of the tunnel, flush in the rock face: a plain frame, unlit
  far('STATION SCIENTIFIQUE', IVORY, 332, 232, 30, 11, 20); far('COUPOLE', SLATE, 296, 240, 12, 20, 12);   // the study station on the far rim, dead ahead of the jump and above the tunnel: it gives the scale of the crater
};
