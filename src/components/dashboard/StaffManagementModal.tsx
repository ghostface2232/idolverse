import { useMemo } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import {
  FOUNDING_STAFF_ABILITY_CAP,
  STAFF_MARKET,
} from "@/data/balance";
import { STAFF_ROLE_LABELS, STAFF_ROLE_ORDER } from "@/data/founding";
import { generateStaffCandidates } from "@/systems/recruitSystem";
import type { Staff } from "@/types/game";

/** 성장 여력은 정확한 값 대신 범위로만 읽힌다 — 스카우트의 안개. */
function headroomLabel(member: Staff): { label: string; tone: string } {
  const margin = (member.potentialCap ?? member.ability + 10) - member.ability;
  if (margin < 4) return { label: "성장 정체", tone: "text-rose-300" };
  if (margin < 12) return { label: "성장 여지", tone: "text-slate-300" };
  return { label: "대기만성", tone: "text-emerald-300" };
}

interface StaffManagementModalProps {
  staff: readonly Staff[];
  money: number;
  industry: number;
  campaignSeed: number;
  cumulativeWeek: number;
  isSaving: boolean;
  errorMessage?: string | null;
  onHire: (candidate: Staff) => void | Promise<void>;
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
  onClose,
}: StaffManagementModalProps) {
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
      <div className="space-y-4 text-sm">
        <p className="text-pretty text-xs leading-5 text-text-muted">
          이번 주 시장 풀 상한 {poolCap}. 업계 신뢰가 오르면 더 좋은 인재가
          찾아옵니다. 후보는 매주 바뀌고, 함께해 온 스태프의 교체는 멤버들의
          만족도({STAFF_MARKET.replaceTeamSatisfactionPenalty})로 돌아옵니다.
        </p>

        {candidatesByRole.map(({ role, candidates }) => {
          const current = staff.find((member) => member.role === role);
          const headroom = current ? headroomLabel(current) : null;
          return (
            <section key={role}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
                {STAFF_ROLE_LABELS[role]}
              </h3>
              <div className="mt-1.5 rounded-xl bg-surface-shell/72 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                {current ? (
                  <span className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-text-primary">
                      {current.name}
                      <span className="ml-2 tabular-nums text-text-muted">
                        능력 {Math.floor(current.ability)}
                      </span>
                    </span>
                    <span className={headroom?.tone}>{headroom?.label}</span>
                  </span>
                ) : (
                  <span className="text-xs text-rose-300">공석. 전문 작업이 멈춰 있습니다</span>
                )}
              </div>
              <div className="mt-1.5 space-y-1.5">
                {candidates.map((candidate) => {
                  const candidateHeadroom = headroomLabel(candidate);
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
                          능력 {candidate.ability}
                        </span>
                        <span className={`ml-2 ${candidateHeadroom.tone}`}>
                          {candidateHeadroom.label}
                        </span>
                        <span className="ml-2 text-text-muted">
                          월 <MoneyDisplay amount={candidate.salary} size="sm" />
                        </span>
                      </span>
                      <Button
                        tone="secondary"
                        className="shrink-0 px-3 py-1.5 text-xs"
                        isDisabled={isSaving || money <= 0}
                        onPress={() => void onHire(candidate)}
                      >
                        {current ? "교체" : "영입"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {errorMessage ? (
          <p role="alert" className="rounded-xl bg-state-danger/12 px-3 py-2 text-rose-200">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
