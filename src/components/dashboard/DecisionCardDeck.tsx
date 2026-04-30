import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/common/Card";
import { useCalendarStore } from "@/stores/calendarStore";
import { useGameStore } from "@/stores/gameStore";
import type { PlayerDecisions } from "@/systems/weekProcessor";

interface DecisionCardDeckProps {
  onSelectionChange?: (
    resolvedDecisions: PlayerDecisions["resolvedDecisions"],
    isComplete: boolean,
  ) => void;
}

export function DecisionCardDeck({ onSelectionChange }: DecisionCardDeckProps) {
  const headline = useCalendarStore(
    (state) => state.kpopNews[0]?.headline ?? "The market is quiet for now.",
  );
  const cards = useGameStore((state) => state.weeklyDecisions);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    {},
  );
  const cardSignature = useMemo(
    () => cards.map((card) => card.id).join(":"),
    [cards],
  );
  const resolvedDecisions = useMemo(
    () =>
      cards.flatMap((card) => {
        const optionId = selectedOptions[card.id];
        const option = card.options.find((candidate) => candidate.id === optionId);

        return option
          ? [
              {
                cardId: card.id,
                optionId: option.id,
                effects: option.effects,
              },
            ]
          : [];
      }),
    [cards, selectedOptions],
  );
  const isComplete = cards.length > 0 && resolvedDecisions.length === cards.length;

  useEffect(() => {
    setSelectedOptions({});
  }, [cardSignature]);

  useEffect(() => {
    onSelectionChange?.(resolvedDecisions, isComplete);
  }, [isComplete, onSelectionChange, resolvedDecisions]);

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
            <p className="mt-2 text-sm text-slate-400">{card.summary}</p>
            <div className="mt-3 grid gap-2">
              {card.options.map((option) => (
                <button
                  key={option.id}
                  className={[
                    "min-h-11 rounded-2xl border px-3 py-2 text-left text-xs transition",
                    selectedOptions[card.id] === option.id
                      ? "border-brand-pink bg-brand-pink/18 text-slate-50"
                      : "border-white/8 bg-slate-900/80 text-slate-200 hover:border-brand-cyan/50",
                  ].join(" ")}
                  onClick={() =>
                    setSelectedOptions((current) => ({
                      ...current,
                      [card.id]: option.id,
                    }))
                  }
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
