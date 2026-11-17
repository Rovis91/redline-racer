// "piliers" blockout, zone 3: Grand pont panoramique (PK 1710 to 2181, +215 m, 14 m wide; deck PK 1813 to 2063, straight, east 800 to 1050 at north 920). Only this zone's named blocks; put(), mass() and summit() are described in scenery-piliers.js.
(window.PILIERS = window.PILIERS || {}).pont = ({ put, mass }) => {
  const ROCK = 0x9b9a7e, STONE = 0xc9c3b2, STEEL = 0x162e39;
  for (const sd of [-1, 1]) {
    put('CULEE OUEST', STONE, 1800, sd, 0.5, 8, 5, 26); put('CULEE EST', STONE, 2076, sd, 0.5, 8, 5, 26); // anchor blocks on the two rock shoulders, same level
    put('PYLONE', STEEL, 1832, sd, 0.5, 4, 60, 4, 205); put('PYLONE', STEEL, 2044, sd, 0.5, 4, 60, 4, 205); // two towers, one leg each side of the deck: they count the distance left
    put('CABLE PORTEUR', STEEL, 1938, sd, 1.5, 1, 1, 212, 262);                                              // straight here; the real one sags to the deck at mid-span
  }
  // needles standing in the void under and around the bridge: the depth scale below the road
  mass('AIGUILLE', ROCK, 880, 1010, 40, 40, 190); mass('AIGUILLE', ROCK, 960, 840, 35, 45, 175); mass('AIGUILLE', ROCK, 900, 760, 45, 40, 240); mass('AIGUILLE', ROCK, 990, 1090, 50, 40, 260);
};
