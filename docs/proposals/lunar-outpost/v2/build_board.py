"""Reproducible preproduction drawings; no game files are changed."""
from pathlib import Path
import json, csv
import numpy as np
from scipy.interpolate import CubicSpline
from scipy.spatial import cKDTree
from shapely.geometry import LinearRing, LineString
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle
from matplotlib.collections import LineCollection
from PIL import Image

OUT = Path(__file__).parent
P=np.array([[-520,-300],[-740,-190],[-830,40],[-760,290],[-540,420],[-320,350],[-210,160],[-40,170],[50,370],[240,510],[500,460],[710,300],[770,50],[650,-120],[550,-260],[530,-420],[410,-580],[180,-600],[50,-430],[-110,-390],[-270,-500],[-440,-490],[-520,-300]],float)
t = np.r_[0,np.cumsum(np.linalg.norm(np.diff(P,axis=0),axis=1))]
curve = CubicSpline(t,P,bc_type='periodic')
u = np.linspace(0,t[-1],20001)
raw = curve(u)
scale = 4950 / np.linalg.norm(np.diff(raw,axis=0),axis=1).sum()
P *= scale
curve = CubicSpline(t,P,bc_type='periodic')
xy = curve(u)
ss = np.r_[0,np.cumsum(np.linalg.norm(np.diff(xy,axis=0),axis=1))]
s = np.linspace(0,4950,2476)
uu = np.interp(s,ss,u)
xy = curve(uu)
vel,acc = curve(uu,1),curve(uu,2)
k = (vel[:,0]*acc[:,1]-vel[:,1]*acc[:,0])/np.linalg.norm(vel,axis=1)**3
# Altitudes designed in metres, arbitrary local datum; start apron = +18 m.
zk = np.array([[0,18],[400,22],[900,45],[1250,49],[1550,42],[1900,59],[2200,69],[2500,62],[2900,43],[3300,26],[3550,24],[3800,30],[4100,20],[4400,14],[4700,17],[4950,18]],float)
profile = CubicSpline(zk[:,0],zk[:,1],bc_type='periodic')
z,grade = profile(s),profile(s,1)*100
distance3 = np.linalg.norm(np.diff(np.c_[xy,z],axis=0),axis=1).sum()
sectors = [0,550,1400,2300,3500,4950]
names = ['01  BASE LUNAIRE','02  CRATÈRE OCCIDENTAL','03  S DES CRÊTES','04  GRAND CRATÈRE ORIENTAL','05  BASSIN SUD & SAS']
colors = ['#e5bb72','#dc8d65','#9fbb9d','#81afc4','#b8a0c9']
craters = [dict(name='OCCIDENTAL',x=-550*scale,y=100*scale,r=270*scale,floor=-32,rim=50),dict(name='ORIENTAL',x=410*scale,y=160*scale,r=340*scale,floor=-75,rim=72),dict(name='SUD',x=280*scale,y=-380*scale,r=220*scale,floor=-28,rim=35),dict(name='IMPACT NORD',x=-100*scale,y=360*scale,r=140*scale,floor=-12,rim=30),dict(name='SATELLITE',x=-230*scale,y=-230*scale,r=145*scale,floor=-10,rim=22)]
# Corridor topology, separately from the conceptual terrain.
ring = LinearRing(xy)
edges = []
for side in [-1,1]:
    tangent = vel/np.linalg.norm(vel,axis=1)[:,None]
    edges.append(LinearRing(xy + side*11*np.c_[-tangent[:,1],tangent[:,0]]).is_simple)
metrics = dict(plan_length_m=4950,spatial_length_m=round(distance3,2),sample_step_plan_m=2,
    min_radius_m=round(1/np.max(abs(k)),2),max_uphill_percent=round(float(max(grade)),2),max_downhill_percent=round(float(min(grade)),2),
    z_min_m=round(float(min(z)),2),z_max_m=round(float(max(z)),2),climb_m=round(float(np.maximum(np.diff(z),0).sum()),2),
    closure_error_m=float(np.linalg.norm(xy[-1]-xy[0])),closed=True,axis_simple=bool(ring.is_simple),edge_22m_simple=bool(all(edges)),
    winding='clockwise',horizontal_interpolant='periodic cubic spline, chord-length parameter',vertical_interpolant='periodic cubic spline in horizontal chainage',
    curvature_sign_changes=int(np.sum(np.sign(k[1:])!=np.sign(k[:-1]))),
    scale_factor=float(scale),road_width_m=18,base_width_m=22,tunnel_chainage_m=[4480,4660],
    sector_boundaries_m=sectors,width_transition_chainages_m=[[280,360],[4770,4850]],craters=craters,control_points_xy_m=P.tolist(),profile_knots_sz_m=zk.tolist(),
    status='Concept coordinates; not imported or playtested in Redline Racer. Profile indicative of intended design, not surveyed topography.')
(OUT/'geometry.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2),encoding='utf-8')
with (OUT/'centreline.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.writer(f);w.writerow(['chainage_plan_m','east_m','north_m','altitude_m','grade_percent','curvature_per_m'])
    w.writerows(zip(s,xy[:,0],xy[:,1],z,grade,k))
print(json.dumps(metrics,ensure_ascii=False,indent=2))

BG='#10151c'; FG='#eee9db'; MUTED='#9da9b4'
plt.rcParams.update({'font.family':'DejaVu Sans','text.color':FG,'axes.labelcolor':MUTED,'xtick.color':MUTED,'ytick.color':MUTED,'font.size':10,'svg.fonttype':'none'})

def at(st): return np.array([np.interp(st,s,xy[:,0]),np.interp(st,s,xy[:,1])])

def mapdraw(ax):
    ax.set_facecolor('#1b222b')
    # Territorial masses established before route: bowls, rims, ejecta and saddle.
    gx=np.linspace(-950,1060,350)*scale; gy=np.linspace(-680,690,260)*scale
    X,Y=np.meshgrid(gx,gy); H=np.ones_like(X)*8
    for c in craters:
        R=np.hypot(X-c['x'],Y-c['y'])/c['r']
        angle=np.arctan2(Y-c['y'],X-c['x'])
        rim=(35+15*np.sin(angle)) if c['name']=='OCCIDENTAL' else ((46+26*np.sin(angle)) if c['name']=='ORIENTAL' else c['rim'])
        H += (rim-8)*np.exp(-((R-1)/.25)**2)+(c['floor']-8)*np.exp(-(R/.67)**4)
    H+=45*np.exp(-((X+25*scale)/(260*scale))**2-((Y-270*scale)/(120*scale))**2)
    # Graded shoulder and cut/fill transition. This is a conceptual designed terrain,
    # not a surveyed DEM; the road centre altitude is the authoritative profile.
    dist,idx=cKDTree(xy).query(np.c_[X.ravel(),Y.ravel()]);dist=dist.reshape(X.shape);idx=idx.reshape(X.shape)
    blend=np.clip((dist-15)/55,0,1);blend=blend*blend*(3-2*blend)
    H=blend*H+(1-blend)*z[idx]
    ax.contourf(X,Y,H,levels=[-90,-60,-30,-10,10,25,40,55,70,100],colors=['#151d27','#1c2632','#25313e','#303d49','#3d4955','#4c5661','#5c626b','#6c6e74','#7a7a7c'])
    ax.contour(X,Y,H,levels=[-60,-30,0,30,60],colors='#9ca4aa',linewidths=.35,alpha=.28)
    for c in craters:
        ax.add_patch(Circle((c['x'],c['y']),c['r'],fill=False,ec='#b4b5ac',lw=.7,ls=(0,(3,5)),alpha=.5))
        ax.text(c['x'],c['y'],c['name']+'\nØ '+str(round(2*c['r']))+' m\nfond '+str(c['floor'])+' m',ha='center',va='center',fontsize=8,color='#bec7d0',linespacing=1.6)
    # Service links, deliberately distinct from the racing ribbon.
    base=np.array([-530,-235])*scale
    for pts in [[base,[-480*scale,-280*scale],[-420*scale,-300*scale]], [base,[-300*scale,-425*scale],at(4590)], [at(880),[-750*scale,350*scale]], [at(2550),[850*scale,180*scale]]]:
        q=np.array(pts); ax.plot(q[:,0],q[:,1],ls='--',lw=1,color='#8c918e',alpha=.8)
    # Width to scale via polygon band, with separate thin sector centerline.
    tangent=vel/np.linalg.norm(vel,axis=1)[:,None]; normal=np.c_[-tangent[:,1],tangent[:,0]]
    down=np.clip((s-280)/80,0,1); down=down*down*(3-2*down)
    up=np.clip((s-4770)/80,0,1); up=up*up*(3-2*up)
    width=11-2*down+2*up
    left,right=xy+normal*width[:,None],xy-normal*width[:,None]
    ax.fill(np.r_[left[:,0],right[::-1,0]],np.r_[left[:,1],right[::-1,1]],color='#e7e2d0',zorder=5)
    for j,(a,b) in enumerate(zip(sectors[:-1],sectors[1:])):
        mask=(s>=a)&(s<=b);ax.plot(*xy[mask].T,color=colors[j],lw=2,zorder=6)
        for st in np.arange(a+150,b,330):
            p,q=at(st-14),at(st+14);ax.annotate('',xy=q,xytext=p,arrowprops=dict(arrowstyle='-|>',color=BG,lw=1.4,mutation_scale=12),zorder=8)
        p=at(a);ax.scatter(*p,s=85,c=colors[j],edgecolor=BG,zorder=9);ax.text(*p,str(j+1),ha='center',va='center',color=BG,weight='bold',fontsize=8,zorder=10)
    # Gallery physically follows the final gentle bend.
    mask=(s>=4480)&(s<=4660); ax.plot(*xy[mask].T,color=FG,lw=7,zorder=7);ax.plot(*xy[mask].T,color='#5d536a',lw=4,zorder=8)
    p=at(0); ax.annotate('DÉPART / ARRIVÉE\n0 / 4 950 m',xy=p,xytext=(-905*scale,-430*scale),fontsize=9,color=FG,arrowprops=dict(arrowstyle='-',color=FG,lw=.8),zorder=12)
    for x,y,r in [(*base,30),(-480*scale,-235*scale,10),(-453*scale,-235*scale,10)]:
        ax.add_patch(Circle((x,y),r,fc='#e7e2d0',ec=BG,lw=1,zorder=10))
    ax.text(base[0],base[1]+65,'DÔME / HABITAT',ha='center',fontsize=8)
    for j in range(4):ax.add_patch(Rectangle((-460*scale+j*20,-300*scale),13,28,fc='#547f9e',ec='#a2b3bf',lw=.4))
    ax.text(-410*scale,-335*scale,'SOLAIRE',ha='center',fontsize=7)
    installations=[(-750,350,'RELAIS',(-870,425)),(850,180,'SCIENCE',(1000,310)),(-300,-425,'GARAGE / BUGGY',(-80,-650))]
    for x,y,label,txt in installations:
        ax.scatter(x*scale,y*scale,marker='s',s=26,color='#e7e2d0',zorder=9)
        ax.annotate(label,xy=(x*scale,y*scale),xytext=np.array(txt)*scale,ha='right' if label=='SCIENCE' else 'left',fontsize=7,arrowprops=dict(arrowstyle='-',color=MUTED,lw=.6))
    ax.annotate('CRÊTE · RÉVÉLATION TERRE',xy=at(2200),xytext=(-170*scale,620*scale),ha='center',fontsize=8,arrowprops=dict(arrowstyle='-',color=MUTED,lw=.7))
    ax.annotate('GALERIE 180 m · SAS OUVERTS',xy=at(4570),xytext=(-670*scale,-630*scale),fontsize=8,arrowprops=dict(arrowstyle='-',color=MUTED,lw=.7))
    ax.text(910*scale,590*scale,'N ↑',ha='center',fontsize=14)
    ax.plot([-870*scale,-870*scale+250],[-590*scale]*2,color=FG,lw=3)
    ax.text(-870*scale+125,-565*scale,'250 m',ha='center',fontsize=8)
    ax.set_xlim(gx[0],gx[-1]);ax.set_ylim(gy[0],gy[-1]);ax.set_aspect('equal')
    ax.set_xlabel('Est / ouest · mètres');ax.set_ylabel('Nord / sud · mètres');ax.tick_params(labelsize=7)
    for spine in ax.spines.values():spine.set_color('#44505d')

def profdraw(ax):
    ax.set_facecolor(BG)
    for j,(a,b) in enumerate(zip(sectors[:-1],sectors[1:])):
        m=(s>=a)&(s<=b);ax.fill_between(s[m],z[m],0,color=colors[j],alpha=.12);ax.plot(s[m],z[m],c=colors[j],lw=2)
    ax.axvspan(4480,4660,color=FG,alpha=.1)
    ax.set_xlim(0,4950);ax.set_ylim(0,90);ax.set_yticks([0,30,60,90]);ax.grid(alpha=.12)
    ax.set_xlabel('Chaînage horizontal (m)',fontsize=8);ax.set_ylabel('Altitude (m)',fontsize=8)
    ax.tick_params(labelsize=7)
    for st,label in [(0,'BASE'),(1200,'REBORD O.'),(2200,'CRÊTE'),(2900,'DESCENTE E.'),(4570,'SAS')]:
        ax.text(st+20,float(profile(st))+7,label,fontsize=6.5,color=MUTED)
    for sp in ax.spines.values():sp.set_visible(False)

fig=plt.figure(figsize=(26,17),facecolor=BG)
fig.text(.035,.952,'REDLINE RACER   /   TRACK DESIGN STUDY 06 / V2',fontsize=11,color='#d68a42',weight='bold')
fig.text(.035,.907,'LUNAR OUTPOST',fontsize=44,weight='bold')
fig.text(.036,.875,'Trois lobes, des S de liaison et un buggy lunaire à cabine fermée.',fontsize=14,color=MUTED)
fig.text(.965,.94,'4,95 km  /  5 secteurs',ha='right',fontsize=22)
fig.text(.965,.912,f"18–22 m de large   ·   relief {z.min():.0f}–{z.max():.0f} m   ·   pente max. {max(abs(grade)):.1f} %",ha='right',fontsize=12,color=MUTED)
fig.text(.965,.88,'V2 / TRACÉ REMANIÉ / 17 NOV. 2026',ha='right',fontsize=10,color=MUTED)
fig.text(.035,.837,'01 / TERRITOIRE & BOUCLE À L’ÉCHELLE',fontsize=12,weight='bold')
fig.text(.587,.837,'02 / MOODBOARD ORIGINAL · INTENTIONS, PAS CAPTURES DU JEU',fontsize=10,weight='bold')
ax=fig.add_axes([.045,.365,.515,.45]);mapdraw(ax)
art=fig.add_axes([.585,.335,.38,.482]);art.imshow(Image.open(OUT/'moodboard.png'));art.axis('off')
# Labels follow the row-major ordering of the original contact sheet.
captions=[('01  COURBE SIGNATURE','Garder : buggy fermé, S ouverts.','Écarter : route proche du vide sans retenue.'),('02  TERRITOIRE','Garder : impacts de tailles variées.','Écarter : relief détaillé au bord roulable.'),('03  COLONIE 1978','Garder : dôme facetté, modules courts.','Écarter : ville spatiale continue.'),('04  CRÊTE','Garder : balisage avant le sommet.','Écarter : virage caché après la bosse.'),('05  GALERIE','Garder : anneaux, sortie éclairée.','Écarter : sas mobiles pendant la course.'),('06  BUGGY LUNAIRE','Garder : toit et vitres opaques.','Écarter : cockpit ouvert, joueurs visibles.'),('07  ÉNERGIE / RELAIS','Garder : îlot technique compact.','Écarter : antenne dominante façon Area 51.'),('08  GUIDAGE','Garder : sol sombre, bordure ivoire.','Écarter : néon continu et faible contraste.')]
for j,(title,a,b) in enumerate(captions):
    x=.587+(j%2)*.195; y=.31-(j//2)*.061
    fig.text(x,y,title,fontsize=9,color='#e5bb72',weight='bold')
    fig.text(x,y-.016,a,fontsize=7.5,color=FG);fig.text(x,y-.030,b,fontsize=7.5,color=MUTED)
fig.text(.035,.321,'03 / PROFIL LONGITUDINAL PROPOSÉ',fontsize=12,weight='bold')
fig.text(.035,.301,'Indicatif : altitudes conçues, sans relevé réel ni validation en jeu. Même axe que le plan.',fontsize=8,color=MUTED)
prof=fig.add_axes([.055,.165,.49,.12]);profdraw(prof)
for j,n in enumerate(names):
    x=.035+(j%3)*.175;y=.112-(j//3)*.023
    fig.text(x,y,n,fontsize=8,color=colors[j],weight='bold')
fig.text(.035,.059,'Secteurs colorés = document. Pointillés = dessertes. Terrain et terrassements indicatifs ; échelle XY uniforme.',fontsize=8,color=MUTED)
fig.text(.035,.04,f"BOUCLE VÉRIFIÉE   fermeture 0 m · aucun croisement · rayon min. {metrics['min_radius_m']:.0f} m · longueur 3D {distance3:.0f} m",fontsize=9,color=FG)
for j,c in enumerate(['#070b13','#777f8c','#303640','#e7e2d0','#547f9e','#d68a42']):
    fig.add_artist(Rectangle((.587+j*.063,.055),.055,.017,transform=fig.transFigure,fc=c,ec='#68717b',lw=.5))
fig.text(.587,.04,'ISOLEMENT / ÉLAN / MINÉRAL / ANALOGIQUE / HORIZON',fontsize=8,color=MUTED)
fig.savefig(OUT/'planche-lunar-outpost.png',dpi=170,facecolor=BG)
fig.savefig(OUT/'planche-lunar-outpost.svg',facecolor=BG)
plt.close(fig)
fig=plt.figure(figsize=(15,11),facecolor=BG);a=fig.add_axes([.08,.09,.86,.80]);mapdraw(a);fig.suptitle('LUNAR OUTPOST — Plan territorial et tracé coté',fontsize=20,y=.96);fig.text(.08,.025,'Mètres · sens horaire · route 18 m / base 22 m · courbes de niveau conceptuelles, non relevées',color=MUTED);fig.savefig(OUT/'plan-territorial.png',dpi=180);plt.close(fig)
fig=plt.figure(figsize=(15,4),facecolor=BG);a=fig.add_axes([.08,.2,.88,.6]);profdraw(a);fig.suptitle('Profil indicatif de conception — même chaînage que le plan',fontsize=15);fig.savefig(OUT/'profil-altimetrique.png',dpi=180);plt.close(fig)
