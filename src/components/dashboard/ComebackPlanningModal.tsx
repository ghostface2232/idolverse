import { useMemo, useState } from "react";
import { Flame, Snowflake } from "lucide-react";
import { Radio, RadioGroup } from "react-aria-components";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
import {
  COMEBACK_BUDGET_TIERS,
  type ComebackBudgetTierId,
} from "@/data/balance";
import {
  CONCEPT_MOOD_DATA,
  CONCEPT_MOODS,
  GENRE_DATA,
  GENRES,
} from "@/data/concepts";
import { traitLabels } from "@/data/memberTraits";
import { calculateFandomExpectation } from "@/systems/albumSystem";
import type {
  CalendarStoreState,
  ConceptMood,
  Genre,
  Trainee,
} from "@/types/game";
import { josa } from "@/utils/josa";

interface ComebackPlanningModalProps {
  conceptHistory: readonly ConceptMood[];
  marketTrend: CalendarStoreState["marketTrend"];
  trainees: readonly Trainee[];
  money: number;
  isSaving: boolean;
  errorMessage?: string | null;
  onConfirm: (plan: {
    genre: Genre;
    mood: ConceptMood;
    budgetTierId: ComebackBudgetTierId;
    centerTraineeId: string | null;
  }) => void | Promise<void>;
  onClose: () => void;
}

const PLAN_STEPS = [
  { key: "concept", label: "컨셉" },
  { key: "center", label: "센터" },
  { key: "budget", label: "예산" },
] as const;

function PlanStepIndicator({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex items-center gap-1">
      {PLAN_STEPS.map((step, index) => (
        <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={[
              "h-2 w-full rounded-full transition-colors duration-150",
              index < currentIndex
                ? "bg-emerald-400"
                : index === currentIndex
                  ? "bg-brand-cyan"
                  : "bg-slate-700",
            ].join(" ")}
          />
          <span
            className={[
              "text-[11px] transition-colors duration-150",
              index < currentIndex
                ? "text-emerald-300"
                : index === currentIndex
                  ? "text-brand-cyan"
                  : "text-slate-500",
            ].join(" ")}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function expectationBadge(
  conceptHistory: readonly ConceptMood[],
  mood: ConceptMood,
): { label: string; tone: string } {
  const expectation = calculateFandomExpectation(conceptHistory, mood);
  if (conceptHistory.length === 0) {
    return { label: "첫 색", tone: "bg-cyan-400/12 text-cyan-200" };
  }
  if (expectation.publicBonus < 0) {
    return { label: "식상 위험", tone: "bg-amber-400/12 text-amber-200" };
  }
  if (expectation.fandomPenalty < 0) {
    return { label: "승부수", tone: "bg-pink-400/12 text-pink-200" };
  }
  if (expectation.fitScore === 3) {
    return { label: "점진 변화", tone: "bg-violet-400/12 text-violet-200" };
  }
  return { label: "안정", tone: "bg-emerald-400/12 text-emerald-200" };
}

export function ComebackPlanningModal({
  conceptHistory,
  marketTrend,
  trainees,
  money,
  isSaving,
  errorMessage,
  onConfirm,
  onClose,
}: ComebackPlanningModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [mood, setMood] = useState<ConceptMood | null>(null);
  const [genre, setGenre] = useState<Genre | null>(null);
  const [budgetTierId, setBudgetTierId] =
    useState<ComebackBudgetTierId>("standard");
  const [centerTraineeId, setCenterTraineeId] = useState<string | null>(null);

  const selectedExpectation = useMemo(
    () => (mood ? calculateFandomExpectation(conceptHistory, mood) : null),
    [conceptHistory, mood],
  );
  const visibleGenres = GENRES.filter((candidate) => !GENRE_DATA[candidate].hidden);
  const selectedBudget = COMEBACK_BUDGET_TIERS.find(
    (tier) => tier.id === budgetTierId,
  );
  const canAfford = (selectedBudget?.cost ?? 0) <= money;
  const centerTrainee = trainees.find(
    (trainee) => trainee.id === centerTraineeId,
  );

  const isLastStep = stepIndex === PLAN_STEPS.length - 1;
  const canGoNext = stepIndex === 0 ? mood !== null && genre !== null : true;

  return (
    <Modal
      title="다음 컴백 기획"
      onClose={onClose}
      isCloseDisabled={isSaving}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button
            tone="secondary"
            isDisabled={stepIndex === 0 || isSaving}
            onPress={() => setStepIndex((index) => Math.max(0, index - 1))}
          >
            이전
          </Button>
          {isLastStep ? (
            <Button
              isDisabled={!mood || !genre || !canAfford || isSaving}
              onPress={() => {
                if (mood && genre)
                  void onConfirm({ genre, mood, budgetTierId, centerTraineeId });
              }}
            >
              {isSaving
                ? "저장 중…"
                : canAfford
                  ? "기획 시작"
                  : "예산 부족"}
            </Button>
          ) : (
            <Button
              isDisabled={!canGoNext || isSaving}
              onPress={() =>
                setStepIndex((index) =>
                  Math.min(PLAN_STEPS.length - 1, index + 1),
                )
              }
            >
              다음
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-sm [word-break:keep-all]">
        <PlanStepIndicator currentIndex={stepIndex} />

        {stepIndex === 0 ? (
          <>
            <p className="text-pretty leading-6 text-text-secondary">
              컨셉을 정하면 16주 컴백 사이클이 시작됩니다. 지금까지의 색을
              지킬지, 바꿀지 정해 주세요.
            </p>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
                콘셉트 무드
              </h3>
              <RadioGroup
                aria-label="컨셉 무드"
                value={mood ?? ""}
                onChange={(value) => setMood(value as ConceptMood)}
                isDisabled={isSaving}
                className="mt-2 grid grid-cols-2 gap-2"
              >
                {CONCEPT_MOODS.map((candidate) => {
                  const badge = expectationBadge(conceptHistory, candidate);
                  const isHot = marketTrend.hotMood === candidate;
                  const isCold = marketTrend.coldMood === candidate;
                  return (
                    <Radio
                      key={candidate}
                      value={candidate}
                      className={({ isSelected, isPressed }) =>
                        [
                          "min-h-11 cursor-pointer rounded-2xl border-2 p-3 outline-none transition duration-150 ease-out",
                          isPressed ? "scale-[0.96]" : "scale-100",
                          radioTileClasses(isSelected, mood !== null),
                        ].join(" ")
                      }
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold text-text-primary">
                          {CONCEPT_MOOD_DATA[candidate].label}
                        </span>
                        {isHot ? (
                          <Flame
                            className="size-3.5 text-orange-300"
                            aria-label="시장 강세 무드"
                          />
                        ) : isCold ? (
                          <Snowflake
                            className="size-3.5 text-slate-400"
                            aria-label="시장 약세 무드"
                          />
                        ) : null}
                      </span>
                      <span
                        className={`mt-1.5 inline-block rounded-lg px-1.5 py-0.5 text-[10px] font-semibold ${badge.tone}`}
                      >
                        {badge.label}
                      </span>
                    </Radio>
                  );
                })}
              </RadioGroup>
              {selectedExpectation ? (
                <p className="mt-2 rounded-xl bg-surface-shell/72 px-3 py-2 text-pretty text-xs leading-5 text-text-secondary">
                  {selectedExpectation.description}
                </p>
              ) : null}
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
                장르
              </h3>
              <RadioGroup
                aria-label="장르"
                value={genre ?? ""}
                onChange={(value) => setGenre(value as Genre)}
                isDisabled={isSaving}
                className="mt-2 flex flex-wrap gap-2"
              >
                {visibleGenres.map((candidate) => {
                  return (
                    <Radio
                      key={candidate}
                      value={candidate}
                      className={({ isSelected, isPressed }) =>
                        [
                          "flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border-2 px-3 py-2 outline-none transition duration-150 ease-out",
                          isPressed ? "scale-[0.96]" : "scale-100",
                          radioTileClasses(isSelected, genre !== null),
                        ].join(" ")
                      }
                    >
                      <span className="text-xs font-semibold text-text-primary">
                        {GENRE_DATA[candidate].label}
                      </span>
                    </Radio>
                  );
                })}
              </RadioGroup>
              <p className="mt-2 text-[11px] leading-5 text-text-muted">
                요즘 시장에서는{" "}
                <span className="font-semibold text-text-secondary">
                  {GENRE_DATA[marketTrend.hotGenre].label}
                </span>
                {`${josa(GENRE_DATA[marketTrend.hotGenre].label, "이/가")} 강세, `}
                <span className="font-semibold text-text-secondary">
                  {GENRE_DATA[marketTrend.coldGenre].label}
                </span>
                {`${josa(GENRE_DATA[marketTrend.coldGenre].label, "은/는")} 약세입니다.`}
              </p>
            </section>
          </>
        ) : null}

        {stepIndex === 1 ? (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
              이번 앨범의 센터
            </h3>
            <p className="mt-1 text-[11px] leading-4 text-text-muted">
              컨셉의 얼굴을 앨범마다 바꿔 세울 수 있습니다.
            </p>
            <RadioGroup
              aria-label="센터 선택"
              value={centerTraineeId ?? ""}
              onChange={(value) => setCenterTraineeId(value || null)}
              isDisabled={isSaving}
              className="mt-2 space-y-1.5"
            >
              {trainees.map((trainee) => (
                <Radio
                  key={trainee.id}
                  value={trainee.id}
                  className={({ isSelected, isPressed }) =>
                    [
                      "flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-2 outline-none transition duration-150 ease-out",
                      isPressed ? "scale-[0.98]" : "scale-100",
                      radioTileClasses(isSelected, centerTraineeId !== null),
                    ].join(" ")
                  }
                >
                  <MemberPortrait
                    traineeId={trainee.id}
                    size="md"
                    outfit="stage"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs">
                    <span className="font-semibold text-text-primary">
                      {trainee.name}
                    </span>
                    <span className="ml-2 text-text-muted">
                      {traitLabels(trainee).join("·")}
                    </span>
                  </span>
                </Radio>
              ))}
            </RadioGroup>
            <p className="mt-1.5 text-[11px] text-text-muted">
              선택하지 않으면 포지션 센터가 그대로 섭니다.
            </p>
          </section>
        ) : null}

        {stepIndex === 2 ? (
          <>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
                제작 예산
              </h3>
              <RadioGroup
                aria-label="제작 예산"
                value={budgetTierId}
                onChange={(value) => setBudgetTierId(value as ComebackBudgetTierId)}
                isDisabled={isSaving}
                className="mt-2 space-y-2"
              >
                {COMEBACK_BUDGET_TIERS.map((tier) => {
                  const affordable = tier.cost <= money;
                  return (
                    <Radio
                      key={tier.id}
                      value={tier.id}
                      isDisabled={!affordable}
                      className={({ isSelected, isPressed, isDisabled }) =>
                        [
                          "block min-h-11 cursor-pointer rounded-2xl border-2 p-3 outline-none transition duration-150 ease-out",
                          isDisabled ? "cursor-not-allowed opacity-45" : "",
                          isPressed ? "scale-[0.98]" : "scale-100",
                          radioTileClasses(isSelected, true),
                        ].join(" ")
                      }
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-text-primary">
                          {tier.label}
                        </span>
                        <MoneyDisplay amount={tier.cost} size="sm" />
                      </span>
                      <span className="mt-1 block text-pretty text-xs leading-5 text-text-muted">
                        {tier.summary}
                      </span>
                    </Radio>
                  );
                })}
              </RadioGroup>
            </section>

            <section className="rounded-2xl bg-surface-shell/72 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
                기획 요약
              </h3>
              <dl className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">컨셉</dt>
                  <dd className="font-semibold text-text-primary">
                    {mood ? CONCEPT_MOOD_DATA[mood].label : "미정"}
                    {" · "}
                    {genre ? GENRE_DATA[genre].label : "미정"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">센터</dt>
                  <dd className="font-semibold text-text-primary">
                    {centerTrainee ? centerTrainee.name : "포지션 센터 유지"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">예산</dt>
                  <dd className="flex items-center gap-2 font-semibold text-text-primary">
                    {selectedBudget?.label}
                    <MoneyDisplay amount={selectedBudget?.cost ?? 0} size="sm" />
                  </dd>
                </div>
              </dl>
            </section>
          </>
        ) : null}

        {errorMessage ? <Alert message={errorMessage} /> : null}
      </div>
    </Modal>
  );
}
