"use client";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#087f5b", "#5ce0ae", "#f5b942", "#e8590c", "#4263eb"];
const PARTICLE_COUNT = 14;

interface Particle { id: number; angle: number; distance: number; color: string; size: number }

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildParticles(seed: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    id: seed * 100 + index,
    angle: (Math.PI * 2 * index) / PARTICLE_COUNT + pseudoRandom(seed * 13 + index) * 0.3,
    distance: 55 + pseudoRandom(seed * 29 + index) * 35,
    color: COLORS[index % COLORS.length],
    size: 5 + pseudoRandom(seed * 47 + index) * 4,
  }));
}

export function ConfettiBurst({ fire }: { fire: number }) {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(() => (fire === 0 || reduceMotion ? [] : buildParticles(fire)), [fire, reduceMotion]);

  return (
    <span className="confetti-burst" aria-hidden="true">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="confetti-particle"
          style={{ background: particle.color, width: particle.size, height: particle.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(particle.angle) * particle.distance, y: Math.sin(particle.angle) * particle.distance - 18, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </span>
  );
}
