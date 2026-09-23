import { useRef, useState } from "react";
import { gsap } from "gsap";
import { openCapsule } from "../api/endpoints";
import type { Capsule } from "../api/types";
import { CountdownTimer } from "./CountdownTimer";

export function SealedCapsule({
  capsule,
  onOpened,
}: {
  capsule: Capsule;
  onOpened: (updated: Capsule) => void;
}) {
  const [breaking, setBreaking] = useState(false);
  const [broken, setBroken] = useState(!!capsule.opened_at);
  const sealRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);

  function handleBreakSeal() {
    if (breaking || !capsule.is_open) return;
    setBreaking(true);
    gsap
      .timeline({
        onComplete: async () => {
          setBroken(true);
          onOpened(await openCapsule(capsule.id));
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

  if (broken) {
    return (
      <div className="polaroid">
        <p className="font-semibold mb-1" style={{ fontFamily: "var(--font-hand)" }}>
          {capsule.title}
        </p>
        <p className="text-xs mb-2" style={{ color: "var(--color-ink-soft)" }}>
          Se abrió el {new Date(capsule.unlock_date).toLocaleDateString("es-AR")}
        </p>
        {capsule.content_text && <p>{capsule.content_text}</p>}
        {capsule.photo_url && <img src={capsule.photo_url} className="mt-2 rounded max-w-full" />}
      </div>
    );
  }

  return (
    <div className="polaroid flex flex-col items-center gap-4 py-6">
      <p className="font-semibold" style={{ fontFamily: "var(--font-hand)" }}>
        {capsule.title}
      </p>

      <div
        className="relative w-full max-w-[220px]"
        style={{ aspectRatio: "3 / 2", perspective: 600 }}
      >
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
            cursor: capsule.is_open ? "pointer" : "default",
          }}
        >
          💌
        </div>
      </div>

      {capsule.is_open ? (
        <button
          onClick={handleBreakSeal}
          disabled={breaking}
          className="px-4 py-1 rounded-full text-white text-sm disabled:opacity-50"
          style={{ background: "var(--color-accent)" }}
        >
          {breaking ? "Rompiendo el sello..." : "Romper el sello"}
        </button>
      ) : (
        <CountdownTimer unlockDate={capsule.unlock_date} />
      )}
    </div>
  );
}
