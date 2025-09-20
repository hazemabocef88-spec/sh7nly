// Simple Next.js API: creates a withdrawal request in Airtable
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, amount, currency = 'EGP', note } = req.body || {};
  const walletNumber = process.env.PAYEE_WALLET_NUMBER;
  const minAmount = 10;

  if (!walletNumber) {
    return res.status(500).json({ error: 'Server not configured: missing PAYEE_WALLET_NUMBER' });
  }

  if (!amount || Number(amount) < minAmount) {
    return res.status(400).json({ error: `Minimum withdrawal is ${minAmount} ${currency}` });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Withdrawals';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable is not configured' });
  }

  const body = {
    fields: {
      Name: name || 'Anonymous',
      Amount: Number(amount),
      Currency: currency,
      WalletNumber: walletNumber,
      Note: note || '',
      Status: 'Pending',
      CreatedAt: new Date().toISOString()
    }
  };

  try {
    const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(500).json({ error: 'Airtable error', details: data });
    }
    return res.status(201).json({ ok: true, record: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
