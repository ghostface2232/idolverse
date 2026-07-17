import {
  FANDOM_DISAPPOINTMENT_COMMERCIAL,
  FANDOM_DISAPPOINTMENT_CONCEPT_BREAK,
  FANDOM_DISAPPOINTMENT_SCANDAL,
  FANDOM_LEAVE_THRESHOLD,
  PUBLIC_DECAY_RATE,
} from "@/data/balance";
import type { Nationality, Trainee } from "@/types/game";

export interface Fandom4Axis {
  public: number;
  fandom: number;
  fandomLoyalty: number;
  fandomDisappointment: number;
  global: number;
  industry: number;
}

export interface WeeklyFandomContext {
  hadVarietyAppearance: boolean;
  hadViralEvent: boolean;
  chartRank: number | null;
  isActive: boolean;
  albumReleaseThisWeek: boolean;
  concertThisWeek: boolean;
  fanServiceThisWeek: boolean;
  scandalThisWeek: boolean;
  conceptBreakThisWeek: boolean;
  excessiveCommercial: boolean;
  spotifyStreaming: boolean;
  youtubeActivity: boolean;
  overseasPromotion: boolean;
  foreignMembers: readonly Trainee[];
  musicQualityHigh: boolean;
  stageExcellent: boolean;
  awardWin: boolean;
  qualityDecline: boolean;
}

export interface FandomUpdateResult {
  axis: Fandom4Axis;
  publicDelta: number;
  fandomDelta: number;
  globalDelta: number;
  industryDelta: number;
  disappointmentDelta: number;
  crisis: boolean;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function updateFandom(
  current: Fandom4Axis,
  ctx: WeeklyFandomContext,
): FandomUpdateResult {
  let pDelta = 0;
  let fDelta = 0;
  let gDelta = 0;
  let iDelta = 0;
  let dDelta = 0;

  if (ctx.hadVarietyAppearance) pDelta += 4;
  if (ctx.hadViralEvent) pDelta += 8;
  if (ctx.chartRank !== null && ctx.chartRank <= 10) pDelta += 3;
  if (ctx.chartRank !== null && ctx.chartRank <= 3) pDelta += 5;
  if (!ctx.isActive) pDelta += PUBLIC_DECAY_RATE;

  if (ctx.albumReleaseThisWeek) fDelta += 8;
  if (ctx.concertThisWeek) fDelta += 6;
  if (ctx.fanServiceThisWeek) fDelta += 3;

  if (ctx.scandalThisWeek) dDelta += FANDOM_DISAPPOINTMENT_SCANDAL;
  if (ctx.conceptBreakThisWeek) dDelta += FANDOM_DISAPPOINTMENT_CONCEPT_BREAK;
  if (ctx.excessiveCommercial) dDelta += FANDOM_DISAPPOINTMENT_COMMERCIAL;

  if (ctx.spotifyStreaming) gDelta += 2;
  if (ctx.youtubeActivity) gDelta += 2;
  if (ctx.overseasPromotion) gDelta += 4;

  const foreignBonus = computeForeignMemberBonus(ctx.foreignMembers);
  gDelta += foreignBonus;

  if (ctx.musicQualityHigh) iDelta += 3;
  if (ctx.stageExcellent) iDelta += 4;
  if (ctx.awardWin) iDelta += 6;
  if (ctx.scandalThisWeek) iDelta -= 5;
  if (ctx.qualityDecline) iDelta -= 3;

  const newDisappointment = clamp(current.fandomDisappointment + dDelta, 0, 100);

  const disappointmentDrain =
    newDisappointment > FANDOM_LEAVE_THRESHOLD ? Math.round((newDisappointment - FANDOM_LEAVE_THRESHOLD) * 0.3) : 0;
  fDelta -= disappointmentDrain;

  const axis: Fandom4Axis = {
    public: clamp(current.public + pDelta, 0, 100),
    fandom: Math.max(0, current.fandom + fDelta),
    fandomLoyalty: clamp(
      current.fandomLoyalty - disappointmentDrain * 0.5,
      0,
      100,
    ),
    fandomDisappointment: newDisappointment,
    global: Math.max(0, current.global + gDelta),
    industry: clamp(current.industry + iDelta, 0, 100),
  };

  const crisis = newDisappointment > FANDOM_LEAVE_THRESHOLD;

  return {
    axis,
    publicDelta: pDelta,
    fandomDelta: fDelta,
    globalDelta: gDelta,
    industryDelta: iDelta,
    disappointmentDelta: dDelta,
    crisis,
  };
}

function computeForeignMemberBonus(members: readonly Trainee[]): number {
  if (members.length === 0) return 0;

  const regionMap: Record<string, number> = {};
  for (const m of members) {
    const region = nationalityToRegion(m.nationality);
    if (region) {
      regionMap[region] = (regionMap[region] ?? 0) + 1;
    }
  }

  let bonus = 0;
  if (regionMap["japan"]) bonus += 2;
  if (regionMap["china"]) bonus += 2;
  if (regionMap["sea"]) bonus += 1;
  if (regionMap["western"]) bonus += 3;

  return bonus;
}

function nationalityToRegion(
  nat: Nationality,
): string | null {
  switch (nat) {
    case "japanese":
      return "japan";
    case "chinese":
      return "china";
    case "thai":
      return "sea";
    case "american":
      return "western";
    case "other":
      return "western";
    default:
      return null;
  }
}

export interface FandomCrisisEffect {
  fandomLoss: number;
  loyaltyLoss: number;
  description: string;
}

export function checkFandomCrisis(axis: Fandom4Axis): FandomCrisisEffect | null {
  if (axis.fandomDisappointment <= FANDOM_LEAVE_THRESHOLD) return null;

  const severity = axis.fandomDisappointment - FANDOM_LEAVE_THRESHOLD;
  const fandomLoss = Math.round(severity * 0.5);
  const loyaltyLoss = Math.round(severity * 0.3);

  return {
    fandomLoss,
    loyaltyLoss,
    description: "팬들의 실망이 크게 쌓였습니다. 팬카페 이탈과 음반 구매 감소가 이어지고 있습니다.",
  };
}

export function calculateRecoveryRate(currentDisappointment: number): number {
  return Math.max(1, Math.round(currentDisappointment * 0.08));
}
