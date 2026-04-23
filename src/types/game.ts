export type InvestorType = "it" | "entertainment" | "vc" | "cosmetics";
export type SeasonKey = "spring" | "summer" | "fall" | "winter";
export type SimulationFocus = "practice-room" | "stage-blocking" | "dorm";

export interface DecisionOption {
  id: string;
  label: string;
  summary: string;
}

export interface DecisionCard {
  id: string;
  category: string;
  title: string;
  summary: string;
  options: DecisionOption[];
  seasons?: SeasonKey[];
}

export interface GameStoreState {
  currentWeek: number;
  season: SeasonKey;
  investorType: InvestorType;
  simulationPaused: boolean;
  simulationFocus: SimulationFocus;
}

export interface TraineeStoreState {
  activeMembers: number;
  averageCondition: number;
  chemistryAverage: number;
}

export interface StaffStoreState {
  managerRank: number;
  trainingEfficiency: number;
}

export interface AlbumStoreState {
  activeConcept: string;
  releaseReadiness: number;
}

export interface FandomStoreState {
  publicRecognition: number;
  coreFandom: number;
  overseasFandom: number;
  industryReputation: number;
}

export interface CompetitorStoreState {
  activeGroups: number;
  marketPressure: number;
}

export interface FinanceStoreState {
  cash: number;
  weeklyBurn: number;
}

export interface CalendarStoreState {
  upcomingMilestones: string[];
}

export interface EventStoreState {
  marketHeadline: string;
  weeklyDecisionCards: DecisionCard[];
}

