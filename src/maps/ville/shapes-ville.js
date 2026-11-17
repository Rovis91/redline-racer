// Shapes specific to "ville": completes the shapes.js catalogue (same conventions: simple shape = geometry, assembly = list of boxes with zones). See docs/methods/SCENERY.md.
(function () {
  Object.assign(SHAPES, {
    // night market stall: X along the counter, facade toward -Z (the street); counter, smoking stove, four poles, tarp sloping toward the street (canvas zone, tinted per element), string of bulbs
    stallStand: () => [['counterTop', 3.4, 1, 1.6, 0, 0.5, 0], ['stove', 1, 0.3, 0.8, -0.8, 1.15, 0], ['counterTop', 3.4, 1.6, 0.2, 0, 0.8, 1.6],
      ...[-1.65, 1.65].flatMap(x => [['rod', 0.1, 2.7, 0.1, x, 1.35, -0.75], ['rod', 0.1, 2.9, 0.1, x, 1.45, 1.6]]),
      ['cloth', 3.9, 0.08, 3, 0, 2.75, 0.35, [-0.16, 0, 0]], ['bulbs', 3.6, 0.12, 0.12, 0, 2.35, -0.8]],
  });
})();
