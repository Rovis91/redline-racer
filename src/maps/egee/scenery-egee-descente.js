// "egee", zone 5: Descente (PK 3500 to 4700, 123 to 8 m, 14-16 m wide). Tools (set, box, house, wall, plant, grove, shrine, hut) are described in scenery-egee.js. The harbour town of the last 300 m is placed with the Port.
// Sea side: 5 m terraces (terrain) held by dry-stone walls, olive trees one terrace down so the sea stays in view. Island side: olive groves on 4 m terraces, pairs of cypresses at the changes of direction, a ruined farm far back.
// Country-road details: roadside shrines, field huts, two farms, an old mill stump, a row of beehives, broken rock.
// Third pass: lime stairs from terrace to terrace, dovecotes, wells, a cistern, goat pens, the power line, figs, prickly pear and agave on the terrace lips, a pick-up and a scooter at the farms.
(window.EGEE = window.EGEE || {}).descente = ({ MAT, set, box, house, wall, plant, grove, shrine, hut, poles, path, cross, pen, hsh }) => {
  wall('pierre', 3560, 4400, 1, 15.5, 0.5, { up: -4 });                                                                           // first terrace wall, the whole way down
  for (const pk of [3650, 3900, 4150]) { wall('pierre', pk - 48, pk + 48, 1, 28, 0.5, { up: -4 }); wall('pierre', pk - 40, pk + 40, 1, 40.5, 0.5, { up: -4 }); grove('olive', pk - 40, pk + 40, 1, 18, 26, 11); }
  grove('buisson', 3520, 4380, -1, 14, 90, 17, 1.7);                                                                              // scrub over the slope behind
  for (const pk of [3760, 4050, 4310]) grove('olive', pk - 38, pk + 38, -1, 8, 58, 9);
  for (const pk of [3600, 4000, 4220]) { plant('cypres', pk, -1, 5, 1.25); plant('cypres', pk + 5, -1, 7.5, 1); }
  set('ruineEgee', 3950, -1, 77, { s: 1.6 });
  wall('pierre', 3520, 4380, -1, 3, 1.4);                                                                                         // the foot of the island-side terraces: one long dry-stone wall
  for (let pk = 3540, k = 0; pk < 4380; pk += 53, k++) set('rocherEgee', pk, k & 1 ? 1 : -1, k & 1 ? 11 : 10 + hsh(k, 4) * 10, { a: [5 + hsh(k) * 6, k & 1 ? 2 : 2.5 + hsh(k, 1) * 3, 6 + hsh(k, 2) * 6, k + 20], skin: MAT.roche });
  for (let pk = 3510; pk < 4380; pk += 13) { plant('buisson', pk, -1, 5 + hsh(pk) * 3, 1 + hsh(pk, 3) * 0.6); plant('buisson', pk + 6, 1, 2.8 + hsh(pk, 5) * 10, 0.9 + hsh(pk, 7) * 0.6); }
  [3620, 3980, 4330].forEach((pk, i) => shrine(pk, i & 1 ? 1 : -1));
  hut(3700, -1, 24); hut(4020, -1, 30); hut(4260, 1, 5);
  house(3830, -1, 12, 9, 5, 11, 16); house(4190, -1, 12, 9, 5, 12, 2);                                                            // two farms
  set('tourEgee', 3565, -1, 15, { a: [3.6, 3, 6, 10, 8], skin: MAT.pierre });                                                     // the stump of an old mill
  for (const pk of [3705, 3960, 4215]) path(pk, 13, pk + 12, 46, 1, 11);                                                           // stairs down the sea-side terraces
  set('pigeonnierEgee', 3782, 1, 21); set('pigeonnierEgee', 4132, -1, 17);
  set('puitsEgee', 3846, -1, 6.5); set('puitsEgee', 4204, -1, 6.5); set('citerneEgee', 3905, -1, 6.5); pen(3660, -1, 8, 5); pen(4290, -1, 8, 4);
  poles(3520, 4390, -1, 5.2, 26);
  for (const pk of [3722, 3798, 4012, 4088, 4272, 4348]) cross('pierre', pk, -1, 4, 40);
  set('pickupEgee', 3816, -1, 7.5, { skin: { ...MAT, coque: MAT.corail } }); set('scooterEgee', 4180, -1, 7, { ry: 0.3, skin: { ...MAT, coque: MAT.bleu } });
  plant('figue', 3842, -1, 26, 0.9); plant('figue', 4202, -1, 27, 0.9); plant('figue', 4262, 1, 10, 0.9); plant('figue', 3704, -1, 20, 0.9);
  for (const pk of [3540, 3640, 3760, 3880, 3990, 4110, 4230, 4350]) { plant('agave', pk, 1, 9, 1.3); plant('agave', pk + 3, 1, 11, 0.9); plant('nopal', pk + 45, 1, 6, 1.2); plant('nopal', pk + 60, -1, 5.6, 1.2); }
  for (let pk = 3506, k = 0; pk < 4380; pk += 8, k++) { plant('thym', pk, k & 1 ? 1 : -1, 2.6 + hsh(k, 15) * 8, 0.5 + hsh(k, 16) * 0.5); if (k % 3 === 0) plant('caillou', pk + 4, k & 2 ? 1 : -1, 5 + hsh(k, 13) * 6, 0.6 + hsh(k, 14) * 1.2); }
  for (let k = 0; k < 8; k++) box(k & 1 ? 'boisB' : 'blanc', 4095 + k * 1.7, -1, 8.5, 0.6, 0.7, 0.6);                             // beehives
};
