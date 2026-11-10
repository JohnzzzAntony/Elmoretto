"""Convert the supplied numbered JPEGs to native-size WebP for scroll playback."""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
COUNT = 594


def encode(index):
    source = ROOT / f"frame_{index:04}.jpg"
    target = ROOT / "public" / "reference" / f"frame_{index:04}.webp"
    with Image.open(source) as image:
        if image.size != (784, 736):
            raise ValueError(f"Unexpected dimensions for {source.name}: {image.size}")
        image.save(target, "WEBP", quality=90, method=4)


def main():
    (ROOT / "public" / "reference").mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for _ in pool.map(encode, range(1, COUNT + 1)):
            pass
    print(f"Encoded {COUNT} frames at 784 x 736.")


if __name__ == "__main__":
    main()
