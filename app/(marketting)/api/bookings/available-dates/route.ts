import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return Response.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Fetch all non-cancelled bookings within date range
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('booking_date')
      .gte('booking_date', new Date(startDate).toISOString().split('T')[0])
      .lte('booking_date', new Date(endDate).toISOString().split('T')[0])
      .neq('status', 'cancelled');

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Count bookings per date
    const bookingCounts: Record<string, number> = {};
    bookings?.forEach((booking: any) => {
      const date = booking.booking_date;
      bookingCounts[date] = (bookingCounts[date] || 0) + 1;
    });

    return Response.json({
      bookingCounts,
      totalBookings: bookings?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
