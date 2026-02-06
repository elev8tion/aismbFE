'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface BlockedDate {
  date: string;
  reason: string;
}

const STEPS = ['Profile', 'Availability', 'Blocked Dates', 'Calendar', 'Complete'];

export default function SetupWizardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Profile
  const [profileName, setProfileName] = useState(user?.name || '');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');

  // Step 2: Availability
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map((_, i) => ({
      enabled: i >= 1 && i <= 5, // Mon-Fri
      start: '09:00',
      end: '17:00',
    }))
  );

  // Step 3: Blocked dates
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  // Step 4: Calendar preference
  const [calendarPref, setCalendarPref] = useState('later');

  const updateDay = (index: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate) return;
    setBlockedDates((prev) => [...prev, { date: newBlockedDate, reason: newBlockedReason }]);
    setNewBlockedDate('');
    setNewBlockedReason('');
  };

  const removeBlockedDate = (index: number) => {
    setBlockedDates((prev) => prev.filter((_, i) => i !== index));
  };

  const saveAllData = useCallback(async () => {
    setSaving(true);
    try {
      // Save availability settings
      for (let i = 0; i < schedule.length; i++) {
        const day = schedule[i];
        await fetch('/api/data/create/availability_settings', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weekday: i,
            start_time: timeToMinutes(day.start),
            end_time: timeToMinutes(day.end),
            is_available: day.enabled ? 1 : 0,
          }),
        });
      }

      // Save blocked dates
      for (const bd of blockedDates) {
        await fetch('/api/data/create/blocked_dates', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocked_date: bd.date,
            reason: bd.reason || 'Blocked',
          }),
        });
      }

      // Save profile and mark setup complete
      const profileRes = await fetch('/api/data/read/user_profiles', { credentials: 'include' });
      const profileData = await profileRes.json();
      const profiles = profileData?.data || [];
      const existing = profiles[0];

      const profilePayload = {
        name: profileName,
        company_name: companyName,
        role: role,
        calendar_preference: calendarPref,
        setup_completed: 'true',
        onboarding_progress: JSON.stringify({
          create_account: true,
          set_availability: true,
          block_dates: blockedDates.length > 0,
          connect_calendar: calendarPref !== 'later',
        }),
      };

      if (existing?.id) {
        await fetch(`/api/data/update/user_profiles?id=${existing.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profilePayload),
        });
      } else {
        await fetch('/api/data/create/user_profiles', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profilePayload),
        });
      }
    } catch (err) {
      console.error('Setup save error:', err);
    } finally {
      setSaving(false);
    }
  }, [schedule, blockedDates, profileName, companyName, role, calendarPref]);

  const handleNext = async () => {
    if (step === STEPS.length - 2) {
      // Save all data before showing completion
      await saveAllData();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <DashboardLayout>
      <div className="page-content max-w-3xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  i < step
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : i === step
                    ? 'bg-primary-electricBlue/20 text-primary-electricBlue border border-primary-electricBlue/50'
                    : 'bg-white/5 text-white/30 border border-white/10'
                }`}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 lg:w-16 h-[2px] mx-1 ${i < step ? 'bg-green-500/30' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/40 mb-6">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

        {/* Step 1: Profile */}
        {step === 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-2">Welcome! Let&apos;s get you set up.</h2>
            <p className="text-sm text-white/50 mb-6">Tell us a bit about yourself and your business.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Your Name</label>
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="input-glass w-full" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-glass w-full" placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Your Role</label>
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="input-glass w-full" placeholder="Sales Manager" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Availability */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-2">Set Your Availability</h2>
            <p className="text-sm text-white/50 mb-6">Choose which days and times you are available for bookings.</p>
            <div className="space-y-3">
              {DAYS.map((day, i) => (
                <div key={day} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${schedule[i].enabled ? 'bg-white/[0.04]' : 'bg-white/[0.01]'}`}>
                  <label className="flex items-center gap-3 cursor-pointer shrink-0 w-32">
                    <input
                      type="checkbox"
                      checked={schedule[i].enabled}
                      onChange={(e) => updateDay(i, 'enabled', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className={`text-sm font-medium ${schedule[i].enabled ? 'text-white' : 'text-white/30'}`}>{day}</span>
                  </label>
                  {schedule[i].enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <select value={schedule[i].start} onChange={(e) => updateDay(i, 'start', e.target.value)} className="input-glass text-sm py-1.5 px-2">
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
                      </select>
                      <span className="text-white/30 text-sm">to</span>
                      <select value={schedule[i].end} onChange={(e) => updateDay(i, 'end', e.target.value)} className="input-glass text-sm py-1.5 px-2">
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Blocked Dates */}
        {step === 2 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-2">Block Off-Dates</h2>
            <p className="text-sm text-white/50 mb-6">Mark dates when you are unavailable (holidays, vacations, etc.).</p>
            <div className="flex gap-3 mb-4">
              <input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)} className="input-glass flex-1" />
              <input type="text" value={newBlockedReason} onChange={(e) => setNewBlockedReason(e.target.value)} className="input-glass flex-1" placeholder="Reason (optional)" />
              <button onClick={addBlockedDate} disabled={!newBlockedDate} className="btn-primary text-sm px-4">Add</button>
            </div>
            {blockedDates.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-6">No blocked dates yet. You can always add them later from the Availability page.</p>
            ) : (
              <div className="space-y-2">
                {blockedDates.map((bd, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                    <div>
                      <span className="text-sm font-medium text-white">{bd.date}</span>
                      {bd.reason && <span className="text-xs text-white/40 ml-3">{bd.reason}</span>}
                    </div>
                    <button onClick={() => removeBlockedDate(i)} className="text-red-400/60 hover:text-red-400 text-sm transition-colors">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Calendar */}
        {step === 3 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-2">Calendar Preferences</h2>
            <p className="text-sm text-white/50 mb-6">Choose how you want calendar events managed.</p>
            <div className="space-y-3">
              {[
                { id: 'google', label: 'Google Calendar', desc: 'Automatically create events in your Google Calendar when bookings are made.' },
                { id: 'outlook', label: 'Apple / Outlook Calendar', desc: 'Use CalDAV to sync with Apple Calendar or Outlook.' },
                { id: 'later', label: "I'll set up later", desc: 'Skip for now. You can configure this anytime from Settings.' },
              ].map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    calendarPref === option.id
                      ? 'bg-primary-electricBlue/10 border border-primary-electricBlue/30'
                      : 'bg-white/[0.03] border border-white/5 hover:border-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="calendar"
                    value={option.id}
                    checked={calendarPref === option.id}
                    onChange={(e) => setCalendarPref(e.target.value)}
                    className="mt-1 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">{option.label}</span>
                    <p className="text-xs text-white/40 mt-1">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 4 && (
          <div className="card text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">You&apos;re All Set!</h2>
            <p className="text-sm text-white/50 mb-6">Your CRM is configured and ready to use.</p>
            <div className="text-left max-w-sm mx-auto mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">&#10003;</span>
                <span className="text-white/70">Profile: {profileName || 'Set'}{companyName ? ` at ${companyName}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">&#10003;</span>
                <span className="text-white/70">Availability: {schedule.filter((d) => d.enabled).length} days configured</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">&#10003;</span>
                <span className="text-white/70">Blocked dates: {blockedDates.length || 'None'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">&#10003;</span>
                <span className="text-white/70">Calendar: {calendarPref === 'later' ? 'Setup later' : calendarPref === 'google' ? 'Google Calendar' : 'Apple/Outlook'}</span>
              </div>
            </div>
            <button onClick={() => router.push('/dashboard')} className="btn-primary">
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 4 && (
          <div className="flex justify-between mt-6">
            <button onClick={handleBack} disabled={step === 0} className={`btn-ghost text-sm ${step === 0 ? 'invisible' : ''}`}>
              &larr; Back
            </button>
            <button onClick={handleNext} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : step === 3 ? 'Complete Setup' : 'Next \u2192'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
