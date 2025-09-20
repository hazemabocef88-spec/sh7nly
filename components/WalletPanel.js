import { useState } from 'react';

export default function WalletPanel({ walletNumber, balance }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function requestWithdraw() {
    if (!balance || Number(balance) < 10) {
      setMsg('رصيدك أقل من الحد الأدنى (10 EGP).');
      return;
    }
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: balance, name: 'Affiliate Payout' })
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error || 'حدث خطأ أثناء طلب التحويل.');
      } else {
        setMsg('تم تسجيل طلب التحويل بنجاح. سيظهر في لوحة الطلبات.');
      }
    } catch (err) {
      setMsg('خطأ في الاتصال.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function copyWallet() {
    if (!walletNumber) {
      setMsg('لا يوجد رقم محفظة معروض.');
      return;
    }
    navigator.clipboard.writeText(walletNumber).then(() => {
      setMsg('تم نسخ رقم المحفظة.');
    }).catch(() => {
      setMsg('فشل نسخ الرقم.');
    });
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
      <h3>رقم المحفظة</h3>
      <p style={{ fontSize: 18, fontWeight: 600 }}>{walletNumber || 'لم يتم تعيين رقم المحفظة'}</p>

      {balance >= 10 && (
        <div style={{ background: '#fff3cd', padding: 8, borderRadius: 6, marginBottom: 8 }}>
          رصيدك جاهز للتحويل ({balance} EGP). اضغط لنسخ رقم المحفظة أو طلب تحويل.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={copyWallet} className="btn">نسخ رقم المحفظة</button>
        <button onClick={requestWithdraw} className="btn" disabled={loading || balance < 10}>
          {loading ? 'جارٍ الإرسال...' : 'طلب تحويل'}
        </button>
      </div>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
