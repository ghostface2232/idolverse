import type { AwardShow } from "@/types/game";

export const AWARD_SHOWS: Record<string, AwardShow> = {
  mma: {
    id: "mma",
    name: "MMA",
    categories: ["rookie", "bonsang", "daesang", "popularity"],
    weights: {
      digital: 0.6, // MMA는 음원 지표 중심으로 체감되어야 한다.
      albumSales: 0.1, // 음반은 참고 수준으로만 반영한다.
      votes: 0.2, // 팬 투표는 영향력이 있지만 절대적이지 않다.
      judges: 0.1, // 심사는 마무리 보정 역할 정도로 둔다.
    },
    description: "디지털 음원 성적 비중이 가장 높은 시상식",
  },
  mama: {
    id: "mama",
    name: "MAMA",
    categories: ["rookie", "bonsang", "daesang", "popularity"],
    weights: {
      digital: 0.3, // 디지털은 중요하지만 MMA만큼 절대적이지 않다.
      albumSales: 0.2, // 팬덤 체급도 무시할 수 없어야 한다.
      votes: 0.3, // 글로벌 투표 체감이 강해야 MAMA다운 성격이 산다.
      judges: 0.2, // 심사는 글로벌 서사와 무대 완성도를 반영한다.
    },
    description: "글로벌 투표와 심사 비중이 큰 시상식",
  },
  goldenDisk: {
    id: "goldenDisk",
    name: "골든디스크",
    categories: ["rookie", "bonsang", "daesang", "popularity"],
    weights: {
      digital: 0.2, // 디지털은 중요하지만 핵심은 아니다.
      albumSales: 0.6, // 골든디스크는 음반 파워가 가장 크게 작동해야 한다.
      votes: 0.1, // 팬 투표는 보조 지표로만 쓴다.
      judges: 0.1, // 심사 비중도 제한적으로 둔다.
    },
    description: "음반 판매량 비중이 높은 시상식",
  },
};
