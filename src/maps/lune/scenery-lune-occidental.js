// "lune", zone 2: Cratère occidental (PK 500 to 1340, 22 to 64 m, 18 m wide): the chicane between two fresh impacts (PK 500 to 800), then the hairpin round the telemetry relay (PK 1086).
// The western crater (Ø 545 m) and the two impacts are terrain. by() and add() are described in scenery-lune.js; shapes in shapes-lune-base.js and shapes-lune-relief.js.
(window.LUNE = window.LUNE || {}).occidental = ({ by, add, MAT, THREE }) => {
  const rock = (shape, pk, sd, off, w, ht, d, m = MAT.rock) => add(by(pk, sd, off, [w, d]), shape, [w, ht, d, pk], [0, 0, 0], m);
  add(by(520, -1, 58, [1, 1]), 'baliseLune'); add(by(640, 1, 34, [1, 1]), 'baliseLune');                  // one beacon on the rim of each fresh impact: the reason for the chicane
  for (const [pk, sd] of [[500, 1], [560, -1], [600, -1], [660, 1], [700, 1]]) rock('rocherLune', pk, sd, 10, 12, 5, 16, MAT.pale); // bright thrown blocks on the outside of each change of direction
  for (const pk of [860, 1000, 1220]) rock('terrasseLune', pk, 1, 70, 30, 6, 90);                         // rock terraces on the inner wall of the crater
  { const grp = by(1086, -1, 24, [14, 14]), dish = new THREE.Group(); add(grp, 'relaisLune'); dish.position.set(2.6, 12.6, 0); dish.rotation.z = 0.9; grp.add(dish); add(dish, 'soucoupeLune', [5.5, 1.8], [0, 0, 0], MAT.dish); } // the relay on the outside of the hairpin, its dish tilted toward the base
  for (const pk of [760, 900, 1040, 1260]) add(by(pk, 1, 5, [3, 3]), 'capteurLune');                      // instruments on the rim, looking into the crater
  for (const pk of [800, 950, 1180, 1300]) rock('rocherLune', pk, -1, 32, 16, 5 + pk % 4, 20);
};
