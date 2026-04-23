import type { AwardShow } from "@/types/game";

export const AWARD_SHOWS: Record<string, AwardShow> = {
  mma: {
    id: "mma",
    name: "MMA",
    categories: ["rookie", "bonsang", "daesang", "popularity"],
    weights: {
      digital: 0.6,
      albumSales: 0.1,
      votes: 0.2,
      judges: 0.1,
    },
    description: "국내 최대 음원 플랫폼이 주최하는 시상식. 디지털 음원 성적 비중이 압도적이다.",
  },
  mama: {
    id: "mama",
    name: "MAMA",
    categories: ["rookie", "bonsang", "daesang", "popularity"],
    weights: {
      digital: 0.3,
      albumSales: 0.2,
      votes: 0.3,
      judges: 0.2,
    },
    description: "아시아 최대 규모의 K-POP 시상식. 글로벌 팬 투표와 무대 심사의 비중이 크다.",
  },
  goldenDisk: {
    id: "goldenDisk",
    name: "골든디스크",
    categories: ["rookie", "bonsang", "daesang", "popularity"],
    weights: {
      digital: 0.2,
      albumSales: 0.6,
      votes: 0.1,
      judges: 0.1,
    },
    description: "가장 오랜 역사를 가진 음반 시상식. 실물 음반 판매량이 핵심 지표다.",
  },
};
