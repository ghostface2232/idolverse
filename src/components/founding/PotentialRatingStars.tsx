import type { PositionPotentialRating } from "@/data/founding";

interface PotentialRatingStarsProps {
  rating: PositionPotentialRating;
}

export function PotentialRatingStars({ rating }: PotentialRatingStarsProps) {
  return (
    <span
      className="whitespace-nowrap tracking-[0.08em] text-amber-300"
      role="img"
      aria-label={`별 ${rating}개, 5개 중`}
    >
      <span aria-hidden="true">{"★".repeat(rating)}</span>
      <span aria-hidden="true" className="text-slate-600">
        {"★".repeat(5 - rating)}
      </span>
    </span>
  );
}
