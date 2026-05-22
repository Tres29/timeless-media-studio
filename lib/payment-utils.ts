/**
 * Paymongo Payment Utility
 * Handles payment requests and interactions with Paymongo API
 */

import {
  PAYMONGO_API_URL,
  type PaymentData,
  type PaymentResponse,
  type PaymentMethod,
} from './payment-config';

export async function createPaymentSource(paymentData: PaymentData): Promise<PaymentResponse> {
  try {
    // Call our backend API to create payment
    const response = await fetch('/api/payment/create-source', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to create payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment creation error:', error);
    throw error;
  }
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
  try {
    const response = await fetch(`/api/payment/status?id=${paymentId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to fetch payment status');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment status error:', error);
    throw error;
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    gcash: '💳 GCash',
    maya: '💳 Maya',
    card: '💳 Credit/Debit Card',
  };
  return labels[method] || method;
}

export function getCheckoutUrl(sourceId: string): string {
  // For GCash/Maya, Paymongo provides a checkout URL
  // This would be used to redirect user to payment gateway
  return `${PAYMONGO_API_URL}/sources/${sourceId}`;
}
