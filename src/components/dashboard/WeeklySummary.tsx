import { Card } from "@/components/common/Card";
import { StatBar } from "@/components/common/StatBar";
import { INVESTOR_PROFILES } from "@/data/investors";
import { useAppStore } from "@/stores/appStore";

export function WeeklySummary() {
  const game = useAppStore((state) => state.game);
  const trainee = useAppStore((state) => state.trainee);
  const fandom = useAppStore((state) => state.fandom);
  const investor = INVESTOR_PROFILES[game.investorType];

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-cyan">
          Weekly Snapshot
        </p>
        <h2 className="text-xl font-semibold text-slate-50">
          Week {game.currentWeek} · {game.season}
        </h2>
        <p className="text-sm text-slate-400">{investor.focus}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-800/70 p-3">
          <p className="text-slate-400">Members</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {trainee.activeMembers}
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
        <StatBar label="Condition" value={trainee.averageCondition} tone="cyan" />
        <StatBar label="Chemistry" value={trainee.chemistryAverage + 50} />
        <StatBar label="Public" value={fandom.publicRecognition} tone="cyan" />
        <StatBar label="Core Fandom" value={fandom.coreFandom} />
      </div>
    </Card>
  );
}

