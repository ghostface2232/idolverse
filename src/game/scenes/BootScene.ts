import Phaser from "phaser";
import { EventBus, PhaserEvents } from "@/game/EventBus";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL);
    this.load.setPath("assets");
  }

  create() {
    EventBus.emit(PhaserEvents.bootComplete);
    this.scene.start("simulation");
  }
}

