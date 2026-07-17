import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dumbbell } from "lucide-react";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { ContractsOverviewModal } from "@/components/dashboard/ContractsOverviewModal";
import { DecisionCardDeck } from "@/components/dashboard/DecisionCardDeck";
import { GoalsOverviewModal } from "@/components/dashboard/GoalsOverviewModal";
import { MarketOverviewModal } from "@/components/dashboard/MarketOverviewModal";
import { ActivityPromotionPanel } from "@/components/dashboard/ActivityPromotionPanel";
import { CampaignOverScreen } from "@/components/dashboard/CampaignOverScreen";
import { ChartRevealOverlay } from "@/components/dashboard/ChartRevealOverlay";
import { ComebackPlanningModal } from "@/components/dashboard/ComebackPlanningModal";
import { FacilityUpgradeModal } from "@/components/dashboard/FacilityUpgradeModal";
import { MusicShowOverlay } from "@/components/dashboard/MusicShowOverlay";
import { StaffManagementModal } from "@/components/dashboard/StaffManagementModal";
import { PositionReviewModal } from "@/components/dashboard/PositionReviewModal";
import { TitleTrackSelectionModal } from "@/components/dashboard/TitleTrackSelectionModal";
import { NotificationsModal } from "@/components/dashboard/NotificationsModal";
import { ActionDock } from "@/components/game-shell/ActionDock";
import type { GameSection } from "@/components/game-shell/BottomNav";
import { GameShell } from "@/components/game-shell/GameShell";
import { GameWorldHost } from "@/components/game-shell/GameWorldHost";
import { MarketOverview } from "@/components/game-shell/MarketOverview";
import { MemberOverview } from "@/components/game-shell/MemberOverview";
import { MoreOverview } from "@/components/game-shell/MoreOverview";
import { OverviewPills } from "@/components/game-shell/OverviewPills";
import { TopStatusBar } from "@/components/game-shell/TopStatusBar";
import { EventModal } from "@/components/EventModal";
import { WeekReport } from "@/components/WeekReport";
import { presentationBus } from "@/game/EventBus";
import {
  COMEBACK_REQUIREMENTS,
  GAME_BALANCE,
  type ComebackBudgetTierId,
} from "@/data/balance";
import { TITLE_TRACK_SELECTION_DECISION_ID } from "@/data/debutProject";
import { CONCEPT_MOOD_DATA } from "@/data/concepts";
import { DEFAULT_AUTO_SAVE_SLOT } from "@/lib/saveSystem";
import {
  acknowledgeWeeklyReportAndSave,
  advanceWeeklyEventAndSave,
  applyEventChoiceAndSave,
  completePresentationEventAndSave,
  completePositionReviewAndSave,
  completeTitleTrackSelectionAndSave,
  hireStaffAndSave,
  runWeekAndSave,
  startComebackProjectAndSave,
  upgradeFacilityAndSave,
} from "@/lib/weekRunner";
import { Training } from "@/pages/Training";
import { useAlbumStore } from "@/stores/albumStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useEventStore } from "@/stores/eventStore";
import { useFandomStore } from "@/stores/fandomStore";
import { useFinanceStore } from "@/stores/financeStore";
import { gameVanillaStore, useGameStore } from "@/stores/gameStore";
import { useStaffStore } from "@/stores/staffStore";
import { useTraineeStore } from "@/stores/traineeStore";
import {
  isWeeklyDecisionComplete,
  weeklyFlowSelectors,
} from "@/stores/weeklyFlowSelectors";
import {
  buildGoalLanes,
  buildMilestoneMetrics,
  toCumulativeWeek,
} from "@/systems/progressionSystem";
import { canStartComebackProject } from "@/systems/comebackSystem";
import { getContractRemainingWeeks } from "@/systems/contractSystem";
import { listAvailablePromotions } from "@/systems/promotionSystem";
import type {
  ConceptMood,
  GameEvent,
  Genre,
  PromotionActivityId,
  Staff,
  WeeklyDecisionTrigger,
} from "@/types/game";
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

type OverviewModal = "goals" | "contracts" | "market" | null;

interface GameDashboardProps {
  userId: string;
  onExit: () => void;
}

export function GameDashboard({ userId, onExit }: GameDashboardProps) {
  const [activeSection, setActiveSection] = useState<GameSection>("company");
  const [weekView, setWeekView] = useState<"decisions" | "training">("decisions");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [overviewModal, setOverviewModal] = useState<OverviewModal>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isWorkflowSaving, setIsWorkflowSaving] = useState(false);
  const [isPositionReviewSaving, setIsPositionReviewSaving] = useState(false);
  const [isTitleTrackSaving, setIsTitleTrackSaving] = useState(false);
  const [comebackPlanningOpen, setComebackPlanningOpen] = useState(false);
  const [isComebackSaving, setIsComebackSaving] = useState(false);
  const [promotionId, setPromotionId] = useState<PromotionActivityId | null>(
    null,
  );
  const [companyModal, setCompanyModal] = useState<"staff" | "facility" | null>(
    null,
  );
  const [isCompanySaving, setIsCompanySaving] = useState(false);
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
  const awardHistory = useGameStore((state) => state.awardHistory);
  const campaignSeed = useGameStore((state) => state.campaignSeed);
  const campaignFailure = useGameStore((state) => state.campaignFailure);
  const groupName = useGameStore((state) => state.groupName);
  const staff = useStaffStore((state) => state.staff);
  const facilityUpgrades = useFinanceStore((state) => state.upgrades);
  const activeProjects = useGameStore((state) => state.activeProjects);
  const trainees = useTraineeStore((state) => state.trainees);
  const fandomPublic = useFandomStore((state) => state.public);
  const fandomCore = useFandomStore((state) => state.fandom);
  const fandomLoyalty = useFandomStore((state) => state.fandomLoyalty);
  const fandomGlobal = useFandomStore((state) => state.global);
  const fandomIndustry = useFandomStore((state) => state.industry);
  const currentAlbum = useAlbumStore((state) => state.currentAlbum);
  const releasedAlbums = useAlbumStore((state) => state.releasedAlbums);
  const conceptHistory = useAlbumStore((state) => state.conceptHistory);
  const weeklyFlow = useGameStore(weeklyFlowSelectors.flow);
  const remainingDecisions = useGameStore(
    weeklyFlowSelectors.remainingDecisionCount,
  );
  const canResolveWeek = useGameStore(weeklyFlowSelectors.canResolveWeek);
  const activeEventId = useGameStore(weeklyFlowSelectors.activeEventId);
  const money = useFinanceStore((state) => state.money);
  const news = useCalendarStore((state) => state.kpopNews);
  const marketTrend = useCalendarStore((state) => state.marketTrend);
  const pendingEvents = useEventStore((state) => state.pendingEvents);

  const activeEvent =
    pendingEvents.find((event) => event.id === activeEventId) ?? null;
  const chartReveal =
    activeEvent?.presentation?.kind === "chart-reveal"
      ? activeEvent.presentation
      : null;
  const musicShow =
    activeEvent?.presentation?.kind === "music-show"
      ? activeEvent.presentation
      : null;
  const canPlanComeback =
    weeklyFlow.state === "planning_ready" &&
    canStartComebackProject(currentPhase, activeProjects, currentAlbum);
  // 활동기(발매 후) 프로젝트가 있으면 프로모션 실행이 열린다.
  const activityProject = activeProjects.find(
    (project) =>
      project.kind === "comeback" &&
      project.status !== "completed" &&
      project.currentStageId === "activity",
  );
  const availablePromotions = useMemo(
    () =>
      activityProject
        ? listAvailablePromotions({
            phase: currentPhase,
            public: fandomPublic,
            fandom: fandomCore,
            industry: fandomIndustry,
          })
        : [],
    [activityProject, currentPhase, fandomPublic, fandomCore, fandomIndustry],
  );
  const activityWeeksLeft = activityProject
    ? Math.max(
        0,
        activityProject.startedAtWeek +
          COMEBACK_REQUIREMENTS.releaseWeek +
          COMEBACK_REQUIREMENTS.activityWeeks -
          toCumulativeWeek(currentYear, currentWeek),
      )
    : 0;
  const positionReviewProject = activeProjects.find(
    (project) => project.decisionStatuses.positionReview === "available",
  );
  const titleTrackProject = activeProjects.find(
    (project) =>
      project.decisionStatuses[TITLE_TRACK_SELECTION_DECISION_ID] === "available",
  );
  const displayedWeekReport =
    weeklyFlow.state === "report_ready" && !isAdvancing
      ? weeklyFlow.report
      : null;
  const totalAlerts = notifications.length + news.length;
  const primaryRisk = useMemo(
    () =>
      weeklyDecisions
        .filter((decision) => decision.lane === "crisis")
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

        return option && isWeeklyDecisionComplete(card, weeklyFlow)
          ? [
              {
                cardId: card.id,
                optionId: option.id,
                effects: option.effects,
                targetTraineeIds: option.targetSelection
                  ? weeklyFlow.selectedTargetTraineeIds[card.id]
                  : option.targetTraineeIds,
                activityOverride: option.activityOverride,
              },
            ]
          : [];
      }),
    [weeklyDecisions, weeklyFlow],
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
          promotionOrders: promotionId ? [{ activityId: promotionId }] : [],
        },
        userId,
        DEFAULT_AUTO_SAVE_SLOT,
      );

      setPromotionId(null);
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
    promotionId,
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
      setWorkflowError("결산 확인을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsWorkflowSaving(false);
    }
  };

  const handleCloseEvent = async () => {
    await advanceWeeklyEventAndSave(userId, DEFAULT_AUTO_SAVE_SLOT);
  };

  const handleCompletePresentationEvent = async (eventId: string) => {
    setWorkflowError(null);
    try {
      await completePresentationEventAndSave(
        eventId,
        userId,
        DEFAULT_AUTO_SAVE_SLOT,
      );
    } catch (error) {
      console.error("Presentation event save failed.", error);
      setWorkflowError("결과를 저장하지 못했습니다. 다시 확인해 주세요.");
      throw error;
    }
  };

  const handleStartComeback = async (plan: {
    genre: Genre;
    mood: ConceptMood;
    budgetTierId: ComebackBudgetTierId;
    centerTraineeId: string | null;
  }) => {
    if (isComebackSaving) return;
    setIsComebackSaving(true);
    setWorkflowError(null);
    try {
      await startComebackProjectAndSave(
        { genre: plan.genre, mood: plan.mood },
        plan.budgetTierId,
        plan.centerTraineeId,
        userId,
        DEFAULT_AUTO_SAVE_SLOT,
      );
      setComebackPlanningOpen(false);
    } catch (error) {
      console.error("Comeback planning save failed.", error);
      setWorkflowError("컴백 기획을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsComebackSaving(false);
    }
  };

  const handleCompletePositionReview = async (
    assignments: Parameters<typeof completePositionReviewAndSave>[1],
  ) => {
    if (!positionReviewProject || isPositionReviewSaving) return;
    setIsPositionReviewSaving(true);
    setWorkflowError(null);
    try {
      await completePositionReviewAndSave(
        positionReviewProject.id,
        assignments,
        userId,
        DEFAULT_AUTO_SAVE_SLOT,
      );
    } catch (error) {
      console.error("Position review save failed.", error);
      setWorkflowError("포지션 재조정을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsPositionReviewSaving(false);
    }
  };

  const handleCompleteTitleTrackSelection = async (trackId: string) => {
    if (!titleTrackProject || !currentAlbum || isTitleTrackSaving) return;
    setIsTitleTrackSaving(true);
    setWorkflowError(null);
    try {
      await completeTitleTrackSelectionAndSave(
        titleTrackProject.id,
        trackId,
        userId,
        DEFAULT_AUTO_SAVE_SLOT,
      );
    } catch (error) {
      console.error("Title track selection save failed.", error);
      setWorkflowError("타이틀곡 결정을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsTitleTrackSaving(false);
    }
  };

  const handleHireStaff = async (candidate: Staff) => {
    if (isCompanySaving) return;
    setIsCompanySaving(true);
    setWorkflowError(null);
    try {
      await hireStaffAndSave(candidate, userId, DEFAULT_AUTO_SAVE_SLOT);
    } catch (error) {
      console.error("Staff hire save failed.", error);
      setWorkflowError("스태프 변경을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsCompanySaving(false);
    }
  };

  const handleUpgradeFacility = async (
    target: Parameters<typeof upgradeFacilityAndSave>[0],
  ) => {
    if (isCompanySaving) return;
    setIsCompanySaving(true);
    setWorkflowError(null);
    try {
      await upgradeFacilityAndSave(target, userId, DEFAULT_AUTO_SAVE_SLOT);
    } catch (error) {
      console.error("Facility upgrade save failed.", error);
      setWorkflowError("시설 투자를 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsCompanySaving(false);
    }
  };

  useEffect(() => {
    if (weeklyFlow.state !== "event_focus" || !activeEvent || !chartReveal) {
      return;
    }
    presentationBus.emit("chartReveal", {
      eventId: activeEvent.id,
      ...chartReveal,
    });
  }, [activeEvent, chartReveal, weeklyFlow.state]);

  useEffect(() => {
    if (weeklyFlow.state !== "event_focus" || !activeEvent || !musicShow) {
      return;
    }
    presentationBus.emit("musicShow", {
      eventId: activeEvent.id,
      ...musicShow,
    });
  }, [activeEvent, musicShow, weeklyFlow.state]);

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
    // 신인상 창: 데뷔(첫 발매) 연차 기준 2년차 말까지, 아직 못 받았을 때만.
    const firstReleaseWeek = releasedAlbums[0]?.releaseWeek;
    const rookieAwardDeadlineWeek =
      firstReleaseWeek != null &&
      !awardHistory.some((award) => award.category === "rookie")
        ? (Math.floor((firstReleaseWeek - 1) / GAME_BALANCE.weeksPerYear) + 2) *
          GAME_BALANCE.weeksPerYear
        : null;
    return buildGoalLanes({
      phase: currentPhase,
      currentWeek,
      currentYear,
      metrics,
      achievedIds: new Set(milestonesAchieved.map((m) => m.id)),
      weeklyDecisions,
      investorConditions,
      activeProjects,
      rookieAwardDeadlineWeek,
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
    awardHistory,
    weeklyDecisions,
    investorConditions,
    activeProjects,
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
      {activityProject && weeklyFlow.state === "planning_ready" ? (
        <ActivityPromotionPanel
          activities={availablePromotions}
          selectedId={promotionId}
          money={money}
          activityWeeksLeft={activityWeeksLeft}
          disabled={isAdvancing}
          onSelect={setPromotionId}
        />
      ) : null}
      {canPlanComeback ? (
        <button
          type="button"
          className="w-full rounded-2xl bg-[linear-gradient(120deg,rgba(236,72,153,0.14),rgba(34,211,238,0.1))] p-3 text-left shadow-[inset_0_0_0_1px_rgba(236,72,153,0.3)] transition-transform active:scale-[0.98]"
          onClick={() => setComebackPlanningOpen(true)}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-300">
            제작 슬롯 비어 있음
          </p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            다음 컴백 기획 시작
          </p>
          <p className="mt-1 text-pretty text-xs leading-5 text-text-muted">
            컨셉을 정하면 14주 사이클이 시작됩니다. 활동 정산 중에도 다음
            기획을 겹쳐 진행할 수 있습니다.
          </p>
        </button>
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
        overviewBar={
          <OverviewPills
            goalSummary={goalLanes.project?.deadlineLabel ?? "이번 주"}
            contractSummary={`${getContractRemainingWeeks(currentYear, currentWeek)}주`}
            marketSummary={`${CONCEPT_MOOD_DATA[marketTrend.hotMood].label} 강세`}
            hasGoalRisk={Boolean(primaryRisk)}
            onOpenGoals={() => setOverviewModal("goals")}
            onOpenContracts={() => setOverviewModal("contracts")}
            onOpenMarket={() => setOverviewModal("market")}
          />
        }
        commandPanel={activeSection === "company" ? plan : undefined}
        actionDock={
          activeSection === "company" ? (
            <ActionDock
              totalDecisions={weeklyDecisions.length}
              remainingDecisions={remainingDecisions}
              canResolveWeek={canResolveWeek}
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
          <MoreOverview
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenStaff={() => setCompanyModal("staff")}
            onOpenFacilities={() => setCompanyModal("facility")}
          />
        ) : null}
      </GameShell>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="이번 주 결정"
      >
        {plan}
      </BottomSheet>

      {overviewModal === "goals" ? (
        <GoalsOverviewModal
          lanes={goalLanes}
          risk={primaryRisk}
          onClose={() => setOverviewModal(null)}
        />
      ) : null}

      {overviewModal === "contracts" ? (
        <ContractsOverviewModal
          trainees={trainees}
          currentYear={currentYear}
          currentWeek={currentWeek}
          onClose={() => setOverviewModal(null)}
        />
      ) : null}

      {overviewModal === "market" ? (
        <MarketOverviewModal onClose={() => setOverviewModal(null)} />
      ) : null}

      {companyModal === "staff" ? (
        <StaffManagementModal
          staff={staff}
          money={money}
          industry={fandomIndustry}
          campaignSeed={campaignSeed}
          cumulativeWeek={toCumulativeWeek(currentYear, currentWeek)}
          isSaving={isCompanySaving}
          errorMessage={workflowError}
          onHire={handleHireStaff}
          onClose={() => {
            if (!isCompanySaving) setCompanyModal(null);
          }}
        />
      ) : null}

      {companyModal === "facility" ? (
        <FacilityUpgradeModal
          upgrades={facilityUpgrades}
          money={money}
          achievedMilestoneIds={
            new Set(milestonesAchieved.map((milestone) => milestone.id))
          }
          isSaving={isCompanySaving}
          errorMessage={workflowError}
          onUpgrade={handleUpgradeFacility}
          onClose={() => {
            if (!isCompanySaving) setCompanyModal(null);
          }}
        />
      ) : null}

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

      {weeklyFlow.state === "event_focus" &&
      activeEvent &&
      !activeEvent.presentation ? (
        <EventModal
          key={activeEvent.id}
          event={activeEvent}
          onResolve={(choiceIndex) => handleResolveEvent(activeEvent, choiceIndex)}
          onClose={handleCloseEvent}
        />
      ) : null}

      <ChartRevealOverlay onComplete={handleCompletePresentationEvent} />
      <MusicShowOverlay onComplete={handleCompletePresentationEvent} />

      {comebackPlanningOpen && canPlanComeback ? (
        <ComebackPlanningModal
          conceptHistory={conceptHistory}
          marketTrend={marketTrend}
          trainees={trainees}
          money={money}
          isSaving={isComebackSaving}
          errorMessage={workflowError}
          onConfirm={handleStartComeback}
          onClose={() => {
            if (!isComebackSaving) setComebackPlanningOpen(false);
          }}
        />
      ) : null}

      {weeklyFlow.state === "planning_ready" && positionReviewProject ? (
        <PositionReviewModal
          trainees={trainees}
          trialSeed={positionReviewProject.startedAtWeek * 997 + 41}
          isSaving={isPositionReviewSaving}
          onConfirm={handleCompletePositionReview}
        />
      ) : null}

      {weeklyFlow.state === "planning_ready" &&
      !positionReviewProject &&
      titleTrackProject &&
      currentAlbum ? (
        <TitleTrackSelectionModal
          albumTitle={currentAlbum.title}
          candidates={currentAlbum.titleTrackCandidates}
          isSaving={isTitleTrackSaving}
          errorMessage={workflowError}
          onConfirm={handleCompleteTitleTrackSelection}
        />
      ) : null}

      {campaignFailure ? (
        <CampaignOverScreen
          failure={campaignFailure}
          groupName={groupName}
          releasedAlbumCount={releasedAlbums.length}
          awardCount={awardHistory.length}
          fandom={fandomCore}
          onExit={onExit}
        />
      ) : null}
    </>
  );
}
