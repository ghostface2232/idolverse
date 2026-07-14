import Phaser from "phaser";
import { presentationBus } from "@/game/EventBus";
import { loadWorldAssets } from "@/game/assets/loadWorldAssets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    loadWorldAssets(this);
  }

  create() {
    presentationBus.emit("bootComplete", { sceneKey: this.scene.key });
    this.scene.start("simulation");
  }
}

