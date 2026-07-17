import {
  AlertTriangle,
  CalendarClock,
  Flag,
  Target,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import type { GoalLaneItem, GoalLanes } from "@/systems/progressionSystem";
import type { WeeklyDecisionTrigger } from "@/types/game";

interface GoalsOverviewModalProps {
  lanes: GoalLanes;
  risk: WeeklyDecisionTrigger | null;
  onClose: () => void;
}

interface GoalItemProps {
  item: GoalLaneItem;
  emphasized?: boolean;
}

const RISK_STYLE: Record<WeeklyDecisionTrigger["severity"], string> = {
  notice: "bg-state-info/10 text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]",
  warning: "bg-state-warning/10 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]",
  critical: "bg-state-danger/10 text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.22)]",
};

function GoalProgress({ ratio }: { ratio: number }) {
  const percentage = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-text-muted">
        <span>달성도</span>
        <span className="tabular-nums text-text-secondary">{percentage}%</span>
      </div>
      <span className="block h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <span
          className="block h-full rounded-full bg-action-secondary"
          style={{ width: `${percentage}%` }}
        />
      </span>
    </div>
  );
}

function GoalItem({ item, emphasized = false }: GoalItemProps) {
  return (
    <article
      className={[
        "rounded-2xl p-4 shadow-[var(--shadow-surface)]",
        emphasized ? "bg-action-secondary/[0.075]" : "bg-surface-shell/68",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-text-primary">
            {item.title}
          </h3>
          {item.progressLabel ? (
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              {item.progressLabel}
            </p>
          ) : null}
        </div>
        {item.deadlineLabel ? (
          <span className="shrink-0 text-xs font-semibold tabular-nums text-text-secondary">
            {item.deadlineLabel}
          </span>
        ) : null}
      </div>
      {item.progressRatio !== undefined ? (
        <GoalProgress ratio={item.progressRatio} />
      ) : null}
      {item.unlocks ? (
        <p className="mt-3 border-t border-white/8 pt-3 text-xs leading-relaxed text-text-muted">
          달성 후 {item.unlocks}
        </p>
      ) : null}
    </article>
  );
}

export function GoalsOverviewModal({
  lanes,
  risk,
  onClose,
}: GoalsOverviewModalProps) {
  const longTermGoals = lanes.longTerm.filter(
    (item) => item.id !== "contract-term",
  );

  return (
    <Modal title="목표 브리핑" onClose={onClose} className="max-w-lg">
      <div className="space-y-6">
        <section aria-labelledby="weekly-goal-heading">
          <div className="mb-3 flex items-center gap-2">
            <Flag className="size-4 text-action-secondary" aria-hidden="true" />
            <h2
              id="weekly-goal-heading"
              className="text-sm font-semibold text-text-primary"
            >
              이번 주
            </h2>
          </div>
          <div className="rounded-2xl bg-surface-raised/72 p-4 shadow-[var(--shadow-surface)]">
            <p className="text-base font-semibold leading-relaxed text-text-primary">
              {lanes.weekly.title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
              매니저가 정리한 일정과 직접 결정할 안건을 확인하세요.
            </p>
          </div>
          {risk ? (
            <div
              className={`mt-3 flex items-start gap-3 rounded-2xl p-3.5 ${RISK_STYLE[risk.severity]}`}
              role="status"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold">
                  {risk.severity === "critical"
                    ? "긴급 확인"
                    : risk.severity === "warning"
                      ? "주의 필요"
                      : "확인 사항"}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{risk.description}</p>
              </div>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="project-goal-heading">
          <div className="mb-3 flex items-center gap-2">
            <Target className="size-4 text-action-secondary" aria-hidden="true" />
            <h2
              id="project-goal-heading"
              className="text-sm font-semibold text-text-primary"
            >
              현재 프로젝트
            </h2>
          </div>
          {lanes.project ? (
            <GoalItem item={lanes.project} emphasized />
          ) : (
            <p className="rounded-2xl bg-surface-shell/68 px-4 py-5 text-sm text-text-muted shadow-[var(--shadow-surface)]">
              진행 중인 프로젝트가 없습니다. 다음 이정표를 준비하고 있습니다.
            </p>
          )}
        </section>

        <section aria-labelledby="long-term-goal-heading">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock
              className="size-4 text-text-secondary"
              aria-hidden="true"
            />
            <h2
              id="long-term-goal-heading"
              className="text-sm font-semibold text-text-primary"
            >
              장기 목표
            </h2>
          </div>
          <div className="space-y-3">
            {longTermGoals.map((item) => (
              <GoalItem key={item.id} item={item} />
            ))}
            {longTermGoals.length === 0 ? (
              <p className="rounded-2xl bg-surface-shell/68 px-4 py-5 text-sm text-text-muted shadow-[var(--shadow-surface)]">
                현재 단계에서 확정된 장기 목표가 없습니다.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </Modal>
  );
}
