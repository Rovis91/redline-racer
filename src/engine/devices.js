// Peripherals: keyboard, controllers (Gamepad API) and Joy-Cons (WebHID) behind a single interface. game.js creates one on each load (Peripherals({ ... })); node loads it with require for test-devices.js.
// Each device has a name: 'keyboard' (whole keyboard, solo only), 'keyboardLeft', 'keyboardRight', 'controller' + n (Gamepad API), 'joycon' + n (WebHID, n = 0 or 1).
// Per frame: poll() returns the controllers' menu commands, as { code, key, periph } (the same names as keyboard keys, so menus are not duplicated);
// enroll() hands out the split-screen places; entering(id) reads the driving of a device, and of it alone.
(function () {
  // Keys of each keyboard in physical positions (e.code: KeyW/KeyA are Z/Q on AZERTY), in the order left, right, throttle, brake, handbrake, nitro. Right keyboard: right Shift = handbrake,
  // the key left of right Shift (Slash: "!" on AZERTY, "/" on QWERTY) or the numpad Enter = nitro. Not right Ctrl (Ctrl + arrows switches desktop on macOS) nor Enter (a controller menu command).
  const KBD = {
    keyboard: [['ArrowLeft', 'KeyA'], ['ArrowRight', 'KeyD'], ['ArrowUp', 'KeyW'], ['ArrowDown', 'KeyS'], ['Space'], ['KeyX', 'KeyN']],
    keyboardLeft: [['KeyA'], ['KeyD'], ['KeyW'], ['KeyS'], ['Space'], ['KeyX'], ['KeyQ', 'KeyE']], // also: the gear shifts, so they count as a press on this keyboard
    keyboardRight: [['ArrowLeft'], ['ArrowRight'], ['ArrowUp'], ['ArrowDown'], ['ShiftRight'], ['Slash', 'NumpadEnter']],
  };
  // controller ("standard" browser layout, Switch controller button names): stick or d-pad = steering and menus, ZR or B = throttle, ZL or Y = brake,
  // A = drift, X = nitro, stick click = radio, L / R = gears, + = pause, B = confirm. Each button is worth the command of a keyboard key.
  const PADK = { 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 0: 'Enter', 9: 'Escape', 8: 'g', 10: 'c', 11: 'c', 4: 'KeyQ', 5: 'KeyE' };
  const cmd = (k, periph) => ({ code: k.length > 1 ? k : '', key: k.length > 1 ? '' : k, periph });
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const JOYCON = d => d.productId === 0x2006 || d.productId === 0x2007; // Joy-Con gauche / droit
  // o: { nav (navigator), win (for the listeners), signal (AbortSignal that removes them), places (['', ''], kept by the caller), says (short on-screen message) }
  function Peripherals(o) {
    const nav = o.nav || {}, win = o.win, signal = o.signal, says = o.says || (() => { }), on = (outTarget, ev, f) => outTarget && outTarget.addEventListener(ev, f, { signal });
    const keys = {}, viewed = [], presses = [], padWas = {}, padRest = {}, padPrev = {}, PLACES = o.places || ['', '']; // keys held down · keyboard presses since the last frame · presses this frame, all devices
    let pads = [], pad = null, kept = ''; // in solo, the retained controller = the last one that had an input: the first in the list may be another device (wheel, headset, second Joy-Con)
    const padId = p => p.hid || 'controller' + p.index, branch = id => id in KBD || pads.some(p => padId(p) === id); // plug state: check after poll, to know that an enrolled device has left

    // ---- keyboard: game.js passes it its keydown events (it keeps control of the commands, which must stay within the user's gesture for sound and WebHID)
    const keyboard = e => { keys[e.code] = 1; const id = ['keyboardLeft', 'keyboardRight'].find(c => KBD[c].flat().includes(e.code)); if (id && !e.repeat) viewed.push({ id, t: e.code }); };
    on(win, 'keyup', e => { keys[e.code] = 0; });
    on(win, 'blur', () => { for (const k in keys) keys[k] = 0; }); // otherwise a key stays held down after Alt-Tab

    const started = id => { delete padRest[id]; delete padPrev[id]; if (id === kept) { kept = ''; says('MANETTE DÉCONNECTÉE'); } };
    on(win, 'gamepaddisconnected', e => started(padId(e.gamepad)));

    // ---- Joy-Cons read live (WebHID), two at most: on Windows, Chrome receives their reports but does not show them to the Gamepad API (seen on Chrome 156, Joy-Con (R) over Bluetooth).
    // Report 0x3f, Joy-Con held alone horizontally: byte 0 = buttons (1 left, 2 up, 4 down, 8 right, 16 SL, 32 SR), byte 1 = − or + (1, 2), byte 2 = stick in 8 directions (0 = up, clockwise, 8 and above = rest).
    // Joy-Con (L): same table. Inferred, not tested: this report describes the Joy-Con lying flat (the (R)'s stick already arrives turned there), so a given bit should mean the same position under the thumb; if (L) comes in reversed, give it its own table in hidRead according to dev.productId.
    // Presented as "standard" controllers, so poll treats them like the otherCars. shortcut: stick is on/off only; switch to report 0x30 (12-bit stick + calibration) for a progressive steering wheel.
    const hids = [null, null];
    const hidRead = (e, p) => {
      // Chrome (its Nintendo controller driver) can switch the Joy-Con to full report 0x30 shortly after connecting: any following press would be ignored. We re-request 0x3f (subcommand 0x03), at most once per second (counted on the device: shared by the map instances).
      if (e.reportId === 0x30 || e.reportId === 0x31) { const t = Date.now(), v = p.dev; if (!(v.redit > t)) { v.redit = t + 1000; p.n = (p.n + 1) & 15 || 1; Promise.resolve(p.dev.sendReport && p.dev.sendReport(1, new Uint8Array([p.n, 0, 1, 0x40, 0x40, 0, 1, 0x40, 0x40, 3, 0x3f]))).catch(() => { }); } }
      if (e.reportId !== 0x3f) return; const d = new Uint8Array(e.data.buffer, e.data.byteOffset), h = d[2], set = (i, v) => { p.buttons[i].pressed = !!v; p.buttons[i].value = v ? 1 : 0; };
      [8, 5, 4, 0, 3, 1].forEach((b, i) => set(b, d[0] & 1 << i)); set(9, d[1] & 3); set(10, d[1] & 48); // (radio = Home or Capture: bits 16 and 32, from the report format, untested; not the stick click, which the thumb presses while squeezing SL for nitro) · Joy-Con (R) lying flat, SL / SR up: left and up bits (seen by the author), down and right (inferred), SL, SR -> manual / automatic gearbox, gear +, gear -, throttle and confirm, nitro, drift (the author's choice, who does not brake with the controller)
      p.axes = [h > 0 && h < 4 ? 1 : h > 4 && h < 8 ? -1 : 0, h === 7 || h < 2 ? -1 : h > 2 && h < 6 ? 1 : 0];
    };
    const hidOpen = async d => {
      const taken = () => hids.some(p => p && p.dev === d);
      if (!d || taken() || !JOYCON(d)) return;
      try { if (!d.opened) await d.open(); } catch (e) { return; }
      const n = hids.indexOf(null); if (n < 0 || taken()) return; // rechecked after the wait: two searches can open the same Joy-Con at once
      const p = hids[n] = { hid: 'joycon' + n, dev: d, connected: true, axes: [0, 0], buttons: Array.from({ length: 11 }, () => ({ pressed: false, value: 0 })) }; on(d, 'inputreport', e => hidRead(e, p)); // not oninputreport: one instance per map, each must receive the reports, not only the last one built
    };
    const hidRequest = () => nav.hid && nav.hid.requestDevice({ filters: [{ vendorId: 0x057e }] }).then(l => l.forEach(hidOpen)).catch(() => { }); // J key: browser window to authorize the Joy-Con (once)
    // Joy-Con by default: at the first gesture (on the home screen), the authorization window opens by itself if no Joy-Con is authorized yet; afterwards Chrome remembers it and seek() opens them without a window
    const hidAuto = () => nav.hid && nav.hid.getDevices().then(l => { if (!l.some(JOYCON)) hidRequest(); }).catch(() => { });
    const seek = () => nav.hid ? nav.hid.getDevices().then(l => Promise.all(l.map(hidOpen))).catch(() => { }) : Promise.resolve(); // already authorized: no window
    if (nav.hid) {
      seek(); on(nav.hid, 'connect', seek);
      on(nav.hid, 'disconnect', e => { const n = hids.findIndex(p => p && p.dev === e.device); if (n >= 0) { const id = hids[n].hid; hids[n] = null; started(id); } });
    }

    // ---- the frame: c = { menu (the stick is worth arrow keys), home (any button is worth Enter), two (split screen) }
    function poll(c) {
      pads = [...(nav.getGamepads ? nav.getGamepads() : [])].filter(p => p && p.connected).concat(hids.filter(p => p));
      // presses this frame, all devices: { id, t }, t = key code or buttonEl number. This is "who just pressed" for enrolment, and the commands of an enrolled controller that is not the retained one.
      presses.length = 0; for (const a of viewed) presses.push(a); viewed.length = 0; // the same arrays from frame to frame, like the button state: nothing allocated without a press
      for (const p of pads) { const id = padId(p), w = padPrev[id] || (padPrev[id] = []); p.buttons.forEach((b, i) => { if (b.pressed && !w[i]) presses.push({ id, t: i }); w[i] = b.pressed; }); }
      // "input" = a button pressed or an axis moved away from its rest position (a trigger or a d-pad seen as an axis does not rest at 0)
      const active = p => { const r = padRest[padId(p)] = padRest[padId(p)] || [...p.axes]; return p.buttons.some(b => b.pressed) || p.axes.some((x, i) => Math.abs(x - r[i]) > 0.5); };
      pad = pads.find(p => padId(p) === kept) || null;
      if (!pad || !active(pad)) { const n = pads.find(active); if (n && n !== pad) { pad = n; kept = padId(n); if (!c.two) says('MANETTE CONNECTÉE'); } } // (with two players, the retained controller changes as soon as the other player presses: no announcement)
      // commands of the retained controller: one per key going down, d-pad, buttons and (in menus) stick merged
      const out = [], held = {}, ax = pad ? pad.axes : [0, 0];
      if (pad) pad.buttons.forEach((b, i) => { if (b.pressed && PADK[i]) held[PADK[i]] = 1; });
      if (c.home && pad && pad.buttons.some(b => b.pressed)) held.Enter = 1;
      // while driving, the stick is read as analog, not as arrows. Menus: left / right changes an option, so harder to trigger (0.85, and clearly more sideways than downward);
      // a held direction is released only below 0.4 (otherwise a stick trembling around the threshold repeats). Up / down stays at 0.6, if it dominates.
      if (c.menu) { const [x, y] = ax, h = Math.abs(x) > 2 * Math.abs(y), cutoff = k => padWas[k] ? 0.4 : k === 'ArrowLeft' || k === 'ArrowRight' ? 0.85 : 0.6;
        if (-y > cutoff('ArrowUp') && !h) held.ArrowUp = 1; if (y > cutoff('ArrowDown') && !h) held.ArrowDown = 1;
        if (-x > cutoff('ArrowLeft') && (h || padWas.ArrowLeft)) held.ArrowLeft = 1; if (x > cutoff('ArrowRight') && (h || padWas.ArrowRight)) held.ArrowRight = 1; }
      for (const k in held) if (!padWas[k]) out.push(cmd(k, kept));
      for (const k in padWas) if (!held[k]) delete padWas[k]; Object.assign(padWas, held);
      // With two players: the buttons of an enrolled controller that is not the retained one each also count as a command, under its own name: either one pauses and navigates
      if (c.two) for (const { id, t } of presses) if (id !== kept && PADK[t] && PLACES.includes(id)) out.push(cmd(PADK[t], id));
      return out;
    }
    // Split screen: each device that presses takes the first free place; + on a controller frees its place (no place: 'closes', the screen closes); both places taken, B makes it leave ('part').
    // A controller that leaves gives back its place. The keyboard (Esc, Enter) is read by game.js, on its keys.
    function enroll() {
      for (const { id, t } of presses) { const n = PLACES.indexOf(id), buttonEl = !(id in KBD), l = PLACES.indexOf('');
        if (buttonEl && t === 9) { if (n < 0) return 'closes'; PLACES[n] = ''; }
        else if (n < 0) { if (l >= 0) PLACES[l] = id; }
        else if (buttonEl && t === 0 && l < 0) return 'part'; }
      PLACES.forEach((p, i) => { if (p && !branch(p)) PLACES[i] = ''; });
      return '';
    }
    const forgets = () => { viewed.length = presses.length = 0; }; // the presses of the frame that opens enrolment do not take a place
    // Driving input of a device, and of it alone. Without a name: solo, the whole keyboard and the retained controller.
    // A named keyboard reads only its keys, and a named controller only itself: one player's controller must not drive the other's keyboard.
    const entering = id => {
      const p = id ? pads.find(p => padId(p) === id) : pad, K = KBD[id || 'keyboard'];
      const k = i => K && K[i].some(c => keys[c]) ? 1 : 0, b = i => p && p.buttons[i] ? p.buttons[i].value : 0, sx = p && Math.abs(p.axes[0]) > 0.15 ? p.axes[0] : 0;
      return {
        steer: clamp(k(1) - k(0) + b(15) - b(14) + sx, -1, 1),
        gas: k(2) || b(7) > 0.1 || b(0) || b(12) ? 1 : 0, brake: k(3) || b(6) > 0.1 || b(2) || b(13) ? 1 : 0, hand: !!(k(4) || b(1)), nitro: !!(k(5) || b(3)),
      };
    };
    return { keys, places: PLACES, keyboard, poll, enroll, forgets, entering, branch, hidRequest, hidAuto, seek, KBD };
  }
  if (typeof module === 'object' && module.exports) module.exports = Peripherals; else window.Peripherals = Peripherals;
})();
