# Fabrique assets/fonts/dotgothic16-jeu.woff2 : DotGothic16 réduite aux caractères japonais (et autres, U+3000 et au-delà) écrits dans src/ et index.html, plus l'ASCII.
# Pourquoi : la police complète pèse 397 ko et index.html la charge au démarrage (GitHub Pages) ; la réduite, quelques ko.
# À relancer après tout nouveau texte japonais : python -I outils/police.py   (fontTools : pip install fonttools brotli). tests/test-police.js vérifie qu'il ne manque aucun caractère.
import glob, os
from fontTools import subset
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def caracteres():
  cs = set()
  for f in glob.glob(os.path.join(R, 'src', '**', '*.js'), recursive=True) + [os.path.join(R, 'index.html')]:
    if 'instruments' in os.path.basename(f): continue  # base64 des sons
    cs |= {c for c in open(f, encoding='utf-8').read() if ord(c) >= 0x3000}
  return ''.join(sorted(cs))
if __name__ == '__main__':
  cs = caracteres(); o = subset.Options(); o.flavor = 'woff2'
  f = subset.load_font(os.path.join(R, 'assets', 'fonts', 'dotgothic16-complet.woff2'), o); s = subset.Subsetter(o)
  s.populate(text=cs + ''.join(chr(i) for i in range(0x20, 0x7f))); s.subset(f)
  subset.save_font(f, os.path.join(R, 'assets', 'fonts', 'dotgothic16-jeu.woff2'), o)
  open(os.path.join(R, 'assets', 'fonts', 'dotgothic16-jeu.txt'), 'w', encoding='utf-8').write(cs + '\n')
  print(len(cs), 'caractères, assets/fonts/dotgothic16-jeu.woff2 :', os.path.getsize(os.path.join(R, 'assets', 'fonts', 'dotgothic16-jeu.woff2')), 'octets')
