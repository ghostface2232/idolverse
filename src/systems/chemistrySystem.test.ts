import { describe, expect, it } from "vitest";
import {
  calculatePairChemistryAffinity,
  initializeRosterChemistry,
  updateChemistry,
} from "@/systems/chemistrySystem";
import { makeTrainee } from "@/test/gameStateFixture";

describe("멤버 조합 기반 케미", () => {
  it("동갑, 같은 성향, 강아지상과 고양이상 대비, 보완 포지션을 합산한다", () => {
    const vocal = makeTrainee("vocal", {
      age: 18,
      traits: ["energetic", "doglike"],
      position: "mainVocal",
    });
    const dancer = makeTrainee("dancer", {
      age: 18,
      traits: ["energetic", "catlike"],
      position: "mainDancer",
    });
    const unrelated = makeTrainee("unrelated", {
      age: 22,
      traits: ["pure", "tall"],
      position: "visual",
    });

    expect(calculatePairChemistryAffinity(vocal, dancer)).toBeGreaterThan(
      calculatePairChemistryAffinity(vocal, unrelated),
    );
  });

  it("선발 직후 양방향 케미를 조합 친화도로 초기화한다", () => {
    const members = initializeRosterChemistry([
      makeTrainee("cat", { age: 19, traits: ["reserved", "catlike"] }),
      makeTrainee("dog", { age: 19, traits: ["energetic", "doglike"] }),
    ]);

    expect(members[0].chemistry.dog).toBeGreaterThan(0);
    expect(members[0].chemistry.dog).toBe(members[1].chemistry.cat);
  });

  it("공동 무대 없이 반복 훈련만 하면 조합별 천장 위 케미가 내려간다", () => {
    const members = [
      makeTrainee("a", { chemistry: { b: 80 } }),
      makeTrainee("b", { chemistry: { a: 80 } }),
    ];

    const result = updateChemistry(members, false, 1);

    expect(result.updates[0].chemistry.b).toBeLessThan(80);
  });
});
