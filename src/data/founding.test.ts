import { describe, expect, it } from "vitest";
import { calculateRelativePositionPotentialRatings } from "@/data/founding";
import type { TraineeStatKey } from "@/types/game";

const rookieStats: Record<TraineeStatKey, number> = {
  visual: 32,
  vocal: 32,
  dance: 32,
  charm: 32,
  stamina: 32,
  mental: 32,
};

function candidate(
  id: string,
  stats: Partial<Record<TraineeStatKey, number>> = {},
  potential = 1.6,
) {
  return {
    id,
    potential,
    stats: { ...rookieStats, ...stats },
  };
}

describe("calculateRelativePositionPotentialRatings", () => {
  it("전원이 고잠재여도 포지션 분야 강점에 따라 별을 넓게 나눈다", () => {
    const ratings = calculateRelativePositionPotentialRatings(
      [
        candidate("ace", { vocal: 45 }),
        candidate("strong", { vocal: 36 }),
        candidate("developing", { vocal: 27 }),
        candidate("raw", { vocal: 18 }),
      ],
      "mainVocal",
    );

    expect(ratings).toEqual({
      ace: 5,
      strong: 4,
      developing: 2,
      raw: 1,
    });
  });

  it("멤버 간 차이가 작으면 순위만으로 별 차이를 강제하지 않는다", () => {
    const ratings = calculateRelativePositionPotentialRatings(
      [
        candidate("a", { vocal: 30 }),
        candidate("b", { vocal: 31 }),
        candidate("c", { vocal: 31 }),
        candidate("d", { vocal: 32 }),
      ],
      "mainVocal",
    );

    expect(new Set(Object.values(ratings))).toEqual(new Set([3]));
  });

  it("분야 강점이 충분하면 낮은 잠재력으로도 고잠재 원석보다 앞선다", () => {
    const ratings = calculateRelativePositionPotentialRatings(
      [
        candidate("high-potential", { vocal: 22 }, 1.7),
        candidate("ready-vocal", { vocal: 38 }, 0.75),
      ],
      "mainVocal",
    );

    expect(ratings["ready-vocal"]).toBeGreaterThan(ratings["high-potential"]);
  });

  it("분야 강점이 같으면 성장 잠재력이 상대 평가에 보정으로 작용한다", () => {
    const ratings = calculateRelativePositionPotentialRatings(
      [
        candidate("low-potential", {}, 0.75),
        candidate("high-potential", {}, 1.7),
      ],
      "leader",
    );

    expect(ratings["high-potential"]).toBeGreaterThan(ratings["low-potential"]);
  });

  it("모든 비교 조건이 같으면 전원에게 중간 별을 준다", () => {
    const ratings = calculateRelativePositionPotentialRatings(
      [candidate("a"), candidate("b"), candidate("c")],
      "center",
    );

    expect(ratings).toEqual({ a: 3, b: 3, c: 3 });
  });
});
