from pathlib import Path
import json,numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon,Rectangle,Circle
from matplotlib.collections import LineCollection
from PIL import Image
from shapely.geometry import Point,LineString
D=Path(__file__).parent;a=np.loadtxt(D/'coordonnees.csv',delimiter=',',skiprows=1);s,x,y,h,w,r,g,z=a.T;xy=a[:,1:3]; colors=['#d9a32d','#dc6849','#a161a4','#247ca9','#218b7f'];names=['PORT / FRONT DE MER','ASCENSION DES FALAISES','VILLAGE PERCHÉ','ROUTE EN BALCON','DESCENTE CÔTIÈRE'];bs=[0,650,2000,2500,3100,s[-1]]
plt.rcParams.update({'font.family':'DejaVu Sans','text.color':'#1b3742','axes.labelcolor':'#1b3742','font.size':10,'svg.fonttype':'none'})
fig=plt.figure(figsize=(24,16),facecolor='#f4f0e7');fig.text(.035,.954,'AEGEAN CLIFFS',size=38,weight='bold');fig.text(.036,.925,'REDLINE RACER  /  CONCEPT DE CIRCUIT  /  CYCLADES IMAGINAIRES',size=12);fig.text(.54,.95,'4,32 km',size=27,weight='bold');fig.text(.67,.95,'+164 m',size=27,weight='bold');fig.text(.80,.95,'12–16 m',size=27,weight='bold');fig.text(.54,.926,'longueur sur route',size=10);fig.text(.67,.926,'dénivelé positif',size=10);fig.text(.80,.926,'largeur asphaltée',size=10)
ax=fig.add_axes([.035,.28,.49,.60]);ax.set_facecolor('#b8dce0');ax.set_aspect('equal');ax.set_xlim(-740,850);ax.set_ylim(-230,1200)
coast=np.array([[-650,190],[-630,500],[-500,770],[-270,1000],[0,1110],[280,1090],[540,1110],[760,960],[810,750],[740,520],[790,220],[610,-50],[310,-90],[180,-105],[60,-75],[-100,-110],[-410,-40]])
ax.add_patch(Polygon(coast,fc='#d6c7a5',ec='#f2dfb4',lw=5,zorder=1))
# Conceptual geological terraces, not surveyed contour lines.
for verts,col in [([[-430,500],[-260,840],[0,990],[470,1030],[690,870],[580,720],[290,700],[80,700],[-130,580]],'#b7ae89'),([[-220,780],[0,970],[480,1025],[610,920],[470,830],[100,830]],'#9d9e7e'),([[370,380],[690,470],[710,820],[580,800],[450,630],[220,540]],'#bda07e')]:ax.add_patch(Polygon(verts,fc=col,ec='none',zorder=2))
# Geological cliff hatches north, shoreline shelf south.
for xx in range(-150,650,35):ax.plot([xx,xx-12],[1070,1035],color='#8f8069',lw=1,zorder=3)
ax.plot([-100,-100,160,200],[-95,-170,-170,-130],color='#eee3ce',lw=7,zorder=3);ax.text(35,-150,'BASSIN ABRITÉ',fontsize=8,ha='center');ax.text(-510,1020,'MER ÉGÉE',size=14,color='#316d82',ha='center');ax.text(-510,980,'eaux profondes',size=9,color='#316d82',ha='center')
# Road has real metric width, shoulders + 2m each side.
segs=np.stack([xy[:-1],xy[1:]],axis=1); # linewidth convert metres into display points after equal-axis layout
fig.canvas.draw(); scale=ax.transData.transform((1,0))[0]-ax.transData.transform((0,0))[0]; factor=scale*72/fig.dpi
ax.add_collection(LineCollection(segs,colors='#eee8d9',linewidths=(w[:-1]+4)*factor,zorder=5));ax.add_collection(LineCollection(segs,colors='#384650',linewidths=w[:-1]*factor,zorder=6));ax.add_collection(LineCollection(segs,colors=[colors[int(v)-1] for v in z[:-1]],linewidths=2.1,zorder=7))
# Building footprints only outside a 20m road corridor; indicative blockout assets.
road=LineString(xy);rng=np.random.default_rng(8)
for cx,cy,n in [(350,940,38),(530,900,22),(180,-42,12)]:
 for j in range(n):
  xx=cx+rng.normal(0,68);yy=cy+rng.normal(0,30);ww=rng.uniform(9,18)
  if road.distance(Point(xx,yy))>25:ax.add_patch(Rectangle((xx,yy),ww,ww*.8,fc='#fffaf0',ec='#9a9b91',lw=.4,zorder=4))
ax.add_patch(Circle((435,1050),13,fc='#3464ad',ec='white',lw=2,zorder=4));ax.text(435,1130,'COUPOLE / REPÈRE HÉRO',fontsize=9,ha='center');ax.plot([435,435],[1110,1065],color='#54636a',lw=.7)
ax.plot(-100,1010,marker='*',markersize=13,color='#fffaf0',markeredgecolor='#59635e');ax.text(-110,1150,'MOULIN / CRÊTE',fontsize=9,ha='center')
ax.text(-180,460,'INTÉRIEUR SEC',fontsize=12,weight='bold',ha='center');ax.text(-180,420,'terrasses • maquis bas',fontsize=9,ha='center');ax.text(-180,385,'relief de fond schématique',fontsize=8,ha='center',style='italic')
# Start perpendicular to tangent.
v=xy[1]-xy[0];v=v/np.linalg.norm(v);n=np.array([-v[1],v[0]])
ax.plot([-n[0]*14,n[0]*14],[-n[1]*14,n[1]*14],color='white',lw=5,zorder=9);ax.plot([-n[0]*14,n[0]*14],[-n[1]*14,n[1]*14],color='#192f37',lw=2,ls=':',zorder=10);ax.annotate('DÉPART / ARRIVÉE\nPK 0 • altitude 8 m',xy=(0,0),xytext=(-320,-175),arrowprops={'arrowstyle':'-','color':'#39525c'},fontsize=10,weight='bold')
for ss in [350,920,1450,2100,2800,3400,3950]:
 j=np.argmin(abs(s-ss));ax.annotate('',xy=xy[j+18],xytext=xy[j-18],arrowprops={'arrowstyle':'-|>','color':'white','lw':1.8,'mutation_scale':13},zorder=10)
for idx,ss,off,txt in [(0,450,(60,-10),'01  PORT'),(1,1500,(30,80),'02  ASCENSION'),(2,2250,(-200,-120),'03  VILLAGE'),(3,2800,(-200,-60),'04  BALCON'),(4,3550,(80,0),'05  DESCENTE')]:
 j=np.argmin(abs(s-ss));ax.annotate(txt,xy=xy[j],xytext=xy[j]+off,color=colors[idx],weight='bold',fontsize=11,arrowprops={'arrowstyle':'-','color':colors[idx]},bbox={'fc':'#f4f0e7','ec':'none','pad':3},zorder=12)
for ss,txt,off in [(785,'A · R ≈ 97 m',(-150,-70)),(1297,'B · R ≈ 48 m',(-210,0)),(1891,'C · R ≈ 73 m',(-220,0)),(2527,'D · R ≈ 124 m',(70,-160))]:
 j=np.argmin(abs(s-ss));ax.annotate(txt,xy=xy[j],xytext=xy[j]+off,fontsize=9,arrowprops={'arrowstyle':'-','color':'#516169'},bbox={'fc':'#f4f0e7','ec':'none','pad':2},zorder=11)
ax.annotate('N',xy=(-660,1120),xytext=(-660,1020),ha='center',weight='bold',arrowprops={'arrowstyle':'-|>','lw':1.6});ax.plot([500,700],[-170,-170],color='#1b3742',lw=3);ax.text(600,-215,'200 m',ha='center',fontsize=9);ax.set_xticks(np.arange(-600,801,200));ax.set_yticks(np.arange(0,1201,200));ax.tick_params(labelsize=8,colors='#63747a');ax.grid(alpha=.12);ax.set_xlabel('X est (m) — axes à la même échelle');ax.set_ylabel('Y nord (m)');ax.set_title('01 / PLAN MÉTRIQUE   •   sens antihoraire   •   une boucle, aucune branche',loc='left',fontsize=12,pad=15)
# Profile shares exact chainage with map.
pax=fig.add_axes([.055,.105,.46,.125]);pax.set_facecolor('#f4f0e7');pax.fill_between(s,h,0,color='#d9d5c4');
for i in range(5):
 m=z==i+1;pax.plot(s[m],h[m],color=colors[i],lw=3);pax.axvline(bs[i],color='#a8afab',lw=.6);pax.text((bs[i]+bs[i+1])/2,188,f'0{i+1}',color=colors[i],ha='center',weight='bold')
pax.set_xlim(0,s[-1]);pax.set_ylim(0,205);pax.set_yticks([0,50,100,150,200]);pax.grid(alpha=.2);pax.set_xlabel('Chaînage horizontal (m)');pax.set_ylabel('Altitude (m)');pax.set_title('02 / PROFIL CORRESPONDANT   •   pentes : +12,6 % / −14,7 %',loc='left',fontsize=11);pax.tick_params(labelsize=8)
fig.text(.035,.047,'Géométrie calculée : 4 300 m en plan / 4 318 m en 3D. Altitudes de conception : 8–172 m.',fontsize=10);fig.text(.035,.029,'Axe et bords vérifiés séparément. Relief et implantation : intentions de préproduction, pas un relevé réel.',fontsize=9)
# Right zone moodboard, ten images from generated contact sheet.
im=np.array(Image.open(D/'moodboard.png'));H,W=im.shape[:2]
texts=[('0–650 m · 16 m · 8 → 20 m','Accélération et dépassement. Quai, caïques, hangar blanc.'),('650–2 000 m · 15–16 m · 20 → 161 m','Deux retournements espacés ; freinage C avant le village.'),('2 000–2 500 m · 15 → 12 m · 161 → 172 m','Précision sur desserte incurvée. Coupole, cubes et terrasses.'),('2 500–3 100 m · 12 → 14 m · 172 → 135 m','Enchaînement panoramique. Moulin et parapet continu.'),('3 100–4 300 m · 14 → 16 m · 135 → 8 m','Relance en visibilité. Maquis sec, crique, retour au quai.')]
fig.text(.56,.889,'03 / AMBIANCES PAR ZONE',size=12,weight='bold');fig.text(.56,.871,'Inspirations synthétiques à gauche • intentions gameplay low-poly à droite',size=9)
for i in range(5):
 top=.85-i*.158
 fig.text(.56,top,f'0{i+1}  {names[i]}',size=12,weight='bold',color=colors[i]);fig.text(.96,top,texts[i][0],size=9,ha='right')
 for col in range(2):
  ia=fig.add_axes([.56+col*.205,top-.115,.198,.106]);ia.imshow(im[round(i*H/5):round((i+1)*H/5),round(col*W/2):round((col+1)*W/2)]);ia.set_axis_off()
 fig.text(.56,top-.135,texts[i][1],size=9)
fig.text(.56,.029,'Images générées : ni photographies documentaires, ni captures du jeu. La carte fait foi.',size=9)
fig.savefig(D/'AEGEAN_CLIFFS-planche.png',dpi=160,facecolor=fig.get_facecolor());fig.savefig(D/'AEGEAN_CLIFFS-planche.svg',facecolor=fig.get_facecolor());
# Standalone exact plan and profile via crops of figure saved as vector.
fig.savefig(D/'plan-metrique.svg',bbox_inches=ax.get_tightbbox(fig.canvas.get_renderer()).transformed(fig.dpi_scale_trans.inverted()).expanded(1.03,1.03));fig.savefig(D/'profil-altimetrique.svg',bbox_inches=pax.get_tightbbox(fig.canvas.get_renderer()).transformed(fig.dpi_scale_trans.inverted()).expanded(1.03,1.08))
Image.open(D/'AEGEAN_CLIFFS-planche.png').resize((1920,1280)).save(D/'apercu.png')
print('Planche, plan SVG et profil SVG enregistrés.')

