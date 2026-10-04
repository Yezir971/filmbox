"use client";

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/gsap/useReducedMotion";

gsap.registerPlugin(useGSAP);

interface MagneticPosterProps {
  children: React.ReactNode;
  className?: string;
  maxRotation?: number; // max tilt degrees (default 12)
}

export function MagneticPoster({
  children,
  className = "",
  maxRotation = 12,
}: MagneticPosterProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const xTo = React.useRef<((value: number) => void) | null>(null);
  const yTo = React.useRef<((value: number) => void) | null>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !cardRef.current) return;

      // Set 3D perspective on parent
      gsap.set(cardRef.current, {
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      });

      // Initialize quickTo helpers for 60fps performance
      xTo.current = gsap.quickTo(cardRef.current, "rotationY", {
        duration: 0.4,
        ease: "power3.out",
      });
      yTo.current = gsap.quickTo(cardRef.current, "rotationX", {
        duration: 0.4,
        ease: "power3.out",
      });
    },
    { scope: cardRef, dependencies: [reducedMotion] }
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current || !xTo.current || !yTo.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized from -1 to 1
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    xTo.current(normX * maxRotation);
    yTo.current(-normY * maxRotation);
  };

  const handleMouseLeave = () => {
    if (reducedMotion || !cardRef.current || !xTo.current || !yTo.current) return;
    xTo.current(0);
    yTo.current(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative will-change-transform ${className}`}
      style={{ perspective: 1000 }}
    >
      {children}
    </div>
  );
}
