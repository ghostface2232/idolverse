import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FastForward } from "lucide-react";
import { Alert } from "@/components/common/Alert";
import { ContractsOverviewModal } from "@/components/dashboard/ContractsOverviewModal";
import { DecisionCardDeck } from "@/components/dashboard/DecisionCardDeck";
import { GoalsOverviewModal } from "@/components/dashboard/GoalsOverviewModal";
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
import { TrainingSummaryCard } from "@/components/dashboard/TrainingSummaryCard";
import { ActionDock } from "@/components/game-shell/ActionDock";
import type { GameSection } from "@/components/game-shell/BottomNav";
import { GameShell } from "@/components/game-shell/GameShell";
import { GameWorldHost } from "@/components/game-shell/GameWorldHost";
import { MarketOverview } from "@/components/game-shell/MarketOverview";
import { MemberOverview } from "@/components/game-shell/MemberOverview";
import { MissionStrip } from "@/components/game-shell/MissionStrip";
import { MoreOverview } from "@/components/game-shell/MoreOverview";
import { TopStatusBar } from "@/components/game-shell/TopStatusBar";
import { EventModal } from "@/components/EventModal";
import { TraineeDetail } from "@/components/TraineeDetail";
import { WeekReport } from "@/components/WeekReport";
import { presentationBus } from "@/game/EventBus";
import {
  COMEBACK_REQUIREMENTS,
  GAME_BALANCE,
  type ComebackBudgetTierId,
} from "@/data/balance";
import { TITLE_TRACK_SELECTION_DECISION_ID } from "@/data/debutProject";
import { DEFAULT_AUTO_SAVE_SLOT } from "@/lib/saveSystem";
import { useMediaQuery } from "@/lib/useMediaQuery";
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
  trainStaffAndSave,
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
import { listAvailablePromotions } from "@/systems/promotionSystem";
import type {
  ConceptMood,
  GameEvent,
  Genre,
  PromotionActivityId,
  Staff,
  StaffTrainingId,
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

type OverviewModal = "goals" | "contracts" | null;

interface GameDashboardProps {
  userId: string;
  onExit: () => void;
}

export function GameDashboard({ userId, onExit }: GameDashboardProps) {
  const [activeSection, setActiveSection] = useState<GameSection>("company");
  const [weekView, setWeekView] = useState<"decisions" | "training">("decisions");
  const [overviewModal, setOverviewModal] = useState<OverviewModal>(null);
  const [memberDetailId, setMemberDetailId] = useState<string | null>(null);
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
  const [autoAdvance, setAutoAdvance] = useState(false);
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
  const strategicExpansion = useGameStore((state) => state.strategicExpansion);
  const campaignSeed = useGameStore((state) => state.campaignSeed);
  const campaignFailure = useGameStore((state) => state.campaignFailure);
  const insolvencyWeeks = useGameStore((state) => state.insolvencyWeeks);
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
  const investorType = useGameStore((state) => state.investorType);
  const chartPositions = useFandomStore((state) => state.chartPositions);
  const upcomingCompetitorComebacks = useCalendarStore(
    (state) => state.upcomingCompetitorComebacks,
  );

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
  // 벨 뱃지는 누적치가 아니라 "이번 주 새 소식"만 센다.
  const totalAlerts =
    notifications.filter((item) => item.week === currentWeek).length +
    news.filter((item) => item.week === currentWeek).length;
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
      // 주가 흐르는 모습(월드 연출)이 보이도록 회사 화면으로 돌아간다.
      setActiveSection("company");
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
    setWorkflowError(null);
    try {
      await applyEventChoiceAndSave(
        event,
        choiceIndex ?? -1,
        userId,
        DEFAULT_AUTO_SAVE_SLOT,
      );
    } catch (error) {
      console.error("Event choice save failed.", error);
      setWorkflowError("이벤트 결과를 저장하지 못했습니다. 다시 시도해 주세요.");
    }
  };

  const handleCloseWeekReport = useCallback(async () => {
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
  }, [isWorkflowSaving, userId]);

  // R5: 조용한 주 자동 진행. 결정 카드·프로젝트 결정·활동기·파산 카운트다운·
  // 열린 모달이 없을 때만 주가 흐르고, 무언가 생기면 그 자리에서 멈춘다.
  const quietPlanning =
    weeklyFlow.state === "planning_ready" &&
    weeklyDecisions.length === 0 &&
    !positionReviewProject &&
    !titleTrackProject &&
    !activityProject &&
    insolvencyWeeks === 0 &&
    !campaignFailure &&
    !comebackPlanningOpen &&
    companyModal === null &&
    overviewModal === null &&
    !notificationsOpen &&
    memberDetailId === null &&
    workflowError === null;
  const quietReport =
    weeklyFlow.state === "report_ready" &&
    weeklyFlow.eventQueueIds.length === 0 &&
    weeklyFlow.report !== null &&
    weeklyFlow.report.warnings.length === 0 &&
    weeklyFlow.report.injuries.length === 0 &&
    weeklyFlow.report.conflicts.length === 0 &&
    !weeklyFlow.report.comebackSettlement &&
    workflowError === null;

  useEffect(() => {
    if (!autoAdvance) return;
    if (quietPlanning && canResolveWeek && !isAdvancing) {
      const timer = setTimeout(() => void handleAdvanceWeek(), 450);
      return () => clearTimeout(timer);
    }
    if (quietReport && !isWorkflowSaving) {
      const timer = setTimeout(() => void handleCloseWeekReport(), 450);
      return () => clearTimeout(timer);
    }
  }, [
    autoAdvance,
    quietPlanning,
    quietReport,
    canResolveWeek,
    isAdvancing,
    isWorkflowSaving,
    handleAdvanceWeek,
    handleCloseWeekReport,
  ]);

  const handleCloseEvent = async () => {
    setWorkflowError(null);
    try {
      await advanceWeeklyEventAndSave(userId, DEFAULT_AUTO_SAVE_SLOT);
    } catch (error) {
      console.error("Event advance save failed.", error);
      setWorkflowError("이벤트 진행을 저장하지 못했습니다. 다시 시도해 주세요.");
    }
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

  const handleTrainStaff = async (
    staffId: string,
    trainingId: StaffTrainingId,
  ) => {
    if (isCompanySaving) return null;
    setIsCompanySaving(true);
    setWorkflowError(null);
    try {
      return await trainStaffAndSave(
        staffId,
        trainingId,
        userId,
        DEFAULT_AUTO_SAVE_SLOT,
      );
    } catch (error) {
      console.error("Staff training save failed.", error);
      setWorkflowError("스태프 훈련을 저장하지 못했습니다. 다시 시도해 주세요.");
      return null;
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
      awardHistory,
      activeProjects,
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
      fiveYearReviewInput: {
        albumQualities: releasedAlbums.map((album) => album.quality),
        topTenAlbums: releasedAlbums.filter(
          (album) =>
            album.performance?.chartPeak != null &&
            album.performance.chartPeak <= 10,
        ).length,
        public: fandomPublic,
        fandom: fandomCore,
        fandomLoyalty,
        global: fandomGlobal,
        industry: fandomIndustry,
        money,
        awards: awardHistory.length,
        strategicExpansion,
      },
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
    strategicExpansion,
    weeklyDecisions,
    investorConditions,
    activeProjects,
  ]);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const memberDetailTrainee =
    trainees.find((trainee) => trainee.id === memberDetailId) ?? null;
  // 미션 스트립: 차트 최고 순위(진입한 차트 중 최소값)와 가장 가까운 라이벌 컴백.
  const bestChartRank = useMemo(() => {
    const ranks = Object.values(chartPositions).filter((rank) => rank > 0);
    return ranks.length > 0 ? Math.min(...ranks) : null;
  }, [chartPositions]);
  const nextRivalComeback = useMemo(() => {
    const cumulativeWeek = toCumulativeWeek(currentYear, currentWeek);
    const upcoming = upcomingCompetitorComebacks
      .filter((comeback) => comeback.week >= cumulativeWeek)
      .sort((left, right) => left.week - right.week)[0];
    return upcoming
      ? {
          name: upcoming.competitorName,
          weeksUntil: upcoming.week - cumulativeWeek,
        }
      : null;
  }, [upcomingCompetitorComebacks, currentYear, currentWeek]);
  const plan = (
    <div className="space-y-3">
      {workflowError ? <Alert message={workflowError} /> : null}
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
          <p className="mt-1 text-pretty text-xs leading-5 text-text-muted [word-break:keep-all]">
            컨셉을 정하면 16주 사이클이 시작됩니다.
          </p>
        </button>
      ) : null}
      <DecisionCardDeck
        key={`${currentYear}-W${currentWeek}`}
        onConfirm={handleAdvanceWeek}
        isRunning={isAdvancing}
      />
      <button
        type="button"
        aria-pressed={autoAdvance}
        className={[
          "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs transition",
          autoAdvance
            ? "bg-brand-cyan/15 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]"
            : "bg-white/[0.04] text-text-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
        ].join(" ")}
        onClick={() => setAutoAdvance((value) => !value)}
      >
        <span className="flex items-center gap-1.5">
          <FastForward className="size-3.5" aria-hidden="true" />
          조용한 주 자동 진행
        </span>
        <span>{autoAdvance ? "켜짐" : "꺼짐"}</span>
      </button>
      {autoAdvance ? (
        <p className="px-1 text-[11px] leading-4 text-text-muted">
          결정, 이벤트, 활동기가 나타나면 자동으로 멈춥니다.
        </p>
      ) : null}
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
          <MissionStrip
            projectGoal={goalLanes.project}
            investorGoal={
              goalLanes.longTerm.find((item) => item.id.startsWith("investor:")) ??
              null
            }
            investorType={investorType}
            rookieGoal={
              goalLanes.longTerm.find((item) => item.id === "rookie-award") ?? null
            }
            contractDeadlineLabel={
              goalLanes.longTerm.find((item) => item.id === "contract-term")
                ?.deadlineLabel ?? null
            }
            bestChartRank={bestChartRank}
            nextRivalComeback={nextRivalComeback}
            hasGoalRisk={Boolean(primaryRisk)}
            onOpenGoals={() => setOverviewModal("goals")}
            onOpenContracts={() => setOverviewModal("contracts")}
            onOpenMarket={() => setActiveSection("market")}
          />
        }
        commandPanel={
          activeSection === "company" && isDesktop ? plan : undefined
        }
        actionDock={
          activeSection === "company" ? (
            <ActionDock
              totalDecisions={weeklyDecisions.length}
              remainingDecisions={remainingDecisions}
              canResolveWeek={canResolveWeek}
              flowState={weeklyFlow.state}
              riskLabel={primaryRisk?.description}
              onOpenPlan={() => setActiveSection("week")}
            />
          ) : undefined
        }
      >
        {activeSection === "week" ? (
          weekView === "training" ? (
            <Training onBack={() => setWeekView("decisions")} />
          ) : (
            <section className="h-full overflow-y-auto p-4 sm:p-5">
              <div className="mx-auto max-w-xl space-y-3">
                <TrainingSummaryCard onOpen={() => setWeekView("training")} />
                {plan}
              </div>
            </section>
          )
        ) : null}
        {activeSection === "members" ? (
          <MemberOverview onSelectTrainee={setMemberDetailId} />
        ) : null}
        {activeSection === "market" ? <MarketOverview /> : null}
        {activeSection === "more" ? (
          <MoreOverview
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenStaff={() => setCompanyModal("staff")}
            onOpenFacilities={() => setCompanyModal("facility")}
          />
        ) : null}
      </GameShell>

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

      {memberDetailTrainee ? (
        <TraineeDetail
          trainee={memberDetailTrainee}
          trainees={trainees}
          dormLevel={facilityUpgrades.dormLevel}
          livingExpenseLevel={facilityUpgrades.livingExpenseLevel}
          onClose={() => setMemberDetailId(null)}
        />
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
          onTrain={handleTrainStaff}
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
          isDebut={releasedAlbums.length === 0}
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
