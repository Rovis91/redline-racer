// "area51", zone 1: Hangars (start on the apron lane in front of H3 and H2, chicane in the fire alley, then H1 crossed east to west; 0 to +1.5 m, 20 m wide). Real scenery (V2): every block of the blockout is replaced inside its footprint.
// set() and surf() are described in scenery-area51.js; the shapes are in shapes-area51-hall.js, -avion.js and -airfield.js.
// The row faces the runway (north). H1 is a 300 × 116 m maintenance hall with a door in each gable: four prototype airframes are docked nose to the wall, alternately south and north every 70 m, and the lane weaves between their tails.
(window.AREA51 = window.AREA51 || {}).hangar = ({ set, surf, MAT }) => {
  set('hallArea51', 1710, 880, { y: 0 });                                                     // H1: its floor is 0.2 m under the lane
  [[1795, 905, 0], [1725, 855, Math.PI], [1655, 905, 0], [1585, 855, Math.PI]].forEach(([x, z, ry]) => { set('avionArea51', x, z, { y: 1.3, ry }); set('dockArea51', x, z, { y: 1.3, ry }); }); // prototypes 1 to 4 on their docks, tail toward the lane
  set('shedArea51', 2040, 880, { y: 0 }); set('shedArea51', 2180, 880, { y: 0 });              // H2 and H3, doors on the apron, east of the fire alley the chicane takes
  // what the fire-alley chicane goes round: a parked crash tender (tractor and tank trailer of shapes.js, in red) and a foam-monitor island
  const tender = { ...MAT, vat: MAT.red }; for (const s of ['tractor', 'trailerTank']) set(s, 1887, 818, { ry: -0.5, skin: tender });
  set('ilotMousseArea51', 1930, 905);
  set('shedArea51', 1710, 995, { a: [200, 8, 30] }); surf('tarmac', 1960, 1000, 140, 50, null, 3); // back shops and motor pool, across the service road behind the row
  set('waterTower', 1650, 1090, { s: 0.72 });                                                  // on the first rise above the base
};
