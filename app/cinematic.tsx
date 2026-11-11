"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCRUB, scrollToPosition } from "./motion";
import { createFrameReel, createMotionReel, framePath, motionVariant } from "./motion-reel";
import { Navigation } from "./navigation";
import { ORIGIN_CAPTION, TOTAL, chapters, frameRanges, seamless } from "./sequence";
import { Visual } from "./visual";

// The film is pinned for PIN screens, then holds for one more while the next section rises over it.
const PIN = 11;
const HANDOFF = TOTAL / PIN;
const quickCuts: readonly string[] = ["drum", "journey"];
const dissolve = (index: number) => {
  const { id } = chapters[index];
  return seamless.includes(id) ? 0.01 : quickCuts.includes(id) ? 0.9 : 1.6;
};
const cues = chapters.map((chapter, i) => {
  const next = chapters[i + 1];
  return { start: chapter.at, end: next ? next.at + dissolve(i + 1) : TOTAL, hasPrevious: i > 0, hasNext: !!next };
});

export function CinematicExperience() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = stage.current!;
    const select = gsap.utils.selector(viewport);
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
        return createMotionReel(shot.querySelector("video")!, chapters[i].visual);
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
      }

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: sync,
        scrollTrigger: {
          trigger: root.current, pin: viewport, start: "top top",
          end: () => `+=${viewport.clientHeight * (PIN + 1)}`,
          scrub: SCRUB, anticipatePin: 1, invalidateOnRefresh: true,
        },
      });

      timeline
        // The film dims and settles back as it is covered.
        .to(select(".film"), { opacity: 0.3, scale: 0.94, duration: HANDOFF, ease: "sine.in" }, TOTAL)
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

      sync();

      function jump(id: string, instant = false) {
        const index = chapters.findIndex((chapter) => chapter.id === id);
        const trigger = timeline.scrollTrigger;
        if (index < 0 || !trigger) return false;
        const time = index === 0 ? 0 : chapters[index].at + 2;
        scrollToPosition(trigger.start + ((trigger.end - trigger.start) * time) / (TOTAL + HANDOFF), instant);
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
      };
    });
    return () => media.revert();
  }, []);

  return (
    <div className="experience" ref={root}>
      <div className="stage" ref={stage}>
        <Navigation />
        <section className="film" aria-label="From harvest to the roastery">
          {chapters.map((chapter, i) => (
            <article className="shot" key={chapter.id} id={chapter.id}>
              <div className="shot-image">
                {frameRanges[chapter.id] ? <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- static export, the first frame doubles as the poster */}
                  <img src={framePath(frameRanges[chapter.id]![0])} alt="" width="1920" height="1080" fetchPriority={i === 0 ? "high" : "auto"} loading={i === 0 ? "eager" : "lazy"} />
                  <canvas className="motion-reel" width="1920" height="1080" aria-hidden="true" />
                </> : <>
                  <Visual name={chapter.visual} priority={i === 0} cinematic />
                  <video className="motion-reel" preload="none" muted playsInline aria-hidden="true" />
                </>}
              </div>
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
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
