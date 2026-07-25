from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
UI_ROOT = ROOT / "themes" / "ui" / "v15"
CSS_PATH = ROOT / "runtime" / "forge-background-v13.css"

PAPER_ASSETS = {
    "composer_main": {
        "filename": "composer-main.webp",
        "size": (1536, 378),
        "median": (125, 110, 94),
        "std": ((7, 18), (7, 18), (7, 18)),
    },
    "composer_strip": {
        "filename": "composer-strip.webp",
        "size": (1536, 136),
        "median": (124, 108, 91),
        "std": ((10, 18), (10, 18), (10, 18)),
    },
    "composer_pill": {
        "filename": "composer-pill.webp",
        "size": (768, 110),
        "median": (126, 109, 92),
        "std": ((8, 16), (8, 16), (8, 16)),
    },
    "paper_tile": {
        "filename": "paper-tile.webp",
        "size": (768, 384),
        "median": (127, 113, 97),
        "std": ((3, 9), (3, 9), (3, 9)),
    },
}


def opaque_rgb(path: Path) -> np.ndarray:
    pixels = np.asarray(Image.open(path).convert("RGBA"))
    return pixels[..., :3][pixels[..., 3] >= 240]


def relative_luminance(rgb: np.ndarray) -> np.ndarray:
    normalized = rgb.astype(np.float64) / 255
    linear = np.where(
        normalized <= 0.04045,
        normalized / 12.92,
        ((normalized + 0.055) / 1.055) ** 2.4,
    )
    return linear @ np.array([0.2126, 0.7152, 0.0722])


def contrast_ratio(left: np.ndarray, right: np.ndarray) -> np.ndarray:
    lighter = np.maximum(left, right)
    darker = np.minimum(left, right)
    return (lighter + 0.05) / (darker + 0.05)


class V15DarkPaperMaterialTest(unittest.TestCase):
    def test_generated_paper_assets_match_dark_reference_palette(self) -> None:
        metrics = json.loads(
            (UI_ROOT / "asset-metrics.json").read_text(encoding="utf-8")
        )
        self.assertEqual(
            metrics["contract"],
            "v15-dark-paper-palette-border-image",
        )
        self.assertEqual(metrics["paper_palette"]["target_median_rgb"], [126, 112, 96])
        self.assertEqual(metrics["paper_palette"]["channel_offset"], [-82, -69, -49])
        self.assertEqual(metrics["paper_palette"]["matte_rgb"], [127, 113, 97])

        for key, contract in PAPER_ASSETS.items():
            path = UI_ROOT / contract["filename"]
            with Image.open(path) as image:
                self.assertEqual(image.size, contract["size"], key)
            rgb = opaque_rgb(path)
            median = np.median(rgb, axis=0)
            std = np.std(rgb, axis=0)
            for channel, expected in enumerate(contract["median"]):
                self.assertLessEqual(
                    abs(float(median[channel]) - expected),
                    4,
                    f"{key} channel {channel} median drifted",
                )
            for channel, (minimum, maximum) in enumerate(contract["std"]):
                self.assertGreaterEqual(float(std[channel]), minimum, key)
                self.assertLessEqual(float(std[channel]), maximum, key)
            self.assertEqual(
                metrics["outputs"][key]["size"],
                list(contract["size"]),
            )

    def test_css_uses_dark_fallback_without_gpu_filter(self) -> None:
        css = CSS_PATH.read_text(encoding="utf-8")
        self.assertGreaterEqual(css.count("#7f7161"), 3)
        self.assertNotIn("#d1b78f", css)
        self.assertNotIn("#cfb48a", css)
        self.assertNotIn("filter: contrast(1.16) saturate(.94)", css)

    def test_primary_ink_keeps_three_to_one_contrast_on_dark_paper(self) -> None:
        css = CSS_PATH.read_text(encoding="utf-8")
        primary_match = re.search(
            r"\.forge-composer-frame\s*\{.*?"
            r"--color-token-foreground:\s*(#[0-9a-fA-F]{6})",
            css,
            re.S,
        )
        self.assertIsNotNone(primary_match)
        primary = np.array(
            [
                int(primary_match.group(1)[index:index + 2], 16)
                for index in (1, 3, 5)
            ]
        )
        ink_luminance = float(relative_luminance(primary.reshape(1, 3))[0])

        for key, contract in PAPER_ASSETS.items():
            rgb = opaque_rgb(UI_ROOT / contract["filename"])
            paper_luminance = relative_luminance(rgb)
            representative_dark = float(np.percentile(paper_luminance, 10))
            ratio = float(
                contrast_ratio(
                    np.array([representative_dark]),
                    np.array([ink_luminance]),
                )[0]
            )
            self.assertGreaterEqual(ratio, 3.0, key)


if __name__ == "__main__":
    unittest.main()
