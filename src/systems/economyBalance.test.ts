import { describe, expect, it } from "vitest";
import { calculateAlbumRevenue } from "@/systems/economySystem";
import { updateFandom, type WeeklyFandomContext } from "@/systems/fandomSystem";

const QUIET_WEEK: WeeklyFandomContext = {
  hadVarietyAppearance: false,
  hadViralEvent: false,
  chartRank: null,
  isActive: true,
  albumReleaseThisWeek: false,
  concertThisWeek: false,
  fanServiceThisWeek: false,
  scandalThisWeek: false,
  conceptBreakThisWeek: false,
  excessiveCommercial: false,
  spotifyStreaming: false,
  youtubeActivity: false,
  overseasPromotion: false,
  foreignMembers: [],
  musicQualityHigh: false,
  stageExcellent: false,
  awardWin: false,
  qualityDecline: false,
};

describe("경제·팬덤 캘리브레이션 (R6)", () => {
  it("앨범 수익은 초동 판매량에 비례하고 감쇠 주간 총합이 장당 마진과 같다", () => {
    const sales = 100_000;
    const total = [0, 1, 2, 3, 4].reduce(
      (sum, week) => sum + calculateAlbumRevenue(sales, week),
      0,
    );
    // 총수익 = 초동 × 장당 마진(800). 반올림 오차만 허용한다.
    expect(total).toBeGreaterThan(sales * 800 * 0.99);
    expect(total).toBeLessThan(sales * 800 * 1.01);
    // 판매량이 두 배면 수익도 두 배 — 품질·팬덤 투자가 회수되는 경로.
    expect(calculateAlbumRevenue(sales * 2, 0)).toBeCloseTo(
      calculateAlbumRevenue(sales, 0) * 2,
      -1,
    );
    expect(calculateAlbumRevenue(sales, 5)).toBe(0);
  });

  it("실망은 래칫이 아니다: 새 실망이 없는 주에 자연 회복된다", () => {
    const result = updateFandom(
      {
        public: 50,
        fandom: 40,
        fandomLoyalty: 60,
        fandomDisappointment: 90,
        global: 10,
        industry: 40,
      },
      QUIET_WEEK,
    );
    expect(result.axis.fandomDisappointment).toBeLessThan(90);
  });

  it("스캔들 주에는 실망이 회복 없이 쌓인다", () => {
    const result = updateFandom(
      {
        public: 50,
        fandom: 40,
        fandomLoyalty: 60,
        fandomDisappointment: 40,
        global: 10,
        industry: 40,
      },
      { ...QUIET_WEEK, scandalThisWeek: true },
    );
    expect(result.axis.fandomDisappointment).toBeGreaterThan(40);
  });

  it("팬덤은 100을 넘지 않는다", () => {
    const result = updateFandom(
      {
        public: 50,
        fandom: 99,
        fandomLoyalty: 60,
        fandomDisappointment: 0,
        global: 10,
        industry: 40,
      },
      { ...QUIET_WEEK, concertThisWeek: true, fanServiceThisWeek: true },
    );
    expect(result.axis.fandom).toBe(100);
  });
});
