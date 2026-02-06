'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { PlusIcon, EmailIcon, PhoneIcon, EditIcon } from '@/components/icons';
import { PageHeader } from '@/components/ui/PageHeader';

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
        <PageHeader
          title={t.nav.contacts}
          subtitle={<>{contacts.length} {t.contacts.contactsCount}</>}
          action={
            <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
              <PlusIcon className="w-5 h-5" />
              {t.contacts.addContact}
            </button>
          }
        />

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="table-glass min-w-[600px]">
            <thead>
              <tr>
                <th>{t.contacts.name}</th>
                <th>{t.contacts.company}</th>
                <th>{t.contacts.role}</th>
                <th>{t.contacts.decisionMaker}</th>
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
                      <span className="tag tag-success">{t.contacts.yes}</span>
                    ) : (
                      <span className="text-white/40">{t.contacts.no}</span>
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

