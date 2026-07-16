import { describe, expect, it } from "vitest";
import {
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
});
