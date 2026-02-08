'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useCustomerPortal } from '@/lib/hooks/useCustomerPortal';
import { useState, useEffect } from 'react';

interface DocumentRecord {
  id: number;
  partnership_id: number;
  doc_type: string;
  status: string;
  created_at?: string;
}

interface SignatureRecord {
  id: number;
  partnership_id: number;
  signer_name?: string;
  signed_at?: string;
}

export default function PortalDocumentsPage() {
  const { t } = useTranslations();
  const { partnerships, loading } = useCustomerPortal();
  const [documentsByPartnership, setDocumentsByPartnership] = useState<
    Record<number, { documents: DocumentRecord[]; signatures: SignatureRecord[] }>
  >({});
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    if (partnerships.length === 0) {
      setLoadingDocs(false);
      return;
    }
    (async () => {
      const result: Record<number, { documents: DocumentRecord[]; signatures: SignatureRecord[] }> = {};
      for (const p of partnerships) {
        try {
          const res = await fetch(`/api/contracts/status?partnership_id=${p.id}`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            result[p.id] = {
              documents: data.documents || [],
              signatures: data.signatures || [],
            };
          }
        } catch {
          // ignore
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
              const data = documentsByPartnership[partnership.id];
              const docs = data?.documents || [];

              return (
                <div key={partnership.id} className="card">
                  <h2 className="text-base font-semibold text-white mb-3">
                    {partnership.company_name}
                  </h2>

                  {docs.length === 0 ? (
                    <p className="text-sm text-white/50">{t.portal.noContracts}</p>
                  ) : (
                    <div className="space-y-2">
                      {docs.map((doc) => (
                        <div key={doc.id} className="bg-white/5 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">{getDocTypeLabel(doc.doc_type)}</p>
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
