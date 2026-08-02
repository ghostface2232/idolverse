import type {
  CommercialContractOffer,
  EffectKey,
  EffectMap,
  EventStaffChange,
  TraineeActivity,
} from "@/types/game";
import { formatKoreanWon } from "@/utils/formatKoreanWon";
import { METRIC_LABELS } from "@/data/labels";

interface ImpactChip {
  id: string;
  label: string;
  tone: "positive" | "negative" | "danger" | "neutral";
}

interface ImpactSource {
  effects: EffectMap;
  contractOffer?: CommercialContractOffer;
  activityOverride?: TraineeActivity;
  staffChange?: EventStaffChange;
}

interface DecisionImpactChipsProps {
  option: ImpactSource;
  className?: string;
}

export function DecisionImpactChips({
  option,
  className = "",
}: DecisionImpactChipsProps) {
  const chips = buildImpactChips(option);

  return (
    <span className={["flex flex-wrap gap-1.5", className].join(" ")}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={[
            "inline-flex min-h-8 items-center rounded-full px-3 py-1.5 text-xs font-semibold leading-5",
            chip.tone === "positive"
              ? "bg-emerald-400/10 text-emerald-200"
              : chip.tone === "danger"
                ? "bg-state-danger/10 text-rose-200"
              : chip.tone === "negative"
                ? "bg-amber-400/10 text-amber-200"
                : "bg-cyan-400/10 text-cyan-200",
          ].join(" ")}
        >
          {chip.label}
        </span>
      ))}
    </span>
  );
}

function buildImpactChips(option: ImpactSource): ImpactChip[] {
  const chips = Object.entries(option.effects)
    .filter((entry): entry is [EffectKey, number] => {
      const value = entry[1];
      return typeof value === "number" && value !== 0;
    })
    .map(([key, value]) => effectToChip(key, value));

  if (option.contractOffer) {
    chips.push({
      id: "weekly-income",
      label: `매주 ${formatKoreanWon(option.contractOffer.weeklyIncome)} 수입`,
      tone: "positive",
    });
    chips.push({
      id: "contract-term",
      label: `${option.contractOffer.durationWeeks}주 계약`,
      tone: "neutral",
    });
    chips.push({
      id: "contract-schedule",
      label: `매주 일정 ${option.contractOffer.scheduleSlots}칸`,
      tone: "negative",
    });
    chips.push({
      id: "contract-fatigue",
      label: `매주 피로 +${option.contractOffer.weeklyStress}`,
      tone: "negative",
    });
  }

  if (option.staffChange) {
    if (option.staffChange.kind === "raise-salary") {
      chips.push({
        id: "staff-raise",
        label: `핵심 스태프 주급 +${option.staffChange.percent}% (고정비)`,
        tone: "negative",
      });
    } else {
      chips.push({
        id: "staff-replace",
        label: "핵심 스태프 퇴사 · 신입 합류",
        tone: "danger",
      });
      chips.push({
        id: "staff-replace-cost",
        label: "주간 고정비 감소",
        tone: "positive",
      });
    }
  }

  if (option.activityOverride) {
    const resting =
      option.activityOverride === "rest" || option.activityOverride === "vacation";
    chips.push({
      id: "activity",
      label: resting ? "휴식 확보" : "팀 훈련 제외",
      tone: resting ? "positive" : "negative",
    });
  }

  if (chips.length === 0) {
    chips.push({ id: "no-change", label: "추가 변화 없음", tone: "neutral" });
  }

  return chips;
}

function effectToChip(key: EffectKey, value: number): ImpactChip {
  if (key === "money") {
    return {
      id: key,
      label:
        value > 0
          ? `자금 +${formatKoreanWon(value)}`
          : `${formatKoreanWon(Math.abs(value))} 지출`,
      tone: value > 0 ? "positive" : "negative",
    };
  }

  const positive = isPositiveChange(key, value);
  const direction = directionFor(key, value);
  return {
    id: key,
    label: `${METRIC_LABELS[key]} ${direction.repeat(intensityFor(key, value))}`,
    tone: positive ? "positive" : isDangerChange(key, value) ? "danger" : "negative",
  };
}

function isDangerChange(key: EffectKey, value: number) {
  return (
    (key === "injuryWeeks" ||
      key === "investorPressure" ||
      key === "fandomDisappointment" ||
      key === "stress") &&
    value > 0
  );
}

function isPositiveChange(key: EffectKey, value: number) {
  if (
    key === "stress" ||
    key === "fandomDisappointment" ||
    key === "injuryWeeks" ||
    key === "investorPressure"
  ) {
    return value < 0;
  }
  return value > 0;
}

function directionFor(_key: EffectKey, value: number) {
  return value > 0 ? "↑" : "↓";
}

function intensityFor(key: EffectKey, value: number) {
  const absolute = Math.abs(value);
  if (key === "satisfaction" || key === "condition" || key === "stress") {
    if (absolute <= 6) return 1;
    if (absolute <= 15) return 2;
    return 3;
  }
  if (key === "injuryWeeks" || key === "investorPressure") {
    return absolute <= 2 ? 1 : 2;
  }
  if (absolute <= 3) return 1;
  if (absolute <= 10) return 2;
  return 3;
}
