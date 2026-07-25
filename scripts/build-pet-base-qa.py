from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image


def parse_hex_color(value: str) -> tuple[int, int, int]:
    normalized = value.strip().lstrip("#")
    if len(normalized) != 6:
        raise argparse.ArgumentTypeError("expected a six-digit RGB color")
    try:
        return tuple(
            int(normalized[index : index + 2], 16)
            for index in (0, 2, 4)
        )
    except ValueError as error:
        raise argparse.ArgumentTypeError("expected a six-digit RGB color") from error


def require_new_file(path: Path) -> None:
    if path.exists():
        raise FileExistsError(f"refusing to overwrite existing file: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)


def alpha_bbox(image: Image.Image, threshold: int) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > threshold)
    if len(xs) == 0:
        raise ValueError("input has no visible pixels above the alpha threshold")
    return (
        int(xs.min()),
        int(ys.min()),
        int(xs.max()) + 1,
        int(ys.max()) + 1,
    )


def key_residue_metrics(
    image: Image.Image,
    key_color: tuple[int, int, int] | None,
    alpha_threshold: int,
) -> dict[str, int | float] | None:
    if key_color is None:
        return None
    rgba = np.asarray(image.convert("RGBA")).astype(np.int16)
    visible = rgba[..., 3] > alpha_threshold
    if not np.any(visible):
        return {
            "visible_pixels": 0,
            "key_dominant_pixels": 0,
            "key_dominant_ratio": 0.0,
        }

    rgb = rgba[..., :3]
    key = np.asarray(key_color, dtype=np.int16)
    distance = np.linalg.norm(rgb - key, axis=2)
    dominant_channel = int(np.argmax(key))
    other_channels = [index for index in range(3) if index != dominant_channel]
    dominance = (
        rgb[..., dominant_channel]
        - np.maximum(rgb[..., other_channels[0]], rgb[..., other_channels[1]])
    )
    key_dominant = visible & (distance < 105) & (dominance > 42)
    visible_count = int(np.count_nonzero(visible))
    residue_count = int(np.count_nonzero(key_dominant))
    return {
        "visible_pixels": visible_count,
        "key_dominant_pixels": residue_count,
        "key_dominant_ratio": round(residue_count / visible_count, 6),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Fit a transparent Hatch Pet base candidate into one native Codex "
            "cell and write deterministic QA evidence."
        )
    )
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--cell-out", required=True, type=Path)
    parser.add_argument("--preview-out", required=True, type=Path)
    parser.add_argument("--metrics-out", required=True, type=Path)
    parser.add_argument("--cell-width", type=int, default=192)
    parser.add_argument("--cell-height", type=int, default=208)
    parser.add_argument("--margin-x", type=int, default=18)
    parser.add_argument("--margin-y", type=int, default=16)
    parser.add_argument("--alpha-threshold", type=int, default=16)
    parser.add_argument("--preview-scale", type=int, default=4)
    parser.add_argument(
        "--preview-background",
        type=parse_hex_color,
        default=parse_hex_color("#171917"),
    )
    parser.add_argument("--key-color", type=parse_hex_color)
    args = parser.parse_args()

    for output in (args.cell_out, args.preview_out, args.metrics_out):
        require_new_file(output)

    source = Image.open(args.input).convert("RGBA")
    source_bbox = alpha_bbox(source, args.alpha_threshold)
    visible = source.crop(source_bbox)

    available_width = args.cell_width - (2 * args.margin_x)
    available_height = args.cell_height - (2 * args.margin_y)
    if available_width <= 0 or available_height <= 0:
        raise ValueError("safe margins leave no usable cell area")

    scale = min(
        available_width / visible.width,
        available_height / visible.height,
    )
    fitted_size = (
        max(1, round(visible.width * scale)),
        max(1, round(visible.height * scale)),
    )
    fitted = visible.resize(fitted_size, Image.Resampling.LANCZOS)
    placement = (
        (args.cell_width - fitted.width) // 2,
        (args.cell_height - fitted.height) // 2,
    )

    cell = Image.new("RGBA", (args.cell_width, args.cell_height), (0, 0, 0, 0))
    cell.alpha_composite(fitted, placement)
    cell.save(args.cell_out)

    background = Image.new(
        "RGBA",
        cell.size,
        (*args.preview_background, 255),
    )
    preview = Image.alpha_composite(background, cell).convert("RGB").resize(
        (
            args.cell_width * args.preview_scale,
            args.cell_height * args.preview_scale,
        ),
        Image.Resampling.NEAREST,
    )
    preview.save(args.preview_out)

    cell_bbox = alpha_bbox(cell, args.alpha_threshold)
    margins = {
        "left": cell_bbox[0],
        "top": cell_bbox[1],
        "right": args.cell_width - cell_bbox[2],
        "bottom": args.cell_height - cell_bbox[3],
    }
    metrics = {
        "contract": "hatch-pet-v2-canonical-base-native-cell",
        "input": str(args.input),
        "source_size": list(source.size),
        "source_alpha_bbox": list(source_bbox),
        "cell_size": [args.cell_width, args.cell_height],
        "safe_margin": [args.margin_x, args.margin_y],
        "fitted_size": list(fitted_size),
        "placement": list(placement),
        "cell_alpha_bbox": list(cell_bbox),
        "actual_margins": margins,
        "safe_margin_pass": (
            margins["left"] >= args.margin_x
            and margins["right"] >= args.margin_x
            and margins["top"] >= args.margin_y
            and margins["bottom"] >= args.margin_y
        ),
        "key_residue": key_residue_metrics(
            cell,
            args.key_color,
            args.alpha_threshold,
        ),
    }
    args.metrics_out.write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
