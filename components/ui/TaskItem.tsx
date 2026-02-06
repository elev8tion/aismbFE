import { priorityColors } from '@/lib/utils/statusClasses';

interface TaskItemProps {
  title: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
}

export function TaskItem({ title, priority }: TaskItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-transparent" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{title}</p>
      </div>
      <span className={`tag text-xs ${priorityColors[priority]}`}>{priority}</span>
    </div>
  );
}
