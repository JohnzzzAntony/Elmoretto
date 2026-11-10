"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCRUB } from "./motion";
import { createMotionReel, motionVariant } from "./motion-reel";
import { Visual } from "./visual";

export function MotionPlate({ name, alt, priority }: { name: string; alt: string; priority?: boolean }) {
  const plate = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = plate.current!;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const reel = createMotionReel(video.current!, name);
      let variant = motionVariant(element.clientWidth, element.clientHeight, false);

      // The reel follows a smoothed copy of the scroll position, the same lag as the film on the home page.
      const playhead = { progress: 0 };

      function update(trigger: ScrollTrigger) {
        if (trigger.isActive) {
          reel.warm(variant);
          reel.draw(playhead.progress);
        } else {
          reel.hold();
        }
      }

      // ScrollTrigger fires onUpdate while the tween is still being created; onRefresh covers that first draw.
      let tween: gsap.core.Tween | undefined = undefined;
      tween = gsap.to(playhead, {
        progress: 1,
        ease: "none",
        onUpdate: () => { if (tween?.scrollTrigger) update(tween.scrollTrigger); },
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: SCRUB,
          onToggle: update,
          onRefresh(self) {
            variant = motionVariant(element.clientWidth, element.clientHeight, false);
            update(self);
          },
        },
      });
      return () => reel.destroy();
    });
    return () => media.revert();
  }, [name]);

  return (
    <div className="motion-plate" ref={plate}>
      <Visual name={name} alt={alt} priority={priority} />
      <video className="motion-reel" ref={video} preload="none" muted playsInline aria-hidden="true" />
    </div>
  );
}
