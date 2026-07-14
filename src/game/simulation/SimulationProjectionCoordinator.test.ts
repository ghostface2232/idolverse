import { describe, expect, it } from "vitest";
import { activityToSimulationRoom, buildSimulationProjection } from "@/game/simulation/SimulationProjectionCoordinator";
import { makeTrainee } from "@/test/gameStateFixture";
import type { FinanceStoreState } from "@/types/game";

const upgrades: FinanceStoreState["upgrades"] = {
  dormLevel: 2,
  studioLevel: 3,
  equipmentLevel: 1,
  livingExpenseLevel: 1,
  hasHealthcare: false,
  hasSecurity: false,
};

describe("SimulationProjection", () => {
  it("maps activities to one canonical room contract", () => {
    expect(activityToSimulationRoom("training")).toBe("practice");
    expect(activityToSimulationRoom("vacation")).toBe("dorm");
    expect(activityToSimulationRoom("entertainment")).toBe("external");
    expect(activityToSimulationRoom(null)).toBe("office");
  });

  it("exposes only presentation bands and facility availability", () => {
    const trainee = {
      ...makeTrainee("trainee-1", { name: "하린" }),
      currentActivity: "entertainment" as const,
      condition: 35,
      mood: 72,
      injuryWeeks: 1,
    };
    const projection = buildSimulationProjection([trainee], upgrades, 4);

    expect(projection.revision).toBe(4);
    expect(projection.rooms).toEqual([
      { id: "practice", unlocked: true, level: 3 },
      { id: "dorm", unlocked: true, level: 2 },
      { id: "office", unlocked: true, level: 1 },
    ]);
    expect(projection.entities[0]).toMatchObject({
      id: "trainee-1",
      roomId: null,
      visible: false,
      injured: true,
      conditionBand: "low",
      moodBand: "high",
    });
  });
});
