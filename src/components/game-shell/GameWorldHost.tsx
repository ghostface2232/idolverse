import { lazy, Suspense, useSyncExternalStore } from "react";
import { Radio } from "lucide-react";
import { SIMULATION_ROOM_LABELS } from "@/data/simulationWorld";
import { simulationProjectionCoordinator } from "@/game/simulation/SimulationProjectionCoordinator";

const LazyPhaserGame = lazy(() =>
  import("@/game/PhaserGame").then((module) => ({ default: module.PhaserGame })),
);

interface GameWorldHostProps {
  active: boolean;
}

/**
 * 게임 세션 동안 한 번만 mount되는 월드 호스트다. 전역 섹션 전환은
 * visibility와 scene sleep만 바꾸며 Phaser.Game 인스턴스는 파괴하지 않는다.
 */
export function GameWorldHost({ active }: GameWorldHostProps) {
  const projection = useSyncExternalStore(
    simulationProjectionCoordinator.subscribe,
    simulationProjectionCoordinator.getSnapshot,
  );
  const externalCount = projection.entities.filter((entity) => !entity.visible).length;

  return (
    <section
      aria-label="회사 활동 현황"
      className="relative h-full min-h-0 overflow-hidden bg-surface-world"
    >
      <Suspense fallback={<WorldLoadingPlaceholder />}>
        <LazyPhaserGame active={active} />
      </Suspense>

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-slate-950/88 px-2.5 py-1.5 text-[10px] font-semibold text-text-secondary shadow-[var(--shadow-surface)]">
        <span className="size-1.5 rounded-full bg-state-success" aria-hidden="true" />
        LIVE · 멤버 {projection.entities.length}명
      </div>

      {externalCount > 0 ? (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-xl bg-slate-950/88 px-2.5 py-1.5 text-[10px] text-pink-200 shadow-[var(--shadow-surface)]">
          <Radio className="size-3" aria-hidden="true" />
          외부 활동 {externalCount}명
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {projection.rooms.map((room) => {
          const count = projection.entities.filter(
            (entity) => entity.visible && entity.roomId === room.id,
          ).length;
          return `${SIMULATION_ROOM_LABELS[room.id]} ${count}명. `;
        })}
        {`${SIMULATION_ROOM_LABELS.external} ${externalCount}명.`}
      </div>
    </section>
  );
}

function WorldLoadingPlaceholder() {
  return (
    <div className="pixel-grid-bg grid h-full place-items-center" role="status">
      <div className="rounded-2xl bg-surface-panel/90 px-4 py-3 text-center shadow-[var(--shadow-surface)]">
        <p className="text-xs font-semibold text-text-primary">사옥을 불러오는 중</p>
        <p className="mt-1 text-[10px] text-text-muted">월드 아트는 임시 그래픽으로 표시됩니다.</p>
      </div>
    </div>
  );
}
