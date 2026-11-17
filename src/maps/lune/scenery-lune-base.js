// "lune" blockout, zone 1: Base lunaire (PK 0 to 400, 18 to 22 m, 22 m wide then 18 m from PK 360; the 22 m comes back at PK 4160). Only this zone's named blocks; put() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).base = ({ put }) => {
  const IVORY = 0xe8e2d0, BLUE = 0x526c80, ORANGE = 0xd78a40, SAND = 0xe5bb72;
  put('DÔME HABITAT', IVORY, 80, 1, 60, 50, 24, 50);                                    // hero, where the technical plan draws it: 96 m right of the axis, between the road and the western rim
  for (const [pk, off] of [[30, 30], [80, 26], [130, 30], [180, 44]]) put('MODULE', IVORY, pk, 1, off, 22, 7, 9); // short cylinders grouped in front of the dome, long axis toward it
  put('ANTENNE', ORANGE, 150, 1, 90, 4, 34, 4);
  for (const pk of [20, 110]) put('PANNEAUX SOLAIRES', BLUE, pk, -1, 30, 40, 2.5, 60); // one flat volume per field, set back from the trajectory
  for (const pk of [210, 235]) put('RÉSERVOIR', SAND, pk, 1, 18, 7, 6, 7);
  for (const pk of [4180, 4230]) put('MODULE', IVORY, pk, 1, 24, 9, 7, 22);              // the colony seen again on the way back
  for (const pk of [300, 380]) put('BLOCS', 0x69707a, pk, -1, 28, 14, 6, 14);            // transition: the base thins out, rock takes over
};
