// "area51", zone 2: Complexe souterrain B1 (up the fan to +9 m, gate between berms, then a curved ramp that dives at 10 % under the mesa: 850 m underground, 18 m below the mesa foot, 20 m wide). Real scenery (V2).
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-souterrain.js (shell, reactor, plant), -perimetre.js (booths, blocks, berms) and -radio.js (cylinders).
// Why it is there: the research reactor of the base and its labs, dug into the mesa so the rock contains an accident and hides the work. The road is the service loop of the complex: an airlock, the gallery round the reactor
// above its pool, the labs cavern, the silo, and out by the same flank. Outside, only the two portals, the stack and the headframe show.
(window.AREA51 = window.AREA51 || {}).bunker = ({ h, g, S, MAT, kit, set, side, seg, cube, surf, pk, idx, t0: i0, t1: i1, rooms: ROOMS, room, edgePt, k, reg }) => {
  const B1 = { ...MAT, concrete: MAT.murB1, dark: MAT.vouteB1, floor: MAT.solB1, rock: MAT.murB1 }; // the mass above the ceiling is concrete too: where a section ends in a room, it shows // the gallery's own wall, ceiling and floor textures
  // the shell, one section every 4 samples (8 m: short enough for the walls to read as curved in the bends), longer on the outside of bends, each set a few centimetres off its neighbours (no two faces in one plane): walls, ceiling, rock up to the surface, lights, pipes
  for (let i = i0, n = 0, pL = 12, pR = 12, pC = 10; i <= i1; i += 4, n++) { const [, , L, wide, clear, R] = room(i), s = S[i], top = Math.min(g.hAt(...edgePt(s, -1, L + 30)), g.hAt(...edgePt(s, 1, wide + 30))), len = 8.3 * (1 + Math.abs(s.k) * ((R ? Math.max(L, wide) : L) + 10));
    const end = S[i - (L + wide < pL + pR ? Math.ceil(len / 4) + 1 : 2)]; if (L !== pL) cube('concrete', end, -(L + pL) / 2 - 3, Math.abs(L - pL) + 6, 34, 4, -2); if (wide !== pR) cube('concrete', end, (wide + pR) / 2 + 3, Math.abs(wide - pR) + 6, 34, 4, -2); if (clear !== pC) cube('concrete', S[i - (clear < pC ? Math.ceil(len / 4) + 1 : 2)], (Math.min(wide, pR) - Math.min(L, pL)) / 2, Math.min(wide, pR) + Math.min(L, pL) + 34, Math.abs(clear - pC) + 4, 2, Math.min(clear, pC)); pL = L; pR = wide; pC = clear; // where a room opens or closes: the end wall, beside and above the lower opening
    seg('galerieArea51', s, 0, 0, { skin: B1, a: [L, wide, clear, Math.max(4, top - s.y - clear - 1.7), R ? 1 : 0, len, (n % 3) * 0.05, s.k, 8], pitch: Math.atan2(S[i + 4].y - S[i - 4].y, Math.hypot(S[i + 4].x - S[i - 4].x, S[i + 4].z - S[i - 4].z)) }); } // each section lies along the slope of the road: on the two ramps the walls, their amber line and the ceiling run straight instead of in steps
  seg('portailArea51', S[i0 - 6], 0, 0); seg('portailArea51', S[i1 + 6], 0, 0);
  // the nuclear airlocks: the controlled zone (reactor hall and labs) lies between two locks, each made of two armoured bulkheads the road passes through. Entry lock = the lobby; exit lock = the end of the labs cavern.
  // In the entry lock, a monitoring arch and two booths
  const lock = ROOMS[0], labs = ROOMS[2], sas = (i, r) => seg('sasArea51', S[i], 0, 0, { a: [r[2], r[3], r[4]] });
  sas(lock[0] + 1, lock); sas(lock[1] - 1, lock); sas(labs[1] - 16, labs); sas(labs[1] - 1, labs);
  seg('portiqueArea51', S[(lock[0] + lock[1]) >> 1], 0, 0); for (const sd of [-1, 1]) seg('gueriteArea51', S[(lock[0] + lock[1]) >> 1], sd * 16.5, 0, { a: [4, 8] });
  // reactor hall: the vessel in its blue pool 6 m below the gallery the road runs on, the polar crane over it, the control room on the outer wall, waste casks, a footbridge; a concrete wall closes the hall to the north
  set('reacteurArea51', 1210, 1262, { y: -25 }); reg('pool', surf('pool', 1210, 1262, 84, 84, -24.2, 0.8)); set('pontPolaireArea51', 1210, 1262, { y: 2 });
  h.pose('boxMesh', MAT.concrete, kit, [1222 * k, -4, 1196 * k], 124, 32, 5);
  seg('salleControleArea51', S[idx(1210, 1324)], -23, 7, { a: [1] }); seg('passerelleArea51', S[idx(1148, 1262)], 22, 13); for (const [x, z] of [[1262, 1290], [1158, 1290]]) seg('futsArea51', S[idx(x, z)], -20, 0);
  // labs cavern: the building on the left with its lit windows, two armoured doors and a test chamber on the right
  const m = (labs[0] + labs[1]) >> 1; seg('laboArea51', S[m - 6], -23, 0, { a: [1, 14, 12, 56] }); for (const d of [-26, 6]) seg('porteBlindeeArea51', S[m + d], 31.4, 0, { a: [-1, 14] });
  seg('chambreTestArea51', S[m - 10], 24, 0, { a: [-1] });
  seg('cylArea51', S[(ROOMS[3][0] + ROOMS[3][1]) >> 1], 28, -2, { a: [9, 21.5, 10], skin: MAT.dark });   // the silo shaft the last dog-leg goes round
  // on the mesa: the stack (what says reactor from afar), the filter house, the headframe above the silo, the low cooler and its pond, ventilation shafts
  set('cylArea51', 1300, 1350, { a: [3, 60, 8, 0.55], skin: MAT.concrete }); set('boxMesh', 1300, 1350, { a: [1.4, 1.4, 1.4], skin: MAT.fire, dy: 61 }); set('filtresArea51', 1328, 1350); set('chevalementArea51', 930, 1268);
  set('aeroArea51', 1285, 1440); surf('glass', 1200, 1420, 40, 25, null, 2); set('puitsArea51', 1300, 1380); set('puitsArea51', 1050, 1300);
  // the transformer at the portal, then the approach: two berms and the guard post (no overhead line: nothing in the air to read)
  set('transfoArea51', 1535, 1150);
  for (const sd of [-1, 1]) for (const d of [-25, 0, 25]) side('merlonArea51', pk(1440, 1020) + d, sd, 8, 7, { a: [12, 6, 27, sd + d], skin: MAT.sol });
  side('gueriteArea51', pk(1425, 955), 1, 4, 2.2);
};
