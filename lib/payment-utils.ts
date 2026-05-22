/**
 * PayMongo Payment Utility
 */
import type {
  PaymentData,
  PaymentMethod,
  PaymentResponse,
} from "./payment-config";

export async function createPaymentSource(
  paymentData: PaymentData
): Promise<PaymentResponse> {
  const response = await fetch("/api/payment/create-source", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to create payment");
  }

  return response.json();
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
  const response = await fetch(`/api/payment/status?id=${paymentId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to fetch payment status");
  }

  return response.json();
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<string, string> = {
    gcash: "GCash",
    maya: "Maya",
    qrph: "QR Ph",
    card: "Credit/Debit Card",
  };

  return labels[method] || method;
}
