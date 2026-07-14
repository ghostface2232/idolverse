interface StatBarProps {
  label: string;
  value: number;
  tone?: "pink" | "cyan";
  /** 해당 대상의 강점 능력치 — 라벨과 바 외곽선을 강조한다. */
  emphasized?: boolean;
}

function valueClass(value: number): string {
  if (value >= 90) return "from-brand-cyan";
  if (value >= 70) return "stat-progress-high";
  if (value >= 40) return "stat-progress-mid";
  return "stat-progress-low";
}

export function StatBar({ label, value, tone, emphasized = false }: StatBarProps) {
  const clampedValue = Math.max(0, Math.min(value, 100));
  const isElite = tone === undefined && clampedValue >= 90;
  const barClass =
    tone === "pink"
      ? "from-brand-pink"
      : tone === "cyan"
        ? "from-brand-cyan"
        : valueClass(clampedValue);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span
          className={
            emphasized ? "font-semibold text-cyan-200" : "text-slate-300"
          }
        >
          {label}
        </span>
        <span
          className={
            isElite
              ? "font-semibold text-cyan-300"
              : emphasized
                ? "text-slate-100"
                : "text-slate-300"
          }
        >
          {clampedValue}
        </span>
      </div>
      <progress
        className={[
          "stat-progress",
          barClass,
          emphasized ? "ring-1 ring-brand-cyan/40" : "",
        ].join(" ")}
        value={clampedValue}
        max={100}
      />
    </div>
  );
}
