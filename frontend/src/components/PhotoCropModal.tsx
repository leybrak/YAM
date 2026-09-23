import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImageBlob } from "../lib/cropImage";

const ASPECTS: { label: string; value: number }[] = [
  { label: "Cuadrada", value: 1 },
  { label: "Foto", value: 4 / 3 },
  { label: "Panorámica", value: 16 / 9 },
];

export function PhotoCropModal({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(ASPECTS[0].value);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Created/revoked together in one effect (not useMemo) so React 19's
  // StrictMode dev double-invoke (mount -> cleanup -> mount) never revokes
  // the URL out from under the still-mounted Cropper.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleConfirm() {
    if (!croppedAreaPixels || !imageSrc) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, rotation);
      onConfirm(blob);
    } catch {
      setError("No se pudo procesar la imagen. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-lg overflow-hidden" style={{ background: "#fffdf9" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-paper-dark)" }}>
          <h2 style={{ fontFamily: "var(--font-hand)" }} className="text-xl">
            Ajustá tu foto
          </h2>
        </div>

        <div className="relative w-full" style={{ height: 320, background: "#1a1410" }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          )}
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {ASPECTS.map((a) => (
              <button
                key={a.label}
                onClick={() => setAspect(a.value)}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  background: aspect === a.value ? "var(--color-accent)" : "var(--color-paper-dark)",
                  color: aspect === a.value ? "white" : "var(--color-ink-soft)",
                }}
              >
                {a.label}
              </button>
            ))}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                className="px-2 py-1 rounded text-sm"
                style={{ background: "var(--color-paper-dark)" }}
                aria-label="Girar a la izquierda"
              >
                ⟲
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="px-2 py-1 rounded text-sm"
                style={{ background: "var(--color-paper-dark)" }}
                aria-label="Girar a la derecha"
              >
                ⟳
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-ink-soft)" }}>
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </label>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-full text-sm"
              style={{ color: "var(--color-ink-soft)" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || !croppedAreaPixels}
              className="px-4 py-2 rounded-full text-white text-sm disabled:opacity-50"
              style={{ background: "var(--color-accent)" }}
            >
              {saving ? "Procesando..." : "Usar esta foto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
