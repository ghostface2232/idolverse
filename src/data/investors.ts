import type { InvestorCondition, InvestorType } from "@/types/game";

export const INVESTOR_PROFILES: Record<
  InvestorType,
  { label: string; focus: string }
> = {
  it: {
    label: "IT Investor",
    focus: "Digital KPIs, virality, and platform growth",
  },
  entertainment: {
    label: "Entertainment Investor",
    focus: "Stage quality, awards, and broadcast leverage",
  },
  vc: {
    label: "VC Investor",
    focus: "Quarterly ROI, growth rate, and monetization pressure",
  },
  cosmetic: {
    label: "Cosmetic Investor",
    focus: "Visual impact, endorsements, and brand fit",
  },
  fashion: {
    label: "Fashion Investor",
    focus: "Trend alignment, styling power, and luxury visibility",
  },
};

export const INVESTOR_CONDITIONS: Record<InvestorType, InvestorCondition[]> = {
  it: [
    {
      id: "it-digital-growth",
      metric: "Digital reach",
      target: "Reach Top 30 streaming momentum within 12 weeks",
      deadlineWeeks: 12,
      penalty: "Platform support is reduced for the next quarter.",
    },
  ],
  entertainment: [
    {
      id: "ent-stage-score",
      metric: "Stage credibility",
      target: "Maintain average live performance score above B by comeback",
      deadlineWeeks: 16,
      penalty: "Broadcast priority and collaboration access are reduced.",
    },
  ],
  vc: [
    {
      id: "vc-roi",
      metric: "Quarterly ROI",
      target: "Reach positive cashflow trend before the next review",
      deadlineWeeks: 13,
      penalty: "Investor intervention raises monetization pressure.",
    },
  ],
  cosmetic: [
    {
      id: "cosmetic-visuals",
      metric: "Brand fit",
      target: "Maintain visual appeal and ad conversion benchmarks",
      deadlineWeeks: 10,
      penalty: "Campaign cancellation and reputation damage are applied.",
    },
  ],
  fashion: [
    {
      id: "fashion-trend",
      metric: "Trend relevance",
      target: "Land one standout style moment before fashion week",
      deadlineWeeks: 14,
      penalty: "Premium styling support is withdrawn.",
    },
  ],
};
