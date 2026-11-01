import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return NextResponse.json({ status: 'WhatsApp Webhook Running Successfully' }, { status: 200 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("📥 رسالة واتساب واردة:", body);
    return NextResponse.json({ status: 'Message Received' }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
