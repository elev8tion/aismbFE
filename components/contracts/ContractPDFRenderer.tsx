'use client';

import { useRef } from 'react';
import { generatePDF } from '@/lib/utils/pdfGenerator';

interface ContractPDFRendererProps {
  html: {
    msa: string;
    sow: string;
    addendum: string;
  };
  filename?: string;
  buttonLabel?: string;
}

export default function ContractPDFRenderer({ html, filename = 'contract', buttonLabel = 'Download PDF' }: ContractPDFRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    // Show the hidden div temporarily for rendering
    containerRef.current.style.display = 'block';
    try {
      await generatePDF('contract-pdf-render', `${filename}.pdf`);
    } finally {
      containerRef.current.style.display = 'none';
    }
  };

  const combinedHtml = [html.msa, html.sow, html.addendum]
    .map(h => h.replace(/<!DOCTYPE[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*$/, ''))
    .join('<div style="page-break-before: always;"></div>');

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {buttonLabel}
      </button>
      <div ref={containerRef} id="contract-pdf-render" style={{ display: 'none', position: 'fixed', left: '-9999px', top: 0, width: 800 }}>
        <div dangerouslySetInnerHTML={{ __html: combinedHtml }} />
      </div>
    </>
  );
}
