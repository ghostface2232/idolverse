from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


GRID_COLUMNS = 5
GRID_ROWS = 2
CANVAS_SIZE = (256, 448)
CONTENT_HEIGHT = 400
PIVOT = (128, 424)

HAIR_TYPES = {
    "female": [
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
    ],
    "male": [
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
    ],
}


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("Sprite cell contains no opaque pixels")
    return bounds


def normalize_sprite(sprite: Image.Image) -> Image.Image:
    sprite = sprite.crop(alpha_bounds(sprite))
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


def slice_sheet(
    gender: str,
    source_path: Path,
    output_root: Path,
) -> list[dict[str, object]]:
    source = Image.open(source_path).convert("RGBA")
    output_dir = output_root / gender
    output_dir.mkdir(parents=True, exist_ok=True)

    transparent_sheet = Image.new(
        "RGBA",
        (CANVAS_SIZE[0] * GRID_COLUMNS, CANVAS_SIZE[1] * GRID_ROWS),
        (0, 0, 0, 0),
    )
    green_sheet = Image.new(
        "RGBA",
        transparent_sheet.size,
        (0, 255, 0, 255),
    )
    manifest: list[dict[str, object]] = []

    for index, hair_type in enumerate(HAIR_TYPES[gender]):
        column = index % GRID_COLUMNS
        row = index // GRID_COLUMNS
        left = round(column * source.width / GRID_COLUMNS)
        right = round((column + 1) * source.width / GRID_COLUMNS)
        top = round(row * source.height / GRID_ROWS)
        bottom = round((row + 1) * source.height / GRID_ROWS)

        normalized = normalize_sprite(source.crop((left, top, right, bottom)))
        filename = f"{gender}-{index + 1:02d}-{hair_type}.png"
        normalized.save(output_dir / filename)

        destination = (column * CANVAS_SIZE[0], row * CANVAS_SIZE[1])
        transparent_sheet.alpha_composite(normalized, destination)
        green_sheet.alpha_composite(normalized, destination)
        manifest.append(
            {
                "id": f"{gender}-{index + 1:02d}",
                "hairType": hair_type,
                "file": f"{gender}/{filename}",
                "canvas": list(CANVAS_SIZE),
                "pivot": list(PIVOT),
            }
        )

    transparent_sheet.save(output_root / f"{gender}-sheet-transparent.png")
    green_sheet.save(output_root / f"{gender}-sheet-green.png")
    return manifest


def validate_outputs(output_root: Path, sprites: list[dict[str, object]]) -> None:
    for entry in sprites:
        image = Image.open(output_root / str(entry["file"])).convert("RGBA")
        if image.size != CANVAS_SIZE:
            raise ValueError(f'{entry["id"]}: expected {CANVAS_SIZE}, got {image.size}')
        bounds = alpha_bounds(image)
        if bounds[3] != PIVOT[1]:
            raise ValueError(
                f'{entry["id"]}: feet baseline {bounds[3]} does not match {PIVOT[1]}'
            )
        if bounds[3] - bounds[1] != CONTENT_HEIGHT:
            raise ValueError(
                f'{entry["id"]}: content height {bounds[3] - bounds[1]} does not match '
                f'{CONTENT_HEIGHT}'
            )
        if any(image.getpixel(point)[3] != 0 for point in ((0, 0), (255, 0), (0, 447), (255, 447))):
            raise ValueError(f'{entry["id"]}: transparent canvas corners are not clear')

    print(
        f"Validated {len(sprites)} sprites: canvas={CANVAS_SIZE}, "
        f"contentHeight={CONTENT_HEIGHT}, pivot={PIVOT}"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--female-source", type=Path, required=True)
    parser.add_argument("--male-source", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    args = parser.parse_args()

    args.output_root.mkdir(parents=True, exist_ok=True)
    sprites = [
        *slice_sheet("female", args.female_source, args.output_root),
        *slice_sheet("male", args.male_source, args.output_root),
    ]
    manifest = {
        "version": 1,
        "grid": [GRID_COLUMNS, GRID_ROWS],
        "canvas": list(CANVAS_SIZE),
        "contentHeight": CONTENT_HEIGHT,
        "pivot": list(PIVOT),
        "sprites": sprites,
    }
    (args.output_root / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    validate_outputs(args.output_root, sprites)


if __name__ == "__main__":
    main()
