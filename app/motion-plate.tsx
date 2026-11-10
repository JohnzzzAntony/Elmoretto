"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

      function update(trigger: ScrollTrigger) {
        if (trigger.isActive) {
          reel.warm(variant);
          reel.draw(trigger.progress);
        } else {
          reel.hold();
        }
      }

      const trigger = ScrollTrigger.create({
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        onUpdate: update,
        onRefresh(self) {
          variant = motionVariant(element.clientWidth, element.clientHeight, false);
          update(self);
        },
      });
      update(trigger);
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
