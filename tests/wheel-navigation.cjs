const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const source = read('js/wheel.js');
const routes = [...read('index.html').matchAll(/<a class="seg"[^>]*href="([^"]+)"[^>]*aria-label="([^"]+)"/g)].map(m => ({href:m[1], name:m[2]}));
assert.deepEqual(routes.map(r => r.name), ['Angry','Cute','Funny','Happy','Loved','Nostalgic','Sad','Scary','Special','Weird']);
for (const route of routes) {
  const page = read(route.href);
  assert.ok(page.includes('<h1>'+route.name+'</h1>'));
  assert.ok(page.includes('href="index.html"'));
}
for (const [pageName, id] of [['cute','drink-2'],['weird','drink-2'],['scary','drink-1']]) {
  const card = html => html.match(new RegExp('<li><article class="sauce-card" aria-labelledby="'+id+'">[\\s\\S]*?<\\/article><\\/li>'))[0];
  assert.equal(card(read(pageName+'.html')), card(read('drinks.html')));
}
for (const name of ['funny','happy','loved','nostalgic','sad','special']) {
  assert.ok(!read(name+'.html').includes('class="sauce-card"'));
}
function wheel() {
  const element = href => ({
    handlers: {}, classList: {add() {}, remove() {}}, style: {},
    addEventListener(name, fn) {this.handlers[name] = fn},
    getAttribute(name) {return name === 'href' ? href : null},
    blur() {}, matches() {return false}
  });
  const segments = routes.map(route => element(route.href));
  const spin = element(null), trigger = element(null);
  trigger.disabled = false;
  spin.querySelectorAll = () => segments;
  const timers = [], destinations = [], randomValues = [];
  const math = Object.create(Math);
  math.random = () => randomValues.length ? randomValues.shift() : .5;
  vm.runInNewContext(source, {
    document: {querySelector: selector => selector === '.spin' ? spin : trigger},
    window: {location: {assign: url => destinations.push(url)}},
    Math: math, getComputedStyle: () => ({transform: 'none', transitionDuration: '6s'}),
    setTimeout: (fn, ms) => timers.push({fn, ms}), requestAnimationFrame() {},
    performance: {now: () => 0}
  });
  const press = (i, key) => segments[i].handlers[key ? 'keydown' : 'click']({key, detail: 1, preventDefault() {}});
  return {spin, trigger, timers, destinations, randomValues, press};
}
for (let i = 0; i < routes.length; i++) {
  for (const key of [undefined, 'Enter', ' ']) {
    const w = wheel(); w.press(i, key);
    assert.deepEqual(w.destinations, [routes[i].href]);
    assert.equal(w.timers.length, 0);
  }
}
for (const jitter of [0, .5, .999]) {
  const w = wheel();
  for (let k = 9; k >= 0; k--) {
    const previous = w.destinations.length;
    w.randomValues.push((k + .5) / 10, jitter, .1);
    w.trigger.handlers.click();
    assert.equal(w.trigger.disabled, true);
    assert.equal(w.destinations.length, previous, 'Wait until the spin finishes');
    w.press(0, 'Enter');
    assert.equal(w.destinations.length, previous, 'Ignore activation while spinning');
    assert.equal(w.timers.length, 1);
    const angle = Number(w.spin.style.transform.match(/rotate\(([-\d.]+)deg\)/)[1]);
    assert.equal(((Math.round(-angle / 36) % 10) + 10) % 10, k);
    const timer = w.timers.shift();
    assert.equal(timer.ms, 6150);
    timer.fn();
    assert.equal(w.trigger.disabled, false);
    assert.equal(w.destinations.length, previous + 1);
    assert.equal(w.destinations.at(-1), routes[k].href);
  }
}
console.log('Passed: all 10 pages, assigned products, click/Enter/Space, centre spin, busy guard and all landings.');
