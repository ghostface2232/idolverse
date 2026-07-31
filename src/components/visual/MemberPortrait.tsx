import type { GroupGender } from "@/types/game";
import {
  MEMBER_PORTRAIT_FRAME,
  MEMBER_PORTRAIT_PATHS,
  memberSpriteFrameForId,
  type MemberOutfitId,
} from "@/game/assets/memberSprites";
import { useGameStore } from "@/stores/gameStore";
import { assetUrl } from "@/utils/assets";

export type MemberPortraitSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<MemberPortraitSize, string> = {
  xs: "size-7 rounded-lg",
  sm: "size-9 rounded-xl",
  md: "size-11 rounded-xl",
  lg: "size-16 rounded-2xl",
  xl: "size-24 rounded-3xl",
};

const PORTRAIT_COLUMNS = 5;
const PORTRAIT_ROWS = Math.ceil(MEMBER_PORTRAIT_FRAME.count / PORTRAIT_COLUMNS);

interface MemberPortraitProps {
  traineeId: string;
  /** 미지정 시 현재 캠페인의 그룹 성별을 따른다. */
  gender?: GroupGender;
  outfit?: MemberOutfitId;
  size?: MemberPortraitSize;
  className?: string;
}

/**
 * 멤버 초상화. members-v2 초상화 시트(5×2 그리드, 프레임 256×256)에서
 * 멤버 id 해시로 고정된 외모 프레임을 잘라 보여준다.
 * 같은 멤버는 어느 화면에서든 같은 얼굴이 나온다.
 */
export function MemberPortrait({
  traineeId,
  gender,
  outfit = "trainee",
  size = "md",
  className = "",
}: MemberPortraitProps) {
  const storeGender = useGameStore((state) => state.groupGender);
  const resolvedGender: GroupGender = gender ?? storeGender ?? "female";
  const frame = memberSpriteFrameForId(traineeId);
  const column = frame % PORTRAIT_COLUMNS;
  const row = Math.floor(frame / PORTRAIT_COLUMNS);
  const path = MEMBER_PORTRAIT_PATHS[resolvedGender][outfit];

  return (
    <span
      aria-hidden="true"
      className={[
        "block shrink-0 overflow-hidden bg-surface-shell shadow-[var(--shadow-surface)]",
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
    >
      <span
        className="block h-full w-full"
        style={{
          backgroundImage: `url(${assetUrl(path)})`,
          backgroundSize: `${PORTRAIT_COLUMNS * 100}% ${PORTRAIT_ROWS * 100}%`,
          backgroundPosition: `${
            PORTRAIT_COLUMNS > 1 ? (column / (PORTRAIT_COLUMNS - 1)) * 100 : 0
          }% ${PORTRAIT_ROWS > 1 ? (row / (PORTRAIT_ROWS - 1)) * 100 : 0}%`,
        }}
      />
    </span>
  );
}
