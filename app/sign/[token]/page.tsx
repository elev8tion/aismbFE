'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DocumentViewer from '@/components/contracts/DocumentViewer';
import SignaturePad from '@/components/contracts/SignaturePad';

type Status = 'loading' | 'ready' | 'signing' | 'success' | 'expired' | 'already_signed' | 'error';

interface VerifyData {
  html: { msa: string; sow: string; addendum: string };
  client_name: string;
  client_email: string;
  company_name: string;
  tierName: string;
}

export default function SignPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<VerifyData | null>(null);
  const [allViewed, setAllViewed] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/contracts/verify-token?token=${token}`);
        if (res.status === 410) {
          setStatus('expired');
          return;
        }
        if (res.status === 409) {
          setStatus('already_signed');
          return;
        }
        if (!res.ok) {
          setStatus('error');
          setError('Invalid or expired signing link.');
          return;
        }
        const result = await res.json();
        setData(result);
        setStatus('ready');
      } catch {
        setStatus('error');
        setError('Failed to load documents. Please try again.');
      }
    }
    verify();
  }, [token]);

  const handleSign = async (signData: { signature: string; name: string }) => {
    setStatus('signing');
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signer_name: signData.name,
          signer_title: title,
          signer_email: data?.client_email,
          signature_data: signData.signature,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to sign');
      }

      setStatus('success');
    } catch (err) {
      setStatus('ready');
      setError(err instanceof Error ? err.message : 'Failed to sign');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Link Expired</h2>
        <p className="text-zinc-400">This signing link has expired. Please contact us for a new one.</p>
      </div>
    );
  }

  if (status === 'already_signed') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Already Signed</h2>
        <p className="text-zinc-400">These documents have already been signed. Thank you!</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Documents Signed Successfully!</h2>
        <p className="text-zinc-400 mb-2">Thank you, {data?.client_name}.</p>
        <p className="text-zinc-500 text-sm">Your signed documents are being processed. You will receive a copy once fully executed.</p>
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-zinc-400">{error || 'Something went wrong.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Contract Review &amp; Signing</h2>
        <p className="text-zinc-400 mt-1">
          {data.company_name} &mdash; {data.tierName} Partnership
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <DocumentViewer
          html={data.html}
          labels={{ msa: 'MSA', sow: 'SOW', addendum: 'AI Addendum' }}
          onAllViewed={() => setAllViewed(true)}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-opacity ${allViewed ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <h3 className="text-lg font-semibold text-white mb-1">Sign Documents</h3>
        <p className="text-sm text-zinc-400 mb-4">
          {allViewed
            ? 'Please sign below to accept all documents.'
            : 'Please review all documents by scrolling to the bottom of each tab before signing.'}
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="e.g. Owner, CEO, Manager"
          />
        </div>

        <SignaturePad
          onComplete={handleSign}
          nameLabel="Full Legal Name"
          disabled={status === 'signing'}
        />
      </div>
    </div>
  );
}
