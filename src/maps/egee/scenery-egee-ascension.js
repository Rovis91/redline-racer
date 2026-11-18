// "egee", zone 2: Ascension (PK 650 to 2000, 20 to 161 m, 15-16 m wide). Tools (set, house, wall, plant, grove) are described in scenery-egee.js.
// Island side: cliffs (terrain and outcrops) with dressed-stone retaining walls at their foot, olive terraces where the groves are. Sea side: the drop and the bay; one high wall on the big right-hander.
(window.EGEE = window.EGEE || {}).ascension = ({ MAT, set, house, wall, plant, grove, hsh }) => {
  [760, 1010, 1500, 1790].forEach((pk, i) => set('falaiseEgee', pk, -1, 20, { a: [30, 22, 90, i + 2], skin: MAT.roche }));       // rock cuts on the island side
  for (const [a, b] of [[690, 830], [960, 1060], [1440, 1560], [1740, 1840]]) wall('ocre', a, b, -1, 2.5, 3.2, { cap: 1 });      // retaining walls: their top line draws the curve ahead
  wall('ocre', 1130, 1270, 1, 3, 3, { cap: 1 });                                                                                 // the big right-hander (pts 28-32)
  for (const pk of [900, 1360, 1650]) grove('olive', pk - 42, pk + 42, -1, 10, 70, 9);                                           // olive terraces
  for (let pk = 660; pk < 1930; pk += 12) { plant('buisson', pk, -1, 2.8 + hsh(pk) * 2.5, 1 + hsh(pk, 3) * 0.6); plant('buisson', pk + 5, 1, 2.8 + hsh(pk, 5) * 9, 1 + hsh(pk, 7) * 0.6); } // dry scrub at the roadside
  grove('buisson', 660, 1900, -1, 30, 90, 19, 1.7);                                                                              // scrub on the slopes above the cliffs
  house(1940, -1, 6, 12, 7, 16, 1); house(1975, 1, 8, 12, 7, 16, 2);                                                             // transition: the first ring of facades
};
