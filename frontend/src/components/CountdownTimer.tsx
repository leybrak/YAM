import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

function timeLeft(target: string) {
  // Accepts either a plain date ("YYYY-MM-DD", used by capsules) or a full
  // ISO datetime (used by time-sealed entries).
  const targetMs = target.includes("T") ? new Date(target).getTime() : new Date(target + "T00:00:00").getTime();
  const diff = Math.max(0, targetMs - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return { days, hours, minutes };
}

export function CountdownTimer({ unlockDate }: { unlockDate: string }) {
  const [left, setLeft] = useState(() => timeLeft(unlockDate));
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setLeft(timeLeft(unlockDate)), 60_000);
    return () => clearInterval(interval);
  }, [unlockDate]);

  useEffect(() => {
    if (!numRef.current) return;
    gsap.fromTo(numRef.current, { scale: 1.15 }, { scale: 1, duration: 0.3, ease: "power1.out" });
  }, [left.days]);

  return (
    <div className="flex gap-3 justify-center text-center">
      <div>
        <span ref={numRef} className="text-3xl font-mono block">
          {left.days}
        </span>
        <span className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
          días
        </span>
      </div>
      <div>
        <span className="text-3xl font-mono block">{left.hours}</span>
        <span className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
          hs
        </span>
      </div>
      <div>
        <span className="text-3xl font-mono block">{left.minutes}</span>
        <span className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
          min
        </span>
      </div>
    </div>
  );
}
