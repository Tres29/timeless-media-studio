/**
 * PayMongo Payment Configuration
 *
 * Add these to .env.local and Vercel Environment Variables:
 * NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxx
 * PAYMONGO_SECRET_KEY=sk_test_xxx
 * NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
 */

export const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

export const PAYMENT_METHODS = {
  GCASH: "gcash",
  MAYA: "paymaya",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  method: PaymentMethod;
  referenceId: string;
  email: string;
  phone: string;
  name: string;
}

export interface PaymentResponse {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  sourceId?: string;
  referenceId: string;
}

export const PACKAGE_PRICES: Record<string, number> = {
  "BASIC PACKAGE - ₱10": 10,
  "ELITE PACKAGE - ₱20": 20,
  "PREMIUM PACKAGE - ₱30": 30,

  "BASIC PACKAGE": 10,
  "ELITE PACKAGE": 20,
  "PREMIUM PACKAGE": 30,

  "BASIC - VIDEOGRAPHY": 5000,
  "BASIC - PHOTOGRAPHY": 4000,
  "BASIC - EVENT COVERAGE": 6000,

  "ELITE - VIDEOGRAPHY": 15000,
  "ELITE - PHOTOGRAPHY": 12000,
  "ELITE - EVENT COVERAGE": 18000,

  "PREMIUM - VIDEOGRAPHY": 25000,
  "PREMIUM - PHOTOGRAPHY": 20000,
  "PREMIUM - EVENT COVERAGE": 30000,
};
