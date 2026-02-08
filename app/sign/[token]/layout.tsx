import type { ReactNode } from 'react';

export default function SignLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f14]">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <h1 className="text-lg font-bold text-white tracking-wide">ELEV8TION</h1>
          <span className="text-xs text-zinc-500">Contract Signing</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
