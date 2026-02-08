'use client';

import { useState, useRef, useCallback } from 'react';

interface DocumentViewerProps {
  html: {
    msa: string;
    sow: string;
    addendum: string;
  };
  labels?: {
    msa?: string;
    sow?: string;
    addendum?: string;
    viewedCheck?: string;
  };
  onAllViewed?: () => void;
}

const TAB_KEYS = ['msa', 'sow', 'addendum'] as const;
type TabKey = typeof TAB_KEYS[number];

export default function DocumentViewer({ html, labels, onAllViewed }: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('msa');
  const [viewed, setViewed] = useState<Record<TabKey, boolean>>({ msa: false, sow: false, addendum: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const tabLabels: Record<TabKey, string> = {
    msa: labels?.msa || 'MSA',
    sow: labels?.sow || 'SOW',
    addendum: labels?.addendum || 'AI Addendum',
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (atBottom && !viewed[activeTab]) {
      const newViewed = { ...viewed, [activeTab]: true };
      setViewed(newViewed);
      if (TAB_KEYS.every(k => newViewed[k])) {
        onAllViewed?.();
      }
    }
  }, [activeTab, viewed, onAllViewed]);

  const allViewed = TAB_KEYS.every(k => viewed[k]);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-zinc-700">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tabLabels[key]}
            {viewed[key] && (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-xs text-zinc-500">
        <span>{labels?.viewedCheck || 'Reviewed'}: {TAB_KEYS.filter(k => viewed[k]).length}/{TAB_KEYS.length}</span>
        {allViewed && <span className="text-green-400 font-medium">All documents reviewed</span>}
        {!viewed[activeTab] && <span className="ml-auto">Scroll to bottom to mark as reviewed</span>}
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white"
        style={{ maxHeight: '60vh' }}
      >
        <div dangerouslySetInnerHTML={{ __html: html[activeTab] }} />
      </div>
    </div>
  );
}
