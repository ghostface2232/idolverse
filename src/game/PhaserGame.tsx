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

    const renderWidth = SIMULATION_WORLD.width * SIMULATION_WORLD.renderScale;
    const renderHeight = SIMULATION_WORLD.height * SIMULATION_WORLD.renderScale;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: renderWidth,
      height: renderHeight,
      backgroundColor: "#020617",
      // 멤버 시트가 256x448 고해상 원본이라 NEAREST 축소는 화질을 뭉갠다.
      // 3배 백킹스토어 + LINEAR 필터로 DOM UI와 같은 선명도를 낸다.
      pixelArt: false,
      antialias: true,
      roundPixels: false,
      scale: {
        // 월드 좌표는 360x420으로 고정하고 기기별 차이는 FIT viewport로 흡수.
        // 백킹스토어만 renderScale 배로 키우고 카메라 줌으로 좌표를 되돌린다.
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: renderWidth,
        height: renderHeight,
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
