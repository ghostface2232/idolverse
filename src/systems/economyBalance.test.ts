import { describe, expect, it } from "vitest";
import {
  calculateAlbumLifetimeRevenue,
  calculateAlbumRevenue,
  processWeeklyFinances,
} from "@/systems/economySystem";
import { initialFinanceState } from "@/stores/financeStore";
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
  excessiveCommercial: false,
  spotifyStreaming: false,
  youtubeActivity: false,
  foreignMembers: [],
  latestAlbumQuality: 100,
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
    // 총수익 = 초동 × 장당 마진(1200). 반올림 오차만 허용한다.
    expect(total).toBeGreaterThan(sales * 1200 * 0.99);
    expect(total).toBeLessThan(sales * 1200 * 1.01);
    // 판매량이 두 배면 수익도 두 배 — 품질·팬덤 투자가 회수되는 경로.
    expect(calculateAlbumRevenue(sales * 2, 0)).toBeCloseTo(
      calculateAlbumRevenue(sales, 0) * 2,
      -1,
    );
    expect(calculateAlbumRevenue(sales, 5)).toBe(0);
    expect(calculateAlbumLifetimeRevenue(sales)).toBe(sales * 1200);
  });

  it("계획 화면에서 이미 결제한 비용은 결산에 보이되 두 번 차감하지 않는다", () => {
    const result = processWeeklyFinances(
      {
        ...initialFinanceState,
        money: 100_000_000,
        pendingExpenses: { productionBudget: 60_000_000 },
      },
      {
        fandom: 0,
        global: 0,
        chartRank: null,
        weeksAfterAlbumRelease: null,
        albumFirstWeekSales: 0,
        hasReleasedAlbum: false,
        promotionIncome: 0,
        promotionCost: 0,
      },
    );

    expect(result.expenses.productionBudget).toBe(60_000_000);
    expect(result.money).toBe(100_000_000);
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

  it("팬덤은 100을 넘지 않고, 포화 상한 위에서는 활동으로 더 오르지 않는다", () => {
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
    // AUDIENCE_SATURATION.hardCap(95) 초과 구간은 상승 배율이 0이다 —
    // 콘서트·팬서비스를 쌓아도 99 위로는 오르지 못한다.
    expect(result.axis.fandom).toBeLessThanOrEqual(99);
    expect(result.axis.fandom).toBeGreaterThan(90);
  });

  it("음악 품질이 낮으면 반복 활동으로 얻은 코어·해외 팬덤을 상한에서 유지할 수 없다", () => {
    const current = {
      public: 80,
      fandom: 100,
      fandomLoyalty: 90,
      fandomDisappointment: 0,
      global: 100,
      industry: 30,
    };
    const intermediate = updateFandom(current, {
      ...QUIET_WEEK,
      latestAlbumQuality: 50,
    });
    const expert = updateFandom(current, {
      ...QUIET_WEEK,
      latestAlbumQuality: 95,
    });

    expect(intermediate.axis.fandom).toBeLessThan(expert.axis.fandom);
    expect(intermediate.axis.global).toBeLessThan(expert.axis.global);
  });
});
