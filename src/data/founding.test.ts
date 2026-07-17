import { describe, expect, it } from "vitest";
import { calculatePositionPotentialRating } from "@/data/founding";
import type { TraineeStatKey } from "@/types/game";

const rookieStats: Record<TraineeStatKey, number> = {
  visual: 32,
  vocal: 32,
  dance: 32,
  charm: 32,
  stamina: 32,
  mental: 32,
};

describe("calculatePositionPotentialRating", () => {
  it("40 이하의 신인 능력치도 완성형 기준의 1단계로 고정하지 않는다", () => {
    expect(calculatePositionPotentialRating(rookieStats, 1.2, "center")).toBe(3);
  });

  it("같은 멤버의 분야별 강점을 포지션마다 다르게 반영한다", () => {
    const vocalSpecialist: Record<TraineeStatKey, number> = {
      visual: 18,
      vocal: 45,
      dance: 18,
      charm: 18,
      stamina: 30,
      mental: 30,
    };

    expect(
      calculatePositionPotentialRating(vocalSpecialist, 1.2, "mainVocal"),
    ).toBe(4);
    expect(
      calculatePositionPotentialRating(vocalSpecialist, 1.2, "mainDancer"),
    ).toBe(2);
  });

  it("같은 분야별 강점에서는 성장 잠재력이 높은 멤버를 더 높게 본다", () => {
    const lowPotential = calculatePositionPotentialRating(
      rookieStats,
      0.75,
      "leader",
    );
    const highPotential = calculatePositionPotentialRating(
      rookieStats,
      1.7,
      "leader",
    );

    expect(highPotential).toBeGreaterThan(lowPotential);
  });

  it("입력 범위를 벗어나도 별 등급을 1~5 사이로 제한한다", () => {
    const veryLowStats = Object.fromEntries(
      Object.keys(rookieStats).map((stat) => [stat, 0]),
    ) as Record<TraineeStatKey, number>;
    const veryHighStats = Object.fromEntries(
      Object.keys(rookieStats).map((stat) => [stat, 100]),
    ) as Record<TraineeStatKey, number>;

    expect(calculatePositionPotentialRating(veryLowStats, 0, "visual")).toBe(1);
    expect(calculatePositionPotentialRating(veryHighStats, 2, "visual")).toBe(5);
  });
});
