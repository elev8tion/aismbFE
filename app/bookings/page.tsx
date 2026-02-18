'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { LandingPageBooking, BookingStatus } from '@kre8tion/shared-types';

// Type alias for clarity in this file
type Booking = LandingPageBooking;

export default function BookingsPage() {
  const { t } = useTranslations();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/bookings', { credentials: 'include' });
      const data: { data?: Booking[] } = await res.json();
      if (data.data) {
        // Sort by date descending (newest first)
        const sorted = data.data.sort((a, b) =>
          `${b.booking_date}T${b.start_time}`.localeCompare(`${a.booking_date}T${a.start_time}`)
        );
        setBookings(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Voice actions
  const { subscribe } = useVoiceAgentActions();
  useEffect(() => {
    const unsub = subscribe((action) => {
      if (!action || action.type !== 'ui_action' || action.scope !== 'bookings') return;
      const a = action.action;
      const payload = (action.payload || {}) as any;
      if (a === 'set_filter' && typeof payload.filter === 'string') {
        setFilter(payload.filter);
      } else if (a === 'search' && typeof payload.query === 'string') {
        setSearch(payload.query);
      } else if (a === 'open_view') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: Booking | undefined;
        if (id) match = bookings.find(b => String(b.id) === String(id));
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = bookings.find(b => (
            b.guest_name.toLowerCase().includes(q) || b.guest_email.toLowerCase().includes(q)
          ));
        }
        if (match) setExpandedId(String(match.id));
      }
    });
    return () => { unsub(); };
  }, [subscribe, bookings]);

  const updateBookingStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/data/update/bookings?id=${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      }
    } catch (err) {
      console.error('Failed to update booking:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const rescheduleBooking = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return;
    setRescheduleSubmitting(true);
    try {
      const durationMinutes = rescheduleTarget.booking_type === 'assessment' ? 180 : 30;
      const [h, m] = rescheduleTime.split(':').map(Number);
      const endMinutes = h * 60 + m + durationMinutes;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const end_time = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      const res = await fetch(`/api/data/update/bookings?id=${rescheduleTarget.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_date: rescheduleDate, start_time: rescheduleTime, end_time }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b =>
          b.id === rescheduleTarget.id
            ? { ...b, booking_date: rescheduleDate, start_time: rescheduleTime, end_time }
            : b
        ));
        setRescheduleTarget(null);
      }
    } catch (err) {
      console.error('Failed to reschedule booking:', err);
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filtered = bookings.filter(b => {
    // Status filter
    if (filter === 'upcoming') return b.booking_date >= today && b.status !== 'cancelled';
    if (filter === 'past') return b.booking_date < today;
    if (filter === 'pending') return b.status === 'pending';
    if (filter === 'confirmed') return b.status === 'confirmed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true; // 'all'
  }).filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.guest_name.toLowerCase().includes(q) ||
           b.guest_email.toLowerCase().includes(q);
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'tag-success';
      case 'cancelled': return 'tag-error';
      case 'pending': return 'tag-warning';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return t.bookings.confirmed;
      case 'cancelled': return t.bookings.cancelled;
      case 'pending': return t.bookings.pending;
      default: return status;
    }
  };

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => b.booking_date >= today && b.status !== 'cancelled').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
  };

  return (
    <DashboardLayout>
      <ErrorBoundary>
      <div className="page-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[var(--space-section)]">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{t.bookings.title}</h1>
            <p className="text-sm md:text-base text-white/60 mt-1">{t.bookings.subtitle}</p>
          </div>
          <Link href="/bookings/availability" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <ClockIcon className="w-5 h-5" />
            {t.bookings.availability}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-[var(--space-section)]">
          <div className="card p-4">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/50">{t.bookings.totalBookings}</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-[#0EA5E9]">{stats.upcoming}</p>
            <p className="text-xs text-white/50">{t.bookings.upcoming}</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-[#F59E0B]">{stats.pending}</p>
            <p className="text-xs text-white/50">{t.bookings.pending}</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-[#22C55E]">{stats.confirmed}</p>
            <p className="text-xs text-white/50">{t.bookings.confirmed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-[var(--space-gap)]">
          <div className="flex bg-white/5 rounded-xl p-1 overflow-x-auto">
            {['all', 'upcoming', 'pending', 'confirmed', 'cancelled', 'past'].map((f) => {
              const labels: Record<string, string> = {
                all: t.bookings.all,
                upcoming: t.bookings.upcoming,
                pending: t.bookings.pending,
                confirmed: t.bookings.confirmed,
                cancelled: t.bookings.cancelled,
                past: t.bookings.past,
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    filter === f
                      ? 'bg-primary-electricBlue text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
          <div className="hidden md:block flex-1" />
          <input
            type="text"
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass w-full md:w-64"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="card p-12 text-center">
            <p className="text-white/60">{t.common.loading}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <CalendarEmptyIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">{t.bookings.noBookings}</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-glass min-w-[700px]">
                <thead>
                  <tr>
                    <th>{t.bookings.guest}</th>
                    <th>{t.bookings.date}</th>
                    <th>{t.bookings.time}</th>
                    <th>{t.bookings.status}</th>
                    <th>{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((booking) => (
                    <>
                      <tr key={booking.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === String(booking.id) ? null : String(booking.id))}>
                        <td>
                          <div>
                            <p className="font-medium text-white">{booking.guest_name}</p>
                            <p className="text-sm text-white/50">{booking.guest_email}</p>
                          </div>
                        </td>
                        <td className="text-white/80">{formatDate(booking.booking_date)}</td>
                        <td className="text-white/80">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </td>
                        <td>
                          <span className={`tag ${getStatusClass(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(String(booking.id), 'confirmed')}
                                  disabled={updatingId === booking.id}
                                  className="btn-ghost p-2 text-[#22C55E] hover:bg-[#22C55E]/10"
                                  title={t.bookings.confirmBooking}
                                >
                                  <CheckIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(String(booking.id), 'cancelled')}
                                  disabled={updatingId === booking.id}
                                  className="btn-ghost p-2 text-[#EF4444] hover:bg-[#EF4444]/10"
                                  title={t.bookings.cancelBooking}
                                >
                                  <XIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setRescheduleTarget(booking); setRescheduleDate(booking.booking_date); setRescheduleTime(booking.start_time); }}
                                  className="btn-ghost p-2 text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                                  title={t.bookings.reschedule}
                                >
                                  <CalendarEditIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(String(booking.id), 'cancelled')}
                                  disabled={updatingId === booking.id}
                                  className="btn-ghost p-2 text-[#EF4444] hover:bg-[#EF4444]/10"
                                  title={t.bookings.cancelBooking}
                                >
                                  <XIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setRescheduleTarget(booking); setRescheduleDate(booking.booking_date); setRescheduleTime(booking.start_time); }}
                                  className="btn-ghost p-2 text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                                  title={t.bookings.reschedule}
                                >
                                  <CalendarEditIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setExpandedId(expandedId === String(booking.id) ? null : String(booking.id))}
                              className="btn-ghost p-2"
                            >
                              <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedId === booking.id ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === booking.id && (
                        <tr key={`${booking.id}-details`}>
                          <td colSpan={5}>
                            <div className="p-4 bg-white/5 rounded-lg mx-2 mb-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                              {booking.guest_phone && (
                                <div>
                                  <p className="text-xs text-white/50 mb-1">{t.bookings.phone}</p>
                                  <p className="text-sm text-white">{booking.guest_phone}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-white/50 mb-1">{t.bookings.timezone}</p>
                                <p className="text-sm text-white">{booking.timezone}</p>
                              </div>
                              <div>
                                <p className="text-xs text-white/50 mb-1">{t.bookings.duration}</p>
                                <p className="text-sm text-white">30 {t.bookings.minutesShort}</p>
                              </div>
                              {booking.notes && (
                                <div className="md:col-span-3">
                                  <p className="text-xs text-white/50 mb-1">{t.bookings.notes}</p>
                                  <p className="text-sm text-white">{booking.notes}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">{t.bookings.reschedule}</h3>
            <p className="text-sm text-white/60 mb-6">{rescheduleTarget.guest_name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">{t.bookings.newDate}</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={today}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="input-glass w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">{t.bookings.newTime}</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="input-glass w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={rescheduleBooking}
                disabled={rescheduleSubmitting || !rescheduleDate || !rescheduleTime}
                className="btn-primary flex-1"
              >
                {rescheduleSubmitting ? t.common.loading : t.bookings.rescheduleBooking}
              </button>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="btn-ghost flex-1"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
      </ErrorBoundary>
    </DashboardLayout>
  );
}

// Icons
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CalendarEditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l2 2 4-4" />
    </svg>
  );
}

function CalendarEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
