"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";

/** Counts up to `value` once, then tracks it directly on later changes. */
export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    if (reduceMotion) {
      ref.current.textContent = `${value}${suffix}`;
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(current) {
        if (ref.current) ref.current.textContent = `${Math.round(current)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [value, suffix, motionValue, reduceMotion]);

  return <span ref={ref}>0{suffix}</span>;
}
