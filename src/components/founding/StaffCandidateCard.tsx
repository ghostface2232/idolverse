import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { StatBar } from "@/components/common/StatBar";
import type { Staff } from "@/types/game";

interface StaffCandidateCardProps {
  staff: Staff;
  alreadyHired: boolean;
  onHire: (staff: Staff) => void;
}

export function StaffCandidateCard({ staff, alreadyHired, onHire }: StaffCandidateCardProps) {
  return (
    <Card
      className={[
        "space-y-3 [word-break:keep-all] [overflow-wrap:break-word]",
        alreadyHired ? "opacity-50" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base text-slate-50">{staff.name}</p>
          {staff.specialty && (
            <p className="mt-1 text-xs text-slate-400">{staff.specialty}</p>
          )}
        </div>
        <MoneyDisplay amount={staff.salary} size="sm" />
      </div>

      <StatBar label="능력" value={staff.ability} />

      <Button
        tone="primary"
        className="w-full"
        disabled={alreadyHired}
        onClick={() => onHire(staff)}
      >
        {alreadyHired ? "채용 완료" : "채용"}
      </Button>
    </Card>
  );
}
