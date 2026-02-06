'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DashboardIcon, BookingsIcon, LeadsIcon, PipelineIcon,
  CompaniesIcon, ContactsIcon, PartnershipsIcon, VoiceIcon,
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
  { key: 'voiceSessions', href: '/voice-sessions', icon: VoiceIcon },
  { key: 'roiCalculations', href: '/roi-calculations', icon: CalculatorIcon },
  { key: 'reports', href: '/reports/weekly', icon: ChartIcon },
  { key: 'helpCenter', href: '/help', icon: HelpIcon },
];

export function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { user, signOut } = useAuth();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const sidebarContent = (isMobile: boolean) => {
    const expanded = isMobile || !isCollapsed;

    return (
      <>
        {/* Logo */}
        <div className={`border-b border-white/10 ${expanded ? 'p-5' : 'p-2'}`}>
          <Link href="/dashboard" className={`flex items-center ${expanded ? 'gap-3' : 'justify-center'}`}>
            <img
              src="/logos/dark_mode_logo.svg"
              alt="KRE8TION"
              className={`shrink-0 ${expanded ? 'w-10 h-10' : 'w-8 h-8'}`}
            />
            {expanded && (
              <div className="overflow-hidden">
                <span className="font-semibold text-white">KRE8TION</span>
                <span className="text-xs text-white/50 block">AI KRE8TION Partners</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`sidebar-item ${isActive ? 'active' : ''} ${expanded ? '' : 'justify-center'}`}
                title={!expanded ? (t.nav[item.key as keyof typeof t.nav] as string) : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {expanded && (
                  <span className="whitespace-nowrap">{t.nav[item.key as keyof typeof t.nav]}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings & User */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link
            href="/settings"
            className={`sidebar-item ${expanded ? '' : 'justify-center'}`}
            title={!expanded ? (t.nav.settings as string) : undefined}
          >
            <SettingsIcon className="w-5 h-5 shrink-0" />
            {expanded && <span>{t.nav.settings}</span>}
          </Link>

          {/* Collapse toggle — desktop only */}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="sidebar-item w-full hidden lg:flex justify-center"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronIcon className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}

          {user && expanded && (
            <div className="mt-4 p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-electricBlue/20 flex items-center justify-center shrink-0">
                  <span className="text-primary-electricBlue text-sm font-medium">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                  <p className="text-xs text-white/50 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="mt-3 w-full btn-ghost text-sm text-white/60 hover:text-white"
              >
                {t.nav.signOut}
              </button>
            </div>
          )}

          {user && !expanded && (
            <div className="flex justify-center mt-4">
              <div className="w-8 h-8 rounded-full bg-primary-electricBlue/20 flex items-center justify-center">
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
      {/* Desktop/Tablet sidebar */}
      <aside
        className={`sidebar fixed left-0 top-0 bottom-0 z-30 hidden md:flex flex-col transition-[width] duration-300 ${
          isCollapsed ? 'w-16' : 'w-16 lg:w-64'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="sidebar fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col md:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

