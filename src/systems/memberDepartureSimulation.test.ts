import { describe, expect, it } from "vitest";
import { GAME_BALANCE, MEMBER_LEAVE } from "@/data/balance";
import { simulateCampaign } from "@/test/campaignPersonas";

// GUIDE의 핵심 약속은 "잘못된 선택은 실질적 손실로 돌아온다"이다. 이 파일은
// 그 약속 중 가장 무거운 손실(멤버 이탈)이 5년 폐루프 안에서 실제로 발동
// 가능한지 검증한다. 밸런스 조정으로 이탈 경로가 죽으면(어떤 운영으로도
// 이탈이 안 나면) 여기서 잡힌다.
describe("혹사 운영의 손실 경로", () => {
  it("멤버를 소모품으로 다루는 운영은 5년 안에 실제 이탈을 겪는다", () => {
    const seeds = [11, 101];
    for (const seed of seeds) {
      const abusive = simulateCampaign("abusive", seed);

      if (process.env.BALANCE_REPORT === "1") {
        console.log(JSON.stringify({ abusiveRun: abusive }, null, 2));
      }

      expect(abusive.memberDepartures).toBeGreaterThanOrEqual(1);
      expect(abusive.remainingMembers).toBeLessThan(4);
      // 4인 팀은 최소 인원(3명) 규칙 때문에 한 명까지만 떠날 수 있다.
      expect(abusive.remainingMembers).toBeGreaterThanOrEqual(
        MEMBER_LEAVE.minTeamSize,
      );
      // 이탈은 만족도 바닥이 몇 주 이어져야 발동하므로 첫 주에 나올 수 없고,
      // 그렇다고 5년 끝까지 미뤄지는 유명무실한 경고여서도 안 된다.
      expect(abusive.firstDepartureWeek).not.toBeNull();
      expect(abusive.firstDepartureWeek!).toBeGreaterThan(
        MEMBER_LEAVE.countdownWeeks,
      );
      expect(abusive.firstDepartureWeek!).toBeLessThan(
        GAME_BALANCE.weeksPerYear * 5,
      );
      // 경제 계약: 최악의 운영이 초기 투자금을 불려서는 안 된다. 이전에는
      // global 참여 순환이 품질과 무관하게 자기 강화되어(40만 넘으면 +4/주
      // 영구 유지) 팬덤 0·품질 19의 앨범 남발로도 스트리밍만으로 5년 순증
      // 흑자였다. 품질 게이트(minAlbumQuality)와 품질 유지 상한 조정 후에는
      // 순손실이어야 하고, 이 부등호가 다시 뒤집히면 관대함이 재발한 것이다.
      expect(abusive.endingMoney).toBeLessThan(abusive.startingMoney);
    }
  }, 15_000);

  it("같은 로스터라도 초보 수준의 평범한 돌봄이면 전원이 남는다", () => {
    // abusive는 novice와 동일한 로스터·시드로 시작하므로, 이 대조는 이탈이
    // '나쁜 뽑기'가 아니라 '나쁜 대우'의 결과임을 보증한다. 초보의 서툰
    // 운영(느슨한 컴백, 무계획 컨셉)만으로 멤버가 떠난다면 손실 시스템이
    // 과하게 가혹한 것이다.
    const seeds = [11, 101];
    for (const seed of seeds) {
      const novice = simulateCampaign("novice", seed);
      expect(novice.memberDepartures).toBe(0);
      expect(novice.remainingMembers).toBe(4);
    }
  }, 15_000);
});
