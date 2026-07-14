import { Card } from "@/components/common/Card";
import { useCalendarStore } from "@/stores/calendarStore";
import { useGameStore } from "@/stores/gameStore";
import type { WeeklyDecisionTrigger } from "@/types/game";

const TRIGGER_LABELS: Record<WeeklyDecisionTrigger["severity"], string> = {
  notice: "주의",
  warning: "경고",
  critical: "긴급",
};

const TRIGGER_CLASSES: Record<WeeklyDecisionTrigger["severity"], string> = {
  notice: "bg-cyan-500/10 text-cyan-200 ring-cyan-300/20",
  warning: "bg-amber-500/10 text-amber-200 ring-amber-300/20",
  critical: "bg-red-500/12 text-red-200 ring-red-300/25",
};

export function DecisionCardDeck() {
  const headline = useCalendarStore(
    (state) => state.kpopNews[0]?.headline ?? "The market is quiet for now.",
  );
  const cards = useGameStore((state) => state.weeklyDecisions);
  const selectedOptions = useGameStore(
    (state) => state.weeklyFlow.selectedDecisionIds,
  );
  const selectWeeklyDecision = useGameStore(
    (state) => state.selectWeeklyDecision,
  );
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-pink">
          Decision Queue
        </p>
        <h2 className="text-lg text-slate-50">
          Core Weekly Choices
        </h2>
        <p className="text-sm text-slate-400">{headline}</p>
      </div>

      <div className="space-y-3">
        {cards.length === 0 ? (
          <p className="rounded-2xl bg-slate-800/66 px-4 py-5 text-center text-sm text-slate-400">
            이번 주에는 직접 결정할 긴급 이슈가 없습니다.
          </p>
        ) : null}
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-2xl border border-white/8 bg-slate-800/66 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-brand-cyan">
                  {card.category}
                </p>
                <h3 className="mt-1 text-sm text-slate-100">
                  {card.title}
                </h3>
              </div>
              <span className="rounded-full bg-slate-700 px-2 py-1 text-[10px] text-slate-300">
                {card.options.length} options
              </span>
            </div>
            {card.trigger ? (
              <p
                className={[
                  "mt-3 rounded-xl px-3 py-2 text-xs tabular-nums ring-1 ring-inset [text-wrap:pretty]",
                  TRIGGER_CLASSES[card.trigger.severity],
                ].join(" ")}
              >
                <span className="font-medium">
                  {TRIGGER_LABELS[card.trigger.severity]} · 발생 원인
                </span>{" "}
                {card.trigger.description}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-slate-400 [text-wrap:pretty]">
              {card.summary}
            </p>
            <div className="mt-3 grid gap-2">
              {card.options.map((option) => (
                <button
                  key={option.id}
                  className={[
                    "min-h-11 rounded-2xl border px-3 py-2 text-left text-xs transition-[border-color,background-color,color,scale] duration-150 active:scale-[0.96]",
                    selectedOptions[card.id] === option.id
                      ? "border-brand-pink bg-brand-pink/18 text-slate-50"
                      : "border-white/8 bg-slate-900/80 text-slate-200 hover:border-brand-cyan/50",
                  ].join(" ")}
                  onClick={() => selectWeeklyDecision(card.id, option.id)}
                >
                  <span className="block text-sm text-slate-100">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-slate-400">
                    {option.tradeoff}
                  </span>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
