import { describe, expect, it } from "vitest";
import {
  buildContenderFromCompetitor,
  buildContenderFromPlayer,
  evaluateAwards,
  getPlayerAwardWins,
} from "@/systems/awardsSystem";
import type { CompetitorGroup } from "@/types/game";

const RIVAL: CompetitorGroup = {
  id: "rival-test",
  name: "테스트라이벌",
  agency: "테스트기획",
  gender: "female",
  type: "traditional",
  stats: { vocal: 74, dance: 77, visual: 83, marketing: 88 },
  fandom: 6400, // 경쟁자 fandom은 수천 단위 스케일
  public: 41,
  global: 1900, // global도 수천 단위 스케일
  industry: 52,
  activeWeeks: 24,
  debutYear: 1,
  strengths: [],
  weaknesses: [],
};

describe("buildContenderFromCompetitor 스케일", () => {
  it("경쟁자 지표가 플레이어와 같은 0~100 스케일로 정규화된다", () => {
    const contender = buildContenderFromCompetitor(RIVAL);

    // 수정 전에는 albumSalesIndex ≈ 3,861 / fanVotes ≈ 5,050으로
    // 플레이어(0~100)가 구조적으로 수상 불가능했다.
    expect(contender.digitalIndex).toBeGreaterThan(0);
    expect(contender.digitalIndex).toBeLessThanOrEqual(100);
    expect(contender.albumSalesIndex).toBeGreaterThan(0);
    expect(contender.albumSalesIndex).toBeLessThanOrEqual(100);
    expect(contender.fanVotes).toBeGreaterThan(0);
    expect(contender.fanVotes).toBeLessThanOrEqual(100);
    expect(contender.judgesScore).toBeGreaterThan(0);
    expect(contender.judgesScore).toBeLessThanOrEqual(100);
  });

  it("지표가 강한 플레이어는 라이벌을 상대로 수상할 수 있다", () => {
    const player = buildContenderFromPlayer(
      "player",
      "플레이어그룹",
      { digitalIndex: 90, albumSalesIndex: 90, fanVotes: 90, judgesScore: 90 },
      1,
    );
    const rival = buildContenderFromCompetitor(RIVAL);

    const results = evaluateAwards([player, rival], 1, 12345);
    const wins = getPlayerAwardWins(results, "player");

    expect(wins.length).toBeGreaterThan(0);
  });
});
