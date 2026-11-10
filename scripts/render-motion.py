"""Render silent, frame-seekable motion from public/cinema's 4K stills.

Usage: py scripts/render-motion.py [scene ...]
Requires Pillow, NumPy and imageio-ffmpeg.
"""

import math
from pathlib import Path
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT = 3840, 2160
FPS, FRAMES = 30, 48

# Final zoom and crop center, portrait framing, and the matching second pose.
SHOTS = {
    "mountain": (1.27, .61, .44, .70, None),
    "cherry": (1.23, .59, .47, .68, None),
    "harvest": (1.22, .59, .63, .74, None),
    "drum": (1.25, .59, .61, .65, None),
    "roast": (1.29, .60, .57, .67, None),
    "bean": (1.16, .54, .48, .59, "bean-open"),
    "bloom": (1.14, .56, .45, .61, "bloom-rise"),
    "pour": (1.15, .54, .52, .62, "pour-finish"),
    "cup": (1.14, .57, .51, .59, None),
}

# Positions in an 840 × 472 reference grid. The particles use the photographed
# fruit and beans, with distinct paths from the hand or chute to the catch tray.
FALLS = {
    "harvest": ((495, 233), (475, 302), 26, ((503, 253, 25, 28), (454, 251, 18, 20), (474, 275, 24, 26))),
    "drum": ((535, 179), (480, 345), 33, ((467, 207, 18, 23), (452, 274, 17, 20), (529, 287, 22, 27))),
    "roast": ((619, 116), (493, 290), 52, ((418, 252, 25, 18), (480, 176, 25, 23), (459, 207, 23, 24))),
}


def smooth(t):
    t = max(0, min(1, t))
    return t * t * (3 - 2 * t)


def load(name):
    return Image.open(ROOT / "public" / "cinema" / f"{name}-3840.webp").convert("RGB")


def warp(image, anchors, amount):
    """Move matching landmarks with a smooth displacement field on a coarse mesh."""
    columns, rows = 24, 14
    xs = np.linspace(0, 1, columns + 1)
    ys = np.linspace(0, 1, rows + 1)
    x, y = np.meshgrid(xs, ys)
    u, v = x.copy(), y.copy()
    for cx, cy, dx, dy, rx, ry in anchors:
        falloff = np.exp(-2 * (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2))
        u -= amount * dx * falloff
        v -= amount * dy * falloff
    points = np.stack((u * WIDTH, v * HEIGHT), axis=-1)
    mesh = []
    for row in range(rows):
        for col in range(columns):
            box = (round(xs[col] * WIDTH), round(ys[row] * HEIGHT),
                   round(xs[col + 1] * WIDTH), round(ys[row + 1] * HEIGHT))
            corners = points[[row, row + 1, row + 1, row], [col, col, col + 1, col + 1]]
            mesh.append((box, tuple(corners.flatten())))
    return image.transform(image.size, Image.Transform.MESH, mesh, Image.Resampling.BICUBIC)


def pose(name, first, last, t):
    mix = smooth((t - .24) / .46)
    if last is None or mix == 0:
        return first
    if mix == 1:
        return last
    if name == "bean":
        # Follow the two halves as the seam opens. Each endpoint travels toward the middle pose.
        left = (.48, .53, -.044, 0, .19, .32)
        right = (.68, .51, .029, 0, .16, .30)
        first = warp(first, (left, right), mix)
        last = warp(last, ((.436, .53, -.044, 0, .19, .32),
                           (.709, .51, .029, 0, .16, .30)), mix - 1)
    elif name == "bloom":
        first = warp(first, ((.58, .25, 0, -.020, .14, .10),
                             (.58, .77, 0, -.022, .15, .09)), mix)
    elif name == "pour":
        first = warp(first, ((.54, .46, .014, -.015, .09, .18),), mix)
    return Image.blend(first, last, mix)


def falling_sprites(name, photo):
    if name not in FALLS:
        return ()
    sprites = []
    for x, y, width, height in FALLS[name][3]:
        box = (round((x - width / 2) * WIDTH / 840), round((y - height / 2) * HEIGHT / 472),
               round((x + width / 2) * WIDTH / 840), round((y + height / 2) * HEIGHT / 472))
        sprite = photo.crop(box)
        mask = Image.new("L", sprite.size)
        ImageDraw.Draw(mask).ellipse((3, 3, sprite.width - 4, sprite.height - 4), fill=255)
        sprite.putalpha(mask.filter(ImageFilter.GaussianBlur(2)))
        sprites.append(sprite)
    return sprites


def add_fall(name, image, sprites, t):
    start, end, spread, _ = FALLS[name]
    image = image.copy()
    strength = smooth(t / .14) * smooth((1 - t) / .14)
    for i in range(10):
        phase = (t * 3 + i * .381966) % 1
        fall = phase ** 1.6
        alpha = strength * smooth(phase / .12) * smooth((1 - phase) / .22)
        if alpha < .03:
            continue
        x = start[0] + (end[0] - start[0]) * fall + math.sin(i * 6.8 + fall * 2) * spread * fall
        y = start[1] + (end[1] - start[1]) * fall
        sprite = sprites[i % len(sprites)].rotate(i * 37 + phase * 150, Image.Resampling.BICUBIC, expand=True)
        mask = sprite.getchannel("A").point([round(alpha * level) for level in range(256)])
        image.paste(sprite, (round(x * WIDTH / 840 - sprite.width / 2),
                             round(y * HEIGHT / 472 - sprite.height / 2)), mask)
    return image


def frame(name, spec, first, last, sprites, t):
    zoom, final_x, final_y, _, _ = spec
    travel = math.sin(math.pi * t / 2) if name == "mountain" else smooth(t)
    scale = 1 + (zoom - 1) * travel
    span_x, span_y = WIDTH / scale, HEIGHT / scale
    cx = WIDTH * (.5 + (final_x - .5) * travel)
    cy = HEIGHT * (.5 + (final_y - .5) * travel)
    left = min(WIDTH - span_x, max(0, cx - span_x / 2))
    top = min(HEIGHT - span_y, max(0, cy - span_y / 2))
    image = pose(name, first, last, t)
    if t == 0:
        return image
    if sprites:
        image = add_fall(name, image, sprites, t)
    return image.resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC,
                        box=(left, top, left + span_x, top + span_y))


def render(name, spec):
    folder = ROOT / "public" / "motion"
    folder.mkdir(parents=True, exist_ok=True)
    first, last = load(name), load(spec[4]) if spec[4] else None
    sprites = falling_sprites(name, first)
    # Phones get a full-height 1350 × 2160 crop: a 3x phone fills 2500+ physical rows, so anything shorter looks soft.
    portrait_width = 1350
    portrait_x = round(WIDTH * spec[3] - portrait_width / 2)
    first.crop((portrait_x, 0, portrait_x + portrait_width, HEIGHT)).save(
        ROOT / "public" / "cinema" / f"{name}-portrait.webp", quality=84, method=6)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    filters = (
        f"[0:v]format=yuv420p,split=3[uhd][wide][portrait];"
        f"[wide]scale=1920:1080:flags=lanczos[hd];"
        f"[portrait]crop={portrait_width}:{HEIGHT}:{portrait_x}:0[phone]"
    )
    command = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-filter_complex_threads", "4",
               "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", f"{WIDTH}x{HEIGHT}",
               "-framerate", str(FPS), "-i", "-", "-filter_complex", filters]
    outputs = []
    for stream, variant, quality in (("uhd", "3840", "23"), ("hd", "1920", "24"), ("phone", "portrait", "20")):
        output = folder / f"{name}-{variant}.mp4"
        temp = output.with_suffix(".partial.mp4")
        outputs.append((temp, output))
        command.extend(["-map", f"[{stream}]", "-c:v", "libx264", "-preset", "veryfast", "-crf", quality,
                        "-g", "9", "-sc_threshold", "0", "-bf", "0", "-threads", "3",
                        "-movflags", "+faststart", "-an", str(temp)])
    with subprocess.Popen(command, stdin=subprocess.PIPE) as encoder:
        try:
            for index in range(FRAMES):
                encoder.stdin.write(frame(name, spec, first, last, sprites, index / (FRAMES - 1)).tobytes())
        finally:
            encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError(f"Encoding failed for {name}")
    for temp, output in outputs:
        temp.replace(output)
    print(f"{name}: {FRAMES} frames, {sum(out.stat().st_size for _, out in outputs) / 1e6:.2f} MB", flush=True)


if __name__ == "__main__":
    for scene in sys.argv[1:] or SHOTS:
        render(scene, SHOTS[scene])
