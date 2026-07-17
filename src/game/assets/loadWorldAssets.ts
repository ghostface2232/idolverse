import type Phaser from "phaser";
import {
  MEMBER_OUTFITS,
  MEMBER_SPRITE_FRAME,
  MEMBER_SPRITE_KEYS,
  MEMBER_SPRITE_PATHS,
} from "@/game/assets/memberSprites";
import { assetUrl } from "@/utils/assets";

interface WorldImageAsset {
  key: string;
  path: string;
}

interface WorldSpriteSheetAsset extends WorldImageAsset {
  frameWidth: number;
  frameHeight: number;
}

/** Phase 4 아트가 준비되면 이 목록만 채운다. 경로는 public/images 기준이다. */
const WORLD_IMAGE_ASSETS: WorldImageAsset[] = [];

const WORLD_SPRITESHEET_ASSETS: WorldSpriteSheetAsset[] = (
  ["female", "male"] as const
).flatMap((gender) =>
  MEMBER_OUTFITS.map((outfit) => ({
    key: MEMBER_SPRITE_KEYS[gender][outfit],
    path: MEMBER_SPRITE_PATHS[gender][outfit],
    frameWidth: MEMBER_SPRITE_FRAME.width,
    frameHeight: MEMBER_SPRITE_FRAME.height,
  })),
);

export function loadWorldAssets(scene: Phaser.Scene) {
  WORLD_IMAGE_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, assetUrl(asset.path));
  });
  WORLD_SPRITESHEET_ASSETS.forEach((asset) => {
    scene.load.spritesheet(asset.key, assetUrl(asset.path), {
      frameWidth: asset.frameWidth,
      frameHeight: asset.frameHeight,
    });
  });
}
