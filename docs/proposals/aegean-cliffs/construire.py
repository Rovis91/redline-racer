from pathlib import Path
import numpy as np, json
from scipy.interpolate import CubicSpline, PchipInterpolator
from shapely.geometry import LineString
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
D=Path(__file__).parent
p=np.array([[0,0],[260,0],[470,100],[530,250],[430,340],[240,395],[210,470],[370,535],[560,600],[610,710],[490,810],[300,830],[130,770],[-30,820],[-190,770],[-360,620],[-450,410],[-430,210],[-290,70],[0,0]],float)
t=np.r_[0,np.cumsum(np.linalg.norm(np.diff(p,axis=0),axis=1))]
c=CubicSpline(t,p,bc_type='periodic'); u=np.linspace(0,t[-1],20001); q=c(u); length=np.linalg.norm(np.diff(q,axis=0),axis=1).sum(); p*=4300/length;t=np.r_[0,np.cumsum(np.linalg.norm(np.diff(p,axis=0),axis=1))];c=CubicSpline(t,p,bc_type='periodic');u=np.linspace(0,t[-1],40001);q=c(u);s=np.r_[0,np.cumsum(np.linalg.norm(np.diff(q,axis=0),axis=1))];L=s[-1]
# Chainage horizontal determines ALL elevation, width and zone attributes.
sk=np.array([0,450,650,950,1300,1650,1900,2200,2500,2800,3100,3500,3900,4150,L]);hk=np.array([8,8,20,52,90,132,155,168,172,163,135,82,28,8,8]);h=PchipInterpolator(sk,hk);wk=np.array([0,650,800,2000,2150,2450,2600,3100,3300,4100,L]);wv=np.array([16,16,15,15,12,12,14,14,16,16,16]);w=PchipInterpolator(wk,wv)
ss=np.r_[np.arange(0,L,2),L];uu=np.interp(ss,s,u);xy=c(uu);z=h(ss);d=c(uu,1);dd=c(uu,2);k=(d[:,0]*dd[:,1]-d[:,1]*dd[:,0])/np.linalg.norm(d,axis=1)**3;r=1/np.maximum(abs(k),1e-12);bounds=[0,650,2000,2500,3100,L];names=['Port','Ascension','Village','Balcon','Descente'];colors=['#deaa39','#e4714e','#b26fb1','#257fba','#27998c'];zi=np.minimum(np.searchsorted(bounds,ss,side='right')-1,4)
arr=np.c_[ss,xy,z,w(ss),r,h.derivative()(ss)*100,zi+1];np.savetxt(D/'coordonnees.csv',arr,delimiter=',',header='s_horizontal_m,x_est_m,y_nord_m,altitude_m,largeur_m,rayon_m,pente_pct,secteur',comments='',fmt='%.6f')
report={'length_horizontal_m':L,'length_3d_m':float(np.linalg.norm(np.diff(np.c_[xy,z],axis=0),axis=1).sum()),'alt_min_m':float(z.min()),'alt_max_m':float(z.max()),'ascent_m':float(np.maximum(np.diff(z),0).sum()),'grade_min_pct':float(arr[:,6].min()),'grade_max_pct':float(arr[:,6].max()),'radius_min_m':float(r.min()),'closure_m':float(np.linalg.norm(xy[-1]-xy[0])),'simple_centerline':LineString(xy).is_simple,'road_buffer_valid':LineString(xy).buffer(8).is_valid,'sectors':[]}
for i,n in enumerate(names):
 m=zi==i;report['sectors'].append({'name':n,'start_m':bounds[i],'end_m':bounds[i+1],'min_radius_m':float(r[m].min()),'alt_start_m':float(h(bounds[i])),'alt_end_m':float(h(bounds[i+1]))})
(D/'geometrie.json').write_text(json.dumps({'coordinate_system':'metres; x east, y north; sea=0; fictional design dimensions','control_points_xy':p.tolist(),'parameter_knots':t.tolist(),'spline':'scipy CubicSpline periodic, chord parameter','elevation_knots_s_h':list(map(list,zip(sk.tolist(),hk.tolist()))),'width_knots_s_w':list(map(list,zip(wk.tolist(),wv.tolist()))),'interpolation_altitude_width':'PCHIP','report':report},indent=2))
(D/'mesures.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
fig,ax=plt.subplots(figsize=(10,10));ax.plot(xy[:,0],xy[:,1],color='gray');
for i in range(5):
 m=zi==i;ax.plot(xy[m,0],xy[m,1],color=colors[i],lw=3,label=names[i])
for j in range(0,len(ss),125):ax.text(*xy[j],f'{ss[j]:.0f}',fontsize=8)
ax.set_aspect('equal');ax.legend();ax.grid();fig.savefig(D/'brouillon-geometrie.png',dpi=120)

