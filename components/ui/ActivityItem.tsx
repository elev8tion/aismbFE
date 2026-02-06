import { ReactNode } from 'react';

interface ActivityItemProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  time: string;
}

export function ActivityItem({ icon, title, subtitle, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="p-2 rounded-lg bg-primary-electricBlue/10 text-primary-electricBlue">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-white/50">{subtitle}</p>
      </div>
      <span className="text-xs text-white/40">{time}</span>
    </div>
  );
}
