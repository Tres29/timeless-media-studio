import { NextResponse } from "next/server";
import { supabaseRequest } from "@/lib/supabase/server";
import type {
  BookingPayload,
  BookingRow,
  BookingStatus,
} from "@/lib/supabase/types";

const allowedStatuses: BookingStatus[] = [
  "pending",
  "approved",
  "in_process",
  "for_pick_up",
  "completed",
  "cancelled",
];

const generateConfirmationNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `BK-${year}-${random}`;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const confirmationNumber = searchParams.get("confirmationNumber");

    const query = confirmationNumber
      ? `/bookings?confirmation_number=ilike.${encodeURIComponent(
          confirmationNumber.trim()
        )}&select=*&limit=1`
      : "/bookings?select=*&order=created_at.desc";

    const data = await supabaseRequest<BookingRow[]>(query);

    if (confirmationNumber) {
      if (!data?.[0]) {
        return NextResponse.json(
          { error: "Booking not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(data[0]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load bookings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BookingPayload;

    if (
      !body.name ||
      !body.phone ||
      !body.email ||
      !body.date ||
      !body.packageType
    ) {
      return NextResponse.json(
        { error: "Name, phone, email, date, and package are required." },
        { status: 400 }
      );
    }

    const confirmationNumber =
      body.confirmationNumber || generateConfirmationNumber();

    const rows = await supabaseRequest<BookingRow[]>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        phone: body.phone,
        email: body.email.toLowerCase().trim(),
        email_provider: body.emailProvider || null,
        booking_date: body.date,
        package_type: body.packageType,
        message: body.message || null,
        confirmation_number: confirmationNumber,
        status: body.status || "pending",
      }),
    });

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid booking request.",
      },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      confirmationNumber?: string;
      status?: BookingStatus;
      name?: string;
      phone?: string;
      date?: string;
      packageType?: string;
      message?: string;
    };

    const filter = body.id
      ? `id=eq.${encodeURIComponent(body.id)}`
      : body.confirmationNumber
      ? `confirmation_number=eq.${encodeURIComponent(body.confirmationNumber)}`
      : "";

    if (!filter) {
      return NextResponse.json(
        { error: "Booking id or confirmation number is required." },
        { status: 400 }
      );
    }

    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid booking status." },
        { status: 400 }
      );
    }

    // Get current booking before updating
    const currentBookingRows = await supabaseRequest<BookingRow[]>(
      `/bookings?${filter}&select=*`
    );

    const currentBooking = currentBookingRows?.[0];
    if (!currentBooking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    const updateData: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) updateData.status = body.status;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.date !== undefined) updateData.booking_date = body.date;
    if (body.packageType !== undefined) {
      updateData.package_type = body.packageType;
    }
    if (body.message !== undefined) {
      updateData.message = body.message || null;
    }

    const rows = await supabaseRequest<BookingRow[]>(
      `/bookings?${filter}&select=*`,
      {
        method: "PATCH",
        body: JSON.stringify(updateData),
      }
    );

    if (!rows?.[0]) {
      return NextResponse.json(
        { error: "Booking not found or not updated." },
        { status: 404 }
      );
    }

    const updatedBooking = rows[0];
    const statusChanged = body.status && body.status !== currentBooking.status;

    // Trigger send-confirmation email if status changed to approved or cancelled
    if (statusChanged && updatedBooking.email && (updatedBooking.status === "approved" || updatedBooking.status === "cancelled")) {
      console.log(`\n📨 ===== EMAIL TRIGGER START =====`);
      console.log(`Status: ${updatedBooking.status}`);
      console.log(`Email: ${updatedBooking.email}`);
      console.log(`Confirmation #: ${updatedBooking.confirmation_number}`);
      
      try {
        console.log(`🔍 Importing sendBookingEmail utility...`);
        const { sendBookingEmail } = await import(
          "@/lib/email/send-booking-email"
        );
        console.log(`✓ Import successful`);

        const confirmationPayload = {
          name: updatedBooking.name,
          email: updatedBooking.email,
          phone: updatedBooking.phone,
          date: updatedBooking.booking_date,
          packageType: updatedBooking.package_type,
          message: updatedBooking.message || undefined,
          confirmationNumber: updatedBooking.confirmation_number,
          status: updatedBooking.status,
        };

        console.log(`📋 Payload:`, {
          name: confirmationPayload.name,
          email: confirmationPayload.email,
          phone: confirmationPayload.phone,
          date: confirmationPayload.date,
          packageType: confirmationPayload.packageType,
          confirmationNumber: confirmationPayload.confirmationNumber,
          status: confirmationPayload.status,
          hasMessage: !!confirmationPayload.message,
        });

        console.log(`📤 Calling sendBookingEmail...`);
        const result = await sendBookingEmail(confirmationPayload);
        
        console.log(`✅ Email send result:`, result);
        console.log(`📨 ===== EMAIL TRIGGER SUCCESS =====\n`);
      } catch (emailError) {
        console.error(`\n❌ ===== EMAIL TRIGGER FAILED =====`);
        console.error(`Status: ${updatedBooking.status}`);
        console.error(`Email: ${updatedBooking.email}`);
        console.error(`Error Name: ${emailError instanceof Error ? emailError.name : "Unknown"}`);
        console.error(`Error Message: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
        console.error(`Error Stack:`, emailError instanceof Error ? emailError.stack : "No stack");
        console.error(`Full Error Object:`, emailError);
        console.error(`❌ ===== EMAIL TRIGGER FAILED =====\n`);
        // Don't throw - email error shouldn't fail the booking update
      }
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid update request.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { searchParams } = new URL(req.url);

    const id = body?.id || searchParams.get("id");
    const confirmationNumber =
      body?.confirmationNumber || searchParams.get("confirmationNumber");

    const filter = id
      ? `id=eq.${encodeURIComponent(id)}`
      : confirmationNumber
      ? `confirmation_number=eq.${encodeURIComponent(confirmationNumber)}`
      : "";

    if (!filter) {
      return NextResponse.json(
        { error: "Booking id or confirmation number is required." },
        { status: 400 }
      );
    }

    const rows = await supabaseRequest<BookingRow[]>(
      `/bookings?${filter}&select=*`,
      {
        method: "DELETE",
      }
    );

    return NextResponse.json({
      success: true,
      deleted: rows?.[0] || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete booking.",
      },
      { status: 500 }
    );
  }
}