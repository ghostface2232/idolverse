import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { SIMULATION_WORLD } from "@/data/simulationWorld";
import { presentationBus } from "@/game/EventBus";
import { BootScene } from "@/game/scenes/BootScene";
import { SimulationScene } from "@/game/scenes/SimulationScene";

interface PhaserGameProps {
  active: boolean;
  className?: string;
}

export function PhaserGame({ active, className = "" }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const activeRef = useRef(active);

  activeRef.current = active;

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: SIMULATION_WORLD.width,
      height: SIMULATION_WORLD.height,
      backgroundColor: "#020617",
      pixelArt: true,
      antialias: false,
      roundPixels: true,
      scale: {
        // Phase 3 scale spike 결론: 월드 좌표는 360x420으로 고정하고
        // 기기별 차이는 FIT 카메라 viewport로 흡수한다.
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: SIMULATION_WORLD.width,
        height: SIMULATION_WORLD.height,
      },
      scene: [BootScene, SimulationScene],
    });

    const syncActivity = () => {
      const game = gameRef.current;
      if (!game?.isBooted) return;

      const shouldRun = activeRef.current && document.visibilityState === "visible";
      if (shouldRun) {
        game.loop.wake();
        if (game.scene.isSleeping("simulation")) game.scene.wake("simulation");
        if (game.scene.isPaused("simulation")) game.scene.resume("simulation");
      } else if (game.scene.isActive("simulation")) {
        game.scene.sleep("simulation");
        game.loop.sleep();
      }
    };

    const unsubscribeReady = presentationBus.on("sceneReady", syncActivity);
    document.addEventListener("visibilitychange", syncActivity);

    return () => {
      unsubscribeReady();
      document.removeEventListener("visibilitychange", syncActivity);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    if (!game?.isBooted) return;

    if (active && document.visibilityState === "visible") {
      game.loop.wake();
      if (game.scene.isSleeping("simulation")) game.scene.wake("simulation");
      if (game.scene.isPaused("simulation")) game.scene.resume("simulation");
    } else if (game.scene.isActive("simulation")) {
      game.scene.sleep("simulation");
      game.loop.sleep();
    }
  }, [active]);

  return (
    <div
      ref={containerRef}
      className={`phaser-container h-full w-full ${className}`.trim()}
    />
  );
}
