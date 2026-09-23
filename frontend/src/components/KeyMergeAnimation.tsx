import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function KeyMergeAnimation({ onDone }: { onDone: () => void }) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ onComplete: onDone });
    tl.set(leftRef.current, { x: -140, opacity: 0, rotate: -18 })
      .set(rightRef.current, { x: 140, opacity: 0, rotate: 18 })
      .to([leftRef.current, rightRef.current], { opacity: 1, duration: 0.3 })
      .to(leftRef.current, { x: 0, rotate: -6, duration: 0.7, ease: "power3.out" }, "<")
      .to(rightRef.current, { x: 0, rotate: 6, duration: 0.7, ease: "power3.out" }, "<")
      .to(flashRef.current, { opacity: 1, scale: 1.6, duration: 0.25 }, "-=0.15")
      .to(flashRef.current, { opacity: 0, duration: 0.4 })
      .to([leftRef.current, rightRef.current], { scale: 0.9, opacity: 0, duration: 0.4 }, "<");
    return () => {
      tl.kill();
    };
  }, [onDone]);

  return (
    <div className="relative flex items-center justify-center h-40 w-full">
      <div ref={leftRef} className="absolute text-6xl">
        🔑
      </div>
      <div ref={rightRef} className="absolute text-6xl scale-x-[-1]">
        🔑
      </div>
      <div
        ref={flashRef}
        className="absolute h-24 w-24 rounded-full opacity-0"
        style={{ background: "radial-gradient(circle, var(--color-accent-soft), transparent 70%)" }}
      />
    </div>
  );
}
