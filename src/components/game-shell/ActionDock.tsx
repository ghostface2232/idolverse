import { ChevronRight, ClipboardCheck, Play, TriangleAlert } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { WeeklyDecisionTrigger, WeeklyFlowState } from "@/types/game";

interface ActionDockProps {
  totalDecisions: number;
  remainingDecisions: number;
  canResolveWeek: boolean;
  flowState: WeeklyFlowState;
  riskLabel?: string;
  riskSeverity?: WeeklyDecisionTrigger["severity"];
  /** 안건은 없지만 열려 있는 선택 기회(컴백 기획, 프로모션 등) 안내. */
  hintLabel?: string;
  isAdvancing?: boolean;
  onOpenPlan: () => void;
  onAdvanceWeek: () => void;
}

export function ActionDock({
  totalDecisions,
  remainingDecisions,
  canResolveWeek,
  flowState,
  riskLabel,
  riskSeverity = "warning",
  hintLabel,
  isAdvancing = false,
  onOpenPlan,
  onAdvanceWeek,
}: ActionDockProps) {
  const isReviewReady = canResolveWeek;
  const isLocked = flowState === "resolving" || flowState === "event_focus";
  // 안건이 하나도 없는 조용한 주는 탭 이동 없이 이 자리에서 바로 진행한다.
  const isQuietWeek = totalDecisions === 0 && canResolveWeek && !hintLabel;
  const completedDecisions = Math.max(0, totalDecisions - remainingDecisions);

  return (
    <section
      aria-label="이번 주 진행"
      className="bg-surface-panel/96 px-4 py-3 shadow-[var(--shadow-dock)] backdrop-blur-xl"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] font-semibold text-text-primary">
          {totalDecisions === 0
            ? "이번 주는 바로 진행할 수 있어요"
            : remainingDecisions > 0
              ? `이번 주 안건 ${completedDecisions}/${totalDecisions}`
              : "모든 결정을 마쳤어요"}
        </p>
        {totalDecisions > 0 ? (
          <span className="shrink-0 text-xs font-medium tabular-nums text-text-muted">
            {remainingDecisions > 0 ? `${remainingDecisions}개 남음` : "검토 가능"}
          </span>
        ) : null}
      </div>
      {totalDecisions > 0 ? (
        <div
          className="mb-2.5 flex gap-1"
          role="progressbar"
          aria-label="이번 주 안건 완료"
          aria-valuemin={0}
          aria-valuemax={totalDecisions}
          aria-valuenow={completedDecisions}
        >
          {Array.from({ length: totalDecisions }, (_, index) => (
            <span
              key={index}
              className={[
                "h-1 flex-1 rounded-full",
                index < completedDecisions ? "bg-action-primary" : "bg-white/10",
              ].join(" ")}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}
      {riskLabel ? (
        <p
          className={[
            "mb-2.5 flex min-w-0 items-start gap-1.5 text-xs font-medium leading-4",
            riskSeverity === "critical"
              ? "text-rose-300"
              : riskSeverity === "warning"
                ? "text-amber-200"
                : "text-sky-200",
          ].join(" ")}
        >
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{riskLabel}</span>
        </p>
      ) : hintLabel ? (
        <p className="mb-2.5 line-clamp-2 text-xs leading-4 text-cyan-200">
          {hintLabel}
        </p>
      ) : null}
      {isQuietWeek ? (
        <div className="flex gap-2">
          <Button
            tone="secondary"
            className="shrink-0 gap-1.5 px-3"
            isDisabled={isLocked || isAdvancing}
            onPress={onOpenPlan}
          >
            일정 보기
          </Button>
          <Button
            className="min-w-0 flex-1 gap-2"
            isDisabled={isLocked || isAdvancing}
            onPress={onAdvanceWeek}
          >
            <Play className="size-4" aria-hidden="true" />
            {isAdvancing ? "진행 중…" : "이번 주 진행"}
          </Button>
        </div>
      ) : (
        <Button
          className="w-full gap-2 py-2.5"
          tone={isReviewReady ? "primary" : "secondary"}
          isDisabled={isLocked || isAdvancing}
          onPress={onOpenPlan}
        >
          {isReviewReady ? (
            <ClipboardCheck className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
          {isReviewReady
            ? totalDecisions === 0
              ? "추가 계획 확인"
              : "계획 검토하고 진행"
            : `안건 ${remainingDecisions}개 결정하기`}
        </Button>
      )}
    </section>
  );
}
