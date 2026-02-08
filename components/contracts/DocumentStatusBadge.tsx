'use client';

import { DocumentStatus } from '@/lib/contracts/types';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  labels?: {
    draft?: string;
    pending?: string;
    clientSigned?: string;
    fullyExecuted?: string;
  };
}

const statusConfig: Record<DocumentStatus, { bg: string; text: string; defaultLabel: string }> = {
  draft: { bg: 'bg-zinc-700', text: 'text-zinc-300', defaultLabel: 'Draft' },
  pending: { bg: 'bg-blue-500/20', text: 'text-blue-400', defaultLabel: 'Pending Signature' },
  client_signed: { bg: 'bg-amber-500/20', text: 'text-amber-400', defaultLabel: 'Client Signed' },
  fully_executed: { bg: 'bg-green-500/20', text: 'text-green-400', defaultLabel: 'Fully Executed' },
};

export default function DocumentStatusBadge({ status, labels }: DocumentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  const labelMap: Record<DocumentStatus, string> = {
    draft: labels?.draft || config.defaultLabel,
    pending: labels?.pending || config.defaultLabel,
    client_signed: labels?.clientSigned || config.defaultLabel,
    fully_executed: labels?.fullyExecuted || config.defaultLabel,
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {labelMap[status]}
    </span>
  );
}
