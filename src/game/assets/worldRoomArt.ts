/**
 * 월드 룸 배경 일러스트 레지스트리 — WORLD-ART-ASSET-LIST 문서의 연동 지점.
 *
 * `public/images/game/world/`에 파일을 추가하고 여기 목록에 key/path를 등록하면
 * SimulationScene이 벡터 인테리어 대신 일러스트를 보여준다. 파일이 없거나
 * 로드에 실패하면 기존 벡터 렌더링으로 자동 폴백하므로 안전하게 늘려갈 수 있다.
 * 제작 규격: 룸 1008×375(@3x), 잠긴 방 공용 1장. 레벨 변형은 lv1~lv4.
 */

export type WorldRoomKey = "practice" | "dorm" | "office";

interface WorldRoomArtEntry {
  /** 레벨 변형이 없거나 로드되지 않았을 때 쓰는 기본 배경 텍스처 키. */
  base: string;
  /** 시설 레벨별 텍스처 키. 해당 레벨이 없으면 base로 폴백한다. */
  levels: Partial<Record<number, string>>;
}

const ROOM_ART_MAX_LEVEL = 4;

function roomPath(name: string): string {
  return `/game/world/${name}.png`;
}

/** BootScene이 프리로드하는 룸 아트 목록. */
export const WORLD_ROOM_ART_ASSETS: { key: string; path: string }[] = [
  { key: "room-practice-bg", path: roomPath("room-practice-bg") },
  { key: "room-practice-lv1", path: roomPath("room-practice-lv1") },
  { key: "room-practice-lv2", path: roomPath("room-practice-lv2") },
  { key: "room-practice-lv3", path: roomPath("room-practice-lv3") },
  { key: "room-practice-lv4", path: roomPath("room-practice-lv4") },
  { key: "room-dorm-bg", path: roomPath("room-dorm-bg") },
  { key: "room-dorm-lv1", path: roomPath("room-dorm-lv1") },
  { key: "room-dorm-lv2", path: roomPath("room-dorm-lv2") },
  { key: "room-dorm-lv3", path: roomPath("room-dorm-lv3") },
  { key: "room-dorm-lv4", path: roomPath("room-dorm-lv4") },
  { key: "room-office-bg", path: roomPath("room-office-bg") },
  { key: "room-locked-bg", path: roomPath("room-locked-bg") },
];

export const WORLD_ROOM_ART: Record<WorldRoomKey, WorldRoomArtEntry> = {
  practice: {
    base: "room-practice-bg",
    levels: {
      1: "room-practice-lv1",
      2: "room-practice-lv2",
      3: "room-practice-lv3",
      4: "room-practice-lv4",
    },
  },
  dorm: {
    base: "room-dorm-bg",
    levels: {
      1: "room-dorm-lv1",
      2: "room-dorm-lv2",
      3: "room-dorm-lv3",
      4: "room-dorm-lv4",
    },
  },
  office: {
    base: "room-office-bg",
    levels: {},
  },
};

export const WORLD_LOCKED_ROOM_TEXTURE = "room-locked-bg";

/** 방 상태에 맞는 텍스처 키 후보를 우선순위대로 돌려준다. */
export function roomArtCandidates(
  room: WorldRoomKey,
  level: number,
): string[] {
  const art = WORLD_ROOM_ART[room];
  const clamped = Math.min(Math.max(Math.floor(level), 0), ROOM_ART_MAX_LEVEL);
  const leveled = clamped > 0 ? art.levels[clamped] : undefined;
  return leveled ? [leveled, art.base] : [art.base];
}
