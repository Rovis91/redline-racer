// "autoroute" blockout, zone 5: Le metro desaffecte (PK 2084 to 2791): tunnel at -8.5 m, left, right, right, a station (half-width 9 m, PK 2356 to 2434), a wiggle, right, then the exit cutting (PK 2640) up to the start line.
// The tunnel is the engine's (th.tun in maps.js); nothing is placed inside it. Only the blocks of the exit; put() is described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).metro = ({ put }) => {
  const BRICK = 0x8a5a48, STONE = 0xa89a80, CONC = 0x8f8c82, GREEN = 0x4f7a3c;
  put('SORTIE DE METRO', CONC, 2630, -1, -22, 32, 5, 14, 1.5);                                     // the headwall over the mouth
  for (const sd of [-1, 1]) put('VEGETATION', GREEN, 2700, sd, 6, 8, 5, 50);                      // the banks of the cutting
  put('IMMEUBLE', BRICK, 2740, -1, 14, 22, 22, 48); put('IMMEUBLE', STONE, 2740, 1, 14, 22, 18, 48);
};
