import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: 'Database not configured', bookingCounts: {}, totalBookings: 0 },
        { status: 200 }
      );
    }

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
    interface BookingRecord {
      booking_date: string;
    }
    const bookingCounts: Record<string, number> = {};
    (bookings as BookingRecord[])?.forEach((booking: BookingRecord) => {
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
