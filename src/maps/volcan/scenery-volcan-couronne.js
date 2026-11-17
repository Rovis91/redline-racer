// "volcan" blockout, zone 3: La Couronne (PK 2210 to 3780, 177 to 232 to 200 m). Only the named blocks of this zone; put(), abs(), over(), row() and lot() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).couronne = ({ put, abs, row, lot }) => {
  const COAL = 0x22272a, SCORIA = 0x9b5348, CONCRETE = 0xb8b5a6, STEAM = 0xadadb0, CRUST = 0x1c1c1e, STEEL = 0x555a60, BASALT = 0x34373d;
  abs('AIGUILLE NOIRE', [COAL, 'cone'], 276, -1428, 44, 105, 44);                                             // hero landmark: the basalt needle inside the horseshoe, off the roadway
  lot('ROCHER', BASALT, [[236, -1400], [312, -1410], [300, -1466], [246, -1462], [276, -1380]], 16, 12, 16);   // the scree at its foot
  put("POSTE D'OBSERVATION", CONCRETE, 3206, 1, 14, 12, 7, 16); put('ANTENNE', [STEEL, 'cyl'], 3222, 1, 18, 1, 20, 1); // at the pass (232 m), sea side: the reason for the detour
  put('BELVEDERE', CONCRETE, 3116, 1, 4, 16, 1.5, 44); put('BALUSTRADE', STEEL, 3116, 1, 20.5, 0.5, 2.6, 44); row('BANC', STEEL, [3100, 3116, 3132], 1, 12, 1, 0.8, 3);
  lot('SCORIES', SCORIA, [[390, -1300], [-490, -1210], [450, -890]], 40, 10, 40); lot('', [SCORIA, 'cone'], [[410, -1262], [470, -925], [-455, -1180]], 22, 14, 22); // red-brown slag fields, as on the plan
  row('SCORIES', SCORIA, [2506, 2756], -1, 12, 30, 8, 50);
  lot('FUMEROLLE', [STEAM, 'cyl'], [[150, -930], [60, -1150]], 5, 26, 5);                                     // on the outer slope of the cone, seen across the horseshoe
  abs('COULEE FIGEE', CRUST, 270, -560, 40, 4, 120); abs('', CRUST, 300, -470, 60, 3, 70);                    // an old flow at the foot of the south-east flank, seen from Les Cendres
  abs('CONE ADVENTIF', [SCORIA, 'cyl'], -690, -930, 40, 6, 40);                                               // the cap of the parasitic cone of the west flank
  lot('ILOT', [COAL, 'cone'], [[-1060, -700], [-1010, -1180], [-760, -1500], [-1090, -760]], 34, 60, 34);     // sea stacks off the roadless west and north coast
  row('BORNE', CONCRETE, [2300, 2700, 3400, 3700], 1, 1, 1, 1.4, 1);                                          // marker stones of the old service road
};
