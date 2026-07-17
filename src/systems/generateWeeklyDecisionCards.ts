import {
  CHEMISTRY_CONFLICT_THRESHOLD,
  DECISION_TRIGGER_THRESHOLDS,
  EMERGENCY_FINANCING,
  GAME_BALANCE,
  INVESTOR_COMPLY_SUPPORT_LIMIT,
  MEMBER_CONTRACT,
  OPPORTUNITY_PACING,
  SATISFACTION_WARNING_THRESHOLD,
  STRATEGIC_EXPANSION,
  TEMPERAMENT_PROFILES,
} from "@/data/balance";
import { OPPORTUNITY_DEFINITIONS } from "@/data/opportunities";
import { createSeededRandom } from "@/lib/seededRandom";
import type {
  EmergencyFinancingRecord,
  GamePhase,
  MemberTemperament,
  Season,
  StrategicExpansionLevels,
  Trainee,
  WeeklyDecision,
  WeeklyDecisionTrigger,
} from "@/types/game";

export interface DecisionMemberContext {
  id: string;
  name: string;
  injuryWeeks: number;
  condition: number;
  stress: number;
  satisfaction: number;
  /** M5 재계약 카드용. 구버전 projection 호환을 위해 선택적으로 둔다. */
  popularity?: number;
  temperament?: MemberTemperament;
  contractTier?: number;
  renegotiationDueWeek?: number;
}

export interface DecisionConflictContext {
  memberAId: string;
  memberAName: string;
  memberBId: string;
  memberBName: string;
  chemistry: number;
}

export interface DecisionCardContext {
  phase: GamePhase;
  members: DecisionMemberContext[];
  conflicts: DecisionConflictContext[];
  investorPressure: boolean;
  investorComplianceCount: number;
  money: number;
  weeklyFixedTotal: number;
  fandom: number;
  fandomLoyalty: number;
  fandomDisappointment: number;
  lastOpportunityWeek: number | null;
  emergencyFinancing?: readonly EmergencyFinancingRecord[];
  competitorComebacks: string[];
  projectDeadlineWeeks: number | null;
  releasedAlbumCount?: number;
  strategicExpansion?: StrategicExpansionLevels;
  lastStrategicExpansionWeek?: number | null;
}

export interface DecisionContextState {
  phase: GamePhase;
  trainees: readonly Trainee[];
  investorPressure: boolean;
  investorComplianceCount: number;
  money: number;
  weeklyFixedTotal: number;
  fandom: number;
  fandomLoyalty: number;
  fandomDisappointment: number;
  lastOpportunityWeek?: number | null;
  emergencyFinancing?: readonly EmergencyFinancingRecord[];
  competitorComebacks?: readonly string[];
  projectDeadlineWeeks?: number | null;
  releasedAlbumCount?: number;
  strategicExpansion?: StrategicExpansionLevels;
  lastStrategicExpansionWeek?: number | null;
}

interface PrioritizedCard {
  priority: number;
  card: WeeklyDecision;
}

/** 현재 게임 상태를 결정 생성기가 소비하는 최소 projection으로 변환한다. */
export function buildDecisionCardContext(
  state: DecisionContextState,
): DecisionCardContext {
  const conflicts: DecisionConflictContext[] = [];
  for (let i = 0; i < state.trainees.length; i++) {
    for (let j = i + 1; j < state.trainees.length; j++) {
      const memberA = state.trainees[i];
      const memberB = state.trainees[j];
      const chemistry = Math.min(
        memberA.chemistry[memberB.id] ?? 0,
        memberB.chemistry[memberA.id] ?? 0,
      );
      if (chemistry <= CHEMISTRY_CONFLICT_THRESHOLD) {
        conflicts.push({
          memberAId: memberA.id,
          memberAName: memberA.name,
          memberBId: memberB.id,
          memberBName: memberB.name,
          chemistry,
        });
      }
    }
  }

  return {
    phase: state.phase,
    members: state.trainees.map((trainee) => ({
      id: trainee.id,
      name: trainee.name,
      injuryWeeks: trainee.injuryWeeks,
      condition: trainee.condition,
      stress: trainee.stress,
      satisfaction: trainee.satisfaction,
      popularity: trainee.popularity ?? 0,
      temperament: trainee.temperament ?? "steady",
      contractTier: trainee.contract?.tier ?? 1,
      renegotiationDueWeek:
        trainee.contract?.nextRenegotiationWeek ?? Number.MAX_SAFE_INTEGER,
    })),
    conflicts: conflicts.sort((a, b) => a.chemistry - b.chemistry),
    investorPressure: state.investorPressure,
    investorComplianceCount: state.investorComplianceCount,
    money: state.money,
    weeklyFixedTotal: state.weeklyFixedTotal,
    fandom: state.fandom,
    fandomLoyalty: state.fandomLoyalty,
    fandomDisappointment: state.fandomDisappointment,
    lastOpportunityWeek: state.lastOpportunityWeek ?? null,
    emergencyFinancing: [...(state.emergencyFinancing ?? [])],
    competitorComebacks: [...(state.competitorComebacks ?? [])],
    projectDeadlineWeeks: state.projectDeadlineWeeks ?? null,
    releasedAlbumCount: state.releasedAlbumCount ?? 0,
    strategicExpansion: state.strategicExpansion ?? {
      production: 0,
      fandom: 0,
      global: 0,
    },
    lastStrategicExpansionWeek: state.lastStrategicExpansionWeek ?? null,
  };
}

/**
 * 정상 상태를 채우기 위한 랜덤 카드를 만들지 않는다.
 * 실제 시스템 상태가 플레이어 판단을 요구할 때만 최대 네 건을 반환한다.
 */
export function generateWeeklyDecisionCards(
  cumulativeWeek: number,
  season: Season,
  ctx?: DecisionCardContext,
): WeeklyDecision[] {
  if (!ctx || ctx.phase === "prologue" || ctx.phase === "founding") return [];

  const candidates: PrioritizedCard[] = [];
  const injured = [...ctx.members]
    .filter((member) => member.injuryWeeks > 0)
    .sort((a, b) => b.injuryWeeks - a.injuryWeeks || a.condition - b.condition)[0];
  if (injured) {
    candidates.push({ priority: 100 + injured.injuryWeeks, card: buildInjuryCard(injured) });
  }

  // 재계약 협상(M5): 도래한 멤버 중 가장 오래 기다린 한 명만 이번 주에 올린다.
  const renegotiationDue = [...ctx.members]
    .filter(
      (member) =>
        member.renegotiationDueWeek !== undefined &&
        member.renegotiationDueWeek <= cumulativeWeek,
    )
    .sort(
      (a, b) => (a.renegotiationDueWeek ?? 0) - (b.renegotiationDueWeek ?? 0),
    )[0];
  if (renegotiationDue) {
    candidates.push({
      priority: 95,
      card: buildRecontractCard(renegotiationDue, cumulativeWeek, ctx.money),
    });
  }

  if (ctx.investorPressure) {
    candidates.push({
      priority: 96,
      card: buildInvestorPressureCard(ctx.investorComplianceCount),
    });
  }

  const lowestSatisfaction = [...ctx.members].sort(
    (a, b) => a.satisfaction - b.satisfaction,
  )[0];
  if (
    lowestSatisfaction &&
    lowestSatisfaction.satisfaction <= SATISFACTION_WARNING_THRESHOLD
  ) {
    candidates.push({
      priority: 92 + (SATISFACTION_WARNING_THRESHOLD - lowestSatisfaction.satisfaction),
      card: buildMoraleCard(lowestSatisfaction),
    });
  }

  const runwayWeeks =
    ctx.weeklyFixedTotal > 0 ? ctx.money / ctx.weeklyFixedTotal : Number.POSITIVE_INFINITY;
  const financing = ctx.emergencyFinancing ?? [];
  const outstandingFinancing = financing.filter((record) => record.repaidAtWeek === null);
  const yearStartWeek = Math.floor((cumulativeWeek - 1) / GAME_BALANCE.weeksPerYear) * GAME_BALANCE.weeksPerYear + 1;
  const originationsThisYear = financing.filter(
    (record) => record.borrowedAtWeek >= yearStartWeek,
  ).length;
  const nextRepayment = [...outstandingFinancing].sort(
    (left, right) => left.dueWeek - right.dueWeek,
  )[0];
  if (
    nextRepayment &&
    (nextRepayment.dueWeek - cumulativeWeek <= EMERGENCY_FINANCING.repaymentWarningWeeks ||
      ctx.money >= nextRepayment.repaymentAmount + ctx.weeklyFixedTotal * 12)
  ) {
    candidates.push({
      priority: nextRepayment.dueWeek - cumulativeWeek <= 4 ? 94 : 80,
      card: buildFinancingRepaymentCard(nextRepayment, cumulativeWeek),
    });
  }
  if (
    ctx.money < 0 ||
    runwayWeeks <= DECISION_TRIGGER_THRESHOLDS.financialRunwayWeeks
  ) {
    const rescueAvailable =
      outstandingFinancing.length < EMERGENCY_FINANCING.maxOutstanding &&
      originationsThisYear < EMERGENCY_FINANCING.maxOriginationsPerYear;
    if (rescueAvailable) {
      candidates.push({
        priority: ctx.money < 0 ? 95 : 84,
        card: buildFinancialCrisisCard(ctx.money, runwayWeeks),
      });
    }
  }

  const conflict = ctx.conflicts[0];
  if (conflict) {
    candidates.push({
      priority: 82 + Math.min(10, Math.abs(conflict.chemistry) / 10),
      card: buildConflictCard(conflict),
    });
  }

  if (
    ctx.fandomDisappointment >= DECISION_TRIGGER_THRESHOLDS.fandomDisappointment ||
    (ctx.fandom >= DECISION_TRIGGER_THRESHOLDS.minFandomForLoyaltyIssue &&
      ctx.fandomLoyalty <= DECISION_TRIGGER_THRESHOLDS.lowFandomLoyalty)
  ) {
    candidates.push({
      priority: 78,
      card: buildFandomCrisisCard(ctx.fandomLoyalty, ctx.fandomDisappointment),
    });
  }

  const strategicReviewDue =
    cumulativeWeek >= STRATEGIC_EXPANSION.unlockWeek &&
    (ctx.releasedAlbumCount ?? 0) >= STRATEGIC_EXPANSION.minReleasedAlbums &&
    (ctx.phase === "growth" || ctx.phase === "peak") &&
    (ctx.lastStrategicExpansionWeek == null ||
      cumulativeWeek - ctx.lastStrategicExpansionWeek >=
        STRATEGIC_EXPANSION.reviewIntervalWeeks);
  if (strategicReviewDue) {
    const strategicCard = buildStrategicExpansionCard(
      ctx.strategicExpansion ?? { production: 0, fandom: 0, global: 0 },
    );
    if (strategicCard) candidates.push({ priority: 81, card: strategicCard });
  }

  const overworked = [...ctx.members]
    .filter(
      (member) =>
        member.stress >= DECISION_TRIGGER_THRESHOLDS.highStress &&
        member.id !== injured?.id,
    )
    .sort((a, b) => b.stress - a.stress)[0];
  if (overworked) {
    candidates.push({ priority: 72 + overworked.stress / 10, card: buildOverworkCard(overworked) });
  }

  const crisisCards = candidates
    .sort((a, b) => b.priority - a.priority || a.card.id.localeCompare(b.card.id))
    .slice(0, GAME_BALANCE.weeklyDecisionMaxCount)
    .map(({ card }) => card);

  const opportunity = buildOpportunityCard(
    cumulativeWeek,
    season,
    ctx,
    crisisCards,
  );

  return opportunity
    ? [...crisisCards, opportunity].slice(0, GAME_BALANCE.weeklyDecisionMaxCount)
    : crisisCards;
}

function buildOpportunityCard(
  cumulativeWeek: number,
  season: Season,
  ctx: DecisionCardContext,
  crisisCards: readonly WeeklyDecision[],
): WeeklyDecision | null {
  if (
    crisisCards.length > OPPORTUNITY_PACING.maxConcurrentCrises ||
    crisisCards.some((card) => card.trigger?.severity === "critical")
  ) {
    return null;
  }

  const lastOpportunityWeek = ctx.lastOpportunityWeek ?? 0;
  const cadenceRandom = createSeededRandom(lastOpportunityWeek * 431 + 97);
  const requiredGap =
    OPPORTUNITY_PACING.minGapWeeks +
    Math.floor(
      cadenceRandom() *
        (OPPORTUNITY_PACING.maxGapWeeks - OPPORTUNITY_PACING.minGapWeeks + 1),
    );
  if (cumulativeWeek - lastOpportunityWeek < requiredGap) return null;

  const phasePool = OPPORTUNITY_DEFINITIONS.filter(
    (definition) =>
      definition.phases.includes(ctx.phase) && !definition.requiresRivalComeback,
  );
  const rivalDefinition =
    ctx.competitorComebacks.length > 0
      ? OPPORTUNITY_DEFINITIONS.find(
          (definition) =>
            definition.requiresRivalComeback && definition.phases.includes(ctx.phase),
        )
      : undefined;
  const random = createSeededRandom(
    cumulativeWeek * 419 + season.charCodeAt(0) * 17,
  );
  const definition =
    rivalDefinition ?? phasePool[Math.floor(random() * phasePool.length)];
  if (!definition) return null;

  const rivalNames = ctx.competitorComebacks.join("·") || "라이벌";
  const interpolate = (value: string) => value.replaceAll("{{rival}}", rivalNames);
  const averageStress =
    ctx.members.length > 0
      ? Math.round(
          ctx.members.reduce((sum, member) => sum + member.stress, 0) /
            ctx.members.length,
        )
      : 0;
  const contextWarnings: string[] = [];
  if (averageStress >= OPPORTUNITY_PACING.fatigueWarningStress) {
    contextWarnings.push(`현재 팀 평균 스트레스 ${averageStress}`);
  }
  if (
    ctx.projectDeadlineWeeks !== null &&
    ctx.projectDeadlineWeeks <= OPPORTUNITY_PACING.deadlineWarningWeeks
  ) {
    contextWarnings.push(`핵심 프로젝트 마감 D-${ctx.projectDeadlineWeeks}`);
  }
  const warning =
    contextWarnings.length > 0
      ? ` ${contextWarnings.join(" · ")}라 수락의 기회비용이 크다.`
      : "";

  return {
    id: `opportunity:${definition.id}:w${cumulativeWeek}`,
    lane: "opportunity",
    category: definition.category,
    title: interpolate(definition.title),
    summary: `${interpolate(definition.summary)}${warning}`,
    expiresAtWeek: cumulativeWeek,
    trigger: createTrigger(
      "opportunity",
      "notice",
      [],
      interpolate(definition.triggerDescription),
    ),
    options: definition.options.map((option) => ({
      ...option,
      effects: { ...option.effects },
      ...(option.targetTraineeIds
        ? { targetTraineeIds: [...option.targetTraineeIds] }
        : {}),
      ...(option.targetSelection
        ? { targetSelection: { ...option.targetSelection } }
        : {}),
    })),
  };
}

/**
 * 멤버 재계약 협상(M5). tier·다음 협상 시점 갱신은 weekProcessor가
 * cardId(`recontract:{id}`)를 특수 처리한다 — EffectMap으로는 계약 상태를
 * 표현할 수 없기 때문(emergency-investor와 같은 패턴).
 */
function buildRecontractCard(
  member: DecisionMemberContext,
  cumulativeWeek: number,
  availableMoney: number,
): WeeklyDecision {
  const temperament = member.temperament ?? "steady";
  const popularity = member.popularity ?? 0;
  const contractTier = member.contractTier ?? 1;
  const profile = TEMPERAMENT_PROFILES[temperament];
  const marketSigning =
    MEMBER_CONTRACT.signingBase +
    Math.round(popularity) * MEMBER_CONTRACT.signingPerPopularity;
  const signing = Math.round(
    Math.min(
      marketSigning,
      MEMBER_CONTRACT.signingCashCap,
      Math.max(
        MEMBER_CONTRACT.signingBase,
        Math.max(0, availableMoney) * MEMBER_CONTRACT.signingLiquidityShare,
      ),
    ),
  );
  const freezePenalty = Math.round(
    MEMBER_CONTRACT.freezeSatisfactionPenalty * profile.gapSensitivity,
  );
  const nextTier = Math.min(MEMBER_CONTRACT.maxTier, contractTier + 1);
  const formatSigning = (amount: number) =>
    `${Math.round(amount / 1_000_000).toLocaleString("ko-KR")}백만`;

  return {
    id: `recontract:${member.id}:w${cumulativeWeek}`,
    lane: "crisis",
    category: "계약",
    title: `${member.name} 재계약 협상`,
    summary: `${profile.label} ${member.name}의 처우 협상이 도래했다 (현재 ${contractTier}등급 · 개인 인기 ${Math.round(popularity)}). ${profile.description}.`,
    trigger: {
      kind: "contract",
      severity: temperament === "ambitious" ? "critical" : "warning",
      entityIds: [member.id],
      description: `${member.name} 재계약 협상 도래`,
    },
    options: [
      {
        id: "raise",
        label: "조건 인상",
        description: `처우를 ${nextTier}등급으로 올리고 계약금을 지급한다.`,
        tradeoff: `즉시 계약금 ${formatSigning(signing)}. 인기와 회사의 지급 여력을 함께 반영한다.`,
        effects: { money: -signing, satisfaction: 12 },
        targetTraineeIds: [member.id],
      },
      {
        id: "bonus",
        label: "보너스로 달랜다",
        description: "등급은 유지하되 일시 보너스를 지급한다.",
        tradeoff: "비용은 절반이지만 협상이 절반 주기로 다시 돌아온다.",
        effects: { money: -Math.round(signing / 2), satisfaction: 5 },
        targetTraineeIds: [member.id],
      },
      {
        id: "freeze",
        label: "동결",
        description: "지금 조건을 유지하자고 설득한다.",
        tradeoff: `만족도가 크게 떨어지고(${freezePenalty}) 협상이 반년 안에 다시 돌아온다.`,
        effects: { satisfaction: freezePenalty },
        targetTraineeIds: [member.id],
      },
    ],
  };
}

function buildInjuryCard(member: DecisionMemberContext): WeeklyDecision {
  const targetTraineeIds = [member.id];
  return {
    id: `injury:${member.id}`,
    lane: "crisis",
    category: "부상",
    title: `${member.name} 부상 일정 조정`,
    summary: `${member.name}의 부상이 ${member.injuryWeeks}주 남았다. 이번 주 활동 범위를 결정해야 한다.`,
    trigger: createTrigger(
      "injury",
      member.injuryWeeks >= 3 ? "critical" : "warning",
      targetTraineeIds,
      `${member.name} 부상 ${member.injuryWeeks}주`,
    ),
    options: [
      {
        id: "full-rest",
        label: "완전 휴식",
        description: "모든 일정을 취소하고 회복에 집중한다.",
        tradeoff: "회복은 빠르지만 팀의 대중 노출이 줄어든다.",
        effects: { injuryWeeks: -2, condition: 15, satisfaction: 5, public: -2 },
        targetTraineeIds,
        activityOverride: "vacation",
      },
      {
        id: "partial-activity",
        label: "필수 일정만 참여",
        description: "부담이 적은 일정만 제한적으로 소화한다.",
        tradeoff: "공백은 줄지만 회복이 느리고 스트레스가 남는다.",
        effects: { injuryWeeks: -1, condition: 5, stress: 3, public: -1 },
        targetTraineeIds,
        activityOverride: "rest",
      },
    ],
  };
}

function buildConflictCard(conflict: DecisionConflictContext): WeeklyDecision {
  const targetTraineeIds = [conflict.memberAId, conflict.memberBId];
  return {
    id: `conflict:${conflict.memberAId}:${conflict.memberBId}`,
    lane: "crisis",
    category: "불화",
    title: `${conflict.memberAName}·${conflict.memberBName} 갈등 중재`,
    summary: `두 멤버의 케미가 ${conflict.chemistry}까지 떨어졌다. 팀 효율이 더 악화되기 전에 개입해야 한다.`,
    trigger: createTrigger(
      "conflict",
      conflict.chemistry <= -75 ? "critical" : "warning",
      targetTraineeIds,
      `멤버 케미 ${conflict.chemistry}`,
    ),
    options: [
      {
        id: "mediate",
        label: "전문 중재 진행",
        description: "외부 코치와 함께 갈등의 원인을 조정한다.",
        tradeoff: "비용이 들지만 관계를 가장 크게 회복한다.",
        effects: { money: -12000000, chemistry: 15, satisfaction: 3 },
        targetTraineeIds,
      },
      {
        id: "separate-schedules",
        label: "일정 임시 분리",
        description: "두 멤버의 동선을 나눠 충돌을 줄인다.",
        tradeoff: "긴장은 완화되지만 팀 활동의 화제성이 줄어든다.",
        effects: { chemistry: 6, condition: 3, public: -2 },
        targetTraineeIds,
        activityOverride: "individual",
      },
      {
        id: "ignore",
        label: "자율 해결에 맡기기",
        description: "운영 일정을 그대로 유지한다.",
        tradeoff: "비용은 없지만 갈등과 불만이 더 깊어질 수 있다.",
        effects: { chemistry: -8, satisfaction: -4 },
        targetTraineeIds,
      },
    ],
  };
}

function buildInvestorPressureCard(complianceCount: number): WeeklyDecision {
  const supportAvailable = complianceCount < INVESTOR_COMPLY_SUPPORT_LIMIT;
  return {
    id: "emergency-investor",
    lane: "crisis",
    category: "투자사",
    title: "투자사 경영 개입",
    summary: "투자 조건 미달 또는 누적 압박으로 투자사가 운영 방침 변경을 요구한다.",
    trigger: createTrigger("investor", "critical", [], "투자사 압박 활성"),
    options: [
      {
        id: "comply",
        label: "요구 수용",
        description: "상업 활동을 늘리고 투자사 지표를 우선한다.",
        tradeoff: supportAvailable
          ? "단기 지원금을 받지만 팬 실망과 멤버 피로가 누적된다."
          : "추가 지원금 없이 팬 실망과 멤버 피로만 누적된다.",
        effects: supportAvailable
          ? { money: 20000000, fandomDisappointment: 5, stress: 5, satisfaction: -4 }
          : { fandomDisappointment: 5, stress: 5, satisfaction: -4 },
        activityOverride: "entertainment",
      },
      {
        id: "negotiate",
        label: "조건 재협상",
        description: "기한 연장과 평가 기준 완화를 요청한다.",
        tradeoff: "유예 기간이 2주 늘어나지만 자문 비용과 업계 마찰이 생긴다.",
        effects: { money: -10000000, industry: -2, satisfaction: 2 },
      },
      {
        id: "defy",
        label: "자체 방침 고수",
        description: "지원 축소를 감수하고 팀의 방향성을 지킨다.",
        tradeoff: "멤버와 팬은 안도하지만 현금과 업계 관계가 악화된다.",
        effects: { satisfaction: 5, fandomLoyalty: 3, money: -15000000, industry: -3 },
      },
    ],
  };
}

function buildFinancialCrisisCard(money: number, runwayWeeks: number): WeeklyDecision {
  const runwayLabel = Number.isFinite(runwayWeeks)
    ? `${Math.max(0, runwayWeeks).toFixed(1)}주`
    : "충분";
  return {
    id: "financial-crisis",
    lane: "crisis",
    category: "경영",
    title: "운영 자금 긴급 조정",
    summary: `현재 자금 ${Math.round(money).toLocaleString("ko-KR")}원, 고정비 기준 런웨이 ${runwayLabel}다.`,
    trigger: createTrigger(
      "finance",
      money < 0 ? "critical" : "warning",
      [],
      `현금 런웨이 ${runwayLabel}`,
    ),
    options: [
      {
        id: "emergency-loan",
        label: "긴급 대출",
        description: "운영 자금을 빌려 급한 불을 끈다.",
        tradeoff: `지금 ${EMERGENCY_FINANCING.loan.principal / 1_000_000}백만원을 받고 2년 안에 ${EMERGENCY_FINANCING.loan.repayment / 1_000_000}백만원을 갚아야 한다.`,
        effects: {
          money: EMERGENCY_FINANCING.loan.principal,
          investorPressure: 4,
          industry: -2,
        },
      },
      {
        id: "emergency-investment",
        label: "긴급 추가 투자",
        description: "투자사에 후속 운영 자금을 요청한다.",
        tradeoff: `지금 ${EMERGENCY_FINANCING.investment.principal / 1_000_000}백만원을 받고 2년 안에 ${EMERGENCY_FINANCING.investment.repayment / 1_000_000}백만원을 우선 상환한다.`,
        effects: {
          money: EMERGENCY_FINANCING.investment.principal,
          investorPressure: 8,
          industry: -4,
          satisfaction: -2,
        },
      },
      {
        id: "austerity",
        label: "운영비 긴축",
        description: "일부 지원과 복지 예산을 현금화한다.",
        tradeoff: "소액을 확보하지만 멤버 만족도와 평판이 하락한다.",
        effects: { money: 10000000, satisfaction: -5, industry: -1 },
      },
    ],
  };
}

function buildFinancingRepaymentCard(
  financing: EmergencyFinancingRecord,
  cumulativeWeek: number,
): WeeklyDecision {
  const remainingWeeks = Math.max(0, financing.dueWeek - cumulativeWeek);
  return {
    id: `financing-repayment:${financing.id}`,
    lane: "crisis",
    category: "경영",
    title: financing.kind === "loan" ? "긴급 대출 상환" : "추가 투자금 상환",
    summary: `상환액 ${Math.round(financing.repaymentAmount).toLocaleString("ko-KR")}원, 만기까지 ${remainingWeeks}주 남았다.`,
    trigger: createTrigger(
      "finance",
      remainingWeeks <= 4 ? "critical" : "warning",
      [],
      `상환 만기 D-${remainingWeeks}주`,
    ),
    options: [
      {
        id: "repay",
        label: "지금 상환",
        description: "원금과 약정 비용을 상환해 긴급 조달 한도를 회복한다.",
        tradeoff: "현금이 줄지만 미상환 슬롯 한 칸이 다시 열린다.",
        effects: { money: -financing.repaymentAmount, industry: 2 },
      },
      {
        id: "defer",
        label: "만기까지 보류",
        description: "현금을 지키고 상환을 뒤로 미룬다.",
        tradeoff: "만기에는 자동 상환되며 투자사 압박이 이어진다.",
        effects: { investorPressure: 2 },
      },
    ],
  };
}

function buildFandomCrisisCard(
  fandomLoyalty: number,
  fandomDisappointment: number,
): WeeklyDecision {
  return {
    id: "fandom-crisis",
    lane: "crisis",
    category: "팬덤",
    title: "팬덤 신뢰 회복",
    summary: `팬덤 충성도 ${fandomLoyalty}, 실망도 ${fandomDisappointment}. 이탈이 커지기 전에 대응해야 한다.`,
    trigger: createTrigger(
      "fandom",
      fandomDisappointment >= 70 ? "critical" : "warning",
      [],
      `충성도 ${fandomLoyalty} · 실망도 ${fandomDisappointment}`,
    ),
    options: [
      {
        id: "apology",
        label: "공식 소통과 보상",
        description: "입장문과 팬 보상 프로그램을 즉시 진행한다.",
        tradeoff: "비용이 들지만 실망도를 가장 직접적으로 낮춘다.",
        effects: { money: -15000000, fandomDisappointment: -12, fandomLoyalty: 4 },
      },
      {
        id: "fan-event",
        label: "팬 소통 행사",
        description: "멤버 전원이 참여하는 소규모 행사를 연다.",
        tradeoff: "팬덤은 회복되지만 비용과 컨디션을 소모한다.",
        effects: { money: -25000000, fandom: 5, fandomLoyalty: 8, condition: -4 },
        activityOverride: "entertainment",
      },
      {
        id: "wait",
        label: "활동으로 만회",
        description: "별도 대응 없이 다음 결과물에 집중한다.",
        tradeoff: "돈은 지키지만 당장의 팬 실망이 더 커진다.",
        effects: { fandomDisappointment: 7, public: -2 },
      },
    ],
  };
}

function buildStrategicExpansionCard(
  levels: StrategicExpansionLevels,
): WeeklyDecision | null {
  const optionDefinitions = [
    {
      track: "production" as const,
      label: "자체 제작 스튜디오 확장",
      description: "곡, 안무, 비주얼 제작 역량을 회사 안에 축적합니다.",
      effects: { albumSong: 6, albumVisual: 3, albumChoreography: 4, industry: 3 },
    },
    {
      track: "fandom" as const,
      label: "팬 커뮤니티 플랫폼 확장",
      description: "팬과 꾸준히 소통하고 직접 수익을 만드는 기반을 넓힙니다.",
      effects: { fandom: 8, fandomLoyalty: 8, fandomDisappointment: -10, public: 3 },
    },
    {
      track: "global" as const,
      label: "글로벌 투어 본부 확장",
      description: "해외 공연과 현지 파트너 협상을 전담하는 기반을 만듭니다.",
      effects: { global: 10, industry: 6, public: 2 },
    },
  ];
  const options = optionDefinitions.flatMap((definition) => {
    const currentLevel = levels[definition.track];
    if (currentLevel >= STRATEGIC_EXPANSION.maxLevelPerTrack) return [];
    const cost = STRATEGIC_EXPANSION.levelCosts[currentLevel];
    return [
      {
        id: `strategic-${definition.track}`,
        label: definition.label,
        description: `${definition.description} ${currentLevel + 1}단계 투자금 ${Math.round(cost / 100_000_000)}억원이 필요합니다.`,
        tradeoff: "성과가 커지는 대신 매주 운영비가 추가됩니다.",
        effects: { ...definition.effects, money: -cost },
      },
    ];
  });
  if (options.length === 0) return null;

  return {
    id: "strategic-expansion",
    lane: "crisis",
    category: "장기 성장",
    title: "다음 성장을 위한 회사 역량",
    summary:
      "지금의 성공만 반복해서는 성장세를 유지하기 어렵습니다. 다음 1년을 이끌 장기 역량을 선택해 투자해야 합니다.",
    options,
    trigger: {
      kind: "strategy",
      severity: "notice",
      entityIds: [],
      description: "성장 이후의 추가 과제",
    },
  };
}

function buildMoraleCard(member: DecisionMemberContext): WeeklyDecision {
  const targetTraineeIds = [member.id];
  return {
    id: `morale:${member.id}`,
    lane: "crisis",
    category: "멤버",
    title: `${member.name} 이탈 위험`,
    summary: `${member.name}의 만족도가 ${member.satisfaction}까지 떨어졌다. 불만을 방치하면 이탈로 이어질 수 있다.`,
    trigger: createTrigger(
      "morale",
      member.satisfaction <= 15 ? "critical" : "warning",
      targetTraineeIds,
      `${member.name} 만족도 ${member.satisfaction}`,
    ),
    options: [
      {
        id: "private-meeting",
        label: "개별 면담과 일정 조정",
        description: "불만의 원인을 듣고 이번 주 부담을 낮춘다.",
        tradeoff: "팀 일정 일부를 포기하지만 만족도와 스트레스가 회복된다.",
        effects: { satisfaction: 10, stress: -6, chemistry: 3, public: -1 },
        targetTraineeIds,
        activityOverride: "rest",
      },
      {
        id: "reward",
        label: "보너스와 특별 휴식",
        description: "즉시 체감할 수 있는 보상과 휴식을 제공한다.",
        tradeoff: "바로 숨을 돌릴 수 있지만 운영 자금이 줄어든다.",
        effects: { satisfaction: 8, condition: 6, money: -10000000 },
        targetTraineeIds,
        activityOverride: "vacation",
      },
      {
        id: "pressure",
        label: "프로 의식 강조",
        description: "계약과 팀 책임을 근거로 일정 준수를 요구한다.",
        tradeoff: "일정은 지키지만 이탈 위험과 스트레스가 커진다.",
        effects: { satisfaction: -6, stress: 8, public: 2 },
        targetTraineeIds,
      },
    ],
  };
}

function buildOverworkCard(member: DecisionMemberContext): WeeklyDecision {
  const targetTraineeIds = [member.id];
  return {
    id: `overwork:${member.id}`,
    lane: "crisis",
    category: "과로",
    title: `${member.name} 과로 경고`,
    summary: `${member.name}의 스트레스가 ${member.stress}다. 부상이나 만족도 하락 전에 일정을 조정해야 한다.`,
    trigger: createTrigger(
      "overwork",
      member.stress >= 90 ? "critical" : "warning",
      targetTraineeIds,
      `${member.name} 스트레스 ${member.stress}`,
    ),
    options: [
      {
        id: "cancel-schedule",
        label: "이번 주 일정 취소",
        description: "개인 일정을 모두 비우고 회복시킨다.",
        tradeoff: "충분히 회복할 수 있지만 이번 주 대중 노출을 포기한다.",
        effects: { stress: -18, condition: 10, satisfaction: 4, public: -2 },
        targetTraineeIds,
        activityOverride: "vacation",
      },
      {
        id: "medical-support",
        label: "의료·컨디셔닝 지원",
        description: "전문 인력을 투입해 일정을 유지하며 회복을 돕는다.",
        tradeoff: "비용이 들지만 활동 공백을 줄인다.",
        effects: { money: -8000000, stress: -10, condition: 5 },
        targetTraineeIds,
        activityOverride: "rest",
      },
      {
        id: "push-through",
        label: "핵심 일정 강행",
        description: "현재 관심이 식기 전에 일정을 소화한다.",
        tradeoff: "인지도는 오르지만 부상 위험과 불만이 커진다.",
        effects: { public: 3, stress: 8, condition: -6, satisfaction: -5 },
        targetTraineeIds,
        activityOverride: "individual",
      },
    ],
  };
}

function createTrigger(
  kind: WeeklyDecisionTrigger["kind"],
  severity: WeeklyDecisionTrigger["severity"],
  entityIds: string[],
  description: string,
): WeeklyDecisionTrigger {
  return { kind, severity, entityIds, description };
}
