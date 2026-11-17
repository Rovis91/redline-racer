// "volcan" blockout, zone 3: La Couronne (PK 2210 to 3780, 177 to 232 to 200 m). Only the named blocks of this zone; put() and abs() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).couronne = ({ put, abs }) => {
  const COAL = 0x22272a, SCORIA = 0x9b5348, CONCRETE = 0xb8b5a6;
  abs('AIGUILLE NOIRE', COAL, 276, -1428, 34, 100, 34);                                // hero landmark: the basalt needle inside the horseshoe, off the roadway
  put("POSTE D'OBSERVATION", CONCRETE, 3206, 1, 14, 12, 7, 16); put('BELVEDERE', CONCRETE, 3116, 1, 6, 14, 1.5, 40); // at the pass (232 m), sea side: the reason for the detour
  [[390, -1300], [-490, -1210], [450, -890]].forEach(([x, z]) => abs('SCORIES', SCORIA, x, z, 40, 10, 40)); // red-brown slag fields, as on the plan
  for (const pk of [2506, 2756]) put('SCORIES', SCORIA, pk, -1, 12, 30, 8, 50);
};
