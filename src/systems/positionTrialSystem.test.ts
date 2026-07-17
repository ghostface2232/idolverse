import { describe, expect, it } from "vitest";
import { makeTrainee } from "@/test/gameStateFixture";
import { evaluatePositionTrials } from "@/systems/positionTrialSystem";

describe("evaluatePositionTrials", () => {
  it("동일한 상태와 시드에서 같은 선발전 결과를 만든다", () => {
    const trainees = [makeTrainee("a"), makeTrainee("b")];

    expect(evaluatePositionTrials(trainees, 41)).toEqual(
      evaluatePositionTrials(trainees, 41),
    );
  });

  it("포지션 기량이 크게 높은 후보가 기본 경쟁 우위를 가진다", () => {
    const vocal = makeTrainee("vocal", {
      stats: {
        visual: 40,
        vocal: 95,
        dance: 40,
        charm: 40,
        stamina: 80,
        mental: 80,
      },
      chemistry: { dancer: 0 },
    });
    const dancer = makeTrainee("dancer", {
      stats: {
        visual: 40,
        vocal: 35,
        dance: 95,
        charm: 40,
        stamina: 80,
        mental: 80,
      },
      chemistry: { vocal: 0 },
    });

    const result = evaluatePositionTrials([vocal, dancer], 41);

    expect(result.mainVocal[0].traineeId).toBe("vocal");
    expect(result.mainDancer[0].traineeId).toBe("dancer");
  });

  it("같은 기량이면 컨디션과 팀 케미가 점수에 반영된다", () => {
    const steady = makeTrainee("steady", {
      condition: 90,
      chemistry: { tired: 80, teammate: 80 },
    });
    const tired = makeTrainee("tired", {
      condition: 20,
      chemistry: { steady: 80, teammate: -80 },
    });
    const teammate = makeTrainee("teammate", {
      chemistry: { steady: 80, tired: -80 },
    });

    const result = evaluatePositionTrials([steady, tired, teammate], 41);
    const steadyResult = result.mainVocal.find(
      (candidate) => candidate.traineeId === "steady",
    );
    const tiredResult = result.mainVocal.find(
      (candidate) => candidate.traineeId === "tired",
    );

    expect(steadyResult!.breakdown.condition).toBeGreaterThan(
      tiredResult!.breakdown.condition,
    );
    expect(steadyResult!.breakdown.chemistry).toBeGreaterThan(
      tiredResult!.breakdown.chemistry,
    );
  });

  it("부상 중인 후보에게 별도 감점을 적용한다", () => {
    const healthy = makeTrainee("healthy");
    const injured = makeTrainee("injured", { injuryWeeks: 2 });

    const result = evaluatePositionTrials([healthy, injured], 41);
    const injuredResult = result.center.find(
      (candidate) => candidate.traineeId === "injured",
    );

    expect(injuredResult!.breakdown.injuryPenalty).toBe(24);
  });
});
