"use client";

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/gsap/useReducedMotion";

gsap.registerPlugin(useGSAP);

interface Particle {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  speedY: number;
  speedX: number;
}

export function SmokingRoomCanvas({
  particleCount = 45,
  className = "",
}: {
  particleCount?: number;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const globalPulse = React.useRef({ opacity: 0.6, beamIntensity: 1 });

  useGSAP(
    () => {
      if (reducedMotion || !containerRef.current) return;

      // Pilot global ambiance parameters via GSAP
      const tween = gsap.to(globalPulse.current, {
        opacity: 0.9,
        beamIntensity: 1.25,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      return () => {
        tween.kill();
      };
    },
    { scope: containerRef, dependencies: [reducedMotion] }
  );

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Initialize dust particles
    const particles: Particle[] = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.6,
      baseAlpha: Math.random() * 0.4 + 0.15,
      alpha: 0.2,
      speedY: -(Math.random() * 0.35 + 0.1),
      speedX: (Math.random() - 0.5) * 0.2,
    }));

    if (reducedMotion) {
      // Draw static particles once without rAF
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(229, 169, 60, ${p.baseAlpha * 0.5})`;
        ctx.fill();
      });
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Light beam gradient from top-center
      const beam = ctx.createRadialGradient(
        width * 0.5,
        0,
        50,
        width * 0.5,
        height * 0.6,
        width * 0.7
      );
      beam.addColorStop(0, `rgba(229, 169, 60, ${0.04 * globalPulse.current.beamIntensity})`);
      beam.addColorStop(0.5, `rgba(200, 140, 40, ${0.015 * globalPulse.current.beamIntensity})`);
      beam.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = beam;
      ctx.fillRect(0, 0, width, height);

      // Render dust motes
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        // Wrap around bounds
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const dynamicAlpha = p.baseAlpha * globalPulse.current.opacity;
        ctx.fillStyle = `rgba(235, 180, 80, ${dynamicAlpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [particleCount, reducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-[-1] overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
