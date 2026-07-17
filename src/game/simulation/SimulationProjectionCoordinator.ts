import { SIMULATION_ROOM_IDS } from "@/data/simulationWorld";
import { financeVanillaStore } from "@/stores/financeStore";
import { gameVanillaStore } from "@/stores/gameStore";
import { traineeVanillaStore } from "@/stores/traineeStore";
import type {
  FinanceStoreState,
  GroupGender,
  Trainee,
  TraineeActivity,
} from "@/types/game";

export type SimulationRoomId =
  | (typeof SIMULATION_ROOM_IDS)[number]
  | "external";
export type SimulationBand = "low" | "mid" | "high";

export interface RoomProjection {
  id: Exclude<SimulationRoomId, "external">;
  unlocked: boolean;
  level: number;
}

export interface SimulationEntityProjection {
  id: string;
  roomId: Exclude<SimulationRoomId, "external"> | null;
  activity: TraineeActivity;
  injured: boolean;
  conditionBand: SimulationBand;
  moodBand: SimulationBand;
  visible: boolean;
}

export interface SimulationProjection {
  revision: number;
  groupGender: GroupGender;
  rooms: RoomProjection[];
  entities: SimulationEntityProjection[];
}

type Upgrades = FinanceStoreState["upgrades"];
type ProjectionListener = (projection: SimulationProjection) => void;

export function activityToSimulationRoom(
  activity: TraineeActivity,
): SimulationRoomId {
  if (activity === "training" || activity === "individual") return "practice";
  if (activity === "rest" || activity === "vacation") return "dorm";
  if (activity === "entertainment") return "external";
  return "office";
}

export function buildSimulationProjection(
  trainees: Trainee[],
  upgrades: Upgrades,
  revision: number,
  groupGender: GroupGender = gameVanillaStore.getState().groupGender,
): SimulationProjection {
  return {
    revision,
    groupGender,
    rooms: [
      { id: "practice", unlocked: upgrades.studioLevel >= 1, level: upgrades.studioLevel },
      { id: "dorm", unlocked: upgrades.dormLevel >= 1, level: upgrades.dormLevel },
      { id: "office", unlocked: true, level: upgrades.equipmentLevel },
    ],
    entities: trainees.map((trainee) => {
      const roomId = activityToSimulationRoom(trainee.currentActivity);
      return {
        id: trainee.id,
        roomId: roomId === "external" ? null : roomId,
        activity: trainee.currentActivity,
        injured: trainee.injuryWeeks > 0,
        conditionBand: toBand(trainee.condition),
        moodBand: toBand(trainee.mood),
        visible: roomId !== "external",
      };
    }),
  };
}

class SimulationProjectionCoordinator {
  private listeners = new Set<ProjectionListener>();
  private storeUnsubscribers: Array<() => void> = [];
  private projection = buildSimulationProjection(
    traineeVanillaStore.getState().trainees,
    financeVanillaStore.getState().upgrades,
    0,
    gameVanillaStore.getState().groupGender,
  );

  getSnapshot = () => this.projection;

  subscribe = (listener: ProjectionListener) => {
    this.listeners.add(listener);
    this.start();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  };

  private start() {
    if (this.storeUnsubscribers.length > 0) return;

    const refresh = () => this.refresh();
    this.storeUnsubscribers = [
      traineeVanillaStore.subscribe(refresh),
      financeVanillaStore.subscribe(refresh),
      gameVanillaStore.subscribe(refresh),
    ];
    this.refresh();
  }

  private stop() {
    this.storeUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.storeUnsubscribers = [];
  }

  private refresh() {
    const next = buildSimulationProjection(
      traineeVanillaStore.getState().trainees,
      financeVanillaStore.getState().upgrades,
      this.projection.revision + 1,
      gameVanillaStore.getState().groupGender,
    );
    if (sameProjection(this.projection, next)) return;

    this.projection = next;
    this.listeners.forEach((listener) => listener(next));
  }
}

function toBand(value: number): SimulationBand {
  if (value < 40) return "low";
  if (value < 70) return "mid";
  return "high";
}

function sameProjection(current: SimulationProjection, next: SimulationProjection) {
  if (current.groupGender !== next.groupGender) return false;
  if (current.rooms.length !== next.rooms.length) return false;
  if (current.entities.length !== next.entities.length) return false;

  const sameRooms = current.rooms.every((room, index) => {
    const candidate = next.rooms[index];
    return room.id === candidate.id && room.unlocked === candidate.unlocked && room.level === candidate.level;
  });
  if (!sameRooms) return false;

  return current.entities.every((entity, index) => {
    const candidate = next.entities[index];
    return entity.id === candidate.id
      && entity.roomId === candidate.roomId
      && entity.activity === candidate.activity
      && entity.injured === candidate.injured
      && entity.conditionBand === candidate.conditionBand
      && entity.moodBand === candidate.moodBand
      && entity.visible === candidate.visible;
  });
}

export const simulationProjectionCoordinator = new SimulationProjectionCoordinator();
