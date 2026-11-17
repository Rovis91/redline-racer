// "egee" blockout, zone 2: Ascension (PK 650 to 2000, 20 to 161 m, 15-16 m wide). Only this zone's named blocks; put() is described in scenery-egee.js.
(window.EGEE = window.EGEE || {}).ascension = ({ put }) => {
  const ROCK = 0xb97049, STONE = 0xe7c49a, OLIVE = 0x76815a, WHITE = 0xfbf3e5;
  for (const pk of [760, 1010, 1500, 1790]) put('FALAISE', ROCK, pk, -1, 5, 30, 22, 90);       // rock cuts on the island side
  for (const pk of [1150, 1200, 1250]) put('MUR SOUTENEMENT', STONE, pk, 1, 3, 4, 5, 30);      // inside of the big right-hander (pts 28-32)
  for (const pk of [900, 1360, 1650]) put('OLIVERAIE', OLIVE, pk, -1, 14, 60, 6, 80);          // olive terraces: one volume per grove
  put('MAISON', WHITE, 1940, -1, 6, 12, 7, 16); put('MAISON', WHITE, 1975, 1, 8, 12, 7, 16);   // transition: the first ring of facades
};
