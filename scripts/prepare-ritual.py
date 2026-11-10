"""Straighten the laptop screen in the supplied recording and export it as a clean landscape film.

The recording is a hand-held phone capture: the screen sits at an angle and drifts slowly.
Each frame is upscaled 4x with Real-ESRGAN (scripts/upscale.py), then perspective-corrected
onto a flat rectangle and cropped below the recorded site's own menu bar.

Usage: python scripts/prepare-ritual.py [first last]   (needs Pillow, numpy, torch)
"""

import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from upscale import SCALE, load, upscale

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "ritual"
COUNT = 594
STEP = 2  # every other frame is plenty once the player blends between them
SCREEN_ASPECT = 1.54  # the laptop's display
KEEP = (0.135, 0.975)  # vertical slice of the screen: below its menu bar, above the bezel
LEFT = 0.04  # trims the bezel on the left
WIDTH = 1920
REGION = (30, 0, 784, 660)  # part of the source frame that holds the screen


def edges(t):
    """Screen edges at clip position t (0..1), measured from clean frames and fitted linearly."""
    left = (-0.109 - 0.020 * t, 98.2 + 18.4 * t)  # x = a*y + b
    top = (0.068 + 0.009 * t, 13.7 - 18.2 * t)  # y = a*x + b
    bottom = (0.138 + 0.037 * t, 567.7 - 14.6 * t)
    # The right edge is out of shot. Take a line parallel to the left one that stays inside the picture.
    right = (left[0], 780 - left[0] * (top[0] * 780 + top[1]))
    return left, top, bottom, right


def meet(vertical, horizontal):
    (a, b), (c, d) = vertical, horizontal
    y = (c * b + d) / (1 - a * c)
    return a * y + b, y


def homography(dst, src):
    rows, rhs = [], []
    for (u, v), (x, y) in zip(dst, src):
        rows += [[u, v, 1, 0, 0, 0, -u * x, -v * x], [0, 0, 0, u, v, 1, -u * y, -v * y]]
        rhs += [x, y]
    return np.append(np.linalg.solve(np.array(rows, float), np.array(rhs, float)), 1).reshape(3, 3)


def screen_to_image(t):
    left, top, bottom, right = edges(t)
    corners = [meet(left, top), meet(right, top), meet(right, bottom), meet(left, bottom)]
    return homography([(0, 0), (1, 0), (1, 1), (0, 1)], corners)


def visible_aspect():
    # The camera notch marks the middle of the display, which tells how much of its width is in shot.
    h = np.linalg.inv(screen_to_image(40 / COUNT))
    x = 445.0
    u, _, w = h @ np.array([x, 0.068 * x + 13.0, 1])
    return SCREEN_ASPECT / (2 * u / w) * (1 - LEFT) / (KEEP[1] - KEEP[0])


HEIGHT = round(WIDTH / visible_aspect() / 2) * 2
MODEL = load()


def render(index):
    h = screen_to_image((index - 1) / (COUNT - 1))
    with Image.open(ROOT / f"frame_{index:04}.jpg") as image:
        source = torch.from_numpy(np.array(image.convert("RGB").crop(REGION))).permute(2, 0, 1).float()[None] / 255
    source = upscale(MODEL, source) * 255
    _, _, sh, sw = source.shape
    v, u = torch.meshgrid(torch.linspace(KEEP[0], KEEP[1], HEIGHT), torch.linspace(LEFT, 1, WIDTH), indexing="ij")
    hm = torch.tensor(h, dtype=torch.float32)
    w = hm[2, 0] * u + hm[2, 1] * v + hm[2, 2]
    x = (hm[0, 0] * u + hm[0, 1] * v + hm[0, 2]) / w
    y = (hm[1, 0] * u + hm[1, 1] * v + hm[1, 2]) / w
    x = (x - REGION[0]) * SCALE
    y = (y - REGION[1]) * SCALE
    grid = torch.stack([x / (sw - 1) * 2 - 1, y / (sh - 1) * 2 - 1], -1)[None]
    flat = F.grid_sample(source, grid, mode="bicubic", padding_mode="border", align_corners=True)
    pixels = flat[0].clamp(0, 255).permute(1, 2, 0).byte().numpy()
    Image.fromarray(pixels).save(OUT / f"{(index - 1) // STEP:03}.webp", "WEBP", quality=80, method=5)


def main():
    first, last = (int(a) for a in sys.argv[1:3]) if len(sys.argv) > 2 else (1, COUNT)
    OUT.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(8)
    for index in range(first, last + 1, STEP):
        render(index)
    print(f"Wrote frames {first}-{last} at {WIDTH} x {HEIGHT} to {OUT}")


if __name__ == "__main__":
    main()
