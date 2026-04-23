interface StatBarProps {
  label: string;
  value: number;
  tone?: "pink" | "cyan";
}

const toneClasses: Record<NonNullable<StatBarProps["tone"]>, string> = {
  pink: "from-brand-pink to-pink-300",
  cyan: "from-brand-cyan to-cyan-300",
};

export function StatBar({
  label,
  value,
  tone = "pink",
}: StatBarProps) {
  const clampedValue = Math.max(0, Math.min(value, 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{clampedValue}</span>
      </div>
      <progress
        className={`stat-progress ${toneClasses[tone]}`}
        value={clampedValue}
        max={100}
      />
    </div>
  );
}
