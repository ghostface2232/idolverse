import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil, Play } from "lucide-react";
import { Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/common/Button";
import { useCalendarStore } from "@/stores/calendarStore";
import { useGameStore } from "@/stores/gameStore";
import { weeklyFlowSelectors } from "@/stores/weeklyFlowSelectors";
import type { WeeklyDecisionTrigger } from "@/types/game";

const TRIGGER_LABELS: Record<WeeklyDecisionTrigger["severity"], string> = {
  notice: "주의",
  warning: "경고",
  critical: "긴급",
};

const TRIGGER_CLASSES: Record<WeeklyDecisionTrigger["severity"], string> = {
  notice: "bg-state-info/10 text-sky-100",
  warning: "bg-state-warning/10 text-amber-100",
  critical: "bg-state-danger/10 text-rose-100",
};

interface DecisionCardDeckProps {
  onConfirm: () => void;
  isRunning?: boolean;
}

export function DecisionCardDeck({
  onConfirm,
  isRunning = false,
}: DecisionCardDeckProps) {
  const headline = useCalendarStore(
    (state) => state.kpopNews[0]?.headline ?? "이번 주 시장은 비교적 조용합니다.",
  );
  const cards = useGameStore((state) => state.weeklyDecisions);
  const flow = useGameStore(weeklyFlowSelectors.flow);
  const canResolveWeek = useGameStore(weeklyFlowSelectors.canResolveWeek);
  const selectWeeklyDecision = useGameStore((state) => state.selectWeeklyDecision);
  const [activeIndex, setActiveIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const showReview =
    cards.length === 0 || (flow.state === "review_ready" && editingIndex === null);
  const safeIndex = Math.min(activeIndex, Math.max(cards.length - 1, 0));
  const activeCard = cards[safeIndex];

  const handleSelect = (optionId: string) => {
    if (!activeCard) return;

    selectWeeklyDecision(activeCard.id, optionId);

    if (editingIndex !== null || safeIndex >= cards.length - 1) {
      setEditingIndex(null);
      return;
    }

    setActiveIndex(safeIndex + 1);
  };

  if (showReview) {
    return (
      <section className="space-y-4" aria-labelledby="weekly-review-title">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-action-primary">
            Final review
          </p>
          <h2 id="weekly-review-title" className="mt-1 text-xl font-semibold text-text-primary">
            이번 주 계획 검토
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            실행하면 선택과 매니저 AI 배정이 함께 처리됩니다.
          </p>
        </header>

        {cards.length === 0 ? (
          <article className="rounded-3xl bg-action-secondary/[0.07] p-4 shadow-[var(--shadow-surface)]">
            <p className="text-sm font-semibold text-cyan-100">핵심 결정 없음</p>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              이번 주는 긴급한 직접 결정이 없습니다. 훈련과 운영 일정은 매니저 AI가 현재 방침에 따라 배정합니다.
            </p>
          </article>
        ) : (
          <ol className="space-y-2">
            {cards.map((card, index) => {
              const option = card.options.find(
                (candidate) => candidate.id === flow.selectedDecisionIds[card.id],
              );

              return (
                <li
                  key={card.id}
                  className="rounded-2xl bg-surface-raised/70 p-3 shadow-[var(--shadow-surface)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-state-success/12 text-state-success">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-muted">{card.title}</p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">
                        {option?.label ?? "선택 필요"}
                      </p>
                      {option ? (
                        <p className="mt-1 text-xs leading-5 text-text-muted">{option.tradeoff}</p>
                      ) : null}
                    </div>
                    <Button
                      tone="ghost"
                      className="min-w-11 px-0"
                      aria-label={`${card.title} 선택 수정`}
                      onPress={() => {
                        setActiveIndex(index);
                        setEditingIndex(index);
                      }}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <article className="rounded-2xl bg-surface-shell/72 p-3 shadow-[var(--shadow-surface)]">
          <p className="text-xs font-semibold text-action-secondary">매니저 AI 자동 운영</p>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            선택하지 않은 세부 훈련, 휴식, 내부 업무는 팀 컨디션과 현재 투자자 KPI를 기준으로 자동 처리됩니다.
          </p>
        </article>

        <Button
          className="w-full gap-2 [font-family:'DungGeunMo',monospace]"
          isDisabled={!canResolveWeek || isRunning}
          onPress={onConfirm}
        >
          <Play className="ml-0.5 size-4" aria-hidden="true" />
          {isRunning ? "주간 처리 중…" : "이번 주 실행"}
        </Button>
      </section>
    );
  }

  if (!activeCard) return null;

  const selectedOptionId = flow.selectedDecisionIds[activeCard.id] ?? null;

  return (
    <section className="space-y-4" aria-labelledby={`decision-${activeCard.id}`}>
      <header>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-action-primary">
            Weekly decision
          </p>
          <span className="text-xs font-semibold tabular-nums text-text-muted">
            {safeIndex + 1} / {cards.length}
          </span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {cards.map((card, index) => (
            <span
              key={card.id}
              className={`h-1.5 flex-1 rounded-full ${
                index <= safeIndex ? "bg-action-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-text-muted">{headline}</p>
      </header>

      <article className="rounded-3xl bg-surface-raised p-4 shadow-[var(--shadow-raised)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
              {activeCard.category}
            </p>
            <h2
              id={`decision-${activeCard.id}`}
              className="mt-1 text-lg font-semibold text-text-primary"
            >
              {activeCard.title}
            </h2>
          </div>
          {activeCard.trigger ? (
            <span
              className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${TRIGGER_CLASSES[activeCard.trigger.severity]}`}
            >
              {TRIGGER_LABELS[activeCard.trigger.severity]}
            </span>
          ) : null}
        </div>

        {activeCard.trigger ? (
          <p className={`mt-3 rounded-xl px-3 py-2 text-xs leading-5 ${TRIGGER_CLASSES[activeCard.trigger.severity]}`}>
            <span className="font-semibold">발생 원인 · </span>
            {activeCard.trigger.description}
          </p>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-text-secondary">{activeCard.summary}</p>

        <RadioGroup
          aria-label={`${activeCard.title} 선택지`}
          value={selectedOptionId}
          onChange={handleSelect}
          className="mt-4 grid gap-2.5"
        >
          {activeCard.options.map((option) => (
            <Radio
              key={option.id}
              value={option.id}
              className={({ isFocusVisible, isPressed, isSelected }) =>
                [
                  "group min-h-16 rounded-2xl bg-surface-shell/78 px-3 py-3 outline-none shadow-[var(--shadow-surface)]",
                  "transition-[scale,background-color,box-shadow] duration-[var(--motion-state)] ease-out",
                  isSelected
                    ? "bg-action-primary/12 shadow-[0_0_0_2px_var(--color-action-primary)]"
                    : "hover:bg-white/[0.05] hover:shadow-[var(--shadow-surface-hover)]",
                  isPressed ? "scale-[0.96]" : "scale-100",
                  isFocusVisible ? "ring-2 ring-action-secondary ring-offset-2 ring-offset-surface-raised" : "",
                ].join(" ")
              }
            >
              {({ isSelected }) => (
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full shadow-[var(--shadow-surface)] ${
                      isSelected ? "bg-action-primary text-white" : "bg-white/[0.04] text-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text-primary">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-text-muted">{option.tradeoff}</span>
                  </span>
                </div>
              )}
            </Radio>
          ))}
        </RadioGroup>
      </article>

      <div className="flex items-center justify-between gap-2">
        <Button
          tone="ghost"
          className="gap-1.5"
          isDisabled={safeIndex === 0}
          onPress={() => setActiveIndex((index) => Math.max(0, index - 1))}
        >
          <ChevronLeft className="size-4" aria-hidden="true" /> 이전
        </Button>
        <Button
          tone="ghost"
          className="gap-1.5"
          isDisabled={safeIndex >= cards.length - 1}
          onPress={() => setActiveIndex((index) => Math.min(cards.length - 1, index + 1))}
        >
          다음 <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
