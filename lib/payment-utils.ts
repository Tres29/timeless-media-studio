/**
 * PayMongo Payment Utility
 */

import {
  PAYMONGO_API_URL,
  type PaymentData,
  type PaymentMethod,
  type PaymentResponse,
} from "./payment-config";

export async function createPaymentSource(
  paymentData: PaymentData
): Promise<PaymentResponse> {
  const response = await fetch("/api/payment/create-source", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to create payment");
  }

  return (await response.json()) as PaymentResponse;
}

export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentResponse> {
  const response = await fetch(`/api/payment/status?id=${paymentId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to fetch payment status");
  }

  return (await response.json()) as PaymentResponse;
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    gcash: "GCash",
    paymaya: "Maya",
  };

  return labels[method] || method;
}

export function getCheckoutUrl(sourceId: string): string {
  return `${PAYMONGO_API_URL}/sources/${sourceId}`;
}
