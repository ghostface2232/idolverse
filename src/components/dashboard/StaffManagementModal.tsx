import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { StaffPotentialStars } from "@/components/staff/StaffPotentialStars";
import {
  FOUNDING_STAFF_ABILITY_CAP,
  STAFF_MARKET,
} from "@/data/balance";
import { STAFF_ROLE_LABELS, STAFF_ROLE_ORDER } from "@/data/founding";
import { getStaffTrainingsForRole } from "@/data/staffTraining";
import { generateStaffCandidates } from "@/systems/recruitSystem";
import {
  getTrainingFamiliarity,
  type StaffTrainingResult,
} from "@/systems/staffTrainingSystem";
import type { Staff, StaffTrainingId } from "@/types/game";

interface StaffManagementModalProps {
  staff: readonly Staff[];
  money: number;
  industry: number;
  campaignSeed: number;
  cumulativeWeek: number;
  isSaving: boolean;
  errorMessage?: string | null;
  onHire: (candidate: Staff) => void | Promise<void>;
  onTrain: (
    staffId: string,
    trainingId: StaffTrainingId,
  ) => Promise<StaffTrainingResult | null>;
  onClose: () => void;
}

/**
 * 상시 스태프 시장(M5). 후보는 매주 회전하고, 풀 상한은 업계 신뢰와 함께
 * 열린다. 교체는 팀 만족도로 대가를 치른다.
 */
export function StaffManagementModal({
  staff,
  money,
  industry,
  campaignSeed,
  cumulativeWeek,
  isSaving,
  errorMessage,
  onHire,
  onTrain,
  onClose,
}: StaffManagementModalProps) {
  const [expandedRole, setExpandedRole] = useState<Staff["role"] | null>(null);
  const [trainingFeedback, setTrainingFeedback] = useState<string | null>(null);
  const poolCap = Math.round(
    FOUNDING_STAFF_ABILITY_CAP + industry * STAFF_MARKET.industryScale,
  );
  const candidatesByRole = useMemo(
    () =>
      STAFF_ROLE_ORDER.map((role, index) => ({
        role,
        candidates: generateStaffCandidates(
          role,
          campaignSeed + cumulativeWeek * 7 + index,
          STAFF_MARKET.candidatesPerRole,
          poolCap,
        ),
      })),
    [campaignSeed, cumulativeWeek, poolCap],
  );

  return (
    <Modal title="인사 관리" onClose={onClose} isCloseDisabled={isSaving}>
      <div className="space-y-4 text-sm [word-break:keep-all]">
        <p className="text-pretty text-xs leading-5 text-text-muted">
          업계 신뢰가 오르면 더 좋은 인재가 찾아오고, 함께해 온 스태프를
          내보내면 멤버들의 만족도가 눈에 띄게 떨어집니다.
        </p>

        {candidatesByRole.map(({ role, candidates }) => {
          const current = staff.find((member) => member.role === role);
          const isExpanded = expandedRole === role;
          const trainings = getStaffTrainingsForRole(role);
          return (
            <section key={role}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
                {STAFF_ROLE_LABELS[role]}
              </h3>
              <button
                type="button"
                aria-expanded={isExpanded}
                disabled={isSaving}
                className="mt-1.5 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-surface-shell/72 px-3 py-2 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-colors duration-150 hover:bg-surface-shell disabled:cursor-not-allowed disabled:opacity-45"
                onClick={() => {
                  setTrainingFeedback(null);
                  setExpandedRole(isExpanded ? null : role);
                }}
              >
                {current ? (
                  <span className="min-w-0 text-xs">
                    <span className="block font-semibold text-text-primary">
                      {current.name}
                      <span className="ml-2 tabular-nums text-text-muted">
                        능력 {Math.floor(current.ability)}
                      </span>
                    </span>
                    <StaffPotentialStars staff={current} className="mt-1" />
                  </span>
                ) : (
                  <span className="text-xs text-rose-300">
                    공석입니다. 담당 업무가 멈춰 있습니다.
                  </span>
                )}
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-muted">
                  {isExpanded ? "접기" : "후보·훈련"}
                  <ChevronDown
                    className={`size-4 transition-transform duration-150 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </span>
              </button>

              {isExpanded ? (
                <>
                  {current ? (
                    <div className="mt-1.5 rounded-xl border border-action-secondary/25 bg-action-secondary/5 p-2.5">
                      <p className="px-1 text-xs leading-5 text-text-muted">
                        비용을 들여 새 경험을 쌓게 하되, 같은 활동을 반복하면
                        효과가 줄어듭니다.
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {trainings.map((training) => {
                          const count =
                            current.trainingCounts?.[training.id] ?? 0;
                          const canAfford = money >= training.cost;
                          return (
                            <div
                              key={training.id}
                              className="flex items-center justify-between gap-3 rounded-lg bg-surface-shell/70 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-text-primary">
                                  {training.name}
                                </p>
                                <p className="mt-0.5 text-xs leading-5 text-text-muted">
                                  {training.description}
                                </p>
                                <p className="mt-1 text-xs text-slate-300">
                                  {getTrainingFamiliarity(count)} ·{" "}
                                  <MoneyDisplay
                                    amount={training.cost}
                                    size="sm"
                                  />
                                </p>
                              </div>
                              <Button
                                tone="secondary"
                                className="min-h-11 shrink-0 px-3 py-1.5 text-xs"
                                isDisabled={isSaving || !canAfford}
                                onPress={async () => {
                                  setTrainingFeedback(null);
                                  const result = await onTrain(
                                    current.id,
                                    training.id,
                                  );
                                  if (!result) return;
                                  setTrainingFeedback(
                                    result.abilityGain < 0.05
                                      ? `${current.name}에게 큰 변화는 없었습니다.`
                                      : result.abilityGain >= 1
                                        ? `${current.name}의 실력이 눈에 띄게 늘었습니다.`
                                        : `${current.name}의 실력이 조금 늘었습니다.`,
                                  );
                                }}
                              >
                                {canAfford ? "진행" : "자금 부족"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      {trainingFeedback ? (
                        <p
                          role="status"
                          className="mt-2 rounded-lg bg-action-secondary/10 px-3 py-2 text-xs text-cyan-100"
                        >
                          {trainingFeedback}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-1.5 space-y-1.5">
                    {candidates.map((candidate) => {
                      return (
                        <div
                          key={candidate.id}
                          className="flex items-center justify-between gap-2 rounded-xl bg-surface-shell/50 px-3 py-2"
                        >
                          <span className="min-w-0 text-xs">
                            <span className="font-semibold text-text-primary">
                              {candidate.name}
                            </span>
                            <span className="ml-2 tabular-nums text-text-muted">
                              능력 {Math.floor(candidate.ability)}
                            </span>
                            <StaffPotentialStars
                              staff={candidate}
                              className="ml-2"
                              showLabel={false}
                            />
                            <span className="ml-2 text-text-muted">
                              월{" "}
                              <MoneyDisplay
                                amount={candidate.salary}
                                size="sm"
                              />
                            </span>
                          </span>
                          <Button
                            tone="secondary"
                            className="min-h-11 shrink-0 px-3 py-1.5 text-xs"
                            isDisabled={isSaving || money <= 0}
                            onPress={() => void onHire(candidate)}
                          >
                            {current ? "교체" : "영입"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </section>
          );
        })}

        {errorMessage ? <Alert message={errorMessage} /> : null}
      </div>
    </Modal>
  );
}
