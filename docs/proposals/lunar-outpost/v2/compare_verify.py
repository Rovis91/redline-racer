from pathlib import Path
import json
import numpy as np
from shapely.geometry import LinearRing, Polygon
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

p=Path(__file__).parent
old=np.loadtxt(p.parent/'centreline.csv',delimiter=',',skiprows=1)
new=np.loadtxt(p/'centreline.csv',delimiter=',',skiprows=1)
g=json.loads((p/'geometry.json').read_text(encoding='utf-8'))
q=new[:,1:3];t=np.gradient(q,axis=0);t/=np.linalg.norm(t,axis=1)[:,None];n=np.c_[-t[:,1],t[:,0]]
# Use periodic centered tangents at the duplicate endpoint.
t0=q[1]-q[-2]; t0/=np.linalg.norm(t0);n[0]=n[-1]=[-t0[1],t0[0]]
left=q+11*n;right=q-11*n
r1,r2=LinearRing(left),LinearRing(right)
outer,inner=(left,right) if Polygon(left).area>Polygon(right).area else (right,left)
band=Polygon(outer,[inner])
report={'horizontal_m':float(np.linalg.norm(np.diff(q,axis=0),axis=1).sum()),'spatial_m':float(np.linalg.norm(np.diff(new[:,1:4],axis=0),axis=1).sum()),'closure_xyz_m':float(np.linalg.norm(new[-1,1:4]-new[0,1:4])),'axis_simple':LinearRing(q).is_simple,'edges_simple':r1.is_simple and r2.is_simple,'corridor_22m_valid':band.is_valid,'clockwise':not LinearRing(q).is_ccw,'grade_max':float(new[:,4].max()),'grade_min':float(new[:,4].min()),'radius_min_m':float(1/abs(new[:,5]).max()),'absolute_turning_v1_deg':float(np.trapezoid(abs(old[:,5]),old[:,0])*180/np.pi),'absolute_turning_v2_deg':float(np.trapezoid(abs(new[:,5]),new[:,0])*180/np.pi)}
assert report['axis_simple'] and report['edges_simple'] and report['corridor_22m_valid']
assert report['closure_xyz_m']<1e-6 and 3500<report['spatial_m']<5000
(p/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
fig,axs=plt.subplots(1,2,figsize=(16,7),facecolor='#10151c')
for ax,a,title,color in zip(axs,[old,new],['V1 · 4,40 km','V2 · 4,95 km'],['#75818c','#e5bb72']):
    ax.set_facecolor('#10151c');ax.plot(a[:,1],a[:,2],color=color,lw=4)
    ax.scatter(a[0,1],a[0,2],color='#eee9db',s=45,zorder=3)
    ax.set_aspect('equal');ax.set_xlim(-950,1000);ax.set_ylim(-700,650);ax.axis('off');ax.set_title(title,color='#eee9db',fontsize=22)
    for st in np.arange(300,a[-1,0],650):
        i=np.argmin(abs(a[:,0]-st));ax.annotate('',xy=a[i+10,1:3],xytext=a[i-10,1:3],arrowprops=dict(arrowstyle='-|>',lw=2,color='#eee9db'))
fig.text(.5,.04,'Même échelle · +550 m · liaison nord creusée · nouveau lobe sud · retour en S',ha='center',color='#eee9db',fontsize=13)
fig.savefig(p/'comparaison-v1-v2.png',dpi=150,bbox_inches='tight');plt.close(fig)
print(json.dumps(report,indent=2))
