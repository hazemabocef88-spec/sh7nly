// Basic admin page — lists withdrawal requests from Airtable
import { useEffect, useState } from 'react';
import WalletPanel from '../components/WalletPanel';

export default function AdminPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const r = await fetch('/api/airtable/requests');
      const j = await r.json();
      setRequests(j.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // TODO: replace with real per-affiliate balance calculation
  const demoBalance = 12; // مثال: استبدل بمنطق حساب الرصيد الحقيقي

  const publicWallet = process.env.NEXT_PUBLIC_PAYEE_WALLET_NUMBER || '******';

  return (
    <div style={{ padding: 24 }}>
      <h1>لوحة التحكم - تحويلات</h1>

      <section style={{ marginBottom: 24 }}>
        <WalletPanel walletNumber={publicWallet} balance={demoBalance} />
      </section>

      <section>
        <h2>طلبات التحويل</h2>
        {loading ? <p>جاري التحميل...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>المبلغ</th>
                <th>المحفظة</th>
                <th>الحالة</th>
                <th>تاريخ</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => {
                const f = r.fields || {};
                return (
                  <tr key={r.id}>
                    <td>{f.Name}</td>
                    <td>{f.Amount} {f.Currency}</td>
                    <td>{f.WalletNumber}</td>
                    <td>{f.Status}</td>
                    <td>{f.CreatedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
