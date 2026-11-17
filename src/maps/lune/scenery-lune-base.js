// "lune" blockout, zone 1: Base lunaire (PK 3830 to 500 through the line, 18 to 22 m, 22 m wide from PK 3860 to 300). The start is in the middle of a 300 m straight, inside the start airlock: a hall over the road,
// from 50 m before the line to 110 m after it; its doors are open frames (they do not move: animation is a later phase). Only this zone's named blocks; put() and over() are described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).base = ({ put, over, LAP }) => {
  const IVORY = 0xe8e2d0, BLUE = 0x526c80, ORANGE = 0xd78a40, SAND = 0xe5bb72, SHELL = 0x9aa0ac;
  for (const pk of [LAP - 30, 10, 50, 90]) { for (const sd of [-1, 1]) put('SAS DE DÉPART', SHELL, pk, sd, 3, 7, 16, 40); over('TOIT DU SAS', SHELL, pk, 44, 2, 40, 14); } // the hall: two walls and a roof, in four 40 m bays
  for (const sd of [-1, 1]) { put('PORTE DU SAS', ORANGE, LAP - 52, sd, 0, 3, 16, 3); put('PORTE DU SAS', ORANGE, 112, sd, 0, 3, 16, 3); }                               // the frames of its two doors
  put('DÔME HABITAT', IVORY, 200, 1, 26, 70, 34, 70);                                    // hero, dead ahead when leaving the hall: on the outside of the first bend, where the technical plan draws it
  put('SERRE', IVORY, 330, 1, 60, 46, 22, 46);                                            // a second, smaller dome behind it
  for (const [pk, sd, off] of [[150, 1, 10], [270, 1, 14], [310, 1, 16], [160, -1, 12], [215, -1, 12], [345, -1, 14]]) put('MODULE', IVORY, pk, sd, off, 12, 9, 26); // short cylinders, along the road on both sides
  put('TOUR DE CONTRÔLE', IVORY, 135, -1, 34, 10, 42, 10); put('HANGAR', SHELL, 265, -1, 40, 50, 16, 70); put('ANTENNE', ORANGE, 230, 1, 120, 4, 46, 4);
  for (const pk of [400, 455]) put('PANNEAUX SOLAIRES', BLUE, pk, -1, 30, 50, 2.5, 50);  // one flat volume per field, set back from the trajectory
  for (const pk of [385, 405, 425]) put('RÉSERVOIR', SAND, pk, 1, 16, 8, 7, 8);
  for (const pk of [LAP - 130, LAP - 85]) put('MODULE', IVORY, pk, 1, 12, 12, 9, 26);     // the way in: the colony closes around the road before the hall
  put('ENTREPÔT', SHELL, LAP - 110, -1, 14, 30, 12, 50);
};
