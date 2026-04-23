import { Card } from "@/components/common/Card";
import { useAppStore } from "@/stores/appStore";

export function DecisionCardDeck() {
  const headline = useAppStore((state) => state.event.marketHeadline);
  const cards = useAppStore((state) => state.event.weeklyDecisionCards);

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-pink">
          Decision Queue
        </p>
        <h2 className="text-lg font-semibold text-slate-50">
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
                <h3 className="mt-1 text-sm font-semibold text-slate-100">
                  {card.title}
                </h3>
              </div>
              <span className="rounded-full bg-slate-700 px-2 py-1 text-[10px] text-slate-300">
                {card.options.length} options
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{card.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {card.options.map((option) => (
                <span
                  key={option.id}
                  className="rounded-full bg-slate-900/80 px-2.5 py-1 text-xs text-slate-200 ring-1 ring-white/8"
                >
                  {option.label}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

