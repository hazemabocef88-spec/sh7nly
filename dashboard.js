let referrals = 0;
let earnings = 0;
const log = document.getElementById("log");

function updateDashboard() {
  document.getElementById("referrals").textContent = referrals;
  document.getElementById("earnings").textContent = earnings.toFixed(2);
}

function registerReferral(amount, source = "غير محدد") {
  referrals += 1;
  earnings += amount;
  updateDashboard();
  log.innerHTML += `<p>🟢 إحالة جديدة: ${amount.toFixed(2)} جنيه من ${source}</p>`;
}

function triggerTransfer() {
  if (earnings >= 10) {
    window.open("https://instapay.eg/send/hazem1472@instapay", "_blank");
    log.innerHTML += `<p>💸 تم تجهيز تحويل بقيمة ${earnings.toFixed(2)} جنيه إلى InstaPay</p>`;
    referrals = 0;
    earnings = 0;
    updateDashboard();
  } else {
    alert("يجب أن تصل الأرباح إلى 10 جنيه على الأقل قبل التحويل.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateDashboard();
  // تجربة: تسجيل إحالة كل 15 ثانية
  setInterval(() => {
    registerReferral(2.50, "تجربة تلقائية");
  }, 15000);
});
