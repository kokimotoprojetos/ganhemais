import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature') || request.headers.get('X-Signature');

    const webhookSecret = process.env.LYTRON_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('LYTRON_WEBHOOK_SECRET is not configured. Webhook validation skipped.');
      return NextResponse.json({ message: 'Webhook received (unvalidated)' }, { status: 200 });
    }

    if (!signature) {
      return NextResponse.json(
        { code: 'SIGNATURE_MISSING', message: 'Assinatura x-signature não fornecida.' },
        { status: 401 }
      );
    }

    // Verify HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const msgData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedSignature) {
      console.error('Webhook signature mismatch!', { received: signature, expected: expectedSignature });
      return NextResponse.json(
        { code: 'SIGNATURE_INVALID', message: 'Assinatura inválida.' },
        { status: 401 }
      );
    }

    // Parse the payload
    const payload = JSON.parse(rawBody);
    const { event, txid, amount, status } = payload;

    console.log(`[Webhook Verified] Event: ${event}, TxID: ${txid}, Amount: ${amount}, Status: ${status}`);

    // Process event types
    if (event === 'charge.paid') {
      console.log(`[Payment Success] Deposit confirmed for txid: ${txid}, value: R$ ${amount}`);
    } else if (event === 'charge.refunded') {
      console.log(`[Payment Refunded] Pix refunded for txid: ${txid}`);
    }

    return NextResponse.json({ success: true, processed: true }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook route critical error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Erro interno no processamento do webhook.' },
      { status: 500 }
    );
  }
}
