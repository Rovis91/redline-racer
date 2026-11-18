// "lune", zone 5: Bassin sud (PK 3960 to the base, 18 m wide): out of the tunnel on the basin floor (-28 m), the ramp up its wall (about 8 %), the rim (20 m), the maintenance area,
// then three open airlock frames before the base. The basin (Ø 444 m) and the satellite impact are terrain. by() and add() are described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).bassin = ({ by, add, MAT, LAP }) => {
  for (const pk of [LAP - 1080, LAP - 880]) add(by(pk, -1, 30, [30, 80]), 'terrasseLune', [30, 8, 80, pk], [0, 0, 0], MAT.rock);       // steps of the basin wall, above the ramp
  for (const pk of [LAP - 1280, LAP - 750, LAP - 580]) add(by(pk, -1, 30, [14, 18]), 'rocherLune', [14, 6, 18, pk], [0, 0, 0], MAT.rock);
  add(by(LAP - 470, -1, 26, [26, 40]), 'garageLune'); add(by(LAP - 425, -1, 14, [4, 7]), 'roverLune'); add(by(LAP - 515, -1, 30, [8, 8]), 'citerneLune', [4, 7], [0, 0, 0], MAT.shell); // maintenance area, south-west, off the track
  for (const pk of [LAP - 390, LAP - 350, LAP - 310]) add(by(pk, 0), 'portiqueLune', [20, 11, 'amber']);                              // three open frames across the road
  for (let pk = LAP - 560; pk < LAP - 160; pk += 80) for (const sd of [-1, 1]) add(by(pk, sd, 1.5, [1, 1]), 'baliseLune', [3.5]);    // the beacons return with the garage
};
