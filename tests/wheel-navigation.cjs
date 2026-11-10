const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const source = read('js/wheel.js');
const routes = [...read('index.html').matchAll(/<a class="seg"[^>]*data-href="([^"]+)"[^>]*aria-label="([^"]+)"/g)].map(m => ({href:m[1], name:m[2]}));
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
for (const name of ['funny','happy','loved','sad','special']) {
  assert.ok(!read(name+'.html').includes('class="sauce-card"'));
}
const segmentTags = [...read('index.html').matchAll(/<a class="seg"[^>]+>/g)].map(m => m[0]);
assert.ok(segmentTags.every(tag => !/(?:^|\s)href=/.test(tag) && tag.includes('tabindex="-1"')));
function wheel() {
  let focused = null;
  const element = attributes => ({
    attributes: {...attributes}, handlers: {}, style: {},
    classList: {values:new Set(), add(name) {this.values.add(name)}, remove(name) {this.values.delete(name)}, contains(name) {return this.values.has(name)}},
    addEventListener(name, fn) {this.handlers[name] = fn},
    getAttribute(name) {return this.attributes[name] ?? null},
    setAttribute(name, value) {this.attributes[name] = value},
    removeAttribute(name) {delete this.attributes[name]},
    closest(selector) {return selector === '.seg' && this.attributes['data-href'] || selector === '.spin-trigger' && this.isTrigger ? this : null},
    focus() {focused = this}
  });
  const segments = routes.map(route => {
    const g = element({'data-href':route.href, 'aria-label':route.name, tabindex:'-1', 'aria-disabled':'true'});
    const text = element({x:'50',y:'20'});
    g.querySelector = () => text;
    return g;
  });
  const spin = element({}), trigger = element({}), status = element({}), disc = element({}), art = element({});
  spin.parentElement = disc;
  trigger.isTrigger = true;
  trigger.disabled = false;
  spin.querySelectorAll = () => segments;
  const timers = [], destinations = [], randomValues = [];
  const math = Object.create(Math);
  math.random = () => randomValues.length ? randomValues.shift() : .5;
  vm.runInNewContext(source, {
    document: {querySelector: selector => ({'.spin':spin,'.spin-trigger':trigger,'.wheel-status':status})[selector]},
    window: {location: {assign: url => destinations.push(url)}},
    Math: math, getComputedStyle: () => ({transform:'none',transitionDuration:'6s'}),
    setTimeout: (fn, ms) => timers.push({fn,ms}), requestAnimationFrame() {},
    performance: {now: () => 0}
  });
  const event = target => ({target,detail:1,preventDefault() {}});
  const press = (i,key) => {const e={...event(segments[i]),key};segments[i].handlers[key ? 'keydown' : 'click'](e);if(!key)disc.handlers.click(e)};
  const centre = () => {const e=event(trigger);trigger.handlers.click(e);disc.handlers.click(e)};
  const surface = () => disc.handlers.click(event(art));
  return {spin,trigger,status,segments,timers,destinations,randomValues,press,centre,surface,focused:() => focused};
}
for (let i = 0; i < routes.length; i++) {
  for (const key of [undefined,'Enter',' ']) {
    const w=wheel();w.press(i,key);
    assert.equal(w.destinations.length,0,'Unselected sections never open pages');
    assert.equal(w.timers.length,key ? 0 : 1,'Pointer clicks spin; inactive sections are not keyboard buttons');
  }
}
const surface=wheel();surface.surface();
assert.equal(surface.timers.length,1,'Clicking the wheel artwork starts a spin');
assert.equal(surface.destinations.length,0);
for (const jitter of [0,.5,.999]) {
  const w = wheel();
  for (let k = 9; k >= 0; k--) {
    const previous = w.destinations.length;
    w.randomValues.push((k+.5)/10,jitter,.1);
    k % 2 ? w.centre() : w.surface();
    assert.equal(w.trigger.disabled,true);
    assert.ok(w.segments.every(g => !g.getAttribute('href') && g.getAttribute('tabindex') === '-1' && !g.classList.contains('won')),'Clear the previous choice on every new spin');
    for (let i = 0; i < routes.length; i++) w.press(i,'Enter');
    assert.equal(w.destinations.length,previous,'Nothing can open during the spin');
    const angle = Number(w.spin.style.transform.match(/rotate\(([-\d.]+)deg\)/)[1]);
    assert.equal(((Math.round(-angle/36)%10)+10)%10,k);
    const timer = w.timers.shift();
    assert.equal(timer.ms,6150); timer.fn();
    assert.equal(w.trigger.disabled,false);
    assert.equal(w.destinations.length,previous,'Never redirect automatically after landing');
    assert.equal(w.segments.filter(g => g.getAttribute('href')).length,1);
    assert.equal(w.segments[k].getAttribute('href'),routes[k].href);
    assert.equal(w.segments[k].getAttribute('tabindex'),'0');
    assert.equal(w.segments[k].getAttribute('aria-disabled'),'false');
    assert.ok(w.segments[k].classList.contains('won'));
    assert.equal(w.focused(),w.segments[k]);
    assert.ok(w.status.textContent.includes(routes[k].name));
    for (let i = 0; i < routes.length; i++) {
      if (i !== k) for (const key of ['Enter',' ']) w.press(i,key);
    }
    assert.equal(w.destinations.length,previous,'Other sections remain inactive as keyboard links');
    for (const key of [undefined,'Enter',' ']) w.press(k,key);
    assert.equal(w.destinations.length,previous+3);
    assert.ok(w.destinations.slice(previous).every(href => href === routes[k].href));
    assert.equal(w.timers.length,0,'Opening the selected feeling must not also start a spin');
  }
}
const restart=wheel();restart.randomValues.push(.05,.5,.1);restart.centre();restart.timers.shift().fn();
assert.equal(restart.segments[0].getAttribute('href'),'angry.html');
restart.press(1);
assert.equal(restart.destinations.length,0,'Clicking another section spins instead of opening its page');
assert.equal(restart.timers.length,1);
assert.ok(restart.segments.every(g=>!g.getAttribute('href')),'A new wheel click clears the old choice');
console.log('Passed: artwork and section clicks spin, centre click fires once, selected link opens without spinning, busy guard, reset and all 10 outcomes.');
