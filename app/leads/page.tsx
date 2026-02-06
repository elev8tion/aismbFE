'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { PlusIcon, EyeIcon, EditIcon } from '@/components/icons';
import { getLeadStatusClass } from '@/lib/utils/statusClasses';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { ScoreBar } from '@/components/ui/ProgressBar';

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
        <PageHeader
          title={t.leads.title}
          subtitle={<>{leads.length} {t.leads.totalLeads}</>}
          action={
            <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
              <PlusIcon className="w-5 h-5" />
              {t.leads.newLead}
            </button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-[var(--space-gap)]">
          <FilterTabs
            tabs={['all', 'new', 'contacted', 'qualified', 'converted'].map((f) => ({
              key: f,
              label: f.charAt(0).toUpperCase() + f.slice(1),
            }))}
            activeTab={filter}
            onTabChange={setFilter}
          />
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
                <th>{t.contacts.name}</th>
                <th>{t.contacts.company}</th>
                <th>{t.companies.title}</th>
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
                    <ScoreBar score={lead.score} />
                  </td>
                  <td>
                    <span className={`tag ${getLeadStatusClass(lead.status)}`}>
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


