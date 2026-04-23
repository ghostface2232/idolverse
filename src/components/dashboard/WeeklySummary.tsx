import { Card } from "@/components/common/Card";
import { StatBar } from "@/components/common/StatBar";
import { INVESTOR_PROFILES } from "@/data/investors";
import { useFandomStore } from "@/stores/fandomStore";
import { useGameStore } from "@/stores/gameStore";
import { useTraineeStore } from "@/stores/traineeStore";

export function WeeklySummary() {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const currentSeason = useGameStore((state) => state.currentSeason);
  const investorType = useGameStore((state) => state.investorType);
  const trainees = useTraineeStore((state) => state.trainees);
  const publicScore = useFandomStore((state) => state.public);
  const fandomSize = useFandomStore((state) => state.fandom);
  const investor = INVESTOR_PROFILES[investorType];
  const averageCondition =
    trainees.reduce((sum, trainee) => sum + trainee.condition, 0) /
    Math.max(trainees.length, 1);
  const chemistryAverage = getChemistryAverage(trainees);

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-cyan">
          Weekly Snapshot
        </p>
        <h2 className="text-xl font-semibold text-slate-50">
          Week {currentWeek} · {currentSeason}
        </h2>
        <p className="text-sm text-slate-400">{investor.focus}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-800/70 p-3">
          <p className="text-slate-400">Members</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {trainees.length}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-800/70 p-3">
          <p className="text-slate-400">Investor</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {investor.label}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <StatBar label="Condition" value={Math.round(averageCondition)} tone="cyan" />
        <StatBar label="Chemistry" value={Math.round((chemistryAverage + 100) / 2)} />
        <StatBar label="Public" value={publicScore} tone="cyan" />
        <StatBar label="Core Fandom" value={Math.min(100, Math.round(fandomSize / 100))} />
      </div>
    </Card>
  );
}

function getChemistryAverage(
  trainees: Array<{ id: string; chemistry: Record<string, number> }>,
) {
  const seenPairs = new Set<string>();
  const chemistryValues: number[] = [];

  trainees.forEach((trainee) => {
    Object.entries(trainee.chemistry).forEach(([targetId, value]) => {
      const key = [trainee.id, targetId].sort().join(":");

      if (!seenPairs.has(key)) {
        seenPairs.add(key);
        chemistryValues.push(value);
      }
    });
  });

  if (chemistryValues.length === 0) {
    return 0;
  }

  return (
    chemistryValues.reduce((sum, value) => sum + value, 0) /
    chemistryValues.length
  );
}
