import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { GAME_BALANCE } from "@/data/gameBalance";
import { BootScene } from "@/game/scenes/BootScene";
import { SimulationScene } from "@/game/scenes/SimulationScene";

interface PhaserGameProps {
  className?: string;
}

export function PhaserGame({ className = "" }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: GAME_BALANCE.baseWidth,
      height: GAME_BALANCE.baseHeight,
      transparent: true,
      backgroundColor: "#00000000",
      pixelArt: true,
      antialias: false,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_BALANCE.baseWidth,
        height: GAME_BALANCE.baseHeight,
      },
      scene: [BootScene, SimulationScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`phaser-container h-full w-full ${className}`.trim()}
    />
  );
}

