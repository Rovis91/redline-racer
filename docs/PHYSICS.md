# Physics and simulation

All of it lives in `src/engine/sim.js` (about 600 lines, no rendering). It runs the same in the browser and in Node (`node tests/test.js`). Line numbers below are for `sim.js` unless a file is given; they drift, grep the identifier.


## Conventions

- Metres, seconds, radians. Heading `c.th` is `atan2(z, x)`; track direction is `(tx, tz)`; "right" is `+d`. Clockwise tracks have positive curvature `k` (right turns).
- A track is a closed loop of **samples every 2 m** (`S[i]`). Progress `c.dist` is counted in samples since the line, laps accumulated (negative on the grid). One lap = `T.n` samples.
- Fixed timestep `H = 1/120` s. `game.js` accumulates frame time and calls `stepRace`/`step` `H` at a time (`for (acc += dt; acc >= H; ...)`, `game.js` ~l.1880). Never call the sim with another `dt`; tuning constants assume 120 Hz.
- Inputs: `inp = { steer: -1..1 (right > 0), gas: 0..1, brake: 0..1, hand: bool, nitro: bool }`.
- Maps come from `src/data/maps.js` (`MAPS`, one entry per map). `sim.js` reads no global map: `buildTrack(THREE, M)` takes the map and the result carries `T.map`, `T.car`, `T.kt`. Several tracks can coexist (tests, map switch).
- Export: everything is attached to `window`/`globalThis` at the end of the file (l.615): `buildTrack newCar step autopilot newRace stepRace traffic hitTraffic wear brokenFresh brokenImpact lapRef challengeCode challengeRead ...`.

## Track construction: `buildTrack(THREE, M)` (l.95)

1. Control points `M.pts = [x, z, altitude]`, scaled by `M.sc`, closed `CatmullRomCurve3` (centripetal). Resampled to `n = round(length / 2)` evenly spaced samples. Per sample: position, tangent `tx,tz`, slope `sl`, signed curvature `k` (smoothed over +-3 samples), half-width `w`.
2. `M.W` is the base half-width. `M.wide = [[a, b, w], ...]` widens (or narrows) between control points `a` and `b`, blended over 60 m each side (smoothstep). Only sample `s.w` changes. Walls sit at `s.w - 1.1` (car radius).
3. `M.trough = [[a, b, largeur, arcRadius], ...]` rollable walls: a quarter-tube of radius `s.rc` on each side of the flat part `s.pl`, opening over 40 m. `wallFace/slope/tube` (l.82-86) give the height and slope; the tube stops at 0.98 radius, then a flat top. Climbing costs `CLIMB` (4) times the potential energy, descending gives it back (l.81, l.309).
4. `M.jumps = [[point, longueur, hauteur, pit, profondeur], ...]` ramps: the ribbon rises as a parabola `h*(k/nl)^2` and ends sharply at `point`; behind it an optional pit (depth `P`, 16 m exit ramp). A missed jump costs time, never blocks. `T.vert = !!(jumps || trough)` switches the vertical physics on; without it `c.y = ground` and the air/slope code is skipped.
5. **Autopilot line** (`s.dl` offset from centre, `s.kl` curvature): a relaxation of 6000 passes on one point per 8 m, each pulled to where its 4 neighbours want it, clamped to `s.pl - 3.2` (2.1 m from walls). Result: outside-inside-outside regardless of width. Allocation-free typed arrays on purpose (this was the map load time; result must stay bit-identical).
6. Rain `th.rainFx` (`true` = everywhere, or `[[a, b, force], ...]` blended over 120 m) gives `T.rainFx[i]`. Surfaces: see below -> `T.surf[i]` and `T.surfDry[i]`.
7. `M.tun`/`t0,t1` tunnel (rain off inside), `M.hotList`, `M.sect`, `M.racingLine = [a, b]` (nitro reward zone), `M.jam = [a, b, f]` (trucks slow to `f` x speed, so they bunch up; `T.tau`), `M.lorry = [point, offset]` (double-parked truck, alternates side each lap, `lorry()` l.349), `M.traffic` count of trucks (`T.trucks`, speed `25 + (i*7%5)*1.5` m/s, lanes -4.6/0/4.6; l.152).
8. `M.place = { c, r, a, piers, island, gap }`: a circular square where you can drive anywhere (no road wall inside), with box piers (arc de triomphe) and a ring of bollards. `insidePlace` (l.183) widens the nearest-sample search to 250 samples so cutting across is allowed.

`T.kt = { ...KT0 }` with `w0, w1` multiplied by `car.grip` (default 1).

## Car model

Per car (`newCar`, l.155): `x z th vx vz` (world velocity), `vf vl` (forward/lateral in the car frame), `steer yaw`, `idx dist d` (nearest sample, progress, lateral offset), `hit rub wallT`, `nitro boost sec`, `gear rpm shiftT manual`, `y vy air airT land` (relief), `dd sa drift slide` (drift), `score ongoing mult` (Glisse mode), `asp stun`, counters `nDrift nBoost nWall`.

The car sheet is `T.car` (= `M.car`, see `maps.js` header `car()` helper l.18): `ratios[] final wheel(m) mass eff idle red cd area tq[9] up down trac rwd grip`. `tq` is torque (N.m) every 1000 rpm, linearly interpolated (`torque`, l.8). `trac` is max tyre acceleration (m/s^2, about 1.1 g with 4WD = 11). `up/down` are auto-gearbox shift rpm. Other fields (`label sound engine turbo look`) are audio/render only.

### `rolling(c, inp, T, dt)` (l.187), one ground step, in order

1. **Steering** is rate-limited (12/s), plus CASSE offset `ca.dir`.
2. **Yaw is kart-like**, not a bicycle model: the wheel commands a yaw rate directly, which depends little on speed. `omega(v)` (l.19) interpolates `KT.w0` (1.36 rad/s at standstill) to `KT.w1` (0.85 at `KT.vref` = 70 m/s), ramped in under 10 m/s. Same for every car and map, only `car.grip` scales it. Yaw follows the target with a time constant 1/18 s (1/`yr` in a drift). `KT.lift` (1.25): yaw is higher when off gas or braking. `KT.tv`: speed lost while turning (m/s^2 per rad/s).
3. **Surface** `Q = surfAt(T, c)` (l.45). Grip split into two: `ks = (1 - Q.corner) * (1 - Q.aq*c.aq)` (turning ability) and `traction = (1 - Q.gripCoef) * car.grip` (how fast velocity realigns to the nose).
4. **Drift** (`KT0` comment l.9-17): handbrake + steer, above `12*(1-Q.gl)` m/s and `|steer| > 0.3*(1-Q.gl)`, locks direction `c.dd` until the button is released or speed < `10*(1-Q.gl)`. Target slip angle `c.sa` approaches `angMax*aIn/aN/aOut` (steered into / neutral / out of the drift), faster and wider on slippery ground. Yaw in a drift is the grip yaw times `kIn/kN/kOut`. Costs `scrub` m/s^2 at full angle. Handbrake alone (`c.frA`) = rear brake `brakeRear` m/s^2.
5. **Engine and gearbox**: rpm comes from wheel speed through the current gear (`K = final*30/(pi*wheel)`); torque from the curve; every shift cuts thrust for 0.25 s (`shiftT`); auto box shifts up at `up`, down at `down`, back to 1st below 3 m/s; clutch slips at 3500 rpm in 1st from standstill. Over `red` the rev limiter applies -6 m/s^2 engine braking (except nitro in top gear). Thrust is capped by `trac*(1 - Q.trac)`. Lift-off engine braking `20 + 0.01*rpm`.
6. **Longitudinal**: slope `9.81*sl`, brake `18` (forward) / `12` (reverse) times `(1 - Q.brakes)`, drag `0.6*cd*area*v|v|/mass` (reduced by slipstream and by CASSE `ca.vf`), rolling `0.15 + Q.rollAmt`, reverse capped at -12 m/s.
7. **Lateral**: no tyre-slip model. Lateral velocity is pulled to `-sin(sa)*|v|` at rate `25*traction*(1 - Q.aqc*c.aq)` per second (`traction^0.35` while drifting). Speed magnitude is then renormalised, so a side hit is absorbed in ~0.1 s on dry road and the car slides on low-grip surfaces ("chases").

`flies` (l.253) is the air step: heading and velocity frozen, only drag; no steering, engine, brake, nitro (rpm revs up if gas held).

### Constants (where to tune)

| What | Where |
|---|---|
| Steering/drift feel `KT0` (`w0 w1 vref lift tv brakeRear kIn kN kOut yr scrub sar angMax aIn aN aOut`) | l.18 |
| Reference speed for visuals/nitro `TOP` = 55 m/s | l.6 |
| Wall friction/loss `WALL_RUB WALL_SOFT WALL_LOSS WALL_HARD WALL_MU` | l.7 |
| Air/landing `GRAV DROOP LAND0 LANDK LANDX`, wall climb cost `CLIMB` | l.78, l.81 |
| Car body circles `CR=1.1`, `CO=1.2` (2 circles, 4.6 x 2.2 m) | l.400 |
| Engine, gears, mass, grip per car | `src/data/maps.js`, `car:` of each map |
| Track width, scale, relief, surfaces, traffic | `maps.js`, per map |

## Surfaces and grip

`SURF` (l.30): each entry is `{ corner, brakes, trac, gripCoef, vaq, aq, aqc, rollAmt, gl }`.

- `corner`: yaw lost in turns. `brakes`, `trac`: braking / traction lost. `gripCoef`: velocity-follows-nose lag lost (the car drifts wide). `rollAmt`: extra rolling resistance (m/s^2). `gl`: lowers the thresholds to start a drift.
- Aquaplaning: above `vaq` (m/s), over 4 m/s, up to `aq` less yaw and `aqc` less realignment.
- Entries: `sec` (all 0), `damp` (wet), `iceSurf` (ice: vir .6, frein .7, colle .8), `snowSurf` (snow, between dry and ice, `gl` .2), `cobbles` (cobbles), `terre` (dirt: `rollAmt` .5, `gl` .5, still turns well). Add a surface by adding an entry; nothing else needs to know.
- A map declares `surf: { backdrop: 'snowSurf', zones: [[a, b, 'iceSurf', force], ...], wide: 'cobbles' }`. Zones blend over 20 m (`span(.., 10)`, `mixed` lerps two entries). `wide` is the surface outside the asphalt band (`|d| > W`: wide parts, the square) so what you see is what you drive on (`surfAt`).
- Rain (`th.rainFx`) uses the same table: force 1 (drizzle) = 30 % of the way to `damp`, force 3 = `damp`; dry inside tunnels. Computed in `road()` l.143.
- **Drying line** (race only, `R.mo`, `MO` l.43): per sample x 8 bands across the road, 1 = wet as the map says, 0 = dry line. Every car (AI too) dries the band it passes (`MO.stepSec`), time dries `MO.t`/s, heavy rain (>1) rewets `MO.pl`. Dry line grip = `T.surfDry` (rain counted `MO.sec` = 40 %), mixed by `mixed`. Time trial, medals (`lapRef`) and ghosts never see it (wet everywhere). Deterministic; an online guest recomputes it from received state, only the host simulates.
- AI and turn warning read the surface: `vAllowed` (l.322) is the allowed speed per sample, cached in `T.va` (recomputed if `T.surf` changes). It takes the tightest of the next 200 samples with 40*(1-frein) m/s^2 braking credit, a 1.2 g lateral budget cut by `corner`/`gripCoef`, and keeps below the aquaplaning threshold.

## Walls

`step()` (l.259) after the ground step finds the nearest sample (-6..+14 samples ahead; 250 on the square), computes `c.d`, and if `|d| > w - 1.1` pushes the car back and calls `intoWall(c, N, o, T, sgT, kw, dt)` (l.166). Same `intoWall` is used for the square's circle, the piers, the bollard ring and the double-parked truck.

- Pushback to the wall line, no bounce. Continuous rub brake `exp(-(WALL_RUB + WALL_MU*max(0, kw*v - 0.1))*dt)`: the outer wall of a corner costs speed proportional to how much it turns the car (`kw`, the wall curvature).
- Heading is pulled along the wall (25/s if the nose points into it, else 4/s).
- Impact only on arrival (`wallT` = 0.4 s debounce): speed loss `clamp((sin(angle) - WALL_SOFT)*WALL_LOSS, 0, 0.7)`; `c.hit = vn` (normal speed). Grazing below `WALL_SOFT` costs nothing.
- A hard hit (`sin > WALL_HARD` and `vn > 5`) empties the nitro gauge and cuts the engine 0.8 s (`c.stun`; thrust x0.2).
- `c.rub = 1` while touching; brushing a wall above 15 m/s fills nitro (`NI.intoWall`).
- A loop is always valid: you cannot cut the track outside the square (walls everywhere). `?hitbox` (`src/engine/hitbox.js`) draws these limits and must be kept in line with this section.

## Car-car collisions: `collide(a, b)` (l.447)

Each car is 2 circles of radius `CR` at +-`CO` along its axis. For each pair of circles in contact: split the overlap half each, exchange 60 % of the normal velocity (so about 20 % rebound), keep tangential velocity (side contact pushes without braking). Skipped if `|a.y - b.y| > 1.5` (one car over the other). Sets `bump = max(vn)` and `who` (last other car, for CASSE takedowns). Same mass, no damage-dependent mass.

Order in `stepRace`: car-car collisions first, then `step()` (walls have the last word, nobody is pushed off the track). A `bump > 2` breaks the Glisse chain like a wall.

## Jumps and relief (only when `T.vert`)

`step()` l.301-313. Car height `c.y`, vertical speed `c.vy`. Gravity `GRAV` 9.81. Ground `ground(T, c)` is the ribbon altitude interpolated between samples plus the wall height `wallFace`. The car is airborne when it is more than `DROOP` (0.1 m) above ground (`c.air`); on a rollable wall it never takes off (speed presses it to the surface). Landing: impact `c.land = vg - vy`; above `LAND0` (6 m/s) lose `LANDK` (2.5 %) of speed per extra m/s up to `LANDX` (45 %); landing in a descent costs nothing (`vg` includes slope speed). On a wall, gravity pulls along the slope, rotating the car (the banking carries it) and brakes uphill; yaw gets a load factor `1/cos(slope)`. Trucks and other cars: `collide` ignores height differences over 1.5 m.

**Craters** (`M.dents`, `M.bowls`, map `lune`): ground the ribbon does not carry, added to `ground` by `T.dent(x, z)`. The vertical speed it gives the car is part of `vg`. By default it is read 2 m ahead of the car (0.05 s): it pulls the car down before a rim and has vanished at a lip, so the car never leaves the ground. With `M.loft = [share, gravity]` it is the speed the ground really gave over the last step: past a rim the ground drops away and the car falls after it; climbing, the car keeps only `share` of the upward speed (as take-off speed at a lip, and as ground speed in the landing impact), and those hops fall at `grav × gravity` instead of `evenJump`'s factor (`c.lo` remembers that the last ground touched was a crater's). The height and length of a hop grow with speed. Only `lune` sets it (`tests/test-loft.js` checks that, and the behaviour with and without); a map without `M.loft` runs the same operations as before.

## Nitro

Gauge `c.nitro` 0..1 per car, `inp.nitro` spends it with gas open and wheels on the ground; `c.boost = 1` while pushing. `NI` (l.61): `dur` 3 s for a full gauge, `acc` 6 m/s^2 at `TOP` and above, up to `(1 + rep)` x more at standstill (`rep` 1, also helps restart), `sec` 0.1 (after running dry the gauge must reach 0.1 before pushing again: `c.sec`, avoids endless push at an empty gauge).

Refill per second: `gl` 0.3 (held drift at `TOP`, full rate after 0.6 s), `intoWall` 0.5 (rubbing a wall), `racingLine` 0.5 (within 1 m of the wall without touching, in `T.racingLine`), `cam` 0.6 (overtaking a truck closely, less than 1.2 m between flanks, 8 m/s faster), `asp` 0.12 (slipstream). A hard wall/truck hit empties it. At the rev limiter nitro only adds base thrust; in top gear it also overrides the limiter. No nitro in the air.

**Slipstream** (`stepRace` l.474): behind a car doing more than 20 m/s, 3 to `NI.ad` (30) m, inside a cone opening `NI.ac` per metre, same height: `c.asp = 1 - lon/30`, drag cut by up to `NI.acx` (0.5), gauge filling.

## Race: `newRace` / `stepRace`

`newRace(T, laps = 3, lvls = AI_LVL, el = 0, opt)` (l.402). `R.cars[0]` is player 1 (last on the grid), then rivals fastest first. Options: `humans: n` (split screen/online: first `n` cars are humans, grid from the back), `grid[i]` custom start slot (tournament), `elim: true`, `broken: true`, `timedOut` (Glisse duel). Grid is staggered, 8 m between rows, +-3 m.

`stepRace(R, inp, dt)` (l.458), per step:
1. Inputs: humans take `inp[i]`; `null` means the autopilot drives that car (also after a car finishes, at level 0.6, and a lap of honour under 28 m/s).
2. CASSE: AI seeks contact (`seek`).
3. Car-car collisions, slipstream.
4. `step()` per car, then `brokenImpact` if CASSE, lap/finish bookkeeping (`c.ending`, `c.pts`).
5. `dry` (drying line), elimination, `c.pos` from `raceOrder`, `R.done`.

**Elimination**: laps = number of cars; from the end of lap 2, each time the leader crosses the line the last car in track is out (`c.out`). First lap protected, last is a duel. An out car pulls to the side and stops (`range`), touches nobody, gives no slipstream, and AI ignore it.

**Tournament**: `tourAll(pts, arrival)` pure function, `SCORING = [10, 6, 3, 1]` points; grid for the next round is the reverse of the standings (`opt.grid`).

**Glisse mode scoring** (`points`, l.69, `GL`): read-only on the car, no lap time depends on it. Points per second = `GL.k * speed * c.slide * c.mult`; a drift counts only after `GL.min` (0.8 s), then multiplier +1 up to `GL.max` (5); `GL.pause` (3 s) without drifting resets it; wall, truck (`hit > 2`) or car (`bump > 2`) impact resets and loses the drift in progress.

## AI drivers

`autopilot(c, T, lvl, others)` (l.350) returns an input; used for AI cars, `?auto`, ghost/medal reference laps, tests, and a human whose input is `null`.

- Target point `la` = sample `3 + floor(v*0.1)` ahead, offset by the precomputed line `dl`; steer `clamp(3*angle error)`.
- Target speed `vt = min(vcap, vAllowed * lvl * (off-line ? 0.9 : 1), lvl < 1 ? vTop*lvl : inf)` where `vTop` is top gear at the limiter. Gas if below, brake if 3 m/s over. Nitro on straights when 20 m/s under target, steering < 0.25, gauge > 0.3 (or already boosting).
- Overtaking: looks 8 + 0.7v samples ahead; picks the side with room, offset 3.4 m from the other car (`|off| <= 5.5`), caps speed to the other's when blocked and too close. Cars keep their grid lane for the first ~300 m (`c.file`).
- Pace is `lvls` (`AI_LVL = [0.99, 0.97, 0.95]`, l.399, the only pace setting). `DIFF` (l.398): `k` scales levels (0.93 / 1 / 1.04), `el` rubber-band up to +-`el` by distance to the human average (full at 300 m; leader eases off when the player is far behind). Level capped at `LVL_MAX` 1.04: above it the autopilot hits walls.
- `driveSkid` (l.426): drift-capable driver for tests and gold traces.
- `alertCorner` (l.341): HUD corner warning, signed distance to the first sample where `vturn` falls below `f=0.65` of current speed within 3.6 s; 0 if already inside or slower than 15 m/s.

## Traffic

`traffic(T, t)` (l.526): trucks on 3 lanes at constant speed; position depends only on elapsed time `t` (same traffic every attempt), computed from `T.tau` when a `jam` slows part of the road. `hitTraffic(c, T, t)` (l.538): truck = 3 circles of 1.4 m, car 2 of 1.1 m; truck does not move, car is pushed out (x1.2), hit reported in `c.hit`; `vn > 3` empties nitro and stuns 0.8 s. Used by the solo/time-trial mode in `game.js`, not by `stepRace`.

## Damage and wear

Visual damage is in `game.js` (`dmgStep`, l.1003): after each step a "hard" impact (`max(hit, bump) > 3`, at most every 0.15 s) is read from the velocity change (direction in the car frame) and fed to `wear` with the same model as below. In every mode except CASSE it is cosmetic: the simulation never reads it, so ghosts, medals, records and online stay valid. `tools/impacts.js` replays this model on real races to measure it.

### `wear(Z, Z0, lx, lz, vn, type, broken)` (l.605)

`Z` = wear per zone `[front, rear, left flank z<0, right flank z>0]`, 0..1, mutated in place; `Z0` = zones at lap start; returns wear added.

- Only the **normal** speed `vn` damages; rubbing a wall does nothing (the wall code gives `hit` only on arrival).
- Thresholds `WEAR.cutoff`: wall 6, truck 6, car 4 m/s. Below: 0.
- Wear `u = min(1, ((vn - cutoff)/24)^2) * mult[type] * corner`, `mult`: wall 1, truck 1.5, car 0.8; corner (both `lx^2` and `lz^2` > 0.2) x1.3.
- Split between face (front/rear by sign of `lx`) and flank (sign of `lz`) by the squares of the direction components. Each zone: `+= min(max, k*u*weight) * (1 - Z)` (diminishing returns). Normal mode `k` 0.75, `max` 0.5 per impact; CASSE `kC` 1, `maxC` 0.8.
- **Caps (not CASSE)**: a zone never exceeds `WEAR.cap` 0.7 and gains at most `WEAR.lapRun` 0.4 per lap (against `Z0`). Heavily damaged, never a wreck.
- Constants: `WEAR` l.604. Rough scale: 8 m/s gives about 0.007; 20 m/s about 3x 14 m/s squared.

### CASSE mode (`newRace(..., { broken: true })`)

Each car gets `c.ca = brokenFresh()` (l.497): `z z0 lap t misalign pops[4] dead lst lstT td p vf grip dir`. `brokenImpact(R, c, vx0, vz0)` (l.499) runs in `stepRace` after each step, deterministic (host and guests agree).

- Wear without caps (`wear(..., broken = true)`), one impact counted per 0.15 s.
- Impact direction `(lx, lz)` = velocity change in the car frame; `type` = car if `bump > hit` else wall.
- **Pulled steering**: a front impact taken from the side (`lx>0`, `lz^2>0.2`, `f>12`) adds `misalign += 0.02*sign(lz)`, clamped +-0.08 rad of steering.
- **Puncture**: a big corner hit (`f > 15`, both components >0.2) on a front/rear zone already >= 0.5 sets `pops[wheel] = 1`.
- Effects fed back into `rolling` through `c.ca`: `p` engine power (1; 0.85 if front >= 0.6; 0.65 if >= 0.85) multiplies positive thrust; `vf = 0.9^punctures` divides drag as `ca.vf^2` (lowers top speed); `grip = 0.85^punctures` multiplies yaw and realignment grip; `dir = misalign + 0.03*(right punctures - left punctures)` is added to steering.
- **Takedown**: `who` (last car touched) is stored in `lst` with the time for hits above 2 m/s. A wall hit above 15 m/s within 2 s of being hit by another car credits that car (`td++`, `R.td` log); being put out within 3 s credits it too.
- **Out of service** (`dead`): front >= 0.97 or the four zones sum >= 3.4: the car leaves the race (`c.out = R.t`, goes to `range`).
- The AI hunts contact (`seek`, l.516): a car within -4..18 m ahead and +-8 m laterally (humans weighted first), steer toward it by `0.25*lat*aggr`, gas on if it is behind; `aggr` 0.8, 1.4 for the second rival ("hothead", also uses nitro within 10 m).
- Scoring is in `game.js` (`BROKEN_PTS`, l.1333: place 10/6/4/2, 3 per takedown).
- Rendering of damage (dents, hanging parts, debris) is out of the simulation, in `game.js` and `src/render/`.

## Ghosts, medals and challenge links

- `lapRef(T)` (l.563): the autopilot lap launched with a full nitro gauge spent on straights; returns time and trace at 20 Hz. Medal thresholds are multiples of it (`med` in the map).
- A trace is `[x, y, z, heading, ...]` at 20 Hz; `stretch(trace, k)` slows or speeds it by `k` keeping the cadence (heading interpolated the short way).
- Challenge link `"CHALLENGE_V.map.data"` (`challengeCode`/`challengeRead`, l.573; `CHALLENGE_V` = 8): lap time (ms, 3 bytes), positions at 5 Hz quantised to 10 cm, heading 1/256 turn, 16-bit checksum, base64url. **Positions are transported, never inputs**, because the sim does not give bit-identical results across browsers. `challengeRead` never throws: it returns `{ err }` for unreadable, other-version or truncated links.
- Record keys in `localStorage` are prefixed with a physics version (`PRE = 'vpr8.'` in `game.js` l.1256). Bump it, and `CHALLENGE_V`, when a change moves lap times or driving.

## Determinism

- Same inputs and fixed `H` give the same state in Node (tests assert exact lap time, identical drying maps, identical CASSE states for two runs). No `Math.random` in `sim.js`; trucks depend only on time; the drying line depends only on car positions.
- Across browsers/engines floating-point results can differ, hence positions rather than inputs in links and ghosts.
- Online: the host runs `stepRace` and broadcasts state; guests apply it (`NET.applySetting`) and only recompute the drying line.

## What the tests guarantee (`tests/test.js`, `node tests/test.js`)

Run with `sh tools/check.sh`. On the default map ('ville'):

- Geometry: min curvature radius > 25 m; the track never comes within `2W + 8` m of itself; drizzle wets the road a little but not the tunnel; no jump/wall relief on a flat map (`!T.vert`, car always on `ground`).
- Autopilot lap: valid between 30 and 120 s, less than 1 s of drift, exact solo lap time pinned (42.66 s, `Math.abs(t - 42.66) < 0.01`). A change that moves it is a physics change: update the pin and bump the physics version.
- Powertrain: 0-100 km/h between 3 and 4.5 s, shift speeds near 68 and 110 km/h, rpm within `idle..red+200`, 1st-gear limiter near 62-76 km/h, manual box, nitro in 1st does not break the limiter.
- Walls: full gas into walls is slower than braking; grazing at shallow angles costs little and fills nitro; a hard hit empties the gauge and stuns.
- Steering and drift: lifting or braking tightens the turn; no drift without input; slip angle 3-60 degrees; steering does not reverse a drift; held drift fills nitro slowly; leaving a drift does not push.
- Nitro: full gauge does nothing until triggered, empty gauge has no effect, gauge drains gradually, gains ground, helps recovery more at low speed, no effect in the air.
- Glisse scoring: banked on exit, faster and longer drifts pay more, chain multiplier, decay after 3 s, zigzags score nothing, a wall breaks the chain.
- Cars: rear-end, head-on and side collisions neither tunnel nor leave the road; side contact does not stop the cars; slipstream catches up and also works for AI, not beside the car; no overtake in one lap, none by force.
- AI: lap times within [solo, solo + 2] s and ordered by level; a 4-car race finishes, no car stuck (>25 samples per 10 s), no NaN or out-of-road car, finish order equals `raceOrder`, field spread under 8 s.
- Modes: tournament scoring and grid, elimination order and parking, 2 and 4 humans (grid, independence, an arrived human does not end the other's race), AI rubber band formula with 1 or 2 humans, Glisse duel (independent scores, chain breaks on car contact, zero score past the delay).
- Ghosts and links: reference lap 30-40 s, 20 Hz trace, bronze ghost 10 % slower, heading interpolation, challenge round-trip errors (<= 5 cm, <= pi/256 rad), truncated, corrupted, other-version and other-map links are all refused without exception.
- Relief (stade map): lands correctly after a jump, no passing under the ground, free-fall flight, range grows with speed, ballistic range matches, the pit is cleared at 200 km/h and costs time at 80, rollable walls climbable at speed and descended at 20 km/h, clean lap has one flight per ramp and no hit, cars at different heights do not collide.
- Turn warning: 1-3 alerts per lap of the default map, countdown 2 m per sample, silent at standstill.
- Drying line: the racing line dries, the edge stays wet, same race gives the same map, no mouillure outside race.
- Wear: thresholds, quadratic growth, 0.4 per lap, 0.7 cap, corner-pounding reaches wreck in CASSE.
- CASSE: two runs identical, ordinary race has no `c.ca`, a heavy hitter ends with a zone above 0.7, engine/grip/steering affected, an engine at 65 % accelerates less.
- Online packing (`network.js`), English UI strings, other test files cover maps (`test-maps.js`), sessions, devices, fonts.

## Measuring impacts: `node tools/impacts.js [map]`

Runs a 3-lap race with 3 AI per player profile (clean = autopilot, average = 6 % too fast with a fixed pseudo-random steering error, reckless = always flat out, never brakes), plus the wangan time trial with trucks. It reads impacts exactly as the game does (`c.hit`, `c.bump`, one per 0.15 s above 3 m/s), buckets them by speed (4, 6, 10, 15, 20, 30 m/s) and replays the real `wear` model, printing the worst zone per profile and lap. Use it after touching `WEAR`, wall constants or AI levels: clean driving should stay near 0 to 0.3, reckless should reach the 0.7 cap without exceeding 0.4 after lap 1.

## Common changes

- Faster or grippier driving everywhere: `KT0` `w0/w1` (l.18); one car only: `car.grip` or `trac`, `tq` in `maps.js`.
- More or less slippery surface: the entry in `SURF` (l.30-37); where it applies: map `surf`/`rainFx`.
- Harsher walls: `WALL_*` (l.7); wear: `WEAR` (l.604).
- AI pace: `AI_LVL`/`DIFF` (l.398-399), never above `LVL_MAX`.
- Nitro economy: `NI` (l.61).
- Any change to the above: run `sh tools/check.sh`, then `node tools/impacts.js` for damage, and treat moved lap times as a physics version bump (`PRE` in `game.js`, `CHALLENGE_V`).
