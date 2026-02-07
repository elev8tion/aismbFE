'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DashboardIcon, BookingsIcon, LeadsIcon, PipelineIcon,
  CompaniesIcon, ContactsIcon, PartnershipsIcon, DraftsIcon, VoiceIcon,
  CalculatorIcon, SettingsIcon, HelpIcon, ChevronIcon, ChartIcon,
} from '@/components/icons';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: DashboardIcon },
  { key: 'bookings', href: '/bookings', icon: BookingsIcon },
  { key: 'leads', href: '/leads', icon: LeadsIcon },
  { key: 'pipeline', href: '/pipeline', icon: PipelineIcon },
  { key: 'companies', href: '/companies', icon: CompaniesIcon },
  { key: 'contacts', href: '/contacts', icon: ContactsIcon },
  { key: 'partnerships', href: '/partnerships', icon: PartnershipsIcon },
  { key: 'drafts', href: '/drafts', icon: DraftsIcon },
  { key: 'voiceSessions', href: '/voice-sessions', icon: VoiceIcon },
  { key: 'roiCalculations', href: '/roi-calculations', icon: CalculatorIcon },
  { key: 'reports', href: '/reports/weekly', icon: ChartIcon },
  { key: 'helpCenter', href: '/help', icon: HelpIcon },
];

export function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslations();
  const { user, signOut } = useAuth();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const sidebarContent = (isMobile: boolean) => {
    const expanded = isMobile || !isCollapsed;

    return (
      <>
        {/* Logo + mobile close */}
        <div className={`border-b border-white/10 shrink-0 ${expanded ? 'p-4 tablet:p-5' : 'p-2'}`}>
          <div className={`flex items-center ${expanded ? 'gap-3' : 'justify-center'}`}>
            <Link href="/dashboard" className={`flex items-center ${expanded ? 'gap-3 flex-1 min-w-0' : 'justify-center'}`}>
              <img
                src="/logos/dark_mode_logo.svg"
                alt="KRE8TION"
                className={`shrink-0 ${expanded ? 'w-9 h-9 tablet:w-10 tablet:h-10' : 'w-8 h-8'}`}
              />
              {expanded && (
                <div className="min-w-0">
                  <span className="font-semibold text-white text-sm tablet:text-base block truncate">KRE8TION</span>
                  <span className="text-[10px] tablet:text-xs text-white/50 block truncate">AI KRE8TION Partners</span>
                </div>
              )}
            </Link>
            {/* Mobile close button */}
            {isMobile && (
              <button
                onClick={onMobileClose}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 p-2 tablet:p-3 desktop:p-4 space-y-0.5 overflow-y-auto overscroll-contain sidebar-nav-scroll">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`sidebar-item ${isActive ? 'active' : ''} ${expanded ? '' : 'justify-center !p-2'}`}
                title={!expanded ? (t.nav[item.key as keyof typeof t.nav] as string) : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {expanded && (
                  <span className="truncate text-sm">{t.nav[item.key as keyof typeof t.nav]}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — settings, language, user */}
        <div className="p-2 tablet:p-3 desktop:p-4 border-t border-white/10 space-y-0.5 shrink-0">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className={`sidebar-item w-full ${expanded ? '' : 'justify-center !p-2'}`}
            title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
          >
            <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold">
              {language === 'en' ? 'EN' : 'ES'}
            </span>
            {expanded && (
              <span className="truncate text-sm">
                {language === 'en' ? 'English' : 'Español'}
              </span>
            )}
          </button>

          <Link
            href="/settings"
            className={`sidebar-item ${expanded ? '' : 'justify-center !p-2'}`}
            title={!expanded ? (t.nav.settings as string) : undefined}
          >
            <SettingsIcon className="w-5 h-5 shrink-0" />
            {expanded && <span className="truncate text-sm">{t.nav.settings}</span>}
          </Link>

          {/* Collapse toggle — tablet+ only, not on mobile drawer */}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="sidebar-item w-full hidden desktop:flex justify-center !p-2"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronIcon className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* User card — expanded */}
          {user && expanded && (
            <div className="mt-2 p-2.5 tablet:p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-electricBlue/20 flex items-center justify-center shrink-0">
                  <span className="text-primary-electricBlue text-sm font-medium">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                  <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="mt-2.5 w-full btn-ghost text-sm text-white/60 hover:text-white py-1.5"
              >
                {t.nav.signOut}
              </button>
            </div>
          )}

          {/* User avatar — collapsed */}
          {user && !expanded && (
            <div className="flex justify-center mt-2">
              <div
                className="w-8 h-8 rounded-full bg-primary-electricBlue/20 flex items-center justify-center cursor-pointer hover:bg-primary-electricBlue/30 transition-colors"
                title={user.name || user.email}
              >
                <span className="text-primary-electricBlue text-sm font-medium">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop/Tablet sidebar — show icon strip at tablet, expand at desktop */}
      <aside
        className={`sidebar fixed left-0 top-0 bottom-0 z-30 hidden tablet:flex flex-col transition-[width] duration-300 ${
          isCollapsed ? 'w-16' : 'w-16 desktop:w-64'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile drawer — below tablet */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 tablet:hidden"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="sidebar fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] z-50 flex flex-col tablet:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
