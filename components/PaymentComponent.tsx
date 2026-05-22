"use client";

import { useState } from "react";
import { createPaymentSource, getPaymentMethodLabel } from "@/lib/payment-utils";
import { PACKAGE_PRICES, PAYMENT_METHODS } from "@/lib/payment-config";
import type { PaymentMethod } from "@/lib/payment-config";

interface PaymentComponentProps {
  packageType: string;
  name: string;
  email: string;
  phone: string;
  confirmationNumber: string;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
  onPayLater?: () => void;
  showPayLater?: boolean;
}

const PAYMENT_OPTIONS: PaymentMethod[] = [
  PAYMENT_METHODS.GCASH,
  PAYMENT_METHODS.MAYA,
];

export default function PaymentComponent({
  packageType,
  name,
  email,
  phone,
  confirmationNumber,
  onPaymentSuccess,
  onPaymentError,
  onPayLater,
  showPayLater = false,
}: PaymentComponentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const amount = PACKAGE_PRICES[packageType] || 0;
  const paymentDisabled = !selectedMethod || isProcessing || success;

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError("Please select a payment method first.");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Invalid package price.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const paymentResponse = await createPaymentSource({
        amount,
        currency: "PHP",
        description: `Timeless Media Studio - ${packageType}`,
        method: selectedMethod,
        referenceId: confirmationNumber,
        email,
        phone,
        name,
      });

      if (paymentResponse.checkoutUrl) {
        window.location.href = paymentResponse.checkoutUrl;
        return;
      }

      setSuccess(true);
      onPaymentSuccess?.(paymentResponse.id);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Payment processing failed.";
      setError(errorMsg);
      onPaymentError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!amount || amount <= 0) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          Payment information will be displayed once you select a package.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-gray-900">
      <div className="border-b border-gray-300 pb-4">
        <h3 className="mb-3 text-lg font-bold">Payment Summary</h3>

        <div className="space-y-2">
          <div className="flex justify-between gap-4">
            <span>Package:</span>
            <span className="text-right font-semibold">{packageType}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span>Amount:</span>
            <span className="text-lg font-bold text-green-600">
              ₱{amount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm text-gray-600">
            <span>Reference:</span>
            <span className="rounded bg-gray-200 px-2 py-1 font-mono text-xs">
              {confirmationNumber}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-bold">
          Select Payment Method
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PAYMENT_OPTIONS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedMethod(method)}
              disabled={isProcessing || success}
              className={`relative rounded-xl border-2 p-4 text-center font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedMethod === method
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-300 bg-white text-gray-900 hover:border-blue-300"
              }`}
            >
              {getPaymentMethodLabel(method)}

              {selectedMethod === method && (
                <span className="absolute right-2 top-2 text-blue-500">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">❌ {error}</p>
        </div>
      )}

      <div className="rounded-xl bg-gray-100 p-3 text-xs text-gray-600">
        <p>
          <strong>Note:</strong> Your booking stays pending if you choose Pay
          Later. After successful payment, your booking status becomes approved.
        </p>
      </div>

      <button
        type="button"
        onClick={handlePayment}
        disabled={paymentDisabled}
        className={`w-full rounded-xl py-3 font-bold text-white transition-all ${
          !paymentDisabled
            ? "cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            : "cursor-not-allowed bg-gray-400"
        }`}
      >
        {isProcessing
          ? "⏳ Redirecting to PayMongo..."
          : selectedMethod
            ? `Pay ₱${amount.toLocaleString()}`
            : "Select payment method first"}
      </button>

      {showPayLater && onPayLater && (
        <button
          type="button"
          onClick={onPayLater}
          disabled={isProcessing}
          className="w-full rounded-xl border border-gray-400 px-5 py-3 font-semibold text-gray-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pay later
        </button>
      )}
    </div>
  );
}
