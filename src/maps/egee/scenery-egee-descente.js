// "egee" blockout, zone 5: Descente (PK 3500 to 4700, 123 to 8 m, 14-16 m wide). Only this zone's named blocks; put() is described in scenery-egee.js.
(window.EGEE = window.EGEE || {}).descente = ({ put }) => {
  const STONE = 0xc5ad80, OLIVE = 0x857653, GREEN = 0x4f6a50, WHITE = 0xe8dfcf;
  for (const pk of [3650, 3900, 4150]) put('TERRASSES', STONE, pk, 1, 12, 40, 4, 80);  // stepped fields below the road, sea side
  for (const pk of [3760, 4050, 4310]) put('OLIVERAIE', OLIVE, pk, -1, 10, 50, 6, 70);
  for (const pk of [3600, 4000, 4220]) put('CYPRES', GREEN, pk, -1, 5, 4, 12, 4);
  put('RUINE', STONE, 3950, -1, 70, 12, 6, 16);
  for (const pk of [4480, 4560, 4640]) put('MAISON DU PORT', WHITE, pk, -1, 6, 16, 8, 40); // the harbour colours come back before the line
};
