import { useCallback, useMemo, useRef, useState } from "react";
import { Dumbbell } from "lucide-react";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { DecisionCardDeck } from "@/components/dashboard/DecisionCardDeck";
import { NotificationsModal } from "@/components/dashboard/NotificationsModal";
import { ActionDock } from "@/components/game-shell/ActionDock";
import type { GameSection } from "@/components/game-shell/BottomNav";
import { GameShell } from "@/components/game-shell/GameShell";
import { GameWorldHost } from "@/components/game-shell/GameWorldHost";
import { GoalStrip } from "@/components/game-shell/GoalStrip";
import { MarketOverview } from "@/components/game-shell/MarketOverview";
import { MemberOverview } from "@/components/game-shell/MemberOverview";
import { MoreOverview } from "@/components/game-shell/MoreOverview";
import { TopStatusBar } from "@/components/game-shell/TopStatusBar";
import { EventModal } from "@/components/EventModal";
import { WeekReport } from "@/components/WeekReport";
import { presentationBus } from "@/game/EventBus";
import { DEFAULT_AUTO_SAVE_SLOT } from "@/lib/saveSystem";
import {
  acknowledgeWeeklyReportAndSave,
  advanceWeeklyEventAndSave,
  applyEventChoiceAndSave,
  runWeekAndSave,
} from "@/lib/weekRunner";
import { Training } from "@/pages/Training";
import { useAlbumStore } from "@/stores/albumStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useEventStore } from "@/stores/eventStore";
import { useFandomStore } from "@/stores/fandomStore";
import { useFinanceStore } from "@/stores/financeStore";
import { gameVanillaStore, useGameStore } from "@/stores/gameStore";
import { useTraineeStore } from "@/stores/traineeStore";
import { weeklyFlowSelectors } from "@/stores/weeklyFlowSelectors";
import {
  buildGoalLanes,
  buildMilestoneMetrics,
} from "@/systems/progressionSystem";
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
  const [isWorkflowSaving, setIsWorkflowSaving] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const isAdvancingRef = useRef(false);

  const currentWeek = useGameStore((state) => state.currentWeek);
  const currentYear = useGameStore((state) => state.currentYear);
  const currentSeason = useGameStore((state) => state.currentSeason);
  const currentPhase = useGameStore((state) => state.currentPhase);
  const weeklyDecisions = useGameStore((state) => state.weeklyDecisions);
  const notifications = useGameStore((state) => state.notifications);
  const trainingSchedule = useGameStore((state) => state.trainingSchedule);
  const investorConditions = useGameStore((state) => state.investorConditions);
  const milestonesAchieved = useGameStore((state) => state.milestonesAchieved);
  const trainees = useTraineeStore((state) => state.trainees);
  const fandomPublic = useFandomStore((state) => state.public);
  const fandomCore = useFandomStore((state) => state.fandom);
  const fandomLoyalty = useFandomStore((state) => state.fandomLoyalty);
  const fandomGlobal = useFandomStore((state) => state.global);
  const fandomIndustry = useFandomStore((state) => state.industry);
  const currentAlbum = useAlbumStore((state) => state.currentAlbum);
  const releasedAlbums = useAlbumStore((state) => state.releasedAlbums);
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
    weeklyFlow.state === "report_ready" && !isAdvancing
      ? weeklyFlow.report
      : null;
  const totalAlerts = notifications.length + news.length;
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

  const handleAdvanceWeek = useCallback(async () => {
    if (!canResolveWeek || isAdvancingRef.current) return;

    isAdvancingRef.current = true;
    setIsAdvancing(true);
    setWorkflowError(null);

    try {
      await runWeekAndSave(
        {
          trainingSchedule: {
            intensity: trainingSchedule.intensity,
            focus: trainingSchedule.focus ?? undefined,
            restDay: trainingSchedule.restDay,
          },
          resolvedDecisions,
          promotionOrders: [],
        },
        userId,
        DEFAULT_AUTO_SAVE_SLOT,
      );

      setSheetOpen(false);
      presentationBus.emit("playWeekTimeline", {
        resolutionId: gameVanillaStore.getState().weeklyFlow.resolutionId,
      });
    } catch (error) {
      console.error("Weekly resolution save failed.", error);
      setWorkflowError("주간 진행을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      isAdvancingRef.current = false;
      setIsAdvancing(false);
    }
  }, [
    canResolveWeek,
    resolvedDecisions,
    trainingSchedule,
    userId,
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

  const handleCloseWeekReport = async () => {
    if (isWorkflowSaving) return;
    setIsWorkflowSaving(true);
    setWorkflowError(null);
    try {
      await acknowledgeWeeklyReportAndSave(userId, DEFAULT_AUTO_SAVE_SLOT);
    } catch (error) {
      console.error("Weekly report save failed.", error);
      setWorkflowError("리포트 확인 상태를 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsWorkflowSaving(false);
    }
  };

  const handleCloseEvent = async () => {
    await advanceWeeklyEventAndSave(userId, DEFAULT_AUTO_SAVE_SLOT);
  };

  const goalLanes = useMemo(() => {
    const metrics = buildMilestoneMetrics({
      trainees,
      fandom: {
        public: fandomPublic,
        fandom: fandomCore,
        fandomLoyalty,
        global: fandomGlobal,
        industry: fandomIndustry,
      },
      money,
      currentAlbum,
      releasedAlbums,
    });
    return buildGoalLanes({
      phase: currentPhase,
      currentWeek,
      currentYear,
      metrics,
      achievedIds: new Set(milestonesAchieved.map((m) => m.id)),
      weeklyDecisions,
      investorConditions,
    });
  }, [
    trainees,
    fandomPublic,
    fandomCore,
    fandomLoyalty,
    fandomGlobal,
    fandomIndustry,
    money,
    currentAlbum,
    releasedAlbums,
    currentPhase,
    currentWeek,
    currentYear,
    milestonesAchieved,
    weeklyDecisions,
    investorConditions,
  ]);
  const plan = (
    <div className="space-y-3">
      {workflowError ? (
        <p
          role="alert"
          className="rounded-xl bg-state-danger/12 px-3 py-2 text-sm text-rose-200"
        >
          {workflowError}
        </p>
      ) : null}
      <DecisionCardDeck
        key={`${currentYear}-W${currentWeek}`}
        onConfirm={handleAdvanceWeek}
        isRunning={isAdvancing}
      />
    </div>
  );

  return (
    <>
      <GameShell
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        world={<GameWorldHost active={activeSection === "company"} />}
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
        goalStrip={<GoalStrip lanes={goalLanes} risk={primaryRisk} />}
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
        <WeekReport
          report={displayedWeekReport}
          isSaving={isWorkflowSaving}
          errorMessage={workflowError}
          onClose={handleCloseWeekReport}
        />
      ) : null}

      {weeklyFlow.state === "event_focus" && activeEvent ? (
        <EventModal
          key={activeEvent.id}
          event={activeEvent}
          onResolve={(choiceIndex) => handleResolveEvent(activeEvent, choiceIndex)}
          onClose={handleCloseEvent}
        />
      ) : null}
    </>
  );
}
