// "piliers" blockout, zone 5: Descente dans la brume (PK 2826 to 4042, +215 to +150 m, 14 m wide, 16 at the line). Only this zone's named blocks; put() and mass() are described in scenery-piliers.js.
(window.PILIERS = window.PILIERS || {}).descente = ({ put, mass }) => {
  const ROCK = 0xf0ddc6, WARM = 0xed8f89, STONE = 0xa5c3c8, FOREST = 0x718b82, DARK = 0x30484b;
  mass('AIGUILLE HERO +410', ROCK, 830, 550, 80, 190, 410);  // the compass of the lap, foot on the ravine floor: no road goes through it
  mass('PILIER P5 +280', WARM, 1050, 255, 70, 110, 280);     // on the right flank of the buttress
  mass('AIGUILLE', ROCK, 760, 760, 40, 50, 250); mass('AIGUILLE', ROCK, 960, 640, 40, 40, 230); mass('AIGUILLE', ROCK, 720, 470, 35, 45, 220); // their feet are lost in the cloud
  mass('AIGUILLE', ROCK, 1500, 150, 60, 60, 300); mass('AIGUILLE', ROCK, 700, -160, 60, 70, 280); mass('AIGUILLE', ROCK, -120, 420, 60, 60, 320); mass('AIGUILLE', ROCK, 400, 1080, 60, 60, 300); // far skyline, outside the loop
  for (const p of [2900, 3040, 3180, 3330, 3480, 3630]) put('FALAISE', WARM, p, 1, 4, 24, 26, 70);  // continuous wall on the inside (right), warmer sandstone
  for (const p of [2960, 3260, 3560]) put('MURET', STONE, p, -1, 1, 1.5, 1.5, 80);                  // low wall on the outside (left): the sea of clouds under the road
  put('BUSE', DARK, 3290, -1, 3, 6, 3, 4);                                                           // buried culvert (east 924, north 217): the stream passes under the road, no water on it
  for (const p of [3740, 3840, 3930]) { put('FORET', FOREST, p, -1, 6, 50, 14, 70); put('BOSQUET', FOREST, p + 40, 1, 8, 24, 10, 40); } // the woods close the horizon again before the line
  put('MURET DE RACCORD', STONE, 3990, 1, 2, 1.5, 1.5, 40);
};
