"""Mise en page déterministe des schémas et du moodboard original non retouché."""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from matplotlib.patches import Rectangle
P=Path(__file__).parent
bg='#12232c'; fg='#e8e4d9'; muted='#afc2c8'
plt.rcParams.update({'font.family':'DejaVu Sans','text.color':fg,'svg.fonttype':'none'})
fig=plt.figure(figsize=(24,15),facecolor=bg)
fig.text(.035,.955,'VOLCANIC ISLAND',fontsize=35,weight='bold')
fig.text(.035,.922,'LA GRANDE CORNICHE NOIRE  /  PROPOSITION DE CIRCUIT',fontsize=13,color=muted)
fig.text(.965,.954,'4,819 km   /   +182 m   /   6 secteurs',ha='right',fontsize=20,color='#e9c77b')
fig.text(.965,.924,'Boucle horaire • 14 m de chaussée • rayon minimal 142 m',ha='right',fontsize=12,color=muted)
def image_at(file,box):
 ax=fig.add_axes(box);ax.imshow(mpimg.imread(P/file));ax.axis('off')
image_at('plan-technique.png',[.02,.22,.47,.68])
image_at('profil-altimetrique.png',[.025,.035,.465,.18])
fig.text(.52,.88,'SIX VUES DE CONDUITE  /  INTENTIONS PS1–SATURN',fontsize=16,weight='bold')
image_at('moodboard.png',[.52,.418,.455,.45])
colors=['#e9c77b','#66b8cf','#da9262','#d66f65','#a9bb83','#b3a1cf']
caps=[('01  PORT VOLCANIQUE','0–550 m  •  12 → 15 m','Accélérer ; le port laisse place au basalte.'),('02  FALAISES DE BASALTE','550–1 400 m  •  15 → 79 m','Grand appui droit au-dessus de l’Atlantique.'),('03  MONTÉE DU VOLCAN','1 400–2 500 m  •  79 → 183 m','Deux éperons traversés : T1 200 m / T2 140 m.'),('04  CRÊTE VOLCANIQUE','2 500–3 050 m  •  col à 194 m','Révélation du cône ; scories et vapeur discrète.'),('05  DESCENTE DES VILLAGES','3 050–4 250 m  •  183 → 25 m','Droite–gauche–droite ; freiner avant l’appui.'),('06  RETOUR LITTORAL','4 250–4 800 m  •  25 → 12 m','La courbe s’ouvre, le port revient, relance nitro.')]
for i,(title,pk,desc) in enumerate(caps):
 xx=.525+(i%2)*.232; yy=.395-(i//2)*.084
 fig.text(xx,yy,title,fontsize=13,weight='bold',color=colors[i]);fig.text(xx,yy-.021,pk,fontsize=11);fig.text(xx,yy-.041,desc,fontsize=9.5,color=muted)
fig.text(.525,.135,'ASSETS  /  cône · basalte · port · tunnels · maisons · soutènements',fontsize=11,weight='bold')
fig.text(.525,.108,'Océan et géologie dominants. Végétation ponctuelle. Aucune lave liquide.',fontsize=11,color=muted)
fig.text(.525,.077,'Axe fermé sans croisement ; plan et profil issus des mêmes données.',fontsize=10)
fig.text(.525,.054,'Images d’ambiance générées, pas des captures du jeu. Conduite à tester en maquette.',fontsize=9,color=muted)
fig.savefig(P/'VOLCANIC_ISLAND-planche.png',dpi=160,facecolor=bg)
fig.savefig(P/'VOLCANIC_ISLAND-planche.svg',facecolor=bg)
print(P/'VOLCANIC_ISLAND-planche.png')
