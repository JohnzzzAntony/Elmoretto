"""Extract numbered desktop and mobile WebP frames from the source recording."""

import argparse
import json
from pathlib import Path
import subprocess

from imageio_ffmpeg import get_ffmpeg_exe, read_frames, count_frames_and_secs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("recording", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "public" / "film")
    args = parser.parse_args()
    public = args.output
    reader = read_frames(str(args.recording))
    metadata = next(reader)
    reader.close()
    count, _ = count_frames_and_secs(str(args.recording))
    editions = {}
    for edition, dimensions, quality in (
        ("desktop", "1280:720", 83),
        ("mobile", "768:432", 79),
    ):
        output = public / edition
        output.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(args.recording), "-map", "0:v:0", "-an",
                "-vf", f"scale={dimensions}:flags=lanczos",
                "-c:v", "libwebp", "-quality", str(quality), "-compression_level", "4",
                "-start_number", "0", str(output / "%03d.webp"),
            ],
            check=True,
        )
        if not all((output / f"{index:03d}.webp").is_file() for index in range(count)):
            raise RuntimeError(f"Incomplete {edition} sequence")
        editions[edition] = {"count": count, "width": int(dimensions.split(":")[0]), "height": int(dimensions.split(":")[1])}
        print(f"{edition}: {count} frames")
    (public / "manifest.json").write_text(json.dumps({
        "source": args.recording.name, "fps": metadata["fps"],
        "duration": metadata["duration"], "editions": editions,
        "pattern": "{edition}/{frame:03d}.webp",
    }, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
