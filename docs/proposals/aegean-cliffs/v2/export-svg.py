from pathlib import Path
import numpy as np
D=Path(__file__).parent
a=np.loadtxt(D/'coordonnees.csv',delimiter=',',skiprows=1)
p=' '.join(f'{x:.4f},{-y:.4f}' for x,y in a[:,1:3])
(D/'trace-metrique.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-600 -1100 1400 1250"><title>Aegean Cliffs — 1 unité SVG = 1 m, nord vers le haut</title><polyline id="axe" points="{p}" fill="none" stroke="#247ca9" stroke-width="2"/></svg>',encoding='utf8')
