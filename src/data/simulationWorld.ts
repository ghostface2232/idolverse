export const SIMULATION_WORLD = {
  width: 360,
  height: 420,
  sidePadding: 12,
  verticalPadding: 12,
  roomGap: 10,
  roomCount: 3,
  scaleMode: "fit" as const,
  /**
   * 캔버스 백킹스토어 배율. 월드 좌표는 360x420 그대로 두고 카메라 줌으로
   * 3배 해상도(1080x1260)에 렌더링해 DOM UI와 선명도를 맞춘다.
   */
  renderScale: 3,
} as const;

export const SIMULATION_ROOM_IDS = ["practice", "dorm", "office"] as const;

export const SIMULATION_ROOM_LABELS = {
  practice: "연습실",
  dorm: "숙소",
  office: "사무실",
  external: "외부 활동",
} as const;
