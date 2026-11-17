# Fabrique src/audio/instruments.js et src/audio/instruments-notes.js : instruments échantillonnés (FluidR3_GM, CC BY 3.0) et formes d'onde de synthés (AKWF, CC0).
# Usage : python -I outils/instruments.py <dossier FluidR3 *-mp3.js> <dossier AKWF *.wav> <ffmpeg> <dossier VCSL *.wav> > src/audio/instruments.js
# Batterie (VCSL, CC0) : caisses claires, cercle, cross-stick, claps, charleston acoustique, shaker, tambourin, nommés comme dans PERC ci-dessous.
# Une note sur quatre demi-tons est gardée, en mono, en Opus 32 kb/s, coupée à 3 s avec un fondu : le moteur transpose les autres.
import sys, os, re, base64, subprocess, tempfile, wave, struct, cmath, json
FL, AK, FF, VC = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
PERC = {'sn1': 0.5, 'sn1g': 0.4, 'sn2': 0.5, 'sn2g': 0.4, 'sn3': 0.5, 'rim': 0.6, 'xs': 0.3, 'clp': 0.4, 'clp2': 0.4, 'hhc': 0.3, 'hhcp': 0.25, 'hho': 0.8, 'hhl': 0.5, 'shk': 0.25, 'shk2': 0.2, 'tmb': 0.4} # nom : durée gardée (s)
# nom dans le jeu : (fichier FluidR3, note la plus grave, la plus aiguë, durée gardée en s)
INST = {
  'piano': ('acoustic_grand_piano', 36, 96, 3), 'rhodes': ('electric_piano_1', 36, 92, 3), 'choeur': ('choir_aahs', 45, 84, 3),
  'oohs': ('voice_oohs', 45, 84, 3), 'gtMute': ('electric_guitar_muted', 40, 84, 1), 'gtClean': ('electric_guitar_clean', 40, 88, 3),
  'gtDist': ('distortion_guitar', 36, 84, 3), 'gtOver': ('overdriven_guitar', 40, 88, 3), 'cordes': ('string_ensemble_1', 36, 96, 3),
  'cuivres': ('brass_section', 40, 84, 2), 'synBrass': ('synth_brass_1', 36, 84, 2), 'slap': ('slap_bass_1', 24, 60, 2),
  'basseDoigt': ('electric_bass_finger', 24, 60, 2), 'altoSax': ('alto_sax', 49, 85, 3), 'flute': ('flute', 60, 96, 3),
  'sitar': ('sitar', 48, 84, 3), 'kalimba': ('kalimba', 48, 96, 2), 'steel': ('steel_drums', 52, 92, 2), 'marimba': ('marimba', 48, 96, 2),
  'vibra': ('vibraphone', 48, 92, 3), 'pizz': ('pizzicato_strings', 36, 88, 1), 'trompette': ('trumpet', 52, 88, 2),
  'tenorSax': ('tenor_sax', 40, 76, 3), 'panFlute': ('pan_flute', 60, 96, 3),
}
NOTE = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
midi = lambda n: NOTE[n[:-1]] + 12 * (int(n[-1]) + 1)
tmp = tempfile.mkdtemp()
out = {}
for nom, (fic, lo, hi, dur) in INST.items():
  src = open(os.path.join(FL, fic + '-mp3.js'), encoding='utf-8').read()
  notes = {midi(n): b for n, b in re.findall(r'"([A-G]b?\d)": "data:audio/mp3;base64,([^"]+)"', src)}
  assert len(notes) >= 80, (fic, len(notes))
  out[nom] = {}
  for m in range(lo, hi + 1, 4):
    a, b = os.path.join(tmp, 'a.mp3'), os.path.join(tmp, 'b.ogg')
    open(a, 'wb').write(base64.b64decode(notes[m]))
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', a, '-ac', '1', '-t', str(dur), '-af', f'afade=t=out:st={dur - 0.3}:d=0.3', '-c:a', 'libopus', '-b:a', '32k', b], check=True)
    out[nom][m] = base64.b64encode(open(b, 'rb').read()).decode()
# formes d'onde : un cycle, ramené à ses 48 premières harmoniques (parties réelle et imaginaire), normalisé
ondes = {}
for f in sorted(os.listdir(AK)):
  w = wave.open(os.path.join(AK, f)); n = w.getnframes(); raw = w.readframes(n); sw = w.getsampwidth(); w.close()
  x = struct.unpack('<%dh' % n, raw) if sw == 2 else [v - 128 for v in raw]
  H = [sum(x[k] * cmath.exp(-2j * cmath.pi * h * k / n) for k in range(n)) / n for h in range(1, 49)]
  pk = max(abs(c) for c in H) or 1
  ondes['ak_' + f[:-4]] = [[round(c.real / pk, 4) for c in H], [round(-c.imag / pk, 4) for c in H]]
# les notes (3,7 Mo compressés) vont dans instruments-notes.js, chargé à la demande par audio.js ; le reste (petit) sur la sortie, chargé au démarrage
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'audio', 'instruments-notes.js'), 'w', encoding='utf-8') as f:
  f.write("// Notes des instruments échantillonnés (window.INS) : FluidR3_GM de Frank Wen (CC BY 3.0, via gleitz/midi-js-soundfonts), une note sur quatre demi-tons, Opus mono.
")
  f.write("// Fichier généré par outils/instruments.py. Chargé par src/audio/audio.js à la première station (3,7 Mo compressés : pas au démarrage du jeu).
")
  f.write('window.INS = ' + json.dumps(out, separators=(',', ':')) + ';
')
print("// Batterie et formes d'onde (les notes des instruments échantillonnés sont dans instruments-notes.js, chargé à la demande).")
print("// Formes d'onde : Adventure Kid Waveforms (AKWF) de Kristoffer Ekstrand, domaine public (CC0). Fichier généré par outils/instruments.py.")
perc = {}
for nom, dur in PERC.items():
  a, b = os.path.join(VC, nom + '.wav'), os.path.join(tmp, 'p.ogg')
  subprocess.run([FF, '-y', '-loglevel', 'error', '-i', a, '-ac', '1', '-af', f'silenceremove=start_periods=1:start_threshold=-50dB,atrim=0:{dur},afade=t=out:st={dur * 0.6}:d={dur * 0.4}', '-c:a', 'libopus', '-b:a', '48k', b], check=True)
  perc[nom] = base64.b64encode(open(b, 'rb').read()).decode()
print("// Batterie : Versilian Community Sample Library (VCSL), domaine public (CC0).")
print('window.PERC = ' + json.dumps(perc, separators=(',', ':')) + ';')
print('window.ONDES = ' + json.dumps(ondes, separators=(',', ':')) + ';')
print('window.INS_NOMS = ' + json.dumps(list(out), separators=(',', ':')) + ';')  # les timbres e_<nom> d'audio.js existent avant l'arrivée des notes
