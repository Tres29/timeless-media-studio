import { NextResponse } from 'next/server';
import {
  PAYMONGO_API_URL,
  PAYMENT_METHODS,
  type PaymentData,
  type PaymentResponse,
} from '@/lib/payment-config';

/**
 * POST /api/payment/create-source
 * Creates a payment source using Paymongo API
 * Requires PAYMONGO_SECRET_KEY in environment variables
 */
export async function POST(req: Request) {
  try {
    const paymentData: PaymentData = await req.json();

    // Validate required fields
    if (!paymentData.amount || !paymentData.email || !paymentData.method) {
      return NextResponse.json(
        { error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!Object.values(PAYMENT_METHODS).includes(paymentData.method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      console.error('❌ PAYMONGO_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Encode auth header
    const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

    // Prepare payment source request
    const sourcePayload = {
      data: {
        attributes: {
          type: paymentData.method,
          amount: Math.round(paymentData.amount * 100), // Convert to cents
          currency: paymentData.currency || 'PHP',
          redirect: {
            success: `${process.env.NEXT_PUBLIC_APP_URL || 'https://timeless-media.vercel.app/'}/payment/success`,
            failed: `${process.env.NEXT_PUBLIC_APP_URL || 'https://timeless-media.vercel.app/'}/payment/failed`,
          },
          billing: {
            name: paymentData.name,
            email: paymentData.email,
            phone: paymentData.phone,
          },
          description: paymentData.description,
          metadata: {
            referenceId: paymentData.referenceId,
            email: paymentData.email,
          },
        },
      },
    };

    console.log(`📦 Creating payment source for ${paymentData.method} - ${paymentData.referenceId}`);

    // Call Paymongo API
    const response = await fetch(`${PAYMONGO_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sourcePayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Paymongo API Error:', errorData);
      return NextResponse.json(
        { error: errorData?.errors?.[0]?.detail || 'Failed to create payment' },
        { status: response.status }
      );
    }

    const result = await response.json();
    const source = result.data;

    console.log(`✓ Payment source created: ${source.id}`);

    // Return payment response
    const paymentResponse: PaymentResponse = {
      id: source.id,
      amount: paymentData.amount,
      currency: paymentData.currency || 'PHP',
      description: paymentData.description,
      status: 'pending',
      sourceId: source.id,
      referenceId: paymentData.referenceId,
      checkoutUrl: source.attributes.checkout_url,
    };

    return NextResponse.json(paymentResponse);
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
