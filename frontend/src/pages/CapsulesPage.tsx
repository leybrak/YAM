import { useEffect, useState } from "react";
import { createCapsule, fetchCapsules } from "../api/endpoints";
import type { Capsule } from "../api/types";
import { NavBar } from "../components/NavBar";
import { SealedCapsule } from "../components/SealedCapsule";

export function CapsulesPage() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [unlockDate, setUnlockDate] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchCapsules().then(setCapsules);
  }, []);

  async function handleCreate() {
    if (!unlockDate || !title.trim()) return;
    const capsule = await createCapsule({
      unlock_date: unlockDate,
      title: title.trim(),
      content_text: content || undefined,
    });
    setCapsules((prev) => [...prev, capsule].sort((a, b) => a.unlock_date.localeCompare(b.unlock_date)));
    setShowForm(false);
    setTitle("");
    setContent("");
    setUnlockDate("");
  }

  function handleOpened(updated: Capsule) {
    setCapsules((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-hand)" }}>
            Cápsulas del tiempo
          </h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-full text-white text-sm"
            style={{ background: "var(--color-accent)" }}
          >
            + Sellar una
          </button>
        </div>

        {showForm && (
          <div className="polaroid mb-8 flex flex-col gap-3 max-w-sm">
            <input
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <textarea
              placeholder="Tu mensaje..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border rounded px-3 py-2"
              rows={3}
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-full text-white"
              style={{ background: "var(--color-accent)" }}
            >
              Sellar cápsula
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {capsules.map((c) => (
            <SealedCapsule key={c.id} capsule={c} onOpened={handleOpened} />
          ))}
        </div>

        {capsules.length === 0 && !showForm && (
          <p className="text-center mt-16" style={{ color: "var(--color-ink-soft)" }}>
            Todavía no sellaron ninguna cápsula.
          </p>
        )}
      </div>
    </div>
  );
}
