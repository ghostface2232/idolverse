import Phaser from "phaser";

export const EventBus = new Phaser.Events.EventEmitter();

export const PhaserEvents = {
  bootComplete: "phaser:boot-complete",
  sceneReady: "phaser:scene-ready",
  reactAdvanceWeek: "react:advance-week",
} as const;

