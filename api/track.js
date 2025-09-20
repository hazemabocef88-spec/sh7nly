export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const {
      AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID,
      AIRTABLE_REFERRALS_TABLE = "Referrals",
      DEFAULT_USER = "Hazem"
    } = process.env;

    const { service, url } = req.body || {};
    if (!service || !url) return res.status(400).send("Missing service/url");

    // جلب عمولة العرض
    const offersUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/AffiliateLinks?filterByFormula=${encodeURIComponent(`{Service}="${service}"`)}`;
    const offersRes = await fetch(offersUrl, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }});
    const offersJson = await offersRes.json();
    const commission = offersJson.records?.[0]?.fields?.CommissionPerClick || 0;

    // إنشاء سجل إحالة
    const createUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_REFERRALS_TABLE)}`;
    const body = {
      records: [{
        fields: {
          User: DEFAULT_USER,
          Service: service,
          Clicks: 1,
          Earnings: Number(commission),
          Status: "Pending",
          URL: url,
          Timestamp: new Date().toISOString()
        }
      }]
    };
    await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ error: "TRACK_FAILED" });
  }
}
