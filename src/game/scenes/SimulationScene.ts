import Phaser from "phaser";
import { GAME_BALANCE } from "@/data/gameBalance";
import { EventBus, PhaserEvents } from "@/game/EventBus";
import { appStore, type AppStore } from "@/stores/appStore";

export class SimulationScene extends Phaser.Scene {
  private background?: Phaser.GameObjects.Graphics;
  private weekLabel?: Phaser.GameObjects.Text;
  private footerLabel?: Phaser.GameObjects.Text;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    super("simulation");
  }

  create() {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);

    this.background = this.add.graphics();
    this.weekLabel = this.add
      .text(16, 16, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#f8fafc",
      })
      .setDepth(2);
    this.footerLabel = this.add
      .text(16, GAME_BALANCE.baseHeight - 28, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#67e8f9",
      })
      .setDepth(2);

    this.drawSimulation(this.scale.width, this.scale.height);
    this.syncWithStore(appStore.getState());

    this.unsubscribers.push(
      appStore.subscribe((state) => state.game, () => {
        this.syncWithStore(appStore.getState());
      }),
      appStore.subscribe((state) => state.finance.cash, () => {
        this.syncWithStore(appStore.getState());
      }),
    );

    EventBus.on(PhaserEvents.reactAdvanceWeek, this.pulseSimulation, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    EventBus.emit(PhaserEvents.sceneReady, this);
  }

  shutdown() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    EventBus.off(PhaserEvents.reactAdvanceWeek, this.pulseSimulation, this);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  private syncWithStore(state: AppStore) {
    this.weekLabel?.setText(
      [
        `W${state.game.currentWeek.toString().padStart(2, "0")} ${state.game.season.toUpperCase()}`,
        `Cash ${formatCompactWon(state.finance.cash)}`,
      ].join("  |  "),
    );

    this.footerLabel?.setText(
      `${state.game.simulationFocus.toUpperCase()} VIEW  ${state.game.simulationPaused ? "PAUSED" : "LIVE"}`,
    );
  }

  private pulseSimulation() {
    this.cameras.main.flash(180, 236, 72, 153, false);

    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.03,
      duration: 120,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.drawSimulation(gameSize.width, gameSize.height);
    this.footerLabel?.setPosition(16, gameSize.height - 28);
  }

  private drawSimulation(width: number, height: number) {
    if (!this.background) {
      return;
    }

    const graphics = this.background;
    graphics.clear();

    graphics.fillStyle(0x0f172a, 0.88);
    graphics.fillRoundedRect(0, 0, width, height, 28);

    graphics.fillStyle(0x111827, 1);
    graphics.fillRoundedRect(20, 76, width - 40, height - 136, 22);

    graphics.lineStyle(1, 0x334155, 0.7);
    const gridSpacing = 16;

    for (let x = 20; x <= width - 20; x += gridSpacing) {
      graphics.lineBetween(x, 76, x, height - 60);
    }

    for (let y = 76; y <= height - 60; y += gridSpacing) {
      graphics.lineBetween(20, y, width - 20, y);
    }

    graphics.fillStyle(0x06b6d4, 0.18);
    graphics.fillRoundedRect(32, height - 192, width - 64, 86, 16);

    graphics.fillStyle(0xec4899, 0.85);
    graphics.fillRect(width * 0.22, height - 240, 28, 88);
    graphics.fillRect(width * 0.42, height - 268, 28, 116);
    graphics.fillRect(width * 0.62, height - 228, 28, 76);

    graphics.fillStyle(0xf8fafc, 0.9);
    graphics.fillRect(width * 0.22 + 8, height - 252, 12, 12);
    graphics.fillRect(width * 0.42 + 8, height - 280, 12, 12);
    graphics.fillRect(width * 0.62 + 8, height - 240, 12, 12);
  }
}

function formatCompactWon(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
