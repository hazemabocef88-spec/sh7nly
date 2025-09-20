export default async function handler(req, res) {
  try {
    const {
      AIRTABLE_API_KEY, AIRTABLE_BASE_ID,
      AIRTABLE_REFERRALS_TABLE = "Referrals",
      PAYOUT_THRESHOLD = "10"
    } = process.env;

    const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_REFERRALS_TABLE)}?pageSize=100`;
    let url = baseUrl, total = 0, count = 0, offset;

    do {
      const r = await fetch(offset ? `${baseUrl}&offset=${offset}` : baseUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      const j = await r.json();
      (j.records || []).forEach(rec => {
        total += Number(rec.fields.Earnings || 0);
        count += 1;
      });
      offset = j.offset;
    } while (offset);

    const threshold = Number(PAYOUT_THRESHOLD);
    res.status(200).json({ earnings: total, count, canPayout: total >= threshold });
  } catch {
    res.status(500).json({ error: "STATS_FAILED" });
  }
}
