// "lune", zone 4: Grand cratère oriental (PK 3080 to 3960): the jump from the rim (73 m) to the floor (-30 m), the arena (M.place: a flat floor Ø 400 m with its small craters, M.dents, and the foot of the wall, M.bowls)
// and its only way out: the tunnel (M.tun), which leaves from the edge of the floor straight ahead of the jump and goes into the wall as a covered way: lip, centre and tunnel are on one line. No road, beacon or light on the floor.
// The crater (Ø 720 m), its strata, its crest and the small craters are terrain and rings (scenery-lune.js). by(), add() and stand() are described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).arene = ({ by, add, stand, MAT }) => {
  add(by(3636, 0), 'portiqueLune', [20, 9, 'shell']);                                          // the mouth of the tunnel: a plain ivory frame
  { const grp = stand(359, 147, 0.3); add(grp, 'cylindreLune', [20, 4], [0, 0, 0], MAT.shell); add(grp, 'moduleLune', [20, 4]); add(grp, 'coupoleLune', [8, 8], [14, 0, 2], MAT.shell); add(grp, 'antenneLune', [18], [-9, 0, -4]); } // the study station on the far rim, above the tunnel: it gives the scale of the crater
};
