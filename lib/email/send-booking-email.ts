import nodemailer from "nodemailer";

type BookingStatus = "pending" | "approved" | "cancelled";

type Receipt = {
  packageName: string;
  packagePrice: number;
  subtotal: number;
  total: number;
  paidStatus?: "cash_on_site" | "pending_online_payment" | "paid";
};

export type BookingEmailPayload = {
  name: string;
  email: string;
  emailProvider?: string;
  phone: string;
  date: string;
  packageType: string;
  message?: string;
  confirmationNumber: string;
  paymentMethod?: string;
  receipt?: Receipt;
  status?: BookingStatus;
};

function peso(value?: number) {
  return typeof value === "number" ? `₱${value.toLocaleString("en-PH")}` : "N/A";
}

export async function sendBookingEmail(booking: BookingEmailPayload) {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = process.env.EMAIL_SECURE === "true" || port === 465;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error("Missing email environment variables.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const status = booking.status || "pending";

  const subject =
    status === "approved"
      ? `Booking Approved - ${booking.confirmationNumber}`
      : status === "cancelled"
        ? `Booking Cancelled - ${booking.confirmationNumber}`
        : `Booking Confirmation - ${booking.confirmationNumber}`;

  const title =
    status === "approved"
      ? "Your booking has been approved!"
      : status === "cancelled"
        ? "Your booking has been cancelled."
        : "Your booking request has been received.";

  const bodyMessage =
    status === "cancelled"
      ? "We regret to inform you that your booking has been cancelled. If you have questions or want to reschedule, please contact Timeless Media Studio."
      : status === "approved"
        ? "Your booking is now approved. We are excited to work with you."
        : "Thank you for choosing Timeless Media Studio. Please wait for approval from our team.";

  const receiptHtml = booking.receipt
    ? `
      <div style="margin-top:24px;padding:16px;border:1px solid #e5e5e5;border-radius:12px;">
        <h3 style="margin:0 0 12px;">Receipt Summary</h3>
        <p><strong>Package:</strong> ${booking.receipt.packageName}</p>
        <p><strong>Package Price:</strong> ${peso(booking.receipt.packagePrice)}</p>
        <p><strong>Subtotal:</strong> ${peso(booking.receipt.subtotal)}</p>
        <p><strong>Total:</strong> ${peso(booking.receipt.total)}</p>
      </div>
    `
    : "";

  await transporter.sendMail({
    from: `"Timeless Media Studio" <${user}>`,
    to: booking.email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:auto;">
        <div style="background:#111;color:#fff;padding:24px;border-radius:16px 16px 0 0;">
          <h1 style="margin:0;font-size:24px;">${title}</h1>
        </div>

        <div style="padding:24px;border:1px solid #e5e5e5;border-top:0;border-radius:0 0 16px 16px;">
          <p>Hello ${booking.name},</p>
          <p>${bodyMessage}</p>

          <div style="margin-top:24px;padding:16px;background:#fafafa;border-radius:12px;">
            <h3 style="margin:0 0 12px;">Booking Details</h3>
            <p><strong>Confirmation Number:</strong> ${booking.confirmationNumber}</p>
            <p><strong>Name:</strong> ${booking.name}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Phone:</strong> ${booking.phone}</p>
            <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString("en-PH")}</p>
            <p><strong>Package:</strong> ${booking.packageType}</p>
            ${booking.message ? `<p><strong>Message:</strong> ${booking.message}</p>` : ""}
          </div>

          ${receiptHtml}

          <p style="margin-top:24px;">Please save your confirmation number for tracking and support.</p>
          <p style="margin-top:24px;">Timeless Media Studio</p>
        </div>
      </div>
    `,
  });

  return {
    success: true,
    message:
      status === "cancelled"
        ? "Cancellation email sent."
        : status === "approved"
          ? "Approval email sent."
          : "Confirmation email sent.",
  };
}
