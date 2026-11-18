// "egee", zone 5: Descente (PK 3500 to 4700, 123 to 8 m, 14-16 m wide). Tools (set, wall, plant, grove) are described in scenery-egee.js. The harbour houses of the last 220 m are placed with the Port (one town front).
// Sea side: 5 m terraces (terrain) held by dry-stone walls, olive trees one terrace down so the sea stays in view. Island side: olive groves on 4 m terraces, pairs of cypresses at the changes of direction, a ruined farm far back.
(window.EGEE = window.EGEE || {}).descente = ({ MAT, set, wall, plant, grove, hsh }) => {
  wall('pierre', 3560, 4400, 1, 15.5, 0.5, { up: -4 });                                                                           // first terrace wall, the whole way down
  for (const pk of [3650, 3900, 4150]) { wall('pierre', pk - 48, pk + 48, 1, 28, 0.5, { up: -4 }); wall('pierre', pk - 40, pk + 40, 1, 40.5, 0.5, { up: -4 }); grove('olive', pk - 40, pk + 40, 1, 18, 26, 11); }
  grove('buisson', 3520, 4440, -1, 14, 90, 17, 1.7);                                                                               // scrub over the slope behind
  for (const pk of [3760, 4050, 4310]) grove('olive', pk - 38, pk + 38, -1, 8, 58, 9);
  for (const pk of [3600, 4000, 4220]) { plant('cypres', pk, -1, 5, 1.25); plant('cypres', pk + 5, -1, 7.5, 1); }
  set('ruineEgee', 3950, -1, 77, { s: 1.6 });
  wall('pierre', 3520, 4440, -1, 3, 1.4);                                                                                         // the foot of the island-side terraces: one long dry-stone wall
  for (let pk = 3540, k = 0; pk < 4400; pk += 53, k++) set('rocherEgee', pk, k & 1 ? 1 : -1, k & 1 ? 6 : 10 + hsh(k, 4) * 10, { a: [5 + hsh(k) * 6, k & 1 ? 2 : 2.5 + hsh(k, 1) * 3, 6 + hsh(k, 2) * 6, k + 20], skin: MAT.roche });
  for (let pk = 3510; pk < 4460; pk += 13) { plant('buisson', pk, -1, 5 + hsh(pk) * 3, 1 + hsh(pk, 3) * 0.6); plant('buisson', pk + 6, 1, 2.8 + hsh(pk, 5) * 10, 0.9 + hsh(pk, 7) * 0.6); }
};
