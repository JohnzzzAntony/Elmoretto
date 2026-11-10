"""Build the harvest film at 1920 x 1080 with Real-ESRGAN (scripts/upscale.py).

Frames 0-121 come from the clean 1280 x 720 cut in source-assets/film/desktop (plantation to the split
cherry): each is reduced to 960 x 540, upscaled 4x and reduced to 1920 x 1080.

The rest comes from the full screen recording (280 x 198, a hand-held phone shot of a laptop):
green beans, the roaster, the flame, the roasted beans and the "From soil to pour" landing. Each
frame is upscaled 4x, then the laptop screen is found and straightened into 1920 x 1080. (A second
4x pass only made it look painted.)

Usage: python scripts/prepare-harvest.py "<recording.mp4>" [first last]   (needs Pillow, numpy, torch, imageio-ffmpeg)
"""

import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from upscale import SCALE, load, upscale

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source-assets" / "film" / "desktop"
OUT = ROOT / "source-assets" / "film" / "hd"
KEEP = 122  # clean frames used as they are
EXTRA = (194, 425)  # recording frames (30 fps) from the green beans to the landing, before the cursor shows
STEP = 1.25  # 30 fps -> the 24 fps of the clean cut, so both parts play at the same pace
EXTRA_FRAMES = [round(EXTRA[0] + k * STEP) for k in range(int((EXTRA[1] - EXTRA[0]) / STEP) + 1)]
COUNT = KEEP + len(EXTRA_FRAMES)
MID = (960, 540)


def tensor(pixels):
    return torch.from_numpy(np.array(pixels, dtype=np.float32) / 255).permute(2, 0, 1)[None]


def save(frame, index):
    frame.save(OUT / f"{index:03}.webp", "WEBP", quality=80, method=5)


def read_recording(path):
    reader = imageio_ffmpeg.read_frames(str(path))
    meta = next(reader)
    w, h = meta["size"]
    return [np.frombuffer(f, np.uint8).reshape(h, w, 3) for f in reader]


def measure(rgb):
    """Screen edges in one frame: the browser bar marks the top, left and right; the dark bezel the bottom."""
    gray = rgb.mean(2)
    h, w = gray.shape
    top, bottom = [], []
    for x in range(0, w, 2):
        bright = gray[: h // 2, x] > 185
        for y in range(h // 2 - 3):
            if bright[y : y + 3].all():
                end = y
                while end < h // 2 and bright[end]:
                    end += 1
                if end - y < 16:
                    top.append((x, end))
                break
        column = gray[:, x]
        for y in range(h - 5, h // 2, -1):
            if column[y - 4 : y].mean() > 70 and column[y : y + 4].mean() < 55:
                bottom.append((x, y))
                break
    nan = (np.nan,) * 2
    t = np.polyfit(*np.array(top).T, 1) if len(top) > 20 else nan
    b = np.polyfit(*np.array(bottom).T, 1) if len(bottom) > 40 else nan
    xs = [x for x, _ in top]
    left, right = (min(xs), max(xs)) if len(top) > 20 else nan
    return [*t, *b, left, right]


def smooth(values, radius=4):
    """Per-parameter running median over time; frames where detection failed borrow their neighbours'."""
    values = np.array(values, float)
    out = np.empty_like(values)
    for i in range(len(values)):
        out[i] = np.nanmedian(values[max(0, i - radius) : i + radius + 1], axis=0)
    return out


def straighten(model, rgb, edges):
    tk, tb, bk, bb, left, right = edges
    left, right = left + 3, right - 4  # stay inside the bezel and below the browser bar
    corners = [(left, tk * left + tb + 4), (right, tk * right + tb + 4), (right, bk * right + bb - 3), (left, bk * left + bb - 3)]
    source = upscale(model, tensor(rgb))
    _, _, sh, sw = source.shape
    v, u = torch.meshgrid(torch.linspace(0, 1, 1080), torch.linspace(0, 1, 1920), indexing="ij")
    # shortcut: bilinear blend of the four corners instead of a true homography; the keystone here is a few pixels.
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = corners
    x = (1 - v) * ((1 - u) * x0 + u * x1) + v * ((1 - u) * x3 + u * x2)
    y = (1 - v) * ((1 - u) * y0 + u * y1) + v * ((1 - u) * y3 + u * y2)
    x, y = (x + 0.5) * SCALE - 0.5, (y + 0.5) * SCALE - 0.5
    grid = torch.stack([x / (sw - 1) * 2 - 1, y / (sh - 1) * 2 - 1], -1)[None]
    flat = F.grid_sample(source, grid, mode="bicubic", padding_mode="border", align_corners=True).clamp(0, 1)
    return Image.fromarray((flat[0].permute(1, 2, 0) * 255).round().byte().numpy())


def main():
    recording = Path(sys.argv[1])
    first, last = (int(a) for a in sys.argv[2:4]) if len(sys.argv) > 3 else (0, COUNT - 1)
    OUT.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(8)
    model = load()
    frames = read_recording(recording)
    edges = smooth([measure(frames[i]) for i in EXTRA_FRAMES])
    assert not np.isnan(edges).any(), "screen edges not found"
    for index in range(first, last + 1):
        if index < KEEP:
            with Image.open(SOURCE / f"{index:03}.webp") as image:
                small = tensor(image.convert("RGB").resize(MID, Image.Resampling.LANCZOS))
            big = (upscale(model, small)[0].permute(1, 2, 0) * 255).round().byte().numpy()
            frame = Image.fromarray(big).resize((1920, 1080), Image.Resampling.LANCZOS)
        else:
            k = index - KEEP
            frame = straighten(model, frames[EXTRA_FRAMES[k]], edges[k])
        save(frame, index)
    print(f"Wrote frames {first}-{last} of {COUNT} at 1920 x 1080 to {OUT}")


if __name__ == "__main__":
    main()
