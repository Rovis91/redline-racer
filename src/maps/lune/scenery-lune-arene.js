// "lune" blockout, zone 4: Grand cratère oriental (PK 1720 to 2600): the jump from the rim (73 m) to the floor (-30 m), the round arena (M.place, Ø 524 m, driven anywhere, small craters = M.dents)
// and its only way out: the tunnel under the rampart (PK 2480 to 2600, M.tun), at the end of a trench in the south-south-west wall. Nothing points to it: no road on the floor, no beacon, no portal frame.
// The crater (Ø 900 m), its strata, its crest and the small craters are terrain and rings (scenery-lune.js). Only this zone's named blocks; far() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).arene = ({ far }) => {
  const SLATE = 0x526d82, IVORY = 0xe4e3d9;
  far('STATION SCIENTIFIQUE', IVORY, 925, -200, 30, 11, 20); far('COUPOLE', SLATE, 925, -235, 12, 20, 12); // the study station on the far rim, dead ahead of the jump: it gives the scale of the crater
};
