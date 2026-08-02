import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { StaffPotentialStars } from "@/components/staff/StaffPotentialStars";
import { StaffPortrait } from "@/components/visual/StaffPortrait";
import { STAFF_MARKET } from "@/data/balance";
import { STAFF_ROLE_LABELS, STAFF_ROLE_ORDER } from "@/data/founding";
import { getStaffTrainingsForRole } from "@/data/staffTraining";
import { getRecruitmentPostCandidates } from "@/systems/recruitSystem";
import { getWeeklyStaffSalary } from "@/utils/staffSalary";
import {
  getTrainingFamiliarity,
  type StaffTrainingResult,
} from "@/systems/staffTrainingSystem";
import type {
  Staff,
  StaffRecruitmentPost,
  StaffRole,
  StaffTrainingId,
} from "@/types/game";

interface StaffManagementModalProps {
  staff: readonly Staff[];
  recruitmentPosts: readonly StaffRecruitmentPost[];
  money: number;
  cumulativeWeek: number;
  isSaving: boolean;
  errorMessage?: string | null;
  onStartRecruitment: (role: StaffRole) => void | Promise<void>;
  onCloseRecruitment: (role: StaffRole) => void | Promise<void>;
  onHire: (candidate: Staff) => void | Promise<void>;
  onTrain: (
    staffId: string,
    trainingId: StaffTrainingId,
  ) => Promise<StaffTrainingResult | null>;
  onClose: () => void;
}

/**
 * 인사 관리(M5). 교체·영입은 모집 공고를 내고 후보 명단이 도착한 뒤에
 * 결정한다. 교체는 팀 만족도로 대가를 치른다.
 */
export function StaffManagementModal({
  staff,
  recruitmentPosts,
  money,
  cumulativeWeek,
  isSaving,
  errorMessage,
  onStartRecruitment,
  onCloseRecruitment,
  onHire,
  onTrain,
  onClose,
}: StaffManagementModalProps) {
  const [expandedRole, setExpandedRole] = useState<Staff["role"] | null>(null);
  const [trainingFeedback, setTrainingFeedback] = useState<string | null>(null);

  return (
    <Modal title="인사 관리" onClose={onClose} isCloseDisabled={isSaving}>
      <div className="space-y-4 text-sm [word-break:keep-all]">
        <p className="text-pretty text-xs leading-5 text-text-muted">
          교체·영입은 모집 공고를 내고 후보 명단이 도착한 뒤 결정할 수
          있습니다. 업계 신뢰가 오르면 더 좋은 인재가 찾아오고, 함께해 온
          스태프를 내보내면 멤버들의 만족도가 눈에 띄게 떨어집니다.
        </p>

        {STAFF_ROLE_ORDER.map((role) => {
          const current = staff.find((member) => member.role === role);
          const isExpanded = expandedRole === role;
          const trainings = getStaffTrainingsForRole(role);
          const post = recruitmentPosts.find((entry) => entry.role === role);
          const postReady = post ? cumulativeWeek >= post.completesAtWeek : false;
          const candidates = post && postReady
            ? getRecruitmentPostCandidates(post)
            : [];
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
                  <span className="flex min-w-0 items-center gap-2.5">
                    <StaffPortrait
                      profileImagePath={current.profileImagePath}
                      profileSpriteIndex={current.profileSpriteIndex}
                      size="md"
                    />
                    <span className="min-w-0 text-xs">
                      <span className="block truncate font-semibold text-text-primary">
                        {current.name}
                        <span className="ml-2 tabular-nums text-text-muted">
                          능력 {Math.floor(current.ability)}
                        </span>
                      </span>
                      <StaffPotentialStars staff={current} className="mt-1" />
                    </span>
                  </span>
                ) : (
                  <span className="flex min-w-0 items-center gap-2.5">
                    <StaffPortrait size="md" />
                    <span className="text-xs text-rose-300">
                      공석입니다. 담당 업무가 멈춰 있습니다.
                    </span>
                  </span>
                )}
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-muted">
                  {post ? (
                    <span
                      className={
                        postReady
                          ? "rounded-full bg-action-secondary/15 px-2 py-0.5 text-cyan-200"
                          : "rounded-full bg-white/[0.06] px-2 py-0.5"
                      }
                    >
                      {postReady
                        ? "후보 도착"
                        : `모집 중 · ${post.completesAtWeek - cumulativeWeek}주 남음`}
                    </span>
                  ) : null}
                  {isExpanded ? "접기" : "모집·훈련"}
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
                        비용을 들여 새 경험을 쌓게 하되, 훈련은 1주에 1회만
                        진행할 수 있고 같은 활동을 반복하면 효과가 줄어듭니다.
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {trainings.map((training) => {
                          const count =
                            current.trainingCounts?.[training.id] ?? 0;
                          const canAfford = money >= training.cost;
                          const trainedThisWeek =
                            current.lastTrainedAtWeek === cumulativeWeek;
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
                                isDisabled={
                                  isSaving || !canAfford || trainedThisWeek
                                }
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
                                {trainedThisWeek
                                  ? "이번 주 완료"
                                  : canAfford
                                    ? "진행"
                                    : "자금 부족"}
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

                  {!post ? (
                    <div className="mt-1.5 flex items-center justify-between gap-3 rounded-xl bg-surface-shell/50 px-3 py-2.5">
                      <p className="min-w-0 text-xs leading-5 text-text-muted">
                        공고를 내면 {STAFF_MARKET.recruitmentWeeks}주 뒤 후보
                        명단이 도착합니다. 공고비{" "}
                        <MoneyDisplay
                          amount={STAFF_MARKET.recruitmentPostingCost}
                          size="sm"
                        />
                      </p>
                      <Button
                        tone="secondary"
                        className="min-h-11 shrink-0 px-3 py-1.5 text-xs"
                        isDisabled={
                          isSaving || money < STAFF_MARKET.recruitmentPostingCost
                        }
                        onPress={() => void onStartRecruitment(role)}
                      >
                        {money >= STAFF_MARKET.recruitmentPostingCost
                          ? "모집 공고 내기"
                          : "자금 부족"}
                      </Button>
                    </div>
                  ) : null}

                  {post && !postReady ? (
                    <p className="mt-1.5 rounded-xl bg-surface-shell/50 px-3 py-2.5 text-xs leading-5 text-text-muted">
                      후보를 모집하고 있습니다. {post.completesAtWeek - cumulativeWeek}
                      주 뒤 명단이 도착합니다.
                    </p>
                  ) : null}

                  {post && postReady ? (
                    <>
                      <div className="mt-1.5 space-y-1.5">
                        {candidates.map((candidate) => {
                          return (
                            <div
                              key={candidate.id}
                              className="flex items-center justify-between gap-2 rounded-xl bg-surface-shell/50 px-3 py-2"
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                <StaffPortrait
                                  profileImagePath={candidate.profileImagePath}
                                  profileSpriteIndex={candidate.profileSpriteIndex}
                                  size="md"
                                />
                                <span className="min-w-0 text-xs">
                                  <span className="block truncate font-semibold text-text-primary">
                                    {candidate.name}
                                    <span className="ml-2 font-normal tabular-nums text-text-muted">
                                      능력 {Math.floor(candidate.ability)}
                                    </span>
                                  </span>
                                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <StaffPotentialStars
                                      staff={candidate}
                                      showLabel={false}
                                    />
                                    <span className="text-text-muted">
                                      주급{" "}
                                      <MoneyDisplay
                                        amount={getWeeklyStaffSalary(
                                          candidate.salary,
                                        )}
                                        size="sm"
                                      />
                                    </span>
                                  </span>
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
                      <button
                        type="button"
                        disabled={isSaving}
                        className="mt-1.5 w-full rounded-xl bg-surface-shell/40 px-3 py-2 text-center text-xs text-text-muted transition-colors duration-150 hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => void onCloseRecruitment(role)}
                      >
                        마음에 드는 후보가 없어 공고를 마감합니다
                      </button>
                    </>
                  ) : null}
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
