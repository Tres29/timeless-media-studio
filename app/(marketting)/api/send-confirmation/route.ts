import { NextResponse } from "next/server";
import { sendBookingEmail } from "@/lib/email/send-booking-email";

type Receipt = {
  packageName: string;
  packagePrice: number;
  subtotal: number;
  total: number;
  paidStatus: "cash_on_site" | "pending_online_payment";
};

type BookingRequest = {
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
  status?: "pending" | "approved" | "cancelled"; // Add status field
};

export async function POST(req: Request) {
  try {
    const booking: BookingRequest = await req.json();

    if (!booking.email || !booking.name || !booking.confirmationNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required booking fields.",
        },
        { status: 400 }
      );
    }

    // Call the utility function directly
    const result = await sendBookingEmail(booking);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    interface ErrorWithCode extends Error {
      code?: string;
    }

    let errorCode: string | null = null;
    if (error instanceof Error) {
      const err = error as ErrorWithCode;
      errorCode = err.code || null;
    }

    console.error(`\n❌ FINAL ERROR - Email send failed`);
    console.error(`   Message: ${errorMessage}`);
    console.error(`   Code: ${errorCode}`);
    console.error(`   Type: ${error instanceof Error ? error.name : typeof error}`);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send confirmation email.",
        error: errorMessage,
        errorCode: errorCode,
        details:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
