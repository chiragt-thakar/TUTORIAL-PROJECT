"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** A thin scroll-progress bar pinned to the top of a lesson, so long reads have a sense of place. */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  return <motion.div className="reading-progress" style={{ scaleX }} aria-hidden="true" />;
}
