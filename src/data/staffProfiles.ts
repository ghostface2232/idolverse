import type { StaffRole } from "@/types/game";

export const STAFF_PROFILE_COUNT = 12;

export interface StaffProfile {
  name: string;
  profileImagePath: string;
  profileSpriteIndex: number;
}

export const STAFF_PROFILE_SPRITESHEETS: Partial<Record<StaffRole, string>> = {
  manager: "/images/staff/manager-profiles-spritesheet.png",
  producer: "/images/staff/producer-profiles-spritesheet.png",
};

export const STAFF_PROFILES: Partial<Record<StaffRole, readonly StaffProfile[]>> = {
  manager: [
    { name: "한지윤", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 0 },
    { name: "이서연", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 1 },
    { name: "정유나", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 2 },
    { name: "김태현", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 3 },
    { name: "서예린", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 4 },
    { name: "황채원", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 5 },
    { name: "최민수", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 6 },
    { name: "박준혁", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 7 },
    { name: "강하은", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 8 },
    { name: "임소정", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 9 },
    { name: "장현우", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 10 },
    { name: "권도윤", profileImagePath: STAFF_PROFILE_SPRITESHEETS.manager, profileSpriteIndex: 11 },
  ],
  producer: [
    { name: "유나리", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 0 },
    { name: "배소라", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 1 },
    { name: "문혜진", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 2 },
    { name: "오예진", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 3 },
    { name: "신리나", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 4 },
    { name: "채민지", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 5 },
    { name: "한지호", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 6 },
    { name: "오서준", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 7 },
    { name: "신민재", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 8 },
    { name: "송예성", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 9 },
    { name: "이도현", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 10 },
    { name: "남기우", profileImagePath: STAFF_PROFILE_SPRITESHEETS.producer, profileSpriteIndex: 11 },
  ],
};

export function getStaffProfileByName(role: StaffRole, name: string): StaffProfile | null {
  return STAFF_PROFILES[role]?.find((profile) => profile.name === name) ?? null;
}

export function pickStaffProfiles(
  role: StaffRole,
  count: number,
  random: () => number,
): StaffProfile[] {
  const profiles = STAFF_PROFILES[role];
  if (profiles === undefined) {
    return [];
  }

  const pool = [...profiles];
  const picked: StaffProfile[] = [];

  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    const [profile] = pool.splice(index, 1);
    picked.push(profile);
  }

  return picked;
}

export function getStaffProfileClassNames(role: StaffRole, spriteIndex: number): string {
  return `staff-profile-sprite ${role}-profile-sprite staff-profile-sprite-${spriteIndex}`;
}
