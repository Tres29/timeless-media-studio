"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const confirmationNumber = searchParams.get("confirmationNumber") || "";
  const [message, setMessage] = useState(
    "Payment accepted. Updating your booking status..."
  );

  useEffect(() => {
    const approveBooking = async () => {
      if (!confirmationNumber) {
        setMessage("Payment accepted, but the confirmation number is missing.");
        return;
      }

      try {
        const response = await fetch("/api/bookings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            confirmationNumber,
            status: "approved",
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setMessage(
            data?.error || "Payment accepted, but booking status update failed."
          );
          return;
        }

        setMessage("Payment done. Booking approved. Returning to tracker...");
        window.location.href = `/contact?track=${encodeURIComponent(
          confirmationNumber
        )}`;
      } catch {
        setMessage(
          "Payment accepted, but we could not connect to the booking tracker."
        );
      }
    };

    approveBooking();
  }, [confirmationNumber]);

  return (
    <main className="min-h-screen bg-black px-4 py-24 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-3xl">
          ✓
        </div>

        <h1 className="text-3xl font-bold">Payment Done</h1>

        <p className="mt-4 text-gray-300">{message}</p>

        {confirmationNumber && (
          <a
            href={`/contact?track=${encodeURIComponent(confirmationNumber)}`}
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
          >
            Open Booking Tracker
          </a>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black px-4 py-24 text-white">
          <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
            Loading payment result...
          </div>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
