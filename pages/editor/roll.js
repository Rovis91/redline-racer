// Music editor — the piano roll of the bass and the theme (time on X, notes on Y), shown by the "Pattern" tab.
// Click in empty space: place a note (it is heard); drag a note: move it; pull its right edge: lengthen it; right-click: erase it.
// On the keyboard, on the chosen note: arrow keys to move, Shift + left/right for the length, Delete to erase.
function roll(host, p, vi) {
  const part = st[p], rel = p === 'b', bars = part.v[vi], n = bars.length * 16;
  const all = part.v.flat(2).filter(x => x != null && x !== R);
  const lo = rel ? Math.min(-12, ...all) : (all.length ? Math.min(...all) : st.key + 12) - 12, hi = rel ? Math.max(24, ...all) : (all.length ? Math.max(...all) : st.key + 24) + 12;
  const CW = clamp(Math.floor(1100 / n), 12, 30), CH = 14, HEAD = 16, KW = 56, H = HEAD + (hi - lo + 1) * CH, W = n * CW;
  const scl = new Set(MUS.SCL[st.scl].map(i => (st.key + i) % 12)), pc = v => ((v % 12) + 12) % 12;
  const wrap = el('div', 'roll'), keys = el('canvas'), sc = el('div', 'scroll'), cv = el('canvas'); sc.append(cv); sc.dataset.p = p; wrap.append(keys, sc); host.append(wrap);
  const dpr = window.devicePixelRatio || 1, prep = (c, w) => { c.width = w * dpr; c.height = H * dpr; c.style.width = w + 'px'; c.style.height = H + 'px'; const x = c.getContext('2d'); x.scale(dpr, dpr); return x; };
  const kx = prep(keys, KW), x = prep(cv, W);
  cv.title = 'Click in empty space: place a note · drag: move · right edge: lengthen · right-click: erase'; cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', `${LABEL[p]}, motif ${vi + 1} : rouleau de notes`);
  const clair = v => rel ? pc(v) === 0 : scl.has(pc(v)), label = v => rel ? (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) : NOTES[pc(v)] + (Math.floor(v / 12) - 1);
  const playOne = v => SOUND.note(p, rel ? SOUND.backdrop + v + octaveOf('b') : v + octaveOf('l'));
  kx.font = '10px system-ui'; kx.textBaseline = 'middle';
  for (let v = hi; v >= lo; v--) { const y = HEAD + (hi - v) * CH; kx.fillStyle = clair(v) ? '#2a2a38' : '#14141c'; kx.fillRect(0, y, KW, CH - 1); kx.fillStyle = (rel ? v === 0 : pc(v) === pc(st.key)) ? '#fcee0a' : '#a8a8b4'; kx.fillText(label(v), 6, y + CH / 2); }
  keys.style.cursor = 'pointer'; keys.title = 'Click: listen to the note'; keys.onpointerdown = e => { const y = e.clientY - keys.getBoundingClientRect().top - HEAD; if (y >= 0) playOne(hi - Math.floor(y / CH)); };
  const readBar = bar => { const out = []; for (let q = 0; q < 16; q++) { const v = bar[q]; if (v == null || v === R) continue; let len = 1; while (q + len < 16 && bar[q + len] == null) len++; out.push({ q, v, len }); } return out; };
  let chosen = null, drag = null; // note choisie { bi, q } ; geste en cours
  function draw() {
    x.fillStyle = '#0b0b10'; x.fillRect(0, 0, W, H);
    for (let v = hi; v >= lo; v--) { x.fillStyle = clair(v) ? '#1c1c28' : '#111118'; x.fillRect(0, HEAD + (hi - v) * CH, W, CH - 1); }
    x.font = '10px system-ui'; x.textBaseline = 'middle';
    for (let s = 0; s <= n; s++) { x.fillStyle = s % 16 === 0 ? '#5a5a70' : s % 4 === 0 ? '#34344a' : '#20202c'; x.fillRect(s * CW, s % 16 ? HEAD : 0, 1, H); if (s % 16 === 0 && s < n) { x.fillStyle = '#a8a8b4'; x.fillText('mesure ' + (s / 16 + 1), s * CW + 5, HEAD / 2); } }
    bars.forEach((bar, bi) => { for (const o of readBar(bar)) { const X = (bi * 16 + o.q) * CW + 1, Y = HEAD + (hi - o.v) * CH, w = o.len * CW - 2;
      x.fillStyle = TINT[p]; x.fillRect(X, Y, w, CH - 1); x.fillStyle = '#0b0b10'; x.fillRect(X, Y, 2, CH - 1); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(X + w - 3, Y, 3, CH - 1); // right edge: the length handle
      if (chosen && chosen.bi === bi && chosen.q === o.q) { x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(X, Y, w, CH - 1); } } });
    if (playing && SOUND.ac.state === 'running' && inGame(p) === vi) { const t = SOUND.stepSec - 1; x.fillStyle = '#fcee0a'; x.fillRect((((t >> 4) % bars.length) * 16 + (t & 15)) * CW, 0, 2, H); } // playhead: only if this pattern is the one playing
  }
  function writeCell(bi, notes) { const a = Array(16).fill(R); for (const o of notes) { a[o.q] = o.v; for (let i = 1; i < o.len; i++) a[o.q + i] = null; } bars[bi] = a; touch(); draw(); }
  function placeNote(bi, base, o) { const notes = []; // one note at a time: the one being placed cuts or replaces the ones it overlaps
    for (const z of base) { if (z.q >= o.q && z.q < o.q + o.len) continue; notes.push(z.q < o.q && z.q + z.len > o.q ? { q: z.q, v: z.v, len: o.q - z.q } : z); }
    notes.push(o); chosen = { bi, q: o.q }; writeCell(bi, notes); }
  const where = e => { const r = cv.getBoundingClientRect(), y = e.clientY - r.top - HEAD; return [clamp(Math.floor((e.clientX - r.left) / CW), 0, n - 1), y < 0 ? null : clamp(hi - Math.floor(y / CH), lo, hi), e.clientX - r.left]; };
  cv.onpointerdown = e => { const [s, v, px] = where(e); if (v == null) return; const bi = s >> 4, q = s & 15, notes = readBar(bars[bi]), over = notes.find(o => q >= o.q && q < o.q + o.len && (o.v === v || e.button === 2));
    if (e.button === 2) { if (over) { chosen = null; writeCell(bi, notes.filter(o => o !== over)); } return; }
    if (e.button) return;
    if (over) { drag = { bi, mode: px > (bi * 16 + over.q + over.len) * CW - 6 ? 'len' : 'move', o: over, dq: q - over.q, base: notes.filter(o => o !== over), last: over }; chosen = { bi, q: over.q }; playOne(over.v); draw(); }
    else { const o = { q, v, len: 1 }; drag = { bi, mode: 'len', o, base: notes, last: o }; placeNote(bi, notes, o); playOne(v); }
    cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (!drag) return; const [s, v] = where(e), q = clamp(s - drag.bi * 16, 0, 15), d = drag.o;
    const o = drag.mode === 'len' ? { q: d.q, v: d.v, len: Math.max(1, q - d.q + 1) } : { q: clamp(q - drag.dq, 0, 16 - d.len), v: v == null ? d.v : v, len: d.len };
    if (o.q === drag.last.q && o.v === drag.last.v && o.len === drag.last.len) return;
    if (o.v !== drag.last.v) playOne(o.v); drag.last = o; placeNote(drag.bi, drag.base, o); };
  cv.onpointerup = cv.onpointercancel = () => { drag = null; };
  cv.oncontextmenu = e => e.preventDefault();
  cv.onkeydown = e => { if (!chosen) return; const notes = readBar(bars[chosen.bi]), o = notes.find(z => z.q === chosen.q); if (!o) return; const base = notes.filter(z => z !== o), m = { ...o };
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); const bi = chosen.bi; chosen = null; return writeCell(bi, base); }
    if (e.key === 'ArrowUp') m.v = Math.min(hi, o.v + 1); else if (e.key === 'ArrowDown') m.v = Math.max(lo, o.v - 1);
    else if (e.key === 'ArrowRight') { if (e.shiftKey) m.len = Math.min(16 - o.q, o.len + 1); else m.q = Math.min(16 - o.len, o.q + 1); }
    else if (e.key === 'ArrowLeft') { if (e.shiftKey) m.len = Math.max(1, o.len - 1); else m.q = Math.max(0, o.q - 1); }
    else return;
    e.preventDefault(); if (m.v !== o.v) playOne(m.v); placeNote(chosen.bi, base, m); };
  cv.onfocus = cv.onblur = draw;
  sc.scrollLeft = rollX[p] || 0; draw(); rolls.push(draw);
}
