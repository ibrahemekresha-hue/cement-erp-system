import { NextResponse } from 'next/server';

const VERIFY_TOKEN = 'alkut_cement_secure_token_2026';
const SUPABASE_URL = 'https://sFxpgljPq4vJWw54LtX2iA.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sFxpgljPq4vJWw54LtX2iA_hQWwqdlD';

const reqHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json'
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge || '123456', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request) {
  console.log("=== WHATSAPP WEBHOOK RECEIVED ===");
  try {
    const body = await request.json();
    console.log("Payload:", JSON.stringify(body));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from;
      const textBody = (message.text?.body || '').trim().toLowerCase();
      console.log("Received message from " + from + ": " + textBody);

      let custodyFund = { amount: 50000, currency: 'LYD', recipient: 'أحمد الصالحي', custodyNo: 'CUS-2026-001' };
      let totalSpent = 0;

      // 1. Fetch Custody Fund with timeout safety
      try {
        const controller1 = new AbortController();
        const timeout1 = setTimeout(() => controller1.abort(), 2000);
        const fundRes = await fetch(SUPABASE_URL + '/rest/v1/custody_fund?select=*', { 
          headers: reqHeaders,
          signal: controller1.signal
        });
        clearTimeout(timeout1);

        if (fundRes.ok) {
          const fundData = await fundRes.json();
          if (fundData && fundData.length > 0) {
            const first = fundData[0];
            custodyFund = {
              amount: parseFloat(first.amount) || 50000,
              currency: first.currency || 'LYD',
              recipient: first.recipient || 'أحمد الصالحي',
              custodyNo: first.custody_no || first.custodyNo || 'CUS-2026-001'
            };
          }
        }
      } catch (e) {
        console.log("Supabase custody_fund fetch skipped:", e.message);
      }

      // 2. Fetch Invoices with timeout safety
      try {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 2000);
        const invRes = await fetch(SUPABASE_URL + '/rest/v1/invoices?select=*', { 
          headers: reqHeaders,
          signal: controller2.signal
        });
        clearTimeout(timeout2);

        if (invRes.ok) {
          const invData = await invRes.json();
          totalSpent = invData.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        }
      } catch (e) {
        console.log("Supabase invoices fetch skipped:", e.message);
      }

      const remaining = custodyFund.amount - totalSpent;
      let replyText = '';

      if (textBody.includes('رصيد') || textBody.includes('الرصيد') || textBody.includes('عهدة') || textBody.includes('تقرير')) {
        replyText = '📋 *تقرير تسوية العهدة الآلي (' + custodyFund.custodyNo + ')*\n\n' +
                    '👤 *المسؤول:* ' + custodyFund.recipient + '\n' +
                    '💰 *إجمالي العهدة:* ' + custodyFund.amount.toLocaleString() + ' ' + custodyFund.currency + '\n' +
                    '🧾 *المصروفات الحالية:* ' + totalSpent.toLocaleString() + ' ' + custodyFund.currency + '\n' +
                    '💵 *الرصيد المتبقي:* ' + remaining.toLocaleString() + ' ' + custodyFund.currency + '\n\n' +
                    '🟢 *تم التحديث تلقائياً من منظومة الكوت سحابياً.*';
      } else {
        replyText = 'أهلاً بك في *منظومة العهد المالية* 🏢\n\nللحصول على تقرير الرصيد الحالي، أرسل كلمة *رصيد* أو *عهدة*.';
      }

      const waToken = process.env.WHATSAPP_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_ID;

      console.log("WHATSAPP_TOKEN present: " + !!waToken + ", WHATSAPP_PHONE_ID: " + phoneId);

      if (waToken && phoneId) {
        const graphUrl = 'https://graph.facebook.com/v18.0/' + phoneId + '/messages';
        const metaRes = await fetch(graphUrl, {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer ' + waToken, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            messaging_product: 'whatsapp', 
            to: from, 
            type: 'text', 
            text: { body: replyText } 
          })
        });

        const metaData = await metaRes.text();
        console.log("=== META RESPONSE ===", metaRes.status, metaData);
      } else {
        console.error("CRITICAL: WHATSAPP_TOKEN or WHATSAPP_PHONE_ID missing in Vercel Environment Variables!");
      }
    } else {
      console.log("No user message in body.");
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error("POST Handler Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
