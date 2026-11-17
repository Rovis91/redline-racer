// "volcan" blockout, zone 4: La Couronne (PK 3130 to 4700, 200 to 232 to 177 m). Only this zone's named blocks; put() and abs() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).couronne = ({ put, abs }) => {
  const COAL = 0x22272a, SCORIA = 0x9b5348, CONCRETE = 0xb8b5a6, STEAM = 0xadadb0;
  abs('AIGUILLE NOIRE', COAL, 276, -1428, 34, 100, 34);                                  // hero landmark: the basalt needle inside the horseshoe, off the roadway
  put("POSTE D'OBSERVATION", CONCRETE, 3700, -1, 14, 12, 7, 16); put('BELVEDERE', CONCRETE, 3790, -1, 6, 14, 1.5, 40); // at the pass (232 m), sea side: the reason for the detour
  [[390, -1300], [-50, -1215], [-490, -1210], [450, -890]].forEach(([x, z]) => abs('SCORIES', SCORIA, x, z, 40, 10, 40)); // red-brown slag fields, as on the plan
  for (const pk of [4150, 4400]) put('SCORIES', SCORIA, pk, 1, 12, 30, 8, 50);
  abs('FUMEROLLE', STEAM, 60, -1080, 5, 30, 5); abs('FUMEROLLE', STEAM, 180, -1000, 5, 22, 5); // faint, far from the racing line
};
