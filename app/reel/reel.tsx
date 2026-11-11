"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Texture, Vector2, WebGLRenderer } from "three";
import { SCRUB } from "../motion";
import { Navigation } from "../navigation";

// public/reel/ holds the brand film as stills, written by scripts/extract-reel-frames.mjs. Keep these two in step with it.
const FPS = 15;
const COUNT = 494;
const DURATION = (COUNT - 1) / FPS;
const frameUrl = (size: string, index: number) => `/reel/${size}-${String(index).padStart(4, "0")}.webp`;

// `at` is the second of the film where the chapter's first shot cuts in; `still` is the frame shown in the reading layout.
const chapters = [
  {
    id: "collection", at: 0, still: 30, alt: "Coffee beans raining over three El Moretto bags: Amalfi, Positano and Sorrento",
    kicker: "The collection", title: ["Three blends,", "one ritual."],
    copy: "Amalfi, Positano and Sorrento, from smooth 100% Arabica to a strong Italian classic.",
  },
  {
    id: "open", at: 5.53, still: 135, alt: "Roasted beans pouring from an open El Moretto bag",
    kicker: "Break the seal", title: ["Open the bag,", "meet the aroma."],
    copy: "Whole beans, sealed until you are ready. Grind them just before you brew.",
  },
  {
    id: "espresso", at: 9.73, still: 180, alt: "Espresso running in two golden streams from a portafilter",
    kicker: "The extraction", title: ["Dark, slow,", "golden."],
    copy: "Hot water meets fresh grounds, and the crema runs like honey.",
  },
  {
    id: "sip", at: 13.93, still: 232, alt: "A woman by a window sipping from an El Moretto cup",
    kicker: "The first sip", title: ["Make time", "taste better."],
    copy: "Warm the cup. Take in the aroma. Give the first sip a moment of its own.",
  },
  {
    id: "highlands", at: 19.13, still: 318, alt: "A hand picking ripe red coffee cherries from the branch",
    kicker: "Highland estate", title: ["One cherry", "at a time."],
    copy: "Deep red, heavy with sugar. Only then is a cherry ready to leave the tree.",
  },
  {
    id: "coast", at: 23.2, still: 390, alt: "Villas on a cliff above the sea on Italy's southern coast",
    kicker: "Down the valley", title: ["From the farm", "to the coast."],
    copy: "Burlap sacks leave the hills for Italy, where our blends take their names from the southern coast.",
  },
  {
    id: "fire", at: 26.8, still: 425, alt: "Coffee beans tumbling in a glowing roaster drum",
    kicker: "Fire and timing", title: ["Roasted to", "the edge."],
    copy: "Heat wakes the sugars. We stop the roast seconds before boldness turns to bitterness.",
  },
] as const;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform float uMix;
  uniform float uSpeed;
  uniform float uTime;
  uniform vec2 uCover;
  uniform float uAnchor;
  uniform vec2 uPointer;
  varying vec2 vUv;

  // Two neighbouring stills, cross-faded, with red and blue pulled apart along the scroll direction.
  vec3 film(vec2 uv, vec2 split) {
    vec3 a = vec3(texture2D(uA, uv + split).r, texture2D(uA, uv).g, texture2D(uA, uv - split).b);
    vec3 b = vec3(texture2D(uB, uv + split).r, texture2D(uB, uv).g, texture2D(uB, uv - split).b);
    return mix(a, b, uMix);
  }

  void main() {
    vec2 centre = vUv - 0.5;
    float edge = dot(centre, centre);
    // The picture is drawn 1.5% oversize: room for the pointer drift, the colour split and the push-in at speed.
    vec2 uv = centre * uCover * (0.985 - 0.08 * abs(uSpeed) * edge) + 0.5 + uPointer * 0.005;
    uv.x += uAnchor;
    vec3 color = film(uv, vec2(0.0, 0.004 * uSpeed) * (0.3 + 3.0 * edge));
    color *= 1.0 - 0.35 * edge * (1.0 + abs(uSpeed));
    color += (fract(sin(dot(gl_FragCoord.xy + uTime * 61.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.045;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function Reel() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = stage.current!;
    const select = gsap.utils.selector(viewport);
    const [canvas] = select(".reel-canvas") as HTMLCanvasElement[];
    const captions = select(".caption");

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      let renderer: WebGLRenderer;
      try {
        renderer = new WebGLRenderer({ canvas, alpha: true, powerPreference: "high-performance" });
      } catch {
        return; // no WebGL: the reading layout stays
      }
      viewport.dataset.enhanced = "true";
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

      const uniforms = {
        uA: { value: null as Texture | null }, uB: { value: null as Texture | null },
        uMix: { value: 0 }, uSpeed: { value: 0 }, uTime: { value: 0 },
        uCover: { value: new Vector2(1, 1) }, uAnchor: { value: 0 }, uPointer: { value: new Vector2() },
      };
      const geometry = new PlaneGeometry(2, 2);
      const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });
      const scene = new Scene().add(new Mesh(geometry, material));
      const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

      // Only the two stills on screen live on the GPU; the rest stay as compressed images.
      const slots = [0, 1].map(() => {
        const texture = new Texture();
        texture.minFilter = LinearFilter;
        texture.generateMipmaps = false;
        return { texture, index: -1 };
      });
      type Slot = (typeof slots)[number];
      function bind(index: number, keep?: Slot) {
        const slot = slots.find((candidate) => candidate.index === index) ?? slots.find((candidate) => candidate !== keep)!;
        if (slot.index !== index) {
          slot.index = index;
          slot.texture.image = frames[index]!;
          slot.texture.needsUpdate = true;
        }
        return slot;
      }

      // Coarse to fine: every 16th still first, so the whole film can be scrubbed within moments of opening the page.
      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
      const size = !saveData && canvas.clientWidth * devicePixelRatio > 1200 ? "1600" : "960";
      const frames: (HTMLImageElement | undefined)[] = new Array(COUNT);
      const order = [16, 8, 4, 2, 1].flatMap((step, pass) =>
        Array.from({ length: Math.ceil(COUNT / step) }, (_, i) => i * step).filter((index) => pass === 0 || index % (step * 2)));
      const images = order.map((index) => {
        const image = new Image();
        image.src = frameUrl(size, index);
        image.decode().then(() => { frames[index] = image; }, () => {});
        return image;
      });
      function nearest(index: number) {
        for (let distance = 0; distance < COUNT; distance++) {
          if (frames[index - distance]) return index - distance;
          if (frames[index + distance]) return index + distance;
        }
        return -1;
      }

      function resize() {
        const aspect = canvas.clientWidth / canvas.clientHeight / (16 / 9);
        const cover = uniforms.uCover.value.set(Math.min(aspect, 1), Math.min(1 / aspect, 1));
        // The film has its logo in the top right corner. A slightly narrow screen crops the left side only, to keep the
        // logo whole; a much narrower one crops both sides, which removes it cleanly.
        uniforms.uAnchor.value = cover.x > 0.76 ? (1 - cover.x) / 2 : 0;
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      }

      const playhead = { frame: 0 };
      const pointer = new Vector2();
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current, pin: viewport, start: "top top",
          end: () => `+=${viewport.clientHeight * 12}`,
          scrub: SCRUB, anticipatePin: 1, invalidateOnRefresh: true, onRefresh: resize,
        },
      });
      timeline
        .to(playhead, { frame: COUNT - 1, duration: DURATION }, 0)
        .to(select(".hero"), { autoAlpha: 0, y: -24, duration: 0.9, ease: "sine.inOut" }, 0.5);
      captions.forEach((caption, i) => {
        const next = chapters[i + 1];
        const enter = i === 0 ? 1.6 : chapters[i].at + 0.25;
        timeline
          .fromTo(caption, { autoAlpha: 0, y: 0 }, { autoAlpha: 1, duration: 0.45, ease: "sine.inOut" }, enter)
          .fromTo(caption.children, { y: 34 }, { y: 0, duration: 0.6, stagger: 0.07, ease: "power3.out" }, enter);
        if (next) timeline.to(caption, { autoAlpha: 0, y: -20, duration: 0.4, ease: "sine.in" }, next.at - 0.45);
      });

      function render(time: number) {
        const trigger = timeline.scrollTrigger;
        if (!trigger?.isActive) return;
        const first = Math.min(Math.floor(playhead.frame), COUNT - 1);
        const a = nearest(first);
        if (a < 0) return; // nothing has arrived yet; the canvas shows its poster
        const b = nearest(Math.min(first + 1, COUNT - 1));
        const held = slots.find((slot) => slot.index === b);
        const slotA = bind(a, held);
        uniforms.uA.value = slotA.texture;
        uniforms.uB.value = bind(b, slotA).texture;
        uniforms.uMix.value = a === b ? 0 : gsap.utils.clamp(0, 1, (playhead.frame - first - 0.1) / 0.8);
        uniforms.uSpeed.value += (gsap.utils.clamp(-1, 1, trigger.getVelocity() / 2500) - uniforms.uSpeed.value) * 0.1;
        uniforms.uPointer.value.lerp(pointer, 0.06);
        uniforms.uTime.value = time;
        renderer.render(scene, camera);
      }
      gsap.ticker.add(render);

      function onPointerMove(event: PointerEvent) {
        pointer.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
      }
      viewport.addEventListener("pointermove", onPointerMove);

      return () => {
        gsap.ticker.remove(render);
        viewport.removeEventListener("pointermove", onPointerMove);
        images.forEach((image) => { image.src = ""; });
        slots.forEach(({ texture }) => texture.dispose());
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        delete viewport.dataset.enhanced;
      };
    });
    return () => media.revert();
  }, []);

  return (
    <div className="experience" ref={root}>
      <div className="stage reel" ref={stage} data-theme="dark">
        <Navigation />
        <canvas className="reel-canvas" aria-hidden="true" />
        <section className="film" aria-label="The El Moretto film">
          <div className="shot-shade" />
          <div className="hero">
            <p className="kicker"><span className="kicker-rule" />A film by El Moretto</p>
            <h1>Coffee,<br /><em>frame by frame.</em></h1>
            <p className="hero-deck">Scroll to play the El Moretto film at your own pace, from the bag to the cup and back to the farm.</p>
            <p className="hero-hint"><span className="hero-hint-line" />Scroll to begin</p>
          </div>
          {chapters.map((chapter, i) => (
            <article key={chapter.id} id={chapter.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
              <img className="reel-still" src={frameUrl("960", chapter.still)} alt={chapter.alt} width="960" height="540" loading="lazy" />
              <div className="caption">
                <p className="kicker"><span className="kicker-rule" />{chapter.kicker}</p>
                <h2>{chapter.title[0]}<br /><em>{chapter.title[1]}</em></h2>
                <p className="chapter-copy">{chapter.copy}</p>
                {i === chapters.length - 1 && <a className="button" href="/coffee/">Shop the collection <span aria-hidden="true">↗</span></a>}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
