import { useState } from "react";
import {
  Check,
  ChevronLeft,
  Clock3,
  Play,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/common/Button";
import { DecisionImpactChips } from "@/components/dashboard/DecisionImpactChips";
import {
  checkTileClasses,
  radioTileClasses,
} from "@/components/common/selectionTokens";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
import { SceneThumb } from "@/components/visual/SceneThumb";
import { SpeakerBubble } from "@/components/visual/SpeakerBubble";
import { StaffPortrait } from "@/components/visual/StaffPortrait";
import { POSITION_LABELS } from "@/data/founding";
import { hashSeed, MANAGER_BRIEFING_LINES, pickLine } from "@/data/voiceLines";
import { useGameStore } from "@/stores/gameStore";
import { useTraineeStore } from "@/stores/traineeStore";
import {
  isWeeklyDecisionComplete,
  weeklyFlowSelectors,
} from "@/stores/weeklyFlowSelectors";
import { useManagerPersona } from "@/utils/managerPersona";
import { sceneForDecisionCategory } from "@/utils/sceneMapping";
import type { WeeklyDecision, WeeklyDecisionTrigger } from "@/types/game";

const TRIGGER_LABELS: Record<WeeklyDecisionTrigger["severity"], string> = {
  notice: "주의",
  warning: "경고",
  critical: "긴급",
};

const TRIGGER_TONE_CLASSES: Record<WeeklyDecisionTrigger["severity"], string> = {
  notice: "bg-state-info/10 text-sky-100",
  warning: "bg-state-warning/10 text-amber-100",
  critical: "bg-state-danger/10 text-rose-100",
};

const LANE_LABELS = {
  crisis: "필수 대응",
  opportunity: "선택 기회",
} as const;

const LANE_CLASSES = {
  crisis: "bg-state-danger/10 text-rose-100",
  opportunity: "bg-action-secondary/12 text-cyan-100",
} as const;

function decisionToneClasses(card: WeeklyDecision): string {
  if (card.lane === "opportunity") return LANE_CLASSES.opportunity;
  return card.trigger
    ? TRIGGER_TONE_CLASSES[card.trigger.severity]
    : LANE_CLASSES.crisis;
}

function conciseDecisionTitle(card: WeeklyDecision): string {
  switch (card.trigger?.kind) {
    case "injury":
    case "finance":
    case "fandom":
    case "morale":
    case "overwork":
      return card.trigger.description;
    case "contract":
      return card.title.replace(" 협상", "");
    case "conflict":
      return card.title.replace(" 중재", "");
    case "investor":
      return "투자사 개입 요구";
    default:
      return card.title;
  }
}

interface DecisionCardDeckProps {
  onConfirm: () => void;
  isRunning?: boolean;
}

export function DecisionCardDeck({
  onConfirm,
  isRunning = false,
}: DecisionCardDeckProps) {
  const cards = useGameStore((state) => state.weeklyDecisions);
  const flow = useGameStore(weeklyFlowSelectors.flow);
  const currentWeek = useGameStore((state) => state.currentWeek);
  const trainees = useTraineeStore((state) => state.trainees);
  const manager = useManagerPersona();
  const canResolveWeek = useGameStore(weeklyFlowSelectors.canResolveWeek);
  const selectWeeklyDecision = useGameStore((state) => state.selectWeeklyDecision);
  const setWeeklyDecisionTargets = useGameStore(
    (state) => state.setWeeklyDecisionTargets,
  );
  const confirmWeeklyDecision = useGameStore(
    (state) => state.confirmWeeklyDecision,
  );
  const skipWeeklyDecision = useGameStore((state) => state.skipWeeklyDecision);
  const skippedDecisionIds = new Set(flow.skippedDecisionIds ?? []);
  const confirmedDecisionIds = new Set(flow.confirmedDecisionIds ?? []);
  const [activeIndex, setActiveIndex] = useState(() => {
    const firstIncomplete = cards.findIndex(
      (card) =>
        !skippedDecisionIds.has(card.id) &&
        (!confirmedDecisionIds.has(card.id) ||
          !isWeeklyDecisionComplete(card, flow)),
    );
    return firstIncomplete >= 0
      ? firstIncomplete
      : Math.max(cards.length - 1, 0);
  });
  const showReview = cards.length === 0;
  const safeIndex = Math.min(activeIndex, Math.max(cards.length - 1, 0));
  const activeCard = cards[safeIndex];
  const activeTitle = activeCard ? conciseDecisionTitle(activeCard) : "";
  const selectedOptionId = activeCard
    ? flow.selectedDecisionIds[activeCard.id] ?? null
    : null;
  const selectedOption = activeCard?.options.find(
    (option) => option.id === selectedOptionId,
  );
  const targetSelection = selectedOption?.targetSelection ?? null;
  const selectedTargets = activeCard
    ? flow.selectedTargetTraineeIds[activeCard.id] ?? []
    : [];
  const targetCountValid = targetSelection
    ? selectedTargets.length >= targetSelection.min &&
      selectedTargets.length <= targetSelection.max
    : true;
  const completedCardCount = cards.filter((card) => {
    if (skippedDecisionIds.has(card.id)) return true;
    if (!confirmedDecisionIds.has(card.id)) return false;
    const option = card.options.find(
      (candidate) => candidate.id === flow.selectedDecisionIds[card.id],
    );
    if (!option) return false;
    if (!option.targetSelection) return true;
    const targets = flow.selectedTargetTraineeIds[card.id] ?? [];
    return (
      targets.length >= option.targetSelection.min &&
      targets.length <= option.targetSelection.max
    );
  }).length;

  const finishActiveCard = () => {
    if (!activeCard) return;
    confirmWeeklyDecision(activeCard.id);
    if (safeIndex >= cards.length - 1) {
      onConfirm();
      return;
    }
    setActiveIndex(safeIndex + 1);
  };

  const handleSelect = (optionId: string) => {
    if (!activeCard) return;

    selectWeeklyDecision(activeCard.id, optionId);
  };

  const toggleTarget = (traineeId: string) => {
    if (!activeCard || !targetSelection) return;
    const selected = selectedTargets.includes(traineeId);
    setWeeklyDecisionTargets(
      activeCard.id,
      selected
        ? selectedTargets.filter((id) => id !== traineeId)
        : [...selectedTargets, traineeId],
    );
  };

  const handleSkipOpportunity = () => {
    if (!activeCard || activeCard.lane !== "opportunity") return;
    skipWeeklyDecision(activeCard.id);
    if (safeIndex >= cards.length - 1) {
      onConfirm();
      return;
    }
    setActiveIndex(safeIndex + 1);
  };

  if (showReview) {
    return (
      <section className="space-y-4 [word-break:keep-all]" aria-labelledby="weekly-review-title">
        <header>
          <h2 id="weekly-review-title" className="text-xl font-semibold text-text-primary">
            이번 주 계획
          </h2>
        </header>

        <SpeakerBubble
          portrait={
            <StaffPortrait
              profileImagePath={manager.profileImagePath}
              profileSpriteIndex={manager.profileSpriteIndex}
              size="md"
            />
          }
          name={manager.name}
          role={manager.roleLabel}
          tone={cards.some((card) => card.lane === "crisis") ? "warning" : "accent"}
        >
          {pickLine(
            cards.length === 0
              ? MANAGER_BRIEFING_LINES.noCards
              : cards.some((card) => card.lane === "crisis")
                ? MANAGER_BRIEFING_LINES.hasCrisis
                : MANAGER_BRIEFING_LINES.hasOpportunity,
            hashSeed(`briefing:${currentWeek}`),
          )}
        </SpeakerBubble>

        <article className="rounded-3xl bg-action-secondary/[0.07] p-4 shadow-[var(--shadow-surface)]">
          <p className="text-sm font-semibold text-cyan-100">직접 결정할 일 없음</p>
          <p className="mt-2 text-pretty text-sm leading-6 text-text-muted">
            이번 주는 직접 챙길 긴급 사안이 없습니다.
          </p>
        </article>

        <div className="space-y-2">
          <Button
            className="w-full gap-2"
            isDisabled={!canResolveWeek || isRunning}
            onPress={onConfirm}
          >
            <Play className="ml-0.5 size-4" aria-hidden="true" />
            {isRunning ? "이번 주 일정 진행 중…" : "이번 주 진행"}
          </Button>
          <p className="text-center text-[11px] text-text-muted">
            확정하면 이 일정대로 한 주가 시작됩니다.
          </p>
        </div>
      </section>
    );
  }

  if (!activeCard) return null;

  return (
    <section className="space-y-3 [word-break:keep-all]" aria-labelledby={`decision-${activeCard.id}`}>
      <header>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-action-primary">
            이번 주 안건{" "}
            <span className="tabular-nums text-pink-100">
              {safeIndex + 1}/{cards.length}
            </span>
          </p>
          <span className="sr-only">
            {safeIndex + 1} / {cards.length}
          </span>
        </div>
        <div
          className="mt-2 flex gap-1"
          role="progressbar"
          aria-label="안건 진행"
          aria-valuemin={0}
          aria-valuemax={cards.length}
          aria-valuenow={completedCardCount}
        >
          {cards.map((card, index) => {
            const option = card.options.find(
              (candidate) => candidate.id === flow.selectedDecisionIds[card.id],
            );
            const targets = flow.selectedTargetTraineeIds[card.id] ?? [];
            const isComplete =
              skippedDecisionIds.has(card.id) ||
              (confirmedDecisionIds.has(card.id) &&
                Boolean(
                  option &&
                    (!option.targetSelection ||
                      (targets.length >= option.targetSelection.min &&
                        targets.length <= option.targetSelection.max)),
                ));
            return (
              <span
                key={card.id}
                aria-hidden="true"
                className={`h-1.5 flex-1 rounded-full ${
                  isComplete
                    ? "bg-action-primary"
                    : index === safeIndex
                      ? "bg-white/35"
                      : "bg-white/10"
                }`}
              />
            );
          })}
        </div>
      </header>

      <article
        className={`rounded-3xl p-3.5 shadow-[var(--shadow-raised)] ${
          activeCard.lane === "opportunity"
            ? "bg-gradient-to-br from-cyan-950/90 to-surface-raised"
            : "bg-surface-raised"
        }`}
      >
        <SceneThumb
          scene={sceneForDecisionCategory(activeCard.category)}
          variant="banner"
          label={null}
          className="mb-3 [height:5rem] outline outline-1 -outline-offset-1 outline-white/10 sm:[height:6rem]"
        />
        <div>
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${decisionToneClasses(activeCard)}`}>
              {activeCard.lane === "opportunity" ? (
                <Sparkles className="size-3" aria-hidden="true" />
              ) : (
                <ShieldAlert className="size-3" aria-hidden="true" />
              )}
              {LANE_LABELS[activeCard.lane]}
              {activeCard.trigger
                ? ` · ${
                    activeCard.lane === "opportunity"
                      ? "이번 주 한정"
                      : TRIGGER_LABELS[activeCard.trigger.severity]
                  }`
                : ""}
            </span>
            <h2
              id={`decision-${activeCard.id}`}
              className="mt-1.5 text-balance text-lg font-semibold text-text-primary"
            >
              {activeTitle}
            </h2>
          </div>
        </div>

        {!activeCard.trigger ? (
          <p className="mt-2.5 text-pretty text-sm leading-5 text-text-secondary">
            {activeCard.summary}
          </p>
        ) : null}

        <RadioGroup
          aria-label={`${activeTitle} 선택지`}
          value={selectedOptionId}
          onChange={handleSelect}
          className="mt-3 grid gap-2"
        >
          {activeCard.options.map((option) => (
            <Radio
              key={option.id}
              value={option.id}
              className={({ isFocusVisible, isPressed, isSelected }) =>
                [
                  // block 필수 — react-aria Radio는 label(inline)로 렌더되어
                  // border·패딩이 라인 박스 단위로 쪼개질 수 있다.
                  "group block min-h-16 rounded-2xl border-2 px-3 py-2.5",
                  "transition-[scale,background-color,border-color,box-shadow,opacity] duration-[var(--motion-state)] ease-out",
                  radioTileClasses(isSelected, Boolean(selectedOptionId)),
                  isPressed ? "scale-[0.96]" : "scale-100",
                  isFocusVisible
                    ? "outline-2 outline-offset-2 outline-action-secondary"
                    : "outline-none",
                ].join(" ")
              }
            >
              {({ isSelected }) => (
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-[background-color,border-color,color] duration-[var(--motion-state)] ease-out ${
                      isSelected
                        ? "border-brand-cyan bg-brand-cyan text-slate-950"
                        : "border-white/30 bg-white/[0.06] text-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold leading-7 text-text-primary [word-break:keep-all]">
                      {option.label}
                    </span>
                    <DecisionImpactChips option={option} className="mt-2" />
                  </span>
                </div>
              )}
            </Radio>
          ))}
        </RadioGroup>

        {selectedOption && !targetSelection ? (
          <Button
            className="mt-3 w-full gap-2"
            tone="secondary"
            isDisabled={isRunning}
            onPress={finishActiveCard}
          >
            <Check className="size-4" aria-hidden="true" />
            {safeIndex >= cards.length - 1
              ? "확인하고 이번 주 진행"
              : "확인하고 다음 안건"}
          </Button>
        ) : null}

        {targetSelection ? (
          <section
            className="mt-4 rounded-2xl bg-cyan-950/35 p-3 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.14)]"
            aria-label={targetSelection.label}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-cyan-200" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-text-primary">
                  {targetSelection.label}
                </h3>
              </div>
              <span className="text-xs font-semibold tabular-nums text-cyan-100">
                {selectedTargets.length}/
                {targetSelection.min === targetSelection.max
                  ? targetSelection.min
                  : `${targetSelection.min}~${targetSelection.max}`}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              선택한 멤버만 개인 일정에 참여합니다. 다른 멤버들은 기존 일정을 이어갑니다.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {trainees.map((trainee) => {
                const selected = selectedTargets.includes(trainee.id);
                const atLimit =
                  !selected && selectedTargets.length >= targetSelection.max;
                return (
                  <button
                    key={trainee.id}
                    type="button"
                    disabled={atLimit}
                    aria-pressed={selected}
                    className={`min-h-11 rounded-xl border-2 px-3 py-2 text-left transition-[scale,background-color,border-color,box-shadow,opacity] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-secondary disabled:cursor-not-allowed disabled:opacity-35 ${
                      selected ? "text-emerald-50" : "text-text-secondary"
                    } ${checkTileClasses(selected)}`}
                    onClick={() => toggleTarget(trainee.id)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="relative shrink-0">
                        <MemberPortrait traineeId={trainee.id} size="sm" />
                        <span
                          className={`absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full ${
                            selected
                              ? "bg-emerald-400 text-slate-950"
                              : "bg-surface-shell text-transparent"
                          }`}
                          aria-hidden="true"
                        >
                          <Check className="size-2.5" strokeWidth={3.5} />
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {trainee.name}
                        </span>
                        <span className="block truncate text-[11px] text-text-muted">
                          {trainee.position
                            ? POSITION_LABELS[trainee.position]
                            : "포지션 미정"}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              tone="secondary"
              className="mt-3 w-full"
              isDisabled={!targetCountValid || isRunning}
              onPress={finishActiveCard}
            >
              {safeIndex >= cards.length - 1
                ? "확인하고 이번 주 진행"
                : "확인하고 다음 안건"}
            </Button>
          </section>
        ) : null}
      </article>

      {activeCard.lane === "opportunity" ? (
        <Button
          tone="ghost"
          className="w-full gap-2 text-cyan-100"
          isDisabled={isRunning}
          onPress={handleSkipOpportunity}
        >
          <Clock3 className="size-4" aria-hidden="true" />
          수락하지 않고 넘기기
        </Button>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          tone="ghost"
          className="gap-1.5"
          isDisabled={safeIndex === 0}
          onPress={() => setActiveIndex((index) => Math.max(0, index - 1))}
        >
          <ChevronLeft className="size-4" aria-hidden="true" /> 이전
        </Button>
      </div>
    </section>
  );
}
