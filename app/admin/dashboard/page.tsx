'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BookingStatus } from '@/lib/supabase/types';

type BookingLog = {
  id: string;
  name: string;
  phone: string;
  email: string;
  email_provider?: string | null;
  booking_date: string;
  package_type: string;
  message?: string | null;
  confirmation_number: string;
  status: BookingStatus;
  created_at: string;
  updated_at?: string | null;
};

const statusOptions: BookingStatus[] = [
  'approved',
  'in_process',
  'for_pick_up',
  'completed',
  'cancelled',
];

export default function AdminPanel() {
  const router = useRouter();

  const [bookingLogs, setBookingLogs] = useState<BookingLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/bookings', { cache: 'no-store' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to load bookings.');
      }

      const data = (await response.json()) as BookingLog[];

      setBookingLogs(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const isAuthenticated = document.cookie
      .split('; ')
      .some((cookie) => cookie === 'adminAuthenticated=true');

    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    const runInitialLoad = async () => {
      await loadData();
    };

    void runInitialLoad();

    const interval = window.setInterval(() => {
      void loadData();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };

  }, [loadData, router]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to update booking status.');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking.');
    }
  };

  const reinstateBooking = async (id: string) => {
    await updateStatus(id, 'pending');
  };

  const remove = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete booking.');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete booking.');
    }
  };

  const filteredBookingLogs = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return bookingLogs;

    return bookingLogs.filter(
      (log) =>
        log.confirmation_number?.toLowerCase().includes(q) ||
        log.name?.toLowerCase().includes(q) ||
        log.phone?.toLowerCase().includes(q) ||
        log.email?.toLowerCase().includes(q)
    );
  }, [bookingLogs, search]);

  const formatDate = (d: string) => {
    if (!d) return 'No date';
    return new Date(d).toLocaleString();
  };

  const statusLabel = (status?: BookingStatus) => {
    if (status === 'approved') return 'Approved';
    if (status === 'in_process') return 'In Process';
    if (status === 'for_pick_up') return 'For Pick Up';
    if (status === 'completed') return 'Completed';
    if (status === 'cancelled') return 'Cancelled';
    return 'Pending';
  };

  const statusClass = (status?: BookingStatus) => {
    if (status === 'approved') return 'bg-green-600';
    if (status === 'in_process') return 'bg-blue-600';
    if (status === 'for_pick_up') return 'bg-purple-600';
    if (status === 'completed') return 'bg-gray-600';
    if (status === 'cancelled') return 'bg-red-600';
    return 'bg-yellow-600';
  };

  const logout = () => {
    document.cookie = 'adminAuthenticated=; path=/; max-age=0; SameSite=Lax';
    router.push('/admin/login');
  };

  const renderLogCard = (log: BookingLog) => (
    <div
      key={log.id}
      className="rounded-xl border border-gray-800 bg-gray-900 p-4"
    >
      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
        <div>
          <p className="text-lg font-bold">{log.name}</p>

          <p className="text-sm font-bold text-green-300">
            🔎 Confirmation: {log.confirmation_number}
          </p>

          <p className="text-sm text-gray-400">📧 {log.email}</p>
          <p className="text-sm text-gray-400">📞 {log.phone}</p>
          <p className="text-sm text-gray-400">📅 {log.booking_date}</p>
          <p className="text-sm text-gray-400">🧾 {log.package_type}</p>

          {log.message && (
            <p className="text-sm text-gray-400">💬 {log.message}</p>
          )}

          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-xs text-white ${statusClass(
              log.status
            )}`}
          >
            {statusLabel(log.status)}
          </span>
        </div>

        <div className="text-xs text-gray-500">
          {formatDate(log.created_at)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => updateStatus(log.id, status)}
            disabled={log.status === status}
            className="rounded bg-white/10 px-3 py-1 text-xs text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {statusLabel(status)}
          </button>
        ))}

        {log.status === 'cancelled' && (
          <button
            type="button"
            onClick={() => reinstateBooking(log.id)}
            className="rounded bg-yellow-600 px-3 py-1 text-xs text-white transition hover:bg-yellow-700"
          >
            Reinstate Booking
          </button>
        )}

        <button
          type="button"
          onClick={() => remove(log.id)}
          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading admin panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex flex-col gap-4 border-b border-gray-800 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-400">
            Supabase Booking Management
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded bg-red-600 px-4 py-2 transition hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 p-6">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm text-gray-400">Total Bookings</p>
            <p className="text-3xl font-black">{bookingLogs.length}</p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm text-gray-400">Pending</p>
            <p className="text-3xl font-black">
              {bookingLogs.filter((log) => log.status === 'pending').length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm text-gray-400">Completed</p>
            <p className="text-3xl font-black">
              {bookingLogs.filter((log) => log.status === 'completed').length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm text-gray-400">Cancelled</p>
            <p className="text-3xl font-black">
              {bookingLogs.filter((log) => log.status === 'cancelled').length}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search confirmation number, name, phone, or email..."
            className="h-12 w-full rounded-xl border border-gray-700 bg-black px-4 text-white outline-none focus:border-white"
          />
        </div>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Booking Requests</h2>

          <div className="space-y-4">
            {filteredBookingLogs.length === 0 ? (
              <p className="text-gray-500">No matching booking requests.</p>
            ) : (
              filteredBookingLogs.map((log) => renderLogCard(log))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}