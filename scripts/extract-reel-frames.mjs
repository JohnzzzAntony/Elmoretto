// Turns source-assets/recording.mp4 into the WebP frame sequence in public/reel/.
// The browser does the decoding and encoding, so this needs no ffmpeg:
//   node scripts/extract-reel-frames.mjs   then open http://127.0.0.1:3079/ and wait for "done".
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const OUT = "public/reel";
const page = `<!doctype html><meta charset="utf-8"><title>extract</title><body style="background:#111;color:#eee;font:14px monospace"><pre id="log">loading</pre><script type="module">
const FPS = 15;
// The recording is a screen capture of a player. Its controls cover the picture before START and after END,
// a dark line runs along its edges, and the mouse pointer sits still inside POINTER.
const START = 1.75;
const END = 34.7;
const CROP = { x: 4, y: 3, w: 1912, h: 1075 };
const POINTER = { x: 840, y: 27, w: 28, h: 35 };
const SIZES = [{ name: "1600", w: 1600, h: 900, q: 0.78 }, { name: "960", w: 960, h: 540, q: 0.72 }];
const log = (text) => { document.getElementById("log").textContent = text; };
const video = document.createElement("video");
video.muted = true;
video.src = URL.createObjectURL(await (await fetch("/recording.mp4")).blob());
await new Promise((resolve) => { video.onloadeddata = resolve; });

// A seek reports "seeked" before the frame is presentable; wait for the frame itself.
window.grab = async (time) => {
  await new Promise((resolve) => { video.onseeked = resolve; video.currentTime = time; });
  await new Promise((resolve) => { video.requestVideoFrameCallback(resolve); setTimeout(resolve, 250); });
  return video;
};
const source = new OffscreenCanvas(1920, 1078);
const paint = source.getContext("2d");
window.save = async (name, size) => {
  // Cover the pointer with the picture on either side of it, averaged.
  const { x, y, w, h } = POINTER;
  paint.globalAlpha = 1;
  paint.drawImage(video, 0, 0);
  paint.drawImage(video, x - w - 4, y, w, h, x, y, w, h);
  paint.globalAlpha = 0.5;
  paint.drawImage(video, x + w + 4, y, w, h, x, y, w, h);
  const canvas = new OffscreenCanvas(size.w, size.h);
  canvas.getContext("2d").drawImage(source, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, size.w, size.h);
  const body = await canvas.convertToBlob({ type: "image/webp", quality: size.q });
  const response = await fetch("/out/" + name, { method: "PUT", body });
  if (!response.ok) throw new Error(name + " " + response.status);
  return body.size;
};
window.run = async () => {
  const count = Math.floor((END - START) * FPS);
  let bytes = 0;
  for (let i = 0; i < count; i++) {
    await grab(START + i / FPS);
    for (const size of SIZES) bytes += await save(size.name + "-" + String(i).padStart(4, "0") + ".webp", size);
    log(i + 1 + " / " + count + "  " + (bytes / 1e6).toFixed(1) + " MB");
  }
  log("done: " + count + " frames, " + (bytes / 1e6).toFixed(1) + " MB");
  return count;
};
log("ready: " + video.duration.toFixed(2) + "s " + video.videoWidth + "x" + video.videoHeight);
if (new URLSearchParams(location.search).has("run")) run();
</script>`;

createServer(async (request, response) => {
  try {
    const name = /^\/out\/([\w-]+\.webp)$/.exec(request.url ?? "")?.[1];
    if (request.method === "PUT" && name) {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      await mkdir(OUT, { recursive: true });
      await writeFile(`${OUT}/${name}`, Buffer.concat(chunks));
      response.writeHead(204).end();
    } else if (request.url === "/recording.mp4") {
      response.writeHead(200, { "content-type": "video/mp4" }).end(await readFile("source-assets/recording.mp4"));
    } else if (request.url?.split("?")[0] === "/") {
      response.writeHead(200, { "content-type": "text/html" }).end(page);
    } else {
      response.writeHead(404).end();
    }
  } catch (error) {
    response.writeHead(500).end(String(error));
  }
}).listen(3079, "127.0.0.1", () => console.log("http://127.0.0.1:3079/"));
