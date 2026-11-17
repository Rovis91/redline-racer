# Builds assets/fonts/dotgothic16-game.woff2: DotGothic16 reduced to the Japanese characters (and others, U+3000 and above) written in src/ and index.html, plus ASCII.
# Why: the full font weighs 397 KB and index.html loads it at startup (GitHub Pages); the reduced one is a few KB.
# Rerun after any new Japanese text: python -I tools/font.py   (fontTools: pip install fonttools brotli). tests/test-font.js checks that no character is missing.
import glob, os
from fontTools import subset
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def caracteres():
  cs = set()
  for f in glob.glob(os.path.join(R, 'src', '**', '*.js'), recursive=True) + [os.path.join(R, 'index.html')]:
    if 'instruments' in os.path.basename(f): continue  # base64 of the sounds
    cs |= {c for c in open(f, encoding='utf-8').read() if ord(c) >= 0x3000}
  return ''.join(sorted(cs))
if __name__ == '__main__':
  cs = caracteres(); o = subset.Options(); o.flavor = 'woff2'
  f = subset.load_font(os.path.join(R, 'assets', 'fonts', 'dotgothic16-full.woff2'), o); s = subset.Subsetter(o)
  s.populate(text=cs + ''.join(chr(i) for i in range(0x20, 0x7f))); s.subset(f)
  subset.save_font(f, os.path.join(R, 'assets', 'fonts', 'dotgothic16-game.woff2'), o)
  open(os.path.join(R, 'assets', 'fonts', 'dotgothic16-game.txt'), 'w', encoding='utf-8').write(cs + '\n')
  print(len(cs), 'characters, assets/fonts/dotgothic16-game.woff2:', os.path.getsize(os.path.join(R, 'assets', 'fonts', 'dotgothic16-game.woff2')), 'bytes')
