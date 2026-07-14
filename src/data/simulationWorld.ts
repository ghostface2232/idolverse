export const SIMULATION_WORLD = {
  width: 360,
  height: 420,
  sidePadding: 12,
  verticalPadding: 12,
  roomGap: 10,
  roomCount: 3,
  scaleMode: "fit" as const,
} as const;

export const SIMULATION_ROOM_IDS = ["practice", "dorm", "office"] as const;

export const SIMULATION_ROOM_LABELS = {
  practice: "연습실",
  dorm: "숙소",
  office: "사무실",
  external: "외부 활동",
} as const;
