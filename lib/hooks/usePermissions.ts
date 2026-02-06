'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';

interface UserProfile {
  id: number;
  user_id: string;
  role: 'admin' | 'team_member' | 'customer';
  display_name: string | null;
  phone: string | null;
  timezone: string;
  notification_preferences: string | null;
  created_at: string;
  updated_at: string;
}

interface Permissions {
  isAdmin: boolean;
  isTeamMember: boolean;
  isCustomer: boolean;
  canManageUsers: boolean;
  canViewAllData: boolean;
  canEditSettings: boolean;
  canGrantAccess: boolean;
  canDeleteRecords: boolean;
  canExportData: boolean;
}

const ADMIN_EMAIL = 'connect@elev8tion.one';

export function usePermissions() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    try {
      const res = await fetch(`/api/data/read/user_profiles?user_id=${userId}`, {
        credentials: 'include',
      });

      let profiles: any[] = [];
      if (res.ok) {
        const data = await res.json();
        profiles = data.data || [];
      }

      if (profiles.length > 0) {
        setProfile(profiles[0]);
      } else {
        // Auto-create profile for first-time users
        const isFirstAdmin = email === ADMIN_EMAIL;
        const newProfile = await createProfile(userId, email, isFirstAdmin ? 'admin' : 'customer');
        if (newProfile) {
          setProfile(newProfile);
        }
      }
    } catch (err) {
      setError('Failed to fetch user profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProfile = async (
    userId: string,
    email?: string,
    role: 'admin' | 'team_member' | 'customer' = 'customer'
  ): Promise<UserProfile | null> => {
    try {
      const res = await fetch('/api/data/create/user_profiles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role,
          display_name: email ? email.split('@')[0] : null,
          timezone: 'America/New_York',
        }),
      });
      const data = await res.json();
      return data.data || null;
    } catch (err) {
      console.error('Error creating profile:', err);
      return null;
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id, user.email);
    } else {
      setLoading(false);
    }
  }, [user?.id, user?.email, fetchProfile]);

  const permissions: Permissions = {
    isAdmin: profile?.role === 'admin',
    isTeamMember: profile?.role === 'team_member',
    isCustomer: profile?.role === 'customer',
    canManageUsers: profile?.role === 'admin',
    canViewAllData: profile?.role === 'admin',
    canEditSettings: profile?.role === 'admin',
    canGrantAccess: profile?.role === 'admin',
    canDeleteRecords: profile?.role === 'admin',
    canExportData: profile?.role === 'admin' || profile?.role === 'team_member',
  };

  const refreshProfile = useCallback(() => {
    if (user?.id) {
      setLoading(true);
      fetchProfile(user.id, user.email);
    }
  }, [user?.id, user?.email, fetchProfile]);

  return {
    profile,
    permissions,
    loading,
    error,
    refreshProfile,
    isAuthenticated: !!user,
  };
}
