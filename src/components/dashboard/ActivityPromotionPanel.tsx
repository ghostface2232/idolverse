import { Sparkle } from "lucide-react";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { radioTileClasses } from "@/components/common/selectionTokens";
import type { EffectKey, PromotionActivity, PromotionActivityId } from "@/types/game";
import { METRIC_LABELS } from "@/data/labels";

const PROMOTION_COST_UNIT = 10000;

/** 요약에 노출할 지표 — 라벨 표기는 METRIC_LABELS 단일 사전을 따른다. */
const SUMMARY_EFFECT_KEYS: readonly EffectKey[] = [
  "public",
  "fandom",
  "fandomLoyalty",
  "fandomDisappointment",
  "global",
  "industry",
];

// 효과 수치는 사전 공개하지 않는다. 어느 쪽에 도움이 되는지만 전한다.
function summarizeEffects(effects: PromotionActivity["effects"]): string {
  const benefits: string[] = [];
  const drawbacks: string[] = [];
  let strongest = 0;
  for (const [key, value] of Object.entries(effects)) {
    const label = SUMMARY_EFFECT_KEYS.includes(key as EffectKey)
      ? METRIC_LABELS[key as EffectKey]
      : undefined;
    if (!label || !value) continue;
    const goodness = key === "fandomDisappointment" ? -value : value;
    if (goodness > 0) {
      benefits.push(label);
      strongest = Math.max(strongest, Math.abs(value));
    } else {
      drawbacks.push(label);
    }
  }
  const parts: string[] = [];
  if (benefits.length > 0) {
    const adverb = strongest >= 5 ? "크게 " : strongest >= 3 ? "" : "조금씩 ";
    parts.push(`${benefits.join("·")}에 ${adverb}보탬이 됩니다`);
  }
  if (drawbacks.length > 0) {
    parts.push(`${drawbacks.join("·")} 쪽은 손해입니다`);
  }
  return parts.join(" · ");
}

interface ActivityPromotionPanelProps {
  activities: readonly PromotionActivity[];
  selectedId: PromotionActivityId | null;
  money: number;
  /** 활동기 모드에서만 의미가 있다 — 인터루드 모드에서는 무시된다. */
  activityWeeksLeft?: number;
  /** 이번 활동기에 이미 진행한 활동 — 같은 활동은 활동기당 1회만 열린다. */
  usedActivityIds?: readonly PromotionActivityId[];
  disabled?: boolean;
  /** 활동기 프로모션(기본) 또는 비활동기 운영 활동. 헤더 문구가 달라진다. */
  mode?: "activity" | "interlude";
  onSelect: (id: PromotionActivityId | null) => void;
}

/**
 * 활동기(발매 후) 전용 프로모션 선택. 주당 1건, 다시 누르면 해제된다.
 * 이정표가 해금한 활동(팬사인회·콘서트 등)이 실제로 여기서 열린다.
 */
export function ActivityPromotionPanel({
  activities,
  selectedId,
  money,
  activityWeeksLeft = 0,
  usedActivityIds = [],
  disabled = false,
  mode = "activity",
  onSelect,
}: ActivityPromotionPanelProps) {
  if (activities.length === 0) return null;

  // 활동기(앰버·핑크)와 비활동기 운영(시안)은 다른 상태다 — 표면 색으로 구분한다.
  const isInterlude = mode === "interlude";

  return (
    <section
      className={
        isInterlude
          ? "rounded-2xl bg-[linear-gradient(120deg,rgba(34,211,238,0.08),rgba(59,130,246,0.06))] p-3 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]"
          : "rounded-2xl bg-[linear-gradient(120deg,rgba(251,191,36,0.1),rgba(236,72,153,0.08))] p-3 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)]"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          className={[
            "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em]",
            isInterlude ? "text-cyan-200" : "text-amber-300",
          ].join(" ")}
        >
          <Sparkle className="size-3.5" aria-hidden="true" />
          {isInterlude ? "이번 주 운영 활동" : "활동기 프로모션"}
        </h3>
        <span className="text-[11px] tabular-nums text-text-muted">
          {isInterlude
            ? "주당 1건 · 팬덤과 인지도를 지키는 비활동기 운영"
            : `활동 종료까지 ${activityWeeksLeft}주 · 주당 1건 · 같은 활동은 1회만`}
        </span>
      </div>

      <div className="mt-2 space-y-1.5">
        {activities.map((activity) => {
          const cost = activity.cost * PROMOTION_COST_UNIT;
          const income = (activity.income ?? 0) * PROMOTION_COST_UNIT;
          const affordable = cost <= money;
          const alreadyUsed = usedActivityIds.includes(activity.id);
          const isSelected = selectedId === activity.id;
          return (
            <button
              key={activity.id}
              type="button"
              disabled={disabled || !affordable || alreadyUsed}
              className={[
                "min-h-11 w-full rounded-xl border-2 px-3 py-2 text-left transition duration-150 ease-out active:scale-[0.96] [word-break:keep-all]",
                !affordable || disabled || alreadyUsed
                  ? "cursor-not-allowed opacity-45"
                  : "",
                radioTileClasses(isSelected, selectedId !== null),
              ].join(" ")}
              onClick={() => onSelect(isSelected ? null : activity.id)}
            >
              <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-text-primary">
                  {activity.name}
                </span>
                <span className="flex items-center gap-2 text-[11px] tabular-nums">
                  {alreadyUsed ? (
                    <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-semibold text-text-muted">
                      {isInterlude ? "이번 주 진행 완료" : "이번 활동기 진행 완료"}
                    </span>
                  ) : (
                    <>
                      {cost > 0 ? (
                        <MoneyDisplay amount={-cost} size="sm" />
                      ) : null}
                      {income > 0 ? (
                        <span className="text-emerald-300">
                          기대 수익 <MoneyDisplay amount={income} size="sm" />
                        </span>
                      ) : null}
                    </>
                  )}
                </span>
              </span>
              <span className="mt-0.5 block text-pretty text-[11px] leading-4 text-text-muted">
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
