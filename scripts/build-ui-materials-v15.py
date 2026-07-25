from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "themes" / "ui" / "v14" / "sources"
OUTPUT_ROOT = ROOT / "themes" / "ui" / "v15"

COMPOSER_SOURCE = SOURCE_ROOT / "composer-paper-sheet-alpha-contract.png"
SIDEBAR_ROW_SOURCE = SOURCE_ROOT / "sidebar-row-sheet-alpha-contract.png"
PAPER_CHANNEL_OFFSET = (-82, -69, -49)
PAPER_MATTE = (127, 113, 97)
PAPER_TARGET_MEDIAN = (126, 112, 96)


def crop(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return image.crop(box).convert("RGBA")


def channel_offset(
    image: Image.Image,
    offsets: tuple[int, int, int],
) -> Image.Image:
    pixels = np.asarray(image, dtype=np.int16).copy()
    for channel, offset in enumerate(offsets):
        pixels[..., channel] = np.clip(
            pixels[..., channel] + offset,
            0,
            255,
        )
    return Image.fromarray(pixels.astype(np.uint8), "RGBA")


def matte_transparent_rgb(
    image: Image.Image,
    fill: tuple[int, int, int],
) -> Image.Image:
    alpha = image.getchannel("A")
    matte = Image.new("RGBA", image.size, (*fill, 255))
    composited = Image.alpha_composite(matte, image).convert("RGB")
    return Image.merge("RGBA", (*composited.split(), alpha))


def save_webp(
    image: Image.Image,
    name: str,
    size: tuple[int, int],
    matte: tuple[int, int, int],
) -> Path:
    destination = OUTPUT_ROOT / name
    resized = matte_transparent_rgb(image, matte).resize(
        size,
        Image.Resampling.LANCZOS,
    )
    resized = matte_transparent_rgb(resized, matte)
    resized.save(destination, "WEBP", quality=92, method=6, exact=True)
    return destination


def opaque_metrics(image: Image.Image) -> dict[str, object]:
    pixels = np.asarray(image.convert("RGBA"))
    opaque = pixels[..., 3] >= 240
    rgb = pixels[..., :3][opaque]
    if not rgb.size:
        return {"opaque_pixels": 0}
    luminance = rgb @ np.array([0.2126, 0.7152, 0.0722])
    return {
        "opaque_pixels": int(rgb.shape[0]),
        "median_rgb": [
            round(float(value), 2)
            for value in np.median(rgb, axis=0)
        ],
        "std_rgb": [
            round(float(value), 2)
            for value in np.std(rgb, axis=0)
        ],
        "median_luminance": round(float(np.median(luminance)), 2),
    }


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    composer_sheet = Image.open(COMPOSER_SOURCE).convert("RGBA")
    sidebar_row_sheet = Image.open(SIDEBAR_ROW_SOURCE).convert("RGBA")

    # The accepted dark reference averages around RGB(126, 112, 96) in its
    # open paper field. Rebuild every paper surface from the same transparent
    # contract source so main, strip, pill and tile remain one material family.
    composer_main = channel_offset(
        crop(composer_sheet, (36, 105, 1737, 524)),
        PAPER_CHANNEL_OFFSET,
    )
    composer_strip = channel_offset(
        crop(composer_sheet, (224, 572, 1551, 690)),
        PAPER_CHANNEL_OFFSET,
    )
    composer_pill = channel_offset(
        crop(composer_sheet, (557, 736, 1216, 831)),
        PAPER_CHANNEL_OFFSET,
    )
    paper_tile = channel_offset(
        crop(composer_sheet, (616, 215, 1128, 471)),
        PAPER_CHANNEL_OFFSET,
    )

    sidebar_level1 = crop(sidebar_row_sheet, (97, 100, 1676, 323))
    sidebar_selected = crop(sidebar_row_sheet, (97, 397, 1661, 600))
    sidebar_level2_hover = crop(sidebar_row_sheet, (107, 680, 1660, 786))

    outputs = {
        "composer_main": save_webp(
            composer_main,
            "composer-main.webp",
            (1536, 378),
            PAPER_MATTE,
        ),
        "composer_strip": save_webp(
            composer_strip,
            "composer-strip.webp",
            (1536, 136),
            PAPER_MATTE,
        ),
        "composer_pill": save_webp(
            composer_pill,
            "composer-pill.webp",
            (768, 110),
            PAPER_MATTE,
        ),
        "paper_tile": save_webp(
            paper_tile,
            "paper-tile.webp",
            (768, 384),
            PAPER_MATTE,
        ),
        "sidebar_level1": save_webp(
            sidebar_level1,
            "sidebar-level1.webp",
            (768, 96),
            (31, 30, 30),
        ),
        "sidebar_selected": save_webp(
            sidebar_selected,
            "sidebar-selected.webp",
            (768, 96),
            (198, 191, 183),
        ),
        "sidebar_level2_hover": save_webp(
            sidebar_level2_hover,
            "sidebar-level2-hover.webp",
            (768, 52),
            (20, 18, 18),
        ),
    }

    metrics = {
        "contract": "v15-dark-paper-palette-border-image",
        "paper_palette": {
            "target_median_rgb": list(PAPER_TARGET_MEDIAN),
            "channel_offset": list(PAPER_CHANNEL_OFFSET),
            "matte_rgb": list(PAPER_MATTE),
        },
        "source_files": {
            "composer": str(COMPOSER_SOURCE.relative_to(ROOT)).replace("\\", "/"),
            "sidebar_rows": str(SIDEBAR_ROW_SOURCE.relative_to(ROOT)).replace("\\", "/"),
        },
        "outputs": {
            key: {
                "path": str(path.relative_to(ROOT)).replace("\\", "/"),
                "bytes": path.stat().st_size,
                "size": list(Image.open(path).size),
                "metrics": opaque_metrics(Image.open(path)),
            }
            for key, path in outputs.items()
        },
    }
    (OUTPUT_ROOT / "asset-metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
