"""Géométrie de préproduction et planche SVG ; aucun changement au jeu."""
from pathlib import Path
import json, math, csv, base64
import numpy as np
from xml.sax.saxutils import escape

OUT=Path(__file__).parent
# Repère métrique : X est, Y nord. Courbes Bézier, successives et fermées.
# Le territoire : A pied SO, B tours NO, C plateau NE, D contrefort SE.
START=(300,180)
SECTORS=[
 ('01','Forêt rocheuse basse','#82c98c',[
 ((220,180),(100,200),(100,320)),
 ((100,430),(110,500),(150,560)),
 ((190,620),(170,700),(230,750))]),
 ('02','Corniches des deux tours','#e9b45b',[
 ((290,800),(370,810),(410,740)),
 ((450,670),(410,550),(490,520)),
 ((570,490),(630,530),(630,620)),
 ((630,710),(590,850),(700,900))]),
 ('03','Grand pont panoramique','#70c9df',[
 ((744,920),(760,920),(800,920)),
 ((880,920),(970,920),(1050,920)),
 ((1090,920),(1130,920),(1160,890))]),
 ('04','Hauts plateaux','#c29aef',[
 ((1220,830),(1230,780),(1230,700)),
 ((1230,670),(1230,640),(1230,610)),
 ((1230,530),(1100,510),(1140,430)),
 ((1160,390),(1210,390),(1240,350))]),
 ('05','Descente dans la brume','#ed8f89',[
 ((1300,270),(1190,110),(1080,130)),
 ((970,150),(920,260),(820,250)),
 ((720,240),(690,80),(580,90)),
 ((470,100),(400,180),(300,180))])]

points=[]; segs=[]; p0=np.array(START,dtype=float); dist=0.; boundaries=[0.]
for zi,(_,_,_,curves) in enumerate(SECTORS):
 for ci,cs in enumerate(curves):
  controls=np.array([p0,*cs]); st=dist; startidx=len(points)
  for t in np.linspace(0,1,151)[0 if not points else 1:]:
   p=(1-t)**3*controls[0]+3*(1-t)**2*t*controls[1]+3*(1-t)*t*t*controls[2]+t**3*controls[3]
   if points: dist+=np.linalg.norm(p-np.array(points[-1][1:3]))
   points.append([dist,float(p[0]),float(p[1]),zi])
  segs.append({'zone':zi,'curve':ci,'s0':st,'s1':dist,'startidx':startidx,'controls':controls.tolist()})
  p0=controls[3]
 boundaries.append(dist)

# Altitude relative au fond de ravin (0 m), jamais une cote réelle de Zhangjiajie.
# Profil lissé par demi-cosinus : pentes nulles aux raccords/culées.
b=boundaries; L=dist
bridge=next(s for s in segs if s['zone']==2 and s['curve']==1)
tunnel=next(s for s in segs if s['zone']==3 and s['curve']==1)
knots=[(0,150),(150,150),(b[1],182),(b[2],215),(b[3],215),
       (tunnel['s0'],225),(tunnel['s1'],225),(b[4],215),(L-180,150),(L,150)]
def height(s):
 for (a,z),(c,w) in zip(knots,knots[1:]):
  if a<=s<=c: return z+(w-z)*(1-math.cos(math.pi*(s-a)/(c-a)))/2
 return 150
for p in points:p.append(height(p[0]))
grade=max(abs((q[4]-p[4])/(q[0]-p[0])) for p,q in zip(points,points[1:]))*100
length3=sum(math.hypot(q[0]-p[0],q[4]-p[4]) for p,q in zip(points,points[1:]))
metrics={'length_plan_m':L,'length_3d_m':length3,'boundaries_m':b,'max_grade_percent':grade,
 'altitude_min_m':150,'altitude_max_m':225,'bridge':bridge,'tunnel':tunnel,'altitude_knots':knots}
(OUT/'mesures.json').write_text(json.dumps(metrics,indent=2),encoding='utf-8')
with (OUT/'trace.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.writer(f);w.writerow(['s_plan_m','x_est_m','y_nord_m','secteur_0base','z_relatif_m']);w.writerows(points)
print(json.dumps(metrics,indent=2))

W,H=3200,2100
svg=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
 '<rect width="3200" height="2100" fill="#101d24"/>',
 '<style>text{font-family:Arial,sans-serif;fill:#e7ece8}.minor{fill:#9eb4bb}.small{font-size:19px}.label{font-size:22px;font-weight:bold}</style>']
def text(x,y,s,size=22,fill=None,weight=None):
 attrs=f' font-family="Arial, sans-serif" fill="{fill or "#e7ece8"}"'+(f' font-weight="{weight}"' if weight else '')
 svg.append(f'<text x="{x}" y="{y}" font-size="{size}"{attrs}>{escape(str(s))}</text>')
def line(x1,y1,x2,y2,c='#3b5058',width=1,dash=''):
 svg.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{width}" stroke-dasharray="{dash}"/>')
def rect(x,y,w,h,c,stroke='none'):
 svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" stroke="{stroke}"/>')
text(65,67,'REDLINE RACER  /  CIRCUIT CONCEPT 04',22,'#9eb4bb')
text(65,145,'SKY PILLARS',76,None,'bold')
text(660,141,'Le vertige se conduit.',34,'#a8c7ba')
text(65,194,f'{L/1000:.2f} km en plan  •  +150 → +225 m  •  1 pont de 250 m  •  1 tunnel de 90 m  •  5 secteurs',24)
text(2050,84,'ZHANGJIAJIE · HUNAN · CHINE',24,'#b9cec3')
text(2050,124,'Paysage inspiré du réel / route fictive',22,'#9eb4bb')
text(2050,163,'Préproduction — vues d’intention, pas captures du jeu',21,'#9eb4bb')
line(65,223,3135,223)

# Carte métrique : 1.17 unités SVG par mètre, axes identiques.
S=1.10; OX=115; OY=1480
def xy(p):return OX+p[0]*S, OY-p[1]*S
def pathpoly(pts,fill,stroke='#50675f',sw=2):
 pp=' '.join(f'{x:.1f},{y:.1f}' for x,y in map(xy,pts))
 svg.append(f'<polygon points="{pp}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
text(65,273,'01 / TERRITOIRE & TRACÉ',27,None,'bold')
text(65,308,'Nord en haut • grille 100 m • fond du ravin = 0 m',20,'#9eb4bb')
rect(65,340,1645,1190,'#192d35')
for x in range(0,1401,100):
 a,c=xy((x,0));d,e=xy((x,960));line(a,c,d,e,'#29404a')
for y in range(0,1001,100):
 a,c=xy((0,y));d,e=xy((1360,y));line(a,c,d,e,'#29404a')
# Bases géologiques ancrées dans le sol : aucun polygone « volant ».
pathpoly([(0,0),(1380,0),(1370,450),(1300,660),(1340,900),(1170,1000),(1010,1000),(1000,830),(1070,650),(960,440),(830,340),(680,360),(690,760),(820,890),(830,1000),(640,1030),(490,950),(220,930),(40,780),(0,500)],'#314b49')
# Plateformes et épaules routables A/B/C/D.
pathpoly([(40,100),(380,100),(640,30),(790,180),(910,170),(1110,50),(1300,120),(1350,340),(1210,460),(1100,380),(930,310),(780,320),(650,400),(500,430),(290,330),(160,430),(180,580),(240,640),(290,790),(150,840),(60,720),(40,440)],'#4b6257')
pathpoly([(145,610),(230,850),(350,890),(460,820),(470,640),(510,570),(580,590),(580,780),(650,940),(825,960),(825,880),(730,840),(700,650),(660,480),(470,460),(380,540),(350,710),(280,700),(240,590)],'#687c65')
pathpoly([(1025,965),(1170,970),(1290,880),(1300,670),(1280,540),(1190,490),(1170,440),(1290,390),(1290,310),(1200,310),(1080,420),(1060,550),(1170,650),(1170,800),(1110,860),(1025,875)],'#78896c')
# Sommets distincts, cores jamais parcourus sauf nez T explicitement tunnel.
cores=[('P1',[(200,410),(260,390),(310,440),(290,540),(220,570),(195,510)],310),
 ('P2',[(225,680),(250,620),(310,600),(355,650),(350,715),(290,745)],345),
 ('P3',[(520,660),(500,740),(520,820),(565,845),(590,780),(575,690)],370),
 ('P4',[(1090,690),(1120,625),(1160,690),(1150,790),(1100,820),(1070,760)],305),
 ('P5',[(1000,210),(1040,180),(1090,230),(1100,300),(1050,330),(1010,290)],280),
 ('HÉRO',[(790,490),(840,440),(880,490),(870,590),(830,660),(780,600)],410)]
for name,pts,z in cores:
 pathpoly(pts,'#9b9a7e','#c6bb92',2)
 mid=np.mean(pts,axis=0);x,y=xy(mid)
 text(x-32,y-5,name,20,'#142a2c','bold');text(x-40,y+20,f'+{z} m',18,'#142a2c')
# Tunnel : nez rocheux traversé et extrémités hors roche.
pathpoly([(1190,690),(1265,690),(1270,635),(1190,625)],'#a6a084','#c6bb92')
# Ruisseau / cascade : bassin plateau, chute et exutoire au ravin.
water=[(1120,850),(1150,815),(1170,770),(1170,610),(1080,570),(970,490),(920,350),(930,40)]
wp=' '.join(f'{x:.1f},{y:.1f}' for x,y in map(xy,water))
svg.append(f'<polyline points="{wp}" fill="none" stroke="#73a7b0" stroke-width="4"/>')
for zi,(num,name,col,_) in enumerate(SECTORS):
 pp=[p for p in points if p[3]==zi]
 if zi:pp=[points[points.index(pp[0])-1]]+pp
 coords=' '.join(f'{x:.2f},{y:.2f}' for x,y in (xy(p[1:3]) for p in pp))
 svg.append(f'<polyline points="{coords}" fill="none" stroke="#13252b" stroke-width="23" stroke-linecap="round" stroke-linejoin="round"/>')
 svg.append(f'<polyline points="{coords}" fill="none" stroke="{col}" stroke-width="{14*S}" stroke-linecap="round" stroke-linejoin="round"/>')
 # Flèche de sens sur chaque secteur.
 j=len(pp)//2;p,q=pp[j-5],pp[j+5];x,y=xy(p[1:3]);a,c=xy(q[1:3]);ang=math.degrees(math.atan2(c-y,a-x))
 svg.append(f'<path d="M -13 -8 L 0 0 L -13 8" fill="none" stroke="#fff" stroke-width="4" transform="translate({x},{y}) rotate({ang})"/>')
# Rails de pont indépendants de la couleur sectorielle.
for yy in [909,931]:
 a,c=xy((800,yy));d,e=xy((1050,yy));line(a,c,d,e,'#f1eee0',3)
for xx in [800,1050]:
 x,y=xy((xx,920));rect(x-10,y-17,20,34,'none','#f1eee0')
# Tunnel conservant exactement le même axe.
x,y=xy((1230,700));a,c=xy((1230,610));line(x,y,a,c,'#18232a',19);line(x,y,a,c,'#d8b4fa',7,'8 7')
for yy in [700,610]:
 x,y=xy((1230,yy));line(x-14,y,x+14,y,'#f4e7ff',5)
# Labels et leaders dans espaces dégagés.
def note(p,dx,dy,rows):
 x,y=xy(p);line(x,y,x+dx,y+dy,'#bfd1ce',1.5)
 for i,t in enumerate(rows):text(x+dx+7,y+dy+i*23,t,19)
note((300,180),-150,65,['DÉPART / ARRIVÉE +150','300 m presque plats au raccord'])
note((150,560),-75,115,['01 · A / FORÊT','épaule +150 → +182'])
note((410,740),50,-100,['02 · B / CORNICHES','drift · déblai intérieur'])
note((925,920),-170,-60,['03 · PONT 250 m / +215','culées (800,920) et (1050,920)'])
note((1230,655),-205,-30,['T · 90 m / +225','toit rocheux ≥ +245 m'])
note((1240,350),-150,85,['05 · D / CONTREFORT','descente vers le socle sud'])
note((1120,850),0,-25,['04 · C / PLATEAU','pavillon en retrait'])
note((830,540),-125,-135,['AIGUILLE HÉRO +410','inaccessible · pied 0 m'])
note((924,217),-60,-105,['Buse enterrée','ruisseau sous chaussée'])
# Balises de distance tous les kilomètres, dérivées du même axe.
for km in range(1,int(L/1000)+1):
 p=min(points,key=lambda p:abs(p[0]-1000*km));x,y=xy(p[1:3]);rect(x-16,y-15,32,30,'#e7ece8');text(x-10,y+7,str(km),20,'#13252b','bold')
# Échelle et légende.
text(90,1504,'0',17);text(90+200*S,1504,'200 m',17)
line(90,1475,90+200*S,1475,'#f3eee0',5)
text(1630,379,'N ↑',25)
text(75,1565,'Sommet rocheux',19,'#c6bb92');text(285,1565,'Épaule / plateforme',19,'#b2c1a5')
text(545,1565,'Socle continu',19,'#7faaa0');text(755,1565,'T : tunnel pointillé',19,'#d8b4fa')
text(1000,1565,'Aucun croisement de niveaux',19,'#b8cdd0')

# Profil avec EXACTEMENT la même abscisse curviligne que la carte.
text(65,1635,'02 / PROFIL ALTIMÉTRIQUE',27,None,'bold')
text(65,1666,f'Altitudes relatives au ravin • D+ 75 m / D− 75 m • pente maximale {grade:.1f} % • hauteur exagérée',19,'#9eb4bb')
PX,PY,PW,PH=100,1910,1550,190
def prof(s,z):return PX+s/L*PW,PY-(z-140)/100*PH
for z in [150,175,200,225]:
 a,c=prof(0,z);d,e=prof(L,z);line(a,c,d,e,'#3a4e55');text(55,c+6,str(z),17,'#9eb4bb')
for zi,(_,name,col,_) in enumerate(SECTORS):
 pp=[prof(p[0],p[4]) for p in points if p[3]==zi]
 coords=' '.join(f'{x:.2f},{y:.2f}' for x,y in pp)
 svg.append(f'<polyline points="{coords}" fill="none" stroke="{col}" stroke-width="6"/>')
 x,_=prof((b[zi]+b[zi+1])/2,150);text(x-10,1955,f'0{zi+1}',22,col,'bold')
for km in range(int(L/1000)):
 x,_=prof(km*1000,150);text(x-14,1992,f'{km} km',17,'#9eb4bb')
x,_=prof(L,150);text(x-40,1992,f'{L/1000:.2f}',17,'#9eb4bb')
for event in [bridge,tunnel]:
 x,y=prof((event['s0']+event['s1'])/2,height((event['s0']+event['s1'])/2));text(x-30,y-17,'PONT' if event==bridge else 'T',18)
text(65,2055,'Mesures calculées sur l’axe. Chaussée 14 m ; 16 m aux drifts et au départ. Conduite à valider en maquette.',19,'#9eb4bb')

# Moodboard bitmap généré : inséré comme objet original, sans retouche des pixels.
line(1765,260,1765,2025)
text(1820,273,'03 / MOODBOARD PAR ZONE',27,None,'bold')
text(1820,307,'10 vues d’intention rétro • 5 scènes de course + 5 détails',20,'#9eb4bb')
im=OUT/'moodboard.png'
if im.exists():
 data=base64.b64encode(im.read_bytes()).decode()
 svg.append(f'<image x="1810" y="340" width="1325" height="1450" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{data}"/>')
else:
 rect(1810,340,1325,1450,'#21373d');text(1850,400,'Moodboard en génération',30)
text(1820,1832,'04 / PREMIERS ASSETS',27,None,'bold')
text(1820,1873,'01 Grès stratifié   02 Pins   03 Pont ancré',24)
text(1820,1910,'04 Pavillon   05 Cascade   06 Nuages bas',24)
palette=['#263e37','#7f987a','#9b9a7e','#8baab7','#e3dcc0','#343e44','#a65949']
for i,col in enumerate(palette):rect(1820+i*185,1942,165,32,col)
text(1820,2011,'Facettes nettes · textures nearest · lumière d’aube · brume basse',21,'#b8cdd0')
text(1820,2055,'Interdits : îles flottantes / rendu PBR / brouillard qui masque les virages',19,'#9eb4bb')
svg.append('</svg>')
(OUT/'SKY-PILLARS-planche.svg').write_text('\n'.join(svg),encoding='utf-8')
