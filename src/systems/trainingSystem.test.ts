import { describe, expect, it } from "vitest";
import {
  computeInjuryProbability,
  previewTraineeWeek,
  processTrainingWeek,
  type TrainingSchedule,
} from "@/systems/trainingSystem";
import { makeTrainee } from "@/test/gameStateFixture";
import type { Staff } from "@/types/game";

const MANAGER: Staff = {
  id: "staff-manager",
  name: "김매니저",
  role: "manager",
  ability: 60,
  salary: 42000000,
};

const FACILITIES = { dormLevel: 1 as const, studioLevel: 1 as const };

function schedule(overrides: Partial<TrainingSchedule> = {}): TrainingSchedule {
  return { intensity: "normal", restDay: false, ...overrides };
}

function totalGrowth(preview: ReturnType<typeof previewTraineeWeek>): number {
  return Object.values(preview.statGrowth).reduce((s, v) => s + (v ?? 0), 0);
}

describe("trainingSystem 트레이드오프", () => {
  it("부상 위험은 일상 훈련에서는 낮고 낮은 체력과 높은 스트레스에서 커진다", () => {
    expect(computeInjuryProbability(100, 0)).toBeCloseTo(0.004);
    expect(computeInjuryProbability(60, 50)).toBeCloseTo(0.0144);
    expect(computeInjuryProbability(0, 100)).toBeCloseTo(0.026);
  });

  it("휴식일은 스트레스를 줄이는 대신 성장을 깎는다 (지배 선택 해소)", () => {
    const trainee = makeTrainee("t1");
    const withoutRest = previewTraineeWeek(
      trainee, schedule(), MANAGER, null, FACILITIES,
    );
    const withRest = previewTraineeWeek(
      trainee, schedule({ restDay: true }), MANAGER, null, FACILITIES,
    );

    expect(totalGrowth(withRest)).toBeLessThan(totalGrowth(withoutRest));
    expect(withRest.stressDelta).toBeLessThan(withoutRest.stressDelta);
  });

  it("개인 레슨은 포커스 스탯(미지정 시 최고 스탯)에 집중 성장을 준다", () => {
    const trainee = makeTrainee("t1", {
      currentActivity: "individual",
      stats: { visual: 40, vocal: 70, dance: 50, charm: 50, stamina: 60, mental: 80 },
    });
    const noFocus = previewTraineeWeek(
      trainee, schedule(), MANAGER, null, FACILITIES,
    );
    expect(noFocus.statGrowth.vocal ?? 0).toBeGreaterThan(0);
    expect(Object.keys(noFocus.statGrowth)).toHaveLength(1);

    const withFocus = previewTraineeWeek(
      trainee, schedule({ focus: "dance" }), MANAGER, null, FACILITIES,
    );
    expect(withFocus.statGrowth.dance ?? 0).toBeGreaterThan(0);
  });

  it("프리뷰의 결정론 결과가 실제 주간 처리와 일치한다", () => {
    const trainee = makeTrainee("t1");
    const s = schedule({ intensity: "hard" });
    const preview = previewTraineeWeek(trainee, s, MANAGER, null, FACILITIES);
    const result = processTrainingWeek([trainee], s, MANAGER, null, 5, FACILITIES);
    const after = result.trainees[0];

    // 부상이 없는 주 기준: 스탯·스트레스 변화가 프리뷰와 정확히 같다
    expect(result.injuries).toHaveLength(0);
    expect(after.stats.vocal).toBeCloseTo(
      trainee.stats.vocal + (preview.statGrowth.vocal ?? 0),
    );
    expect(after.stress).toBeCloseTo(trainee.stress + preview.stressDelta);
  });

  it("잠재력 소프트캡: 상한 근처에서 성장이 잦아들고 상한을 넘지 못한다", () => {
    // potential 1.0 → 캡 74. 캡 위의 스탯은 성장 0, 캡 근처는 taper된다.
    const nearCap = makeTrainee("t1", {
      potential: 1.0,
      stats: { visual: 50, vocal: 73, dance: 30, charm: 30, stamina: 60, mental: 60 },
    });
    const farFromCap = makeTrainee("t2", {
      potential: 1.0,
      stats: { visual: 50, vocal: 40, dance: 30, charm: 30, stamina: 60, mental: 60 },
    });

    const nearPreview = previewTraineeWeek(
      nearCap, schedule({ focus: "vocal" }), MANAGER, null, FACILITIES,
    );
    const farPreview = previewTraineeWeek(
      farFromCap, schedule({ focus: "vocal" }), MANAGER, null, FACILITIES,
    );
    expect(nearPreview.statGrowth.vocal ?? 0).toBeLessThan(
      (farPreview.statGrowth.vocal ?? 0) * 0.2,
    );

    // 캡 도달 후에는 완전히 멈춘다 — 저잠재 멤버의 천장이 실재해야 한다.
    const atCap = makeTrainee("t3", {
      potential: 1.0,
      stats: { visual: 50, vocal: 74, dance: 30, charm: 30, stamina: 60, mental: 60 },
    });
    const atCapPreview = previewTraineeWeek(
      atCap, schedule({ focus: "vocal" }), MANAGER, null, FACILITIES,
    );
    expect(atCapPreview.statGrowth.vocal ?? 0).toBe(0);
  });

  it("고잠재 멤버는 같은 스탯에서 더 높은 천장과 성장을 갖는다", () => {
    const stats = { visual: 50, vocal: 70, dance: 30, charm: 30, stamina: 60, mental: 60 };
    const lowPotential = makeTrainee("low", { potential: 0.9, stats: { ...stats } });
    const highPotential = makeTrainee("high", { potential: 1.6, stats: { ...stats } });

    const lowPreview = previewTraineeWeek(
      lowPotential, schedule({ focus: "vocal" }), MANAGER, null, FACILITIES,
    );
    const highPreview = previewTraineeWeek(
      highPotential, schedule({ focus: "vocal" }), MANAGER, null, FACILITIES,
    );
    expect(highPreview.statGrowth.vocal ?? 0).toBeGreaterThan(
      (lowPreview.statGrowth.vocal ?? 0) * 3,
    );
  });
});
