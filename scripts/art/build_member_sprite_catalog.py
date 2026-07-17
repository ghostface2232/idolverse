from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from PIL import Image


GENDERS = ("female", "male")
OUTFITS = (
    "base",
    "trainee",
    "denim",
    "sports",
    "school",
    "stage",
    "leather",
    "hoodie",
    "street",
    "summer",
    "winter",
    "airport",
    "awards",
)
GRID_COLUMNS = 5
GRID_ROWS = 2
CANVAS_SIZE = (256, 448)
PORTRAIT_SIZE = (256, 256)
CONTENT_HEIGHT = 400
PIVOT = (128, 424)

HAIR_TYPES = {
    "female": (
        "straight-long-bangs",
        "straight-long-center",
        "high-ponytail",
        "low-ponytail",
        "twin-tails",
        "bob-bangs",
        "layered-wolf",
        "pixie",
        "long-waves",
        "braided-half-up",
    ),
    "male": (
        "short-fringe",
        "curtain-center",
        "comma-hair",
        "layered-shag",
        "long-tucked",
        "swept-undercut",
        "wavy-perm",
        "layered-mullet",
        "low-man-bun",
        "buzz-cut",
    ),
}

OUTFIT_LABELS = {
    "base": {"ko": "다크 기본복", "en": "Dark base"},
    "trainee": {"ko": "기본 연습생복", "en": "Basic trainee"},
    "denim": {"ko": "데님", "en": "Denim"},
    "sports": {"ko": "스포츠", "en": "Sports"},
    "school": {"ko": "교복", "en": "School concept"},
    "stage": {"ko": "다크 네온 스테이지", "en": "Dark neon stage"},
    "leather": {"ko": "가죽 재킷", "en": "Leather jacket"},
    "hoodie": {"ko": "레코딩 후드", "en": "Recording hoodie"},
    "street": {"ko": "사이버 스트릿", "en": "Cyber streetwear"},
    "summer": {"ko": "브라이트 서머", "en": "Bright summer"},
    "winter": {"ko": "아이보리 윈터", "en": "Ivory winter"},
    "airport": {"ko": "공항 패션", "en": "Airport fashion"},
    "awards": {"ko": "프리미엄 시상식", "en": "Premium awards"},
}


def alpha_bounds(image: Image.Image, threshold: int = 16) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError("Sprite contains no visible pixels")
    return bounds


def normalize_sprite(sprite: Image.Image) -> Image.Image:
    sprite = sprite.convert("RGBA").crop(alpha_bounds(sprite))
    scale = CONTENT_HEIGHT / sprite.height
    target_width = max(1, round(sprite.width * scale))
    target_height = CONTENT_HEIGHT

    max_width = CANVAS_SIZE[0] - 16
    if target_width > max_width:
        width_scale = max_width / target_width
        target_width = max_width
        target_height = max(1, round(target_height * width_scale))

    sprite = sprite.resize((target_width, target_height), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    x = PIVOT[0] - target_width // 2
    y = PIVOT[1] - target_height
    canvas.alpha_composite(sprite, (x, y))
    return canvas


def source_frames(
    gender: str,
    outfit: str,
    base_root: Path,
    source_root: Path,
) -> list[Image.Image]:
    if outfit == "base":
        base_files = sorted((base_root / gender).glob(f"{gender}-*.png"))
        if len(base_files) != GRID_COLUMNS * GRID_ROWS:
            raise ValueError(f"Expected 10 base sprites for {gender}, found {len(base_files)}")
        return [Image.open(path).convert("RGBA") for path in base_files]

    source_path = source_root / f"{gender}-{outfit}-transparent.png"
    source = Image.open(source_path).convert("RGBA")
    frames: list[Image.Image] = []
    for index in range(GRID_COLUMNS * GRID_ROWS):
        column = index % GRID_COLUMNS
        row = index // GRID_COLUMNS
        left = round(column * source.width / GRID_COLUMNS)
        right = round((column + 1) * source.width / GRID_COLUMNS)
        top = round(row * source.height / GRID_ROWS)
        bottom = round((row + 1) * source.height / GRID_ROWS)
        frames.append(source.crop((left, top, right, bottom)))
    return frames


def portrait_from_sprite(sprite: Image.Image) -> Image.Image:
    # The normalized sprite already places the head and bust inside the top 256 pixels.
    # A direct crop preserves the exact pixels used by the full-body character.
    return sprite.crop((0, 0, PORTRAIT_SIZE[0], PORTRAIT_SIZE[1]))


def build_catalog(
    base_root: Path,
    source_root: Path,
    output_root: Path,
    runtime_root: Path,
) -> dict[str, object]:
    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True)
    runtime_root.mkdir(parents=True, exist_ok=True)

    sprites: list[dict[str, object]] = []
    sprite_sheets: dict[str, dict[str, str]] = {gender: {} for gender in GENDERS}
    portrait_sheets: dict[str, dict[str, str]] = {gender: {} for gender in GENDERS}

    for gender in GENDERS:
        for outfit in OUTFITS:
            fullbody_sheet = Image.new(
                "RGBA",
                (CANVAS_SIZE[0] * GRID_COLUMNS, CANVAS_SIZE[1] * GRID_ROWS),
                (0, 0, 0, 0),
            )
            portrait_sheet = Image.new(
                "RGBA",
                (PORTRAIT_SIZE[0] * GRID_COLUMNS, PORTRAIT_SIZE[1] * GRID_ROWS),
                (0, 0, 0, 0),
            )

            for index, source in enumerate(source_frames(gender, outfit, base_root, source_root)):
                normalized = source if outfit == "base" else normalize_sprite(source)
                portrait = portrait_from_sprite(normalized)
                hair_type = HAIR_TYPES[gender][index]
                asset_id = f"{gender}-{outfit}-{index + 1:02d}"

                fullbody_dir = output_root / "fullbody" / gender / outfit
                portrait_dir = output_root / "portraits" / gender / outfit
                fullbody_dir.mkdir(parents=True, exist_ok=True)
                portrait_dir.mkdir(parents=True, exist_ok=True)
                fullbody_name = f"{asset_id}-{hair_type}.png"
                portrait_name = f"{asset_id}-{hair_type}-portrait.png"
                normalized.save(fullbody_dir / fullbody_name)
                portrait.save(portrait_dir / portrait_name)

                column = index % GRID_COLUMNS
                row = index // GRID_COLUMNS
                fullbody_sheet.alpha_composite(
                    normalized,
                    (column * CANVAS_SIZE[0], row * CANVAS_SIZE[1]),
                )
                portrait_sheet.alpha_composite(
                    portrait,
                    (column * PORTRAIT_SIZE[0], row * PORTRAIT_SIZE[1]),
                )

                sprites.append(
                    {
                        "id": asset_id,
                        "gender": gender,
                        "outfit": outfit,
                        "appearanceFrame": index,
                        "hairType": hair_type,
                        "fullbody": (
                            f"fullbody/{gender}/{outfit}/{fullbody_name}"
                        ),
                        "portrait": (
                            f"portraits/{gender}/{outfit}/{portrait_name}"
                        ),
                    }
                )

            sheet_name = f"{gender}-{outfit}-sheet-transparent.png"
            portrait_sheet_name = f"{gender}-{outfit}-portrait-sheet.png"
            sheet_dir = output_root / "sheets"
            sheet_dir.mkdir(parents=True, exist_ok=True)
            fullbody_sheet.save(sheet_dir / sheet_name)
            portrait_sheet.save(sheet_dir / portrait_sheet_name)
            fullbody_sheet.save(runtime_root / sheet_name)
            portrait_sheet.save(runtime_root / portrait_sheet_name)
            sprite_sheets[gender][outfit] = sheet_name
            portrait_sheets[gender][outfit] = portrait_sheet_name

    manifest: dict[str, object] = {
        "version": 2,
        "grid": [GRID_COLUMNS, GRID_ROWS],
        "canvas": list(CANVAS_SIZE),
        "portrait": list(PORTRAIT_SIZE),
        "contentHeight": CONTENT_HEIGHT,
        "pivot": list(PIVOT),
        "outfits": [
            {"id": outfit, "labels": OUTFIT_LABELS[outfit]}
            for outfit in OUTFITS
        ],
        "spriteSheets": sprite_sheets,
        "portraitSheets": portrait_sheets,
        "sprites": sprites,
    }
    (output_root / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest


def validate_catalog(output_root: Path, manifest: dict[str, object]) -> None:
    sprites = manifest["sprites"]
    if not isinstance(sprites, list) or len(sprites) != len(GENDERS) * len(OUTFITS) * 10:
        raise ValueError("Catalog must contain exactly 100 full-body/portrait pairs")

    for entry in sprites:
        if not isinstance(entry, dict):
            raise ValueError("Invalid sprite manifest entry")
        fullbody = Image.open(output_root / str(entry["fullbody"])).convert("RGBA")
        portrait = Image.open(output_root / str(entry["portrait"])).convert("RGBA")
        if fullbody.size != CANVAS_SIZE:
            raise ValueError(f'{entry["id"]}: invalid full-body size {fullbody.size}')
        if portrait.size != PORTRAIT_SIZE:
            raise ValueError(f'{entry["id"]}: invalid portrait size {portrait.size}')
        # Source extraction ignores very faint chroma-key residue, while the packaged
        # sprite validation includes every remaining alpha pixel at the final edge.
        bounds = alpha_bounds(fullbody, threshold=0)
        if bounds[3] != PIVOT[1]:
            raise ValueError(f'{entry["id"]}: baseline {bounds[3]} != {PIVOT[1]}')
        if bounds[3] - bounds[1] != CONTENT_HEIGHT:
            raise ValueError(
                f'{entry["id"]}: content height {bounds[3] - bounds[1]} != {CONTENT_HEIGHT}'
            )
        alpha_bounds(portrait)

    print(
        f"Validated {len(sprites)} full-body sprites and {len(sprites)} portraits; "
        f"outfits={len(OUTFITS)}, appearances={len(HAIR_TYPES['female'])} per gender"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-root", type=Path, required=True)
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--runtime-root", type=Path, required=True)
    args = parser.parse_args()

    manifest = build_catalog(
        args.base_root,
        args.source_root,
        args.output_root,
        args.runtime_root,
    )
    validate_catalog(args.output_root, manifest)


if __name__ == "__main__":
    main()
