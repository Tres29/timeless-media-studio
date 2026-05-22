import { NextResponse } from 'next/server';
import { PAYMONGO_API_URL } from '@/lib/payment-config';

/**
 * GET /api/payment/status?id=<sourceId>
 * Checks payment status from Paymongo
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get('id');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

    const response = await fetch(`${PAYMONGO_API_URL}/sources/${sourceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Failed to get payment status:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch payment status' },
        { status: response.status }
      );
    }

    const result = await response.json();
    const source = result.data;

    // Map Paymongo status to our status
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'chargeable': 'completed',
      'active': 'completed',
      'expired': 'failed',
      'redirected': 'pending',
    };

    return NextResponse.json({
      id: source.id,
      amount: source.attributes.amount / 100,
      currency: source.attributes.currency,
      status: statusMap[source.attributes.status] || 'pending',
      sourceStatus: source.attributes.status,
      type: source.attributes.type,
      billing: source.attributes.billing,
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
