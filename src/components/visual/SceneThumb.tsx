import type { ReactNode } from "react";
import {
  SCENE_ART,
  SCENE_IMAGE_KEYS,
  sceneImagePath,
  type SceneKey,
} from "@/data/sceneArt";
import { assetUrl } from "@/utils/assets";

type SceneThumbVariant = "banner" | "wide" | "thumb" | "chip";

const VARIANT_CLASSES: Record<SceneThumbVariant, string> = {
  /** 모달·리포트 상단을 가로지르는 헤더 배너. */
  banner: "h-24 w-full rounded-2xl sm:h-28",
  /** 카드 안에 들어가는 16:9 미리보기. */
  wide: "aspect-video w-full rounded-xl",
  /** 리스트 항목 옆 정사각 썸네일. */
  thumb: "size-14 rounded-xl",
  /** 한 줄 목록용 소형 아이콘 타일. */
  chip: "size-9 rounded-lg",
};

interface SceneThumbProps {
  scene: SceneKey;
  variant?: SceneThumbVariant;
  /** banner/wide에서 좌하단에 겹칠 라벨. 기본은 씬 라벨, null이면 숨김. */
  label?: string | null;
  className?: string;
  children?: ReactNode;
}

/**
 * 씬 썸네일 — 사건·활동·장소에 시각적 얼굴을 붙인다.
 * 전용 일러스트(`SCENE_IMAGE_KEYS` 등록)가 있으면 그 이미지를,
 * 없으면 씬 팔레트 기반의 절차적 플레이스홀더(그라디언트+스캔라인+아이콘)를 그린다.
 */
export function SceneThumb({
  scene,
  variant = "thumb",
  label,
  className = "",
  children,
}: SceneThumbProps) {
  const art = SCENE_ART[scene];
  const Icon = art.icon;
  const hasImage = SCENE_IMAGE_KEYS.has(scene);
  const isLarge = variant === "banner" || variant === "wide";
  const resolvedLabel = label === null ? null : (label ?? art.label);

  return (
    <span
      aria-hidden="true"
      className={[
        "relative block shrink-0 select-none overflow-hidden shadow-[var(--shadow-surface)]",
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
      style={
        hasImage
          ? undefined
          : {
              backgroundImage: `radial-gradient(circle at 82% 18%, ${art.to}55, transparent 52%), linear-gradient(135deg, ${art.from} 0%, ${art.to} 130%)`,
            }
      }
    >
      {hasImage ? (
        <img
          src={assetUrl(sceneImagePath(scene))}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          {/* 스캔라인 — 방송 화면 질감의 절차적 대체 텍스처 */}
          <span
            className="absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(2,6,23,0.5) 0px, rgba(2,6,23,0.5) 1px, transparent 1px, transparent 4px)",
            }}
          />
          {isLarge ? (
            <Icon
              className="absolute -right-3 -top-3 size-20 opacity-25 sm:size-24"
              style={{ color: art.accent }}
              strokeWidth={1.4}
            />
          ) : null}
          <span className="absolute inset-0 grid place-items-center">
            <Icon
              className={isLarge ? "size-9 drop-shadow" : variant === "chip" ? "size-4" : "size-6"}
              style={{ color: art.accent }}
              strokeWidth={isLarge ? 1.8 : 2}
            />
          </span>
        </>
      )}

      {isLarge && resolvedLabel ? (
        <span className="absolute bottom-2 left-2.5 rounded-md bg-slate-950/62 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white/92 backdrop-blur-sm">
          {resolvedLabel}
        </span>
      ) : null}
      {children}
    </span>
  );
}
