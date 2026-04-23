import type { InvestorType } from "@/types/game";

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
  cosmetics: {
    label: "Cosmetics Investor",
    focus: "Visual impact, endorsements, and brand fit",
  },
};

