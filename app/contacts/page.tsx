'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';

export default function ContactsPage() {
  const { t } = useTranslations();

  const contacts = [
    { id: 1, name: 'John Smith', email: 'john@abcplumbing.com', company: 'ABC Plumbing LLC', role: 'Owner', decisionMaker: true },
    { id: 2, name: 'Maria Garcia', email: 'maria@xyzproperty.com', company: 'XYZ Property Management', role: 'Operations Manager', decisionMaker: true },
    { id: 3, name: 'Robert Johnson', email: 'robert@smithconstruction.com', company: 'Smith & Sons Construction', role: 'CEO', decisionMaker: true },
    { id: 4, name: 'Sarah Williams', email: 'sarah@xyzproperty.com', company: 'XYZ Property Management', role: 'IT Manager', decisionMaker: false },
    { id: 5, name: 'David Brown', email: 'david@quickfixhvac.com', company: 'Quick Fix HVAC', role: 'Owner', decisionMaker: true },
  ];

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[var(--space-section)]">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{t.nav.contacts}</h1>
            <p className="text-sm md:text-base text-white/60 mt-1">{contacts.length} contacts</p>
          </div>
          <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <PlusIcon className="w-5 h-5" />
            Add Contact
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="table-glass min-w-[600px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Role</th>
                <th>Decision Maker</th>
                <th>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-electricBlue/20 flex items-center justify-center">
                        <span className="text-primary-electricBlue font-medium">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{contact.name}</p>
                        <p className="text-sm text-white/50">{contact.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-white/80">{contact.company}</td>
                  <td className="text-white/80">{contact.role}</td>
                  <td>
                    {contact.decisionMaker ? (
                      <span className="tag tag-success">Yes</span>
                    ) : (
                      <span className="text-white/40">No</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost p-2">
                        <EmailIcon className="w-4 h-4" />
                      </button>
                      <button className="btn-ghost p-2">
                        <PhoneIcon className="w-4 h-4" />
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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
