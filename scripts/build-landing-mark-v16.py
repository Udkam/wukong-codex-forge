from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "themes" / "ui" / "v16" / "sources" / "steam-black-myth-wukong-logo-2x.png"
OUTPUT_ROOT = ROOT / "themes" / "ui" / "v16"
SOURCE_URL = "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/logo_2x.png"
EXPECTED_SOURCE_SHA256 = "9b627bee5be0db718a837a5ddfe1d367e02577aa5df6168a5774382af2bc0fa0"
WORDMARK_CROP = (20, 290, 525, 660)
OUTPUT_SIZE = (336, 336)
CONTENT_SIZE = (282, 204)
CONTENT_OFFSET = (0, -42)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def crop_official_wordmark(source: Image.Image) -> Image.Image:
    wordmark = source.convert("RGBA").crop(WORDMARK_CROP)
    alpha_box = wordmark.getchannel("A").getbbox()
    if not alpha_box:
        raise ValueError("Official logo crop has no visible pixels")
    return wordmark.crop(alpha_box)


def recolor_wordmark(
    wordmark: Image.Image,
    shadow: tuple[int, int, int],
    fill: tuple[int, int, int],
) -> Image.Image:
    pixels = np.asarray(wordmark.convert("RGBA"), dtype=np.float32)
    rgb = pixels[..., :3]
    alpha = pixels[..., 3]
    red_seal = (
        (rgb[..., 0] > 75)
        & (rgb[..., 0] > rgb[..., 1] * 1.35)
        & (rgb[..., 0] > rgb[..., 2] * 1.25)
    )
    luminance = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    weight = np.clip(luminance / 178.0, 0, 1)[..., None]
    toned = (
        np.asarray(shadow, dtype=np.float32) * (1 - weight)
        + np.asarray(fill, dtype=np.float32) * weight
    )
    toned[red_seal] = np.stack(
        (
            np.clip(rgb[..., 0][red_seal] * 0.92 + 18, 0, 180),
            np.clip(rgb[..., 1][red_seal] * 0.55, 20, 62),
            np.clip(rgb[..., 2][red_seal] * 0.48, 14, 48),
        ),
        axis=1,
    )
    return Image.fromarray(
        np.dstack((np.clip(toned, 0, 255).astype(np.uint8), alpha.astype(np.uint8))),
        "RGBA",
    )


def fit_native_slot(wordmark: Image.Image) -> Image.Image:
    fitted = wordmark.copy()
    fitted.thumbnail(CONTENT_SIZE, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", OUTPUT_SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(
        fitted,
        (
            (canvas.width - fitted.width) // 2 + CONTENT_OFFSET[0],
            (canvas.height - fitted.height) // 2 + CONTENT_OFFSET[1],
        ),
    )
    return canvas


def save_webp(image: Image.Image, name: str) -> Path:
    destination = OUTPUT_ROOT / name
    image.save(destination, "WEBP", quality=94, method=6, exact=True)
    return destination


def output_record(path: Path, image: Image.Image) -> dict[str, object]:
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": sha256(path),
        "bytes": path.stat().st_size,
        "size": list(image.size),
        "visible_bbox": list(image.getchannel("A").getbbox() or (0, 0, 0, 0)),
    }


def main() -> None:
    if sha256(SOURCE) != EXPECTED_SOURCE_SHA256:
        raise ValueError("Official Steam logo source hash changed")
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    official = crop_official_wordmark(Image.open(SOURCE))
    light = fit_native_slot(
        recolor_wordmark(
            official,
            shadow=(22, 17, 13),
            fill=(226, 211, 181),
        )
    )
    dark = fit_native_slot(
        recolor_wordmark(
            official,
            shadow=(17, 14, 12),
            fill=(63, 50, 37),
        )
    )
    light_path = save_webp(light, "landing-wukong-wordmark-light.webp")
    dark_path = save_webp(dark, "landing-wukong-wordmark-dark.webp")
    metrics = {
        "contract": "v16-official-wukong-wordmark-threefold-paint",
        "source": {
            "path": SOURCE.relative_to(ROOT).as_posix(),
            "url": SOURCE_URL,
            "sha256": EXPECTED_SOURCE_SHA256,
            "crop": list(WORDMARK_CROP),
        },
        "native_slot": [56, 56],
        "render_size": list(OUTPUT_SIZE),
        "content_size": list(CONTENT_SIZE),
        "content_offset": list(CONTENT_OFFSET),
        "outputs": {
            "light": output_record(light_path, light),
            "dark": output_record(dark_path, dark),
        },
        "scene_policy": {
            "dark_wordmark": [0, 4, 8],
            "light_wordmark": [1, 2, 3, 5, 6, 7],
        },
        "restrictions": [
            "No generated weapon, mascot, emoji, glow, or cartoon silhouette.",
            "Official 悟空 brush lettering and red seal remain the only motif.",
            "The 336x336 source paints a 168x168 overlay for two-device-pixel fidelity.",
            "The native 56x56 layout and hit target remain unchanged.",
        ],
    }
    (OUTPUT_ROOT / "landing-mark-metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
