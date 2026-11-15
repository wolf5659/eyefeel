(() => {
  const form = document.querySelector('#checkout');
  const productGroup = document.querySelector('#checkout-products');
  const deliverySelect = document.querySelector('#checkout-delivery');
  const total = document.querySelector('#checkout-total');
  const status = document.querySelector('#checkout-status');
  const submit = form.querySelector('button');
  const format = new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', currencyDisplay: 'code' });
  const api = '/api/mada-checkout';
  const testReturn = new URLSearchParams(location.search).has('return');

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function formatAmount(amount) {
    return format.format(amount / 100);
  }

  async function initialize() {
    const catalogResponse = await fetch('/data/mada-sandbox-products.json');
    if (!catalogResponse.ok) throw new Error('The checkout catalog is unavailable.');
    const { products, delivery } = await catalogResponse.json();
    const quantities = new Map();
    for (const [id, product] of Object.entries(products)) {
      const row = document.createElement('div');
      row.className = 'checkout-product';
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = product.name;
      const price = document.createElement('span');
      price.textContent = formatAmount(product.amount);
      label.append(price);
      const quantity = document.createElement('input');
      quantity.id = id;
      quantity.type = 'number';
      quantity.min = 0;
      quantity.max = 10;
      quantity.step = 1;
      quantity.value = '0';
      quantity.required = true;
      quantity.setAttribute('aria-label', `${product.name} quantity`);
      row.append(label, quantity);
      productGroup.append(row);
      quantities.set(id, quantity);
    }
    for (const [id, option] of Object.entries(delivery)) {
      const label = option.amount ? `${option.name} · ${formatAmount(option.amount)}` : 'Free pickup';
      deliverySelect.add(new Option(label, id));
    }

    let ready = false;
    let submitting = false;
    function cart() {
      return Object.fromEntries([...quantities].map(([id, input]) => [id, input.valueAsNumber])
        .filter(([, count]) => Number.isInteger(count) && count > 0));
    }

    function updateTotal() {
      const items = Object.entries(cart());
      const subtotal = items.reduce((sum, [id, count]) => sum + products[id].amount * count, 0);
      total.value = formatAmount(subtotal ? subtotal + delivery[deliverySelect.value].amount : 0);
      submit.disabled = !ready || submitting || !items.length;
    }

    form.addEventListener('input', updateTotal);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled) return;
      submitting = true;
      updateTotal();
      showStatus('Opening Moyasar…');
      try {
        const response = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart(), delivery: deliverySelect.value }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Checkout is unavailable.');
        location.assign(data.checkoutUrl);
      } catch (error) {
        showStatus(error.message);
        submitting = false;
        updateTotal();
      }
    });

    updateTotal();
    form.hidden = false;
    const response = await fetch(api);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Checkout is unavailable.');
    ready = true;
    updateTotal();
    if (testReturn) {
      const messages = {
        paid: `Mada test payment verified. Invoice ${result.reference}.`,
        ready: 'The test session has expired. Start a new checkout to try again.',
        pending: 'The test invoice is awaiting payment. Refresh to check again.',
        unverified: 'Moyasar reports a paid invoice. The payment could not be verified as mada.',
        closed: 'The test invoice is closed. Start a new checkout to try again.',
      };
      showStatus(messages[result.status]);
    }
  }

  initialize().catch(error => showStatus(error.message));
})();
