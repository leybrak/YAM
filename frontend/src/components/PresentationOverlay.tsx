import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import type { AnniversarySummary, Entry } from "../api/types";

type Slide =
  | { kind: "intro"; summary: AnniversarySummary }
  | { kind: "entry"; entry: Entry }
  | { kind: "outro"; summary: AnniversarySummary };

const AUTOPLAY_MS = 5500;

export function PresentationOverlay({
  summary,
  onClose,
}: {
  summary: AnniversarySummary;
  onClose: () => void;
}) {
  const slides = useMemo<Slide[]>(
    () => [
      { kind: "intro", summary },
      ...summary.highlight_entries.map((entry) => ({ kind: "entry" as const, entry })),
      { kind: "outro", summary },
    ],
    [summary]
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  useEffect(() => {
    if (paused) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [paused, slides.length]);

  useEffect(() => {
    if (!slideRef.current) return;
    gsap.fromTo(
      slideRef.current,
      { opacity: 0, y: 24, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" }
    );
    const photos = slideRef.current.querySelectorAll(".presentation-photo");
    gsap.fromTo(
      photos,
      { opacity: 0, y: 16, rotate: 0 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.15 }
    );
  }, [index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        setPaused(true);
        goTo(index + 1);
      }
      if (e.key === "ArrowLeft") {
        setPaused(true);
        goTo(index - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose]);

  const slide = slides[index];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #241a14 0%, #3a2f28 100%)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-6 text-2xl text-white/80 hover:text-white"
        aria-label="Cerrar presentación"
      >
        ✕
      </button>

      <div ref={slideRef} className="w-full max-w-2xl text-center text-white">
        {slide.kind === "intro" && <IntroSlide summary={slide.summary} />}
        {slide.kind === "entry" && <EntrySlide entry={slide.entry} />}
        {slide.kind === "outro" && <OutroSlide summary={slide.summary} />}
      </div>

      <div className="absolute bottom-8 flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setPaused(true);
                goTo(i);
              }}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 20 : 8,
                height: 8,
                background: i === index ? "var(--color-accent-soft)" : "rgba(255,255,255,0.35)",
              }}
              aria-label={`Ir a la diapositiva ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-6 text-white/80 text-2xl">
          <button
            onClick={() => {
              setPaused(true);
              goTo(index - 1);
            }}
            aria-label="Anterior"
          >
            ‹
          </button>
          <button onClick={() => setPaused((p) => !p)} className="text-base" aria-label="Pausar/reanudar">
            {paused ? "▶" : "❚❚"}
          </button>
          <button
            onClick={() => {
              setPaused(true);
              goTo(index + 1);
            }}
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

function IntroSlide({ summary }: { summary: AnniversarySummary }) {
  return (
    <div>
      <p className="text-lg text-white/70 mb-2">Nuestro resumen</p>
      <p className="text-7xl sm:text-8xl mb-4" style={{ fontFamily: "var(--font-hand)" }}>
        {summary.days_together}
      </p>
      <p className="text-2xl mb-10" style={{ fontFamily: "var(--font-hand)" }}>
        días juntos
      </p>
      <div className="flex justify-center gap-8 text-white/80 text-sm">
        <Stat value={summary.total_entries} label="páginas escritas" />
        <Stat value={summary.unlocked_entries} label="reveladas" />
        <Stat value={summary.total_photos} label="fotos" />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold">{value}</p>
      <p>{label}</p>
    </div>
  );
}

function EntrySlide({ entry }: { entry: Entry }) {
  const photos = [...entry.my_photos, ...entry.partner_photos].slice(0, 4);
  return (
    <div>
      <p className="text-sm text-white/60 mb-1">
        {new Date(entry.entry_date).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
      <h2 className="text-3xl mb-6" style={{ fontFamily: "var(--font-hand)" }}>
        {entry.title || "★ Un día favorito"}
      </h2>

      {photos.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {photos.map((p, i) => (
            <img
              key={p.id}
              src={p.url}
              className="presentation-photo w-36 h-36 object-cover rounded shadow-xl"
              style={{ transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)` }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 items-center">
        {entry.my_comment && <Quote text={entry.my_comment.text} />}
        {entry.partner_comment && <Quote text={entry.partner_comment.text} />}
      </div>
    </div>
  );
}

function Quote({ text }: { text: string }) {
  return (
    <p
      className="presentation-photo max-w-md px-4 py-3 rounded"
      style={{ background: "rgba(255,255,255,0.08)", fontFamily: "var(--font-hand)" }}
    >
      “{text}”
    </p>
  );
}

function OutroSlide({ summary }: { summary: AnniversarySummary }) {
  return (
    <div>
      <p className="text-4xl mb-3" style={{ fontFamily: "var(--font-hand)" }}>
        Y seguimos sumando días ♡
      </p>
      <p className="text-white/70">
        {summary.days_together} días, {summary.total_entries} páginas y muchas más por escribir.
      </p>
    </div>
  );
}
