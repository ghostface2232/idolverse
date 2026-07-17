import type { GroupGender, TraineeActivity } from "@/types/game";

export const MEMBER_SPRITE_FRAME = {
  width: 256,
  height: 448,
  pivotX: 128,
  pivotY: 424,
  count: 10,
} as const;

export const MEMBER_PORTRAIT_FRAME = {
  width: 256,
  height: 256,
  count: 10,
} as const;

export const MEMBER_OUTFITS = [
  "base",
  "trainee",
  "denim",
  "sports",
  "school",
  "stage",
  "leather",
  "hoodie",
  "street",
  "summer",
  "winter",
  "airport",
  "awards",
] as const;

export type MemberOutfitId = (typeof MEMBER_OUTFITS)[number];

export const MEMBER_OUTFIT_LABELS: Record<MemberOutfitId, string> = {
  base: "다크 기본복",
  trainee: "기본 연습생복",
  denim: "데님",
  sports: "스포츠",
  school: "교복",
  stage: "다크 네온 스테이지",
  leather: "가죽 재킷",
  hoodie: "레코딩 후드",
  street: "사이버 스트릿",
  summer: "브라이트 서머",
  winter: "아이보리 윈터",
  airport: "공항 패션",
  awards: "프리미엄 시상식",
};

function outfitRecord<T>(factory: (outfit: MemberOutfitId) => T): Record<MemberOutfitId, T> {
  return Object.fromEntries(
    MEMBER_OUTFITS.map((outfit) => [outfit, factory(outfit)]),
  ) as Record<MemberOutfitId, T>;
}

export const MEMBER_SPRITE_KEYS: Record<
  GroupGender,
  Record<MemberOutfitId, string>
> = {
  female: outfitRecord((outfit) => `member-female-${outfit}-v2`),
  male: outfitRecord((outfit) => `member-male-${outfit}-v2`),
};

export const MEMBER_SPRITE_PATHS: Record<
  GroupGender,
  Record<MemberOutfitId, string>
> = {
  female: outfitRecord(
    (outfit) =>
      `/game/characters/members-v2/female-${outfit}-sheet-transparent.png`,
  ),
  male: outfitRecord(
    (outfit) =>
      `/game/characters/members-v2/male-${outfit}-sheet-transparent.png`,
  ),
};

export const MEMBER_PORTRAIT_PATHS: Record<
  GroupGender,
  Record<MemberOutfitId, string>
> = {
  female: outfitRecord(
    (outfit) => `/game/characters/members-v2/female-${outfit}-portrait-sheet.png`,
  ),
  male: outfitRecord(
    (outfit) => `/game/characters/members-v2/male-${outfit}-portrait-sheet.png`,
  ),
};

/** 같은 멤버는 의상이 바뀌어도 같은 외모 프레임을 사용한다. */
export function memberSpriteFrameForId(traineeId: string): number {
  let hash = 2166136261;
  for (let index = 0; index < traineeId.length; index += 1) {
    hash ^= traineeId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % MEMBER_SPRITE_FRAME.count;
}

/** 현재 시뮬레이션 활동에 맞는 기본 의상이다. 앨범 화면은 원하는 의상 ID를 직접 선택한다. */
export function memberOutfitForActivity(activity: TraineeActivity): MemberOutfitId {
  if (activity === "training") return "trainee";
  if (activity === "individual") return "hoodie";
  if (activity === "rest") return "denim";
  if (activity === "vacation") return "airport";
  if (activity === "entertainment") return "stage";
  return "trainee";
}

export function memberSpriteKey(
  gender: GroupGender,
  outfit: MemberOutfitId,
): string {
  return MEMBER_SPRITE_KEYS[gender][outfit];
}
