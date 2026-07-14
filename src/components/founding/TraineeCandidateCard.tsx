import { BadgeIcon } from "@/components/common/BadgeIcon";
import { Card } from "@/components/common/Card";
import { PixelText } from "@/components/common/PixelText";
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
  // 후보 비교 시 강점이 한눈에 보이도록 상위 2개 능력치를 강조한다.
  const topStatKeys = [...STAT_DISPLAY_ORDER]
    .sort((a, b) => trainee.stats[b] - trainee.stats[a])
    .slice(0, 2);
  const topAffinities = Object.entries(trainee.conceptAffinity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  const isForeign = trainee.nationality !== "korean";
  const flag = NATIONALITY_FLAGS[trainee.nationality];

  return (
    <button
      type="button"
      className="w-full text-left transition-transform duration-150 ease-out active:scale-[0.96]"
      onClick={() => onToggle(trainee.id)}
    >
      <Card
        className={[
          "space-y-3 transition [word-break:keep-all] [overflow-wrap:break-word]",
          selected
            ? "border-emerald-400 ring-2 ring-emerald-400/40"
            : "hover:border-emerald-400/50",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <PixelText className="text-lg text-slate-50 [text-shadow:none]">
              {trainee.name}
            </PixelText>
            <span className="text-xs text-slate-400">
              {trainee.age}세 · {flag}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {selected && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">
                선발
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {STAT_DISPLAY_ORDER.map((key) => (
            <StatBar
              key={key}
              label={STAT_LABELS[key]}
              value={trainee.stats[key]}
              emphasized={topStatKeys.includes(key)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">
            잠재력 {"★".repeat(stars)}{"☆".repeat(5 - stars)}
          </span>
          {topAffinities.map(([mood]) => (
            <span
              key={mood}
              className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
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
