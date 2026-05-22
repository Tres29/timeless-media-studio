"use client";

import { useState } from 'react';
import { createPaymentSource, getPaymentMethodLabel } from '@/lib/payment-utils';
import { PAYMENT_METHODS, PACKAGE_PRICES } from '@/lib/payment-config';
import type { PaymentMethod } from '@/lib/payment-config';

interface PaymentComponentProps {
  packageType: string;
  name: string;
  email: string;
  phone: string;
  confirmationNumber: string;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

export default function PaymentComponent({
  packageType,
  name,
  email,
  phone,
  confirmationNumber,
  onPaymentSuccess,
  onPaymentError,
}: PaymentComponentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const amount = PACKAGE_PRICES[packageType] || 0;

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!amount || amount <= 0) {
      setError('Invalid package price');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log(`💳 Processing ${selectedMethod.toUpperCase()} payment...`);

      const paymentResponse = await createPaymentSource({
        amount,
        currency: 'PHP',
        description: `Timeless Media Studio - ${packageType}`,
        method: selectedMethod,
        referenceId: confirmationNumber,
        email,
        phone,
        name,
      });

      console.log('✓ Payment created:', paymentResponse.id);

      if (paymentResponse.checkoutUrl) {
        // Redirect to payment gateway (for GCash/Maya)
        window.location.href = paymentResponse.checkoutUrl;
      } else {
        // Payment successful (for instant methods)
        setSuccess(true);
        onPaymentSuccess?.(paymentResponse.id);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment processing failed';
      console.error('❌ Payment error:', errorMsg);
      setError(errorMsg);
      onPaymentError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!amount || amount <= 0) {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
        <p className="text-yellow-800 text-sm">
          📌 Payment information will be displayed once you select a package.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-300 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Payment Summary */}
      <div className="mb-6 pb-4 border-b border-gray-300">
        <h3 className="text-lg font-bold text-gray-900 mb-3">💰 Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700">
            <span>Package:</span>
            <span className="font-semibold">{packageType}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Amount:</span>
            <span className="font-bold text-lg text-green-600">₱{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Reference:</span>
            <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
              {confirmationNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">
          📱 Select Payment Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[PAYMENT_METHODS.GCASH, PAYMENT_METHODS.MAYA].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedMethod(method as PaymentMethod)}
              disabled={isProcessing}
              className={`relative p-4 rounded-lg border-2 transition-all font-semibold ${
                selectedMethod === method
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 bg-white text-gray-900 hover:border-blue-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {getPaymentMethodLabel(method as PaymentMethod)}
              {selectedMethod === method && (
                <span className="absolute top-2 right-2 text-blue-500">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-red-800 text-sm font-semibold">❌ {error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-green-800 text-sm font-semibold">
            ✓ Payment processed successfully! You will receive a confirmation email shortly.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-gray-600 bg-gray-100 rounded p-3">
        <p>
          💡 <strong>Note:</strong> You will be redirected to the payment gateway to complete your transaction securely.
          Please ensure you have sufficient balance in your selected payment method.
        </p>
      </div>

      {/* Pay Button */}
      {!success && (
        <button
          type="button"
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
            selectedMethod && !isProcessing
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Processing...
            </span>
          ) : (
            `Pay ₱${amount.toLocaleString()}`
          )}
        </button>
      )}
    </div>
  );
}
