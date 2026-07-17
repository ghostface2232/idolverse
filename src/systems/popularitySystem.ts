import { MEMBER_POPULARITY } from "@/data/balance";
import type { Trainee } from "@/types/game";

export interface PopularityWeekContext {
  /** 활동기(발매 후 activity 스테이지) 진행 중인가. */
  inActivityPeriod: boolean;
  musicShowWon: boolean;
  /** 직캠 바이럴의 주인공. 없으면 null. */
  viralMemberId: string | null;
  /** 이번 주 프로모션에 지정 참가한 멤버들. */
  promotionMemberIds: readonly string[];
  /** 활동 중인 앨범의 센터 — 포지션과 무관하게 센터 노출을 받는다. */
  albumCenterId?: string | null;
}

export interface PopularityWeekResult {
  trainees: Trainee[];
  /** 리포트에 실을 만한 개인 인기 사건. */
  highlights: string[];
}

function exposureFor(trainee: Trainee): number {
  const primary = trainee.position
    ? MEMBER_POPULARITY.positionExposure[trainee.position] ?? 0
    : 0;
  const sub = trainee.subPosition
    ? (MEMBER_POPULARITY.positionExposure[trainee.subPosition] ?? 0) * 0.5
    : 0;
  return primary + sub;
}

/**
 * 개인 인기도의 주간 축적. 활동·노출이 있는 멤버는 오르고, 아무 노출이
 * 없는 주에는 서서히 식는다 — "가장 인기 있는 멤버"가 데이터로 구분되어
 * 재계약 조건·격차 서사(M5)의 근거가 된다. 결정론(시드 불요).
 */
export function updateMemberPopularity(
  trainees: readonly Trainee[],
  ctx: PopularityWeekContext,
): PopularityWeekResult {
  const highlights: string[] = [];

  const updated = trainees.map((trainee) => {
    let gain = 0;
    if (ctx.inActivityPeriod) {
      // 이번 앨범의 센터는 포지션과 무관하게 센터급 노출을 받는다.
      const centerExposure =
        ctx.albumCenterId === trainee.id
          ? MEMBER_POPULARITY.positionExposure.center ?? 0.6
          : 0;
      gain +=
        MEMBER_POPULARITY.activityWeekBase +
        Math.max(exposureFor(trainee), centerExposure);
    }
    if (ctx.musicShowWon) {
      gain += MEMBER_POPULARITY.musicShowWinGain;
    }
    if (trainee.currentActivity === "entertainment") {
      gain += MEMBER_POPULARITY.entertainmentGain;
    }
    if (ctx.promotionMemberIds.includes(trainee.id)) {
      gain += MEMBER_POPULARITY.promotionGain;
    }
    if (ctx.viralMemberId === trainee.id) {
      gain += MEMBER_POPULARITY.viralGain;
      highlights.push(
        `${trainee.name}의 직캠이 화제가 되어 개인 인기가 치솟습니다`,
      );
    }

    const delta = gain > 0 ? gain : -MEMBER_POPULARITY.weeklyDecay;
    const popularity = Math.max(
      0,
      Math.min(100, (trainee.popularity ?? 0) + delta),
    );
    return popularity === trainee.popularity
      ? trainee
      : { ...trainee, popularity };
  });

  return { trainees: updated, highlights };
}
