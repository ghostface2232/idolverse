import { processWeek, type GameSnapshot, type PlayerDecisions } from "@/systems/weekProcessor";
import { applyEffects } from "@/systems/applyEffects";
import { captureGameState, hydrateGameState } from "@/lib/saveSystem";
import { eventVanillaStore } from "@/stores/eventStore";
import type { EffectMap, GameEvent } from "@/types/game";

export function buildGameSnapshot(): GameSnapshot {
  const snapshot = captureGameState();

  return {
    game: snapshot.gameStore,
    trainee: snapshot.traineeStore,
    staff: snapshot.staffStore,
    album: snapshot.albumStore,
    fandom: snapshot.fandomStore,
    competitor: snapshot.competitorStore,
    finance: snapshot.financeStore,
    calendar: snapshot.calendarStore,
    event: snapshot.eventStore,
  };
}

export function applyGameSnapshot(snapshot: GameSnapshot) {
  hydrateGameState({
    gameStore: snapshot.game,
    traineeStore: snapshot.trainee,
    staffStore: snapshot.staff,
    albumStore: snapshot.album,
    fandomStore: snapshot.fandom,
    competitorStore: snapshot.competitor,
    financeStore: snapshot.finance,
    calendarStore: snapshot.calendar,
    eventStore: snapshot.event,
  });
}

export function runWeek(decisions: PlayerDecisions) {
  const snapshot = buildGameSnapshot();
  const result = processWeek(snapshot, decisions);

  applyGameSnapshot(result.newState);

  return result.weekReport;
}

export function applyEventChoice(event: GameEvent, choiceIndex: number) {
  const choice = event.choices?.[choiceIndex] ?? null;
  const snapshot = buildGameSnapshot();
  const effects = choice?.effects ?? {};
  const nextSnapshot = applySnapshotEffects(snapshot, effects);

  applyGameSnapshot({
    ...nextSnapshot,
    event: {
      ...nextSnapshot.event,
      pendingEvents: nextSnapshot.event.pendingEvents.map((pendingEvent) =>
        pendingEvent.id === event.id
          ? {
              ...pendingEvent,
              resolved: true,
            }
          : pendingEvent,
      ),
    },
  });

  eventVanillaStore.getState().resolveEvent(event.id);

  return {
    effects,
    choice,
  };
}

function applySnapshotEffects(
  snapshot: GameSnapshot,
  effects: EffectMap,
): GameSnapshot {
  const result = applyEffects(
    {
      money: snapshot.finance.money,
      fandom: {
        public: snapshot.fandom.public,
        fandom: snapshot.fandom.fandom,
        fandomLoyalty: snapshot.fandom.fandomLoyalty,
        fandomDisappointment: snapshot.fandom.fandomDisappointment,
        global: snapshot.fandom.global,
        industry: snapshot.fandom.industry,
      },
      trainees: snapshot.trainee.trainees,
      album: snapshot.album.currentAlbum,
      investorPressureWeeks: snapshot.game.investorPressureWeeks ?? 0,
    },
    effects,
  );

  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      investorPressureWeeks: result.investorPressureWeeks,
      // 이벤트발 압박이 걸리면 즉시 압박 상태로 표시한다. 해제는
      // weekProcessor가 조건 미달 여부·남은 압박 주 수로 매주 재계산한다.
      investorPenaltyActive:
        snapshot.game.investorPenaltyActive || result.investorPressureWeeks > 0,
    },
    trainee: {
      ...snapshot.trainee,
      trainees: result.trainees,
    },
    album: {
      ...snapshot.album,
      currentAlbum: result.album,
    },
    fandom: {
      ...snapshot.fandom,
      ...result.fandom,
    },
    finance: {
      ...snapshot.finance,
      money: result.money,
    },
  };
}
