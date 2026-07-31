import type { ReactNode } from "react";

type SpeakerTone = "default" | "accent" | "warning";

const TONE_CLASSES: Record<SpeakerTone, string> = {
  default: "bg-surface-raised/80",
  accent: "bg-action-secondary/[0.1] shadow-[inset_0_0_0_1px_rgba(6,182,212,0.2)]",
  warning: "bg-state-warning/[0.08] shadow-[inset_0_0_0_1px_rgba(251,191,36,0.22)]",
};

interface SpeakerBubbleProps {
  /** MemberPortrait 또는 StaffPortrait 노드. */
  portrait: ReactNode;
  name: string;
  role?: string;
  tone?: SpeakerTone;
  children: ReactNode;
  className?: string;
}

/**
 * 대화 연출의 기본 단위 — 초상화 + 이름표 + 말풍선.
 * 매니저 브리핑, 멤버 반응, 이벤트 대사에 공통으로 쓴다.
 */
export function SpeakerBubble({
  portrait,
  name,
  role,
  tone = "default",
  children,
  className = "",
}: SpeakerBubbleProps) {
  return (
    <div className={["flex items-start gap-2.5", className].join(" ")}>
      {portrait}
      <div className="relative min-w-0 flex-1">
        <div className={["relative rounded-2xl rounded-tl-sm px-3.5 py-3", TONE_CLASSES[tone]].join(" ")}>
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
            <span className="font-semibold text-text-primary">{name}</span>
            {role ? <span className="text-[11px] text-text-muted">{role}</span> : null}
          </p>
          <div className="mt-1 text-pretty text-sm leading-6 text-text-secondary [word-break:keep-all]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
