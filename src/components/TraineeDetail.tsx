import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { DecisionImpactChips } from "@/components/dashboard/DecisionImpactChips";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
import { SpeakerBubble } from "@/components/visual/SpeakerBubble";
import { hashSeed, MEMBER_VOICE_LINES, pickLine } from "@/data/voiceLines";
import { useGameStore } from "@/stores/gameStore";
import { weeklyFlowSelectors } from "@/stores/weeklyFlowSelectors";
import { traitLabels } from "@/data/memberTraits";
import {
  ALL_POSITIONS,
  calculatePositionFitness,
  POSITION_LABELS,
  positionFitnessToRating,
  potentialToStars,
} from "@/data/founding";
import { STAT_KEYS, STAT_LABELS, statBarColor } from "@/data/traineeStats";
import { getEffectiveSatisfaction } from "@/systems/satisfactionSystem";
import { CHEMISTRY_CONFLICT_THRESHOLD } from "@/data/balance";
import type { Trainee } from "@/types/game";
import { withJosa } from "@/utils/josa";

interface TraineeDetailProps {
  trainee: Trainee;
  trainees: readonly Trainee[];
  dormLevel: 1 | 2 | 3 | 4;
  livingExpenseLevel: 1 | 2 | 3 | 4;
  onClose: () => void;
}

type DetailTab = "stats" | "relations" | "condition";

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: "stats", label: "능력치" },
  { key: "relations", label: "관계" },
  { key: "condition", label: "상태" },
];

// 레이더 차트는 viewBox 좌표계로 그리고, 실제 크기는 CSS 폭에 맡긴다.
// VIEW_HALF는 라벨 텍스트까지 잘리지 않도록 라벨 반경보다 넉넉히 잡는다.
const RADAR_RADIUS = 80;
const RADAR_LABEL_OFFSET = 100;
const RADAR_VIEW_HALF = 132;

function statTone(value: number): string {
  if (value >= 61) return "text-state-success";
  if (value >= 31) return "text-state-warning";
  return "text-state-danger";
}

function fitnessTone(value: number): string {
  if (value >= 70) return "border-state-success/40 bg-state-success/10 text-state-success";
  if (value >= 40) return "border-state-warning/40 bg-state-warning/10 text-state-warning";
  return "border-state-danger/40 bg-state-danger/10 text-state-danger";
}

function chemistryTone(value: number): string {
  if (value >= 30) return "text-state-success";
  if (value > 0) return "text-state-success/80";
  if (value > CHEMISTRY_CONFLICT_THRESHOLD) return "text-text-muted";
  return "text-state-danger";
}

// 케미 내부 수치는 노출하지 않는다. 관계의 온도만 전한다.
function chemistryLabel(value: number): string {
  if (value >= 30) return "합이 잘 맞습니다";
  if (value > 0) return "원만합니다";
  if (value > CHEMISTRY_CONFLICT_THRESHOLD) return "데면데면합니다";
  return "사이가 좋지 않습니다";
}

function pickComment(
  trainee: Trainee,
  effectiveSatisfaction: number,
  conflictPartner: string | null,
): string {
  if (conflictPartner) {
    return `${withJosa(conflictPartner, "이랑/랑")} 좀 힘들어요…`;
  }
  if (trainee.injuryWeeks > 0) {
    return "빨리 복귀할게요…";
  }
  if (trainee.stress >= 75) {
    return "좀 쉬고 싶어요…";
  }
  if (effectiveSatisfaction >= 70) {
    const high = ["오늘 컨디션 최고예요!", "이 컨셉 너무 좋아요!"];
    return high[trainee.id.length % high.length];
  }
  if (effectiveSatisfaction >= 40) {
    const mid = ["열심히 할게요", "좀 더 쉬고 싶긴 한데…"];
    return mid[trainee.id.length % mid.length];
  }
  const low = [
    "저 이거 계속 해야 하나요…",
    "좀 쉬고 싶어요…",
    "회사가 절 신경 써주긴 하나요?",
  ];
  return low[trainee.id.length % low.length];
}

function buildRadarPath(values: number[], radius: number): string {
  const angleStep = (Math.PI * 2) / values.length;
  return values
    .map((v, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = (v / 100) * radius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

export function TraineeDetail({
  trainee,
  trainees,
  dormLevel,
  livingExpenseLevel,
  onClose,
}: TraineeDetailProps) {
  const [tab, setTab] = useState<DetailTab>("stats");
  const flow = useGameStore(weeklyFlowSelectors.flow);
  const weeklyDecisions = useGameStore((state) => state.weeklyDecisions);
  const currentWeek = useGameStore((state) => state.currentWeek);
  const selectWeeklyDecision = useGameStore(
    (state) => state.selectWeeklyDecision,
  );
  const confirmWeeklyDecision = useGameStore(
    (state) => state.confirmWeeklyDecision,
  );

  // 이 멤버가 원인인 이번 주 안건. 계획 단계에서만 여기서 바로 처리할 수 있다.
  const isPlanningPhase =
    flow.state === "planning_ready" ||
    flow.state === "planning_active" ||
    flow.state === "review_ready";
  const skippedIds = new Set(flow.skippedDecisionIds ?? []);
  const confirmedIds = new Set(flow.confirmedDecisionIds ?? []);
  const memberDecisions = isPlanningPhase
    ? weeklyDecisions.filter(
        (card) =>
          !skippedIds.has(card.id) &&
          card.trigger?.entityIds.includes(trainee.id),
      )
    : [];

  const radarPath = useMemo(
    () =>
      buildRadarPath(
        STAT_KEYS.map((k) => trainee.stats[k]),
        RADAR_RADIUS,
      ),
    [trainee],
  );

  const effectiveSatisfaction = getEffectiveSatisfaction(
    trainee.satisfaction,
    dormLevel,
    livingExpenseLevel,
  );

  const otherTrainees = trainees.filter((t) => t.id !== trainee.id);
  const chemistryEntries = otherTrainees
    .map((other) => ({
      id: other.id,
      name: other.name,
      value: trainee.chemistry[other.id] ?? 0,
    }))
    .sort((a, b) => b.value - a.value);

  const conflictPartner = chemistryEntries.find(
    (e) => e.value < CHEMISTRY_CONFLICT_THRESHOLD,
  );

  const comment = pickComment(
    trainee,
    effectiveSatisfaction,
    conflictPartner ? conflictPartner.name : null,
  );

  const voiceSeed = hashSeed(`detail:${trainee.id}:${currentWeek}`);
  const attentionStatusLine =
    trainee.injuryWeeks > 0
      ? pickLine(MEMBER_VOICE_LINES.injured, voiceSeed)
      : trainee.condition < 50 || trainee.stress >= 75
        ? pickLine(MEMBER_VOICE_LINES.tired, voiceSeed)
        : comment;

  const angleStep = (Math.PI * 2) / STAT_KEYS.length;

  return (
    <Modal title={trainee.name} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <MemberPortrait traineeId={trainee.id} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-text-primary">
              {trainee.name}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {trainee.position
                ? POSITION_LABELS[trainee.position]
                : "포지션 미배정"}
            </p>
            <p
              className="mt-0.5 text-xs text-text-muted"
              title="트레이너들이 가늠한 잠재력입니다"
            >
              잠재력 {"★".repeat(potentialToStars(trainee.potential))}
              {"☆".repeat(5 - potentialToStars(trainee.potential))}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {traitLabels(trainee)
                .slice(0, 3)
                .map((label) => (
                  <span
                    key={label}
                    className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-text-muted"
                  >
                    {label}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {memberDecisions.length > 0 ? (
          <section
            aria-label="관리 필요 안건"
            className="space-y-3 rounded-3xl bg-state-danger/[0.06] p-3.5 ring-1 ring-state-danger/25 [word-break:keep-all]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200">
              관리 필요
            </p>
            <SpeakerBubble
              portrait={<MemberPortrait traineeId={trainee.id} size="md" />}
              name={trainee.name}
              role={
                trainee.position ? POSITION_LABELS[trainee.position] : undefined
              }
              tone="warning"
            >
              {attentionStatusLine}
            </SpeakerBubble>

            {memberDecisions.map((card) => {
              const selectedOptionId = flow.selectedDecisionIds[card.id] ?? null;
              const selectedOption = card.options.find(
                (option) => option.id === selectedOptionId,
              );
              const isConfirmed =
                confirmedIds.has(card.id) && Boolean(selectedOption);
              const needsTargetPick = Boolean(selectedOption?.targetSelection);

              return (
                <div key={card.id} className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {card.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-text-secondary">
                      {card.summary}
                    </p>
                  </div>

                  <div
                    aria-label={`${card.title} 대응 선택`}
                    className="space-y-2"
                    role="radiogroup"
                  >
                    {card.options.map((option) => {
                      const isSelected = selectedOptionId === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={[
                            "w-full rounded-2xl border-2 px-3 py-3 text-left",
                            "transition-[scale,background-color,border-color,box-shadow] duration-[var(--motion-state)] ease-out active:scale-[0.96]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-secondary",
                            radioTileClasses(
                              isSelected,
                              selectedOptionId !== null,
                            ),
                          ].join(" ")}
                          onClick={() => selectWeeklyDecision(card.id, option.id)}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className={[
                                "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                                isSelected
                                  ? "border-brand-cyan bg-brand-cyan text-slate-950"
                                  : "border-white/30 bg-white/[0.06] text-transparent",
                              ].join(" ")}
                            >
                              <Check className="size-3.5" strokeWidth={3} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-base font-semibold leading-6 text-text-primary">
                                {option.label}
                              </span>
                              <DecisionImpactChips
                                option={option}
                                className="mt-2"
                              />
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {isConfirmed ? (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-state-success">
                      <Check className="size-3.5" aria-hidden="true" />
                      이번 주 계획에 반영했습니다
                    </p>
                  ) : needsTargetPick ? (
                    <p className="text-xs text-text-muted">
                      참여 멤버 선택이 필요한 안건이라 '이번 주' 탭에서
                      마무리해 주세요.
                    </p>
                  ) : (
                    <Button
                      className="w-full"
                      tone="secondary"
                      isDisabled={selectedOptionId === null}
                      onPress={() => confirmWeeklyDecision(card.id)}
                    >
                      {selectedOptionId === null
                        ? "대응을 선택해 주세요"
                        : "이 대응으로 확정"}
                    </Button>
                  )}
                </div>
              );
            })}
          </section>
        ) : null}

        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="멤버 상세 보기">
          {DETAIL_TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.key)}
                className={[
                  "min-h-11 rounded-xl border text-sm transition duration-150 ease-out active:scale-[0.96]",
                  active ? "text-text-primary" : "text-text-secondary",
                  radioTileClasses(active, true),
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "stats" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                viewBox={`-${RADAR_VIEW_HALF} -${RADAR_VIEW_HALF} ${RADAR_VIEW_HALF * 2} ${RADAR_VIEW_HALF * 2}`}
                className="h-auto w-full max-w-60"
                role="img"
                aria-label="능력치 레이더 차트"
              >
                {[0.25, 0.5, 0.75, 1].map((scale) => (
                  <polygon
                    key={scale}
                    points={STAT_KEYS.map((_, i) => {
                      const a = -Math.PI / 2 + i * angleStep;
                      const r = RADAR_RADIUS * scale;
                      return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
                    }).join(" ")}
                    fill="none"
                    stroke="var(--color-panel-border)"
                    strokeWidth={1}
                  />
                ))}
                {STAT_KEYS.map((_, i) => {
                  const a = -Math.PI / 2 + i * angleStep;
                  const x2 = (Math.cos(a) * RADAR_RADIUS).toFixed(1);
                  const y2 = (Math.sin(a) * RADAR_RADIUS).toFixed(1);
                  return (
                    <line
                      key={i}
                      x1={0}
                      y1={0}
                      x2={x2}
                      y2={y2}
                      stroke="var(--color-panel-border)"
                      strokeWidth={1}
                    />
                  );
                })}
                <path
                  d={radarPath}
                  fill="rgba(236,72,153,0.32)"
                  stroke="var(--color-action-primary)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {STAT_KEYS.map((key, i) => {
                  const a = -Math.PI / 2 + i * angleStep;
                  const lx = Math.cos(a) * RADAR_LABEL_OFFSET;
                  const ly = Math.sin(a) * RADAR_LABEL_OFFSET;
                  return (
                    <text
                      key={key}
                      x={lx}
                      y={ly}
                      fill="var(--color-text-secondary)"
                      fontSize="11"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {STAT_LABELS[key]} {Math.round(trainee.stats[key])}
                    </text>
                  );
                })}
              </svg>
            </div>

            <section className="space-y-2">
              <p className="text-sm text-text-secondary">포지션 적합도</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_POSITIONS.map((pos) => {
                  const fitness = calculatePositionFitness(trainee.stats, pos);
                  return (
                    <div
                      key={pos}
                      className={[
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-xs",
                        fitnessTone(fitness),
                      ].join(" ")}
                    >
                      <span>{POSITION_LABELS[pos]}</span>
                      <span className="font-medium">
                        {"★".repeat(positionFitnessToRating(fitness))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {tab === "relations" && (
          <div className="space-y-4">
            <section className="space-y-2">
              <p className="text-sm text-text-secondary">케미 관계도</p>
              {chemistryEntries.length === 0 ? (
                <p className="text-xs text-text-muted">
                  다른 멤버 정보가 없습니다.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {chemistryEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-surface-shell/70 px-3 py-2 text-xs"
                    >
                      <span className="text-text-secondary">{entry.name}</span>
                      <span className={chemistryTone(entry.value)}>
                        {chemistryLabel(entry.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 컨셉과의 어울림은 수치로 알려주지 않는다. 특성을 보고 추측하고,
                발매 결과의 반응으로 확인하는 것이 컨텐츠다. */}
            <section className="space-y-2">
              <p className="text-sm text-text-secondary">특성</p>
              <div className="flex flex-wrap gap-2">
                {traitLabels(trainee).map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-action-primary/30 bg-action-primary/10 px-2.5 py-1 text-xs text-pink-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="text-[11px] leading-4 text-text-muted [word-break:keep-all]">
                어떤 컨셉과 만났을 때 빛나는지는 무대가 말해줍니다.
              </p>
            </section>
          </div>
        )}

        {tab === "condition" && (
          <div className="space-y-4">
            <section className="space-y-2 text-[11px]">
              {[
                {
                  label: "만족도",
                  value: effectiveSatisfaction,
                  hint: `기본 ${Math.round(trainee.satisfaction)}`,
                },
                { label: "컨디션", value: trainee.condition, hint: null },
                { label: "스트레스", value: trainee.stress, hint: null },
              ].map(({ label, value, hint }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>{label}</span>
                    <span className={statTone(value)}>
                      {Math.round(value)}
                      {hint && (
                        <span className="ml-2 text-text-muted">({hint})</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-shell">
                    <div
                      className={["h-full rounded-full", statBarColor(value)].join(
                        " ",
                      )}
                      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-pink-200">
                한마디
              </p>
              <SpeakerBubble
                portrait={<MemberPortrait traineeId={trainee.id} size="md" />}
                name={trainee.name}
                role={
                  trainee.position
                    ? POSITION_LABELS[trainee.position]
                    : undefined
                }
                tone={
                  conflictPartner ||
                  trainee.injuryWeeks > 0 ||
                  trainee.stress >= 75 ||
                  effectiveSatisfaction < 40
                    ? "warning"
                    : "default"
                }
              >
                {comment}
              </SpeakerBubble>
            </section>
          </div>
        )}
      </div>
    </Modal>
  );
}
