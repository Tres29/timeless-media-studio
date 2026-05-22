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
}

const PAYMENT_OPTIONS: PaymentMethod[] = [
  PAYMENT_METHODS.GCASH,
  PAYMENT_METHODS.MAYA,
  PAYMENT_METHODS.QRPH,
];

export default function PaymentComponent({
  packageType,
  name,
  email,
  phone,
  confirmationNumber,
  onPaymentSuccess,
  onPaymentError,
}: PaymentComponentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrPaymentId, setQrPaymentId] = useState("");

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
    setQrPaymentId("");

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

      if (paymentResponse.qrImageUrl) {
        setQrImageUrl(paymentResponse.qrImageUrl);
        setQrPaymentId(paymentResponse.paymentIntentId || paymentResponse.id);
        return;
      }

      if (paymentResponse.checkoutUrl) {
        window.location.href = paymentResponse.checkoutUrl;
        return;
      }

      setSuccess(true);
      onPaymentSuccess?.(paymentResponse.id);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Payment processing failed";
      setError(errorMsg);
      onPaymentError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!amount || amount <= 0) {
    return (
      <div className="rounded-xl border border-yellow-400/40 bg-yellow-50 p-4 text-sm text-yellow-800">
        📌 Payment information will be displayed once you select a package.
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm">
      <div className="rounded-xl bg-gray-50 p-4">
        <h3 className="text-lg font-bold">Payment Summary</h3>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            <span className="font-semibold">Package:</span> {packageType}
          </p>
          <p>
            <span className="font-semibold">Amount:</span> ₱
            {amount.toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Reference:</span>{" "}
            {confirmationNumber}
          </p>
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-semibold">Select Payment Method</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          {PAYMENT_OPTIONS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedMethod(method)}
              disabled={isProcessing}
              className={`rounded-xl border-2 p-4 text-center font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedMethod === method
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-300 bg-white text-gray-900 hover:border-blue-300"
              }`}
            >
              {getPaymentMethodLabel(method)}
              {selectedMethod === method && <span className="ml-2">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          ✓ Payment processed successfully! You will receive a confirmation email
          shortly.
        </div>
      )}

      {qrImageUrl && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center">
          <h4 className="text-lg font-bold text-blue-950">Scan QR Ph to Pay</h4>
          <p className="mt-1 text-sm text-blue-800">
            Open GCash, Maya, or any QR Ph-supported banking app, then scan this
            code.
          </p>

          {/* PayMongo returns a Base64 data URI. Use it directly as image src. */}
          <img
            src={qrImageUrl}
            alt="QR Ph payment code"
            className="mx-auto mt-4 h-64 w-64 rounded-xl border bg-white p-3"
          />

          <p className="mt-3 text-xs text-blue-700">
            QR Payment ID: {qrPaymentId}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            This QR code may expire. Generate a new one if the payment does not
            continue.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Note: GCash and Maya redirect to PayMongo checkout. QR Ph displays a QR
        code on this page.
      </p>

      {!success && !qrImageUrl && (
        <button
          type="button"
          onClick={handlePayment}
          disabled={isProcessing || !selectedMethod}
          className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isProcessing ? "⏳ Processing..." : `Pay ₱${amount.toLocaleString()}`}
        </button>
      )}

      {qrImageUrl && (
        <button
          type="button"
          onClick={() => {
            setQrImageUrl("");
            setQrPaymentId("");
          }}
          className="w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Choose another payment method
        </button>
      )}
    </div>
  );
}
