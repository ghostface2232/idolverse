import { AlertTriangle, CalendarClock, Flag, Target } from "lucide-react";
import type { GoalLanes } from "@/systems/progressionSystem";
import type { WeeklyDecisionTrigger } from "@/types/game";

interface GoalStripProps {
  lanes: GoalLanes;
  risk?: WeeklyDecisionTrigger | null;
}

const RISK_STYLE: Record<WeeklyDecisionTrigger["severity"], string> = {
  notice: "text-state-info",
  warning: "text-state-warning",
  critical: "text-state-danger",
};

interface LaneRowProps {
  icon: React.ReactNode;
  laneLabel: string;
  title: string;
  progressLabel?: string;
  progressRatio?: number;
  deadlineLabel?: string;
  unlocks?: string;
}

function LaneRow({
  icon,
  laneLabel,
  title,
  progressLabel,
  progressRatio,
  deadlineLabel,
  unlocks,
}: LaneRowProps) {
  const tooltip = unlocks ? `${title}. 달성 후 다음 단계: ${unlocks}` : title;
  return (
    <div className="flex min-w-0 items-center gap-2">
      {icon}
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {laneLabel}
      </span>
      <p
        className="min-w-0 flex-1 truncate text-xs font-medium text-text-secondary"
        title={tooltip}
      >
        {title}
        {unlocks ? (
          <span className="text-text-muted"> → {unlocks}</span>
        ) : null}
      </p>
      {progressLabel ? (
        <span className="flex shrink-0 items-center gap-1.5">
          {progressRatio !== undefined ? (
            <span
              className="h-1 w-10 overflow-hidden rounded-full bg-white/10"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full bg-action-secondary"
                style={{ width: `${Math.round(Math.min(1, progressRatio) * 100)}%` }}
              />
            </span>
          ) : null}
          <span className="text-[11px] font-semibold tabular-nums text-text-secondary">
            {progressLabel}
          </span>
        </span>
      ) : null}
      {deadlineLabel ? (
        <span className="shrink-0 rounded-lg bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
          {deadlineLabel}
        </span>
      ) : null}
    </div>
  );
}

/**
 * 3시간축 목표 스트립: 이번 주 / 현재 프로젝트 / 장기.
 * 데이터는 progressionSystem.buildGoalLanes가 파생하고 여기는 표시만 한다.
 */
export function GoalStrip({ lanes, risk }: GoalStripProps) {
  const contract = lanes.longTerm.find((item) => item.id === "contract-term");
  const longTermRows = lanes.longTerm
    .filter((item) => item.id !== "contract-term")
    .slice(0, 2);

  return (
    <section className="shrink-0 space-y-1.5 border-b border-white/8 bg-surface-panel/92 px-3 py-2 sm:px-4">
      <LaneRow
        icon={
          <Flag
            className="size-3.5 shrink-0 text-text-muted"
            aria-hidden="true"
          />
        }
        laneLabel="이번 주"
        title={lanes.weekly.title}
      />
      {lanes.project ? (
        <LaneRow
          icon={
            <Target
              className="size-3.5 shrink-0 text-action-secondary"
              aria-hidden="true"
            />
          }
          laneLabel="프로젝트"
          title={lanes.project.title}
          progressLabel={lanes.project.progressLabel}
          progressRatio={lanes.project.progressRatio}
          deadlineLabel={lanes.project.deadlineLabel}
          unlocks={lanes.project.unlocks}
        />
      ) : null}
      {longTermRows.map((item) => (
        <LaneRow
          key={item.id}
          icon={
            <CalendarClock
              className="size-3.5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
          }
          laneLabel="장기"
          title={item.title}
          progressLabel={item.progressLabel}
          progressRatio={item.progressRatio}
          deadlineLabel={item.deadlineLabel}
          unlocks={item.unlocks}
        />
      ))}
      {contract ? (
        <LaneRow
          icon={
            <CalendarClock
              className="size-3.5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
          }
          laneLabel="계약"
          title={contract.title}
          deadlineLabel={contract.deadlineLabel}
        />
      ) : null}
      {risk ? (
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle
            className={`size-3.5 shrink-0 ${RISK_STYLE[risk.severity]}`}
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
