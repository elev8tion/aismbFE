'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface UserProfile {
  id?: string;
  name?: string;
  email_notifications?: number;
  daily_summary?: number;
  voice_alerts?: number;
  health_warnings?: number;
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslations();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    daily_summary: true,
    voice_alerts: true,
    health_warnings: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/user_profiles', { credentials: 'include' });
      const data: { data?: UserProfile[] } = await res.json();
      if (data.data && data.data.length > 0) {
        const profile = data.data[0];
        setProfileId(profile.id || null);
        if (profile.name) setName(profile.name);
        setNotifications({
          email_notifications: profile.email_notifications !== 0,
          daily_summary: profile.daily_summary !== 0,
          voice_alerts: profile.voice_alerts !== 0,
          health_warnings: profile.health_warnings !== 0,
        });
      }
    } catch {
      // Use defaults
    }
  }, []);

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
  }, [user, name]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        name,
        email_notifications: notifications.email_notifications ? 1 : 0,
        daily_summary: notifications.daily_summary ? 1 : 0,
        voice_alerts: notifications.voice_alerts ? 1 : 0,
        health_warnings: notifications.health_warnings ? 1 : 0,
      };

      if (profileId) {
        await fetch(`/api/data/update/user_profiles?id=${profileId}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/data/create/user_profiles', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error('Failed to save settings:', err); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <ErrorBoundary>
      <div className="page-content max-w-4xl">
        <PageHeader title={t.nav.settings} />

        {/* Profile Section */}
        <div className="card mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">{t.settings.profile}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">{t.settings.name}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-glass w-full max-w-md"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">{t.settings.email}</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                className="input-glass w-full max-w-md"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="card mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">{t.settings.language}</h2>
          <div className="flex gap-3 md:gap-4">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl border text-sm md:text-base transition-colors ${
                language === 'en'
                  ? 'bg-primary-electricBlue/20 border-primary-electricBlue text-white'
                  : 'border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl border text-sm md:text-base transition-colors ${
                language === 'es'
                  ? 'bg-primary-electricBlue/20 border-primary-electricBlue text-white'
                  : 'border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              Español
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="card mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">{t.settings.notifications}</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm md:text-base text-white/80">{t.settings.emailNotifications}</span>
              <input type="checkbox" checked={notifications.email_notifications} onChange={e => setNotifications({ ...notifications, email_notifications: e.target.checked })} className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm md:text-base text-white/80">{t.settings.dailySummary}</span>
              <input type="checkbox" checked={notifications.daily_summary} onChange={e => setNotifications({ ...notifications, daily_summary: e.target.checked })} className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm md:text-base text-white/80">{t.settings.voiceAlerts}</span>
              <input type="checkbox" checked={notifications.voice_alerts} onChange={e => setNotifications({ ...notifications, voice_alerts: e.target.checked })} className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm md:text-base text-white/80">{t.settings.healthWarnings}</span>
              <input type="checkbox" checked={notifications.health_warnings} onChange={e => setNotifications({ ...notifications, health_warnings: e.target.checked })} className="w-5 h-5 rounded" />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? t.common.saving : saved ? t.common.saved : t.settings.saveChanges}
        </button>
      </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
