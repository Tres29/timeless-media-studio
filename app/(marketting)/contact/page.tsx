"use client";

import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

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
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    date: "",
    packageType: "",
    message: "",
  });

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [trackerCode, setTrackerCode] = useState("");
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerError, setTrackerError] = useState("");
  const [trackerMessage, setTrackerMessage] = useState("");
  const [trackedBooking, setTrackedBooking] = useState<BookingLog | null>(null);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [editBooking, setEditBooking] = useState<FormState>({
    name: "",
    phone: "",
    date: "",
    packageType: "",
    message: "",
  });

  const [dialogEmail, setDialogEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailProvider, setEmailProvider] = useState<EmailProvider | "">("");
  const [confirmationNumber, setConfirmationNumber] = useState("");

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
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEditBooking({
      ...editBooking,
      [e.target.name]: e.target.value,
    });
  };

  const openEmailDialog = (e: FormEvent) => {
    e.preventDefault();
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
  };

  const trackBooking = async () => {
    if (!trackerCode.trim()) {
      setTrackerError("Please enter your confirmation number.");
      return;
    }

    setTrackerLoading(true);
    setTrackerError("");
    setTrackerMessage("");

    try {
      const response = await fetch(
        `/api/bookings?confirmationNumber=${encodeURIComponent(
          trackerCode.trim()
        )}`
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

      if (!bookingResponse.ok || !savedBooking) {
        setEmailError(savedBooking?.error || "Failed to save booking.");
        return;
      }

      await fetch("/api/send-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bookingPayload,
          confirmationNumber:
            savedBooking.confirmation_number || generatedConfirmation,
        }),
      });

      setShowEmailDialog(false);
      setConfirmationNumber(
        savedBooking.confirmation_number || generatedConfirmation
      );

      setForm({
        name: "",
        phone: "",
        date: "",
        packageType: "",
        message: "",
      });
    } catch {
      setEmailError("Failed to connect to booking database.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050505] px-5 pb-12 pt-28 font-sans text-white sm:px-8 sm:pt-32 lg:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_30%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col justify-center text-center lg:text-left">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.35em] text-white/70">
            Book Now
          </p>

          <h1 className="mx-auto max-w-3xl text-[42px] font-black leading-[0.95] tracking-[-0.05em] text-[#d7d7d7] drop-shadow-2xl sm:text-[64px] lg:mx-0 lg:text-[88px]">
            Make your
            <br />
            memories
            <br />
            documented
            <br />
            with us.
          </h1>

          <div className="mx-auto mb-6 mt-8 h-px w-full max-w-xl bg-gradient-to-r from-transparent via-white/60 to-transparent lg:mx-0 lg:bg-gradient-to-r lg:from-white/60 lg:to-transparent" />

          <p className="mx-auto max-w-md text-base leading-7 text-white/55 lg:mx-0">
            After booking, you will receive a confirmation number for tracking.
          </p>

          <button
            type="button"
            onClick={openTrackerModal}
            className="mx-auto mt-8 rounded-2xl bg-white px-8 py-4 font-black uppercase tracking-[0.18em] text-black shadow-[0_16px_45px_rgba(255,255,255,0.18)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] active:scale-95 lg:mx-0"
          >
            Track Order
          </button>

          <div className="mx-auto mt-10 w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.08] p-5 text-left shadow-[0_25px_80px_rgba(255,255,255,0.1)] backdrop-blur-2xl lg:mx-0 lg:max-w-none sm:p-6">
            <h3 className="mb-4 text-xl font-black sm:text-2xl">
              Frequently Asked Questions
            </h3>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-3xl bg-white/[0.06] transition hover:bg-white/[0.1]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left"
                  >
                    <span className="font-black">{faq.question}</span>
                    <span
                      className={`text-xl transition-transform duration-300 ${
                        openFaq === index ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openFaq === index
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-4 pb-4 text-sm leading-6 text-white/60">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md space-y-6 lg:max-w-none">
          <form
            onSubmit={openEmailDialog}
            className="w-full rounded-[32px] border border-white/10 bg-white/[0.08] p-6 shadow-[0_30px_120px_rgba(255,255,255,0.12)] backdrop-blur-2xl transition-all duration-500 hover:border-white/20 hover:bg-white/[0.1] sm:p-9"
          >
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-white/80">
              Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your full name"
              className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/90 px-4 text-sm text-black outline-none transition-all duration-300 placeholder:text-gray-500 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
            />

            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-white/80">
              Phone Number
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="09XXXXXXXXX"
              className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/90 px-4 text-sm text-black outline-none transition-all duration-300 placeholder:text-gray-500 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
            />

            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-white/80">
              Date
            </label>
            <input
              title="date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/90 px-4 text-sm text-black outline-none transition-all duration-300 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
            />

            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-white/80">
              Package
            </label>
            <select
              title="package"
              name="packageType"
              value={form.packageType}
              onChange={handleChange}
              required
              className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/90 px-4 text-sm text-black outline-none transition-all duration-300 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
            >
              <option value="">Select Package</option>
              <option value="BASIC PACKAGE - ₱10">BASIC PACKAGE - ₱10</option>
              <option value="ELITE PACKAGE - ₱20">ELITE PACKAGE - ₱20</option>
              <option value="PREMIUM PACKAGE - ₱30">
                PREMIUM PACKAGE - ₱30
              </option>
            </select>

            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-white/80">
              Message
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              placeholder="Tell us more about your booking..."
              className="h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-sm text-black outline-none transition-all duration-300 placeholder:text-gray-500 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
            />

            <button
              type="submit"
              className="group relative mt-7 w-full overflow-hidden rounded-2xl bg-white py-4 font-black uppercase tracking-[0.18em] text-black shadow-[0_16px_45px_rgba(255,255,255,0.18)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.96]"
            >
              <span className="relative flex items-center justify-center gap-3">
                Submit Booking
                <span>→</span>
              </span>
            </button>
          </form>

          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.08] p-4 shadow-[0_25px_80px_rgba(255,255,255,0.1)] backdrop-blur-2xl">
            <h3 className="mb-4 text-xl font-black sm:text-2xl">Find Us</h3>

            <div className="overflow-hidden rounded-3xl border border-white/10">
              <iframe
                title="Studio Location Map"
                src="https://www.google.com/maps?q=Quezon%20City%20Philippines&output=embed"
                className="h-[260px] w-full border-0 sm:h-[320px]"
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

      {showEmailDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#141414]/95 p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.7)]">
            <h2 className="mb-2 text-2xl font-black">Confirm Your Booking</h2>

            <input
              type="email"
              value={dialogEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
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
                disabled={sending}
                className="w-1/2 rounded-2xl bg-white py-3 font-black text-black disabled:opacity-60"
              >
                {sending ? "SENDING..." : "CONFIRM"}
              </button>
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
              onChange={(e) => setTrackerCode(e.target.value)}
              placeholder="BK-2026-123456"
              className="mb-4 h-12 w-full rounded-2xl bg-white px-4 text-black"
            />

            <button
              type="button"
              onClick={trackBooking}
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
                          trackerLoading ||
                          isCancelDisabled(trackedBooking.status)
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
    </section>
  );
}