import {
  Award,
  BedDouble,
  Building2,
  Camera,
  Clapperboard,
  Coins,
  Disc3,
  Dumbbell,
  Flame,
  Globe,
  Handshake,
  HeartPulse,
  Landmark,
  Megaphone,
  MessageCircle,
  Mic,
  Music,
  Newspaper,
  PartyPopper,
  Plane,
  Radio,
  Rocket,
  Sparkles,
  Stethoscope,
  Swords,
  TrendingUp,
  Trophy,
  Tv,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

/**
 * 씬 아트 레지스트리 — 게임 속 모든 사건·활동에 시각적 얼굴을 붙이는 단일 소스.
 *
 * 전용 일러스트가 준비되면 `public/images/game/scenes/{key}.png`(16:9, @2x 권장)로
 * 저장하고 아래 `SCENE_IMAGE_KEYS`에 키를 추가하면 SceneThumb가 자동으로
 * 절차적 플레이스홀더 대신 그 이미지를 보여준다.
 */
export type SceneKey =
  | "practice"
  | "lesson"
  | "recording"
  | "stage"
  | "musicShow"
  | "showcase"
  | "concert"
  | "variety"
  | "youtube"
  | "liveBroadcast"
  | "pictorial"
  | "fanSign"
  | "fanMeeting"
  | "fanCafe"
  | "dorm"
  | "vacation"
  | "hospital"
  | "counseling"
  | "office"
  | "meeting"
  | "investor"
  | "finance"
  | "marketing"
  | "chart"
  | "news"
  | "rival"
  | "award"
  | "global"
  | "scandal"
  | "conflict"
  | "debut"
  | "comeback"
  | "musicVideo"
  | "trophy";

export interface SceneArt {
  label: string;
  icon: LucideIcon;
  /** 절차적 플레이스홀더의 그라디언트 색 (어두운 톤 → 밝은 톤). */
  from: string;
  to: string;
  /** 아이콘/포인트 색. */
  accent: string;
}

/** 전용 일러스트 파일이 실제로 존재하는 씬 키. 에셋 추가 시 여기에 등록한다. */
export const SCENE_IMAGE_KEYS: ReadonlySet<SceneKey> = new Set<SceneKey>([
  "practice",
  "dorm",
  "office",
  "meeting",
  "hospital",
  "fanCafe",
]);

export function sceneImagePath(key: SceneKey): string {
  return `/game/scenes/${key}.png`;
}

export const SCENE_ART: Record<SceneKey, SceneArt> = {
  practice: {
    label: "합동 연습",
    icon: Dumbbell,
    from: "#1e1b4b",
    to: "#4338ca",
    accent: "#a5b4fc",
  },
  lesson: {
    label: "개인 레슨",
    icon: Mic,
    from: "#312e81",
    to: "#6d28d9",
    accent: "#c4b5fd",
  },
  recording: {
    label: "녹음실",
    icon: Music,
    from: "#3b0764",
    to: "#7e22ce",
    accent: "#d8b4fe",
  },
  stage: {
    label: "무대",
    icon: Sparkles,
    from: "#500724",
    to: "#be185d",
    accent: "#f9a8d4",
  },
  musicShow: {
    label: "음악방송",
    icon: Tv,
    from: "#4a044e",
    to: "#a21caf",
    accent: "#f0abfc",
  },
  showcase: {
    label: "쇼케이스",
    icon: Clapperboard,
    from: "#431407",
    to: "#c2410c",
    accent: "#fdba74",
  },
  concert: {
    label: "콘서트",
    icon: PartyPopper,
    from: "#500724",
    to: "#db2777",
    accent: "#fbcfe8",
  },
  variety: {
    label: "예능 출연",
    icon: Video,
    from: "#052e16",
    to: "#15803d",
    accent: "#86efac",
  },
  youtube: {
    label: "자체 콘텐츠",
    icon: Camera,
    from: "#450a0a",
    to: "#b91c1c",
    accent: "#fca5a5",
  },
  liveBroadcast: {
    label: "라이브 방송",
    icon: Radio,
    from: "#164e63",
    to: "#0891b2",
    accent: "#67e8f9",
  },
  pictorial: {
    label: "화보 촬영",
    icon: Camera,
    from: "#292524",
    to: "#78716c",
    accent: "#e7e5e4",
  },
  fanSign: {
    label: "팬사인회",
    icon: MessageCircle,
    from: "#500724",
    to: "#e11d48",
    accent: "#fda4af",
  },
  fanMeeting: {
    label: "팬미팅",
    icon: Users,
    from: "#4c0519",
    to: "#be123c",
    accent: "#fecdd3",
  },
  fanCafe: {
    label: "팬 커뮤니티",
    icon: MessageCircle,
    from: "#0c4a6e",
    to: "#0284c7",
    accent: "#bae6fd",
  },
  dorm: {
    label: "숙소 휴식",
    icon: BedDouble,
    from: "#292524",
    to: "#57534e",
    accent: "#d6d3d1",
  },
  vacation: {
    label: "휴가",
    icon: Plane,
    from: "#083344",
    to: "#0e7490",
    accent: "#a5f3fc",
  },
  hospital: {
    label: "치료·회복",
    icon: Stethoscope,
    from: "#450a0a",
    to: "#dc2626",
    accent: "#fecaca",
  },
  counseling: {
    label: "상담",
    icon: HeartPulse,
    from: "#134e4a",
    to: "#0f766e",
    accent: "#99f6e4",
  },
  office: {
    label: "사무실",
    icon: Building2,
    from: "#134e4a",
    to: "#115e59",
    accent: "#5eead4",
  },
  meeting: {
    label: "계약 미팅",
    icon: Handshake,
    from: "#1e3a5f",
    to: "#1d4ed8",
    accent: "#93c5fd",
  },
  investor: {
    label: "투자사",
    icon: Landmark,
    from: "#1e3a5f",
    to: "#3730a3",
    accent: "#a5b4fc",
  },
  finance: {
    label: "재정",
    icon: Coins,
    from: "#422006",
    to: "#a16207",
    accent: "#fde047",
  },
  marketing: {
    label: "마케팅",
    icon: Megaphone,
    from: "#431407",
    to: "#ea580c",
    accent: "#fed7aa",
  },
  chart: {
    label: "차트",
    icon: TrendingUp,
    from: "#042f2e",
    to: "#0d9488",
    accent: "#5eead4",
  },
  news: {
    label: "K-POP 뉴스",
    icon: Newspaper,
    from: "#1e293b",
    to: "#475569",
    accent: "#cbd5e1",
  },
  rival: {
    label: "경쟁 그룹",
    icon: Swords,
    from: "#3b0764",
    to: "#9333ea",
    accent: "#d8b4fe",
  },
  award: {
    label: "시상식",
    icon: Award,
    from: "#422006",
    to: "#b45309",
    accent: "#fcd34d",
  },
  global: {
    label: "해외 활동",
    icon: Globe,
    from: "#082f49",
    to: "#0369a1",
    accent: "#7dd3fc",
  },
  scandal: {
    label: "구설·논란",
    icon: Flame,
    from: "#450a0a",
    to: "#991b1b",
    accent: "#fca5a5",
  },
  conflict: {
    label: "멤버 갈등",
    icon: Swords,
    from: "#431407",
    to: "#9a3412",
    accent: "#fdba74",
  },
  debut: {
    label: "데뷔",
    icon: Rocket,
    from: "#500724",
    to: "#c026d3",
    accent: "#f5d0fe",
  },
  comeback: {
    label: "컴백",
    icon: Disc3,
    from: "#2e1065",
    to: "#7c3aed",
    accent: "#ddd6fe",
  },
  musicVideo: {
    label: "뮤직비디오 촬영",
    icon: Clapperboard,
    from: "#2e1065",
    to: "#a21caf",
    accent: "#f0abfc",
  },
  trophy: {
    label: "1위 트로피",
    icon: Trophy,
    from: "#422006",
    to: "#ca8a04",
    accent: "#fde68a",
  },
};
