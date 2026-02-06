'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState } from 'react';

export default function LeadsPage() {
  const { t } = useTranslations();
  const [filter, setFilter] = useState('all');

  // Mock data - will be replaced with API calls
  const leads = [
    { id: 1, name: 'John Smith', email: 'john@abcplumbing.com', company: 'ABC Plumbing', source: 'voice-agent', score: 85, status: 'qualified', industry: 'Plumbing' },
    { id: 2, name: 'Maria Garcia', email: 'maria@xyzhvac.com', company: 'XYZ HVAC', source: 'roi-calculator', score: 72, status: 'new', industry: 'HVAC' },
    { id: 3, name: 'Robert Johnson', email: 'robert@johnsonconstruction.com', company: 'Johnson Construction', source: 'referral', score: 90, status: 'qualified', industry: 'Construction' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@smithproperties.com', company: 'Smith Properties', source: 'voice-agent', score: 65, status: 'contacted', industry: 'Property Management' },
  ];

  return (
    <DashboardLayout>
      <div className="page-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[var(--space-section)]">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{t.leads.title}</h1>
            <p className="text-sm md:text-base text-white/60 mt-1">{leads.length} total leads</p>
          </div>
          <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <PlusIcon className="w-5 h-5" />
            {t.leads.newLead}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-[var(--space-gap)]">
          <div className="flex bg-white/5 rounded-xl p-1 overflow-x-auto">
            {['all', 'new', 'contacted', 'qualified', 'converted'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === f
                    ? 'bg-primary-electricBlue text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="hidden md:block flex-1" />
          <input
            type="text"
            placeholder={t.common.search}
            className="input-glass w-full md:w-64"
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="table-glass min-w-[600px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Industry</th>
                <th>{t.leads.source}</th>
                <th>{t.leads.score}</th>
                <th>{t.leads.status}</th>
                <th>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div>
                      <p className="font-medium text-white">{lead.name}</p>
                      <p className="text-sm text-white/50">{lead.email}</p>
                    </div>
                  </td>
                  <td className="text-white/80">{lead.company}</td>
                  <td className="text-white/80">{lead.industry}</td>
                  <td>
                    <span className="tag">{lead.source}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-primary-electricBlue rounded-full"
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-white/60">{lead.score}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${getStatusClass(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost p-2">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="btn-ghost p-2">
                        <EditIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function getStatusClass(status: string) {
  switch (status) {
    case 'new': return '';
    case 'contacted': return 'tag-warning';
    case 'qualified': return 'tag-success';
    case 'converted': return 'tag-success';
    default: return '';
  }
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
