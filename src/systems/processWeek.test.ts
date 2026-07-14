import { describe, expect, it } from "vitest";
import { processWeek, type PlayerDecisions } from "@/systems/weekProcessor";
import { makeGameSnapshot } from "@/test/gameStateFixture";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

/**
 * 골든 스냅샷 테스트: 주간 처리 파이프라인의 전체 출력(새 상태 + 리포트)을
 * 고정 입력으로 스냅샷에 박제한다. 밸런스 수치나 파이프라인 순서를 바꾸면
 * 스냅샷이 깨져 의도한 변경인지 리뷰에서 확인하게 된다.
 * (processWeek는 시드 주입 RNG만 사용하므로 실행마다 결과가 동일하다.)
 */
describe("processWeek 골든 스냅샷", () => {
  it("일반 훈련 주간(5주차)의 출력이 스냅샷과 일치한다", () => {
    const result = processWeek(makeGameSnapshot({ week: 5 }), NO_DECISIONS);
    expect(result).toMatchSnapshot();
  });

  it("시상식 주간(50주차)의 출력이 스냅샷과 일치한다", () => {
    const result = processWeek(makeGameSnapshot({ week: 50 }), NO_DECISIONS);
    expect(result.weekReport.awardResults).not.toBeNull();
    expect(result).toMatchSnapshot();
  });

  it("투자사 마감 주간(VC 13주차)의 출력이 스냅샷과 일치한다", () => {
    const result = processWeek(
      makeGameSnapshot({ week: 13, investorType: "vc" }),
      NO_DECISIONS,
    );
    // 분기 수익 0 → 조건 첫 미달 → 유예 경고가 기록되어야 한다
    expect(
      result.weekReport.warnings.some((w) => w.includes("투자사 조건 미달")),
    ).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it("같은 입력으로 두 번 실행하면 결과가 완전히 동일하다 (결정론)", () => {
    const first = processWeek(makeGameSnapshot({ week: 5 }), NO_DECISIONS);
    const second = processWeek(makeGameSnapshot({ week: 5 }), NO_DECISIONS);
    expect(second).toEqual(first);
  });

  it("입력 스냅샷을 변형하지 않는다 (순수 함수 계약)", () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    const original = JSON.parse(JSON.stringify(snapshot));
    processWeek(snapshot, NO_DECISIONS);
    expect(snapshot).toEqual(original);
  });
});
