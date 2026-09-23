import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gsap } from "gsap";
import { addComment, fetchEntries, toggleFavorite, uploadEntryPhoto } from "../api/endpoints";
import type { Entry } from "../api/types";
import { NavBar } from "../components/NavBar";
import { Polaroid } from "../components/Polaroid";
import { PhotoCropModal } from "../components/PhotoCropModal";

export function EntryDetailPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [commentText, setCommentText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const wasUnlocked = useRef(false);

  async function reload() {
    const entries = await fetchEntries();
    const found = entries.find((e) => e.id === entryId) ?? null;
    setEntry(found);
  }

  useEffect(() => {
    reload();
  }, [entryId]);

  useEffect(() => {
    if (entry?.is_unlocked && !wasUnlocked.current && revealRef.current) {
      wasUnlocked.current = true;
      gsap.fromTo(
        revealRef.current,
        { opacity: 0, y: 16, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power2.out" }
      );
    }
  }, [entry?.is_unlocked]);

  if (!entry) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <p className="text-center mt-16" style={{ color: "var(--color-ink-soft)" }}>
          Cargando...
        </p>
      </div>
    );
  }

  async function handleComment() {
    if (!entryId || !commentText.trim()) return;
    const updated = await addComment(entryId, commentText.trim());
    setEntry(updated);
    setCommentText("");
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    if (!entryId) return;
    setPendingFile(null);
    setUploading(true);
    try {
      const cropped = new File([blob], "foto.jpg", { type: "image/jpeg" });
      const updated = await uploadEntryPhoto(entryId, cropped);
      setEntry(updated);
    } finally {
      setUploading(false);
    }
  }

  async function handleFavorite() {
    if (!entryId) return;
    const updated = await toggleFavorite(entryId);
    setEntry(updated);
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <button
          onClick={() => navigate("/album")}
          className="text-sm mb-4"
          style={{ color: "var(--color-ink-soft)" }}
        >
          ← Volver al álbum
        </button>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-hand)" }}>
            {entry.title || new Date(entry.entry_date).toLocaleDateString("es-AR")}
          </h1>
          <button onClick={handleFavorite} className="text-2xl">
            {entry.is_favorite ? "★" : "☆"}
          </button>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
          {new Date(entry.entry_date).toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {entry.location_name && ` · ${entry.location_name}`}
          {entry.weather && ` · ${entry.weather}`}
          {entry.song && ` · 🎵 ${entry.song}`}
        </p>

        <section className="mb-8">
          <h2 className="text-lg mb-2" style={{ fontFamily: "var(--font-hand)" }}>
            Tus fotos de ese día
          </h2>
          <div className="flex flex-wrap gap-4">
            {entry.my_photos.map((p, i) => (
              <Polaroid key={p.id} photo={p} rotate={i % 2 === 0 ? -3 : 3} />
            ))}
            <label
              className="polaroid w-40 h-40 flex items-center justify-center cursor-pointer text-sm text-center"
              style={{ color: "var(--color-ink-soft)" }}
            >
              {uploading ? "Subiendo..." : "+ Agregar foto"}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
            </label>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg mb-2" style={{ fontFamily: "var(--font-hand)" }}>
            ¿Qué fue lo que más te gustó de ese día?
          </h2>
          {entry.my_comment ? (
            <p className="polaroid inline-block max-w-md" style={{ fontFamily: "var(--font-hand)" }}>
              {entry.my_comment.text}
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-w-md">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="border rounded px-3 py-2"
                rows={3}
                placeholder="Escribí tu recuerdo... se revela cuando ambos lo cuenten"
              />
              <button
                onClick={handleComment}
                className="self-start px-4 py-2 rounded-full text-white"
                style={{ background: "var(--color-accent)" }}
              >
                Guardar mi recuerdo
              </button>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg mb-2" style={{ fontFamily: "var(--font-hand)" }}>
            Lo de tu pareja
          </h2>
          {!entry.is_unlocked && !entry.my_comment && (
            <p style={{ color: "var(--color-ink-soft)" }}>
              Se revela apenas dejes tu propio recuerdo.
            </p>
          )}
          {!entry.is_unlocked && entry.my_comment && (
            <p className="animate-pulse" style={{ color: "var(--color-ink-soft)" }}>
              🔒 Esperando a que tu pareja también cuente el suyo...
            </p>
          )}
          {entry.is_unlocked && (
            <div ref={revealRef} className="flex flex-col gap-4">
              {entry.partner_comment && (
                <p className="polaroid inline-block max-w-md" style={{ fontFamily: "var(--font-hand)" }}>
                  {entry.partner_comment.text}
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                {entry.partner_photos.map((p, i) => (
                  <Polaroid key={p.id} photo={p} rotate={i % 2 === 0 ? 3 : -3} />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {pendingFile && (
        <PhotoCropModal
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
