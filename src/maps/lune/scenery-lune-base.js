// "lune", zone 1: Base lunaire (the last 450 m of the lap and the first 500 m, 18 to 22 m; road 22 m wide round the line). The start is in the middle of a 300 m straight, inside the start airlock: a hall of four 40 m bays
// over the road, from 50 m before the line to 110 m after it, a door frame at each end (the doors do not move: animation is a later phase). Out of it, the habitat dome on the outside of the first bend.
// by() and add() are described in scenery-lune.js; shapes in shapes-lune-base.js.
(window.LUNE = window.LUNE || {}).base = ({ by, add, MAT, LAP }) => {
  const module = (pk, sd, off, L = 26, r = 4.5) => { const grp = by(pk, sd, off, [r * 2.6, L]); add(grp, 'cylindreLune', [L, r], [0, 0, 0], MAT.shell); add(grp, 'moduleLune', [L, r]); };
  const dome = (pk, sd, off, r, ht) => { const grp = by(pk, sd, off, [r * 2, r * 2], 0, true); add(grp, 'coupoleLune', [r, ht], [0, 0, 0], MAT.shell); add(grp, 'domeLune', [r, ht]); };
  for (const pk of [LAP - 30, 10, 50, 90]) add(by(pk, 0), 'sasLune');                           // the hall
  for (const pk of [LAP - 52, 112]) add(by(pk, 0), 'portiqueLune', [24, 14, 'amber']);          // the frames of its two doors
  dome(200, 1, 26, 35, 30);                                                                     // hero, dead ahead when leaving the hall: on the outside of the first bend, where the technical plan draws it
  dome(330, 1, 60, 23, 20);                                                                     // the greenhouse dome behind it, smaller
  for (const [pk, sd, off] of [[150, 1, 10], [160, -1, 12], [215, -1, 12], [345, -1, 14], [LAP - 130, 1, 12], [LAP - 85, 1, 12]]) module(pk, sd, off); // short cylinders along the road, on both sides and on the way in (none on the crater side past the dome: the ground falls away there)
  add(by(135, -1, 34, [10, 10]), 'tourLune'); add(by(265, -1, 40, [50, 70]), 'hangarLune'); add(by(230, 1, 120, [4, 4]), 'antenneLune'); add(by(LAP - 110, -1, 14, [30, 50]), 'entrepotLune');
  for (const pk of [400, 455]) add(by(pk, -1, 30, [50, 50]), 'champSolaireLune');               // solar fields, set back from the trajectory
  for (const pk of [385, 405, 425]) add(by(pk, 1, 16, [8, 8]), 'citerneLune', [4, 7], [0, 0, 0], MAT.shell);
  { const grp = by(60, -1, 60, [40, 40]); add(grp, 'padLune'); add(grp, 'landerLune', [], [0, 0.6, 0]); }       // the landing pad beside the hall, a descent stage left on it
  add(by(180, -1, 30, [3, 40]), 'tuyauLune'); add(by(300, 1, 8, [3, 40]), 'tuyauLune'); add(by(LAP - 180, 1, 8, [3, 40]), 'tuyauLune'); add(by(40, 1, 22, [3, 60]), 'tuyauLune', [60]); // pipe runs between the buildings
  add(by(350, 1, 30, [4, 4]), 'antenneLune', [24]); for (const pk of [440, 480]) add(by(pk, 1, 10, [3, 3]), 'capteurLune');
  for (let pk = 130; pk <= 490; pk += 40) for (const sd of [-1, 1]) add(by(pk, sd, 1.5, [1, 1]), 'baliseLune', [3.5]); // orange beacons behind the rails: they stop where the rock takes over
};
