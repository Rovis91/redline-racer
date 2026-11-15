// Essais de stations, hors du jeu : une par morceau de référence de l'utilisateur (dossier « music original », ignoré par git).
// Deuxième version : chaque référence séparée (demucs) puis transcrite (basic-pitch) et mesurée (librosa) : grille d'accords, motifs de grosse caisse,
// caisse claire et charleston, nuances du charleston (hn), swing (sw), rythme et registre de la basse, densité des parties d'accompagnement, tessiture des voix.
// Ces relevés sont repris ; les thèmes restent écrits ici (aucune mélodie n'est recopiée). Chaque station a sa propre forme.
// ref : le morceau qui l'a inspirée · pour : la carte où elle irait. Écoute : essais-musique/index.html. La station choisie passe dans RADIO (cartes.js).
// Vérifiées par test-cartes.js comme les stations du jeu (justesse, timbres, forme). Niveaux (vol) réglés par mesure vers -21 dB RMS.
(function (G) {
  const { st } = G.MUS, F4 = 'x...x...x...x...', OFF = '..o...o...o...o.', SN = '....x.......x...', CP = '....c.......c...';
  G.MUS.ESSAIS = [
    // Some Nights : mi mineur à 126, charlestons nettement balancés (swing 0,3 à 0,4), accords sombres et graves (sol, mi, si majeur), basse rare et syncopée, voix au premier plan qui avance par degrés
    st({ ref: 'Class Fools - Some Nights', pour: 'givre', name: 'NUITS 126', gO: -12, bat: { sS: 'sn1', hS: 'hhcp', hA: 'hhc', hOo: 'hho' }, fq: '97.9', vol: 1.5, genre: 'INDIE DANCE', bpm: 126, sw: 0.3, hn: [1, 0.6, 0.8, 0.86], gamme: 'mineur', emprunts: 'B', key: 52, kit: 'lin', eq: [2, 1400, 0, 3], rev: 0.22, echo: [3, 0.24], pump: 0.5, // charleston balancé, guitare claire grattée, chœur en nappe, basse syncopée, thème chanté par degrés
      prog: ['G Em Em B', 'C Em C B'], k: ['x...x...x.x.x...', 'x.x.x...x.x.x.x.'], s: [SN, '....x..x....x...'], h: ['x.x.x.x.x.x.x.x.', 'xxx.xxx.xxx.xxx.'],
      b: ['bPick', '. . 0 0 - - . . . . . . 0 - 0 -', '. . 0 0 - - . . 12 - . . 0 - 7 -'], g: ['gtClair', 'x..x..x...x..x..'], d: ['warm', 0],
      l: ['choeurLd', '19 - 17 - 15 - - - 14 - 15 - 17 - - - | 15 - - - 14 - 12 - 14 - - - . - - - | 19 - - - 17 - 15 - 17 - 19 - 22 - - - | 23 - - - 19 - - - 14 - - - - - - -',
        '20 - 19 - 17 - - - 15 - 17 - 19 - - - | 19 - - - 15 - - - 12 - - - 14 - 15 - | 17 - - - 20 - - - 24 - - - 22 - 20 - | 19 - - - 23 - - - 26 - - - - - - -'],
      sec: { i: 'h0 g0 lo', a: 'k0 s0 h0 b0 g0', b: 'k0 s1 h0 b1 g0 d', c: 'k1 s0 h1 b1 g0 l0 d', x: 'g0 d P1 lo', u: 'k0 h1 b0 d roll P1', e: 'k1 s1 h1 b1 l1 P1' }, form: 'iaabcxbcue' }),
    // In Game 7 : mi bémol à 129, accord de quinte qui ne bouge presque pas, basse en croches qui saute à l'octave et glisse d'un demi-ton au-dessus (couleur phrygienne : mi bécarre),
    // grosse caisse cassée, charleston presque continu, parties de synthé denses
    st({ ref: 'Colin McRae Rally 2.0 - In Game 7', pour: 'terre', name: 'SPECIALE 7', aO: -12, bat: { sS: 'sn3', sR: 1.12, sG: 'sn1g', hS: 'hhc' }, fq: '88.4', vol: 0.86, genre: 'BREAKS PLANANTS', bpm: 129, sw: 0.05, hn: [1, 0.76, 0.98, 0.68], gamme: 'mineur', emprunts: 'E', key: 51, kit: 'brk', eq: [-3, 1500, 2, 5], rev: 0.24, echo: [3, 0.3], pump: 0.55, // breakbeat cassé, basse qui roule en octaves, nappe de verre, vibraphone en arpège, thème en notes très longues ; mi majeur (seconde mineure) en fin de phrase
      prog: ['Ebm Ebm Ebm E', 'Ebm Ebm Db E'], k: ['x...x..xx..xx.x.', 'x..xx...x.x.x...'], s: ['....x..g.g..x..g', '....x.......x.gg'], h: ['x.x.xxx.x.xxxxx.', 'xxx.x.xxx.x.xxx.'],
      b: ['bAcid', '0 12 0 0 12 0 0 12 0 12 0 0 12 0 0 12', '0 12 0 0 12 0 0 12 0 0 12 0 0 1 0 12'], d: ['glass', 0], a: ['vibraArp', '0.4.1.4.2.4.1.4.', '0124012401240124'],
      l: ['ldEwi', '19 - - - - - - - 15 - - - 14 - - - | 12 - - - - - - - . - - - - - - - | 15 - - - - - - - 12 - - - 10 - - - | 8 - - - - - - - . - - - - - - -',
        '19 - - - - - - - 24 - - - - - - - | 22 - - - - - - - 15 - - - - - - - | 17 - - - - - - - 12 - - - - - - - | 8 - - - - - - - . - - - - - - -'],
      sec: { i: 'h0 d lo', a: 'k0 s0 h0 b0 d', b: 'k0 s0 h1 b0 a0', c: 'k1 s1 h1 b1 a1 l0 d', x: 'l1 d P1', u: 'k0 h1 b1 a0 roll P1', e: 'k1 s1 h1 b1 a1 l1 P1' }, form: 'iabbcxuccea' }),
    // Le générique : ré majeur à 132, rock lourd sur un ré qui ne quitte presque pas (do bécarre en passage), basse en octaves, batterie chargée, charleston en doubles-croches
    st({ ref: 'Colin McRae Rally 2.0 - Theme', pour: 'terre', name: 'ASSISTANCE', bat: { sS: 'sn1', sR: 0.9, hS: 'hhc', hOo: 'hhl' }, fq: '106.2', vol: 0.56, genre: 'BREAKS ROCK', bpm: 132, sw: 0.08, hn: [1, 0.34, 0.57, 0.44], gamme: 'majeur', key: 50, kit: 'rock', eq: [-2, 1400, 3, 2], rev: 0.15, echo: [2, 0.2], pump: 0.6, // batterie de rock chargée, basse grasse en octaves, vraie guitare crunch en croches, cordes, thème à la guitare saturée en majeur
      prog: ['D D G A', 'Bm G A A'], k: ['x.xx..x..xx..x..', 'x.x...x.xx..x.x.'], s: [SN, '....x..g....x.gg'], h: ['xxxxxxxxxxxxxxxx', 'x.x.x.x.x.x.x.o.'],
      b: ['bGrit', '0 12 0 0 12 0 0 12 0 12 0 0 12 0 12 0', '0 0 0 0 0 0 0 0 0 0 0 0 7 7 12 12'], c: ['gtSat', 'x.xxx.xxx.xxx.xx', 'x..x..x.x..x..x.'], cO: -12, d: ['strings', 0],
      l: ['ldGuitare', '12 - - - 16 - - - 19 - 16 - 14 - - - | 12 - - - - - - - . - - - 7 - 9 - | 17 - - - 21 - - - 24 - 21 - 19 - - - | 19 - - - 23 - - - 26 - - - - - - -',
        '21 - - - 24 - - - 28 - - - 24 - - - | 17 - - - 21 - - - 24 - - - 21 - - - | 19 - - - 23 - - - 26 - - - 23 - - - | 19 - - - - - - - . - - - - - - -'],
      sec: { i: 'h1 b0 lo', a: 'k0 s0 h1 b0 c1', b: 'k0 s0 h0 b0 c0 d', c: 'k1 s1 h0 b0 c0 l0', x: 'b1 l1 d P1 lo', u: 'k1 h0 b0 c0 roll P1', e: 'k1 s1 h0 b0 c0 l1 P1' }, form: 'iabcbcxuce' }),
    // Monochrome Roulette : la bémol majeur à 144, accompagnement très dense (cinq ou six notes à la fois, accords suspendus et de septième), basse qui bouge sans cesse
    st({ ref: 'Enthusia - Monochrome Roulette', pour: 'chapada', name: 'DAMIER 144', lO: -12, bat: { cS: 'clp', hS: 'hhcp', hOo: 'hho' }, fq: '84.6', vol: 1, genre: 'FUSION HOUSE', bpm: 144, sw: 0.08, hn: [1, 0.63, 0.97, 0.55], gamme: 'majeur', key: 56, kit: 'k909', eq: [-4, 1200, 4, 1], rev: 0.16, echo: [3, 0.24], pump: 0.6, // house à accords de septième, basse claquée, vrai piano électrique qui accompagne serré, vibraphone en arpège, cordes, thème au contrôleur à vent assoupli
      prog: ['AbM7 Fm7 DbM7 Eb7', 'DbM7 Cm7 Fm7 Eb7'], k: [F4], s: [CP, '....c.......c..c'], h: [OFF, 'x.o.x.o.x.o.x.o.'],
      b: ['bSlap', '0 - 12 - 0 0 - 7 - 12 - 0 - 7 9 12', '0 - - 0 - - 7 - 12 - - 7 - - 0 -'], c: ['rhodesDoux', '..x..x.x..x..x.x', 'x..x..x...x..x..'], cO: -12, a: ['vibraArp', '0.2.1.3.2.4.1.3.'], d: ['strings', 0],
      l: ['ldEwiDoux', '12 - - 16 - - 19 - 23 - - - 19 - - - | 21 - - - 19 - - - 16 - - - 12 - - - | 17 - - - 21 - - - 24 - - - 28 - - - | 26 - - - 23 - - - 19 - - - 17 - - -',
        '17 - - 21 - - 24 - 28 - - - 24 - - - | 16 - - 19 - - 23 - 26 - - - 23 - - - | 21 - - 24 - - 28 - 31 - - - 28 - - - | 26 - - - 23 - - - 19 - - - - - - -'],
      sec: { i: 'h0 c1 lo', a: 'k0 s0 h0 b0 c0', b: 'k0 s0 h1 b1 c0 a0 d', c: 'k0 s1 h1 b0 c0 l0 d', x: 'c1 l1 d P1', u: 'k0 h1 b1 c1 a0 roll P1', e: 'k0 s1 h1 b1 c0 a0 l1 P1' }, form: 'iabcxucbce' }),
    // Issa Vibe : sol mineur à 132, un seul accord presque tout du long, grosse caisse de garage en deux temps, basse très grave en coups rares (fin de mesure), la voix au premier plan
    st({ ref: 'Issa Vibe', pour: 'wangan', name: 'GRAVE 132', bat: { sS: 'rim', sR: 1.3, cS: 'clp2', hS: 'shk2' }, fq: '93.6', vol: 0.45, genre: 'BASSLINE', bpm: 132, sw: 0.1, hn: [1, 0.54, 0.7, 0.63], gamme: 'mineur', key: 55, kit: 'k909', eq: [6, 600, -2, 2], rev: 0.12, echo: [3, 0.2], pump: 0.5, // garage en deux temps sur un seul accord, basse énorme en coups rares, voix enregistrée hachée devant tout, presque rien d'autre
      prog: ['Gm Gm Gm Gm', 'Eb Eb Gm Gm'], k: ['x.x...x...x..x..', 'x.x..xx...x..x..'], s: [SN, '....x..x....x...'], h: ['xxxxxxxxx.xxxxxx', 'x.xxx.x.x.xxx.x.'],
      b: ['bBoost', '. . . . . . . . . . 0 0 - - . .', '0 - . . . . . . . . 0 0 - . 12 -'], d: ['warm', 0],
      l: ['voixHachee', '12 . 12 . 15 - 12 - . . 10 - 12 - - - | 19 . 19 . 17 - 15 - . . 12 - - - - - | 12 . 12 . 15 - 12 - . . 10 - 7 - - - | 10 - - - 7 - - - 12 - - - . - - -',
        '19 . 19 . 15 - - - 10 - - - . - - - | 22 . 22 . 19 - - - 15 - - - . - - - | 15 - - - 19 - - - 22 - - - 19 - - - | 12 - - - - - - - . - - - - - - -'],
      sec: { i: 'h1 l0 lo', a: 'k0 s0 h0 b0 l0', b: 'k1 s1 h0 b1', c: 'k1 s1 h0 b0 l0', x: 'l1 d P1', u: 'k0 h1 b1 roll P1', e: 'k1 s1 h0 b1 l1 P1' }, form: 'iabcbcxcue' }),
    // MONTE CARLO : la mineur à 132, accompagnement très dense (près de cinquante notes par mesure : arpèges serrés), accords suspendus ; si bémol majeur (seconde mineure) avant le retour
    st({ ref: 'MONTE CARLO', pour: 'canal', name: 'CORNICHE 132', lO: -12, bat: { sT: [230], sN: ['bandpass', 2600, 0.7], hF: 9000 }, fq: '103.7', vol: 1, genre: 'ELECTRO BREAKS', bpm: 132, hn: [1, 0.52, 0.63, 0.45], gamme: 'mineur', emprunts: 'Bb', key: 57, kit: 'dur', eq: [-2, 2400, 1, 6], rev: 0.15, echo: [3, 0.21], pump: 0.5, // grosse caisse serrée et syncopée, basse séquencée, arpège en doubles-croches, chœur sombre, thème formant
      prog: ['Am Am F Bb', 'F G Am Am'], k: ['x.x...x.x.x...x.', 'x.x...x.xx..x.x.'], s: [SN, '....x..x....x.x.'], h: ['x.x.x.xxx.x.x.x.', 'x.xxx.x.x.xxx.x.'],
      b: ['bSeq', '0 . 0 0 . 0 0 . 0 . 0 0 . 0 12 0', '0 0 12 0 0 0 12 0 0 0 12 0 7 0 12 0'], a: ['seqArp', '0.1.2.4.0.1.2.4.', '0124210401242104'], d: ['choir', 0],
      l: ['ldSync', '12 - - 15 - - 19 - 15 - - - 12 - - - | 19 - - 22 - - 24 - 22 - - - 19 - - - | 20 - - 24 - - 27 - 24 - - - 20 - - - | 25 - - - 20 - - - 17 - - - 13 - - -',
        '20 - - - 24 - - - 27 - - - 24 - - - | 22 - - - 26 - - - 29 - - - 26 - - - | 24 - - - 19 - - - 15 - - - 12 - - - | 12 - - - - - - - . - - - - - - -'],
      sec: { i: 'h0 a0 lo', a: 'k0 s0 h0 b0 a0', b: 'k1 s0 h1 b1 a1', c: 'k1 s1 h1 b1 a1 l0 d', x: 'a0 l1 d P1', u: 'k0 h1 b0 a1 roll P1', e: 'k1 s1 h1 b1 a1 l1 P1' }, form: 'iabcabcxue' }),
    // Tokyo Bonus Track : do mineur, charleston presque continu, accompagnement dense (près de quarante notes par mesure), accords suspendus de sol et de do
    st({ ref: 'Metropolis Street Racer - Tokyo Bonus Track', pour: 'wangan', name: 'SHUTO 172', lO: -12, bat: { sS: 'sn2', sR: 1.2, sG: 'sn2g', hS: 'hhcp' }, fq: '89.9', vol: 0.68, genre: 'JUNGLE', bpm: 172, hn: [1, 0.52, 0.76, 0.79], gamme: 'mineur', key: 60, kit: 'dnb', eq: [3, 900, -2, 2], rev: 0.22, echo: [3, 0.27], pump: 0.7, // breakbeat rapide, basse « Reese » tenue, nappe de verre, vrai piano électrique adouci, vibraphone en arpège, thème au synthé à portamento
      prog: ['Cm Ab Eb Bb', 'Ab Bb Cm Cm'], k: ['x.........x.....', 'x.x.......x..x..'], s: [SN, '....x..g.g..x..g'], h: ['x.xxx.xxx.xxx.xx', 'xxxxxxxxxxxxxxxx'],
      b: ['bReese', '0 - - - - - - - 0 - - 7 - - - -', '0 - - 0 - - 12 - 0 - - 10 - 7 - -'], d: ['glass', 0], c: ['rhodesDoux', '..x..x....x..x..'], cO: -12, a: ['vibraArp', '0.2.4.2.1.2.4.2.'],
      l: ['ldMoog', '12 - - - - - 15 - 19 - - - 15 - - - | 20 - - - - - 15 - 12 - - - 8 - - - | 15 - - - - - 19 - 22 - - - 19 - - - | 22 - - - - - 17 - 14 - - - 10 - - -',
        '24 - - - 20 - - - 15 - - - 20 - - - | 26 - - - 22 - - - 17 - - - 22 - - - | 27 - - - 24 - - - 19 - - - 15 - - - | 24 - - - - - - - . - - - - - - -'],
      sec: { i: 'h0 d lo', a: 'k0 s0 h0 b0 d a0', b: 'k1 s1 h1 b0 c0', c: 'k1 s1 h1 b1 l0 d a0', x: 'l1 d P1', u: 'k0 h1 b0 d a0 roll P1', e: 'k1 s1 h1 b1 l1 a0 P1' }, form: 'iabcxbcuce' }),
    // Clever Drive : do mineur, accompagnement le plus dense de tous (plus de cinquante notes par mesure), charleston en doubles-croches continues, basse qui va de do à sol
    st({ ref: 'Tokyo Xtreme Racer (2025) - Clever Drive', pour: 'wangan', name: 'BAYSHORE 174', lO: -12, bat: { sS: 'sn3', sR: 1.25, hS: 'hhc', hR: 1.1 }, fq: '174.0', vol: 0.69, genre: 'NEUROFUNK', bpm: 174, hn: [1, 0.76, 0.86, 0.65], gamme: 'mineur', key: 60, kit: 'dnb', eq: [-4, 1800, 4, 3], rev: 0.12, echo: [3, 0.2], pump: 0.6, drive: 0.3, // breakbeat rapide et sec, basse de neurofunk, accords de cuivres, cordes pincées en doubles-croches, thème à la vraie guitare saturée
      prog: ['Cm Fm Gm Cm', 'Ab Bb Cm Cm'], k: ['x.........x..x..', 'x.x.......x.....'], s: [SN, '....x..x.g..x..x'], h: ['xxxxxxxxxxxxxxxx', 'x.x.x.x.x.x.x.x.'],
      b: ['bNeuro', '0 - 0 - . . 0 0 - 0 . . 7 - 12 -', '0 0 12 0 . 0 12 0 0 0 12 0 . 10 12 0'], c: ['cuivreStab', 'x.....x...x.....'], cO: -12, a: ['pizzSeq', '..0..0.4..0...2.', '0102010401020104'],
      l: ['ldGuitare', '12 - 15 - 19 - 15 - 12 - - - 10 - 12 - | 17 - 20 - 24 - 20 - 17 - - - 15 - 17 - | 19 - 22 - 26 - 22 - 19 - - - 17 - 19 - | 24 - - - 19 - - - 15 - - - 12 - - -',
        '20 - 24 - 27 - 24 - 20 - - - . - - - | 22 - 26 - 29 - 26 - 22 - - - . - - - | 27 - - - 24 - - - 19 - - - 15 - - - | 12 - - - - - - - . - - - - - - -'],
      sec: { i: 'h0 a0 lo', a: 'k0 s0 h0 b0 a1', b: 'k1 s1 h0 b0 c0 a1', c: 'k1 s1 h0 b1 l0', x: 'a0 l1 P1 lo', u: 'k0 h0 b0 a1 roll P1', e: 'k1 s1 h0 b1 a1 l1 P1' }, form: 'iaabcxuccea' }),
    // SWEET RALLY : fa dièse mineur à 129, va-et-vient de deux accords (fa dièse mineur, do dièse mineur, un par mesure), fort balancement (swing 0,25 à 0,6),
    // charleston ouvert sur le contretemps (le plus fort), basse qui tourne autour de la quarte, voix qui avance par degrés dans le médium
    st({ ref: 'ilysam Mc Ster - SWEET RALLY', pour: 'plage', name: 'DOUCE 129', cO: -12, gO: -12, bat: { cS: 'clp2', hS: 'hhcp', hOo: 'hho', hR: 1.05 }, fq: '95.6', vol: 1.5, genre: 'FUNKY HOUSE', bpm: 129, sw: 0.3, hn: [0.49, 0.26, 1, 0.22], gamme: 'mineur', key: 54, kit: 'k909', eq: [1, 1500, 2, 3], rev: 0.16, echo: [3, 0.21], pump: 0.45, // deux accords qui se répondent, basse qui tourne, cocotte de vraie guitare, piano électrique en contretemps, voix enregistrée sans paroles
      prog: ['F#m C#m F#m C#m', 'F#m C#m F#m C#m'], k: [F4], s: [CP, '....c.......c.c.'], h: [OFF, 'x.o.x.o.x.o.x.oo'],
      b: ['bOff', '. . . . 5 5 0 5 . 5 0 . 0 . . 0', '. . . 7 0 0 0 0 . 7 0 0 . 10 . .'], c: ['gtCocotte', '..x...x...x...x.', 'x.x..x.x..x..x.x'], g: ['rhodesDoux', '...x..x....x..x.'], d: ['warm', 0],
      l: ['voixOohs', '19 - 17 - 15 - - - 14 - 12 - 14 - - - | 19 - - - 22 - - - 26 - - - 24 - 22 - | 24 - - - 22 - 19 - 22 - - - 19 - 17 - | 19 - - - - - - - 14 - - - . - - -',
        '12 - 14 - 15 - - - 17 - 19 - - - 17 - | 19 - 22 - 26 - - - 22 - 19 - - - - - | 24 - - - 19 - - - 15 - - - 14 - 12 - | 14 - - - 19 - - - 14 - - - . - - -'],
      sec: { i: 'h0 c0 lo', a: 'k0 s0 h0 b0 c0', b: 'k0 s0 h1 b1 c1 g0', c: 'k0 s0 h1 b0 c0 g0 l0 d', x: 'g0 l1 d P1', u: 'k0 h1 b1 c1 roll P1', e: 'k0 s1 h1 b1 c0 g0 l1 P1' }, form: 'iabcbcxcce' }),
    // Rally House : à 123, ré mineur et la majeur (la dominante majeure, couleur orientale), grosse caisse doublée en doubles-croches, caisse claire balancée, charleston accentué au temps
    st({ ref: 'prod. DTM - Rally House', pour: 'terre', name: 'PARC FERME', cO: -12, aO: -12, bat: { cS: 'clp', hS: 'shk', hA: 'hhcp' }, fq: '123.0', vol: 1, genre: 'TECH HOUSE', bpm: 123, sw: 0.16, hn: [1, 0.4, 0.67, 0.4], gamme: 'mineur', emprunts: 'A', key: 50, kit: 'k909', eq: [-2, 1300, 3, 2], rev: 0.13, echo: [3, 0.24], pump: 0.5, // charlestons chaloupés, grosse caisse doublée, basse ronde à portamento, clavinet, voix hachée, thème électro court ; dominante majeure (la) en fin de phrase
      prog: ['Dm Dm Dm A', 'Bb C Dm A'], k: ['x...x..xx...x...', 'x...x..xx...x..x'], s: [CP, '....c..c....c...'], h: ['x.x.x.x.x.x.x.x.', 'x.xxx.xxx.xxx.xx'],
      b: ['bMoog', '0 - . 0 - . 12 - . 0 - . 10 - 12 -', '0 . . 0 . . 0 . 12 . . 0 . . 7 .'], c: ['clav', '..x..x....x..x..'], a: ['voixHachee', '..0...2...0..4..'], d: ['warm', 0],
      l: ['ldElectro', '12 . . 12 . . 15 . 17 - 15 - 12 - - - | 19 . . 19 . . 17 . 15 - 17 - 19 - - - | 22 . . 22 . . 19 . 17 - 15 - 12 - - - | 19 - - - 23 - - - 26 - - - 19 - - -',
        '20 - - - 24 - - - 27 - - - . - - - | 22 - - - 26 - - - 29 - - - . - - - | 24 - - - 19 - - - 15 - - - 12 - - - | 19 - - - 23 - - - 26 - - - - - - -'],
      sec: { i: 'h0 c0 lo', a: 'k0 s0 h0 b0 c0', b: 'k1 s1 h1 b1 c0 a0', c: 'k0 s0 h1 b0 l0 d', x: 'a0 l1 d P1', u: 'k0 h1 b0 roll P1', e: 'k1 s1 h1 b1 a0 l1 P1' }, form: 'iabcxbcuec' }),
  ];
})(typeof window !== 'undefined' ? window : globalThis);
