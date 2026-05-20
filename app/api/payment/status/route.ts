import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get('txid');

    if (!txid) {
      return NextResponse.json(
        { code: 'MISSING_TXID', message: 'O ID de transação (txid) é obrigatório.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LYTRON_API_KEY || '';
    const secretHash = process.env.LYTRON_SECRET_HASH || '';
    const isMock = !apiKey || apiKey.includes('seu_') || !secretHash || secretHash.includes('seu_');

    if (isMock) {
      // In simulation mode, always return pending for simulated transactions
      // The client-side simulation button handles the success transition directly
      return NextResponse.json({
        txid,
        status: 'pending',
        amount: 0,
        isSimulated: true
      }, { status: 200 });
    }

    // REAL LYTRON PAY STATUS CHECK
    const response = await fetch(`https://api.lytronpay.com/api/v1/charges/${txid}`, {
      method: 'GET',
      headers: {
        'Api-Access-Key': apiKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gateway API Status Error (${response.status}):`, errorText);
      return NextResponse.json(
        { code: 'GATEWAY_ERROR', message: 'Erro ao consultar status do pagamento.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      txid: data.txid,
      status: data.status,
      amount: data.amount,
      paidAt: data.paidAt || data.paid_at,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Status route critical error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Erro interno ao consultar transação.' },
      { status: 500 }
    );
  }
}

// Allows simulation of success by the frontend (sandbox mode only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { txid, status } = body;

    if (!txid || !status) {
      return NextResponse.json(
        { code: 'MISSING_FIELDS', message: 'txid e status são obrigatórios.' },
        { status: 400 }
      );
    }

    // In sandbox/simulation mode, simply acknowledge the status update
    // The actual balance/plan update happens on the client side
    return NextResponse.json({
      success: true,
      txid,
      status,
      isSimulated: true
    }, { status: 200 });

  } catch (error: any) {
    console.error('Status route POST error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Erro interno ao atualizar transação.' },
      { status: 500 }
    );
  }
}
