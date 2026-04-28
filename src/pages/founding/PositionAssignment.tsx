import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Modal } from "@/components/common/Modal";
import { PixelText } from "@/components/common/PixelText";
import { PositionSlot } from "@/components/founding/PositionSlot";
import {
  calculatePositionFitness,
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

export function PositionAssignment({ onComplete, onPrev }: PositionAssignmentProps) {
  const [selectingPosition, setSelectingPosition] = useState<Position | null>(null);

  const trainees = useTraineeStore((s) => s.trainees);
  const assignments = useFoundingStore((s) => s.positionAssignments);

  const assignedMap = new Map<Position, Trainee>();
  for (const trainee of trainees) {
    const pos = assignments[trainee.id];
    if (pos) assignedMap.set(pos, trainee);
  }

  const allRequiredFilled = REQUIRED_POSITIONS.every((pos) => assignedMap.has(pos));

  const handleAssign = (traineeId: string) => {
    if (!selectingPosition) return;
    foundingVanillaStore.getState().assignPosition(traineeId, selectingPosition);
    setSelectingPosition(null);
  };

  const handleComplete = () => {
    for (const trainee of trainees) {
      const pos = assignments[trainee.id] ?? null;
      traineeVanillaStore.getState().assignPosition(trainee.id, pos);
    }

    // Initialize chemistry between all pairs
    for (let i = 0; i < trainees.length; i++) {
      for (let j = i + 1; j < trainees.length; j++) {
        const value = Math.floor(Math.random() * 40) - 10; // -10 ~ +30
        traineeVanillaStore.getState().updateChemistry(trainees[i].id, trainees[j].id, value);
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
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
        <PixelText as="h2" className="pt-2 text-2xl text-brand-cyan">
          포지션 배정
        </PixelText>

        <div className="space-y-2">
          <p className="text-xs text-slate-400">멤버 목록</p>
          <div className="grid grid-cols-2 gap-2">
            {trainees.map((trainee) => {
              const pos = assignments[trainee.id];
              const avgStat = Math.round(
                Object.values(trainee.stats).reduce((a, b) => a + b, 0) / 7,
              );

              return (
                <Card key={trainee.id} className="space-y-1 py-2 text-center">
                  <p className="text-sm text-slate-50">{trainee.name}</p>
                  <p className="text-xs text-slate-400">평균 {avgStat}</p>
                  <p className="text-[10px] text-brand-cyan">
                    {pos ? POSITION_LABELS[pos] : "미배정"}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400">포지션 슬롯</p>
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
              const fitness = calculatePositionFitness(trainee.stats, selectingPosition);
              const currentPos = assignments[trainee.id];

              return (
                <button
                  key={trainee.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-left transition hover:border-brand-cyan/50"
                  onClick={() => handleAssign(trainee.id)}
                >
                  <div>
                    <span className="text-sm text-slate-50">{trainee.name}</span>
                    {currentPos && (
                      <span className="ml-2 text-xs text-slate-500">
                        ({POSITION_LABELS[currentPos]})
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
              className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-center text-xs text-slate-400 transition hover:border-red-400/50"
              onClick={() => {
                const current = assignedMap.get(selectingPosition);
                if (current) {
                  foundingVanillaStore.getState().assignPosition(current.id, null);
                }
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
