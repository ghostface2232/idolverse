import { AlertTriangle, Target } from "lucide-react";
import type { WeeklyDecisionTrigger } from "@/types/game";

interface GoalStripProps {
  goal: string;
  deadlineLabel: string;
  risk?: WeeklyDecisionTrigger | null;
}

const RISK_STYLE: Record<WeeklyDecisionTrigger["severity"], string> = {
  notice: "text-state-info",
  warning: "text-state-warning",
  critical: "text-state-danger",
};

export function GoalStrip({ goal, deadlineLabel, risk }: GoalStripProps) {
  return (
    <section className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-white/8 bg-surface-panel/92 px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Target className="size-4 shrink-0 text-action-secondary" aria-hidden="true" />
        <p className="truncate text-xs font-medium text-text-secondary" title={goal}>
          {goal}
        </p>
      </div>
      <span className="shrink-0 rounded-lg bg-white/[0.05] px-2 py-1 text-[11px] font-semibold tabular-nums text-text-secondary">
        {deadlineLabel}
      </span>
      {risk ? (
        <div className="col-span-2 flex min-w-0 items-center gap-2">
          <AlertTriangle
            className={`size-4 shrink-0 ${RISK_STYLE[risk.severity]}`}
            aria-hidden="true"
          />
          <p className="truncate text-[11px] text-text-muted" title={risk.description}>
            <span className={`font-semibold ${RISK_STYLE[risk.severity]}`}>
              {risk.severity === "critical" ? "긴급" : risk.severity === "warning" ? "경고" : "주의"}
            </span>
            <span aria-hidden="true"> · </span>
            {risk.description}
          </p>
        </div>
      ) : null}
    </section>
  );
}
