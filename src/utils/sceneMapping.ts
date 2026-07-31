import type { SceneKey } from "@/data/sceneArt";
import type { GameEvent } from "@/types/game";

/** 이벤트 id의 키워드를 씬으로 번역한다. 위에서부터 먼저 맞는 규칙이 이긴다. */
const EVENT_ID_RULES: readonly [pattern: RegExp, scene: SceneKey][] = [
  // 구체 규칙 먼저 — 일반 규칙(debut/comeback 등)에 삼켜지지 않게 한다.
  [/-mv-/, "musicVideo"],
  [/choreo-leak/, "scandal"],
  [/part-dispute/, "conflict"],
  [/stage-mishap/, "stage"],
  [/fancam|cover-song/, "youtube"],
  [/practice-room-livestream|sns-qna/, "liveBroadcast"],
  [/practice-room|equipment|observation|evaluation-upset/, "practice"],
  [/dorm/, "dorm"],
  [/senior-group|mental-slump/, "counseling"],
  [/fan-art|fan-gift/, "fanCafe"],
  [/festival/, "concert"],
  [/broadcast-slot/, "musicShow"],
  [/staff-wedding/, "meeting"],
  [/showcase|promotion-launch|rehearsal/, "showcase"],
  [/debut-title|song-candidates|composer|recording|ost/, "recording"],
  [/debut-concept|concept-research|concept-test/, "comeback"],
  [/debut-position|position-evaluation|unit-chemistry|personal-strength|hidden-talent/, "practice"],
  [/debut-rival|rival-arrival|rival-comeback|rival-fan/, "rival"],
  [/debut-public|public-evaluation|teaser|expectation/, "marketing"],
  [/debut/, "debut"],
  [/comeback|choreo/, "comeback"],
  [/chart/, "chart"],
  [/viral|challenge|performance-cut/, "youtube"],
  [/variety|reality-show|tv-audition/, "variety"],
  [/fan-touching|fan-sign|fandom-split|fan-/, "fanSign"],
  [/brand-ad|advertising/, "pictorial"],
  [/collaboration/, "recording"],
  [/overseas|global/, "global"],
  [/injury|health/, "hospital"],
  [/scandal|rumor|sasaeng|controversy/, "scandal"],
  [/conflict/, "conflict"],
  [/staff-poaching|staff/, "office"],
  [/investor|financing|financial/, "investor"],
  [/award/, "award"],
  [/music-show/, "musicShow"],
];

export function sceneForEvent(event: Pick<GameEvent, "id" | "tone">): SceneKey {
  for (const [pattern, scene] of EVENT_ID_RULES) {
    if (pattern.test(event.id)) return scene;
  }
  if (event.tone === "negative") return "scandal";
  if (event.tone === "positive") return "stage";
  return "news";
}

/** 주간 결정 카드의 category 라벨을 씬으로 번역한다. */
const DECISION_CATEGORY_SCENES: Record<string, SceneKey> = {
  계약: "meeting",
  부상: "hospital",
  불화: "conflict",
  투자사: "investor",
  경영: "office",
  팬덤: "fanCafe",
  "장기 성장": "chart",
  멤버: "counseling",
  과로: "dorm",
  "예능 섭외": "variety",
  "광고 제안": "pictorial",
  콜라보: "recording",
  바이럴: "youtube",
  "라이벌 대응": "rival",
};

export function sceneForDecisionCategory(category: string): SceneKey {
  return DECISION_CATEGORY_SCENES[category] ?? "office";
}
