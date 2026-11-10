"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCRUB, scrollToPosition } from "./motion";
import { createFrameReel, createMotionReel, framePath, motionVariant } from "./motion-reel";
import { Navigation } from "./navigation";
import { products } from "./products";
import { CURTAIN, ORIGIN_CAPTION, TOTAL, chapters, frameRanges, seamless } from "./sequence";
import { Visual } from "./visual";

const quickCuts: readonly string[] = ["drum", "journey", "roast"];
const dissolve = (index: number) => {
  const { id } = chapters[index];
  return seamless.includes(id) ? 0.01 : quickCuts.includes(id) ? 0.9 : 1.6;
};
const cues = chapters.map((chapter, i) => {
  const previous = chapters[i - 1];
  const next = chapters[i + 1];
  const hasPrevious = previous?.film === chapter.film;
  const hasNext = next?.film === chapter.film;
  const start = i === 0 ? 0 : hasPrevious ? chapter.at : CURTAIN.start;
  const end = hasNext ? next.at + dissolve(i + 1) : chapter.film === "harvest" ? CURTAIN.end : TOTAL;
  return { start, end, hasPrevious, hasNext };
});

// The collection slide has no film behind it.
const still = { warm() {}, draw() {}, hold() {}, release() {}, destroy() {} };

function ProductShelf() {
  return (
    <ul className="product-shelf" aria-label="El Moretto coffee beans">
      {products.map((product) => (
        <li className="product" key={product.id}>
          <a href={product.url} target="_blank" rel="noopener">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
            <img className="product-bag" src={product.image} alt={`El Moretto ${product.name} coffee beans bag`} width={product.width} height={product.height} loading="lazy" />
            <span className="product-meta">
              <strong>{product.name}</strong>
              <span>{product.blend}</span>
              <span className="product-price">{product.price} <span aria-hidden="true">↗</span></span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CinematicExperience() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = stage.current!;
    const select = gsap.utils.selector(viewport);
    const [film] = select(".film");
    const [ritual] = select(".ritual");
    const shots = chapters.map(({ id }) => viewport.querySelector<HTMLElement>(`#${id}`)!);

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      viewport.dataset.enhanced = "true";
      let variant = motionVariant(viewport.clientWidth, viewport.clientHeight);
      const reels = shots.map((shot, i) => {
        const range = frameRanges[chapters[i].id];
        if (range) {
          const reel = createFrameReel(shot.querySelector("canvas")!, range);
          reel.warm(variant); // request the whole set up front, in chapter order, so frames are ready ahead of the scroll
          return reel;
        }
        const video = shot.querySelector("video");
        return video ? createMotionReel(video, chapters[i].visual) : still;
      });

      function sync() {
        const time = timeline.time();
        reels.forEach((reel, i) => {
          const { start, end } = cues[i];
          if (time >= start - 5 && time <= end + 4) reel.warm(variant);
          if (time >= start && time <= end) reel.draw((time - start) / (end - start));
          else reel.hold();
          if (time < start - 14 || time > end + 14) reel.release();
        });
        viewport.dataset.theme = time > CURTAIN.end - 0.6 ? "light" : "dark";
      }

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: sync,
        scrollTrigger: {
          trigger: root.current, pin: viewport, start: "top top",
          end: () => `+=${viewport.clientHeight * 24}`,
          scrub: SCRUB, anticipatePin: 1, invalidateOnRefresh: true,
        },
      });

      timeline
        .set({}, {}, TOTAL) // keeps the timeline exactly TOTAL long, so jump() can map chapter units to scroll
        .to(select(".hero"), { autoAlpha: 0, y: -32, duration: 3.4, ease: "sine.inOut" }, 1.2);
      shots.forEach((shot, i) => {
        const chapter = chapters[i];
        const next = chapters[i + 1];
        const { start, hasPrevious, hasNext } = cues[i];
        if (hasPrevious) {
          const duration = dissolve(i);
          timeline.fromTo(shot, { autoAlpha: 0 }, { autoAlpha: 1, duration, ease: "sine.inOut" }, start);
          timeline.set(shots[i - 1], { autoAlpha: 0 }, start + duration);
        }
        // Each caption fades in as a block while its lines rise one after another, then lifts away before the next chapter.
        const caption = shot.querySelector(".caption")!;
        const enter = i === 0 ? ORIGIN_CAPTION : chapter.at + 0.6;
        timeline
          .fromTo(caption, { autoAlpha: 0, y: 0 }, { autoAlpha: 1, duration: 1.2, ease: "sine.inOut" }, enter)
          .fromTo(caption.children, { y: 34 }, { y: 0, duration: 1.3, stagger: 0.16, ease: "power3.out" }, enter);
        if (hasNext) {
          timeline.to(caption, { autoAlpha: 0, y: -20, duration: 1, ease: "sine.in" }, next.at - 1);
        }
      });

      const curtain = CURTAIN.end - CURTAIN.start;
      timeline
        .fromTo(film, { clipPath: "inset(0% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 100% 0%)", duration: curtain, ease: "sine.inOut" }, CURTAIN.start)
        .fromTo(ritual, { yPercent: 5 }, { yPercent: 0, duration: curtain, ease: "power2.out" }, CURTAIN.start)
        .set(film, { visibility: "hidden" }, CURTAIN.end)
        // The bags rise in as the curtain lifts, then drift up gently while the collection holds.
        .fromTo(select(".product"), { autoAlpha: 0, yPercent: 16 },
          { autoAlpha: 1, yPercent: 0, duration: 3.6, stagger: 0.6, ease: "power3.out" }, CURTAIN.start + 2.6)
        .fromTo(select(".product-bag"), { yPercent: 3 }, { yPercent: -4, duration: 73 - CURTAIN.start, ease: "none" }, CURTAIN.start);
      sync();

      function jump(id: string, instant = false) {
        const index = chapters.findIndex((chapter) => chapter.id === id);
        const trigger = timeline.scrollTrigger;
        if (index < 0 || !trigger) return false;
        const time = index === 0 ? 0 : chapters[index].at + 2;
        scrollToPosition(trigger.start + ((trigger.end - trigger.start) * time) / TOTAL, instant);
        return true;
      }

      function onClick(event: MouseEvent) {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element).closest<HTMLAnchorElement>("a[href*='#']");
        if (!link || link.pathname !== location.pathname || !jump(link.hash.slice(1))) return;
        event.preventDefault();
        history.replaceState(null, "", link.hash);
        link.closest("details")?.removeAttribute("open");
      }

      const onHash = () => { jump(location.hash.slice(1), true); };
      const onResize = () => {
        variant = motionVariant(viewport.clientWidth, viewport.clientHeight);
        sync();
      };
      viewport.addEventListener("click", onClick);
      window.addEventListener("hashchange", onHash);
      window.addEventListener("resize", onResize);
      const initial = requestAnimationFrame(onHash);

      return () => {
        cancelAnimationFrame(initial);
        viewport.removeEventListener("click", onClick);
        window.removeEventListener("hashchange", onHash);
        window.removeEventListener("resize", onResize);
        reels.forEach((reel) => reel.destroy());
        delete viewport.dataset.enhanced;
        viewport.dataset.theme = "dark";
      };
    });
    return () => media.revert();
  }, []);

  function renderShots(film: "harvest" | "ritual") {
    return chapters.map((chapter, i) => chapter.film === film && (
      <article className="shot" key={chapter.id} id={chapter.id}>
        {chapter.id === "products" ? <ProductShelf /> : <div className="shot-image">
          {frameRanges[chapter.id] ? <>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, the first frame doubles as the poster */}
            <img src={framePath(frameRanges[chapter.id]![0])} alt="" width="1920" height="1080" fetchPriority={i === 0 ? "high" : "auto"} loading={i === 0 ? "eager" : "lazy"} />
            <canvas className="motion-reel" width="1920" height="1080" aria-hidden="true" />
          </> : <>
            <Visual name={chapter.visual} priority={i === 0} cinematic />
            <video className="motion-reel" preload="none" muted playsInline aria-hidden="true" />
          </>}
        </div>}
        <div className="shot-shade" />
        {i === 0 && <div className="hero">
          <p className="kicker"><span className="kicker-rule" />El Moretto · Dublin since 2016</p>
          <h1>From the mountain<br />to <em>your morning.</em></h1>
          <p className="hero-deck">Follow every El Moretto bean from a misty hillside to the cup in your hands.</p>
          <p className="hero-hint"><span className="hero-hint-line" />Scroll to begin</p>
        </div>}
        <div className="caption">
          <p className="kicker"><span className="kicker-rule" />{chapter.kicker}</p>
          <h2>{chapter.title[0]}<br /><em>{chapter.title[1]}</em></h2>
          <p className="chapter-copy">{chapter.copy}</p>
          {i === chapters.length - 1 && <a className="button" href="/coffee/">Shop the collection <span aria-hidden="true">↗</span></a>}
        </div>
      </article>
    ));
  }

  return (
    <div className="experience" ref={root}>
      <div className="stage" ref={stage} data-theme="dark">
        <Navigation />
        <section className="film" aria-label="From harvest to roast">{renderShots("harvest")}</section>
        <section className="ritual" aria-label="The brewing ritual">{renderShots("ritual")}</section>
      </div>
    </div>
  );
}
