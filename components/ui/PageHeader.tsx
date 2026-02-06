import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[var(--space-section)]">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm md:text-base text-white/60 mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
