import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, name, confirmationNumber, date, packageType } =
      await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Client email is required." },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Timeless Studio" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Booking Has Been Cancelled",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Booking Cancelled</h2>
          <p>Hello ${name || "Customer"},</p>
          <p>This is to confirm that your booking/reservation has been cancelled.</p>

          <h3>Reservation Details</h3>
          <p><strong>Confirmation Number:</strong> ${confirmationNumber}</p>
          <p><strong>Date of Reservation:</strong> ${date}</p>
          <p><strong>Package Selected:</strong> ${packageType}</p>

          <p>If you believe this was a mistake, please contact Timeless Studio.</p>
          <p>Thank you.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel email error:", error);

    return NextResponse.json(
      { error: "Failed to send cancellation email." },
      { status: 500 }
    );
  }
}