import { RANDOM_EVENT_POOL } from "@/data/events";
import { createSeededRandom } from "@/lib/seededRandom";
import type {
  EventChoice,
  GameEvent,
  GamePhase,
  RandomEventTemplate,
  Season,
  Trainee,
} from "@/types/game";

export interface EventContext {
  currentWeek: number;
  currentPhase: GamePhase;
  season: Season;
  public: number;
  fandom: number;
  global: number;
  industry: number;
  hasSecurity: boolean;
  trainees: readonly Trainee[];
}

export interface RolledEvent {
  template: RandomEventTemplate;
  gameEvent: GameEvent;
}

export function rollRandomEvents(
  ctx: EventContext,
  seed: number,
): RolledEvent[] {
  const random = createSeededRandom(seed);
  const results: RolledEvent[] = [];

  for (const template of RANDOM_EVENT_POOL) {
    if (!matchesConditions(template, ctx)) continue;

    let probability = template.probability;

    if (ctx.hasSecurity && isSecurityReducible(template.id)) {
      probability *= 0.5;
    }

    if (random() < probability) {
      results.push({
        template,
        gameEvent: {
          id: `event-${template.id}-w${ctx.currentWeek}`,
          type: mapEventType(template.type),
          tone: template.type,
          title: template.title,
          description: template.description,
          choices: template.choices,
          resolved: false,
        },
      });
    }
  }

  return results;
}

function matchesConditions(
  template: RandomEventTemplate,
  ctx: EventContext,
): boolean {
  const c = template.conditions;

  if (c.phase) {
    const phases = Array.isArray(c.phase) ? c.phase : [c.phase];
    if (!phases.includes(ctx.currentPhase)) return false;
  }

  if (c.minWeek !== undefined && ctx.currentWeek < c.minWeek) return false;
  if (c.maxWeek !== undefined && ctx.currentWeek > c.maxWeek) return false;
  if (c.minFame !== undefined && ctx.public < c.minFame) return false;
  if (c.minPublic !== undefined && ctx.public < c.minPublic) return false;
  if (c.minFandom !== undefined && ctx.fandom < c.minFandom) return false;
  if (c.minGlobal !== undefined && ctx.global < c.minGlobal) return false;
  if (c.minIndustry !== undefined && ctx.industry < c.minIndustry) return false;

  if (c.minStress !== undefined) {
    const maxStress = Math.max(...ctx.trainees.map((t) => t.stress));
    if (maxStress < c.minStress) return false;
  }

  if (c.maxSatisfaction !== undefined) {
    const minSat = Math.min(...ctx.trainees.map((t) => t.satisfaction));
    if (minSat > c.maxSatisfaction) return false;
  }

  if (c.requiresVacation) {
    const anyOnVacation = ctx.trainees.some((t) => t.currentActivity === "vacation");
    if (!anyOnVacation) return false;
  }

  if (c.requiresSecurity === false && ctx.hasSecurity) return false;

  if (c.lowChemistryPair) {
    if (!hasLowChemistryPair(ctx.trainees)) return false;
  }

  return true;
}

function hasLowChemistryPair(trainees: readonly Trainee[]): boolean {
  for (let i = 0; i < trainees.length; i++) {
    for (let j = i + 1; j < trainees.length; j++) {
      const chem = trainees[i].chemistry[trainees[j].id] ?? 0;
      if (chem < -50) return true;
    }
  }
  return false;
}

const SECURITY_REDUCIBLE_EVENTS = new Set([
  "sasaeng-issue",
  "malicious-rumor",
  "dating-scandal",
  "sns-controversy",
]);

function isSecurityReducible(eventId: string): boolean {
  return SECURITY_REDUCIBLE_EVENTS.has(eventId);
}

function mapEventType(tone: string): "training" | "member" | "scandal" | "market" | "system" {
  switch (tone) {
    case "negative":
      return "scandal";
    case "positive":
      return "market";
    default:
      return "system";
  }
}

export function resolveEvent(
  event: GameEvent,
  choiceIndex: number,
): { effects: Record<string, number>; resolved: GameEvent } {
  const choice = event.choices?.[choiceIndex];
  const effects = choice?.effects ?? {};

  return {
    effects,
    resolved: { ...event, resolved: true },
  };
}

export function rollVacationScandal(
  trainees: readonly Trainee[],
  hasSecurity: boolean,
  seed: number,
): { traineeId: string; traineeName: string } | null {
  const onVacation = trainees.filter((t) => t.currentActivity === "vacation");
  if (onVacation.length === 0) return null;

  const random = createSeededRandom(seed);
  const baseProbability = 0.10;
  const probability = hasSecurity ? baseProbability * 0.5 : baseProbability;

  for (const t of onVacation) {
    if (random() < probability) {
      return { traineeId: t.id, traineeName: t.name };
    }
  }

  return null;
}
