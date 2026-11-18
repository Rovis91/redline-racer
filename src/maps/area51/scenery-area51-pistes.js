// "area51", zone 5: Pistes d'essai (from the main gate: controlled crossing of the west runway end, parallel taxiway, west connector, runway A sprint, angled exit, tight right onto the apron). Real scenery (V2).
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-airfield.js, -radio.js, -perimetre.js, -avion.js and -hall.js.
// Bands from north to south, as on a real base: dry lake, runway B, runway A (two runways of the same size, 1200 × 60 m, 260 m apart), parallel taxiway (305 m from the axis of A), apron, then the hangar row.
// Runways, taxiway and apron are tied by connectors: three between the runways, five between runway A and the taxiway; the apron touches the taxiway along its whole length.
// On runway A the race road is the runway itself, full width, without guardrail: nothing marks an edge. The race uses the airfield the way a landing aircraft does:
// taxiway, 90° connector, runway, angled exit back to the taxiway, apron. Nothing tall stands inside the runway strips: radars and aerials are beyond them.
(window.AREA51 = window.AREA51 || {}).pistes = ({ h, MAT, set, side, along, avion, surf, inside, pk, BLOCS, RUNWAY }) => {
  const line = (m, x, z, wx, dz) => surf(m, x, z, wx, dz, -0.12, 0.08); // paint: 8 cm above its slab, still under the roadway
  // paved surfaces, their top 0.2 m under the roadway (the road lies flush on them): runways and taxiways in the tone of the roadway, the apron lighter. Beyond the terrain the playa goes on to the far range as one slab
  surf('playa', 1500, -900, 4400, 1500, -0.7, 1);
  surf('piste', 1700, 380, 1200, 60); surf('piste', 1700, 120, 1200, 60); for (const x of [1130, 1700, 2270]) surf('piste', x, 250, 23, 200);
  surf('piste', 1700, 685, 1200, 23); for (const x of [1130, 1310, 1610, 1850, 2270]) surf('piste', x, 541.5, 23, 263);
  surf('tarmac', 1850, 759.5, 900, 125);                                                       // the apron, from the taxiway to the hangar doors: it carries the start line
  // markings. Runway B: threshold bars at both ends, centreline dashes. Runway A: east threshold, and in the west a displaced threshold (yellow bars) where the road crosses. Yellow centrelines on taxiway, connectors and apron
  for (const [x, z] of [[1125, 120], [2275, 120], [2275, 380]]) for (let j = -5; j <= 5; j++) line('paintW', x, z + j * 4.8, 30, 1.8);
  for (let x = 1230; x < 2200; x += 60) line('paintW', x, 120, 30, 0.9);
  for (const x of [1140, 1200, 1260]) line('yellow', x, 380, 3, 44);
  line('yellow', 1700, 685, 1200, 0.5); for (const x of [1130, 1310, 1610, 1850, 2270]) line('yellow', x, 541.5, 0.5, 263); for (const x of [1130, 1700, 2270]) line('yellow', x, 250, 0.5, 200);
  line('yellow', 1850, 699, 900, 0.6); for (const x of [2040, 2180]) line('yellow', x, 762, 0.6, 126);
  for (const x of [980, 920, 860, 800]) set('rampeArea51', x, 380);                             // approach light bars in the runway axis, west of the crossing
  for (const [x, z] of [[1040, 300], [1040, 465]]) for (const sd of [-1, 1]) side('barriereArea51', pk(x, z), sd, 0.6, 0.5); // the crossing is controlled: raised barrier arms before and after the runway axis
  avion('sr71', 2040, 120, { y: -0.2, s: 2, ry: Math.PI / 2 });                                 // a prototype lined up on runway B, never on the race's
  set('tourArea51', 1480, 800);                                                                // mid-field, on the hangar line: it sees both thresholds and the apron
  set('shedArea51', 1400, 775, { a: [44, 9, 26], skin: { ...MAT, tin: MAT.red } });            // fire station, on the apron edge, a straight run to the taxiway
  for (let x = 1500; x < 2290; x += 152) set('mastLighting', x, 703, { s: 0.75 });             // apron light masts (26 m), between apron and taxiway
  // fuel farm at the end of the apron, off the hangar line, behind a low wall; the tankers come in by their own gate and never cross the flight line
  for (const [x, z] of [[2440, 820], [2490, 820], [2440, 875], [2490, 875]]) set('cylArea51', x, z, { a: [12, 10, 14], skin: MAT.white });
  surf('concrete', 2465, 780, 120, 2, null, 4); set('gueriteArea51', 2570, 752); set('barriereArea51', 2578, 762, { a: [8, 0.1], ry: Math.PI / 2 });
  set('radarArea51', 2050, 590); set('radarArea51', 1450, 580); set('glideArea51', 1390, 545);  // 200 m off the axis, one radar per landing direction
  // what the road goes round on the airfield: the localizer aerial at the taxiway end, the windsock at the angled exit, the blast fence of the fuel-truck stand at the last right
  const round = (shape, x, z, off, half) => side(shape, pk(x, z), inside(pk(x, z)), off, half); round('localizerArea51', 1065, 625, 8, 1); round('mancheArea51', 2030, 440, 8, 0.5); round('pareSouffleArea51', 2285, 715, 6, 2);
  // the bends are drawn in the language of the base. Outside: anti-ram concrete blocks with hazard ends, on the line of the guardrail they replace (scenery-area51.js leaves the rail out there).
  // Inside, on the runway, where nothing else marks an edge: red and white trestles with a cone between two, from the turn-in to the apex and from the apex of the exit to its end
  for (const [a, b, sd] of BLOCS) along('blocBetonArea51', pk(...a), pk(...b), sd, 0, 1, 10);
  const [r0, r1] = RUNWAY.map(p => pk(...p)); for (const [a, b] of [[r0, r0 + 78], [r1 - 96, r1]]) for (let p = a + 3, n = 0; p < b; p += 6, n++) n % 2 ? side('cylArea51', p, 1, 0.5, 0.4, { a: [0.4, 1, 6, 0.25], skin: MAT.amber }) : side('chevaletArea51', p, 1, 0.5, 0.2);
  // braking zone F1, down the exit: announcing boards on both sides, off the roadway
  ['300', '200', '100'].forEach((txt, i) => { const sign = h.mat('written', {}, 64, 32, '#f5aa75', '#16181c', txt, 26); for (const sd of [-1, 1]) side('panneauArea51', pk(2250, 660) - 300 + i * 100, sd, 3, 2, { keep: 1, skin: { ...MAT, sign } }); });
};
