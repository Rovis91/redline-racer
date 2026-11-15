# Colle les captures d un dossier en planches de six, avec l echantillon de piste et la vitesse : python outils/planche.py <dossier> <prefixe de sortie> <colonnes>
import sys, glob, json, os
from PIL import Image, ImageDraw
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3])
fs = sorted(glob.glob(d + '/*.jpg')); j = json.load(open(glob.glob(d + '/*.json')[0])); v = j['vues']
w, h = 640, 360
per = cols * 2
for p in range(0, len(fs), per):
    im = Image.new('RGB', (w * cols, h * 2))
    for k, f in enumerate(fs[p:p + per]):
        a = Image.open(f).resize((w, h)); im.paste(a, ((k % cols) * w, (k // cols) * h))
        ImageDraw.Draw(im).text(((k % cols) * w + 6, (k // cols) * h + 4), 'idx %s  %s km/h' % (v[p + k]['idx'], v[p + k].get('kmh')), fill=(255, 255, 0))
    im.save('%s-%d.jpg' % (out, p // per), quality=80)
print(len(fs), j.get('erreurs'), j.get('msParImage'), j.get('tour'))
