import Phaser from "phaser";
import {
  SIMULATION_ROOM_LABELS,
  SIMULATION_WORLD,
} from "@/data/simulationWorld";
import {
  MEMBER_SPRITE_FRAME,
  memberOutfitForActivity,
  memberSpriteFrameForId,
  memberSpriteKey,
} from "@/game/assets/memberSprites";
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

const MEMBER_DISPLAY_HEIGHT = 52;
const MEMBER_DISPLAY_SCALE = MEMBER_DISPLAY_HEIGHT / MEMBER_SPRITE_FRAME.height;
const MEMBER_PIVOT_Y = MEMBER_SPRITE_FRAME.pivotY / MEMBER_SPRITE_FRAME.height;

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
    const charWidth = 36;
    const charHeight = MEMBER_DISPLAY_HEIGHT;
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
        const expectedTextureKey = memberSpriteKey(
          this.projection.groupGender,
          memberOutfitForActivity(trainee.activity),
        );
        if (container.getData("textureKey") !== expectedTextureKey) {
          container.destroy();
          container = this.renderTrainee(trainee, x, y);
          this.traineeContainers.set(trainee.id, container);
        }
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

  private renderTrainee(
    trainee: SimulationEntityProjection,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(4 + y / 10_000);
    const textureKey = memberSpriteKey(
      this.projection.groupGender,
      memberOutfitForActivity(trainee.activity),
    );
    container.setData("textureKey", textureKey);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.32);
    shadow.fillEllipse(0, 2, 24, 7);
    container.add(shadow);

    const sprite = this.add
      .sprite(0, 0, textureKey, memberSpriteFrameForId(trainee.id))
      .setOrigin(0.5, MEMBER_PIVOT_Y)
      .setScale(MEMBER_DISPLAY_SCALE)
      .setName("member-sprite");
    container.add(sprite);

    const mark = this.add.graphics().setName("injury-mark");
    mark.fillStyle(0xef4444, 1);
    mark.fillRect(8, -51, 4, 4);
    mark.setVisible(trainee.injured);
    container.add(mark);

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.tweens.add({
        targets: sprite,
        y: -2,
        duration: 900 + memberSpriteFrameForId(trainee.id) * 24,
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
