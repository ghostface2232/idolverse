import { useCallback, useMemo, useRef, useState } from "react";
import { BadgeIcon } from "@/components/common/BadgeIcon";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { PixelText } from "@/components/common/PixelText";
import { TabPanel } from "@/components/common/TabPanel";
import { DecisionCardDeck } from "@/components/dashboard/DecisionCardDeck";
import { NotificationsModal } from "@/components/dashboard/NotificationsModal";
import { SimulationOverlay } from "@/components/dashboard/SimulationOverlay";
import { WeeklySummary } from "@/components/dashboard/WeeklySummary";
import { EventModal } from "@/components/EventModal";
import { WeekReport } from "@/components/WeekReport";
import { EventBus, PhaserEvents } from "@/game/EventBus";
import { PhaserGame } from "@/game/PhaserGame";
import { captureGameState, DEFAULT_AUTO_SAVE_SLOT, saveGame } from "@/lib/saveSystem";
import {
  acknowledgeWeeklyReportAndSave,
  advanceWeeklyEventAndSave,
  applyEventChoiceAndSave,
  runWeek,
} from "@/lib/weekRunner";
import { Training } from "@/pages/Training";
import { useCalendarStore } from "@/stores/calendarStore";
import { useGameStore } from "@/stores/gameStore";
import { useFinanceStore } from "@/stores/financeStore";
import { useEventStore } from "@/stores/eventStore";
import type { GameEvent } from "@/types/game";
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

type TabKey = (typeof TABS)[number]["key"];

interface GameDashboardProps {
  userId: string;
}

export function GameDashboard({ userId }: GameDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [activeWeekReport, setActiveWeekReport] =
    useState<WeekReportData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isAdvancingRef = useRef(false);

  const currentWeek = useGameStore((s) => s.currentWeek);
  const currentYear = useGameStore((s) => s.currentYear);
  const currentSeason = useGameStore((s) => s.currentSeason);
  const weeklyDecisions = useGameStore((s) => s.weeklyDecisions);
  const notifications = useGameStore((s) => s.notifications);
  const trainingSchedule = useGameStore((s) => s.trainingSchedule);
  const weeklyFlow = useGameStore((s) => s.weeklyFlow);
  const money = useFinanceStore((s) => s.money);
  const news = useCalendarStore((s) => s.kpopNews);
  const pendingEvents = useEventStore((s) => s.pendingEvents);
  const activeEventId =
    weeklyFlow.eventQueueIds[weeklyFlow.activeEventIndex] ?? null;
  const activeEvent =
    pendingEvents.find((event) => event.id === activeEventId) ?? null;
  const displayedWeekReport =
    activeWeekReport ??
    (weeklyFlow.state === "report_ready" ? weeklyFlow.report : null);
  const resolvedDecisions = useMemo<PlayerDecisions["resolvedDecisions"]>(
    () =>
      weeklyDecisions.flatMap((card) => {
        const optionId = weeklyFlow.selectedDecisionIds[card.id];
        const option = card.options.find((candidate) => candidate.id === optionId);
        return option
          ? [
              {
                cardId: card.id,
                optionId: option.id,
                effects: option.effects,
                targetTraineeIds: option.targetTraineeIds,
                activityOverride: option.activityOverride,
              },
            ]
          : [];
      }),
    [weeklyDecisions, weeklyFlow.selectedDecisionIds],
  );
  const decisionsComplete = resolvedDecisions.length === weeklyDecisions.length;

  const remainingDecisions = Math.max(
    0,
    weeklyDecisions.length - resolvedDecisions.length,
  );
  const totalAlerts = notifications.length + news.length;
  const goToDashboard = useCallback(() => setActiveTab("dashboard"), []);

  const triggerAutoSave = useCallback(() => {
    if (!userId) return;

    void saveGame(userId, DEFAULT_AUTO_SAVE_SLOT, captureGameState()).catch(
      (error: unknown) => {
        console.error("Auto-save failed.", error);
      },
    );
  }, [userId]);

  const handleAdvanceWeek = useCallback(() => {
    if (
      !decisionsComplete ||
      isAdvancingRef.current ||
      resolvedDecisions.length !== weeklyDecisions.length
    ) {
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
        resolvedDecisions,
        promotionOrders: [],
      });

      setSheetOpen(false);
      EventBus.emit(PhaserEvents.reactAdvanceWeek);
      triggerAutoSave();

      setActiveWeekReport(report);
    } finally {
      isAdvancingRef.current = false;
    }
  }, [
    decisionsComplete,
    resolvedDecisions,
    trainingSchedule,
    triggerAutoSave,
    weeklyDecisions,
  ]);

  const handleResolveEvent = async (
    event: GameEvent,
    choiceIndex: number | null,
  ) => {
    await applyEventChoiceAndSave(
      event,
      choiceIndex ?? -1,
      userId,
      DEFAULT_AUTO_SAVE_SLOT,
    );
  };

  const handleCloseWeekReport = () => {
    void acknowledgeWeeklyReportAndSave(
      userId,
      DEFAULT_AUTO_SAVE_SLOT,
    )
      .then(() => setActiveWeekReport(null))
      .catch((error: unknown) => {
        console.error("Weekly report save failed.", error);
      });
  };

  const handleCloseEvent = async () => {
    await advanceWeeklyEventAndSave(
      userId,
      DEFAULT_AUTO_SAVE_SLOT,
    );
  };

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-slate-950 shadow-[0_0_60px_rgba(2,6,23,0.8)] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <header className="flex items-center justify-between gap-2 border-b border-slate-700/60 bg-slate-900 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-slate-300">
            Y{currentYear} W{currentWeek}
          </span>
          <BadgeIcon
            icon={SEASON_LABELS[currentSeason]}
            label={SEASON_LABELS[currentSeason]}
            tone="cyan"
          />
        </div>
        <div className="flex items-center gap-2">
          <MoneyDisplay amount={money} size="sm" />
          <button
            type="button"
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sm text-slate-100 transition-[background-color,scale] duration-150 hover:bg-slate-700 active:scale-[0.96]"
            aria-label="알림 열기"
            onClick={() => setNotificationsOpen(true)}
          >
            <span aria-hidden="true">🔔</span>
            {totalAlerts > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full border border-slate-900 bg-brand-pink px-1 text-[9px] text-white">
                {totalAlerts > 99 ? "99+" : totalAlerts}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <section className="relative flex-1 overflow-hidden">
        {activeTab === "dashboard" && (
          <div className="absolute inset-0 flex flex-col">
            <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-950">
              <PhaserGame className="absolute inset-0" />
              <SimulationOverlay />
            </div>

            <div className="z-20 flex shrink-0 items-center gap-2 border-t border-slate-700/60 bg-slate-900 px-3 py-2">
              <button
                type="button"
                className="flex min-h-11 flex-1 items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-left text-xs text-slate-200 transition-[background-color,opacity,scale] duration-150 hover:bg-slate-700 active:scale-[0.96] disabled:cursor-default disabled:opacity-60 disabled:hover:bg-slate-800 disabled:active:scale-100"
                onClick={() => setSheetOpen(true)}
                disabled={weeklyDecisions.length === 0}
                aria-label="결정 카드 열기"
              >
                <span>
                  {weeklyDecisions.length === 0
                    ? "결정 없음"
                    : decisionsComplete
                      ? "결정 완료 ✓"
                      : `결정 ${remainingDecisions}건 남음`}
                </span>
                <span className="text-base text-slate-300" aria-hidden="true">
                  ▲
                </span>
              </button>
              <Button
                className="min-w-[8rem]"
                disabled={
                  !decisionsComplete && weeklyDecisions.length > 0
                }
                onClick={handleAdvanceWeek}
              >
                다음 주 진행
              </Button>
            </div>
          </div>
        )}

        {activeTab === "training" && <Training onBack={goToDashboard} />}

        {activeTab === "album" && (
          <TabPanel title="앨범" onBack={goToDashboard}>
            <PreparingNotice />
          </TabPanel>
        )}

        {activeTab === "activity" && (
          <TabPanel title="활동" onBack={goToDashboard}>
            <PreparingNotice />
          </TabPanel>
        )}

        {activeTab === "settings" && (
          <TabPanel title="설정" onBack={goToDashboard}>
            <PreparingNotice />
          </TabPanel>
        )}
      </section>

      <nav className="border-t border-slate-700/60 bg-slate-900 pb-[env(safe-area-inset-bottom)]">
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

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="이번 주 결정"
      >
        <div className="space-y-4">
          <WeeklySummary />
          <DecisionCardDeck key={`${currentYear}-W${currentWeek}`} />
        </div>
      </BottomSheet>

      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        news={news}
        notifications={notifications}
      />

      {displayedWeekReport ? (
        <WeekReport
          report={displayedWeekReport}
          onClose={handleCloseWeekReport}
        />
      ) : null}

      {!displayedWeekReport && weeklyFlow.state === "event_focus" && activeEvent ? (
        <EventModal
          event={activeEvent}
          onResolve={(choiceIndex) => handleResolveEvent(activeEvent, choiceIndex)}
          onClose={handleCloseEvent}
        />
      ) : null}
    </main>
  );
}

function PreparingNotice() {
  return (
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
  );
}
