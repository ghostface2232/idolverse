import { describe, expect, it } from "vitest";
import { getStaffTrainingsForRole } from "@/data/staffTraining";
import {
  applyStaffTraining,
  staffPotentialToStars,
} from "@/systems/staffTrainingSystem";
import type { Staff } from "@/types/game";

function makeStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: "staff-1",
    name: "테스트 스태프",
    role: "manager",
    ability: 20,
    potentialCap: 100,
    trainingCounts: {},
    salary: 1_000_000,
    ...overrides,
  };
}

describe("스태프 잠재력과 훈련", () => {
  it("잠재력 별은 현재 능력이 아니라 남은 성장 폭을 나타낸다", () => {
    expect(staffPotentialToStars(makeStaff({ ability: 80, potentialCap: 82 }))).toBe(1);
    expect(staffPotentialToStars(makeStaff({ ability: 15, potentialCap: 75 }))).toBe(5);
  });

  it("역할마다 잘 맞는 훈련 네 가지를 우선 제안한다", () => {
    const producerTrainings = getStaffTrainingsForRole("producer");
    expect(producerTrainings).toHaveLength(4);
    expect(producerTrainings.map((training) => training.id)).toContain("beatmaking-lab");
    expect(producerTrainings.map((training) => training.id)).toContain(
      "directing-workshop",
    );
  });

  it("같은 훈련을 반복하면 5회 이후 효과가 거의 남지 않는다", () => {
    let staff = makeStaff();
    const gains: number[] = [];
    for (let index = 0; index < 6; index++) {
      const result = applyStaffTraining(staff, "directing-workshop");
      gains.push(result.abilityGain);
      staff = result.staff;
    }

    expect(gains[0]).toBeGreaterThan(6);
    expect(gains[4]).toBeLessThan(gains[0] * 0.05);
    expect(gains[5]).toBeLessThan(gains[0] * 0.02);
    expect(staff.trainingCounts?.["directing-workshop"]).toBe(6);
  });

  it("성장 여지가 거의 없으면 첫 훈련도 효과가 작고 상한을 넘지 않는다", () => {
    const result = applyStaffTraining(
      makeStaff({ ability: 99.8, potentialCap: 100 }),
      "leadership-workshop",
    );
    expect(result.abilityGain).toBeLessThan(0.1);
    expect(result.afterAbility).toBeLessThanOrEqual(100);
  });

  it("잠재 상한에 도달해도 참여 횟수는 기록되고 능력은 오르지 않는다", () => {
    const result = applyStaffTraining(
      makeStaff({ ability: 70, potentialCap: 70 }),
      "film-study",
    );
    expect(result.abilityGain).toBe(0);
    expect(result.staff.ability).toBe(70);
    expect(result.staff.trainingCounts?.["film-study"]).toBe(1);
  });
});
