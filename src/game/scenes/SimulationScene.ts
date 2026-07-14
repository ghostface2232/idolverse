import Phaser from "phaser";
import {
  SIMULATION_ROOM_LABELS,
  SIMULATION_WORLD,
} from "@/data/simulationWorld";
import { presentationBus } from "@/game/EventBus";
import {
  simulationProjectionCoordinator,
  type SimulationEntityProjection,
  type SimulationProjection,
} from "@/game/simulation/SimulationProjectionCoordinator";

type RoomKey = "practice" | "dorm" | "office";

interface RoomLayout {
  key: RoomKey;
  bg: number;
  accent: number;
  motif: (graphics: Phaser.GameObjects.Graphics, rect: Phaser.Geom.Rectangle) => void;
  rect: Phaser.Geom.Rectangle;
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
  private rooms: RoomLayout[] = [];
  private roomLabels = new Map<RoomKey, Phaser.GameObjects.Text>();
  private traineeContainers = new Map<string, Phaser.GameObjects.Container>();
  private unsubscribers: Array<() => void> = [];
  private projection = simulationProjectionCoordinator.getSnapshot();

  constructor() {
    super("simulation");
  }

  create() {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);

    this.background = this.add.graphics().setDepth(0);
    this.roomGraphics = this.add.graphics().setDepth(1);

    this.layoutRooms();
    this.applyProjection(this.projection);

    this.unsubscribers.push(
      simulationProjectionCoordinator.subscribe((projection) =>
        this.applyProjection(projection),
      ),
      presentationBus.on("playWeekTimeline", () => this.pulseSimulation()),
    );

    presentationBus.emit("sceneReady", { sceneKey: this.scene.key });
  }

  shutdown() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.traineeContainers.forEach((container) => container.destroy());
    this.traineeContainers.clear();
    this.roomLabels.forEach((label) => label.destroy());
    this.roomLabels.clear();
  }

  private layoutRooms() {
    const topPad = SIMULATION_WORLD.verticalPadding;
    const bottomPad = SIMULATION_WORLD.verticalPadding;
    const sidePad = SIMULATION_WORLD.sidePadding;
    const usableHeight = SIMULATION_WORLD.height - topPad - bottomPad;
    const roomGap = SIMULATION_WORLD.roomGap;
    const roomHeight = Math.floor(
      (usableHeight - roomGap * (SIMULATION_WORLD.roomCount - 1)) /
        SIMULATION_WORLD.roomCount,
    );
    const innerWidth = SIMULATION_WORLD.width - sidePad * 2;

    this.rooms = [
      {
        key: "practice",
        bg: 0x1e1b4b,
        accent: 0x6366f1,
        motif: drawMicMotif,
        rect: new Phaser.Geom.Rectangle(
          sidePad,
          topPad,
          innerWidth,
          roomHeight,
        ),
      },
      {
        key: "dorm",
        bg: 0x1f2937,
        accent: 0xfbbf24,
        motif: drawBedMotif,
        rect: new Phaser.Geom.Rectangle(
          sidePad,
          topPad + roomHeight + roomGap,
          innerWidth,
          roomHeight,
        ),
      },
      {
        key: "office",
        bg: 0x0f3a3a,
        accent: 0x06b6d4,
        motif: drawDeskMotif,
        rect: new Phaser.Geom.Rectangle(
          sidePad,
          topPad + (roomHeight + roomGap) * 2,
          innerWidth,
          roomHeight,
        ),
      },
    ];

    this.createRoomLabels();
  }

  private drawRooms() {
    if (!this.background || !this.roomGraphics) {
      return;
    }

    this.background.clear();
    this.background.fillStyle(0x020617, 1);
    this.background.fillRect(
      0,
      0,
      SIMULATION_WORLD.width,
      SIMULATION_WORLD.height,
    );

    this.roomGraphics.clear();

    this.rooms.forEach((room) => {
      const { rect } = room;
      const unlocked =
        this.projection.rooms.find((candidate) => candidate.id === room.key)
          ?.unlocked ?? false;

      this.roomGraphics?.fillStyle(0x000000, 0.32);
      this.roomGraphics?.fillRoundedRect(
        rect.x,
        rect.y + 4,
        rect.width,
        rect.height,
        18,
      );

      this.roomGraphics?.fillStyle(room.bg, unlocked ? 1 : 0.72);
      this.roomGraphics?.fillRoundedRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        18,
      );
      this.roomGraphics?.lineStyle(1, 0xffffff, unlocked ? 0.1 : 0.05);
      this.roomGraphics?.strokeRoundedRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        18,
      );

      this.roomGraphics?.fillStyle(room.accent, unlocked ? 0.9 : 0.3);
      this.roomGraphics?.fillRoundedRect(rect.x + 1, rect.y + 1, 5, rect.height - 2, 3);

      this.drawFloorPattern(this.roomGraphics!, rect, room.accent, unlocked);

      if (unlocked) {
        room.motif(this.roomGraphics!, rect);
      } else {
        this.roomGraphics?.fillStyle(0x000000, 0.45);
        this.roomGraphics?.fillRoundedRect(
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          18,
        );
      }
    });
  }

  private drawFloorPattern(
    graphics: Phaser.GameObjects.Graphics,
    rect: Phaser.Geom.Rectangle,
    accent: number,
    unlocked: boolean,
  ) {
    graphics.lineStyle(1, accent, unlocked ? 0.08 : 0.03);
    const step = 20;
    for (let x = rect.x + step; x < rect.right; x += step) {
      graphics.lineBetween(x, rect.y + 1, x, rect.bottom - 1);
    }
    for (let y = rect.y + step; y < rect.bottom; y += step) {
      graphics.lineBetween(rect.x + 1, y, rect.right - 1, y);
    }
  }

  private createRoomLabels() {
    this.rooms.forEach((room) => {
      const existing = this.roomLabels.get(room.key);
      if (existing) {
        existing.setPosition(room.rect.x + 12, room.rect.y + 10);
        return;
      }

      const label = this.add
        .text(
          room.rect.x + 12,
          room.rect.y + 10,
          SIMULATION_ROOM_LABELS[room.key],
          {
            color: "#f8fafc",
            fontFamily: '"DungGeunMo", monospace',
            fontSize: "12px",
          },
        )
        .setDepth(3);
      this.roomLabels.set(room.key, label);
    });
  }

  private applyProjection(projection: SimulationProjection) {
    this.projection = projection;
    this.drawRooms();
    this.diffTrainees(projection.entities);
  }

  private diffTrainees(trainees: SimulationEntityProjection[]) {
    const grouped = new Map<RoomKey | "external", SimulationEntityProjection[]>();
    grouped.set("practice", []);
    grouped.set("dorm", []);
    grouped.set("office", []);
    grouped.set("external", []);

    trainees.forEach((trainee) => {
      const target = trainee.visible && trainee.roomId ? trainee.roomId : "external";
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
    externalList.forEach((trainee) => {
      const existing = this.traineeContainers.get(trainee.id);
      existing?.setVisible(false).setActive(false);
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
    trainees: SimulationEntityProjection[],
    seenIds: Set<string>,
  ) {
    if (trainees.length === 0) {
      return;
    }

    const padX = 18;
    const padTop = 38;
    const padBottom = 16;
    const charWidth = 28;
    const charHeight = 30;
    const innerWidth = room.rect.width - padX * 2;
    const cols = Math.max(1, Math.floor(innerWidth / charWidth));
    const colSpacing = innerWidth / cols;
    const innerHeight = room.rect.height - padTop - padBottom;
    const rows = Math.max(1, Math.ceil(trainees.length / cols));
    const rowSpacing = rows > 1 ? innerHeight / rows : 0;

    trainees.forEach((trainee, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = Math.round(
        room.rect.x + padX + colSpacing * col + colSpacing / 2,
      );
      const y = Math.round(
        room.rect.y + padTop + rowSpacing * row + charHeight / 2,
      );

      let container = this.traineeContainers.get(trainee.id);
      if (!container) {
        container = this.renderTrainee(trainee, x, y);
        this.traineeContainers.set(trainee.id, container);
      } else {
        container.setVisible(true).setActive(true);
        const injuryMark = container.getByName(
          "injury-mark",
        ) as Phaser.GameObjects.Graphics | null;
        injuryMark?.setVisible(trainee.injured);
        container.setDepth(4 + y / 10_000);
        if (container.x !== x || container.y !== y) {
          this.tweens.killTweensOf(container);
          this.tweens.add({
            targets: container,
            x,
            y,
            duration: 240,
            ease: "Quad.easeOut",
          });
        }
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
    trainee: SimulationEntityProjection,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(4 + y / 10_000);
    const hairColor = hashHairColor(trainee.id);
    const outfitPalette = [0x2563eb, 0x7c3aed, 0xdb2777, 0x0891b2, 0x059669];
    const outfitColor = outfitPalette[hairColor % outfitPalette.length];

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.32);
    shadow.fillEllipse(0, 9, 18, 6);
    container.add(shadow);

    const sprite = this.add.container(0, 0);
    container.add(sprite);

    const legs = this.add.graphics();
    legs.fillStyle(0x111827, 1);
    legs.fillRect(-5, 4, 4, 7);
    legs.fillRect(1, 4, 4, 7);
    legs.fillStyle(0x0f172a, 1);
    legs.fillRect(-6, 10, 5, 2);
    legs.fillRect(1, 10, 5, 2);
    sprite.add(legs);

    const body = this.add.graphics();
    body.fillStyle(outfitColor, 1);
    body.fillRect(-6, -5, 12, 11);
    body.fillStyle(0xffffff, 0.18);
    body.fillRect(-4, -4, 2, 8);
    sprite.add(body);

    const head = this.add.graphics();
    head.fillStyle(0xfde68a, 1);
    head.fillRect(-5, -14, 10, 9);
    head.fillRect(-6, -12, 1, 4);
    head.fillRect(5, -12, 1, 4);
    head.fillStyle(0x1f2937, 1);
    head.fillRect(-3, -10, 1, 1);
    head.fillRect(2, -10, 1, 1);
    sprite.add(head);

    const hair = this.add.graphics();
    hair.fillStyle(hairColor, 1);
    hair.fillRect(-5, -16, 10, 4);
    hair.fillRect(-5, -12, 2, 4);
    hair.fillRect(4, -12, 1, 3);
    sprite.add(hair);

    const mark = this.add.graphics().setName("injury-mark");
    mark.fillStyle(0xef4444, 1);
    mark.fillRect(5, -17, 3, 3);
    mark.setVisible(trainee.injured);
    container.add(mark);

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.tweens.add({
        targets: sprite,
        y: -2,
        duration: 900 + (hairColor % 240),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    return container;
  }

  private pulseSimulation() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
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
