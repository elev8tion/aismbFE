'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import DocumentStatusBadge from '@/components/contracts/DocumentStatusBadge';
import SendContractModal from '@/components/contracts/SendContractModal';
import CounterSignModal from '@/components/contracts/CounterSignModal';
import ContractPDFRenderer from '@/components/contracts/ContractPDFRenderer';
import { DocumentRecord, DocumentStatus } from '@/lib/contracts/types';
import { getContractBundle } from '@/lib/contracts/templates';

interface Partnership {
  id: number;
  company_name: string;
  contact_name?: string;
  customer_email?: string;
  tier: string;
  status: string;
}

interface DocGroup {
  partnership: Partnership;
  documents: DocumentRecord[];
  overallStatus: DocumentStatus;
}

export default function DocumentsPage() {
  const { t } = useTranslations();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [docGroups, setDocGroups] = useState<DocGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendModal, setSendModal] = useState<Partnership | null>(null);
  const [counterSignModal, setCounterSignModal] = useState<Partnership | null>(null);
  const [previewOpen, setPreviewOpen] = useState<Record<'msa' | 'sow' | 'addendum', boolean>>({
    msa: false,
    sow: false,
    addendum: false,
  });

  const templateBundle = useMemo(() => getContractBundle({
    company_name: 'Client Company',
    client_name: 'Client Name',
    client_email: 'client@example.com',
    client_title: 'Owner',
    tier: 'foundation',
    tierName: 'Foundation',
    fees: { setup_cents: 500000, monthly_cents: 150000 },
    min_months: 6,
    effective_date: new Date().toISOString().split('T')[0],
  }), []);

  const loadData = useCallback(async () => {
    try {
      const pRes = await fetch('/api/data/read/partnerships', { credentials: 'include' });
      const pJson = await pRes.json();
      const pData: Partnership[] = pJson?.data || [];
      setPartnerships(pData);

      const groups: DocGroup[] = [];
      for (const p of pData) {
        const dRes = await fetch(`/api/contracts/status?partnership_id=${p.id}`);
        if (dRes.ok) {
          const { documents } = await dRes.json();
          if (documents && documents.length > 0) {
            const overallStatus = getOverallStatus(documents);
            groups.push({ partnership: p, documents, overallStatus });
          }
        }
      }
      setDocGroups(groups);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function getOverallStatus(docs: DocumentRecord[]): DocumentStatus {
    if (docs.every((d: DocumentRecord) => d.status === 'fully_executed')) return 'fully_executed';
    if (docs.some((d: DocumentRecord) => d.status === 'client_signed')) return 'client_signed';
    if (docs.some((d: DocumentRecord) => d.status === 'pending')) return 'pending';
    return 'draft';
  }

  const partnershipsWithoutDocs = partnerships.filter(
    p => !docGroups.some(g => g.partnership.id === p.id)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.documents.title}</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Contract Templates */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">{t.documents.templates}</h2>
              <p className="text-sm text-zinc-400 mb-3">{t.documents.templatesDescription}</p>
              <div className="space-y-3">
                {([
                  { key: 'msa' as const, label: t.documents.types.msa },
                  { key: 'sow' as const, label: t.documents.types.sow },
                  { key: 'addendum' as const, label: t.documents.types.addendum },
                ]).map(({ key, label }) => (
                  <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                      <p className="font-medium text-white">{label}</p>
                      <button
                        onClick={() => setPreviewOpen(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
                      >
                        {previewOpen[key] ? t.documents.hidePreview : t.documents.preview}
                      </button>
                    </div>
                    {previewOpen[key] && (
                      <div className="border-t border-zinc-800 p-4">
                        <div
                          className="bg-white rounded-lg p-6 max-h-[600px] overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: templateBundle[key] }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Partnerships needing contracts */}
            {partnershipsWithoutDocs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Pending Contract</h2>
                <div className="space-y-3">
                  {partnershipsWithoutDocs.map(p => (
                    <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{p.company_name}</p>
                        <p className="text-sm text-zinc-400">{p.contact_name || p.company_name} &mdash; {p.tier}</p>
                      </div>
                      <button
                        onClick={() => setSendModal(p)}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {t.documents.sendContract}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing document groups */}
            {docGroups.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Contract Status</h2>
                <div className="space-y-3">
                  {docGroups.map(group => (
                    <div key={group.partnership.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-white">{group.partnership.company_name}</p>
                          <p className="text-sm text-zinc-400">{group.partnership.contact_name || group.partnership.company_name} &mdash; {group.partnership.tier}</p>
                        </div>
                        <DocumentStatusBadge status={group.overallStatus} labels={t.documents.statuses} />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {group.documents.map((doc: DocumentRecord) => (
                          <div key={doc.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-xs">
                            <span className="text-zinc-300">{t.documents.types[doc.document_type as keyof typeof t.documents.types]}</span>
                            <DocumentStatusBadge status={doc.status} labels={t.documents.statuses} />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-3">
                        {group.overallStatus === 'client_signed' && (
                          <button
                            onClick={() => setCounterSignModal(group.partnership)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors"
                          >
                            {t.documents.counterSign}
                          </button>
                        )}
                        {group.overallStatus === 'fully_executed' && (
                          <ContractPDFRenderer
                            html={{
                              msa: group.documents.find((d: DocumentRecord) => d.document_type === 'msa')?.id ? '' : '',
                              sow: '',
                              addendum: '',
                            }}
                            filename={`contract-${group.partnership.company_name.replace(/\s+/g, '-').toLowerCase()}`}
                            buttonLabel={t.documents.downloadPdf}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {docGroups.length === 0 && partnershipsWithoutDocs.length === 0 && (
              <div className="text-center py-20 text-zinc-500">
                <p>No partnerships found. Create a partnership first to send contracts.</p>
              </div>
            )}
          </>
        )}
      </div>

      {sendModal && (
        <SendContractModal
          open={!!sendModal}
          onClose={() => setSendModal(null)}
          partnership={sendModal}
          onSuccess={loadData}
        />
      )}

      {counterSignModal && (
        <CounterSignModal
          open={!!counterSignModal}
          onClose={() => setCounterSignModal(null)}
          partnership={counterSignModal}
          onSuccess={loadData}
        />
      )}
    </DashboardLayout>
  );
}
