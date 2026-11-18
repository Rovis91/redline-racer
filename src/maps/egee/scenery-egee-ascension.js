// "egee", zone 2: Ascension (PK 650 to 2000, 20 to 161 m, 15-16 m wide). Tools (set, house, wall, plant, grove, shrine, hut) are described in scenery-egee.js.
// Island side: cliffs (terrain only: a set piece that long would reach the next stretch of road) with dressed-stone retaining walls at their foot, olive terraces where the groves are. Sea side: the drop and the bay.
// Country-road details: roadside shrines, field huts, two small farms, a chapel, cypress pairs, an old mill stump, broken rock.
// Third pass, what breaks the long bare slopes and makes the flank lived in: crags standing out of the cliffs, scree at their foot, prickly pear, agave and thyme on the verges, the power line that climbs to the plateau,
// a chapel on the cliff top with its lime stair, dovecotes, a goat pen, a well, a cistern, field walls, a pick-up and a scooter at the farms.
(window.EGEE = window.EGEE || {}).ascension = ({ MAT, set, house, wall, plant, grove, shrine, hut, path, cross, pen, hsh }) => {
  for (const [a, b] of [[690, 830], [960, 1060], [1440, 1560], [1740, 1840]]) wall('ocre', a, b, -1, 2.5, 3.2, { cap: 1 });      // retaining walls: their top line draws the curve ahead
  wall('ocre', 1130, 1270, 1, 3, 3, { cap: 1 });                                                                                 // the big right-hander (pts 28-32)
  for (const pk of [900, 1360, 1650]) grove('olive', pk - 42, pk + 42, -1, 10, 70, 9);                                           // olive terraces
  for (let pk = 660; pk < 1930; pk += 12) { plant('buisson', pk, -1, 2.8 + hsh(pk) * 2.5, 1 + hsh(pk, 3) * 0.6); plant('buisson', pk + 5, 1, 2.8 + hsh(pk, 5) * 9, 1 + hsh(pk, 7) * 0.6); } // dry scrub at the roadside
  grove('buisson', 660, 1900, -1, 30, 90, 19, 1.7);                                                                              // scrub on the slopes above the cliffs
  [720, 1100, 1480, 1880].forEach((pk, i) => shrine(pk, i & 1 ? -1 : 1));
  hut(880, -1, 30); hut(1340, -1, 26); hut(1660, -1, 34);
  house(1085, -1, 12, 9, 5, 11, 16); house(1600, -1, 14, 9, 5, 11, 8); set('chapelleEgee', 1310, -1, 17, { s: 0.7 });            // two farms and a country chapel
  for (const pk of [820, 1210, 1560, 1760]) { plant('cypres', pk, -1, 6, 1.2); plant('cypres', pk + 5, -1, 8.5, 0.95); }
  set('tourEgee', 1840, 1, 9, { a: [3.6, 3, 6, 10, 8], skin: MAT.pierre });                                                      // the stump of an old mill on the sea side
  for (let pk = 700, k = 0; pk < 1900; pk += 47, k++) set('rocherEgee', pk, k % 3 ? -1 : 1, 7 + hsh(k, 4) * 9, { a: [4 + hsh(k) * 5, 2 + hsh(k, 1) * 3, 5 + hsh(k, 2) * 5, k + 40], skin: MAT.roche });
  house(1940, -1, 6, 12, 7, 16, 1); house(1975, 1, 8, 12, 7, 16, 2);                                                             // the two houses at the top of the climb
  [760, 1010, 1180, 1420, 1530, 1700, 1790, 1880].forEach((pk, k) => set('rocherEgee', pk, -1, 19 + hsh(k, 6) * 8, { a: [13 + hsh(k, 7) * 5, 8 + hsh(k, 8) * 5, 16 + hsh(k, 9) * 8, k + 120], skin: k & 1 ? MAT.cap : MAT.roche })); // crags in the cliff faces
  for (let pk = 656, k = 0; pk < 1930; pk += 7, k++) { plant('caillou', pk, -1, 2.6 + hsh(k, 11) * 5, 0.6 + hsh(k, 12) * 1.5); if (k % 3 === 0) plant('caillou', pk + 3, 1, 2.6 + hsh(k, 13) * 7, 0.6 + hsh(k, 14) * 1.2); // scree at the cliff foot
    if (k % 2) plant('thym', pk + 2, k % 4 === 1 ? 1 : -1, 2.6 + hsh(k, 15) * 6, 0.5 + hsh(k, 16) * 0.4); }
  for (const pk of [700, 850, 1000, 1150, 1300, 1450, 1620, 1750, 1900]) { plant('nopal', pk, -1, 3.4, 1.3); plant('nopal', pk + 2.6, -1, 4.6, 1); plant('agave', pk + 40, 1, 6.5, 1.3); plant('agave', pk + 43, 1, 8.4, 0.9); plant('nopal', pk + 70, 1, 8, 1.2); }
  set('chapelleEgee', 1500, -1, 52, { s: 0.6 }); path(1474, 3.5, 1497, 44, -1, 15);                                              // a chapel on the cliff top and the lime stair that climbs to it
  set('pigeonnierEgee', 790, 1, 5.5); set('pigeonnierEgee', 1385, -1, 17);                                                       // dovecotes
  pen(925, -1, 6, 5); set('puitsEgee', 1068, 1, 5); set('citerneEgee', 1622, -1, 5.5);
  wall('pierre', 1290, 1420, 1, 8.5, 0.9); wall('pierre', 870, 950, 1, 8.5, 0.9); wall('pierre', 1600, 1700, 1, 8.5, 0.9);       // field walls on the sea-side verge, and walls that climb through the olive terraces
  for (const pk of [862, 940, 1322, 1398, 1612, 1688]) cross('pierre', pk, -1, 5, 46);
  set('pickupEgee', 1101, -1, 4.6, { skin: { ...MAT, coque: MAT.blanc } }); set('scooterEgee', 1612, -1, 3.4, { ry: 0.3, skin: { ...MAT, coque: MAT.corail } });
  plant('figue', 1066, -1, 5, 0.85); plant('figue', 1588, -1, 5, 0.9); plant('figue', 1952, 1, 4.5, 0.9);
};
