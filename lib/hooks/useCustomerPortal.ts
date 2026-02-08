'use client';

import { useState, useEffect, useCallback } from 'react';

interface CustomerAccess {
  id: number;
  user_id: string;
  partnership_id: number;
  access_level: string;
  granted_by: string;
  created_at: string;
}

interface Partnership {
  id: number;
  company_name?: string;
  tier: string;
  status: string;
  phase: string;
  health_score: number;
  systems_delivered: number;
  total_systems: number;
  monthly_revenue?: number;
  start_date?: string;
  customer_email?: string;
  notes?: string;
}

interface DeliveredSystem {
  id: number;
  partnership_id: number;
  name: string;
  status: string;
  hours_saved_per_week?: number;
  description?: string;
  deployed_at?: string;
}

export function useCustomerPortal() {
  const [accessRecords, setAccessRecords] = useState<CustomerAccess[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [systems, setSystems] = useState<DeliveredSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Fetch customer_access records (RLS returns only current user's)
      const accessRes = await fetch('/api/data/read/customer_access', {
        credentials: 'include',
      });
      const accessData = await accessRes.json();
      const records: CustomerAccess[] = accessData.data || [];
      setAccessRecords(records);

      if (records.length === 0) {
        setPartnerships([]);
        setSystems([]);
        setLoading(false);
        return;
      }

      // Step 2: Extract partnership IDs and parallel-fetch
      const partnershipIds = records.map((r) => r.partnership_id);
      const idList = partnershipIds.join(',');

      const [partnershipsRes, systemsRes] = await Promise.all([
        fetch(`/api/data/read/partnerships?id__in=${idList}`, {
          credentials: 'include',
        }),
        fetch(`/api/data/read/delivered_systems?partnership_id__in=${idList}`, {
          credentials: 'include',
        }),
      ]);

      const partnershipsData = await partnershipsRes.json();
      const systemsData = await systemsRes.json();

      setPartnerships(partnershipsData.data || []);
      setSystems(systemsData.data || []);
    } catch (err) {
      console.error('Error fetching customer portal data:', err);
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    accessRecords,
    partnerships,
    systems,
    loading,
    error,
    refetch: fetchData,
  };
}
