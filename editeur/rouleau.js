// Éditeur de musique — le piano-roll de la basse et du thème (temps en X, notes en Y), affiché par l'onglet « Motif ».
// Clic dans le vide : poser une note (elle se fait entendre) ; glisser une note : la déplacer ; tirer son bord droit : l'allonger ; clic droit : l'effacer.
// Au clavier, sur la note choisie : flèches pour déplacer, Maj + gauche / droite pour la longueur, Suppr pour effacer.
function roll(host, p, vi) {
  const part = st[p], rel = p === 'b', bars = part.v[vi], n = bars.length * 16;
  const all = part.v.flat(2).filter(x => x != null && x !== R);
  const lo = rel ? Math.min(-12, ...all) : (all.length ? Math.min(...all) : st.key + 12) - 12, hi = rel ? Math.max(24, ...all) : (all.length ? Math.max(...all) : st.key + 24) + 12;
  const CW = clamp(Math.floor(1100 / n), 12, 30), CH = 14, HEAD = 16, KW = 56, H = HEAD + (hi - lo + 1) * CH, W = n * CW;
  const gamme = new Set(MUS.GAMME[st.gamme].map(i => (st.key + i) % 12)), pc = v => ((v % 12) + 12) % 12;
  const wrap = el('div', 'roll'), keys = el('canvas'), sc = el('div', 'scroll'), cv = el('canvas'); sc.append(cv); sc.dataset.p = p; wrap.append(keys, sc); host.append(wrap);
  const dpr = window.devicePixelRatio || 1, prep = (c, w) => { c.width = w * dpr; c.height = H * dpr; c.style.width = w + 'px'; c.style.height = H + 'px'; const x = c.getContext('2d'); x.scale(dpr, dpr); return x; };
  const kx = prep(keys, KW), x = prep(cv, W);
  cv.title = 'Clic dans le vide : poser une note · glisser : déplacer · bord droit : allonger · clic droit : effacer'; cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', `${NOM[p]}, motif ${vi + 1} : rouleau de notes`);
  const clair = v => rel ? pc(v) === 0 : gamme.has(pc(v)), nom = v => rel ? (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) : NOTES[pc(v)] + (Math.floor(v / 12) - 1);
  const jouer = v => SON.note(p, rel ? SON.fond + v + octaveDe('b') : v + octaveDe('l'));
  kx.font = '10px system-ui'; kx.textBaseline = 'middle';
  for (let v = hi; v >= lo; v--) { const y = HEAD + (hi - v) * CH; kx.fillStyle = clair(v) ? '#2a2a38' : '#14141c'; kx.fillRect(0, y, KW, CH - 1); kx.fillStyle = (rel ? v === 0 : pc(v) === pc(st.key)) ? '#fcee0a' : '#a8a8b4'; kx.fillText(nom(v), 6, y + CH / 2); }
  keys.style.cursor = 'pointer'; keys.title = 'Clic : écouter la note'; keys.onpointerdown = e => { const y = e.clientY - keys.getBoundingClientRect().top - HEAD; if (y >= 0) jouer(hi - Math.floor(y / CH)); };
  const lire = bar => { const out = []; for (let q = 0; q < 16; q++) { const v = bar[q]; if (v == null || v === R) continue; let len = 1; while (q + len < 16 && bar[q + len] == null) len++; out.push({ q, v, len }); } return out; };
  let choisie = null, drag = null; // note choisie { bi, q } ; geste en cours
  function draw() {
    x.fillStyle = '#0b0b10'; x.fillRect(0, 0, W, H);
    for (let v = hi; v >= lo; v--) { x.fillStyle = clair(v) ? '#1c1c28' : '#111118'; x.fillRect(0, HEAD + (hi - v) * CH, W, CH - 1); }
    x.font = '10px system-ui'; x.textBaseline = 'middle';
    for (let s = 0; s <= n; s++) { x.fillStyle = s % 16 === 0 ? '#5a5a70' : s % 4 === 0 ? '#34344a' : '#20202c'; x.fillRect(s * CW, s % 16 ? HEAD : 0, 1, H); if (s % 16 === 0 && s < n) { x.fillStyle = '#a8a8b4'; x.fillText('mesure ' + (s / 16 + 1), s * CW + 5, HEAD / 2); } }
    bars.forEach((bar, bi) => { for (const o of lire(bar)) { const X = (bi * 16 + o.q) * CW + 1, Y = HEAD + (hi - o.v) * CH, w = o.len * CW - 2;
      x.fillStyle = COUL[p]; x.fillRect(X, Y, w, CH - 1); x.fillStyle = '#0b0b10'; x.fillRect(X, Y, 2, CH - 1); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(X + w - 3, Y, 3, CH - 1); // bord droit : la poignée de longueur
      if (choisie && choisie.bi === bi && choisie.q === o.q) { x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(X, Y, w, CH - 1); } } });
    if (playing && SON.ac.state === 'running' && enJeu(p) === vi) { const t = SON.pas - 1; x.fillStyle = '#fcee0a'; x.fillRect((((t >> 4) % bars.length) * 16 + (t & 15)) * CW, 0, 2, H); } // tête de lecture : seulement si c'est ce motif qui joue
  }
  function ecrire(bi, notes) { const a = Array(16).fill(R); for (const o of notes) { a[o.q] = o.v; for (let i = 1; i < o.len; i++) a[o.q + i] = null; } bars[bi] = a; touch(); draw(); }
  function placer(bi, base, o) { const notes = []; // une seule note à la fois : celle qu'on pose coupe ou remplace celles qu'elle recouvre
    for (const z of base) { if (z.q >= o.q && z.q < o.q + o.len) continue; notes.push(z.q < o.q && z.q + z.len > o.q ? { q: z.q, v: z.v, len: o.q - z.q } : z); }
    notes.push(o); choisie = { bi, q: o.q }; ecrire(bi, notes); }
  const ou = e => { const r = cv.getBoundingClientRect(), y = e.clientY - r.top - HEAD; return [clamp(Math.floor((e.clientX - r.left) / CW), 0, n - 1), y < 0 ? null : clamp(hi - Math.floor(y / CH), lo, hi), e.clientX - r.left]; };
  cv.onpointerdown = e => { const [s, v, px] = ou(e); if (v == null) return; const bi = s >> 4, q = s & 15, notes = lire(bars[bi]), sur = notes.find(o => q >= o.q && q < o.q + o.len && (o.v === v || e.button === 2));
    if (e.button === 2) { if (sur) { choisie = null; ecrire(bi, notes.filter(o => o !== sur)); } return; }
    if (e.button) return;
    if (sur) { drag = { bi, mode: px > (bi * 16 + sur.q + sur.len) * CW - 6 ? 'len' : 'move', o: sur, dq: q - sur.q, base: notes.filter(o => o !== sur), last: sur }; choisie = { bi, q: sur.q }; jouer(sur.v); draw(); }
    else { const o = { q, v, len: 1 }; drag = { bi, mode: 'len', o, base: notes, last: o }; placer(bi, notes, o); jouer(v); }
    cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (!drag) return; const [s, v] = ou(e), q = clamp(s - drag.bi * 16, 0, 15), d = drag.o;
    const o = drag.mode === 'len' ? { q: d.q, v: d.v, len: Math.max(1, q - d.q + 1) } : { q: clamp(q - drag.dq, 0, 16 - d.len), v: v == null ? d.v : v, len: d.len };
    if (o.q === drag.last.q && o.v === drag.last.v && o.len === drag.last.len) return;
    if (o.v !== drag.last.v) jouer(o.v); drag.last = o; placer(drag.bi, drag.base, o); };
  cv.onpointerup = cv.onpointercancel = () => { drag = null; };
  cv.oncontextmenu = e => e.preventDefault();
  cv.onkeydown = e => { if (!choisie) return; const notes = lire(bars[choisie.bi]), o = notes.find(z => z.q === choisie.q); if (!o) return; const base = notes.filter(z => z !== o), m = { ...o };
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); const bi = choisie.bi; choisie = null; return ecrire(bi, base); }
    if (e.key === 'ArrowUp') m.v = Math.min(hi, o.v + 1); else if (e.key === 'ArrowDown') m.v = Math.max(lo, o.v - 1);
    else if (e.key === 'ArrowRight') { if (e.shiftKey) m.len = Math.min(16 - o.q, o.len + 1); else m.q = Math.min(16 - o.len, o.q + 1); }
    else if (e.key === 'ArrowLeft') { if (e.shiftKey) m.len = Math.max(1, o.len - 1); else m.q = Math.max(0, o.q - 1); }
    else return;
    e.preventDefault(); if (m.v !== o.v) jouer(m.v); placer(choisie.bi, base, m); };
  cv.onfocus = cv.onblur = draw;
  sc.scrollLeft = rollX[p] || 0; draw(); rolls.push(draw);
}
