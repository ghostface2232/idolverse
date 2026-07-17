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

  it("시상식 수상은 awardHistory에 영속화된다", () => {
    // 라이벌이 없는 픽스처에서는 플레이어가 인기상/신인상을 가져간다
    const result = processWeek(makeGameSnapshot({ week: 50 }), NO_DECISIONS);
    const wins = result.weekReport.awardResults
      ?.flatMap((r) => r.winners)
      .filter((w) => w.isPlayer);

    expect(wins?.length).toBeGreaterThan(0);
    expect(result.newState.game.awardHistory).toHaveLength(wins?.length ?? 0);
    expect(
      result.newState.game.awardHistory.every((r) => r.year === 1),
    ).toBe(true);
  });

  it("영속화된 수상 기록으로 시상 주 이후의 투자사 awardLevel 조건이 통과된다", () => {
    const withAward = makeGameSnapshot({
      week: 52,
      investorType: "entertainment",
    });
    withAward.game.awardHistory = [
      { year: 1, week: 50, showId: "mma", showName: "MMA", category: "bonsang" },
    ];
    const passed = processWeek(withAward, NO_DECISIONS);
    expect(
      passed.weekReport.warnings.some((w) =>
        w.includes("연말 시상식 본상 이상"),
      ),
    ).toBe(false);

    // 대조군: 기록이 없으면 같은 주에 조건 미달 경고가 발생한다
    const withoutAward = makeGameSnapshot({
      week: 52,
      investorType: "entertainment",
    });
    const failed = processWeek(withoutAward, NO_DECISIONS);
    expect(
      failed.weekReport.warnings.some((w) =>
        w.includes("연말 시상식 본상 이상"),
      ),
    ).toBe(true);
  });

  it("마감(52주) 이후에 딴 상은 실패한 1년차 마일스톤을 소급 충족시키지 않는다", () => {
    // 2년차 시상식(누적 102주)에서 본상을 땄어도, 마감 52주짜리 조건은 계속 미달이다
    const lateAward = makeGameSnapshot({
      week: 52,
      year: 2,
      investorType: "entertainment",
    });
    lateAward.game.awardHistory = [
      { year: 2, week: 102, showId: "mma", showName: "MMA", category: "bonsang" },
    ];
    const result = processWeek(lateAward, NO_DECISIONS);
    expect(
      result.weekReport.warnings.some((w) =>
        w.includes("연말 시상식 본상 이상"),
      ),
    ).toBe(true);
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

  it("부상 휴식 결정은 대상 멤버만 훈련을 건너뛰고 다음 주 활동을 복구한다", () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.trainee.trainees[0].injuryWeeks = 2;
    const beforeTargetVocal = snapshot.trainee.trainees[0].stats.vocal;
    const beforeTeammateVocal = snapshot.trainee.trainees[1].stats.vocal;

    const result = processWeek(snapshot, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: "injury:t1",
          optionId: "full-rest",
          effects: {
            injuryWeeks: -2,
            condition: 15,
            satisfaction: 5,
            public: -2,
          },
          targetTraineeIds: ["t1"],
          activityOverride: "vacation",
        },
      ],
    });

    const target = result.newState.trainee.trainees[0];
    const teammate = result.newState.trainee.trainees[1];
    expect(target.injuryWeeks).toBe(0);
    expect(target.stats.vocal).toBe(beforeTargetVocal);
    expect(target.currentActivity).toBe("training");
    expect(teammate.stats.vocal).toBeGreaterThan(beforeTeammateVocal);
  });

  it("기회 활동 전환은 케미 계산까지 유지되어 합동 훈련 기회를 잃는다", () => {
    const snapshot = makeGameSnapshot({ week: 5 });

    const result = processWeek(snapshot, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: "opportunity:test:w5",
          optionId: "send-unit",
          effects: {},
          targetTraineeIds: ["t1"],
          activityOverride: "individual",
        },
      ],
    });

    const target = result.newState.trainee.trainees.find(
      (trainee) => trainee.id === "t1",
    );
    const teammate = result.newState.trainee.trainees.find(
      (trainee) => trainee.id === "t2",
    );
    expect(target?.chemistry.t2).toBe(20);
    expect(teammate?.chemistry.t1).toBe(20);
    expect(target?.currentActivity).toBe("training");
  });
});
