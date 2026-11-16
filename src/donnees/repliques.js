// Répliques supplémentaires des rivaux à la radio (les premières, par rival, sont dans PIQUES de game.js). Chargé avant game.js, ou par require() sous node (tests/test-repliques.js).
// Une réplique = [français, anglais] : capitales sans accents, 30 signes au plus (la ligne tient dans l'écran avec le prénom). Le test vérifie la forme.
//   rival[k] : { grille, double, passe } en plus de PIQUES, par caractère (0 la référence, 1 la tête brûlée, 2 la recrue) ; double = on le double, passe = il nous double
//   evt : événements que le moteur connaît déjà, dits par un rival au hasard : choc (mur), bump (contact voiture), nitro, tete / queue (joueur premier / dernier au passage de ligne),
//         dernier (dernier tour), dernierTete, dernierQueue, sale (voiture très sale), serre (un rival colle le joueur plus de 4 s)
//   carte[id] : une réplique qui évoque le décor, dite une fois vers 20 s de course puis à chaque passage de ligne
(function (G) {
  const rival = [
    { grille: [['TU VAS REGRETTER LA POLE.', 'YOU WILL MISS THE POLE.'], ['JE CONNAIS CHAQUE VIRAGE.', 'I KNOW EVERY CORNER.'], ['RESTE DANS MON SILLAGE.', 'STAY IN MY SLIPSTREAM.']],
      double: [['TU ES RAPIDE. PAS ASSEZ.', "YOU'RE FAST. NOT ENOUGH."], ['UN TOUR, PAS PLUS.', 'ONE LAP, NO MORE.'], ["JE TE LAISSE L'ILLUSION.", "I'LL LET YOU DREAM."]],
      passe: [['TOUT EST SOUS CONTROLE.', 'ALL UNDER CONTROL.'], ['TU AS VU MA TRAJECTOIRE ?', 'DID YOU SEE MY LINE ?'], ['REGARDE ET APPRENDS.', 'WATCH AND LEARN.']] },
    { grille: [['ON FREINE APRES LA LIGNE !', 'BRAKE AFTER THE LINE !'], ["PREMIER A LA CORDE, PREMIER !", 'FIRST TO THE APEX WINS !'], ['JE PARS COMME UNE BALLE !', "I'M GONNA FLY !"]],
      double: [['OH, TU VEUX JOUER ?!', 'OH, YOU WANT TO PLAY ?!'], ['CE VIRAGE EST A MOI !', 'THAT CORNER IS MINE !'], ['ATTENDS-MOI, JE VIENS !', "WAIT, I'M COMING !"]],
      passe: [['SALUE MES FEUX ARRIERE !', 'SAY HI TO MY TAILLIGHTS !'], ['TROP FACILE !', 'TOO EASY !'], ["T'AS RIEN VU PASSER !", 'YOU SAW NOTHING !']] },
    { grille: [["J'AI OUBLIE MES GANTS...", 'I FORGOT MY GLOVES...'], ['ON PEUT RECOMMENCER ?', 'CAN WE START OVER ?'], ["JE SUIS PRET. JE CROIS.", "I'M READY. I THINK."]],
      double: [['TU ES TROP FORT POUR MOI !', "YOU'RE TOO GOOD FOR ME !"], ['JE SUIS DERRIERE TOI !', "I'M RIGHT BEHIND YOU !"], ['JE VAIS COPIER TA LIGNE.', "I'LL COPY YOUR LINE."]],
      passe: [["C'EST MOI QUI PASSE ?!", 'AM I THE ONE PASSING ?!'], ["JE DOUBLE ! C'EST DINGUE !", "I'M OVERTAKING ! WOW !"], ['NE ME REGARDE PAS COMME CA.', "DON'T LOOK AT ME LIKE THAT."]] },
  ];
  const evt = {
    choc: [['AIE, CA A SONNE !', 'OUCH, THAT RANG !'], ['LE MUR NE CEDE PAS.', "THE WALL WON'T MOVE."], ['TU AS GOUTE LE BETON ?', 'HOW DOES CONCRETE TASTE ?'], ['REGARDE OU TU VAS !', 'WATCH WHERE YOU GO !']],
    bump: [['PAS DE CONTACT, PAS DE JEU.', 'NO CONTACT, NO GAME.'], ["TU M'AS TOUCHE !", 'YOU TOUCHED ME !'], ['OH ! MA PEINTURE !', 'HEY ! MY PAINT !'], ['ON SE RETROUVE APRES.', 'SEE YOU AFTER THIS.']],
    nitro: [['TU AS ALLUME LA NITRO !', 'YOU HIT THE NITRO !'], ['ELLE EST OU, LA MIENNE ?', 'WHERE IS MINE ?'], ['CA SENT LE KEROSENE !', 'SMELLS LIKE JET FUEL !'], ['ECONOMISE-LA UN PEU !', 'SAVE SOME FOR LATER !']],
    tete: [['TU MENES. ON VERRA.', "YOU LEAD. WE'LL SEE."], ['PREMIER ? DEJA ?', 'FIRST ? ALREADY ?'], ['GARDE-LA, CETTE PLACE.', 'KEEP THAT SPOT.'], ["ON T'ATTEND AU VIRAGE.", "WE'LL GET YOU AT THE TURN."]],
    queue: [['TU ES DERNIER, PILOTE.', "YOU'RE LAST, DRIVER."], ["ON T'A PERDU DE VUE !", 'WE LOST SIGHT OF YOU !'], ['LE PELOTON EST LOIN.', 'THE PACK IS FAR.'], ['REVEILLE-TOI UN PEU !', 'WAKE UP A LITTLE !']],
    dernier: [['DERNIER TOUR !', 'LAST LAP !'], ['ON Y EST. TOUT SE JOUE.', "HERE WE GO. IT'S ON."], ["UN TOUR ET C'EST FINI.", 'ONE LAP AND IT IS OVER.'], ['PLUS DE CALCULS !', 'NO MORE CALCULATING !']],
    dernierTete: [['DERNIER TOUR, TU MENES !', 'LAST LAP, YOU LEAD !'], ['TIENS-LE UN TOUR !', 'HOLD IT ONE MORE LAP !'], ['JE VAIS TE PRESSER.', 'I WILL PUSH YOU.'], ['PAS DE FAUTE, MAINTENANT !', 'NO MISTAKES NOW !']],
    dernierQueue: [['DERNIER, DERNIER TOUR.', 'LAST PLACE, LAST LAP.'], ['IL TE RESTE UN TOUR.', 'YOU HAVE ONE LAP LEFT.'], ['UN MIRACLE, PEUT-ETRE ?', 'A MIRACLE, MAYBE ?'], ['TOUT DONNER, MAINTENANT !', 'GIVE EVERYTHING NOW !']],
    sale: [['TA VOITURE EST CRASSEUSE !', 'YOUR CAR IS FILTHY !'], ['ON NE VOIT PLUS TA COULEUR.', "CAN'T SEE YOUR COLOR."], ['UN LAVAGE ? PAS CE SOIR.', 'A WASH ? NOT TONIGHT.'], ['TU ROULES DANS LA BOUE ?', 'DRIVING THROUGH MUD ?']],
    serre: [['JE SUIS COLLE A TOI.', "I'M GLUED TO YOU."], ['ON EST COTE A COTE !', "WE'RE SIDE BY SIDE !"], ['TU SENS MON SOUFFLE ?', 'FEEL MY BREATH ?'], ["PAS UN CENTIMETRE D'ECART.", 'NOT AN INCH BETWEEN US.']],
  };
  const carte = {
    ville: [['LES NEONS FILENT, SUIS-LES.', 'NEONS FLY BY, FOLLOW.'], ['LE TUNNEL AVALE LE BRUIT.', 'THE TUNNEL EATS SOUND.'], ['ET CETTE PLUIE SUR LA ROUTE !', 'THIS RAIN ON THE ROAD !'], ['LA VILLE NE DORT JAMAIS.', 'THE CITY NEVER SLEEPS.']],
    touge: [['LES EPINGLES SONT PIEGEUSES.', 'THE HAIRPINS ARE TRICKY.'], ['LES SAPINS DEFILENT !', 'PINES FLYING BY !'], ['LA CRETE APPROCHE.', 'THE RIDGE IS NEAR.'], ['PAS DE GLISSADE DANS LE VIDE.', "DON'T SLIDE OFF THE EDGE."]],
    wangan: [['LA CORNE DE BRUME RESONNE.', 'THE FOGHORN ECHOES.'], ['LES CONTENEURS DEFILENT !', 'CONTAINERS FLYING BY !'], ['LE PONT EST DROIT. VAS-Y !', 'THE BRIDGE IS STRAIGHT. GO !'], ['LE PHARE NOUS GUETTE.', 'THE LIGHTHOUSE WATCHES.']],
    paris: [['LES PAVES GLISSENT !', 'THE COBBLES ARE SLIPPERY !'], ['PREMIER METRO, DERNIER TOUR ?', 'FIRST TRAIN, LAST LAP ?'], ['LA PLACE EST TOUTE A NOUS.', 'THE SQUARE IS OURS.'], ['LA TOUR EIFFEL NOUS REGARDE.', 'THE TOWER IS WATCHING.']],
    canal: [['CA SENT LA VASE ET LE FER.', 'SMELLS OF MUD AND IRON.'], ['ATTENTION A LA PENICHE !', 'WATCH OUT FOR THE BARGE !'], ['LES QUAIS SONT ETROITS.', 'THE QUAYS ARE NARROW.'], ["L'ECLUSE NE PARDONNE PAS.", "THE LOCK DOESN'T FORGIVE."]],
    stade: [['ECOUTE LA FOULE !', 'LISTEN TO THE CROWD !'], ['LES TRIBUNES SONT EN FEU !', 'THE STANDS ARE ON FIRE !'], ["L'ARENE EST COMPLETE !", 'THE ARENA IS SOLD OUT !'], ['ILS CHANTENT TON NOM ? NON.', 'SINGING YOUR NAME ? NO.']],
    givre: [['LE VERGLAS COLLE AUX ROUES !', 'ICE CLINGS TO THE WHEELS !'], ['MES PHARES MANGENT LA NEIGE.', 'MY LIGHTS EAT THE SNOW.'], ['ATTENTION AUX PLAQUES !', 'WATCH FOR ICE PATCHES !'], ['UN FROID A FENDRE LES PNEUS.', 'COLD ENOUGH TO CRACK TIRES.']],
    terre: [['LA POUSSIERE ME SUFFOQUE !', 'DUST IS CHOKING ME !'], ['LES OCRES SONT BELLES ICI.', 'THE OCHRES ARE LOVELY.'], ["DU CAILLOU ET DE L'ADHERENCE.", 'ROCKS AND GRIP.'], ['PAS DE CADEAU ICI.', 'NO GIFTS HERE.']],
    perse: [['CES COLONNES ONT VU PIRE.', 'THESE COLUMNS SAW WORSE.'], ['LE SABLE VOLE SUR LA ROUTE.', 'SAND BLOWS ON THE ROAD.'], ['UNE ROUTE DE ROI !', 'A ROAD FIT FOR A KING !'], ['LE PALAIS EST TOUT PRES.', 'THE PALACE IS CLOSE.']],
    barrage: [['LE BETON TREMBLE SOUS NOUS.', 'THE CONCRETE SHAKES UNDER US.'], ['LA VIDANGE GRONDE EN BAS !', 'THE RELEASE ROARS BELOW !'], ["L'EAU MONTE DERRIERE LE MUR.", 'WATER RISES BEHIND THE WALL.'], ['NE TOMBE PAS DE LA DIGUE !', "DON'T FALL OFF THE DAM !"]],
    chapada: [['LE CANYON AVALE NOS MOTEURS.', 'THE CANYON SWALLOWS US.'], ['CETTE ROUTE EST UN MANUSCRIT.', 'THIS ROAD IS A MANUSCRIPT.'], ['LA ROCHE ROUGE EST BRULANTE.', 'THE RED ROCK IS BURNING.'], ['ON ROULE SUR UNE LEGENDE.', "WE'RE DRIVING ON A LEGEND."]],
    plage: [['LE SABLE ENVAHIT TOUT !', 'SAND GETS EVERYWHERE !'], ['LES VAGUES COUVRENT LE BRUIT.', 'WAVES DROWN THE NOISE.'], ["LES PARASOLS S'ENVOLENT !", 'THE UMBRELLAS FLY AWAY !'], ["PLAYA 307, C'EST LE PARADIS.", 'PLAYA 307 IS PARADISE.']],
  };
  // une réplique de la liste, de préférence pas encore dite dans cette course (dits : Set rempli ici ; la liste entière redevient permise quand elle est épuisée)
  const choisis = (liste, dits) => { let L = liste.filter(l => !dits.has(l)); if (!L.length) { liste.forEach(l => dits.delete(l)); L = liste; } const l = L[Math.random() * L.length | 0]; dits.add(l); return l; };
  G.REPL = { rival, evt, carte, choisis };
})(typeof window !== 'undefined' ? window : globalThis);
