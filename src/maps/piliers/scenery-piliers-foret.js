// "piliers" blockout, zone 1: Forêt rocheuse basse (PK 0 to 735, +150 to +182 m, 16 m wide at the start then 14). Only this zone's named blocks; put() and mass() are described in scenery-piliers.js.
(window.PILIERS = window.PILIERS || {}).foret = ({ put, mass, at }) => {
  const ROCK = 0x9b9a7e, FOREST = 0x4e7752, DARK = 0x263e37, STONE = 0xe3dcc0, TRUNK = 0x5a4632;
  mass('PILIER P1 +310', ROCK, 250, 480, 80, 140, 310); mass('PILIER P2 +345', ROCK, 292, 672, 80, 90, 345); // rooted in the shoulder: they must read as part of the massif
  // forest: one volume per wood, on the outside of each bend so the next tangent stays open; undergrowth lower, on the inside
  for (const p of [60, 160, 260, 360, 460, 560]) { const out = at(p).k > 0 ? -1 : 1; put('FORET', FOREST, p, out, 14, 50, 14, 70); put('SOUS-BOIS', DARK, p + 50, -out, 5, 20, 4, 50); }
  for (let p = 40, k = 0; p < 690; p += 35, k++) put('ARBRE', TRUNK, p, k % 2 ? 1 : -1, 1.5, 3, 22, 3); // slalom: big trunks right at the wall, one side then the other every 35 m, in front of the woods
  for (const p of [210, 410, 610]) put('ROCHERS', ROCK, p, 1, 4, 14, 8, 24);      // faceted boulders on the inner bank
  put('BORNE', STONE, 150, -1, 2, 2, 3, 2); put('BORNE', STONE, 520, 1, 2, 2, 3, 2); // old track markers at the changes of rhythm
  put('GARDE-CORPS', STONE, 700, -1, 1, 1.5, 1.5, 50);                              // transition: the undergrowth stops, the first exposed parapet
};
