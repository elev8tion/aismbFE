'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface AvailabilitySetting {
  id: string;
  weekday: number;
  start_minutes: number;
  end_minutes: number;
  is_available: boolean;
}

interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
}

const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function AvailabilityPage() {
  const { t } = useTranslations();
  const [availability, setAvailability] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [availRes, blockedRes] = await Promise.all([
        fetch('/api/data/read/availability_settings', { credentials: 'include' }),
        fetch('/api/data/read/blocked_dates', { credentials: 'include' }),
      ]);

      const availData: { data?: AvailabilitySetting[] } = await availRes.json();
      const blockedData: { data?: BlockedDate[] } = await blockedRes.json();

      if (availData.data && availData.data.length > 0) {
        // Sort by weekday
        const sorted = availData.data.sort((a, b) => a.weekday - b.weekday);
        setAvailability(sorted);
      }

      if (blockedData.data) {
        const sorted = blockedData.data.sort((a, b) => a.date.localeCompare(b.date));
        setBlockedDates(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateAvailability = (weekday: number, field: string, value: boolean | number) => {
    setAvailability(prev => prev.map(a =>
      a.weekday === weekday ? { ...a, [field]: value } : a
    ));
    setSaved(false);
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      // Update each availability setting
      await Promise.all(
        availability.map(a =>
          fetch(`/api/data/update/availability_settings?id=${a.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              is_available: a.is_available,
              start_minutes: a.start_minutes,
              end_minutes: a.end_minutes,
            }),
          })
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save availability:', err);
    } finally {
      setSaving(false);
    }
  };

  const addBlockedDate = async () => {
    if (!newBlockDate) return;
    try {
      const res = await fetch('/api/data/create/blocked_dates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newBlockDate,
          reason: newBlockReason || null,
        }),
      });
      if (res.ok) {
        const data: { data?: BlockedDate } = await res.json();
        if (data.data) {
          setBlockedDates(prev => [...prev, data.data!].sort((a, b) => a.date.localeCompare(b.date)));
        }
        setNewBlockDate('');
        setNewBlockReason('');
      }
    } catch (err) {
      console.error('Failed to add blocked date:', err);
    }
  };

  const removeBlockedDate = async (id: string) => {
    try {
      const res = await fetch(`/api/data/delete/blocked_dates?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setBlockedDates(prev => prev.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error('Failed to remove blocked date:', err);
    }
  };

  const formatBlockedDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getDayLabel = (weekday: number): string => {
    const key = WEEKDAY_KEYS[weekday];
    return t.bookings[key as keyof typeof t.bookings] as string;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-content">
          <div className="card p-12 text-center">
            <p className="text-white/60">{t.common.loading}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-content max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[var(--space-section)]">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/bookings" className="text-white/50 hover:text-white transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-white">{t.bookings.availability}</h1>
            </div>
            <p className="text-sm md:text-base text-white/60 ml-8">{t.bookings.availabilitySubtitle}</p>
          </div>
        </div>

        {/* Weekly Hours */}
        <div className="card mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.bookings.weeklyHours}</h2>
          <div className="space-y-3">
            {availability.map((day) => (
              <div
                key={day.weekday}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl transition-colors ${
                  day.is_available ? 'bg-white/5' : 'bg-white/[0.02]'
                }`}
              >
                {/* Day toggle */}
                <div className="flex items-center gap-3 sm:w-40">
                  <button
                    onClick={() => updateAvailability(day.weekday, 'is_available', !day.is_available)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      day.is_available ? 'bg-[#22C55E]' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      day.is_available ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className={`text-sm font-medium ${day.is_available ? 'text-white' : 'text-white/40'}`}>
                    {getDayLabel(day.weekday)}
                  </span>
                </div>

                {/* Time range */}
                {day.is_available && (
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <input
                      type="time"
                      value={minutesToTime(day.start_minutes)}
                      onChange={(e) => updateAvailability(day.weekday, 'start_minutes', timeToMinutes(e.target.value))}
                      className="input-glass text-sm px-3 py-1.5"
                    />
                    <span className="text-white/40">—</span>
                    <input
                      type="time"
                      value={minutesToTime(day.end_minutes)}
                      onChange={(e) => updateAvailability(day.weekday, 'end_minutes', timeToMinutes(e.target.value))}
                      className="input-glass text-sm px-3 py-1.5"
                    />
                  </div>
                )}
                {!day.is_available && (
                  <span className="text-sm text-white/30 sm:ml-auto">{t.bookings.unavailable}</span>
                )}
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? t.common.loading : t.bookings.saveAvailability}
            </button>
            {saved && (
              <span className="text-sm text-[#22C55E] flex items-center gap-1">
                <CheckIcon className="w-4 h-4" />
                {t.bookings.saved}
              </span>
            )}
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="card">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.bookings.blockedDates}</h2>

          {/* Add blocked date form */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 p-4 bg-white/5 rounded-xl">
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-glass text-sm"
            />
            <input
              type="text"
              placeholder={t.bookings.reason}
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
              className="input-glass text-sm flex-1"
            />
            <button
              onClick={addBlockedDate}
              disabled={!newBlockDate}
              className="btn-primary text-sm whitespace-nowrap"
            >
              {t.bookings.addBlockedDate}
            </button>
          </div>

          {/* Blocked dates list */}
          {blockedDates.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-6">No blocked dates</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{formatBlockedDate(blocked.date)}</p>
                    {blocked.reason && (
                      <p className="text-xs text-white/50 mt-0.5">{blocked.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeBlockedDate(blocked.id)}
                    className="btn-ghost p-2 text-[#EF4444] hover:bg-[#EF4444]/10"
                    title={t.bookings.removeBlockedDate}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Icons
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
