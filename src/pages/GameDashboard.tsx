import { useCallback, useMemo, useRef, useState } from "react";
import { Dumbbell } from "lucide-react";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { DecisionCardDeck } from "@/components/dashboard/DecisionCardDeck";
import { NotificationsModal } from "@/components/dashboard/NotificationsModal";
import { ActionDock } from "@/components/game-shell/ActionDock";
import type { GameSection } from "@/components/game-shell/BottomNav";
import { GameShell } from "@/components/game-shell/GameShell";
import { GoalStrip } from "@/components/game-shell/GoalStrip";
import { MarketOverview } from "@/components/game-shell/MarketOverview";
import { MemberOverview } from "@/components/game-shell/MemberOverview";
import { MoreOverview } from "@/components/game-shell/MoreOverview";
import { TopStatusBar } from "@/components/game-shell/TopStatusBar";
import { WorldViewport } from "@/components/game-shell/WorldViewport";
import { EventModal } from "@/components/EventModal";
import { WeekReport } from "@/components/WeekReport";
import { EventBus, PhaserEvents } from "@/game/EventBus";
import { captureGameState, DEFAULT_AUTO_SAVE_SLOT, saveGame } from "@/lib/saveSystem";
import {
  acknowledgeWeeklyReportAndSave,
  advanceWeeklyEventAndSave,
  applyEventChoiceAndSave,
  runWeek,
} from "@/lib/weekRunner";
import { Training } from "@/pages/Training";
import { useCalendarStore } from "@/stores/calendarStore";
import { useEventStore } from "@/stores/eventStore";
import { useFinanceStore } from "@/stores/financeStore";
import { useGameStore } from "@/stores/gameStore";
import { weeklyFlowSelectors } from "@/stores/weeklyFlowSelectors";
import type { GameEvent, WeeklyDecisionTrigger } from "@/types/game";
import type { PlayerDecisions } from "@/systems/weekProcessor";

const SEASON_LABELS = {
  spring: "봄",
  summer: "여름",
  fall: "가을",
  winter: "겨울",
} as const;

const RISK_PRIORITY: Record<WeeklyDecisionTrigger["severity"], number> = {
  notice: 1,
  warning: 2,
  critical: 3,
};

interface GameDashboardProps {
  userId: string;
}

export function GameDashboard({ userId }: GameDashboardProps) {
  const [activeSection, setActiveSection] = useState<GameSection>("company");
  const [weekView, setWeekView] = useState<"decisions" | "training">("decisions");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const isAdvancingRef = useRef(false);

  const currentWeek = useGameStore((state) => state.currentWeek);
  const currentYear = useGameStore((state) => state.currentYear);
  const currentSeason = useGameStore((state) => state.currentSeason);
  const weeklyDecisions = useGameStore((state) => state.weeklyDecisions);
  const notifications = useGameStore((state) => state.notifications);
  const trainingSchedule = useGameStore((state) => state.trainingSchedule);
  const investorConditions = useGameStore((state) => state.investorConditions);
  const weeklyFlow = useGameStore(weeklyFlowSelectors.flow);
  const remainingDecisions = useGameStore(
    weeklyFlowSelectors.remainingDecisionCount,
  );
  const canResolveWeek = useGameStore(weeklyFlowSelectors.canResolveWeek);
  const activeEventId = useGameStore(weeklyFlowSelectors.activeEventId);
  const money = useFinanceStore((state) => state.money);
  const news = useCalendarStore((state) => state.kpopNews);
  const pendingEvents = useEventStore((state) => state.pendingEvents);

  const activeEvent =
    pendingEvents.find((event) => event.id === activeEventId) ?? null;
  const displayedWeekReport =
    weeklyFlow.state === "report_ready" ? weeklyFlow.report : null;
  const totalAlerts = notifications.length + news.length;
  const primaryCondition = investorConditions[0];
  const primaryRisk = useMemo(
    () =>
      weeklyDecisions
        .map((decision) => decision.trigger)
        .filter((trigger): trigger is WeeklyDecisionTrigger => Boolean(trigger))
        .sort((left, right) => RISK_PRIORITY[right.severity] - RISK_PRIORITY[left.severity])[0] ??
      null,
    [weeklyDecisions],
  );
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

  const triggerAutoSave = useCallback(() => {
    if (!userId) return;

    void saveGame(userId, DEFAULT_AUTO_SAVE_SLOT, captureGameState()).catch(
      (error: unknown) => {
        console.error("Auto-save failed.", error);
      },
    );
  }, [userId]);

  const handleAdvanceWeek = useCallback(() => {
    if (!canResolveWeek || isAdvancingRef.current) return;

    isAdvancingRef.current = true;
    setIsAdvancing(true);

    try {
      runWeek({
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
    } finally {
      isAdvancingRef.current = false;
      setIsAdvancing(false);
    }
  }, [
    canResolveWeek,
    resolvedDecisions,
    trainingSchedule,
    triggerAutoSave,
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
    void acknowledgeWeeklyReportAndSave(userId, DEFAULT_AUTO_SAVE_SLOT).catch(
      (error: unknown) => {
        console.error("Weekly report save failed.", error);
      },
    );
  };

  const handleCloseEvent = async () => {
    await advanceWeeklyEventAndSave(userId, DEFAULT_AUTO_SAVE_SLOT);
  };

  const goal = primaryCondition?.description ?? "이번 주 팀 운영 안정화";
  const elapsedWeeks = (currentYear - 1) * 52 + currentWeek - 1;
  const deadlineLabel = primaryCondition
    ? `W-${Math.max(0, primaryCondition.deadlineWeeks - elapsedWeeks)}`
    : "상시";
  const plan = (
    <DecisionCardDeck
      key={`${currentYear}-W${currentWeek}`}
      onConfirm={handleAdvanceWeek}
      isRunning={isAdvancing}
    />
  );

  return (
    <>
      <GameShell
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        topStatus={
          <TopStatusBar
            year={currentYear}
            week={currentWeek}
            seasonLabel={SEASON_LABELS[currentSeason]}
            money={money}
            alertCount={totalAlerts}
            onOpenNotifications={() => setNotificationsOpen(true)}
          />
        }
        goalStrip={
          <GoalStrip goal={goal} deadlineLabel={deadlineLabel} risk={primaryRisk} />
        }
        commandPanel={activeSection === "company" ? plan : undefined}
        actionDock={
          activeSection === "company" ? (
            <ActionDock
              totalDecisions={weeklyDecisions.length}
              remainingDecisions={remainingDecisions}
              flowState={weeklyFlow.state}
              riskLabel={primaryRisk?.description}
              onOpenPlan={() => setSheetOpen(true)}
            />
          ) : undefined
        }
      >
        {activeSection === "company" ? <WorldViewport /> : null}
        {activeSection === "week" ? (
          weekView === "training" ? (
            <Training onBack={() => setWeekView("decisions")} />
          ) : (
            <section className="h-full overflow-y-auto p-4 sm:p-5">
              <div className="mx-auto max-w-xl">
                <Button
                  className="mb-4 w-full gap-2"
                  tone="secondary"
                  onPress={() => setWeekView("training")}
                >
                  <Dumbbell className="size-4" aria-hidden="true" />
                  훈련·활동 배치
                </Button>
                {plan}
              </div>
            </section>
          )
        ) : null}
        {activeSection === "members" ? <MemberOverview /> : null}
        {activeSection === "market" ? <MarketOverview /> : null}
        {activeSection === "more" ? (
          <MoreOverview onOpenNotifications={() => setNotificationsOpen(true)} />
        ) : null}
      </GameShell>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="이번 주 결정"
      >
        {plan}
      </BottomSheet>

      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        news={news}
        notifications={notifications}
      />

      {displayedWeekReport ? (
        <WeekReport report={displayedWeekReport} onClose={handleCloseWeekReport} />
      ) : null}

      {weeklyFlow.state === "event_focus" && activeEvent ? (
        <EventModal
          event={activeEvent}
          onResolve={(choiceIndex) => handleResolveEvent(activeEvent, choiceIndex)}
          onClose={handleCloseEvent}
        />
      ) : null}
    </>
  );
}
