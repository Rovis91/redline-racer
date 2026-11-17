// node test-devices.js — devices.js with a fake keyboard, fake gamepads (Gamepad API) and a fake Joy-Con (WebHID): menu commands, sign-up, second gamepad, disconnection, driving.
const assert = require('assert'), Peripherals = require('../src/engine/devices.js');
const buttonEl = () => ({ pressed: false, value: 0 });
const controller = index => ({ index, connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, buttonEl) });
const press = (p, i, v = 1) => { p.buttons[i].pressed = !!v; p.buttons[i].value = v; };
const casement = () => { const ec = {}; return { ec, addEventListener: (ev, f) => (ec[ev] = ec[ev] || []).push(f), emits: (ev, e) => (ec[ev] || []).forEach(f => f(e)) }; };
const rises = (o = {}) => { const pads = [], win = casement(), said = []; const P = Peripherals({ nav: { getGamepads: () => pads, hid: o.hid }, win, places: ['', ''], says: s => said.push(s) }); return { P, pads, win, said }; };
const codes = l => l.map(c => (c.code || c.key) + '@' + c.periph);
const MENU = { menu: true, home: false, two: false };

(async () => {
  // solo: the gamepad that presses becomes the lead, its buttons and its stick (in the menus) count as keys, once per press
  { const { P, pads, said } = rises(), a = controller(0); pads.push(a);
    assert.deepStrictEqual(P.poll(MENU), []);
    press(a, 0); assert.deepStrictEqual(codes(P.poll(MENU)), ['Enter@controller0']); assert.deepStrictEqual(said, ['MANETTE CONNECTÉE']);
    assert.deepStrictEqual(P.poll(MENU), [], 'a held button does not repeat');
    press(a, 0, 0); a.axes[1] = -1; assert.deepStrictEqual(codes(P.poll(MENU)), ['ArrowUp@controller0'], 'stick = arrows in the menus');
    a.axes[1] = 0; press(a, 10); assert.deepStrictEqual(codes(P.poll(MENU)), ['c@controller0'], 'radio');
    press(a, 10, 0); a.axes[0] = -1; assert.deepStrictEqual(P.poll({ menu: false, two: false }), [], 'in a race, the stick does not count as arrows');
    assert.strictEqual(P.entering('').steer, -1, 'stick = volant');
    a.axes[0] = 0; press(a, 3); assert.deepStrictEqual(codes(P.poll({ menu: false, home: true })), ['Enter@controller0'], "on the start screen, any button counts as Enter");
  }
  // keyboard: solo driving (arrows + ZQSD), left and right keyboard, each with its own keys; the solo gamepad is added to them
  { const { P, pads, win } = rises(), a = controller(0); pads.push(a);
    const tape = code => P.keyboard({ code }), letGo = code => win.emits('keyup', { code });
    tape('KeyW'); tape('ArrowRight'); P.poll(MENU);
    assert.deepStrictEqual(P.entering(''), { steer: 1, gas: 1, brake: 0, hand: false, nitro: false });
    assert.deepStrictEqual(P.entering('keyboardLeft'), { steer: 0, gas: 1, brake: 0, hand: false, nitro: false });
    assert.deepStrictEqual(P.entering('keyboardRight'), { steer: 1, gas: 0, brake: 0, hand: false, nitro: false });
    letGo('KeyW'); tape('Slash'); tape('ShiftRight'); assert.deepStrictEqual(P.entering('keyboardRight'), { steer: 1, gas: 0, brake: 0, hand: true, nitro: true });
    win.emits('blur'); assert.deepStrictEqual(P.entering(''), { steer: 0, gas: 0, brake: 0, hand: false, nitro: false }, 'everything is released when leaving the window');
    press(a, 14); press(a, 12); P.poll({ menu: false }); assert.deepStrictEqual([P.entering('').steer, P.entering('').gas], [-1, 1], 'gamepad d-pad in solo');
    assert.strictEqual(P.entering('keyboardLeft').gas, 0, "the gamepad does not drive the left keyboard");
  }
  // sign-up: each takes the first free seat, + frees its seat, B starts once both slots are taken; + with no seat free closes the screen
  { const { P, pads } = rises(), a = controller(0), b = controller(1); pads.push(a, b);
    P.keyboard({ code: 'KeyA' }); P.poll(MENU); assert.strictEqual(P.enroll(), ''); assert.deepStrictEqual(P.places, ['keyboardLeft', '']);
    P.keyboard({ code: 'KeyA', repeat: true }); P.poll(MENU); P.enroll(); assert.deepStrictEqual(P.places, ['keyboardLeft', ''], 'a repeated key does not count');
    press(b, 2); P.poll(MENU); P.enroll(); assert.deepStrictEqual(P.places, ['keyboardLeft', 'controller1']);
    press(a, 2); P.poll(MENU); P.enroll(); assert.deepStrictEqual(P.places, ['keyboardLeft', 'controller1'], 'plus de place libre');
    press(a, 2, 0); press(a, 9); P.poll(MENU); assert.strictEqual(P.enroll(), 'closes', '+ with no seat free closes');
    press(a, 9, 0); press(b, 9); P.poll(MENU); P.enroll(); assert.deepStrictEqual(P.places, ['keyboardLeft', ''], '+ frees its seat');
    press(b, 9, 0); press(b, 2, 0); press(b, 1); P.poll(MENU); P.enroll(); assert.deepStrictEqual(P.places, ['keyboardLeft', 'controller1']);
    press(b, 1, 0); press(b, 0); P.poll(MENU); assert.strictEqual(P.enroll(), 'part', 'B starts, both seats taken');
    press(b, 0, 0); P.keyboard({ code: 'ArrowUp' }); P.forgets(); P.poll(MENU); P.enroll(); assert.deepStrictEqual(P.places, ['keyboardLeft', 'controller1'], 'forgets: presses already made do not take a seat');
  }
  // second gamepad, in two-player: its buttons count as a command under its own name (not only those of the lead), its driving reads only it; then it leaves
  { const { P, pads, win, said } = rises(), a = controller(0), b = controller(1); pads.push(a, b); P.places[0] = 'controller0'; P.places[1] = 'controller1';
    const TWO = { menu: false, two: true };
    press(a, 7, 1); P.poll(TWO); // gamepad 0 becomes the lead
    press(b, 5); press(b, 0); a.axes[0] = 0.8;
    const l = codes(P.poll(TWO)); // the lead is always 0 (it still has one input): 1 goes through the presses
    assert.deepStrictEqual(l.sort(), ['Enter@controller1', 'KeyE@controller1']);
    assert.deepStrictEqual(P.entering('controller0'), { steer: 0.8, gas: 1, brake: 0, hand: false, nitro: false });
    assert.deepStrictEqual(P.entering('controller1'), { steer: 0, gas: 1, brake: 0, hand: false, nitro: false });
    assert.deepStrictEqual(said, [], "in two-player, no lead gamepad announcement");
    const c = controller(2); pads.push(c); press(c, 5); assert.deepStrictEqual(codes(P.poll(TWO)), [], "a gamepad with no seat sends nothing");
    pads.splice(pads.indexOf(b), 1); win.emits('gamepaddisconnected', { gamepad: b }); P.poll(TWO);
    assert(!P.branch('controller1') && P.branch('controller0') && P.branch('keyboardRight'), 'gamepad 1 has left');
    assert.deepStrictEqual(P.entering('controller1'), { steer: 0, gas: 0, brake: 0, hand: false, nitro: false });
    P.enroll(); assert.deepStrictEqual(P.places, ['controller0', ''], 'a gamepad that leaves gives back its seat');
    pads.splice(pads.indexOf(a), 1); win.emits('gamepaddisconnected', { gamepad: a }); assert.deepStrictEqual(said, ['MANETTE DÉCONNECTÉE'], 'the leaving lead is announced');
  }
  // Joy-Con (WebHID): report 0x3f, throttle, radio on Home / Capture, stick in 8 directions, then unplugged
  { const ec = {}, listeners = [], dev = { productId: 0x2007, opened: false, open: async () => { dev.opened = true; }, addEventListener: (ev, f) => ev === 'inputreport' && listeners.push(f) }, report = e => listeners.forEach(f => f(e));
    const hid = { getDevices: async () => [dev], requestDevice: async () => [dev], addEventListener: (ev, f) => { ec[ev] = f; } };
    const { P } = rises({ hid }); await P.seek();
    const { P: other } = rises({ hid: { ...hid, addEventListener: () => { } } }); await other.seek(); // another map built afterwards: the Joy-Con must still respond to the first
    const sendMsg = (b0, b1, h) => report({ reportId: 0x3f, data: new DataView(new Uint8Array([b0, b1, h]).buffer) });
    sendMsg(8, 0, 8); assert.deepStrictEqual(codes(P.poll(MENU)), ['Enter@joycon0'], 'throttle and confirm');
    assert.strictEqual(P.entering('joycon0').gas, 1);
    sendMsg(0, 16, 8); assert.deepStrictEqual(codes(P.poll(MENU)), ['c@joycon0'], 'Home = radio');
    sendMsg(0, 32, 8); P.poll(MENU); sendMsg(0, 0, 8); P.poll(MENU); sendMsg(0, 32, 8); assert.deepStrictEqual(codes(P.poll(MENU)), ['c@joycon0'], 'Capture = radio');
    sendMsg(0, 0, 2); P.poll({ menu: false }); assert.strictEqual(P.entering('joycon0').steer, 1, 'stick to the right');
    const sends = []; dev.sendReport = async (id, b) => sends.push([id, b[9], b[10]]);
    report({ reportId: 0x30, data: new DataView(new ArrayBuffer(48)) }); report({ reportId: 0x30, data: new DataView(new ArrayBuffer(48)) });
    assert.deepStrictEqual(sends, [[1, 3, 0x3f]], 'report 0x30: asks for mode 0x3f again, once');
    ec.disconnect({ device: dev }); P.poll(MENU); assert(!P.branch('joycon0'), 'Joy-Con unplugged');
  }
  console.log('devices: OK');
})().catch(e => { console.error(e); process.exit(1); });
