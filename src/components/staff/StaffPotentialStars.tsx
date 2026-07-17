import { staffPotentialToStars } from "@/systems/staffTrainingSystem";
import type { Staff } from "@/types/game";

interface StaffPotentialStarsProps {
  staff: Staff;
  className?: string;
  showLabel?: boolean;
}

export function StaffPotentialStars({
  staff,
  className = "",
  showLabel = true,
}: StaffPotentialStarsProps) {
  const stars = staffPotentialToStars(staff);

  return (
    <span
      role="img"
      aria-label={`성장 잠재력 별 ${stars}개, 5개 중`}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {showLabel ? <span className="text-text-muted">잠재력</span> : null}
      <span aria-hidden="true" className="tracking-[0.08em]">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={index < stars ? "text-amber-300" : "text-slate-600"}
          >
            ★
          </span>
        ))}
      </span>
    </span>
  );
}
