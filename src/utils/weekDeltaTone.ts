import type { WeekDelta } from "@/types/game";

const BAD_WHEN_UP_FIELDS = new Set([
  "fandomDisappointment",
  "stress",
  "injuryWeeks",
  "investorPressureWeeks",
]);

/** 숫자 변화가 플레이어에게 유리한 방향인지 같은 의미 체계로 판정한다. */
export function isGoodWeekDelta(delta: WeekDelta): boolean | null {
  if (typeof delta.before !== "number" || typeof delta.after !== "number") {
    return null;
  }
  const difference = delta.after - delta.before;
  if (difference === 0) return null;
  return BAD_WHEN_UP_FIELDS.has(delta.target.field)
    ? difference < 0
    : difference > 0;
}

export function isDangerousWeekDelta(delta: WeekDelta): boolean {
  return isGoodWeekDelta(delta) === false && delta.severity === "critical";
}
