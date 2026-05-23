import { NextResponse } from "next/server";
import { sendBookingEmail } from "@/lib/email/send-booking-email";

export async function POST(req: Request) {
  try {
    const booking = await req.json();

    if (!booking.email || !booking.name || !booking.confirmationNumber) {
      return NextResponse.json(
        { success: false, message: "Missing required booking fields." },
        { status: 400 }
      );
    }

    const result = await sendBookingEmail(booking);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send email.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
