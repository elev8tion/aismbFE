'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerPortal } from '@/lib/hooks/useCustomerPortal';
import { getTierClass, getHealthColor } from '@/lib/utils/statusClasses';
import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { PortalBookingsResponse, PortalContractsStatusResponse, LandingPageBooking } from '@kre8tion/shared-types';

const PHASES = ['discover', 'co-create', 'deploy', 'independent'];

// Simplified booking type for portal display
interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
}

interface DocumentRecord {
  id: number;
  partnership_id: number;
  document_type: string;
  status: string;
}

export default function PortalDashboardPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { partnerships, systems, loading, error } = useCustomerPortal();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [documents, setDocuments] = useState<Record<number, DocumentRecord[]>>({});

  // Fetch bookings filtered by customer email
  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      try {
        const res = await fetch(`/api/data/read/bookings?guest_email=${encodeURIComponent(user.email)}`, {
          credentials: 'include',
        });
        const data = await res.json() as PortalBookingsResponse;
        const allBookings: Booking[] = data.data || [];
        const now = new Date().toISOString().split('T')[0];
        setBookings(allBookings.filter((b) => b.booking_date >= now).slice(0, 5));
      } catch {
        setBookings([]);
      }
    })();
  }, [user?.email]);

  // Fetch contract status for each partnership
  useEffect(() => {
    if (partnerships.length === 0) return;
    (async () => {
      const docs: Record<number, DocumentRecord[]> = {};
      for (const p of partnerships) {
        try {
          const res = await fetch(`/api/contracts/status?partnership_id=${p.id}`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json() as PortalContractsStatusResponse;
            docs[p.id] = data.documents || [];
          }
        } catch (err) {
          console.error(`Failed to fetch contracts for partnership ${p.id}:`, err);
        }
      }
      setDocuments(docs);
    })();
  }, [partnerships]);

  const phaseLabels: Record<string, string> = {
    'discover': t.partnerships.phases.discover,
    'co-create': t.partnerships.phases.coCreate,
    'deploy': t.partnerships.phases.deploy,
    'independent': t.partnerships.phases.independent,
  };

  const getSystemStatusTag = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'live':
      case 'deployed':
        return <span className="tag tag-success">{t.portal.systemStatus.live}</span>;
      case 'building':
      case 'in_progress':
        return <span className="tag tag-warning">{t.portal.systemStatus.building}</span>;
      default:
        return <span className="tag">{t.portal.systemStatus.planned}</span>;
    }
  };

  const getDocStatusTag = (status: string) => {
    switch (status) {
      case 'fully_executed':
        return <span className="tag tag-success">{t.documents.statuses.fullyExecuted}</span>;
      case 'client_signed':
        return <span className="tag tag-info">{t.documents.statuses.clientSigned}</span>;
      case 'pending':
        return <span className="tag tag-warning">{t.documents.statuses.pending}</span>;
      default:
        return <span className="tag">{t.documents.statuses.draft}</span>;
    }
  };

  return (
    <PortalLayout>
      <ErrorBoundary>
      <div className="page-content">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {t.portal.welcome}, {user?.name || user?.email?.split('@')[0] || 'Customer'}
          </h1>
          <p className="text-white/50 mt-1">{t.portal.title}</p>
        </div>

        {loading ? (
          <div className="card p-12 text-center">
            <p className="text-white/60">{t.common.loading}</p>
          </div>
        ) : error ? (
          <div className="card p-12 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : partnerships.length === 0 ? (
          /* No Access State */
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{t.portal.noAccess}</h2>
            <p className="text-white/50 max-w-md mx-auto">{t.portal.noAccessMessage}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap)' }}>
            {/* Partnership Progress */}
            {partnerships.map((partnership) => (
              <div key={partnership.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">{partnership.company_name}</h2>
                      <span className={`tag ${getTierClass(partnership.tier)}`}>{partnership.tier}</span>
                    </div>
                    <p className="text-sm text-white/50 mt-1">{t.portal.partnershipProgress}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-white/50">{t.portal.healthScore}</p>
                    <p className={`text-2xl font-bold ${getHealthColor(Number(partnership.satisfaction_score || 0))}`}>
                      {Number(partnership.satisfaction_score || 0)}%
                    </p>
                  </div>
                </div>

                {/* Phase Stepper */}
                <div className="mb-6">
                  <p className="text-xs text-white/50 mb-3">{t.portal.phase}</p>
                  <div className="flex items-center gap-1">
                    {PHASES.map((phase, idx) => {
                      const currentIdx = PHASES.indexOf(partnership.current_phase);
                      const isCompleted = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={phase} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-center">
                            <div
                              className={`h-2 flex-1 rounded-full transition-colors ${
                                isCompleted
                                  ? 'bg-primary-electricBlue'
                                  : isCurrent
                                  ? 'bg-primary-electricBlue/60'
                                  : 'bg-white/10'
                              }`}
                            />
                          </div>
                          <span className={`text-[10px] sm:text-xs ${isCurrent ? 'text-primary-electricBlue font-medium' : 'text-white/40'}`}>
                            {phaseLabels[phase] || phase}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Systems */}
                {systems.filter((s) => s.partnership_id === partnership.id).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-2">{t.portal.systems}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {systems
                        .filter((s) => s.partnership_id === partnership.id)
                        .map((system) => (
                          <div key={system.id} className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-medium text-white truncate">{system.name}</span>
                              {getSystemStatusTag(system.status)}
                            </div>
                            {system.hours_saved_per_week != null && (
                              <p className="text-xs text-white/40">
                                {t.portal.hoursSaved}: {Number(system.hours_saved_per_week)}h
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {documents[partnership.id] && documents[partnership.id].length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-2">{t.portal.documents}</p>
                    <div className="flex flex-wrap gap-2">
                      {documents[partnership.id].map((doc) => (
                        <div key={doc.id} className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
                          <span className="text-sm text-white/80">{doc.document_type?.toUpperCase()}</span>
                          {getDocStatusTag(doc.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Upcoming Meetings */}
            <div className="card">
              <h3 className="text-base font-semibold text-white mb-3">{t.portal.upcoming}</h3>
              {bookings.length === 0 ? (
                <p className="text-sm text-white/50">{t.portal.noMeetings}</p>
              ) : (
                <div className="space-y-2">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{booking.booking_date} at {booking.start_time}</p>
                        {booking.notes && <p className="text-xs text-white/40 mt-0.5">{booking.notes}</p>}
                      </div>
                      <span className={`tag ${booking.status === 'confirmed' ? 'tag-success' : 'tag-warning'}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </ErrorBoundary>
    </PortalLayout>
  );
}
