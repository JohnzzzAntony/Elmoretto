"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// One motion language for the whole site: the film, the reveals and the plates all read these.
export const SCRUB = 1.1;
const RISE = ".outro > .kicker, .outro h2, .outro-card, .section-heading, .story-card, .range-card";
const DRIFT = ".outro-card img, .editorial picture img";

let lenis: Lenis | undefined;
const glide = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function scrollToPosition(top: number, instant = false) {
  if (!lenis) return window.scrollTo({ top, behavior: instant ? "instant" : "smooth" });
  if (instant) return lenis.scrollTo(top, { immediate: true, force: true });
  // Long jumps take longer, so the film never fast-forwards in a blur.
  const screens = Math.abs(top - window.scrollY) / window.innerHeight;
  lenis.scrollTo(top, { duration: gsap.utils.clamp(1.4, 3.6, 1 + screens * 0.22), easing: glide });
}

// Runs once the page has finished loading. Returns a cancel for effects that unmount first.
export function afterLoad(run: () => void) {
  if (document.readyState === "complete") {
    run();
    return () => {};
  }
  window.addEventListener("load", run, { once: true });
  return () => window.removeEventListener("load", run);
}

export function Motion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const smooth = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, autoRaf: false });
      lenis = smooth;
      smooth.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => smooth.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      // In-page links (#collection, #top) glide instead of jumping. The film handles its own chapter links first.
      function onClick(event: MouseEvent) {
        if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element).closest<HTMLAnchorElement>("a[href^='#']");
        const target = link && document.getElementById(link.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        scrollToPosition(target.getBoundingClientRect().top + window.scrollY);
      }
      document.addEventListener("click", onClick);

      // Only hide what starts below the fold, so nothing already on screen blinks out after hydration.
      const rising = gsap.utils.toArray<HTMLElement>(RISE).filter((element) => element.getBoundingClientRect().top > window.innerHeight);
      gsap.set(rising, { opacity: 0, y: 56 });
      ScrollTrigger.batch(rising, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.6, ease: "power3.out", stagger: 0.16, overwrite: true }),
      });

      // Photographs settle into their frames as they travel up the screen.
      gsap.utils.toArray<HTMLElement>(DRIFT).forEach((image) => {
        if (image.closest(".motion-plate")) return;
        gsap.fromTo(image, { scale: 1.14, yPercent: -3 }, {
          scale: 1, yPercent: 0, ease: "none",
          scrollTrigger: { trigger: image.parentElement, start: "top bottom", end: "top 25%", scrub: SCRUB },
        });
      });

      return () => {
        document.removeEventListener("click", onClick);
        gsap.ticker.remove(tick);
        smooth.destroy();
        lenis = undefined;
      };
    });
    return () => media.revert();
  }, []);

  return null;
}
