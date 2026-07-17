export type Season = "spring" | "summer" | "fall" | "winter";
export type GamePhase =
  | "prologue"
  | "founding"
  | "training"
  | "debut"
  | "growth"
  | "peak";
export type GroupGender = "male" | "female";
export type InvestorType =
  | "it"
  | "entertainment"
  | "vc"
  | "cosmetic"
  | "fashion";
export type Position =
  | "leader"
  | "mainVocal"
  | "mainDancer"
  | "center"
  | "visual"
  | "variety"
  | "producing";
export type Genre =
  | "dancePop"
  | "ballad"
  | "hiphop"
  | "rnb"
  | "rock"
  | "edm"
  | "cityPop"
  | "trot";
export type ConceptMood =
  | "refreshing"
  | "dark"
  | "retro"
  | "girlCrush"
  | "cute"
  | "sophisticated"
  | "powerful"
  | "dreamy"
  | "y2k"
  | "sexy";
export type ConceptSynergyGrade = "S" | "A" | "B" | "C" | "D";
export type Nationality =
  | "korean"
  | "japanese"
  | "chinese"
  | "thai"
  | "american"
  | "other";
export type TraineeActivity =
  | "training"
  | "entertainment"
  | "rest"
  | "vacation"
  | "individual"
  | null;
export type StaffRole = "manager" | "producer" | "designer" | "marketer";
export type CompetitorType =
  | "traditional"
  | "viral"
  | "performance"
  | "global"
  | "survival";
export type EventRivalTriggerType =
  | "mega_rookie"
  | "comeback_monster"
  | "season_king"
  | "global_reverse";
export type KPopNewsType = "competitor" | "trend" | "event" | "industry";
export type InterludeActivityType =
  | "selfContent"
  | "fanManagement"
  | "individualSchedule"
  | "liveBroadcast"
  | "controversyResponse"
  | "vacation";
export type GameEventType =
  | "training"
  | "market"
  | "member"
  | "album"
  | "investor"
  | "scandal"
  | "system";
export type NotificationType = "info" | "success" | "warning" | "error";
export type TrainingIntensity = "normal" | "hard" | "extreme";
export type InvestorEffectSeverity = "low" | "medium" | "high" | "critical";
export type InvestorPenaltyEffectType =
  | "marketingCut"
  | "followUpRefusal"
  | "cashRecall"
  | "broadcastDisadvantage"
  | "collaborationBlock"
  | "managementInterference"
  | "equityPressure"
  | "contractPenalty"
  | "reputationDrop"
  | "styleSupportCut";
export type InvestorBonusEffectType =
  | "platformBoost"
  | "contentSubsidy"
  | "broadcastPriority"
  | "collaborationOpportunity"
  | "extraFundingRound"
  | "beautyCollab"
  | "globalBeautySupport"
  | "fashionWeekInvite"
  | "stylistSupport";
export type RandomEventTone = "positive" | "negative" | "neutral";
export type PromotionRequirementPhase =
  | "training+"
  | "debut+"
  | "growth+"
  | "peak";
export type PromotionActivityId =
  | "musicShow"
  | "varietyShow"
  | "youtubeContent"
  | "fanSign"
  | "liveBroadcast"
  | "fanCafeEvent"
  | "smallConcert"
  | "midConcert"
  | "largeConcert"
  | "domeConcert";
export type AwardShowId = "mma" | "mama" | "goldenDisk";
export type AwardCategory = "rookie" | "bonsang" | "daesang" | "popularity";
export type CompetitorTemplateId =
  | "traditionalMajor"
  | "viralCharacter"
  | "performanceMonster"
  | "globalSpecialist"
  | "survivalOrigin";
export type InterludeTemplateId =
  | "selfContent"
  | "fanManagement"
  | "individualSchedule"
  | "liveBroadcast"
  | "controversyIgnore"
  | "controversyClarify"
  | "controversyApologize"
  | "vacation"
  | "pictorial"
  | "fanMeeting";
export type TraineeStatKey =
  | "visual"
  | "vocal"
  | "dance"
  | "charm"
  | "stamina"
  | "mental";

/** 멤버 성격. 재계약 요구 시점·조건 격차 반응·스트레스 민감도를 가른다. */
export type MemberTemperament = "ambitious" | "devoted" | "steady" | "sensitive";

/**
 * 인간적 특성 — 성격(순수·도도 등)과 인상(고양이상·장신 등).
 * 컨셉 무드와의 어울림(conceptAffinity)은 여기서 파생된다(data/memberTraits.ts).
 */
export type MemberTraitId =
  | "pure"
  | "bubbly"
  | "haughty"
  | "energetic"
  | "reserved"
  | "catlike"
  | "doglike"
  | "tall"
  | "elegant"
  | "mysterious"
  | "wholesome";

/** 멤버별 처우 계약. 팀 전속계약(156주)과 별개로 개인 조건을 다룬다. */
export interface MemberContract {
  /** 처우 등급 1(신인 표준)~5(최상급). 팀 내 격차가 불만의 근거가 된다. */
  tier: number;
  /** 다음 재계약 협상이 도래하는 누적 주차. */
  nextRenegotiationWeek: number;
}

/**
 * 이정표 판정에 쓰는 지표의 단일 계약. progressionSystem이 게임 상태에서
 * 이 키들의 현재 값을 산출하고, data/milestones.ts의 정의가 목표치를 든다.
 */
export type MilestoneMetricKey =
  | "averageVocal"
  | "averageDance"
  | "teamChemistry"
  | "public"
  | "fandom"
  | "fandomLoyalty"
  | "global"
  | "industry"
  | "money"
  | "digitalIndex"
  | "albumSalesIndex"
  | "debutReadiness"
  | "releasedAlbums"
  | "awardsWon"
  | "comebacksSettled"
  | "musicShowCandidacies";

export type ProjectKind = "debut" | "comeback" | "campaign";
export type ProjectStatus = "active" | "blocked" | "completed";
export type ProjectDecisionStatus = "locked" | "available" | "completed";
/** 창단 시 정하는 데뷔 일정. 정의는 data/balance.ts의 DEBUT_SCHEDULE_TIERS. */
export type DebutScheduleTierId = "fast" | "standard" | "long";

export type ProjectMetricKey =
  | "elapsedWeeks"
  | "readiness"
  | "averageVocal"
  /** 일정상 프로모션(티저~쇼케이스)에 들어갈 시점인가. 게이트가 아니라 시계다. */
  | "launchReady"
  | "titleTrackSelected"
  | "albumReleased";

export interface ProjectStageRequirement {
  metric: ProjectMetricKey;
  target: number;
  label: string;
}

export interface ProjectStageDefinition {
  id: string;
  title: string;
  summary: string;
  /** 프로젝트 시작 주를 1주차로 한 진입 창. */
  weekWindow: readonly [number, number];
  entryRequirements?: ProjectStageRequirement[];
  eventIds?: string[];
  unlocks?: string;
}

export interface ProjectDefinition {
  id: string;
  kind: ProjectKind;
  title: string;
  stages: ProjectStageDefinition[];
  allowsOverlap: boolean;
}

export interface ProjectEvaluationResult {
  id: string;
  week: number;
  score: number;
  passed: boolean;
  summary: string;
}

/** 저장 가능한 범용 프로젝트 인스턴스. 정의/계산 함수는 저장하지 않는다. */
export interface ProjectInstance {
  id: string;
  definitionId: string;
  kind: ProjectKind;
  title: string;
  startedAtWeek: number;
  currentStageId: string;
  status: ProjectStatus;
  completedStageIds: string[];
  spawnedEventIds: string[];
  decisionStatuses: Record<string, ProjectDecisionStatus>;
  evaluations: Record<string, ProjectEvaluationResult>;
  completedAtWeek?: number;
  /** 이 프로젝트가 발매한 앨범. 음악방송·정산 단계가 발매 결과를 참조한다. */
  releasedAlbumId?: string;
  /** 데뷔 프로젝트의 일정 선택. 없으면 표준(20주) 일정으로 본다. */
  scheduleTierId?: DebutScheduleTierId;
}

export type MilestoneCategory =
  | "debut"
  | "promotion"
  | "release"
  | "award"
  | "global";

export interface MilestoneRequirement {
  metric: MilestoneMetricKey;
  target: number;
  label: string;
}

export interface MilestoneDefinition {
  id: string;
  title: string;
  category: MilestoneCategory;
  requirements: MilestoneRequirement[];
  /** 달성 시 열리는 행동. 보상은 수치가 아니라 새 플레이가 열린다는 사실이어야 한다. */
  unlocks: string;
}

/** 이정표 달성 기록. awardHistory처럼 게임 상태에 영속화된다. */
export interface AchievedMilestone {
  id: string;
  year: number;
  /** 달성 시점의 누적 주차(연도 랩 무관). */
  week: number;
}

/** phase 전이를 데이터로 표현하는 게이트. 전이 판정은 progressionSystem 한 곳에서만 한다. */
export interface PhaseGate {
  from: GamePhase;
  to: GamePhase;
  requirements: MilestoneRequirement[];
  description: string;
}

/**
 * 게임 내 모든 효과(결정 카드/이벤트/프로모션/투자사 페널티)가 사용할 수 있는
 * 키의 단일 계약. 여기 없는 키는 컴파일 에러가 되므로 조용히 소실될 수 없다.
 * 적용 규칙은 src/systems/applyEffects.ts 한 곳에서만 구현한다.
 */
export type EffectKey =
  // 재정
  | "money"
  // 팬덤 축
  | "public"
  | "fandom"
  | "fandomLoyalty"
  | "fandomDisappointment"
  | "global"
  | "industry"
  // 투자사 압박 (value = 압박 지속 주 수, 0 이하 = 즉시 해제)
  | "investorPressure"
  // 전체 트레이니 공통
  | "condition"
  | "stress"
  | "satisfaction"
  | "injuryWeeks"
  | "chemistry"
  // 트레이니 능력치 (전원 적용)
  | TraineeStatKey
  // 진행 중 앨범 (currentAlbum이 있을 때만 적용)
  | "albumSong"
  | "albumChoreography"
  | "albumVisual"
  | "albumMarketing";

export type EffectMap = Partial<Record<EffectKey, number>>;

export interface RangeValue {
  min: number;
  max: number;
}

export interface InvestorCondition {
  id: string;
  metric: string;
  target: number | string;
  deadlineWeeks: number;
  description: string;
  penalty?: string;
}

/**
 * 투자사 조건별 미달 진행 상태. 조건이 처음 미달된 누적 주차를 기록해
 * 유예 기간을 계산하고, 페널티가 이미 1회 집행됐는지 추적한다.
 * 조건이 다시 충족되면 항목이 제거되어 재실패 시 유예부터 다시 시작한다.
 */
export interface InvestorConditionProgress {
  firstFailedWeek: number;
  penaltyApplied: boolean;
}

export interface InvestorEffect<TType extends string = string> {
  type: TType;
  severity?: InvestorEffectSeverity;
  description: string;
}

export interface InvestorCompany {
  id: string;
  name: string;
  type: InvestorType;
  description: string;
  fundAmount: number;
  conditions: InvestorCondition[];
  penaltyEffects: InvestorEffect<InvestorPenaltyEffectType>[];
  bonusEffects: InvestorEffect<InvestorBonusEffectType>[];
  personality: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  week: number;
}

export interface WeeklyDecisionOption {
  id: string;
  label: string;
  description: string;
  tradeoff: string;
  effects: EffectMap;
  /** 멤버 관련 효과를 적용할 대상. 없으면 기존처럼 팀 전체에 적용한다. */
  targetTraineeIds?: string[];
  /** 수락 시 플레이어가 직접 고르는 동적 참여 인원 규칙. */
  targetSelection?: {
    label: string;
    min: number;
    max: number;
  };
  /** 선택 때문에 이번 주 훈련 대신 수행할 활동. 다음 주에는 자동 해제한다. */
  activityOverride?: TraineeActivity;
}

export type WeeklyDecisionTriggerKind =
  | "injury"
  | "conflict"
  | "investor"
  | "finance"
  | "fandom"
  | "morale"
  | "overwork"
  | "opportunity"
  | "contract";

export interface WeeklyDecisionTrigger {
  kind: WeeklyDecisionTriggerKind;
  severity: "notice" | "warning" | "critical";
  entityIds: string[];
  description: string;
}

export interface WeeklyDecision {
  id: string;
  /** 위기는 해결이 필수고, 기회는 선택하지 않으면 주간 종료와 함께 소멸한다. */
  lane: "crisis" | "opportunity";
  category: string;
  title: string;
  summary: string;
  options: WeeklyDecisionOption[];
  seasons?: Season[];
  /** 누적 주차 기준 만료 시점. 현재는 기회 카드에만 사용한다. */
  expiresAtWeek?: number;
  /** 이 카드가 이번 주에 등장한 실제 게임 상태의 원인. */
  trigger?: WeeklyDecisionTrigger;
}

export interface Trainee {
  id: string;
  name: string;
  age: number;
  nationality: Nationality;
  stats: {
    visual: number;
    vocal: number;
    dance: number;
    charm: number;
    stamina: number;
    mental: number;
  };
  position: Position | null;
  subPosition: Position | null;
  /** 인간적 특성(성격 1 + 인상 1). conceptAffinity의 단일 소스. */
  traits: MemberTraitId[];
  /** 특성에서 파생된 무드 친화 캐시. 시스템들이 소비한다. */
  conceptAffinity: Record<ConceptMood, number>;
  mood: number;
  stress: number;
  condition: number;
  satisfaction: number;
  potential: number;
  chemistry: Record<string, number>;
  currentActivity: TraineeActivity;
  injuryWeeks: number;
  /** 개인 인기도(0~100). 활동·노출로 쌓이고 비활동 주에 서서히 식는다. */
  popularity: number;
  temperament: MemberTemperament;
  contract: MemberContract;
  /** 만족도 바닥이 연속된 주 수. 임계에 닿으면 실제로 이탈한다. */
  leaveCountdown?: number;
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  ability: number;
  /** 실무 성장의 천장. 채용 시 랜덤 결정되며 이 이상은 오르지 않는다. */
  potentialCap?: number;
  salary: number;
  specialty?: string;
  profileImagePath?: string;
  profileSpriteIndex?: number;
}

export interface TitleTrack {
  id: string;
  name: string;
  type: "safe" | "bold" | "fandom" | "global";
  quality: number;
  description: string;
}

export interface AlbumPerformance {
  chartPeak: number;
  chartPower?: number;
  firstWeekSales: number;
  totalStreams: number;
  fanGrowth: number;
}

export interface Album {
  id: string;
  title: string;
  concept: {
    genre: Genre;
    mood: ConceptMood;
  };
  titleTrackCandidates: TitleTrack[];
  titleTrack: TitleTrack | null;
  /**
   * 이 앨범의 센터. 컨셉과 어울리는 얼굴을 앨범마다 바꿔 세울 수 있다 —
   * 없으면 포지션 센터가 기본값이 된다.
   */
  centerTraineeId?: string | null;
  progress: {
    song: number;
    visual: number;
    choreography: number;
    marketing: number;
  };
  memberConceptFit: number;
  seasonFit: number;
  fandomExpectationFit: number;
  externalCollaborators: {
    composer?: boolean;
    choreographer?: boolean;
  };
  quality: number;
  releaseWeek?: number;
  performance?: AlbumPerformance;
}

export interface CompetitorGroup {
  id: string;
  name: string;
  agency: string;
  gender: GroupGender;
  type: CompetitorType;
  stats: {
    vocal: number;
    dance: number;
    visual: number;
    marketing: number;
  };
  fandom: number;
  public: number;
  global: number;
  industry: number;
  currentAlbum?: {
    title: string;
    quality: number;
    releaseWeek: number;
  };
  /**
   * 올해 최고 앨범 품질. 시상식 지표가 currentAlbum 스냅샷(4주 후 소멸)에
   * 의존하면 시상 주마다 붕괴하므로 연간 기록을 별도로 든다.
   */
  seasonBestQuality?: number;
  activeWeeks: number;
  debutYear: number;
  strengths: string[];
  weaknesses: string[];
}

export interface BackgroundGroup {
  id: string;
  name: string;
  agency: string;
  gender: GroupGender;
  chartScore: number;
}

export interface EventCompetitor extends CompetitorGroup {
  triggerType: EventRivalTriggerType;
  duration: number;
  intensity: number;
}

export interface KPopNews {
  id: string;
  week: number;
  headline: string;
  detail: string;
  type: KPopNewsType;
}

export interface EventChoice {
  label: string;
  description: string;
  tradeoff: string;
  effects: EffectMap;
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  tone?: RandomEventTone;
  title: string;
  description: string;
  choices?: EventChoice[];
  resolved: boolean;
  /** 해결된 선택지 index. 선택지가 없는 이벤트는 null, 구버전은 undefined. */
  resolvedChoiceIndex?: number | null;
  presentation?:
    | {
        kind: "chart-reveal";
        chartName: string;
        rank: number;
        albumTitle: string;
        trackTitle: string;
        chartPower: number;
      }
    | {
        kind: "music-show";
        showName: string;
        trackTitle: string;
        playerScore: number;
        rivalName: string;
        rivalScore: number;
        won: boolean;
      };
}

export interface InterludeActivity {
  type: InterludeActivityType;
  targetMemberId?: string;
  weeksRemaining: number;
  effects: EffectMap;
}

export interface RandomEventCondition {
  phase?: GamePhase | GamePhase[];
  minWeek?: number;
  maxWeek?: number;
  minFame?: number;
  minPublic?: number;
  minFandom?: number;
  minGlobal?: number;
  minIndustry?: number;
  maxSatisfaction?: number;
  minStress?: number;
  requiresSecurity?: boolean;
  requiresVacation?: boolean;
  lowChemistryPair?: boolean;
}

export interface RandomEventTemplate {
  id: string;
  type: RandomEventTone;
  title: string;
  description: string;
  probability: number;
  conditions: RandomEventCondition;
  effects: EffectMap;
  choices?: EventChoice[];
}

export interface PromotionActivity {
  id: PromotionActivityId;
  name: string;
  cost: number;
  duration: number;
  successFactors?: Array<TraineeStatKey | "teamwork" | "visualStyle">;
  effects: EffectMap;
  requirements: {
    phase?: PromotionRequirementPhase;
    minPublic?: number;
    minFandom?: number;
    minIndustry?: number;
  };
  sideEffect?: string;
  income?: number;
}

export interface AwardShow {
  id: AwardShowId;
  name: string;
  categories: AwardCategory[];
  weights: {
    digital: number;
    albumSales: number;
    votes: number;
    judges: number;
  };
  description: string;
}

/** 플레이어가 수상한 기록. 시상식 주가 지나도 게임 상태에 남는다. */
export interface AwardRecord {
  year: number;
  /** 수상 시점의 누적 주차(연도 랩 무관). 투자사 마감(deadlineWeeks) 비교에 쓴다. */
  week: number;
  showId: AwardShowId;
  showName: string;
  category: AwardCategory;
}

export interface CompetitorTemplate {
  id: CompetitorTemplateId;
  name: string;
  type: CompetitorType;
  description: string;
  agencyPool: string[];
  groupNamePool: Record<GroupGender, string[]>;
  statRanges: Partial<Record<TraineeStatKey | "marketing" | "global", RangeValue>>;
  fandomRange: RangeValue;
  publicRange: RangeValue;
  globalRange: RangeValue;
  industryRange: RangeValue;
  comebackIntervalWeeks?: RangeValue;
  strengths: string[];
  weaknesses: string[];
}

export interface EventCompetitorTemplate extends CompetitorTemplate {
  triggerType: EventRivalTriggerType;
  durationWeeks: RangeValue;
  intensityRange: RangeValue;
}

export interface InterludeTemplate {
  id: InterludeTemplateId;
  name: string;
  cost?: number;
  duration: number | RangeValue;
  effects: EffectMap;
  risks?: string[];
  successFactors?: TraineeStatKey[];
  targetMemberStatBonus?: Partial<Record<TraineeStatKey, number>>;
}

export interface TrainingScheduleState {
  intensity: TrainingIntensity;
  focus: TraineeStatKey | null;
  restDay: boolean;
}

export type WeeklyFlowState =
  | "planning_ready"
  | "planning_active"
  | "review_ready"
  | "resolving"
  | "report_ready"
  | "event_focus";

export type WeekDeltaSeverity = "info" | "notice" | "warning" | "critical";
export type WeekDeltaValue = number | string | boolean | null;

export interface WeekDeltaSource {
  kind:
    | "decision"
    | "promotion"
    | "training"
    | "chemistry"
    | "satisfaction"
    | "album"
    | "event"
    | "finance"
    | "fandom"
    | "investor"
    | "calendar"
    | "milestone"
    | "project"
    | "system";
  id: string;
  label: string;
}

export interface WeekDeltaTarget {
  kind: "game" | "project" | "trainee" | "album" | "fandom" | "finance";
  id: string | null;
  field: string;
  label: string;
}

/** 한 주의 결과를 원인과 대상까지 추적할 수 있는 구조화 변화 단위. */
export interface WeekDelta {
  id: string;
  source: WeekDeltaSource;
  target: WeekDeltaTarget;
  before: WeekDeltaValue;
  after: WeekDeltaValue;
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  severity: WeekDeltaSeverity;
}

/** 컴백 정산 주에 리포트를 격상시키는 요약. 발매 성과와 다음 사이클 훅을 담는다. */
export interface ComebackSettlementReport {
  projectId: string;
  albumTitle: string;
  trackTitle: string;
  chartPeak: number;
  firstWeekSales: number;
  totalStreams: number;
  fanGrowth: number;
  /** 활동기 음악방송 1위 횟수. 후보권에 들지 못했으면 null. */
  musicShowWins: number | null;
  /** 정산 시점의 투자사 조건 대비 현황 요약. */
  investorNotes: string[];
  /** 다음 사이클을 여는 질문(컨셉 히스토리 기반). */
  nextHook: string;
}

/** 저장 가능한 주간 리포트의 공통 부분. Phase 2 결과 UI는 이 계약만 소비한다. */
export interface WeeklyReportSnapshot {
  week: number;
  season: Season;
  statChanges: string[];
  deltas: WeekDelta[];
  events: GameEvent[];
  news: KPopNews[];
  finance: { income: Record<string, number>; expenses: Record<string, number> };
  warnings: string[];
  injuries: { traineeId: string; traineeName: string }[];
  conflicts: { a: string; b: string; resolved: boolean }[];
  competitorComebacks: string[];
  /** 컴백 정산 주에만 채워진다. 구버전 리포트에는 없다. */
  comebackSettlement?: ComebackSettlementReport | null;
}

export interface WeeklyFlowSnapshot {
  state: WeeklyFlowState;
  selectedDecisionIds: Record<string, string>;
  selectedTargetTraineeIds: Record<string, string[]>;
  eventQueueIds: string[];
  activeEventIndex: number;
  resolutionId: string | null;
  report: WeeklyReportSnapshot | null;
}

export interface GameStoreState {
  /** 서버가 stale save를 거부하기 위한 단조 증가 persistence revision. */
  saveRevision: number;
  /**
   * 회차별 세계 시드. 주차 기반 RNG(경쟁 시뮬·이벤트 라이벌 스폰)에 섞여
   * 회차마다 세계가 다르게 진화한다. 0이면 구버전 세이브와 동일하게 동작한다.
   */
  campaignSeed: number;
  currentWeek: number;
  currentSeason: Season;
  currentYear: number;
  currentPhase: GamePhase;
  groupGender: GroupGender;
  companyName: string;
  groupName: string;
  investorType: InvestorType;
  investorConditions: InvestorCondition[];
  investorPenaltyActive: boolean;
  investorConditionProgress: Record<string, InvestorConditionProgress>;
  /** 이벤트/카드의 investorPressure 효과로 걸린 압박의 남은 주 수. 매주 1씩 감소한다. */
  investorPressureWeeks: number;
  investorComplianceCount: number;
  /** 마지막 기회 카드가 제시된 누적 주차. 수락 여부와 무관하게 빈도를 제어한다. */
  lastOpportunityWeek: number | null;
  /** 역대 수상 기록. 투자사 awardLevel 조건은 시상 주가 아닌 이 기록으로 평가한다. */
  awardHistory: AwardRecord[];
  /** 달성한 이정표 기록. 해금 판정과 GoalStrip 표시의 근거가 된다. */
  milestonesAchieved: AchievedMilestone[];
  /** 범용 단계형 프로젝트. M4에서 컴백 인스턴스가 같은 배열에 중첩된다. */
  activeProjects: ProjectInstance[];
  weeklyDecisions: WeeklyDecision[];
  notifications: Notification[];
  trainingSchedule: TrainingScheduleState;
  weeklyFlow: WeeklyFlowSnapshot;
}

export interface GameStoreActions {
  advanceWeek: () => void;
  addNotification: (notification: Omit<Notification, "id"> & { id?: string }) => void;
  clearNotifications: () => void;
  setTrainingSchedule: (schedule: Partial<TrainingScheduleState>) => void;
  selectWeeklyDecision: (cardId: string, optionId: string) => void;
  setWeeklyDecisionTargets: (cardId: string, traineeIds: string[]) => void;
  clearWeeklyDecision: (cardId: string) => void;
  acknowledgeWeeklyReport: () => void;
  advanceWeeklyEvent: () => void;
}

export type GameStore = GameStoreState & GameStoreActions;

export interface TraineeStoreState {
  trainees: Trainee[];
}

export interface TraineeStoreActions {
  addTrainee: (trainee: Trainee) => void;
  removeTrainee: (traineeId: string) => void;
  updateStats: (traineeId: string, stats: Partial<Trainee["stats"]>) => void;
  updateCondition: (
    traineeId: string,
    updates: Partial<
      Pick<Trainee, "condition" | "stress" | "mood" | "injuryWeeks" | "currentActivity">
    >,
  ) => void;
  assignPosition: (
    traineeId: string,
    position: Position | null,
    subPosition?: Position | null,
  ) => void;
  updateChemistry: (traineeId: string, targetId: string, value: number) => void;
  updateSatisfaction: (traineeId: string, satisfaction: number) => void;
}

export type TraineeStore = TraineeStoreState & TraineeStoreActions;

export interface StaffStoreState {
  staff: Staff[];
}

export interface StaffStoreActions {
  hireStaff: (member: Staff) => void;
  fireStaff: (staffId: string) => void;
}

export type StaffStore = StaffStoreState & StaffStoreActions;

export interface AlbumStoreState {
  currentAlbum: Album | null;
  releasedAlbums: Album[];
  conceptHistory: ConceptMood[];
}

export interface AlbumStoreActions {
  startAlbum: (
    album: Omit<Album, "quality" | "releaseWeek" | "performance"> &
      Partial<Pick<Album, "quality" | "releaseWeek" | "performance">>,
  ) => void;
  updateProgress: (progress: Partial<Album["progress"]>) => void;
  selectTitleTrack: (trackId: string) => void;
  /** 품질·성과 계산은 albumSystem/evaluationSystem에서 끝낸 뒤 결과만 커밋한다. */
  releaseAlbum: (releasedAlbum: Album) => void;
  addToHistory: (mood: ConceptMood) => void;
}

export type AlbumStore = AlbumStoreState & AlbumStoreActions;

export interface FandomStoreState {
  public: number;
  fandom: number;
  fandomLoyalty: number;
  fandomDisappointment: number;
  global: number;
  industry: number;
  chartPositions: {
    melon: number;
    spotify: number;
    youtube: number;
    albumSales: number;
  };
  weeklyRevenue: {
    streaming: number;
    album: number;
    concert: number;
    ads: number;
    goods: number;
    other: number;
  };
}

export interface FandomStoreActions {
  updatePublic: (value: number) => void;
  updateFandom: (value: number, loyalty?: number) => void;
  updateGlobal: (value: number) => void;
  updateIndustry: (value: number) => void;
  updateCharts: (charts: Partial<FandomStoreState["chartPositions"]>) => void;
  addDisappointment: (amount: number) => void;
  resetRevenue: () => void;
}

export type FandomStore = FandomStoreState & FandomStoreActions;

export interface CompetitorStoreState {
  permanentRivals: CompetitorGroup[];
  eventRivals: EventCompetitor[];
  backgroundGroups: BackgroundGroup[];
}

export interface CompetitorStoreActions {
  addPermanentRival: (rival: CompetitorGroup) => void;
  updateRival: (
    rivalId: string,
    updates: Partial<CompetitorGroup>,
    eventRival?: boolean,
  ) => void;
  spawnEventRival: (rival: EventCompetitor) => void;
  removeEventRival: (rivalId: string) => void;
}

export type CompetitorStore = CompetitorStoreState & CompetitorStoreActions;

export interface FinanceStoreState {
  money: number;
  fixedCosts: {
    dormitory: number;
    studio: number;
    staffSalary: number;
    livingExpense: number;
    equipment: number;
    healthcare: number;
    security: number;
  };
  upgrades: {
    dormLevel: 1 | 2 | 3 | 4;
    studioLevel: 1 | 2 | 3 | 4;
    equipmentLevel: 1 | 2 | 3 | 4;
    livingExpenseLevel: 1 | 2 | 3 | 4;
    hasHealthcare: boolean;
    hasSecurity: boolean;
  };
  weeklyFixedTotal: number;
  incomeHistory: { week: number; breakdown: Record<string, number> }[];
  expenseHistory: { week: number; breakdown: Record<string, number> }[];
}

export interface FinanceStoreActions {
  addMoney: (amount: number) => void;
  subtractMoney: (amount: number) => void;
  updateFixedCosts: (costs: Partial<FinanceStoreState["fixedCosts"]>) => void;
  upgrade: (
    target:
      | "dormLevel"
      | "studioLevel"
      | "equipmentLevel"
      | "hasHealthcare"
      | "hasSecurity",
  ) => void;
  recordIncome: (week: number, breakdown: Record<string, number>) => void;
  recordExpense: (week: number, breakdown: Record<string, number>) => void;
}

export type FinanceStore = FinanceStoreState & FinanceStoreActions;

export interface CalendarStoreState {
  currentSeason: Season;
  seasonConceptBonus: Record<ConceptMood, number>;
  kpopNews: KPopNews[];
  upcomingCompetitorComebacks: {
    week: number;
    competitorId: string;
    competitorName: string;
  }[];
  marketTrend: {
    hotGenre: Genre;
    coldGenre: Genre;
    hotMood: ConceptMood;
    coldMood: ConceptMood;
  };
}

export interface CalendarStoreActions {
  updateSeason: (season: Season) => void;
  addNews: (news: KPopNews) => void;
  updateTrend: (trend: Partial<CalendarStoreState["marketTrend"]>) => void;
  updateComebacks: (
    comebacks: CalendarStoreState["upcomingCompetitorComebacks"],
  ) => void;
}

export type CalendarStore = CalendarStoreState & CalendarStoreActions;

export interface EventStoreState {
  pendingEvents: GameEvent[];
  activeInterludeActivities: InterludeActivity[];
}

export interface EventStoreActions {
  addEvent: (event: GameEvent) => void;
  resolveEvent: (eventId: string) => void;
  startInterlude: (activity: InterludeActivity) => void;
  endInterlude: (type: InterludeActivityType, targetMemberId?: string) => void;
}

export type EventStore = EventStoreState & EventStoreActions;
