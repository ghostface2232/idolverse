import { UserRound } from "lucide-react";
import { getStaffProfileClassNames } from "@/data/staffProfiles";
import { assetUrl } from "@/utils/assets";

export type StaffPortraitSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<StaffPortraitSize, string> = {
  sm: "size-9 rounded-xl",
  md: "size-11 rounded-xl",
  lg: "size-16 rounded-2xl",
};

interface StaffPortraitProps {
  profileImagePath?: string;
  profileSpriteIndex?: number;
  size?: StaffPortraitSize;
  className?: string;
}

/**
 * 스태프 초상화. 창단 채용 카드에서만 쓰이던 프로필 스프라이트를
 * 인게임 어디서든 재사용할 수 있게 컴포넌트로 뽑았다.
 * 프로필 정보가 없으면 실루엣 아이콘으로 대체한다.
 */
export function StaffPortrait({
  profileImagePath,
  profileSpriteIndex,
  size = "md",
  className = "",
}: StaffPortraitProps) {
  const hasProfile =
    profileImagePath !== undefined && profileSpriteIndex !== undefined;

  if (!hasProfile) {
    return (
      <span
        aria-hidden="true"
        className={[
          "grid shrink-0 place-items-center bg-surface-shell text-text-muted shadow-[var(--shadow-surface)]",
          SIZE_CLASSES[size],
          className,
        ].join(" ")}
      >
        <UserRound className="size-1/2" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={[
        "block shrink-0 overflow-hidden bg-surface-shell shadow-[var(--shadow-surface)]",
        SIZE_CLASSES[size],
        getStaffProfileClassNames(profileSpriteIndex),
        className,
      ].join(" ")}
      style={{ backgroundImage: `url(${assetUrl(profileImagePath)})` }}
    />
  );
}
