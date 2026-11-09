const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/wheel.js'), 'utf8');
function wheel() {
  const element = (href) => ({
    handlers: {}, classList: {add() {}, remove() {}}, style: {},
    addEventListener(name, fn) {this.handlers[name] = fn},
    getAttribute(name) {return name === 'href' ? href : null},
    blur() {}, matches() {return false}
  });
  const segments = Array.from({length: 10}, (_, i) => element(i === 0 ? 'angry.html' : null));
  const spin = element(null);
  spin.querySelectorAll = () => segments;
  const timers = [], destinations = [], randomValues = [];
  const math = Object.create(Math);
  math.random = () => randomValues.length ? randomValues.shift() : .5;
  vm.runInNewContext(source, {
    document: {querySelector: () => spin},
    window: {location: {assign: url => destinations.push(url)}},
    Math: math, getComputedStyle: () => ({transform: 'none', transitionDuration: '6s'}),
    setTimeout: (fn, ms) => timers.push({fn, ms}), requestAnimationFrame() {},
    performance: {now: () => 0}
  });
  const press = (i, key) => segments[i].handlers[key ? 'keydown' : 'click']({key, detail: 1, preventDefault() {}});
  return {segments, spin, timers, destinations, randomValues, press};
}
for (const key of [undefined, 'Enter', ' ']) {
  const w = wheel(); w.press(0, key);
  assert.deepEqual(w.destinations, ['angry.html']);
  assert.equal(w.timers.length, 0);
}
for (const jitter of [0, .5, .999]) {
  const w = wheel();
  // Repeated spins test the accumulated rotation as well as all ten landings.
  for (let k = 9; k >= 0; k--) {
    w.randomValues.push((k + .5) / 10, jitter, .1);
    w.press(1);
    assert.equal(w.destinations.length, 0, 'Never navigate before the spin finishes');
    w.press(0, 'Enter');
    assert.equal(w.destinations.length, 0, 'Ignore activation while spinning');
    assert.equal(w.timers.length, 1);
    const angle = Number(w.spin.style.transform.match(/rotate\(([-\d.]+)deg\)/)[1]);
    const actualLanding = ((Math.round(-angle / 36) % 10) + 10) % 10;
    assert.equal(actualLanding, k);
    const timer = w.timers.shift();
    assert.equal(timer.ms, 6150);
    timer.fn();
    assert.deepEqual(w.destinations, k === 0 ? ['angry.html'] : []);
  }
}
console.log('Passed: direct click/Enter/Space, busy guard, all 10 landings, jitter and repeated spins.');
