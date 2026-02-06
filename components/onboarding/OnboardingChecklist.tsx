'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  autoComplete?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'create_account',
    title: 'Create your account',
    description: 'Sign up and get started with your dashboard.',
    href: '/dashboard',
    autoComplete: true,
  },
  {
    id: 'set_availability',
    title: 'Set your availability',
    description: 'Define your working hours so clients can book meetings.',
    href: '/bookings/availability',
  },
  {
    id: 'block_dates',
    title: 'Block off-dates',
    description: 'Mark dates when you are unavailable for bookings.',
    href: '/bookings/availability',
  },
  {
    id: 'connect_calendar',
    title: 'Connect calendar',
    description: 'Sync with Google Calendar to avoid double-bookings.',
    href: '/settings',
  },
  {
    id: 'review_help',
    title: 'Review help guide',
    description: 'Learn how to get the most out of your CRM.',
    href: '/help',
  },
];

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

function EmptyCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OnboardingChecklist() {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch('/api/data/read/user_profiles', { credentials: 'include' });
        const data = await res.json();
        const profiles = data?.data || [];
        const profile = profiles.find(
          (p: Record<string, unknown>) => p.user_id === user?.id || p.email === user?.email
        );

        if (profile) {
          setProfileId(profile.id);
          if (profile.onboarding_dismissed === 'true' || profile.onboarding_dismissed === true) {
            setDismissed(true);
          }
          if (profile.onboarding_progress) {
            try {
              const progress = typeof profile.onboarding_progress === 'string'
                ? JSON.parse(profile.onboarding_progress)
                : profile.onboarding_progress;
              setCompletedSteps(progress);
            } catch {
              setCompletedSteps({});
            }
          }
        }
      } catch (err) {
        console.error('Failed to load onboarding progress:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadProgress();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && user && !completedSteps['create_account']) {
      const updated = { ...completedSteps, create_account: true };
      setCompletedSteps(updated);
      persistProgress(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const persistProgress = useCallback(
    async (steps: Record<string, boolean>, isDismissed?: boolean) => {
      if (!profileId) return;
      try {
        const body: Record<string, string> = {
          onboarding_progress: JSON.stringify(steps),
        };
        if (isDismissed !== undefined) {
          body.onboarding_dismissed = isDismissed ? 'true' : 'false';
        }
        await fetch(`/api/data/update/user_profiles?id=${profileId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (err) {
        console.error('Failed to persist onboarding progress:', err);
      }
    },
    [profileId]
  );

  const toggleStep = useCallback(
    (stepId: string) => {
      const updated = { ...completedSteps, [stepId]: !completedSteps[stepId] };
      setCompletedSteps(updated);
      persistProgress(updated);
    },
    [completedSteps, persistProgress]
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    persistProgress(completedSteps, true);
  }, [completedSteps, persistProgress]);

  const totalSteps = ONBOARDING_STEPS.length;
  const completedCount = ONBOARDING_STEPS.filter((step) => completedSteps[step.id]).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  if (dismissed || loading || completedCount === totalSteps) {
    return null;
  }

  return (
    <div className="card relative mb-[var(--space-section)] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-electricBlue via-purple-500 to-pink-500" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Get started with your CRM</h2>
          <p className="text-sm text-white/60 mt-1">Complete these steps to make the most of your dashboard.</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/40 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/5"
          aria-label="Dismiss onboarding checklist"
        >
          <XIcon />
        </button>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-white/60">{completedCount} of {totalSteps} completed</span>
          <span className="text-xs font-bold text-primary-electricBlue">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-electricBlue via-purple-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {ONBOARDING_STEPS.map((step) => {
          const isCompleted = !!completedSteps[step.id];
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                isCompleted ? 'bg-white/[0.02]' : 'bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <button
                onClick={() => toggleStep(step.id)}
                className={`flex-shrink-0 transition-colors ${
                  isCompleted ? 'text-green-400' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {isCompleted ? <CheckCircleIcon /> : <EmptyCircleIcon />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium transition-colors ${isCompleted ? 'text-white/40 line-through' : 'text-white'}`}>
                  {step.title}
                </p>
                <p className={`text-xs mt-0.5 transition-colors ${isCompleted ? 'text-white/20' : 'text-white/50'}`}>
                  {step.description}
                </p>
              </div>
              {!isCompleted && (
                <Link
                  href={step.href}
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-primary-electricBlue hover:text-primary-electricBlue/80 transition-colors opacity-0 group-hover:opacity-100"
                >
                  Go <ArrowRightIcon />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
