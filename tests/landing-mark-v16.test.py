from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
UI_ROOT = ROOT / "themes" / "ui" / "v16"
SOURCE = UI_ROOT / "sources" / "steam-black-myth-wukong-logo-2x.png"
EXPECTED_SOURCE_SHA256 = (
    "9b627bee5be0db718a837a5ddfe1d367e02577aa5df6168a5774382af2bc0fa0"
)


class LandingMarkV16Test(unittest.TestCase):
    def test_official_source_and_native_slot_contract(self) -> None:
        self.assertEqual(
            hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
            EXPECTED_SOURCE_SHA256,
        )
        metrics = json.loads(
            (UI_ROOT / "landing-mark-metrics.json").read_text(encoding="utf-8")
        )
        self.assertEqual(metrics["native_slot"], [56, 56])
        self.assertEqual(metrics["render_size"], [336, 336])
        self.assertEqual(metrics["content_size"], [282, 204])
        self.assertEqual(metrics["content_offset"], [0, -42])
        self.assertEqual(metrics["scene_policy"]["dark_wordmark"], [0, 4, 8])

        for variant in ("light", "dark"):
            record = metrics["outputs"][variant]
            asset = ROOT / record["path"]
            with Image.open(asset) as image:
                rgba = image.convert("RGBA")
                self.assertEqual(rgba.size, (336, 336))
                self.assertEqual(list(rgba.getchannel("A").getbbox()), [27, 30, 309, 221])
            self.assertLess(asset.stat().st_size, 40960)
            self.assertEqual(
                hashlib.sha256(asset.read_bytes()).hexdigest(),
                record["sha256"],
            )


if __name__ == "__main__":
    unittest.main()
