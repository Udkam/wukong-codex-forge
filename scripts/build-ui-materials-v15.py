from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "themes" / "ui" / "v14" / "sources"
OUTPUT_ROOT = ROOT / "themes" / "ui" / "v15"

COMPOSER_SOURCE = SOURCE_ROOT / "composer-paper-sheet-alpha-contract.png"
SIDEBAR_ROW_SOURCE = SOURCE_ROOT / "sidebar-row-sheet-alpha-contract.png"
LANDING_MARK_SOURCE = OUTPUT_ROOT / "sources" / "jingubang-model.png"
PAPER_CHANNEL_OFFSET = (-84, -72, -56)
PAPER_MATTE = (125, 109, 90)
PAPER_TARGET_MEDIAN = (124, 108, 88)
LANDING_MARK_RENDER_SCALE = 4
LANDING_MARK_NATIVE_SIZE = 56
LANDING_MARK_NATIVE_LENGTH = 60
LANDING_MARK_NATIVE_THICKNESS = 12
LANDING_MARK_ROTATION = 39


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


def tone_landing_mark(image: Image.Image) -> Image.Image:
    """Keep the photographed staff geometry and strengthen its real metal range."""
    pixels = np.asarray(image.convert("RGBA"), dtype=np.float32).copy()
    rgb = pixels[..., :3]
    alpha = pixels[..., 3:4]
    luminance = (
        rgb[..., 0:1] * 0.2126
        + rgb[..., 1:2] * 0.7152
        + rgb[..., 2:3] * 0.0722
    )
    highlight = np.clip((luminance - 48) / 92, 0, 1)
    rgb = (
        rgb * np.array([1.35, 1.23, 1.04], dtype=np.float32)
        + np.array([6, 4, 0], dtype=np.float32)
        + highlight * np.array([60, 48, 28], dtype=np.float32)
    )
    pixels[..., :3] = np.clip(rgb, 0, 255)
    pixels[..., 3:4] = alpha
    return Image.fromarray(pixels.astype(np.uint8), "RGBA")


def add_landing_mark_outline(image: Image.Image) -> Image.Image:
    """Add a sub-pixel umber edge so the native icon survives pale scenes."""
    alpha = image.getchannel("A")
    expanded = alpha.filter(ImageFilter.MaxFilter(9))
    expanded_pixels = np.asarray(expanded, dtype=np.int16)
    alpha_pixels = np.asarray(alpha, dtype=np.int16)
    outline_alpha = np.clip(
        (expanded_pixels - alpha_pixels) * 0.72,
        0,
        180,
    ).astype(np.uint8)
    outline = Image.new("RGBA", image.size, (46, 33, 22, 0))
    outline.putalpha(Image.fromarray(outline_alpha, "L"))
    return Image.alpha_composite(outline, image)


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


def build_landing_mark(image: Image.Image) -> Image.Image:
    source = tone_landing_mark(image)
    alpha_box = source.getchannel("A").getbbox()
    if not alpha_box:
        raise ValueError("Landing mark source has no visible pixels")
    source = source.crop(alpha_box)
    scale = LANDING_MARK_RENDER_SCALE
    staff = source.resize(
        (
            LANDING_MARK_NATIVE_LENGTH * scale,
            LANDING_MARK_NATIVE_THICKNESS * scale,
        ),
        Image.Resampling.LANCZOS,
    )
    staff = ImageEnhance.Contrast(staff).enhance(1.08)
    staff = ImageEnhance.Sharpness(staff).enhance(1.28)
    staff = staff.rotate(
        LANDING_MARK_ROTATION,
        expand=True,
        resample=Image.Resampling.BICUBIC,
    )
    canvas = Image.new(
        "RGBA",
        (
            LANDING_MARK_NATIVE_SIZE * scale,
            LANDING_MARK_NATIVE_SIZE * scale,
        ),
        (0, 0, 0, 0),
    )
    canvas.alpha_composite(
        staff,
        (
            (canvas.width - staff.width) // 2,
            (canvas.height - staff.height) // 2,
        ),
    )
    return add_landing_mark_outline(canvas).resize(
        (112, 112),
        Image.Resampling.LANCZOS,
    )


def save_alpha_webp(image: Image.Image, name: str) -> Path:
    destination = OUTPUT_ROOT / name
    image.save(destination, "WEBP", quality=92, method=6, exact=True)
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
    landing_mark_source = Image.open(LANDING_MARK_SOURCE).convert("RGBA")

    # The reviewed multi-background palette keeps the prior darkness while
    # shifting the open paper field toward warmer grey-yellow ochre. Rebuild
    # every paper surface from one transparent contract source so main, strip,
    # pill and tile remain one material family.
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
        "landing_mark": save_alpha_webp(
            build_landing_mark(landing_mark_source),
            "landing-jingubang.webp",
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
            "landing_mark": str(LANDING_MARK_SOURCE.relative_to(ROOT)).replace("\\", "/"),
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
