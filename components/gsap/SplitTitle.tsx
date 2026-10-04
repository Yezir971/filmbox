"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SplitType from "split-type";
import { useReducedMotion } from "@/lib/gsap/useReducedMotion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface SplitTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4";
  useScrollTrigger?: boolean;
  className?: string;
}

export function SplitTitle({
  children,
  as: Component = "h1",
  useScrollTrigger = false,
  className = "",
  ...props
}: SplitTitleProps) {
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !titleRef.current) return;

      const split = new SplitType(titleRef.current, {
        types: "words,chars",
        tagName: "span",
      });

      if (!split.chars || split.chars.length === 0) return;

      if (useScrollTrigger) {
        gsap.from(split.chars, {
          opacity: 0,
          filter: "blur(10px)",
          y: 8,
          stagger: 0.02,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
            once: true,
          },
        });
      } else {
        gsap.from(split.chars, {
          opacity: 0,
          filter: "blur(10px)",
          y: 8,
          stagger: 0.02,
          duration: 0.5,
          ease: "power2.out",
        });
      }

      return () => {
        split.revert();
      };
    },
    { scope: titleRef, dependencies: [children, reducedMotion, useScrollTrigger] }
  );

  return (
    <Component
      ref={titleRef}
      className={cn(
        "font-display tracking-wide text-foreground select-none",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
