import type { StaffRole } from "@/types/game";

export const STAFF_PROFILE_COUNT = 12;

export interface StaffProfile {
  name: string;
  profileImagePath: string;
  profileSpriteIndex: number;
}

export const STAFF_PROFILE_SPRITESHEETS: Record<StaffRole, readonly string[]> = {
  manager: [
    "/staff/manager-profiles-spritesheet.png",
    "/staff/manager-profiles-spritesheet2.png",
    "/staff/manager-profiles-spritesheet3.png",
  ],
  producer: [
    "/staff/producer-profiles-spritesheet.png",
    "/staff/producer-profiles-spritesheet2.png",
    "/staff/producer-profiles-spritesheet3.png",
  ],
  designer: [
    "/staff/designer-profiles-spritesheet.png",
    "/staff/designer-profiles-spritesheet2.png",
    "/staff/designer-profiles-spritesheet3.png",
  ],
  marketer: [
    "/staff/marketer-profiles-spritesheet.png",
    "/staff/marketer-profiles-spritesheet2.png",
    "/staff/marketer-profiles-spritesheet3.png",
  ],
};

const LEFT_SIDE_FEMALE_SPRITE_INDICES = new Set([0, 1, 4, 5, 8, 9]);

const STAFF_PROFILE_NAME_POOLS: Record<
  StaffRole,
  { female: readonly string[]; male: readonly string[] }
> = {
  manager: {
    female: [
      "한지윤",
      "이서연",
      "정유나",
      "서예린",
      "황채원",
      "강하은",
      "임소정",
      "윤다영",
      "전하린",
      "홍수빈",
      "안지우",
      "문채린",
      "차민경",
      "고은재",
      "신하율",
      "진세아",
      "배유림",
      "라채윤",
      "표나현",
    ],
    male: [
      "김태현",
      "최민수",
      "박준혁",
      "장현우",
      "권도윤",
      "조성민",
      "백승우",
      "유건호",
      "노지후",
      "남서진",
      "마도윤",
      "구하준",
      "성지안",
      "도예준",
      "민서호",
      "천가온",
      "유건",
    ],
  },
  producer: {
    female: [
      "유나리",
      "배소라",
      "신리나",
      "채민지",
      "문혜진",
      "오예진",
      "강루아",
      "박세린",
      "최아린",
      "차소율",
      "백유진",
      "유서안",
      "전다인",
      "노아현",
      "손미루",
      "공서윤",
      "오하늘",
      "민재희",
    ],
    male: [
      "신민재",
      "송예성",
      "한지호",
      "오서준",
      "이도현",
      "남기우",
      "정하민",
      "서도겸",
      "김이현",
      "윤태오",
      "장시온",
      "권해준",
      "임라온",
      "홍예찬",
      "조은호",
      "하도윤",
      "기준서",
      "류이담",
    ],
  },
  designer: {
    female: [
      "서유리",
      "김하린",
      "최루미",
      "윤세빈",
      "한아영",
      "문지안",
      "오채이",
      "임나래",
      "전소민",
      "배하윤",
      "조아린",
      "노연서",
      "라유나",
      "도하린",
      "진아름",
      "마은채",
      "정이솔",
      "박도아",
    ],
    male: [
      "이로운",
      "강재인",
      "송가현",
      "권시우",
      "장유겸",
      "신우진",
      "남리안",
      "차은결",
      "홍유찬",
      "백서율",
      "고태린",
      "유해솔",
      "민도현",
      "하이준",
      "성민재",
      "천서경",
      "구서진",
      "표지후",
    ],
  },
  marketer: {
    female: [
      "김서하",
      "이태린",
      "정예나",
      "윤하람",
      "문서윤",
      "송유진",
      "신유리",
      "배가은",
      "홍라희",
      "백민서",
      "민채린",
      "하세아",
      "성유림",
      "천하린",
      "구아린",
      "마지민",
      "기하윤",
      "임채원",
    ],
    male: [
      "박지완",
      "최현서",
      "강민재",
      "한도윤",
      "권하준",
      "오시현",
      "장다온",
      "전이안",
      "남하늘",
      "차지율",
      "조현우",
      "고서준",
      "유나겸",
      "노주원",
      "라시온",
      "도윤재",
      "진서우",
      "표은호",
    ],
  },
};

function isFemaleProfileSlot(role: StaffRole, sheetIndex: number, spriteIndex: number): boolean {
  if (LEFT_SIDE_FEMALE_SPRITE_INDICES.has(spriteIndex)) {
    return true;
  }

  return role === "manager" && sheetIndex === 0 && spriteIndex === 2;
}

function takeProfileName(pool: string[], role: StaffRole, gender: "female" | "male"): string {
  const name = pool.shift();
  if (name === undefined) {
    throw new Error(`Missing ${gender} staff profile name for ${role}`);
  }
  return name;
}

function createProfiles(role: StaffRole): StaffProfile[] {
  const sheets = STAFF_PROFILE_SPRITESHEETS[role];
  const femaleNames = [...STAFF_PROFILE_NAME_POOLS[role].female];
  const maleNames = [...STAFF_PROFILE_NAME_POOLS[role].male];

  return sheets.flatMap((profileImagePath, sheetIndex) =>
    Array.from({ length: STAFF_PROFILE_COUNT }, (_, profileSpriteIndex) => {
      const gender = isFemaleProfileSlot(role, sheetIndex, profileSpriteIndex)
        ? "female"
        : "male";

      return {
        name: takeProfileName(gender === "female" ? femaleNames : maleNames, role, gender),
        profileImagePath,
        profileSpriteIndex,
      };
    }),
  );
}

export const STAFF_PROFILES: Record<StaffRole, readonly StaffProfile[]> = {
  manager: createProfiles("manager"),
  producer: createProfiles("producer"),
  designer: createProfiles("designer"),
  marketer: createProfiles("marketer"),
};

export function getStaffProfileByName(role: StaffRole, name: string): StaffProfile | null {
  return STAFF_PROFILES[role].find((profile) => profile.name === name) ?? null;
}

export function pickStaffProfiles(
  role: StaffRole,
  count: number,
  random: () => number,
): StaffProfile[] {
  const pool = [...STAFF_PROFILES[role]];
  const picked: StaffProfile[] = [];

  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    const [profile] = pool.splice(index, 1);
    picked.push(profile);
  }

  return picked;
}

export function getStaffProfileClassNames(spriteIndex: number): string {
  return `staff-profile-sprite staff-profile-sprite-${spriteIndex}`;
}
