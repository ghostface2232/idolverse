interface StatBarProps {
  label: string;
  value: number;
  tone?: "pink" | "cyan";
}

export function StatBar({ label, value }: StatBarProps) {
  const clampedValue = Math.max(0, Math.min(value, 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{clampedValue}</span>
      </div>
      <progress
        className="stat-progress stat-progress-vital"
        value={clampedValue}
        max={100}
      />
    </div>
  );
}
