import { useEffect, useRef } from "react";
import { GAME_BALANCE } from "@/data/balance";
import { getSupabaseClient } from "@/lib/supabase";
import { albumVanillaStore } from "@/stores/albumStore";
import { calendarVanillaStore } from "@/stores/calendarStore";
import { competitorVanillaStore } from "@/stores/competitorStore";
import { eventVanillaStore } from "@/stores/eventStore";
import { fandomVanillaStore } from "@/stores/fandomStore";
import { calculateWeeklyFixedTotal, financeVanillaStore } from "@/stores/financeStore";
import { gameVanillaStore, useGameStore } from "@/stores/gameStore";
import { staffVanillaStore } from "@/stores/staffStore";
import { traineeVanillaStore } from "@/stores/traineeStore";
import type {
  AlbumStoreState,
  CalendarStoreState,
  CompetitorStoreState,
  EventStoreState,
  FandomStoreState,
  FinanceStoreState,
  GameStoreState,
  GamePhase,
  StaffStoreState,
  TraineeStoreState,
} from "@/types/game";

export const MAX_SAVE_SLOTS = 3;
export const AUTO_SAVE_INTERVAL_WEEKS = 5;
export const DEFAULT_AUTO_SAVE_SLOT = 1;

export interface GameStateSnapshot {
  gameStore: GameStoreState;
  traineeStore: TraineeStoreState;
  staffStore: StaffStoreState;
  albumStore: AlbumStoreState;
  fandomStore: FandomStoreState;
  competitorStore: CompetitorStoreState;
  financeStore: FinanceStoreState;
  calendarStore: CalendarStoreState;
  eventStore: EventStoreState;
}

export interface SaveSlotSummary {
  slotNumber: number;
  saveName: string | null;
  groupName: string | null;
  companyName: string | null;
  playedWeeks: number | null;
  currentPhase: GamePhase | null;
  updatedAt: string | null;
  hasData: boolean;
}

interface SaveRow {
  slot_number: number;
  save_data: unknown;
  save_name: string;
  played_weeks: number;
  current_phase: GamePhase;
  group_name: string;
  updated_at: string;
}

function assertValidSlotNumber(slotNumber: number) {
  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > MAX_SAVE_SLOTS) {
    throw new Error(`slotNumber must be an integer between 1 and ${MAX_SAVE_SLOTS}.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function serializeGameState(gameState: GameStateSnapshot) {
  return JSON.parse(JSON.stringify(gameState)) as GameStateSnapshot;
}

function deserializeGameState(value: unknown): GameStateSnapshot {
  if (!isRecord(value)) {
    throw new Error("Save data is malformed.");
  }

  const requiredStores: Array<keyof GameStateSnapshot> = [
    "gameStore",
    "traineeStore",
    "staffStore",
    "albumStore",
    "fandomStore",
    "competitorStore",
    "financeStore",
    "calendarStore",
    "eventStore",
  ];

  for (const storeKey of requiredStores) {
    if (!isRecord(value[storeKey])) {
      throw new Error(`Save data is missing ${storeKey}.`);
    }
  }

  return value as unknown as GameStateSnapshot;
}

function readSavedCompanyName(saveData: unknown) {
  if (!isRecord(saveData) || !isRecord(saveData.gameStore)) {
    return null;
  }

  const companyName = saveData.gameStore.companyName;
  return typeof companyName === "string" ? companyName : null;
}

function extractGameStoreState(): GameStoreState {
  const {
    advanceWeek: _advanceWeek,
    addNotification: _addNotification,
    clearNotifications: _clearNotifications,
    setTrainingSchedule: _setTrainingSchedule,
    ...state
  } = gameVanillaStore.getState();

  return state;
}

function extractTraineeStoreState(): TraineeStoreState {
  const {
    addTrainee: _addTrainee,
    removeTrainee: _removeTrainee,
    updateStats: _updateStats,
    updateCondition: _updateCondition,
    assignPosition: _assignPosition,
    updateChemistry: _updateChemistry,
    updateSatisfaction: _updateSatisfaction,
    ...state
  } = traineeVanillaStore.getState();

  return state;
}

function extractStaffStoreState(): StaffStoreState {
  const {
    hireStaff: _hireStaff,
    fireStaff: _fireStaff,
    ...state
  } = staffVanillaStore.getState();

  return state;
}

function extractAlbumStoreState(): AlbumStoreState {
  const {
    startAlbum: _startAlbum,
    updateProgress: _updateProgress,
    selectTitleTrack: _selectTitleTrack,
    releaseAlbum: _releaseAlbum,
    addToHistory: _addToHistory,
    ...state
  } = albumVanillaStore.getState();

  return state;
}

function extractFandomStoreState(): FandomStoreState {
  const {
    updatePublic: _updatePublic,
    updateFandom: _updateFandom,
    updateGlobal: _updateGlobal,
    updateIndustry: _updateIndustry,
    updateCharts: _updateCharts,
    addDisappointment: _addDisappointment,
    resetRevenue: _resetRevenue,
    ...state
  } = fandomVanillaStore.getState();

  return state;
}

function extractCompetitorStoreState(): CompetitorStoreState {
  const {
    addPermanentRival: _addPermanentRival,
    updateRival: _updateRival,
    spawnEventRival: _spawnEventRival,
    removeEventRival: _removeEventRival,
    ...state
  } = competitorVanillaStore.getState();

  return state;
}

function extractFinanceStoreState(): FinanceStoreState {
  const {
    addMoney: _addMoney,
    subtractMoney: _subtractMoney,
    updateFixedCosts: _updateFixedCosts,
    upgrade: _upgrade,
    recordIncome: _recordIncome,
    recordExpense: _recordExpense,
    ...state
  } = financeVanillaStore.getState();

  return state;
}

function extractCalendarStoreState(): CalendarStoreState {
  const {
    updateSeason: _updateSeason,
    addNews: _addNews,
    updateTrend: _updateTrend,
    updateComebacks: _updateComebacks,
    ...state
  } = calendarVanillaStore.getState();

  return state;
}

function extractEventStoreState(): EventStoreState {
  const {
    addEvent: _addEvent,
    resolveEvent: _resolveEvent,
    startInterlude: _startInterlude,
    endInterlude: _endInterlude,
    ...state
  } = eventVanillaStore.getState();

  return state;
}

export function captureGameState(): GameStateSnapshot {
  return serializeGameState({
    gameStore: extractGameStoreState(),
    traineeStore: extractTraineeStoreState(),
    staffStore: extractStaffStoreState(),
    albumStore: extractAlbumStoreState(),
    fandomStore: extractFandomStoreState(),
    competitorStore: extractCompetitorStoreState(),
    financeStore: extractFinanceStoreState(),
    calendarStore: extractCalendarStoreState(),
    eventStore: extractEventStoreState(),
  });
}

export function hydrateGameState(gameState: GameStateSnapshot) {
  const { gameSpeed: _legacyGameSpeed, ...rest } =
    gameState.gameStore as GameStoreState & { gameSpeed?: unknown };
  // 필드가 없는 구버전 세이브는 여기서 기본값으로 보완한다. setState(merge)에
  // 맡기면 직전에 플레이하던 다른 세이브의 값이 새어 들어올 수 있다.
  const gameStore: GameStoreState = {
    ...rest,
    trainingSchedule: rest.trainingSchedule ?? {
      intensity: "normal",
      focus: null,
      restDay: false,
    },
    investorConditionProgress: rest.investorConditionProgress ?? {},
    investorPressureWeeks: rest.investorPressureWeeks ?? 0,
    investorComplianceCount: rest.investorComplianceCount ?? 0,
    awardHistory: rest.awardHistory ?? [],
  };

  gameVanillaStore.setState(gameStore, false);
  traineeVanillaStore.setState(gameState.traineeStore, false);
  staffVanillaStore.setState(gameState.staffStore, false);
  albumVanillaStore.setState(gameState.albumStore, false);
  fandomVanillaStore.setState(gameState.fandomStore, false);
  competitorVanillaStore.setState(gameState.competitorStore, false);
  // Older saves stored weeklyFixedTotal as the raw monthly sum — always rederive it from fixedCosts.
  financeVanillaStore.setState(
    {
      ...gameState.financeStore,
      weeklyFixedTotal: calculateWeeklyFixedTotal(gameState.financeStore.fixedCosts),
    },
    false,
  );
  calendarVanillaStore.setState(gameState.calendarStore, false);
  eventVanillaStore.setState(gameState.eventStore, false);
}

export async function saveGame(
  userId: string,
  slotNumber: number,
  gameState: GameStateSnapshot,
) {
  assertValidSlotNumber(slotNumber);

  const supabase = getSupabaseClient();
  const serializableState = serializeGameState(gameState);
  const {
    currentWeek,
    currentYear,
    currentPhase,
    groupName,
  } = serializableState.gameStore;
  const playedWeeks =
    (currentYear - 1) * GAME_BALANCE.weeksPerYear + currentWeek;
  const saveName = `${groupName} - Y${currentYear} W${currentWeek}`;

  const { data, error } = await supabase
    .from("saves")
    .upsert(
      {
        user_id: userId,
        slot_number: slotNumber,
        save_data: serializableState,
        save_name: saveName,
        played_weeks: playedWeeks,
        current_phase: currentPhase,
        group_name: groupName,
      },
      {
        onConflict: "user_id,slot_number",
      },
    )
    .select(
      "slot_number, save_name, played_weeks, current_phase, group_name, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function loadGame(userId: string, slotNumber: number) {
  assertValidSlotNumber(slotNumber);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("saves")
    .select("save_data")
    .eq("user_id", userId)
    .eq("slot_number", slotNumber)
    .maybeSingle<Pick<SaveRow, "save_data">>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const gameState = deserializeGameState(data.save_data);
  hydrateGameState(gameState);

  return gameState;
}

export async function listSaves(userId: string): Promise<SaveSlotSummary[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("saves")
    .select(
      "slot_number, save_data, save_name, played_weeks, current_phase, group_name, updated_at",
    )
    .eq("user_id", userId)
    .order("slot_number", { ascending: true })
    .returns<SaveRow[]>();

  if (error) {
    throw error;
  }

  const rowsBySlot = new Map(data.map((row) => [row.slot_number, row]));

  return Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => {
    const slotNumber = index + 1;
    const row = rowsBySlot.get(slotNumber);

    return {
      slotNumber,
      saveName: row?.save_name ?? null,
      groupName: row?.group_name ?? null,
      companyName: row ? readSavedCompanyName(row.save_data) : null,
      playedWeeks: row?.played_weeks ?? null,
      currentPhase: row?.current_phase ?? null,
      updatedAt: row?.updated_at ?? null,
      hasData: Boolean(row),
    };
  });
}

// Call this only after the UI has explicitly confirmed deletion.
export async function deleteSave(userId: string, slotNumber: number) {
  assertValidSlotNumber(slotNumber);

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("saves")
    .delete()
    .eq("user_id", userId)
    .eq("slot_number", slotNumber);

  if (error) {
    throw error;
  }
}

export async function autoSave(
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
  gameState = captureGameState(),
) {
  if (gameState.gameStore.currentWeek % AUTO_SAVE_INTERVAL_WEEKS !== 0) {
    return null;
  }

  return saveGame(userId, slotNumber, gameState);
}

export function useAutoSave(
  userId: string | null,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const previousWeekRef = useRef(currentWeek);

  useEffect(() => {
    const previousWeek = previousWeekRef.current;
    previousWeekRef.current = currentWeek;

    if (!userId || previousWeek === currentWeek) {
      return;
    }

    void autoSave(userId, slotNumber).catch((error: unknown) => {
      console.error("Auto-save failed.", error);
    });
  }, [currentWeek, slotNumber, userId]);
}
