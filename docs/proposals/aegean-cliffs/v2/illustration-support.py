from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon,Rectangle,Circle
from shapely.geometry import Polygon as Poly,Point,LineString
D=Path(__file__).parent;a=np.loadtxt(D/'coordonnees.csv',delimiter=',',skiprows=1);s,x,y,h,w,r,g,z=a.T;xy=a[:,1:3];road=LineString(xy)
coast=Poly(xy).buffer(75,join_style=1).simplify(17);co=np.array(coast.exterior.coords)
fig,ax=plt.subplots(figsize=(12,12),facecolor='#125071');ax.set_facecolor('#125071');ax.add_patch(Polygon(co,fc='#42aab2',ec='#42aab2',lw=25));ax.add_patch(Polygon(co,fc='#d0bb95',ec='#e9d3a3',lw=3))
for v,c in [([[-250,810],[-60,1100],[330,1000],[650,930],[680,720],[380,700],[70,750]],'#a49b79'),([[290,430],[710,400],[700,800],[450,780],[270,600]],'#b48e68')]:ax.add_patch(Polygon(v,fc=c,ec='none'))
ax.plot(x,y,color='#f2e4c6',lw=10,zorder=5);ax.plot(x,y,color='#3c4549',lw=7,zorder=6)
cols=['#e9b53d','#ef7755','#c085ba','#6aaed3','#5bc5ad']
for i in range(5):m=z==i+1;ax.plot(x[m],y[m],color=cols[i],lw=1.6,zorder=7)
rng=np.random.default_rng(30)
for cx,cy,n,rx,ry in [(80,70,60,145,28),(220,-50,28,100,18),(380,1020,85,125,85),(540,880,35,70,50)]:
 for k in range(n):
  xx=cx+rng.normal(0,rx);yy=cy+rng.normal(0,ry);ww=rng.uniform(12,22);hh=rng.uniform(10,19);p=Poly([(xx,yy),(xx+ww,yy),(xx+ww,yy+hh),(xx,yy+hh)])
  if coast.contains(p) and road.distance(p)>13:
   ax.add_patch(Rectangle((xx+3,yy-3),ww,hh,fc='#8e806f',zorder=3));ax.add_patch(Rectangle((xx,yy),ww,hh,fc='#fff8e7',ec='#c8bca9',lw=.5,zorder=4))
# port quay, breakwater and piers: boats seaward
ax.plot([-170,-170,250,290],[-90,-195,-195,-140],color='#e5d5b9',lw=8)
for xx in [-70,30,130]:
 ax.plot([xx,xx],[-90,-145],color='#e7d9bd',lw=5)
 for yy in [-110,-135]:ax.add_patch(Rectangle((xx+12,yy),9,20,fc='#f7f2dc',ec='#28638c',lw=2))
ax.add_patch(Circle((345,1060),17,fc='#2668bb',ec='white',lw=3));ax.plot(-160,1170,marker='*',ms=18,color='white')
ax.plot([-5,-5],[-15,15],color='white',lw=4,zorder=8)
for ss in [300,950,1600,2300,3050,3700,4350]:
 j=np.argmin(abs(s-ss));ax.annotate('',xy=xy[j+12],xytext=xy[j-12],arrowprops={'arrowstyle':'-|>','color':'white','lw':1.5},zorder=8)
for text,pt in [('PORT / 8 m',(120,-245)),('ASCENSION',(510,560)),('VILLAGE / 161–172 m',(320,1190)),('BALCON',(-290,1060)),('DESCENTE',(-540,700))]:ax.text(*pt,text,ha='center',color='white',size=11,weight='bold',bbox={'fc':'#254b58','ec':'none','pad':4},zorder=10)
ax.set_aspect('equal');ax.set_xlim(-760,930);ax.set_ylim(-300,1300);ax.axis('off');ax.set_title('AEGEAN CLIFFS / V2 — PLAN SUPPORT MÉTRIQUE',color='white',size=17,pad=14);fig.tight_layout();fig.savefig(D/'plan-support-v2.png',dpi=160);fig.savefig(D/'plan-support-v2.svg')
fig2,p=plt.subplots(figsize=(12,3));
for i in range(5):m=z==i+1;p.plot(s[m],h[m],color=cols[i],lw=3)
p.set(xlabel='Chaînage horizontal (m)',ylabel='Altitude (m)',title='AEGEAN CLIFFS V2 — 4 717 m sur route / 4 700 m en plan');p.grid(alpha=.2);fig2.tight_layout();fig2.savefig(D/'profil-v2.png',dpi=160)
