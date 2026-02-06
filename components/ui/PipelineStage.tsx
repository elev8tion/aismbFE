interface PipelineStageProps {
  label: string;
  count: number;
  value: string;
  color: string;
}

export function PipelineStage({ label, count, value, color }: PipelineStageProps) {
  return (
    <div className={`p-3 md:p-4 rounded-xl border ${color}`}>
      <p className="text-xs text-white/60 uppercase tracking-wide truncate">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-white mt-1">{count}</p>
      <p className="text-xs md:text-sm text-white/50 mt-1">{value}</p>
    </div>
  );
}
