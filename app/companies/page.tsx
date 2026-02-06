'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { PlusIcon } from '@/components/icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { DotRating } from '@/components/ui/ProgressBar';

export default function CompaniesPage() {
  const { t } = useTranslations();

  const companies = [
    { id: 1, name: 'ABC Plumbing LLC', industry: 'Plumbing', employees: '10-25', aiScore: 3, contacts: 2, opportunities: 1 },
    { id: 2, name: 'XYZ Property Management', industry: 'Property Management', employees: '25-50', aiScore: 5, contacts: 3, opportunities: 2 },
    { id: 3, name: 'Smith & Sons Construction', industry: 'Construction', employees: '25-50', aiScore: 2, contacts: 4, opportunities: 1 },
    { id: 4, name: 'Quick Fix HVAC', industry: 'HVAC', employees: '5-10', aiScore: 4, contacts: 1, opportunities: 1 },
  ];

  return (
    <DashboardLayout>
      <div className="page-content">
        <PageHeader
          title={t.nav.companies}
          subtitle={<>{companies.length} {t.companies.companiesCount}</>}
          action={
            <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
              <PlusIcon className="w-5 h-5" />
              {t.companies.addCompany}
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-gap)]">
          {companies.map((company) => (
            <div key={company.id} className="card card-interactive">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-semibold text-white truncate">{company.name}</h3>
                  <p className="text-xs md:text-sm text-white/50 mt-1">{company.industry}</p>
                </div>
                <span className="tag shrink-0">{company.employees} {t.companies.employees}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">{t.companies.aiMaturityScore}</span>
                  <DotRating value={company.aiScore} />
                </div>

                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-white/50">{t.companies.contacts}</span>
                  <span className="text-white/80">{company.contacts}</span>
                </div>

                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-white/50">{t.companies.opportunities}</span>
                  <span className="text-white/80">{company.opportunities}</span>
                </div>
              </div>

              <button className="btn-secondary w-full mt-4 text-sm">
                {t.companies.viewDetails}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

