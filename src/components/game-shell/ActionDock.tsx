import { ChevronRight, ClipboardCheck } from "lucide-react";
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
      ) : null}
      <Button
        className="w-full gap-2"
        tone={isReviewReady ? "primary" : "secondary"}
        isDisabled={isLocked}
        onPress={onOpenPlan}
      >
        {isReviewReady ? (
          <ClipboardCheck className="size-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-4" aria-hidden="true" />
        )}
        {isReviewReady ? "계획 검토" : "결정 계속하기"}
      </Button>
    </section>
  );
}
