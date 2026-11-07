import { NextResponse } from 'next/server';

const SUPABASE_URL = 'https://qcklfbqlxtfddkxdtwrm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sFxpgljPq4vJWw54LtX2iA_hQWwqdlD';
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'alkut_cement_secure_token_2026';
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || '';

const reqHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json'
};

export async function POST(request) {
  try {
    const body = await request.json();
    const entry = body?.entry?.?.changes?.?.value;
    const message = entry?.messages?.;

    if (message) {
      const fromPhone = message.from; // رقم جوال المندوب المرسِل
      const messageType = message.type;

      // 1. جالب بيانات العهدة الحالية والمصروفات من السحابة
      const fundRes = await fetch(`${SUPABASE_URL}/rest/v1/custody_fund?select=*`, { headers: reqHeaders });
      const fundData = await fundRes.json();
      const custody = fundData?. || { amount: 50000, currency: 'LYD', custody_no: 'CUS-2026-001' };

      const invRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=amount`, { headers: reqHeaders });
      const invData = await invRes.json();
      const totalSpent = (invData || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const remaining = custody.amount - totalSpent;

      // 2. إذا طلب المندوب استعلام الرصيد (كلمة: رصيد أو عهدة)
      if (messageType === 'text' && (message.text.body.includes('رصيد') || message.text.body.includes('عهدة'))) {
        const replyText = `📊 *بيانات عهدتك الحالية (${custody.custody_no})*\n\n💰 الإجمالي: ${custody.amount.toLocaleString()} ${custody.currency}\n🧾 المصروفات: ${totalSpent.toLocaleString()} ${custody.currency}\n💵 المتبقي بيدك: ${remaining.toLocaleString()} ${custody.currency}`;
        await sendWhatsAppReply(fromPhone, replyText);
        return NextResponse.json({ status: 'ok' });
      }

      // 3. قيد صورة الفاتورة أو المصروف المباشر
      let amount = 0;
      let vendor = 'مباشر عبر الواتساب';
      let captionText = messageType === 'text' ? message.text.body : (message.image?.caption || '');

      const extractedNumbers = captionText.match(/\d+(\.\d+)?/g);
      if (extractedNumbers && extractedNumbers.length > 0) {
        amount = parseFloat(extractedNumbers);
      }

      if (amount > 0) {
        const newInvoice = {
          id: String(Date.now()),
          invoice_number: `INV-WA-${Math.floor(1000 + Math.random() * 9000)}`,
          invoice_date: new Date().toISOString().split('T'),
          vendor: vendor,
          amount: amount,
          category: 'مواد بناء وتجهيزات',
          attachment_data: message.image?.id || ''
        };

        await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify(newInvoice)
        });

        const confirmMsg = `✅ *تم تسجيل الفاتورة بنجاح!*\n\n💵 القيمة: ${amount} ${custody.currency}\n📊 الرصيد المتبقي بعهدتك: ${(remaining - amount).toLocaleString()} ${custody.currency}`;
        await sendWhatsAppReply(fromPhone, confirmMsg);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function sendWhatsAppReply(toPhone, text) {
  if (!WHATSAPP_API_TOKEN || !PHONE_NUMBER_ID) return;
  await fetch(`[suspicious link removed]{PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'text',
      text: { body: text }
    })
  });
}
