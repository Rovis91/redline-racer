// Station trials, outside the game: one per user reference track (folder "music original", ignored by git).
// Second version: each reference separated (demucs), then transcribed (basic-pitch) and measured (librosa): chord grid, kick patterns,
// snare and hi-hat, hi-hat dynamics (hn), swing (sw), bass rhythm and register, density of the accompaniment parts, voice range.
// These readings are carried over; the themes are still written here (no melody is copied). Each station has its own form.
// ref: the track that inspired it · for: the map it would go to. Listen: essais-musique/index.html. The chosen station goes into RADIO (mapDefs.js).
// Checked by test-mapDefs.js like the game's stations (tuning, timbres, form). Levels (vol) set by measurement to about -21 dB RMS.
(function (G) {
  const { st } = G.MUS, F4 = 'x...x...x...x...', OFF = '..o...o...o...o.', SN = '....x.......x...', CP = '....c.......c...';
  G.MUS.TRIALS = [
    // Some Nights: E minor at 126, clearly swung hi-hats (swing 0.3 to 0.4), dark low chords (G, E, B major), sparse syncopated bass, voice up front moving by steps
    st({ ref: 'Class Fools - Some Nights', destFor: 'givre', name: 'NUITS 126', gO: -12, drumset: { sS: 'sn1', hS: 'hhcp', hA: 'hhc', hOo: 'hho' }, fq: '97.9', vol: 1.5, genre: 'INDIE DANCE', bpm: 126, sw: 0.3, hn: [1, 0.6, 0.8, 0.86], scl: 'mineur', borrows: 'B', key: 52, kit: 'lin', eq: [2, 1400, 0, 3], rev: 0.22, echo: [3, 0.24], pump: 0.5, // swung hi-hat, clean plucked guitar, choir as a pad, syncopated bass, theme sung by steps
      prog: ['G Em Em B', 'C Em C B'], k: ['x...x...x.x.x...', 'x.x.x...x.x.x.x.'], s: [SN, '....x..x....x...'], h: ['x.x.x.x.x.x.x.x.', 'xxx.xxx.xxx.xxx.'],
      b: ['bPick', '. . 0 0 - - . . . . . . 0 - 0 -', '. . 0 0 - - . . 12 - . . 0 - 7 -'], g: ['gtCleanLd', 'x..x..x...x..x..'], d: ['warm', 0],
      l: ['chorusLd', '19 - 17 - 15 - - - 14 - 15 - 17 - - - | 15 - - - 14 - 12 - 14 - - - . - - - | 19 - - - 17 - 15 - 17 - 19 - 22 - - - | 23 - - - 19 - - - 14 - - - - - - -',
        '20 - 19 - 17 - - - 15 - 17 - 19 - - - | 19 - - - 15 - - - 12 - - - 14 - 15 - | 17 - - - 20 - - - 24 - - - 22 - 20 - | 19 - - - 23 - - - 26 - - - - - - -'],
      sec: { i: 'h0 g0 lo', a: 'k0 s0 h0 b0 g0', b: 'k0 s1 h0 b1 g0 d', c: 'k1 s0 h1 b1 g0 l0 d', x: 'g0 d P1 lo', u: 'k0 h1 b0 d roll P1', e: 'k1 s1 h1 b1 l1 P1' }, form: 'iaabcxbcue' }),
    // In Game 7: E flat at 129, a fifth chord that barely moves, eighth-note bass that jumps an octave and slides a semitone above (Phrygian colour: E natural),
    // broken kick, almost continuous hi-hat, dense synth parts
    st({ ref: 'Colin McRae Rally 2.0 - In Game 7', destFor: 'terre', name: 'SPECIALE 7', aO: -12, drumset: { sS: 'sn3', sR: 1.12, sG: 'sn1g', hS: 'hhc' }, fq: '88.4', vol: 0.86, genre: 'BREAKS PLANANTS', bpm: 129, sw: 0.05, hn: [1, 0.76, 0.98, 0.68], scl: 'mineur', borrows: 'E', key: 51, kit: 'brk', eq: [-3, 1500, 2, 5], rev: 0.24, echo: [3, 0.3], pump: 0.55, // broken breakbeat, bass rolling in octaves, glass pad, vibraphone arpeggio, theme in very long notes; E major (minor second) at the end of the phrase
      prog: ['Ebm Ebm Ebm E', 'Ebm Ebm Db E'], k: ['x...x..xx..xx.x.', 'x..xx...x.x.x...'], s: ['....x..g.g..x..g', '....x.......x.gg'], h: ['x.x.xxx.x.xxxxx.', 'xxx.x.xxx.x.xxx.'],
      b: ['bAcid', '0 12 0 0 12 0 0 12 0 12 0 0 12 0 0 12', '0 12 0 0 12 0 0 12 0 0 12 0 0 1 0 12'], d: ['glass', 0], a: ['vibraArp', '0.4.1.4.2.4.1.4.', '0124012401240124'],
      l: ['ldEwi', '19 - - - - - - - 15 - - - 14 - - - | 12 - - - - - - - . - - - - - - - | 15 - - - - - - - 12 - - - 10 - - - | 8 - - - - - - - . - - - - - - -',
        '19 - - - - - - - 24 - - - - - - - | 22 - - - - - - - 15 - - - - - - - | 17 - - - - - - - 12 - - - - - - - | 8 - - - - - - - . - - - - - - -'],
      sec: { i: 'h0 d lo', a: 'k0 s0 h0 b0 d', b: 'k0 s0 h1 b0 a0', c: 'k1 s1 h1 b1 a1 l0 d', x: 'l1 d P1', u: 'k0 h1 b1 a0 roll P1', e: 'k1 s1 h1 b1 a1 l1 P1' }, form: 'iabbcxuccea' }),
    // The opening credits: D major at 132, heavy rock on a D that barely leaves (C natural in passing), bass in octaves, busy drums, hi-hat in sixteenth notes
    st({ ref: 'Colin McRae Rally 2.0 - Theme', destFor: 'terre', name: 'ASSISTANCE', drumset: { sS: 'sn1', sR: 0.9, hS: 'hhc', hOo: 'hhl' }, fq: '106.2', vol: 0.56, genre: 'BREAKS ROCK', bpm: 132, sw: 0.08, hn: [1, 0.34, 0.57, 0.44], scl: 'majeur', key: 50, kit: 'rock', eq: [-2, 1400, 3, 2], rev: 0.15, echo: [2, 0.2], pump: 0.6, // busy rock drums, fat bass in octaves, real crunch guitar in eighth notes, strings, theme on overdriven guitar in major
      prog: ['D D G A', 'Bm G A A'], k: ['x.xx..x..xx..x..', 'x.x...x.xx..x.x.'], s: [SN, '....x..g....x.gg'], h: ['xxxxxxxxxxxxxxxx', 'x.x.x.x.x.x.x.o.'],
      b: ['bGrit', '0 12 0 0 12 0 0 12 0 12 0 0 12 0 12 0', '0 0 0 0 0 0 0 0 0 0 0 0 7 7 12 12'], c: ['gtSat', 'x.xxx.xxx.xxx.xx', 'x..x..x.x..x..x.'], cO: -12, d: ['strings', 0],
      l: ['ldGuitar', '12 - - - 16 - - - 19 - 16 - 14 - - - | 12 - - - - - - - . - - - 7 - 9 - | 17 - - - 21 - - - 24 - 21 - 19 - - - | 19 - - - 23 - - - 26 - - - - - - -',
        '21 - - - 24 - - - 28 - - - 24 - - - | 17 - - - 21 - - - 24 - - - 21 - - - | 19 - - - 23 - - - 26 - - - 23 - - - | 19 - - - - - - - . - - - - - - -'],
      sec: { i: 'h1 b0 lo', a: 'k0 s0 h1 b0 c1', b: 'k0 s0 h0 b0 c0 d', c: 'k1 s1 h0 b0 c0 l0', x: 'b1 l1 d P1 lo', u: 'k1 h0 b0 c0 roll P1', e: 'k1 s1 h0 b0 c0 l1 P1' }, form: 'iabcbcxuce' }),
    // Monochrome Roulette: A flat major at 144, very dense accompaniment (five or six notes at a time, suspended and seventh chords), bass that never stops moving
    st({ ref: 'Enthusia - Monochrome Roulette', destFor: 'chapada', name: 'DAMIER 144', lO: -12, drumset: { cS: 'clap', hS: 'hhcp', hOo: 'hho' }, fq: '84.6', vol: 1, genre: 'FUSION HOUSE', bpm: 144, sw: 0.08, hn: [1, 0.63, 0.97, 0.55], scl: 'majeur', key: 56, kit: 'k909', eq: [-4, 1200, 4, 1], rev: 0.16, echo: [3, 0.24], pump: 0.6, // house with seventh chords, slapped bass, real electric piano comping tightly, vibraphone arpeggio, strings, theme on a softened wind controller
      prog: ['AbM7 Fm7 DbM7 Eb7', 'DbM7 Cm7 Fm7 Eb7'], k: [F4], s: [CP, '....c.......c..c'], h: [OFF, 'x.o.x.o.x.o.x.o.'],
      b: ['bSlap', '0 - 12 - 0 0 - 7 - 12 - 0 - 7 9 12', '0 - - 0 - - 7 - 12 - - 7 - - 0 -'], c: ['rhodesSoft', '..x..x.x..x..x.x', 'x..x..x...x..x..'], cO: -12, a: ['vibraArp', '0.2.1.3.2.4.1.3.'], d: ['strings', 0],
      l: ['ldEwiSoft', '12 - - 16 - - 19 - 23 - - - 19 - - - | 21 - - - 19 - - - 16 - - - 12 - - - | 17 - - - 21 - - - 24 - - - 28 - - - | 26 - - - 23 - - - 19 - - - 17 - - -',
        '17 - - 21 - - 24 - 28 - - - 24 - - - | 16 - - 19 - - 23 - 26 - - - 23 - - - | 21 - - 24 - - 28 - 31 - - - 28 - - - | 26 - - - 23 - - - 19 - - - - - - -'],
      sec: { i: 'h0 c1 lo', a: 'k0 s0 h0 b0 c0', b: 'k0 s0 h1 b1 c0 a0 d', c: 'k0 s1 h1 b0 c0 l0 d', x: 'c1 l1 d P1', u: 'k0 h1 b1 c1 a0 roll P1', e: 'k0 s1 h1 b1 c0 a0 l1 P1' }, form: 'iabcxucbce' }),
    // Issa Vibe: G minor at 132, a single chord almost throughout, garage kick in two beats, very low bass in rare hits (end of bar), the voice up front
    st({ ref: 'Issa Vibe', destFor: 'wangan', name: 'GRAVE 132', drumset: { sS: 'rim', sR: 1.3, cS: 'clap2', hS: 'shk2' }, fq: '93.6', vol: 0.45, genre: 'BASSLINE', bpm: 132, sw: 0.1, hn: [1, 0.54, 0.7, 0.63], scl: 'mineur', key: 55, kit: 'k909', eq: [6, 600, -2, 2], rev: 0.12, echo: [3, 0.2], pump: 0.5, // two-step garage on a single chord, huge bass in rare hits, chopped recorded voice up front, almost nothing else
      prog: ['Gm Gm Gm Gm', 'Eb Eb Gm Gm'], k: ['x.x...x...x..x..', 'x.x..xx...x..x..'], s: [SN, '....x..x....x...'], h: ['xxxxxxxxx.xxxxxx', 'x.xxx.x.x.xxx.x.'],
      b: ['bBoost', '. . . . . . . . . . 0 0 - - . .', '0 - . . . . . . . . 0 0 - . 12 -'], d: ['warm', 0],
      l: ['voiceChopped', '12 . 12 . 15 - 12 - . . 10 - 12 - - - | 19 . 19 . 17 - 15 - . . 12 - - - - - | 12 . 12 . 15 - 12 - . . 10 - 7 - - - | 10 - - - 7 - - - 12 - - - . - - -',
        '19 . 19 . 15 - - - 10 - - - . - - - | 22 . 22 . 19 - - - 15 - - - . - - - | 15 - - - 19 - - - 22 - - - 19 - - - | 12 - - - - - - - . - - - - - - -'],
      sec: { i: 'h1 l0 lo', a: 'k0 s0 h0 b0 l0', b: 'k1 s1 h0 b1', c: 'k1 s1 h0 b0 l0', x: 'l1 d P1', u: 'k0 h1 b1 roll P1', e: 'k1 s1 h0 b1 l1 P1' }, form: 'iabcbcxcue' }),
    // MONTE CARLO: A minor at 132, very dense accompaniment (nearly fifty notes per bar: tight arpeggios), suspended chords; B flat major (minor second) before the return
    st({ ref: 'MONTE CARLO', destFor: 'canal', name: 'CORNICHE 132', lO: -12, drumset: { sT: [230], sN: ['bandpass', 2600, 0.7], hF: 9000 }, fq: '103.7', vol: 1, genre: 'ELECTRO BREAKS', bpm: 132, hn: [1, 0.52, 0.63, 0.45], scl: 'mineur', borrows: 'Bb', key: 57, kit: 'dur', eq: [-2, 2400, 1, 6], rev: 0.15, echo: [3, 0.21], pump: 0.5, // tight syncopated kick, sequenced bass, sixteenth-note arpeggio, dark choir, formant theme
      prog: ['Am Am F Bb', 'F G Am Am'], k: ['x.x...x.x.x...x.', 'x.x...x.xx..x.x.'], s: [SN, '....x..x....x.x.'], h: ['x.x.x.xxx.x.x.x.', 'x.xxx.x.x.xxx.x.'],
      b: ['bSeq', '0 . 0 0 . 0 0 . 0 . 0 0 . 0 12 0', '0 0 12 0 0 0 12 0 0 0 12 0 7 0 12 0'], a: ['seqArp', '0.1.2.4.0.1.2.4.', '0124210401242104'], d: ['choir', 0],
      l: ['ldSync', '12 - - 15 - - 19 - 15 - - - 12 - - - | 19 - - 22 - - 24 - 22 - - - 19 - - - | 20 - - 24 - - 27 - 24 - - - 20 - - - | 25 - - - 20 - - - 17 - - - 13 - - -',
        '20 - - - 24 - - - 27 - - - 24 - - - | 22 - - - 26 - - - 29 - - - 26 - - - | 24 - - - 19 - - - 15 - - - 12 - - - | 12 - - - - - - - . - - - - - - -'],
      sec: { i: 'h0 a0 lo', a: 'k0 s0 h0 b0 a0', b: 'k1 s0 h1 b1 a1', c: 'k1 s1 h1 b1 a1 l0 d', x: 'a0 l1 d P1', u: 'k0 h1 b0 a1 roll P1', e: 'k1 s1 h1 b1 a1 l1 P1' }, form: 'iabcabcxue' }),
    // Tokyo Bonus Track: C minor, almost continuous hi-hat, dense accompaniment (nearly forty notes per bar), suspended chords on G and C
    st({ ref: 'Metropolis Street Racer - Tokyo Bonus Track', destFor: 'wangan', name: 'SHUTO 172', lO: -12, drumset: { sS: 'sn2', sR: 1.2, sG: 'sn2g', hS: 'hhcp' }, fq: '89.9', vol: 0.68, genre: 'JUNGLE', bpm: 172, hn: [1, 0.52, 0.76, 0.79], scl: 'mineur', key: 60, kit: 'dnb', eq: [3, 900, -2, 2], rev: 0.22, echo: [3, 0.27], pump: 0.7, // fast breakbeat, sustained "Reese" bass, glass pad, softened real electric piano, vibraphone arpeggio, theme on portamento synth
      prog: ['Cm Ab Eb Bb', 'Ab Bb Cm Cm'], k: ['x.........x.....', 'x.x.......x..x..'], s: [SN, '....x..g.g..x..g'], h: ['x.xxx.xxx.xxx.xx', 'xxxxxxxxxxxxxxxx'],
      b: ['bReese', '0 - - - - - - - 0 - - 7 - - - -', '0 - - 0 - - 12 - 0 - - 10 - 7 - -'], d: ['glass', 0], c: ['rhodesSoft', '..x..x....x..x..'], cO: -12, a: ['vibraArp', '0.2.4.2.1.2.4.2.'],
      l: ['ldMoog', '12 - - - - - 15 - 19 - - - 15 - - - | 20 - - - - - 15 - 12 - - - 8 - - - | 15 - - - - - 19 - 22 - - - 19 - - - | 22 - - - - - 17 - 14 - - - 10 - - -',
        '24 - - - 20 - - - 15 - - - 20 - - - | 26 - - - 22 - - - 17 - - - 22 - - - | 27 - - - 24 - - - 19 - - - 15 - - - | 24 - - - - - - - . - - - - - - -'],
      sec: { i: 'h0 d lo', a: 'k0 s0 h0 b0 d a0', b: 'k1 s1 h1 b0 c0', c: 'k1 s1 h1 b1 l0 d a0', x: 'l1 d P1', u: 'k0 h1 b0 d a0 roll P1', e: 'k1 s1 h1 b1 l1 a0 P1' }, form: 'iabcxbcuce' }),
    // Clever Drive: C minor, the densest accompaniment of all (more than fifty notes per bar), continuous sixteenth-note hi-hat, bass going from C to G
    st({ ref: 'Tokyo Xtreme Racer (2025) - Clever Drive', destFor: 'wangan', name: 'BAYSHORE 174', lO: -12, drumset: { sS: 'sn3', sR: 1.25, hS: 'hhc', hR: 1.1 }, fq: '174.0', vol: 0.69, genre: 'NEUROFUNK', bpm: 174, hn: [1, 0.76, 0.86, 0.65], scl: 'mineur', key: 60, kit: 'dnb', eq: [-4, 1800, 4, 3], rev: 0.12, echo: [3, 0.2], pump: 0.6, drive: 0.3, // fast dry breakbeat, neurofunk bass, brass chords, plucked strings in sixteenth notes, theme on real overdriven guitar
      prog: ['Cm Fm Gm Cm', 'Ab Bb Cm Cm'], k: ['x.........x..x..', 'x.x.......x.....'], s: [SN, '....x..x.g..x..x'], h: ['xxxxxxxxxxxxxxxx', 'x.x.x.x.x.x.x.x.'],
      b: ['bNeuro', '0 - 0 - . . 0 0 - 0 . . 7 - 12 -', '0 0 12 0 . 0 12 0 0 0 12 0 . 10 12 0'], c: ['brassShort', 'x.....x...x.....'], cO: -12, a: ['pizzSeq', '..0..0.4..0...2.', '0102010401020104'],
      l: ['ldGuitar', '12 - 15 - 19 - 15 - 12 - - - 10 - 12 - | 17 - 20 - 24 - 20 - 17 - - - 15 - 17 - | 19 - 22 - 26 - 22 - 19 - - - 17 - 19 - | 24 - - - 19 - - - 15 - - - 12 - - -',
        '20 - 24 - 27 - 24 - 20 - - - . - - - | 22 - 26 - 29 - 26 - 22 - - - . - - - | 27 - - - 24 - - - 19 - - - 15 - - - | 12 - - - - - - - . - - - - - - -'],
      sec: { i: 'h0 a0 lo', a: 'k0 s0 h0 b0 a1', b: 'k1 s1 h0 b0 c0 a1', c: 'k1 s1 h0 b1 l0', x: 'a0 l1 P1 lo', u: 'k0 h0 b0 a1 roll P1', e: 'k1 s1 h0 b1 a1 l1 P1' }, form: 'iaabcxuccea' }),
    // SWEET RALLY: F sharp minor at 129, a back-and-forth of two chords (F sharp minor, C sharp minor, one per bar), strong swing (0.25 to 0.6),
    // open hi-hat on the offbeat (the loudest), bass circling the fourth, voice moving by steps in the mids
    st({ ref: 'ilysam Mc Ster - SWEET RALLY', destFor: 'plage', name: 'DOUCE 129', cO: -12, gO: -12, drumset: { cS: 'clap2', hS: 'hhcp', hOo: 'hho', hR: 1.05 }, fq: '95.6', vol: 1.5, genre: 'FUNKY HOUSE', bpm: 129, sw: 0.3, hn: [0.49, 0.26, 1, 0.22], scl: 'mineur', key: 54, kit: 'k909', eq: [1, 1500, 2, 3], rev: 0.16, echo: [3, 0.21], pump: 0.45, // two chords answering each other, circling bass, real guitar chops, electric piano on the offbeat, recorded voice without words
      prog: ['F#m C#m F#m C#m', 'F#m C#m F#m C#m'], k: [F4], s: [CP, '....c.......c.c.'], h: [OFF, 'x.o.x.o.x.o.x.oo'],
      b: ['bOff', '. . . . 5 5 0 5 . 5 0 . 0 . . 0', '. . . 7 0 0 0 0 . 7 0 0 . 10 . .'], c: ['gtCocotte', '..x...x...x...x.', 'x.x..x.x..x..x.x'], g: ['rhodesSoft', '...x..x....x..x.'], d: ['warm', 0],
      l: ['voiceOohs', '19 - 17 - 15 - - - 14 - 12 - 14 - - - | 19 - - - 22 - - - 26 - - - 24 - 22 - | 24 - - - 22 - 19 - 22 - - - 19 - 17 - | 19 - - - - - - - 14 - - - . - - -',
        '12 - 14 - 15 - - - 17 - 19 - - - 17 - | 19 - 22 - 26 - - - 22 - 19 - - - - - | 24 - - - 19 - - - 15 - - - 14 - 12 - | 14 - - - 19 - - - 14 - - - . - - -'],
      sec: { i: 'h0 c0 lo', a: 'k0 s0 h0 b0 c0', b: 'k0 s0 h1 b1 c1 g0', c: 'k0 s0 h1 b0 c0 g0 l0 d', x: 'g0 l1 d P1', u: 'k0 h1 b1 c1 roll P1', e: 'k0 s1 h1 b1 c0 g0 l1 P1' }, form: 'iabcbcxcce' }),
    // Rally House: at 123, D minor and A major (the major dominant, an eastern colour), kick doubled in sixteenth notes, swung snare, hi-hat accented on the beat
    st({ ref: 'prod. DTM - Rally House', destFor: 'terre', name: 'PARC FERME', cO: -12, aO: -12, drumset: { cS: 'clap', hS: 'shk', hA: 'hhcp' }, fq: '123.0', vol: 1, genre: 'TECH HOUSE', bpm: 123, sw: 0.16, hn: [1, 0.4, 0.67, 0.4], scl: 'mineur', borrows: 'A', key: 50, kit: 'k909', eq: [-2, 1300, 3, 2], rev: 0.13, echo: [3, 0.24], pump: 0.5, // lilting hi-hats, doubled kick, round portamento bass, clavinet, chopped voice, short electro theme; major dominant (A) at the end of the phrase
      prog: ['Dm Dm Dm A', 'Bb C Dm A'], k: ['x...x..xx...x...', 'x...x..xx...x..x'], s: [CP, '....c..c....c...'], h: ['x.x.x.x.x.x.x.x.', 'x.xxx.xxx.xxx.xx'],
      b: ['bMoog', '0 - . 0 - . 12 - . 0 - . 10 - 12 -', '0 . . 0 . . 0 . 12 . . 0 . . 7 .'], c: ['kbd', '..x..x....x..x..'], a: ['voiceChopped', '..0...2...0..4..'], d: ['warm', 0],
      l: ['ldElectro', '12 . . 12 . . 15 . 17 - 15 - 12 - - - | 19 . . 19 . . 17 . 15 - 17 - 19 - - - | 22 . . 22 . . 19 . 17 - 15 - 12 - - - | 19 - - - 23 - - - 26 - - - 19 - - -',
        '20 - - - 24 - - - 27 - - - . - - - | 22 - - - 26 - - - 29 - - - . - - - | 24 - - - 19 - - - 15 - - - 12 - - - | 19 - - - 23 - - - 26 - - - - - - -'],
      sec: { i: 'h0 c0 lo', a: 'k0 s0 h0 b0 c0', b: 'k1 s1 h1 b1 c0 a0', c: 'k0 s0 h1 b0 l0 d', x: 'a0 l1 d P1', u: 'k0 h1 b0 roll P1', e: 'k1 s1 h1 b1 a0 l1 P1' }, form: 'iabcxbcuec' }),
  ];
})(typeof window !== 'undefined' ? window : globalThis);
