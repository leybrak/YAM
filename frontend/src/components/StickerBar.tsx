import type { StickerType } from "../api/types";

const STICKERS: { type: StickerType; emoji: string; label: string }[] = [
  { type: "heart", emoji: "❤️", label: "Corazón" },
  { type: "coffee", emoji: "☕", label: "Café" },
  { type: "star", emoji: "⭐", label: "Estrella" },
  { type: "pin", emoji: "📌", label: "Chincheta" },
];

export const STICKER_EMOJI: Record<StickerType, string> = Object.fromEntries(
  STICKERS.map((s) => [s.type, s.emoji])
) as Record<StickerType, string>;

export function StickerBar({
  armed,
  onArm,
}: {
  armed: StickerType | null;
  onArm: (type: StickerType | null) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 flex-wrap mb-4 px-3 py-2 rounded-full"
      style={{ background: "#fbf6ec", boxShadow: "0 6px 14px rgba(0,0,0,0.25)" }}
    >
      <span className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
        Stickers:
      </span>
      {STICKERS.map((s) => (
        <button
          key={s.type}
          onClick={() => onArm(armed === s.type ? null : s.type)}
          className="text-lg w-9 h-9 rounded-full flex items-center justify-center transition-transform"
          style={{
            background: armed === s.type ? "var(--color-accent-soft)" : "var(--color-paper-dark)",
            transform: armed === s.type ? "scale(1.15)" : "scale(1)",
          }}
          title={s.label}
          aria-pressed={armed === s.type}
        >
          {s.emoji}
        </button>
      ))}
      {armed && (
        <span className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
          Tocá una foto o la hoja para estamparlo · tocá el sticker para borrarlo
        </span>
      )}
    </div>
  );
}
