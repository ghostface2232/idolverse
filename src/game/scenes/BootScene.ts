import Phaser from "phaser";
import { EventBus, PhaserEvents } from "@/game/EventBus";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL);
    this.load.setPath("images");
    // TODO: 본격 스프라이트 도입 시 facilities/ 시트 로드 추가
    //   this.load.spritesheet("facility-dorm", "facilities/dormitory-spritesheet.png", { frameWidth: 64, frameHeight: 64 })
    //   this.load.spritesheet("facility-studio", "facilities/studio-spritesheet.png", { frameWidth: 64, frameHeight: 64 })
  }

  create() {
    EventBus.emit(PhaserEvents.bootComplete);
    this.scene.start("simulation");
  }
}

