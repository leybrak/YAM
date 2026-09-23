import { useRef, useState } from "react";
import { gsap } from "gsap";

/** A kraft-paper envelope with a wax seal. While `canBreak` is false it's
 * just decorative (shows `countdown` below); once true, clicking the seal
 * or the button plays a GSAP break animation and then calls `onBreak`,
 * which the caller uses to fetch/reveal the real content. */
export function Envelope({
  canBreak,
  onBreak,
  countdown,
}: {
  canBreak: boolean;
  onBreak: () => void | Promise<void>;
  countdown?: React.ReactNode;
}) {
  const [breaking, setBreaking] = useState(false);
  const sealRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);

  function handleBreakSeal() {
    if (breaking || !canBreak) return;
    setBreaking(true);
    gsap
      .timeline({
        onComplete: () => {
          onBreak();
        },
      })
      .to(sealRef.current, { scale: 1.35, duration: 0.2, ease: "power1.out" })
      .to(
        sealRef.current,
        { scale: 0, rotate: 25, opacity: 0, duration: 0.35, ease: "power2.in" },
        "-=0.05"
      )
      .to(
        flapRef.current,
        { rotationX: -140, opacity: 0.3, duration: 0.6, ease: "power2.inOut" },
        "-=0.2"
      );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[220px]" style={{ aspectRatio: "3 / 2", perspective: 600 }}>
        <div
          className="absolute inset-0 rounded-md"
          style={{
            background: "linear-gradient(180deg, #efe0c0, #e3cfa0)",
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        />
        <div
          ref={flapRef}
          className="absolute top-0 left-0 right-0"
          style={{
            height: "55%",
            background: "linear-gradient(180deg, #f2e4c4, #e6d2a8)",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            transformOrigin: "top center",
          }}
        />
        <div
          ref={sealRef}
          onClick={handleBreakSeal}
          className="absolute rounded-full flex items-center justify-center text-lg shadow-lg"
          style={{
            width: 52,
            height: 52,
            left: "50%",
            top: "38%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 35% 30%, #c1553a, #7a2f1d)",
            cursor: canBreak ? "pointer" : "default",
          }}
        >
          💌
        </div>
      </div>

      {canBreak ? (
        <button
          onClick={handleBreakSeal}
          disabled={breaking}
          className="px-4 py-1 rounded-full text-white text-sm disabled:opacity-50"
          style={{ background: "var(--color-accent)" }}
        >
          {breaking ? "Rompiendo el sello..." : "Romper el sello"}
        </button>
      ) : (
        countdown
      )}
    </div>
  );
}
