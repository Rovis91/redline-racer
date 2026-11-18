// "egee", zone 2: Ascension (PK 650 to 2000, 20 to 161 m, 15-16 m wide). Tools (set, house, wall, plant, grove, shrine, hut) are described in scenery-egee.js.
// Island side: cliffs (terrain only: a set piece that long would reach the next stretch of road) with dressed-stone retaining walls at their foot, olive terraces where the groves are. Sea side: the drop and the bay.
// Country-road details: roadside shrines, field huts, two small farms, a chapel, cypress pairs, an old mill stump, broken rock.
(window.EGEE = window.EGEE || {}).ascension = ({ MAT, set, house, wall, plant, grove, shrine, hut, hsh }) => {
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
};
