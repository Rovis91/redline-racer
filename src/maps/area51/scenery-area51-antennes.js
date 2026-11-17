// "area51" blockout, zone 3: Champ d'antennes (down to -12 m in the bowl, half loop round D1, then north up the array arm to +9 m, 20 m wide). Only this zone's named blocks; the helpers are described in scenery-area51.js.
// D1, the listening dish, sits in a bowl so the rim screens it from the base's own radio noise; its road ends in a loop round the pedestal, with the plant a dish needs beside it.
// The smaller dishes stand on pads along a rail line (they are moved by rail), with the assembly barn at the foot of the arm and the array's control building at its head.
// Every bend has the thing it goes round on its inside: the road reads as laid after the installations, between them.
(window.AREA51 = window.AREA51 || {}).antennes = ({ g, h, put, at, apex, mute, pk, set, MAT, THREE }) => {
  const WHITE = 0xe9ece7, CONCRETE = 0xadb7bb, STEEL = 0x52616e, OLIVE = 0x757a68, WIRE = 0x708071;
  const dish = (name, x, z, r, hs) => { at('SOCLE ' + name, CONCRETE, x, z, r / 2, hs, r / 2); mute(at(name, STEEL, x, z, r, r / 2, r, g.hAt(x, z) + hs - r / 4));
    const d = at(name, WHITE, x, z, 2 * r, 8, 2 * r, g.hAt(x, z) + hs); d.rotation.x = -0.4; d.rotation.z = 0.3; }; // pedestal, mount, and the dish as a tilted slab of its diameter
  // D1, the landmark of the lap: 120 m across on a 50 m mount, seen from the west portal of B1, then circled. Its reflector is tilted 40° toward the west, where the signal comes from
  const d1 = set('dishMountArea51', 560, 1010, { a: [50] }), head = new THREE.Group(); head.position.y = 54; head.rotation.z = 0.7; d1.add(head);
  h.pose('dishBowlArea51', MAT.white, head, [0, 6, 0]); h.pose('dishBackArea51', MAT, head, [0, 6, 0]);
  at('CONTROLE', OLIVE, 615, 1065, 24, 7, 14); at('GENERATEUR', STEEL, 372, 1085, 12, 5, 10); mute(at('MERLON', 0x97644f, 392, 1075, 6, 5, 30)); at('CRYOGENIE', STEEL, 520, 945, 12, 6, 12); // control and cryogenics at the pedestal; the generator is outside the loop behind a berm, so its noise stays out of the bowl
  put('RADOME', WHITE, pk(770, 1212), -1, 25, 14, 14, 14);                                    // left of the west portal; the right is kept clear: D1 is seen from the mouth
  apex('RADOME', WHITE, pk(700, 1185), 14, 14, 14, 8); apex('GRILLAGE', WIRE, pk(640, 1140), 1, 3, 60, 5); // the S down into the bowl goes round a fenced radome
  dish('D2', 690, 760, 20, 22); dish('D3', 805, 690, 20, 22); dish('D4', 712, 625, 20, 22); // on their pads either side of the arm: the kinks of the road dodge the pads
  for (let p = pk(755, 770), i = 0; p < pk(752, 670); p += 40, i++) { const r = put('RAILS', STEEL, p, -1, 6, 3, 0.5, 40); if (i) mute(r); } // the transporter track along the arm
  at('ATELIER ANTENNES', OLIVE, 835, 805, 34, 30, 34);                                        // the barn where a dish is overhauled, at the foot of the arm
  at('TRANSFORMATEUR', STEEL, 805, 575, 12, 5, 12); at('POSTE DE COMMANDE', OLIVE, 690, 525, 30, 8, 20); // the array's control building, inside the left turn that leaves the arm
};
