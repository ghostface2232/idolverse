import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { PixelText } from "@/components/common/PixelText";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { FoundingTitleBar } from "@/components/founding/FoundingTitleBar";
import { PositionSlot } from "@/components/founding/PositionSlot";
import {
  calculatePositionFitness,
  isRequiredPosition,
  POSITION_LABELS,
  REQUIRED_POSITIONS,
} from "@/data/founding";
import { useFoundingStore, foundingVanillaStore } from "@/stores/foundingStore";
import { traineeVanillaStore, useTraineeStore } from "@/stores/traineeStore";
import { gameVanillaStore } from "@/stores/gameStore";
import type { Position, Trainee } from "@/types/game";

const ALL_POSITIONS: Position[] = [
  "leader",
  "mainVocal",
  "mainDancer",
  "center",
  "visual",
  "variety",
  "producing",
];

interface PositionAssignmentProps {
  onComplete: () => void;
  onPrev: () => void;
}

function getTraineePositions(
  traineeId: string,
  assignments: Partial<Record<Position, string | null>>,
): Position[] {
  return ALL_POSITIONS.filter((pos) => assignments[pos] === traineeId);
}

export function PositionAssignment({ onComplete, onPrev }: PositionAssignmentProps) {
  const [selectingPosition, setSelectingPosition] = useState<Position | null>(null);

  const trainees = useTraineeStore((s) => s.trainees);
  const assignments = useFoundingStore((s) => s.positionAssignments);

  const assignedMap = new Map<Position, Trainee>();
  for (const pos of ALL_POSITIONS) {
    const id = assignments[pos];
    if (!id) continue;
    const t = trainees.find((tr) => tr.id === id);
    if (t) assignedMap.set(pos, t);
  }

  const allRequiredFilled = REQUIRED_POSITIONS.every((pos) => assignedMap.has(pos));

  const handleAssign = (traineeId: string) => {
    if (!selectingPosition) return;
    foundingVanillaStore.getState().assignPosition(selectingPosition, traineeId);
    setSelectingPosition(null);
  };

  const handleComplete = () => {
    for (const trainee of trainees) {
      const traineePositions = getTraineePositions(trainee.id, assignments);
      const required =
        traineePositions.find((p) => isRequiredPosition(p)) ?? null;
      const optional =
        traineePositions.find((p) => !isRequiredPosition(p)) ?? null;
      const primary = required ?? optional;
      const sub = required && optional ? optional : null;
      traineeVanillaStore
        .getState()
        .assignPosition(trainee.id, primary, sub);
    }

    for (let i = 0; i < trainees.length; i++) {
      for (let j = i + 1; j < trainees.length; j++) {
        const value = Math.floor(Math.random() * 40) - 10;
        traineeVanillaStore
          .getState()
          .updateChemistry(trainees[i].id, trainees[j].id, value);
      }
    }

    gameVanillaStore.setState({ currentPhase: "training" }, false);
    gameVanillaStore.getState().addNotification({
      type: "success",
      title: "그룹 창단 완료",
      message: "모든 포지션이 배정되었습니다. 트레이닝을 시작합니다.",
      week: 1,
    });
    onComplete();
  };

  function fitnessColor(f: number): string {
    if (f >= 70) return "text-emerald-300";
    if (f >= 40) return "text-amber-300";
    return "text-red-300";
  }

  return (
    <>
      <div className="stagger-fade -mx-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-3 pt-1">
        <FoundingTitleBar title="포지션 배정" />

        <p className="text-xs text-slate-400 [word-break:keep-all]">
          필수 포지션(리더/메인보컬/메인댄서/센터)은 서로 중복 불가. 그 외(비주얼/예능/프로듀싱)는 필수 포지션 멤버와 겸직 가능.
        </p>

        <div className="space-y-2">
          <p className="text-sm text-slate-200">멤버 목록</p>
          <div className="grid grid-cols-2 gap-2">
            {trainees.map((trainee) => {
              const positions = getTraineePositions(trainee.id, assignments);
              const avgStat = Math.round(
                Object.values(trainee.stats).reduce((a, b) => a + b, 0) /
                  Object.keys(trainee.stats).length,
              );

              return (
                <div
                  key={trainee.id}
                  className="space-y-1 rounded-2xl border-2 border-slate-600/80 bg-slate-800/82 px-3 py-2 text-center"
                >
                  <PixelText
                    as="p"
                    className="text-base text-slate-50 [text-shadow:none]"
                  >
                    {trainee.name}
                  </PixelText>
                  <p className="text-xs text-slate-400">평균 {avgStat}</p>
                  <p className="text-[11px] text-brand-cyan">
                    {positions.length === 0
                      ? "미배정"
                      : positions.map((p) => POSITION_LABELS[p]).join(" · ")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-200">포지션 슬롯</p>
          <div className="space-y-2">
            {ALL_POSITIONS.map((pos) => {
              const assigned = assignedMap.get(pos);
              const fitness = assigned
                ? calculatePositionFitness(assigned.stats, pos)
                : null;

              return (
                <PositionSlot
                  key={pos}
                  position={pos}
                  assignedName={assigned?.name ?? null}
                  fitness={fitness}
                  required={REQUIRED_POSITIONS.includes(pos)}
                  onTap={() => setSelectingPosition(pos)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-2 pt-2">
        <Button tone="ghost" onClick={onPrev}>
          이전
        </Button>
        <Button tone="success" disabled={!allRequiredFilled} onClick={handleComplete}>
          창단 완료
        </Button>
      </div>

      {selectingPosition && (
        <Modal
          title={`${POSITION_LABELS[selectingPosition]} 배정`}
          onClose={() => setSelectingPosition(null)}
        >
          <div className="space-y-2">
            {trainees.map((trainee) => {
              const fitness = calculatePositionFitness(
                trainee.stats,
                selectingPosition,
              );
              const heldPositions = getTraineePositions(trainee.id, assignments);
              const isHere = heldPositions.includes(selectingPosition);

              return (
                <button
                  key={trainee.id}
                  type="button"
                  className={[
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition duration-150 ease-out active:scale-[0.96]",
                    radioTileClasses(
                      isHere,
                      Boolean(assignments[selectingPosition]),
                    ),
                  ].join(" ")}
                  onClick={() => handleAssign(trainee.id)}
                >
                  <div className="flex items-baseline gap-2">
                    <PixelText className="text-base text-slate-50 [text-shadow:none]">
                      {trainee.name}
                    </PixelText>
                    {heldPositions.length > 0 && (
                      <span className="text-xs text-slate-400">
                        ({heldPositions.map((p) => POSITION_LABELS[p]).join(", ")})
                      </span>
                    )}
                  </div>
                  <span className={["text-sm", fitnessColor(fitness)].join(" ")}>
                    {fitness}%
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-center text-xs text-slate-400 transition duration-150 ease-out hover:border-red-400/50 active:scale-[0.96]"
              onClick={() => {
                foundingVanillaStore
                  .getState()
                  .assignPosition(selectingPosition, null);
                setSelectingPosition(null);
              }}
            >
              배정 해제
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
