// "volcan" blockout, zone 3: Les Galeries (PK 2020 to 3130, 97 to 200 m). Only this zone's named blocks; put() and over() are described in scenery-volcan.js.
// T1 (PK 2250 to 2410) is the engine tunnel (M.tun), dressed here with its spur; T2 (PK 2870 to 3000) is made of blocks only (one engine tunnel per map): no darkness, no echo.
(window.VOLCAN = window.VOLCAN || {}).galeries = ({ put, over, at }) => {
  const ROCK = 0x555a60, NIGHT = 0x23292d, LAMP = 0xe8d9ac, BASALT = 0x34373d;
  const spur = (a, b, roof) => { for (let pk = a + 10; pk < b; pk += 20) { const w = at(pk).w; // the spur the gallery is cut through: rock on both sides and above
    put('', BASALT, pk, 1, 1.5, 40, 24, 21); put('', BASALT, pk, -1, 1.5, 12, 24, 21); if (roof) over('', NIGHT, pk, w * 2 + 3, 12, 21, 9); } };
  const portal = (label, pk) => { const w = at(pk).w; over(label, ROCK, pk, w * 2 + 34, 8, 4, 9); for (const sd of [-1, 1]) put('', ROCK, pk, sd, 1.5, 14, 9, 4); };
  spur(2250, 2410, 0); portal('PORTAIL T1', 2246); portal('PORTAIL T1', 2414);
  spur(2870, 3000, 1); portal('PORTAIL T2', 2868); portal('PORTAIL T2', 3002);
  for (const pk of [2100, 2540, 2700]) put('PAROI TAILLEE', ROCK, pk, 1, 5, 26, 28, 90); // open-air climb between the galleries: cut rock on the island side
  for (const pk of [2150, 2780]) put('COFFRET', LAMP, pk, 1, 1.5, 2, 3, 3);                // technical box before each gallery
};
