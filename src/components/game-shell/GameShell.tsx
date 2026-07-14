import type { ReactNode } from "react";
import { BottomNav, type GameSection } from "@/components/game-shell/BottomNav";

interface GameShellProps {
  activeSection: GameSection;
  onSectionChange: (section: GameSection) => void;
  topStatus: ReactNode;
  goalStrip: ReactNode;
  children: ReactNode;
  commandPanel?: ReactNode;
  actionDock?: ReactNode;
}

export function GameShell({
  activeSection,
  onSectionChange,
  topStatus,
  goalStrip,
  children,
  commandPanel,
  actionDock,
}: GameShellProps) {
  return (
    <main className="mx-auto flex h-dvh w-full max-w-[1200px] flex-col overflow-hidden bg-surface-shell pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-text-primary shadow-[0_0_80px_rgba(2,6,23,0.72)] lg:h-[min(900px,100dvh)] lg:border-x lg:border-white/8">
      {topStatus}
      {goalStrip}
      <BottomNav selectedKey={activeSection} onSelectionChange={onSectionChange}>
        <div
          className={[
            "flex h-full min-h-0 flex-col",
            commandPanel
              ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]"
              : "lg:block",
          ].join(" ")}
        >
          <section className="relative min-h-0 flex-1 overflow-hidden bg-surface-world">
            {children}
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
