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
export type GameSpeed = 0 | 1 | 2 | 3;
export type Position =
  | "leader"
  | "mainVocal"
  | "mainDancer"
  | "center"
  | "visual"
  | "variety"
  | "producing";
export type Genre =
  | "pop"
  | "dance"
  | "hiphop"
  | "rnb"
  | "edm"
  | "ballad"
  | "cityPop"
  | "rock"
  | "acoustic";
export type ConceptMood =
  | "fresh"
  | "cute"
  | "dark"
  | "retro"
  | "girlCrush"
  | "emotional"
  | "artsy"
  | "y2k"
  | "summer"
  | "winter";
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

export interface InvestorCondition {
  id: string;
  metric: string;
  target: string;
  deadlineWeeks: number;
  penalty: string;
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
  effects: Record<string, number>;
}

export interface WeeklyDecision {
  id: string;
  category: string;
  title: string;
  summary: string;
  options: WeeklyDecisionOption[];
  seasons?: Season[];
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
    diligence: number;
    mental: number;
  };
  position: Position | null;
  subPosition: Position | null;
  conceptAffinity: Record<ConceptMood, number>;
  mood: number;
  stress: number;
  condition: number;
  satisfaction: number;
  potential: number;
  chemistry: Record<string, number>;
  currentActivity: TraineeActivity;
  injuryWeeks: number;
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  ability: number;
  salary: number;
  specialty?: string;
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
  activeWeeks: number;
  debutYear: number;
  strengths: string[];
  weaknesses: string[];
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
  effects: Record<string, number>;
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  title: string;
  description: string;
  choices?: EventChoice[];
  resolved: boolean;
}

export interface InterludeActivity {
  type: InterludeActivityType;
  targetMemberId?: string;
  weeksRemaining: number;
  effects: Record<string, number>;
}

export interface GameStoreState {
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
  gameSpeed: GameSpeed;
  weeklyDecisions: WeeklyDecision[];
  notifications: Notification[];
}

export interface GameStoreActions {
  advanceWeek: () => void;
  setGameSpeed: (speed: GameSpeed) => void;
  addNotification: (notification: Omit<Notification, "id"> & { id?: string }) => void;
  clearNotifications: () => void;
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
    updates: Partial<Pick<Trainee, "condition" | "stress" | "mood" | "injuryWeeks" | "currentActivity">>,
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
  releaseAlbum: (releaseWeek?: number) => void;
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
  updateFixedCosts: (
    costs: Partial<FinanceStoreState["fixedCosts"]>,
  ) => void;
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
  endInterlude: (
    type: InterludeActivityType,
    targetMemberId?: string,
  ) => void;
}

export type EventStore = EventStoreState & EventStoreActions;
