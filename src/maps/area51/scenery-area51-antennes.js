// "area51" blockout, zone 4: Champ d'antennes (down to -12 m in the bowl, half loop round D1, then north up the array arm to +9 m, 20 m wide). Only this zone's named blocks; put(), at() and mute() are described in scenery-area51.js.
// D1, the listening dish, sits in a bowl so the rim screens it from the base's own radio noise; its road ends in a loop round the pedestal, with the plant a dish needs beside it.
// The smaller dishes stand on spurs along a rail line (they are moved by rail), with the assembly barn at the foot of the arm.
(window.AREA51 = window.AREA51 || {}).antennes = ({ g, put, at, mute, pk }) => {
  const WHITE = 0xe9ece7, CONCRETE = 0xadb7bb, STEEL = 0x52616e, OLIVE = 0x757a68;
  const dish = (name, x, z, r, hs) => { at('SOCLE ' + name, CONCRETE, x, z, r / 2, hs, r / 2); mute(at(name, STEEL, x, z, r, r / 2, r, g.hAt(x, z) + hs - r / 4));
    const d = at(name, WHITE, x, z, 2 * r, 8, 2 * r, g.hAt(x, z) + hs); d.rotation.x = -0.4; d.rotation.z = 0.3; }; // pedestal, mount, and the dish as a tilted slab of its diameter
  dish('D1', 560, 1010, 60, 50);                                                            // the landmark of the lap: 120 m across, seen from the rim, then circled
  at('CONTROLE', OLIVE, 615, 1065, 24, 7, 14); at('GENERATEUR', STEEL, 495, 1050, 12, 5, 10); at('CRYOGENIE', STEEL, 520, 945, 12, 6, 12); // inside the loop, round the pedestal
  dish('D2', 690, 760, 20, 22); dish('D3', 825, 690, 20, 22); dish('D4', 690, 610, 20, 22); // on their spurs, alternating sides of the arm
  for (let p = pk(755, 770), i = 0; p < pk(755, 600); p += 40, i++) { const r = put('RAILS', STEEL, p, -1, 6, 3, 0.5, 40); if (i) mute(r); } at('ATELIER ANTENNES', OLIVE, 835, 805, 34, 30, 34); // the transporter track along the arm; the barn where a dish is overhauled
  put('RADOME', WHITE, pk(770, 1212), -1, 25, 14, 14, 14);                                    // left of the west portal of B1; the right is kept clear: D1 is seen from the mouth
};
