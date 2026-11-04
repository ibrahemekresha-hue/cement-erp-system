import { NextResponse } from 'next/server';

const SUPABASE_URL = 'https://qcklfbqlxtfddkxdtwrm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sFxpgljPq4vJWw54LtX2iA_hQWwqdlD';

export async function POST(request) {
  try {
    const body = await request.json();

    // استخراج تفاصيل الرسالة المباشرة وصورة الفاتورة من الواتساب
    const senderPhone = body.phone || body.from || body.chatId || '';
    const messageText = body.text || body.caption || body.body || '';
    const mediaUrl = body.mediaUrl || body.imageUrl || body.fileUrl || '';

    // تحليل المبلغ التلقائي من نص الرسالة (مثلاً: "فاتورة أسمنت 450")
    const amountMatch = messageText.match(/\d+(\.\d+)?/);
    const extractedAmount = amountMatch ? parseFloat(amountMatch[0]) : 0;

    const payload = {
      id: String(Date.now()),
      invoice_number: 'INV-WA-' + Math.floor(1000 + Math.random() * 9000),
      invoice_date: new Date().toISOString().split('T')[0],
      vendor: messageText || 'فاتورة واتساب مباشرة',
      amount: extractedAmount,
      category: 'مصروفات مباشرة عبر الواتساب',
      attachment_data: mediaUrl
    };

    // حفظ الفاتورة تلقائياً في قاعدة البيانات السحابية Supabase
    const res = await fetch(SUPABASE_URL + '/rest/v1/invoices', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return NextResponse.json({
        status: 'success',
        message: '✅ تم استلام الفاتورة وقيدها سحابياً من الواتساب بنجاح'
      });
    } else {
      const errText = await res.text();
      return NextResponse.json({ status: 'error', details: errText }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
