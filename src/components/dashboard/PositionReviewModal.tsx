import { useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import {
  ALL_POSITIONS,
  isRequiredPosition,
  POSITION_LABELS,
} from "@/data/founding";
import {
  evaluatePositionTrials,
  type PositionTrialCandidateResult,
} from "@/systems/positionTrialSystem";
import type { Position, Trainee } from "@/types/game";

interface PositionReviewModalProps {
  trainees: readonly Trainee[];
  trialSeed: number;
  isSaving: boolean;
  onConfirm: (
    assignments: Partial<Record<Position, string | null>>,
  ) => void | Promise<void>;
}

function currentAssignments(
  trainees: readonly Trainee[],
): Partial<Record<Position, string | null>> {
  const assignments: Partial<Record<Position, string | null>> = {};
  for (const trainee of trainees) {
    if (trainee.position) assignments[trainee.position] = trainee.id;
    if (trainee.subPosition) assignments[trainee.subPosition] = trainee.id;
  }
  return assignments;
}

function scoreTone(result: PositionTrialCandidateResult): string {
  if (result.rank === 1) return "text-emerald-300";
  if (result.rank <= 3) return "text-amber-300";
  return "text-slate-300";
}

export function PositionReviewModal({
  trainees,
  trialSeed,
  isSaving,
  onConfirm,
}: PositionReviewModalProps) {
  const initial = useMemo(() => currentAssignments(trainees), [trainees]);
  const trialResults = useMemo(
    () => evaluatePositionTrials(trainees, trialSeed),
    [trainees, trialSeed],
  );
  const [assignments, setAssignments] = useState(initial);
  const [editing, setEditing] = useState<Position | null>(null);

  const assign = (position: Position, traineeId: string) => {
    setAssignments((current) => {
      const next = { ...current };
      const previousTraineeId = next[position] ?? null;
      for (const other of ALL_POSITIONS) {
        if (
          other !== position &&
          isRequiredPosition(other) === isRequiredPosition(position) &&
          next[other] === traineeId
        ) {
          next[other] = previousTraineeId;
        }
      }
      next[position] = traineeId;
      return next;
    });
    setEditing(null);
  };

  const editingResults = editing ? trialResults[editing] : [];

  return (
    <Modal
      title="포지션 선발전 결과"
      onClose={() => undefined}
      isCloseDisabled
      footer={
        <Button
          className="w-full transition-transform active:scale-[0.96]"
          isDisabled={isSaving}
          onPress={() => onConfirm(assignments)}
        >
          {isSaving ? "저장 중…" : "이 배정으로 최종 확정"}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm leading-6 text-text-secondary">
            기초 적합도에 컨디션, 팀 케미, 부상과 당일 무대를 반영한 실제
            경쟁 결과입니다.
          </p>
          <p className="text-xs leading-5 text-text-muted">
            1위가 항상 정답은 아닙니다. 결과를 비교하고 최종 역할을 직접
            확정하세요.
          </p>
        </div>

        <div className="space-y-2">
          {ALL_POSITIONS.map((position) => {
            const assigned = trainees.find(
              (trainee) => trainee.id === assignments[position],
            );
            const result = trialResults[position].find(
              (candidate) => candidate.traineeId === assigned?.id,
            );
            return (
              <button
                key={position}
                type="button"
                className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[transform,box-shadow] active:scale-[0.96]"
                onClick={() => setEditing(position)}
              >
                <span>
                  <span className="block text-xs text-text-muted">
                    {POSITION_LABELS[position]}
                    {isRequiredPosition(position) ? " · 필수" : " · 선택"}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-text-primary">
                    {assigned?.name ?? "미배정"}
                  </span>
                </span>
                {result ? (
                  <span className={["text-right", scoreTone(result)].join(" ")}>
                    <span className="block text-xs font-medium">#{result.rank}</span>
                    <span className="block text-sm font-bold tabular-nums">
                      {result.score}점
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">결과 보기</span>
                )}
              </button>
            );
          })}
        </div>

        {editing ? (
          <section className="rounded-3xl bg-surface-raised p-3 shadow-[var(--shadow-surface)]">
            <div className="flex items-center justify-between gap-2 px-1">
              <h3 className="text-sm font-semibold text-text-primary">
                {POSITION_LABELS[editing]} 경쟁 순위
              </h3>
              <span className="text-[11px] text-text-muted">탭하여 배정</span>
            </div>
            <div className="mt-2 space-y-2">
              {editingResults.map((result) => {
                const trainee = trainees.find(
                  (candidate) => candidate.id === result.traineeId,
                );
                if (!trainee) return null;
                const selected = assignments[editing] === trainee.id;
                const breakdown = result.breakdown;

                return (
                  <button
                    key={trainee.id}
                    type="button"
                    className={[
                      "w-full rounded-2xl px-3 py-3 text-left transition-transform active:scale-[0.96]",
                      selected
                        ? "bg-cyan-500/10 shadow-[inset_0_0_0_2px_rgba(6,182,212,0.45)]"
                        : "bg-slate-950/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
                    ].join(" ")}
                    onClick={() => assign(editing, trainee.id)}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span
                            className={[
                              "text-sm font-bold tabular-nums",
                              scoreTone(result),
                            ].join(" ")}
                          >
                            #{result.rank}
                          </span>
                          <span className="truncate text-sm font-semibold text-text-primary">
                            {trainee.name}
                          </span>
                          {selected ? (
                            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-200">
                              현재 배정
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-xs text-text-muted">
                          기초 적합도 {result.baseRating}/5
                        </span>
                      </span>
                      <span
                        className={[
                          "whitespace-nowrap text-lg font-bold tabular-nums",
                          scoreTone(result),
                        ].join(" ")}
                      >
                        {result.score}점
                      </span>
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1.5 text-[10px] tabular-nums text-slate-300">
                      <span className="rounded-full bg-slate-800 px-2 py-1">
                        기량 +{breakdown.fitness}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-1">
                        컨디션 +{breakdown.condition}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-1">
                        케미 +{breakdown.chemistry}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-1">
                        당일 무대 +{breakdown.stageForm}
                      </span>
                      {breakdown.injuryPenalty > 0 ? (
                        <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-300">
                          부상 -{breakdown.injuryPenalty}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
