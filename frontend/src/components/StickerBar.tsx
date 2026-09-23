import type { StickerType } from "../api/types";

const STICKERS: { type: StickerType; emoji: string; label: string }[] = [
  { type: "heart", emoji: "❤️", label: "Corazón" },
  { type: "coffee", emoji: "☕", label: "Café" },
  { type: "star", emoji: "⭐", label: "Estrella" },
  { type: "ticket", emoji: "🎫", label: "Ticket" },
];

export function StickerBar({
  armed,
  onArm,
}: {
  armed: StickerType | null;
  onArm: (type: StickerType | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
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
          Tocá una foto para estamparlo · tocá el sticker para borrarlo
        </span>
      )}
    </div>
  );
}
