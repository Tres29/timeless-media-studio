"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const confirmationNumber = searchParams.get("confirmationNumber") || "";

  return (
    <main className="min-h-screen bg-black px-4 py-24 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
          !
        </div>

        <h1 className="text-3xl font-bold">Payment Not Completed</h1>

        <p className="mt-4 text-gray-300">
          Your payment was not completed, so your booking remains pending.
        </p>

        {confirmationNumber && (
          <a
            href={`/contact?track=${encodeURIComponent(confirmationNumber)}`}
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
          >
            Return to Booking Tracker
          </a>
        )}
      </div>
    </main>
  );
}

export default function PaymentFailedPage() {
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
      <PaymentFailedContent />
    </Suspense>
  );
}
