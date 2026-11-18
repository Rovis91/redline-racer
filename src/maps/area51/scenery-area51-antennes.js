// "area51", zone 3: Champ d'antennes (down to -12 m in the bowl, half loop round D1, then north up the array arm to +9 m, 20 m wide). Real scenery (V2).
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-dish.js, -radio.js, -airfield.js, -hall.js and -perimetre.js.
// D1, the listening dish, sits in a bowl so the rim screens it from the radio noise of the base; its road ends in a loop round the pedestal, with the plant a dish needs beside it.
// The smaller dishes stand on pads along a rail line (they are moved by rail), with the assembly barn at the foot of the arm and the control building of the array at its head.
// Every bend has the thing it goes round on its inside: the road reads as laid after the installations, between them. All the dishes point the same way.
(window.AREA51 = window.AREA51 || {}).antennes = ({ MAT, set, side, along, sideXZ, inside, dish, pk }) => {
  dish(560, 1010);                                                                            // D1, the landmark of the lap: 120 m across on a 50 m mount, seen from the west portal of B1, then circled
  set('shedArea51', 615, 1065, { a: [24, 7, 14], ry: Math.PI }); set('cryoArea51', 520, 945);   // control and cryogenics at the pedestal
  set('groupeArea51', 372, 1085); set('merlonArea51', 392, 1075, { a: [6, 5, 30], skin: MAT.sol }); // the generator is outside the loop behind a berm: its noise stays out of the bowl
  // radomes: one left of the west portal (the right is kept clear: D1 is seen from the mouth), one fenced, inside the S down into the bowl
  const radome = (p, sd, off) => { side('cylArea51', p, sd, off, 7, { a: [6, 2.5, 8], skin: MAT.concrete }); side('radomeArea51', p, sd, off, 7, { a: [7], skin: MAT.white, dy: 2.4 }); };
  radome(pk(770, 1212), -1, 25); radome(pk(700, 1185), inside(pk(700, 1185)), 8); along('clotureArea51', pk(640, 1140) - 30, pk(640, 1140) + 30, inside(pk(640, 1140)), 5, 0.5, 10);
  // round the loop: the fenced compound of D1 on the inside; on the outside, where the eye goes in the long right-hander, the ring that serves the dish: floodlight masts, equipment shelters, small calibration dishes, a relay mast, the power feed
  const l0 = pk(640, 1140) + 40, l1 = pk(650, 878) - 20, step = (l1 - l0) / 9; along('clotureArea51', l0, l1, 1, 14, 0.5, 10);
  for (let i = 0; i < 10; i++) { const p = l0 + i * step, what = i % 5;
    if (what === 0 || what === 3) side('mastLighting', p, -1, 9, 2.5, { s: 0.5 }); else if (what === 1) side('gueriteArea51', p, -1, 10, 3, { a: [6, 10] }); else if (what === 2) dish(...sideXZ(p, -1, 22), 0.1); else side(i === 4 ? 'mastRelaisArea51' : 'transfoArea51', p, -1, 12, i === 4 ? 1 : 6, { a: i === 4 ? [26] : [12, 10] }); }
  dish(690, 760, 0.34); dish(805, 690, 0.34); dish(712, 625, 0.34);                            // D2, D3, D4 (40 m) on their pads either side of the arm: the kinks of the road dodge the pads
  along('railsArea51', pk(755, 770), pk(752, 670), -1, 6, 1.5, 10);                            // the transporter track along the arm
  set('shedArea51', 835, 805, { a: [34, 30, 34], ry: Math.PI / 2 });                           // the barn where a dish is overhauled, its door toward the arm
  set('transfoArea51', 805, 575, { a: [12, 12] }); set('shedArea51', 690, 525, { a: [30, 8, 20], ry: -Math.PI / 2 }); // the control building of the array, inside the left turn that leaves the arm
};
