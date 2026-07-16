import { createSeededRandom } from "@/lib/seededRandom";

export type PacingBeatKind = "personal" | "rival" | "public-evaluation";

interface PacingBeatDefinition {
  kind: PacingBeatKind;
  eventId: string;
  window: readonly [number, number];
}

export interface DirectedPacingBeat extends PacingBeatDefinition {
  targetWeek: number;
}

const DEBUT_PACING_BEATS: PacingBeatDefinition[] = [
  { kind: "personal", eventId: "debut-personal-strength", window: [2, 4] },
  { kind: "rival", eventId: "debut-rival-arrival", window: [8, 12] },
  {
    kind: "public-evaluation",
    eventId: "debut-public-evaluation",
    window: [12, 16],
  },
];

function beatTargetWeek(
  beat: PacingBeatDefinition,
  projectSeed: number,
  index: number,
): number {
  const random = createSeededRandom(projectSeed + index * 101);
  const [min, max] = beat.window;
  return min + Math.floor(random() * (max - min + 1));
}

/** 확률 풀 위에서 첫 순간의 최대 지연만 보장하는 결정론적 감독 레이어. */
export function directDebutPacing(
  relativeWeek: number,
  emittedEventIds: ReadonlySet<string>,
  projectSeed: number,
): DirectedPacingBeat[] {
  return DEBUT_PACING_BEATS.flatMap((beat, index) => {
    if (emittedEventIds.has(beat.eventId)) return [];
    const targetWeek = beatTargetWeek(beat, projectSeed, index);
    return relativeWeek >= targetWeek ? [{ ...beat, targetWeek }] : [];
  });
}
