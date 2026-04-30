import Phaser from "phaser";
import { EventBus, PhaserEvents } from "@/game/EventBus";
import { financeVanillaStore } from "@/stores/financeStore";
import { gameVanillaStore } from "@/stores/gameStore";
import { traineeVanillaStore } from "@/stores/traineeStore";
import type { Trainee, TraineeActivity } from "@/types/game";

type RoomKey = "practice" | "dorm" | "office";

interface RoomLayout {
  key: RoomKey;
  label: string;
  bg: number;
  accent: number;
  motif: (graphics: Phaser.GameObjects.Graphics, rect: Phaser.Geom.Rectangle) => void;
  isUnlocked: (upgrades: ReturnType<typeof financeVanillaStore.getState>["upgrades"]) => boolean;
  rect: Phaser.Geom.Rectangle;
}

const ACTIVITY_TO_ROOM: Record<NonNullable<TraineeActivity>, RoomKey | "external"> = {
  training: "practice",
  individual: "practice",
  rest: "dorm",
  vacation: "dorm",
  entertainment: "external",
};

function mapActivityToRoom(activity: TraineeActivity): RoomKey | "external" {
  if (!activity) {
    return "office";
  }
  return ACTIVITY_TO_ROOM[activity];
}

function hashHairColor(traineeId: string): number {
  let hash = 0;
  for (let i = 0; i < traineeId.length; i += 1) {
    hash = (hash * 31 + traineeId.charCodeAt(i)) & 0xffffff;
  }
  const palette = [0x111827, 0x4b2c20, 0x6b3410, 0x8b5cf6, 0xec4899, 0x06b6d4, 0xfacc15, 0x84cc16];
  return palette[hash % palette.length];
}

export class SimulationScene extends Phaser.Scene {
  private background?: Phaser.GameObjects.Graphics;
  private roomGraphics?: Phaser.GameObjects.Graphics;
  private roomLabels: Phaser.GameObjects.Text[] = [];
  private weekLabel?: Phaser.GameObjects.Text;
  private externalChip?: Phaser.GameObjects.Container;
  private externalCountText?: Phaser.GameObjects.Text;
  private rooms: RoomLayout[] = [];
  private traineeContainers = new Map<string, Phaser.GameObjects.Container>();
  private unsubscribers: Array<() => void> = [];

  constructor() {
    super("simulation");
  }

  create() {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);

    this.background = this.add.graphics().setDepth(0);
    this.roomGraphics = this.add.graphics().setDepth(1);

    this.weekLabel = this.add
      .text(16, 14, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#f8fafc",
      })
      .setDepth(5);

    this.createExternalChip();

    this.layoutRooms(this.scale.width, this.scale.height);
    this.syncWithStore();

    this.unsubscribers.push(
      gameVanillaStore.subscribe(() => this.syncWithStore()),
      financeVanillaStore.subscribe(() => this.syncWithStore()),
      traineeVanillaStore.subscribe(() => this.syncWithStore()),
    );

    EventBus.on(PhaserEvents.reactAdvanceWeek, this.pulseSimulation, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    EventBus.emit(PhaserEvents.sceneReady, this);
  }

  shutdown() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.traineeContainers.forEach((container) => container.destroy());
    this.traineeContainers.clear();
    EventBus.off(PhaserEvents.reactAdvanceWeek, this.pulseSimulation, this);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  private layoutRooms(width: number, height: number) {
    const headerPad = 36;
    const bottomPad = 24;
    const sidePad = 16;
    const usableHeight = height - headerPad - bottomPad;
    const roomGap = 8;
    const roomHeight = (usableHeight - roomGap * 2) / 3;
    const innerWidth = width - sidePad * 2;

    this.rooms = [
      {
        key: "practice",
        label: "연습실",
        bg: 0x1e1b4b,
        accent: 0x6366f1,
        motif: drawMicMotif,
        isUnlocked: (u) => u.studioLevel >= 1,
        rect: new Phaser.Geom.Rectangle(
          sidePad,
          headerPad,
          innerWidth,
          roomHeight,
        ),
      },
      {
        key: "dorm",
        label: "숙소",
        bg: 0x1f2937,
        accent: 0xfbbf24,
        motif: drawBedMotif,
        isUnlocked: (u) => u.dormLevel >= 1,
        rect: new Phaser.Geom.Rectangle(
          sidePad,
          headerPad + roomHeight + roomGap,
          innerWidth,
          roomHeight,
        ),
      },
      {
        key: "office",
        label: "사무실",
        bg: 0x0f3a3a,
        accent: 0x06b6d4,
        motif: drawDeskMotif,
        isUnlocked: () => true,
        rect: new Phaser.Geom.Rectangle(
          sidePad,
          headerPad + (roomHeight + roomGap) * 2,
          innerWidth,
          roomHeight,
        ),
      },
    ];

    this.drawRooms();
    this.repositionExternalChip(width);
  }

  private drawRooms() {
    if (!this.background || !this.roomGraphics) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    this.background.clear();
    this.background.fillStyle(0x020617, 0.92);
    this.background.fillRect(0, 0, width, height);

    this.roomGraphics.clear();
    this.roomLabels.forEach((label) => label.destroy());
    this.roomLabels = [];

    const upgrades = financeVanillaStore.getState().upgrades;

    this.rooms.forEach((room) => {
      const { rect } = room;
      const unlocked = room.isUnlocked(upgrades);

      this.roomGraphics?.fillStyle(room.bg, unlocked ? 0.95 : 0.55);
      this.roomGraphics?.fillRoundedRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        14,
      );
      this.roomGraphics?.lineStyle(2, room.accent, unlocked ? 0.7 : 0.3);
      this.roomGraphics?.strokeRoundedRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        14,
      );

      if (unlocked) {
        room.motif(this.roomGraphics!, rect);
      } else {
        this.roomGraphics?.fillStyle(0x000000, 0.45);
        this.roomGraphics?.fillRoundedRect(
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          14,
        );
      }

      const label = this.add
        .text(rect.x + 10, rect.y + 8, unlocked ? room.label : `${room.label} (잠금)`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: unlocked ? "#e2e8f0" : "#94a3b8",
        })
        .setDepth(2);
      this.roomLabels.push(label);
    });
  }

  private createExternalChip() {
    const container = this.add.container(0, 0).setDepth(6);
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.92);
    bg.fillRoundedRect(-46, -14, 92, 28, 14);
    bg.lineStyle(1, 0xec4899, 0.8);
    bg.strokeRoundedRect(-46, -14, 92, 28, 14);
    container.add(bg);

    const label = this.add
      .text(-38, -8, "외부 활동", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#fbcfe8",
      });
    container.add(label);

    const count = this.add
      .text(28, -8, "0명", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#f8fafc",
      });
    container.add(count);

    this.externalChip = container;
    this.externalCountText = count;
  }

  private repositionExternalChip(width: number) {
    if (!this.externalChip) {
      return;
    }
    this.externalChip.setPosition(width - 60, 22);
  }

  private syncWithStore() {
    const gameState = gameVanillaStore.getState();
    const financeState = financeVanillaStore.getState();
    const traineeState = traineeVanillaStore.getState();

    this.weekLabel?.setText(
      [
        `Y${gameState.currentYear} W${gameState.currentWeek
          .toString()
          .padStart(2, "0")} ${gameState.currentSeason.toUpperCase()}`,
        `Cash ${formatCompactWon(financeState.money)}`,
      ].join("  |  "),
    );

    this.drawRooms();
    this.diffTrainees(traineeState.trainees);
  }

  private diffTrainees(trainees: Trainee[]) {
    const grouped = new Map<RoomKey | "external", Trainee[]>();
    grouped.set("practice", []);
    grouped.set("dorm", []);
    grouped.set("office", []);
    grouped.set("external", []);

    trainees.forEach((trainee) => {
      const target = mapActivityToRoom(trainee.currentActivity);
      grouped.get(target)?.push(trainee);
    });

    const seenIds = new Set<string>();

    (["practice", "dorm", "office"] as RoomKey[]).forEach((roomKey) => {
      const room = this.rooms.find((entry) => entry.key === roomKey);
      const list = grouped.get(roomKey) ?? [];
      if (!room) {
        return;
      }
      this.placeTraineesInRoom(room, list, seenIds);
    });

    const externalList = grouped.get("external") ?? [];
    externalList.forEach((trainee) => seenIds.add(trainee.id));
    this.externalCountText?.setText(`${externalList.length}명`);
    externalList.forEach((trainee) => {
      const existing = this.traineeContainers.get(trainee.id);
      existing?.setVisible(false);
    });

    this.traineeContainers.forEach((container, id) => {
      if (!seenIds.has(id)) {
        container.destroy();
        this.traineeContainers.delete(id);
      }
    });
  }

  private placeTraineesInRoom(
    room: RoomLayout,
    trainees: Trainee[],
    seenIds: Set<string>,
  ) {
    if (trainees.length === 0) {
      return;
    }

    const padX = 12;
    const padTop = 28;
    const padBottom = 12;
    const charWidth = 14;
    const charHeight = 22;
    const innerWidth = room.rect.width - padX * 2;
    const cols = Math.max(1, Math.floor(innerWidth / charWidth));
    const colSpacing = innerWidth / cols;
    const innerHeight = room.rect.height - padTop - padBottom;
    const rows = Math.max(1, Math.ceil(trainees.length / cols));
    const rowSpacing = rows > 1 ? innerHeight / rows : 0;

    trainees.forEach((trainee, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = room.rect.x + padX + colSpacing * col + colSpacing / 2;
      const y = room.rect.y + padTop + rowSpacing * row + charHeight / 2;

      let container = this.traineeContainers.get(trainee.id);
      if (!container) {
        container = this.renderTrainee(trainee, x, y);
        this.traineeContainers.set(trainee.id, container);
      } else {
        container.setVisible(true);
        this.tweens.add({
          targets: container,
          x,
          y,
          duration: 240,
          ease: "Quad.easeOut",
        });
      }
      seenIds.add(trainee.id);
    });
  }

  /**
   * Trainee placeholder. Sprite swap: replace this body with
   * `this.add.sprite(x, y, key)` plus animation play call. Container
   * shape stays the same so callers do not change.
   */
  private renderTrainee(
    trainee: Trainee,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(4);
    const hairColor = hashHairColor(trainee.id);

    const body = this.add.graphics();
    body.fillStyle(hairColor, 1);
    body.fillRect(-4, -2, 8, 12);
    container.add(body);

    const head = this.add.graphics();
    head.fillStyle(0xfde68a, 1);
    head.fillRect(-3, -10, 6, 6);
    container.add(head);

    const hair = this.add.graphics();
    hair.fillStyle(hairColor, 1);
    hair.fillRect(-3, -11, 6, 2);
    container.add(hair);

    if (trainee.injuryWeeks > 0) {
      const mark = this.add.graphics();
      mark.fillStyle(0xef4444, 1);
      mark.fillRect(2, -12, 2, 2);
      container.add(mark);
    }

    this.tweens.add({
      targets: container,
      y: y - 2,
      duration: 700 + (hairColor % 200),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return container;
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
    this.traineeContainers.forEach((container) => {
      this.tweens.add({
        targets: container,
        scale: 1.18,
        duration: 120,
        yoyo: true,
        ease: "Quad.easeOut",
      });
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.layoutRooms(gameSize.width, gameSize.height);
    this.diffTrainees(traineeVanillaStore.getState().trainees);
  }
}

function drawMicMotif(graphics: Phaser.GameObjects.Graphics, rect: Phaser.Geom.Rectangle) {
  const cx = rect.x + rect.width - 26;
  const baseY = rect.y + rect.height - 18;
  graphics.fillStyle(0x6366f1, 0.9);
  graphics.fillRect(cx - 1, baseY - 14, 2, 14);
  graphics.fillStyle(0x818cf8, 1);
  graphics.fillCircle(cx, baseY - 18, 4);
  graphics.lineStyle(1, 0x6366f1, 0.7);
  graphics.strokeRect(cx - 6, baseY, 12, 2);
}

function drawBedMotif(graphics: Phaser.GameObjects.Graphics, rect: Phaser.Geom.Rectangle) {
  const bx = rect.x + rect.width - 38;
  const by = rect.y + rect.height - 18;
  graphics.fillStyle(0x78350f, 1);
  graphics.fillRect(bx, by - 6, 28, 6);
  graphics.fillStyle(0xfbbf24, 0.9);
  graphics.fillRect(bx + 2, by - 12, 24, 6);
  graphics.fillStyle(0xfde68a, 1);
  graphics.fillRect(bx + 2, by - 12, 6, 4);
}

function drawDeskMotif(graphics: Phaser.GameObjects.Graphics, rect: Phaser.Geom.Rectangle) {
  const dx = rect.x + rect.width - 36;
  const dy = rect.y + rect.height - 16;
  graphics.fillStyle(0x0e7490, 1);
  graphics.fillRect(dx, dy - 4, 26, 4);
  graphics.fillStyle(0x06b6d4, 1);
  graphics.fillRect(dx + 18, dy - 12, 6, 8);
  graphics.fillStyle(0x67e8f9, 1);
  graphics.fillRect(dx + 19, dy - 11, 4, 2);
}

function formatCompactWon(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
