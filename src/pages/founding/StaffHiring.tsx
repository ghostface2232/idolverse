import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Modal } from "@/components/common/Modal";
import { PixelText } from "@/components/common/PixelText";
import { StaffCandidateCard } from "@/components/founding/StaffCandidateCard";
import { FOUNDING_RECRUITMENT_COSTS, STAFF_MISSING_WARNINGS, STAFF_ROLE_LABELS } from "@/data/founding";
import { STAFF_SALARY_BANDS } from "@/data/balance";
import { generateStaffCandidates } from "@/systems/recruitSystem";
import { useStaffStore } from "@/stores/staffStore";
import { staffVanillaStore } from "@/stores/staffStore";
import { financeVanillaStore, useFinanceStore } from "@/stores/financeStore";
import { useFoundingStore, foundingVanillaStore } from "@/stores/foundingStore";
import type { Staff, StaffRole } from "@/types/game";

const ROLES: StaffRole[] = ["manager", "producer", "designer", "marketer"];

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

  const salaryRange = {
    min: STAFF_SALARY_BANDS[0].annualSalary,
    max: STAFF_SALARY_BANDS[STAFF_SALARY_BANDS.length - 1].annualSalary,
  };

  const generateAll = useCallback(
    (s: number) => {
      for (const role of ROLES) {
        const list = generateStaffCandidates(role, salaryRange, s + ROLES.indexOf(role), 4);
        foundingVanillaStore.getState().setStaffCandidates(role, list);
      }
    },
    [salaryRange],
  );

  useEffect(() => {
    if (candidates.manager.length === 0) {
      generateAll(seed);
    }
  }, [candidates.manager.length, generateAll, seed]);

  const hiredIds = new Set(staff.map((s) => s.id));
  const hasManager = staff.some((s) => s.role === "manager");

  const handleHire = (target: Staff) => {
    staffVanillaStore.getState().hireStaff(target);
    const totalSalary = [...staff, target].reduce((sum, s) => sum + s.salary, 0);
    financeVanillaStore.getState().updateFixedCosts({ staffSalary: totalSalary });
  };

  const handleRefresh = () => {
    if (money < FOUNDING_RECRUITMENT_COSTS.staffRefresh) return;
    financeVanillaStore.getState().subtractMoney(FOUNDING_RECRUITMENT_COSTS.staffRefresh);
    const newSeed = Date.now();
    foundingVanillaStore.getState().setStaffCandidateSeed(newSeed);
    generateAll(newSeed);
  };

  const handleNext = () => {
    const missingRoles = ROLES.filter(
      (role) => role !== "manager" && !staff.some((s) => s.role === role),
    );
    if (missingRoles.length > 0) {
      setWarningOpen(true);
    } else {
      onNext();
    }
  };

  const missingWarnings = ROLES
    .filter((role) => !staff.some((s) => s.role === role))
    .filter((role) => role !== "manager");

  const roleCounts = ROLES.map((role) => ({
    role,
    count: staff.filter((s) => s.role === role).length,
  }));

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
        <PixelText as="h2" className="pt-2 text-2xl text-brand-cyan">
          스태프 채용
        </PixelText>

        <Card className="flex items-center gap-3 py-2 text-xs text-slate-300">
          {roleCounts.map(({ role, count }) => (
            <span key={role} className={count > 0 ? "text-emerald-300" : "text-slate-500"}>
              {STAFF_ROLE_LABELS[role]} {count}명
            </span>
          ))}
        </Card>

        <div className="flex gap-1">
          {ROLES.map((role) => (
            <button
              key={role}
              className={[
                "flex-1 rounded-xl px-2 py-2 text-xs transition",
                activeRole === role
                  ? "bg-brand-cyan/20 text-brand-cyan"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200",
              ].join(" ")}
              onClick={() => setActiveRole(role)}
            >
              {STAFF_ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {candidates[activeRole].map((candidate) => (
            <StaffCandidateCard
              key={candidate.id}
              staff={candidate}
              alreadyHired={hiredIds.has(candidate.id)}
              onHire={(s) => setConfirmTarget(s)}
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
        <div />
        <Button disabled={!hasManager} onClick={handleNext}>
          다음 단계
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
          title="미채용 역할 경고"
          onClose={() => setWarningOpen(false)}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button tone="ghost" onClick={() => setWarningOpen(false)}>
                돌아가기
              </Button>
              <Button
                onClick={() => {
                  setWarningOpen(false);
                  onNext();
                }}
              >
                계속 진행
              </Button>
            </div>
          }
        >
          <div className="space-y-2 text-center text-sm [word-break:keep-all] [overflow-wrap:break-word]">
            {missingWarnings.map((role) => (
              <p key={role} className="text-amber-300">
                {STAFF_MISSING_WARNINGS[role]}
              </p>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
