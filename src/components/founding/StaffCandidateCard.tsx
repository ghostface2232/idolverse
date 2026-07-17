import { Button } from "@/components/common/Button";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { PixelText } from "@/components/common/PixelText";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { StatBar } from "@/components/common/StatBar";
import { StaffPotentialStars } from "@/components/staff/StaffPotentialStars";
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
  const otherHired = roleFilled && !alreadyHired;
  const buttonLabel = alreadyHired ? "채용 해제" : otherHired ? "다시 선택" : "채용";
  const hasProfileImage =
    staff.profileImagePath !== undefined && staff.profileSpriteIndex !== undefined;

  return (
    <div
      className={[
        "space-y-3 rounded-[28px] border-2 p-4 transition duration-150 [word-break:keep-all] [overflow-wrap:break-word]",
        radioTileClasses(alreadyHired, roleFilled),
      ].join(" ")}
    >
      <div className="flex gap-3">
        <div
          aria-hidden="true"
          className={[
            "h-20 w-20 shrink-0 rounded-xl border-2 bg-slate-950",
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
              <PixelText
                as="p"
                className="text-lg text-slate-50 [text-shadow:none]"
              >
                {staff.name}
              </PixelText>
              {staff.specialty && (
                <p className="mt-1 text-xs text-slate-400">{staff.specialty}</p>
              )}
            </div>
            <MoneyDisplay amount={staff.salary} size="sm" />
          </div>

          <StatBar label="능력" value={staff.ability} />
          <StaffPotentialStars staff={staff} className="text-xs" />
        </div>
      </div>

      <Button
        tone={alreadyHired || otherHired ? "ghost" : "primary"}
        className="w-full"
        onClick={() => (alreadyHired ? onCancelHire(staff) : onHire(staff))}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
