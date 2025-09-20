// Kangaroo builder + simple marketplace simulation + affiliate/referral mini-dashboard
// البيانات تُخزن محليًا في localStorage، والمبيعات محاكاة لعرض طريقة تحقيق الدخل.

(function () {
  const form = document.getElementById('kangarooForm');
  const nameInput = document.getElementById('name');
  const bodyColorInput = document.getElementById('bodyColor');
  const bellyColorInput = document.getElementById('bellyColor');
  const scaleSelect = document.getElementById('scale');
  const pocketInput = document.getElementById('pocket');
  const priceInput = document.getElementById('price');
  const createBtn = document.getElementById('createBtn');
  const listBtn = document.getElementById('listBtn');

  const preview = document.getElementById('kangarooPreview');
  const previewInfo = document.getElementById('previewInfo');

  const listingsEl = document.getElementById('listings');
  const balanceEl = document.getElementById('balance');
  const withdrawBtn = document.getElementById('withdrawBtn');
  const totalCreatedEl = document.getElementById('totalCreated');
  const totalSalesEl = document.getElementById('totalSales');

  // Affiliate panel elements
  const referralsEl = document.getElementById('referrals');
  const earningsEl = document.getElementById('earnings');
  const payoutBtn = document.getElementById('payoutBtn');
  const simulateReferralBtn = document.getElementById('simulateReferralBtn');

  const STORAGE_KEY = 'sh7nly_kangaroos_v1';

  let state = {
    listings: [],
    balance: 0,
    totalCreated: 0,
    totalSales: 0,
    // affiliate/referral state (persisted)
    referrals: 0,
    affiliateEarnings: 0.0
  };

  // --- helpers ---
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(state, parsed);
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
  }

  function formatUSD(v) {
    return Number(v || 0).toFixed(2);
  }

  function formatEGP(v) {
    return Number(v || 0).toFixed(2);
  }

  function generateId() {
    return 'k-' + Math.random().toString(36).slice(2, 9);
  }

  // --- Kangaroo SVG generator ---
  function renderKangarooSVG({ bodyColor, bellyColor, scale = 1 }) {
    const svg = `
      <svg width="${220 * scale}" height="${160 * scale}" viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.15"/>
          </filter>
        </defs>

        <!-- tail -->
        <path filter="url(#shadow)" d="M30 95 C10 95 0 120 20 122 C42 125 60 108 78 102" fill="${bodyColor}" stroke="${bodyColor}" stroke-width="1"/>

        <!-- body -->
        <ellipse cx="110" cy="86" rx="48" ry="40" fill="${bodyColor}" />

        <!-- belly -->
        <ellipse cx="110" cy="96" rx="30" ry="24" fill="${bellyColor}" />

        <!-- head -->
        <ellipse cx="160" cy="52" rx="28" ry="22" fill="${bodyColor}" />
        <circle cx="170" cy="46" r="3" fill="#222" />

        <!-- ear -->
        <path d="M152 30 C148 10 170 18 168 36 Z" fill="${bodyColor}" />

        <!-- leg -->
        <path d="M90 120 C86 130 78 140 62 145 C68 138 92 120 92 120" fill="${bodyColor}" />

        <!-- pocket (simple) -->
        <rect x="95" y="80" rx="6" ry="6" width="30" height="28" fill="${bellyColor}" stroke="#d9c8a8" stroke-width="1"/>

        <!-- pouch content hint -->
        <circle cx="110" cy="95" r="4" fill="#ffce00" />

      </svg>
    `;
    return svg;
  }

  // --- UI rendering ---
  function renderPreview() {
    const spec = {
      bodyColor: bodyColorInput.value,
      bellyColor: bellyColorInput.value,
      scale: parseFloat(scaleSelect.value)
    };
    preview.innerHTML = renderKangarooSVG(spec);
    previewInfo.innerHTML = `
      <div>اللون: <strong style="color:${spec.bodyColor}">${spec.bodyColor}</strong></div>
      <div>حجم: <strong>${scaleSelect.options[scaleSelect.selectedIndex].text}</strong></div>
      <div>سعة الجيب: <strong>${pocketInput.value}</strong></div>
      <div>سعر مقترح: <strong>${formatUSD(priceInput.value)} USD</strong></div>
    `;
  }

  function renderListings() {
    listingsEl.innerHTML = '';
    if (!state.listings.length) {
      listingsEl.innerHTML = '<p>لا توجد منتجات معروضة حالياً.</p>';
      return;
    }

    state.listings.forEach(item => {
      const div = document.createElement('div');
      div.className = 'listing';
      div.innerHTML = `
        <div class="thumb">${renderKangarooSVG({ bodyColor: item.bodyColor, bellyColor: item.bellyColor, scale: item.scale })}</div>
        <h4>${escapeHtml(item.name)}</h4>
        <p>سعة الجيب: ${item.pocket}</p>
        <p>السعر: <strong>${formatUSD(item.price)} USD</strong></p>
      `;

      const buyBtn = document.createElement('button');
      buyBtn.className = 'buy';
      buyBtn.textContent = 'شراء الآن';
      buyBtn.addEventListener('click', () => {
        handleBuy(item.id);
      });

      div.appendChild(buyBtn);
      listingsEl.appendChild(div);
    });
  }

  function updateStats() {
    balanceEl.textContent = formatUSD(state.balance);
    totalCreatedEl.textContent = String(state.totalCreated);
    totalSalesEl.textContent = String(state.totalSales);

    // affiliate UI
    referralsEl.textContent = String(state.referrals);
    earningsEl.textContent = formatEGP(state.affiliateEarnings);
  }

  // --- Affiliate/referral functions (from user snippet, integrated and persisted) ---
  function updateDashboard() {
    // kept for compatibility with the user's snippet name
    updateStats();
  }

  function triggerTransfer() {
    // using affiliateEarnings (EGP) and simulating a transfer to InstaPay
    const amount = Number(state.affiliateEarnings) || 0;
    if (amount <= 0) {
      alert('لا يوجد رصيد للإحالات للسحب.');
      return;
    }

    // Simulate transfer
    alert(`✅ تم تجهيز تحويل بقيمة ${formatEGP(amount)} جنيه إلى InstaPay رقم: 010xxxxxxxx\n(هذه محاكاة)`);
    // في تطبيق حقيقي: هنا يتم استدعاء واجهة مزود الدفع، إرسال إشعار بالبريد أو واتساب، وتفريغ الرصيد.
    state.affiliateEarnings = 0;
    saveState();
    updateDashboard();
  }

  function registerReferral(amount) {
    // amount expected in جنيه (EGP)
    const a = Number(amount) || 0;
    state.referrals = (state.referrals || 0) + 1;
    state.affiliateEarnings = (Number(state.affiliateEarnings) || 0) + a;
    saveState();
    updateDashboard();
  }

  // --- actions ---
  function handleCreate(event) {
    event.preventDefault();
    const name = nameInput.value.trim() || 'كنغارو';
    const bodyColor = bodyColorInput.value;
    const bellyColor = bellyColorInput.value;
    const scale = parseFloat(scaleSelect.value) || 1;
    const pocket = Number(pocketInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;

    const newK = {
      id: generateId(),
      name,
      bodyColor,
      bellyColor,
      scale,
      pocket,
      price,
      listed: false,
      createdAt: Date.now()
    };

    currentDraft = newK;
    listBtn.disabled = false;
    createBtn.textContent = 'تم الإنشاء (جاهز للإدراج)';
    renderPreview();
  }

  function handleList() {
    if (!currentDraft) return;
    currentDraft.listed = true;
    state.listings.push(currentDraft);
    state.totalCreated = (state.totalCreated || 0) + 1;
    saveState();
    renderListings();
    updateStats();
    currentDraft = null;
    listBtn.disabled = true;
    createBtn.textContent = 'انشاء كنغارو';
    pocketInput.value = 10;
    priceInput.value = '5.00';
  }

  function handleBuy(id) {
    const idx = state.listings.findIndex(l => l.id === id);
    if (idx === -1) return alert('المنتج غير متوفر');

    const item = state.listings[idx];
    const price = Number(item.price) || 0;

    // Commission model:
    // - platform keeps 20% commission
    // - seller (you) receives 80% to your balance in this simulation
    const sellerShare = price * 0.8;
    const commission = price - sellerShare;

    state.balance = (Number(state.balance) || 0) + sellerShare;
    state.totalSales = (state.totalSales || 0) + 1;

    // Remove listing (one-off sale)
    state.listings.splice(idx, 1);

    saveState();
    renderListings();
    updateStats();

    // Feedback to user
    alert(`تم بيع "${item.name}" بسعر ${formatUSD(price)} USD.\nحصتك: ${formatUSD(sellerShare)} USD.\nعمولة المنصة: ${formatUSD(commission)} USD.`);
  }

  function handleWithdraw() {
    if (state.balance <= 0) {
      alert('لا يوجد رصيد للسحب.');
      return;
    }
    const amount = state.balance;
    state.balance = 0;
    saveState();
    updateStats();
    alert(`تم سحب ${formatUSD(amount)} USD (محاكاة).`);
  }

  // small helper to avoid XSS when injecting item names in listings
  function escapeHtml(s) {
    return (s + '').replace(/[&<>\"'`=\/]/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
      }[c];
    });
  }

  // --- initialization ---
  let currentDraft = null;

  loadState();
  renderListings();
  renderPreview();
  updateStats();

  // wire events
  form.addEventListener('input', () => {
    renderPreview();
  });

  form.addEventListener('submit', handleCreate);
  listBtn.addEventListener('click', handleList);
  withdrawBtn.addEventListener('click', handleWithdraw);

  // Affiliate UI events
  payoutBtn.addEventListener('click', triggerTransfer);
  simulateReferralBtn.addEventListener('click', () => registerReferral(10)); // simulate 10 جنيه per referral

  // Expose some helpers to console for testing and compatibility with snippet names
  window.sh7nly = {
    state,
    saveState,
    loadState,
    renderListings,
    renderPreview,
    formatUSD,
    // snippet-compatible names
    updateDashboard,
    triggerTransfer,
    registerReferral
  };

  // initial log
  document.addEventListener("DOMContentLoaded", () => {
    console.log("لوحة التحكم جاهزة");
    updateDashboard();
  });
})();
