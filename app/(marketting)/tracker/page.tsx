"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PaymentComponent from "@/components/PaymentComponent";

type Booking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  booking_date?: string;
  date?: string;
  package_type?: string;
  packageType?: string;
  message?: string;
  confirmation_number?: string;
  confirmationNumber?: string;
  status: "pending" | "approved" | "in_process" | "for_pick_up" | "completed" | "cancelled";
};

function normalizeBooking(data: Booking): Booking {
  return {
    ...data,
    booking_date: data.booking_date || data.date,
    package_type: data.package_type || data.packageType,
    confirmation_number: data.confirmation_number || data.confirmationNumber,
  };
}

export default function TrackerPage() {
  const searchParams = useSearchParams();
  const initialConfirmation = searchParams.get("confirmationNumber") || "";

  const [confirmationNumber, setConfirmationNumber] = useState(initialConfirmation);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBooking = async (value = confirmationNumber) => {
    if (!value.trim()) {
      setError("Please enter your confirmation number.");
      return;
    }

    setLoading(true);
    setError("");
    setBooking(null);
    setShowPayment(false);

    try {
      const response = await fetch(
        `/api/bookings?confirmationNumber=${encodeURIComponent(value.trim())}`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setError(data?.error || "Booking not found.");
        return;
      }

      setBooking(normalizeBooking(data));
    } catch {
      setError("Failed to connect to booking tracker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialConfirmation) {
      loadBooking(initialConfirmation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConfirmation]);

  const canPayNow = booking?.status === "pending";

  return (
    <main className="min-h-screen bg-black px-4 py-24 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl sm:p-8">
        <h1 className="text-3xl font-bold">Booking Tracker</h1>
        <p className="mt-2 text-gray-300">
          Check your booking status and pay later using your confirmation number.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={confirmationNumber}
            onChange={(event) => setConfirmationNumber(event.target.value)}
            placeholder="BK-2026-123456"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/40"
          />

          <button
            onClick={() => loadBooking()}
            disabled={loading || !confirmationNumber.trim()}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            {loading ? "Checking..." : "Track"}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {booking && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-gray-400">Confirmation Number</p>
                <p className="font-mono text-lg font-semibold">
                  {booking.confirmation_number}
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-4 py-2 text-sm font-bold uppercase ${
                  booking.status === "approved"
                    ? "bg-green-500/20 text-green-200"
                    : booking.status === "cancelled"
                      ? "bg-red-500/20 text-red-200"
                      : "bg-yellow-500/20 text-yellow-200"
                }`}
              >
                {booking.status}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="font-semibold">{booking.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="font-semibold">{booking.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="font-semibold">{booking.phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Booking Date</p>
                <p className="font-semibold">{booking.booking_date}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-gray-400">Package</p>
                <p className="font-semibold">{booking.package_type}</p>
              </div>
            </div>

            {booking.status === "approved" && (
              <div className="mt-5 rounded-xl border border-green-400/30 bg-green-500/10 p-4 text-green-200">
                Payment is done. Your booking is approved.
              </div>
            )}

            {booking.status !== "pending" && booking.status !== "approved" && (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-gray-300">
                Pay Now is only available for pending bookings.
              </div>
            )}

            {canPayNow && (
              <div className="mt-6">
                {!showPayment ? (
                  <button
                    type="button"
                    onClick={() => setShowPayment(true)}
                    className="w-full rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
                  >
                    Pay Now
                  </button>
                ) : (
                  <PaymentComponent
                    name={booking.name}
                    email={booking.email}
                    phone={booking.phone}
                    packageType={booking.package_type || ""}
                    confirmationNumber={booking.confirmation_number || ""}
                    onPaymentError={(paymentError) => setError(paymentError)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
