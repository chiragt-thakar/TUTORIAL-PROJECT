"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Fades and lifts children into place the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  id,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
  as?: "div" | "section" | "li";
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      id={id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}
