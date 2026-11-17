// "area51" blockout, zone 5: Collines & périmètre (PK 3900 to 5113, up to +26 m at PK 4400 then down to the runway, 20 m wide). Only this zone's named blocks; put() and at() are described in scenery-area51.js.
(window.AREA51 = window.AREA51 || {}).collines = ({ put, at, smp }) => {
  const MESA = 0x97644f, WOOD = 0x9daf86, POST = 0x929782, VIOLET = 0x5c4b89, GLOW = 0xf2c37b;
  at('MESA', MESA, 130, 600, 90, 35, 140); at('MESA', MESA, 330, 190, 120, 30, 80); at('MESA', MESA, 860, 80, 160, 28, 60); // simple volumes, far from the edges
  put('PALISSADE', WOOD, 4150, smp(4150).k > 0 ? -1 : 1, 15, 1, 2.5, 100); put('POSTE', POST, 4300, 1, 12, 6, 4, 6); put('POSTE', POST, 4680, 1, 12, 6, 4, 6);
  for (const sd of [-1, 1]) put('GUERITE', POST, 4975, sd, 3, 5, 4, 5);                    // return checkpoint: two side booths and a beam, no narrowing
  put('CHECKPOINT', POST, 4975, 1, -26, 32, 1.5, 3, 8.5);
  at('SIGNAL DISTANT', GLOW, 60, 330, 20, 20, 20, 110);                                     // the ambiguous glow above the western crest
  // the horizon of the bowl: the mountains as big far volumes on the four sides
  for (const [x, z, w, ht, d] of [[400, -350, 700, 120, 120], [1300, -380, 900, 150, 120], [2200, -350, 700, 130, 120], [-200, 700, 120, 130, 800], [1000, 1560, 900, 120, 120], [2740, 700, 120, 110, 700]]) at('MONTAGNES', VIOLET, x, z, w, ht, d);
};
