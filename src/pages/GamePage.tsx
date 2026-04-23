import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { DecisionCardDeck } from "@/components/dashboard/DecisionCardDeck";
import { WeeklySummary } from "@/components/dashboard/WeeklySummary";
import { EventBus, PhaserEvents } from "@/game/EventBus";
import { PhaserGame } from "@/game/PhaserGame";
import { useAppStore } from "@/stores/appStore";
import type { SimulationFocus } from "@/types/game";

const focusOptions: Array<{ value: SimulationFocus; label: string }> = [
  { value: "practice-room", label: "Practice" },
  { value: "stage-blocking", label: "Stage" },
  { value: "dorm", label: "Dorm" },
];

export function GamePage() {
  const advanceWeek = useAppStore((state) => state.advanceWeek);
  const toggleSimulationPause = useAppStore(
    (state) => state.toggleSimulationPause,
  );
  const setSimulationFocus = useAppStore((state) => state.setSimulationFocus);
  const game = useAppStore((state) => state.game);
  const album = useAppStore((state) => state.album);
  const finance = useAppStore((state) => state.finance);

  const handleAdvanceWeek = () => {
    advanceWeek();
    EventBus.emit(PhaserEvents.reactAdvanceWeek);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-5 md:px-6 lg:flex-row lg:items-start">
      <section className="flex min-w-0 flex-1 flex-col gap-4">
        <Card className="overflow-hidden p-3">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-brand-cyan">
                    Simulation View
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-50">
                    Idolverse Control Room
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    Phaser runs only inside this viewport. React panels stay
                    outside and above it.
                  </p>
                </div>
                <div className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/8">
                  360 x 640 base canvas
                </div>
              </div>

              <div className="relative mx-auto aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 shadow-[0_20px_48px_rgba(2,6,23,0.45)]">
                <PhaserGame className="absolute inset-0" />

                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-3">
                  <div className="rounded-2xl bg-slate-900/82 px-3 py-2 text-xs text-slate-200 backdrop-blur">
                    {album.activeConcept} concept
                  </div>
                  <div className="rounded-2xl bg-slate-900/82 px-3 py-2 text-xs text-slate-200 backdrop-blur">
                    {game.simulationPaused ? "Paused" : "Running"}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full space-y-4 lg:max-w-[320px]">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleAdvanceWeek}>Advance Week</Button>
                <Button tone="secondary" onClick={toggleSimulationPause}>
                  {game.simulationPaused ? "Resume Sim" : "Pause Sim"}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  View Focus
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {focusOptions.map((option) => (
                    <Button
                      key={option.value}
                      tone={
                        option.value === game.simulationFocus
                          ? "primary"
                          : "ghost"
                      }
                      onClick={() => setSimulationFocus(option.value)}
                      className="px-2 text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-800/72 p-3">
                  <p className="text-slate-400">Cash Runway</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">
                    {new Intl.NumberFormat("ko-KR", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(finance.cash)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-800/72 p-3">
                  <p className="text-slate-400">Readiness</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">
                    {album.releaseReadiness}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <DecisionCardDeck />
      </section>

      <aside className="w-full shrink-0 space-y-4 lg:w-[360px]">
        <WeeklySummary />
        <AuthPanel />
      </aside>
    </main>
  );
}

