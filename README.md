# El Moretto: from the mountain to your morning

A scroll-driven specialty coffee site. The homepage follows a highland harvest through roasting, then hands over to the El Moretto brand film, scrubbed frame by frame.

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

Open [127.0.0.1:3074](http://127.0.0.1:3074/) for the production preview. Publish the contents of `out/` at the root of a static host. The exported routes are `/`, `/reel/`, `/story/`, and `/coffee/`.

## Scroll timeline

The home page is two pinned films, one after the other. The harvest film is pinned for 14 viewport heights. Its GSAP timeline in `app/cinematic.tsx` uses chapter cues from `app/sequence.ts`: scroll position selects a rendered frame and controls the cuts and captions in both directions. When the roast ends it scrolls away and the reel (below) takes over. Story and Coffee use the same reels on their main photographs as they pass through the viewport.

`app/motion.tsx` holds the motion shared by every page: Lenis smooth scrolling driven by the GSAP ticker, the `SCRUB` lag used by the films and the plates, the rise-in reveals, and the photograph drift. Change the pace of the whole site there.

| Film | Visuals |
| --- | --- |
| Harvest, scroll units 0–58 | Highland fly-over, ripe cherries, a cherry dropping into the bowl, green beans pouring into burlap, sacks trucked to the roastery, and roasted beans cooling |
| Reel, 33 seconds of film | The three bags, opening a bag, espresso, the first sip, the highlands, the coast, and the roaster |

Reduced-motion and no-JavaScript visitors get the photographs and chapter text in reading order.

## The reel

The reel is the El Moretto brand film. It plays on the home page after the roast, and on its own at `/reel/` with a title. `app/reel/reel.tsx` pins the stage for 12 viewport heights and scrubs the film with the shared Lenis scroll and `SCRUB` lag. A three.js shader draws it: it cross-fades neighbouring stills so slow scrolling glides, and adds a slight push-in and colour split at speed, pointer drift, grain and a vignette. Seven captions are timed to the film's cuts.

The film is 494 stills at 15 fps in `public/reel/`, in 1600 × 900 and 960 × 540, loaded coarse to fine. `node scripts/extract-reel-frames.mjs` rebuilds them in the browser from `source-assets/recording.mp4`, a screen capture of the film: it trims the player controls, crops the edge line and paints over the mouse pointer. If the frame count changes, update `COUNT` and the chapter times in `reel.tsx`.

## Brand and products

The El Moretto logo (`public/brand/logo-mask.png`) is an alpha mask of the official logo, always drawn dark-on-cream so the mascot artwork is never inverted. The three bean bags in `public/brand/` are cut from elmoretto.ie with the faint product-name lettering removed. Product names, blends, prices and shop links live in `app/products.ts` and must be kept in step with the live shop; they feed the Our Coffee page.

## Image assets

The first five harvest chapters (origin, cherry, harvest, green bean, journey) scrub a 420-frame sequence on a canvas. Frames 1–300 came from the ezgif export; 301–420 were extracted at 12 fps from `Workers_loading_sacks_onto_truck` with ffmpeg (`imageio-ffmpeg`). The 1280 × 720 source frames were AI-upscaled to 3840 × 2160 with Real-ESRGAN (`realesr-animevideov3`, ×3), then `node scripts/build-frames.mjs <upscaled dir>` writes `public/frames/3840/`, `public/frames/1920/` and `public/frames/portrait/` as WebP. Portrait phones load the portrait set, a centred full-height 1350 × 2160 crop of the 4K frame; other screens with 2800+ physical pixels across load the 3840 set, and everything else loads the 1920 set. The ranges are set in `frameRanges` in `app/sequence.ts`. The roast chapter uses an MP4 reel, as do the Story and Coffee plates, described below.

The generated landscape originals are about 1672 × 941 and were resampled into 3840 × 2160 WebP masters in `public/cinema/`. The clean stills also serve as posters while motion loads.

Each of the nine reels in `public/motion/` contains 48 frames encoded at 30 fps in a silent, seekable MP4. The browser selects a 3840 × 2160, 1920 × 1080, or 1350 × 2160 portrait version (a full-height crop, so phones are not upscaled from a short frame) and loads nearby chapters. The renderer uses the recording's plantation glide, tighter harvest framing, and faster roast cuts as motion references. It animates the photographed fruit and beans and uses paired poses for the brewing actions.

To regenerate the reels with Pillow, NumPy and imageio-ffmpeg installed, run `py scripts/render-motion.py`. Pass a scene name such as `bean` to render only that scene.

The original recordings, earlier frame sets and preparation scripts are kept in `source-assets/`, outside `public/`, so they are not deployed.
