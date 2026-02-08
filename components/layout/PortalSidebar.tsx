'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DashboardIcon, DocumentsIcon, BookingsIcon, SettingsIcon,
} from '@/components/icons';

interface PortalSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { key: 'dashboard' as const, href: '/portal', icon: DashboardIcon },
  { key: 'documents' as const, href: '/portal/documents', icon: DocumentsIcon },
  { key: 'meetings' as const, href: '/portal/meetings', icon: BookingsIcon },
  { key: 'settings' as const, href: '/portal/settings', icon: SettingsIcon },
];

export function PortalSidebar({ isMobileOpen, onMobileClose }: PortalSidebarProps) {
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslations();
  const { user, signOut } = useAuth();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo + subtitle */}
      <div className="border-b border-white/10 shrink-0 p-4 tablet:p-5">
        <div className="flex items-center gap-3">
          <Link href="/portal" className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src="/logos/dark_mode_logo.svg"
              alt="KRE8TION"
              className="shrink-0 w-9 h-9 tablet:w-10 tablet:h-10"
            />
            <div className="min-w-0">
              <span className="font-semibold text-white text-sm tablet:text-base block truncate">KRE8TION</span>
              <span className="text-[10px] tablet:text-xs text-white/50 block truncate">{t.portal.customerPortal}</span>
            </div>
          </Link>
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

      {/* Navigation */}
      <nav className="flex-1 p-2 tablet:p-3 desktop:p-4 space-y-0.5 overflow-y-auto overscroll-contain sidebar-nav-scroll">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href + '/'));
          const isExactActive = item.href === '/portal' && pathname === '/portal';
          const active = isActive || isExactActive;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`sidebar-item ${active ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate text-sm">{t.portal.nav[item.key]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 tablet:p-3 desktop:p-4 border-t border-white/10 space-y-0.5 shrink-0">
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
          className="sidebar-item w-full"
          title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
        >
          <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold">
            {language === 'en' ? 'EN' : 'ES'}
          </span>
          <span className="truncate text-sm">
            {language === 'en' ? 'English' : 'Español'}
          </span>
        </button>

        {/* User card */}
        {user && (
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
              {t.portal.nav.signOut}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop/Tablet sidebar — always expanded */}
      <aside className="sidebar fixed left-0 top-0 bottom-0 z-30 hidden tablet:flex flex-col w-64">
        {sidebarContent(false)}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 tablet:hidden"
              onClick={onMobileClose}
            />
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
