const FPS = 30;
const FRAME_COUNT = 48;

export function motionVariant(width: number, height: number, portrait = true) {
  if (portrait && matchMedia("(max-width: 767px) and (orientation: portrait)").matches) return "portrait";
  const pixels = Math.max(width, height * 16 / 9) * window.devicePixelRatio;
  return pixels >= 2800 ? "3840" : "1920";
}

const frames = new Map<string, HTMLImageElement>();
export const framePath = (index: number, size: number | string = 1920) => `/frames/${size}/${String(index).padStart(3, "0")}.webp`;

function loadFrame(index: number, size: string) {
  const src = framePath(index, size);
  let image = frames.get(src);
  if (!image) {
    image = new Image();
    image.decoding = "async";
    image.src = src;
    frames.set(src, image);
  }
  return image;
}

const loaded = (image?: HTMLImageElement) => !!image?.complete && image.naturalWidth > 0;

// Same interface as the video reel, but scrubs an image sequence on a canvas sized to the variant (CSS object-fit covers the stage).
export function createFrameReel(canvas: HTMLCanvasElement, [first, last]: readonly [number, number]) {
  const context = canvas.getContext("2d")!;
  let target = first;
  let drawn = 0;
  let active = false;
  let size = "";

  function paint() {
    if (!active) return;
    // Fast scrolls can outrun the network: show the nearest frame that has arrived.
    for (let offset = 0; offset <= last - first; offset++) {
      for (const index of [target - offset, target + offset]) {
        const image = frames.get(framePath(index, size));
        if (index < first || index > last || !loaded(image)) continue;
        if (index !== drawn) context.drawImage(image!, 0, 0, canvas.width, canvas.height);
        drawn = index;
        canvas.dataset.ready = "true";
        return;
      }
    }
  }

  return {
    warm(variant: string) {
      if (variant === size) return;
      size = variant;
      drawn = 0;
      [canvas.width, canvas.height] = size === "portrait" ? [1350, 2160] : [Number(size), Number(size) * 9 / 16];
      for (let index = first; index <= last; index++) loadFrame(index, size).addEventListener("load", paint, { once: true });
      paint();
    },
    draw(progress: number) {
      active = true;
      target = first + Math.round(Math.max(0, Math.min(1, progress)) * (last - first));
      paint();
    },
    hold() {
      active = false;
    },
    release() {},
    destroy() {
      active = false;
    },
  };
}

export function createMotionReel(video: HTMLVideoElement, name: string) {
  let source = "";
  let target = 0;
  let active = false;

  function update() {
    if (!active || video.seeking || video.readyState < HTMLMediaElement.HAVE_METADATA) return;
    // Seek inside the frame to avoid rounding to its neighbour.
    const time = target === 0 ? 0 : (target + 0.25) / FPS;
    if (Math.abs(video.currentTime - time) > 0.5 / FPS) {
      video.currentTime = time;
    } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      video.dataset.ready = "true";
    }
  }

  video.addEventListener("loadeddata", update);
  video.addEventListener("seeked", update);

  function release() {
    if (!source) return;
    source = "";
    delete video.dataset.ready;
    video.removeAttribute("src");
    video.preload = "none";
    video.load();
  }

  return {
    warm(variant: string) {
      if (source === variant) return;
      source = variant;
      delete video.dataset.ready;
      video.preload = "auto";
      video.src = `/motion/${name}-${variant}.mp4`;
    },
    draw(progress: number) {
      active = true;
      target = Math.round(Math.max(0, Math.min(1, progress)) * (FRAME_COUNT - 1));
      update();
    },
    hold() {
      active = false;
    },
    release,
    destroy() {
      video.removeEventListener("loadeddata", update);
      video.removeEventListener("seeked", update);
      release();
    },
  };
}
