import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { StatBar } from "@/components/common/StatBar";
import { getStaffProfileClassNames } from "@/data/staffProfiles";
import type { Staff } from "@/types/game";
import { assetUrl } from "@/utils/assets";

interface StaffCandidateCardProps {
  staff: Staff;
  alreadyHired: boolean;
  roleFilled?: boolean;
  onHire: (staff: Staff) => void;
  onCancelHire: (staff: Staff) => void;
}

export function StaffCandidateCard({
  staff,
  alreadyHired,
  roleFilled = false,
  onHire,
  onCancelHire,
}: StaffCandidateCardProps) {
  const disabled = roleFilled && !alreadyHired;
  const buttonLabel = alreadyHired ? "채용 취소" : roleFilled ? "채용 마감" : "채용";
  const hasProfileImage =
    staff.profileImagePath !== undefined && staff.profileSpriteIndex !== undefined;

  return (
    <Card
      className={[
        "space-y-3 [word-break:keep-all] [overflow-wrap:break-word]",
        disabled && !alreadyHired ? "opacity-50" : "",
      ].join(" ")}
    >
      <div className="flex gap-3">
        <div
          aria-hidden="true"
          className={[
            "h-20 w-20 shrink-0 rounded-2xl border-2 bg-slate-950/45",
            hasProfileImage
              ? [
                  "border-slate-500",
                  getStaffProfileClassNames(staff.profileSpriteIndex ?? 0),
                ].join(" ")
              : "border-dashed border-slate-600",
          ].join(" ")}
          style={
            hasProfileImage && staff.profileImagePath
              ? { backgroundImage: `url(${assetUrl(staff.profileImagePath)})` }
              : undefined
          }
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base text-slate-50">{staff.name}</p>
              {staff.specialty && (
                <p className="mt-1 text-xs text-slate-400">{staff.specialty}</p>
              )}
            </div>
            <MoneyDisplay amount={staff.salary} size="sm" />
          </div>

          <StatBar label="능력" value={staff.ability} />
        </div>
      </div>

      <Button
        tone={alreadyHired ? "ghost" : "primary"}
        className="w-full"
        disabled={disabled}
        onClick={() => (alreadyHired ? onCancelHire(staff) : onHire(staff))}
      >
        {buttonLabel}
      </Button>
    </Card>
  );
}
