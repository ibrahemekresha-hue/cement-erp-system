import { NextResponse } from 'next/server';

// 1. دالة التحقق من Meta (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'alkut_cement_secure_token_2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response('Forbidden', { status: 403 });
}

// 2. دالة استقبال الرسائل وإرسال الرد الآلي (POST)
export async function POST(request) {
  try {
    const body = await request.json();

    // استخراج الرسالة الأولى بدقة من هيكل Meta
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from; // رقم هاتف المرسل
      const text = message.text?.body || ''; // نص الرسالة

      const waToken = process.env.WHATSAPP_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_ID;

      console.log(`[WhatsApp API] Message received from ${from}: "${text}"`);

      if (waToken && phoneId) {
        const graphUrl = `[suspicious link removed]${phoneId}/messages`;
        
        const res = await fetch(graphUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: from,
            type: 'text',
            text: { body: `أهلاً بك في منظومة مصنع الأسمنت، تم استلام طلبك: "${text}"` },
          }),
        });

        const resData = await res.json();
        console.log("=== META RESPONSE ===", JSON.stringify(resData));
      } else {
        console.error("[WhatsApp API] Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID!");
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
