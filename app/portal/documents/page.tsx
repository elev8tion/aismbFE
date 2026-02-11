'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useCustomerPortal } from '@/lib/hooks/useCustomerPortal';
import { useState, useEffect, useMemo } from 'react';
import { getContractBundle } from '@/lib/contracts/templates';
import { TIER_PRICING, type TierKey } from '@/lib/stripe/pricing';
import DocumentViewer from '@/components/contracts/DocumentViewer';
import type { PortalContractsStatusResponse } from '@/lib/types/api';
import dynamic from 'next/dynamic';
const ContractPDFRenderer = dynamic(
  () => import('@/components/contracts/ContractPDFRenderer'),
  { ssr: false }
);

interface DocumentRecord {
  id: number;
  partnership_id: number;
  document_type: string;
  status: string;
  client_name?: string;
  client_email?: string;
  company_name?: string;
  tier?: string;
  setup_fee_cents?: number;
  monthly_fee_cents?: number;
  min_months?: number;
  created_at?: string;
}

export default function PortalDocumentsPage() {
  const { t } = useTranslations();
  const { partnerships, loading } = useCustomerPortal();
  const [documentsByPartnership, setDocumentsByPartnership] = useState<
    Record<number, DocumentRecord[]>
  >({});
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [previewPartnership, setPreviewPartnership] = useState<number | null>(null);

  useEffect(() => {
    if (partnerships.length === 0) {
      setLoadingDocs(false);
      return;
    }
    (async () => {
      const result: Record<number, DocumentRecord[]> = {};
      for (const p of partnerships) {
        try {
          const res = await fetch(`/api/contracts/status?partnership_id=${p.id}`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json() as PortalContractsStatusResponse;
            result[p.id] = data.documents || [];
          }
        } catch (err) {
          console.error(`Failed to fetch contracts for partnership ${p.id}:`, err);
        }
      }
      setDocumentsByPartnership(result);
      setLoadingDocs(false);
    })();
  }, [partnerships]);

  const getStatusTag = (status: string) => {
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

  const getDocTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'msa':
        return t.documents.types.msa;
      case 'sow':
        return t.documents.types.sow;
      case 'addendum':
        return t.documents.types.addendum;
      default:
        return type?.toUpperCase() || 'Document';
    }
  };

  // Generate contract HTML bundles for preview/download per partnership
  const contractBundles = useMemo(() => {
    const bundles: Record<number, ReturnType<typeof getContractBundle>> = {};
    for (const [pid, docs] of Object.entries(documentsByPartnership)) {
      const partnershipId = Number(pid);
      const sampleDoc = docs[0];
      if (!sampleDoc) continue;
      const tierKey = (sampleDoc.tier || 'foundation') as TierKey;
      const pricing = TIER_PRICING[tierKey] || TIER_PRICING.foundation;
      bundles[partnershipId] = getContractBundle({
        company_name: sampleDoc.company_name || 'Company',
        client_name: sampleDoc.client_name || 'Client',
        client_email: sampleDoc.client_email || '',
        client_title: 'Authorized Representative',
        tier: tierKey,
        tierName: pricing.name,
        fees: {
          setup_cents: sampleDoc.setup_fee_cents || pricing.setup,
          monthly_cents: sampleDoc.monthly_fee_cents || pricing.monthly,
        },
        min_months: sampleDoc.min_months || pricing.minMonths,
        effective_date: sampleDoc.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    }
    return bundles;
  }, [documentsByPartnership]);

  const isLoading = loading || loadingDocs;

  return (
    <PortalLayout>
      <div className="page-content">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{t.portal.documents}</h1>
        </div>

        {isLoading ? (
          <div className="card p-12 text-center">
            <p className="text-white/60">{t.common.loading}</p>
          </div>
        ) : partnerships.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-white/50">{t.portal.noAccessMessage}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap)' }}>
            {partnerships.map((partnership) => {
              const docs = documentsByPartnership[partnership.id] || [];
              const bundle = contractBundles[partnership.id];
              const isPreviewOpen = previewPartnership === partnership.id;

              return (
                <div key={partnership.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <h2 className="text-base font-semibold text-white">
                      {partnership.company_name}
                    </h2>
                    {bundle && docs.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewPartnership(isPreviewOpen ? null : partnership.id)}
                          className="btn-ghost text-sm"
                        >
                          <svg className="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {isPreviewOpen ? t.documents.hidePreview : t.documents.preview}
                        </button>
                        <ContractPDFRenderer
                          html={bundle}
                          filename={`contract-${(partnership.company_name || 'document').replace(/\s+/g, '-').toLowerCase()}`}
                          buttonLabel={t.documents.downloadPdf}
                        />
                      </div>
                    )}
                  </div>

                  {docs.length === 0 ? (
                    <p className="text-sm text-white/50">{t.portal.noContracts}</p>
                  ) : (
                    <>
                      {/* Document status list */}
                      <div className="space-y-2 mb-3">
                        {docs.map((doc) => (
                          <div key={doc.id} className="bg-white/5 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-white">{getDocTypeLabel(doc.document_type)}</p>
                              {doc.created_at && (
                                <p className="text-xs text-white/40 mt-0.5">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {getStatusTag(doc.status)}
                          </div>
                        ))}
                      </div>

                      {/* Inline preview */}
                      {isPreviewOpen && bundle && (
                        <div className="rounded-xl overflow-hidden border border-white/10">
                          <DocumentViewer
                            html={bundle}
                            labels={{
                              msa: t.documents.types.msa,
                              sow: t.documents.types.sow,
                              addendum: t.documents.types.addendum,
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
