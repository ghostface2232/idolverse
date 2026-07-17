import { PixelText } from "@/components/common/PixelText";
import { PotentialRatingStars } from "@/components/founding/PotentialRatingStars";
import { POSITION_LABELS, type PositionPotentialRating } from "@/data/founding";
import type { Position } from "@/types/game";

interface PositionSlotProps {
  position: Position;
  assignedName: string | null;
  potentialRating: PositionPotentialRating | null;
  required: boolean;
  onTap: () => void;
}

export function PositionSlot({
  position,
  assignedName,
  potentialRating,
  required,
  onTap,
}: PositionSlotProps) {
  return (
    <button
      type="button"
      className={[
        "flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition duration-150 ease-out active:scale-[0.96]",
        assignedName
          ? required
            ? "border-brand-pink/55 bg-slate-800"
            : "border-brand-cyan/55 bg-slate-800"
          : required
            ? "border-brand-pink/20 bg-slate-800 hover:border-brand-pink/45"
            : "border-brand-cyan/20 bg-slate-800 hover:border-brand-cyan/45",
      ].join(" ")}
      onClick={onTap}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-50">{POSITION_LABELS[position]}</span>
        {required && !assignedName && (
          <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-[11px] text-pink-300">
            필수
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {assignedName ? (
          <>
            <PixelText className="text-base text-slate-50 [text-shadow:none]">
              {assignedName}
            </PixelText>
            {potentialRating !== null && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                팀 내 적합도
                <PotentialRatingStars rating={potentialRating} />
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-slate-400">탭하여 배정</span>
        )}
      </div>
    </button>
  );
}
