import type { ConceptMood, ConceptSynergyGrade, Genre, Season } from "@/types/game";

export const GENRE_DATA: Record<
  Genre,
  { label: string; description: string; hidden?: boolean }
> = {
  dancePop: {
    label: "댄스팝",
    description: "대중성과 퍼포먼스를 동시에 노리는 메인스트림. 실패 확률이 가장 낮습니다.",
  },
  ballad: {
    label: "발라드",
    description: "보컬이 받쳐주지 않으면 바로 티가 납니다. 감정선이 잡히면 오래갑니다.",
  },
  hiphop: {
    label: "힙합",
    description: "태도로 승부합니다. 다크·걸크러시 컨셉과 만났을 때 폭발력이 큽니다.",
  },
  rnb: {
    label: "R&B",
    description: "그루브와 보컬 톤으로 취향을 저격합니다. 시크한 무드와 잘 붙습니다.",
  },
  rock: {
    label: "록",
    description: "밴드 사운드와 라이브 에너지가 생명입니다. 무대 체력이 뒷받침돼야 합니다.",
  },
  edm: {
    label: "EDM",
    description: "드롭 한 방으로 페스티벌 무대를 가져옵니다. 여름 시즌에 특히 강합니다.",
  },
  cityPop: {
    label: "시티팝",
    description: "복고와 도시의 밤 감성. 레트로 컨셉과 만나면 명반 소리를 듣습니다.",
  },
  trot: {
    label: "트로트",
    description: "평소엔 안 팔리지만 특정 무대에서 판을 뒤집는 장르입니다.",
    hidden: true,
  },
};

export const CONCEPT_MOOD_DATA: Record<
  ConceptMood,
  { label: string; description: string }
> = {
  refreshing: {
    label: "청량",
    description: "밝고 시원한 에너지. 봄·여름 시즌에 가장 크게 터집니다.",
  },
  dark: {
    label: "다크",
    description: "긴장감과 서사로 끌고 갑니다. 힙합·록과 붙었을 때 설득력이 삽니다.",
  },
  retro: {
    label: "레트로",
    description: "향수를 자극하는 복고 감성. 시티팝과 만나면 최고의 궁합입니다.",
  },
  girlCrush: {
    label: "걸크러시",
    description: "무대의 주도권을 쥐는 강한 존재감. 힙합과 만났을 때 폭발합니다.",
  },
  cute: {
    label: "큐트",
    description: "친근함과 캐릭터로 파고듭니다. 댄스팝 위에서 가장 안정적입니다.",
  },
  sophisticated: {
    label: "시크",
    description: "도회적이고 스타일리시한 이미지. R&B·시티팝의 결을 살립니다.",
  },
  powerful: {
    label: "파워풀",
    description: "퍼포먼스 강도로 압도합니다. EDM·록 무대에서 진가가 드러납니다.",
  },
  dreamy: {
    label: "몽환",
    description: "현실감을 지우고 분위기로 끌고 갑니다. 발라드와 만나면 깊어집니다.",
  },
  y2k: {
    label: "Y2K",
    description: "회전이 빠른 복고-패션 트렌드. 댄스팝과 붙으면 바이럴을 노립니다.",
  },
  sexy: {
    label: "섹시",
    description: "성숙한 긴장감을 전면에 내세웁니다. 호불호는 갈리지만 각인은 확실합니다.",
  },
};

export const GENRES = Object.keys(GENRE_DATA) as Genre[];
export const CONCEPT_MOODS = Object.keys(CONCEPT_MOOD_DATA) as ConceptMood[];

export const CONCEPT_SYNERGY_TABLE: Record<
  Genre,
  Record<ConceptMood, ConceptSynergyGrade>
> = {
  dancePop: {
    refreshing: "A",
    dark: "B",
    retro: "A",
    girlCrush: "B",
    cute: "A",
    sophisticated: "B",
    powerful: "B",
    dreamy: "B",
    y2k: "S",
    sexy: "C",
  },
  ballad: {
    refreshing: "C",
    dark: "B",
    retro: "B",
    girlCrush: "D",
    cute: "C",
    sophisticated: "A",
    powerful: "C",
    dreamy: "S",
    y2k: "D",
    sexy: "B",
  },
  hiphop: {
    refreshing: "D",
    dark: "A",
    retro: "B",
    girlCrush: "S",
    cute: "D",
    sophisticated: "B",
    powerful: "A",
    dreamy: "C",
    y2k: "B",
    sexy: "A",
  },
  rnb: {
    refreshing: "C",
    dark: "A",
    retro: "B",
    girlCrush: "B",
    cute: "D",
    sophisticated: "S",
    powerful: "B",
    dreamy: "A",
    y2k: "B",
    sexy: "A",
  },
  rock: {
    refreshing: "C",
    dark: "A",
    retro: "B",
    girlCrush: "B",
    cute: "D",
    sophisticated: "C",
    powerful: "S",
    dreamy: "C",
    y2k: "D",
    sexy: "B",
  },
  edm: {
    refreshing: "A",
    dark: "B",
    retro: "C",
    girlCrush: "A",
    cute: "B",
    sophisticated: "B",
    powerful: "S",
    dreamy: "B",
    y2k: "A",
    sexy: "B",
  },
  cityPop: {
    refreshing: "B",
    dark: "C",
    retro: "S",
    girlCrush: "D",
    cute: "B",
    sophisticated: "A",
    powerful: "D",
    dreamy: "A",
    y2k: "A",
    sexy: "B",
  },
  trot: {
    refreshing: "B",
    dark: "D",
    retro: "A",
    girlCrush: "C",
    cute: "A",
    sophisticated: "C",
    powerful: "B",
    dreamy: "C",
    y2k: "D",
    sexy: "C",
  },
};

export const SEASON_MOOD_FIT: Record<Season, Record<ConceptMood, number>> = {
  spring: {
    refreshing: 10, // Spring should reward clean, uplifting concepts immediately.
    dark: -5, // Heavy darkness underperforms when the market wants freshness.
    retro: 4, // Retro can ride nostalgic festival-season anticipation.
    girlCrush: -1, // Strong concepts work, but do not get seasonal tailwinds.
    cute: 8, // Cute concepts traditionally perform well in debut-heavy spring windows.
    sophisticated: 2, // Polished concepts are viable but not peak seasonal plays.
    powerful: -2, // Full-force intensity is slightly mistimed before summer stages.
    dreamy: 6, // Soft, emotional spring releases should feel naturally aligned.
    y2k: 7, // Trendy nostalgia remains strong in fashion-forward spring cycles.
    sexy: -4, // Mature tension is a harder sell early in the yearly cycle.
  },
  summer: {
    refreshing: 12, // Summer is the prime season for bright, replayable hooks.
    dark: -4, // Dark concepts fight against the seasonal demand curve.
    retro: 3, // Retro stays playable, especially with festival visuals.
    girlCrush: 5, // Confident summer anthems should still hit.
    cute: 4, // Cute is viable, but less explosive than spring.
    sophisticated: 1, // Polished concepts stay neutral in the hottest quarter.
    powerful: 9, // Big performance tracks should spike during festival season.
    dreamy: -2, // Dreamy concepts lose some urgency in peak activity season.
    y2k: 6, // Fast-trend Y2K styling remains highly clickable in summer.
    sexy: 7, // Mature summer concepts can convert strong public attention.
  },
  fall: {
    refreshing: -3, // Brightness starts to lose heat after the summer rush.
    dark: 6, // Darker narrative concepts gain traction entering award season.
    retro: 9, // Retro thrives when the market shifts toward mood and identity.
    girlCrush: 3, // Strong concepts remain reliable, if not peak seasonal winners.
    cute: -2, // Cute concepts face steeper competition in prestige-heavy months.
    sophisticated: 8, // Fall is ideal for elegant and polished styling.
    powerful: 2, // Performance still works, but the market values nuance more.
    dreamy: 7, // Emotional atmosphere has a natural fall advantage.
    y2k: 1, // Y2K remains usable but is less automatic than in spring/summer.
    sexy: 4, // Mature concepts benefit from the more serious fall tone.
  },
  winter: {
    refreshing: -4, // Pure brightness becomes harder to sustain in year-end competition.
    dark: 5, // Dark concepts can stand out in prestige-heavy winter stages.
    retro: 5, // Nostalgia plays well with year-end reflection.
    girlCrush: 1, // Confident concepts hold their ground without huge seasonal help.
    cute: 2, // Cute concepts can work through holiday framing.
    sophisticated: 6, // Premium styling feels strong during awards and gala season.
    powerful: 4, // Big stages make forceful performance concepts viable.
    dreamy: 8, // Winter favors emotional, immersive atmosphere.
    y2k: -1, // Fast-trend styling cools slightly against year-end gravitas.
    sexy: 3, // Mature concepts remain playable, especially with polished visuals.
  },
};
