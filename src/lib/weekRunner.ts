import { processWeek, type GameSnapshot, type PlayerDecisions } from "@/systems/weekProcessor";
import { captureGameState, hydrateGameState } from "@/lib/saveSystem";
import { eventVanillaStore } from "@/stores/eventStore";
import type { GameEvent } from "@/types/game";

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
  const nextSnapshot = applyEffects(snapshot, effects);

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

function applyEffects(
  snapshot: GameSnapshot,
  effects: Record<string, number>,
): GameSnapshot {
  let money = snapshot.finance.money;
  let publicScore = snapshot.fandom.public;
  let fandom = snapshot.fandom.fandom;
  let fandomLoyalty = snapshot.fandom.fandomLoyalty;
  let fandomDisappointment = snapshot.fandom.fandomDisappointment;
  let global = snapshot.fandom.global;
  let industry = snapshot.fandom.industry;
  let investorPenaltyActive = snapshot.game.investorPenaltyActive;
  let currentAlbum = snapshot.album.currentAlbum
    ? {
        ...snapshot.album.currentAlbum,
        progress: { ...snapshot.album.currentAlbum.progress },
      }
    : null;
  let trainees = snapshot.trainee.trainees.map((trainee) => ({
    ...trainee,
    stats: { ...trainee.stats },
    chemistry: { ...trainee.chemistry },
  }));

  for (const [key, value] of Object.entries(effects)) {
    if (key === "money") money += value;
    if (key === "public") publicScore = clamp(publicScore + value, 0, 100);
    if (key === "fandom") fandom = Math.max(0, fandom + value);
    if (key === "fandomLoyalty") {
      fandomLoyalty = clamp(fandomLoyalty + value, 0, 100);
    }
    if (key === "fandomDisappointment") {
      fandomDisappointment = clamp(fandomDisappointment + value, 0, 100);
    }
    if (key === "global") global = Math.max(0, global + value);
    if (key === "industry") industry = clamp(industry + value, 0, 100);
    if (key === "investorPressure") investorPenaltyActive = value > 0;

    if (key === "condition" || key === "stress" || key === "satisfaction") {
      trainees = trainees.map((trainee) => ({
        ...trainee,
        [key]: clamp(trainee[key] + value, 0, 100),
      }));
    }

    if (key === "chemistry") {
      trainees = trainees.map((trainee) => ({
        ...trainee,
        chemistry: Object.fromEntries(
          Object.entries(trainee.chemistry).map(([targetId, chemistry]) => [
            targetId,
            clamp(chemistry + value, -100, 100),
          ]),
        ),
      }));
    }

    if (
      key === "visual" ||
      key === "vocal" ||
      key === "dance" ||
      key === "charm" ||
      key === "stamina" ||
      key === "mental"
    ) {
      trainees = trainees.map((trainee) => ({
        ...trainee,
        stats: {
          ...trainee.stats,
          [key]: clamp(trainee.stats[key] + value, 0, 100),
        },
      }));
    }

    if (currentAlbum) {
      if (key === "albumSong" || key === "song") {
        currentAlbum.progress.song = clamp(currentAlbum.progress.song + value, 0, 100);
      }
      if (key === "choreography") {
        currentAlbum.progress.choreography = clamp(
          currentAlbum.progress.choreography + value,
          0,
          100,
        );
      }
      if (key === "albumVisual") {
        currentAlbum.progress.visual = clamp(
          currentAlbum.progress.visual + value,
          0,
          100,
        );
      }
      if (key === "marketing") {
        currentAlbum.progress.marketing = clamp(
          currentAlbum.progress.marketing + value,
          0,
          100,
        );
      }
    }
  }

  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      investorPenaltyActive,
    },
    trainee: {
      ...snapshot.trainee,
      trainees,
    },
    album: {
      ...snapshot.album,
      currentAlbum,
    },
    fandom: {
      ...snapshot.fandom,
      public: publicScore,
      fandom,
      fandomLoyalty,
      fandomDisappointment,
      global,
      industry,
    },
    finance: {
      ...snapshot.finance,
      money,
    },
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
