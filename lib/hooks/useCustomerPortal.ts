'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NCBListResponse } from '@/lib/types/api';

interface CustomerAccess {
  id: number;
  user_id: string;
  partnership_id: number;
  access_level: string;
  granted_by: string;
  granted_at: string;
}

interface Partnership {
  id: number;
  company_id: number;
  company_name?: string; // joined from companies table
  tier: string;
  status: string;
  current_phase: string;
  satisfaction_score: number | null;
  knowledge_transfer_score: number;
  engagement_level: string;
  total_revenue?: string;
  start_date?: string;
  target_end_date?: string;
  customer_email?: string;
  at_risk: number;
}

interface DeliveredSystem {
  id: number;
  partnership_id: number;
  name: string;
  category: string;
  status: string;
  hours_saved_per_week?: string | number;
  deployment_date?: string;
  client_independent: number;
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
      const accessData: NCBListResponse<CustomerAccess> = await accessRes.json();
      const records: CustomerAccess[] = accessData.data || [];
      setAccessRecords(records);

      if (records.length === 0) {
        setPartnerships([]);
        setSystems([]);
        setLoading(false);
        return;
      }

      // Step 2: Extract partnership IDs and parallel-fetch partnerships + systems
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

      const partnershipsData: NCBListResponse<Partnership> = await partnershipsRes.json();
      const systemsData: NCBListResponse<DeliveredSystem> = await systemsRes.json();

      const rawPartnerships: Partnership[] = partnershipsData.data || [];

      // Step 3: Fetch company names for each partnership's company_id
      const companyIds = [...new Set(rawPartnerships.map((p) => p.company_id).filter(Boolean))];
      if (companyIds.length > 0) {
        try {
          const companiesRes = await fetch(
            `/api/data/read/companies?id__in=${companyIds.join(',')}`,
            { credentials: 'include' }
          );
          const companiesData: NCBListResponse<{ id: number; name: string }> = await companiesRes.json();
          const companyMap: Record<number, string> = {};
          for (const c of companiesData.data || []) {
            companyMap[c.id] = c.name;
          }
          for (const p of rawPartnerships) {
            p.company_name = companyMap[p.company_id] || undefined;
          }
        } catch {
          // company names are optional, continue without them
        }
      }

      setPartnerships(rawPartnerships);
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
