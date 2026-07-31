export type GroupBadgeSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<GroupBadgeSize, string> = {
  sm: "size-8 rounded-lg text-[11px]",
  md: "size-10 rounded-xl text-xs",
  lg: "size-14 rounded-2xl text-base",
};

/** 그룹명에서 항상 같은 색이 나오도록 이름을 색상 각도로 해시한다. */
function hueForName(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 360;
}

function initialsForName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  // 라틴 이름은 두 글자, 한글 이름은 첫 글자만으로도 식별이 된다.
  const isLatin = /^[A-Za-z0-9]/.test(trimmed);
  return isLatin ? trimmed.slice(0, 2).toUpperCase() : trimmed.slice(0, 1);
}

interface GroupBadgeProps {
  name: string;
  size?: GroupBadgeSize;
  className?: string;
}

/**
 * 경쟁 그룹 로고 배지 — 그룹명 해시로 고유 색을 뽑아 이니셜 로고를 그린다.
 * 같은 그룹은 어느 화면에서든 같은 색·같은 로고로 보인다.
 */
export function GroupBadge({ name, size = "md", className = "" }: GroupBadgeProps) {
  const hue = hueForName(name);

  return (
    <span
      aria-hidden="true"
      className={[
        "grid shrink-0 select-none place-items-center font-bold tracking-tight text-white/92 shadow-[var(--shadow-surface)]",
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 55% 30%) 0%, hsl(${(hue + 40) % 360} 62% 45%) 100%)`,
      }}
    >
      {initialsForName(name)}
    </span>
  );
}
