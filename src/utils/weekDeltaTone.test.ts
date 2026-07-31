import { describe, expect, it } from "vitest";
import type { WeekDelta } from "@/types/game";
import { isGoodWeekDelta } from "@/utils/weekDeltaTone";

function delta(field: string, before: number, after: number): WeekDelta {
  return {
    id: field,
    source: { kind: "system", id: "test", label: "테스트" },
    target: { kind: "trainee", id: "member", field, label: field },
    before,
    after,
    day: 1,
    severity: "info",
  };
}

describe("isGoodWeekDelta", () => {
  it("스트레스와 팬 실망 감소를 좋은 변화로 본다", () => {
    expect(isGoodWeekDelta(delta("stress", 60, 45))).toBe(true);
    expect(isGoodWeekDelta(delta("fandomDisappointment", 20, 12))).toBe(true);
  });

  it("컨디션과 자금 증가는 좋은 변화로 본다", () => {
    expect(isGoodWeekDelta(delta("condition", 50, 60))).toBe(true);
    expect(isGoodWeekDelta(delta("money", 10, 20))).toBe(true);
  });
});
