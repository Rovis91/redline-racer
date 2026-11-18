// "area51", zone 1: Hangars (start on the apron lane in front of H3 and H2, chicane in the fire alley, then H1 crossed east to west; 0 to +1.5 m, 20 m wide). Real scenery (V2).
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-hall.js, -avion.js and -airfield.js.
// The row faces the runway (north) and its hangars are open: the black prototypes are what this base is for, and they are what the player must see. Sizes are set for reading from the lane, larger than the blocks of the blockout.
(window.AREA51 = window.AREA51 || {}).hangar = ({ set, surf, avion, MAT }) => {
  set('hallArea51', 1710, 880, { y: 0, skin: { ...MAT, floor: MAT.solB1 } });                                                     // H1, a 300 × 116 m hall with a door in each gable: its floor is 0.2 m under the lane
  // four prototypes in H1, alternately south and north of the weaving lane, each on a stand outlined in yellow: a needle nose to the wall, the wing along the wall, the arrowhead nose to the lane, a second needle
  const stand = (x, z, w, d) => { for (const sd of [-1, 1]) { surf('yellow', x + sd * w / 2, z, 0.5, d, 1.38, 0.08); surf('yellow', x, z + sd * d / 2, w, 0.5, 1.38, 0.08); } };
  avion('sr71', 1795, 906, { y: 1.3, s: 1.6 }); stand(1795, 906, 34, 56); avion('b2', 1725, 842, { y: 1.3 }); stand(1725, 842, 58, 26);
  avion('f117', 1655, 915, { y: 1.3, s: 1.8, ry: Math.PI }); stand(1655, 913, 30, 42); avion('sr71', 1585, 856, { y: 1.3, s: 1.5, ry: Math.PI }); stand(1585, 854, 32, 52);
  // H2 and H3, open on the apron, east of the fire alley the chicane takes: the wing in H2, two needles in H3, noses out
  set('shedOpenArea51', 2040, 880, { y: 0 }); avion('b2', 2040, 872, { y: 0.4, s: 1.5, ry: Math.PI }); set('shedOpenArea51', 2180, 880, { y: 0 }); for (const x of [2152, 2208]) avion('sr71', x, 880, { y: 0.4, s: 1.5, ry: Math.PI });
  // the apron before the door of H1: three arrowheads parked north of the lane, a needle further west, a tank truck between H2 and H3, containers and a power cart along the wall of H1
  for (const x of [2050, 1975, 1900]) avion('f117', x, 727, { y: -0.2, s: 1.6, ry: Math.PI / 2 }); avion('sr71', 1710, 734, { y: -0.2, s: 1.3, ry: Math.PI / 2 });
  for (const s of ['tractor', 'trailerTank']) set(s, 2110, 802, { ry: Math.PI / 2, y: -0.2 });
  [[1770, 806, 0], [1783, 806, 0], [1776, 806, 2.6], [1800, 806, 0], [1650, 806, 0], [1663, 806, 0]].forEach(([x, z, dy]) => set('container', x, z, { skin: dy ? MAT.amber : MAT.tin, y: -0.2 + 1.3 + dy })); set('groupeArea51', 1725, 804, { y: -0.2 });
  // what the fire-alley chicane goes round: a parked crash tender (tractor and tank trailer of shapes.js, in red) and a foam-monitor island
  const tender = { ...MAT, vat: MAT.red }; for (const s of ['tractor', 'trailerTank']) set(s, 1887, 818, { ry: -0.5, skin: tender });
  set('ilotMousseArea51', 1930, 905);
  set('shedArea51', 1710, 995, { a: [200, 8, 30] }); surf('tarmac', 1960, 1000, 140, 50, null, 3); // back shops and motor pool, across the service road behind the row
  set('waterTower', 1650, 1090, { s: 0.72 });                                                  // on the first rise above the base
};
