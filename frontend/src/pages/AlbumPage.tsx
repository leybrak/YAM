import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { createEntry, fetchEntries } from "../api/endpoints";
import type { Entry } from "../api/types";
import { NavBar } from "../components/NavBar";
import { organicRotation } from "../components/Polaroid";

export function AlbumPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEntries().then(setEntries);
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll(".entry-card");
    const targetRotation = (i: number) => organicRotation(entries[i]?.id ?? String(i));
    gsap.fromTo(
      cards,
      { y: 30, opacity: 0, rotate: (i: number) => targetRotation(i) - 8 },
      {
        y: 0,
        opacity: 1,
        rotate: (i: number) => targetRotation(i),
        duration: 0.7,
        stagger: 0.08,
        ease: "back.out(1.6)",
      }
    );
  }, [entries]);

  async function handleCreate() {
    const entry = await createEntry({
      entry_date: date,
      title: title || undefined,
      song_url: songUrl.trim() || undefined,
      unlock_at: unlockAt ? new Date(unlockAt).toISOString() : undefined,
    });
    setEntries((prev) => [entry, ...prev]);
    setShowForm(false);
    setTitle("");
    setSongUrl("");
    setUnlockAt("");
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="desk-surface pb-16">
        <div className="max-w-3xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl" style={{ fontFamily: "var(--font-hand)" }}>
            Nuestro cuaderno
          </h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-full text-white text-sm"
            style={{ background: "var(--color-accent)" }}
          >
            + Nuevo día
          </button>
        </div>

        {showForm && (
          <div className="polaroid mb-8 flex flex-col gap-3 max-w-sm">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              placeholder="Título (opcional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              placeholder="🎵 Enlace de canción (opcional)"
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <label className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
              💌 Sellar hasta (opcional): la página queda cerrada, sin fotos ni notas visibles, hasta
              esta fecha y hora
            </label>
            <input
              type="datetime-local"
              value={unlockAt}
              onChange={(e) => setUnlockAt(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-full text-white"
              style={{ background: "var(--color-accent)" }}
            >
              Crear página
            </button>
          </div>
        )}

        <div ref={listRef} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to={`/album/${entry.id}`}
              className="entry-card polaroid block"
              style={{ transform: `rotate(${organicRotation(entry.id)}deg)` }}
            >
              <div
                className="w-full h-40 flex items-center justify-center"
                style={{
                  background: entry.is_time_locked
                    ? "linear-gradient(180deg, #efe0c0, #e3cfa0)"
                    : "var(--color-paper-dark)",
                }}
              >
                {entry.is_time_locked ? (
                  <span className="text-4xl">💌</span>
                ) : entry.my_photos[0] ? (
                  <img src={entry.my_photos[0].url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{entry.is_unlocked ? "📖" : "🔒"}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="font-semibold" style={{ fontFamily: "var(--font-hand)" }}>
                  {entry.title || new Date(entry.entry_date).toLocaleDateString("es-AR")}
                </p>
                <p className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
                  {entry.is_time_locked
                    ? `Sellada hasta ${new Date(entry.unlock_at!).toLocaleDateString("es-AR")}`
                    : entry.is_unlocked
                      ? "Revelado"
                      : "Esperando a ambos..."}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {entries.length === 0 && !showForm && (
          <p className="text-center mt-16 opacity-80">Todavía no hay páginas. Creá la primera.</p>
        )}
        </div>
      </div>
    </div>
  );
}
