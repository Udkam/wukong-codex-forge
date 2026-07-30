from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "themes" / "ui" / "v14"
OUTPUT_ROOT = ROOT / "themes" / "ui" / "v17"

PAPER_TARGET_MEDIAN = (135, 117, 93)
PAPER_MATTE = PAPER_TARGET_MEDIAN
PAPER_TEXTURE_CONTRAST = 0.86
SOURCE_ASSETS = {
    "composer_main": "composer-main.webp",
    "composer_strip": "composer-strip.webp",
    "composer_pill": "composer-pill.webp",
    "paper_tile": "paper-tile.webp",
}


def rebase_material(image: Image.Image) -> Image.Image:
    pixels = np.asarray(image.convert("RGBA"), dtype=np.float32).copy()
    visible = pixels[..., 3] >= 240
    source_base = np.median(pixels[..., :3][visible], axis=0)
    target = np.asarray(PAPER_TARGET_MEDIAN, dtype=np.float32)
    pixels[..., :3] = np.clip(
        target + (pixels[..., :3] - source_base) * PAPER_TEXTURE_CONTRAST,
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


def periodize_edges(image: Image.Image, feather: int = 8) -> Image.Image:
    """Blend opposite edge pairs so the repeated paper field has no hard seam."""
    pixels = np.asarray(image.convert("RGBA"), dtype=np.float32).copy()
    width = max(1, min(feather, image.width // 2, image.height // 2))
    for offset in range(width):
        weight = (width - offset) / width
        left = pixels[:, offset, :].copy()
        right = pixels[:, -(offset + 1), :].copy()
        average = (left + right) * 0.5
        pixels[:, offset, :] = left * (1 - weight) + average * weight
        pixels[:, -(offset + 1), :] = right * (1 - weight) + average * weight
    for offset in range(width):
        weight = (width - offset) / width
        top = pixels[offset, :, :].copy()
        bottom = pixels[-(offset + 1), :, :].copy()
        average = (top + bottom) * 0.5
        pixels[offset, :, :] = top * (1 - weight) + average * weight
        pixels[-(offset + 1), :, :] = bottom * (1 - weight) + average * weight
    return Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8), "RGBA")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(64 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def opaque_metrics(image: Image.Image) -> dict[str, object]:
    pixels = np.asarray(image.convert("RGBA"))
    opaque = pixels[..., 3] >= 240
    rgb = pixels[..., :3][opaque]
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


def alpha_metrics(image: Image.Image) -> dict[str, object]:
    alpha = np.asarray(image.convert("RGBA"))[..., 3]
    return {
        "min": int(alpha.min()),
        "max": int(alpha.max()),
        "transparent_pixels": int(np.count_nonzero(alpha == 0)),
        "transparent_ratio": round(
            float(np.count_nonzero(alpha == 0) / alpha.size),
            6,
        ),
    }


def save_asset(key: str, source: Path) -> Path:
    with Image.open(source) as source_image:
        material = rebase_material(source_image)
    material = matte_transparent_rgb(material, PAPER_MATTE)
    if key == "paper_tile":
        material = material.resize((384, 192), Image.Resampling.LANCZOS)
        material = periodize_edges(material)
    destination = OUTPUT_ROOT / source.name
    if key == "paper_tile":
        material.save(
            destination,
            "WEBP",
            lossless=True,
            method=6,
            exact=True,
        )
    else:
        material.save(
            destination,
            "WEBP",
            quality=92,
            method=6,
            exact=True,
        )
    return destination


def output_metrics(path: Path) -> dict[str, object]:
    with Image.open(path) as image:
        return {
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "bytes": path.stat().st_size,
            "size": list(image.size),
            "metrics": opaque_metrics(image),
            "alpha": alpha_metrics(image),
        }


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    sources = {
        key: SOURCE_ROOT / filename
        for key, filename in SOURCE_ASSETS.items()
    }
    outputs = {
        key: save_asset(key, source)
        for key, source in sources.items()
    }
    metrics = {
        "contract": "v21-full-field-dark-paper",
        "paper_palette": {
            "target_median_rgb": list(PAPER_TARGET_MEDIAN),
            "matte_rgb": list(PAPER_MATTE),
            "texture_contrast": PAPER_TEXTURE_CONTRAST,
            "centre_contract": "opaque",
        },
        "source_files": {
            key: {
                "path": str(path.relative_to(ROOT)).replace("\\", "/"),
                "sha256": sha256(path),
            }
            for key, path in sources.items()
        },
        "outputs": {
            key: output_metrics(path)
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
