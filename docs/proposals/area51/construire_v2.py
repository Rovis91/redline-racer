from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle, Circle
import json
R=Path(__file__).parent
# Territoire à trois lobes, courbes raccordées par tangentes communes.
p=np.array([[100,200],[60,480],[210,700],[450,750],[650,600],[850,640],[950,870],[1200,920],[1400,790],[1930,790],[2120,650],[2070,480],[1860,450],[1770,250],[1500,250],[1380,390],[1180,400],[1080,190],[850,110],[680,260],[500,270],[410,60],[230,20]],float)
v=(np.roll(p,-1,axis=0)-np.roll(p,1,axis=0))*.38
v[8]=[240,0];v[9]=[240,0];v[13]=[-170,0];v[14]=[-170,0]
t=np.linspace(0,1,301)[:,None]
def curve(i):
 j=(i+1)%len(p)
 return (2*t**3-3*t**2+1)*p[i]+(t**3-2*t**2+t)*v[i]+(-2*t**3+3*t**2)*p[j]+(t**3-t**2)*v[j]
a=[curve(i) for i in range(len(p))];scale=5500/sum(np.linalg.norm(np.diff(c,axis=0),axis=1).sum() for c in a)
p*=scale;v*=scale;a=[curve(i) for i in range(len(p))]
lengths=[np.linalg.norm(np.diff(c,axis=0),axis=1).sum() for c in a];stations=np.r_[0,np.cumsum(lengths)]
colors=['#dcc788','#83c9cf','#eeac73','#b7a1d3','#a4b97e']
groups=[0]*2+[1]*6+[2]*4+[3]*5+[4]*6
fig,ax=plt.subplots(figsize=(16,9),facecolor='#19212b');ax.set_facecolor('#26333c')
def pts(q):return np.array(q)*scale
for q in [[[500,1100],[540,830],[670,710],[760,780],[820,1040]],[[1120,0],[1120,230],[1250,310],[1350,290],[1400,70]],[[450,-180],[500,60],[640,160],[760,50],[800,-150]],[[-100,550],[-80,850],[100,970],[170,830]]]:
 ax.add_patch(Polygon(pts(q),facecolor='#75644e',edgecolor='#b49b75',alpha=.8))
for x,y,r in [(320,560,42),(460,510,25),(600,440,25)]:
 ax.add_patch(Circle((x*scale,y*scale),r*scale,color='#d8ddd7'));ax.plot(pts([[x,y],[x+25,y+25]])[:,0],pts([[x,y],[x+25,y+25]])[:,1],color='#657c8a')
def box(x,y,w,h,label):
 ax.add_patch(Rectangle((x*scale,y*scale),w*scale,h*scale,fc='#68726c',ec='#d6d9ca'));ax.text((x+w/2)*scale,(y+h/2)*scale,label,color='white',ha='center',va='center',fontsize=9)
box(1580,205,130,90,'H1');box(1510,40,120,65,'H2');box(1700,60,120,65,'H3');box(1930,330,35,35,'R');box(1220,80,80,40,'B');box(220,320,100,60,'OPS')
for q in [[[240,350],[240,470],[320,510],[460,480],[600,440]],[[240,350],[650,370],[900,450],[1100,520],[1450,500],[1645,400],[1645,300]],[[1645,200],[1645,150],[1570,140],[1570,105]],[[1645,150],[1750,150],[1750,125]],[[1750,150],[1900,190],[1945,330]]]:
 b=pts(q);ax.plot(*b.T,'--',color='#8b9498',lw=1)
for i,c in enumerate(a):
 ax.plot(*c.T,color='#101820',lw=12,zorder=3);ax.plot(*c.T,color=colors[groups[i]],lw=7,zorder=4)
 if i%2==0:ax.annotate('',xy=c[190],xytext=c[150],arrowprops=dict(arrowstyle='-|>',color='#15232c',lw=1.6),zorder=5)
ax.plot([p[0,0]-22,p[0,0]+22],[p[0,1],p[0,1]],color='white',lw=3,zorder=6)
labels=[(90,110,'DÉPART'),(380,830,'Z2 · COURBES RADIO'),(1660,900,'Z3 · ESSAIS'),(1560,550,'Z4 · ATELIERS'),(780,-80,'Z5 · ESSES DES COLLINES')]
for x,y,txt in labels:ax.text(x*scale,y*scale,txt,color='#f1e8d6',ha='center',fontsize=11,weight='bold')
ax.text(180*scale,400*scale,'Z1 · ACCÈS',color='white',fontsize=10)
ax.text(1660*scale,750*scale,f'{lengths[8]:.0f} m droits',color='white',ha='center')
ax.text(1640*scale,170*scale,'H1 : portes est / ouest',color='white',ha='center',fontsize=8)
ax.annotate('N',xy=(2110*scale,990*scale),xytext=(2110*scale,860*scale),color='white',ha='center',arrowprops=dict(arrowstyle='->',color='white'))
ax.plot([0,500],[-200,-200],color='white',lw=3);ax.text(250,-180,'500 m',color='white',ha='center')
ax.set_aspect('equal');ax.set_xlim(-150*scale,2250*scale);ax.set_ylim(-240*scale,1100*scale);ax.axis('off')
ax.set_title('AREA 51 — SIGNAL UNKNOWN / V2\n5,50 km · une boucle · courbes radio, essais, ateliers, esses rocheuses',color='#f1e8d6',loc='left',fontsize=18)
fig.tight_layout();fig.savefig(R/'plan-cote-v2.png',dpi=170);plt.close(fig)
xy=np.vstack([c[:-1] for c in a]+[a[-1][-1:]]);s=np.r_[0,np.cumsum(np.linalg.norm(np.diff(xy,axis=0),axis=1))]
zk=np.array([0,800,1700,2400,3800,4600,5500]);zh=np.array([1000,1008,1014,1004,1004,1018,1000]);ii=np.clip(np.searchsorted(zk,s,side='right')-1,0,len(zk)-2);u=(s-zk[ii])/(zk[ii+1]-zk[ii]);z=zh[ii]+(zh[ii+1]-zh[ii])*(1-np.cos(np.pi*u))/2
fig,ax=plt.subplots(figsize=(14,3));ax.plot(s,z);ax.fill_between(s,998,z,alpha=.2);ax.set(xlabel='Distance (m)',ylabel='Altitude fictive (m)',title='V2 · relief 18 m · essais et hangar sur plateau · fermeture sans cassure',xlim=(0,5500));ax.grid(alpha=.2);fig.tight_layout();fig.savefig(R/'profil-v2.png',dpi=160);plt.close(fig)
data={'length':float(s[-1]),'straight':lengths[8],'scale':scale,'zone_bounds':stations[[0,2,8,12,17,23]].tolist(),'nodes_m':p.tolist(),'tangents_m':v.tolist(),'grade_max':float(max(abs(np.diff(z)/np.diff(s)))*100)}
(R/'geometrie-v2.json').write_text(json.dumps(data,indent=2));print(json.dumps({k:v for k,v in data.items() if k not in ['nodes_m','tangents_m']}))
