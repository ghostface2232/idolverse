import type { DecisionCard } from "@/types/game";

export const DECISION_CARD_POOL: DecisionCard[] = [
  {
    id: "training-focus",
    category: "Training",
    title: "This Week's Training Focus",
    summary: "Choose where the group's limited practice energy goes.",
    options: [
      { id: "vocals", label: "Vocal camp", summary: "Boosts polish, adds fatigue." },
      { id: "dance", label: "Choreo lock-in", summary: "Improves stage synergy." },
      { id: "rest", label: "Recovery week", summary: "Restores condition, delays growth." },
    ],
  },
  {
    id: "budget-allocation",
    category: "Finance",
    title: "Budget Allocation",
    summary: "Cash is tight. One push means sacrificing another lane.",
    options: [
      { id: "song", label: "Buy a stronger demo", summary: "Raises song ceiling." },
      { id: "marketing", label: "Push social ads", summary: "Improves public visibility." },
      { id: "reserve", label: "Hold reserves", summary: "Protects runway, slows momentum." },
    ],
  },
  {
    id: "member-schedule",
    category: "Scheduling",
    title: "Member Spotlight Request",
    summary: "One member got a high-visibility request for the week.",
    options: [
      { id: "variety", label: "Send to variety", summary: "Recognition up, training skipped." },
      { id: "keep-team", label: "Keep team practice", summary: "Chemistry up, hype delayed." },
      { id: "solo-lesson", label: "Private coaching", summary: "Sharpens one specialist role." },
    ],
  },
  {
    id: "seasonal-concept",
    category: "Concept",
    title: "Seasonal Positioning",
    summary: "The market is shifting. Pick what fans feel next.",
    seasons: ["spring", "summer", "fall", "winter"],
    options: [
      { id: "safe", label: "Stay on-brand", summary: "Safer for core fans." },
      { id: "bridge", label: "Bridge concept", summary: "Softens future pivots." },
      { id: "shock", label: "Hard pivot", summary: "High-risk buzz play." },
    ],
  },
];

