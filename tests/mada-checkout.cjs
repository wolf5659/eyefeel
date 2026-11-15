const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const test = require('node:test');
const checkout = require('../api/mada-checkout');

test('Moyasar sandbox creates and verifies server-priced mada invoices', async t => {
  const origin = 'https://eyefeel-preview.example';
  const key = 'sk_test_mock';
  const invoices = new Map();
  let invoiceCreates = 0;
  process.env.VERCEL_ENV = 'preview';
  process.env.MOYASAR_SANDBOX_ORIGIN = origin;
  process.env.MOYASAR_TEST_SECRET_KEY = key;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.headers.Authorization, 'Basic ' + Buffer.from(key + ':').toString('base64'));
    assert.equal(new URL(url).origin, 'https://api.moyasar.com');
    if (options.method === 'POST') {
      invoiceCreates++;
      assert.equal(new URL(url).pathname, '/v1/invoices');
      const request = JSON.parse(options.body);
      assert.equal(request.success_url, origin + '/checkout.html?return=paid');
      const id = randomUUID();
      const invoice = { ...request, id, status: 'initiated', url: `https://checkout.moyasar.com/invoices/${id}` };
      invoices.set(id, invoice);
      return Response.json(invoice, { status: 201 });
    }
    const invoice = invoices.get(new URL(url).pathname.split('/').at(-1));
    return invoice ? Response.json(invoice) : Response.json({}, { status: 404 });
  });

  async function call(method, { body, cookie, requestOrigin = origin } = {}) {
    const result = { headers: {} };
    const response = {
      setHeader(name, value) { result.headers[name] = value; },
      status(code) { result.code = code; return this; },
      json(data) { result.data = data; },
    };
    await checkout({ method, headers: { origin: requestOrigin, cookie, 'content-type': 'application/json' }, body }, response);
    return result;
  }

  const cart = { items: { 'citrus-hysteria': 2, 'crimson-potion': 1 }, delivery: 'jeddah', amount: 1 };
  assert.equal((await call('POST', { body: cart, requestOrigin: 'https://unrelated.example' })).code, 403);
  assert.equal((await call('POST', { body: { ...cart, items: { unknown: 1 } } })).code, 400);
  assert.equal((await call('POST', { body: { ...cart, delivery: 'unknown' } })).code, 400);

  const initial = await call('POST', { body: cart });
  assert.equal(initial.code, 201);
  const [invoice] = invoices.values();
  assert.equal(invoice.amount, 12000);
  assert.equal(invoice.currency, 'SAR');
  assert.equal(initial.data.checkoutUrl, invoice.url);
  assert.match(initial.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Lax/);
  const cookie = initial.headers['Set-Cookie'].split(';')[0];
  assert.equal((await call('GET', { cookie })).data.status, 'pending');
  assert.equal((await call('GET', { cookie: cookie + 'x' })).data.status, 'ready');
  assert.equal((await call('POST', { body: cart, cookie })).data.checkoutUrl, invoice.url);
  assert.equal(invoiceCreates, 1);

  invoice.status = 'paid';
  const payment = { status: 'paid', amount: invoice.amount, currency: 'SAR', refunded: 0,
    source: { type: 'creditcard', company: 'visa' } };
  invoice.payments = [payment];
  assert.equal((await call('GET', { cookie })).data.status, 'unverified');
  payment.source.company = 'mada';
  assert.equal((await call('GET', { cookie })).data.status, 'paid');
  payment.refunded = 100;
  assert.equal((await call('GET', { cookie })).data.status, 'unverified');

  for (const [delivery, amount] of [['pickup', 9500], ['saudi', 14000]]) {
    const result = await call('POST', { body: { ...cart, delivery } });
    const id = new URL(result.data.checkoutUrl).pathname.split('/').at(-1);
    assert.equal(invoices.get(id).amount, amount);
  }
  process.env.MOYASAR_TEST_SECRET_KEY = 'sk_live_mock';
  assert.equal((await call('POST', { body: cart })).code, 503);
  process.env.MOYASAR_TEST_SECRET_KEY = key;
  process.env.VERCEL_ENV = 'production';
  assert.equal((await call('POST', { body: cart })).code, 503);
  assert.equal(invoiceCreates, 3);
});
