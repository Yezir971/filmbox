"use client";

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/gsap/useReducedMotion";

gsap.registerPlugin(useGSAP);

export function HomeHeroEntrance({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !containerRef.current) return;

      const elements = containerRef.current.querySelectorAll(".hero-animate");
      if (elements.length === 0) return;

      gsap.from(elements, {
        y: 14,
        stagger: 0.06,
        duration: 0.5,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [reducedMotion] }
  );

  return <div ref={containerRef}>{children}</div>;
}
