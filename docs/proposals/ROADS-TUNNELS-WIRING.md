# Roads, tunnels and cars: values to paste, per map

Source of the choices: `docs/proposals/CARS-ROADS-TUNNELS.md` (branch `claude/voitures-routes-373e7c`). Textures: one file per map, `src/maps/<id>/textures-<id>-route.js`, already declared in `index.html`. Paste the lines below into the map's own block of `src/data/maps.js`; nothing else is needed. Try first without editing, with `?opt=` (`docs/methods/MAP-ENGINE-OPTIONS.md`).

## What was found about the white patches (seen in the game, egee)

The patches are **the puddles**, not the paint nor the colour values. `roadway` and `roadwayFine` both punch two half-transparent holes per 32 m into the road texture even when `wet` is `false` (`destination-out`); the engine reads the alpha as "puddle" and reflects the sky and sun there, so a dry road shows bright blotches. On egee at sample 1500 the big white blotch was there with `routeEgee` before the fix and disappeared once the road was made opaque. Every `route*` texture below is therefore **fully opaque unless `th.road[6]` is true**. Gloss 0.02 and paint one notch under white are still good practice but were not what removed the patch. Pale flecks still visible far ahead on area51 at low sun are the dashes and edge lines washed out by haze (identical with gloss 0). Not checked: piliers and volcan before the fix (they looked clean after), lune, autoroute (scenery asphalt covers the engine road).

Corollary for the engine: the tunnel floor is `mat('roadway', …, ...th.tun.ground)` (game.js 515), the classic texture with its white patches and puddles, and there is no option to swap it. Dark `ground` colours hide it; a `th.tun.roadTex` option in `game.js` would fix it properly (not done: engine file).

## Conventions

- Road textures are drawn over `roadwayFine`, so edges, dashes, kerbs and puddles are where they always were. Settings: the same 7 `th.road` values.
- `th.tun.tex = [wall, vault]`: engine walls get 64 x 64 px tiles of 8 m along the track, x = from wall top to foot. The engine floor stays `roadway` (see above).
- Hull and portal colours, lamps: as the proposal.
- `without` uses the **code strings** (`'gates'`, `'lamps'`, `'lights'`, `'walls'`), as in the proposal, because `game.js` tests those.

## egee (Aegean Cliffs)

```js
roadTex: 'routeEgee', gloss: 0.02,
road: ['#3a3d42', '#46494f', '#efe6d2', '#efe6d2', '#3a3d42', '#3a3d42', false],
```
No tunnel. Car: `car: car({ label: 'MELTEMI GTA-SA', … })` from the proposal, with `look: { type: 'gtr', col: 0xc4302b, stripes: 0xf7efe0, l: 0.86, w: 0.94, h: 0.94, nose: 0.6, cab: [-0.4, 2.0, 0.52], tailFin: 0 }`. Existing body, no livery code needed.

## area51

```js
roadTex: 'routeArea51', gloss: 0.02,
road: ['#313a46', '#3d4650', '#e8e2d7', '#f2c37b', '#313a46', '#313a46', false],
```
B1 and H1 are built by the scenery; the engine tunnel (`without: ['walls','gates']`, as the proposal) lays only the floor, so use `ground: ['#2a313a', '#353d47', '#9fd8e8', '#f2c37b', '#2a313a', '#2a313a']` (dark enough to hide the classic floor texture). Catalogue entries for the scenery's own shapes: `tunMurArea51` (shuttered concrete wall, hazard band at the foot), `tunVouteArea51` (coffered ceiling with a cable tray), `tunSolArea51` (dark polished floor, worn tow-line dash; for hall H1 and any floor the scenery lays itself). Same orientation convention as the engine walls.
Car: the DeLorean body does not exist (see below). Livery data: `look: { type: 'delorean' /* berlinette as a stopgap */, col: 0xb9bec4, stripes: 0x16161c, … }` as in the proposal.

## piliers (Sky Pillars)

```js
roadTex: 'routePiliers', gloss: 0.02,
road: ['#343e44', '#414c52', '#ece4d2', '#ece4d2', '#343e44', '#343e44', false],
tun: { …(proposal block), tex: ['tunMurPiliers', 'tunVoutePiliers'], ground: ['#262c30', '#2f383d', '#ece4d2', '#ece4d2', '#262c30', '#262c30'] }, // ground: my choice, dark
```
Car: `look: { type: 'groupeb', col: 0x2457c5, stripes: 0xf0c040, l: 0.92, w: 1.03, h: 1.04, nose: 0.5, cab: [-0.2, 2.1, 0.58], tailFin: 2 }` (the `groupeb` wheel is already gold, as on a 22B).

## volcan (Volcanic Island, Svalbard / Iceland direction)

```js
roadTex: 'routeVolcan', gloss: 0.02,
road: ['#555a60', '#61666c', '#e8d9ac', '#e8d9ac', '#555a60', '#555a60', false],
tun: { …(proposal block), tex: ['tunMurVolcan', 'tunVouteVolcan'] },   // 'without' must be ['gates'], not 'portals'
```
The road keeps the lighter grey so it leaves black rock; ash tongues and moss specks at the verges carry the Iceland mood (no snow drawn: snow is a scenery matter). Car: `look: { type: 'r5', col: 0xf2f0e6, stripes: 0xc8322a, l: 0.9, w: 1.0, h: 1.06, nose: 0.4, cab: [-0.25, 2.2, 0.6], tailFin: 1 }`.

## lune (Lunar Outpost)

```js
roadTex: 'routeLune', gloss: 0,
road: ['#23262d', '#2c3038', '#e8e2d0', '#d78a40', '#23262d', '#23262d', false],
tun: { …(proposal block), tex: ['tunMurLune', 'tunVouteLune'] },
```
Car body missing (see below); livery data: `look: { type: 'molab', col: 0xe8e2d0, stripes: 0xd78a40, … }`.

## autoroute (Sunken Highway)

```js
roadTex: 'routeAutoroute', gloss: 0.02,
road: ['#3e4146', '#3e4146', '#3e4146', '#3e4146', '#3e4146', '#3e4146', false],
```
The scenery asphalt covers the engine road; `routeAutoroute` is also meant for the motorway ribbon: `h.mat('routeAutoroute', {}, '#4a4d50', '#4a4d50', '#a8a494', '#b8b4a0', '#4a4d50', '#4a4d50', false)` (faded edge and dashes; the texture also erases random flecks of the paint). Metro catalogue entries for the scenery's shapes: `tunMurAutoroute` (grimy tiles, green dado, roots), `tunVouteAutoroute` (stained concrete, cable tray), `ballastAutoroute` (track bed, sleepers, rails). Car: `look: { type: 'peykan', col: 0xd9a52c, stripes: 0x2a8f8a, l: 1.0, w: 1.0, h: 1.0, nose: 0.5, cab: [-0.2, 2.2, 0.6], tailFin: 0 }`.

## Cars

All six liveries are data (`col`, `stripes`); the existing `livery` already paints a stripe on each side of the bonnet, roof and tail, so `src/render/textures-cars.js` was left untouched (the twelve shipped cars are unchanged by construction). Dark colours are lightened toward silver by `livery` (the piliers blue loses a little depth). **Bodies missing: `delorean` (area51) and `molab` (lune).**

## Choices I made where the proposal was open

- New textures are layered on `roadwayFine` instead of a new drawing, to keep every position identical.
- Tunnel floors of engine tunnels: dark `ground` colours chosen by me (piliers, volcan, lune as in the proposal).
- Piliers, volcan, lune tunnel walls/vaults drawn new (the proposal named the scenery's `tunnelPiliers`, `galerieVolcan`, which still work).
- Volcan road keeps `#555a60`; Iceland mood is carried by ash, scoria and moss on the verges.
