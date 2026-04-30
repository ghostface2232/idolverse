import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Modal } from "@/components/common/Modal";
import { StaffCandidateCard } from "@/components/founding/StaffCandidateCard";
import { FoundingTitleBar } from "@/components/founding/FoundingTitleBar";
import {
  FOUNDING_RECRUITMENT_COSTS,
  STAFF_MISSING_WARNINGS,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_ORDER,
} from "@/data/founding";
import { getStaffProfileByName } from "@/data/staffProfiles";
import { STAFF_SALARY_BANDS } from "@/data/balance";
import { generateStaffCandidates } from "@/systems/recruitSystem";
import { useStaffStore } from "@/stores/staffStore";
import { staffVanillaStore } from "@/stores/staffStore";
import { financeVanillaStore, useFinanceStore } from "@/stores/financeStore";
import { useFoundingStore, foundingVanillaStore } from "@/stores/foundingStore";
import type { Staff, StaffRole } from "@/types/game";

const STAFF_CANDIDATE_COUNT = 4;

const salaryRange = {
  min: STAFF_SALARY_BANDS[0].annualSalary,
  max: STAFF_SALARY_BANDS[STAFF_SALARY_BANDS.length - 1].annualSalary,
};

function withLinkedProfiles(role: StaffRole, staffList: Staff[]): Staff[] {
  return staffList.map((member) => {
    if (member.profileImagePath !== undefined && member.profileSpriteIndex !== undefined) {
      return member;
    }

    const profile = getStaffProfileByName(role, member.name);
    if (profile === null) {
      return member;
    }

    return {
      ...member,
      profileImagePath: profile.profileImagePath,
      profileSpriteIndex: profile.profileSpriteIndex,
    };
  });
}

interface StaffHiringProps {
  onNext: () => void;
}

export function StaffHiring({ onNext }: StaffHiringProps) {
  const [activeRole, setActiveRole] = useState<StaffRole>("manager");
  const [confirmTarget, setConfirmTarget] = useState<Staff | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);

  const staff = useStaffStore((s) => s.staff);
  const money = useFinanceStore((s) => s.money);
  const candidates = useFoundingStore((s) => s.staffCandidates);
  const seed = useFoundingStore((s) => s.staffCandidateSeed);

  const role = activeRole;
  const roleIndex = STAFF_ROLE_ORDER.indexOf(role);
  const currentCandidates = candidates[role];
  const currentRoleHires = staff.filter((s) => s.role === role);
  const currentRoleHire = currentRoleHires[0] ?? null;
  const displayedCandidates = currentRoleHire
    ? [
        currentRoleHire,
        ...currentCandidates.filter((candidate) => candidate.id !== currentRoleHire.id),
      ]
    : currentCandidates;
  const displayCandidates = withLinkedProfiles(role, displayedCandidates);
  const hasCurrentRole = currentRoleHires.length > 0;
  const isManagerStep = role === "manager";
  const isFinalStaffStep = role === "marketer";

  const generateRole = useCallback((targetRole: StaffRole, s: number) => {
    const roleOffset = STAFF_ROLE_ORDER.indexOf(targetRole);
    const list = generateStaffCandidates(
      targetRole,
      salaryRange,
      s + roleOffset,
      STAFF_CANDIDATE_COUNT,
    );
    foundingVanillaStore.getState().setStaffCandidates(targetRole, list);
  }, []);

  useEffect(() => {
    if (currentCandidates.length === 0) {
      generateRole(role, seed);
    }
  }, [currentCandidates.length, generateRole, role, seed]);

  const hiredIds = new Set(staff.map((s) => s.id));

  const handleHire = (target: Staff) => {
    if (staff.some((s) => s.role === target.role)) return;
    staffVanillaStore.getState().hireStaff(target);
    const totalSalary = [...staff, target].reduce((sum, s) => sum + s.salary, 0);
    financeVanillaStore.getState().updateFixedCosts({ staffSalary: totalSalary });
  };

  const handleCancelHire = (target: Staff) => {
    staffVanillaStore.getState().fireStaff(target.id);
    const totalSalary = staff
      .filter((s) => s.id !== target.id)
      .reduce((sum, s) => sum + s.salary, 0);
    financeVanillaStore.getState().updateFixedCosts({ staffSalary: totalSalary });
  };

  const handleRefresh = () => {
    if (money < FOUNDING_RECRUITMENT_COSTS.staffRefresh) return;
    financeVanillaStore.getState().subtractMoney(FOUNDING_RECRUITMENT_COSTS.staffRefresh);
    const newSeed = Date.now();
    foundingVanillaStore.getState().setStaffCandidateSeed(newSeed);
    generateRole(role, newSeed);
  };

  const handleNext = () => {
    if (!hasCurrentRole && !isManagerStep) {
      setWarningOpen(true);
    } else {
      advanceRole();
    }
  };

  const advanceRole = () => {
    if (isFinalStaffStep) {
      onNext();
      return;
    }

    setActiveRole(STAFF_ROLE_ORDER[roleIndex + 1]);
  };

  const goPreviousRole = () => {
    if (roleIndex > 0) {
      setActiveRole(STAFF_ROLE_ORDER[roleIndex - 1]);
    }
  };

  const nextButtonLabel = isFinalStaffStep ? "시설 투자로" : "다음 역할";

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
        <FoundingTitleBar title={`${STAFF_ROLE_LABELS[role]} 채용`} />

        <Card className="space-y-2 py-3 text-xs text-slate-300">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">
              스태프 {roleIndex + 1}/{STAFF_ROLE_ORDER.length}
            </span>
            <span className={hasCurrentRole ? "text-emerald-300" : "text-amber-300"}>
              {currentRoleHire ? `${currentRoleHire.name} 채용됨` : "미채용"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {STAFF_ROLE_ORDER.map((staffRole) => {
              const hired = staff.some((s) => s.role === staffRole);
              const active = staffRole === role;

              return (
                <div
                  key={staffRole}
                  className={[
                    "h-1.5 rounded-full transition",
                    hired
                      ? "bg-emerald-400"
                      : active
                        ? "bg-brand-cyan"
                        : "bg-slate-700",
                  ].join(" ")}
                />
              );
            })}
          </div>
        </Card>

        <div className="space-y-3">
          {displayCandidates.map((candidate) => (
            <StaffCandidateCard
              key={candidate.id}
              staff={candidate}
              alreadyHired={hiredIds.has(candidate.id)}
              roleFilled={hasCurrentRole}
              onHire={(s) => setConfirmTarget(s)}
              onCancelHire={handleCancelHire}
            />
          ))}
        </div>

        <Button
          tone="ghost"
          className="w-full"
          disabled={money < FOUNDING_RECRUITMENT_COSTS.staffRefresh}
          onClick={handleRefresh}
        >
          후보 새로고침 (₩{(FOUNDING_RECRUITMENT_COSTS.staffRefresh / 10000).toLocaleString()}만)
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-2 pt-2">
        <Button tone="ghost" disabled={roleIndex === 0} onClick={goPreviousRole}>
          이전 역할
        </Button>
        <Button disabled={isManagerStep && !hasCurrentRole} onClick={handleNext}>
          {nextButtonLabel}
        </Button>
      </div>

      {confirmTarget && (
        <Modal
          title="채용 확인"
          onClose={() => setConfirmTarget(null)}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button tone="ghost" onClick={() => setConfirmTarget(null)}>
                취소
              </Button>
              <Button
                onClick={() => {
                  handleHire(confirmTarget);
                  setConfirmTarget(null);
                }}
              >
                채용
              </Button>
            </div>
          }
        >
          <p className="text-center text-sm text-slate-300 [word-break:keep-all] [overflow-wrap:break-word]">
            <span className="text-slate-50">{confirmTarget.name}</span>의 월급{" "}
            <span className="text-emerald-300">
              ₩{new Intl.NumberFormat("ko-KR").format(confirmTarget.salary)}
            </span>
            이 고정비에 추가됩니다.
          </p>
        </Modal>
      )}

      {warningOpen && (
        <Modal
          title="미채용 경고"
          onClose={() => setWarningOpen(false)}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button tone="ghost" onClick={() => setWarningOpen(false)}>
                돌아가기
              </Button>
              <Button
                onClick={() => {
                  setWarningOpen(false);
                  advanceRole();
                }}
              >
                건너뛰기
              </Button>
            </div>
          }
        >
          <p className="text-center text-sm text-amber-300 [word-break:keep-all] [overflow-wrap:break-word]">
            {STAFF_MISSING_WARNINGS[role]}
          </p>
        </Modal>
      )}
    </>
  );
}
