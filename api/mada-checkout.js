const { createHash, createHmac, randomUUID, timingSafeEqual } = require('node:crypto');
const { products, delivery } = require('../data/mada-sandbox-products.json');

const apiBase = 'https://api.moyasar.com/v1';
const cookieName = '__Host-eyefeel-mada-test';
const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const oneHour = 60 * 60;

function sign(value, key) {
  return createHmac('sha256', key).update('eyefeel-mada-test-session:' + value).digest('base64url');
}

function readSession(req, key) {
  const cookie = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(cookieName + '='));
  if (!cookie) return null;
  const [data, signature, extra] = cookie.slice(cookieName.length + 1).split('.');
  if (!data || data.length > 400 || !/^[\w-]{43}$/.test(signature || '') || extra !== undefined) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(sign(data, key)))) return null;
  try {
    const session = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    return uuidPattern.test(session.invoiceId) && uuidPattern.test(session.reference) &&
      Number.isSafeInteger(session.amount) && session.amount >= 100 && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

async function requestInvoice(key, path, payload) {
  const headers = { Authorization: 'Basic ' + Buffer.from(key + ':').toString('base64'), Accept: 'application/json' };
  if (payload) headers['Content-Type'] = 'application/json';
  const response = await fetch(apiBase + path, {
    method: payload ? 'POST' : 'GET',
    headers,
    body: payload && JSON.stringify(payload),
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Moyasar invoice API returned HTTP ${response.status}`);
  return response.json();
}

function hostedUrl(invoice) {
  const url = new URL(invoice.url);
  const invoicePath = url.pathname.replace(/^\/invoices\//, '');
  if (url.hostname !== 'checkout.moyasar.com' || url.port || url.username || url.password ||
      !['http:', 'https:'].includes(url.protocol) || !uuidPattern.test(invoicePath) ||
      !url.pathname.startsWith('/invoices/') || url.hash) {
    throw new Error('Unexpected Moyasar checkout URL');
  }
  url.protocol = 'https:';
  return url.href;
}

function readCart(input) {
  if (!input?.items || typeof input.items !== 'object' || Array.isArray(input.items) ||
      typeof input.delivery !== 'string' || !Object.hasOwn(delivery, input.delivery)) return null;
  const entries = Object.entries(input.items);
  if (!entries.length || entries.length > Object.keys(products).length || entries.some(([id, quantity]) =>
    !Object.hasOwn(products, id) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10)) return null;
  entries.sort(([left], [right]) => left.localeCompare(right));
  const shipping = delivery[input.delivery];
  const amount = entries.reduce((sum, [id, quantity]) => sum + products[id].amount * quantity, shipping.amount);
  const labels = entries.map(([id, quantity]) => `${quantity} × ${products[id].name}`);
  const basket = createHash('sha256').update(JSON.stringify([entries, input.delivery])).digest('base64url');
  return { amount, basket, description: `Eyefeel test — ${labels.join(', ')} · ${shipping.name}` };
}

function paymentStatus(invoice, order) {
  if (invoice.id !== order.invoiceId || invoice.amount !== order.amount || invoice.currency !== 'SAR' ||
      invoice.metadata?.eyefeel_reference !== order.reference) {
    throw new Error('Moyasar invoice details do not match the checkout session');
  }
  if (invoice.status === 'paid') {
    const settledPayment = Array.isArray(invoice.payments) && invoice.payments.some(payment =>
      payment.status === 'paid' && payment.amount === order.amount && payment.currency === 'SAR' &&
      payment.refunded === 0 && payment.source?.type === 'creditcard' && payment.source.company === 'mada');
    return settledPayment ? 'paid' : 'unverified';
  }
  if (['refunded', 'canceled', 'expired', 'voided'].includes(invoice.status)) return 'closed';
  return 'pending';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const key = process.env.MOYASAR_TEST_SECRET_KEY;
  if (process.env.VERCEL_ENV === 'production' || !/^sk_test_\S+$/.test(key || '')) {
    return res.status(503).json({ error: 'Add the Moyasar sandbox key to enable test checkout.' });
  }

  try {
    const session = readSession(req, key);
    if (req.method === 'GET') {
      if (!session) return res.status(200).json({ status: 'ready' });
      const invoice = await requestInvoice(key, '/invoices/' + session.invoiceId);
      return res.status(200).json({ status: paymentStatus(invoice, session), reference: session.invoiceId });
    }

    const origins = [process.env.MOYASAR_SANDBOX_ORIGIN,
      ...[process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean).map(host => 'https://' + host)];
    const origin = req.headers.origin;
    if (!origin || !origins.includes(origin)) return res.status(403).json({ error: 'Open checkout from Eyefeel.' });
    if (String(req.headers['content-type']).split(';')[0].trim().toLowerCase() !== 'application/json') {
      return res.status(415).json({ error: 'Use the Eyefeel checkout form.' });
    }
    const cart = readCart(req.body);
    if (!cart) return res.status(400).json({ error: 'Select at least one product and a delivery option.' });

    const { amount, basket, description } = cart;
    if (session?.basket === basket && session.amount === amount) {
      const invoice = await requestInvoice(key, '/invoices/' + session.invoiceId);
      if (paymentStatus(invoice, session) === 'pending' && invoice.status === 'initiated' &&
          Date.parse(invoice.expired_at) > Date.now()) {
        return res.status(200).json({ checkoutUrl: hostedUrl(invoice) });
      }
    }

    const reference = randomUUID();
    const invoice = await requestInvoice(key, '/invoices', {
      amount,
      currency: 'SAR',
      description,
      success_url: origin + '/checkout.html?return=paid',
      back_url: origin + '/checkout.html?return=back',
      expired_at: new Date(Date.now() + 20 * 60000).toISOString(),
      metadata: { eyefeel_reference: reference },
    });
    if (!uuidPattern.test(invoice.id) || invoice.status !== 'initiated' || invoice.amount !== amount ||
        invoice.currency !== 'SAR' || invoice.metadata?.eyefeel_reference !== reference) {
      throw new Error('Unexpected result when creating test invoice');
    }
    const checkoutUrl = hostedUrl(invoice);
    const data = Buffer.from(JSON.stringify({ invoiceId: invoice.id, reference, amount, basket,
      expiresAt: Date.now() + oneHour * 1000 })).toString('base64url');
    res.setHeader('Set-Cookie', `${cookieName}=${data}.${sign(data, key)}; Path=/; Max-Age=${oneHour}; HttpOnly; Secure; SameSite=Lax`);
    return res.status(201).json({ checkoutUrl });
  } catch (error) {
    console.error('Eyefeel mada sandbox:', error.message);
    return res.status(502).json({ error: 'Moyasar is unavailable. Check the test configuration and try again.' });
  }
};
