// Server-side PayMob helper (no secrets in repo).
// This endpoint creates a PayMob payment token using environment variables.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { amount, currency = 'EGP', items = [], billing_data = {} } = req.body || {};
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
  const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
  const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
  const PAYMOB_CALLBACK_URL = process.env.PAYMOB_CALLBACK_URL;

  if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID) {
    res.status(500).json({ error: 'Payment provider not configured (missing env vars).' });
    return;
  }

  try {
    // 1) Authenticate to get a temporary token
    const authResp = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY })
    });
    const authJson = await authResp.json();
    const authToken = authJson && authJson.token;
    if (!authToken) throw new Error('Failed to obtain PayMob auth token');

    // 2) Create an order
    const orderPayload = {
      delivery_needed: false,
      amount_cents: Math.round(Number(amount) * 100),
      currency: currency,
      items: items
    };

    const orderResp = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const orderJson = await orderResp.json();
    const orderId = orderJson && (orderJson.id || orderJson.order && orderJson.order.id);
    if (!orderId) throw new Error('Failed to create order');

    // 3) Request a payment key
    const paymentKeyPayload = {
      amount_cents: Math.round(Number(amount) * 100),
      expiration: 3600,
      order_id: orderId,
      billing_data: billing_data,
      currency: currency,
      integration_id: Number(PAYMOB_INTEGRATION_ID),
      locked: false
    };

    const paymentKeyResp = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentKeyPayload)
    });
    const paymentKeyJson = await paymentKeyResp.json();
    const paymentToken = paymentKeyJson && paymentKeyJson.token;
    if (!paymentToken) throw new Error('Failed to create payment key');

    // 4) Build an iframe URL (if you have an iframe id) or return the token for client-side use
    const paymentUrl = PAYMOB_IFRAME_ID
      ? `https://accept.paymobsolutions.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`
      : (PAYMOB_CALLBACK_URL ? `${PAYMOB_CALLBACK_URL}?payment_token=${paymentToken}` : null);

    res.status(200).json({ payment_url: paymentUrl, payment_token: paymentToken, order_id: orderId });
  } catch (err) {
    console.error('PayMob integration error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Payment creation failed', detail: err && err.message ? err.message : String(err) });
  }
}