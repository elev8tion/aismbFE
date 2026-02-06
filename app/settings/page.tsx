'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslations();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="page-content max-w-4xl">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-[var(--space-section)]">{t.nav.settings}</h1>

        {/* Profile Section */}
        <div className="card mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Name</label>
              <input
                type="text"
                defaultValue={user?.name || ''}
                className="input-glass w-full max-w-md"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Email</label>
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
          <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Language</h2>
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
          <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm md:text-base text-white/80">Email notifications for new leads</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm md:text-base text-white/80">Daily pipeline summary</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm md:text-base text-white/80">Voice session alerts</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm md:text-base text-white/80">Partnership health warnings</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button className="btn-primary">
          {t.common.save} Changes
        </button>
      </div>
    </DashboardLayout>
  );
}
