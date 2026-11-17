// "area51", zone 3: Champ d'antennes (down to -12 m in the bowl, half loop round D1, then north up the array arm to +9 m, 20 m wide). Real scenery (V2).
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-dish.js, -radio.js, -airfield.js, -hall.js and -perimetre.js.
// D1, the listening dish, sits in a bowl so the rim screens it from the radio noise of the base; its road ends in a loop round the pedestal, with the plant a dish needs beside it.
// The smaller dishes stand on pads along a rail line (they are moved by rail), with the assembly barn at the foot of the arm and the control building of the array at its head.
// Every bend has the thing it goes round on its inside: the road reads as laid after the installations, between them. All the dishes point the same way.
(window.AREA51 = window.AREA51 || {}).antennes = ({ MAT, set, side, inside, dish, pk }) => {
  dish(560, 1010);                                                                            // D1, the landmark of the lap: 120 m across on a 50 m mount, seen from the west portal of B1, then circled
  set('shedArea51', 615, 1065, { a: [24, 7, 14], ry: Math.PI }); set('cryoArea51', 520, 945);   // control and cryogenics at the pedestal
  set('groupeArea51', 372, 1085); set('merlonArea51', 392, 1075, { a: [6, 5, 30], skin: MAT.sol }); // the generator is outside the loop behind a berm: its noise stays out of the bowl
  // radomes: one left of the west portal (the right is kept clear: D1 is seen from the mouth), one fenced, inside the S down into the bowl
  const radome = (p, sd, off) => { side('cylArea51', p, sd, off, 7, { a: [6, 2.5, 8], skin: MAT.concrete }); side('radomeArea51', p, sd, off, 7, { a: [7], skin: MAT.white, dy: 2.4 }); };
  radome(pk(770, 1212), -1, 25); radome(pk(700, 1185), inside(pk(700, 1185)), 8); side('clotureArea51', pk(640, 1140), inside(pk(640, 1140)), 5, 0.5, { a: [60] });
  dish(690, 760, 0.34); dish(805, 690, 0.34); dish(712, 625, 0.34);                            // D2, D3, D4 (40 m) on their pads either side of the arm: the kinks of the road dodge the pads
  for (let p = pk(755, 770); p < pk(752, 670); p += 40) side('railsArea51', p, -1, 6, 1.5);    // the transporter track along the arm
  set('shedArea51', 835, 805, { a: [34, 30, 34], ry: Math.PI / 2 });                           // the barn where a dish is overhauled, its door toward the arm
  set('transfoArea51', 805, 575, { a: [12, 12] }); set('shedArea51', 690, 525, { a: [30, 8, 20], ry: -Math.PI / 2 }); // the control building of the array, inside the left turn that leaves the arm
};
