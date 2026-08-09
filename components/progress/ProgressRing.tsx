"use client";
import { motion, useReducedMotion } from "framer-motion";

export function ProgressRing({ percent, size = 92, strokeWidth = 7, caption }: { percent: number; size?: number; strokeWidth?: number; caption?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const reduceMotion = useReducedMotion();
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${percent}% complete${caption ? `, ${caption}` : ""}`}>
        <circle className="progress-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          className="progress-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="progress-ring-label">
        <strong>{percent}%</strong>
        {caption && <span>{caption}</span>}
      </div>
    </div>
  );
}
