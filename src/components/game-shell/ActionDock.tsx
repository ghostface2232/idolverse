import { ChevronRight, ClipboardCheck, Play } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { WeeklyFlowState } from "@/types/game";

interface ActionDockProps {
  totalDecisions: number;
  remainingDecisions: number;
  canResolveWeek: boolean;
  flowState: WeeklyFlowState;
  riskLabel?: string;
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
  hintLabel,
  isAdvancing = false,
  onOpenPlan,
  onAdvanceWeek,
}: ActionDockProps) {
  const completed = Math.max(0, totalDecisions - remainingDecisions);
  const isReviewReady = canResolveWeek;
  const isLocked = flowState === "resolving" || flowState === "event_focus";
  // 안건이 하나도 없는 조용한 주는 탭 이동 없이 이 자리에서 바로 진행한다.
  const isQuietWeek = totalDecisions === 0 && canResolveWeek;

  return (
    <section className="bg-surface-panel px-4 py-3 shadow-[0_-12px_32px_rgba(2,6,23,0.32)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-text-primary">
          {totalDecisions === 0
            ? "이번 주 안건 없음"
            : `이번 주 안건 ${completed}/${totalDecisions}`}
        </p>
        {totalDecisions > 0 && totalDecisions <= 6 ? (
          <div className="flex shrink-0 items-center gap-1" aria-hidden="true">
            {Array.from({ length: totalDecisions }, (_, index) => (
              <span
                key={index}
                className={[
                  "size-1.5 rounded-full",
                  index < completed ? "bg-action-secondary" : "bg-white/15",
                ].join(" ")}
              />
            ))}
          </div>
        ) : null}
      </div>
      {riskLabel ? (
        <p className="mb-2 truncate text-xs text-amber-200/90">⚠ {riskLabel}</p>
      ) : hintLabel ? (
        <p className="mb-2 truncate text-xs text-cyan-200/85">{hintLabel}</p>
      ) : null}
      {isQuietWeek ? (
        <div className="flex gap-2">
          <Button
            tone="secondary"
            className="shrink-0 gap-1.5"
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
          className="w-full gap-2"
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
