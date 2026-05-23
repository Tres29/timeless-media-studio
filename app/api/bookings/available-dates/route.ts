import { NextResponse } from "next/server";
import { supabaseRequest } from "@/lib/supabase/server";

type BookingRow = {
  booking_date: string;
  status?: string | null;
};

function toDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required." },
        { status: 400 }
      );
    }

    const rows = await supabaseRequest<BookingRow[]>(
      `/bookings?booking_date=gte.${encodeURIComponent(startDate)}&booking_date=lte.${encodeURIComponent(endDate)}&status=neq.cancelled&select=booking_date,status`
    );

    const bookingCounts = rows.reduce<Record<string, number>>((acc, booking) => {
      const key = toDateKey(booking.booking_date);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({ bookingCounts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load availability." },
      { status: 500 }
    );
  }
}
