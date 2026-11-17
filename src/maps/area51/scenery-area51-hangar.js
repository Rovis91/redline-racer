// "area51" blockout, zone 2: Hangars (apron lane in front of H3 and H2, chicane in the fire alley, then H1 crossed east to west; +2 to +4 m, 20 m wide). Only this zone's named blocks; at() and mute() are described in scenery-area51.js.
// The row faces the runway. H1 is a 300 × 110 m maintenance hall with a door in each gable: four airframes are docked nose to the wall, alternately north and south every 70 m, and the tow lane weaves between their tails.
(window.AREA51 = window.AREA51 || {}).hangar = ({ at, mute }) => {
  const OLIVE = 0x757a68, DARK = 0x282f39, SAND = 0xc5bca8, AMBER = 0xf2ca7e, BROWN = 0x8a6e57, WHITE = 0xe8e9df, CONCRETE = 0xa39c84;
  at('H1', OLIVE, 1710, 822, 300, 26, 6); at('H1', OLIVE, 1710, 938, 300, 26, 6); at('H1 HALL', DARK, 1710, 880, 300, 5, 122, 26); // long walls and roof (22 m clear)
  mute(at('DALLE', DARK, 1710, 880, 300, 1.3, 110, 2.5));                                      // the hall floor, flush under the lane
  for (const x of [1860, 1560]) { for (const z of [842, 918]) mute(at('H1', OLIVE, x, z, 4, 26, 36)); mute(at('H1', OLIVE, x, 880, 4, 10, 40, 16)); } // gables: a 40 × 12 m door on the axis
  [[1795, 910], [1725, 850], [1655, 910], [1585, 850]].forEach(([x, z], i) => { at('CELLULE ' + (i + 1), WHITE, x, z, 28, 7, 44, 6); mute(at('DOCK', AMBER, x, z, 34, 6, 30)); }); // an airframe on its dock, tail toward the lane
  at('H2', OLIVE, 2040, 880, 120, 20, 100); at('H3', OLIVE, 2180, 880, 120, 20, 100);         // the rest of the row, east of the fire alley the chicane takes
  for (const [x, z] of [[1885, 820], [1930, 905]]) at('STOCK', BROWN, x, z, 8, 4, 8);          // in the alley, off the line
  at('ATELIERS', SAND, 1710, 995, 200, 8, 30); at('PARC VEHICULES', SAND, 1960, 1000, 140, 0.5, 50); // back shops and motor pool, across the service road behind the row
  at("CHATEAU D'EAU", CONCRETE, 1650, 1090, 12, 26, 12);                                      // on the first rise above the base
};
