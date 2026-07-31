import { describe, expect, it } from "vitest";
import { COMMERCIAL_CONTRACTS, GAME_BALANCE } from "@/data/balance";
import {
  compactReport,
  median,
  simulateCampaign,
} from "@/test/campaignPersonas";

describe("초보와 숙련 플레이어의 5년 폐루프 밸런스", () => {
  it("동일한 시드와 정책은 같은 260주 결과를 만든다", () => {
    expect(simulateCampaign("expert", 101)).toEqual(
      simulateCampaign("expert", 101),
    );
  });

  it("여러 세계 시드에서 숙련 전략이 성장·품질·차트·생존 우위를 만든다", () => {
    const seeds = [11, 29, 47, 83, 101, 137, 173, 211];
    const novice = seeds.map((seed) => simulateCampaign("novice", seed));
    const intermediate = seeds.map((seed) => simulateCampaign("intermediate", seed));
    const expert = seeds.map((seed) => simulateCampaign("expert", seed));

    if (process.env.BALANCE_REPORT === "1") {
      console.log(
        JSON.stringify(
          {
            noviceMedian: compactReport(novice),
            intermediateMedian: compactReport(intermediate),
            expertMedian: compactReport(expert),
            noviceRuns: novice.map((run) => ({
              seed: run.seed,
              weeksPlayed: run.weeksPlayed,
              endingMoney: run.endingMoney,
              minimumMoney: run.minimumMoney,
              releases: run.releases,
              fandom: run.fandom,
              averageAlbumQuality: run.averageAlbumQuality,
              averageChartRank: run.averageChartRank,
              awards: run.awards,
              decisionCostBreakdown: run.decisionCostBreakdown,
              yearly: run.yearly,
            })),
            expertRuns: expert.map((run) => ({
              seed: run.seed,
              weeksPlayed: run.weeksPlayed,
              endingMoney: run.endingMoney,
              minimumMoney: run.minimumMoney,
              releases: run.releases,
              fandom: run.fandom,
              averageAlbumQuality: run.averageAlbumQuality,
              averageChartRank: run.averageChartRank,
              awards: run.awards,
              remainingMembers: run.remainingMembers,
              facilityLevelTotal: run.facilityLevelTotal,
              yearly: run.yearly,
            })),
            intermediateRuns: intermediate.map((run) => ({
              seed: run.seed,
              weeksPlayed: run.weeksPlayed,
              endingMoney: run.endingMoney,
              minimumMoney: run.minimumMoney,
              releases: run.releases,
              fandom: run.fandom,
              averageAlbumQuality: run.averageAlbumQuality,
              averageChartRank: run.averageChartRank,
              awards: run.awards,
              decisionCostBreakdown: run.decisionCostBreakdown,
              yearly: run.yearly,
            })),
          },
          null,
          2,
        ),
      );
    }

    expect(median(expert, "averageMemberStats")).toBeGreaterThan(
      median(novice, "averageMemberStats"),
    );
    expect(median(expert, "averageAlbumQuality")).toBeGreaterThan(
      median(novice, "averageAlbumQuality"),
    );
    expect(median(expert, "averageChartRank")).toBeLessThan(
      median(novice, "averageChartRank"),
    );
    // 5년 평가는 기록 체크포인트다. 파산은 여전히 종료 조건이지만 성과
    // 경로 미달만으로 260주에 캠페인이 끝나서는 안 된다.
    expect(novice.every((run) => run.failedAtWeek !== 260)).toBe(true);
    expect(
      intermediate.filter((run) => run.failedAtWeek === null).length,
    ).toBeGreaterThanOrEqual(Math.ceil(seeds.length * 0.75));
    expect(expert.every((run) => run.failedAtWeek === null)).toBe(true);
    expect(median(intermediate, "averageMemberStats")).toBeGreaterThan(
      median(novice, "averageMemberStats"),
    );
    expect(median(intermediate, "averageMemberStats")).toBeLessThan(
      median(expert, "averageMemberStats"),
    );
    expect(median(intermediate, "averageAlbumQuality")).toBeGreaterThan(
      median(novice, "averageAlbumQuality"),
    );
    expect(median(intermediate, "averageAlbumQuality")).toBeLessThan(
      median(expert, "averageAlbumQuality"),
    );
    // 높은 품질이 경제 외 결과에서도 눈에 띄는 보상으로 남아야 한다.
    // 합성 차트 시장 완화(entryCount 90→60, powerRange 75→60) 이후 모든
    // 순위가 위로 압축돼(숙련 ~3위, 중급 ~10위) 절대 격차 기준을 10에서
    // 5로 내렸다 — 1위 밑으로는 내려갈 수 없어 상위권 격차는 구조적으로
    // 좁아지고, 실력 분리는 아래의 top10·음악방송 승수 마진이 이어받는다.
    expect(
      median(intermediate, "averageChartRank") -
        median(expert, "averageChartRank"),
    ).toBeGreaterThan(5);
    expect(median(expert, "topTenAlbums")).toBeGreaterThanOrEqual(
      median(intermediate, "topTenAlbums") + 5,
    );
    expect(median(expert, "musicShowWins")).toBeGreaterThanOrEqual(
      median(intermediate, "musicShowWins") + 10,
    );
    expect(median(expert, "awards")).toBeGreaterThanOrEqual(
      median(intermediate, "awards") + 6,
    );
    expect(median(expert, "fandom")).toBeGreaterThanOrEqual(
      median(intermediate, "fandom") + 8,
    );
    expect(median(expert, "global")).toBeGreaterThanOrEqual(
      median(intermediate, "global") + 6,
    );
    expect(median(intermediate, "averageChemistry")).toBeGreaterThan(
      median(novice, "averageChemistry") + 5,
    );
    expect(median(expert, "averageChemistry")).toBeGreaterThan(
      median(intermediate, "averageChemistry") + 5,
    );

    // 2026-07-17 기준 중앙값(초보 57.5, 중급 50, 숙련 46)의 1/4 이하여야 한다.
    expect(median(novice, "injuries")).toBeLessThanOrEqual(57.5 / 4);
    expect(median(intermediate, "injuries")).toBeLessThanOrEqual(50 / 4);
    expect(median(expert, "injuries")).toBeLessThanOrEqual(46 / 4);

    // 첫 연말 전에 파산하면 데뷔·첫 컴백·시상식의 최소 루프조차 관찰할 수 없다.
    expect(Math.min(...novice.map((run) => run.weeksPlayed))).toBeGreaterThanOrEqual(52);
    expect(Math.min(...expert.map((run) => run.weeksPlayed))).toBeGreaterThanOrEqual(52);
  }, 20_000);

  it("전문 인력 채용 정책의 품질 이득과 고정비 부담도 같은 루프로 측정한다", () => {
    const lean = simulateCampaign("expert", 101, "lean");
    const specialists = simulateCampaign("expert", 101, "specialists");

    if (process.env.BALANCE_REPORT === "1") {
      console.log(
        JSON.stringify({ specialistStaffComparison: { lean, specialists } }, null, 2),
      );
    }

    expect(specialists.bestAlbumQuality).toBeGreaterThanOrEqual(
      lean.bestAlbumQuality,
    );
    expect(specialists.averageAlbumQuality).toBeGreaterThan(
      lean.averageAlbumQuality,
    );
    expect(specialists.totalExpenses).toBeGreaterThan(lean.totalExpenses);
    expect(specialists.minimumMoney).toBeLessThan(lean.minimumMoney);
    // 전속 인력의 트레이드오프는 "지출이 크고 최저 잔액이 얇다"까지가 설계 보장이다.
    // 5년 복리의 최종 잔액은 발매 운(시장 스윙)과 사이클 타이밍에 좌우되는 결과값이라
    // 부등호를 고정하지 않는다. 품질 투자 회수 자체는 R6 원칙(성장 투자가 이긴다)과 정합.
    // 다만 어느 쪽도 상대를 압도(1.5배 이상)하면 밸런스 붕괴로 본다.
    expect(specialists.endingMoney).toBeGreaterThan(lean.endingMoney * 0.67);
    expect(specialists.endingMoney).toBeLessThan(lean.endingMoney * 1.5);
    expect(specialists.failedAtWeek).toBeNull();
    expect(lean.failedAtWeek).toBeNull();
  });

  it("위기 카드는 상시 세금이 아니라 에피소드여야 한다", () => {
    // 쿨다운 도입 전에는 실망도·스트레스가 임계 위에 머무는 한 같은 위기
    // 카드가 매주 다시 올라와, 위기 대응이 사실상 주간 고정비였다(초보
    // 기준 fandom-crisis ~150주/260주, 위기 카드 존재 주 ~90%). 이 상한이
    // 다시 뚫리면 페이싱 장치(쿨다운, 보류의 검토 주기 소모, 스캔들 재분류,
    // 휴식일 회복)가 어딘가에서 무력화된 것이다.
    const seeds = [11, 101];
    for (const seed of seeds) {
      const novice = simulateCampaign("novice", seed);
      const intermediate = simulateCampaign("intermediate", seed);
      expect(novice.crisisWeekShare).toBeLessThanOrEqual(0.65);
      expect(intermediate.crisisWeekShare).toBeLessThanOrEqual(0.6);
      // 팬덤 위기: 대응을 골랐으면 쿨다운 동안은 매니저가 후속을 맡는다.
      expect(novice.crisisCardWeeks["fandom-crisis"] ?? 0).toBeLessThanOrEqual(45);
      expect(intermediate.crisisCardWeeks["fandom-crisis"] ?? 0).toBeLessThanOrEqual(35);
      // 장기 성장 검토는 보류해도 다음 주기까지 돌아오지 않아야 한다.
      expect(novice.crisisCardWeeks["strategic-expansion"] ?? 0).toBeLessThanOrEqual(8);
    }
  }, 15_000);

  it("숙련의 시상식 역산 스케줄은 최소한 손해가 아니어야 한다", () => {
    // 2026-07 프로브 기록: 현 시상 체계(50주차 public 스냅샷 + 그 해 최고
    // 품질)는 발매 타이밍을 보상하지 않는다 — 사각지대(50~52주차 발매) 회피는
    // 사실상 무발동이고, 심사 직전으로 주기를 당기는 압축 스프린트는 팬
    // 실망·충성도를 갉아 투표 지표를 깎아 오히려 대상을 잃었다. 그래서 이
    // 테스트는 "계획이 이긴다"가 아니라 "계획이 손해를 만들면 안 된다"를
    // 고정한다. 시상 지표에 연중 차트 성적 같은 달력 갈고리가 생기면
    // 부등호를 우위 검증으로 올려야 한다.
    const seeds = [29, 101, 173];
    let planningAwards = 0;
    let naiveAwards = 0;
    let planningDaesang = 0;
    let naiveDaesang = 0;
    for (const seed of seeds) {
      const planning = simulateCampaign("expert", seed);
      const naive = simulateCampaign("expert", seed, "lean", false, {
        awardPlanning: false,
      });
      planningAwards += planning.awards;
      naiveAwards += naive.awards;
      planningDaesang += planning.daesangAwards;
      naiveDaesang += naive.daesangAwards;
    }
    expect(planningAwards).toBeGreaterThanOrEqual(naiveAwards);
    expect(planningDaesang).toBeGreaterThanOrEqual(naiveDaesang);
  }, 15_000);

  it("계약 우선 자동 플레이를 5년 돌려도 계약 수입이 지배 전략이 되지 않는다", () => {
    // 단일 시드 비교는 세계 진화(사건·재계약 시점)의 주 단위 노이즈에
    // 흔들린다 — 두 세계 합산으로 구조적 차이만 검증한다.
    const seeds = [101, 173];
    const totals = {
      balancedIncome: 0,
      contractIncome: 0,
      balancedFatigue: 0,
      contractFatigue: 0,
      balancedStats: 0,
      contractStats: 0,
      balancedQuality: 0,
      contractQuality: 0,
    };
    for (const seed of seeds) {
      const balanced = simulateCampaign("intermediate", seed, "lean", false);
      const contractFirst = simulateCampaign("intermediate", seed, "lean", true);

      if (process.env.BALANCE_REPORT === "1") {
        console.log(
          JSON.stringify(
            { commercialContractComparison: { seed, balanced, contractFirst } },
            null,
            2,
          ),
        );
      }

      expect(contractFirst.weeksPlayed).toBe(GAME_BALANCE.weeksPerYear * 5);
      expect(contractFirst.maxCommercialScheduleSlots).toBeLessThanOrEqual(
        COMMERCIAL_CONTRACTS.maxScheduleSlots,
      );
      totals.balancedIncome += balanced.commercialContractIncome;
      totals.contractIncome += contractFirst.commercialContractIncome;
      totals.balancedFatigue += balanced.commercialFatigueExposure;
      totals.contractFatigue += contractFirst.commercialFatigueExposure;
      totals.balancedStats += balanced.averageMemberStats;
      totals.contractStats += contractFirst.averageMemberStats;
      totals.balancedQuality += balanced.averageAlbumQuality;
      totals.contractQuality += contractFirst.averageAlbumQuality;
    }
    expect(totals.contractIncome).toBeGreaterThan(totals.balancedIncome);
    expect(totals.contractFatigue).toBeGreaterThan(totals.balancedFatigue);
    // 성장 격차는 위기 카드 페이싱 도입 이후 주 단위 노이즈(±1)에 묻힐
    // 만큼 좁아졌다 — "계약 몰빵이 균형 운영을 의미 있게 앞서지 않는다"가
    // 설계 보장이므로 소폭의 우위까지는 허용한다.
    expect(totals.contractStats).toBeLessThan(totals.balancedStats + 4);
    expect(totals.contractQuality).toBeLessThan(totals.balancedQuality + 4);
  }, 20_000);
});
