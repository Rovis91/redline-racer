"""Documents de préproduction uniquement ; aucune modification du jeu."""
from pathlib import Path
import json, csv
import numpy as np
from scipy.interpolate import CubicSpline, PchipInterpolator
from shapely.geometry import LinearRing, LineString
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon

OUT=Path(__file__).parent
P=np.array([[0,-650],[-400,-650],[-750,-400],[-850,0],[-700,450],[-350,720],[100,760],[500,600],[780,300],[690,0],[740,-300],[450,-550],[0,-650]],float)
t=np.r_[0,np.cumsum(np.linalg.norm(np.diff(P,axis=0),axis=1))]
c=CubicSpline(t,P,bc_type='periodic')
u=np.linspace(0,t[-1],40001); Q=c(u)
d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(Q,axis=0),axis=1))]
scale=4800/d[-1]; P*=scale; Q*=scale; d*=scale
s=np.arange(0,4801,2.)
x=np.interp(s,d,Q[:,0]); y=np.interp(s,d,Q[:,1])
hs=[0,400,1000,1600,2200,2600,2850,3300,3900,4450,4800]
hz=[12,12,42,100,159,188,194,154,75,12,12]
h=PchipInterpolator(hs,hz); z=h(s); grade=h.derivative()(s)*100
uu=np.interp(s,d,u); v=c(uu,1)*scale; a=c(uu,2)*scale
k=(v[:,0]*a[:,1]-v[:,1]*a[:,0])/np.linalg.norm(v,axis=1)**3
radius=1/np.maximum(abs(k),1e-12)
cuts=[0,550,1400,2500,3050,4250,4800]
names=['Port volcanique','Falaises de basalte','Montée du volcan','Crête volcanique','Descente des villages','Retour littoral']
colors=['#e9c77b','#66b8cf','#da9262','#d66f65','#a9bb83','#b3a1cf']
tunnels=[(1600,1800),(2180,2320)]
ring=LinearRing(np.c_[x,y]); road=LineString(np.c_[x,y]).buffer(7)
report=dict(horizontal_length_m=4800,spatial_length_m=float(np.linalg.norm(np.diff(np.c_[x,y,z],axis=0),axis=1).sum()),altitude_min_m=float(z.min()),altitude_max_m=float(z.max()),ascent_m=float(np.maximum(np.diff(z),0).sum()),descent_m=float(-np.minimum(np.diff(z),0).sum()),max_grade_percent=float(grade.max()),min_grade_percent=float(grade.min()),min_radius_m=float(radius.min()),min_radius_at_m=float(s[radius.argmin()]),closure_gap_m=float(np.linalg.norm([x[0]-x[-1],y[0]-y[-1],z[0]-z[-1]])),simple_closed_ring=bool(ring.is_simple and ring.is_ring),clockwise=not bool(ring.is_ccw),road_buffer_valid=bool(road.is_valid),road_buffer_holes=len(road.interiors),footprint_m=[float(np.ptp(x)),float(np.ptp(y))],altitude_interpolation='PCHIP monotone, altitude et pente continues; plat au raccord',plan_interpolation='CubicSpline périodique, paramètre corde; remise à longueur 4800 m',sample_step_m=2)
(OUT/'verification.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
with (OUT/'trace.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.writer(f);w.writerow(['s_horizontal_m','est_m','nord_m','altitude_m','pente_pct','rayon_m','secteur']);w.writerows((round(si,3),round(xi,4),round(yi,4),round(zi,4),round(gi,4),round(ri,2),min(np.searchsorted(cuts,si,side='right'),6)) for si,xi,yi,zi,gi,ri in zip(s,x,y,z,grade,radius))
(OUT/'definition.json').write_text(json.dumps(dict(plan_control_points_east_north_m=P.tolist(),altitude_knots=list(zip(hs,hz)),sector_limits_m=cuts,tunnels_m=tunnels,coordinates='Est +x, Nord +y, mer z=0; conversion moteur x=Est,y=altitude,z=-Nord',**report),ensure_ascii=False,indent=2),encoding='utf-8')
plt.rcParams.update({'font.family':'DejaVu Sans','text.color':'#e8e4d9','axes.labelcolor':'#c3c9c8','xtick.color':'#b6c5c8','ytick.color':'#b6c5c8','font.size':11,'svg.fonttype':'none'})
bg='#12232c'
fig,ax=plt.subplots(figsize=(12,11),facecolor=bg);ax.set_facecolor('#193948')
# Terrain schématique : bandes géographiques, non courbes de niveau calculées.
coast=P[:-1]*[1.18,1.12]+[0,20]
ax.add_patch(Polygon(coast,closed=True,facecolor='#434b48',edgecolor='#85a8a7',lw=2))
for factor,col in [(0.88,'#535852'),(0.67,'#60625a'),(0.46,'#68665d')]:
 ax.add_patch(Polygon(P[:-1]*factor+[0,85],closed=True,facecolor=col,edgecolor='#858378',lw=.7))
ax.add_patch(Polygon([[-280,50],[0,510],[310,100],[120,-180],[-150,-150]],facecolor='#383c3d',edgecolor='#aaa18b'))
ax.scatter([20],[170],marker='^',s=230,color='#cc8d71');ax.text(20,110,'CÔNE • 620 m',ha='center',weight='bold');ax.text(20,55,'Hors chaussée',ha='center',fontsize=10)
ax.text(-620,80,'BASALTE\nFalaises marines',ha='center',fontsize=10,color='#dfd5bb')
ax.text(430,-80,'VALLÉE\nvers le sud-est',ha='center',fontsize=10,color='#dfd5bb')
for a0,b0 in tunnels:
 ja,jb=int(a0/2),int(b0/2); mid=(ja+jb)//2
 ax.add_patch(Polygon([[x[ja]*.8,y[ja]*.8],[x[ja]*1.04,y[ja]*1.04],[x[mid]*1.075,y[mid]*1.075],[x[jb]*1.04,y[jb]*1.04],[x[jb]*.8,y[jb]*.8]],facecolor='#777169',edgecolor='#aaa18b',lw=1,zorder=3))
ax.text(-940,-590,'ATLANTIQUE',rotation=90,color='#a6cbd4',fontsize=16,weight='bold')
ax.plot(x,y,color='#162126',lw=13,zorder=4)
for i in range(6):
 m=(s>=cuts[i])&(s<=cuts[i+1]);ax.plot(x[m],y[m],color=colors[i],lw=5,zorder=5)
 mid=(cuts[i]+cuts[i+1])/2;j=int(mid/2)
 ax.annotate('',xy=(x[j+18],y[j+18]),xytext=(x[j-18],y[j-18]),arrowprops=dict(arrowstyle='-|>',color='white',lw=1.5),zorder=8)
 ax.text(x[j]*1.19,y[j]*1.19,str(i+1),ha='center',va='center',fontsize=15,weight='bold',bbox=dict(boxstyle='circle,pad=.3',fc=colors[i],ec='none'),color=bg,zorder=9)
for i,(a0,b0) in enumerate(tunnels):
 m=(s>=a0)&(s<=b0);ax.plot(x[m],y[m],color='white',lw=5,ls=(0,(2,2)),zorder=7)
 j=int((a0+b0)/4);ax.text(x[j]+45,y[j]-45,f'T{i+1}',fontsize=12,weight='bold',zorder=9)
ax.scatter([x[0]],[y[0]],s=160,marker='s',color='white',edgecolors=bg,zorder=10)
ax.text(x[0]-40,y[0]+75,'DÉPART / ARRIVÉE\n0 = 4 800 m • 12 m',fontsize=10,weight='bold',ha='center')
ax.plot([-180,140,140],[-740,-740,-690],color='#bbb19a',lw=4);ax.text(0,-795,'PORT • digue',ha='center',fontsize=10)
j=1425;ax.scatter([x[j]],[y[j]],marker='D',s=65,color='white',zorder=10);ax.text(x[j]-40,y[j]+65,'COL • 194 m\nPK 2 850',ha='center',fontsize=10)
ax.plot([-880,-630],[-820,-820],color='white',lw=3);ax.text(-755,-790,'250 m',ha='center',fontsize=10)
ax.annotate('N',xy=(850,810),xytext=(850,650),ha='center',arrowprops=dict(arrowstyle='->',color='white'),fontsize=16)
ax.set_aspect('equal');ax.set_xlim(-1050,1050);ax.set_ylim(-900,950)
ax.set_xlabel('Est (m)');ax.set_ylabel('Nord (m)');ax.grid(alpha=.1)
ax.set_title('VOLCANIC ISLAND  /  PLAN DE CONCEPTION\nBoucle horaire • mer à gauche • massif à droite',loc='left',fontsize=16,pad=22)
fig.text(.08,.025,'Trait élargi pour lecture. Relief schématique ; coordonnées de la route métriques.',fontsize=10,color='#b6c5c8')
fig.savefig(OUT/'plan-technique.svg',bbox_inches='tight');fig.savefig(OUT/'plan-technique.png',dpi=170,bbox_inches='tight');plt.close(fig)
fig,ax=plt.subplots(figsize=(15,4.4),facecolor=bg);ax.set_facecolor(bg)
for i in range(6):
 m=(s>=cuts[i])&(s<=cuts[i+1]);ax.fill_between(s[m],z[m],color=colors[i],alpha=.23);ax.plot(s[m],z[m],color=colors[i],lw=3);ax.text((cuts[i]+cuts[i+1])/2,218,str(i+1),ha='center',color=colors[i],weight='bold');ax.axvline(cuts[i],color='white',lw=.5,alpha=.2)
for i,(a0,b0) in enumerate(tunnels): ax.plot([a0,b0],[h(a0),h(b0)],color='white',ls=':',lw=4,label=f'T{i+1}')
ax.annotate('194 m • PK 2 850',xy=(2850,194),xytext=(3200,190),arrowprops=dict(arrowstyle='-',color='white'))
ax.set(xlim=(0,4800),ylim=(0,235),xlabel='Distance horizontale cumulée (m) — mêmes points que le plan',ylabel='Altitude (m)');ax.set_xticks([0,550,1400,2500,3050,4250,4800]);ax.grid(alpha=.15)
ax.set_title('PROFIL  /  +182 m puis −182 m • sommet routier distinct du cône de 620 m',loc='left',pad=15)
fig.tight_layout();fig.savefig(OUT/'profil-altimetrique.svg');fig.savefig(OUT/'profil-altimetrique.png',dpi=170);plt.close(fig)
print(json.dumps(report,indent=2))
