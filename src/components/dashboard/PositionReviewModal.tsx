import { useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import {
  calculatePositionFitness,
  isRequiredPosition,
  POSITION_LABELS,
} from "@/data/founding";
import type { Position, Trainee } from "@/types/game";

interface PositionReviewModalProps {
  trainees: readonly Trainee[];
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

export function PositionReviewModal({
  trainees,
  isSaving,
  onConfirm,
}: PositionReviewModalProps) {
  const initial = useMemo(() => currentAssignments(trainees), [trainees]);
  const [assignments, setAssignments] = useState(initial);
  const [editing, setEditing] = useState<Position | null>(null);
  const positions = Object.keys(initial) as Position[];

  const assign = (position: Position, traineeId: string) => {
    setAssignments((current) => {
      const next = { ...current };
      const previousTraineeId = next[position] ?? null;
      for (const other of positions) {
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

  return (
    <Modal
      title="포지션 평가 결과"
      onClose={() => undefined}
      isCloseDisabled
      footer={
        <Button
          className="w-full transition-transform active:scale-[0.96]"
          isDisabled={isSaving}
          onPress={() => onConfirm(assignments)}
        >
          {isSaving ? "저장 중…" : "이 배정으로 확정"}
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-text-secondary">
          첫 평가전에서 실제 적합도가 공개됐습니다. 지금 한 번만 가배정을
          조정할 수 있습니다.
        </p>

        <div className="space-y-2">
          {positions.map((position) => {
            const assigned = trainees.find(
              (trainee) => trainee.id === assignments[position],
            );
            const fitness = assigned
              ? calculatePositionFitness(assigned.stats, position)
              : 0;
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
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-text-primary">
                    {assigned?.name ?? "미배정"}
                  </span>
                </span>
                <span className="text-sm font-bold tabular-nums text-brand-cyan">
                  {fitness}%
                </span>
              </button>
            );
          })}
        </div>

        {editing ? (
          <section className="rounded-3xl bg-surface-raised p-3 shadow-[var(--shadow-surface)]">
            <h3 className="px-1 text-sm font-semibold text-text-primary">
              {POSITION_LABELS[editing]} 재조정
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {trainees.map((trainee) => {
                const fitness = calculatePositionFitness(trainee.stats, editing);
                return (
                  <button
                    key={trainee.id}
                    type="button"
                    className="min-h-11 rounded-2xl bg-slate-950/60 px-3 py-2 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-transform active:scale-[0.96]"
                    onClick={() => assign(editing, trainee.id)}
                  >
                    <span className="block truncate text-sm text-text-primary">
                      {trainee.name}
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-brand-cyan">
                      적합도 {fitness}%
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
