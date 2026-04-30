import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeIcon } from "@/components/common/BadgeIcon";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { PixelText } from "@/components/common/PixelText";
import { DecisionCardDeck } from "@/components/dashboard/DecisionCardDeck";
import { WeeklySummary } from "@/components/dashboard/WeeklySummary";
import { EventModal } from "@/components/EventModal";
import { WeekReport } from "@/components/WeekReport";
import { EventBus, PhaserEvents } from "@/game/EventBus";
import { PhaserGame } from "@/game/PhaserGame";
import { autoSave, captureGameState, DEFAULT_AUTO_SAVE_SLOT } from "@/lib/saveSystem";
import { applyEventChoice, runWeek } from "@/lib/weekRunner";
import { Training } from "@/pages/Training";
import { useCalendarStore } from "@/stores/calendarStore";
import { useGameStore } from "@/stores/gameStore";
import { useFinanceStore } from "@/stores/financeStore";
import type { GameEvent, GameSpeed } from "@/types/game";
import type { PlayerDecisions, WeekReport as WeekReportData } from "@/systems/weekProcessor";

const SEASON_LABELS: Record<string, string> = {
  spring: "봄",
  summer: "여름",
  fall: "가을",
  winter: "겨울",
};

const TABS = [
  { key: "dashboard", icon: "D", label: "대시보드" },
  { key: "training", icon: "T", label: "트레이닝" },
  { key: "album", icon: "A", label: "앨범" },
  { key: "activity", icon: "V", label: "활동" },
  { key: "settings", icon: "S", label: "설정" },
] as const;

const AUTO_ADVANCE_INTERVALS: Record<Exclude<GameSpeed, 0>, number> = {
  1: 3000,
  2: 1500,
  3: 800,
};

type TabKey = (typeof TABS)[number]["key"];

interface GameDashboardProps {
  userId: string;
}

export function GameDashboard({ userId }: GameDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [resolvedDecisions, setResolvedDecisions] = useState<
    PlayerDecisions["resolvedDecisions"]
  >([]);
  const [decisionsComplete, setDecisionsComplete] = useState(false);
  const [activeWeekReport, setActiveWeekReport] =
    useState<WeekReportData | null>(null);
  const [eventQueue, setEventQueue] = useState<GameEvent[]>([]);
  const isAdvancingRef = useRef(false);

  const currentWeek = useGameStore((s) => s.currentWeek);
  const currentYear = useGameStore((s) => s.currentYear);
  const currentSeason = useGameStore((s) => s.currentSeason);
  const gameSpeed = useGameStore((s) => s.gameSpeed);
  const setGameSpeed = useGameStore((s) => s.setGameSpeed);
  const weeklyDecisions = useGameStore((s) => s.weeklyDecisions);
  const notifications = useGameStore((s) => s.notifications);
  const trainingSchedule = useGameStore((s) => s.trainingSchedule);
  const money = useFinanceStore((s) => s.money);
  const news = useCalendarStore((s) => s.kpopNews);
  const activeEvent = eventQueue[0] ?? null;

  const handleDecisionChange = useCallback(
    (
      nextResolvedDecisions: PlayerDecisions["resolvedDecisions"],
      isComplete: boolean,
    ) => {
      setResolvedDecisions(nextResolvedDecisions);
      setDecisionsComplete(isComplete);
    },
    [],
  );

  const triggerAutoSave = useCallback(() => {
    if (!userId) return;

    void autoSave(userId, DEFAULT_AUTO_SAVE_SLOT, captureGameState()).catch(
      (error: unknown) => {
        console.error("Auto-save failed.", error);
      },
    );
  }, [userId]);

  const handleAdvanceWeek = useCallback(
    (mode: "manual" | "auto" = "manual") => {
      if ((mode === "manual" && !decisionsComplete) || isAdvancingRef.current) {
        return;
      }

      const currentResolvedDecisions =
        mode === "auto" && !decisionsComplete
          ? weeklyDecisions.flatMap((card) => {
              const option = card.options[0];

              return option
                ? [
                    {
                      cardId: card.id,
                      optionId: option.id,
                      effects: option.effects,
                    },
                  ]
                : [];
            })
          : resolvedDecisions;

      if (currentResolvedDecisions.length !== weeklyDecisions.length) {
        return;
      }

      isAdvancingRef.current = true;

      try {
        const report = runWeek({
          trainingSchedule: {
            intensity: trainingSchedule.intensity,
            focus: trainingSchedule.focus ?? undefined,
            restDay: trainingSchedule.restDay,
          },
          resolvedDecisions: currentResolvedDecisions,
          promotionOrders: [],
        });

        setResolvedDecisions([]);
        setDecisionsComplete(false);
        EventBus.emit(PhaserEvents.reactAdvanceWeek);
        triggerAutoSave();

        if (report.events.length > 0) {
          setGameSpeed(0);
        }

        if (mode === "manual" || report.warnings.length > 0) {
          setActiveWeekReport(report);
          setEventQueue(report.events);
        } else {
          setEventQueue(report.events);
        }
      } finally {
        isAdvancingRef.current = false;
      }
    },
    [
      decisionsComplete,
      resolvedDecisions,
      setGameSpeed,
      trainingSchedule,
      triggerAutoSave,
      weeklyDecisions,
    ],
  );

  useEffect(() => {
    if (
      gameSpeed === 0 ||
      activeWeekReport ||
      activeEvent
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      handleAdvanceWeek("auto");
    }, AUTO_ADVANCE_INTERVALS[gameSpeed]);

    return () => window.clearInterval(interval);
  }, [
    activeEvent,
    activeWeekReport,
    gameSpeed,
    handleAdvanceWeek,
  ]);

  const handleResolveEvent = (event: GameEvent, choiceIndex: number | null) => {
    applyEventChoice(event, choiceIndex ?? -1);
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-slate-950 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <header className="flex items-center justify-between gap-2 border-b border-slate-700/60 bg-slate-900/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">
            Y{currentYear} W{currentWeek}
          </span>
          <BadgeIcon
            icon={SEASON_LABELS[currentSeason]}
            label={SEASON_LABELS[currentSeason]}
            tone="cyan"
          />
        </div>
        <MoneyDisplay amount={money} size="sm" />
        <div className="flex gap-1">
          {([0, 1, 2, 3] as GameSpeed[]).map((speed) => (
            <button
              key={speed}
              className={[
                "rounded-lg px-2 py-1 text-xs transition",
                gameSpeed === speed
                  ? "bg-brand-cyan/20 text-brand-cyan"
                  : "text-slate-500 hover:text-slate-300",
              ].join(" ")}
              onClick={() => setGameSpeed(speed)}
            >
              {speed === 0 ? "⏸" : `${speed}x`}
            </button>
          ))}
        </div>
      </header>

      <section className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <Card className="h-[200px] overflow-hidden border-brand-cyan/30 p-0">
              <PhaserGame className="h-full w-full" />
            </Card>

            <WeeklySummary />

            <DecisionCardDeck onSelectionChange={handleDecisionChange} />

            <Button
              className="w-full"
              disabled={!decisionsComplete}
              onClick={() => handleAdvanceWeek("manual")}
            >
              다음 주 진행
            </Button>

            {news.length > 0 && (
              <Card className="space-y-3">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-pink">
                  K-POP 뉴스피드
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {news.map((item) => (
                    <article
                      key={item.id}
                      className="min-w-[240px] rounded-2xl border border-white/8 bg-slate-800/70 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-brand-cyan">
                        {item.type}
                      </p>
                      <h3 className="mt-2 text-sm text-slate-100">
                        {item.headline}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {item.detail}
                      </p>
                    </article>
                  ))}
                </div>
              </Card>
            )}

            {notifications.length > 0 && (
              <Card className="space-y-2">
                <p className="text-xs text-slate-400">알림</p>
                {notifications.slice(0, 5).map((n) => (
                  <p key={n.id} className="text-xs text-slate-300">
                    [{n.type}] {n.title}: {n.message}
                  </p>
                ))}
              </Card>
            )}
          </div>
        )}

        {activeTab === "training" && <Training />}

        {activeTab !== "dashboard" && activeTab !== "training" && (
          <div className="flex h-full items-center justify-center">
            <Card className="px-8 py-12 text-center">
              <PixelText as="p" className="text-xl text-slate-500">
                준비 중
              </PixelText>
              <p className="mt-2 text-sm text-slate-400">
                이 기능은 다음 업데이트에서 개방됩니다.
              </p>
            </Card>
          </div>
        )}
      </section>

      <nav className="border-t border-slate-700/60 bg-slate-900/90 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={[
                "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-center text-[10px] transition",
                activeTab === tab.key
                  ? "text-brand-cyan"
                  : "text-slate-500 hover:text-slate-300",
              ].join(" ")}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {activeWeekReport ? (
        <WeekReport
          report={activeWeekReport}
          onClose={() => setActiveWeekReport(null)}
        />
      ) : null}

      {!activeWeekReport && activeEvent ? (
        <EventModal
          event={activeEvent}
          onResolve={(choiceIndex) => handleResolveEvent(activeEvent, choiceIndex)}
          onClose={() => setEventQueue((current) => current.slice(1))}
        />
      ) : null}
    </main>
  );
}
