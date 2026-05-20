import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

// In-memory store to keep track of simulated transactions in development/sandbox mode
declare global {
  var simulatedCharges: Map<string, { status: string; amount: number; plan?: string }> | undefined;
}

if (!globalThis.simulatedCharges) {
  globalThis.simulatedCharges = new Map();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, name, email, document, plan } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { code: 'INVALID_AMOUNT', message: 'O valor do depósito é obrigatório e deve ser maior que zero.' },
        { status: 400 }
      );
    }

    if (!name || !document) {
      return NextResponse.json(
        { code: 'MISSING_FIELDS', message: 'Nome e CPF são campos obrigatórios para gerar o Pix.' },
        { status: 400 }
      );
    }

    const cleanCpf = document.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return NextResponse.json(
        { code: 'INVALID_CPF', message: 'O CPF fornecido deve conter exatamente 11 dígitos.' },
        { status: 400 }
      );
    }

    const safeEmail = email || `${name.toLowerCase().replace(/\s+/g, '')}@ganhemais.app`;

    const apiKey = process.env.LYTRON_API_KEY;
    const secretHash = process.env.LYTRON_SECRET_HASH;

    // Check if we are in simulator / sandbox mode (missing or placeholder keys)
    const isMock = !apiKey || apiKey.includes('seu_') || !secretHash || secretHash.includes('seu_');

    if (isMock) {
      // Simulate Pix charge generation
      const txid = `sim_tx_${crypto.randomBytes(8).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

      // Generate a mock but authentic-looking BR Code Pix Copy-Paste string
      const copyPaste = `00020101021226990014br.gov.bcb.pix2577pix-h.lytronpay.com/charges/${txid}5204000053039865405${amount.toFixed(2)}5802BR5920GanheMais Plataforma6009SAO PAULO62070503***6304${crypto.createHash('sha256').update(txid).digest('hex').substring(0, 4).toUpperCase()}`;

      // Save status in global simulation memory
      globalThis.simulatedCharges?.set(txid, {
        status: 'pending',
        amount,
        plan
      });

      return NextResponse.json({
        txid,
        status: 'pending',
        amount,
        qrcode: copyPaste, // The client will render this using a QR Code generator API
        copyPaste,
        expiresAt,
        isSimulated: true
      }, { status: 201 });
    }

    // REAL INTEGRATION WITH LYTRON PAY
    const payload = {
      amount: parseFloat(amount),
      description: plan ? `Assinatura Plano ${plan} - GanheMais` : `Depósito em Carteira - GanheMais`,
      customer: {
        name,
        email: safeEmail,
        document: {
          type: 'cpf',
          number: cleanCpf
        }
      }
    };

    const rawBody = JSON.stringify(payload);

    // Generate SHA-256 signature
    const signature = crypto
      .createHmac('sha256', secretHash!)
      .update(rawBody)
      .digest('hex');

    const response = await fetch('https://api.lytronpay.com/api/v1/charges', {
      method: 'POST',
      headers: {
        'Api-Access-Key': apiKey!,
        'Transaction-Hash': signature,
        'Content-Type': 'application/json'
      },
      body: rawBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lytron Pay API Error Response:', errorText);
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { message: errorText };
      }
      return NextResponse.json(
        { code: 'GATEWAY_ERROR', message: parsedError.message || 'Erro na comunicação com a Lytron Pay.', details: parsedError },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Deposit route critical error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Erro interno no processamento do depósito.' },
      { status: 500 }
    );
  }
}
