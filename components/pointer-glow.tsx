"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";

export function PointerGlow() {
  const rawX = useMotionValue(-300);
  const rawY = useMotionValue(-300);
  const x = useSpring(rawX, { stiffness: 180, damping: 28, mass: 0.45 });
  const y = useSpring(rawY, { stiffness: 180, damping: 28, mass: 0.45 });
  const background = useMotionTemplate`radial-gradient(440px circle at ${x}px ${y}px, rgba(255, 97, 92, 0.12), transparent 72%)`;

  useEffect(() => {
    const move = (event: PointerEvent) => {
      rawX.set(event.clientX);
      rawY.set(event.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [rawX, rawY]);

  return <motion.div aria-hidden className="pointer-glow" style={{ background }} />;
}
