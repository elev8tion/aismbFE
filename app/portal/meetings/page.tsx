'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  date: string;
  time: string;
  duration?: number;
  status: string;
  notes?: string;
}

export default function PortalMeetingsPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      try {
        const res = await fetch(`/api/data/read/bookings?guest_email=${encodeURIComponent(user.email)}`, {
          credentials: 'include',
        });
        const data = await res.json();
        setBookings(data.data || []);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email]);

  const now = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter((b) => b.date >= now);
  const past = bookings.filter((b) => b.date < now);
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <PortalLayout>
      <div className="page-content">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{t.portal.upcoming}</h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'upcoming'
                ? 'bg-primary-electricBlue/20 text-primary-electricBlue'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            {t.bookings.upcoming} ({upcoming.length})
          </button>
          <button
            onClick={() => setTab('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'past'
                ? 'bg-primary-electricBlue/20 text-primary-electricBlue'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            {t.bookings.past} ({past.length})
          </button>
        </div>

        {loading ? (
          <div className="card p-12 text-center">
            <p className="text-white/60">{t.common.loading}</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-white/50">{t.portal.noMeetings}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap)' }}>
            {displayed.map((booking) => (
              <div key={booking.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-white">{booking.date}</p>
                    <p className="text-sm text-white/50 mt-0.5">
                      {booking.time}
                      {booking.duration && ` (${booking.duration} ${t.bookings.minutesShort})`}
                    </p>
                    {booking.notes && (
                      <p className="text-xs text-white/40 mt-1">{booking.notes}</p>
                    )}
                  </div>
                  <span className={`tag ${
                    booking.status === 'confirmed' ? 'tag-success'
                    : booking.status === 'cancelled' ? 'tag-error'
                    : 'tag-warning'
                  }`}>
                    {booking.status === 'confirmed' ? t.bookings.confirmed
                    : booking.status === 'cancelled' ? t.bookings.cancelled
                    : t.bookings.pending}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
