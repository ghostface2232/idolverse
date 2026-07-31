export type AlbumArtSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<AlbumArtSize, string> = {
  sm: "size-10 rounded-lg text-sm",
  md: "size-14 rounded-xl text-lg",
  lg: "size-20 rounded-2xl text-2xl",
  xl: "size-28 rounded-2xl text-3xl",
};

function hashText(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

interface AlbumArtProps {
  title: string;
  size?: AlbumArtSize;
  className?: string;
}

/**
 * 절차적 앨범 커버 — 제목 해시에서 고유한 색을 뽑아 비닐 레코드 느낌의
 * 커버를 그린다. 같은 앨범은 어디서든 같은 커버로 보인다.
 * 전용 커버 아트 시스템이 생기면 이 컴포넌트만 교체하면 된다.
 */
export function AlbumArt({ title, size = "md", className = "" }: AlbumArtProps) {
  const hash = hashText(title);
  const hue = hash % 360;
  const hue2 = (hue + 60 + (hash % 90)) % 360;
  const initial = title.trim().slice(0, 1).toUpperCase() || "♪";

  return (
    <span
      aria-hidden="true"
      className={[
        "relative grid shrink-0 select-none place-items-center overflow-hidden font-black tracking-tight text-white/90 shadow-[var(--shadow-surface)]",
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
      style={{
        backgroundImage: `radial-gradient(circle at 30% 25%, hsl(${hue2} 70% 55% / 0.85), transparent 55%), linear-gradient(140deg, hsl(${hue} 60% 32%) 0%, hsl(${(hue + 30) % 360} 65% 18%) 100%)`,
      }}
    >
      {/* 비닐 홈 텍스처 */}
      <span
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 78% 78%, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 5px)",
        }}
      />
      <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
        {initial}
      </span>
    </span>
  );
}
