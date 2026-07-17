import { Sparkle } from "lucide-react";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import type { PromotionActivity, PromotionActivityId } from "@/types/game";

const PROMOTION_COST_UNIT = 10000;

const EFFECT_LABELS: Record<string, string> = {
  public: "대중",
  fandom: "팬덤",
  fandomLoyalty: "충성",
  fandomDisappointment: "실망",
  global: "글로벌",
  industry: "업계",
};

function summarizeEffects(effects: PromotionActivity["effects"]): string {
  return Object.entries(effects)
    .filter(([key]) => EFFECT_LABELS[key])
    .map(([key, value]) => `${EFFECT_LABELS[key]} ${value > 0 ? "+" : ""}${value}`)
    .join(" · ");
}

interface ActivityPromotionPanelProps {
  activities: readonly PromotionActivity[];
  selectedId: PromotionActivityId | null;
  money: number;
  activityWeeksLeft: number;
  disabled?: boolean;
  onSelect: (id: PromotionActivityId | null) => void;
}

/**
 * 활동기(발매 후) 전용 프로모션 선택. 주당 1건 — 다시 누르면 해제된다.
 * 이정표가 해금한 활동(팬사인회·콘서트 등)이 실제로 여기서 열린다.
 */
export function ActivityPromotionPanel({
  activities,
  selectedId,
  money,
  activityWeeksLeft,
  disabled = false,
  onSelect,
}: ActivityPromotionPanelProps) {
  if (activities.length === 0) return null;

  return (
    <section className="rounded-2xl bg-[linear-gradient(120deg,rgba(251,191,36,0.1),rgba(236,72,153,0.08))] p-3 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          <Sparkle className="size-3.5" aria-hidden="true" />
          활동기 프로모션
        </h3>
        <span className="text-[11px] tabular-nums text-text-muted">
          활동 종료까지 W-{activityWeeksLeft} · 주당 1건
        </span>
      </div>

      <div className="mt-2 space-y-1.5">
        {activities.map((activity) => {
          const cost = activity.cost * PROMOTION_COST_UNIT;
          const income = (activity.income ?? 0) * PROMOTION_COST_UNIT;
          const affordable = cost <= money;
          const isSelected = selectedId === activity.id;
          return (
            <button
              key={activity.id}
              type="button"
              disabled={disabled || !affordable}
              className={[
                "w-full rounded-xl px-3 py-2 text-left transition-[scale,background-color,box-shadow] duration-150 ease-out active:scale-[0.98]",
                !affordable || disabled ? "cursor-not-allowed opacity-45" : "",
                isSelected
                  ? "bg-amber-400/12 shadow-[inset_0_0_0_2px_rgba(251,191,36,0.5)]"
                  : "bg-surface-shell/72 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
              ].join(" ")}
              onClick={() => onSelect(isSelected ? null : activity.id)}
            >
              <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-text-primary">
                  {activity.name}
                </span>
                <span className="flex items-center gap-2 text-[11px] tabular-nums">
                  {cost > 0 ? <MoneyDisplay amount={-cost} size="sm" /> : null}
                  {income > 0 ? (
                    <span className="text-emerald-300">
                      기대 수익 <MoneyDisplay amount={income} size="sm" />
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="mt-0.5 block text-[11px] leading-4 text-text-muted">
                {summarizeEffects(activity.effects)}
                {activity.sideEffect ? ` · ${activity.sideEffect}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
