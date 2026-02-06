interface ScoreBarProps {
  score: number;
  className?: string;
}

export function ScoreBar({ score, className }: ScoreBarProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="w-12 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-primary-electricBlue rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm text-white/60">{score}</span>
    </div>
  );
}

interface DotRatingProps {
  value: number;
  max?: number;
}

export function DotRating({ value, max = 5 }: DotRatingProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < value ? 'bg-primary-electricBlue' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <span className="text-white/60">{value}/{max}</span>
    </div>
  );
}

interface StepProgressProps {
  steps: string[];
  currentStep: string;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex gap-2">
      {steps.map((step, i) => (
        <div
          key={step}
          className={`flex-1 h-2 rounded-full ${
            i <= currentIndex
              ? 'bg-primary-electricBlue'
              : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}
