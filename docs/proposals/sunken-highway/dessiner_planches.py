"""Planches documentaires: axe métrique partagé, images conceptuelles intégrées."""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.patches import Polygon,Rectangle,PathPatch
from matplotlib.path import Path as MPath
from shapely.geometry import LineString,Point

O=Path(__file__).parent
D=json.loads((O/'geometrie.json').read_text(encoding='utf-8'))
A=np.genfromtxt(O/'trace.csv',delimiter=',',skip_header=1)
s,x,y,z=A[:,:4].T
xy=np.c_[x,y]
COL=['#b38722','#c76738','#a54d68','#168eae','#468343']
BG='#f6f3e9';INK='#243f3c';MUT='#61746b'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'text.color':INK,'axes.labelcolor':INK,'xtick.color':MUT,'ytick.color':MUT,'svg.fonttype':'none'})
def path(ax,mask,width,color,zz=5):
    # Road widths are in world metres, independent of export resolution.
    pts=xy[mask]; poly=LineString(pts).buffer(width/2,cap_style=2,join_style=1)
    rings=[np.asarray(poly.exterior.coords)]+[np.asarray(r.coords) for r in poly.interiors]
    paths=[MPath(r,np.r_[MPath.MOVETO,np.full(len(r)-2,MPath.LINETO),MPath.CLOSEPOLY]) for r in rings]
    ax.add_patch(PathPatch(MPath.make_compound_path(*paths),facecolor=color,edgecolor='none',zorder=zz))
def label(ax,station,text,pos):
    p=xy[np.argmin(abs(s-station))]
    ax.annotate(text,p,xytext=pos,fontsize=10,color=INK,ha='center',va='center',bbox=dict(boxstyle='round,pad=.5',fc=BG,ec='none',alpha=.96),arrowprops=dict(arrowstyle='-',color=MUT,lw=.8),zorder=20)
def mapplot(ax,title=True):
    ax.set_facecolor('#c8e7df')
    # Western former higher terrace; submerged urban basin to the east.
    land=[(-1100,-620),(-1100,700),(-610,700),(-590,430),(-690,220),(-620,20),(-680,-170),(-560,-360),(-500,-620)]
    ax.add_patch(Polygon(land,facecolor='#d8dfbb',edgecolor='#a7bc93',lw=1,zorder=0))
    ax.add_patch(Polygon([(-1100,700),(-890,700),(-850,330),(-970,100),(-940,-180),(-1100,-400)],facecolor='#bccd9d',edgecolor='none'))
    route=LineString(xy)
    rng=np.random.default_rng(51)
    for _ in range(130):
        bx=rng.uniform(-790,930);by=rng.uniform(-400,490)
        if route.distance(Point(bx,by))<65:continue
        w=rng.uniform(18,42);h=rng.uniform(22,55)
        ax.add_patch(Rectangle((bx,by),w,h,facecolor='#9fbbb2',edgecolor='#85a69b',lw=.4,alpha=.55,zorder=1))
    # Dominant landmark: twin planted towers, reserved outside the road envelope.
    for bx in [430,485]:ax.add_patch(Rectangle((bx,80),30,48,facecolor='#7c967a',edgecolor=INK,lw=1,zorder=2))
    ax.text(475,55,'TOURS-JARDINS',fontsize=8,ha='center',color=MUT)
    for bx,by,txt in [(-820,500,'TERRASSE HAUTE'),(390,455,'BASSIN URBAIN · EAU 0 m')]:
        ax.text(bx,by,txt,fontsize=9,color=MUT,weight='bold')
    # Draw low route first; restore the upper crossing after all sectors.
    path(ax,np.ones(len(s),bool),25,'#f9f7ed',3)
    path(ax,np.ones(len(s),bool),21,'#304b47',4)
    for i,sec in enumerate(D['sectors']):
        m=(s>=sec['start_m'])&(s<=sec['end_m'])
        path(ax,m,16,COL[i],5)
    m=(s>680)&(s<810)
    path(ax,m,26,BG,7);path(ax,m,21,INK,8)
    path(ax,m&(s<=700),16,COL[0],9);path(ax,m&(s>=700),16,COL[1],9)
    # Direction markers, actual positions and tangents.
    for st in [130,520,1000,1500,1920,2370,2780,3280,3780,4250,4620]:
        j=np.argmin(abs(s-st));v=xy[j+7]-xy[j-7];v=v/np.linalg.norm(v)
        ax.annotate('',xy[j]+v*25,xy[j]-v*25,arrowprops=dict(arrowstyle='-|>',mutation_scale=12,color='white',lw=1.1),zorder=12)
    # Start perpendicular to the centreline, not a guessed orientation.
    d=xy[1]-xy[-2];d/=np.linalg.norm(d);n=np.array([-d[1],d[0]])
    p=xy[0]
    ax.plot(*np.array([p-n*18,p+n*18]).T,color=INK,lw=5,zorder=15)
    ax.plot(*np.array([p-n*18,p+n*18]).T,color='white',lw=2,ls='--',zorder=16)
    label(ax,0,'DÉPART / ARRIVÉE\n+24 m · vers l’est',(-670,-495))
    label(ax,440,'01  PÉRIPHÉRIQUE\n0–700 m · vitesse',(-310,-450))
    label(ax,1120,'02  ÉCHANGEURS\n700–1 400 m · montée',(0,330))
    label(ax,1840,'03  GRAND VIADUC\n1 400–2 200 m · +32 m',(920,390))
    label(ax,2660,'04  QUARTIER SUBMERGÉ\n2 200–3 650 m · descente',(620,-440))
    label(ax,4140,'05  AUTOROUTE VÉGÉTALE\n3 650–4 800 m · remontée',(-900,370))
    label(ax,742,'X1 · DEUX NIVEAUX\n+24,02 / +4,01 m\n18,01 m libres',(200,-60))
    # 200m scale bar plus unambiguous metric axes and equal aspect.
    ax.plot([-1000,-800],[-530,-530],color=INK,lw=3)
    ax.plot([-1000,-1000],[-520,-540],color=INK,lw=1)
    ax.plot([-800,-800],[-520,-540],color=INK,lw=1)
    ax.text(-900,-510,'200 m',ha='center',fontsize=9)
    ax.annotate('N',xy=(1010,510),xytext=(1010,420),ha='center',weight='bold',arrowprops=dict(arrowstyle='-|>',color=INK))
    ax.set(xlim=(-1100,1100),ylim=(-580,600),aspect='equal',xlabel='Est (m)',ylabel='Nord (m)')
    ax.set_xticks(np.arange(-1000,1100,200));ax.set_yticks(np.arange(-400,600,200))
    ax.tick_params(labelsize=8,length=0,pad=6)
    ax.grid(color='white',lw=.6,alpha=.45,zorder=0)
    for sp in ax.spines.values():sp.set_visible(False)
    if title:ax.set_title('PLAN MÉTRIQUE  /  une seule chaussée continue',loc='left',pad=18,weight='bold',fontsize=17)
def profile(ax,title=True):
    ax.set_facecolor(BG)
    ax.axhline(0,color='#41a8b0',lw=2)
    for i,sec in enumerate(D['sectors']):
        m=(s>=sec['start_m'])&(s<=sec['end_m'])
        ax.fill_between(s[m],0,z[m],color=COL[i],alpha=.12)
        ax.plot(s[m],z[m],color=COL[i],lw=3)
        ax.text((sec['start_m']+sec['end_m'])/2,36,f'0{i+1}',color=COL[i],ha='center',weight='bold',fontsize=11)
    for st,h,lab in [(0,24,'D · 24'),(1400,32,'32'),(2200,32,'32'),(3100,4,'4'),(3650,4,'4'),(4550,24,'24')]:
        ax.plot(st,h,'o',color=INK,ms=3)
        ax.annotate(lab,(st,h),xytext=(4,6),textcoords='offset points',fontsize=9)
    for st,zz in zip(D['crossings'][0]['s_m'],D['crossings'][0]['z_m']):
        ax.plot([st,st],[0,zz],color=MUT,ls=':',lw=1)
        ax.text(st,-4,'X1',ha='center',fontsize=8)
    ax.text(2680,19,'−5,83 % max.',fontsize=9,rotation=-24,ha='center')
    ax.text(4060,17,'+4,17 % max.',fontsize=9,rotation=20,ha='center')
    ax.text(70,1,'EAU 0 m',fontsize=8,color='#168eae')
    ax.set(xlim=(-40,4900),ylim=(-6,40),xlabel='Distance en plan depuis le départ (m)',ylabel='Altitude (m)')
    ax.set_xticks([0,700,1400,2200,3100,3650,4550,4800]);ax.set_yticks([0,4,24,32]);ax.tick_params(labelsize=8)
    for sp in ax.spines.values():sp.set_visible(False)
    ax.grid(axis='y',alpha=.15)
    if title:ax.set_title('PROFIL LONGITUDINAL  /  raccords de pente progressifs',loc='left',pad=16,weight='bold',fontsize=15)
def save(fig,name):
    fig.savefig(O/(name+'.png'),dpi=180,facecolor=BG)
    fig.savefig(O/(name+'.svg'),facecolor=BG)
    plt.close(fig)

fig,ax=plt.subplots(figsize=(16,9),facecolor=BG);fig.subplots_adjust(left=.07,right=.98,bottom=.09,top=.91);mapplot(ax);save(fig,'plan-cote')
fig,ax=plt.subplots(figsize=(15,4),facecolor=BG);fig.subplots_adjust(left=.06,right=.98,bottom=.18,top=.80);profile(ax);save(fig,'profil-altimetrique')

fig=plt.figure(figsize=(20,13),facecolor=BG)
fig.text(.04,.95,'SUNKEN HIGHWAY',fontsize=33,weight='bold')
fig.text(.04,.916,'La ville est devenue un lagon. L’autoroute dessine encore le chemin.',fontsize=14,color=MUT)
fig.text(.04,.875,'4,801 km',fontsize=22,weight='bold')
fig.text(.19,.875,'18 m',fontsize=22,weight='bold')
fig.text(.30,.875,'+4 → +32 m',fontsize=22,weight='bold')
fig.text(.49,.875,'5,83 %',fontsize=22,weight='bold')
for xx,txt in [(.04,'LONGUEUR 3D'),(.19,'CHAUSSÉE'),(.30,'ALTITUDES / EAU = 0'),(.49,'PENTE MAXIMALE')]:fig.text(xx,.853,txt,fontsize=8,color=MUT)
ax=fig.add_axes([.045,.355,.595,.48]);mapplot(ax,False);ax.set_xlabel('')
fig.text(.04,.314,'Une boucle, un croisement, deux passages à des hauteurs différentes.',fontsize=12,weight='bold')
fig.text(.04,.291,'Axe C² fermé • rayon minimal 161 m • tabliers continus • aucun passage dans l’eau',fontsize=10,color=MUT)
ax=fig.add_axes([.055,.115,.575,.14]);profile(ax,False)
fig.text(.04,.071,'X1 : travée de 70 m · tablier haut 2 m · hauteur libre minimale à vérifier sur toute l’emprise',fontsize=9,color=MUT)
fig.text(.04,.048,'Préproduction / proposition 01 · plan à échelle uniforme, barre 200 m · profil vertical amplifié',fontsize=9,color=MUT)
fig.text(.68,.95,'CINQ ZONES / UNE MATINÉE',fontsize=14,weight='bold')
ax=fig.add_axes([.68,.13,.285,.79]);ax.imshow(plt.imread(O/'moodboard-zones.png'));ax.axis('off')
fig.text(.68,.105,'01 Vitesse  ·  02 Bretelle  ·  03 Panorama',fontsize=10,weight='bold')
fig.text(.68,.085,'04 Au bord de l’eau  ·  05 Remontée végétale',fontsize=10,weight='bold')
fig.text(.68,.052,'Concepts d’ambiance IA — ni vues en jeu, ni plans cotés.\nSilhouettes low-poly, textures pixelisées, soleil doré.',fontsize=9,color=MUT)
save(fig,'planche-sunken-highway')
print('Plans PNG et SVG exportés.')
