import type { WeeklyDecision } from "@/types/game";

export const WEEKLY_DECISION_POOL: WeeklyDecision[] = [
  {
    id: "training-focus",
    category: "Training",
    title: "This Week's Training Focus",
    summary: "Choose where the group's limited practice energy goes.",
    options: [
      {
        id: "vocals",
        label: "Vocal camp",
        description: "Push vocal polish and recording stability.",
        tradeoff: "Stress rises and dance progress slows.",
        effects: { trainee_vocal: 5, trainee_stress: 4, trainee_dance: -2 },
      },
      {
        id: "dance",
        label: "Choreo lock-in",
        description: "Tighten stage formation and chemistry.",
        tradeoff: "Vocal stamina and recovery time shrink.",
        effects: { trainee_dance: 5, chemistry: 3, condition: -2 },
      },
      {
        id: "rest",
        label: "Recovery week",
        description: "Prioritize condition and burnout control.",
        tradeoff: "Skill growth and hype both slow down.",
        effects: { condition: 7, stress: -5, public: -1 },
      },
    ],
  },
  {
    id: "budget-allocation",
    category: "Finance",
    title: "Budget Allocation",
    summary: "Cash is tight. One push means sacrificing another lane.",
    options: [
      {
        id: "song",
        label: "Buy a stronger demo",
        description: "Invest in a more competitive title track pool.",
        tradeoff: "Cash runway drops immediately.",
        effects: { album_song: 8, money: -25000000 },
      },
      {
        id: "marketing",
        label: "Push social ads",
        description: "Try to amplify public awareness before the comeback.",
        tradeoff: "Song polish and reserve funds suffer.",
        effects: { public: 4, money: -18000000, album_song: -2 },
      },
      {
        id: "reserve",
        label: "Hold reserves",
        description: "Protect survival and future flexibility.",
        tradeoff: "Momentum stalls this week.",
        effects: { money: 0, public: -1, album_marketing: -2 },
      },
    ],
  },
  {
    id: "member-schedule",
    category: "Scheduling",
    title: "Member Spotlight Request",
    summary: "One member got a high-visibility request for the week.",
    options: [
      {
        id: "variety",
        label: "Send to variety",
        description: "Chase buzz with one member's personality.",
        tradeoff: "That member misses group training.",
        effects: { public: 5, chemistry: -2, condition: -1 },
      },
      {
        id: "keep-team",
        label: "Keep team practice",
        description: "Stay group-first and protect team rhythm.",
        tradeoff: "Short-term visibility is lost.",
        effects: { chemistry: 4, public: -2 },
      },
      {
        id: "solo-lesson",
        label: "Private coaching",
        description: "Level up a specialist role for the next stage.",
        tradeoff: "The rest of the team gets less support.",
        effects: { trainee_specialist: 5, chemistry: -1, money: -6000000 },
      },
    ],
  },
  {
    id: "seasonal-concept",
    category: "Concept",
    title: "Seasonal Positioning",
    summary: "The market is shifting. Pick what fans feel next.",
    seasons: ["spring", "summer", "fall", "winter"],
    options: [
      {
        id: "safe",
        label: "Stay on-brand",
        description: "Reassure the core fandom with continuity.",
        tradeoff: "Public surprise is limited.",
        effects: { fandom_loyalty: 4, public: -1 },
      },
      {
        id: "bridge",
        label: "Bridge concept",
        description: "Transition gradually toward a new identity.",
        tradeoff: "No metric spikes immediately.",
        effects: { fandom_loyalty: 2, industry: 1, public: 1 },
      },
      {
        id: "shock",
        label: "Hard pivot",
        description: "Aim for breakout attention with a drastic switch.",
        tradeoff: "Core fan disappointment rises if execution misses.",
        effects: { public: 5, fandom_disappointment: 4, industry: -1 },
      },
    ],
  },
];
