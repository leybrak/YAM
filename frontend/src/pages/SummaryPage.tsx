import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { fetchAnniversarySummary } from "../api/endpoints";
import type { AnniversarySummary } from "../api/types";
import { NavBar } from "../components/NavBar";
import { PresentationOverlay } from "../components/PresentationOverlay";

export function SummaryPage() {
  const [summary, setSummary] = useState<AnniversarySummary | null>(null);
  const [presenting, setPresenting] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnniversarySummary().then(setSummary);
  }, []);

  useEffect(() => {
    if (!summary || !statsRef.current) return;
    gsap.fromTo(
      statsRef.current.querySelectorAll(".stat-card"),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
    );
  }, [summary]);

  if (!summary) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <p className="text-center mt-16" style={{ color: "var(--color-ink-soft)" }}>
          Cargando...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-hand)" }}>
            Resumen de aniversario
          </h1>
          <button
            onClick={() => setPresenting(true)}
            disabled={summary.highlight_entries.length === 0}
            className="px-5 py-2 rounded-full text-white text-sm disabled:opacity-40"
            style={{ background: "var(--color-accent)" }}
          >
            ▶ Modo presentación
          </button>
        </div>

        <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard value={summary.days_together} label="días juntos" />
          <StatCard value={summary.total_entries} label="páginas" />
          <StatCard value={summary.unlocked_entries} label="reveladas" />
          <StatCard value={summary.total_photos} label="fotos" />
        </div>

        <h2 className="text-lg mb-3" style={{ fontFamily: "var(--font-hand)" }}>
          Momentos favoritos
        </h2>
        {summary.highlight_entries.length === 0 ? (
          <p style={{ color: "var(--color-ink-soft)" }}>
            Todavía no marcaron ninguna entrada revelada como favorita. Marcá alguna con ★ para
            que aparezca acá y en el modo presentación.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {summary.highlight_entries.map((entry, i) => (
              <div
                key={entry.id}
                className="polaroid"
                style={{ transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)` }}
              >
                <div
                  className="w-full h-28 flex items-center justify-center"
                  style={{ background: "var(--color-paper-dark)" }}
                >
                  {entry.my_photos[0] ? (
                    <img src={entry.my_photos[0].url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">★</span>
                  )}
                </div>
                <p className="mt-2 text-center text-sm" style={{ fontFamily: "var(--font-hand)" }}>
                  {entry.title || new Date(entry.entry_date).toLocaleDateString("es-AR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {presenting && <PresentationOverlay summary={summary} onClose={() => setPresenting(false)} />}
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat-card polaroid text-center py-4">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
        {label}
      </p>
    </div>
  );
}
