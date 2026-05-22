import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        {
          error: "Database not configured",
          bookingCounts: {},
          totalBookings: 0,
        },
        { status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return Response.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate).toISOString().split("T")[0];
    const end = new Date(endDate).toISOString().split("T")[0];

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("booking_date")
      .gte("booking_date", start)
      .lte("booking_date", end)
      .neq("status", "cancelled");

    if (error) {
      return Response.json(
        { error: "Failed to fetch bookings", bookingCounts: {}, totalBookings: 0 },
        { status: 500 }
      );
    }

    const bookingCounts: Record<string, number> = {};

    bookings?.forEach((booking: { booking_date: string }) => {
      bookingCounts[booking.booking_date] =
        (bookingCounts[booking.booking_date] || 0) + 1;
    });

    return Response.json({
      bookingCounts,
      totalBookings: bookings?.length || 0,
    });
  } catch {
    return Response.json(
      { error: "Internal server error", bookingCounts: {}, totalBookings: 0 },
      { status: 500 }
    );
  }
}
