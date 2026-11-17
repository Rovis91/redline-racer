"""Plan vectoriel éditable ; unités du territoire = mètres. Aucun générateur d’images."""
from pathlib import Path
import json, html
import numpy as np
from shapely.geometry import LineString
R=Path(__file__).parent
p=np.array([[100,200],[60,480],[210,700],[450,750],[650,600],[850,640],[950,870],[1200,920],[1400,790],[1930,790],[2120,650],[2070,480],[1860,450],[1770,250],[1500,250],[1400,400],[1120,400],[1080,190],[850,110],[680,260],[500,270],[410,60],[230,20]],float)
v=(np.roll(p,-1,axis=0)-np.roll(p,1,axis=0))*.38
v[8]=v[9]=[240,0];v[13]=v[14]=[-170,0];v[15]=v[16]=[-180,0]
t=np.linspace(0,1,501)[:,None]
curves=[];commands=[]
for i in range(len(p)):
 j=(i+1)%len(p)
 curves.append((2*t**3-3*t**2+1)*p[i]+(t**3-2*t**2+t)*v[i]+(-2*t**3+3*t**2)*p[j]+(t**3-t**2)*v[j])
 def xy(q):return f'{q[0]+220:.2f},{2000-q[1]:.2f}'
 commands.append(f'M {xy(p[i])} C {xy(p[i]+v[i]/3)} {xy(p[j]-v[j]/3)} {xy(p[j])}')
axis=np.vstack([c[:-1] for c in curves]+[curves[-1][-1:]])
lengths=np.array([np.linalg.norm(np.diff(c,axis=0),axis=1).sum() for c in curves]);stations=np.r_[0,np.cumsum(lengths)]
assert np.allclose(axis[0],axis[-1])
assert LineString(axis).is_simple, 'Croisement du circuit'
S=['''<svg xmlns="http://www.w3.org/2000/svg" width="3300" height="2420" viewBox="0 0 3300 2420">
<title>Area 51 — Signal Unknown — plan directeur V3</title>
<desc>Une boucle de course de 5,701 km, deux pistes d’aviation, passage axial dans le hangar puis dans un bunker traversant. Nord en haut. Tous les éléments sont vectoriels et éditables.</desc>
<defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#c5bba8" stroke-width="1" opacity=".35"/></pattern>
<pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V12" stroke="#6c6c58" stroke-width="3" opacity=".4"/></pattern>
<marker id="arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#e9c16c"/></marker>
</defs>
<style>text{font-family:Arial,sans-serif;fill:#26343b} .small{font-size:18px}.label{font-size:24px;font-weight:700}.note{font-size:21px}.muted{fill:#66716c}.road{fill:none;stroke-linejoin:round;stroke-linecap:round}</style>
<rect width="3300" height="2420" fill="#eee9df"/>
<text x="100" y="90" font-size="49" font-weight="700">AREA 51 — SIGNAL UNKNOWN</text>
<text x="102" y="137" font-size="26">V3 / PLAN VU DU DESSUS — AVIATION + CIRCUIT + BUNKER TRAVERSANT</text>
<text x="102" y="181" font-size="22" class="muted">5,701 km de course · sens horaire · deux passages couverts · géométrie en mètres</text>
<rect x="65" y="225" width="2900" height="1930" rx="12" fill="#dfd5c1"/>
<rect x="65" y="225" width="2900" height="1930" fill="url(#grid)"/>
<g id="terrain">''']
def line(points,stroke='#a99572',w=8,dash=None):
 extra=f' stroke-dasharray="{dash}"' if dash else ''
 S.append(f'<polyline points="{" ".join(xy(q) for q in points)}" class="road" stroke="{stroke}" stroke-width="{w}"{extra}/>')
def rect(x,y,w,h,fill,stroke='none',sw=2):
 S.append(f'<rect x="{x+220}" y="{2000-y-h}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
def txt(x,y,s,cls='small',anchor='start'):
 S.append(f'<text x="{x+220}" y="{2000-y}" class="{cls}" text-anchor="{anchor}">{html.escape(s)}</text>')
def polygon(points,fill,stroke):S.append(f'<polygon points="{" ".join(xy(q) for q in points)}" fill="{fill}" stroke="{stroke}" stroke-width="3"/>')
for q in [[[490,1100],[550,850],[670,720],[790,860],[820,1100]],[[1160,-70],[1140,260],[1190,460],[1290,510],[1390,460],[1430,150],[1370,-70]],[[430,-140],[500,50],[630,155],[760,25],[790,-140]],[[-130,540],[-80,860],[90,960],[160,820]],[[2450,250],[2570,400],[2720,370],[2700,100]]]:
 polygon(q,'#b7a181','#998363')
 center=np.mean(q,axis=0)
 for sc in [.76,.53]:polygon(center+(np.array(q)-center)*sc,'none','#aa9473')
txt(610,1030,'ÉPERON NORD','label','middle');txt(1290,100,'COLLINE DU BUNKER','small','middle')
txt(560,-100,'RELIEFS BAS / ROUTE AU PIED DES COLLINES','small')
S.append('</g><g id="aviation">')
# Les dimensions des pistes sont indépendantes de celles du circuit.
def runway(x,y,l,w,label):
 rect(x-70,y-w/2-55,l+140,w+110,'#c9bea7')
 rect(x,y-w/2,l,w,'#71787b','#f4f0e7',2)
 line([[x+90,y],[x+l-90,y]],'#f6f4ed',2,'24 24')
 for end in [x+18,x+l-42]:
  for dy in [-w*.30,-w*.10,w*.10,w*.30]:rect(end,y+dy-1,24,2,'#f4f2e9')
 txt(x+l/2,y+w/2+35,label,'label','middle')
runway(700,1250,1800,45,'PISTE AVIATION A — 1 800 × 45 m')
runway(1250,1580,1100,30,'PISTE AVIATION B — 1 100 × 30 m')
# Taxiways, uniquement dans le domaine aviation.
for q in [[[760,1250],[820,1150],[2440,1150],[2500,1080],[2500,970]],[[2430,1250],[2440,1150]],[[1300,1580],[1360,1470],[2580,1470],[2690,1350],[2690,1080],[2580,970]],[[2290,1580],[2380,1470]]]:
 line(q,'#aba9a0',18);line(q,'#dbce8e',1)
rect(2300,820,380,240,'#b0ada3','#94978e')
for x in [2350,2460,2570]:
 rect(x,840,70,100,'none','#e0dacc',2)
txt(2490,1015,'APRON / STATIONNEMENT','small','middle')
for x in [2320,2480]:
 rect(x,700,130,85,'#8b9487','#59685f');txt(x+65,736,'HANGAR AVIATION','small','middle')
rect(2710,850,35,35,'#697c81','#354b53');txt(2730,920,'TOUR','small','middle')
txt(1600,1100,'ROULAGE AVIATION — aucune portion de course','small','middle')
S.append('</g><g id="services">')
for q in [[[240,350],[240,470],[320,510],[460,480],[600,440]],[[240,350],[650,370],[900,470],[1100,560],[1500,560],[1645,440],[1645,300]],[[1645,200],[1645,145],[1770,145],[1950,210],[2250,350],[2250,740],[2380,820]],[[1645,145],[1550,100]],[[1770,145],[1770,100]],[[2250,740],[2350,740]]]:line(q,'#9b9c8b',7)
# Accès extérieur, fermé au circuit pendant la course.
line([[-150,300],[45,300],[240,350]],'#9b9c8b',7)
for x,y,w,h in [(205,310,120,75),(1500,35,115,65),(1710,35,115,65)]:rect(x,y,w,h,'#899581','#4d6158')
txt(265,345,'OPS','small','middle');txt(1555,60,'H2','small','middle');txt(1765,60,'H3','small','middle')
for x,y,r in [(320,560,42),(460,510,25),(600,440,25)]:
 S.append(f'<circle cx="{x+220}" cy="{2000-y}" r="{r}" fill="#f0eee4" stroke="#6d8285" stroke-width="3"/>')
 line([[x-r*.7,y-r*.4],[x+r*.7,y+r*.4]],'#91a1a0',2);line([[x,y],[x+22,y+28]],'#5e7477',4)
txt(290,630,'CHAMP RADIO','label')
S.append('</g><g id="circuit">')
for cmd in commands:S.append(f'<path d="{cmd}" class="road" stroke="#eee8d8" stroke-width="28"/><path d="{cmd}" class="road" stroke="#344b58" stroke-width="22"/>')
for c in curves[::2]:line([c[250],c[290]],'#e9c16c',3);S.append(f'<path d="M{xy(c[250])} L{xy(c[290])}" fill="none" stroke="#e9c16c" stroke-width="3" marker-end="url(#arrow)"/>')
line([[p[0,0]-20,p[0,1]],[p[0,0]+20,p[0,1]]],'#fffaf0',8)
txt(-10,145,'DÉPART / ARRIVÉE','label')
txt(380,810,'01 → 02 / COURBES RADIO','label')
txt(1650,850,'03 / ESSAIS — 530 m droits','label','middle')
txt(2140,580,'F1','label');txt(1900,390,'F2','label')
txt(800,30,'05 / ESSES DES COLLINES','label','middle')
# Les toitures sont en transparence : l’axe couvert est explicitement dessiné.
S.append('</g><g id="passages_couverts">')
def covered(x0,x1,y,h,label):
 rect(x0,y-h/2,x1-x0,h,'#9aa291','#506158',3)
 rect(x0,y-h/2,x1-x0,h,'url(#hatch)')
 line([[x0,y],[x1,y]],'#eef0df',24)
 line([[x0,y],[x1,y]],'#344b58',18,'13 8')
 for x in [x0,x1]:line([[x,y-17],[x,y+17]],'#dc8c47',6)
 txt((x0+x1)/2,y+h/2+18,label,'label','middle')
covered(1580,1710,250,90,'H1 / HANGAR TRAVERSANT')
covered(1200,1320,400,70,'B1 / BUNKER TRAVERSANT')
txt(1260,342,'120 m couverts','small','middle')
txt(1645,182,'130 m couverts','small','middle')
txt(1500,620,'04 / COMPLEXE SECRET','label')
S.append('</g><g id="annotations">')
for x,y in [(150,316),(1645,310),(1645,190)]:line([[x-12,y],[x+12,y]],'#b96349',5)
txt(-120,350,'ACCÈS FERMÉ EN COURSE','small')
line([[-50,-80],[450,-80]],'#334c58',4);txt(200,-57,'500 m','small','middle')
line([[2800,1400],[2800,1520]],'#334c58',4);polygon([[2800,1550],[2787,1518],[2813,1518]],'#334c58','#334c58');txt(2800,1580,'N','label','middle')
S.append('''<rect x="2670" y="1320" width="555" height="735" rx="12" fill="#f3efe6" stroke="#c8c3b7"/>
<text x="2700" y="1370" class="label">LIRE LE PLAN</text>
<path d="M2700 1415H2790" stroke="#344b58" stroke-width="22"/><text x="2820" y="1422" class="note">Circuit fermé</text>
<path d="M2700 1470H2790" stroke="#71787b" stroke-width="22"/><text x="2820" y="1477" class="note">Pistes d’aviation</text>
<path d="M2700 1525H2790" stroke="#9b9c8b" stroke-width="7"/><text x="2820" y="1532" class="note">Voies de service</text>
<path d="M2700 1580H2790" stroke="#344b58" stroke-width="18" stroke-dasharray="13 8"/><text x="2820" y="1587" class="note">Route sous toiture</text>
<path d="M2745 1620V1650" stroke="#dc8c47" stroke-width="6"/><text x="2820" y="1642" class="note">Portail traversant</text>
<text x="2700" y="1710" class="label">DEUX PASSAGES RÉELS</text>
<text x="2700" y="1755" class="note">H1 : 130 m, axe est–ouest.</text>
<text x="2700" y="1795" class="note">B1 : 120 m sous la colline.</text>
<text x="2700" y="1835" class="note">Deux ouvertures opposées chacun.</text>
<text x="2700" y="1895" class="small">La course ne traverse pas les pistes</text>
<text x="2700" y="1925" class="small">d’aviation. Le bunker est une galerie</text>
<text x="2700" y="1955" class="small">de transfert, pas une pièce sans issue.</text>
<text x="100" y="2220" font-size="26" font-weight="700">BOUCLE : CHECKPOINT → RADIOS → ESSAIS → HANGAR → BUNKER → COLLINES → CHECKPOINT</text>
<text x="100" y="2270" font-size="22">Course : 20 m utiles / 24 m aux essais. H1 : portes 32 × 14 m. B1 : galerie 24 × 9 m, portails 28 × 10 m.</text>
<text x="100" y="2310" font-size="22">Aviation : deux bandes dédiées, taxiways, apron et hangars ; géographie fictive, sans validation aéronautique.</text>
<text x="100" y="2350" font-size="20" fill="#66716c">Plan de conception vectoriel · toitures en transparence · le bunker et le hangar sont plats · conduite à valider en maquette.</text>
</g></svg>''')
svg='\n'.join(S)
(R/'plan-area51-v3.svg').write_text(svg,encoding='utf-8')
(R/'plan-area51-v3.html').write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><title>Area 51 — plan V3</title><style>body{margin:0;background:#eee9df}svg{width:100%;height:auto;display:block}</style>'+svg+'</html>',encoding='utf-8')
data={'length_m':float(sum(lengths)),'closed':True,'self_intersection':False,'nodes_m':p.tolist(),'tangents_m':v.tolist(),'stations_m':stations.tolist(),'hangar':{'x':[1580,1710],'y':250,'length':130},'bunker':{'x':[1200,1320],'y':400,'length':120},'runways':[{'length':1800,'width':45},{'length':1100,'width':30}]}
(R/'geometrie-v3.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
print(f'Boucle fermée sans auto-intersection : {sum(lengths):.2f} m. Hangar et bunker sur axes droits. SVG écrit.')
