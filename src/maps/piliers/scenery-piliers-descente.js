// "piliers" blockout, zone 5: Descente dans la brume (PK 2826 to 4042, +215 to +150 m, 14 m wide, 16 at the line). Only this zone's named blocks; put(), mass() and summit() are described in scenery-piliers.js.
// Relief (scenery-piliers.js): a 26 m buttress wall on the inside (right) with pillar P5 behind it, the cliff edge 12 m from the left wall: the sea of clouds under the road; HERO stands alone in the central ravine.
(window.PILIERS = window.PILIERS || {}).descente = ({ put, mass, summit }) => {
  const ROCK = 0xf0ddc6, FOREST = 0x718b82, DARK = 0x30484b;
  summit('AIGUILLE HERO +410', 830, 550, 410); // the compass of the lap, foot on the ravine floor: no road goes through it
  summit('PILIER P5 +280', 1050, 255, 280); // on the right flank of the buttress
  mass('AIGUILLE', ROCK, 760, 760, 40, 50, 250); mass('AIGUILLE', ROCK, 960, 640, 40, 40, 230); mass('AIGUILLE', ROCK, 720, 470, 35, 45, 220); // their feet are lost in the cloud
  mass('AIGUILLE', ROCK, 1500, 150, 60, 60, 300); mass('AIGUILLE', ROCK, 700, -160, 60, 70, 280); mass('AIGUILLE', ROCK, -120, 420, 60, 60, 320); mass('AIGUILLE', ROCK, 400, 1080, 60, 60, 300); // far skyline, outside the loop
  put('BUSE', DARK, 3290, -1, 3, 6, 3, 4);                                                           // buried culvert (east 924, north 217): the stream passes under the road, no water on it
  for (const p of [3740, 3840, 3930]) { put('FORET', FOREST, p, -1, 14, 50, 14, 70); put('BOSQUET', FOREST, p + 40, 1, 8, 24, 10, 40); } // the woods close the horizon again before the line
  for (let p = 3720, k = 0; p < 4030; p += 35, k++) put('ARBRE', 0x5a4632, p, k % 2 ? 1 : -1, 1.5, 3, 22, 3); // the slalom between the trunks starts again and runs through the line into zone 1
};
