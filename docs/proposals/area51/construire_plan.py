"""Schémas de préproduction : courbes de Bézier en mètres, aucune dépendance au jeu."""
from pathlib import Path
import json, csv
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle

ROOT=Path(__file__).parent
P=np.array([
[[100,250],[100,450],[100,550],[180,650]],
[[180,650],[300,800],[450,850],[650,850]],
[[650,850],[850,850],[1000,800],[1200,800]],
[[1200,800],[1500,800],[1800,800],[2100,800]],
[[2100,800],[2320,800],[2340,600],[2230,600]],
[[2230,600],[2100,600],[1980,600],[1850,600]],
[[1850,600],[1750,600],[1800,430],[1700,430]],
[[1700,430],[1620,430],[1530,430],[1450,430]],
[[1450,430],[1320,430],[1370,230],[1200,230]],
[[1200,230],[1000,230],[900,80],[650,80]],
[[650,80],[450,80],[300,0],[180,80]],
[[180,80],[100,133.333],[100,170],[100,250]]],dtype=float)
t=np.linspace(0,1,501)[:,None]
def samples(p): return (1-t)**3*p[0]+3*(1-t)**2*t*p[1]+3*(1-t)*t*t*p[2]+t**3*p[3]
raw=[samples(p) for p in P]
scale=5400/sum(np.linalg.norm(np.diff(a,axis=0),axis=1).sum() for a in raw)
P*=scale
curves=[samples(p) for p in P]
lens=np.array([np.linalg.norm(np.diff(a,axis=0),axis=1).sum() for a in curves])
stations=np.r_[0,np.cumsum(lens)]
xy=np.vstack([a[:-1] for a in curves]+[curves[-1][-1:]])
s=np.r_[0,np.cumsum(np.linalg.norm(np.diff(xy,axis=0),axis=1))]
zk=np.array([0,400,950,1500,2600,3850,4600,5400])
zh=np.array([1000,1002,1006,1004,1004,1004,1018,1000])
# interpolation cosinus : raccords verticaux horizontaux, aucune cassure de pente
def altitude(x):
 i=np.clip(np.searchsorted(zk,x,side='right')-1,0,len(zk)-2)
 u=(x-zk[i])/(zk[i+1]-zk[i]); return zh[i]+(zh[i+1]-zh[i])*(1-np.cos(np.pi*u))/2
z=altitude(s)
colors=['#d2bc79','#88b4b6','#df9a69','#ab9ebd','#9cae7a']
groups=[0,1,1,2,2,2,3,3,3,4,4,4]
plt.rcParams.update({'font.family':'DejaVu Sans','text.color':'#e8e4d9','axes.labelcolor':'#c9c5bb','xtick.color':'#a4a8ab','ytick.color':'#a4a8ab','font.size':10})
fig,ax=plt.subplots(figsize=(16,8),facecolor='#171e27');ax.set_facecolor('#212b35')
def pt(x,y):return x*scale,y*scale
def rect(x,y,w,h,label):
 ax.add_patch(Rectangle(pt(x,y),w*scale,h*scale,facecolor='#57606a',edgecolor='#a8adb0',lw=.8));ax.text(*pt(x+w/2,y+h/2),label,ha='center',va='center',fontsize=8)
# relief et voies de service : traversée technique contrôlée au hall H1
for x,y,r in [(400,-100,180),(850,-80,170),(1050,0,100),(-130,500,160)]:
 for f in [1,.72,.45]:ax.add_patch(Circle(pt(x,y),r*scale*f,fill=False,edgecolor='#465047',lw=1))
service=np.array([[350,350],[350,600],[600,680],[1050,640],[1450,550],[1600,500],[1250,500],[950,400],[550,280],[350,350]])*scale
ax.plot(*service.T,'--',color='#74818b',lw=1.4)
for branch in [[[350,430],[410,430]],[[1570,500],[1570,330],[1650,330]],[[1570,330],[1750,380],[2000,380],[2090,420]],[[1830,380],[1830,365]],[[1970,380],[1970,470]]]:
 b=np.array(branch)*scale;ax.plot(*b.T,'--',color='#74818b',lw=1.4)
for y in [405,455]:
 ax.plot([1558*scale,1582*scale],[y*scale,y*scale],color='#df9a69',lw=3,zorder=7)
ax.text(*pt(750,520),'RÉSEAU DE SERVICE\nfermé pendant la course',ha='center',color='#a2abb1',fontsize=9)
for x,y,r in [(620,690,44),(870,670,25),(1050,620,25)]:
 ax.add_patch(Circle(pt(x,y),r*scale,color='#b9c4c5',ec='#e6e7dc'));ax.plot([x*scale,(x+20)*scale],[y*scale,(y+40)*scale],color='#283640',lw=2)
ax.text(*pt(610,610),'D1 · PARABOLE HÉRO',ha='center',fontsize=9)
rect(1500,390,145,80,'H1')
rect(1600,270,115,65,'H2')
rect(1770,300,115,65,'H3')
rect(1950,470,45,45,'T')
rect(2050,420,85,45,'B')
rect(350,400,120,60,'OPS')
rect(230,360,60,40,'LOG')
rect(70,360,20,35,'C')
ax.text(*pt(2110,240),'T : tour / radar   B : bunker\nOrange : accès technique fermé',ha='center',fontsize=8)
for i,a in enumerate(curves):
 ax.plot(*a.T,color='#0c131a',lw=13,zorder=3)
 ax.plot(*a.T,color=colors[groups[i]],lw=7,zorder=4,solid_capstyle='round')
 # flèche de circulation à chaque segment
 j=260;ax.annotate('',xy=a[j+25],xytext=a[j-25],arrowprops=dict(arrowstyle='-|>',color='#101c24',lw=1.5),zorder=5)
ax.text(*pt(1550,365),'H1 · traversée axiale',ha='center',fontsize=9)
start=xy[0];ax.plot([start[0]-24,start[0]+24],[start[1],start[1]],color='white',lw=3,zorder=6)
ax.text(*pt(180,235),'DÉPART / ARRIVÉE\n0,000 / 5,400 km',fontsize=10)
labels=[(50,770,'01  CHECKPOINT'),(650,910,'02  CHAMP RADIO'),(1720,910,'03  PISTE D’ESSAI'),(1750,140,'04  COMPLEXE SECRET'),(720,-110,'05  COLLINES')]
for x,y,label in labels:ax.text(*pt(x,y),label,fontsize=12,fontweight='bold',ha='center')
for i,label in [(4,'F1 · grand freinage'),(6,'F2 · transfert en S'),(8,'V8 · sortie technique')]:
 q=curves[i][100];ax.annotate(label,xy=q,xytext=(q[0]+30,q[1]+80),fontsize=9,arrowprops=dict(arrowstyle='-',color='white'))
ax.text(*pt(1640,760),f'ALIGNEMENT {lens[3]:.0f} m · largeur 24 m',ha='center',fontsize=9)
ax.plot([0,500],[-230,-230],color='#e8e4d9',lw=3);ax.text(250,-205,'500 m',ha='center')
ax.annotate('N',xy=pt(2400,930),xytext=pt(2400,800),ha='center',arrowprops=dict(arrowstyle='->',color='white'))
ax.set_aspect('equal');ax.set_xlabel('Est — mètres');ax.set_ylabel('Nord — mètres');ax.grid(alpha=.1)
ax.set_xlim(-450,2540);ax.set_ylim(-320,1010)
ax.set_title('AREA 51 — SIGNAL UNKNOWN\nPlan directeur · boucle unique · sens horaire · géométrie à l’échelle',loc='left',fontsize=18,pad=20)
fig.tight_layout();fig.savefig(ROOT/'plan-cote.png',dpi=180);fig.savefig(ROOT/'plan-cote.svg');plt.close(fig)
fig,ax=plt.subplots(figsize=(16,3.3),facecolor='#171e27');ax.set_facecolor('#212b35')
ax.fill_between(s,998,z,color='#718587',alpha=.4);ax.plot(s,z,color='#ddd3aa',lw=2)
bounds=[stations[0],stations[1],stations[3],stations[6],stations[9],5400]
for i in range(5):ax.axvspan(bounds[i],bounds[i+1],color=colors[i],alpha=.12);ax.text((bounds[i]+bounds[i+1])/2,1025,f'Z{i+1}',ha='center')
ax.set(xlim=(0,5400),ylim=(998,1028),xlabel='Distance depuis le départ (m)',ylabel='Altitude fictive (m)')
ax.set_title('PROFIL LONGITUDINAL · amplitude 18 m · pente maximale 3,6 % · échelle verticale exagérée',loc='left');ax.grid(alpha=.15)
fig.tight_layout();fig.savefig(ROOT/'profil-altimetrique.png',dpi=180);fig.savefig(ROOT/'profil-altimetrique.svg');plt.close(fig)
with open(ROOT/'axe-circuit.csv','w',newline='',encoding='utf-8') as f:
 w=csv.writer(f);w.writerow(['distance_m','est_m','nord_m','altitude_m']);w.writerows(zip(s[::10],xy[::10,0],xy[::10,1],z[::10]))
data={'length_m':float(s[-1]),'scale':scale,'segments_m':lens.tolist(),'stations_m':stations.tolist(),'zones_m':bounds,'bbox_m':np.ptp(xy,axis=0).tolist(),'max_grade_percent':float(np.max(np.abs(np.diff(z)/np.diff(s)))*100),'bezier_control_points_m':P.tolist()}
(ROOT/'geometrie.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in data.items() if k!='bezier_control_points_m'},indent=2))
# Planche éditoriale : placement des trois visuels sans modification de l’illustration.
if (ROOT/'moodboard-zones.png').exists():
 fig=plt.figure(figsize=(20,13),facecolor='#171e27')
 fig.text(.035,.955,'AREA 51',fontsize=38,weight='bold');fig.text(.035,.917,'SIGNAL UNKNOWN  /  REDLINE RACER',fontsize=17,color='#d2bc79')
 fig.text(.55,.95,'5,40 km    /    5 zones    /    18 m de relief',fontsize=18)
 fig.text(.55,.919,'927 m d’essai • deux séquences de freinage • un hangar traversant',fontsize=11)
 for pos,name in [([.015,.29,.62,.59],'plan-cote.png'),([.025,.09,.60,.19],'profil-altimetrique.png'),([.65,.37,.33,.51],'moodboard-zones.png')]:
  a=fig.add_axes(pos);a.imshow(plt.imread(ROOT/name));a.axis('off')
 fig.text(.65,.34,'MOODBOARD — 10 vues conceptuelles, lecture par rangées',fontsize=11,weight='bold')
 notes=['01  Accès / repères de freinage : passage large et contrasté.',
 '02  Grande parabole / champ radio : landmarks en retrait.',
 '03  Essais / aire de retour : vitesse puis freinage annoncé.',
 '04  Ateliers / intérieur : portes opposées, axe dégagé.',
 '05  Collines / signal : respiration et anomalie lointaine.']
 for i,n in enumerate(notes):fig.text(.65,.307-i*.026,n,fontsize=10)
 for i,c in enumerate(['#343A42','#A58D70','#B3B5AA','#626B5E','#55556F','#BA4C42','#D7B274']):
  fig.add_artist(Rectangle((.65+i*.046,.115),.04,.025,transform=fig.transFigure,color=c))
 fig.text(.035,.045,'PRÉPRODUCTION V1  •  Géométrie de référence mesurée ; illustrations d’ambiance non contractuelles.',fontsize=10,color='#a4a8ab')
 fig.text(.65,.075,'Low-poly • textures pixelisées • métal mat • ciel ardoise',fontsize=10)
 fig.savefig(ROOT/'planche-area51.png',dpi=180);fig.savefig(ROOT/'planche-area51.svg');plt.close(fig)
