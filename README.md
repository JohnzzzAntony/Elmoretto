# El Moretto: from the mountain to your morning

A scroll-driven specialty coffee site. The homepage follows a highland harvest through roasting, then lifts a curtain into a four-chapter brewing ritual.

## Run and build

Use Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

```sh
npm run lint
npm run typecheck
npm run build
python -m http.server 3074 --bind 127.0.0.1 --directory out
```

Open [127.0.0.1:3074](http://127.0.0.1:3074/) for the production preview. Publish the contents of `out/` at the root of a static host. The exported routes are `/`, `/story/`, and `/coffee/`.

## Scroll timeline

The stage is pinned for 24 viewport heights. The GSAP timeline in `app/cinematic.tsx` uses chapter cues from `app/sequence.ts`. Scroll position selects a rendered frame and controls the cuts, curtain, captions, and chapter dock in both directions. Story and Coffee use the same reels on their main photographs as they pass through the viewport.

`app/motion.tsx` holds the motion shared by every page: Lenis smooth scrolling driven by the GSAP ticker, the `SCRUB` lag used by the film and the plates, the rise-in reveals, and the photograph drift. Change the pace of the whole site there.

| Scroll units | Visuals |
| --- | --- |
| 0–56 | Highland fly-over, ripe cherries, a cherry dropping into the bowl, green beans pouring into burlap, sacks trucked to the roastery, and roasted beans cooling |
| 56–63 | Curtain lifts from the dark harvest into the light brewing studio |
| 63–100 | Bean cracks open, pour-over grounds bloom, carafe pour tapers to drops, and the finished cup comes into focus |

Reduced-motion and no-JavaScript visitors get the photographs and chapter text in reading order.

## Brand and products

The El Moretto logo (`public/brand/logo-mask.png`) is an alpha mask of the official logo, always drawn dark-on-cream so the mascot artwork is never inverted. The three bean bags in `public/brand/` are cut from elmoretto.ie with the faint product-name lettering removed. Product names, blends, prices and shop links live in `app/products.ts` and must be kept in step with the live shop; they feed the collection slide after the roast and the Our Coffee page.

## Image assets

The first five harvest chapters (origin, cherry, harvest, green bean, journey) scrub a 420-frame sequence on a canvas. Frames 1–300 came from the ezgif export; 301–420 were extracted at 12 fps from `Workers_loading_sacks_onto_truck` with ffmpeg (`imageio-ffmpeg`). The 1280 × 720 source frames were AI-upscaled to 3840 × 2160 with Real-ESRGAN (`realesr-animevideov3`, ×3), then `node scripts/build-frames.mjs <upscaled dir>` writes `public/frames/3840/` and `public/frames/1920/` as WebP. Screens with 2800+ physical pixels across load the 3840 set; everything else, including phones, loads the 1920 set. The ranges are set in `frameRanges` in `app/sequence.ts`. The roast chapter and the ritual chapters still use the MP4 reels described below.

The generated landscape originals are about 1672 × 941 and were resampled into 3840 × 2160 WebP masters in `public/cinema/`. The clean stills also serve as posters while motion loads.

Each of the nine reels in `public/motion/` contains 48 frames encoded at 30 fps in a silent, seekable MP4. The browser selects a 3840 × 2160, 1920 × 1080, or 960 × 1536 portrait version and loads nearby chapters. The renderer uses the recording's plantation glide, tighter harvest framing, and faster roast cuts as motion references. It animates the photographed fruit and beans and uses paired poses for the brewing actions.

To regenerate the reels with Pillow, NumPy and imageio-ffmpeg installed, run `py scripts/render-motion.py`. Pass a scene name such as `bean` to render only that scene.

The original recordings, earlier frame sets and preparation scripts are kept in `source-assets/`, outside `public/`, so they are not deployed.
