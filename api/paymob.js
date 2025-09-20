async function computeTotals() {
  const {
    AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_REFERRALS_TABLE = "Referrals"
  } = process.env;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_REFERRALS_TABLE)}?filterByFormula=${encodeURIComponent(`{Status}!="Transferred"`)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }});
  const j = await r.json();
  const records = j.records || [];
  const total = records.reduce((s, rec) => s + Number(rec.fields.Earnings || 0), 0);
  return { total, records };
}

async function markTransferred(ids) {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_REFERRALS_TABLE = "Referrals" } = process.env;
  if (!ids.length) return;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_REFERRALS_TABLE)}`;
  const body = {
    records: ids.map(id => ({ id, fields: { Status: "Transferred" } }))
  };
  await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const {
      AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_PAYOUTS_TABLE = "Payouts",
      PAYOUT_THRESHOLD = "10",
      PAYMOB_API_BASE = "https://accept.paymob.com/api",
      PAYMOB_API_KEY, PAYMOB_WALLET_NUMBER, PAYMOB_MERCHANT_ID
    } = process.env;

    const { total, records } = await computeTotals();
    const threshold = Number(PAYOUT_THRESHOLD);
    if (total < threshold) {
      return res.status(400).json({ success: false, message: "الرصيد أقل من الحد الأدنى للتحويل." });
    }

    // سجل طلب تحويل في Airtable
    const payoutsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_PAYOUTS_TABLE)}`;
    const createRes = await fetch(payoutsUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        records: [{
          fields: {
            Amount: Number(total),
            Status: "Initiated",
            Destination: PAYMOB_WALLET_NUMBER || "N/A",
            Timestamp: new Date().toISOString()
          }
        }]
      })
    });
    const created = await createRes.json();
    const payoutId = created.records?.[0]?.id;

    // تكامل PayMob الحقيقي (استبدل النموذج وفق منتج حسابك: Wallet / Bank Disbursement)

    // مثال: الحصول على توكن
    // const auth = await fetch(`${PAYMOB_API_BASE}/auth/tokens`, {
    //   method: "POST",
    //   headers: { "Content-Type":"application/json" },
    //   body: JSON.stringify({ api_key: PAYMOB_API_KEY })
    // }).then(r => r.json());
    // const token = auth.token;

    // TODO: نفّذ استدعاء التحويل المناسب لمنتجك وأرجِع نتيجة success/failure
    const paymobSuccess = true;

    if (paymobSuccess) {
      await markTransferred(records.map(x => x.id));
      await fetch(payoutsUrl, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type":"application/json" },
        body: JSON.stringify({ records: [{ id: payoutId, fields: { Status: "Success" } }] })
      });
      return res.status(200).json({ success: true });
    } else {
      await fetch(payoutsUrl, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type":"application/json" },
        body: JSON.stringify({ records: [{ id: payoutId, fields: { Status: "Failed" } }] })
      });
      return res.status(500).json({ success: false, message: "فشل طلب PayMob." });
    }
  } catch {
    return res.status(500).json({ success: false, message: "خطأ غير متوقع أثناء التحويل." });
  }
}
