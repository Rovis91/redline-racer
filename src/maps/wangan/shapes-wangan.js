// Shapes specific to "wangan": completes the shapes.js catalogue (same conventions: assembly = list of boxes with zones). See docs/methods/SCENERY.md.
// Frame: origin at the foot of the object; for what sits on the road (toll), X across (positive to the right), Z toward the rear.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // red and white breakwater lighthouse: base, shaft in six bands that taper, gallery, lantern (lit), dome; the lantern is at 27.8 m
    headlight: () => [['concretePart', 8, 2, 8, 0, 1, 0], ...[0, 1, 2, 3, 4, 5].map(k => [k % 2 ? 'whiteN' : 'redTone', 4.2 - k * 0.3, 4, 4.2 - k * 0.3, 0, 4 + k * 4, 0]),
      ['steelMat', 5.4, 0.5, 5.4, 0, 26.25, 0], ...pair(sx => ['steelMat', 0.12, 1.1, 5.4, sx * 2.65, 27, 0]), ['lampObj', 2.2, 2.6, 2.2, 0, 27.8, 0], ['redTone', 2.8, 1, 2.8, 0, 29.6, 0], ['steelMat', 0.2, 2, 0.2, 0, 31, 0]],
    // tower crane: 60 m lattice mast, 50 m jib toward +X, counter-jib and ballast toward -X, cab under the jib, A-frame tip
    towerCrane: () => [['concretePart', 7, 1.2, 7, 0, 0.6, 0], ['lattice', 2, 60, 2, 0, 30, 0], ['lattice', 52, 1.6, 1.6, 25, 61, 0], ['steelMat', 18, 1, 2.4, -9, 61, 0], ['concretePart', 4, 3, 2.8, -15, 59.8, 0],
      ['cabin', 2.6, 2.4, 2.4, 1.6, 59, 1.8], ['pane', 2.7, 1, 2.5, 1.6, 59.3, 1.8], ['lattice', 1.2, 7, 1.2, 0, 65.3, 0], ['steelMat', 0.2, 0.2, 40, 18, 64, 0, [0, 1.5708, -0.13]], ['steelMat', 0.2, 0.2, 16, -8, 64.5, 0, [0, 1.5708, 0.4]],
      ['steelMat', 0.15, 22, 0.15, 30, 49, 0], ['steelMat', 1.6, 1, 1.2, 30, 60, 0], ['steelMat', 1.2, 1, 1.2, 30, 37.6, 0]], // trolley, cable and block
    // toll booth: concrete island with a yellow nose, cabin with lit windows, flat canopy
    sentryBox: () => [['concretePart', 2.4, 0.4, 7, 0, 0.2, 0], ['nose', 2.4, 0.9, 0.6, 0, 0.45, -3.6], ['cabin', 1.8, 2.6, 2.6, 0, 1.7, 0], ['pane', 1.9, 1.1, 2.7, 0, 2.15, 0], ['cabin', 2.2, 0.2, 3, 0, 3.1, 0]],
    // toll station canopy, L m across: slab, underside lit with sodium, sign fascia on the arrival side, posts off the carriageway (at ±L/2)
    awningToll: L => [['roofM', L, 1.2, 14, 0, 8.2, 0], ['lampObj', L - 2, 0.1, 12, 0, 7.55, 0], ['signboard', L * 0.5, 1.6, 0.2, 0, 8.4, 7.1],
      ...pair(sx => pair(sz => ['steelMat', 0.8, 7.6, 0.8, sx * L / 2, 3.8, sz * 5])).flat()],
    // love hotel sign on a mast: light box, tilted heart above, "vacant" banner below
    // pleasure boats, origin at the waterline at the middle, X toward the bow, length 1 (scaled per instance: [x, y, z, ry, L, L, L]).
    // hull: a straight body, then the bow tapers in three slices to the stem, stern slightly raised; dark boot-top stripe at the waterline
    sailboat: () => [['hull', 0.6, 0.11, 0.3, -0.18, 0.04, 0], ['hull', 0.16, 0.11, 0.25, 0.19, 0.045, 0], ['hull', 0.1, 0.11, 0.17, 0.32, 0.05, 0], ['hull', 0.08, 0.1, 0.08, 0.41, 0.055, 0],
      ['rubStrip', 0.62, 0.02, 0.31, -0.17, -0.005, 0], ['bridge', 0.7, 0.008, 0.26, -0.08, 0.1, 0],
      ['deckhouse', 0.26, 0.05, 0.17, -0.02, 0.13, 0], ['deckhouse', 0.06, 0.04, 0.15, 0.13, 0.12, 0, [0, 0, -0.5]], ['portholes', 0.22, 0.02, 0.175, -0.02, 0.135, 0], // low deckhouse, raked bow, band of portholes
      ['mat', 0.012, 1.3, 0.012, 0.08, 0.75, 0], ['mat', 0.4, 0.012, 0.012, -0.12, 0.25, 0], ['veil', 0.36, 0.05, 0.03, -0.12, 0.28, 0], // mast, boom, furled mainsail
      ['mat', 0.006, 0.9, 0.006, 0.26, 0.6, 0, [0, 0, -0.5]]], // forestay
    // motor boat: taller hull, glazed cabin with raked windscreen, hard-top arch
    motorboat: () => [['hull', 0.6, 0.15, 0.34, -0.2, 0.06, 0], ['hull', 0.16, 0.15, 0.28, 0.18, 0.065, 0], ['hull', 0.1, 0.14, 0.18, 0.31, 0.07, 0], ['hull', 0.07, 0.12, 0.08, 0.39, 0.075, 0],
      ['rubStrip', 0.62, 0.02, 0.35, -0.19, -0.01, 0], ['bridge', 0.72, 0.008, 0.3, -0.1, 0.14, 0],
      ['whiteN', 0.34, 0.1, 0.26, -0.08, 0.19, 0], ['portholes', 0.3, 0.05, 0.265, -0.1, 0.2, 0], ['portholes', 0.06, 0.08, 0.24, 0.11, 0.2, 0, [0, 0, 0.7]], // cabin and windscreen
      ['whiteN', 0.24, 0.015, 0.24, -0.12, 0.25, 0], ['mat', 0.012, 0.12, 0.2, -0.02, 0.31, 0]], // hard-top and radar arch
    // 42 m yacht, origin at the waterline at the middle, X toward the bow: hull, three recessed glazed decks, flybridge with bar, radar mast; the party is on the aft deck and the flybridge
    yacht: () => [['hull', 42, 3.2, 8.4, 0, 0.6, 0], ['hull', 6, 2.8, 6, 23, 0.8, 0], ['bridge', 40, 0.15, 8, -0.5, 2.3, 0],
      ['whiteN', 24, 2.6, 7.2, 2, 3.6, 0], ['portholes', 24.2, 1.2, 7.3, 2, 3.7, 0], ['whiteN', 18, 2.4, 6.4, 0, 6.1, 0], ['portholes', 18.2, 1.1, 6.5, 0, 6.2, 0],
      ['bridge', 22, 0.15, 7, -3, 7.4, 0], ['whiteN', 7, 1.2, 1.2, 4, 8.1, 0], ['whiteN', 0.4, 4, 0.4, 2, 9.4, 0], ['whiteN', 2.6, 0.3, 0.3, 2, 10.6, 0],
      ...pair(sz => ['whiteN', 14, 0.9, 0.12, -11, 2.85, sz * 3.9]), ...pair(sz => ['whiteN', 10, 0.9, 0.12, -7, 7.9, sz * 3.4])],
    // coaster container ship, low in the water to pass under the cable-stayed bridge (25 m above the waterline at its highest, the deck is 32 m above the water),
    // origin at the waterline at the middle, X toward the bow: hold, hull, stem, container bays (4 high at most), aft superstructure and bridge, mast, low funnel
    coaster: (L, bays = []) => [['keel', L, 4, 24, 0, -1.5, 0], ['hull', L, 7, 24, 0, 4, 0], ['keel', 16, 4, 16, L / 2, -1.5, 0, [0, 0.785, 0]], ['hull', 16, 7, 16, L / 2, 4, 0, [0, 0.785, 0]],
      ...bays.map((n, k) => ['cargo', 22, 2.6 * n, 23, -L / 2 + 40 + k * 24, 7.5 + 1.3 * n, 0]),
      ['whiteN', 12, 9, 22, -L / 2 + 12, 12, 0], ['portholes', 12.4, 6, 22.4, -L / 2 + 12, 12.5, 0], ['whiteN', 6, 2.6, 26, -L / 2 + 14, 17.8, 0], ['portholes', 6.2, 1.2, 26.2, -L / 2 + 14, 18, 0],
      ['whiteN', 0.6, 6, 0.6, -L / 2 + 12, 22, 0], ['chimney', 5, 5, 5, -L / 2 + 5, 19, 0], ['whiteN', 1, 9, 1, L / 2 - 4, 11.5, 0]],
    // partygoer: a dark standing silhouette (body, head), 1.75 m
    partygoer: () => [['payload', 0.5, 1.4, 0.32, 0, 0.7, 0], ['payload', 0.24, 0.26, 0.24, 0, 1.57, 0]],
    // lit quay bollard, 1.1 m: shaft and lit head
    bollardQuay: () => [['shaft', 0.22, 0.9, 0.22, 0, 0.45, 0], ['lampObj', 0.28, 0.22, 0.28, 0, 1, 0]],
    // pontoon: deck on floats, l m long (along X), 2.4 m wide
    pontoon: l => [['boards', l, 0.25, 2.4, 0, 0.45, 0], ...[-1, 1].map(sz => ['floater', l, 0.5, 0.4, 0, 0.1, sz * 0.95])],
    // stacked wooden pallets (n); wrapped crate placed on top or not
    pallets: (n, loadTest) => [...Array.from({ length: n }, (_, k) => ['wood', 1.2, 0.14, 1, 0, 0.07 + k * 0.15, 0]), ...(loadTest ? [['film', 1.1, 1, 0.95, 0, n * 0.15 + 0.5, 0]] : [])],
    // forklift: body, counterweight, mast and forks (toward +X), protective roof on four posts, wheels
    trolley: () => [['carBody', 2.2, 1, 1.2, 0, 0.75, 0], ['counterweight', 0.6, 1, 1.15, -1.2, 0.8, 0], ['steelMat', 0.12, 3.2, 0.9, 1.25, 1.6, 0], ...pair(sz => ['steelMat', 1.1, 0.06, 0.14, 1.85, 0.12, sz * 0.32]),
      ...pair(sx => pair(sz => ['steelMat', 0.07, 1.1, 0.07, sx * 0.75 + 0.1, 1.8, sz * 0.52])).flat(), ['carBody', 1.8, 0.07, 1.2, 0.1, 2.35, 0],
      ...[-0.7, 0.7].flatMap(x => pair(sz => ['wheelPart', 0.6, 0.6, 0.25, x, 0.3, sz * 0.55]))],
    // height gauge gantry before the tunnel, placed on the road (X across): two posts off the carriageway, striped bar, height limit sign
    template: W => [['limit', 2 * W + 2, 0.7, 0.4, 0, 6.1, 0], ...pair(sd => ['structure', 0.4, 6.5, 0.4, sd * (W + 1), 3.25, 0]), ['signPanel', 3, 3, 0.2, 0, 8.3, 0]],
    // big wheel carousel: platform, mast, faceted roof, horses on their poles; it turns around Y
    carouselRide: () => [['plinth', 15, 0.6, 15, 0, 0.3, 0], ['plinth', 15, 0.6, 15, 0, 0.3, 0, [0, 0.785, 0]], ['mat', 1.2, 6, 1.2, 0, 3.6, 0], ['roofM', 16, 0.8, 16, 0, 6.6, 0, [0, 0.39, 0]], ['roofM', 10, 1.6, 10, 0, 7.6, 0, [0, 0.39, 0]], ['roofM', 4, 1.4, 4, 0, 9, 0, [0, 0.39, 0]],
      ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(k => { const a = k * 0.785, x = Math.cos(a) * 5.4, z = Math.sin(a) * 5.4; return [['barLine', 0.1, 5.4, 0.1, x, 3.3, z], ['horse', 1.6, 0.9, 0.45, x, 1.9 + (k % 2) * 0.5, z, [0, -a + 1.5708, 0]]]; })],
    // funfair ticket booth: hut, lit window, striped awning, sign
    ticketDesk: () => [['hut', 3, 2.6, 2.4, 0, 1.3, 0], ['pane', 1.8, 1, 0.1, 0, 1.6, 1.22], ['awning', 3.4, 0.15, 1.2, 0, 2.7, 1.6, [0.3, 0, 0]], ['signboard', 3, 0.7, 0.2, 0, 3.1, 1.1]],
    // drinks vending machine (the Japanese pavement): cabinet, lit front
    dispenser: () => [['carBody', 1, 1.8, 0.8, 0, 0.9, 0], ['facade', 0.9, 1.2, 0.05, 0, 1.15, 0.41]],
    // sorting bin, two bins; 6 m street lamp with a curved arm
    trashcan: () => [['binOf', 0.5, 0.9, 0.4, -0.28, 0.45, 0], ['bin2', 0.5, 0.9, 0.4, 0.28, 0.45, 0]],
    streetlampStreet: () => [['shaft', 0.18, 6, 0.18, 0, 3, 0], ['shaft', 1.2, 0.12, 0.12, 0.6, 6, 0], ['lampObj', 0.6, 0.18, 0.35, 1.1, 5.9, 0]],
    signboardHotel: () => [['steelMat', 0.8, 16, 0.8, 0, 8, 0], ['signboard', 10, 4, 0.6, 0, 17, 0], ['heart', 3.2, 3.2, 0.6, 0, 21.6, 0, [0, 0, 0.785]], ['vacant', 6, 1.2, 0.5, 0, 14.2, 0]],
  });
})();
