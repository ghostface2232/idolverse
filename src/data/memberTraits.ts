import type { ConceptMood, MemberTraitId, Trainee } from "@/types/game";

/**
 * 멤버에게는 장르 태그(Y2K·섹시)가 아니라 인간적 특성이 붙는다 —
 * 성격(순수·도도)과 인상(고양이상·장신). 컨셉과의 어울림은 특성이
 * 무드에 기여하는 친화로 파생된다: 도도×고양이상 멤버는 섹시 컨셉에서
 * 빛나고, 순수×강아지상 멤버는 청량 컨셉의 얼굴이 된다.
 */
export interface MemberTraitDefinition {
  id: MemberTraitId;
  label: string;
  kind: "personality" | "appearance";
  /** 무드별 친화 기여(기준 50에 더해진다). 없는 무드는 0. */
  moodAffinity: Partial<Record<ConceptMood, number>>;
}

export const MEMBER_TRAITS: MemberTraitDefinition[] = [
  // ── 성격 ──────────────────────────────────────────────
  {
    id: "pure",
    label: "순수",
    kind: "personality",
    moodAffinity: { refreshing: 20, cute: 10, dreamy: 10, sexy: -15, dark: -10 },
  },
  {
    id: "bubbly",
    label: "귀여움",
    kind: "personality",
    moodAffinity: { cute: 25, y2k: 10, refreshing: 8, sexy: -10, sophisticated: -6 },
  },
  {
    id: "haughty",
    label: "도도",
    kind: "personality",
    moodAffinity: { sexy: 15, girlCrush: 15, sophisticated: 10, cute: -12, refreshing: -6 },
  },
  {
    id: "energetic",
    label: "활력",
    kind: "personality",
    moodAffinity: { powerful: 15, y2k: 12, refreshing: 10, dreamy: -8, sophisticated: -4 },
  },
  {
    id: "reserved",
    label: "차분",
    kind: "personality",
    moodAffinity: { dreamy: 15, sophisticated: 12, retro: 8, powerful: -8, y2k: -6 },
  },
  // ── 인상 ──────────────────────────────────────────────
  {
    id: "catlike",
    label: "고양이상",
    kind: "appearance",
    moodAffinity: { sexy: 15, dark: 10, sophisticated: 8, girlCrush: 6, refreshing: -6 },
  },
  {
    id: "doglike",
    label: "강아지상",
    kind: "appearance",
    moodAffinity: { refreshing: 15, cute: 12, y2k: 6, dark: -10, sexy: -8 },
  },
  {
    id: "tall",
    label: "장신",
    kind: "appearance",
    moodAffinity: { powerful: 10, girlCrush: 10, sophisticated: 8, cute: -8 },
  },
  {
    id: "elegant",
    label: "세련",
    kind: "appearance",
    moodAffinity: { sophisticated: 18, retro: 10, sexy: 8, cute: -4 },
  },
  {
    id: "mysterious",
    label: "신비",
    kind: "appearance",
    moodAffinity: { dreamy: 20, dark: 12, sexy: 5, refreshing: -6, cute: -6 },
  },
  {
    id: "wholesome",
    label: "건강미",
    kind: "appearance",
    moodAffinity: { powerful: 15, refreshing: 10, girlCrush: 8, dreamy: -6 },
  },
];

export const MEMBER_TRAITS_BY_ID = new Map(
  MEMBER_TRAITS.map((trait) => [trait.id, trait]),
);

const PERSONALITY_TRAITS = MEMBER_TRAITS.filter(
  (trait) => trait.kind === "personality",
);
const APPEARANCE_TRAITS = MEMBER_TRAITS.filter(
  (trait) => trait.kind === "appearance",
);

/** 성격 1 + 인상 1을 시드 기반으로 뽑는다. */
export function pickMemberTraits(random: () => number): MemberTraitId[] {
  return [
    PERSONALITY_TRAITS[Math.floor(random() * PERSONALITY_TRAITS.length)].id,
    APPEARANCE_TRAITS[Math.floor(random() * APPEARANCE_TRAITS.length)].id,
  ];
}

const ALL_MOODS: ConceptMood[] = [
  "refreshing",
  "dark",
  "retro",
  "girlCrush",
  "cute",
  "sophisticated",
  "powerful",
  "dreamy",
  "y2k",
  "sexy",
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 특성에서 무드 친화를 파생한다. 특성이 단일 소스이고 conceptAffinity는
 * 캐시다 — 기존 시스템(품질·훈련 보너스·만족도)이 그대로 소비한다.
 * noise는 같은 특성이라도 사람마다 결이 다르게 한다.
 */
export function deriveConceptAffinity(
  traits: readonly MemberTraitId[],
  random?: () => number,
): Record<ConceptMood, number> {
  const affinity = {} as Record<ConceptMood, number>;
  for (const mood of ALL_MOODS) {
    const traitSum = traits.reduce(
      (sum, traitId) =>
        sum + (MEMBER_TRAITS_BY_ID.get(traitId)?.moodAffinity[mood] ?? 0),
    0);
    const noise = random ? (random() - 0.5) * 12 : 0;
    affinity[mood] = clamp(Math.round(50 + traitSum + noise), 5, 95);
  }
  return affinity;
}

export function traitLabels(trainee: Pick<Trainee, "traits">): string[] {
  return (trainee.traits ?? []).map(
    (traitId) => MEMBER_TRAITS_BY_ID.get(traitId)?.label ?? traitId,
  );
}

/**
 * 특성 조합이 컨셉과 정합할 때의 시너지. 성격과 인상이 모두 그 무드를
 * 지지하면(둘 다 +) "완성형 센터" — 도도×고양이상×섹시 같은 조합이
 * 뜰 확률을 높이는 근거다.
 */
export function traitComboBonus(
  traits: readonly MemberTraitId[],
  mood: ConceptMood,
): number {
  const supporting = traits.filter(
    (traitId) => (MEMBER_TRAITS_BY_ID.get(traitId)?.moodAffinity[mood] ?? 0) > 0,
  ).length;
  return supporting >= 2 ? 12 : 0;
}
