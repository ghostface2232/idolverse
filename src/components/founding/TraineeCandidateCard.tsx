import { BadgeIcon } from "@/components/common/BadgeIcon";
import { Card } from "@/components/common/Card";
import { StatBar } from "@/components/common/StatBar";
import { CONCEPT_MOOD_DATA } from "@/data/concepts";
import { NATIONALITY_FLAGS, potentialToStars } from "@/data/founding";
import type { Trainee, TraineeStatKey } from "@/types/game";

interface TraineeCandidateCardProps {
  trainee: Trainee;
  selected: boolean;
  onToggle: (id: string) => void;
}

const STAT_LABELS: Record<string, string> = {
  visual: "비주얼",
  vocal: "보컬",
  dance: "댄스",
  charm: "매력",
  stamina: "체력",
  mental: "멘탈",
};

const STAT_DISPLAY_ORDER: TraineeStatKey[] = [
  "visual",
  "vocal",
  "dance",
  "charm",
  "stamina",
  "mental",
];

export function TraineeCandidateCard({ trainee, selected, onToggle }: TraineeCandidateCardProps) {
  const stars = potentialToStars(trainee.potential);
  const topAffinities = Object.entries(trainee.conceptAffinity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  const isForeign = trainee.nationality !== "korean";
  const flag = NATIONALITY_FLAGS[trainee.nationality];

  return (
    <button
      type="button"
      className="w-full text-left"
      onClick={() => onToggle(trainee.id)}
    >
      <Card
        className={[
          "space-y-3 transition [word-break:keep-all] [overflow-wrap:break-word]",
          selected
            ? "border-brand-pink ring-2 ring-brand-pink/50"
            : "hover:border-brand-cyan/60",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{flag}</span>
            <span className="text-base text-slate-50">{trainee.name}</span>
            <span className="text-xs text-slate-400">{trainee.age}세</span>
          </div>
          <div className="flex items-center gap-1">
            {selected && (
              <span className="rounded-full bg-brand-pink/20 px-2 py-0.5 text-xs text-pink-200">
                선발
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {STAT_DISPLAY_ORDER.map((key) => (
            <StatBar key={key} label={STAT_LABELS[key]} value={trainee.stats[key]} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">
            잠재력 {"★".repeat(stars)}{"☆".repeat(5 - stars)}
          </span>
          {topAffinities.map(([mood]) => (
            <span
              key={mood}
              className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
            >
              {CONCEPT_MOOD_DATA[mood as keyof typeof CONCEPT_MOOD_DATA]?.label ?? mood}
            </span>
          ))}
          {isForeign && (
            <BadgeIcon icon={flag} label="해외 팬덤 보너스" tone="amber" />
          )}
        </div>
      </Card>
    </button>
  );
}
