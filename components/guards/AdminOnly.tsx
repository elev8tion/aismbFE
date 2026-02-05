'use client';

import { usePermissions } from '@/lib/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AdminOnly({
  children,
  fallback,
  redirectTo = '/unauthorized'
}: AdminOnlyProps) {
  const { permissions, loading, isAuthenticated } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && !permissions.isAdmin) {
      router.push(redirectTo);
    }
  }, [loading, permissions.isAdmin, isAuthenticated, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-white/60">Checking permissions...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Auth context will handle redirect to login
  }

  if (!permissions.isAdmin) {
    return fallback || null;
  }

  return <>{children}</>;
}

// Higher-order component version
export function withAdminOnly<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function AdminOnlyWrapper(props: P) {
    return (
      <AdminOnly fallback={fallback}>
        <WrappedComponent {...props} />
      </AdminOnly>
    );
  };
}
