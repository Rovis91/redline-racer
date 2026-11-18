// The former trials now play on the race radios. Kept for standalone audition tools.
(function (G) {
  G.MUS.TRIALS = Object.values(G.MUS.RADIO).flat().filter(station => station.ref);
})(typeof window !== 'undefined' ? window : globalThis);
