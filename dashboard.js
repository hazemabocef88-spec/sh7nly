const API = {
  offers: "/.netlify/functions/offers",
  track: "/.netlify/functions/track",
  stats: "/.netlify/functions/stats",
  payout: "/.netlify/functions/payout",
};

const dom = (id) => document.getElementById(id);
const fmt = (n) => Number(n || 0).toFixed(2);

async function loadStats() {
  const r = await fetch(API.stats);
  const d = await r.json();
  dom("referralCount").textContent = d.count ?? 0;
  dom("earnings").textContent = fmt(d.earnings);
  dom("payoutBtn").disabled = !(d.canPayout === true);
}

async function loadOffers() {
  const ul = dom("offers");
  ul.innerHTML = '<li class="muted">جاري التحميل...</li>';
  const r = await fetch(API.offers);
  const data = await r.json();
  ul.innerHTML = "";

  data.records.forEach((o) => {
    const li = document.createElement("li");
    li.className = "offer";
    li.innerHTML = `
      <div class="meta">
        <span class="service">${o.Service}</span>
        <span class="commission">عمولة لكل نقرة: ${fmt(o.CommissionPerClick)} جنيه</span>
      </div>
      <div class="actions">
        <a href="#" class="btn primary" data-url="${o.AffiliateURL}" data-service="${o.Service}">اذهب للعرض</a>
      </div>
    `;
    li.querySelector("a").addEventListener("click", async (e) => {
      e.preventDefault();
      const url = e.currentTarget.getAttribute("data-url");
      const service = e.currentTarget.getAttribute("data-service");
      try {
        await fetch(API.track, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service, url }),
        });
      } catch (_) {}
      window.open(url, "_blank", "noopener");
      setTimeout(loadStats, 500);
    });
    ul.appendChild(li);
  });

  const siteUrl = location.origin;
  dom("shareWhatsapp").href = `https://wa.me/?text=${encodeURIComponent("جرب العروض عبر Sh7nly: " + siteUrl)}`;
  dom("shareTelegram").href = `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent("أفضل عروض Sh7nly")}`;
  dom("shareFacebook").href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`;
}

async function handlePayout() {
  const el = dom("payoutStatus");
  el.textContent = "جارٍ إنشاء طلب التحويل...";
  dom("payoutBtn").disabled = true;
  try {
    const r = await fetch(API.payout, { method: "POST" });
    const d = await r.json();
    if (r.ok && d.success) {
      el.textContent = "تم إنشاء طلب التحويل بنجاح ✅";
    } else {
      el.textContent = d.message || "تعذر تنفيذ التحويل.";
      dom("payoutBtn").disabled = false;
    }
  } catch (e) {
    el.textContent = "خطأ غير متوقع أثناء التحويل.";
    dom("payoutBtn").disabled = false;
  }
  setTimeout(loadStats, 700);
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadStats(), loadOffers()]);
  dom("payoutBtn").addEventListener("click", handlePayout);
});
