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
import {
  roomArtCandidates,
  WORLD_LOCKED_ROOM_TEXTURE,
} from "@/game/assets/worldRoomArt";
import { presentationBus } from "@/game/EventBus";
import {
  simulationProjectionCoordinator,
  type SimulationEntityProjection,
  type SimulationProjection,
} from "@/game/simulation/SimulationProjectionCoordinator";

type RoomKey = "practice" | "dorm" | "office";

interface RoomLayout {
  key: RoomKey;
  wall: number;
  floor: number;
  floorLine: number;
  accent: number;
  furniture: (
    graphics: Phaser.GameObjects.Graphics,
    rect: Phaser.Geom.Rectangle,
    unlocked: boolean,
  ) => void;
  rect: Phaser.Geom.Rectangle;
}

const MEMBER_DISPLAY_HEIGHT = 52;
const MEMBER_DISPLAY_SCALE = MEMBER_DISPLAY_HEIGHT / MEMBER_SPRITE_FRAME.height;
const MEMBER_PIVOT_Y = MEMBER_SPRITE_FRAME.pivotY / MEMBER_SPRITE_FRAME.height;
const ROOM_RADIUS = 14;
const WALL_HEIGHT = 34;

export class SimulationScene extends Phaser.Scene {
  private background?: Phaser.GameObjects.Graphics;
  private roomGraphics?: Phaser.GameObjects.Graphics;
  private rooms: RoomLayout[] = [];
  private roomLabels = new Map<RoomKey, Phaser.GameObjects.Text>();
  private roomImages = new Map<RoomKey, Phaser.GameObjects.Image>();
  private roomImageMasks = new Map<RoomKey, Phaser.GameObjects.Graphics>();
  private traineeContainers = new Map<string, Phaser.GameObjects.Container>();
  private unsubscribers: Array<() => void> = [];
  private projection = simulationProjectionCoordinator.getSnapshot();
  private reducedMotion = false;

  constructor() {
    super("simulation");
  }

  create() {
    // 백킹스토어는 renderScale 배 해상도이고, 카메라 줌으로 월드 좌표(360x420)를 되돌린다.
    const zoom = SIMULATION_WORLD.renderScale;
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(
      SIMULATION_WORLD.width / 2,
      SIMULATION_WORLD.height / 2,
    );
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

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
    this.roomImages.forEach((image) => image.destroy());
    this.roomImages.clear();
    this.roomImageMasks.forEach((mask) => mask.destroy());
    this.roomImageMasks.clear();
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
        wall: 0x343197,
        floor: 0x221d4f,
        floorLine: 0x3b36a3,
        accent: 0x818cf8,
        furniture: drawPracticeFurniture,
        rect: new Phaser.Geom.Rectangle(sidePad, topPad, innerWidth, roomHeight),
      },
      {
        key: "dorm",
        wall: 0x4a443c,
        floor: 0x2c2218,
        floorLine: 0x57534e,
        accent: 0xfbbf24,
        furniture: drawDormFurniture,
        rect: new Phaser.Geom.Rectangle(
          sidePad,
          topPad + roomHeight + roomGap,
          innerWidth,
          roomHeight,
        ),
      },
      {
        key: "office",
        wall: 0x136058,
        floor: 0x0b2f2c,
        floorLine: 0x14746b,
        accent: 0x2dd4bf,
        furniture: drawOfficeFurniture,
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
    this.background.fillRect(0, 0, SIMULATION_WORLD.width, SIMULATION_WORLD.height);

    this.roomGraphics.clear();

    this.rooms.forEach((room) => {
      const projectionRoom = this.projection.rooms.find(
        (candidate) => candidate.id === room.key,
      );
      const unlocked = projectionRoom?.unlocked ?? false;
      const level = projectionRoom?.level ?? 0;

      // 전용 일러스트가 로드돼 있으면 그것을, 없으면 벡터 인테리어를 그린다.
      const artTexture = this.resolveRoomArtTexture(room.key, unlocked, level);
      this.syncRoomImage(room, artTexture);

      if (!artTexture) {
        this.drawRoomShell(room, unlocked);
        room.furniture(this.roomGraphics!, room.rect, unlocked);
      }

      if (!unlocked) {
        this.drawLockedOverlay(room.rect, Boolean(artTexture));
      }

      const label = this.roomLabels.get(room.key);
      label?.setText(
        unlocked && level > 0
          ? `${SIMULATION_ROOM_LABELS[room.key]} Lv.${level}`
          : SIMULATION_ROOM_LABELS[room.key],
      );
      label?.setAlpha(unlocked ? 1 : 0.7);
    });
  }

  private drawRoomShell(room: RoomLayout, unlocked: boolean) {
    const g = this.roomGraphics!;
    const { rect } = room;
    const dim = unlocked ? 1 : 0.55;

    // 바닥 그림자
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(rect.x, rect.y + 4, rect.width, rect.height, ROOM_RADIUS);

    // 바닥
    g.fillStyle(room.floor, dim);
    g.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, ROOM_RADIUS);

    // 벽 (상단 밴드)
    g.fillStyle(room.wall, dim);
    g.fillRoundedRect(rect.x, rect.y, rect.width, WALL_HEIGHT, {
      tl: ROOM_RADIUS,
      tr: ROOM_RADIUS,
      bl: 0,
      br: 0,
    });

    // 걸레받이 + 벽 하단 라인
    g.fillStyle(0x020617, 0.5);
    g.fillRect(rect.x, rect.y + WALL_HEIGHT, rect.width, 2);
    g.fillStyle(room.accent, unlocked ? 0.4 : 0.15);
    g.fillRect(rect.x + 2, rect.y + WALL_HEIGHT - 1, rect.width - 4, 1);

    // 바닥 패턴 (마루 널)
    g.lineStyle(1, room.floorLine, unlocked ? 0.22 : 0.08);
    for (
      let y = rect.y + WALL_HEIGHT + 13;
      y < rect.bottom - 4;
      y += 13
    ) {
      g.lineBetween(rect.x + 3, y, rect.right - 3, y);
    }

    // 외곽선
    g.lineStyle(1, 0xffffff, unlocked ? 0.1 : 0.05);
    g.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, ROOM_RADIUS);
  }

  /** 전용 룸 아트가 상태에 맞게 로드돼 있으면 그 텍스처 키를 돌려준다. */
  private resolveRoomArtTexture(
    roomKey: RoomKey,
    unlocked: boolean,
    level: number,
  ): string | null {
    if (!unlocked) {
      return this.textures.exists(WORLD_LOCKED_ROOM_TEXTURE)
        ? WORLD_LOCKED_ROOM_TEXTURE
        : null;
    }
    for (const candidate of roomArtCandidates(roomKey, level)) {
      if (this.textures.exists(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  /** 룸 일러스트 이미지를 생성·갱신한다. textureKey가 null이면 숨긴다. */
  private syncRoomImage(room: RoomLayout, textureKey: string | null) {
    const existing = this.roomImages.get(room.key);

    if (!textureKey) {
      existing?.setVisible(false);
      return;
    }

    if (existing) {
      if (existing.texture.key !== textureKey) {
        existing.setTexture(textureKey);
        existing.setDisplaySize(room.rect.width, room.rect.height);
      }
      existing.setVisible(true);
      return;
    }

    const image = this.add
      .image(room.rect.x, room.rect.y, textureKey)
      .setOrigin(0, 0)
      .setDepth(0.5);
    image.setDisplaySize(room.rect.width, room.rect.height);

    // 벡터 방과 같은 둥근 모서리를 유지하도록 지오메트리 마스크를 씌운다.
    // 마스크용 그래픽스는 씬에 추가하지 않는다(추가하면 흰 사각형이 그려진다).
    const maskGraphics = this.make.graphics({}, false);
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRoundedRect(
      room.rect.x,
      room.rect.y,
      room.rect.width,
      room.rect.height,
      ROOM_RADIUS,
    );
    image.setMask(maskGraphics.createGeometryMask());

    this.roomImages.set(room.key, image);
    this.roomImageMasks.set(room.key, maskGraphics);
  }

  private drawLockedOverlay(rect: Phaser.Geom.Rectangle, hasArt = false) {
    const g = this.roomGraphics!;
    // 전용 잠금 일러스트가 있으면 어둡게 덮지 않고 자물쇠 표식만 얹는다.
    g.fillStyle(0x020617, hasArt ? 0.28 : 0.55);
    g.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, ROOM_RADIUS);

    // 자물쇠
    const cx = rect.centerX;
    const cy = rect.centerY + 2;
    g.lineStyle(2, 0x94a3b8, 0.9);
    g.beginPath();
    g.arc(cx, cy - 4, 5, Math.PI, Math.PI * 2);
    g.strokePath();
    g.fillStyle(0x94a3b8, 0.95);
    g.fillRoundedRect(cx - 7, cy - 4, 14, 11, 3);
    g.fillStyle(0x1e293b, 1);
    g.fillCircle(cx, cy + 1, 1.6);
  }

  private createRoomLabels() {
    this.rooms.forEach((room) => {
      const existing = this.roomLabels.get(room.key);
      if (existing) {
        existing.setPosition(room.rect.x + 8, room.rect.y + 7);
        return;
      }

      const label = this.add
        .text(room.rect.x + 8, room.rect.y + 7, SIMULATION_ROOM_LABELS[room.key], {
          color: "#f8fafc",
          fontFamily: '"DungGeunMo", monospace',
          fontSize: "11px",
          backgroundColor: "rgba(2, 6, 23, 0.72)",
          padding: { x: 6, y: 3 },
        })
        .setDepth(6)
        .setResolution(SIMULATION_WORLD.renderScale);
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
        this.syncEntityMarks(container, trainee);
        container.setDepth(4 + y / 10_000);
        container.setData("slotX", x);
        container.setData("slotY", y);
        if (container.x !== x || container.y !== y) {
          this.tweens.killTweensOf(container);
          this.tweens.add({
            targets: container,
            x,
            y,
            duration: 240,
            ease: "Quad.easeOut",
            onComplete: () => this.startWander(container!),
          });
        } else {
          this.ensureWander(container);
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
    container.setData("slotX", x);
    container.setData("slotY", y);

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

    container.add(this.buildInjuryMark());
    container.add(this.buildLowConditionMark());
    container.add(this.buildLowMoodMark());
    this.syncEntityMarks(container, trainee);

    if (!this.reducedMotion) {
      this.tweens.add({
        targets: sprite,
        y: -2,
        duration: 900 + memberSpriteFrameForId(trainee.id) * 24,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.startWander(container);
    }

    return container;
  }

  /** 부상: 머리 위 응급 패치 마크 */
  private buildInjuryMark(): Phaser.GameObjects.Graphics {
    const mark = this.add.graphics().setName("mark-injured");
    mark.fillStyle(0xf8fafc, 1);
    mark.fillRoundedRect(7, -60, 11, 11, 3);
    mark.fillStyle(0xef4444, 1);
    mark.fillRect(9, -56, 7, 3);
    mark.fillRect(11, -58, 3, 7);
    mark.setVisible(false);
    return mark;
  }

  /** 컨디션 저하: 땀방울 */
  private buildLowConditionMark(): Phaser.GameObjects.Graphics {
    const mark = this.add.graphics().setName("mark-lowcond");
    mark.fillStyle(0x38bdf8, 0.95);
    mark.fillTriangle(13, -58, 10.5, -52, 15.5, -52);
    mark.fillCircle(13, -51, 2.8);
    mark.fillStyle(0xe0f2fe, 0.8);
    mark.fillCircle(12, -52, 0.9);
    mark.setVisible(false);
    return mark;
  }

  /** 사기 저하: 말줄임 말풍선 */
  private buildLowMoodMark(): Phaser.GameObjects.Graphics {
    const mark = this.add.graphics().setName("mark-lowmood");
    mark.fillStyle(0x1e293b, 0.9);
    mark.fillRoundedRect(6, -60, 16, 9, 4);
    mark.fillTriangle(10, -51.5, 14, -51.5, 11, -48.5);
    mark.fillStyle(0xcbd5e1, 1);
    mark.fillCircle(10, -55.5, 1.2);
    mark.fillCircle(14, -55.5, 1.2);
    mark.fillCircle(18, -55.5, 1.2);
    mark.setVisible(false);
    return mark;
  }

  /** 상태 마크는 부상 > 컨디션 > 사기 순으로 하나만 보여준다. */
  private syncEntityMarks(
    container: Phaser.GameObjects.Container,
    entity: SimulationEntityProjection,
  ) {
    const injured = container.getByName("mark-injured") as
      | Phaser.GameObjects.Graphics
      | null;
    const lowCondition = container.getByName("mark-lowcond") as
      | Phaser.GameObjects.Graphics
      | null;
    const lowMood = container.getByName("mark-lowmood") as
      | Phaser.GameObjects.Graphics
      | null;

    injured?.setVisible(entity.injured);
    lowCondition?.setVisible(!entity.injured && entity.conditionBand === "low");
    lowMood?.setVisible(
      !entity.injured &&
        entity.conditionBand !== "low" &&
        entity.moodBand === "low",
    );
  }

  /** 자리 주변을 살짝 배회하는 앰비언트 연기. 로직에는 영향이 없다. */
  private startWander(container: Phaser.GameObjects.Container) {
    if (this.reducedMotion) return;

    const previous = container.getData("wanderTween") as
      | Phaser.Tweens.Tween
      | undefined;
    previous?.remove();

    const wander = () => {
      if (!container.active) return;
      const slotX = (container.getData("slotX") as number) ?? container.x;
      const slotY = (container.getData("slotY") as number) ?? container.y;
      const tween = this.tweens.add({
        targets: container,
        x: slotX + Phaser.Math.Between(-9, 9),
        y: slotY + Phaser.Math.Between(-3, 3),
        duration: Phaser.Math.Between(1400, 2400),
        delay: Phaser.Math.Between(600, 2800),
        ease: "Sine.easeInOut",
        onComplete: wander,
      });
      container.setData("wanderTween", tween);
    };
    wander();
  }

  private ensureWander(container: Phaser.GameObjects.Container) {
    if (this.reducedMotion) return;
    const tween = container.getData("wanderTween") as
      | Phaser.Tweens.Tween
      | undefined;
    if (!tween || !tween.isPlaying()) {
      this.startWander(container);
    }
  }

  private pulseSimulation() {
    if (this.reducedMotion) {
      return;
    }
    const baseZoom = SIMULATION_WORLD.renderScale;
    this.cameras.main.flash(180, 236, 72, 153, false);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: baseZoom * 1.03,
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

/** 연습실: 거울벽 + 바(barre) + 스피커 + 댄스 매트 */
function drawPracticeFurniture(
  g: Phaser.GameObjects.Graphics,
  rect: Phaser.Geom.Rectangle,
  unlocked: boolean,
) {
  const alpha = unlocked ? 1 : 0.4;

  // 거울 스트립
  const mirrorX = rect.x + 96;
  const mirrorY = rect.y + 6;
  const mirrorW = 132;
  const mirrorH = 22;
  g.fillStyle(0x3d4d6b, 0.95 * alpha);
  g.fillRect(mirrorX, mirrorY, mirrorW, mirrorH);
  g.lineStyle(1, 0x94a3b8, 0.5 * alpha);
  g.strokeRect(mirrorX, mirrorY, mirrorW, mirrorH);
  // 거울 분할선
  g.lineStyle(1, 0x1e293b, 0.7 * alpha);
  for (let x = mirrorX + 33; x < mirrorX + mirrorW - 4; x += 33) {
    g.lineBetween(x, mirrorY, x, mirrorY + mirrorH);
  }
  // 사선 하이라이트
  g.lineStyle(1.4, 0xcbd5e1, 0.3 * alpha);
  g.lineBetween(mirrorX + 6, mirrorY + mirrorH - 3, mirrorX + 20, mirrorY + 3);
  g.lineBetween(mirrorX + 42, mirrorY + mirrorH - 3, mirrorX + 56, mirrorY + 3);
  g.lineBetween(mirrorX + 78, mirrorY + mirrorH - 3, mirrorX + 92, mirrorY + 3);
  // 바(barre)
  g.lineStyle(1.6, 0xa5b4fc, 0.8 * alpha);
  g.lineBetween(mirrorX - 2, mirrorY + 15, mirrorX + mirrorW + 2, mirrorY + 15);

  // 스피커 (벽 오른쪽)
  const spX = rect.right - 36;
  const spY = rect.y + 6;
  g.fillStyle(0x0f172a, 0.95 * alpha);
  g.fillRoundedRect(spX, spY, 22, 25, 3);
  g.lineStyle(1, 0x6366f1, 0.6 * alpha);
  g.strokeRoundedRect(spX, spY, 22, 25, 3);
  g.fillStyle(0x6366f1, 0.9 * alpha);
  g.fillCircle(spX + 11, spY + 8, 4);
  g.fillCircle(spX + 11, spY + 18, 5);
  g.fillStyle(0x1e1b4b, 1 * alpha);
  g.fillCircle(spX + 11, spY + 8, 1.8);
  g.fillCircle(spX + 11, spY + 18, 2.2);
  g.fillStyle(0xec4899, 0.9 * alpha);
  g.fillCircle(spX + 3, spY + 3, 1);

  // 댄스 매트 (바닥 중앙)
  const matX = rect.x + 64;
  const matY = rect.y + WALL_HEIGHT + 12;
  const matW = rect.width - 128;
  const matH = rect.height - WALL_HEIGHT - 26;
  g.fillStyle(0x6366f1, 0.1 * alpha);
  g.fillRoundedRect(matX, matY, matW, matH, 8);
  g.lineStyle(1, 0x818cf8, 0.25 * alpha);
  g.strokeRoundedRect(matX, matY, matW, matH, 8);
}

/** 숙소: 창문 2개 + 2층 침대 + 러그 + 스탠드 */
function drawDormFurniture(
  g: Phaser.GameObjects.Graphics,
  rect: Phaser.Geom.Rectangle,
  unlocked: boolean,
) {
  const alpha = unlocked ? 1 : 0.4;

  // 창문 2개 (밤하늘)
  [rect.x + 104, rect.x + 164].forEach((wx, index) => {
    const wy = rect.y + 5;
    g.fillStyle(0x16304f, 0.95 * alpha);
    g.fillRoundedRect(wx, wy, 36, 24, 2);
    g.lineStyle(2, 0x292524, 0.9 * alpha);
    g.strokeRoundedRect(wx, wy, 36, 24, 2);
    g.lineStyle(1, 0x292524, 0.9 * alpha);
    g.lineBetween(wx + 18, wy, wx + 18, wy + 24);
    if (index === 0) {
      g.fillStyle(0xfde68a, 0.95 * alpha);
      g.fillCircle(wx + 9, wy + 8, 3.4);
      g.fillStyle(0x16304f, 1 * alpha);
      g.fillCircle(wx + 10.5, wy + 7, 2.6);
    }
    g.fillStyle(0xe2e8f0, 0.8 * alpha);
    g.fillRect(wx + 26, wy + 6, 1.4, 1.4);
    g.fillRect(wx + 30, wy + 14, 1.2, 1.2);
    g.fillRect(wx + 6, wy + 17, 1.2, 1.2);
  });

  // 2층 침대 (오른쪽 바닥)
  const bedX = rect.right - 66;
  const bedY = rect.bottom - 46;
  g.fillStyle(0x78350f, 0.95 * alpha);
  g.fillRect(bedX, bedY, 3, 38);
  g.fillRect(bedX + 49, bedY, 3, 38);
  // 상단 매트리스
  g.fillStyle(0x92400e, 0.95 * alpha);
  g.fillRect(bedX + 2, bedY + 8, 48, 4);
  g.fillStyle(0xd97706, 0.95 * alpha);
  g.fillRect(bedX + 3, bedY + 4, 46, 5);
  g.fillStyle(0xfef3c7, 0.95 * alpha);
  g.fillRect(bedX + 5, bedY + 4, 10, 4);
  // 하단 매트리스
  g.fillStyle(0x92400e, 0.95 * alpha);
  g.fillRect(bedX + 2, bedY + 26, 48, 4);
  g.fillStyle(0xf59e0b, 0.95 * alpha);
  g.fillRect(bedX + 3, bedY + 22, 46, 5);
  g.fillStyle(0xfef3c7, 0.95 * alpha);
  g.fillRect(bedX + 5, bedY + 22, 10, 4);

  // 러그 (중앙 바닥)
  g.fillStyle(0x9a3412, 0.4 * alpha);
  g.fillRoundedRect(rect.x + 72, rect.bottom - 32, 96, 20, 9);
  g.lineStyle(1, 0xfbbf24, 0.25 * alpha);
  g.strokeRoundedRect(rect.x + 76, rect.bottom - 29, 88, 14, 7);

  // 플로어 스탠드 (왼쪽 바닥)
  const lampX = rect.x + 26;
  const lampY = rect.bottom - 14;
  g.fillStyle(0x57534e, 0.95 * alpha);
  g.fillRect(lampX - 4, lampY, 8, 2);
  g.fillRect(lampX - 0.7, lampY - 16, 1.6, 16);
  g.fillStyle(0xfbbf24, 0.9 * alpha);
  g.fillTriangle(lampX - 6, lampY - 16, lampX + 6, lampY - 16, lampX, lampY - 24);
  g.fillStyle(0xfde68a, 0.25 * alpha);
  g.fillTriangle(lampX - 9, lampY + 1, lampX + 9, lampY + 1, lampX, lampY - 15);
}

/** 사무실: 화이트보드 + 벽시계 + 책상 2개(모니터) + 화분 */
function drawOfficeFurniture(
  g: Phaser.GameObjects.Graphics,
  rect: Phaser.Geom.Rectangle,
  unlocked: boolean,
) {
  const alpha = unlocked ? 1 : 0.4;

  // 화이트보드 (차트)
  const wbX = rect.x + 100;
  const wbY = rect.y + 5;
  g.fillStyle(0xe2e8f0, 0.92 * alpha);
  g.fillRoundedRect(wbX, wbY, 64, 24, 2);
  g.lineStyle(2, 0x0f172a, 0.6 * alpha);
  g.strokeRoundedRect(wbX, wbY, 64, 24, 2);
  g.lineStyle(1.4, 0xec4899, 0.9 * alpha);
  g.beginPath();
  g.moveTo(wbX + 6, wbY + 17);
  g.lineTo(wbX + 20, wbY + 12);
  g.lineTo(wbX + 32, wbY + 15);
  g.lineTo(wbX + 46, wbY + 6);
  g.strokePath();
  g.fillStyle(0x06b6d4, 0.8 * alpha);
  g.fillRect(wbX + 50, wbY + 12, 3, 8);
  g.fillRect(wbX + 55, wbY + 8, 3, 12);

  // 벽시계
  const clockX = rect.right - 28;
  const clockY = rect.y + 15;
  g.fillStyle(0xf8fafc, 0.95 * alpha);
  g.fillCircle(clockX, clockY, 6);
  g.lineStyle(1, 0x0f172a, 0.8 * alpha);
  g.strokeCircle(clockX, clockY, 6);
  g.lineBetween(clockX, clockY, clockX, clockY - 4);
  g.lineBetween(clockX, clockY, clockX + 3, clockY + 1);

  // 책상 2개 + 모니터 (오른쪽 바닥)
  [rect.right - 112, rect.right - 60].forEach((dx) => {
    const dy = rect.bottom - 16;
    g.fillStyle(0x155e75, 0.95 * alpha);
    g.fillRect(dx, dy - 5, 42, 5);
    g.fillStyle(0x0e7490, 0.95 * alpha);
    g.fillRect(dx + 2, dy, 3, 8);
    g.fillRect(dx + 37, dy, 3, 8);
    g.fillStyle(0x0f172a, 0.95 * alpha);
    g.fillRoundedRect(dx + 12, dy - 18, 18, 12, 2);
    g.fillStyle(0x22d3ee, 0.9 * alpha);
    g.fillRect(dx + 14, dy - 16, 14, 8);
    g.fillStyle(0x0f172a, 0.95 * alpha);
    g.fillRect(dx + 19, dy - 6, 4, 2);
  });

  // 화분 (왼쪽 바닥)
  const potX = rect.x + 24;
  const potY = rect.bottom - 14;
  g.fillStyle(0x9a3412, 0.95 * alpha);
  g.fillRect(potX - 5, potY, 10, 8);
  g.fillStyle(0x22c55e, 0.9 * alpha);
  g.fillCircle(potX, potY - 6, 5);
  g.fillCircle(potX - 4, potY - 2, 3.4);
  g.fillCircle(potX + 4, potY - 2, 3.4);
  g.fillStyle(0x4ade80, 0.8 * alpha);
  g.fillCircle(potX - 1.5, potY - 7.5, 1.6);
}
