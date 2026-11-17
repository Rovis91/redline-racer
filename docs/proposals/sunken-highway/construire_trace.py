"""Dessin de préproduction uniquement. Repère métrique x Est / y Nord / z eau=0."""
from pathlib import Path
import json, csv
import numpy as np
from scipy.interpolate import CubicSpline
from scipy.optimize import root

OUT=Path(__file__).parent
P=np.array([[-600,-300],[-250,-300],[100,0],[450,300],[750,220],[780,-80],[500,-300],[100,-180],[-250,180],[-600,300],[-820,40],[-800,-200],[-600,-300]],float)
tt=np.r_[0,np.cumsum(np.linalg.norm(np.diff(P,axis=0),axis=1))]
tt/=tt[-1]
curve=CubicSpline(tt,P,bc_type='periodic')
u=np.linspace(0,1,50001)
xy=curve(u)
ss=np.r_[0,np.cumsum(np.linalg.norm(np.diff(xy,axis=0),axis=1))]
scale=4800/ss[-1]
P*=scale
curve=CubicSpline(tt,P,bc_type='periodic')
xy=curve(u)
ss=np.r_[0,np.cumsum(np.linalg.norm(np.diff(xy,axis=0),axis=1))]
s=np.linspace(0,4800,2401)
t=np.interp(s,ss,u)
xy=curve(t)
dv=curve(t,1); dd=curve(t,2)
k=(dv[:,0]*dd[:,1]-dv[:,1]*dd[:,0])/np.linalg.norm(dv,axis=1)**3

# Raccordements verticaux quintiques: pente et courbure nulles aux plateaux.
z=np.full_like(s,24.)
def transition(a,b,za,zb):
    sel=(s>=a)&(s<=b); q=(s[sel]-a)/(b-a)
    z[sel]=za+(zb-za)*(6*q**5-15*q**4+10*q**3)
transition(700,1400,24,32)
z[(s>=1400)&(s<=2200)]=32
transition(2200,3100,32,4)
z[(s>=3100)&(s<=3650)]=4
transition(3650,4550,4,24)
z[s>=4550]=24
names=['Périphérique surélevé','Quartier des échangeurs','Grand viaduc','Quartier submergé','Autoroute végétalisée']
bounds=[0,700,1400,2200,3650,4800]
sectors=np.minimum(np.searchsorted(bounds,s,side='right'),5)
crossings=[]
# Intersection des segments non voisins puis résolution sur la courbe analytique.
for i in range(len(s)-1):
    a=xy[i]; r=xy[i+1]-a
    j=np.arange(i+3,len(s)-1)
    if not len(j):continue
    b=xy[j]; v=xy[j+1]-b; q=b-a
    den=r[0]*v[:,1]-r[1]*v[:,0]
    with np.errstate(divide='ignore',invalid='ignore'):
        f=(q[:,0]*v[:,1]-q[:,1]*v[:,0])/den
        g=(q[:,0]*r[1]-q[:,1]*r[0])/den
    hits=j[(f>0)&(f<1)&(g>0)&(g<1)]
    for h in hits:
        sol=root(lambda vv:curve(vv[0])-curve(vv[1]),[t[i],t[h]])
        ts=sol.x; stations=np.interp(ts,u,ss); zz=np.interp(stations,s,z)
        d=curve(ts,1); angle=np.degrees(np.arccos(np.clip(abs(np.dot(d[0],d[1]))/np.prod(np.linalg.norm(d,axis=1)),-1,1)))
        crossings.append(dict(id='X1',xy_m=curve(ts[0]).tolist(),s_m=stations.tolist(),z_m=zz.tolist(),angle_deg=float(angle),deck_thickness_m=2.0,clearance_m=float(abs(zz[0]-zz[1])-2)))
length3d=float(np.sum(np.linalg.norm(np.diff(np.c_[xy,z],axis=0),axis=1)))
with (OUT/'trace.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.writer(f);w.writerow(['s_plan_m','x_est_m','y_nord_m','z_m','largeur_m','secteur','rayon_m'])
    for si,p,zi,sec,ki in zip(s,xy,z,sectors,k):w.writerow([round(si,3),*np.round(p,6),round(zi,6),18,int(sec),round(1/abs(ki),3) if abs(ki)>1e-9 else 'inf'])
data=dict(version='concept-1',coordinate_system='x east, y north, z relative to constant water plane 0 m',plan_length_m=4800,length_3d_m=length3d,width_m=18,deck_width_m=21,water_m=0,deck_thickness_m=2,low_deck_thickness_m=1,scale=scale,spline_type='periodic cubic, chord parameter, C2',knots=tt.tolist(),control_points_m=P.tolist(),sectors=[dict(id=i+1,name=n,start_m=bounds[i],end_m=bounds[i+1]) for i,n in enumerate(names)],vertical_controls=[[0,24],[700,24],[1400,32],[2200,32],[3100,4],[3650,4],[4550,24],[4800,24]],vertical_interpolation='quintic smoothstep 6q^5-15q^4+10q^3 between unequal heights; constant elsewhere',crossings=crossings,min_radius_m=float(1/max(abs(k))),max_grade_percent=float(max(abs(np.gradient(z,s)))*100),closure_gap_m=float(np.linalg.norm(xy[-1]-xy[0])),closure_tangent_error=float(np.linalg.norm(curve(1,1)-curve(0,1))),notes=['Road running surface width 18m; 1.5m structural margins on each side.','Only one active route; no branching racing junctions.','X1 columns excluded within 25m of lower-road centreline; 70m upper span reserved.','Deck low point +4m; underside +3m; no ford.'])
(OUT/'geometrie.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:data[k] for k in ['length_3d_m','min_radius_m','max_grade_percent','crossings','closure_gap_m']},indent=2))
