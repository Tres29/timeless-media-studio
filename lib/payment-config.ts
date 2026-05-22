/**
 * Paymongo Payment Configuration
 * 
 * Sign up at: https://paymongo.com
 * 1. Create account and get API keys
 * 2. Add to .env.local:
 *    NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=your_public_key
 *    PAYMONGO_SECRET_KEY=your_secret_key
 * 
 * Free tier supports:
 * - Up to 1000 transactions/month
 * - GCash, Maya, and card payments
 * - No setup fees
 */

export const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

export const PAYMENT_METHODS = {
  GCASH: 'gcash',
  MAYA: 'maya',
  CARD: 'card',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export interface PaymentData {
  amount: number; // in pesos
  currency: string;
  description: string;
  method: PaymentMethod;
  referenceId: string; // confirmation number
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

// Package pricing in PHP
export const PACKAGE_PRICES: Record<string, number> = {
  'BASIC - VIDEOGRAPHY': 5000,
  'BASIC - PHOTOGRAPHY': 4000,
  'BASIC - EVENT COVERAGE': 6000,
  'ELITE - VIDEOGRAPHY': 15000,
  'ELITE - PHOTOGRAPHY': 12000,
  'ELITE - EVENT COVERAGE': 18000,
  'PREMIUM - VIDEOGRAPHY': 25000,
  'PREMIUM - PHOTOGRAPHY': 20000,
  'PREMIUM - EVENT COVERAGE': 30000,
};
