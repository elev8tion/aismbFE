'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
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

interface DayInfo {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isBlocked: boolean;
  isAvailableDay: boolean; // based on weekly availability settings
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
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [availRes, blockedRes] = await Promise.all([
        fetch('/api/data/read/availability_settings', { credentials: 'include' }),
        fetch('/api/data/read/blocked_dates', { credentials: 'include' }),
      ]);

      const availData: { data?: AvailabilitySetting[] } = await availRes.json();
      const blockedData: { data?: BlockedDate[] } = await blockedRes.json();

      if (availData.data && availData.data.length > 0) {
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

  // Blocked dates as a Set for quick lookup
  const blockedSet = useMemo(() => new Set(blockedDates.map(b => b.date)), [blockedDates]);

  // Availability by weekday for quick lookup
  const availByDay = useMemo(() => {
    const map = new Map<number, boolean>();
    availability.forEach(a => map.set(a.weekday, a.is_available));
    return map;
  }, [availability]);

  // Calendar generation
  const calendarDays: DayInfo[] = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: DayInfo[] = [];

    // Padding before first of month
    const startPadding = firstDay.getDay();
    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      days.push({ date: dateStr, day, isCurrentMonth: false, isToday: false, isPast: true, isBlocked: false, isAvailableDay: false });
    }

    // Days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isPast = date < today;
      const weekday = date.getDay();
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isPast,
        isBlocked: blockedSet.has(dateStr),
        isAvailableDay: availByDay.get(weekday) ?? false,
      });
    }

    // Padding after last of month
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({ date: dateStr, day: i, isCurrentMonth: false, isToday: false, isPast: false, isBlocked: false, isAvailableDay: false });
    }

    return days;
  }, [currentMonth, blockedSet, availByDay]);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const canGoPrevious = useMemo(() => {
    const today = new Date();
    return currentMonth.getFullYear() > today.getFullYear() ||
           (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() > today.getMonth());
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    if (canGoPrevious) {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    }
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Handle clicking a date on the calendar
  const handleDateClick = (dayInfo: DayInfo) => {
    if (!dayInfo.isCurrentMonth || dayInfo.isPast) return;

    if (dayInfo.isBlocked) {
      // Find and remove the blocked date
      const blocked = blockedDates.find(b => b.date === dayInfo.date);
      if (blocked) removeBlockedDate(blocked.id);
    } else {
      // Select date for blocking
      setSelectedDate(dayInfo.date);
      setBlockReason('');
    }
  };

  const addBlockedDate = async (date: string, reason: string) => {
    try {
      const res = await fetch('/api/data/create/blocked_dates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, reason: reason || null }),
      });
      if (res.ok) {
        const data: { data?: BlockedDate } = await res.json();
        if (data.data) {
          setBlockedDates(prev => [...prev, data.data!].sort((a, b) => a.date.localeCompare(b.date)));
        }
      }
    } catch (err) {
      console.error('Failed to add blocked date:', err);
    }
    setSelectedDate(null);
    setBlockReason('');
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
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDayLabel = (weekday: number): string => {
    const key = WEEKDAY_KEYS[weekday];
    return t.bookings[key as keyof typeof t.bookings] as string;
  };

  // Get selected date info for the block panel
  const selectedBlocked = selectedDate ? blockedDates.find(b => b.date === selectedDate) : null;

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
      <div className="page-content max-w-5xl">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Weekly Hours */}
          <div className="card">
            <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.bookings.weeklyHours}</h2>
            <div className="space-y-3">
              {availability.map((day) => (
                <div
                  key={day.weekday}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl transition-colors ${
                    day.is_available ? 'bg-white/5' : 'bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:w-36">
                    <button
                      onClick={() => updateAvailability(day.weekday, 'is_available', !day.is_available)}
                      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
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

          {/* Right Column: Calendar + Blocked Dates */}
          <div className="space-y-6">
            {/* Visual Calendar */}
            <div className="card">
              <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.bookings.blockedDates}</h2>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPreviousMonth}
                  disabled={!canGoPrevious}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-white">{monthName}</h3>
                <button
                  onClick={goToNextMonth}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-xs text-white/50 py-1.5 font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dayInfo, idx) => {
                  const isClickable = dayInfo.isCurrentMonth && !dayInfo.isPast;
                  const isSelected = selectedDate === dayInfo.date;

                  return (
                    <button
                      key={`${dayInfo.date}-${idx}`}
                      onClick={() => isClickable && handleDateClick(dayInfo)}
                      disabled={!isClickable}
                      className={`
                        relative p-2 h-10 rounded-lg text-sm font-medium transition-all
                        ${!dayInfo.isCurrentMonth ? 'text-white/15' : ''}
                        ${dayInfo.isPast && dayInfo.isCurrentMonth ? 'text-white/25' : ''}
                        ${dayInfo.isCurrentMonth && !dayInfo.isPast && !dayInfo.isBlocked && dayInfo.isAvailableDay ? 'text-white' : ''}
                        ${dayInfo.isCurrentMonth && !dayInfo.isPast && !dayInfo.isBlocked && !dayInfo.isAvailableDay ? 'text-white/40' : ''}
                        ${isClickable ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'}
                        ${dayInfo.isBlocked ? 'bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/30' : ''}
                        ${isSelected && !dayInfo.isBlocked ? 'bg-[#0EA5E9] text-white hover:bg-[#0EA5E9]' : ''}
                        ${dayInfo.isToday && !isSelected && !dayInfo.isBlocked ? 'ring-1 ring-[#0EA5E9]/50' : ''}
                      `}
                    >
                      {dayInfo.day}
                      {/* Green dot for available weekdays */}
                      {dayInfo.isAvailableDay && dayInfo.isCurrentMonth && !dayInfo.isPast && !dayInfo.isBlocked && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#22C55E] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-white/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
                  <span>{t.bookings.available}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#EF4444] rounded-full" />
                  <span>Blocked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#0EA5E9] rounded-full" />
                  <span>Selected</span>
                </div>
              </div>

              {/* Block date panel - appears when a date is selected */}
              {selectedDate && !selectedBlocked && (
                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-sm text-white mb-3">
                    Block <span className="font-semibold">{formatBlockedDate(selectedDate)}</span>?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t.bookings.reason}
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="input-glass text-sm flex-1"
                      autoFocus
                    />
                    <button
                      onClick={() => addBlockedDate(selectedDate, blockReason)}
                      className="btn-primary text-sm px-4"
                    >
                      {t.bookings.addBlockedDate}
                    </button>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="btn-ghost text-sm px-3"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Blocked Dates List */}
            {blockedDates.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">
                  {blockedDates.length} Blocked {blockedDates.length === 1 ? 'Date' : 'Dates'}
                </h3>
                <div className="space-y-2">
                  {blockedDates.map((blocked) => (
                    <div
                      key={blocked.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#EF4444] rounded-full shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-white">{formatBlockedDate(blocked.date)}</p>
                          {blocked.reason && (
                            <p className="text-xs text-white/50 mt-0.5">{blocked.reason}</p>
                          )}
                        </div>
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
              </div>
            )}
          </div>
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
