import type { KPopNews, Season } from "@/types/game";

export const SEASONAL_NEWS_POOL: Record<Season, Omit<KPopNews, "id" | "week">[]> = {
  spring: [
    {
      headline: "Fresh and Y2K concepts are outpacing darker comebacks.",
      detail: "Rookie-friendly sounds are performing better than moodier releases.",
      type: "trend",
    },
    {
      headline: "New rookie debuts are stacking up ahead of festival season.",
      detail: "The early-year window is getting more crowded for breakout acts.",
      type: "industry",
    },
  ],
  summer: [
    {
      headline: "Performance-heavy tracks are surging across festival lineups.",
      detail: "Strong choreography and spectacle are outperforming slower material.",
      type: "trend",
    },
    {
      headline: "A viral summer challenge is boosting recognition faster than sales.",
      detail: "The public is paying attention, but conversion to fandom is uneven.",
      type: "event",
    },
  ],
  fall: [
    {
      headline: "Award season prep is shifting attention to musical credibility.",
      detail: "Industry voters are rewarding polish, vocals, and concept coherence.",
      type: "industry",
    },
    {
      headline: "Emotional and retro concepts are outperforming louder trend plays.",
      detail: "Audience fatigue is hitting aggressive concept swings this quarter.",
      type: "trend",
    },
  ],
  winter: [
    {
      headline: "Year-end stages are magnifying industry reputation swings.",
      detail: "One standout stage can rewrite the narrative for a whole act.",
      type: "industry",
    },
    {
      headline: "Holiday concepts are converting casual listeners into core fandom.",
      detail: "Seasonal warmth is boosting loyalty metrics more than virality.",
      type: "trend",
    },
  ],
};
