import { useMemo, useState } from "react";
import { Flame, Snowflake } from "lucide-react";
import { Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import {
  COMEBACK_BUDGET_TIERS,
  type ComebackBudgetTierId,
} from "@/data/balance";
import {
  CONCEPT_MOOD_DATA,
  CONCEPT_MOODS,
  CONCEPT_SYNERGY_TABLE,
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

const SYNERGY_TONE: Record<string, string> = {
  S: "bg-amber-400/15 text-amber-200",
  A: "bg-emerald-400/12 text-emerald-200",
  B: "bg-slate-400/12 text-slate-200",
  C: "bg-orange-400/12 text-orange-200",
  D: "bg-rose-400/12 text-rose-200",
};

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

  return (
    <Modal
      title="다음 컴백 기획"
      onClose={onClose}
      isCloseDisabled={isSaving}
      footer={
        <Button
          className="w-full"
          isDisabled={!mood || !genre || !canAfford || isSaving}
          onPress={() => {
            if (mood && genre)
              void onConfirm({ genre, mood, budgetTierId, centerTraineeId });
          }}
        >
          {isSaving
            ? "저장 중…"
            : canAfford
              ? "이 기획으로 시작"
              : "예산이 부족합니다"}
        </Button>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="text-pretty leading-6 text-text-secondary">
          컨셉을 정하면 14주 컴백 사이클이 시작됩니다. 팬덤은 팀이 지금까지
          보여준 색을 기억하고 있습니다. 지킬지, 바꿀지가 이번 기획의 첫
          질문입니다.
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
                      "cursor-pointer rounded-2xl bg-surface-shell/72 p-3 outline-none",
                      "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[scale,background-color,box-shadow] duration-150 ease-out",
                      isPressed ? "scale-[0.96]" : "scale-100",
                      isSelected
                        ? "bg-action-secondary/12 shadow-[inset_0_0_0_2px_rgba(34,211,238,0.5)]"
                        : "",
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
              const synergy = mood
                ? CONCEPT_SYNERGY_TABLE[candidate][mood]
                : null;
              return (
                <Radio
                  key={candidate}
                  value={candidate}
                  className={({ isSelected, isPressed }) =>
                    [
                      "flex cursor-pointer items-center gap-1.5 rounded-xl bg-surface-shell/72 px-3 py-2 outline-none",
                      "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[scale,background-color,box-shadow] duration-150 ease-out",
                      isPressed ? "scale-[0.96]" : "scale-100",
                      isSelected
                        ? "bg-action-secondary/12 shadow-[inset_0_0_0_2px_rgba(34,211,238,0.5)]"
                        : "",
                    ].join(" ")
                  }
                >
                  <span className="text-xs font-semibold text-text-primary">
                    {GENRE_DATA[candidate].label}
                  </span>
                  {synergy ? (
                    <span
                      className={`rounded-md px-1 py-0.5 text-[10px] font-bold ${SYNERGY_TONE[synergy]}`}
                    >
                      {synergy}
                    </span>
                  ) : null}
                </Radio>
              );
            })}
          </RadioGroup>
          <p className="mt-2 text-[11px] leading-5 text-text-muted">
            등급은 무드와 장르의 시너지입니다. 시장 강세{" "}
            <span className="font-semibold text-text-secondary">
              {GENRE_DATA[marketTrend.hotGenre].label}
            </span>
            {" · "}약세{" "}
            <span className="font-semibold text-text-secondary">
              {GENRE_DATA[marketTrend.coldGenre].label}
            </span>
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
            이번 앨범의 센터
          </h3>
          <p className="mt-1 text-[11px] leading-4 text-text-muted">
            컨셉의 얼굴을 앨범마다 바꿔 세울 수 있습니다. 어떤 특성이 어떤
            컨셉과 만나 빛나는지는 발매가 말해줍니다.
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
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-surface-shell/72 px-3 py-2 outline-none",
                    "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[scale,background-color,box-shadow] duration-150 ease-out",
                    isPressed ? "scale-[0.98]" : "scale-100",
                    isSelected
                      ? "bg-action-secondary/12 shadow-[inset_0_0_0_2px_rgba(34,211,238,0.5)]"
                      : "",
                  ].join(" ")
                }
              >
                <span className="min-w-0 truncate text-xs">
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

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
            제작 예산
          </h3>
          <RadioGroup
            aria-label="제작 예산"
            value={budgetTierId}
            onChange={(value) => setBudgetTierId(value as ComebackBudgetTierId)}
            isDisabled={isSaving}
            className="mt-2 grid grid-cols-3 gap-2"
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
                      "cursor-pointer rounded-2xl bg-surface-shell/72 p-3 text-center outline-none",
                      "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[scale,background-color,box-shadow] duration-150 ease-out",
                      isDisabled ? "cursor-not-allowed opacity-45" : "",
                      isPressed ? "scale-[0.96]" : "scale-100",
                      isSelected
                        ? "bg-action-secondary/12 shadow-[inset_0_0_0_2px_rgba(34,211,238,0.5)]"
                        : "",
                    ].join(" ")
                  }
                >
                  <span className="block text-sm font-semibold text-text-primary">
                    {tier.label}
                  </span>
                  <MoneyDisplay amount={tier.cost} size="sm" className="mt-1" />
                  <span className="mt-1 block text-pretty text-[11px] leading-4 text-text-muted">
                    {tier.summary}
                  </span>
                </Radio>
              );
            })}
          </RadioGroup>
        </section>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-xl bg-state-danger/12 px-3 py-2 text-pretty text-sm text-rose-200"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
