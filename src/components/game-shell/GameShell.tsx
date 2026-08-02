import type { ReactNode } from "react";
import { BottomNav, type GameSection } from "@/components/game-shell/BottomNav";

interface GameShellProps {
  activeSection: GameSection;
  onSectionChange: (section: GameSection) => void;
  weekBadge?: number;
  topStatus: ReactNode;
  overviewBar: ReactNode;
  children: ReactNode;
  world: ReactNode;
  commandPanel?: ReactNode;
  actionDock?: ReactNode;
}

export function GameShell({
  activeSection,
  onSectionChange,
  weekBadge,
  topStatus,
  overviewBar,
  children,
  world,
  commandPanel,
  actionDock,
}: GameShellProps) {
  return (
    <main className="mx-auto flex h-dvh w-full max-w-[1200px] flex-col overflow-hidden bg-surface-shell pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-text-primary shadow-[0_0_80px_rgba(2,6,23,0.72)] lg:h-[min(900px,100dvh)] lg:border-x lg:border-white/8">
      {topStatus}
      <div
        className={
          activeSection === "week"
            ? "contents"
            : "hidden lg:contents"
        }
      >
        {overviewBar}
      </div>
      <BottomNav
        selectedKey={activeSection}
        onSelectionChange={onSectionChange}
        weekBadge={weekBadge}
      >
        <div
          className={[
            // commandPanel이 없으면 데스크톱에서도 flex-col을 유지한다 —
            // block으로 바꾸면 자식 section의 flex-1이 무효가 되어 높이가
            // 0으로 붕괴해 이번 주 화면이 빈 화면이 된다.
            "flex h-full min-h-0 flex-col",
            commandPanel
              ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]"
              : "",
          ].join(" ")}
        >
          <section className="relative min-h-0 flex-1 overflow-hidden bg-surface-world">
            <div
              aria-hidden={activeSection !== "company"}
              className={[
                "absolute inset-0 transition-opacity duration-[var(--motion-state)] ease-out",
                activeSection === "company"
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0",
              ].join(" ")}
            >
              {world}
            </div>
            <div
              className={[
                "relative h-full min-h-0",
                activeSection === "company" ? "pointer-events-none" : "z-10",
              ].join(" ")}
            >
              {children}
            </div>
          </section>
          {commandPanel ? (
            <aside className="hidden min-h-0 overflow-y-auto border-l border-white/8 bg-surface-shell p-4 lg:block">
              {commandPanel}
            </aside>
          ) : null}
          {actionDock ? (
            <div className="shrink-0 lg:hidden">{actionDock}</div>
          ) : null}
        </div>
      </BottomNav>
    </main>
  );
}
