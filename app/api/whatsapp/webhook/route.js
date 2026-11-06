import { NextResponse } from 'next/server';

// إعدادات الربط مع سحابة Supabase و Meta WhatsApp Cloud API
const SUPABASE_URL = 'https://qcklfbqlxtfddkxdtwrm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sFxpgljPq4vJWw54LtX2iA_hQWwqdlD';
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'alkut_cement_secure_token_2026';
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || '';

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// 1️⃣ استجابة التحقق من الربط مع منصة Meta (Webhook Verification)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('رمز التحقق غير صحيح', { status: 403 });
}

// 2️⃣ معالجة الرسائل القادمة من الواتساب وقيدها سحابياً (Incoming Messages)
export async function POST(request) {
  try {
    const body = await request.json();

    if (
      body.object &&
      body.entry &&
      body.entry.changes &&
      body.entry.changes.value.messages &&
      body.entry.changes.value.messages
    ) {
      const message = body.entry.changes.value.messages;
      const fromPhone = message.from; // رقم جوال المندوب
      const messageType = message.type;

      let invoiceNumber = `INV-WA-${Math.floor(1000 + Math.random() * 9000)}`;
      let amount = 0;
      let vendor = 'مباشر عبر الواتساب';
      let attachmentUrl = '';

      // تحليل الرسالة النصية (مثال: فاتورة 450 شركة المواد)
      if (messageType === 'text') {
        const textBody = message.text.body;
        const numbers = textBody.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length > 0) {
          amount = parseFloat(numbers);
        }
        vendor = textBody.replace(/[1-3, 10-15]/g, '').trim() || vendor;
      }

      // تحليل الصور المرفقة إن وجدت
      if (messageType === 'image') {
        attachmentUrl = message.image.id || '';
        if (message.image.caption) {
          const captionNumbers = message.image.caption.match(/\d+(\.\d+)?/g);
          if (captionNumbers && captionNumbers.length > 0) {
            amount = parseFloat(captionNumbers);
          }
        }
      }

      if (amount > 0) {
        // قيد الفاتورة في قاعدة بيانات Supabase
        const newInvoicePayload = {
          id: String(Date.now()),
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T'),
          vendor: vendor,
          amount: amount,
          category: 'مواد بناء وتجهيزات',
          attachment_data: attachmentUrl
        };

        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
          method: 'POST',
          headers: supabaseHeaders,
          body: JSON.stringify(newInvoicePayload)
        });

        if (dbRes.ok && WHATSAPP_API_TOKEN && PHONE_NUMBER_ID) {
          // إرسال رد تأكيدي للمندوب على الواتساب
          const replyText = `✅ *تم قيد الفاتورة بنجاح في المنظومة!*\n\n🔢 رقم السند: ${invoiceNumber}\n💵 المبلغ: ${amount} د.ل\n🏢 المورد: ${vendor}`;
          
          await fetch(`[suspicious link removed]{PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: fromPhone,
              type: 'text',
              text: { body: replyText }
            })
          });
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
