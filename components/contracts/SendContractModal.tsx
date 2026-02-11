'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useTranslations } from '@/contexts/LanguageContext';

interface SendContractModalProps {
  open: boolean;
  onClose: () => void;
  partnership: {
    id: number;
    company_name: string;
    contact_name?: string;
    customer_email?: string;
    tier: string;
  };
  onSuccess?: () => void;
}

export default function SendContractModal({ open, onClose, partnership, onSuccess }: SendContractModalProps) {
  const { t } = useTranslations();
  const [clientName, setClientName] = useState(partnership.contact_name || partnership.company_name || '');
  const [clientEmail, setClientEmail] = useState(partnership.customer_email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!clientName.trim() || !clientEmail.trim()) {
      setError('Name and email are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Create documents
      const createRes = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnership_id: partnership.id,
          client_name: clientName.trim(),
          client_email: clientEmail.trim().toLowerCase(),
          company_name: partnership.company_name,
          tier: partnership.tier,
        }),
      });

      if (!createRes.ok) {
        const data: any = await createRes.json();
        throw new Error(data.error || 'Failed to create documents');
      }

      const { signing_token }: any = await createRes.json();

      // Step 2: Send signing request email
      const sendRes = await fetch('/api/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signing_token }),
      });

      if (!sendRes.ok) {
        const data: any = await sendRes.json();
        throw new Error(data.error || 'Failed to send email');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t.documents.sendModal.title}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">{t.documents.sendModal.description}</p>

        <div className="p-3 bg-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Company:</span> {partnership.company_name}
          </p>
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Tier:</span> {partnership.tier}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">{t.documents.sendModal.clientName}</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">{t.documents.sendModal.clientEmail}</label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSend}
          disabled={loading || !clientName.trim() || !clientEmail.trim()}
          className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {loading ? t.documents.sendModal.sending : t.documents.sendModal.send}
        </button>
      </div>
    </Modal>
  );
}
