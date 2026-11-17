import numpy as np
from scipy.interpolate import CubicSpline
from shapely.geometry import LinearRing
import matplotlib.pyplot as plt
P=np.array([[-520,-300],[-740,-190],[-830,40],[-760,290],[-540,420],[-320,350],[-210,160],[-40,170],[50,370],[240,510],[500,460],[710,300],[770,50],[650,-120],[550,-260],[530,-420],[410,-580],[180,-600],[50,-430],[-110,-390],[-270,-500],[-440,-490],[-520,-300]],float)
t=np.r_[0,np.cumsum(np.linalg.norm(np.diff(P,axis=0),axis=1))]; f=CubicSpline(t,P,bc_type='periodic');u=np.linspace(0,t[-1],20001);q=f(u);factor=4950/np.linalg.norm(np.diff(q,axis=0),axis=1).sum();P*=factor;f=CubicSpline(t,P,bc_type='periodic');q=f(u);d=f(u,1);dd=f(u,2);k=(d[:,0]*dd[:,1]-d[:,1]*dd[:,0])/np.linalg.norm(d,axis=1)**3;s=np.r_[0,np.cumsum(np.linalg.norm(np.diff(q,axis=0),axis=1))]
print('factor',factor,'minradius',1/max(abs(k)),'signs',sum(np.sign(k[1:])!=np.sign(k[:-1])),'simple',LinearRing(q).is_simple)
for st in [0,500,1250,2100,3250,4000,4500,4700,4950]:print(st,np.interp(st,s,q[:,0]),np.interp(st,s,q[:,1]))
fig,ax=plt.subplots(figsize=(11,8));ax.plot(*q.T);ax.scatter(*P.T);ax.set_aspect('equal');
for st in range(0,4950,250):ax.text(np.interp(st,s,q[:,0]),np.interp(st,s,q[:,1]),str(st),fontsize=8)
fig.savefig(__file__.replace('explore.py','candidate.png'))
