import { NextResponse } from 'next/server';

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

    const apiKey = process.env.LYTRON_API_KEY || '';
    const secretHash = process.env.LYTRON_SECRET_HASH || '';

    // Check if we are in simulator / sandbox mode (missing or placeholder keys)
    const isMock = !apiKey || apiKey.includes('seu_') || !secretHash || secretHash.includes('seu_');

    if (isMock) {
      // Simulate Pix charge generation using Web Crypto (no Node.js crypto import needed)
      const randomBytes = new Uint8Array(8);
      crypto.getRandomValues(randomBytes);
      const txid = `sim_tx_${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Generate a mock BR Code Pix Copy-Paste string
      const hashBytes = new TextEncoder().encode(txid);
      const hashBuffer = await crypto.subtle.digest('SHA-256', hashBytes);
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      const checksum = hashHex.substring(0, 4).toUpperCase();

      const copyPaste = `00020101021226990014br.gov.bcb.pix2577pix.ganhemais.app/charges/${txid}5204000053039865405${amount.toFixed(2)}5802BR5920GanheMais Plataforma6009SAO PAULO62070503***6304${checksum}`;

      return NextResponse.json({
        txid,
        status: 'pending',
        amount,
        qrcode: copyPaste,
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

    // Generate HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretHash);
    const msgData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const response = await fetch('https://api.lytronpay.com/api/v1/charges', {
      method: 'POST',
      headers: {
        'Api-Access-Key': apiKey,
        'Transaction-Hash': signature,
        'Content-Type': 'application/json'
      },
      body: rawBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gateway API Error (${response.status}):`, errorText.substring(0, 500));

      // If the gateway is down (500), fallback to simulation mode so the user isn't blocked
      if (response.status >= 500) {
        console.warn('Gateway returned 500 — falling back to simulation mode.');
        const randomBytes = new Uint8Array(8);
        crypto.getRandomValues(randomBytes);
        const fallbackTxid = `sim_tx_${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
        const fallbackExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const hashBytes = new TextEncoder().encode(fallbackTxid);
        const hashBuffer = await crypto.subtle.digest('SHA-256', hashBytes);
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        const checksum = hashHex.substring(0, 4).toUpperCase();

        const fallbackCopyPaste = `00020101021226990014br.gov.bcb.pix2577pix.ganhemais.app/charges/${fallbackTxid}5204000053039865405${amount.toFixed(2)}5802BR5920GanheMais Plataforma6009SAO PAULO62070503***6304${checksum}`;

        return NextResponse.json({
          txid: fallbackTxid,
          status: 'pending',
          amount,
          qrcode: fallbackCopyPaste,
          copyPaste: fallbackCopyPaste,
          expiresAt: fallbackExpires,
          isSimulated: true,
          gatewayOffline: true
        }, { status: 201 });
      }

      // For other errors (401, 422), return the actual error message
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { message: 'O gateway de pagamento retornou um erro. Tente novamente mais tarde.' };
      }
      return NextResponse.json(
        { code: 'GATEWAY_ERROR', message: parsedError.message || 'Erro na comunicação com o gateway de pagamento.', details: parsedError },
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
