"use client";

import { useState, useEffect } from "react";

interface BookingCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  maxBookingsPerDay?: number;
}

interface DateBookingCount {
  [key: string]: number;
}

export default function BookingCalendar({
  selectedDate,
  onDateSelect,
  maxBookingsPerDay = 5,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingCounts, setBookingCounts] = useState<DateBookingCount>({});

  // Fetch booking counts for the month
  useEffect(() => {
    const fetchBookingCounts = async () => {
      try {
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const response = await fetch(
          `/api/bookings/available-dates?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setBookingCounts(data.bookingCounts || {});
        }
      } catch (error) {
        console.error("Failed to fetch booking counts:", error);
      }
    };

    fetchBookingCounts();
  }, [currentMonth]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isDateFullyBooked = (dateStr: string) => {
    const count = bookingCounts[dateStr] || 0;
    return count >= maxBookingsPerDay;
  };

  const getBookingCountForDate = (dateStr: string) => {
    return bookingCounts[dateStr] || 0;
  };

  const isDateInPast = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (year: number, month: number, day: number) => {
    const dateStr = formatDate(year, month, day);
    
    if (!isDateInPast(year, month, day) && !isDateFullyBooked(dateStr)) {
      onDateSelect(dateStr);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="w-full space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
        >
          ← Previous
        </button>

        <h3 className="text-lg font-black text-white">
          {monthName} {year}
        </h3>

        <button
          type="button"
          onClick={handleNextMonth}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
        {/* Day Headers */}
        <div className="mb-3 grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-black uppercase text-white/60"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} />;
            }

            const dateStr = formatDate(year, currentMonth.getMonth(), day);
            const isPast = isDateInPast(year, currentMonth.getMonth(), day);
            const isFullyBooked = isDateFullyBooked(dateStr);
            const isSelected = selectedDate === dateStr;
            const bookingCount = getBookingCountForDate(dateStr);

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => handleDateClick(year, currentMonth.getMonth(), day)}
                disabled={isPast || isFullyBooked}
                className={`relative aspect-square rounded-lg transition-all ${
                  isSelected
                    ? "border-2 border-blue-500 bg-blue-500/30"
                    : isPast || isFullyBooked
                      ? "border border-white/10 bg-white/[0.05] text-white/30 cursor-not-allowed"
                      : "border border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/30"
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-sm font-bold">{day}</span>
                  <span
                    className={`text-xs ${
                      isFullyBooked
                        ? "text-red-400"
                        : bookingCount > 0
                          ? "text-yellow-300"
                          : "text-green-400"
                    }`}
                  >
                    {bookingCount}/{maxBookingsPerDay}
                  </span>
                </div>

                {isFullyBooked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                    <span className="text-xs font-bold text-white">FULL</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-lg bg-white/[0.06] border border-white/10 p-3 text-xs text-white/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-400" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-yellow-300" />
            <span>Limited (1-4 bookings)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-400" />
            <span>Fully Booked (5 bookings)</span>
          </div>
        </div>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="rounded-lg bg-blue-500/20 border border-blue-500/30 p-3 text-center">
          <p className="text-sm font-semibold text-blue-200">
            Selected Date:{" "}
            <span className="font-black text-blue-100">{selectedDate}</span>
          </p>
        </div>
      )}
    </div>
  );
}
