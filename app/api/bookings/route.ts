import { NextResponse } from "next/server";
import { sendBookingEmail } from "@/lib/email/send-booking-email";
import { supabaseRequest } from "@/lib/supabase/server";

type BookingStatus =
  | "pending"
  | "approved"
  | "in_process"
  | "for_pick_up"
  | "completed"
  | "cancelled";

const allowedStatuses: BookingStatus[] = [
  "pending",
  "approved",
  "in_process",
  "for_pick_up",
  "completed",
  "cancelled",
];

function generateConfirmationNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `BK-${year}-${random}`;
}

function normalizeBooking(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    booking_date: row.booking_date,
    package_type: row.package_type,
    message: row.message,
    confirmation_number: row.confirmation_number,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const confirmationNumber = searchParams.get("confirmationNumber");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    let query = "/bookings?select=*&order=created_at.desc";

    if (confirmationNumber) {
      query = `/bookings?confirmation_number=ilike.${encodeURIComponent(
        confirmationNumber.trim()
      )}&select=*&limit=1`;
    } else if (email) {
      query = `/bookings?email=ilike.${encodeURIComponent(
        email.trim()
      )}&select=*&order=created_at.desc`;
    } else if (phone) {
      query = `/bookings?phone=ilike.${encodeURIComponent(
        phone.trim()
      )}&select=*&order=created_at.desc`;
    }

    const data = await supabaseRequest(query);

    if (confirmationNumber) {
      const dataArray = Array.isArray(data) ? data : [data];
      if (!dataArray?.[0]) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }

      return NextResponse.json(normalizeBooking(dataArray[0]));
    }

    return NextResponse.json((Array.isArray(data) ? data : []).map(normalizeBooking));
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
    const body = await req.json();

    if (!body.name || !body.phone || !body.email || !body.date || !body.packageType) {
      return NextResponse.json(
        { error: "Name, phone, email, date, and package are required." },
        { status: 400 }
      );
    }

    const confirmationNumber =
      body.confirmationNumber || generateConfirmationNumber();

    const rows = await supabaseRequest("/bookings?select=*", {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        phone: body.phone,
        email: String(body.email).toLowerCase().trim(),
        email_provider: body.emailProvider || null,
        booking_date: body.date,
        package_type: body.packageType,
        message: body.message || null,
        confirmation_number: confirmationNumber,
        status: body.status || "pending",
      }),
    });

    const rowsArray = Array.isArray(rows) ? rows : [rows];
    const booking = rowsArray?.[0];

    if (booking?.email) {
      await sendBookingEmail({
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        date: booking.booking_date,
        packageType: booking.package_type,
        message: booking.message || undefined,
        confirmationNumber: booking.confirmation_number,
        status: "pending",
      }).catch((error) => {
        console.error("Booking confirmation email failed:", error);
      });
    }

    return NextResponse.json(normalizeBooking(booking), { status: 201 });
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
    const body = await req.json();

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
      return NextResponse.json({ error: "Invalid booking status." }, { status: 400 });
    }

    const currentRows = await supabaseRequest(`/bookings?${filter}&select=*`);
    const currentRowsArray = Array.isArray(currentRows) ? currentRows : [currentRows];
    const currentBooking = currentRowsArray?.[0];

    if (!currentBooking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) updateData.status = body.status;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.date !== undefined) updateData.booking_date = body.date;
    if (body.packageType !== undefined) updateData.package_type = body.packageType;
    if (body.message !== undefined) updateData.message = body.message || null;

    const rows = await supabaseRequest(`/bookings?${filter}&select=*`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });

    const rowsArray2 = Array.isArray(rows) ? rows : [rows];
    const updatedBooking = rowsArray2?.[0];

    if (!updatedBooking) {
      return NextResponse.json(
        { error: "Booking not found or not updated." },
        { status: 404 }
      );
    }

    const statusChanged = body.status && body.status !== currentBooking.status;

    if (
      statusChanged &&
      updatedBooking.email &&
      (updatedBooking.status === "approved" ||
        updatedBooking.status === "cancelled")
    ) {
      await sendBookingEmail({
        name: updatedBooking.name,
        email: updatedBooking.email,
        phone: updatedBooking.phone,
        date: updatedBooking.booking_date,
        packageType: updatedBooking.package_type,
        message: updatedBooking.message || undefined,
        confirmationNumber: updatedBooking.confirmation_number,
        status: updatedBooking.status,
      }).catch((error) => {
        console.error("Status email failed but booking was updated:", error);
      });
    }

    return NextResponse.json(normalizeBooking(updatedBooking));
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

    const rows = await supabaseRequest(`/bookings?${filter}&select=*`, {
      method: "DELETE",
    });

    const rowsArray = Array.isArray(rows) ? rows : [rows];
    return NextResponse.json({
      success: true,
      deleted: rowsArray?.[0] ? normalizeBooking(rowsArray[0]) : null,
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
