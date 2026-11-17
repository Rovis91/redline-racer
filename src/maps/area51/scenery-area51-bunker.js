// "area51", zone 2: Complexe souterrain B1 (up the fan to +9 m, gate between berms, then a curved ramp that dives at 10 % under the mesa: 850 m underground, 18 m below the mesa foot, 20 m wide). Real scenery (V2).
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-souterrain.js (shell, reactor, plant), -perimetre.js (booths, blocks, berms) and -radio.js (cylinders).
// Why it is there: the research reactor of the base and its labs, dug into the mesa so the rock contains an accident and hides the work. The road is the service loop of the complex: security lock, the gallery round the reactor
// above its pool, the labs cavern with its internal tram, the silo, and out by the same flank. Outside, only the two portals, the stack and the headframe show.
(window.AREA51 = window.AREA51 || {}).bunker = ({ h, g, S, MAT, kit, set, side, seg, cube, surf, inside, pk, idx, t0: i0, t1: i1, rooms: ROOMS, room, edgePt, k }) => {
  // the shell, one section every 8 samples (16 m), longer on the outside of bends: walls, ceiling, rock up to the surface, lights, pipes; the tram rail only from the lock to the labs (it never reaches a portal)
  for (let i = i0, pL = 12, pR = 12; i <= i1; i += 8) { const [, , L, wide, clear, R] = room(i), s = S[i], top = Math.min(g.hAt(...edgePt(s, -1, L + 30)), g.hAt(...edgePt(s, 1, wide + 30))), len = 16.3 * (1 + Math.abs(s.k) * (L + 8));
    if (L !== pL) cube('concrete', s, -(L + pL) / 2 - 3, Math.abs(L - pL) + 6, 34, 4, -2); if (wide !== pR) cube('concrete', s, (wide + pR) / 2 + 3, Math.abs(wide - pR) + 6, 34, 4, -2); pL = L; pR = wide; // where a room opens or closes: the end wall
    seg('galerieArea51', s, 0, 0, { a: [L, wide, clear, Math.max(3, top - s.y - clear - 1.7), R ? 1 : 0, len] });
    if (i >= ROOMS[0][0] && i <= ROOMS[2][1]) seg('railTramArea51', s, -7, 8.5, { a: [clear - 8.9, len] }); }
  seg('portailArea51', S[i0 - 6], 0, 0); seg('portailArea51', S[i1 + 6], 0, 0);
  // security lock: a monitoring arch, two booths, the first tram platform
  const lock = ROOMS[0][0]; seg('portiqueArea51', S[lock + 2], 0, 0); seg('portiqueArea51', S[i1 - 30], 0, 0); for (const sd of [-1, 1]) seg('gueriteArea51', S[lock + 8], sd * 15.5, 0, { a: [4, 10] }); seg('quaiArea51', S[lock + 4], -15, 0, { a: [1] });
  // reactor hall: the vessel in its blue pool 6 m below the gallery the road runs on, the polar crane over it, the control room on the outer wall, waste casks, a footbridge; a concrete wall closes the hall to the north
  set('reacteurArea51', 1210, 1262, { y: -25 }); surf('pool', 1210, 1262, 84, 84, -24.2, 0.8); set('pontPolaireArea51', 1210, 1262, { y: 2 });
  h.pose('boxMesh', MAT.concrete, kit, [1222 * k, -4, 1196 * k], 124, 32, 5);
  seg('salleControleArea51', S[idx(1210, 1324)], -23, 7, { a: [1] }); seg('passerelleArea51', S[idx(1148, 1262)], 22, 13); for (const [x, z] of [[1254, 1306], [1166, 1306]]) seg('futsArea51', S[idx(x, z)], -20, 0);
  // labs cavern: the building on the left with its lit windows, two armoured doors and a test chamber on the right, the second platform and a tram car on the rail
  const m = (ROOMS[2][0] + ROOMS[2][1]) >> 1; seg('laboArea51', S[m], -23, 0, { a: [1] }); for (const d of [-22, 22]) seg('porteBlindeeArea51', S[m + d], 31.4, 0, { a: [-1] });
  seg('chambreTestArea51', S[m], 24, 0, { a: [-1] }); seg('tramArea51', S[m - 10], -7, 8.5); seg('quaiArea51', S[ROOMS[2][1] - 6], -13, 0, { a: [1] });
  seg('cylArea51', S[(ROOMS[3][0] + ROOMS[3][1]) >> 1], 28, -2, { a: [9, 21.5, 10], skin: MAT.dark });   // the silo shaft the last dog-leg goes round
  // on the mesa: the stack (what says reactor from afar), the filter house, the headframe above the silo, the low cooler and its pond, ventilation shafts
  set('cylArea51', 1300, 1350, { a: [3, 60, 8, 0.55], skin: MAT.concrete }); set('boxMesh', 1300, 1350, { a: [1.4, 1.4, 1.4], skin: MAT.fire, dy: 61 }); set('filtresArea51', 1328, 1350); set('chevalementArea51', 930, 1268);
  set('aeroArea51', 1285, 1440); surf('glass', 1200, 1420, 40, 25, null, 2); set('puitsArea51', 1300, 1380); set('puitsArea51', 1050, 1300);
  // the power line down to the base, and the approach: two berms, the guard post and its anti-ram serpentine (the S is its own)
  for (const [x, z] of [[1540, 1100], [1600, 1045], [1660, 990]]) set('pyloneArea51', x, z); set('transfoArea51', 1535, 1150);
  for (const sd of [-1, 1]) side('merlonArea51', pk(1440, 1020), sd, 8, 7, { a: [12, 6, 70, sd + 2], skin: MAT.sol });
  side('gueriteArea51', pk(1425, 955), 1, 4, 2.2); for (const p of [pk(1450, 905), pk(1425, 955)]) side('blocBetonArea51', p, inside(p), 1.2, 1);
};
