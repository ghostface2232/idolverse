import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
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
  return "text-text-secondary";
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

  const requiredPositions = ALL_POSITIONS.filter(isRequiredPosition);
  const requiredAssigned = requiredPositions.filter(
    (position) => assignments[position],
  ).length;

  return (
    <Modal
      title="포지션 선발전 결과"
      onClose={() => undefined}
      isCloseDisabled
      footer={
        <div className="space-y-2">
          <p className="text-center text-xs tabular-nums text-text-muted">
            필수 포지션 {requiredAssigned}/{requiredPositions.length} 배정됨
          </p>
          <Button
            className="w-full transition-transform active:scale-[0.96]"
            isDisabled={isSaving}
            onPress={() => onConfirm(assignments)}
          >
            {isSaving ? "저장 중…" : "이 배정으로 최종 확정"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-text-secondary [word-break:keep-all]">
          컨디션, 케미, 당일 무대까지 반영한 경쟁 결과입니다. 포지션을 누르면
          그 자리에서 후보를 고를 수 있습니다.
        </p>

        <div className="space-y-2">
          {ALL_POSITIONS.map((position) => {
            const expanded = editing === position;
            const assigned = trainees.find(
              (trainee) => trainee.id === assignments[position],
            );
            const result = trialResults[position].find(
              (candidate) => candidate.traineeId === assigned?.id,
            );

            return (
              <div
                key={position}
                className={
                  expanded
                    ? "rounded-2xl bg-surface-raised p-2 shadow-[var(--shadow-surface)]"
                    : undefined
                }
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  className={[
                    "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-[transform,box-shadow]",
                    expanded
                      ? "bg-surface-shell/70 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]"
                      : "bg-surface-shell/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] active:scale-[0.98]",
                  ].join(" ")}
                  onClick={() => setEditing(expanded ? null : position)}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {assigned ? (
                      <MemberPortrait traineeId={assigned.id} size="sm" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="size-9 shrink-0 rounded-xl bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block text-xs text-text-muted">
                        {POSITION_LABELS[position]}
                        {isRequiredPosition(position) ? " · 필수" : " · 선택"}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-semibold text-text-primary">
                        {assigned?.name ?? "미배정"}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {result ? (
                      <span className={["text-right", scoreTone(result)].join(" ")}>
                        <span className="block text-xs font-medium">
                          #{result.rank}
                        </span>
                        <span className="block text-sm font-bold tabular-nums">
                          {result.score}점
                        </span>
                      </span>
                    ) : null}
                    <ChevronDown
                      className={[
                        "size-4 text-text-muted transition-transform",
                        expanded ? "rotate-180" : "",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                {expanded ? (
                  <div className="mt-2 space-y-2">
                    <p className="px-2 text-[11px] text-text-muted">
                      후보를 누르면 이 포지션에 배정됩니다.
                    </p>
                    {trialResults[position].map((candidateResult) => {
                      const trainee = trainees.find(
                        (candidate) => candidate.id === candidateResult.traineeId,
                      );
                      if (!trainee) return null;
                      const selected = assignments[position] === trainee.id;
                      const breakdown = candidateResult.breakdown;

                      return (
                        <button
                          key={trainee.id}
                          type="button"
                          className={[
                            "w-full rounded-2xl border px-3 py-3 text-left transition-transform active:scale-[0.98]",
                            radioTileClasses(selected, Boolean(assignments[position])),
                          ].join(" ")}
                          onClick={() => assign(position, trainee.id)}
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span className="flex min-w-0 items-center gap-2.5">
                              <MemberPortrait traineeId={trainee.id} size="sm" />
                              <span className="min-w-0">
                                <span className="flex items-center gap-2">
                                  <span
                                    className={[
                                      "text-sm font-bold tabular-nums",
                                      scoreTone(candidateResult),
                                    ].join(" ")}
                                  >
                                    #{candidateResult.rank}
                                  </span>
                                  <span className="truncate text-sm font-semibold text-text-primary">
                                    {trainee.name}
                                  </span>
                                  {selected ? (
                                    <span className="shrink-0 rounded-full bg-brand-cyan/15 px-2 py-0.5 text-[10px] text-cyan-200">
                                      현재 배정
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-1 block text-xs text-text-muted">
                                  기초 적합도 {candidateResult.baseRating}/5
                                </span>
                              </span>
                            </span>
                            <span
                              className={[
                                "whitespace-nowrap text-lg font-bold tabular-nums",
                                scoreTone(candidateResult),
                              ].join(" ")}
                            >
                              {candidateResult.score}점
                            </span>
                          </span>
                          <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] tabular-nums text-text-secondary">
                            <span className="rounded-full bg-white/[0.06] px-2 py-1">
                              기량 +{breakdown.fitness}
                            </span>
                            <span className="rounded-full bg-white/[0.06] px-2 py-1">
                              컨디션 +{breakdown.condition}
                            </span>
                            <span className="rounded-full bg-white/[0.06] px-2 py-1">
                              케미 +{breakdown.chemistry}
                            </span>
                            <span className="rounded-full bg-white/[0.06] px-2 py-1">
                              당일 무대 +{breakdown.stageForm}
                            </span>
                            {breakdown.injuryPenalty > 0 ? (
                              <span className="rounded-full bg-state-danger/10 px-2 py-1 text-red-300">
                                부상 -{breakdown.injuryPenalty}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
