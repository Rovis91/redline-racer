// "area51" blockout, zone 5: Pistes d'essai (from the main gate: controlled crossing of the west runway end, parallel taxiway, west connector, runway A sprint, angled exit, tight right onto the apron).
// Only this zone's named blocks; the helpers are described in scenery-area51.js.
// Bands from north to south, as on a real base: dry lake, runway B, runway A (two runways of the same size, 1200 × 60 m, 260 m apart), parallel taxiway (305 m from A's axis), apron, then the hangar row.
// Runways, taxiway and apron are tied by connectors, as on any airfield: three between the runways, five between runway A and the taxiway; the apron touches the taxiway along its whole length.
// On runway A the race road is the runway itself, full width, without guardrail: nothing marks an edge. The race uses the airfield the way a landing aircraft does:
// taxiway, 90° connector, runway, angled exit back to the taxiway, apron. Nothing tall stands inside the runway strips: radars and aerials are beyond them.
(window.AREA51 = window.AREA51 || {}).pistes = ({ put, at, apex, mute, pk }) => {
  const RUNWAY = 0x363e48, WHITE = 0xe8e2d7, AMBER = 0xf5aa75, CONCRETE = 0xa39c84, GLASS = 0x333f52, PLAYA = 0xe8d9b7, RED = 0xb5483c, STEEL = 0x52616e, YELLOW = 0xf2c84a;
  const slab = (label, x, z, wx, dz, quiet) => { const b = at(label, RUNWAY, x, z, wx, 1.3, dz, -1.5); return quiet ? mute(b) : b; }; // paved surface, its top 0.2 m under the roadway: the road lies flush on it
  at('LAC ASSECHE', PLAYA, 1825, -240, 1850, 0.6, 520, -0.9);                                // the playa: the pale flat the runways are built on the edge of, and the emergency landing ground
  slab('PISTE A', 1700, 380, 1200, 60, true); at('PISTE A', YELLOW, 1700, 425, 6, 2, 2);     // runway A in the colour of the roadway; its name on a marker beside it, not on the road
  slab('PISTE B', 1700, 120, 1200, 60);                                                      // the twin runway, on the lake side
  [1130, 1700, 2270].forEach((x, i) => slab('BRETELLE', x, 250, 23, 200, i));                 // connectors between the two runways
  slab('TAXIWAY', 1700, 685, 1200, 23); [1130, 1310, 1610, 1850, 2270].forEach((x, i) => slab('BRETELLE', x, 541.5, 23, 263, true)); // the parallel taxiway and its connectors to runway A (the race takes the one at x 1310)
  slab('TARMAC', 1850, 759.5, 900, 125);                                                     // the apron, from the taxiway to the hangar doors: it carries the start line
  [1140, 1200, 1260].forEach((x, i) => { const c = at('SEUIL DECALE', YELLOW, x, 380, 20, 0.2, 50, -0.3); if (i) mute(c); }); // displaced threshold: the west end, where the road crosses, is not landed on
  [980, 920, 860, 800].forEach((x, i) => { const c = at("RAMPE D'APPROCHE", YELLOW, x, 380, 2, 1.5, 30); if (i) mute(c); }); // approach light bars in the runway axis, west of the crossing
  for (const [x, z] of [[1040, 300], [1040, 465]]) put('BARRIERE', RED, pk(x, z), 1, 2, 2, 3, 2); // the crossing is controlled: a barrier arm before and after the runway axis
  at('AVION', WHITE, 2040, 120, 60, 7, 8, 2); at('AILES', WHITE, 2045, 120, 10, 2, 54, 4); at('DERIVE', WHITE, 2014, 120, 10, 11, 2, 9); // the plane lined up on runway B, never on the race's
  at('TOUR DE CONTROLE', CONCRETE, 1480, 800, 14, 34, 14); at('VIGIE', GLASS, 1480, 800, 22, 7, 22, 35);   // mid-field, on the hangar line: it sees both thresholds and the apron
  at('CASERNE POMPIERS', RED, 1400, 775, 44, 9, 26);                                         // on the apron edge, a straight run to the taxiway
  for (let x = 1500, i = 0; x < 2290; x += 152, i++) { const m = at('MAT ECLAIRAGE', STEEL, x, 703, 2, 26, 2); if (i) mute(m); } // apron light masts, between apron and taxiway
  [[2440, 820], [2490, 820], [2440, 875], [2490, 875]].forEach(([x, z], i) => { const c = at('CUVE CARBURANT', WHITE, x, z, 26, 10, 26); if (i) mute(c); }); // fuel farm: at the end of the apron, off the hangar line
  at('MERLON', CONCRETE, 2465, 780, 120, 4, 6); at('PORTE DE SERVICE EST', CONCRETE, 2570, 760, 20, 5, 6); // tankers come in by their own gate: they never cross the flight line
  at('RADAR APPROCHE', WHITE, 2050, 590, 8, 10, 8); mute(at('RADAR APPROCHE', WHITE, 1450, 580, 8, 10, 8)); at('GLIDE', AMBER, 1390, 545, 4, 12, 4); // 200 m off the axis, one per landing direction
  // what the road goes round on the airfield: the localizer aerial at the taxiway end, the windsock at the angled exit, the blast fence of the fuel-truck stand at the last right
  apex('ANTENNE LOCALIZER', AMBER, pk(1065, 625), 20, 4, 3, 8); apex('MANCHE A AIR', AMBER, pk(2030, 440), 2, 8, 2, 8); apex('PARE-SOUFFLE', CONCRETE, pk(2285, 715), 3, 4, 30, 6);
  ['F1 300', 'F1 200', 'F1 100'].forEach((l, i) => { for (const sd of [-1, 1]) put(l, AMBER, pk(2250, 660) - 300 + i * 100, sd, 3, 4, 5, 0.5); }); // braking zone F1, down the exit: announcing panels, off the roadway
};
