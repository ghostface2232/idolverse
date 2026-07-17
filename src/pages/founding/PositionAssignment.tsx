import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { PixelText } from "@/components/common/PixelText";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { FoundingTitleBar } from "@/components/founding/FoundingTitleBar";
import { PositionSlot } from "@/components/founding/PositionSlot";
import {
  ALL_POSITIONS,
  calculatePositionFitnessRating,
  isRequiredPosition,
  POSITION_LABELS,
  REQUIRED_POSITIONS,
} from "@/data/founding";
import { useFoundingStore, foundingVanillaStore } from "@/stores/foundingStore";
import { traineeVanillaStore, useTraineeStore } from "@/stores/traineeStore";
import { gameVanillaStore } from "@/stores/gameStore";
import { DEBUT_PROJECT } from "@/data/debutProject";
import {
  DEBUT_SCHEDULE_TIERS,
  DEFAULT_DEBUT_SCHEDULE_ID,
} from "@/data/balance";
import { createProjectInstance } from "@/systems/projectSystem";
import type { DebutScheduleTierId, Position, Trainee } from "@/types/game";

const OPTIONAL_POSITIONS = ALL_POSITIONS.filter(
  (position) => !REQUIRED_POSITIONS.includes(position),
);

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
  const [scheduleTierId, setScheduleTierId] = useState<DebutScheduleTierId>(
    DEFAULT_DEBUT_SCHEDULE_ID,
  );

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

    gameVanillaStore.setState(
      {
        currentPhase: "training",
        activeProjects: [
          { ...createProjectInstance(DEBUT_PROJECT, 1), scheduleTierId },
        ],
      },
      false,
    );
    gameVanillaStore.getState().addNotification({
      type: "success",
      title: "그룹 창단 완료",
      message: "포지션이 가배정되었습니다. 훈련 뒤 선발전 결과를 보고 최종 확정합니다.",
      week: 1,
    });
    onComplete();
  };

  return (
    <>
      <div className="stagger-fade -mx-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-3 pt-1">
        <FoundingTitleBar title="포지션 가배정" />

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
                  className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2 rounded-2xl border-2 border-slate-600/80 bg-slate-800 px-3 py-2.5"
                >
                  <div className="flex min-w-0 flex-col justify-center gap-1">
                    <PixelText
                      as="p"
                      className="truncate text-base text-slate-50 [text-shadow:none]"
                    >
                      {trainee.name}
                    </PixelText>
                    <p className="text-xs tabular-nums text-slate-400">
                      평균 {avgStat}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-center gap-1">
                    {positions.length === 0 ? (
                      <span className="text-[11px] text-slate-500">미배정</span>
                    ) : (
                      positions.map((position) => (
                        <PixelText
                          key={position}
                          className={[
                            "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] ring-1 ring-inset [text-shadow:none]",
                            isRequiredPosition(position)
                              ? "bg-pink-500/15 text-pink-300 ring-brand-pink/30"
                              : "bg-cyan-500/15 text-brand-cyan ring-brand-cyan/30",
                          ].join(" ")}
                        >
                          {POSITION_LABELS[position]}
                        </PixelText>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-200">포지션 슬롯</p>
          <div className="space-y-3">
            <section className="space-y-2 rounded-[26px] bg-slate-900 p-2.5 ring-1 ring-inset ring-brand-pink/25">
              <div className="flex min-h-10 items-center justify-between gap-2 px-1.5">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-pink-500/15 text-pink-300 ring-1 ring-inset ring-brand-pink/25">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-pink-100">필수 포지션</p>
                    <p className="text-[11px] text-pink-200/60">멤버당 하나만 담당</p>
                  </div>
                </div>
                <span className="whitespace-nowrap rounded-full bg-pink-500/15 px-2 py-1 text-[10px] font-medium text-pink-300 ring-1 ring-inset ring-brand-pink/25">
                  중복 불가
                </span>
              </div>
              <div className="space-y-2">
                {REQUIRED_POSITIONS.map((position) => {
                  const assigned = assignedMap.get(position);
                  const fitnessRating = assigned
                    ? calculatePositionFitnessRating(assigned.stats, position)
                    : null;

                  return (
                    <PositionSlot
                      key={position}
                      position={position}
                      assignedName={assigned?.name ?? null}
                      fitnessRating={fitnessRating}
                      required
                      onTap={() => setSelectingPosition(position)}
                    />
                  );
                })}
              </div>
            </section>

            <section className="space-y-2 rounded-[26px] bg-slate-900 p-2.5 ring-1 ring-inset ring-brand-cyan/25">
              <div className="flex min-h-10 items-center justify-between gap-2 px-1.5">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-cyan-500/15 text-brand-cyan ring-1 ring-inset ring-brand-cyan/25">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-cyan-100">선택 포지션</p>
                    <p className="text-[11px] text-cyan-200/60">필수 역할에 하나 더 담당</p>
                  </div>
                </div>
                <span className="whitespace-nowrap rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-medium text-brand-cyan ring-1 ring-inset ring-brand-cyan/25">
                  겸직 가능
                </span>
              </div>
              <div className="space-y-2">
                {OPTIONAL_POSITIONS.map((position) => {
                  const assigned = assignedMap.get(position);
                  const fitnessRating = assigned
                    ? calculatePositionFitnessRating(assigned.stats, position)
                    : null;

                  return (
                    <PositionSlot
                      key={position}
                      position={position}
                      assignedName={assigned?.name ?? null}
                      fitnessRating={fitnessRating}
                      required={false}
                      onTap={() => setSelectingPosition(position)}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-slate-200">데뷔 일정</p>
          <div className="grid grid-cols-3 gap-2">
            {DEBUT_SCHEDULE_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                className={[
                  "rounded-2xl border-2 p-3 text-center transition duration-150 ease-out active:scale-[0.96] [word-break:keep-all]",
                  radioTileClasses(scheduleTierId === tier.id, true),
                ].join(" ")}
                onClick={() => setScheduleTierId(tier.id)}
              >
                <p className="text-sm text-slate-50">{tier.label}</p>
                <p className="mt-0.5 text-xs tabular-nums text-brand-cyan">
                  {tier.debutWeek}주차 데뷔
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">
                  {tier.summary}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-2 pt-2">
        <Button tone="ghost" onClick={onPrev}>
          이전
        </Button>
        <Button tone="success" disabled={!allRequiredFilled} onClick={handleComplete}>
          가배정 완료
        </Button>
      </div>

      {selectingPosition && (
        <Modal
          title={`${POSITION_LABELS[selectingPosition]} 배정`}
          onClose={() => setSelectingPosition(null)}
        >
          <div className="space-y-2">
            {trainees.map((trainee) => {
              const heldPositions = getTraineePositions(trainee.id, assignments);
              const isHere = heldPositions.includes(selectingPosition);
              const fitnessRating = calculatePositionFitnessRating(
                trainee.stats,
                selectingPosition,
              );

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
                  <span className="whitespace-nowrap text-xs font-medium text-brand-cyan">
                    기초 적합도 {fitnessRating}/5
                  </span>
                </button>
              );
            })}
            <p className="px-1 pt-1 text-[11px] leading-5 text-slate-400">
              기초 적합도는 현재 능력치 기준 예상치입니다. 최종 배정은 훈련 뒤
              포지션 선발전 결과를 보고 확정합니다.
            </p>
            <button
              type="button"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-center text-xs text-slate-400 transition duration-150 ease-out hover:border-red-400/50 active:scale-[0.96]"
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
