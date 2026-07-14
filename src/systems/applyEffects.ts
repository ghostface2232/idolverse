import type { Album, EffectKey, EffectMap, Trainee } from "@/types/game";
import type { Fandom4Axis } from "@/systems/fandomSystem";

/**
 * 효과가 적용되는 모든 게임 상태의 단면.
 * weekProcessor의 로컬 작업 변수와 weekRunner의 스냅샷 양쪽에서 조립해 쓴다.
 */
export interface EffectTargets {
  money: number;
  fandom: Fandom4Axis;
  trainees: Trainee[];
  album: Album | null;
  investorPenaltyActive: boolean;
}

/**
 * 키 개명 이전(v0 세이브)의 effects가 pendingEvents/weeklyDecisions에
 * 직렬화된 채 남아 있을 수 있다. 역직렬화는 저장된 JSON을 그대로 캐스트하므로
 * 적용 시점에 구 키를 정규 키로 변환해 하위 호환을 보장한다.
 */
const LEGACY_EFFECT_KEY_ALIASES: Record<string, EffectKey> = {
  song: "albumSong",
  choreography: "albumChoreography",
  marketing: "albumMarketing",
  album_song: "albumSong",
  album_marketing: "albumMarketing",
  trainee_vocal: "vocal",
  trainee_dance: "dance",
  trainee_stress: "stress",
  fandom_loyalty: "fandomLoyalty",
  fandom_disappointment: "fandomDisappointment",
};

/**
 * applyEffects가 실제로 처리하는 키의 전체 집합.
 * 데이터 파일의 effects 키가 이 집합에 포함되는지 검증하는
 * 계약 테스트(effectKeyContract.test.ts)의 기준으로도 쓰인다.
 */
export const EFFECT_KEY_SET: ReadonlySet<string> = new Set([
  "money",
  "public",
  "fandom",
  "fandomLoyalty",
  "fandomDisappointment",
  "global",
  "industry",
  "investorPressure",
  "condition",
  "stress",
  "satisfaction",
  "chemistry",
  "visual",
  "vocal",
  "dance",
  "charm",
  "stamina",
  "mental",
  "albumSong",
  "albumChoreography",
  "albumVisual",
  "albumMarketing",
] satisfies EffectKey[]);

/**
 * 신뢰할 수 없는(세이브 등) 효과 맵을 정규 EffectMap으로 변환한다.
 * 구 키는 별칭 표로 치환하고, 그 밖의 알 수 없는 키는 크래시 대신
 * 경고 후 무시한다(개명 이전의 무음-소실 동작과 동일하되 가시화).
 */
export function normalizeEffectMap(
  effects: Record<string, number>,
): EffectMap {
  const normalized: EffectMap = {};

  for (const [rawKey, value] of Object.entries(effects)) {
    let key: EffectKey | null = null;

    if (EFFECT_KEY_SET.has(rawKey)) {
      key = rawKey as EffectKey;
    } else if (rawKey in LEGACY_EFFECT_KEY_ALIASES) {
      key = LEGACY_EFFECT_KEY_ALIASES[rawKey];
    } else if (rawKey === "trainee_specialist") {
      // 구 키 전용 특례: 전문 역량 강화를 보컬/댄스 분할로 근사
      const half = Math.floor(value / 2);
      normalized.vocal = (normalized.vocal ?? 0) + half;
      normalized.dance = (normalized.dance ?? 0) + half;
      continue;
    }

    if (key === null) {
      console.warn(`[applyEffects] 알 수 없는 효과 키 무시: ${rawKey}`);
      continue;
    }

    normalized[key] = (normalized[key] ?? 0) + value;
  }

  return normalized;
}

/**
 * EffectMap을 게임 상태에 적용하는 유일한 구현.
 * 새 EffectKey를 추가하면 아래 switch가 exhaustive 체크로 컴파일 에러를 내므로
 * "키는 있는데 적용 규칙이 없는" 상태가 될 수 없다.
 */
export function applyEffects(
  targets: EffectTargets,
  effects: EffectMap,
): EffectTargets {
  let money = targets.money;
  let investorPenaltyActive = targets.investorPenaltyActive;
  const fandom = { ...targets.fandom };
  let trainees = targets.trainees;
  let album = targets.album;

  // 세이브에서 복원된 데이터는 타입 계약을 우회하므로 항상 정규화를 거친다.
  const normalized = normalizeEffectMap(effects as Record<string, number>);

  for (const [key, value] of Object.entries(normalized) as [
    EffectKey,
    number,
  ][]) {
    switch (key) {
      case "money":
        money += value;
        break;
      case "public":
        fandom.public = clamp(fandom.public + value, 0, 100);
        break;
      case "fandom":
        fandom.fandom = Math.max(0, fandom.fandom + value);
        break;
      case "fandomLoyalty":
        fandom.fandomLoyalty = clamp(fandom.fandomLoyalty + value, 0, 100);
        break;
      case "fandomDisappointment":
        fandom.fandomDisappointment = clamp(
          fandom.fandomDisappointment + value,
          0,
          100,
        );
        break;
      case "global":
        fandom.global = Math.max(0, fandom.global + value);
        break;
      case "industry":
        fandom.industry = clamp(fandom.industry + value, 0, 100);
        break;
      case "investorPressure":
        investorPenaltyActive = value > 0;
        break;
      case "condition":
      case "stress":
      case "satisfaction":
        trainees = trainees.map((t) => ({
          ...t,
          [key]: clamp(t[key] + value, 0, 100),
        }));
        break;
      case "chemistry":
        trainees = trainees.map((t) => ({
          ...t,
          chemistry: Object.fromEntries(
            Object.entries(t.chemistry).map(([targetId, chemistry]) => [
              targetId,
              clamp(chemistry + value, -100, 100),
            ]),
          ),
        }));
        break;
      case "visual":
      case "vocal":
      case "dance":
      case "charm":
      case "stamina":
      case "mental":
        trainees = trainees.map((t) => ({
          ...t,
          stats: {
            ...t.stats,
            [key]: clamp(t.stats[key] + value, 0, 100),
          },
        }));
        break;
      case "albumSong":
        album = withAlbumProgress(album, "song", value);
        break;
      case "albumChoreography":
        album = withAlbumProgress(album, "choreography", value);
        break;
      case "albumVisual":
        album = withAlbumProgress(album, "visual", value);
        break;
      case "albumMarketing":
        album = withAlbumProgress(album, "marketing", value);
        break;
      default: {
        const unhandled: never = key;
        throw new Error(`Unhandled effect key: ${String(unhandled)}`);
      }
    }
  }

  return { money, fandom, trainees, album, investorPenaltyActive };
}

function withAlbumProgress(
  album: Album | null,
  field: keyof Album["progress"],
  value: number,
): Album | null {
  if (!album) return null;
  return {
    ...album,
    progress: {
      ...album.progress,
      [field]: clamp(album.progress[field] + value, 0, 100),
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
