"use client";

import { useState } from "react";
import { createPaymentSource, getPaymentMethodLabel } from "@/lib/payment-utils";
import { PAYMENT_METHODS, PACKAGE_PRICES, type PaymentMethod } from "@/lib/payment-config";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [paymentId, setPaymentId] = useState("");

  const amount = PACKAGE_PRICES[packageType] || 0;

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError("Please select a payment method");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Invalid package price");
      return;
    }

    setIsProcessing(true);
    setError("");
    setQrImageUrl("");

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

      setPaymentId(paymentResponse.id);

      if (paymentResponse.qrImageUrl) {
        setQrImageUrl(paymentResponse.qrImageUrl);
        setSuccess(true);
        onPaymentSuccess?.(paymentResponse.id);
        return;
      }

      if (paymentResponse.checkoutUrl) {
        window.location.href = paymentResponse.checkoutUrl;
        return;
      }

      setSuccess(true);
      onPaymentSuccess?.(paymentResponse.id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Payment processing failed";
      setError(errorMsg);
      onPaymentError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!amount || amount <= 0) {
    return (
      <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
        📌 Payment information will be displayed once you select a package.
      </div>
    );
  }

  const paymentMethods: PaymentMethod[] = [
    PAYMENT_METHODS.GCASH,
    PAYMENT_METHODS.MAYA,
    PAYMENT_METHODS.QRPH,
  ];

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm">
      <div>
        <h3 className="text-lg font-bold">Payment Summary</h3>
        <div className="mt-3 space-y-1 text-sm">
          <p><span className="font-semibold">Package:</span> {packageType}</p>
          <p><span className="font-semibold">Amount:</span> ₱{amount.toLocaleString()}</p>
          <p><span className="font-semibold">Reference:</span> {confirmationNumber}</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">Select Payment Method</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {paymentMethods.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedMethod(method)}
              disabled={isProcessing || !!qrImageUrl}
              className={`rounded-xl border-2 p-4 text-sm font-semibold transition-all ${
                selectedMethod === method
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-300 bg-white text-gray-900 hover:border-blue-300"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {getPaymentMethodLabel(method)} {selectedMethod === method ? "✓" : ""}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {qrImageUrl && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
          <h4 className="font-bold">Scan QR Ph to Pay</h4>
          <p className="mt-1 text-sm text-gray-600">
            Open your bank app, GCash, Maya, or other QR Ph-supported wallet and scan this code.
          </p>
          <img
            src={qrImageUrl}
            alt="QR Ph payment code"
            className="mx-auto mt-4 h-64 w-64 rounded-xl border bg-white p-3 object-contain"
          />
          <p className="mt-3 text-xs text-gray-500">
            Payment ID: {paymentId}. QR Ph codes usually expire after 30 minutes.
          </p>
        </div>
      )}

      {success && !qrImageUrl && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          ✓ Payment processed successfully!
        </div>
      )}

      {!success && (
        <button
          type="button"
          onClick={handlePayment}
          disabled={isProcessing || !selectedMethod}
          className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? "Processing..." : `Pay ₱${amount.toLocaleString()}`}
        </button>
      )}
    </div>
  );
}
