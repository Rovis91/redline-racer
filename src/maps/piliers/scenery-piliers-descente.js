// "piliers", zone 5: Descente dans la brume (PK 2826 to 4042, +215 to +150 m, 14 m wide, 16 at the line). Only the scenery of this zone; the helpers are described in scenery-piliers.js.
// Relief and rock (scenery-piliers.js): a 26 m bedded buttress wall on the inside (right) with tower P5 behind it, the retaining wall and the cliff edge 12 m from the left parapet: the sea of clouds under the road; HERO stands alone in the central ravine.
(window.PILIERS = window.PILIERS || {}).descente = ({ at, by, wood, tree, bush, nz, needle }) => {
  needle(760, 760, 40, 50, 250, 5); needle(960, 640, 40, 40, 230, 6); needle(720, 470, 35, 45, 220, 7); // needles of the central ravine, their feet lost in the cloud
  needle(1500, 150, 60, 60, 300, 8); needle(700, -160, 60, 70, 280, 9); needle(-120, 420, 60, 60, 320, 10); needle(400, 1080, 60, 60, 300, 11); // nearer skyline, outside the loop
  wood(2900, -1, 2, 9, 60, 0); wood(3150, -1, 2, 9, 80, 0); wood(3480, -1, 2, 9, 80, 0); // low growth on the bench between the parapet and the retaining wall
  by('busePiliers', 3290, 1, 8); // buried culvert (east 924, north 217): its stone headwall at the foot of the buttress, where the stream goes under the road; no water on the lane
  for (const p of [3740, 3840, 3930]) { wood(p, -1, 14, 50, 70, 1); wood(p + 40, 1, 8, 24, 40, 1); } // the woods close the horizon again before the line
  for (let p = 3700; p < 4040; p += 9) for (const sd of [-1, 1]) { const s = at(p), [x, z] = PLACERS.edgePt(s, sd, s.w + 3.5 + 5 * nz(p, sd)); bush(x, z, 4 + 4 * nz(sd, p), 1.5 + 2 * nz(p, 9)); } // undergrowth at the foot of the parapets, as in zone 1
  for (let p = 3720, k = 0; p < 4030; p += 35, k++) { const s = at(p), [x, z] = PLACERS.edgePt(s, k % 2 ? 1 : -1, s.w + 3); tree(x, z, 22, 1.15); } // the slalom between the trunks starts again and runs through the line into zone 1
};
