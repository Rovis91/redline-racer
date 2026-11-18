// "area51", zone 5: Pistes d'essai (from the main gate: controlled crossing of the west runway end, parallel taxiway, west connector, runway A sprint, angled exit, tight right onto the apron). Real scenery (V2).
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-airfield.js, -radio.js, -perimetre.js, -avion.js and -hall.js.
// Bands from north to south, as on a real base: dry lake, runway B, runway A (two runways of the same size, 1200 × 60 m, 260 m apart), parallel taxiway (305 m from the axis of A), apron, then the hangar row.
// Runways, taxiway and apron are tied by connectors: three between the runways, five between runway A and the taxiway; the apron touches the taxiway along its whole length.
// On runway A the race road is the runway itself, full width, without guardrail: nothing marks an edge. The race uses the airfield the way a landing aircraft does:
// taxiway, 90° connector, runway, angled exit back to the taxiway, apron. Nothing tall stands inside the runway strips: radars and aerials are beyond them.
(window.AREA51 = window.AREA51 || {}).pistes = ({ h, S, k, near, kit, THREE, MAT, set, side, along, avion, surf, inside, pk, BLOCS, RUNWAY }) => {
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
  for (let j = -5; j <= 5; j++) if (j) line('paintW', 1116, 380 + j * 4.8, 30, 1.8); for (const sd of [-1, 1]) line('paintW', 1200, 380 + sd * 28.5, 200, 0.9); // A's own threshold keys and edge lines, west of where the road joins it: what the descent looks at
  line('yellow', 1700, 685, 1200, 0.5); for (const x of [1130, 1310, 1610, 1850, 2270]) line('yellow', x, 541.5, 0.5, 263); for (const x of [1130, 1700, 2270]) line('yellow', x, 250, 0.5, 200);
  line('yellow', 1850, 699, 900, 0.6); for (const x of [2040, 2180]) line('yellow', x, 762, 0.6, 126);
  // approach lighting of runway A. The road comes down its axis: from the depot to the bend each bar is cut in two halves that flank the road on 4 m posts, the car runs between them down to the last full bar before the threshold
  set('rampeArea51', 1075, 380); for (let x = 800; x < 960; x += 40) for (const sd of [-1, 1]) side('rampeArea51', pk(x, 380), sd, 3, 7, { a: [14, 4] }).rotation.y += Math.PI / 2;
  for (const x of [1070, 1010, 950, 820, 760]) set('rampeArea51', x, 120);                      // and those of runway B (none where the access road passes)
  // Airfield lighting, static and lit (blue hour: the field is on). The colours are the real code, which is what makes a strip of tarmac read as a runway:
  // white edge lights every 30 m, amber on the last 600 m; a green bar across each threshold and a red one across each end; white lights on the centreline of A every 15 m, alternately red then all red toward its end;
  // blue edge lights every 20 m on the taxiway and the connectors; a PAPI beside A's touchdown zone.
  // Runway lights are inset in the dark pavement, flush (the race drives over them), each with its pool of light on the tarmac (a soft additive disc: it shows on the dark surface, it would not on the pale gravel).
  // Edge and threshold lights, outside the edge line, also carry a small upright glare facing along the runway: lying flat, a lamp 100 m ahead is less than a pixel high at 270 lines and the row would vanish;
  // upright, the two rows hold to the far end, and from the descent, 600 m away, they are what draws the runway. None over the centreline: nothing stands in the car's path. Taxiway lights are raised, on the gravel
  const clear = (x, z, m = 0.6) => { const s = S[near(h, x * k, z * k)]; return Math.hypot(s.x - x * k, s.z - z * k) > s.w + m; }, skins = {}, lit = c => skins[c] = skins[c] || { ...MAT, feu: MAT[c] };
  const HEX = { neon: '#fff2d0', sodium: '#ffb85a', green: '#58f09a', fire: '#ff2030', pool: '#4fb8ff' }, disc = new THREE.CircleGeometry(1, 10), duv = disc.attributes.uv, glow = {}; for (let i = 0; i < duv.count; i++) duv.setXY(i, 0.5, Math.min(1, Math.hypot(duv.getX(i) - 0.5, duv.getY(i) - 0.5) * 2));
  const halo = (c, x, y, z, r, up) => { const m = new THREE.Mesh(disc, glow[c] = glow[c] || h.addMat(h.tx('gradient', HEX[c], 1))); m.rotation[up ? 'y' : 'x'] = up ? Math.PI / 2 : -Math.PI / 2; m.scale.setScalar(r); m.position.set(x * k, y, z * k); kit.add(m); };
  const flush = {}, plate = c => flush[c] = flush[c] || { feu: h.mat('lampObj', { emis: 1, c: new THREE.Color(HEX[c]).getHex(), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }) }; // the roadway is laid with a depth offset: a flush lamp needs a stronger one, or the road hides it at a distance
  const inset = (c, x, z, r = 2.6, ry = 0, up = 0) => { const y = clear(x, z, 0) ? -0.2 : 0; set('feuAxeArea51', x, z, { y: y + 0.01, ry, skin: plate(c) }); halo(c, x, y + 0.04, z, r); if (up) halo(c, x, y + up * 0.8, z, up, 1); }; // on the slab (0.2 m under the roadway) or on the roadway where the race uses it
  const feu = (c, x, z) => { if (clear(x, z)) { set('feuPisteArea51', x, z, { y: -0.6, skin: lit(c) }); halo(c, x, -0.5, z, 2.2); } };
  for (const z of [380, 120]) { for (let x = 1115; x <= 2290; x += 30) for (const sd of [-1, 1]) inset(x > 1700 ? 'sodium' : 'neon', x, z + sd * 29.3, 2.4, 0, 1.2); for (let j = -6; j <= 6; j++) { inset('green', 1103, z + j * 4.4, 2.6, Math.PI / 2, 1.2); inset('fire', 2297, z + j * 4.4, 2.6, Math.PI / 2, 1.2); } }
  for (let x = 1122, n = 0; x < 2290; x += 15, n++) inset(x > 2150 || (x > 2000 && n % 2) ? 'fire' : 'neon', x, 380, 1.8);
  for (let x = 1120; x <= 2290; x += 20) for (const sd of [-1, 1]) feu('pool', x, 685 + sd * 12.3);
  for (const [X, z0, z1] of [[1130, 420, 665], [1310, 420, 665], [1610, 420, 665], [1850, 420, 665], [2270, 420, 665], [1130, 160, 340], [1700, 160, 340], [2270, 160, 340]]) for (let z = z0; z <= z1; z += 20) for (const sd of [-1, 1]) feu('pool', X + sd * 12.3, z);
  set('papiArea51', 1470, 338, { y: -0.6, ry: -Math.PI / 2 });
  for (const [x, z] of [[1040, 470]]) for (const sd of [-1, 1]) side('barriereArea51', pk(x, z), sd, 0.6, 0.5); // the road passes the runway end under control: raised barrier arms
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
