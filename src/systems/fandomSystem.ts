import {
  AUDIENCE_QUALITY_RETENTION,
  FANDOM_DISAPPOINTMENT_COMMERCIAL,
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
  albumSalesRank?: number | null;
  isActive: boolean;
  albumReleaseThisWeek: boolean;
  concertThisWeek: boolean;
  fanServiceThisWeek: boolean;
  scandalThisWeek: boolean;
  // 컨셉 급변의 팬덤 대가는 발매 평가(albumSystem의 fandomExpectation)가
  // 이미 치르게 한다 — 별도 conceptBreak 플래그는 이중 페널티라 제거했다.
  excessiveCommercial: boolean;
  /** global 지표(0~100) 기준의 해외 활동성 — 문턱은 GLOBAL_ENGAGEMENT_THRESHOLDS. */
  spotifyStreaming: boolean;
  youtubeActivity: boolean;
  foreignMembers: readonly Trainee[];
  latestAlbumQuality: number;
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
  if (ctx.isActive && ctx.chartRank !== null && ctx.chartRank <= 10) pDelta += 2;
  if (ctx.isActive && ctx.chartRank !== null && ctx.chartRank <= 3) pDelta += 2;
  if (!ctx.isActive) pDelta += PUBLIC_DECAY_RATE;

  // 발매 주의 팬덤 보상은 발매 커밋(evaluateRelease의 품질 비례 델타)이
  // 이미 준다 — 여기서 또 주면 이중 보상으로 팬덤이 인플레이션된다.
  if (ctx.concertThisWeek) fDelta += 6;
  if (ctx.fanServiceThisWeek) fDelta += 3;
  // 넓은 대중 노출이 좋은 음악·활동과 만났을 때 일부가 코어 팬으로
  // 전환된다. 인지도만 반복해서 올린다고 구매 팬덤이 자동 생성되지는 않는다.
  if (
    ctx.isActive &&
    ctx.latestAlbumQuality >= 55 &&
    current.public - current.fandom >= 20
  ) {
    fDelta += 1;
  }

  if (ctx.scandalThisWeek) dDelta += FANDOM_DISAPPOINTMENT_SCANDAL;
  if (ctx.excessiveCommercial) dDelta += FANDOM_DISAPPOINTMENT_COMMERCIAL;

  if (ctx.spotifyStreaming) gDelta += 2;
  if (ctx.youtubeActivity) gDelta += 2;

  const foreignBonus = computeForeignMemberBonus(ctx.foreignMembers);
  gDelta += foreignBonus;
  if (!ctx.isActive && !ctx.spotifyStreaming && !ctx.youtubeActivity) {
    gDelta -= 1;
  }

  const dampPositive = (delta: number, currentValue: number) =>
    delta > 0 ? delta * Math.max(0.2, 1 - currentValue / 120) : delta;
  pDelta = Math.round(dampPositive(pDelta, current.public));
  fDelta = Math.round(dampPositive(fDelta, current.fandom));
  gDelta = Math.round(dampPositive(gDelta, current.global));

  if (!ctx.albumReleaseThisWeek) {
    const quality = clamp(ctx.latestAlbumQuality, 0, 100);
    const coreCeiling =
      AUDIENCE_QUALITY_RETENTION.coreBase +
      quality * AUDIENCE_QUALITY_RETENTION.coreQualityScale;
    const globalCeiling =
      AUDIENCE_QUALITY_RETENTION.globalBase +
      quality * AUDIENCE_QUALITY_RETENTION.globalQualityScale;
    const retentionErosion = (currentValue: number, ceiling: number) =>
      currentValue > ceiling
        ? Math.min(
            AUDIENCE_QUALITY_RETENTION.maxWeeklyErosion,
            Math.ceil(
              (currentValue - ceiling) /
                AUDIENCE_QUALITY_RETENTION.gapPerErosionPoint,
            ),
          )
        : 0;
    fDelta -= retentionErosion(current.fandom, coreCeiling);
    gDelta -= retentionErosion(current.global, globalCeiling);
  }

  if (ctx.musicQualityHigh) iDelta += 3;
  if (ctx.stageExcellent) iDelta += 4;
  if (ctx.awardWin) iDelta += 6;
  if (
    (ctx.chartRank !== null && ctx.chartRank <= 30) ||
    (ctx.albumSalesRank != null && ctx.albumSalesRank <= 30)
  ) {
    iDelta += 1;
  }
  // 대중적 성공이 여러 주 확인되면 업계 신뢰도도 늦게 따라온다.
  if (
    ctx.chartRank !== null &&
    ctx.chartRank <= 10 &&
    current.public - current.industry >= 25
  ) {
    iDelta += 1;
  }
  if (ctx.scandalThisWeek) iDelta -= 5;
  if (ctx.qualityDecline) iDelta -= 3;

  // 실망은 래칫이 아니다: 새 실망이 없는 주에는 서서히 식는다(주 8%, 최소 1).
  // 회복 경로 없이는 실망 임계 초과가 영구화되어 팬덤이 0으로 수렴한다
  // (R6 프로브에서 관측). 팬서비스와 사과 카드가 회복을 앞당긴다.
  const cooledDisappointment =
    dDelta > 0
      ? current.fandomDisappointment
      : Math.max(
          0,
          current.fandomDisappointment -
            calculateRecoveryRate(current.fandomDisappointment) -
            (ctx.fanServiceThisWeek ? 2 : 0),
        );
  const newDisappointment = clamp(cooledDisappointment + dDelta, 0, 100);

  // 실망 임계 초과의 팬 이탈(팬덤·충성도 손실)은 여기서 빼지 않는다 —
  // weekProcessor가 crisis 플래그를 보고 checkFandomCrisis의 손실을 1회
  // 적용·기록한다. 여기서도 빼면 같은 위기가 이중으로 청구된다.
  const axis: Fandom4Axis = {
    public: clamp(current.public + pDelta, 0, 100),
    // 팬덤은 0~100 스케일 — 차트 파워·음악방송 화력·이정표가 전부 이
    // 스케일을 소비한다. 상한이 없으면 판매량·수익이 무한 성장한다.
    fandom: clamp(current.fandom + fDelta, 0, 100),
    fandomLoyalty: current.fandomLoyalty,
    fandomDisappointment: newDisappointment,
    global: clamp(current.global + gDelta, 0, 100),
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
