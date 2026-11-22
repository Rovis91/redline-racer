// Script inventory: shared engine, explicit borrowed catalogues, then the selected circuit. Keep lists in dependency order.
(function (G) {
  G.GAME_ASSETS = {
    "core": [
      "vendor/three/three.classic.js",
      "src/data/maps.js",
      "src/data/menu-cards.js",
      "src/data/gold-laps.js",
      "src/data/taunts.js",
      "src/engine/sim.js",
      "src/engine/session.js",
      "src/audio/samples.js",
      "src/audio/instruments.js",
      "src/audio/audio.js",
      "src/render/textures.js",
      "src/render/shapes.js",
      "src/render/textures-cars.js",
      "src/render/shapes-cars.js",
      "src/render/scenery.js",
      "src/render/crowd.js",
      "src/engine/lang.js",
      "src/engine/devices.js",
      "src/engine/network.js"
    ],
    "maps": {
      "paris": [
        "src/maps/paris/textures-paris.js",
        "src/maps/paris/shapes-paris.js",
        "src/maps/paris/scenery-paris.js"
      ],
      "canal": [
        "src/maps/canal/textures-canal.js",
        "src/maps/canal/shapes-canal.js",
        "src/maps/canal/scenery-canal.js"
      ],
      "stade": [
        "src/maps/stade/textures-stade.js",
        "src/maps/stade/shapes-stade.js",
        "src/maps/stade/scenery-stade.js"
      ],
      "givre": [
        "src/maps/givre/textures-givre.js",
        "src/maps/givre/shapes-givre.js",
        "src/maps/givre/scenery-givre.js"
      ],
      "terre": [
        "src/maps/terre/textures-terre.js",
        "src/maps/terre/shapes-terre.js",
        "src/maps/terre/scenery-terre.js"
      ],
      "touge": [
        "src/maps/touge/textures-touge.js",
        "src/maps/touge/shapes-touge.js",
        "src/maps/touge/scenery-touge.js"
      ],
      "wangan": [
        "src/maps/wangan/textures-wangan.js",
        "src/maps/wangan/shapes-wangan.js",
        "src/maps/wangan/scenery-wangan.js"
      ],
      "barrage": [
        "src/maps/barrage/textures-barrage.js",
        "src/maps/barrage/shapes-barrage.js",
        "src/maps/barrage/scenery-barrage.js"
      ],
      "perse": [
        "src/maps/perse/textures-perse.js",
        "src/maps/perse/shapes-perse.js",
        "src/maps/perse/scenery-perse.js"
      ],
      "chapada": [
        "src/maps/chapada/textures-chapada.js",
        "src/maps/chapada/shapes-chapada.js",
        "src/maps/chapada/scenery-chapada.js"
      ],
      "volcan": [
        "src/maps/volcan/textures-volcan.js",
        "src/maps/volcan/textures-volcan-route.js",
        "src/maps/volcan/shapes-volcan-roche.js",
        "src/maps/volcan/shapes-volcan-bati.js",
        "src/maps/volcan/shapes-volcan-port.js",
        "src/maps/volcan/shapes-volcan-rural.js",
        "src/maps/volcan/shapes-volcan-expedition.js",
        "src/maps/volcan/relief-volcan.js",
        "src/maps/volcan/scenery-volcan.js",
        "src/maps/volcan/scenery-volcan-port.js",
        "src/maps/volcan/scenery-volcan-village.js",
        "src/maps/volcan/scenery-volcan-fermes.js",
        "src/maps/volcan/scenery-volcan-falaises.js",
        "src/maps/volcan/scenery-volcan-cratere.js",
        "src/maps/volcan/scenery-volcan-descente.js",
        "src/maps/volcan/scenery-volcan-cote.js",
        "src/maps/volcan/scenery-volcan-vie.js"
      ],
      "plage": [
        "src/maps/plage/textures-plage.js",
        "src/maps/plage/shapes-plage.js",
        "src/maps/plage/scenery-plage.js"
      ],
      "ville": [
        "src/maps/ville/shapes-ville.js",
        "src/maps/ville/scenery-ville.js"
      ],
      "area51": [
        "src/maps/area51/textures-area51.js",
        "src/maps/area51/textures-area51-route.js",
        "src/maps/area51/shapes-area51-relief.js",
        "src/maps/area51/shapes-area51-hall.js",
        "src/maps/area51/shapes-area51-avion.js",
        "src/maps/area51/shapes-area51-dish.js",
        "src/maps/area51/shapes-area51-airfield.js",
        "src/maps/area51/shapes-area51-souterrain.js",
        "src/maps/area51/shapes-area51-perimetre.js",
        "src/maps/area51/shapes-area51-radio.js",
        "src/maps/area51/shapes-area51-desert.js",
        "src/maps/area51/scenery-area51.js",
        "src/maps/area51/scenery-area51-pistes.js",
        "src/maps/area51/scenery-area51-hangar.js",
        "src/maps/area51/scenery-area51-bunker.js",
        "src/maps/area51/scenery-area51-antennes.js",
        "src/maps/area51/scenery-area51-collines.js",
        "src/maps/area51/scenery-area51-desert.js",
        "src/maps/area51/scenery-area51-vie.js"
      ],
      "piliers": [
        "src/maps/piliers/textures-piliers.js",
        "src/maps/piliers/textures-piliers-route.js",
        "src/maps/piliers/textures-piliers-tourisme.js",
        "src/maps/piliers/shapes-piliers-roche.js",
        "src/maps/piliers/shapes-piliers-arbres.js",
        "src/maps/piliers/shapes-piliers-pont.js",
        "src/maps/piliers/shapes-piliers-ouvrages.js",
        "src/maps/piliers/shapes-piliers-tourisme.js",
        "src/maps/piliers/scenery-piliers.js",
        "src/maps/piliers/scenery-piliers-foret.js",
        "src/maps/piliers/scenery-piliers-corniches.js",
        "src/maps/piliers/scenery-piliers-pont.js",
        "src/maps/piliers/scenery-piliers-plateaux.js",
        "src/maps/piliers/scenery-piliers-descente.js",
        "src/maps/piliers/scenery-piliers-tourisme.js",
        "src/maps/piliers/scenery-piliers-vie.js"
      ],
      "lune": [
        "src/maps/lune/textures-lune.js",
        "src/maps/lune/textures-lune-route.js",
        "src/maps/lune/shapes-lune-relief.js",
        "src/maps/lune/shapes-lune-base.js",
        "src/maps/lune/scenery-lune.js",
        "src/maps/lune/scenery-lune-base.js",
        "src/maps/lune/scenery-lune-occidental.js",
        "src/maps/lune/scenery-lune-cretes.js",
        "src/maps/lune/scenery-lune-arene.js",
        "src/maps/lune/scenery-lune-bassin.js",
        "src/maps/lune/scenery-lune-vie.js"
      ],
      "autoroute": [
        "src/maps/autoroute/textures-autoroute.js",
        "src/maps/autoroute/textures-autoroute-route.js",
        "src/maps/autoroute/shapes-autoroute-batiments.js",
        "src/maps/autoroute/shapes-autoroute-vehicules.js",
        "src/maps/autoroute/shapes-autoroute-rue.js",
        "src/maps/autoroute/scenery-autoroute.js",
        "src/maps/autoroute/scenery-autoroute-ville.js",
        "src/maps/autoroute/scenery-autoroute-boulevard.js",
        "src/maps/autoroute/scenery-autoroute-quartier.js",
        "src/maps/autoroute/scenery-autoroute-pont.js",
        "src/maps/autoroute/scenery-autoroute-trou.js",
        "src/maps/autoroute/scenery-autoroute-metro.js",
        "src/maps/autoroute/scenery-autoroute-vie.js"
      ],
      "egee": [
        "src/maps/egee/textures-egee.js",
        "src/maps/egee/textures-egee-route.js",
        "src/maps/egee/shapes-egee-relief.js",
        "src/maps/egee/shapes-egee-bati.js",
        "src/maps/egee/shapes-egee-port.js",
        "src/maps/egee/shapes-egee-vie.js",
        "src/maps/egee/scenery-egee.js",
        "src/maps/egee/scenery-egee-port.js",
        "src/maps/egee/scenery-egee-ascension.js",
        "src/maps/egee/scenery-egee-village.js",
        "src/maps/egee/scenery-egee-balcon.js",
        "src/maps/egee/scenery-egee-descente.js",
        "src/maps/egee/scenery-egee-life.js"
      ]
    },
    "dependencies": {
      "wangan": [
        "src/maps/paris/textures-paris.js",
        "src/maps/paris/shapes-paris.js"
      ],
      "stade": [
        "src/maps/canal/textures-canal.js"
      ],
      "terre": [
        "src/maps/canal/textures-canal.js"
      ],
      "perse": [
        "src/maps/paris/shapes-paris.js",
        "src/maps/touge/textures-touge.js",
        "src/maps/chapada/textures-chapada.js"
      ],
      "barrage": [
        "src/maps/paris/shapes-paris.js",
        "src/maps/terre/shapes-terre.js",
        "src/maps/touge/shapes-touge.js"
      ],
      "chapada": [
        "src/maps/touge/textures-touge.js",
        "src/maps/plage/shapes-plage.js"
      ],
      "plage": [
        "src/maps/touge/textures-touge.js"
      ],
      "egee": [
        "src/maps/perse/shapes-perse.js",
        "src/maps/plage/textures-plage.js",
        "src/maps/plage/shapes-plage.js"
      ],
      "autoroute": [
        "src/maps/paris/shapes-paris.js",
        "src/maps/chapada/textures-chapada.js",
        "src/maps/chapada/shapes-chapada.js",
        "src/maps/plage/shapes-plage.js"
      ]
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
