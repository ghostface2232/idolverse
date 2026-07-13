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

  for (const [key, value] of Object.entries(effects) as [
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
