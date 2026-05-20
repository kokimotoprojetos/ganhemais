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

    const apiKey = process.env.LYTRON_API_KEY;
    const secretHash = process.env.LYTRON_SECRET_HASH;
    const isMock = !apiKey || apiKey.includes('seu_') || !secretHash || secretHash.includes('seu_');

    if (isMock) {
      // Access simulated storage from global scope
      const charge = (globalThis as any).simulatedCharges?.get(txid);

      if (!charge) {
        return NextResponse.json(
          { code: 'NOT_FOUND', message: 'Transação simulada não encontrada.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        txid,
        status: charge.status,
        amount: charge.amount,
        plan: charge.plan,
        isSimulated: true
      }, { status: 200 });
    }

    // REAL LYTRON PAY STATUS CHECK
    const response = await fetch(`https://api.lytronpay.com/api/v1/charges/${txid}`, {
      method: 'GET',
      headers: {
        'Api-Access-Key': apiKey!,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lytron Pay API Status Error (${response.status}):`, errorText);
      return NextResponse.json(
        { code: 'GATEWAY_ERROR', message: 'Erro ao consultar status na Lytron Pay.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      txid: data.txid,
      status: data.status, // e.g., 'pending', 'paid', 'refunded'
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

// Allows direct manual simulation of success by the frontend
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

    const charge = (globalThis as any).simulatedCharges?.get(txid);

    if (!charge) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Transação simulada não encontrada para atualização.' },
        { status: 404 }
      );
    }

    // Update status in global store
    const updated = { ...charge, status };
    (globalThis as any).simulatedCharges?.set(txid, updated);

    return NextResponse.json({
      success: true,
      txid,
      status: updated.status,
      amount: updated.amount,
      plan: updated.plan
    }, { status: 200 });

  } catch (error: any) {
    console.error('Status route POST error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Erro interno ao atualizar transação simulada.' },
      { status: 500 }
    );
  }
}
