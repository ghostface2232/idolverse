import { ChevronUp, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { WeeklyFlowState } from "@/types/game";

interface ActionDockProps {
  totalDecisions: number;
  remainingDecisions: number;
  canResolveWeek: boolean;
  flowState: WeeklyFlowState;
  riskLabel?: string;
  onOpenPlan: () => void;
}

export function ActionDock({
  totalDecisions,
  remainingDecisions,
  canResolveWeek,
  flowState,
  riskLabel,
  onOpenPlan,
}: ActionDockProps) {
  const completed = Math.max(0, totalDecisions - remainingDecisions);
  const isReviewReady = canResolveWeek;
  const isLocked = flowState === "resolving" || flowState === "event_focus";

  return (
    <section className="bg-surface-panel px-3 py-3 shadow-[0_-12px_32px_rgba(2,6,23,0.32)]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {totalDecisions === 0
              ? "매니저 AI 계획 완료"
              : `이번 주 결정 ${completed}/${totalDecisions}`}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {riskLabel ?? "자동 운영 항목은 매니저 AI가 처리합니다."}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-white/[0.05] px-2 py-1 text-[10px] font-medium text-text-secondary">
          {isReviewReady
            ? remainingDecisions > 0
              ? `기회 ${remainingDecisions}건 선택`
              : "검토 가능"
            : `${remainingDecisions}건 남음`}
        </span>
      </div>
      <Button
        className="w-full gap-2 [font-family:'DungGeunMo',monospace]"
        tone={isReviewReady ? "primary" : "secondary"}
        isDisabled={isLocked}
        onPress={onOpenPlan}
      >
        {isReviewReady ? (
          <ClipboardCheck className="size-4" aria-hidden="true" />
        ) : (
          <ChevronUp className="size-4" aria-hidden="true" />
        )}
        {isReviewReady ? "계획 검토" : "결정 계속하기"}
      </Button>
    </section>
  );
}
