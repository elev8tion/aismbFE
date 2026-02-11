'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useCustomerPortal } from '@/lib/hooks/useCustomerPortal';
import { useState, useEffect, useCallback } from 'react';
import type { NCBListResponse } from '@/lib/types/api';
import { getTierClass, getPartnershipStatusClass } from '@/lib/utils/statusClasses';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Puerto_Rico',
  'America/Mexico_City',
  'America/Bogota',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Madrid',
];

export default function PortalSettingsPage() {
  const { t, language, setLanguage } = useTranslations();
  const { user } = useAuth();
  const { profile } = usePermissions();
  const { partnerships } = useCustomerPortal();

  // Profile form
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [notifications, setNotifications] = useState({
    meeting_reminders: true,
    system_updates: true,
  });
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/user_profiles', { credentials: 'include' });
      const data = await res.json() as NCBListResponse<{
        id?: string;
        display_name?: string;
        phone?: string;
        timezone?: string;
        notification_preferences?: string | Record<string, boolean>;
      }>;
      if (data.data && data.data.length > 0) {
        const p = data.data[0];
        setProfileId(p.id || null);
        if (p.display_name) setDisplayName(p.display_name);
        if (p.phone) setPhone(p.phone);
        if (p.timezone) setTimezone(p.timezone);
        if (p.notification_preferences) {
          try {
            const prefs = typeof p.notification_preferences === 'string'
              ? JSON.parse(p.notification_preferences)
              : p.notification_preferences;
            setNotifications({
              meeting_reminders: prefs.meeting_reminders !== false,
              system_updates: prefs.system_updates !== false,
            });
          } catch {
            // use defaults
          }
        }
      }
    } catch {
      // use defaults
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user?.name && !displayName) setDisplayName(user.name);
  }, [user, displayName]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        display_name: displayName,
        phone: phone || null,
        timezone,
        notification_preferences: JSON.stringify(notifications),
      };

      if (profileId) {
        await fetch(`/api/data/update/user_profiles?id=${profileId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: t.auth.passwordMinLength });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: t.auth.passwordsNoMatch });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setPasswordMsg({ type: 'success', text: t.portal.settings.passwordChanged });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: t.portal.settings.passwordError });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: t.portal.settings.passwordError });
    } finally {
      setChangingPassword(false);
    }
  };

  const partnership = partnerships[0]; // primary partnership

  const statusLabels: Record<string, string> = {
    onboarding: t.partnerships.statuses.onboarding,
    active: t.partnerships.statuses.active,
    graduated: t.partnerships.statuses.graduated,
  };

  return (
    <PortalLayout>
      <div className="page-content max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{t.portal.nav.settings}</h1>
        </div>

        {/* Profile Section */}
        <div className="card mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.portal.settings.profile}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">{t.portal.settings.displayName}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-glass w-full max-w-md"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">{t.portal.settings.email}</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                className="input-glass w-full max-w-md opacity-60"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">{t.portal.settings.phone}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-glass w-full max-w-md"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">{t.portal.settings.timezone}</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="select-glass w-full max-w-md"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="card mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.portal.settings.language}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl border text-sm transition-colors ${
                language === 'en'
                  ? 'bg-primary-electricBlue/20 border-primary-electricBlue text-white'
                  : 'border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl border text-sm transition-colors ${
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
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.portal.settings.notifications}</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-white/80">{t.portal.settings.meetingReminders}</span>
              <input
                type="checkbox"
                checked={notifications.meeting_reminders}
                onChange={(e) => setNotifications({ ...notifications, meeting_reminders: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-white/80">{t.portal.settings.systemUpdates}</span>
              <input
                type="checkbox"
                checked={notifications.system_updates}
                onChange={(e) => setNotifications({ ...notifications, system_updates: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </label>
          </div>
        </div>

        {/* Save Profile Button */}
        <button onClick={handleSaveProfile} disabled={saving} className="btn-primary mb-8">
          {saving ? t.portal.settings.updating : saved ? t.common.saved : t.settings.saveChanges}
        </button>

        {/* Account Info Section */}
        {partnership && (
          <div className="card mb-6">
            <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.portal.settings.accountInfo}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.portal.settings.role}</p>
                <span className="tag mt-1 bg-primary-electricBlue/20 text-primary-electricBlue">Customer</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.portal.settings.partnershipTier}</p>
                <span className={`tag mt-1 ${getTierClass(partnership.tier)}`}>{partnership.tier}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.portal.settings.partnershipStatus}</p>
                <span className={`tag mt-1 ${getPartnershipStatusClass(partnership.status)}`}>
                  {statusLabels[partnership.status] || partnership.status}
                </span>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.portal.settings.memberSince}</p>
                <p className="text-sm font-medium text-white mt-1">
                  {partnership.start_date || profile?.created_at?.split('T')[0] || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Section */}
        <div className="card mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.portal.settings.security}</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-white/60 mb-2">{t.portal.settings.currentPassword}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-glass w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">{t.portal.settings.newPassword}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-glass w-full"
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">{t.portal.settings.confirmPassword}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-glass w-full"
              />
            </div>
            {passwordMsg && (
              <div className={`p-3 rounded-lg text-sm ${
                passwordMsg.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {passwordMsg.text}
              </div>
            )}
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword}
              className="btn-secondary"
            >
              {changingPassword ? t.portal.settings.updating : t.portal.settings.changePassword}
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="card">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">{t.portal.settings.support}</h2>
          <p className="text-sm text-white/50 mb-4">{t.portal.settings.contactSupportMessage}</p>
          <a
            href="mailto:connect@elev8tion.one"
            className="btn-secondary inline-block"
          >
            {t.portal.settings.contactSupport}
          </a>
        </div>
      </div>
    </PortalLayout>
  );
}
