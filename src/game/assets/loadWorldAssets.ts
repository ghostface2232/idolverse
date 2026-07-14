import type Phaser from "phaser";
import { assetUrl } from "@/utils/assets";

interface WorldImageAsset {
  key: string;
  path: string;
}

/** Phase 4 아트가 준비되면 이 목록만 채운다. 경로는 public/images 기준이다. */
const WORLD_IMAGE_ASSETS: WorldImageAsset[] = [];

export function loadWorldAssets(scene: Phaser.Scene) {
  WORLD_IMAGE_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, assetUrl(asset.path));
  });
}
