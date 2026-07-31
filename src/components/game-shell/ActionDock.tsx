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
  const isQuietWeek = totalDecisions === 0 && canResolveWeek;

  return (
    <section
      aria-label="이번 주 진행"
      className="bg-surface-panel/96 px-4 py-2.5 shadow-[0_-12px_32px_rgba(2,6,23,0.32)] backdrop-blur-xl"
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-semibold text-text-secondary">
          {totalDecisions === 0
            ? "이번 주는 바로 진행할 수 있어요"
            : remainingDecisions > 0
              ? `결정 ${remainingDecisions}개 남음`
              : "모든 결정을 마쳤어요"}
        </p>
      </div>
      {riskLabel ? (
        <p
          className={[
            "mb-2 flex min-w-0 items-center gap-1.5 truncate text-[11px] font-medium",
            riskSeverity === "critical"
              ? "text-rose-300"
              : riskSeverity === "warning"
                ? "text-amber-200"
                : "text-sky-200",
          ].join(" ")}
        >
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{riskLabel}</span>
        </p>
      ) : hintLabel ? (
        <p className="mb-2 truncate text-[11px] text-cyan-200/85">{hintLabel}</p>
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
          {isReviewReady ? "계획 검토" : "결정 계속하기"}
        </Button>
      )}
    </section>
  );
}
