'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';

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
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.nav.companies}</h1>
            <p className="text-white/60 mt-1">{companies.length} companies</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Add Company
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="card card-interactive">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{company.name}</h3>
                  <p className="text-sm text-white/50 mt-1">{company.industry}</p>
                </div>
                <span className="tag">{company.employees} employees</span>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">AI Maturity Score</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`w-2 h-2 rounded-full ${
                            n <= company.aiScore ? 'bg-primary-electricBlue' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-white/60">{company.aiScore}/5</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-white/50">Contacts</span>
                  <span className="text-white/80">{company.contacts}</span>
                </div>

                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-white/50">Opportunities</span>
                  <span className="text-white/80">{company.opportunities}</span>
                </div>
              </div>

              <button className="btn-secondary w-full mt-4 text-sm">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
