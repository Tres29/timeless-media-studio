"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import PaymentComponent from "@/components/PaymentComponent";
import BookingCalendar from "@/components/BookingCalendar";

type FormState = {
  name: string;
  phone: string;
  date: string;
  packageType: string;
  message: string;
};

type BookingStatus =
  | "pending"
  | "approved"
  | "in_process"
  | "for_pick_up"
  | "completed"
  | "cancelled";

type EmailProvider =
  | "Gmail"
  | "Yahoo"
  | "Outlook"
  | "Hotmail"
  | "iCloud"
  | "ProtonMail"
  | "AOL"
  | "Other Email Provider";

type BookingLog = FormState & {
  email: string;
  emailProvider: EmailProvider | "";
  confirmationNumber: string;
  id: string;
  timestamp: string;
  status: BookingStatus;
};

const emptyForm: FormState = {
  name: "",
  phone: "",
  date: "",
  packageType: "",
  message: "",
};

const faqs = [
  {
    question: "How do I track my booking?",
    answer: "Use your confirmation number and click Track Order.",
  },
  {
    question: "Can I update my booking details?",
    answer: "Yes. Track your booking first, then click Update Details.",
  },
  {
    question: "Can I cancel my booking?",
    answer:
      "Yes, but only if the booking is not in process, completed, or already cancelled.",
  },
];

export default function BookingForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [trackerCode, setTrackerCode] = useState("");
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerError, setTrackerError] = useState("");
  const [trackerMessage, setTrackerMessage] = useState("");
  const [trackedBooking, setTrackedBooking] = useState<BookingLog | null>(null);
  const [showTrackerPayment, setShowTrackerPayment] = useState(false);

  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [editBooking, setEditBooking] = useState<FormState>(emptyForm);

  const [dialogEmail, setDialogEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailProvider, setEmailProvider] = useState<EmailProvider | "">("");

  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [savedBookingData, setSavedBookingData] = useState<{
    name: string;
    email: string;
    phone: string;
    packageType: string;
    confirmationNumber: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackCode = params.get("track");

    if (!trackCode) return;

    setTrackerCode(trackCode);
    setShowTrackerModal(true);

    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (showTrackerModal && trackerCode && !trackedBooking) {
      void trackBooking(trackerCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTrackerModal, trackerCode]);

  const generateConfirmationNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `BK-${year}-${random}`;
  };

  const getPackagePrice = (packageType: string) => {
    if (packageType.includes("BASIC")) return "₱10";
    if (packageType.includes("ELITE")) return "₱20";
    if (packageType.includes("PREMIUM")) return "₱30";
    return "₱0";
  };

  const isCancelDisabled = (status?: BookingStatus) => {
    return (
      status === "in_process" ||
      status === "completed" ||
      status === "cancelled"
    );
  };

  const isUpdateDisabled = (status?: BookingStatus) => {
    return status === "completed" || status === "cancelled";
  };

  const detectProvider = (email: string): EmailProvider | "" => {
    const domain = email.split("@")[1]?.toLowerCase() || "";

    if (domain === "gmail.com") return "Gmail";
    if (domain === "yahoo.com") return "Yahoo";
    if (domain === "outlook.com") return "Outlook";
    if (domain === "hotmail.com") return "Hotmail";
    if (domain === "icloud.com") return "iCloud";
    if (domain === "protonmail.com") return "ProtonMail";
    if (domain === "aol.com") return "AOL";

    return domain ? "Other Email Provider" : "";
  };

  const validateEmail = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return {
        valid: false,
        error: "Email is required.",
        provider: "" as EmailProvider | "",
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(cleanEmail)) {
      return {
        valid: false,
        error: "Please enter a valid email.",
        provider: "" as EmailProvider | "",
      };
    }

    return {
      valid: true,
      error: "",
      provider: detectProvider(cleanEmail),
    };
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleEditChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEditBooking({
      ...editBooking,
      [event.target.name]: event.target.value,
    });
  };

  const openEmailDialog = (event: FormEvent) => {
    event.preventDefault();
    setDialogEmail("");
    setEmailError("Email is required.");
    setEmailProvider("");
    setShowEmailDialog(true);
  };

  const handleEmailChange = (value: string) => {
    setDialogEmail(value);
    const result = validateEmail(value);
    setEmailError(result.error);
    setEmailProvider(result.provider);
  };

  const openTrackerModal = () => {
    setConfirmationNumber("");
    setShowTrackerModal(true);
  };

  const closeTrackerModal = () => {
    setShowTrackerModal(false);
    setTrackerCode("");
    setTrackerError("");
    setTrackerMessage("");
    setTrackedBooking(null);
    setIsEditingBooking(false);
    setShowTrackerPayment(false);
  };

  const trackBooking = async (code = trackerCode) => {
    if (!code.trim()) {
      setTrackerError("Please enter your confirmation number.");
      return;
    }

    setTrackerLoading(true);
    setTrackerError("");
    setTrackerMessage("");
    setShowTrackerPayment(false);

    try {
      const response = await fetch(
        `/api/bookings?confirmationNumber=${encodeURIComponent(code.trim())}`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setTrackerError(
          data?.error || "Booking not found. Please check your confirmation number."
        );
        return;
      }

      const normalizedBooking: BookingLog = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        date: data.booking_date || data.date,
        packageType: data.package_type || data.packageType,
        message: data.message || "",
        email: data.email,
        emailProvider: data.email_provider || data.emailProvider || "",
        confirmationNumber: data.confirmation_number || data.confirmationNumber,
        timestamp: data.created_at || data.timestamp || "",
        status: data.status,
      };

      setTrackedBooking(normalizedBooking);
      setEditBooking({
        name: normalizedBooking.name,
        phone: normalizedBooking.phone,
        date: normalizedBooking.date,
        packageType: normalizedBooking.packageType,
        message: normalizedBooking.message,
      });
      setIsEditingBooking(false);
    } catch {
      setTrackerError("Failed to connect to booking tracker.");
    } finally {
      setTrackerLoading(false);
    }
  };

  const updateBooking = async () => {
    if (!trackedBooking) return;

    if (isUpdateDisabled(trackedBooking.status)) {
      setTrackerError("This booking can no longer be updated.");
      return;
    }

    setTrackerLoading(true);
    setTrackerError("");
    setTrackerMessage("");

    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmationNumber: trackedBooking.confirmationNumber,
          ...editBooking,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setTrackerError(data?.error || "Failed to update booking.");
        return;
      }

      setTrackedBooking({
        ...trackedBooking,
        ...editBooking,
      });
      setTrackerMessage("Booking updated successfully.");
      setIsEditingBooking(false);
    } catch {
      setTrackerError("Failed to update booking.");
    } finally {
      setTrackerLoading(false);
    }
  };

  const approveBookingAfterPayment = async (bookingCode: string) => {
    const response = await fetch("/api/bookings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        confirmationNumber: bookingCode,
        status: "approved",
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "Payment done, but booking approval failed.");
    }

    return data;
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    console.log("✓ Payment successful:", paymentId);

    if (!savedBookingData) return;

    try {
      await approveBookingAfterPayment(savedBookingData.confirmationNumber);
      setTrackerMessage("Payment done. Your booking is approved.");
    } catch (error) {
      setTrackerError(
        error instanceof Error
          ? error.message
          : "Payment done, but booking approval failed."
      );
    }

    setShowPaymentStep(false);
    setConfirmationNumber(savedBookingData.confirmationNumber);
    setTrackerCode(savedBookingData.confirmationNumber);
    setShowTrackerModal(true);

    setForm(emptyForm);
    setSavedBookingData(null);
  };

  const handleTrackerPaymentSuccess = async (paymentId: string) => {
    console.log("✓ Tracker payment successful:", paymentId);

    if (!trackedBooking) return;

    try {
      const updatedBooking = await approveBookingAfterPayment(
        trackedBooking.confirmationNumber
      );

      setTrackedBooking({
        ...trackedBooking,
        status: "approved",
      });
      setShowTrackerPayment(false);
      setTrackerMessage("Payment done. Your booking is approved.");

      if (updatedBooking?.status) {
        setTrackedBooking({
          ...trackedBooking,
          status: updatedBooking.status,
        });
      }
    } catch (error) {
      setTrackerError(
        error instanceof Error
          ? error.message
          : "Payment done, but booking approval failed."
      );
    }
  };

  const handlePaymentError = (error: string) => {
    console.error("❌ Payment error:", error);
    setTrackerError(error);
  };

  const closePaymentStep = () => {
    setShowPaymentStep(false);

    if (savedBookingData) {
      setConfirmationNumber(savedBookingData.confirmationNumber);
      setTrackerCode(savedBookingData.confirmationNumber);
      setShowTrackerModal(true);
    }

    setSavedBookingData(null);
  };

  const cancelBooking = async () => {
    if (!trackedBooking) return;

    if (isCancelDisabled(trackedBooking.status)) {
      setTrackerError("This booking can no longer be cancelled.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    setTrackerLoading(true);
    setTrackerError("");
    setTrackerMessage("");

    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmationNumber: trackedBooking.confirmationNumber,
          status: "cancelled",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setTrackerError(data?.error || "Failed to cancel booking.");
        return;
      }

      setTrackedBooking({
        ...trackedBooking,
        status: "cancelled",
      });
      setTrackerMessage("Booking cancelled successfully.");
    } catch {
      setTrackerError("Failed to cancel booking.");
    } finally {
      setTrackerLoading(false);
    }
  };

  const confirmBooking = async () => {
    const cleanEmail = dialogEmail.trim().toLowerCase();
    const result = validateEmail(cleanEmail);

    setEmailError(result.error);
    setEmailProvider(result.provider);

    if (!result.valid) return;

    setSending(true);

    const generatedConfirmation = generateConfirmationNumber();

    const bookingPayload = {
      ...form,
      email: cleanEmail,
      emailProvider: result.provider,
      confirmationNumber: generatedConfirmation,
      status: "pending" as BookingStatus,
    };

    try {
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      });

      const savedBooking = await bookingResponse.json().catch(() => null);

      if (!bookingResponse.ok) {
        setEmailError(savedBooking?.error || "Failed to save booking.");
        return;
      }

      if (!savedBooking) {
        setEmailError("Failed to retrieve booking confirmation.");
        return;
      }

      const finalConfirmationNumber =
        savedBooking.confirmation_number || generatedConfirmation;

      setSavedBookingData({
        name: form.name,
        email: cleanEmail,
        phone: form.phone,
        packageType: form.packageType,
        confirmationNumber: finalConfirmationNumber,
      });

      setShowEmailDialog(false);
      setShowPaymentStep(true);

      fetch("/api/send-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bookingPayload,
          confirmationNumber: finalConfirmationNumber,
        }),
      }).catch((error) => console.error("Email send error:", error));
    } catch (error) {
      setEmailError(
        error instanceof Error
          ? error.message
          : "Failed to connect to booking database."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="min-h-screen bg-black px-4 py-24 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white/70">
              Book Now
            </p>

            <h1 className="text-5xl font-black leading-tight sm:text-7xl">
              Make your
              <span className="block text-white/60">memories</span>
              documented
              <span className="block text-white/60">with us.</span>
            </h1>

        

            <button
              type="button"
              onClick={openTrackerModal}
              className="mt-8 rounded-2xl border border-white/15 bg-white px-6 py-3 font-black uppercase tracking-[0.15em] text-black transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-95"
            >
              Track Order
            </button>
          </div>

          <div className="grid gap-6 lg:h-fit">
            <form
              onSubmit={openEmailDialog}
              className="rounded-[32px] border border-white/10 bg-white/[0.08] p-5 shadow-[0_25px_80px_rgba(255,255,255,0.1)] backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_25px_80px_rgba(255,255,255,0.15)] sm:p-7"
            >
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Name"
                required
                className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/90 px-4 text-sm font-semibold text-black outline-none transition-all duration-300 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20 hover:border-white/30"
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
                className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/90 px-4 text-sm font-semibold text-black outline-none transition-all duration-300 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20 hover:border-white/30"
              />

              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/90 px-4 text-left text-sm font-semibold text-black outline-none transition-all duration-300 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20 hover:border-white/30"
              >
                {form.date
                  ? new Date(form.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Book your schedule!"}
              </button>

              <select
                name="packageType"
                value={form.packageType}
                onChange={handleChange}
                required
                className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/90 px-4 text-sm font-semibold text-black outline-none transition-all duration-300 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20 hover:border-white/30"
              >
                <option value="">Choose your Package</option>
                <option value="BASIC PACKAGE - ₱10">BASIC PACKAGE - ₱10</option>
                <option value="ELITE PACKAGE - ₱20">ELITE PACKAGE - ₱20</option>
                <option value="PREMIUM PACKAGE - ₱30">
                  PREMIUM PACKAGE - ₱30
                </option>
              </select>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Message"
                className="h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/90 p-4 text-sm font-semibold text-black outline-none transition-all duration-300 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20 hover:border-white/30"
              />

              <button
                type="submit"
                className="group relative mt-7 w-full overflow-hidden rounded-2xl bg-white py-4 font-black uppercase tracking-[0.18em] text-black shadow-[0_16px_45px_rgba(255,255,255,0.18)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.96]"
              >
                <span className="relative flex items-center justify-center gap-3">
                  Submit Booking <span>→</span>
                </span>
              </button>
            </form>

            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.08] p-5 shadow-[0_25px_80px_rgba(255,255,255,0.1)] backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_25px_80px_rgba(255,255,255,0.15)]">
              <h3 className="px-0 py-0 text-xl font-black transition-all duration-300">
                Frequently Asked Questions
              </h3>

              {faqs.map((faq, index) => (
                <div key={faq.question} className="border-t border-white/10 transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left transition-all duration-300 hover:bg-white/5"
                  >
                    <span className="font-bold transition-all duration-300">{faq.question}</span>
                    <span className="transition-transform duration-300">{openFaq === index ? "−" : "+"}</span>
                  </button>

                  {openFaq === index && (
                    <p className="animate-in fade-in slide-in-from-top-2 px-4 pb-4 text-sm leading-7 text-white/60 duration-300">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.08] p-4 shadow-[0_25px_80px_rgba(255,255,255,0.1)] backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_25px_80px_rgba(255,255,255,0.15)]">
              <h3 className="mb-4 text-xl font-black transition-all duration-300 sm:text-2xl">Find Us</h3>

              <div className="overflow-hidden rounded-3xl border border-white/10 transition-all duration-500">
                <iframe
                  title="Studio Location Map"
                  src="https://www.google.com/maps?q=Quezon%20City%20Philippines&output=embed"
                  className="h-[260px] w-full border-0 transition-all duration-500 sm:h-[320px]"
                  loading="lazy"
                  allowFullScreen
                />
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Quezon+City+Philippines"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-2xl bg-white py-3 text-center font-black text-black transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-95"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>

      {showEmailDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#141414]/95 p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.7)]">
            <h2 className="mb-2 text-2xl font-black">Confirm Your Booking</h2>

            <input
              type="email"
              value={dialogEmail}
              onChange={(event) => handleEmailChange(event.target.value)}
              placeholder="example@gmail.com"
              className="mt-4 h-12 w-full rounded-2xl bg-white/90 px-4 text-sm text-black outline-none"
            />

            {emailProvider && !emailError && (
              <p className="mt-2 text-sm font-semibold text-green-300">
                Detected provider: {emailProvider}
              </p>
            )}

            {emailError && (
              <p className="mt-2 text-sm font-semibold text-red-300">
                {emailError}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowEmailDialog(false)}
                className="w-1/2 rounded-2xl bg-white/10 py-3 font-bold text-white transition hover:bg-white/20"
              >
                Close
              </button>

              <button
                type="button"
                onClick={confirmBooking}
                disabled={sending || !!emailError}
                className="w-1/2 rounded-2xl bg-white py-3 font-black text-black disabled:opacity-60"
              >
                {sending ? "SENDING..." : "CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentStep && savedBookingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#141414] p-6 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">Complete Your Payment</h2>

              <button
                type="button"
                onClick={closePaymentStep}
                className="rounded-full bg-white/10 px-4 py-2 font-black hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.08] p-4">
              <p className="mb-2 text-sm text-white/60">Booking Confirmation</p>
              <p className="text-lg font-black">
                {savedBookingData.confirmationNumber}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg bg-white">
              <PaymentComponent
                packageType={savedBookingData.packageType}
                name={savedBookingData.name}
                email={savedBookingData.email}
                phone={savedBookingData.phone}
                confirmationNumber={savedBookingData.confirmationNumber}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onPayLater={closePaymentStep}
                showPayLater
              />
            </div>
          </div>
        </div>
      )}

      {confirmationNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 text-center text-black">
            <h2 className="mb-2 text-2xl font-black">Booking Submitted!</h2>

            <p className="mb-4 text-sm leading-6 text-gray-600">
              Save this confirmation number to track your booking:
            </p>

            <div className="mb-5 rounded-2xl bg-black py-4 text-xl font-black tracking-widest text-white">
              {confirmationNumber}
            </div>

            <button
              type="button"
              onClick={() => {
                setTrackerCode(confirmationNumber);
                setConfirmationNumber("");
                setShowTrackerModal(true);
              }}
              className="mb-3 w-full rounded-2xl bg-black py-3 font-bold text-white"
            >
              Track Booking
            </button>

            <button
              type="button"
              onClick={() => setConfirmationNumber("")}
              className="w-full rounded-2xl bg-gray-200 py-3 font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showTrackerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#141414] p-6 text-white shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black">Booking Tracker</h2>

              <button
                type="button"
                onClick={closeTrackerModal}
                className="rounded-full bg-white/10 px-4 py-2 font-black hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <input
              value={trackerCode}
              onChange={(event) => setTrackerCode(event.target.value)}
              placeholder="BK-2026-123456"
              className="mb-4 h-12 w-full rounded-2xl bg-white px-4 text-black"
            />

            <button
              type="button"
              onClick={() => trackBooking()}
              disabled={trackerLoading}
              className="w-full rounded-2xl bg-white py-3 font-black text-black disabled:opacity-60"
            >
              {trackerLoading ? "CHECKING..." : "TRACK ORDER"}
            </button>

            {trackerError && (
              <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-red-300">
                {trackerError}
              </p>
            )}

            {trackerMessage && (
              <p className="mt-4 rounded-2xl bg-green-500/10 p-3 text-green-300">
                {trackerMessage}
              </p>
            )}

            {trackedBooking && (
              <div className="mt-5 space-y-4">
                {!isEditingBooking ? (
                  <>
                    <div className="rounded-3xl bg-white/[0.05] p-5">
                      <h3 className="mb-4 text-xl font-black">
                        Details of the Booking
                      </h3>

                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-white/50">Confirmation:</span>{" "}
                          {trackedBooking.confirmationNumber}
                        </p>
                        <p>
                          <span className="text-white/50">Name:</span>{" "}
                          {trackedBooking.name}
                        </p>
                        <p>
                          <span className="text-white/50">Phone:</span>{" "}
                          {trackedBooking.phone}
                        </p>
                        <p>
                          <span className="text-white/50">Date:</span>{" "}
                          {trackedBooking.date}
                        </p>
                        <p>
                          <span className="text-white/50">Package:</span>{" "}
                          {trackedBooking.packageType}
                        </p>
                        <p>
                          <span className="text-white/50">Message:</span>{" "}
                          {trackedBooking.message || "No message"}
                        </p>
                        <p>
                          <span className="text-white/50">Status:</span>{" "}
                          <span className="font-black uppercase">
                            {trackedBooking.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white/[0.05] p-5">
                      <h3 className="mb-4 text-xl font-black">
                        Price Quotation
                      </h3>

                      <div className="rounded-2xl bg-white p-5 text-black">
                        <p className="text-sm text-gray-500">Package</p>
                        <p className="text-lg font-black">
                          {trackedBooking.packageType}
                        </p>

                        <div className="my-4 h-px bg-black/10" />

                        <div className="flex items-center justify-between">
                          <span className="font-bold">Estimated Price</span>
                          <span className="text-2xl font-black">
                            {getPackagePrice(trackedBooking.packageType)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {trackedBooking.status === "pending" && (
                      <div className="rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-5">
                        <h3 className="text-xl font-black text-yellow-100">
                          Pending Payment
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-yellow-100/80">
                          This booking is saved, but payment is not completed yet.
                          Click Pay Now to continue payment. After successful
                          payment, your booking status will automatically change to
                          approved.
                        </p>

                        {!showTrackerPayment ? (
                          <button
                            type="button"
                            onClick={() => setShowTrackerPayment(true)}
                            className="mt-4 w-full rounded-2xl bg-green-600 py-3 font-black text-white transition hover:bg-green-700 active:scale-95"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <div className="mt-4 overflow-hidden rounded-2xl bg-white">
                            <PaymentComponent
                              packageType={trackedBooking.packageType}
                              name={trackedBooking.name}
                              email={trackedBooking.email}
                              phone={trackedBooking.phone}
                              confirmationNumber={
                                trackedBooking.confirmationNumber
                              }
                              onPaymentSuccess={handleTrackerPaymentSuccess}
                              onPaymentError={handlePaymentError}
                            />

                            <button
                              type="button"
                              onClick={() => setShowTrackerPayment(false)}
                              className="w-full bg-gray-100 py-3 font-bold text-black transition hover:bg-gray-200"
                            >
                              Cancel Payment
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {trackedBooking.status === "approved" && (
                      <div className="rounded-3xl border border-green-400/30 bg-green-500/10 p-5 text-green-100">
                        <h3 className="font-black">Payment Done</h3>
                        <p className="mt-2 text-sm">
                          Your booking is approved. Please note that, booking is non-refundable. Policy will applied after cancellation.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingBooking(true)}
                        disabled={isUpdateDisabled(trackedBooking.status)}
                        className={`w-1/2 rounded-2xl py-3 font-black transition-all duration-300 ${
                          isUpdateDisabled(trackedBooking.status)
                            ? "cursor-not-allowed bg-gray-500 text-white opacity-50"
                            : "bg-white text-black hover:scale-[1.02] active:scale-95"
                        }`}
                      >
                        Update Details
                      </button>

                      <button
                        type="button"
                        onClick={cancelBooking}
                        disabled={
                          trackerLoading || isCancelDisabled(trackedBooking.status)
                        }
                        className={`w-1/2 rounded-2xl py-3 font-black text-white transition-all duration-300 ${
                          trackerLoading || isCancelDisabled(trackedBooking.status)
                            ? "cursor-not-allowed bg-gray-500 opacity-50"
                            : "bg-red-500 hover:bg-red-600 active:scale-95"
                        }`}
                      >
                        Cancel Booking
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-3xl bg-white/[0.05] p-5">
                      <h3 className="mb-4 text-xl font-black">
                        Update Booking
                      </h3>

                      <input
                        title="name"
                        name="name"
                        value={editBooking.name}
                        onChange={handleEditChange}
                        className="mb-3 h-12 w-full rounded-2xl bg-white px-4 text-black"
                      />

                      <input
                        title="phone"
                        name="phone"
                        value={editBooking.phone}
                        onChange={handleEditChange}
                        className="mb-3 h-12 w-full rounded-2xl bg-white px-4 text-black"
                      />

                      <input
                        title="date"
                        type="date"
                        name="date"
                        value={editBooking.date}
                        onChange={handleEditChange}
                        className="mb-3 h-12 w-full rounded-2xl bg-white px-4 text-black"
                      />

                      <select
                        title="package"
                        name="packageType"
                        value={editBooking.packageType}
                        onChange={handleEditChange}
                        className="mb-3 h-12 w-full rounded-2xl bg-white px-4 text-black"
                      >
                        <option value="BASIC PACKAGE - ₱10">
                          BASIC PACKAGE - ₱10
                        </option>
                        <option value="ELITE PACKAGE - ₱20">
                          ELITE PACKAGE - ₱20
                        </option>
                        <option value="PREMIUM PACKAGE - ₱30">
                          PREMIUM PACKAGE - ₱30
                        </option>
                      </select>

                      <textarea
                        title="message"
                        name="message"
                        value={editBooking.message}
                        onChange={handleEditChange}
                        className="h-28 w-full resize-none rounded-2xl bg-white p-4 text-black"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={updateBooking}
                        disabled={trackerLoading}
                        className="w-1/2 rounded-2xl bg-white py-3 font-black text-black disabled:opacity-60"
                      >
                        {trackerLoading ? "UPDATING..." : "Save Update"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditingBooking(false)}
                        className="w-1/2 rounded-2xl bg-white/10 py-3 font-black text-white hover:bg-white/20"
                      >
                        Back
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={closeTrackerModal}
              className="mt-5 w-full rounded-2xl bg-white/10 py-3 font-bold text-white hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[32px] border border-white/10 bg-[#141414] p-6 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">Select Date</h2>

              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="rounded-full bg-white/10 px-4 py-2 font-black hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <BookingCalendar
              selectedDate={form.date}
              onDateSelect={(date) => {
                setForm({
                  ...form,
                  date,
                });
                setShowCalendar(false);
              }}
              maxBookingsPerDay={5}
            />

            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="mt-6 w-full rounded-2xl bg-white/10 py-3 font-bold text-white transition-all hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
