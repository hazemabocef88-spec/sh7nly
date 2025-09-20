export default async function handler(req, res) {
  try {
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_OFFERS_TABLE = "AffiliateLinks" } = process.env;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_OFFERS_TABLE)}?filterByFormula={Active}=TRUE()`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }});
    const j = await r.json();
    const records = (j.records || []).map(x => ({
      id: x.id,
      Service: x.fields.Service,
      AffiliateURL: x.fields.AffiliateURL,
      CommissionPerClick: x.fields.CommissionPerClick || 0,
    }));
    res.status(200).json({ records });
  } catch {
    res.status(500).json({ error: "OFFERS_FAILED" });
  }
}
