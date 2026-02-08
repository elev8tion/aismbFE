'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { PortalSidebar } from './PortalSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useRouter } from 'next/navigation';

interface PortalLayoutProps {
  children: ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, loading } = useAuth();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const router = useRouter();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && !permissionsLoading && user && permissions.isAdmin) {
      router.push('/dashboard');
    }
  }, [user, loading, permissionsLoading, permissions.isAdmin, router]);

  // Body scroll lock when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const handleMobileClose = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-electricBlue/20" />
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || permissions.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Mobile header bar */}
      <div className="mobile-header flex tablet:hidden">
        <button
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="relative w-10 h-10 flex flex-col items-center justify-center gap-1.5"
          aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
        >
          <span
            className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ${
              isMobileOpen ? 'translate-y-2 rotate-45' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ${
              isMobileOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ${
              isMobileOpen ? '-translate-y-2 -rotate-45' : ''
            }`}
          />
        </button>
        <img
          src="/logos/dark_mode_brand.svg"
          alt="ELEV8TION"
          className="h-10 ml-3"
        />
      </div>

      <PortalSidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={handleMobileClose}
      />

      <main className="min-h-screen pt-16 tablet:pt-0 tablet:ml-64">
        {children}
      </main>
    </div>
  );
}
