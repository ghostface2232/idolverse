import { describe, expect, it } from "vitest";
import {
  applyEffects,
  EFFECT_KEY_SET,
  normalizeEffectMap,
} from "@/systems/applyEffects";
import { generateWeeklyDecisionCards } from "@/systems/generateWeeklyDecisionCards";
import { applyInvestorPenalty } from "@/systems/economySystem";
import { RANDOM_EVENT_POOL } from "@/data/events";
import { PROMOTION_ACTIVITIES } from "@/data/promotions";
import { INTERLUDE_ACTIVITIES } from "@/data/interlude";
import { INVESTOR_COMPANIES } from "@/data/investors";
import { eventVanillaStore } from "@/stores/eventStore";
import type { EffectMap } from "@/types/game";
import { makeTrainee } from "@/test/gameStateFixture";

/**
 * 효과 키 계약 테스트: 게임 데이터의 모든 effects 키가 applyEffects의
 * 지원 키 집합(EFFECT_KEY_SET)에 포함되는지 검증한다. 컴파일 타임에는
 * EffectKey union이 지키지만, 세이브 역직렬화나 `Record<string, number>`로의
 * 회귀처럼 타입 계약을 우회하는 경로가 있으므로 런타임 계약을 별도로 못 박는다.
 * (효과 키 불일치로 결정 카드 절반이 무음 폐기되던 리뷰 §3-1의 재발 방지.)
 */

interface EffectSource {
  label: string;
  effects: EffectMap;
}

function collectAllEffectSources(): EffectSource[] {
  const sources: EffectSource[] = [];

  for (const template of RANDOM_EVENT_POOL) {
    sources.push({ label: `이벤트 ${template.id} (base)`, effects: template.effects });
    for (const [i, choice] of (template.choices ?? []).entries()) {
      sources.push({ label: `이벤트 ${template.id}/choice[${i}]`, effects: choice.effects });
    }
  }

  for (const activity of PROMOTION_ACTIVITIES) {
    sources.push({ label: `프로모션 ${activity.id}`, effects: activity.effects });
  }

  for (const interlude of INTERLUDE_ACTIVITIES) {
    sources.push({ label: `인터루드 ${interlude.id}`, effects: interlude.effects });
  }

  // generateWeeklyDecisionCards 내부의 위기/인터루드 카드(모듈 비공개)는
  // 모든 위기 플래그를 켠 컨텍스트로 생성해 커버한다.
  const crisisCtxBase = {
    phase: "debut" as const,
    members: [
      {
        id: "member-a",
        name: "멤버 A",
        injuryWeeks: 3,
        condition: 20,
        stress: 95,
        satisfaction: 10,
      },
      {
        id: "member-b",
        name: "멤버 B",
        injuryWeeks: 0,
        condition: 80,
        stress: 20,
        satisfaction: 70,
      },
    ],
    conflicts: [
      {
        memberAId: "member-a",
        memberAName: "멤버 A",
        memberBId: "member-b",
        memberBName: "멤버 B",
        chemistry: -80,
      },
    ],
    investorPressure: true,
    money: -1,
    weeklyFixedTotal: 100,
    fandom: 50,
    fandomLoyalty: 20,
    fandomDisappointment: 80,
  };
  for (const complianceCount of [0, 99]) {
    const cards = generateWeeklyDecisionCards(10, "spring", {
      ...crisisCtxBase,
      investorComplianceCount: complianceCount,
    });
    for (const card of cards) {
      for (const option of card.options) {
        sources.push({
          label: `주간 생성 카드 ${card.id}/${option.id} (수용 ${complianceCount}회)`,
          effects: option.effects,
        });
      }
    }
  }

  for (const investor of INVESTOR_COMPANIES) {
    for (const penalty of applyInvestorPenalty(investor)) {
      sources.push({
        label: `투자사 페널티 ${investor.id}/${penalty.effectType}`,
        effects: penalty.effects,
      });
    }
  }

  for (const event of eventVanillaStore.getState().pendingEvents) {
    for (const [i, choice] of (event.choices ?? []).entries()) {
      sources.push({
        label: `초기 이벤트 ${event.id}/choice[${i}]`,
        effects: choice.effects,
      });
    }
  }

  return sources;
}

describe("효과 키 계약", () => {
  const sources = collectAllEffectSources();

  it("검증 대상 효과 소스가 실제로 수집된다", () => {
    expect(sources.length).toBeGreaterThan(50);
  });

  it("모든 데이터 파일의 effects 키가 지원 키 집합에 포함된다", () => {
    const violations = sources.flatMap((source) =>
      Object.keys(source.effects)
        .filter((key) => !EFFECT_KEY_SET.has(key))
        .map((key) => `${source.label} → 미지원 키 "${key}"`),
    );
    expect(violations).toEqual([]);
  });

  it("normalizeEffectMap이 정규 키를 그대로 통과시킨다", () => {
    for (const source of sources) {
      expect(normalizeEffectMap(source.effects as Record<string, number>)).toEqual(
        source.effects,
      );
    }
  });

  it("구버전 세이브의 레거시 키를 정규 키로 변환한다", () => {
    expect(
      normalizeEffectMap({
        trainee_vocal: 3,
        trainee_stress: -2,
        album_song: 5,
        fandom_disappointment: 4,
      }),
    ).toEqual({ vocal: 3, stress: -2, albumSong: 5, fandomDisappointment: 4 });
  });

  it("trainee_specialist 특례는 보컬/댄스로 분할된다", () => {
    expect(normalizeEffectMap({ trainee_specialist: 4 })).toEqual({
      vocal: 2,
      dance: 2,
    });
  });

  it("알 수 없는 키는 크래시 없이 무시된다", () => {
    expect(normalizeEffectMap({ definitely_not_a_key: 10, money: 5 })).toEqual({
      money: 5,
    });
  });
});

describe("결정 효과 대상 범위", () => {
  const fandom = {
    public: 10,
    fandom: 10,
    fandomLoyalty: 50,
    fandomDisappointment: 0,
    global: 0,
    industry: 10,
  };

  it("멤버 지정 효과는 대상 멤버에게만 적용한다", () => {
    const target = makeTrainee("target", { condition: 40, injuryWeeks: 3 });
    const teammate = makeTrainee("teammate", {
      condition: 80,
      injuryWeeks: 0,
    });

    const result = applyEffects(
      {
        money: 0,
        fandom,
        trainees: [target, teammate],
        album: null,
        investorPressureWeeks: 0,
      },
      { condition: 15, injuryWeeks: -2, public: -2 },
      { traineeIds: [target.id] },
    );

    expect(result.trainees[0]).toMatchObject({ condition: 55, injuryWeeks: 1 });
    expect(result.trainees[1]).toMatchObject({ condition: 80, injuryWeeks: 0 });
    expect(result.fandom.public).toBe(8);
  });

  it("두 멤버 대상 chemistry 효과는 해당 관계에만 대칭 적용한다", () => {
    const a = makeTrainee("a", { chemistry: { b: -60, c: 5 } });
    const b = makeTrainee("b", { chemistry: { a: -60, c: 10 } });
    const c = makeTrainee("c", { chemistry: { a: 5, b: 10 } });

    const result = applyEffects(
      {
        money: 0,
        fandom,
        trainees: [a, b, c],
        album: null,
        investorPressureWeeks: 0,
      },
      { chemistry: 15 },
      { traineeIds: [a.id, b.id] },
    );

    expect(result.trainees[0].chemistry).toEqual({ b: -45, c: 5 });
    expect(result.trainees[1].chemistry).toEqual({ a: -45, c: 10 });
    expect(result.trainees[2].chemistry).toEqual({ a: 5, b: 10 });
  });
});
