## الدفع (PayMob)

تمت إضافة مثال للنهاية الخلفية في `pages/api/paymob.js` الذي يشرح كيفية إنشاء payment token باستخدام متغيرات بيئة.

تحذيرات وأفضل الممارسات:
- لا تضع المفاتيح السرية (SECRET keys) داخل الكود أو في أي commit عام. استخدم متغيرات بيئة فقط (Vercel/Netlify/Docker secrets).
- إذا شاركت أو أرسلت المفتاح السري في محادثة عامة أو في المستودع، فقم "بالتدوير" (revoke) للمفتاح فورًا وإنشاء مفتاح جديد.
- لا تضع أرقام الهواتف الحساسة أو رموز الدفع في الريبو العام. ضعها كمتغيرات بيئة أو اعرضها فقط في صفحة /admin المحمية.

إعداد سريع:
1. انسخ `.env.example` إلى `.env.local` أو أدخل القيم في إعدادات Vercel.
2. اضبط:
   - PAYMOB_API_KEY
   - PAYMOB_INTEGRATION_ID
   - PAYMOB_IFRAME_ID (اختياري)
   - PAYMOB_CALLBACK_URL
3. استخدم طلب POST إلى `/api/paymob` مع JSON body يحتوي على `amount` وخصائص اختيارية `currency`, `items`, `billing_data`.

مثال طلب (client-side):
```js
fetch('/api/paymob', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 50, currency: 'EGP' })
})
  .then(r => r.json())
  .then(data => {
    // data.payment_url أو data.payment_token
  })
```

أمان:
- اختبر أولًا باستخدام مفاتيح الاختبار من PayMob.
- بعد نشر، ضع المفاتيح الحقيقية في إعدادات متغيرات البيئة في Vercel، ولا تُعيد رفعها إلى Git.