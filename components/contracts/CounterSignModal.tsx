'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import SignaturePad from './SignaturePad';

interface CounterSignModalProps {
  open: boolean;
  onClose: () => void;
  partnership: {
    id: number;
    company_name: string;
    contact_name?: string;
    tier: string;
  };
  onSuccess?: () => void;
}

export default function CounterSignModal({ open, onClose, partnership, onSuccess }: CounterSignModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSign = async (data: { signature: string; name: string }) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contracts/countersign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnership_id: partnership.id,
          signer_name: data.name,
          signer_title: 'Managing Member',
          signer_email: 'connect@elev8tion.one',
          signature_data: data.signature,
        }),
      });

      if (!res.ok) {
        const result: any = await res.json();
        throw new Error(result.error || 'Failed to countersign');
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
    <Modal open={open} onClose={onClose} title="Counter-Sign Documents" wide>
      <div className="space-y-4">
        <div className="p-3 bg-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Client:</span> {partnership.contact_name || partnership.company_name}
          </p>
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Company:</span> {partnership.company_name}
          </p>
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Tier:</span> {partnership.tier}
          </p>
        </div>

        <p className="text-sm text-zinc-400">
          The client has signed all documents. Add your counter-signature below to make them fully executed.
        </p>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <SignaturePad
          onComplete={handleSign}
          nameLabel="Your Name"
          disabled={loading}
        />
      </div>
    </Modal>
  );
}
